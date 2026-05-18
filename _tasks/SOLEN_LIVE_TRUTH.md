# Solen — Live Truth (V3 only, V2-D67-fu14 lock 2026-05-17)

> **Single source of truth for the current V3 design system.** No V2-era content, no retired specs, no stale palette. Anything labeled "RETIRED" lives in `_tasks/archive/SOLEN_LIVE_TRUTH_v3-pre-cleanup-2026-05-17.archived.md` for historical reference only. Don't grep the archive for "current state" — it has V2-D15-3 dark teal + Cooper BT + Avant Garde + 6-cat colorways + 31-combo Republik library + frosted-pill text spec, all retired.

> **V3 lock chain** (most recent on top):
> - **V2-D68 (2026-05-18) — Substrate shift + atmosphere retirement.** Substrate `#FAF3E6` cream → `#F8F7F2` subtle off-white. Page-wide atmosphere wash RETIRED entirely (AtmosphereBlobs JSX + body::before/::after pseudo-element gradients). Cards gained 1px hairline shadow-as-border for edge definition on lower-contrast substrate. High-contrast Gen Z aesthetic — brand colors confined to accent moments only.
> - V2-D67-fu14 (2026-05-17) — bare text cards permanently locked + agent pre-flight gates + LIVE_TRUTH archived & rewritten
> - V2-D67-fu13 (2026-05-17) — frosted-pill on card text retired; text region is no-touch
> - V2-D67-fu7 to V2-D67-fu12 (2026-05-16) — badge palette per-category + mobile perf
> - V2-D67 / V2-D66 (2026-05-15) — Fresha-aligned hero (left-align, no eyebrow, no subtitle); personalized greeting
> - V2-D60 (2026-05-14) — Vibrancy tune: emerald `#1A8F5C`, terracotta `#E0703D`, cream `#FAF3E6`, WHITE cards
> - V2-D55 / V2-D54 (2026-05-11) — atmosphere natural-calm pass (5 blobs, normal blend, opacity 0.05-0.08)
> - V2-D52 / V2-D53 (2026-05-11) — salon detail page Fresha IA + V3 visual
> - V2-D51 / V2-D50 (2026-05-10) — SearchBar Hybrid Hub (Path C) shipped
> - V2-D49j (2026-05-10) — color role rule locked (emerald = action, terracotta = highlight)
> - V2-D48 (2026-05-09) — Earthen Wellness Light pivot (foundation for V3)
> - V2-D42 (2026-05-09) — Peace Sans + Open Sauce One typography lock

---

## §0 What this is

Surface specs (§13 hero · §14 search · §16 salon card · §17 scroll row · etc.) describe **what the user sees and what happens when they interact** — not which React component implements it. Component file paths, exact pixel values, and state-machine implementations live in the JSDoc on each component file (e.g. `app/[locale]/_components/homepage/SalonCard.tsx`).

When a section here contradicts production code, fix the doc OR ask the user — never assert from the doc against working code. (See agent pre-flight rule #4 in `CLAUDE.md` "🧠 Visual-work pre-flight".)

---

## §0d · Brand & product non-negotiables

These don't move. If a design question makes you reach for one of these, the answer is "no" before you ask.

1. **Substrate is subtle off-white `#F8F7F2`.** Not cream (V2-D60 retired V2-D68), not pure white. ~97% lightness with faint warm tint. White is for cards only. (V2-D68)
2. **Brand is emerald `#1A8F5C` + terracotta `#E0703D`.** No teal, no purple, no orange. (V2-D60)
3. **Typography is Peace Sans (display) + Open Sauce One (body).** No Cooper, no Avant Garde, no Plus Jakarta, no Inter Tight. (V2-D42)
4. **4 categories only**: Coiffeur, Barbershop, Nails, Spa & Wellness. (Makeup retired V2-D15-3)
5. **Color role rule**: emerald = action affordances only. Terracotta = highlight words only. Never swap. (V2-D49j, see §5h.2)
6. **Pill rule**: white on dark, black on light. No tinted-of-bg colors on pills. (See §5a)
7. **No Unicode emoji in UI**: Lucide icons only. (See §5e)
8. **No italic anywhere in UI**: V2-D15 retirement, still locked.
9. **No atmosphere wash. Period.** V2-D68 retired page-wide atmosphere entirely (was AtmosphereBlobs JSX + body::before/after pseudo-element gradients). Substrate stays quiet, brand colors live as accents on CTAs / badges / category tags / logo dot / h1 highlight word only — not as a page-wide background gradient. To add a localized accent in the future (e.g. behind hero h1 only), build a per-component glow, NOT a page-wide layer.

### §0d.7 · Permanent technical anti-patterns

Read these BEFORE editing layout, body styles, atmosphere wash, salon cards, or section frames. Breaking any silently breaks visible design:

1. ❌ **`bg-white` on `<body>` element.** Kills the §5g atmosphere wash. Substrate lives at `html { background-color: #FAF3E6 }`. Body stays `background: transparent`. (V2-D41-fu)
2. ❌ **Cat-color halo glows on salon-card photos.** Retired V2-D41.4. §16.3.0 universal color formula applies to BADGES only, not photo halos.
3. ❌ **Section padding ↔ ScrollRow negative margin drift.** `SectionFrame.px-X` MUST match `ScrollRow.{-mx-X, px-X}` AND `SectionFrame` MUST have `overflow-hidden`. Changing one without the others = cards stick out past rounded border. (V2-D41-fu)
4. ❌ **"Fixing" Cooper-Black-Std-not-loading by changing font-family order.** Cooper is RETIRED. The current display font is Peace Sans via cdnfonts; Inter via Google Fonts is the body fallback only. Don't reintroduce Cooper / Sansita / Avant Garde / Plus Jakarta. (V2-D42)
5. ❌ **`will-change` / `transform: translateZ(0)` at rest.** Causes blurry text. Only set during transition, then unset.
6. ❌ **Animating `width` / `height` to/from `auto`.** Browsers can't smooth this. Use fixed values or `transform: scale`.
7. ❌ **`mix-blend-mode: multiply` on AtmosphereBlobs.** Retired V2-D54. Multiply darkens everything under blobs, producing a brownish film over cream substrate, cards look tinted, page feels "just beige." Use `mix-blend-mode: normal`.
8. ❌ **Stacking >5 atmosphere blobs at opacity > 0.10 on mobile** OR using cream-cards on cream substrate. Retired V2-D55 + V2-D60. Mobile recipe: 6 blobs at `blur(50px) saturate(1.3)`. Desktop: 14 blobs at `blur(100px) saturate(1.6)`. Cards: WHITE on cream, not cream on cream.
9. ❌ **Surface / pill / wrapper / border / blur / backdrop-blur on the SalonCard text region.** Retired V2-D67-fu13. Bare text below photo is locked. Depth for cards lives in `.photo` shadow or `<FeedZone>` panel opacity, never in text wrapping.
10. ❌ **Unicode emoji in UI.** Use Lucide icons. (V2-D67-fu14 surfaced this — Hero greeting had a `👋` that violated §5e.)
11. ❌ **Inline `style={{ fontFamily: '...' }}` overrides on components.** Use Tailwind `font-display` / `font-body` classes. Inline overrides ship retired fonts (`Plus Jakarta Sans` did this on Hero + SectionHeader for weeks before V2-D67-fu14 caught it).
12. ❌ **Page-wide atmosphere wash, in any form.** V2-D68 retired the entire pattern: AtmosphereBlobs JSX, AtmosphereGrain JSX, body::before/::after pseudo-element gradients, drift animations. The pattern created "visual mush" — washed UI contrast, cards looked slapped on. V3.1 lock: substrate stays quiet off-white, brand colors are accent-only. If you want a single localized glow (e.g. behind hero h1), build it as a per-section component, NOT a page-wide layer. Never reintroduce as global.
13. ❌ **Pure white substrate `#FFFFFF`.** Card surface is white; substrate is `#F8F7F2` off-white. White on white = no contrast between card + page. Substrate needs the faint warmth (~3% darker than white) to make card edges visible.
14. ❌ **Cards without a 1px hairline shadow on V2-D68 substrate.** The 2% lightness delta between off-white substrate and white cards is small — cards need the `0 0 0 1px rgba(26,18,9,0.06)` shadow-as-border to define their edge. Without it, the photo dissolves into the substrate at the corner radius.

> **Shadow research notes (V2-D67-fu16 — kept as reference even though the shadow experiment was reverted V2-D67-fu17).** When card shadow needs revisiting in the future, lessons from the research: (a) pure-black RGB on cream desaturates substrate to grey-brown smudge — use warm-tinted shadow color sampled from substrate hue family per Koos Looijesteijn; (b) uniform alphas across layers read as "stamped" — use exponential decay (e.g. 0.04 → 0.05 → 0.08); (c) Y-offsets > 15% of card width look like "hovering on a stick" — pinch with negative spread; (d) cards on atmospheric substrates need a `0 0 0 1px` hairline shadow-as-border or they dissolve into the wash; (e) Material Design elevation 4-5 is for floating dialogs, not resting cards (M3 elevation 1 only). See V2_REBUILD_LOG V2-D67-fu16 entry for full research citations.

---

## §1 · Brand color (V2-D60)

Solen runs on one accent: **emerald `#1A8F5C`** (`s-brand`). It's the action color — every CTA, primary link, focus outline, success glyph, and active state. Used 60-100× per page in flashes, never as a dominating bg fill (except inside Solen Pro panel takeover surfaces).

**Brand palette:**

| Token | Hex | Use |
|---|---|---|
| `s-brand` | `#1A8F5C` | Primary action color, CTAs, links, focus outlines |
| `s-brand-mid` | `#0F6F44` | Hover state, secondary actions |
| `s-brand-deep` | `#084B2D` | Deepest emerald, used in atmosphere closing zones |
| `s-brand-pale` | `#A8E0BF` | Pale emerald for backgrounds (rare), atmosphere blob hue |
| `s-brand-subtle` | `#D4F2E0` | Spa category bg, surface tints |
| `s-accent` | `#E0703D` | Heartbeat color — highlight words in h1/h2, logo dot |
| `s-accent-soft` | `#F0A98C` | Softer terracotta, decorative |
| `s-accent-deep` | `#A04A22` | Deep terracotta, Nails category text |

**Contrast (key pairings):**
- `#1A8F5C` emerald on `#FFFFFF` white card: **3.85 : 1** AA Large ✓
- `#1A8F5C` emerald on `#FAF3E6` cream substrate: **3.61 : 1** AA Large ✓
- `#0F6F44` brand-mid on `#FFFFFF`: **5.83 : 1** AAA Large + AA Normal ✓
- White on `#1A8F5C` emerald: **5.43 : 1** AAA Large + AA Normal ✓ (use brand-mid for body text on emerald)
- `#2A1F18` ink on `#FAF3E6` cream: **15.21 : 1** AAA ✓ (default body text)

**Anti-patterns:**
- ❌ Inventing emerald near-misses like `#1F8E5B` or `#18A05F`. Use `s-brand` token, never the hex inline.
- ❌ Using `s-brand` on a non-action surface (decorative card border, body text, etc.). Emerald = action only.
- ❌ Using `s-accent` terracotta on a CTA, link, or glyph background. Terracotta = highlight words only. (See §5h.2)

### §1.3 · Logo

Wordmark "Solen" in Peace Sans (display), ink color `#2A1F18`, with trailing dot in terracotta `#E0703D` `s-accent`. The dot is the brand's heartbeat moment — never moved to emerald (that would conflict with §5h.2 color role rule).

```css
.logo {
  font-family: "Peace Sans", Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif;
  font-weight: 700;
  font-size: 22px;
  color: #2A1F18;
}
.logo-dot { color: #E0703D; }
```

**Anti-patterns:**
- ❌ Logo dot in emerald (breaks color role rule + makes logo blend into CTAs)
- ❌ Logo in any font other than Peace Sans (was Cooper BT pre-V2-D42, retired)
- ❌ Logo gradient fill (was V2-era, retired)

---

## §1b · Geographic scope

Solen is **Switzerland-only at launch**. All city pickers, location filters, and address autocompletes are scoped to Swiss cities. Currency is CHF, locale defaults to `de-CH` with `fr-CH` / `it-CH` / `en-CH` translations.

Cities for v1 (8): Basel, Zürich, Bern, Lausanne, Genf, Luzern, St. Gallen, Winterthur.

---

## §2 · Per-category colorways (V2-D60, 4 categories)

Each category has a soft tile bg + a deep text/accent color. Bg lives behind initial-fallback cards and badge tint chips. Text color lives on category labels and the deep accent token for that cat.

| Category | bg (cardCategoryColors.bg) | text (cardCategoryColors.initial) | Mood |
|---|---|---|---|
| Coiffeur | `#FFE8D8` peach | `#E0703D` warm terracotta | Warm / inviting |
| Barbershop | `#EAE0D0` bone | `#2A1F18` ink | Restrained / classic |
| Nails | `#D4DDC8` sage-pale | `#A04A22` terra-deep | Earthy / craftsman |
| Spa & Wellness | `#D4F2E0` emerald-subtle | `#0F6F44` emerald-mid | Calming / cool |

**Anti-patterns:**
- ❌ Reintroducing 6-cat colorways from V2 era (rose, sunny, clay, sage CTA, coral-orange, camel, plum) — retired V2-D15-3
- ❌ Reintroducing V2-D15-3 era category combos (cherry on cream, black on bone, magenta on pale-ice, sandy beige on forest) — retired V2-D48
- ❌ Reintroducing V2-D48 pre-vibrancy values (cream-warm `#FAF2E5` Coiffeur, sage-pale text `#8E4A2D`) — retired V2-D60
- ❌ Reintroducing a 5th category "Makeup" — retired V2-D15-3. If a salon offers makeup, it falls under Coiffeur (haircare context) or stays as a service-level tag.
- ❌ Sage `#A8B89A` as a CTA / button / glyph-bg color — retired V2-D49j (too low contrast on cream). Sage stays only as atmosphere blob hue.

### §2.4 · Category-page colorway takeover

When the user lands on `/{city}/{category}` (e.g. `/basel/coiffeur`), the entire page IS the colorway — soft category bg tile, deep category text on key headings, emerald `s-brand` stays as the connective tissue for CTAs (per §5h.2 color role rule). Hero, sticky filter chrome, empty-state CTAs, and bottom-of-page B2B all use the category's bg + text duo. Emerald never disappears entirely — it always anchors the action affordances regardless of which category page is below.

---

## §3 · Semantic colors

Reserved for universal semantic moments that override the brand's color role rule.

| Token | Hex | Use |
|---|---|---|
| `s-love` | `#FF4A6B` | Heart-saved fill (universal semantic — overrides emerald/terracotta) |
| Success | `#1A8F5C` (= s-brand) | Confirmations, check glyphs — same as brand action color |
| Warning | `#F5B82E` | Warning toasts, attention chips |
| Error | `#D32F2F` | Error toasts, validation failures |
| Info | `#1A8F5C` (= s-brand) | Info toasts — same as brand |

**Anti-patterns:**
- ❌ Using `s-brand` token for hearts. Heart-saved is `#FF4A6B`, not emerald.
- ❌ Inventing new semantic hues. If you need to communicate a state, find which of the 5 above maps.

---

## §4 · Substrate + warm-ink scale

V2-D68 lock: **substrate is subtle off-white `#F8F7F2`. Cards are WHITE `#FFFFFF`.** Substrate has just enough warmth (HSL 43° 21% 96%) not to feel sterile. The 2% lightness delta between substrate + white cards is small — cards rely on a 1px hairline shadow-as-border for edge definition (see §16.2). High-contrast Gen Z aesthetic — brand colors live as accents on CTAs / badges / category tags / hero h1 highlight word, NOT as a page-wide gradient.

| Token | Hex | Class | Use |
|---|---|---|---|
| `s-bg.base` | `#F8F7F2` | `bg-s-bg-base` | Page substrate. Set on `html`. (V2-D68 — was `#FAF3E6` cream pre-V2-D68) |
| `s-bg.surface` | `#FFFFFF` | `bg-white` | Card surfaces, dropdowns, sheets |
| `s-bg.sunken` | `#EAE0D0` | `bg-s-bg-sunken` | Active input bg, lightly recessed regions |
| Border (warm hairline) | `#EAE0D0` | `border-s-border` | Card outlines, divider rules |

**Ink scale (text colors):**

| Token | Hex | Use |
|---|---|---|
| `s-ink` (ink-1) | `#2A1F18` | Default body text, h1 / h2 |
| `s-ink-2` | `#5C4938` | Secondary text, metadata, eyebrows |
| `s-ink-3` | `#8A7660` | Tertiary text, captions, placeholders |

**Anti-patterns:**
- ❌ Reverting substrate to white. Substrate is cream `#FAF3E6` (V2-D60). White is for cards only.
- ❌ Cream-on-cream surface stacking. Cards must be WHITE on cream substrate, not cream-on-cream (caused the V2-D48 "beige collapse" — retired V2-D60).
- ❌ Hardcoded substrate colors `#FBF8F3` (V2-D15 era) or `#F5EBDD` (V2-D48 era) in components — retired.

---

## §5 · Typography (V2-D42 lock)

**Display: Peace Sans** (cdnfonts) — hero h1, logo wordmark, feature h2 moments. Fallback: Impact / Haettenschweiler / Arial Narrow Bold (system fallbacks for the heavy display character).

**Body/UI: Open Sauce One** (cdnfonts) — section h2s, eyebrows, body text, buttons, microcopy, all data labels. 300-900 weights available. Fallback: Inter (Google Fonts) for cdnfonts-failure resilience.

**Both via `@import` in `app/globals.css`:**
```css
@import url('https://fonts.cdnfonts.com/css/peace-sans');
@import url('https://fonts.cdnfonts.com/css/open-sauce-one');
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
```

**Tailwind tokens:**
```js
fontFamily: {
  display: ["'Peace Sans'", "Impact", "Haettenschweiler", "'Arial Narrow Bold'", "sans-serif"],
  heading: ["'Peace Sans'", "Impact", "Haettenschweiler", "'Arial Narrow Bold'", "sans-serif"],
  body:    ["'Open Sauce One'", "Inter", "system-ui", "sans-serif"],
}
```

### §5.1 · Display vs Text rule

**Peace Sans (`font-display`) ONLY at:**
- Hero h1 (homepage `/`)
- Logo wordmark (Header + Footer)
- Optional: a single feature h2 moment per long-scroll page (e.g. WhySolen "Für Salons" headline)

**Open Sauce One (`font-body`) at everything else:**
- Section h2 (e.g. "Zuletzt angesehen", "In der Nähe")
- All h3, h4, h5
- Body text, paragraphs, lists
- Buttons, links, form fields
- Microcopy, captions, metadata, eyebrows
- Numerics (use `font-variant-numeric: tabular-nums` for alignment)

**Why:** Peace Sans is a heavy display character — it shouts. Using it on more than 1-2 moments per page collapses its impact (Uber's display-vs-text lesson — display fonts work when scarce).

### §5.2 · Numerics rule

Prices, ratings, counts, dates, times all use Open Sauce One with `font-variant-numeric: tabular-nums` so digits align in tables / scroll lists.

Big-numerics (e.g. "1'247 Salons" hero stat moments) can switch to Peace Sans 900 for impact, but rare.

### §5.3 · Inline emphasis

When a word needs emphasis inside a headline, swap its color to terracotta `s-accent` `#E0703D` (see §5h.2 V2-D49j heartbeat rule). NEVER bold or italic (italic banned per V2-D15).

Example: in `<h1>Schöner aussehen, schneller buchen.</h1>` — the word "buchen" is wrapped in `<span class="text-s-accent">buchen</span>`.

**Anti-patterns:**
- ❌ Peace Sans on a button label or form input. Display font only at h1 + logo + 1 feature h2.
- ❌ `<em>` italic emphasis. Italic is banned in UI (V2-D15).
- ❌ Underline emphasis. Use color swap to s-accent.
- ❌ Plus Jakarta Sans inline override (V2-D67-fu14 surfaced + retired in Hero.tsx + SectionHeader.tsx — was leftover V2 drift).

---

## §5a · Pill rule

Every pill-shaped UI element (CTA, tag, chip, badge, numbered circle) uses **white on dark** OR **black on light**. No tinted-of-bg colors. Inline links / status text / eyebrows can still use tinted brand colors — the rule is for PILLS specifically.

**Locked pairings:**

| Pill bg | Text color | Use |
|---|---|---|
| Emerald `#1A8F5C` (`s-brand`) | White | Primary CTAs ("Solen durchsuchen", "Termin buchen") |
| Ink `#2A1F18` | White | Secondary actions, contextual buttons |
| White | Ink `#2A1F18` | Outline CTAs, secondary pills |
| Emerald-subtle `#D4F2E0` | Brand-mid `#0F6F44` | Tag pills, inactive segment chips |

**Hover state:** brand `#1A8F5C` → brand-mid `#0F6F44` (darker, NOT lighter).

**Anti-patterns:**
- ❌ Tinted emerald pills (e.g. emerald-pale bg + brand text). Use the locked pairings.
- ❌ Italic text inside pills.
- ❌ Tinted brand-color drop shadows on CTAs (e.g. `rgba(26,143,92, .18)`). Pills use ink-based shadows: `rgba(26,18,9, X)`.
- ❌ Inset Web 2.0 gloss highlight on pills. V2-D15-4 retired this.
- ❌ Gradient pill backgrounds. Flat fills only.

---

## §5b · Depth system

Layered shadows in 5 levels. All shadows use ink-based RGB `(26, 18, 9)` (cooler than warm cream tones, doesn't tint the surface beneath).

| Level | Use | Shadow recipe |
|---|---|---|
| L1 flat | Default body text, untreated content | none |
| L2 surface | Search bar, secondary cards | `inset 0 1px 0 rgba(255,255,255,.6), 0 2px 8px rgba(26,18,9,.06)` |
| L3 elevated | Salon cards (photo), modal headers | `0 1px 2px rgba(26,18,9,.04), 0 4px 10px rgba(26,18,9,.05)` |
| L4 floating | Hover-lifted cards, dropdowns | `0 1px 2px rgba(26,18,9,.05), 0 6px 14px rgba(26,18,9,.06), 0 12px 24px rgba(26,18,9,.05)` |
| L5 modal | Open modals, sheets | `0 16px 40px rgba(26,18,9,.10), 0 6px 16px rgba(26,18,9,.06)` |

**Anti-patterns:**
- ❌ Aggressive emerald-tinted glow shadows on cards (`rgba(26,143,92, .32+)`) — looks like cat-color halo from V2-D41.4 retired.
- ❌ Mixing shadow levels in one composition (e.g. L3 card with L5 inner element).
- ❌ Linear-gradient drop shadows. Stick to layered solid shadows.

---

## §5c · Personality tokens (motion timing + easing)

All motion uses one of 4 named easings. Custom curves require a documented reason.

| Token | Curve | Use |
|---|---|---|
| `ease-snap` | `cubic-bezier(0.4, 0, 0.2, 1)` | Fast UI feedback (button press, toggle) — 100-200ms |
| `ease-spring` | `cubic-bezier(0.32, 0.72, 0, 1)` | Bouncy entry (modal scale-in, dropdown bloom) — 250-400ms |
| `ease-glide` | `cubic-bezier(0.23, 1, 0.32, 1)` | Smooth content transitions (hover lift, scroll-in) — 200-300ms |
| `ease-thud` | `cubic-bezier(0.55, 0, 0.55, 1)` | Heavy decisive transitions (sheet close, page exit) — 200ms |

**Heart save toggle (§5c.7) — V2-D67-fu13 spec:**
- Saved state: semi-transparent love-red fill `rgba(255, 74, 107, 0.65)` + opaque stroke + dual drop-shadow (love-red glow `0 0 8px rgba(255,74,107,0.4)` + white highlight `0 1px 0 rgba(255,255,255,0.6)`)
- Unsaved state: outline only, ink-3 stroke
- Transition: 200ms `ease-glide` on fill + 80ms `ease-snap` on scale `0.92 → 1`

---

## §5d · Inline emphasis (color swap)

When you emphasize a word inside a sentence/headline, swap its color to terracotta `s-accent` `#E0703D` per the V2-D49j heartbeat rule (§5h.2). NEVER swap to emerald (that would conflict with the action role rule — readers would parse the emphasized word as a clickable affordance).

Example: Hero h1 "Schöner aussehen, schneller [span text-s-accent]buchen[/span]."

The "buchen" terracotta swap is the heartbeat. It tells the eye "this is the verb", separate from CTAs (which are emerald).

---

## §5e · Iconography

**Lucide React** (`lucide-react` package, already in deps). No Phosphor, no Feather, no Heroicons, no custom SVGs without a documented reason.

**No Unicode emoji in UI** — including 👋, ⭐, 🔥, 📍, etc. Use Lucide's equivalent (`Hand`, `Star`, `Flame`, `MapPin`).

V2-D67-fu14 surfaced an exception that had been shipping: Hero greeting used `👋` Unicode hand-wave. Retired.

**Anti-patterns:**
- ❌ Mixing icon libraries on one surface. Lucide only.
- ❌ Emoji as bullet points or category indicators.
- ❌ Hand-drawn SVGs that duplicate a Lucide icon.

---

## §5g · Atmosphere wash — RETIRED V2-D68

**This section is RETIRED.** Page-wide atmosphere wash was removed entirely V2-D68 (2026-05-18) per user feedback: "atmosphere wash creates visual mush, washes out UI, cards look slapped on top, lets do subtle off white."

What was retired:
- `<AtmosphereBlobs />` JSX component mount on `app/[locale]/page.tsx` (component file preserved at `_components/homepage/AtmosphereBlobs.tsx` for possible future use as per-section localized accent)
- `<AtmosphereGrain />` JSX component mount (same — file preserved)
- `body::before` 5-layer multi-radial-gradient cloud zones (was V2-D60-fresha lock)
- `body::after` 12-layer micro-gradient cloud echoes (was V2-D60-fresha lock)
- `@keyframes atm-drift-1` + `atm-drift-2` animations on the body pseudo-elements

What replaced it:
- Substrate `#F8F7F2` subtle off-white does the entire "page feel" job
- Brand colors live as accent moments: emerald `s-brand` on CTAs / success glyphs / focus outlines, terracotta `s-accent` on logo dot + h1 highlight word, V3 cat colors on category tag bgs + photo fallbacks, semantic colors on badges (green / pink-red / blue glass per V2-D67-fu7 layered-glass recipe)

If atmosphere needs to come back (e.g. behind hero h1 only), build a **localized component** inside the relevant section — never reintroduce as a page-wide layer.

Historical V2-D67-fu12 recipe (do not implement, archived for reference): 14 blobs desktop / 6 mobile, mix-blend-mode normal, opacity 0.20-0.38, blur(100px) saturate(1.6) desktop / blur(50px) saturate(1.3) mobile, deep V3 cat-text colors. Full recipe lives in the archived doc at `_tasks/archive/SOLEN_LIVE_TRUTH_v3-pre-cleanup-2026-05-17.archived.md` plus git history of `AtmosphereBlobs.tsx`.

---

## §5g-OLD · Atmosphere wash (V2-D67-fu12 recipe — RETIRED V2-D68, kept for archeology)

> Below this line is the previous V2-D67-fu12 atmosphere spec, kept inline only because the V3 lock chain refers to it. Do not implement.

Solen's "feel" comes from a page-wide atmosphere wash — soft blurred color blobs at low opacity that bleed through behind all content. Built as React component `AtmosphereBlobs.tsx` in `app/[locale]/_components/homepage/`.

**Locked recipe (production):**

| Property | Mobile (<768px) | Desktop (≥768px) |
|---|---|---|
| Blob count | 6 | 14 |
| Filter | `blur(50px) saturate(1.3)` | `blur(100px) saturate(1.6)` |
| Blend mode | `normal` (NEVER multiply) | `normal` (NEVER multiply) |
| Opacity range | 0.20 — 0.38 | 0.20 — 0.38 |
| Container | `absolute top-0 left-0 right-0 -z-10` (650vh height) | Same |

**Palette (V2-D65 swap to V3 cat-text deep colors):**

| Const | Hex | Category role |
|---|---|---|
| `C_TERRACOTTA` | `#E0703D` | Coiffeur text — accent (deep warm) |
| `C_TERRA_DEEP` | `#A04A22` | Nails text — terra-deep |
| `C_INK` | `#2A1F18` | Barbershop text — ink (cool deep neutral) |
| `C_EMER_MID` | `#0F6F44` | Spa text — emerald-mid |
| `C_BRAND` | `#1A8F5C` | s-brand emerald |
| `C_BRAND_DEEP` | `#084B2D` | emerald-deep (closing zone anchor) |

**7 vertical zones across 650vh container** (warmer / cooler alternating to create a scroll journey):
- 0-80vh: Hero zone — warm welcome (terracotta + emerald)
- 60-160vh: Cool zone (emerald + ink hints)
- 140-240vh: Warm cluster (terracotta + terra-deep)
- 220-320vh: Cool (emerald-mid + brand)
- 300-400vh: Warm again (terracotta + brand)
- 380-480vh: Cool (emerald-mid + brand-deep)
- 460vh+: Closing zone (brand-deep + terracotta echo)

Each blob has organic asymmetric `border-radius` (6 R-templates rotating: e.g. `60% 40% 50% 50% / 60% 60% 40% 40%`).

**Mobile perf (V2-D67-fu12):**
- Blobs 7+ hidden under 768px via `hidden md:block`
- Blur halved (100px → 50px) via CSS class media query (NOT inline filter, which can't be breakpoint-overridden)
- Result: ~14 desktop blobs at full blur → 6 mobile blobs at half blur. Dramatic GPU savings on iOS Safari without changing desktop look.

**Z-stacking:** AtmosphereBlobs sits at `z-index: -10` with `isolation: isolate`, below all page content (which renders at z-1+ via Section + FeedZone).

**Anti-patterns:**
- ❌ `mix-blend-mode: multiply` — darkens cream substrate to "beige film". Retired V2-D54.
- ❌ >5 blobs at opacity > 0.10 on mobile, or full 14-blob count without `hidden md:block` gating — retired V2-D55 (vibrant glow ate substrate) + V2-D67-fu12 (mobile perf).
- ❌ V2-D15-3 era pale cyan + navy palette (`#CAE8FF`, `#005898`, `#031E48`) — retired V2-D65.
- ❌ V2-D48 era pre-vibrancy palette (`#5BAE85`, `#D6754F`, `#F0C85A`) — retired V2-D65.
- ❌ Per-page atmosphere variants (Coiffeur cyan core vs Nails ice-blue). Atmosphere is global, single recipe per app.
- ❌ Wash as `body::before` / `body::after` pseudo-elements. Retired V2-D64 — wash is a React component now.

---

## §5h · Color philosophy (the locked design law)

1. **Cream substrate is permanent.** Every page, every screen, `#FAF3E6`. White is for cards only.
2. **Emerald `#1A8F5C` (`s-brand`) appears 60-100× per page.** Logo, CTAs, links, active states, success glyphs.
3. **Terracotta `#E0703D` (`s-accent`) appears 1-3× per page.** Heartbeat words only.
4. **No more than 2 saturated CTAs per fold.** 1-2 emerald-filled pills per visible area; everything else is subtle/outlined.
5. **Pastels live as soft category tiles or atmosphere blobs only.** Not as text bg, not as CTA fills.
6. **Pill rule is universal.** White on dark OR black on light. No tinted-of-bg colors. (See §5a)
7. **Sage stays atmosphere-only.** Retired as CTA / button / glyph bg color V2-D49j.
8. **Peace Sans display, Open Sauce One body.** No exceptions inline. (See §5)
9. **Color role rule (V2-D49j):** emerald is the ONLY action color. Terracotta is the ONLY highlight color. They never swap.

### §5h.1 · Cumulative palette (V2-D60 LIVE — single source)

This is the authoritative palette. If a hex isn't on this list, it's not in V3.

**Brand:**
- `#1A8F5C` s-brand (action color)
- `#0F6F44` s-brand-mid (hover state)
- `#084B2D` s-brand-deep (atmosphere closing zone)
- `#A8E0BF` s-brand-pale (atmosphere hue)
- `#D4F2E0` s-brand-subtle (Spa cat bg, surface tints)

**Accent (heartbeat):**
- `#E0703D` s-accent (highlight words, logo dot)
- `#F0A98C` s-accent-soft (decorative)
- `#A04A22` s-accent-deep (Nails cat text)

**Substrate + surface:**
- `#FAF3E6` s-bg.base (cream substrate)
- `#FFFFFF` s-bg.surface (white cards)
- `#EAE0D0` s-bg.sunken (active input bg)
- `#EAE0D0` s-border (warm hairline)

**Ink:**
- `#2A1F18` s-ink (default body)
- `#5C4938` s-ink-2 (secondary)
- `#8A7660` s-ink-3 (tertiary, placeholders)

**Categories:**
- Coiffeur bg `#FFE8D8`, text `#E0703D`
- Barbershop bg `#EAE0D0`, text `#2A1F18`
- Nails bg `#D4DDC8`, text `#A04A22`
- Spa bg `#D4F2E0`, text `#0F6F44`

**Semantic:**
- `#FF4A6B` s-love (heart-saved fill)
- `#F5B82E` warning
- `#D32F2F` error

**Atmosphere blob colors:** all from the above palette (cat text deep colors). No separate atmosphere palette.

**Total authorized hexes: 22.** Anything else = drift.

### §5h.2 · Color role rule (V2-D49j — emerald action / terracotta highlight)

**Emerald `s-brand` (`#1A8F5C`) is the ONLY color allowed on action affordances:**
- Primary CTA fills ("Solen durchsuchen", "Termin buchen", "Anmelden")
- Primary link text + hover
- Focus outlines (form fields, interactive cards)
- Success / check glyphs (confirmations, "Heute frei" pill)
- Active chip / segment states (filter pills, search segment active)
- Saved-state outlines (not heart fill — heart uses `s-love`)
- Number-pill / step-indicator backgrounds
- Loading spinners + progress bars

**Terracotta `s-accent` (`#E0703D`) is the ONLY color allowed for:**
- Highlight words inside h1/h2 display text (e.g. Hero "buchen", WhySolen "Solen-Partner.")
- Logo trailing dot
- Eyebrow leading-dot decorations

**Terracotta is NEVER used on:**
- ❌ Buttons, CTAs, primary links
- ❌ Glyph backgrounds (check icons, status dots)
- ❌ Active chip states
- ❌ Focus outlines
- ❌ Hover states for action affordances

**Heart-saved is the universal-semantic exception:** uses `s-love` `#FF4A6B`, not emerald or terracotta. This is the only color outside the role rule.

**Why:** if both emerald and terracotta could appear on action affordances, the user can't reliably parse what's clickable. Terracotta becomes the "this word matters" signal, emerald becomes the "this is interactive" signal. Two distinct semantic roles, two distinct colors.

---

## §F · Foundation primitives

Lives in `app/[locale]/_components/primitives/`. Each primitive has its own JSDoc with full state matrix + accessibility notes — read the component file, don't re-doc here.

| Primitive | File | Notes |
|---|---|---|
| TextInput / Textarea / Select | `primitives/{TextInput,Textarea,Select}.tsx` | Native HTML + cva variants. Layout-shift-safe border (1px + ring-1 ring-inset). Open Sauce One body. |
| Checkbox / Radio / Switch | `primitives/{Checkbox,Radio,Switch}.tsx` | Native + cva. Emerald `s-brand` for checked/active states. |
| PillToggle + PillGroup | `primitives/{PillToggle,PillGroup}.tsx` | Multi/single select pill UI. `aria-pressed` (not aria-checked) since rendered as `<button>`. |
| RadioGroup | `primitives/RadioGroup.tsx` | Layout container for native radio buttons. |
| Modal | `primitives/Modal.tsx` | `react-aria-components` Modal + ModalOverlay + Dialog. 3 sizes (sm/md/lg). Warm-ink backdrop `rgba(26,18,9,0.40)`. |
| Sheet (bottom) | `primitives/Sheet.tsx` | Same RAC stack as Modal, bottom-anchored. 3 height variants. Mobile-only-w-desktop-fallback. |
| Toast | `primitives/Toast.tsx` | Hand-rolled queue + Context. 4 tones (success/info/warning/error). Bottom-right desktop / bottom-center mobile. Max 3 visible. |
| DateTimePicker | `primitives/DateTimePicker.tsx` | Uses `@internationalized/date` + custom calendar. Emerald selected day. |
| Cookie consent | `primitives/CookieConsent.tsx` | Auto-mounts banner via `<CookieConsentProvider>`. Bottom-center mobile / bottom-right desktop. |

**Universal primitive rules:**
- Use `font-body` (Open Sauce One) for all text
- Emerald `s-brand` for checked/active/focus states
- Warm-ink (`rgba(26,18,9, X)`) for backdrops + shadows (never pure black or pure gray)
- Layout-shift-safe borders (1px border + ring-1 ring-inset)
- Motion via `ease-snap` (100-200ms feedback) or `ease-spring` (250-400ms entry)
- `motion-reduce:` collapses to opacity-only 100ms

---

## §12 · Header

Sticky top, full width. Logo left, category scroll-row + actions right. Transparent at top, glass-tint when scrolled.

**Composition:**
- Logo (Peace Sans wordmark + terracotta dot)
- Category scroll-row mobile (Coiffeur · Barbershop · Nails · Spa) with right-edge mask fade
- Actions desktop: city picker pill + bell + avatar
- Salon detail page variant: slides up (`-translate-y-full`) on scroll-down past 200px, returns on scroll-up past 100px (hysteresis)

**Implementation:** `app/[locale]/_components/layout/Header.tsx`. Detailed spec lives in JSDoc on the component file.

**Anti-patterns:**
- ❌ Nav links (About / Pricing / Features) — Solen has no horizontal nav. Header is logo + actions only.
- ❌ Bottom nav (BottomTabBar) — retired Q58. PWA may re-introduce later.

---

## §13 · Hero (V2-D67 lock)

**Composition:**
```
Hallo, {Name}        ← optional greeting (V2-D66, authed users only, no emoji per V2-D67-fu14)
Schöner aussehen,
schneller buchen.    ← h1 with "buchen" in terracotta s-accent
[SearchBar]          ← V2-D51 Hybrid Hub
```

**Specs:**
- Left-aligned at all viewports (no centered mobile — V2-D67)
- NO eyebrow above h1 (V2-D67 dropped V2-D15-4 editorial eyebrow)
- NO subtitle between h1 and SearchBar (V2-D67-fu2 dropped)
- NO counter pill ("47 Salons in Basel haben heute frei") — V2-D67-fu14 deleted entirely
- NO quick chips below SearchBar (Heute / Last-Min / Nearby) — V2-D67-fu14 deleted entirely
- Greeting: `font-body` (Open Sauce One) 16px mobile / 18px desktop, font-medium, text-s-ink-2. NO emoji (👋 retired V2-D67-fu14 per §5e).
- h1: `font-display` (Peace Sans) `clamp(36px, 6vw, 60px)` extrabold, `leading-[1.05]` tracking `-0.02em`, color `s-ink`, "buchen" wrapped in `<span text-s-accent>` per V2-D49j heartbeat rule.
- `mb-10` between h1 and SearchBar (was `mb-8` pre-V2-D67-fu3)
- Container: `min-h-[70vh]` mobile, `min-h-[92vh]` desktop (V2-D67-fu12 — was 88vh/92vh)
- Vertically centered content via `flex flex-col justify-center`
- Padding: `pt-[100px] pb-12 md:pt-32 md:pb-16`, horizontal `px-5 md:px-8`
- Max-width container `max-w-[1280px]`

**Implementation:** `app/[locale]/_components/homepage/Hero.tsx`. Server component. Reads session for greeting (V2-D66 Hayden move #14).

**Anti-patterns:**
- ❌ Inline `style={{ fontFamily: '...' }}` overrides. Use `font-display` / `font-body` Tailwind classes. (V2-D67-fu14 retired Plus Jakarta Sans inline drift.)
- ❌ Re-adding eyebrow / subtitle / counter pill / quick chips — V2-D67 + V2-D67-fu2 explicitly retired these. If user wants this content back, raise as a v2 roadmap item.
- ❌ Centered alignment on mobile. Hero is left-aligned at all viewports per V2-D67.
- ❌ 👋 or any other Unicode emoji in greeting. (Use Lucide if a hand-wave glyph is genuinely needed.)

---

## §14 · SearchBar (V2-D51 Hybrid Hub)

**Architecture:** Static pill + dropdown/sheet expand. NOT a morphing-island animation (V2-D41.8 morph retired V2-D50).

**Composition:**
- 3 segments: Service / Stadt / Zeit
- Horizontal pill desktop, vertical-stacked pill mobile
- Right-divider hairlines between segments
- Active segment: `bg-s-bg-sunken` (not emerald — emerald reserved for action affordances per §5h.2)
- Submit CTA: emerald `s-brand` filled pill, text "Solen durchsuchen"

**Picker behaviors:**
- **Desktop:** picker renders as dropdown anchored below the bar (`absolute top-full mt-3 z-50`), white card with 24/48px stack shadow, fade+slide-down animation 0.18s `ease-glide`. Click-outside dismisses.
- **Mobile:** picker renders as full-screen takeover sheet (`fixed inset-0 z-[100]`) with own header: ArrowLeft back button + Peace Sans 36px title (Suchen / Standort / Datum & Zeit) + body scroll lock + footer Suchen button. Explicit back button (no click-outside).

**Service hub** (empty state, before user types):
- 4 category grid (Coiffeur / Barbershop / Nails / Spa) with V3 cat bg + cat text
- Trending row (4 curated services with usage stats)
- Featured row (static demo salons until backend hookup)
- Recent searches row (localStorage-backed, capped 5, deduped)

**Service results** (after user types ≥ 2 chars):
- Grouped Services / Salons / Stylisten sections
- Real backend `/api/search/suggest` (300ms debounce, AbortController for stale-request cancellation)

**Stadt picker:**
- "Aktueller Standort" hero pill at top
- 8 city rows: Basel / Zürich / Bern / Lausanne / Genf / Luzern / St. Gallen / Winterthur
- Each city = 40×40 emerald-subtle bg + emerald icon box + city name. Selected = emerald bg + white icon.

**Zeit picker:**
- 2 quick cards: Today / Tomorrow (grid-cols-2 gap-3, picked = emerald-subtle bg + emerald border)
- Calendar primitive (`@internationalized/date` based)
- 4 period-of-day chips: Morgens / Mittags / Nachmittags / Abends (V2-D49 retained these)

**Auto-advance pick → next-segment** (V2-D49): picking Service auto-opens Stadt → picking Stadt auto-opens Zeit → picking date or period on last segment does NOT auto-close; user must hit Suchen.

**Submit behavior:** Suchen submits to `/search?q=...&service=...&city=...&date=...` URL with query params. Free-text submit without segment pick = `q=...` fallback only.

**Implementation:** `app/[locale]/_components/homepage/SearchBar.tsx` (~880 lines). Hooks: `useSearchSuggest.ts`, `useRecentSearches.ts`. Data: `searchCategories.ts`, `searchTrending.ts`, `searchFeatured.ts`.

**Anti-patterns:**
- ❌ Morphing pill animation that grows the entire bar into a 600px card with backdrop dim. Retired V2-D50 — felt modal/popup, not menu/dropdown.
- ❌ Emerald-filled active segment. Emerald is action color only; active segment uses `bg-s-bg-sunken` per §5h.2.
- ❌ Filter tabs (Alle / Services / Salons / Stylisten) until `/search` results page supports entity-type filtering. Half-shipping is worse than not shipping.
- ❌ Stale `cover_image` column reference in `/api/search/suggest` — the column is `cover_photo_url` (V2-D51 caught + fixed a pre-existing bug).

---

## §15 · Section header + FeedZone (V2-D41-rising-panel)

**Quick reference (lock):**

```
<Section>           ← outer wrap (Section.tsx)
  <FeedZone>        ← rising-panel: rounded top, white-glass bg, soft upward shadow
    <SectionFrame>  ← horizontal padding container (overflow-hidden)
      <SectionTitle title="..." link={...} scrollRef={ref}/>
      <ScrollRow ref={ref}>
        {children}  ← cards
      </ScrollRow>
    </SectionFrame>
  </FeedZone>
</Section>
```

**SectionTitle** (V2-D66 simplification):
- h2 title in `font-body` Open Sauce One bold (NOT Peace Sans — display only for hero h1 + logo per §5)
- Circled arrow link target (right of title) with hover state
- Desktop: scroll-row left/right circle buttons (`hidden md:flex`) — emerald-on-cream
- Mobile: no scroll buttons (touch-swipe handles it)

**FeedZone** (V2-D65 transparent — V2-D67-fu17 reverted V2-D67-fu15 tint experiment):
- Wraps homepage section feeds
- Rounded top corners (28px mobile / 40px desktop)
- **No bg fill, no backdrop-blur** — V2-D65 dropped the glass tint; atmosphere reads at full chroma below cards
- Border top: `1px solid white/40`
- Soft upward shadow: `0 -12px 32px rgba(26,18,9,0.04)` mobile / `0 -16px 40px rgba(26,18,9,0.05)` desktop (ink RGB — V2-D67-fu15 fixed the previously-retired V2-D15-3 teal RGB drift, that fix is kept even after the V2-D67-fu15 tint revert)
- Sits BELOW hero (slight negative margin overlap: `-mt-6 md:-mt-8`)

**Implementation:** `app/[locale]/_components/homepage/SectionHeader.tsx` (exports Section / FeedZone / SectionFrame / SectionTitle / ScrollRow + ScrollCircleButton).

**Anti-patterns:**
- ❌ Plus Jakarta Sans inline on section h2 — retired V2-D67-fu14 (was drift).
- ❌ V2-D15-4 editorial section-break pattern (1px ink top rule + eyebrow-left + meta-right + Cooper BT h2). Retired V2-D41.
- ❌ Solid white FeedZone bg. The whole point of FeedZone is white-tint glass — let atmosphere bleed through faintly.

---

## §16 · Salon card (V2-D67-fu13 BARE TEXT lock)

**Hard constraint (V2-D67-fu13):** the text region below the photo is BARE TEXT. No pill, no surface, no container, no border, no backdrop-blur, no wrapper. Depth in this region comes from photo shadow + section panel opacity, NEVER from wrapping text.

### §16.1 · Anatomy

```
┌──────────────────────┐
│ [Discount/Curation] ♥│ ← top-left badge + top-right floating heart
│                      │
│      PHOTO 1:1       │ ← aspect-square, rounded-[18px], shadow
│                      │
│ [● Heute frei]       │ ← bottom-left availability badge (when applicable)
└──────────────────────┘
Salon Name                ← Row 1 (h3, Open Sauce One 15px semibold)
Address · City            ← Row 2 (Open Sauce One 13px ink-3)
14:30 · CHF 80     ★ 4.9  ← Row 3 (Open Sauce One 13px, rating right-aligned)
```

**Three photo overlays:**
1. **Top-left**: badge slot (curation OR discount, never both)
2. **Top-right**: heart save toggle (floating circle bg)
3. **Bottom-left**: availability badge (optional)

### §16.2 · Dimensions

| Element | Spec |
|---|---|
| Width mobile | `calc((100vw - 44px) / 2.2)` (~157px at 390vw — supports "2 + bit of 3rd" peek) |
| Width sm+ | `calc((100% - 24px) / 3)` (3 cards per row) |
| Width md+ | `calc((100% - 36px) / 4)` (4 cards per row) |
| Width lg+ | `calc((100% - 48px) / 5)` (5 cards per row) |
| Width xl+ | `calc((100% - 60px) / 6)` (6 cards per row) |
| Photo aspect | 1:1 (`aspect-square`) — V2-D60-cards-6 |
| Photo radius | `rounded-[18px]` — V2-D60-cards-6 |
| Photo shadow (V2-D68) | `0 0 0 1px rgba(26,18,9,0.06), 0 1px 2px rgba(26,18,9,0.04), 0 4px 10px rgba(26,18,9,0.05)` — V2-D41 baseline 2-layer subtle shadow + V2-D68 `0 0 0 1px` hairline shadow-as-border for edge definition on off-white substrate. Hover adds proportional emphasis on hairline + shadow. |
| Photo → text gap | `mt-[10px]` |
| Text container | **none — BARE TEXT** (V2-D67-fu13) |
| Text rows | 3: Name / Address · City / nextSlot · CHF + ★rating right-aligned (V2-D60-cards-7) |

### §16.3 · Photo overlays

#### §16.3.0 · Universal badge color formula (V2-D67-fu7 layered-glass + hue-matched text)

Shared geometry across ALL card badges (discount / availability / curation):
- `rounded-[10px]` rectangle (NOT pill 999px — V2-D63)
- Top-left or bottom-left position
- `px-3 py-1.5` padding
- `font-body text-[11px] font-semibold` (sentence case, NOT uppercase — V2-D67-fu7 dropped uppercase)
- `tracking-[0.01em]`, `leading-[1.2]`
- Mobile: `max-md:![backdrop-filter:none]` to kill iOS Safari compositor-layer perf cost
- Desktop: layered-glass bg recipe

**Layered-glass recipe (V2-D67-fu7):**
```ts
function layeredGlass(rgb: string, bgAlpha = 0.22, borderAlpha = 0.32) {
  return {
    background: `rgba(${rgb}, ${bgAlpha})`,
    border: `1px solid rgba(${rgb}, ${borderAlpha})`,
    backdropFilter: "blur(14px) saturate(1.1)",
    WebkitBackdropFilter: "blur(14px) saturate(1.1)",
    boxShadow: "0 1px 3px rgba(26, 18, 9, 0.06)",
  };
}
```

**Per-semantic palette (V2-D67-fu10/fu11) — hue-matched dark text:**

| Semantic | RGB | Text color | Use |
|---|---|---|---|
| Discount / Sale | `252, 165, 165` (pink-red) | `text-red-900` | "-20%", "Angebot" |
| Urgent / Last slot | `96, 165, 250` (blue) | `text-blue-900` | "Schnell weg", "Limited" |
| Available now / today | `74, 222, 128` (green) | `text-emerald-900` | "Heute frei", "Jetzt frei", "Diese Woche" |
| Favorit / Featured | `42, 31, 24` (dark ink) | `text-white` | "Solen Favorit", "Featured" |
| Pause / Closed | `122, 105, 87` (muted) | `text-white` | "Geschlossen", "Pause" |
| Neutral / Curation | `255, 255, 255` (white) | `text-s-ink` | "Solen Choice", neutral curation |

**Anti-patterns:**
- ❌ Pill geometry (`rounded-full`) on badges. Use `rounded-[10px]` rectangle per V2-D63.
- ❌ Uppercase badge labels. Sentence case per V2-D67-fu7 ("dont use caps lock like u did on heute frei").
- ❌ Brown-on-yellow text combos. Use hue-matched dark text per V2-D67-fu10 ("doesnt make scence").
- ❌ Cat-color halo glow on photo (`bg-cat-coiffeur` ring around the photo). Retired V2-D41.4 — these read as static-shadow bugs.
- ❌ Backdrop-blur on chips under 768px. Use the `max-md:![backdrop-filter:none]` override per V2-D67-fu12.

### §16.3.3 · Heart icon (V2-D67-fu13 saved-state recipe)

- Unsaved: outline only, `text-s-ink-3` stroke, no fill, no bg circle (just SVG on photo).
- Saved: semi-transparent love-red fill `rgba(255, 74, 107, 0.65)` + opaque stroke + dual drop-shadow:
  - Glow: `drop-shadow(0 0 8px rgba(255, 74, 107, 0.4))`
  - Highlight: `drop-shadow(0 1px 0 rgba(255, 255, 255, 0.6))` (mimics glass sheen)
- Transition: 200ms `ease-glide` on fill + 80ms `ease-snap` scale `0.92 → 1`

### §16.4 · Text rows (Row 1 / 2 / 3)

**Row 1 (Name):**
- h3, `font-body text-[15px] font-semibold leading-[1.25] tracking-[-0.01em]`
- Color `s-ink`
- `truncate` (single line, overflow-ellipsis)

**Row 2 (Address · City):**
- `font-body text-[13px] leading-[1.35]`
- Color `s-ink-3`
- Format: `{address} · {city}` if address provided, else `{CATEGORY_LABEL[category]}` fallback
- V2-D60-cards-8 (was variant-driven; now unified)

**Row 3 (nextSlot · CHF + ★rating):**
- `font-body text-[13px] leading-[1.35]`
- Container: flex baseline justify-between
- Left: `nextSlotLabel` semibold ink + " · " + "CHF X" ink-2 (truncate)
- Right: ★ + `rating.toFixed(1)` (Star icon `#F3A864` fill, no stroke, 11×11px). Color `s-ink` semibold tabular-nums.

### §16.5 · Variants (deprecated)

`variant` prop kept for backward compat but no longer drives content. ALL cards render the same unified 3-row layout per V2-D60-cards-7.

### §16.6 · Hover (V2-D41 softened)

- `-3px translateY` + `1.015 scale`
- Layered shadow stack: base `0 1px 2px rgba(26,18,9,0.04), 0 4px 10px rgba(26,18,9,0.05)` → hover `0 1px 2px rgba(26,18,9,0.05), 0 6px 14px rgba(26,18,9,0.06), 0 12px 24px rgba(26,18,9,0.05)`
- 200ms `ease-glide`
- Active: `scale-[0.97]` 80ms `ease-glide`

### §16.7 · Photo fallback (V2-D67-fu14 — V2-D60 sync)

When `photoUrl` is null, fallback renders:
- Background: cat bg color from `cardCategoryColors[category].bg`
- Center: first letter of name (uppercase) in cat text color, `font-display` Peace Sans 42px black

**`cardCategoryColors` map (V2-D60 values, V2-D67-fu14 sync — was stuck on V2-D48 hexes):**
- coiffeur: `bg: "#FFE8D8", initial: "#E0703D"` (peach + warm terracotta)
- barbershop: `bg: "#EAE0D0", initial: "#2A1F18"` (bone + ink)
- nails: `bg: "#D4DDC8", initial: "#A04A22"` (sage-pale + terra-deep)
- spa: `bg: "#D4F2E0", initial: "#0F6F44"` (emerald-subtle + emerald-mid)

**Implementation:** `app/[locale]/_components/homepage/SalonCard.tsx`.

---

## §17 · ScrollRow

Horizontal-scroll snap container for card rows.

**Specs:**
- `overflow-x-auto snap-x snap-mandatory`
- 12px gap between cards
- Negative horizontal margin to bleed against SectionFrame edge
- Padding-x to match SectionFrame (must equal, otherwise cards stick out past rounded border — see §0d.7 anti-pattern #3)
- `scroll-padding-inline-start: 16px` mobile / 24px desktop

**Card count per row (V2-D60.1):** 12-15 server-loaded per row (bumped from 8-10 for fuller side-scroll feel). NOT infinite scroll — user uses "Alle →" link in section header to see full list.

**Desktop arrow buttons:** `hidden md:flex`, emerald-on-cream circle buttons (32px), bg `bg-white border border-s-border`. Hover: emerald-subtle bg.

**Implementation:** `app/[locale]/_components/homepage/SectionHeader.tsx` (exports ScrollRow).

---

## §18 · Entdecken (inspo / look discovery)

**Status: NOT BUILT in V3 production yet.** Spec preserved as future-feature reference; revisit when implementing.

Vertical card carousel with photo/video looks, source attribution, save + share actions. Tap → detail sheet.

---

## §19 · City tiles ("Solen in deiner Stadt")

Section with one tile per Swiss city (8 v1). Each tile = gradient bg with city name + salon count.

**Spec:**
- 3 cards per row desktop, 2 mobile
- Aspect 4:3 cards
- Background: linear-gradient(160deg, emerald-mid `#0F6F44` 0%, emerald-deep `#084B2D` 100%)
- City name: `font-display` Peace Sans 28px white
- Salon count: `font-body` 14px brand-pale `#A8E0BF`
- Aktuell dot (current city): 5px emerald `#1A8F5C` filled circle

**Anti-patterns:**
- ❌ Per-city gradient colors (different gradient per city). Retired — visual chaos.
- ❌ Brand-teal gradients (`#0A6873 → #043338`) — V2-D15-3 era retired.

---

## §20 · B2B promo card ("Solen für Salons")

Single card section between SEO link wall and footer. CTA for salon owners to register.

**Spec:**
- Background: subtle gradient on emerald-subtle `#D4F2E0` 0% → cream `#FAF3E6` 100%
- Eyebrow: `font-body` 13px uppercase ink-2 + terracotta leading-dot
- h2: `font-display` Peace Sans 28px ink — "Solen für dein Studio."
- Body: `font-body` 15px ink-2
- CTA: emerald `s-brand` filled pill ("Solen-Partner werden")
- Right-side: stylized SVG illustration (no real product image)

**Implementation:** `app/[locale]/_components/homepage/WhySolen.tsx`.

---

## §21 · Footer (V2-D49n negative-footer)

**V2-D49n locked recipe:** dark emerald-deep `#084B2D` bg with cropped Peace Sans wordmark (giant, cut off at bottom of viewport). Replaces V2-era TrustBanner dark section + V2-D15 sprout-glyph footer (both retired).

**Composition:**
- Dark `#084B2D` bg
- 4-column link grid (Solen / Hilfe / Versprechen / Newsletter)
- Language switcher (DE / FR / IT / EN)
- Newsletter signup (single email input + emerald submit)
- Giant cropped "SOLEN" wordmark at bottom, Peace Sans, faded white, partially cut off below fold
- Copyright + legal links (Datenschutz / AGB / Impressum)

**Implementation:** `app/[locale]/_components/layout/Footer.tsx`.

---

## §22 · SEO link wall ("Salons nach Stadt")

Pure SEO content between B2B promo and footer. 4-column grid of `/{city}/{category}` links for Google indexing.

**Spec:**
- 4 col desktop, 2 col mobile
- Each link: `font-body text-[14px] text-s-ink-2 hover:text-s-brand`
- Underline on hover only
- Section header: "Salons in deiner Schweiz" h2

---

## §23 · V1 homepage flow

Section order on `/` (homepage):

1. Header (sticky)
2. Hero (h1 + SearchBar)
3. Zuletzt angesehen (Recently Viewed — conditional, localStorage-backed)
4. Last-Minute heute
5. In der Nähe
6. Lass dich verwöhnen (Featured Stylists)
7. Coiffeur-Salons
8. Finde deine Inspiration (Entdecken — when ready)
9. Bewertungen (Reviews)
10. WhySolen / B2B promo ("Solen für dein Studio")
11. Footer (V2-D49n negative footer)
12. Newsletter signup + legal links

**Implementation:** `app/[locale]/page.tsx` composes these sections.

---

## §24b · Accessibility baseline

- WCAG 2.2 AA minimum for all interactive elements.
- Color contrast: see §1 + §5h.1 verified pairings.
- Focus outlines: 2px `s-brand` emerald with 2px offset (`outline-2 outline-s-brand outline-offset-2`).
- Skip-to-main link as first focusable element (`<a href="#main-content" class="sr-only focus:not-sr-only ...">`).
- `motion-reduce:` collapses all motion to opacity-only 100ms.
- ARIA live regions: `role="alert" aria-live="assertive"` for errors, `role="status" aria-live="polite"` for status updates.
- Heart save toggle: `aria-pressed` (not aria-checked since `<button>` not native checkbox).
- All images: meaningful `alt` text or `alt=""` if decorative.

---

## §24c · Analytics events (PostHog)

Wired via `usePostHog()` from `posthog-js/react`. Events fire on:

- `search_opened`, `search_typed` (debounced 400ms, length ≥ 2 only), `search_submitted`, `search_submit_freetext`
- `search_result_clicked` with `result_type`/`result_id`/`query`/`position`
- `search_recent_used`, `search_trending_used`, `search_category_used`, `search_featured_clicked`
- `entdecken_look_viewed`, `entdecken_look_tapped` (when Entdecken ships)
- `card_viewed`, `card_tapped` (salon card impressions + click-through)
- `book_started`, `book_step_completed`, `book_confirmed` (booking funnel)

PostHog provider mounted in `app/[locale]/layout.tsx` via `<PostHogProvider>`.

---

## §25 · Category page (`/[city]/[category]`)

**Status: NOT BUILT in V3 production yet.** Spec preserved as future-feature reference; revisit when implementing.

Per §2.4: the whole page IS the colorway (soft cat bg tile + deep cat text on key headings + emerald `s-brand` for action affordances).

Page composition (planned):
- Breadcrumb (Home › City › Category)
- Hero with category name + count
- Sticky filter chrome (filters + sort)
- Salon grid (responsive, paginated)
- Empty state when no results
- B2B promo at bottom
- SEO link wall

---

## §33 · DB schema → surface mapping

| Surface | Tables | Key columns |
|---|---|---|
| Homepage cards | `salons`, `services`, `staff_members`, `reviews` | `is_featured`, `cover_photo_url`, `rating`, `review_count` |
| Salon detail | `salons`, `services`, `staff_members`, `reviews`, `gallery_urls`, `opening_hours`, amenities flags | All of above + `instant_booking_enabled`, `pet_friendly`, etc. (9 amenity bools per migration 077) |
| Search results | `salons`, `services`, `staff_members` | Full-text search on name + specialties[] |
| Booking flow | `bookings`, `payment_intents`, `loyalty_*` | TBD per Phase 1 booking work |
| User profile | `profiles`, `bookings`, `favorites`, `recently_viewed` | `display_name`, `tos_accepted_version` |
| Per-staff ratings | `staff_ratings_view` (Postgres view, migration 080) | Aggregated `average_rating` + `review_count` from non-hidden reviews |
| Sibling salons (chain) | `salons.parent_salon_id` + `fn_sibling_salons(uuid)` RPC | Migration 079 + 081 |
| Service subcategory | `services.subcategory` (free-text) | Migration 085 — two-tier taxonomy on top of enum `category` |

**Reference:** `_rules/DB_SCHEMA.md` owns the full schema. This section only maps surfaces to which tables back them.

---

> **End of V3 lock.** Anything not listed above is either: (a) not yet built in V3 production, (b) retired and lives in the archive, or (c) drift that needs an immediate fix in production code. When in doubt, grep the production component file's JSDoc + check `V2_REBUILD_LOG.md` for the most recent decision.
