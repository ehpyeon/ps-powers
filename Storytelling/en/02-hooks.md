# Hooks — 23 Gates to Intercept Every Action

> **From the previous story**: Jimin gave Claude a memory of the project through CLAUDE.md.
> She no longer had to say "this is a Next.js 14 project" every time. Claude began working with more confidence.
> Editing files, running code... and then one night.

> Harness = Tools + Knowledge + Context + **Permissions**
>
> Hooks are the **Permissions control mechanism** of the Harness.
> *"When Claude moves, I want to move too"*

---

## What Happened That Night

While Jimin was asleep, Claude was doing a code review.
A test failed. Claude said "I'll fix it" and patched the code.
Then it ran `git push` to the main branch.

In the morning, seven Slack notifications were waiting.

```
Hyunwoo: @Jimin Production build is failing. Who pushed directly to main?
Hyunwoo: At 2 AM?
```

Jimin realized it. **She had given Claude memory (CLAUDE.md), which gave it confidence. But there were no boundaries.**

CLAUDE.md had made Claude remember the project.
Claude now acted with greater confidence.
It fixed files, ran terminal commands, and modified multiple files at once.

But a new kind of friction was building up for developers.

```
Claude edits a file
  → I have to run lint manually
  → I have to run tests manually
  → I have to run the formatter manually
  → ...
```

There were also more frustrating situations.

```
Claude is about to run git push
  → This might not be the moment I want it to
  → There's no way to stop it
```

And there was a small but quality-of-life desire.

```
Claude is working on a 30-minute task
  → I'm doing other things
  → I have to keep checking the tab to see if it's done
  → It would be great if it could make a sound when it's finished
```

*"I need a way to intervene in every action Claude takes."*

---

## The Birth of the Solution: An "Event System"

Anthropic introduced an event-based hook system into Claude Code.

From the Agent Loop's perspective, Hooks are interceptors that cut in at each stage of the loop:

```python
def agent_loop(messages):
    while True:
        response = client.messages.create(...)

        for block in response.content:
            if block.type == "tool_use":
                # ← PreToolUse hook (allow/block)
                output = TOOL_HANDLERS[block.name](**block.input)
                # ← PostToolUse hook (react/inject)
```

The core idea is simple:
**Whenever Claude takes a certain action, run the specified script.**

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{
        "type": "command",
        "command": "npm run lint"
      }]
    }]
  }
}
```

Every time Claude edits a file (`Edit|Write`) → lint runs automatically.
One line of configuration, and a manual task is automated.

---

## Where Hooks Sit in the Harness

```
A Harness without the Permissions layer:
  Claude can run any tool at any time
  → Accidental rm -rf, accidental git push, accidental production DB changes

A Harness with the Permissions layer:
  PreToolUse: decide to block/allow before execution
  PostToolUse: react after execution (lint, tests, notifications)
  UserPromptSubmit: inject context into inputs
  → Claude runs the same loop, but action boundaries are clear
```

The core principle of the Permissions layer:
> "Give the agent only the permissions it needs. Least privilege prevents mistakes."
> Hooks implement this principle **dynamically**.

---

<!-- section:workshop -->
## Permission Modes: The Macro Permission Switch

If Hooks are **micro** permission control (individual tool level),
Permission Modes are the **macro** permission switch (entire session).

```
Three modes:

Normal Mode (default):
  Claude asks for approval every time before modifying a file or running a command.
  → Safe, but you click approve a lot

Auto-Accept Mode:
  Claude's actions are approved automatically.
  → Fast, but dangerous actions run immediately too

Plan Mode (read-only):
  Claude only analyzes and plans. It does not modify code.
  → Optimal for exploration and architecture review
```

**Shift+Tab** switches between modes in a single keystroke.

Real-world workflow:
```
Exploring a new project  → Plan Mode     (safely map the structure)
Starting to implement    → Normal Mode   (proceed with approvals)
Trusted repetitive work  → Auto-Accept   (e.g., writing tests)
Before a dangerous task  → Return to Normal Mode
```

The relationship between Hooks and Permission Modes:
```
Permission Modes = the big dial  (permission level for the whole session)
Hooks            = small dials   (fine-tuning per tool/event)

Example: Even in Auto-Accept mode, a Hook can block git push.
         Even if the big dial is "open," the small dial "closed" still blocks.
```

Other key shortcuts:
- **Ctrl+B**: Toggle background mode (Claude works in the background)
- **Ctrl+O**: View reasoning process (see Claude's chain of thought)

---

## The Three Powers of Hooks

### Power 1: Reaction
Do something after Claude's action completes.

```
PostToolUse (after Edit/Write)
  → Run formatter
  → Type checking
  → Quality gate warnings
  → Log recording

Stop (after Claude's response is complete)
  → Play a completion sound notification
  → Send a Slack message
```

### Power 2: Blocking
**Stop** Claude's action **before** it runs.

```
PreToolUse (before execution)
  → Check branch before git push
  → Detect and block rm -rf commands
  → Warn before accessing production DB
```

If the hook script returns exit code 2 → Claude does not take that action.

### Power 3: Injection
Manipulate the information Claude sees.

```
UserPromptSubmit (immediately after user input)
  → Automatically insert additional context into the prompt
  → Inject information like "current branch: feature/login"
```

---

## The 23 Events Covered by Hooks

There were only a few to start. As demand grew, more were added.

| Category | Event | When It Fires |
|----------|-------|---------------|
| **Tool** | PreToolUse | Just before a tool runs |
| | PostToolUse | After a tool succeeds |
| | PostToolUseFailure | After a tool fails |
| | PermissionRequest | When permission is requested |
| **Session** | SessionStart | Session starts/resumes |
| | SessionEnd | Session ends |
| | UserPromptSubmit | Immediately after user input |
| **Response** | Stop | After Claude's response completes |
| | StopFailure | Failed due to API error |
| | Notification | When a notification occurs |
| **Agent** | SubagentStart | Subagent starts |
| | SubagentStop | Subagent completes |
| **Compact** | PreCompact | Before context compression |
| | PostCompact | After context compression |
| **Other** | ConfigChange | Settings file changed |
| | InstructionsLoaded | CLAUDE.md loaded |
| | WorktreeCreate/Remove | Worktree-related |
| | ...5 more | |

Every time a new event was added, there was a real developer need behind it.
`TeammateIdle` was added for multi-agent team functionality;
`InstructionsLoaded` was added because people wanted to know which rules files were loaded.

---

## Two Execution Modes for Hooks

### Synchronous (Sync) — Makes Claude Wait
```json
{ "type": "command", "command": "npm run typecheck" }
```
Claude does not take the next action until the hook finishes.
Suitable for quality gates where the result matters.

### Asynchronous (Async) — Doesn't Make Claude Wait
```json
{ "type": "command", "command": "play-sound.py", "async": true }
```
Claude keeps working while the hook runs in the background.
Suitable for side effects like notifications and logging.

---

> **❌ Anti-pattern:** Don't use `dangerously-skip-permissions`. Instead, pre-allow only the commands you need in the `allow` field of settings.json. Disabling all permissions neutralizes the security layer.

#### 🔨 Try It Now

1. Add a PostToolUse hook to `.claude/settings.json`: `{"event": "PostToolUse", "command": "echo 'Tool used!'", "async": true}`
2. Ask Claude to edit a file, and verify the hook executes
3. Change the hook to `blocking: true` and try blocking Claude's work

#### ✅ What You Can Do After This Unit

- [ ] Explain the difference between PreToolUse and PostToolUse hooks
- [ ] Add a hook to settings.json and confirm it runs
- [ ] Implement a blocking hook that stops execution using exit 2

## Real-World Examples: Hooks in This Project

Let's look at the hooks implemented in this project with actual code.

### hooks.py — Playing Sounds for 23 Events

The sound system's structure is simple: event name = sound folder name.

```
.claude/hooks/sounds/
  sessionstart/      ← fires on SessionStart event
  pretooluse/        ← fires on PreToolUse event
  posttooluse/       ← fires on PostToolUse event
  stop/              ← fires on Stop event
  pretooluse-git-committing/  ← special sound when git commit is detected
  ...
```

Put a `.mp3` file inside each folder and it plays automatically when that event fires. If there are multiple files in a folder, one is chosen at random.

```
SessionStart → hooks/sounds/sessionstart/start.mp3
git commit   → hooks/sounds/pretooluse-git-committing/commit.mp3
Stop         → hooks/sounds/stop/complete.mp3
```

### quality-gate.py — The Automatic Quality Inspector

Every time Claude edits a file, this hook automatically inspects it. What does it inspect?

```
What the quality gate catches:

1. Debug code — warns if code that should only be used during development is left in
   → console.log()   "You probably meant to delete this line"
   → print()         "This one too"
   → debugger        "This will pause the browser"

2. Hardcoded secrets — warns if passwords or API keys are written directly in code
   → api_key = "sk-abc123..."     "This will be a disaster if it goes up to GitHub"
   → password = "my-secret"       "Move this to an environment variable"
   → Bearer eyJhbGci...           "Tokens shouldn't be in the code"

3. Unfinished TODOs — warns if there are TODOs/FIXMEs without a ticket number
   → TODO: fix this later          "When? Add a ticket number"
   → HACK: temporary solution      "This is technical debt"
```

> It's like a senior developer doing a quick pass over the code before every commit. Except this "senior" **is awake 24 hours and never gets annoyed.**

How to configure this inspection:

```json
{
  "PostToolUse": [{
    "matcher": "Edit|Write",
    "hooks": [{
      "type": "command",
      "command": "python3 .claude/hooks/scripts/quality-gate.py",
      "async": true,
      "timeout": 5000
    }]
  }]
}
```

- `"matcher": "Edit|Write"` → runs the inspection only when Claude **edits or creates** a file (not on reads)
- `"async": true` → Claude continues its next task while the inspection runs (doesn't wait)
- `"timeout": 5000` → if the inspection doesn't finish within 5 seconds, skip it

### toggle-hook.py — An Individual Hook On/Off Utility

```bash
# Check hook status
python3 .claude/hooks/scripts/toggle-hook.py list

# Toggle a specific hook
python3 .claude/hooks/scripts/toggle-hook.py toggle PostToolUse

# Saved to hooks-config.local.json (not committed to git)
```

---

<!-- section:reflection -->
## The Problem That Emerged as Hooks Matured

As the hook system became more powerful, developers wanted more complex things.

*"I have Claude do code reviews, and I always give the same instructions.
'Analyze the changed files, find security issues, and sort by severity.'
It's too tedious to type that every time."*

*"Can't I make the workflows I use frequently into something like a button?"*

→ **[Ch04. Skills — Saying the Same Thing Ten Times a Day](./03-skills.md)**
