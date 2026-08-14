# Owner feedback on the R3 mockups (2026-07-23)

Owner reviewed the 5 mockups. Decisions + reworks + hardens below. Atomic so nothing drops.

## Decisions (record, no rework)
- [x] RT1 selected pill = KEEP GRAY (locked, bg-s-bg-sunken). Blue was wrong to offer, it re-litigated a settled lock. Mark blue-selected REJECTED in REMOVED.md. No mockup change.  verified: applied as RESOLVED in QUESTIONS.md 2026-07-23 (RT1 also REMOVED.md)
- [x] RT4 search-card structure = REJECT the Fresha price-led card. "We do not have that kind of structure at all." Keep current no-price/no-CTA card. Came from research (Fresha real card), not the product.  verified: applied as RESOLVED in QUESTIONS.md 2026-07-23 (RT1 also REMOVED.md)
- [x] RT6 search grid = REJECT the 2-col grid. "We don't have that at all." Keep current 1-col list.  verified: applied as RESOLVED in QUESTIONS.md 2026-07-23 (RT1 also REMOVED.md)
- [x] Q21 notification count badge = APPROVED -> GRAY (not red, not blue).  verified: applied as RESOLVED in QUESTIONS.md 2026-07-23 (RT1 also REMOVED.md)
- [x] RT2 blue-accent ceiling = KEEP CURRENT.  verified: applied as RESOLVED in QUESTIONS.md 2026-07-23 (RT1 also REMOVED.md)
- [x] RT7 destructive-red CTA token = APPROVED. Owner wants it. (add s-error red for narrow destructive commits.)  verified: applied as RESOLVED in QUESTIONS.md 2026-07-23 (RT1 also REMOVED.md)
- [x] RT12 bell badge = GRAY.  verified: applied as RESOLVED in QUESTIONS.md 2026-07-23 (RT1 also REMOVED.md)
- [x] /business (surface 3) = PARK entirely. Owner making a landing page instead. Do NOT touch /business.  verified: applied as RESOLVED in QUESTIONS.md 2026-07-23 (RT1 also REMOVED.md)

## Reworks (rebuild the mockup)
- [x] PDP mockup rebuilt USABLE + English  verified: _plans/taste-r3-mockups/mockup-pdp-rt.html, 0 German hits, "Book appointment" x3, toggle flips live (data-q32 proposed->current on click), screenshot-verified, served localhost:3009/mockup-pdp-rt.html, link given.
- [x] Category mockup DONE+verified ac4961d19: toggles WORK (data-directory current->proposed flips live), 0 View-on-Google links (JS-confirmed viewOnGoogleLinks=0), integrated boxes w/ 'Not bookable'+'On the map' cues, English, screenshot-confirmed. Owner note: toggle effect is off-screen (map=desktop section, directory=list below), offered to co-locate. (owner: no German), AND fix the structure ("structure is fucked up too"). Reuse the REAL SalonResultCard feed variant (DRIFT_LEDGER 2026-07-02), do not re-invent.
- [x] RT14 motion (staff-photo carry) = owner sees NO change. Make the shared-element animation actually visible/obvious, or it is not working.  fixed: rebuilt in _plans/taste-r3-mockups/mockup-crosscut-rt.html, decoupled the flying avatar from the panel slide (was competing with it), custom rAF arc-flight 600ms + subtle scale pulse + large "Play again" button; VERIFIED 2026-07-23: committed d24dcb15c, screenshot-confirmed (bento pale-tint + rAF motion), English 0 German, localhost:3009/mockup-crosscut-rt.html.
- [x] RT15 bento = owner LIKES it, but the COLOR is bad. Refine the cell color (subtler / within-restraint), keep the size/differentiation idea.  fixed: same file, saturated per-cell fills replaced with a single pale opacity-wash per cell derived from already-locked tokens (s-accent 5%, s-bg-sunken as-is, s-ink 3.5%, s-star 8%), text stays ink throughout; VERIFIED 2026-07-23: committed d24dcb15c, screenshot-confirmed (bento pale-tint + rAF motion), English 0 German, localhost:3009/mockup-crosscut-rt.html.

## Hardens (owner explicitly asked)
- [x] H1 no-German-mockups gate DONE (scripts/hooks/mockup-english-only-gate.py, self-test 3/3) commit 0603fb707: block writing a mockup .html with German UI prose (my "keep real German content" instruction was wrong; mockups are ENGLISH). scripts/hooks, self-test, wire.
- [x] H2 DONE: blue-selected graveyarded in REMOVED.md (design-file fix), RT1 RESOLVED in QUESTIONS.md; commit 108822c88 / design-file fix: stop surfacing a LOCKED decision (gray-selected) as an open option. Record blue-selected in REMOVED.md so it never resurfaces; targeted gate if clean.

## Standing rules reinforced
- Mockup copy = ENGLISH always. Real Lucide icons. Closed palette. One ink commit CTA. Selected = calm gray. No re-litigating locked decisions as "options."

## Category mockup v2 feedback (owner 2026-07-23)
- [x] Toggles VERIFIED WORKING (coder+my Playwright/JS test: data-attr flips + CSS responds; owner's 'nothing changes' = effect off-screen). FIX: add CSS keyed on body[data-map]/[data-directory] for both current+proposed. Coder ada6472bcc7a5cea7 dispatched.
- [x] Directory entries DONE ac4961d19: View-on-Google removed (0 links), integrated boxes (MapSalonDetail-grounded). Render as an INTEGRATED box like the real MapSalonDetail.tsx; directions-to-Google belong to the MAP interaction (SalonLocation pattern), not a card out-link. Keep them clearly non-bookable (no price/no Book). Same coder.
