# Restraint Test , the look north-star (2026-06-10)

Companion to `SENIOR_SCORECARD.md`, for the LOCKED restraint model (`CANON.md §0`). Source: llm-council
(Opus + Grok, 2026-06-10) on "how to make the restraint look feel premium/alive WITHOUT adding colour."

**The model in one line:** clickability = AFFORDANCE not colour; colour is rare. The danger of that model is
**focal collapse** , with colour neutralized, every element gets equal weight, the eye lands nowhere, and the page
reads legible-but-inert ("dead-grey"). Apple / Airbnb / Fresha avoid this with ONE undeniable focal per screen
(almost always a photograph or one big typographic statement). They are not "minimal" , they are LOUD, just not in colour.

---

## THE 5-QUESTION RESTRAINT TEST (Pass/Fail on every customer screen)

1. **Photo focal?** Is there a real, large photograph carrying the screen (salon space / the work / the stylist)? On a PDP the hero photo IS the page top (full-bleed, ~80vh mobile, no card chrome, no filter wash). A screen of 14px ink-on-white blocks fails.
2. **One big thing?** Can you name the single focal in 0.5s, enforced by SIZE + WEIGHT (never colour)? PDP = the photo; booking step = the date/time grid; confirmation = the SuccessMark + headline. If you can't name it, the screen is dead-grey.
3. **Mono on the one number?** Is the single most important number (price / queue position / slot count / date+time) in JetBrains Mono at a confident size? One mono numeral reads premium in a way colour can't fake.
4. **Motion at the peak?** Does the screen's peak moment animate (press-feedback scale .98/120ms everywhere; slot-fill 180ms ink from centre; SuccessMark ~80px spring + haptic; sheet spring; image hover scale 1.02 in-mask)? Static restraint = pharmacy. But ONLY the peak , not everything.
5. **Semantic colours present + used?** Yellow star, green availability dot, green success disc, pink save heart, red error, orange surcharge. These are NOT in the blue debate , they signal "finished product, not wireframe." If they were "tidied out" in the name of restraint, the screen collapses.

A customer screen ships only when all 5 = Pass (plus the SENIOR_SCORECARD 5 dims).

---

## Where "life" comes from, RANKED (invest top-down)

1. **Photography (~50%)** , the single biggest lever, most under-invested. Salon is a sensory product; the photo IS the offer. Full-bleed PDP hero, a treatment/result portfolio grid sized like the hero, 6+ real photos per salon (3 space, 3 work), shallow DOF, no stock, **zero filter/gradient washes** (Grok allows a 4-6% warm overlay only where the cool grey clashes with an image). **Photography is a PUBLISHING GATE** , a salon with 1 stock photo breaks restraint and no typography can save it ("Add photos to publish").
2. **Typography (~25%)** , with colour neutralized, weight+size ratios do colour's old job. Be BOLD: PDP salon name 28-32px Inter Tight 700 vs 14px body Inter 400 (a 2x jump = confidence, not loud). Confirmation headline 36px+. One mono number per screen. Body line-height 1.55+, display tracking -0.01em. Italic is the one allowed "decoration" (trust phrases: "most booked this month"). **Don't shrink display to "look calm"** , calm = one big thing + many small things, not everything medium.
3. **Motion at peak moments (~15%)** , the vocabulary: press scale .98 (~120ms, mandatory), date/slot 180ms ink-fill from centre, SuccessMark green disc 200ms scale + white check stroke-draw 240ms + iOS haptic, sheet spring (stiffness ~300 / damping ~30), page transition opacity + 4px y (240ms), image hover scale 1.02 inside its mask + hairline #E4E4E7→#18181B over 160ms. More than this = novelty drift; none = dead-grey.
4. **Whitespace / rhythm (~7%)** , the page must breathe: 64-80px between major mobile sections (most apps use 32-48 and feel cramped), card padding 16-20 (not 12), strict 8pt but lean to the larger of each pair. One full-bleed image to "open" the page; rest max-width ~1180px.
5. **Depth / shadow (~3%)** , almost imperceptible. Cards `shadow-elevation-2` rest; photos flat (the photo is the depth); FROST_GLASS over photos is the one theatrical depth (floating Book CTA + salon-name overlay on the hero).

---

## What most booking apps get WRONG (fix these in the redo)

### Salon PDP
1. **Photo grid as a widget** , 3x 80px thumbnails in a bordered card under a "Photos" heading. WRONG. Photo IS the page top, no chrome. Mobile = full-bleed hero ~80vh + "1/8" counter + swipe; desktop = 1 large + 4 small Airbnb grid.
2. **Service list is an undifferentiated wall** , under restraint it collapses to porridge. Group by mood/length (Express 15-30 / Classic 45-60 / Signature 90+), surface "Most booked" by WEIGHT (not a badge), 1-tap popular bundle.
3. **Staff hidden in the booking dropdown** , stylist choice is a trust decision. Surface stylist cards as a horizontal row on the PDP (face + name + speciality + REAL bookings count, never fabricated). Salon = venue; stylist = product.
4. **Reviews decorative** , "4.8 ★ (54)" + 3 quotes is a wireframe. Add a star-distribution bar (5/4/3/2/1), the 3 most-mentioned phrases ("on time", "great cut"), the most recent review + date. Cheapest premium signal in the app.

### Booking flow
1. **Date/time picker has no DENSITY signal** (biggest miss) , a thin ink hairline bar under each date showing how full it is (3 slots left = short, 18 = full). Tells "this salon is busy Saturdays" with zero copy + zero colour. The locked DateTimePicker should ship with this.
2. **No running summary** , sticky bottom bar from step 1: "1 service · 45 min · CHF 65", mono numerals, updates live, disappears only at confirmation.
3. **Progress unclear/decorative** , named steps (Date · Time · Details · Confirm), current ink-bold, completed with a small check, future muted. Back always returns without losing state.
4. **Login demanded too early** , move sign-in/contact to the LAST step, AFTER the slot is locked. Commit emotionally first, then enter data. Lifts completion.

### Confirmation
1. **Looks like a receipt, not a moment** , use SuccessMark big (80-96px), animated + haptic; headline "Du bist gebucht" ~25-30% viewport, Inter Tight 700, 36px+. Apple Pay success is the bar.
2. **Doesn't answer when · where · who · what in one glance** , one card, four lines, mono date+time, stylist name+photo, address with a small tap-to-open map preview.
3. **No graceful change path** , reschedule + cancel as text links (legit small-blue) one tap below the card.
4. **"Add to calendar" missing/buried** , one-tap iOS/Google. Highest-leverage utility; skipping it is amateur.

---

## The honest risk (council, no yes-man)

The restraint model is correct but has a **higher running cost** than generous-blue: premium photography on EVERY salon,
motion polish at EVERY peak, type discipline on EVERY new screen, AND marketing/illustration/promo/onboarding must hold
restraint too. **The moment one decorative-colour element slips back (a festive orange promo ribbon, a rainbow empty-state
illustration, a brand-coloured push icon, a launch GIF), the system shatters and looks worse than a less-restrained one.**
If the team won't police restraint across marketing + illustration + promo forever, the model is fragile and half-holding
it is worse than either pole. Named explicitly so it's a conscious choice, not a drift.

**Mitigation that makes it cheap-enough:** if the first two scroll-screens a user sees are dominated by strong photography
+ at least one purposeful micro-interaction, the cool grey reads as intentional minimalism, not dead space. Photography +
motion are first-class citizens, not decoration; everything else supports them.
