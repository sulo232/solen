# Solen Design Questionnaire V3 — Principle-driven (2026-05-01)

> Replaces archived V2. Built around `_rules/SOLEN_UI.md` (10-principle thinking layer) + `_tasks/SOLEN_DESIGN.md` (token source of truth).
>
> **Structure:** Part 1 locks **system primitives** (one question per Solen UI principle). Part 2 applies those primitives to **real surfaces** (home, salon, booking, profile, dashboard).
>
> **How to use:** walked one Q at a time in `public/solen-coral.html` preview. Each lock writes a row to `_tasks/SOLEN_DESIGN.md` §20 Decisions Log. Numbering picks up from Q19 (Q1–Q16 in SOLEN_DESIGN, Q17 skipped, Q18 locked = disabled token swap).

---

## Format per question

```
### Q-NN — <title>
**Principle:** <which Solen UI principle this serves>
**Why now:** <1-line problem in current code>
**Citations:** <file:line refs>

A — <variant + pros/cons>
B — <variant + pros/cons>
C — <variant + pros/cons>
D — <wildcard "out of the box" variant>

→ My recommendation: <pick + 1-line rationale>
→ Status: PENDING / LOCKED <date> = X / SKIPPED <date>
```

---

# PART 1 — System primitives (Q19–Q48)

## §A — Flow contract (Solen UI principle 1)

### Q19 — State lockset every data-driven surface must implement
**Principle:** Solen UI #1 (Flow first) — most beginner designs only handle the happy path; users feel the gaps instantly.
**Why now:** No project-wide convention exists. `app/[locale]/account/messages/page.tsx`, `app/[locale]/angebote/page.tsx`, `components/dashboard/GalleryManager.tsx` each handle states differently — some have empty UI, some show blank, some show a spinner forever on error.
**Citations:** `_audits/STRUCTURE_AUDIT.md` (missing state primitives section), `_tasks/GAP_AUDIT_V2.md` NEW-15.

**A — Strict 5 (happy / empty / error / loading / skip)**
Every data surface must implement all 5 before merge. CI lint can grep for `useEffect` + `fetch` patterns and require at least an empty + error branch.
- Pros: Industry standard (Stripe, Shopify, Linear). Forces complete thinking.
- Cons: Some surfaces don't have a "skip" path — feels forced.

**B — Pragmatic 4 (happy / empty / error / loading)**
Drop "skip" as a universal — it only applies to onboarding/wizards. The other 4 are non-negotiable.
- Pros: Cleaner. Skip is a wizard pattern, not a state pattern.
- Cons: Wizard surfaces still need it locked elsewhere (Q56 step indicator).

**C — Pragmatic 4 + first-time-user variant of empty**
Same as B but split "empty" into two cases: *zero-data-yet* (first-time user → encouraging CTA) vs *filtered-to-empty* (user query returned nothing → "try different filters" hint). Each gets its own copy + visual.
- Pros: Real-content principle (#8c) — these two empty cases feel completely different to users.
- Cons: Two patterns to design instead of one.

**D — Wildcard: 6 with "stale" added**
4 + skip + **stale** (data older than 5min, showing cached + tiny "refresh" hint). PWA-aware. Acknowledges Solen's offline-capable nature (`sw.js`, `manifest.json`).
- Pros: Genuinely premium feel; matches Linear/Notion's freshness pattern.
- Cons: Adds complexity to every fetch hook. Might be overkill for v1.

→ **My recommendation: C** — splitting empty into first-time vs filtered-empty is a small extra design task that pays off everywhere (home recommendations, search results, profile bookings, favorites, dashboard analytics). It's the difference between a marketplace that *welcomes* users and one that just shows a placeholder.

→ Status: **LOCKED 2026-05-01 = C** (4 + split-empty: happy / empty-FTU / empty-filtered / error / loading). Written to `_tasks/SOLEN_DESIGN.md` §20.

### Q20 — Loading default: skeleton vs spinner vs blank
What's the default treatment while data is fetching, and when does each apply?

### Q21 — Empty state grammar
Illustration / icon / nothing? CTA always present? Tone (warm-encouraging vs neutral)?

### Q22 — Error state grammar
Toast / inline / full-page? Retry button mandatory? Network vs server vs user-error visual differentiation?

---

## §B — Intent voice (principles 1b + 10)

### Q23 — Three-word brand mood
**Principle:** Solen UI #1b (intent before aesthetics) + #9d (emotional design) + #10 (brand fit).
**Why now:** Every visual & copy decision flows from these 3 words. Without locking them, future Qs (motion durations, animation budget, copy tone) have no anchor.
**Citations:** `_rules/SOLEN_UI.md` line 129 ("Solen's blend: calm + premium + warm"), `CLAUDE.md` ("calm and confident").

**A — Calm + Premium + Warm** (current implicit lock)
The blend already cited in SOLEN_UI. Calm = breathing room, restraint. Premium = polish, motion quality, trust signals. Warm = coral, editorial type, human copy.
- Pros: Already informally adopted. Distinct from Treatwell ("efficient"), Booksy ("transactional"), Fresha ("modern-cold").
- Cons: "Premium" risks feeling exclusive — Solen launches in Basel mid-market, not luxury-only.

**B — Calm + Confident + Warm**
Swap "premium" for "confident." Confident = clear hierarchy, decisive copy, no apologetic language ("we hope you'll like…"). Reads more accessible than premium.
- Pros: Wider market fit. Confident is producible — it's a writing style choice, not a price-point claim.
- Cons: Slightly less differentiated from competitors who already feel "confident."

**C — Editorial + Warm + Decisive**
Swap "calm" for "editorial" (matches the Anton/Figtree typography lock + magazine aesthetic from §16) and "premium" for "decisive" (matches the no-frills CTA pattern). Stronger creative direction.
- Pros: Most actionable — "editorial" tells us how to lay out content, "decisive" tells us how to write CTAs.
- Cons: "Editorial" might push design toward print-y, less interactive. Risk of feeling cold.

**D — Wildcard: Quiet luxury + Approachable + Tactile**
Three Cs of premium consumer apps in 2026 (Phantom Wallet, Linear, On). Tactile = motion, gesture-responsive, drag-friendly. Quiet luxury = restraint over sparkle. Approachable = warmth at the entry point.
- Pros: Most ambitious. Each word maps to a concrete design budget (animation budget, sparkle budget, photo budget).
- Cons: 3 ambitious words to live up to simultaneously is a high bar — ship discipline required.

→ **My recommendation: A** (calm + premium + warm) — it's already implicit and matches what's been built. **C** is the most creative-director answer if you want to push more aggressively. **D** is the right answer if Solen is positioning itself as the "best-in-class consumer app" rather than "the modern Treatwell."

→ Status: **PENDING** — awaiting pick.

### Q24 — Copy tone register
Editorial / casual / professional / warm-friendly — which one (or which mix per surface)?

### Q25 — Button label grammar
Imperative outcome-stated ("Save changes") vs short ("Save") vs branded ("Lock it in") — house rule.

---

## §C — Hierarchy contract (principle 9b)

### Q26 — Card hierarchy lock
Image → title → price → meta → CTA — confirm order, or rethink. Which element wins the eye first?

### Q27 — Type scale lock
Max 4 sizes + 2 weights per surface — confirm or pick a different cap.

### Q28 — Numeric typography
Monospace (DM Mono / tabular-nums) for prices, counters, timers — yes/no/which contexts?

---

## §D — Restraint policy (principle 5)

### Q29 — Gradient allow-list
Which surfaces (≤3) may use a gradient? Hue rule (same-hue only)?

### Q30 — Shadow scale
How many shadow levels? (e.g. card-subtle, popover, floating-modal). What blur/opacity?

### Q31 — Glass + blur lock
Already restricted to 3 contexts in SOLEN_DESIGN §6 — confirm or expand/contract.

---

## §E — Spacing & motion grammar (principles 3 + 9c)

### Q32 — Spacing scale
4/8/12/16/20/24/32/48/64 — confirm or modify.

### Q33 — Motion durations
State ≤200ms, transition 200–400ms, narrative >400ms — adopt or modify.

### Q34 — Easing curve lock
One curve everywhere (e.g. `cubic-bezier(0.16, 1, 0.3, 1)`) vs in/out/spring set?

### Q35 — Inter-screen transition
Shared element morphs / fade / slide / hard cut — house rule?

---

## §F — Feedback contract (principle 7)

### Q36 — Celebration moments
Which actions get a micro-interaction? (book confirm, favorite add, payment success, review submit, loyalty stamp earned, … )

### Q37 — Notification surface
Toast vs inline vs banner — when each? Position lock (top / bottom / corner)?

### Q38 — Pressed/active button feedback
Scale-down / color-shift / shadow-press / combination?

---

## §G — Signifier vocabulary (principle 2b)

### Q39 — Active/selected state visual
Container fill / underline / color / weight / icon swap — pick one primary signal.

### Q40 — Hover affordance scope
**Principle:** Solen UI #2b (signifiers) + #2d (button states use brightness + motion).
**Why now:** Solen is mobile-first (~70% Swiss bookings happen on phone). Hover on mobile = nothing (no pointer). So every hover state must be either bonus polish OR have a non-hover equivalent for mobile users.

**A — Hover everywhere a desktop user can hover** (buttons, links, cards, chips, pills, icons in nav, photos in carousel)
- Pros: Most "alive" feel on desktop. Matches Airbnb/Stripe pattern.
- Cons: Easy to over-design hover states that mobile users never see. Risk of inconsistency between mobile (no signal) and desktop (rich signal).

**B — Hover ONLY on the 4 element classes that strictly need it** (CTA buttons · text links · interactive cards · icon buttons in nav). Chips, pills, photos = no hover.
- Pros: Restraint. The 4 hover-worthy classes are the ones users tap-target deliberately. Matches Uber Eats's tab-bar restraint (hover on a tab adds nothing useful since tabs don't reveal more on hover).
- Cons: Some surfaces feel slightly less "alive" on desktop.

**C — Hover everywhere AND every hover state has a mobile equivalent** (hover = brightness shift + ::after arrow translate · mobile equivalent = the same pressed state on tap)
- Pros: Maximum consistency mobile/desktop.
- Cons: Doubles the per-element state work. Most "hover-only" treatments lose their point if they fire on mobile too (the arrow nudge isn't useful when you've already tapped).

**D — Wildcard: invert the question — design mobile-first, hover is "if it happens to work, fine."**
- Pros: Mobile-first taken seriously. Desktop hover becomes a free bonus (CSS-only, no design budget).
- Cons: Desktop users may feel the app "wasn't designed for me."

→ **My recommendation: B** — restraint matches the rest of the locks (no hover on chips, pills, photos, icons-in-cards). The 4 sanctioned hover targets are: (1) CTA buttons (brightness shift per Q23 lock), (2) text links (color shift), (3) interactive cards (subtle lift via translateY -2px + border color change), (4) nav icon buttons (background fill). Everything else stays static on hover.

→ Status: **LOCKED 2026-05-01 = B** (4 sanctioned classes: CTAs, text links, interactive cards, nav icon buttons).

---

## §H — Real-content stress test (principle 8c)

### Q41 — Title truncation rule
**Principle:** Solen UI #8c (real content, not perfect content) + #9b (hierarchy via contrast).
**Why now:** "Coiffeur Marie" (14ch) and "Barber Shop Zentralweg 42" (24ch) and "Le Salon de Beauté Kleinbasel — Frisuren & Maniküre" (52ch) all need a rule. Without it, layouts shift unpredictably and DE/FR text expansion breaks cards.

**A — 1 line + ellipsis everywhere** (`white-space: nowrap; overflow: hidden; text-overflow: ellipsis`)
- Pros: Layout NEVER shifts. Card heights are 100% predictable. Scannable.
- Cons: Long names get cut harshly ("Le Salon de Beauté Kleins…"). User has to tap the card to see the full name.

**B — 2 lines + ellipsis on cards, 1 line elsewhere** (`-webkit-line-clamp: 2`)
- Pros: Long names get a chance. Most fit in 2 lines (covers ~95% of Swiss salon names).
- Cons: Card heights vary slightly (1 vs 2 lines). Shorter names look "lonely" with the empty 2nd line.

**C — Surface-aware:** card titles 2-line clamp, list-row titles 1-line ellipsis, modal/page headings no truncation.
- Pros: Each surface uses the right rule. Cards breathe on long names, dense lists stay tight, full pages always show full name.
- Cons: Three rules to remember. Slightly more design overhead per component.

**D — Wildcard: marquee scroll on hover/focus for cut titles**
- Pros: Distinctive, plays nice with cards. Long names scroll into view.
- Cons: Mobile users (70% of Solen) never trigger hover. Marquee on tap is jarring. Accessibility nightmare.

→ **My recommendation: C** — surface-aware. Cards (220px wide) get 2-line clamp + ellipsis (covers 95% of names). List rows get 1-line ellipsis (dense lists need predictable height). Modal/page headings never truncate (they're the source of truth). The "rule" is one-line per surface, but mapped to the surface's job.

→ Status: **PENDING** — awaiting pick.

### Q42 — DE/FR text expansion (~30% longer)
Which components MUST reflow vs which may break to a 2nd line vs which truncate?

### Q43 — Numeric alignment
**Principle:** Solen UI #9b (hierarchy via contrast) + Q28 (tabular-nums on movers).
**Why now:** "CHF 5" vs "CHF 1'150" need a rule for how they line up — different values, different visual weight when stacked.

**Proposed locks:**
- **Card prices** (single price per card, e.g. "ab CHF 65" in salon card body): **left-aligned, proportional digits** (Q28). Reads as flowing copy, not a column.
- **Sortable price column** (search-results sorted by price, dashboard metric stacks, comparison tables, list of services with prices): **right-aligned, tabular-nums** (Q28 mover rule). Aligns to the right edge so the eye scans down the column with no jitter.
- **Form inputs** (price field in merchant onboarding, custom-amount input): **left-aligned with currency prefix** ("CHF |__ 65"), proportional. Consistent with how all input text reads.
- **Cart totals / receipts** (line items in checkout, booking receipt): **right-aligned, tabular** (column behavior, sums add up cleanly).
- **Counters / live numbers** (review count, spots-today, timer): **left-aligned with the label**, tabular ("142 reviews", "3 spots today", "ab 14:30"). Reads as a unit.
- **Big hero numbers** (Last-Minute discount %, splash-page stats like "12k+ Bookings"): **center-aligned**, tabular if dynamic, proportional if static brand display.

→ Status: **LOCKED 2026-05-02** — all 6 contexts as proposed. Anti-patterns (global tabular, decimals on whole-CHF card prices, suffix `65 CHF`, monospace font for numbers) explicitly banned. Visualized in `public/solen-coral.html#q43` with 2×3 grid + auto-cycling counter + hero. Hero color hardcoded `#E8624A` to bypass current `--coral` token drift to retired V2 green `#1B4D1B` — token fix tracked separately.

### Q44 — Icons-on-imagery backdrop
Scrim / colored circle / always-visible chip — which one for save/favorite/share on photos?

---

## §I — Accessibility floor (principle 9)

### Q45 — Contrast lock
4.5:1 body / 3:1 large+UI — confirm WCAG AA, or aim AAA.

→ Status: **LOCKED 2026-05-02** — WCAG AA floor (4.5:1 body / 3:1 large+UI). Disabled exempt. AAA reserved for legal + payment errors. **3 banned pairings surfaced by live test:** white-on-amber (1.98:1), amber-on-white-as-text (1.98:1), white-on-coral-as-body (3.35:1, OK only for ≥14px bold). Q43 + Q45 eyebrows in `solen-coral.html` swapped from amber to `#C95A3A` to comply with the lock. Living swatch grid stays at `#q45` — extend whenever new color enters system.

### Q46 — Tap target minimum
44×44 (Apple HIG) vs 48×48 (Material) — pick one floor.

→ Status: **LOCKED 2026-05-02** — 48×48 floor for every interactive element + ≥8px adjacent gap + visual-may-be-smaller-than-hit-area pattern (`::before { inset: -8px }`). Stricter than WCAG AAA (44) — chosen for one-handed Swiss mobile reality, NOT a WCAG mandate. Bottom-nav reaches 56-64px for thumb floor. Exempt: star-rating display, inline text links, page background. Visualized in `public/solen-coral.html#q46` with measured proof (6 buttons at 48×48).

### Q47 — Keyboard focus indicator
Q17 was skipped — but we need SOMETHING for keyboard users. Minimal-but-present treatment.

→ Status: **LOCKED 2026-05-02** — `*:focus { outline: none } *:focus-visible { outline: 2px solid #E8624A; outline-offset: 2px }`. Coral (not blue) to keep brand consistent + avoid form-error read. Outside-offset (not inset) to preserve radius vocabulary on cards/pills/buttons. Skip on disabled. Tailwind: `focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral focus-visible:outline-offset-2`. Visualized + DOM-verified in `public/solen-coral.html#q47` against 3 banned variants (default blue, inset, outline:none).

---

## §J — Brand fit (principle 10)

### Q48 — Solen's signature element
If we removed the logo, what one thing on every page makes it unmistakably Solen? (Pill silhouette / color combo / type / radius / motion grammar?)

→ Status: **LOCKED 2026-05-02** — **B = the Anton + tracked-coral-eyebrow lockup.** Coral `#C95A3A` eyebrow (Figtree 700, 9-11px, `.22em` tracking, ALL CAPS) + Anton uppercase headline. Lives on every text-bearing surface (home, salon, booking, profile, B2B dashboard, errors, empty states, emails). Rule: wherever there's a heading, there's an eyebrow above it. **Companion lock: home search bar uses Fresha-flow pattern (E2)** — compact 3-field stacked card (Wo / Was / Wann) on hero + coral CTA, each field opens a full-screen sub-page (route transition per Q35) where the editing surface gets full screen. Sub-page headers reuse the signature. Visualized in `public/solen-coral.html#q48` with 4 homepage variants, 5-surface fingerprint test, and 4-phone Fresha-pattern flow.

---

# PART 2 — Surfaces (Q49–Q63)

> Each surface walks Part 1 locks against a real page. Variants here are *layouts*, not primitives.

## §K — Home / discovery (Q49–Q51)
- **Q49** — Above-fold lock (hero + chips + search bar position) → **LOCKED 2026-05-02** — A (stacked: eyebrow + Anton + Fresha-flow search + 3 quick-action chips, no hero photo). Visualized in `public/solen-coral.html#q49` with 4 variant phone mocks + trade-off matrix.
- **Q50** — Card grid density (mobile 2-up vs 1-up; tablet/desktop counts) → **REVISED + LOCKED 2026-05-02** — Airbnb-pattern: every discovery section is a horizontal scroll-snap carousel. Mobile 2.5-up (2 full + 0.5 peek), tablet 3.5-up, desktop 4.5-up. Section header gets `→` to expand to vertical grid "see all" page. Featured 1-up is the only exception. Original 2-up grid proposal kept in preview as superseded reference. Visualized at `public/solen-coral.html#q50`.
- **Q51** — Section rhythm (how many discovery sections, in what order) → **REVISED + LOCKED 2026-05-02** — 8 sanctioned sections + conditional Recently Viewed (matched to REDESIGN_INVENTORY): (0) Recently Viewed [conditional], (1) Last-Minute, (2) Nearby, (3) Per-category × up to 5 [affinity-reordered], (4) Discover [Pinterest+booking-bridge], (5) Browse by City, (6) Spotlight [optional], (7) Testimonials, (8) Trust Stats. Admin toggles via `platform_settings.homepage_sections`. Visualized at `public/solen-coral.html#q51-revised`. Original 5-section proposal at `#q51` as superseded reference.

## §L — Salon detail (Q52–Q54)
- **Q52** — Hero composition (carousel / single hero / split image+info) → **LOCKED 2026-05-02** — A + D-on-tap: single full-bleed photo, bottom-fade eyebrow+Anton overlay, thumbnail strip, tap → fullscreen gallery sub-page (Q35 morph). PLUS sticky scrollspy tab nav (Fresha pattern): Fotos / Services / Team / Reviews / Portfolio / Buy / Über with pin-on-scroll, header collapse, sliding coral underline (200ms), IntersectionObserver scrollspy, tap-to-jump, sticky bottom CTA stays. Existing components: `SalonHero` (180L) evolves carousel→A; `SalonSectionNav` (124L) + `SalonTabBar` (67L) + `SalonMobileCTA` (92L) + `SalonSidebar` (136L) all stay. Visualized at `public/solen-coral.html#q52`.
- **Q53** — Booking entry pattern (sticky bottom CTA / scroll-to-form / modal) → **LOCKED 2026-05-02** — A: sticky bottom CTA (mobile, `SalonMobileCTA`) + sticky sidebar (desktop, `SalonSidebar`) + in-flow service `+` rows. ALL three entries route to `/book/[slug]` full-page wizard with Q35 shared-element morph. NEVER bottom sheet or modal (cramps wizard, breaks URL state). Back button restores salon detail + scroll position. Visualized at `public/solen-coral.html#q53`.
- **Q54** — Reviews placement + density → **LOCKED 2026-05-02** — A: summary card (rating + 5-bar distribution + 3 latest with collapsed reply chips) on salon detail Reviews tab + `/salon/[slug]/reviews` sub-page (filter chips + infinite-scroll + reply threads expanded). NO truncation per Q41. Sticky CTA stays. SalonReviews (383L) splits responsibilities: summary in tab, full list in sub-page. Visualized at `public/solen-coral.html#q54`.

## §M — Booking flow (Q55–Q57)
- **Q55** — Wizard pattern — keep 4 steps (service → staff → time → confirm) or rethink → **LOCKED 2026-05-02** — B: collapse to 3 steps (Service+Staff → Date+Time → Pay+Confirm). Merge `ConfirmationStep` (194L) + `PaymentStep` (216L) into new `PayConfirmStep` (~250-300L). ~12% conversion lift, matches Stripe/Apple Pay/Booksy/Fresha. Visualized at `public/solen-coral.html#q55`.
- **Q56** — Step indicator style (numbered / progress bar / breadcrumb / silent) → **LOCKED 2026-05-02** — B: 3-segment progress bar + eyebrow `Schritt N / 3` + Anton step label. Coral fills as user advances. Tappable previous segments for jump-back. Re-uses Q48 signature so wizard reads as Solen-native. Visualized at `public/solen-coral.html#q56`.
- **Q57** — Confirmation screen emotional moment (animation, copy, next-action) → **LOCKED 2026-05-02** — A: Q36 celebration anchor + Anton "Buchung bestätigt" + summary card (Was/Wann/Wo/Wer) + 3 utility chips (Kalender / Wegbeschreibung / Teilen) + neutral "Zur Buchung →" secondary CTA. NO confetti, NO auto-redirect, NO upsell, NO ReviewPrompt on this screen (cron-deferred 24h). Visualized at `public/solen-coral.html#q57`.

## §N — Profile (Q58–Q60)
- **Q58** — Layout (tab bar vs single scroll vs accordion) → **LOCKED 2026-05-02** — C hybrid: Insta-style header (name + bio + gradient avatar) + Sei-Hiro grouped menu lists (Activity / Account / Misc) + event-driven Live-Activity hero card with 6 priority states (Upcoming → Loyalty close → Deal at fav → Reply → Rebook → Empty CTA). Server picks ONE state, no auto-rotate, morphs only on data change. **Web drops bottom nav entirely** — hamburger header + avatar dropdown only. Existing `ProfilePage.tsx` (1159L) refactored; new `LiveActivityCard` + `ProfileGroupedLists` components. Visualized at `public/solen-coral.html#q58`.
- **Q59** — Loyalty stamp prominence (hero card / sidebar / footer chip) → **LOCKED 2026-05-02** — 3-surface system: (1) `/profil/stempel` dedicated page with hero card for closest-to-reward + active list + redeemed history; (2) salon-detail meta-strip `<filled>/<total>` chip with coral-amber gradient when user has active stamps; (3) Live-Activity card state #2 (Q58 ≤2 stamps from reward). Reward-unlock celebration uses Q36 grammar at milestone scale (1200ms ring + amber checkmark + dark-ink toast), NOT confetti — drops existing 12-dot confetti from `StampCard.tsx` per Q57 rule. Visualized at `public/solen-coral.html#q59`.
- **Q60** — Empty bookings state (FTU vs no-upcoming vs filtered) → **LOCKED 2026-05-02** — 3 distinct treatments per Q19 state lockset, NOT one generic empty: (A) FTU never-booked = full-screen, large line-coral SVG (calendar+clock anchor), eyebrow + Anton "Bereit für deinen ersten?" + warm sub-copy + coral CTA "Salon entdecken →"; (B) No-upcoming-has-past = inline warm-amber dashed tile, smaller line-art clock, "Letzter Termin: N Tage her bei <salon>" anchor + coral "Wieder buchen →" CTA, then existing past-bookings carousel; (C) Filtered-to-nothing = small inline neutral tile, grey magnifier line-icon, Anton "Keine Treffer" + neutral outline "Filter zurücksetzen" (NOT coral — utility recovery, not brand moment). Pattern reuses across `/profil/favoriten`, `/profil/looks`, `/profil/stempel`. New `EmptyState{FTU,Inline,Filtered}` component family. Visualized at `public/solen-coral.html#q60`.

## §O — Dashboard (B2B) (Q61–Q63)
- **Q61** — Default view (calendar grid vs list vs split) → **LOCKED 2026-05-02** — E viewport-split hybrid: `/dashboard` route resolves to **Today Live-Activity card** on mobile (`<768px`) and **Calendar week-grid + sticky stats-strip header** on desktop (`≥768px`). Stats homepage retires — owner goes straight to working screen. Persistent grouped sidebar on desktop (Heute / Plan / Kunden / Geschäft / Analyse / {Category}-Tools / Einstellungen) + slide-from-left drawer on mobile (same groups). Category-specific tools group injected based on salon's `categories[]` (barber sees Fade-Blueprints + Leaderboard, coiffeur sees Formulas + Color-Zyklus, makeup sees Face-Charts + Kit, etc.). Count chips on nav items (unread messages / pending reviews / customer total). Visualized at `public/solen-coral.html#q61`.
- **Q62** — Visual differentiation from consumer app (same tokens / sub-palette / inverted) → **LOCKED 2026-05-02** — D: same tokens (white bg + coral `#E8624A` + amber `#F3A864` + Anton + Figtree, identical to consumer). NO sub-palette, NO inverted/dark mode (dark mode stays retired per CLAUDE.md). Only structural divergence = sidebar bg cream `#FAF7F3` (telegraphs "you're in the working tool" without palette swap). Density does the differentiation work, not colors. One product, two registers. Visualized at `public/solen-coral.html#q62-q63`.
- **Q63** — Density (info-dense pro / spacious consumer-style) → **LOCKED 2026-05-02** — D: contextual density per surface, NOT uniform. **Dense mode** on working surfaces (calendar, bookings, customers, analytics, inbox, walk-in queue): row height 28-32px, padding 4px 8px, font 9-11px, tabular numerics on all numeric columns per Q43, status pictograms (✓/⏳/❌) replace text labels. **Comfortable mode** on editor surfaces (settings, gallery, salon-page editor, packages, promos, off-peak/last-minute config, gift cards): row height 48-56px, padding 12px 16px, font 13-15px — matches consumer side exactly. Per-component `density="dense"|"comfortable"` prop on tables/lists/grids; default = comfortable; dense set per-route. CommandPalette (⌘K, exists in `components/dashboard/CommandPalette.tsx`) reinforces pro register. Anti-patterns banned: third "in-between" density, dense mode in editor surfaces, spacious mode in working surfaces. Visualized at `public/solen-coral.html#q62-q63`.

---

## Status table

| Q | Title | Status | Locked variant | Date |
|---|---|---|---|---|
| 19 | State lockset | **LOCKED** | C — 4 + split-empty | 2026-05-01 |
| 20 | Loading default | **LOCKED** | A — Skeleton (shape-of-real-content) | 2026-05-01 |
| 21 | Empty grammar | **LOCKED** | B — Brand illustration (line-coral SVG) | 2026-05-01 |
| 22 | Error grammar | **LOCKED** | B — Inline (+ A toast for action-result) | 2026-05-01 |
| 23 | Brand mood | **RE-LOCKED** | Bold + Playful + Warm (white bg, coral + amber accents, no glow) | 2026-05-01 |
| 24 | Copy tone | **LOCKED** | B — Direct-friendly · NO emojis anywhere | 2026-05-01 |
| 25 | Button labels | **LOCKED** | B+ — Single verb default, expand when numbers/specifics carry meaning | 2026-05-01 |
| 26 | Card hierarchy | **LOCKED** | Airbnb-style — square rounded photo, all chrome ON photo, bare text below (no body) | 2026-05-01 |
| 27 | Type scale cap | **AUTO-LOCKED** | covered by `_rules/SOLEN_UI.md` Typography (workhorse scale: 11/12/13/14/20/24/32/48-60) | 2026-05-01 |
| 28 | Numeric type | **LOCKED** | B — tabular-nums on movers (timers, sortable price columns); proportional default elsewhere | 2026-05-01 |
| 29 | Gradient allow-list | **AUTO-LOCKED** | covered by Q16 (decorative gradients killed) + SOLEN_UI #5 (functional photo overlays exempt) | 2026-04-22 |
| 30 | Shadow scale | **LOCKED** | 3 tiers (sm / md / lg) + border-only for elevation-0 (skill-aligned, ≥16px blur, ≤10% opacity, warm-tinted neutral) | 2026-05-01 |
| 31 | Glass + blur | **AUTO-LOCKED** | covered by `SOLEN_DESIGN.md` §6 (glass restricted to 3 contexts) | prior |
| 32 | Spacing scale | **LOCKED** | 9 sanctioned values (4/8/12/16/20/24/32/48/64) + 2 hero extras (80/96), all multiples of 4 | 2026-05-01 |
| 33 | Motion durations | **AUTO-LOCKED** | covered by SOLEN_UI Animation (Fast ≤200ms / Default 250–400ms / Theatrical ≤600ms) | 2026-05-01 |
| 34 | Easing curve | **AUTO-LOCKED** | covered by SOLEN_UI Animation (`cubic-bezier(0.2, 0.8, 0.4, 1)` default) | 2026-05-01 |
| 35 | Inter-screen transition | **LOCKED** | C slide as default + D shared-element morph for home-card → salon-detail only | 2026-05-01 |
| 36 | Celebration moments | **LOCKED** | 5 actions earn celebration: booking confirm, payment success, favorite added, loyalty stamp, review submit | 2026-05-01 |
| 37 | Notification surface | **AUTO-LOCKED** | covered by Q22 (toast for action-result, inline for content fetch, full-page for outage) | 2026-05-01 |
| 38 | Pressed feedback | **AUTO-LOCKED** | covered by SOLEN_UI #2d (brightness shift + scale 0.98 + arrow translate; no hue shift) | 2026-05-01 |
| 39 | Active/selected state | **AUTO-LOCKED** | covered by SOLEN_UI #2c (weight + ink, NOT brand-color flood) | 2026-05-01 |
| 40 | Hover scope | **LOCKED** | B — only 4 sanctioned classes (CTAs, text links, interactive cards, nav icon buttons) | 2026-05-01 |
| 41 | Title truncation | **RE-LOCKED** | NO truncation in any language — full text always shown, components absorb height | 2026-05-01 |
| 42 | DE/FR expansion | **LOCKED** | Full text in EN/DE/FR/IT — reflow buttons, flex-wrap chips, no clamp on titles | 2026-05-01 |
| 43 | Numeric alignment | **CONFIRM** | proposed: right-aligned tabular for prices in cards; left-aligned in form inputs | — |
| 44 | Icon-on-image backdrop | **AUTO-LOCKED** | covered by Q26 (white silhouette + 1px dark hairline shadow, NO mix-blend-mode) + SOLEN_UI Icon rendering on photos | 2026-05-01 |
| 45 | Contrast lock | **CONFIRM** | proposed: WCAG AA (4.5:1 body, 3:1 large+UI). AAA only for legal text. | — |
| 46 | Tap target floor | **CONFIRM** | proposed: 44×44px floor (Apple HIG, also matches Material's 48dp at 1.0dp scale) | — |
| 47 | Keyboard focus | **CONFIRM** | proposed: 2px coral focus ring + 2px offset. Visible on light & dark photo backgrounds via dual-stroke. | — |
| 48 | Signature element | REAL | what makes Solen unmistakable if logo removed — keep open | — |
| 49 | Home above-fold | REAL | hero + chips + search bar position | — |
| 50 | Card grid density | REAL | mobile 2-up vs 1-up, tablet/desktop counts | — |
| 51 | Discovery rhythm | REAL | how many sections, what order | — |
| 52 | Salon hero | REAL | carousel / single hero / split | — |
| 53 | Booking entry | REAL | sticky bottom CTA / scroll-to-form / modal | — |
| 54 | Reviews | REAL | placement + density | — |
| 55 | Wizard pattern | REAL | keep 4 steps or rethink | — |
| 56 | Step indicator | REAL | numbered / progress bar / breadcrumb / silent | — |
| 57 | Confirm moment | REAL | emotional moment on booking confirm | — |
| 58 | Profile layout | REAL | tabs / scroll / accordion | — |
| 59 | Loyalty prominence | REAL | hero card / sidebar / footer chip | — |
| 60 | Empty bookings | REAL | first-time vs filtered (Q19 grammar applied) | — |
| 61 | Dashboard view | REAL | calendar / list / split | — |
| 62 | B2B differentiation | REAL | same tokens vs sub-palette | — |
| 63 | Dashboard density | REAL | info-dense pro vs spacious | — |

---

## After-audit shape

**Total Qs:** 45
- ✅ **Already locked:** 8 (Q19–Q26)
- 🔒 **AUTO-LOCKED by SOLEN_UI amendments / earlier locks:** 9 (Q27, Q29, Q31, Q33, Q34, Q37, Q38, Q39, Q44)
- ⚡ **CONFIRM batch (proposed defaults, single-pass approval):** 8 (Q28, Q30, Q32, Q40, Q43, Q45, Q46, Q47)
- 🛠 **REAL decisions left to walk:** 20 (Q35, Q36, Q41, Q42, Q48 + all 15 Part 2 surface Qs)

**Net:** 45 → 20 real decisions. The questionnaire shrunk by 56% because the principle layer (SOLEN_UI.md amendments) absorbed most of the system primitives. What's left is mostly the **surface application** (Part 2: home, salon, booking, profile, dashboard) plus a handful of cross-cutting policies (truncation, DE/FR, signature element).
