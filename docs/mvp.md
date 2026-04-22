# CodeLore MCP — MVP Features

> Track progress by checking off tasks as you complete them.

---

## Feature 1 — Project Detection
**Status:** `[X] Done`

The internal foundation. Not exposed as a public tool — runs automatically before Feature 2+ tools.

### Tasks
- [X] Read `cwd` from MCP request context (workspace roots)
- [X] Query SQLite for matching `repoPath`
- [X] Auto-create project if not found
- [X] Return `projectId` to all subsequent tools (via runtime context)
- [X] Handle edge case: cwd is a subdirectory of the repo root (walk up until `.git` found)

### Internal API
- `resolveActiveProject(server)` → `{ projectId, name, repoPath, isNew }`

### Notes
- Uses `simple-git` to confirm it's a valid git repo
- Stores absolute path in DB as `repoPath`
- Active project persisted in runtime context for Feature 2+ tools
- Errors thrown as `ConfigurationError` when detection fails

---

## Feature 2 — Session Management
**Status:** `[X] Done`

Groups everything that happens in one agent run together.

### Tasks
- [X] Create session tied to detected project
- [X] Store active sessionId in memory during MCP server runtime
- [X] End session with optional summary
- [X] Handle case: agent crashes without calling end_session (auto-close stale sessions on next start)

### Tools
- `start_session(title?, agentName?)` → `{ sessionId }`
- `end_session(summary?)` → `{ ok }`

### Notes
- `agentName` is optional — agent can pass "opencode" or "claude-code" for identification
- On `start_session`, auto-close any previously open session for this project

---

## Feature 3 — App State (Living Docs)
**Status:** `[X] Done`

The killer feature. Agent keeps project knowledge up to date as it works.

### Tasks
- [X] Upsert app state by section name
- [X] Support markdown content
- [X] Timestamp every update with session reference
- [X] Implement `get_app_state` so agent can read context at session start

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