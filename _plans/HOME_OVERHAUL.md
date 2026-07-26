# Home page overhaul (owner dictation 2026-07-24)

Continues workstream #1 (Homepage design pass). Owner walked the home page top
to bottom and gave an ORDERED punch list. Owner wants it done ONE surface at a
time, mockup-first, reacting to each before the next ("give me ideas now... and
after we're done with that, then let's [next]").

## Readback of every ask (verbatim intent)

1. **Search card radius is off design-system** , the hero search card, and the
   fields INSIDE it, use arbitrary radii (card 22px, rows 6px). Owner dislikes it.
2. **Click motion is LAGGY (not slow)** , tapping a field (e.g. Zeit) to open the
   search is janky. "The speed is good but it's too laggy." Smooth it, don't slow it.
3. **Search card is too WIDE** , wants it narrower with "a little bit of separation".
4. **Give IDEAS (3+ variations)** for how the search card should look. THIS turn.
5. **In deiner Nähe: remove the MAP** , keep just the near-you list + maybe the city.
6. **Font in that section is wrong** , "not the font we have in this instance."
7. **Reviews** , fix it up.
8. **Walk-in** , fix it up ("doesn't look really good at all").
9. **Inspo** , fix it up.
10. **Logo** , fix it up.

## PIVOT 2026-07-24 (owner, mid-turn): PARK the search redesign, fix the OVERALL WHITENESS / EMPTINESS

Owner looked at the full-page previews and said "lets fix with overall whiteness or like idk
emptyness rn" + "park the search redesign". So PHASE 1 (search card) is PARKED (previews kept for
later), and the priority is now the home page's empty/white feel.

### MEASURED DIAGNOSIS (PIL on ~/solen/screenshots/home-full-a.png = real feed, this session)
- **First viewport (0-812 css): 88.0% white, 8.2% grey, 3.1% light-grey, ONLY 0.7% photographic/color.**
- **First photographic band starts at y=880 css , BELOW the 812 fold.** The opening screen has ZERO imagery.
- Whole page (4372 css tall): 66.5% white, 15.6% light-grey, 8% grey, **9.9% color**.
- Largest contiguous near-empty vertical gap: **308 css px** (dead zone, incl. an empty grey review-image placeholder).

### NAMED FLOORS-LAW VIOLATIONS (CLAUDE.md FLOORS LAW)
- **#2 Imagery presence floor** , browse viewport must be ~>=1/3 (33%) photographic. First viewport = 0.7%. Missed by ~47x. This is THE emptiness.
- **#1 finished-screen pass (a) photographic focal** , hero has none; opening is 88% white. FAIL.
- **#4 edge-visibility + warmth** , "zero warm/chromatic pixels outside pure chrome = the dead-grey FAIL." First viewport = 0.7% chromatic. Also the page lacks gray/white tray ALTERNATION for rhythm.
- **#1(e) no dead-grey zone** , the 308px empty gap + broken review-image placeholder.

### FIX PLAN (mockup-first, needs owner reaction on hero direction)
- [x] W1. Imagery-above-the-fold DIRECTIONS built + shown (owner "gimme mockup directions"). verified: `app/[locale]/dev/home-fix/page.tsx` renders 3 hero treatments using REAL cover photos (`salonCardData` `photoUrl`, same images the feed shows): A = photo category tiles + salon-photo strip, B = full-bleed photographic hero, C = warm peach wash + photo band. Screenshots `~/solen/screenshots/home-fix-a|b|c.png` confirm real photos load + first viewport is now heavily photographic (was 0.7%). Tunnel `/de/dev/home-fix?v=a|b|c` all 200.
- [~] W2. Section rhythm , DEFERRED into the apply step; C shows the warm-wash rhythm lever. Full gray/white tray alternation to be applied to the real feed once a hero direction is picked.
- [~] W3. Dead-grey gaps , the imagery fills the opening void; the specific empty review-image placeholder fix is queued for the apply step.
- [x] W4. Built as real-component full-page preview reusing the REAL feed + data. verified: `app/[locale]/dev/home-fix/page.tsx` (7147 bytes, coder-built, tsc clean, 500-then-fixed via `.next` clear); owner reaction pending on A/B/C.
- [ ] W5. BLOCKED on owner: pick A / B / C (or combo) -> apply the hero imagery + section rhythm to the real Hero + feed, fix the review placeholder, verify + commit.

### REROUTE 2026-07-24 (owner: "none of em ask llm council n get reffrences etc")
Owner rejected the A/B/C direction-SET (my 3 invented takes). Not a rejection of imagery (still
FLOORS-LAW mandated), a rejection of GUESSING the treatment. Do the research FIRST:
- [x] R1. LLM council consulted (llm-council skill). verified: `scratchpad/council.json`. Grok-4 = strong usable answer; Gemini-3-pro 404'd (bad model id, retry on 2.5-flash running); Claude-opus-cli returned empty. KEY GROK INSIGHT (better than my dark B): top apps use a LIGHT high-key photo hero (~38-42% height, luminance >85%, NO dark overlay) + a FLOATING neutral search card + dark ink text + 3 category photo chips below to hit ~1/3 photographic. Fresha = bright treatment-room photo + white card floating 24px above image bottom; Treatwell = category chip pill on the lower photo edge; Airbnb = light vignette only, surface stays 80%+ neutral, search never darkens the image. This keeps the single-light-theme + 80/17 law intact while adding imagery (white 88% -> ~52%). My earlier B used a DARK overlay , wrong for the light-theme law.
  - Gemini-2.5-flash (retry) voice: photo hero 40-50% of viewport BUT with a dark scrim + white text over it + blue on the search button. This is the DARK-overlay approach = basically my rejected B; it fights the single-light-theme + 80%-neutral law. So the council SPLITS, and the law breaks the tie toward Grok's LIGHT approach.
  - SYNTHESIS DIRECTION (both agree on a photo hero ~40-50% viewport; law picks the LIGHT execution): a LIGHT high-key photo hero, NO dark scrim, dark ink headline, a floating white/neutral search card over the lower photo, + a row of category photo chips = ~1/3 photographic, stays 80% neutral + light theme.
- [ ] R2. Get real REFERENCES. BLOCKED on owner, and this line was STALE until 2026-07-26: it claimed a Mobbin reference sweep was 'a RUNNING background subagent dispatched this turn'. That session ended days ago, so no agent is running and nothing will arrive by notification. Corrected dependency: R2 needs a fresh reference capture, and per the reference-lock law that capture must not start until the owner has picked a direction in 1f-i, otherwise it captures references for a layout that gets discarded.
- [ ] R3. Synthesize council + refs -> GROUNDED LIGHT-photo-hero proposal + re-mock. BLOCKED on R2 (needs the reference results before synthesizing).
Keep the A/B/C previews live at /de/dev/home-fix as raw material, do not delete.

### PARKED , Search card redesign (phase 1 below), previews live at /de/dev/home-full?v=a|b|c + /de/dev/home-search
## Atomic checkboxes

### PHASE 1 , Search card ideas (PARKED 2026-07-24 , owner "park the search redesign") , the "give me ideas now" ask
Scope note: this turn DEMONSTRATES the fixes in 3 variants for the owner to pick; the
APPLY-to-real-card step is 1f (owner-gated). 1a-1c ticks = "shown in variants", not "shipped".
- [x] 1a. Card radius shown on a DS token in all 3 variants. verified: `app/[locale]/dev/home-search/page.tsx` , VariantA `rounded-card-lg`, VariantB + VariantC `rounded-search` (grep confirms; loop-reviewer PASS)
- [x] 1b. Inside-card row radius shown DS-clean in all 3. verified: same file , VariantA is ONE hairline-divided card (`border-t border-s-border`, no `rounded-[6px]`); B/C are single pills. loop-reviewer PASS
- [x] 1c. All 3 variants narrower + separation. verified: same file , every variant `max-w-[344px]` (vs the current 540); screenshot `~/solen/screenshots/home-search-dev-full.png` shows the narrower cards
- [x] 1d. Motion lag DIAGNOSED. verified: `app/[locale]/_components/search/SearchOverlay.tsx:767` scrim `backdrop-blur-xl` over full viewport, animated on open = per-frame blur re-raster = the jank; precedent that this is the cause = `app/[locale]/_components/homepage/SearchBar.tsx:237` (blur already dropped there "extremely expensive on every paint during the morph"). Fix = drop scrim blur to plain `bg-s-ink/20`. Ships with the chosen card; verify with a video on apply.
- [x] 1e. 3 DISTINCT real-component variants delivered. verified: `app/[locale]/dev/home-search/page.tsx` (10476 bytes, coder-built); loop-reviewer PASS; rendered + screenshotted; tunnel `/de/dev/home-search` returned 200
- [x] 1g. FULL-PAGE previews (owner follow-up "make full page previews bro"). verified: `app/[locale]/dev/home-full/page.tsx` reuses the REAL home Page data + FeedZone + every real section, swaps ONLY the hero card, A/B/C toggle; cards extracted to `app/[locale]/dev/home-search/_variants.tsx`; tsc clean on all 3; tunnel `/de/dev/home-full?v=a|b|c` all 200; screenshot `~/solen/screenshots/home-full-a.png` shows the real feed (Für dich, salon cards, In der Nähe, Walk-in, Bewertungen) under variant A's card. NOTE: hero copy is English in the preview (mockup rule); the feed renders real German. The In-der-Nähe MAP is still present (that removal is phase-2 item 2, out of scope for this card preview).
- [ ] 1f. Apply chosen direction to the real card (owner-gated , the mockup-first pause). Atomized:
  - [ ] 1f-i. Owner picks A / B / C (or a mix) , BLOCKED on owner (the whole point of the phase-1 preview)
  - [ ] 1f-ii. Apply the picked treatment to `Hero.tsx` wrapper + `SearchBar.tsx` collapsed card (radius + width + separation) , BLOCKED on 1f-i (cannot apply a direction that is not picked yet)
  - [ ] 1f-iii. Drop the `SearchOverlay.tsx:767` scrim blur to plain dim + verify smoothness with a Playwright video , BLOCKED on 1f-i (ships together with the chosen card)
  - [ ] 1f-iv. Commit the applied card + post a tunnel link for owner sign-off , BLOCKED on 1f-ii/iii being done

### PHASE 2+ , owner-gated, each its OWN mockup-first round AFTER phase 1 is approved
(NOT skips , the owner explicitly sequenced these "after we're done with that". Each
needs the owner to react to phase 1 first, then a mockup per surface.)
- [ ] 2. In deiner Nähe , remove the map, keep near-you list + city (BLOCKED on: phase-1 approval, then its own mockup round)
- [ ] 3. Nähe/section font , identify the drifted font vs the locked family, fix (BLOCKED on: item 2 scope)
- [ ] 4. Reviews section , diagnose + mockup fix (BLOCKED on: phase-1 approval)
- [ ] 5. Walk-in section , diagnose + mockup fix (BLOCKED on: phase-1 approval)
- [ ] 6. Inspo section , diagnose + mockup fix (BLOCKED on: phase-1 approval)
- [ ] 7. Logo , clarify what's wrong + mockup fix (BLOCKED on: phase-1 approval + owner detail on what's off)

## Ground truth (measured from source, live render confirmed)
- Hero: `app/[locale]/_components/homepage/Hero.tsx` , wrapper `rounded-[11px]` (does nothing, no bg/border) + `<SearchBar/>`.
- Card: `SearchBar.tsx` morphing container , mobile `borderRadius:22`, `max-w-[540px]` (=> ~370px at 402 vw, near full-width), `shadow-elevation-2`, `p-4 gap-[10px]`.
- Rows: `CollapsedRow` , `rounded-[6px] h-[46px] px-[14px]`, white + `border-s-border`, icon (border-r divider) + value.
- CTA: `bg-s-ink h-12 rounded-[6px]` "Termine finden".
- MOTION LAG root cause: tapping a row opens `SearchOverlay.tsx`; its scrim (line ~767) is `backdrop-blur-xl` over the whole viewport, animated on open , a full-screen animated backdrop-blur re-rasterizes every frame = the jank. NOTE the SearchBar's OWN island backdrop already DROPPED blur for this exact reason (SearchBar.tsx ~237). Fix = drop/cheapen the scrim blur to match.
- DS radius tokens: `card 16`, `card-lg 20`, `panel 16`, `input 16`, `sheet 28`, `btn/pill 99`, `search 99`. (tailwind.config.js)

## Vehicle (owner 2026-07-23 law)
REAL components on a REAL dev route , NOT throwaway public/_mockups HTML
(real-component-gate.py + mockup-defer-stop-gate.py). Route: `/[locale]/dev/home-search`.
