# Solen.ch Design System — Reference

> Facts, tokens, tables, grep commands.
> Principles and rationale live in **`DESIGN_SYSTEM.md`**. Read that first.

---

## 0. Canonical components table

| Need | Use | Path |
|---|---|---|
| Listing card (salon) | `SalonCard` | `components/SalonCard.tsx` |
| Primary CTA button | `InteractiveHoverButton` | `components/ui/interactive-hover-button.tsx` |
| Form input | native `<input>` + `rounded-input h-12` | — |
| Date picker | `SolenDatePicker` | `components/ui/date-picker.tsx` |
| Filter row | `FilterBar` | `components/ui/FilterBar.tsx` |
| Empty state | `EmptyState` | `components/ui/EmptyState.tsx` |
| Loading skeleton | `Skeleton variant="card"` / `SalonCardSkeleton` | `components/ui/` |
| Spinner (inline/button) | `Spinner` | `components/ui/Spinner.tsx` |
| Page state wrapper | `PageState` | `components/ui/PageState.tsx` |
| Modal / sheet | `Modal` / `BottomSheet` | `components/ui/` |
| Toast | `Toast` + `toastVariants` | `components/ui/Toast.tsx` + `lib/animations.ts` |
| Bottom nav (mobile) | `BottomTabBar` | `components/layout/BottomTabBar.tsx` |
| Dashboard shell | `DashboardLayout` | `components/dashboard/DashboardLayout.tsx` |
| Dashboard sidebar | `Sidebar` | `components/ui/sidebar.tsx` |

Visual render of the above: visit **`/design-system`** in any locale.

---

## 1. Color tokens

### Active

| Token | Hex | Use |
|---|---|---|
| `s-coral` | `#E8624A` | primary action, active state, brand |
| `s-amber` | `#D4870A` | urgency, promo, premium |
| `s-blue` | `#6BA3C8` | info, links |
| `s-ink` | `#1A1209` | text on light |

### Reserved (defaults for their category)

| Token | Hex | Category | Variants |
|---|---|---|---|
| `s-plum` | `#4A1E3C` | barbershop | `-hover`, `-subtle`, `-text` |
| `s-sage` | `#7BA688` | spa / wellness | `-subtle`, `-text` |
| `s-sand` | `#C9A96E` | makeup / partnership | `-subtle`, `-text` |
| `s-yellow` | `#F2C144` | top rated / achievement | `-subtle`, `-text` |

### Surfaces

| Token | Hex | Use |
|---|---|---|
| `s-bg-base` | `#FAF6EF` | page background (cream) |
| `s-bg-raised` | `#FFFFFF` | cards |
| `s-bg-sunken` | `#EDE5D8` | inputs, wells |

### Dark mode

| Token | Hex | Use |
|---|---|---|
| `s-dm-bg` | `#151009` | page background |
| `s-dm-surface` | `#1E1710` | cards, raised surfaces |
| `s-dm-text` | `#F5EEE4` | primary text |

Brand colors brighten slightly in dark mode. Plum inverts to lavender `#C090B4`.

---

## 2. Motion tokens (`globals.css`)

```css
:root {
  --ease-out:         cubic-bezier(0.16, 1, 0.3, 1);   /* canonical (Apple/Linear) */
  --ease-out-strong:  cubic-bezier(0.23, 1, 0.32, 1);  /* legacy V5 alias */
  --ease-in-out-strong: cubic-bezier(0.77, 0, 0.175, 1);
  --ease-drawer:      cubic-bezier(0.32, 0.72, 0, 1);
  --ease-bounce:      cubic-bezier(0.34, 1.56, 0.64, 1);

  --dur-instant:  100ms;
  --dur-fast:     150ms;
  --dur-normal:   200ms;
  --dur-slow:     300ms;
  --dur-dramatic: 500ms;
}
```

### Duration guide

| Event | Duration |
|---|---|
| Button press | 100–150ms |
| Hover / tab / color change | 150ms |
| Tooltip / popover | 125–200ms |
| Dropdown | 150–250ms |
| Modal entrance (default) | 180ms |
| Card hover lift | 200ms |
| Page transition | 200–300ms |
| UI ceiling | 300ms |
| Section reveal / illustration play | 400–600ms |

---

## 3. Radii tokens

| Tailwind | Pixels | Use |
|---|---|---|
| `rounded-input` | 12px | inputs, dashboard cards |
| `rounded-card` | 16px | feature cards, content blocks |
| `rounded-panel` | 16px | inner panels, review cards |
| `rounded-card-lg` | 20px | hero, modals |
| `rounded-search` | 99px | search bar |
| `rounded-btn` | 99px | CTA buttons |
| `rounded-pill` | 9999px | tags, badges |

---

## 4. Shadow tokens

| Tailwind | Use |
|---|---|
| `shadow-elevation-1` | popovers, dropdowns, subtle elevated UI |
| `shadow-elevation-2` | active dropdowns, focused cards |
| `shadow-elevation-3` | card hover (if needed), floating elements |
| `shadow-v5-card` | legacy card rest shadow (deprecated — use `.card` class) |
| `shadow-v5-card-hover` | legacy card hover shadow |
| `shadow-v5-float` | modals, search dropdown, floating overlays |
| `shadow-coral-glow` | coral CTA glow |

---

## 5. Glass classes (`globals.css`)

Two canonical — the rest are context aliases, retained indefinitely.

| Class | Material | Use |
|---|---|---|
| `.glass` | `backdrop-blur(20px) saturate(1.4)`, `rgba(255,255,255,0.72)` | header pill, modals, bottom tab bar |
| `.glass-subtle` | `backdrop-blur(12px)`, `rgba(255,255,255,0.55)` | interactive pills in marketing zone |
| `.glass-frost` | alias for `.glass` | floating overlays (context: header, modals) |
| `.glass-search` | alias for `.glass` + coral focus ring | search input container |
| `.glass-toolbar` | alias for `.glass` + bottom border | sticky filter bar |
| `.glass-pill` | alias for `.glass-subtle` | filter / category pills |

---

## 6. Interaction utility classes (`globals.css`)

See `DESIGN_SYSTEM.md §9` for principle.

| Class | Behavior |
|---|---|
| `.btn-primary` | `bg-s-coral text-white hover:brightness-[1.06] active:scale-[0.97]` |
| `.btn-ghost` | border, neutral text, coral-on-hover, `active:scale-[0.97]` |
| `.link-inline` | neutral text → coral on hover, 150ms color transition |
| `.filter-pill` | inactive rest; `.filter-pill.is-active` = coral fill |
| `.interactive-card` | flat rest + 1px border; `-4px` lift + shadow on hover; `active:scale-[0.97]` on press |
| `.card` | canonical card surface (alias `.card-v4`) |

---

## 7. Zone → animation / glass / shadow matrix

| Zone | Stagger | Card hover | Glass | Shadow on cards |
|---|---|---|---|---|
| marketing | 60ms children | -4px lift + shadow | floating chrome only | flat rest → shadow on hover |
| transitional | on first paint only | subtle -2px | floating chrome only | flat rest → slight shadow on hover |
| app | never | none | never | flat, no shadow (elevation-1 on modals only) |

---

## 8. Image aspect ratios

| Context | Ratio | Tailwind |
|---|---|---|
| Salon card cover | 1:1 | `aspect-square` |
| Category tile | 1:1 | `aspect-square` |
| Editorial / featured card | 4:5 | `aspect-[4/5]` |
| Hero imagery | varies | declare intrinsic ratio |
| Staff portrait | 1:1 | `aspect-square` |
| Review photo | 1:1 | `aspect-square` |

---

## 9. Typography size → typeface map

| Range | Typeface | Tailwind | Example |
|---|---|---|---|
| ≥40px | Bebas Neue | `font-display` | hero headlines, impact headers |
| 16–36px | Syne | `font-heading` | card titles, section headings |
| 12–15px | DM Sans | `font-body` | body, metadata, forms |
| data/numbers | DM Sans `tabular-nums` | `data-text` | prices, ratings, counts |

---

## 10. Reduced-motion behavior (`globals.css`)

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    transition-duration: .01ms !important;
    scroll-behavior: auto !important;
  }
  .card, .card-v4, .card-listing,
  .reveal-on-scroll,
  [data-stagger-container],
  [data-reveal] {
    transform: none !important;
    opacity: 1 !important;
  }
  .card:hover, .card-v4:hover, .card-listing:hover {
    transform: none !important;
    box-shadow: none !important;
  }
}
```

---

## 11. Grep checks (enforcement)

Run before pushing any `components/` change.

```bash
# Banned inline hex colors (outside globals.css / tailwind.config.js)
grep -rn "text-\[#\|bg-\[#\|color: \"#" components/ app/[locale]/ --include="*.tsx"

# Banned Tailwind default colors
grep -rn "text-gray-\|text-blue-[0-9]\|bg-red-\|bg-green-" components/ app/ --include="*.tsx"

# Banned active scale values (0.97 is canonical)
grep -rn "active:scale-\[0\.98\]\|active:scale-\[0\.99\]" components/ app/ --include="*.tsx"

# Banned transition-all
grep -rn "transition-all\|transition: all" components/ app/ --include="*.tsx"

# Banned long durations on UI
grep -rn "duration-500\|duration-700\|duration-1000" components/ app/ --include="*.tsx"

# Banned coral mutation
grep -rn "E8735A\|#e8735a" components/ app/ --include="*.tsx"

# Banned ease-in on entering UI (ease-in-out is fine)
grep -rn "ease-in\b[^-]" components/ app/ --include="*.tsx"

# Orphaned components (exported but not imported)
for comp in $(grep "export.*from" components/index.ts | awk '{print $NF}' | tr -d '";'); do
  count=$(grep -r "import.*$comp" app/ components/ | grep -v ".tsx:" | wc -l)
  [ "$count" -eq 0 ] && echo "⚠️ ORPHAN: $comp"
done
```

Expected output: zero hits on each `grep`, zero orphans.

---

## 12. Font loading

Fonts are loaded in `app/[locale]/layout.tsx` via `next/font/google`. Do not add `<link rel="stylesheet">` for fonts — it breaks FOUT optimization.

| Font | Weights | Source |
|---|---|---|
| Bebas Neue | 400 | Google Fonts |
| Syne | 500, 600, 700 | Google Fonts |
| DM Sans | 400, 500, 600, 700 | Google Fonts |

---

## 13. See also

- `DESIGN_SYSTEM.md` — principles, rationale, escape hatches
- `/design-system` (dev route) — live visual render
- `_rules/UI_RULES.md` — legacy rule index, still valid for non-visual concerns
- `_rules/GENERATION_TOOLS.md` — illustration + icon generation prompts
- `_rules/LESSONS_LEARNED.md` — appended bug/footgun log
