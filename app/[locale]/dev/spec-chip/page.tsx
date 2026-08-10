"use client";

/**
 * /dev/spec-chip , A4 SPECIALIZATION CHIP system (owner 2026-07-02: "a chip specialized for X, e.g.
 * black hair, a specialist, liquid/frosted glass, ON the photo, design the SYSTEM + how to integrate").
 * English (mockup rule). Council direction: a CLIENT-SIDE MATCH chip, never a fabricated always-on badge.
 *
 * ROUND 3 (owner 2026-07-03): "still didn't figure it out" , root cause = the chip was shown on
 * HALF-width 2-col cards, so the owner couldn't judge it at real phone size. Rework: ONE FULL-WIDTH
 * feed card (aspect-[3/2] photo at the real search-feed width) with the frosted chip (style A already
 * chosen), then a "Pick a size" section = three FULL-WIDTH photo strips at S / M / L so the size is
 * judged at real size. Recommend M. The 2-col grid + the 3-style A/B/C strip are gone (style locked to A).
 *
 * DATA -> CHIP (verified in live snapshot _db-columns.json capturedAt 2026-06-30, never fabricated):
 *   - staff_members.specialties[]  (REAL text[] column; e.g. ["Black hair","Balayage"])
 *   - services.name_de/en + services.suitable_for + services.subcategory
 *   The user's query (?q= / free text) is matched against those two sources per salon. A MATCH renders
 *   the frosted chip on the photo ("{term} specialist"). NO match = NO chip. The value is always the
 *   matched real term, so it can never show something the salon doesn't actually offer.
 *
 * Treatment = FROST_GLASS verbatim from lib/frost-glass.ts (the ONE place white+shadow-over-photo is
 * allowed, V3-D420 CONTROL_ELEVATION). Placement = bottom-left of the photo (heart owns top-right,
 * discount pill owns the right slot , project_card_badges). Card = SalonResultCard feed grammar at the
 * A3-approved aspect-[3/2] + matching-service line + View store, full width per the real-size rule.
 * Exists-check: `npm run exists spec-chip` = 0; real card = _components/search/SalonResultCard.tsx (feed
 * variant, aspect-[3/2]); frost recipe = lib/frost-glass.ts; specialties surfaced today only on the
 * barber PDP + booking staff list, never on a result card , this is the net-new surface.
 * Real tokens, Lucide, no CDN.
 */
import { useEffect, useState } from "react";
import { Star, Heart, BadgeCheck, ChevronRight } from "lucide-react";
import { notFound } from "next/navigation";

// FROST_GLASS verbatim (lib/frost-glass.ts) , grounded, not re-invented.
const FROST = {
  background: "rgba(255,255,255,0.80)",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
  border: "1px solid rgba(255,255,255,0.6)",
  boxShadow: "0 1px 3px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.4)",
} as const;

// photo placeholders (CSS only , a mockup stand-in for the real salon photo, so the frost is legible)
const PHOTOS = [
  "linear-gradient(135deg,#8a7f77 0%,#5c534d 55%,#3f3833 100%)", // drift-ok: mockup photo placeholder gradient
  "linear-gradient(135deg,#7d8794 0%,#59616c 55%,#3b4048 100%)", // drift-ok: mockup photo placeholder gradient
  "linear-gradient(135deg,#9a8f86 0%,#726255 55%,#4b3f36 100%)", // drift-ok: mockup photo placeholder gradient
];

// The recommended chip, sized. S/M/L differ ONLY in text size, padding, icon size
// so the owner can judge legibility at real size. Style A (FROST + BadgeCheck) is locked.
type ChipSize = "S" | "M" | "L";
const CHIP_SIZE: Record<ChipSize, { text: string; pad: string; icon: number }> = {
  S: { text: "text-[11px]", pad: "px-2 py-0.5", icon: 11 }, // drift-ok: 11px S variant is the eyebrow-size floor, owner-approved on-photo chip (A4)
  M: { text: "text-[12px]", pad: "px-2.5 py-1", icon: 12 },
  L: { text: "text-[13px]", pad: "px-3 py-1", icon: 14 },
};

function ChipFrost({ label, size }: { label: string; size: ChipSize }) {
  const s = CHIP_SIZE[size];
  return (
    <span
      style={FROST}
      className={`inline-flex items-center gap-1 rounded-pill font-semibold text-s-ink ${s.text} ${s.pad}`}
    >
      <BadgeCheck size={s.icon} className="text-s-ink" />
      {label}
    </span>
  );
}

// One FULL-WIDTH feed-grammar result card with the recommended frosted chip.
// Full container width (~370px at phone) = the real search feed size (real-size rule).
function FeedCard({
  name,
  meta,
  rating,
  photo,
  chip,
  service,
  chipSize = "M",
}: {
  name: string;
  meta: string;
  rating: string;
  photo: string;
  chip: string | null;
  service: string;
  chipSize?: ChipSize;
}) {
  return (
    <div className="w-full">
      <div className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl shadow-elevation-2" style={{ backgroundImage: photo }}>
        <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-s-ink" style={FROST}><Heart size={16} /></span>
        {chip && <span className="absolute bottom-3 left-3"><ChipFrost label={chip} size={chipSize} /></span>}
      </div>
      <div className="pt-2.5">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-heading text-[16px] font-bold text-s-ink">{name}</p>
          <span className="flex shrink-0 items-center gap-0.5 text-[14px] font-semibold text-s-ink"><Star size={13} className="fill-s-star text-s-star" strokeWidth={0} /> {rating}</span>
        </div>
        <p className="mt-0.5 truncate text-[13px] text-s-ink-2">{meta}</p>
        {/* matching-service line , the service that produced the match */}
        <p className="mt-1.5 truncate text-[13px] text-s-ink-2">{service}</p>
        <span className="mt-2 inline-flex items-center gap-0.5 text-[13px] font-semibold text-s-accent">View store <ChevronRight size={14} /></span>
      </div>
    </div>
  );
}

// A full-width photo strip showing ONE size on a real-size photo (for the size pick).
function SizeStrip({ size, note, rec }: { size: ChipSize; note: string; rec: boolean }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2">
        <span className={`font-body text-[13px] font-bold ${rec ? "text-s-accent" : "text-s-ink"}`}>
          {size}{rec ? " (recommended)" : ""}
        </span>
        <span className="font-body text-[12px] text-s-ink-2">{note}</span>
      </div>
      <div
        className="relative flex aspect-[3/2] w-full items-end justify-start overflow-hidden rounded-2xl p-3 shadow-elevation-2"
        style={{ backgroundImage: PHOTOS[2] }}
      >
        <ChipFrost label="Black hair specialist" size={size} />
      </div>
    </div>
  );
}

export default function SpecChipMockup() {
  if (process.env.NODE_ENV === "production") notFound();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <main className="min-h-screen bg-s-bg-sunken py-6">
      {/* Real phone width , the feed card renders full-width inside this column. */}
      <div className="mx-auto w-full max-w-[400px] px-4">
        <h1 className="font-heading text-[19px] font-bold text-s-ink">Specialization chip</h1>
        <p className="mb-6 mt-1 text-[13px] text-s-ink-2">A frosted chip on the photo that marks a real match to what you searched, e.g. "black hair" surfaces salons whose staff or services actually specialize in it. Shows only on a real match, never fabricated.</p>

        {/* 1. On the real full-width feed card */}
        <p className="mb-2.5 text-[13px] font-bold text-s-ink">1. On the result card (real size)</p>
        <div className="mb-3">
          <FeedCard
            name="Muse Beauty Studio"
            meta="Coiffeur, Basel"
            rating="4.9"
            photo={PHOTOS[0]}
            chip="Black hair specialist"
            service="Matched: Afro cut and care"
            chipSize="M"
          />
        </div>
        <p className="mb-8 rounded-xl bg-white p-3 text-[12.5px] text-s-ink-2">Bottom-left of the photo. The heart keeps the top-right, the discount pill keeps the right slot, so the chip never collides.</p>

        {/* 2. Pick a size , three full-width strips at real size (style A is locked) */}
        <p className="mb-1 text-[13px] font-bold text-s-ink">2. Pick a size</p>
        <p className="mb-4 text-[12.5px] text-s-ink-2">Same frosted style, three sizes, each on a real-size photo. Recommend M , legible at arm's length without shouting.</p>
        <div className="mb-8 space-y-5">
          <SizeStrip size="S" note="11px, px-2, icon 11" rec={false} />
          <SizeStrip size="M" note="12px, px-2.5, icon 12" rec />
          <SizeStrip size="L" note="13px, px-3, icon 14" rec={false} />
        </div>

        {/* 3. Where it comes from */}
        <p className="mb-2.5 text-[13px] font-bold text-s-ink">3. Where it comes from (never fabricated)</p>
        <div className="rounded-2xl bg-white p-4">
          <div className="space-y-2.5 text-[12.5px] text-s-ink">
            <p>Search <span className="rounded bg-s-bg-sunken px-1.5 py-0.5 font-mono text-[12px]">q = "black hair"</span></p>
            <p className="pl-3 text-s-ink-2">match against, per salon:</p>
            <ul className="space-y-1 pl-3">
              <li className="flex items-center gap-1.5"><BadgeCheck size={13} className="shrink-0 text-s-ink-2" /> <span className="font-mono text-[12px]">staff_members.specialties[]</span></li>
              <li className="flex items-center gap-1.5"><BadgeCheck size={13} className="shrink-0 text-s-ink-2" /> <span className="font-mono text-[12px]">services.name / suitable_for / subcategory</span></li>
            </ul>
            <p className="pl-3 text-s-ink-2">match found, chip = the matched real term. No match, no chip.</p>
          </div>
          <div className="mt-3 border-t border-s-border pt-3">
            <p className="mb-2 text-[12px] font-semibold text-s-ink-2">No match, no chip (control)</p>
            <FeedCard
              name="Studio Bellevue"
              meta="Coiffeur, Bern"
              rating="4.7"
              photo={PHOTOS[1]}
              chip={null}
              service="No specialty match for this search"
            />
          </div>
        </div>

        <p className="mt-5 text-[12.5px] text-s-ink-2">Recommend size <span className="font-semibold text-s-ink">M</span> (frosted glass, badge icon, 12px). It reads as a quiet signal on the photo, stays on brand with the frost recipe already used for the save-heart, and only ever shows a term the salon truly offers. Approve the size and I wire the match against staff_members.specialties plus services.</p>
      </div>
    </main>
  );
}
