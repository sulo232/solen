# Roadmap R17: Advanced Multi-Dimensional Reviews

> **Scope:** Upgrade the review system from single-star to multi-category ratings
> **Design System:** V3 — read `_rules/UI_RULES.md` fully before starting.
> **Pre-existing code:** `components/ReviewForm.tsx` (single rating), `components/ReviewBreakdown.tsx` (star histogram), `components/ReviewCarousel.tsx`, `app/api/reviews/` (full CRUD), `lib/types.ts` Review interface

---

## Pre-read Requirements

1. Read `CLAUDE.md` fully
2. Read `_rules/UI_RULES.md` fully
3. Read existing `components/ReviewForm.tsx` — single 1-5 star system with photos
4. Read existing `components/ReviewBreakdown.tsx` — star histogram only
5. Read `lib/types.ts` line 243-258 — `Review` interface (has `rating: number` single field)

---

## Phase 1: Database Schema Update

> **Goal:** Add sub-rating columns to the reviews table.

#### Files
- `[NEW]` `supabase/migrations/XXX_review_subcategories.sql`
- `[MODIFY]` `lib/types.ts`

#### Instructions
1. Migration:
   ```sql
   ALTER TABLE reviews
     ADD COLUMN IF NOT EXISTS rating_result SMALLINT CHECK (rating_result BETWEEN 1 AND 5),
     ADD COLUMN IF NOT EXISTS rating_atmosphere SMALLINT CHECK (rating_atmosphere BETWEEN 1 AND 5),
     ADD COLUMN IF NOT EXISTS rating_value SMALLINT CHECK (rating_value BETWEEN 1 AND 5);
   
   COMMENT ON COLUMN reviews.rating IS 'Overall rating (kept for backward compat)';
   COMMENT ON COLUMN reviews.rating_result IS 'Quality of the work/result';
   COMMENT ON COLUMN reviews.rating_atmosphere IS 'Salon atmosphere and friendliness';
   COMMENT ON COLUMN reviews.rating_value IS 'Price-performance ratio';
   ```
2. Update `Review` interface:
   ```typescript
   rating_result?: number | null;    // 1-5 Ergebnis
   rating_atmosphere?: number | null; // 1-5 Atmosphäre
   rating_value?: number | null;      // 1-5 Preis-Leistung
   ```
3. The existing `rating` field stays as the overall average (backward compat).

#### Verification
```bash
npx tsc --noEmit
npm run build
```

---

## Phase 2: Upgrade ReviewForm

> **Goal:** Multi-dimensional star input in the review form.

#### Files
- `[MODIFY]` `components/ReviewForm.tsx`

> ⚠️ **PRE-EXISTING CODE**: ReviewForm already has single-star, photo upload, submit logic. EXTEND it, don't rebuild from scratch.

#### Instructions
1. After the main star rating, add 3 sub-category sliders:
   - **Ergebnis** (Result) — `rating_result`
   - **Atmosphäre** — `rating_atmosphere`
   - **Preis-Leistung** (Value for Money) — `rating_value`
2. Each sub-category: row with label + 5 small stars (24px, not 36px like the main rating)
3. Sub-ratings are OPTIONAL (can submit with just the main rating)
4. Update the POST body to include sub-ratings
5. Fix existing V3 violations: `rounded-button` → `rounded-btn` (lines 162, 172, 179)
6. German labels: `Ergebnis`, `Atmosphäre`, `Preis-Leistung`

#### ✅ DO
```tsx
{/* Sub-category ratings — optional */}
<div className="space-y-3 pt-4 border-t border-s-ink/5 dark:border-white/5">
  <p className="text-xs font-heading font-semibold text-s-ink/60 dark:text-s-dm-text/60 uppercase tracking-[.15em]">
    Detailbewertung (Optional)
  </p>
  {[
    { key: "rating_result", label: "Ergebnis" },
    { key: "rating_atmosphere", label: "Atmosphäre" },
    { key: "rating_value", label: "Preis-Leistung" },
  ].map(({ key, label }) => (
    <SubRatingRow key={key} label={label} value={subRatings[key]} onChange={(v) => setSubRatings(prev => ({ ...prev, [key]: v }))} />
  ))}
</div>
```

#### ❌ DON'T
```tsx
// Don't make sub-ratings required — they're optional enrichment
// Don't remove the main star rating — it stays as the primary metric
// Don't use rounded-button (banned)
```

#### Verification
```bash
grep -rn "rounded-button" components/ReviewForm.tsx  # Must return 0
npm run build
```

---

## Phase 3: Upgrade ReviewBreakdown

> **Goal:** Show multi-dimensional breakdown on salon pages.

#### Files
- `[MODIFY]` `components/ReviewBreakdown.tsx`

#### Instructions
1. Keep existing star histogram at the top
2. Below it, add 3 horizontal progress bars for sub-categories:
   - Each bar: label on left, filled bar in the middle, average on right
   - Bar color: `bg-s-coral` (same as star bars)
   - Only show if at least 1 review has that sub-rating
3. Sub-category averages: calculate from reviews that have values (skip nulls)
4. Layout: compact, ~100px extra height at most

#### ✅ DO
```tsx
{/* Sub-category averages */}
{hasSubRatings && (
  <div className="mt-4 pt-4 border-t border-s-ink/5 dark:border-white/5 space-y-2">
    {[
      { label: "Ergebnis", avg: avgResult },
      { label: "Atmosphäre", avg: avgAtmosphere },
      { label: "Preis-Leistung", avg: avgValue },
    ].filter(({ avg }) => avg > 0).map(({ label, avg }) => (
      <div key={label} className="flex items-center gap-3 text-xs">
        <span className="text-s-ink/50 dark:text-s-dm-text/50 w-24 shrink-0">{label}</span>
        <div className="flex-1 h-1.5 bg-s-bg-sunken dark:bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-s-coral rounded-full" style={{ width: `${(avg / 5) * 100}%` }} />
        </div>
        <span className="text-s-ink/60 dark:text-s-dm-text/60 w-6 text-right font-medium">{avg.toFixed(1)}</span>
      </div>
    ))}
  </div>
)}
```

#### Verification
```bash
npm run build
```

---

## Phase 4: API Update

> **Goal:** Accept and return sub-ratings in the reviews API.

#### Files
- `[MODIFY]` `app/api/reviews/route.ts`
- `[MODIFY]` `lib/validations.ts` (add sub-rating fields to review schema)

> ⚠️ **PRE-EXISTING CODE**: The reviews API already handles POST/GET with rating, comment, booking_id, photos. EXTEND the validation schema, don't rewrite.

#### Instructions
1. Add optional fields to the review POST validation:
   ```typescript
   rating_result: z.number().int().min(1).max(5).optional(),
   rating_atmosphere: z.number().int().min(1).max(5).optional(),
   rating_value: z.number().int().min(1).max(5).optional(),
   ```
2. Include sub-ratings in the Supabase insert
3. Include sub-ratings in GET responses (they'll be null for old reviews)
4. Recalculate overall `rating` as weighted average IF all 3 sub-ratings are provided:
   `rating = Math.round((result * 0.5 + atmosphere * 0.25 + value * 0.25) * 2) / 2`
   If not all provided, keep the manually selected main rating.

#### Verification
```bash
npm run build
```

---

## Execution Order

| Phase | Depends On |
|---|---|
| 1 | Nothing |
| 2 | Phase 1 (needs updated types + DB columns) |
| 3 | Phase 1 |
| 4 | Phase 1 |
