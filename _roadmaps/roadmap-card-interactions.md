> 🛑 **GLOBAL DIRECTIVE: DO NOT PUSH TO PRODUCTION (NO `# 🛑 STOP: DO NOT PUSH (Wait for user approval)`)**
> **DO NOT RUN `# 🛑 STOP: DO NOT PUSH (Wait for user approval)` OR DEPLOY UNLESS EXPLICITLY INSTRUCTED BY THE USER.**
> 1. Everything must be built, tested, and validated on `localhost` FIRST.
> 2. Even if a roadmap says "# 🛑 STOP: DO NOT PUSH (Wait for user approval)" at the end of a step, **IGNORE IT**. Replace any implied pushes with just running a local `npm run build` or `npx tsc --noEmit`.
> 3. Only push when the user explicitly confirms "everything is good and push".
> 4. This rule applies to ALL agents (Claude, Cursor, Gemini, etc.).

# Roadmap B: Card & Carousel Micro-Interactions
> **Priority**: 🟡 P1 — Run IN PARALLEL with roadmap-css-foundation
> **Parallelism**: SAFE alongside CSS foundation. Touches DIFFERENT files.
> **Estimated Time**: ~30 minutes
> **File Lock**: `components/SalonCard.tsx`, `components/ui/CityCarouselSection.tsx`

## BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟢 SAFE | Nothing | Reducing font size only |
| Phase 2 | 🟢 SAFE | Nothing | Adding CSS class to existing elements |
| Phase 3 | 🟡 MEDIUM | Heart position/alignment | Test on 3+ cards |
| Phase 4 | 🟡 MEDIUM | SalonCard prop shape | Check photos prop exists |
| Phase 5 | 🟢 SAFE | Nothing | Text display change only |

---

## 🤖 Phase 1: Section Headers — 22px Semibold

**Problem**: `CityCarouselSection.tsx` uses `clamp(24px, 3.5vw, 42px)` `font-extrabold` for section titles. Way too big.

**File**: `components/ui/CityCarouselSection.tsx`

### Step 1a: Remove the inline `style` prop on both title variants

Find line 38-39 (the `<Link>` title) and line 45-46 (the `<h2>` title). Both have:
```tsx
style={{ fontSize: "clamp(24px, 3.5vw, 42px)", letterSpacing: "-0.02em" }}
```

**Replace BOTH with className-only styling**:

For the `<Link>` variant:
```tsx
<Link
  href={viewAllHref}
  onClick={onViewAll}
  className="font-heading font-semibold text-[22px] text-s-ink dark:text-s-dm-text hover:text-s-coral dark:hover:text-s-coral transition-colors duration-150 leading-snug"
>
  {title}
</Link>
```

For the `<h2>` variant:
```tsx
<h2 className="font-heading font-semibold text-[22px] text-s-ink dark:text-s-dm-text leading-snug">
  {title}
</h2>
```

### Step 1b: Tighten section spacing

Line 31 — section padding:
```diff
-<section className="pb-8">
+<section className="pb-5">
```

Line 33 — header alignment:
```diff
-<div className="max-w-5xl mx-auto px-6 mb-4 flex items-end justify-between gap-4">
+<div className="max-w-5xl mx-auto px-6 mb-3 flex items-center justify-between gap-4">
```

### Step 1c: Add arrow nudge to "Alle ansehen" links

Find the `→` span inside the `viewAllLabel` links (around lines 57-58 and 65-66). Update:
```diff
-<span className="inline-block transition-transform duration-150 group-hover:translate-x-1">→</span>
+<span className="inline-block transition-transform duration-200 ease-out group-hover:translate-x-1.5">→</span>
```

```bash
git add components/ui/CityCarouselSection.tsx
git commit -m "design: shrink section headers to 22px semibold + tighten spacing + arrow nudge animation"
```

> ⚠️ **BE CAREFUL**:
> - Remove the `style={{ ... }}` prop entirely — don't just change its values
> - `items-end` → `items-center` aligns the "View All" link with the section title vertically

---

## 🤖 Phase 2: Card Image Hover Zoom

**Problem**: Salon images don't respond to hover. The CSS class `.img-hover-zoom` already exists in `globals.css` — it's just not applied.

**File**: `components/SalonCard.tsx`

Find the image container div (the one with `relative overflow-hidden rounded-...`). It wraps the `<Image>` element. It's around line 140-160.

Add the `img-hover-zoom` class to it:
```diff
-<div className="relative overflow-hidden rounded-xl aspect-[20/19]">
+<div className="relative overflow-hidden rounded-xl aspect-[20/19] img-hover-zoom cursor-pointer">
```

That's it. The CSS in `globals.css` already handles the zoom:
```css
.img-hover-zoom:hover img { transform: scale(1.03); }
```

✅ DO: Just add the class name — the CSS animation is already defined
❌ DON'T: Add ANY inline styles or Framer Motion for this — pure CSS is smoother

```bash
git add components/SalonCard.tsx
git commit -m "design: add hover zoom effect to salon card images via existing img-hover-zoom class"
```

> ⚠️ **BE CAREFUL**:
> - Find the EXACT wrapping div by scrolling — it must have `overflow-hidden` already
> - The `cursor-pointer` may already be there via the `<Link>` wrapper — check first

---

## 🤖 Phase 3: Heart Favorite Spring Pop

**Problem**: Clicking favorite heart is instant, no feedback. A `heart-bounce` keyframe already exists in `globals.css` (line 680-690) but may not be applied.

**File**: `components/SalonCard.tsx`

Find the heart/favorite button (search for `Heart` icon or `onFavoriteToggle`). Currently it's around line 250-280.

The fix has two parts:

### Step 3a: Add bounce class on favorite toggle
When `isFavorited` is true, add the `heart-bounce` CSS class:

```tsx
<button
  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFavoriteToggle?.(salon.id); }}
  className={cn(
    "absolute top-2 right-2 z-[2] w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white transition-all duration-200",
    isFavorited && "heart-bounce"
  )}
>
  <Heart
    size={16}
    className={cn(
      "transition-colors duration-200",
      isFavorited ? "fill-s-coral text-s-coral" : "text-s-ink/60 hover:text-s-ink"
    )}
  />
</button>
```

### Step 3b: Add `whileTap` scale for extra feedback (if using motion div)
If the button is already a Framer Motion element, add:
```tsx
whileTap={{ scale: 0.85 }}
```

If it's a plain `<button>`, add inline:
```tsx
style={{ transition: "transform 100ms" }}
onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.85)")}
onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
```

✅ DO: Use the existing `heart-bounce` CSS class from globals.css
❌ DON'T: Import Framer Motion just for this — the CSS keyframe is enough
❌ DON'T: Change the heart icon fill colors — they're already correct

```bash
git add components/SalonCard.tsx
git commit -m "design: add spring pop animation to favorite heart via heart-bounce CSS class"
```

> ⚠️ **BE CAREFUL**:
> - The `heart-bounce` class triggers on mount when `isFavorited` is true. Use a `key={isFavorited}` on the icon to re-trigger the animation on toggle.
> - Test: Toggle a favorite on and off — it should pop both ways.

---

## 🤖 Phase 4: Swipable Multi-Image Card Carousel

**Problem**: SalonCard has a `photos?: string[]` prop (line 55) but the homepage never passes it. The card only shows one image. User wants **swipable** touch-gesture carousels like Airbnb.

### Step 4a: Check if homepage passes photos data

```bash
grep -n "photos" components/HomePage.tsx app/[locale]/page.tsx | head -10
```

If the homepage query already selects `photos` from the database, wire it through. If NOT, this phase requires a DB query change — **add a Supabase query to fetch `salon_photos` (limit 5) per salon and pass as `photos` prop**.

### Step 4b: Implement swipable carousel with touch gestures

Find where `<SalonCard>` is rendered and ensure `photos={salon.photos}` is passed.

Then in SalonCard, add a `useState` for `activePhotoIndex` and implement **both** touch swipe AND click arrow navigation:

```tsx
// At top of SalonCard component:
const [activePhotoIndex, setActivePhotoIndex] = useState(0);
const touchStart = useRef<number | null>(null);
const touchEnd = useRef<number | null>(null);
const minSwipeDistance = 50;

const onTouchStart = (e: React.TouchEvent) => {
  touchEnd.current = null;
  touchStart.current = e.targetTouches[0].clientX;
};

const onTouchMove = (e: React.TouchEvent) => {
  touchEnd.current = e.targetTouches[0].clientX;
};

const onTouchEnd = () => {
  if (!touchStart.current || !touchEnd.current) return;
  const distance = touchStart.current - touchEnd.current;
  const isLeftSwipe = distance > minSwipeDistance;
  const isRightSwipe = distance < -minSwipeDistance;
  const maxIndex = Math.min((photos?.length ?? 1) - 1, 4); // cap at 5 photos
  if (isLeftSwipe && activePhotoIndex < maxIndex) {
    setActivePhotoIndex(i => i + 1);
  }
  if (isRightSwipe && activePhotoIndex > 0) {
    setActivePhotoIndex(i => i - 1);
  }
};
```

```tsx
{/* Inside the image container — wrap images with touch handlers */}
<div
  className="relative overflow-hidden rounded-xl aspect-[20/19] img-hover-zoom cursor-pointer"
  onTouchStart={onTouchStart}
  onTouchMove={onTouchMove}
  onTouchEnd={onTouchEnd}
>
  {/* Image with CSS transition for swipe */}
  <div
    className="flex transition-transform duration-300 ease-out h-full"
    style={{ transform: `translateX(-${activePhotoIndex * 100}%)` }}
  >
    {(photos && photos.length > 0 ? photos.slice(0, 5) : [salon.cover_url]).map((src, i) => (
      <img
        key={i}
        src={src}
        alt={salon.name}
        className="w-full h-full object-cover shrink-0"
        loading={i === 0 ? "eager" : "lazy"}
      />
    ))}
  </div>

  {/* Dot indicators */}
  {photos && photos.length > 1 && (
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-[2]">
      {photos.slice(0, 5).map((_, i) => (
        <span
          key={i}
          className={cn(
            "w-1.5 h-1.5 rounded-full transition-all duration-200",
            i === activePhotoIndex ? "bg-white scale-110" : "bg-white/50"
          )}
        />
      ))}
    </div>
  )}

  {/* Desktop: Left/Right arrows on hover */}
  {photos && photos.length > 1 && activePhotoIndex > 0 && (
    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActivePhotoIndex(i => i - 1); }}
      className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-[2] hover:bg-white hover:scale-105"
    >
      <ChevronLeft size={14} />
    </button>
  )}
  {photos && photos.length > 1 && activePhotoIndex < Math.min(photos.length - 1, 4) && (
    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActivePhotoIndex(i => i + 1); }}
      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-[2] hover:bg-white hover:scale-105"
    >
      <ChevronRight size={14} />
    </button>
  )}
</div>
```

✅ DO: Cap at 5 photos max
✅ DO: Implement touch swipe gestures (swipe left/right) — this is REQUIRED
✅ DO: Show dots inside the bottom of the image
✅ DO: Show click arrows only on desktop hover (`group-hover:opacity-100`)
✅ DO: Use `translateX` with CSS transition for smooth sliding
❌ DON'T: Use heavy libraries like Swiper.js — native touch events are enough
❌ DON'T: Add this if photo data isn't available from the SSR query

```bash
git add components/SalonCard.tsx
git commit -m "feat: add swipable multi-image carousel to SalonCard with touch gestures + dot indicators"
```

> ⚠️ **BE CAREFUL**:
> - If `photos` is undefined or empty, fall back to the single `cover_url` image
> - The carousel must NOT break the existing `<Link>` wrapper — arrow clicks AND swipe handlers need `e.preventDefault()` and `e.stopPropagation()`
> - Only lazy-load images beyond the first one (`loading="lazy"`)
> - The swipe MUST feel native — use `ease-out` transition with proper minimum swipe distance (50px)
> - Add `import { useRef } from "react"` if not already imported

---

## 🤖 Phase 5: Star-Rating Spacing + Address Cleanup

**File**: `components/SalonCard.tsx`

### Step 5a: Fix star-to-number spacing

Find the rating display (search for `Star` or `average_rating`). It's around line 300-320.

Add proper gap:
```diff
-<Star size={14} /> {salon.average_rating}
+<Star size={13} className="fill-current" /> <span className="ml-0.5">{salon.average_rating.toFixed(2)}</span>
```

Ensure the container has `flex items-center gap-1`:
```tsx
<div className="flex items-center gap-1 text-sm font-heading font-semibold text-s-ink dark:text-s-dm-text">
  <Star size={13} className="fill-current text-s-ink dark:text-s-dm-text" />
  <span>{salon.average_rating.toFixed(2)}</span>
  <span className="text-s-ink/40 font-normal">({salon.review_count})</span>
</div>
```

### Step 5b: Replace postcode with Basel neighborhood shortnames

**User requirement**: Show Basel-local shortened neighborhood names, NOT formal names or postcodes.

Create a lookup map in `/lib/basel-neighborhoods.ts`:
```tsx
// Basel neighborhood shortnames — local slang/shortened versions
export const BASEL_NEIGHBORHOODS: Record<string, string> = {
  "4001": "Altstadt",
  "4051": "Altstadt",
  "4052": "Bachletten",
  "4053": "Gundeli",        // NOT "Gundeldingen"
  "4054": "Bruderholz",
  "4055": "St. Johann",
  "4056": "Iselin",
  "4057": "Matthäus",
  "4058": "Wettstein",
  "4059": "Neubad",
  "4052": "Bachletten",
  "4125": "Riehen",
  "4102": "Binningen",
  "4132": "Muttenz",
  "4142": "Münchenstein",
  "4144": "Arlesheim",
  "4153": "Reinach",
  "4123": "Allschwil",
  "4127": "Birsfelden",
};

export function getNeighborhood(zipCode?: string): string {
  if (!zipCode) return "Basel";
  return BASEL_NEIGHBORHOODS[zipCode] || zipCode;
}
```

Then in SalonCard, use it:
```tsx
import { getNeighborhood } from "@/lib/basel-neighborhoods";

// In the subtitle display:
<span className="text-[13px] text-s-ink/50 dark:text-s-dm-text/50">
  {getNeighborhood(salon.zip_code)} · {salon.categories?.[0] || "Salon"}
</span>
```

✅ DO: Use Basel-local shortened names ("Gundeli" not "Gundeldingen", "St. Johann" not "St. Johann-Vorstadt")
✅ DO: Fallback to the raw zip_code if it's not in the map
❌ DON'T: Remove the zip_code from the database — just don't DISPLAY it
❌ DON'T: Use formal Swiss Post names — use what locals actually say

### Step 5c: Fix review count contrast

The `(98)` review count should be visually lighter than the `4.85` rating:
```tsx
<span className="text-s-ink/40 dark:text-s-dm-text/40 font-normal">({salon.review_count})</span>
```

```bash
git add components/SalonCard.tsx
git commit -m "design: fix star rating spacing, soften subtitle text, improve review count contrast"
```

> ⚠️ **BE CAREFUL**:
> - `average_rating.toFixed(2)` — make sure the field exists and is a number. Add a fallback: `(salon.average_rating ?? 0).toFixed(2)`
> - Don't change the price display — that's separate

---

## 🔍 SELF-CHECK PROTOCOL

```bash
# 1. TypeScript
npx tsc --noEmit 2>&1 | tail -5

# 2. Build
npm run build 2>&1 | tail -10

# 3. Visual: verify section headers are smaller
# (manual: open solen.ch/de after deploy)
```

---

## DEPENDENCY ORDERING

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Section headers 22px | Nothing |
| Phase 2 | 🤖 | Card image hover zoom | Nothing |
| Phase 3 | 🤖 | Heart spring pop | Nothing |
| Phase 4 | 🤖 | Card image carousel | Check photos data first |
| Phase 5 | 🤖 | Star spacing + text | Nothing |
