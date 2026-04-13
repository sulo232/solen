# Multi-Agent Coordination & Task Tracking

---

## Why This Exists

Multiple AI agents work on this codebase simultaneously (Dev 1, Dev 2, Dev 3 + bug-agent). Without coordination, agents overwrite each other's changes — especially critical for database migrations and shared components.

## Mandatory Steps (EVERY Agent, EVERY Session)

```
┌─────────────────────────────────────────────────┐
│  1. READ CLAUDE.md completely                    │
│  2. READ .agent-lock.json — check locked files   │
│  3. READ .agent-comms.md — check recent messages │
│  4. CLAIM your files in .agent-lock.json         │
│  5. POST your intent in .agent-comms.md          │
│  6. WORK — only edit YOUR claimed files          │
│  7. RELEASE locks when done                      │
│  8. POST summary in .agent-comms.md              │
└─────────────────────────────────────────────────┘
```

## File Lock Rules

**Before editing ANY file**, check `.agent-lock.json`:
- If **locked by another agent** → **DO NOT EDIT**. Work on something else or wait.
- If **unlocked** → Add your lock entry, then edit.
- When **done** → Remove your lock entry.
- **Stale locks** (3+ hours old with no recent git activity) may be cleared.

**Lock entry format:**
```json
{
  "agent": "your-agent-name",
  "files": ["index.html"],
  "reason": "Fixing hero section layout",
  "locked_at": "2026-03-16T09:00:00Z"
}
```

## Communication Rules

Post in `.agent-comms.md` before starting AND after finishing work. Include: what you changed, which files, any side effects for other agents.

## Danger Zones

| File | Risk | Why |
|---|---|---|
| `supabase/migrations/*` | CRITICAL | Conflicting migrations = broken DB. |
| `.env.local` | HIGH | Secrets. Never commit, never overwrite. |
| `package.json` | HIGH | Affects all agents. Lock before editing. |
| `vercel.json` | HIGH | Breaking this = site goes down. |

## Agent Roles

| Agent | Branch | Scope |
|---|---|---|
| `feature-agent` (Dev 2) | `feature/customer-frontend` | `components/`, `app/[locale]/` customer pages, Tailwind |
| `feature-agent` (Dev 3) | `feature/salon-dashboard` | `components/dashboard/`, `app/[locale]/dashboard/`, onboarding |
| `bug-agent` | `main` | Hotfixes, config, `package.json`, `vercel.json` |
| `infra-agent` | `main` | DevOps, migrations, Edge Functions |

---

## Task Tracking

### The `_tasks/` Folder

```
_tasks/
├── INCOMPLETE_FEATURES.md              # NEVER DELETE. Append blocked/partially built features here.
├── roadmap-dev2-customer-frontend.md   # Dev 2 execution plan
├── roadmap-dev3-salon-dashboard.md     # Dev 3 execution plan
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
3. **APPEND** an entry to `_tasks/INCOMPLETE_FEATURES.md` detailing:
   - **Feature**: What you were trying to build.
   - **File/Line**: Exactly where you stopped (e.g. `path/to/file.tsx:42`).
   - **Blocker**: Why you couldn't finish it (e.g., "Missing `POST /api/stuff` route from Dev 1").
   - **Next Steps**: What the next agent or user needs to do to unblock it.
