# Directions loop, 2026-09-05: motion, better-looking elements, tons of mockups in several directions

Owner, dictated 2026-09-05 (speech-to-text, decoded): the 2026-09-04 mockup batch is "completely ass,
I don't know why you keep doing that, let's ditch this whole thing". New task, as a loop: more motion
when clicking and between screens; UI elements that actually look good; use the 21st.dev MCP, or go
into Chrome and research live sites myself and fix the style from those, "because the current one is
not good"; keep comparing our site with Fresha and Airbnb, always, and look at how it is different;
design look = Airbnb style "but not completely"; architecture / placement / how the elements sit =
Fresha as the base ("on the confirmation screen we can copy it from them, they have the same type of
stuff that we want"); "make me tons of mockups, not just one, multiple directions, stop cheaping out,
actually do it".

Standing rules that bind every box: reference captured live or from Mobbin before any opinion
(reference-lock), never from memory; mockups are copies of the real screen with real components, real
seeded data, English copy, at least THREE genuinely different directions per screen (structure or
strategy differs, not paint), stacked so he compares in one glance; motion is proven on video, never a
still; the owner picks taste, critics grade compliance only; commits by the orchestrator only; no
push, ever.

## Boxes

- [x] CORRECTION: the 2026-09-04 micro-mockup batch is rejected as a format (commit d780f0f84)
  - [x] graveyard line written (REMOVED.md) in his words (2026-09-05 04:05, `npm run removed`, entry "mockups-0904 micro-treatment index", _design-system/REMOVED.md:142, commit d780f0f84)
  - [x] the /en/dev/mockups-0904 index is no longer offered to him (files stay in git, unlinked; verified: `grep -c mockups-0904` over the three replies sent since 04:20 is 0; the graveyard row is _design-system/REMOVED.md:142)
- [x] Readback of every ask sent as the first lines of the reply (seven numbered lines, 2026-09-05 04:20; verified: the 04:20 reply opens with "Read back, what I understood:" followed by items 1 to 7; commit d780f0f84 records the same seven asks in this file's header)
- [x] Harden (category 1, his own words), ~/.claude/hooks/mockup-variations.py, already wired on UserPromptSubmit (~/.claude/settings.json:996; verified: `python3 ~/.claude/hooks/mockup-variations.py --selftest` prints 19/19)
  - [x] fires on "all mockups" / "all the screens" with no variation word (the 2026-09-04 goal wording that produced the rejected batch; the BULK arm at ~/.claude/hooks/mockup-variations.py:52, case at ~/.claude/hooks/mockup-variations.py:247)
  - [x] the injected note names the rejected micro-tweak format and the whole-screen-times-three-directions unit (the "THE UNIT IS A WHOLE SCREEN, NOT A TWEAK" paragraph at ~/.claude/hooks/mockup-variations.py:149)
  - [x] self-test 19/19: case 16 (the goal wording, fires, ~/.claude/hooks/mockup-variations.py:247), case 17 (today's dictated message, fires), case 18 (a folder deletion, silent, ~/.claude/hooks/mockup-variations.py:253); selftest output ends "19/19"
- [x] 21st.dev MCP: status reported to him (not connected, key missing or reset, the paste is his; the session's MCP list reports magic (-32001) "Not authenticated - your API key is missing or was reset"; the server entry is ~/.claude.json:2088); the public site is researched by the motion helper in a browser
- [ ] Reference capture, real captures only
  - [x] Fresha structure: booking flow steps (services, professional, time, review) (Mobbin stills, cited per screen; fresha--*.md, 2026-09-05 09:50; no live pull, desktop-width only for search and home; commit 62b95bc5d)
  - [x] Fresha structure: booking confirmation screen (his named example) (Mobbin stills, cited per screen; _design-system/references/fresha--confirmation.md:13, commit 62b95bc5d; no live pull)
  - [x] Fresha structure: venue (salon) page (Mobbin stills, cited per screen; fresha--*.md, 2026-09-05 09:50; no live pull, desktop-width only for search and home)
  - [x] Fresha structure: search results (Mobbin stills, cited per screen; fresha--*.md, 2026-09-05 09:50; no live pull, desktop-width only for search and home)
  - [x] Fresha structure: home (Mobbin stills, cited per screen; fresha--*.md, 2026-09-05 09:50; no live pull, desktop-width only for search and home)
  - [x] Airbnb look: listing page, checkout and confirmation, search results, and one consolidated look recipe with a port map to our tokens and named conflicts with the lockfile (live airbnb.com at 390 via Playwright, confirmation from Mobbin stills; 18 numbers, 6 named conflicts; airbnb--look-recipe.md, commit db44eb92d)
  - [x] (commit 0182c467a; airbnb--motion.md, 217 lines, seven timings verified from video and animations.json; one curve for all of Airbnb's chrome, logged as a conflict with our four tokens) Airbnb motion: card to page, sheet open and close, press states, category switch, back, measured ms and easing from video and animations.json
  - [x] (commit 0182c467a; 21st-dev--motion-kit.md, 240 lines; 4 of the asked 6 to 10 timed, the site hides component source behind a sign-in wall and renders demos in sandboxed iframes, so no source was saved; licence tagged expect, not verified) 21st.dev motion kit: 6 to 10 components that fit a booking flow, timings measured, source kept
  - [x] (commit c396f9103, root cause of its top finding cacb731de; 12 ranked differences, 3 places both references agree against us; `node scripts/measure/compare-solen.mjs` re-measures our column) Standing comparison document Solen vs Fresha vs Airbnb per surface, differences ranked by what a customer notices, plus a re-runnable measure script for the Solen column
- [x] Taste log: dated 2026-09-05 entry with his verbatim words (look Airbnb not completely; placement Fresha base; confirmation copied from Fresha); the CLAUDE.md source-of-truth block amended with the same date (commit d780f0f84)
- [ ] Mockups, wave 1, at /en/dev/directions-0905/<surface>?v=a|b|c, each a real-component copy with seeded data, English, three genuinely different directions
  - [ ] (running: workflow, 3 builders since 10:45) booking confirmation screen: 3 directions (Fresha anatomy, Airbnb look, ours underneath)
  - [ ] (running: workflow, 3 builders since 10:45) booking flow steps with the motion BETWEEN steps: 3 directions, each proven on video
  - [ ] (round 1 built, 9 routes on disk; arbiter: salon set = three gallery treatments on one order, a = the live page; home a and b = the live page; search DISTINCT but b rendered as the grid it was briefed not to be; two critics rate-limited. Round 1b re-briefs with declared axes and a LOOK-FULL direction per screen, scratchpad directions-0905-wave1b.workflow.js) salon page: 3 directions
  - [ ] (round 1b: repair-only, punch lists in the workflow file) search results: 3 directions
  - [ ] (round 1b: a query-builder-first, b Airbnb look at full strength, c kept) home: 3 directions
  - [ ] i18n bug found by the arbiter and confirmed on the REAL /en salon page (curl shows Geöffnet bis, Geschlossen, Termin buchen; SalonServices.tsx passes label="ab"): coder fixing the shared salon components, reviewer after
  - [ ] the direction frame's two fixed overlays (top strip at y=80, switcher at y=633..756 on the salon page) obstruct every comparison: coder moving it to one in-flow strip
  - [ ] (running: workflow, 3 builders since 10:45) click and press motion kit (button, card, pill, sheet): 3 directions, each proven on video
  - [ ] one index page stacking the directions per surface with the recommendation and the one line that flips it
  - [ ] one read-only critic per surface, one arbiter across the set; repaired once where a direction fails compliance
- [ ] Verify: cold-load health on every link at phone width, screenshots, videos for the motion directions
- [ ] Save: commits by the orchestrator, main fast-forwarded, production copy rebuilt in the main checkout, links through the tunnel, every link answers 200 before it is sent
- [ ] Loop continues after wave 1: bookings list, checkout and payment step, profile, empty states, each with three directions; the comparison document re-run after every wave

## Parked (his, not mine)

- 21st.dev MCP key: the connector answers "not authenticated, API key missing or was reset". A fresh key from 21st.dev/mcp goes into the MCP config; that is a credential, so it is his to paste.
- The seven decisions from the 2026-09-04 plan (publish, portfolio components, empty branches, sheet flick, saved boards, long dash, rebook switch) still stand in EVERYTHING_TO_CODEX_2026-09-04.md and are not re-asked here.

## Log

- 2026-09-05 04:10 , loop opened. Graveyard line for the micro-mockup batch. Four research helpers dispatched (Fresha structure, Airbnb look, motion incl. 21st.dev, standing comparison).
- 2026-09-05 10:20 , captures in: Fresha structure for five screens (Mobbin, cited), Airbnb look for three screens plus the 18-number recipe (live at 390), the scaffold (route gate, real booking loader resolving a confirmed Fade Factory booking, comparison frame). Nine static builders launched (salon page, search results, home feed, three directions each) with a critic per screen and one arbiter. The motion captures and the comparison document are still being written; the nine motion builders (confirmation, booking steps, press kit) start when they land. A helper left a measure-first skip flag in ~/.claude; removed.
- 2026-09-05 10:20 , comparison document saved (c396f9103). Its top finding root-caused (cacb731de): the salon page's sticky Book bar is hidden on purpose while the cookie banner is unanswered (SalonMobileBookBar.tsx:69, dated 2026-07-25), so a first-time visitor sees the banner in that strip and no Book button. His call whether that stays. All 18 builders alive and writing (transcripts touched within the last minute); no builder has returned yet.
