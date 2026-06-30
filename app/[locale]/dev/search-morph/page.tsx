"use client";

// exists-check: net-new dev PREVIEW route (no match in `npm run exists search-morph`). Sibling to the
// other app/[locale]/dev/* preview pages. Mirrors the REAL Airbnb mobile search (captured live 2026-06-30:
// full-screen grey surface, X top-right, active card = big bold title + content, collapsed steps = label
// LEFT / value RIGHT cards, suggestion rows = icon tile + name + subtitle, bottom = Reset + commit button)
// translated to OUR tokens + data (services / cities / recents). In-place top-anchored morph + blur backdrop.
// Preview only, not linked in nav, does not touch the live homepage SearchBar. Owner: "make it like Airbnb".

import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, MapPin, Navigation, X, Scissors, Leaf, Gem, type LucideIcon,
} from "lucide-react";

const EASE = [0.32, 0.72, 0, 1] as const;

type Suggest = { name: string; sub: string; Icon: LucideIcon; tint?: boolean };
const SERVICE_SUGGEST: Suggest[] = [
  { name: "In der Nähe", sub: "Salons um dich herum", Icon: Navigation, tint: true },
  { name: "Coiffeur", sub: "Haarschnitt und Styling", Icon: Scissors },
  { name: "Barbershop", sub: "Bart und Fade", Icon: Scissors },
  { name: "Nails", sub: "Maniküre und Pediküre", Icon: Gem },
  { name: "Spa und Wellness", sub: "Massage und Treatments", Icon: Leaf },
];
const RECENTS = ["Coiffeur", "Nails", "Massage Bern"];
const CITY_SUGGEST: Suggest[] = [
  { name: "In der Nähe", sub: "Aktueller Standort", Icon: Navigation, tint: true },
  ...["Basel", "Zürich", "Bern", "Lausanne", "Genf", "Luzern", "St. Gallen", "Winterthur"].map(
    (c): Suggest => ({ name: c, sub: "Schweiz", Icon: MapPin }),
  ),
];
const DATES = ["Heute", "Morgen", "Diese Woche", "Wochenende", "Flexibel"];
const WEEKDAYS = ["S", "M", "D", "M", "D", "F", "S"];

type Step = "service" | "location" | "date";

function monthGrid(d: Date) {
  const y = d.getFullYear(), m = d.getMonth();
  const first = new Date(y, m, 1).getDay();
  const total = new Date(y, m + 1, 0).getDate();
  const cells: (number | null)[] = Array.from({ length: first }, () => null);
  for (let i = 1; i <= total; i++) cells.push(i);
  return cells;
}

export default function SearchMorphPreviewPage() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("service");
  const [service, setService] = useState("");
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");

  const now = new Date();
  const monthName = now.toLocaleDateString("de-CH", { month: "long", year: "numeric" });
  const cells = monthGrid(now);
  const [selDay, setSelDay] = useState<number | null>(null);

  const advance = (s: Step) => {
    const order: Step[] = ["service", "location", "date"];
    const next = order[order.indexOf(s) + 1];
    if (next) setTimeout(() => setStep(next), 220);
  };
  const reset = () => { setService(""); setCity(""); setDate(""); setSelDay(null); setStep("service"); };

  return (
    <div className="min-h-screen bg-white">
      {/* page behind , gives the blur something to blur */}
      <div className="mx-auto max-w-[430px] px-5 pt-14">
        <div className="mb-8 flex items-center justify-between">
          <span className="font-heading text-[26px] font-extrabold tracking-[-0.02em] text-s-ink">Solen</span>
          <span className="grid h-11 w-11 place-items-center rounded-[14px] border border-s-border text-s-ink">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
          </span>
        </div>
        <p className="mb-1.5 text-[13px] font-medium text-s-ink-3">Beauty und Wellness in der ganzen Schweiz</p>
        <h1 className="mb-5 font-heading text-[27px] font-bold leading-tight tracking-[-0.02em] text-s-ink">Termine,<br />sofort bestätigt.</h1>
        <button type="button" onClick={() => setOpen(true)}
          className="flex w-full items-center gap-2.5 rounded-full border border-s-border bg-white px-5 py-4 text-[15px] text-s-ink-3 shadow-[0_8px_24px_rgba(10,10,10,0.10)]">
          <Search size={18} strokeWidth={2} /> Service, Stadt, Datum
        </button>
        <div className="mt-10">
          <h3 className="mb-3 font-heading text-[18px] font-bold text-s-ink">Für dich</h3>
          <div className="flex gap-3">
            {["Coiffeur", "Barber", "Nails"].map((c) => (
              <div key={c} className="flex h-24 flex-1 flex-col items-center justify-center gap-1.5 rounded-2xl border border-s-border text-[12px] text-s-ink-2">{c}</div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            key="surface"
            className="fixed inset-0 z-[60] flex flex-col bg-s-bg-sunken/80 backdrop-blur-2xl"
            style={{ transformOrigin: "top center" }}
            initial={{ opacity: 0, scale: 0.97, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -10 }}
            transition={{ duration: 0.42, ease: EASE }}
          >
            {/* X close , top-right on the grey surface (Airbnb) */}
            <div className="flex justify-end px-5 pt-[max(14px,env(safe-area-inset-top))]">
              <button onClick={() => setOpen(false)} aria-label="Schliessen"
                className="grid h-10 w-10 place-items-center rounded-full border border-s-border bg-white text-s-ink shadow-[0_2px_8px_rgba(10,10,10,0.08)]">
                <X size={18} strokeWidth={2.2} />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4 pt-2">
              {/* SERVICE */}
              {step === "service" ? (
                <ActiveCard title="Wonach suchst du?">
                  <input placeholder="Service, Salon oder Stylist:in"
                    className="mb-4 w-full rounded-[14px] border border-s-border bg-white px-4 py-3.5 text-[15px] text-s-ink placeholder:text-s-ink-3 focus:border-s-ink focus:shadow-none focus:outline-none"
                    onChange={(e) => setService(e.target.value)} />
                  {SERVICE_SUGGEST.map((s) => (
                    <SuggestRow key={s.name} {...s} onClick={() => { setService(s.name); advance("service"); }} />
                  ))}
                  <p className="mb-2 mt-4 text-[13px] font-semibold text-s-ink-3">Zuletzt gesucht</p>
                  <div className="flex flex-wrap gap-2">
                    {RECENTS.map((r) => (
                      <button key={r} onClick={() => { setService(r); advance("service"); }}
                        className="rounded-full border border-s-border bg-white px-4 py-2 text-[13px] text-s-ink-2 hover:bg-s-bg-sunken">{r}</button>
                    ))}
                  </div>
                </ActiveCard>
              ) : (
                <CollapsedCard label="Service" value={service} placeholder="Hinzufügen" onClick={() => setStep("service")} />
              )}

              {/* LOCATION */}
              {step === "location" ? (
                <ActiveCard title="Wo?">
                  <input placeholder="Stadt suchen"
                    className="mb-4 w-full rounded-[14px] border border-s-border bg-white px-4 py-3.5 text-[15px] text-s-ink placeholder:text-s-ink-3 focus:border-s-ink focus:shadow-none focus:outline-none"
                    onChange={(e) => setCity(e.target.value)} />
                  <div className="max-h-[42vh] overflow-y-auto">
                    {CITY_SUGGEST.map((s) => (
                      <SuggestRow key={s.name} {...s} onClick={() => { setCity(s.name); advance("location"); }} />
                    ))}
                  </div>
                </ActiveCard>
              ) : (
                <CollapsedCard label="Standort" value={city} placeholder="Hinzufügen" onClick={() => setStep("location")} />
              )}

              {/* DATE */}
              {step === "date" ? (
                <ActiveCard title="Wann?">
                  {/* Daten / Flexibel segmented toggle (Airbnb) */}
                  <div className="mb-5 flex rounded-full bg-s-bg-sunken p-1">
                    <span className="flex-1 rounded-full bg-white py-2 text-center text-[14px] font-semibold text-s-ink shadow-[0_2px_8px_rgba(10,10,10,0.08)]">Daten</span>
                    <span className="flex-1 py-2 text-center text-[14px] font-medium text-s-ink-3">Flexibel</span>
                  </div>
                  <p className="mb-3 font-heading text-[17px] font-bold capitalize text-s-ink">{monthName}</p>
                  <div className="mb-1 grid grid-cols-7 text-center text-[12px] font-medium text-s-ink-3">
                    {WEEKDAYS.map((w, i) => <span key={i}>{w}</span>)}
                  </div>
                  <div className="grid grid-cols-7 gap-y-1">
                    {cells.map((d, i) => (
                      <div key={i} className="flex justify-center py-0.5">
                        {d === null ? <span /> : (
                          <button onClick={() => { setSelDay(d); setDate(`${d}. ${monthName.split(" ")[0]}`); }}
                            className={`grid h-10 w-10 place-items-center rounded-full text-[14px] ${selDay === d ? "bg-s-accent font-bold text-white" : "text-s-ink hover:bg-s-bg-sunken"}`}>
                            {d}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {DATES.map((dd) => (
                      <button key={dd} onClick={() => { setDate(dd); setSelDay(null); }}
                        className={`rounded-full border px-4 py-2 text-[13px] transition-colors ${date === dd ? "border-s-border bg-s-bg-sunken font-semibold text-s-ink" : "border-s-border bg-white text-s-ink-2 hover:bg-s-bg-sunken"}`}>{dd}</button>
                    ))}
                  </div>
                </ActiveCard>
              ) : (
                <CollapsedCard label="Datum" value={date} placeholder="Jederzeit" onClick={() => setStep("date")} />
              )}
            </div>

            {/* bottom bar , Reset + commit button (Airbnb), NOT a full-width footer */}
            <div className="flex items-center justify-between border-t border-s-border bg-s-bg-sunken/60 px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3">
              <button onClick={reset} className="text-[15px] font-semibold text-s-ink underline-offset-4 hover:underline">Zurücksetzen</button>
              {/* selected-ok: the ONE primary commit CTA, ink per the design contract (not a selected state) */}
              <button className="flex items-center gap-2 rounded-full bg-s-ink px-7 py-3.5 font-heading text-[15px] font-bold text-white active:scale-[0.98]">
                <Search size={17} strokeWidth={2.2} /> Suchen
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActiveCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <motion.div layout transition={{ duration: 0.42, ease: EASE }}
      className="rounded-[24px] bg-white px-6 pb-6 pt-6 shadow-[0_12px_36px_rgba(10,10,10,0.12)]">
      <h2 className="mb-5 font-heading text-[28px] font-bold leading-none tracking-[-0.02em] text-s-ink">{title}</h2>
      {children}
    </motion.div>
  );
}

function CollapsedCard({ label, value, placeholder, onClick }: {
  label: string; value: string; placeholder: string; onClick: () => void;
}) {
  return (
    <motion.button layout transition={{ duration: 0.42, ease: EASE }} onClick={onClick}
      className="flex w-full items-center justify-between rounded-[24px] border border-s-border bg-white px-6 py-5 text-left">
      <span className="text-[16px] text-s-ink-3">{label}</span>
      <span className={`text-[16px] font-semibold ${value ? "text-s-ink" : "text-s-ink-2"}`}>{value || placeholder}</span>
    </motion.button>
  );
}

function SuggestRow({ name, sub, Icon, tint, onClick }: Suggest & { onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-4 rounded-2xl py-2.5 pr-2 text-left hover:bg-s-bg-sunken">
      <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${tint ? "bg-s-accent/10 text-s-accent" : "bg-s-bg-sunken text-s-ink-2"}`}>
        <Icon size={22} strokeWidth={1.9} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[16px] font-semibold text-s-ink">{name}</span>
        <span className="block truncate text-[14px] text-s-ink-3">{sub}</span>
      </span>
    </button>
  );
}
