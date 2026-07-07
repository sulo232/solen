<!-- exists-check: net-new vs _rules/archive/UI_RULES.md, CLAUDE.md, _rules/SYSTEMS.md, _rules/UI_RULES.md because this is the multi-agent lock/branch/role section moved out of _rules/AGENT_COORDINATION.md (dated archive per bloat-trim task, 2026-07-07), not a duplicate of any existing UI/system doc -->

# Archived: Multi-Agent Lock/Branch/Role Coordination (archived 2026-07-07)

> This is historical content moved out of `_rules/AGENT_COORDINATION.md` on 2026-07-07. It described a multi-agent file-lock, branch, and role protocol (`.agent-lock.json`, `.agent-comms.md`, Dev 1/Dev 2/Dev 3 roles) from an earlier multi-agent working model. It is not current law. The live orchestrator/coder/reviewer layered-loop model (see project CLAUDE.md rule 13 and `~/.claude/LOOP_SYSTEM.md`) superseded this. Kept for history only, do not follow.

## Why This Existed

Multiple AI agents worked on this codebase simultaneously (Dev 1, Dev 2, Dev 3 + bug-agent). Without coordination, agents would overwrite each other's changes, especially critical for database migrations and shared components.

## Mandatory Steps (EVERY Agent, EVERY Session)

```
┌─────────────────────────────────────────────────┐
│  1. READ CLAUDE.md completely                    │
│  2. READ .agent-lock.json, check locked files    │
│  3. READ .agent-comms.md, check recent messages  │
│  4. CLAIM your files in .agent-lock.json         │
│  5. POST your intent in .agent-comms.md          │
│  6. WORK, only edit YOUR claimed files           │
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
| `netlify.toml` | HIGH | Breaking this = site goes down. |

## Agent Roles

| Agent | Branch | Scope |
|---|---|---|
| `feature-agent` (Dev 2) | `feature/customer-frontend` | `components/`, `app/[locale]/` customer pages, Tailwind |
| `feature-agent` (Dev 3) | `feature/salon-dashboard` | `components/dashboard/`, `app/[locale]/dashboard/`, onboarding |
| `bug-agent` | `main` | Hotfixes, config, `package.json`, `netlify.toml` |
| `infra-agent` | `main` | DevOps, migrations, Edge Functions |
