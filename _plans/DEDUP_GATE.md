<!-- batch: store "Alle ansehen" primitive UI + duplication gate (owner 2026-07-19) -->
# Store "Alle ansehen" primitive UI , duplication check + gate

Owner: "when u click back and then on store page and then alle ansehen on the store page it still shows me primitive did u like make one from the scratch and now we gave a duplicate? if it is true its a big issue n u have to make a whole gate."

## Asks (atomic)
- [x] Investigate the "primitive Alle ansehen" , what component is it? , it is `app/[locale]/_components/salon/SalonServicesSheet.tsx`, the salon PDP "Alle ansehen" full-screen sheet. It is a PARALLEL service-selection UI (own category scroll-spy + rows + select toggle + total bar) that duplicates the booking `components-legacy/booking/ServicesStaffStep.tsx`. Its select toggle is the old ink-fill circle (`bg-s-ink`, line 296) + gray category pills = the "primitive" look. Rendered live 2026-07-19 to confirm.
- [x] Did I build it from scratch this turn (a fresh duplicate)? , NO. `git`: SalonServicesSheet was NOT touched by any of this turn's commits; it pre-dates them (design commits 01e37c774 / 94d377217, ~May). My booking rebuild just made the divergence more visible (booking got the new treatment, the sheet stayed old).
- [x] "Make a whole gate" , the gate ALREADY EXISTS: `.claude/hooks/pre-build-exists-check.sh` blocks a new component until `npm run exists` ran. Building a second gate would itself be a duplicate. The real bug was a COVERAGE HOLE: its globs matched `components/**` + `components-legacy/**` but NOT `app/**/_components/**` (the app's primary component tree), so creating a component there was never gated. FIXED: added `*/_components/*.tsx|*.jsx`. 8-case tested (block new _components w/o exists, pass existing / non-component / override). (20b41a8f5)
- [x] FIX the actual existing duplicate , DONE 2026-07-19: owner picked (A) ("yebno sh why are you even asking"). SalonServicesSheet.tsx DELETED, "Alle ansehen" now `href` -> `/salon/[slug]/booking`, REMOVED.md fed, TabPill stale comment cleaned, verified live (9255c966b / 7dcd43e90). Options were:
    (A) DELETE the sheet, make "Alle ansehen" deep-link into the booking flow's step-1 (which already IS a service browser + is the nicer one). Removes the duplicate entirely.
    (B) UPGRADE the sheet to reuse the booking step's treatment (black pills, tap-to-expand, ToggleCircle) , keeps two implementations but visually consistent.
    (C) Keep as-is.
  Recommendation: (A) , it kills the duplicate instead of maintaining two. Needs owner's call before touching the approved PDP.

## Status
Gate hole fixed + tested + committed. The existing duplicate itself is parked on the owner's (A)/(B)/(C) decision.
