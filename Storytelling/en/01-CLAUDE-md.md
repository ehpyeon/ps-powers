# CLAUDE.md — The Onboarding Document for Claude

> **From the previous story**: We understood the secret of the Agent Loop.
> Thirty lines of a while loop. Claude requests a tool, the system runs it, and returns the result.
> Jimin was amazed. But the moment she started a new conversation, she found a problem...

> Harness = Tools + **Knowledge** + Context + Permissions
>
> CLAUDE.md is the **first implementation of the Knowledge layer**.
> *"I'm exhausted explaining this every time"*

---

## Origin Story: "The New Hire Who Starts Fresh Every Day"

The Agent Loop was complete. Claude could now read files, run code, see results, and decide what to do next.

But there was a critical problem.

**Claude started from a blank slate at the beginning of every session.**

```
# What Claude knows (at the start of a conversation)
- General programming knowledge ✅
- That it is Claude ✅
- What this project is ❌
- What coding rules are used here ❌
- What the tech stack is ❌
- What to watch out for ❌
```

From a Harness perspective, this is a **Harness with no Knowledge layer**.

```
Claude Code (early) = agent loop + tools
                    ← No Knowledge!
```

Developers had to manually inject Knowledge every time:

```
Me: Our project uses Next.js 14, TypeScript, and Tailwind.
    We use Vitest for testing, and pnpm as the package manager.
    Components go under the feature folder structure.
Claude: Got it!
(Next day)
Me: Create a button component
Claude: What tech stack do you use?
Me: ...
```

---

## The Solution: Automatic Knowledge Injection

The solution Anthropic chose was elegantly simple.

*"At the start of a conversation, automatically read a file from the project root and inject it into the system prompt."*

The birth of `CLAUDE.md`.

```
When Claude Code starts:
1. Look for CLAUDE.md in the project root
2. Inject the file contents into the system context
3. Claude already "knows" the project before the conversation begins
```

```markdown
# My Project

## Tech Stack
- Next.js 14, TypeScript, Tailwind CSS
- Vitest for testing, pnpm as package manager

## Code Style
- Feature-based folder structure
- Functional components only, no default exports
```

Write this once, and you never have to explain again.

---

## What CLAUDE.md Does in the Harness

```
Harness = Tools + Knowledge + Context + Permissions
                    ↑
              CLAUDE.md fills this in
```

CLAUDE.md is the **always-active Knowledge** in the Claude Code Harness.

It is automatically injected into every conversation, for every agent.

Think of Claude as a new team member:
- Should you give a company introduction every time they show up to work? → ❌ Inefficient
- Give them an onboarding document on day one, and never do it again? → ✅ CLAUDE.md

**CLAUDE.md is the onboarding document for Claude.**

---

<!-- section:workshop -->
## The Hierarchy of CLAUDE.md

Over time, CLAUDE.md became more sophisticated.
**Where you put it** determines the scope of its effect:

```
~/.claude/CLAUDE.md             ← applies to all projects (global knowledge)
~/projects/my-app/CLAUDE.md     ← applies only to this project
~/projects/my-app/src/CLAUDE.md ← applies only within this folder
```

This made it possible to apply different rules per package in a monorepo:
```
packages/
  frontend/CLAUDE.md   ← React + TypeScript rules
  backend/CLAUDE.md    ← Node.js + PostgreSQL rules
  shared/CLAUDE.md     ← shared rules
```

---

## CLAUDE.md vs Rules: The Evolution of Knowledge

CLAUDE.md became too popular. Developers started stuffing more and more into it.

```markdown
# My Project (CLAUDE.md one year later...)

## About... (10 lines)
## Tech Stack... (15 lines)
## Coding Rules... (50 lines) ← growing
## Testing Standards... (30 lines) ← growing more
## Security Guidelines... (40 lines) ← even more
## Git Workflow... (30 lines)
## Performance... (25 lines)
...total: 350 lines
```

**The Knowledge layer became too unwieldy to manage as a single file.**

This was the seed from which the Rules system was born.
Knowledge would be divided by topic, and Claude would load only what it needed.

The principle:
- **CLAUDE.md**: "What this project is" (short, essentials only)
- **Rules**: "How to work here" (detailed, by topic)

---

## The Core Principle

**CLAUDE.md is the README that Claude reads.**

It doesn't need to be verbose like a README written for humans.
Claude already knows programming and understands common patterns.
You only need to tell it **what is specific to this project.**

```markdown
# Good CLAUDE.md
This project uses NextJS 14 App Router + Supabase backend.
We use pnpm. For errors, always check the server logs.
Never directly modify src/lib/auth.ts (legacy code).

# Bad CLAUDE.md (too verbose)
TypeScript is a type-safe version of JavaScript created by Microsoft.
The language was first released in 2012 and...
```

---

## Solving the Cold Start Problem: /init

You're told to write a CLAUDE.md, but at the start you don't know what to put in it.
**To write CLAUDE.md you need to know the project, but for Claude to know the project it needs CLAUDE.md.**

The `/init` command solves this bootstrapping paradox.

```
$ claude
Me: /init

Claude: Scanning project...
        Analyzing package.json, tsconfig.json, .gitignore...
        Mapping out src/ structure...

        Generated CLAUDE.md:
        - Tech Stack: Next.js 14, TypeScript, Tailwind
        - Package Manager: pnpm
        - Test Framework: Vitest
        - Key directory structure included
```

`/init` has Claude scan the project and auto-generate a draft CLAUDE.md.
It's not perfect, but it's far better than starting from an empty file.
**Generate a draft, then a human refines it.** That is the correct workflow.

---

## The Grammar of Good Instructions: 5 Prompting Patterns

CLAUDE.md, Rules, Skills, Agent definitions... all of these are **instructions** given to Claude.
What is the difference between a good instruction and a bad one?

```
5 patterns:

1. Specific requirements    "Next.js 14 App Router, TypeScript strict mode"
                            (vague: "use a web framework")

2. Step-by-step guidance    "1. Define types first 2. Implement API route 3. Write tests"
                            (vague: "implement it")

3. Specify output format    "include tests", "add comments"
                            (vague: no format specified)

4. Reference context        "refer to src/lib/auth.ts", "@filename"
                            (vague: "refer to existing code")

5. Prohibition instructions "never modify src/legacy/", "no default exports"
                            (vague: no prohibitions mentioned)
```

These 5 patterns don't only apply to CLAUDE.md.
They are the **common grammar of instructions** that applies everywhere —
Rules files, Skill definitions, Agent descriptions, and beyond.

```markdown
# Bad Rules file
Write good code.

# Good Rules file (using the 5 patterns)
## Immutability (CRITICAL)                              ← specific requirement
Never mutate existing objects; return a new copy        ← step-by-step guidance
return { ...user, name: newName }                       ← output format (code example)
Refer to the Ok/Err pattern in src/lib/result.ts       ← reference context
Never directly modify Array.prototype                   ← prohibition instruction
```

---

> **⚠️ Warning:** Once CLAUDE.md exceeds 200 lines, Claude starts ignoring rules. Keep only the essentials, and move the details into Rules (Ch08).

> **💬** "Share CLAUDE.md with the whole team and update it multiple times a week. When you tag @claude on a PR, have CLAUDE.md updates included in that PR." — Boris Cherny, creator of Claude Code

---

#### 🔨 Try It Now

1. Create a `CLAUDE.md` file in your project root
2. Write the tech stack (language, framework) and three rules
3. Open a Claude Code session and ask "what is this project?"
4. Verify that Claude answers based on the contents of CLAUDE.md

#### 🤔 What Will Break?

Jimin deletes CLAUDE.md and tells Claude "implement an authentication system." What happens?
Claude doesn't know the project's tech stack. Whether it's Express or Next.js, JWT or sessions — it guesses. The result doesn't fit the project and has to be redone from scratch.

#### ✅ What You Can Do After This Unit

- [ ] Write a CLAUDE.md and confirm Claude reads it automatically
- [ ] Summarize the project overview, tech stack, and key rules in under 200 lines
- [ ] Explain the difference between a new session with and without CLAUDE.md

<!-- section:reflection -->
## The Next Story

CLAUDE.md created the Knowledge layer.
Claude started remembering the project, and began working with more confidence.

Editing files, running code, firing commands...

*"But when Claude takes a certain action, I want to do something too.
I want lint to run automatically after a file is saved,
I want a sound notification when work is done,
and I want to block dangerous commands before they run."*

This was the demand for the **Permissions layer** of the Harness.

→ **[Ch03. Hooks — What Happened That Night](./02-hooks.md)**
