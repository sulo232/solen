"use client";

/**
 * /dev/map-behavior , INTERACTIVE map-sheet BEHAVIOR mockup (owner 2026-07-02, BATCH 15b council result).
 * English (mockup rule). DRAG the sheet: up = full mini-PDP, down = back to all salons. Tap a pin OR a card
 * to focus a salon. Tap "All salons" to go back. No double-tap (killed by the council).
 * Exists-check: `npm run exists map-behavior` = 0; real map = SearchTemplate map overlay + MapView.
 * Grounded-in: IMG_6267-6272 (~/solen/screenshots, Fresha map = bottom-sheet container + drag handle) +
 *   /dev/map-full (star+rating gray-selected pin, feed card, "View store") + /dev/map-single (the 3 depths)
 *   + the 3-lens council (map-patterns a12f2ef5 + state-machine ae5b6da8 + gesture-simplicity a48b8c32):
 *   morph one sheet, tap-pin=tap-card, SALON_MEDIUM default, swipe-up=SALON_FULL, swipe-down=back to LIST,
 *   keep an explicit "All salons" back chip, no double-tap, medium content default + full on expand.
 * Real tokens, Lucide, no CDN.
 */
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Search, Map as MapIcon, Star, Heart, ChevronLeft, Clock, Wifi, CreditCard, Car } from "lucide-react";
import { notFound } from "next/navigation";

const FROST = "bg-white/95 backdrop-blur-xl border border-s-border shadow-[0_1px_2px_rgba(10,10,10,0.10),0_8px_24px_rgba(10,10,10,0.10)]";

const LIST_DETENTS = [150, 400, 560];
const SALON_DETENTS = [96, 340];
const SALON_MEDIUM = 340;
const nearest = (arr: number[], v: number) => arr.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));

const SALONS = [
  { name: "Supreme Style & Barber", rating: "4.9", count: "1'722", dist: "400 m", addr: "Kleinbasel, Basel", cat: "Barber", hours: "Open until 19:00", more: 2, deals: false,
    services: [["Fade & Classic Men Haircut", "45 min", "from CHF 60"], ["One Grade All Over", "30 min", "CHF 35"], ["Beard Trim & Line Up", "20 min", "CHF 25"], ["Hot Towel Shave", "30 min", "CHF 40"], ["Kids Cut", "20 min", "CHF 30"]],
    review: { who: "Marco B.", stars: "5.0", text: "Best fade in Basel, in and out in 30 min." }, pin: { top: 250, left: 88 } },
  { name: "Lashere Beauty", rating: "5.0", count: "1'156", dist: "700 m", addr: "Kreis 5, Basel", cat: "Nails", hours: "Open until 20:00", more: 1, deals: true,
    services: [["Brow lifting + Keratin", "30 min", "CHF 90"], ["Gel Manicure", "45 min", "CHF 65"], ["Classic Pedicure", "50 min", "CHF 70"]],
    review: { who: "Sara L.", stars: "5.0", text: "Immaculate studio, my brows have never looked better." }, pin: { top: 300, left: 262 } },
  { name: "Zoltan Hair", rating: "5.0", count: "22", dist: "1.1 km", addr: "Nussgasse 3, Basel", cat: "Hair salon", hours: "Open until 18:30", more: 53, deals: false,
    services: [["Buzz Cut", "20 min", "CHF 50"], ["Shampoo, Cut & Style S", "45 min", "CHF 100"], ["Hair Treatment L", "10 min", "CHF 35"]],
    review: { who: "Jon P.", stars: "5.0", text: "Quiet, precise, no upsell. Exactly what I wanted." }, pin: { top: 360, left: 150 } },
  { name: "Old Town Barbers", rating: "4.7", count: "88", dist: "2.4 km", addr: "Steinenvorstadt, Basel", cat: "Barber", hours: "Open until 19:00", more: 4, deals: false,
    services: [["Skin Fade", "40 min", "CHF 55"], ["Beard Sculpt", "25 min", "CHF 30"], ["Cut & Beard", "55 min", "from CHF 75"]],
    review: { who: "Ali R.", stars: "4.5", text: "Solid classic barbershop, friendly team." }, pin: { top: 285, left: 330 } },
];
const AMENITIES = [["Wi-Fi", Wifi], ["Card", CreditCard], ["Parking", Car]] as const;

function ServiceRow({ n, d, p }: { n: string; d: string; p: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-s-bg-sunken px-3.5 py-2.5 text-[13.5px]">
      <span className="min-w-0"><span className="block truncate text-s-ink">{n}</span><span className="text-[12px] text-s-ink-2">{d}</span></span>
      <span className="shrink-0 font-semibold tabular-nums text-s-ink">{p}</span>
    </div>
  );
}

function Screen() {
  const [mode, setMode] = useState<"list" | "salon">("list");
  const [top, setTop] = useState(400);
  const [sel, setSel] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ startY: number; startTop: number } | null>(null);

  function focus(i: number) { setSel(i); setMode("salon"); setTop(SALON_MEDIUM); }
  function backToList() { setMode("list"); setSel(null); setTop(400); }

  function onPointerDown(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    drag.current = { startY: e.clientY, startTop: top };
    setDragging(true);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    const next = Math.min(660, Math.max(96, drag.current.startTop + (e.clientY - drag.current.startY)));
    setTop(next);
  }
  function onPointerUp() {
    if (!drag.current) return;
    const released = top;
    drag.current = null;
    setDragging(false);
    if (mode === "salon") {
      if (released > SALON_MEDIUM + 70) backToList(); // swipe down past medium -> all salons
      else setTop(nearest(SALON_DETENTS, released));
    } else {
      setTop(nearest(LIST_DETENTS, released));
    }
  }

  const isFull = mode === "salon" && top < 220;
  const s = sel !== null ? SALONS[sel] : null;

  return (
    <div className="relative h-[812px] w-full overflow-hidden rounded-[28px] border border-s-border bg-white shadow-[0_8px_40px_rgba(10,10,10,0.14)]">
      <div className="absolute inset-0 [background:repeating-linear-gradient(0deg,transparent,transparent_31px,rgba(10,10,10,0.04)_32px),repeating-linear-gradient(90deg,transparent,transparent_31px,rgba(10,10,10,0.04)_32px)]" />

      {/* search bar */}
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

      {/* pins */}
      {SALONS.map((p, i) => (
        <button key={i} onClick={() => focus(i)} className="absolute flex -translate-x-1/2 flex-col items-center" style={{ top: p.pin.top, left: p.pin.left, zIndex: sel === i ? 6 : 2 }} aria-label={`${p.name}, ${p.rating}`}>
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12.5px] font-semibold transition-transform ${sel === i ? "border-s-border bg-s-bg-sunken text-s-ink scale-110 shadow-[0_2px_6px_rgba(10,10,10,0.16),0_10px_24px_rgba(10,10,10,0.14)]" : "border-s-border bg-white text-s-ink shadow-[0_1px_2px_rgba(10,10,10,0.12),0_4px_12px_rgba(10,10,10,0.10)]"}`}>
            <Star size={12} className="fill-s-star text-s-star" strokeWidth={0} /> {p.rating}
          </span>
          <span className={`-mt-1 h-2 w-2 rotate-45 border-b border-r border-s-border ${sel === i ? "bg-s-bg-sunken" : "bg-white"}`} />
        </button>
      ))}

      {/* the ONE sheet, morphs list <-> salon; draggable by the header handle */}
      <div
        className="absolute inset-x-0 bottom-0 z-30 flex flex-col rounded-t-[24px] border-t border-s-border bg-white shadow-[0_-2px_8px_rgba(10,10,10,0.06),0_-16px_40px_rgba(10,10,10,0.12)]"
        style={{ top, transition: dragging ? "none" : "top 220ms cubic-bezier(0.22,1,0.36,1)" }}
      >
        {/* drag handle zone */}
        <div className="relative shrink-0 cursor-grab touch-none pt-2.5 pb-1 active:cursor-grabbing" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
          <div className="mx-auto h-1 w-10 rounded-full bg-s-border" />
          {mode === "salon" && (
            <button onClick={backToList} onPointerDown={(e) => e.stopPropagation()} className="absolute left-3 top-2 inline-flex items-center gap-1 rounded-full border border-s-border bg-white px-3 py-1.5 text-[12.5px] font-medium text-s-ink active:scale-95">
              <ChevronLeft size={15} strokeWidth={2.2} /> All salons
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {mode === "list" ? (
            <>
              <p className="pb-3 pt-1 text-center text-[13px] text-s-ink-2">{SALONS.length * 5} salons in this area</p>
              {/* APPROVED borderless feed card, copied verbatim from /dev/map-full StoreCard (NOT re-invented). */}
              <div className="space-y-6">
                {SALONS.map((c, i) => (
                  <button key={i} onClick={() => focus(i)} className="w-full text-left active:opacity-90">
                    <div className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl bg-s-bg-sunken">
                      {c.deals && <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-[12px] font-semibold text-s-ink shadow-sm">Deals</span>}
                      <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white text-s-ink-2 shadow-sm"><Heart size={16} /></span>
                      <span className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-white" /><span className="h-1.5 w-1.5 rounded-full bg-white/55" /><span className="h-1.5 w-1.5 rounded-full bg-white/55" /></span>
                    </div>
                    <div className="pt-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate font-heading text-[16px] font-bold text-s-ink">{c.name}</p>
                        <span className="flex shrink-0 items-center gap-1 text-[14px] font-semibold text-s-ink"><Star size={14} className="fill-s-star text-s-star" strokeWidth={0} /> {c.rating}</span>
                      </div>
                      <p className="mt-0.5 truncate text-[13px] text-s-ink-2">{c.dist}, {c.addr}</p>
                      <p className="truncate text-[13px] text-s-ink-2">{c.cat}, {c.count} reviews</p>
                      <div className="mt-2.5 space-y-1.5">
                        {c.services.slice(0, 3).map(([n, d, p]) => <ServiceRow key={n} n={n} d={d} p={p} />)}
                      </div>
                      <span className="mt-3 block text-[13.5px] font-semibold text-s-accent">View {c.more} matching {c.more === 1 ? "service" : "services"}</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : s ? (
            <>
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-s-bg-sunken">
                <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white text-s-ink-2 shadow-sm"><Heart size={16} /></span>
                <span className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-white" /><span className="h-1.5 w-1.5 rounded-full bg-white/55" /><span className="h-1.5 w-1.5 rounded-full bg-white/55" /></span>
              </div>
              <div className="flex items-start justify-between gap-2 pt-2.5">
                <p className="truncate font-heading text-[18px] font-bold text-s-ink">{s.name}</p>
                <span className="flex shrink-0 items-center gap-1 text-[14px] font-semibold text-s-ink"><Star size={14} className="fill-s-star text-s-star" strokeWidth={0} /> {s.rating}</span>
              </div>
              <p className="mt-0.5 truncate text-[13px] text-s-ink-2">{s.dist}, {s.addr}</p>
              <p className="truncate text-[13px] text-s-ink-2">{s.cat}, {s.count} reviews</p>
              <p className="mt-2 flex items-center gap-1.5 text-[13px] text-s-ink-2"><Clock size={14} /> {s.hours}</p>

              {isFull && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {AMENITIES.map(([label, Icon]) => (
                    <span key={label} className="inline-flex items-center gap-1 rounded-full bg-s-bg-sunken px-2.5 py-1 text-[12px] font-medium text-s-ink-2"><Icon size={12} /> {label}</span>
                  ))}
                </div>
              )}

              <p className="mb-2 mt-4 text-[13px] font-semibold text-s-ink">Services</p>
              <div className="space-y-1.5">
                {s.services.slice(0, isFull ? 5 : 3).map(([n, d, p]) => <ServiceRow key={n} n={n} d={d} p={p} />)}
              </div>

              {isFull && (
                <div className="mt-4 rounded-2xl border border-s-border p-3.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-semibold text-s-ink">{s.review.who}</span>
                    <span className="flex items-center gap-1 text-[12.5px] text-s-ink-2"><Star size={12} className="fill-s-star text-s-star" strokeWidth={0} /> {s.review.stars}</span>
                  </div>
                  <p className="mt-1 text-[13px] leading-snug text-s-ink-2">{s.review.text}</p>
                </div>
              )}

              <span className="mt-3 block text-[13.5px] font-semibold text-s-accent">View store</span>
              {!isFull && <p className="mt-2 text-center text-[12px] text-s-ink-2">Drag up for more. Drag down for all salons.</p>}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function MapBehaviorMockup() {
  if (process.env.NODE_ENV === "production") notFound();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <main className="min-h-screen bg-s-bg-sunken py-4">
      <div className="mx-auto w-full max-w-[390px] px-3">
        <p className="pb-2 text-center text-[12.5px] font-semibold text-s-ink-2">Tap a pin or a card. Drag the sheet up for full, down for all salons.</p>
        <Screen />
      </div>
    </main>
  );
}
