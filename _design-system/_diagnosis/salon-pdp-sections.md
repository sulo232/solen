<!-- exists-check: net-new vs docs/roadmaps/02-salon-cards.md + _tasks/archive/CLAUDE_DESIGN_* because this is a NEW measured per-turn diagnosis artifact for the mockup-diagnosis-gate, not a roadmap or archived plan -->
# Salon PDP , measured diagnosis (LOCKFILE-cited). 2026-07-19

This is a CODE DRIFT sweep, not a design exploration. Three section wrappers drifted off the section-card
grammar the owner locked the SAME DAY (LOCKFILE §427, 2026-07-19: `rounded-[24px] border border-s-border
bg-white shadow-whisper`). Measured on the real /de/salon/blade-and-stone.

| # | file:line | measured (current) | violates | target (the fix) |
|---|---|---|---|---|
| 1 | SalonServices.tsx:132 | rounded-24 + border + shadow-whisper | , | CORRECT , reference, do NOT touch |
| 2 | SalonTeam.tsx:111 | rounded-3xl + no border + shadow-float | LOCKFILE:427 | rounded-[24px] border border-s-border bg-white shadow-whisper |
| 3 | SalonReviews.tsx:88 | rounded-2xl(16) + no border + shadow-float | LOCKFILE:427 | rounded-[24px] border border-s-border bg-white shadow-whisper |
| 4 | SeeAllButton.tsx:57-60 | bg-s-bg-sunken px-8 py-3 pill (150x45) | LOCKFILE:170 | ink text link `text-s-ink 14/600` + trailing `<ChevronRight h-4 w-4 text-s-ink-3>`, no pill/fill/underline |

Not a defect (do NOT re-touch): the services already render correctly; the locked select affordance is per-service
"Buchen" + the "Alle ansehen" -> /booking deep-link. Do NOT re-add a `+`-select or fabricate tiers (that was the R5 invention).

## Owner decision needed (a real LOCKFILE contradiction)
- Team = grouped list-card (LOCKFILE:427, staff listed) OR individual entity-cards (LOCKFILE:428, "stylists individual not groups")? Both dated 2026-07-19. Either reading still kills the current shadow-float/no-border/wrong-radius drift, but the final Team grammar depends on this.

## Reviews , the "flat/broken/(11)/too long" content (3 directions, grounded)
- **A (recommend):** summary-first, compact. Star + `4,8` + fold the count INTO the ink see-all ("Alle 11 Bewertungen ›") , kills the bare blue "(11)". Then the 2 best reviews, gap-separated, no per-row cards. Shortest fix for "too long".
- **B:** distribution-led (5-bar star histogram). FLAG: a code comment says the histogram was "dropped per owner" (not in REMOVED.md) , needs an explicit un-drop.
- **C:** featured-voice-led (one hero review + a chrome-less horizontal peek).

## The gate built to stop the recurrence
`.claude/hooks/mockup-diagnosis-gate.py`: blocks any mockup Write without a `Diagnosis:` manifest (measured | violates LOCKFILE | target), and blocks NO-OP rows (measured == target). Root-cause fix: no more inventing a change instead of deriving it from a measured page-vs-lock diff.
