// exists-check: dev-only mockup route (notFound in prod), net-new. `npm run exists
// search-rich` -> 0. Three variations of a RICH in-overlay search-results state for a
// style/general query ("buzzcut"): Looks (Inspo) + Salons (with from-price) + Services.
// English copy only (mockups are always english). Real Tailwind tokens. The calendar /
// location steps of the real overlay are untouched; this only enriches the typing state.
"use client";

import { notFound } from "next/navigation";
import { Search, Star, Scissors, ChevronRight, ArrowRight, MapPin } from "lucide-react";

// Sample data grounded in the real suggest shape (services carry price, salons carry
// rating + area; Inspo carries photos + style tags). Not fabricated counts , placeholders.
const SALONS = [
  { name: "Cuts & Culture", rating: 4.8, area: "Grossbasel", from: 45, svc: "Coupe & Bart", price: 68 },
  { name: "Old Town Barbers", rating: 4.3, area: "Kleinbasel", from: 40, svc: "Herrenschnitt", price: 40 },
  { name: "Fade Room", rating: 4.9, area: "Gundeli", from: 38, svc: "Skin Fade", price: 45 },
];
const SERVICES = [
  { name: "Skin Fade", cat: "Barber", price: 45 },
  { name: "Coupe & Bart", cat: "Barber", price: 68 },
  { name: "Bart trimmen", cat: "Barber", price: 28 },
];

function SearchField() {
  return (
    <div className="mx-4 mt-3 flex items-center gap-3 rounded-[18px] bg-white px-4 py-3 shadow-[0_10px_40px_rgba(10,10,10,0.10)]">
      <Search size={19} strokeWidth={2} className="text-s-ink-3" />
      <span className="text-[15px] font-semibold text-s-ink">buzzcut</span>
      <span className="ml-auto h-4 w-px bg-s-border" />
      <span className="text-[13px] text-s-ink-3">Basel</span>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 mt-5 px-4 text-[12px] font-semibold text-s-ink-3">{children}</p>;
}

function LooksStrip() {
  return (
    <div className="flex gap-2 overflow-hidden px-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="grid h-24 w-20 shrink-0 place-items-center rounded-[14px] bg-s-bg-sunken text-s-ink-3">
          <Scissors size={20} strokeWidth={1.5} />
        </div>
      ))}
    </div>
  );
}

function Stars({ r }: { r: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-[12px] text-s-ink-2">
      <Star size={12} className="fill-s-star text-s-star" /> {r.toFixed(1)}
    </span>
  );
}

// Variant 1: sectioned list , Looks strip, then Salons (photo + rating + from-price), then Services.
function V1() {
  return (
    <div className="pb-6">
      <SearchField />
      <Label>Looks</Label>
      <LooksStrip />
      <Label>Salons</Label>
      <div className="px-4">
        {SALONS.map((s) => (
          <button key={s.name} className="flex w-full items-center gap-3 border-b border-s-border py-3 text-left">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[12px] bg-s-bg-sunken text-s-ink-3">
              <Scissors size={18} strokeWidth={1.5} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-semibold text-s-ink">{s.name}</span>
              <span className="flex items-center gap-2 text-[12px] text-s-ink-3">
                <Stars r={s.rating} /> <span>{s.area}</span>
              </span>
            </span>
            <span className="shrink-0 text-[13px] font-semibold text-s-ink">from CHF {s.from}</span>
            <ChevronRight size={16} className="shrink-0 text-s-ink-3" />
          </button>
        ))}
      </div>
      <Label>Services</Label>
      <div className="px-4">
        {SERVICES.map((s) => (
          <button key={s.name} className="flex w-full items-center gap-3 border-b border-s-border py-3 text-left">
            <Scissors size={18} strokeWidth={1.75} className="shrink-0 text-s-ink-2" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-semibold text-s-ink">{s.name}</span>
              <span className="text-[12px] text-s-ink-3">{s.cat}</span>
            </span>
            <span className="shrink-0 text-[13px] font-semibold text-s-ink">CHF {s.price}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Variant 2: salon-first rich cards , each salon shows its matching service + price inline.
function V2() {
  return (
    <div className="pb-6">
      <SearchField />
      <Label>Looks</Label>
      <LooksStrip />
      <Label>Salons that do buzzcut</Label>
      <div className="flex flex-col gap-3 px-4">
        {SALONS.map((s) => (
          <button key={s.name} className="flex items-stretch gap-3 rounded-card border border-s-border bg-white p-3 text-left shadow-[0_1px_3px_rgba(10,10,10,0.06)]">
            <span className="grid h-[70px] w-[70px] shrink-0 place-items-center rounded-[12px] bg-s-bg-sunken text-s-ink-3">
              <Scissors size={22} strokeWidth={1.5} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col justify-center">
              <span className="truncate text-[15px] font-semibold text-s-ink">{s.name}</span>
              <span className="mt-0.5 flex items-center gap-2 text-[12px] text-s-ink-3">
                <Stars r={s.rating} />
                <span className="inline-flex items-center gap-0.5"><MapPin size={11} /> {s.area}</span>
              </span>
              <span className="mt-1.5 text-[13px] text-s-ink-2">
                {s.svc} <span className="font-semibold text-s-ink">CHF {s.price}</span>
              </span>
            </span>
            <ArrowRight size={18} className="shrink-0 self-center text-s-ink" />
          </button>
        ))}
      </div>
    </div>
  );
}

// Variant 3: tabbed , All / Salons / Services / Looks. "All" blends the top of each.
function V3() {
  const tabs = ["All", "Salons", "Services", "Looks"];
  return (
    <div className="pb-6">
      <SearchField />
      <div className="mt-4 flex gap-2 overflow-hidden px-4">
        {tabs.map((t, i) => (
          <span
            key={t}
            className={
              i === 0
                ? "rounded-full border border-s-accent px-3.5 py-1.5 text-[13px] font-semibold text-s-accent"
                : "rounded-full bg-s-bg-sunken px-3.5 py-1.5 text-[13px] font-medium text-s-ink-2"
            }
          >
            {t}
          </span>
        ))}
      </div>
      <Label>Top salon</Label>
      <div className="px-4">
        <button className="flex w-full items-center gap-3 rounded-card border border-s-border bg-white p-3 text-left">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[12px] bg-s-bg-sunken text-s-ink-3">
            <Scissors size={18} strokeWidth={1.5} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-semibold text-s-ink">Fade Room</span>
            <span className="flex items-center gap-2 text-[12px] text-s-ink-3"><Stars r={4.9} /> <span>Gundeli</span></span>
          </span>
          <span className="text-[13px] font-semibold text-s-ink">from CHF 38</span>
        </button>
      </div>
      <Label>Services</Label>
      <div className="px-4">
        {SERVICES.slice(0, 2).map((s) => (
          <div key={s.name} className="flex items-center gap-3 border-b border-s-border py-2.5">
            <Scissors size={16} strokeWidth={1.75} className="text-s-ink-2" />
            <span className="flex-1 text-[14px] font-semibold text-s-ink">{s.name}</span>
            <span className="text-[13px] font-semibold text-s-ink">CHF {s.price}</span>
          </div>
        ))}
      </div>
      <Label>Looks</Label>
      <LooksStrip />
    </div>
  );
}

const VARIANTS: { key: string; label: string; note: string; el: React.ReactNode }[] = [
  { key: "1", label: "V1 , Sectioned", note: "Looks, then Salons (from-price), then Services. Scannable.", el: <V1 /> },
  { key: "2", label: "V2 , Salon-first cards", note: "Rich salon cards with the matching service + price inline.", el: <V2 /> },
  { key: "3", label: "V3 , Tabbed blend", note: "All / Salons / Services / Looks tabs. App-like.", el: <V3 /> },
];

export default function SearchRichVariantsPage() {
  if (process.env.NODE_ENV === "production") notFound(); // dev preview only

  return (
    <div className="min-h-screen bg-s-bg-sunken px-4 py-10">
      <div className="mx-auto max-w-[440px]">
        <h1 className="font-display text-[24px] font-bold tracking-[-0.02em] text-s-ink">Rich search , 3 variations</h1>
        <p className="font-body mt-2 text-[14px] text-s-ink-2">
          Typing "buzzcut" shows Looks + Salons (with prices) + Services inside the bar. My take: V1.
        </p>
        <div className="mt-8 flex flex-col gap-10">
          {VARIANTS.map((v) => (
            <div key={v.key}>
              <div className="mb-2">
                <div className="font-body text-[13px] font-semibold text-s-ink">{v.label}</div>
                <div className="font-body text-[12px] text-s-ink-3">{v.note}</div>
              </div>
              <div className="overflow-hidden rounded-[28px] border border-s-border bg-white pb-2">
                {v.el}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
