# Solen Design System — Single Source of Truth

> **This file replaces**: `UI_RULES.md`, `UI_ENFORCEMENT.md`, `DESIGN_ENFORCEMENT.md`
> **Read this ONE file before ANY UI work.** No other design rule file is needed.

---

## Quick Reference Card

| Category | Values |
|---|---|
| **Fonts** | `font-display` = Bebas Neue (≥36px, uppercase) · `font-heading` = Syne · `font-body` = DM Sans · `data-text` = DM Sans tabular-nums |
| **Colors** | Coral `#E8624A` · Amber `#D4870A` · Blue `#6BA3C8` · Ink `#1A1209` · Sage `#7BA688` · Plum `#4A1E3C` · Yellow `#F2C144` · Sand `#C9A96E` |
| **Backgrounds** | Cream `#FAF6EF` (base) · White `#FFFFFF` (cards) · `#EDE5D8` (sunken) |
| **Radii** | `rounded-card` 16px · `rounded-card-lg` 20px · `rounded-input` 12px · `rounded-btn` 99px · `rounded-pill` 9999px · `rounded-search` 99px |
| **Shadows** | `shadow-card` (rest) · `shadow-card-hover` (hover) · `shadow-warm-sm/md/lg` · `shadow-coral-glow` · `shadow-glass` |
| **Timing** | 100ms active · 150ms colors/hover · 250ms card lift · 300ms sheets · 350ms modals |
| **Easing** | Standard `cubic-bezier(.4,0,.2,1)` · V5 decel `cubic-bezier(0.23,1,0.32,1)` · iOS-drawer `cubic-bezier(0.32,0.72,0,1)` |
| **Spacing** | 8px grid: `gap-2`=8 · `gap-4`=16 · `gap-6`=24 · `gap-8`=32 · micro (pills/badges only): `gap-1`=4 · `gap-1.5`=6 · `gap-3`=12 |

---

## 1. Colors & Branding

### Primary Tokens
| Token | Hex | Usage |
|---|---|---|
| `s-coral` | `#E8624A` | Primary CTAs, active states, highlights |
| `s-amber` | `#D4870A` | Secondary CTAs |
| `s-blue` | `#6BA3C8` | Accent, map pins |
| `s-ink` | `#1A1209` | Primary text (light mode) |
| `s-sage` | `#7BA688` | Spa/wellness category |
| `s-plum` | `#4A1E3C` | Dark depth blocks |
| `s-yellow` | `#F2C144` | "Top Rated" / "Neu" badges |
| `s-sand` | `#C9A96E` | Supporting warm surfaces |

Each extended color has `-subtle` (background) and `-text` (WCAG-safe text) variants. Always pair them.

### Semantic Status Colors
| Token | Usage |
|---|---|
| `s-success` `#2E7D32` / `s-success-bg` `#E8F5E9` | Success states |
| `s-warning` `#E65100` / `s-warning-bg` `#FFF3E0` | Warning states |
| `s-error` `#C62828` / `s-error-bg` `#FFEBEE` | Error states — NOT coral |

### WCAG Rules
- `text-s-coral` on cream **FAILS AA** for <18px text → use `text-s-coral-text` (#7A2415)
- `text-s-coral` OK for: icons, badges, headings ≥18px bold, buttons
- Every `*-subtle` bg has a matching `*-text` that passes AA

### 60-30-10 Color Rule
| % | Role | Tokens |
|---|---|---|
| 60% | Neutral base | `bg-s-bg-base` (cream) / `bg-s-dm-bg` (dark) |
| 30% | Card surfaces | `bg-white` / `bg-s-dm-surface` |
| 10% | Accent | `bg-s-coral` (CTAs), `text-s-coral` (highlights) |

### Text Colors
| Light Mode | Dark Mode | Usage |
|---|---|---|
| `text-s-ink` | `dark:text-s-dm-text` | Primary |
| `text-s-ink/70` | `dark:text-s-dm-text/70` | Secondary |
| `text-s-ink/50` | `dark:text-s-dm-text/50` | Tertiary/muted |
| `text-s-ink/40` | `dark:text-s-dm-text/40` | Disabled/hint |
| `text-s-coral` | `dark:text-s-coral` | Accent (large text) |
| `text-s-coral-text` | `dark:text-s-coral` | Accent (body text) |

---

## 2. Dark Mode

Toggle: `[data-theme="dark"]` on `<html>`. Stored `localStorage('solen-theme')`. All dark surfaces stay warm — never pure black, never grey.

| Token | Light | Dark |
|---|---|---|
| Background | `#FAF6EF` | `#151009` |
| Surface | `#F3EDE2` | `#1E1710` |
| Raised | `#FFFFFF` | `#26201A` |
| Text | `#1A1209` | `#F5EEE4` |
| Coral | `#E8624A` | `#F07560` (brighter) |
| Amber | `#D4870A` | `#E8A030` (brighter) |
| Blue | `#6BA3C8` | `#85BCD8` (lighter) |
| Plum | `#4A1E3C` | `#C090B4` (inverts to lavender) |
| Border | `rgba(26,18,9,.08)` | `rgba(245,238,228,.08)` |

---

## 3. Typography

| Context | Font | Weight | Size | Extra |
|---|---|---|---|---|
| Hero heading | Bebas Neue | — | `clamp(64px,9vw,130px)` | Always uppercase. Line-height 0.85-0.92 |
| Section numbers | Bebas Neue | — | 64px | Uppercase. Letter-spacing 0.04em |
| Category hero | Bebas Neue | — | 96px | Drop to Syne at ≤48px |
| Page headings | Syne | 800 | 48px | Letter-spacing -0.02em. Never italic |
| Section titles | Syne | 800 | 32px | |
| Card headings | Syne | 700 | 24px | |
| Nav links | DM Sans | 400 | 13px | |
| Body text | DM Sans | 400 | 16px | Line-height 1.75-1.85 |
| Captions | DM Sans | 400 | 13px | |
| Eyebrows/badges | Syne/DM Sans | 700/600 | 11px | Uppercase. Tracking 0.12em |
| Prices/ratings | DM Sans `data-text` | 500 | varies | Always `tabular-nums` |

**Hard Rules:**
- Bebas Neue NEVER below 36px (exceptions: 22px nav logo, 22px category tiles)
- Syne is NEVER italic — use DM Sans italic instead
- Dashboard (Zone 4): only Syne 700 + DM Sans. No Bebas Neue
- Never use system-ui, Inter, Roboto, Arial

---

## 4. Shadows (Apple 5-Level)

All shadows: warm `rgba(26,18,9,x)` — NEVER `rgba(0,0,0,x)`. Two layers minimum.

| Token | Usage |
|---|---|
| `shadow-card` | Cards at rest |
| `shadow-card-hover` | Cards on hover. NEVER at rest |
| `shadow-warm-sm` | Buttons, small elevations |
| `shadow-warm-md` | Dropdowns, tooltips |
| `shadow-warm-lg` | Modals, sheets, floating panels |
| `shadow-coral-glow` | Coral CTA resting glow |
| `shadow-glass` | Glassmorphism panels |

---

## 5. Border Radius

| Token | Value | Usage |
|---|---|---|
| `rounded-card` | 16px | Salon cards, content blocks |
| `rounded-card-lg` | 20px | Hero cards, modals |
| `rounded-panel` | 16px | Inner panels within cards |
| `rounded-input` | 12px | Form inputs, selects, dashboard cards, toasts |
| `rounded-search` | 99px | Search bar outer container |
| `rounded-btn` | 99px | ALL CTA buttons |
| `rounded-pill` | 9999px | Tags, nav pills, filter chips |

**Nested radius rule:** Outer ≥ Inner + Padding

---

## 6. Glass System

Glass = floating UI ONLY. Content cards = solid white. NEVER glass on content cards.

| Class | Usage | Zone |
|---|---|---|
| `.glass-frost` | Header, modals, overlays, bottom tab bar | 1+2 only |
| `.glass-search` | Search bar container | 1+2 only |
| `.glass-toolbar` | Sticky filter bar | 1+2 only |
| `.glass-pill` | Filter pills, chip buttons | 1+2 only |
| `.card-v4` | Salon cards (solid #fff, NO glass) | ALL zones |

- Always pair `backdrop-filter` with `-webkit-backdrop-filter`
- Max 3 glass elements visible simultaneously
- **NO glass in Zone 3** (booking/payment) or **Zone 4** (dashboard)

---

## 7. Animation & Motion

### Timing
| Use case | Duration | Easing |
|---|---|---|
| Button active feedback | 100ms | ease-out |
| Tab/badge color, link hover | 150ms | ease-out |
| Card hover lift | 250ms | `cubic-bezier(.4,0,.2,1)` |
| Bottom sheet enter | 300ms | `cubic-bezier(0.32,0.72,0,1)` |
| Modal enter | 350ms | spring `[0.34,1.2,0.64,1]` |
| Modal exit | 180ms | `cubic-bezier(0.23,1,0.32,1)` |
| **BANNED** | 500ms+ on any UI | — |
| **BANNED easing** | `ease-in` on interactive | — |

### Stagger
60ms between children in grids. All items start `{ opacity: 0, y: 20 }`.

### Springs — ALLOWED ONLY FOR:
Category icon micro-animations, heart bounce, avatar pop. Max `stiffness: 400, damping: 25`.
NEVER for layout/position transitions.

### Zone Animation Restrictions
| Zone | Animation |
|---|---|
| 1 (Homepage, discovery) | Full: stagger reveals, card hover, heading slide-in |
| 2 (Salon profile, search) | Card hover + heading slide-in. NO stagger |
| 3 (Booking, payment, login) | **ZERO animation** |
| 4 (Dashboard, admin) | **ZERO animation** |

---

## 8. Interaction Patterns (Standard Components)

### 8a. Transitions — NO `transition-all`
Always name exact CSS properties:
- Card hover: `transition-[transform,box-shadow] duration-[250ms]`
- Button: `transition-[transform,filter] duration-150`
- Color change: `transition-colors duration-150`
- Input focus: `transition-[border-color,box-shadow] duration-150`

### 8b. Modal Standard
Every overlay uses `<GlassModal>`. MUST support ALL THREE close methods: Escape key + backdrop click + X button.
- Enter: `{ opacity: 0, y: 32, scale: 0.97 }` → `{ opacity: 1, y: 0, scale: 1 }`, spring 350ms
- Exit: `{ opacity: 0, y: 24, scale: 0.97, filter: "blur(2px)" }`, 180ms

### 8c. Button Standards

**Close (X):**
```tsx
<button onClick={onClose} aria-label={t("close")}
  className="p-2 rounded-pill hover:bg-s-ink/5 dark:hover:bg-white/5 transition-colors duration-150">
  <X size={18} className="text-s-ink/40 dark:text-s-dm-text/40" />
</button>
```

**Cancel:**
```tsx
<button type="button" onClick={onClose}
  className="flex-1 py-2.5 rounded-pill border border-s-ink/10 dark:border-white/10 text-sm text-s-ink/60 dark:text-s-dm-text/60 hover:border-s-coral/40 hover:text-s-coral active:scale-[0.98] transition-[transform,border-color,color] duration-150">
  {t("cancel")}
</button>
```

**Primary Submit:**
```tsx
<button type="submit" disabled={loading}
  className="flex-1 py-2.5 rounded-pill bg-s-coral text-white text-[11px] font-heading font-bold uppercase tracking-[.06em] hover:brightness-[1.06] active:scale-[0.98] disabled:opacity-50 shadow-coral-glow transition-[transform,filter] duration-150">
  {loading && <Spinner size="sm" invert />}
  {t("save")}
</button>
```

### 8d. Tab Switching
**Filter tabs** (same-page data change): `bg-s-coral text-white shadow-coral-glow` active, `transition-[background-color,color,box-shadow] duration-150`
**Nav tabs** (section change): `layoutId="tabUnderline"`, `h-[2px] bg-s-coral` slide

### 8e. Form Input Focus
```tsx
className="border border-s-ink/[0.08] focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 outline-none transition-[border-color,box-shadow] duration-150"
```

---

## 9. Accessibility (WCAG AA Required)

- **Focus rings:** `focus-visible:ring-2 focus-visible:ring-s-coral` — full opacity, ≥3:1 contrast. NEVER `ring-s-coral/40`
- **Touch targets:** ≥44x44px on mobile for ALL interactive elements
- **Text contrast:** ≥4.5:1 normal text, ≥3:1 large text (18px bold / 24px)
- **ARIA labels:** Required on every icon-only button
- **`prefers-reduced-motion`:** MANDATORY global wrapper, instant all animations
- **No color-alone meaning** — always include icon or text alongside color
- **Form inputs:** 48px height min, 16px font (prevents iOS zoom)

---

## 10. Spacing — 8-Point Grid

**Allowed:** `gap-2`(8) · `gap-4`(16) · `gap-6`(24) · `gap-8`(32) · `gap-10`(40) · `gap-12`(48) · `gap-16`(64)
**Micro (pills/badges only):** `gap-1`(4) · `gap-1.5`(6) · `gap-3`(12)
**BANNED:** `gap-5`(20) · `gap-7`(28) · `gap-9`(36) — breaks 8pt rhythm

---

## 11. Zones

| Zone | Pages | Fonts | Animation | Glass |
|---|---|---|---|---|
| 1 — Maximalist | Homepage, discovery, landing | All 3 fonts | Full | Floating only |
| 2 — Soft | Salon profile, search, reviews | Syne + DM Sans (Bebas once for H1) | Card hover + slide-in | Dropdowns only |
| 3 — Functional | Booking, payment, login | Syne + DM Sans | **ZERO** | **NO** |
| 4 — Structured | Dashboard, admin, calendar | Syne 700 + DM Sans | **ZERO** | **NO** |

---

## 12. BANNED Tokens

Do NOT use these. Replace immediately if found.

| BANNED | USE INSTEAD |
|---|---|
| `text-dark`, `bg-dark`, `border-dark` | `text-s-ink`, `bg-s-ink`, `border-s-ink/10` |
| `bg-black`, `dark:bg-black` | `bg-s-ink`, `dark:bg-s-dm-bg` |
| `text-gray-*`, `bg-gray-*`, `border-gray-*` | `text-s-ink/*`, `bg-s-bg-surface`, `border-s-ink/*` |
| `dark:bg-dm-*`, `dark:text-dm-*` | `dark:bg-s-dm-*`, `dark:text-s-dm-*` |
| `bg-amber-*`, `bg-yellow-*`, `bg-emerald-*`, `bg-green-*`, `bg-purple-*`, `bg-rose-*`, `bg-red-*`, `bg-blue-100/200/300` | Use `s-*` token equivalents |
| `shadow-sm/md/lg/xl/2xl` | `shadow-warm-sm/md/lg`, `shadow-card` |
| `rounded-lg/xl/2xl/3xl/full` | `rounded-card/input/btn/pill` |
| `transition-all` | Name exact CSS properties |
| `#00A19C` (old teal) | `s-coral` / `s-blue` |
| Raw emojis in JSX | Lucide React icons |
| `rounded-blob-*`, `<BlobBackground>`, `.blob-interactive` | RETIRED. Use `.ambient-v5` |
| `alert()` in forms | Inline error state |

---

## 13. Pre-Build Checklist

Before shipping ANY component:
```
□ All colors are s-* tokens (no hex, no Tailwind defaults)
□ All font sizes from Tailwind scale (no text-[Npx])
□ All spacing from 8px grid (no gap-5/7/9)
□ All radii are design tokens (no rounded-lg/xl)
□ All shadows from warm system (no shadow-sm/md/lg)
□ Focus rings: full opacity, 2px, ≥3:1 contrast
□ Touch targets: ≥44x44px
□ ARIA labels on icon buttons
□ Dark mode pairs: every bg-white has dark:bg-s-dm-*
□ Tested on 375px mobile
□ No horizontal scroll
□ Animations <300ms, only transform/opacity
□ prefers-reduced-motion respected
□ No alert() — inline errors only
□ npm run build passes
```

---

## 14. Structural Rules

- **Salon cards:** 3:2 cover photo aspect ratio, `object-cover`
- **Category tiles:** 1:1 aspect ratio, `object-cover`
- **Loading:** `<Skeleton variant="card" />` for page loads, `<Spinner>` for inline only
- **Empty states:** `<EmptyState>` with icon + helpful text + CTA
- **Mobile nav:** `<BottomTabBar />` — 4 tabs (Discover, Search, Saved, Account)
- **Icons:** lucide-react only. No raw emojis. Google Auth uses full-color G logo
- **Currency:** Always `formatCurrency(amount, locale)` from `@/lib/format-currency`
- **Desktop booking:** sticky sidebar calendar. **Mobile:** bottom sheet
- **Header:** Transparent → solid+blur on scroll. 56px max height

---

## 15. Enforcement Commands

```bash
# Find banned tokens
grep -Ern "text-dark|bg-dark|bg-black|bg-gray-|text-gray-|border-gray-|shadow-sm[^a]|shadow-md|shadow-lg|rounded-lg|rounded-xl|rounded-2xl|rounded-full|transition-all" components/ app/ --include="*.tsx" | grep -v "node_modules\|s-dm\|s-ink\|shadow-warm\|shadow-card\|rounded-card\|rounded-pill"

# Find hardcoded hex colors
find . -name "*.tsx" | xargs grep -l "text-\[#\|bg-\[#" | head -20

# Find slow animations
grep -rn "duration-500\|duration-700\|duration-1000" components/ app/ --include="*.tsx"

# Find transition-all violations
grep -rn "transition-all" components/ app/ --include="*.tsx" | grep -v "node_modules"
```
