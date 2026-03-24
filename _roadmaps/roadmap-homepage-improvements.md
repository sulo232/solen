# 🏠 Homepage Improvements Roadmap

> **Scope:** `components/HomePage.tsx` and its direct sub-components only.
> **Source:** Full Platform Audit 2025 + `UI_RULES.md` v3 design system.
> **Context:** 0 live salons, 0 real photos. All section-visibility decisions respect this reality.

---

## Breakage Risk Assessment (R1)

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟢 SAFE | Nothing — CSS/copy changes only | — |
| Phase 2 | 🟢 SAFE | Nothing — new API route + admin UI | Reuse existing `platform_settings` pattern |
| Phase 3 | 🟡 MEDIUM | Blob button removal could affect partner CTA visual | Test that CTA still clickable after radius change |
| Phase 4 | 🟢 SAFE | Nothing — conditional rendering logic | Verify sections still show when data exists |
| Phase 5 | 🟢 SAFE | Nothing — category tile visual upgrade | Check mobile layout doesn't overflow |
| Phase 6 | 🟢 SAFE | Nothing — footer restyle | Check dark mode footer contrast |
| Phase 7 | 🟢 SAFE | Nothing — search bar locale fix | Test date picker still works after locale change |
| Phase 8 | 🟢 SAFE | Documentation only | — |

---

## Phase 1: Hero Section Rework — Functional & Brand-Forward

> **Goal:** Transform the hero from generic placeholder into an intentional brand moment with functional copy.

### [MODIFY] `components/HomePage.tsx`

**Current state (lines 241–275):**
- Anonymous users see `Beauty. Basel.` in `font-display` with coral dots
- Logged-in users see `Willkommen {userName}`
- Subtitle: "Coiffeur, Barbershop, Nails, Spa & mehr — buche jetzt in deinem Quartier."
- No eyebrow label above the hero heading

**Changes:**

1. **Add amber eyebrow label** above hero H1:
   - `Syne 700 11px uppercase ls .20em color amber` (UI_RULES §3, §18)
   - Text: `VON BASEL, FÜR BASEL`
   - Only shown for anonymous users

2. **Hero H1 — keep current text but fix typography:**
   - `Beauty. Basel.` is already using `font-display` (Bebas Neue) ✅
   - Current `letterSpacing: 0.04em` → change to `0.01em` per UI_RULES §18 row 1 (`letter-spacing 0.01em`)
   - Current `fontSize: clamp(56px, 8vw, 110px)` → change to `clamp(64px, 9vw, 130px)` per UI_RULES §18 row 1
   - Current `leading-none` → keep (line-height ~0.88 is correct per rules)

3. **Subtitle — make it functional (answer Q7: option A):**
   - Anonymous: `"Dein nächster Termin in Basel — buche Coiffeur, Nails, Spa & mehr."`
   - Logged-in with next booking: keep current dynamic text ✅
   - Logged-in without next booking: `"Willkommen zurück — was darf's heute sein?"`

4. **Hero section padding:**
   - Current `py-20 sm:py-28` → change to `py-16 sm:py-24` (8pt grid: 64px / 96px — UI_RULES §19a)

### ✅ DO
```tsx
<span className="font-heading font-bold text-[11px] uppercase tracking-[.20em] text-s-amber dark:text-s-amber mb-2 block">
  VON BASEL, FÜR BASEL
</span>
<motion.h1
  variants={fadeUp}
  className="font-display uppercase leading-none text-s-ink dark:text-s-dm-text"
  style={{ fontSize: "clamp(64px, 9vw, 130px)", letterSpacing: "0.01em" }}
>
  Beauty<span className="text-s-coral">.</span> Basel<span className="text-s-coral">.</span>
</motion.h1>
```

### ❌ DON'T
```tsx
// Don't use Syne for the hero H1 — it's Bebas Neue only at display size
// Don't use coral for the eyebrow — it's ALWAYS amber per UI_RULES §3
// Don't remove the personalized greeting for logged-in users
```

> ⚠️ **BE CAREFUL:** The hero H1 `style={{ fontSize: ... }}` uses an inline style because Tailwind doesn't support `clamp()` well for arbitrary font sizes. This is one of the accepted exceptions per UI_RULES. Don't try to convert this to a Tailwind class.

### Verification
```bash
git add components/HomePage.tsx
git commit -m "phase 1: hero rework — eyebrow, typography, functional copy"
npm run build # Must pass
```
- Visual check: Hero should show amber "VON BASEL, FÜR BASEL" above "BEAUTY. BASEL." in Bebas Neue at ~130px max size
- Mobile check: Title should scale down to ~64px on small screens

---

## Phase 2: Admin Homepage Section Toggle

> **Goal:** Create an admin panel toggle to control which homepage sections are visible. Uses the same `platform_settings` pattern as `social-proof` toggle.

### [NEW] `app/api/admin/homepage-sections/route.ts`

Admin-only GET/PUT route to manage homepage section visibility. Stores a JSON object in `platform_settings` with key `"homepage_sections"`:

```typescript
// Value shape in platform_settings:
{
  "quartier": false,      // Hide "Entdecke dein Quartier" (all show "Bald hier")
  "trending": false,      // Hide "Trending in Basel" (no data)
  "nearby": false,        // Hide "In deiner Nähe" (no salons)
  "new_salons": false,    // Hide "Neue Salons" (no data)
  "rebook": false,        // Hide "Wieder buchen?" (no bookings)
  "reviews": false,       // Hide ReviewCarousel (no reviews) 
  "last_minute": true,    // Show Last-Minute (even if empty — has a good empty state)
  "featured": true,       // Show Beliebte Salons (has empty state component)
  "social_proof": false,  // Already has its own toggle — link to it
  "partner_cta": true     // Show partner CTA section
}
```

**Pattern to follow:** Copy `app/api/admin/social-proof/route.ts` structure exactly (lines 1–57). Same auth checks, same `platform_settings` table, same response format.

### [NEW] `app/api/homepage-sections/route.ts`

Public GET route (no auth) that returns the section visibility config. Used by `HomePage.tsx` to conditionally render sections.

```typescript
// GET /api/homepage-sections → returns { sections: { quartier: false, ... } }
```

### [MODIFY] `components/HomePage.tsx`

1. Add a `useState<Record<string, boolean>>` for section visibility
2. Fetch `/api/homepage-sections` in `fetchData()` 
3. Wrap each conditional section in a visibility check:
   - `{sections.quartier && <QuartierSection />}`
   - `{sections.trending && trendingSalons.length > 0 && <TrendingSection />}`
   - etc.
4. Default all sections to `true` if the API fails (graceful degradation)

### [MODIFY] Dashboard admin settings page

Add a "Homepage Sections" card to the existing admin settings UI with toggles for each section. Use the same toggle switch component pattern used elsewhere in the dashboard.

### ✅ DO
```tsx
// Fetch section visibility alongside other data
fetch("/api/homepage-sections")
  .then((r) => r.ok ? r.json() : null)
  .then((data) => {
    if (data?.sections) setSections(data.sections);
  })
  .catch(() => {}); // Default to all-visible on error
```

### ❌ DON'T
```tsx
// Don't hardcode section visibility — it must be admin-controllable
// Don't require auth for the public GET endpoint
// Don't block page render waiting for this fetch — it's enhancement only
```

> ⚠️ **BE CAREFUL:** The `platform_settings` table uses `key` as a unique identifier. Make sure to use `"homepage_sections"` consistently (not `"homepage-sections"` or `"section_visibility"`). Check existing keys with: `SELECT key FROM platform_settings;`

### Verification
```bash
git add app/api/admin/homepage-sections/route.ts app/api/homepage-sections/route.ts components/HomePage.tsx
git commit -m "phase 2: admin homepage section visibility toggle"
npm run build
```
- Test: Call `GET /api/homepage-sections` — should return default config
- Test: Call `PUT /api/admin/homepage-sections` with `{ sections: { quartier: false } }` — should update
- Visual: Homepage should hide Quartier section when toggled off

---

## Phase 3: Fix UI Rule Violations

> **Goal:** Fix the 3 existing violations of UI_RULES found during audit.

### [MODIFY] `components/HomePage.tsx`

**Violation 1: Partner CTA button uses `rounded-blob-a blob-interactive`** (line 678)

- Current: `rounded-blob-a blob-interactive hover:bg-s-coral-hover`
- This violates UI_RULES §39 rules 1 ("BLOBS = DECORATIVE ONLY") and 2 ("ALL BUTTONS ARE PILLS 99px")
- Fix: Change to `rounded-btn` (99px pill) + remove `blob-interactive` class
- Keep `shadow-coral-glow` (that's correct per UI_RULES §31 button system)

**Violation 2: Salon card hover uses `hover:scale-[1.02]`** (lines 391, 484, 520)

- UI_RULES §4 Tier 3 says: "Card hover: `translateY(-5px)` + shadow upgrade to XL, 250ms. **NO scale transforms on cards.**"
- Fix: Replace `hover:scale-[1.02]` with `hover:-translate-y-[5px] hover:shadow-card-hover` on all salon card wrappers
- Also applies to Quartier cards (line 619): `hover:scale-[1.02]` → `hover:-translate-y-[5px] hover:shadow-card-hover`

**Violation 3: "Nochmal buchen" button uses `rounded-button`** (line 338)

- `rounded-button` is a banned token per UI_RULES §16
- Fix: Change to `rounded-btn`

### ✅ DO
```tsx
// Partner CTA — pill button, not blob
<Link
  href={`/${locale}/partner`}
  className="inline-flex items-center justify-center px-10 py-4 bg-s-coral text-white font-heading font-bold tracking-wide rounded-btn hover:bg-s-coral-hover text-lg shadow-coral-glow hover:shadow-coral-glow-hover transition-all duration-200 hover:-translate-y-[1px] active:translate-y-[1px] active:shadow-pressed uppercase tracking-[.04em]"
>
  PARTNER WERDEN
</Link>
```

### ❌ DON'T
```tsx
// Don't use blob shapes on ANY interactive element
className="rounded-blob-a blob-interactive"

// Don't use scale transforms on cards
className="hover:scale-[1.02]"

// Don't use banned radius tokens
className="rounded-button"
```

> ⚠️ **BE CAREFUL:** The `blob-interactive` class adds a CSS transition on `border-radius`. Removing it from the button won't affect anything else, but make sure the `.blob-interactive` class definition itself is NOT deleted from globals.css — it's still used for decorative elements elsewhere. `grep -rn "blob-interactive" components/` to verify.

### Verification
```bash
git add components/HomePage.tsx
git commit -m "phase 3: fix UI_RULES violations — pill buttons, no scale on cards"
npm run build
```
- Visual: Partner CTA should be a coral pill button, not blob-shaped
- Visual: Salon cards should lift up on hover (translateY), not scale
- Grep: `grep -rn "rounded-blob-a\|blob-interactive\|hover:scale-\[1.02\]\|rounded-button" components/HomePage.tsx` → should return 0 results

---

## Phase 4: Smart Section Visibility (Default Off for Empty Sections)

> **Goal:** Set sensible defaults so the homepage doesn't show empty states to first-time visitors.

### [MODIFY] `components/HomePage.tsx`

Even without the admin toggle (Phase 2), add smart conditional rendering:

1. **Quartier section** — currently shows "Bald hier" on all 7 cards.
   - Condition: Only render if `Object.values(quartierCounts).some(c => c > 0)` (at least 1 district has a salon)
   - If hidden, show nothing (no replacement block needed — categories + partner CTA already communicate value)

2. **Trending section** — already has `{trendingSalons.length > 0 && ...}` ✅ No change needed.

3. **Neue Salons section** — already has `{newSalons.length > 0 && ...}` ✅ No change needed.

4. **Wieder buchen** — already has `{lastBookedSalon && ...}` ✅ No change needed.

5. **Near You section** — currently always shows (with location prompt).
   - Change: Only show if either `nearbySalons.length > 0` or the user has explicitly clicked "Standort verwenden"
   - Default to hidden on first load. Add a `showNearby` state that's set to `true` only when the user interacts.
   - Reasoning: Asking for location permission on a page with 0 salons is pointless and erodes trust.

6. **ReviewCarousel** — currently always renders.
   - Wrap in a check: only render if the component fetches at least 1 review internally. The component should return `null` if empty (same pattern as `SocialProofStrip`).

### ✅ DO
```tsx
// Only show Quartier if at least one district has salons
{Object.values(quartierCounts).some(c => c > 0) && (
  <section className="py-12 bg-s-bg-surface/50">
    {/* Quartier grid */}
  </section>
)}
```

### ❌ DON'T
```tsx
// Don't show "Bald hier" on all 7 districts — it signals the platform is dead
// Don't prompt for location when there are 0 salons to show
// Don't keep the "In deiner Nähe" section visible with only an error state
```

> ⚠️ **BE CAREFUL:** The `fetchNearby` function is also called passively when geolocation permission is already granted (lines 208–214). Make sure the smart visibility check doesn't prevent showing nearby salons for users who've already granted permission AND there are actual salons to show. The condition should be: `showNearby state` OR `nearbySalons.length > 0`.

### Verification
```bash
git add components/HomePage.tsx
git commit -m "phase 4: smart section visibility — hide empty sections"
npm run build
```
- With 0 salons: homepage should show Hero → Categories → Last-Minute (empty state) → Partner CTA → Footer
- Quartier section, Trending, Near You, Neue Salons, ReviewCarousel should all be hidden

---

## Phase 5: Category Tiles Upgrade

> **Goal:** Transform the 6 plain text+icon tiles into visually distinct category cards per the audit and concept design.

### [MODIFY] `components/HomePage.tsx`

**Current state (lines 280–314):**
- 6 small glassmorphic tiles with Lucide icons + text
- `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6`
- Generic white/transparent background
- No brand colour differentiation between categories

**Changes:**

1. **Each category gets its own brand colour background:**

   | Category | Background | Border Accent |
   |---|---|---|
   | Coiffeur | `bg-s-coral-subtle` | `border-s-coral/20` |
   | Barbershop | `bg-s-ink/5` | `border-s-ink/10` |
   | Nails | `bg-s-plum-subtle` | `border-s-plum/15` |
   | Spa & Massage | `bg-s-sage-subtle` | `border-s-sage/20` |
   | Makeup | `bg-s-amber-subtle` | `border-s-amber/15` |
   | Waxing | `bg-s-blue-subtle` | `border-s-blue/15` |

2. **Update CATEGORIES constant** to include `bg` and `border` classes per category:
   ```typescript
   const CATEGORIES = [
     { key: "coiffeur",   label: "Coiffeur",    Icon: Scissors,           bg: "bg-s-coral-subtle",  border: "border-s-coral/20" },
     { key: "barbershop", label: "Barbershop",  Icon: ScissorsLineDashed,  bg: "bg-s-ink/5",         border: "border-s-ink/10" },
     // ... etc
   ] as const;
   ```

3. **Category tile label** — use `font-display` (Bebas Neue) at 22px per UI_RULES §18 row 5 (exception — decorative context):
   ```tsx
   <span className="font-display text-[22px] uppercase text-s-ink dark:text-s-dm-text leading-none">
     {label}
   </span>
   ```

4. **Hover effect** — per UI_RULES §4 Tier 3: `scale(1.03) rotate(-1deg)` for category tiles specifically:
   ```tsx
   className="... hover:scale-[1.03] hover:-rotate-1 transition-transform duration-250"
   ```

5. **Add section eyebrow + heading** above the category grid:
   ```tsx
   <span className="font-heading font-bold text-[11px] uppercase tracking-[.20em] text-s-amber">
     KATEGORIEN
   </span>
   <h2 className="font-heading font-extrabold text-s-ink dark:text-s-dm-text" style={{ fontSize: "clamp(26px, 3.5vw, 44px)", letterSpacing: "-0.02em" }}>
     Was suchst du?
   </h2>
   ```

6. **Icon size increase** — from `size={32}` to `size={36}` for more visual presence in the larger cards.

7. **Remove the "Entdecken" subtitle** on each tile — it adds no value and makes the tiles feel cluttered.

### ✅ DO
```tsx
<Link
  href={`/${locale}/${key}`}
  className={`flex flex-col items-center gap-2 p-6 rounded-card ${bg} dark:bg-s-dm-surface/80 border ${border} dark:border-white/5 hover:scale-[1.03] hover:-rotate-1 hover:shadow-card-hover transition-all duration-200 active:scale-95 group`}
>
  <Icon size={36} className="text-s-coral group-hover:scale-110 transition-transform duration-200" />
  <span className="font-display text-[22px] uppercase text-s-ink dark:text-s-dm-text leading-none">
    {label}
  </span>
</Link>
```

### ❌ DON'T
```tsx
// Don't use generic bg-white for all categories — each needs its own colour
// Don't use Syne or DM Sans for category tile labels — Bebas Neue at 22px per rules
// Don't use scale on regular cards — but category tiles specifically DO use scale per UI_RULES §4 Tier 3
```

> ⚠️ **BE CAREFUL:** The UI_RULES say Bebas Neue should never appear below 36px, but §18 row 5 explicitly exempts "Category tile labels" at 22px as a decorative context exception. This is one of only 2 exceptions (the other being nav logo at 22px).

### Verification
```bash
git add components/HomePage.tsx
git commit -m "phase 5: category tiles — brand colors, Bebas Neue labels, hover"
npm run build
```
- Visual: Each category should have a distinct soft colour background
- Visual: Labels should be in Bebas Neue uppercase
- Hover: Tiles should scale(1.03) + rotate(-1deg) on hover
- Mobile: `grid-cols-2` should still work with larger cards

---

## Phase 6: Footer Rework

> **Goal:** Redesign footer to match the audit concept — casual du-form, prominent brand wordmark, warmth.

### [MODIFY] `components/layout/Footer.tsx`

**Current state (152 lines):**
- Standard 4-column link grid (Kategorien, Unternehmen, Für Salons, Sozial)
- Small `so.len` wordmark at bottom (4xl / ~36px)
- Generic corporate layout, no personality

**Changes:**

1. **Add a full-width brand banner** above the link grid:
   - Large Bebas Neue text: `SO.LEN` at `clamp(44px, 6vw, 80px)` per UI_RULES §18 row 7
   - Subline: `"Von Basel, für Basel."` in DM Sans 400 italic 15px (hero description style per §18)
   - Background: keep `bg-s-ink` with decorative coral + blue blobs (same pattern as partner CTA)

2. **Rewrite "Für Salons" heading to du-form:**
   - Current: standard link list
   - Add a warm CTA line: `"Du hast einen Salon? Bring dein Business auf Solen."` → links to partner page

3. **Increase wordmark size at bottom:**
   - Current: `text-4xl` (~36px) → change to `text-5xl sm:text-6xl` (~48-60px)
   - Already uses `font-display` ✅

4. **Add coral accent to section headers:**
   - Current: `text-white/60 uppercase tracking-wider`
   - Change `tracking-wider` to `tracking-[.20em]` per UI_RULES §18 eyebrow spec
   - Keep `font-body` (not `font-heading` — these are small labels at 14px)

5. **Add "nDSG-konform" note** near legal links — trust signal for Swiss users.

### ✅ DO
```tsx
{/* Footer brand banner */}
<div className="text-center py-12 relative overflow-hidden">
  <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-s-coral/10 rounded-full blur-3xl" />
  <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-s-blue/8 rounded-full blur-3xl" />
  <h2 className="font-display text-white/90 relative z-10" style={{ fontSize: "clamp(44px, 6vw, 80px)", letterSpacing: "0.02em" }}>
    SO<span className="text-s-coral">.</span>LEN
  </h2>
  <p className="font-body italic text-white/50 text-sm mt-2 relative z-10">
    Von Basel, für Basel.
  </p>
</div>
```

### ❌ DON'T
```tsx
// Don't use formal "Sie" in the footer — the whole site uses du-form
// Don't add animated gradient backgrounds — Zone 1 rules apply but footer is subtle
// Don't use glass effects in footer — per UI_RULES §13 Tier 3 is the max for trust strip/footer panels
```

> ⚠️ **BE CAREFUL:** The footer component is used on ALL pages, not just the homepage. Don't add homepage-specific content (like booking CTAs) here. The footer must be universal.

### Verification
```bash
git add components/layout/Footer.tsx
git commit -m "phase 6: footer rework — brand banner, du-form, trust signal"
npm run build
```
- Visual: Footer should have a prominent SO.LEN wordmark banner
- Dark mode: Check that all text remains readable (white/90, white/50 etc.)
- Mobile: Ensure the brand banner doesn't overflow

---

## Phase 7: Search Bar — Date Locale Fix

> **Goal:** Fix the date input locale to Swiss German format (dd.mm.yyyy instead of mm/dd/yyyy).

### [MODIFY] `components/ui/HomeSearchBar.tsx`

**Current state:**
- Uses `<SolenDatePicker>` from `components/ui/date-picker.tsx`
- The date picker is built with `react-aria-components` + `@internationalized/date`
- Date format is calendar-based (not a text input) — the locale issue is in the calendar popup and display format

**Changes:**

1. **Check `date-picker.tsx`** — verify it respects locale prop
2. If the date format display anywhere shows `mm/dd/yyyy`, fix it by passing the `locale` from `useLocale()` to the calendar component
3. The `react-aria-components` `DatePicker` should auto-format based on locale — verify this is working by checking the internal format

### [MODIFY] `components/ui/date-picker.tsx`

If locale is not being passed down:
```tsx
import { useLocale } from "next-intl";
// Pass locale="de-CH" to the DateField/Calendar component
```

> ⚠️ **BE CAREFUL:** The `@internationalized/date` library handles locale formatting automatically IF the correct locale is passed. Don't try to manually format dates — let the library handle it. If the locale prop is already being passed, the issue might be in the browser's native `<input type="date">` (if used anywhere) which always uses the browser's system locale.

### Verification
```bash
git add components/ui/HomeSearchBar.tsx components/ui/date-picker.tsx
git commit -m "phase 7: fix date locale to de-CH (dd.mm.yyyy)"
npm run build
```
- Visual: Date display should show `24.03.2026` format, not `03/24/2026`
- Test: Click the calendar picker — dates should be in German (Mo, Di, Mi...) with dd.mm.yyyy format

---

## Phase 8: Update Documentation

> **Goal:** Update CLAUDE.md and UI_RULES.md if any new patterns/tokens were introduced.

### [MODIFY] `CLAUDE.md`

- Update Section 3.5 Key Features to mention "Admin-controlled homepage section visibility via `platform_settings`"
- Add `app/api/admin/homepage-sections/route.ts` to any relevant directory documentation

### [MODIFY] Task tracking

- Move this roadmap to `_tasks/completed/` when all phases are done

### Verification
```bash
git add CLAUDE.md
git commit -m "phase 8: update docs — homepage section toggle, completed roadmap"
npm run build
```

---

## Execution Order (R6)

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Hero rework — typography, eyebrow, copy | Nothing |
| Phase 2 | 🤖 | Admin section toggle API + homepage fetch | Nothing |
| Phase 3 | 🤖 | Fix UI rule violations (blob buttons, scale) | Nothing |
| Phase 4 | 🤖 | Smart section visibility defaults | Phase 2 (uses section config) |
| Phase 5 | 🤖 | Category tiles visual upgrade | Nothing |
| Phase 6 | 🤖 | Footer rework | Nothing |
| Phase 7 | 🤖 | Date locale fix | Nothing |
| Phase 8 | 🤖 | Documentation update | All above |

> Phases 1, 2, 3, 5, 6, 7 are independent and can be executed in parallel or any order.
> Phase 4 depends on Phase 2 (section config API).
> Phase 8 runs last.

---

## Summary of Files Changed

| Tag | File | Phase |
|---|---|---|
| [MODIFY] | `components/HomePage.tsx` | 1, 2, 3, 4, 5 |
| [NEW] | `app/api/admin/homepage-sections/route.ts` | 2 |
| [NEW] | `app/api/homepage-sections/route.ts` | 2 |
| [MODIFY] | `components/layout/Footer.tsx` | 6 |
| [MODIFY] | `components/ui/HomeSearchBar.tsx` | 7 |
| [MODIFY] | `components/ui/date-picker.tsx` | 7 |
| [MODIFY] | `CLAUDE.md` | 8 |
| [MODIFY] | Dashboard admin settings (existing page) | 2 |

---

## What This Roadmap Does NOT Cover (Future Roadmaps)

These items from the audit are platform-wide and belong in separate per-subsite roadmaps:

- **Sub-category reviews system** (Ergebnis / Atmosphäre / Preis-Leistung) → Review system roadmap
- **Staff selection + individual profiles** → Category-specific roadmaps
- **Recurring bookings** → Booking engine roadmap  
- **Map as primary discovery view** → Search/discovery roadmap
- **Guest checkout flow** → Checkout roadmap
- **Dark mode polish** → Design system roadmap
- **Real photography pipeline** → Content/operations (manual)
- **Salon onboarding (the 5-10 manual salons)** → Operations (manual)
- **PWA install prompt** → Already exists (CLAUDE.md §3.5 #19)
