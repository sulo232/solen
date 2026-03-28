'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('filters') as any;

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
    ? 'animate-in slide-in-from-bottom duration-[280ms] ease-[cubic-bezier(0.32,0.72,0,1)]'
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
            aria-label={t('close')}
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
            {t('reset')}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-pill bg-s-coral text-white text-sm font-heading shadow-coral-glow hover:brightness-[1.06]"
          >
            {t('apply')}
          </button>
        </div>
      </div>
    </div>
  );
}
