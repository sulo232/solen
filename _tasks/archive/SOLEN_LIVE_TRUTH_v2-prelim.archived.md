# Solen — Live Truth (v2)

> **Status:** ACTIVE · **Locked:** 2026-05-05 · **Preview:** `public/solen-v2-locked.html` → `localhost:3000/solen-v2-locked.html`
>
> Single source of truth for solen.ch's V2 frontend rebuild — design system + locked patterns + accessibility + analytics. This document supersedes the V1 spec (archived at `_tasks/archive/SOLEN_LIVE_TRUTH_v1.archived.md`).
>
> **Compilation:** Step 1 (color + geo + ink scale) → Step 2 (categories + typography + depth + personality) → Step 3 (spacing + breakpoints + radius + z-index + scroll + safe areas + hit targets) → Step 4 (locked component patterns) → §25 (category page).
>
> **Hierarchy when docs conflict** (per CLAUDE.md): this doc wins over Q-locks wins over reference HTML wins over component JSDoc. If this doc is wrong, fix it FIRST, then propagate.

---

## Index

**Foundations**
- [§1 Brand color](#1-brand-color) · [§1b Geographic scope](#1b-geographic-scope)
- [§2 Semantic colors](#2-semantic-colors) · [§3 Warm-ink neutral scale](#3-warm-ink-neutral-scale)
- [§4 Per-category colors](#4-per-category-colors)
- [§5 Typography](#5-typography) · [§5b Depth system](#5b-depth-system) · [§5c Personality tokens](#5c-personality-tokens) · [§5d Inline emphasis rule](#5d-inline-emphasis-rule) · [§5e Iconography](#5e-iconography) · [§5f Hierarchy: one hero per info block](#5f-hierarchy-one-hero-per-info-block)

**Layout**
- [§6 Spacing scale](#6-spacing-scale) · [§6b Breakpoints](#6b-breakpoints) · [§6c Container & max-width](#6c-container--max-width)
- [§7 Radius scale](#7-radius-scale) · [§8 Z-index scale](#8-z-index-scale)
- [§9 Scroll behavior](#9-scroll-behavior) · [§10 Safe areas](#10-safe-areas-mobile-specific) · [§11 Hit targets](#11-hit-targets-touch--keyboard)

**Foundation primitives (Phase 0)**
- [§F.1 Form primitives](#f1--form-primitives) — text input · textarea · select · checkbox · radio · switch
- §F.2 Modal · §F.3 Bottom sheet · §F.4 Toast · §F.5 Date/time picker · §F.6 Skip-link · §F.7 Font fallback · §F.8 Cookie consent (PENDING — locked iteratively)

**Locked components & patterns**
- [§12 Header](#12--header) · [§13 Hero](#13--hero) · [§14 Search system](#14--search-system)
- [§15 Section header pattern](#15--section-header-pattern) · [§16 Salon card](#16--salon-card) · [§17 Horizontal scroll row container](#17--horizontal-scroll-row-container)
- [§18 Entdecken (inspo / look discovery)](#18--entdecken-inspo--look-discovery)
- [§19 City tiles (Solen in deiner Stadt)](#19--city-tiles-solen-in-deiner-stadt)
- [§20 B2B promo card](#20--b2b-promo-card) · [§21 Footer](#21--footer) · [§22 Browse-by-city SEO link wall](#22--browse-by-city-seo-link-wall-salons-nach-stadt)
- [§23 Final v1 homepage flow](#23--final-v1-homepage-flow)

**Cross-cutting**
- [§24b Accessibility baseline](#24b--accessibility-baseline) · [§24c Analytics events (PostHog)](#24c--analytics-events-posthog)

**Page templates**
- [§25 Category page — `/[city]/[category]`](#25--category-page--citycategory)

**Verification**
- [Component PR checklist](#component-pr-checklist)

**Roadmap**
- [What's still missing (36 spec gaps)](#whats-still-missing)

---

## 1. Brand color

Solen runs on **one accent**. The brand color does CTA, signal, and live-state work — nothing else. It never decorates.

|Role                |Hex                                                         |Tailwind token     |Where it appears                                                                                                               |
|--------------------|------------------------------------------------------------|-------------------|-------------------------------------------------------------------------------------------------------------------------------|
|Brand primary       |`#E8742A`                                                   |`s-brand.DEFAULT`  |CTA fills, search-CTA button, “Buchen →” links, live-availability pills, eyebrow pulse-dots, focus rings, sliding tab underline|
|Brand hover         |gradient `linear-gradient(180deg, #F0834D 0%, #E8742A 100%)`|inline             |All hover states on filled brand surfaces. Use the gradient — flat hover reads as “press” not “lift.”                          |
|Brand subtle/tint bg|`#FFE4D2`                                                   |`s-brand.subtle`   |Soft brand-tinted surfaces (live-counter pill bg, service chip bg, hero promise pills)                                         |
|Brand deep text     |`#8A3C0F`                                                   |`s-brand.text`     |Deep brand-tinted text on light surfaces (e.g. text inside `s-brand.subtle` pills)                                             |
|Brand mid text      |`#5C2308`                                                   |`s-brand.text-deep`|Stronger contrast variant for text on warm-cream gradients                                                                     |

**Tailwind classes:** `bg-s-brand`, `text-s-brand`, `border-s-brand`, `focus-visible:ring-s-brand`. Token name matches the value — no legacy aliases.

**Contrast (WCAG):**

- White on `#E8742A` = 3.34:1 — **AA Large only.** Use white text on brand-orange ONLY at 18px+/700 OR 14px+/700. For body-size text, use `s-brand.text` (`#8A3C0F`) on `s-brand.subtle` (`#FFE4D2`) which hits 6.84:1 (AA body, AAA large).
- `#E8742A` on white = 3.34:1 — AA Large only. CTAs are always 13px+/700 → passes.
- `#8A3C0F` on white = 6.84:1 — AA body.

**The one-accent rule.** Brand color appears at most **3-4 times per screen**. Counted: CTA fill, eyebrow pulse-dot, live pill, “Buchen →” link, “Alle →” section link. If a screen shows brand-orange more than ~4 times, restraint is broken — pull some back to ink.

**Hover.** Filled brand surfaces use the gradient (`#F0834D → #E8742A`) plus an inset top highlight (`inset 0 1px 0 rgba(255,255,255,.3)`) and a warm peach drop shadow (`0 4px 12px rgba(232,116,42,.32)`). Lift, not flatten.

-----

## 1b. Geographic scope

Solen is a **multi-city Swiss platform from launch**. Not hyperlocal.

- **Launch cities:** Basel, Zürich, Bern.
- **Tagline:** “Die Schweizer Salon-Plattform” (NOT “Von Basel, für Basel” — that’s dead).
- **Homepage city section:** “Stadt wählen” with 3 photo tiles (Basel · Zürich · Bern) + salon counts.
- **Hero copy is city-aware:** “47 Salons in [city] haben heute frei” — the city resolves to the user’s detected/selected city.
- **Salon detail pages can name districts** (e.g. “Kleinbasel”, “Kreis 4 Zürich”) because that’s where the salon actually is. But the homepage navigation never drills into districts — only cities.
- **Footer:** “🇨🇭 Made in Switzerland” — not Made in Basel.

**Anti-pattern:** any “Quartier wählen” / “Browse Kleinbasel” navigation. Districts are metadata on a salon, not a top-level browse axis.

-----

## 2. Semantic colors

These are universal-convention colors. They are **distinct from brand and never collapse with it.** Brand color does not do “success” or “error” or “save” — those have their own hexes that survive any future brand pivot.

|Semantic         |Hex                         |When to use                                                                                                     |
|-----------------|----------------------------|----------------------------------------------------------------------------------------------------------------|
|Love-red         |`#FF4A6B`                   |All heart-save icons (favorites, “love this”) — saved state filled, unsaved state stroke `currentColor` warm-ink|
|Status success   |`#16A34A`                   |Success toasts, “Heute frei” availability chips, confirmation checkmarks, walk-in queue confirmations           |
|Status warning   |`#F59E0B`                   |Warning toasts, soft notifications, “fast voll” chips                                                           |
|Status error     |`#D32F2F`                   |Error toasts, form errors, destructive action confirmations                                                     |
|Open-state green |`#16A34A` (= status success)|Salon “Jetzt offen” indicator                                                                                   |
|Closed-state red |`#DC2626`                   |Salon “geschlossen” indicator                                                                                   |
|Star/rating amber|`#F3A864`                   |Rating stars only — utility color, NOT a second brand accent                                                    |

**Anti-pattern:**

- Using `s-brand` token for hearts → use literal `#FF4A6B`.
- Using `s-brand` for success/error states → use the semantic hex.
- Using star-amber `#F3A864` for anything other than rating stars → it’s not a brand secondary, just the universal star color.

**In code:** semantic colors stay as literal hexes (or their own dedicated tokens like `s-love`, `s-success`, `s-error`). They never reference the brand token.

-----

## 3. Warm-ink neutral scale

The warmth of the ink scale is what makes Solen feel like Solen and not generic SaaS. Lock the four ink levels and the warm-shadow tint. Cool greys are banned.

|Role                  |Hex      |Tailwind                 |Use                                                                                            |
|----------------------|---------|-------------------------|-----------------------------------------------------------------------------------------------|
|Ink-1 (primary text)  |`#1A1209`|`text-s-ink` / `bg-s-ink`|All body text, headlines, dark register backgrounds (footer, dark CTAs, ink avatar)            |
|Ink-2 (secondary text)|`#56463E`|`text-s-ink-2`           |Secondary text — body sub-lines, italic quotes, meta lines on dark surfaces                    |
|Ink-3 (warm grey)     |`#7A6957`|`text-s-ink-3`           |Tertiary text — sub-headers, location lines, count chips, “(142)” review counts, divider labels|
|Ink-disabled          |`#C4B8A6`|`text-s-ink-disabled`    |Disabled state text, separators inside placeholder text (the “·” in “Was suchst du? · Basel”)  |

|Surface                         |Hex                |Tailwind         |Use                                                                                      |
|--------------------------------|-------------------|-----------------|-----------------------------------------------------------------------------------------|
|Page substrate (warm cream)     |`#FBF8F3`          |`bg-s-bg`        |The phone/page background. Cards lift off this — never white-on-white.                   |
|Sunken (deeper cream)           |`#FAF7F3`          |`bg-s-bg-sunken` |Search bar inactive state, header icon button bg                                         |
|Card surface (white)            |`#FFFFFF`          |`bg-white`       |Salon cards, dropdowns, sheets — always white. Adds an inset top highlight per §5b depth.|
|Border (warm hairline)          |`rgba(26,18,9,.06)`|inline           |Hairline borders, dividers, separators above price rows                                  |
|Border (warm hairline, stronger)|`#E8DFD2`          |`border-s-border`|Visible warm-cream borders — search bar inactive, chip outlines                          |

**Shadows are warm-tinted, never pure black, never pure ink.** Two acceptable shadow families:

- **Warm-ink tint** `rgba(26,18,9, X)` — for general elevation. Alpha values: `0.03 / 0.04 / 0.06 / 0.08 / 0.12 / 0.18` (low alpha for low elevation).
- **Brand peach tint** `rgba(232,116,42, X)` — for surfaces that interact w brand or want extra warmth (cards in feed sections, search bar resting state). Alpha values: `0.04 / 0.06 / 0.08 / 0.12 / 0.24 / 0.32`.

Pick one tint per shadow stack — don’t mix. Shadows always lift up; never use a pure dark-down shadow that pulls the surface into the page.

**Anti-pattern:**

- Pure black `#000000` body text → use ink-1 `#1A1209`.
- Pure-black shadows `rgba(0,0,0, X)` → use warm-ink or brand-peach tint.
- Cool-grey hexes anywhere: `#9E958C`, `#767676`, `#EBEBEB`, Tailwind default `#e5e7eb`, `gray-400`, `slate-500` etc. → always warm-ink tints.
- Mixing both shadow tints in one stack — pick one family per element.

-----

*Phase 1 step 1 ends here. Step 2 covers per-category colors + typography + depth system.*

# SOLEN — Live Truth · Step 2

> Continuing the rewrite from step 1. Step 2 covers per-category colors, typography, depth system, and the personality vocabulary (easing, motion, icon library) the og doc completely lacked.

-----

## 4. Per-category colors

Each beauty category gets a dedicated color used on category tile bgs, salon-card photo placeholders (when no real photo), and the category icon’s optional fill state. **These are NOT secondary brand accents** — they’re decorative tagging.

|Category|Hex                     |Glow shadow           |Where it appears                                                                     |
|--------|------------------------|----------------------|-------------------------------------------------------------------------------------|
|Coiffeur|`#B5588A` (rose)        |`rgba(181,88,138,.18)`|CategoriesGrid tile, Coiffeur salon card placeholder, CoiffeurIcon fill (when active)|
|Barber  |`#E8A957` (sunny)       |`rgba(232,169,87,.22)`|CategoriesGrid tile, Barber salon card placeholder, BarberIcon fill                  |
|Nails   |`#C77A5C` (warm clay)   |`rgba(199,122,92,.2)` |CategoriesGrid tile, Nails salon card placeholder, NailsIcon fill                    |
|Spa     |`#88B89E` (fresh sage)  |`rgba(136,184,158,.2)`|CategoriesGrid tile, Spa salon card placeholder, SpaIcon fill                        |
|Makeup  |`#D66547` (coral-orange)|`rgba(214,101,71,.2)` |CategoriesGrid tile, Makeup salon card placeholder, MakeupIcon fill                  |
|Wellness|`#9B7BB8` (soft plum)   |`rgba(155,123,184,.2)`|CategoriesGrid tile, Wellness salon card placeholder, WellnessIcon fill              |

**Application rules:**

- Tiles use the color as full bg with a top-down highlight gradient: `linear-gradient(160deg, rgba(255,255,255,.3), rgba(255,255,255,0) 60%)` overlaid + the colored shadow lifts the tile.
- Salon card photo placeholders (when no real photo) use the same color w light vignette pattern from §5b.
- Category icons inherit `currentColor` — when shown on tile, they’re white. When shown in nav/chips, they’re ink. Filled-state on hover or active uses the category color.

**Anti-pattern:**

- Treating these as a “second brand color.” They never appear in CTAs, headlines, focus rings, or anywhere outside their category context.
- Using them on text — contrast on white is too low for body text. They’re surface colors only.

-----

## 5. Typography

Solen runs on **3 typefaces, no exceptions.** Bricolage Grotesque carries display/headlines, Inter Tight handles body/UI, Instrument Serif italic appears for accent moments.

|Role                                  |Family                 |Weight                     |Use                                                                                                                  |
|--------------------------------------|-----------------------|---------------------------|---------------------------------------------------------------------------------------------------------------------|
|Display (headlines, hero, big numbers)|**Bricolage Grotesque**|700 (variable, 700 default)|All h1-h4, hero text, section headers, salon names, prices, eyebrow numerics. Mixed-case, NEVER all-caps for display.|
|Body / UI                             |**Inter Tight**        |400, 500, 600, 700         |All body text, sub-lines, meta, chips, button labels, form fields, microcopy                                         |
|Mono (numerics)                       |**JetBrains Mono**     |400, 500                   |Tabular-nums on prices, ratings, counts, timers, IDs (e.g. “Buchung #1432”)                                          |
|Accent (italic moments)               |**Instrument Serif**   |400 italic                 |Single accent words inside headlines (e.g. “Hi Lisa, was brauchst du *heute*?”) — used sparingly, max 1 per heading  |

**Sizes (mobile-first, scale up at 768px+):**

|Use                  |Size                                    |Line height|Letter spacing       |
|---------------------|----------------------------------------|-----------|---------------------|
|Hero h1              |32-44px (mobile-first, scales w `clamp`)|1.0        |-0.03em              |
|Section h2           |22-28px                                 |1.05       |-0.025em             |
|Card title h3        |15-16px                                 |1.2        |-0.02em              |
|Body                 |13-14px                                 |1.5        |0                    |
|Small / meta         |11-12px                                 |1.45       |0                    |
|Eyebrow              |9-10px                                  |1.4        |0.18-0.22em uppercase|
|Big numerics (counts)|32-44px                                 |1.0        |-0.025em             |
|Prices               |14-16px                                 |1.0        |-0.01em              |

**Variable axis play (Bricolage):**
Bricolage Grotesque is a variable font with a `wdth` (width) axis from 75-125. For brand-identity moments — city name in hero (“47 Salons in **Basel**”), big celebratory numbers — animate `font-variation-settings: "wdth" 100 → 110 → 100` over 3s loop. Subtle, only on 1-2 elements per screen. Never on body or button text.

**Anti-pattern:**

- Anton, Bebas Neue, Fraunces, DM Sans, Plus Jakarta, Outfit, Phosphor (font), Figtree — all retired or never used. The 3-font stack is non-negotiable.
- All-caps display text — reads editorial/inaccessible. Mixed-case only.
- Negative letter-spacing on body or UI text — only on display sizes 22px+.
- Bold weight on Inter Tight body where text-emphasis is the goal — use color swap to brand-orange instead (cleaner, see §5d emphasis rule).
- Italic for everything — Instrument Serif italic is the *moment* font, max 1-2 per screen, only inside headlines.

-----

## 5b. Depth system

Lift, never weight. 5 levels, warm-tinted shadows, top-down highlights. Nothing pulls content into the page.

|Level                  |Where it appears                                              |Shadow stack                                                                                                                              |
|-----------------------|--------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------|
|**L0 · base substrate**|Page bg, no shadow                                            |none — flat cream `#FBF8F3`                                                                                                               |
|**L1 · raised**        |Header icon buttons, chips, small interactive elements        |`inset 0 1px 0 rgba(255,255,255,.6)` + `0 1px 1px rgba(26,18,9,.04)` + `0 2px 6px rgba(232,116,42,.06)`                                   |
|**L2 · surface**       |Search bar, secondary cards                                   |`inset 0 1px 0 rgba(255,255,255,.6)` + `0 1px 2px rgba(26,18,9,.03)` + `0 6px 16px rgba(232,116,42,.08)`                                  |
|**L3 · elevated**      |Salon cards, b2b promo card, modals                           |`inset 0 1px 0 rgba(255,255,255,.6)` + `0 1px 2px rgba(26,18,9,.03)` + `0 8px 24px rgba(232,116,42,.06)` + `0 16px 40px rgba(26,18,9,.04)`|
|**L4 · overlay**       |Glassy badges (top-left), heart buttons (top-right), dropdowns|`backdrop-filter: blur(12px) saturate(1.4)` + `0 1px 2px rgba(0,0,0,.06)` + `0 4px 12px rgba(0,0,0,.08)`                                  |
|**L5 · accent glow**   |Live pills, active brand-CTA elements that need to “glow”     |`inset 0 1px 0 rgba(255,255,255,.32)` + `0 2px 6px rgba(232,116,42,.28)` — toned-down version, not aggressive                             |

**Photo treatment:**
Salon-card photo placeholders use a triple-layer bg to read like a sunlit interior, not a flat color block:

```
background:
  linear-gradient(180deg, rgba(255,255,255,.18) 0%, transparent 35%, transparent 70%, rgba(232,116,42,.08) 100%),
  radial-gradient(ellipse at 50% 0%, rgba(255,255,255,.25), transparent 60%),
  var(--photo-bg);
```

Top-down highlight (sky look), tiny peach kiss at the bottom (warm sunset edge), base color underneath. **NEVER bottom-down dark vignette** — that pulls the image down, reads moody/heavy.

**The two shadow families:**

- **Warm-ink** `rgba(26,18,9, X)` — general elevation, surfaces lifting off cream substrate.
- **Brand-peach** `rgba(232,116,42, X)` — surfaces interacting w brand or wanting extra warmth (cards in feed, search bar).

Pick **one family per shadow stack** — don’t mix `rgba(26,18,9, .04)` and `rgba(232,116,42, .12)` in the same element. Pick the warmer of the two (peach) when the surface contains brand-orange elements (CTAs, live pills). Pick warm-ink for neutral surfaces (header buttons, chips, white modals).

**Anti-pattern:**

- Pure black shadows `rgba(0,0,0, X)`.
- Bottom-down dark vignettes on photos (`linear-gradient(180deg, transparent, rgba(0,0,0,.4))`) — moody, pulls down.
- Aggressive brand-peach glow shadows `rgba(232,116,42, .32+)` on every button — restraint. Reserved for live pills + critical-action moments only.
- Mixing both shadow families in one stack.

-----

## 5c. Personality tokens

The og doc had no animation vocabulary. Solen has 4 named easing curves, 6 micro-interactions, and 4 signature flourishes. These are the toolkit — don’t invent new ones in code.

### Easing curves (CSS variables)

|Token          |Cubic-bezier                     |Duration|Use                                                                                              |
|---------------|---------------------------------|--------|-------------------------------------------------------------------------------------------------|
|`--ease-snap`  |`cubic-bezier(.4, 0, .2, 1)`     |200ms   |Default UI — buttons, hovers, tab switches, search-card transitions, chip toggles                |
|`--ease-spring`|`cubic-bezier(.34, 1.56, .64, 1)`|400ms   |Delight — heart save, badge appear, “+1” counter pop. Slight overshoot = “yay something happened”|
|`--ease-glide` |`cubic-bezier(.16, 1, .3, 1)`    |600ms   |Long sweeps — sheet open, modal in, full-page route transitions                                  |
|`--ease-thud`  |`cubic-bezier(.7, 0, .84, 0)`    |150ms   |Decisive — press states, toast dismiss, confirm tap. Fast accelerate, instant impact             |

**Pick by intent:** snap = “I clicked.” spring = “yay!” glide = “we’re moving.” thud = “done.”

### Motion tokens

|Token           |Value                                            |Use                                                   |
|----------------|-------------------------------------------------|------------------------------------------------------|
|`--press-scale` |`scale(.94)` 100ms snap                          |Active state on tappable elements (buttons, cards)    |
|`--lift-y`      |`translateY(-1px)` + brighter shadow + 200ms snap|Hover state on buttons, cards                         |
|`--accent-serif`|`"Instrument Serif"` 400 italic                  |The italic moment font — apply via class, never inline|

### Micro-interactions (the 6 every screen needs)

|Name         |Trigger                        |Animation                                                                                                                                   |
|-------------|-------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------|
|Heart save   |Tap heart icon                 |Spring 400ms — scale 1 → 1.4 → 1 + fill color swap to `#FF4A6B`                                                                             |
|Live pulse   |Always (when live data is real)|Snap 1.6s loop — 5px dot scales 1 → 2.5 + fades opacity 0.6 → 0                                                                             |
|Chip toggle  |Tap filter chip                |Snap 180ms — bg + text + border color swap                                                                                                  |
|Skeleton load|Initial data fetch             |Linear 1.6s loop — gradient sweep across placeholder. **Stops after 2 cycles** if data still missing (don’t loop forever — anxiety-inducing)|
|Press scale  |Tap any button/card            |Snap 100ms — scale .94 on `:active`                                                                                                         |
|Success draw |Booking confirmation           |Glide 850ms — circle stroke draws (500ms) + checkmark stroke draws (350ms, 150ms delay)                                                     |

### Signature flourishes (used sparingly, 1-2 per screen max)

|Name                     |Where                                              |Behavior                                                                                                                                        |
|-------------------------|---------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------|
|Magnetic arrow           |Section “→” links, “Mehr erfahren →” links         |Gap between text and arrow grows from 4px → 10px on hover (200ms snap). Arrow itself translates 2px right.                                      |
|Confetti pop             |Booking confirmation button (ONLY)                 |4 colored dots fly up + fade out on hover/click. Stagger 50ms each. Spring 600ms. NEVER on save/like/generic CTA.                               |
|Wiggle attention         |Urgency badges (“Nur noch 2 frei!”)                |Subtle wiggle every 3s — rotate(-3deg → 3deg → -2deg → 0). Stops on hover. NEVER on nav, buttons, or hero.                                      |
|Brand-color number accent|Big numbers that “matter” — counts, ratings, prices|Number itself is brand-orange, surrounding text stays ink. Context-dependent — not all numbers, just the one that’s the headline of its element.|

### Variable font axis play

Already covered in §5 — Bricolage `wdth` axis 100 → 110 → 100 over 3s loop on city name + big celebratory numbers only. **1-2 instances max per screen.**

-----

## 5d. Inline emphasis rule

When you want to emphasize a word inside a sentence, **swap its color to brand-orange**. Don’t use:

- Bold weight (already too much for body)
- Italic (reserved for Instrument Serif accent moments inside headlines)
- Underline (reserved for inline-prose links — see §6 link styles)
- Highlighter bg (banned — too “marker” / Notion-pages-2018)

Example: “Buche jetzt, [heute hingehen](#).” → the words “heute hingehen” are color `#E8742A`, no other styling.

**Use sparingly — max 1 emphasis per paragraph, max 3 per screen.**

-----

## 5e. Iconography

Solen uses **Lucide** (lucide-react / lucide-icons) as the base icon library. 1500+ icons, MIT licensed, monoline aesthetic at 1.5-2px stroke, professionally drawn, free.

**Implementation:**

- React: `import { Heart, MapPin, Clock, Star } from 'lucide-react'` → `<Heart size={16} strokeWidth={1.8} />`
- HTML/inline SVG: copy from [lucide.dev](https://lucide.dev), paste with `stroke="currentColor"` so color inherits from parent.

**Icon spec (when configuring):**

- `viewBox="0 0 24 24"` (default)
- `stroke="currentColor"` — always inherit from parent element
- `stroke-width="1.8"` (Lucide’s recommendation for 24px viewBox)
- `stroke-linecap="round"`
- `stroke-linejoin="round"`
- `fill="none"` (default) — use filled variant only on saved-state hearts and active rating stars

**Sizes:**

- 13-14px in chips and small pills
- 16-18px in buttons and inline UI
- 20-24px in standalone icon buttons (nav, header)
- 28-44px in hero/category tile contexts

**Anti-pattern:**

- Unicode emoji (👋 ✨ ⚡ 📅 🎉 🔥) — banned. Reads inconsistent across OS, no brand control, no animation possibilities.
- Hand-drawing SVG paths in code (`<path d="M9 22 C 8 19..."/>` from scratch) — banned. Use the library.
- Mixing icon libraries (lucide + phosphor + iconoir in same project) — pick one. Lucide.
- Font-icon libraries (Font Awesome, Material Icons via CSS class) — outdated. SVG only.
- Color-locking icons — they should always inherit `currentColor` so a heart goes love-red where it’s saved, ink-1 where it’s not, white when on dark register.

**Custom illustrations / hero graphics:**
For brand-defining moments (logo, mascot, hero illustrations, success screens), use:

- **Lottie animations** from lottiefiles.com for animated moments (success draw, hero loops, loading states)
- **Custom commissioned SVGs** (designer on Fiverr/Dribbble ~$200-500) for the 5-10 brand-signature illustrations
- **AI-generated → traced clean in Figma** for one-off scene illustrations

NEVER hand-craft via prompt-to-SVG-paths in code. The output looks amateur. Custom illustrations are a designer skill, not a coding skill.

-----

## 5f. Hierarchy: one hero per info block

Every panel that shows 3+ pieces of information must have **one hero metric** — the data point the user is actually scanning for. The rest demote to secondary or tertiary.

This rule is what separates "info dump" from "scannable UI." Equal-weight stat rows (Distance / Pace / Time at the same size, color, and weight) read as a wall of text — the user has to parse all four to find the one they want. Picking a hero turns the panel from "read everything" into "read the hero, glance at context."

### The three weights

|level    |role                                            |how it shows                                                                                                                                                          |
|---------|------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|hero     |the answer to "what is this card about?"        |Bricolage Grotesque 700 at the panel's display size (per §5), ink-1 `#1A1209`. Optionally brand-orange `#E8742A` if the number is the celebratory headline (per §5c.4).|
|secondary|context the hero needs to make sense            |Inter Tight 400-500, ink-2 `#56463E`, smaller — typically 11-13px. Often dot-separated `·` per §5d typography rules.                                                  |
|tertiary |meta / source / location / timestamps           |Inter Tight 400, ink-3 `#7A6957`, 10-12px. Lives at the edge — bottom of card, corner pill, or floating overlay (e.g. location badge ON the map, not in metadata list).|

### Picking the hero — by surface

|surface                                |hero                                                          |secondary                            |tertiary                          |
|---------------------------------------|--------------------------------------------------------------|-------------------------------------|----------------------------------|
|salon card §16 (availability variant)  |salon name (already locked Bricolage 700 14px)                |rating · row 2 availability/price    |badge top-left                    |
|category sub-text §25.4                |`[N] heute frei` (the actionable count) — brand-orange or ink-1|`[N] Salons` total                   |pulse dot                         |
|booking confirmation summary §C (Phase 2)|date + time (`Mo. 12. Mai · 14:30`) — Bricolage 700 hero      |service · staff · salon name         |location · cancellation policy    |
|profile bookings row §AC.2 (Phase 3)   |time-until (`Heute · 14:30` / `In 3 Tagen` / `Vor 2 Wochen`)  |salon name · service                 |status pill · cancel link         |
|salon detail header §SD (Phase 2)      |rating + open-now state combined                              |service categories · price range     |address · phone · opening hours   |
|search results count §SR (Phase 2)     |`[N] Salons gefunden`                                         |active filter chips · sort indicator |total before filter               |

### Anti-patterns

- **Equal-weight stat rows.** Three or four numbers at the same size, weight, and color. The reader's eye has nowhere to land.
- **Sub-line repeats hero.** Hero says `35m 37s`, secondary says `Time: 35m 37s` — drop the label.
- **Decorative metadata above the hero.** Source / category / timestamp pinned ABOVE the headline pushes the headline down. Hero leads, meta follows.
- **Brand-orange on hero AND a wow badge AND the icon.** §1 one-accent rule still applies — if hero is already brand-orange, the badge goes ink (white-on-ink-1 pill).

### Compress before you stack

Before adding a new line of metadata to a card or panel, try compressing what's already there into a dot-separated single line:

- Bad: `Yesterday at 12:10` / `London, United Kingdom` / `Run summary` (three lines)
- Good: `Zander Whitehurst · Lunch run · vor 1 Tag` (one scannable line, location moved into the map as a corner pill)

Use the same `·` separator already locked across §15 / §16 / §18. Keep separator gap 6-8px.

### Wow moments earn their visual weight

Achievement chips, "New PB!" pills, "Sofort frei" badges (§16.3), "+1 saved" counter pops — these EARN brand-orange or green by being **rare** and **rewarding**. If a panel has more than one wow moment, none of them are wow anymore. **Max 1 wow chip per panel.**

This is the toolkit version of §5c "Brand-color number accent" — but applied at panel composition time, not just typography time.

-----

*Phase 1 step 2 ends here. Step 3 covers the locked patterns: header / hero / search / cards / sections / detail / booking / confirmation / footer.*

# SOLEN — Live Truth · Step 3

> Step 3: layout fundamentals. Without this, every component placement decision is vibes. Agents drift.

-----

## 6. Spacing scale

Solen uses a **4px-based scale**. Every padding, margin, and gap is one of these values. Anything else is a bug.

|Token       |Value|Use                                                                                          |
|------------|-----|---------------------------------------------------------------------------------------------|
|`--space-0` |0    |reset                                                                                        |
|`--space-1` |4px  |inside chips, between adjacent dots/stars, icon-to-label gap in tight pills                  |
|`--space-2` |8px  |between chips in a row, between salon-card photo and meta block, small grid gaps             |
|`--space-3` |12px |between cards in a section, padding inside small cards, between section header and first card|
|`--space-4` |16px |page horizontal padding (mobile), card body padding, search bar internal padding             |
|`--space-5` |20px |section vertical rhythm (margin-top between sections on mobile)                              |
|`--space-6` |24px |larger card body padding, between hero block and search bar                                  |
|`--space-7` |32px |hero vertical breathing, between major page sections (desktop)                               |
|`--space-8` |48px |between hero and first feed section, page-bottom safe area (mobile)                          |
|`--space-9` |64px |footer top padding, large empty states, page-top hero on desktop                             |
|`--space-10`|96px |reserved for landing-page-only hero verticals (homepage on desktop)                          |

**Application rules:**

- **Page horizontal padding:** `--space-4` (16px) on mobile, `--space-6` (24px) on tablet (≥768px), `--space-8` (48px) on desktop (≥1024px). Never inline-style different values per section.
- **Section vertical rhythm:** every section starts with `margin-top: --space-5` (20px) on mobile, `--space-7` (32px) tablet+. Section header to first content = `--space-3` (12px).
- **Card-to-card gaps:** horizontal scroll rows use `gap: --space-3` (12px). Grid sections use `gap: --space-2` (8px) for tight grids (categories), `--space-3` (12px) for relaxed (city tiles).
- **Inside cards:** padding `--space-3` (12px) for small cards (200px wide salon cards), `--space-4` (16px) for medium (search results), `--space-5` (20px) — `--space-6` (24px) for large (b2b promo, modals).

**Anti-pattern:**

- Random pixel values like `padding: 14px 16px 18px` (yes, the og had this — it’s not a scale value, it’s vibes).
- `padding-top` ≠ `padding-bottom` unless there’s an explicit reason (e.g. asymmetric photo-to-text card layout). Default to symmetric.
- Negative margins to “cheat” a layout — refactor instead.

-----

## 6b. Breakpoints

Solen is mobile-first. 3 breakpoints, no more.

|Token    |Min-width    |Trigger                     |Notes                                                        |
|---------|-------------|----------------------------|-------------------------------------------------------------|
|`mobile` |0px (default)|base styles                 |every style is mobile-first. no `@media` needed for mobile.  |
|`tablet` |`768px`      |`@media (min-width: 768px)` |iPad portrait, larger phones in landscape, small laptops     |
|`desktop`|`1024px`     |`@media (min-width: 1024px)`|full desktop layouts kick in                                 |
|`wide`   |`1280px`     |`@media (min-width: 1280px)`|OPTIONAL — only for max-width container caps + grid expansion|

**Why 3 breakpoints, not 5+:**

- Most salon discovery happens on phones. Tablet + desktop are secondary.
- Each breakpoint = exponential test surface. 3 = tractable. 5+ = chaos.
- Components should use **container queries** (`@container`) for component-level responsiveness, not page breakpoints.

**Container query rule:** card grids, search bars, and reusable components that appear in different contexts use `container-type: inline-size` and `@container (min-width: Xpx)` rules — so a card behaves the same way regardless of where it’s mounted (homepage feed vs sidebar vs modal).

**Anti-pattern:**

- Adding `xs` (≤375px) — base styles already handle this; don’t double-spec.
- Using `xl` / `2xl` — collapse into `desktop` + optional `wide`.
- Using viewport-width units (`vw`, `vh`) for layout. They break on iOS safari w dynamic toolbar. Use `dvh` if needed for mobile full-height, otherwise stick to `%` and px.

-----

## 6c. Container & max-width

|Element                            |Mobile                                                        |Tablet (≥768px)|Desktop (≥1024px)|Wide (≥1280px)                                                                                  |
|-----------------------------------|--------------------------------------------------------------|---------------|-----------------|------------------------------------------------------------------------------------------------|
|Page max-width                     |`100%`                                                        |`100%`         |`1024px`         |`1200px`                                                                                        |
|Page horizontal padding            |`16px`                                                        |`24px`         |`48px`           |`48px`                                                                                          |
|Hero vertical padding (top)        |`24px`                                                        |`40px`         |`64px`           |`64px`                                                                                          |
|Hero vertical padding (bottom)     |`32px`                                                        |`48px`         |`64px`           |`64px`                                                                                          |
|Section gap (between feed sections)|`20px`                                                        |`32px`         |`40px`           |`40px`                                                                                          |
|Card row width (horizontal scroll) |overflow phone edge to edge (`-16px` margins, `+16px` padding)|same           |same             |same — horizontal scroll never centered, always edge-bleed for “more cards offscreen” affordance|

**Reading width:**
Body copy max-width = **`60ch`** (~600px at 16px font). Headlines can stretch wider — max **`24ch`** for hero h1, **`32ch`** for sub-text. This is for desktop reading; on mobile, content fills the container.

-----

## 7. Radius scale

|Token           |Value       |Use                                                                                            |
|----------------|------------|-----------------------------------------------------------------------------------------------|
|`--radius-sm`   |6px         |tiny inline pills (count badges, small status chips)                                           |
|`--radius-md`   |10px        |search bar internal cells, segmented controls, list rows                                       |
|`--radius-lg`   |12px        |medium cards, salon-card photo (rounded square), b2b promo card (smaller variant), input fields|
|`--radius-xl`   |14px        |salon-card outer photo wrapper, neighborhood tile photos                                       |
|`--radius-2xl`  |16px        |category tiles, salon cards (when wrapped), photo-tile content cards                           |
|`--radius-3xl`  |18px        |large cards (b2b promo full size, modals desktop, recap sections)                              |
|`--radius-pill` |99px        |all pills (chips, buttons, search bar outer, live pills, toast pills, badges)                  |
|`--radius-full` |50% / 9999px|circles (avatars, icon buttons, dots)                                                          |
|`--radius-phone`|26px        |the “phone shell” outer container in mockups + onboarding/walkthrough faux-phone elements      |

**Application rules:**

- Pills use `--radius-pill` (99px) — always. Never round corners on something that should be a pill.
- Cards have one rule: their inner content matches the outer radius minus 2px. So if salon-card outer = 16px, photo inside = 14px. If outer card not wrapped, photo standalone = 14px.
- **Buttons are pills.** Never use `--radius-md` (10px) for a button — that’s a “rounded rectangle” 2018 look. CTA / icon-button / chip-style toggle = pill.
- **Inputs are not pills.** Search bar outer is a pill (it contains a button), but text inputs inside forms use `--radius-lg` (12px) — looks like a “field,” not a “button waiting to be pressed.”

**Anti-pattern:**

- `border-radius: 8px` everywhere “to be safe” — kills hierarchy. Use the scale.
- Mixing pill + rounded rect inside the same component (e.g. pill outer + 10px inner) — pick one shape language per component.
- `border-radius: 50%` on non-square elements — they don’t render as circles, they render as ellipses.

-----

## 8. Z-index scale

Z-index is a **declared scale**. No inline `z-index: 9999`. No `z-index: 1` reflexive add.

|Layer         |Token         |Value      |Use                                                                           |
|--------------|--------------|-----------|------------------------------------------------------------------------------|
|Below content |`--z-below`   |-1         |decorative bg shapes, blob accents that sit behind content                    |
|Default       |`--z-base`    |0 (or auto)|normal flow content — most elements need no z-index at all                    |
|Raised        |`--z-raised`  |10         |cards lifting above siblings during hover, focused inputs in a stack          |
|Sticky        |`--z-sticky`  |100        |sticky section headers, sticky tab bars, sticky search bars                   |
|Header        |`--z-header`  |200        |the global app header (when sticky on scroll)                                 |
|Dropdown      |`--z-dropdown`|300        |select dropdowns, autocomplete suggestions, menu pop-ups attached to a trigger|
|Sheet backdrop|`--z-sheet-bg`|400        |the dimmed bg behind a bottom-sheet/modal (`rgba(26,18,9,.4)` w blur)         |
|Sheet         |`--z-sheet`   |410        |bottom sheets, side sheets — the actual sheet content above its bg            |
|Modal backdrop|`--z-modal-bg`|500        |dimmed bg behind a centered modal                                             |
|Modal         |`--z-modal`   |510        |the modal content above its bg                                                |
|Toast         |`--z-toast`   |600        |toast notifications — always above modals so users see “saved!” even mid-modal|
|Tooltip       |`--z-tooltip` |700        |tooltips on hover — always topmost                                            |
|Critical alert|`--z-alert`   |800        |reserved for full-page critical alerts (network down, auth expired)           |

### Stacking context warnings (CRITICAL — agents miss this constantly)

These CSS properties create a **new stacking context**, which means `z-index` only works *within* that context, not against parent siblings:

- `transform: anything` (including `translateY(0)` to enable GPU)
- `opacity` < 1
- `filter: anything` (blur, drop-shadow, etc.)
- `backdrop-filter: anything`
- `will-change: transform | opacity | filter`
- `mix-blend-mode: anything`
- `isolation: isolate`
- Any element w `position: fixed` or `position: sticky`
- A flex/grid item w `z-index` set

**Practical consequence:** if a parent card has `transform: translateY(-1px)` on hover, a modal nested inside that card with `z-index: 510` will NOT escape the card. It’s trapped in the card’s stacking context.

**The rule for modals/sheets/toasts/tooltips:** always render via React Portal to `document.body`. NEVER nest modal markup inside a transformed/filtered/blurred parent.

```jsx
// CORRECT — portal escapes any parent stacking context
import { createPortal } from 'react-dom';
return createPortal(<Modal />, document.body);

// WRONG — modal trapped in parent context if parent transforms
return <div className="card-w-hover-transform"><Modal /></div>;
```

**Anti-pattern:**

- Adding `z-index` outside the scale.
- Using arbitrary high values (`z-index: 9999`) — meaningless, breaks the scale.
- Stacking context bugs from `transform: translateZ(0)` for GPU performance + nested z-index — refactor or portal.

-----

## 9. Scroll behavior

Solen has 4 distinct scroll patterns. Each has a spec.

### 9a. Page scroll (the obvious one)

- **Native browser scroll.** No scroll-jacking, no scroll-driven parallax, no “fancy” scroll experiences.
- iOS momentum scroll preserved (`-webkit-overflow-scrolling: touch` is default on `overflow: auto` containers).
- Scroll restoration on browser back: enabled (Next.js App Router default).

### 9b. Horizontal card row scroll

The pattern used in feed sections (Heute frei / Empfohlen / Trending / Neu).

```css
.hscroll {
  display: flex;
  gap: var(--space-3);                /* 12px */
  overflow-x: auto;
  scrollbar-width: none;              /* Firefox */
  margin: 0 calc(-1 * var(--space-4)); /* edge-bleed */
  padding: 0 var(--space-4);          /* re-add for first/last card */
  scroll-snap-type: x proximity;      /* soft snap, not mandatory */
  scroll-padding-left: var(--space-4);
  -webkit-overflow-scrolling: touch;
}
.hscroll::-webkit-scrollbar { display: none; } /* WebKit */
.hscroll > .salon-card {
  scroll-snap-align: start;
  flex-shrink: 0;
}
```

**Rules:**

- `scroll-snap-type: x proximity` — soft snap, doesn’t fight the user’s scroll velocity.
- Cards bleed past the page horizontal padding — affordance for “more offscreen.”
- No “pagination dots” or “next arrow” overlays. Native scroll only.
- First card is fully visible at scroll-start. Last card sits flush w right edge at scroll-end.

### 9c. Sticky elements

- **Sticky section headers:** the section title can stick on scroll within long lists (search results page) but NOT on the homepage feed. On homepage, headers scroll w content.
- **Sticky tab bar (salon detail page):** sticks at top after scrolling past the photo. Bg becomes opaque cream (`#FBF8F3`) once stuck.
- **Sticky bottom-CTA:** booking wizard’s “Weiter →” button sticks at bottom of viewport always. Has a soft top-shadow `0 -4px 12px rgba(232,116,42,.06)` to separate from content.

### 9d. Pull-to-refresh

- Mobile-only, native iOS/Android behavior preserved.
- On homepage feed: triggers data re-fetch.
- On salon detail: disabled (no need to refresh static content).
- Visual: native refresh indicator, no custom — keeps OS expectation.

**Anti-pattern:**

- Custom scrollbars styled to look fancy (gradient, animated, fat) — distracts from content.
- `scroll-snap-type: x mandatory` — fights user gesture, feels broken.
- Auto-scroll / carousel auto-rotate — banned (per og rule, kept).
- Parallax / scroll-jacking — banned.
- Disabling browser scroll restoration — breaks back-button UX.

-----

## 10. Safe areas (mobile-specific)

iOS notch / dynamic island, Android gesture bar, etc. Solen handles these correctly.

```css
:root {
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-left: env(safe-area-inset-left, 0px);
  --safe-right: env(safe-area-inset-right, 0px);
}
body {
  padding-top: var(--safe-top);
  padding-bottom: var(--safe-bottom);
  padding-left: var(--safe-left);
  padding-right: var(--safe-right);
}
```

**Rules:**

- Bottom nav bar / sticky CTA buttons: `padding-bottom: calc(var(--space-3) + var(--safe-bottom))` so they sit above the iOS home indicator.
- Header / sticky top elements: `padding-top: calc(var(--space-3) + var(--safe-top))` to avoid notch overlap.
- Modals + sheets: respect both top + bottom safe areas.
- Edge-bleed photos / horizontal scroll: extend through safe-left/right via `padding-left/right: var(--safe-left/right)` on the scroll container.

-----

## 11. Hit targets (touch + keyboard)

Every tappable element has a minimum hit target:

- **44×44px** minimum on mobile (Apple HIG / Google Material standard).
- 36px height pills/buttons are OK *visually* if their hit target extends invisibly to 44px (use `padding` or pseudo-element to extend).
- Spacing between adjacent tappable elements: minimum `--space-2` (8px) — prevents fat-finger mis-taps.

**Focus targets (keyboard):**

- 2px brand outline + 2px outside offset (per §1).
- `:focus-visible` only — no focus ring on mouse click, only on keyboard tab.
- Skip-to-content link in page header (visible on `:focus`, hidden otherwise) — accessibility-mandatory.

-----

# SOLEN — Live Truth · Phase 0: Foundation primitives

> Phase 0 covers the primitives every later surface composes. Locked draft started 2026-05-05. §F.1 (forms) lands first because Phase 1 auth + Phase 2 booking wizard can't start without it.
>
> Cluster anchors: §F.1 forms · §F.2 modal · §F.3 bottom sheet · §F.4 toast · §F.5 date/time picker · §F.6 skip-link · §F.7 font fallback strategy · §F.8 cookie consent. Each lands in its own iteration of the spec → mockup → implement → lock loop.

-----

## §F.1 · Form primitives

The form vocabulary every surface uses: text input, textarea, select, checkbox, radio, switch. Each primitive has a fixed anatomy, a fixed state matrix, and 3 sizes. New form patterns DO NOT invent new visual language — they compose these primitives.

**Anchors to existing locks:** the hero search bar (§13.4) is a composite of 3 text inputs visually merged into one container; the sort sheet (§25.6) uses §F.1.5 radio rows; the filter sheet (§25.7) uses §F.1.4 checkbox-as-pill toggles; the active-row state in /search (§14.3) is the §F.1.1 text input focus state. When those references change, this section is the source of truth — fix this first.

### §F.1.0 · Anatomy (universal)

```
┌─────────────────────────────────────┐
│ Label                               │ ← always above field, never inside
│ ┌─────────────────────────────────┐ │
│ │ Field                           │ │ ← input / textarea / select / etc
│ └─────────────────────────────────┘ │
│ Helper text or error message        │ ← below field, optional
└─────────────────────────────────────┘
```

|element       |spec                                                                                                                                   |
|--------------|---------------------------------------------------------------------------------------------------------------------------------------|
|label         |Inter Tight 600 12px, ink-1 `#1A1209`, line-height 1.3. Always above field. Required = trailing `·` red dot 5px (`#D32F2F`).            |
|field bg      |default white `#FFFFFF` raised over cream substrate. Active state bg = `#FFF4E8` (matches §14.3 lock).                                  |
|field border  |1px `rgba(26,18,9,.10)` default. Active = 2px brand-orange `#E8742A`. Error = 2px error red `#D32F2F`. Success = 2px success `#16A34A`. |
|field radius  |`var(--radius-lg)` (12px) — fields are NOT pills (per §7 anti-pattern: pill-shaped inputs read as buttons-waiting-to-be-pressed)         |
|field padding |See size table §F.1.0a. md size locks at `padding 12px 16px` (12px vertical, 16px horizontal) to match §13.4 hero search row.           |
|helper text   |Inter Tight 400 11px, ink-3 `#7A6957`, line-height 1.4, margin-top 6px. Max 1 line preferred.                                          |
|error message |Inter Tight 500 11px, error red `#D32F2F`, line-height 1.4, margin-top 6px. Optional inline icon: 12px Lucide `alert-circle` before text.|
|warning msg   |Inter Tight 500 11px, warning amber `#F59E0B` (use `#7A4A14` deepened on cream for body-text contrast), 12px Lucide `alert-triangle`.   |
|success msg   |Inter Tight 500 11px, success green `#16A34A`, 12px Lucide `check-circle`.                                                             |
|field gap     |`var(--space-2)` (8px) between label-bottom and field-top                                                                              |

**Stacking:** labels NEVER inside the field as floating placeholders. Floating labels were popular 2018-2022 but read as decorative animation, hurt accessibility (screen readers + autofill confusion), and break in dense layouts. Solen uses static labels above.

### §F.1.0a · Sizes

|size|use                                                                                                                                       |height|font-size|padding-x|padding-y|
|----|------------------------------------------------------------------------------------------------------------------------------------------|------|---------|---------|---------|
|sm  |Compact filter rows, dropdown w short text, search bars inside list items                                                                 |40px  |13px     |12px     |10px     |
|md  |**Default for all forms** — booking wizard, login, signup, settings, salon profile editor (B2B). Hero search rows §13.4 lock at md/56px tall.|56px  |14px     |16px     |12px     |
|lg  |Reserved for hero/landing search inputs only (currently §13.4 hero is the only md/lg-tall surface; lg used if a future hero needs even more emphasis).|64px  |16px     |20px     |18px     |

**iOS zoom on focus (V2-D14, 2026-05-05):** locked at decision **B** — keep 14px on md inputs, accept iOS auto-zoom on focus. Reasoning: density preserved, matches §13.4 search row already locked. Trade-off accepted: iPhone Safari users will see one focus-zoom per input; manual pinch returns. Do NOT use `transform: scale(0.875)` workarounds. Do NOT set `<meta name="viewport" user-scalable=no>` — that's an a11y violation. If a future surface (e.g. critical booking input) needs zoom-free behavior, that specific input can override to 16px — note in surface spec.

**Touch target:** every interactive form element ≥ 44px hit area per §11. Sm fields visually 40px tall MUST extend hit area via `padding` or pseudo-element to 44px.

### §F.1.0b · State matrix

Every primitive supports these states. NOT every state applies to every primitive (e.g. checkboxes have no `loading` — but switches do).

|state          |trigger                                                |visual change                                                                                                                                                              |
|---------------|-------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|default        |idle, no user interaction yet                          |1px ink-1 `.10` border, white `#FFFFFF` bg, no outline.                                                                                                                    |
|focus          |`:focus-visible` (keyboard tab in)                     |2px brand-orange `#E8742A` outline, 2px offset (per §1). Border + bg unchanged. **NO focus ring on mouse click** — `:focus-visible` only.                                  |
|active         |currently being typed in / interacted with (mouse focus)|2px brand-orange border replaces the 1px default border. Bg shifts to `#FFF4E8` (matches §14.3 search-row active state).                                                  |
|filled         |has a value / non-empty                                |label color stays ink-1 (NOT a different color — per §F.1.0 floating-label anti-pattern, filled fields don't change label).                                                |
|error          |validation failed (after submit OR live per §F.1.8 prevention rules)|2px error red `#D32F2F` border. Error message renders below. Field bg unchanged (don't tint red — too aggressive).                                                |
|warning        |non-blocking concern (e.g. password "weak" but accepted)|2px amber `#F59E0B` border. Warning message below. Use sparingly — most "warnings" are actually errors.                                                                    |
|success        |validation passed live (e.g. email format valid + available)|2px success green `#16A34A` border. Optional inline checkmark icon on right side of field. **No success message text** — green border + checkmark is enough; words are noise.|
|disabled       |form not yet ready / field locked / loading parent     |opacity 0.5, cursor not-allowed, bg `#FAF7F3` (sunken cream from §3), label color ink-3. NO hover/focus states.                                                            |
|loading        |async validation in flight (e.g. checking email availability)|spinner inline at right side of field, 14px brand-orange. Field still editable. Don't lock the field while loading.                                                        |

**Note on focus + active co-occurrence (V2-D14, 2026-05-05):** the spec defines each state in isolation. In practice, mouse-click focus and keyboard-tab focus rarely co-occur on the same field — `:focus-visible` only fires for keyboard, so a click-and-typing field renders the active state w/o the outline. If both somehow fire (programmatic focus + click), both render and that's accepted — visually busy but not broken. Locked: 3 reference states are sufficient.

### §F.1.1 · Text input

|prop                |spec                                                                                                                  |
|--------------------|----------------------------------------------------------------------------------------------------------------------|
|HTML element        |`<input type="text|email|tel|url|password|search|number">`                                                            |
|font                |Inter Tight 400 (filled state goes 500 weight if the form has a "filled vs empty" visual signal — opt-in per surface) |
|color               |ink-1 `#1A1209`                                                                                                       |
|placeholder         |Inter Tight 400, ink-3 `#7A6957`. Used for short hint, NOT for label text.                                           |
|caret               |brand-orange `#E8742A`                                                                                                |
|selection bg        |`rgba(232,116,42,.18)` (brand-tinted)                                                                                 |
|autocomplete        |always opt-in via `autoComplete="..."` attr; never disable for "design" reasons — autofill saves users time           |
|password reveal     |inline 24px button on right, Lucide `eye` (hidden) / `eye-off` (visible), ink-2 stroke, tap to toggle                 |
|password strength   |optional inline meter below, see §F.1.10 inline validation                                                            |
|number step buttons |hidden by default (`appearance: textfield`) — Solen does not show native number spinners; if increment needed, ship a custom stepper as a separate primitive in v2|

#### Variants by `type`

|type     |keyboard (mobile)                |inputmode      |autocomplete sample        |notes                                                                                                  |
|---------|---------------------------------|---------------|---------------------------|-------------------------------------------------------------------------------------------------------|
|text     |default                          |text           |`name` / `given-name`       |default                                                                                                |
|email    |email keyboard (with @ shortcut) |email          |`email`                     |use `<input type="email">` so iOS shows @-key                                                          |
|tel      |numeric phone keyboard           |tel            |`tel`                       |strip non-digits server-side; allow `+`, spaces, dashes in display                                     |
|password |default keyboard, hidden chars   |text           |`current-password` / `new-password`|reveal toggle per row above                                                                            |
|search   |"Go" key on iOS                  |search         |`off`                       |used inside search bars (§13.4, §14)                                                                   |
|number   |numeric                          |numeric/decimal|`off`                       |for prices, counts. NOT for phone/postal-code (those use `tel`/`postal-code`)                          |
|url      |URL keyboard (with .com shortcut)|url            |`url`                       |for B2B salon-profile website field                                                                    |

### §F.1.2 · Textarea

|prop                |spec                                                                                                                          |
|--------------------|------------------------------------------------------------------------------------------------------------------------------|
|HTML element        |`<textarea>`                                                                                                                   |
|min-height          |88px (md size, ~3 lines visible)                                                                                              |
|max-height          |280px (~10 lines) — beyond that, internal scroll within textarea                                                              |
|resize              |`resize: vertical` only. Never `resize: both` (horizontal resize breaks layouts).                                             |
|line-height         |1.5                                                                                                                           |
|character counter   |optional, bottom-right outside the field. Inter Tight 400 11px ink-3 (`[N] / [max]`). Brand-orange when within 20% of max.    |
|enter behavior      |`Enter` = newline. `Cmd/Ctrl + Enter` = submit form (when textarea is the only field, e.g. review write).                     |
|use cases (v1)      |review write (§RV Phase 2), report-content reason (§CO.5 Phase 4), salon profile bio (§B.5 Phase 6), B2B reply-to-review (§B.9)|

### §F.1.3 · Select (dropdown)

**v1 decision: native `<select>` for desktop AND mobile.** Custom-built dropdowns are expensive to ship correctly (focus trap, keyboard nav, virtual scrolling, mobile picker UX) and Solen v1 has no select use case complex enough to need it. Native `<select>` gets us platform-correct mobile pickers (iOS wheel, Android sheet) for free.

|prop                  |spec                                                                                                                            |
|----------------------|--------------------------------------------------------------------------------------------------------------------------------|
|HTML element          |`<select>`                                                                                                                       |
|appearance reset      |`appearance: none` to strip browser-default chevron                                                                              |
|custom chevron        |Lucide `chevron-down` 14px ink-2, positioned `right: 14px; top: 50%; transform: translateY(-50%);` via wrapper `<div>` w background-image OR positioned absolutely|
|padding-right         |40px (to leave room for chevron — overrides default 16px right padding)                                                         |
|all other properties  |inherit from §F.1.1 text input                                                                                                  |
|disabled option       |use `<option disabled>` for placeholder-style first row when no value selected (e.g. `<option value="" disabled selected>Stadt wählen</option>`)|

#### When NOT to use native `<select>`

If you ever need: searchable / typeahead / multi-select / tag-pill selection / virtualized long lists / icons inside options — those become a separate primitive (defer to v2 unless a v1 surface forces it). For v1, every dropdown can be:

- 3-10 short text options → native `<select>`
- Toggle group (e.g. service-type filter) → §F.1.4 checkbox-as-pill (multi) or §F.1.5 radio-as-pill (single)
- Bottom sheet w options (sort, filter sub-menus) → §F.3 bottom sheet primitive composing §F.1.5 radio rows

### §F.1.4 · Checkbox

Solen has TWO checkbox visual variants. The data binding (`<input type="checkbox">`) is identical; only the rendering differs.

#### Variant A — boxed checkbox (used in classic forms)

```
┌─┐
│ │  Label text
└─┘
```

|prop          |spec                                                                                                            |
|--------------|----------------------------------------------------------------------------------------------------------------|
|box size      |20×20px hit (44px hit area extended via wrapper label padding)                                                  |
|box border    |2px ink-1 `.25` (`rgba(26,18,9,.25)`)                                                                           |
|box bg        |white                                                                                                           |
|box radius    |`var(--radius-sm)` (6px) — squared not pill (distinguishes checkbox from radio per §F.1.5)                       |
|checked bg    |brand-orange `#E8742A`                                                                                          |
|checked icon  |Lucide `check` 14px white stroke 2.5px, centered                                                                |
|checked border|brand-orange `#E8742A` (matches bg, no contrast border)                                                         |
|indeterminate |Lucide `minus` 14px white (use case: parent-toggle for nested option groups)                                    |
|disabled      |opacity 0.4, cursor not-allowed                                                                                 |
|focus-visible |2px brand-orange outline, 2px offset                                                                            |
|label gap     |10px between box right edge and label left edge                                                                 |
|label font    |Inter Tight 400 14px ink-1                                                                                      |
|press         |scale(.92) 100ms `var(--ease-thud)` on the box                                                                  |
|toggle        |spring scale 1 → 1.15 → 1 over 300ms `var(--ease-spring)` on check                                              |

Used in: B2B settings forms (§B.5), profile settings (§AC.5), cookie consent categories (§F.8 / §SY.9), report-content reasons (§CO.5).

#### Variant B — pill checkbox (used in filter sheets)

Already locked in §25.7 — repeat the spec here so it's anchored:

|prop           |spec                                                            |
|---------------|----------------------------------------------------------------|
|layout         |flex-wrap row, gap 6px                                          |
|inactive bg    |`linear-gradient(180deg, #fff, #FDFAF5)`                        |
|inactive border|1px `rgba(26,18,9,.06)`                                         |
|inactive color |ink-1, font-weight 500                                          |
|inactive padding|`7px 12px`                                                     |
|inactive radius|`var(--radius-pill)` (99px)                                     |
|active bg      |ink-1 `#1A1209`                                                 |
|active color   |white, font-weight 600                                          |
|active border  |ink-1                                                           |
|font           |Inter Tight 12px                                                |
|tap            |toggles state, fires whatever debounced recount/recompute applies|

Used in: filter sheets §25.7, future B2B service-type tagging, future entdecken category multi-select.

### §F.1.5 · Radio

Solen has TWO radio visual variants. Data binding identical; rendering differs.

#### Variant A — radio row (used in sheets and forms)

Already locked in §25.6 — repeat here as the canonical primitive:

|prop                   |spec                                                                                                                    |
|-----------------------|------------------------------------------------------------------------------------------------------------------------|
|row layout             |flex row, align-center, gap 12px                                                                                        |
|row padding            |`14px 0` (vertical only, container padding handles horizontal)                                                          |
|row separator          |`1px rgba(26,18,9,.05)` bottom border (last row no border)                                                              |
|circle size            |18×18px (44px hit area via wrapper label)                                                                              |
|circle border (default)|2px ink-1 `.25` (`rgba(26,18,9,.25)`)                                                                                   |
|circle bg              |transparent                                                                                                             |
|circle radius          |`var(--radius-full)` (50%) — actual circle, distinguishes radio from checkbox                                          |
|circle border (selected)|2px brand-orange `#E8742A`                                                                                              |
|inner dot (selected)   |8px brand-orange `#E8742A`, centered via `radial-gradient(circle, #E8742A 0%, #E8742A 50%, transparent 50%)` or pseudo-element|
|label font             |Inter Tight 400 14px ink-1                                                                                              |
|label (selected)       |font-weight 600                                                                                                         |
|focus-visible          |2px brand-orange outline on circle, 2px offset                                                                          |
|press                  |scale(.94) 100ms `var(--ease-thud)`                                                                                     |
|switch animation       |new selection's inner dot fades in 150ms `var(--ease-snap)`; old selection's dot fades out same duration                |

Used in: sort sheets §25.6, future booking wizard step-selection, future B2B booking-policy single-select fields.

#### Variant B — pill radio (single-select toggle group)

Same shape as §F.1.4 Variant B (pill checkbox) — only difference is single-select semantics. Used when 3-5 mutually exclusive options need to be visually compact (e.g. "Damen / Herren / Kinder" in a salon-profile editor where a row of radio buttons would feel formal).

Visual spec identical to §F.1.4 Variant B. Behavior: tap deselects all others in group, can't deselect the last selected without choosing a new one.

### §F.1.6 · Switch (toggle)

For boolean settings. Distinct from checkbox: a checkbox says "include this in a list," a switch says "turn this feature on/off."

```
Notifications                 [●○]
```

|prop                  |spec                                                                                                            |
|----------------------|----------------------------------------------------------------------------------------------------------------|
|track size            |44×24px (44px wide, 24px tall)                                                                                  |
|track bg (off)        |ink-1 `.15` (`rgba(26,18,9,.15)`)                                                                               |
|track bg (on)         |brand-orange `#E8742A` (V2-D14 lock 2026-05-05 — accepted exception to §1 "≤4 brand instances per screen" rule for settings pages w many switches; brand color holds at scale per §AC.5 review)|
|track radius          |`var(--radius-pill)` (99px)                                                                                     |
|knob size             |20×20px white circle, `var(--radius-full)` (50%)                                                                |
|knob position (off)   |left, 2px inset                                                                                                 |
|knob position (on)    |right, 2px inset                                                                                                |
|knob shadow           |`0 1px 2px rgba(0,0,0,.12), 0 2px 4px rgba(0,0,0,.04)`                                                         |
|toggle animation      |knob slides 200ms `var(--ease-snap)`, track bg color crossfades same duration                                   |
|press                 |knob scale 1 → .92 100ms `var(--ease-thud)` then back                                                           |
|disabled              |opacity 0.4, cursor not-allowed                                                                                 |
|focus-visible         |2px brand-orange outline on track, 2px offset                                                                   |
|label                 |Inter Tight 400 14px ink-1, left of switch by 16px gap (switch is right-aligned in row)                         |
|sub-label (optional)  |Inter Tight 400 12px ink-3, 4px below label                                                                     |
|aria-checked          |reflects state                                                                                                  |
|role                  |`role="switch"` (better screen-reader UX than checkbox-styled-as-switch)                                        |

Used in: settings (§AC.5), notification preferences, B2B availability toggles (§B.7), cookie consent category toggles (§F.8).

**Anti-pattern:** using a switch for "select one of 2-5 mutually exclusive options" — that's a radio group. Switch = on/off ONLY.

### §F.1.7 · Mobile-specific behavior

|concern              |rule                                                                                                                                                |
|---------------------|----------------------------------------------------------------------------------------------------------------------------------------------------|
|iOS zoom on focus    |all text inputs `font-size ≥ 16px` (per §F.1.0a) — prevents iOS auto-zooming when user focuses a field                                              |
|autofocus            |opt-in only. Auto-focus on page load IS allowed for single-field modals (login email, search bar opening). NOT auto-focus on multi-field forms (overwhelming + steals scroll).|
|keyboard avoidance   |when keyboard opens, sticky bottom CTAs should sit above keyboard via `:focus-within` + `padding-bottom: calc(safe-area + keyboard-height)` if env supports it; otherwise scroll into view |
|return key           |submit form on `Enter` if focus is in last field; advance to next field if not last (per Apple HIG)                                                 |
|tap target           |label is part of the hit area — tapping label focuses field (HTML `<label for>` standard)                                                           |
|paste handling       |never strip pasted content silently. Email field can normalize (lowercase + trim) on blur, with no warning                                          |
|input modes          |use `inputmode` attr (numeric / decimal / tel / email / search) — improves iOS keyboard switching                                                   |
|capitalization       |`autocapitalize="words"` for name fields, `none` for emails / passwords / URLs, default for free text                                               |

### §F.1.8 · Inline validation (the prevention rule)

Per the §F.1 prevention principle (and reinforced by external UX consensus): **catch errors before submit, not after.** 80% of form errors can be prevented with live validation.

#### When to validate live

|trigger                              |behavior                                                                                                                            |
|-------------------------------------|------------------------------------------------------------------------------------------------------------------------------------|
|on blur (user leaves field)          |run sync validation (format checks, length checks). Show error immediately if invalid.                                              |
|on input (per keystroke)             |only for show-as-you-type validators (password strength meter, char counter on textarea, "available username" check)               |
|on submit                            |all validators run again; first invalid field gets focus + error message; page scrolls to it                                       |
|debounced async (e.g. email available)|debounce 400ms after last keystroke, then fire async validator. Show inline spinner during request. On result: success/error state.|

#### What to validate live

- **Format** — email syntax, phone format, URL validity, number range
- **Length** — min/max char count (textarea, password)
- **Password strength** — show meter (4 levels: zu schwach / schwach / gut / sehr gut). Don't block weak passwords if they meet the minimum (e.g. ≥ 8 chars + 1 number); just warn.
- **Availability** — email already in use, username taken, domain available
- **Confirmation match** — `password` vs `password-confirm` (live, on second field's blur)

#### What NOT to validate live

- **Required-ness on first interaction** — don't show "Email ist erforderlich" before user has even typed anything. Show only after blur OR submit attempt.
- **Server-side business rules** — "credit card declined", "no slots available at this time" — these can ONLY be checked on submit.

### §F.1.9 · Error message copy rules

Pulls from §1b voice + the human-copy principle. Lock in this section for forms specifically.

|do                                                                                  |don't                                                              |
|------------------------------------------------------------------------------------|-------------------------------------------------------------------|
|Describe what's wrong: `Diese E-Mail-Adresse ist nicht gültig.`                     |"Invalid email" / "Email is invalid" — passive voice + machine speak|
|Describe what to do: `Mindestens 8 Zeichen, mit einer Zahl.`                        |"Password too weak" — vague, no path forward                        |
|Use du-form: `Du hast diese E-Mail bereits verwendet.`                              |"This email is already in use." — passive, ignores user             |
|Show error code ONLY when user needs it for support: `Buchung fehlgeschlagen (Code: B1432) — Schreib an support@solen.ch.`|`Error 0x80004005` as the entire user-facing message              |
|Match severity: typos = inline · network = toast · server = full-screen retry      |500-modal for a typo (overkill, dead-end UX)                       |

Reuse §F.4 toast and §SY.2 error boundary specs when those land — same copy rules apply there.

### §F.1.10 · Anti-patterns

- **Floating labels** (label inside field, animates up on focus) — banned. Static label above field.
- **Pill-shaped text inputs** — banned (per §7). Pills look tappable; text inputs are typeable.
- **Required-field asterisks `*`** — use `·` red dot 5px instead OR put "Optional" tag on optional fields (let required be the default visual state). Asterisk reads as a footnote marker.
- **Disabling the submit button until form is valid** — mostly OK, but ALWAYS show why it's disabled (inline "Mindestens 8 Zeichen, mit einer Zahl" under password field). Otherwise users tap a dead button and have no recourse.
- **Showing all errors on first render** — only show errors after first blur or first submit attempt per field.
- **Clearing field on error** — never. The user typed it; preserve it. Let them edit.
- **Custom dropdowns when native works** — see §F.1.3.
- **Error messages that say "Try again."** — say WHY and HOW.
- **Different focus-ring styles per primitive** — every field uses the §1 brand-orange 2px outline. No exceptions.

-----

*§F.1 ends here. Phase 0 continues with §F.2 modal primitive — locked next.*

-----

*Step 3 ends here. Step 4 covers §12 the locked patterns: header / hero / search / cards / sections / b2b / footer.*

# SOLEN_LIVE_TRUTH_v2 — Step 4: Locked Patterns

> Components and screen patterns. Continues from step 3 (spacing + breakpoints + radius + z-index + scroll + safe areas + hit targets).
> 
> Every section gives exact pixel/hex values, every UI state, every conditional render, every interaction trigger w from+to+duration+cubic-bezier. No “consider removing” — DELETE explicit. No vibes — exact triggers.

-----

## §12 · Header

### §12.1 · Anatomy

```
┌────────────────────────────────────────────────────────┐
│ [solen]      [Basel ▾]   [🔔]   [avatar]              │
└────────────────────────────────────────────────────────┘
```

Layout left-to-right:

- Logo wordmark “solen”
- City pill `[Basel ▾]`
- Bell icon w optional badge count
- Avatar (initial circle or photo)

### §12.2 · Heights (per breakpoint)

|breakpoint         |height|
|-------------------|------|
|mobile (< 768px)   |`56px`|
|tablet (768–1023px)|`64px`|
|desktop (≥ 1024px) |`72px`|

Padding inside: `var(--space-4)` (16px) horizontal on mobile, `var(--space-5)` (20px) on tablet+, `var(--space-6)` (24px) on desktop.

### §12.3 · Logo “solen”

- Font: Bricolage Grotesque 700, lowercase
- Size: `clamp(20px, 2vw, 24px)`
- Letter-spacing: `-0.03em`
- Color: ink-1 `#1A1209`
- NO sprout glyph in header (sprout glyph is footer-only — see §17.3)

### §12.4 · City pill `[Basel ▾]`

Tap target: 44px × 36px hit area, visual size 32px tall.

#### City source precedence (which city to display)

URL is source of truth. Cookie is fallback.

|user state                         |shown city                                                                          |
|-----------------------------------|------------------------------------------------------------------------------------|
|on `/[city]` route (e.g. `/zurich`)|URL city wins, regardless of cookie                                                 |
|on `/` (root)                      |cookie `solen_active_city` value                                                    |
|no cookie + on `/`                 |IP-based geolocation guess (Cloudflare header), defaulting to `Basel` if guess fails|
|user changes city via pill         |update cookie + navigate to `/[new-city]`                                           |
|user navigates to a category page  |URL city wins, cookie syncs to URL on landing                                       |

|element             |spec                                                                                             |
|--------------------|-------------------------------------------------------------------------------------------------|
|label format        |text only — `Basel ▾` (no pin/flag/icon)                                                         |
|typography          |Inter Tight 600 13px, `-0.005em`                                                                 |
|chevron             |12px Lucide `chevron-down`, ink-2 `#56463E`                                                      |
|chevron gap         |4px                                                                                              |
|bg                  |`linear-gradient(180deg, #fff, #FDFAF5)`                                                         |
|shadow              |`inset 0 1px 0 rgba(255,255,255,.8), 0 1px 1px rgba(26,18,9,.04), 0 2px 6px rgba(232,116,42,.06)`|
|radius              |`var(--radius-pill)` (99px)                                                                      |
|padding             |`7px 14px`                                                                                       |
|pressed state       |`scale(0.96)` 100ms `var(--ease-thud)`                                                           |
|hover (desktop only)|brighter shadow, no transform                                                                    |

#### City dropdown (on tap)

Sheet anchored bottom on mobile, dropdown anchored to pill on desktop.

Content:

- Header label: “Stadt wählen” (Bricolage 700 16px)
- 3 city rows (Basel, Zürich, Bern) — NO salon counts inside dropdown
- Active city: brand-orange `#E8742A` text + checkmark right
- Inactive: ink-1, hover bg `#F5F0E8`
- Each row: 48px height, 14px Inter Tight 500, 16px horizontal padding
- Dismiss: tap outside, swipe down (mobile), Esc key

#### City dropdown DO NOT

- Do NOT show category-filtered counts (“47 Coiffeur”)
- Do NOT show flags or country emojis
- Do NOT add a “Andere Städte” row — defer to v2 when more cities exist

### §12.5 · Bell icon

|state                              |spec                                                                                 |
|-----------------------------------|-------------------------------------------------------------------------------------|
|default                            |Lucide `bell`, 22px, ink-1 stroke 2px                                                |
|with notifications                 |8px brand-orange `#E8742A` dot at top-right corner of bell, 1px ink-1 ring around dot|
|count ≥ 100                        |dot only — never numeric badge                                                       |
|press                              |`scale(0.94)` 100ms `var(--ease-thud)`                                               |
|count increments while user on page|dot pulses scale 1→1.3→1 over 400ms `var(--ease-spring)`                             |
|tap                                |opens `/notifications` page (full-screen on mobile, sheet on desktop)                |
|aria-label                         |`Benachrichtigungen` (when 0), `Benachrichtigungen, [N] neue` (when count > 0)       |

### §12.6 · Avatar

|condition                                         |display                                                                       |
|--------------------------------------------------|------------------------------------------------------------------------------|
|logged in w photo                                 |32px circle, photo `background-size: cover`, 1px ink-1 `.06` ring             |
|logged in w name (no photo)                       |initial of first name in 32px circle, bg ink-1, white Bricolage 700 14px      |
|logged in w no name + no photo (email-only signup)|first letter of email (uppercase), same styling as name initial               |
|logged out                                        |32px circle, ink-2 bg, white Lucide `user` 14px stroke icon — taps to `/login`|
|photo loading                                     |skeleton circle w shimmer per §5c.5                                           |
|photo failed to load                              |falls back to initial display                                                 |

Tap target: 44px hit area.

Tap → opens user menu drawer (mobile) or popover (desktop) w: profile / bookings / favorites / settings / sign out.

aria-label: `Mein Konto, [name]` when logged-in, `Einloggen` when logged out.

### §12.7 · Sticky behavior

Header is sticky. Scroll past `8px` from top:

- Add bottom shadow `0 1px 0 rgba(26,18,9,.04), 0 2px 8px rgba(26,18,9,.04)`
- Bg shifts from cream `#FBF8F3` to slightly more opaque cream `#FBF8F3` w `backdrop-filter: blur(10px) saturate(1.4)`
- Transition: 200ms `var(--ease-snap)`

### §12.8 · Scroll-up vs scroll-down behavior

DO NOT hide header on scroll-down + show on scroll-up. Header is ALWAYS visible. Reasoning: nav is too sparse (4 elements) to justify hide animation, plus city pill needs to be reachable at any scroll depth.

### §12.9 · Salon detail page header variant

When on `/salon/[slug]` page, header transforms:

|element              |change                                                                                                                                                          |
|---------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
|bg                   |transparent over hero photo → opaque cream once scrolled past hero (transition 250ms)                                                                           |
|logo                 |replaced w back-arrow (Lucide `arrow-left` 22px ink-1) at left                                                                                                  |
|city pill            |hidden on this page                                                                                                                                             |
|bell + avatar        |unchanged                                                                                                                                                       |
|back-arrow target    |`history.back()` if there’s history within solen.ch domain (i.e. user navigated from a feed). otherwise `/[city]` (the user’s current city homepage) as fallback|
|back-arrow aria-label|`Zurück`                                                                                                                                                        |

### §12.10 · NO nav links in header

DO NOT add any of: “Salons”, “Entdecken”, “Für Salons”, “Login”, “Sign up”. All navigation lives in:

- Search bar (in hero, not header)
- Avatar menu (logged-in user actions)
- Footer (legal, b2b, secondary)

This is intentional. Fresha-style minimal header. NO megamenu. NO horizontal nav. NO breadcrumbs.

-----

## §13 · Hero

### §13.1 · Layout

```
┌────────────────────────────────────────────────────────┐
│  [pulse · 47 Salons in Basel haben heute frei]        │  ← live counter pill
│                                                        │
│  Guten Morgen, Sulo                                   │  ← time-based greeting
│                                                        │
│  ┌──────────────────────────────────────────────┐    │
│  │ WAS  Service oder Salon                       │    │  ← search bar row 1
│  ├──────────────────────────────────────────────┤    │
│  │ WO   Basel · Kleinbasel                       │    │  ← row 2
│  ├──────────────────────────────────────────────┤    │
│  │ WANN Heute · 14:30                            │    │  ← row 3
│  └──────────────────────────────────────────────┘    │
│  [Solen durchsuchen →]                                │  ← CTA
│                                                        │
│  [Heute] [Last-Min] [In der Nähe] [Mehr Filter →]   │  ← dynamic chips
└────────────────────────────────────────────────────────┘
```

### §13.2 · Counter pill (top of hero)

|element                      |spec                                                                                            |
|-----------------------------|------------------------------------------------------------------------------------------------|
|copy template (count ≥ 2)    |`[count] Salons in [city] haben heute frei`                                                     |
|copy template (count = 1)    |`1 Salon in [city] hat heute frei` (singular: `Salon` + `hat`)                                  |
|copy template (count = 0)    |`Heute keine freien Termine in [city] — Morgen ab 09:00 verfügbar`                              |
|copy when API fails          |`Tausende Salons in der Schweiz` (generic fallback, no count)                                   |
|copy while loading first time|skeleton: 240px wide × 24px tall pill w shimmer per §5c.5                                       |
|number formatting            |Swiss apostrophe thousands per §8 i18n: `1'247 Salons` not `1247` and not `1,247`               |
|typography                   |Inter Tight 600 12px, `-0.005em`                                                                |
|pulse dot                    |6px brand-orange `#E8742A`, animates pulse 1.6s infinite (opacity 1↔.5, scale 1↔1.3) — see §5c.7|
|pulse dot when API failed    |hidden (no fake real-time signal when there’s no real-time data)                                |
|pill bg                      |`rgba(255,255,255,.65)` w `backdrop-filter: blur(12px) saturate(1.4)`                           |
|pill border                  |1px `rgba(232,116,42,.12)`                                                                      |
|pill padding                 |`6px 12px`                                                                                      |
|pill radius                  |`var(--radius-pill)` (99px)                                                                     |
|update                       |counter is REAL-TIME — refetches every 60s OR on visibility change (page becomes active)        |
|city                         |matches header city pill — when user changes city, both update simultaneously                   |
|not tappable                 |counter pill is NOT a button. no hover, no press, no link. purely informational.                |
|aria-live                    |`polite` — screen reader announces count updates without interrupting current task              |
|aria-label                   |full sentence read out (uses `<p>` tag inside, not just text spans)                             |

### §13.3 · Greeting line

Time-based, NOT day-based:

|time       |copy                           |
|-----------|-------------------------------|
|04:00–10:59|`Guten Morgen`                 |
|11:00–17:59|`Guten Tag`                    |
|18:00–22:59|`Guten Abend`                  |
|23:00–03:59|`Hallo` (no specific time word)|

|state           |full copy                        |
|----------------|---------------------------------|
|logged in w name|`[Greeting], [first name].`      |
|logged out      |`[Greeting].` (no name, no comma)|

|element       |spec                                                                                                     |
|--------------|---------------------------------------------------------------------------------------------------------|
|typography    |Bricolage Grotesque 700                                                                                  |
|size          |`clamp(28px, 6vw, 44px)`                                                                                 |
|line-height   |1.05                                                                                                     |
|letter-spacing|`-0.03em`                                                                                                |
|color         |ink-1 `#1A1209`                                                                                          |
|spacing       |margin-top `var(--space-3)` (12px) from counter pill, margin-bottom `var(--space-5)` (20px) to search bar|

#### Long name behavior

|condition                   |behavior                                                                                                                                       |
|----------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------|
|name ≤ 15 chars             |render on single line if width allows, wrap naturally if not                                                                                   |
|name 16-25 chars            |force wrap after comma — `Guten Morgen,\n[name].` (`\n` = literal line break via `<br>` or block element)                                      |
|name > 25 chars             |truncate to first 25 chars + `…` (e.g. `Maximilianoexample…`) — the salon-side b2b doesn’t enforce real-name policy so don’t trust input length|
|no first_name in user object|use `username` field if present, else fall back to logged-out greeting                                                                         |

DO NOT add wave emoji, sun illustration, or any decorative SVG to the greeting. Pure typography only.

aria-level: `<h1>` (page-level heading for SEO + screen reader hierarchy).

### §13.4 · Search bar — stacked 3-row format

Same on mobile and desktop. Stacked vertical, NOT horizontal columns.

|row|label |placeholder (empty) |default value (filled from context)                                                               |
|---|------|--------------------|--------------------------------------------------------------------------------------------------|
|1  |`WAS` |`Service oder Salon`|empty until user types                                                                            |
|2  |`WO`  |`Wo bist du?`       |matches header city pill (e.g. `Basel`). adds `· [neighborhood]` if geolocation permission granted|
|3  |`WANN`|`Wann passt's?`     |empty until user picks (NOT pre-filled with `Heute` — leaving empty signals “any time” to API)    |

#### Row anatomy

```
┌─────────────────────────────────┐
│ [LABEL]  [Value or placeholder] │
└─────────────────────────────────┘
```

|element                    |spec                                                                                                                                                                                               |
|---------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|label                      |Inter Tight 700 9px, brand-orange `#8A3C0F`, letter-spacing 0.18em, uppercase                                                                                                                      |
|value (filled)             |Inter Tight 600 14px ink-1 `#1A1209`                                                                                                                                                               |
|placeholder (empty)        |Inter Tight 400 14px ink-2 `#7A6957`                                                                                                                                                               |
|row height                 |56px                                                                                                                                                                                               |
|row padding                |`12px 16px`                                                                                                                                                                                        |
|row gap (label↔value)      |8px                                                                                                                                                                                                |
|filled vs empty visual diff|filled rows show value in ink-1 600 weight; empty rows show placeholder in ink-2 400 weight. NO icon, NO checkmark, NO bg color change — typography weight + color is the only filled-state signal.|

#### Container

|element      |spec                                                                                              |
|-------------|--------------------------------------------------------------------------------------------------|
|bg           |`linear-gradient(180deg, #fff 0%, #FDFAF5 100%)`                                                  |
|radius       |`var(--radius-2xl)` (16px)                                                                        |
|border       |1px `rgba(26,18,9,.06)`                                                                           |
|shadow       |`inset 0 1px 0 rgba(255,255,255,.8), 0 1px 2px rgba(26,18,9,.04), 0 8px 24px rgba(232,116,42,.06)`|
|row separator|`1px rgba(26,18,9,.06)` between rows                                                              |

#### CTA button (below container)

|element         |spec                                                                                                      |
|----------------|----------------------------------------------------------------------------------------------------------|
|copy            |`Solen durchsuchen →`                                                                                     |
|typography      |Inter Tight 700 14px                                                                                      |
|bg              |`linear-gradient(180deg, #F0834D 0%, #E8742A 100%)`                                                       |
|color           |white                                                                                                     |
|radius          |`var(--radius-pill)` (99px)                                                                               |
|padding         |`14px 24px`                                                                                               |
|margin-top      |`var(--space-3)` (12px)                                                                                   |
|width on mobile |100%                                                                                                      |
|width on tablet+|auto, anchored left of container                                                                          |
|arrow           |Lucide `arrow-right` 14px, magnetic flourish (gap 4→10px on hover, arrow translates 2px right, 200ms snap)|

### §13.5 · Search bar tap behavior

Tap any row → opens full-screen search page `/search` (NOT a modal, NOT a dropdown). See §14.

### §13.6 · Quick chips (below search bar)

Dynamic via cookie tracking. Shows top 3 most-used filters by user, plus “Mehr Filter →” as 4th slot.

|state                      |order                                                    |
|---------------------------|---------------------------------------------------------|
|cold visit (no cookie data)|`Heute` · `Last-Minute` · `In der Nähe` · `Mehr Filter →`|
|returning user             |top 3 most-tapped chips by user, then `Mehr Filter →`    |

|chip      |spec                                       |
|----------|-------------------------------------------|
|typography|Inter Tight 600 12px                       |
|bg default|`linear-gradient(180deg, #fff, #FDFAF5)`   |
|bg active |ink-1 `#1A1209`, white text                |
|border    |1px `rgba(26,18,9,.06)`                    |
|radius    |`var(--radius-pill)` (99px)                |
|padding   |`8px 14px`                                 |
|icon      |optional, 12px Lucide, before text, 4px gap|
|height    |32px                                       |
|spacing   |gap `var(--space-2)` (8px) between chips   |
|margin-top|`var(--space-4)` (16px) from search CTA    |

#### Chip behaviors

|chip           |behavior on tap                                                 |
|---------------|----------------------------------------------------------------|
|`Heute`        |adds filter `available=today`, navigates to `/[city]/heute`     |
|`Last-Minute`  |adds filter `available_within=2h`, navigates to `/[city]/sofort`|
|`In der Nähe`  |requests geolocation permission, sorts by distance              |
|`Mehr Filter →`|opens full search page `/search` w filters tab focused          |

#### Cookie tracking

Cookie `solen_chip_usage` stores `{[chipKey]: tapCount}` per user. Updated on tap. Read on hero render. Top 3 by count win the slots, ties broken by recency.

|rule                                     |spec                                                                                                    |
|-----------------------------------------|--------------------------------------------------------------------------------------------------------|
|cookie expiry                            |90 days from last update — refreshed on every tap                                                       |
|insufficient data (< 3 chips ever tapped)|fall back to default order: `Heute` · `Last-Minute` · `In der Nähe` · `Mehr Filter →` for unfilled slots|
|user clears cookies                      |reverts to default order                                                                                |
|slot 4 (`Mehr Filter →`)                 |always last, never replaced by tracked chips                                                            |
|chip not tapped in 60 days               |decay weight by 50% each subsequent week (so old preferences fade)                                      |

### §13.7 · Hero spacing

|spacing                   |value                                                                 |
|--------------------------|----------------------------------------------------------------------|
|header → counter pill     |`var(--space-6)` (24px) on mobile, `var(--space-8)` (32px) on tablet+ |
|counter pill → greeting   |`var(--space-3)` (12px)                                               |
|greeting → search bar     |`var(--space-5)` (20px)                                               |
|search bar → chips        |`var(--space-4)` (16px)                                               |
|chips → first feed section|`var(--space-8)` (32px) on mobile, `var(--space-10)` (48px) on tablet+|

-----

## §14 · Search system

`/search` is a full-screen page (NOT modal, NOT sheet). Activated when user taps any search bar row in hero.

### §14.1 · Layout

```
┌─────────────────────────────────────┐
│ [×]  Suche                          │  ← top bar
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ WAS  Service oder Salon         │ │  ← compact stacked search bar (sticky)
│ │ WO   Basel · Kleinbasel         │ │
│ │ WANN Heute · 14:30              │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│                                     │
│  [body changes by focused row]      │
│                                     │
└─────────────────────────────────────┘
[3 Filter · 47 Salons in Basel] ← sticky bottom CTA
```

### §14.2 · Top bar

- 56px tall on mobile, 64px on tablet+
- Left: close X (Lucide `x` 22px ink-1) — closes page, returns to previous
- Center: title `Suche` (Bricolage 700 16px, ink-1)
- Right: empty (no nav actions)

### §14.3 · Sticky compact search bar

Same 3-row stacked format from hero, but:

- Container shrinks slightly: row height 48px
- Active row gets brand-orange border `2px #E8742A` + bg `#FFF4E8`
- Inactive rows: bg `#fff`, no border highlight
- Sticky at top below top bar (z-index `var(--z-sticky)` per §8)

### §14.4 · Three states (driven by which row is focused)

#### State A — WAS focused (default on entry from hero `Service oder Salon` tap)

Body shows:

- Mobile keyboard pushes up automatically
- Live suggestions list as user types (debounced 150ms)
- Section header: `Beliebt in [city]` (Bricolage 700 14px ink-1)
- Pill row: top 6 popular service categories in current city
- Below: list of recent searches by user (max 5)

|typed input|result list shows                                           |
|-----------|------------------------------------------------------------|
|empty      |popular services in city + recent searches                  |
|1+ chars   |matching salons (up to 5) + matching services (up to 5)     |
|0 results  |“Keine Treffer für ‘[query]’” + “Beliebt in [city]” fallback|

Tap suggestion → fills WAS row, auto-advances focus to WO row.

#### State B — WO focused

Body shows:

- “In der Nähe” button at top w geo pin icon → requests geolocation, fills WO w “In der Nähe”
- Section header: `Stadt`
- 3 city rows w salon counts:
  - `Basel · 47 Salons`
  - `Zürich · 128 Salons`
  - `Bern · 62 Salons`
- Tapping city → fills WO row, auto-advances focus to WANN

#### State C — WANN focused

Body shows:

- 3 quick chips: `Heute` · `Morgen` · `Wochenende`
- Below chips: real calendar grid (current month, next month tab to switch)
- Time-of-day filter NOT included in v1 (defer time-slot picking to v2)

Tap date or chip → fills WANN row.

### §14.5 · Focus auto-advance

When a row is filled (via tap on suggestion), focus auto-advances to next empty row in order WAS → WO → WANN. If all 3 are filled, focus stays on last edited row.

User can also tap any row directly to switch focus.

### §14.6 · Sticky bottom CTA

|state            |copy                                                                         |
|-----------------|-----------------------------------------------------------------------------|
|no rows filled   |`Solen durchsuchen →` (disabled state, ink-3 `#7A6957` bg)                   |
|1+ row filled    |`[N] Filter · [count] Salons in [city]` (active state, brand-orange gradient)|
|count is updating|spinner replaces count, copy: `[N] Filter · zähle...`                        |

|element   |spec                                                                                     |
|----------|-----------------------------------------------------------------------------------------|
|bg active |`linear-gradient(180deg, #F0834D 0%, #E8742A 100%)`                                      |
|color     |white                                                                                    |
|radius    |`var(--radius-pill)` (99px)                                                              |
|padding   |`14px 24px`                                                                              |
|typography|Inter Tight 700 14px                                                                     |
|position  |sticky bottom, with `var(--space-4)` margin all sides, `safe-area-inset-bottom` respected|
|shadow    |`0 1px 2px rgba(26,18,9,.04), 0 16px 32px rgba(232,116,42,.18)`                          |
|z-index   |`var(--z-sticky)` per §8                                                                 |

Tap CTA → navigates to `/search/results?q=[was]&city=[wo]&date=[wann]`.

### §14.7 · Search system DO NOT

- DO NOT show a horizontal “filters” tab — search bar IS the filter system
- DO NOT auto-search as user types — only fetch suggestions, not full results
- DO NOT add a “Karte” tab inside search — map is part of `/search/results` not `/search`
- DO NOT include sort options inside `/search` — they live on the results page
- DO NOT lock keyboard open if user scrolls — close keyboard on scroll-down

-----

## §15 · Section header pattern

Reusable component for every horizontal scroll row on homepage and category pages.

### §15.1 · Anatomy

```
[Coiffeur in Basel]                              [Alle →]
─────────────────────────────────────────────────────────
[horizontal scroll row of cards]
```

### §15.2 · Locked decisions

|element                 |locked                                                                                              |
|------------------------|----------------------------------------------------------------------------------------------------|
|layout                  |A · clean — h2 left, “Alle →” right, NO sub-text, NO count, NO eyebrow                              |
|typography h2           |Bricolage 700 22-26px clamp, `-0.025em`, line-height 1, ink-1                                       |
|typography Alle link    |Inter Tight 600 13px, ink-1                                                                         |
|Alle text               |exactly `Alle →` (just word + arrow), nothing more                                                  |
|arrow                   |Lucide `arrow-right` 12px                                                                           |
|arrow flourish          |gap text↔arrow: 4px → 10px on hover, arrow `translateX(2px)` on hover, both 200ms `var(--ease-snap)`|
|URL on tap title or Alle|`/[city]/[category]` per §15.5                                                                      |

### §15.3 · Spacing

|spacing                          |value                                          |
|---------------------------------|-----------------------------------------------|
|margin-top from previous section |32px mobile / 48px tablet+                     |
|h2 to scroll row                 |12px                                           |
|section header horizontal padding|matches page padding (16px mobile, 24px tablet)|

### §15.4 · DO NOT

- DO NOT add eyebrow tags (“ENTDECKEN” all-caps above title) — locked E1 (none)
- DO NOT add sub-text below h2 (“5 von 23 Salons”) — locked layout A (clean)
- DO NOT add count to Alle link (“Alle 23 →”) — locked L1 (just `Alle →`)
- DO NOT vary section header style by section — single pattern for ALL sections including entdecken

### §15.5 · URL convention

When user taps section title OR “Alle →”, navigate to `/[city]/[category]` where:

|section                                     |URL                                                                     |
|--------------------------------------------|------------------------------------------------------------------------|
|`Heute frei in Basel`                       |`/basel/heute`                                                          |
|`Empfohlen für dich`                        |`/basel/empfohlen` (logged-in)                                          |
|`Entdecken in Basel`                        |`/entdecken` (no city — entdecken is global)                            |
|`Coiffeur in Basel`                         |`/basel/coiffeur`                                                       |
|`Barber in Basel`                           |`/basel/barber`                                                         |
|`Nails in Basel`                            |`/basel/nails`                                                          |
|`Spa in Basel`                              |`/basel/spa`                                                            |
|`Makeup in Basel`                           |`/basel/makeup`                                                         |
|`Wellness in Basel`                         |`/basel/wellness`                                                       |
|`Solen in deiner Stadt` (city tiles section)|`/staedte` (city directory — special case, not city/category structured)|

NO query strings (`?city=basel&service=coiffeur`). City-first URL structure for SEO. Each URL is a unique landing page w unique `<title>` + `<meta description>`.

The `Solen in deiner Stadt` section is an exception — it’s not city/category content, it’s a meta-section listing all cities. Its “Alle →” goes to a city directory page (`/staedte`), not a category landing page.

### §15.6 · When to hide “Alle →”

DO NOT hide. Always show “Alle →” — even if scroll row has only 3 cards. Tapping it goes to category page where same 3 are shown in grid format.

Exception: section is hidden entirely if 0 cards (see §16.6 empty states).

-----

## §16 · Salon card

Reusable component. 2 variants for v1 (`availability`, `service`). 2 more variants (`trust`, `joined`) deferred to v2 — see §16.8.

### §16.1 · Anatomy

```
┌──────────────────┐
│ [badge] [♥]      │ ← photo overlays
│                  │
│   PHOTO 1:1      │
│                  │
│                  │
└──────────────────┘
Salon Name             4.8 ⭐  ← row 1
Heute frei ab 14:30 · ab CHF 85   ← row 2
```

### §16.2 · Dimensions

|element           |spec                                               |
|------------------|---------------------------------------------------|
|width mobile      |160px                                              |
|width tablet+     |180px                                              |
|photo aspect ratio|1:1                                                |
|photo radius      |`var(--radius-xl)` (14px)                          |
|photo to text gap |8px                                                |
|total height      |~250-260px (160-180px photo + 8px gap + ~30px text)|

### §16.3 · Photo overlays

Badge state and row 2 text are TWO SEPARATE renders driven by the SAME data (next available slot). They coexist and reinforce each other — they’re not redundant. Example:

```
[● Sofort frei]   ← badge (orange dot, "Sofort frei")
   [photo]
Salon Crémant            4.9 ⭐
In 25 Min frei           ← row 2 (matching specific time)
```

The badge says the *category* of availability (now / today / not today), the row 2 gives the *specific time*.

#### Badge (top-left)

State-driven — exactly one state per card per render. Driven by `next_available_slot` data:

|state condition                                            |copy                                                           |bg                                           |dot color             |
|-----------------------------------------------------------|---------------------------------------------------------------|---------------------------------------------|----------------------|
|next slot is within 30 min from now                        |`Sofort frei`                                                  |glass white `rgba(255,255,255,.85)` w blur 12|brand-orange `#E8742A`|
|next slot is later today (30 min < t ≤ end of business day)|`Heute frei`                                                   |glass white `rgba(255,255,255,.85)` w blur 12|green `#16A34A`       |
|next slot is tomorrow or later                             |(no badge)                                                     |—                                            |—                     |
|salon is permanently closed / deactivated                  |(card hidden from feeds entirely — see §16.6)                  |—                                            |—                     |
|salon is temporarily closed (vacation, sickness)           |small ink-2 pill `Pause bis [date]` instead of green/orange dot|glass white                                  |(no dot)              |

|element        |spec                                                                           |
|---------------|-------------------------------------------------------------------------------|
|position       |`top: 8px; left: 8px;`                                                         |
|typography     |Inter Tight 700 10px, ink-1 `#1A1209`                                          |
|dot size       |5px diameter                                                                   |
|dot ring       |`box-shadow: 0 0 0 3px rgba(<dotcolor>, .2)`                                   |
|dot pulse      |opacity 1↔.5, scale 1↔1.3, 1.6s infinite                                       |
|padding        |`4px 9px`                                                                      |
|radius         |`var(--radius-pill)` (99px)                                                    |
|backdrop-filter|`blur(12px) saturate(1.4)`                                                     |
|shadow         |`0 1px 2px rgba(0,0,0,.06)`                                                    |
|aria-label     |full pill text read out (e.g. `Heute frei`, `Sofort frei`, `Pause bis 15. Mai`)|

#### Heart icon (top-right)

|state                               |spec                                                                                                                           |
|------------------------------------|-------------------------------------------------------------------------------------------------------------------------------|
|not saved                           |Lucide `heart` 14px ink-1 stroke 2px, fill none                                                                                |
|saved                               |Lucide `heart` filled w love-red `#FF4A6B`, stroke same color                                                                  |
|size                                |28px circle button                                                                                                             |
|bg                                  |glass white `rgba(255,255,255,.85)` w blur 12                                                                                  |
|shadow                              |`0 1px 2px rgba(0,0,0,.06)`                                                                                                    |
|position                            |`top: 8px; right: 8px;`                                                                                                        |
|tap                                 |toggles save state, optimistic UI update, syncs to backend                                                                     |
|animation on save                   |pulse scale `1 → 1.3 → 1` over 300ms `var(--ease-spring)`                                                                      |
|animation on unsave                 |scale `1 → 0.9 → 1` over 200ms `var(--ease-snap)`                                                                              |
|aria-label not saved                |`Speichern`                                                                                                                    |
|aria-label saved                    |`Gespeichert`                                                                                                                  |
|screen reader announcement on toggle|`[Salon Name] gespeichert` / `[Salon Name] entfernt` (aria-live=“polite”)                                                      |
|logged-out user tap                 |opens login modal w copy `Speichere deine Lieblings-Salons. Melde dich an oder erstelle ein Konto.` — return to card after auth|

### §16.4 · Row 1 — Name + Rating

|element           |spec                                                                       |
|------------------|---------------------------------------------------------------------------|
|layout            |flex row, baseline aligned, justify-between                                |
|name typography   |Bricolage Grotesque 700 14px, `-0.01em`, line-height 1.1, ink-1            |
|name truncation   |single line, ellipsis if overflow                                          |
|name flex         |1, min-width 0                                                             |
|rating typography |JetBrains Mono 500 11px, ink-1                                             |
|star icon         |10px, fill `#F3A864` (amber), no stroke                                    |
|star icon position|left of number, 2px gap                                                    |
|rating format     |`[star] 4.8` — one decimal, NO review count, NO `/5` suffix                |
|rating shown when |always, even if 0 reviews (shows `—` instead of number when no rating data)|

### §16.5 · Row 2 — Variant content

#### Variant `availability`

Used in: `Heute frei in Basel`, `Empfohlen für dich`, `/favoriten` page, `/search/results`, look-detail sheet salon list.

Format determined by next-available-slot logic:

|condition                     |row 2 format                                                                  |
|------------------------------|------------------------------------------------------------------------------|
|has 3+ slots today            |`[time1], [time2], [time3]` (e.g. `14:30, 15:00, 16:30`) — all bold ink-1     |
|has 1-2 slots today           |shown as `[time1], [time2]`                                                   |
|has slot in next 30 min       |`In [N] Min frei` — bold ink-1 (e.g. `In 25 Min frei`)                        |
|no slots today, has tomorrow  |`Nächster Termin Mo. [time]` — “Nächster Termin Mo.” in ink-2, time bold ink-1|
|no slots today, has later week|`Nächster Termin [Mo./Di./...] [time]`                                        |
|no slots ever (closed)        |`Geschlossen` — ink-3 only, no badge                                          |

Typography: Inter Tight 400 11px, line-height 1.3, ink-2 `#7A6957`. Bold parts use Inter Tight 600 ink-1 `#1A1209`.

#### Variant `service`

Used in: all category feeds (`Coiffeur in Basel`, `Barber in Basel`, etc), `/[city]/[category]` category page, `/search/results` w category filter.

Format: `[Featured Service] · ab CHF [price]`

|condition                                       |row 2 format                                               |
|------------------------------------------------|-----------------------------------------------------------|
|salon has services in section’s category        |`[most-booked service in category] · ab CHF [lowest price]`|
|salon has no services in category but is in feed|`[any service] · ab CHF [price]`                           |
|salon has services but no pricing data          |`[service]` only, no `· ab CHF X`                          |

Typography: Inter Tight 400 11px, ink-2. Service name plain, `· ab CHF X` plain ink-2 BUT the number `CHF 85` is Inter Tight 600 ink-1.

### §16.6 · States

|state               |spec                                                                   |
|--------------------|-----------------------------------------------------------------------|
|default             |as specified above                                                     |
|press (on tap)      |`scale(0.94)` 100ms `var(--ease-thud)`                                 |
|hover (desktop only)|`translateY(-1px)` + brighter shadow on photo, 200ms `var(--ease-snap)`|
|focus-visible       |2px brand-orange `#E8742A` outline, 2px offset, around the entire card |
|loading             |skeleton — see §16.7                                                   |
|heart toggle        |see §16.3                                                              |

Tap card → navigates to `/salon/[slug]`.

### §16.7 · Loading skeleton

|element|skeleton                                                                      |
|-------|------------------------------------------------------------------------------|
|photo  |rounded rect 1:1, bg `#F0EAE0`, left-to-right shimmer (per §5c.5) max 2 cycles|
|name   |rect 60% width × 14px height, bg `#E8DFD3`                                    |
|rating |rect 30px × 11px height, right-aligned                                        |
|row 2  |rect 80% width × 11px height                                                  |

Shimmer animation: `linear-gradient(90deg, transparent, rgba(255,255,255,.4), transparent)` translates left to right over 1.4s `var(--ease-glide)`, repeats max 2 times.

### §16.7b · Photo handling

|condition                                 |behavior                                                                                                                                                                                                                           |
|------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|salon has photo (≥ 1 uploaded)            |use first/primary photo, displayed as `next/image` with `fill` + `style={{objectFit: 'cover'}}`                                                                                                                                    |
|salon has no photo                        |fallback to category-color tile w salon initials in white Bricolage 700 32px centered. category colors: Coiffeur `#D88A6E`, Barber `#1A1209` w cream initials, Nails `#B5588A`, Spa `#88B89E`, Makeup `#D66547`, Wellness `#9B7BB8`|
|photo upload is landscape (W > H)         |smart-crop centered (CSS `object-fit: cover` + `object-position: center`)                                                                                                                                                          |
|photo upload is portrait (H > W)          |smart-crop centered, top-aligned (`object-position: 50% 30%`) so faces aren’t cut off                                                                                                                                              |
|photo file size limits (salon-side upload)|min 800×800px, max 4000×4000px, max 5MB, formats: jpg/png/webp                                                                                                                                                                     |
|CDN                                       |Supabase Storage w `next/image` for responsive sizing — request 240px (mobile retina) and 360px (tablet retina) variants                                                                                                           |
|photo loading                             |skeleton shimmer until loaded, fallback to category tile if load fails after 8s                                                                                                                                                    |

### §16.7c · Chain stores (multi-location salons)

When a brand has multiple locations (e.g. `Klipp Tisi - Bahnhof` + `Klipp Tisi - Aeschenplatz`):

|context                      |behavior                                                                                                                                        |
|-----------------------------|------------------------------------------------------------------------------------------------------------------------------------------------|
|in feeds                     |each location is its own card. name format: `[Brand] · [Neighborhood]` if neighborhood is short enough to fit, else `[Brand] · [Locality short]`|
|name truncation              |“Klipp Tisi · Bahnhof” wraps to ellipsis if longer than card width — neighborhood is sacrificed first, brand name kept                          |
|same brand on /search/results|locations grouped by brand only when 5+ locations of same brand match query (then we show a “Klipp Tisi (5 Standorte) →” expandable group)      |
|chain logo / branding        |NOT shown on card v1. all visual signals come from photo + name                                                                                 |

### §16.8 · DEFER TO V2

These card variants are NOT built in v1:

- `trust` — line 2 = `[N] Bewertungen`, used in “Top bewertet” feed. Defer until 5+ salons have 50+ reviews (otherwise feed is empty/sparse).
- `joined` — line 2 = `Neu seit [Monat]`, used in “Neu auf Solen” feed. Defer until salon onboarding rate is 5+/month (otherwise feed is stale).

Corresponding homepage feeds also killed for v1: `Top bewertet in Basel`, `Neu auf Solen`.

-----

## §17 · Horizontal scroll row container

The container that holds salon cards in horizontal-scrolling sections.

### §17.1 · Layout

|element                   |spec                                                                                    |
|--------------------------|----------------------------------------------------------------------------------------|
|display                   |flex row                                                                                |
|gap between cards         |`var(--space-3)` (12px)                                                                 |
|padding                   |`0 var(--space-4)` (16px sides) on mobile, `0 var(--space-6)` (24px) on tablet+         |
|overflow-x                |auto                                                                                    |
|overflow-y                |visible (so hover/focus shadows aren’t clipped)                                         |
|scroll-behavior           |smooth                                                                                  |
|-webkit-overflow-scrolling|touch (iOS momentum scroll)                                                             |
|scrollbar                 |hidden (webkit `::-webkit-scrollbar { display: none }`, firefox `scrollbar-width: none`)|

### §17.2 · Scroll snap

|property        |value                                    |
|----------------|-----------------------------------------|
|scroll-snap-type|`x proximity` (NOT mandatory — soft snap)|
|each card       |`scroll-snap-align: start`               |

Reasoning: `proximity` lets user free-scroll without snap fighting them, but snaps gently when scroll velocity slows.

### §17.3 · Edge bleed

Cards extend past page horizontal padding to imply “more offscreen.” Implementation:

- Container has `padding-left: var(--space-4)` matching page padding
- Container has `padding-right: var(--space-4)`
- Last card aligns w right edge of viewport when scrolled to end
- First card aligns w page left padding when scrolled to start

### §17.4 · Cards per row

8-10 cards loaded server-side per row. NOT infinite scroll within the row — user uses “Alle →” link in section header to see more (per §15).

### §17.5 · End-of-scroll

DO NOT add a “View all →” CTA card at the end. The section header “Alle →” link is the only “see more” affordance.

### §17.6 · Empty states

|condition                                                  |behavior                                                                                                                                     |
|-----------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------|
|0 cards in row                                             |hide entire section (header + scroll row disappear)                                                                                          |
|`Empfohlen für dich` w no logged-in user                   |section hidden by default, no placeholder                                                                                                    |
|`Empfohlen für dich` w logged-in user but 0 booking history|section hidden — show generic `Heute frei` instead. v2 may add cold-start recommendations based on city + popular categories.                |
|`Heute frei` w 0 salons free today                         |section title changes to `Diese Woche frei in [city]`, shows next-7-day availability instead. NEVER hide entirely — too important to user UX.|
|API error / fetch failed                                   |show 2-3 skeleton cards + small inline retry link `Erneut laden`                                                                             |
|feed loading                                               |show 3-5 skeleton cards in shimmer state                                                                                                     |
|salon permanently deactivated                              |filtered out at API level, never reaches frontend                                                                                            |
|salon temporarily closed (vacation)                        |INCLUDED in feeds w `Pause bis [date]` badge per §16.3, but ranked lower in sort                                                             |

DO NOT show empty-state copy (“Komm bald, wir lernen deinen Geschmack kennen”) in v1. Just hide the section. v2 may add empty-state UX once recommendation engine is mature.

### §17.7 · Sort order within rows

|section                               |sort order                                                                                              |
|--------------------------------------|--------------------------------------------------------------------------------------------------------|
|`Heute frei in [city]`                |by next-available-time ascending (earliest slots first)                                                 |
|`Empfohlen für dich`                  |by personalization score (logged-in user only)                                                          |
|`Entdecken in [city]`                 |by recency of look upload, mixed w popularity (engagement-weighted)                                     |
|`[Category] in [city]` (Coiffeur, etc)|by mix: 40% rating × 40% bookings-last-30-days × 20% recency joined. salons paused/closed pushed to end.|

Server-side sort. Client never re-sorts.

### §17.8 · Desktop scroll affordance

|breakpoint             |affordance                                                                                                                                                                       |
|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|mobile + tablet        |swipe only, no arrows                                                                                                                                                            |
|desktop (≥ 1024px)     |when scrollable (cards extend past viewport), show 32px circle arrow buttons left + right of row, glass white bg, ink-1 chevron, fades in on row hover (200ms `var(--ease-snap)`)|
|desktop arrows position|absolute, `top: 50%` of photo (centered vertically with card photos), `left: 8px` and `right: 8px`                                                                               |
|arrow hidden           |when scroll is at start (left arrow) or end (right arrow) — fade out 150ms                                                                                                       |
|arrow tap              |scrolls one card-width forward/back (172px = card width 160 + gap 12)                                                                                                            |
|keyboard nav           |Tab focuses cards individually; Arrow Left/Right scrolls when row has focus                                                                                                      |

-----

## §18 · Entdecken (inspo / look discovery)

A separate content type from salon cards. TikTok-sourced video looks → tap → see which salons in user’s city offer that look → book.

### §18.1 · Homepage presence

Section “Entdecken in Basel →” is a horizontal scroll row, same shape as other sections (per §17). 5-6 cards visible.

Section header per §15. Tap title or `Alle →` → `/entdecken` page.

### §18.2 · Look card

Different from salon card — vertical video tile, not 1:1 photo.

|element     |spec                                                         |
|------------|-------------------------------------------------------------|
|width       |200px (slightly wider than salon card to fit vertical aspect)|
|aspect ratio|varies for masonry — 3:4 short, 3:5 medium, 9:16 tall        |
|radius      |`var(--radius-xl)` (14px)                                    |
|video       |TikTok video, autoplays muted on viewport visibility, loops  |
|poster frame|first frame, shown before video loads                        |

#### Video autoplay performance rules

CRITICAL: do NOT autoplay all videos in viewport at once. This kills mobile battery + crashes low-end devices.

|rule                    |behavior                                                                                                                             |
|------------------------|-------------------------------------------------------------------------------------------------------------------------------------|
|simultaneous video count|max 2 videos playing at any time across entire page                                                                                  |
|start playing trigger   |only when card is fully in viewport (IntersectionObserver `threshold: 1.0`) AND user has stopped scrolling for 200ms                 |
|pause trigger           |card leaves viewport (threshold 0.5), user scrolls fast (scroll velocity > 800 px/s), or another card starts playing (replace oldest)|
|data saver mode         |check `navigator.connection.saveData` — if true, never autoplay, show poster + tappable play button                                  |
|reduce-motion preference|check `prefers-reduced-motion: reduce` — same as data saver: poster only                                                             |
|audio                   |always muted by default, can NOT be unmuted in feed view (only in look-detail sheet §18.4)                                           |
|sound icon (in feed)    |NOT shown — videos are silent in feed by design                                                                                      |
|mobile data warning     |NOT shown — autoplay is silent so data usage is comparable to GIFs                                                                   |

#### Look card overlays

|element                   |spec                                                                                                                                                |
|--------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------|
|source pill (top-left)    |format `[Category] · [Source]` (e.g. `Hair · TikTok`). Bg gold `rgba(232,116,42,.85)` w blur, ink-1 text, Inter Tight 700 10px                      |
|heart icon (top-right)    |same as salon card (28px glass)                                                                                                                     |
|bookmark icon             |28px glass, Lucide `bookmark` 14px ink-1, positioned 4px left of heart — saves to “Mein Look” board (see §18.5)                                     |
|play indicator (centered) |40px coral circle `#E8742A`, white play arrow, only visible when video paused or before play                                                        |
|service name pill (bottom)|bg glass white `rgba(255,255,255,.85)` w blur, ink-1 text, Inter Tight 600 12px, truncated w ellipsis, position `bottom: 8px; left: 8px; right: 8px`|

### §18.3 · /entdecken page

Pinterest-style masonry feed:

|element        |spec                                                                     |
|---------------|-------------------------------------------------------------------------|
|layout         |CSS columns (multi-column) for masonry                                   |
|column count   |2 mobile / 3 tablet / 4 desktop                                          |
|column gap     |`var(--space-3)` (12px)                                                  |
|infinite scroll|yes — load 20 looks per page, fetch more on scroll within 200px of bottom|
|skeleton state |rectangles in masonry pattern w shimmer                                  |

### §18.4 · Look-detail sheet (tap card)

Opens fullscreen sheet (mobile) or centered modal (desktop). NOT a navigation — sheet over current page, dismissible to return.

#### Dismiss behavior

|trigger                          |behavior                                                                         |
|---------------------------------|---------------------------------------------------------------------------------|
|close X tap                      |dismiss, video pauses                                                            |
|swipe down (mobile, top of sheet)|dismiss when swipe distance > 80px AND velocity > 200 px/s                       |
|swipe down on video              |NOT dismissable from video area (user might scrub) — only from sheet header/edges|
|Esc key (desktop)                |dismiss                                                                          |
|backdrop tap (desktop)           |dismiss                                                                          |
|browser back button              |dismiss (use `history.pushState` to capture back nav)                            |

#### Audio in detail sheet

|state             |behavior                                                                                                    |
|------------------|------------------------------------------------------------------------------------------------------------|
|sheet opens       |video autoplays w SOUND ON if user has previously unmuted any look in this session, else muted              |
|mute/unmute toggle|top-right of video, 28px circle glass button, Lucide `volume-2` (unmuted) / `volume-x` (muted), ink-1 stroke|
|session preference|stored in `sessionStorage` as `solen_entdecken_audio` — persists tab session, resets on new tab             |

#### Anatomy

```
[× close]            [♥] [⚓] [↗ share]

  ┌───────────────┐
  │ TikTok video  │
  │ autoplay loop │
  │ full size     │
  └───────────────┘

  Hair · TikTok · @creator
  Textured Shaggy Bob

  Verfügbar bei [N] Salons in [city]:
  ┌──────────────────────────────────┐
  │ [photo] Salon Crémant · 4.8 ⭐    │
  │ Schnitt + Föhnen · CHF 85         │
  │ Heute verfügbar 14:30 →           │
  └──────────────────────────────────┘
  ...

  ━━━━━━ sticky bottom CTA ━━━━━━
  [Buche diesen Look →]
```

|element                 |spec                                                                                                                                                                                  |
|------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|close X                 |top-left                                                                                                                                                                              |
|heart / bookmark / share|top-right (3 icons in row, 8px gap)                                                                                                                                                   |
|video container         |16:9 max, centered, padding `var(--space-4)`                                                                                                                                          |
|meta line               |`[Category] · [Source] · @creator` (Inter Tight 500 12px ink-2)                                                                                                                       |
|look name               |Bricolage 700 22px ink-1, `-0.025em`                                                                                                                                                  |
|salon list header       |Inter Tight 600 13px ink-2: `Verfügbar bei [N] Salons in [city]:`                                                                                                                     |
|salon row               |mini horizontal card: photo 64px circle, name + rating, service + price, availability + arrow                                                                                         |
|sticky bottom CTA       |`Buche diesen Look →` (button bg brand-orange gradient) — when tapped, picks salon (auto-picks top one or shows picker if user hasn’t tapped a salon row), navigates to booking wizard|

### §18.5 · Heart vs Bookmark

|action  |behavior                                                                                                                                                                               |
|--------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|heart   |private like — saved to user’s `Likes` list (single flat list, no organization). Visible only to user. Tap heart again to unlike.                                                      |
|bookmark|save to a “Mein Look” board (collection). User can have multiple boards (e.g. Hair / Nails / Sommer-Inspo). On tap: shows board picker sheet — select existing board or create new one.|

Both states visible simultaneously on a card (a look can be both liked AND bookmarked). Bookmark icon shows filled brand-orange when at least one board contains the look.

### §18.5b · No salons match the look

|condition                                                              |sheet behavior                                                                                                                         |
|-----------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
|0 salons in user’s current city offer this service                     |section header changes to `Andere Städte:` and shows salons from other cities. CTA copy: `Buche in einer anderen Stadt →`              |
|0 salons anywhere offer this service yet                               |section becomes notice card: `Dieser Look ist neu auf Solen — bald verfügbar.` w heart-it CTA `Speichere ihn, wir benachrichtigen dich`|
|salons match service category but none have today/tomorrow availability|section header still shows salons, CTA shows next-available date per salon                                                             |

### §18.6 · TikTok ToS compliance flag

Implementation note for backend: ingestion method must comply w TikTok’s Terms of Service. Verify current method (partner-uploaded vs official API vs scraping) before scaling. Document chosen method in repo `docs/tiktok-integration.md`.

-----

## §19 · City tiles (Solen in deiner Stadt)

Section that lets user switch which city’s homepage they’re seeing. Sits between category feeds and b2b card on homepage.

### §19.1 · Anatomy

```
[Solen in deiner Stadt]                        [Alle →]
─────────────────────────────────────────────────────────
[ tile · Basel · Aktuell ] [ tile · Zürich ] [ tile · Bern ]
```

### §19.2 · Section header

|element            |spec                                       |
|-------------------|-------------------------------------------|
|title              |`Solen in deiner Stadt`                    |
|Alle link          |`Alle →` → `/staedte` (city directory page)|
|follows §15 pattern|yes                                        |

### §19.3 · Tile container

Horizontal scroll row, same pattern as §17.

### §19.4 · Tile dimensions

|element     |spec                                           |
|------------|-----------------------------------------------|
|width       |220px                                          |
|aspect ratio|4:3 (landscape — distinct from 1:1 salon cards)|
|radius      |`var(--radius-2xl)` (16px)                     |
|overflow    |hidden                                         |

### §19.5 · Tile content (D · custom illustration when available, solid color fallback v1)

#### v1 fallback (no illustration available)

|element           |spec                                                                        |
|------------------|----------------------------------------------------------------------------|
|bg                |solid color per city, with brand-aligned palette:                           |
|                  |Basel: `linear-gradient(160deg, #E8742A 0%, #C25E1A 100%)` (brand orange)   |
|                  |Zürich: `linear-gradient(160deg, #88B89E 0%, #5E9879 100%)` (sage)          |
|                  |Bern: `linear-gradient(160deg, #9B7BB8 0%, #6B4F8A 100%)` (plum)            |
|highlight gradient|`linear-gradient(180deg, rgba(255,255,255,.22) 0%, transparent 50%)` overlay|
|city name         |Bricolage 700 22px white, `-0.025em`, line-height 1                         |
|city meta         |Inter Tight 500 11px `rgba(255,255,255,.85)` — `[N] Salons`                 |
|icon              |22px Lucide `map-pin`, `rgba(255,255,255,.95)`, top-left of content area    |
|content padding   |14px                                                                        |
|content layout    |flex column, justify-between (icon top, name+meta bottom)                   |

#### v1.5 / v2 — custom illustration

When illustration assets land, swap fallback for SVG illustration on `bg: linear-gradient(180deg, #FBF8F3 0%, #F0E6D6 100%)` w 1px ink `.06` border.

|element               |spec                                                                                       |
|----------------------|-------------------------------------------------------------------------------------------|
|illustration container|absolute, inset 0, z-index 0, flex center align                                            |
|illustration          |SVG, viewBox `0 0 200 100`, max 80% width × 80% height, max-height 140px, max-width 200px  |
|illustration color    |brand-orange `#E8742A` w opacity 0.85                                                      |
|city name             |Bricolage 700 20px ink-1 `#1A1209`                                                         |
|city meta             |Inter Tight 500 10px ink-2 `#7A6957` — `[N] Salons · [Landmark]` (e.g. `47 Salons · Rhein`)|

#### Illustration commission spec

For when illustrations are commissioned:

|element     |spec                                                                                                                   |
|------------|-----------------------------------------------------------------------------------------------------------------------|
|format      |SVG, single file per city                                                                                              |
|viewBox     |`0 0 200 100` (4:3 ratio compatible)                                                                                   |
|stroke width|1.8px                                                                                                                  |
|stroke color|`currentColor` (so we can color-tint per tile)                                                                         |
|stroke caps |round                                                                                                                  |
|stroke joins|round                                                                                                                  |
|fill        |none (line-only illustration)                                                                                          |
|max paths   |4-6 path elements per illustration                                                                                     |
|style       |monoline, single-stroke, slight imperfection allowed                                                                   |
|subjects    |Basel: Münster + Rhein bend / Zürich: lake + Grossmünster / Bern: Aare bend + Zytglogge / future cities: local landmark|
|budget guide|CHF 200-500 for set of 3 (Fiverr/Upwork) or CHF 1000-2000 (swiss illustrator)                                          |

### §19.6 · “Aktuell” badge on current city

|element                        |spec                                                                                                                           |
|-------------------------------|-------------------------------------------------------------------------------------------------------------------------------|
|visible on                     |the tile matching the user’s currently-selected city (the one in header pill)                                                  |
|visibility when no city set yet|hidden — first cold visit shows no Aktuell badge (city pill defaults to Basel via IP, but no badge until user actively engages)|
|position                       |`top: 10px; left: 10px;`                                                                                                       |
|copy                           |`Aktuell`                                                                                                                      |
|typography                     |Inter Tight 700 9px, letter-spacing 0.04em                                                                                     |
|dot                            |5px brand-orange `#E8742A`, before text, 4px gap                                                                               |
|bg                             |`rgba(255,255,255,.85)` w `backdrop-filter: blur(8px) saturate(1.4)`                                                           |
|color                          |ink-1 `#1A1209`                                                                                                                |
|padding                        |`4px 8px`                                                                                                                      |
|radius                         |`var(--radius-pill)` (99px)                                                                                                    |
|z-index                        |3 (above overlay, above content)                                                                                               |
|aria-label                     |`Aktuelle Stadt`                                                                                                               |

### §19.7 · Tile order

Current city always first, then by salon supply (descending). For v1: `[current city] · Zürich · Basel · Bern` (excluding current from list).

If current city IS Zürich: `Zürich · Basel · Bern`. If current is Basel: `Basel · Zürich · Bern`. If Bern: `Bern · Zürich · Basel`.

### §19.8 · Tap behavior

Tap tile → navigates to `/[city]` (e.g. `/zurich`).

The `/[city]` page in v1 = same homepage layout but city-filtered, w that city set in header pill. v2 may add city-specific content (neighborhood breakdown, popular categories per city).

### §19.8b · Non-v1 city handling

If user deep-links to a city not in v1 (e.g. `/genf`, `/luzern`, `/lausanne`):

|condition                               |behavior                                                                                                                                                                     |
|----------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|city slug exists in DB but no salons yet|render homepage layout w hero counter `Solen kommt bald nach [City]` + waitlist CTA `Benachrichtige mich` (email signup), feeds replaced w “Andere Städte” recommendation row|
|city slug NOT in DB                     |404 — `Diese Stadt gibt es bei uns noch nicht` w link back to `/` and link to nearest city in v1                                                                             |
|city has only 1-3 salons                |render normally — salons shown even if sparse (no minimum count to display a city)                                                                                           |

### §19.9 · States

|state          |spec                                       |
|---------------|-------------------------------------------|
|default        |as specified                               |
|hover (desktop)|`translateY(-2px)` 200ms `var(--ease-snap)`|
|press          |`scale(0.97)` 100ms `var(--ease-thud)`     |
|focus-visible  |2px brand-orange outline, 2px offset       |

-----

## §20 · B2B promo card

Single full-width card on consumer homepage encouraging salon owners to join.

### §20.1 · Position

In homepage flow: after city tiles, before SEO link wall + footer.

Shown on:

- `/` (root homepage)
- `/[city]` (every city homepage — same card, same copy)

Not shown on:

- `/[city]/[category]` (category pages — too deep into consumer flow)
- `/salon/[slug]` (salon detail)
- `/entdecken`, `/staedte`, `/search`, `/business*`
- any logged-in salon-side pages (when v2 adds them)

### §20.2 · Visibility

|condition                         |shown?                                         |
|----------------------------------|-----------------------------------------------|
|user has not dismissed            |yes                                            |
|user dismissed within last 30 days|hidden                                         |
|logged-in salon owner             |DEFER TO V2 — for v1, always shown to all users|

Dismiss persistence: cookie `solen_b2b_dismissed_until=<timestamp>`. On render, check timestamp; if `Date.now() < timestamp`, hide card. Timestamp = `Date.now() + 30 * 24 * 3600 * 1000` (30 days from dismiss action).

### §20.3 · Visual style — peach gradient

|element                 |spec                                                                                                 |
|------------------------|-----------------------------------------------------------------------------------------------------|
|bg                      |`linear-gradient(160deg, #FFE4D2 0%, #FBC9A8 100%)`                                                  |
|border                  |1px `rgba(232,116,42,.12)`                                                                           |
|radius                  |`var(--radius-3xl)` (20px)                                                                           |
|padding                 |`22px 24px`                                                                                          |
|shadow                  |`inset 0 1px 0 rgba(255,255,255,.6), 0 1px 2px rgba(232,116,42,.1), 0 16px 32px rgba(232,116,42,.18)`|
|margin (page horizontal)|matches page padding                                                                                 |

### §20.4 · Decorative blobs

Two blurred decorative blobs for warmth (per §5d emphasis pattern):

|blob                |spec                                                                                                           |
|--------------------|---------------------------------------------------------------------------------------------------------------|
|blob 1 (top-right)  |220px circle, bg `rgba(232,116,42,.5)`, filter `blur(40px)`, position `top: -60px; right: -60px;`, z-index 0   |
|blob 2 (bottom-left)|220px circle, bg `rgba(255,255,255,.5)`, filter `blur(40px)`, position `bottom: -80px; left: -40px;`, z-index 0|

### §20.5 · Content (z-index 2 above blobs)

```
FÜR SALONS                                              [×]
Solen für dein Studio.
Mehr Termine, weniger Anrufe.

Beauty + Wellness Buchungen direkt online.
Du behältst deinen Kalender, wir bringen dir die Kund:innen.

[Mehr erfahren →]    Schon Partner?
```

|element             |spec                                                                                                                                                                                   |
|--------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|eyebrow `FÜR SALONS`|Inter Tight 700 9px, brand-orange `#8A3C0F`, letter-spacing 0.22em, uppercase, margin-bottom 8px                                                                                       |
|heading             |`Solen für dein Studio.` (line 1), `Mehr Termine, weniger Anrufe.` (line 2) — Bricolage 700 24px, `-0.025em`, line-height 1.05, ink-1 `#1A1209`, margin-bottom 4px                     |
|sub-text            |`Beauty + Wellness Buchungen direkt online. Du behältst deinen Kalender, wir bringen dir die Kund:innen.` — Inter Tight 400 13px, line-height 1.45, ink-2 `#56463E`, margin-bottom 16px|
|primary CTA         |`Mehr erfahren →` (button)                                                                                                                                                             |
|secondary link      |`Schon Partner?` (text link)                                                                                                                                                           |

### §20.6 · Primary CTA

|element   |spec                                                                                                       |
|----------|-----------------------------------------------------------------------------------------------------------|
|copy      |`Mehr erfahren →` (Lucide `arrow-right` 12px after text, 6px gap)                                          |
|bg        |ink-1 `#1A1209` (NOT brand-orange — contrast against peach)                                                |
|color     |white                                                                                                      |
|typography|Inter Tight 700 13px                                                                                       |
|radius    |`var(--radius-pill)` (99px)                                                                                |
|padding   |`11px 18px`                                                                                                |
|shadow    |`inset 0 1px 0 rgba(255,255,255,.18), 0 1px 2px rgba(0,0,0,.1)`                                            |
|hover     |`translateY(-1px)` + magnetic arrow flourish (gap 6→10px, arrow `translateX(2px)`) 200ms `var(--ease-snap)`|
|tap       |`/business`                                                                                                |

### §20.7 · Secondary link

|element    |spec                                                     |
|-----------|---------------------------------------------------------|
|copy       |`Schon Partner?`                                         |
|typography |Inter Tight 500 12px ink-2 `#8A3C0F`                     |
|decoration |`text-decoration: underline; text-underline-offset: 3px;`|
|margin-left|14px (inline w CTA, on same row)                         |
|tap        |`/business/login`                                        |

### §20.8 · Dismiss X

|element   |spec                                                                               |
|----------|-----------------------------------------------------------------------------------|
|position  |`top: 12px; right: 12px;` (z-index 3)                                              |
|size      |24px hit, 14px Lucide `x` icon, stroke-width 2.5                                   |
|color     |ink-2 `#56463E`                                                                    |
|bg        |transparent                                                                        |
|hover bg  |`rgba(26,18,9,.06)` 150ms                                                          |
|radius    |`var(--radius-pill)` (99px)                                                        |
|aria-label|`Schliessen`                                                                       |
|tap       |sets cookie `solen_b2b_dismissed_until=Date.now() + 30*86400000`, animates card out|

#### Dismiss animation sequence

1. card opacity 1 → 0 over 200ms `var(--ease-snap)`
1. card scale 1 → 0.95 simultaneously
1. card height max-height 1000px → 0px over additional 200ms `var(--ease-snap)` (collapses smoothly so footer rises up, no jump)
1. margin/padding collapses w max-height
1. element removed from DOM after 400ms total

Use `overflow: hidden` on the wrapper during animation to clip content cleanly.

-----

## §21 · Footer

Dark register. Sprout glyph lives here (footer-only). 4-column link grid.

### §21.1 · Container

|element             |spec                                               |
|--------------------|---------------------------------------------------|
|bg                  |`linear-gradient(180deg, #1A1209 0%, #0F0805 100%)`|
|color (default text)|`rgba(255,255,255,.78)`                            |
|padding (mobile)    |`36px 16px 20px`                                   |
|padding (tablet+)   |`48px 32px 24px`                                   |

### §21.2 · Decorative glow

Radial brand-orange glow in top-right, anchors warm tone:

|element       |spec                                                            |
|--------------|----------------------------------------------------------------|
|position      |`top: -100px; right: -100px;`                                   |
|size          |320px × 320px                                                   |
|bg            |`radial-gradient(circle, rgba(232,116,42,.18), transparent 70%)`|
|filter        |`blur(40px)`                                                    |
|z-index       |0 (behind content)                                              |
|pointer-events|none                                                            |

### §21.3 · Brand block (top of footer, before columns)

```
[🌱] solen
Die Schweizer Salon-Plattform.
Buche Beauty + Wellness in Basel, Zürich, Bern.

[ DE ] [EN] [FR] [IT]
```

|element                  |spec                                                                                                                                                |
|-------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------|
|sprout                   |28px, brand-orange `#E8742A`, stroke-width 1.8px, fill none, round caps + joins. SVG paths: stem (vertical line) + 2 sprouting leaves on either side|
|wordmark                 |Bricolage 700 22px white, `-0.03em`                                                                                                                 |
|brand row gap            |10px between sprout and wordmark                                                                                                                    |
|tagline                  |Inter Tight 400 12px `rgba(255,255,255,.6)`, line-height 1.5, max-width 280px                                                                       |
|tagline copy             |`Die Schweizer Salon-Plattform. Buche Beauty + Wellness in Basel, Zürich, Bern.`                                                                    |
|brand block margin-bottom|28px                                                                                                                                                |

### §21.4 · Language switcher

|element                |spec                                                                              |
|-----------------------|----------------------------------------------------------------------------------|
|layout                 |inline pill row, 4 buttons: `DE` `EN` `FR` `IT`                                   |
|container bg           |`rgba(255,255,255,.05)`                                                           |
|container border       |1px `rgba(255,255,255,.08)`                                                       |
|container padding      |4px                                                                               |
|container radius       |`var(--radius-pill)` (99px)                                                       |
|margin-top from tagline|14px                                                                              |
|button typography      |Inter Tight 600 11px, letter-spacing 0.02em                                       |
|button padding         |`5px 11px`                                                                        |
|button radius          |`var(--radius-pill)`                                                              |
|inactive button        |bg transparent, color `rgba(255,255,255,.55)`                                     |
|active button          |bg `rgba(255,255,255,.95)` (white), color ink-1 `#1A1209`                         |
|transition             |bg + color 150ms `var(--ease-snap)`                                               |
|aria-label per button  |`Sprache: Deutsch` / `Language: English` / `Langue: Français` / `Lingua: Italiano`|
|aria-pressed           |`true` on active button, `false` on others                                        |

#### Language routing

Use Next.js i18n routing w URL-prefixed locales (NOT query strings, NOT cookie-only).

|current URL                            |tap `EN` →                           |
|---------------------------------------|-------------------------------------|
|`/`                                    |`/en`                                |
|`/basel`                               |`/en/basel`                          |
|`/basel/coiffeur`                      |`/en/basel/coiffeur`                 |
|`/de/basel/coiffeur` (already prefixed)|`/en/basel/coiffeur` (replace prefix)|
|`/entdecken`                           |`/en/entdecken`                      |
|`/salon/cremant`                       |`/en/salon/cremant`                  |

Default locale is `de` and is NOT URL-prefixed (`/basel` instead of `/de/basel`) — German speakers shouldn’t see `/de/` clutter. EN/FR/IT all get prefix.

Cookie `solen_locale` updated on every switch — used as fallback for cold visits when geo can’t determine.

DO NOT: dropdown style. DO NOT: flag icons. DO NOT: written language names (“Deutsch”, “English”) — abbreviations only.

### §21.5 · 4-column link grid

|column     |links                                                                |
|-----------|---------------------------------------------------------------------|
|Solen      |Über uns · Karriere · Press · Kontakt · Blog                         |
|Entdecken  |Alle Salons · Coiffeur · Barber · Nails · Spa & Wellness · Heute frei|
|Für Salons |Werde Partner · Pricing · Salon-Login · Hilfe für Salons             |
|Rechtliches|AGB · Datenschutz · Impressum · Cookies                              |

#### Column layout

|breakpoint         |columns                                                                    |
|-------------------|---------------------------------------------------------------------------|
|desktop (≥ 1024px) |4 equal cols, 32px gap                                                     |
|tablet (768-1023px)|4 equal cols, 24px gap                                                     |
|mobile (380-767px) |2 col grid, 28px row gap × 24px col gap, brand block stays full width above|
|tiny (< 380px)     |1 col, all stacked                                                         |

#### Column header

|element      |spec                                |
|-------------|------------------------------------|
|typography   |Bricolage 700 12px white, `-0.005em`|
|margin-bottom|10px                                |

#### Column link

|element    |spec                  |
|-----------|----------------------|
|display    |block                 |
|typography |Inter Tight 400 12px  |
|color      |`rgba(255,255,255,.6)`|
|color hover|`#fff`                |
|padding    |4px 0                 |
|line-height|1.5                   |
|transition |color 150ms           |

### §21.6 · Bottom strip

```
© 2026 Solen GmbH                            🇨🇭 Made in Basel
```

|element      |spec                                                                                                                            |
|-------------|--------------------------------------------------------------------------------------------------------------------------------|
|margin-top   |36px                                                                                                                            |
|padding-top  |20px                                                                                                                            |
|border-top   |`1px rgba(255,255,255,.08)`                                                                                                     |
|layout       |flex row, justify-between, align-center, flex-wrap, gap 16px                                                                    |
|copyright    |Inter Tight 400 11px `rgba(255,255,255,.45)` — `© 2026 Solen GmbH`                                                              |
|Made in Basel|inline-flex, 6px gap. Swiss flag = filled brand-orange `#E8742A` 11px square. Text Inter Tight 400 11px `rgba(255,255,255,.45)`.|

### §21.7 · NO social media in v1

DO NOT add Instagram / TikTok / LinkedIn / Twitter icons. Add only when accounts exist + are actively maintained.

### §21.8 · Drop nonexistent links

If `Über uns` / `Karriere` / `Press` / `Blog` pages don’t exist yet at v1 launch, drop those line items from the column. Column shrinks naturally. DO NOT link to placeholder / coming-soon pages.

-----

## §22 · Browse-by-city SEO link wall (Salons nach Stadt)

Pure SEO content. Sits between b2b card and footer. Generates unique `/[city]/[category]` URL surface for google.

### §22.1 · Layout

```
Salons nach Stadt
Finde Beauty + Wellness Salons in der ganzen Schweiz —
nach Stadt und Kategorie.

Coiffeur   in Basel · in Zürich · in Bern
Barber     in Basel · in Zürich · in Bern
Nails      in Basel · in Zürich · in Bern
Spa        in Basel · in Zürich · in Bern
Makeup     in Basel · in Zürich · in Bern
Wellness   in Basel · in Zürich · in Bern
```

### §22.2 · Section title

|element      |spec                                               |
|-------------|---------------------------------------------------|
|copy         |`Salons nach Stadt`                                |
|typography   |Bricolage 700 20px ink-1, `-0.025em`, line-height 1|
|margin-bottom|6px                                                |
|tag          |`<h2>` (semantic, for SEO)                         |

### §22.3 · Intro line

|element      |spec                                                                              |
|-------------|----------------------------------------------------------------------------------|
|copy         |`Finde Beauty + Wellness Salons in der ganzen Schweiz — nach Stadt und Kategorie.`|
|typography   |Inter Tight 400 12px, ink-2 `#56463E`, line-height 1.5                            |
|max-width    |540px                                                                             |
|margin-bottom|20px                                                                              |

### §22.4 · Layout style — grouped by category

Each category is a row. City links separated by middle dots within each row.

```
Coiffeur · in Basel · in Zürich · in Bern
```

|element                        |spec                                                                                       |
|-------------------------------|-------------------------------------------------------------------------------------------|
|row layout                     |flex row, flex-wrap, baseline align                                                        |
|row gap (vertical between rows)|10px                                                                                       |
|line-height                    |1.7 (for natural wrapping)                                                                 |
|category name                  |Bricolage 700 13px ink-1, `-0.005em`, margin-right 8px, flex-shrink 0                      |
|city link                      |Inter Tight 400 12px ink-2 `#56463E`, padding `0 8px`, border-right `1px rgba(26,18,9,.12)`|
|last link in row               |no border-right                                                                            |
|`<strong>` tag                 |wraps city name only (NOT “in”), Inter Tight 600 ink-1                                     |
|link hover                     |color → brand-orange `#E8742A`, no underline                                               |
|transition                     |color 150ms                                                                                |

### §22.5 · Categories included v1

In order:

1. Coiffeur
1. Barber
1. Nails
1. Spa
1. Makeup
1. Wellness

(Same 6 categories as homepage feeds.)

### §22.6 · Cities included v1

In order: Basel, Zürich, Bern.

When new cities launch, append to each row in onboard order. When 6+ cities exist, rows may need their own header line + dot-separated cities below — defer that decision until 6+ cities exist.

#### Current-city handling

ALL city links shown regardless of which city user is currently on. Reasoning:

- SEO benefits from rendering all internal links on every page render (Google crawls the wall on every page)
- the user-facing Aktuell badge from §19 is enough current-state indicator above the wall
- removing the user’s current city would lose the page’s link to itself (which Google uses for canonical signaling)

Instead, the link to the current city in this wall should still render but with `aria-current="page"` and an underline style indicating “you’re here.” NOT bolded, NOT colored differently — same visual weight as other links.

### §22.7 · Total link count

6 categories × 3 cities = 18 unique links in v1. Each link’s URL: `/[city-slug]/[category-slug]` (matches §15.5 URL convention).

### §22.8 · Section padding

|breakpoint|padding    |
|----------|-----------|
|mobile    |`36px 16px`|
|tablet+   |`36px 24px`|

### §22.9 · Always visible

DO NOT add expand/collapse. The 18 links are all visible at all breakpoints.

When cities scale to 8+, reconsider — but for v1, always visible is locked.

### §22.10 · DO NOT

- DO NOT use pills/buttons for each link — plain text with separators only
- DO NOT use icons next to category names
- DO NOT add a CTA at the end (“Alle Städte zeigen →”) — already shown
- DO NOT animate hover beyond color change

-----

## §23 · Final v1 homepage flow

Locked component order on `/` (or `/[city]` city homepage):

```
1. [header]                     §12
   solen + Basel ▾ + bell + avatar

2. [hero]                       §13
   counter pill · greeting · stacked search · dynamic chips

3. [Heute frei in Basel →]      §15 + §16 (variant: availability)
4. [Empfohlen für dich →]       §15 + §16 (variant: availability) — logged-in only
5. [Entdecken in Basel →]       §15 + §18

6. [Coiffeur in Basel →]        §15 + §16 (variant: service)
7. [Barber in Basel →]          §15 + §16 (variant: service)
8. [Nails in Basel →]           §15 + §16 (variant: service)
9. [Spa in Basel →]             §15 + §16 (variant: service)
10. [Makeup in Basel →]         §15 + §16 (variant: service)
11. [Wellness in Basel →]       §15 + §16 (variant: service)

12. [Solen in deiner Stadt]     §19
13. [B2B card]                  §20
14. [Salons nach Stadt]         §22
15. [Footer]                    §21
```

### §23.1 · Sections killed for v1 (re-add in v2)

- ❌ “Top bewertet in Basel” (requires `trust` card variant — see §16.8)
- ❌ “Neu auf Solen” (requires `joined` card variant — see §16.8)
- ❌ Category grid on homepage (replaced by per-category horizontal feeds)

### §23.2 · Total scroll depth (mobile estimate)

|section                                  |est. height                                                       |
|-----------------------------------------|------------------------------------------------------------------|
|header                                   |56px (sticky, not counted in scroll)                              |
|hero                                     |~440px                                                            |
|feed sections (×9 horizontal scroll rows)|~340px each = ~3060px                                             |
|city tiles                               |~250px                                                            |
|b2b card                                 |~240px                                                            |
|seo link wall                            |~280px                                                            |
|footer                                   |~440px                                                            |
|**total**                                |**~4710px** (~6.7 viewports on iPhone 14 Pro Max @ 700px viewport)|

Average user scrolls 60-70% per fresha analytics — entire flow optimized for engagement to depth, not depth to engagement.

-----

## §24b · Accessibility baseline

These rules apply globally to every component in §12-§22.

### §24b.1 · Required aria attributes per component type

|component type                                                           |required attrs                                              |
|-------------------------------------------------------------------------|------------------------------------------------------------|
|icon-only buttons (heart, bookmark, bell, dismiss X, lang buttons)       |`aria-label` w descriptive German text                      |
|toggle buttons (heart, bookmark, lang)                                   |`aria-pressed` reflecting state                             |
|disclosure buttons (city pill, avatar, sort dropdowns)                   |`aria-expanded`, `aria-haspopup`                            |
|current-state indicators (Aktuell badge, lang current, current page link)|`aria-current="page"` or `aria-current="true"`              |
|live regions (counter pill, search count CTA)                            |`aria-live="polite"` for non-urgent updates                 |
|modal dialogs (city dropdown, look-detail sheet, search page)            |`role="dialog"`, `aria-modal="true"`, focus trap, Esc closes|
|search inputs                                                            |`role="searchbox"`, `aria-label` w placeholder context      |

### §24b.2 · Focus management

|event                                |behavior                                                                      |
|-------------------------------------|------------------------------------------------------------------------------|
|modal/sheet opens                    |focus moves to first focusable element (close X if no input, else first input)|
|modal/sheet closes                   |focus returns to triggering element                                           |
|keyboard nav in horizontal scroll row|Tab focuses each card; Arrow Left/Right scrolls 1 card-width                  |
|skip-to-main link                    |hidden by default, visible on Tab from page top, jumps to `<main>` content    |

### §24b.3 · Reduced motion

When `prefers-reduced-motion: reduce`:

- pulse animations on dots (badges, counter pill) disabled — show static dot
- shimmer loading skeletons disabled — show static `#E8DFD3` rect
- magnetic arrow flourishes disabled — show static gap
- card press scale disabled
- entdecken video autoplay disabled (per §18.2)

DO disable animation, DO NOT disable functional state changes (color shifts, opacity changes for visibility) — those convey info.

### §24b.4 · Color contrast minimums

All text-on-bg combinations MUST meet WCAG AA:

- normal text (< 18px): contrast ≥ 4.5:1
- large text (≥ 18px or 14px bold): contrast ≥ 3:1

Already-locked safe pairings:

- ink-1 `#1A1209` on cream `#FBF8F3` = 14.8:1 ✓
- ink-2 `#56463E` on cream = 7.5:1 ✓
- ink-3 `#7A6957` on cream = 4.6:1 ✓
- white on ink-1 = 14.8:1 ✓
- brand-orange `#E8742A` on cream = 3.4:1 — large text only ✓
- coralText `#8A3C0F` on cream = 6.2:1 ✓ — use this for small ink-on-cream brand text

DO NOT use brand-orange `#E8742A` for body text on cream — fails AA. Use `#8A3C0F` (coralText) for small brand-colored text.

### §24b.5 · Keyboard support

Every interactive element MUST be reachable + actionable via keyboard:

- Tab navigation order matches visual order
- Enter/Space activates buttons
- Escape closes modals and dismissable overlays
- Arrow keys scroll horizontal scroll rows when row is focused
- Calendar grid (search WANN state): Arrow keys navigate dates, Enter selects

-----

## §24c · Analytics events (PostHog)

Event tracking is required for unit-economics + funnel analysis.

### §24c.1 · Event naming convention

Format: `[surface]_[object]_[action]` — all lowercase snake_case.

Examples: `home_card_viewed`, `search_submitted`, `b2b_dismissed`, `entdecken_look_opened`.

### §24c.2 · Required events for v1 homepage

|event                            |when                                                       |properties                                                         |
|---------------------------------|-----------------------------------------------------------|-------------------------------------------------------------------|
|`home_viewed`                    |homepage renders                                           |`city`, `is_logged_in`, `referrer`                                 |
|`home_counter_pill_viewed`       |counter pill becomes visible                               |`city`, `count`                                                    |
|`home_chip_tapped`               |quick chip tapped                                          |`city`, `chip_key`, `position`                                     |
|`home_search_opened`             |search bar tapped (any row)                                |`city`, `row_focused`                                              |
|`home_card_viewed`               |salon card enters viewport                                 |`salon_id`, `section`, `position`, `variant` (availability/service)|
|`home_card_tapped`               |salon card tapped                                          |`salon_id`, `section`, `position`                                  |
|`home_card_heart_toggled`        |heart tapped on card                                       |`salon_id`, `state` (saved/unsaved), `section`                     |
|`home_section_viewed`            |section header enters viewport                             |`section_key`, `card_count`                                        |
|`home_section_alle_tapped`       |“Alle →” link tapped                                       |`section_key`, `target_url`                                        |
|`home_city_pill_opened`          |city pill in header tapped                                 |`current_city`                                                     |
|`home_city_changed`              |new city selected from dropdown                            |`from_city`, `to_city`                                             |
|`home_city_tile_tapped`          |city tile in “Solen in deiner Stadt” tapped                |`from_city`, `to_city`                                             |
|`home_b2b_viewed`                |b2b card enters viewport                                   |`is_dismissed_history`                                             |
|`home_b2b_dismissed`             |b2b dismiss X tapped                                       |—                                                                  |
|`home_b2b_cta_tapped`            |b2b “Mehr erfahren” tapped                                 |—                                                                  |
|`home_b2b_link_tapped`           |b2b “Schon Partner?” tapped                                |—                                                                  |
|`home_seo_link_tapped`           |SEO link wall link tapped                                  |`category`, `city`                                                 |
|`home_footer_link_tapped`        |footer link tapped                                         |`column`, `link_label`                                             |
|`home_lang_changed`              |language switcher button tapped                            |`from_lang`, `to_lang`                                             |
|`entdecken_look_viewed`          |look card enters viewport (homepage row OR /entdecken page)|`look_id`, `surface` (home/entdecken), `position`                  |
|`entdecken_look_tapped`          |look card tapped (opens detail sheet)                      |`look_id`, `surface`                                               |
|`entdecken_look_heart_toggled`   |look heart toggled                                         |`look_id`, `state`                                                 |
|`entdecken_look_bookmark_toggled`|look bookmark toggled                                      |`look_id`, `state`, `board_id`                                     |
|`entdecken_look_share_tapped`    |share button on detail sheet                               |`look_id`, `share_method`                                          |
|`entdecken_look_book_tapped`     |“Buche diesen Look →” CTA on detail sheet                  |`look_id`, `salon_id`                                              |
|`search_opened`                  |/search page loaded                                        |`entry_point` (hero / chip / direct)                               |
|`search_submitted`               |search CTA tapped                                          |`was`, `wo`, `wann`, `result_count`                                |
|`search_state_changed`           |row focus changes in /search                               |`from_row`, `to_row`                                               |
|`search_suggestion_tapped`       |suggestion in WAS state tapped                             |`query`, `suggestion`, `position`                                  |

### §24c.3 · User properties to set

Set on PostHog `identify()` call:

- `current_city`
- `is_logged_in`
- `signup_date`
- `total_bookings_lifetime`
- `last_active_date`
- `preferred_language`
- `chip_usage_top_3` (computed)
- `is_partner` (b2b user flag)

### §24c.4 · DO NOT track

- exact GPS coordinates (use city + neighborhood only)
- user input typed into search WAS field (only on submit, not keystrokes)
- view durations under 1 second (filter out scroll-fly-bys)
- bot traffic (filter via PostHog server-side rules)

-----

## §25 · Category page — `/[city]/[category]`

The grid page user lands on when tapping any “Alle →” link from a category feed (e.g. tapping `Alle →` on “Coiffeur in Basel” homepage row navigates to `/basel/coiffeur`).

URL format: `/[city]/[category]` per §15.5. Examples: `/basel/coiffeur`, `/zurich/nails`, `/bern/spa`. NO query strings.

### §25.1 · Layout overview

```
┌────────────────────────────────────────────────┐
│  [← back]    [Basel ▾]   [🔔]   [avatar]      │  ← header (sticky per §12)
├────────────────────────────────────────────────┤
│  solen / Basel / Coiffeur                      │  ← breadcrumbs
│                                                │
│  Coiffeur in Basel                             │  ← h1
│  ● 23 Salons · 8 heute frei                    │  ← sub-text w pulse dot
├────────────────────────────────────────────────┤
│  [Alle] [Heute frei] [Sortieren ▾] [Filter]   │  ← filter pills
├────────────────────────────────────────────────┤
│  [salon card] [salon card]                     │  ← grid (2 cols mobile)
│  [salon card] [salon card]                     │
│  [salon card] [salon card]                     │
│  ... infinite scroll, 12 cards per page ...    │
│                                                │
│  Du hast alle 23 Salons gesehen                │  ← end of list
├────────────────────────────────────────────────┤
│  Andere Kategorien in Basel                    │  ← cross-link block 1
│  Barber · Nails · Spa · Makeup · Wellness      │
│                                                │
│  Coiffeur in anderen Städten                   │  ← cross-link block 2
│  Coiffeur in Zürich · Coiffeur in Bern         │
├────────────────────────────────────────────────┤
│  [main footer §21]                             │
└────────────────────────────────────────────────┘
```

### §25.2 · Header

Same standard header from §12 (back arrow + city pill + bell + avatar). City pill reflects URL city per §12.4 precedence rule.

Back arrow target: `history.back()` if previous page is on solen.ch, else `/[city]` homepage as fallback.

### §25.3 · Breadcrumbs

Below header, before h1.

|element               |spec                                                        |
|----------------------|------------------------------------------------------------|
|layout                |flex row, wrap, baseline-aligned, gap 4px                   |
|padding               |`14px 16px 0`                                               |
|typography            |Inter Tight 400 11px                                        |
|non-current item color|ink-2 `#7A6957`                                             |
|current item color    |ink-1 `#1A1209`, font-weight 600                            |
|separator `/`         |ink-1 `.22` opacity, `0 1px` margin                         |
|structure             |`solen / [City] / [Category]`                               |
|`solen` link          |→ `/`                                                       |
|`[City]` link         |→ `/[city]` (e.g. `/basel`)                                 |
|`[Category]`          |not a link — current page (use `<span aria-current="page">`)|
|`<nav aria-label>`    |`breadcrumb`                                                |
|JSON-LD               |`BreadcrumbList` schema in `<head>` (per §25.10)            |

### §25.4 · Page title block

|element                      |spec                                                                                                                                   |
|-----------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
|padding                      |`6px 16px 0`                                                                                                                           |
|h1                           |`[Category] in [City]` (e.g. `Coiffeur in Basel`) — Bricolage Grotesque 700, `clamp(24px, 5vw, 32px)`, `-0.028em`, line-height 1, ink-1|
|sub-text                     |Inter Tight 400 12px, ink-2 `#7A6957`, line-height 1.4                                                                                 |
|sub-text default format      |`[N] Salons · [M] heute frei` (e.g. `23 Salons · 8 heute frei`) — count `<strong>` in ink-1                                            |
|sub-text w filters           |`[N] Salons · gefiltert` (replaces “M heute frei” indicator when filters active)                                                       |
|sub-text w 0 results         |`0 Salons · gefiltert · ` followed by inline link `Filter zurücksetzen` (brand-orange `#8A3C0F` underlined)                            |
|pulse dot                    |5px green `#16A34A` before `[N] Salons`, animates pulse 1.6s infinite (per §5c.7)                                                      |
|pulse dot when filters active|hidden (replaced by no dot — sub-text reflects filtered state instead)                                                                 |

### §25.5 · Filter pills row

|element|spec                                                                                                         |
|-------|-------------------------------------------------------------------------------------------------------------|
|padding|`14px 16px 16px`                                                                                             |
|layout |flex row, gap 6px, horizontal scroll on overflow, scrollbar hidden                                           |
|pill 1 |`Alle` — active by default. Tap → clears all filters, sets default sort.                                     |
|pill 2 |`Heute frei` — quick filter toggle. Tap → toggles `available_today=true`. Active state: ink-1 bg, white text.|
|pill 3 |`Sortieren ▾` — opens sort sheet (§25.6). Active state when not on default sort.                             |
|pill 4 |`Filter` — opens filter sheet (§25.7). When filters active: brand-orange count badge appears (`Filter (3)`). |

#### Pill base styling

|element        |spec                                                                                                                                   |
|---------------|---------------------------------------------------------------------------------------------------------------------------------------|
|typography     |Inter Tight 600 12px                                                                                                                   |
|padding        |`8px 13px`                                                                                                                             |
|radius         |`var(--radius-pill)` (99px)                                                                                                            |
|inactive bg    |`linear-gradient(180deg, #fff, #FDFAF5)`                                                                                               |
|inactive shadow|`inset 0 1px 0 rgba(255,255,255,.85), 0 1px 1px rgba(26,18,9,.04), 0 2px 4px rgba(232,116,42,.06)`                                     |
|active bg      |ink-1 `#1A1209`                                                                                                                        |
|active color   |`#fff`                                                                                                                                 |
|active shadow  |`inset 0 1px 0 rgba(255,255,255,.18), 0 1px 2px rgba(0,0,0,.12)`                                                                       |
|chevron / icon |10px Lucide, ink-2 (inactive) or `rgba(255,255,255,.85)` (active)                                                                      |
|count badge    |inline-flex, min-width 18px, height 18px, padding `0 5px`, bg brand-orange `#E8742A`, color white, JetBrains Mono 10px 700, radius pill|

### §25.6 · Sortieren sheet

Bottom sheet, opened by tapping `Sortieren ▾` pill.

|element     |spec                                                                                                            |
|------------|----------------------------------------------------------------------------------------------------------------|
|presentation|bottom sheet, dimmed backdrop `rgba(0,0,0,.35)`, swipe-down-to-dismiss                                          |
|sheet bg    |cream `#FBF8F3`                                                                                                 |
|sheet radius|`22px 22px 0 0`                                                                                                 |
|sheet shadow|`0 -8px 32px rgba(26,18,9,.18)`                                                                                 |
|handle      |36×4px ink-1 `.18` pill at top center, 8px margin                                                               |
|header      |`Sortieren nach` (Bricolage 700 16px, `-0.02em`), padding `8px 18px 14px`, bottom border `1px rgba(26,18,9,.05)`|
|body padding|`14px 18px`                                                                                                     |
|z-index     |`var(--z-modal)` per §8                                                                                         |

#### Sort options (radio rows)

5 options in order:

1. `Empfohlen` — default. Server’s smart-mix algorithm (relevance score).
1. `Beste Bewertung` — rating descending.
1. `Heute am frühesten frei` — soonest available slot today ascending. Salons with no slot today pushed to end.
1. `Preis · niedrig zuerst` — lowest “ab CHF X” first.
1. `Nähe` — distance from user ascending. Requires geolocation permission. If not granted: option appears greyed out with “Standort aktivieren” hint.

#### Radio row styling

|element                |spec                                                                                                                   |
|-----------------------|-----------------------------------------------------------------------------------------------------------------------|
|layout                 |flex row, align-center, gap 12px, padding `14px 0`, bottom border `1px rgba(26,18,9,.05)` (last has no border)         |
|radio circle           |18×18px, 2px ink-1 `.25` border, radius pill, transparent bg                                                           |
|radio circle (selected)|2px brand-orange border, inner brand-orange dot via `radial-gradient(circle, #E8742A 0%, #E8742A 50%, transparent 50%)`|
|label                  |Inter Tight 400 14px, ink-1. Selected → 600 weight                                                                     |
|tap                    |sets sort, dismisses sheet, refetches grid w new sort                                                                  |

### §25.7 · Filter sheet

Bottom sheet, opened by tapping `Filter` pill.

Same shell as §25.6 (handle, header, dim, swipe-down). Header copy: `Filter`. Top-right of header: `Zurücksetzen` text link (Inter Tight 500 11px, ink-2 underlined, 3px offset).

#### v1 filter categories (3)

##### 1. Verfügbarkeit (pill multi-select)

Options:

- `Heute frei`
- `Sofort frei` (within 30 min)
- `Diese Woche`
- `Wochenende`
- `Abends nach 18:00`

##### 2. Service-Typ (pill multi-select)

For Coiffeur category. Options vary by category in DB.

Coiffeur: `Damen` · `Herren` · `Kinder` · `Schnitt` · `Föhnen` · `Coloration` · `Highlights`
Barber: `Bart` · `Schnitt + Bart` · `Walk-in` · `Termin`
Nails: `Gel` · `Acryl` · `Natur` · `Gel-Nägel` · `French` · `Nail Art`
Spa: `Massage` · `Gesichtsbehandlung` · `Body Wrap` · `Sauna`
Makeup: `Tages-Look` · `Abend-Look` · `Braut` · `Special FX`
Wellness: `Yoga` · `Meditation` · `Akupunktur` · `Energiearbeit`

##### 3. Preisspanne (range slider)

|element           |spec                                                                                                      |
|------------------|----------------------------------------------------------------------------------------------------------|
|range             |CHF 0–500                                                                                                 |
|default           |full range (no filter)                                                                                    |
|visual            |dual-thumb slider, ink-1 `.1` track, brand-orange filled portion                                          |
|thumbs            |16×16px white circles, 2px brand-orange border, soft shadow                                               |
|labels below track|`ab CHF [min]` (left) and `bis CHF [max]` (right) — Inter Tight 400 11px ink-2, value `<strong>` ink-1 600|

#### Pill toggle styling (Verfügbarkeit + Service-Typ)

|element         |spec                                                                                   |
|----------------|---------------------------------------------------------------------------------------|
|layout          |flex wrap, gap 6px                                                                     |
|inactive        |`linear-gradient(180deg, #fff, #FDFAF5)`, 1px ink-1 `.06` border, ink-1 text 500 weight|
|inactive padding|`7px 12px`                                                                             |
|inactive radius |pill                                                                                   |
|active          |bg ink-1, color white, border ink-1, font-weight 600                                   |
|typography      |Inter Tight, 12px                                                                      |
|tap             |toggles state, debounced 200ms recount fires                                           |

#### Section headers within sheet

|element                 |spec                                                                 |
|------------------------|---------------------------------------------------------------------|
|typography              |Bricolage 700 11px, letter-spacing 0.04em, uppercase, ink-2 `#56463E`|
|margin-bottom           |10px                                                                 |
|copy                    |`Verfügbarkeit` / `Service-Typ` / `Preisspanne`                      |
|spacing between sections|18px                                                                 |

#### Sticky bottom CTA

Live-counted “[N] Salons anzeigen” button.

|element                     |spec                                                                                                                                    |
|----------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
|container                   |sticky bottom, `padding: 14px 18px 18px`, bg `rgba(251,248,243,.92)` w `backdrop-filter: blur(12px)`, top border `1px rgba(26,18,9,.05)`|
|button width                |100%                                                                                                                                    |
|button bg (active, ≥1 match)|`linear-gradient(180deg, #F0834D, #E8742A)`                                                                                             |
|button bg (zero matches)    |ink-3 `#7A6957` muted, disabled cursor                                                                                                  |
|button bg (loading)         |active gradient w spinner                                                                                                               |
|button color                |white                                                                                                                                   |
|button typography           |Inter Tight 700 13px                                                                                                                    |
|button padding              |`13px 18px`                                                                                                                             |
|button radius               |pill                                                                                                                                    |
|button shadow               |`inset 0 1px 0 rgba(255,255,255,.18), 0 1px 2px rgba(232,116,42,.18)`                                                                   |
|copy default (no filters)   |`Alle [N] Salons anzeigen`                                                                                                              |
|copy w filters              |`[N] Salons anzeigen →` (live-counted, debounced 200ms after each filter toggle)                                                        |
|copy zero matches           |`Keine Treffer` (button disabled)                                                                                                       |
|copy loading                |`Zähle...` w spinner                                                                                                                    |
|tap                         |applies filters, dismisses sheet, scrolls grid to top, URL params sync                                                                  |

#### Apply / cancel behaviors

|trigger          |behavior                                                                                |
|-----------------|----------------------------------------------------------------------------------------|
|tap CTA          |sheet dismisses, filters apply, grid updates, URL params sync (`?heute=1&service=damen`)|
|swipe down       |sheet dismisses, filters NOT applied (cancels)                                          |
|tap backdrop     |sheet dismisses, filters NOT applied                                                    |
|tap Zurücksetzen |clears all filters in sheet, sheet stays open, count returns to default                 |
|Esc key (desktop)|sheet dismisses, filters NOT applied                                                    |

### §25.8 · Grid

|element                    |spec                                                                                           |
|---------------------------|-----------------------------------------------------------------------------------------------|
|variant                    |salon card `service` variant (per §16.5)                                                       |
|layout                     |CSS Grid                                                                                       |
|columns mobile (<768px)    |2                                                                                              |
|columns tablet (768-1023px)|3                                                                                              |
|columns desktop (≥1024px)  |4                                                                                              |
|gap mobile                 |10px                                                                                           |
|gap tablet                 |14px                                                                                           |
|gap desktop                |16px                                                                                           |
|padding mobile             |`4px 16px 18px`                                                                                |
|padding tablet+            |`4px 24px 24px`                                                                                |
|pagination                 |infinite scroll — load 12 cards initial, fetch next 12 when user scrolls within 400px of bottom|
|skeleton during fetch      |6 cards w left-to-right shimmer, max 2 cycles per skeleton                                     |
|loading-more indicator     |22×22px brand-orange spinner + “Lade weitere Salons…” italic ink-2, shown grid-column 1 / -1   |

#### End of list

When all salons loaded (no more pages):

```
─────────
Du hast alle 23 Salons gesehen
```

|element   |spec                                                        |
|----------|------------------------------------------------------------|
|layout    |grid-column 1 / -1, padding `24px 0 12px`, text-align center|
|typography|Inter Tight 400 11px italic, ink-3 `#7A6957`                |
|separator |32×2px ink-1 `.12` pill above text, 12px margin-bottom      |
|copy      |`Du hast alle [N] Salons gesehen`                           |

### §25.9 · Empty states

#### Zero filter matches

|element                                 |spec                                                                                                                                              |
|----------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------|
|trigger                                 |filters applied, 0 salons match                                                                                                                   |
|illustration                            |88×88px ink `.06` background circle, brand-orange `#E8742A` Lucide `search-x` icon at 38×38px stroke 1.5 inside                                   |
|illustration margin-bottom              |20px                                                                                                                                              |
|title                                   |`Keine Salons mit diesen Filtern` — Bricolage 700 19px, `-0.025em`, ink-1                                                                         |
|title margin-bottom                     |8px                                                                                                                                               |
|body                                    |`Versuch andere Optionen, oder lockere die Suche etwas.` — Inter Tight 400 13px, ink-2, line-height 1.55, max-width 280px                         |
|body margin-bottom                      |24px                                                                                                                                              |
|primary CTA                             |`Filter zurücksetzen` w refresh icon — ink-1 gradient bg, white, pill, 12×20px padding, hover `translateY(-1px)`                                  |
|CTA tap                                 |clears all filters, refetches w default sort                                                                                                      |
|secondary link                          |`Mit gleichen Filtern in Zürich suchen →` (or other city if user is in Zürich) — Inter Tight 400 12px ink-2 underlined 4px offset, margin-top 16px|
|secondary tap                           |navigates to `/[other-city]/[category]` w same filter params preserved                                                                            |
|section padding                         |`48px 28px 36px`                                                                                                                                  |
|sub-text in title block above filter row|`0 Salons · gefiltert · Filter zurücksetzen` (inline reset link, brand-orange)                                                                    |

#### Category not in city (e.g. `/bern/makeup` w 0 makeup salons)

|element       |spec                                                                                                                                                                                           |
|--------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|trigger       |category exists in DB but 0 salons in current city                                                                                                                                             |
|illustration  |88×88px peach-tinted circle, soft Lucide icon (vary by category — `palette` for makeup, `flower` for spa, etc)                                                                                 |
|h1 sub-text   |`Bald verfügbar` (replaces “X Salons · Y heute frei”)                                                                                                                                          |
|title         |`[Category] kommt bald nach [City]` — Bricolage 700 19px                                                                                                                                       |
|body          |`Wir suchen die besten [Category]-Salons der Stadt. Trag dich ein und erfahre als Erste:r, wenn's los geht.` — ink-2 13px                                                                      |
|primary CTA   |`Benachrichtige mich` w bell icon — ink-1 gradient bg                                                                                                                                          |
|CTA tap       |opens email-only signup modal: `Ich benachrichtige dich, wenn [Category] in [City] startet.` + email input + `Anmelden` button. Email saved to `waitlist_signups` table w category + city tags.|
|secondary link|`[Category] in [other-city] oder [other-city] suchen →`                                                                                                                                        |
|secondary tap |navigates to nearest available city w same category                                                                                                                                            |
|filter pills  |hidden (no salons to filter)                                                                                                                                                                   |

#### API error

|element         |spec                                                                                                                      |
|----------------|--------------------------------------------------------------------------------------------------------------------------|
|trigger         |grid fetch fails after 3 retries                                                                                          |
|layout          |inline within grid area (NOT empty-state full block)                                                                      |
|copy            |`Konnte Salons nicht laden — ` + inline link `Erneut laden`                                                               |
|typography      |Inter Tight 400 12px ink-2, link brand-orange underlined                                                                  |
|icon            |small 14px Lucide `wifi-off` ink-2 before text                                                                            |
|tap retry       |refetches                                                                                                                 |
|after 5+ retries|escalate to full empty state w title `Etwas ist schief gelaufen` + Erneut laden CTA + `Hilfe kontaktieren` link to `/help`|

### §25.10 · Sticky scroll behavior

|state                             |spec                                                                                                                                              |
|----------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------|
|top of page (scrollY = 0)         |header sticky per §12 (no shadow). Crumbs + h1 + sub + filter pills all visible naturally.                                                        |
|scrolled past h1 (scrollY ≥ 120px)|filter pills row becomes sticky `position: sticky; top: 48px;`                                                                                    |
|both header + sticky pills        |gain `rgba(251,248,243,.94)` bg w `backdrop-filter: blur(12px) saturate(1.4)` and shadow `0 1px 0 rgba(26,18,9,.04), 0 4px 12px rgba(26,18,9,.04)`|
|transition into sticky            |200ms `var(--ease-snap)` opacity + bg + shadow                                                                                                    |
|z-index header                    |`var(--z-sticky)` (per §8)                                                                                                                        |
|z-index sticky pills              |`var(--z-sticky) - 1` (one below header)                                                                                                          |
|crumbs + h1 + sub                 |scroll naturally w content, NOT sticky                                                                                                            |

### §25.11 · Cross-link footer (SEO link blocks)

Lives between end-of-grid and main footer §21. Pure SEO link surface — google rewards internal link density.

|element             |spec                                               |
|--------------------|---------------------------------------------------|
|container padding   |`36px 18px 32px`                                   |
|container bg        |`linear-gradient(180deg, #FBF8F3 0%, #F5EFE6 100%)`|
|container top border|`1px rgba(26,18,9,.06)`                            |

#### Block 1: Andere Kategorien in [City]

|element         |spec                                                                                                                                                          |
|----------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
|header          |`Andere Kategorien in [City]` — Bricolage 700 15px, `-0.02em`, ink-1, margin-bottom 12px                                                                      |
|links           |flex wrap row, font Inter Tight 400 12px ink-2, line-height 1.7                                                                                               |
|each link       |padding `0 10px`, right border `1px rgba(26,18,9,.14)` (last has no border)                                                                                   |
|link strong     |category name in ink-1 600 weight                                                                                                                             |
|link hover      |brand-orange `#E8742A`, no underline                                                                                                                          |
|transition      |color 150ms                                                                                                                                                   |
|URL per link    |`/[city]/[other-category]`                                                                                                                                    |
|categories shown|all 5 other v1 categories (excluding current). Order: Barber · Nails · Spa · Makeup · Wellness (if current is Coiffeur). Auto-scales as new categories launch.|

#### Block 2: [Category] in anderen Städten

|element                |spec                                                                                                              |
|-----------------------|------------------------------------------------------------------------------------------------------------------|
|header                 |`[Category] in anderen Städten`                                                                                   |
|spacing from block 1   |28px margin-top                                                                                                   |
|same styling as block 1|yes                                                                                                               |
|each link              |format `[Category] in [City]` (e.g. `Coiffeur in Zürich`). City name in `<strong>` ink-1 600.                     |
|URL per link           |`/[other-city]/[category]`                                                                                        |
|cities shown           |all v1 cities excluding current. Order alphabetical or by supply (descending). Auto-scales when new cities launch.|

### §25.12 · Meta + SEO `<head>`

All values dynamically generated server-side from city + category data.

|tag                               |format                                                                                                                             |example for /basel/coiffeur                                                                               |
|----------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
|`<title>`                         |`[Category] Salons in [City] buchen — Solen` (60 char max)                                                                         |`Coiffeur Salons in Basel buchen — Solen`                                                                 |
|`<meta name="description">`       |`Buche [Category] Termine in [City] online — [N] Salons, ab CHF [min]. Heute frei: [M]. Ohne Anrufen, ohne Stress.` (155-160 chars)|`Buche Coiffeur Termine in Basel online — 23 Salons, ab CHF 65. Heute frei: 8. Ohne Anrufen, ohne Stress.`|
|`<link rel="canonical">`          |`https://solen.ch/[city]/[category]`                                                                                               |`https://solen.ch/basel/coiffeur`                                                                         |
|`<meta property="og:title">`      |`[Category] in [City] · [N] Salons                                                                                                 |Solen`                                                                                                    |
|`<meta property="og:description">`|`[N] [Category] Salons in [City] auf Solen. [M] heute frei, ab CHF [min]. Online buchen ohne Anrufen.`                             |`23 Coiffeur Salons in Basel auf Solen. 8 heute frei, ab CHF 65. Online buchen ohne Anrufen.`             |
|`<meta property="og:image">`      |`https://solen.ch/og/[city]-[category].jpg` (1200×630, dynamically generated w category color + city name)                         |—                                                                                                         |

#### JSON-LD structured data

`BreadcrumbList`:

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "solen", "item": "https://solen.ch/"},
    {"@type": "ListItem", "position": 2, "name": "Basel", "item": "https://solen.ch/basel"},
    {"@type": "ListItem", "position": 3, "name": "Coiffeur", "item": "https://solen.ch/basel/coiffeur"}
  ]
}
```

`ItemList` of `HairSalon` (or category-appropriate type — `BeautySalon`, `DaySpa`, `NailSalon`):

```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "item": {
        "@type": "HairSalon",
        "name": "Salon Crémant",
        "address": {...},
        "geo": {...},
        "aggregateRating": {"ratingValue": 4.9, "reviewCount": 218},
        "priceRange": "CHF 65 – CHF 180",
        "openingHours": [...],
        "image": "https://..."
      }
    },
    ...
  ]
}
```

#### hreflang alternates

```html
<link rel="alternate" hreflang="de" href="https://solen.ch/basel/coiffeur" />
<link rel="alternate" hreflang="en" href="https://solen.ch/en/basel/coiffeur" />
<link rel="alternate" hreflang="fr" href="https://solen.ch/fr/basel/coiffeur" />
<link rel="alternate" hreflang="it" href="https://solen.ch/it/basel/coiffeur" />
<link rel="alternate" hreflang="x-default" href="https://solen.ch/basel/coiffeur" />
```

DE is default, no URL prefix. EN/FR/IT all get prefix per §21.4 i18n routing.

#### h1 hierarchy

|heading level|content                                             |
|-------------|----------------------------------------------------|
|`<h1>`       |`[Category] in [City]` (visible)                    |
|`<h2>`       |`Andere Kategorien in [City]` (cross-link block 1)  |
|`<h2>`       |`[Category] in anderen Städten` (cross-link block 2)|

DO NOT have other h1s on page. Filter sheet section headers use `<h3>`. Card names use `<h3>` semantically (visually styled smaller).

### §25.13 · URL params (filter persistence)

When filters are applied, sync to URL as query params for shareability + back-button preservation.

|filter                 |param                                                  |
|-----------------------|-------------------------------------------------------|
|Heute frei toggle      |`?heute=1`                                             |
|Verfügbarkeit (multi)  |`?verfuegbar=heute,sofort,wochenende` (comma-separated)|
|Service-Typ (multi)    |`?service=damen,coloration` (comma-separated)          |
|Preisspanne            |`?preis=50-200`                                        |
|Sortieren (non-default)|`?sort=rating` (or `slot`, `price`, `distance`)        |

Combined example: `/basel/coiffeur?heute=1&service=damen&preis=50-150&sort=slot`

|rule                      |spec                                                                                                   |
|--------------------------|-------------------------------------------------------------------------------------------------------|
|URL update                |use Next.js `router.replace()` so filter changes don’t pollute history (back button skips through them)|
|URL parse on load         |parse params on mount, hydrate filter sheet state, fetch filtered grid                                 |
|invalid params            |silently ignored, default values used                                                                  |
|canonical on filtered page|still points to clean `/[city]/[category]` (filtered pages don’t get their own SEO weight)             |

### §25.14 · States summary

|state                 |trigger                                       |response                                                                           |
|----------------------|----------------------------------------------|-----------------------------------------------------------------------------------|
|default               |clean URL, no params                          |`Alle` pill active, grid loads first 12, sub-text “[N] Salons · [M] heute frei”    |
|filtered              |URL has filter params OR user toggled in sheet|`Alle` pill inactive, count badge on Filter pill, sub-text “[N] Salons · gefiltert”|
|sorted                |non-default sort                              |`Sortieren` pill active state, sort name in pill (e.g. `Sortieren: Bewertung ▾`)   |
|zero results          |filtered to 0                                 |empty state §25.9, sub-text “0 Salons · gefiltert · Filter zurücksetzen”           |
|category empty in city|DB has 0 salons of this category in city      |empty state §25.9 second variant, no filter pills, waitlist CTA                    |
|API error             |fetch failed                                  |inline retry + escalate to full empty after 5                                      |
|loading first paint   |navigate from homepage                        |header + crumbs + h1 + sub render server-side; grid shows skeleton cards w shimmer |

### §25.15 · Analytics events (extends §24c)

|event                           |when                            |properties                                                    |
|--------------------------------|--------------------------------|--------------------------------------------------------------|
|`category_page_viewed`          |category page renders           |`city`, `category`, `is_filtered`, `salon_count`              |
|`category_filter_pill_tapped`   |any filter pill in row          |`city`, `category`, `pill` (alle / heute / sortieren / filter)|
|`category_sort_opened`          |Sortieren sheet opens           |`city`, `category`, `current_sort`                            |
|`category_sort_changed`         |sort option selected            |`city`, `category`, `from_sort`, `to_sort`                    |
|`category_filter_opened`        |Filter sheet opens              |`city`, `category`, `current_filters`                         |
|`category_filter_changed`       |filter toggle within sheet      |`city`, `category`, `filter_key`, `filter_value`, `live_count`|
|`category_filter_applied`       |filter sheet CTA tapped         |`city`, `category`, `filters_count`, `result_count`           |
|`category_filter_reset`         |Zurücksetzen tapped             |`city`, `category`, `from_filter_count`                       |
|`category_card_tapped`          |salon card tapped               |`salon_id`, `city`, `category`, `position`, `sort`, `filters` |
|`category_load_more`            |infinite scroll triggered       |`city`, `category`, `page_num`, `total_loaded`                |
|`category_crosslink_tapped`     |link in cross-link footer tapped|`city`, `category`, `target_city`, `target_category`          |
|`category_empty_waitlist_signup`|Benachrichtige mich completed   |`city`, `category`, `email_hash` (hashed, not raw)            |

### §25.16 · DO NOT

- DO NOT pre-load all salons (e.g. for cities with 200+ salons) — infinite scroll only
- DO NOT add 4th filter category for v1 (Bewertung, Distanz, Sprachen all deferred to v2)
- DO NOT show map view in v1 (defer to v2 — `/[city]/[category]?view=map`)
- DO NOT show different sort options based on logged-in vs logged-out (always show all 5)
- DO NOT auto-detect “Heute frei” from time of day — always require explicit user action
- DO NOT save filter selections across sessions — reset on each visit (URL params are session-scoped)
- DO NOT show “Featured” / promoted salons mixed into grid — defer to v2 (no paid ranking in v1)
- DO NOT stretch grid columns beyond max-width 1200px on huge screens — center grid

-----

## Component PR checklist

Before any homepage component PR merges, verify against this checklist:

### Tokens + structure

- [ ] All radii use `var(--radius-*)` tokens (no hardcoded `border-radius: 12px`)
- [ ] All spacing uses `var(--space-*)` tokens (no hardcoded `padding: 16px`)
- [ ] All colors use design tokens (no `#888888`, only ink-1/2/3 + brand)
- [ ] Z-index uses `var(--z-*)` tokens (per §8)
- [ ] If component contains modal/overlay, uses React portal (per §8 stacking context warning)

### Hierarchy (per §5f)

- [ ] Data-dense panels (3+ info points) have **one hero** — no equal-weight stat rows
- [ ] Hero / secondary / tertiary type weights match the §5f surface table (or have an explicit reason to deviate, logged in PR description)
- [ ] Max one "wow moment" chip per panel (badge / PB pill / brand-orange accent number)
- [ ] Metadata compressed into dot-separated single line (`·` separator, 6-8px gap) before adding a new stacked row

### States

- [ ] All states specified: default, hover (desktop), press, focus-visible, disabled, loading
- [ ] Skeleton loading state implemented w left-to-right shimmer (per §5c.5)
- [ ] Empty state behavior specified (hide section vs show copy)
- [ ] Real-time updates (counter pill, availability) refetch on visibility change
- [ ] API error states have inline retry affordance

### Animations

- [ ] Animations include `from`, `to`, `duration`, `cubic-bezier` (per §5c)
- [ ] Touch targets ≥ 44px (per §11)
- [ ] `prefers-reduced-motion` respected (animations disabled where appropriate per §24b.3)

### Copy + i18n

- [ ] DE copy uses du-form (informal “you”)
- [ ] Swiss number format (apostrophe thousands: `2'173` not `2,173`)
- [ ] Plural forms handled (count = 1 vs count ≥ 2 — different verb forms)
- [ ] Long-name + long-text truncation behavior specified
- [ ] All UI strings live in i18n locale files, NOT hardcoded
- [ ] All 4 languages (DE, EN, FR, IT) have translations before launch
- [ ] DO NOT cases enumerated where applicable

### Accessibility (per §24b)

- [ ] Icon-only buttons have `aria-label`
- [ ] Toggle buttons have `aria-pressed`
- [ ] Disclosure buttons have `aria-expanded` + `aria-haspopup`
- [ ] Live regions have `aria-live` (counter pill, search count CTA)
- [ ] Modals have `role="dialog"`, `aria-modal="true"`, focus trap
- [ ] Color contrast meets WCAG AA (per §24b.4)
- [ ] Keyboard navigation works (Tab, Enter, Space, Esc, Arrow keys per §24b.5)
- [ ] Focus management on modal open/close

### Photos + media

- [ ] Salon photo fallback to category-color tile w initials (per §16.7b)
- [ ] Smart-crop position handles landscape/portrait uploads
- [ ] `next/image` used for all photos w responsive `sizes`
- [ ] Entdecken video autoplay respects max-2-simultaneous rule (per §18.2)
- [ ] Data saver mode + reduced motion disable autoplay

### Analytics (per §24c)

- [ ] All required events fire w correct properties
- [ ] User properties updated on `identify()`
- [ ] No PII in event payloads (no exact coords, no keystroke logging)

-----

*End of pasted v2 spec content (compiled from 4 sequential design steps in user's parallel Claude session, locked 2026-05-05). Forms primitives, additional surfaces, and the next wave of locks land via the phased plan in `_tasks/V2_REBUILD_LOG.md` (V2-D## decisions) — never in side docs.*

---

## What's still missing

Tonight's audit (2026-05-05) of this spec found **36+ surface gaps** vs. what v1 needs. The phased plan in `_tasks/V2_REBUILD_LOG.md` and `/Users/sulo/.claude/plans/immutable-shimmying-meerkat.md` closes them in this order:

### Phase 0 — Foundation primitives (blocks every later phase)
- ~~§F.1 Form primitives~~ — **drafted 2026-05-05, awaiting user sign-off + mockup at `public/solen-v2-primitives.html`** then V2-D14 lock
- §F.2 Modal primitive — centered dialog, sizes (sm/md/lg), focus trap, mobile vs desktop variant
- §F.3 Bottom sheet primitive — handle, dim, swipe-down, snap heights, sticky CTA at bottom (mobile-only; desktop falls back to modal)
- §F.4 Toast primitive — success/info/warning/error variants, auto-dismiss timing, action slot, stacking, ARIA live region
- §F.5 Date/time picker primitive — calendar grid, time slot list, range picker variant
- §F.6 Skip-to-main link — visible on `:focus`, hidden otherwise
- §F.7 Font fallback stack + `font-display` strategy (Bricolage / Inter Tight / Instrument Serif / JetBrains Mono)
- §F.8 Cookie consent banner — GDPR baseline (DACH market, non-negotiable)

### Phase 1 — Auth + identity (blocks favorites, bookings, profile)
- §A.1 Login modal (heart-save tap when logged out, save-look when logged out, write-review when logged out)
- §A.2 Login page `/auth/login` (full page when arrived from email link or direct URL)
- §A.3 Signup page `/auth/signup`
- §A.4 Password reset flow `/auth/reset-password` + email
- §A.5 OAuth (Google + Apple) — buttons, callback handling, error states
- §A.6 Guest checkout decision (V2-D09 PENDING — IN or OUT of v1)
- §A.7 Email transactional template baseline (auth emails first)
- §A.8 Auth state visibility — what avatar dropdown does, what heart icons render across logged-in / logged-out / loading

### Phase 2 — Critical funnel surfaces (the money path)
- §SD Salon detail page `/salon/[slug]` — hero photo gallery, sticky tab bar (Services / Über / Bewertungen / Standort), service list w prices, staff section, reviews tab summary + 3 latest, opening hours, sticky bottom booking CTA
- §BW Booking wizard `/book/[slug]` — 3 steps: Service+Staff → Date+Time → Pay+Confirm. Wizard chrome (progress bar, Weiter button, back, step indicator). Per-step layouts. State management. Cancel/exit handling.
- §SR Search results page `/search/results` — distinct from category page (§25): entry from search submit, filters from query, optional map view (V2-D10 PENDING)
- §C Booking confirmation `/book/[slug]/confirmation` — confetti pop (§5c.4), celebration ring per Q57, summary card (Was / Wann / Wo / Wer), 3 utility chips (Kalender / Wegbeschreibung / Teilen), secondary CTA `Zur Buchung →`. NO upsell, NO ReviewPrompt.
- §RV Reviews-write UX — accessed from `/profile/bookings` after a completed booking. Star slider, photo upload, text body, submit + cancel. Inline error states.

### Phase 3 — User account surfaces
- §AC.1 `/favoriten` — saved salons grid. **The heart-with-face empty state lives here** (see `public/heart-illustration-reference.html`).
- §AC.2 `/profile/bookings` — upcoming + past, per-booking actions: view detail, cancel (per cancel policy), rebook, write review.
- §AC.3 `/profile/looks` — saved entdecken looks. Two tabs: `Likes` (flat) + `Boards` (organized — see §18.5).
- §AC.4 `/profile` — main profile page: avatar, name, email, basic info display.
- §AC.5 `/profile/settings` — edit name, email, password, language, notification prefs, delete account (GDPR right-to-erasure).
- §AC.6 `/notifications` — list, mark-as-read, filter by type.
- §AC.7 Avatar dropdown menu (referenced in §12.6, never specified) — items: profile / bookings / favorites / settings / sign out. Mobile vs desktop layout.

### Phase 4 — Content + community
- §CO.1 `/entdecken` full page — masonry feed, filter bar, infinite scroll. Already in §18.3 — confirm complete.
- §CO.2 Look-detail sheet enhancements — share targets (per §18.4 share button), report-content flag.
- §CO.3 `/staedte` — city directory page. Per-city tile w salon count + featured salons + "Coming soon" cities. SEO content per city.
- §CO.4 Per-city homepage variants — `/[city]` reuses the homepage template; confirm anything city-specific needed.
- §CO.5 Report-content flow — abuse / inappropriate flag for reviews + entdecken looks. Modal w reasons + free-text. Submit → moderation queue.
- §CO.6 Mein-Look board management — create board, rename, delete, reorder, share. Modal-driven.

### Phase 5 — System + cross-cutting
- §SY.1 404 page (`/not-found.tsx`) — friendly empty state, search bar, link back to homepage
- §SY.2 500 / error boundary page — apology copy, retry, contact support
- §SY.3 Offline / network-down UX — service worker fallback, "you're offline" inline banners
- §SY.4 PWA manifest + install prompt UX
- §SY.5 Email transactional templates beyond auth — booking confirmation, reminder (24h before), cancellation, salon-side new-booking notification
- §SY.6 Print styles — booking confirmation must print cleanly (`@media print`)
- §SY.7 SEO sitemap.xml — dynamic per route + per locale
- §SY.8 robots.txt + crawl rules
- §SY.9 Cookie consent deeper integration (categories work + analytics consent gating)
- §SY.10 Image upload UX (B2B-side, but spec primitive here for reuse)
- §SY.11 Address autocomplete primitive (Google Places or Mapbox)
- §SY.12 Reduced-motion + reduced-data preferences (extends §24b.3) — full audit of every animation + auto-play
- §SY.13 LCP optimization rules — `priority` on hero photos, preload critical fonts, defer non-critical CSS
- §SY.14 URL canonicalization rules — trailing slash strategy, query param ordering, lowercase, protocol redirects

### Phase 6 — B2B side (parallel-able from Phase 3+)
- §B.1–§B.14 — `/business` landing, B2B login/signup, dashboard shell, KPIs, salon profile editor, service mgmt, calendar/availability, bookings mgmt, reviews mgmt, photo gallery mgmt, notifications, billing/subscription (V2-D12 Stripe Connect PENDING), multi-staff, onboarding wizard.

---

## Pending cross-cutting decisions

- **V2-D09** — Guest checkout IN or OUT of v1 (Phase 1)
- **V2-D10** — Map view on `/search/results` IN or OUT of v1 (Phase 2)
- **V2-D11** — Loyalty / packages / gift cards in v1 (Phase 2 booking wizard scope)
- **V2-D12** — Stripe Connect (marketplace payouts) vs Stripe regular (Phase 6 architecture)

These get resolved when their phase comes up. Default for all four: **OUT of v1, defer to v2.** Override only if a hard reason emerges.

---

*This doc is the principal. Do not split it into multiple files. Do not duplicate its specs in new top-level docs. Add new sections HERE as new surfaces lock (per V2-D06).*
