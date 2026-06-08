# Full Platform Audit & Implementation Roadmap

> **Purpose**: Master protocol for Claude Code. The user will paste one topic at a time. Claude Code follows Phases A→E for each topic.

---

## ⚠️ PREREQUISITES — BEFORE ANY TOPIC

1. Read `CLAUDE.md` in full — all 30 rules apply
2. Read `UI_RULES.md` — all design tokens apply
3. Read `_tasks/INCOMPLETE_FEATURES.md` — check for related blockers
4. Read `_tasks/completed/` — check for past decisions
5. Follow ALL roadmap standards R1–R10 from CLAUDE.md §12

---

## 🔄 UNIVERSAL PROTOCOL — FOR EVERY TOPIC

### Phase A: AUDIT

Scan the codebase to determine what exists vs what's missing for the topic the user pasted:

1. **Database** — `grep -rn "table_name" supabase/migrations/` for each table/column mentioned
2. **API routes** — `ls -la app/api/{relevant-dir}/` for each endpoint mentioned
3. **Frontend** — `grep -rn "ComponentName" components/ app/` for each page/component mentioned
4. **Lib utilities** — `grep -rn "functionName" lib/` for helpers/types mentioned
5. **Produce a checklist** — For EACH item in the pasted topic, mark:
   - ✅ EXISTS (fully implemented, working)
   - ⚠️ PARTIAL (exists but incomplete — specify what's missing)
   - ❌ MISSING (does not exist at all)

### Phase B: GAP ANALYSIS

For every ⚠️ PARTIAL item:
- What exists? What's broken or incomplete?
- Is it a **UI** issue, **backend** issue, **security** issue, or combo?
- Are there missing RLS policies, missing validation, missing rate limiting?

For every ❌ MISSING item:
- What needs to be created? (migration, API route, component, page)
- What are the dependencies? (does it need another topic's items built first?)
- Estimate size: small (1 file), medium (2-5 files), large (6+ files)

### Phase C: ROADMAP GENERATION

Write a roadmap file at `_tasks/roadmap-{topic-slug}.md` following CLAUDE.md §12 standards:

| Standard | What |
|---|---|
| R1 | Breakage risk table at top |
| R2 | Separate 🤖 CODE vs 🧑 MANUAL phases |
| R3 | ⚠️ BE CAREFUL block on every phase |
| R4 | ✅ DO / ❌ DON'T code examples |
| R5 | Exact file paths with [NEW]/[MODIFY]/[DELETE] tags |
| R6 | Dependency ordering table at end |
| R7 | Verification steps per phase (commit msg, curl check) |
| R8 | Final phase updates CLAUDE.md if new tables/utils/env vars |
| R9 | File naming `_tasks/roadmap-{topic}.md` |
| R10 | Scan codebase BEFORE writing any phase |

### Phase D: STOP — USER REVIEW

**STOP. Do NOT execute.** Present the roadmap to the user. Wait for explicit approval before proceeding.

### Phase E: EXECUTION

Execute the approved roadmap following CLAUDE.md §10:
- Rule 1: Verify imports exist before using
- Rule 2: Verify API routes exist before calling
- Rule 3: One commit per sub-phase
- Rule 4: `npm run build` before every commit
- Rule 5: Follow roadmap literally
- Rule 6: Check Vercel after every push
- Rule 14: Code review protocol (build + tsc + diff)
- Rule 29: Post-execution smoke test (all 9 checks)
- Rule 30: Premium design enforcement

---

## TOPIC EXECUTION ORDER

> When the user pastes topics, they should follow this order. Earlier topics are dependencies for later ones.

| Order | Topic | Depends on |
|---|---|---|
| 1 | Auth & Identity System | Nothing |
| 2 | Legal Pages & Compliance | Topic 1 |
| 3 | Salon Onboarding & Management | Topic 1 |
| 4 | Booking Engine | Topics 1 + 3 |
| 5 | Payment System (Stripe Connect) | Topic 4 |
| 6 | Notification System | Topics 4 + 5 |
| 7 | Review System | Topic 4 |
| 8 | Customer Behavior Tracking | Topics 4 + 7 |
| 9 | Dispute Handling | Topics 4 + 7 |
| 10 | Admin Panel | All above |
| 11 | Search & Discovery | Topics 7 + 8 |
| 12 | Analytics (PostHog) | All event sources |
| 13 | Future Features (chat, recurring, i18n, etc.) | All above |

---

## PRIORITY LAYERS

| Layer | What | Why it blocks |
|---|---|---|
| **1 — Legal** | T&S, Privacy, Impressum, cookie consent | Can't legally take money |
| **2 — Core** | Roles, onboarding, Stripe Connect, booking, payments, notifications | Can't function as marketplace |
| **3 — Trust** | Reviews, moderation, admin panel, no-show tracking, strikes, disputes | Can't scale safely |
| **4 — Growth** | Search ranking, analytics, chat, recurring, loyalty, i18n | Can't grow efficiently |

---

## COPY-PASTE PROMPT FOR CLAUDE CODE

When starting a topic, paste this into Claude Code along with the topic content:

```
Follow the protocol at `_tasks/roadmap-full-platform-audit.md`.

Execute Phases A→D for the topic below:
A. Audit what exists vs what's missing
B. Gap analysis (UI / backend / security)
C. Generate roadmap at `_tasks/roadmap-{topic-slug}.md` (R1–R10)
D. STOP and show me for review

All CLAUDE.md rules apply. Read it first.

--- TOPIC START ---

[PASTE TOPIC HERE]

--- TOPIC END ---
```
