# CodeLore

> The living knowledge base your AI agent writes while it builds.

---

## The Problem

You're working with an AI coding agent. It writes code, makes decisions, touches files, changes architecture. You step away. You come back. And you have no idea what it did, why it did it, or where the project stands.

The agent doesn't forget. You do.

Chat logs scroll away. Markdown files go stale. Architecture docs are written once and never touched again. API endpoints get added with no record of why. Decisions get made and lost.

Every solo developer and small team using AI agents today is flying blind between sessions.

---

## What CodeLore Does

CodeLore is a local-first workspace that your AI agent writes to in real time — keeping your project's architecture, tasks, API endpoints, and decisions always up to date as you build.

It runs entirely on your machine. No cloud. No accounts. No subscriptions.

You connect it once. Your agent does the rest.

---

## How It Works

CodeLore is two things:

**An MCP server** — your AI agent connects to it and calls structured tools as it works. Every decision it makes, every file it touches, every task it completes gets written to a local SQLite database automatically.

**A web dashboard** — a local Next.js app that reads from the same database and renders your project's living state: architecture docs, API endpoints, task progress, decision log, and session history.

```
Your agent 
        ↓  calls MCP tools as it works
CodeLore MCP Server → SQLite database
        ↑  reads same database
CodeLore Dashboard (localhost:3000)
```

---

## What Gets Tracked

- **Architecture & App State** — living markdown docs the agent keeps updated as the codebase evolves
- **API Endpoints** — every route discovered or created, with method, path, auth requirements, and file location
- **Tasks** — the agent's plan, broken into subtasks, with real-time status
- **Decisions Log** — why X was chosen over Y, what alternatives were considered, what tradeoffs were made
- **File Changes** — what files were touched each session and why, linked to git commits
- **Blockers** — things the agent flagged that need your attention
- **Session History** — every agent run recorded, browsable, with full context

---

## Stack

- **Next.js 16** — dashboard
- **Prisma + SQLite** — local database, zero setup
- **TypeScript MCP Server** — built on `@modelcontextprotocol/sdk`
- **pnpm monorepo** — shared database package between MCP server and dashboard

Fully offline. Everything lives in your project folder.

---

## Agent Compatibility

CodeLore works with any MCP-compatible agent:

- opencode
- Claude Code
- Cursor
- Cline
- Any agent that supports MCP

Configuration is global — set it up once, works across all your projects automatically. CodeLore detects which project the agent is working in from the current working directory.

---

## Status

🚧 Early development. Contributions welcome.

---

## License

MIT