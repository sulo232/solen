# V5 Zone 3 Roadmap — SalonCard Overhaul
`_tasks/roadmap-v5-zone3-saloncard.md`

> **Scope:** `components/SalonCard.tsx`
> **Target:** Name + type + location + 1 compact badge. Fix banned springs. Add photo carousel. Compact info section.

---

## Breakage Risk Assessment

| Phase | Risk | Could Break | Prevention |
|---|---|---|---|
| 3.1 | 🟢 SAFE | Nothing | Animation-only fix |
| 3.2 | 🟡 MEDIUM | Card height regressions | Only trim info — no logic changes |
| 3.3 | 🟡 MEDIUM | Images not loading | Verify salon photos exist in DB first |
| 3.4 | 🟢 SAFE | Nothing | Carousel is additive |

---

## 🤖 Phase 3.1 — Fix banned spring animation in SalonCard

**File**: `[MODIFY] components/SalonCard.tsx` (lines 25–32)

BEFORE:
```tsx
const cardReveal = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.45, ease: [0.23, 1, 0.32, 1] },
  },
};
```

This is actually correct already! But grep to confirm no other `type: "spring"` is used in this file:
```bash
grep -n "type.*spring" components/SalonCard.tsx
# Expected: 0 results
```

The heart bounce (`heartBouncing`) state uses CSS class `heart-bounce` — verify this uses CSS animation not framer-motion spring:
```bash
grep -n "heart-bounce" app/globals.css
```
If it uses a CSS `@keyframes` — it's fine (CSS animations are exempt). If it uses framer-motion spring — fix it.

✅ DO: `transition: { duration: 0.45, ease: [0.23, 1, 0.32, 1] }` for card reveal
❌ DON'T: `type: "spring"` on any layout/position change in SalonCard

**Commit**: `git commit -m "phase 3.1: verify and fix SalonCard animation compliance"`

---

## 🤖 Phase 3.2 — Trim info section to: Name, Type, Location, Badges (compact)

**File**: `[MODIFY] components/SalonCard.tsx` (lines 248–352)

**Keep:**
- Salon name (line 251) — with coral hover
- Category pills on photo in the image section (lines 186–195) — shows "type"
- Address line (lines 261–267) — location
- Rating + avg price row (lines 270–287) — compact, keep as-is
- Up to 1 badge (line 300–321) → reduce from `slice(0, 2)` to `slice(0, 1)`

**Remove/collapse:**
- Brand line `group_name` (lines 254–258) → if present, add as a tiny suffix to the name: `{salon.name}{group_name ? ` · ${group_name}` : ''}`
- AI sparkle reason `aiReason` (lines 289–297) → moved to a separate hoverable icon, max 28px width, right-aligned in name row
- Availability + stamps + off-peak row (lines 324–351) → collapse to single small pill showing ONLY the most urgent signal:
  - If `next_available_slot` → show availability
  - Else if `offPeakToday` → show discount
  - Else if `stampProgress` → show stamps
  - NEVER show all three simultaneously

AFTER info section pattern:
```tsx
<div className="px-3 py-2.5">
  {/* Name + AI sparkle (same row) */}
  <div className="flex items-start justify-between gap-1">
    <h3 className="font-heading font-semibold text-s-ink dark:text-s-dm-text text-[14px] leading-tight group-hover:text-s-coral transition-colors duration-150">
      {salon.name}
      {(salon as any).group_name && (
        <span className="text-s-ink/40 font-normal"> · {(salon as any).group_name}</span>
      )}
    </h3>
    {aiReason && (
      <div className="relative group/ai shrink-0 mt-0.5">
        <Sparkles className="w-3 h-3 text-s-coral cursor-help" />
        {/* tooltip unchanged */}
      </div>
    )}
  </div>

  {/* Location */}
  <div className="flex items-center gap-1 mt-1 text-s-ink/40 dark:text-s-dm-text/40">
    <MapPin className="w-3 h-3 shrink-0" />
    <span className="text-[11px] font-body truncate">{salon.address}</span>
    {showDistance && salon.distance_km != null && (
      <span className="text-[11px] text-s-ink/30 font-body shrink-0 ml-auto">{salon.distance_km.toFixed(1)} km</span>
    )}
  </div>

  {/* Rating + Price */}
  <div className="flex items-center gap-1.5 mt-1.5">
    {salon.review_count >= 5 ? (
      <>
        <Star className="w-3 h-3 fill-s-coral text-s-coral" />
        <span className="text-[12px] data-text font-medium text-s-ink dark:text-s-dm-text">{salon.average_rating.toFixed(1)}</span>
        <span className="text-[11px] text-s-ink/30 dark:text-s-dm-text/30 font-body">({salon.review_count})</span>
      </>
    ) : (
      <span className="text-[10px] font-body font-medium text-s-coral bg-s-coral-subtle dark:bg-s-coral/10 px-2 py-0.5 rounded-pill">{t("newOnSolen")}</span>
    )}
    {salon.avg_price != null && salon.avg_price > 0 && (
      <>
        <span className="text-s-ink/20 font-body">·</span>
        <span className="text-[11px] data-text text-s-ink/50 dark:text-s-dm-text/50">Ø {formatCurrency(salon.avg_price, locale)}</span>
      </>
    )}
  </div>

  {/* 1 badge MAX (most notable) */}
  {salon.badges && salon.badges.length > 0 && (() => {
    const b = salon.badges[0];
    const Ic = BADGE_ICONS[b.icon] ?? Star;
    return (
      <div className="mt-1.5">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[10px] font-medium" style={{ color: b.color, backgroundColor: b.bg_color }}>
          <Ic size={9} />
          {b.name_de}
        </span>
      </div>
    );
  })()}

  {/* Single signal pill (availability OR discount OR stamps — priority order) */}
  {(() => {
    if (showAvailability && salon.next_available_slot) {
      return (
        <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold text-s-sage-text bg-s-sage-subtle dark:bg-s-sage/10 px-2 py-0.5 rounded-pill">
          {salon.next_available_slot}
        </span>
      );
    }
    if (offPeakToday) {
      return (
        <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] bg-s-sage-subtle text-s-sage-text dark:bg-s-sage/10 px-2 py-0.5 rounded-pill font-medium">
          Off-Peak -{offPeakToday.discount_percent}%
        </span>
      );
    }
    if (stampProgress && stampProgress.current > 0) {
      return (
        <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] bg-s-amber-subtle text-s-amber-text px-2 py-0.5 rounded-pill">
          <Star size={9} className="fill-s-amber text-s-amber" /> {stampProgress.current}/{stampProgress.total}
        </span>
      );
    }
    return null;
  })()}
</div>
```

✅ DO: `px-3 py-2.5` — tight like Airbnb (not `p-4`)
❌ DON'T: show badges + availability + stamps + AI reason simultaneously — max 1 signal at a time

> ⚠️ **BE CAREFUL**: The `compare` checkbox (lines 197–213) — DO NOT remove it from the component. Instead, change `showCompare` default to `false`. This hides it everywhere without deleting the feature.

**Commit**: `git commit -m "phase 3.2: SalonCard info section - compact 4-line layout, 1 badge max"`

---

## 🤖 Phase 3.3 — Photo carousel (indicator dots + touch swipe)

**File**: `[MODIFY] components/SalonCard.tsx`

Add `photos?: string[]` to the `SalonCardProps` interface (optional, backwards compatible).
Add `photoIndex` state inside the card.

```tsx
const [photoIndex, setPhotoIndex] = useState(0);
const photos = [salon.cover_photo_url, ...(salon.photos || [])].filter(Boolean) as string[];
const hasMultiple = photos.length > 1;
```

On the image container, add:
- Previous/next buttons (show on hover, desktop only)
- Dot indicators at the bottom center (always visible if `hasMultiple`)

```tsx
{/* Dot indicators */}
{hasMultiple && (
  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
    {photos.slice(0, 5).map((_, i) => (
      <button
        key={i}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPhotoIndex(i); }}
        className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${i === photoIndex ? 'bg-white scale-125' : 'bg-white/50'}`}
        aria-label={`Photo ${i + 1}`}
      />
    ))}
  </div>
)}
```

Image source becomes `photos[photoIndex]`.

> ⚠️ **BE CAREFUL**: The `salon.photos` DB column may not exist yet. Add a fallback: `const photos = [salon.cover_photo_url].filter(Boolean)`. The carousel dots only render if `photos.length > 1`. If the DB column doesn't exist, the feature is invisible — not broken.

Dashboard feature (add to `_tasks/INCOMPLETE_FEATURES.md`):
```
## Salon Photo Gallery (Dashboard Upload)
- Backend: salon.photos[] column needed in DB
- Frontend: Carousel works in SalonCard once photos[] is populated
- Missing: Dashboard upload UI for additional salon photos (after cover photo)
- Priority: MEDIUM
```

**Commit**: `git commit -m "phase 3.3: SalonCard photo carousel with dot indicators"`

---

## 🤖 Phase 3.4 — Consistency fixes (compact variant + spring check)

**File**: `[MODIFY] components/SalonCard.tsx`

The compact variant (line 84–111) also needs padding tightened:
```tsx
// BEFORE
className="flex items-center gap-3 p-3 rounded-card card-v4 group"

// AFTER - unchanged, p-3 is correct for compact
```

Verify no springs in the component:
```bash
grep -n "spring" components/SalonCard.tsx
# Expected: 0 lines (heart-bounce should be CSS only)
```

**Commit**: `git commit -m "phase 3.4: SalonCard compact variant audit, spring verification"`

---

## Execution Order

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 3.1 | 🤖 | Fix springs | Nothing |
| Phase 3.2 | 🤖 | Trim info section | 3.1 |
| Phase 3.3 | 🤖 | Add photo carousel | 3.2 |
| Phase 3.4 | 🤖 | Consistency audit | 3.3 |
