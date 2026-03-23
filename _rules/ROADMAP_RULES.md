# Agent Workflow & Roadmap Standards

## 12. 📋 ROADMAP CREATION STANDARDS (MANDATORY FOR ALL ROADMAPS)

> **CONTEXT**: Multiple roadmaps were created with varying quality — some had vague steps that broke production, others lacked risk warnings. This standard ensures EVERY roadmap is safe for Claude Code to execute.

When creating a NEW roadmap (stored in `_tasks/roadmap-*.md`), you MUST include ALL of these sections. Reference `_tasks/roadmap-security-hardening.md` as the gold standard.

### R1: BREAKAGE RISK ASSESSMENT (at the top)

**Every roadmap MUST start with a risk table** listing each phase's risk level:

```markdown
| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟢 SAFE | Nothing | — |
| Phase 2 | 🔴 HIGH | Salon card display | Must update X before Y |
| Phase 3 | 🟡 MEDIUM | Runtime crash if env var missing | Set env var first |
```

For any 🔴 HIGH or 🟡 MEDIUM phase: grep the codebase for affected patterns, list the **exact files** at risk, and explain how to avoid breakage.

### R2: SEPARATE MANUAL VS CODE PHASES

Split every roadmap into:
- **🤖 CLAUDE CODE PHASES** — Pure code/migration changes. No external accounts needed.
- **🧑 MANUAL PHASES** — Require dashboard access, API key creation, DNS config, or human verification. List these separately with step-by-step dashboard instructions.

### R3: ⚠️ BE CAREFUL BLOCK ON EVERY PHASE

Every phase MUST end with a `> ⚠️ **BE CAREFUL**:` block. Include:
- What could go wrong in this specific phase
- Common mistakes Claude Code might make
- Files/routes that should NOT be touched
- Edge cases and gotchas
- What to verify after completing the phase

### R4: ✅ DO / ❌ DON'T EXAMPLES

Every phase that involves writing code MUST include:
- A `✅ DO` code example showing the correct pattern
- A `❌ DON'T` code example showing what NOT to do
- If modifying existing code: show the BEFORE and AFTER diff

### R5: EXACT FILE PATHS AND TAGS

Every file mentioned in the roadmap must have:
- `[NEW]` tag for new files
- `[MODIFY]` tag for modified files
- `[DELETE]` tag for deleted files
- Full relative path from project root (e.g., `app/api/bookings/route.ts`, not just "the bookings route")

### R6: DEPENDENCY ORDERING TABLE

End the roadmap with an execution order summary:

```markdown
| Step | Type | What | Depends On |
|---|---|---|---|
| Manual A | 🧑 | Create Upstash Redis | Nothing |
| Phase 1 | 🤖 | Git cleanup | Nothing |
| Phase 2 | 🤖 | Rate limiting | Manual A |
```

### R7: VERIFICATION STEPS PER PHASE

Each phase must specify:
- The exact `git commit` command with a descriptive message
- What to verify after deployment (curl command, expected HTTP status, etc.)
- If the phase creates API routes: how to test them

### R8: FINAL PHASE UPDATES CLAUDE.md

If the roadmap introduces:
- New utility files (e.g., `lib/something.ts`)
- New tables or views in Supabase
- New environment variables
- New patterns that future code must follow

Then the LAST phase of the roadmap MUST update:
- `CLAUDE.md` Section 2 (Tech Stack) — if new dependencies
- `CLAUDE.md` Section 3.2 (Directory Tree) — if new lib files
- `CLAUDE.md` Section 6 (Schema Table) — if new tables/views
- `CLAUDE.md` Section 11 (Security Rules) — if new security patterns
- `.env.example` — if new env vars

### R9: ROADMAP FILE NAMING

Save all roadmaps in `_tasks/` with the naming pattern:
```
_tasks/roadmap-{topic}.md
```
Examples: `roadmap-security-hardening.md`, `roadmap-payment-system.md`, `roadmap-french-translation.md`

### R10: BEFORE WRITING THE ROADMAP — SCAN FIRST

Before writing ANY phase:
1. **Grep for affected patterns** — search the codebase for code that will be impacted
2. **List exact files** that need to change (don't say "update all routes" — list each one)
3. **Check existing `_tasks/INCOMPLETE_FEATURES.md`** for related unfinished work
4. **Read `_tasks/completed/`** for past decisions that affect the new feature
5. **Verify all imports/components/APIs** referenced in the roadmap actually exist


## 9. Spec → Roadmap Fidelity Rules (MANDATORY)

When an AI agent converts a spec or prompt into a roadmap, plan, or task file, the following rules apply **without exception**:

### ✅ Must preserve verbatim
- Every named component and its exact props
- Every pixel/size spec (e.g. "~160px wide, ~100px tall")
- Every exact URL pattern
- Every conditional or trigger condition (e.g. "only shown if user has 2+ same-day bookings" — NOT simplified to "if slots exist")
- Every API endpoint, HTTP method, and query param
- Every edge case (e.g. "button disabled with tooltip past deadline")
- Every side effect (e.g. "slot freed, both parties emailed")
- Every constraint marked SACRED or critical (e.g. "SACRED — never vertical")
- Every specific example given (e.g. "Balayage" → Specialist badge)
- Every design token value

### ❌ Never allowed
- Paraphrasing a condition and changing its meaning
- Dropping a feature because it seems minor
- Merging two distinct features into one vague bullet
- Omitting a section because it was at the end of the spec (e.g. "Smart Features")

### How to verify
After writing a roadmap from a spec, do a keyword grep check for:
- Specific examples mentioned in the spec (e.g. "Balayage", "2+")
- Side effects (e.g. "emailed")
- Trigger conditions (e.g. "same-day")
- SACRED/never constraints

- **UI & Design Rules:** Before writing ANY frontend code, you must read and strictly adhere to `UI_RULES.md`. Do NOT deviate from the light-mode, glassmorphic, Airbnb-style layout constraints defined there.

