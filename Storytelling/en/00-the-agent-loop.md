# 00. The Agent Loop — Where Everything Begins

> **From the previous story**: Jimin installed Claude Code and ran it for the first time.
> She was amazed to watch Claude read and analyze files on its own.
> "This isn't just a chatbot." — But she still didn't know why it worked this way.
>
> Hyunwoo, sitting next to her, glanced over. "That's just a chatbot. It's just copy-paste made slightly more convenient."

> *"One loop & Bash is all you need"*
> — Harness Engineering

---

## The True Starting Point: Claude Just Returned Text

In 2022, when Anthropic released Claude, it was **a function that took text as input and returned text as output**.

```
Input:  "Find the bug in this code"
Output: "It looks like the null check is missing on line 3..."
```

That was helpful. But no matter how smart Claude was, **it couldn't read actual files, and it couldn't run the terminal.** Developers had to look at Claude's answer, manually fix the code, copy the error message, and paste it back.

**The developer themselves was the loop.**

---

## The Turning Point: Tool Use Arrives (2023)

Anthropic added a feature called `tool_use` to the Claude API.

The idea was simple:
*"What if Claude could not only return text, but also request 'please run this function for me'?"*

```python
# Claude's response changed to look like this
response = {
  "stop_reason": "tool_use",
  "content": [{
    "type": "tool_use",
    "name": "bash",
    "input": {"command": "cat src/main.py"}
  }]
}
```

Now Claude could **request** to read a file.
The developer just had to execute that request and return the result.

But doing this manually every time... meant the developer was still the loop.

---

## The Discovery of the Loop: Building an Agent in 30 Lines

Someone realized: *"Just automate it."*

You don't need to know the code. What these 30 lines do breaks down to exactly three things:

```
What the Agent Loop does (pseudocode):

1. Send the user's question to Claude
2. Claude responds
   └─ "I have something to say" → answer and done
   └─ "Please run this tool" → go to step 3
3. Execute the requested tool (read file, run terminal, etc.)
4. Send the result back to Claude
5. Go back to step 2 → repeat until Claude says "done"
```

> The key is **repetition**. Claude says "read this file" → we read it and return it → "run this code" → we run it and return it → "all done" → finished. This repetition is the entirety of the Agent Loop.

In actual Python code:

```python
def agent_loop(query):                              # function that receives user question
    messages = [{"role": "user", "content": query}]  # start conversation history
    while True:                                      # infinite loop (until done)
        response = client.messages.create(           # send to Claude
            model=MODEL, messages=messages, tools=TOOLS
        )

        if response.stop_reason != "tool_use":       # if Claude says "done"
            return                                   # → stop here

        # If Claude requested "please run this tool":
        for block in response.content:
            if block.type == "tool_use":             # if it's a tool execution request
                output = run_bash(block.input["command"])  # execute it
                results.append({"content": output})  # collect the result

        messages.append({"role": "user", "content": results})
        # ↑ send result back to Claude → return to while True → repeat!
```

- `while True` = "keep going until Claude says done" (the loop)
- `client.messages.create(...)` = "send a message to Claude and get the answer" (API call)
- `run_bash(...)` = "run a command in the terminal" (tool execution)
- `messages.append(...)` = "add to conversation history" (building memory)

**That's all.** 30 lines.

Claude can now read files on its own, run code, see the results, and decide what to do next. The developer no longer needs to copy-paste in the middle.

---

## The Core Insight: "The Model IS the Agent"

This is where an important shift in understanding happens.

A common misconception: *"To build an agent, you need complex frameworks, prompt chains, and decision trees."*

Reality: **The agent is already inside Claude.**

DeepMind's DQN, OpenAI Five, AlphaStar... what all these AI agents proved is one thing: **an agent is a model that has learned how to act through billions of training iterations.** It's not built in code.

Claude already knows how to think, plan, and act.
What we need to do is **create an environment where Claude can work.**

---

## Harness: Designing the Environment

This environment is called the **Harness**.

```
Harness = Tools + Knowledge + Context + Permissions

Tools:       Claude's hands — reading files, running code, calling APIs
Knowledge:   Claude's memory — project info, rules, domain knowledge
Context:     Claude's short-term memory — what it has done so far
Permissions: Claude's boundaries — what it can and cannot do
```

**Claude Code is this Harness.**

Claude Code doesn't make Claude smarter.
Claude is already smart.
Claude Code gives Claude **hands, eyes, and a workspace.**

---

## The Essence of Claude Code

Decomposing Claude Code:

```
Claude Code = agent loop (foundation)
            + tools       (Read, Write, Bash, Glob, Grep, ...)  ← hands
            + CLAUDE.md   (project knowledge)                    ← memory
            + skills      (on-demand knowledge)                  ← expertise
            + /compact    (context compression)                  ← memory management
            + subagents   (context isolation)                    ← focus
            + hooks       (permission governance)                ← boundaries
            + rules       (structured knowledge)                 ← organized memory
            + MCPs        (external tools)                       ← extended hands
```

Every item on this list is a **Harness design decision**.
Each item was added to solve a specific problem.
And each time an item was added, a new problem was revealed.

---

<!-- section:workshop -->
## Two Faces of the Agent Loop: Interactive vs. Headless

The Agent Loop so far assumed a person was typing prompts.
But what about CI/CD pipelines? Cron jobs? No one is at a keyboard.

**The same Agent Loop also works non-interactively.**

```bash
# Headless mode: the -p flag
claude -p "Analyze this code for security vulnerabilities"

# Piping stdin: pass logs directly to Claude
cat error.log | claude -p "Analyze this error log and find the cause"

# JSON output: for automation pipelines
claude -p --output-format json "Analyze the dependencies in package.json"
```

Real-world patterns in CI/CD:
```bash
# Automatic security review on PRs
git diff main --name-only | claude -p "Review the changed files for security vulnerabilities"

# Translation automation
claude -p "Translate new strings to Korean and create a PR"

# Log monitoring
tail -f app.log | claude -p "Notify Slack if you detect any anomalies"
```

Key insight: The Agent Loop's `while True` is the same.
Whether input comes from a terminal or a pipe, the loop runs the same way.
**Interactive means a human triggers the loop; Headless means the system triggers it.**

---

## Same Loop, Different Interfaces

Does the Agent Loop only run in the terminal? No.

```
Terminal (CLI)       ← best for pipes, automation
VS Code Extension    ← inline diff, @mentions, code review
Desktop App          ← visual diff, long sessions, multi-session
Web (claude.ai/code) ← no install needed, continue on mobile
JetBrains Plugin     ← IntelliJ, PyCharm, WebStorm
iOS App              ← check work on the go
```

And you can move between these environments:

```
/teleport  → move a terminal session to the web
/desktop   → move a terminal session to the desktop app
```

```
Me: (working in the terminal for 2 hours)
Me: I need to head out...
Me: /teleport
→ The session moves to claude.ai/code
→ I can check the work status on my phone
→ I can come back to the terminal later
```

Key insight: **The loop is environment-independent.**
As long as the Harness (Tools + Knowledge + Context + Permissions) is the same, the same agent operates anywhere.
Whether it's in a terminal, an IDE, or the web — what Claude sees is the same messages array.

---

<!-- section:reflection -->
## Now the Story Truly Begins

Once you understand the Agent Loop and the Harness concept,
you can explain every feature of Claude Code in terms of "why was this necessary?"

```
The Agent Loop is discovered
    ↓ "I have to explain the project context every session"
CLAUDE.md — Knowledge Layer
    ↓ "I want to react to Claude's actions"
Hooks — Permission & Reaction Layer
    ↓ "I keep repeating the same workflows"
Skills — On-demand Knowledge Layer
    ↓ "Context gets polluted; tasks are too big"
Agents — Context Isolation Layer
    ↓ "CLAUDE.md got too big"
Rules — Structured Knowledge Layer
    ↓ "I'm cut off from the outside world"
MCPs — Tool Expansion Layer
```

Everything started from a single loop.

→ **[Ch02. CLAUDE.md — The New Hire Who Starts Fresh Every Day](./01-CLAUDE-md.md)**
