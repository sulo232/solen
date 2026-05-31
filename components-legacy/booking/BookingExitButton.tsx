'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBooking } from '@/lib/booking-context';

/**
 * BookingExitButton — Fresha "leave this booking?" guard (IMG_4831).
 *
 * X in the booking header. If the user has selected services, tapping it
 * raises a full-screen confirm ("All selections will be lost") before
 * leaving. With nothing selected there's nothing to lose, so it exits
 * straight to the salon page.
 */
export default function BookingExitButton({ slug }: { slug: string }) {
  const t = useTranslations('booking.leave');
  const locale = useLocale();
  const router = useRouter();
  const { formData } = useBooking();
  const [confirming, setConfirming] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const exitTo = `/${locale}/salon/${slug}`;

  const handleX = () => {
    // replace (not push): leaving the booking should REMOVE it from history, otherwise the
    // browser back button returns to the booking flow (the loop the user hit).
    if (formData.services.length > 0) setConfirming(true);
    else router.replace(exitTo);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleX}
        aria-label={t('exit')}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors hover:bg-s-ink/[0.06]"
      >
        <X size={20} className="text-s-ink" />
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {confirming && (
          <motion.div
            className="fixed inset-0 z-[60] flex flex-col bg-white px-6 pt-5 pb-8"
            // Quick fade — the full-screen y:100% slide-spring read as a heavy, "draggy" sheet
            // that felt like it was looping. A fast opacity fade is snappy and can't re-trigger.
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: [0.2, 0.8, 0.4, 1] }}
          >
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                aria-label={t('cancel')}
                className="grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-s-ink/[0.06]"
              >
                <X size={22} className="text-s-ink" />
              </button>
            </div>

            <h2 className="mt-6 font-heading text-[28px] font-bold leading-tight text-s-ink">
              {t('title')}
            </h2>
            <p className="mt-3 text-[15px] text-s-ink/60">{t('subtitle')}</p>

            <div className="mt-auto flex gap-3">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="flex-1 rounded-btn border border-s-ink/15 bg-white py-3.5 font-heading text-[15px] font-semibold text-s-ink transition-colors hover:border-s-ink/30"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={() => router.replace(exitTo)}
                className="flex-1 rounded-btn bg-s-ink py-3.5 font-heading text-[15px] font-semibold text-white transition-[filter] hover:brightness-[1.06]"
              >
                {t('exit')}
              </button>
            </div>
          </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
