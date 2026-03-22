# Background Tasks — A Fast Brain, Slow Hands

> **Previously**: Jimin isolated code review noise using a Subagent.
> The code-reviewer delivered accurate reviews from a clean context.
> But while building the CI/CD pipeline, she hit a new wall...

> Harness = **Tools** + Knowledge + **Context** + Permissions
>
> Background Tasks expand the **Tools execution model** and **minimize Context pollution**.
> *"Run slow operations in the background; the agent keeps thinking"*

---

## Thirty Seconds of Silence

Jimin hit Enter.

```
Jimin: Install dependencies and create the config file in the meantime

Claude: Running npm install...
```

Thirty seconds passed. Nothing changed in the terminal.

Jimin took a sip of coffee. Looked at the terminal again. Still running.

```
        [30 more seconds waiting]
        Installation complete! Now I'll create the config file.
```

Sixty seconds total. **Half of it was Claude sitting idle, just waiting.**

"The config file could have been created before npm install finished," Jimin muttered. "Why is it waiting?"

This wasn't a minor annoyance. Add up the blocking time in real development:

```
npm install        → 30s–3min
docker build       → 1min–10min
pytest             → 30s–5min
cargo build        → 1min–10min
database migration → 10s–1min
```

Running builds 20 times a day? **At minimum, 30 minutes of Claude just sitting there.**

Jimin's launch deadline was approaching. She couldn't afford to throw away those 30 minutes.

---

## "Why Wait?": A Structural Limitation of the Agent Loop

The cause was in the structure of the Agent Loop (learned in Ch00).

```python
def agent_loop(messages):
    while True:
        response = client.messages.create(...)

        for tool_call in response.content:
            if tool_call.type == "tool_use":
                output = TOOL_HANDLERS[tool_call.name](**tool_call.input)
                #             ↑ blocking here for 30 seconds
                # this line must finish before moving to the next
                results.append(...)

        messages.append({"role": "user", "content": results})
        # all tool results must gather before the next LLM call
```

The `execute_tool()` line must complete before moving on.
If npm install takes 3 minutes, Claude **doesn't think at all for 3 minutes.**

Jimin initially thought it was a bug. "Can't we just fix it?"

But she quickly realized: **this was correct design, not a bug.**

---

## Why Correct Design Can Still Be a Problem

An agent's reasoning **must be sequential.**

Why? Claude reads a file, sees the result, and decides the next action. What if two LLM calls ran simultaneously?

```
Claude A: reads auth.ts → "Let's go with JWT"
Claude B: reads auth.ts → "Let's go with sessions"
→ Conflict. Whose judgment do we follow?
```

**Sequential reasoning guarantees the agent's consistency.** This must not be touched.

But `npm install` isn't reasoning. **It's pure I/O waiting.** It uses no CPU. It's just waiting for packages to download from the network.

```
The distinction:
  Reasoning: Claude thinking → must be sequential ✅
  I/O waiting: waiting for external processes → can be parallelized ✅
```

Jimin's eyes went wide. *"Keep reasoning sequential, and just extract the I/O."*

---

<!-- section:workshop -->
## BackgroundManager: Like Ordering at a Café

The solution was surprisingly simple. Using a café analogy:

```
Café analogy:

[Blocking approach] — standing in line
  1. Order coffee → wait in line while barista makes it (3 min)
  2. Get coffee → only now can you sit down and start working
  → 3 minutes wasted

[Background approach] — the buzzer
  1. Order coffee → get a buzzer (0.001 seconds)
  2. Go sit down, start working (coffee is being made in the back)
  3. Buzzer goes off → go get coffee
  → 0 seconds waiting
```

The code implementation of this is **BackgroundManager**.

```
What BackgroundManager does (pseudocode):

run("npm install"):
  1. Start "npm install" in a separate space       ← place the order
  2. Return a buzzer (task_id) immediately         ← get the buzzer
  3. Claude continues other work                   ← sit down, work

_execute() [quietly in the background]:
  1. Wait until npm install finishes               ← barista making coffee
  2. When done, add result to notification queue   ← buzzer goes off

drain_notifications() [at the start of each loop]:
  1. Check "any finished background tasks?"        ← is the buzzer going off?
  2. If yes, deliver result to Claude              ← go get the coffee
```

> **The key is the "buzzer" pattern.** You place the command and return immediately. Results arrive later as notifications. While waiting, Claude writes other files, creates configs, writes tests.

For those curious about the technical implementation:

```python
class BackgroundManager:
    def run(self, command):                  # receives "npm install"
        thread = threading.Thread(           # creates a separate execution space
            target=self._execute,            # runs it there
            args=(task_id, command),
            daemon=True                      # ends with main when main exits
        )
        thread.start()                       # start running!
        return f"task {task_id} started"     # ← immediate return (0.001s)
```

And the Agent Loop checks "did the buzzer go off?" at the start of each iteration:

```
One line added to Agent Loop (pseudocode):

At the start of each iteration:
  1. "Any background tasks finished?" ← check the buzzer
  2. If yes → report results to Claude
  3. Claude sees results and makes the next decision
```

```python
def agent_loop(messages):
    while True:
        # ← at the start of each iteration: "any finished background tasks?"
        notifs = BG.drain_notifications()
        if notifs:
            messages.append({"role": "user",
                "content": f"<background-results>{notifs}</background-results>"})

        response = client.messages.create(...)
        # Claude now knows about completed tasks and makes the next decision
```

---

## Jimin's Thirty Seconds Disappear

In Claude Code, this is implemented with the `run_in_background=true` parameter.

Jimin made the same request again:

```
Jimin: Install dependencies, build Docker at the same time, and generate docs in the meantime

Claude: [Bash: "npm install", run_in_background=true] → job-01
        [Bash: "docker build -t app .", run_in_background=true] → job-02

        // without waiting, immediately:
        [Read: "src/api.ts"]
        [Write: "docs/api.md", content: "...API docs..."]
        [Write: "docs/setup.md", content: "...Setup guide..."]

        // when completion notifications arrive:
        npm install complete (23.4s): 247 packages added ✅
        docker build complete (68s): Successfully built 3a2f1b9 ✅

        All three tasks complete.
```

```
Timeline:

Blocking approach (before):
  [npm 30s]──────────[docker 68s]──────────────────[docs writing]──── = 108s+

Background approach (after):
  [npm 30s]─────────┐
  [docker 68s]──────────────────────────────────┐
  [docs writing 10s]─────────────────────────── │─── = 68s
                                                 ↑
                                         Docker completion point
```

Total time: **68 seconds** (the slowest docker build).
Blocking would have been: **108s+**. 37% savings.

Run 20 builds a day? 13 minutes saved daily. Four hours a month.

From a Context perspective, it's better too:

```
Blocking approach:
  tool_result: "npm install running..."      ← enters Context immediately
  tool_result: (30s later) "install complete 247 packages"

Background approach:
  tool_result: "Background task started"     ← small tokens (6 words)
  (other work in the middle)
  notification: "npm install complete"       ← enters Context only on completion
```

The "running..." status during I/O waiting never pollutes the Context.

---

## Autonomous Loops: The Human Steps Out of the Loop

As Jimin got comfortable with Background Tasks, she started thinking more boldly.

*"Could Claude work on its own overnight?"*

Background Tasks + Headless Mode (the `claude -p` from Ch00) combined create **autonomous loops**.

```
Evolution of the Agent Loop:

Stage 1 (2022):  Human is part of the loop (copy-paste)
Stage 2 (Loop):  Human only inputs the prompt (Claude does the rest)
Stage 3 (Headless): System inputs the prompt (no human needed)
Stage 4 (Autonomous): System repeatedly prompts (infinite autonomous execution)
```

The simplest autonomous loop:

```bash
# A nighttime agent that checks and handles issues every 5 minutes
while true; do
  claude -p "Check GitHub issues and handle anything resolvable"
  sleep 300
done
```

### Autonomous Loop Pattern Catalog

Starting from a simple while loop and evolving toward increasingly sophisticated patterns:

```
Pattern 1: Sequential Pipeline
  claude -p "analyze" | claude -p "implement" | claude -p "test"
  → Each stage's output becomes the next stage's input
  → Clean context at each stage (no noise from previous stages)

Pattern 2: Iterative PR Loop
  for issue in $(gh issue list --json number -q '.[].number'); do
    claude -p "Analyze issue #$issue and create a PR"
  done
  → If CI fails, automatically retry with fixes
  → Use SHARED_TASK_NOTES.md to pass context between iterations

Pattern 3: De-Sloppify (cleanup pass)
  claude -p "Implement this feature"         ← 1st pass: implementation
  claude -p "Clean up the code you just wrote"  ← 2nd pass: cleanup
  → Separate cleanup pass produces higher quality than "don't do X" instructions
  → Removes framework feature tests from test suites
  → Cleans up excessive defensive code

Pattern 4: DAG Orchestration
  Run multiple claude -p instances in parallel (using Background Tasks)
  → Same principle as the DAG in Task System (Ch05)
  → Tasks with no dependencies run simultaneously
  → Results merged at convergence points
```

**De-Sloppify is especially important.** Negative instructions like "don't do X" have low effectiveness. Instead, running a separate cleanup agent after implementation produces cleaner results.

Jimin connected an autonomous loop to the CI/CD pipeline.
When a PR was opened, Claude would automatically review it, and for simple fixes, commit directly.

*"At first I was Claude's hands. Now Claude works through the night on its own."*

---

<!-- section:reflection -->
## Harness Perspective: The Ultimate Expansion of the Agent Loop

```
Harness = Tools + Knowledge + Context + Permissions

Background Tasks expanded the Tools layer's execution model:
  Before: all tools run in blocking fashion
  After:  I/O runs in background, reasoning stays in foreground

Context pollution also decreased:
  Before: "running" status accumulates in Context
  After:  only completed results enter Context
```

Looking back at the Agent Loop journey that started in Ch00:

```
Agent Loop (Ch00):  Claude became able to use tools
  → Background Tasks (here): I/O was parallelized
  → Autonomous Loops:         the human stepped out of the loop
```

But there was still a problem left unsolved.

---

## CLAUDE.md Becomes a Monster

Background Tasks made development faster by running builds, installs, and tests in parallel.
The project grew quickly. Files went from 50 to 100.

But CLAUDE.md was growing along with it.

```
CLAUDE.md 3 months ago: 50 lines (project overview + tech stack)
CLAUDE.md now:         350 lines (coding style + security rules + test standards +
                                  git workflow + performance guide + agent rules + ...)
```

Jimin tried Ctrl+F for "security rules." Scrolling through 350 lines, she thought:

*"This... can't be managed."*

Then a Slack notification arrived. Hyunwoo, who had just joined, asked:

> Hyunwoo: Can I add my coding style rules to CLAUDE.md too?

Jimin opened CLAUDE.md again. 350 lines. Adding Hyunwoo's rules would make it 400.
And Claude loads **all 400 lines** into context every single session.

Deployment procedures taking up 2,000 tokens during a code review — unnecessary.
Security guides taking 1,500 tokens while making a commit — unnecessary.

**All rules are always loaded for every task.**

→ **[Ch08. Rules — The 350-Line Monster](./05-rules.md)**
