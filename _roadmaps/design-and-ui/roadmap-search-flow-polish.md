# Roadmap: Search Flow Polish (Post-Redesign)

> **Goal:** Resolve the remaining UX gaps in the Airbnb-style search bottom sheet: fix mobile layout overlap, upgrade category selection to a vertical list, solidify step-collapsing behavior, add a real calendar date picker to Step 3, and implement pill-based filter display on the search results page so users can modify/remove search criteria.

---

## Breakage Risk Assessment (R1)

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟢 SAFE | Nothing — CSS-only fixes | — |
| Phase 2 | 🟢 SAFE | Nothing — visual refactor inside GuidedSearch | — |
| Phase 3 | 🟡 MEDIUM | Step transitions & collapsed rows if motion keys collide | Keep existing `key="step1"` / `key="step2"` / `key="step3"` — do NOT rename |
| Phase 4 | 🟡 MEDIUM | Date picker calendar if `react-aria-components` API is mis-used | Reuse existing `SolenDatePicker` wrapper; parse value with `@internationalized/date` |
| Phase 5 | 🟡 MEDIUM | Search results page if filter URL params change shape | Keep existing `searchParams` keys (`category`, `q`, `date`, `time`); only ADD new display chips |
| Phase 6 | 🟢 SAFE | Nothing — documentation only | — |

### 🔴 / 🟡 Risk Details

**Phase 3 risk — files at risk:**
- `components/ui/GuidedSearch.tsx` (lines 385–460): The existing tab bar + collapsed row logic. The `layoutId="stepTabIndicator"` must stay for the active tab underline animation.
- **How to avoid:** Do NOT change the `AnimatePresence mode="wait"` wrapping Steps 1/2/3. Do NOT change the `key` props on step motion divs.

**Phase 4 risk — files at risk:**
- `components/ui/GuidedSearch.tsx`: Step 3 (Wann) currently uses `DATE_QUICK_PICKS` pills + `TIME_KEYS` pills. Adding a full calendar inline requires importing `SolenDatePicker` and managing a `DateValue` state alongside the existing `dateKey` / `timeKey` states.
- `components/ui/date-picker.tsx`: The existing `SolenDatePicker` uses `<Popover>` for desktop; inside the bottom sheet we need an **inline calendar** (no popover), so we'll add an `inline` prop variant.
- **How to avoid:** Add `inline?: boolean` prop to `SolenDatePicker`. When `inline={true}`, render the `<Calendar>` directly without `<Popover>`. Do NOT remove or change the existing popover behavior.

**Phase 5 risk — files at risk:**
- `components/search/SplitView.tsx` (lines 30–50, 146–175): Filter state + URL sync. We're adding initial chip hydration from URL params, NOT changing existing filter-change logic.
- `components/ui/FilterBar.tsx`: Adding "search criteria" chips from URL params alongside existing filter pills.
- **How to avoid:** Pass search criteria as a separate `searchCriteria` prop, NOT mixed into `activeFilters`. This keeps the existing filter system intact.

---

## Phase Overview (R2)

### 🤖 CLAUDE CODE PHASES

| Phase | Title |
|---|---|
| Phase 1 | Fix mobile layout overlap (CSS) |
| Phase 2 | Category UI → vertical list with icon + description |
| Phase 3 | Step-collapsing UX polish |
| Phase 4 | Inline calendar date picker for Step 3 |
| Phase 5 | Pill-based search filter display on results page |
| Phase 6 | Update CLAUDE.md + INCOMPLETE_FEATURES.md |

### 🧑 MANUAL PHASES

None — this roadmap is 100% code changes. No external accounts, API keys, or DNS needed.

---

## Phase 1: Fix Mobile Layout Overlap (CSS)

**Zone:** Zone 1 (Hero/Search). Glass allowed, animations allowed.

### Problem
On mobile (375px viewport), the search input inside the bottom sheet overlaps with the "Was suchst du?" step label. The sheet height also doesn't respect the virtual keyboard when the input is focused.

### Files

#### [MODIFY] `components/ui/GuidedSearch.tsx`

**Changes:**
1. Add `min-h-0` to the scrollable content area to prevent flex overflow on small screens
2. Add `pb-[env(safe-area-inset-bottom)]` to the sheet container for iPhone notch
3. Ensure the step tab bar uses `shrink-0` (already present) and the content area uses `flex-1 min-h-0`
4. Add a `visualViewport` resize listener to adjust sheet height when the mobile keyboard opens

**✅ DO:**
```tsx
// Listen for virtual keyboard on mobile
useEffect(() => {
  if (!isOpen) return;
  const handler = () => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const keyboardHeight = window.innerHeight - viewport.height;
    const sheet = document.getElementById("gs-sheet");
    if (sheet) {
      sheet.style.maxHeight = keyboardHeight > 100
        ? `${viewport.height - 20}px`
        : "88svh";
    }
  };
  window.visualViewport?.addEventListener("resize", handler);
  return () => window.visualViewport?.removeEventListener("resize", handler);
}, [isOpen]);
```

**❌ DON'T:**
```tsx
// DON'T use fixed pixel heights that break on different phones
style={{ maxHeight: "600px" }}

// DON'T use 100vh — it includes the address bar on iOS Safari
style={{ maxHeight: "100vh" }}
```

### Verification
```bash
# Check safe-area-inset is used
grep -n "safe-area-inset" components/ui/GuidedSearch.tsx
# Expected: at least 2 results (footer + sheet container)

# Check visualViewport listener exists
grep -n "visualViewport" components/ui/GuidedSearch.tsx
# Expected: at least 1 result

# Build
npm run build 2>&1 | grep -E "error|Error" | grep -v "Supabase client\|node_modules" | head -10
```

```bash
git add components/ui/GuidedSearch.tsx
git commit -m "fix(search): mobile layout overlap and keyboard handling in bottom sheet"
```

> ⚠️ **BE CAREFUL:**
> - Do NOT change the `maxHeight: "88svh"` default — only override it dynamically when keyboard is open
> - Do NOT move the `id="gs-sheet"` to a different element — the keyboard handler depends on it
> - The `env(safe-area-inset-bottom)` is already on the footer CTA area (line 761) — verify it stays there
> - Test on both iOS Safari (safe-area) and Android Chrome (visualViewport)
> - Do NOT touch `components/HomePage.tsx` — the GuidedSearch wrapper `max-w-2xl` is fine

---

## Phase 2: Category UI → Vertical List

**Zone:** Zone 1 (Hero/Search). Glass + animation allowed.

### Problem
The current Step 1 (Was) uses a **2-column grid** of category cards (`grid grid-cols-2`). The user spec calls for a clean **vertical list** with icon + name + sub-description, similar to Airbnb's bottom sheet category selection.

### Files

#### [MODIFY] `components/ui/GuidedSearch.tsx`

**BEFORE (current, lines ~481–525):**
```tsx
{/* 2-col category card grid */}
<div className="grid grid-cols-2 gap-2 mb-4">
  {/* All services card first */}
  <button ... className="flex items-center gap-3 px-4 py-3.5 rounded-card border ...">
    <Star size={18} ... />
    ...
  </button>
  {CATEGORY_LIST.map((cat) => (
    <button ... className="flex items-center gap-3 px-4 py-3.5 rounded-card border ...">
      <cat.Icon width={18} height={18} ... />
      ...
    </button>
  ))}
</div>
```

**AFTER:**
```tsx
{/* Vertical category list */}
<div className="flex flex-col divide-y divide-[#F5F5F5] dark:divide-white/[0.06] mb-2">
  {/* All services row */}
  <button
    onClick={() => selectService(null)}
    className={cn(
      "w-full flex items-center gap-4 py-4 text-left transition-colors",
      !category
        ? "text-s-coral"
        : "text-s-ink/70 dark:text-s-dm-text/70 hover:bg-s-ink/[0.02] dark:hover:bg-white/[0.02]"
    )}
    aria-label={t("steps.was.skip" as Parameters<typeof t>[0])}
  >
    <div className="w-10 h-10 rounded-[12px] flex items-center justify-center bg-s-ink/[0.04] dark:bg-white/[0.06] shrink-0">
      <Star size={18} aria-hidden="true" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[14px] font-heading font-bold leading-tight">
        {t("steps.was.skip" as Parameters<typeof t>[0])}
      </p>
      <p className="text-[12px] text-s-ink/45 dark:text-s-dm-text/45 leading-tight mt-0.5">
        {t("steps.was.skipSub" as Parameters<typeof t>[0])}
      </p>
    </div>
    {!category && <Check size={16} className="text-s-coral shrink-0" aria-hidden="true" />}
  </button>

  {CATEGORY_LIST.map((cat) => (
    <button
      key={cat.key}
      onClick={() => selectCategory(cat.key)}
      aria-label={tNav(cat.key as Parameters<typeof tNav>[0])}
      className={cn(
        "w-full flex items-center gap-4 py-4 text-left transition-colors",
        category === cat.key
          ? "bg-s-coral/[0.04] dark:bg-s-coral/[0.08]"
          : "hover:bg-s-ink/[0.02] dark:hover:bg-white/[0.02]"
      )}
    >
      <div className="w-10 h-10 rounded-[12px] flex items-center justify-center bg-s-coral/[0.06] shrink-0">
        <cat.Icon width={20} height={20} className="text-s-coral" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-heading font-bold text-s-ink dark:text-s-dm-text leading-tight">
          {tNav(cat.key as Parameters<typeof tNav>[0])}
        </p>
        <p className="text-[12px] text-s-ink/45 dark:text-s-dm-text/45 leading-tight mt-0.5 truncate">
          {getCatSub(cat)}
        </p>
      </div>
      {category === cat.key && (
        <Check size={16} className="text-s-coral shrink-0" aria-hidden="true" />
      )}
    </button>
  ))}
</div>
```

### Key Differences
- **Layout:** `grid grid-cols-2` → `flex flex-col divide-y`
- **Icon container:** `w-9 h-9 rounded-[10px]` → `w-10 h-10 rounded-[12px]` (larger, more modern)
- **Icon size:** `18×18` → `20×20` (more visible in vertical layout)
- **Padding:** `px-4 py-3.5` → `py-4` (taller rows, full-width tap targets)
- **Check mark:** Now visible on the selected category AND the "All services" row

### Verification
```bash
# Verify no grid-cols-2 in category section
grep -n "grid-cols-2" components/ui/GuidedSearch.tsx
# Expected: 0 results (should be removed)

# Verify vertical list pattern
grep -n "flex flex-col divide-y" components/ui/GuidedSearch.tsx
# Expected: at least 1 result

npm run build 2>&1 | tail -5
```

```bash
git add components/ui/GuidedSearch.tsx
git commit -m "feat(search): replace 2-col category grid with vertical list layout"
```

> ⚠️ **BE CAREFUL:**
> - The `CATEGORY_LIST` array and its `Icon` components (`CoiffeurIcon`, `BarberIcon`, etc.) MUST NOT be changed — they come from `components/icons/category/`
> - The service drill-down (shown when `showServices === true`) is a SEPARATE section — do NOT modify it in this phase
> - The "Skip step" link at the bottom of Step 1 (`{t("skipStep")} →`) must remain
> - Do NOT add new translation keys — reuse existing `steps.was.skip`, `steps.was.skipSub`, `change`, etc.
> - Do NOT change the step tab bar at the top of the sheet (lines 388–416) — it's a separate UI element

---

## Phase 3: Step-Collapsing UX Polish

**Zone:** Zone 1 (Hero/Search). Animations allowed.

### Problem
The collapsed rows for completed steps (shown when `step > 1` / `step > 2`) currently display correctly but lack:
1. A smooth height transition when collapsing/expanding
2. Visual feedback when tapping "Ändern" (the step should expand with a brief highlight)
3. On Step 3, both collapsed rows should stack cleanly above the Wann content

### Files

#### [MODIFY] `components/ui/GuidedSearch.tsx`

**Changes:**
1. Wrap the collapsed rows in `<motion.div>` with `animate={{ height: "auto" }}` for smooth collapse/expand
2. Add a brief flash of `bg-s-coral/[0.04]` when "Ändern" is tapped (via a transient state)
3. Ensure the collapsed rows smoothly animate between steps using `AnimatePresence`

**✅ DO:**
```tsx
{/* Collapsed Was row with smooth animation */}
<AnimatePresence>
  {step > 1 && (
    <motion.div
      key="collapsed-was"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      className="overflow-hidden"
    >
      <div className="flex items-center justify-between py-3 border-b border-[#F0F0F0] dark:border-white/[0.07]">
        {/* ... existing content ... */}
      </div>
    </motion.div>
  )}
</AnimatePresence>
```

**❌ DON'T:**
```tsx
// DON'T use CSS display:none — breaks animation
{step > 1 ? <div>...</div> : null}

// DON'T use framer-motion layout prop on collapsed rows — it fights with AnimatePresence
<motion.div layout> {/* BAD */}
```

### Verification
```bash
# Check collapsed row animations exist
grep -n "collapsed-was\|collapsed-wo" components/ui/GuidedSearch.tsx
# Expected: 2 results (one for Was, one for Wo)

# Check AnimatePresence wraps collapsed rows
grep -B2 "collapsed-was" components/ui/GuidedSearch.tsx
# Expected: <AnimatePresence> above the collapsed row

npm run build 2>&1 | tail -5
```

```bash
git add components/ui/GuidedSearch.tsx
git commit -m "feat(search): add smooth collapse/expand animations for completed steps"
```

> ⚠️ **BE CAREFUL:**
> - Do NOT change the outer `<AnimatePresence mode="wait">` that wraps Step 1/2/3 content panels
> - The collapsed rows live OUTSIDE the step content `<AnimatePresence>` — they're always-rendered siblings
> - Do NOT use `layout` or `layoutId` on collapsed rows — it causes layout thrashing with the tab indicator's `layoutId="stepTabIndicator"`
> - The "Ändern" button's `onClick` already calls `setStep(1)` / `setStep(2)` — do NOT change its behavior
> - Verify that the sheet height doesn't jump when collapsed rows appear (the `flex-1 overflow-y-auto` on the scrollable area should absorb the height change)

---

## Phase 4: Inline Calendar Date Picker for Step 3

**Zone:** Zone 1 (Hero/Search). Glass + animation allowed on pills. The calendar itself is Zone 3 behavior (solid, no glass) but lives inside a Zone 1 container.

### Problem
Step 3 (Wann) currently only offers quick-pick pills ("Heute", "Morgen", "Diese Woche", etc.) and time-of-day pills ("Morgens", "Nachmittags", "Abends"). Users need the ability to pick a **specific date** from an inline calendar, alongside the quick picks.

### Files

#### [MODIFY] `components/ui/date-picker.tsx`

**Changes:** Add an `inline` boolean prop. When `true`, render the `<Calendar>` directly without `<DatePicker>`, `<Group>`, `<Popover>`, or `<DateInput>`.

**BEFORE (interface, line ~25):**
```tsx
interface SolenDatePickerProps {
  label?: string;
  value?: DateValue | null;
  onChange?: (date: DateValue) => void;
  // ...existing props
}
```

**AFTER:**
```tsx
interface SolenDatePickerProps {
  label?: string;
  value?: DateValue | null;
  onChange?: (date: DateValue) => void;
  // ...existing props
  /** When true, renders an inline calendar (no popover, no input). Use inside bottom sheets. */
  inline?: boolean;
}
```

**Add after the existing `return` (early return for inline):**
```tsx
if (inline) {
  return (
    <I18nProvider locale={locale}>
      <div className={cn("flex flex-col gap-1", className)}>
        {label && <Label className="text-xs font-medium text-s-ink/60 font-body">{label}</Label>}
        <Calendar
          value={value}
          onChange={(v) => v && onChange?.(v)}
          minValue={minValue}
          maxValue={maxValue}
          isDateUnavailable={isDateUnavailable}
        >
          {/* ...same header/grid as existing, but no Popover wrapper */}
        </Calendar>
      </div>
    </I18nProvider>
  );
}
```

#### [MODIFY] `components/ui/GuidedSearch.tsx`

**Changes:**
1. Add `import SolenDatePicker from "@/components/ui/date-picker"` and `import { today, getLocalTimeZone, type CalendarDate } from "@internationalized/date"`
2. Add `const [specificDate, setSpecificDate] = useState<CalendarDate | null>(null)` state
3. In Step 3 (Wann), after the quick-pick pills, add a "Bestimmtes Datum" toggle that shows an inline `<SolenDatePicker inline />`
4. When a specific date is selected, auto-update `dateKey` to a formatted ISO string (e.g., `"2026-04-15"`) and clear the quick-pick selection
5. Add a new i18n key `steps.wann.specificDate` for the toggle label

**✅ DO:**
```tsx
{/* Specific date toggle */}
<button
  onClick={() => setShowCalendar(!showCalendar)}
  className="flex items-center gap-2 text-[13px] font-heading font-semibold text-s-ink/60 dark:text-s-dm-text/60 hover:text-s-coral transition-colors mb-3"
>
  <CalendarIcon size={14} aria-hidden="true" />
  {t("steps.wann.specificDate" as Parameters<typeof t>[0])}
  <ChevronDown size={12} className={cn("transition-transform", showCalendar && "rotate-180")} />
</button>

{showCalendar && (
  <div className="mb-4 p-3 rounded-card border border-s-ink/[0.08] dark:border-white/[0.08] bg-white dark:bg-s-dm-raised">
    <SolenDatePicker
      inline
      value={specificDate}
      onChange={(v) => {
        setSpecificDate(v as CalendarDate);
        setDateKey(v.toString()); // ISO format "2026-04-15"
      }}
      minValue={today(getLocalTimeZone())}
      locale={locale === "de" ? "de-CH" : locale}
    />
  </div>
)}
```

**❌ DON'T:**
```tsx
// DON'T use the popover variant inside the bottom sheet — it creates z-index conflicts
<SolenDatePicker /> // without inline prop → opens a Popover

// DON'T import a third-party calendar library — use existing react-aria-components
```

#### [MODIFY] `messages/de.json`

Add inside `home.guidedSearch.steps.wann`:
```json
"specificDate": "Bestimmtes Datum wählen"
```

#### [MODIFY] `messages/en.json`

```json
"specificDate": "Choose specific date"
```

#### [MODIFY] `messages/fr.json`

```json
"specificDate": "Choisir une date précise"
```

#### [MODIFY] `messages/it.json`

```json
"specificDate": "Scegli una data specifica"
```

### Verification
```bash
# Check inline prop exists on date picker
grep -n "inline" components/ui/date-picker.tsx | head -5
# Expected: interface prop + conditional render

# Check SolenDatePicker is imported in GuidedSearch
grep -n "SolenDatePicker\|date-picker" components/ui/GuidedSearch.tsx
# Expected: import line

# Check @internationalized/date is imported
grep -n "internationalized" components/ui/GuidedSearch.tsx
# Expected: import { today, getLocalTimeZone, ... }

# Verify JSON syntax
node -e "JSON.parse(require('fs').readFileSync('messages/de.json','utf8')); console.log('de ok')"
node -e "JSON.parse(require('fs').readFileSync('messages/en.json','utf8')); console.log('en ok')"
node -e "JSON.parse(require('fs').readFileSync('messages/fr.json','utf8')); console.log('fr ok')"
node -e "JSON.parse(require('fs').readFileSync('messages/it.json','utf8')); console.log('it ok')"

npm run build 2>&1 | tail -5
```

```bash
git add components/ui/date-picker.tsx components/ui/GuidedSearch.tsx messages/*.json
git commit -m "feat(search): add inline calendar date picker to Step 3 (Wann)"
```

> ⚠️ **BE CAREFUL:**
> - Do NOT remove the existing quick-pick pills — they must coexist with the calendar. If a quick-pick is selected, clear `specificDate`. If a specific date is selected, deselect all quick-picks.
> - The existing `datePickToParam()` function in `lib/guided-search-data.ts` only handles quick-pick keys (`"today"`, `"tomorrow"`, etc.). For a specific date, pass the ISO string directly to the URL `date` param.
> - The `navigate()` function (line ~213) already handles `dateKey` → `datePickToParam()` → URL param. Add a branch: if `specificDate` is set, use `specificDate.toString()` directly.
> - Do NOT modify `lib/guided-search-data.ts` — it's shared data, handle the specific date logic in the component.
> - `@internationalized/date` is already a project dependency (used by `date-picker.tsx`).
> - The inline calendar must respect `prefers-reduced-motion` — no spring animations on date cells.

---

## Phase 5: Pill-Based Search Filter Display on Results Page

**Zone:** Zone 3 (Results/Listing). NO glass, NO animations on filter pills. Solid background, instant transitions.

### Problem
When a user completes the guided search and lands on `/de/search?category=coiffeur&date=today&time=morning`, there's no visual indication of what filters are active. Users should see removable "chips" showing their search criteria (e.g., `Coiffeur ✕`, `Heute ✕`, `Morgens ✕`).

### Files

#### [NEW] `components/search/SearchCriteriaChips.tsx`

**Purpose:** Reads URL search params and renders removable chips for each search criterion. Clicking ✕ removes that param from the URL.

```tsx
"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";

interface SearchCriteriaChipsProps {
  locale: string;
}

const PARAM_KEYS = ["category", "q", "date", "time"] as const;

export default function SearchCriteriaChips({ locale }: SearchCriteriaChipsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("search");
  const tNav = useTranslations("navigation");

  const removeParam = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const chips: { key: string; label: string }[] = [];

  for (const key of PARAM_KEYS) {
    const value = searchParams.get(key);
    if (!value) continue;

    let label: string;
    if (key === "category") {
      try { label = tNav(value as any); } catch { label = value; }
    } else if (key === "q") {
      label = `"${decodeURIComponent(value)}"`;
    } else if (key === "date") {
      label = value; // already localized or ISO date
    } else if (key === "time") {
      try { label = t(`time.${value}` as any); } catch { label = value; }
    } else {
      label = value;
    }

    chips.push({ key, label });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map(({ key, label }) => (
        <span
          key={key}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-s-ink/[0.06] dark:bg-white/[0.08] text-[12px] font-heading font-semibold text-s-ink dark:text-s-dm-text"
        >
          {label}
          <button
            onClick={() => removeParam(key)}
            className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-s-ink/10 dark:hover:bg-white/10 transition-colors"
            aria-label={t("removeFilter", { name: label })}
          >
            <X size={10} aria-hidden="true" />
          </button>
        </span>
      ))}
      {chips.length > 1 && (
        <button
          onClick={() => {
            const params = new URLSearchParams();
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
          }}
          className="text-[11px] font-body text-s-ink/45 dark:text-s-dm-text/45 hover:text-s-coral underline underline-offset-2 transition-colors"
        >
          {t("clearAll")}
        </button>
      )}
    </div>
  );
}
```

#### [MODIFY] `components/search/SplitView.tsx`

**Changes:** Import and render `SearchCriteriaChips` above the `FilterBar`.

**BEFORE (lines ~181–191):**
```tsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 bg-white dark:bg-s-dm-bg border-b border-s-ink/[0.06] dark:border-white/[0.06]">
  <div className="mb-3">
    <SearchAutocomplete category={category} />
  </div>
  <FilterBar
    pills={pills}
    activeFilters={activeFilters}
    onFilterChange={handleFilterChange}
    zone={3}
  />
</div>
```

**AFTER:**
```tsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 bg-white dark:bg-s-dm-bg border-b border-s-ink/[0.06] dark:border-white/[0.06]">
  <div className="mb-3">
    <SearchAutocomplete category={category} />
  </div>
  <SearchCriteriaChips locale={locale} />
  <FilterBar
    pills={pills}
    activeFilters={activeFilters}
    onFilterChange={handleFilterChange}
    zone={3}
  />
</div>
```

#### [MODIFY] `messages/de.json`

Add a `"search"` namespace (if not present) with:
```json
"search": {
  "removeFilter": "{name} entfernen",
  "clearAll": "Alle löschen",
  "time": {
    "any": "Egal",
    "morning": "Morgens",
    "afternoon": "Nachmittags",
    "evening": "Abends"
  }
}
```

#### [MODIFY] `messages/en.json`

```json
"search": {
  "removeFilter": "Remove {name}",
  "clearAll": "Clear all",
  "time": {
    "any": "Any time",
    "morning": "Morning",
    "afternoon": "Afternoon",
    "evening": "Evening"
  }
}
```

#### [MODIFY] `messages/fr.json`

```json
"search": {
  "removeFilter": "Supprimer {name}",
  "clearAll": "Tout effacer",
  "time": {
    "any": "N'importe quand",
    "morning": "Matin",
    "afternoon": "Après-midi",
    "evening": "Soir"
  }
}
```

#### [MODIFY] `messages/it.json`

```json
"search": {
  "removeFilter": "Rimuovi {name}",
  "clearAll": "Cancella tutto",
  "time": {
    "any": "Qualsiasi ora",
    "morning": "Mattina",
    "afternoon": "Pomeriggio",
    "evening": "Sera"
  }
}
```

### Verification
```bash
# Verify new component exists
ls components/search/SearchCriteriaChips.tsx
# Expected: file exists

# Verify it's imported in SplitView
grep -n "SearchCriteriaChips" components/search/SplitView.tsx
# Expected: import line + render line

# Verify new i18n keys
grep -A 5 '"search"' messages/de.json | head -10
# Expected: "removeFilter", "clearAll", "time"

# Test URL: navigate to /de/search?category=coiffeur&date=today&time=morning
# Expected: 3 chips visible (Coiffeur ✕, today ✕, Morgens ✕)

npm run build 2>&1 | tail -5
```

```bash
git add components/search/SearchCriteriaChips.tsx components/search/SplitView.tsx messages/*.json
git commit -m "feat(search): add removable search criteria chips on results page"
```

> ⚠️ **BE CAREFUL:**
> - This is Zone 3 — do NOT use `glass-pill`, `backdrop-blur`, or reveal animations on the chips
> - The chips use `bg-s-ink/[0.06]` (solid subtle background), NOT `glass-frost` or `glass-pill`
> - The `removeParam` function uses `router.replace` (not `router.push`) to avoid polluting browser history
> - Do NOT modify the existing `FilterBar` active chips section (lines 156-181 in FilterBar.tsx) — the search criteria chips are a SEPARATE component rendered above
> - The `"search"` namespace may already partially exist in messages — MERGE, do NOT overwrite
> - The chip for `category` should display the translated category name (e.g., "Coiffeur" not "coiffeur")
> - Do NOT touch `app/[locale]/search/page.tsx` — SplitView handles everything

---

## Phase 6: Update CLAUDE.md + Documentation (R8)

### Files

#### [MODIFY] `CLAUDE.md`

Add to Section 3.3 (Component Standards):
```markdown
- **Search Criteria Chips**: `<SearchCriteriaChips>` in `components/search/SearchCriteriaChips.tsx` — reads URL params and renders removable pills. Used in `SplitView.tsx` above `FilterBar`. Zone 3 only (no glass, no animations).
- **Inline Calendar**: `<SolenDatePicker inline>` renders an inline calendar without popover. Used inside the search bottom sheet (Step 3 / Wann).
```

Add to Section 3.2 (Key Directories):
```markdown
│   ├── search/            # Search result components (SplitView, SearchResultGrid, SearchCriteriaChips)
```

#### [MODIFY] `_tasks/INCOMPLETE_FEATURES.md`

Append:
```markdown
## Search Flow — Deferred Items (2026-03-30)

- **Swipe-to-close gesture** for bottom sheet — requires `@use-gesture/react`, separate task.
- **Autocomplete suggestions** in Was step while typing — requires `/api/search/suggest` endpoint, separate task.
- **Desktop popover variant** — bottom sheet is used on all screen sizes currently; desktop could use a dropdown instead, separate task.
- **Re-open with context** — when landing on results page, clicking the header search pill should re-open the sheet with the current URL params pre-filled. Requires reading `searchParams` and hydrating GuidedSearch state.
```

### Verification
```bash
grep -n "SearchCriteriaChips" CLAUDE.md
# Expected: at least 1 result

grep -n "Deferred Items" _tasks/INCOMPLETE_FEATURES.md
# Expected: at least 1 result

npm run build 2>&1 | tail -5
```

```bash
git add CLAUDE.md _tasks/INCOMPLETE_FEATURES.md
git commit -m "docs: update CLAUDE.md and INCOMPLETE_FEATURES for search flow polish"
```

> ⚠️ **BE CAREFUL:**
> - Do NOT delete any existing content in CLAUDE.md — only APPEND
> - Do NOT delete any existing content in INCOMPLETE_FEATURES.md — only APPEND
> - Do NOT add `.env.example` entries — no new env vars in this roadmap

---

## Dependency Ordering Table (R6)

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Fix mobile layout overlap (CSS) | Nothing |
| Phase 2 | 🤖 | Category UI → vertical list | Nothing (can run in parallel with Phase 1) |
| Phase 3 | 🤖 | Step-collapsing animations | Phase 1 + Phase 2 (GuidedSearch edits should be sequential to avoid merge conflicts) |
| Phase 4 | 🤖 | Inline calendar date picker | Phase 3 (modifies same file) |
| Phase 5 | 🤖 | Search criteria chips on results page | Nothing (independent file) |
| Phase 6 | 🤖 | Documentation update | Phase 4 + Phase 5 (documents all changes) |

---

## What's NOT in This Roadmap

- **Mobile swipe-to-close gesture** — requires `@use-gesture/react` dependency, separate task
- **Autocomplete search suggestions** in Was step — requires `/api/search/suggest` endpoint, separate task
- **Desktop-specific search popover** — bottom sheet is used on all screen sizes; a dedicated desktop experience is deferred
- **Re-open with pre-filled context** — re-opening the search sheet with current URL params pre-filled, separate task
- **Airbnb-style horizontal category icons on homepage** — that's the homepage category row (`CategoryRow.tsx`), NOT the search bottom sheet
- **Map-based "search this area"** — already implemented via `handleAreaSearch` in `SplitView.tsx`
