# Solen V5 — Fresha × Airbnb Design Overhaul Roadmap

> **For Claude Code**: This is a step-by-step execution guide. Each phase has exact file paths, line-level instructions, and CSS/TSX code snippets. Execute phases sequentially. Keep ALL existing fonts (Bebas Neue, Syne, DM Sans) and brand colors (coral `#E8624A`, amber `#D4870A`, plum `#4A1E3C`, ink `#1A1209`, sage `#7BA688`, blue `#6BA3C8`).

---

## Design Philosophy

- **Glass = floating UI only** (header on scroll, search dropdown, modals). Never on content cards.
- **Cards = solid white** with layered shadows. Airbnb-style: image-first, minimal text, spatial depth.
- **Motion = buttery & intentional**. Custom easing `cubic-bezier(0.23, 1, 0.32, 1)`. No springs. No bounce. Stagger reveals.
- **Spacing = generous**. Airbnb uses massive whitespace. Sections get `py-20 md:py-28`.
- **Color accents = warm**. Coral for CTAs & active states. Amber for premium badges. Sage for success/availability.

---

## Tech Stack Context

- **Framework**: Next.js (App Router) with `next-intl`
- **Styling**: Tailwind CSS + `globals.css` utilities
- **Animation**: `framer-motion` already installed
- **Icons**: `lucide-react` + custom category icons in `components/icons/category/`
- **Config**: `tailwind.config.js` at project root, `globals.css` at `app/globals.css`
- **Run dev**: `npm run dev` (localhost:3000)
- **Note**: Homepage (`/de`) crashes without `.env.local` — category pages (`/de/coiffeur`, `/de/barbershop`, etc.) work fine for testing

---

## Phase 1: Glass System Upgrade

### 1A. `app/globals.css` — Add V5 Glass Tokens

Add these new utilities inside the existing `@layer utilities` block (after `.gpu` around line 162):

```css
/* ── V5 Frosted Glass — for floating UI only ──────────────────────── */
.glass-frost {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  border: 1px solid rgba(255, 255, 255, 0.50);
  box-shadow: 0 1px 3px rgba(26, 18, 9, 0.04), 0 8px 24px rgba(26, 18, 9, 0.06);
}
.dark .glass-frost {
  background: rgba(30, 23, 16, 0.78);
  border-color: rgba(255, 255, 255, 0.08);
}

/* V5 Search input glass */
.glass-search {
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(16px) saturate(1.3);
  -webkit-backdrop-filter: blur(16px) saturate(1.3);
  border: 1.5px solid rgba(26, 18, 9, 0.06);
  box-shadow: 0 1px 3px rgba(26, 18, 9, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.50);
  transition: border-color 300ms ease, box-shadow 300ms ease;
}
.glass-search:focus-within {
  border-color: rgba(232, 98, 74, 0.40);
  box-shadow: 0 1px 3px rgba(26, 18, 9, 0.04), 0 0 0 3px rgba(232, 98, 74, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.50);
}
.dark .glass-search {
  background: rgba(30, 23, 16, 0.72);
  border-color: rgba(255, 255, 255, 0.06);
}

/* V5 Filter toolbar — sticks below header */
.glass-toolbar {
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px) saturate(1.2);
  -webkit-backdrop-filter: blur(16px) saturate(1.2);
  border-bottom: 1px solid rgba(26, 18, 9, 0.04);
  box-shadow: 0 1px 2px rgba(26, 18, 9, 0.03);
}
.dark .glass-toolbar {
  background: rgba(30, 23, 16, 0.88);
  border-color: rgba(255, 255, 255, 0.04);
}
```

### 1B. `app/globals.css` — Upgrade Ambient Background

Replace the existing `.ambient-v4` block (around line 364-374) with a warmer, category-aware version:

```css
/* ── V5 Ambient gradient (warmer, unified) ────────────────────────── */
.ambient-v5 {
  background:
    radial-gradient(ellipse 70% 50% at 0% 0%, rgba(232,98,74,0.05) 0%, transparent 60%),
    radial-gradient(ellipse 50% 40% at 100% 100%, rgba(212,135,10,0.03) 0%, transparent 60%);
}
.dark .ambient-v5 {
  background:
    radial-gradient(ellipse 70% 50% at 0% 0%, rgba(232,98,74,0.03) 0%, transparent 60%),
    radial-gradient(ellipse 50% 40% at 100% 100%, rgba(212,135,10,0.02) 0%, transparent 60%);
}
```

Keep `ambient-v4` for backward compat but rename usages in components to `ambient-v5`.

### 1C. `tailwind.config.js` — Add V5 Shadow Tokens

Inside the `boxShadow` extend object, add these new tokens:

```js
// ── V5 Layered Shadows ──
"v5-card":       "0 1px 2px rgba(26,18,9,.04), 0 4px 12px rgba(26,18,9,.03)",
"v5-card-hover": "0 4px 12px rgba(26,18,9,.06), 0 12px 32px rgba(26,18,9,.06)",
"v5-float":      "0 8px 32px rgba(26,18,9,.10), 0 2px 8px rgba(26,18,9,.04)",
"v5-glow-coral": "0 0 24px rgba(232,98,74,.12)",
```

### 1D. `components/layout/Header.tsx` — Apply Glass-Frost

**Current** (line ~132-140): The header pill uses inline styles with `var(--glass-bg)`.

**Change to**: Replace the `style={{...}}` block on the header pill `<div>` with className-based glass:

```tsx
// Replace the inline style on the header pill div with:
className={cn(
  "flex items-center justify-between rounded-full transition-all duration-300 ease-out w-full",
  scrolled
    ? "mt-2 max-w-4xl min-h-[52px] py-1.5 px-4 sm:px-6 glass-frost"
    : "mt-3 max-w-5xl min-h-[60px] py-2.5 px-5 sm:px-8 bg-white/85 backdrop-blur-sm border border-s-ink/[0.05] shadow-elevation-1"
)}
// Remove the entire style={{...}} prop
```

**Nav icons** (line ~193): Make them slightly bigger and add an active dot indicator:
- Change icon size from `w-[18px] h-[18px]` to `w-5 h-5`
- Add a coral dot below the active icon:
```tsx
{isActive && (
  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-s-coral" />
)}
```

---

## Phase 2: Salon Card Redesign (Airbnb-Style)

### Target: `components/SalonCard.tsx`

The card is already well-structured (aspect-[3/2] image, category pills, heart button). Upgrade these specifics:

### 2A. No-Photo Fallback (line ~143-145)

**Current**: Shows just the first letter of salon name on empty bg.

**Replace with**: Category-colored gradient + centered icon:

```tsx
) : (
  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
    style={{
      background: `linear-gradient(135deg, ${CAT_COLOURS[salon.categories[0]]?.bg || 'rgba(232,98,74,.08)'} 0%, rgba(250,246,239,0.95) 100%)`
    }}>
    <Scissors className="w-8 h-8 text-s-ink/15" />
    <span className="text-xs font-body font-medium text-s-ink/25 uppercase tracking-wider">
      {salon.categories[0] || 'Salon'}
    </span>
  </div>
)
```

### 2B. Image Hover Zoom (line ~131)

**Current**: `aspect-[3/2]` with `img-hover-zoom`

**Upgrade**: Slow down the zoom to 500ms, change scale to 1.03 (subtler):
- In `globals.css`, update `.img-hover-zoom` transition from `400ms` to `500ms` and scale from `1.04` to `1.03`

### 2C. Card Shadow & Hover (the `.card-v4` class in globals.css)

**Update** `.card-v4` (line ~241-259):

```css
.card-v4 {
  background: #ffffff;
  border: 1px solid rgba(26, 18, 9, 0.05);
  border-radius: 16px;
  box-shadow: 0 1px 2px rgba(26, 18, 9, 0.04), 0 4px 12px rgba(26, 18, 9, 0.03);
  transition: box-shadow 400ms cubic-bezier(0.23, 1, 0.32, 1),
              transform 400ms cubic-bezier(0.23, 1, 0.32, 1);
}
.card-v4:hover {
  box-shadow: 0 4px 12px rgba(26, 18, 9, 0.06), 0 16px 40px rgba(26, 18, 9, 0.08);
  transform: translateY(-4px);
}
```

### 2D. Heart Button Animation

**Current** (line ~201-211): Basic scale hover.

**Add**: Keyframe bounce animation on toggle. Add to `globals.css`:

```css
@keyframes heartBounce {
  0%   { transform: scale(1); }
  15%  { transform: scale(1.3); }
  30%  { transform: scale(0.9); }
  50%  { transform: scale(1.1); }
  70%  { transform: scale(0.95); }
  100% { transform: scale(1); }
}
.heart-bounce {
  animation: heartBounce 0.5s cubic-bezier(0.23, 1, 0.32, 1);
}
```

Then in SalonCard, add `heart-bounce` class conditionally when `isFavorited` transitions to `true`.

### 2E. Skeleton Shimmer Card

**Create**: `components/ui/SalonCardSkeleton.tsx`

```tsx
export default function SalonCardSkeleton() {
  return (
    <div className="card-v4 overflow-hidden animate-pulse">
      <div className="aspect-[3/2] bg-s-bg-sunken rounded-t-card" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-s-bg-sunken rounded-full w-3/4" />
        <div className="h-3 bg-s-bg-sunken rounded-full w-1/2" />
        <div className="flex gap-2">
          <div className="h-3 bg-s-bg-sunken rounded-full w-12" />
          <div className="h-3 bg-s-bg-sunken rounded-full w-16" />
        </div>
      </div>
    </div>
  );
}
```

---

## Phase 3: Category Page Hero Overhaul

### Target: `components/CategoryPage.tsx`

### 3A. Compact Hero

**Current**: The hero section has no height constraint — title + search + filters all stack vertically, pushing content far down.

**Change**: 
- Wrap the hero area (breadcrumb + title + search + filter pills) in a container:
  ```tsx
  <div className="max-w-5xl mx-auto px-4 pt-8 pb-6">
  ```
- Make the title smaller on mobile: `text-4xl md:text-6xl` instead of the current oversized display
- Place search bar inline with title on desktop (flexbox row)

### 3B. Sticky Filter Toolbar

**Current**: Filters are inline in the page flow, always visible, taking a lot of vertical space.

**Change**: Make the filter section (ScrollableFilterRow + FilterBar pills) sticky:

```tsx
<div className="sticky top-[60px] z-40 glass-toolbar py-3">
  <div className="max-w-5xl mx-auto px-4">
    {/* filter pills here */}
  </div>
</div>
```

The `top-[60px]` aligns it just below the floating header pill.

### 3C. Category-Specific Filters Collapse

**Current** (the HAARTYP / FORM / STIL / BART sections): Always visible, take 3-4 rows of vertical space.

**Change**: Wrap in an expandable section:
```tsx
const [filtersExpanded, setFiltersExpanded] = useState(false);

{/* Toggle button */}
<button onClick={() => setFiltersExpanded(!filtersExpanded)}
  className="text-xs font-heading font-semibold text-s-coral hover:text-s-coral-hover transition-colors">
  {filtersExpanded ? t("lessFilters") : t("moreFilters")}
</button>

{/* Collapsible area */}
<AnimatePresence>
  {filtersExpanded && (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="overflow-hidden"
    >
      {/* HAARTYP, FORM, STIL, BART rows */}
    </motion.div>
  )}
</AnimatePresence>
```

### 3D. Background

Replace the `ambient-v4` class usage in CategoryPage with `ambient-v5`.

---

## Phase 4: Premium Micro-Animations

### 4A. Card Stagger Reveals — `components/CategoryPage.tsx`

When the salon grid renders cards, stagger them:

```tsx
// In the salon grid map:
{salons.map((salon, i) => (
  <motion.div
    key={salon.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{
      duration: 0.45,
      delay: i * 0.05,
      ease: [0.23, 1, 0.32, 1]
    }}
  >
    <SalonCard salon={salon} ... />
  </motion.div>
))}
```

### 4B. Filter Pill Press Feedback — `components/ui/FilterBar.tsx`

Add `active:scale-[0.96]` and `transition-transform duration-150` to filter pill buttons.

### 4C. Section Heading Reveals — `components/CategoryPage.tsx`

For headings like "Trending in Basel", "Unsere Barber", etc., use:

```tsx
<motion.h2
  initial={{ opacity: 0, x: -16 }}
  whileInView={{ opacity: 1, x: 0 }}
  viewport={{ once: true, margin: "-50px" }}
  transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
  className="font-heading font-bold text-2xl md:text-3xl text-s-ink dark:text-s-dm-text"
>
```

### 4D. Page-Level Transitions

In `globals.css`, add:

```css
/* V5 Smooth page content fade-in */
.page-enter {
  animation: v5PageIn 0.4s cubic-bezier(0.23, 1, 0.32, 1) forwards;
}
@keyframes v5PageIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

Apply `.page-enter` to the main content wrapper in CategoryPage.

---

## Phase 5: Footer Cleanup

### Target: `components/layout/Footer.tsx`

### 5A. Remove Decorative Blur Blob (line 27-28)

**Delete** these lines entirely:
```tsx
<div className="absolute top-0 right-0 w-[240px] h-[240px] rounded-full pointer-events-none"
  style={{ background: "rgba(232,98,74,.10)", filter: "blur(60px)" }} />
```

### 5B. Simplify Brand Banner (line 26-36)

Replace with a cleaner version:
```tsx
<div className="text-center py-16 border-b border-white/[0.06]">
  <h2 className="font-display text-7xl md:text-8xl tracking-wider text-white/90">
    SO<span className="text-s-coral">.</span>LEN
  </h2>
  <p className="font-body italic mt-3 text-sm text-white/40">
    {t("tagline")}
  </p>
</div>
```

### 5C. Link Columns — Tighter Typography

Change link font size from `text-xs` to `text-[13px]` across all 4 columns. Reduce `space-y-2` to `space-y-2.5` for slightly better readability.

---

## Phase 6: Filter & Search Polish

### 6A. `components/ui/FilterBar.tsx`

**Filter pills — glass unselected, coral selected**:
- Unselected: `bg-white/60 backdrop-blur-sm border border-s-ink/[0.06] text-s-ink/70`
- Selected/active: `bg-s-coral text-white border-s-coral shadow-coral-glow`
- Add `active:scale-[0.96] transition-all duration-200`

### 6B. `components/ui/SearchAutocomplete.tsx`

**Search dropdown**:
- Apply `glass-frost` to the dropdown container
- Add `shadow-v5-float` to the dropdown
- Each result row: salon avatar (40px circle) + name (bold) + category tag (pill) + distance
- Highlighted row: `bg-s-coral/[0.06]` background

### 6C. `components/ui/HomeSearchBar.tsx`

- Apply `glass-search` class to the search input container
- On focus: coral border glow (already handled by `.glass-search:focus-within`)
- Placeholder text: `italic text-s-ink/35`

---

## Phase 7: Homepage Sections (When `.env.local` is configured)

### Target: `components/HomePage.tsx`

### 7A. Hero Section
- Category grid: Change from rectangular cards to circular icons with labels below
  ```tsx
  <div className="grid grid-cols-3 md:grid-cols-6 gap-6">
    {categories.map(cat => (
      <Link key={cat.key} href={...} className="flex flex-col items-center gap-2 group">
        <div className="w-16 h-16 rounded-full bg-s-bg-sunken flex items-center justify-center group-hover:bg-s-coral/10 group-hover:scale-105 transition-all duration-300">
          <cat.Icon className="w-7 h-7 text-s-ink/50 group-hover:text-s-coral transition-colors" />
        </div>
        <span className="text-xs font-heading font-medium text-s-ink/60 group-hover:text-s-coral">
          {cat.label}
        </span>
      </Link>
    ))}
  </div>
  ```

### 7B. Featured Salons Carousel
- Horizontal scroll with `overflow-x-auto scrollbar-hide`
- Cards peek from the edge (last card partially visible)
- `scroll-snap-type: x mandatory` + `scroll-snap-align: start` on each card

### 7C. Deals Section — `components/LastMinuteCard.tsx`
- Already updated to V4 (rounded-card, shadow-elevation-2)
- Add: time ribbon as a coral banner across the top of the card
- Add: price badge floating bottom-right with `shadow-elevation-2`

### 7D. Partner CTA Banner
- Keep the gradient but add a glass-frost text box overlay:
  ```tsx
  <div className="glass-frost rounded-card-lg p-6 md:p-8 max-w-md">
    <h3>...</h3>
    <p>...</p>
    <button>...</button>
  </div>
  ```

---

## Execution Order

```
1. Phase 1A-1C → CSS/Tailwind foundation (no component changes)
2. Phase 1D → Header glass-frost
3. Phase 5 → Footer cleanup (quick win)
4. Phase 2 → SalonCard redesign
5. Phase 3 → CategoryPage hero + sticky filters
6. Phase 4 → Micro-animations
7. Phase 6 → Filter/Search polish
8. Phase 7 → Homepage (needs .env.local)
```

## Testing

After each phase, verify on:
- `http://localhost:3000/de/coiffeur` (category page with filters)
- `http://localhost:3000/de/barbershop` (has walk-in banner + specialized filters)
- `http://localhost:3000/de/nails` (has form/material/style filters)
- `http://localhost:3000/de` (homepage — only works with `.env.local`)

## Files Reference

| File | Lines | Purpose |
|------|-------|---------|
| `app/globals.css` | 513 | Design tokens, glass utilities, animations |
| `tailwind.config.js` | 141 | Shadows, radii, colors, timing functions |
| `components/layout/Header.tsx` | 453 | Floating pill header, nav icons, mobile menu |
| `components/layout/Footer.tsx` | 197 | Footer with brand banner, link columns |
| `components/SalonCard.tsx` | 341 | Listing card (default + compact variants) |
| `components/CategoryPage.tsx` | 522 | Category page layout (hero, filters, grid) |
| `components/HomePage.tsx` | 650 | Homepage sections |
| `components/LastMinuteCard.tsx` | 106 | Deal/last-minute slot card |
| `components/ui/FilterBar.tsx` | ~200 | Filter pill toolbar |
| `components/ui/SearchAutocomplete.tsx` | ~400 | Search with autocomplete dropdown |
| `components/ui/HomeSearchBar.tsx` | ~350 | Homepage search bar |
| `components/ui/ScrollableFilterRow.tsx` | ~180 | Horizontal scrollable filter chips |
| `components/ui/GlassCard.tsx` | ~35 | Glass card utility (elevated variant) |

---

## Phase 8: `transition-all` Purge (~70+ occurrences)

> **Rule**: `transition-all` is BANNED by V5 §21-A. Always specify exact CSS properties.

### Replacement rules:
| Context | Replace `transition-all` with |
|---|---|
| Card hover (lift + shadow) | `transition-[transform,box-shadow]` |
| CTA buttons (brightness + scale) | `transition-[transform,filter]` |
| Form inputs (focus ring + border) | `transition-[border-color,box-shadow]` |
| Color-only changes (tabs, pills) | `transition-colors` |
| Opacity-only changes (tooltips) | `transition-opacity` |
| Size-only changes (progress bars) | `transition-[width]` or specific property |

### Priority order (fix first → last):
1. **Customer-facing cards**: `SalonCard.tsx`, `HomePage.tsx`, `LastMinuteCard.tsx`
2. **Salon profile**: `app/[locale]/salon/[slug]/page.tsx` (8+ occurrences)
3. **Booking flow**: `checkout/page.tsx`, `TerminePage.tsx`
4. **Onboarding steps**: `ServicesStep.tsx` (3), `PaymentsStep.tsx` (2), `OpeningHoursStep.tsx` (2), `ScheduleStep.tsx` (2), `TeamStep.tsx` (2), `SalonProfileStep.tsx` (2), `GoLiveStep.tsx` (1), `SetupWizard.tsx` (2)
5. **Dashboard admin tabs**: `nail-admin`, `spa-admin`, `barber-ops`, `coiffeur-crm`, `waxing-admin`, `makeup-admin`
6. **Other pages**: `vouchers/buy`, `partner`, `warum-solen`, `tip/[bookingId]`, `not-found.tsx`
7. **UI primitives**: `interactive-hover-button.tsx`, `date-picker.tsx`, `CitySelector.tsx`, `ExpandableTabs.tsx`, `ProgressDots.tsx`, `ImageUploader.tsx`, `HeroVisualCard.tsx`
8. **Layout**: `Header.tsx`, `DeviceFrame.tsx`
9. **Search/Map**: `SearchResultGrid.tsx`, `MobileViewToggle.tsx`, `ClientSelectorDropdown.tsx`
10. **Loyalty/Review**: `StampCard.tsx`, `ReviewForm.tsx`, `ReviewBreakdown.tsx`

---

## Phase 9: Glass Standardization (39 files)

> **Rule**: V5 uses `.glass-frost`, `.glass-search`, `.glass-toolbar` CSS classes. No inline glass.

### 9A. Convert floating UI to `.glass-frost`:
| File | Context |
|---|---|
| `GlassModal.tsx` | Modal overlay → `.glass-frost` |
| `SearchAutocomplete.tsx` | Dropdown → `.glass-frost` |
| `FilterBottomSheet.tsx` | Bottom sheet (Zone 1/2) → `.glass-frost` |
| `BottomSheet.tsx` | Generic sheet → `.glass-frost` |
| `QuickPreviewSheet.tsx` | Preview → `.glass-frost` |
| `CookieBanner.tsx` | Banner → `.glass-frost` |
| `NotificationBell.tsx` | Dropdown → `.glass-frost` |
| `compare/CompareBar.tsx` | Sticky bar → `.glass-toolbar` |
| `compare/CompareDrawer.tsx` | Drawer → `.glass-frost` |
| `coiffeur/AiMatcherModal.tsx` | Modal → `.glass-frost` |

### 9B. Convert search inputs to `.glass-search`:
| File | Context |
|---|---|
| `HomeSearchBar.tsx` | Search input container → `.glass-search` |

### 9C. Remove glass from Zone 3/4 (use solid surface):
> **Zone violations** — these MUST NOT have glass.

| File | Zone | Fix |
|---|---|---|
| `dashboard/WalkInModal.tsx` | Zone 4 | Remove `backdrop-blur`/glass → solid `bg-white dark:bg-s-dm-surface` |
| `dashboard/PriceAdjustmentModal.tsx` | Zone 4 | Remove glass → solid surface |
| `dashboard/CommandPalette.tsx` | Zone 4 | Remove glass → solid surface |
| `booking/GroupBookingModal.tsx` | Zone 3 | Remove glass → solid surface |

### 9D. Evaluate for retirement:
| File | Decision |
|---|---|
| `GlassCard.tsx` | Retire if only used for content cards (V5 uses `.card-v4` for content) |

---

## Phase 10: Hover Pattern + Radius Cleanup

### 10A. Old hover lift → V5 pattern (9 files):
> Change `hover:-translate-y-[5px]` → `hover:-translate-y-1` + V5 easing

| File | Fix |
|---|---|
| `ServiceTile.tsx` | `hover:-translate-y-1 transition-[transform,box-shadow] duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)]` |
| `nail/NailsSections.tsx` | Same pattern |
| `discovery/ForYouSection.tsx` | Same pattern |
| `discovery/SimilarStyles.tsx` | Same pattern |
| `coiffeur/CoiffeurSections.tsx` | Same pattern |
| `booking/StaffPicker.tsx` | Same pattern |
| `barber/BarbershopSections.tsx` | Same pattern |
| `salon/StaffSection.tsx` | Same pattern |
| `salon/[slug]/page.tsx` L830 | Same pattern |

### 10B. `rounded-full` → `rounded-pill` on interactive elements:
| File | Line(s) | Fix |
|---|---|---|
| `ScrollableFilterRow.tsx` | L102, L125 | `rounded-pill` |
| `TrustBadges.tsx` | L20 | `rounded-pill` |
| `SolenExclusiveBadge.tsx` | L24 | `rounded-pill` |
| `DiscoverCarousel.tsx` | L96, L103 | `rounded-pill` (nav buttons) |

> **Leave `rounded-full` alone** for: avatars, spinners, dots, range thumbs, skeletons, decorative circles.

---

## Phase 11: Misc Cleanup

### 11A. `ambient-v4` → `ambient-v5`:
| File | Fix |
|---|---|
| `components/HomePage.tsx` | Replace `ambient-v4` className with `ambient-v5` |
| `components/CategoryPage.tsx` | Replace `ambient-v4` className with `ambient-v5` |

### 11B. Fix generic shadow:
| File | Line | Fix |
|---|---|---|
| `Header.tsx` | L189 | Tooltip `shadow-lg` → `shadow-elevation-3` |

### 11C. Fix slow animation:
| File | Line | Fix |
|---|---|---|
| `HomePage.tsx` | L234 | Glow gradient `duration-700` → `duration-[400ms]` |

### 11D. Update comments:
| File | Line | Fix |
|---|---|---|
| `HomePage.tsx` | L25 | `// BlobBackground removed — V4 uses ambient-v4` → `// V5 uses ambient-v5 gradients` |
| `CategoryPage.tsx` | L17 | Same update |

---

## Progress Tracker

| Phase | Status | Notes |
|---|---|---|
| Phase 1A — Glass tokens in CSS | ✅ Done | `.glass-frost`, `.glass-search`, `.glass-toolbar` |
| Phase 1B — Ambient V5 gradient | ✅ Done | `.ambient-v5` added |
| Phase 1C — V5 shadow tokens | ✅ Done | `shadow-v5-card/hover/float/glow-coral` |
| Phase 1D — Header glass-frost | ✅ Done | Inline glass → `.glass-frost` class |
| Phase 2 — SalonCard redesign | ⬜ Pending | |
| Phase 3 — CategoryPage hero | ⬜ Pending | |
| Phase 4 — Micro-animations | ⬜ Pending | |
| Phase 5 — Footer cleanup | ⬜ Pending | |
| Phase 6 — Filter/Search polish | ⬜ Pending | |
| Phase 7 — Homepage | ⬜ Pending | Needs `.env.local` |
| Phase 8 — transition-all purge | ⬜ Pending | ~70+ files |
| Phase 9 — Glass standardization | ⬜ Pending | 39 files |
| Phase 10 — Hover/radius cleanup | ⬜ Pending | 9 + 4 files |
| Phase 11 — Misc cleanup | ⬜ Pending | 6 small fixes |

