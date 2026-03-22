# 07. Context Compact — Not Forgetting; Putting Away

> **From the previous story**: Jimin connected external services with MCPs and set security boundaries with Security.
> Tools, Knowledge, Context, Permissions — all four layers were working.
> She had spent two hours on the Stripe payment integration. And then Claude's responses started slowing down...

> *"Context will fill up; you need a way to make room"*
> — Harness Engineering

---

## "Claude Got Slow"

Two hours into the Stripe payment integration work. Jimin sensed something was off.

Claude's responses were slowing down. Answers that had taken 3 seconds were now taking 8.
What was stranger was the **quality**. It seemed to have forgotten the contents of files it had just read.

```
Jimin: What's the current context status?
Claude: "Current usage: 87%"
```

87%. While reading 30 files, making 20 MCP tool calls, and having 30 turns of conversation — the messages array was approaching its limit.

But there was a fundamental physical constraint.

Claude's **context window is finite.**

Conversation content, file read results, command output... all of this accumulates in the messages array.

```
messages = [
    { role: "user", content: "implement an auth system" },
    { role: "assistant", content: "let me take a look..." },
    { role: "user", content: "[tool_result] src/auth.ts contents (2000 lines)..." },  ← 8000 tokens
    { role: "assistant", content: "..." },
    { role: "user", content: "[tool_result] tests/auth.test.ts (500 lines)..." },  ← 2000 tokens
    { role: "assistant", content: "..." },
    { role: "user", content: "[tool_result] npm test output..." },               ← 1000 tokens
    ...
    [30 files × avg 3000 tokens = 90,000 tokens]
    [+ 10,000 tokens of conversation]
    [= 100,000 tokens... approaching the limit]
]
```

Working on large codebases or long-running tasks meant context filled up.
**Claude had no more room to think.**

---

<!-- section:workshop -->
## A Real Look at Token Costs

To understand why context fills up so fast, you need to know the actual token costs.

| Item | Approximate Token Count |
|------|------------------------|
| CLAUDE.md (~50 lines) | ~500 tokens |
| 1 Rules file (~50 lines) | ~400–600 tokens |
| 1 Skill file (~30 lines) | ~300–500 tokens |
| File read (100 lines of source) | ~400–800 tokens |
| File read (500 lines of source) | ~2,000–4,000 tokens |
| Bash output (short command) | ~100–300 tokens |
| Full `npm test` output | ~500–2,000 tokens |
| `git diff` (medium-size change) | ~1,000–3,000 tokens |
| Agent summary return | ~200–500 tokens |
| 1 user message | ~50–200 tokens |
| 1 Claude response | ~200–1,000 tokens |

A realistic scenario:
```
20 file explorations × avg 2,000 tokens   = 40,000 tokens
20 conversation turns × avg 500 tokens    = 10,000 tokens
7 Rules files × avg 500 tokens            =  3,500 tokens
─────────────────────────────────────────────────────────
Total                                      = 53,500 tokens
                                             ↑ already in the danger zone
```

Claude Code's context limit: approximately 200,000 tokens.
But quality **starts to degrade at 80% (160,000 tokens).**
Staying below 50% is ideal.

---

## The Solution: A 3-Layer Compression Strategy

Anthropic solved context management with **a 3-stage compression layer.**

```
Every turn:
┌─────────────────────────────┐
│  New tool_result added      │
└──────────────┬──────────────┘
               ↓
[ Layer 1: Micro Compact ] — quietly, every turn
  Replace old tool_results with placeholders
  "[Previously read src/auth.ts]"
               ↓
[ Tokens > threshold? ]
  No → continue
  Yes ↓
[ Layer 2: Auto Compact ] — automatically
  Save full conversation to .transcripts/ (permanently)
  LLM summarizes the key content
  Replace all messages with [summary]
               ↓
[ Layer 3: Manual Compact ] — with the /compact command
  User manually runs the same process
```

Core principle: **Records are permanently preserved on disk; only the active context is compressed.**
It's not "forgetting." It's "putting it away for now."

---

## Layer 1: Micro Compact — The Quiet Janitor

Old tool_results are usually already "consumed."
A file was read, and Claude has already written code based on its contents.
There's no need to carry those original 4000 tokens around anymore.

**It runs quietly every turn.** The user doesn't see it, but the system replaces old tool_results with placeholders:

```
Before replacement (4000 tokens):
  messages[3] = {
    role: "user",
    content: [{ type: "tool_result", tool_use_id: "read_1",
                content: "import jwt from 'jsonwebtoken';\n\nexport function verifyToken(token) {\n  ...(500 lines)..." }]
  }

After replacement (6 tokens):
  messages[3] = {
    role: "user",
    content: [{ type: "tool_result", tool_use_id: "read_1",
                content: "[Previous: read src/auth.ts — 500 lines]" }]
  }
```

This replacement happens **automatically at the start of every turn**:

```
Micro Compact algorithm:

Every turn start:
  for msg in messages:
    if msg.age > 3 turns AND msg.type == "tool_result":
      msg.content = "[Previous: {tool_name} {filename}]"
      freed_tokens += original_size - placeholder_size
```

Claude only needs to remember that "it once read this file."
If the content is needed again, it can just re-read it.

> This is why Layer 1 is "quiet." Without the user being aware, the system keeps the context clean.

---

## Layer 2: Auto Compact — Automatic Summarization

It runs automatically when tokens exceed 50,000.

**The key: transcript archiving comes first.** Before compressing, the full conversation is permanently saved to disk.

```
Auto Compact procedure:

Step 1: Save entire conversation to disk (no loss)
  → .transcripts/transcript_2026-03-22T10-30.jsonl
  → includes all messages, tool_results, errors
  → this file is never deleted — permanent archive

Step 2: Request a summary from the LLM
  → "Summarize this conversation. Include what's done, in progress, and next steps."
  → LLM compresses a 100,000-token conversation into a ~2,000-token summary

Step 3: Replace conversation with the summary
  messages = [
    { role: "user",      content: "[Compacted]\n\nDone: auth API implemented...\nIn progress: writing tests..." },
    { role: "assistant", content: "Understood. Continuing." }
  ]
```

100,000 tokens compressed to 2,000 tokens.
Claude can continue working without losing the full context.

The `.transcripts/` directory is a door to time travel. You can restore the full conversation from any past session at any time. The technical implementation of "not forgetting, just putting it away" is exactly this.

---

## Layer 3: /compact — Strategic Timing

Auto compact only fires when tokens exceed the threshold.
But sometimes **strategic compression** is better.

Before starting a new feature, before a big refactor...
"I want to start with a clean context, without the noise from previous work."

The `/compact` command makes this possible.

Claude Code's recommended patterns:
```
After ~50 tool calls → /compact recommended
Before starting a new feature phase → /compact
Large refactoring in the last 20% of context → don't do it
```

### Decision Flowchart for /compact Timing

```
Should I /compact now?
        │
        ▼
[Check context usage]
        │
  80% or more? ──────────────────────────────────────→ /compact immediately
        │
  50–80%?
        │
        ▼
[Check if switching tasks]
        │
  Starting a new feature? ───────────────────────────→ /compact recommended
        │
  Continuing the same task? → still OK
        │
        ▼
[Check tool call count]
        │
  50 or more? ────────────────────────────────────────→ /compact recommended
        │
  Under 50? → keep going
        │
        ▼
[Assess current context value]
        │
  Will you still need the files you just read?
        │
  Yes → don't /compact now (you'd have to re-read them)
  No  → consider /compact
```

Practical tip: Use the `/compact` skill to analyze current state and get a recommendation.

```
/compact          → analyze state and report recommendation
/compact force    → run immediately
/compact check    → just report current state
```

---

## Beyond Sessions: HANDOFF.md and Session Management

`/compact` handles **within-session** compression.
But what when the session itself ends? When context is fully exhausted, or you need to continue tomorrow?

### The HANDOFF.md Pattern

Create a handoff document between sessions:

```markdown
# HANDOFF.md

## Goal
Implement OAuth 2.0 + PKCE authentication system

## Done
- ✅ Supabase Auth configured
- ✅ Login/signup API routes
- ✅ JWT token refresh middleware

## In Progress
- 🔄 Social login (Google, GitHub)

## Tried But Failed
- ❌ next-auth → conflict with Supabase, removed
- ❌ Cookie-based sessions → issues with CSR, switched to JWT

## Next Steps
1. Integrate Google OAuth provider
2. Implement callback route
3. Write tests
```

**HANDOFF.md is not auto-generated.** Here's the mechanism:

```
When to write it:
  Before a session ends, ask "please create a HANDOFF.md"
  → Claude analyzes the current context and writes the handoff document

When to load it (two methods):
  Method 1: Manual — "read HANDOFF.md and continue"
  Method 2: Auto — add this to CLAUDE.md:
            "If HANDOFF.md exists, read it automatically at session start"
            → Claude checks for the file at session start and auto-loads it

After the task is complete:
  Delete HANDOFF.md, or update it with a "completed" marker
```

**Key point**: If `/compact` is in-session memory management, HANDOFF.md is **inter-session memory management.**
The same principle (preserve only the essentials, discard the noise) applied at a different time scale.

### Resuming Sessions: -c and -r

There's also a lighter-weight method that doesn't require HANDOFF.md:

```bash
claude -c          # resume from the last session
claude -r          # select from recent conversation list
```

`-c` restores the context from the last conversation as-is.
`-r` shows a list of past conversations and lets you select one.

```
Light resumption    → claude -c (automatic context restore)
Intentional handoff → HANDOFF.md (selectively pass only essentials)
Completely fresh    → claude (empty context)
```

### Conversation Forking: Same Starting Point, Different Directions

Sometimes you want to experiment with "which approach is better, A or B?"
But if you try A in one session, the context is contaminated by A, making it impossible to fairly try B.

```
Conversation forking pattern:

Session 1: Approach A (Redux)
  → "manage auth state with Redux"
  → review results

Session 2: Approach B (Zustand)
  → claude -c  (restore Session 1 context)
  → "cancel that work, implement the same thing with Zustand"
  → compare results

Or more cleanly:
  Note "comparing A and B" in HANDOFF.md
  Run independently in two separate new sessions
```

This shares the spirit of git branch: **explore and compare different paths from the same starting point.**

---

> **⚠️ Warning:** Once context exceeds 50%, you enter the "Dumb Zone." Claude's reasoning quality visibly degrades. Avoid large refactoring or complex judgments in this zone. Start after /compact.

<!-- section:reflection -->
## The Harness Perspective: The Context Layer

The core insight of Harness Engineering:

```
Harness = Tools + Knowledge + Context + Permissions

Context management = giving the agent clean memory
```

When context fills up, Claude's **focus scatters.**
Old, unrelated content interferes with new judgments.

A good Harness engineer actively manages context:
- Micro compact: quietly cleans up
- Auto compact: automatically cleans up at the threshold
- Manual compact: strategically cleans up

**Maintaining a working environment where Claude can do its best work.**
That is the essence of context management.

---

## Real-World Examples: How to Use This in an Actual Project

### Checking Current Context Status
Just ask Claude: "How full is the current context?"

### When to Use /compact
| Situation | Recommendation |
|-----------|---------------|
| Before starting a new feature implementation | `/compact` |
| After 50+ tool calls | `/compact` |
| When the topic of work changes significantly | `/compact` |
| Context usage 80% or above | `/compact` immediately |

### When to Avoid /compact
| Situation | Reason |
|-----------|--------|
| Important files in context just read | Would have to re-read after compression |
| In the middle of a complex debug session | Preserving error context is important |

---

#### 🤔 What Will Break?

You start a large refactoring at 90% context. What happens?
Claude has no room to read new files. Even if it reads them, they get tangled with old content and judgment becomes cloudy. It might rename a variable in a file it already renamed, or miss a file that needs changing. /compact first, refactoring second.

#### ✅ What You Can Do After This Unit

- [ ] Explain the 3-layer compression strategy (Micro/Auto/Manual) for /compact
- [ ] Judge when to use and when to avoid /compact
- [ ] Use HANDOFF.md to pass context between sessions

## The Next Story

The context problem was solved.
But as time passed, another limit emerged.

CLAUDE.md got too big.
Coding style, security rules, testing standards, Git rules...
Everything was mixed together in one file.

/compact solved the single-agent memory problem.

But the launch was three days away. Processing frontend, backend, and tests sequentially with one agent wasn't going to be fast enough.

Seoyeon asked. "Can you have a demo ready by Friday?"

Jimin couldn't answer. **One agent wasn't enough.**

→ **[Ch12. Agent Teams — Three Days to the Friday Demo](./10-agent-teams.md)**
