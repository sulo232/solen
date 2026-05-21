# Solen Frontend — Structure Audit (Deliverable 4)

> File hygiene, dead code, doc rot, and "what we need to add" — synthesized from chunk reports + repo state at HEAD.

---

## 1. Repo root — scratch files

Files that should NOT be tracked in git but are. Mostly tmp/lint/tsc/build outputs from past sessions.

| file | size | last-modified | recommendation |
|---|---|---|---|
| `tmp_header.tsx` | 26K | 2026-04-30 | delete (scratch component) |
| `tmp_homepage.tsx` | 0B | 2026-04-30 | delete (scratch component) |
| `tmp_out.tsx` | 15K | 2026-04-30 | delete (scratch component) |
| `tmp3.tsx` | 27K | 2026-04-30 | delete (scratch component) |
| `tmp_header.tsx` | 26K | 2026-04-30 | delete (scratch component) |
| `tmp_homepage.tsx` | 0B | 2026-04-30 | delete (scratch component) |
| `tmp_out.tsx` | 15K | 2026-04-30 | delete (scratch component) |
| `tmp_log.txt` | 23K | 2026-04-30 | delete (transient output) |
| `tmp_log.txt` | 23K | 2026-04-30 | delete (transient output) |
| `lint_err.txt` | 318B | 2026-04-30 | delete (transient output) |
| `lint_err2.txt` | 70K | 2026-04-30 | delete (transient output) |
| `lint_out.txt` | 0B | 2026-04-30 | delete (transient output) |
| `lint_output.txt` | 76B | 2026-04-30 | delete (transient output) |
| `lint_txt.txt` | 135B | 2026-04-30 | delete (transient output) |
| `lint-output.txt` | 174K | 2026-04-30 | delete (transient output) |
| `lint-results.txt` | 33B | 2026-04-30 | delete (transient output) |
| `lint_err.txt` | 318B | 2026-04-30 | delete (transient output) |
| `lint_err2.txt` | 70K | 2026-04-30 | delete (transient output) |
| `lint_out.txt` | 0B | 2026-04-30 | delete (transient output) |
| `lint_output.txt` | 76B | 2026-04-30 | delete (transient output) |
| `lint_txt.txt` | 135B | 2026-04-30 | delete (transient output) |
| `tsc_audit.txt` | 201K | 2026-04-30 | delete (transient output) |
| `tsc_audit_utf8.txt` | 100K | 2026-04-30 | delete (transient output) |
| `tsc_err.txt` | 114K | 2026-04-30 | delete (transient output) |
| `tsc_errors.txt` | 227K | 2026-04-30 | delete (transient output) |
| `tsc_errors_utf8.txt` | 113K | 2026-04-30 | delete (transient output) |
| `tsc_output.txt` | 114K | 2026-04-30 | delete (transient output) |
| `tsc_utf8.txt` | 56K | 2026-04-30 | delete (transient output) |
| `tsc_audit.txt` | 201K | 2026-04-30 | delete (transient output) |
| `tsc_audit_utf8.txt` | 100K | 2026-04-30 | delete (transient output) |
| `tsc_err.txt` | 114K | 2026-04-30 | delete (transient output) |
| `tsc_errors.txt` | 227K | 2026-04-30 | delete (transient output) |
| `tsc_errors_utf8.txt` | 113K | 2026-04-30 | delete (transient output) |
| `tsc_output.txt` | 114K | 2026-04-30 | delete (transient output) |
| `tsc_utf8.txt` | 56K | 2026-04-30 | delete (transient output) |
| `build_error.txt` | 1.1K | 2026-04-30 | delete (transient output) |
| `build_output.txt` | 210B | 2026-04-30 | delete (transient output) |
| `build_trace.txt` | 1.7K | 2026-04-30 | delete (transient output) |
| `full_build_error.txt` | 1.0K | 2026-04-30 | delete (transient output) |
| `claude_help.txt` | 17K | 2026-04-30 | delete (transient output) |
| `eslint.json` | 4.3M | 2026-04-30 | evaluate (config?) |
| `fix-emails.js` | 2.8K | 2026-04-30 | archive to scripts/ or delete |
| `fix-locales.js` | 1.9K | 2026-04-30 | archive to scripts/ or delete |
| `fixTranslations.js` | 1.1K | 2026-04-30 | archive to scripts/ or delete |
| `lint_fixer.js` | 1.9K | 2026-04-30 | archive to scripts/ or delete |
| `temp_routes.txt` | 2.1K | 2026-04-30 | delete (transient output) |

**Recommendation:** Add the matching patterns to `.gitignore` so this doesn't recur:
```gitignore
# Transient outputs (audit found ~30 in repo root)
tmp*.tsx
tmp*.txt
lint_*.txt
lint*.txt
tsc_*.txt
tsc*.txt
build_*.txt
full_build_error.txt
claude_help.txt
eslint.json
temp_routes.txt
fix-*.js
lint_fixer.js
fixTranslations.js
```

---

## 2. Orphan components (54 files — see CURRENT_STATE.md for full list)

Per Deliverable 3, 54 components in `components/**/*.tsx` are not imported anywhere across `app/ + components/ + lib/ + hooks/`. Some may be:
- Dead experiments — safe to delete
- Wired via dynamic import — need verification before deleting
- Feature-flag-gated — keep but mark
- `.figma.tsx` test variants — separate concern

**Recommendation:** Review the 54-file orphan list; for each, decide: keep / delete / mark-experimental.

---

## 3. Dead routes in `app/[locale]/`

Routes detected at HEAD:
- [city]
- account
- agb
- angebote
- auth
- barbershop
- behandlungen
- booking-action
- bookings
- brand
- checkout
- coiffeur
- coming-soon
- compare
- confirmation
- dashboard
- datenschutz
- discover
- fuer-salons
- help
- impressum
- last-minute
- layout.tsx
- legal
- loading.tsx
- loyalty
- makeup
- nail-tech
- nails
- not-found.tsx
- onboarding
- page.tsx
- partner
- privacy
- profile
- referral
- salon
- search
- spa
- staff-invite
- termine
- terms
- tip
- tos
- vouchers
- walk-in-pay
- warum-solen
- waxing

**Manual review needed for each route** — chunks flagged these as candidates for review:
- `/termine` — Q9 says redirect to `/profile/bookings` but chunks suggest still renders (confirmed drift in GAP_AUDIT_V2 NEW-5)
- `/last-minute` and `/angebote` — both routes coexist (additive rename in batch 21, never cleaned)
- `/coming-soon` — referenced from feature-gated UI; verify still needed
- `/spa`, `/waxing`, `/makeup` — gutted to placeholders in batch 04, never restored. May be entry points to nothing.
- `/brand` — verify wiring

---

## 4. `_tasks/` folder — stale files

Per chunk audits, these `_tasks/` files reference retired decisions:

| file | issue |
|---|---|
| `_tasks/SOLEN_DESIGN.md` §17 | Cites retired "Von Basel. Für Basel." voice example (Q5 retired); should reflect "Für deine Stadt." |
| `_tasks/BACKEND_NEEDS_UI.md:99` | Lists stale "navy, teal, peach, #FFFCFB" palette — should reference current coral system (or upcoming green system after pivot) |
| `_tasks/REDESIGN_INVENTORY.md` | Generated mid-coral-V3 era; may reference retired Zone language |
| `_tasks/INVENTORY_FULL.md` | Same generation-era concern |
| `_tasks/MASTER_ROADMAP.md` | Per GAP_AUDIT_V2 NEW-8: header phase numbers were renumbered but body cross-references may still say "Phase 1 ship-blockers" |
| `_tasks/AGENT-PROMPTS.md` | Verify still relevant given current workflow |
| Multiple `_tasks/completed/*` | Archive of finished tasks — preserve as historical |

---

## 5. `_rules/` folder consistency

Files at HEAD:
- AGENT_COORDINATION.md
- CODE_SAFETY.md
- DB_SCHEMA.md
- I18N_ROUTING.md
- KEY_FEATURES.md
- LESSONS_LEARNED.md
- ROADMAP_RULES.md
- SECURITY_RULES.md
- STRUCTURAL_RULES.md
- SYSTEMS.md

**Internal contradictions to check:**
- `CODE_SAFETY.md` vs new `CLAUDE.md §🔍 Verify Before Asking` — verify alignment
- `STRUCTURAL_RULES.md` mentions Zone language? (chunks suggest some `_rules/` files may still reference retired V5 zones)
- `LESSONS_LEARNED.md` should reference today's learnings (e.g. the 115-line canonical CSS class loss)

**Lost from `_rules/`:** `_rules/UI_RULES.md` (234 lines) was created in batches 12+24 and deleted at HEAD. Whole UI rules file gone.

---

## 6. Folder hygiene — current 11 underscore folders

- _audits/
- _docs/
- _manual_testing/
- _plans/
- _prompts/
- _roadmaps/
- _rules/
- _specs/
- _tasks/
- _visual-qa/

That's a lot of namespacing. Some candidates for consolidation:
- `_docs/` + `_specs/` + `_roadmaps/` — overlapping purposes; could merge into `_docs/`
- `_visual-qa/` + `_manual_testing/` + `_audits/` — also overlapping
- `_prompts/` + `_tasks/` — both task-related
- `_plans/` — keep separate (in-flight planning)

**Recommendation:** Decide consolidation when answering Questionnaire V2 — it's a folder-design question.

---

## 7. What we need to add — gap analysis

Synthesized from Deliverables 1-3 + `_tasks/BACKEND_NEEDS_UI.md` + `_tasks/GAP_AUDIT_V2.md`:

### State primitives (none of these exist in components/ui/)
- **Loading skeleton component** — generic skeleton for cards/lists/page-states
- **Empty-state component** — homepage cold-start, search no-results, favorites empty
- **Error-state component** — payment fail, network fail, form invalid, 500
- **Success/confirmation component** — booking confirmed, salon saved, email sent
- **Disabled state spec** — every button/input/pill needs it; not codified

### Surfaces (none locked)
- **Toast / snackbar** — needed for every async action
- **Modal / dialog** — beauty profile edit, GDPR confirm, login prompt
- **Bottom sheet (mobile)** — "Wann" picker, map pin preview, mobile filter
- **Dropdown / popover** — profile menu, filter dropdowns
- **Command palette** (per BACKEND_NEEDS_UI) — Ctrl+K search

### Forms (none of these have a system spec)
- Input states — rest/focus/error/disabled/read-only
- Autocomplete dropdown — search bar grouped suggestions (salons / services / cities)
- Filter chip — active filters as removable pills (`SearchCriteriaChips` exists but no system rule)
- Toggle / switch
- Checkbox / radio
- Step indicator — booking wizard 4-step progress (4-step exists, indicator doesn't)

### Domain widgets (locked but unbuilt or needing spec)
- **Solen Favorit badge** — Q10 locked yellow algorithmic curation, no shape/size/icon spec
- **Claim ribbon** — Q13 locked for scraped profiles, no visual spec
- **Swipe carousel** — Q3 lock, dots + snap rules unspecified
- **Loyalty stamp + QR** — backend ready, no UI
- **Walk-in queue card** — barber-specific, no UI
- **Nail shape + length picker, hand chart** — nail-specific, no UI
- **Allergy warning banner** — booking flow, legal-relevant

### Page layouts (no current locked spec)
- Salon detail page layout
- Booking wizard 4-step flow (BookingWizard component exists, no system layout spec)
- Profile page layout
- Discovery page layout
- Dashboard shell (B2B side — currently `SOLEN_DESIGN.md` is consumer-only)

### From GAP_AUDIT_V2 (still open)
- TWINT integration (Q8 — required for CH market)
- Footer tagline retired-Basel voice (Q5 mismatch)
- Hardcoded "Basel" in 80+ message strings (Q5 dynamic city violation)
- Bottom nav 5-tab vs Q14 4-tab spec (Q14 conflict — code has 5)

### Newly identified gaps from this audit
- **Restore 115 lines of canonical interaction utility classes** (`.btn-primary`, `.filter-pill`, etc.) lost in batch 54
- **Restore plum Last Minute section** (Q16 doc says it should exist; reverted in batch 29; doc/code mismatch)
- **Restore skip-to-content link** (a11y, lost batch 08)
- **Decide fate of orphan filter components** (CategoryPills, GenderToggle, PatternSelector, StyleNamePills)
- **Decide fate of FilterBar.tsx** (orphaned post-`SearchFilterBar` deletion)
- **Decide fate of Spa/Waxing/Makeup category pages** (gutted to placeholders, never restored)
- **Decide fate of phone OTP step in B2B registration** (removed; security/UX trade-off worth re-evaluating)
- **Resolve the green/amber pivot** (today's uncommitted work needs to land or roll back)

---

## 8. Highest-priority cleanup items (ordered)

1. **Doc/code contradiction: plum Last Minute section** — Q16 says exists, code reverted it. Decide: keep doc, restore code? Or update doc to match reality?
2. **Restore canonical interaction utility classes** (115 lines lost in batch 54)
3. **`/termine` redirect to `/profile/bookings`** (Q9 violation)
4. **Add 30+ scratch files to `.gitignore`** + delete tracked copies
5. **Fix 244 files with V5 Zone or `s-dm-*` retired tokens**
6. **Fix 250 files with dead `dark:*` classes**
7. **Resolve orphan filter components + FilterBar.tsx (5+ files)**
8. **Decide spa/waxing/makeup category fate**
