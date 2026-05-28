# Solen — Design System Spec

**Last locked:** 2026-05-22
**Scope:** Foundations only. Components (buttons, inputs, cards, navs, modals, etc.) are not yet specified.

> **Major pivot from 2026-05-21 spec:** brand Orange `#E58840` (was Ocean Blue `#1D5DC4`, before that cobalt `#133EEB`, before that petrol teal). 5-stripe palette: orange primary + navy trust + brick / yellow / cream accents. Neutral ink scale unchanged. 4 universal semantic jobs unchanged (star=ink, heart, available, urgency). See bottom of doc for "What changed" diff.

---

## 1. Ink (text + borders)

Neutral near-blacks. No warm or cool tint. Airbnb-style.

| Token | Value | Use |
|---|---|---|
| `--ink-primary` | `#1A1A1A` | Titles, headers, body main, ⭐ star icon |
| `--ink-secondary` | `#6B6B6B` | Meta, durations, addresses, captions |
| `--ink-muted` | `#9CA3AF` | Placeholder, disabled |
| `--border-adaptive` | `rgba(0, 0, 0, 0.08)` | Dividers, card outlines, hairlines |

**Notes**

- ⭐ stars render in `--ink-primary`, not yellow. Deliberate (yellow stars feel cheap in service/booking context).
- Never use `#000`. Always `#1A1A1A` for max ink.

---

## 2. Surfaces

Cool neutral off-white system. Three base tiers + sticky nav variant.

| Token | Value | Use |
|---|---|---|
| `--substrate` | `#FAFAFA` | Main page background |
| `--sunken` | `#F4F4F5` | Recessed areas — form bg, sidebar bg, behind a stack of cards. Use sparingly on secondary screens (settings, forms, modals backdrop), not on main browse/booking flows |
| `--elevated` | `#FFFFFF` | Cards, modals, sheets — pops forward against substrate |
| `--nav-scrolled` | `#FFFFFF` + `border-bottom: 1px solid var(--border-adaptive)` | Sticky top nav (web) |

**Notes**

- Cards on substrate get depth from being whiter, not from shadows alone.
- Glass / backdrop-blur is not currently used in the system. May be re-evaluated for mobile bottom nav over scrolling photo content if/when one exists.

---

## 3. Brand color — 5-stripe palette

Primary brand is Orange. Navy is the paired dark anchor (trust band, inverted CTAs). Yellow + brick + cream are accent-tier — small uses only.

| Token | Value | Use |
|---|---|---|
| `--brand` | `#E58840` | Primary orange — banner, "Schöner" accent, logo dot, final CTA, primary monograms |
| `--brand-pale` | `#F7DBC6` | Soft peach — accent tile bg, hover ghost states |
| `--brand-subtle` | `#FDF6F0` | Very pale peach — section bg tint (when applied), card surfaces |
| `--brand-mid` | `#BC6F34` | Pressed / hover variant of `--brand` |
| `--brand-deep` | `#142F4A` | **Navy companion** — trust band, dark monogram tiles, inverted CTAs (intentionally a different hue than the ladder above — pragmatic concession for the paired-color identity) |
| `--cream` | `#E9DFC8` | Editorial section bg — ONE moment per page max |
| *(not tokenized)* | `#F0C25A` | Yellow — sparse accent (trust-number highlights, occasional badge) |
| *(not tokenized)* | `#C53D38` | Brick red — currently unused; semantic urgency `#E5392C` covers the red job |

**Hue rule**

- Primary at **76% saturation** (HSL 27°, 76%, 57%) — warm orange. Reads "welcome / hospitality" (Treatwell / Booksy school) vs Ocean Blue's "Swiss-tech precision."
- Press / hover: `#BC6F34` (same hue, ~30% darker — `--brand-mid`).
- Trust dark: `#142F4A` navy — NOT a darker orange. The 5-stripe identity pairs warm + cool by design; navy anchors when orange would be too loud.

**Usage rule**

- Brand is rare. Most screens have zero or one moment of brand color.
- Universal semantic colors (heart, available, urgency) carry their own jobs — brand does not double up on them.

---

## 4. Universal semantic colors

Loud, saturated. Each color has one fixed job tied to a universally recognized icon or state. Used sparingly — only on the icon/badge that owns it.

| Token | Value | Job |
|---|---|---|
| `--star` | `#1A1A1A` | ⭐ rating icon — ink, not yellow |
| `--heart-active` | `#FF3366` | ♡ saved / favorited (active state only) |
| `--available` | `#00A86B` | "Heute frei" badge, open-now dot, success states |
| `--available-bg` | `rgba(0, 168, 107, 0.10)` | Soft tint behind "available" chips |
| `--urgency` | `#E5392C` | "−25%" badge, "Last slot" pill, sale CTA, error text |

---

## 5. Typography

Bricolage Grotesque (display) + Hanken Grotesk (body & UI). Both free, Google Fonts.

### Fonts

| Role | Family | Weights | Notes |
|---|---|---|---|
| Display | Bricolage Grotesque | 700, 800 | Headlines, hero h1, section h2, card h3 |
| Body & UI | Hanken Grotesk | 400, 500, 600, 700 | Body, inputs, labels, captions. `font-feature-settings: "tnum"` on prices |

### Scale

| px | Role | Font | Weight | Letter-spacing | Line-height |
|---|---|---|---|---|---|
| 64 | Hero h1 (desktop) | Bricolage | 700 | -0.022em | 1.0 |
| 48 | Hero h1 (mobile) | Bricolage | 700 | -0.02em | 1.02 |
| 36 | Price / numeral hero | Hanken (tabular) | 700 | -0.02em | 1.0 |
| 32 | Section h2 | Bricolage | 700 | -0.018em | 1.1 |
| 22 | Card h3 | Bricolage | 700 | -0.014em | 1.2 |
| 16 | Body / inputs | Hanken | 400 / 500 | 0 | 1.5 |
| 14 | UI label / nav | Hanken | 500 / 600 | 0 | 1.4 |
| 13 | Caption / meta | Hanken | 400 | 0 | 1.4 |
| 12 | Eyebrow (ALL CAPS) | Hanken | 600 | 0.08em | 1.2 |

---

## 6. Spacing scale

4px base. 10 steps. Tokens match px value.

| Token | px | Typical use |
|---|---|---|
| `--space-4` | 4 | Hairline gaps, icon padding |
| `--space-8` | 8 | Tight gaps inside chips, button icon spacing |
| `--space-12` | 12 | Default gap inside small components |
| `--space-16` | 16 | Card inner padding, default vertical gap |
| `--space-20` | 20 | Page edge padding (mobile) |
| `--space-24` | 24 | Section gap (tight), card padding (large) |
| `--space-32` | 32 | Major component gap |
| `--space-48` | 48 | Section vertical rhythm |
| `--space-64` | 64 | Hero breathing room |
| `--space-96` | 96 | Generous hero / page-top spacing |

**Rhythm rule**

- Section vertical cadence: tight = 16 → 24, generous (hero) = 48 → 96.

---

## 7. Radii

5 tokens. Pill for anything interactive that should read as "tap me."

| Token | Value | Use |
|---|---|---|
| `--radius-xs` | 10px | Chips, input fields |
| `--radius-sm` | 14px | Small cards, badges with structure |
| `--radius-md` | 18px | Cards, modals, photos inside cards |
| `--radius-lg` | 24px | Large panels, hero containers, sheets |
| `--radius-pill` | 9999px | CTAs, pills, hearts, nav pills, floating buttons |

**Nesting rule**

- If a card has `--radius-md` (18px) and 8px inner padding, inner image radius = 10px (`inner = outer − padding`). Concentric, not arbitrary.

---

## 8. Shadows / elevation

6 tiers. Neutral / cool tone for ambient elevation; one tier carries an Orange-tinted glow reserved for primary CTA.

| Token | Value | Use |
|---|---|---|
| `--shadow-rest` | `0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)` | Subtle lift on resting interactive elements |
| `--shadow-hover` | `0 2px 4px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.08)` | Hover state on interactives |
| `--shadow-card-rest` | `0 1px 0 rgba(0,0,0,0.04), 0 8px 24px -8px rgba(0,0,0,0.08)` | Cards at rest |
| `--shadow-card-hover` | `0 2px 0 rgba(0,0,0,0.04), 0 16px 32px -12px rgba(0,0,0,0.12)` | Cards on hover |
| `--shadow-float` | `0 20px 48px -16px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.06)` | Sheets, popovers, dropdowns, floating bars |
| `--shadow-cta` | `0 4px 12px -2px rgba(229, 136, 64, 0.35)` | Primary CTA only — Orange-tinted glow |

---

## 9. Motion

4 easings + press-state. CSS custom properties.

| Token | Duration | Cubic-bezier | Use |
|---|---|---|---|
| `--ease-glide` | 200ms | `cubic-bezier(0.4, 0.0, 0.2, 1)` | Default UI motion — cards, hover, dropdowns |
| `--ease-out-strong` | 200ms | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Large transforms, scroll snaps, press-state |
| `--ease-drawer` | 300ms | `cubic-bezier(0.32, 0.72, 0, 1)` | Sheets, modals, drawers (iOS-like) |
| `--ease-bounce` | 350ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Heart pop, success spring (slight overshoot) |

**Press state (universal interactive)**

```css
transform: scale(0.97);
transition: transform 200ms var(--ease-out-strong);
```

---

## Still to lock (not yet specified)

- **States** — hover / active / focus / disabled rules for buttons, inputs, cards, chips, links
- **Breakpoints** — mobile / tablet / desktop pixel ranges and type scale switching
- **Z-index stack** — modal / dropdown / tooltip / toast layering + stacking-context rules (transform / filter / opacity create new contexts → React portals for modals)
- **Glass / backdrop-blur** — open decision, may add for mobile bottom nav use case
- **Components** — buttons, inputs, cards, navs, modals, chips, badges, etc.

---

## What changed (vs the 2026-05-21 spec)

### Brand color
- **Was:** Deep petrol teal `#043338` → cobalt `#133EEB` (V3-D95) → Ocean Blue `#1D5DC4` (V3-D98, cool/precise)
- **Now:** Orange `#E58840` (HSL 27°/76%/57%) — primary in a 5-stripe palette (orange + navy + brick + yellow + cream). Warm hospitality vibe replaces cool Swiss-tech. Brand-deep is intentionally navy `#142F4A` (paired companion, not a darker orange). Full ladder: pale `#F7DBC6` · subtle `#FDF6F0` · mid `#BC6F34` · deep `#142F4A`. Cream `#E9DFC8` for editorial moments. Yellow `#F0C25A` + brick `#C53D38` as sparse accents.

### Ink scale
- **Was:** Warm near-black `#1A1209` + `#56463E` + `#7A6957` + cool border `#EFE7DD`
- **Now:** Neutral `#1A1A1A` + `#6B6B6B` + `#9CA3AF` + adaptive rgba(0,0,0,.08). No warm tint anywhere.

### Surfaces
- **Was:** Substrate `#FFFFFF` + sunken `#FAF7F3` (warm grey)
- **Now:** Substrate `#FAFAFA` (cool grey) + sunken `#F4F4F5` (cooler grey) + elevated `#FFFFFF` (cards pop). Three tiers, cool throughout.

### Semantic colors
- **Was:** 4 families with 3 tones each — love red (#FAD2DA/#A23548/#CC4A60), terracotta (#D87352/#FFE8D8/#A04A22), mint (#E5F2EA/#3B7A57/#2D5E43), dusty slate (#EEF2F6/#3A5B7C). 12 hex codes.
- **Now:** 4 universal jobs only — star (ink), heart-active (#FF3366), available (#00A86B + soft bg), urgency (#E5392C). 4 hex codes total. Massive simplification.

### Typography
- **Was:** Same Bricolage + Hanken pairing
- **Now:** Same pairing, BUT added 36px price/numeral hero size + explicit letter-spacing + line-height per size + tabular-nums on prices

### Spacing
- **Was:** Token names `space-1` through `space-24` (logical naming)
- **Now:** Token names match px value (`--space-4` = 4px, `--space-96` = 96px). Easier to mental-math.

### Radii
- **Was:** 7 tokens (10/12/16/22/28/40/999) with semantic names (`input` / `card` / `photo` / `panel-m` / `panel-d`)
- **Now:** 5 tokens (10/14/18/24/9999) with size-based names (xs/sm/md/lg/pill). Plus a NEW nesting rule (`inner = outer − padding`).

### Shadows
- **Was:** Implicit — not formally specified in old spec
- **Now:** 6 explicit tiers, neutral tone, one Orange-tinted for primary CTA only.

### Motion
- **Was:** 4 easings, no press-state pattern
- **Now:** Same 4 easings + universal press-state (`scale(0.97)`) for all interactive presses.

### Removed (deliberate)
- All warm color references (terracotta, warm cream, warm ink)
- Yellow accent (was on logo dot + ⭐)
- Dusty slate semantic family (time-pressure chips now use urgency red)
- Mint semantic family (consolidated into single `--available` green)
- Glass/backdrop-blur tokens (deferred to "still to lock")
