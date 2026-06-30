"use client";

// exists-check: net-new dev PREVIEW route (no match in `npm run exists search-morph`). Mirrors the REAL
// Airbnb mobile search (captured live 2026-06-30: Recent searches row + Suggested rows, big-title active
// card, collapsed label/value cards, multi-month calendar with past days struck, Reset + commit) with OUR
// tokens. USES THE EXISTING DATA , imports CATEGORIES (searchCategories.ts), SEARCH_CITIES (lib/cities.ts),
// TRENDING (searchTrending.ts); does NOT re-declare it. White cards FLOAT on a frosted-blur backdrop.
// Preview only, not linked in nav, does not touch the live homepage SearchBar.

import { useState, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { notFound } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Search, MapPin, Navigation, X, Clock, User, ChevronUp, ArrowLeft, Store, type LucideIcon } from "lucide-react";
import { CATEGORIES } from "@/app/[locale]/_components/homepage/searchCategories";
import { FEATURED_SALONS } from "@/app/[locale]/_components/homepage/searchFeatured";
import { SEARCH_CITIES, CITY_ICONS } from "@/lib/cities";
import { TRENDING } from "@/app/[locale]/_components/homepage/searchTrending";
import { useSearchSuggest } from "@/app/[locale]/_components/homepage/useSearchSuggest";
import { Skeleton } from "@/app/[locale]/_components/primitives";

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
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step | null>("service");
  const [service, setService] = useState("");
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const [serviceQ, setServiceQ] = useState("");
  const [cityQ, setCityQ] = useState("");
  const [dateTab, setDateTab] = useState<"daten" | "flexibel">("daten");
  const [searchFocused, setSearchFocused] = useState(false); // tap the search input -> full-screen search
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []); // portal target ready , escape the page stacking context (like the real SearchOverlay)
  // lock body scroll while the overlay is open, so the scroll stays inside the overlay (not the page behind)
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);
  const [selKey, setSelKey] = useState<string | null>(null);

  const now = new Date();
  const months = [now, new Date(now.getFullYear(), now.getMonth() + 1, 1), new Date(now.getFullYear(), now.getMonth() + 2, 1)];
  const windowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 42); // ~6-week booking window

  const { results, loading } = useSearchSuggest(serviceQ, { city: city || undefined });
  const typing = serviceQ.trim().length >= 2;
  const hasResults = results.services.length + results.salons.length + results.stylists.length > 0;
  const cities = SEARCH_CITIES.filter((c) => c.toLowerCase().includes(cityQ.toLowerCase()));

  const advance = (s: Step) => {
    setSearchFocused(false);
    const order: Step[] = ["service", "location", "date"];
    const next = order[order.indexOf(s) + 1];
    if (next) setTimeout(() => setStep(next), 360); // match the ~420ms card collapse so steps don't overlap (council)
  };
  const close = () => { setOpen(false); setStep("service"); setSearchFocused(false); };
  const reset = () => { setService(""); setCity(""); setDate(""); setServiceQ(""); setCityQ(""); setSelKey(null); setStep("service"); setSearchFocused(false); };

  // dev preview only , real 404 in production (matches app/[locale]/dev/primitives convention)
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="min-h-screen bg-white">
      {/* minimal rest , just enough to trigger the search (the mockup is the SEARCH, not the homepage) */}
      <div className="mx-auto max-w-[430px] px-5 pt-14">
        <p className="mb-1.5 text-[13px] font-medium text-s-ink-3">Beauty und Wellness in der ganzen Schweiz</p>
        <h1 className="mb-5 font-heading text-[24px] font-bold leading-tight tracking-[-0.02em] text-s-ink">Termine, sofort bestätigt.</h1>
        <motion.button type="button" onClick={() => setOpen(true)}
          className="flex w-full items-center gap-2.5 rounded-full border border-s-border bg-white px-5 py-3.5 text-[15px] text-s-ink-3 shadow-[0_8px_24px_rgba(10,10,10,0.10)]">
          <Search size={18} strokeWidth={2} /> Service, Stadt, Datum
        </motion.button>
      </div>

      {mounted && createPortal(
      <AnimatePresence>
        {open && (
          <motion.div
            key="surface"
            className={`fixed inset-0 z-[100] flex flex-col overflow-hidden transition-colors duration-300 ${searchFocused ? "bg-white" : "bg-s-bg-sunken/55 backdrop-blur-2xl"}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            onWheel={(e) => { if (step === "service" && !searchFocused && e.deltaY > 0) setSearchFocused(true); }}
            onTouchMove={() => { if (step === "service" && !searchFocused) setSearchFocused(true); }}
          >
            {!searchFocused && (
              <div className="flex justify-end px-5 pt-[max(14px,env(safe-area-inset-top))]">
                <button onClick={close} aria-label="Schliessen"
                  className="grid h-9 w-9 place-items-center rounded-full border border-s-border bg-white text-s-ink shadow-[0_2px_8px_rgba(10,10,10,0.08)]">
                  <X size={17} strokeWidth={2.2} />
                </button>
              </div>
            )}

            <div className={`flex-1 space-y-3 overflow-y-auto px-4 pb-4 ${searchFocused ? "pt-[max(14px,env(safe-area-inset-top))]" : "pt-1"}`}
              onScroll={(e) => { if (step === "service" && !searchFocused && e.currentTarget.scrollTop > 8) setSearchFocused(true); }}
              onWheel={(e) => { if (step === "service" && !searchFocused && e.deltaY > 0) setSearchFocused(true); }}
              onTouchMove={() => { if (step === "service" && !searchFocused) setSearchFocused(true); }}>
              {/* SERVICE , Recent searches + Suggested (Airbnb structure), all real data */}
              {step === "service" ? (
                <motion.div layout transition={{ duration: 0.42, ease: EASE }}
                  className={searchFocused ? "" : "rounded-[20px] bg-white px-5 pb-5 pt-5 shadow-[0_14px_40px_rgba(10,10,10,0.14)]"}>
                  {searchFocused ? (
                    /* FULL search (Airbnb focused state): full-bleed white, back arrow + input pinned at the very top */
                    <div className="sticky top-0 z-10 mb-3 flex items-center gap-2 bg-white pb-2">
                      <button onClick={() => setSearchFocused(false)} aria-label="Zurück"
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-s-ink hover:bg-s-bg-sunken">
                        <ArrowLeft size={20} strokeWidth={2} />
                      </button>
                      <input autoFocus value={serviceQ} onChange={(e) => setServiceQ(e.target.value)} placeholder="Service, Salon oder Stylist:in"
                        className="flex-1 rounded-[14px] border border-s-border bg-white px-4 py-3 text-[15px] text-s-ink placeholder:text-s-ink-3 focus-visible:border-s-border focus-visible:shadow-none focus-visible:outline-none" />
                    </div>
                  ) : (
                    <>
                      <button onClick={() => setStep(null)} className="mb-4 flex w-full items-center justify-between text-left">
                        <span className="font-heading text-[20px] font-extrabold leading-none tracking-[-0.02em] text-s-ink">Wonach suchst du?</span>
                        <ChevronUp size={20} className="text-s-ink-3" />
                      </button>
                      <input value={serviceQ} onChange={(e) => setServiceQ(e.target.value)} placeholder="Service, Salon oder Stylist:in"
                        className="mb-3 w-full rounded-[14px] border border-s-border bg-white px-4 py-3 text-[15px] text-s-ink placeholder:text-s-ink-3 focus-visible:border-s-border focus-visible:shadow-none focus-visible:outline-none" />
                    </>
                  )}
                  {/* capped + internal-scroll in the accordion so Standort/Datum stay visible; uncapped in full-search */}
                  {/* scroll the suggestions -> the card EXPANDS to full search (Airbnb scroll-driven open) */}
                  <div className={searchFocused ? "" : "max-h-[44vh] overflow-y-auto"}
                    onScroll={(e) => { if (!searchFocused && e.currentTarget.scrollTop > 16) setSearchFocused(true); }}
                    onWheel={(e) => { if (!searchFocused && e.deltaY > 0) setSearchFocused(true); }}
                    onTouchMove={() => { if (!searchFocused) setSearchFocused(true); }}>
                  {typing ? (
                    loading ? (
                      <div className="space-y-2 pt-1">
                        {[0, 1, 2].map((i) => <Skeleton key={i} height={48} rounded={14} />)}
                      </div>
                    ) : hasResults ? (
                      <>
                        {results.services.map((s) => (
                          <SuggestRow key={s.id} name={s.name_de} sub="Service" Icon={Search}
                            onClick={() => { setService(s.name_de); setServiceQ(""); advance("service"); }} />
                        ))}
                        {results.salons.map((s) => (
                          <SuggestRow key={s.id} name={s.name} sub="Salon" Icon={MapPin}
                            onClick={() => { setService(s.name); setServiceQ(""); advance("service"); }} />
                        ))}
                        {results.stylists.map((s) => (
                          <SuggestRow key={s.id} name={s.name} sub={s.salon_name} Icon={User}
                            onClick={() => { setService(s.name); setServiceQ(""); advance("service"); }} />
                        ))}
                      </>
                    ) : (
                      <p className="py-8 text-center text-[14px] text-s-ink-3">Keine Treffer für {serviceQ}</p>
                    )
                  ) : (
                    <>
                      <p className="mb-1 text-[13px] font-semibold text-s-ink-3">Zuletzt gesucht</p>
                      {RECENTS.map((r) => (
                        <SuggestRow key={r.svc} name={`${r.svc} in ${r.city}`} sub={r.when} Icon={Clock}
                          onClick={() => { setService(r.svc); setCity(r.city); setDate(r.when); setSearchFocused(false); setStep("date"); }} />
                      ))}
                      {/* Stores + Trending only in full-search (keeps the accordion compact so the steps stay visible) */}
                      {searchFocused && (
                        <>
                          <p className="mb-1 mt-3 text-[13px] font-semibold text-s-ink-3">Beliebte Stores</p>
                          {/* mockup: in production a store row navigates to /salon/[slug]; here it fills the Suche field */}
                          {FEATURED_SALONS.map((sl) => (
                            <SuggestRow key={sl.id} name={sl.name} sub={sl.address} Icon={Store}
                              onClick={() => { setService(sl.name); advance("service"); }} />
                          ))}
                        </>
                      )}
                      <p className="mb-1 mt-3 text-[13px] font-semibold text-s-ink-3">Vorschläge</p>
                      <SuggestRow name="In der Nähe" sub="Aktueller Standort" Icon={Navigation} tint onClick={() => { setService("In der Nähe"); advance("service"); }} />
                      {CATEGORIES.map((c) => (
                        <SuggestRow key={c.label} name={c.label} sub={c.count} Icon={c.icon}
                          onClick={() => { setService(c.label); setServiceQ(""); advance("service"); }} />
                      ))}
                      {searchFocused && (
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
                    </>
                  )}
                  </div>
                </motion.div>
              ) : (
                <CollapsedCard label="Suche" value={service} placeholder="Stores, Services, Stylist:innen" onClick={() => setStep("service")} />
              )}

              {/* LOCATION + DATE hide in full-search mode (the search takes the whole screen) */}
              <AnimatePresence initial={false}>
              {!searchFocused && (
                <motion.div key="steps" animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.32, ease: EASE }} className="space-y-3 overflow-hidden">
              {step === "location" ? (
                <ActiveCard title="Wo?">
                  <input value={cityQ} onChange={(e) => setCityQ(e.target.value)} placeholder="Stadt suchen"
                    className="mb-3 w-full rounded-[14px] border border-s-border bg-white px-4 py-3 text-[15px] text-s-ink placeholder:text-s-ink-3 focus:border-s-ink focus:shadow-none focus:outline-none" />
                  <SuggestRow name="In der Nähe" sub="Aktueller Standort" Icon={Navigation} tint onClick={() => { setCity("In der Nähe"); advance("location"); }} />
                  <div className="max-h-[40vh] overflow-y-auto">
                    {cities.map((c) => (
                      <SuggestRow key={c} name={c} img={CITY_ICONS[c]} Icon={MapPin} onClick={() => { setCity(c); setCityQ(""); advance("location"); }} />
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
                      {months
                        .filter((mDate) => new Date(mDate.getFullYear(), mDate.getMonth(), 1).getTime() <= windowEnd.getTime())
                        .map((mDate) => (
                          <MonthGrid key={mDate.getMonth()} monthDate={mDate} now={now} windowEnd={windowEnd} selKey={selKey}
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
                </motion.div>
              )}
              </AnimatePresence>
            </div>

            {/* sticky action bar , white + gradient fade above (DS: sticky bar = gradient fade), NOT a card */}
            <div className="relative bg-white">
              <div className="pointer-events-none absolute inset-x-0 -top-6 h-6 bg-gradient-to-t from-white to-transparent" />
              <div className="flex items-center justify-between px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3">
                <button onClick={reset} className="text-[14px] font-semibold text-s-ink underline-offset-4 hover:underline">Zurücksetzen</button>
                {/* selected-ok: primary commit CTA, ink per design contract */}
                <button className="flex items-center gap-2 rounded-full bg-s-ink px-6 py-3 font-heading text-[15px] font-bold text-white active:scale-[0.98]">
                  <Search size={16} strokeWidth={2.2} /> Suchen
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body)}
    </div>
  );
}

function MonthGrid({ monthDate, now, windowEnd, selKey, onPick }: {
  monthDate: Date; now: Date; windowEnd: Date; selKey: string | null; onPick: (key: string, label: string) => void;
}) {
  const y = monthDate.getFullYear(), m = monthDate.getMonth();
  const monthLong = monthDate.toLocaleDateString("de-CH", { month: "long" });
  const cells = monthGrid(monthDate);
  const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const windowMid = windowEnd.getTime();
  return (
    <div className="mb-4">
      <p className="mb-2 font-heading text-[15px] font-bold capitalize text-s-ink">{monthLong} {y}</p>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const key = `${y}-${m}-${d}`;
          const t = new Date(y, m, d).getTime();
          const disabled = t < todayMid || t > windowMid; // past OR beyond the booking window
          return (
            <div key={i} className="flex justify-center py-0.5">
              {disabled ? (
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

function ActiveCard({ title, onToggle, children }: { title: string; onToggle?: () => void; children: ReactNode }) {
  return (
    <motion.div layout transition={{ duration: 0.42, ease: EASE }}
      className="rounded-[20px] bg-white px-5 pb-5 pt-5 shadow-[0_14px_40px_rgba(10,10,10,0.14)]">
      {/* tap the title again to collapse this step (Airbnb toggle) */}
      <button onClick={onToggle} className="mb-4 flex w-full items-center justify-between text-left">
        <span className="font-heading text-[20px] font-extrabold leading-none tracking-[-0.02em] text-s-ink">{title}</span>
        <ChevronUp size={20} className="text-s-ink-3" />
      </button>
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

function SuggestRow({ name, sub, Icon, img, tint, onClick }: {
  name: string; sub?: string; Icon?: LucideIcon; img?: string; tint?: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-xl py-2 pr-2 text-left hover:bg-s-bg-sunken">
      {img ? (
        <img src={img} alt="" className="h-11 w-11 shrink-0 object-contain" />
      ) : (
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tint ? "bg-s-accent/10 text-s-accent" : "bg-s-bg-sunken text-s-ink-2"}`}>
          {Icon ? <Icon size={18} strokeWidth={1.9} /> : null}
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate text-[15px] font-semibold text-s-ink">{name}</span>
        {sub ? <span className="block truncate text-[13px] text-s-ink-3">{sub}</span> : null}
      </span>
    </button>
  );
}
