# Token Economics — The Bill Arrived

> **Previously**: Jimin built a system where learning accumulates across sessions with Agent Memory.
> "Finally, a seasoned hire." But in the final sprint before launch, she ran 3 Opus agents simultaneously.
> The next morning, she opened the billing dashboard...

> Harness = Tools + Knowledge + **Context** + Permissions
>
> Token Economics means **consciously managing the cost of Context**.
> *"Unlimited intelligence, finite budget"*

---

## "Is This Bill Right?"

The day before launch, Jimin ran 3 Opus agents simultaneously.

backend-agent, frontend-agent, qa-agent. Each worked for 4 hours.

The next morning, she opened the API usage dashboard.

```
Daily cost report:
  backend-agent  (Opus):  $47.20   (280K input + 45K output tokens)
  frontend-agent (Opus):  $38.50   (220K input + 40K output tokens)
  qa-agent       (Opus):  $29.80   (170K input + 30K output tokens)
  ─────────────────────────────────
  Total:                  $115.50 / day
```

Could she report this cost to Seoyeon? $115 every day?

Jimin asked herself: *"Did qa-agent really need Opus?"*

---

## Model Selection: The Right Tool for the Right Job

Claude has three models. Each differs in capability and cost.

```
Model comparison (approximate):

Opus 4.6  — smartest, most expensive
  Strengths: complex architecture decisions, deep reasoning, hard bugs
  Cost: $$$$
  Speed: slow

Sonnet 4.6 — balanced
  Strengths: general development work, code writing, refactoring
  Cost: $$
  Speed: medium

Haiku 4.5  — fastest, cheapest
  Strengths: simple analysis, pattern extraction, lightweight tasks
  Cost: $
  Speed: fast
```

### Model Routing Strategy

Not every task needs Opus:

```
Optimal model per task type:

When Opus is needed:
  → Complex architecture decisions
  → Multi-file refactoring (cross-file dependency reasoning)
  → Subtle security vulnerability analysis
  → New system design

When Sonnet is sufficient:
  → General feature implementation
  → Code review
  → Test writing
  → Documentation generation

When Haiku is appropriate:
  → Log analysis, pattern extraction
  → Simple file transformations
  → Background monitoring
  → Code formatting checks
```

---

<!-- section:workshop -->
## Cost Optimization for Agent Teams

Jimin redesigned the team composition:

```
Before optimization ($115.50/day):
  backend-agent  → Opus    $47.20
  frontend-agent → Opus    $38.50
  qa-agent       → Opus    $29.80

After optimization (~$35/day):
  backend-agent  → Sonnet  ~$15    (Sonnet is enough for general implementation)
  frontend-agent → Sonnet  ~$12    (UI implementation too)
  qa-agent       → Haiku   ~$5     (test execution and result analysis)
  architect      → Opus    ~$3     (called only for architecture decisions)
  ─────────────────────────────────
  Total:                   ~$35 / day (70% reduction)
```

**The key: use Opus only as a "consultant."** Everyday implementation goes to Sonnet; lightweight tasks go to Haiku.

### Specifying the Model in Agent Definitions

```yaml
---
name: code-reviewer
description: Code review specialist
model: sonnet
tools: ["Read", "Grep", "Glob"]
---
```

```yaml
---
name: log-analyzer
description: Log analysis and pattern extraction
model: haiku
tools: ["Read", "Grep", "Bash"]
---
```

One `model` field line controls an agent's cost.

---

## Token Economics: Input and Output

To understand costs, you need to know where tokens are consumed:

```
Token consumption structure:

Input tokens:
  system prompt     ~500 tokens     (CLAUDE.md, Rules)
  messages[]        ~50,000 tokens  (conversation history)
  tool_results      ~30,000 tokens  (file reads, command outputs)
  ──────────────────────────────
  Total input:      ~80,000 tokens

Output tokens:
  Claude's response ~1,000 tokens
  tool_use calls    ~200 tokens
  ──────────────────────────────
  Total output:     ~1,200 tokens
```

**Input is overwhelmingly more than output.** The key to cost reduction is **reducing input tokens**.

### Input Token Reduction Strategies

```
Strategy 1: Micro Compact (Ch10)
  → Replace old tool_results with placeholders
  → Savings: ~3,000 tokens per turn

Strategy 2: Skills On-demand (Ch04)
  → Load knowledge only when needed, keep system prompt light
  → Savings: ~5,000 tokens per session

Strategy 3: Subagent isolation (Ch06)
  → Block exploration noise from parent context
  → Savings: ~20,000 tokens per task

Strategy 4: Strategic /compact (Ch10)
  → Manual compression after 50 tool calls
  → Savings: ~50,000 tokens (conversation reset)

Strategy 5: Model routing
  → Handle lightweight tasks with cheaper models
  → Savings: 60-80% per task
```

---

> **💬** "In the AI era, the marginal cost of completeness is nearly zero. A human team might choose 90% implementation, but with Claude Code you should always choose 100% complete implementation. Tests, error handling, edge cases — include everything." — Garry Tan, CEO of Y Combinator

## Cost Monitoring

Jimin built a habit of tracking costs:

```bash
# Check current session cost in Claude Code
# Just ask during conversation: "How many tokens have we used this session?"

# Check daily/weekly trends in the API dashboard
# Sharp increases = signal of inefficient patterns
```

### Cost Warning Signals

| Signal | Cause | Fix |
|--------|-------|-----|
| $20+ single session | Context explosion (reading too many files) | Use /compact, leverage Subagents |
| $100+ daily | All agents on Opus | Apply model routing |
| Same file read repeatedly | Micro compact not working | Restart session |
| Excessive output tokens | Unnecessarily long responses | More concise instructions |

---

## Effort Compression Table

Cost alone isn't the whole picture. You also need to see the **time saved**.

| Task Type | Human Team | Claude Code | Compression |
|-----------|------------|-------------|-------------|
| Boilerplate generation | 2 days | 15 min | ~100x |
| Test writing | 1 day | 15 min | ~50x |
| Feature implementation | 1 week | 30 min | ~30x |
| Bug fix + regression tests | 4 hours | 15 min | ~20x |
| Architecture design | 2 days | 4 hours | ~5x |

Architecture design has a low compression ratio. **Tasks requiring deep reasoning still take time.** But boilerplate, tests, repetitive implementation — in these areas, the value of Claude Code is overwhelming.

If $35/day replaces a senior engineer's repetitive work? The ROI speaks for itself.

---

<!-- section:reflection -->
## Reflection: Cost as a Design Tool, Not a Constraint

Jimin showed the cost report to Seoyeon.

```
Before optimization: $115/day × 20 days = $2,300/month
After optimization:  $35/day × 20 days  = $700/month
```

Seoyeon: "That's one-tenth of a senior developer's monthly salary. Perfectly reasonable."

Being cost-conscious is **the same as building a better Harness.** Model routing, context compression, on-demand knowledge loading — all of these techniques simultaneously reduce cost and **improve quality**.

Less noise in context means Claude makes more accurate judgments. Using the right model eliminates unnecessary wait time.

**Efficient Harness = Cheap Harness = Good Harness.**

---

## What's Next

The launch is over. Seoyeon's investor demo was a success.

Four weeks ago, Jimin was a newcomer who had just installed Claude Code.
Four weeks later, Jimin is a Harness Engineer who has mastered 14 mechanisms — from Agent Loop to Token Economics.

But was everything truly connected?
It's time to draw the full picture.

→ **[Epilogue. Harness Engineer — The Full Picture](./15-epilogue.md)**
