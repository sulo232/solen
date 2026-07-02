"use client";

/**
 * /dev/filter-menus , A1 FilterSheet redesign (owner 2026-07-02: "the filter menus look ass, renew").
 * English (mockup rule). Council Direction A: CONTROL-LANGUAGE-PER-FILTER-TYPE , stop rendering every
 * section as the same gray chip bag; match the control to the selection model:
 *   Sort        -> segmented track (single-select, unchanged)
 *   Availability-> Switch rows (independent toggles)
 *   Rating      -> single-row segmented (4.5/4.0/3.5/3.0/Any); "Any" = no segment (kills the extra chip)
 *   Price       -> slider + tick marks, tighter rhythm
 *   For whom    -> segmented track (single-select)
 *   Amenities   -> 2-col CHECKLIST rows (icon + label + checkbox), not a pill bag
 *   Deals       -> single inline Switch row (was heading + a chip repeating the heading)
 * Keeps the locked gray-sunken selected recipe, no focus rings, real tokens. Header/footer unchanged.
 * Exists-check: `npm run exists filter-menus` = 0; the REAL sheet = _components/search/FilterSheet.tsx
 * (this mockup proposes its new section anatomy; reuses TabPill/Switch/Checkbox grammar, no new tokens).
 * Grounded-in: FilterSheet.tsx sections + Sort's existing segmented track + Switch.tsx/Checkbox.tsx primitives.
 * Real tokens, Lucide, no CDN.
 */
import { useEffect, useState } from "react";
import { Star, Wifi, CreditCard, Car, Accessibility, Baby, Dog, X } from "lucide-react";
import { notFound } from "next/navigation";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-s-border py-4 last:border-b-0">
      <p className="mb-3 font-body text-[15px] font-semibold text-s-ink">{title}</p>
      {children}
    </div>
  );
}

// single-select segmented track (Sort / Rating / For-whom)
function Segmented({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-1 rounded-[14px] bg-s-bg-sunken p-1">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`flex-1 whitespace-nowrap rounded-[10px] px-2 py-2 text-[13.5px] font-medium transition-colors ${value === o ? "bg-white text-s-ink shadow-sm" : "text-s-ink-2"}`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function SwitchRow({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="flex w-full items-center justify-between py-2.5 text-left">
      <span className="text-[14px] text-s-ink">{label}</span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-s-ink" : "bg-s-border"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

function CheckRow({ label, Icon, on, onToggle }: { label: string; Icon: typeof Wifi; on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors ${on ? "bg-s-bg-sunken" : "bg-white"}`}>
      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-[6px] border ${on ? "border-s-ink bg-s-ink text-white" : "border-s-border bg-white"}`}>
        {on && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
      </span>
      <Icon size={16} className="shrink-0 text-s-ink-2" />
      <span className="truncate text-[13.5px] text-s-ink">{label}</span>
    </button>
  );
}

function Screen() {
  const [sort, setSort] = useState("Recommended");
  const [openNow, setOpenNow] = useState(false);
  const [soon, setSoon] = useState(false);
  const [rating, setRating] = useState("Any");
  const [price, setPrice] = useState(60);
  const [gender, setGender] = useState("All");
  const [deals, setDeals] = useState(false);
  const [am, setAm] = useState<Record<string, boolean>>({});
  const tog = (k: string) => setAm((s) => ({ ...s, [k]: !s[k] }));
  const AM: [string, typeof Wifi][] = [["Wi-Fi", Wifi], ["Card", CreditCard], ["Parking", Car], ["Accessible", Accessibility], ["Kids", Baby], ["Pets", Dog]];

  return (
    <div className="mx-auto flex h-[812px] w-full max-w-[400px] flex-col overflow-hidden rounded-[28px] border border-s-border bg-white shadow-[0_8px_40px_rgba(10,10,10,0.14)]">
      <div className="flex shrink-0 items-center justify-between border-b border-s-border px-4 py-3.5">
        <span className="grid h-9 w-9 place-items-center rounded-full border border-s-border bg-white text-s-ink"><X size={16} /></span>
        <p className="font-heading text-[16px] font-bold text-s-ink">Filters</p>
        <button className="text-[13.5px] font-semibold text-s-accent">Reset</button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Section title="Sort">
          <Segmented options={["Recommended", "Soonest", "Price", "Distance"]} value={sort} onChange={setSort} />
        </Section>
        <Section title="Availability">
          <SwitchRow label="Open now" on={openNow} onToggle={() => setOpenNow((v) => !v)} />
          <SwitchRow label="Free in the next 48h" on={soon} onToggle={() => setSoon((v) => !v)} />
        </Section>
        <Section title="Rating">
          <Segmented options={["4.5", "4.0", "3.5", "3.0", "Any"]} value={rating} onChange={setRating} />
          <p className="mt-1.5 flex items-center gap-1 text-[12px] text-s-ink-3"><Star size={11} className="fill-s-star text-s-star" strokeWidth={0} /> and up</p>
        </Section>
        <Section title="Price">
          <div className="flex items-center justify-between text-[13px]"><span className="text-s-ink-2">up to</span><span className="font-semibold text-s-ink">CHF {price}</span></div>
          <input type="range" min={20} max={300} step={10} value={price} onChange={(e) => setPrice(Number(e.target.value))} className="mt-2 w-full accent-s-ink" />
          <div className="mt-1 flex justify-between text-[12px] text-s-ink-3"><span>CHF 20</span><span>CHF 300+</span></div>
        </Section>
        <Section title="For whom">
          <Segmented options={["All", "Women", "Men", "Non-binary"]} value={gender} onChange={setGender} />
        </Section>
        <Section title="Amenities">
          <div className="grid grid-cols-2 gap-1.5">
            {AM.map(([label, Icon]) => <CheckRow key={label} label={label} Icon={Icon} on={!!am[label]} onToggle={() => tog(label)} />)}
          </div>
        </Section>
        <Section title="Deals">
          <SwitchRow label="Deals only" on={deals} onToggle={() => setDeals((v) => !v)} />
        </Section>
      </div>

      <div className="flex shrink-0 gap-3 border-t border-s-border px-4 py-3">
        <button className="flex-1 rounded-pill border border-s-border bg-white py-3 text-[15px] font-semibold text-s-ink">Reset</button>
        <button className="flex-[2] rounded-pill bg-s-ink py-3 text-[15px] font-bold text-white" /* selected-ok: primary commit */>Show results</button>
      </div>
    </div>
  );
}

export default function FilterMenusMockup() {
  if (process.env.NODE_ENV === "production") notFound();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <main className="min-h-screen bg-s-bg-sunken py-4">
      <div className="mx-auto w-full max-w-[400px] px-3">
        <p className="pb-3 text-center text-[12.5px] font-semibold text-s-ink-3">A1 , filter menus: one control language per filter type (not all gray chip bags). Segmented = pick one, Switch = toggle, Checklist = pick many.</p>
        <Screen />
      </div>
    </main>
  );
}
