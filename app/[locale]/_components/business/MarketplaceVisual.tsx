import { Star, Heart } from "lucide-react";

/**
 * MarketplaceVisual — V3-D218 (2026-05-26, /business rebuild).
 *
 * Decorative 3-card stack used in the /business "Marktplatz" pitch section.
 * Mimics the visual grammar of the real <SalonCard> so partners immediately
 * recognize "this is what my salon looks like on Solen" — without importing
 * the actual SalonCard (which carries availability state, photo data, click
 * targets we don't need here).
 *
 * Three faux cards stacked with perspective rotation. Pure CSS, no JS state,
 * no motion. Decorative — `aria-hidden` on the whole stack.
 *
 * Card images = ImageIcon placeholders against grey-tinted bgs (we don't
 * want to reproduce real salon photos here, and the bento page is already
 * heavy with mockups).
 */

interface FauxCard {
  name: string;
  meta: string;
  city: string;
  rating: string;
  tint: string; // bg color for the photo placeholder
}

const CARDS: FauxCard[] = [
  {
    name: "Atelier Haarwerk",
    meta: "Steinenvorstadt 12",
    city: "Basel",
    rating: "4.9",
    tint: "bg-s-bg-sunken",
  },
  {
    name: "Salon Maria",
    meta: "Limmatquai 88",
    city: "Zürich",
    rating: "4.8",
    tint: "bg-s-bg-sunken",
  },
  {
    name: "Studio Nove",
    meta: "Aarbergergasse 21",
    city: "Bern",
    rating: "4.9",
    tint: "bg-s-bg-sunken",
  },
];

function FauxSalonCard({ card, className }: { card: FauxCard; className?: string }) {
  return (
    <article
      className={`w-[180px] shrink-0 overflow-hidden rounded-card bg-white shadow-elevation-2 ${className ?? ""}`}
    >
      {/* Photo placeholder */}
      <div className={`relative aspect-[4/5] w-full ${card.tint}`}>
        {/* Heart icon top-right (matches real SalonCard chrome) */}
        <span className="absolute right-2.5 top-2.5 grid h-7 w-7 place-items-center rounded-full bg-white/85 text-s-ink-2 shadow-elevation-1">
          <Heart size={14} strokeWidth={2} aria-hidden />
        </span>
      </div>
      {/* Row 1: name + rating */}
      <div className="flex items-center justify-between gap-2 px-3 pt-2.5">
        <p className="truncate font-body text-[13px] font-semibold text-s-ink">
          {card.name}
        </p>
        <span className="inline-flex shrink-0 items-center gap-0.5 font-body text-[12px] font-semibold text-s-ink">
          <Star size={11} stroke="none" aria-hidden className="fill-s-star" />
          {card.rating}
        </span>
      </div>
      {/* Row 2: meta line */}
      <p className="truncate px-3 pb-3 pt-0.5 font-body text-[11px] font-normal text-s-ink-2">
        {card.meta} {card.city}
      </p>
    </article>
  );
}

export function MarketplaceVisual() {
  return (
    <div
      aria-hidden
      className="relative mx-auto flex aspect-[4/3] w-full max-w-[420px] items-center justify-center"
      style={{ perspective: 1200 }}
    >
      {/* Back card (rotated back-left) */}
      <div
        className="absolute z-[1] -translate-x-[88px] translate-y-[10px] opacity-70"
        style={{ transform: "rotate(-8deg) translateX(-88px) translateY(10px)" }}
      >
        <FauxSalonCard card={CARDS[2]} />
      </div>
      {/* Right back card */}
      <div
        className="absolute z-[1] translate-x-[88px] translate-y-[10px] opacity-70"
        style={{ transform: "rotate(8deg) translateX(88px) translateY(10px)" }}
      >
        <FauxSalonCard card={CARDS[1]} />
      </div>
      {/* Front card — primary focus */}
      <div className="relative z-[2]">
        <FauxSalonCard card={CARDS[0]} />
      </div>
    </div>
  );
}

export default MarketplaceVisual;
