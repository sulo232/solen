# Roadmap R16: Staff Profiles & Selection

> **Scope:** Staff profile pages, booking flow staff picker, portfolio V3 polish
> **Design System:** V3 — read `_rules/UI_RULES.md` fully before starting.
> **Pre-existing code:** `components/StaffPortfolio.tsx`, `components/discovery/StaffPortfolio.tsx`, `components/dashboard/StaffComparison.tsx`, `supabase/migrations/069_megabuild_staff.sql`

---

## Pre-read Requirements

1. Read `CLAUDE.md` fully
2. Read `_rules/UI_RULES.md` fully
3. Read existing `components/StaffPortfolio.tsx` — it has the base component but needs V3 polish and type fixes

---

## Phase 1: StaffMember Type Update + Bio Column

> **Goal:** Add missing fields to `StaffMember` and DB so staff profiles feel complete.

#### Files
- `[MODIFY]` `lib/types.ts` — add `bio`, `instagram_url`, `years_experience` to `StaffMember`
- `[NEW]` `supabase/migrations/XXX_staff_profile_fields.sql`

#### Instructions
1. Add to `StaffMember` interface:
   ```typescript
   bio?: string | null;
   instagram_url?: string | null;
   years_experience?: number | null;
   ```
2. Migration: `ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS bio TEXT, ADD COLUMN IF NOT EXISTS instagram_url TEXT, ADD COLUMN IF NOT EXISTS years_experience INT;`
3. Check if columns already exist in `069_megabuild_staff.sql` before creating migration — DON'T duplicate.

#### Verification
```bash
npx tsc --noEmit
npm run build
```

---

## Phase 2: Staff Profile Page

> **Goal:** Dedicated page per staff member so users can browse their work before booking.

#### Files
- `[NEW]` `app/[locale]/salon/[slug]/staff/[staffId]/page.tsx`
- `[NEW]` `components/staff/StaffProfilePage.tsx`

#### Instructions
1. Server component page that fetches staff member + their portfolio images + their reviews + their services.
2. Layout:
   - **Hero section**: Avatar (large, 96px), name (font-heading bold), specialties as coral pills, star rating + review count
   - **Bio section**: If `bio` exists, show in DM Sans 400 15px
   - **Portfolio gallery**: Instagram-style 3-column grid with lightbox (reuse pattern from existing `StaffPortfolio.tsx`)
   - **Services they offer**: Cards showing service name, duration, price — each with "Bei {name} buchen" CTA
   - **Reviews for this staff**: Filter `reviews` table by `staff_member_id`
3. V3 tokens: `rounded-card`, `shadow-warm-md`, `font-heading`, `text-s-ink`, no glassmorphism (Zone 3)
4. Add `<Suspense>` boundary around any `useSearchParams()` usage

#### ✅ DO
```tsx
<div className="rounded-card border border-s-ink/5 dark:border-white/5 p-6 bg-white dark:bg-s-dm-surface">
  <h1 className="font-heading font-bold text-2xl text-s-ink dark:text-s-dm-text">{staff.name}</h1>
</div>
```

#### ❌ DON'T
```tsx
// Don't use bg-white/40 backdrop-blur (that's Zone 1 glass — staff page is Zone 3)
// Don't use rounded-button (banned — use rounded-btn)
// Don't hardcode text colors like text-gray-800
```

#### Verification
```bash
npm run build
```

---

## Phase 3: Staff Selection in Booking Flow

> **Goal:** Let users pick a specific staff member when booking a service.

#### Files
- `[MODIFY]` `components/booking/BookingFlow.tsx` (or equivalent booking wizard component)
- `[NEW]` `components/booking/StaffPicker.tsx`

> ⚠️ **PRE-EXISTING CODE**: Check `components/booking/` first — the booking flow may already have a staff selection step. Grep for `staff_member_id` in booking components.

#### Instructions
1. After service selection, show a `StaffPicker` step:
   - List available staff for that service (from `staff_services` join table)
   - Show avatar, name, specialties, avg rating
   - "Egal" option (no preference → auto-assign)
   - Selecting a staff member filters available time slots to that person's schedule
2. Design: Horizontal scroll of staff cards (mobile) or grid (desktop)
3. Each card: `rounded-card border border-s-ink/5 p-3 hover:-translate-y-[5px] hover:shadow-warm-xl transition-all duration-250`
4. Selected state: `border-s-coral ring-2 ring-s-coral/20`

#### Verification
```bash
npm run build
```

---

## Phase 4: Polish StaffPortfolio.tsx (V3 Sweep)

> **Goal:** Fix existing component to match V3 design system.

#### Files
- `[MODIFY]` `components/StaffPortfolio.tsx`

#### Instructions
1. Replace `rounded-button` → `rounded-btn` (line 86) — BANNED token
2. Remove type-cast hacks: `(member as StaffMember & { avg_rating?: number })` — these fields now exist in the type (Phase 1)
3. Replace `(member as StaffMember & { bio?: string }).bio` → `member.bio` (clean after Phase 1)
4. Button hover: add `hover:bg-s-coral-hover transition-colors shadow-warm-sm`
5. Lightbox: add swipe navigation for mobile

#### Verification
```bash
grep -rn "rounded-button" components/StaffPortfolio.tsx  # Must return 0
npx tsc --noEmit
npm run build
```

---

## Phase 5: Salon Page Staff Section

> **Goal:** Show staff members on the salon detail page so users can browse before booking.

#### Files
- `[MODIFY]` Salon detail page (`app/[locale]/salon/[slug]/page.tsx` or equivalent)
- `[NEW]` `components/salon/StaffSection.tsx`

#### Instructions
1. New section below services: "Unser Team" heading with amber eyebrow
2. Horizontal scroll of staff cards showing avatar, name, specialties, rating
3. Each card links to `/salon/{slug}/staff/{staffId}`
4. Only show if salon has `staff.length > 0`

#### Verification
```bash
npm run build
```

---

## Execution Order

| Phase | Depends On |
|---|---|
| 1 | Nothing |
| 2 | Phase 1 (needs updated types) |
| 3 | Phase 1 |
| 4 | Phase 1 |
| 5 | Phase 2 |
