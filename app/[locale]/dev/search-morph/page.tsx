"use client";

// exists-check: net-new dev PREVIEW route (no match in `npm run exists search-morph`). Faithful Airbnb
// mobile-search clone (refs IMG_6228/6229/6230 + ScreenRecording_06-30, council-analyzed 2026-06-30).
// THE EXPAND IS ONE CONTINUOUS SCROLL-LINKED TRANSFORM: a single `expand` motion value (0=accordion,
// 1=focused) drives EVERY property (sheet crop, heading collapse, the other-step rows, footer slide,
// the magnifier->back swap, the X fade) via useTransform , every paused frame is a valid resting state.
// NO subtree swap, NO threshold commit (see feedback_search_expand_gesture_linked). AESTHETIC = Solen
// tokens. USES EXISTING DATA (CATEGORIES, SEARCH_CITIES, CITY_ICONS, TRENDING, FEATURED_SALONS,
// useSearchSuggest). Preview only.

import { useState, useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { notFound } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion, useMotionValue, useTransform, animate } from "motion/react";
import { Search, MapPin, Navigation, X, Clock, User, ArrowLeft, Store, ChevronLeft, ChevronRight, Globe, type LucideIcon } from "lucide-react";
import { CATEGORIES } from "@/app/[locale]/_components/homepage/searchCategories";
import { FEATURED_SALONS } from "@/app/[locale]/_components/homepage/searchFeatured";
import { SEARCH_CITIES, CITY_ICONS } from "@/lib/cities";
import { TRENDING } from "@/app/[locale]/_components/homepage/searchTrending";
import { useSearchSuggest } from "@/app/[locale]/_components/homepage/useSearchSuggest";
import { Skeleton } from "@/app/[locale]/_components/primitives";

const EASE = [0.32, 0.72, 0, 1] as const;
const OPEN_T = { duration: 0.4, ease: EASE } as const;
const MORPH_T = { duration: 0.34, ease: EASE } as const;
const FLEX_DATES = ["Today", "Tomorrow", "Diese Woche", "Wochenende", "Diesen Monat", "Flexibel"]; // 6 -> balanced 2x3 grid
const WEEKDAYS = ["M", "D", "M", "D", "F", "S", "S"]; // Monday-first (de-CH)
// selected-ok: the ONE primary commit CTA stays ink (bg-s-ink) per the design contract; every other selected state is gray/blue-border
const COMMIT_BTN = "flex items-center gap-2 rounded-full bg-s-ink px-6 py-3 font-heading text-[15px] font-bold text-white active:scale-[0.98]";
const EXPAND_DIST = 120; // px of scroll that maps to the full accordion->focused expand (short = less swipe; pure 1:1 follow)
const HEADING_H = 56;    // collapsing heading height
const ROW_H = 66;        // collapsing step-row wrapper height = h-14 (56) + pt-2.5 (10); must fit the row or the two rows overlap
const FOOTER_H = 68;     // footer slide-off distance

const STEPS = ["service", "location", "date"] as const;
type Step = (typeof STEPS)[number];
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

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
  // inputFocused is set ONLY by an explicit tap on the search input (onFocus).
  // It is never set by scroll position -- scroll only drives the expand motion value.
  const [inputFocused, setInputFocused] = useState(false);
  const [service, setService] = useState("");
  const [city, setCity] = useState("No preference"); // location default = no preference (Egal)
  const [date, setDate] = useState("");
  const [serviceQ, setServiceQ] = useState("");
  const [cityQ, setCityQ] = useState("");
  const [dateTab, setDateTab] = useState<"daten" | "flexibel">("daten");
  const [monthOffset, setMonthOffset] = useState(0); // paged calendar: 0 = current month, arrows step it
  const [selKey, setSelKey] = useState<string | null>(null);
  const [period, setPeriod] = useState(""); // optional time-of-day; default empty = any time; tap a chip to toggle
  const [recents, setRecents] = useState(RECENTS); // removable via the per-row X
  const [mounted, setMounted] = useState(false);
  const [safeTop, setSafeTop] = useState(0);
  const reduce = useReducedMotion();
  const serviceRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const dateScrollRef = useRef<HTMLDivElement>(null); // scroll the date card to reveal the time picker on pick

  // PURE 1:1 SCROLL-LINKED EXPAND
  // expand = clamp(scrollTop / EXPAND_DIST, 0, 1). Every property driven from this
  // single value via useTransform. No commit, no lock, no auto-jump, no write-back.
  // Scroll down = card follows finger up. Scroll back = card follows finger down.
  // Every paused frame is a valid resting state.
  const expand = useMotionValue(0);
  const cropTop = useTransform(expand, [0, 1], [96, Math.max(safeTop + 6, 50)]); // sheet rises proportionally
  const headingH = useTransform(expand, [0, 0.55], [HEADING_H, 0]);              // heading collapses at the same pace as the sheet
  const headingOp = useTransform(expand, [0, 0.42], [1, 0]);
  const xOpacity = useTransform(expand, [0.82, 1], [1, 0]);                       // close-X fades late
  // Other-step rows + footer: fade+collapse out as expand rises (replaces inputFocused CSS switch)
  const stepsOp = useTransform(expand, [0.4, 0.8], [1, 0]);
  const stepsH = useTransform(expand, [0.4, 0.8], [ROW_H * 2 + 20, 0]);
  const footerH = useTransform(expand, [0.4, 0.8], [FOOTER_H, 0]);
  // Card margin + radius: flush as expand approaches 1 (replaces inputFocused CSS class swap)
  const cardMx = useTransform(expand, [0, 0.7], [12, 0]);
  const cardRadius = useTransform(expand, [0, 0.7], [22, 18]); // keep a rounded TOP when focused (cropped sheet look, blur above), never square full-bleed

  useEffect(() => setMounted(true), []);
  useEffect(() => { // measure env(safe-area-inset-top) so the focused sheet clears the notch
    const probe = document.createElement("div");
    probe.style.cssText = "position:fixed;top:0;height:env(safe-area-inset-top,0px);visibility:hidden;pointer-events:none";
    document.body.appendChild(probe);
    setSafeTop(Math.round(probe.getBoundingClientRect().height) || 0);
    probe.remove();
  }, []);
  useEffect(() => { // hide the /dev app-shell header so the crop shows only the (blurred) homepage
    const h = document.querySelector("header");
    if (!h) return;
    const prev = h.style.display;
    h.style.display = "none";
    return () => { if (document.contains(h)) h.style.display = prev; };
  }, []);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);
  useEffect(() => { if (inputFocused) (activeStep === "location" ? cityRef : serviceRef).current?.focus(); }, [inputFocused, activeStep]);

  const now = new Date();
  const months = [now, new Date(now.getFullYear(), now.getMonth() + 1, 1)]; // current + next month (the bookable window); avoids the "all year" clutter
  const windowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 42); // ~6-week booking window
  const maxMonthOffset = (windowEnd.getFullYear() - now.getFullYear()) * 12 + (windowEnd.getMonth() - now.getMonth()); // last bookable month
  const shownMonth = new Date(now.getFullYear(), now.getMonth() + Math.min(monthOffset, maxMonthOffset), 1); // paged calendar

  const { results, loading } = useSearchSuggest(open ? serviceQ : "", { city: city || undefined }); // no calls while closed
  const typing = serviceQ.trim().length >= 2;
  const hasResults = results.services.length + results.salons.length + results.stylists.length > 0;
  const cities = SEARCH_CITIES.filter((c) => c.toLowerCase().includes(cityQ.toLowerCase()));

  const morphT = reduce ? { duration: 0 } : MORPH_T;
  const openT = reduce ? { duration: 0 } : OPEN_T;
  const grow = (to: number) => animate(expand, to, reduce ? { duration: 0 } : { duration: 0.34, ease: EASE });
  // collapse: rewind the list scroll so the next expand starts from the top
  const collapse = () => { if (listRef.current) listRef.current.scrollTop = 0; grow(0); };

  const openStep = (s: Step) => { setActiveStep(s); setInputFocused(false); collapse(); };
  const advance = (s: Step) => {
    setInputFocused(false); collapse();
    const next = STEPS[STEPS.indexOf(s) + 1];
    if (next) setActiveStep(next);
  };
  const close = () => { setOpen(false); setInputFocused(false); setActiveStep("service"); setServiceQ(""); setCityQ(""); expand.set(0); };
  const reset = () => {
    setService(""); setCity("No preference"); setDate(""); setServiceQ(""); setCityQ(""); setSelKey(null); setPeriod("");
    setActiveStep("service"); setInputFocused(false); collapse();
  };

  if (process.env.NODE_ENV === "production") notFound(); // dev preview only , real 404 in production

  // suggestion lists (the full list always renders; the growing viewport reveals more rows)
  const serviceSuggestions = (): ReactNode => {
    if (typing) {
      if (loading) return <div className="space-y-2 pt-1">{[0, 1, 2].map((i) => <Skeleton key={i} height={48} rounded={14} />)}</div>;
      if (!hasResults) return <p className="py-8 text-center text-[14px] text-s-ink-2">Keine Treffer für {serviceQ}</p>;
      return (
        <>
          {results.services.map((s) => (
            <SuggestRow key={s.id} name={s.name_de} sub="Service" Icon={Search} onClick={() => { setService(s.name_de); setServiceQ(""); advance("service"); }} />
          ))}
          {results.salons.map((s) => (
            <SuggestRow key={s.id} name={s.name} sub="Salon" Icon={MapPin} onClick={() => { setService(s.name); setServiceQ(""); advance("service"); }} />
          ))}
          {results.stylists.map((s) => (
            <SuggestRow key={s.id} name={s.name} sub={s.salon_name} Icon={User} onClick={() => { setService(s.name); setServiceQ(""); advance("service"); }} />
          ))}
        </>
      );
    }
    return (
      <>
        {recents.length > 0 && (
          <>
            <SectionLabel>Zuletzt gesucht</SectionLabel>
            {recents.map((r, i) => (
              <SuggestRow key={r.svc} name={`${r.svc} in ${r.city}`} sub={r.when} Icon={Clock}
                onClick={() => { setService(r.svc); setCity(r.city); setDate(r.when); openStep("date"); }}
                onRemove={() => setRecents((rs) => rs.filter((_, idx) => idx !== i))} />
            ))}
          </>
        )}
        <SectionLabel className="mt-3">Beliebte Stores</SectionLabel>
        {/* FEATURED_SALONS is identity-only now (searchFeatured.ts); this dev preview has no
            live fetch wired, so the sub-line is omitted rather than showing a stale address. */}
        {FEATURED_SALONS.map((sl) => (
          <SuggestRow key={sl.id} name={sl.name} Icon={Store} onClick={() => { setService(sl.name); advance("service"); }} />
        ))}
        <SectionLabel className="mt-3">Kategorien</SectionLabel>
        <SuggestRow name="Nearby" sub="Aktueller Standort" Icon={Navigation} tint onClick={() => { setService("Nearby"); advance("service"); }} />
        {CATEGORIES.map((c) => (
          <SuggestRow key={c.label} name={c.label} Icon={c.icon} onClick={() => { setService(c.label); setServiceQ(""); advance("service"); }} />
        ))}
        <SectionLabel className="mt-3">Im Trend</SectionLabel>
        <div className="flex flex-wrap gap-2 pb-2 pt-1">
          {TRENDING.map((t) => (
            <button key={t.query} onClick={() => { setService(t.label); advance("service"); }}
              className="rounded-full bg-s-bg-sunken px-4 py-2 text-[13px] font-medium text-s-ink-2 active:scale-[0.97] hover:bg-s-border/60">{t.label}</button>
          ))}
        </div>
      </>
    );
  };

  const cityList = (): ReactNode => (
    <>
      <SuggestRow name="No preference" sub="Anywhere in Switzerland" Icon={Globe} onClick={() => { setCity("No preference"); setCityQ(""); advance("location"); }} />
      {cities.map((c) => (
        <SuggestRow key={c} name={c} img={CITY_ICONS[c]} Icon={MapPin} onClick={() => { setCity(c); setCityQ(""); advance("location"); }} />
      ))}
    </>
  );

  // the search bar: ONE element. Magnifier <-> back swaps when inputFocused (explicit tap only).
  const bar = (s: Step): ReactNode => {
    const isS = s === "service";
    const q = isS ? serviceQ : cityQ;
    const setQ = isS ? setServiceQ : setCityQ;
    const ref = isS ? serviceRef : cityRef;
    const ph = isS ? "Service, salon or stylist" : "Search city";
    return (
      <div className="flex h-12 items-center gap-2.5 rounded-[16px] border border-s-border bg-white px-4">
        {inputFocused ? (
          <button onClick={() => { setInputFocused(false); collapse(); }} aria-label="Back"
            className="grid h-6 w-6 shrink-0 place-items-center text-s-ink"><ArrowLeft size={20} strokeWidth={2} /></button>
        ) : (
          <span className="grid h-6 w-6 shrink-0 place-items-center"><Search size={19} strokeWidth={2} className="text-s-ink-2" /></span>
        )}
        {/* mockup-ok: !important preserves the existing look, matches the real SearchOverlay.tsx
            carve-out against the widened base input law (globals.css, 2026-07-17, also sets
            min-height:48px/padding:16px/font-size:16px) (V3-D-input-fill-2026-07-17). */}
        <input ref={ref} value={inputFocused ? q : (isS ? service : city)}
          onFocus={() => { setInputFocused(true); grow(1); }} onChange={(e) => setQ(e.target.value)} placeholder={ph}
          className="min-w-0 flex-1 !border-0 !bg-transparent !min-h-0 !px-0 !text-[15px] text-s-ink placeholder:text-s-ink-2 focus:outline-none focus-visible:outline-none" />
        {inputFocused && q.length > 0 && (
          <button onClick={() => { setQ(""); ref.current?.focus(); }} aria-label="Eingabe löschen"
            className="shrink-0 text-s-ink-2"><X size={18} strokeWidth={2.2} /></button>
        )}
      </div>
    );
  };

  const stepMeta: Record<Step, { label: string; value: string; placeholder: string }> = {
    service: { label: "Suche", value: service, placeholder: "Stores, Services, Stylist:innen" },
    location: { label: "Standort", value: city, placeholder: "Hinzufügen" },
    date: { label: "Datum", value: date, placeholder: "Jederzeit" },
  };
  const collapsedRow = (s: Step) => (
    <button onClick={() => openStep(s)} className="flex h-14 w-full items-center justify-between rounded-[20px] bg-white px-4 text-left shadow-[0_16px_48px_rgba(10,10,10,0.10)]">
      <span className="text-[14px] font-medium text-s-ink-2">{stepMeta[s].label}</span>
      <span className={`truncate pl-3 text-[14px] ${stepMeta[s].value ? "font-semibold text-s-ink" : "text-s-ink-2"}`}>{stepMeta[s].value || stepMeta[s].placeholder}</span>
    </button>
  );
  const footerInner = (
    <div className="flex items-center justify-between px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3">
      <button onClick={reset} className="text-[14px] font-semibold text-s-ink underline-offset-4 hover:underline">Zurücksetzen</button>
      <button onClick={close} className={COMMIT_BTN}><Search size={16} strokeWidth={2.2} /> Suchen</button>
    </div>
  );
  const footer = () => <div className="shrink-0">{footerInner}</div>;

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-[430px] px-5 pt-14">
        <p className="mb-1.5 text-[13px] font-medium text-s-ink-2">Beauty und Wellness in der ganzen Schweiz</p>
        <h1 className="mb-5 font-heading text-[24px] font-bold leading-tight tracking-[-0.02em] text-s-ink">Termine, sofort bestätigt.</h1>
        <button type="button" onClick={() => { setActiveStep("service"); setInputFocused(false); expand.set(0); setOpen(true); }}
          className="flex w-full items-center gap-2.5 rounded-full border border-s-border bg-white px-5 py-3.5 text-[15px] text-s-ink-2">
          <Search size={18} strokeWidth={2} /> Service, Stadt, Datum
        </button>
        {/* faux homepage behind the overlay , gives the frosted backdrop real content to blur */}
        <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => (
            <span key={c.label} className="flex shrink-0 items-center gap-1.5 rounded-full border border-s-border bg-white px-3.5 py-2 text-[13px] font-medium text-s-ink-2">
              <c.icon size={15} strokeWidth={2} /> {c.label}
            </span>
          ))}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {FEATURED_SALONS.slice(0, 4).map((s, i) => (
            <div key={s.id}>
              <div className="aspect-[4/3] rounded-[16px]" style={{ background: ["linear-gradient(135deg,#DBEAFE,#BFDBFE)", "linear-gradient(135deg,#FFE4E6,#FED7AA)", "linear-gradient(135deg,#D1FAE5,#CCFBF1)", "linear-gradient(135deg,#EDE9FE,#FAE8FF)"][i % 4] }} />
              <p className="mt-1.5 truncate text-[14px] font-semibold text-s-ink">{s.name}</p>
            </div>
          ))}
        </div>
      </div>

      {mounted && createPortal(
        <AnimatePresence>
          {open && [
            <motion.div key="scrim" onClick={close} className="fixed inset-0 z-[100] bg-s-ink/10 backdrop-blur-xl"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.3, ease: EASE }} />,

            <motion.button key="closeX" onClick={close} aria-label="Schliessen"
              className="fixed right-4 top-[max(14px,env(safe-area-inset-top))] z-[102] grid h-9 w-9 place-items-center rounded-full border border-s-border bg-white text-s-ink"
              style={{ opacity: xOpacity }} initial={{ opacity: 0 }} exit={{ opacity: 0 }}>
              <X size={17} strokeWidth={2.2} />
            </motion.button>,

            <motion.div key="sheet"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={openT}
              style={{ top: activeStep === "date" ? Math.max(safeTop, 24) : cropTop }}
              className="fixed inset-x-0 bottom-0 z-[101] flex flex-col overflow-hidden bg-transparent">
              {activeStep === "service" ? (
                // SEARCH -- the ONLY step with the scroll-up expand.
                // Every visual property (card margin, radius, shadow, row height, footer height)
                // is a useTransform output of `expand`. No CSS time-transitions keyed off state,
                // no committed lock. The finger IS the single source of truth every frame.
                <motion.div key="service" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduce ? 0 : 0.2 }}
                  className="flex min-h-0 flex-1 flex-col">
                  {/* Card: margin + radius driven by motion values, not class swap */}
                  <motion.div
                    style={{
                      marginLeft: cardMx,
                      marginRight: cardMx,
                      borderRadius: cardRadius,
                      boxShadow: "0 18px 50px rgba(10,10,10,0.13)",
                    }}
                    className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
                    {/* heading is a SIBLING above the list -- collapsing it never shifts the list scroll, no jump */}
                    <motion.div style={{ height: headingH, opacity: headingOp }} className="shrink-0 overflow-hidden">
                      <h2 className="px-4 pb-1 pt-4 font-heading text-[24px] font-bold leading-tight tracking-[-0.02em] text-s-ink">Wonach suchst du?</h2>
                    </motion.div>
                    <div className="shrink-0 px-3 pb-1 pt-4">{bar("service")}</div>
                    {/* onScroll: pure clamp -- no committed guard, no lock */}
                    <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-1"
                      onScroll={(e) => { expand.set(clamp01(e.currentTarget.scrollTop / EXPAND_DIST)); }}>
                      {serviceSuggestions()}
                    </div>
                  </motion.div>
                  {/* Other-step rows: height + opacity driven by expand, not by inputFocused class */}
                  <motion.div style={{ height: stepsH, opacity: stepsOp }} className="overflow-hidden px-3">
                    <div className="pt-2.5">{collapsedRow("location")}</div>
                    <div className="pt-2.5">{collapsedRow("date")}</div>
                  </motion.div>
                  {/* Footer: same */}
                  <motion.div style={{ height: footerH, opacity: stepsOp }} className="shrink-0 overflow-hidden">
                    {footerInner}
                  </motion.div>
                </motion.div>
              ) : (
                // LOCATION or DATE -- plain accordion in FIXED order (Suche > Standort > Datum);
                // the active one expands IN PLACE, no scroll-expand.
                <motion.div key={activeStep} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0 : 0.28, ease: EASE }}
                  className="flex min-h-0 flex-1 flex-col px-3 pt-3">
                  {STEPS.map((s) => s !== activeStep ? (
                    <div key={s} className="mb-2.5 shrink-0">{collapsedRow(s)}</div>
                  ) : s === "location" ? (
                    <div key={s} className="mb-2.5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[20px] bg-white p-4 shadow-[0_16px_48px_rgba(10,10,10,0.10)]">
                      <h2 className="mb-3 shrink-0 font-heading text-[24px] font-bold leading-tight tracking-[-0.02em] text-s-ink">Wo?</h2>
                      <div className="mb-2 flex h-12 shrink-0 items-center gap-2 rounded-[14px] border border-s-border bg-white px-3.5">
                        <Search size={18} strokeWidth={2} className="shrink-0 text-s-ink-2" />
                        {/* mockup-ok: !important preserves the existing look
                            (V3-D-input-fill-2026-07-17). english-ok: placeholder text unchanged,
                            pre-existing German copy mirroring the real German-locale UI. */}
                        <input ref={cityRef} value={cityQ} onChange={(e) => setCityQ(e.target.value)} placeholder="Search city"
                          className="min-w-0 flex-1 !border-0 !bg-transparent !min-h-0 !px-0 !text-[15px] text-s-ink placeholder:text-s-ink-2 focus:outline-none focus-visible:outline-none" />
                        {cityQ.length > 0 && <button onClick={() => { setCityQ(""); cityRef.current?.focus(); }} aria-label="Eingabe löschen" className="shrink-0 text-s-ink-2"><X size={18} strokeWidth={2.2} /></button>}
                      </div>
                      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{cityList()}</div>
                    </div>
                  ) : (
                    <div key={s} className="mb-2.5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[20px] bg-white px-4 pb-3 pt-4 shadow-[0_16px_48px_rgba(10,10,10,0.10)]">
                      <h2 className="mb-2 shrink-0 font-heading text-[24px] font-bold leading-tight tracking-[-0.02em] text-s-ink">Wann?</h2>
                      <div className="relative mb-3 flex shrink-0 rounded-full bg-s-bg-sunken p-1">
                        <motion.div layout transition={{ duration: reduce ? 0 : 0.28, ease: EASE }}
                          className="absolute inset-y-1 w-[calc(50%-4px)] rounded-full bg-white shadow-sm" style={{ left: dateTab === "daten" ? 4 : "calc(50% + 0px)" }} />
                        <button onClick={() => setDateTab("daten")} className={`relative z-10 flex-1 rounded-full py-2 text-center text-[13px] transition-colors ${dateTab === "daten" ? "font-semibold text-s-ink" : "font-medium text-s-ink-2"}`}>Daten</button>
                        <button onClick={() => setDateTab("flexibel")} className={`relative z-10 flex-1 rounded-full py-2 text-center text-[13px] transition-colors ${dateTab === "flexibel" ? "font-semibold text-s-ink" : "font-medium text-s-ink-2"}`}>Flexibel</button>
                      </div>
                      <div ref={dateScrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                        <AnimatePresence mode="wait" initial={false}>
                          {dateTab === "daten" ? (
                            <motion.div key="daten" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.18 }}>
                              {/* one month at a time; arrows page forward/back (no stacked months) */}
                              <div className="mb-2 flex items-center justify-between">
                                <p className="font-heading text-[17px] font-bold capitalize text-s-ink">{shownMonth.toLocaleDateString("de-CH", { month: "long" })} {shownMonth.getFullYear()}</p>
                                <div className="flex items-center gap-1">
                                  <button onClick={() => setMonthOffset((o) => Math.max(0, o - 1))} disabled={monthOffset <= 0} aria-label="Vorheriger Monat"
                                    className="grid h-9 w-9 place-items-center rounded-full text-s-ink hover:bg-s-bg-sunken disabled:opacity-25"><ChevronLeft size={20} strokeWidth={2} /></button>
                                  <button onClick={() => setMonthOffset((o) => Math.min(maxMonthOffset, o + 1))} disabled={monthOffset >= maxMonthOffset} aria-label="Nächster Monat"
                                    className="grid h-9 w-9 place-items-center rounded-full text-s-ink hover:bg-s-bg-sunken disabled:opacity-25"><ChevronRight size={20} strokeWidth={2} /></button>
                                </div>
                              </div>
                              <div className="mb-1 grid grid-cols-7 text-center text-[12px] font-medium text-s-ink-2">{WEEKDAYS.map((w, i) => <span key={i}>{w}</span>)}</div>
                              <MonthGrid monthDate={shownMonth} now={now} windowEnd={windowEnd} selKey={selKey} hideHeader onPick={(key, label) => { setSelKey(key); setDate(label); setTimeout(() => dateScrollRef.current?.scrollTo({ top: dateScrollRef.current.scrollHeight, behavior: "smooth" }), 300); }} />
                              {/* time-of-day , reveals once a date is picked (CSS max-height = smooth). Default = none (any time); tap a chip to toggle on/off. */}
                              <div className={`overflow-hidden transition-[max-height,opacity] duration-300 ${selKey ? "max-h-32 opacity-100" : "max-h-0 opacity-0"}`}>
                                <p className="mb-2 mt-3 text-[13px] font-semibold text-s-ink">Uhrzeit</p>
                                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                                  {["Vormittag", "Nachmittag", "Abend"].map((tp) => (
                                    <button key={tp} onClick={() => setPeriod((cur) => (cur === tp ? "" : tp))} className={`shrink-0 rounded-full border px-4 py-2 text-[13px] font-medium transition-colors ${period === tp ? "border-s-accent bg-s-accent text-white" : "border-s-border text-s-ink-2 hover:bg-s-bg-sunken"}`}>{tp}</button>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          ) : (
                            <motion.div key="flexibel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.18 }}
                              className="grid grid-cols-2 gap-2.5 pt-1">
                              {/* selected-ok: blue fill, date-flexibility = date/slot category */}
                              {FLEX_DATES.map((dd) => (
                                <button key={dd} onClick={() => { setDate(dd); setSelKey(null); }} className={`rounded-2xl border py-4 text-center text-[14px] font-medium transition-colors ${date === dd ? "border-s-accent bg-s-accent font-semibold text-white" : "border-s-border text-s-ink-2 hover:bg-s-bg-sunken"}`}>{dd}</button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  ))}
                  {footer()}
                </motion.div>
              )}
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

function MonthGrid({ monthDate, now, windowEnd, selKey, onPick, hideHeader }: {
  monthDate: Date; now: Date; windowEnd: Date; selKey: string | null; onPick: (key: string, label: string) => void; hideHeader?: boolean;
}) {
  const y = monthDate.getFullYear(), m = monthDate.getMonth();
  const monthLong = monthDate.toLocaleDateString("de-CH", { month: "long" });
  const cells = monthGrid(monthDate);
  const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const windowMid = windowEnd.getTime();
  return (
    <div className="mb-2">
      {!hideHeader && <p className="mb-3 font-heading text-[17px] font-bold capitalize text-s-ink">{monthLong} {y}</p>}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const key = `${y}-${m}-${d}`;
          const t = new Date(y, m, d).getTime();
          const disabled = t < todayMid || t > windowMid;
          const isToday = t === todayMid;
          const selected = selKey === key; // selected-ok: locked date-fill is blue s-accent (design contract), not ink
          return (
            <div key={i} className="flex justify-center">
              {disabled ? (
                <span className="grid h-9 w-9 place-items-center text-[14px] text-s-ink-2/35">{d}</span>
              ) : (
                <button onClick={() => onPick(key, `${d}. ${monthLong}`)}
                  className={`grid h-9 w-9 place-items-center rounded-full text-[14px] transition-colors ${selected ? "bg-s-accent font-bold text-white" : isToday ? "font-bold text-s-accent" : "font-medium text-s-ink hover:bg-s-bg-sunken"}`}>{d}</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SuggestRow({ name, sub, Icon, img, tint, onClick, onRemove }: {
  name: string; sub?: string; Icon?: LucideIcon; img?: string; tint?: boolean; onClick: () => void; onRemove?: () => void;
}) {
  // a div (not a button) so the remove-X can be a real nested button without invalid <button> nesting
  return (
    <div className="flex w-full items-center gap-3.5 rounded-2xl pr-1 hover:bg-s-bg-sunken">
      <button onClick={onClick} className="flex min-w-0 flex-1 items-center gap-3.5 py-2.5 text-left">
        {img ? (
          <img src={img} alt="" className="h-12 w-12 shrink-0 object-contain" />
        ) : (
          <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${tint ? "bg-s-accent/10 text-s-accent" : "bg-s-bg-sunken text-s-ink-2"}`}>
            {Icon ? <Icon size={20} strokeWidth={1.9} /> : null}
          </span>
        )}
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-semibold text-s-ink">{name}</span>
          {sub ? <span className="block truncate text-[13px] text-s-ink-2">{sub}</span> : null}
        </span>
      </button>
      {onRemove && (
        <button onClick={onRemove} aria-label="Entfernen" className="grid h-8 w-8 shrink-0 place-items-center text-s-ink-2"><X size={17} strokeWidth={2} /></button>
      )}
    </div>
  );
}
