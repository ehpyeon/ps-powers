# Rules — Dismantling CLAUDE.md

> **From the previous story**: Jimin used Background Tasks to handle builds and coding simultaneously.
> The project grew quickly. From 50 files to 100.
> And CLAUDE.md was growing along with it...

> Harness = Tools + **Knowledge** + Context + Permissions
>
> Rules **dismantles bloated Knowledge by topic**.
> *"Don't pollute Context with unnecessary Knowledge"*

---

## Origin Story: The "350-Line Monster"

CLAUDE.md seemed like the perfect solution.
Gather all project rules in one place and inject them into Claude.

Three months later, Jimin opened CLAUDE.md and was taken aback:

```markdown
# My Project

## About This Project (10 lines)
## Tech Stack (15 lines)
## Coding Style
  - Immutability rules (8 lines)
  - File size limits (5 lines)
  - Error handling (10 lines)
  - Naming conventions (12 lines)
## Testing Standards
  - TDD rules (15 lines)
  - Coverage criteria (8 lines)
  - E2E tests (10 lines)
## Security Guidelines
  - Secret management (10 lines)
  - Input validation (8 lines)
  - OWASP checklist (20 lines)
## Git Workflow
  - Commit format (10 lines)
  - PR process (15 lines)
  - Branch strategy (12 lines)
## Agent Orchestration
  - When to use planner (10 lines)
  - When to use code-reviewer (8 lines)
## Performance
  - Model selection criteria (10 lines)
  - Context management (8 lines)
...
```

**350 lines total.** This kind of CLAUDE.md was everywhere.

There were several problems:

**Problem 1: Hard to find things**
"Where were the security rules?" → have to Ctrl+F

**Problem 2: Hard to maintain**
Even to update just the security rules, you have to open a 350-line file

**Problem 3: Context waste**
`planner` doesn't need security rules. But it reads all of them.
This fills Claude's context window with unnecessary information.

**Problem 4: Language/framework differences**
TypeScript projects and Python projects have different rules,
but putting them all in one file creates conflicts.

*"What if we split the rules by topic and let Claude read only what it needs?"*

---

## The Birth of the Solution: "Split the Rules Files"

Looking at the Harness Knowledge layer again:

```
The evolution of the Knowledge layer:
  Stage 1: CLAUDE.md — always active (always read)
  Stage 2: Skills    — activated on explicit request (commands like /commit)
  Stage 3: Rules     — activated based on context (when Claude judges it necessary)
```

Split the files into the `.claude/rules/` folder,
and Claude **selectively loads only the files it needs based on context.**

```
.claude/rules/
  coding-style.md       ← immutability, file size, naming
  testing.md            ← TDD, coverage criteria
  security.md           ← secret management, OWASP checks
  git-workflow.md       ← commit format, PR process
  agents.md             ← agent orchestration rules
  development-workflow.md ← full development process
  performance.md        ← model selection, context window management
```

Now CLAUDE.md is lean:

```markdown
# My Project
Next.js + TypeScript project.
For rules, refer to .claude/rules/.
```

---

<!-- section:workshop -->
## The Rules Loading Mechanism: How "Context-Based Selection" Works

Rules files are loaded in two ways.

### Method 1: Automatic Loading (glob patterns)

Write a glob pattern in `CLAUDE.md` and the matching files are automatically loaded:

```markdown
# CLAUDE.md

<claude_config>
  <rules>
    <!-- always load -->
    <rule glob=".claude/rules/coding-style.md" />
    <!-- load when working on TypeScript files -->
    <rule glob=".claude/rules/typescript/**/*.md" when="*.ts,*.tsx" />
    <!-- load when working on test files -->
    <rule glob=".claude/rules/testing.md" when="*.test.*,*.spec.*" />
  </rules>
</claude_config>
```

### Method 2: Implicit Loading (Claude's judgment)

Claude judges for itself by looking at the **filenames** of files in `.claude/rules/`:

```
Claude is writing code:
  → "coding-style.md is there. I should read it."
  → "security.md seems relevant too."

Claude is preparing to commit:
  → "git-workflow.md is needed."

Claude is about to run an agent:
  → "I should check agents.md."
```

**The filename is the metadata itself.** A well-chosen filename guides Claude's judgment.

Bad examples: `rules1.md`, `misc-rules.md`, `stuff.md`
Good examples: `coding-style.md`, `security.md`, `git-workflow.md`

---

## What Rules Solved

### Selective Loading
Writing code → load `coding-style.md` + `security.md`
Preparing to commit → load `git-workflow.md`
Creating a plan → load `development-workflow.md` + `agents.md`

Claude looks at "what it's doing right now" and reads only the relevant rules.
Unnecessary context consumption disappears.

### Independent Maintenance
If the security team updates `security.md`, it has no impact on other files.
To change the testing standards, just open `testing.md`.

### Language-Based Layering
More sophisticated structures are also possible:

```
.claude/rules/
  common/
    coding-style.md     ← common to all languages
    security.md
  typescript/
    coding-style.md     ← TypeScript-specific rules (override common)
  python/
    coding-style.md     ← Python-specific rules
```

TypeScript project → `common/coding-style.md` + `typescript/coding-style.md`
Python project → `common/coding-style.md` + `python/coding-style.md`

Like CSS specificity, the more specific rule wins.

---

## Rules vs. CLAUDE.md: When to Use Which?

| | CLAUDE.md | Rules |
|--|----------|-------|
| **Purpose** | Project overview, core context | Rules and guidelines |
| **Content** | Stack, purpose, key constraints | Coding style, workflows, security |
| **Length** | Keep short (essentials only) | Detailed by topic |
| **Update frequency** | Rarely | As needed |

**CLAUDE.md**: "What this project is"
**Rules**: "How to work in this project"

---

## Real-World Example: Rules File Structure

```
.claude/rules/
  coding-style.md        immutability, file size, error handling
  agents.md              when to use which agent
  development-workflow.md research→plan→TDD→review→commit
  git-workflow.md         conventional commits, PR process
  testing.md             TDD, 80% coverage
  security.md            secret management, immediate-flag patterns
  performance.md         model selection, context window management
```

The structure becomes clear when you look at actual file contents:

### `coding-style.md` (excerpt)

```markdown
# Coding Style

## Immutability (CRITICAL)

Never mutate existing objects — always create and return a new one:

// Wrong: mutating the original
user.name = newName

// Right: returning a new copy
return { ...user, name: newName }

## File Organization

Many small files > one big file:
- Generally 200–400 lines, max 800 lines
- Organized by feature/domain, not by type

## Completion Checklist

Before finishing a task:
- [ ] Functions are small (under 50 lines)
- [ ] No deep nesting (max 4 levels)
- [ ] No mutations
```

### `security.md` (excerpt)

```markdown
# Security Guidelines

## Patterns to Flag Immediately

| Pattern | Severity | How to Fix |
|---------|----------|-----------|
| Hardcoded secrets | CRITICAL | Move to environment variable |
| Shell commands with user input | CRITICAL | Use safe API |
| String concatenation SQL queries | CRITICAL | Parameterized queries |
| User input in innerHTML | HIGH | textContent or DOMPurify |

## Response to Security Issues

1. Stop immediately
2. Use the **security-reviewer** agent
3. Fix CRITICAL issues before continuing
```

### `git-workflow.md` (excerpt)

```markdown
# Git Workflow

## Commit Message Format

<type>: <description>

Types: feat, fix, refactor, docs, test, chore, perf, ci

Examples:
- feat: add user authentication
- fix: fix token refresh bug on login

## Pre-Commit Check

- [ ] No hardcoded secrets
- [ ] Remove console.log / print debug code
```

You can see that each file focuses on exactly one topic.
`coding-style.md` has no security rules, and `security.md` has no coding style.

---

> **💬** "Start most sessions in Plan mode. Go back and forth until you're satisfied. Once you've agreed on a plan in Plan mode, there are fewer mistakes when you move to implementation." — Boris Cherny, creator of Claude Code

<!-- section:reflection -->
## Beyond the Wall

With Rules, the internal Knowledge was systematized.
Jimin's Claude knew the coding style, the security rules, and the testing standards.

Inside the codebase, Claude was omnipotent.

But one day, after fixing a bug, Jimin naturally said:

```
Jimin: I fixed this bug, so please close the related GitHub issue
Claude: I don't have access to GitHub.

Jimin: The task is done, change the Jira ticket to Done
Claude: I don't have access to Jira.

Jimin: Analyze this data (Supabase DB)
Claude: I don't have access to the database.
```

The code was fixed. But to close the issue she had to open a browser.
To update the ticket she had to log into Jira.
To see the data she had to launch a DB client.

**Claude was trapped on an island called the codebase.** It could see GitHub, Jira, Slack, and the database across the water, but it couldn't get there.

*"What if there were a standardized way to make external services into Claude's tools?"*

→ **[Ch09. MCPs — From Island to Continent](./06-mcps.md)**
