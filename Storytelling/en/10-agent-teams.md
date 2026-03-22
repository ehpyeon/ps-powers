# Agent Teams — You Can't Do It Alone

> **Previously**: Jimin learned to manage context with /compact and hand off sessions with HANDOFF.md.
> The single-agent memory problem was solved.
> But with 3 days until launch — frontend, backend, tests — one agent wasn't going to be enough...

> Harness = Tools + Knowledge + **Context** + Permissions
>
> Agent Teams **scale Context horizontally**.
> *"When the task is too big for one, delegate to teammates"*

---

## Three Days Until the Friday Demo

Seoyeon sent a message on Slack.

> Seoyeon: Investor demo confirmed for Friday. The entire payment system needs to be working.

Jimin tallied the remaining work.

```
What's left:
  □ Stripe webhook handler (backend)      — 4 hours
  □ Payment UI components (frontend)      — 3 hours
  □ Payment flow E2E tests                — 2 hours (after both above complete)
  □ Error handling + logging              — 2 hours
  □ Deployment + monitoring setup         — 1 hour

Total time needed: ~12 hours
Actual time remaining: 3 days... but other features too.
```

The problem was this: **Claude can only do one thing at a time.**

Use Subagents (Ch04)? The parent has to wait. Vertical structure. You can delegate code review, but **you can't have frontend and backend implemented simultaneously.**

Use Background Tasks (Ch09)? Only I/O is parallelized. You can write code while `npm install` runs in the background, but **LLM reasoning is still one at a time.**

What Jimin needed was **multiple Claudes thinking at the same time.**

---

## The Difference Between Subagent and Teammate

Let's recall the Subagent from Ch04:

```
Subagent (vertical):
  Jimin → Claude (parent) → code-reviewer (child)
  The parent waits. When the child finishes, it receives only a summary.
  The child is disposable. It's born, does its work, and disappears.

Teammate (horizontal):
  Orchestrator
    ├── backend-agent (runs independently)
    ├── frontend-agent (runs independently)
    └── qa-agent (runs independently)
  Nobody waits. Each does their own work.
  Teammates are resident. They cycle through multiple tasks.
```

**A Subagent is a one-time specialist.** Ask them something, get an answer, they disappear.
**A Teammate is a resident team member.** They clock in, check the task board, find work, and wait when there's nothing to do.

---

## Task Board: The Same One from Ch08

The "task board" of Agent Teams is the **Task System itself** from Ch08.

```
Ch08 (solo):
  Jimin → Claude → .tasks/task_*.json (read and write alone)

Ch10 (team):
  Orchestrator  ─┬── .tasks/task_*.json ── shared task board
  backend-agent ──┤   (all agents have access)
  frontend-agent ─┤
  qa-agent ───────┘
```

Same `.tasks/` infrastructure. Same `blockedBy`/`blocks` DAG. The difference is that multiple agents access it **simultaneously**.

---

<!-- section:workshop -->
## Message Bus: The Mailbox

When there's a team, there needs to be communication. But agents **can't see each other's context.** (That's the whole point of Context Isolation.)

The solution: file-based mailboxes.

```
.team/
  config.json           ← team member list and status
  inbox/
    backend-agent.jsonl  ← backend agent's mailbox
    frontend-agent.jsonl ← frontend agent's mailbox
    lead.jsonl           ← orchestrator's mailbox
```

It works exactly like a real company email system:

```
Mailbox analogy:

Sending:
  Orchestrator → sends a message to backend-agent
  → one line appended to backend-agent.jsonl
  → accumulates (never deleted)

Reading:
  backend-agent opens its mailbox
  → reads all accumulated messages
  → removes read messages from the mailbox (so the same message isn't read twice)
  → this is called "drain-on-read" (empty as you read)
```

> This is the same principle as the "buzzer" pattern from BackgroundManager in Ch09. Accumulate, then collect all at once when checking.

Each agent checks its mailbox before every round of thinking:

```
Each agent iteration:
  1. "Any new messages?" → check mailbox
  2. If there are messages → read and consider them
  3. Claude decides → determines next action
  4. Task complete → return to step 1
```

---

## A Teammate's Lifecycle

Subagents were simple: get work, do it, disappear. Like a part-timer.

Teammates are different. **Like full-time employees — they clock in, look for work, wait when there's none, and clock out.**

```
A Teammate's day (analogy):

Clock in (spawn)
  → "What's there to do today?" → start working (WORKING)
  → Task complete → "Anything else?" (IDLE)
  → New instructions arrive in mailbox → back to work (WORKING)
  → Task complete → "Anything else?" (IDLE)
  → Nothing to do for 1 minute... → clock out (SHUTDOWN)
```

```
Actual flow:

Orchestrator: "backend-agent, implement the payment API"
→ backend-agent: WORKING 🔨 (implementing...)
→ backend-agent: IDLE 💤    (done, waiting for next instructions)
→ (new message in mailbox!)
→ backend-agent: WORKING 🔨 (starting new task)
→ backend-agent: IDLE 💤    (done)
→ (60 seconds with no messages... task board also empty...)
→ backend-agent: SHUTDOWN 🚪 (automatically clocks out)
```

In IDLE state, an agent checks **every 5 seconds**. Like checking a smartphone every 5 seconds:

```
Agent in IDLE state (pseudocode):

Every 5 seconds (max 60 seconds = 12 times):
  1. "Any messages?" → check mailbox
     → if yes → read → switch to WORKING! (start working)

  2. "Any unassigned tasks on the board?" → scan board
     → conditions: not started yet + no owner + not blocked
     → if yes → I'll take it (atomic claim) → WORKING!

  3. Neither → wait 5 more seconds...

If still nothing after 12 checks → SHUTDOWN (clock out)
```

> **What is "Atomic claim"?** Two agents must not take the same task at once. Like reserving a meeting room — first come, first served. The system tells the second agent "this task has already been claimed by another agent."

**An agent that finds its own work.** The leader doesn't need to assign each of 10 tasks one by one. Agents scan the task board themselves and claim unassigned tasks.

---

## Team Protocols: Ask Before Dangerous Work

Jimin had an anxious moment while running the team.

```
backend-agent: "I'll delete the legacy table and migrate to the new schema."
```

Jimin: "Wait, that's the production DB...!"

Teams need protocols. **A procedure for getting approval before risky work.** Like asking "is it okay if I do this?" in real life.

```
Approval protocol (analogy: authorization system):

Teammate → Leader:
  "I intend to do the following: delete legacy table and create new table"
  "Risk level: High ⚠️"
  → sends approval request via mailbox

Leader → Teammate:
  "Rejected. Directly deleting the table is dangerous.
   Please write a migration script first."
  → sends rejection response via mailbox

Teammate:
  → received rejection, so original plan is cancelled
  → switches to migration script approach
```

> This "request → approval/rejection" pattern is identical to a company's authorization system. Ask before doing risky things, execute only after getting permission.

The **shutdown protocol** works the same way:

```
Leader → Teammate: "Wrap up and shut down" (shutdown_request)
Teammate → Leader: "I'll shut down after completing current work" (shutdown_response)
→ In-progress work doesn't get left half-finished
```

---

## After /compact: "Who Am I?"

After long operation, when an agent's context gets compacted, an interesting problem emerges.

```
Before /compact: "I am backend-agent, responsible for the payment API"
After /compact: "..."  (identity information lost in compression)
```

Solution: when context becomes short, automatically re-inject identity:

```python
if len(messages) <= 3:  # detect compaction
    messages.insert(0, {"role": "user",
        "content": f"<identity>You are '{name}', role: {role}. "
                   f"Continue your work.</identity>"})
```

The agent never forgets "who it is."

---

## Jimin's Team Gets Moving

Jimin turned on Claude Code's experimental Agent Teams:

```bash
CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 claude
```

```
Jimin: Implement the entire payment system

Orchestrator:
  Breaking down work:
  [TaskCreate: "Stripe webhook handler", pending]
  [TaskCreate: "Payment UI components", pending]
  [TaskCreate: "Payment flow E2E tests", pending, blockedBy: [1,2]]

  [Parallel dispatch]:
  → backend-agent: "task 1 — implement webhook handler"
  → frontend-agent: "task 2 — implement payment UI"
  (both agents running simultaneously)

  (completion notifications received)
  → qa-agent: "task 3 — E2E tests" (1 and 2 now complete)
```

She opened three tmux panes to watch in real time:

```bash
tmux new-session -d -s team
tmux send-keys 'CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 claude' Enter
tmux split-window -h
tmux send-keys 'tail -f .tasks/events.jsonl | jq .' Enter
tmux split-window -v
tmux send-keys 'watch -n 2 "cat .tasks/task_*.json | jq .status"' Enter
tmux attach -t team
```

Three agents, each working independently. Without knowing the others existed, coordinating only through the mailbox and task board.

Twelve hours of work was done in four.

She messaged Seoyeon on Slack. "The demo should be ready."

---

## Autonomous Agents: Teammates That Find Their Own Work

Once the team was stable, Jimin pushed one step further.

At first, the orchestrator assigned all tasks. "backend-agent, do this" → "frontend-agent, do that." But as tasks grew past 20, the orchestrator became a bottleneck.

*"Could teammates look at the task board themselves and pick up work?"*

This is the pattern of agents **autonomously scanning and claiming tasks** in IDLE state:

```
Autonomous Agent's Idle Cycle:

Every 5 seconds (max 60 seconds = 12 times):

  1. "Any new instructions in the mailbox?" → check mailbox
     → if yes → read → switch to WORKING state

  2. "Any unassigned tasks on the board?" → scan Task Board
     → conditions: status == "pending"
                   AND owner == null
                   AND all blockedBy completed
     → if yes → Atomic Claim (I'll take it) → WORKING

  3. Neither → wait 5 more seconds...

If nothing after 12 checks → SHUTDOWN (auto clock-out)
```

Why this pattern matters: **scale**. The orchestrator doesn't need to direct 10 team members one by one — post tasks to the board and teammates pick them up themselves.

### Request-Response Protocol

When an autonomous teammate wants to do something risky, what happens?

Solved with a **structured request-response** pattern:

```
Protocol flow (state machine):

  [Request]                    [Response]
  ┌────────────┐           ┌────────────┐
  │ request_id │──────────→│ request_id │ (matched by same ID)
  │ type: plan │           │ decision:  │
  │ content:   │           │  approved  │
  │  "DB delete"│          │  OR        │
  └────────────┘           │  rejected  │
                           │ reason:    │
                           │  "..."     │
                           └────────────┘

State transitions:
  pending → approved  (execution allowed)
  pending → rejected  (plan change needed)
```

Multiple protocols can be implemented with the same FSM:
- **Plan approval**: "Is it okay to proceed with this plan?"
- **Shutdown**: "Please wrap up and shut down"
- **Review**: "Please review this code"

All are request-response pairs connected by `request_id`.

---

> **💬** "Use tmux and worktree together to run 5 Claudes simultaneously. Each terminal tab works independently while coordinating through the task board." — Boris Cherny, creator of Claude Code

<!-- section:reflection -->
## Harness Perspective: The Evolution of Context Isolation

```
Ch04 (Subagent): vertical isolation
  Parent → Child (clean context)
  Child → Parent (returns summary)
  Parent waits.

Ch10 (Agent Teams): horizontal isolation
  Agent A ──┐
  Agent B ──┼── Shared Task Board + Message Bus
  Agent C ──┘
  Nobody waits. Each has independent context.
```

---

## "My Code Is Gone"

The team was working well. But the next morning, Jimin checked the results and felt a chill.

The JWT code in `src/auth/middleware.ts` that backend-agent had modified was missing.
The qa-agent had **overwritten it** while adding test helpers to the same file.

```
10:00:00  backend-agent: modified middleware.ts (added JWT)
10:00:03  qa-agent:      modified middleware.ts (added helpers)
→ qa-agent's version is the last save → backend's changes lost 💥
```

An hour of work was gone. Two days until launch.

*"If agents touch the same file at the same time, this happens.
Actually, more fundamentally — they shouldn't even be in the same directory."*

→ **[Ch13. Worktree Isolation — My Code Is Gone](./11-worktree-isolation.md)**
