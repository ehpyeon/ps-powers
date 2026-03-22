# Worktree Isolation — Each Working in Their Own Room

> **Previously**: Jimin used Agent Teams to run three agents simultaneously.
> backend-agent, frontend-agent, qa-agent. Two days until launch.
> All three agents started working at the same time. And five minutes later...

> Harness = Tools + Knowledge + **Context** + **Permissions**
>
> Worktree Isolation **isolates Context at the filesystem level**.
> *"Each works in its own directory, no interference"*

---

## "My Code Is Gone"

Two days until launch.

Jimin ran three agents simultaneously with Agent Teams (Ch10).

```
backend-agent:  implementing payment API — modifying src/auth/middleware.ts
frontend-agent: implementing payment UI — working on separate files
qa-agent:       writing auth tests — reading + modifying src/auth/middleware.ts
```

Five minutes later, a strange message appeared in Jimin's terminal.

```
backend-agent: ✅ JWT validation logic improved. File saved.
qa-agent:      ✅ Auth tests added. File saved.
```

Both succeeded. Jimin felt relieved and went to check the results.

She opened `git diff`. And froze.

**backend-agent's JWT code was gone.** The qa-agent had saved the same file later and overwritten it.

```
Timeline:
  10:00:00  backend-agent: modified middleware.ts (added JWT)
  10:00:03  qa-agent:      modified middleware.ts (added test helpers)
  10:00:03  → qa-agent's version is the last → backend's changes gone
```

**An hour of JWT code was gone.** With two days until launch.

There were even more serious problems:

```
backend-agent: git add src/auth/
qa-agent:      git add src/auth/   (simultaneously!)
→ Changes from both agents get mixed in the same staging area
→ Impossible to tell which commit belongs to which agent
```

Hyunwoo was watching from the next desk. "That's exactly why I said it's dangerous to trust AI with this."

Jimin didn't answer Hyunwoo. Her mind was racing.
*"For agents not to interfere with each other... they can't touch the same files.
Actually, more fundamentally — **they shouldn't be in the same directory.**"*

---

<!-- section:workshop -->
## Git Worktree: Same Repository, Different Rooms

Git already had a feature that solved this problem.

**git worktree**: check out the same repository in multiple directories simultaneously.

```
Before (conflicts):
  /project/                ← all agents work here
    src/auth/middleware.ts  ← backend modifies, qa modifies... 💥

After applying worktree:
  /project/                          (main branch)
  /project/.worktrees/agent-auth/    (feature/jwt branch)
  /project/.worktrees/agent-qa/      (test/auth-tests branch)
```

The three directories **share the same git repository** but each has **independent files**.

When agent-auth modifies `.worktrees/agent-auth/src/auth/middleware.ts`,
there is **zero effect** on agent-qa's `.worktrees/agent-qa/src/auth/middleware.ts`.

Because they are physically different files.

Jimin was skeptical at first. "Really no conflicts?"

Really, none. **Each agent has been given their own room.** They live in the same building (repository), but their rooms (worktrees) are separate.

---

## Control Plane / Execution Plane

Connecting worktree to the Task System (Ch08) yields a powerful structure:

```
Control Plane (.tasks/):
  Shared task board — all agents can read and write
  → Task status, dependencies, owner information
  → Single source of truth for "who is doing what"

Execution Plane (.worktrees/):
  Agent-exclusive execution space — only the assigned agent has access
  → Actual code modifications
  → Physically isolated from other agents' work
```

Tasks and worktrees are bound together:

```json
// .tasks/task_1.json
{
  "id": 1,
  "subject": "Improve JWT validation logic",
  "status": "in_progress",
  "owner": "agent-auth",
  "worktree": "agent-auth"    // ← this Task runs in this Worktree
}
```

When an agent starts a task:
1. Create a new git worktree → check out an independent branch
2. Bind the worktree to the Task JSON
3. Modify code only within that worktree
4. Task complete → PR or merge → clean up worktree

---

## Implementation in Claude Code

One line — `isolation: worktree` — in the agent definition file:

```yaml
---
name: feature-implementer
description: Independent feature implementation. No file conflicts during parallel work.
tools: ["Read", "Write", "Edit", "Bash"]
isolation: worktree    # ← this one line
---
```

When this agent runs, Claude Code automatically:
1. Creates a new git worktree
2. Runs the agent inside that worktree
3. Auto-cleans up if there are no changes
4. Preserves the branch commit if there are changes

### Safety Check: .gitignore Is Required

Before using worktree, always verify:

```bash
# Check if .worktrees/ is in gitignore
git check-ignore -q .worktrees 2>/dev/null
echo $?  # 0 means OK, 1 means you need to add it

# If missing, add it first
echo ".worktrees/" >> .gitignore
git add .gitignore && git commit -m "chore: add worktree directory to gitignore"
```

Without this, worktree contents could accidentally get committed to the repository. **Always check first.**

### Integration with Hooks

The project's `settings.json` has worktree lifecycle hooks configured:

```json
{ "event": "WorktreeCreate", "command": "python3 hooks.py", "async": true }
{ "event": "WorktreeRemove", "command": "python3 hooks.py", "async": true }
```

When a worktree is created, a sound plays; when removed, a log is written.
The Permissions layer from Ch02 (Hooks) is active here too.

---

## Event Stream: Recording What Happened

When worktrees and tasks are bound, a **lifecycle** emerges. Creation, work, completion, cleanup. Without recording this process, there's no way to track "what happened when and how."

```
events.jsonl — lifecycle log:

{"ts":"10:00:01","event":"worktree_create","agent":"backend-agent","branch":"feature/jwt","path":".worktrees/agent-auth"}
{"ts":"10:00:02","event":"task_bind","task_id":1,"worktree":"agent-auth"}
{"ts":"10:15:30","event":"task_complete","task_id":1,"agent":"backend-agent"}
{"ts":"10:15:31","event":"worktree_merge","branch":"feature/jwt","target":"main","conflicts":0}
{"ts":"10:15:32","event":"worktree_remove","path":".worktrees/agent-auth"}
```

All events are stored in an **append-only JSONL file**. Only additions, never deletions.

What this log provides:
- **Audit**: which agent did what and when
- **Recovery**: roll back to the last known good state on conflict
- **Replay**: re-execute the same sequence

```bash
# Real-time monitoring
tail -f .tasks/events.jsonl | jq '.'

# View only a specific agent's activity
cat .tasks/events.jsonl | jq 'select(.agent == "backend-agent")'
```

---

## Three Layers of Isolation

At this point, Jimin started to see the big picture.

In Ch04 (Agents), **messages were isolated**. Starting with `messages=[]` to block noise.
Here, **files are isolated**. git worktree to block conflicts.
Going deeper? **Processes are isolated**. Containers to block system-level risks.

```
Three layers of isolation — same principle, different depth:

Layer 1: Message isolation (Ch04)
  messages=[] → prevents context pollution
  Target: Claude's short-term memory

Layer 2: File isolation (here)
  git worktree → prevents file conflicts
  Target: filesystem

Layer 3: Process isolation (Container)
  Docker → system-level safety
  Target: OS processes, entire network
```

```
What Worktree prevents:
  ✅ One agent overwriting another agent's files
  ✅ git staging/commit conflicts

What Worktree cannot prevent:
  ❌ rm -rf / (deleting system directories)
  ❌ infinite loop processes (CPU monopolization)
```

For genuinely dangerous work (overnight autonomous execution, installing untrusted packages), use containers:

```bash
docker run -it -v $(pwd):/workspace anthropic/claude-code
# Inside the container: files, network, processes are all isolated
# Failures have no effect on the host
```

**All three layers share the same principle: least privilege.** Give agents only what they need, and block everything else.

---

<!-- section:reflection -->
## Jimin's Team Becomes Safe

After applying worktree:

```
backend-agent:  JWT work in .worktrees/agent-auth/
frontend-agent: UI work in .worktrees/agent-frontend/
qa-agent:       test work in .worktrees/agent-qa/

Results:
  backend-agent: ✅ JWT validation complete → feature/jwt branch
  frontend-agent: ✅ Payment UI complete → feature/payment-ui branch
  qa-agent: ✅ Auth tests complete → test/auth-tests branch

  Merge all three branches to main in sequence.
  Conflicts? Git auto-resolves or Jimin reviews.
```

The kind of accident where the JWT code disappeared an hour ago is now **physically impossible**.

Hyunwoo said: "...I'll give you that."

---

## The Eve of Launch, One Last Problem

The team was running smoothly. Agents working in their own worktrees without conflicts.
One day until launch.

But when Jimin opened a new session, Claude asked:

```
Claude: What package manager does this project use?
```

Jimin stopped. **She had clearly taught it yesterday.** "Use pnpm." And that they use Drizzle ORM. That they need to watch out for N+1 queries.

But everything was forgotten when the session changed.

```
Monday: "Use pnpm" → learned ✅
Tuesday: npm install [fails] → have to teach again
Wednesday: npm install [fails] → "Are you serious...?"
```

Can't you just put it in CLAUDE.md? This isn't the kind of knowledge that goes in CLAUDE.md.
This is **operational knowledge discovered while working**.
Things the agent learned through experience. Not things a human knew in advance.

*"Could the agent remember on its own? Is there a way for learning to persist even after a session ends?"*

→ **[Ch14. Agent Memory — Finally, a Seasoned Hire](./12-agent-memory.md)**
