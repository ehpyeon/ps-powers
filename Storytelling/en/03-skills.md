# Skills — Packaging Repetition

> **From the previous story**: Jimin gained control of Claude's actions with Hooks.
> The accident of pushing directly to main never happened again. Lint also ran automatically after file edits.
> But a new kind of fatigue was accumulating...

> Harness = Tools + **Knowledge** + Context + Permissions
>
> Skills **package repeated Knowledge into an on-demand format**.
> *"Load knowledge when you need it, not upfront"*

---

## Saying the Same Thing Ten Times a Day

Jimin committed ten times a day. Every time she typed the same instructions.

```
"Look at the staged changes, commit them in conventional commit format.
Type must be one of feat/fix/refactor/docs/test/chore. Under 50 chars. In Korean."
```

Ten times. Every day. In the morning she gave precise instructions, but by evening it had shrunk to "just commit it."
Claude's commit quality differed between morning and evening. Because **humans have limited consistency.**

And there was another problem.

CLAUDE.md had created the always-available Knowledge.
But as developers started putting more and more into it, a problem emerged.

If you put all Knowledge into CLAUDE.md (the system prompt):

```
System prompt = project info (500 tokens)
              + Git workflow (1000 tokens)
              + code review checklist (2000 tokens)
              + testing guidelines (1500 tokens)
              + deployment procedures (2000 tokens)
              + security guide (1800 tokens)
              + ...
              = 15,000 tokens total
```

**Problem 1: Context waste**
When running `/commit`, the 2000 tokens of deployment procedures are unnecessary.
When running `/deploy`, the 2000 tokens of code review checklist are unnecessary.
Carrying all knowledge around all the time is wasteful.

**Problem 2: Inefficiency of repeated instructions**
Different from the problem of typing the same instruction every time:
"When executing this workflow, this knowledge is needed" — how do you automate that?

---

## The Solution: Two-Layer Knowledge Loading

The core pattern:

```
Layer 1 (always active — system prompt):
┌─────────────────────────────────────┐
│ Available skills:                    │
│   - git: Git workflow helper         │  ~100 tokens/skill
│   - code-review: code review list    │
│   - deploy: deployment procedures    │
└─────────────────────────────────────┘
             ↓ Claude requests load_skill("git")
Layer 2 (only when needed — tool_result):
┌─────────────────────────────────────┐
│ <skill name="git">                  │
│   ## Git Workflow                    │  ~2000 tokens
│   1. Branch strategy: ...           │
│   2. Commit format: ...             │
│ </skill>                            │
└─────────────────────────────────────┘
```

**Layer 1**: Only tells Claude what Knowledge is available (name + one-line description) — cheap
**Layer 2**: Loads the full content only when actually needed — only when necessary

10 skills × 100 tokens = 1,000 tokens (Layer 1, always)
vs.
Used skills × 2,000 tokens = average 2,000–4,000 tokens (Layer 2, when needed)

Total tokens consumed drops significantly.

---

<!-- section:workshop -->
## Skills in Claude Code = Slash Commands

The Two-Layer pattern is implemented in Claude Code as **slash commands**.

Create a single file `.claude/skills/commit/SKILL.md` and the `/commit` command is born.

```
Two Knowledge loading approaches:
1. CLAUDE.md/Rules = background knowledge that's always active
2. Skills = expert knowledge loaded only when explicitly requested
```

The difference:
- CLAUDE.md: "This project is TypeScript" → always needed
- Skill: "The full conventional commit format rules" → only needed when doing `/commit`

---

## The Structure of SKILL.md

Let's look at the full `/commit` skill from an actual project:

```markdown
---
name: commit
description: Analyzes staged changes and generates a conventional commit message to commit.
---

Analyze staged changes and create a conventional commit.

## Steps

1. Check staged changes with `git status` and `git diff --staged`
2. If there are no changes, notify the user and exit
3. Understand the purpose and scope of the changes, draft a commit message
4. Generate the commit message in the format below
5. Run `git commit -m "..."`

## Commit Message Format

<type>: <description>

<optional body — why this change was made>

**Choosing a type:**
- `feat` — new feature
- `fix` — bug fix
- `refactor` — code improvement without functional change
- `docs` — documentation changes only
- `test` — adding or modifying tests
- `chore` — build configuration, dependencies, etc.

## Rules
- Description in Korean, under 50 characters
- Body is "why" not "what"
- Never use `--no-verify`

## Handling $ARGUMENTS
If there are arguments, use them as additional context.
Example: `/commit login bug fix` → generate a message reflecting that context
```

This is the entirety of Layer 2. These ~45 lines only enter Claude's context when `/commit` is called.

> **💡 Tip:** A Skill is not a file, it's a **folder**. Inside `.claude/skills/commit/`, you can include scripts, data, and example files alongside the SKILL.md.

> **❌ Anti-pattern:** Don't write obvious things in Skills. Repeating what Claude already knows (language syntax, framework basics) only wastes context. Focus on **non-default behavior, team-specific rules, and common failure points.**

> **💬** "The highest-value content is the Gotchas section. It can start empty. Over time, keep adding failure points. This has the highest signal-to-noise ratio." — Thariq, Anthropic Engineer

---

## 9 Skill Categories

"What skills should I create?" Jimin made `/commit`, but didn't know what else to create.

According to Anthropic's team experience, every skill falls into one of 9 categories:

| Category | Description | Examples |
|----------|-------------|---------|
| **Library & API Reference** | Non-standard usage of frequently-used libraries | Stripe API guide, ORM rules |
| **Product Verification** | Automatically verify product features | Signup flow test, payment E2E |
| **Data Fetching & Analysis** | Automate data queries and analysis | DB queries, dashboard generation |
| **Business Process** | Repetitive business workflows | Standup posts, weekly reports |
| **Code Scaffolding** | Boilerplate matching project rules | Component templates, API route generation |
| **Code Quality & Review** | Code validation based on team rules | Code review, style checks |
| **CI/CD & Deployment** | Build, test, deployment automation | PR management, deployment pipeline |
| **Runbooks** | Incident response, debugging procedures | Service debugging, on-call response |
| **Infrastructure Ops** | Infrastructure maintenance automation | Dependency updates, cost investigation |

Start with only 1–2 categories, and expand as the project grows.

---

## $ARGUMENTS: Dynamic Knowledge

Skills don't just hold static knowledge.
They can be made dynamic with `$ARGUMENTS`.

```
/commit fix login bug
         ↑
         $ARGUMENTS = "fix login bug"
```

The `/compact` skill uses `$ARGUMENTS` to branch into three modes:

```markdown
## Checking $ARGUMENTS:
- No argument → analyze state and report recommendation
- "force" or "now" → run /compact immediately
- "check" → just report current state
```

With a single skill, `/compact`, `/compact force`, and `/compact check` all behave differently.

---

<!-- section:reflection -->
## CLAUDE.md vs Rules vs Skills — What Goes Where?

```
Where should I put this Knowledge?

Information that's always needed (project overview, tech stack):
  → CLAUDE.md

Rules that are always needed (coding style, security policy):
  → .claude/rules/*.md

Things only needed when explicitly called (/commit, /plan):
  → .claude/skills/*/SKILL.md

Decision criterion:
  "Is this needed in this session right now?" → CLAUDE.md / Rules
  "Is this only needed when running a specific workflow?" → Skills
```

---

## Eliminating Repetition: The Problem of Typing the Same Thing Over and Over

The surface-level problem Skills solve:
The waste of typing the same instructions every time.

```
# Without a skill
Me: Look at the staged changes, commit them in conventional commit format.
    Type must be one of feat/fix/refactor/docs/test/chore. Under 50 chars. In Korean.
    (10 times a day)

# With a skill
Me: /commit
    (10 times a day)
```

But the deeper value is **consistency**.
People give lazy instructions when they're tired.
A Skill always injects the same quality of Knowledge.

---

#### 🔨 Try It Now

1. Create a `.claude/skills/hello/SKILL.md` file
2. In the frontmatter, write `name: hello` and `description: greet the user`
3. In the body, put "Greet the user in English"
4. Try running `/hello` in Claude Code

#### ✅ What You Can Do After This Unit

- [ ] Create a SKILL.md file and register a slash command
- [ ] Explain the principle of Two-Layer Knowledge Loading
- [ ] Select 3 or more skill categories from the 9 that your project needs

## The Problem That Emerged as Skills Matured

Skills packaged workflows.
But as workflows grew more complex, a different problem emerged.

Running `/plan` had Claude create a plan.
But while creating the plan, noise accumulated in Claude's main context.

```
Main conversation context:
- 3 hours of implementation from earlier
- Small talk
- 30 file reads during planning
→ Write code while carrying all this noise?
```

*"I want to create the plan in a clean context.
I want to hand code review off to a specialist who only looks at the code."*

This was the demand for the **Context Isolation layer** of the Harness.

*"In tasks with many steps, the agent loses its way. We've packaged workflows with Skills, but how do we manage a 10-step implementation?"*

→ **[Ch05. Task System — Where Were We?](./08-todo-task-system.md)**
