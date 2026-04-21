# 🎨 Solen Design System — Single Source of Truth

> **This file supersedes** `_rules/UI_RULES.md`, `_rules/GENERATION_TOOLS.md`, `_rules/search-bar-rules.md`, and CLAUDE.md §3.3 / §13 / §17.
> Every AI agent (Claude Code, Cursor, Gemini, etc.) and every human developer MUST read this before writing UI code.
> If you find a rule in an old file that contradicts this one — **this file wins**.

**Last overhaul: 2026-04-21** — merged 4 rule files, resolved 29 conflicts, added 1:1 salon card rule, compressed 4 zones → 2, 7 accents → 3+4 reserved.

---

## 0. TL;DR for Agents in a Hurry

If you only read one thing, read this:

- **Colors**: `s-coral` (primary), `s-amber` (urgency/promo), `s-blue` (info). `s-ink` for text. Reserved: `s-plum` (premium), `s-sage` (spa), `s-sand` (warmth), `s-yellow` (badges). Never raw hex, never Tailwind defaults.
- **Fonts**: Bebas Neue (display ≥36px, uppercase), Syne (headings), DM Sans (body + `data-text` for numbers).
- **Radii**: `rounded-card` (16px), `rounded-input` (12px), `rounded-btn` (99px), `rounded-pill` (9999px). No `rounded-lg/xl/2xl`.
- **Shadows**: `shadow-elevation-1` (rest) → `shadow-elevation-3` (hover). `shadow-coral-glow` for primary CTAs. Never `shadow-md/lg`.
- **Glass**: `.glass-frost` for floating UI only. `.glass-pill` for interactive filter pills. Never on content cards.
- **Motion**: 150ms hover · 200ms modal · 250ms card lift · 300ms sheet. Easing = `EASE_SOLEN` `[0.23,1,0.32,1]`. Stagger 60ms. Never >300ms on UI. Never `transition-all`. Never `ease-in` on entering.
- **Cards**: Solid white `.card-v4`, 1:1 aspect ratio on salon/store cards, `hover:-translate-y-[4px]`, `active:scale-[0.97]`.
- **Zones**: Marketing (animated) vs App (static). See §2.
- **Icons**: lucide-react for chrome, custom beauty-icons for domain (hair/nail/skin), Recraft for category tiles.
- **Before shipping**: Run pre-commit checklist §21. Zero banned tokens. i18n keys in all 4 locales. Dark mode pairs on every color.

---

## 1. Design Intent

**Feel target**: Airbnb × Fresha. Warm, premium, mobile-first, instant.

- **Warm, never cold**: shadows are `rgba(26,18,9,x)`, never `rgba(0,0,0,x)`. Dark mode bases are warm browns, never grey, never pure black.
- **Solid content, glass for floating UI only**: listing cards are solid white. Glass appears on headers (on scroll), modals, dropdown overlays, filter pills.
- **Instant interactions**: every pressable element responds under 150ms. Under 300ms for transitions. Nothing >300ms on interactive UI.
- **Mobile-first**: design for 375px first, scale up. Touch targets ≥44×44px. Form inputs ≥48px, 16px font (prevents iOS zoom).
- **No AI slop**: named transitions only, ease-out not ease-in, entering elements start from `scale(0.95)` not `scale(0)`, every pressable element has `:active` feedback, state a design intent before writing any component.

---

## 2. Zones — 2 Modes (Simplified from 4)

Old system had Zone 1–4. Too granular; agents forgot which zone they were in. New system: **2 modes**.

| Mode | Pages | Animation | Glass | Shadows | Radii | Fonts |
|---|---|---|---|---|---|---|
| **Marketing** | Homepage, discovery, category pages, salon profiles, review sections, landing/splash | Stagger reveals (60ms), card hover lift, section heading slide-in | `.glass-frost` on floating UI, `.glass-pill` on filter chips | Full elevation system | Full radii (`card`, `card-lg`, `pill`, `btn`) | Bebas + Syne + DM Sans |
| **App** | Booking flow, checkout/TWINT, auth (login/signup), profile settings, dashboard, admin, calendar, analytics | **ZERO reveal animations.** Hover color changes only (150ms). `:active` feedback still required. | **NO glass.** Solid surfaces only. | `shadow-elevation-1` max. No hover elevation change. | `rounded-input` (12px) default, `rounded-card` (16px) only on feature cards | Syne (headings) + DM Sans. **No Bebas Neue ever.** |

**Declare mode explicitly**: every page component should determine its mode and pass it as a `mode?: "marketing" \| "app"` prop to shared components (`<FilterBar mode="app" />`). Default is `"marketing"` only as a DX convenience — always pass it.

**Legacy zone numbers** (for agents reading old code):
- Old Zone 1 + Zone 2 → **Marketing**
- Old Zone 3 + Zone 4 → **App**

---

## 3. Colors

### 3.1 Active Palette (use freely)

| Token | Hex | Usage |
|---|---|---|
| `s-coral` | `#E8624A` | Primary CTA, active states, brand |
| `s-coral-hover` | `#CC4E35` | Coral on hover (rare — prefer `brightness-[1.06]`) |
| `s-coral-subtle` | `#FAECE7` | Coral tag backgrounds |
| `s-coral-text` | `#7A2415` | Coral text on cream (WCAG AA for body <18px) |
| `s-amber` | `#D4870A` | Urgency (last-minute), promo banners, premium accent |
| `s-amber-subtle` | `#FEF4E0` | Amber tag backgrounds |
| `s-blue` | `#6BA3C8` | Info, links, map pins |
| `s-blue-subtle` | `#EAF3FB` | Info tag backgrounds |
| `s-ink` | `#1A1209` | Primary text, dark surfaces |
| `s-ink/70` `/50` `/40` `/20` | — | Secondary / tertiary / muted / disabled text |
| `s-bg-base` | `#FAF6EF` | Page background (cream) |
| `s-bg-raised` | `#FFFFFF` | Card surface (white) |
| `s-bg-sunken` | `#EDE5D8` | Input backgrounds |
| `s-success` | `#2E7D32` | Success states, open indicators |
| `s-warning` | `#E65100` | Warning states |
| `s-error` | `#C62828` | Error states, destructive actions |

### 3.2 Reserved Palette (semantic contexts only)

These 4 colors exist but have locked meanings. Using them outside their context = slop.

| Token | Hex | ONLY for |
|---|---|---|
| `s-plum` | `#4A1E3C` | Premium/luxury labels, subscription tiers, editorial depth blocks |
| `s-sage` | `#7BA688` | Spa + wellness category only |
| `s-sand` | `#C9A96E` | Warmth accents on secondary cards (rarely) |
| `s-yellow` | `#F2C144` | Rating stars, "Top Rated" / "Neu" badges |

If your component isn't in one of the locked contexts above, use the active palette.

### 3.3 Dark Mode

Applied via `.dark` class on `<html>`. Preference stored in `localStorage('solen_theme')`. All dark surfaces stay **warm** — never pure black, never cool grey.

| Light | Dark | Use |
|---|---|---|
| `s-bg-base` `#FAF6EF` | `s-dm-bg` `#151009` | Page background |
| `s-bg-raised` `#FFFFFF` | `s-dm-raised` `#26201A` | Cards |
| `s-bg-surface` `#F3EDE2` | `s-dm-surface` `#1E1710` | Panel surfaces |
| `s-ink` `#1A1209` | `s-dm-text` `#F5EEE4` | Primary text |
| Coral `#E8624A` | Coral `#F07560` (brighter) | Brand |
| Plum `#4A1E3C` | **Lavender `#C090B4`** (inverts) | Depth |

**Every** `bg-white` must pair with `dark:bg-s-dm-raised`. **Every** `text-s-ink` must pair with `dark:text-s-dm-text`. No exceptions on non-button UI.

**Glass tokens** (use CSS vars, not inline rgba):
```css
/* light */ --glass-bg: rgba(255,255,255,.88); --glass-border: rgba(255,255,255,.70);
/* dark  */ --glass-bg: rgba(30,23,16,.85);    --glass-border: rgba(245,238,228,.08);
```

### 3.4 WCAG Rules

- `text-s-coral` on cream **fails AA** for body text <18px. Use `text-s-coral-text` (#7A2415) for small text.
- `text-s-coral` is OK for: icons, badges, headings ≥18px bold, buttons (white bg).
- 12px text → minimum 5:1 contrast. 16px+ → 4.5:1. Focus rings → ≥3:1 contrast, 2px, 100% opacity (never `/40` or `/50`).
- Never pure `#000` (use `s-ink`). Never pure `#FFF` as page background (use `s-bg-base`).

### 3.5 60-30-10 Restraint

| % | Role | Tokens |
|---|---|---|
| 60% | Neutral base | `bg-s-bg-base` (cream) / `bg-s-dm-bg` (dark) |
| 30% | Surface cards | `bg-s-bg-raised` / `bg-s-dm-raised` |
| 10% | Accent | `bg-s-coral` (CTAs), `text-s-coral` (highlights), `bg-s-amber` (secondary/promo) |

Accents go on CTAs, active states, small highlights — **never** on large surface areas.

---

## 4. Typography

### 4.1 Fonts (3 faces, scoped strictly)

| Face | When | Rules |
|---|---|---|
| **Bebas Neue** (`font-display`) | Hero titles ≥36px, section eyebrows, category tile labels | Always uppercase. Line-height 0.85–0.92. **NEVER <36px** (exceptions: 22px nav logo, 22px category tile labels). **NEVER in App mode** (no Bebas in booking/dashboard/auth). |
| **Syne** (`font-heading`) | All H1–H4 that aren't Bebas hero, card titles, modal titles | Weight 700–800. Letter-spacing `-0.02em`. **NEVER italic** (use DM Sans italic for descriptive italic). |
| **DM Sans** (`font-body` / `data-text`) | Body, labels, nav, inputs, prices, counters | Weight 400 body / 500 data / 300 italic for descriptive quotes. `data-text` class adds `tabular-nums` for aligned numbers. |

**Banned fonts**: system-ui, Inter, Roboto, Arial, Space Grotesk, DM Serif Display. Zero brand personality.

### 4.2 Scale (use Tailwind scale — never arbitrary px)

| Class | px | Use |
|---|---|---|
| `text-xs` | 12 | Badges, metadata, captions |
| `text-sm` | 14 | Secondary text, nav, labels |
| `text-base` | 16 | Body (default) |
| `text-lg` | 18 | Lead text, section subtitles |
| `text-xl` | 22 | Card titles |
| `text-2xl` | 28 | Section titles |
| `text-3xl` | 32 | Hero text (non-display) |
| `text-4xl` | 36 | Page H1 |
| `clamp(64px, 9vw, 130px)` | — | Homepage hero (Bebas only) |

**Banned**: `text-[15px]`, `text-[13px]`, `style={{ fontSize: "42px" }}`. If you need a size not in the scale, add it to the scale first.

### 4.3 Body Defaults

Set globally in `app/globals.css`:
- `body { font-family: "DM Sans", sans-serif; color: var(--color-body); }`
- `h1–h6 { font-family: "Syne", sans-serif; letter-spacing: -0.02em; }`

You don't need `font-body` class unless overriding. `font-heading` / `font-display` only when switching away from Syne defaults.

---

## 5. Shape (Border Radius)

All radii come from `tailwind.config.js`. **NEVER** use Tailwind defaults (`rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-full`), **NEVER** arbitrary values (`rounded-[14px]`).

| Token | px | Use |
|---|---|---|
| `rounded-input` | 12 | Form inputs, select dropdowns, dashboard cards, toasts, dropdown menus |
| `rounded-card` | 16 | Salon cards, listing cards, content blocks, inner panels |
| `rounded-panel` | 16 | Inner panels within a card, review cards |
| `rounded-card-lg` | 20 | Hero cards, feature cards, modals |
| `rounded-sheet` | 28 | Bottom sheets (top corners) |
| `rounded-btn` | 99 | ALL CTA buttons, action buttons |
| `rounded-search` | 99 | Search bar outer container (fully rounded) |
| `rounded-pill` | 9999 | Availability pills, tags, nav pill, filter chips |

**Nesting rule**: outer radius ≥ inner radius + padding. A `rounded-card` (16px) containing a `rounded-btn` (99px) with `p-4` is valid. A `rounded-card` nested in another `rounded-card` is invalid — pick different tiers.

**Never morph radius on hover** (cards translate only, radius stays fixed). **Never sharp corners** (0px) anywhere.

**RETIRED**: blob shapes (`rounded-blob-*`, `.blob-interactive`, `<BlobBackground>`). All purged in V5. Do NOT reintroduce.

---

## 6. Shadows

All shadows use warm tinting `rgba(26,18,9,x)` — **NEVER** `rgba(0,0,0,x)`. Two layers minimum (contact + ambient). Approximate 1:3 offset-to-blur ratio.

### 6.1 Canonical System (use these)

| Token | CSS | Use |
|---|---|---|
| `shadow-elevation-1` | `0 1px 2px rgba(26,18,9,.04)` | Cards at rest, subtle UI, App mode |
| `shadow-elevation-2` | `0 2px 8px rgba(26,18,9,.06), 0 1px 2px rgba(26,18,9,.04)` | Active dropdowns, focused cards |
| `shadow-elevation-3` | `0 8px 28px rgba(26,18,9,.1), 0 2px 6px rgba(26,18,9,.04)` | Card on hover, floating elements |
| `shadow-coral-glow` | `0 2px 4px rgba(232,98,74,.25), 0 4px 16px rgba(232,98,74,.15)` | Primary CTA at rest (color-matched glow) |
| `shadow-coral-glow-hover` | stronger glow | Primary CTA on hover |
| `shadow-amber-glow` | amber color-matched | Secondary CTA (amber) |
| `shadow-pressed` | inset | Button `:active` state (with `translateY(+1px)`) |

### 6.2 Deprecated (still work, do not use in new code)

`shadow-card`, `shadow-card-hover`, `shadow-surface`, `shadow-surface-hover`, `shadow-warm-xs/sm/md/lg/xl/float`, `shadow-glass`, `shadow-v5-card`, `shadow-v5-card-hover`, `shadow-v5-float`, `shadow-v5-glow-coral`.

These are kept in `tailwind.config.js` for backward compatibility. Migration to `shadow-elevation-*` will happen as a future sweep. Do not add new references.

### 6.3 Hard Bans

`shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl`, `drop-shadow-*`, `style={{ boxShadow: "..." }}`, arbitrary `shadow-[...]` values.

---

## 7. Glass — Intentional, Not Universal

**Rule**: Glass = floating UI only. Content cards are solid white.

### 7.1 Canonical Classes (2)

| Class | Where | Specs |
|---|---|---|
| **`.glass-frost`** | Header pill (scrolled), modals, dropdown overlays, bottom tab bar, sheet backdrops | `backdrop-filter: blur(20px) saturate(1.4)`, bg `rgba(255,255,255,0.72)`, border `rgba(255,255,255,0.50)` |
| **`.glass-pill`** | Interactive filter pills, cancel/tag chip buttons in Marketing mode | `backdrop-filter: blur(12px) saturate(1.2)`, bg `rgba(255,255,255,0.55)`, border `rgba(26,18,9,0.09)` |

Dark variants built-in (`.dark .glass-frost`, `.dark .glass-pill`).

### 7.2 Context Variants (keep inline for now)

`.glass-search` and `.glass-toolbar` exist for specific use cases (search bar container, sticky filter toolbar). Use them where they already appear; don't invent new glass tiers.

### 7.3 Hard Rules

- **NO glass in App mode** ever (booking, dashboard, payment, auth).
- **NO glass on content listing cards** in any mode. Use solid `.card-v4`.
- **Never stack more than 3 glass layers** visible at once (performance + visual noise).
- **Always pair** `backdrop-filter` with `-webkit-backdrop-filter` for Safari/iOS.
- **Never raw** `rgba(255,255,255,0.xx)` inline. Use `var(--glass-bg)` + `var(--glass-border)` CSS vars (defined in `globals.css`).

### 7.4 Retired

Blobs (`<BlobBackground>`, `.blob-interactive`, decorative blobs). Replaced by `.ambient-v5` static warm radial gradients for background fills.

---

## 8. Motion

### 8.1 Durations

| Use | Duration | Easing |
|---|---|---|
| Color / hover bg / tab highlight | 150ms | `ease-out` default |
| Button `:active` press | 100–150ms | `ease-out` |
| Dropdown / popover enter | 150–200ms | `EASE_SNAPPY` `[.4,0,.2,1]` |
| Modal / dialog enter | 200ms | `EASE_SOLEN` `[0.23,1,0.32,1]` |
| Modal exit | 150ms | `EASE_SOLEN` |
| Card hover lift | 250ms | `EASE_SOLEN` |
| Bottom sheet enter | 300ms | `EASE_DRAWER` `[0.32,0.72,0,1]` (iOS curve) |
| Bottom sheet exit | 200ms | `EASE_SOLEN` |
| Section heading slide-in | 500ms | `EASE_SOLEN` (Marketing only) |
| **BANNED on UI** | **>300ms** | — |
| **BANNED easing** | `ease-in` on entering elements | — |

### 8.2 Canonical Easing

```ts
// lib/animations.ts — source of truth
EASE_SOLEN  = [0.23, 1, 0.32, 1]   // deceleration (default for reveals, cards, modals)
EASE_SNAPPY = [0.4, 0, 0.2, 1]     // material-style for dropdowns/popovers
EASE_DRAWER = [0.32, 0.72, 0, 1]   // iOS-style bottom sheet
EASE_BOUNCE = { type: "spring", stiffness: 400, damping: 25 }  // springs ONLY for hearts/stamps/avatar pop
```

CSS var aliases: `--ease-out-strong`, `--ease-drawer`.

### 8.3 Stagger

- **60ms** between grid children (Airbnb canonical). Use `containerVariants` + `itemVariants` from `lib/animations.ts`.
- **40ms** between list items (tighter lists).
- Category row + salon grids on page load animate from `{ opacity: 0, y: 16 }` → `{ opacity: 1, y: 0 }`.
- **Marketing mode only.** App mode has ZERO reveal stagger.

### 8.4 Card Hover

**Canonical pattern** (Marketing cards):
```tsx
className="hover:-translate-y-[4px] hover:shadow-elevation-3
           transition-[transform,box-shadow] duration-[250ms]
           ease-[cubic-bezier(0.23,1,0.32,1)]"
```

Lift: **-4px** (not -5px, not -1px). Duration: **250ms** (current `.card-v4` CSS uses 400ms — migration pending). Named transitions only. Radius stays fixed.

**Image zoom on hover**: **REMOVED**. `.img-hover-zoom` is deprecated. Card lift alone provides feedback. Double effects = slop.

### 8.5 Springs — Allowed Only For

Category icon micro-animations, heart bounce on favorite (`{scale: 1 → 1.15 → 1}` spring), avatar pop on login, loyalty stamp place. Max `stiffness: 500, damping: 20`. Total duration ≤300ms.

**NEVER** springs on modals, sheets, cards, page transitions, grid stagger. Springs on layout = slop.

### 8.6 Anti-Slop Rules (always in effect)

1. **Entering elements start from `scale(0.95+)`, never `scale(0)`.** An element "was always there" — it doesn't appear out of thin air.
2. **Ease-out for entering, never ease-in.** Ease-in starts slow, feels broken.
3. **Name specific properties**, never `transition-all`. `transition-all` forces the browser to watch every animatable property.
4. **Under 300ms for UI.** If you want to write `duration-500` on a button/card/modal — don't.
5. **Every pressable element has `:active` feedback.** Buttons, cards, pills, tabs, links → all need `active:scale-[0.97]`.
6. **State a design intent before coding.** *"This component should feel ___ because ___"*. If you can't answer, invoke `frontend-design` or stop.

**Banned CSS patterns:**
```
transition: all ...           → name specific properties
ease-in on entering           → use ease-out / EASE_SOLEN
scale(0) on entering          → use scale(0.95) or higher
duration-500+ on UI           → max 300ms
hover:opacity-80              → use hover:brightness-[1.06] or shadow change
hover:bg-s-coral/90           → use hover:brightness-[1.06]
```

### 8.7 `prefers-reduced-motion`

Mandatory global wrapper in `app/globals.css`:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    scroll-behavior: auto !important;
  }
}
```
Already present. Do not remove. Do not add per-component reduced-motion checks — the global block handles it.

---

## 9. Component Standards

### 9.1 Cards — Solid White, Always

`.card-v4` is the canonical listing card:
```css
background: #ffffff;
border: 1px solid rgba(26, 18, 9, 0.05);
border-radius: 16px;               /* rounded-card */
box-shadow: 0 1px 2px rgba(26,18,9,.04), 0 4px 12px rgba(26,18,9,.03);
/* hover lift: see §8.4 */
```

**Salon / store cards — MANDATORY 1:1 IMAGE ASPECT RATIO**:

```tsx
/* ✅ CORRECT — salon cards always aspect-square */
<div className="relative w-full aspect-square bg-s-bg-sunken overflow-hidden rounded-[12px]">
  <Image ... />
</div>

/* ❌ BANNED */
<div className="aspect-[4/5] ..." />         {/* portrait */}
<div className="aspect-[3/2] ..." />         {/* landscape */}
<div className="aspect-[20/19] md:aspect-square ..." /> {/* responsive split */}
```

**Why**: consistent grid rhythm across breakpoints. Portrait cards bounce the grid height every time a card is added. 1:1 is Fresha's + Airbnb's default and reads as "venue" (not "photo frame").

**Same rule applies to:**
- Salon/store listing cards (SalonCard, store cards)
- Category tiles
- Review photos
- Staff portfolio tiles
- Nail design gallery tiles
- Chat photo gallery

Carousel-style masonry (e.g., discovery feed) may keep `aspect-[4/5]` since it reads as a photo stream, not a venue grid.

**Image inside card**: `object-cover`, `transition-transform duration-500` removed (image zoom is retired — §8.4).

### 9.2 Buttons

**Primary CTA (coral)**:
```tsx
className="bg-s-coral text-white rounded-btn px-6 py-2.5
           font-heading font-bold uppercase tracking-[.06em] text-[11px]
           hover:brightness-[1.06] active:scale-[0.97]
           disabled:opacity-50 disabled:cursor-not-allowed
           transition-[transform,filter] duration-150
           shadow-coral-glow"
```

Rules:
- Hover: `brightness-[1.06]`. **Never** `hover:bg-s-coral/90`, `hover:bg-s-coral-hover`, `hover:opacity-*`.
- Active: `scale-[0.97]`. **Never** `scale-[0.95]` (too aggressive) or none.
- Disabled: `opacity-50 cursor-not-allowed`. **Never** a separate disabled gray token.
- Transition: `[transform,filter]` only. Never `all`.
- Shadow: `shadow-coral-glow` at rest. No generic shadows.

**Secondary CTA (amber)**: same pattern, `bg-s-amber` + `shadow-amber-glow`.

**Ghost / cancel (text form)**:
```tsx
className="py-2.5 px-4 rounded-pill border border-s-ink/10 dark:border-white/10
           text-sm text-s-ink/60 dark:text-s-dm-text/60
           hover:border-s-coral/40 hover:text-s-coral
           active:scale-[0.97]
           transition-[transform,border-color,color] duration-150"
```

**Close X (top-right of modals/drawers)**:
```tsx
<button onClick={onClose} aria-label={t("close")}
  className="p-2 rounded-pill
             hover:bg-s-ink/5 dark:hover:bg-white/5
             transition-colors duration-150">
  <X size={18} className="text-s-ink/40 dark:text-s-dm-text/40" />
</button>
```
No scale on close X (it's recessive by design). 44×44 hit area from `p-2` + icon.

**Text link** (`Alle ansehen →`):
```tsx
className="text-s-ink/60 hover:text-s-coral transition-colors duration-150"
```

### 9.3 Inputs

Every `<input>`, `<textarea>`, `<select>`:
```tsx
className="min-h-[48px] px-4 text-base rounded-input
           border border-s-ink/[0.08] dark:border-white/[0.08]
           focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 outline-none
           transition-[border-color,box-shadow] duration-150
           bg-white dark:bg-s-dm-raised"
```

Rules:
- `min-height: 48px` (iOS-friendly, meets 44×44 with padding).
- `font-size: 16px` (`text-base`) — prevents iOS zoom-on-focus.
- Focus ring: `ring-s-coral/15` subtle — **never** `ring-blue-500` or generic.
- Placeholder inherits exact same line-height + font-family as body text.

Global input styles are in `app/globals.css` `@layer base` — most inputs pick them up automatically.

### 9.4 Modals

Every overlay uses `<GlassModal>` from `components/ui/GlassModal.tsx`. No raw `<div class="fixed inset-0">` modals.

- Backdrop: `bg-s-ink/40 backdrop-blur-[6px]`.
- Content surface: `.glass-frost`, `rounded-card-lg` (20px), `shadow-elevation-3`.
- Enter: `modalVariants` from `lib/animations.ts` — `{opacity: 0, scale: 0.95, y: 10}` → `{opacity: 1, scale: 1, y: 0}`, 200ms `EASE_SOLEN`.
- Exit: same but 150ms.
- **Must support all three close methods**: Escape key + backdrop click + X button.

### 9.5 Bottom Sheets

Use `sheetVariants` from `lib/animations.ts` — slides up from bottom 100%, 300ms `EASE_DRAWER`. Exit 200ms. `rounded-sheet` (28px) on top corners only. In App mode: solid surface + `shadow-elevation-2`, no glass, no `ambient-v5`.

### 9.6 Tabs — Two Patterns, Never Mix

**Pattern A — Filter/state tabs** (changes data on same page, e.g., discovery category, dashboard section):
```tsx
// Active
"bg-s-coral text-white shadow-coral-glow"
// Inactive
"bg-s-ink/[0.05] dark:bg-white/[0.05] text-s-ink/55 hover:bg-s-ink/[0.09]"
// Transition
"transition-[background-color,color,box-shadow] duration-150"
```
No slide animation. Color change only.

**Pattern B — Navigation tabs** (moves between sections: profile tabs, booking steps):
- Use `slideSwitch` Framer Motion variant from `lib/animations.ts`.
- Active underline: `motion.div` with `layoutId="tabUnderline"`, `h-[2px] bg-s-coral`.
- Tab button itself: `transition-colors duration-150`.

### 9.7 Feedback Banners (inline success/error)

```tsx
<div className="flex items-center gap-2 bg-s-success-bg text-s-success
                px-3 py-2 rounded-input text-sm font-medium
                animate-in fade-in slide-in-from-top-1 duration-[200ms]">
  <Check size={14} /> {t("saved")}
</div>
```
- Auto-dismiss: `setTimeout(clearStatus, 2000)`. Never 3000ms or persistent.
- NO browser `alert()` for validation. Inline only. `alert()` is banned in forms.
- No toast library for inline form feedback — toast is for global notifications.

### 9.8 Empty States

Use `<EmptyState>` with optional `illustration` prop. Never raw oversized emojis. Never hardcoded strings (use `useTranslations()`). Marketing mode: allow `scale 0.97 → 1` fade-in (200ms). App mode: static.

### 9.9 Skeletons

`<Skeleton variant="card" />` for grid loading. **Skeletons MUST have pixel-perfect dimensional parity** with populated counterparts (same aspect ratio, same radii, same border) to prevent CLS.

---

## 10. Icons & Assets

### 10.1 Icon Source Map (split by purpose)

| Icon type | Source | Example |
|---|---|---|
| UI chrome (menu, search, close, chevron, heart, star, paperclip) | `lucide-react` | `import { Heart, Search } from 'lucide-react'` |
| Beauty domain (hair type, nail shape, skin texture, hair length) | `components/ui/beauty-icons.tsx` (custom SVG) | `import { HairStraightIcon } from '@/components/ui/beauty-icons'` |
| Category tiles (Coiffeur, Nails, Barber, Makeup, Spa, Waxing) | `public/icons/category/*.svg` (generated by Recraft) | `<Image src="/icons/category/nails.svg" />` |

**Rules:**
- Never emoji in functional UI (emoji render differently per OS, don't scale, don't inherit CSS color).
- Never heroicons, fontawesome, react-icons, or other icon libraries for UI chrome — lucide only.
- Filled icons allowed only for rating stars. Everything else outlined (lucide default).
- Custom beauty-icons are permitted **because lucide doesn't cover the domain** (hair types, nail shapes, skin concerns). Do not reinvent UI chrome as custom SVG.

### 10.2 Category Icon Color

Category SVGs render solid coral `#E8624A` (= `s-coral`), no opacity layers, no gradients inside the icon file itself.

Recraft generates at `#E8624A`. Render at `#E8624A`. No color drift.

### 10.3 Category Tile Prompts (Recraft.ai)

| Icon | Prompt |
|---|---|
| Coiffeur | `professional hairdressing scissors icon, flat vector illustration, terracotta coral color #E8624A, clean geometric shapes, transparent background, no text, no shadows, centered composition` |
| Nails | `nail polish bottle icon, flat vector illustration, terracotta coral color #E8624A, clean minimal shapes, transparent background, no text, no shadows, centered` |
| Barber | `straight razor barber icon, flat vector illustration, dark handle with cream blade, terracotta coral accent, clean geometric, transparent background, no text, centered` |
| Makeup | `lipstick tube icon, flat vector illustration, terracotta coral color #E8624A, elegant minimal shapes, transparent background, no text, no shadows, centered` |
| Spa | `lotus flower icon, flat vector illustration, terracotta coral petals #E8624A, amber golden center, clean minimal, transparent background, no text, centered` |
| Waxing | `wax spatula stick icon, beauty depilation, flat vector illustration, terracotta coral color #E8624A, clean minimal shapes, transparent background, no text, centered` |

### 10.4 Asset Folders (source of truth)

```
public/
├── icons/category/          ← Recraft category SVGs
├── icons/ui/                ← Custom UI SVGs (rare — prefer lucide)
├── animations/              ← Lottie JSON (loading/empty/success states)
└── illustrations/           ← One-off brand illustrations
```

### 10.5 Missing Asset Protocol

If a component needs an icon/animation and the file doesn't exist:
1. **STOP**. Do not generate SVG bezier paths manually in code.
2. Do not use Figma Plugin API for category icons (output is wrong).
3. Tell the user: *"I need `[filename]` in `public/icons/category/` — generate it with Recraft using the approved prompt in §10.3"*

### 10.6 Tool Map

| Need | Tool | Notes |
|---|---|---|
| Category icons | Recraft.ai | API key `RECRAFT_API_KEY`, style `vector_illustration` |
| UI icons | lucide-react | Already installed |
| Loading/empty/success animations | LottieFiles | Download `.json`, use `lottie-react` |
| Page transitions, hovers | Framer Motion | Already installed |
| Interactive state-machine animations | Rive | Only if Lottie insufficient |
| Brand illustrations | Recraft.ai (style `digital_illustration`) or designer | |
| Salon photos | Supabase storage (real salon uploads) + Unsplash stock | Never AI-generated photorealistic people |
| AI nail art (admin) | fal.ai | Already integrated in `lib/nail/ai-prompts.ts` — do not change |

API keys in `.env.local` (never commit): `RECRAFT_API_KEY`, `FAL_KEY`, `UNSPLASH_ACCESS_KEY`.

---

## 11. Images

### 11.1 Aspect Ratios (fixed per context)

| Context | Aspect | Rule |
|---|---|---|
| **Salon / store cards** | `aspect-square` (1:1) | **Always, all breakpoints.** No responsive split. |
| Category tiles | `aspect-square` (1:1) | All breakpoints |
| Review photos | `aspect-square` (1:1) | All breakpoints |
| Staff portfolio tiles | `aspect-square` (1:1) | All breakpoints |
| Nail design gallery | `aspect-square` (1:1) | All breakpoints |
| Chat photo gallery | `aspect-square` (1:1) | All breakpoints |
| Discovery feed (masonry) | `aspect-[4/5]` | Portrait reads as photo stream, not venue |
| Hero background | Full-bleed | Object-cover, min-height clamp |

All images use `object-cover`. Never `object-contain` on cards (letterboxing looks broken). Never fixed `height: 300px`.

### 11.2 Responsive Sizing

- Use Next.js `<Image>` with `fill` + `sizes` prop.
- `sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"` is a sane default.
- Never `<img>` without width/height — causes CLS.

### 11.3 Availability Overlay (date-filtered salons)

When a date is selected and a salon is unavailable, grey overlay + "Nächster Termin" label. **Never hide** unavailable salons. Push to bottom of list.

```tsx
// overlay inherits card radius, doesn't block clicks
<div className="absolute inset-0 bg-white/60 dark:bg-s-dm-bg/60 rounded-[inherit] z-10 pointer-events-none" />
```

---

## 12. Accessibility

### 12.1 Focus Indicators (WCAG AAA)

- Every interactive element: `focus-visible:ring-2 focus-visible:ring-s-coral` (full opacity, 2px).
- Never `focus-visible:ring-s-coral/40` (~1.5:1 contrast, fails AAA).
- Never `focus:outline-none` without a replacement.
- Global focus-visible rings are already wired in `app/globals.css`. Don't override.

### 12.2 Touch Targets

Minimum **44×44px** on all interactive elements. Achieved via:
- `h-11 w-11` (44×44)
- `p-2.5` (on a ~24px icon = 44px total)
- `p-3` on icons (= 48px, safe)

Banned: `w-6 h-6` buttons, `p-1.5` hit targets, `w-[6px] h-[6px]` carousel dots.

### 12.3 Text Contrast

- 12px text → min 5:1 contrast (WCAG AA). Use `text-s-ink/50` or darker.
- 16px+ text → min 4.5:1. Use `text-s-ink/60` or darker.
- `text-s-ink/40` = disabled only, never default muted text.

### 12.4 ARIA

Every icon-only button needs `aria-label={t("...")}`. Every form input needs an associated `<label>` or `aria-label`. Every dynamic region (booking slot count, search result count, toast) needs `aria-live="polite"`.

### 12.5 Keyboard

- Skip-to-content link at top of layout (`sr-only focus:not-sr-only`) — already present.
- Modals trap focus. Escape closes them.
- Star ratings: `role="radiogroup"` + `role="radio"` + `aria-checked`.

---

## 13. Mobile-First

### 13.1 Baseline Viewport

**375px (iPhone SE)** is the primary viewport. Design there first, scale up.

Breakpoints:
- `sm`: 640 (tablet portrait)
- `md`: 768 (tablet landscape)
- `lg`: 1024 (desktop)
- `xl`: 1280 (desktop large)

### 13.2 Mobile Patterns

- **Booking**: bottom sheet (Airbnb "Check availability" style). Not inline form.
- **Filters**: `<FilterBottomSheet>` on mobile, `<FilterDrawer>` on desktop.
- **Navigation**: `<BottomTabBar>` (4 tabs max: Discover, Search, Saved, Account), `.glass-frost` + `border-t border-white/20`, `z-50`. Hamburger menu **deprecated on mobile** — hide at `md:` breakpoint.
- **Map ↔ Grid**: floating toggle FAB on mobile (no full page reload).

### 13.3 Testing Checklist

Before shipping any component:
- [ ] Opened in Chrome DevTools at 375px width
- [ ] Tested on iPhone SE (375×667), iPhone 12 (390×844), iPad (768×1024)
- [ ] No horizontal scroll
- [ ] All buttons ≥44×44px tap-able
- [ ] Text readable without pinch-to-zoom
- [ ] Images not stretched or distorted

### 13.4 Spacing Scale (8-point grid)

Every margin/padding/gap MUST be a multiple of 4px, preferring 8px rhythm:

**Allowed**: `gap-1` (4), `gap-2` (8), `gap-3` (12), `gap-4` (16), `gap-6` (24), `gap-8` (32), `gap-10` (40), `gap-12` (48), `gap-16` (64).
**Banned**: `gap-5` (20), `gap-7` (28), `gap-9` (36) — break the rhythm.
**Never**: arbitrary `gap-[7px]`, `p-[13px]`, `style={{ padding: "18px" }}`.

4px sub-grid (`gap-1`, `p-1.5`, `px-2`) allowed only inside compact elements (badges, pills, icon buttons), **not** for section-level or card-level spacing.

---

## 14. I18n Within Design

### 14.1 No Hardcoded Strings

```tsx
// ✅ Client Component
import { useTranslations } from 'next-intl';
const t = useTranslations('myNamespace');
<h2>{t('sectionTitle')}</h2>

// ✅ Server Component
import { getTranslations } from 'next-intl/server';
const t = await getTranslations('myNamespace');
```

Every visible string → translation call. Every icon button → `aria-label={t("...")}`.

### 14.2 Four Locales Required

Every key must exist in `messages/de.json`, `messages/en.json`, `messages/fr.json`, `messages/it.json`. Provide **actual translations**, never empty strings or German copies.

### 14.3 Locale-Aware Routing

Use `<Link>` from `next-intl/navigation`. **Never** `<a href="/de/...">`. **Never** `next/link` for internal navigation.

### 14.4 Fluid Layouts (German runs 30% longer)

- Never `w-48`, `w-64` fixed-width text containers.
- Use padding + `max-w-*` + let containers size fluidly.
- Compound German words will overflow fixed widths.

### 14.5 Cookie Preference Refresh

When toggling language (cookie-based preference that affects Server Components):
```ts
router.push(newPath);
router.refresh();  // REQUIRED — rebuilds RSC tree with new locale
```

---

## 15. Search Bar

### 15.1 Hierarchy

| Context | Component | File | Category-scoped |
|---|---|---|---|
| Homepage | `HomeSearchBar` | `components/ui/HomeSearchBar.tsx` | No (auto-detect via Gemini) |
| Category pages | `FilterBar` → `SearchAutocomplete` | `components/FilterBar.tsx` | Yes |

### 15.2 Category Scoping (Rules S-1 to S-3)

- **S-1**: Category page search must pass `&category=X` to the search API.
- **S-2**: Cross-category queries show a redirect suggestion, **never** results from a different category.
  ```tsx
  // "buzzcut" typed on nails page:
  "Meintest du Barbershop? → [Wechseln]"
  // Link: /${locale}/barbershop?q=buzzcut
  ```
- **S-3**: Homepage search is unscoped but uses Gemini auto-detection. Never show inline results on homepage.

### 15.3 Date Picker (Rules S-4, S-5)

- Must include quick chips ("Heute", "Morgen", "Diese Woche") + full `<SolenDatePicker>` calendar.
- Default: no date selected (shows all salons).
- When a date is selected: available → normal + green "Verfügbar" badge. Unavailable → grey overlay + "Nächster Termin: [date]" label, pushed to list bottom. **Never hidden.**
- Grey overlay must **not** block card clicks (use `pointer-events-none` + `rounded-[inherit]`).

### 15.4 AI Search (Rules S-6 to S-8)

- Two-tier: (1) instant ILIKE from `/api/search/suggest` shown immediately, (2) vector smart from `/api/search/smart` appended under "KI-Vorschläge" 200–500ms later.
- Never make the user wait for AI to see any results.
- Embedding generation admin-only, batched (max 10 concurrent Gemini, 1s cooldown), model `text-embedding-004` (768 dims).
- Gemini failures: return `results: []`, never throw 500. Log server-side.

### 15.5 API Security

| Route | Auth | Rate limit | Validation |
|---|---|---|---|
| `GET /api/search/suggest` | Public | IP `generalLimiter` | Query ≤100 chars |
| `GET /api/search/smart` | Public | IP 10/min | Query ≤200 chars |
| `GET /api/search/detect-category` | Public | IP 10/min | Query ≤200 chars |
| `POST /api/admin/search/generate-embeddings` | Auth + admin | User `adminLimiter` | — |
| `GET /api/salons/available-on-date` | Public | IP `generalLimiter` | Date ISO, category enum |

---

## 16. Banned Tokens — Single List

### 16.1 Color

| ❌ Banned | ✅ Use |
|---|---|
| `text-dark` / `bg-dark` / `border-dark` | `text-s-ink` / `bg-s-ink` / `border-s-ink/10` |
| `bg-black` / `bg-black/*` | `bg-s-ink` / `bg-s-ink/*` |
| `text-gray-*` / `bg-gray-*` / `border-gray-*` | `text-s-ink/*` / `bg-s-bg-surface` / `border-s-ink/*` |
| `bg-amber-*` / `fill-amber-*` | `bg-s-amber-subtle` / `fill-s-amber` |
| `bg-yellow-*` / `text-yellow-*` | `bg-s-yellow-subtle` / `text-s-yellow-text` |
| `bg-emerald-*` / `text-emerald-*` | `bg-s-success` / `text-s-success` |
| `bg-green-*` / `text-green-*` | `bg-s-sage` / `text-s-sage-text` |
| `bg-purple-*` / `text-purple-*` | `bg-s-plum-subtle` / `text-s-plum-text` |
| `bg-rose-*` / `text-rose-*` | `bg-s-coral-subtle` / `text-s-coral-text` |
| `bg-blue-100/200/300` / `text-blue-*` | `bg-s-blue-subtle` / `text-s-blue-text` |
| `bg-red-*` | `bg-s-error-bg` / `bg-s-error` |
| `dark:bg-dm-*` / `dark:text-dm-*` (no `s-` prefix) | `dark:bg-s-dm-*` / `dark:text-s-dm-*` |
| `dark:text-white` on non-buttons | `dark:text-s-dm-text` |
| `dark:bg-black` | `dark:bg-s-dm-bg` |
| Hex: `#00A19C`, `#F59E0B`, `#6B7280`, `#0F0F0F`, `#1A1A1A`, `#2D2D2D`, `#E5E7EB`, `#717171`, `#E8735A` | Design tokens |
| `#FF6B6B` (old coral), wine red, teal | `s-coral` |

### 16.2 Shadow

`shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl`, `drop-shadow-*`, inline `style={{ boxShadow: ... }}`, `shadow-[0_6px_...]` arbitrary. Use `shadow-elevation-*` / `shadow-coral-glow`.

### 16.3 Radius

`rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `rounded-full`, `rounded-sm`, `rounded-[14px]` arbitrary, `rounded-button` (old 8px token), `rounded-blob-*` (retired), `.blob-interactive`.

### 16.4 Motion

`transition-all`, `transition: all`, `ease-in` on entering elements, `duration-500`+ on UI, `scale(0)` on entering, `hover:opacity-*`, `hover:bg-s-coral/90`, `hover:scale-[1.03]`, `hover:-translate-y-1` (wrong px — use `-translate-y-[4px]`).

### 16.5 Components

- Raw `<div class="fixed inset-0">` modals — use `<GlassModal>`.
- Browser `alert()` in forms — use inline `<div>` feedback banner.
- `<Header />`, `<BottomNav />`, `<CookieBanner />` inside page components — already in layout.
- `<BlobBackground>`, `.hero-blob` — retired. Use `.ambient-v5`.
- Emoji in functional UI — lucide icon.
- Custom SVG for UI chrome — use lucide.

### 16.6 Grep Enforcement

Run before every commit:

```bash
# Banned tokens (should return 0):
grep -Ern "text-dark[^M]|bg-dark[^M]|bg-black|bg-gray-|text-gray-|border-gray-|dark:bg-dm-|dark:text-dm-|bg-amber-|bg-yellow-|bg-emerald-|bg-green-|bg-purple-|bg-rose-|bg-red-|shadow-sm[^a]|shadow-md|shadow-lg[^a]|shadow-xl|shadow-2xl|rounded-lg|rounded-xl|rounded-2xl|rounded-3xl|rounded-full|transition-all" \
  components/ app/ --include="*.tsx" \
  | grep -v "s-ink\|s-dm\|s-amber\|s-yellow\|s-success\|darkMode\|shadow-warm\|shadow-elevation\|shadow-coral\|rounded-card\|rounded-btn\|rounded-pill\|rounded-input" \
  | head -10
```

---

## 17. Anti-Slop — State Design Intent Before Coding

Before writing the first line of any new component, write one sentence (comment or mentally):

> *"This component should feel ___ because ___."*

Examples:
- *"This strip should feel urgent because last-minute slots are time-sensitive."*
- *"This card should feel editorial because we're showcasing curated salons."*
- *"This banner should feel grounded and trustworthy because it's quoting real reviews."*

If you can't answer, invoke the `frontend-design` skill or stop. Generic components without design intent are the definition of slop.

---

## 18. Feature Completeness — Every Feature Needs 8 Layers

A feature is not "done" until all 8 exist. Missing any → file an entry in `_tasks/INCOMPLETE_FEATURES.md`.

| Layer | Where |
|---|---|
| ① Types | `lib/types.ts` |
| ② DB | `supabase/migrations/` |
| ③ API | `app/api/.../route.ts` |
| ④ Component | `components/.../` |
| ⑤ Page | `app/[locale]/.../page.tsx` |
| ⑥ i18n keys | `messages/{de,en,fr,it}.json` (all 4) |
| ⑦ Import | Component imported + rendered by a page |
| ⑧ Navigation | Entry point (link/button) to reach the page |

Orphan components (built but never imported) belong in `components/_staging/`, not `components/`. Deprecated components move to `components/_archive/` and are removed from `components/index.ts`.

---

## 19. Pre-Commit Checklist

Before `git commit`, verify:

**Design tokens:**
- [ ] No banned colors (grep §16.6 returns 0)
- [ ] Every `bg-white` has `dark:bg-s-dm-*` pair
- [ ] Every `text-s-ink` has `dark:text-s-dm-text` pair
- [ ] No hardcoded hex (except SVG brand logos like Google)
- [ ] No `style={{ ... }}` for values achievable with Tailwind
- [ ] Shadows: `shadow-elevation-*` / `shadow-coral-glow` (never `shadow-md/lg/xl`)
- [ ] Radii: design tokens (`rounded-card/input/btn/pill`), never `rounded-lg/xl/2xl/full`

**Motion:**
- [ ] No `transition-all` (named properties only)
- [ ] No `ease-in` on entering elements
- [ ] No `duration-500`+ on UI (max 300ms)
- [ ] Every pressable element has `active:scale-[0.97]`
- [ ] Entering elements start from `scale(0.95)+`, never `scale(0)`

**Content:**
- [ ] No hardcoded strings (`useTranslations()` everywhere)
- [ ] i18n keys exist in all 4 locales with actual translations
- [ ] Every icon button has `aria-label={t("...")}`

**Mobile + a11y:**
- [ ] Tested at 375px viewport
- [ ] All interactive elements ≥44×44px
- [ ] Focus rings full-opacity (not `/40`)
- [ ] `<Image>` has `sizes` prop

**Correctness:**
- [ ] `npm run build` passes
- [ ] `npx tsc --noEmit` passes (zero type errors)
- [ ] Component is imported + rendered by a page (not orphaned)
- [ ] No duplicate layout elements (no `<Header />` inside pages)
- [ ] Zone/mode prop declared if component is shared

---

## 20. Migration Notes — Pending Cleanups

The following technical debt is documented but not blocking. Each can be swept in a focused refactor. Do not introduce new references; only fix where you're already editing.

| # | Change | Scope | Risk |
|---|---|---|---|
| 1 | `card-v4` CSS currently 400ms, should be 250ms per §8.4 | `app/globals.css` line 494 | Low — cosmetic speed-up |
| 2 | `.img-hover-zoom` 500ms zoom scheduled for removal | `app/globals.css` line 566, all `.img-hover-zoom` usages | Low — double-effect with card lift |
| 3 | Rename `shadow-v5-*`, `.card-v4`, `.ambient-v5` → semantic names (`shadow-card-rest/hover`, `.card`, `.ambient`) | Codebase-wide | Medium — touches many files |
| 4 | Consolidate 6 shadow systems (`shadow-card/warm-*/v5-*/elevation-*/surface/glass`) → `shadow-elevation-*` + color-glows only | `tailwind.config.js` + usages | Medium |
| 5 | Drop Syne (reduce 3 fonts → 2: Bebas + DM Sans) | `globals.css` font import + all `font-heading` classes | High — visual change, needs design sign-off |
| 6 | Rename legacy zone 1–4 references to `marketing`/`app` prop | All shared components taking `zone` prop | Medium — prop rename cascade |
| 7 | Consolidate `.glass-search` + `.glass-toolbar` into `.glass-frost` variants | `globals.css` + usages | Low-Medium |
| 8 | Run aspect-square migration: replace all SalonCard-like `aspect-[4/5]` / `aspect-[20/19]` / `aspect-[3/2]` with `aspect-square` per §11.1 | `components/SalonCard.tsx`, skeletons, store card variants | Low — already started in this commit |

Track these in `_tasks/` when picked up. Don't start partial sweeps (leaves codebase in mixed state).

---

## 21. Component Reference — USE THIS, DON'T BUILD

Before creating any component, check this list. Prevents naming collisions and dead code.

| Need | Use |
|---|---|
| Primary CTA button | `<InteractiveHoverButton>` |
| Salon/store card | `<SalonCard>` — never build a new card component |
| Loading state (grid) | `<Skeleton variant="card">` |
| Loading state (button) | `<Spinner>` |
| Empty state | `<EmptyState>` with `illustration` prop |
| Modal | `<GlassModal>` — never raw `fixed inset-0` |
| Date picker | `<SolenDatePicker>` |
| Filter bar | `<FilterBar mode="marketing|app" />` |
| Filter sheet (mobile) | `<FilterBottomSheet>` |
| Filter drawer (desktop) | `<FilterDrawer>` |
| Search criteria chips | `<SearchCriteriaChips>` |
| Homepage search | `<HomeSearchBar>` |
| Subpage search autocomplete | `<SearchAutocomplete>` |
| Dashboard sidebar | `<Sidebar>` |
| Mobile bottom nav | `<BottomTabBar>` |
| Theme toggle | `<ThemeToggle>` |
| Language switcher | `<LanguageSwitcher>` |
| Sticky category row | `<CategoryStickyRow>` |

If the need isn't on this list, grep `components/` for similar names first. If you believe an existing component is wrong, **stop and ask the user** before replacing it (CLAUDE.md Rule 8).

---

## 22. File Source Map — Where Everything Lives

| What | File |
|---|---|
| Tailwind tokens (colors, radii, shadows, fonts, animations) | `tailwind.config.js` |
| CSS variables + base styles + glass classes + `prefers-reduced-motion` | `app/globals.css` |
| Framer Motion variants + easing constants + stagger timings | `lib/animations.ts` |
| Banned tokens grep | §16.6 in this file |
| Category icon source files | `public/icons/category/*.svg` |
| Recraft prompt templates | §10.3 in this file |
| Beauty domain icons | `components/ui/beauty-icons.tsx` |
| Design intent + feel target | §1 in this file |
| Zone/mode routing | §2 in this file |

When you modify any of these, cross-check the others stay consistent.

---

## 23. This File Supersedes

These files are now **stubs pointing here**:
- `_rules/UI_RULES.md`
- `_rules/GENERATION_TOOLS.md`
- `_rules/search-bar-rules.md`

And these CLAUDE.md sections are now short pointers:
- CLAUDE.md §3.3 (Design System V5)
- CLAUDE.md §13 (Design Token Consistency)
- CLAUDE.md §17 (Design System Enforcement, Rules 48–56)

If there's a drift between this file and any of them, **this file wins**. Update the stubs or CLAUDE.md sections to match, never the other way around.

---

**Rule Enforcement**: If a prompt asks for a UI component that contradicts these rules, **refuse the specific contradiction** and implement using these rules instead. If the user insists, add a new entry to this file documenting the exception before proceeding — do not silently break the system.

