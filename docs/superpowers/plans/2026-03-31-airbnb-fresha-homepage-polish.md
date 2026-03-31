# Airbnb/Fresha Homepage Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the visual gap between Solen's homepage and Airbnb/Fresha — white background, demo content when no real data, 180px compact cards, emoji icon polish, typography/CTA fixes, then footer + toggle polish.

**Architecture:** Two phases. Phase 1 touches 5 files (demo data layer, two carousel components, header, homepage). Phase 2 touches 4 files (footer, language switcher, theme toggle, locale files). Each phase ends with a build check and commit.

**Tech Stack:** Next.js App Router, React, Tailwind CSS, next-intl, TypeScript, Lucide icons

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `lib/demo-data.ts` | **Create** | Shared demo salon + discover item constants |
| `components/ui/DiscoverCarousel.tsx` | **Modify** | Show demo items when API returns empty |
| `components/ui/FeaturedSalonCarousel.tsx` | **Modify** | 180px compact card design + demo fallback |
| `components/layout/Header.tsx` | **Modify** | White bg, emoji polish, no grayscale, strip border |
| `components/HomePage.tsx` | **Modify** | Demo fallback for category rows, heading/link/CTA fixes |
| `components/layout/Footer.tsx` | **Modify** | 3-column layout |
| `messages/de.json` | **Modify** | New footer column keys |
| `messages/en.json` | **Modify** | New footer column keys |
| `messages/fr.json` | **Modify** | New footer column keys |
| `messages/it.json` | **Modify** | New footer column keys |
| `components/ui/LanguageSwitcher.tsx` | **Modify** | Header variant: remove Globe, text-only |
| `components/ui/ThemeToggle.tsx` | **Modify** | Filled Moon when dark mode active |

---

## PHASE 1 — P0 + P1

---

### Task 1: Create `lib/demo-data.ts`

**Files:**
- Create: `lib/demo-data.ts`

- [ ] **Step 1.1: Create the file**

```typescript
// lib/demo-data.ts
// DEMO DATA — replace with real content once salons/discovery items are seeded in the DB

import type { SalonCard } from "@/lib/types";

/**
 * Demo salons shown in category carousels when no real salon data exists.
 * SalonHeroCard only reads: id, slug, name, quartier, city_name,
 * cover_photo_url, gallery_urls, average_rating, review_count,
 * min_price, categories, last_minute_discount_percent.
 * All other Salon fields are cast away via `as unknown as SalonCard`.
 */
export const DEMO_SALONS: SalonCard[] = [
  {
    id: "demo-1", slug: "demo-1", name: "Atelier Lumière",
    quartier: "Altstadt", city_name: "Basel",
    cover_photo_url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=480&q=80",
    average_rating: 4.9, review_count: 87, min_price: 65,
    categories: ["coiffeur"], gallery_urls: [], last_minute_discount_percent: 0,
  } as unknown as SalonCard,
  {
    id: "demo-2", slug: "demo-2", name: "Nails & Grace",
    quartier: "Gundeldingen", city_name: "Basel",
    cover_photo_url: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=480&q=80",
    average_rating: 4.8, review_count: 42, min_price: 45,
    categories: ["nails"], gallery_urls: [], last_minute_discount_percent: 0,
  } as unknown as SalonCard,
  {
    id: "demo-3", slug: "demo-3", name: "The Barber Society",
    quartier: "St. Johann", city_name: "Basel",
    cover_photo_url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=480&q=80",
    average_rating: 4.7, review_count: 124, min_price: 35,
    categories: ["barbershop"], gallery_urls: [], last_minute_discount_percent: 0,
  } as unknown as SalonCard,
  {
    id: "demo-4", slug: "demo-4", name: "Serenity Spa Basel",
    quartier: "Bruderholz", city_name: "Basel",
    cover_photo_url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=480&q=80",
    average_rating: 4.9, review_count: 61, min_price: 90,
    categories: ["spa"], gallery_urls: [], last_minute_discount_percent: 0,
  } as unknown as SalonCard,
  {
    id: "demo-5", slug: "demo-5", name: "Glam Studio",
    quartier: "Bachletten", city_name: "Basel",
    cover_photo_url: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=480&q=80",
    average_rating: 4.6, review_count: 33, min_price: 55,
    categories: ["makeup"], gallery_urls: [], last_minute_discount_percent: 0,
  } as unknown as SalonCard,
];

/**
 * Demo discover items shown in DiscoverCarousel when /api/discovery/feed returns empty.
 * These match the 9:16 TikTok-card format used by the carousel.
 */
export const DEMO_DISCOVER_ITEMS = [
  { id: "dd-1", image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80", label: "Coiffeur" },
  { id: "dd-2", image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&q=80", label: "Nails" },
  { id: "dd-3", image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80", label: "Barbershop" },
  { id: "dd-4", image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80", label: "Spa" },
  { id: "dd-5", image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&q=80", label: "Makeup" },
];
```

- [ ] **Step 1.2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: zero errors (or same errors as before — don't introduce new ones).

- [ ] **Step 1.3: Commit**

```bash
git add lib/demo-data.ts
git commit -m "feat: add demo salon and discover item data for empty-state fallbacks"
```

---

### Task 2: Fix `DiscoverCarousel.tsx` — empty-state fallback

**Files:**
- Modify: `components/ui/DiscoverCarousel.tsx`

The carousel currently renders nothing when `!isLoading && items.length === 0`. Fix by showing 5 demo 9:16 cards.

- [ ] **Step 2.1: Add import at top of `DiscoverCarousel.tsx`**

After the existing imports, add:

```typescript
import { DEMO_DISCOVER_ITEMS } from "@/lib/demo-data";
```

- [ ] **Step 2.2: Replace the render logic**

Find this block (around line 114):

```tsx
        {isLoading ? (
          // Skeletons matching the TikTok aspect ratio styling
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="shrink-0 snap-center w-[44vw] max-w-[200px] aspect-[9/16] rounded-2xl">
              <Skeleton className="w-full h-full rounded-[16px]" />
            </div>
          ))
        ) : items.length > 0 ? (
          items.map((item, index) => {
```

Replace with:

```tsx
        {isLoading ? (
          // Skeletons matching the TikTok aspect ratio styling
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="shrink-0 snap-center w-[44vw] max-w-[200px] aspect-[9/16] rounded-2xl">
              <Skeleton className="w-full h-full rounded-[16px]" />
            </div>
          ))
        ) : items.length === 0 ? (
          // DEMO — shown when no discovery content is seeded yet
          DEMO_DISCOVER_ITEMS.map((item, index) => {
            const isExpanded = activeIndex === index;
            return (
              <div
                key={item.id}
                className="shrink-0 snap-center relative w-[44vw] max-w-[200px] aspect-[9/16]"
              >
                <div
                  className={`w-full h-full rounded-[16px] overflow-hidden transition-[transform,opacity] duration-[250ms] origin-center
                    ${isExpanded ? "scale-[1.03] opacity-100" : "scale-[0.88] opacity-60 md:scale-[0.95] md:opacity-80"}
                  `}
                >
                  <img
                    src={item.image}
                    alt={item.label}
                    className="w-full h-full object-cover"
                    loading={index < 2 ? "eager" : "lazy"}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <span className="absolute bottom-3 left-3 font-heading font-semibold text-[13px] text-white">
                    {item.label}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          items.map((item, index) => {
```

Note: the `items.map(...)` block that was previously in the ternary's true branch now needs a closing `)` added. The full structure becomes `isLoading ? ... : items.length === 0 ? ... : items.map(...)`.

- [ ] **Step 2.3: Check the closing parentheses are balanced**

The render return's `<div ref={scrollRef} ...>` content should now look like:

```tsx
{isLoading ? (
  /* skeleton array */
) : items.length === 0 ? (
  /* demo array */
) : (
  items.map((item, index) => { ... })
)}
```

- [ ] **Step 2.4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: zero new errors.

- [ ] **Step 2.5: Commit**

```bash
git add components/ui/DiscoverCarousel.tsx
git commit -m "feat: show demo discover items when feed is empty"
```

---

### Task 3: Redesign `FeaturedSalonCarousel.tsx` — 180px compact cards + demo fallback

**Files:**
- Modify: `components/ui/FeaturedSalonCarousel.tsx`

This task rewrites `SalonHeroCard` (240px overlay → 180px text-below) and `SkeletonSalonCard` (to match), and replaces the skeleton fallback with demo salon cards.

- [ ] **Step 3.1: Add import at top of `FeaturedSalonCarousel.tsx`**

After existing imports:

```typescript
import { DEMO_SALONS } from "@/lib/demo-data";
```

- [ ] **Step 3.2: Replace the `useReal` / render logic**

Find (around line 16):

```typescript
  const salonsWithPhotos = salons.filter(
    (s) => !!s.cover_photo_url || (s.gallery_urls && s.gallery_urls.length > 0)
  );

  // Threshold = 3: all-skeleton or all-real (never mixed)
  const useReal = salonsWithPhotos.length >= 3;
```

Replace with:

```typescript
  const salonsWithPhotos = salons.filter(
    (s) => !!s.cover_photo_url || (s.gallery_urls && s.gallery_urls.length > 0)
  );
  const useReal = salonsWithPhotos.length >= 3;
  // DEMO — shown when no real salon data exists yet
  const salonsToShow = useReal ? salonsWithPhotos.slice(0, 8) : DEMO_SALONS;
```

- [ ] **Step 3.3: Update the carousel render to use `salonsToShow`**

Find (around line 67):

```tsx
        {useReal
          ? salonsWithPhotos.slice(0, 8).map((salon, index) => (
              <SalonHeroCard
                key={salon.id}
                salon={salon}
                locale={locale}
                index={index}
                isFavorited={favoriteIds.has(salon.id)}
                onFavoriteToggle={handleFavoriteToggle}
              />
            ))
          : Array.from({ length: 4 }).map((_, i) => (
              <SkeletonSalonCard key={i} index={i} />
            ))}
```

Replace with:

```tsx
        {salonsToShow.map((salon, index) => (
          <SalonHeroCard
            key={salon.id}
            salon={salon}
            locale={locale}
            index={index}
            isFavorited={favoriteIds.has(salon.id)}
            onFavoriteToggle={useReal ? handleFavoriteToggle : undefined}
            isDemo={!useReal}
          />
        ))}
```

- [ ] **Step 3.4: Delete `SkeletonSalonCard` — it is now dead code**

After Step 3.3's change, `SkeletonSalonCard` is never called (the render always uses `salonsToShow` which is either real cards or demo cards). Delete the entire function:

Find and delete this entire function from the file:

```tsx
function SkeletonSalonCard({ index }: { index: number }) {
  return (
    <div
      className="flex-shrink-0 snap-start relative rounded-xl overflow-hidden bg-white/5 border border-s-ink/[0.06] animate-pulse"
      style={{
        width: 240,
        aspectRatio: "4/5",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, #EDE8E2 0%, #E3DDD6 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(90deg, transparent 0%, rgba(245,240,235,0.7) 40%, transparent 80%)",
          backgroundSize: "200% 100%",
          animation: `skeletonShimmer 1.8s ease-in-out infinite ${index * 0.15}s`,
        }}
      />
      <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2">
        <div style={{ width: "65%", height: 16, borderRadius: 6, background: "rgba(255,255,255,0.4)" }} />
        <div style={{ width: "45%", height: 12, borderRadius: 6, background: "rgba(255,255,255,0.3)" }} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3.5: Update `SalonHeroCardProps` to add `isDemo` and make `onFavoriteToggle` optional**

Find:

```typescript
interface SalonHeroCardProps {
  salon: SalonCard;
  locale: string;
  index: number;
  isFavorited: boolean;
  onFavoriteToggle: (salonId: string) => void;
}
```

Replace with:

```typescript
interface SalonHeroCardProps {
  salon: SalonCard;
  locale: string;
  index: number;
  isFavorited: boolean;
  onFavoriteToggle?: (salonId: string) => void;
  isDemo?: boolean;
}
```

- [ ] **Step 3.6: Rewrite `SalonHeroCard` as 180px compact card with text below**

Replace the entire `SalonHeroCard` function with:

```tsx
function SalonHeroCard({ salon, locale, index, isFavorited, onFavoriteToggle, isDemo }: SalonHeroCardProps) {
  const t = useTranslations("home") as any;
  const photo = salon.cover_photo_url ?? salon.gallery_urls?.[0] ?? null;
  const showRating = (salon.review_count ?? 0) >= 3;
  const locationParts = [salon.quartier, salon.city_name ?? "Basel"].filter(Boolean);
  const locationText = locationParts.join(", ");

  const isGuestFavorite = salon.average_rating >= 4.9 && salon.review_count > 50;
  const isNew = salon.review_count === 0;

  const cardContent = (
    <>
      {/* ── Image (1:1 square) ── */}
      <div
        className="relative w-full rounded-[12px] overflow-hidden bg-[#EDE8E2]"
        style={{ height: 180 }}
      >
        {photo && (
          <img
            src={photo}
            alt={salon.name}
            className="w-full h-full object-cover"
            loading={index < 2 ? "eager" : "lazy"}
          />
        )}

        {/* Badge: top-left */}
        <div className="absolute top-2 left-2 z-[2]">
          {isGuestFavorite ? (
            <span className="flex items-center gap-1 font-heading font-semibold text-[10px] text-s-ink bg-white/95 backdrop-blur-md px-2 py-1 rounded-pill shadow-sm uppercase tracking-wider">
              <Award size={10} className="text-s-coral" />{" "}
              {(t("heroCarousel.guestFavorite") as string).includes("heroCarousel") ? "Top bewertet" : t("heroCarousel.guestFavorite")}
            </span>
          ) : isNew ? (
            <span className="font-heading font-semibold text-[10px] text-white bg-s-coral px-2 py-1 rounded-pill shadow-sm">
              Neu
            </span>
          ) : null}
        </div>

        {/* Favorite heart: top-right — hidden on demo cards */}
        {!isDemo && onFavoriteToggle && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFavoriteToggle(salon.id); }}
            className="absolute top-2 right-2 z-[2] w-[28px] h-[28px] rounded-full bg-black/10 backdrop-blur-md flex items-center justify-center transition-all duration-200 hover:bg-black/20 hover:scale-110 active:scale-95 shadow-sm"
            aria-label="Toggle Favorite"
          >
            <Heart
              className={`w-[14px] h-[14px] transition-colors duration-200 ${
                isFavorited ? "fill-white text-white" : "text-white stroke-white"
              }`}
              strokeWidth={isFavorited ? 1 : 2}
            />
          </button>
        )}
      </div>

      {/* ── Text below image ── */}
      <div className="pt-2 pb-1">
        <p className="font-heading font-semibold text-[14px] text-[#222222] dark:text-white truncate leading-snug">
          {salon.name}
        </p>
        <p className="font-body text-[12px] text-[#717171] dark:text-s-dm-text/60 truncate mt-0.5">
          {locationText}
        </p>
        {showRating ? (
          <div className="flex items-center gap-1 mt-1">
            <Star size={11} className="fill-s-coral text-s-coral flex-shrink-0" />
            <span className="font-body text-[12px] text-[#717171] dark:text-s-dm-text/60">
              {salon.average_rating.toFixed(1)}
            </span>
            {salon.min_price != null && (
              <span className="font-body text-[12px] text-[#717171] dark:text-s-dm-text/60">
                {" · CHF "}{salon.min_price}
              </span>
            )}
          </div>
        ) : salon.min_price != null ? (
          <p className="font-body text-[12px] text-[#717171] dark:text-s-dm-text/60 mt-1">
            ab CHF {salon.min_price}
          </p>
        ) : null}
      </div>
    </>
  );

  if (isDemo) {
    return (
      <div
        className="flex-shrink-0 snap-start select-none"
        style={{ width: 180 }}
        aria-hidden="true"
      >
        {cardContent}
      </div>
    );
  }

  return (
    <Link
      href={`/${locale}/salon/${salon.slug}`}
      className="flex-shrink-0 snap-start group cursor-pointer hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(26,18,9,0.12)] transition-[transform,box-shadow] duration-[250ms]"
      style={{ width: 180 }}
      aria-label={salon.name}
      prefetch={false}
    >
      {cardContent}
    </Link>
  );
}
```

- [ ] **Step 3.7: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: zero new errors.

- [ ] **Step 3.8: Commit**

```bash
git add components/ui/FeaturedSalonCarousel.tsx lib/demo-data.ts
git commit -m "feat: 180px compact carousel cards with demo fallback"
```

---

### Task 4: Polish `Header.tsx` — white background, emoji icons, strip separator

**Files:**
- Modify: `components/layout/Header.tsx`

Three targeted edits. Read the current file before making any changes.

- [ ] **Step 4.1: Change header unscrolled background from beige to white**

Find (around line 115):

```tsx
        scrolled
          ? "bg-white/95 dark:bg-s-dm-surface/95 border-b border-s-ink/[0.08] dark:border-white/[0.08] shadow-sm backdrop-blur-md pb-0"
          : "bg-[#F5F0EB] dark:bg-transparent border-transparent pb-0"
```

Replace with:

```tsx
        scrolled
          ? "bg-white/95 dark:bg-s-dm-surface/95 border-b border-s-ink/[0.08] dark:border-white/[0.08] shadow-sm backdrop-blur-md pb-0"
          : "bg-white dark:bg-transparent border-transparent pb-0"
```

- [ ] **Step 4.2: Polish the emoji icons — larger, no grayscale, hover scale**

Find the icon `<div>` inside the category strip map (around line 252):

```tsx
                  <div className={cn(
                    "text-[24px] transition-all duration-300 origin-bottom flex items-end",
                    scrolled ? "h-0 opacity-0 scale-50 mb-0" : "h-[28px] opacity-100 scale-100 mb-[6px]",
                    isActive ? "grayscale-0 opacity-100" : "grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100"
                  )}>
                    {icon}
                  </div>
```

Replace with:

```tsx
                  <div className={cn(
                    "text-[28px] transition-all duration-300 origin-bottom flex items-end",
                    scrolled ? "h-0 opacity-0 scale-50 mb-0" : "h-[32px] opacity-100 scale-100 mb-[6px]",
                    "hover:scale-110"
                  )}>
                    {icon}
                  </div>
```

- [ ] **Step 4.3: Add a separator border below the category strip**

Find the category strip outer `<div>` (around line 232):

```tsx
      {showCategoryNav && (
        <div className={cn(
          "max-w-[2520px] mx-auto px-6 overflow-hidden transition-[height,opacity,margin-top,padding-top] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] relative z-50",
          scrolled ? "h-[42px] mt-[10px] opacity-100 border-t border-s-ink/[0.06] pt-0" : "h-[84px] mt-4 opacity-100"
        )}>
```

Replace with:

```tsx
      {showCategoryNav && (
        <div className={cn(
          "max-w-[2520px] mx-auto px-6 overflow-hidden transition-[height,opacity,margin-top,padding-top] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] relative z-50 border-b border-s-ink/[0.06] dark:border-white/[0.06]",
          scrolled ? "h-[42px] mt-[10px] opacity-100 border-t border-s-ink/[0.06] pt-0" : "h-[84px] mt-4 opacity-100"
        )}>
```

- [ ] **Step 4.4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 4.5: Commit**

```bash
git add components/layout/Header.tsx
git commit -m "design: white header bg, larger emoji icons, strip separator border"
```

---

### Task 5: Update `HomePage.tsx` — demo fallback, heading, links, buttons

**Files:**
- Modify: `components/HomePage.tsx`

Five targeted edits. Read the current file before making changes.

- [ ] **Step 5.1: Remove the null guard for category rows**

`FeaturedSalonCarousel` already handles the demo fallback internally (Task 3). The only change needed in `HomePage.tsx` is removing the guard that prevents the section from rendering at all when empty.

Find (around line 253):

```tsx
          {orderedSectionKeys.map(({ key, label }) => {
            const salonsForCategory = categorySalons[key] || [];
            if (salonsForCategory.length === 0) return null;

            return (
```

Replace with:

```tsx
          {orderedSectionKeys.map(({ key, label }) => {
            const salonsForCategory = categorySalons[key] || [];
            // No null guard — FeaturedSalonCarousel shows demo cards when salonsForCategory is empty

            return (
```

No import change needed — `DEMO_SALONS` is handled entirely inside `FeaturedSalonCarousel`.

- [ ] **Step 5.3: Shrink the "Entdecken" section heading**

Find (around line 238):

```tsx
              <h2 className="font-heading font-extrabold text-[#222222] dark:text-white" style={{ fontSize: "clamp(24px, 3.5vw, 42px)", letterSpacing: "-0.02em", lineHeight: "1.0" }}>
                {t("discover.title")}
              </h2>
```

Replace with:

```tsx
              <h2 className="font-heading font-semibold text-[22px] tracking-tight text-[#222222] dark:text-white" style={{ lineHeight: "1.1" }}>
                {t("discover.title")}
              </h2>
```

- [ ] **Step 5.4: Polish the "Katalog öffnen" button and "See All" links**

Find the "Katalog öffnen" Link (around line 243):

```tsx
            <Link href={`/${locale}/discover`}
              className="inline-flex items-center gap-2 text-[14px] font-body font-semibold text-[#222222] bg-[#f7f7f7] hover:bg-[#ebebeb] px-5 py-2.5 rounded-[8px] transition-colors shrink-0 self-start">
              {t("discover.catalogCta")}
            </Link>
```

Replace with:

```tsx
            <Link href={`/${locale}/discover`}
              className="inline-flex items-center gap-2 text-[14px] font-body font-semibold text-[#222222] dark:text-white rounded-pill border border-s-ink/15 dark:border-white/15 px-5 py-2.5 hover:border-s-coral/40 hover:text-s-coral active:scale-[0.98] transition-all duration-150 shrink-0 self-start">
              {t("discover.catalogCta")}
            </Link>
```

Now add `ArrowRight` to the imports at the top of the file. Find the lucide imports:

```typescript
import {
  RefreshCw,
  Search,
  Compass,
} from "lucide-react";
```

Replace with:

```typescript
import {
  RefreshCw,
  Search,
  Compass,
  ArrowRight,
} from "lucide-react";
```

Now find the "See All" link (around line 263):

```tsx
                    <Link href={`/${locale}/${key}`} className="inline-block text-[14px] font-body font-semibold text-[#222222] dark:text-white hover:underline">
                      Alle {label} ansehen →
                    </Link>
```

Replace with:

```tsx
                    <Link href={`/${locale}/${key}`} className="group inline-flex items-center gap-1.5 text-[14px] font-body font-semibold text-[#222222] dark:text-white hover:text-s-coral transition-colors duration-150">
                      Alle {label} ansehen
                      <ArrowRight size={14} className="transition-transform duration-150 group-hover:translate-x-1" />
                    </Link>
```

- [ ] **Step 5.5: Change the B2B Partner CTA button to coral**

Find (around line 309):

```tsx
              <Link
                href={`/${locale}/partner`}
                className="inline-flex items-center justify-center h-12 px-8 rounded-[8px] bg-white text-[#222222] font-heading font-bold hover:bg-gray-100 transition-colors self-start whitespace-nowrap"
              >
                {t("partner.cta")}
              </Link>
```

Replace with:

```tsx
              <Link
                href={`/${locale}/partner`}
                className="inline-flex items-center justify-center h-12 px-8 rounded-pill bg-s-coral text-white font-heading font-bold hover:brightness-[1.06] active:scale-[0.98] transition-all duration-150 self-start whitespace-nowrap"
              >
                {t("partner.cta")}
              </Link>
```

- [ ] **Step 5.6: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: zero new errors.

- [ ] **Step 5.7: Build check**

```bash
npm run build
```

Expected: build succeeds. If it fails, read the error carefully and fix before proceeding.

- [ ] **Step 5.8: Visual check at localhost**

```bash
npm run dev
```

Open http://localhost:3000/de and verify:
- Page background is pure white (no beige)
- Category strip shows full-colour emojis, larger, with a bottom border line
- Entdecken section shows 5 demo photo cards (not grey skeletons)
- Category rows show 5 demo cards at ~180px wide with text below each photo
- "Entdecken" heading matches other section heading sizes
- "Alle X ansehen" links have arrow with hover coral
- "Katalog öffnen" button is pill-shaped with hover coral outline
- B2B "Partner werden" button is coral-filled
- On scroll: emoji icons collapse, text labels remain

- [ ] **Step 5.9: Commit Phase 1**

```bash
git add components/HomePage.tsx
git commit -m "design: homepage Phase 1 — white bg, demo carousels, 180px cards, CTA polish (P0+P1)"
```

---

## PHASE 2 — P2

---

### Task 6: Expand `Footer.tsx` to multi-column layout

**Files:**
- Modify: `components/layout/Footer.tsx`
- Modify: `messages/de.json`, `messages/en.json`, `messages/fr.json`, `messages/it.json`

- [ ] **Step 6.1: Add new translation keys to `messages/de.json`**

Find the `"footer"` object and add these keys (keep all existing keys intact, just append):

```json
"platform": "Plattform",
"platformDiscover": "Entdecken",
"platformSearch": "Suchen",
"platformOffers": "Angebote",
"platformLastMinute": "Last Minute",
"forSalonsTitle": "Für Salons",
"forSalonsPartner": "Partner werden",
"forSalonsDashboard": "Dashboard",
"legalTitle": "Rechtliches"
```

- [ ] **Step 6.2: Add translation keys to `messages/en.json`**

Same structure, English values:

```json
"platform": "Platform",
"platformDiscover": "Discover",
"platformSearch": "Search",
"platformOffers": "Offers",
"platformLastMinute": "Last Minute",
"forSalonsTitle": "For Salons",
"forSalonsPartner": "Become a Partner",
"forSalonsDashboard": "Dashboard",
"legalTitle": "Legal"
```

- [ ] **Step 6.3: Add translation keys to `messages/fr.json`**

```json
"platform": "Plateforme",
"platformDiscover": "Découvrir",
"platformSearch": "Rechercher",
"platformOffers": "Offres",
"platformLastMinute": "Dernière minute",
"forSalonsTitle": "Pour les salons",
"forSalonsPartner": "Devenir partenaire",
"forSalonsDashboard": "Tableau de bord",
"legalTitle": "Mentions légales"
```

- [ ] **Step 6.4: Add translation keys to `messages/it.json`**

```json
"platform": "Piattaforma",
"platformDiscover": "Scopri",
"platformSearch": "Cerca",
"platformOffers": "Offerte",
"platformLastMinute": "Last Minute",
"forSalonsTitle": "Per i saloni",
"forSalonsPartner": "Diventa partner",
"forSalonsDashboard": "Dashboard",
"legalTitle": "Note legali"
```

- [ ] **Step 6.5: Rewrite `Footer.tsx` with 3-column layout**

Replace the entire footer content (keep the outer `<footer>` element and its `className`):

```tsx
export default function Footer() {
  const locale = useLocale();
  const t = useTranslations("footer") as any;

  return (
    <footer className="bg-[#2C2825] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">

        {/* ── Logo + tagline ── */}
        <div className="mb-10">
          <Link href={`/${locale}`} aria-label="solen.ch — Startseite">
            <Image src="/logo.svg" alt="solen.ch" width={80} height={24} className="brightness-0 invert mb-3" />
          </Link>
          <p className="text-[13px] font-body text-white/40">{t("tagline")}</p>
        </div>

        {/* ── 3 columns ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 pb-10 border-b border-white/[0.08]">

          {/* Column 1: Platform */}
          <div>
            <h3 className="font-heading font-semibold text-[12px] uppercase tracking-[1.5px] text-white/40 mb-4">
              {t("platform")}
            </h3>
            <ul className="space-y-2.5">
              {[
                { label: t("platformDiscover"), href: `/${locale}/discover` },
                { label: t("platformSearch"), href: `/${locale}/search` },
                { label: t("platformOffers"), href: `/${locale}/angebote` },
                { label: t("platformLastMinute"), href: `/${locale}/angebote` },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="font-body text-[13px] text-white/60 hover:text-white/90 transition-colors duration-150">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Für Salons */}
          <div>
            <h3 className="font-heading font-semibold text-[12px] uppercase tracking-[1.5px] text-white/40 mb-4">
              {t("forSalonsTitle")}
            </h3>
            <ul className="space-y-2.5">
              {[
                { label: t("forSalonsPartner"), href: `/${locale}/partner` },
                { label: t("forSalonsDashboard"), href: `/${locale}/dashboard` },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="font-body text-[13px] text-white/60 hover:text-white/90 transition-colors duration-150">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div>
            <h3 className="font-heading font-semibold text-[12px] uppercase tracking-[1.5px] text-white/40 mb-4">
              {t("legalTitle")}
            </h3>
            <ul className="space-y-2.5">
              {[
                { label: t("help"), href: `/${locale}/help` },
                { label: t("impressum"), href: `/${locale}/impressum` },
                { label: t("agb"), href: `/${locale}/agb` },
                { label: t("privacy"), href: `/${locale}/datenschutz` },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="font-body text-[13px] text-white/60 hover:text-white/90 transition-colors duration-150">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Bottom row: copyright + Instagram + language ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
          <div className="flex items-center gap-3">
            <p className="text-[11px] font-heading text-white/30">
              {t("copyright", { year: new Date().getFullYear() })}
            </p>
            <span className="text-white/15 text-[11px]">·</span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4CAF6F] shrink-0" aria-hidden="true" />
              <p className="text-[10px] font-heading uppercase tracking-[.06em]" style={{ color: "rgba(76,175,111,.55)" }}>
                {t("fadpCompliant")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://instagram.com/solen.ch"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="solen.ch auf Instagram"
              className="text-white/35 hover:text-white/70 transition-colors duration-150"
            >
              <Instagram size={16} />
            </a>
            <LanguageSwitcher locale={locale} variant="footer" />
          </div>
        </div>

      </div>
    </footer>
  );
}
```

- [ ] **Step 6.6: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 6.7: Commit**

```bash
git add components/layout/Footer.tsx messages/de.json messages/en.json messages/fr.json messages/it.json
git commit -m "design: footer multi-column layout with platform/salons/legal columns"
```

---

### Task 7: Shrink `LanguageSwitcher.tsx` header variant

**Files:**
- Modify: `components/ui/LanguageSwitcher.tsx`

The header variant currently shows a `<Globe>` icon + locale label. Remove the Globe, add a `<ChevronDown>` to signal it's a dropdown.

- [ ] **Step 7.1: Update the header variant trigger button**

Find (around line 80):

```tsx
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2 py-1.5 min-h-12 min-w-12 justify-center rounded-pill text-sm font-medium text-s-ink/70 hover:text-s-ink dark:text-s-dm-text/70 dark:hover:text-s-dm-text transition-colors"
        aria-label="Sprache wählen"
        aria-expanded={open}
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{LOCALE_LABELS[locale] ?? "DE"}</span>
      </button>
```

Replace with:

```tsx
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-0.5 px-2 py-1.5 min-h-10 rounded-pill text-[13px] font-medium text-s-ink/60 hover:text-s-ink dark:text-s-dm-text/60 dark:hover:text-s-dm-text transition-colors"
        aria-label="Sprache wählen"
        aria-expanded={open}
      >
        <span>{LOCALE_LABELS[locale] ?? "DE"}</span>
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>
```

- [ ] **Step 7.2: Add `ChevronDown` to imports**

Find the import at the top (it currently imports `Globe`):

```typescript
import { Globe } from "lucide-react";
```

Replace with:

```typescript
import { ChevronDown } from "lucide-react";
```

- [ ] **Step 7.3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 7.4: Commit**

```bash
git add components/ui/LanguageSwitcher.tsx
git commit -m "design: language switcher header variant — remove globe, text-only with chevron"
```

---

### Task 8: Polish `ThemeToggle.tsx` — filled Moon when dark

**Files:**
- Modify: `components/ui/ThemeToggle.tsx`

Currently shows `<Sun>` when dark and `<Moon>` when light. When dark mode is active, show a filled Moon (to clearly communicate the current state) rather than switching to Sun.

- [ ] **Step 8.1: Update the icon render**

Find (around line 56):

```tsx
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
```

Replace with:

```tsx
      {isDark ? (
        <Moon size={18} className="fill-current" />
      ) : (
        <Moon size={18} />
      )}
```

- [ ] **Step 8.2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 8.3: Final build check**

```bash
npm run build
```

Expected: build succeeds with zero errors.

- [ ] **Step 8.4: Final visual check**

Open http://localhost:3000/de and verify Phase 2 items:
- Footer has 3 columns: Plattform, Für Salons, Rechtliches — links work
- Language switcher in header shows `DE↓` (no globe icon)
- Dark mode toggle: in light mode shows outline Moon; toggle to dark shows filled Moon
- All Phase 1 changes still look correct

- [ ] **Step 8.5: Commit Phase 2**

```bash
git add components/ui/ThemeToggle.tsx
git commit -m "design: homepage Phase 2 — footer columns, language switcher, theme toggle polish (P2)"
```

---

## Final Push

```bash
git push origin main
```

Then verify Vercel deployment (per CLAUDE.md Rule 6 — check deployments, confirm status is "Ready", curl https://www.solen.ch/de/).
