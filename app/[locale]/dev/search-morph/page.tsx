"use client";

// exists-check: net-new dev PREVIEW route (no match in `npm run exists search-morph`). Mirrors the REAL
// Airbnb mobile search (captured live 2026-06-30: Recent searches row + Suggested rows, big-title active
// card, collapsed label/value cards, multi-month calendar with past days struck, Reset + commit) with OUR
// tokens. USES THE EXISTING DATA , imports CATEGORIES (searchCategories.ts), SEARCH_CITIES (lib/cities.ts),
// TRENDING (searchTrending.ts); does NOT re-declare it. White cards FLOAT on a frosted-blur backdrop.
// Preview only, not linked in nav, does not touch the live homepage SearchBar.

import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, MapPin, Navigation, X, Clock, type LucideIcon } from "lucide-react";
import { CATEGORIES } from "@/app/[locale]/_components/homepage/searchCategories";
import { SEARCH_CITIES } from "@/lib/cities";
import { TRENDING } from "@/app/[locale]/_components/homepage/searchTrending";

const EASE = [0.32, 0.72, 0, 1] as const;
const FLEX_DATES = ["Heute", "Morgen", "Diese Woche", "Wochenende", "Flexibel"];
const WEEKDAYS = ["M", "D", "M", "D", "F", "S", "S"]; // Monday-first (de-CH)

type Step = "service" | "location" | "date";

// sample recent searches , built from the REAL constants (the live port wires useRecentSearches)
const RECENTS = [
  { svc: CATEGORIES[0].label, city: SEARCH_CITIES[0], when: FLEX_DATES[1] },
  { svc: CATEGORIES[1].label, city: SEARCH_CITIES[1], when: FLEX_DATES[2] },
];

function monthGrid(d: Date) {
  const y = d.getFullYear(), m = d.getMonth();
  const first = (new Date(y, m, 1).getDay() + 6) % 7;
  const total = new Date(y, m + 1, 0).getDate();
  const cells: (number | null)[] = Array.from({ length: first }, () => null);
  for (let i = 1; i <= total; i++) cells.push(i);
  return cells;
}

export default function SearchMorphPreviewPage() {
  if (process.env.NODE_ENV === "production") return null; // dev preview only , not public
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("service");
  const [service, setService] = useState("");
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const [serviceQ, setServiceQ] = useState("");
  const [cityQ, setCityQ] = useState("");
  const [dateTab, setDateTab] = useState<"daten" | "flexibel">("daten");
  const [selKey, setSelKey] = useState<string | null>(null);

  const now = new Date();
  const months = [now, new Date(now.getFullYear(), now.getMonth() + 1, 1)];

  const cats = CATEGORIES.filter((c) => c.label.toLowerCase().includes(serviceQ.toLowerCase()));
  const cities = SEARCH_CITIES.filter((c) => c.toLowerCase().includes(cityQ.toLowerCase()));

  const advance = (s: Step) => {
    const order: Step[] = ["service", "location", "date"];
    const next = order[order.indexOf(s) + 1];
    if (next) setTimeout(() => setStep(next), 220);
  };
  const close = () => { setOpen(false); setStep("service"); };
  const reset = () => { setService(""); setCity(""); setDate(""); setServiceQ(""); setCityQ(""); setSelKey(null); setStep("service"); };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-[430px] px-5 pt-14">
        <div className="mb-8 flex items-center justify-between">
          <span className="font-heading text-[24px] font-extrabold tracking-[-0.02em] text-s-ink">Solen</span>
          <span className="grid h-11 w-11 place-items-center rounded-[14px] border border-s-border text-s-ink">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
          </span>
        </div>
        <p className="mb-1.5 text-[13px] font-medium text-s-ink-3">Beauty und Wellness in der ganzen Schweiz</p>
        <h1 className="mb-5 font-heading text-[24px] font-bold leading-tight tracking-[-0.02em] text-s-ink">Termine, sofort bestätigt.</h1>
        <button type="button" onClick={() => setOpen(true)}
          className="flex w-full items-center gap-2.5 rounded-full border border-s-border bg-white px-5 py-3.5 text-[15px] text-s-ink-3 shadow-[0_8px_24px_rgba(10,10,10,0.10)]">
          <Search size={18} strokeWidth={2} /> Service, Stadt, Datum
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            key="surface"
            className="fixed inset-0 z-[60] flex flex-col bg-s-bg-sunken/55 backdrop-blur-2xl"
            style={{ transformOrigin: "top center" }}
            initial={{ opacity: 0, scale: 0.98, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -8 }}
            transition={{ duration: 0.42, ease: EASE }}
          >
            <div className="flex justify-end px-5 pt-[max(14px,env(safe-area-inset-top))]">
              <button onClick={close} aria-label="Schliessen"
                className="grid h-9 w-9 place-items-center rounded-full border border-s-border bg-white text-s-ink shadow-[0_2px_8px_rgba(10,10,10,0.08)]">
                <X size={17} strokeWidth={2.2} />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4 pt-1">
              {/* SERVICE , Recent searches + Suggested (Airbnb structure), all real data */}
              {step === "service" ? (
                <ActiveCard title="Wonach suchst du?">
                  <input value={serviceQ} onChange={(e) => setServiceQ(e.target.value)} placeholder="Service, Salon oder Stylist:in"
                    className="mb-3 w-full rounded-[14px] border border-s-border bg-white px-4 py-3 text-[15px] text-s-ink placeholder:text-s-ink-3 focus:border-s-ink focus:shadow-none focus:outline-none" />
                  {serviceQ === "" && (
                    <>
                      <p className="mb-1 text-[13px] font-semibold text-s-ink-3">Zuletzt gesucht</p>
                      {RECENTS.map((r) => (
                        <SuggestRow key={r.svc} name={`${r.svc} in ${r.city}`} sub={r.when} Icon={Clock}
                          onClick={() => { setService(r.svc); setCity(r.city); setDate(r.when); setStep("date"); }} />
                      ))}
                      <p className="mb-1 mt-3 text-[13px] font-semibold text-s-ink-3">Vorschläge</p>
                    </>
                  )}
                  <SuggestRow name="In der Nähe" sub="Aktueller Standort" Icon={Navigation} tint onClick={() => { setService("In der Nähe"); advance("service"); }} />
                  {cats.map((c) => (
                    <SuggestRow key={c.label} name={c.label} sub={c.count} Icon={c.icon}
                      onClick={() => { setService(c.label); setServiceQ(""); advance("service"); }} />
                  ))}
                  {serviceQ === "" && (
                    <>
                      <p className="mb-2 mt-3 text-[13px] font-semibold text-s-ink-3">Im Trend</p>
                      <div className="flex flex-wrap gap-2">
                        {TRENDING.map((t) => (
                          <button key={t.query} onClick={() => { setService(t.label); advance("service"); }}
                            className="rounded-full border border-s-border bg-white px-3.5 py-1.5 text-[13px] text-s-ink-2 hover:bg-s-bg-sunken">{t.label}</button>
                        ))}
                      </div>
                    </>
                  )}
                </ActiveCard>
              ) : (
                <CollapsedCard label="Service" value={service} placeholder="Hinzufügen" onClick={() => setStep("service")} />
              )}

              {/* LOCATION , uses SEARCH_CITIES (real) */}
              {step === "location" ? (
                <ActiveCard title="Wo?">
                  <input value={cityQ} onChange={(e) => setCityQ(e.target.value)} placeholder="Stadt suchen"
                    className="mb-3 w-full rounded-[14px] border border-s-border bg-white px-4 py-3 text-[15px] text-s-ink placeholder:text-s-ink-3 focus:border-s-ink focus:shadow-none focus:outline-none" />
                  <SuggestRow name="In der Nähe" sub="Aktueller Standort" Icon={Navigation} tint onClick={() => { setCity("In der Nähe"); advance("location"); }} />
                  <div className="max-h-[40vh] overflow-y-auto">
                    {cities.map((c) => (
                      <SuggestRow key={c} name={c} Icon={MapPin} onClick={() => { setCity(c); setCityQ(""); advance("location"); }} />
                    ))}
                  </div>
                </ActiveCard>
              ) : (
                <CollapsedCard label="Standort" value={city} placeholder="Hinzufügen" onClick={() => setStep("location")} />
              )}

              {/* DATE , multi-month calendar with past days struck (Airbnb) */}
              {step === "date" ? (
                <ActiveCard title="Wann?">
                  <div className="mb-4 flex rounded-full bg-s-bg-sunken p-1">
                    <button onClick={() => setDateTab("daten")}
                      className={`flex-1 rounded-full py-1.5 text-center text-[13px] ${dateTab === "daten" ? "bg-white font-semibold text-s-ink shadow-[0_2px_8px_rgba(10,10,10,0.08)]" : "font-medium text-s-ink-3"}`}>Daten</button>
                    <button onClick={() => setDateTab("flexibel")}
                      className={`flex-1 rounded-full py-1.5 text-center text-[13px] ${dateTab === "flexibel" ? "bg-white font-semibold text-s-ink shadow-[0_2px_8px_rgba(10,10,10,0.08)]" : "font-medium text-s-ink-3"}`}>Flexibel</button>
                  </div>
                  {dateTab === "daten" ? (
                    <>
                      <div className="mb-1 grid grid-cols-7 text-center text-[12px] font-medium text-s-ink-3">
                        {WEEKDAYS.map((w, i) => <span key={i}>{w}</span>)}
                      </div>
                      {months.map((mDate) => (
                        <MonthGrid key={mDate.getMonth()} monthDate={mDate} now={now} selKey={selKey}
                          onPick={(key, label) => { setSelKey(key); setDate(label); }} />
                      ))}
                    </>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {FLEX_DATES.map((dd) => (
                        <button key={dd} onClick={() => { setDate(dd); setSelKey(null); }}
                          className={`rounded-full border px-4 py-1.5 text-[13px] transition-colors ${date === dd ? "border-s-border bg-s-bg-sunken font-semibold text-s-ink" : "border-s-border bg-white text-s-ink-2 hover:bg-s-bg-sunken"}`}>{dd}</button>
                      ))}
                    </div>
                  )}
                </ActiveCard>
              ) : (
                <CollapsedCard label="Datum" value={date} placeholder="Jederzeit" onClick={() => setStep("date")} />
              )}
            </div>

            <div className="flex items-center justify-between border-t border-s-border bg-s-bg-sunken/60 px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3">
              <button onClick={reset} className="text-[14px] font-semibold text-s-ink underline-offset-4 hover:underline">Zurücksetzen</button>
              {/* selected-ok: the ONE primary commit CTA, ink per the design contract (not a selected state) */}
              <button className="flex items-center gap-2 rounded-full bg-s-ink px-6 py-3 font-heading text-[15px] font-bold text-white active:scale-[0.98]">
                <Search size={16} strokeWidth={2.2} /> Suchen
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MonthGrid({ monthDate, now, selKey, onPick }: {
  monthDate: Date; now: Date; selKey: string | null; onPick: (key: string, label: string) => void;
}) {
  const y = monthDate.getFullYear(), m = monthDate.getMonth();
  const monthLong = monthDate.toLocaleDateString("de-CH", { month: "long" });
  const cells = monthGrid(monthDate);
  const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return (
    <div className="mb-4">
      <p className="mb-2 font-heading text-[15px] font-bold capitalize text-s-ink">{monthLong} {y}</p>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const key = `${y}-${m}-${d}`;
          const past = new Date(y, m, d).getTime() < todayMid;
          return (
            <div key={i} className="flex justify-center py-0.5">
              {past ? (
                <span className="grid h-9 w-9 place-items-center text-[13px] text-s-ink-3 line-through">{d}</span>
              ) : (
                <button onClick={() => onPick(key, `${d}. ${monthLong}`)}
                  className={`grid h-9 w-9 place-items-center rounded-full text-[13px] ${selKey === key ? "bg-s-accent font-bold text-white" : "text-s-ink hover:bg-s-bg-sunken"}`}>
                  {d}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActiveCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <motion.div layout transition={{ duration: 0.42, ease: EASE }}
      className="rounded-[20px] bg-white px-5 pb-5 pt-5 shadow-[0_14px_40px_rgba(10,10,10,0.14)]">
      <h2 className="mb-4 font-heading text-[20px] font-extrabold leading-none tracking-[-0.02em] text-s-ink">{title}</h2>
      {children}
    </motion.div>
  );
}

function CollapsedCard({ label, value, placeholder, onClick }: {
  label: string; value: string; placeholder: string; onClick: () => void;
}) {
  return (
    <motion.button layout transition={{ duration: 0.42, ease: EASE }} onClick={onClick}
      className="flex w-full items-center justify-between rounded-[20px] bg-white px-5 py-4 text-left shadow-[0_6px_20px_rgba(10,10,10,0.08)]">
      <span className="text-[15px] text-s-ink-3">{label}</span>
      <span className={`text-[15px] font-semibold ${value ? "text-s-ink" : "text-s-ink-2"}`}>{value || placeholder}</span>
    </motion.button>
  );
}

function SuggestRow({ name, sub, Icon, tint, onClick }: {
  name: string; sub?: string; Icon: LucideIcon; tint?: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-xl py-2 pr-2 text-left hover:bg-s-bg-sunken">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tint ? "bg-s-accent/10 text-s-accent" : "bg-s-bg-sunken text-s-ink-2"}`}>
        <Icon size={18} strokeWidth={1.9} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[15px] font-semibold text-s-ink">{name}</span>
        {sub ? <span className="block truncate text-[13px] text-s-ink-3">{sub}</span> : null}
      </span>
    </button>
  );
}
