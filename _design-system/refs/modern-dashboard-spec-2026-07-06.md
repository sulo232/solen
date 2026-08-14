<!-- exists-check: net-new vs _design-system/refs/dashboard-reference-2026-07-06.md because that file is a 22-line text-only WebFetch summary of ElevenLabs/OpenAI (direction-only, no measured values); this file is a fully quantified spec (px radii, hexes, motion timing, per-element rules) derived from 5 owner screenshots + 8 video frames the owner explicitly pointed at, a different source with concrete numbers the prior file lacks. This file supersedes nothing in the prior file, both are additive inputs to the same eventual dashboard-modernization change. Not touching lib/share.ts, src/main.tsx, lib/motion.ts, _rules/SYSTEMS.md, lib/alert-admin.ts, _rules/SOLEN_UI.md, _plans/SOLEN_E2E.md, those are unrelated code/rule files the exists-guard also surfaced but none hold this reference-image research. -->

# Modern dashboard treatment spec (captured 2026-07-06)

Source: 5 owner screenshots (`/Users/sulo/solen/screenshots/IMG_6342.png`, `IMG_6343.png`, `IMG_6345.png`, `IMG_6346.png`, `IMG_6347.png`) + 8 sampled frames from 2 owner-linked X/Twitter design videos. Owner's ask: the current Solen operator dashboard "isn't modern," pointed at these refs for "more like this."

**Scope discipline (repeated because it is the single easiest way to misread this doc): this is a TREATMENT extraction, not a layout or content brief.** None of these refs get their structure copied. The Solen dashboard keeps its own structure: setup banner, stat tiles, revenue chart, activity feed, `+Termin` CTA. Only radius / shadow / palette-restraint / type-contrast / spacing / motion character move.

Related prior art: `_design-system/refs/dashboard-reference-2026-07-06.md` (ElevenLabs/OpenAI direction, captured via WebFetch same day) reached the same "clean, minimal, ink-primary, soft shadow" conclusion from a different source. This doc supersedes nothing there; it adds the SATURATED-ACCENT and MOTION-CHOREOGRAPHY data that the text-only WebFetch pass couldn't produce.

---

## What these refs actually are

| File | What it is | UI or not |
|---|---|---|
| IMG_6342.png | Video-call in-app command palette / context menu (floating popover over a blurred call frame), toolbar of round icon buttons | UI, but NOT a dashboard, it's an overlay/popover pattern |
| IMG_6343.png | Marketing/product screen for an AI-agent "share your agent" feature (profile card + toggle list) | UI, but marketing-page chrome, not a working dashboard |
| IMG_6345.png | Admin/ops dashboard (KYC, disputes, payouts, marketplace platform) | Real dashboard, closest structural analog but STILL not to be copied per the brief |
| IMG_6346.png | Logistics/fleet-ops dashboard (drivers, live map, shipments) | Real dashboard, same design-kit family as 6345 (matching tokens, different domain) |
| IMG_6347.png | Consumer finance/budgeting widget screen, embedded inside a dark social-media (X/Twitter) post frame | UI, but it's a screenshot-of-a-screenshot (a social post showing an app); the outer black chrome with engagement counts is NOT app UI, ignore it entirely |
| Video 1 frames (calendar webapp) | Calendar/task productivity app (Linear/Height-adjacent), shown as a tilted browser mockup that zooms in and populates | Real app UI, motion reference only |
| Video 2 frames (marketing screen) | "From idea to app-ready visuals in seconds" marketing/landing screen with a numbered step list and a looping illustration swap | Marketing page, NOT a dashboard, motion-choreography reference only (the step-highlight and content-crossfade pattern, not the illustration content) |

**Flag: only IMG_6345 and IMG_6346 are actual dashboards.** IMG_6342/6343/6347 and both videos are non-dashboard UI (popover, marketing page, finance widget-in-a-social-post, calendar app, marketing page). Their value here is aesthetic only: how radius/shadow/color-restraint/motion feel, not what to build. IMG_6345 + IMG_6346 are the ones that most directly validate "dashboard structure with this treatment is achievable."

---

## RADIUS

Consistently rounder than Solen's current customer-site 16px, and rounder than the dashboard's current `rounded-card-lg` (20px) in the SMALL-element tier, but not exotic:

| Element type | Observed px | Source |
|---|---|---|
| Dashboard/admin cards (stat cards, chart container, list cards) | 12-16px | IMG_6345, IMG_6346 |
| Larger feature/hero cards, outer containers | 20-28px | IMG_6343 (outer container), IMG_6347 (Insights card ~20-24px), IMG_6342 (popover ~24-28px) |
| Buttons, dropdowns, status pills/badges | fully rounded (pill, radius = half height) | IMG_6345, IMG_6346, IMG_6343 (toggle switches), IMG_6347 (floating tab bar) |
| Small chips (app icons, category tags) | 8-12px | IMG_6343 (platform icon chips ~8-10px), IMG_6347 (app icon squares ~10-12px) |
| Popover / floating overlay (elevated above the base layer) | 12-28px depending on size, always softer-cornered than its parent card | IMG_6342 (popover), IMG_6347 (floating tab bar) |
| Avatar / icon badge | circular | all refs |

**Read: two-tier radius, not one number.** Structural containers (cards, panels) sit at 12-16px; small pills/badges go full-round; a FEW hero/feature surfaces go bigger (20-28px) to read as "the one important thing on the screen." Nothing is sharp/square anywhere in any ref.

---

## SHADOW / ELEVATION

**Base layer is flat-to-whisper.** Cards in IMG_6345 and IMG_6346 (the two real dashboards) use **hairline borders, not drop shadow**, for resting cards, matching Solen's own current `border-s-border`-only pattern almost exactly (this is the one place the current dashboard is already aligned with the modern direction, not behind it).

**Elevation is reserved for things that float ABOVE the base layer:**
- IMG_6346's vehicle-detail popover on the live map: clearly lifted, soft diffuse shadow, visibly separated from the map beneath it.
- IMG_6342's command-palette popover: soft diffuse blur under it, low opacity (~15-20%), frosted/translucent surface, not solid white, floating over a blurred backdrop.
- IMG_6347's floating pill tab bar: soft diffuse elevation shadow, moderate opacity, clearly a distinct z-layer from the card content behind it.
- Video 1's tilted browser-window mockup frame itself: wide, very soft ambient shadow (~30-40px blur, ~8-10% opacity) — but that's the "mockup device" shadow, not an in-app card shadow, don't import that value for real cards.

**No hard edges anywhere. No decorative gradients on cards.** (Gradient use is confined to ONE place: the sparkline fill in IMG_6347, see Data-viz below.) This matches the existing LOCKFILE §3.5 "quiet lift, not the wide float" calibration almost exactly, these refs reinforce restraint, they do not license heavier shadow.

**Numeric translation using Solen's existing tokens** (do not invent new shadow values):
- Resting stat tile / chart panel / activity card: keep hairline `border-s-border`, OPTIONALLY add `elevation-1` (`0 1px 3px rgba(50,47,44,.04), 0 1px 2px rgba(50,47,44,.03)`) if the card sits on a `s-bg-sunken` tray, per existing §3.5 rule, don't add both a heavy shadow and a border.
- Anything that overlays the base grid (a popover, a tooltip, a hover-revealed detail card): `elevation-3` (`0 8px 28px rgba(50,47,44,.12), 0 4px 10px rgba(50,47,44,.06)`), consistent with what IMG_6342/6346/6347 show for their floating layers.

---

## PALETTE

**Base is restrained, matching Solen's existing 80/17 discipline almost exactly, this is confirmation, not a new direction:**
- Page background: cool light grey, `#F4F4F5`-`#F7F7F8` range (IMG_6345/6346), functionally identical to Solen's existing `s-bg-sunken` (#F4F4F5).
- Card surface: white.
- Hairlines: `#E5E5E7`-ish, functionally identical to Solen's existing `s-border` (#E4E4E7).
- Ink: headings `#18181B`-`#1A1A1A` (matches Solen's `#0A0A0A` family closely enough to require zero change), secondary text `#6B6B6B`-`#71717A` (matches `text-s-ink-2` territory).

**Where saturated color appears (this is the part actually new relative to Solen's dashboard today):**
- IMG_6345 (ops dashboard): a **different saturated hue per stat-card icon/dot** (purple/violet, green, blue, yellow-gold) purely as a category-identifier dot, small (~8-10px), never a full card fill. Bar chart uses two purple tones (solid `#7C3AED` + light lavender `#C4B5FD`). Geo-distribution bar uses a 5-color segmented strip. Activity feed uses a colored dot per EVENT TYPE (orange, teal, pink/magenta, blue, red), consistent small dot, not a colored card background.
- IMG_6346 (fleet dashboard): ONE dominant saturated accent, orange (`#F97316`), used for the primary "+Add new" button, active nav item, and the "on route" status. Everything else stays the same restrained grey/white/ink base. Status badges are pale-tinted pills with matching text (green "in transit," red/salmon "delayed," amber "idle," grey "upcoming"), the Solen `DashStatusPill` pattern already matches this.
- IMG_6343: blue toggle switches in their literal "on" state (functional, not decorative), a ring of color around one avatar (not a UI token, illustration/branding flourish, ignore).
- IMG_6347: burnt-orange hero dollar figure + green delta text next to it, red/coral sparkline with gradient fill, purple badge, brand-colored subscription app icons on tinted circles. This is the single most colorful ref, and it is a CONSUMER finance screen, not an operator dashboard, treat it as the upper bound of allowed saturation, not the target.

**Restraint verdict: low-to-moderate, never "colorful for its own sake."** Every saturated hue observed is carrying MEANING (a category, a status, a delta direction, a chart series), never a decorative card background or a rainbow of buttons. This is the exact same principle already locked in Solen's `_design-system/LOCKFILE.md` §1.5 and §13.1 ("color is earned, not default"), these refs are additional evidence for the existing rule, not a request to loosen it.

---

## TYPOGRAPHY

- **Character**: clean grotesk/geometric sans across every ref (Inter/SF Pro-like family), consistent with Solen's existing Inter Tight + Inter stack, zero font-family change indicated.
- **Weight contrast**: regular body text against medium/bold headlines and card titles; IMG_6343's marketing headline mixes bold-black words with grey-regular words in the SAME line for emphasis (a technique, not a token, worth noting for future marketing copy, not the dashboard itself).
- **Hero-number vs label size jump**: this is the most consistent, most importable signal across every dashboard ref. IMG_6345 and IMG_6346 both show **large bold numerals (~28-32px) directly above a small grey label (~12-13px)**, roughly a 2.3-2.5x size ratio, with a weight jump from ~700 down to ~400-500. Small delta/meta text sits even smaller (~11-12px). IMG_6347's consumer hero figure ("$1,450.00") uses a slightly smaller but still large numeral (~24-28px) over a ~12-13px label, same ratio family.
- **Solen's current stat tiles do not yet hit this ratio.** This is a concrete, checkable gap: measure the current `StatTile` numeral size against its label size in `app/[locale]/dashboard/page.tsx` and widen the gap toward ~2.3-2.5x if it's currently flatter.

---

## SPACING / DENSITY

- IMG_6345/6346 (the two real dashboards): **moderately dense, not loose**. Card padding ~16-20px, stat-row gutters tighter at ~12-16px (5 cards across need that discipline to fit), table row padding ~12-16px. This is denser than Solen's customer-site rhythm but appropriate for an operator screen scanning many numbers at once.
- IMG_6343/6347 (marketing/consumer widget refs): more generous, ~20-24px card padding, ~16-20px row gaps, because they're selling a feeling, not surfacing 20 KPIs.
- IMG_6342 (popover): generous row height (~24-28px) and horizontal padding (~24px) because it's a small, low-item-count menu.
- Video 1 (calendar app): notably DENSE once populated (small ~11-12px captions throughout, tight event-card stacking), the opposite of generous, because a calendar week view needs to fit many events.

**Read: density should match information load, not a single fixed "generous" value.** The dashboard's stat-tile row and activity feed (many small facts) can stay close to their current density; don't inflate padding just because IMG_6343/6347 look airier, those are lower-density content types for a reason.

---

## MOTION (from the frames)

**Video 1 (calendar webapp), the clearest before/after arc:**
1. fr_01: empty canvas, full mockup-frame view (chrome + sidebar visible).
2. fr_03: camera pushes in (zooms/crops chrome away) AT THE SAME TIME as content populates (a to-do checklist + 2 event cards fade/slide into an empty grid). Two things change together: framing AND content.
3. fr_05: more event cards appear across the grid (2 to ~8-9), reads as a **staggered sequential populate**, not a single simultaneous reveal, new interactive elements (a blue pill button, an orange filled tag) appear mid-sequence.
4. fr_07: camera pulls back OUT (reverse of the push-in), revealing the full chrome again, while the now-populated grid content persists at smaller scale. Bookend structure: empty-wide to zoom-in-and-populate to zoom-back-out-reveal.

Translation: **content should populate progressively (staggered card-by-card), not pop in all at once**, and camera/viewport moves (if any, e.g. a panel expanding) should be decoupled from content fade so each reads as a distinct, legible step.

**Video 2 (marketing screen), the choreography pattern (structure ignored, only the TIMING technique matters):**
1. fr_01: 4-step numbered list, all inactive/grey, illustration panel in one static state.
2. fr_03: step 2 activates, its leading accent bar solidifies to ink-black, title gets weight, OTHER STEPS STAY INACTIVE (only one active at a time).
3. fr_05: step-highlight ADVANCES (skips to step 4) in sync with the illustration content fully crossfading to a different scene, two changes fire together, tied to the same beat.
4. fr_08: the whole thing loops back to step 2's state, confirming this is a cyclical, timed step-through, not a one-shot reveal.

Translation: **a single active-item highlight pattern** (one bold/accented item among several dimmed peers) synced to a **content crossfade** elsewhere on screen, useful specifically for something like a setup-banner checklist where each step should light up as it becomes current, with a paired preview/illustration changing alongside it (if the setup banner ever gets a "what you'll see" preview panel).

**Feel/timing estimate (no exact ms visible in static frames, describing character only):** transitions read as smooth eased crossfades and slides, not sharp/instant cuts and not bouncy/springy overshoot. This matches Solen's own existing `glide` easing (`cubic-bezier(0.16, 1, 0.3, 1)`) far better than `spring` (`cubic-bezier(0.34, 1.56, 0.64, 1)`), use `glide` for populate/reveal motion on the dashboard, reserve `spring` (already locked for toggle/check moments) for confirmation micro-interactions only, not page-level reveals.

---

## DATA-VIZ

Three distinct chart species observed, useful because Solen's dashboard has both a line/bar revenue chart AND could plausibly add a sparkline:

| Ref | Chart type | Fill style | Grid | Endpoint |
|---|---|---|---|---|
| IMG_6345 | Vertical bar chart (2-tone), "Growth trends" | Flat solid fills, two purple tones (dark + light), NO gradient | Thin grey horizontal gridlines at even increments | N/A (bars, no line endpoint) |
| IMG_6347 | Sparkline under "Spending this month" | Single continuous line, gradient AREA fill fading red/coral to transparent beneath the line | No gridlines | No visible endpoint dot/marker |
| IMG_6346 | Live map with colored pins + legend | N/A (geographic, not a chart) | N/A | N/A |

**Translation for Solen's revenue chart**: the existing `DashLineChart`/`DashBarChart` in `app/[locale]/_components/dashboard/DashboardUI.tsx` are flat-stroke SVG polylines/rects with NO gradient fill today (confirmed via code read: `stroke-s-accent-bright` line, `fill-s-accent-bright`/`fill-s-error` bars, no `<linearGradient>` def present). IMG_6347's gradient-fill sparkline is the one genuinely new data-viz technique here worth adopting: **add a soft gradient area-fill beneath the revenue line** (accent color fading to transparent), keeping the line stroke itself flat/solid as it is now. Do NOT add gridlines to the mobile mini-chart (IMG_6347's sparkline has none, matches the current minimal mobile treatment); DO keep the existing thin grid on the desktop bar/line chart if one exists, that matches IMG_6345's pattern.

---

## TRANSLATION TO SOLEN DASHBOARD

Concrete rules mapped onto the dashboard's EXISTING elements (`app/[locale]/dashboard/page.tsx`, `components-legacy/dashboard/SetupBanner.tsx`, `components-legacy/dashboard/ActivityFeed.tsx`, `app/[locale]/_components/dashboard/DashboardUI.tsx`). Current state confirmed via code read: stat tiles + chart panels use `rounded-card-lg border border-s-border bg-white` with NO shadow class anywhere (border-only elevation); chart lines use `stroke-s-accent-bright` / `stroke-s-success`; bars use `fill-s-accent-bright` / `fill-s-error`.

1. **Stat tiles (`StatTile` in page.tsx): tighten radius from `rounded-card-lg` (20px) toward the 12-16px dashboard-card band** these refs actually show for KPI tiles specifically (IMG_6345/6346). Keep border-only elevation at rest, this is already correct, don't add a shadow to the resting tile.
2. **Stat tile hero-number-to-label ratio: widen it.** Measure the current numeral size vs its label in `StatTile`; target roughly 2.3-2.5x numeral-to-label size with a weight drop from bold to regular/medium on the label, matching IMG_6345/6346's most consistent, most importable signal.
3. **Add a per-tile category dot or small icon** (existing `text-s-ink-2`/semantic-token color, one hue per KPI TYPE: e.g. revenue = accent, bookings = success-green, cancellations = error-red), small (~8-10px dot or existing icon size per §13.7), never a colored card background. This is the one genuinely-new palette move (IMG_6345's per-card category dot), it must stay within the ALREADY-LOCKED semantic tokens (green #16A34A, red #D32F2F, amber #F1AE27, star #FFC32B, surcharge #EA580C), do not introduce a new purple/violet hue since Solen's token set has none locked for that.
4. **Revenue chart: add a gradient area-fill beneath the line** (accent color to transparent), keep the stroke flat/solid as it already is. This is the single concrete data-viz upgrade from IMG_6347, implement inside `DashLineChart` in `DashboardUI.tsx` as an SVG `<linearGradient>` + filled `<path>` under the existing `<polyline>`, no new color token needed, reuse `s-accent-bright` at full/zero opacity stops.
5. **Setup banner: apply the "one active step lit, others dimmed" choreography** from Video 2, if/when the setup banner shows a multi-step checklist, only the CURRENT step should carry ink weight + an accent-colored leading bar/icon; completed and future steps stay grey, exactly matching Solen's own already-locked §13.2 stepper recipe, this ref just reconfirms it rather than introducing something new.
6. **Activity feed: populate progressively, not all-at-once.** When the feed loads/refreshes, stagger each row's fade/slide-in (Video 1's fr_03 to fr_05 pattern) using the existing `glide` easing (200-300ms per step, per LOCKFILE §4), rather than a single instant render. Use a small per-row colored dot for event TYPE (IMG_6345's activity-feed pattern), reusing existing semantic tokens, never inventing new hues.
7. **Popovers/tooltips/hover-detail cards (e.g. a hover state on a chart data point, or an expandable stat-tile detail) get real elevation**, `elevation-3` from the existing token table, while resting cards stay flat/hairline. This directly matches IMG_6342's and IMG_6346's floating-layer treatment: flat base, elevated overlay.
8. **`+Termin` CTA stays exactly as locked: ink `bg-s-ink` fill, NOT the orange (IMG_6346) or blue (IMG_6343) accent seen in these refs.** Those refs use their brand accent for the primary button because THEIR brand accent is orange/blue; Solen's primary commit CTA is a separate, already-decided lock (LOCKFILE §0, project CLAUDE.md taste rule 3) that these aesthetic refs do not override. Flag explicitly since it's the most tempting misread of this doc: do not push the CTA toward orange or blue because IMG_6346/6343 do.
9. **Category/filter chips and any dashboard filter controls stay neutral gray** (existing `bg-s-bg-sunken` selected-state pattern), not tinted per-category. None of these refs actually show colored FILTER chips (IMG_6345's color is on stat-card dots and chart bars, not filter pills), so there is no conflict here, just a reconfirmation of the existing hard constraint.
10. **No em-dashes, no ALL-CAPS labels anywhere the refs' small caption text gets ported into copy** (IMG_6345/6346's small grey labels are sentence-case in every observed instance, e.g. "Total Users," "Active Sessions," not tracked-uppercase), consistent with Solen's existing copy rules.

### Explicit non-adoptions (things in the refs that must NOT move onto Solen's dashboard)

- IMG_6342's frosted/translucent popover-over-blur is a video-call-specific pattern (blurring a live call feed behind a menu); Solen's dashboard has no equivalent backdrop to blur, skip it.
- IMG_6343's warm cream background (`#F0EAE1`) contradicts Solen's locked COOL neutral system (`#F4F4F5`, taste rule 2), do not adopt the warm tone even though it appears in a ref.
- IMG_6347's outer black social-media chrome (like-counts, close icon) is not app UI at all, already flagged above, make sure it doesn't leak in as "a dark header bar" idea.
- The illustration content itself (blob art, money-jar icon in Video 2; the colorful avatar cluster in IMG_6343) is brand-specific decoration, not a token or pattern to extract.
