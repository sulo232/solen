"use client";

// exists-check: net-new dev PREVIEW route (no match in `npm run exists search-morph`). Faithful Airbnb
// mobile-search clone (refs IMG_6228/6229/6230, measured 2026-06-30) with OUR tokens. STRUCTURE = Airbnb
// (scrim + top-crop bottom-sheet, drag-to-dismiss, accordion thin-bars + one open panel, focused-search =
// back-arrow INSIDE the bar + clear-X, no separate full-bleed page). AESTHETIC = Solen tokens. USES THE
// EXISTING DATA (CATEGORIES, SEARCH_CITIES, CITY_ICONS, TRENDING, FEATURED_SALONS, useSearchSuggest).
// Preview only, not linked in nav, does not touch the live homepage SearchBar.

import { useState, useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { notFound } from "next/navigation";
import { motion, AnimatePresence, useDragControls, useReducedMotion } from "motion/react";
import { Search, MapPin, Navigation, X, Clock, User, ArrowLeft, Store, type LucideIcon } from "lucide-react";
import { CATEGORIES } from "@/app/[locale]/_components/homepage/searchCategories";
import { FEATURED_SALONS } from "@/app/[locale]/_components/homepage/searchFeatured";
import { SEARCH_CITIES, CITY_ICONS } from "@/lib/cities";
import { TRENDING } from "@/app/[locale]/_components/homepage/searchTrending";
import { useSearchSuggest } from "@/app/[locale]/_components/homepage/useSearchSuggest";
import { Skeleton } from "@/app/[locale]/_components/primitives";

const EASE = [0.32, 0.72, 0, 1] as const;
const OPEN_SPRING = { type: "spring", stiffness: 420, damping: 38, mass: 0.9 } as const;
const LAYOUT_SPRING = { type: "spring", stiffness: 500, damping: 42 } as const;
const FLEX_DATES = ["Heute", "Morgen", "Diese Woche", "Wochenende", "Flexibel"];
const WEEKDAYS = ["M", "D", "M", "D", "F", "S", "S"]; // Monday-first (de-CH)
// selected-ok: the ONE primary commit CTA stays ink (bg-s-ink) per the design contract; every other selected state is gray/blue-border
const COMMIT_BTN = "flex items-center gap-2 rounded-full bg-s-ink px-6 py-3 font-heading text-[15px] font-bold text-white active:scale-[0.98]";

const STEPS = ["service", "location", "date"] as const;
type Step = (typeof STEPS)[number];

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
  const [activeStep, setActiveStep] = useState<Step>("service");
  const [inputFocused, setInputFocused] = useState(false); // sub-mode of service/location: the floated search bar + full list
  const [service, setService] = useState("");
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const [serviceQ, setServiceQ] = useState("");
  const [cityQ, setCityQ] = useState("");
  const [dateTab, setDateTab] = useState<"daten" | "flexibel">("daten");
  const [selKey, setSelKey] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const dragControls = useDragControls();
  const reduce = useReducedMotion();
  const serviceRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []); // portal target ready , escape the page stacking context
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const now = new Date();
  const months = [now, new Date(now.getFullYear(), now.getMonth() + 1, 1), new Date(now.getFullYear(), now.getMonth() + 2, 1)];
  const windowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 42); // ~6-week booking window

  const { results, loading } = useSearchSuggest(open ? serviceQ : "", { city: city || undefined }); // no network calls while closed
  const typing = serviceQ.trim().length >= 2;
  const hasResults = results.services.length + results.salons.length + results.stylists.length > 0;
  const cities = SEARCH_CITIES.filter((c) => c.toLowerCase().includes(cityQ.toLowerCase()));

  const focusedSearch = inputFocused && (activeStep === "service" || activeStep === "location");

  const openStep = (s: Step) => { setActiveStep(s); setInputFocused(false); };
  const advance = (s: Step) => {
    setInputFocused(false);
    const next = STEPS[STEPS.indexOf(s) + 1];
    if (next) setActiveStep(next);
  };
  const close = () => { setOpen(false); setInputFocused(false); setActiveStep("service"); setServiceQ(""); setCityQ(""); };
  const reset = () => {
    setService(""); setCity(""); setDate(""); setServiceQ(""); setCityQ(""); setSelKey(null);
    setActiveStep("service"); setInputFocused(false);
  };

  // dev preview only , real 404 in production (matches app/[locale]/dev/primitives convention)
  if (process.env.NODE_ENV === "production") notFound();

  const openT = reduce ? { duration: 0 } : OPEN_SPRING;
  const layoutT = reduce ? { duration: 0 } : LAYOUT_SPRING;
  const fadeT = { duration: reduce ? 0 : 0.18, ease: EASE };

  // ── shared suggestion lists (reused capped in the accordion panel, full in focused mode) ──
  const serviceSuggestions = (full: boolean): ReactNode => {
    if (typing) {
      if (loading) return <div className="space-y-2 pt-1">{[0, 1, 2].map((i) => <Skeleton key={i} height={48} rounded={14} />)}</div>;
      if (!hasResults) return <p className="py-8 text-center text-[14px] text-s-ink-3">Keine Treffer für {serviceQ}</p>;
      return (
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
      );
    }
    return (
      <>
        <SectionLabel>Zuletzt gesucht</SectionLabel>
        {RECENTS.map((r) => (
          <SuggestRow key={r.svc} name={`${r.svc} in ${r.city}`} sub={r.when} Icon={Clock}
            onClick={() => { setService(r.svc); setCity(r.city); setDate(r.when); openStep("date"); }} />
        ))}
        {full && (
          <>
            <SectionLabel className="mt-3">Beliebte Stores</SectionLabel>
            {FEATURED_SALONS.map((sl) => (
              <SuggestRow key={sl.id} name={sl.name} sub={sl.address} Icon={Store}
                onClick={() => { setService(sl.name); advance("service"); }} />
            ))}
          </>
        )}
        <SectionLabel className="mt-3">Vorschläge</SectionLabel>
        <SuggestRow name="In der Nähe" sub="Aktueller Standort" Icon={Navigation} tint
          onClick={() => { setService("In der Nähe"); advance("service"); }} />
        {(full ? CATEGORIES : CATEGORIES.slice(0, 2)).map((c) => (
          <SuggestRow key={c.label} name={c.label} sub={c.count} Icon={c.icon}
            onClick={() => { setService(c.label); setServiceQ(""); advance("service"); }} />
        ))}
        {full && (
          <>
            <SectionLabel className="mt-3">Im Trend</SectionLabel>
            <div className="flex flex-wrap gap-2 pt-1">
              {TRENDING.map((t) => (
                <button key={t.query} onClick={() => { setService(t.label); advance("service"); }}
                  className="rounded-full border border-s-border bg-white px-3.5 py-1.5 text-[13px] text-s-ink-2 hover:bg-s-bg-sunken">{t.label}</button>
              ))}
            </div>
          </>
        )}
      </>
    );
  };

  const cityList = (): ReactNode => (
    <>
      <SuggestRow name="In der Nähe" sub="Aktueller Standort" Icon={Navigation} tint
        onClick={() => { setCity("In der Nähe"); advance("location"); }} />
      {cities.map((c) => (
        <SuggestRow key={c} name={c} img={CITY_ICONS[c]} Icon={MapPin}
          onClick={() => { setCity(c); setCityQ(""); advance("location"); }} />
      ))}
    </>
  );

  // ── the focused search bar: [back] [input] [clear-X] as ONE bordered bar (ask 2 + 4) ──
  const focusedBar = focusedSearch ? (() => {
    const isService = activeStep === "service";
    const q = isService ? serviceQ : cityQ;
    const setQ = isService ? setServiceQ : setCityQ;
    const ref = isService ? serviceRef : cityRef;
    const placeholder = isService ? "Service, Salon oder Stylist:in" : "Stadt suchen";
    return (
      <div className="flex h-12 items-center gap-1 rounded-[14px] border border-s-border bg-white pl-1 pr-1.5">
        <button onClick={() => setInputFocused(false)} aria-label="Zurück"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-s-ink hover:bg-s-bg-sunken">
          <ArrowLeft size={18} strokeWidth={2} />
        </button>
        <input ref={ref} autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder}
          className="min-w-0 flex-1 border-0 bg-transparent px-0 text-[15px] text-s-ink placeholder:text-s-ink-3 focus-visible:border-s-border focus:outline-none focus-visible:shadow-none focus-visible:outline-none" />
        {q.length > 0 && (
          <button onClick={() => { setQ(""); ref.current?.focus(); }} aria-label="Eingabe löschen"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-s-bg-sunken text-s-ink-2">
            <X size={15} strokeWidth={2.4} />
          </button>
        )}
      </div>
    );
  })() : null;

  // ── the active (open) panel for a step ──
  const stepPanel = (s: Step): ReactNode => {
    if (s === "service") {
      return (
        <div className="rounded-[18px] border border-s-border bg-white p-4">
          <h2 className="mb-3 font-heading text-[24px] font-bold leading-tight tracking-[-0.02em] text-s-ink">Wonach suchst du?</h2>
          <button onClick={() => setInputFocused(true)}
            className="mb-3 flex w-full items-center gap-2.5 rounded-[14px] border border-s-border bg-s-bg-sunken px-4 py-3 text-left">
            <Search size={18} strokeWidth={2} className="shrink-0 text-s-ink-3" />
            <span className={`truncate text-[15px] ${service ? "text-s-ink" : "text-s-ink-3"}`}>{service || "Service, Salon oder Stylist:in"}</span>
          </button>
          <div className="max-h-[30vh] overflow-y-auto overscroll-contain" onWheel={(e) => { if (e.deltaY > 0) setInputFocused(true); }} onTouchMove={() => setInputFocused(true)}>{serviceSuggestions(false)}</div>
        </div>
      );
    }
    if (s === "location") {
      return (
        <div className="rounded-[18px] border border-s-border bg-white p-4">
          <h2 className="mb-3 font-heading text-[24px] font-bold leading-tight tracking-[-0.02em] text-s-ink">Wo?</h2>
          <button onClick={() => setInputFocused(true)}
            className="mb-3 flex w-full items-center gap-2.5 rounded-[14px] border border-s-border bg-s-bg-sunken px-4 py-3 text-left">
            <Search size={18} strokeWidth={2} className="shrink-0 text-s-ink-3" />
            <span className={`truncate text-[15px] ${city ? "text-s-ink" : "text-s-ink-3"}`}>{city || "Stadt suchen"}</span>
          </button>
          <div className="max-h-[30vh] overflow-y-auto overscroll-contain" onWheel={(e) => { if (e.deltaY > 0) setInputFocused(true); }} onTouchMove={() => setInputFocused(true)}>{cityList()}</div>
        </div>
      );
    }
    // date
    return (
      <div className="px-1 pt-1">
        <h2 className="mb-3 font-heading text-[24px] font-bold leading-tight tracking-[-0.02em] text-s-ink">Wann?</h2>
        <div className="mb-4 flex rounded-full bg-s-bg-sunken p-1">
          <button onClick={() => setDateTab("daten")}
            className={`flex-1 rounded-full py-2 text-center text-[13px] ${dateTab === "daten" ? "bg-white font-semibold text-s-ink" : "font-medium text-s-ink-3"}`}>Daten</button>
          <button onClick={() => setDateTab("flexibel")}
            className={`flex-1 rounded-full py-2 text-center text-[13px] ${dateTab === "flexibel" ? "bg-white font-semibold text-s-ink" : "font-medium text-s-ink-3"}`}>Flexibel</button>
        </div>
        {dateTab === "daten" ? (
          <div>
            <div className="mb-1 grid grid-cols-7 text-center text-[12px] font-medium text-s-ink-3">
              {WEEKDAYS.map((w, i) => <span key={i}>{w}</span>)}
            </div>
            {months
              .filter((mDate) => new Date(mDate.getFullYear(), mDate.getMonth(), 1).getTime() <= windowEnd.getTime())
              .map((mDate) => (
                <MonthGrid key={mDate.getMonth()} monthDate={mDate} now={now} windowEnd={windowEnd} selKey={selKey}
                  onPick={(key, label) => { setSelKey(key); setDate(label); }} />
              ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {FLEX_DATES.map((dd) => (
              <button key={dd} onClick={() => { setDate(dd); setSelKey(null); }}
                className={`rounded-full border px-4 py-2 text-[13px] font-medium transition-colors ${date === dd ? "border-s-accent text-s-accent" : "border-s-border text-s-ink-2 hover:bg-s-bg-sunken"}`}>{dd}</button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const stepMeta: Record<Step, { label: string; value: string; placeholder: string }> = {
    service: { label: "Suche", value: service, placeholder: "Stores, Services, Stylist:innen" },
    location: { label: "Standort", value: city, placeholder: "Hinzufügen" },
    date: { label: "Datum", value: date, placeholder: "Jederzeit" },
  };

  return (
    <div className="min-h-screen bg-white">
      {/* minimal rest , just enough to trigger the search (the mockup is the SEARCH, not the homepage) */}
      <div className="mx-auto max-w-[430px] px-5 pt-14">
        <p className="mb-1.5 text-[13px] font-medium text-s-ink-3">Beauty und Wellness in der ganzen Schweiz</p>
        <h1 className="mb-5 font-heading text-[24px] font-bold leading-tight tracking-[-0.02em] text-s-ink">Termine, sofort bestätigt.</h1>
        <button type="button" onClick={() => { setActiveStep("service"); setInputFocused(false); setOpen(true); }}
          className="flex w-full items-center gap-2.5 rounded-full border border-s-border bg-white px-5 py-3.5 text-[15px] text-s-ink-3">
          <Search size={18} strokeWidth={2} /> Service, Stadt, Datum
        </button>
      </div>

      {mounted && createPortal(
        <AnimatePresence>
          {open && [
            // ── SCRIM (dimmed page behind; tap to close) ──
            <motion.div key="scrim" onClick={close}
              className="fixed inset-0 z-[100] bg-black/35"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.3, ease: EASE }} />,

            // ── CLOSE-X (on the scrim, in the top crop; distinct from the in-bar clear-X) ──
            <motion.button key="closeX" onClick={close} aria-label="Schliessen"
              className="fixed right-4 top-[max(14px,env(safe-area-inset-top))] z-[102] grid h-9 w-9 place-items-center rounded-full border border-s-border bg-white text-s-ink"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.25 }}>
              <X size={17} strokeWidth={2.2} />
            </motion.button>,

            // ── SHEET (top crop, rounded top, slides up; drag the grabber to dismiss) ──
            <motion.div key="sheet"
              drag="y" dragListener={false} dragControls={dragControls}
              dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.55 }}
              onDragEnd={(_e, info) => { if (info.offset.y > 140 || info.velocity.y > 600) close(); }}
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={openT}
              className={`fixed inset-x-0 bottom-0 top-[max(56px,calc(env(safe-area-inset-top)+12px))] z-[101] flex flex-col overflow-hidden rounded-t-[28px] transition-colors duration-300 ${focusedSearch ? "bg-white" : "bg-s-bg-sunken"}`}>
              {/* grabber , the drag handle (only this starts the dismiss drag, so list-scroll never fights it) */}
              <div onPointerDown={(e) => dragControls.start(e)}
                className="flex shrink-0 cursor-grab touch-none justify-center pb-1 pt-2.5 active:cursor-grabbing">
                <span className="h-1 w-9 rounded-full bg-s-border" />
              </div>

              <AnimatePresence mode="wait" initial={false}>
                {focusedSearch ? (
                  <motion.div key="focused" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={fadeT} className="flex min-h-0 flex-1 flex-col">
                    <div className="px-3 pb-2">{focusedBar}</div>
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-5">
                      {activeStep === "service" ? serviceSuggestions(true) : cityList()}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="accordion" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={fadeT} className="flex min-h-0 flex-1 flex-col">
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pt-1">
                      <motion.div layout className="space-y-2.5 pb-2">
                        {STEPS.map((s) => (
                          <motion.div key={s} layout transition={layoutT}>
                            {activeStep === s ? (
                              stepPanel(s)
                            ) : (
                              <button onClick={() => openStep(s)}
                                className="flex h-14 w-full items-center justify-between rounded-[16px] border border-s-border bg-white px-4 text-left">
                                <span className="text-[14px] font-medium text-s-ink-2">{stepMeta[s].label}</span>
                                <span className={`truncate pl-3 text-[14px] ${stepMeta[s].value ? "font-semibold text-s-ink" : "text-s-ink-3"}`}>
                                  {stepMeta[s].value || stepMeta[s].placeholder}
                                </span>
                              </button>
                            )}
                          </motion.div>
                        ))}
                      </motion.div>
                    </div>
                    {/* bottom bar (accordion only) , hairline top, Reset link + ink commit CTA */}
                    <div className="shrink-0 border-t border-s-border bg-s-bg-sunken px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3">
                      <div className="flex items-center justify-between">
                        <button onClick={reset} className="text-[14px] font-semibold text-s-ink underline-offset-4 hover:underline">Zurücksetzen</button>
                        <button onClick={close} className={COMMIT_BTN}>
                          <Search size={16} strokeWidth={2.2} /> Suchen
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>,
          ]}
        </AnimatePresence>,
        document.body)}
    </div>
  );
}

function SectionLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`mb-1 text-[13px] font-semibold text-s-ink ${className}`}>{children}</p>;
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
