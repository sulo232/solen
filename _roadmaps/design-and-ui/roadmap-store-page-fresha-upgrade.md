# Store Page Fresha-Level Upgrade — Master Roadmap

> **Scope:** Upgrade the salon detail page (`/salon/[slug]`) to match Fresha-level UX — scroll-aware tabs, service filtering, staff availability, gallery management, and enhanced profiles.
> **Standard:** Solen V3 — `CLAUDE.md` + `UI_RULES.md` Zone 2 (detail pages).
> **Origin:** Feature audit comparing Solen salon page vs Fresha store pages.

---

## Breakage Risk Assessment

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 — Scroll-Aware Tabs | 🟡 MEDIUM | Tab navigation on salon page | Keep existing TABS array, only ADD IntersectionObserver logic |
| Phase 2 — Service Category Filter | 🟢 LOW | Nothing — new additive feature | Don't modify `servicesByCategory` object, only add filter state |
| Phase 3 — Staff Enhancements | 🟡 MEDIUM | StaffSection, StaffProfilePage | DB migration adds columns as nullable — no existing queries break |
| Phase 4 — Gallery Management | 🟢 LOW | Nothing — entirely new dashboard feature | Uses existing `gallery_urls` field, new upload API |
| Phase 5 — Final Polish + CLAUDE.md | 🟢 LOW | Nothing | Additive only |

---

## Phase 1 — Scroll-Aware Sticky Tabs (Desktop + Mobile)

> **Goal:** Replace mobile accordion with a sticky horizontal tab bar that follows scroll position on both desktop and mobile. Active tab auto-updates as user scrolls past sections.

### Step 1.1 — IntersectionObserver Hook

#### [NEW] `hooks/useSectionObserver.ts`

```tsx
"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Observes section elements and returns the ID of the section
 * currently most visible in the viewport.
 */
export function useSectionObserver(sectionIds: string[]) {
  const [activeSection, setActiveSection] = useState(sectionIds[0]);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const ratios: Record<string, number> = {};

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          ratios[entry.target.id] = entry.intersectionRatio;
        });
        // Find section with highest visibility
        const best = Object.entries(ratios).reduce((a, b) =>
          b[1] > a[1] ? b : a
        );
        if (best[1] > 0) setActiveSection(best[0]);
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1], rootMargin: "-80px 0px -40% 0px" }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [sectionIds]);

  return activeSection;
}
```

> ⚠️ **BE CAREFUL:**
> - `rootMargin: "-80px 0px -40% 0px"` accounts for the sticky header (57px) + tab bar height (~40px). Tune if header height changes.
> - Do NOT use `threshold: 1` alone — sections taller than viewport will never fully intersect.
> - The `sectionIds` array must be stable (don't create inline) or the observer will re-mount on every render.

✅ DO: `const SECTION_IDS = useMemo(() => ["section-angebot", "section-bewertungen", "section-team", "section-standort"], []);`

❌ DON'T: `useSectionObserver(["section-angebot", "section-bewertungen", ...])` (creates new array every render)

**Git commit:** `git add hooks/useSectionObserver.ts && git commit -m "STORE-P1-S1: IntersectionObserver hook for scroll-aware tab tracking"`

---

### Step 1.2 — Unified Sticky Tab Bar Component

#### [NEW] `components/salon/SalonTabBar.tsx`

A single tab bar component used on both desktop AND mobile. Replaces the inline desktop-only tab bar in `page.tsx`.

**Key specs:**
- Horizontal scroll on mobile (no accordion)
- `position: sticky; top: 57px` — sits below the header
- Glassmorphism background: `rgba(250,246,239,.82)` + `backdrop-filter: blur(28px) saturate(1.3)`
- Active tab: coral `border-b-2` underline
- Receives `activeTab` from `useSectionObserver` + `onTabClick` callback
- Tab labels: **Angebot**, **Bewertungen**, **Team**, **Fotos**, **Portfolio**, **Standort**, **Info**
- The tab bar scrolls horizontally to keep the active tab visible on mobile

```tsx
interface SalonTabBarProps {
  activeTab: string;
  onTabClick: (tab: string) => void;
  tabs: { key: string; label: string }[];
}
```

> ⚠️ **BE CAREFUL:**
> - This is Zone 2. Use glassmorphism for the tab bar background.
> - `z-10` for the sticky positioning (below the header's z-20).
> - On mobile, use `overflow-x-auto scrollbar-hide` for horizontal scroll.
> - When a tab becomes active via scroll, auto-scroll the tab bar to center the active tab using `scrollIntoView({ inline: "center" })`.

**Git commit:** `git add components/salon/SalonTabBar.tsx && git commit -m "STORE-P1-S2: unified SalonTabBar — sticky, scroll-aware, mobile + desktop"`

---

### Step 1.3 — Integrate Into Salon Detail Page

#### [MODIFY] `app/[locale]/salon/[slug]/page.tsx`

1. **Import** `useSectionObserver` and `SalonTabBar`
2. **Replace** the inline desktop tab bar (L597-614) with `<SalonTabBar />`
3. **Remove** accordion toggle logic for mobile (keep section IDs for observer)
4. **Add sections** for new tabs: `section-fotos` (wrapping the gallery), `section-portfolio` (wrapping StaffPortfolio), `section-info` (wrapping the salon info cards)
5. **Wire up** `useSectionObserver` with all section IDs
6. **Make all sections always visible** (remove `hidden md:block` toggling)

**Changes required:**
- Remove: `const [openAccordion, setOpenAccordion] = useState<string | null>("angebot");`
- Remove: All accordion `<button>` headers with `ChevronDown`
- Remove: `${openAccordion === "..." ? "" : "hidden md:block"}` conditional classes
- Expand TABS array: `["angebot", "bewertungen", "team", "fotos", "portfolio", "standort", "info"]`
- Keep: All section `id="section-*"` attributes

> ⚠️ **BE CAREFUL:**
> - The page is 1269 lines. Do NOT rewrite the entire file. Only modify the specific sections.
> - `scrollToReviews()` must still work — it calls `document.getElementById("section-bewertungen")?.scrollIntoView`.
> - The mobile sticky CTA "Jetzt buchen" button sits at `bottom-5`. The tab bar should NOT overlap it.
> - Keep the `calendarOpen`, `selectedService`, `selectedStaff` state — the booking flow is unrelated.
> - Do NOT touch the right sidebar booking column (`lg:col-span-1`).

✅ DO: Remove accordion pattern, show all sections always, let tabs + scroll handle navigation.

❌ DON'T: Remove any section content or change the booking flow.

**Git commit:** `git add app/[locale]/salon/[slug]/page.tsx hooks/useSectionObserver.ts components/salon/SalonTabBar.tsx && git commit -m "STORE-P1-S3: scroll-aware sticky tabs replacing mobile accordion"`

---

## Phase 2 — Service Category Filter Pills

> **Goal:** Add a horizontally scrollable row of category pills below the tab bar to filter services by category (like Fresha's "Hair Care", "Beard Care", etc.).

### Step 2.1 — ServiceCategoryFilter Component

#### [NEW] `components/salon/ServiceCategoryFilter.tsx`

**Key specs:**
- Horizontal scroll row of pill buttons
- First pill = "Alle" (all categories, selected by default)
- Each pill shows category name + service count: `Hair Care (8)`
- Active pill: `bg-s-coral text-white`, inactive: `bg-s-bg-raised border border-s-ink/[0.08]`
- Pill style: `px-3 py-1.5 rounded-pill text-xs font-heading font-bold uppercase tracking-[.06em]`
- On mobile: horizontally scrollable with `scrollbar-hide`
- Fires `onCategoryChange(category: string | null)` — `null` = all

```tsx
interface ServiceCategoryFilterProps {
  categories: { key: string; count: number }[];
  activeCategory: string | null;
  onCategoryChange: (cat: string | null) => void;
}
```

> ⚠️ **BE CAREFUL:**
> - DO NOT use `FilterPills` or `FilterBar` from existing components — those are for discovery page, not salon detail page.
> - This component is specific to the salon page's service section.
> - Pill sizing matches the existing review sort buttons style (L1006 in page.tsx).

**Git commit:** `git add components/salon/ServiceCategoryFilter.tsx && git commit -m "STORE-P2-S1: ServiceCategoryFilter pill row component"`

---

### Step 2.2 — Wire Into Salon Detail Page

#### [MODIFY] `app/[locale]/salon/[slug]/page.tsx`

1. **Add state:** `const [serviceFilter, setServiceFilter] = useState<string | null>(null);`
2. **Compute categories** from `servicesByCategory`: `Object.entries(servicesByCategory).map(([key, svcs]) => ({ key, count: svcs.length }))`
3. **Render `<ServiceCategoryFilter />`** at the top of the `#section-angebot` div, BEFORE the category headers
4. **Filter services:** When a category is active, only show that category's services. When "Alle" is selected, show all.
5. **Update mobile CTA:** Show service count: `${filteredServices.length} Leistungen · Jetzt buchen`

> ⚠️ **BE CAREFUL:**
> - Do NOT modify the `servicesByCategory` reduce function. Create a separate filtered object.
> - The existing service click → booking flow (`setSelectedService(svc.id); setCalendarOpen(true);`) must remain intact.

**Git commit:** `git add app/[locale]/salon/[slug]/page.tsx components/salon/ServiceCategoryFilter.tsx && git commit -m "STORE-P2-S2: service category filtering with pill row"`

---

## Phase 3 — Staff Profile Enhancements

> **Goal:** Add language tags, rating badges on avatars, and a staff availability view.

### Step 3.1 — Database: Add `languages` Column

#### 🧑 MANUAL: Supabase SQL Migration

```sql
-- Add languages column to staff_members
ALTER TABLE staff_members
ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}';

-- Example: update existing records
-- UPDATE staff_members SET languages = ARRAY['de', 'en'] WHERE ...;

COMMENT ON COLUMN staff_members.languages IS 'ISO 639-1 language codes the staff member speaks';
```

#### [MODIFY] `lib/types.ts`

Add to `StaffMember` interface (after `years_experience`):
```tsx
languages?: string[]; // ISO 639-1 codes: ["de", "en", "fr", ...]
```

> ⚠️ **BE CAREFUL:**
> - Column is `text[]` with default `'{}'` — won't break any existing queries.
> - Add as optional (`?`) to TypeScript type — existing code won't break.
> - Do NOT add this to the `SalonCard` type — it's a staff-only field.

**Git commit:** `git add lib/types.ts && git commit -m "STORE-P3-S1: add languages field to StaffMember type (DB migration separate)"`

---

### Step 3.2 — Rating Badge on Staff Avatars

#### [MODIFY] `components/salon/StaffSection.tsx`

Add a small coral badge overlay on the bottom-right of the avatar circle showing the star rating:

```tsx
{/* Rating badge overlay on avatar */}
{m.average_rating != null && m.average_rating > 0 && (
  <div className="absolute -bottom-1 -right-1 flex items-center gap-0.5 bg-white dark:bg-s-dm-surface px-1.5 py-0.5 rounded-pill shadow-warm-xs border border-s-ink/5 dark:border-white/5">
    <Star size={8} className="fill-s-coral text-s-coral" />
    <span className="text-[9px] data-text font-semibold text-s-ink dark:text-s-dm-text">
      {m.average_rating.toFixed(1)}
    </span>
  </div>
)}
```

The avatar container needs `relative` added to its className for absolute positioning.

#### Add Language Tags

Below specialties, add language pills:

```tsx
{m.languages && m.languages.length > 0 && (
  <p className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40 text-center mt-0.5 uppercase tracking-wider">
    {m.languages.map(l => l.toUpperCase()).join(" · ")}
  </p>
)}
```

> ⚠️ **BE CAREFUL:**
> - The avatar div must gain `position: relative` for the badge to position correctly.
> - Don't remove the existing rating display below the name — keep BOTH (badge on avatar + text below).
>   Actually, REMOVE the old rating text below the name (L65-70) since the badge replaces it.
> - Do NOT change card width (180px) or the horizontal scroll behavior.

**Git commit:** `git add components/salon/StaffSection.tsx && git commit -m "STORE-P3-S2: rating badge on avatar + language tags in StaffSection"`

---

### Step 3.3 — Staff Availability View on Profile Page

#### [NEW] `components/staff/StaffAvailability.tsx`

**Key specs:**
- Shows the staff member's weekly schedule in a visual grid
- Days of the week as columns, time slots as rows
- Green = available, Grey = unavailable
- Fetches data from `/api/staff/[staffId]/schedule` (existing `StaffSchedule` type)
- "Nächster freier Termin" badge at the top showing the next available date+time
- "Buchen" button that pre-fills the staff member in the booking flow

```tsx
interface StaffAvailabilityProps {
  staffId: string;
  salonSlug: string;
  locale: string;
}
```

> ⚠️ **BE CAREFUL:**
> - `StaffSchedule` interface already exists in `lib/types.ts` (L740-750) with `day_of_week`, `start_time`, `end_time`.
> - This component must handle empty schedules gracefully (show "Keine Verfügbarkeit angegeben").
> - Time display should respect locale (24h for de, 12h for en).
> - Do NOT show booked slots — only show the schedule template. Actual booked slots are private.

✅ DO: Show the staff's configured schedule (the pattern of when they work).

❌ DON'T: Show live booking slots or expose other customers' appointment times.

**Git commit:** `git add components/staff/StaffAvailability.tsx && git commit -m "STORE-P3-S3: StaffAvailability weekly schedule grid"`

---

### Step 3.4 — Staff Schedule API Endpoint

#### [NEW] `app/api/staff/[staffId]/schedule/route.ts`

- `GET /api/staff/[staffId]/schedule` — returns the staff member's weekly schedule
- Query `staff_schedules` table filtered by `staff_member_id` and `is_active = true`
- Also query `staff_time_off` to mark upcoming off days
- Returns: `{ schedule: StaffSchedule[], timeOff: { start_date: string, end_date: string }[] }`
- Public endpoint — no auth required (schedule template is public)

> ⚠️ **BE CAREFUL:**
> - Do NOT expose `staff_breaks` — those are internal (lunch breaks etc.).
> - Time-off only returns future dates, not past.
> - Rate limit: use existing rate-limit middleware if available.

**Git commit:** `git add app/api/staff/[staffId]/schedule/route.ts && git commit -m "STORE-P3-S4: staff schedule API endpoint"`

---

### Step 3.5 — Integrate Availability Into StaffProfilePage

#### [MODIFY] `components/staff/StaffProfilePage.tsx`

1. Import `StaffAvailability`
2. Add between the Services section and the Reviews section:
```tsx
{/* Availability */}
<StaffAvailability staffId={staffId} salonSlug={salonSlug} locale={locale} />
```

> ⚠️ **BE CAREFUL:**
> - Keep the existing section order: Hero → Portfolio → **Availability (NEW)** → Services → Reviews
> - The "Buchen" links on each service already work: `/${locale}/salon/${salonSlug}?staffId=${staff.id}&serviceId=${s.id}`

**Git commit:** `git add components/staff/StaffProfilePage.tsx components/staff/StaffAvailability.tsx && git commit -m "STORE-P3-S5: availability schedule on staff profile page"`

---

## Phase 4 — Gallery Management (Dashboard Side)

> **Goal:** Let salon owners upload, reorder, and delete gallery photos from the dashboard.

### Step 4.1 — Gallery Upload API

#### [NEW] `app/api/salons/[salonId]/gallery/route.ts`

**Endpoints:**
- `POST /api/salons/[salonId]/gallery` — Upload photo(s)
  - Accepts `multipart/form-data` with `file` field
  - Uploads to Supabase Storage bucket `salon-gallery`
  - Generates a public URL and appends it to `gallery_urls` array on the salon record
  - Returns: `{ url: string }`
  - Auth: Must be salon owner (check `owner_id`)
  - Validates: file type (jpg/png/webp), max 5MB, max 20 photos total
  
- `DELETE /api/salons/[salonId]/gallery` — Remove a photo
  - Body: `{ url: string }` 
  - Removes from `gallery_urls` array and deletes from Supabase Storage
  - Auth: Must be salon owner

- `PATCH /api/salons/[salonId]/gallery` — Reorder photos
  - Body: `{ urls: string[] }` (the full array in new order)
  - Updates `gallery_urls` on the salon record
  - Auth: Must be salon owner

> ⚠️ **BE CAREFUL:**
> - Review photo upload at `app/api/reviews/[id]/photos/route.ts` exists as a reference pattern for Supabase Storage uploads.
> - The Storage bucket `salon-gallery` may need to be created manually in Supabase dashboard.
> - `gallery_urls` is a `text[]` column — use Supabase `.update()` with the new array.
> - Always validate `owner_id` matches the authenticated user.

✅ DO: Validate file type and size server-side. Use `sharp` or similar to resize to max 1920px width.

❌ DON'T: Trust client-side file validation alone. Never store raw uploads without size limits.

**Git commit:** `git add app/api/salons/[salonId]/gallery/route.ts && git commit -m "STORE-P4-S1: gallery upload/delete/reorder API endpoints"`

---

### Step 4.2 — Dashboard Gallery Manager Component

#### [NEW] `components/dashboard/GalleryManager.tsx`

**Key specs:**
- Grid of existing gallery photos with drag-to-reorder (use `@dnd-kit/core` or simple drag state)
- Upload button: opens file picker, shows upload progress
- Delete button: trash icon overlay on hover, confirms before deleting
- Cover photo indicator: first image is always the cover (indicated by a "Cover" badge)
- Max 20 photos enforcement with counter: `3/20 Fotos`
- Photo previews at ~160px × 120px with rounded-card corners

```tsx
interface GalleryManagerProps {
  salonId: string;
  galleryUrls: string[];
  coverPhotoUrl: string | null;
  onUpdate: () => void; // Callback to refresh salon data
}
```

**UI requirements (Zone 3 — Dashboard):**
- No glassmorphism (Zone 3)
- White card background: `bg-white dark:bg-s-dm-surface`
- Border: `border border-s-ink/5 dark:border-white/5`
- Upload button: `bg-s-coral text-white rounded-btn`
- Drag handle: 6-dot grip icon
- Responsive: 2 cols on mobile, 4 cols on desktop

> ⚠️ **BE CAREFUL:**
> - This is Zone 3 (Dashboard). DO NOT use glassmorphism. DO NOT use entry animations.
> - The cover photo is `cover_photo_url` (separate field from `gallery_urls`). Changing cover = update `cover_photo_url`.
> - Use optimistic updates: show the reordered grid immediately, then persist to API.
> - `@dnd-kit` may not be installed. Check `package.json` first. If not available, use a simpler button-based reorder (move up/down arrows).

**Git commit:** `git add components/dashboard/GalleryManager.tsx && git commit -m "STORE-P4-S2: dashboard GalleryManager with upload, delete, reorder"`

---

### Step 4.3 — Wire Gallery Manager Into Dashboard

#### [MODIFY] `components/dashboard/DashboardLayout.tsx` (or relevant dashboard page)

1. Add "Fotos" tab/section in the dashboard navigation
2. Render `<GalleryManager />` when the "Fotos" tab is active
3. Pass the current `galleryUrls` and `coverPhotoUrl` from salon data

> ⚠️ **BE CAREFUL:**
> - Check the existing dashboard tab/section structure before adding. Don't break existing tabs.
> - The salon data fetch in the dashboard should already include `gallery_urls` and `cover_photo_url`.

**Git commit:** `git add components/dashboard/DashboardLayout.tsx components/dashboard/GalleryManager.tsx && git commit -m "STORE-P4-S3: gallery manager wired into dashboard"`

---

### Step 4.4 — Salon About/Description Editor

#### [NEW] `components/dashboard/SalonAboutEditor.tsx`

**Key specs:**
- Simple textarea for salon description (de/en/fr/it — one tab per language)
- Character limit: 500 chars
- Fields: atmosphere, expertise, products, nearest_transport (existing fields)
- New field: `about_text_de`, `about_text_en` — freeform "About us" text
- Save button that PATCHes `/api/salons/mine`

#### 🧑 MANUAL: Add `about_text_de`, `about_text_en` columns

```sql
ALTER TABLE salons ADD COLUMN IF NOT EXISTS about_text_de text;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS about_text_en text;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS about_text_fr text;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS about_text_it text;
```

> ⚠️ **BE CAREFUL:**
> - These are nullable columns — no migration risk.
> - Update `lib/types.ts` Salon interface with these as optional fields.
> - The salon page should render `about_text_*` in the Info section.

**Git commit:** `git add components/dashboard/SalonAboutEditor.tsx lib/types.ts && git commit -m "STORE-P4-S4: salon about text editor + DB columns"`

---

## Phase 5 — Final Polish + Documentation

> **Goal:** Wire remaining small enhancements and update documentation.

### Step 5.1 — Enhanced Mobile CTA

#### [MODIFY] `app/[locale]/salon/[slug]/page.tsx`

Update the mobile sticky CTA to show service count:

**BEFORE:**
```tsx
<button ... className="fixed bottom-5 left-4 right-4 lg:hidden ...">
  Jetzt buchen
</button>
```

**AFTER:**
```tsx
<button ... className="fixed bottom-5 left-4 right-4 lg:hidden ...">
  {salon.services.length} Leistungen · Jetzt buchen
</button>
```

**Git commit:** `git add app/[locale]/salon/[slug]/page.tsx && git commit -m "STORE-P5-S1: service count in mobile CTA"`

---

### Step 5.2 — Opening Hours Green Dots

#### [MODIFY] `app/[locale]/salon/[slug]/page.tsx`

Add a green/grey dot indicator next to each day in the opening hours grid:

```tsx
<span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${h ? "bg-s-success" : "bg-s-ink/15"}`} />
```

Add before the day label in both the mobile and desktop hours grids.

**Git commit:** `git add app/[locale]/salon/[slug]/page.tsx && git commit -m "STORE-P5-S2: green/grey dots on opening hours"`

---

### Step 5.3 — Update CLAUDE.md + Incomplete Features

#### [MODIFY] `CLAUDE.md`

Add to Section 3.2 (Directory Tree):
```
hooks/useSectionObserver.ts          # IntersectionObserver for scroll-aware tabs
components/salon/SalonTabBar.tsx      # Sticky tab navigation for salon detail
components/salon/ServiceCategoryFilter.tsx # Service category pill filter
components/staff/StaffAvailability.tsx # Weekly schedule grid for staff profiles
components/dashboard/GalleryManager.tsx # Photo upload/reorder/delete for salons
components/dashboard/SalonAboutEditor.tsx # About text editor
```

Add to Schema Table (Section 6):
```
staff_members.languages    | text[]     | ISO 639-1 codes the staff member speaks
salons.about_text_de       | text       | Freeform "About us" text (German)
salons.about_text_en       | text       | Freeform "About us" text (English)
```

#### [MODIFY] `_tasks/INCOMPLETE_FEATURES.md`

Mark the store page upgrade features as completed (or in-progress if partial).

**Git commit:** `git add CLAUDE.md _tasks/INCOMPLETE_FEATURES.md && git commit -m "STORE-P5-S3: update docs with new salon page components + schema"`

---

## Dependency Ordering

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 S1 | 🤖 | IntersectionObserver hook | Nothing |
| Phase 1 S2 | 🤖 | SalonTabBar component | S1 |
| Phase 1 S3 | 🤖 | Integrate into salon page | S1, S2 |
| Phase 2 S1 | 🤖 | ServiceCategoryFilter | Nothing |
| Phase 2 S2 | 🤖 | Wire into salon page | P2-S1, P1-S3 |
| Manual A | 🧑 | SQL: Add `languages` to staff_members | Nothing |
| Manual B | 🧑 | SQL: Add `about_text_*` to salons | Nothing |
| Manual C | 🧑 | Create `salon-gallery` Storage bucket | Nothing |
| Phase 3 S1 | 🤖 | Types update for languages | Manual A |
| Phase 3 S2 | 🤖 | Rating badge + language tags | P3-S1 |
| Phase 3 S3 | 🤖 | StaffAvailability component | Nothing |
| Phase 3 S4 | 🤖 | Staff schedule API | Nothing |
| Phase 3 S5 | 🤖 | Integrate into StaffProfilePage | P3-S3, P3-S4 |
| Phase 4 S1 | 🤖 | Gallery upload API | Manual C |
| Phase 4 S2 | 🤖 | GalleryManager component | P4-S1 |
| Phase 4 S3 | 🤖 | Wire into dashboard | P4-S2 |
| Phase 4 S4 | 🤖 | SalonAboutEditor | Manual B |
| Phase 5 S1-S3 | 🤖 | Polish + docs | All above |

---

## Smoke Test (All Phases)

1. ✅ `npm run build` passes
2. ✅ `npx tsc --noEmit` passes
3. ✅ Salon page loads with sticky tab bar on desktop
4. ✅ Salon page loads with sticky tab bar on mobile (no accordion)
5. ✅ Scrolling past sections auto-updates the active tab
6. ✅ Clicking a tab smooth-scrolls to that section
7. ✅ Service category pills filter services correctly
8. ✅ "Alle" pill shows all services
9. ✅ Staff section shows rating badge on avatar
10. ✅ Staff section shows language tags
11. ✅ Clicking staff card navigates to `/salon/[slug]/staff/[staffId]`
12. ✅ Staff profile page shows availability schedule
13. ✅ Dashboard "Fotos" tab shows gallery manager
14. ✅ Can upload a photo via gallery manager
15. ✅ Can delete a photo via gallery manager
16. ✅ Can reorder photos via gallery manager
17. ✅ Mobile CTA shows service count
18. ✅ Opening hours show green/grey dots
19. ✅ `CLAUDE.md` updated with new components and schema
20. ✅ No banned tokens (run grep from UI_RULES Rule 20)
