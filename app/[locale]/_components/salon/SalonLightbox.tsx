"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

/**
 * SalonLightbox — V2-D53.3 (2026-05-11).
 *
 * Full-screen photo modal.
 *
 * Controls:
 *   • Close (X) top-right + click backdrop + Escape key
 *   • Prev/Next arrows on sides + ←/→ keys
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

  if (!open || photos.length === 0) return null;

  const next = () => setIdx((i) => Math.min(i + 1, photos.length - 1));
  const prev = () => setIdx((i) => Math.max(i - 1, 0));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Foto-Galerie, Bild ${idx + 1} von ${photos.length}`}
      className="fixed inset-0 z-50 grid place-items-center bg-black/95 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button
        type="button"
        aria-label="Schließen"
        onClick={onClose}
        className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20"
      >
        <X size={20} />
      </button>

      {idx > 0 && (
        <button
          type="button"
          aria-label="Vorheriges Foto"
          onClick={prev}
          className="absolute left-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {idx < photos.length - 1 && (
        <button
          type="button"
          aria-label="Nächstes Foto"
          onClick={next}
          className="absolute right-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20"
        >
          <ChevronRight size={24} />
        </button>
      )}

      <div className="flex h-full w-full max-w-[1400px] items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photos[idx]}
          alt={`Foto ${idx + 1} von ${photos.length}`}
          className="max-h-[88vh] max-w-full object-contain"
        />
      </div>

      <span className="font-body absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-[12px] font-semibold text-white backdrop-blur-md">
        {idx + 1} / {photos.length}
      </span>
    </div>
  );
}
