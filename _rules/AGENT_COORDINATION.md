# Multi-Agent Coordination & Task Tracking

> ARCHIVED (2026-07-07): the dead multi-agent file-lock / branch / role protocol (`.agent-lock.json`, `.agent-comms.md`, Dev 1/2/3 roles) moved to `_rules/archive/AGENT_COORDINATION_locks.md`. It described an earlier multi-agent working model, superseded by the orchestrator/coder/reviewer layered loop (project CLAUDE.md rule 13, `~/.claude/LOOP_SYSTEM.md`). This file now only carries the live task-tracking protocol below.

---

## Task Tracking

### The `_tasks/` Folder

```
_tasks/
├── INCOMPLETE_FEATURES.md              # NEVER DELETE. Append blocked/partially built features here.
├── <feature>-plan.md                   # Per-task plan files as needed
└── completed/                          # Archive of finished tasks
```

### Task Lifecycle

```
START → Note intent in .agent-comms.md
DONE  → Move task file to _tasks/completed/ + note in .agent-comms.md
```

### Incomplete Features Protocol (MANDATORY)

If you cannot finish a feature (e.g., missing API route, missing dependency, lack of context):
1. **DO NOT** delete the feature from the roadmap or hide the failure.
2. **DO NOT** delete or overwrite `_tasks/INCOMPLETE_FEATURES.md`.
3. **APPEND** an entry to `_tasks/INCOMPLETE_FEATURES.md` using the canonical format defined in `_rules/STRUCTURAL_RULES.md` Rule 45 (Feature · File/Line · Backend · Frontend · Blocker · Next Steps · Priority). Quick reference:
   - **Feature**: What you were trying to build.
   - **File/Line**: Exactly where you stopped (e.g. `path/to/file.tsx:42`).
   - **Backend**: API routes / DB tables that exist.
   - **Frontend**: Components / pages that exist.
   - **Blocker**: Why you couldn't finish it (e.g., "Missing `POST /api/stuff` route, not yet built").
   - **Next Steps**: What the next agent or user needs to do to unblock it.
   - **Priority**: HIGH/MEDIUM/LOW.
