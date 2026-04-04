# R7: Loading States, Empty States, Image Fallbacks & Component Polish

> **Scope**: 90 issues | **Files**: ~45 | **Conflicts**: Minimal — mostly adding new skeleton/empty/fallback components
> **Agent session**: Separate Claude Code window

---

## Phase 7.1: Image Fallback System — Blur Placeholder

**Goal**: Every image card shows a warm blurred placeholder when no photo exists. No broken images. No stock feel.

**Create `components/ui/ImageFallback.tsx`**:
```tsx
interface ImageFallbackProps {
  category?: string;
  salonName?: string;
  className?: string;
}

export default function ImageFallback({ category, salonName, className }: ImageFallbackProps) {
  // Generate warm blur gradient based on category
  const gradients: Record<string, string> = {
    coiffeur: 'from-[#E8D5C4] via-[#D4A574] to-[#C4956A]',
    barbershop: 'from-[#D4C4B0] via-[#B8A08C] to-[#A08868]',
    nails: 'from-[#F0D4D4] via-[#E8B4B4] to-[#D4949E]',
    spa: 'from-[#D4E8D4] via-[#B4D4B4] to-[#94B894]',
    makeup: 'from-[#E8D4E0] via-[#D4B4C8] to-[#C494B0]',
    waxing: 'from-[#F0E0C4] via-[#E8D0A4] to-[#D4B888]',
  };
  const gradient = gradients[category ?? ''] ?? 'from-[#EDE5D8] via-[#D4C4B0] to-[#C4B098]';

  return (
    <div className={cn(
      "relative overflow-hidden bg-gradient-to-br",
      gradient,
      className
    )}>
      {/* Warm noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.08]"
        style={{ backgroundImage: 'url("/textures/noise.svg")', backgroundSize: '200px' }}
      />
      {/* Subtle brand initial */}
      {salonName && (
        <span className="absolute inset-0 flex items-center justify-center font-display text-white/20 text-6xl select-none">
          {salonName[0]}
        </span>
      )}
    </div>
  );
}
```

**Integration points**:
1. **SalonCard.tsx** — When `!photo`: render `<ImageFallback category={salon.category} salonName={salon.name} className="aspect-[4/5]" />`
2. **FeaturedSalonCarousel.tsx** — Same fallback for missing hero photos
3. **SalonHero.tsx** — When no photos at all: full-width blur fallback with salon initial
4. **StaffSection.tsx** — Staff avatar fallback: warm gradient circle with initial
5. **SalonHighlights.tsx** — Salon thumbnail fallback
6. **RecentlyViewed.tsx** — Recently viewed thumbnail fallback

**Create noise texture**: Generate a small SVG noise pattern at `public/textures/noise.svg` (or use CSS filter: `url("data:image/svg+xml...")`)

**Verification**: Navigate to salons without photos. Cards show warm blurred gradient, not broken images or empty space.

---

## Phase 7.2: Loading Skeletons for Every Async Section

**Goal**: Every section that fetches data shows a skeleton loader. No empty space. No layout shift.

**New skeletons to create**:

1. **SalonCardSkeleton** — Already have `<Skeleton variant="card" />`. Verify it matches SalonCard dimensions exactly (aspect-[4/5] photo + text below).

2. **SalonPageSkeleton** (from R5, but also create here if R5 hasn't run):
   - Hero: `aspect-[16/7] rounded-card-lg`
   - Title: `h-8 w-2/3` + `h-4 w-1/3`
   - Tab bar: 4 pills
   - Content: 3 card-shaped blocks
   - Sidebar: 1 tall card (desktop only)

3. **ReviewsSkeleton**:
   - 3 review cards with: avatar circle + name line + star row + text lines
   
4. **ServicesSkeleton**:
   - 5 service items: name line + price line + duration badge

5. **StaffSkeleton**:
   - 4 horizontal scroll cards: avatar + name + specialty line

6. **BookingCalendarSkeleton**:
   - Calendar grid: 7x5 cells
   - Time slot row: 6 pills

7. **DashboardSkeleton**:
   - 4 stat cards + booking table with 5 rows
   
8. **ProfileSkeleton**:
   - Avatar circle + name + tabs + content grid

**Integration**: Each section component should show its skeleton during loading state (check for `isLoading`, `!data`, or Suspense boundary).

**CLS prevention**: Every skeleton must have EXACT same dimensions as the loaded content. Measure with DevTools.

**Verification**: Navigate between pages. Skeletons appear immediately. Content replaces skeleton without layout jump.

---

## Phase 7.3: Empty States for Every List/Grid

**Goal**: When a list has zero items, show a branded empty state with helpful CTA. Never show blank space.

**Empty states to add/fix**:

1. **CategoryPage.tsx** — No salons in category: 
   - Icon: category-specific lucide icon
   - Title: `t('noSalonsInCategory')`
   - Message: `t('noSalonsInCategoryMessage')`
   - CTA: "Browse all categories" button

2. **SalonServices.tsx** — No services: 
   - Icon: Scissors
   - Title: `t('noServicesYet')`
   - Message: `t('noServicesMessage')`

3. **SalonReviews.tsx** — No reviews (line ~157): 
   - Replace plain `<p>` text with `<EmptyState>`
   - Icon: Star
   - Title: `t('noReviewsYet')`  
   - CTA: "Be the first to review" (if user has booking)

4. **BookingsList.tsx** — No bookings:
   - Icon: CalendarDays
   - Title: `t('noBookingsYet')`
   - CTA: "Discover salons"

5. **ChatWindow.tsx** — No messages:
   - Icon: MessageCircle
   - Title: `t('noMessagesYet')`
   - Message: `t('startConversation')`

6. **RecentlyViewed.tsx** — No recently viewed:
   - Don't render the section at all (current behavior is fine)

7. **FeaturedSalonCarousel.tsx** — Fallback already uses DEMO_SALONS. Keep but ensure demo data looks realistic.

8. **MapView.tsx** — No results in viewport:
   - Overlay message: "No salons in this area. Try zooming out."

9. **DiscoverPage** — No content:
   - Icon: Compass
   - Title: `t('noContentYet')`
   - CTA: "Set up your beauty profile"

10. **ProfilePage** — No favorites/looks:
    - Each tab gets its own empty state with relevant icon and CTA

**All empty states must use `<EmptyState>` component** with:
- `icon` prop (lucide icon)
- `title` prop (translated)
- `message` prop (translated, optional)
- `action` prop (CTA button, optional)
- `zone` prop (determines if animated)

**Verification**: For each list, temporarily return empty array from API. Empty state renders correctly with icon, title, and CTA.

---

## Phase 7.4: Error States

**Goal**: Every API call has a visible error state. No silent failures. No console-only errors.

**Pattern to implement everywhere**:
```tsx
const [error, setError] = useState<string | null>(null);

// In fetch:
.catch((err) => {
  console.error("[ComponentName] error:", err);
  setError(t('common.error'));
});

// In render:
{error && (
  <div className="flex items-center gap-2 p-3 rounded-input bg-s-error/10 text-s-error text-sm">
    <AlertCircle size={16} />
    <span>{error}</span>
    <button onClick={() => { setError(null); refetch(); }} className="ml-auto text-xs underline">
      {t('common.retry')}
    </button>
  </div>
)}
```

**Components needing error states**:
1. SalonPage — salon not found / fetch error
2. BookingCalendar — slots fetch error
3. CategoryPage — salons fetch error
4. ProfilePage — profile fetch error
5. ChatWindow — messages fetch error
6. DashboardPage — stats fetch error
7. MapView — map load error / API key missing
8. FeaturedSalonCarousel — favorites fetch error (currently only console.error)
9. ReviewForm — submission error
10. BookingWizard — booking creation error

**Verification**: Temporarily break an API route (return 500). Error state appears with retry button. No blank screens.

---

## Phase 7.5: Undefined Animation Classes Fix

**Goal**: Zero references to CSS animation classes that don't exist.

**Fixes**:
1. **`animate-coral-pulse`** (LastMinuteCard.tsx):
   - Define in globals.css:
   ```css
   @keyframes coral-pulse {
     0%, 100% { box-shadow: 0 0 0 0 rgba(232, 98, 74, 0.2); }
     50% { box-shadow: 0 0 0 8px rgba(232, 98, 74, 0); }
   }
   .animate-coral-pulse { animation: coral-pulse 2s ease-in-out infinite; }
   ```

2. **`img-hover-zoom`** (SalonCard.tsx):
   - Define or remove. Card elevation handles hover — image zoom is optional.
   - If keeping: `.img-hover-zoom:hover img { transform: scale(1.03); transition: transform 500ms; }`

3. **`stamp-new`** (StampCard.tsx):
   - Replace with Framer `motion.div` with `scale: [0, 1.1, 1]` spring animation

4. **`animate-photo-upload`** (WarumSolenPage.tsx):
   - Define: `@keyframes photo-upload { from { opacity: 0; y: 20px; } to { opacity: 1; y: 0; } }`

5. **`solen-press-effect`** (Header.tsx):
   - Define: `.solen-press-effect:active { transform: scale(0.97); transition: transform 100ms; }`

**Verification**: `grep -rn 'animate-\|solen-press' components/ --include="*.tsx"` — every class found has a corresponding CSS definition.

---

## Phase 7.6: Component Polish Sweep

**Goal**: Fix remaining visual issues across individual components.

**Fixes**:

1. **Toast.tsx**: 
   - Min-width `260px` → `min-w-[200px] max-w-[calc(100vw-32px)]` (mobile safe)
   - Font size 12px → `text-sm` (14px)
   - Radius `rounded-[14px]` → `rounded-card` (16px)
   - Border colors: success → `border-s-sage/25`, error → `border-s-error/25`

2. **ReviewBreakdown.tsx**: 
   - Progress bars need `bg-s-bg-sunken dark:bg-s-dm-surface` dark mode
   - `data-text` class → verify it applies `font-variant-numeric: tabular-nums`

3. **BookingCard.tsx**: 
   - Status badge 4x duplication → extract to shared `StatusBadge` component
   - Shadow jump (1 → 3) → use 1 at rest, 2 on hover (not 3)
   - Icon monotony (all coral) → use `text-s-ink/50` for informational icons

4. **Footer.tsx**:
   - `tracking-[1.5px]` excessive → `tracking-wider` (0.05em)
   - Link hover → `hover:text-white` (not `hover:text-white/90`)
   - Background → `bg-s-dm-bg` dark mode aware

5. **GlassModal.tsx**:
   - Eyebrow 9px → `text-[10px]` minimum
   - Close button radius 8px → `rounded-input` (12px)
   
6. **BottomSheet.tsx**:
   - Radius `rounded-t-[28px]` → add `rounded-sheet` token or keep as explicit
   - Content padding `pb-8` → `pb-6` to match header proportions

7. **SalonBadge.tsx**:
   - "Neu" badge `background: "s-ink"` → fix to `bg-s-ink` (className) or `background: "#1A1209"` (inline)
   - Differentiate shadow by badge importance

**Verification**: Build passes. Visual spot-check on each fixed component.

---

## Phase 7.7: `as any` Type Safety Cleanup

**Goal**: Remove all `useTranslations() as any` casts. Add proper type narrowing.

**Pattern**:
```tsx
// Before (loses type safety):
const t = useTranslations("home") as any;

// After (keeps type safety):
const t = useTranslations("home");
// Then use t() with actual keys from de.json
```

**Steps**:
1. `grep -rn 'as any' components/ --include="*.tsx"` — list all instances
2. For each: remove `as any` cast
3. If TypeScript complains about key not existing → add the key to locale files
4. If the key structure is complex → use `useTranslations()` without namespace and access nested keys

**Verification**: `grep -rn 'as any' components/ --include="*.tsx"` returns 0 results. `npx tsc --noEmit` passes.

---

## Commit Strategy

- **7.1**: `"feat: warm blur image fallback system for missing salon photos"`
- **7.2**: `"feat: loading skeletons for all async sections (CLS prevention)"`
- **7.3**: `"feat: branded empty states for all lists/grids"`
- **7.4**: `"feat: inline error states with retry for all API calls"`
- **7.5**: `"fix: define all missing CSS animation classes"`
- **7.6**: `"fix: component polish sweep — Toast, ReviewBreakdown, BookingCard, Footer"`
- **7.7**: `"refactor: remove all 'as any' type casts"`
