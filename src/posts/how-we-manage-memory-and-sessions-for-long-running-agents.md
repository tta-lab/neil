# How We Manage Memory and Sessions in a Multi-Agent Claude Code System

Claude Code sessions are disposable by default. Context window fills up, you start fresh, everything's gone. For a single developer this is annoying. For a multi-agent system where agents have roles, history, and ongoing work — it's a dealbreaker.

This post covers how we handle memory, session handoff, and cross-project forking in ttal.

## The Problem: Sessions Are Ephemeral, Agents Need Continuity

Claude Code gives you a context window and markdown files. That's it for memory. When the window fills up, you either `/compact` (lossy summarization you don't control) or start over.

For a multi-agent team, this means:

- Agents forget what they learned last session
- No shared memory between agents working on the same problem
- Plans written in one session vanish in the next
- An agent working across multiple projects can't carry context between them

We needed agents that remember, hand off cleanly, and can fork their context into new workstreams.

## Layer 1: Persistent Memory — diary-cli + flicknote

Every agent gets two memory systems:

**diary-cli** is a per-agent append-only diary. After each session, agents write what they learned, what decisions they made, what worked and what didn't.

```bash
diary kestrel append "Discovered that the forgejo API returns 422 when..."
diary kestrel read          # today's entries
diary kestrel read --yesterday
```

It's an append-only log — agents can't edit or delete past entries. This is intentional. Memory should accumulate, not get rewritten.

**flicknote** is for structured, editable knowledge. Plans, research notes, drafts — anything that needs sections, revisions, and collaboration between agents.

```bash
flicknote get <id> --tree
├── [aB] ## Context
├── [cD] ## Architecture  
└── [eF] ## Open Questions

# Another agent adds findings to a specific section
echo "New finding..." | flicknote append <id> --section cD
```

diary is what an agent knows. flicknote is what the team knows.

## Layer 2: Session Handoff — /auto-breathe

When a context window gets heavy, the standard approach is `/auto-compact` — Claude Code summarizes the conversation and continues. The problem: you don't control what gets kept and what gets lost. Important decisions, subtle context, task state — all at the mercy of generic summarization.

`/auto-breathe` flips this. Instead of the runtime summarizing your session, the agent writes its own handoff:

```bash
cat <<'HANDOFF' | ttal breathe
# Session Handoff

## Active Task
85e63ce0 — implement sandbox allowlist for temenos

## What Was Done
- Added allowlist parsing in config.go
- Tests passing for basic paths

## Key Decisions
- Using glob patterns, not regex — simpler for users
- Denied paths take precedence over allowed paths

## Next Steps
1. Add integration test for nested paths
2. Update CLI help text
HANDOFF
```

What happens next:

1. The daemon saves the handoff to the agent's diary
2. Reads back today's full diary (this handoff + any earlier ones)
3. Writes a synthetic JSONL session with the handoff as the first message
4. Kills the old session, spawns a fresh one with `--resume`
5. The agent wakes up in a clean context window with its own handoff as context

The agent controls what's preserved. No lossy summarization. And because the handoff goes to diary, it persists — even if the next session also breathes, all handoffs accumulate.

In practice, `/auto-breathe` fires automatically when context gets heavy. The agent doesn't need to decide when — it just writes a good handoff when triggered.

## Layer 3: Cross-Project Session Forking

This is where it gets interesting.

A common pattern: you're brainstorming something that spans multiple projects. Maybe you're planning a feature that touches the CLI, the sandbox, and the web app. You start in one session, thinking broadly. Then you need to fork — create separate workstreams for each project, each with the brainstorming context but scoped to their own codebase.

Claude Code's native `/branch` works within a single repo. Cross-project forking — taking a conversation from one project and continuing it in another — isn't supported natively.

We solved this with raw JSONL session copying:

```bash
# Fork a brainstorming session into a project-specific planning session
cp ~/.claude/projects/<parent-slug>/<session>.jsonl \
   ~/.claude/projects/<target-slug>/<session>.jsonl

# Launch in the target project
cd <target-project-path> && claude -r <session-id>
```

The forked session carries the full parent context — all the brainstorming, decisions, and direction — but now runs in the target project's directory with access to that project's codebase.

### The Brainstorm → Fork → Plan → Review Pattern

Here's how this plays out in practice:

1. **Brainstorm** — An orchestrator session explores a broad problem. "We need to rethink how auth works across all three services." The agent researches, discusses with the human, builds understanding.

2. **Fork** — When the direction is clear, the session forks into project-specific sessions. Each fork carries the brainstorming context but lands in its own project directory.

3. **Plan** — Each forked session writes a detailed plan into flicknote, scoped to its project. The plan has tree-based structure with section IDs.

4. **Review** — Plan review happens in parallel. Each project's plan gets reviewed by a plan-review-leader that spawns 5 specialized subagents (gap finder, code reviewer, test reviewer, security reviewer, docs reviewer). All projects reviewed simultaneously.

```
Brainstorm (single session)
    ├── Fork → ttal-cli plan
    │       └── Plan review (5 subagents in parallel)
    ├── Fork → temenos plan  
    │       └── Plan review (5 subagents in parallel)
    └── Fork → organon plan
            └── Plan review (5 subagents in parallel)
```

The key insight: forking preserves the "why" while scoping the "what." Each project plan knows the full context of why this change is happening, but only needs to deal with its own codebase.

### Tasks as Trees — Subtasks as Plans

In ttal 2.0, tasks are trees. A parent task is the goal, subtasks are the plan. Workers and planners don't spawn at the task level — they spawn under subtasks.

```
Task: rethink auth across services
    ├── Subtask: ttal-cli auth refactor
    │       ├── planner fork (writes plan)
    │       └── worker (implements plan)
    ├── Subtask: temenos token refresh
    │       ├── planner fork (writes plan)
    │       └── worker (implements plan)
    └── Subtask: organon auth passthrough
            ├── planner fork (writes plan)
            └── worker (implements plan)
```

The subtask tree *is* the plan. No separate plan document that drifts from the task structure — the task hierarchy itself represents the breakdown. A planner fork creates subtasks, a worker picks one up and executes. When a subtask completes, the parent task sees progress directly.

This unifies planning and execution into the same structure. The brainstorm creates the parent task, forking creates subtasks, and each subtask is a self-contained unit with its own planner and worker.

## How It All Connects

```
┌──────────────────────────────────────────────┐
│  flicknote          shared structured memory │
│                     plans, research, drafts   │
├──────────────────────────────────────────────┤
│  diary-cli          per-agent memory         │
│                     handoffs, learnings       │
├──────────────────────────────────────────────┤
│  /auto-breathe      session handoff          │
│                     agent-controlled restart  │
├──────────────────────────────────────────────┤
│  JSONL forking      cross-project context    │
│                     brainstorm → plan → review│
└──────────────────────────────────────────────┘
```

Each layer solves a different problem:
- **diary** — what does this agent know?
- **flicknote** — what does the team know?
- **breathe** — how does an agent survive a context reset?
- **fork** — how does context travel across projects?

## What We Learned

Memory isn't one thing. It's at least four:

1. **Agent memory** — personal, append-only, accumulates over time (diary)
2. **Team memory** — shared, structured, editable (flicknote)
3. **Session continuity** — surviving context resets without losing state (breathe)
4. **Context mobility** — moving understanding across project boundaries (fork)

Claude Code's default gives you none of these. `/auto-compact` is a blunt instrument — it summarizes everything generically when what you actually need is agent-controlled handoff. Markdown files are flat and unstructured when what you need is tree-based sections with IDs that agents can target.

The biggest insight: **let the agent decide what to remember.** Generic summarization throws away exactly the context that matters most — the subtle decisions, the "why not" reasoning, the gotchas discovered through trial and error. When the agent writes its own handoff, it preserves what it knows is important.

---

*ttal is open source at [github.com/tta-lab](https://github.com/tta-lab). diary-cli and flicknote are part of the ttal ecosystem.*