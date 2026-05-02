'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('filters') as any;
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
    ? 'glass-frost'
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
      aria-label={t('filter')}
      className={[
        'overflow-hidden',
        mode === 'inline'
          ? 'absolute z-[40] mt-2 min-w-[220px] rounded-[12px] shadow-warm-md p-4'
          : 'w-full mt-2 rounded-panel shadow-warm-md p-4',
        surfaceClasses,
        animClass,
      ].join(' ')}
    >
      {mode === 'drawer' && (
        <div className="flex items-center justify-between mb-4">
          <span className="font-heading font-bold text-sm text-s-ink">
            {t('filter')}
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-pill hover:bg-s-ink/5 text-s-ink/50"
            aria-label={t('closeFilter')}
          >
            <X size={16} aria-hidden />
          </button>
        </div>
      )}

      {allPills.map((p) => (
        <div key={p.id} className={mode === 'drawer' ? 'mb-4' : ''}>
          {mode === 'drawer' && (
            <p className="text-xs font-heading uppercase tracking-[0.12em] text-s-ink/50 mb-2">
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
                      : 'bg-[--surface] text-s-ink border-s-ink/8 hover:border-s-coral/40',
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
