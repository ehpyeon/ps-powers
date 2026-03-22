# MCPs — From Island to Continent

> **From the previous story**: Jimin dismantled the 350-line CLAUDE.md into 7 files using Rules.
> Coding style, security, testing, Git — each managed independently, loaded only when needed.
> Inside the codebase, Claude was omnipotent. But then...

> Harness = **Tools** + Knowledge + Context + Permissions
>
> MCPs **extend the Tools layer out to the external world**.
> *"Every external service becomes a tool via a standardized protocol"*

---

## "I Don't Have Access to That"

Seoyeon's Slack message came in.

> Seoyeon: An investor meeting is set. Three weeks from now. Help me get a list of everything that needs external service integrations.

Jimin had just fixed a bug in the Stripe payment integration. Tests were passing.
She naturally said:

```
Me: I fixed this bug, so close the related GitHub issue
Claude: I don't have access to GitHub.

Me: The task is done, change the Jira ticket to Done
Claude: I don't have access to Jira.

Me: Analyze this data for me (DB query)
Claude: I don't have access to the database.
```

Claude lived only inside the local filesystem.
The outside world was behind a wall.

Developers wanted to cross that wall.
But each service had a different API, different authentication, different data format...
Adding each one from scratch was an enormous amount of work.

*"Isn't there a standardized way to turn external services into Claude tools?"*

---

## The Birth of the Solution: "Let's Create a Protocol"

Let's recall what we learned in the Agent Loop (Ch01). Claude looks at a "list of tools" and picks the ones it needs. MCP is about **adding external service tools to this list of tools**.

```
Claude's available tool list:

Before MCP:
  Read     → read files
  Write    → write files
  Bash     → run terminal
  ↑ That's it. Local filesystem only.

After MCP:
  Read     → read files                      ← was already there
  Write    → write files                     ← was already there
  Bash     → run terminal                    ← was already there
  github__create_issue  → create GitHub issue ← MCP added this!
  jira__close_ticket    → close Jira ticket   ← MCP added this!
  slack__send_message   → Slack message       ← MCP added this!
```

> From Claude's perspective, there's no difference. Whether it reads a file with Read or creates an issue with github__create_issue, it's the same "tool use" mechanism. **No new learning is needed.** The list of tools just got longer.

Anthropic announced the **Model Context Protocol (MCP)**.

Core idea:
**If an external service implements an "MCP server,"
Claude can use that service as a tool in a standardized way.**

An analogy:
- Before USB: every printer had a different port, a different driver
- After USB: every device connects through one USB

MCP is the USB between AI and external services.

---

<!-- section:workshop -->
## How MCP Works

### Step 1: Register the MCP Server
Register the MCP servers you want to use in the `.mcp.json` file.

```json
{
  "mcpServers": {
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-github"]
    },
    "slack": {
      "type": "http",
      "url": "http://localhost:3000"
    }
  }
}
```

### Step 2: Claude Discovers MCP Tools
When Claude Code starts, it connects to the registered MCP servers.
It automatically receives the list of tools each server provides.

```
github MCP → provides create_issue, close_issue, list_prs, ... tools
slack MCP  → provides send_message, list_channels, ... tools
```

### Step 3: Claude Calls Tools in Natural Language
```
Me: The bug fix is complete, close the issue

Claude: [calling github MCP's close_issue tool]
        → GitHub issue #42 closed
```

The developer just talks in natural language.
Claude judges on its own which MCP tool to use.

---

## The Worlds MCP Opened Up

### Development Workflow
```
GitHub MCP:
  - create/query/modify/close issues
  - create/review PRs
  - code search

Jira MCP:
  - create tickets, change status
  - query sprints
  - add comments
```

### Data Access
```
Supabase MCP:
  - run SQL queries
  - query table structures
  - data analysis

ClickHouse MCP:
  - analytics queries
  - large-scale log analysis
```

### Communication
```
Slack MCP:
  - send messages
  - search channels

Atlassian MCP:
  - read/write Confluence pages
  - manage Jira tickets
```

### Web Research
```
Exa MCP:
  - web search
  - access to recent information

Firecrawl MCP:
  - web scraping
  - document parsing
```

---

## Two Connection Methods for MCP

### stdio (Local Process)
The MCP server runs as a process on my machine.
Usually run with `npx` or `python`.

```json
{
  "github": {
    "type": "stdio",
    "command": "npx",
    "args": ["@modelcontextprotocol/server-github"],
    "env": { "GITHUB_TOKEN": "ghp_xxxx" }
  }
}
```

Characteristics: Fast, works without internet, can access local files

### http (Remote Server)
The MCP server serves over HTTP from a remote location.
For connecting to a service that's already running, or a server shared by the team.

```json
{
  "my-company-tools": {
    "type": "http",
    "url": "https://mcp.mycompany.com",
    "headers": { "Authorization": "Bearer $TOKEN" }
  }
}
```

Characteristics: Shareable across the team, always up-to-date, centrally managed

---

## MCP's Interactions with Other Harness Layers

MCP extends the Tools layer, but it interacts with other layers:

```
Tools expansion (MCP):
  github, jira, slack, supabase...

Knowledge integration (Rules):
  .claude/rules/performance.md:
  "Disable unused MCPs → free up context window"

Permissions integration (Hooks):
  PreToolUse: confirm before MCP tool calls
  "Warn before modifying production DB"
```

---

## MCP's Pitfall: The Context Bomb

MCP was so powerful that developers got greedy.

```json
{
  "mcpServers": {
    "github": {...},
    "jira": {...},
    "slack": {...},
    "notion": {...},
    "supabase": {...},
    "clickhouse": {...},
    "figma": {...},
    "vercel": {...},
    "railway": {...},
    "cloudflare": {...},
    "stripe": {...},
    "sendgrid": {...},
    "datadog": {...},
    "pagerduty": {...},
    "linear": {...},
    ...
  }
}
```

20, 30 MCPs left on.

But each MCP server passes its tool list to Claude.
The more tools there are, the more they eat Claude's context window.
20 MCPs = hundreds of tool descriptions = much of the context window filled with tool descriptions.

**If you're only actually using 3–4 MCPs together, leaving 20 on is wasteful.**

Smart usage:
```
Registered: 20–30 (things you might need)
Active: max 10 (only what you need for the current task)
```

Real-world .mcp.json example (only what's active):

```json
{
  "mcpServers": {
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "${GITHUB_TOKEN}" }
    },
    "supabase": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase@latest"],
      "env": { "SUPABASE_URL": "${SUPABASE_URL}",
               "SUPABASE_KEY": "${SUPABASE_KEY}" }
    },
    "context7": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    }
  }
}
```

To deactivate: add to `disabledMcpjsonServers` in `settings.json`, or comment out the entry in `.mcp.json`. **Don't delete, just deactivate** — so the config is still there when you want to turn it back on.

Working on backend today → only turn on GitHub + Supabase
Working on documentation today → only turn on Confluence + context7

---

## Expanding MCP: MCPs You Build Yourself

The true power of MCP is that **anyone can build an MCP server**.

Internal proprietary systems, legacy APIs, internal databases...
If there's no public MCP server, you can build your own.

```
A custom MCP server (pseudocode):

Create an MCP server named "my-internal-api"
  ├── Tool 1: get_deployment_status
  │     "show me production status" → ask internal API, return answer
  │
  └── Tool 2: trigger_deployment
        "deploy v2.4.0" → send command to internal deployment system
```

> No matter how unusual your internal systems are, once you build one MCP server, Claude can access them through natural language.

Now Claude can:
```
Jimin: What's the production deployment status?
Claude: (MCP tool call) → Currently v2.3.1, running normally.

Jimin: Deploy v2.4.0
Claude: (MCP tool call) → Deployment has started. Should take about 3 minutes.
```

---

> **⚠️ Warning:** I once configured 15 MCPs. But only 4 of them were ones I used every day. The more MCPs you have, the more they take up context window and confuse Claude's tool selection. **Less is more.**

#### 🔨 Try It Now

1. Add the context7 MCP to `.mcp.json`: `{"mcpServers": {"context7": {"command": "npx", "args": ["-y", "@anthropic-ai/context7-mcp"]}}}`
2. Restart Claude Code
3. Try asking "show me the React useEffect docs"
4. Verify that Claude references the latest official documentation

#### ✅ What You Can Do After This Unit

- [ ] Write a .mcp.json file and connect an MCP server
- [ ] Explain the difference between stdio and http transport methods
- [ ] Choose 2 MCP servers your project needs and configure them

## Real-World Example: MCP Configuration

Current `.mcp.json`:
```json
{
  "mcpServers": {}
}
```

Still empty. Add as needed.

Recommended order:
1. `@modelcontextprotocol/server-github` — Git/PR workflow
2. Atlassian MCP — Jira/Confluence integration (already connected to Claude.ai)
3. Add project-specific ones as needed

---

<!-- section:reflection -->
## The Completion of the Full Story: The Harness Is Complete

```
Harness = Tools + Knowledge + Context + Permissions
```

```
Tools Layer:
  Read, Write, Bash   ← from the beginning
  MCPs                ← extended to the outside world

Knowledge Layer:
  CLAUDE.md           ← always active
  Skills              ← on-demand (/commit)
  Rules               ← context-based selection

Context Layer:
  Agent Loop          ← the foundational loop
  Agents/Subagents    ← isolated contexts
  /compact            ← memory compression

Permissions Layer:
  Hooks               ← action control
  settings.json       ← allow/block
```

All 4 layers of Claude's Harness are now in place.
Tools (Read, Write, Bash, MCPs), Knowledge (CLAUDE.md, Skills, Rules), Context (Agent Loop, Subagents), Permissions (Hooks).

Jimin was satisfied. Everything felt connected.

But the next morning, she added an MCP server recommended by the community for code analysis. She installed it and had Claude run an analysis.

The results looked useful. But the day after, Jimin discovered something chilling.

**The API keys in her `.env` file had changed.**

Hyunwoo saw it from the side. "That's why I told you not to connect external tools carelessly."

This time Hyunwoo was right. *In part.*

→ **[Ch10. Security — Hyunwoo Was Right (In Part)](./13-security.md)**
