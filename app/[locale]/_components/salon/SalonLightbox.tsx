"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

/**
 * SalonLightbox — V2-D53.3 (2026-05-11) · overlap-bug fix (2026-07-23).
 *
 * Full-screen photo modal. Fresha-style: dimmed backdrop, image centered +
 * contained on its own "stage", close top-right, prev/next, "N / total"
 * counter, swipeable on mobile.
 *
 * ROOT CAUSE of the reported "overlapping elements" bug: this modal used to
 * render INLINE inside the page tree. The root layout's
 * `<main id="main-content">` (app/[locale]/layout.tsx) carries
 * `isolation: isolate`, which caps every z-index INSIDE it — including this
 * modal's z-[80] — at a single slot in the page's real stacking order.
 * `SalonStickyTabNav` (the "Fotos / Services / Team / …" bar) is portaled to
 * `document.body` with `fixed z-[60]`, OUTSIDE that isolated slot — so its
 * explicit z-index always painted on top of the ENTIRE isolated subtree,
 * regardless of how high z-index went inside it. Verified live (measured
 * DOM rects via Playwright + screenshots on /de/salon/cuts-and-culture):
 * the sticky tab nav visually stamped over this modal's close button and
 * header every time it was opened past the scroll threshold that shows the
 * tab bar. Fix: portal straight to `document.body`, the same escape hatch
 * `SalonStickyTabNav` already uses and documents (see that file's V3-D206
 * comment) — so this modal's z-[80] is compared at the TRUE root level
 * against the tab nav's z-[60] and correctly wins.
 *
 * Secondary hardening (still in scope — "no overlap of controls over
 * content"): controls used to be `absolute` over a full-bleed image with no
 * reserved space, so on narrow/portrait viewports the prev/next buttons
 * could paint directly on top of the photo edge-to-edge (measured: on a
 * 390px viewport the image rendered x:16-374, the next button rendered
 * x:326-374 y:398-446 — fully inside the image's box). Rebuilt as a real
 * header / stage / footer flex column: the stage reserves a horizontal
 * gutter for the arrows, so the image can never render underneath them.
 *
 * Controls:
 *   • Close (X) top-right + click backdrop + Escape key
 *   • Prev/Next arrows on sides + ←/→ keys + swipe (mobile)
 *   • Counter "3 / 13" bottom-center
 *
 * Mounted by orchestrator. Controlled via open + startIndex props.
 */
export function SalonLightbox({
  photos,
  open,
  startIndex,
  onClose,
}: {
  photos: string[];
  open: boolean;
  startIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = React.useState(startIndex);

  React.useEffect(() => {
    if (open) setIdx(startIndex);
  }, [open, startIndex]);

  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx((i) => Math.min(i + 1, photos.length - 1));
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(i - 1, 0));
    }
    document.addEventListener("keydown", onKey);
    // Lock body scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, photos.length, onClose]);

  const touchStartX = React.useRef<number | null>(null);
  const touchStartY = React.useRef<number | null>(null);

  if (!open || photos.length === 0) return null;

  const next = () => setIdx((i) => Math.min(i + 1, photos.length - 1));
  const prev = () => setIdx((i) => Math.max(i - 1, 0));

  // Backdrop click-to-close: each row checks itself as the click target so a
  // tap on the dimmed area of ANY row closes, while a tap on the image or a
  // button (a descendant, so target !== currentTarget) never does.
  const closeOnSelf = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    // Horizontal swipe only — ignore mostly-vertical gestures / taps.
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) next();
    else prev();
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Foto-Galerie, Bild ${idx + 1} von ${photos.length}`}
      className="fixed inset-0 z-[80] flex flex-col bg-black/95"
    >
      {/* Header row — real layout space (not a floating overlay), so the
          close button always has its own clear area. */}
      <div className="flex shrink-0 items-center justify-end p-4" onClick={closeOnSelf}>
        <button
          type="button"
          aria-label="Schließen"
          onClick={onClose}
          className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md transition-[colors,transform] hover:bg-white/20 active:scale-[0.94] active:duration-[80ms] active:ease-glide"
        >
          <X size={20} strokeWidth={2.2} />
        </button>
      </div>

      {/* Stage — the only region the image occupies. Side padding reserves a
          dedicated gutter for the prev/next buttons, so they sit beside the
          photo and never on top of it. */}
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-12 pb-2 md:px-24"
        onClick={closeOnSelf}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {idx > 0 && (
          <button
            type="button"
            aria-label="Vorheriges Foto"
            onClick={prev}
            className="absolute left-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md transition-[colors,transform] hover:bg-white/20 active:scale-[0.94] active:duration-[80ms] active:ease-glide md:left-4 md:h-11 md:w-11"
          >
            <ChevronLeft size={20} strokeWidth={2.2} className="md:hidden" />
            <ChevronLeft size={22} strokeWidth={2.2} className="hidden md:block" />
          </button>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photos[idx]}
          alt={`Foto ${idx + 1} von ${photos.length}`}
          className="max-h-full max-w-full object-contain"
        />

        {idx < photos.length - 1 && (
          <button
            type="button"
            aria-label="Nächstes Foto"
            onClick={next}
            className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md transition-[colors,transform] hover:bg-white/20 active:scale-[0.94] active:duration-[80ms] active:ease-glide md:right-4 md:h-11 md:w-11"
          >
            <ChevronRight size={20} strokeWidth={2.2} className="md:hidden" />
            <ChevronRight size={22} strokeWidth={2.2} className="hidden md:block" />
          </button>
        )}
      </div>

      {/* Footer row — counter gets its own layout space below the stage. */}
      <div className="flex shrink-0 items-center justify-center pt-1 pb-5" onClick={closeOnSelf}>
        <span className="font-body rounded-full bg-white/10 px-3 py-1 text-[12px] font-semibold text-white backdrop-blur-md">
          {idx + 1} / {photos.length}
        </span>
      </div>
    </div>,
    document.body
  );
}
