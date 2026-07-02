"use client";

/**
 * /dev/spec-chip , A4 SPECIALIZATION CHIP system (owner 2026-07-02: "a chip specialized for X, e.g.
 * black hair, a specialist, liquid/frosted glass, ON the photo, design the SYSTEM + how to integrate").
 * English (mockup rule). Council direction: a CLIENT-SIDE MATCH chip, never a fabricated always-on badge.
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
 * A3-approved aspect-[3/2]. matching-service line + View store kept so it reads as the real result card.
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

function ChipFrost({ label, icon }: { label: string; icon: boolean }) {
  return (
    <span style={FROST} className="inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[11px] font-semibold text-s-ink"> {/* drift-ok: owner-approved 11px on-photo chip, eyebrow-size floor (A4 shrink 2026-07-02) */}
      {icon && <BadgeCheck size={11} className="text-s-ink" />}
      {label}
    </span>
  );
}
function ChipInk({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-pill bg-s-ink/85 px-2.5 py-1 text-[12px] font-semibold text-white backdrop-blur-[2px]">
      <BadgeCheck size={13} /> {label}
    </span>
  );
}

// a real-grammar result card with the recommended frosted chip
function Card({ name, meta, rating, photo, chip, service }: { name: string; meta: string; rating: string; photo: string; chip: string | null; service: string }) {
  return (
    <div className="w-full">
      <div className="relative aspect-[3/2] w-full overflow-hidden rounded-[18px] shadow-elevation-2" style={{ backgroundImage: photo }}>
        <span className="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full text-s-ink" style={FROST}><Heart size={15} /></span>
        {chip && <span className="absolute bottom-2.5 left-2.5"><ChipFrost label={chip} icon /></span>}
      </div>
      <div className="pt-2">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-heading text-[15px] font-bold text-s-ink">{name}</p>
          <span className="flex shrink-0 items-center gap-0.5 text-[13px] font-semibold text-s-ink"><Star size={12} className="fill-s-star text-s-star" strokeWidth={0} /> {rating}</span>
        </div>
        <p className="mt-0.5 truncate text-[12.5px] text-s-ink-2">{meta}</p>
        {/* matching-service line , the service that produced the match */}
        <p className="mt-1.5 truncate text-[12.5px] text-s-ink-2">{service}</p>
        <span className="mt-1.5 inline-flex items-center gap-0.5 text-[12.5px] font-semibold text-s-accent">View store <ChevronRight size={13} /></span>
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
      <div className="mx-auto max-w-[440px] px-4">
        <h1 className="font-heading text-[19px] font-bold text-s-ink">Specialization chip</h1>
        <p className="mb-5 mt-1 text-[13px] text-s-ink-2">A frosted chip on the photo that marks a real match to what you searched, e.g. "black hair" surfaces salons whose staff or services actually specialize in it. Shows only on a real match, never fabricated.</p>

        {/* 1. On the real card */}
        <p className="mb-2 text-[13px] font-bold text-s-ink">1. On the result card</p>
        <div className="mb-3 grid grid-cols-2 gap-3">
          <Card name="Muse Beauty Studio" meta="Coiffeur, Basel" rating="4.9" photo={PHOTOS[0]} chip="Black hair specialist" service="Matched: Afro cut and care" />
          <Card name="Atelier Nord" meta="Coiffeur, Zurich" rating="4.8" photo={PHOTOS[1]} chip="Balayage specialist" service="Matched: Balayage color" />
        </div>
        <p className="mb-6 rounded-xl bg-white p-3 text-[12.5px] text-s-ink-2">Bottom-left of the photo. The heart keeps the top-right, the discount pill keeps the right slot, so the chip never collides.</p>

        {/* 2. Chip styles */}
        <p className="mb-2 text-[13px] font-bold text-s-ink">2. Chip style , pick one</p>
        <div className="mb-6 grid grid-cols-3 gap-3">
          {[
            { t: "A. Frosted, icon", node: <ChipFrost label="Black hair specialist" icon />, rec: true },
            { t: "B. Frosted, text", node: <ChipFrost label="Black hair specialist" icon={false} />, rec: false },
            { t: "C. Ink solid", node: <ChipInk label="Black hair specialist" />, rec: false },
          ].map((s) => (
            <div key={s.t}>
              <div className="relative flex aspect-[3/2] items-end justify-start overflow-hidden rounded-[16px] p-2" style={{ backgroundImage: PHOTOS[2] }}>
                {s.node}
              </div>
              <p className={`mt-1.5 text-[12px] font-semibold ${s.rec ? "text-s-accent" : "text-s-ink-3"}`}>{s.t}{s.rec ? " (rec)" : ""}</p>
            </div>
          ))}
        </div>

        {/* 3. Where it comes from */}
        <p className="mb-2 text-[13px] font-bold text-s-ink">3. Where it comes from (never fabricated)</p>
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
            <p className="mb-2 text-[12px] font-semibold text-s-ink-3">No match, no chip (control)</p>
            <div className="w-[168px]">
              <Card name="Studio Bellevue" meta="Coiffeur, Bern" rating="4.7" photo={PHOTOS[1]} chip={null} service="No specialty match for this search" />
            </div>
          </div>
        </div>

        <p className="mt-4 text-[12.5px] text-s-ink-2">Recommend <span className="font-semibold text-s-ink">Style A</span> (frosted glass, badge icon). It reads as a quiet signal on the photo, stays on brand with the frost recipe already used for the save-heart, and only ever shows a term the salon truly offers. Approve a style and I wire the match against staff_members.specialties plus services.</p>
      </div>
    </main>
  );
}
