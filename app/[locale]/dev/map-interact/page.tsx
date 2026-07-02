"use client";

/**
 * /dev/map-interact , INTERACTIVE map-interaction mockup (owner 2026-07-02, BATCH 14). English (mockup rule).
 * Exists-check: `npm run exists popup` = only the checkout-confirm modal; map preview lives in /dev/map-extras
 *   (static preview card) + /dev/map-full (the approved map). REMOVED.md: Book button on the map preview +
 *   swipe-pager + bottom nav are graveyard'd (do NOT re-add). NET-NEW here = the INTERACTION: pin tap -> a
 *   floating store popup over the map; bottom-sheet card SINGLE tap -> locate the store's pin on the map;
 *   card DOUBLE tap -> open the store page.
 * Grounds pins + cards in the approved /dev/map-full (star+rating pin, gray-selected; borderless feed card).
 * Real tokens, Lucide, no CDN. Try it: tap a pin, then single- vs double-tap a card in the sheet.
 */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Search, Map as MapIcon, SlidersHorizontal, ChevronDown, Star, Heart, X, Clock } from "lucide-react";
import { notFound } from "next/navigation";

const FROST = "bg-white/95 backdrop-blur-xl border border-s-border shadow-[0_1px_2px_rgba(10,10,10,0.10),0_8px_24px_rgba(10,10,10,0.10)]";

// pin coords are within the 390-wide / map area; sheet peek starts at top-[440px] so all pins stay visible.
const STORES = [
  { name: "Supreme Style & Barber", rating: "4.9", count: "1'722", dist: "400 m", addr: "Kleinbasel", cat: "Barber", from: "35", when: "Available today", pin: { top: 250, left: 88 } },
  { name: "Lashere Beauty", rating: "5.0", count: "1'156", dist: "700 m", addr: "Kreis 5", cat: "Nails", from: "90", when: "Tomorrow", pin: { top: 288, left: 262 } },
  { name: "Zoltan Hair", rating: "5.0", count: "22", dist: "1.1 km", addr: "Nussgasse 3", cat: "Hair salon", from: "50", when: "Available today", pin: { top: 360, left: 150 } },
  { name: "Old Town Barbers", rating: "4.7", count: "88", dist: "2.4 km", addr: "Steinenvorstadt", cat: "Barber", from: "40", when: "Tomorrow", pin: { top: 300, left: 330 } },
];
type Store = (typeof STORES)[number];

function Pin({ s, selected, onClick }: { s: Store; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute flex -translate-x-1/2 flex-col items-center outline-none"
      style={{ top: s.pin.top, left: s.pin.left, zIndex: selected ? 6 : 2 }}
      aria-label={`${s.name}, rating ${s.rating}`}
    >
      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12.5px] font-semibold transition-transform duration-150 ${selected ? "border-s-border bg-s-bg-sunken text-s-ink scale-110 shadow-[0_2px_6px_rgba(10,10,10,0.16),0_10px_24px_rgba(10,10,10,0.14)]" : "border-s-border bg-white text-s-ink shadow-[0_1px_2px_rgba(10,10,10,0.12),0_4px_12px_rgba(10,10,10,0.10)]"}`}>
        <Star size={12} className="fill-s-star text-s-star" strokeWidth={0} /> {s.rating}
      </span>
      <span className={`-mt-1 h-2 w-2 rotate-45 border-b border-r border-s-border ${selected ? "bg-s-bg-sunken" : "bg-white"}`} />
    </button>
  );
}

// Floating store popup, appears over the map anchored ABOVE the selected pin (Google/Airbnb pattern).
// Tapping the body opens the store; the X dismisses. No Book button (owner-removed, mis-click risk).
function StorePopup({ s, onOpen, onClose }: { s: Store; onOpen: () => void; onClose: () => void }) {
  const H = 118; // approx popup height for anchoring above the pin
  const top = Math.max(66, s.pin.top - H - 14);
  const pointerLeft = Math.min(338, Math.max(16, s.pin.left - 12)); // popup starts at left:12
  return (
    <div className="absolute left-3 right-3 z-30" style={{ top }}>
      <div className={`relative overflow-hidden rounded-[18px] ${FROST}`}>
        <button type="button" onClick={onOpen} className="flex w-full gap-3 p-2.5 text-left active:opacity-90">
          <div className="h-[84px] w-[84px] shrink-0 rounded-2xl bg-s-bg-sunken" />
          <div className="min-w-0 flex-1 pt-0.5 pr-7">
            <p className="truncate font-heading text-[15px] font-bold text-s-ink">{s.name}</p>
            <p className="mt-0.5 flex items-center gap-1 text-[12.5px] text-s-ink-2">
              <Star size={13} className="fill-s-star text-s-star" strokeWidth={0} />
              <span className="font-semibold text-s-ink">{s.rating}</span>
              <span className="text-s-accent">({s.count})</span>
            </p>
            <p className="mt-0.5 truncate text-[12.5px] text-s-ink-2">{s.cat}, {s.dist}</p>
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <span className="text-[13px] font-semibold text-s-ink">from CHF {s.from}</span>
              <span className="flex items-center gap-1 rounded-full bg-s-bg-sunken px-2.5 py-1 text-[12px] font-medium text-s-ink-2"><Clock size={11} /> {s.when}</span>
            </div>
          </div>
        </button>
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full border border-s-border bg-white text-s-ink-2 active:scale-95">
          <X size={14} />
        </button>
      </div>
      {/* pointer down toward the pin */}
      <span className="absolute -bottom-1 h-3 w-3 rotate-45 border-b border-r border-s-border bg-white" style={{ left: pointerLeft }} />
    </div>
  );
}

// Sheet feed card , single tap locates on the map, double tap opens (owner spec). Compact so the sheet peek
// shows the interaction; grounded in the approved feed card (name + inline star + dist/addr + cat/reviews).
function SheetCard({ s, selected, onClick }: { s: Store; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full gap-3 rounded-2xl border p-2.5 text-left transition-colors duration-150 ${selected ? "border-s-border bg-s-bg-sunken" : "border-transparent bg-white active:bg-s-bg-sunken"}`}
    >
      <div className="relative h-[76px] w-[92px] shrink-0 overflow-hidden rounded-xl bg-s-bg-sunken">
        <span className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-white text-s-ink-2 shadow-sm"><Heart size={13} /></span>
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-heading text-[15px] font-bold text-s-ink">{s.name}</p>
          <span className="flex shrink-0 items-center gap-1 text-[13.5px] font-semibold text-s-ink"><Star size={13} className="fill-s-star text-s-star" strokeWidth={0} /> {s.rating}</span>
        </div>
        <p className="mt-0.5 truncate text-[12.5px] text-s-ink-2">{s.dist}, {s.addr}</p>
        <p className="truncate text-[12.5px] text-s-ink-2">{s.cat}, {s.count} reviews</p>
      </div>
    </button>
  );
}

function Screen() {
  const [selected, setSelected] = useState<number | null>(0);
  const [hint, setHint] = useState<string | null>("Tap a pin, or single vs double tap a card below");
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function flash(msg: string) {
    setHint(msg);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHint(null), 1900);
  }
  function locate(idx: number) { setSelected(idx); flash(`Showing ${STORES[idx].name} on the map`); }
  function open(idx: number) { setSelected(idx); flash(`Opening ${STORES[idx].name}...`); }

  // single vs double tap on a sheet card: wait a beat; a 2nd tap within the window = double (open).
  function onCardTap(idx: number) {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      open(idx);
    } else {
      clickTimer.current = setTimeout(() => {
        clickTimer.current = null;
        locate(idx);
      }, 240);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-white">
      <div className="relative mx-auto h-full min-h-[844px] w-full max-w-[390px] overflow-hidden bg-white">
        {/* map surface */}
        <div className="absolute inset-0 [background:repeating-linear-gradient(0deg,transparent,transparent_31px,rgba(10,10,10,0.04)_32px),repeating-linear-gradient(90deg,transparent,transparent_31px,rgba(10,10,10,0.04)_32px)]" />

        {/* search bar */}
        <div className="absolute inset-x-3 top-3 z-40">
          <div className={`flex items-center gap-1 rounded-full py-1.5 pl-1.5 pr-1.5 ${FROST}`}>
            <button className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-s-ink active:scale-95" aria-label="Back"><ArrowLeft size={21} strokeWidth={2.2} /></button>
            <Search size={18} strokeWidth={2} className="shrink-0 text-s-ink-2" />
            <div className="min-w-0 flex-1 pl-1">
              <p className="truncate text-[15px] font-bold leading-tight text-s-ink">Buzz cut</p>
              <p className="truncate text-[12.5px] leading-tight text-s-ink-2">Any time in Basel</p>
            </div>
            <button className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-s-border bg-white text-s-ink active:scale-95" aria-label="List view"><MapIcon size={19} strokeWidth={2} /></button>
          </div>
        </div>

        {/* pins */}
        {STORES.map((s, i) => (
          <Pin key={s.name} s={s} selected={selected === i} onClick={() => locate(i)} />
        ))}

        {/* floating popup for the selected store (pin tap OR card single tap) */}
        {selected !== null && (
          <StorePopup s={STORES[selected]} onOpen={() => open(selected)} onClose={() => setSelected(null)} />
        )}

        {/* transient action hint */}
        {hint && (
          <div className={`absolute left-1/2 top-[400px] z-40 -translate-x-1/2 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12.5px] font-medium text-s-ink ${FROST}`}>
            {hint}
          </div>
        )}

        {/* bottom sheet , peek showing chips + count + cards */}
        <div className="absolute inset-x-0 bottom-0 top-[440px] z-30 flex flex-col rounded-t-[24px] border-t border-s-border bg-white shadow-[0_-2px_8px_rgba(10,10,10,0.06),0_-16px_40px_rgba(10,10,10,0.12)]">
          <div className="flex shrink-0 justify-center pt-2.5"><span className="h-1 w-10 rounded-full bg-s-border" /></div>
          <div className="flex shrink-0 items-center gap-2 overflow-x-auto px-4 pb-2 pt-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-s-border" aria-label="Filters"><SlidersHorizontal size={15} className="text-s-ink" /></button>
            <button className="shrink-0 rounded-full border border-s-border px-3.5 py-2 text-[13px] font-medium text-s-ink">Open now</button>
            <button className="flex shrink-0 items-center gap-1 rounded-full border border-s-border px-3.5 py-2 text-[13px] font-medium text-s-ink">Price <ChevronDown size={14} className="text-s-ink-2" /></button>
            <button className="flex shrink-0 items-center gap-1 rounded-full border border-s-border px-3.5 py-2 text-[13px] font-medium text-s-ink">Rating <ChevronDown size={14} className="text-s-ink-2" /></button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <p className="pb-2 pt-1 text-center text-[13px] text-s-ink-2">19 salons in this area</p>
            <p className="pb-2 text-center text-[12px] text-s-ink-3">Single tap shows it on the map. Double tap opens the store.</p>
            <div className="space-y-1.5">
              {STORES.map((s, i) => (
                <SheetCard key={s.name} s={s} selected={selected === i} onClick={() => onCardTap(i)} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MapInteractMockup() {
  if (process.env.NODE_ENV === "production") notFound();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(<Screen />, document.body);
}
