"use client";

/**
 * /de/dev/pdp/portfolio - dev-only 1:1 comparison of THREE real treatments for the
 * salon-PDP Portfolio grid (owner: wants the ACTUAL shipping component rendered per
 * direction, not a hand-drawn approximation). Net-new dev route.
 *
 * Renders the REAL `SalonPortfolio` grid (app/[locale]/_components/salon/SalonPortfolio.tsx)
 * three times, switching ONLY its new optional `layout` prop (grid-3 / grid-2 /
 * hero-filmstrip) - default "grid-3" is untouched, so SalonDetailV3's real PDP usage (no
 * `layout` passed) is byte-identical to before this file existed. No component was forked
 * or duplicated to build this comparison.
 *
 * Each frame also mounts the REAL SalonLightbox (app/[locale]/_components/salon/
 * SalonLightbox.tsx, just fixed 2026-07-23 - portaled to body, header/stage/footer flex,
 * reserved chevron gutters, swipe) so the owner can tap any photo, or the explicit "Open
 * lightbox" button below each frame, and page through it exactly as it will ship.
 *
 * DATA: small hardcoded fixture for "Cuts & Culture" (Basel barbershop) - name, area,
 * rating 4.8 / 16 reviews per the task brief; address matches the same fixture salon used
 * in app/[locale]/dev/search-balance/page.tsx. Gallery photos are barbershop-context
 * Unsplash IDs already used elsewhere in this codebase for the same persona (the barber
 * "Old Town Barbers" portfolio in ArtistOfTheMonth.tsx + the barbershop seed rows in
 * supabase/migrations/003_more_stores.sql), reused here instead of invented so the fixture
 * traces to something already real in-repo.
 *
 * Mockup-chrome copy (the direction labels + one-line rationale I wrote for this comparison
 * harness) is English, matching every sibling /dev/ route. The rendered UI itself carries
 * whatever copy the real imported components ship with, unedited - this file adds no
 * localized strings of its own into either component.
 */
import { useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { ImageIcon } from "lucide-react";
import { SalonPortfolio } from "@/app/[locale]/_components/salon/SalonPortfolio";
import { RatingStars } from "@/app/[locale]/_components/primitives/RatingStars";

// Dynamic, ssr:false - matches how SalonDetailV3.tsx itself imports this component (it
// touches document via createPortal, so it cannot render during SSR).
const SalonLightbox = dynamic(
  () => import("@/app/[locale]/_components/salon/SalonLightbox").then((m) => m.SalonLightbox),
  { ssr: false },
);

const SALON = {
  name: "Cuts & Culture",
  address: "Elsässerstrasse 10, Basel",
  rating: 4.8,
  reviewCount: 16,
};

const GALLERY_URLS = [
  "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=900&q=80",
  "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=900&q=80",
  "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=900&q=80",
  "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=900&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=900&q=80",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=900&q=80",
];

const DIRECTIONS = [
  {
    key: "grid-3" as const,
    label: "Direction A - 3-col square grid",
    rationale: "The current shipped layout: uniform square tiles, dense and scannable.",
  },
  {
    key: "grid-2" as const,
    label: "Direction B - 2-col taller cards",
    rationale: "Fewer, bigger portrait tiles - more detail per tap, less density.",
  },
  {
    key: "hero-filmstrip" as const,
    label: "Direction C - hero + filmstrip",
    rationale: "One large lead photo, the rest scroll as a thumbnail strip below it.",
  },
] as const;

function PhoneFrame({
  label,
  rationale,
  children,
}: {
  label: string;
  rationale: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="font-display text-[15px] font-bold text-s-ink">{label}</p>
      <p className="mt-0.5 text-[12.5px] text-s-ink-2">{rationale}</p>
      <div className="mx-auto mt-3 w-full max-w-[390px] overflow-hidden rounded-2xl border border-s-border bg-white shadow-elevation-2">
        {children}
      </div>
    </div>
  );
}

function DirectionFrame({
  layoutKey,
  onOpenLightbox,
}: {
  layoutKey: (typeof DIRECTIONS)[number]["key"];
  onOpenLightbox: (index: number) => void;
}) {
  return (
    <div className="px-4 py-5">
      {/* Minimal PDP context so the grid doesn't float unlabeled - real salon name/rating,
          not the full SalonHero (out of scope for this comparison). */}
      <div className="border-b border-s-border pb-4">
        <p className="font-display text-[18px] font-semibold text-s-ink">{SALON.name}</p>
        <p className="mt-0.5 text-[13px] text-s-ink-2">{SALON.address}</p>
        <div className="mt-1">
          <RatingStars value={SALON.rating} count={SALON.reviewCount} size="sm" />
        </div>
      </div>

      <div className="pt-4">
        <SalonPortfolio urls={GALLERY_URLS} onOpen={onOpenLightbox} layout={layoutKey} />
      </div>

      <button
        type="button"
        onClick={() => onOpenLightbox(0)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-btn border border-s-border bg-white py-3 text-[15px] font-medium tracking-[-0.005em] text-s-ink"
      >
        <ImageIcon size={16} strokeWidth={2} aria-hidden />
        Open lightbox
      </button>
    </div>
  );
}

export default function PdpPortfolioDirections() {
  if (process.env.NODE_ENV === "production") notFound();

  const [lb, setLb] = useState<{ open: boolean; index: number }>({ open: false, index: 0 });
  const openLightbox = (index: number) => setLb({ open: true, index });

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-s-bg-sunken px-4 pb-24 pt-8">
      <h1 className="font-display text-[22px] font-bold text-s-ink">Portfolio grid - 3 directions</h1>
      <p className="mt-1 text-[13.5px] text-s-ink-2">
        The real SalonPortfolio grid, rendered three times via its new layout prop. Same
        fixture data every time, same real SalonLightbox on tap - tap any photo, or the
        button below each frame.
      </p>

      <div className="mt-6 flex flex-col gap-10">
        {DIRECTIONS.map((d) => (
          <PhoneFrame key={d.key} label={d.label} rationale={d.rationale}>
            <DirectionFrame layoutKey={d.key} onOpenLightbox={openLightbox} />
          </PhoneFrame>
        ))}
      </div>

      <SalonLightbox
        photos={GALLERY_URLS}
        open={lb.open}
        startIndex={lb.index}
        onClose={() => setLb((p) => ({ ...p, open: false }))}
      />
    </div>
  );
}
