# Epilogue — Harness Engineer

> **Previously**: Jimin cut costs by 70% with Token Economics.
> Model routing, context compression, on-demand loading — an efficient Harness was a good Harness.
> Four weeks have passed. It's time to draw the full picture.

> *"The Model IS the Agent. The Code IS the Harness."*
> — The words Jimin heard on her first day. Now she understands what they mean.

---

## Back to Four Weeks Ago

Four weeks ago, Jimin ran Claude Code for the first time.

Hyunwoo from the next desk said: "That's just a chatbot."

Jimin thought so too. A tool where you put text in and text comes out.

But over four weeks, Jimin came to understand. Claude was an agent from the very beginning. **What was missing wasn't Claude — it was the environment.**

---

<!-- section:reflection -->
## The Full Picture

The final diagram Jimin drew on the whiteboard:

```
                    Harness = Tools + Knowledge + Context + Permissions
                    ═══════════════════════════════════════════════════

    ┌─────────────────────────────────────────────────────────────────────┐
    │                        Permissions Layer                            │
    │                                                                     │
    │  Hooks (Ch03)          Permission Modes (Ch10)     Security (Ch10)  │
    │  └ PreToolUse          └ Normal / Auto / Plan      └ secret guard   │
    │  └ PostToolUse                                     └ MCP trust boundary│
    │  └ 23 events                                                        │
    ├─────────────────────────────────────────────────────────────────────┤
    │                        Knowledge Layer                              │
    │                                                                     │
    │  CLAUDE.md (Ch02)      Skills (Ch04)    Rules (Ch08)  Memory (Ch14)│
    │  └ auto-injected       └ on-demand      └ selective    └ session-persistent│
    │  └ project knowledge   └ /commit etc    └ 7 files      └ MEMORY.md │
    ├─────────────────────────────────────────────────────────────────────┤
    │                        Context Layer                                │
    │                                                                     │
    │  Task System (Ch05)    Agents (Ch06)     Compact (Ch11)            │
    │  └ externalized plan   └ context isolate └ 3-tier compression      │
    │  └ DAG dependencies    └ messages=[]     └ transcript               │
    │                                                                     │
    │  Agent Teams (Ch12)    Worktree (Ch13)   Token Economics (Ch15)    │
    │  └ horizontal scale    └ file isolation  └ model routing           │
    │  └ Message Bus         └ branch binding  └ cost optimization       │
    ├─────────────────────────────────────────────────────────────────────┤
    │                        Tools Layer                                  │
    │                                                                     │
    │  Agent Loop (Ch01)     Background (Ch07)     MCPs (Ch09)           │
    │  └ while + tool_use    └ I/O parallelized    └ external services   │
    │  └ 30-line core        └ buzzer pattern      └ stdio/http          │
    │  └ Headless Mode       └ Autonomous Loops    └ GitHub/Stripe/...   │
    └─────────────────────────────────────────────────────────────────────┘

                          ▲ The Foundation of Everything ▲
                    ┌─────────────────────────┐
                    │   Claude (The Model)     │
                    │   = The Agent            │
                    │   Already capable of     │
                    │   reasoning              │
                    └─────────────────────────┘
```

---

## 16 Mechanisms, One Principle

```
Ch00  Harness Engineering    "The model is already an agent. The code is the Harness."
Ch01  Agent Loop             "A 30-line while loop is where it all begins"
Ch02  CLAUDE.md              "Project knowledge auto-injected every session"
Ch03  Hooks                  "When Claude moves, the system moves with it"
Ch04  Skills                 "On-demand knowledge loaded only when needed"
Ch05  Task System            "Externalize the plan outside the context"
Ch06  Agents                 "Focus from a clean context"
Ch07  Background Tasks       "Keep thinking without waiting for I/O"
Ch08  Rules                  "Break the 350-line monolith into 7 modules"
Ch09  MCPs                   "Connect to the outside world with a standard protocol"
Ch10  Security               "Set trust boundaries and automate defenses"
Ch11  Context Compact        "Compress context to enable infinite sessions"
Ch12  Agent Teams            "Multiple agents collaborate horizontally"
Ch13  Worktree Isolation     "Parallel work without file conflicts"
Ch14  Agent Memory           "Learning accumulates across sessions"
Ch15  Token Economics        "Be cost-conscious to build a better Harness"
```

One principle runs through it all:

**Give an agent the right environment, and the agent handles the rest itself.**

Give it tools and it acts (Tools),
give it knowledge and it judges (Knowledge),
give it a clean context and it focuses (Context),
give it the right permissions and it works safely (Permissions).

---

## Looking Back

Hyunwoo asked at the beginning: "That's just a chatbot, right?"

The answer now:

*"No, Claude was an agent from the very beginning. What I built wasn't Claude — it was the **Harness**.
Attaching tools, injecting knowledge, managing context, setting permissions.
I didn't change the model. I built the **environment** the model can work in."*

Hyunwoo: "...So what's your title?"

Jimin smiled.

*"Harness Engineer."*

---

## Agent vs Command vs Skill — When to Use Which

The question Jimin gets most: "Should I make this an Agent, or a Skill?"

| Criterion | Agent | Command | Skill |
|-----------|-------|---------|-------|
| **Context** | Isolated (separate window) | Shared (main) | Shared (main) |
| **How triggered** | Automatic (proactive) | User-initiated (`/`) | Automatic (description-based) |
| **Memory** | user/project/local | — | — |
| **Model selection** | via `model` field | via `model` field | — |
| **Isolation level** | separate process | none | `context: fork` option |
| **Best for** | autonomous multi-step tasks | user workflows | reusable procedures |

```
Decision flow:

"Does this task need to run autonomously?"
  Yes → Agent (code-reviewer, planner, etc.)
  No  ↓

"Is this a workflow the user starts directly?"
  Yes → Command (/commit, /deploy, etc.)
  No  ↓

"Is this reusable knowledge/procedure?"
  Yes → Skill
```

---

## Quick Reference: Situation Guide

| Situation | Reference Chapter |
|-----------|------------------|
| Getting started with Claude Code | Ch00 → Ch01 → Ch02 |
| Claude isn't following the rules | Ch02 (CLAUDE.md) → Ch08 (Rules) |
| Want to add automation to Claude | Ch03 (Hooks) |
| Tired of repetitive tasks | Ch04 (Skills) |
| Getting lost in big tasks | Ch05 (Task System) |
| Code review feels scattered | Ch06 (Agents) |
| Wasting time waiting for builds | Ch07 (Background Tasks) |
| CLAUDE.md is too long | Ch08 (Rules) |
| Want to connect external services | Ch09 (MCPs) |
| Worried about security | Ch10 (Security) |
| Claude's responses are slowing down | Ch11 (Context Compact) |
| Not enough time working alone | Ch12 (Agent Teams) |
| Agents are overwriting each other's files | Ch13 (Worktree Isolation) |
| Teaching the same things every session | Ch14 (Agent Memory) |
| Worried about costs | Ch15 (Token Economics) |
