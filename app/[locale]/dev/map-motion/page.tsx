"use client";

/**
 * /dev/map-motion , INTERACTIVE map MOTION + structure mockup (owner 2026-07-02, BATCH 18, council-designed).
 * English (mockup rule). Demonstrates, so the owner can FEEL + pick:
 *   - MOTION (A/B/C): framer-motion sheet (EASE [0.32,0.72,0,1]) , morph list<->salon (crossfade), smooth
 *     detent snap on release (finger-tracking 1:1 while dragging), salon entrance = crossfade + rise.
 *   - DRAG (G): drag the sheet from the whole HEADER area (handle + pills + count), not just the tiny handle.
 *   - OVERLAP (D): sticky pills+count header on a solid white bg + a 1px hairline (no shadow); list scrolls under cleanly.
 *   - BAR (E): ONE frosted pill = back-arrow + search + query/city + list toggle (merges the 2 separate boxes).
 *   - CLUSTER (F): toggle 3 designs (V1 white "N Salons" pill / V2 gray disc / V3 stacked cards) , pick one, NOT black.
 *   - LIVE LIST (H): "Search this area" frosted button appears on pan (demo: toggled by a dev control).
 * Exists-check: `npm run exists map-motion` = 0; real map = SearchTemplate map overlay + MapView.
 * Grounded-in: /dev/map-behavior (approved sheet behavior + verbatim borderless card + salon detail) + /dev/map-full
 *   (star+rating gray-selected pin, feed card) + SearchOverlay motion (motion/react, EASE, crossfade) + the council.
 * Real tokens, Lucide, no CDN.
 */
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ArrowLeft, Search, Map as MapIcon, Star, Heart, ChevronLeft, Layers } from "lucide-react";
import { notFound } from "next/navigation";

const FROST = "bg-white/95 backdrop-blur-xl border border-s-border shadow-[0_1px_2px_rgba(10,10,10,0.10),0_8px_24px_rgba(10,10,10,0.10)]";
const EASE = [0.32, 0.72, 0, 1] as const;

const LIST_DETENTS = [150, 400, 560];
const SALON_DETENTS = [96, 340];
const SALON_MEDIUM = 340;
const nearest = (arr: number[], v: number) => arr.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));

const SALONS = [
  { name: "Supreme Style & Barber", rating: "4.9", count: "1'722", dist: "400 m", addr: "Kleinbasel, Basel", cat: "Barber", more: 2, deals: false,
    services: [["Fade & Classic Men Haircut", "45 min", "from CHF 60"], ["One Grade All Over", "30 min", "CHF 35"], ["Beard Trim & Line Up", "20 min", "CHF 25"], ["Hot Towel Shave", "30 min", "CHF 40"], ["Kids Cut", "20 min", "CHF 30"]],
    pin: { top: 250, left: 88 } },
  { name: "Lashere Beauty", rating: "5.0", count: "1'156", dist: "700 m", addr: "Kreis 5, Basel", cat: "Nails", more: 1, deals: true,
    services: [["Brow lifting + Keratin", "30 min", "CHF 90"], ["Gel Manicure", "45 min", "CHF 65"], ["Classic Pedicure", "50 min", "CHF 70"]],
    pin: { top: 288, left: 262 } },
  { name: "Zoltan Hair", rating: "5.0", count: "22", dist: "1.1 km", addr: "Nussgasse 3, Basel", cat: "Hair salon", more: 53, deals: false,
    services: [["Buzz Cut", "20 min", "CHF 50"], ["Shampoo, Cut & Style S", "45 min", "CHF 100"], ["Hair Treatment L", "10 min", "CHF 35"]],
    pin: { top: 360, left: 150 } },
];
type Salon = (typeof SALONS)[number];

function ServiceRow({ n, d, p }: { n: string; d: string; p: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-s-bg-sunken px-3.5 py-2.5 text-[13.5px]">
      <span className="min-w-0"><span className="block truncate text-s-ink">{n}</span><span className="text-[12px] text-s-ink-3">{d}</span></span>
      <span className="shrink-0 font-semibold tabular-nums text-s-ink">{p}</span>
    </div>
  );
}

// APPROVED borderless feed card, copied verbatim from /dev/map-full StoreCard (NOT re-invented).
function FeedCard({ s, onClick }: { s: Salon; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full text-left active:opacity-90">
      <div className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl bg-s-bg-sunken">
        {s.deals && <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-[12px] font-semibold text-s-ink shadow-sm">Deals</span>}
        <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white text-s-ink-2 shadow-sm"><Heart size={16} /></span>
        <span className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-white" /><span className="h-1.5 w-1.5 rounded-full bg-white/55" /><span className="h-1.5 w-1.5 rounded-full bg-white/55" /></span>
      </div>
      <div className="pt-2.5">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-heading text-[16px] font-bold text-s-ink">{s.name}</p>
          <span className="flex shrink-0 items-center gap-1 text-[14px] font-semibold text-s-ink"><Star size={14} className="fill-s-star text-s-star" strokeWidth={0} /> {s.rating}</span>
        </div>
        <p className="mt-0.5 truncate text-[13px] text-s-ink-2">{s.dist}, {s.addr}</p>
        <p className="truncate text-[13px] text-s-ink-2">{s.cat}, {s.count} reviews</p>
        <div className="mt-2.5 space-y-1.5">{s.services.slice(0, 3).map(([n, d, p]) => <ServiceRow key={n} n={n} d={d} p={p} />)}</div>
        <span className="mt-3 block text-[13.5px] font-semibold text-s-accent">View {s.more} matching {s.more === 1 ? "service" : "services"}</span>
      </div>
    </button>
  );
}

function SalonDetail({ s, full }: { s: Salon; full: boolean }) {
  return (
    <>
      <div className="relative w-full overflow-hidden rounded-2xl bg-s-bg-sunken aspect-[16/10]">
        <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white text-s-ink-2 shadow-sm"><Heart size={16} /></span>
        <span className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-white" /><span className="h-1.5 w-1.5 rounded-full bg-white/55" /><span className="h-1.5 w-1.5 rounded-full bg-white/55" /></span>
      </div>
      <div className="flex items-start justify-between gap-2 pt-2.5">
        <p className="truncate font-heading text-[18px] font-bold text-s-ink">{s.name}</p>
        <span className="flex shrink-0 items-center gap-1 text-[14px] font-semibold text-s-ink"><Star size={14} className="fill-s-star text-s-star" strokeWidth={0} /> {s.rating}</span>
      </div>
      <p className="mt-0.5 truncate text-[13px] text-s-ink-2">{s.dist}, {s.addr}</p>
      <p className="truncate text-[13px] text-s-ink-2">{s.cat}, {s.count} reviews</p>
      <p className="mb-2 mt-4 text-[13px] font-semibold text-s-ink">Services</p>
      <div className="space-y-1.5">{s.services.slice(0, full ? 5 : 3).map(([n, d, p]) => <ServiceRow key={n} n={n} d={d} p={p} />)}</div>
      <span className="mt-3 block text-[13.5px] font-semibold text-s-accent">View store</span>
    </>
  );
}

// three cluster designs to pick (F). All avoid the plain-black disc.
function Cluster({ variant }: { variant: 1 | 2 | 3 }) {
  const base = "absolute -translate-x-1/2 -translate-y-1/2";
  if (variant === 1)
    return <span className={`${base} inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-s-ink bg-white px-3 py-1 text-[13px] font-bold text-s-ink shadow-[0_1px_2px_rgba(10,10,10,0.12),0_4px_12px_rgba(10,10,10,0.10)]`} style={{ top: 205, left: 300 }}>5 salons</span>;
  if (variant === 2)
    return <span className={`${base} grid h-9 w-9 place-items-center rounded-full border border-s-border bg-s-bg-sunken text-[13px] font-bold text-s-ink shadow-[0_1px_2px_rgba(10,10,10,0.12),0_4px_12px_rgba(10,10,10,0.10)]`} style={{ top: 205, left: 300 }}>5</span>;
  return (
    <span className={`${base}`} style={{ top: 205, left: 300 }}>
      <span className="absolute -right-1 -top-1 h-full w-full rotate-6 rounded-xl border border-s-border bg-white" />
      <span className="relative grid h-9 w-11 place-items-center rounded-xl border border-s-border bg-white text-[13px] font-bold text-s-ink shadow-[0_1px_2px_rgba(10,10,10,0.12),0_4px_12px_rgba(10,10,10,0.10)]">5</span>
    </span>
  );
}

function Screen({ cluster, showArea }: { cluster: 1 | 2 | 3; showArea: boolean }) {
  const reduce = useReducedMotion();
  const [mode, setMode] = useState<"list" | "salon">("list");
  const [top, setTop] = useState(400);
  const [sel, setSel] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ startY: number; startTop: number } | null>(null);

  const sheetT = dragging || reduce ? { duration: 0 } : { type: "tween" as const, ease: EASE, duration: 0.32 };
  const fade = reduce ? { duration: 0 } : { duration: 0.24, ease: EASE };

  function focus(i: number) { setSel(i); setMode("salon"); setTop(SALON_MEDIUM); }
  function back() { setMode("list"); setSel(null); setTop(400); }

  function onDown(e: React.PointerEvent) { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); drag.current = { startY: e.clientY, startTop: top }; setDragging(true); }
  function onMove(e: React.PointerEvent) { if (!drag.current) return; setTop(Math.min(660, Math.max(96, drag.current.startTop + (e.clientY - drag.current.startY)))); }
  function onUp() {
    if (!drag.current) return;
    const released = top; drag.current = null; setDragging(false);
    if (mode === "salon") { if (released > SALON_MEDIUM + 70) back(); else setTop(nearest(SALON_DETENTS, released)); }
    else setTop(nearest(LIST_DETENTS, released));
  }

  const s = sel !== null ? SALONS[sel] : null;
  const full = mode === "salon" && top < 220;

  return (
    <div className="relative h-[812px] w-full overflow-hidden rounded-[28px] border border-s-border bg-white shadow-[0_8px_40px_rgba(10,10,10,0.14)]">
      <div className="absolute inset-0 [background:repeating-linear-gradient(0deg,transparent,transparent_31px,rgba(10,10,10,0.04)_32px),repeating-linear-gradient(90deg,transparent,transparent_31px,rgba(10,10,10,0.04)_32px)]" />

      {/* UNIFIED bar (E): ONE frosted pill , back + search + query/city + list toggle. */}
      <div className="absolute inset-x-3 top-3 z-40">
        <div className={`flex items-center gap-1 rounded-full py-1.5 pl-1.5 pr-1.5 ${FROST}`}>
          <button className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-s-ink active:scale-95" aria-label="Back"><ArrowLeft size={21} strokeWidth={2.2} /></button>
          <span className="h-6 w-px shrink-0 bg-s-border" aria-hidden />
          <Search size={18} strokeWidth={2} className="ml-1 shrink-0 text-s-ink-2" />
          <div className="min-w-0 flex-1 pl-1">
            <p className="truncate text-[15px] font-bold leading-tight text-s-ink">Buzz cut</p>
            <p className="truncate text-[12.5px] leading-tight text-s-ink-2">Any time in Basel</p>
          </div>
          <button className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-s-border bg-white text-s-ink active:scale-95" aria-label="List view"><MapIcon size={19} strokeWidth={2} /></button>
        </div>
      </div>

      {/* pins (star+rating, gray-selected) + the chosen cluster design */}
      {SALONS.map((p, i) => (
        <button key={i} onClick={() => focus(i)} className="absolute flex -translate-x-1/2 flex-col items-center" style={{ top: p.pin.top, left: p.pin.left, zIndex: sel === i ? 6 : 2 }} aria-label={`${p.name}, ${p.rating}`}>
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12.5px] font-semibold transition-transform ${sel === i ? "border-s-border bg-s-bg-sunken text-s-ink scale-110 shadow-[0_2px_6px_rgba(10,10,10,0.16),0_10px_24px_rgba(10,10,10,0.14)]" : "border-s-border bg-white text-s-ink shadow-[0_1px_2px_rgba(10,10,10,0.12),0_4px_12px_rgba(10,10,10,0.10)]"}`}>
            <Star size={12} className="fill-s-star text-s-star" strokeWidth={0} /> {p.rating}
          </span>
          <span className={`-mt-1 h-2 w-2 rotate-45 border-b border-r border-s-border ${sel === i ? "bg-s-bg-sunken" : "bg-white"}`} />
        </button>
      ))}
      <Cluster variant={cluster} />

      {/* LIVE-LIST (H): "Search this area" appears on pan */}
      {showArea && (
        <button className={`absolute left-1/2 top-[86px] z-30 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold text-s-ink ${FROST}`}>
          <Search size={14} strokeWidth={2.4} /> Search this area
        </button>
      )}

      {/* the ONE sheet, framer-motion top + morph */}
      <motion.div
        className="absolute inset-x-0 bottom-0 z-30 flex flex-col rounded-t-[24px] border-t border-s-border bg-white shadow-[0_-2px_8px_rgba(10,10,10,0.06),0_-16px_40px_rgba(10,10,10,0.12)]"
        style={{ top: 0 }}
        animate={{ top }}
        transition={sheetT}
      >
        {/* DRAG REGION (G): handle + (list: sticky pills+count) all draggable */}
        <div onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} className="shrink-0 cursor-grab touch-none active:cursor-grabbing">
          <div className="flex items-center justify-between px-4 pb-1 pt-3">
            {mode === "salon"
              ? <button onClick={back} onPointerDown={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 rounded-full border border-s-border bg-white px-3 py-1.5 text-[12.5px] font-medium text-s-ink active:scale-95"><ChevronLeft size={15} strokeWidth={2.2} /> All salons</button>
              : <span className="w-[92px]" />}
            <span className="h-1 w-10 rounded-full bg-s-border" />
            <span className="w-[92px]" />
          </div>
          {/* OVERLAP FIX (D): sticky pills + count on solid white + hairline (list mode only) */}
          {mode === "list" && (
            <div className="bg-white">
              <div className="flex items-center gap-2 overflow-x-auto px-4 pb-2 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {["Sort", "Open now", "Price", "For whom"].map((c) => (
                  <button key={c} className="shrink-0 rounded-full border border-s-border px-3.5 py-2 text-[13px] font-medium text-s-ink">{c}</button>
                ))}
              </div>
              <p className="px-4 pb-2 text-[12.5px] text-s-ink-2"><span className="font-semibold text-s-ink">8</span> salons in this area</p>
              <div className="h-px bg-s-border" aria-hidden />
            </div>
          )}
        </div>

        {/* SCROLL REGION , morphs list <-> salon */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <AnimatePresence mode="wait" initial={false}>
            {mode === "salon" && s ? (
              <motion.div key="salon" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={fade}>
                <SalonDetail s={s} full={full} />
              </motion.div>
            ) : (
              <motion.div key="list" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={fade} className="space-y-6">
                {SALONS.map((c, i) => <FeedCard key={c.name} s={c} onClick={() => focus(i)} />)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

export default function MapMotionMockup() {
  if (process.env.NODE_ENV === "production") notFound();
  const [mounted, setMounted] = useState(false);
  const [cluster, setCluster] = useState<1 | 2 | 3>(1);
  const [showArea, setShowArea] = useState(true);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <main className="min-h-screen bg-s-bg-sunken py-4">
      <div className="mx-auto w-full max-w-[390px] px-3">
        <p className="pb-2 text-center text-[12.5px] font-semibold text-s-ink-3">Tap a pin or card. Drag the sheet from the handle OR the pills. Motion is framer-motion.</p>
        <div className="mb-3 flex items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-s-ink-2"><Layers size={13} /> Cluster:</span>
          {[1, 2, 3].map((n) => (
            <button key={n} onClick={() => setCluster(n as 1 | 2 | 3)} className={`rounded-full border px-3 py-1 text-[12.5px] font-semibold ${cluster === n ? "border-transparent bg-s-bg-sunken text-s-ink" : "border-s-border bg-white text-s-ink-2"}`}>{n}</button>
          ))}
          <button onClick={() => setShowArea((v) => !v)} className={`ml-2 rounded-full border px-3 py-1 text-[12.5px] font-semibold ${showArea ? "border-transparent bg-s-bg-sunken text-s-ink" : "border-s-border bg-white text-s-ink-2"}`}>Area btn</button>
        </div>
        <Screen cluster={cluster} showArea={showArea} />
        <p className="px-1 pt-3 text-center text-[12.5px] text-s-ink-2">Cluster: 1 = white "N salons" pill, 2 = gray disc, 3 = stacked cards. Pick one.</p>
      </div>
    </main>
  );
}
