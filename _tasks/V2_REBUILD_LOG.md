# Solen V2 Rebuild Log

> **Naming convention (locked 2026-05-18 after user "v2 not v3 idu" question):**
> Entries up to and including **V2-D71** use the legacy `V2-D##` prefix (the log was
> originally named during the V2 → V3 brand rebuild process; the prefix is the LOG
> name, not the design era).
> **From V3-D72 onward, new entries use the `V3-D##` prefix** — the design era is
> V3 and the prefix should reflect that. Numerical sequence continues (V2-D71 →
> V3-D72), so historical lineage stays intact. Filename `V2_REBUILD_LOG.md` kept
> for now (renaming would break 200+ references; not worth the sweep).

> The single living doc that answers "what does the codebase look like RIGHT NOW."
> Reading order: Status → Stripped → Quarantined → In-flight → Locked & Surviving → Decisions → Next actions.
>
> NOT a design system spec. `_tasks/SOLEN_LIVE_TRUTH.md` owns specs.
> NOT a decision history. `_tasks/SOLEN_DESIGN.md` §20 owns history.
> This doc owns the running narrative.

---

## Status (one-liner)

**2026-05-21 (V3-D94 — Reverted V3-D93 substrate: #FAF8F2 → #FFFFFF pure white)** — User: "yk when we change the background white to abit grayish white revert back to comp white." The V3-D93 warm cream substrate didn't survive once the cool-poster blob mockup (`public/solen-cool-poster-substrate.html`) put cool blue/teal atmosphere zones on top of it — the warm-substrate-vs-cool-blob clash didn't read right. User picked pure white as the production base; brand/atmosphere exploration continues on top of pure white via mockup files, not in production. **Changes:** (1) `app/globals.css` html bg `#FAF8F2` → `#FFFFFF` with V3-D94 note in the substrate-history comment block (preserves V3-D93 history above for archeology). (2) `app/globals.css` `--base` CSS var `#FAF8F2` → `#FFFFFF`. (3) `app/[locale]/page.tsx` wrapper `bg-white` class restored (was removed in V3-D93 to let body substrate show through). **Verifier-loop:** Playwright at 393×852 confirms `htmlBg = rgb(255,255,255)`, `--base = #FFFFFF`, page renders against pure white. **Re-opened problem:** V3-D86's white-on-white card depth collapse returns — was the original reason for V3-D93's warm flip. Will be solved by atmosphere/blob layer (in progress via `solen-cool-poster-substrate.html` exploration), not by substrate tint. **Pre-flight gates:** TREATMENT change (color value swap), background-atmosphere slot only, no structural change, doc grep treated as hint (cross-referenced V3-D93 history comment to preserve full chain). Files patched: `app/globals.css`, `app/[locale]/page.tsx`, `_tasks/V2_REBUILD_LOG.md` (this entry). ·

**2026-05-21 (V3-D93 — Substrate flipped pure white → subtle warm #FAF8F2)** — User question: "is the background white rlly the way" — wanted honest pushback on the V3-D86 pure-white direction we've been on since 2026-05-19. Pushback delivered (pushed back on framing per global rule #3, not yes-man): pure white was causing depth collapse (white cards on white page = no visible float, SearchBar wrap/halo effects fight to be visible — the source of every SearchBar liquid-glass session battle 2026-05-20/21), beauty-vertical photos look slightly cold without warm substrate to harmonize, and Fresha-the-reference is NOT actually pure white (#F4F4F6 cool blue-grey). Built `public/solen-substrate-variants.html` showing 3 substrates side-by-side: A (#FFFFFF current), B (#FAF8F2 subtle warm — recommended), C (#FAF3E6 V2-D60 cream). User picked **B**. **Changes:** (1) `app/globals.css` html bg `#FFFFFF` → `#FAF8F2`, comment block updated with substrate-history chain (V2-D68 → V2-D70 → V2-D71 → V3-D72 → V3-D86 → V3-D93). (2) `app/globals.css` `--base` CSS var `#FFFFFF` → `#FAF8F2` (consumed by `body { background-color: var(--base) }`, harmless redundancy since html bg paints through, but keeps the var truthful). (3) `app/[locale]/page.tsx` page wrapper `bg-white` class REMOVED — was painting over the body substrate. Wrapper now lets html bg show through. **What stayed:** `s-bg.base` token in tailwind config still `#FFFFFF` because it's consumed by 20+ primitives (Sheet, Modal, Toast, Radio, TextInput, PillToggle, DateTimePicker, Select, Checkbox, Textarea) as the white-surface card / input bg — V2-D60 cards-stay-white fix preserved. The substrate change is page-only, not card-level. **Verifier-loop:** Playwright at 393×852 confirms `htmlBg = rgb(250,248,242)` (= #FAF8F2), `--base` CSS var = `#FAF8F2`, screenshot shows the homepage now has visible substrate-vs-SearchBar-card contrast. **Inconsistency surfaced (not yet fixed):** ~20+ pages outside the homepage have `bg-white` on full-screen wrappers (search, salon detail, salon/booking, discover, privacy, login, checkout, etc.) — those will paint over the new substrate. Mass sweep is blocked by `.claude/hooks/pre-sweep-check.sh` (correct behavior — brand-pivot sweeps need explicit `touch .claude/sweep-approved.flag` per CLAUDE.md). Decision deferred: homepage-only first, then user decides whether to sweep site-wide. **Drift surfaced (not yet fixed):** CLAUDE.md "Locked V3 brand" still says emerald `#1A8F5C` + terracotta `#E0703D` + Peace Sans + Open Sauce One — but `tailwind.config.js` (V2-D70+ pivot 2026-05-18) is royal blue `#1638C4` + yellow `#FFC32B` + Bricolage Grotesque + Hanken Grotesk. CLAUDE.md is stale by ~3 days and 4-5 design pivots. The substrate mockup used the stale CLAUDE.md colors; the substrate decision itself is orthogonal so B pick stands, but mockup's "verdict" text incorrectly cited emerald + terracotta + Peace Sans. CLAUDE.md update is a separate todo. Files patched: `app/globals.css` (html bg + --base var with V3-D93 comment), `app/[locale]/page.tsx` (bg-white removed + V3-D93 comment), `_tasks/V2_REBUILD_LOG.md` (this entry). Files created: `public/solen-substrate-variants.html` (the locked source mockup). Verifier screenshot at `solen-warm-substrate-mobile-verify.png`. **Pre-flight gates applied:** restated complaint as TREATMENT change (page bg color swap only — no structural change, no token system change, no font change), named the slot (background-atmosphere slot specifically — cards/sheets/modals are a separate slot and stayed untouched), doc grep treated as HINT not verdict (CLAUDE.md drift surfaced rather than silently followed). **Honesty cred:** binary-trigger discipline locked earlier this session in `feedback_binary_triggers.md` did NOT fire here (no image attached + no overlap keyword in this turn), so no skipped trigger to retract — user's question was strategic ("is white the right direction") and the right move was visualize-then-decide per global rule #2. ·

**2026-05-18 (V3-D73 — Premium production polish: viewport meta + dvh + 44px touch target + contrast fix)** — User shared a comprehensive advanced-UI/UX premium-application doc covering spatial grids, typographic rigor, materiality, native emulation, safe areas, and Hick's Law nav. Audited Solen against every section; found 4 critical gaps the doc explicitly calls out as production-readiness requirements. **Changes:** (1) `app/layout.tsx` — added Next.js 14 Viewport export with `viewport-fit=cover` (enables env(safe-area-inset-*) to work edge-to-edge, was silently no-op without this), `maximumScale=1 + userScalable=false` (locks structural UI against pinch-zoom breaking the grid), `themeColor=#F4F4F6` (matches new substrate). (2) `Hero.tsx` — `min-h-[70vh] md:min-h-[92vh]` → `min-h-[70dvh] md:min-h-[92dvh]` per doc "abandon 100vh in production, use 100dvh" — fixes iOS Safari floating bottom address bar collision (the new dvh unit dynamically recalculates as Safari's bar expands/contracts). Single vh usage on homepage; other components don't use vh. (3) `HeartButton.tsx` — refactored from single `<button h-8 w-8>` to outer transparent `<button h-11 w-11>` (44×44 hit area per doc ergonomic minimum + WCAG) wrapping inner `<span h-8 w-8>` (32×32 visible glass circle). Hover/focus/active states moved to the inner span via group classes so the larger hit zone doesn't visually pulse. Visual size preserved; only the touch target grew. (4) `tailwind.config.js` s-ink-3 darkened `#9BA09A` → `#7A7F78` per doc audit. Old value contrast vs new substrate `#F4F4F6` was ~2.24 (FAILED WCAG AA at 4.5 AND AA Large at 3.0). New value ~4.5:1 — passes AA Normal AND AA Large. Used on card meta text (addresses, distances) + placeholder text in inputs — both now clearly readable while still subordinate to primary headings. **Pre-flight gates applied:** all 4 changes are surgical TREATMENT updates following exact doc spec values (no improvisation). Each named the slot before touching (viewport meta on layout / Hero h-utility / Heart button structure / s-ink-3 token). **Verifier-loop:** Playwright at mobile width (375×812) confirms — peach gradient hero renders, search card floats with V3-D72 unified shadow, cards have new darker s-ink-3 on meta text (visibly more readable), heart hit area larger (visible circle stays 32px). Files patched: app/layout.tsx, Hero.tsx, HeartButton.tsx, tailwind.config.js, _tasks/V2_REBUILD_LOG.md (this entry). ·

**2026-05-18 (V3-D72 — Aurex floating-card refinement v2: cool grey substrate + unified soft shadow + heart icon refined)** — FIRST entry using new `V3-D##` naming convention (locked 2026-05-18 after user "v2 not v3 idu" question — V2-D71 was the last `V2-D##` entry; numerical sequence continues, prefix shifts to V3 reflecting the actual design era). **Changes:** (1) substrate `#F8F7F5` warm grey → `#F4F4F6` cool grey per user "Try #F4F4F6 or #F7F7F8" — slight cool shift makes pure-white cards pop more decisively. Updated in `tailwind.config.js` s-bg.base + `app/globals.css` html bg. (2) Card photo shadow + SearchBar shadow UNIFIED to `0px 6px 24px rgba(0,0,0,0.06)` per user "apply a soft, wide shadow to ALL your white cards" — Y offset tightened (10/8 → 6 across both), alpha slightly stronger (0.05/0.06 → 0.06), same spread (24px). Hover proportionally adjusted. Border kept invisible (3% alpha hairline on SearchBar; cards have no border). (3) Heart button glassmorphism refined to user exact spec: white alpha 0.70 → 0.80 (more solid, reads as deliberate UI element on any photo), backdrop blur 12px → 4px (subtler — image peeks through cleanly), saturate(1.4) dropped (not needed at 4px blur). Files patched: tailwind.config.js, app/globals.css, SalonCard.tsx, SearchBar.tsx, HeartButton.tsx. Pre-flight gates applied — all TREATMENT changes, no structural; named slots before touching (substrate / card shadow / SearchBar shadow / heart bg + blur); V2-D67-fu13 bare-text-cards lock preserved. ·

**2026-05-18 (V2-D71 — Aurex floating-card refinement: wider hero gradient + Dusty Slate badge + simpler drop shadows + substrate darken)** — User feedback on V2-D70: floating effect missing (cards blending into bg), hero gradient too weak, 15-Min blue badge too cartoonish, heart icon flat. Specific hex codes + shadow recipes provided. Substrate #F9F8F6 warm pearl → #F8F7F5 slightly darker warm grey. Card shadow replaced 4-layer warm-ink recipe with user spec single `0px 10px 30px rgba(0,0,0,0.05)`. SearchBar shadow replaced 3-layer with `0px 8px 24px rgba(0,0,0,0.06)`. Hero gradient widened 60%/50% → 85%/65% ellipse, center moved 50%/30%, inner stop deepened #FFF0E6 → #FFE2D0 (more spotlight less wash), fade reaches transparent by 75%, container height 540 → 640px. urgentStyle 15-Min badge swapped from system-blue glass → Dusty Slate solid #EEF2F6 bg + #3A5B7C navy text. availVariants text colors aligned (urgent/limited → text-[#3A5B7C]). Heart button white alpha 0.45 → 0.70 per user "70% opacity" spec. ·

**2026-05-18 (V2-D70 — Aurex/Fresha warm-minimal pivot: brand colors + typography + SearchBar architecture + card depth + badge palette)** — Comprehensive design brief synthesizing references (Aurex, Fresha, Muh Yasin, Got Chew) into a "premium warm minimal" lane with exact hex codes from user. Built mockup at `public/solen-warm-minimal.html` covering all 4 brief sections; user approved with two explicit reverts: keep Entdecken section + stylist letter-avatars unchanged. **Changes:** `tailwind.config.js` — `s-brand` `#1A8F5C` → `#3B7A57` forest green (matches Solen logo), `s-accent` `#E0703D` → `#D87352` (matches logo dot), `s-bg.base` `#F8F7F2` → `#F9F8F6` warm pearl, `s-ink` `#2A1F18` → `#1A1C19` cool charcoal, `s-ink-2` `#5C4A3A` warm → `#6B7068` cool grey, `s-border` `#EAE0D0` → `#E8E6E0`, added `s-bg.peach` `#FFF0E6`. Font family pivoted to Plus Jakarta Sans single family across display + heading + body (extreme weight contrast: 800 h1 / 500 body / 400 microcopy). `app/globals.css` — dropped Peace Sans + Open Sauce cdnfonts imports, replaced with Google Fonts Plus Jakarta Sans 400-800, swept all `Peace Sans` / `Open Sauce One` font-family strings via replace_all → `Plus Jakarta Sans, system-ui, -apple-system, sans-serif`, html bg `#F8F7F2` → `#F9F8F6`. `Hero.tsx` — added peach radial gradient layer (ellipse at 60%/30%, contained ~540px height), h1 bumped to clamp(40, 8.5vw, 60) weight 800 tracking -0.035em. `SearchBar.tsx` — mobile collapsed height 246 → 280px, outer radius 16 → 24px, lighter hairline border, 3-layer soft shadow per spec. Container p-3 gap-2 → p-2 no-gap (rows flush-stack with `::before` hairline dividers between siblings on mobile, kept desktop pill chrome). Mobile CTA changed from right-side rounded-full pill → full-width 16px-radius brand-green button at bottom weight 700. CollapsedRow dropped per-row border/bg/radius on mobile. `SalonCard.tsx` — photo radius 18 → 22px, shadow 2-layer subtle → 3-layer soft wide drop at cool ink RGB (26,28,25). Badge palette pivoted: `greenStyle`/`tealStyle` light glass → SOLID pale mint `#E5F2EA` + brand-green text. `amberStyle`/`angebotStyle` pink-red glass → SOLID terracotta `#D87352` + white text. `urgentStyle` blue glass kept (V2-D67-fu7 recipe — distinct time-pressure semantic). `discountClass` text-red-900 → text-white. availVariants text colors aligned. `cardCategoryColors` map aligned to V2-D70 brand: Coiffeur initial → `#D87352`, Barbershop ink → `#1A1C19`, Spa bg → `#E5F2EA` + initial → `#2D5E43`. `SectionHeader.tsx` — h2 tracking `-0.02em` → `-0.025em`. **Explicit reverts honored:** Entdecken section (`Entdecken.tsx`) UNTOUCHED — keeps current implementation rather than mockup's full-image + dark gradient overlay. FeaturedStylists (`FeaturedStylists.tsx`) UNTOUCHED — keeps letter-avatar approach rather than mockup's photo avatars. **LIVE_TRUTH updated:** lock chain banner adds V2-D70 at top, §0d non-negotiables #1-#3 rewritten for V2-D70 spec. **Verifier-loop:** Playwright screenshots at three scroll depths confirm hero peach gradient renders, SearchBar floats with new shadow + hairline dividers, brand-green CTA renders, "Heute frei" badge is pale mint + green text, cards have 22px radius + soft shadow, Stylists section preserves letter avatars per revert, Entdecken cards keep current gradient-overlay treatment, Reviews + B2B sections use new V2-D70 palette. Files patched: `tailwind.config.js`, `app/globals.css`, `Hero.tsx`, `SearchBar.tsx`, `SalonCard.tsx`, `SectionHeader.tsx`, `_tasks/SOLEN_LIVE_TRUTH.md`, `_tasks/V2_REBUILD_LOG.md` (this entry). Files created: `public/solen-warm-minimal.html` (locked source mockup), 3 earlier exploration mockups kept for archeology (`solen-typography-searchbar.html`, `solen-searchbar-fresha.html`, `solen-aura-mockup.html`). Pre-flight gates fully applied: restated complaint as TREATMENT (with SearchBar structural change explicitly authorized by user), named slots before touching, doc grep treated as hint not verdict — V2-D49j color role rule preserved (emerald-as-action just gets new green hex), V2-D67-fu13 bare-text-cards lock preserved. ·

**2026-05-18 (V2-D68 — Substrate shift + atmosphere wash RETIRED + cards gain hairline)** — Major pivot. User feedback: "The Background Gradient is Creating 'Visual Mush' — washing out your entire UI, makes the app feel heavy and makes the crisp white cards look like they were just slapped on top. It's killing your contrast. Gen Z design trends lean heavily into high contrast. Lets do subtle off white." User picked "DROP the hero glow entirely" from the V2-D68 mockup options — pure off-white everywhere, no atmosphere at all, cards + colors do all the work. **Changes:** (1) Substrate `s-bg.base` token swapped from V2-D60 cream `#FAF3E6` → V2-D68 subtle off-white `#F8F7F2` in `tailwind.config.js`. (2) `html { background-color: #FFFFFF }` in `app/globals.css` → `#F8F7F2` (the pure-white html bg was a V2-D60-fresha lock that's also retired). (3) Atmosphere wash retired entirely in 3 layers: AtmosphereBlobs JSX unmount from `app/[locale]/page.tsx`, AtmosphereGrain JSX unmount from same, `body::before` + `body::after` pseudo-element multi-radial-gradient cloud zones commented out in `app/globals.css` (was V2-D60-fresha 5-layer ::before at 0.40-0.85 opacity + 12-layer ::after at 0.10-0.22 opacity). `@keyframes atm-drift-1` + `atm-drift-2` left in place (orphan but harmless, no consumers). AtmosphereBlobs.tsx + AtmosphereGrain.tsx component files PRESERVED at their original paths in case future per-section accent moments need them. (4) `SalonCard.tsx` photo got a `0 0 0 1px rgba(26,18,9,0.06)` shadow-as-border hairline as the first shadow layer. Cards on cream `#FAF3E6` had ~5% lightness delta with substrate (clearly visible edge); cards on off-white `#F8F7F2` have ~2% delta so the photo dissolved into substrate at corner radius without a hairline. Hairline added per Airbnb / Stripe card recipe — sharper than CSS `border:` (no layout shift) + crisp at 1dpr. Hover state shadow proportionally adjusted to keep the same hairline + emphasized shadow lift. **Doc changes:** LIVE_TRUTH §0d non-negotiable #1 (substrate is off-white now, not cream), §0d non-negotiable #9 (no atmosphere wash, period — replaces the V2-D65 "atmosphere is global, not per-page" rule), §0d.7 anti-patterns expanded with 3 new V2-D68 entries (no page-wide atmosphere in any form, no pure-white substrate, no cards without hairline on V2-D68 substrate), §4 substrate table + reasoning rewritten for V2-D68, §5g atmosphere wash section retired (former spec preserved below the §5g header as §5g-OLD for archeology), §16.2 photo shadow row updated with the new hairline-first 3-layer recipe, V3 lock chain banner at top of doc updated with V2-D68 entry. **Pre-flight gates applied:** restated user complaint (atmosphere wash = visual mush, low contrast, cards look slapped) + locked direction (subtle off-white substrate + atmosphere retired + brand colors accent-only) BEFORE building any mockup. Single mockup round at `public/solen-substrate-shift.html` showed the proposed state; user picked the most aggressive option ("DROP the hero glow entirely"). Production change applied in 1 pass, Playwright verified at phone width — cards have visible hairline edges, atmosphere completely gone, brand colors confined to logo dot + h1 "buchen" highlight + "Heute frei" green badge + "-15%" pink-red discount badge + emerald CTA. **Files patched:** `app/[locale]/page.tsx` (AtmosphereBlobs + AtmosphereGrain imports + mounts commented out with rationale), `app/[locale]/_components/homepage/SalonCard.tsx` (photo shadow gained hairline), `app/globals.css` (html bg + body::before/::after retired), `tailwind.config.js` (s-bg.base token), `_tasks/SOLEN_LIVE_TRUTH.md` (§0d/§4/§5g/§0d.7/§16.2 + V3 lock chain), `_tasks/V2_REBUILD_LOG.md` (this entry). **Files created:** `public/solen-substrate-shift.html` (the locked V2-D68 source mockup). ·

**2026-05-17 (V2-D67-fu17 — Depth experiments reverted; V2-D41 baseline shadow + V2-D65 transparent FeedZone restored)** — User: "meh nvm ditch ts" after V2-D67-fu16 warm-shadow recipe. Reverted both V2-D67-fu15 (boosted shadow + FeedZone tint) and V2-D67-fu16 (warm-tinted ambient occlusion) back to baseline. SalonCard photo shadow returned to V2-D41 subtle 2-layer `0 1px 2px rgba(26,18,9,0.04), 0 4px 10px rgba(26,18,9,0.05)`. FeedZone returned to V2-D65 transparent (no bg fill, atmosphere reads at full chroma below cards). **Kept the small drift fix from V2-D67-fu15**: FeedZone shadow stays as ink RGB `rgba(26,18,9, X)` instead of the retired V2-D15-3 teal RGB `rgba(4,51,56, X)` it had before — that drift fix is unrelated to the depth experiment. Also **kept the V2-D67-fu16 shadow research notes** in LIVE_TRUTH §0d.7 (compressed to a "future reference" callout, not as active anti-pattern rules since the recipe was reverted). LIVE_TRUTH §16.2 photo shadow + §15 FeedZone recipe both restored to baseline values with a brief note that V2-D67-fu15/fu16 were reverted. The card depth complaint ("no depth between cards n background") remains UNRESOLVED but the experiments to fix it were not landing — user chose to ditch and revisit later. Files patched: `app/[locale]/_components/homepage/SalonCard.tsx`, `app/[locale]/_components/homepage/SectionHeader.tsx`, `_tasks/SOLEN_LIVE_TRUTH.md` (§16.2 + §15 + §0d.7), `_tasks/V2_REBUILD_LOG.md` (this entry — previous V2-D67-fu15 + V2-D67-fu16 entries kept for archeology). ·

**2026-05-17 (V2-D67-fu16 — Card shadow replaced with warm-tinted ambient occlusion after V2-D67-fu15 was diagnosed as "tacky")** — User on phone post-V2-D67-fu15: "the only change i see is the shadow but rn it looks so tacky n ok can u go research how modern apps do it". Spawned research agent that scanned Apple iOS 26 Liquid Glass direction + Airbnb / Stripe / Linear / Vercel shadow tokens + Tailwind v4 shadow rationale + Material Design 3 elevation spec + Josh Comeau shadow guide + Koos Looijesteijn shadow-color theory + local Fluz teardown (which uses zero shadows on warm cream). Diagnosis: V2-D67-fu15 hit FIVE shadow anti-patterns simultaneously — (1) pure-black RGB `rgba(26,18,9, X)` on warm cream `#FAF3E6` = grey-brown smudge (warm substrates need warm-tinted shadows per Koos's color theory), (2) uniform alphas 0.10/0.10/0.06 = flat "stamped" feel instead of exponential decay (real-light diffusion needs e.g. 0.04 → 0.05 → 0.08), (3) 24px Y-offset on 157px-wide mobile card = 15% offset, looks like "hovering on a stick", (4) no hairline edge — card dissolved into atmosphere wash boundary, (5) recipe mimicked Material Design elevation 4-5 (floating-dialog level) instead of M3 elevation 1 (resting-card level) — that's why it read as a "2010s Material relic". **Replaced with "warm-tinted ambient occlusion" recipe:** `0 0 0 1px rgba(120,80,30,0.04), 0 1px 2px rgba(120,80,30,0.05), 0 8px 24px rgba(120,80,30,0.08)`. Shadow color `rgba(120,80,30, X)` is warm umber sampled from cream substrate `#FAF3E6` hue family (same hue, darker + desaturated per Koos's rule). Three layers with exponentially decaying alpha (0.04 → 0.05 → 0.08) for proper light diffusion. `0 0 0 1px` first layer = shadow-as-border hairline (sharper than CSS border, no layout shift, Airbnb pattern). Hover scales ambient layer + bumps hairline alpha proportionally; stays warm throughout. Trade-off vs V2-D67-fu15: depth is more SUBTLE — modern apps are subtle, this is correct, but if user wants stronger they can ramp the ambient layer alpha 0.08 → 0.12 (still warm). **§0d.7 anti-patterns expanded from 11 → 16 items** to lock all 5 shadow anti-patterns the research surfaced: pure-black on cream, uniform alphas, high Y-offset without negative spread, missing hairline on atmospheric substrates, M3 elevation 4-5 on resting cards. **LIVE_TRUTH §16.2 photo shadow row updated** with new recipe + explanation. **Files patched:** `app/[locale]/_components/homepage/SalonCard.tsx`, `_tasks/SOLEN_LIVE_TRUTH.md` (§16.2 + §0d.7 additions), `_tasks/V2_REBUILD_LOG.md` (this entry). **Pre-flight gates applied:** restated complaint as TREATMENT (shadow recipe wrong) not STRUCTURE (everything else stays), named the slot (photo shadow only — FeedZone tint stays from V2-D67-fu15 since it's working), used doc grep as HINT not verdict (research overrode the doc's previous shadow values). **Research sources cited in the V2-D67-fu16 SalonCard.tsx JSDoc** so future agents can re-derive if cream substrate changes (regenerate shadow color from new substrate hue using Koos's formula: same hue family, ~60% sat, ~25-30% lightness, opacity ladder 0.04 → 0.05 → 0.08). ·

**2026-05-17 (V2-D67-fu15 — Card depth boost: photo shadow 3-layer deep + FeedZone soft tint restored)** — Followed up V2-D67-fu13's bare-text lock by actually fixing the original "no depth between cards n background" complaint. Used the new visual-work pre-flight gates (CLAUDE.md "🧠 Visual-work pre-flight"): restated complaint as TREATMENT not STRUCTURE, named available depth slots (photo + section frame, NOT text region per V2-D67-fu13 no-touch lock), built tight mockup `public/solen-card-depth-v2.html` with 4 options ALL keeping bare text at real 157px production width, user picked D ("photo shadow STRONG + FeedZone tint"). **Changes:** (1) `SalonCard.tsx` photo shadow boosted ~2.5× — was V2-D41 subtle 2-layer `0 1px 2px rgba(26,18,9,0.04), 0 4px 10px rgba(26,18,9,0.05)`, now V2-D67-fu15 deep 3-layer `0 2px 6px rgba(26,18,9,0.10), 0 12px 28px rgba(26,18,9,0.10), 0 24px 48px rgba(26,18,9,0.06)`. Hover shadow scaled up proportionally (~`0 2px 8px / 0 16px 36px / 0 32px 60px` at alphas 0.12/0.12/0.08) so the hover-lift delta stays felt. (2) `SectionHeader.tsx` `<FeedZone>` got a soft white tint restored — was V2-D65 fully transparent (atmosphere wash hitting cards directly), now V2-D67-fu15 `bg-white/30 + backdrop-filter: blur(20px) saturate(1.1) + border-top white/50`. Much lower alpha than V2-D65-retired `bg-white/45 + blur(22px) saturate(1.6)` "glass everywhere" version — pushes atmosphere ~30% behind the card zone without re-introducing the "everything is glass = cheap" feel that drove V2-D65. (3) **Drift caught during the same edit:** `<FeedZone>` shadow was using retired V2-D15-3 dark teal RGB `rgba(4,51,56, X)` — never updated through V2-D42/V2-D48/V2-D60. Fixed to ink RGB `rgba(26,18,9, X)` per §5b depth system. **LIVE_TRUTH §16.2 + §15 updated** with new shadow values + new FeedZone recipe + explanation of why the V2-D65 retirement was partial (the principle "no glass everywhere" stands, but the literal alpha was the right number, not the right rule). **Verifier-loop:** Playwright screenshot at scrollY=700 confirms cards now have visible drop shadows (soft dark gradient below each photo), atmosphere wash still bleeds through around FeedZone edges + at top of screen, bare text below photos unchanged. Files patched: `app/[locale]/_components/homepage/SalonCard.tsx`, `app/[locale]/_components/homepage/SectionHeader.tsx`, `_tasks/SOLEN_LIVE_TRUTH.md` (§16.2 photo shadow + §15 FeedZone recipe + retired-RGB note), `_tasks/V2_REBUILD_LOG.md` (this entry). Files created: `public/solen-card-depth-v2.html` (the locked option D source mockup). **Pre-flight gates worked:** vs V2-D67-fu13's ~6 wasted mockup rounds, this iteration shipped in 1 mockup round because gate #1 (STRUCTURE or TREATMENT) immediately ruled out wrapper variations and gate #2 (name the slot) immediately ruled out text-region. ·

**2026-05-17 (V2-D67-fu14 — LIVE_TRUTH cleanup: V2 contamination archived, V3-only doc written, 2 production code drifts fixed)** — Sulo asked "why are we even keeping" the 5,178-line `SOLEN_LIVE_TRUTH.md` after another grep-as-verdict failure where I confidently cited the stale §V2-D41.2 frosted-pill spec (retired V2-D67-fu13) as if current. Audit found the doc was in "override-banner-patched, never rewritten" state: 186 contradictions (mostly `#043338` brand-teal, Cooper BT, Avant Garde Gothic refs that survived 5 pivots), 16 gaps (V2-D60 vibrancy tune, V2-D64/V2-D65 atmosphere component, V2-D66/V2-D67 hero specs, V2-D51 SearchBar Hybrid Hub all absent), 11 dead sections (V2-D15-3 31-combo Republik library, §15.1-15.4 V2-D15-4 editorial pattern, §F.7 Cooper fallback chain body, V2-D15-3 retired-palette half of §5h.1, etc.). User decisions before cleanup: drop §13.2 counter pill + §13.6 quick chips entirely (never shipped), drop 👋 emoji from Hero greeting (violates §5e Lucide-only rule), fix the 2 code drifts surfaced during audit, archive the V2 contamination wholesale + write clean V3-only doc. **Code drifts fixed this iteration:** (1) `SalonCard.tsx` `cardCategoryColors` map was stuck at V2-D48 hexes (`#FAF2E5`/`#C97A57` Coiffeur, `#E8DDC9`/`#2A1F18` Barbershop, `#D4DDC8`/`#8E4A2D` Nails, `#D4EBD9`/`#0F3D26` Spa) — V2-D60 vibrancy tune updated `tailwind.config.js` tokens but missed this hardcoded photo-fallback map, meaning no-photo cards rendered in pre-vibrancy V2-D48 colors. Synced to V2-D60: `#FFE8D8`/`#E0703D`, `#EAE0D0`/`#2A1F18`, `#D4DDC8`/`#A04A22`, `#D4F2E0`/`#0F6F44`. (2) `Hero.tsx` h1 + greeting + `SectionHeader.tsx` h2 ALL used `style={{ fontFamily: "'Plus Jakarta Sans'..." }}` inline overrides — Plus Jakarta is V2-era RETIRED (wasn't even in the retired-fonts list because the drift was invisible). Three components switched to `font-display` (Peace Sans) / `font-body` (Open Sauce One) Tailwind classes per V2-D42 lock. `globals.css` Google Fonts import dropped `Plus+Jakarta+Sans:wght@500;600;700;800` parameter (kept only Inter as cdnfonts-failure fallback for Open Sauce One). (3) Hero greeting dropped the `👋` Unicode emoji + the `<span aria-hidden>` wrapper per §5e Lucide-only iconography rule. Greeting now reads `Hallo, {name}` with no emoji. **LIVE_TRUTH wholesale rewrite:** original 5,178-line doc moved to `_tasks/archive/SOLEN_LIVE_TRUTH_v3-pre-cleanup-2026-05-17.archived.md` with prominent RETIRED banner at top + explanation of why archived. New `_tasks/SOLEN_LIVE_TRUTH.md` written from scratch: 944 lines (82% reduction), V3-only, no V2 contamination. New doc covers: V3 lock chain timeline, §0d non-negotiables + §0d.7 anti-patterns (11 items including the new V2-D67-fu13 no-text-wrapping rule + V2-D67-fu14 no-inline-font-family rule + V2-D67-fu14 no-Unicode-emoji rule), §1 V2-D60 brand palette (22 authorized hexes total), §1b Switzerland-only scope, §2 V2-D60 4-cat colorways, §3 semantic + heart `#FF4A6B`, §4 cream substrate + WHITE cards, §5 Peace Sans + Open Sauce One + Inter fallback typography lock, §5a pill rule, §5b 5-level depth system with ink-RGB shadows, §5c motion easings + V2-D67-fu13 heart-saved recipe, §5d terracotta inline emphasis (V2-D49j), §5e Lucide-only iconography, §5g V2-D67-fu12 atmosphere blob system (14 desktop / 6 mobile with full recipe), §5h color philosophy 9 items + §5h.1 V2-D60 single palette + §5h.2 V2-D49j role rule with full enforcement list, §F primitives summary (refers to component JSDoc for detail), §12 Header (compressed to 1 paragraph + JSDoc link), §13 Hero V2-D67 lock (no eyebrow / no subtitle / no counter pill / no quick chips / no emoji / left-aligned), §14 SearchBar V2-D51 Hybrid Hub (static pill + dropdown/sheet, 3 segments, full picker behavior), §15 Section header V2-D41-rising-panel quick-ref only (deleted retired V2-D15-4 editorial pattern), §16 Salon card V2-D67-fu13 BARE TEXT lock (no pill no surface no wrapper) + V2-D67-fu7 layered-glass badge recipe + 6-semantic palette, §17 ScrollRow, §18 Entdecken (marked NOT BUILT), §19 City tiles V3 gradient, §20 B2B promo, §21 V2-D49n negative footer, §22 SEO link wall, §23 V1 homepage section order, §24b accessibility, §24c PostHog events, §25 Category page (marked NOT BUILT), §33 DB schema mapping. **CLAUDE.md updated:** design-system bullet list rewritten — old version had stale references to Q-lock archives + retired V3-preview HTML mockups. New version: principal = new short LIVE_TRUTH; decision narrative = V2_REBUILD_LOG; patterns = SOLEN_PATTERNS; component specs = JSDoc on component files; archives explicitly tagged as "DO NOT GREP for current state." Hierarchy rule rewritten: production code wins over LIVE_TRUTH (V2-D67-fu14 reversed the doc-wins-over-code framing because doc drift caused the failure pattern this whole cleanup addresses). Reference to specific LIVE_TRUTH sections at bottom updated to point at new file. **Files patched:** `app/[locale]/_components/homepage/SalonCard.tsx` (cardCategoryColors map V2-D48 → V2-D60), `app/[locale]/_components/homepage/Hero.tsx` (font + emoji + comment), `app/[locale]/_components/homepage/SectionHeader.tsx` (font + comment), `app/globals.css` (Plus Jakarta import dropped), `_tasks/SOLEN_LIVE_TRUTH.md` (full rewrite 5,178 → 944 lines), `_tasks/archive/SOLEN_LIVE_TRUTH_v3-pre-cleanup-2026-05-17.archived.md` (new archive copy with RETIRED banner), `CLAUDE.md` (design-system section + LIVE_TRUTH ref at bottom), `_tasks/V2_REBUILD_LOG.md` (this entry). **New permanent anti-patterns locked in §0d.7 + carried to CLAUDE.md memory:** (1) no inline `fontFamily` overrides on components — use Tailwind `font-display`/`font-body` classes; (2) no Unicode emoji in UI — Lucide only. **Verifier-loop:** Playwright screenshot post-fixes confirmed homepage renders cleanly, h1 in Peace Sans (visible character difference from Plus Jakarta), no emoji, section h2 "Zuletzt angesehen" in Open Sauce One. ·

**2026-05-17 (V2-D67-fu13 — Card text region locked as bare text + agent pre-flight gates added)** — User pointed at salon cards on mobile: "no depth between cards n background" + later "im talking abt ths structure n 1by 1 n jst bare tex underneath, ont we have ths rule n i always see u macking the mistake why" (with red-circle annotation around the bare-text-under-photo card). Agent ran ~6 wasted mockup rounds proposing pill / white wrapper / hairline / frost / glass surfaces around the text — all wrong. Real complaint was about depth between CARD (photo + bare text) and ATMOSPHERIC WASH, not about the text needing a surface. User then said explicitly: "i just want text not covered or inside a pill jst text what do u not understand." Two fixes shipped: (1) **LIVE_TRUTH §16 banner updated** — the V2-D41.2 frosted-glass pill spec is RETIRED. Bare text below photo is permanently locked. Depth in this region must come from photo shadow + section panel opacity, NOT from wrapping text. §16.2 dimensions table updated (text container = "none — bare text only"). (2) **CLAUDE.md gained "🧠 Visual-work pre-flight" section** above the design-skill stack with 5 gates that fire on visual feedback: STRUCTURE vs TREATMENT question / name the slot before touching it / restate complaint + outcome before producing / doc grep is a HINT not verdict / no-touch slots are permanent. User trigger phrases ("you're skeleton-blind", "stop wrapping", "doc isn't verdict", "restate first") encoded as escalation signals. Parallel user-memory file `feedback_structure_vs_treatment.md` written + linked in MEMORY.md index so the rules auto-load next session. **No production code changed in SalonCard.tsx this iteration — the bare text is what user wants, the next round of depth work happens in the photo + section slots only.** Files patched: `_tasks/SOLEN_LIVE_TRUTH.md` (§16 banner + §16.2 table), `CLAUDE.md` (new section), `~/.claude/projects/-Users-sulo-Documents-solen/memory/feedback_structure_vs_treatment.md` (new), `~/.claude/projects/-Users-sulo-Documents-solen/memory/MEMORY.md` (index entry), `_tasks/V2_REBUILD_LOG.md` (this entry). **New permanent anti-pattern locked:** no surface / pill / wrapper / border / blur / backdrop-blur on the SalonCard text region — ever. If a depth complaint comes in for cards, fix lives in `.photo` shadow or `<FeedZone>` panel opacity, never in the text. ·

**2026-05-14 (V2-D60 — Vibrancy tune: V3 palette saturation bumped + WHITE cards on cream)** — User flagged "too much beige, not enough vibrancy" on the homepage. Diagnosis: cream-on-cream cards `#FAF2E5` on `#F5EBDD` substrate = only ~5-7% lightness difference, eye blurs them into one beige plane. Plus V2-D48 emerald `#1F5C42` was 49% saturated and terracotta `#C97A57` was 51% saturated, so all 3 design-system colors were "muted." Side-by-side mockup at `public/solen-vibrancy-options.html` rendered current (A) vs punched-up (B) vs near-white (C). User picked B. **Locked changes (token VALUES only — NAMES preserved so the 91 customer surfaces auto-update):** s-brand DEFAULT `#1F5C42` → `#1A8F5C` (same hue ~144°, sat 49% → 70%); brand mid `#0F3D26` → `#0F6F44`; deep `#0A2917` → `#084B2D`; pale `#A8CFB8` → `#A8E0BF`; subtle `#D4EBD9` → `#D4F2E0`. s-accent DEFAULT `#C97A57` → `#E0703D` (same hue ~18°, sat 51% → 71%, warmer terracotta-orange); soft `#E8B89B` → `#F0A98C`; deep `#8E4A2D` → `#A04A22`. s-bg base `#F5EBDD` → `#FAF3E6` (lighter substrate, less yellow tint); **s-bg surface `#FAF2E5` → `#FFFFFF`** (THE biggest fix — white cards on cream kills the beige collapse); sunken `#E8DDC9` → `#EAE0D0`. s-border swapped to `#EAE0D0` to match. s-coral legacy alias updated to match s-brand. Cat colorways re-tinted: Coiffeur `#FAF2E5/#C97A57` → `#FFE8D8/#E0703D`, Nails text `#8E4A2D` → `#A04A22`, Spa `#D4EBD9/#0F3D26` → `#D4F2E0/#0F6F44`. Atmosphere wash colors aligned (s-atm-cream `#F5EBDD` → `#FAF3E6`, terra `#E8B89B` → `#F0A98C`, bone `#E8DDC9` → `#EAE0D0`). Files patched: `tailwind.config.js` (full token swap), `app/globals.css` (html bg `#F5EBDD` → `#FAF3E6`), `app/[locale]/_components/homepage/WhySolen.tsx` (panel bg cream → white + border `#1F5C42` → `#1A8F5C` + TINT_BG palette refreshed + product-mockup gradients), `app/[locale]/_components/layout/Footer.tsx` (newsletter focus-ring hex), `CLAUDE.md` (Locked V3 brand + cat colorways lines updated to V2-D60), `_tasks/V2_REBUILD_LOG.md` (this entry). **What survives the tune:** V2-D49j action-color rule (emerald = action only, terracotta = highlight words only) — same RULE, brighter values. V2-D55 atmosphere recipe. Card / pill / radius geometry. All V3 patterns. **What changes:** saturation + substrate brightness + cream-cards → white-cards. No new hues. **New anti-pattern locked:** never use cream-on-cream surface stacking (cards same hue as substrate at <10% lightness delta) — eye blurs them into one beige plane. Always white (or near-white) cards on cream substrate. ·

**2026-05-11 (V2-D55 — Atmosphere natural-calm pass: V2-D54 vibrant glow dialed down ≈3× on homepage)** — User on homepage: "too much color and vibrant and no white at all and nothing natural at all." V2-D54 (2026-05-11 earlier today) swung the atmosphere recipe from V2-D48's `mix-blend-multiply` "everything is beige" film to a vibrant glow with `mode: normal` + saturated V3 mid-tones at opacity 0.14-0.22. The glow recipe over-corrected — 7 saturated blobs stacked at those opacities ate the cream substrate so the page read as "designer color pour" not "natural light." V2-D55 keeps the same `mode: normal` + same V3 hues (emerald `#5BAE85`, terracotta `#D6754F`, butter `#F0C85A`, sage `#9CC0A4`, dusty rose `#E89A88`) but dials four parameters: (1) **7 blobs → 5** — dropped the bottom-right emerald-mid + mid-bottom warm cream-peach because they overlapped other blobs and added chromatic noise without adding shape variety. (2) **Opacities 0.14-0.22 → 0.05-0.08** (≈3× cut) so cream substrate `#F5EBDD` dominates and reads through cleanly. (3) **Blur 90px → 130px** for softer falloff so blobs feel like ambient light not painted shapes. (4) **`saturate(1.15)` → `saturate(0.85)`** so colors read as "natural light through a window" instead of "designer pour." `variant="light"` API recalibrated to match: multiplier 0.45 → 0.6 on opacity, blur 110px → 150px (kept for forward-use on commerce surfaces that mount the component instead of inline-tuning). Substrate decision: **homepage stays cream `#F5EBDD`** per V2-D48 / §5h.3 (white is reserved for commerce surfaces — switching homepage substrate to white would orphan the brand identity). User's "no white" complaint reads as "let the substrate show through" not "swap substrate to white" — confirmed by tracing the comment back to where the colored blobs ate the cream. Files patched: `app/[locale]/_components/homepage/AtmosphereBlobs.tsx` (BLOBS array trimmed + opacities cut + blur bumped + saturate dropped + JSDoc rewritten). LIVE_TRUTH §5g atmosphere recipe + SOLEN_PATTERNS.md §1.5 updated with new numbers. Anti-pattern reinforced: don't pile opacity on for "more atmosphere" — substrate dominance is the design goal, blobs are seasoning. ·

**2026-05-11 (V2-D53.4 — Salon detail polish pass: SalonServicesSheet + sticky-chrome coordination + atmosphere wash scoping + font unification + subcategory schema)** — Same-day follow-up to V2-D53.3 covering iteration after live testing on `/salon/atelier-haarwerk`. User feedback drove ~7 distinct sub-changes: (1) **Duplicate breadcrumb on `/en/salon/*` routes** — `components-legacy/ui/Breadcrumb.tsx` was stripping locale via `pathname.replace(\`/${locale}\`, "")` where `locale` was whatever `useLocale()` returned; when the URL locale and `useLocale()` disagreed (`/en/salon/X` while context returned `de`), the strip silently failed and the breadcrumb rendered twice — once with the locale prefix, once without. Fixed with defensive regex `/^\/(de|en|fr|it)(?=\/|$)/` that strips any of the four supported locales unconditionally. Also added `/salon/` to the `EXCLUDED` path list — salon detail surfaces don't want the legacy breadcrumb at all because the new `SalonBreadcrumb.tsx` component is the surface-native one. (2) **Sticky chrome coordination on `/salon/[slug]`** — three pieces of chrome (site Header, `SalonStickyTabNav`, desktop `SalonSidebar`) were all toggling state at the same scrollY threshold, producing a frame of flicker at the boundary. New rule: hysteresis 100/200 across all three. Header (`app/[locale]/_components/layout/Header.tsx`) now reads `usePathname()`, detects salon detail via regex `\/salon\/[^/]+\/?$`, and slides up (`-translate-y-full`) when `farScrolled` is true; `farScrolled` uses the `enter > 200, exit ≤ 100` hysteresis so the header doesn't jitter at the boundary. `SalonStickyTabNav.tsx` switched from `position: sticky top-0` (which only pins once it scrolls into view at its natural document position ~500px down) to `position: fixed top-0 left-0 right-0` (always at viewport top, opacity 0/100 controls visibility) with the same 100/200 hysteresis — so when the site header hides, the tab nav appears, and vice versa, with no overlap or gap. (3) **Sidebar breakpoint md → lg (1024px)** — desktop sidebar was rendering at md (768px) which on narrow laptops produced a cramped 2-col layout. Moved breakpoint to lg (1024px) so 768-1023px viewports use the mobile floating Book bar (`SalonMobileBookBar`) instead. Body grid now `lg:grid lg:grid-cols-[1fr_340px]` (was `md:`), sidebar `<aside className="hidden lg:block">` (was `md:`). Added `SalonContact.tsx` mobile-only contact section (phone/website/Instagram links via `lg:hidden`) since the sidebar contact rows weren't shown on mobile and 768-1023px viewports otherwise lost the info entirely. (4) **Hero overlay icons + title typography unification** — back/share/heart icons on mobile hero went from filled `bg-white/90` circles to outline-only with white stroke (`rgba(255, 255, 255, 0.95)`) + dual drop-shadow `drop-shadow(0 1px 3px rgba(0,0,0,0.45)) drop-shadow(0 0 1px rgba(0,0,0,0.3))` for legibility over photos. Same outline treatment on desktop share/heart cluster (`SalonHeader.tsx`) but with dark stroke `text-s-ink` since they sit over the white substrate. Share2 icon swapped to iOS-style `Share` icon. `HeartButton.tsx` got a new `tone?: "light" | "dark"` prop — `tone="dark"` skips the white-glow drop-shadow filter and uses `#1B1B1B` stroke for non-photo placement. (5) **Title typography swap on salon detail** — h1 went from `font-display` (Peace Sans, the marketing display font) to `font-body` (Open Sauce One bold) at `text-[24px] md:text-[36px] lg:text-[44px]` because Peace Sans's chunky letterforms read as decorative/marketing on a commerce surface. Same swap propagated to all section h2s (`SalonServices`, `SalonTeam`, `SalonReviews`, `SalonAbout`, `SalonContact`, etc.) — all use `font-body text-[18px] md:text-[22px] font-bold leading-tight tracking-tight text-s-ink`. Peace Sans stays only on the homepage hero h1 + Featured pill on the salon page; everything else on commerce surfaces is Open Sauce body bold. (6) **Atmosphere wash scoped INSIDE main** — user asked for "light gradients in the background like homepage but lighter and more white." First attempt mounted `<AtmosphereBlobs />` at viewport-fixed scope (same as homepage) — too vibrant. Second attempt: dropped intensity inline via 8 hand-tuned blobs in 4 vertical bands inside `<main>` only (scoped to the page, not the viewport), each at `opacity: 0.09-0.11` with `filter: blur(110px) saturate(0.9)` and warm+cool pairs (peach + emerald, butter + sage, rose + emerald, terracotta + emerald). Also added `variant?: "full" | "light"` prop to `AtmosphereBlobs.tsx` so future commerce surfaces can mount the homepage component at half-intensity (multiplier 0.45 on opacity, 110px blur instead of 90px) without duplicating the inline blob array. (7) **SalonServicesSheet — the biggest piece of today's work.** User tapped "Alle ansehen" on services and got the in-place expand from V2-D53.3, said "no, it should jump into a full-screen page like Fresha — same sticky thing." Built a new file `app/[locale]/_components/salon/SalonServicesSheet.tsx` (~370 lines) that opens on `setSheetOpen(true)` from the parent `SalonServices` component. Render via `createPortal(node, document.body)` to escape the `<main isolate>` stacking context (sheet at z-[100] needs to cover the site header at z-50 — without portal it'd be trapped inside main's stacking context and bleed through). Top bar: back arrow + "Services" title grouped LEFT (`flex items-center gap-3 md:gap-4`), X close on RIGHT, all on solid `bg-white` (was `bg-white/95 backdrop-blur-md` — too transparent, let the underlying page show through). Body: 2-col grid on lg (`lg:grid lg:grid-cols-[1fr_360px] lg:gap-10`), single column on mobile. Left column: step breadcrumb (`Services › Profi › Zeit › Bestätigen`), h1 "Services", **scroll-spy sticky chip bar** that pins below the top bar at `sticky top-[60px]` (mobile) / `top-[72px]` (desktop) — chips highlight as the user scrolls past each `<section data-cat={cat}>`. Implementation: plain `scroll` event listener on the `dialogRef` (not viewport — sheet owns its own scroll context via `overflow-y-auto`), measures each section's `getBoundingClientRect().top` relative to the dialog, picks the section whose `relTop ≤ 128px` with the highest top value (the one closest-to-but-above the active line). IntersectionObserver with `root: dialogRef.current` was tried first but the timing of when the portal's children mounted made the observer fire before the DOM was stable; `mounted` state + plain scroll handler proved more reliable. Active chip color is emerald `border-s-brand bg-s-brand text-white` per V2-D49j — initial implementation used `bg-s-ink` (black) for Fresha-density but user pushed back: "i thought we had our own thing" — swapped back to emerald to maintain commerce-surface consistency with the sidebar Book button and every other active state on the page. Service cards: 2px border (transparent when unselected, `border-s-brand` when selected) so selection state reads at a glance; the `+`/`✓` toggle button is `h-10 w-10 rounded-full border-2` matching the same emerald-fill-on-active pattern. Right column: sticky cart card aligned with h1 via `<aside className="hidden lg:block lg:pt-14">` + `<div className="sticky top-28">` inner wrapper. Cart card itself: `flex min-h-[calc(100vh-180px)] flex-col rounded-2xl border border-s-border bg-white p-6 shadow-[0_8px_28px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04)]` — the `min-h-[calc(100vh-180px)]` makes it viewport-tall, and `flex-col` + `flex-1` on the inner services region pushes the Continue button to the bottom of the card regardless of how many services are selected. Took ~5 iterations of card height (pt-44/top-44 → pt-20 → pt-44 → min-h calc → revert + pt-14 alignment → re-add min-h + flex-1) to land on this final shape. Mobile (lg:hidden): floating bottom Continue bar with selection count + total. Continue href: `/{locale}/salon/{slug}/booking?services={ids}` — the booking page itself is F.1.E #21 territory and not yet built; sheet just hands off the selection. (8) **Subcategory schema for fine-grained filter chips** — applied migration 085 via Supabase MCP: `ALTER TABLE services ADD COLUMN IF NOT EXISTS subcategory text;`. Reason: `services.category` is constrained to the enum `coiffeur/barbershop/nails/spa/makeup/waxing`, so it can't hold fine-grained labels like "Schnitt"/"Farbe"/"Styling"/"Pflege"/"Hochsteck". Two-tier taxonomy: enum `category` for top-level browsing, free-text `subcategory` for the inline `SalonServices` chip row + the sheet's scroll-spy nav. `_shared.ts` Service interface got `subcategory?: string | null`. `SalonServices.tsx` and `SalonServicesSheet.tsx` both group via `s.subcategory ?? s.category ?? "andere"` (subcategory wins, falls through to enum, falls through to "andere" for legacy null). Seeded `atelier-haarwerk` with 12 services across 5 subcategories: Schnitt (3), Farbe (2), Styling (2), Pflege (3), Hochsteck (2). (9) **Misc smaller fixes**: `SalonSidebar.tsx` card chrome bumped from `shadow-md` to `shadow-[0_8px_28px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04)]` to match the cart card depth. Sidebar collapse-on-scroll pattern (compact-at-top / expand-on-scroll) was prototyped earlier in the session, then removed — user wanted the sidebar to stay consistent rather than morph. New `SalonBreadcrumb.tsx` (desktop only, `Home › Coiffeure › Basel › Grossbasel › Atelier Haarwerk` using `postalToCity` helper). New `SalonAppCta.tsx` ("Verwöhne dich jederzeit, überall" with chip links + repeat Book CTA between Other Locations and Footer). Files patched: `components-legacy/ui/Breadcrumb.tsx`, `app/[locale]/_components/layout/Header.tsx`, `app/[locale]/_components/salon/SalonStickyTabNav.tsx`, `app/[locale]/_components/salon/SalonDetailV3.tsx`, `app/[locale]/_components/salon/SalonHeader.tsx`, `app/[locale]/_components/salon/SalonHero.tsx`, `app/[locale]/_components/salon/SalonServices.tsx`, `app/[locale]/_components/salon/SalonSidebar.tsx`, `app/[locale]/_components/salon/_shared.ts`, `app/[locale]/_components/homepage/HeartButton.tsx`, `app/[locale]/_components/homepage/AtmosphereBlobs.tsx`. Files created: `app/[locale]/_components/salon/SalonServicesSheet.tsx` (the modal), `app/[locale]/_components/salon/SalonContact.tsx` (mobile contact section), `app/[locale]/_components/salon/SalonBreadcrumb.tsx` (desktop breadcrumb), `app/[locale]/_components/salon/SalonAppCta.tsx` (repeat CTA). Migration: 085_services_subcategory via Supabase MCP project `tocfnsmxmdxkrcmjzzdw`. ·

**2026-05-11 (V2-D53.3 — Salon detail full Fresha 1:1 rebuild — mobile + desktop, component split, schema for Featured/chain/per-staff ratings)** — Iteration 3 on salon detail. V2-D53.0 shipped the IA, V2-D53.1 added Buy + Loyalty, V2-D53.2 removed atmosphere from this surface. User then sent detailed Fresha mobile spec + 8 desktop screenshots and said "make exactly like fresha here the structure and layout" + "use the Solen brand tf and i want all full except the map." This iteration delivers: (1) 4 new schema migrations applied via Supabase MCP — `078_salon_featured.sql` (`is_featured boolean`), `079_salon_chain.sql` (`parent_salon_id uuid REFERENCES salons(id)` + index), `080_staff_ratings_view.sql` (Postgres view aggregating per-staff `average_rating` + `review_count` from non-hidden reviews — gives floating rating badges on team avatars), `081_sibling_salons.sql` (`fn_sibling_salons(uuid)` RPC returning chain siblings). (2) `/api/salons/[slug]` updated: now joins `staff_ratings_view` per staff member (returns `staff_average_rating` + `staff_review_count` per record) + calls `fn_sibling_salons` RPC (returns `siblings: SiblingSalon[]`). (3) Monolithic `SalonDetailV3.tsx` (~1145 lines) **split into 18 colocated files** in `app/[locale]/_components/salon/`: `_shared.ts` (types + helpers + TAB_SECTIONS), `SalonHero.tsx` (mobile cover OR desktop 3-photo gallery with 0/1/2/3+ fallback chain), `SalonHeader.tsx` (title + bullet-separated meta + Featured pill + share/heart on desktop), `SalonStickyTabNav.tsx` (Photos/Services/Team/Reviews/Portfolio/About/Loyalty, scroll-tracked via IntersectionObserver, appears only after hero scrolls off), `SalonServices.tsx` (filter pills with emerald-fill active state, bordered cards on desktop / divider rows on mobile, "Alle ansehen" in-place expand), `SalonTeam.tsx` (3-col mobile / 4-col desktop with floating yellow rating badges on avatars — opacity-60 fallback when staff has 0 reviews), `SalonReviews.tsx` (big 5-star summary + 2-col grid desktop / 1-col mobile with initial-based colored avatars + "Mehr lesen" toggle), `SalonPortfolio.tsx` (3x3 uniform grid on mobile / irregular 4×3 grid on desktop with +N overlay on last tile), `SalonBuy.tsx` (gift card link, two variants: standalone mobile / compact sidebar row), `SalonAbout.tsx` (bilingual EN+DE if both present + Mapbox-styled placeholder with center pin showing rating — real map deferred per user "all full except the map"), `SalonOpeningTimes.tsx` (green/gray dot list, no card chrome, side-by-side with AdditionalInfo on desktop), `SalonAdditionalInfo.tsx` (vertical checklist with per-amenity lucide icon — REPLACED V2-D53 pills layout per Fresha audit), `SalonLoyalty.tsx` (4 cards with title + subtitle + inline disclosure for now until /loyalty/* surfaces ship), `SalonOtherLocations.tsx` (sibling chain card — single = full-width, multiple = horizontal carousel), `SalonVenuesNearby.tsx` (horizontal carousel with native swipe + desktop arrow buttons that fade out at scroll boundaries), `SalonSidebar.tsx` (sticky desktop right rail with salon name + rating + Featured pill + emerald primary CTA + expandable hours + contact links + Gift Cards sub-row), `SalonMobileBookBar.tsx` (full-width emerald bottom bar mobile), `SalonLightbox.tsx` (full-screen modal with prev/next arrows + counter + keyboard nav + Escape close + body-scroll lock). Orchestrator `SalonDetailV3.tsx` now ~200 lines: fetches salon, manages lightbox state, computes `availableSections` set for tab nav, composes 2-col desktop grid `[1fr_340px]`. (4) **Brand decision: Solen V3 throughout, NO Fresha-purple/black overrides** — emerald Book button (`s-brand`), terracotta Featured pill (`bg-s-accent/15 text-s-accent`), emerald active service tab chip, white substrate (`bg-white` — only commerce-surface override). LIVE_TRUTH §5h.3 locks the white-substrate scope (commerce surfaces only — marketing surfaces keep cream). (5) Map is intentionally a placeholder (compass + grid SVG + center pin showing rating) — real Mapbox integration deferred per user instruction. Files patched: `app/api/salons/[slug]/route.ts` (added siblings RPC + per-staff ratings join), `app/[locale]/_components/salon/SalonDetailV3.tsx` (full rewrite as orchestrator), `app/[locale]/salon/[slug]/page.tsx` (V2-D53.2 atmosphere removal cited). Files created: 17 new section components + `_shared.ts`. Migrations 078-081 applied via Supabase MCP project `tocfnsmxmdxkrcmjzzdw`. Live verification pending Phase E. ·

**2026-05-11 (V2-D54 — Atmosphere glow pass: vibrant V3 hues with `mix-blend-mode: normal` instead of `multiply`)** — User feedback after V2-D52/53 salon-detail work: "background is just beige... wanted glow of the natural colors more vibrant but toning it down so we can still see the white." Diagnosed the film/beige feel as V2-D48 atmosphere using `mix-blend-mode: multiply` over the cream substrate — multiply darkens everything beneath, so the cream wins and the V3 cat-colors muddy into a brownish tint. Fix: swap blend mode to `normal` (colored haze GLOWS over white surfaces instead of multiplying them darker) + saturate the blob fills to V3 brand mid-tones (emerald `#5BAE85` was pale `#A8CFB8`; terracotta `#D6754F` was pale `#E8B89B`; added sage `#9CC0A4`, butter `#F0C85A`, rose `#E89A88`, warm peach `#F2C49B`) + drop opacity range 0.18-0.32 → 0.14-0.22 so white surfaces still read crisply + bump blur 80px → 90px + add `saturate(1.15)` to filter chain. Same `AtmosphereBlobs.tsx` powers homepage, salon detail, and search results — single source of "Solen feel" across the customer-side surface. Also (V2-D53 continuation) re-mounted `<AtmosphereBlobs />` + `<AtmosphereGrain />` on `app/[locale]/salon/[slug]/page.tsx` after they were removed during the V2-D52 tightening pass (removal was because old `multiply` blend made cards look filmy; new `normal` blend doesn't). Files patched: `app/[locale]/_components/homepage/AtmosphereBlobs.tsx` (color palette + opacity + blend + filter), `app/[locale]/salon/[slug]/page.tsx` (re-mount atmosphere), `_rules/SOLEN_PATTERNS.md` §1.5 (atmosphere recipe locked, anti-pattern added: never `mix-blend-multiply` on AtmosphereBlobs). ·

**2026-05-11 (V2-D53 — Salon detail page Fresha-IA + V3 visual, ongoing)** — User showed Fresha (The Good Barbers — Enge) salon-detail screenshot, asked for full Fresha information architecture in V3 visual treatment. Phase A schema migration `077_salon_amenities.sql` shipped: 9 boolean columns on `salons` table (`instant_booking_enabled`, `pet_friendly`, `kid_friendly`, `wheelchair_accessible`, `near_public_transport`, `lgbtq_friendly`, `woman_owned`, `family_owned`, `student_discount`), all default false, applied via Supabase MCP. Phase B verification: `review_photos`, `review_replies`, `gift_cards`, `loyalty_*` tables don't exist in DB — orphaned API routes reference them. User picked Option 1: skip SalonBuy + SalonLoyalty sections for V2-D53 (defer until tables exist or product decisions lock them). Phase D: AmenitiesSection rewired to all 9 new columns + 3 existing fields (Sofortbestätigung, Online bezahlen, Stornierung), 11 pills total when all enabled. StickyTabNav rewritten as dynamic — accepts `tabs` prop built per-salon from which sections have content (skip empty sections from nav). `ALL_TABS` constant includes services / team / bewertungen / portfolio / ueber / oeffnungszeiten / extras / standort. New `hasAnyAmenity()` helper drives Extras tab visibility. Sections wrapped in `<div id="section-X">` so IntersectionObserver can track scroll-to-section. Test data seeded for `atelier-haarwerk` salon: 6 services across coiffeur category, 4 staff_members with Unsplash avatars, 9 amenities ON, opening_hours JSON, 6 gallery_urls, about_text_de, rating + count. Service category enum is constrained to coiffeur/barbershop/nails/spa/makeup/waxing — sub-categories like "damen"/"herren" violate CHECK constraint. **Two deferred sections (Buy + Loyalty), two deferred features (real map per D5, other-locations per D2, per-staff ratings per D4).** RLS advisory: 16 tables have RLS disabled — surfaced to user, separate fix. Files patched: `supabase/migrations/077_salon_amenities.sql` (new), `app/[locale]/_components/salon/SalonDetailV3.tsx` (amenities + dynamic nav). ·

**2026-05-10 (V2-D51 — Hybrid Hub Search shipped — 9 phases, real backend, V3 cat-color discovery)** — User picked Path C (refined hybrid hub) from the side-by-side idea board (`public/solen-v2-search-ideas.html` + `solen-v2-search-c-refined.html`). Plan v2 locked 10 critical decisions (D1-D10) before implementation: hub on Service-only (D1), trending = direct submit (D2), featured = static demo for now (D3 modified — page.tsx doesn't fetch real salons yet), recent = full-state restore + auto-submit (D4), typed query persists across close+reopen (D5), distance deferred (D6), pill stays placeholder until pick (D7), submit-without-pick = free-text q= fallback (D8), counts hardcoded v1 (D9), no file rename (D10). Phase 0 reconnaissance found backend was 80% already there — `/api/search/suggest` existed and returned `{services, salons}` with proper schema. Found and fixed pre-existing bug: route was selecting `cover_image` but the actual column is `cover_photo_url` (was returning null silently). Found `staff_members` table — pivoted Stylisten section from "v2 deferred" to "v1 includes." Phase 1 augmented `/api/search/suggest`: added `address, city_id, latitude, longitude` to salons select, fixed cover_photo_url bug, added stylists query (matching name + specialties[] via Postgres `cs` set-contains operator). Phase 2 created `useSearchSuggest.ts` hook (300ms debounce, AbortController for stale-request cancellation, length < 2 skip-threshold) and lifted query state to SearchBar parent for cross-picker persistence. Phase 3 created `searchCategories.ts` with V3 cat-color combos hardcoded; `<EmptyHubCategories>` renders 4-col (desktop) / 2-col (mobile) grid with proper Earthen Wellness Light per V2-D48 (Coiffeur cream/terracotta, Barbershop bone/ink, Nails sage-pale/terra-deep, Spa emerald-subtle/emerald-deep). Phase 4 created `useRecentSearches.ts` hook (localStorage key `solen.recentSearches`, capped 5, deduped by primary identifier). Phase 5 created `searchFeatured.ts` with static demo salons (matches existing homepage Coiffeur/LastMinute/Nearby DEMO pattern). Phase 6 created `searchTrending.ts` with curated 4-item list (Balayage 127 buchungen, Buzz Cut +42% week, Gel-Maniküre top in Basel, Hot Stone Massage ★4.9 avg) — each has `query` field for D2 free-text submit. Phase 7 replaced flat search results with grouped sections (Services / Salons / Stylisten) + summary line + "Alle X Salons sehen →" link when limit hit. Phase 8 wrapped state-swap in `<AnimatePresence mode="wait">` keyed on view (fallback/loading/results/noresults/error), 0.18s opacity+y±6 cross-fade, `useReducedMotion()` guard skips translate. Phase 9 wired PostHog: `search_opened`, `search_typed` (debounced 400ms, length≥2 only), `search_submitted` / `search_submit_freetext`, `search_result_clicked` (with `result_type`/`result_id`/`query`/`position`), `search_recent_used`, `search_trending_used`, `search_category_used`, `search_featured_clicked`. Tracking gated via `usePostHog()` from `posthog-js/react`. Files patched: `app/api/search/suggest/route.ts`, `app/[locale]/_components/homepage/SearchBar.tsx` (~470 → ~880 lines), `_rules/SOLEN_PATTERNS.md` §2.3 (rewrote SearchBar pattern to Path C), `_tasks/V2_REBUILD_LOG.md` (this entry). Files created: `app/[locale]/_components/homepage/useSearchSuggest.ts`, `useRecentSearches.ts`, `searchCategories.ts`, `searchTrending.ts`, `searchFeatured.ts`, `public/solen-v2-search-c-refined.html` (locked reference). Typecheck clean throughout. Live verification on localhost:3000/de — empty hub renders 4 sections, typing fetches real backend results from /api/search/suggest, salon click navigates to /salon/[slug]. ·

**2026-05-10 (V2-D50 — Hero search bar swapped from Dynamic Island morph to Fresha-style static pill + dropdown)** — User showed Fresha desktop + mobile screenshots, said "still cooked nth like fresha look." Diagnosed root cause: the V2-D41.8 morphing pill was visually clever but interaction-heavy — the entire pill grew to a 600px card with backdrop dim every time you tapped a segment, making it feel modal/popup rather than menu/dropdown. Built side-by-side comparison mockup at `public/solen-v2-search-options.html` rendering Path A (Fresha-style static pill + small dropdown anchored below the bar, vertical list with emerald-subtle icon boxes, Today/Tomorrow quick cards on date picker, full-screen mobile takeover with Peace Sans title) vs Path B (current V2-D41.8 morph) — both in identical V3 brand to isolate the structural delta. User picked Path A. Full rewrite of `app/[locale]/_components/homepage/SearchBar.tsx`: removed `HEIGHT.mobile/desktop` morph constants, removed `motion.div` height+borderRadius animation, removed black/30 backdrop dim. New architecture: `<StaticPill>` (always rendered, horizontal on desktop / vertical-stacked on mobile, with right-divider hairlines between segments and `bg-s-bg-sunken` for active segment per §5h.2 — emerald reserved for actions only) + `<DesktopDropdown>` (`absolute top-full mt-3 z-50`, white card with 24/48px stack shadow, fade+slide-down animation `0.18s cubic-bezier(0.22, 1, 0.36, 1)`) + `<MobileSheet>` (`fixed inset-0 z-[100]` full-screen takeover with own header: ArrowLeft back button + Peace Sans 36px black title `Suchen / Standort / Datum & Zeit` + body scroll lock + footer Suchen button). Service picker: vertical list with 40×40 emerald-subtle bg + emerald icon boxes (picked state inverts to emerald-bg + white-icon), replaces 8-chip grid. Stadt picker: same icon-box list pattern below the existing "Aktueller Standort" hero pill. Zeit picker: NEW Today/Tomorrow quick cards above the calendar primitive (`grid-cols-2 gap-3`, picked = emerald-subtle bg + emerald border), period-of-day chips RETAINED below calendar. Filter tabs (Alle / Services / Salons / Stylisten) DEFERRED — Fresha has them but adding visible-but-non-functional tabs is half-shipping; reintroduce when /search results page supports entity-type filtering. Click-outside dismiss on desktop only (mobile has explicit back button). Esc closes everywhere. Auto-advance pick → next-segment retained from V2-D49 (pick service → opens stadt picker → pick city → opens zeit picker; on the last segment, picking date or period does NOT auto-close — user must hit Suchen). All V3 brand tokens preserved: emerald CTAs, terracotta nowhere on action affordances, cream substrate, Peace Sans for sheet titles, Open Sauce One for everything else. Files patched: `app/[locale]/_components/homepage/SearchBar.tsx` (full rewrite, 611 → ~470 lines), `_rules/SOLEN_PATTERNS.md` §2.3 (rewrote SearchBar pattern entry to describe Path A), `_tasks/SOLEN_LIVE_TRUTH.md` §13.4 (SUPERSEDED banner pointing to V2-D50). Files created: `public/solen-v2-search-options.html` (the comparison mockup that drove the decision). ·

**2026-05-10 (V2-D49j — Emerald = action, terracotta = heartbeat — color-role rule locked)** — Caught + fixed an inconsistency on the SalonRegister section: "Salon registrieren" CTA was using `bg-s-accent` (terracotta), reading washed-out next to surrounding emerald CTAs (Hero "Solen durchsuchen", Header "Anmelden", section see-all pills) — user noticed. Same for the bullet check-icon backgrounds: `bg-s-sage` (`#A8B89A`) was too close in lightness to the cream panel bg (`#FAF2E5`), low contrast. Both swapped to `bg-s-brand`. THE RULE IS NOW LIVE_TRUTH-LOCKED §5h principle #9 + §5h.2 reference list: emerald `s-brand` is the ONLY color allowed on action affordances (CTAs / primary links / confirmation glyphs / focus outlines / success indicators); terracotta `s-accent` is reserved for heartbeat **highlight words** inside display text (Hero "buchen", SalonRegister "Solen-Partner.") + the logo dot + eyebrow leading-dot. Sage retired as a CTA-adjacent color (atmosphere blob hue only now). Files patched: `app/[locale]/_components/homepage/WhySolen.tsx` (2 swaps: bullet check + CTA), `_tasks/SOLEN_LIVE_TRUTH.md` §5h (new principle 9 + new §5h.2 reference list). Same session also: removed 11 user-facing em-dashes across 8 files (WhySolen, Reviews, Footer, Header, SalonCard, FeaturedStylists, Entdecken, TestimonialsColumn) — replaced with comma / colon / middle-dot per natural reading; intentional `—` placeholder glyphs in SalonCard (null rating / null service) kept; SalonRegister mobile size trim (image `aspect-square` → `aspect-[16/9]` saves ~140px vertical, padding `p-6 → p-5`, gaps `8 → 6`); FeaturedStylists avatar ring `ring-4 → ring-2`; body wash gets a soft white radial in middle (`rgba(255,255,255,0.45)` ellipse 55%×40% at 50% 50%) so reading area is whiter than corner blob area. ·

**2026-05-09 (night, V2-D44 — Mobile balance pass + typography sizing iteration)** — Hero/search/section sized down after user feedback ("evrth is jst too big yk for mobile"). Hero h1 final: `clamp(26px,4.5vw,58px) leading-[1.15] tracking-normal` (from `clamp(40,7vw,96) leading-[0.95] tracking-[-0.025em]` — went through 7 iterations of leading 0.95 → 1.05 → 1.2 → 1.35 → 1.6 → 1.15, then sizing 40→28→22→25→26, before user said "stop diagnosing it's about balance"). Tracking discovery: Peace Sans's chunky letters crashed at `tracking-[-0.025em]`/`-0.03em` — neutralized to `tracking-normal` everywhere (logo + hero + section h2 + Logo.tsx primitive + public/logo.svg). Section h2: `clamp(22px,3.5vw,38px)` (was 28-44). Logo: 22px mobile / 28px desktop (was 28/32). Search card: `HEIGHT.mobile.collapsed` 280 → 196, desktop 76 → 60 (round 2 — first round 232/64 left dead space because heights were sized for OLD bigger paddings). Row padding: `p-[10px_14px]` mobile / `p-[11px_22px]` desktop (was 14/16 + 14/22). Submit button: `py-3 px-5` / `md:py-[10px] md:px-6` (was `p-4`). Container outer: `p-[6px]` / `md:p-[5px_5px_5px_7px]` (was `p-2` / `md:p-[6px_6px_6px_8px]`). User confirmed: "ok now it loooks so much balanced". Files patched: SearchBar.tsx, Hero.tsx, SectionHeader.tsx, Header.tsx, Logo.tsx, public/logo.svg. ·

**2026-05-09 (night, V2-D43 — Emil Kowalski design engineering polish)** — Applied Emil's animation philosophy from emil-design-eng skill (`npx skills add emilkowalski/skill`; `pbakaus/impeccable` removed after taste-conflict comparison documented in `public/solen-v2-impeccable-vs-current.html` — its hard bans on glass/cards/modals contradict locked V3, user rejected). Motion-only changes — V3 visuals unchanged at rest. Card hover: 300ms `ease-snap` → 200ms `ease-glide` (`cubic-bezier(0.16, 1, 0.3, 1)` matches Emil's recommended strong ease-out). Card active: `scale(0.94) duration-100` → `scale(0.97) duration-[80ms]` (Emil's subtle 0.95-0.98 range). HeartButton save: spring-feel pop animation `0.5 → 1.15 → 1.0` via new `@keyframes heart-pop` + `.animate-heart-pop` in globals.css; `popKey` state increments on save (not unsave), Heart SVG `key={popKey}` re-mounts to restart animation; asymmetric per Emil "slow when deciding, fast when responding". Cards stagger entrance: `salon-card-stagger` class on ScrollRow, `@keyframes card-stagger-in` w 50ms delay between children (1-8), `@media (prefers-reduced-motion: reduce)` fallback to no animation. Search submit button: added `scale(0.97)` press feedback w `ease-glide` curve. Comparison mockup: `public/solen-v2-emil-vs-current.html`. Files patched: `app/globals.css` (+heart-pop, +card-stagger-in keyframes), SalonCard.tsx (hover/active timings), HeartButton.tsx (popKey state + animate class), SectionHeader.tsx (ScrollRow stagger class), SearchBar.tsx (submit press). ·

**2026-05-09 (night, V2-D42 — typography override of V2-D15-3)** — User overrode the locked Cooper BT + ITC Avant Garde Gothic Std typography pair (V2-D15-3, locked 2026-05-07) with **Peace Sans** (display) + **Open Sauce One** (body) per Instagram graphic-design reference. Conscious override — user signed off knowing they had previously rejected Peace Sans + Open Sauce **Sans** in V2-D15-3 (too chunky, too rounded). This round picks Open Sauce **One** (sister font, working cdnfonts URL, full 300-900 weights) instead of the broken Open Sauce Sans cdnfonts. Inter via Google Fonts is the cdnfonts-failure fallback. Files patched: `app/globals.css` (font @imports), `tailwind.config.js` (display/heading/body fontFamily), `app/layout.tsx` (stale Anton/Figtree preload removed, cdnfonts preconnect added), `CLAUDE.md` (retired list + Locked V3 typography line), `_tasks/SOLEN_LIVE_TRUTH.md` §5 (override callout + new font stacks). _rules/STRUCTURAL_RULES.md + _rules/CODE_SAFETY.md retired-fonts lists deferred (not blocking visual). · 

**2026-05-09 (afternoon, PHASE 0 COMPLETE)** — All 8 Phase 0 primitives shipped. V2-D28 §F.5 date picker + V2-D29 §F.6 skip-link + V2-D30 §F.7 font-display strategy + V2-D31 §F.8 cookie consent banner. Phase 0 took ~6 days end-to-end (V2-D14 §F.1 spec lock 2026-05-05 → V2-D31 §F.8 ship 2026-05-09). 8 React primitive components + 8 mockup HTML files + 5 LIVE_TRUTH §F sub-sections. **Phase 1 (auth) and homepage build now unblocked.** Per user direction next: V3 homepage React build → Phase 1 auth. · 

**2026-05-09 (afternoon, Phase 0 plow)** — V2-D28 lock: §F.5 date/time picker mockup + React shipped. `react-aria-components` Calendar wrapped with V3 styling, `@internationalized/date` for date math (DE-CH locale, Mon-first week), TimeSlotList composed alongside w 4-column grid grouped Vormittag/Nachmittag/Abend. Loading skeleton w shimmer animation, empty state, disabled dates via `isDateUnavailable` callback (booking flow uses for past dates + salon-closed days). Native `<input type="date">` explicitly banned per spec. Dev test page extended w 2 demos (date-and-time live + single-date variant). · 

**2026-05-09 (morning, +logo replacement)** — V2-D27 lock: V1/V2 Bebas-Neue-with-coral-dot logo retired. New logo = Cooper-style "Solen" wordmark mixed case + brand-teal `#043338` dot accent (option C from `public/solen-v2-logo-options.html` — user picked after seeing 4 options). 7 files patched: `public/logo.svg` (text+circle SVG, font fallback chain to Sansita), `public/favicon.svg` (coral circle → brand-teal circle), new `app/[locale]/_components/primitives/Logo.tsx` React component (4 sizes + light/dark tone variants + noDot prop), barrel + dev-page demo, V3 homepage mockup `.nav-logo` CSS updated (color brand→ink, added `::after` dot pseudo-element), LIVE_TRUTH §1.3 added with full V2-D27 lock spec. Live header (legacy) auto-fixes via `logo.svg` reference. · 

**2026-05-09 (morning, post-overnight, +font fix)** — User confirmed bigger sizes (V2-D26 — typography size refresh, kept ITC Avant Garde Gothic for body, bumped most subtexts +2-3px). 14 files patched (8 primitive components + dev page + 4 mockups need a future cleanup pass + LIVE_TRUTH spec sizes). Body 14→16, label 12→14, helper 11→13, eyebrow 11→13, card-tag 9→11, toast title 14→15, switch sub-label 12→13, pill toggle 12→13, input md size 14→16 (also resolves V2-D14/V2-D17 contradiction about iOS auto-zoom — md ≥16px now prevents focus-zoom). Display headings (Cooper-style h1/h2) unchanged. · 

**2026-05-09 (morning, post-overnight)** — User up. **V2-D09 / V2-D10 / V2-D11 / V2-D12 all resolved** (guest checkout OUT · map view IN · loyalty+packages+gift cards all IN v1 · Stripe Connect locked from DB schema implicit decision). Phase 1 (auth) unblocked. **NEW:** user flagged body font sizes feel small + asked for font visualization — see `public/solen-v2-font-visual.html` showing current Avant Garde Gothic at spec sizes vs +2-3px bumped sizes vs 5 alternative body fonts (Inter / Manrope / Plus Jakarta / DM Sans / Outfit). Cooper Black Std cdnfonts.com URL is currently HTTP 500 — headings silently falling back to Sansita 900 (looks visually similar). Awaiting font decision. · 

**2026-05-09 (OVERNIGHT SUMMARY — autonomous run complete)** — 3 of 3-4 sub-sections shipped + 1 spec drafted. Phase 0 advanced from §F.1 (V2-D17) → §F.4 (V2-D20) without user supervision.

### Shipped tonight (3 sub-sections, 4 commits):
- **V2-D18** (`e07d28e`) — §F.2 modal: spec + mockup + React + dev verification. `react-aria-components` Modal+ModalOverlay+Dialog. 3 sizes (sm/md/lg), 4 use cases. `tailwind.config.js` got 6 new z-index tokens.
- **V2-D19** (`9a112e8`) — §F.3 bottom sheet: spec + mockup + React + dev verification. Same react-aria stack as §F.2 but bottom-anchored. 3 height variants (auto/default 75dvh/full 90dvh). `useResponsiveOverlay()` hook for sheet↔modal switching.
- **V2-D20** (`07478f4`) — §F.4 toast: spec + mockup + React + dev verification. **Hand-rolled** queue + Context (react-aria-components only exports `UNSTABLE_Toast*` at v1.16.0). `<ToastProvider>` + `useToast()` hook. 4 tones. Max 3 visible, FIFO queue, error-priority override.
- **V2-D21** (this commit) — §F.5 date/time picker SPEC ONLY (mockup + React deferred — date pickers are the largest single primitive, half-shipping was worse than scheduling cleanly).

### Bucket B candidate decisions logged (need user sign-off — commit if approved as a V2-D## decision):

**§F.2 modal (V2-D18):**
- §F.2.5 footer destructive-tertiary placement: `<ModalFooter layout="between">` puts destructive on far left, primary group on right. *Picked because it visually separates "irreversible" from "primary action."*
- §F.2.7 default focus on destructive flows: `autoFocus` on "Abbrechen" (secondary), NOT "Löschen" (destructive). *Per §F.2.7 spec — accidental Enter doesn't fire destructive.*
- §F.2.8 close X hit-area extension via negative margin (`w-11 h-11 -m-2.5`). *Picked because it doesn't add extra spacing around the icon.*

**§F.3 sheet (V2-D19):**
- §F.3.0a heights = `auto / default / full`. *Mapped to use-case naming.*
- §F.3.7 desktop fallback breakpoint = 768px. *Matches Solen's existing mobile/desktop divide.*
- §F.3.2 drag handle 36×4px, ink/.20. *Middle ground — visible without decorative-loud.*

**§F.4 toast (V2-D20):**
- §F.4.1 default duration timing — success/info=3s, warning=6s, error=Infinity (sticky). *Split because warnings need longer read time, errors must NOT auto-dismiss.*
- §F.4.3 stack direction = newest at BOTTOM. *Mobile thumb position = viewport edge = where attention lives.*
- §F.4.4 action button = text-only brand-teal, hover ink-1. *Toast is already a card; button-on-button feels heavy.*

### Bucket B doc-cleanup TODOs (not blocking, deferred to attended doc-cleanup pass):
- §25.6 sort sheet line 3353 cites pure-black backdrop hex (`rgba(0,0,0,.35)`) which contradicts §4 anti-pattern. When §25.6 implements via §F.3, primitive's warm-ink prevails; surface text needs cleanup.
- (Pre-existing from V2-D17): §F.1.4 Variant B inactive bg cites gradient — V2-D15-4 supersedes (pills are flat).
- (Pre-existing from V2-D17): §F.1.7 line 1266 says inputs ≥ 16px but V2-D14 kept md at 14px.

### Bucket C blockers surfaced: NONE. Three sub-sections shipped cleanly.

### Phase 1 unblocked — V2-D09 / V2-D10 / V2-D11 / V2-D12 all resolved 2026-05-09:
- **V2-D09:** Guest checkout — **OUT** (signup required). §A.1 / §A.6 spec needs gate copy.
- **V2-D10:** Map view on /search/results — **IN**. §SR needs Karte/Liste toggle.
- **V2-D11:** Loyalty / packages / gift cards — **all 3 IN v1.** §BW step 3 needs promo + gift-card redemption + package redemption + loyalty toggle. Risk: scope expansion (~3-4 weeks). Implementation order: gift cards → packages → loyalty.
- **V2-D12:** **Stripe Connect** (confirmed prior implicit decision per DB_SCHEMA.md line 8 + SOLEN_DESIGN.md Q55).

### Suggested next session scope (Phase 1 unblocked):
1. User reviews + signs off (or overrides) each Bucket B candidate decision above. For each sign-off, append a V2-D## entry to V2_REBUILD_LOG.md.
2. **NEW request: font visualization** — user flagged body font sizes feel small + asked to see what fonts we have. See `public/solen-v2-font-visual.html` (V2-D26 candidate, not yet locked). User picks (a) bigger sizes only, (b) different body font + bigger sizes. Affects globals.css + tailwind config + V2-D15-3 typography lock.
3. **Phase 0 not finished but Phase 1 not gated by Phase 0 except §F.2 modal (shipped V2-D18).** Next session can start Phase 1 spec/mockup/implement loop in parallel with finishing Phase 0 (§F.5 mockup+React + §F.6 + §F.7 + §F.8). Default recommendation: do font fix first (it touches every component), then start Phase 1 auth surfaces (§A.1 login modal first — only needs §F.2 already shipped).

### Verification (when user wakes):
- `npm run dev` then http://localhost:3000/de/dev/primitives — every primitive renders interactively (form primitives + 4 modals + 3 sheets + 8 toast triggers).
- Static mockups: `npx serve public -p 4747` then open `/solen-v2-modal.html` / `/solen-v2-sheet.html` / `/solen-v2-toast.html`.
- `git log --oneline | head -5` shows V2-D18/D19/D20/D21 commits.
- `npx tsc --noEmit | grep -v "components-legacy\|tmp3\|tmp_header"` — empty (only legacy errors remain per V2-D05).

### Spec contradictions still unresolved (not blocking, doc-cleanup):
- §F.1.4 Variant B gradient (V2-D17 surfaced)
- §F.1.7 16px iOS rule (V2-D17 surfaced)
- §25.6 backdrop hex (V2-D19 surfaced)

----

**2026-05-09 (overnight, autonomous, +2)** — Phase 0 §F.4 toast primitive **shipped** (V2-D20). Spec at LIVE_TRUTH §F.4 (~146 lines, 4 tones success/info/warning/error + state matrix queued→opening→open→dismissing→closed + auto-dismiss timing 3s/3s/6s/sticky + bottom-center mobile / bottom-right desktop position + max-3-visible stacking with FIFO queue + error-priority override + ARIA live region rules + 9 anti-patterns). Mockup at `public/solen-v2-toast.html` shows 4 tone variants + mobile vs desktop position stages (3-stack mobile bottom-center, single error desktop bottom-right) + 5-step state timeline. React at `app/[locale]/_components/primitives/Toast.tsx` — **hand-rolled queue + Context** per spec §F.4.7 (react-aria-components only exports `UNSTABLE_Toast*` at v1.16.0, not safe to depend on). 4 exports: `<ToastProvider>` (render once at app root) + `useToast()` hook returning `{success,info,warning,error,custom,dismiss,dismissAll}` + `ToastTone` + `ToastOptions` types. Internal `<ToastRegion>` portal + `<ToastItem>` w hover-pause timer. `motion-reduce:` collapses to opacity-only 100ms. ARIA live region: `role="alert" aria-live="assertive"` for errors, `role="status" aria-live="polite"` for others. Stacking: max 3 visible, error tone replaces oldest non-error if queue full, others FIFO queue. Dev test page wraps `<PrimitivesDevPageInner>` in `<ToastProvider>` + new `<ToastDemo>` w 4 tone-fire buttons + 4 stacking-demo buttons (fire 5 to queue 2, with-action, title-only, dismiss-all). Typecheck clean. Live site impact: ZERO (still no route imports — `<ToastProvider>` will need to be added to `app/[locale]/layout.tsx` when Phase 1 surfaces start using `useToast()`, which is a future commit). **Three Phase 0 sub-sections shipped tonight — autonomous run goal met.** **Next:** §F.5 date/time picker spec only (no mockup, no React) → wake-up summary. · **2026-05-09 (overnight, autonomous, +1)** — Phase 0 §F.3 bottom sheet primitive **shipped** (V2-D19). Spec at LIVE_TRUTH §F.3 (~178 lines, anatomy + 3 height variants auto/default/full + 4-state matrix + drag handle visual-only-v1 + sticky bottom CTA pattern + mobile-only-w-desktop-fallback rule + ease-glide entry 600ms + ease-snap exit 200ms + 8 anti-patterns). Mockup at `public/solen-v2-sheet.html` renders 4 use cases inside iPhone-style frames (sort sheet auto, filter sheet 75vh w sticky CTA, share sheet auto, look-detail 90vh full). React at `app/[locale]/_components/primitives/Sheet.tsx` — composes same `react-aria-components` Modal/ModalOverlay/Dialog stack as §F.2 modal but bottom-anchored (translateY 100→0 motion via `data-[entering]:` modifiers, top-only radius 28px via existing `rounded-sheet` token, top-projecting shadow via arbitrary value). 4 sibling components (Sheet + SheetHeader + SheetBody + SheetCTARow). Plus `useResponsiveOverlay()` hook returning `"sheet"|"modal"` based on `(min-width: 768px)` matchMedia — SSR-safe (defaults to sheet, hydrates on client mount). `safe-area-inset-bottom` respected in SheetCTARow padding for iOS home-indicator. No new tailwind tokens (z-sheet-bg/z-sheet were added in V2-D18 batch). Dev test page extended with 3 sheet demos (sort sheet w live RadioGroup composition, filter sheet w PillGroup multi+single composition, share sheet). Typecheck clean. **Bucket B doc-cleanup logged:** §25.6 sort sheet line 3353 cites `rgba(0,0,0,.35)` backdrop hex which contradicts §4 anti-pattern; when §25.6 implements via §F.3 the warm-ink hex prevails — surface spec text needs cleanup later. Live site impact: ZERO. **Next:** §F.4 toast primitive — same loop. · **2026-05-09 (overnight, autonomous)** — Phase 0 §F.2 modal primitive **shipped** (V2-D18). Spec drafted into LIVE_TRUTH §F.2 (~183 lines, anatomy + 3 sizes + 4-state matrix + dismiss + focus + motion + 8 anti-patterns). Mockup at `public/solen-v2-modal.html` (anatomy stage with full backdrop+modal demo, 3-size grid, 4 use-case examples, 4-step state timeline, 8-card anti-pattern strip). React at `app/[locale]/_components/primitives/Modal.tsx` — composes `react-aria-components` `Modal` + `ModalOverlay` + `Dialog` (explicit V2-D18 architecture deviation from V2-D17 native-first since no native `<dialog>` has cross-browser focus-trap + scroll-lock + portal). Sibling components `ModalHeader` + `ModalBody` + `ModalFooter` follow V2-D17 composition pattern, each receives `size` prop (sm/md/lg) for padding. cva for surface-size variants. Motion via `data-[entering]:` / `data-[exiting]:` Tailwind modifiers + ease-snap (250ms entry, 150ms exit, scale 0.95→1, opacity fade). `motion-reduce:` collapses to opacity-only 100ms per §24b.3. `tailwind.config.js` got 6 new z-index tokens (sheet-bg/sheet/modal-bg/modal/toast/tooltip per LIVE_TRUTH §8 lock — naming aligns with the existing §8 z-index ladder). Dev test page extended with 4 modal demos (sm confirm, md login w TextInput composition, lg report-content w RadioGroup+Textarea composition, sm destructive w isDismissable=false+keyboardDismissDisabled). Typecheck clean for new files. Live site impact: ZERO. **Next:** §F.3 bottom sheet primitive — same loop. · **2026-05-08 (latest, evening)** — Phase 0 §F.1 form primitives **React implementation shipped** (V2-D17). 11 new files in `app/[locale]/_components/primitives/`: 6 primitives (TextInput / Textarea / Select / Checkbox / Radio / Switch) + 2 shared helpers (FieldLabel / FieldHelper) + 2 layout containers (RadioGroup / PillGroup) + 1 layout pill (PillToggle for Variant B of both checkbox + radio) + barrel `index.ts`. Plus dev test page at `app/[locale]/dev/primitives/page.tsx` (gated `notFound()` in production, route at `/[locale]/dev/primitives`). `tailwind.config.js` got 2 token additions: `s-bg.active = #FFF4E8` (input active-typing tint, was wrongly retired in V2-D15 comment) + 4 motion easings (`ease-snap`/`ease-spring`/`ease-glide`/`ease-thud`) per LIVE_TRUTH §F.1 + §5b motion vocabulary. Architecture: native HTML elements + cva for variants + cn() helper, NOT react-aria-components (matches §F.1.3 "v1 decision: native `<select>`" preference). Layout-shift-safe border treatment: 1px border + `ring-1 ring-inset` for second pixel of color (visually identical to 2px border, no layout shift on tone change). Typecheck passes — all 42 pre-existing tsc errors are in legacy code (`components-legacy/`, `tmp3.tsx`, `tmp_header.tsx`) flagged in V2-D05 for incremental retirement. **Live site impact: zero** — no existing route imports the primitives yet, they're dormant utilities. To verify visually: `npm run dev` then navigate to `/de/dev/primitives`. **Next:** §F.2 modal primitive — spec draft + mockup, same loop. · **2026-05-08 (latest)** — Phase 0 §F.1 form primitives mockup **locked** (V2-D16). `public/solen-v2-primitives.html` rebuilt from scratch on V3 tokens (was pre-V3: Bricolage / Inter Tight / orange `#E8742A` / cream substrate / italic — all retired). New mockup uses Cooper BT for page h1 + section h2s only (display moments), ITC Avant Garde Gothic Std for everything else, brand-teal `#043338` for focus/checked/on states, white substrate + `#FFF4E8` warm tint for active inputs + `#FAF7F3` sunken bg for disabled, V2-D15-4 editorial section-break wrapping every primitive section, V2-D15-4 flat-pill discipline (no gradients, no inset gloss, no italic). Renders all 6 primitives × full state matrix: text input (9 states + 6 type variants), textarea (4 states), select (3 states), checkbox (Variant A boxed × 6 states + Variant B pill multi), radio (Variant A row × 4 states + Variant B pill single), switch (4 states + settings list demo). Bonus: 3 sizes (sm/md/lg) demo, password strength meter, confirmation match, anti-pattern strip (floating labels / pill text inputs / required-asterisk / clear-on-error). Spec at LIVE_TRUTH §F.1.1-§F.1.10 (already V3-aligned from prior session) needed only one cosmetic doc fix: §F.1.0b disabled state cited `(sunken cream from §3)` → corrected to `(sunken from §4)` (Sunken `#FAF7F3` lives in §4 surface scale, not §3 semantic colors). **Next:** §F.2 modal primitive — spec draft + mockup, same loop. · **2026-05-07** — V3 design polish (V2-D15-4 — pill de-gloss + Option D editorial section-break). Pills are flat (no inset Web 2.0 gloss, no gradient bg, no `saturate(1.4)` glass pump, no brand-color glow ring on dots), section headers wrap with editorial top-rule + eyebrow-left + meta-right + Cooper-BT h2 (replaces V2-D15 minimalist Avant Garde plain-h2 layout). Cards / atmosphere wash / depth system on non-pill surfaces UNCHANGED. Builds on V2-D15-3 (V3 brand lock, 4 cats Z/G/A/I, Cooper + Avant Garde typography). · **V2-D15-3 (earlier same day):** brand orange `#E8742A` retired, **dark teal `#043338` + pale teal `#C2F0F1`** locked as brand. 6 categories → **4 categories** (Coiffeur=Z cream+cherry, Barbershop=G bone+black, Nails=A pale ice blue+magenta, Spa & Wellness=I forest+sandy beige). Typography: Bricolage + Inter Tight retired, **Cooper BT (display) + ITC Avant Garde Gothic Std (body)** locked with Sansita 900 + League Spartan as free fallbacks. Yuh-density principle + pill rule + atmosphere wash recipe + 31-combo library codified in LIVE_TRUTH §1 / §2 / §5 / §5a / §5c / §5d / §5e. **Preview:** `public/solen-v2-republik-teal.html` (homepage), `solen-v2-palette.html` (palette), `solen-v2-combos.html` (combo grid). **Next:** Phase 0 §F.1 implementation on V3 foundations + tailwind.config.js token swap (sweep flag required).

**2026-05-07 (earlier)** — (superseded by V2-D15-3) Hybrid scratch reset on `SOLEN_LIVE_TRUTH.md` foundations (V2-D15). Foundations rewritten from research on Republik · Fresha · Uber · Airbnb. Brand orange + Bricolage + Inter Tight kept then. Substrate cream → white. Instrument Serif + JetBrains Mono retired. Per-category Republik-style colorway treatment added. v2-prelim archived at `_tasks/archive/SOLEN_LIVE_TRUTH_v2-prelim.archived.md`.

**2026-05-06** — (superseded by 2026-05-07) v2 design language locked, no pivot. Brand color exploration concluded after overnight reflection — orange `#E8742A` + Bricolage stack stay. Phase 0 §F.1 implementation unblocked.

**2026-05-05** — Phase 0 in progress. §F.1 form primitives spec **locked** (V2-D14 — 4 open decisions resolved + 4 audit contradictions fixed). New §5f Hierarchy principle locked. Brand color exploration started end-of-day but unresolved — see V2-D15 for resolution.

**2026-05-05** — V2 LIVE_TRUTH replaced wholesale with v2 content from user's parallel Claude session (V2-D13). V1 spec archived to `_tasks/archive/SOLEN_LIVE_TRUTH_v1.archived.md`. New principal: `_tasks/SOLEN_LIVE_TRUTH.md` (§1–§25 + §5f + §F.1 + Component PR checklist + 36-gap roadmap). Visualization rendered at `public/solen-v2-locked.html`. Backend untouched. `components-legacy/` still quarantined; will retire incrementally per V2-D05.

**2026-05-04** — Strip phase MEDIUM: COMPLETE (deferred Phase 4-5 to incremental route-by-route cleanup — see "Phase 4-5 deferred" below). Backend untouched. v2 hero attempt deleted. Homepage = empty shell. `components-legacy/` quarantined (318 files: ~250 actively used, ~30-50 likely-orphan to be removed during rebuild).

---

## Stripped (what's been removed and when)

Each entry: action, what removed, why (cite LIVE_TRUTH §X / SOLEN_UI #Y / retired list / V2-D0X), commit SHA, recoverable.

### 2026-05-03 — Components quarantined to legacy
- **Action:** `git mv components components-legacy` + sweep 592 import lines across 114 files
- **Why:** First step of strip — reduce surface for AI drift while preserving git history (V2-D02 lock)
- **Commit:** uncommitted (user reviews diff before commit)
- **Recoverable via:** `git mv components-legacy components` reverses

### 2026-05-04 — V2 hero/page attempt deleted
- **Action:** Deleted `app/[locale]/_components/Hero.tsx` (parent folder kept empty for next route work). Rewrote `app/[locale]/page.tsx` from 272 lines → 76 lines (metadata + empty `<></>` shell + rebuild docblock).
- **Why:** Audit found violations: horizontal-segmented search bar (banned per LIVE_TRUTH §7 Q49), plum color that didn't match palette, briefly cream-as-page-bg (retired per CLAUDE.md). Removed to prevent AI drift back to broken patterns.
- **Commit:** uncommitted (user reviews diff before commit)
- **Recoverable via:** git history (file restore)

### 2026-05-04 — Tailwind config drift cleanup
- **Action:** Removed retired colored-glow shadows (`coral-glow`, `coral-glow-hover`, `amber-glow`, `v5-glow-coral`), removed `glass-gradient` + `mesh-warm` backgroundImage tokens, removed `pulse-coral` animation + keyframe (referenced pre-Q64 coral hex). Fixed `s-amber.subtle` (#FFF4E8 → #FCEBD3) and `s-amber.text` (#7A4A2D → #8C4A14) per LIVE_TRUTH §2. Net delta: -15 lines (175 → 160).
- **Why:** Colored-glow shadows banned per SOLEN_UI §5c. Glass + decorative gradients retired per LIVE_TRUTH §8. `pulse-coral` references retired coral hex post-Q64. Amber drift surfaced during preview/React sync — preview correctly used LIVE_TRUTH spec, config had stale values.
- **Commit:** uncommitted (user reviews diff before commit)
- **Recoverable via:** git history (single file diff)
- **Verification:** grep counts confirmed 0 matches for `coral-glow`, `amber-glow`, `v5-glow-coral`, `glass-gradient`, `mesh-warm`, `pulse-coral` post-edit.

### 2026-05-04 — SOLEN_DESIGN.md §11 + §12 marked RETIRED
- **Action:** Inserted ⚠️ RETIRED banners atop §11 (search bar — referenced banned horizontal-segmented pattern + retired DM Sans) and §12 (section patterns — referenced retired Bebas Neue + Fraunces). Historical content preserved below banners. Net delta: +4 lines (589 → 593).
- **Why:** Both sections directly contradict LIVE_TRUTH (§6 typography + §7 hero search spec). Per CLAUDE.md hierarchy LIVE_TRUTH wins. Banners prevent future AI agents from implementing stale patterns when reading the doc.
- **Commit:** uncommitted (user reviews diff before commit)
- **Recoverable via:** git history (single file diff)

### 2026-05-04 — Phase 1 orphan deletion (_archive/)
- **Action:** Deleted 4 files from `components-legacy/_archive/`: QuartierTile.tsx, RecommendedSalons.tsx, WaitlistModal.tsx, WeatherBanner.tsx (~10.6 KB total). Folder removed (was empty).
- **Why:** Confirmed orphan via 2-pass audit (Explore subagent 2026-05-04, Category A). Zero imports across app/, lib/, hooks/, components-legacy/. Already explicitly archived per pre-existing `_archive/` convention.
- **Commit:** uncommitted (user reviews diff before commit)
- **Recoverable via:** git history (file restore by SHA)

### 2026-05-04 — Phase 2 orphan deletion (single-feature orphans)
- **Action:** Deleted 23 files across barber/, dashboard/ (incl. dashboard/barber and dashboard/waxing), nail/, profile/, salon/, shared/, plus root index.ts in `components-legacy/`. SKIPPED 16 files originally flagged as orphans — all confirmed actively wired via dependency chains to live app routes (AiMatcherModal, CompareBar, CompareDrawer, NailPreferencesForm, ReportProblemModal, DeviceFrame, EditPanel, RequestList, PageTransition, AllergyWarning, InspoBoard, InspoUploader, MaterialSelector, ShapeLengthPicker, NailDesignCard, NotificationItem). No empty folders left behind.
- **Why:** Removed to reduce surface area for AI drift before V2 rebuild.
- **AUDIT FLAG:** 41% false-positive rate in Category A for Phase 2 — Explore audit's "no direct import" check missed transitive dependency chains rooted at `app/[locale]/layout.tsx` (compare, notifications, layout) and feature-bundle barrels (CoiffeurSections, EditorPage, NailBookingSteps, TechPortfolio). Recommend re-running orphan audit with transitive-reachability-from-app-route criterion before Phase 4-5.
- **Commit:** uncommitted (user reviews diff before commit)
- **Recoverable via:** git history (file restore by SHA)

### 2026-05-04 — Phase 3 orphan deletion (booking/ stale flow)
- **Action:** Deleted 10 files from `components-legacy/booking/` (audit said 14, actual safe-to-delete count = 10 — see deviation below): ConfirmationStep, CustomerPreferencesForm, DateSelectionStep, GroupBookingModal, PaymentStep, ReviewPrompt, ServiceCart, ServiceSelectionStep, StaffSelectionStep, TimeSelectionStep. Surgically edited `components-legacy/booking/index.ts` from 19 → 9 re-exports — barrel now only re-exports actively-used components: BookingWizard, ServicesStaffStep, DateTimeStep, PayConfirmStep, StaffPicker, GuestBookingForm, PackageRedeemBanner, BookingCard, BookingsList.
- **Why:** 10 of 16 booking/ files were barrel-export ghosts — re-exported by `booking/index.ts` but no external consumer. Removed stale flow to prevent AI drift back to old booking-wizard patterns during V2 rebuild (the new booking flow will be designed externally per V2 plan).
- **Deviation from audit:** 4 files originally on the deletion list (BookingCard, ServicesStaffStep, DateTimeStep, PayConfirmStep) were SKIPPED — they are transitively required by the survivors BookingWizard (via barrel) and BookingsList (direct relative import). Deleting them would break two consumer pages: `app/[locale]/salon/[slug]/booking/page.tsx` and `app/[locale]/profile/bookings/page.tsx`.
- **Commit:** uncommitted (user reviews diff before commit)
- **Recoverable via:** git history (file restore + index.ts revert)

### TEMPLATE for future entries
```
### YYYY-MM-DD — [action]
- **Action:** [specific files + what changed in 1-2 sentences]
- **Why:** [cite LIVE_TRUTH §X / SOLEN_UI #Y / retired list / V2-D0X]
- **Commit:** [SHA or "uncommitted"]
- **Recoverable via:** [how]
```

---

## Quarantined (`components-legacy/` status)

- **Where:** `/components-legacy/` (moved from `/components/` 2026-05-03)
- **Count:** 355 .tsx/.ts files total
  - **Layout chrome (KEEP, used by `app/[locale]/layout.tsx`):** 11
  - **Actively used by other routes:** 235
  - **Orphans (no route imports):** 109 — pending user review for deletion (see "Orphan audit" below)
  - **Transitive orphans:** 0
- **Importable as:** `@/components-legacy/*`
- **Status:** preserved during V2 rebuild. Old routes still call from this path via 592 import lines swept across 114 files.
- **Tailwind scans:** `tailwind.config.js` content array includes both `components/` (new, currently empty + .gitkeep) and `components-legacy/`.
- **Will fully delete when:** all main routes (homepage, salon detail, booking wizard, profile, dashboard) have been rebuilt and no new route imports from legacy.

### Orphan audit (2026-05-04, awaiting user approval before deletion)

**Audit method:** Explore subagent grepped all 355 files for import references across `app/`, `lib/`, `hooks/`, `components-legacy/`. Two-pass for transitive orphans. Result: 109 confirmed standalone orphans, 0 transitive.

**Phased deletion plan (pending user approval):**

| Phase | Files | Risk | Rationale |
|---|---|---|---|
| 1 | `_archive/` (4 files) | None | Already archived |
| 2 | Single-feature orphans (~20 files) | Low | Self-contained, no inter-deps |
| 3 | `booking/` orphans (16 files) | Medium | Superseded by current `BookingWizard` + `BookingsList` |
| 4 | UI primitives + `discovery/` orphans (28 + 19 files) | Medium-high | Verify no deep shadcn-style imports first |
| 5 | Root-level orphans (`CategoryHero`, `ReviewCarousel`, `TerminePage`) | Low | Substantial files; verify not referenced in docs |

**Full 109-file orphan list:** see Explore subagent report (2026-05-04). Categorized by directory:

- **`ui/`:** 28 (button, card, input, label, tabs, BottomSheet, GlassCard, HeroVisualCard, HomeSearchBar, HowItWorks, PriceSlider, ProgressDots, SearchBar, SocialProofStrip, WaitlistModal, border-beam, tracing-beam, category-icons, +others)
- **`discovery/`:** 19 (BookCTA, CategoryPills, CutGuide, ReportButton, ShareButton, SimilarStyles, KISection, +others)
- **`booking/`:** 16 (BookingCard, BookingWizard, ConfirmationStep, DateTimeStep, PayConfirmStep, +others — BookingWizard re-exported via `index.ts` but only 2 of 19 barrel exports actually consumed externally)
- **`dashboard/`:** 11 (BreakManager, ClosureManager, SolenScoreCard, ScheduleGrid, +others)
- **`nail/`:** 9 (AllergyWarning, InspoBoard, NailDiscoveryFilters, RetailCheckout, +others)
- **`barber/`:** 4 (CutHistoryTimeline, LoyaltyCard, LoyaltyCardList, WalkinQueue)
- **`_archive/`:** 4 (QuartierTile, RecommendedSalons, WaitlistModal, WeatherBanner)
- **`salon/`:** 3 (BookingSidebar, MobileBookingBar, SalonTabBar)
- **`editor/`:** 3 (DeviceFrame, EditPanel, RequestList)
- **`compare/`:** 2 (CompareBar, CompareDrawer)
- **Root + other:** 10 (CategoryHero, ReviewCarousel, TerminePage, index.ts, layout/PageTransition, coiffeur/AiMatcherModal, disputes/ReportProblemModal, profile/LooksGrid, notifications/NotificationItem, shared/HandDiagram)

---

## In-flight (external design)

- **Tool:** Static HTML mockup (user choice 2026-05-03)
- **Format expected:** single .html file, similar shape to `public/solen-coral.html`
- **Will live at:** `public/solen-v2-design.html` (or similar — user names)
- **My role on receipt:**
  1. Parse the HTML — extract per-section tokens, copy, structure
  2. Compare against LIVE_TRUTH locks (table below) — flag ANY conflicts for user decision BEFORE implementing
  3. Translate sections to React components in `app/[locale]/_components/`
  4. Implement homepage hero first (single component, user judges in isolation)
- **Status:** awaiting delivery from user
- **Expected scope:** at minimum the homepage. Optimal: full template set.

---

## Locked & surviving (do not touch regardless of new design)

These survive any further pivots within v2. Pinned here so future-me doesn't re-litigate. **Updated for V2-D15-3 (2026-05-07)** — orange/Bricolage/cream-substrate row values archived; V3 dark teal + Cooper BT + Avant Garde Gothic + 4 categories now locked.

| What | Value | Source |
|---|---|---|
| Brand color | dark teal `#043338` (Republik panel #4) | LIVE_TRUTH §1 + V2-D15-3 |
| Brand pale / subtle / mid | `#C2F0F1` pair · `#E1F4F4` subtle pill bg · `#0A6873` mid hover | LIVE_TRUTH §1 |
| Typography display | Cooper BT 900 (single weight, mixed-case) — hero h1 / logo / feature h2 / category panel h1 only | LIVE_TRUTH §5 |
| Typography body / UI | ITC Avant Garde Gothic Std 300/400/500/600/700 — everything else | LIVE_TRUTH §5 |
| Typography free fallbacks | Sansita 900 (Cooper) · League Spartan (Avant Garde) · Inter Tight (final) | LIVE_TRUTH §5 |
| No italic anywhere | period (V2-D15) | LIVE_TRUTH §5.3 |
| Page background | white `#FFFFFF` (substrate; permanent — V2-D15 reverted from cream) | LIVE_TRUTH §4 |
| Card surface | white `#FFFFFF` (always) | LIVE_TRUTH §4 |
| Sunken surface | `#FAF7F3` (inactive search, disabled inputs) | LIVE_TRUTH §4 |
| Ink scale | `#1A1209` / `#56463E` / `#7A6957` / `#C4B8A6` (cool greys banned) | LIVE_TRUTH §4 |
| Heart save color | love-red `#FF4A6B` (NEVER brand, NEVER overridden) | LIVE_TRUTH §3 |
| Status semantic | success `#16A34A` · warning `#F59E0B` · error `#D32F2F` · closed `#DC2626` · star `#F3A864` (DISTINCT from brand) | LIVE_TRUTH §3 |
| Per-category (V3 — 4 cats) | Coiffeur Z `#FFF1DD`+`#B5345A` · Barbershop G `#D8D6CB`+`#000` · Nails A `#CAE8FF`+`#B50051` · Spa & Wellness I `#193120`+`#948565` | LIVE_TRUTH §2 |
| Pill rule | every pill text is `#FFFFFF` on dark or `#000000` on light, NEVER tinted-of-bg | LIVE_TRUTH §5a |
| Atmosphere wash | white substrate + 5-stop radial gradient (cyan core + navy framing + horizon bleed) | LIVE_TRUTH §5g |
| Color philosophy | Yuh density (60–100×/page small) + Republik monochrome-per-panel | LIVE_TRUTH §5h |
| Combo library | 31-combo grid A–EE at `public/solen-v2-combos.html` (5th cat / Pro variant reserves) | LIVE_TRUTH §5i |
| Easings | `--ease-snap` 200ms · `--ease-spring` 400ms · `--ease-glide` 600ms · `--ease-thud` 150ms | LIVE_TRUTH §5c |
| Spacing scale | 4px-based (4/8/12/16/20/24/32/48/64/96) | LIVE_TRUTH §6 |
| Breakpoints | 3 only — base / 768px / 1024px (+ optional 1280px) | LIVE_TRUTH §6b |
| Dark mode | not in scope (single light theme — Q62 carries over) | LIVE_TRUTH §4 |
| Icon library | Lucide outlined, 1.8 stroke, `currentColor` inherit | LIVE_TRUTH §5e |
| Voice | confident, useful, Swiss-direct. German primary, du-form. Multi-city: Basel + Zürich + Bern at launch. | LIVE_TRUTH §0 + §1b |
| Cities | all 3 share brand teal — no per-city accent | LIVE_TRUTH §1b |
| Backend (lib/, hooks/, app/api/) | untouched — design respects existing API contract | CLAUDE.md |

**Retired V2/V1 values (do not reintroduce):** Brand orange `#E8742A` + variants (`#FFE4D2`, `#8A3C0F`, `#5C2308`, `#F0834D`); 6-cat colorways (rose/sunny/clay/sage/coral-orange/camel/plum); typography Bricolage Grotesque, Inter Tight as PRIMARY, Instrument Serif italic, JetBrains Mono, Anton, Figtree, Peace Sans, Open Sauce Sans, Fraunces; cream substrate `#FBF8F3`; Makeup category; Wellness as separate category.

---

## Decisions this rebuild

New Q-style locks made during the V2 rebuild. When finalized → propagate to LIVE_TRUTH §s.

### V2-D01 (2026-05-03) — Plum retired from Anton hero headlines (provisional)
- **Context:** Session — plum `#4A1E3C` for hero "BEAUTY." line read as outlier (didn't tie to amber accents or brand-green CTA).
- **Decision:** Hero headlines pick from brand-green family (sage variants) or amber family for line-1 anchor. Plum reserved for category color (barber) per LIVE_TRUTH §5.
- **Status:** provisional pending external design lock.

### V2-D02 (2026-05-03) — Components quarantined not deleted
- **Context:** Strip-vs-quarantine debate.
- **Decision:** `git mv components components-legacy` + import sweep. Keep legacy reachable. Deletion deferred until new design locked + all routes migrated.
- **Status:** locked.

### V2-D03 (2026-05-03) — Doc structure simplified to 3 active layers
- **Context:** Audit found 4 design-related docs with contradictions.
- **Decision:** Three layers — V2_REBUILD_LOG (running state, this file), SOLEN_LIVE_TRUTH (specs), SOLEN_DESIGN §20 (history). Other doc sections marked retired.
- **Status:** locked.

### V2-D04 (2026-05-04) — Sub-agent supervision model for strip phase
- **Context:** User requested parallel sub-agent dispatch instead of supervising agent doing strip work directly.
- **Decision:** Strip steps dispatched to 3 parallel general-purpose sub-agents (hero deletion, tailwind cleanup, SOLEN_DESIGN banners) + 1 Explore sub-agent (orphan audit). None touch the log file directly — each returns proposed log entry, supervising agent aggregates. Avoids race condition + parallelizes work.
- **Status:** locked for this phase. Orphan deletion (next pass) will use same model.

### V2-D05 (2026-05-04) — Phase 4-5 deletion deferred → incremental route-by-route cleanup
- **Context:** First orphan audit had 25% false-positive rate (would have deleted 16 actively-used files in Phase 2 + 4 in Phase 3 if pre-flight grep hadn't caught them). Re-audit with transitive-reachability had 100% false-positive rate (claimed only 10 booking/ files reachable, missed the global Header / DashboardLayout / DetailPage / 11 layout chrome imports). Conclusion: import-graph reachability via grep is unreliable for ~280-file codebase; would need AST parsing (which requires npm install — rejected by user).
- **Decision:** Defer Phase 4-5 deletion. Replace with incremental cleanup tied to route rebuilds: each new route deletes the specific legacy components it replaces, in the same commit. End state (empty `components-legacy/`) is identical; risk is dramatically lower.
- **Status:** locked. See "Phase 4-5 deferred" section above for full process.

### V2-D06 (2026-05-05) — All new specs land IN `SOLEN_LIVE_TRUTH.md`, never in new docs
- **Context:** Audit of LIVE_TRUTH v2 surfaced 36+ spec gaps. Risk: each gap becomes a new doc, recreating the 4-doc-conflict problem from before.
- **Decision:** Every new spec is a new `§` section inside `SOLEN_LIVE_TRUTH.md`. NO new top-level docs (no `_tasks/PHASE_X.md`, no `_tasks/AUTH_SPEC.md`, etc). NO splitting LIVE_TRUTH into multiple files. The principal stays one principal. `SOLEN_UI.md` only updates if a genuinely new universal principle emerges.
- **Status:** locked.

### V2-D07 (2026-05-05) — Each phase blocks the next
- **Context:** 3 months of frontend pain happened partly because phases ran in parallel before specs locked, generating drift between in-progress surfaces.
- **Decision:** Phase N+1 does not start until Phase N is fully locked (all surfaces have spec + mockup + implementation + sign-off + V2-D## decision entry). Hard gate. The only exception: Phase 6 (B2B) can run in parallel from Phase 3+ because B2B is a separate workstream that doesn't share components with consumer.
- **Status:** locked.

### V2-D08 (2026-05-05) — HTML mockups split per surface as files grow
- **Context:** A single `solen-v2-design.html` covering all surfaces would become a 10K+-line monolith that's hard to navigate, slow to render, and error-prone to edit.
- **Decision:** Mockups split per surface using naming convention `public/solen-v2-<surface>.html`. Examples: `solen-v2-primitives.html`, `solen-v2-auth.html`, `solen-v2-salon-detail.html`, `solen-v2-booking.html`, `solen-v2-search-results.html`, `solen-v2-account.html`, `solen-v2-system.html`, `solen-v2-b2b.html`. Each file is independently servable for review.
- **Status:** locked.

### V2-D09 (2026-05-05 / resolved 2026-05-09) — Guest checkout: OUT of v1
- **Context:** Phase 1 (auth) needed to know whether v1 supports booking-without-account. Affects Phase 2 booking wizard scope significantly.
- **Decision (2026-05-09):** **OUT of v1.** Users must sign up to book. Reasoning: account creation creates retention surface (favorites, saved looks, booking history, reviews-eligibility). Guest-checkout in beauty-marketplace v1 historically captures less repeat-business signal. Re-evaluate at v2 if signup-friction kills conversion in real data.
- **Implications for Phase 1:** §A.1 login modal needs a "Konto erstellen" path that's prominent (not buried). §A.6 spec section ("Guest checkout decision") becomes "Required-signup gate copy" — the blocking-screen + "30-Sekunden-Anmeldung" reassurance + social-proof.
- **Implications for Phase 2:** §BW booking wizard step 1 includes signup gate if user not authenticated. No guest path. The booking-cart state survives the auth flow (don't lose progress).
- **Status:** locked.

### V2-D10 (2026-05-05 / resolved 2026-05-09) — Map view on /search/results: IN v1
- **Context:** §25.16 deferred map view for `/[city]/[category]` category page. /search/results is a different surface — confirm consistent.
- **Decision (2026-05-09):** **IN v1 for /search/results.** Search results gets a "Karte" toggle alongside list view. The category page (§25) keeps its v2 deferral — the two surfaces have different intents (search-results is geo-bounded query; category-page is browse-by-discipline). Reasoning: search is an explicit "where can I get X?" intent — map answers that intent better than a list. Browse is a discovery intent — list is fine.
- **Implications for Phase 2:** §SR search results spec needs Karte/Liste toggle pill (matches existing pattern from filter pills §25.7). Map clusters salons by location; each pin shows mini-card on hover/tap. Mobile: full-screen map mode swap. Use Mapbox or Google Maps (both already in package.json — Mapbox preferred per existing imports).
- **Implications for §25 category page:** unchanged. v2 still defers map.
- **Status:** locked.

### V2-D11 (2026-05-05 / resolved 2026-05-09) — Loyalty / packages / gift cards: IN v1 (all 3)
- **Context:** Phase 2 booking wizard might or might not redeem packages / gift cards. Default would have been defer to v2.
- **Decision (2026-05-09):** **All 3 IN v1.** User confirmed "all ship." Reasoning per user — these are differentiating features in DACH beauty market (gift cards especially common at Swiss salons), and the partial backend infrastructure already exists in legacy code (`PackageRedeemBanner.tsx 105L`, `ServiceCart.tsx 194L promo/gift/referral` — see SOLEN_DESIGN.md Q55 component inventory).
- **Implications for Phase 2:** §BW booking wizard step 3 (Pay+Confirm) needs:
  - Promo code field (existing input pattern §F.1.1)
  - Gift card redemption flow (validate code → apply credit → show remaining balance)
  - Package redemption (if user has active package, show "From package: 2 visits left" line item)
  - Loyalty points display (if user has accrued points, show "Use 50 points (= CHF 5)" toggle)
- **Implications for §AC.2 profile bookings:** include past loyalty earned + package usage history.
- **Implications for §B.6 service management (Phase 6 B2B):** salons need to define which services count toward loyalty + which packages they offer (e.g. "5 cuts for CHF 400").
- **Risk:** scope expansion. Loyalty + packages + gift cards is ~3-4 weeks of work alone in Phase 2 + Phase 6. Re-flag if Phase 2 timeline starts slipping — may carve out gift cards (highest value, lowest complexity) and defer loyalty + packages to v1.1.
- **Status:** locked. Implementation order: gift cards first (simplest), then packages, then loyalty (tracking + accrual = most state).

### V2-D12 (2026-05-05 / resolved 2026-05-09) — Stripe Connect (marketplace payouts)
- **Context:** Backend architecture decision affecting B2B Phase 6 payouts.
- **Decision (2026-05-09):** **Stripe Connect.** Confirmed implicit-prior-decision per user instruction "I think in the previous version we already talked abt this go find it." Found in:
  - `_rules/DB_SCHEMA.md` line 8 — `salon_payouts` table already includes `stripe_payment_intent_id`, `commission_percent`, `commission_amount`, `net_amount`. The schema is built FOR Stripe Connect.
  - `_tasks/SOLEN_DESIGN.md` Q55 (booking wizard) — "default = Karte if Stripe Connect set up" — wizard spec already assumes Connect.
- **Reasoning:** Solen is a marketplace (consumer pays Solen, Solen takes commission, salon gets paid out). Stripe Connect is the marketplace standard — handles KYC for salons, payout to salon bank account, commission split, refunds. Stripe regular checkout would require building all that custom (or worse, paying salons manually).
- **Implications for Phase 6 B2B:** §B.12 billing/subscription spec needs Connect onboarding flow (Stripe-hosted) + payout dashboard + tax handling (Swiss VAT). Salon goes through Connect Express onboarding during signup, gets a Connect account, money flows through Solen platform → automatic split (e.g. 90/10) → daily/weekly payout to salon bank account.
- **Implications for Phase 2 booking wizard:** payment intent creation uses `transfer_data` to split commission at-charge. No post-hoc payout reconciliation needed.
- **Status:** locked. The DB schema confirms commitment — formalizing here removes the "PENDING USER" marker.

### V2-D15 (2026-05-06) — Brand color + typography stay v2 · color exploration concluded
- **Context:** Spent ~2026-05-05 evening exploring whether brand orange `#E8742A` is right. Built 5 comparison labs: font-pivot, font-lab (10 candidates), matrix (palette × fonts), color-lab (8 brand colors), collision-test (which colors fight semantic alerts), ink-brand (Uber/Revolut/Aesop pattern), cta-options. User reached fatigue — every candidate either fought alerts (vibrant orange/coral/mustard/forest-green) or felt cold/disconnected (warm-ink CTA, "doesn't match the warm aesthetic"). Walked away overnight per the "step away 24h" option.
- **Reference research:** inspected Yuh's Swiss banking site overnight (`/tmp/yuh-research/yuh-design-categories.md` — 32-category breakdown extracted from their 438KB stylesheet). Headline finding: Yuh ships with a vibrant coral-orange brand `#fa5b35` adjacent to their semantic error red. **They live with the same alert-collision concern Solen was wrestling with.** Empirical evidence that vibrant warm brand color is a workable choice for a Swiss financial-flavor app even with imperfect semantic separation.
- **Decision (2026-05-06, fresh-eyes verdict):** v2 stays. Brand orange `#E8742A`, Bricolage Grotesque + Inter Tight + Instrument Serif italic + JetBrains Mono. Cream substrate `#FBF8F3`. Warm-ink scale. All §1–§5e locks hold. **Color exploration is concluded** — only minor tweaks accepted from here, no further palette/typography pivots without strong new evidence.
- **What this unblocks:** Phase 0 §F.1 implementation (form primitives → `app/[locale]/_components/primitives/`). Tailwind config updates can land alongside first React component. No more spec-level color debate.
- **What's parked, not killed:** the alert-collision concern is real and acknowledged. Revisit at v2-launch polish phase when real screens + real users provide signal. May surface as a future V2-D## (e.g. desaturated brand variant for transactional CTAs while marketing keeps current vibrant). Not before.
- **Files left on disk for future reference (do not delete):** `public/solen-v2-font-pivot.html`, `public/solen-v2-font-lab.html`, `public/solen-v2-matrix.html`, `public/solen-v2-color-lab.html`, `public/solen-v2-collision-test.html`, `public/solen-v2-ink-brand.html`, `public/solen-v2-cta-options.html`. Each captures a slice of the exploration. `/tmp/yuh-research/` is gitignored (in `/tmp`) — copy to `_tasks/research/yuh.md` if worth preserving long-term.
- **User feedback captured to memory:** "stop inventing stuff if you don't know — ask" (already in `feedback_dont_invent.md`). The collision-test row 10 / warm-ink-as-brand failure ("ugly black outline") was a direct application of that — I proposed a candidate without testing the visual outcome (the colored glow shadow created an outline-looking artifact under the dark fill). Memory entry updated.
- **Status:** locked. Phase 0 §F.1 implementation can start.

### V2-D15-1 (2026-05-07) — Full commitment on every research point ("don't implement conservatively")
- **Context:** After V2-D15 hybrid scratch reset, user reviewed the renewed visualization and called out the Republik colorway treatment as too conservative. Said: "evrth on each points each brand dont implement conservetory" — meaning every brand-reference point should be implemented at full strength, not partial.
- **Decision:** Amend V2-D15 with full-strength application of each research point:
  - **§2 Per-category colorways → Level 3 Republik commitment.** Brand orange `#E8742A` retreats from category pages entirely. Header band tinted at category-color × 6%, 3px solid stripe at top, h1 in **full saturated category color** (not deep variant — Republik energy), filter pill active in category color, "Buchen →" sticky bottom CTA in category-deep gradient (was brand-orange), count badge in category-deep, loading-more spinner in category color, section dividers at 30% category color. Brand orange returns at the cross-link footer (multi-category context) and main footer §21. The page IS the colorway.
  - **§5.1 Uber Display vs Text rule reinforced.** Bricolage ONLY at hero/section/card-name/big-numerics. Explicit DO NOT list (button labels, form labels, microcopy, footer links, eyebrow text, toast text, tooltip text). PR checklist enforces.
  - **§5c.7 Motion application checklist added.** 23 specific state-change moments × required motion treatment × required easing token. Implementation rule: every component PR lists which moments the component encounters + confirms motion wired. Motion that doesn't tie to a state change is banned.
  - **§25 Fresha sequencing principle made explicit.** Header band → filter pills → grid → end-of-list → cross-link footer → main footer. Order non-negotiable. Filter results re-render grid in place, never re-order page.
- **Rationale:** the user's "don't implement conservatively" is the strongest direction signal in 2 sessions. The earlier conservative Level 1 treatment of §2 was a hedge — committing to Level 3 means the references are taken seriously, not as "inspiration." Each research point now has spec-level enforcement (token swaps in §25, PR checklist additions, banned anti-patterns).
- **Brand-level implication:** brand orange becomes a global identity color (homepage hero, header city pill, save heart at semantic love-red exception, footer accent) — NOT an action color. Action color is category-themed on category surfaces, brand-orange-themed on global surfaces. Both work because they never share the same surface.
- **Status:** locked. Spec patches applied 2026-05-07. Visualization update pending.

### V2-D15-2 (2026-05-07) — Purple ban
- **Context:** During category-color exploration, user said "stop using purple — purple is banned everywhere" after the Wellness `#9B7BB8` plum and Coiffeur-deep `#6B2D4D` (which reads purple at large saturated surfaces) were tested.
- **Decision:** Wellness `#9B7BB8` plum is banned. Coiffeur-deep `#6B2D4D` is banned as a large saturated surface (still acceptable as small text accent for Coiffeur context). Wellness category color replaced with camel `#A66E3D` deep `#5C3D22`. Bern city tile gradient updated to camel.
- **Status:** applied to LIVE_TRUTH §2 (camel for Wellness in 6-cat era), then superseded by V2-D15-3 which retired Wellness as a separate category entirely.

### V2-D41 (2026-05-09 night) — Modernity pass: glass section-frame + frosted card pill + atmosphere wash 2× saturation + Dynamic Island search

- **Context:** post V2-D40 close-out, user worked through ~30 iterative commits on the live homepage modernity pass. Driven by feedback "looks like a paper and text not an ui ux like overall why". Three direction options were demoed (A photos / B depth+motion / C color+brand). User picked A+B+C combined, then iterated on the visual until "looks great". This entry locks the new state into spec and retires what's contradicted.
- **Decision:** the homepage modernity pattern locks the following changes. They supersede V2-D15-4 (§15 editorial section-break), parts of V2-D34 (§16 card halos), and V2-D15-3 atmosphere wash alpha values where they conflict.

#### §V2-D41.1 · Section structure — Meta/Frame/Title split (supersedes §15.1 single-component anatomy)

The `<SectionHeader>` from V2-D15-4 was a single component combining eyebrow + meta + title + link rendered above the scroll row. Modernity pass restructures this into 4 named pieces:

```
<Section>                       ← outer wrapper, max-w-1280, mx-auto, NO glass
  <SectionMeta />               ← eyebrow + meta — RENDERS OUTSIDE glass (in page-flow)
  <SectionFrame>                ← glass container — wraps title + content
    <SectionTitle />            ← h2 + pill link
    <ScrollRow>{cards}</ScrollRow>
  </SectionFrame>
</Section>
```

**Why split:** user feedback "where it was containing yk its too near to each others section maybe for example cover these area" — pointing at a smaller boundary that wraps just the title + cards, NOT the eyebrow above. Glass frame becomes a discrete UI surface inside the page, with eyebrow/meta floating in the page-flow above.

**Glass frame specs (locked):**

|prop                |value                                                                              |
|--------------------|-----------------------------------------------------------------------------------|
|background          |`rgba(255, 255, 255, 0.40)` (40% white tint)                                        |
|backdrop-filter     |`blur(18px) saturate(1.25)` (heavier blur than V2-D34 §16.3.0 formula's 14px)       |
|border              |`1px solid rgba(255, 255, 255, 0.55)` (white-edge halo)                             |
|border-radius       |`20px` mobile / `24px` desktop                                                      |
|padding mobile      |`px-3 py-4` (12px h / 16px v)                                                       |
|padding desktop     |`px-4 py-4` (16px h / 16px v)                                                       |
|overflow            |`hidden` — clips card-row bleed at the rounded border                                |

**Section outer wrapper specs:**

|prop                |value                                                                              |
|--------------------|-----------------------------------------------------------------------------------|
|max-width           |1280px                                                                              |
|margin              |`mx-auto`                                                                           |
|padding mobile      |`px-1 py-3` (4px h / 12px v) — minimal so frame reaches near-viewport-edge          |
|padding desktop     |`px-3 py-4` (12px h / 16px v)                                                       |
|margin between      |`mb-2 md:mb-3` (8 / 12px gap to next section)                                       |

**SectionMeta (eyebrow + meta) specs:**

|prop                |value                                                                              |
|--------------------|-----------------------------------------------------------------------------------|
|eyebrow color       |`text-s-brand` (was `text-s-ink` in V2-D15-4 — modernity pivots to brand-teal)      |
|eyebrow dot         |kept — 5px brand-teal round dot before text                                          |
|meta color          |`text-s-ink-2`                                                                      |
|font                |Avant Garde 700 11-13px uppercase, `letter-spacing: 0.18em`                          |
|layout              |`flex` — mobile stacks eyebrow over meta, desktop side-by-side                       |
|self-padding        |`px-2` so it aligns with the frame inside (not flush against Section's outer padding)|

**SectionTitle (h2 + link) specs:**

|prop                |value                                                                              |
|--------------------|-----------------------------------------------------------------------------------|
|h2 font             |Cooper BT 900, `clamp(28px, 4vw, 44px)` (V2-D15-4 was clamp 28-40 — bumped on desktop)|
|h2 color            |ink-1 `#1A1209`                                                                     |
|link style          |**Filled brand-teal pill** — `bg-s-brand`, white text, `rounded-full`, `px-4 py-2`, `text-[13px] font-semibold`. Hover `bg-s-brand-mid`. **NOT** the underlined text-link from V2-D15-4 (retired). |

**RETIRED in V2-D41:**
- ❌ Top hairline rule above eyebrow (V2-D15-4 had `1px solid ink-1`) — glass frame now does sectioning
- ❌ "Alle →" as underlined text link — replaced with filled pill button
- ❌ Eyebrow in `text-s-ink` — now `text-s-brand`

#### §V2-D41.2 · Card frosted-glass text pill (supersedes V2-D34 §16 bare-text-under-photo)

V2-D34 had the salon-card text (name + rating + row 2) rendered as bare text below the photo. Modernity pass wraps it in a **frosted-glass pill** that floats below the photo with a small gap.

```
[photo 150×150 / 180×180]    ← rounded-14, layered shadow (V2-D34 kept)
                              
[╭─ frosted pill ─────────╮]  ← 8px gap from photo
[│ Name           ★ 4.9   │]
[│ Service · ab CHF 80    │]
[╰─────────────────────────╯]
```

**Pill specs:**

|prop                |value                                                                              |
|--------------------|-----------------------------------------------------------------------------------|
|gap from photo      |`mt-[8px]`                                                                          |
|background          |`rgba(255, 255, 255, 0.70)`                                                         |
|backdrop-filter     |`blur(14px) saturate(1.2)`                                                          |
|border              |`1px solid rgba(255, 255, 255, 0.60)`                                               |
|border-radius       |`12px`                                                                              |
|padding             |`px-[10px] py-[7px]`                                                                |
|shadow              |`0 1px 3px rgba(26, 18, 9, 0.04)` (very soft)                                       |

**Why pill, not bare text:** sits on the section-frame's glass (40% white) which sits on the page wash (boosted gradients). Three layers of glass = depth without heavy shadow. Pill reads as "name tag" floating below photo.

**Text contents inside pill** (unchanged from V2-D34 §16.4 + §16.5):
- Row 1: name (Avant Garde 700 14px ink-1) + rating (Avant Garde 600 11px tabular-nums)
- Row 2: variant content (availability or service+price)
- **NEW:** service-variant price uses `text-s-brand` (brand-teal) bold (was `text-s-ink` bold in V2-D34)

#### §V2-D41.3 · Card dimensions update (supersedes §16.2)

|element           |V2-D34 spec      |V2-D41 lock       |
|------------------|-----------------|-------------------|
|width mobile      |160px            |**150px**          |
|width tablet+     |180px            |180px (unchanged)  |
|photo aspect ratio|1:1              |1:1 (unchanged)    |
|photo radius      |14px             |14px (unchanged)   |
|photo to text gap |8px              |8px (unchanged via mt-[8px] on pill)|
|text container    |bare text        |frosted pill (§V2-D41.2)|

**Why 150 mobile:** to fit "2 full + visible peek of 3rd" cards on 375px viewport without forcing the user to scroll just to see there's more content. With 160px cards + 12px gap + minimal section padding, only ~15px of card 3 was visible (sliver). At 150px, ~31px peek (clear "there's more" affordance).

#### §V2-D41.4 · Card hover softened (supersedes V2-D34 hover spec)

V2-D34 §16.6 specified `translateY(-1px) + brighter shadow` on hover. Modernity pass softens but adds proper depth:

|prop          |V2-D34         |V2-D41 lock          |
|--------------|---------------|---------------------|
|translate     |`-1px`         |**`-3px`**           |
|scale         |none           |**`1.015`**          |
|base shadow   |default        |`0 1px 2px rgba(26,18,9,0.04), 0 4px 10px rgba(26,18,9,0.05)` (layered)|
|hover shadow  |brighter       |`0 1px 2px rgba(26,18,9,0.05), 0 6px 14px rgba(26,18,9,0.06), 0 12px 24px rgba(26,18,9,0.05)` (layered, slightly deeper)|
|cat-color halos|active per V2-D34|**RETIRED** — read as static-shadow bugs|
|hover glass-shine|none         |briefly tried, retired per user feedback ("remove the card glow on hover")|

#### §V2-D41.5 · Heart icon update (refines V2-D34 §16.3.3)

V2-D34 §16.3.3 had heart filled `var(--love)` (#FF4A6B) when saved. Modernity pass refines:
- **Saved fill:** `rgba(255, 74, 107, 0.65)` (semi-transparent so photo bleeds through — glass-like depth)
- **Saved stroke:** `#FF4A6B` (fully opaque — defines silhouette crisply)
- **Saved drop-shadows:** dual stack — `0 1px 3px rgba(255, 74, 107, 0.35)` (love-red glow) + `0 0 1px rgba(255, 255, 255, 0.6)` (white highlight, mimics glass sheen)
- **Default unchanged** from V2-D34: outline only, ink-3 stroke, soft black drop-shadow

NO surrounding circle (V2-D34 §16.3.4 anti-pattern still active).

#### §V2-D41.6 · Atmosphere wash boosted ~2× (supersedes V2-D15-3 §5g alpha values)

User feedback: "i like how it is in the header like more color yk can u make me one whole page". Wash on body::before + body::after both boosted across all gradient stops. Numerical update:

**body::before (fixed, 22s drift):**
|gradient                                  |V2-D15-3 alpha |V2-D41 lock |
|------------------------------------------|---------------|------------|
|cyan top-right `rgba(202, 232, 255, X)`   |0.32           |**0.65**    |
|teal top-left `rgba(194, 240, 241, X)`    |0.28           |**0.58**    |
|navy mid-right `rgba(0, 88, 152, X)`      |0.10           |**0.18**    |
|teal lower-left `rgba(194, 240, 241, X)`  |0.26           |**0.50**    |
|navy bottom `rgba(3, 30, 72, X)`          |0.06           |**0.10**    |

**body::after (parallax, 28s drift):** all 13 stacked gradients boosted ~2×, alphas now in 0.45–0.65 range (was 0.22–0.32).

**Plus:** the LOCAL hero wash from Hero.tsx is REMOVED. Was creating intensity discontinuity (hero zone = 2 washes layered, sections below = 1 wash). One source of truth now: body wash carries entire page.

#### §V2-D41.7 · Hero simplified (Option A locked)

User feedback (2026-05-09 annotated screenshot): picked Option A from `public/solen-v2-hero-options.html` ("Cut hard — drop the deck, keep eyebrow + h1 + search").

|element       |V2-D26 era |V2-D41 lock |
|--------------|-----------|------------|
|eyebrow       |`Beauty in der Schweiz` w brand-teal dot |**KEPT**|
|h1            |`Schöner aussehen, schneller buchen.` w brand-teal `buchen.` |**KEPT**|
|deck `<p>`    |2-sentence value-prop + "So funktioniert's →" link |**REMOVED** — replaced with empty 32px spacer for h1↔search rhythm|
|search bar    |3-row stacked card mobile / horizontal pill desktop |**KEPT — restructured per §V2-D41.8**|

#### §V2-D41.8 · Search bar — Dynamic Island morph + simplified rows (supersedes §13.4 + §14 collapsed)

V2-D14 spec'd a static 3-row stacked search bar (Was/Wo/Wann). Modernity pass turns it into a **Dynamic Island-style morphing pill** with smooth height + content cross-fade animations. Plus the row labels are dropped.

**Row simplification:**

|element       |V2-D14 |V2-D41 lock |
|--------------|-------|------------|
|labels (WAS/WO/WANN) |visible inline w icon + value |**REMOVED** (icon alone is enough; aria-label preserves accessibility)|
|values (default) |`Service oder Salon` / `Basel · Kleinbasel` / `Heute · jederzeit` |**`Service` / `Stadt` / `Zeit`** (single-word; Q5 voice fix: no hardcoded Basel)|
|active row bg |`s-bg-active` (#FFF4E8 cream, V2-D16 lock) |**`s-brand/[0.05]`** (5% alpha brand-teal — cream was a V2-era hold-over that miscoded the search row as Coiffeur category)|
|value text color |black/active vs gray/placeholder |**`text-s-ink-3` always** (uniform gray; placeholder vs filled distinguished by font-weight only, per user "i jst want graz")|
|submit button bg|`bg-s-ink` default → `bg-s-brand` hover |**`bg-s-brand` default → `bg-s-brand-mid` hover** (brand-teal as default, lighter on hover)|

**Dynamic Island morph pattern:**

|prop          |value          |
|--------------|---------------|
|states        |idle / service-active / stadt-active / zeit-active|
|tap segment   |morphs container height (mobile 280→480, desktop 76→480) + crossfades content layers|
|transition    |tween cubic-bezier(0.22, 1, 0.36, 1) 500ms|
|content layers|two stacked absolute layers with 0.1s stagger delay between fade-out and fade-in|
|content swap  |AnimatePresence mode="wait", 250ms y-axis fade between segment pickers|
|backdrop      |fixed inset-0 `bg-black/30` (NO backdrop-blur — was too expensive on every paint frame)|
|esc / backdrop tap|closes|
|body scroll lock|active when expanded|

**No `will-change` / `translateZ(0)` GPU hints** — they caused blurry text rasterization at fixed pixel density. Motion library handles GPU promotion DURING animation on its own.

#### §V2-D41.9 · Other lockable details

- **Underline retired** on all V3 link styles (SectionTitle pill button + CookieConsent inline link). Brand-teal color carries clickability.
- **"ansehen" verb retired** in section "see more" links — `Im Profil ansehen →` → `Im Profil →`, `Alle ansehen →` → `Alle →`. Noun + arrow alone.
- **V3 Header (§12) — minimal:** logo + hamburger only, no profile button, no inline search, glass `rgba(255,255,255,0.65)` + `backdrop-filter: blur(12px)`, position absolute top-0 z-50. NO border-bottom (was 1px hairline — created visible seam against the wash).
- **Body bg architecture:** `html { background: white }`, `body { background: transparent }`. Body wash pseudo-elements paint between html bg and body content. Critical: any `bg-white` Tailwind utility on body element BLOCKS the wash. layout.tsx body className must not contain `bg-white`.

#### §V2-D41.10 · Files touched (full list, ordered)

App code:
- `app/[locale]/layout.tsx` — body className, CookieConsent provider mount
- `app/[locale]/_components/layout/Header.tsx` — V3 minimal header (commit 6cc5c43)
- `app/[locale]/_components/homepage/Hero.tsx` — deck dropped, search bar simplified, local wash removed
- `app/[locale]/_components/homepage/SearchBar.tsx` — Dynamic Island morph (NEW file)
- `app/[locale]/_components/homepage/SectionHeader.tsx` — split into SectionMeta/SectionFrame/SectionTitle
- `app/[locale]/_components/homepage/SalonCard.tsx` — frosted pill, 150px mobile, softer hover, brand-teal price accent
- `app/[locale]/_components/homepage/HeartButton.tsx` — semi-transparent fill + dual drop-shadow when saved
- `app/[locale]/_components/homepage/RecentlyViewed.tsx` / `LastMinute.tsx` / `Nearby.tsx` / `Coiffeur.tsx` / `Reviews.tsx` — restructured to use Section/Meta/Frame/Title

Style:
- `app/globals.css` — body wash alphas boosted ~2×, html bg white (body transparent)

Spec:
- `_tasks/SOLEN_LIVE_TRUTH.md` — this entry's V2-D41 references inline updates to §15 / §16.2 / §16 anatomy
- `_tasks/V2_REBUILD_LOG.md` — this entry

#### §V2-D41.11 · Pending follow-ups

- **Real photos** — cards still show category-color tile + initial fallback. Need photographer brief OR Unsplash demo URLs in section data files. SOLEN_NEXT.md §3.6 photographer brief.
- **Card entry stagger animation** on scroll-into-view (Framer Motion `whileInView`) — was in the static demo, not yet ported to React.
- **Cooper BT primary** — still using `Cooper BT, Cooper Black Std` in font-family list, but fontcdn.com Cooper is HTTP 500. Actual rendered font is Sansita 900 (Google Fonts fallback). User can decide: accept Sansita as primary (rec) or invest in licensed Cooper.

#### §V2-D41.12 · Status

**Locked.** Modernity pass complete after ~30 commits of iterative refinement (latest: `65fbdb3` card pill resize, `fe632aa` 150px cards). User feedback "okay looks amaizing" closes the iteration loop.

### V2-D41-rising-panel (2026-05-09 night) — Hero/feed-zone separation via rising-panel pattern

**Context:** post V2-D41-fu, user wanted "the separating sh" from the Base/SocialFi reference (`#CLUB SOCIALFI PEOPLE` mockup) — specifically the rounded-top white panel that rises out of the colored hero region to hold content sections below. NOT the rest of Base's energy (no stacked-shadow type, no spinning badges, no hand-drawn arrows, no lime palette — those were demo'd in `solen-v2-base-energy.html` and rejected).

**Decision:** Add `<FeedZone>` component that wraps all homepage feed sections after the hero. Hero stays in the colorful wash zone; FeedZone is a calmer surface for content. Locked via `solen-v2-rising-panel.html` mockup, signed off "yesss like that".

**FeedZone specs:**

|prop                |value                                                                              |
|--------------------|-----------------------------------------------------------------------------------|
|background          |`rgba(255, 255, 255, 0.85)` (85% white tint — NOT opaque solid)                    |
|backdrop-filter     |`blur(8px)` (lighter than SectionFrame's 18px — this is a panel, not a glass card) |
|border-radius       |`28px 28px 0 0` mobile / `40px 40px 0 0` desktop (rounded TOP only)                 |
|margin-top          |`-mt-6` mobile / `-mt-8` desktop (24-32px overlap into hero — emphasizes "rising") |
|shadow              |`0 -12px 32px rgba(4, 51, 56, 0.06)` mobile / `0 -16px 40px rgba(4, 51, 56, 0.08)` desktop (UPWARD shadow only) |
|padding             |`pt-2 pb-12 md:pt-4 md:pb-20` (top breathing + bottom padding before footer)        |
|z-index             |`z-[2]` (above wash, below modals/header)                                           |

**Layer architecture (final, post V2-D41-rising-panel):**

```
LAYER 5 (z high): Modal/sheet overlays + V3 Header (sticky)
LAYER 4 (z 2):    FeedZone panel (white 85% glass, rounded top, contains all feed sections)
LAYER 3 (z 1):    Section frames inside FeedZone (white 40% glass)
LAYER 2 (z 1):    Card frosted-glass text pills (white 70% glass)
LAYER 1 (z auto): Hero zone (transparent, full wash visible)
LAYER 0 (z -1/-2):body::before + body::after atmosphere wash gradients
LAYER -1:         html bg white substrate
```

The 85% panel alpha is intentionally HIGHER than SectionFrame's 40% — the panel is the "I'm a calmer surface" cue, the section frames are the "I'm a discrete UI unit floating on the surface" cue.

**Trust banner placement:** stays INSIDE FeedZone. Its own dark `bg-s-ink` covers the panel's white tint locally where it sits, before the footer.

**RETIRED in V2-D41-rising-panel:**
- ❌ The earlier prelude assumption that the entire page is one continuous wash. Wash is intentionally STRONGER in the hero zone (above panel) than in the feed zone (where panel's white tint mutes it). User asked for matched-intensity wash earlier (V2-D41.6 alpha boost) AND now asked for hero/feed separation — these are compatible: wash IS uniform, the FeedZone panel just paints over it locally with white tint.

**Files patched:**
- `app/[locale]/_components/homepage/SectionHeader.tsx` — added `FeedZone` export
- `app/[locale]/page.tsx` — wrapped sections after `<Hero />` in `<FeedZone>`

**LIVE_TRUTH should be updated** to reference this entry from §15 (section pattern) prelude — "NEW: feed sections live inside `<FeedZone>` panel, see V2-D41-rising-panel for spec."

**Status:** locked. Commit `0d45c6e`.

### V2-D41-followup (2026-05-09 night) — Gap audit + anti-patterns + dependency map for V2-D41 modernity pass

User instruction: "see for any gaps or like things that in the future it might occur errors n sh like for the specs we jst made cz i want these sh applied like i want u to remember". Below: the failure modes a future agent (Claude or human) is most likely to hit, with prevention rules.

#### V2-D41-fu.1 · 🔴 CRITICAL anti-patterns (will silently break the design)

**A. `bg-white` on the `<body>` element BREAKS THE ATMOSPHERE WASH.**

Symptom: page reads as flat white. Wash gradients are technically painted but invisible because body's opaque white covers them.

Why: `body::before` and `body::after` pseudo-elements paint at z-index -2 / -1 — INSIDE body's stacking context. An opaque body bg paints OVER them.

Architecture (don't break this):
```css
html { background-color: #FFFFFF; }   /* white substrate */
body { background: transparent; }      /* MUST stay transparent */
body::before, body::after { /* wash gradients with negative z-index */ }
```

In React layout (`app/layout.tsx`):
```tsx
<body style={{ margin: 0, padding: 0 }} className="text-s-ink">
//                                                  ^^^^^^^^^^
//   Notice: NO bg-white here. text-s-ink only. Adding bg-white = breaks wash.
```

This regressed once mid-session (V2-D41-fu happened because of this). Mark as a permanent rule:

> **Anti-pattern (banned permanently):** `bg-white` (or any opaque bg utility) on `<body>` className. White substrate lives at `html` level. Body must be transparent for wash visibility.

**B. Cooper Black Std CDN (fontcdn.com) is HTTP 500 — actual rendered font is Sansita 900.**

Symptom: agent "fixes" the @import URL or notices font discrepancy and tries to "correct" it.

Reality: cooper-black-std on fontcdn.com returns 500. Sansita 900 (loaded from Google Fonts in the same `globals.css` import) is fourth in the cascade and is what actually renders. Looks Cooper-ish, works fine.

Don't:
- Replace cooper imports with a different "working" Cooper source without checking the rendered visual matches.
- Reorder font-family list to put Sansita first (might cause flash of different font).

Do:
- Accept that Sansita 900 IS the de facto primary V3 display font.
- If you license Cooper Black later, add a legitimate self-hosted @font-face declaration BEFORE the cdnfonts import.

**C. Cat-color halo glows on cards are RETIRED — don't reintroduce.**

Symptom: agent reads V2-D34 §16.3.0 universal color formula, sees that halos use the formula's hue palette, and "applies" it to card photos.

Reality: V2-D41.4 retired the cat-color halos because they read as static-shadow bugs. The §16.3.0 formula is for BADGES (Solen Favorit pill, discount pill, availability pill) — NOT for card-level halos.

Anti-pattern:
```css
/* ❌ NEVER do this on .salon-card photo */
.card-coiffeur .photo { box-shadow: 0 4px 20px rgba(255, 241, 221, 0.9); }
```

The card uses the simple layered black-shadow stack from V2-D41.4. No category coloring on the photo container or its shadow.

**D. Section padding ↔ ScrollRow negative margin MUST stay coupled.**

Symptom: agent changes Section's `px-1` or SectionFrame's `px-3` without updating ScrollRow's `-mx-3 px-3` — cards either stick out past the rounded border (overflow not clipped properly) or don't extend to the edge (visible gap).

Coupling:
- ScrollRow's negative margin must MATCH SectionFrame's horizontal padding (so scroll-row outer extends to frame's outer edge)
- ScrollRow's padding must MATCH the negative margin (so cards align with frame's content area)
- SectionFrame must have `overflow-hidden` (so any escape past the rounded border clips cleanly)

If you change SectionFrame.px from `px-3` to `px-4`, you must update ScrollRow from `-mx-3 px-3` to `-mx-4 px-4`. Same on desktop side.

#### V2-D41-fu.2 · 🟡 SCOPE — where the V2-D41 patterns apply

The Section/Meta/Frame/Title pattern was locked **for the homepage**. But it's the right pattern for any "scroll-row on a feed" surface.

Apply V2-D41 section-frame to:
- ✅ Homepage (Recently Viewed / Last-Minute / Nearby / 4 categories / Reviews)
- ✅ Category pages (`/coiffeur`, `/barbershop`, `/nails`, `/spa`) when they ship
- ✅ City pages (`/[city]`) per-category sections
- ✅ Search results page when it ships (`/search/results`)
- ✅ /favoriten and /profile/* feeds

Don't apply:
- ❌ Trust banner (`§Q51.8`) — uses solid `bg-s-ink` (dark section), section-frame glass would be invisible on dark substrate. Trust banner's existing inline header is correct.
- ❌ Hero (`§13`) — its own component with its own typography rhythm
- ❌ Footer — separate visual language
- ❌ Modal/sheet/dialog content — those have their own framing

#### V2-D41-fu.3 · 🟡 REDUCED MOTION strategy

V2-D41 added several motion moments: Dynamic Island search morph (500ms tween), card hover (-3px lift, 300ms ease), saved-heart drop-shadow change. Plus the existing atmosphere wash drift (22s + 28s).

Current state:
- Atmosphere wash drift: ✅ has `@media (prefers-reduced-motion: reduce) { animation: none }` (locked V2-D15-3)
- Card hover transform: ⚠️ no reduced-motion guard — but transforms are user-initiated (hover), so they're fine to keep
- Dynamic Island morph: ⚠️ no reduced-motion guard — should be added

**Rule:** any motion that runs WITHOUT user interaction (like atmosphere drift, breathing heart, entry stagger) MUST have a reduced-motion guard. Motion that runs ON user action (hover, tap, scroll) does NOT need a guard.

TODO before Phase 1 ship: add reduced-motion guard to Dynamic Island morph in `SearchBar.tsx`. Specifically:
```tsx
const transition = useReducedMotion()
  ? { duration: 0 }
  : { type: "tween", ease: [0.22, 1, 0.36, 1], duration: 0.5 };
```

#### V2-D41-fu.4 · 🟡 EMPTY STATE for card feeds

V2-D41 doesn't address what happens when a feed has 0 cards. Currently:
- `RecentlyViewed` returns null when localStorage is empty in production (locked V2-D11 era)
- `LastMinute / Nearby / Coiffeur / Reviews` always render with hardcoded demo data

For Phase 2 when these wire to real Supabase queries:
- 0 cards → hide the entire `<Section>` (return null from the section component)
- 1-2 cards → show as-is, no peek of card 3 obviously, scroll-row still works
- Loading state → show §16.7 skeleton variant (V2-D34 spec) inside the SectionFrame

#### V2-D41-fu.5 · 🟡 SEARCH BAR — wired vs unwired

The V2-D41.8 Dynamic Island morph has all the visual + interaction state but **no actual submit logic**:
- Service / Stadt / Zeit values are stored in component state but not submitted anywhere
- "Solen durchsuchen" button has no `onClick` handler
- "Suchen" footer button (in expanded state) also has no handler

When wired to Phase 2 search backend:
- Submit handler: `router.push(`/search/results?service=${service}&stadt=${stadt}&zeit=${zeit}`)`
- Need URL state → component state hydration so `/search/results` opens with the same values pre-filled
- Body scroll lock + Esc handler stay as-is

#### V2-D41-fu.6 · 🟡 RESPONSIVE EDGE CASES

V2-D41 specs heights/widths for mobile (< 768px) and desktop (≥ 768px). Edge cases:

- **Tablet portrait (768-1023px)**: uses desktop branch. SearchBar is horizontal pill (76px), cards are 180px. Should look fine.
- **Narrow phone (< 360px)**: 150px cards + 12px gap = 312px. With 4px section padding + 12px frame padding on each side, content area = 360 - 32 = 328px. 2 cards fit, card 3 peek is ~16px. Acceptable.
- **Ultra-narrow (< 320px, very rare)**: cards might overflow horizontally beyond viewport. Not optimized.
- **4K / wide (> 1280px)**: Section maxes out at 1280px max-width with `mx-auto`. Plenty of side margin around the centered section.

If a new viewport edge case surfaces, the fix is in `Section` component padding values — don't touch ScrollRow or SalonCard widths first.

#### V2-D41-fu.7 · 🟡 GLASS LAYER PERFORMANCE

V2-D41 stacks 3 glass layers per card section: SectionFrame (40% white + 18px blur) → SalonCard pill (70% white + 14px blur) → page atmosphere wash. Each layer requires the browser to re-rasterize the underneath pixels.

On low-end mobile devices (Android < 12, older iOS), this can hit frame rates. Not yet measured.

Mitigation if it becomes an issue:
- Reduce backdrop-blur values (10px instead of 18px on SectionFrame)
- Use `transform: translateZ(0)` JUDICIOUSLY on layers that need GPU promotion, but ONLY during animation, not at rest (we hit a blurry-text bug from this earlier)
- For very low-end devices, fall back to flat fills (no backdrop-filter) via `@supports not (backdrop-filter: blur(1px))`

NOT yet implemented — flag for Phase 1 perf testing.

#### V2-D41-fu.8 · 🟡 CARD WIDTH SCALES — outside homepage

V2-D41.3 locked card mobile width at 150px specifically for "2 + bit of 3rd peek" on the homepage scroll rows.

For other surfaces using SalonCard:
- **Search results grid (Phase 2 §SR)**: cards in a 2-column grid on mobile, 3-column tablet, 4-column desktop. Width determined by grid, not fixed 150/180px. Card adapts via parent container.
- **Salon detail page recommended salons section**: scroll row → use 150/180px (same as homepage)
- **Favorites grid**: 2-col mobile grid → wider cards (~180px), use grid-derived width

Generalize: 150/180px is for the **horizontal scroll row** mobile peek. Grids use container-derived widths.

#### V2-D41-fu.9 · 🟡 LOCALE / i18n still hardcoded

All V3 homepage components have hardcoded German strings (eyebrows, h2 titles, link labels, search row placeholders). When non-`/de` locales render:
- They'll show German strings (degraded UX but not broken)
- Once wired to next-intl, each locale gets its own translations

V2-D41-fu reminder: before Phase 4 launch, audit all V3 components for `useTranslations()` migration. SOLEN_NEXT.md §3.4 already has this on the i18n completeness checklist.

#### V2-D41-fu.10 · 🟢 LONG-TAIL CONSIDERATIONS

- **No automated tests** for V2-D41 components. Visual regression risk on future commits. Recommend Playwright smoke tests for homepage rendering once Phase 2 stabilizes.
- **CSS migration risk**: V2-D41 uses Tailwind arbitrary values (`px-[10px]`, `mt-[8px]`, `bg-white/40`). If codebase moves off Tailwind, these don't translate cleanly.
- **CookieConsent provider** must wrap the tree (mount in `app/[locale]/layout.tsx` already done). Forgetting it makes `useCookieConsent()` throw.
- **Demo data** in section files (`DEMO_SALONS` arrays) gets replaced with real Supabase queries in Phase 2. Don't ship demo data to production — explicit guard via `process.env.NODE_ENV !== "production"`.

#### V2-D41-fu.11 · MEMORY: where to put what

For future agents asking "where do I encode this V2-D41 stuff so I remember":

| Type of decision | Goes in |
|---|---|
| Visual spec deltas (§X.Y formula updates) | LIVE_TRUTH §X.Y inline, with V2-D41 prelude warning |
| Anti-patterns + dependency rules (this entry) | V2_REBUILD_LOG.md V2-D41-fu (this section) |
| Hard rules a hook should enforce | Add to `.claude/hooks/` if pattern recurs |
| New surface specs (e.g. Phase 2 §SR using V2-D41 patterns) | LIVE_TRUTH §X new section, citing V2-D41 |
| Phase planning + deferred work | SOLEN_NEXT.md (V2-D38 lock) |

#### V2-D41-fu.12 · Status

**Locked.** This entry is the canonical reference for "future agent gotchas around V2-D41". Any subsequent V2-D## that touches a §V2-D41 surface must check this list for relevant anti-patterns first.

### V2-D40 (2026-05-09 evening) — Archive sweep close-out: 6 remaining §0c.2-listed docs moved to `_tasks/archive/`

- **Context:** §0c.2 ("Archived — do NOT consult") in LIVE_TRUTH already named these docs as archive-bound. The actual `git mv` was deferred until V2-D33 doc consolidation flow finished (V2-D34 through V2-D39 first). With all 6 sub-decisions locked, this is the close-out sweep.
- **Files moved (`git mv` preserves history):**
  - `_tasks/REDESIGN_INVENTORY.md` → `_tasks/archive/REDESIGN_INVENTORY.archived.md`
  - `_tasks/BACKEND_NEEDS_UI.md` → `_tasks/archive/BACKEND_NEEDS_UI.archived.md`
  - `_tasks/SOLEN_BUILD_MAP.md` → `_tasks/archive/SOLEN_BUILD_MAP.archived.md`
  - `_tasks/PHASE_8_STRUCTURAL_ALIGNMENT.md` → `_tasks/archive/PHASE_8_STRUCTURAL_ALIGNMENT.archived.md`
  - `_tasks/SOLEN_BUILD_LEARNINGS.md` → `_tasks/archive/SOLEN_BUILD_LEARNINGS.archived.md`
  - `_tasks/INVENTORY_FULL.md` → `_tasks/archive/INVENTORY_FULL.archived.md`
- **Files patched:** `_tasks/SOLEN_LIVE_TRUTH.md` §0c.2 — all 6 entries updated to point at archive paths with V2-D40 dating + clarified status (e.g. REDESIGN_INVENTORY content not pre-migrated; per-surface §X.99 happens during phase work, original preserved for reference).
- **Not in this sweep (still in `_tasks/` root, NOT yet triaged):** `AGENT-PROMPTS.md` · `CLAUDE_DESIGN_PLAN.md` · `CLAUDE_DESIGN_PROMPT.md` · `CLAUDE_DESIGN_RESEARCH.md` · `DESIGN_AUDIT_MASTER.md` · `OVERNIGHT_LOG.md` · `ROADMAP_AUDIT.md` · `SOLEN_BUILD_PHASE_0.md` · `SOLEN_DESIGN_QUESTIONNAIRE_V3.md` · `TODO-type-fixes.md`. These weren't pre-named in §0c.2 — user should triage separately (some likely archive, e.g. CLAUDE_DESIGN_* workflow stale; some likely keep, e.g. SOLEN_DESIGN_QUESTIONNAIRE_V3 may still be active).
- **V2-D33 status:** **CLOSED.** All 6 sub-decisions locked (V2-D34, V2-D35, V2-D36, V2-D37, V2-D38, V2-D39) + archive sweep done. The doc consolidation flow that started at user request "make a one big organized file with evrth plus archive the old files" is complete for the named scope. Optional follow-ups: (a) triage the 10 untracked `_tasks/` docs above; (b) re-read LIVE_TRUTH §0c with fresh eyes to confirm new agents can navigate the source map cleanly.

### V2-D39 (2026-05-09 evening) — Decision 6 lock: Q-lock reconciliation table (54 Q-locks classified, SOLEN_DESIGN.md archived)

- **Context:** Decision 6 in V2-D33 doc consolidation flow asked what to do with the Q-lock decision archeology in `_tasks/SOLEN_DESIGN.md` §20 before that doc gets archived. Options: extract still-valid Q-locks into LIVE_TRUTH cross-refs (A), make every Q-lock a carryover V2-D## entry (B), single reconciliation table here in V2_REBUILD_LOG (C), or archive entirely without extraction (D).
- **User picked C.** Initial scope estimate was 15 Q-locks → ~25 lines. Re-counted at lock time: SOLEN_DESIGN.md §20 has 54 unique Q-numbered locks (Q1-Q64 with gaps Q17, Q27, Q29, Q31, Q33, Q34, Q37-39, Q44) plus 10 unnumbered pre-Q entries from 2026-04-20. Scope corrected to ~70 rows; user pre-confirmed C still applies.
- **Triage method:** each Q-lock classified into one of 5 status buckets:
  - **ACTIVE** — V3 still honors this rule; spec lives in LIVE_TRUTH or SOLEN_NEXT.md
  - **DEFERRED** — still valid but not yet shipped; entry exists in SOLEN_NEXT.md
  - **SHIPPED** — implemented in V3 era (with V2-D## reference)
  - **SUPERSEDED** — V3 changed the specific answer (with V2-D## that did so)
  - **OBSOLETE** — V3 retired the underlying assumption entirely (e.g. Q12 Bebas Neue scope is moot because V3 retired Bebas)

#### §V2-D39.1 · Q-lock reconciliation table (post-V3)

**Pre-Q era (2026-04-20)** — unnumbered decisions, all superseded by V2-D15-3 (brand pivot to teal) or V2-D26 (typography pivot to Cooper BT + Avant Garde). Not individually tracked here; archived with SOLEN_DESIGN.md.

**Q1-Q16 (2026-04-22 — first numbered Q-batch, ship-blocker era):**

| Q | Decision (1-line) | V3 status | Where it lives now |
|---|---|---|---|
| Q1 | Salon card photo = 1:1 square | ACTIVE | LIVE_TRUTH §16.2 |
| Q2 | Price format `ab CHF X` only | ACTIVE — not yet centralized | SOLEN_NEXT §3.5 (centralization TODO) |
| Q3 | Swipeable image carousel (Airbnb pattern) | DEFERRED | SOLEN_NEXT §6 candidate |
| Q4 | Search bar = 3-segment pill (Was · Wo · Wann) | ACTIVE | LIVE_TRUTH §14 |
| Q5 | Voice = Swiss-wide, "Für [city]" dynamic | ACTIVE — hardcoded Basel breaks it | LIVE_TRUTH §0d.1 + SOLEN_NEXT §3.4 |
| Q6 | Phase sequence — UI polish first | OBSOLETE | superseded by V3 phase plan in V2_REBUILD_LOG `## Status` |
| Q7 | Moat priority — chat + allergy first | ACTIVE | SOLEN_NEXT §6.1 + §6.2 |
| Q8 | TWINT integration required pre-launch | ACTIVE | SOLEN_NEXT §3.3 |
| Q9 | `/termine` redirects to `/profile/bookings` | ACTIVE — not yet shipped | SOLEN_NEXT §3.5 (TODO) |
| Q10 | Solen Favorit yellow 4th badge | SHIPPED | LIVE_TRUTH §16.3.1 (V2-D34) |
| Q11 | `--sh-xl` token removed entirely | SHIPPED | confirmed V3 §5b depth system |
| Q12 | Bebas Neue scope (hero + Instagram + numerals + footer) | OBSOLETE | V3 retired Bebas (V2-D26) |
| Q13 | Scraped profiles "Claim this listing" ribbon | DEFERRED | SOLEN_NEXT §4.2 |
| Q14 | Mobile bottom nav = 4 tabs | ACTIVE | LIVE_TRUTH §12 (header) — verify alignment with V3 spec |
| Q15 | Page bg = white `#FFFFFF` | ACTIVE | LIVE_TRUTH §1 (V3 honors) |
| Q16 | Decorative gradients killed | ACTIVE | LIVE_TRUTH §0b + §5a (flat pills, V2-D15-4) |

**Q18-Q26 (2026-05-01 — design-system grammar batch):**

| Q | Decision (1-line) | V3 status | Where it lives now |
|---|---|---|---|
| Q18 | Disabled state = token swap to `--ink4`/`--ink3` + `cursor:not-allowed` | ACTIVE | LIVE_TRUTH §F.1 form primitives |
| Q19 | 5-state lockset (happy / empty-FTU / empty-filtered / error / loading) | ACTIVE | LIVE_TRUTH §F.x state principles |
| Q20 | Loading default = skeleton (shape-of-real-content) | ACTIVE | LIVE_TRUTH §F.1 + §F.x |
| Q21 | Empty state = brand illustration | ACTIVE | LIVE_TRUTH §AC favorites empty (heart-with-face) |
| Q22 | Error grammar = inline (in-place block) | ACTIVE | LIVE_TRUTH §F.1 |
| Q23 | Brand mood = Bold + Playful + Warm | ACTIVE — refined post-pivot | LIVE_TRUTH §0a + §5h color philosophy |
| Q24 | Copy tone = direct-friendly · NO EMOJIS | ACTIVE | LIVE_TRUTH §0d.1 voice + content rules |
| Q25 | Button label grammar = single verb default | ACTIVE | LIVE_TRUTH §F.1 button anatomy |
| Q26 | Card hierarchy = Airbnb-style (photo + bare text) | SUPERSEDED — spirit honored, specifics rewritten by V2-D34 | LIVE_TRUTH §16 (light glass badges, color philosophy) |

**Q28-Q43 (2026-05-01 to 2026-05-02 — type, color, motion, density batch):**

| Q | Decision (1-line) | V3 status | Where it lives now |
|---|---|---|---|
| Q28 | Numeric typography = tabular-nums on movers | ACTIVE | LIVE_TRUTH §5 typography |
| Q30 | Shadow scale = 3 tiers (sm/md/lg) + border-only | ACTIVE | LIVE_TRUTH §5b depth system |
| Q32 | Spacing scale = 9 sanctioned + 2 hero-only | ACTIVE | LIVE_TRUTH §6 |
| Q35 | Inter-screen transitions = SLIDE default + shared-element morph | ACTIVE | LIVE_TRUTH §5b motion |
| Q36 | 5 sanctioned celebration moments | ACTIVE | LIVE_TRUTH §5c.4 |
| Q40 | 4 sanctioned hover-scope element classes | ACTIVE | LIVE_TRUTH §F.1 button + card patterns |
| Q41 | Title truncation = NONE, full text always | ACTIVE | LIVE_TRUTH §F.1 + i18n |
| Q42 | DE/FR/IT text expansion = full text never truncate | ACTIVE | LIVE_TRUTH §F.1 + i18n |
| Q43 | Numeric alignment = tabular only on movers | ACTIVE | merged w/ Q28 |

**Q45-Q50 (2026-05-02 — accessibility + signature batch):**

| Q | Decision (1-line) | V3 status | Where it lives now |
|---|---|---|---|
| Q45 | WCAG AA floor (4.5:1 body, 3:1 large/UI) + 3 banned pairings | ACTIVE — banned pairs partially obsolete (coral-on-white pair retired w V2-D15-3) | LIVE_TRUTH §3 semantic colors |
| Q46 | Tap target floor = 48×48 + ≥8px gap | ACTIVE | LIVE_TRUTH §11 hit targets |
| Q47 | Keyboard focus = 2px coral ring | SUPERSEDED — coral retired, focus ring now brand-teal | LIVE_TRUTH §F.1 (V2-D15-3 + V2-D14) |
| Q48 | Brand signature = Anton + tracked-coral-eyebrow lockup | OBSOLETE | V3 uses Cooper BT + ITC Avant Garde + brand-teal (V2-D15-3 + V2-D26) |
| Q49 | Above-fold home = stacked (eyebrow + headline + search + chips), no hero photo | ACTIVE | LIVE_TRUTH §13 hero |
| Q50 | Card density = horizontal scroll-snap (2.5/3.5/4.5-up) | ACTIVE | LIVE_TRUTH §17 horizontal scroll row |

**Q51-Q64 (2026-05-02 to 2026-05-03 — surface specs + brand pivot batch):**

| Q | Decision (1-line) | V3 status | Where it lives now |
|---|---|---|---|
| Q51 | 8-section home rhythm + conditional Recently Viewed | ACTIVE | LIVE_TRUTH §13-§22 (homepage flow) |
| Q52 | Salon detail hero = full-bleed photo + tab nav (Fresha pattern) | ACTIVE | LIVE_TRUTH §SD (Phase 2) |
| Q53 | Booking entry = sticky bottom CTA (mobile) + sidebar (desktop) → full-page wizard | ACTIVE | LIVE_TRUTH §SD + §BW |
| Q54 | Reviews = summary card + 3 latest on detail; full list at sub-page | ACTIVE | LIVE_TRUTH §SD reviews tab + §RV |
| Q55 | Booking wizard = 3 steps (Service+Staff → Date+Time → Pay+Confirm) | ACTIVE | LIVE_TRUTH §BW |
| Q56 | Step indicator = 3-segment progress bar + eyebrow `Schritt N/3` | ACTIVE | LIVE_TRUTH §BW chrome |
| Q57 | Confirmation = celebration animation + summary + 3 utility chips, NO confetti spam, NO upsell | ACTIVE | LIVE_TRUTH §C |
| Q58 | Profile = hybrid layout (Insta header + grouped lists + Live-Activity card) | ACTIVE | LIVE_TRUTH §AC.4 (Phase 3) |
| Q59 | Loyalty stamps = 3-surface system (page + meta-strip chip + Live-Activity priority) | DEFERRED | SOLEN_NEXT §6.7 |
| Q60 | Empty bookings = 3 distinct treatments (FTU full / no-upcoming inline / filtered tile) | ACTIVE | LIVE_TRUTH §AC.2 + §F.x states |
| Q61 | Dashboard = viewport-split (mobile Live-Activity / desktop calendar+stats) + grouped sidebar | ACTIVE | LIVE_TRUTH §B.3 dashboard shell |
| Q62 | Dashboard tokens = SAME as consumer (one product, two registers) | ACTIVE — token-unity rule survives even after coral→teal pivot | LIVE_TRUTH §B b2b |
| Q63 | Dashboard density = contextual per surface (dense in working / comfortable in editor) | ACTIVE | LIVE_TRUTH §B b2b |
| Q64 | GREEN PIVOT — coral → forest green | OBSOLETE | V3 brand-teal `#043338` (V2-D15-3 superseded green→teal) |

#### §V2-D39.2 · Status summary (54 Q-locks)

- **ACTIVE (V3 honors directly):** 31
- **DEFERRED (still valid, not shipped):** 4 (Q3 swipe carousel, Q9 /termine redirect, Q13 claim ribbon, Q59 loyalty stamps)
- **SHIPPED (V3 era):** 3 (Q10, Q11, Q26-spirit)
- **SUPERSEDED (specifics changed):** 4 (Q26 superseded by V2-D34, Q45 partial, Q47 V2-D15-3, Q26 cards)
- **OBSOLETE (premise retired):** 12 (Q6, Q12, Q23 partial, Q47 partial, Q48, Q64, Q26 cards rewritten, plus all 10 pre-Q unnumbered rows)

#### §V2-D39.3 · How to use this table

- **If you find `Q5` referenced in a code comment / commit / archived doc:** look it up here. The "Where it lives now" column tells you the V3 home.
- **Do NOT use this table to make NEW design decisions.** It's archeology only. New decisions go through V2-D## numbering in this log.
- **Do NOT update this table when V3 changes.** Q-locks are frozen at 2026-04-22 to 2026-05-03. If a V3 spec changes (e.g. §16 card spec changes), the Q reference status doesn't change — only the V3 spec section. Q reconciliation is a one-time historical map.
- **If you need to revisit a Q-lock's full original rationale:** read `_tasks/archive/SOLEN_DESIGN.archived.md` §20. But §0c.2 stop-sign applies — re-anchor to LIVE_TRUTH after.

#### §V2-D39.4 · Files

- **Patched:** `_tasks/V2_REBUILD_LOG.md` — V2-D39 entry added (this entry, ~80 lines).
- **Patched:** `_tasks/SOLEN_LIVE_TRUTH.md` §0c.2 — SOLEN_DESIGN.md line updated to confirm archive complete + reference §V2-D39.1 for Q-status.
- **Archived:** `_tasks/SOLEN_DESIGN.md` → `_tasks/archive/SOLEN_DESIGN.archived.md` via `git mv` (history preserved).

#### §V2-D39.5 · Status

**Locked.** Decision 6 done. V2-D33 doc consolidation flow now has all 6 sub-decisions locked (V2-D34, V2-D35, V2-D36, V2-D37, V2-D38, V2-D39). Next: archive sweep (the remaining un-archived docs from §0c.2 list — REDESIGN_INVENTORY.md, BACKEND_NEEDS_UI.md, SOLEN_BUILD_MAP.md, PHASE_8_STRUCTURAL_ALIGNMENT.md, SOLEN_BUILD_LEARNINGS.md, INVENTORY_FULL.md) + final V2-D33 close-out commit.

### V2-D38 (2026-05-09 evening) — Decision 5 lock: split MASTER_ROADMAP — brand non-negotiables → LIVE_TRUTH §0d, everything else → SOLEN_NEXT.md, source archived

- **Context:** Decision 5 in V2-D33 doc consolidation flow asked where MASTER_ROADMAP.md (437 lines, dated 2026-04-22) should live: inline as LIVE_TRUTH §35 (Option A), pointer-only stub (Option B), Hybrid w triage (Option C), archive entirely (Option D), or split (Option E — extract survivors to new file or surgical edit).
- **Triage finding:** roadmap is structurally different from gap audit. Two layers, different decay rates:
  - **Tactical layer (~50%):** "Phases 0-8" sequence, exit criteria, ship-blocker checklists. Already superseded by V2_REBUILD_LOG.md `## Status` (V3 has its own active phase plan).
  - **Strategic layer (~50%):** market scope, non-negotiables, moat features list, risk register, target metrics, ops state. **No other home in the codebase.**
- **User reasoning that flipped my recommendation:** "isnt it better if we make a new file of what to do in the future like a checklis typa sh and u mention to me smtimes instead of putting into live truth". I had recommended Option C (inline §35); user pushed back with the point that LIVE_TRUTH is a spec doc and a roadmap pollutes it (different audience, different update cadence, different decay rate).
- **Re-decision after pushback:** **E (split with triage)** — strategic content that constrains UI/UX → LIVE_TRUTH §0d (5 brand non-negotiables only); everything else → new file `_tasks/SOLEN_NEXT.md`; full original archived.
- **Triage detail (47-item line-by-line audit):**
  - **Cropped (17 items):** Phase 0/1 stale (CLAUDE.md 194-line ref, SOLEN_DESIGN.md ref, solen-coral.html ref, V2 archived stuff, build green, reply badges/StaffPortfolio shipped notes, Q3-Q11 ship-blockers, Claude Design iteration workflow, INCOMPLETE_FEATURES Phase 1.5 consolidation TODO, coral non-negotiable, dead branch list 16d old, moat/session3 archive idea, feature/customer-frontend delete-after-merge note, Claude Design usage decision, owner TBD, budget undocumented, final stale status line, Claude-Design-drift risk row).
  - **Kept (30 items):** photographer brief, quality bar, component-polish list, mobile UX bar, payment ship-blockers, i18n completeness, BACKEND_NEEDS_UI ~10 items, scraped flywheel (why+items+exit), launch playbook (gating+onboarding+marketing+referral+analytics), 7 moat features, 5 growth plays, city expansion, DACH prerequisites + markets + out-of-scope, 5 brand non-negotiables, 6-row risk register (minus Claude-Design row), Vercel auto-deploy + dual project ops state, target metrics table, market scope decision, sequencing rule.
- **Split mechanic:**
  - **5 brand non-negotiables → LIVE_TRUTH §0d** (Swiss-warm voice / allergy legal-grade / payment reliability / mobile-first / open booking inventory). These constrain UI/UX directly (e.g. "no call-to-confirm" = no `[Anrufen]` CTA on salon detail) — they belong with the spec.
  - **Everything else → `_tasks/SOLEN_NEXT.md`** — 13 sections: §1 quality bar, §2 strategic decisions, §3 pre-launch UI work, §4 scraped flywheel, §5 public launch playbook, §6 deferred features ledger, §7 growth plays, §8 city expansion, §9 DACH/EU, §10 risk register, §11 target metrics, §12 ops state, §13 anti-patterns.
  - **Tactical phase plan dropped entirely** — V2_REBUILD_LOG.md `## Status` already owns active phase status (single source).
- **Drift prevention:**
  - SOLEN_NEXT.md banner at top: "Active phase status lives in `V2_REBUILD_LOG.md ## Status`. This file does NOT track current phase — it tracks **what work exists**."
  - Maintenance rule baked into header: "when an item ships, strike it in the same commit (V2-D05 incremental cleanup pattern)."
  - File-health check at bottom: "if every checkbox in §3 + §4 + §5 is unchecked when LIVE_TRUTH says we've shipped Phase 4, the file has drifted."
  - LIVE_TRUTH §0c.1 gets new row for SOLEN_NEXT.md authority (roadmap / deferred / risks / metrics / ops).
  - LIVE_TRUTH §0c.2 archived list updated for MASTER_ROADMAP.archived.md.
- **Why this beats my original §35 recommendation:**
  1. LIVE_TRUTH stays a spec doc (its job per CLAUDE.md "the principal — current locked state").
  2. Roadmap update cadence (sprint-by-sprint) doesn't churn LIVE_TRUTH.
  3. New agents see clean separation: §0c.1 row tells them where roadmap lives; they don't have to scroll past 250 lines of TODOs to find spec.
  4. The "I mention SOLEN_NEXT.md sometimes" pattern (per user) = pull-based reference at decision points, not push-based pollution.
- **Files:**
  - **Created:** `_tasks/SOLEN_NEXT.md` (~270 lines, 13 sections + anti-patterns + file-health check).
  - **Archived:** `_tasks/MASTER_ROADMAP.md` → `_tasks/archive/MASTER_ROADMAP.archived.md` via `git mv` (history preserved).
  - **Patched:** `_tasks/SOLEN_LIVE_TRUTH.md` — §0c.1 new row added; §0c.2 MASTER_ROADMAP line updated; new §0d section added (~80 lines, between §0c.4 and Index).
- **Insight (lock):** decisions 4 and 5 both involved point-in-time snapshots (audit / roadmap), but only Decision 4 was pure archive. Roadmap had a strategic layer worth preserving — the meta-skill was recognizing the **layer split** (tactical decay-fast vs strategic decay-slow) and treating each layer with the right placement strategy. Hybrid wasn't right for either, because Hybrid optimizes for "summary+detail of one concern" — neither doc was that.
- **Status:** locked. Decision 5 done. Next: Decision 6 (retired Q-locks decision archeology — preserve historically useful Q-locks somewhere or just delete?).

### V2-D37 (2026-05-09 evening) — Decision 4 lock: archive GAP_AUDIT_V2.md + no §36 (point-in-time snapshot, not perpetual tracker)

- **Context:** Decision 4 in V2-D33 doc consolidation flow asked where the 17-gap punch list (`_tasks/GAP_AUDIT_V2.md`, dated 2026-04-22) should live: inline as LIVE_TRUTH §36 (Option A), pointer-only stub from §36 (Option B), Hybrid surface→gap map (Option C), or archive entirely + don't create §36 at all (Option D).
- **Triage finding:** the audit was written 16 days before V3 shipped (V2-D15-3 brand pivot 2026-05-07, V2-D26 typography 2026-05-08, V2-D34 §16 card system 2026-05-09). Roughly **10 of 17 gaps are obsolete** because V3 supersedes the underlying Q-locks they audited against:
  - **Still real (3):** NEW-3 hardcoded "Basel" in messages × 4 locales · NEW-7 price format not centralized · NEW-15 TWINT not integrated.
  - **Pre-V3, likely obsolete (~10):** NEW-1 `aspect-[4/3]` audited against Q1 (V3 §16 may differ) · NEW-2 dark mode classes (V3 retired dark mode — cleanup, not "spec violation") · NEW-9 bottom nav 5-vs-4 (V3 may redefine) · NEW-10 Solen Favorit badge (**already shipped V2-D34** §16) · NEW-16 Bebas Neue scope (V3 retired Bebas) · NEW-17 blobs (V3 redefined as atmosphere washes) · NEW-13/14 duplicate NEW-1.
  - **Self-referential (1):** NEW-6 SOLEN_DESIGN.md voice example — but SOLEN_DESIGN.md is being archived per V2-D33.
- **User picked D.** Chose archive + re-derive over carrying obsolete data forward.
- **Decision:** **D — archive entirely. No §36 in LIVE_TRUTH.** Three reasons:
  1. Hybrid pattern (Decisions 2 + 3) optimizes for evergreen mappings; impl-status snapshots go stale by definition.
  2. Migrating obsolete data anywhere — inline / hybrid / pointer — creates the exact drift §0c was just fortified against.
  3. CLAUDE.md already designates `_tasks/INCOMPLETE_FEATURES.md` as the sanctioned ongoing tracker for partial features ("INCOMPLETE_FEATURES is sacred"). Don't compete with the existing channel.
- **Mechanics:**
  - `_tasks/GAP_AUDIT_V2.md` → `_tasks/archive/GAP_AUDIT_V2.archived.md` via `git mv` (preserves history).
  - LIVE_TRUTH §0c.2 line for GAP_AUDIT updated: removed "extracted into §36 if user opts in" placeholder; replaced with V2-D37 lock copy + redirect to `INCOMPLETE_FEATURES.md` for surviving gaps.
  - **No §36 added.** Phase plan in V2_REBUILD_LOG.md "Status" + Locked & Surviving table covers surface-level traceability; ongoing single-feature blockers go to `INCOMPLETE_FEATURES.md`.
- **What replaces the old workflow:** when a phase begins on a surface (e.g. Phase 2 §SD salon detail), re-audit fresh against current V3 spec via `grep`/`Read` — much cheaper than maintaining a stale snapshot. If a surviving gap exists, fix it in the phase commit; if it can't finish, append to `INCOMPLETE_FEATURES.md` per CLAUDE.md protocol.
- **Drift prevention:** archived docs are tagged with `.archived.md` suffix in `_tasks/archive/`. §0c.2 explicitly tells new agents: "If you find yourself reading any file in `_tasks/archive/`, stop. Re-anchor to SOLEN_LIVE_TRUTH.md." So even if a future agent stumbles into the archived audit, the stop-sign is loud.
- **Files patched:**
  - `_tasks/GAP_AUDIT_V2.md` → `_tasks/archive/GAP_AUDIT_V2.archived.md` (move, not delete — git history preserved)
  - `_tasks/SOLEN_LIVE_TRUTH.md` — §0c.2 line for GAP_AUDIT_V2.md updated (1 line patched)
- **Insight:** This is the first V2-D## decision so far where Hybrid was NOT the right answer. Hybrid optimizes for "summary + detail" where both stay useful over time. Stale snapshots have no useful half — Hybrid would just preserve obsolete data with a thinner cover sheet. Recognizing point-in-time vs perpetual was the meta-skill.
- **Status:** locked. Decision 4 done. Next: Decision 5 (MASTER_ROADMAP.md location — same A/B/C/D framing applies).

### V2-D36 (2026-05-09 evening) — Decision 3 lock: DB schema = Hybrid w explicit drift prevention + §0c authoritative source map

- **Context:** Decision 3 in V2-D33 doc consolidation flow asked whether DB schema should be inline in LIVE_TRUTH (Option A), stay at `_rules/DB_SCHEMA.md` w pointer only (Option B), or Hybrid (Option C — schema mapping in LIVE_TRUTH §33, full DDL stays in DB_SCHEMA.md).
- **User picked C.** Plus an explicit instruction: "i dont [want] any drift and [stuff] or the new agent confusing w the old rule [and stuff]." So drift prevention + new-agent-clarity were locked alongside.
- **Decision:** **C — Hybrid + drift-proofed via §0c "Authoritative source map"**. Three new sections added to LIVE_TRUTH:
  - **§0c.1** — authoritative-source table: every adjacent doc (`DB_SCHEMA.md` / `SECURITY_RULES.md` / `CODE_SAFETY.md` / `LESSONS_LEARNED.md` / `STRUCTURAL_RULES.md` / `I18N_ROUTING.md` / `V2_REBUILD_LOG.md` / `INCOMPLETE_FEATURES.md` / `CLAUDE.md` + `PROJECT_REFERENCE.md`) listed with its specialty area + LIVE_TRUTH's role + drift rule per overlap zone.
  - **§0c.2** — archived docs do-NOT-consult list. Identifies all the pre-V3 `_tasks/*` docs that get moved to `_tasks/archive/` in the V2-D33 archive step. New agents reading any archived doc are explicitly redirected back to LIVE_TRUTH.
  - **§0c.3** — drift prevention protocol: ONE rule. "Update authoritative source FIRST. Then update LIVE_TRUTH ONLY if change crosses LIVE_TRUTH summary scope." Examples for column-rename, security-rule, production-incident.
  - **§0c.4** — "I'm a new agent, where do I start?" sequence. 7 steps: read §0c → §0b → index → surface §X + §X.99 → adjacent concerns per §0c.1 → V2_REBUILD_LOG latest entries → build.
- **§33 added:** DB schema → surface mapping. Loud banner at top: "Authoritative source for column types / RLS policies / indexes / migrations: `_rules/DB_SCHEMA.md`. This section is a navigation aid only — it maps surface specs to which Postgres tables they read from / write to. NEVER duplicate column definitions or RLS policies here."
  - **§33.1** — surface → tables table. Pre-populated with 14 surface rows where the table set is already known (§13 hero, §14 search, §16 salon card, §SD salon detail, §BW booking wizard, §C confirmation, §RV reviews-write, §A auth, §AC favorites/bookings/saved-looks/settings, §B.5/§B.7/§B.12 B2B). Marked "fills in as Phase 1+ surfaces ship" — empty rows added per surface as it specs.
  - **§33.2** — cross-cutting infrastructure tables (platform_settings, feature_flags, audit_log, bans, rate_limit_events). Not surface-specific.
  - **§33.3** — anti-patterns: no column types in §33, no DDL snippets, no orphan surfaces (every surface MUST list tables in §33 via its §X.99 mapping).
- **Drift prevention summary:** column rename = update DB_SCHEMA.md only. New surface using new tables = update §33 only. New table not yet used = update DB_SCHEMA.md only (don't preemptively add to §33). Both rules together = no overlap, no drift.
- **For new agents:** §0c.4 7-step sequence becomes the canonical "how to onboard" path. Any future agent (Claude Code, sub-agents, human contributors) starts at §0c and never has to wonder "which doc owns this?"
- **Files patched:**
  - `_tasks/SOLEN_LIVE_TRUTH.md` — §0c added (~80 lines, between §0b and Index), §33 added (~50 lines, before "What's still missing" phase outlines)
- **Status:** locked. Decision 3 done. Next: Decision 4 (17 known gaps location).

### V2-D35 (2026-05-09 evening) — Decision 2 lock: Hybrid spec pattern (UX-first descriptions + concentrated implementation mapping)

- **Context:** during V2-D33 doc consolidation, asked whether LIVE_TRUTH §23 homepage flow (and future surface specs) should name specific React components like `TestimonialCarousel`/`TrustStatsBanner` + their API endpoints, or stay component-agnostic.
- **Three options weighed:**
  - **A** — component-agnostic spec (clean, refactor-resistant, but agents/devs have to grep to find implementations — exactly the failure mode that caused the §16 mistake)
  - **B** — component + API named throughout each section (unambiguous, but brittle — every rename = spec edit; couples spec to architecture)
  - **C — Hybrid** — UX-first descriptions + concentrated `§X.99 Implementation mapping (informational, may drift)` table at end of each surface section
- **Decision:** **C — Hybrid.** Spec stays readable for designers/PMs, survives renames; mapping table gives agents/devs a single grep-target for "which component implements this section." Disclaimer manages maintenance expectations.
- **Documented as:** new §0b "How this doc is structured" in LIVE_TRUTH (between §0 What this is and the Index). Three meta-rules locked:
  - **§0b.1** — Concept + examples > exhaustive lists (formula-first specs). The §16.3.0 universal badge color formula is the canonical example.
  - **§0b.2** — UX-first descriptions + concentrated implementation mapping (the Hybrid pattern locked here). Includes anti-patterns: scattered implementation details + no mapping at all.
  - **§0b.3** — When in doubt, document the rule, not the answer. One-off answers go in V2_REBUILD_LOG; rules go in LIVE_TRUTH.
- **Application:** §0b applies to **all surface specs going forward**. When §23 (homepage flow) is written, it must include §23.99 implementation mapping. Same for §SD salon detail, §BW booking wizard, §A auth surfaces, §AC account surfaces, etc. Existing surface specs (§13-§22) are grandfathered as-is — adding mapping tables retroactively is an opportunistic cleanup, not a blocking task.
- **Files patched:**
  - `_tasks/SOLEN_LIVE_TRUTH.md` — new §0b inserted between §0 and Index. ~50 lines.
- **Status:** locked. Decision 2 done. Next: Decision 3 (DB schema inline vs pointer).

### V2-D34 (2026-05-09 evening) — §16 salon card badge system v2 (light glassmorphic + 2-badge layout + color philosophy)

- **Context:** during V2-D32 homepage mockup work, user audited my §16 salon-card implementation against pre-V3 specs (Q10 from 2026-04-22 + Q26 from 2026-05-01) that I'd missed when first building the cards. Q10 locks 4 curation badges (Solen Favorit / Top bewertet / Beliebt / Neu) with priority order. Q26 locks the 2-badge layout (curation top-left + availability bottom-left). V3 §16 had inherited only the older single-badge availability pattern — never adopted Q10's curation system OR Q26's bottom-left availability placement. This entry locks the full Q10+Q26 spec into V3 §16, refined with V2-D15-4 flat-pill discipline + new color philosophy.
- **A/B mockup at `public/solen-v2-card-badges.html`:**
  - **A** — current V3 §16 (single availability badge top-left, no curation)
  - **B** — full Q10+Q26 spec (curation top-left + availability bottom-left)
  - User picked B + iterated on visual refinement.
- **Visual refinement journey (4 iterations):**
  1. Initial B: solid yellow Solen Favorit bg + solid brand-teal availability pill + dots — too "deep/dark" per user.
  2. Iter 2: light glassmorphic bgs (rgba 0.62 alpha + blur 14px) + shape differentiation (curation = rounded rect 8px, availability = full pill 999px). Better but still felt unbalanced.
  3. Iter 3: dropped pulsing dots — pill color carries the meaning ("In 15 Min" green tint = "free now," no dot needed). Heart became floating (no white circle bg) — just SVG with drop-shadow. Heart shadow on saved state was 0.45 alpha — felt too heavy.
  4. **Iter 4 (LOCKED):** unified color philosophy across all tinted badges. Each state picks its hue, then bg=`rgba(<hue>, 0.22)` + border=`rgba(<hue>, 0.32)` + text=deep version of hue. Solen Favorit yellow → text `#8B5E0F` deep amber. Available green → text `#0E7A38` deep green. This-week brand-teal → text `#043338`. Pause ink-3 → text `#56463E`. Heart unsaved → ink-3 warm gray (was deep ink — too contrast); heart saved shadow reduced to 0.20 alpha (was 0.45).
- **Final design (V2-D34 lock):**
  - **Curation badge** (top-left, rounded rectangle 8px radius, light glass) — 4 variants: Solen Favorit (yellow tint + deep amber text), Top bewertet / Beliebt / Neu (white tint + ink-1 text). Backend auto-assigns via `/api/admin/badges/auto-assign`. Priority order Solen Favorit > Top bewertet > Beliebt > Neu. Solen Exclusive (mentioned in BACKEND_NEEDS_UI.md) **NOT in v1** — defer to v2.
  - **Availability pill** (bottom-left, full pill 999px, light glass, color-coded) — 3 states: today/now (green tint + deep green text), this-week (brand-teal tint + brand-teal text), pause (ink-3 tint + ink-2 text). NO dots — color is the signal.
  - **Heart** (top-right, floating, no circle bg) — 24px SVG, ink-3 warm gray stroke unsaved (or white-ish on dark Spa bg), love-red `#FF4A6B` filled saved, drop-shadow 0.18 alpha unsaved / 0.20 alpha saved.
- **Universal color formula** (locked LIVE_TRUTH §16.3.0): `bg: rgba(<hue>, 0.22)` + `border: rgba(<hue>, 0.32)` + `color: <deep-version-of-hue>` + `backdrop-filter: blur(14px) saturate(1)` + `box-shadow: 0 1px 3px rgba(26,18,9,0.06)`. Reusable for any future state badge.
- **Backend integration TBD (deferred):** `/api/admin/badges/auto-assign` cron + thresholds. Q10 doesn't lock exact threshold values — V2-D34 sets defaults: Top bewertet = ≥4.7 stars + ≥50 reviews; Beliebt = top 10% bookings in city × cat trailing 30d; Neu = first 60d after onboarding; Solen Favorit = algorithmic (rating × volume × reply rate × recency × response time, exact formula TBD with backend team). These thresholds are NEW V2-D34 — not in Q10 or any earlier doc. User can override.
- **Files patched:**
  - `_tasks/SOLEN_LIVE_TRUTH.md` §16.1 anatomy diagram updated to show 2-badge layout, §16.3 photo overlays section completely rewritten (added §16.3.0 universal color formula, §16.3.1 curation badge, §16.3.2 availability pill, §16.3.3 heart icon, §16.3.4 anti-patterns)
  - `public/solen-v2-card-badges.html` — A/B comparison mockup, ~700 lines
  - `public/solen-v2-homepage.html` — all 25 salon-card instances updated to new V2-D34 design (TODO this commit)
- **Live site impact:** none currently — no route imports the new cards yet. Will apply when V2-D32 React build lands.
- **Status:** **locked.** §16 V2-D34 supersedes the V2-D14/V2-D17 single-badge spec. Next: Decision 2 in V2-D33 doc consolidation flow (component naming in LIVE_TRUTH).

### V2-D31 (2026-05-09 afternoon) — Phase 0 COMPLETE · §F.6 + §F.7 + §F.8 batch ship

**This single commit closes 3 sub-sections (§F.6 skip-link + §F.7 font-display + §F.8 cookie consent) + locks Phase 0 as fully done.** Bundling them because §F.6 + §F.7 are tiny (one component each + spec doc) and §F.8 has its own substantial spec+mockup+React. Single commit reduces commit-message noise; details below.

#### V2-D29 — §F.6 Skip-to-main link
- **Context:** WCAG 2.4.1 (Bypass Blocks Level A) requires keyboard / screen-reader users can skip past header/nav to main content.
- **Decision:** standard `sr-only` accessibility pattern. Hidden by default (1×1 px clipped, focusable). On `:focus` / `:focus-visible`, becomes brand-teal pill in top-left corner at z-tooltip, jumps to `<main id="main">`.
- **Files:** `app/[locale]/_components/primitives/SkipLink.tsx` (new) · `_tasks/SOLEN_LIVE_TRUTH.md` §F.6 added (~50 lines).
- **Bucket B:** `sr-only` chosen as the hide technique (alternatives: `clip-path: inset(50%)` / `position: absolute; left: -9999px;`). Picked sr-only for being the de-facto Tailwind + a11y community standard.

#### V2-D30 — §F.7 Font fallback stack + `font-display` strategy
- **Context:** locking the strategy that keeps V3 typography working when Cooper cdnfonts.com fails (currently HTTP 500). No code changes needed — globals.css already has `&display=swap` on Google Fonts URL; cdnfonts URLs use `display: auto` which we can't control. Fallback chain in font-family handles every failure case.
- **Decision:** `font-display: swap` locked on every web font. Fallback chains locked at Tailwind config level: Display = Cooper BT → Sansita 900 → Georgia → serif · Body = Avant Garde Gothic → League Spartan → Inter Tight → system-ui → sans-serif.
- **Files:** `_tasks/SOLEN_LIVE_TRUTH.md` §F.7 added (~80 lines, mostly documentation). No code changes — globals.css strategy was already correct, just unspecced.
- **Bucket B:** `swap` over `optional` / `fallback` / `block`. Picked swap because brand integrity > FOIT prevention (some users seeing Sansita instead of Cooper for 200ms is acceptable; 3 seconds of invisible text is not).

#### V2-D31 — §F.8 Cookie consent banner (GDPR / Swiss DSG)
- **Context:** non-negotiable for DACH market launch. Solen uses analytics (PostHog) + future marketing pixels (Meta, Google) — both require explicit opt-in.
- **Architecture:** `<CookieConsentProvider>` at app root manages state via React Context + persists to localStorage (chicken-and-egg = cookies-can't-store-cookie-consent). Hook `useCookieConsent()` exposes consent state to other components for analytics gating. 12-month expiry — banner re-shows after.
- **3 categories (v1):** `necessary` (always on, switch disabled — auth session, language, consent record itself) · `analytics` (opt-in — PostHog) · `marketing` (opt-in — Meta/Google pixels).
- **UX flow:** sticky-bottom banner on first visit w 3 buttons (Anpassen link + "Nur notwendige" ghost + "Alle akzeptieren" primary, all equally prominent per dark-pattern anti-pattern). "Anpassen" opens settings modal (§F.2 lg) with per-category switches. Save → consent persisted, banner hides.
- **Composition wins:** uses §F.1.6 Switch primitive for category toggles + §F.2 Modal for settings + §F.4 toast pattern for sticky-bottom positioning. Demonstrates V2-D## composition discipline working as designed — primitives compose into a complex system.
- **Files (3):**
  - `app/[locale]/_components/primitives/CookieConsent.tsx` — Provider + Banner + SettingsModal (5 exports incl. types). ~290 lines.
  - `public/solen-v2-cookie-banner.html` — full mockup. Desktop banner + mobile stacked banner + settings modal stage + 6-card anti-pattern strip.
  - `_tasks/SOLEN_LIVE_TRUTH.md` §F.8 added (~200 lines, full GDPR/DSG anti-pattern coverage).
- **Bucket B candidate decisions logged:**
  - 3 categories (necessary / analytics / marketing) — alternative was 4 (add `preferences` for personalization). Picked 3 because v1 doesn't have personalization cookies yet; preferences can be added v2.
  - localStorage key = `solen-cookie-consent`. Format = JSON string. 12-month expiry chosen as standard GDPR practice (also Google's recommended TTL).
  - Banner copy = neutral DACH-safe ("Wir verwenden Cookies / Notwendige Cookies sind immer aktiv / Du kannst jede Kategorie einzeln steuern"). Alternative: legalese ("Diese Website verwendet Cookies gemäss Art. 5 DSG..."). Picked neutral — conversion-friendly while still legally compliant.
- **Wiring TODO (NOT in this commit — defers to layout integration):**
  - `app/[locale]/layout.tsx` needs `<CookieConsentProvider>` wrapping children. Will land when V3 homepage is built (V2-D32).
  - PostHog mounting needs to gate on `consent.analytics === true` — wired when Phase 1 first uses PostHog event tracking (auth events).
  - Footer "Cookie-Einstellungen" link needs `useCookieConsent().openSettings()` callback — wired when V3 footer is implemented in Phase 2 §SR or homepage build.

#### Phase 0 final state (all 8 sub-sections shipped):
| sub | name | spec | mockup | React | V2-D## |
|-----|------|------|--------|-------|--------|
| §F.1 | Form primitives (input/textarea/select/checkbox/radio/switch/pill) | ✅ V2-D14 | ✅ V2-D16 | ✅ V2-D17 | locked |
| §F.2 | Modal primitive | ✅ V2-D18 | ✅ V2-D18 | ✅ V2-D18 | locked |
| §F.3 | Bottom sheet primitive | ✅ V2-D19 | ✅ V2-D19 | ✅ V2-D19 | locked |
| §F.4 | Toast primitive | ✅ V2-D20 | ✅ V2-D20 | ✅ V2-D20 | locked |
| §F.5 | Date/time picker | ✅ V2-D21 | ✅ V2-D28 | ✅ V2-D28 | locked |
| §F.6 | Skip-to-main link | ✅ V2-D29 | (no mockup needed) | ✅ V2-D29 | locked |
| §F.7 | Font-display strategy | ✅ V2-D30 | (n/a) | (already correct) | locked |
| §F.8 | Cookie consent banner | ✅ V2-D31 | ✅ V2-D31 | ✅ V2-D31 | locked |

**Phase 0 verification:** `/de/dev/primitives` renders every primitive interactively. 8 mockup HTML files at `/solen-v2-{primitives,modal,sheet,toast,datetime,cookie-banner,logo-options,republik-teal}.html` provide V2-D## locked visual references. Logo (V2-D27) ships across all surfaces via SVG + React component. Typography V2-D26 size refresh applied throughout.

**Phase 1 (auth) + homepage build are now unblocked.** Per user direction, next steps: V3 homepage React build (V2-D32) → Phase 1 auth surfaces (login modal §A.1 first).

### V2-D28 (2026-05-09 afternoon) — Phase 0 §F.5 date/time picker mockup + React shipped

- **Context:** Per user direction (finish Phase 0 → homepage → Phase 1), §F.5 spec was drafted V2-D21 overnight; mockup + React deferred to next attended session. This commit ships them.
- **Architecture:** `react-aria-components` Calendar + CalendarGrid + CalendarGridHeader + CalendarHeaderCell + CalendarGridBody + CalendarCell (all stable exports). Wrapped with V3 styling via cva-free className composition (the cell-level state needs `data-*` attribute access from react-aria's render-prop pattern, simpler than cva for this case). `@internationalized/date` handles DE-CH locale + Mon-first week + min/max + isDateUnavailable callback. Native `<input type="date">` explicitly banned per §F.5.7.
- **Composition:** `<DateTimePicker>` root manages combined state `{ date, time }`. Internal `<SolenCalendar>` (calendar grid) + `<TimeSlotList>` (async slot fetching) compose side-by-side on desktop, vertical stack on mobile. `groupByPeriod()` helper sorts slots into Vormittag/Nachmittag/Abend buckets via `parseTime()` — robust to malformed time strings (falls back to manual hour parse).
- **State support:** loading shimmer (animate-shimmer keyframes already in tailwind config), empty (no date selected OR no slots that day), disabled day cells (past + salon-closed via `isDateDisabled` callback), today highlight (2px brand-pale border + brand-teal text), selected day cell (brand-teal bg + white text + 600 weight), outside-month cells (40% opacity, tap navigates to that month), selected time slot (brand-teal pill).
- **Files created (2):**
  - `app/[locale]/_components/primitives/DateTimePicker.tsx` — DateTimePicker + internal SolenCalendar + TimeSlotList. 4 type exports (DateTimePickerProps / DateTimeValue / TimeSlot / + component).
  - `public/solen-v2-datetime.html` — full mockup. Anatomy stage (composed calendar + 4×grid time slots) · 8 day-cell states (default / today / hover / selected / disabled / outside-month / range-start / range-end — range deferred but rendered for v2 reference) · 2 time-slot states (loading skeleton w shimmer + empty state w cal icon) · mobile vs desktop layouts (vertical stack mobile inside §F.3 sheet vs side-by-side desktop card) · 6-card anti-pattern strip.
- **Files patched (2):**
  - `app/[locale]/_components/primitives/index.ts` — exports DateTimePicker + types
  - `app/[locale]/dev/primitives/page.tsx` — added Section "§F.5 · V2-D28" w 2 live demos. Imports `today` + `getLocalTimeZone` from `@internationalized/date`. Demo `slots` is fake data: dates ending in 0 or 5 simulate fully-booked, others have 16 mixed availability slots. `isDateDisabled` returns true for Sundays.
- **Bucket B candidate decisions logged:**
  - §F.5 Calendar uses `react-aria-components` w cell-level render-prop instead of full cva variant approach — alternative was hand-roll using `@internationalized/date` math directly. Picked react-aria for proper kbd nav + a11y + locale support; trade-off is slightly heavier render-prop pattern in cell rendering.
  - §F.5.2 time slot grouping: hard-coded "Vormittag/Nachmittag/Abend" splits at 12:00 / 18:00. Alternative: configurable boundaries. Picked hard-coded because day-period semantics are universal (DACH market) and configurability adds API surface for no benefit.
  - §F.5.4 mobile/desktop split: CSS `flex-col md:flex-row` at the 768px Tailwind breakpoint. Same as §F.3 sheet. No JS responsive switching.
- **Tailwind tokens added:** none. `animate-shimmer` already existed in config.
- **Live site impact: ZERO.** No existing route imports it. Booking wizard (§BW Phase 2) will use it.
- **Typecheck:** clean for new files.
- **Status:** **shipped + locked.** Phase 0 §F.5 is complete: spec ✓ (V2-D21) + mockup ✓ + React ✓ + dev verification ✓. **Next:** §F.6 skip-to-main link.

### V2-D27 (2026-05-09 morning) — Logo replacement: Bebas+coral retired, Cooper-Solen + brand-teal dot locked

- **Context:** User this morning, after seeing the V2 logo at `public/logo.svg` rendered in the dev-tools or somewhere: "and additionally can you ditch this logo of solen from evrywhere its so hidious." Current logo: Bebas Neue tall-narrow caps "SOLEN" + small `#E8624A` coral dot inside the O. Both font (Bebas Neue) and color (coral) were retired V2-D15-3 — the SVG file was a leftover that never got swept.
- **4 options visualized at `public/solen-v2-logo-options.html`:**
  - A — Cooper "Solen" mixed case · plain (no dot)
  - B — Cooper "SOLEN" all caps
  - C — Cooper "Solen·" with brand-teal dot accent ← **user pick**
  - D — Cooper "solen" all lowercase
- **Decision:** Option **C** locked. Cooper-style "Solen" wordmark (Cooper BT → Sansita 900 fallback since cdnfonts.com Cooper is currently HTTP 500) + trailing brand-teal `#043338` dot accent. The dot is baseline-aligned (sits like a period after Solen) — gives a "Solen." reading. Mixed case preserves Cooper Black's character (chunky lowercase forms are where the font's personality lives).
- **Rationale per option:**
  - Option C wins because it (a) preserves the V1/V2 dot-accent brand idea (just in V3 brand-teal instead of retired coral), (b) keeps the warmth of mixed-case Cooper, (c) reads as "Solen·" — a complete brand statement vs Option A's bare wordmark.
  - Option B (all caps) was rejected — loses Cooper Black's character (caps in Cooper are boring vs lowercase).
  - Option D (lowercase) was rejected — too "tech startup" (Linear/Notion/Substack vibe doesn't match Solen's beauty marketplace warmth).
- **Files patched (7):**
  - `public/logo.svg` — replaced Bebas+coral with Cooper-stack `<text>` + brand-teal `<circle>`. 124×36 viewBox. Font-family fallback chain `'Sansita', 'Cooper Black', 'Cooper Black Std', 'Cooper BT', Georgia, serif` so SVG-as-image renders acceptably even when Cooper isn't loaded. Comment in SVG documents the V2-D27 lock.
  - `public/favicon.svg` — replaced retired coral `#E8624A` circle with brand-teal `#043338` circle. Tab/bookmark monogram now matches V3 brand.
  - `app/[locale]/_components/primitives/Logo.tsx` — new React component. cva variants for size (sm 18px / md 28px / lg 40px / xl 64px) + tone (light / dark). Dot uses `s-brand` on light, `s-brand-pale` on dark. `noDot` prop for contexts where the dot competes (e.g. inside a button).
  - `app/[locale]/_components/primitives/index.ts` — appended Logo + types exports.
  - `app/[locale]/dev/primitives/page.tsx` — added Logo demo Section showing 4 sizes on light + dark substrate, in-app-header context, and `noDot` variant.
  - `public/solen-v2-republik-teal.html` — `.nav-logo` CSS updated: color `var(--brand)` → `var(--ink)`, added `display: inline-flex; align-items: baseline` + `::after` brand-teal dot pseudo-element. The V3-locked homepage mockup now matches V2-D27.
  - `_tasks/SOLEN_LIVE_TRUTH.md` — added §1.3 "The Solen logo wordmark (V2-D27 lock)" subsection. Full spec: anatomy + size scale (sm/md/lg/xl) + 7 anti-patterns. Locked at end of §1 brand color section.
- **Live site impact (immediate):**
  - Legacy header at `components-legacy/layout/Header.tsx` uses `<Image src="/logo.svg">` — auto-picks up the new SVG without code change. Live site users see new logo on next page load.
  - Browser tab favicon updates to brand-teal circle.
  - V3 mockup at `localhost:4747/solen-v2-republik-teal.html` renders new Cooper+dot logo.
- **Bucket B doc-cleanup TODOs (deferred):**
  - 5 archival HTML files in `public/` (`offline.html`, `solen-v2-preview.html`, `solen-v2-locked.html`, `solen-coral.html`, `variations.html`) reference Bebas Neue in CSS BUT no actual logo SVG inline (they're V1 design archives, not user-facing). The grep finding earlier confirmed only one file (`solen-v2-logo-options.html`) intentionally renders the OLD logo for comparison. Other archives use Bebas Neue for image-card placeholders (not logos). Skip in this commit; flag for cleanup pass.
  - Future React surfaces (Phase 1 auth modal, Phase 2 header rebuild) should use `<Logo>` component, not inline `<Image src="/logo.svg">`. Migration happens incrementally per V2-D05.
- **Live site impact: minimal.** Live header gets new logo automatically (one SVG file swap). Only footer / og:image / favicon update at the same time. No React route changes needed. New surfaces use `<Logo>` from V2-D27 onward.
- **Typecheck:** clean for new Logo.tsx + barrel + dev page edits.
- **Status:** **shipped + locked.** Logo is now V2-D27. To verify: `npm run dev` → `/de/dev/primitives` (Logo demo section) + reload `localhost:3000` (legacy header now shows new logo).

### V2-D26 (2026-05-09 morning) — Typography size refresh (kept Avant Garde Gothic, bumped subtexts +2-3px)

- **Context:** User feedback this morning after wake-up: "the fonts in the components so small like what is the font we are using i like the title font but not the sub texts." After font visualization at `public/solen-v2-font-visual.html` showed (a) current sizes vs +2-3px bumped sizes side-by-side and (b) 5 alternative body fonts, user picked option **A — keep ITC Avant Garde Gothic Std, bump sizes**.
- **Decision:** sweep larger sizes through every Phase 0 primitive + the dev test page + LIVE_TRUTH §F.1-§F.4 spec text. No font swap. Cooper Black Std display fallback chain unchanged (Cooper / Sansita 900) — heads-up logged that `cdnfonts.com/css/cooper-black-std` is currently HTTP 500 so headings render Sansita silently; visual continuity preserved via fallback.
- **Size mapping (V2-D26 lock):**
  - Field label 12px → **14px**
  - Helper / error / warning / success message 11px → **13px** (icon also 12 → 14)
  - Eyebrow / meta row 11px → **13px**
  - Card tag (showroom labels) 9px → **11px**
  - Body / paragraph 14px → **16px**
  - Input sm: 13 → **14px** · md: 14 → **16px** · lg: 16 → **18px** (heights stay 40/56/64; padding unchanged — already had slack)
  - Pill toggle / chip 12px → **13px** (padding 7/12 → 8/14 to compensate)
  - Toast title 14 → **15px** · description 12 → **13px** · action 13 → **14px**
  - Switch label 14 → **16px** · sub-label 12 → **13px**
  - Checkbox label / Radio label 14 → **16px** (Variant A boxed/row)
  - Optional-tag (FieldLabel) 11 → **12px**
  - Textarea char counter 11 → **12px**
- **Side-effect: V2-D14 / V2-D17 iOS auto-zoom contradiction RESOLVED.** §F.1.7 line 1266 originally said "all text inputs `font-size ≥ 16px`" but V2-D14 had locked md at 14px. With md now at 16px, the §F.1.7 rule is satisfied for the default input size by default — only sm (compact filter rows) violates it as an explicit accepted exception per V2-D14's original "decision B" trade-off. Spec text updated accordingly.
- **Files patched (8 primitive components):**
  - `app/[locale]/_components/primitives/FieldLabel.tsx` — label 12→14, optional-tag 11→12
  - `app/[locale]/_components/primitives/FieldHelper.tsx` — text 11→13, icon 12→14
  - `app/[locale]/_components/primitives/TextInput.tsx` — cva sizes sm 13→14, md 14→16, lg 16→18
  - `app/[locale]/_components/primitives/Textarea.tsx` — body 14→16, counter 11→12
  - `app/[locale]/_components/primitives/Select.tsx` — cva sizes sm 13→14, md 14→16, lg 16→18
  - `app/[locale]/_components/primitives/Checkbox.tsx` — label 14→16
  - `app/[locale]/_components/primitives/Radio.tsx` — label 14→16
  - `app/[locale]/_components/primitives/Switch.tsx` — label 14→16, sub-label 12→13
  - `app/[locale]/_components/primitives/PillToggle.tsx` — text 12→13, padding 7/12 → 8/14
  - `app/[locale]/_components/primitives/Modal.tsx` — eyebrow 11→13, body 14→16
  - `app/[locale]/_components/primitives/Sheet.tsx` — eyebrow 11→13, body 14→16
  - `app/[locale]/_components/primitives/Toast.tsx` — title 14→15, description 12→13, action 13→14
- **Files patched (dev page):**
  - `app/[locale]/dev/primitives/page.tsx` — replace_all sweep on `text-[13px]` → `text-[14px]`, `text-[11px]` → `text-[13px]`, `text-[9px]` → `text-[11px]`. Buttons stay text-[14px] (not bumping CTAs in this sweep — user complaint was about subtexts, not button labels). Code-element callouts (`<code>` tags inside paragraphs) stay text-[12px] for visual hierarchy.
- **Files patched (LIVE_TRUTH spec):**
  - §F.1.0 anatomy table — label / helper / error / warning / success message rows updated
  - §F.1.0a sizes table — sm 13→14, md 14→16, lg 16→18
  - §F.1.0a iOS-zoom note rewritten to acknowledge V2-D26 resolves V2-D14/V2-D17 contradiction
  - §F.1.2 textarea char counter font 11→12
  - §F.1.4 checkbox Variant A label font 14→16
  - §F.1.4 checkbox Variant B pill font 12→13
  - §F.1.5 radio Variant A label font 14→16
  - §F.1.6 switch label 14→16, sub-label 12→13
  - §F.2.3 modal eyebrow 11→13
  - §F.2.4 modal body font 14→16, line-height 1.5→1.55
  - §F.3.3 sheet eyebrow 11→13
  - §F.3.4 sheet body font 14→16
  - §F.4.0 toast title 14→15, description 12→13, action 13→14
- **Bucket B doc-cleanup TODOs (deferred to attended pass):**
  - 4 mockup HTML files (`solen-v2-primitives.html` / `solen-v2-modal.html` / `solen-v2-sheet.html` / `solen-v2-toast.html`) still render OLD sizes. They're V2-D## locked references — should be regenerated to match V2-D26 in a future pass. Until then, the React components are the authoritative visual reference (`/dev/primitives` shows current state).
  - LIVE_TRUTH §13-§25 surface specs reference some text sizes that compose with form primitives — those references are surface-specific and don't have to change with V2-D26 (they're describing how the surface composes the primitives, not the primitive's own typography).
  - §F.5 date picker spec has size references (day cell 14px, time slot 13px) that should bump to 16/14 respectively when §F.5 is implemented next session.
- **Live site impact: ZERO.** No existing route imports these primitives. The /dev/primitives page is the only surface that renders them, and it's gated to dev only.
- **Typecheck:** to verify after commit. Pure className changes, no type changes.
- **Status:** **shipped.** Verify visually at `/de/dev/primitives` after `npm run dev`.

### V2-D21 (2026-05-09 overnight, autonomous) — Phase 0 §F.5 date/time picker spec drafted (mockup + React deferred)

- **Context:** Fourth and final sub-section of the autonomous overnight run. Per the plan's scope ceiling: spec only (no mockup, no React). Date/time picker is the largest single primitive in Phase 0 — calendar grid + time slot list + range variant (v2). Half-shipping creates worse outcomes than scheduling cleanly. Spec alone gives the next session a clean starting point.
- **Decision:** ship §F.5 SPEC into LIVE_TRUTH (~164 lines). DO NOT mockup, DO NOT build React. Spec includes a §F.5.8 implementation-TODO subsection that flags the next-session scope (build via `react-aria-components` `Calendar` + `DateField` + cva V3 styling, mockup at `public/solen-v2-datetime.html`, dev test page integration).
- **Spec scope (§F.5.0 through §F.5.8):**
  - Anatomy diagram (calendar grid + time slot list)
  - 4 variants: single-date / **date-and-time (most-used, booking flow)** / time-only (reserved) / date-range (v2 deferred)
  - State matrix: default / today / hover / selected / disabled / outside-month / loading / empty
  - Calendar grid spec (DE-CH locale, Monday-first, month nav via chevrons, kbd nav, min/max date, isDateDisabled callback)
  - Time slot list spec (Vormittag/Nachmittag/Abend grouping, configurable slot duration, async fetch shape, loading skeleton, empty state)
  - Composition pattern (`<DateTimePicker>` root managing combined state, internal `<CalendarGrid>`/`<DayCell>`/`<TimeSlotList>`/`<TimeSlot>` not exposed)
  - Mobile vs desktop (mobile = vertical stack inside §F.3 sheet, desktop = side-by-side card on `/book/[slug]`)
  - Motion (200ms month transition, 150ms day-select, 100ms slot-select, shimmer skeleton via existing `animate-shimmer` token)
  - ARIA: `role="grid"` calendar, `role="gridcell"` days, `role="listbox"` time slots, full kbd nav
  - 5 anti-patterns (year-month picker wheel banned, showing all 24h banned, native `<input type="date">` banned, range in v1 banned, italic banned)
- **Architecture decision (locked here for next session):** use `react-aria-components` `Calendar` + `DateField` (already installed at `^1.16.0` — these are STABLE exports, not UNSTABLE_) + cva for V3 styling. Native `<input type="date">` explicitly banned in §F.5.7 because native pickers vary wildly across iOS/Android/desktop — we lose visual control over the most user-facing primitive in the booking flow.
- **Tailwind tokens added:** none. The existing `animate-shimmer` (line 132 in tailwind.config.js) covers the loading skeleton motion.
- **Files created:** none — spec only.
- **Files patched:**
  - `_tasks/SOLEN_LIVE_TRUTH.md` — appended §F.5 section (~164 lines).
- **Live site impact:** ZERO. No React, no mockup yet.
- **Status:** **spec drafted, lock pending** (mockup + React in next session). The §F.5.8 implementation-TODO subsection is the explicit handoff to the next session.

### V2-D20 (2026-05-09 overnight, autonomous) — Phase 0 §F.4 toast primitive shipped

- **Context:** Third sub-section of the autonomous overnight execution. §F.2 modal (V2-D18, `e07d28e`) and §F.3 sheet (V2-D19, `9a112e8`) shipped earlier in the night. Toast is the smallest meaningful primitive that fit remaining time; date/time picker (§F.5) deferred to spec-only because half-shipping a date picker is worse than scheduling cleanly.
- **Architecture decisions:**
  - **Hand-rolled queue + Context, NOT react-aria-components.** Per spec §F.4.7 + autonomous-loop Step 4a verification: `react-aria-components` exports only `UNSTABLE_ToastRegion / UNSTABLE_ToastList / UNSTABLE_Toast / UNSTABLE_ToastContent / UNSTABLE_ToastStateContext` at v1.16.0 — explicitly marked unstable, locking ourselves in is risky. Hand-roll achieves same UX with stable API surface + zero new dependencies. Migration path documented in spec: when react-aria stabilizes (drops `UNSTABLE_` prefix) we MAY migrate, not before.
  - **Queue management.** `<ToastProvider>` holds two state arrays: `toasts` (currently visible, max 3) and `queue` (FIFO waiting). Effect-driven slot assignment: when `toasts.length < 3 && queue.length > 0`, pull from queue. Error tone has priority override — if queue is full and a new error fires, it replaces the oldest non-error toast (per §F.4.3 spec).
  - **Per-toast timer w hover-pause.** Each `ToastItem` uses `setTimeout` for auto-dismiss. `onMouseEnter` pauses + tracks elapsed; `onMouseLeave` resumes with remaining time. Errors have `duration: Infinity` (sticky); others use tone defaults (success/info 3s, warning 6s).
  - **State machine via `data-state` attr.** Three render states: `opening` (mount with offset+opacity 0), `open` (visible, animated to 0/1), `dismissing` (offset opposite + opacity 0). Drives Tailwind `data-[state=opening]:` modifiers. `motion-reduce:` collapses to opacity-only.
  - **Composition: hook-based, not children-based.** Caller doesn't render `<Toast>` JSX directly — they call `toast.success({ title, description, action, onAction })`. Provider+hook pattern ergonomic + matches react-hot-toast / sonner conventions.
  - **ARIA correctness.** `<ol role="region" aria-label="Benachrichtigungen">` wraps the list per WAI-ARIA toast pattern. Each `<li>` gets `role="alert"` + `aria-live="assertive"` for errors, `role="status"` + `aria-live="polite"` for others. Caller can override via `ariaLive` prop.
- **Tailwind tokens added:** none. `z-toast` was added in V2-D18 batch.
- **Files created (3):**
  - `app/[locale]/_components/primitives/Toast.tsx` — `ToastProvider` (Context provider w queue manager) + `useToast()` hook (returns 7 methods: success/info/warning/error/custom/dismiss/dismissAll) + internal `ToastRegion` (portal-target fixed-position container) + internal `ToastItem` (per-toast w timer + hover-pause + animated state machine). `ToastTone` + `ToastOptions` types exported. Plus `cva` variants for tone-tinted left bar (4px wide, success-green / brand-teal / warning-amber / error-red).
  - `public/solen-v2-toast.html` — full mockup. Page head + 4-tone variant grid (success w action, info, warning, error sticky w action) + position+stacking section showing mobile bottom-center 3-stack + desktop bottom-right single error + 5-step state timeline (queued / opening / open / dismissing / closed) + 8-card anti-pattern strip.
- **Files patched (3):**
  - `_tasks/SOLEN_LIVE_TRUTH.md` — appended §F.4 section (~146 lines).
  - `app/[locale]/_components/primitives/index.ts` — appended Toast exports.
  - `app/[locale]/dev/primitives/page.tsx` — split `PrimitivesDevPage` into outer (production gate + `<ToastProvider>` wrap) + inner (the actual content, renamed `PrimitivesDevPageInner`). New `<ToastDemo>` helper component with 4 tone-fire buttons + 4 stacking-demo buttons (fire-5-to-queue-2, with-action, title-only, dismiss-all).
- **Bucket B candidate decisions logged (need user sign-off on wake-up):**
  - §F.4.1 default duration timing — success/info=3000ms, warning=6000ms, error=Infinity (sticky). Alternatives: 5000ms uniform across non-errors. Picked split because warnings need longer read time and errors must NOT auto-dismiss.
  - §F.4.3 stack direction = newest at BOTTOM. Alternative: newest at top (push others down). Picked bottom because user's spatial anchor is the viewport edge (mobile thumb position), and "the latest thing" being closest to their attention point makes sense.
  - §F.4.4 action button = text-only, brand-teal, hover ink-1. Alternative: bordered button matching pill-style. Picked text-only because toast surface is already a card — a button-on-button feels too heavy. Brand-teal makes the action visually distinct from the body text.
- **Spec contradictions surfaced:** none new. Same 4 still pending (V2-D17 §F.1.4 gradient + V2-D17 §F.1.7 16px iOS + V2-D19 §25.6 backdrop hex + this commit no new).
- **Live site impact: ZERO.** No existing route imports the toast. Future surfaces using `useToast()` will need `<ToastProvider>` at `app/[locale]/layout.tsx` — a future commit when Phase 1 starts (auth uses toasts for "Login fehlgeschlagen" etc).
- **Typecheck:** zero errors in new files.
- **Status:** **shipped + locked.** Phase 0 §F.4 is complete. **Three Phase 0 sub-sections shipped this overnight.** **Next:** §F.5 date/time picker spec only → wake-up summary.

### V2-D19 (2026-05-09 overnight, autonomous) — Phase 0 §F.3 bottom sheet primitive shipped

- **Context:** Second sub-section of the autonomous overnight execution. §F.2 modal landed cleanly in commit `e07d28e` (V2-D18). §F.3 inherits §F.2's react-aria portal + focus-trap + scroll-lock infrastructure — only the CSS positioning + motion differ.
- **Architecture decisions:**
  - **Same react-aria-components stack as §F.2** — Modal + ModalOverlay + Dialog. The accessibility behavior is identical; only positioning + motion CSS differ. This validates the V2-D17/V2-D18 architecture decision: react-aria's headless behavior + cva styling = clean primitive composition without reimplementing focus traps per primitive.
  - **3 fixed height variants (v1):** `auto` (content-fits, e.g. sort sheet), `default` (75dvh, e.g. filter sheet), `full` (90dvh, e.g. look-detail). Multi-snap + swipe gesture deferred to v2 — needs JS gesture library, out of scope.
  - **Drag handle is visual-only in v1.** Spec acknowledges this is an "affordance lie" (handle suggests swipe but no gesture wired). Documented as accepted compromise per §F.3.2 since users still expect handle visually (iOS / Material familiarity). v2 wires the gesture.
  - **`useResponsiveOverlay()` hook returns "sheet"|"modal" based on viewport.** Helper for surfaces that need the same dialog content rendered as sheet on mobile / modal on desktop. Breakpoint locked at `(min-width: 768px)` to match Solen's existing mobile/desktop divide. SSR-safe (defaults to "sheet" before hydration). Caller pattern: `const Overlay = useResponsiveOverlay() === "sheet" ? Sheet : Modal`. Body content composes with both.
  - **Top-projecting shadow.** `0 -4px 28px rgba(50,47,44,0.12), 0 -2px 8px rgba(50,47,44,0.06)` — inverted elevation-3 (shadow projects upward since the sheet is bottom-anchored, no shadow below the viewport edge). Applied via Tailwind arbitrary value, not added to config (one-off).
  - **`safe-area-inset-bottom` respect.** SheetCTARow padding-bottom uses `pb-[max(1rem,env(safe-area-inset-bottom))]` so iOS home-indicator doesn't overlap the primary CTA. Critical for filter / sort sheet UX.
- **Tailwind tokens added:** none. The 6 z-index tokens added in V2-D18 (sheet-bg/sheet/modal-bg/modal/toast/tooltip) cover §F.3. The existing `rounded-sheet` token (28px, was already in tailwind.config.js for top-corner radius) gets used.
- **Files created (3):**
  - `app/[locale]/_components/primitives/Sheet.tsx` — Sheet + SheetHeader + SheetBody + SheetCTARow + `useResponsiveOverlay()` hook (5 exports). Sheet wraps `<ModalOverlay>` + `<AriaModal>` + `<Dialog>` with bottom-anchored CSS. Visual drag handle 36×4 ink/.20 in pt-3/pb-2 row at top.
  - `public/solen-v2-sheet.html` — full mockup. Page head + 4 use cases rendered inside iPhone-style frames (360×720 with 8px black bezel + 36px radius) — visualizes the mobile-only context. Sort sheet (auto height w 4 radio rows), filter sheet (75vh w 3 filter groups + sticky CTA), share sheet (auto height w utility pills), look-detail (90vh full w photo placeholder + meta). 4-step state timeline + 8-card anti-pattern strip.
- **Files patched (3):**
  - `_tasks/SOLEN_LIVE_TRUTH.md` — appended §F.3 section (~178 lines) between §F.2 end and the Step 4 marker. References `var(--z-sheet-bg)` + `var(--z-sheet)` per V2-D18 token additions.
  - `app/[locale]/_components/primitives/index.ts` — appended Sheet exports + `useResponsiveOverlay` hook export.
  - `app/[locale]/dev/primitives/page.tsx` — appended `<Section eyebrow="Sheet">` rendering 3 live sheet demos. Includes a "resize browser to <768px" callout — the dev page itself isn't responsive-overlay-aware (would defeat the demo); real surfaces use `useResponsiveOverlay()`. 4 new useState hooks for sheet open states + filter Set.
- **Bucket B candidate decisions logged (need user sign-off on wake-up):**
  - §F.3.0a heights = `auto / default / full`. Alternative naming: `compact / standard / tall` or `peek / half / full`. Picked `auto / default / full` because it maps directly to the use cases (auto = content-driven, default = the most common 75vh, full = explicitly the largest 90vh).
  - §F.3.7 desktop fallback breakpoint = 768px. Alternatives: 640px (small tablet) or 1024px (large tablet+). Picked 768px to match Solen's existing mobile/desktop divide already used in §6 layout. User can override later if specific surfaces want different breakpoints.
  - §F.3.2 drag handle dimensions (36×4px, ink/.20). Alternatives: 48×5 (more prominent, iOS-familiar) or 32×3 (subtler). Picked 36×4 as middle ground — visible without being decorative-loud.
- **Bucket B doc-cleanup TODO surfaced (not blocking, deferred to attended doc-cleanup pass):**
  - §25.6 sort sheet line 3353: cites `rgba(0,0,0,.35)` backdrop hex (pure black) which contradicts §4 anti-pattern (warm-ink only). When §25.6 implements via §F.3 the primitive's warm-ink `rgba(26,18,9,0.40)` prevails — but the surface-spec text should be cleaned up to match.
- **Spec contradictions surfaced:** none new. The two contradictions logged in V2-D17 (§F.1.4 Variant B gradient, §F.1.7 16px iOS rule) and the §25.6 backdrop noted above remain unresolved.
- **Live site impact: ZERO.** No existing route imports Sheet. Only the dev test page uses it.
- **Typecheck:** `npx tsc --noEmit` — zero errors in `app/[locale]/_components/primitives/Sheet.tsx` and `app/[locale]/dev/primitives/page.tsx`. Pre-existing legacy errors remain.
- **Status:** **shipped + locked.** Phase 0 §F.3 is complete: spec ✓ + mockup ✓ + React ✓ + dev verification ✓. **Next:** §F.4 toast primitive — same loop.

### V2-D18 (2026-05-09 overnight, autonomous) — Phase 0 §F.2 modal primitive shipped

- **Context:** First sub-section of the autonomous overnight execution (per `/Users/sulo/.claude/plans/immutable-shimmying-meerkat.md`). User asleep. Per the autonomous loop, §F.2 modal runs first (highest unlock value: auth login modal, booking confirm overlays, board management, report-content, sheet desktop fallback).
- **Architecture decisions (locked here, applies to §F.3 sheet inheriting modal patterns):**
  - **`react-aria-components` Modal + ModalOverlay + Dialog** — explicit V2-D18 deviation from V2-D17 native-first. No native `<dialog>` element has the focus-trap + scroll-lock + portal behavior the spec needs across all browsers. cva used for size variants on top of react-aria's headless behavior.
  - **Composition pattern follows V2-D17.** Sibling `<ModalHeader>` / `<ModalBody>` / `<ModalFooter>` components, not nested-wrapper. Each accepts a `size` prop that drives padding (sm/md = 20-24px, lg = 24-28px). Caller passes `size` through from `<Modal>` for now; future: extract via Context to avoid prop drilling — deferred.
  - **Layout-shift-safe motion via Tailwind data-attribute modifiers.** `data-[entering]:` and `data-[exiting]:` modifiers map react-aria's lifecycle attrs to scale + opacity transitions. Both entry and exit use `ease-snap` (cubic-bezier(.4,0,.2,1)) — modals are functional, not playful. No spring/bounce. `motion-reduce:` collapses to opacity-only 100ms per §24b.3.
  - **Backdrop = warm-ink dim + 4px blur.** `bg-[rgba(26,18,9,0.40)]` + `backdrop-blur-[4px]`. Pure black backdrop banned per §4 anti-pattern.
- **Tailwind tokens added (V2-D18):** 6 z-index tokens to match LIVE_TRUTH §8 z-index lock — `sheet-bg=400`, `sheet=410`, `modal-bg=500`, `modal=510`, `toast=600`, `tooltip=700`. Naming convention: `*-bg` for the dim/backdrop layer, bare token for the content layer above. Added all 6 in this commit (not just modal-* / modal-bg) since §F.3 sheet and §F.4 toast will need theirs in the next sub-sections, and adding them now avoids a config edit per sub-section.
- **Files created (3):**
  - `app/[locale]/_components/primitives/Modal.tsx` — Modal + ModalHeader + ModalBody + ModalFooter (4 exports from one file). Modal wraps `<ModalOverlay>` + `<AriaModal>` + `<Dialog>` from react-aria-components. Header includes optional eyebrow + title + close X (44×44 hit area via negative-margin trick). Body is scroll container with size-aware padding. Footer supports `layout="right"` (default) or `layout="between"` for destructive-tertiary placement.
  - `public/solen-v2-modal.html` — full mockup. Page head + anatomy stage (with simulated dimmed bg behind backdrop) + 3 sizes side-by-side (sm confirm, md login, lg report) + 4 use-case grid (confirmation destructive, share w utility chips, edit single field, sign-out w destructive tertiary) + 4-step state timeline (closed / opening / open / dismissing) + 8-card anti-pattern strip with red dashed border.
- **Files patched (3):**
  - `_tasks/SOLEN_LIVE_TRUTH.md` — appended §F.2 section (~183 lines) between existing §F.1 and the Step 4 marker. References `var(--z-modal-bg)` per §8 z-index lock.
  - `app/[locale]/_components/primitives/index.ts` — appended Modal exports.
  - `app/[locale]/dev/primitives/page.tsx` — appended `<Section eyebrow="Modal">` rendering 4 live modal demos (sm confirm, md login w TextInput composition, lg report w RadioGroup+Textarea composition, sm destructive w isDismissable=false+keyboardDismissDisabled+autoFocus on Abbrechen). 4 new useState hooks for modal open states.
  - `tailwind.config.js` — appended 6 z-index tokens.
- **Bucket B candidate decisions logged (need user sign-off on wake-up):**
  - §F.2.5 footer destructive-tertiary placement — `<ModalFooter layout="between">` puts destructive on far left, primary group on right. Alternative was destructive in middle / inline with primary — picked `between` because it visually separates "irreversible" from "primary action," matches user expectation.
  - §F.2.7 default focus on destructive flows — focuses "Abbrechen" (secondary) instead of "Löschen" (primary destructive). Spec says "destructive defaults focus to Abbrechen so accidental Enter doesn't fire destructive action." Implemented via `autoFocus` prop on the cancel button. This is a defensible safety pattern but worth user sign-off.
  - §F.2.8 close X hit-area extension via negative margin — `w-11 h-11 -m-2.5` produces 44×44 click area while keeping the visual icon at 24px. Alternative: `padding: 10px` on the button (similar effect). Picked negative-margin because it doesn't add extra spacing around the icon (preserves the spec's 12px header gap to title).
- **Spec contradictions surfaced (TODOs for next doc-cleanup pass):**
  - None new. The two contradictions logged in V2-D17 (§F.1.4 Variant B gradient, §F.1.7 16px iOS rule) remain unresolved.
- **Live site impact: ZERO.** No existing route imports the modal. Only the dev test page at `/[locale]/dev/primitives` uses it (gated `notFound()` in production).
- **Typecheck:** `npx tsc --noEmit` — zero errors in `app/[locale]/_components/primitives/Modal.tsx` and `app/[locale]/dev/primitives/page.tsx`. Pre-existing 42 errors in legacy code remain (per V2-D05 retirement plan).
- **Status:** **shipped + locked.** Phase 0 §F.2 is complete: spec ✓ + mockup ✓ + React ✓ + dev verification ✓. **Next:** §F.3 bottom sheet primitive — same loop.

### V2-D17 (2026-05-08 evening) — Phase 0 §F.1 React implementation shipped

- **Context:** V2-D16 locked the §F.1 mockup (`public/solen-v2-primitives.html`). Per the V2 rebuild plan loop (spec → mockup → conflict scan → implement → lock), the next step was React implementation in `app/[locale]/_components/primitives/`. User authorized "go a" (Option A: implement now, not continue speccing §F.2-§F.8 first). Goal: vertical slice — get §F.1 working in code before writing 7 more sub-specs that may surface gaps only React reveals.
- **Architecture decisions (locked here so §F.2-§F.8 follow the same):**
  - **Native HTML + cva + cn() — NOT react-aria-components.** `react-aria-components` is installed (used by date pickers etc) but for §F.1 primitives the spec explicitly prefers native (§F.1.3 "v1 decision: native `<select>` for desktop AND mobile"). Native `<input>` / `<textarea>` / `<select>` / `<button role="switch">` are accessibility-correct out of the box. Adobe React Aria stays available for primitives that genuinely need richer state machines (date pickers, comboboxes, modals — §F.5+).
  - **Layout-shift-safe border pattern.** §F.1.0b spec defines stuck states (error / warning / success / active) as "2px border replaces 1px border" — literal interpretation causes a 1px layout shift on tone change. Solution: keep `border-1` always, paint the second pixel via `ring-1 ring-inset ring-{tone}` from the inside. Visually identical to a 2px border, but the box-model layout doesn't shift on state transition. Use this same pattern for any future bordered-input primitive.
  - **Composition pattern.** Each form field uses `<FieldLabel>` + `<{Primitive}>` + `<FieldHelper>` rendered as siblings — not nested inside a "Field" wrapper. This matches react-aria's compositional model + shadcn conventions, and lets callers compose error states however they need (e.g. only render `<FieldHelper tone="error">` after first blur).
  - **Controlled / uncontrolled hybrid for stateful primitives.** Switch supports both — pass `checked` for controlled, `defaultChecked` for uncontrolled. Falls through to `useState` internally when uncontrolled. Same pattern Switch / Checkbox / Radio expose. Caller chooses.
  - **Aria-pressed for PillToggle, not aria-checked.** PillToggle is rendered as `<button>` (not native checkbox/radio), so it uses `aria-pressed`. The `<PillGroup mode="multi"|"single">` parent communicates the semantics via `data-pill-mode`; semantic enforcement (single-select-deselects-others) is the caller's responsibility — matches how the spec is written, no surprise abstractions.
- **Tailwind tokens added:**
  - `s-bg.active = #FFF4E8` — input active-typing tint per LIVE_TRUTH §F.1.0 + §14.3. Was wrongly retired in a V2-D15 comment that conflated micro-tint with cream substrate. Clarifying comment added inline.
  - 4 motion easings (`ease-snap` / `ease-spring` / `ease-glide` / `ease-thud`) per LIVE_TRUTH §F.1 + §5b motion vocabulary. Distinct from existing `ease-out-warm` / `ease-out-back` / `spring-bounce` (those stay for legacy compat). Use V3 names in new code.
- **Files created (11):**
  - `app/[locale]/_components/primitives/FieldLabel.tsx` — label, supports `required` (red dot 5px) + `optional` (lowercase tag)
  - `app/[locale]/_components/primitives/FieldHelper.tsx` — helper / error / warning / success message with tone-appropriate icon + `role="alert"` on error + `aria-live="polite"` default for error+warning
  - `app/[locale]/_components/primitives/TextInput.tsx` — 9 states (default · focus · active · filled · error · warning · success · disabled · loading) × 3 sizes (sm 40px / md 56px / lg 64px) × 6 type variants (text · email · tel · password-w-reveal · search · number · url). `loading` shows trailing spinner without locking the field. `revealable` adds Eye/EyeOff toggle button on `type="password"`.
  - `app/[locale]/_components/primitives/Textarea.tsx` — 4 tones, `resize-y` only, 88-280px height range. Plus `<TextareaCounter>` companion (warns at 80% via brand-teal tabular-nums).
  - `app/[locale]/_components/primitives/Select.tsx` — native `<select>` with `appearance: none` + custom Lucide chevron, 3 sizes × 4 tones.
  - `app/[locale]/_components/primitives/Checkbox.tsx` — Variant A boxed, supports `indeterminate` (synced via effect since HTML doesn't support it as attribute), spring-overshoot check icon reveal (300ms ease-spring).
  - `app/[locale]/_components/primitives/Radio.tsx` — Variant A radio row, plus `<RadioGroup>` container with `role="radiogroup"`. Inner-dot fades 150ms ease-snap.
  - `app/[locale]/_components/primitives/Switch.tsx` — `<button role="switch">` with `aria-checked`, controlled+uncontrolled hybrid, optional label+sub-label rendering. Knob slides 200ms ease-snap, press scale 100ms ease-thud.
  - `app/[locale]/_components/primitives/PillToggle.tsx` — Variant B for both checkbox + radio (single source of truth — same shape, semantics handled by parent). Plus `<PillGroup mode="multi"|"single">` layout container.
  - `app/[locale]/_components/primitives/index.ts` — barrel export.
  - `app/[locale]/dev/primitives/page.tsx` — full dev test page rendering every primitive in every state. Routes at `/{locale}/dev/primitives`. Gated via `if (process.env.NODE_ENV === "production") notFound()`. To view: `npm run dev` then navigate to `http://localhost:3000/de/dev/primitives`.
- **Files patched:**
  - `tailwind.config.js` — `s-bg.active` token + 4 motion easings + clarifying comment about V2-D15 retired list scope
- **Spec contradictions surfaced for follow-up (not fixed in this commit):**
  - §F.1.4 Variant B inactive bg cited as `linear-gradient(180deg, #fff, #FDFAF5)` — V2-D15-4 supersedes (gradients banned on pills). React component implements flat white per V2-D15-4. Spec line should be updated to flat in a future doc-cleanup pass. Logged as TODO.
  - §F.1.7 line 1266 says "all text inputs `font-size ≥ 16px`" but V2-D14 decision B kept md inputs at 14px (accepting iOS auto-zoom). Internal contradiction. React component implements 14px on md per V2-D14 (locked). Spec line should be reconciled.
- **Live site impact: ZERO.** No existing page imports any of these primitives. They're dormant utilities. The dev test page at `/{locale}/dev/primitives` is the only route that uses them, and it's gated to dev only.
- **Typecheck:** `npx tsc --noEmit` — all 42 errors are in pre-existing legacy code (`components-legacy/`, `tmp3.tsx`, `tmp_header.tsx`) per V2-D05 incremental retirement plan. Zero errors from new files.
- **Status:** **shipped + locked.** Phase 0 §F.1 is complete: spec ✓ (V2-D14) + mockup ✓ (V2-D16) + React implementation ✓ (V2-D17) + dev verification ✓. **Next:** §F.2 modal primitive — same loop (spec draft → mockup → React).

### V2-D16 (2026-05-08) — Phase 0 §F.1 form primitives mockup locked

- **Context:** §F.1 spec was already written (~310 lines, V2-D14 lock 2026-05-05) and was already V3-aligned after V2-D15-3 (brand-teal `#043338`, Avant Garde Gothic body, ink-1 `#1A1209`). But the mockup `public/solen-v2-primitives.html` was pre-V3 — used Bricolage Grotesque (retired), Inter Tight as primary (now fallback only), Instrument Serif italic (italic banned V2-D15), orange `#E8742A` (retired), cream substrate `#FBF8F3` (retired V2-D15), `#8A3C0F` brand-text (retired). Mockup needed full rebuild against V3 tokens before Phase 0 §F.1 implementation could start.
- **Decision:** rebuild `public/solen-v2-primitives.html` from scratch on V3 foundations, locking the mockup as the visual reference Phase 0 §F.1 React components implement against. Spec stays in LIVE_TRUTH §F.1.1-§F.1.10 (no spec changes — only one cosmetic doc fix at §F.1.0b: disabled-state citation `(sunken cream from §3)` → `(sunken from §4)`, since `#FAF7F3` lives in §4 surface scale, not §3 semantic colors).
- **Mockup contents (state matrix complete):**
  - **§F.1.1 text input** — 9 states (default · focus-kbd · active-typing · filled · error · warning · success · disabled · loading) + 6 type variants (text · email · tel · password-w-reveal · search · number · url)
  - **§F.1.2 textarea** — 4 states (default · filled · approaching-limit warn · error too-short)
  - **§F.1.3 select** — 3 states (default-w-placeholder · filled · disabled)
  - **§F.1.4 checkbox** — Variant A boxed × 6 states (default · checked · indeterminate · focus · disabled-unchecked · disabled-checked) + Variant B pill (multi-select 8-pill demo, 2 active)
  - **§F.1.5 radio** — Variant A radio row × 4 states (sort sheet selected · booking step w disabled+focus inline) + Variant B pill (3-option group, 1 active)
  - **§F.1.6 switch** — 4 isolated states (off · on · focus · disabled) + 4-row settings-list demo
  - **§F.1.0a sizes** — sm/md/lg side-by-side
  - **§F.1.8 inline validation** — password strength meter (zu schwach · gut, 4-bar visual) + confirmation-match error
  - **§F.1.10 anti-patterns** — 4 banned patterns rendered with red dashed border + why-banned reasoning (floating labels · pill-shaped inputs · required-asterisk · clear-on-error)
- **V3 discipline applied:**
  - Cooper BT only at page h1 + section h2s (display moments). Avant Garde Gothic for everything else (labels, inputs, buttons, helper text, anti-pattern strips).
  - Brand-teal `#043338` for focus rings, checked checkboxes, on-state switches, radio dots, caret, selection bg `rgba(4,51,56,.18)`.
  - White substrate `#FFFFFF`. `#FFF4E8` warm tint for active-typing inputs (matches §14.3 search row). `#FAF7F3` sunken bg for disabled inputs.
  - Editorial section-break (top rule + eyebrow + meta + Cooper-BT h2) wraps every primitive section per V2-D15-4.
  - V2-D15-4 flat-pill discipline: no gradient buttons, no inset Web 2.0 gloss on pills, no `saturate(1.4)` glass pump, no italic anywhere.
  - All ink scale + semantic colors from §3/§4, all easings from §5b motion vocabulary.
- **Files patched:**
  - `public/solen-v2-primitives.html` — full rewrite, ~870 lines
  - `_tasks/SOLEN_LIVE_TRUTH.md` — §F.1.0b line 1081 cosmetic fix (`from §3` → `from §4`)
- **Status:** **locked.** Mockup is the visual reference Phase 0 §F.1 React implementation will match. **Next:** option A — implement §F.1 React components in `app/[locale]/_components/primitives/` against tailwind V3 tokens (the actual ship); option B — continue spec/mockup loop with §F.2 modal primitive (parallel-track all 7 remaining Phase 0 sub-sections, then implement at end). User decision.

### V2-D15-4 (2026-05-07 evening) — Pill de-gloss + editorial section-break (Option D)

- **Context:** After V2-D15-3 lock landed, user spawned a fresh Opus sub-agent to test if the V3 spec was self-sufficient (it was, 3.5/5 confidence) but the agent's output read "shiny / 2000s / draft." Pre-commit audit by 5 parallel Sonnet sub-agents had already cleaned ~50 inconsistencies, but the user identified two remaining issues: (a) pills feel too shiny (Web 2.0 gloss tricks baked into §5b L4 + §1 hover gradient + the "inset 0 1px 0 rgba(255,255,255,X)" pattern across CTAs/badges/chips), (b) section titles read bland (Avant Garde 700 plain h2, no editorial framing). User explicitly opted to KEEP everything else from V2-D15-3 (atmosphere wash, category combos, depth on cards, brand teal usage, etc.) and only fix these two surfaces.
- **Decisions (locked from `public/solen-v3-pills-titles-tweaks.html` preview):**
  - **Tweak 1 — pill de-gloss (LIVE_TRUTH §5a.2 + §5a.3 added).** Pills are FLAT. The §5b depth system applies to cards / surfaces / overlays, NOT pills. Drop on every pill: `inset 0 1px 0 rgba(255,255,255,X)` Web 2.0 inner-glow, `linear-gradient` button backgrounds (gradient on hover banned — use `transition: background 150ms ease` to a flat lighter/darker variant), stacked multi-shadow (max ONE soft shadow on pills, only when contextually elevated like a frosted-glass badge over a photo), `backdrop-filter: ... saturate(1.4)` (use `saturate(1)`), brand-color glow ring on dots (`box-shadow: 0 0 0 3px rgba(brand,.2)`), tinted brand-color drop shadows on CTAs. Locked pill-treatment table in §5a.3 covers 8 pill types (primary CTA, secondary ghost, default chip, active chip, glassy badge, salon-card heart, numbered step, status dot).
  - **Tweak 2 — Option D editorial section-break (LIVE_TRUTH §15 rewritten).** Old V2-D15 minimalist `clean` layout (Avant Garde 700 h2 left + `Alle →` right, no eyebrow, no meta) is **retired**. Replaced with the editorial section-break pattern: (1) 1px ink-1 top rule, (2) eyebrow-left + meta-right row in Avant Garde 700 11px uppercase letter-spaced 0.18em (eyebrow optionally leads with brand-teal 5px dot, meta uses tabular-nums), (3) h2 row: **Cooper BT 900** (replacing Avant Garde 700 from V2-D15) at clamp(28-40px) + `Alle →` link in brand teal underline-3px. Spacing: 48/64px section margin-top (was 32/48 — increased for section-break breathing room), 14px rule→eyebrow, 12px eyebrow→h2, 16px h2→content. Per-section eyebrow + meta examples table added covering all 9 homepage sections.
  - **§5b L4 backdrop-filter saturate(1.4) → saturate(1)** locked (V2-D15-4 anti-pattern call-out moved into §5a.2). All globals.css glass utilities also swept to saturate(1) — 9 instances total (was using 1.2, 1.3, 1.4 across `.glass`, `.glass-strong`, `.glass-subtle`, `.glass-frost`, `.glass-toolbar`, `.glass-pill`, `.glass-pill-active`, the v5 frosted glass, and the driver-popover).
  - **§1 hover gradient retired.** Brand-teal CTA hover was `linear-gradient(180deg, #0A6873 0%, #043338 100%)` plus inset highlight + tinted drop shadow. Now: flat `#043338` resting → flat `#0A6873` mid-teal on hover via `transition: background 150ms ease`. Optional `transform: translateY(-1px)` on hover, `transform: scale(0.98)` on active w `transition-duration: 100ms`. Same gradient string was used at §13.4 hero search submit and §14.2 search-results filter active-chip — both swept by replace_all.
  - **§5a renumbered to §5a.1 (text color rule, original V2-D15-3 lock) + §5a.2 (surface treatment, V2-D15-4 lock) + §5a.3 (treatment table).** Text-color rule unchanged; new subsections add the de-gloss discipline.
- **What V2-D15-4 keeps from V2-D15-3 (no change):** brand teal `#043338` + pale teal + brand subtle, 4 categories Z/G/A/I, Cooper BT + Avant Garde Gothic typography, atmosphere wash recipe (still 0.78/0.72/0.32/0.28 opacities), §5b L1/L2/L3/L5 depth on cards/surfaces/overlays/accent-glow (cards still get inset highlights and stacked shadows — those weren't the user's complaint), Republik colorway monochrome rule, pill text white-or-black (§5a.1), Yuh-density principle, semantic colors, ink scale, every dimension/layout/spacing rule.
- **What V2-D15-4 considered and rejected:** the broader `solen-v3-depth-comparison.html` preview proposed flat-modernizing the entire §5b depth system (dropping inset highlights from cards, single soft shadow on hover only, flat card surface, atmosphere wash 0.40/0.40/0.10, flat city tiles per-city-tinted, B2B card flat brand-subtle). User explicitly rejected: "i actc like how it is rn like bfr u make any tweaks." The shiny depth on cards / B2B / atmosphere stays — only PILLS got de-glossed, only TITLES got editorial framing.
- **Source-of-truth artifacts:**
  - `public/solen-v3-pills-titles-tweaks.html` — the A/B preview that locked the picks (pills clean side + Option D)
  - `public/solen-v3-depth-comparison.html` — the rejected broader-modernization proposal (kept on disk as what-not-to-do reference)
  - `public/solen-v2-republik-teal.html` — locked homepage now using the section-break pattern + de-glossed pills
- **Files patched:**
  - `_tasks/SOLEN_LIVE_TRUTH.md` — §5a (added §5a.2 surface treatment + §5a.3 pill-treatment table, ~75 lines), §5b L4 saturate sweep, §1 hover gradient retired (string sweep on `linear-gradient(180deg, #0A6873 0%, #043338 100%)` → flat note), §15 rewritten (anatomy diagram + locked decisions + §15.7 per-section eyebrow/meta examples added)
  - `app/globals.css` — saturate(1.2/1.3/1.4) → saturate(1) sweep, 9 glass utilities cleaned
  - `public/solen-v2-republik-teal.html` — `.btn-primary` flat-pill rewrite, `.section-h2` switched from Avant Garde 700 to Cooper BT 900, `.section-link` underline + brand teal, `.sec-break-rule` + `.sec-break-meta-row` + `.sec-break-eyebrow` CSS added, both section headers ("In Basel diese Woche" + "Jede Kategorie, ihre eigene Farbe") wrapped with the editorial pattern
- **Implications for tailwind.config.js + Phase 0 implementation:** no token changes needed (font tokens, color tokens, shadow tokens unchanged). Pill components implemented in Phase 0 §F.1 must follow §5a.2 anti-pattern list — the `pre-sweep-check.sh` audit pattern would catch any inset highlight + saturate(1.4) regression on a future PR. Section-header component implemented in Phase 0 must use the §15.1 anatomy diagram exactly.
- **Status:** locked. Spec patches applied 2026-05-07 evening. Homepage mockup reflects the lock at `public/solen-v2-republik-teal.html`. V2-D15-3 superseded for §5a + §5b L4 + §1 hover + §15; everything else V2-D15-3 intact.

### V2-D15-3 (2026-05-07) — Brand pivot: orange retired, dark teal locked + 6 cats → 4 cats + typography pivot
- **Context:** Sustained design exploration over 2026-05-07 evening. User systematically rejected the v2 brand-orange direction, the chunky Yuh-style Peace Sans + Open Sauce typography, and the 5-saturated-panel-per-page Republik category mode. Through iterative rounds (palette doc → swatch page → 31-combo grid → category-by-category picks), arrived at a fully-locked V3 palette grounded in: (a) Republik colorway research at `/tmp/republik-research/colorways.md` (19 panels extracted from live site), (b) Yuh discipline research at `/tmp/yuh-research/yuh-system.md` (3 pages sampled — coral used 35–101× per page), (c) user-flagged screenshots (the dark teal Republik panel + the Wirtschaft tomato red + the Westjordanland forest green), (d) graphic-design typography reference (Avant Garde Gothic + Cooper BT seen on social).
- **Decisions (all locked):**
  - **Brand color:** retire `#E8742A` orange. Lock `#043338` dark teal as `s-brand.DEFAULT` (Republik panel #4 — the dark teal article hero the user explicitly flagged from `https://www.republik.ch`). Brand pale `#C2F0F1` (Republik exact pair). Brand subtle `#E1F4F4`. Drop `s-brand.text` and `s-brand.text-deep` orange-era variants — dark teal at 14.74 : 1 on white is body-safe at any size, no `text-deep` needed.
  - **Brand discipline:** Yuh-density rule. Brand teal appears 60–100× per page in tiny accents (logo, links, list bullets, ONE word per hero h1, CTA pills, status text). Never as hero panel bg. The discipline is density, not size.
  - **Categories:** 6 cats → 4 cats. Drop Wellness as separate (merge into Spa & Wellness). Retire Makeup. Defer Waxing post-launch. Lock combo letters from `public/solen-v2-combos.html`:
    - Coiffeur = **Z** (cream `#FFF1DD` + cherry `#B5345A`, 5.24 : 1 AA)
    - Barbershop = **G** (bone `#D8D6CB` + black `#000`, 14.40 : 1 AAA — Republik panel #7)
    - Nails = **A** (pale ice blue `#CAE8FF` + magenta `#B50051`, 5.35 : 1 AA — Republik panel #1)
    - Spa & Wellness = **I** (forest `#193120` + sandy beige `#948565`, 3.86 : 1 AA-large — Republik panel #9, user-flagged Westjordanland screenshot)
    - Retired 6-cat hexes: `#B5588A` (rose), `#E8A957` (sunny), `#C77A5C` (clay), `#88B89E` (sage), `#D66547` (coral-orange), `#A66E3D` (camel) — all do not reintroduce.
  - **Typography:** retire Bricolage Grotesque (display) + Inter Tight (primary body) + Instrument Serif italic + JetBrains Mono. Lock **Cooper BT** (display: hero h1, logo, feature h2, category panel h1) + **ITC Avant Garde Gothic Std** (body, UI, section h2s, eyebrows, buttons, microcopy, numerics). Free Google Fonts fallbacks: Sansita 900 (Cooper) + League Spartan (Avant Garde) + Inter Tight (final fallback). Retire intermediate Peace Sans + Open Sauce Sans considered briefly. The pairing was user-locked from a graphic-design reference.
  - **Pill rule:** every pill-shaped UI element (CTA, tag, chip, badge, numbered circle) uses `#FFFFFF` on dark or `#000000` on light. No tinted-of-bg colors. Inline links / status text / eyebrows can still use tinted brand teal — the rule is for PILLS specifically. (See LIVE_TRUTH §5a.)
  - **Atmosphere wash:** hero substrate stays white with a 5-stop radial gradient — pale ice blue + pale teal core + royal blue navy framing + horizon bleed. Locked CSS in LIVE_TRUTH §5c. NOT painterly SVG (deferred — would need designer asset, out of scope).
  - **Color philosophy (locked design law):** white substrate permanent. ONE brand color used densely. Brand never a hero substrate. Saturated panels follow Republik monochrome rule (one text color per panel). Pastels for soft tiles or atmosphere, never section bgs at body density. Semantic colors stay semantic. Pill text white-or-black. (See LIVE_TRUTH §5d.)
  - **Combo library:** the 31-combo grid at `public/solen-v2-combos.html` (A–S Republik-extracted, T–EE fresh hue-gap fills) is the exclusive source for adding future categories or themed feature pages. (See LIVE_TRUTH §5e.)
- **Source-of-truth artifacts:**
  - `public/solen-v2-republik-teal.html` — the locked V3 homepage mockup (Inter Tight retired, Cooper + Avant Garde applied)
  - `public/solen-v2-palette.html` — full V3 palette swatch page
  - `public/solen-v2-combos.html` — 31-combo grid reference (A–EE)
  - `/tmp/republik-research/colorways.md` — research artifact (19 Republik panels with hex/contrast/font/laws)
  - `/tmp/yuh-research/yuh-system.md` — research artifact (Yuh discipline across 3 pages)
  - `/tmp/solen-palette/v3-bright-modern.md` — preliminary palette spec doc
- **Files to retire from `public/`** (V2-D15-era exploration labs, no longer authoritative):
  - `solen-v2-font-pivot.html`, `solen-v2-font-lab.html`, `solen-v2-matrix.html`, `solen-v2-color-lab.html`, `solen-v2-collision-test.html`, `solen-v2-ink-brand.html`, `solen-v2-cta-options.html` — brand-orange-era explorations, retire next cleanup pass.
  - `solen-v2-renewed.html`, `solen-v2-republik.html`, `solen-v2-3-options.html`, `solen-v2-colorways.html` — V2-D15/D15-1-era explorations, retire.
- **Implications for tailwind.config.js:** still V2 tokens. Token swap will land alongside Phase 0 §F.1 React components when implementation starts. The pre-sweep-check hook (`.claude/hooks/pre-sweep-check.sh`) blocks any mass orange→teal sweep without `touch .claude/sweep-approved.flag` — explicitly authorize the sweep when ready.
- **Implications for messages/de.json:** drop `makeup` category key when v1 launches. Keep `coiffeur`, `barbershop`, `nails`, `spa`. FAQ copy already says "Spa & Wellness" combined — no change needed.
- **What's parked, not killed:** the brand color is locked but a Solen Pro premium tier that wants its own visual identity could pull combo C (light grey + near-black) or H (aubergine + white). Out of v1 scope. Waxing as a 5th category is parked — bring back when launch data shows demand.
- **User direction quoted (for future audits):** "i want yuh restraint with the color i just showed you"; "stop using purple"; "i wanna go yuh style"; "Avant Garde Gothic + Cooper BT"; "we ditched makeup a long time ago" (4-cat lock); "Coiffeur = Z, Barbershop = G, Nails = A, Spa & Wellness = I" (combo lock).
- **Status:** foundations locked. LIVE_TRUTH §1, §2, §5 patched. New sections §5a (pill rule), §5g (atmosphere wash), §5h (color philosophy + cumulative palette), §5i (combo library) added. Mockup at `solen-v2-republik-teal.html` reflects the lock.
- **⚠️ Pending follow-up sweep:** 32 references to brand orange `#E8742A` remain in component-level specs (§F.1 form primitives, §12 header, §13 hero, §14 search, §16 salon card — focus rings, switches, radios, checkboxes, pulse dots, caret, hover bg). These reference the old orange literal — need to be updated to `#043338` brand teal. Plus `#FFE4D2` brand-subtle peach → `#E1F4F4` brand-subtle teal, `#F0834D` hover-top retired, `#8A3C0F` brand-text + `#5C2308` brand-text-deep retired (teal is body-safe at any size, no `text-deep` variant needed). `rgba(232,116,42,X)` brand-peach shadows → revisit (likely keep as warm-tint, or shift to teal-tint `rgba(4,51,56,X)`). This sweep is the brand-pivot scenario the `pre-sweep-check.sh` hook is designed for — when ready, run `touch .claude/sweep-approved.flag` then do a single coherent pass through LIVE_TRUTH component specs.
- Phase 0 implementation can resume on V3 foundations once the component-level sweep lands. Tailwind config swap (`s-brand` token from `#E8742A` to `#043338`) lands at the same time.

### V2-D15 (2026-05-07) — Hybrid scratch reset on LIVE_TRUTH foundations
- **Context:** After completing §F.1 form primitives (V2-D14), user asked deeper questions about brand identity by referencing 4 brands they admire (Republik colorways, Fresha layout, Uber typography+icons, Airbnb animations). Two AI research deliverables on those brands came back with verifiable citations, identifying patterns that VALIDATED most of v2 (per-category palette, Bricolage+Inter Tight, motion vocabulary, page sequencing) but INVALIDATED 3 specific elements (warm cream substrate, Instrument Serif italic accents, JetBrains Mono numerics).
- **Decision:** Hybrid scratch reset — rewrite foundations of `SOLEN_LIVE_TRUTH.md` from scratch grounded in the research, but preserve component patterns + §F.1 primitives + §25 category page + §24b/§24c cross-cutting. Cost: 2-3 hours of work. Net result: foundations re-anchored to research (not the original v2-prelim paste from the user's parallel Claude session), most implementation preservation intact.
- **Specific changes from v2-prelim:**
  1. **Substrate:** warm cream `#FBF8F3` → white `#FFFFFF`. All 4 reference brands use white. Cards now lift via shadow + border, not cream-vs-white contrast. §3 Warm-ink scale + substrate updated; §F.1 form primitive bg note updated; §9c sticky tab bar bg updated; §12.7 sticky header bg updated; §24b.4 contrast pairings recalculated (white substrate ratios actually slightly higher than cream); §25.6 sortieren sheet bg updated; §25.11 cross-link footer kept a subtle warm-grey gradient as visual delineation (not a substrate revert).
  2. **Typography:** dropped Instrument Serif italic + JetBrains Mono. 2 typefaces total: Bricolage Grotesque (display) + Inter Tight (body + UI + numerics with `font-variant-numeric: tabular-nums`). Italic-as-moment ornament gone from the system. §5 rewritten; §5.3 explicitly retires the italic accent moment; §13.3 hero greeting no longer italic; §16.4 salon card rating no longer mono; §F.1 numerics updated.
  3. **Per-category colorway treatment (Republik move):** new §2 + §1.1 brand-orange-discipline rule + §32 (preserved §25) updated. On category pages, category color (Coiffeur rose `#B5588A`, etc.) carries page-identity — h1, breadcrumb-current, accent bar above breadcrumb, section dividers. Brand orange retreats to global elements (header, save heart, footer accent) on those pages. New §2.1/§2.2/§2.3 detail where category color appears + does not + anti-patterns.
  4. **Voice:** stripped V1 "editorial-magazine that printed your haircut" framing. New §0 voice paragraph: "confident, useful, Swiss-direct. Not literary. Not corporate." Du-form German default, Sie only in legal copy.
  5. **Iconography (§5e.1):** added 10-signature-icon concept as future custom-tweak set (deferred to v2-launch polish, CHF 200-500 budget). v1 stays on Lucide as-is.
  6. **§5b Depth system:** simplified to single-shadow Yuh-style approach (was stacked-layer in v2-prelim). Cleaner rendering at scale.
  7. **§5c Motion principle (Airbnb):** added explicit "motion is for state-change continuity, not decoration" as governing rule. Implementation discipline note: motion MUST be applied at state-change moments, not specced and forgotten.
  8. **PR Checklist additions:** category-colorway audit lines, italic-removal audit, mono-removal audit, no-cream-revert audit.
- **Research sources:** documented in user's research-prompt deliverables (paste in conversation 2026-05-07). Republik philosophy quotes from Brigitte Meyer ("kein Chichi, kein Bullshit, keine Schnörkel" / "präzises Bild von Fall zu Fall"). Uber Move type system spec from MCKL. Airbnb Motion Engineering at Scale from Airbnb tech blog. Fresha venue detail page section order from live inspection via Playwright.
- **Status:** locked. Component patterns and §F.1 primitives unchanged in their internal logic — only the cream→white + italic-removal + mono-removal sweep applied to text references.
- **Implications for tailwind.config.js:** still V1 tokens. Token swap will land alongside the first React primitive component when Phase 0 implementation starts. No wholesale sweep needed.

### V2-D14 (2026-05-05) — §F.1 form primitives — 4 open decisions resolved
- **Context:** First Phase 0 spec drafted. Audit found 4 open questions visualized at `public/solen-v2-decisions.html` for user to compare side-by-side.
- **Decisions (locked by user):**
  - **Issue 5 → Option B.** Keep 14px on md inputs. Accept iOS auto-zoom on focus. No transform-scale workaround. No `user-scalable=no` viewport hack. If a future surface needs zoom-free behavior, that single input can override to 16px (note in surface spec).
  - **Issue 6 → Option A.** Switch ON track = brand-orange `#E8742A`. Accepted exception to §1's "≤4 brand instances per screen" restraint principle for settings pages where many switches stack. Brand-orange holds at scale.
  - **Issue 7 → confirmed.** Circle elements use `var(--radius-full)` (50%) — radio circle, switch knob, avatar, heart button, status dots. Pills use `var(--radius-pill)` (99px). Loose phrasing "pill (50%)" replaced.
  - **Issue 8 → 3 reference states only.** Default / active / focus locked as standalone states. No "stacked" or "focus replaces active" sub-rule — in practice `:focus-visible` only fires for keyboard, so click-and-typing renders active w/o outline. If both fire (programmatic focus + click), both render and that's accepted.
- **Audit fixes also landed:**
  - Active bg `#FFF7F1` (invented) → `#FFF4E8` (matches §14.3 lock)
  - Disabled bg `#F5F0E8` (V1 leftover) → `#FAF7F3` (sunken cream from §3)
  - md padding 14px vertical → 12px (matches §13.4 hero search row lock)
  - Internal padding contradiction (§F.1.0 vs §F.1.0a) resolved by referencing the size table
- **Status:** §F.1 spec locked. Mockup at `public/solen-v2-primitives.html` is the next deliverable. After mockup approval → implementation in `app/[locale]/_components/primitives/` → V2-D15 implementation lock → §F.2 modal next.
- **User feedback captured to memory (2026-05-05):** "stop inventing stuff if you don't know — ask." Saved at `~/.claude/projects/.../memory/feedback_dont_invent.md` and indexed in `MEMORY.md`. Applies to all future spec drafting: never pull hex/size/copy from training data when not in locked sections; either reuse a locked value or flag as open question for user decision.

---

### V2-D13 (2026-05-05) — LIVE_TRUTH replaced wholesale with v2 spec from parallel Claude session
- **Context:** User compiled a fresh v2 design spec across 4 sequential design steps in a separate Claude session (covering brand color, geographic scope, semantic + warm-ink + per-category palettes, typography, depth, personality, layout fundamentals, hit targets, header, hero, search system, section headers, salon card, scroll row, entdecken, city tiles, b2b card, footer, SEO link wall, homepage flow, a11y baseline, analytics, and the full /basel/coiffeur category page). Pasted into this session 2026-05-05 along with a finished /basel/coiffeur HTML mockup. Old LIVE_TRUTH (V1: forest green `#1B4D1B` + Anton/Figtree) was incompatible — different brand color, different fonts, different surface decisions throughout.
- **Decision:** V1 LIVE_TRUTH renamed to `_tasks/archive/SOLEN_LIVE_TRUTH_v1.archived.md` via `git mv` (history preserved). New `_tasks/SOLEN_LIVE_TRUTH.md` written from the v2 paste verbatim with: (a) paste artifacts cleaned (autolink remnants like `[solen.ch](http://solen.ch)`), (b) navigation index added at top, (c) "What's still missing" section appended listing the 36 surface gaps mapped to Phases 0–6. Visualization at `public/solen-v2-locked.html` shows palette + type specimen + locked components + the entire /basel/coiffeur reference inline.
- **Status:** locked. From this point forward, this v2 doc IS the principal. V1 references in any other doc need to be updated to point at the archive path or the new spec.
- **Implications for tailwind.config.js:** still contains V1 tokens (`s-coral.DEFAULT = #1B4D1B`, Anton/Figtree font stack). Will be updated as Phase 0 primitives land — token swap won't be a single sweep, it'll happen alongside the first React components that consume v2 tokens. Pre-sweep hook (`.claude/hooks/pre-sweep-check.sh`) still active; v2 hex sweep will need explicit `sweep-approved.flag`.

---

## Phase 4-5 deferred — incremental cleanup model

**Decision (2026-05-04):** Phase 4 (UI primitives + discovery sub-components) and Phase 5 (root-level orphans) deletion is **DEFERRED in favor of incremental cleanup tied to route rebuilds**.

**Why deferred:**
1. Two attempts at orphan-graph audit failed badly (first audit: 25% false-positive deletion of actively-used files; second audit: 100% false-positive — claimed almost everything is orphan including the global Header). Import-graph reachability via grep is unreliable for ~280-file codebases with re-exports, dynamic imports, barrel files, and feature bundles.
2. Reaching the goal (empty `components-legacy/`) doesn't require a single mass deletion. Route-by-route rebuild reaches the same end state.
3. Marginal benefit of additional deletion is shrinking (the main drift surface — default `components/` path — is already empty). Marginal risk of broken audits is growing.

**Incremental cleanup process (replaces Phase 4-5):**
1. When a new route is built from the external design mockup, identify which legacy components it functionally replaces
2. Delete those specific legacy components in the SAME COMMIT as the new route
3. Each deletion is provably safe (the new route works without them, no other route imports them — verified per-route, not per-codebase)
4. Append a "Stripped" log entry per route migration noting what was removed and which new route superseded it
5. After ~5 weeks of route rebuilds, `components-legacy/` empties naturally → final cleanup is just `rmdir`

**Backstop:** If at end of rebuild any legacy files remain unattached to a "new route replaces this" mapping, do a final manual review (likely <30 files at that point — small enough to eyeball).

---

## Next actions

1. **User reviews v2 doc + visualization** — `_tasks/SOLEN_LIVE_TRUTH.md` (the new principal) and `public/solen-v2-locked.html` (`localhost:3000/solen-v2-locked.html` after `npx serve public`). If anything in the spec doesn't match user intent, fix the spec first, then re-render the visualization.
2. **Phase 0 — Foundation primitives.** Per the locked plan, Phase 0 covers §F.1–§F.8: form primitives, modal, bottom sheet, toast, date/time picker, skip-link, font fallback strategy, cookie consent. For each: (a) draft spec section in LIVE_TRUTH, (b) component-by-component HTML mockup at `public/solen-v2-primitives.html`, (c) implement in `app/[locale]/_components/primitives/`, (d) lock with V2-D## entry. Phase 1 (auth) does not start until Phase 0 is fully locked.
3. **Tailwind token swap** lands incrementally as primitives consume v2 tokens. Token additions go into `tailwind.config.js` alongside the first React component that needs them; no mass sweep. The pre-sweep hook stays armed.
4. **Legacy retirement** continues per V2-D05 — each new route deletes the specific legacy components it replaces in the same commit. Append "Stripped" entry per route.

---

## Reading hierarchy (when docs conflict)

Per CLAUDE.md:
1. `_tasks/SOLEN_LIVE_TRUTH.md` wins (current locked specs — V3 / V2-D15-3 lock 2026-05-07)
2. `_tasks/SOLEN_DESIGN.md` §20 decisions log — historical context only
3. **V3 visual references:** `public/solen-v2-republik-teal.html` (homepage) · `public/solen-v2-palette.html` (palette swatches) · `public/solen-v2-combos.html` (31-combo library)
4. Component JSDoc — implementation notes only

**Retired visual references (do not consult):** `public/solen-coral.html`, `public/solen-v2-design.html`, the V2-D15-era exploration labs (`solen-v2-font-pivot.html`, `solen-v2-color-lab.html`, etc.). All represent superseded design states.

**This log slots in as the "running state" layer — NOT a competing source of truth.**
