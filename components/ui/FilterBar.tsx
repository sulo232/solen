'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('filters') as any;
  const [openPillId, setOpenPillId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetPill, setSheetPill] = useState<FilterPill | null>(null);

  // Zone-aware animation class — Rules 31, UI_RULES §4
  const motionClass = (zone === 1 || zone === 2)
    ? 'transition-[color,background-color,border-color,transform] duration-[220ms] ease-[cubic-bezier(.4,0,.2,1)]'
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
                'transition-all duration-200 active:scale-[0.96]',
                motionClass,
                hoverLift,
                active
                  ? 'bg-s-coral text-white border border-s-coral shadow-coral-glow'
                  : 'bg-white/60 backdrop-blur-sm border border-s-ink/[0.06] text-s-ink/70 dark:text-s-dm-text/70 hover:bg-s-coral-subtle hover:border-s-coral/30',
              ].join(' ')}
              aria-pressed={active}
              aria-label={`${t('filter')}: ${pill.label}`}
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
            aria-label={t('moreFilters', { count: overflowCount })}
          >
            <SlidersHorizontal size={14} aria-hidden />
            {overflowCount} {t('more')}
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className={`flex flex-wrap items-center gap-2 mt-2 ${motionClass}`}>
          {activeFilters.map((f) => (
            <span
              key={`${f.pillId}-${f.subId}`}
              className="flex items-center gap-1 px-3 py-1 rounded-pill bg-s-coral-subtle text-s-coral-text text-xs font-body shadow-warm-md"
            >
              {f.label}
              <button
                onClick={() => removeFilter(f)}
                className="ml-0.5 hover:text-s-coral"
                aria-label={t('removeFilter', { name: f.label })}
              >
                <X size={11} aria-hidden />
              </button>
            </span>
          ))}
          <button
            onClick={clearAll}
            className="text-xs text-s-ink/50 hover:text-s-coral underline underline-offset-2 font-body"
          >
            {t('clearAll')}
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
