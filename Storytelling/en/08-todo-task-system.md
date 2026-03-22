# TodoWrite & Task System — An Agent Without a Plan Will Drift

> **Previously**: Jimin packaged workflows like /commit and /deploy using Skills.
> The repetition was gone. But when she asked Claude to implement a 10-step payment system,
> Claude started losing the thread around step 5...

> Harness = Tools + Knowledge + **Context** + Permissions
>
> The Task System **externalizes Context** so that plans survive.
> *"An agent without a plan drifts"*

---

## "Where Did You Leave Off?"

Seoyeon sent a message on Slack.

> Seoyeon: Can we demo the payment system at sprint review? It's in two weeks.

Jimin asked Claude to implement it.

```
Jimin: Implement OAuth 2.0 + Stripe payment integration
```

Claude got to work. An hour passed.

```
Jimin: Where did you leave off?
Claude: Hmm... I worked through several things...
        I modified the DB schema... ah, I also created the API routes...
        I think I wrote some tests too... but exactly where I am is...
```

**An hour of work, and it doesn't know where it is.**

Jimin checked the files herself. Steps 1–3 were clean. But from step 4 onward, something was off. Claude was re-modifying the DB schema it had already finished. As if it had lost its way.

Simple tasks were fine with Skills. `/commit`, `/plan` — things that wrap up in a few steps.
But real development was different:

```
Me: Implement an OAuth 2.0 login system

Claude: First, register the app in Google Developer Console...
        (Step 1 complete)
        Next, install NextAuth...
        (Step 2 complete)
        ...
        (30 minutes later)
Me: Where are you?
Claude: Hmm... I registered the Google app, installed NextAuth,
        but I'm not sure if I got the session middleware...
```

**On a 10-step task, the agent loses the thread.**

The core insight:
> *"On multi-step tasks, the model loses track. It repeats work, skips steps, or wanders off. A 10-step refactoring might complete steps 1-3, then the model starts improvising because it forgot steps 4-10."*

The reason lies in the structure of the Agent Loop. As work progresses, the message array grows.
The plan laid out at the start gets buried under dozens of tool results and fades away.

---

## The Solution: Make the Plan an External Tool

The core insight was simple.

**Don't put the plan inside Claude's head — externalize it as a separate tool.**

When you add a `todo` tool to the Agent Loop:
```
Message array (keeps growing):
  "Previous conversations..."
  "File read results..."
  → If the plan is buried here, it gets forgotten

External TodoManager (always accessible):
  [ ] Register Google OAuth app
  [>] Install NextAuth (currently in progress)
  [ ] Configure session middleware
  [ ] Login page UI
  [ ] Write tests
  → No matter how many results pile up, this list never disappears
```

---

<!-- section:workshop -->
## TodoWrite: In-Session Plan Management

### Three States and One Critical Constraint

The heart of TodoWrite is simple. Three states and one strict rule:

```python
class TodoManager:
    def update(self, items: list) -> str:
        validated = []
        in_progress_count = 0

        for item in items:
            status = item.get("status", "pending")
            if status == "in_progress":
                in_progress_count += 1    # count in_progress items
            validated.append({"id": item["id"], "text": item["text"],
                              "status": status})

        if in_progress_count > 1:
            raise ValueError("Only one task can be in_progress")  # ← the key constraint

        self.items = validated
        return self.render()
```

**Why only one `in_progress` at a time?**

If an agent marks multiple tasks as "in progress" simultaneously, nothing actually gets done. The single-task constraint forces sequential focus.

### State Flow

```
pending   →   in_progress   →   completed
  [ ]              [>]              [x]

Register Google OAuth app  [x]
Install NextAuth           [>]   ← focused here right now
Configure session middleware [ ]
Login page UI              [ ]
Write tests                [ ]
```

### Nag Reminder: A Mechanism That Forces Memory

TodoWrite is not passive. If the agent forgets to update its todo list, it gets automatically reminded:

```python
if rounds_since_todo >= 3 and messages:
    last = messages[-1]
    if last["role"] == "user" and isinstance(last.get("content"), list):
        last["content"].insert(0, {
            "type": "text",
            "text": "<reminder>Update your todos.</reminder>",  # ← forced injection
        })
```

Every 3 tool calls, an "update your todo list" reminder is injected into Claude's context. The system prevents plans from fizzling out.

### TodoWrite in Claude Code

In Claude Code, this pattern is implemented with `TaskCreate`, `TaskUpdate`, `TaskGet`, and `TaskList` tools:

```
Me: Implement the full OAuth login flow

Claude: [TaskCreate: "Register Google OAuth app", status: pending]
        [TaskCreate: "Install and configure NextAuth", status: pending]
        [TaskCreate: "Configure session middleware", status: pending]
        [TaskCreate: "Login page UI", status: pending]
        [TaskCreate: "Write integration tests", status: pending]

        [TaskUpdate: "Register Google OAuth app", status: in_progress]
        → Opening Google Developer Console...

        [TaskUpdate: "Register Google OAuth app", status: completed]
        [TaskUpdate: "Install and configure NextAuth", status: in_progress]
        → npm install next-auth...
```

Now even if `/compact` runs, Claude knows exactly where it left off.

---

## Task System: Persistent Plans That Outlive Sessions

TodoWrite was powerful, but it had limits.

```
TodoManager limitations:
- Exists only in memory → disappears after /compact
- Flat list → cannot express dependencies
- Single agent → cannot coordinate parallel work
```

A more powerful pattern exists.

### DAG (Directed Acyclic Graph) Task System

Real tasks have ordering. "The DB migration can't run until the schema design is done." A structure that expresses these dependencies:

```python
# Each task is stored as a separate JSON file
# .tasks/task_1.json
{
  "id": 1,
  "subject": "DB schema design",
  "status": "completed",
  "blockedBy": [],      # this task waits on nothing
  "blocks": [2, 3],     # tasks 2 and 3 wait on this
  "owner": ""
}

# .tasks/task_2.json
{
  "id": 2,
  "subject": "Write migration script",
  "status": "pending",
  "blockedBy": [1],     # can't start until task 1 is done
  "blocks": [4],
  "owner": ""
}

# .tasks/task_3.json
{
  "id": 3,
  "subject": "Implement API endpoints",
  "status": "pending",
  "blockedBy": [1],     # also waits on task 1
  "blocks": [4],
  "owner": ""
}

# .tasks/task_4.json
{
  "id": 4,
  "subject": "Integration tests",
  "status": "blocked",
  "blockedBy": [2, 3],  # both 2 and 3 must be done
  "blocks": [],
  "owner": ""
}
```

```
Dependency graph:
         +---------+
    +--> | Task 2  | --+
    |    +---------+   |
+------+               +--> +--------+
|Task 1|                    | Task 4 |
+------+               +--> +--------+
    |    +---------+   |
    +--> | Task 3  | --+
         +---------+

Task 1 complete → Tasks 2 and 3 are simultaneously unblocked
Tasks 2 and 3 complete → Task 4 is unblocked
```

### Automatic Dependency Resolution

When a task completes, dependent tasks are automatically unblocked:

```python
def _clear_dependency(self, completed_id: int):
    """Remove the completed task ID from all blockedBy lists"""
    for f in self.dir.glob("task_*.json"):
        task = json.loads(f.read_text())
        if completed_id in task.get("blockedBy", []):
            task["blockedBy"].remove(completed_id)
            self._save(task)
            # when blockedBy becomes empty → task automatically becomes ready
```

**This is the heart of the Task System.** No one needs to tell Claude "you can start task 2 now." Task 1 completes → the system automatically transitions tasks 2 and 3 to ready status.

### Three Questions Always Answerable

```
What can start right now?
  → status == "pending" AND blockedBy == []

What is waiting?
  → status == "pending" AND blockedBy != []

What is done?
  → status == "completed"
```

---

#### 🤔 What Breaks?

Assign a 10-step task without a plan. What happens after step 5?
Claude handles steps 1–3 well. But as context accumulates, the early plan gets pushed aside, and from step 5 onward Claude starts improvising. It repeats work already done, skips remaining steps, or drifts from the original direction.

#### ✅ What You Can Do After This Unit

- [ ] Externalize a task plan using TodoWrite
- [ ] Express task dependencies with blockedBy/blocks
- [ ] Explain the risks of working without a plan

## Harness Perspective: Context Has Been Externalized

TodoWrite and the Task System brought a fundamental change to the Context layer:

```
Evolution of the Context layer:
  Before: The plan exists only inside Claude's message array
           → disappears after /compact
           → fades away buried under old content

  After:  The plan is externalized to external files (.tasks/)
           → survives /compact
           → survives session restarts
           → multiple agents can share the same Task System
```

This isn't just "adding a notes feature." The way the Agent Loop manages Context has changed.

```
From s07 onward, the Task System became the coordination backbone for all subsequent concepts:
  - s08 Background Tasks → which tasks to run in the background
  - s09 Agent Teams → the task board shared by teammates
  - s11 Autonomous Agents → teammates picking tasks automatically
  - s12 Worktree Isolation → assigning an independent directory to each task
```

---

## Verification Loop: Completing the Execution Cycle

We create a task, execute it, and mark it complete.
**But how do we confirm the result is correct?**

```
Task: "Implement JWT authentication middleware"
  Status: completed ✅
  ... but does it actually work?
```

The Verification Loop is the **Write-Test-Verify-Fix** cycle:

```
Write  → Write the code
Test   → Run the tests
Verify → Check the results
Fix    → Fix if failing
  ↓
Test again → repeat until passing
```

Claude executes this cycle **autonomously, without human intervention**:

```
Claude:
  [Write] auth-middleware.ts
  [Bash] npm test -- auth-middleware.test.ts
  [Result] 3/5 tests failing
  [Write] auth-middleware.ts — revised
  [Bash] npm test -- auth-middleware.test.ts
  [Result] 5/5 tests passing ✅
  [TaskUpdate] status: completed
```

**How it connects with TodoWrite/Task System:**
When each Task's completion criterion is "tests passing,"
Plan (Task) + Execution (Write) + Verification (Test) + Status tracking (TodoWrite)
form a single **autonomous development cycle**.

This is why Claude Code is not just a code generator but a **self-directed development agent**.

---

<!-- section:reflection -->
## The Problem That Emerged as the Task System Matured

The Task System brought order to the work. But using it in practice revealed a new problem.

When implementing complex features, reading 30 files and planning alone fills up the context.

*"I set up a plan... but the 30-file exploration noise filled the main context. When I asked for a review, the response came back distracted."*

→ **[Ch06. Agents — The Distracted Review](./04-agents.md)**
