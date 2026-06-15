# Configuring Claude Code's sandbox — what the docs don't tell you

Claude Code ships with an OS-level sandbox (Seatbelt on macOS, bubblewrap on Linux) that most people either leave on defaults or disable entirely. Both are mistakes. The defaults read everywhere and write to your CWD only. Disabling it lets an LLM `curl` whatever it wants from your machine.

Here's what I learned configuring it for a 10-agent, 15-repo setup.

## The two-layer problem

The sandbox only covers the Bash tool and its child processes. CC's built-in Read/Edit/Write tools bypass the sandbox entirely — they use the `permissions` system instead. So if you want to protect `~/.ssh/id_ed25519`, you need to block it in *both* layers:

```json
{
  "sandbox": {
    "filesystem": {
      "denyRead": ["~/.config/ttal/.env"]
    }
  },
  "permissions": {
    "deny": [
      "Read(~/.config/ttal/.env)",
      "Read(~/.ssh/id_ed25519)"
    ]
  }
}
```

Miss the permissions layer and `cat ~/.ssh/id_ed25519` is blocked but the Read tool happily serves it up.

## Scope hierarchy

Settings merge across five scopes (highest precedence first):

1. Managed (IT-deployed, can't override)
2. Command line args
3. Local (`.claude/settings.local.json` — gitignored)
4. Project (`.claude/settings.json` — committed)
5. User (`~/.claude/settings.json`)

The key insight: `allowWrite`, `denyWrite`, `denyRead`, `allowRead` arrays are **merged, not replaced**. A base user config + per-project additions work naturally. You don't need to duplicate your entire config per project.

## What to actually configure

Filesystem — be explicit about what the agent can write outside CWD:

```json
"filesystem": {
  "allowRead": [
    ".",
    "~/.config/ttal",
    "~/.config/git",
    "~/.gitconfig",
    "~/.cargo/registry",
    "~/.rustup",
    "/Library/Developer/CommandLineTools"
  ],
  "allowWrite": [
    "~/.cache/go/build",
    "~/.cache/golangci-lint",
    "~/.cargo/registry",
    "~/.npm/_logs",
    "/private/var/folders",
    "/tmp"
  ]
}
```

Build caches, package registries, temp dirs — these are the paths tools like `go build`, `cargo`, and `npm` need. Without them, your agent errors out on basic compilation.

Network — allowlist the domains your toolchain needs:

```json
"network": {
  "allowedDomains": [
    "github.com", "*.github.com",
    "proxy.golang.org", "sum.golang.org",
    "crates.io", "*.crates.io",
    "registry.npmjs.org",
    "pypi.org", "files.pythonhosted.org"
  ],
  "allowUnixSockets": [
    "/private/tmp/tmux-501/default"
  ]
}
```

Everything not on the list is blocked. This means a prompt injection can't exfiltrate your code to an arbitrary server.

## Unix sockets matter

If your agent talks to a local daemon (mine talks to a coordination daemon over a Unix socket), you need to explicitly allowlist the socket path. This is easy to miss — the error message isn't obvious.

## The gotcha with git worktrees

On macOS, git worktrees use a `.git` *file* that points back to the main repo's `.git` directory. The sandbox doesn't follow symlinks/references by default, so worktree-spawned agents need `allowWrite` entries for the main repo's `.git` path. On Linux with bubblewrap, worktrees are currently broken due to a CC bug with how bwrap handles `.git` files.

## autoAllowBashIfSandboxed

Set this to `true`. With the sandbox enforcing OS-level restrictions, there's no reason to also prompt for permission on every bash command. The sandbox *is* the permission system for bash. Without this, you'll be clicking "allow" hundreds of times per session.

```json
{
  "sandbox": {
    "enabled": true,
    "autoAllowBashIfSandboxed": true,
    "allowUnsandboxedCommands": false,
    "failIfUnavailable": true
  }
}
```

`failIfUnavailable: true` means if the sandbox can't initialize, CC won't start. You don't want to silently fall back to unsandboxed mode.

`allowUnsandboxedCommands: false` disables the escape hatch where CC retries a failed sandboxed command without the sandbox. Turn this off.

## Generate, don't hand-write

I ended up building a config generator (`ttal sync`) that reads a project registry and outputs the full `settings.json`. For 15+ repos, hand-maintaining allowWrite paths for each project's `.git` directory isn't sustainable. The generator also handles the permissions.deny layer for secrets, network allowlists, and per-project overrides.

If you're running more than a few projects, automate the config. The settings.json format is stable and well-defined — it's just JSON.