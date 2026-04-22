# CodeLore MCP — MVP Features

> Track progress by checking off tasks as you complete them.

---

## Feature 1 — Project Detection
**Status:** `[X] In Progress`

The foundation. Every tool call goes through this first.

### Tasks
- [ ] Read `cwd` from MCP request context
- [ ] Query SQLite for matching `repoPath`
- [ ] Auto-create project if not found
- [ ] Return `projectId` to all subsequent tools
- [ ] Handle edge case: cwd is a subdirectory of the repo root (walk up until `.git` found)

### Tools
- `detect_project(cwd)` → `{ projectId, name, repoPath, isNew }`

### Notes
- Use `simple-git` to confirm it's a valid git repo
- Store absolute path in DB as `repoPath`

---

## Feature 2 — Session Management
**Status:** `[ ] Not Started`

Groups everything that happens in one agent run together.

### Tasks
- [ ] Create session tied to detected project
- [ ] Store active sessionId in memory during MCP server runtime
- [ ] End session with optional summary
- [ ] Handle case: agent crashes without calling end_session (auto-close stale sessions on next start)

### Tools
- `start_session(title?, agentName?)` → `{ sessionId }`
- `end_session(summary?)` → `{ ok }`

### Notes
- `agentName` is optional — agent can pass "opencode" or "claude-code" for identification
- On `start_session`, auto-close any previously open session for this project

---

## Feature 3 — App State (Living Docs)
**Status:** `[ ] Not Started`

The killer feature. Agent keeps project knowledge up to date as it works.

### Tasks
- [ ] Upsert app state by section name
- [ ] Support markdown content
- [ ] Timestamp every update with session reference
- [ ] Implement `get_app_state` so agent can read context at session start

### Tools
- `update_app_state(section, content)` → `{ ok }`
- `get_app_state(section?)` → `{ sections[] }` — returns all or specific section

### Default Sections
Agent should be instructed to maintain these via AGENTS.md:
- `architecture` — overall system design
- `tech_stack` — languages, frameworks, services
- `auth_flow` — how authentication works
- `database` — schema overview, key models
- `current_focus` — what's actively being worked on

### Notes
- `@@unique([projectId, section])` in schema — updates never duplicate
- Agent should call `get_app_state()` at the START of every session to load context

---

## Feature 4 — Decision Logging
**Status:** `[ ] Not Started`

Why X was chosen over Y. The most valuable long-term artifact.

### Tasks
- [ ] Create decision record with title, reasoning, alternatives
- [ ] Link to active session
- [ ] Implement `get_decisions` for agent to review past decisions

### Tools
- `log_decision(title, reasoning, alternatives?, tradeoffs?)` → `{ decisionId }`
- `get_decisions(limit?)` → `{ decisions[] }`

### Notes
- Agent should call this whenever it makes an architectural choice
- Keep it low friction — title + reasoning is enough, rest optional

---

## Feature 5 — Task Tracking
**Status:** `[ ] Not Started`

The agent's plan, visible in real time.

### Tasks
- [ ] Create tasks with title, description, priority
- [ ] Update task status (pending → in_progress → done)
- [ ] Support subtasks via parentId
- [ ] Get current task list for session

### Tools
- `create_task(title, description?, priority?)` → `{ taskId }`
- `update_task(taskId, status)` → `{ ok }`
- `get_tasks(sessionId?)` → `{ tasks[] }`

### Notes
- Agent should create tasks at session start after reading app state
- Status values: `pending` `in_progress` `done` `blocked`

---

## Feature 6 — File Change Tracking
**Status:** `[ ] Not Started`

What the agent touched and why.

### Tasks
- [ ] Record file path, change type, and summary
- [ ] Auto-enrich with current git commit hash via simple-git
- [ ] Auto-enrich with current branch name
- [ ] Link to active session

### Tools
- `track_file_change(filePath, changeType, summary?)` → `{ ok }`

### Change Types
- `created` `modified` `deleted`

### Notes
- `gitCommit` and `branch` are fetched server-side — agent doesn't need to provide them
- Agent should call this after every meaningful file operation

---

## Build Order

```
1 → 2 → 3 → 4 → 5 → 6
```

Do not move to the next feature until the current one has:
- [ ] Tool implemented and registered
- [ ] Tested manually with a real MCP client
- [ ] Edge cases handled

---

## Progress

| Feature              | Status      |
|----------------------|-------------|
| Project Detection    | Not Started |
| Session Management   | Not Started |
| App State            | Not Started |
| Decision Logging     | Not Started |
| Task Tracking        | Not Started |
| File Change Tracking | Not Started |