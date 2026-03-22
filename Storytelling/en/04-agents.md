# Agents — Isolated, Specialized Agents

> **From the previous story**: Jimin could now execute 10-step tasks in sequence using the Task System.
> Even automatic verification with the Verification Loop. But during the payment system implementation,
> she asked for a code review — and something strange happened...

> Harness = Tools + Knowledge + **Context** + Permissions
>
> Agents enable noise-free focus through **Context isolation**.
> *"Break big tasks down; each subtask gets a clean context"*

---

## A Distracted Review

All she asked for was a code review.

But Claude said "just a moment, let me get an overview of all the code" and started reading 20 files.
Ten minutes later, Claude's review was strangely scattered.

It was talking about the DB schema, then suddenly mentioned how to install a package.
Not a single word about the security vulnerabilities in the payment logic she had just asked about.

Hyunwoo saw the review results and said, "AI code review? Wouldn't it be better to have a human look at it?"

Jimin realized it. Hyunwoo wasn't wrong. But the problem wasn't the AI — it was the **environment**.
Claude hadn't gotten dumber.
**It was doing the review inside 50,000 tokens of noise.**

```python
messages = [
    "user: implement a payment system",
    "[tool_result] src/api/routes.ts (500 lines)",       # ← 2000 tokens
    "[tool_result] src/models/user.ts (300 lines)",      # ← 1200 tokens
    "[tool_result] src/db/schema.sql (200 lines)",       # ← 800 tokens
    ... (20 more file explorations)
    "assistant: let me make a plan...",
    ... (entire implementation process)
    "user: now do a code review"    # ← review request here
]
# Total context: 50,000 tokens. What's needed for review: 5,000 tokens. Noise: 90%.
```

*"Can't we show the reviewer only the thing being reviewed? Without all the exploration, planning, and small talk so far?"*

---

## Terminology: Subagent vs. Teammate

The "agents" covered in this file are more precisely **Subagents**.

```
Subagent (this file):
  Parent creates → performs task → returns summary → disappears
  Vertical relationship. Parent waits.
  Examples: code-reviewer, planner, security-reviewer

Teammate (10-agent-teams.md):
  Lives independently → collaborates via task board → cycles through multiple tasks
  Horizontal relationship. Nobody waits.
  Examples: backend-agent, frontend-agent, qa-agent
```

**Both are "Agents," but their lifecycles differ.**
A Subagent is a disposable specialist; a Teammate is a resident team member.

---

## Origin Story: Context Gets Polluted

With the Agent Loop and Skills complete, Claude Code began handling complex tasks.

But a critical problem emerged.

```python
# The Agent Loop's messages array keeps growing
messages = [
    "user: implement a payment system",
    "assistant: let me first get a sense of the codebase...",
    "user: [tool_result] src/api/routes.ts (500 lines)",       ← 2000 tokens
    "user: [tool_result] src/models/user.ts (300 lines)",      ← 1200 tokens
    "user: [tool_result] src/db/schema.sql (200 lines)",       ← 800 tokens
    "user: [tool_result] package.json",                        ← 300 tokens
    "user: [tool_result] README.md",                           ← 500 tokens
    ... (20 more file explorations)
    "assistant: ok, let me make a plan...",
    "assistant: step 1: install the stripe package...",
    ... (plans and implementation start mixing)
]
# Total context: 50,000 tokens
# Of that, what's actually needed for code review: 5,000 tokens
# Noise ratio: 90%
```

**The code review agent has to review while carrying all 50,000 tokens of context.**
Exploration history, plans, small talk, file contents...
Most of it is irrelevant to the review.

Core insight:
> "As the agent works, its messages array grows. Every file read, every bash output stays in context permanently."

---

## The Core Insight: Process Isolation = Context Isolation

The solution was elegant.

**Always give a new agent an empty messages array.**

```python
# Running a subagent
def run_subagent(prompt: str) -> str:
    sub_messages = [{"role": "user", "content": prompt}]
    # ↑ starts with messages=[] — no parent conversation content!

    # the subagent's own loop
    while True:
        response = client.messages.create(messages=sub_messages, ...)
        if response.stop_reason != "tool_use":
            break
        # run tools, add results...

    # return only the summary to the parent
    return last_text_from(response)
    # the subagent's 30 tool calls do not enter the parent context
```

```
Parent Agent                       Subagent
┌──────────────────┐             ┌──────────────────┐
│ messages=[       │             │ messages=[]      │ ← clean!
│   long convo...  │             │                  │
│   30 files...    │  request    │  works           │
│                  │ ──────────> │  independently   │
│   result = "..." │ <────────── │  (read, analyze) │
│                  │  summary    │  return summary  │
└──────────────────┘   only      └──────────────────┘
                                 subagent's 30 tool calls = discarded
```

When you delegate "explore and find the answer" work to a subagent:
1. The subagent explores in a clean context
2. It passes a summary of what it found back to the parent
3. Only the summary remains in the parent context (no exploration noise)

---

<!-- section:workshop -->
## Agents in Claude Code = Specialized Subagents

The Context Isolation pattern is implemented in Claude Code as **agent definition files**.

With a single `.claude/agents/code-reviewer.md` file:
1. Inject specialized Knowledge for a specific role
2. Grant only the Tools needed (least privilege)
3. Select the appropriate model
4. Run in a clean Context

The actual `code-reviewer.md` from this project:

```markdown
---
name: code-reviewer
description: Expert code review specialist. Proactively reviews code for quality,
             security, and maintainability. Use immediately after writing or
             modifying code. MUST BE USED for all code changes.
tools: ["Read", "Grep", "Glob", "Bash"]   ← no write permissions
model: sonnet
---

You are a senior code reviewer ensuring high standards of code quality and security.

## Review Process
1. Run `git diff --staged` and `git diff` to see all changes
2. Read the full file and understand imports, dependencies, and call sites
3. Apply review checklist below, from CRITICAL to LOW
4. Report findings — only issues >80% confident are real problems

## Review Output Format

[CRITICAL] Hardcoded API key in source
File: src/api/client.ts:42
Issue: API key exposed in source code.
Fix: Move to environment variable

## Review Summary
| Severity | Count | Status |
|----------|-------|--------|
| CRITICAL | 0     | pass   |
| HIGH     | 2     | warn   |
Verdict: WARNING — 2 HIGH issues before merge.
```

This one file is everything the agent needs: role definition, tool list, model selection, task instructions.

### The `model` Field: Optimizing Cognitive Cost

Each agent has a `model` field. Which model should you choose?

```
Opus 4.6:    Deep reasoning, complex architecture design, difficult debugging
             → planner (architecture decisions need accuracy, even if expensive)

Sonnet 4.6:  General development, code review, multi-step implementation
             → code-reviewer (optimal cost-performance, handles most tasks)

Haiku 4.5:   Pattern extraction, simple analysis, background cleanup
             → refactor-cleaner (fast and cheap, good for repetitive scans)
```

**Model selection is a Harness design decision.**
A more expensive model is not always better. It must match the cognitive demands of the task.

```
planner:           model: opus   ← one decision sets the entire direction
code-reviewer:     model: sonnet ← called frequently, balance of accuracy and cost
security-reviewer: model: sonnet ← security matters, but pattern matching is the main work
refactor-cleaner:  model: haiku  ← dead code detection is repetitive, fast scanning is key
```

---

## Three Benefits of Context Isolation

### Benefit 1: Focus

```
What the code-reviewer agent sees:
- The changed files
- Review criteria (Knowledge)
- That's it

What the code-reviewer agent does NOT see:
- 3 hours of implementation history
- Contents of other files
- Small talk from previous conversations
```

**Focus purely on the role, without unnecessary noise.**

### Benefit 2: Parallel Execution

```
Main Claude runs simultaneously:
┌─ planner: architecture planning (independent context)
├─ security-reviewer: security scan (independent context)
└─ doc-updater: documentation update (independent context)
```

Real-world example — dispatching three agents simultaneously:

```
Main Claude:
  [Agent: planner, "design payment system architecture"]         ─┐
  [Agent: security-reviewer, "security review of current auth"]  ─┤ run in parallel
  [Agent: code-reviewer, "review the API code just written"]     ─┘

  (three agents work in independent contexts)

  planner result: "recommend 3-tier architecture..."
  security result: "JWT expiry handling missing..."
  reviewer result: "N+1 query problem found..."
```

Parallel execution is safe because each agent has an independent context.

### Benefit 3: Least Privilege

```
planner:           Read, Grep, Glob → read-only (cannot modify code)
code-reviewer:     Read, Grep, Glob, Bash → read + execute
security-reviewer: Read, Write, Edit, Bash → full permissions (needs to fix issues)
```

Each agent is given only the tools it needs.
`planner` cannot accidentally modify code.

---

## Description: The Key to Automatic Agent Selection

The power of the agent system lies in its **description**.

```yaml
description: Use PROACTIVELY after writing or modifying code.
             MUST BE USED for all code changes.
```

Claude reads this description and judges for itself:
*"The user wrote code. I should use code-reviewer."*

The agent runs even without the user saying "please review."
This is proactive agent orchestration.

---

> **💡 Tip:** Separating the implementation agent from the verification agent improves quality 2–3x. If the same agent reviews its own code, a bias of "I wrote this, so it must be right" sets in. A separate verification agent with its own context should do the review.

> **💬** "If you give Claude a way to verify its own work, quality goes up 2–3x. That's the most important tip I can give." — Boris Cherny, creator of Claude Code

## Real-World Example: Composing an Agent Team

| Agent | Role in Harness | Specialized Knowledge |
|-------|----------------|----------------------|
| **planner** | Context isolation + Knowledge specialization | Planning, step decomposition |
| **code-reviewer** | Context isolation + Knowledge specialization | Code quality review |
| **security-reviewer** | Context isolation + Knowledge specialization | OWASP, security patterns |
| **refactor-cleaner** | Context isolation + Knowledge specialization | Dead code detection |

---

## Preloaded Knowledge: The Skill Inside an Agent

We've given agents Tools and a Model. But we can also give them **Knowledge**.

The Skills from Ch03 are called by the user with `/commit`.
But what if you put Knowledge directly inside the agent's `.md` file?

```
Slash Command Skill:
  User: /commit
  → SKILL.md gets loaded into context
  → only exists when called

Agent Preloaded Skill:
  code-reviewer.md contains the review checklist directly
  → already in context when the agent is created
  → no separate invocation needed
```

Looking at the actual `code-reviewer.md` again:

```markdown
---
name: code-reviewer
tools: ["Read", "Grep", "Glob", "Bash"]
model: sonnet
---

You are a senior code reviewer...

## Review Checklist       ← this is the Preloaded Knowledge
1. Security: check for hardcoded secrets
2. Performance: check for N+1 queries
3. Style: check immutability patterns
```

The `## Review Checklist` and everything below it is a **Preloaded Skill**.
The agent definition file itself becomes the vehicle for Knowledge injection.

```
From the Harness perspective:
  Agent = Tools (tools field)
        + Knowledge (agent.md body = Preloaded Skill)
        + Context (messages=[] isolation)
        + Permissions (minimal tool set)

  A single agent carries all 4 layers of the Harness.
```

---

<!-- section:reflection -->
## The Problem That Emerged as Agents Matured

As the agent system settled in, yet another problem revealed itself.

*"Claude can't do anything for the 30 seconds that `npm install` takes. Can it do other work while waiting for a build?"*

→ **[Ch07. Background Tasks — 30 Seconds of Silence](./09-background-tasks.md)**
