# Roadmap A — Filter Pills: Shared Infrastructure

> **Scope**: Build the universal `<FilterBar>` component system — the single source of truth for ALL filters on Solen.ch.
> **Execute this first.** Roadmap B (page integration) depends on everything created here.
> **Zone-aware by design**: All components implement `zone` prop per `UI_RULES.md` Rule 31.
> **R10 pre-scan done**: No existing `FilterBar.tsx`, `FilterBottomSheet.tsx`, or `FilterDrawer.tsx` found in `components/ui/`. Types `FilterPill`, `FilterBarProps`, `ActiveFilter` not yet in `lib/types.ts`.
> 
> ⚠️ **COLLISION FIX (2026-03-25 — i18n compliance):** All hardcoded German button labels in FilterBar, FilterBottomSheet, and FilterDrawer ("Alle entfernen", "Zurücksetzen", "Anwenden", "Schliessen", "weitere Filter öffnen", "Filter entfernen") **MUST** use `useTranslations('filters')` from `next-intl`. Add translation keys to `messages/de.json`, `en.json`, `fr.json`, `it.json` under a `"filters"` namespace. This prevents Rule 33 violations from the i18n Hardening roadmap.

---

## R1 — Breakage Risk Assessment

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 — Types | 🟢 SAFE | Nothing | Types are additive; no existing code changes |
| Phase 2 — FilterBar component | 🟢 SAFE | Nothing | New file only; not imported anywhere until Roadmap B |
| Phase 3 — FilterBottomSheet | 🟢 SAFE | Nothing | New file only |
| Phase 4 — FilterDrawer | 🟢 SAFE | Nothing | New file only |
| Phase 5 — Barrel export | 🟡 MEDIUM | `components/index.ts` parse errors | Must not introduce duplicate exports; grep before adding |
| Phase 6 — CLAUDE.md update | 🟢 SAFE | Nothing | Doc update only |

---

## R2 — Phase Split

All phases in this roadmap are 🤖 **Claude Code only**. No manual dashboard steps required. No new environment variables, no DB migrations, no Supabase changes.

---

---

## 🤖 Phase 1 — Types [MODIFY `lib/types.ts`]

**What**: Add 5 new TypeScript types for the filter system. Must be added BEFORE any component is created (CLAUDE.md Rule 28).

### R5 — File
`[MODIFY] lib/types.ts` — append to end of file

### R4 — ✅ DO / ❌ DON'T

```typescript
// ✅ DO — append to the end of lib/types.ts
export type FilterZone = 1 | 2 | 3 | 4;

export interface FilterPill {
  id: string;          // e.g. "nails", "hair", "lashes"
  label: string;       // Display label (translated)
  icon?: string;       // Optional lucide icon name
  subFilters?: FilterSubItem[];
}

export interface FilterSubItem {
  id: string;
  label: string;
  count?: number;      // Optional result count badge
}

export interface ActiveFilter {
  pillId: string;
  subId: string;
  label: string;       // For the removable chip display
}

export interface FilterBarProps {
  pills: FilterPill[];
  activeFilters: ActiveFilter[];
  onFilterChange: (filters: ActiveFilter[]) => void;
  zone: FilterZone;    // MANDATORY — per UI_RULES Rule 31
  className?: string;
}
```

```typescript
// ❌ DON'T — define types inline inside the component file
interface FilterPill { ... }  // inside FilterBar.tsx — violates Rule 28
```

> ⚠️ **BE CAREFUL**: Do NOT create a new `types.ts` in `components/ui/`. All types live exclusively in `lib/types.ts`. Do not duplicate `FilterPill` if it somehow already exists — grep first: `grep -n "FilterPill" lib/types.ts`.

### R7 — Verification & Commit
```bash
# Verify types were added:
grep -n "FilterZone\|FilterPill\|ActiveFilter\|FilterBarProps" lib/types.ts
# Must return 5 lines minimum

npx tsc --noEmit 2>&1 | tail -5
# Must return 0 errors

git add lib/types.ts
git commit -m "feat(filter-pills): phase 1 — add FilterBar type definitions to lib/types.ts"
```

---

## 🤖 Phase 2 — FilterBar Component [NEW `components/ui/FilterBar.tsx`]

**What**: The main controlled filter container. Renders the pill row, active chips, and opens the correct sub-component based on viewport and zone.

### R5 — File
`[NEW] components/ui/FilterBar.tsx`

### R4 — ✅ DO / ❌ DON'T

```tsx
// ✅ DO — zone-aware animation classes (Rule 31)
const motionClass = (zone === 1 || zone === 2)
  ? 'transition-all duration-[220ms]'
  : 'transition-none duration-0';

// ✅ DO — hover lift only in Zone 1/2 (Rule 31)
const hoverLift = (zone === 1 || zone === 2) ? 'hover:-translate-y-px' : '';

// ✅ DO — correct token usage
className="rounded-pill shadow-warm-sm border border-s-ink/8 font-heading"

// ✅ DO — active state with coral glow
className="bg-s-coral text-white shadow-coral-glow"
```

```tsx
// ❌ DON'T — generic Tailwind tokens (banned by UI_RULES Rule 20)
className="rounded-full shadow-md border border-gray-200 font-sans"

// ❌ DON'T — missing zone prop
<FilterBar pills={pills} activeFilters={[]} onFilterChange={fn} />
// Missing zone= violates Rule 31

// ❌ DON'T — animate in Zone 3/4
if (zone === 3) {
  // still applies transition-all — WRONG
}
```

**Full component code:**

```tsx
'use client';

import { useState } from 'react';
import { ChevronDown, X, SlidersHorizontal } from 'lucide-react';
import type { FilterBarProps, FilterPill, ActiveFilter } from '@/lib/types';
import FilterBottomSheet from './FilterBottomSheet';
import FilterDrawer from './FilterDrawer';

const MAX_VISIBLE_DESKTOP = 5;

export default function FilterBar({
  pills,
  activeFilters,
  onFilterChange,
  zone,
  className = '',
}: FilterBarProps) {
  const [openPillId, setOpenPillId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetPill, setSheetPill] = useState<FilterPill | null>(null);

  // Zone-aware animation class — Rules 31, UI_RULES §4
  const motionClass = (zone === 1 || zone === 2)
    ? 'transition-all duration-[220ms] ease-[cubic-bezier(.4,0,.2,1)]'
    : 'transition-none duration-0';
  const hoverLift = (zone === 1 || zone === 2) ? 'hover:-translate-y-px' : '';

  const visiblePills = pills.slice(0, MAX_VISIBLE_DESKTOP);
  const overflowCount = pills.length - MAX_VISIBLE_DESKTOP;

  const isPillActive = (pillId: string) =>
    activeFilters.some((f) => f.pillId === pillId);

  const removeFilter = (filter: ActiveFilter) => {
    onFilterChange(activeFilters.filter(
      (f) => !(f.pillId === filter.pillId && f.subId === filter.subId)
    ));
  };

  const clearAll = () => onFilterChange([]);

  const handlePillClick = (pill: FilterPill) => {
    if (!pill.subFilters?.length) {
      const exists = activeFilters.some(
        (f) => f.pillId === pill.id && f.subId === pill.id
      );
      if (exists) {
        onFilterChange(activeFilters.filter((f) => f.pillId !== pill.id));
      } else {
        onFilterChange([
          ...activeFilters,
          { pillId: pill.id, subId: pill.id, label: pill.label },
        ]);
      }
      return;
    }
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSheetPill(pill);
      setSheetOpen(true);
    } else {
      setOpenPillId(openPillId === pill.id ? null : pill.id);
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      {/* Pill row */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
        {visiblePills.map((pill) => {
          const active = isPillActive(pill.id);
          return (
            <button
              key={pill.id}
              onClick={() => handlePillClick(pill)}
              className={[
                'flex items-center gap-1.5 px-4 py-2 rounded-pill text-sm font-heading whitespace-nowrap',
                'shadow-warm-sm border border-s-ink/8',
                motionClass,
                hoverLift,
                active
                  ? 'bg-s-coral text-white border-s-coral shadow-coral-glow'
                  : 'bg-[--raised] text-s-ink dark:text-s-dm-text hover:bg-s-coral-subtle hover:border-s-coral/30',
              ].join(' ')}
              aria-pressed={active}
              aria-label={`Filter: ${pill.label}`}
            >
              {pill.label}
              {pill.subFilters?.length ? (
                <ChevronDown
                  size={14}
                  className={`${motionClass} ${openPillId === pill.id ? 'rotate-180' : ''}`}
                  aria-hidden
                />
              ) : null}
            </button>
          );
        })}

        {/* "Mehr Filter" button — desktop only, Zone 1/2 only when overflow exists */}
        {overflowCount > 0 && (
          <button
            onClick={() => setDrawerOpen(true)}
            className={[
              'hidden md:flex items-center gap-1.5 px-4 py-2 rounded-pill text-sm font-heading whitespace-nowrap',
              'bg-[--raised] text-s-ink dark:text-s-dm-text shadow-warm-sm border border-s-ink/8',
              motionClass,
              hoverLift,
              drawerOpen
                ? 'bg-s-plum-subtle border-s-plum/30 text-s-plum-text'
                : 'hover:bg-s-coral-subtle',
            ].join(' ')}
            aria-expanded={drawerOpen}
            aria-label={`${overflowCount} weitere Filter öffnen`}
          >
            <SlidersHorizontal size={14} aria-hidden />
            {overflowCount} weitere
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className={`flex flex-wrap items-center gap-2 mt-2 ${motionClass}`}>
          {activeFilters.map((f) => (
            <span
              key={`${f.pillId}-${f.subId}`}
              className="flex items-center gap-1 px-3 py-1 rounded-pill bg-s-coral-subtle text-s-coral-text text-xs font-body shadow-card"
            >
              {f.label}
              <button
                onClick={() => removeFilter(f)}
                className="ml-0.5 hover:text-s-coral"
                aria-label={`Filter ${f.label} entfernen`}
              >
                <X size={11} aria-hidden />
              </button>
            </span>
          ))}
          <button
            onClick={clearAll}
            className="text-xs text-s-ink/50 hover:text-s-coral underline underline-offset-2 font-body"
          >
            Alle entfernen
          </button>
        </div>
      )}

      {/* Desktop inline dropdown */}
      {openPillId && (
        <FilterDrawer
          pill={pills.find((p) => p.id === openPillId)!}
          activeFilters={activeFilters}
          onFilterChange={onFilterChange}
          onClose={() => setOpenPillId(null)}
          zone={zone}
          mode="inline"
        />
      )}

      {/* Desktop full drawer (overflow) */}
      {drawerOpen && (
        <FilterDrawer
          pill={null}
          pills={pills}
          activeFilters={activeFilters}
          onFilterChange={onFilterChange}
          onClose={() => setDrawerOpen(false)}
          zone={zone}
          mode="drawer"
        />
      )}

      {/* Mobile bottom sheet */}
      {sheetOpen && sheetPill && (
        <FilterBottomSheet
          pill={sheetPill}
          activeFilters={activeFilters}
          onFilterChange={onFilterChange}
          onClose={() => { setSheetOpen(false); setSheetPill(null); }}
          zone={zone}
        />
      )}
    </div>
  );
}
```

> ⚠️ **BE CAREFUL**:
> - This component imports `FilterBottomSheet` and `FilterDrawer` — create those in Phases 3 & 4 FIRST, or this file will fail TypeScript. Execute phases in order.
> - Do NOT import `Header` or `BottomNav` here (Rule 27).
> - `window.innerWidth` check must be guarded by `typeof window !== 'undefined'` for SSR safety.
> - Do not add `useEffect` or server-side logic — this is a client component.

### R7 — Verification & Commit
```bash
# Only run build AFTER Phases 3 + 4 are also done (this file imports them)
# For now, type check only:
npx tsc --noEmit 2>&1 | grep "FilterBar" | head -5
# After Phase 4 is complete, commit all three together:
# git add components/ui/FilterBar.tsx components/ui/FilterBottomSheet.tsx components/ui/FilterDrawer.tsx
# git commit -m "..."
```

---

## 🤖 Phase 3 — FilterBottomSheet [NEW `components/ui/FilterBottomSheet.tsx`]

**What**: Mobile-only full-screen bottom sheet. Opens when a pill with sub-filters is tapped on viewport < 768px.

### R5 — File
`[NEW] components/ui/FilterBottomSheet.tsx`

### R4 — ✅ DO / ❌ DON'T

```tsx
// ✅ DO — Zone-aware surface (Rule 31 + UI_RULES §13)
const surfaceClasses = (zone === 1 || zone === 2)
  ? [
      'backdrop-blur-[16px]',
      'bg-white/[0.62]',
      'border border-white/[0.55]',
      '[--webkit-backdrop-filter:blur(16px)]',
    ].join(' ')
  : 'bg-[--raised]';  // Zone 3/4 — solid surface, no glass

// ✅ DO — Zone-aware animation (Rule 31 + UI_RULES §4)
const animClass = (zone === 1 || zone === 2)
  ? 'animate-in slide-in-from-bottom duration-300 ease-[cubic-bezier(0,.55,.45,1)]'
  : '';  // Zone 3/4 — zero animation

// ✅ DO — correct z-index (UI_RULES §14)
// Backdrop: z-[55] (z-modal-backdrop), Sheet: z-[60] (z-modal)

// ✅ DO — rounded-[20px] for sheet top (rounded-card)
className="rounded-t-[20px]"
```

```tsx
// ❌ DON'T — glass in Zone 3/4
if (zone === 3) {
  className="backdrop-blur-[16px] bg-white/60"  // ZONE VIOLATION
}

// ❌ DON'T — slide animation in Zone 3/4
if (zone === 4) {
  className="animate-in slide-in-from-bottom"   // ZERO ANIMATION ZONE
}

// ❌ DON'T — wrong z-index
className="z-50"  // must use z-[55] for backdrop, z-[60] for sheet
```

**Full component code:**

```tsx
'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { FilterPill, ActiveFilter, FilterZone } from '@/lib/types';

interface FilterBottomSheetProps {
  pill: FilterPill;
  activeFilters: ActiveFilter[];
  onFilterChange: (filters: ActiveFilter[]) => void;
  onClose: () => void;
  zone: FilterZone;
}

export default function FilterBottomSheet({
  pill,
  activeFilters,
  onFilterChange,
  onClose,
  zone,
}: FilterBottomSheetProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent background scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const isSubActive = (subId: string) =>
    activeFilters.some((f) => f.pillId === pill.id && f.subId === subId);

  const toggleSub = (sub: { id: string; label: string }) => {
    if (isSubActive(sub.id)) {
      onFilterChange(
        activeFilters.filter((f) => !(f.pillId === pill.id && f.subId === sub.id))
      );
    } else {
      onFilterChange([
        ...activeFilters,
        { pillId: pill.id, subId: sub.id, label: sub.label },
      ]);
    }
  };

  // Rule 31 — Zone-aware surface
  const surfaceClasses = (zone === 1 || zone === 2)
    ? 'backdrop-blur-[16px] bg-white/[0.62] border border-white/[0.55]'
    : 'bg-[--raised]';

  // Rule 31 — Zone-aware animation
  const animClass = (zone === 1 || zone === 2)
    ? 'animate-in slide-in-from-bottom duration-300 ease-[cubic-bezier(0,.55,.45,1)]'
    : '';

  return (
    // Backdrop — z-modal-backdrop (55)
    <div
      className="fixed inset-0 z-[55] bg-s-ink/20 flex flex-col justify-end md:hidden"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      aria-modal="true"
      role="dialog"
      aria-label={`Filter: ${pill.label}`}
    >
      {/* Sheet — z-modal (60) */}
      <div
        className={[
          'relative w-full max-h-[80vh] overflow-y-auto rounded-t-[20px] shadow-warm-lg p-6',
          surfaceClasses,
          animClass,
        ].join(' ')}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 rounded-pill bg-s-ink/20 mx-auto mb-4" aria-hidden />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-s-ink dark:text-s-dm-text text-lg">
            {pill.label}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-pill hover:bg-s-ink/5 text-s-ink/60 dark:text-s-dm-text/60"
            aria-label="Schliessen"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        {/* Sub-filter grid */}
        <div className="grid grid-cols-2 gap-2">
          {(pill.subFilters ?? []).map((sub) => {
            const active = isSubActive(sub.id);
            return (
              <button
                key={sub.id}
                onClick={() => toggleSub(sub)}
                className={[
                  'flex items-center gap-2 px-3 py-2.5 rounded-input text-sm font-body border text-left',
                  'transition-colors duration-150',
                  active
                    ? 'bg-s-coral text-white border-s-coral'
                    : 'bg-[--surface] text-s-ink dark:text-s-dm-text border-s-ink/8 hover:border-s-coral/40',
                ].join(' ')}
                aria-pressed={active}
              >
                {sub.label}
                {sub.count != null && (
                  <span className="ml-auto text-xs opacity-60">{sub.count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={() =>
              onFilterChange(activeFilters.filter((f) => f.pillId !== pill.id))
            }
            className="flex-1 py-2.5 rounded-pill border border-s-ink/10 text-sm font-heading text-s-ink/60 hover:text-s-ink dark:text-s-dm-text"
          >
            Zurücksetzen
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-pill bg-s-coral text-white text-sm font-heading shadow-coral-glow hover:brightness-[1.06]"
          >
            Anwenden
          </button>
        </div>
      </div>
    </div>
  );
}
```

> ⚠️ **BE CAREFUL**:
> - `document.body.style.overflow = 'hidden'` — MUST restore on unmount (the `return` in useEffect). Missing this will lock the page scroll permanently.
> - `md:hidden` — this component renders on ALL viewports but is visually hidden on desktop. The `FilterBar` only sets `sheetOpen=true` when `window.innerWidth < 768`, so it won't actually appear on desktop. But add `md:hidden` as a safety net.
> - Do NOT stack another `backdrop-filter` element above this sheet in Zone 1/2 — max 3 glass elements per UI_RULES §1.
> - Backdrop `onClick` guard: `e.target === e.currentTarget` prevents close when clicking inside the sheet.

### R7 — Verification & Commit
```bash
# Type check (after Phase 4 also done):
npx tsc --noEmit 2>&1 | grep "BottomSheet" | head -5
# Committed together with Phase 2 + 4 in a single commit
```

---

## 🤖 Phase 4 — FilterDrawer [NEW `components/ui/FilterDrawer.tsx`]

**What**: Desktop-only panel. Used in two modes:
- `mode="inline"` — absolute dropdown below a specific pill
- `mode="drawer"` — full-width panel revealing all overflow pills

### R5 — File
`[NEW] components/ui/FilterDrawer.tsx`

### R4 — ✅ DO / ❌ DON'T

```tsx
// ✅ DO — Zone 1/2: glass surface + reveal animation
const surfaceClasses = (zone === 1 || zone === 2)
  ? 'backdrop-blur-[8px] bg-white/[0.62] border border-white/[0.55]'
  : 'bg-[--raised] border border-s-ink/8';

const animClass = (zone === 1 || zone === 2)
  ? 'animate-in fade-in slide-in-from-top-1 duration-[220ms] ease-[cubic-bezier(.4,0,.2,1)]'
  : '';

// ✅ DO — inline mode: z-overlay (40)
// ✅ DO — drawer mode: no z-index (document flow)

// ✅ DO — correct radii
// inline = rounded-card (20px), drawer = rounded-panel (16px)
```

```tsx
// ❌ DON'T — use Tailwind generic classes
className="rounded-xl shadow-lg bg-white/60"
// Violations: rounded-xl → rounded-card, shadow-lg → shadow-warm-md, bg-white/60 → correct glass formula

// ❌ DON'T — animate in Zone 3/4
// mode="inline" zone={3} → still applying animate-in = RULE 31 VIOLATION
```

**Full component code:**

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { FilterPill, ActiveFilter, FilterZone } from '@/lib/types';

interface FilterDrawerProps {
  pill: FilterPill | null;       // null when mode="drawer" (shows all pills)
  pills?: FilterPill[];          // used only in mode="drawer"
  activeFilters: ActiveFilter[];
  onFilterChange: (filters: ActiveFilter[]) => void;
  onClose: () => void;
  zone: FilterZone;
  mode: 'inline' | 'drawer';
}

export default function FilterDrawer({
  pill,
  pills = [],
  activeFilters,
  onFilterChange,
  onClose,
  zone,
  mode,
}: FilterDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const isSubActive = (pillId: string, subId: string) =>
    activeFilters.some((f) => f.pillId === pillId && f.subId === subId);

  const toggleSub = (pillId: string, sub: { id: string; label: string }) => {
    if (isSubActive(pillId, sub.id)) {
      onFilterChange(
        activeFilters.filter((f) => !(f.pillId === pillId && f.subId === sub.id))
      );
    } else {
      onFilterChange([
        ...activeFilters,
        { pillId, subId: sub.id, label: sub.label },
      ]);
    }
  };

  // Rule 31 — Zone-aware surface
  const surfaceClasses = (zone === 1 || zone === 2)
    ? 'backdrop-blur-[8px] bg-white/[0.62] border border-white/[0.55]'
    : 'bg-[--raised] border border-s-ink/8';

  // Rule 31 — Zone-aware animation
  const animClass = (zone === 1 || zone === 2)
    ? 'animate-in fade-in slide-in-from-top-1 duration-[220ms] ease-[cubic-bezier(.4,0,.2,1)]'
    : '';

  const allPills = mode === 'drawer' ? pills : pill ? [pill] : [];

  return (
    <div
      ref={drawerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Filter"
      className={[
        mode === 'inline'
          ? 'absolute z-[40] mt-2 min-w-[220px] rounded-card shadow-warm-md p-4'
          : 'w-full mt-2 rounded-panel shadow-warm-md p-4',
        surfaceClasses,
        animClass,
      ].join(' ')}
    >
      {mode === 'drawer' && (
        <div className="flex items-center justify-between mb-4">
          <span className="font-heading font-bold text-sm text-s-ink dark:text-s-dm-text">
            Filter
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-pill hover:bg-s-ink/5 text-s-ink/50"
            aria-label="Filter schliessen"
          >
            <X size={16} aria-hidden />
          </button>
        </div>
      )}

      {allPills.map((p) => (
        <div key={p.id} className={mode === 'drawer' ? 'mb-4' : ''}>
          {mode === 'drawer' && (
            <p className="text-xs font-heading uppercase tracking-[0.12em] text-s-ink/50 dark:text-s-dm-text/50 mb-2">
              {p.label}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {(p.subFilters ?? []).map((sub) => {
              const active = isSubActive(p.id, sub.id);
              return (
                <button
                  key={sub.id}
                  onClick={() => toggleSub(p.id, sub)}
                  className={[
                    'px-3 py-1.5 rounded-pill text-xs font-body border transition-colors duration-150',
                    active
                      ? 'bg-s-coral text-white border-s-coral'
                      : 'bg-[--surface] text-s-ink dark:text-s-dm-text border-s-ink/8 hover:border-s-coral/40',
                  ].join(' ')}
                  aria-pressed={active}
                >
                  {sub.label}
                  {sub.count != null && (
                    <span className="ml-1 opacity-60">({sub.count})</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
```

> ⚠️ **BE CAREFUL**:
> - `mode="inline"` uses `absolute` positioning — the parent `FilterBar` wrapper must have `relative` set. Verify `className="relative w-full"` in `FilterBar.tsx`.
> - `mode="drawer"` does NOT use absolute positioning — it pushes content down. Ensure the host page layout can accommodate this expansion.
> - The `outside click` handler fires on `mousedown` (not `click`) to beat React's synthetic event bubbling. Do not change to `click`.
> - `z-[40]` = `z-overlay` per UI_RULES §14. Never use `z-50` here — that's `z-header` and will float above the main nav.

### R7 — Verification & Commit

```bash
# All three components ready — build and commit together:
npm run build 2>&1 | tail -5
# Expected: "✓ Compiled successfully"

npx tsc --noEmit
# Expected: 0 errors

git add components/ui/FilterBar.tsx components/ui/FilterBottomSheet.tsx components/ui/FilterDrawer.tsx
git commit -m "feat(filter-pills): phases 2-4 — add FilterBar, FilterBottomSheet, FilterDrawer components"
```

---

## 🤖 Phase 5 — Barrel Export [MODIFY `components/index.ts`]

**What**: Export the three new components from the barrel file so pages can import from `@/components`.

### R5 — File
`[MODIFY] components/index.ts`

### R4 — ✅ DO / ❌ DON'T

```typescript
// ✅ DO — add to components/index.ts (grep for existing export block placement first)
// Filter system (added: roadmap-filter-pills-A-infrastructure, Phase 5)
export { default as FilterBar } from './ui/FilterBar';
export { default as FilterBottomSheet } from './ui/FilterBottomSheet';
export { default as FilterDrawer } from './ui/FilterDrawer';
```

```typescript
// ❌ DON'T — duplicate an already-existing export
export { default as FilterBar } from './ui/FilterBar';
export { default as FilterBar } from './ui/FilterBar'; // duplicate = build error
```

**Before editing:**
```bash
# Check for existing exports that would conflict:
grep -n "FilterBar\|FilterBottomSheet\|FilterDrawer" components/index.ts
# Expected: 0 results. If any exist, DO NOT add them again.
```

> ⚠️ **BE CAREFUL**: `components/index.ts` is the barrel file all agents depend on (CLAUDE.md §3.1). Only append — never reorder or delete existing entries. If the file uses named exports without a default, adjust the syntax accordingly.

### R7 — Verification & Commit
```bash
# Verify exports were added:
grep -n "FilterBar\|FilterBottomSheet\|FilterDrawer" components/index.ts
# Must return exactly 3 lines

npm run build 2>&1 | tail -5
# Expected: "✓ Compiled successfully"

git add components/index.ts
git commit -m "feat(filter-pills): phase 5 — export FilterBar system from components/index.ts"
```

---

## 🤖 Phase 6 — Update CLAUDE.md [MODIFY `CLAUDE.md`] (R8)

**What**: Per ROADMAP_RULES R8 — new shared components must be documented in CLAUDE.md so future agents know they exist and don't rebuild them.

### R5 — File
`[MODIFY] CLAUDE.md` — Section 3.2 (Key Directories) and Section 3.5 (Key Features)

### R4 — ✅ DO

Add to **Section 3.2** under `components/ui/`:
```markdown
│   ├── ui/             # Shared UI primitives (Skeleton, SearchBar, ExpandableTabs, etc.)
│   │   ├── FilterBar.tsx          # Universal zone-aware filter pill row
│   │   ├── FilterBottomSheet.tsx  # Mobile bottom sheet for sub-filters (Zone 1/2 glass)
│   │   └── FilterDrawer.tsx       # Desktop inline/full-drawer for sub-filters
```

Add to **Section 3.5** (Key Features), item 60+:
```markdown
61. **Universal Filter System**: Zone-aware `<FilterBar>` with mobile bottom sheet (`FilterBottomSheet`) and desktop drawer (`FilterDrawer`). Single component used across all pages. `zone` prop gates glass + animations per UI_RULES Rule 31.
```

> ⚠️ **BE CAREFUL**: CLAUDE.md is the master file ALL agents read first (CLAUDE.md line 3). Any syntax error in this file could confuse agents. Edit carefully — only append, never reformat existing sections.

### R7 — Verification & Commit
```bash
# Verify CLAUDE.md was updated:
grep -n "FilterBar\|FilterBottomSheet\|FilterDrawer" CLAUDE.md
# Must return 3+ lines

git add CLAUDE.md
git commit -m "docs: phase 6 — document FilterBar system in CLAUDE.md §3.2 and §3.5"
```

---

## R6 — Dependency Ordering Table

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Add types to `lib/types.ts` | Nothing |
| Phase 2 | 🤖 | Create `FilterBar.tsx` | Phase 1 (types) |
| Phase 3 | 🤖 | Create `FilterBottomSheet.tsx` | Phase 1 (types) |
| Phase 4 | 🤖 | Create `FilterDrawer.tsx` | Phase 1 (types) |
| Phase 5 | 🤖 | Barrel export in `components/index.ts` | Phases 2, 3, 4 |
| Phase 6 | 🤖 | Update `CLAUDE.md` | Phase 5 |
| Roadmap B | 🤖 | Per-page integration | This entire roadmap |

---

## Final Smoke Test

```bash
# 1. Build clean:
npm run build 2>&1 | tail -5
# Expected: "✓ Compiled successfully"

# 2. No type errors:
npx tsc --noEmit
# Expected: 0 errors

# 3. All types defined before use:
grep -n "FilterZone\|FilterPill\|ActiveFilter\|FilterBarProps" lib/types.ts
# Expected: 5+ lines

# 4. All components exported:
grep -n "FilterBar\|FilterBottomSheet\|FilterDrawer" components/index.ts
# Expected: 3 lines

# 5. CLAUDE.md updated:
grep -n "FilterBar" CLAUDE.md
# Expected: 1+ lines

# 6. Rule 31 compliance — zone prop present in FilterBar:
grep -n "zone" components/ui/FilterBar.tsx | head -10
# Expected: multiple lines (prop, motionClass, hoverLift, etc.)

# 7. Live site still works:
curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de/
# Expected: 200 or 307

# ✅ All checks pass → Execute Roadmap B
```
