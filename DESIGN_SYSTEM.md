# Solen.ch Design System

> Single source of truth. Replaces scattered rules across CLAUDE.md §3.3, UI_RULES.md, and informal conventions.
> **Read before touching any `.tsx` or CSS file.** Grep checks at the end of this doc are enforceable.

---

## 0. Canonical "USE THIS, DON'T REBUILD" Table

If you need one of these, import it. If you're tempted to build a new one — **STOP** and ask the user.

| Need | Use | Path |
|---|---|---|
| Listing card (salon) | `SalonCard` | `components/SalonCard.tsx` |
| Primary CTA button | `InteractiveHoverButton` | `components/ui/interactive-hover-button.tsx` |
| Form input | native `<input>` + `rounded-input` + `h-12` | — |
| Date picker | `SolenDatePicker` | `components/ui/date-picker.tsx` |
| Filter row | `FilterBar` | `components/ui/FilterBar.tsx` |
| Empty state | `EmptyState` | `components/ui/EmptyState.tsx` |
| Loading skeleton | `Skeleton variant="card"` | `components/ui/Skeleton.tsx` |
| Spinner (inline/button) | `Spinner` | `components/ui/Spinner.tsx` |
| Modal/sheet | `BottomSheet` / `Modal` | `components/ui/` |
| Toast | `Toast` + `toastVariants` | `components/ui/Toast.tsx` + `lib/animations.ts` |
| Bottom nav (mobile) | `BottomTabBar` | `components/layout/BottomTabBar.tsx` |
| Dashboard shell | `DashboardLayout` | `components/dashboard/DashboardLayout.tsx` |
| Dashboard sidebar | `Sidebar` | `components/ui/sidebar.tsx` |

**Rule:** If you're about to create `FooBar.tsx` and any file matches `grep -ri "FooBar" components/`, rename the existing one or extend it. Never coexist.

---

## 1. Zones (simplified from 4 → 2)

Every component declares one zone. The zone controls animation, glass, and shadow behavior.

| Zone | Pages | Animation | Glass | Shadow on cards |
|---|---|---|---|---|
| **marketing** | Homepage, `/coiffeur`, `/nails`, `/barbershop`, `/discover`, `/search`, brand pages | Stagger reveal, card hover lift, scroll-triggered fades | Allowed on floating UI (header pill, dropdowns, modals) | Flat at rest + 1px border, lift on hover |
| **app** | Booking flow, dashboard, profile, auth, settings, checkout | None (fade ≤150ms max on state change) | Never | Flat + 1px border only; `shadow-elevation-1` reserved for modals/popovers |

Props contract:
```tsx
interface ZoneAware { zone: "marketing" | "app" }
```

Legacy Zone 1/2/3/4 → marketing (1+2), app (3+4). Migrate on sight.

---

## 2. Motion Tokens (locked)

| Token | Value | Use |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` (easeOutExpo) | **Default** for all UI — Apple/Linear standard |
| `--ease-v5` | `cubic-bezier(0.23, 1, 0.32, 1)` | Legacy; only for existing card lift. Do not use in new code. |
| `--dur-instant` | `100ms` | Active press, color swap |
| `--dur-fast` | `150ms` | Hover background, link color, tap feedback |
| `--dur-base` | `200ms` | **Modal/sheet open**, dropdown, card hover lift |
| `--dur-slow` | `300ms` | Max for any UI. Never exceed on app surfaces. |

**Banned:** `transition-all`, `ease-in` on entering elements, `duration-500+` on UI, spring animations on layout/position.

**Stagger:** `60ms` between grid children. Marketing only. App zone = no stagger, no reveal.

**Lift:** cards translate `-4px` on hover (not `-8px`, not `-1px`).

**Springs:** allowed only for — heart bounce on favorite (`{stiffness: 500, damping: 20}`, total ≤300ms), avatar pop on login, category icon micro-play. Never on modals, never on layout.

**Image zoom on card hover:** **removed**. Card lift is enough. Double-effect = slop.

---

## 3. Color System (locked — 3 active + 4 reserved)

### Brand (primary)
- `s-coral` `#E8624A` — **primary action**, active state, brand. The ONE canonical coral. `#E8735A` is an accidental mutation — ban on sight.
- `s-amber` `#D4870A` — **urgency / promo / premium** (Last Minute, discounts, loyalty tier badges)
- `s-blue` `#6BA3C8` — **info / links / neutral accents**

### Text / surface
- `s-ink` `#1A1209` — primary text on light
- `s-bg-base` `#FAF6EF` (cream), `s-bg-raised` `#FFFFFF`, `s-bg-sunken` `#EDE5D8`
- Dark mode: `s-dm-bg` `#151009`, `s-dm-surface` `#1E1710`, `s-dm-text` `#F5EEE4`

### Reserved (semantic only — never decorative)
Each has ONE locked use case. If your component doesn't match the use case, you cannot use the color.

| Token | Reserved for |
|---|---|
| `s-plum` `#4A1E3C` | Barbershop category |
| `s-sage` `#7BA688` | Spa / wellness category |
| `s-sand` `#C9A96E` | Makeup category / partnership surfaces |
| `s-yellow` `#F2C144` | "Top Rated" / achievement badges |

**Rule 3.1:** No arbitrary hex (`text-[#222]`), no Tailwind defaults (`text-gray-700`, `bg-blue-500`). Tokens only.

**Rule 3.2 (WCAG):** `text-s-coral` on cream fails AA for body text. Use `text-s-coral-text` (#7A2415) for <18px.

---

## 4. Typography (simplified — 2 typefaces)

Dropped Syne. Bebas Neue + DM Sans only.

| Role | Family | Class | Notes |
|---|---|---|---|
| Display (≥36px) | Bebas Neue | `font-display` | Uppercase, line-height 0.85–0.92 |
| Heading (<36px) | Bebas Neue | `font-display` | Was Syne; migrate `font-heading` → `font-display` |
| Body | DM Sans | `font-body` | Default for everything else |
| Data/numbers | DM Sans + `tabular-nums` | `data-text` | Preserves column alignment |

**Size scale:** Tailwind only (`text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`, `text-4xl`). Never `text-[15px]`.

**Migration:** `font-heading` is an alias — keep working but don't use in new code. Run a sweep to `font-display` later.

---

## 5. Radii

| Token | Value | Use |
|---|---|---|
| `rounded-input` | 12px | **Dashboard cards (default)**, form inputs |
| `rounded-card` | 16px | Large feature cards, marketing cards |
| `rounded-card-lg` | 20px | Hero cards, modals |
| `rounded-pill` | 9999px | Tags, availability badges |
| `rounded-btn` | 99px | CTA buttons |

**Dashboard default = `rounded-input` (12px).** `rounded-card` only for large feature cards in dashboard (e.g. analytics tiles).

---

## 6. Shadows (rest = flat + border; shadow = state)

**Default card state: flat with a 1px border.** Shadows are for elevation *changes*, not decoration.

| Token | Use |
|---|---|
| (no shadow, `border border-s-ink/[0.08]`) | Card at rest |
| `shadow-elevation-1` | Dashboard elevated surfaces (modals, popovers, dropdowns) |
| `shadow-elevation-3` | Card on hover (marketing zone only) |
| `shadow-v5-float` | Floating UI (search dropdown, toasts, sheets) |

**Banned:** generic `shadow-md`, `shadow-lg`, arbitrary `shadow-[...]`, custom `shadow-warm-*`.

---

## 7. Glass (2 variants — was 4)

Consolidated from 4 (`glass-frost`, `glass-search`, `glass-toolbar`, `glass-pill`) to 2.

| Class | Use |
|---|---|
| `.glass` | Floating chrome: header pill on scroll, search input container, sticky filter bar, mobile bottom tab bar, modals, dropdowns |
| `.glass-subtle` | Interactive pills in marketing zone (filter chips, tag buttons) |

Both use `var(--glass-bg)` + `var(--glass-border)` CSS vars — **never inline `rgba(255,255,255,...)`**. Dark mode swaps via CSS vars.

**Legacy aliases stay working** (`.glass-frost`, `.glass-search`, etc. resolve to `.glass`) — don't use in new code.

**Glass is banned on content listing cards, ever.** Cards use solid surfaces.

---

## 8. Interaction Patterns (anti-slop — copy exactly)

### Cards (marketing zone)
```tsx
className="border border-s-ink/[0.08]
           hover:-translate-y-1 hover:shadow-elevation-3
           active:scale-[0.97]
           transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
```

### Cards (app zone)
```tsx
className="border border-s-ink/[0.08] bg-white active:scale-[0.97]
           transition-transform duration-100"
```

### Primary CTA
```tsx
className="bg-s-coral text-white
           hover:brightness-[1.06] active:scale-[0.97]
           transition-[filter,transform] duration-150"
```

### Secondary / ghost button
```tsx
className="border border-s-ink/10 text-s-ink/70
           hover:border-s-coral/40 hover:text-s-coral
           active:scale-[0.97]
           transition-[color,border-color,transform] duration-150"
```

### Text link
```tsx
className="text-s-ink/60 hover:text-s-coral transition-colors duration-150"
```

### Filter pill (inactive / active)
```tsx
// Inactive:
className="bg-s-ink/[0.05] text-s-ink/55 hover:bg-s-ink/[0.09] active:scale-[0.97]"
// Active:
className="bg-s-coral text-white shadow-[0_0_0_3px_rgba(232,98,74,0.18)] active:scale-[0.97]"
```

**Active scale is `0.97` everywhere.** `0.98` is banned. One value.

**Every pressable element — including cards, pills, links-that-look-like-buttons — needs `active:scale-[0.97]`.** No exceptions.

### Modal / sheet entrance
```tsx
initial={{ opacity: 0, scale: 0.96 }}
animate={{ opacity: 1, scale: 1 }}
transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
```
**Never spring on modals.** Opacity + subtle scale, 180ms. That's it.

### Images in cards
No zoom. Card lift handles feedback.

---

## 9. Salon/Store Card Spec (LOCKED)

- Cover photo: **`aspect-square`** (1:1), `object-cover`, `rounded-[12px]`. Enforced on all viewports. No responsive variants.
- Skeleton must match: `aspect-square` with `rounded-[12px]`.
- Carousel dots: ≥8px (`w-2 h-2` / active `w-2.5 h-2.5`), 44px parent tap target.
- Hover: `-translate-y-1` + `shadow-elevation-3`. No image zoom.
- Tap: `active:scale-[0.97]`.

---

## 10. Reduced Motion (one global block)

In `app/globals.css`:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
  /* Explicit: kill stagger, lift, reveal */
  .card-v4, .card-listing,
  [data-stagger-container], [data-reveal] {
    transform: none !important;
    opacity: 1 !important;
  }
}
```

One block. No per-component gating. If motion breaks in reduced-motion mode, that's a bug.

---

## 11. Accessibility floor (non-negotiable)

- Touch target ≥44×44px for every interactive element (use padding if icon is smaller).
- Focus ring: `focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-2`. No `/40` opacity rings.
- Icon-only buttons: `aria-label={t(...)}` mandatory.
- Text contrast: ≥4.5:1 at 16px+, ≥5:1 at 12px. Use `text-s-ink/60` as the *lightest* body text; `text-s-ink/40` is decorative only.
- All strings go through `useTranslations()` in all 4 locales.

---

## 12. Forbidden patterns (grep enforced)

Run before every commit. Expected: 0 hits in new code.

```bash
# Colors
grep -rn "text-\[#\|bg-\[#\|text-gray-\|text-blue-\|text-red-\|text-green-" components/ app/ --include="*.tsx"

# Coral mutation
grep -rn "E8735A\|#e8735a" .

# Wrong active scale
grep -rn "active:scale-\[0\.98\]" components/ app/

# Transition-all
grep -rn "transition-all\|transition: all" components/ app/ --include="*.tsx"

# Banned hover
grep -rn "hover:bg-s-coral/90\|hover:scale-\[1\.\|hover:opacity-\[" components/ app/

# ease-in on entering UI
grep -rn "ease-in[^-]" components/ app/ --include="*.tsx"

# Long durations on UI
grep -rn "duration-500\|duration-700\|duration-1000" components/ app/ --include="*.tsx"

# Inline white glass (breaks dark mode)
grep -rn "rgba(255,255,255," components/ app/ --include="*.tsx"

# Old 4/5 aspect on salon cards
grep -rn "aspect-\[4/5\]\|aspect-\[3/2\]\|aspect-\[4/3\]" components/SalonCard* components/ui/SalonCardSkeleton* components/ui/Skeleton.tsx

# Raw emoji in UI (use Lucide)
# (manual check — no clean regex)
```

Any hit = fix before pushing.

---

## 13. Per-feature illustration prompt lock (Recraft.ai)

Any illustration in `public/illustrations/` must be generated with this base prompt appended:

```
Editorial line illustration, warm cream background (#FAF6EF), 2px terracotta coral (#E8624A) line weight,
minimal no-fill vector style, single subject centered with generous negative space,
Airbnb Cereal 2020 × Fresha illustration reference, NO gradients, NO 3D, NO photorealism.
Export as SVG, 800×800, viewBox 0 0 800 800.
```

First illustration sets the aesthetic. Don't deviate — document in `_rules/GENERATION_TOOLS.md`.

---

## 14. What changed from the old system

| Before | After | Why |
|---|---|---|
| 4 zones (1/2/3/4) | 2 zones (marketing/app) | Agents kept forgetting which zone they were in |
| 4 glass classes | 2 (`.glass`, `.glass-subtle`) | Luxury brands use 1–2 variants |
| 3 typefaces (Bebas, Syne, DM Sans) | 2 (Bebas, DM Sans) | 2 typefaces always feels more cohesive |
| 7 active colors | 3 active + 4 reserved | Agents picked randomly |
| `.card-v4`, `shadow-v5-*`, `.ambient-v5` | `.card`, `shadow-card`, `.ambient-bg` (aliases kept) | Version-numbered class names = future debt |
| `active:scale-[0.98]` OR `[0.97]` | `active:scale-[0.97]` everywhere | One value, more satisfying |
| V5 easing `cubic-bezier(0.23, 1, 0.32, 1)` | Default `cubic-bezier(0.16, 1, 0.3, 1)` (easeOutExpo) | Apple/Linear standard; snappier entry |
| 250ms modal spring | 180ms opacity + subtle scale | Springs on modals = AI slop |
| Card lift + image zoom | Card lift only | Double-effect reads as slop |
| Salon card `4:5` / `3:2` drift | Locked to `aspect-square` (1:1) | User-requested; stops drift |

Old tokens (`.card-v4`, `shadow-v5-card`, `.glass-frost`, `font-heading`, 4-zone props) stay resolvable so existing code doesn't break. **Don't use them in new code.** Migration happens on touch — when you open a file, update it.

---

## 15. When in doubt

1. Does `components/` already have this? → Use it. (See §0.)
2. Is your color in the 3 active tokens? → Good.
3. Is your duration ≤300ms? → Good.
4. Does every pressable thing have `active:scale-[0.97]`? → Good.
5. Does your modal open in 180ms opacity+scale (no spring)? → Good.
6. Is your card `aspect-square` with flat-at-rest + 1px border? → Good.

If no to any of these, read the relevant section above.
