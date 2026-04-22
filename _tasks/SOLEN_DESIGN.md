# Solen Design System — Source of Truth

> **Status:** ACTIVE · **Last revised:** 2026-04-20 · **Preview:** `public/solen-coral.html` → `http://localhost:3000/solen-coral.html`

This is the **single** design doc for Solen. Ignore any other design file in this repo — if it contradicts this doc, this doc wins.

---

## 0. THE BRAND IN ONE SENTENCE

Solen is the **Swiss beauty marketplace for Basel** — warm, neighborhood-local, editorial. An app you use daily that feels like a Swiss independent magazine printed your haircut. Never corporate, never salesy, never cold grey.

**Voice examples:** "Von Basel. Für Basel." · "Beauty. Basel." · "Dein Salon. Basel bucht." · "Coiffeur, Barber, Nails & Spa — buche jetzt in deinem Quartier."

---

## 1. PALETTE (LOCKED)

Warm, confident, never cool. Built around **cream** base + **terracotta coral** accent + **warm ink** text.

### Core

```css
--bg:       #FFFFFF;   /* WHITE page base (Q15 2026-04-22) */
--sur:      #F5F0E8;   /* warm surface — recessed states, NOT page bg */
--raised:   #FFFFFF;   /* card surface */
--sun:      #EDE5D8;   /* warm recessed (inputs, keep for card depth) */

--ink:      #1A1209;   /* primary text — warm ink, never #000 */
--ink2:     #4A3D2E;   /* secondary text */
--ink3:     #8A7A66;   /* tertiary / meta */
--ink4:     #C4B8A6;   /* placeholder / disabled */
```

### Brand

```css
--coral:    #E8624A;   /* PRIMARY brand · CTAs · accents */
--coral-h:  #CC4E35;   /* hover */
--coral-s:  #FAECE7;   /* subtle bg */
--coral-t:  #7A2415;   /* WCAG-safe small text on cream */
```

### Extended family (use purposefully, not randomly)

```css
--amber:    #D4870A;  /* secondary CTA, eyebrow labels, coiffeur tint */
--amber-s:  #FEF4E0;  --amber-t: #6B4005;

--blue:     #6BA3C8;  /* Basel blue, map pins, farbe tag */
--blue-s:   #EAF3FB;  --blue-t: #1A4D72;

--plum:     #4A1E3C;  /* depth blocks (Last Minute section bg) */

--sage:     #7BA688;  /* spa/wellness, massage */
--sage-s:   #EBF5EE;  --sage-t: #2E5E3A;

--yellow:   #F2C144;  /* "Solen Top Pick" badges, highlight numerals */
--yellow-s: #FEF8E0;  --yellow-t: #7A5C00;

--sand:     #C9A96E;  /* warm surfaces, makeup tint */
```

### Borders

```css
--b:  rgba(26,18,9,.08);   /* hairline */
--b2: rgba(26,18,9,.15);   /* stronger */
--b3: rgba(26,18,9,.28);   /* outline buttons */
```

### BANNED

- ❌ Pure black `#000000` — use `--ink` (`#1A1209`)
- ❌ Cool greys, bluish greys — use warm ink opacity
- ❌ Fluorescent / saturated primaries outside this palette
- ❌ Green+peach (old V2 attempt) — retired
- ❌ Any hex value not declared here

### 60-30-10 rule
- 60% cream/ink base (`--bg` + `--ink`)
- 30% white/surface cards (`--raised` + `--sur`)
- 10% coral + extended family accents

---

## 2. TYPOGRAPHY (LOCKED)

Three families, strict hierarchy. Loaded from Google Fonts.

```css
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,800;1,9..144,500&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,400&display=swap');

--font-display: "Bebas Neue", sans-serif;     /* declarative, editorial */
--font-heading: "Fraunces", Georgia, serif;   /* section titles, card headings — expressive serif */
--font-body:    "DM Sans", sans-serif;        /* all body, buttons, meta */
```

### When to use which

| Font | Use for | Rules |
|------|---------|-------|
| **Bebas Neue** | Hero headline, footer wordmark, section numbers, category tile labels, Instagram tile copy, Last-Minute discount percentage | **ALWAYS UPPERCASE.** Line-height `0.87–0.92`. Size ≥36px. |
| **Fraunces** | Section titles (`sec-h`), card names (`card-name`), button text, eyebrow labels, col headings | Weight 600–800 for titles, 700 for buttons/eyebrows. Uses variable optical sizing (`font-variation-settings: "opsz" 48, "SOFT" 50`). Letter-spacing `-0.01em` on titles (less tight than Fraunces — Fraunces already has presence). `+0.04em` uppercase on buttons/eyebrows. Italic allowed for expressive moments only (pull quotes inside sections). |
| **DM Sans** | All body copy, card meta, review text, form fields, prices, counts | Italic allowed **only** for hero descriptions and pull quotes. Body line-height `1.6–1.82`. |

### Type scale

```css
--s-text-xs:   11px;   /* eyebrow labels UPPERCASE tracked */
--s-text-sm:   13px;   /* nav, buttons, card body */
--s-text-base: 16px;   /* body */
--s-text-lg:   17px;   /* lead paragraphs, hero sub */
--s-text-xl:   24px;   /* card headings */
--s-text-2xl:  40px;   /* section titles (Fraunces) */
--s-text-3xl:  clamp(36px, 5vw, 64px);   /* dark-section section titles */
--s-text-hero: clamp(64px, 9vw, 130px);  /* hero H1 (Bebas Neue) */
--s-text-partner: clamp(52px, 7vw, 96px); /* B2B block H (Bebas) */
```

### Casing rules

- **Hero display:** ALWAYS UPPERCASE
- **Section titles:** sentence case
- **Eyebrow labels:** UPPERCASE tracked `0.22em`, 11px, amber color
- **Buttons:** UPPERCASE (Fraunces), tracked `0.04em`, never sentence case body-sized buttons
- **Card names:** sentence case (Salon Amara, not SALON AMARA)

### BANNED

- ❌ Inter, Roboto, Arial, system-ui (zero brand personality)
- ❌ Bebas Neue in body copy or buttons
- ❌ Italic Fraunces
- ❌ Uppercase DM Sans (buttons are Fraunces)

---

## 3. SPACING (8-point grid)

Every margin / padding / gap is a multiple of **8px**.

**Allowed:** `4 · 8 · 12 · 16 · 20 · 24 · 32 · 48 · 64 · 80 · 96`
**Banned:** `5 · 7 · 9 · 11 · 13 · 15` — breaks the grid visually.

**Common patterns:**
- Section vertical padding: `80px` desktop, `64px` mobile
- Section horizontal padding: `48px` desktop, `20px` mobile
- Card inner padding: `14px 16px 18px` (asymmetric OK for cards)
- Grid gap (cards): `18px`
- Grid gap (tiles 6-col): `10px`
- Button padding lg: `16px 36px`
- Button padding md: `12px 26px`
- Button padding sm: `8px 18px`

**Max content width:** `1200px`, centered.

---

## 4. RADII

| Token | Value | Use |
|-------|-------|-----|
| `--r12` | 12px | Inputs, small buttons |
| `--r16` | 16px | Trust strip |
| `--r18` | 18px | Search bar outer |
| `--r20` | 20px | **Default card radius** (salon, review, lm, stat, city, slot panel, partner, insta) |
| `--r99` | 99px | All pills · chips · CTA buttons · avails · tags |

**BANNED:** sharp `0px` corners, `rounded-lg/xl/2xl` (Tailwind leftovers), blob organic shapes **except** Instagram tiles (see §7).

---

## 5. SHADOWS (Apple 5-level, warm-tinted)

**Every shadow uses `rgba(26,18,9,x)` tinting — NEVER `rgba(0,0,0,x)`.** Two-layer shadows minimum on md+.

```css
--sh-xs:    0 1px 2px rgba(26,18,9,.06);
--sh-sm:    0 1px 3px rgba(26,18,9,.07),  0 2px 8px  rgba(26,18,9,.05);
--sh-md:    0 2px 4px rgba(26,18,9,.08),  0 4px 16px rgba(26,18,9,.06);
--sh-lg:    0 4px 8px rgba(26,18,9,.09),  0 8px 32px rgba(26,18,9,.07);
/* --sh-xl RETIRED 2026-04-22 per Q11 — max shadow is now --sh-lg. Hero-level moments use custom inline declaration. */
--sh-coral:   0 2px 4px rgba(232,98,74,.25), 0 4px 16px rgba(232,98,74,.15);
--sh-coral-h: 0 4px 8px rgba(232,98,74,.32), 0 8px 28px rgba(232,98,74,.22);
--sh-amber:   0 2px 4px rgba(212,135,10,.22),0 4px 16px rgba(212,135,10,.14);
--sh-pressed: 0 1px 1px rgba(26,18,9,.12),  inset 0 1px 2px rgba(26,18,9,.06);
```

### When to use which — CRITICAL (we had "too high shadow" issues before)

| Element | Rest | Hover |
|---------|------|-------|
| Badges, pills, tags | `--sh-xs` | same |
| Nav pill, buttons | `--sh-sm` | `--sh-md` |
| Salon cards, review cards | `--sh-sm` | `--sh-lg` (NOT xl) |
| Category tiles, insta tiles | `--sh-sm` | `--sh-lg` (tiles are decorative, but no `--sh-xl` per Q11) |
| Stat glass, booking glass | `--sh-md` | same |
| Partner gradient block | inline custom shadow | — (hero-level feature, declared inline: `0 12px 40px rgba(232,98,74,.18)`) |
| Modal / bottom sheet | `--sh-lg` | — |

**Rule (Q11 lock 2026-04-22):** `--sh-xl` token DELETED from the system. Max shadow available is `--sh-lg`. Hero-level moments (max 1 per page) use inline custom shadow declarations — never a reused token.

---

## 6. GLASS — ONLY in 3 places

We had a problem with glass everywhere. Strict rule now: glass appears ONLY in these 3 contexts.

```css
--g1-bg:   rgba(250,246,239,.82);  --g1-blur: blur(28px) saturate(1.3);   /* nav pill only */
--g2-bg:   rgba(255,255,255,.62);  --g2-blur: blur(16px) saturate(1.2);   /* hero card overlay + booking summary */
--g3-bg:   rgba(250,246,239,.50);  --g3-blur: blur(8px);                  /* trust strip only */
--gb:      rgba(255,255,255,.55);                                         /* glass border */
```

**Allowed glass:**
1. **Nav pill** (`.nav-inner`) — G1, top floating glass
2. **Hero card photo overlay** (`.hv-overlay`) + booking summary panel — G2
3. **Trust strip** (`.trust-strip`) — G3, subtle

**BANNED glass on:**
- Content cards (salon cards, review cards, last-minute cards → solid white/plum)
- Section backgrounds
- Modals where not necessary
- Buttons

Always pair `backdrop-filter` with `-webkit-backdrop-filter`.

---

## 7. BLOBS & DECORATIVE SHAPES — STRICT

We had "blobs in every section" rot. New rule: blobs are decorative and reserved.

### Allowed blob usage

1. **Hero section** — max 3 soft background blobs (coral, blue, amber at 8-15% opacity)
2. **Dark sections** (Last Minute plum, Quartier ink, Footer ink) — max 2 blobs for depth
3. **Partner gradient block** — 2 decorative circles on the gradient
4. **Instagram tiles** — THE blob shapes themselves (organic border-radius on each tile is the visual identifier)

### BANNED blob usage

- ❌ Every section does NOT get blobs
- ❌ Cards section, categories section, reviews section, stats — **no blobs**
- ❌ Light sections with white cards already pop — no additional "background color blobs"

### Instagram tile blob shapes (keep these — they're the signature playfulness)

```css
/* Each tile gets a unique organic border-radius */
.insta-tile-1 { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; transform: rotate(-2deg); }
.insta-tile-2 { border-radius: 60% 40% 45% 55% / 50% 60% 40% 50%; transform: rotate(2deg);  }
.insta-tile-3 { border-radius: 50% 50% 40% 60% / 60% 40% 60% 40%; transform: rotate(-1.5deg); }
.insta-tile-4 { border-radius: 40% 60% 55% 45% / 30% 30% 70% 70%; transform: rotate(1.2deg); }
```

---

## 8. GRAIN OVERLAY (keep, subtle)

Desktop-only SVG noise, fixed, 3.8% opacity, multiply blend. Gives the whole page a warm magazine-paper feel. Hidden on mobile (performance, rarely noticed).

```css
.grain {
  position: fixed; inset: 0; pointer-events: none; z-index: 999;
  opacity: .038; mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml,%3Csvg ...fractalNoise baseFrequency='.72' numOctaves='4'/%3E");
}
@media (max-width: 768px) { .grain { display: none; } }
```

---

## 9. CARDS

### Salon card (SQUARE cover photo — locked 2026-04-20)

```
┌───────────────────┐
│ [Badge top-left]  │
│                   │  ← aspect-ratio: 1/1 SQUARE
│              [♡]  │  ← heart top-right
│                   │
│      AMARA        │  ← Bebas Neue 56px text over gradient
│                   │
└───────────────────┘
Salon Amara          ★ 4.9
Kleinbasel · 28 Bewertungen
[Heute 14:30 frei]       ← sage availability pill
Ab CHF 45
[Coiffeur] [Farbe]       ← category tags
```

**Dimensions:**
- Image: `aspect-ratio: 1/1` (SQUARE — not 160px height, not 3:2, not 4:3)
- Card wrapper: `--r20` border-radius, `var(--raised)` bg, `1px solid var(--b)` border, `--sh-sm` shadow
- Image padding text (before real photo): `56px` Bebas Neue, `rgba(255,255,255,.9)`

**Badges (top-left, on image):** Yellow "Solen Top Pick" default (`--yellow` bg, `--yellow-t` text, 10px Fraunces uppercase, `--r99`, `--sh-sm`).

**Heart (top-right, on image):** 34px circle, `rgba(255,255,255,.75)` bg + 8px blur, `--r99`, 14px lucide heart outline. Hover → `rgba(255,255,255,.96)`, scale 1.12.

**Availability pill:** `--sage-s` bg, `--sage-t` text, 12px DM Sans 600, `--r99`, with clock icon.

**Tags:** 10px Fraunces 700 UPPERCASE, `--r99`, tinted per category (yellow for Coiffeur, blue for Farbe, plum for Barber, amber for Rasur, sage for Massage, coral for Spa).

**Hover:** `translateY(-3px)`, shadow `--sh-xs → --sh-sm`, border `--b → rgba(232,98,74,.4)` (coral/40), image scales 1.03 (500ms) — Q11 lock: no `--sh-xl` anywhere.

### Review card
- White bg, `--r20`, `1px --b` border, `--sh-sm` → `--sh-lg` on hover
- 14px DM Sans italic quote
- Avatar 32px circle with colored bg + initials
- 12px Fraunces name + 11px DM Sans location

### Last-Minute card (on plum section)
- `rgba(74,30,60,.92)` bg + G2 blur, `1px rgba(255,255,255,.10)` border, `--r20`
- Yellow `--yellow` Bebas Neue discount (`-40%` style, 56px)
- Two overlapping decorative circles inside (c1 top-right, c2 bottom-left) — these are "on the card" blobs and ALLOWED
- Coral time pill

### Quartier card (on dark ink section)
- `rgba(255,255,255,.06)` bg, `1px rgba(255,255,255,.10)` border, `--r20`
- 15px Fraunces 700 name, 12px DM Sans count
- Giant Bebas Neue index number at bottom-right corner, `rgba(255,255,255,.05)` — 64px, a ghost

---

## 10. BUTTONS

All buttons = Fraunces 700 UPPERCASE, `0.04em` tracking, `--r99` pill.

| Variant | Bg | Text | Shadow | Hover |
|---------|-----|------|--------|-------|
| `btn-coral` | `--coral` | #fff | `--sh-coral` | bg `--coral-h`, shadow `--sh-coral-h`, translateY -1px |
| `btn-amber` | `--amber` | #fff | `--sh-amber` | bg `--amber-h`, slight lift |
| `btn-ink` | `--ink` | `--bg` | `--sh-sm` | bg `--plum`, shadow `--sh-md`, lift |
| `btn-outline` | transparent | `--ink` | `--sh-xs` (1.5px `--b3` border) | bg `--ink`, text `--bg` |
| `btn-ghost-sm` | `--raised` | `--ink2` | `--sh-xs` (1px `--b` border) | bg `--sur` |

**Sizes:**
- `sm`: 8×18, 11px
- `md`: 12×26, 13px
- `lg`: 16×36, 14px

**Active state (tap):** `--sh-pressed`, `translateY(1px)`.

---

## 11. SEARCH BAR (Fresha pattern)

Segmented horizontal pill with coral CTA at the end.

```
┌─────────────────────────────────────────────────────────────────────┐
│ KATEGORIE │ QUARTIER  │ WANN   │ UHRZEIT   │   ┌─────────┐         │
│ Coiffeur  │ Wo in... │ Heute  │ Beliebig  │   │ 🔍 Suchen│         │
└─────────────────────────────────────────────────────────────────────┘
```

- Outer: `--raised` bg, `1.5px var(--b2)` border, `--r18`, `--sh-lg` + inset highlight
- Segments: 68px min-height, `1px --b` dividers, 10px amber UPPERCASE label + 13px DM Sans 500 value
- CTA: coral pill, `--r12` (rounded but not fully pill), 16×22 padding, 8px margin from outer edge

**Mobile:** stacks vertically, segments separated by bottom borders, CTA full-width at bottom.

---

## 12. SECTION PATTERNS

Every section uses the `.sec` wrapper (`position: relative; overflow: hidden`) and `.w` inner (`max-width: 1200px; margin: 0 auto; padding: 0 48px`).

Every section header:
```
<span class="sec-eye">EYEBROW — amber, 11px, tracked 0.22em</span>
<h2 class="sec-h">Section title — Fraunces 800, 40px</h2>
```

**Homepage section order:**
1. **Hero** — Bebas Neue headline left + hero visual right (square photo card + floating glass stat)
2. **Search bar** — Fresha pattern, max-width 780px
3. **Stats band** — 3 glass stat tiles, `--sh-md`
4. **Categories** — 6 gradient tiles, 1:1 aspect, Bebas Neue name over gradient
5. **Salon cards grid** — 3-col desktop, filter pills above
6. **Slot selection + booking summary** — two-column, left solid panel + right glass summary
7. **Last Minute** (plum bg) — 3 dark cards with discount, limited circles/blobs OK
8. **Reviews** — 3 solid white cards with italic quote + avatar
9. **Instagram tiles** — 4 blob-shaped tiles with Bebas Neue text (coral/amber/plum/sage)
10. **Quartier** (ink bg) — 4-col neighborhood cards with ghost index numbers
11. **Partner** gradient block (amber→coral→plum)
12. **Trust strip** — G3 glass, single line
13. **Footer** — ink bg, 3-col, Bebas Neue logo with coral+amber accent

---

## 13. ANIMATION

```css
--e:  cubic-bezier(.4,0,.2,1);    /* standard in/out */
--eo: cubic-bezier(0,.55,.45,1);  /* bounce out for reveals */

--dur-fast:  150ms;  /* hover bg, color, pill select */
--dur-mid:   250ms;  /* buttons, card shadow transitions */
--dur-slow:  400ms;  /* card hover lift, image zoom, reveal fade-in */
```

**Card hover:** `translateY(-5px)` + shadow upgrade, 400ms `--e`.
**Reveal on scroll:** opacity 0→1 + translateY 20px→0, 400ms `--eo`, stagger children 80ms.
**Heart bounce:** keyframe `1 → 1.3 → 0.9 → 1.1 → 0.95 → 1` over 550ms.
**Press:** `scale(0.97)` + `opacity: 0.8` for 100ms (`.solen-press-effect`).

**`prefers-reduced-motion: reduce` — MANDATORY.** Disable all transforms, keep color transitions only.

---

## 14. IMAGERY

- Warm, cinematic, slightly desaturated (NOT bright stock-photo energy)
- No AI-grain default (use only `grain` overlay)
- Salon cover photo aspect: **1:1 SQUARE** (locked) — NOT 3:2, NOT 4:3
- Category tile aspect: **1:1**
- Discovery card aspect: **3:4 portrait**
- Fallback gradient per category (coiffeur=amber→coral, barber=plum→blue, nails=coral→yellow, spa=sage→blue, makeup=sand→coral, waxing=plum→sage)

---

## 15. DARK MODE

**Not in scope.** No `[data-theme="dark"]`, no `prefers-color-scheme: dark` overrides. Single warm light theme.

---

## 16. ICONS

- **Primary:** `lucide-react` outlined, 1.5–1.8 stroke weight, 14–22px
- **Custom category icons:** hand-tuned SVG components (Coiffeur, Barber, Nails, Spa, Makeup, Waxing) in the same outlined style
- Filled icons ONLY for: star ratings, active heart
- **BANNED:** emoji as functional UI (use SVG), unicode as icons, font-awesome, heroicons

**Exception:** `·` (middle dot) as metadata separator ("Basel · ★ 4.9 · 28 Bewertungen").

---

## 17. VOICE

- **Tone:** confident, warm, direct, Swiss. Not chirpy. Not corporate.
- **Language:** German primary (Baseldeutsch-aware), then English, French, Italian.
- **Person:** "du/dein" to the customer; "wir" sparingly (we're a platform, not a corporation).
- **Numbers:** tabular nums (`.data-text`). Currency: `CHF 85`. Ratings: `4.8`. Counts: `(127)` parenthesized.

**Example copy:**
- Hero: "BEAUTY. BASEL." / "Von Basel. Für Basel."
- Subtitle: "Der erste Salon-Booking-Service, der wirklich zu Basel passt."
- CTA: "Salon finden", "Jetzt buchen", "Termin buchen"
- Sections: "Top bewertet in Basel", "Spare bis zu 50%", "Was Basel sagt", "Entdecke Basel"
- Footer tagline: "Der erste Salon-Booking-Service, der wirklich zu Basel passt. Von uns. Für euch."

---

## 18. WHAT'S BANNED — full list

| ❌ Banned | ✅ Replacement |
|-----------|----------------|
| `#000000` black | `--ink` (`#1A1209`) |
| Cool greys | warm ink opacity |
| Green+peach V2 palette | Coral/amber/plum/sage (this doc) |
| Bebas Neue in body/buttons | DM Sans body, Fraunces buttons |
| Inter / Roboto / Arial | DM Sans + Fraunces + Bebas Neue |
| Italic Fraunces | DM Sans italic for quotes, Fraunces roman |
| `rounded-lg/xl/2xl` (Tailwind leftover) | `--r20` card, `--r99` pill |
| 0px sharp corners | `--r12` minimum |
| 3:2 cover photos on cards | 1:1 SQUARE (this doc) |
| V5 zones (Zone 1/2/3/4) | Single unified design language |
| Glass on content cards | Solid `--raised` cards |
| Glass on section bgs | Solid `--bg` / `--sur` |
| Blobs in every section | Hero + dark sections + Instagram tiles ONLY (§7) |
| `--sh-xl` on regular card hover | `--sh-lg` max on hover |
| Cream `#FAF6EF` page bg (Q15 RETIRED 2026-04-22) | White `#FFFFFF` page bg |
| "Von Basel. Für Basel." hyperlocal voice (Q5 RETIRED 2026-04-22) | "Für [detected city]" dynamic, fallback "Für deine Stadt" (Swiss-wide) |
| 4-segment search bar (Q4 RETIRED 2026-04-22) | 3-segment: Was · Wo · Wann |
| `--sh-xl` token (Q11 RETIRED 2026-04-22) | Max is `--sh-lg`, hero moments use inline custom |
| Dark mode | Single light theme |
| emoji as UI icons | lucide-react SVG |
| Availability pill removed V2 attempt | **Keep** availability pill (sage) |
| Old V2 `#F5A962` peach anywhere | coral `#E8624A` |

---

## 19. PREVIEW

**Active living preview:** `public/solen-coral.html` — open at `http://localhost:3000/solen-coral.html`

Every design decision in this doc is renderable in that file. When iterating in Phase 2, we edit that file directly + append to this doc's decisions log below.

---

## 20. DECISIONS LOG

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-20 | **Reverted from V2 green+peach attempt back to coral system** | V2 felt generic AI-beauty-app. Coral/cream/Bebas is distinctive. |
| 2026-04-20 | **Salon card cover photo = 1:1 SQUARE** (was 160px landscape) | Denser grid, matches Airbnb/Instagram visual language, image pops more |
| 2026-04-20 | **Glass restricted to 3 contexts** (nav, hero overlay + booking summary, trust strip) | Glass-everywhere looked dated; selective use feels premium |
| 2026-04-20 | **Blobs restricted to hero + dark sections + Instagram tiles** | "Blob in every section" was visual noise |
| 2026-04-20 | **`--sh-xl` cap: 2 places per page** | "Everything too high shadow" was user feedback |
| 2026-04-20 | **Bebas Neue kept** (hero, Instagram tiles, discount numerals, footer logo) | User said it's the playfulness — used correctly it works |
| 2026-04-20 | **Grain overlay kept** at 3.8% desktop-only | Magazine-paper warmth |
| 2026-04-20 | **Dark mode killed** | Single warm light theme, no `[data-theme="dark"]` |
| 2026-04-20 | **Fraunces replaces Syne as heading font** | User feedback: Syne read "too techy" / Y-Combinator-SaaS. Fraunces (variable serif with optical sizing) breaks the geometric-sans pattern, adds warm editorial personality, pairs beautifully with Bebas Neue display + DM Sans body. |
| 2026-04-20 | **Kill colored glow on default buttons** (`--sh-coral`/`--sh-amber` → `--sh-sm` rest, `--sh-md` + `brightness(1.05)` hover) | User feedback: "too much glow." Colored glow under same-color button = muddy halftone wash. `--sh-coral` and `--sh-amber` tokens retained for reserved one-off hero moments only. Search CTA also updated. |
| 2026-04-22 | **Q1: Salon card ratio locked at 1:1 square** | 20/19 vs 1:1 imperceptible to users. Square is the brand ratio across staff portraits, category tiles, salon cards. Consistent mark. |
| 2026-04-22 | **Q2: Price display `ab CHF 85` only** (no `$/$$/$$$` tiers) | Swiss consumers want specific CHF, not abstract American tiers. Concrete + honest > generic. |
| 2026-04-22 | **Q3: Swipeable image carousel on salon cards** (Airbnb pattern) | Photos are #1 booking factor in beauty. Carousel reveals 3-5 photos per salon; +40-60% engagement per Airbnb data. IMPLEMENTATION REQUIRED — not in current code. |
| 2026-04-22 | **Q4: Search bar = 3-segment pill (Was · Wo · Wann)** | GTM spec. Time-of-day is inside "Wann" bottom sheet. 4-segment version retired. Cleaner mobile, fewer thumb targets. |
| 2026-04-22 | **Q5: Voice = Swiss-wide, not hyperlocal** | Retire "Von Basel. Für Basel." → "Von der Schweiz. Für dich." Headlines dynamic to detected city ("Für Zürich", "Für Basel"). Fallback "Für deine Stadt". Platform supports any Swiss city from day 1. |
| 2026-04-22 | **Q6: Phase sequence — UI polish FIRST, payment second** | Site isn't live. Claude Design's whole point is to perfect the UI BEFORE launching. GTM Phase 1 priority aligns. |
| 2026-04-22 | **Q7: Moat priority — Chat intelligence + Allergy tags first** | Daily engagement + legal safety. Both non-optional once scale hits. AI nail art / Solen Score / disputes / gold pins / confetti follow in order. |
| 2026-04-22 | **Q8: TWINT integration required before Phase 3 launch** | ~70% Swiss adoption. Asking a CH customer to pay with credit card only = conversion killer. Stripe supports TWINT via Payment Methods API. |
| 2026-04-22 | **Q9: `/termine` → redirect to `/profile/bookings`** (don't duplicate code) | Preserve SEO + user bookmarks. Canonical is `/profile/bookings` (works, translated, auth'd). Moat's 440-LOC TerminePage not resurrected. |
| 2026-04-22 | **Q10: Add "Solen Favorit" as 4th badge** (yellow `#F2C144`, algorithmic curation) | Distinct from "Top bewertet" (rating-only). Algorithmic = rating × volume × reply rate × recency × response time. Priority order: Solen Favorit > Top bewertet > Beliebt > Neu. One badge per card. |
| 2026-04-22 | **Q11: `--sh-xl` token REMOVED from system entirely** | Every component thought it deserved hero treatment. Killing the token forces color + motion over shadow explosion. Max shadow is now `--sh-lg`. Hero-level moments use custom declaration, not a token. |
| 2026-04-22 | **Q12: Bebas Neue scope unchanged** (hero + Instagram tiles + discount numerals + footer logo) | Each context earned. Over-use dilutes the brand stamp. |
| 2026-04-22 | **Q13: Scraped profiles get "Claim this listing" ribbon + faint watermark** | Honest signal to customers ("not actively managed"), conversion hook for salon owners. Avoids sad-grey aesthetic. |
| 2026-04-22 | **Q14: Mobile bottom nav = 4 tabs** (Home · Entdecken · Suchen · Profil) | Locked. 3 too sparse, 5 too cramped on small iPhones. |
| 2026-04-22 | **Q15: Page bg reverted to WHITE `#FFFFFF` (not cream)** | User override. Cream retired in favor of clean white. Warmth preserved via coral + Bebas + Fraunces editorial moves, not via bg tint. |
| 2026-04-20 | **Salon card shadow diet** | Rest `--sh-xs` (was `--sh-sm`), hover `--sh-sm` (was `--sh-xl`). Added: border goes coral/40 on hover, image scales 1.03 over 500ms, translateY(-3px). Color + motion replace shadow explosion. |
| 2026-04-20 | **Category tile shadow diet** | Removed `box-shadow` entirely (was `--sh-sm` rest → `--sh-xl` hover). Added 1px ink/06 border rest. Hover: border coral/40, scale 1.04, rotate(-1deg), filter saturate(1.1). Vibrant gradients create their own depth. |
