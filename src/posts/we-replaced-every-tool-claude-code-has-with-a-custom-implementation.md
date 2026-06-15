# We Replaced Every Tool Claude Code Ships With

## The Problem: Claude Code's Tools Don't Scale

Claude Code ships with a reasonable set of built-in tools: Bash, Read, Write, Edit, Glob, Grep, WebFetch, Task, Plan. For a single agent working on a single task, they're fine.

But once you're running a multi-agent system — reviewers spawning sub-reviewers, plans flowing through design-review-implement pipelines — the defaults start breaking:

- **No cross-repo exploration.** Want an agent to read another project's code? You need to manually configure permissions. There's no "go explore this OSS repo and answer my question."
- **Summarized web fetching.** `WebFetch` is actually a subagent that summarizes a single page into a haiku-length response. You can't trace links, browse referenced pages, or explore documentation in depth. And it fetches fresh every time — no caching.
- **Text-level editing.** The `Edit` tool has fuzzy matching, which helps — but it's still operating on raw text. When tree-sitter can give you an AST with named symbols, why make the model reproduce strings to target a function? Structure-aware editing is just a better primitive.
- **Ephemeral tasks and plans.** The `Task` tool creates tasks that don't persist outside the session. The `Plan` tool writes plans that vanish when the context window resets. Neither supports multi-round review or structured editing.
- **No isolation.** Bash runs on your host. No sandboxing, no filesystem allowlists. You either yolo and take the risk, or do annoying permission work for every project and agent.

These aren't edge cases. They're the first things you hit when you try to build something real on top of Claude Code. Here's what we built instead.

## What We Replaced — and Why

### 1. Explore/Search → ttal ask (Multi-Mode Research)

Claude Code's `WebFetch` is actually a subagent that summarizes a single web page — often into a few sentences. You can't follow links, browse related pages, or dig into documentation. And it fetches fresh every time — no caching.

There's also no built-in way to explore external codebases without manually configuring project permissions.

`ttal ask` is a multi-mode research tool that spawns a sandboxed agent tailored to the source. Under the hood, it runs on **logos** — a pure-bash agent loop with no tool-calling protocol. The agent reasons in plain text and acts via `$ ` prefixed shell commands. No JSON schemas, no structured tool calls. This means it works with **any LLM provider** — you can use a cheaper model (Gemini, GPT-4o-mini, DeepSeek, whatever) for exploration work instead of burning Sonnet/Opus tokens on reading docs.

**`--url`** fetches the page, caches the clean markdown locally (1-day TTL), and lets the agent browse. Unlike WebFetch's single-page summary, the agent can follow referenced links, trace documentation across pages, and build a complete picture before answering. Subsequent questions about the same URL hit the cache instead of re-fetching.

```bash
ttal ask "what authentication methods are supported?" --url https://docs.example.com/api
# Agent reads the page, follows links to auth docs, reads those too — all cached locally
```

**`--repo`** auto-clones (or pulls) an open source repo, then spawns an agent with read access to explore it. No manual setup, no permission configuration — just ask a question about any public repo.

```bash
ttal ask "how does the routing system work?" --repo woodpecker-ci/woodpecker
# Clones/updates the repo, spawns agent with src to explore the codebase
```

**`--project`** spawns a subagent in the right directory with the right sandbox allowlist — read-only access to that project's path, nothing else. You don't need to configure CC's permissions just to let an agent read another project in your workspace.

```bash
ttal ask "how does the daemon handle messages?" --project ttal-cli
# Agent gets read-only sandbox access to the project path, explores with src/grep
```

**`--web`** searches the web and reads results — straightforward replacement for WebSearch.

Each mode gets the right organon tools (`src` for code, `url` for web pages, `search` for web search), the right sandbox permissions, and a tailored system prompt. The agent explores, reasons, and returns a structured answer.

### 2. Read/Write/Edit → Organon (Structure-Aware Primitives)

Claude Code's `Edit` tool does have fuzzy matching — it's not as brittle as pure exact-match. But it's still fundamentally text-level: you provide `old_string` and `new_string`, and the model has to reproduce enough of the surrounding code to target the right spot. When tree-sitter can parse a file into an AST and give you named, addressable symbols — functions, structs, methods — text matching is just a worse primitive.

**Organon** replaces text-level tools with three structure-aware CLI primitives:

**`src`** — Source file reading and editing by symbol, not text:

```bash
# See the structure
$ src main.go --tree
├── [aB] func main()           L1-L15
├── [cD] func handleRequest()  L17-L45
└── [eF] type Config struct    L47-L60

# Read a specific symbol
$ src main.go -s cD

# Replace it — pipe new code via stdin
$ src replace main.go -s cD <<'EOF_INNER'
func handleRequest(w http.ResponseWriter, r *http.Request) {
    // new implementation
}
EOF_INNER

# Insert after a symbol
$ src insert main.go --after aB <<'EOF_INNER'
func init() {
    log.SetFlags(0)
}
EOF_INNER
```

Tree-sitter parses the file into an AST. Each symbol gets a 2-character base62 ID. The model sees the tree, picks an ID, pipes new code through a heredoc. **No text matching. No reproducing old code. No whitespace bugs.**

Works for any language with a tree-sitter grammar — Go, TypeScript, Rust, Python, TOML, YAML, you name it.

**`url`** — Web page reading with heading-based structure:

```bash
$ url https://docs.example.com --tree
├── [aK] ## Getting Started
├── [bM] ## API Reference
└── [cP] ## Configuration

$ url https://docs.example.com -s bM
```

Same `--tree` / `-s` pattern as `src`. Navigate web pages by structure, not by scrolling through raw HTML dumps.

**`search`** — Web search returning clean text results:

```bash
$ search "golang tree-sitter bindings"
```

Three primitives. All stateless — no daemon, no config. Parse, act, exit. All use the same structural pattern: tree view with IDs, target by ID, pipe content via stdin.

### 3. Task Management → Taskwarrior (External Persistence)

Claude Code's `Task` tool creates tasks that live inside the session. They don't persist to any external system. Close the session, tasks are gone. There's no dependency tracking, no pipeline stages, no way for other agents to see what's in progress.

ttal integrates with **taskwarrior** — tasks persist externally with projects, tags, priorities, dependencies, and custom attributes for pipeline stages:

```bash
ttal task add --project ttal "implement sandbox allowlist" --priority H
ttal task advance <uuid>    # design → review → implement → PR → merge
ttal task find "sandbox"    # any agent can find and pick up tasks
```

Tasks survive session boundaries. An orchestrator creates a task, a designer picks it up, a reviewer critiques the plan, a worker implements it — all in different sessions, all referencing the same persistent task. That's not possible when tasks only exist in a context window.

### 4. Plan Mode → Persistent Plans with Tree-Based Editing and Multi-Round Review

Claude Code's `Plan` tool writes plans that live in the context window. When the session ends, the plan is gone. There's no way to review a plan across multiple rounds, no structured editing, no audit trail. For simple tasks this is fine. For anything that needs design iteration — where a plan gets written, reviewed by specialists, revised, reviewed again — it falls apart.

ttal stores plans in **flicknote**, which gives them persistence and tree-based structure:

```bash
flicknote get <id> --tree
├── [aB] ## Context
├── [cD] ## Architecture
├── [eF] ## Implementation Steps
└── [gH] ## Test Strategy
```

Each section gets an ID. Reviewers can target specific sections — replace the architecture, append to the test strategy, remove a step — without rewriting the whole document. The plan persists across sessions, so multi-round review is natural.

The review itself uses a **plan-review-leader** that spawns 5 specialized subagents in parallel:
- Gap finder — ambiguities, missing pieces
- Code reviewer — wrong assumptions, logic errors
- Test reviewer — coverage gaps, edge cases
- Security reviewer — auth, injection, secrets
- Docs reviewer — alignment with existing docs

Each subagent reviews their aspect and posts findings. The leader synthesizes: LGTM or NEEDS_WORK. If NEEDS_WORK, the plan goes back for revision — and because it's in flicknote, the revisions are surgical edits to specific sections, not a full rewrite.

### 5. Memory → diary-cli + flicknote (Structured, Persistent, Per-Agent)

Claude Code has no external memory system beyond markdown files, so sharing memory across projects or agents is painful.

ttal agents get two memory systems:

- **diary-cli** — per-agent append-only diary. Agents reflect on what they learned, what worked, what didn't. `diary lyra append "..."` / `diary lyra read`
- **flicknote** — structured notes with heading-based sections, section IDs, replace/append/insert operations. Plans, drafts, research — all persistent across sessions.

Both are CLI tools. No special protocol. Agents use them via shell commands, same as everything else.

There's also `/auto-breathe` — when a session ends, the agent writes a handoff prompt to its diary. The next session auto-loads it. Much faster than native `/auto-compact` because the agent controls what's preserved instead of relying on generic summarization.

### 6. Agent Tool → tmux Spawn (Isolated Sessions)

Claude Code's `Agent` tool spawns a sub-agent in the same process. It can't nest — an agent spawned by `Agent` can't spawn its own sub-agents. This kills the orchestrator pattern:

> A plan-review-leader needs to spawn 5 specialized reviewers (test design, security, docs, gaps, code logic) in parallel. With Claude Code's Agent tool, the leader can't spawn sub-reviewers. One level of delegation, period.

ttal replaces this with **tmux sessions**. Each worker gets its own isolated tmux session with its own Claude Code instance. ttal manages the lifecycle externally — spawn, monitor, close. Because delegation happens outside CC's process, there's no nesting limit. An orchestrator can spawn workers that spawn reviewers that spawn sub-reviewers.

### 7. Bash → Temenos (Sandboxed Execution)

Claude Code's Bash tool runs commands on your host machine. There's a permission prompt, but no real isolation. No filesystem allowlists, no resource limits. Every command has full access to everything your user account can touch.

**Temenos** is an OS-native sandbox. No Docker, no containers — just the kernel's own mechanisms:
- macOS: `seatbelt-exec` (the same sandbox tech macOS uses for App Store apps)
- Linux: `bwrap` (bubblewrap, used by Flatpak)

You give it a command and an allowlist of filesystem paths. It runs the command in a sandbox and returns stdout/stderr/exit code. An agent exploring a repo gets read-only access to that repo's directory — nothing else. A worker implementing a feature gets write access to its own workspace — nothing else.

Next on the roadmap: temenos as an **MCP server**, exposing a single `mcp__temenos_bash` tool that supports running multiple commands concurrently. Claude Code's Bash tool executes one command at a time — read a file, wait, run a check, wait, read another file, wait. With the MCP integration, an agent will be able to fire off all three in one call. Fewer round-trips, faster iteration. This is currently under active development.

## The Design Philosophy

Three principles run through all of this:

**1. Structure-aware, not text-aware.** Files have symbols. Web pages have headings. Notes have sections. Every tool in the stack understands structure and lets you target by ID, not by reproducing text.

**2. Isolation by default.** Workers get sandboxes and worktrees. Not because we don't trust them — because parallel execution requires it. You can't have two workers editing the same files.

**3. CLI-native.** Every tool is a stateless CLI command. No daemons (except temenos for sandboxing), no config files, no sessions. Agents use them the same way humans would — through the shell.

## The Stack

```
┌─────────────────────────────────────────┐
│  ttal         orchestration layer       │
│               tasks, workers, pipeline  │
├─────────────────────────────────────────┤
│  organon      instruments              │
│               src, url, search          │
├─────────────────────────────────────────┤
│  temenos      sandbox + MCP server      │
│               seatbelt/bwrap isolation  │
│               mcp__temenos_bash         │
└─────────────────────────────────────────┘
```

Each layer does one thing. Temenos isolates and executes. Organon perceives and edits. ttal orchestrates. No layer knows about the layers above it.

## What We Learned

Building replacements for Claude Code's built-in tools wasn't the plan. We started with Claude Code's defaults and hit limits. Each replacement emerged from a specific pain point:

- Text-matching edits kept failing → build symbol-targeted editing
- Workers stepping on each other → build proper sandboxing
- No persistent memory → build diary + flicknote
- Single-level agent delegation → build tmux-based spawning
- No workflow engine → build task pipeline with taskwarrior

The result is a stack where AI agents interact with code and the web through structure-aware CLI tools, isolated in sandboxes, orchestrated by a system that understands tasks and pipelines. Claude Code is still the runtime — we just replaced the tools it ships with.

---

*ttal, organon, and temenos are open source at [github.com/tta-lab](https://github.com/tta-lab).*