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
  const hoverLift = (zone === 1 || zone === 2) ? 'hover:-translate-y-[5px]' : '';

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

  // Separate sort pill from regular pills — sort renders as a <select> dropdown
  const sortPill = pills.find((p) => p.id === 'sort');
  const nonSortPills = pills.filter((p) => p.id !== 'sort');
  const visibleNonSortPills = nonSortPills.slice(0, MAX_VISIBLE_DESKTOP);
  const overflowNonSortCount = nonSortPills.length - MAX_VISIBLE_DESKTOP;

  const activeSortFilter = activeFilters.find((f) => f.pillId === 'sort');

  const handleSortChange = (subId: string) => {
    const withoutSort = activeFilters.filter((f) => f.pillId !== 'sort');
    if (!subId) {
      onFilterChange(withoutSort);
      return;
    }
    const label = sortPill?.subFilters?.find((s) => s.id === subId)?.label ?? subId;
    onFilterChange([...withoutSort, { pillId: 'sort', subId, label }]);
  };

  return (
    <div className={`relative w-full scroll-fade-right ${className}`}>
      {/* Pill row */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 snap-x overscroll-x-contain">
        {visibleNonSortPills.map((pill) => {
          const active = isPillActive(pill.id);
          return (
            <button
              key={pill.id}
              onClick={() => handlePillClick(pill)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePillClick(pill); } }}
              className={[
                'snap-start flex items-center gap-1.5 px-3.5 py-1.5 rounded-pill text-[12px] font-heading whitespace-nowrap shrink-0 cursor-pointer',
                'transition-colors duration-150 active:scale-[0.97]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-2',
                motionClass,
                hoverLift,
                active
                  ? 'bg-s-coral text-white border border-s-coral'
                  : 'bg-white/70 border border-s-ink/[0.08] text-s-ink/65 hover:border-s-coral/40 hover:text-s-coral:text-s-coral',
              ].join(' ')}
              aria-pressed={active}
              aria-label={`${t('filter')}: ${pill.label}`}
            >
              {pill.label}
              {pill.subFilters?.length ? (
                <ChevronDown
                  size={13}
                  className={`${motionClass} ${openPillId === pill.id ? 'rotate-180' : ''}`}
                  aria-hidden
                />
              ) : null}
            </button>
          );
        })}

        {/* "Mehr Filter" button — desktop only, when overflow exists */}
        {overflowNonSortCount > 0 && (
          <button
            onClick={() => setDrawerOpen(true)}
            className={[
              'hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-pill text-[12px] font-heading whitespace-nowrap shrink-0',
              'border border-s-ink/[0.08] bg-white/70',
              motionClass,
              hoverLift,
              drawerOpen
                ? 'bg-s-plum-subtle border-s-plum/30 text-s-plum-text'
                : 'text-s-ink/65 hover:border-s-coral/40 hover:text-s-coral',
            ].join(' ')}
            aria-expanded={drawerOpen}
            aria-label={t('moreFilters', { count: overflowNonSortCount })}
          >
            <SlidersHorizontal size={13} aria-hidden />
            {overflowNonSortCount} {t('more')}
          </button>
        )}

        {/* Sort — styled <select> dropdown, always at the end */}
        {sortPill && (
          <div className="shrink-0 ml-auto">
            <select
              value={activeSortFilter?.subId ?? ''}
              onChange={(e) => handleSortChange(e.target.value)}
              aria-label={sortPill.label}
              className="text-[13px] font-body font-medium text-s-ink/60 bg-transparent border border-s-ink/[0.08] rounded-pill px-3 py-1.5 focus:outline-none focus:border-s-coral/40 cursor-pointer appearance-none"
            >
              <option value="">{sortPill.label} ▾</option>
              {sortPill.subFilters?.map((sf) => (
                <option key={sf.id} value={sf.id}>{sf.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className={`flex flex-wrap items-center gap-2 mt-2 ${motionClass}`}>
          {activeFilters.map((f) => (
            <span
              key={`${f.pillId}-${f.subId}`}
              className="flex items-center gap-1 px-3 py-1 rounded-pill glass-pill-active text-xs font-body"
            >
              {f.label}
              <button
                onClick={() => removeFilter(f)}
                className="ml-0.5 p-2 hover:text-s-coral"
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
