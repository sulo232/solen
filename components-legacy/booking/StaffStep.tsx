'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, ShoppingCart, Users } from 'lucide-react';
import { useBooking } from '@/lib/booking-context';
import { formatCurrency } from '@/lib/format-currency';
import { Avatar } from '@/app/[locale]/_components/primitives';
import type { StaffMember } from '@/lib/types';

interface StaffService {
  staff_member_id: string;
  service_id: string;
}

/**
 * StaffStep — mockup 20 (owner-approved 2026-06-11), exact Fresha
 * "Teammitglied auswählen" bones + Solen skin.
 *
 * Own full step between services and Zeit: white cards on the sunken body,
 * "Keine Präferenz" first, then staff with avatar + rating badge, languages ·
 * role line, blue "Profil ansehen" (inline body link per blue v3), outline
 * "Auswählen" that fills ink when selected. Bottom bar carries the cart.
 */
export default function StaffStep({
  staffList,
  staffServices,
  salonSlug,
}: {
  staffList: StaffMember[];
  staffServices: StaffService[];
  salonSlug: string;
}) {
  const t = useTranslations('booking.staffStep') as any;
  const tSel = useTranslations('booking.serviceSelection') as any;
  const locale = useLocale();
  const { formData, updateFormData, goToStep } = useBooking();

  const selectedIds = formData.services.map((s) => s.id);

  // Only staff who can perform EVERY selected service; staff with no mappings
  // count as can-do-all (same fallback the services filter used in reverse).
  const capable = staffList.filter((st) => {
    const mapped = staffServices.filter((m) => m.staff_member_id === st.id).map((m) => m.service_id);
    if (mapped.length === 0) return true;
    return selectedIds.every((id) => mapped.includes(id));
  });
  const list = capable.length > 0 ? capable : staffList;

  const pick = (id: string) => updateFormData({ selectedStaffId: id });
  const selected = formData.selectedStaffId;

  const cardCls = (active: boolean) =>
    `flex w-full items-center gap-3.5 rounded-[16px] bg-white p-4 text-left transition-shadow ${
      active ? 'ring-2 ring-s-ink' : 'ring-0'
    }`;
  const pickBtnCls = (active: boolean) =>
    `shrink-0 rounded-full px-[18px] py-2.5 font-heading text-[13.5px] font-semibold transition-colors ${
      active ? 'bg-s-ink text-white' : 'border border-s-border bg-white text-s-ink'
    }`;

  return (
    <div className="pb-32">
      <ul className="salon-card-stagger flex flex-col gap-3 pt-1">
        {/* Keine Präferenz */}
        <li>
          <div
            role="button"
            tabIndex={0}
            onClick={() => pick('any')}
            onKeyDown={(e) => e.key === 'Enter' && pick('any')}
            aria-pressed={selected === 'any'}
            className={cardCls(selected === 'any')}
          >
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-s-bg-sunken">
              <Users size={24} strokeWidth={2} className="text-s-ink" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-body text-[16px] font-semibold text-s-ink">{t('any')}</span>
              <span className="mt-0.5 block font-body text-[13.5px] text-s-ink-2">{t('maxAvailability')}</span>
            </span>
            <span className={pickBtnCls(selected === 'any')}>{t('choose')}</span>
          </div>
        </li>

        {list.map((st) => {
          const active = selected === st.id;
          const rating = st.average_rating != null && st.average_rating > 0 ? st.average_rating : null;
          const langs = (st.languages ?? []).map((l) => l.toUpperCase()).join('/');
          const role = st.specialties?.[0] ?? null;
          const sub = [langs || null, role].filter(Boolean).join(' · ');
          return (
            <li key={st.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => pick(st.id)}
                onKeyDown={(e) => e.key === 'Enter' && pick(st.id)}
                aria-pressed={active}
                className={cardCls(active)}
              >
                <span className="shrink-0">
                  <Avatar
                    src={st.avatar_url}
                    name={st.name}
                    size={56}
                    badge={rating != null ? { rating } : undefined}
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-body text-[16px] font-semibold text-s-ink">{st.name}</span>
                  {sub && <span className="mt-0.5 block truncate font-body text-[13.5px] text-s-ink-2">{sub}</span>}
                  <Link
                    href={`/${locale}/salon/${salonSlug}/staff/${st.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 inline-block font-body text-[13.5px] font-semibold text-s-accent transition-opacity hover:opacity-80"
                  >
                    {t('viewProfile')}
                  </Link>
                </span>
                <span className={pickBtnCls(active)}>{t('choose')}</span>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Bottom bar — same anatomy as the services step */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-s-border bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div>
            <p className="font-body text-xl font-extrabold leading-none tabular-nums text-s-ink">
              {formatCurrency(formData.totalPrice, locale)}
            </p>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-s-ink-2">
              <ShoppingCart size={13} aria-hidden />
              {formData.services.length} {tSel('items')} {formData.totalDuration} {tSel('minutes')}
            </p>
          </div>
          <button
            onClick={() => goToStep('datetime')}
            disabled={!selected}
            className="group flex items-center gap-2 rounded-btn bg-s-ink px-6 py-3 font-heading text-sm font-semibold text-white transition-[transform,filter] duration-150 hover:brightness-[1.06] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {tSel('continue')}
            <ArrowRight size={16} strokeWidth={2.4} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
