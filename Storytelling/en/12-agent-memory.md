# Agent Memory — Finally, a Seasoned Hire

> **Previously**: Worktree Isolation resolved file conflicts among team agents.
> Each agent working in its own room, merging when done.
> The product launched. Seoyeon's investor demo was a success. Hyunwoo said "I'll give you that."
> But in the first week of maintenance, a strange sense of déjà vu began...

> Harness = Tools + **Knowledge** + Context + Permissions
>
> Agent Memory lets **agents write and accumulate Knowledge on their own**.
> *"The agent should get smarter, not restart from zero each session"*

---

## "Another New Hire"

The product launched. Seoyeon's demo was a success.

Jimin entered maintenance mode. She opened a new session to fix a bug.

```
Jimin: Fix the bug where the session isn't persisting after user login
Claude: Sure, let me get oriented on the project first...
        What package manager do you use?
```

Jimin stopped. **Claude asked this — the same Claude she had worked with every day throughout last week's launch sprint.**

"What package manager do you use?"

```
Last Tuesday: "Use pnpm" → learned ✅
Last Wednesday: pnpm used correctly ✅
Last Thursday: pnpm used correctly ✅
This Monday: "What package manager do you use?" ← ?!
```

Everything was forgotten when the session changed. Jimin muttered:

*"Another new hire."*

That was what she had said when she first met Claude back in Ch00. Since then she had created CLAUDE.md (Ch01), Skills (Ch03), and Rules (Ch05). But all of these were **explicit write-ups of knowledge a human already had in advance**.

What Jimin wants now is different. She wants Claude to **remember what it discovers while working on its own**.

"pnpm is used here" — Jimin could put that in CLAUDE.md in advance. But "N+1 query problems have occurred 3 times in this project" is a pattern Claude found while doing code reviews. This kind of **operational knowledge** cannot be written by a human in advance.

---

## The Problem Repeated

Claude's Context is erased when a session ends. No matter how much you teach it, you have to teach it again in the next session.

```
Session 1 (Monday):
Me: Install packages
Claude: npm install [fails]
Me: This project uses pnpm
Claude: Oh, pnpm install [succeeds] → got it now

Session 2 (Tuesday):
Me: Add a new package
Claude: npm install [fails]
Me: ...
```

```
Session 1 (last week):
Me: Run the DB migration
Claude: Running prisma migrate deploy... [succeeds]
Me: Wait, that's a production command! In dev, use prisma migrate dev
Claude: I'm sorry, understood.

Session 2 (this week):
Claude: Running prisma migrate deploy... [succeeds]
Me: Again!?
```

**An agent's Context is destroyed when the session ends.** No matter how much you teach it, you have to teach it again next session.

This can't be solved with CLAUDE.md or Rules. CLAUDE.md requires a human to know what to write in advance. But it's hard to put "this project uses pnpm" into CLAUDE.md ahead of time. These are **things the agent discovers while working**.

---

## The Solution: An Agent-Exclusive MEMORY.md

In early 2026, the Agent Memory system was added to Claude Code.

The core idea: **the agent records what it learns in a file, and that file is automatically read in the next session.**

Each agent has its own `MEMORY.md` file. When a session starts, the first 200 lines of this file are automatically injected into the system prompt.

```
At session start (automatic):

~/.claude/MEMORY.md → injected into system prompt
.claude/MEMORY.md   → injected into system prompt
.claude-local/MEMORY.md → injected into system prompt

Agent while working:
discover → record → update .claude/MEMORY.md

Next session:
This content is automatically injected again → agent remembers
```

---

<!-- section:workshop -->
## Three Memory Scopes

Memory is divided into three scopes. Like CSS specificity, the more specific scope takes precedence:

```
~/.claude/MEMORY.md          [User scope]
  Applies to: all projects
  Shared: personal (not committed to git)
  Example content:
    - "I prefer TypeScript"
    - "Always summarize in Korean when a task is complete"
    - "Never use --no-verify"

.claude/MEMORY.md            [Project scope]
  Applies to: this project
  Shared: team-shared (committed to git)
  Example content:
    - "This project uses pnpm (no npm)"
    - "DB migration: dev=prisma migrate dev, production=requires separate approval"
    - "Tests always use vitest, not jest"

.claude-local/MEMORY.md      [Local scope]
  Applies to: my local environment for this project
  Shared: personal (in gitignore)
  Example content:
    - "My local DB URL: postgresql://localhost:5432/dev_db"
    - "My dev port: 3001 (another service uses 3000)"
    - "In my local env, run services directly instead of Docker"
```

**Scope priority**: local > project > user

When the same setting exists in multiple scopes, the more specific scope wins.

---

## The Automatic Injection Mechanism: Why 200 Lines?

There's a reason only the first 200 lines are automatically injected.

```
System prompt cost:
  MEMORY.md 200 lines ≈ ~2,000 tokens
  Tokens consumed every conversation

When it exceeds 200 lines:
  → Split into topic files
  → Reference from MEMORY.md

Example:
  # MEMORY.md (keep under 200 lines)
  ## Key points
  - use pnpm (not npm)
  - detailed package management: memory/package-management.md
  - DB migration rules: memory/database-rules.md
  - API patterns: memory/api-conventions.md
```

200 lines = put only "core knowledge always needed" into the system prompt, reference the rest as needed. The sweet spot that minimizes Context costs while always maintaining essential knowledge.

---

## Memory Curation Lifecycle: Managing Memories

MEMORY.md isn't a write-once document. It must be managed like a living document:

```
Discovery phase:
  Agent learns a new pattern while working
  "This project uses React Query"
  "Uses Zod for schema validation"

Recording phase:
  Add to MEMORY.md
  - Agent records autonomously
  - Or via user commands like "/remember use pnpm"

Validation phase:
  Periodically review MEMORY.md
  "Is this content still accurate?"
  "What is no longer valid?"

Cleanup phase:
  Remove outdated content
  Update content where dependency versions have changed
  Resolve contradictions

Archive phase:
  Content no longer directly needed in current context
  but still useful as reference → move to memory/archive/
```

---

## MEMORY.md vs CLAUDE.md vs Rules — What's the Difference?

It's easy to confuse these three. The distinction clearly stated:

```
CLAUDE.md (always-active project information):
  Content: what the project is (relatively stable)
  Author: human (developer, team)
  Updates: rarely (when project structure changes)
  Example: "Next.js 14 + TypeScript + Tailwind CSS project"

Rules (.claude/rules/*.md, context-based selection):
  Content: how to work (workflow rules)
  Author: human (team decisions)
  Updates: when team policy changes
  Example: "Test coverage must be at least 80%"

MEMORY.md (operational knowledge the agent learned):
  Content: things the agent discovered through experience
  Author: agent (autonomously)
  Updates: whenever the agent discovers a new pattern
  Example: "use pnpm (based on npm install failure experience)"
```

**The key difference**: CLAUDE.md and Rules are explicit write-ups of knowledge a human already had. MEMORY.md automatically accumulates knowledge discovered by the agent during actual work.

---

## Auto-Memory: The Automatic Learning Mechanism

There are two ways to record in MEMORY.md:

```
Manual recording:
  User: "/remember this project uses pnpm"
  → Claude explicitly adds to MEMORY.md

Automatic learning (Auto-Memory):
  Claude records patterns it discovers while working on its own
  → Build commands, project structure, debugging insights
  → Learns without user instructions
```

Auto-Memory is the mechanism by which Claude automatically accumulates operational knowledge while working:

```
Session 1:
  Claude: npm install [fails]
  Claude: pnpm install [succeeds]
  → Auto-Memory: "this project uses pnpm"

Session 2:
  Claude: (confirms pnpm use from MEMORY.md)
  Claude: pnpm install [succeeds immediately]
```

**Specifically, when does Claude automatically record?**

```
Moments when auto-recording occurs:
  After a build/test failure, when the correct approach is found
    → records "npm install failed → pnpm install succeeded" pattern

  When the user explicitly corrects a pattern
    → "use pnpm here" → records

  When the same file/pattern is referenced repeatedly
    → "the Ok/Err pattern in src/lib/result.ts" → records

  When a project-specific build/run method is discovered
    → "this project uses turbo dev, not npm run dev" → records
```

**Auto-Memory isn't always accurate.** A single success doesn't always mean it's the correct pattern.
That's why the "validation phase" of the Memory Curation Lifecycle matters — periodically review MEMORY.md and fix incorrect memories.

Most operational knowledge accumulates via Auto-Memory. Even without the user doing "/remember" commands one by one, Claude records failure and success patterns on its own. This is why Claude gets better with each session.

---

## Searching Past Conversations: Finding Lost Memories

MEMORY.md is curated memory. But sometimes you want to search the past conversations themselves.
"What did we discuss about authentication last week?"

```bash
# Find past conversation files by keyword
grep -l -i "authentication" ~/.claude/projects/*/*.jsonl

# Extract only user messages from a specific conversation
jq -r 'select(.type=="user") | .content' conversation.jsonl
```

Three layers of memory:
```
Original conversations (.jsonl files):
  Complete record, searchable via grep
  → "Archaeological dig" — everything is there, but unorganized

MEMORY.md:
  Core knowledge curated by the agent
  → "Library" — organized and categorized

CLAUDE.md:
  Always-active project information
  → "Name badge" — only the most important things
```

---

## Real Agent Memory Usage Examples

### code-reviewer Learning

```markdown
# .claude/agent-memory/code-reviewer/MEMORY.md

## Patterns in This Project

### Error handling
- Use Result type (instead of try-catch)
- Use Ok/Err functions from `src/lib/result.ts`
- Example: `return Err("User not found")` (no throwing)

### Database
- Uses Drizzle ORM (not Prisma)
- Queries always use `db.query.*` pattern
- N+1 issues found: 3 times (recurring problem)

### Authentication
- Session-based (next-auth), not JWT
- Protected routes: must use `withAuth` HOC
```

In the next session, the code-reviewer already knows these patterns. The time spent exploring the codebase from scratch disappears.

---

#### 🔨 Try It Now

1. Tell Claude Code: "Remember that this project uses pnpm"
2. End the session and open a new one
3. Ask: "What's the package manager?"
4. Check whether Claude remembers pnpm

#### ✅ What You Can Do After This Unit

- [ ] Make Claude remember operational knowledge
- [ ] Explain the difference between CLAUDE.md (prior knowledge) and MEMORY.md (learned knowledge)
- [ ] Solve the "explaining the same thing every day" problem that occurs without agent memory

> **❌ Anti-pattern:** Don't put guarantees in MEMORY.md. "Always use pnpm" belongs in CLAUDE.md or Rules. MEMORY.md is for learned **operational knowledge** — observations, not guarantees.

<!-- section:reflection -->
## Harness Perspective: The Knowledge Layer Completes

```
Evolution of the Knowledge layer:

Stage 1: CLAUDE.md (01-CLAUDE-md.md)
  Static knowledge — written by humans in advance
  "This project is Next.js 14"

Stage 2: Skills (03-skills.md)
  On-demand knowledge — loaded when needed
  "When /commit is run → load commit format rules"

Stage 3: Rules (05-rules.md)
  Context-based knowledge — selected by situation
  "When modifying TypeScript files → load TS rules"

Stage 4: MEMORY.md (Agent Memory)
  Dynamic knowledge — accumulated by agents themselves
  "use pnpm" (discovered through direct experience)

Now the agent knows more over time.
The agent on day one of the project and after six months are different.
```

---

## The Story Completes: From 2022 to Now

In 2022, Claude was a function that took text input and returned text output.

In 2023, the Tool Use API was added. Claude became able to request tools, see results, and make the next judgment. **The Agent Loop was born.**

Since then, the Harness has been built piece by piece:

```
Tools layer:
  Agent Loop      ← connected to the world
  Background Tasks ← I/O parallelized
  MCPs            ← connected to external services

Knowledge layer:
  CLAUDE.md       ← project memory injected
  Skills          ← on-demand expertise
  Rules           ← context-based rules
  MEMORY.md       ← agent's accumulated experience

Context layer:
  TodoWrite       ← in-session plan management
  Task System     ← persistent task graph
  Agents          ← isolated specialist agents
  Agent Teams     ← horizontal team collaboration
  /compact        ← infinite sessions via memory compression

Permissions layer:
  Hooks           ← intervene before/after actions
  Worktree        ← filesystem isolation
  settings.json   ← allow/deny configuration
```

**One pattern runs through it all**: each feature was born to solve the limitation exposed by the previous feature. And in solving it, new limitations are exposed.

This pattern will continue.
New problems arise → new Harness layers are added.

---

## Epilogue: Jimin's Transformation

Four weeks ago, Jimin installed Claude Code thinking:
"They say using AI coding tools makes you faster."

Four weeks later, Jimin's `.claude/` directory:

```
.claude/
  settings.json         ← 23 hooks, Permission Modes
  rules/                ← 7 topic-specific rule files
  skills/               ← /commit, /deploy, /review
  agents/               ← planner, code-reviewer, security-reviewer
  MEMORY.md             ← operational knowledge the agent has learned
```

Jimin was no longer a "Claude Code user." She was a **Harness Engineer**.

When Claude slows down: "the context is full" → `/compact`.
When Claude makes a mistake: "Knowledge is lacking" → add a Rule.
When Claude does something dangerous: "no Permission for that" → add a Hook.
When one agent isn't enough: → Agent Teams + Worktree.
When Claude repeats the same mistake: → "Let's check Memory."

Hyunwoo asked from the next desk. "Does using AI really make a difference?"

Jimin smiled.

"Claude isn't the smart part. **What matters is building the right environment.**"

And she opened a new session. Claude greeted her.

```
Claude: Hello, Jimin. This is the pnpm project, right?
        I remember fixing the N+1 query issue last week.
        What can I help you with today?
```

*"Finally, a seasoned hire."*

Even now, the Harness continues to evolve.

---

> *"You are not writing the intelligence. You are building the world the intelligence inhabits."*
> — Harness Engineering

But in the final sprint before launch, Jimin ran Agent Teams. backend-agent, frontend-agent, qa-agent — all on Opus.

The next morning, she opened the billing dashboard.

*"...Is this bill right?"*

→ **[Ch15. Token Economics — The Bill Arrived](./14-token-economics.md)**
