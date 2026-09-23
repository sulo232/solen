# Solen design reset: one direction, fewer rules, better screens

## Context
The owner's goal: the customer website and the salon dashboard should look and work much better. That means consistent UI, UX flows that work, and good motion and details.

Today there are about 120 design docs, around 55 memory rules, 33 design plans, and many gates. They point in several directions (Fresha, Airbnb, Uber, Aurora) and contradict each other in 34 places (for example button radius, font weights, the grey tray, focus, and the dashboard skin). Most gates don't run.

Owner answers (2026-09-23):
- Pain: rules, UI/UX, motion and details are all inconsistent; there are too many rules and gates; screens don't work well.
- Direction: **Fresha layout + Airbnb look and motion** (one direction; the owner first asked to see options, then picked only this one). Home is unlocked.
- Rules: **Claude decides the structure**, and shows it before changing anything.
- Scope: **customer website + salon dashboard**. The iOS app is out.
- Precedence: **a newer dated owner decision beats an older literal**. Legal and accessibility floors stay on top.

Rule for the whole plan: the direction is picked first, and the rules are rewritten from the pick. Cleaning up the old docs before that would only tidy rules that are about to change.

## Inventory (what exists today, for reference)
- **Rule docs** (`_design-system/`, 56 top-level): LOCKFILE (2166 lines, values), SOURCE (1671, prose law), TASTE_LOG (1369, decisions), plus CONTROL_ELEVATION, MOTION, COPY_LAW, BALANCE, RESTRAINT_TEST, SENIOR_SCORECARD, PRINCIPLES, RATIONALE, TASTE_AUTHORITY, DECISION_AUTHORITY, PROCESS, WORK_TYPES, WAVE_PLAN (stale since June), QUESTIONS, SUGGESTIONS, REMOVED, DRIFT_LEDGER, and 58 component specs.
- **Dead or duplicated:** CANON / CONSOLIDATION / GOVERNANCE_AUDIT (also in archive), UBER_TYPE_SPEC, `refs/` vs `references/`, `docs/design-specs/COMPONENT_SPECS.md`, `docs/audit/*` (April).
- **Generated reports:** `_pending-migration.md` (132k lines), and `_dupe`, `_selected-state`, `_type-scale`, `_geometry`, `_drift`, `_icon-system`.
- **Outside `_design-system/`:** CLAUDE.md, AGENTS.md, `_rules/SOLEN_UI.md` + `SOLEN_PATTERNS` + `search-bar-rules`, 33 `_plans/` design plans, about 55 memory files.
- **Gates:**
  - CI runs visual, lighthouse, motion, floors, i18n, retired-token-sync, duplication-census and inventory. Four of them pass green when the Supabase secrets are missing.
  - Manual only: drift-check, gap-ladder, dead-class, reflow, press, hardcoded-copy.
  - Broken: `npm run consistency` and 4 detectors have no npm entry; two hooks are documented as wired but don't exist.
- **Skills and agents:** fable-frontend, design-suggest, huashu-design, reference-lock, fresha-section-capture, pixel-spec-auto, screenshot-spec, solen-taste-diagnosis, solen-drift-check (3 copies), design-verifier, design-critic, loop-reviewer, mockup-builder.
- **The 34 contradictions**, with file:line citations, are copied into the Phase 2 working checklist.

## Phase 0: record the precedence decision (small, today)
- In CLAUDE.md's Solen precedence section, add: "A newer dated owner decision beats an older literal in any tier below the legal and safety floors. Update the file that holds the older literal in the same turn."
- Record it in `~/.claude/DECISIONS.md`.
- Delete the competing precedence lists: RATIONALE:7, CANON:5, QUESTIONS:5, and the LOCKFILE:2037 note.

## Phase 1: the one direction, done properly (the owner approves)
Owner answer: the direction is **Fresha layout + Airbnb look and motion**. That is the current rule; there is no multi-direction comparison. Home is **unlocked** (supersedes the 2026-09-06 J decision). Record this in TASTE_LOG and CLAUDE.md in Phase 0.

1. **Capture the exact reference surfaces**, reusing the existing captures in `_design-system/references/` (Airbnb 18, Fresha 9) where they already cover the surface:
   - Fresha (`fresha-section-capture`) for structure: salon page, booking step, search results, the partner dashboard home and calendar, and the marketplace home.
   - Airbnb (`reference-lock`) for look and motion: type, radius, spacing, elevation, selected states, sheets, and press and page transitions.
2. **Settle the open contradictions from the references.** Show real-size variants only where the reference doesn't decide:
   - button and chip radius, and the payment capsule
   - weights (400/500 vs 600)
   - the size ceiling vs CTA 15
   - tray vs no tray
   - close control
   - booking pill and calendar day colour
   - frosted bar
3. **Build a whole-page mockup of each screen in the direction**, with real data, at 402px and desktop:
   - home
   - salon page
   - booking step
   - search results
   - dashboard home and calendar
   
   Include live motion: press, sheet open, page transition, loading.
4. **Binding throughout:** calm colour, clean typography, the 44px touch floor, WCAG AA, and the keyboard-only ink focus.
5. **Delivery:** one `/en/dev/direction` preview on a Cloudflare tunnel link, one question per screen. Before sending, verify it in the browser (screenshots, measured DOM, recorded motion).

## Update 2026-09-23 (later): owner feedback on the applied look, and the X.com research ask

### Owner verdicts on the real salon and search pages ("today" vs "picked look")
- **Buttons are fully round (capsule) everywhere.** This covers Book appointment, View all and the small Book buttons, and it reverses the 12px rounded rectangle from the C picks.
- **Salon page screens 2 and 3 look good otherwise:** 20px boxes with a soft shadow and no outline.
- **The category pill row on the salon page (screen 1) looks wrong.**
  - The short "All" pill with its grey selected fill looks warped, because it becomes almost a circle.
  - He is unsure whether the selected pill should be grey.
  - Next: give short pills a minimum width, and show the selected state as a one-change comparison (grey vs ink vs outline only) on this same row.
- **Search results:** no visible difference, which is fine because it is already close.
- **Separate follow-up rounds:**
  - category icons (Hair Salon, Barbershop, and so on)
  - bottom navigation icons (Search, Inspo, Saved, Sign in)
  - the bottom navigation design itself
- **His overall goal:** fix the design system and the component system as a whole.
- **Record in TASTE_LOG and commit** once plan mode ends: buttons are capsule, which supersedes the 12px entry.

### Step A (next, small): re-shoot the look with capsule buttons
- Re-run `scratchpad/look/shoot.mjs` with primary and secondary buttons set to 9999px and short pills given a 64px minimum width.
- The last re-run did not change the output, so check that the new PNGs actually differ before sending.
- Send today vs new for salon screens 1-3.
- Send the selected-pill comparison (grey / ink / outline) as one image.

### Step B: X.com saved-design research, one phase at a time (the owner's ask)
The owner has many saved design posts on x.com. He logs in on Chrome, and we work through them phase by phase.

- **B1 Access and collect (read-only):**
  - Owner answers: the source is the **Bookmarks** tab only, and access is through **Chrome with the Claude extension**.
  - The owner logs in to x.com in Chrome with the Claude in Chrome extension connected. I use the `mcp__claude-in-chrome__*` tools.
  - I open his Bookmarks and scroll to the end. I never like, post, reply, follow or change anything.
  - Each post goes into a ledger `_design-system/research/x-saved-2026-09/ledger.json`: URL, author, date, text, media type (image, video, GIF), and linked site (21st.dev, Dribbble, a live site and so on). Images are saved as stills, and videos as frame strips plus the source link.
  - Stop check: the ledger count matches the number of bookmarks reached at the end of the scroll.
  - Show him the count and a contact sheet of thumbnails before going further.
- **B2 Sort:**
  - Tag each design post by what it teaches: motion (enter, press, page transition, scroll-linked, micro-interaction), shape and radius, depth and shadow, colour, type, layout, component (button, card, nav, sheet, input, icon), or onboarding and empty states.
  - Non-design posts are listed and dropped.
  - A sonnet subagent works from the saved ledger only, not from the live site.
- **B3 Compare with Solen:**
  - For each tag, name what the saved posts do repeatedly and what Solen does today, measured on real routes. For example, today's salon page alone uses 9 different corner values: 9999, 24, 22, 20, 16 and 10 px.
  - Report the **fundamental differences** (for example "they animate every state change and we don't", or "they use one radius family"), each with their clip or still next to our screen.
  - Deliverable: one visual page plus images sent in chat.
- **B4 Adopt:**
  - For each difference worth taking, make a one-change comparison on a real Solen page (ours vs ours plus that one thing).
  - He picks. The picks feed Phase 2 (design system) and the component system.

### Revised order
1. Step A: capsule re-shoot and the pill question.
2. Step B: X research, B1 to B4, one phase per round with his OK between phases.
3. Phase 2: design system rewrite (tokens, radius family, motion vocabulary) plus a component system audit that maps every button, pill and card variant in code onto a few.
4. Icons and bottom navigation round.
5. Phase 3-5 as below.

## Phase 2: rewrite the rules from the pick (structure shown before any change)
Proposed structure: 5 live files, everything else archived.

| File | Holds |
|---|---|
| `_design-system/DESIGN.md` (new, about 1 page) | direction, principles, precedence, how design work runs (mockup, approval, verify), where things live |
| `LOCKFILE.md` (rewritten, short) | values only, matching `tailwind.config.js` and `globals.css`: colour, type, radius, spacing, shadow, motion tokens |
| `TASTE_LOG.md` | dated decisions only; the old entries go to archive with an index |
| `components/*.md` + `COMPONENT_REGISTRY.md` | one spec per shared component, registry refreshed (193 of 324 missing today) |
| `REMOVED.md` | kept as is |

- **Archive:** SOURCE, PRINCIPLES, RATIONALE, BALANCE, RESTRAINT_TEST, CONTROL_ELEVATION, UBER_TYPE_SPEC, WAVE_PLAN, QUESTIONS, the duplicates, the April docs, the `_*` reports, the old `_plans/` design plans and `_rules/SOLEN_UI`. Their still-valid content is folded into DESIGN.md or LOCKFILE first.
- **Merge:** TASTE_AUTHORITY + DECISION_AUTHORITY become one section of DESIGN.md.
- **Keep** COPY_LAW and MOTION, but trim both to the chosen direction.
- **Contradictions:** each of the 34 gets resolved by the pick or marked as an owner question. The remaining open ones (payment capsule, and anything the pick doesn't settle) get shown as visual choices.
- **Memory:** delete or rewrite the design memory files that conflict with the new core. Point CLAUDE.md and AGENTS.md at DESIGN.md. AGENTS.md is edited only with the owner's OK, because it is the Codex file.
- **Order:** show the owner the new DESIGN.md and LOCKFILE drafts before archiving anything. Commit each step.

## Phase 3: tokens in code
Update `tailwind.config.js` and `app/globals.css` to the approved values: radius, weights, spacing, shadows, motion durations and easing. Then fix the direct fallout; for example, the 212 `rounded-[16px]` literals get replaced with tokens.

Verify on the real routes with screenshots and measured DOM, and run the existing `test:visual`.

## Phase 4: screen-by-screen improvement (UX + consistency + motion + details)
- **Order:**
  - Customer: search, then salon page, booking, checkout, and profile/account.
  - Dashboard: home, calendar, bookings, clients, and settings.
- **Home is included** (unlocked by the owner 2026-09-23). It goes first, using the approved Phase 1 mockup.
- **For each screen:**
  1. Run `solen-taste-diagnosis` plus a flow walk to find UX problems.
  2. Build a mockup of the fixes in the chosen direction and get owner approval.
  3. Implement, then verify the same scenario on a tunnel link.
- **Motion:** apply one shared motion vocabulary across all screens.

## Phase 5: gates (few, working)
- **Keep** the CI gates that work, and confirm the Supabase secrets exist so they stop passing green without running.
- **Rewrite** `solen-drift-check` rules to the new LOCKFILE and run it on changed files in CI, report-only at first. The owner decides whether it ever blocks.
- **Delete** the orphans: the `consistency` wrapper and its 4 detectors, unless one proves useful, the 3 copies of drift-check reduced to 1 plus the Codex mirror, and the docs claiming hooks that don't exist.
- **No new blocking gate** without a real incident and tests (global rule).

## Verification
- **Phase 1:** preview measured at 402px and desktop, motion recorded, tunnel link opened fresh.
- **Phase 2:**
  - A re-run of the contradiction sweep finds 0 unresolved conflicts in the live files.
  - grep proves no live doc cites archived files.
  - `npm run exists` still works.
- **Phase 3-4:** each screen gets screenshots and measured DOM before and after, keyboard focus is checked, and `test:visual` plus `check:motion` pass.
- Commit each verified chunk. No push.

## Open, asked later
- Phase 1: approval of each screen mockup, and the variant picks where the references don't decide.
- Phase 2: approval of the DESIGN.md and LOCKFILE drafts.
