"use client";

// exists-check: net-new dev PREVIEW route (no match in `npm run exists search-morph`). Faithful Airbnb
// mobile-search clone (refs IMG_6228/6229/6230, measured 2026-06-30) with OUR tokens. STRUCTURE = Airbnb
// (scrim + top-crop bottom-sheet, drag-to-dismiss, accordion + one open step, scroll/tap MORPHS the step
// into the full search , the bar slides up and the heading/other steps/footer collapse, no subtree swap,
// no card). AESTHETIC = Solen tokens. USES THE EXISTING DATA (CATEGORIES, SEARCH_CITIES, CITY_ICONS,
// TRENDING, FEATURED_SALONS, useSearchSuggest). Preview only, not linked in nav.

import { useState, useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { notFound } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion, useMotionValue, useTransform, animate } from "motion/react";
import { Search, MapPin, Navigation, X, Clock, User, ArrowLeft, Store, type LucideIcon } from "lucide-react";
import { CATEGORIES } from "@/app/[locale]/_components/homepage/searchCategories";
import { FEATURED_SALONS } from "@/app/[locale]/_components/homepage/searchFeatured";
import { SEARCH_CITIES, CITY_ICONS } from "@/lib/cities";
import { TRENDING } from "@/app/[locale]/_components/homepage/searchTrending";
import { useSearchSuggest } from "@/app/[locale]/_components/homepage/useSearchSuggest";
import { Skeleton } from "@/app/[locale]/_components/primitives";

const EASE = [0.32, 0.72, 0, 1] as const;
// tweens, NOT springs , owner: "too bouncy". A smooth ease-out has no overshoot/bounce.
const OPEN_T = { duration: 0.4, ease: EASE } as const;
const MORPH_T = { duration: 0.28, ease: EASE } as const;
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
  const [inputFocused, setInputFocused] = useState(false); // service/location: the bar floated up + full list
  const [service, setService] = useState("");
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const [serviceQ, setServiceQ] = useState("");
  const [cityQ, setCityQ] = useState("");
  const [dateTab, setDateTab] = useState<"daten" | "flexibel">("daten");
  const [selKey, setSelKey] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const reduce = useReducedMotion();
  const serviceRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLInputElement>(null);
  const [safeTop, setSafeTop] = useState(0); // measured env(safe-area-inset-top)
  const expand = useMotionValue(0); // 0 = accordion, 1 = focused; the UP-drag drives this so the panel GROWS following the finger
  const cropTop = useTransform(expand, [0, 1], [58, 16]); // the sheet BG crop follows the gesture (px from top)
  const contentPad = useTransform(cropTop, (t) => Math.max(0, safeTop - t)); // keep the bar/list below the notch even as the sheet bg rises under it

  useEffect(() => setMounted(true), []); // portal target ready , escape the page stacking context
  useEffect(() => { // measure the device safe-area once so the sheet content never hides under the notch / dynamic island
    const probe = document.createElement("div");
    probe.style.cssText = "position:fixed;top:0;height:env(safe-area-inset-top,0px);visibility:hidden;pointer-events:none";
    document.body.appendChild(probe);
    setSafeTop(Math.round(probe.getBoundingClientRect().height) || 0);
    probe.remove();
  }, []);
  // hide the /dev app-shell header so the crop shows only the (blurred) homepage , removes the duplicate dimmed back arrow that glitches
  useEffect(() => {
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
  // focus the live input when the step morphs into focused search (tap OR scroll)
  useEffect(() => {
    if (!inputFocused) return;
    (activeStep === "location" ? cityRef : serviceRef).current?.focus();
  }, [inputFocused, activeStep]);
  // keep the crop in sync with the committed state , tap-to-focus animates the same grow; back animates it down
  useEffect(() => {
    const target = inputFocused && (activeStep === "service" || activeStep === "location") ? 1 : 0;
    const c = animate(expand, target, reduce ? { duration: 0 } : { duration: 0.3, ease: EASE });
    return () => c.stop();
  }, [inputFocused, activeStep, reduce, expand]);

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

  if (process.env.NODE_ENV === "production") notFound(); // dev preview only , real 404 in production

  const openT = reduce ? { duration: 0 } : OPEN_T;
  const morphT = reduce ? { duration: 0 } : MORPH_T;

  // ── suggestion lists (capped preview in the step, full when morphed open) ──
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
        {(full ? CATEGORIES : CATEGORIES.slice(0, 3)).map((c) => (
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

  // ── the search bar (service/location). Same element in both states , it MORPHS (layout) ──
  const bar = (s: Step): ReactNode => {
    const isS = s === "service";
    const q = isS ? serviceQ : cityQ;
    const setQ = isS ? setServiceQ : setCityQ;
    const ref = isS ? serviceRef : cityRef;
    const ph = isS ? "Service, Salon oder Stylist:in" : "Stadt suchen";
    return (
      <motion.div layout="position" transition={morphT}
        className={`mb-3 flex h-12 items-center gap-1.5 rounded-[14px] border border-s-border bg-white ${focusedSearch ? "pl-1 pr-1.5" : "px-4"}`}>
        {focusedSearch ? (
          <button onClick={() => setInputFocused(false)} aria-label="Zurück"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-s-ink hover:bg-s-bg-sunken"><ArrowLeft size={18} strokeWidth={2} /></button>
        ) : (
          <Search size={18} strokeWidth={2} className="shrink-0 text-s-ink-3" />
        )}
        <input ref={ref} value={focusedSearch ? q : (isS ? service : city)} readOnly={!focusedSearch}
          onFocus={() => setInputFocused(true)} onClick={() => setInputFocused(true)}
          onChange={(e) => setQ(e.target.value)} placeholder={ph}
          className="min-w-0 flex-1 border-0 bg-transparent px-0 text-[15px] text-s-ink placeholder:text-s-ink-3 focus:outline-none focus-visible:border-s-border focus-visible:shadow-none focus-visible:outline-none" />
        {focusedSearch && q.length > 0 && (
          <button onClick={() => { setQ(""); ref.current?.focus(); }} aria-label="Eingabe löschen"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-s-bg-sunken text-s-ink-2"><X size={15} strokeWidth={2.4} /></button>
        )}
      </motion.div>
    );
  };

  // ── the open step: service/location morph (heading collapses, bar slides up, list grows); date = calendar ──
  const activePanel = (s: Step): ReactNode => {
    if (s === "date") {
      return (
        <div className="p-4">
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
    }
    // service / location , the morphing step
    return (
      <div className="flex flex-col p-4">
        <AnimatePresence initial={false}>
          {!focusedSearch && (
            <motion.div key="heading" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              transition={morphT} className="overflow-hidden">
              <h2 className="mb-3 font-heading text-[24px] font-bold leading-tight tracking-[-0.02em] text-s-ink">
                {s === "service" ? "Wonach suchst du?" : "Wo?"}
              </h2>
            </motion.div>
          )}
        </AnimatePresence>
        {bar(s)}
        <div className={focusedSearch ? "" : "max-h-[36vh] overflow-hidden"}>
          {s === "service" ? serviceSuggestions(focusedSearch) : cityList()}
        </div>
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
      <div className="mx-auto max-w-[430px] px-5 pt-14">
        <p className="mb-1.5 text-[13px] font-medium text-s-ink-3">Beauty und Wellness in der ganzen Schweiz</p>
        <h1 className="mb-5 font-heading text-[24px] font-bold leading-tight tracking-[-0.02em] text-s-ink">Termine, sofort bestätigt.</h1>
        <button type="button" onClick={() => { setActiveStep("service"); setInputFocused(false); setOpen(true); }}
          className="flex w-full items-center gap-2.5 rounded-full border border-s-border bg-white px-5 py-3.5 text-[15px] text-s-ink-3">
          <Search size={18} strokeWidth={2} /> Service, Stadt, Datum
        </button>
        {/* faux homepage behind the overlay , gives the frosted backdrop real content to blur (the real SearchOverlay sits over the live homepage) */}
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
              <p className="truncate text-[12px] text-s-ink-3">{s.address}</p>
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
              className={`fixed right-4 top-[max(14px,env(safe-area-inset-top))] z-[102] grid h-9 w-9 place-items-center rounded-full border border-s-border bg-white text-s-ink ${focusedSearch ? "pointer-events-none" : ""}`}
              initial={{ opacity: 0 }} animate={{ opacity: focusedSearch ? 0 : 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.25 }}>
              <X size={17} strokeWidth={2.2} />
            </motion.button>,

            <motion.div key="sheet"
              drag="y" dragListener={!focusedSearch}
              dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0.04, bottom: 0.55 }}
              onDrag={(_e, info) => { if (!focusedSearch) expand.set(info.offset.y < 0 ? Math.min(1, -info.offset.y / 180) : 0); }}
              onDragEnd={(_e, info) => {
                if (info.offset.y > 140 || info.velocity.y > 600) { close(); return; }
                // a SWIPE/flick up (low velocity bar) OR a modest drag snaps it fully open , a swipe expands all the way, not just as far as you dragged
                if (!focusedSearch && (info.offset.y < -40 || info.velocity.y < -250) && (activeStep === "service" || activeStep === "location")) { setInputFocused(true); }
                else { animate(expand, focusedSearch ? 1 : 0, reduce ? { duration: 0 } : { duration: 0.26, ease: EASE }); }
              }}
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={openT}
              style={{ top: cropTop, paddingTop: contentPad }}
              className={`fixed inset-x-0 bottom-0 z-[101] flex flex-col overflow-hidden transition-colors duration-300 ${focusedSearch ? "rounded-t-[20px] bg-white" : "bg-transparent"}`}>
              {!focusedSearch && (
                <div className="flex shrink-0 justify-center pb-1 pt-2.5">
                  <span className="h-1 w-9 rounded-full bg-s-border" />
                </div>
              )}

              {focusedSearch ? (
                /* FOCUSED (Airbnb): bar PINNED (shrink-0, never scrolls), full list scrolls UNDER it.
                   Invariant: focusedSearch is service/location-only (see derivation), so bar(activeStep) here is never the date step.
                   Drag-to-dismiss is intentionally accordion-only; the focused state exits via the in-bar back arrow. */
                <>
                  <div className="shrink-0 px-3 pb-2 pt-2">{bar(activeStep)}</div>
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-5">
                    {activeStep === "location" ? cityList() : serviceSuggestions(true)}
                  </div>
                </>
              ) : (
                /* ACCORDION: frosted floating cards (active panel + thin step bars) + footer */
                <>
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pt-1">
                    <motion.div layout="position" className="flex flex-col gap-2.5 pb-3">
                      {STEPS.map((s) => (
                        <motion.div key={s} layout="position" transition={morphT}
                          className="overflow-hidden rounded-[20px] bg-white shadow-[0_16px_48px_rgba(10,10,10,0.10)]">
                          {activeStep === s ? (
                            activePanel(s)
                          ) : (
                            <button onClick={() => openStep(s)}
                              className="flex h-14 w-full items-center justify-between px-4 text-left">
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
                  <div className="shrink-0 px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3">
                    <div className="flex items-center justify-between">
                      <button onClick={reset} className="text-[14px] font-semibold text-s-ink underline-offset-4 hover:underline">Zurücksetzen</button>
                      <button onClick={close} className={COMMIT_BTN}>
                        <Search size={16} strokeWidth={2.2} /> Suchen
                      </button>
                    </div>
                  </div>
                </>
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
          const disabled = t < todayMid || t > windowMid;
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
