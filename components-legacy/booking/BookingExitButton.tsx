'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useBooking } from '@/lib/booking-context';

/**
 * BookingExitButton — Fresha "leave this booking?" guard (IMG_4831).
 *
 * X in the booking header. If the user has selected services, tapping it
 * raises a full-screen confirm ("All selections will be lost") before
 * leaving. With nothing selected there's nothing to lose, so it exits
 * straight to the salon page.
 *
 * ia-navigation-01: the browser/gesture back button and a tab close are the
 * SAME "leave this booking" action as the X, just triggered a different way,
 * so they get the same guard. A sentinel history entry is pushed on mount;
 * popstate re-arms it and raises this component's own confirm instead of
 * silently discarding the cart. beforeunload covers a tab close / hard refresh.
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

  // Read inside the popstate/beforeunload handlers via a ref so the listeners
  // (armed once, on mount) always see the current cart, not a stale closure.
  const servicesCountRef = useRef(formData.services.length);
  useEffect(() => {
    servicesCountRef.current = formData.services.length;
  }, [formData.services.length]);

  useEffect(() => {
    // One sentinel entry so the FIRST back press hits our popstate handler
    // instead of leaving the route outright.
    window.history.pushState({ bookingGuard: true }, '', window.location.href);

    const handlePopState = () => {
      if (servicesCountRef.current > 0) {
        // Cancel the native back (re-arm the sentinel) and show the same
        // confirm the X button uses, so back and X protect progress equally.
        window.history.pushState({ bookingGuard: true }, '', window.location.href);
        setConfirming(true);
      } else {
        router.replace(exitTo);
      }
    };
    window.addEventListener('popstate', handlePopState);

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (servicesCountRef.current > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
    // Armed once on mount; the ref (not a dependency) carries the live cart size.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full transition-[colors,transform] hover:bg-s-bg-sunken active:scale-[0.94] active:duration-[80ms] active:ease-glide"
      >
        <X size={20} strokeWidth={2.2} className="text-s-ink" />
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {confirming && (
          <motion.div
            className="fixed inset-0 z-[60] flex flex-col bg-white px-6 pt-5 pb-8"
            // Quick fade — the full-screen y:100% slide-spring read as a heavy, "draggy" sheet
            // that felt like it was looping. A fast opacity fade is snappy and can't re-trigger.
            // motion-ok: full-viewport opaque colour cross-fade (bg-white swaps the whole screen
            // in as one unit), not a discrete content card entering over an existing screen.
            initial={{ opacity: 0 }} // mockup-ok
            animate={{ opacity: 1 }} // mockup-ok
            exit={{ opacity: 0 }} // mockup-ok
            transition={{ duration: 0.16, ease: [0.2, 0.8, 0.4, 1] }}
          >
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                aria-label={t('cancel')}
                className="grid h-11 w-11 place-items-center rounded-full transition-[colors,transform] hover:bg-s-bg-sunken active:scale-[0.94] active:duration-[80ms] active:ease-glide"
              >
                <X size={20} strokeWidth={2.2} className="text-s-ink" />
              </button>
            </div>

            <h2 className="mt-6 font-heading text-[28px] font-bold leading-tight text-s-ink">
              {t('title')}
            </h2>
            <p className="mt-3 text-[15px] text-s-ink-2">{t('subtitle')}</p>

            <div className="mt-auto flex gap-3">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="flex-1 rounded-btn border border-s-border bg-white py-3.5 font-heading text-[15px] font-semibold text-s-ink transition-[colors,transform] hover:border-s-ink/30 active:scale-[0.98] active:duration-[80ms] active:ease-glide"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={() => router.replace(exitTo)}
                className="flex-1 rounded-btn bg-s-ink py-3.5 font-heading text-[15px] font-semibold text-white transition-[filter,transform] hover:brightness-[1.06] active:scale-[0.97] active:duration-[80ms] active:ease-glide"
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
