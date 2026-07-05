# Solen Brand Build — Implementation Plan

> Sequence locked by Grok council 2026-05-21. Source-of-truth spec: `_tasks/SOLEN_BRAND_OVERVIEW.md` (last locked 2026-05-22). Work the steps top-to-bottom; do NOT skip ahead — each step's tokens are referenced by the next.
>
> **Major spec pivot 2026-05-22:** cobalt blue brand + neutral ink + 4 universal semantic jobs (replaces petrol teal + warm ink + 4 semantic families). All token names/values below match the new spec.
>
> Estimated total: 8–12 hours focused work across 6 steps. Each step gets its own commit.

---

## Pre-flight (do once before Step 1)

- [ ] Read `_tasks/SOLEN_BRAND_OVERVIEW.md` end-to-end so you have the full spec in head
- [ ] Decide the name: keep "Solen" (council pick) OR swap to one of [Luno / Koda / Runa / Tava / Vela]. If swapping, ALL files referencing "solen" need updating — do this BEFORE Step 1 since strings appear in tokens/copy.
- [ ] Branch from `claude/vigorous-spence-0e9aa7` (current) — create new branch like `claude/brand-rebuild-2026-05-22` for the clean rebuild
- [ ] Open the spec doc + this plan side-by-side; reference the spec for every hex/value, never invent
- [ ] Reference screenshots in `/Users/sulo/solen/screenshots/` are renamed by step (`01-colors-*` / `02-typography-*` / etc.) — open the matching ones while building each step. **Note:** screenshots from 2026-05-21 reflect the OLD spec (petrol teal + warm yellow); the NEW spec is in `SOLEN_BRAND_OVERVIEW.md`. Spec wins.

---

## ✅ Step 1 — Colors (~2.5 hours — bigger than before)

Lock the foundation. Everything downstream references these tokens. **Major pivot from petrol teal → cobalt blue + neutral ink — touches more files than before.**

### What to change

#### 1.1 — `app/globals.css` — CSS custom properties

Replace the entire `:root` color block with:

```css
:root {
  /* Ink scale — neutral, no warm tint */
  --ink-primary:    #1A1A1A;
  --ink-secondary:  #6B6B6B;
  --ink-muted:      #9CA3AF;
  --border-adaptive: rgba(0, 0, 0, 0.08);

  /* Surfaces — cool neutral, 3 tiers + nav */
  --substrate:      #FAFAFA;
  --sunken:         #F4F4F5;
  --elevated:       #FFFFFF;

  /* Brand — single color, used rarely */
  --brand:          #0040FF;

  /* Universal semantic — 4 jobs only */
  --star:           #1A1A1A;        /* ink, not yellow */
  --heart-active:   #FF3366;
  --available:      #00A86B;
  --available-bg:   rgba(0, 168, 107, 0.10);
  --urgency:        #E5392C;
}
```

#### 1.2 — `app/globals.css` body bg

```css
body {
  background-color: var(--substrate);   /* was: var(--base) → #FFFFFF */
  color: var(--ink-primary);
}
```

#### 1.3 — `tailwind.config.js` — map CSS vars to Tailwind tokens

```js
colors: {
  // Ink
  "ink": {
    primary:   "var(--ink-primary)",
    secondary: "var(--ink-secondary)",
    muted:     "var(--ink-muted)",
  },
  "border-adaptive": "var(--border-adaptive)",

  // Surfaces
  "substrate": "var(--substrate)",
  "sunken":    "var(--sunken)",
  "elevated":  "var(--elevated)",

  // Brand
  "brand":     "var(--brand)",

  // Universal semantic
  "star":         "var(--star)",
  "heart-active": "var(--heart-active)",
  "available":    "var(--available)",
  "available-bg": "var(--available-bg)",
  "urgency":      "var(--urgency)",
},
```

**Important:** DELETE the old V2-D70 tokens (`s-brand`, `s-accent`, `s-coral`, `s-love`, `s-cat-*`, `s-atm-*`, `s-butter`, `s-sage`, all warm ink scales). These are retired.

#### 1.4 — Search + replace OLD references

```bash
# Find all places using OLD V2-D70 token names
grep -rn "s-brand\|s-accent\|s-coral\|s-cat-\|s-love\|s-atm-\|s-butter\|s-sage" \
  app/ components-legacy/ 2>&1 | head -40

# Also old warm hexes that may be hardcoded
grep -rn "#1638C4\|#FFC32B\|#3B7A57\|#D87352\|#1A1209\|#56463E\|#7A6957\|#EFE7DD" \
  app/ components-legacy/ 2>&1 | head -40
```

**Map old → new** (rough guide, verify per file):
- `text-s-ink` / `text-s-ink-2` / `text-s-ink-3` → `text-ink-primary` / `text-ink-secondary` / `text-ink-muted`
- `bg-s-bg-base` (was #FFFFFF) → `bg-elevated` if it's a card/modal, `bg-substrate` if it's a page bg
- `bg-white` on pages → `bg-substrate` (now #FAFAFA, not pure white)
- `bg-white` on cards → `bg-elevated` (stays #FFFFFF, but uses the token)
- `text-s-brand` / `bg-s-brand` → `text-brand` / `bg-brand` (now cobalt blue)
- `text-s-accent` / `bg-s-accent` → DELETE entirely (yellow accent retired; star is now ink)
- `text-s-love-fill` / `bg-s-love-soft` → `text-heart-active` (saved heart) or `text-urgency` (discount badge)
- `bg-s-cat-spa` / `text-s-cat-spa-text` → DELETE (cat-color tints retired in new spec; cards use --elevated white only)

⚠ This sweep will touch a LOT of files. Use the hook escape flag if pre-sweep-check blocks: `touch .claude/sweep-approved.flag`.

### Checks before moving to Step 2

- [ ] `npm run dev` → homepage renders
- [ ] **Page bg is cool grey #FAFAFA, NOT pure white** (this is the substrate change — visible difference)
- [ ] **All CTAs are cobalt blue #0040FF**, NOT royal blue or petrol teal
- [ ] **Logo dot is cobalt blue**, NOT yellow
- [ ] **⭐ ratings are INK BLACK (#1A1A1A), NOT yellow** — biggest perceptual change, verify carefully
- [ ] **♡ saved hearts (filled) are pink #FF3366** — only filled, outline stays ink
- [ ] **"Heute frei" chip is green #00A86B with soft 10% bg**
- [ ] **"−25%" / sale chips are red #E5392C**
- [ ] No yellow appears anywhere
- [ ] No petrol teal appears anywhere
- [ ] No category-color tints on cards (they all sit on --elevated white)
- [ ] All text uses neutral ink scale (no warm browns visible)

### Commit
`feat(brand): step 1 — colors lock (cobalt blue + neutral ink + 4 universal semantic)`

---

## ✅ Step 2 — Typography (~1.5 hours)

Bricolage + Hanken already loaded. Update the scale to match new spec (added 36px price hero + explicit letter-spacing + line-height per size).

### What to change

#### 2.1 — Verify Google Fonts import in `app/globals.css`

```css
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&family=Hanken+Grotesk:wght@400;500;600;700&display=swap');
```

Trim weights to what's actually used (Bricolage 700/800, Hanken 400/500/600/700).

#### 2.2 — `tailwind.config.js` fontSize tokens (new — match spec)

```js
fontSize: {
  // Display — Bricolage
  "hero-d":     ["64px", { lineHeight: "1.0",  letterSpacing: "-0.022em", fontWeight: 700 }],
  "hero-m":     ["48px", { lineHeight: "1.02", letterSpacing: "-0.02em",  fontWeight: 700 }],
  "price-hero": ["36px", { lineHeight: "1.0",  letterSpacing: "-0.02em",  fontWeight: 700 }],
  "h2":         ["32px", { lineHeight: "1.1",  letterSpacing: "-0.018em", fontWeight: 700 }],
  "h3":         ["22px", { lineHeight: "1.2",  letterSpacing: "-0.014em", fontWeight: 700 }],
  // Body — Hanken
  "body":       ["16px", { lineHeight: "1.5", letterSpacing: "0" }],
  "ui":         ["14px", { lineHeight: "1.4", letterSpacing: "0" }],
  "caption":    ["13px", { lineHeight: "1.4", letterSpacing: "0" }],
  "eyebrow":    ["12px", { lineHeight: "1.2", letterSpacing: "0.08em" }],
},
fontFamily: {
  display: ["'Bricolage Grotesque'", "system-ui", "-apple-system", "sans-serif"],
  body:    ["'Hanken Grotesk'", "system-ui", "-apple-system", "sans-serif"],
},
```

#### 2.3 — Tabular-nums on prices

In `app/globals.css`:

```css
.tabular-nums {
  font-feature-settings: "tnum";
  font-variant-numeric: tabular-nums;
}
```

Apply `.tabular-nums` (or Tailwind's `tabular-nums` class) wherever a price is displayed.

#### 2.4 — Hero h1 responsive switch

```jsx
<h1 className="text-hero-m md:text-hero-d font-display">
  Schöner aussehen
</h1>
```

Mobile = 48px, desktop = 64px. Same letter-spacing scale per size.

### Checks before moving to Step 3

- [ ] Hero h1 renders Bricolage 700 at 64/48 (desktop/mobile)
- [ ] Section h2 renders Bricolage 700 at 32px with -0.018em tracking
- [ ] Card h3 renders Bricolage 700 at 22px with -0.014em tracking
- [ ] Body text renders Hanken 400 at 16px, line-height 1.5
- [ ] Prices like "CHF 89" render in tabular-nums + 36px Hanken 700 for hero prices
- [ ] Eyebrow microcopy (12px all caps) has 0.08em tracking
- [ ] No Bricolage usage at < 22px (it's display-only)
- [ ] No Hanken usage at ≥ 22px (it's body-only)

### Commit
`feat(brand): step 2 — typography scale + tabular nums + 36px price hero`

---

## ✅ Step 3 — Spacing + Radii (~1.5 hours, combined)

Lock both together — they're interdependent per Grok ("can't finalize radii without spacing").

### What to change

#### 3.1 — `app/globals.css` spacing tokens

```css
:root {
  --space-4:   4px;
  --space-8:   8px;
  --space-12: 12px;
  --space-16: 16px;
  --space-20: 20px;
  --space-24: 24px;
  --space-32: 32px;
  --space-48: 48px;
  --space-64: 64px;
  --space-96: 96px;
}
```

Tailwind's default `p-1` (4px) through `p-24` (96px) cover this — the CSS vars are for explicit-token references.

#### 3.2 — `app/globals.css` radii tokens (new naming)

```css
:root {
  --radius-xs:   10px;
  --radius-sm:   14px;
  --radius-md:   18px;
  --radius-lg:   24px;
  --radius-pill: 9999px;
}
```

#### 3.3 — `tailwind.config.js` borderRadius mapping

```js
borderRadius: {
  "xs":   "var(--radius-xs)",
  "sm":   "var(--radius-sm)",
  "md":   "var(--radius-md)",
  "lg":   "var(--radius-lg)",
  "pill": "var(--radius-pill)",
},
```

**Important:** DELETE old radius tokens (`card`, `card-lg`, `panel`, `search`, `btn`, `input`, `sheet`). Replace with size-based names.

#### 3.4 — Apply the nesting rule

When a card has `rounded-md` (18px) and `p-2` (8px) padding, inner photo gets `rounded-xs` (10px = 18 − 8). Walk through SalonCard + Modal + Sheet to fix any non-concentric corners.

#### 3.5 — Section vertical rhythm

- Tight cadence (most sections): `py-16` to `py-24` (16–24px equivalent — Tailwind py-4 to py-6)
- Hero breathing: `py-48` to `py-96` (Tailwind py-12 to py-24)

### Checks before moving to Step 4

- [ ] All CTAs render at `rounded-pill` (999px)
- [ ] All cards render at `rounded-md` (18px) — not the old 14 or 16px
- [ ] Inner photos in cards use `rounded-xs` (10px) per nesting rule
- [ ] Hero sections have generous py-12 to py-24 vertical breathing
- [ ] Feed sections have tight py-4 to py-6 between elements
- [ ] No `rounded-lg/xl/2xl` Tailwind defaults sneaking in
- [ ] Old token names (`rounded-card`, `rounded-btn`) no longer in codebase

### Commit
`feat(brand): step 3 — spacing ladder + 5-tier radii + nesting rule`

---

## ✅ Step 4 — Motion (~1 hour)

Depends on radii (travel distance) + spacing (perceived weight). Adds press-state pattern.

### What to change

#### 4.1 — `app/globals.css` motion tokens

```css
:root {
  --ease-glide:      cubic-bezier(0.4, 0.0, 0.2, 1);
  --ease-out-strong: cubic-bezier(0.2, 0.8, 0.2, 1);
  --ease-drawer:     cubic-bezier(0.32, 0.72, 0, 1);
  --ease-bounce:     cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

#### 4.2 — `tailwind.config.js` transitionTimingFunction tokens

```js
transitionTimingFunction: {
  "glide":      "var(--ease-glide)",
  "out-strong": "var(--ease-out-strong)",
  "drawer":     "var(--ease-drawer)",
  "bounce":     "var(--ease-bounce)",
},
```

#### 4.3 — Universal press-state class

In `app/globals.css`:

```css
.press {
  transition: transform 200ms var(--ease-out-strong);
}
.press:active {
  transform: scale(0.97);
}
```

Apply `.press` (or matching Tailwind utility) to every interactive button/card/chip.

#### 4.4 — Standard durations per use case

| Easing | Duration | Use |
|---|---|---|
| `ease-glide` | 200ms | Default UI motion (cards, hover, dropdowns) |
| `ease-out-strong` | 200ms | Large transforms, scroll snaps, press-state |
| `ease-drawer` | 300ms | Sheets, modals, drawers |
| `ease-bounce` | 350ms | Heart pop, success spring |

### Checks before moving to Step 5

- [ ] Hover on a salon card uses ease-glide
- [ ] Sheet opens with ease-drawer 300ms
- [ ] Heart click bounces with ease-bounce
- [ ] All interactives press to scale(0.97) on `:active`
- [ ] No `transition-all` anywhere (forbidden — explicit properties only)
- [ ] No 500ms+ durations on UI

### Commit
`feat(brand): step 4 — motion tokens (4 easings + press-state)`

---

## ✅ Step 5 — Components (~3 hours)

Built on top of stable color/type/spacing/motion tokens. Most components already exist — this is an AUDIT + UPDATE pass against the new tokens, not a from-scratch rebuild.

### Components to audit + update

#### 5.1 — Header
- Logo: "solen" Bricolage 800 + cobalt-blue `--brand` dot (was yellow)
- Hamburger top-right on mobile
- Sticky position, transparent over hero, switches to `--nav-scrolled` after scroll (white + border-bottom)

#### 5.2 — SearchBar (Airbnb pill)
- 3 fields: Service / Stadt / Zeit
- Submit: cobalt-blue pill on the right (was dark teal)
- Pill radius `--radius-pill`
- Card bg `--elevated`, sits on `--substrate` page bg

#### 5.3 — SalonCard
- Card bg `--elevated` (no cat-color tints anymore)
- Card radius `--radius-md` (18px)
- Inner photo radius `--radius-xs` (10px) per nesting rule
- Heart top-right: outline = `--ink-primary`, filled = `--heart-active` #FF3366
- 3 text rows: title (Bricolage 22px h3) · address (Hanken 13px ink-secondary) · time · price (Hanken 16px tnum) · ⭐ (ink — NOT yellow)

#### 5.4 — HeartButton
- Outline state: `--ink-primary`
- Active/saved state: filled `--heart-active` #FF3366 with bounce
- Press to scale(0.97)

#### 5.5 — Button primitives
| Tone | Bg | Text | Hover | Notes |
|---|---|---|---|---|
| **Primary** | `--brand` (cobalt) | white | brightness up | Pill radius, `--shadow-cta` glow |
| **Secondary** | `--elevated` + 1px border-adaptive | `--ink-primary` | border darkens |  |
| **Ghost** | transparent | `--ink-primary` | text → `--brand` |  |
| **Urgency** | `--urgency` (red) | white | brightness up | Sale CTA only |

All buttons get `.press` class.

#### 5.6 — Form inputs
- Default: 1px `--border-adaptive`, ink-primary text, 16px Hanken
- Focus: 2px `--brand` ring + 2px white offset
- Error: 1px `--urgency` border + helper text
- Disabled: bg `--sunken`, text `--ink-muted`
- Plus toggle switch (cobalt track when on)

#### 5.7 — Chips
| Type | Bg | Text | Use |
|---|---|---|---|
| Available | `--available-bg` (#00A86B 10%) | `--available` | "Heute frei" |
| Urgency | rgba(229,57,44,.10) | `--urgency` | "−25%", "Letzte Slots" |
| Neutral (curation) | `--ink-primary` | white | "Solen Favorit", "Top bewertet" |
| Subtle | `--elevated` + border | `--ink-primary` | Inactive filter pill |

(Note: old terracotta + dusty slate + mint chip families removed.)

#### 5.8 — Footer
- Bg `--ink-primary` #1A1A1A (was deep teal)
- White text, links underline on hover
- "© 2026 Solen.ch · Datenschutz · AGB · Impressum"

### Checks before moving to Step 6

- [ ] All 8 components above render correctly per spec
- [ ] No legacy royal-blue / petrol-teal / yellow / cat-color showing in any component
- [ ] Take a Playwright screenshot of homepage at mobile + desktop
- [ ] Run `gemini-visual-check` on the screenshot vs the spec doc

### Commit
`feat(brand): step 5 — components updated to new token system`

---

## ✅ Step 6 — Voice & Microcopy (~1 hour)

Parallel-able after Step 3, but finalize AFTER Step 5 so component truncation/rhythm is real.

### What to change

#### 6.1 — `messages/de.json` voice rules
- **Du-form** (informal "du", never "Sie")
- Two clauses max per sentence
- No marketing fluff
- No exclamation marks except greetings with 👋

#### 6.2 — Brand pillars (4 — apply where relevant)
1. **30 Sekunden buchen** — speed
2. **Ohne Anrufen** — no phone calls
3. **Sofortige Bestätigung** — instant confirmation
4. **Faire Preise** — fair prices

#### 6.3 — Locked microcopy

| Context | Copy |
|---|---|
| User greeting | `Hallo, {firstName} 👋` |
| Save prompt | `Speichere deine Lieblings-Salons. Melde dich an oder erstelle ein Konto.` |
| Recommendation hint | `Tipps, neue Salons, monatlich.` |
| Email validation | `Wir senden eine Bestätigung an diese Adresse.` |
| Unknown city error | `Diese Stadt finden wir nicht.` |
| Disabled phone field | `Nicht bearbeitbar — von Konto übernommen.` |
| Card meta line | `{day} {time} · CHF {price} · ⭐ {rating}` |
| Address format | `{salon} · {street} · {city}` |
| Footer | `© 2026 Solen.ch · Datenschutz · AGB · Impressum` |

### Checks before considering brand build COMPLETE

- [ ] All German copy is Du-form, no Sie
- [ ] Brand pillars appear at least once on homepage
- [ ] No exclamation marks outside greetings
- [ ] No marketing fluff phrases
- [ ] Walk through homepage + salon detail + booking flow + auth flow
- [ ] Run `gemini-visual-check` one final time on the whole flow

### Commit
`feat(brand): step 6 — voice + microcopy pass`

---

## Final consolidation (after all 6 steps)

- [ ] Squash-merge the 6 step commits into one big "Solen brand v1.0" commit
- [ ] Update `CLAUDE.md` brand section to point at `_tasks/SOLEN_BRAND_OVERVIEW.md`
- [ ] Update `_tasks/V2_REBUILD_LOG.md` with `V3-D95: brand rebuild — cobalt blue + neutral ink + universal semantic` entry
- [ ] Take final Playwright screenshots at mobile + desktop, save to `_audits/2026-05-22-brand-final/`
- [ ] Tag the commit `brand-v1.0` for future reference

---

## What to do if you get stuck

- Stuck on token name: check `_tasks/SOLEN_BRAND_OVERVIEW.md` first — it's the spec
- Stuck on visual call: ask Gemini (`python3 ~/.claude/skills/gemini-visual-check/scripts/check.py --image <screenshot> --reference <ref> --context "what you're matching"`)
- Stuck on multi-step decision: run the council (`python3 ~/.claude/skills/llm-council/scripts/query_llms.py "your question"`)
- Stuck on a specific component: open the screenshot from `/Users/sulo/solen/screenshots/05-components-*.png` — those ARE the spec for components (but remember 2026-05-21 screenshots reflect the OLD token values; the NEW values are in the spec doc)

---

## Step status tracker

- [ ] **Step 0** — Pre-flight (name decision + branch)
- [ ] **Step 1** — Colors (BIG pivot to cobalt + neutral ink)
- [ ] **Step 2** — Typography (scale refined + 36px price hero added)
- [ ] **Step 3** — Spacing + Radii (combined, new naming + nesting rule)
- [ ] **Step 4** — Motion (press-state added)
- [ ] **Step 5** — Components (audit + retokenize)
- [ ] **Step 6** — Voice + Microcopy
- [ ] **Final** — Consolidate + log + tag
