# R2: Mobile UX, Touch Targets & Interaction Polish

> **Scope**: 120 issues | **Files**: ~50 components | **Conflicts**: None if R1 runs first or in parallel on different files
> **Agent session**: Separate Claude Code window

---

## Phase 2.1: Touch Target Audit & Fix (44px minimum)

**Goal**: Every interactive element on mobile is at least 44x44px.

**Files to fix** (each with specific line-level changes):

1. **ReviewPrompt.tsx** — Close button `p-1` (line ~82) → `p-3` (48px)
2. **BottomTabBar.tsx** — Login sheet close `w-9 h-9` (line ~145) → `w-11 h-11`
3. **SalonBadge.tsx** — Badge tap area too small → wrap in `min-w-[44px] min-h-[44px]` container
4. **SalonCard.tsx** — Arrow buttons (line ~296) → ensure `w-10 h-10` minimum with `p-2` padding
5. **SalonCard.tsx** — Favorite heart (line ~248) — verify `min-w-[44px] min-h-[44px]` on the button itself, not just style
6. **FeaturedSalonCarousel.tsx** — Heart button actual clickable area 32px → fix padding to achieve 44px
7. **StaffSection.tsx** — Language tags `text-[9px]` (line ~98) → increase to `text-xs` with `py-1 px-2` minimum
8. **FilterBar.tsx** — Remove filter button → add `p-2` minimum padding
9. **DatePicker.tsx** — Calendar cells `w-9 h-9` → `w-11 h-11` (44px)
10. **CategoryTabBar.tsx** — Tab text 11px → `text-xs` (12px) with `py-3 px-4` tap area
11. **SalonTabBar.tsx** — Tab labels `text-[14px]` → ensure container is 44px tall
12. **SearchBar.tsx** — Clear button if present → minimum 44px

**Verification per file**: Measure with Chrome DevTools computed styles. Every button/link ≥ 44x44px.

---

## Phase 2.2: Mobile Layout Fixes

**Goal**: No horizontal overflow, no content hidden by fixed elements, proper safe areas.

**Fixes**:

1. **SalonMobileCTA.tsx** — Add `pb-[calc(env(safe-area-inset-bottom)+80px)]` to salon page content container so CTA doesn't overlap last section
2. **Header.tsx** — Profile dropdown `w-52` (208px) overflows on <280px → add `max-w-[calc(100vw-32px)]` and `right-0`
3. **Header.tsx** — Padding top jump `pt-4`/`pt-6` on scroll → add `transition-[padding] duration-200`
4. **BottomTabBar.tsx** — Verify safe area inset works on actual iOS devices. Add fallback `pb-4` if env() unsupported
5. **TestimonialCarousel.tsx** — Fixed `w-[300px]` cards → `w-[85vw] max-w-[300px]` for mobile
6. **RecentlyViewed.tsx** — Thumbnail `w-[160px]` → `w-[140px] sm:w-[160px]`
7. **StaffSection.tsx** — Staff card `w-[200px]` → `w-[160px] sm:w-[200px]`
8. **ChatWindow.tsx** — Message bubble `max-w-[75%]` → `max-w-[85%] lg:max-w-[60%]` (mobile needs more width, desktop needs less)
9. **ChatWindow.tsx** — Message input hidden by mobile keyboard → add `position: sticky; bottom: 0` with keyboard detection
10. **MapView.tsx** — `min-h-[400px]` → `min-h-[280px] md:min-h-[400px]` (shorter on mobile)
11. **CategoryPage.tsx** — Skeleton shows 8 items but grid is 1-2 columns on mobile → match skeleton count to `grid-cols-1 sm:grid-cols-2` (show 4 on mobile)
12. **LooksGrid.tsx** — `grid-cols-3` on all breakpoints → `grid-cols-2 sm:grid-cols-3`
13. **BeautyProfileCard.tsx** — Five sections identical → add collapsible accordion on `sm:` breakpoint
14. **TipPage.tsx** — CHF prefix misaligned → use `flex items-center` with `pl-12` on input
15. **ProfileHero.tsx** — Avatar 90px → `w-16 h-16 sm:w-20 sm:h-20` (64px mobile, 80px desktop)
16. **DashboardPage.tsx** — Today's bookings table text 10px → `text-xs` (12px) minimum
17. **DashboardPage.tsx** — 4-column stat cards cramped → `grid-cols-2 lg:grid-cols-4`

**Verification**: Open Chrome DevTools → Device Toolbar → iPhone SE (375px), iPhone 12 (390px), iPad (768px). No horizontal scroll. No overlapping elements.

---

## Phase 2.3: Scroll & Swipe Polish

**Goal**: All horizontal scroll containers feel native. Snap points, momentum, indicators.

**Fixes**:

1. **All horizontal scroll containers** — Add `-webkit-overflow-scrolling: touch` (iOS momentum) and `overscroll-behavior-x: contain`
2. **SalonHighlights.tsx** — Add scroll fade indicators (gradient overlay on left/right edges when content overflows)
3. **StaffSection.tsx** — Add scroll indicator (subtle dots or fade edges)
4. **CategoryPage.tsx** — City pill bar → add `snap-x snap-mandatory` with `snap-start` on each pill
5. **FilterBar.tsx** — Pill row → add snap points so scroll stops cleanly between pills
6. **Header.tsx** — Mobile category strip → add snap-x
7. **FeaturedSalonCarousel.tsx** — Already has snap → verify it works on iOS Safari
8. **MapView.tsx** — Category chips → add momentum scrolling on iOS
9. **SalonTabBar.tsx** — Tab scroll → add smooth `scrollIntoView` with `block: 'nearest'` on active tab
10. **CategoryTabBar.tsx** — Same: smooth scroll active tab into view

**Verification**: Test on actual iPhone or Safari simulator. Scrolling feels native. Snap is smooth.

---

## Phase 2.4: Hover & Press States (Every Interactive Element)

**Goal**: Consistent interaction feedback across the entire site. Cards lift. Buttons press. Links highlight.

**Standard patterns to apply everywhere**:

**Cards** (SalonCard, LastMinuteCard, StaffSection card, BookingCard, etc.):
```
hover:-translate-y-[5px] hover:shadow-elevation-3
active:scale-[0.98]
transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]
```

**Primary CTA Buttons** (coral bg):
```
hover:brightness-[1.08] active:scale-[0.97]
transition-[transform,filter] duration-150
```
Note: brightness bumped from 1.06 to 1.08 — the old value was imperceptible.

**Secondary/Ghost Buttons**:
```
border border-s-ink/10 text-s-ink/70
hover:border-s-coral/40 hover:text-s-coral
active:scale-[0.97]
transition-[transform,border-color,color] duration-150
```

**Icon Buttons** (hearts, close, menu):
```
hover:bg-s-ink/[0.06] dark:hover:bg-white/[0.08]
active:scale-[0.92]
transition-[transform,background-color] duration-150
```

**Text Links**:
```
hover:text-s-coral transition-colors duration-150
```
Note: NOT `hover:text-s-ink/60` (too subtle). Use coral for clear feedback.

**Files to update**:
1. SalonCard.tsx — card hover, heart button, arrows, dots
2. LastMinuteCard.tsx — card hover
3. BookingCard.tsx — card hover, action buttons
4. StaffSection.tsx — staff card hover
5. SalonReviews.tsx — review card hover, sort buttons, flag button
6. CategoryPage.tsx — city pills, load more, map toggle
7. HomePage.tsx — rebook card, partner CTA, all links
8. Header.tsx — profile button, search pill, nav tabs
9. Footer.tsx — all links
10. All buttons across all components — verify press state exists

**Verification**: Tab through every page with keyboard. Every focusable element has visible `focus-visible:ring-2 focus-visible:ring-s-coral` ring.

---

## Phase 2.5: Focus States & Keyboard Navigation

**Goal**: WCAG AAA keyboard navigation. Every interactive element focusable with visible ring.

**Global fix**: In `globals.css`, ensure this exists:
```css
*:focus-visible {
  outline: none;
  ring: 2px;
  ring-color: #E8624A; /* s-coral */
  ring-offset: 2px;
}
```

**Specific fixes**:
1. **All icon buttons** — Add `focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-2`
2. **SalonCard.tsx** — Arrow buttons need `tabIndex={0}` and keyboard event handlers
3. **BottomSheet.tsx** — Drag handle needs `role="button"` and `tabIndex={0}`
4. **FilterBar.tsx** — Buttons `aria-pressed` + `onClick` needs `onKeyDown` handler for Enter/Space
5. **All modals** — Verify focus trap works (GlassModal has it, BottomSheet doesn't)
6. **SearchBar.tsx** — Focus adds ring but also needs subtle bg change for stronger signal
7. **DatePicker.tsx** — Calendar cells need visible focus within grid
8. **ChatWindow.tsx** — Translate button `opacity-0 group-hover` → also show on `group-focus-within`

**Verification**: Navigate entire site with Tab key only. Every element reachable. Focus ring always visible (not obscured by z-index).

---

## Phase 2.6: Safe Areas & Viewport Edge Cases

**Goal**: Site works on iPhone notch, Dynamic Island, home indicator area, and landscape.

**Fixes**:
1. **BottomTabBar.tsx** — Verify `env(safe-area-inset-bottom)` + add `pb-[max(16px,env(safe-area-inset-bottom))]`
2. **SalonMobileCTA.tsx** — Same safe area treatment
3. **BottomSheet.tsx** — Content padding should account for bottom safe area
4. **Header.tsx** — Add `env(safe-area-inset-top)` for notch devices
5. **GlassModal.tsx** — Modal should not extend into notch area
6. **All fixed position elements** — Verify they don't overlap Dynamic Island on iPhone 14+

**Verification**: Test in Safari iOS simulator with "safe area" enabled. No content hidden.

---

## Commit Strategy

- **2.1**: `"fix: enforce 44px minimum touch targets sitewide"`
- **2.2**: `"fix: mobile layout — no overflow, safe areas, responsive grids"`
- **2.3**: `"fix: scroll containers — snap points, momentum, indicators"`
- **2.4**: `"fix: hover/press/active states on all interactive elements"`
- **2.5**: `"fix: keyboard focus states WCAG AAA compliant"`
- **2.6**: `"fix: safe area insets for notch/Dynamic Island devices"`

## File Ownership (No Conflicts with Other Roadmaps)

This roadmap primarily touches: interaction classes, layout classes, padding/sizing.
It does NOT change: colors, shadows, fonts, translations, animation timing, component structure.

If R1 is running in parallel: R1 changes color tokens, R2 changes layout/interaction classes. No overlap.
