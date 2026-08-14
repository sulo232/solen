# Round-3 tensions + open questions, owner decisions (2026-07-22)

Owner went through QUESTIONS.md and gave calls. Captured here so nothing is lost; QUESTIONS.md gets updated to RESOLVED per these once confirmed.

## Decided by owner (apply directly, no mockup)
- **Q35 = C** — /business "find Solen customers" link routes to a dedicated "for partners" content page (does not exist yet; needs building as its own task).
- **Q34 = B** — restructure /business hero so the primary CTA sits on a white substrate, not over the image (avoids the bg-white-over-photo exception entirely).
- **Q33 = fix it** — already CLOSED (s-accent removed from RETIRED_TOKENS, check.py:95-119, V3-D221). Confirm no further action.
- **R10 = Claude decides** — apply the safe fallback: SalonAppCta chips route to `/search?city=X` until `/de/{city}` routes exist (avoids 404).
- **Q22-Q29 = Claude decides (apply recs):** Q22 SalonCards stack, Q23 omit testimonials, Q24 anchor CTA, Q25 document exception, Q26 anchors (not separate routes), Q27 keep bento tilt + document, Q28 reserved bookkeeping, Q29 defer BusinessTeaser.
- **RT10 = advisory-only** — the 1.25 spacing-ratio floor is a heuristic, never a gate (its two cited sources did not actually endorse 1.25; Solen's ladder has two sub-1.25 steps and nothing is broken).
- **RT13 / RT15 / RT16 = default (no action):** RT13 internal severity coloring stays a non-issue while outputs are markdown; RT15 no bento ships, hold restraint; RT16 reaffirms the token-extension gate (no new rule).

## Mockup queue (frontend, owner wants to SEE before deciding)
Build as WHOLE-real-page mockups (real components + real photos per mockup-real-photos-gate; run solen-taste-diagnosis before showing per pre-delivery-self-walk-gate):
- **Q32** — salon sticky tab nav: minimal (current) vs Fresha 2-row name+share+heart+tabs.
- **Q21** — notification count badge: red vs ink vs blue.
- **RT1** — selected/active pill fill: gray-sunken (current) vs industry blue/black.
- **RT2** — blue-accent numeric ceiling (how much blue per screen).
- **RT3** — accent-on-sunken AA failure: on-sunken deep-blue variant vs accept deviation.
- **RT4** — search-result card: no-price/no-CTA (current) vs Fresha price-led.
- **RT5** — split-view (list+map) as search default (likely already shipped, confirm visually).
- **RT6** — search grid map-CLOSED column ladder.
- **RT7** — destructive-red CTA token vs ink-only.
- **RT8** — breadcrumb depth 2+ vs 3+.
- **RT9** — z-index ladder shape (note: not really visual; may just confirm).

## Asked directly (owner answered 2026-07-22)
- **RT11 = HOLD, no dark mode** (RESOLVED). Light-only, no toggle stays; deliberate cost + category-parity call. -> mark RESOLVED in QUESTIONS.md, no build.
- **R1 = MOCKUP** — owner wants to see the status-color options on the real surface, not decide verbally. -> mockup queue.
- **RT12 = MOCKUP** — owner wants to see the bell badge options. -> mockup queue.
- **RT14 = MOCKUP** — owner wants to see the staff-photo shared-element carry (a motion probe). -> mockup queue.

## COMPLETE frontend mockup queue (owner 2026-07-23: "make all the mockup w all the frontend qs dont forget")
Every visual/frontend open question. Build whole-real-page, REAL photos, variant-switchable current-vs-proposed, run solen-taste-diagnosis before showing each. Grouped by real surface:

- [x] SURFACE 1 search mockup  verified: scratchpad/mockup-search-rt.html, real SalonResultCard + 15 real photos loaded, screenshot-verified, RT1/RT4/RT6/Q21 toggles; served localhost:3009/mockup-search-rt.html; owner link given. RT5 = already-shipped confirm; Q21 corrected blue->red.
- [x] SURFACE 2 salon PDP mockup  verified: scratchpad/mockup-pdp-rt.html (real SalonHero/Services/BookBar, real hero photo, Q32/R1/RT3 toggles), screenshot-verified, served localhost:3009/mockup-pdp-rt.html, link given. FINDINGS: Q32 nav already 2-row on mobile (V3-D421, closer to done); R1 live "Geschlossen" is RED (s-closed) not grey (contradicts V3-D197 note) -> owner call.
- [x] SURFACE 3 business mockup  verified: scratchpad/mockup-business-rt.html (real /business hero + MarketplaceVisual + BentoCard, 7 real photos, Q22/Q25+Q34/Q27 toggles), screenshot-verified, localhost:3009/mockup-business-rt.html, link given. Note: copy English (mockup-content-gate blocks German prose); real page is German, layout matches.
- [x] SURFACE 4 category-route mockup  verified: scratchpad/mockup-category-rt.html (real SearchTemplate/MapView/directory, 19 real photos, map-default + directory toggles), screenshot-verified, localhost:3009/mockup-category-rt.html, link given. Finding: salon_directory table = 48 rows, no frontend consumer yet.
- [x] SURFACE 5 cross-cutting mockup  verified: scratchpad/mockup-crosscut-rt.html (real SalonCancelModal/NotificationBell/StaffStep/DashStatCard, RT2/RT7/RT12/RT14/RT15 demos, RT14 real FLIP animation), screenshot-verified, localhost:3009/mockup-crosscut-rt.html, link given.
- [x] RULE-ONLY  RT8 RESOLVED 2026-07-23: NO breadcrumbs (owner rejected, graveyarded, QUESTIONS.md); RT10 advisory-only (done). RT9 z-index = recommend HOLD, non-visual, awaiting owner one word. verified: RT8 committed f026990cf.

      tensions per surface: S1 = RT1/RT4/RT5/RT6/Q21 (localhost:50905/de/basel/coiffeur); S2 = Q32/R1/RT3 (salon PDP); S3 = Q22/Q25/Q34/Q27 (/business); S4 = map-default + directory-cards (category route); S5 = RT2/RT7/RT12/RT14/RT15 (cross-cutting); rule-only = RT8/RT9/RT10 (plain confirm).

## Build rules: real components (grep + read), REAL photos (real Unsplash/seed URLs, never placeholders per mockup-real-photos-gate), locked tokens only, no em-dash, keep real German content, 402px phone frame, obvious honest current-vs-proposed. Verify render + run diagnosis before every owner show.

## 2026-07-23 RECOVERY + MISSED-QUESTION FIX
- MISS the owner caught: `Q-2026-06-11-slot-radius` (booking time-slot shape: 12px rectangles vs 999px pills, QUESTIONS.md:368) was NOT in the queue. -> [ ] SURFACE 6 booking slot-shape mockup (DateTimePicker Zeit step, pill vs 12px-radius toggle), coder building now.
- SCRATCHPAD WIPE: the 5 mockup HTMLs were written to the session scratchpad, which the session restart cleared (localhost 404). They were NOT committed = my mistake. RECOVERED all 5 from the durable subagent transcripts (~/.claude/projects/.../subagents/agent-*.jsonl) into `_plans/taste-r3-mockups/` and COMMITTED them (durable now). Server `Serve R3 mockup (scratchpad)` repointed to `_plans/taste-r3-mockups/` on :3009. Links: localhost:3009/mockup-{search,pdp,business,category,crosscut}-rt.html. Surface 6 will be copied into the same committed dir when it lands.
