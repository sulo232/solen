# solen.ch — Complete Design System Specification

> **Platform:** Two-sided beauty & wellness salon booking marketplace
> **Market:** Basel → Zürich → Bern → All of Switzerland
> **Positioning:** "Die Schweizer Salon-Plattform" — Warm Swiss Minimalism
> **Tech stack:** Next.js 14+ App Router, Supabase, Vercel, Mapbox

> **THIS IS THE SOURCE OF TRUTH FOR ALL COMPONENT WORK.**
> When implementing any UI component, read the relevant section here FIRST.
> If this file conflicts with CLAUDE.md or older rules, this file wins.
> **BUT: if a value from this spec looks wrong on screen, the screen wins. Update this spec to match what works. The spec serves the product, not the other way around.**

---

## 0. LOCKED DECISIONS

These were decided collaboratively and are NOT open for re-interpretation.

| Decision | Value | Rationale |
|---|---|---|
| Visual weight | Invisible UI — photography leads | A1 |
| Color count | 4-5 on any given page | A2 |
| Feel | Warm AND clean | A3 |
| Page background | `#FAFAF8` (off-white, warm tint) | B1 |
| Coral system | Three tiers — accent/button/text | B2 |
| Primary text | `#222222` | B3 |
| Secondary text | `#767676` | Harmonizes with #FAFAF8 + #222222 |
| Fonts | Bebas Neue (display) + Syne (headings/UI) + DM Sans (body) | Keep all 3 |
| Bebas usage | City section + logo only. NOT hero (hero = search bar) | |
| Card image ratio | 4:3 (Fresha-like, compact, info-dense) | |
| Card radius | 16px | |
| Card hover | `translateY(-2px)` + shadow deepens, 250ms | |
| Button shape | Pill `99px` — sacred, never change | |
| Button coral | `#C05038` | Darker, better contrast |
| Glass | Mobile bottom pill + header on scroll only | |
| Hero | Search bar IS the hero (Airbnb pattern) | |
| Category icons | Keep all 6 in header | |
| Dark mode | Keep code, hide toggle from users (maintenance) | |
| Card width | Fluid `minmax(260px, 1fr)` grid | |
| Mobile nav | Floating frosted glass pill, 4 tabs | |
| Shadows | Warm-tinted, 3 levels | |
| Stars | Coral `#E8735A` (brand differentiator) | |
| Entrance animations | None — cards just appear | |
| Button press | `scale(0.97)` | |

---

## 1. COLORS

### 1.1 The 5-color system

| Token | Value | Usage |
|---|---|---|
| `--bg-page` | `#FAFAF8` | Page background, all surfaces |
| `--text-primary` | `#222222` | Headings, primary text |
| `--text-secondary` | `#767676` | Descriptions, captions, muted text |
| `--coral-accent` | `#E8735A` | Stars, icons, decorative fills (NON-TEXT) |
| `--coral-button` | `#C05038` | Button backgrounds, active states |
| `--coral-text` | `#B84A35` | Coral text on light backgrounds (WCAG AA) |
| `--surface-card` | `#FFFFFF` | Card backgrounds (white on off-white = subtle lift) |
| `--border` | `#EBEBEB` | Borders, dividers (barely visible on #FAFAF8) |

### 1.2 WCAG compliance

| Combination | Ratio | Pass? |
|---|---|---|
| `#222222` on `#FAFAF8` | 13.5:1 | AAA |
| `#767676` on `#FAFAF8` | 4.54:1 | AA |
| `#B84A35` on `#FAFAF8` | 4.5:1 | AA |
| `#C05038` on `#FFFFFF` (button) | 4.51:1 | AA |
| `#E8735A` on `#FAFAF8` | 3.1:1 | FAIL — non-text only |

**Rules:**
- `--coral-accent` (#E8735A): ONLY for non-text — icons, star fills, decorative borders
- `--coral-text` (#B84A35): ALL coral-colored text on light backgrounds
- `--coral-button` (#C05038): ALL button backgrounds with white text
- NEVER use `#E8735A` as text color

### 1.3 Status colors

| Token | Value | Usage |
|---|---|---|
| `--success` | `#1A8754` | Confirmations, verified badges |
| `--error` | `#D93025` | Errors, validation, destructive |
| `--warning` | `#E8B432` | Caution states |
| `--info` | `#3778C8` | Informational |

### 1.4 Shadows (3 levels, warm-tinted)

```css
--shadow-rest:     0 1px 3px rgba(50,47,44,0.04), 0 1px 2px rgba(50,47,44,0.03);
--shadow-hover:    0 4px 12px rgba(50,47,44,0.08), 0 2px 4px rgba(50,47,44,0.04);
--shadow-floating: 0 8px 28px rgba(50,47,44,0.12), 0 4px 10px rgba(50,47,44,0.06);
```

Using `rgba(50,47,44,x)` — warm enough to not feel cold on `#FAFAF8`, neutral enough to not look brown.

---

## 2. TYPOGRAPHY

### 2.1 Font stack

| Font | Role | Fallback |
|---|---|---|
| **Bebas Neue** | Display — city section names + SOLEN logo only | Impact, sans-serif |
| **Syne** | Headings, UI labels, nav, badges | DM Sans, sans-serif |
| **DM Sans** | Body text, cards, buttons, inputs, everything else | -apple-system, system-ui, sans-serif |

### 2.2 Type scale

| Role | Font | Size | Weight | Line height |
|---|---|---|---|---|
| City display | Bebas Neue | 48px | 400 | 1.0 |
| Logo | Bebas Neue | 24px | 400 | 1.0 |
| Section heading | Syne | 22px | 700 | 1.25 |
| Card title | DM Sans | 16px | 600 | 1.25 |
| Nav label | Syne | 13px | 600 | 1.0 |
| Button | DM Sans | 15px | 600 | 1.25 |
| Body | DM Sans | 14px | 400 | 1.5 |
| Caption/secondary | DM Sans | 13px | 400 | 1.3 |
| Badge | DM Sans | 11px | 600 | 1.18 |
| Micro | DM Sans | 10px | 500 | 1.2 |

---

## 3. COMPONENTS

### 3.1 Salon Card

**The most important component on the platform.**

```
┌──────────────────────────┐
│ [Image 4:3]         [♡]  │  ← aspect-ratio: 4/3, rounded-t-[16px]
│                    badge  │  ← max 1, frosted pill, top-left
│                           │
├──────────────────────────┤
│ Salon Name                │  ← DM Sans 16px/600, #222222, truncate
│ ★ 4.8 (127)              │  ← coral star + 14px/600 score + 14px/400 count #767676
│ Kleinbasel, Basel         │  ← DM Sans 14px/400, #767676
│ Ab CHF 45.–              │  ← DM Sans 14px/400, #767676
└──────────────────────────┘
```

| Property | Value |
|---|---|
| Width | Fluid: `minmax(260px, 1fr)` in CSS grid |
| Background | `#FFFFFF` |
| Border-radius | `16px` |
| Shadow (rest) | `--shadow-rest` |
| Shadow (hover) | `--shadow-hover` |
| Hover transform | `translateY(-2px)`, 250ms `cubic-bezier(0.22, 1, 0.36, 1)` |
| Image | `aspect-ratio: 4/3`, `object-fit: cover`, `border-radius: 16px 16px 0 0` |
| Content padding | `14px 16px 16px` |
| Content gap | `4px` between text lines |
| Heart button | White circle `rgba(255,255,255,0.9)`, 36px, top-right 12px, outline heart |
| Badge | Max 1 per card. Frosted white pill, DM Sans 11px/600. Only on 4.9+ rating OR 50+ reviews |
| Star icon | 14px, filled `#E8735A` |

### 3.2 Buttons

All buttons: `border-radius: 99px` (pill — sacred).

**Primary (coral CTA):**
| Property | Value |
|---|---|
| Background | `#C05038` |
| Text | `#FFFFFF`, DM Sans 15px/600 |
| Padding | `14px 28px` |
| Min-height | `48px` |
| Shadow | `--shadow-rest` |
| Hover | bg `#A8442F`, shadow `--shadow-hover` |
| Active | `scale(0.97)` |
| Focus | `0 0 0 3px rgba(192, 80, 56, 0.3)` |
| Disabled | `opacity: 0.4`, `cursor: not-allowed` |

**Secondary (outline):**
| Property | Value |
|---|---|
| Background | `transparent` |
| Border | `1.5px solid #222222` |
| Text | `#222222`, DM Sans 15px/500 |
| Hover | bg `rgba(34, 34, 34, 0.05)` |

**Ghost (text only):**
| Property | Value |
|---|---|
| Text | `#B84A35`, DM Sans 15px/500 |
| Hover | bg `rgba(232, 115, 90, 0.08)` |

**Sizes:** sm `36px h / 8px 20px / 13px`, md `48px h / 14px 28px / 15px`, lg `56px h / 18px 36px / 17px`

### 3.3 Input Fields

| Property | Value |
|---|---|
| Height | `52px` |
| Background | `#FFFFFF` |
| Border | `1.5px solid #EBEBEB` |
| Border-radius | `16px` (NOT pill — inputs feel stable) |
| Padding | `14px 16px` |
| Font | DM Sans 16px/400, `#222222` |
| Placeholder | `#767676` |
| Focus | border `2px solid #C05038`, shadow `0 0 0 3px rgba(192,80,56,0.12)` |
| Error | border `2px solid #D93025`, text below 13px `#D93025` |
| Label | Syne 13px/600, `#767676`, `margin-bottom: 6px` |

### 3.4 Navigation

**Desktop header:**
| Property | Value |
|---|---|
| Height | `64px` |
| Background | `#FAFAF8` (default), glass on scroll: `rgba(250,250,248,0.8) + blur(12px)` |
| Position | Sticky, hide on scroll down, show on scroll up |
| Shadow on scroll | `--shadow-rest` |
| Container | `max-width: 1280px`, centered, `padding: 0 24px` |
| Layout | Logo left, search pill center, actions right |
| Category icons | 6 icons with labels, horizontally scrollable |

**Mobile bottom nav:**
| Property | Value |
|---|---|
| Style | Floating frosted glass pill |
| Height | `52px` pill + safe area |
| Background | `rgba(255,255,255,0.78) + blur(18px)` |
| Radius | `99px` |
| Tabs | 4: Home, Suche, Buchungen, Profil |
| Active | `#E8735A` |
| Inactive | `#767676` |
| Icon | `22px` |
| Tap target | `48px × 48px` |

### 3.5 Badges

| Property | Value |
|---|---|
| Radius | `99px` (pill) |
| Padding | `4px 12px` |
| Font | DM Sans 11px/600, uppercase, `letter-spacing: 0.5px` |
| "Neu" | bg `rgba(232,115,90,0.12)`, text `#B84A35` |
| "Beliebt" | bg `rgba(26,135,84,0.12)`, text `#1A8754` |
| "Top bewertet" | bg `rgba(232,180,50,0.12)`, text `#8B6914` |

### 3.6 Rating Display

| Property | Value |
|---|---|
| Star size | `14px` |
| Star filled | `#E8735A` (coral — brand differentiator) |
| Star empty | `#EBEBEB` |
| Score | DM Sans 14px/600, `#222222` |
| Count | DM Sans 14px/400, `#767676`, "(127)" |

### 3.7 Toast Notifications

| Property | Value |
|---|---|
| Position | Bottom-center mobile (above tab bar), bottom-right desktop |
| Radius | `16px` |
| Shadow | `--shadow-floating` |
| Padding | `14px 20px` |
| Success | bg `#1A8754`, text white |
| Error | bg `#D93025`, text white |
| Info | bg `#222222`, text white |
| Auto-dismiss | 4s success, 6s error, never for action-required |

---

## 4. HOMEPAGE STRUCTURE

```
Header (64px, sticky, glass on scroll, 6 category icons)
│
├── Hero
│   ├── Search pill (center, prominent — THIS IS THE HERO)
│   ├── Trust line below: "★ 4.8 · 2'400+ Bewertungen · Kostenlos buchen"
│   └── Background: #FAFAF8 (no gradients, no imagery — clean)
│
├── Salon Carousels
│   ├── Coiffeur (horizontal scroll, fluid card grid)
│   ├── Nägel
│   └── Barbershop
│
├── City Section
│   ├── Background: dark warm (#2C2825 or similar)
│   ├── City names: Bebas Neue 48px — BASEL / ZÜRICH / BERN
│   └── Category pills below
│
├── Testimonials (ONLY if 3+ real reviews exist, otherwise hidden)
│
└── Footer (dark warm bg)
```

**Killed sections:** trust stats banner, "So funktioniert's", discover/inspiration, "Mehr Kategorien" button.

**Hero change:** No Bebas Neue headline. The search bar IS the visual anchor. Small warm subtitle above or below it, DM Sans, nothing shouty.

---

## 5. ANIMATION & MOTION

### 5.1 Easing

| Token | Value | Usage |
|---|---|---|
| `--ease-out-warm` | `cubic-bezier(0.22, 1, 0.36, 1)` | Default — hovers, exits, fades |
| `--ease-out-back` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Modal/sheet entrances (slight overshoot) |
| `--ease-in-subtle` | `cubic-bezier(0.55, 0, 1, 0.45)` | Elements leaving screen |
| `--spring-bounce` | `cubic-bezier(0.175, 0.885, 0.32, 1.275)` | Heart toggle only |

### 5.2 Durations

| Token | Value | Usage |
|---|---|---|
| `--dur-instant` | `100ms` | Color swaps, icon changes |
| `--dur-fast` | `150ms` | Button hover/press, focus ring |
| `--dur-normal` | `250ms` | Card hover, tooltip, toast enter |
| `--dur-moderate` | `350ms` | Modal enter/exit, bottom sheet |
| `--dur-slow` | `500ms` | Page transition, search expand |

### 5.3 Rules

- **No card entrance animations.** Content appears immediately.
- **Page transitions:** 200ms crossfade, `--ease-out-warm`
- **Button press:** `scale(0.97)`, `--dur-fast`
- **Card hover:** `translateY(-2px)` + shadow, `--dur-normal`, `--ease-out-warm`
- **Modal enter:** `scale(0.95) translateY(8px)` → normal, `--dur-moderate`, `--ease-out-back`
- **Heart toggle:** spring bounce, 400ms
- **Skeleton shimmer:** coral-tinted highlight, 2s cycle (NOT gray)

---

## 6. LAYOUT

### 6.1 Breakpoints

| Name | Width | Columns |
|---|---|---|
| mobile | 0–639px | 1 |
| tablet | 640–899px | 2 |
| tablet-l | 900–1079px | 3 |
| desktop | 1080–1399px | 3–4 |
| desktop-l | 1400px+ | 4 |

Container: `max-width: 1280px`, centered.

### 6.2 Spacing (8pt grid)

`4, 8, 12, 16, 20, 24, 32, 40, 48, 64`

Tight in cards/grids, airy between sections.

### 6.3 Border radius

| Usage | Value |
|---|---|
| Subtle | `4px` |
| Small | `8px` |
| Inputs, service cards | `16px` |
| Salon cards | `16px` |
| Modals, sheets | `24px` |
| Buttons, pills, badges, search | `99px` |
| Avatars | `50%` |

### 6.4 Z-index

`0` base · `10` raised · `20` dropdown · `30` sticky nav · `50` modal backdrop · `60` modal · `70` toast · `80` tooltip

---

## 7. GLASS

Only two places:

**Mobile bottom nav pill:**
```css
background: rgba(255, 255, 255, 0.78);
backdrop-filter: blur(18px);
-webkit-backdrop-filter: blur(18px);
border: 1px solid rgba(232, 226, 220, 0.5);
box-shadow: 0 4px 24px rgba(50, 47, 44, 0.12);
```

**Desktop header on scroll:**
```css
background: rgba(250, 250, 248, 0.8);
backdrop-filter: blur(12px);
-webkit-backdrop-filter: blur(12px);
box-shadow: var(--shadow-rest);
```

Nowhere else. No glass on cards. No glass on badges. No glass on search overlays.

---

## 8. DARK MODE

**Status: maintenance mode.**

Code remains in the codebase. The `ThemeToggle` component in Header is hidden/inaccessible to users. Dark mode CSS variables remain defined but the toggle is disabled until maintenance is complete.

```tsx
// In Header.tsx — hide the theme toggle
// <ThemeToggle /> — DISABLED, do not render
```

---

## 9. SWISS FORMATTING

| Format | Pattern | Example |
|---|---|---|
| Currency | `CHF X.–` | CHF 45.– |
| Rating decimal | Period (NOT comma) | 4.8 |
| Thousands | Apostrophe | 1'234 |
| Date | `Di, 15. Apr. 2026` | |
| Time | 24h, colon | 14:30 |
| No ß | Use "ss" | Strasse |

---

## 10. ACCESSIBILITY

- Focus ring: `2px solid #C05038`, `outline-offset: 2px`
- Touch targets: minimum `44px × 44px`
- `--coral-accent` NEVER as text — non-text only
- `prefers-reduced-motion`: disable all animations
- Star ratings: `aria-label="4.8 von 5 Sternen, basierend auf 127 Bewertungen"`
- Modals: `role="dialog"`, `aria-modal="true"`, focus trap, Escape to close
- Skip link: "Zum Inhalt springen" as first focusable element
