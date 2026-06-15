# The Architecture Behind a Multi-Agent Claude Code System

Most multi-agent frameworks start with abstractions — agent classes, tool registries, orchestration graphs. We started with a problem: how do you coordinate 6+ AI agents across multiple repos, with a human in the loop, without everything falling apart?

The answer turned out to be a set of patterns that distributed systems solved decades ago.

## Two Planes

ttal splits the world into two planes, borrowed from networking's control plane / data plane separation:

**Manager plane** — persistent agents with long-running sessions, Telegram access, diary, memory. They brainstorm with Neil, make decisions, produce orientation docs. The input layer: what to build, why, where to be careful. Slow, smart, stateful.

**Worker plane** — ephemeral sessions in tmux. Plan writers, reviewers, coders. They spawn, do one job, and die. The output layer: subtasks, annotations, code. Fast, focused, disposable. No Telegram, no memory, no identity beyond the task.

The boundary is strict: managers handle inputs (direction, context, decisions), workers handle outputs (plans, implementation, reviews). This isn't arbitrary — it's the same reason networking separates routing decisions from packet forwarding. The control plane makes smart decisions slowly; the data plane moves traffic fast.

## The Pipeline — Tags as an Append-Only Log

Every task flows through a pipeline. The implementation borrows from event sourcing: stage transitions are monotonic tags that only grow, never shrink.

```
+brainstorm              → agent brainstorms with Neil
+brainstorm_lgtm         → Neil approves direction
+plan                    → fork writes detailed plan
+plan_lgtm               → plan passes review
+implement               → worker codes the solution
+implement_lgtm          → PR passes review, ready to merge
```

Tags are append-only. If `+implement` exists, you know `+plan_lgtm` happened — the tag history is a complete audit trail. This is the same property that makes CRDTs work in collaborative editing: no conflicts, state always converges, any agent can add a tag and the system stays consistent.

Backtracking means adding a new tag (like `+plan_revision`), not removing old ones. The log only grows.

### One Command Drives Everything

`ttal go <uuid>` is the single command that advances any task through its pipeline. Brainstorm done? `ttal go`. Plan ready? `ttal go`. PR merged? `ttal go`. Notifications, approvals, spawns, merges — all through one command.

This maps to the Actor Model: each agent is an independent actor, `ttal go` and `ttal send` are messages, and there's no shared mutable state. Diary entries are append-only — eventually consistent shared knowledge, not mutable state that needs locking.

### Human Gates

Not every transition is automatic. The brainstorm → plan transition is a human gate by default — Neil reviews the orientation doc before parallel work begins. This is configurable per pipeline, but the default reflects a real lesson: let agents run free on execution, but keep a human checkpoint before committing direction.

## Session Forking — Zero-Context-Loss Parallelism

This is where the architecture gets interesting.

The standard approach to agent delegation: summarize context, hand it to a new agent, hope nothing important gets lost. Every handoff is lossy.

ttal's approach: fork the JSONL session file. The fork inherits the full conversation — every decision, every insight, every "actually, let's not do that because..." — with zero loss.

```bash
# Fork brainstorm session into project-specific planning session
cp ~/.claude/projects/<parent>/<session>.jsonl \
   ~/.claude/projects/<target>/<session>.jsonl

cd <target-project> && claude -r <session-id>
```

This is Fork/Join from concurrent programming, applied to agent sessions. Fork context at the decision point, work in parallel, join results when workers deliver PRs.

### The Flow

A typical feature that spans multiple repos:

1. **Brainstorm** — A manager agent explores the problem with Neil in a persistent session. Research, discussion, direction-setting. Output: an orientation doc — short summary of what, why, and what to watch out for.

2. **Human gate** — Neil reviews the orientation doc. Approves, adjusts, or redirects.

3. **Fork** — The session forks into project-specific planning sessions. Each fork carries the full brainstorm context but runs in its target project's directory.

4. **Plan** — Each fork writes a plan scoped to its project. Plans live in flicknote with tree-based structure and section IDs.

5. **Review** — Plan review runs in parallel across all projects. Each plan gets a review leader that spawns 5 specialized subagents (gap finder, code reviewer, test reviewer, security reviewer, docs reviewer).

6. **Implement** — Workers pick up reviewed plans and code. PR review follows the same parallel subagent pattern.

```
Brainstorm with Neil (manager plane)
    │
    ├── ttal go (human gate)
    │
    ├── Fork → ttal-cli
    │   ├── plan (worker plane)
    │   ├── plan review (5 subagents)
    │   ├── implement
    │   └── PR review → merge
    │
    ├── Fork → temenos
    │   ├── plan
    │   ├── plan review (5 subagents)
    │   ├── implement
    │   └── PR review → merge
    │
    └── Fork → organon
        ├── plan
        ├── plan review (5 subagents)
        ├── implement
        └── PR review → merge
```

The OODA loop (Observe → Orient → Decide → Act) maps directly: research → brainstorm → orientation doc → execute. The orientation doc is literally the "Orient" step — establishing shared mental model before committing to action. Session forking accelerates the Act phase by parallelizing it.

### Key insight: forking preserves the "why"

Every plan fork knows the full context of why this change is happening. Not a summary, not a handoff document — the actual conversation where the decision was made. The planner doesn't need to guess intent or reconstruct reasoning. It was there.

## The tmux Model

All worker-plane activity happens in tmux sessions. One session per task, windows rotate as stages advance:

- Plan fork in window 1
- Plan reviewer in window 2
- Coder replaces in window 1
- PR reviewer spawns in window 2

Workers come and go. The session persists until the task completes, then cleanup removes the session, the worktree, and marks the task done.

## What Drives the Design

ttal 2.0 isn't inventing new patterns. It's composing proven distributed systems patterns into an agent coordination framework:

| Pattern | Where it shows up |
|---------|-------------------|
| Control/Data Plane | Manager plane (routing) / Worker plane (execution) |
| Event Sourcing | Monotonic tags as append-only stage log |
| Fork/Join | Session fork → parallel planning → join at merge |
| OODA Loop | Research → Brainstorm → Orient → Execute |
| Actor Model | Independent agents, message passing, no shared mutable state |
| CRDTs (G-Set) | Tags only grow — no conflicts, state always converges |

Each pattern is well-studied independently. The novelty is applying them together to the specific problem of multi-agent software development.

## What We Learned

1. **Separate inputs from outputs.** Direction-setting and execution have different needs — different session lifetimes, different tools, different relationships with the human. Mixing them in one plane creates chaos.

2. **Forks beat handoffs.** Every handoff is lossy. Forking a session preserves full context. The cost is token budget; the benefit is zero-loss context transfer.

3. **One command to rule them all.** `ttal go` handling every pipeline transition means agents don't need to understand the pipeline — they just call `ttal go` and the system figures out what's next.

4. **Tags, not state machines.** Monotonic tags are simpler and more resilient than explicit state transitions. No invalid states, no race conditions, no rollback logic.

5. **Let agents be actors.** Independent agents with message passing and no shared mutable state. It's the same pattern that scales Erlang to millions of processes — it works for 6 agents too.

---

*ttal is open source at [github.com/tta-lab](https://github.com/tta-lab).*