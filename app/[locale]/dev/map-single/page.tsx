"use client";

/**
 * /dev/map-single , TAP-A-PIN -> the BOTTOM SHEET becomes that SINGLE salon, expanded (owner 2026-07-02, BATCH 15).
 * English (mockup rule). 3 directions to decide (toggle at top): they differ by HOW FAR the sheet expands +
 * how much info it shows. NO floating popup (that was invented + graveyard'd , REMOVED.md); the sheet IS the
 * container, per the owner's reference.
 * Exists-check: `npm run exists map-single` = 0; real map = SearchTemplate map overlay + MapView (components-legacy).
 * Grounded-in: IMG_6267-6272 (~/solen/screenshots, Fresha map = bottom-sheet container, drag handle, filter
 *   chips, cards) + /dev/map-full (approved star+rating gray-selected pin + borderless feed card + "View N
 *   services") + PDP hours/reviews (SalonHeader hours line, salon reviews) + FilterSheet AMENITY_OPTIONS
 *   (amenity chips). No Book button (owner-removed on the map preview, REMOVED.md); off-ramp = "View store".
 * Real tokens, Lucide, no CDN. Try: switch Direction 1/2/3 and see the same salon at 3 expand levels.
 */
import { useEffect, useState } from "react";
import { ArrowLeft, Search, Map as MapIcon, Star, Heart, ChevronLeft, ChevronRight, Clock, Wifi, CreditCard, Car } from "lucide-react";
import { notFound } from "next/navigation";

const FROST = "bg-white/95 backdrop-blur-xl border border-s-border shadow-[0_1px_2px_rgba(10,10,10,0.10),0_8px_24px_rgba(10,10,10,0.10)]";

const PINS = [
  { rating: "4.9", top: 250, left: 88, sel: true },
  { rating: "5.0", top: 300, left: 262 },
  { rating: "5.0", top: 360, left: 150 },
  { rating: "4.7", top: 285, left: 330 },
];

const SALON = {
  name: "Supreme Style & Barber", rating: "4.9", count: "1'722", dist: "400 m", addr: "Kleinbasel, Basel",
  cat: "Barber", hours: "Open until 19:00",
  services: [
    ["Fade & Classic Men Haircut", "45 min", "from CHF 60"],
    ["One Grade All Over", "30 min", "CHF 35"],
    ["Beard Trim & Line Up", "20 min", "CHF 25"],
    ["Hot Towel Shave", "30 min", "CHF 40"],
    ["Kids Cut", "20 min", "CHF 30"],
  ],
  more: 2,
  amenities: [["Wi-Fi", Wifi], ["Card", CreditCard], ["Parking", Car]] as const,
  review: { who: "Marco B.", stars: "5.0", text: "Best fade in Basel, in and out in 30 min. Booking was effortless." },
};

function Pin({ p }: { p: (typeof PINS)[number] }) {
  return (
    <span className="absolute flex -translate-x-1/2 flex-col items-center" style={{ top: p.top, left: p.left, zIndex: p.sel ? 6 : 2 }}>
      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12.5px] font-semibold ${p.sel ? "border-s-border bg-s-bg-sunken text-s-ink scale-110 shadow-[0_2px_6px_rgba(10,10,10,0.16),0_10px_24px_rgba(10,10,10,0.14)]" : "border-s-border bg-white text-s-ink shadow-[0_1px_2px_rgba(10,10,10,0.12),0_4px_12px_rgba(10,10,10,0.10)]"}`}>
        <Star size={12} className="fill-s-star text-s-star" strokeWidth={0} /> {p.rating}
      </span>
      <span className={`-mt-1 h-2 w-2 rotate-45 border-b border-r border-s-border ${p.sel ? "bg-s-bg-sunken" : "bg-white"}`} />
    </span>
  );
}

function BackToList() {
  return (
    <button className="inline-flex items-center gap-1 rounded-full border border-s-border bg-white px-3 py-1.5 text-[12.5px] font-medium text-s-ink active:scale-95">
      <ChevronLeft size={15} strokeWidth={2.2} /> All salons
    </button>
  );
}

function Photo({ h = "aspect-[3/2]" }: { h?: string }) {
  return (
    <div className={`relative w-full overflow-hidden rounded-2xl bg-s-bg-sunken ${h}`}>
      <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white text-s-ink-2 shadow-sm"><Heart size={16} /></span>
      <span className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-white" /><span className="h-1.5 w-1.5 rounded-full bg-white/55" /><span className="h-1.5 w-1.5 rounded-full bg-white/55" />
      </span>
    </div>
  );
}

function Head() {
  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <p className="truncate font-heading text-[18px] font-bold text-s-ink">{SALON.name}</p>
        <span className="flex shrink-0 items-center gap-1 text-[14px] font-semibold text-s-ink"><Star size={14} className="fill-s-star text-s-star" strokeWidth={0} /> {SALON.rating}</span>
      </div>
      <p className="mt-0.5 truncate text-[13px] text-s-ink-2">{SALON.dist}, {SALON.addr}</p>
      <p className="truncate text-[13px] text-s-ink-2">{SALON.cat}, {SALON.count} reviews</p>
    </div>
  );
}

function ServiceRow({ n, d, p }: { n: string; d: string; p: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-s-bg-sunken px-3.5 py-2.5 text-[13.5px]">
      <span className="min-w-0"><span className="block truncate text-s-ink">{n}</span><span className="text-[12px] text-s-ink-3">{d}</span></span>
      <span className="shrink-0 font-semibold tabular-nums text-s-ink">{p}</span>
    </div>
  );
}

function ViewStore() {
  return <span className="mt-3 block text-[13.5px] font-semibold text-s-accent">View store</span>;
}

// Direction 1 , compact expand (~48%): isolated single-salon card, top 3 services, "View store".
function Sheet1() {
  return (
    <SheetShell top="top-[420px]">
      <Photo />
      <div className="pt-2.5"><Head /></div>
      <div className="mt-2.5 space-y-1.5">{SALON.services.slice(0, 3).map(([n, d, p]) => <ServiceRow key={n} n={n} d={d} p={p} />)}</div>
      <ViewStore />
    </SheetShell>
  );
}

// Direction 2 , medium expand (~68%): + hours + reviews row + 4 services.
function Sheet2() {
  return (
    <SheetShell top="top-[260px]">
      <Photo />
      <div className="pt-2.5"><Head /></div>
      <p className="mt-2 flex items-center gap-1.5 text-[13px] text-s-ink-2"><Clock size={14} /> {SALON.hours}</p>
      <button className="mt-2.5 flex w-full items-center justify-between gap-2 rounded-xl border border-s-border px-3.5 py-2.5 text-left active:bg-s-bg-sunken">
        <span className="flex items-center gap-1.5 text-[13.5px] text-s-ink"><Star size={14} className="fill-s-star text-s-star" strokeWidth={0} /> <span className="font-semibold">{SALON.rating}</span> <span className="text-s-ink-2">{SALON.count} reviews</span></span>
        <ChevronRight size={16} className="text-s-ink-3" />
      </button>
      <div className="mt-2.5 space-y-1.5">{SALON.services.slice(0, 4).map(([n, d, p]) => <ServiceRow key={n} n={n} d={d} p={p} />)}</div>
      <ViewStore />
    </SheetShell>
  );
}

// Direction 3 , near-full expand (~85%): mini-PDP , hours + amenity chips + services (5) + a review snippet.
function Sheet3() {
  return (
    <SheetShell top="top-[120px]">
      <Photo h="aspect-[16/10]" />
      <div className="pt-2.5"><Head /></div>
      <p className="mt-2 flex items-center gap-1.5 text-[13px] text-s-ink-2"><Clock size={14} /> {SALON.hours}</p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {SALON.amenities.map(([label, Icon]) => (
          <span key={label} className="inline-flex items-center gap-1 rounded-full bg-s-bg-sunken px-2.5 py-1 text-[12px] font-medium text-s-ink-2"><Icon size={12} /> {label}</span>
        ))}
      </div>
      <p className="mb-2 mt-4 text-[13px] font-semibold text-s-ink">Popular services</p>
      <div className="space-y-1.5">{SALON.services.slice(0, 5).map(([n, d, p]) => <ServiceRow key={n} n={n} d={d} p={p} />)}</div>
      <div className="mt-4 rounded-2xl border border-s-border p-3.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-semibold text-s-ink">{SALON.review.who}</span>
          <span className="flex items-center gap-1 text-[12.5px] text-s-ink-2"><Star size={12} className="fill-s-star text-s-star" strokeWidth={0} /> {SALON.review.stars}</span>
        </div>
        <p className="mt-1 text-[13px] leading-snug text-s-ink-2">{SALON.review.text}</p>
      </div>
      <ViewStore />
    </SheetShell>
  );
}

function SheetShell({ top, children }: { top: string; children: React.ReactNode }) {
  return (
    <div className={`absolute inset-x-0 bottom-0 ${top} z-30 flex flex-col rounded-t-[24px] border-t border-s-border bg-white shadow-[0_-2px_8px_rgba(10,10,10,0.06),0_-16px_40px_rgba(10,10,10,0.12)]`}>
      <div className="flex shrink-0 items-center justify-between px-4 pb-1 pt-3">
        <BackToList />
        <span className="h-1 w-10 rounded-full bg-s-border" />
        <span className="w-[92px]" />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{children}</div>
    </div>
  );
}

function Frame({ dir }: { dir: number }) {
  return (
    <div className="relative h-[812px] w-full overflow-hidden rounded-[28px] border border-s-border bg-white shadow-[0_8px_40px_rgba(10,10,10,0.14)]">
      <div className="absolute inset-0 [background:repeating-linear-gradient(0deg,transparent,transparent_31px,rgba(10,10,10,0.04)_32px),repeating-linear-gradient(90deg,transparent,transparent_31px,rgba(10,10,10,0.04)_32px)]" />
      <div className="absolute inset-x-3 top-3 z-40">
        <div className={`flex items-center gap-1 rounded-full py-1.5 pl-1.5 pr-1.5 ${FROST}`}>
          <button className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-s-ink" aria-label="Back"><ArrowLeft size={21} strokeWidth={2.2} /></button>
          <Search size={18} strokeWidth={2} className="shrink-0 text-s-ink-2" />
          <div className="min-w-0 flex-1 pl-1">
            <p className="truncate text-[15px] font-bold leading-tight text-s-ink">Buzz cut</p>
            <p className="truncate text-[12.5px] leading-tight text-s-ink-2">Any time in Basel</p>
          </div>
          <button className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-s-border bg-white text-s-ink" aria-label="List view"><MapIcon size={19} strokeWidth={2} /></button>
        </div>
      </div>
      {PINS.map((p, i) => <Pin key={i} p={p} />)}
      {dir === 1 && <Sheet1 />}
      {dir === 2 && <Sheet2 />}
      {dir === 3 && <Sheet3 />}
    </div>
  );
}

const LABEL: Record<number, string> = {
  1: "Compact , isolated salon card + top 3 services (sheet ~half).",
  2: "Medium , adds hours + a reviews row + 4 services (sheet ~two-thirds).",
  3: "Full , mini-PDP: hours, amenities, 5 services, a review (sheet ~full).",
};

export default function MapSingleMockup() {
  if (process.env.NODE_ENV === "production") notFound();
  const [mounted, setMounted] = useState(false);
  const [dir, setDir] = useState(1);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <main className="min-h-screen bg-s-bg-sunken py-4">
      <div className="mx-auto w-full max-w-[390px] px-3">
        <p className="pb-1 text-center text-[12px] font-semibold text-s-ink-3">Tap a pin, the bottom sheet becomes that salon. Pick a direction.</p>
        <div className="flex justify-center gap-2 pb-3">
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              onClick={() => setDir(n)}
              className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold ${dir === n ? "border-transparent bg-s-bg-sunken text-s-ink" : "border-s-border bg-white text-s-ink-2"}`}
            >
              Direction {n}
            </button>
          ))}
        </div>
        <Frame dir={dir} />
        <p className="px-1 pt-3 text-center text-[12.5px] text-s-ink-2">{LABEL[dir]}</p>
      </div>
    </main>
  );
}
