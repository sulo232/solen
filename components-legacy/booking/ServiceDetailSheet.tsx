'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/format-currency';
import ToggleCircle from './ToggleCircle';

export interface SheetService {
  id: string;
  name_de: string;
  name_en: string;
  price: number;
  duration_minutes: number;
  description_de: string | null;
  description_en: string | null;
}
export interface SheetOption {
  id: string;
  name_de: string;
  name_en: string;
  price: number;
  duration_minutes: number;
}

/**
 * ServiceDetailSheet — Fresha "select an option / add-ons" sheet.
 *
 * Compact service cards open this full-screen sheet:
 *   • REQUIRED options (single-select radio, e.g. hair length) — when present,
 *     one MUST be chosen; its price + duration replace the service base.
 *   • OPTIONAL add-ons (multi-select).
 * Choices live in local state and commit only on Add/Update (commit-on-Add).
 */
export default function ServiceDetailSheet({
  service,
  addons,
  options,
  initialAddonIds,
  initialOptionId,
  isInCart,
  locale,
  onConfirm,
  onRemove,
  onClose,
}: {
  service: SheetService;
  addons: SheetService[];
  options: SheetOption[];
  initialAddonIds: string[];
  initialOptionId: string | null;
  isInCart: boolean;
  locale: string;
  onConfirm: (serviceId: string, addonIds: string[], optionId?: string | null) => void;
  onRemove: (serviceId: string) => void;
  onClose: () => void;
}) {
  const t = useTranslations('booking.serviceSelection');
  const [sel, setSel] = useState<Set<string>>(() => new Set(initialAddonIds));
  const [optionId, setOptionId] = useState<string | null>(initialOptionId);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const name = (s: { name_de: string; name_en: string }) =>
    locale === 'en' ? s.name_en : s.name_de;
  const desc = locale === 'en' ? service.description_en : service.description_de;

  const hasOptions = options.length > 0;
  const chosenOption = optionId ? options.find((o) => o.id === optionId) ?? null : null;
  const basePrice = chosenOption ? chosenOption.price : service.price;
  const baseDuration = chosenOption ? chosenOption.duration_minutes : service.duration_minutes;
  const canConfirm = !hasOptions || !!optionId;

  const total = useMemo(() => {
    const chosen = addons.filter((a) => sel.has(a.id));
    return {
      price: basePrice + chosen.reduce((s, a) => s + a.price, 0),
      duration: baseDuration + chosen.reduce((s, a) => s + a.duration_minutes, 0),
    };
  }, [sel, addons, basePrice, baseDuration]);

  const toggle = (id: string) =>
    setSel((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  if (!mounted) return null;

  const showFrom = hasOptions && !chosenOption;

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[60] flex flex-col bg-white"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', damping: 34, stiffness: 320 }}
    >
      <div className="flex justify-end px-4 pt-4">
        <button
          type="button"
          onClick={onClose}
          aria-label={t('close')}
          className="grid h-10 w-10 place-items-center rounded-full bg-s-bg-sunken transition-colors hover:bg-s-bg-sunken"
        >
          <X size={22} className="text-s-ink" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <h2 className="font-heading text-[28px] font-bold leading-tight tracking-[-0.01em] text-s-ink">
          {name(service)}
        </h2>
        {desc && (
          <p className="mt-2.5 text-[15px] leading-relaxed text-s-ink-2">{desc}</p>
        )}

        {/* Required options — single-select */}
        {hasOptions && (
          <div className="mt-8">
            <p className="font-heading text-[17px] font-bold text-s-ink">
              {t('chooseOption')}
            </p>
            <p className="mb-1.5 text-[13px] font-medium text-s-ink-2">
              {t('required')}
            </p>
            <div className="divide-y divide-s-ink/[0.06]">
              {options.map((o) => {
                const on = optionId === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setOptionId(o.id)}
                    className="flex w-full items-center justify-between gap-3 py-4 text-left"
                  >
                    <span className="min-w-0">
                      <span className="block text-[16px] font-semibold text-s-ink">
                        {name(o)}
                      </span>
                      <span className="block text-[13px] text-s-ink-2 tabular-nums">
                        {formatCurrency(o.price, locale)} {o.duration_minutes}{' '}
                        {t('minutes')}
                      </span>
                    </span>
                    <span
                      className={`grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border-2 transition-colors ${
                        on ? 'border-s-ink' : 'border-s-border'
                      }`}
                    >
                      {on && <span className="h-[11px] w-[11px] rounded-full bg-s-ink" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Optional add-ons — multi-select */}
        {addons.length > 0 && (
          <div className="mt-8">
            <p className="font-heading text-[17px] font-bold text-s-ink">
              {t('addOns')}
            </p>
            <p className="mb-1.5 text-[13px] text-s-ink-2">{t('optional')}</p>
            <div className="divide-y divide-s-ink/[0.06]">
              {addons.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => toggle(a.id)}
                  className="flex w-full items-center justify-between gap-3 py-4 text-left"
                >
                  <span className="min-w-0">
                    <span className="block text-[16px] font-semibold text-s-ink">
                      {name(a)}
                    </span>
                    <span className="block text-[13px] text-s-ink-2 tabular-nums">
                      +{formatCurrency(a.price, locale)} {a.duration_minutes}{' '}
                      {t('minutes')}
                    </span>
                  </span>
                  <ToggleCircle selected={sel.has(a.id)} size="lg" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-s-border px-4 py-3.5">
        <div>
          <motion.p
            key={showFrom ? 'from' : total.price}
            initial={{ y: 6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.4, 1] }}
            className="font-body text-[22px] font-extrabold leading-none tabular-nums text-s-ink"
          >
            {showFrom
              ? `${t('from')} ${formatCurrency(Math.min(...options.map((o) => o.price)), locale)}`
              : formatCurrency(total.price, locale)}
          </motion.p>
          {!showFrom && (
            <p className="mt-1.5 text-[13px] text-s-ink-2">
              {total.duration} {t('minutes')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isInCart && (
            <button
              type="button"
              onClick={() => onRemove(service.id)}
              className="rounded-btn border border-s-border px-5 py-3.5 font-heading text-[15px] font-semibold text-s-ink transition-colors hover:border-s-ink/30"
            >
              {t('remove')}
            </button>
          )}
          <button
            type="button"
            disabled={!canConfirm}
            onClick={() => onConfirm(service.id, [...sel], optionId)}
            className="rounded-btn bg-s-ink px-7 py-3.5 font-heading text-[15px] font-semibold text-white transition-[filter,opacity] hover:brightness-[1.06] disabled:opacity-40"
          >
            {isInCart ? t('update') : t('add')}
          </button>
        </div>
      </div>
    </motion.div>,
    document.body
  );
}
