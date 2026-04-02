"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import PhotoLightbox from "@/components/ui/PhotoLightbox";

interface SalonHeroProps {
  photos: string[];
  salonName: string;
}

export default function SalonHero({ photos, salonName }: SalonHeroProps) {
  const t = useTranslations("salonDetail");
  const [photoIndex, setPhotoIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const hasMultiple = photos.length > 1;
  const showGrid = photos.length >= 5;

  return (
    <>
      {showGrid ? (
        /* ── Airbnb-style 5-photo grid ── */
        <div className="relative w-full rounded-[20px] overflow-hidden mb-8">
          <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[360px] md:h-[420px]">
            {/* Main large photo */}
            <button
              onClick={() => { setLightboxIndex(0); setLightboxOpen(true); }}
              className="col-span-2 row-span-2 relative overflow-hidden group"
            >
              <Image
                src={photos[0]}
                alt={`${salonName} — Foto 1`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                priority
              />
            </button>
            {/* 4 smaller photos */}
            {photos.slice(1, 5).map((photo, i) => (
              <button
                key={i}
                onClick={() => { setLightboxIndex(i + 1); setLightboxOpen(true); }}
                className="relative overflow-hidden group"
              >
                <Image
                  src={photo}
                  alt={`${salonName} — Foto ${i + 2}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </button>
            ))}
          </div>
          {/* "Show all photos" button */}
          {photos.length > 5 && (
            <button
              onClick={() => { setLightboxIndex(0); setLightboxOpen(true); }}
              className="absolute bottom-4 right-4 px-4 py-2 rounded-[10px] text-xs font-heading font-bold uppercase tracking-[.06em]"
              style={{
                background: "rgba(255,255,255,.90)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                border: "1px solid rgba(0,0,0,.08)",
                boxShadow: "0 2px 8px rgba(0,0,0,.12)",
              }}
            >
              {t("showAllPhotos", { count: photos.length })}
            </button>
          )}
        </div>
      ) : (
        /* ── Single-photo carousel (original behavior) ── */
        <div
          id="section-fotos"
          className="scroll-mt-[100px] relative w-full aspect-[16/7] rounded-[20px] overflow-hidden bg-[#F0F0F0] mb-8 select-none"
        >
          <AnimatePresence mode="wait" initial={false}>
            {photos[photoIndex] && (
              <motion.div
                key={photoIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="absolute inset-0 cursor-pointer"
                onClick={() => { setLightboxIndex(photoIndex); setLightboxOpen(true); }}
              >
                <Image
                  src={photos[photoIndex]}
                  alt={`${salonName} — Foto ${photoIndex + 1}`}
                  fill
                  className="object-cover"
                  priority={photoIndex === 0}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {photos.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display text-[80px] text-[#222222]/10">
                {salonName[0]}
              </span>
            </div>
          )}

          {hasMultiple && (
            <>
              {/* Left nav */}
              <button
                onClick={() => setPhotoIndex((i) => (i - 1 + photos.length) % photos.length)}
                aria-label={t("previousPhoto")}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-[transform] hover:scale-110"
                style={{
                  background: "rgba(255,255,255,.75)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,.50)",
                  boxShadow: "0 1px 3px rgba(26,18,9,.07), 0 2px 8px rgba(26,18,9,.05)",
                }}
              >
                <ChevronLeft className="w-5 h-5 text-[#222222]" />
              </button>
              {/* Right nav */}
              <button
                onClick={() => setPhotoIndex((i) => (i + 1) % photos.length)}
                aria-label={t("nextPhoto")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-[transform] hover:scale-110"
                style={{
                  background: "rgba(255,255,255,.75)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,.50)",
                  boxShadow: "0 1px 3px rgba(26,18,9,.07), 0 2px 8px rgba(26,18,9,.05)",
                }}
              >
                <ChevronRight className="w-5 h-5 text-[#222222]" />
              </button>

              {/* Photo counter badge */}
              <span
                className="absolute top-3 right-3 text-xs font-heading font-bold px-2.5 py-1 rounded-btn"
                style={{ background: "rgba(26,18,9,.55)", color: "rgba(255,255,255,.90)" }}
              >
                {photoIndex + 1} / {photos.length}
              </span>

              {/* Dot indicators */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPhotoIndex(i)}
                    aria-label={`Foto ${i + 1}`}
                    className={`rounded-full transition-[background-color,width,height] ${
                      i === photoIndex
                        ? "bg-white w-3 h-3"
                        : "bg-white/50 w-2 h-2"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Photo lightbox */}
      <PhotoLightbox
        photos={photos}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        altPrefix={salonName}
      />
    </>
  );
}
