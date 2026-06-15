# Managing 15+ Repos with Claude Code via a Coordination Layer

# How I Manage 15+ Repos with Claude Code (Without Losing My Mind)

Most Claude Code users work in one repo at a time. It's fine until your system spans multiple repos — then you're copy-pasting context between sessions, manually tracking which PR depends on which, and babysitting agents that can't see the full picture.

I manage 15+ repos across Go, Rust, TypeScript, Python, and C++. 10 specialized Claude Code agents coordinate through Telegram. Here's what I tried first, why it didn't work, and what does.

## What Doesn't Work

All of these approaches try to solve "how do I give one session access to multiple repos." But that's the wrong framing. When you need cross-repo context, what you actually need is cross-repo **read and explore**. The write should always be focused on a single repo, a single PR. ttal handles this by separating the two: `ttal ask` reads and explores anything, workers write to one repo at a time.

**Monorepo.** I use Moon for monorepo management — I'm not anti-monorepo. But when your stack spans Go, Rust, TypeScript, Python, and C++, a single repo doesn't cut it. Each language has its own build tooling, CI pipelines, and dependency management. Cramming them together creates more problems than it solves. Even with Moon handling the orchestration, past 3-4 languages, splitting is cleaner. This isn't a theoretical concern — [it's a real gap in the CC ecosystem](https://github.com/anthropics/claude-code/issues/23627) that people are hitting.

**Submodules.** Even if you link repos together with submodules, you still don't get what you actually need: cross-repo coordination, shared context, parallel execution. Submodules give you a way to pin repo versions together — they don't give you a way to plan across repos, route tasks, or run parallel agents. And they don't compose well with worktrees, which are essential for parallel agent work. It's solving the wrong problem.

**CC's native cross-repo workflow.** Want to explore another repo? You manually `/add-dir`, then that session starts reading in that directory. It works, but it's manual and the session context pays the cost. In ttal, all exploration is handled by `ttal ask` — a lightweight bash-only agent that collects info from any source (`--web`, `--repo`, `--project`) and returns a detailed report without polluting your main session's context. And because `ttal ask` runs on a simple bash-based agent loop, you can use any fast, cheap model (MiniMax M2.7 HighSpeed) for exploration — so Opus stays focused on the thinking work that actually needs it.

**Single-session cross-repo orchestration.** This is the trap most people fall into. You give one CC session access to all your repos and ask it to plan and implement a cross-repo feature. The context window fills up fast, the agent loses track of which repo it's in, and the quality of both planning and execution suffers. Don't try to make one session do orchestration, planning, and execution across repos. Let manager agents hold the big picture. Once the plan is done, let workers handle execution detail — one repo, one task, one worktree.

## What Works: A Coordination Layer

The answer wasn't a better monorepo or a smarter IDE. It was a thin coordination layer on top of Claude Code.

[ttal](https://github.com/tta-lab/ttal-cli) is a single binary. Install it, define your projects in a TOML file, and you have a system that routes tasks to the right repo, the right agent, at the right time.

Two planes:

**Worker plane** — ephemeral CC sessions that plan, review, and implement. Each gets its own git worktree, sandboxed environment, and tmux session. Spin up, do the work, merge, clean up. No babysitting.

**Manager plane** — persistent agents that live across sessions. They hold the big picture — what features they designed with you, which tasks are done or blocked, what shipped yesterday. The manager never touches code. The worker never worries about the big picture.

**Message bridge** — the glue between everything. Human ↔ agent via Telegram. Agent ↔ agent via `ttal send`. Manager ↔ worker via `ttal alert` (workers notify their spawner automatically). CI status, PR reviews, task updates — all routed through the same daemon. You talk to your agents like coworkers in a chat app.

I wrote about the philosophy in [ttal — More Than a Harness Engineering Framework](https://dev.to/neil_agentic/ttal-more-than-a-harness-engineering-framework-2pbn), the tooling in [We Replaced Every Tool Claude Code Ships With](https://dev.to/neil_agentic/we-replaced-every-tool-claude-code-ships-with-522j), and the memory model in [How We Manage Memory and Sessions](https://dev.to/neil_agentic/how-we-manage-memory-and-sessions-in-a-multi-agent-claude-code-system-2a9k).

## Daily Workflow

I open Telegram. 10 agent chats in a folder.

A typical morning:

1. Tell Yuki (orchestrator) what I want to build today
2. She breaks it into tasks, routes them to the right pipeline
3. \`ttal go\` advances each task — spawning planners, reviewers, coders in parallel
4. Workers run in isolated worktrees across whichever repos need changes
5. PR reviews happen automatically — parallel sub-reviewers check security, tests, types, edge cases separately
6. I review verdicts, approve, \`ttal go\` merges and cleans up

Cross-repo features just work. A change that touches ttal-cli, temenos, and organon gets three parallel workers, each in their own worktree, each with context about why the change exists.

## Under the Hood

- **Unix philosophy** — task management via Taskwarrior, knowledge via FlickNote, editing via tree-sitter. Compose dedicated tools, don't bundle into a platform.
- **Sandbox auto-config** — specialized roles mean known paths. The multi-repo project registry means sandbox config writes itself. No manual permission prompts.
- **Pipeline-driven** — tag-based pipelines borrowed from event sourcing. One command (`ttal go`) drives every transition. Human gates where they matter.
- **Built-in quality control** — parallel sub-reviewers focus on different aspects (security, tests, silent failures, type design). By the time a PR reaches you, it's been through plan review, code review, and CI.
- **Session forking** — brainstorm figures out *what* and *why*, then the session forks. Each fork inherits the full conversation and writes a plan scoped to its target repo. No summarization, no lossy handoff. Plan forks figure out the *how*, workers carry all of it into implementation.

## The Numbers

Last week: 190+ tasks completed across all repos. In ttal, each task is a PR — planned, reviewed, implemented, merged. One person, 10 agents.

Throughput scales because coordination is automated. I don't track which session is doing what. I track tasks.

## Getting Started

```bash
brew tap tta-lab/ttal
brew install ttal
ttal doctor --fix
```

Define your projects:

```toml
# ~/.config/ttal/projects.toml
[backend]
name = "Backend API"
path = "/code/backend"

[frontend]
name = "Frontend App"
path = "/code/frontend"

[infra]
name = "Infrastructure"
path = "/code/infra"
```

Route a task:

```bash
ttal task add --project backend "add rate limiting middleware" --tag feature && ttal go
```

The pipeline figures out the rest.

---

Multi-repo at scale with Claude Code isn't about getting CC to understand all your repos at once. It's about a coordination layer that routes work to the right repo, the right agent, at the right time.

*ttal, organon, and temenos are open source at [github.com/tta-lab](https://github.com/tta-lab).*