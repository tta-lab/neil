# Why Every AI Agent Is Playing a Turn-Based Game (They Just Won't Admit It)

*Draft for Lobsters / dev.to / HN*

---

Every major AI agent framework — OpenAI's function calling, Anthropic's tool use, LangChain, CrewAI — follows the same loop:

```
Model thinks → Model acts → World responds → Repeat
```

That's a turn-based game. Pokémon, not StarCraft.

Yet the industry keeps wrapping this simple loop in layers of ceremony: JSON schemas, tool registration APIs, parallel function calls, streaming tool results. It's like adding AR overlays to a chess board. The game underneath hasn't changed.

We built [logos](https://github.com/tta-lab/logos), an agent runtime that embraces the turn-based nature instead of disguising it. One signal. Zero ceremony. And it works better than you'd expect.

## When Does a Model Stop Talking?

Before we get to agent loops, a fundamental question: how does an LLM know when to stop generating tokens?

Three mechanisms:

1. **EOS token** — a special token in the vocabulary (e.g. `<|endoftext|>`, `<|end_turn|>`). The model *learns* when to produce it during training. It predicts "stop" the same way it predicts any other word.

2. **max_tokens** — a hard cutoff from the caller. Brute force.

3. **stop sequences** — caller-defined strings that trigger an early halt.

The key insight: EOS tokens are *atomic*. They look like text (`<|end_turn|>`) but are single tokens with their own vocabulary IDs. You can type the characters in a prompt and nothing happens — the tokenizer splits them into regular text tokens. The real EOS can only come from the model's sampling process.

This matters because tool calling uses the exact same mechanism.

## Tool Calling Is Just Another Special Token

Models that support "native" tool calling (GPT, Claude, Mistral) have special tokens baked into their tokenizer:

- Mistral: `[TOOL_CALLS]`
- DeepSeek: `<｜tool▁call▁begin｜>` / `<｜tool▁call▁end｜>`
- Llama 3: `<|python_tag|>`

When the model predicts one of these tokens, the serving layer intercepts it, parses the structured output, executes tools, and injects results back into the context. The model then continues generating.

This creates **two stop signals**:

```
finish_reason: "tool_calls"  →  "Pause. Execute these tools."
finish_reason: "stop"        →  "I'm done."
```

Two signals means two things can go wrong. The model might output a tool call when it should stop. Or stop when it should call a tool. Every framework needs to handle both failure modes.

## The Pokémon Protocol

We took a different approach. In logos, the model communicates with the outside world through `<cmd>` blocks — plain text tags, not special tokens:

```
<cmd>
rg "handleAuth" src/
</cmd>
```

The agent loop is trivial:

```
if cmd found  →  execute, inject result, continue
if no cmd     →  turn over, return final answer
```

**One signal. One dimension.** The model either acts on the world or it's done. There's no ambiguous middle state.

This maps perfectly to Pokémon's battle system:

| Pokémon | Agent Loop |
|---|---|
| Trainer thinks (unlimited) | `<thinking>` tokens (invisible reasoning) |
| Choose one move per turn | One `<cmd>` block per turn |
| Move resolves + opponent responds | Command executes + `<result>` injected |
| No move = flee | No `<cmd>` = end turn |
| PP runs out = Struggle | maxSteps exhausted |

"But what if the model needs to think without acting?" — Modern models have thinking tokens. Internal reasoning happens in `<thinking>`, invisible to the loop. The model doesn't need a "thinking-only turn" because thinking isn't an action. It's what happens *between* turns.

This eliminates the design gap entirely. Three roles, zero overlap:

| Type | Source | Visible | Purpose |
|---|---|---|---|
| `<thinking>` | Internal | No | Reasoning |
| `<cmd>` | External (shell) | No (result injected) | Gathering information |
| Final text | — | Yes | Answer |

## Fog of War

Here's what makes the turn-based model genuinely elegant for coding tasks: **every `<cmd>` is a scouting action**.

The model starts with zero visibility into a codebase. Each command reveals territory:

```
Turn 1: rg "function" src/     →  Scout (reveal file structure)
Turn 2: cat src/handler.go     →  Explore (expand known area)
Turn 3: edit the file           →  Capture (take territory)
Turn 4: go test ./...          →  Battle (verify position)
Turn 5: no cmd                 →  Mission complete (return to base)
```

The one-action-per-turn constraint forces the model to **prioritize what information it needs most**. Instead of shotgunning ten commands and hoping something sticks (the RTS noob strategy), it must reason about what single action maximizes information gain *this turn*.

This constraint produces better results. Deliberate exploration beats spray-and-pray.

## "But What About Parallel Tool Calls?"

OpenAI and Anthropic support multiple tool calls per turn. Isn't that strictly better?

It's more expressive, but it's also more complex:
- The model must decide which tools can run in parallel (dependency analysis)
- Results come back as an unordered batch (the model must correlate them)
- Error handling multiplies (what if 2 of 5 calls fail?)

For coding tasks, parallelism rarely helps. You typically need to *read* before you can *decide* what to *write*. Sequential turns with one action each naturally respect these dependencies.

Going from "multiple actions per turn" to "one action per turn" is like going from Civilization to Chess. Less happening per turn, but each move is more consequential and easier to reason about.

## Streaming Tool Results = Battle Animations

Some frameworks advertise "streaming tool results" — showing real-time output as a command executes. This sounds like a feature upgrade, but consider what actually changes:

| Layer | With streaming | Without streaming |
|---|---|---|
| Model (agent loop) | No change | No change |
| User (UI) | Sees progress | Sees nothing, then result |
| Architecture | Still turn-based | Still turn-based |

The model doesn't process partial results mid-execution. It still waits for the complete output, then reasons in the next turn. Streaming is a *UI* feature, not an *architecture* feature.

It's like Pokémon's battle animations. You can turn them off and the damage calculation is identical. They exist to make waiting more pleasant, not to change the game.

## Why Not Real-Time?

A truly real-time agent would act continuously: perceive → decide → act → perceive → decide → act, with no discrete turns. That's iRobot, not Pokémon.

We're not there because:
- **Models hallucinate.** Turn boundaries are verification checkpoints.
- **Trust isn't established.** Humans need gates to review actions.
- **Compute is expensive.** Continuous generation burns tokens on idle perception.

Every agent framework today — OpenAI Assistants, Claude Code, Cursor, Devin — is turn-based. The only question is whether they *embrace* it or *disguise* it.

We chose to embrace it.

## The Cross-Model Advantage

Here's the practical payoff: because `<cmd>` is plain text (not a special token or provider-specific API), it works with *any* model. GPT, Claude, Llama, Mistral, MiniMax, Qwen — if a model can generate text, it can generate `<cmd>` blocks.

No tool registration schema. No function calling API. No provider lock-in.

Models that *do* support native tool calling sometimes try to use it anyway (force of habit from training). logos detects this and redirects them:

```
"(Unprocessed: tool call format detected. There is NO tool calling API.
 The ONLY way to run commands is inside a <cmd> block.)"
```

After one or two nudges, every model we've tested learns the protocol within the session. The training data for "output text in a specific format" is so vast that models pick it up instantly.

## Conclusion

The AI agent era is a turn-based era. Every framework, every provider, every agent — they're all playing the same game: think → act → observe → repeat.

The question isn't "how do we make agents real-time?" — that's a future era's problem. The question is: **whose turn-based protocol is more elegant, more portable, and more honest about what it is?**

We think ours is. One signal. One action per turn. Zero ceremony. The Pokémon protocol.

---

*[logos](https://github.com/tta-lab/logos) is an open-source agent runtime built on this principle. It powers [ttal](https://github.com/tta-lab/ttal-cli)'s worker plane — parallel coding agents running in isolated git worktrees, each one playing its own turn-based game against a codebase.*