# R5: Navigation Overhaul & Salon Detail Page Fix

> **Scope**: 70 issues | **Files**: ~15 | **Conflicts**: Touches Header.tsx, salon/ components
> **Agent session**: Separate Claude Code window
> **Dependency**: Run AFTER R1 (design tokens) has processed Header.tsx and salon/ files. Or coordinate file locks.

---

## Phase 5.1: Header Navigation — Airbnb Icon Style

**Goal**: Replace emoji tabs with clean SVG category icons + text underline. Kill visual noise.

**Current state**: Header has emoji tabs (✂️💅💈💄🍯) on both mobile and desktop. These look unprofessional.

**New design**:
- **Desktop**: Category row with SVG icons (already have CoiffeurIcon, BarberIcon, etc.) + text label below + active underline
- **Mobile**: Same icons but smaller, in horizontally scrollable row. NO emojis.
- **Remove**: The separate `CategoryStickyRow.tsx` that duplicates navigation

**Steps**:

1. **Header.tsx — Desktop emoji tabs (lines ~215-244)**: Replace emoji array with icon components:
```tsx
const HEADER_CATEGORIES = [
  { key: "coiffeur", Icon: CoiffeurIcon, label: t("coiffeur") },
  { key: "nails", Icon: NailsIcon, label: t("nails") },
  { key: "barbershop", Icon: BarberIcon, label: t("barbershop") },
  { key: "spa", Icon: SpaIcon, label: t("spa") },
  { key: "makeup", Icon: MakeupIcon, label: t("makeup") },
  { key: "waxing", Icon: WaxingIcon, label: t("waxing") },
];
```
Each renders as:
```tsx
<Link className="flex flex-col items-center gap-1 group py-2 relative">
  <Icon width={24} height={24} className={cn(
    "transition-colors duration-150",
    isActive ? "text-s-ink" : "text-s-ink/50 group-hover:text-s-ink/70"
  )} />
  <span className={cn(
    "text-xs font-body font-medium whitespace-nowrap transition-colors duration-150",
    isActive ? "text-s-ink" : "text-s-ink/50 group-hover:text-s-ink/70"
  )}>
    {label}
  </span>
  {/* Active underline indicator */}
  {isActive && (
    <motion.div layoutId="header-tab-indicator"
      className="absolute bottom-0 left-0 right-0 h-0.5 bg-s-ink rounded-full"
      transition={{ type: "tween", duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
    />
  )}
</Link>
```

2. **Header.tsx — Category page tabs (lines ~266-301)**: Same icon treatment. Remove emoji rendering.

3. **Header.tsx — Mobile category strip (lines ~398-428)**: Replace emoji pills with icon+text pills:
```tsx
<Link className={cn(
  "flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-heading font-semibold whitespace-nowrap shrink-0 transition-all duration-150",
  isActive
    ? "bg-s-ink text-white"
    : "bg-s-ink/[0.05] text-s-ink/55 hover:bg-s-ink/[0.09]"
)}>
  <Icon width={16} height={16} />
  {label}
</Link>
```

4. **Remove CategoryStickyRow.tsx** usage if it duplicates header nav. If it serves a unique purpose (appears when hero scrolls out of view), keep it but ensure it uses same icon system.

5. **Bottom Tab Bar stays unchanged** — it handles core nav (Home, Search, Saved, Profile), not categories.

**Verification**: Desktop header shows clean SVG icons with underline. Mobile shows icon+text pills. No emojis anywhere in navigation.

---

## Phase 5.2: Salon Detail — De-duplicate Navigation

**Goal**: ONE navigation system on the salon page. Remove redundancy.

**Current state**: SalonTabBar AND SalonSectionNav both exist and are both sticky. Confusing.

**Decision**: Keep `SalonSectionNav` (the one with section detection via IntersectionObserver) and remove/merge `SalonTabBar`.

**Steps**:
1. Read both components to understand differences
2. If SalonTabBar has features SalonSectionNav doesn't → merge them into SalonSectionNav
3. Remove SalonTabBar import from salon page
4. SalonSectionNav improvements:
   - Active tab styling: not just `font-semibold` → add coral underline indicator with `layoutId`
   - Better section detection margin: `-80px 0px -40%` instead of `-120px 0px -60%`
   - Add debounce to `getBoundingClientRect` calls
   - Make scrollbar visible as subtle fade indicators
   - Add keyboard tab navigation support
5. Standardize scroll margins across all sections:
   - `scroll-mt-[80px]` everywhere (not mix of 100px and 180px)

**Verification**: Salon page has ONE sticky nav. Clicking sections scrolls smoothly. Active section highlights correctly.

---

## Phase 5.3: Salon Detail — Single CTA Strategy

**Goal**: ONE clear booking CTA. Not three competing ones.

**Current state**: BookingSidebar (desktop), SalonMobileCTA (mobile bottom bar), and SalonTabBar (tab CTA) all say "book now".

**Decision**:
- **Desktop**: BookingSidebar remains as sticky sidebar. Remove "book now" from any tab/nav.
- **Mobile**: SalonMobileCTA remains as bottom fixed bar. Remove any booking button from mobile nav.
- **TabBar**: NO booking CTA in the section nav — it's for navigation, not actions.

**Steps**:
1. Remove any "Book now" button from SalonSectionNav/SalonTabBar
2. Ensure SalonMobileCTA only shows on mobile (`lg:hidden`)
3. Ensure BookingSidebar only shows on desktop (`hidden lg:block`)
4. SalonMobileCTA improvements:
   - Add smooth slide-up entrance animation (currently instant)
   - Show open/closed status (currently missing — sidebar has it but mobile doesn't)
   - Fix safe area bottom padding
   - Ensure it doesn't cover the last section of content → add `pb-24` to salon page mobile content
5. BookingSidebar improvements:
   - Replace hardcoded German with i18n keys
   - Fix open/closed color indicators to use design tokens
   - Add loading state for calendar

**Verification**: Desktop: sidebar CTA only. Mobile: bottom bar CTA only. No duplication.

---

## Phase 5.4: Salon Detail — Loading Skeleton

**Goal**: Salon page shows a proper skeleton while data loads. No empty white screen.

**Steps**:
1. Create `components/salon/SalonPageSkeleton.tsx`:
```tsx
export default function SalonPageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Hero skeleton */}
      <Skeleton variant="card" className="w-full aspect-[16/7] rounded-card-lg mb-8" />
      
      {/* Title + rating */}
      <div className="space-y-3 mb-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      
      {/* Tab bar skeleton */}
      <div className="flex gap-4 mb-6">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-8 w-20 rounded-pill" />)}
      </div>
      
      {/* Content + sidebar grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
        <div className="space-y-6">
          {[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-card" />)}
        </div>
        <div className="hidden lg:block">
          <Skeleton className="h-64 rounded-card sticky top-24" />
        </div>
      </div>
    </div>
  );
}
```

2. Use in `app/[locale]/salon/[slug]/page.tsx` with Suspense or loading state
3. Ensure skeleton aspect ratios match actual content (prevent CLS)

**Verification**: Navigate to salon page. Skeleton appears immediately. Content replaces it without layout shift.

---

## Phase 5.5: Salon Detail — Section Spacing & Consistency

**Goal**: All sections have consistent spacing, backgrounds, and visual rhythm.

**Steps**:
1. Standardize section padding: `py-6` (24px) between all sections
2. Standardize section borders: `border-t border-s-ink/[0.06] dark:border-white/[0.06]` between sections
3. Remove inconsistent max-width values — use one `max-w-6xl` throughout
4. Ensure grid gap between content and sidebar is consistent: `gap-8 lg:gap-12`
5. Fix background color inconsistency — all sections use `bg-transparent` (page bg handles it)
6. Add subtle section transition animations for Zone 2 content (slide-up on scroll)

**Verification**: Salon page has even visual rhythm. Consistent spacing. Professional look.

---

## Commit Strategy

- **5.1**: `"refactor: header navigation — replace emojis with Airbnb-style SVG icons + underline"`
- **5.2**: `"fix: salon detail — single navigation (remove SalonTabBar duplicate)"`
- **5.3**: `"fix: salon detail — single CTA strategy (no competing book buttons)"`
- **5.4**: `"feat: salon detail loading skeleton"`
- **5.5**: `"fix: salon detail — consistent section spacing and visual rhythm"`
