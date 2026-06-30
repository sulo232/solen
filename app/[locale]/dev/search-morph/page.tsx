"use client";

// exists-check: net-new dev PREVIEW route (no match in `npm run exists search-morph`). Sibling to the
// other app/[locale]/dev/* preview pages. A faithful Airbnb-style search ACCORDION mockup for OUR search
// (Service / Standort / Datum steps that expand INLINE, the others collapse to rows) using our real
// SERVICES + CITIES data + recents, with the in-place top-anchored MORPH + BLURRED backdrop. Preview only,
// not linked in nav, does not touch the live homepage SearchBar. Owner: "make it like Airbnb" (2026-06-30).

import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, MapPin, Calendar, Navigation, X, ChevronRight,
  Scissors, Leaf, Hand, Footprints, Palette, Gem, type LucideIcon,
} from "lucide-react";

const EASE = [0.32, 0.72, 0, 1] as const;

// real service set (SearchBar.tsx); banned Sparkles/Star/Zap glyphs swapped for safe ones
const SERVICES: { label: string; Icon: LucideIcon }[] = [
  { label: "Coiffeur", Icon: Scissors }, { label: "Barbershop", Icon: Scissors },
  { label: "Nails", Icon: Gem }, { label: "Spa & Wellness", Icon: Leaf },
  { label: "Massage", Icon: Hand }, { label: "Maniküre", Icon: Gem },
  { label: "Pediküre", Icon: Footprints }, { label: "Färben", Icon: Palette },
];
const CITIES = ["Basel", "Zürich", "Bern", "Lausanne", "Genf", "Luzern", "St. Gallen", "Winterthur"];
const RECENTS = ["Coiffeur", "Nails", "Massage Bern"];
const DATES = ["Heute", "Morgen", "Diese Woche", "Wochenende", "Flexibel"];

type Step = "service" | "location" | "date";

export default function SearchMorphPreviewPage() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("service");
  const [service, setService] = useState("");
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");

  const pick = (s: Step, set: (v: string) => void, v: string) => {
    set(v);
    const order: Step[] = ["service", "location", "date"];
    const next = order[order.indexOf(s) + 1];
    setTimeout(() => next && setStep(next), 200);
  };

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
          <>
            {/* blurred backdrop */}
            <motion.div
              key="scrim"
              className="fixed inset-0 z-[60] bg-s-ink/15 backdrop-blur-xl"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              onClick={() => setOpen(false)}
            />
            {/* the panel , morphs in place, top-anchored (grows from the bar), NOT a bottom sheet */}
            <motion.div
              key="panel"
              className="fixed inset-x-2 top-[11%] bottom-2 z-[61] flex flex-col overflow-hidden rounded-[28px] bg-s-bg-sunken shadow-[0_26px_80px_rgba(10,10,10,0.24)]"
              style={{ transformOrigin: "top center" }}
              initial={{ opacity: 0, scale: 0.96, y: -12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -12 }}
              transition={{ duration: 0.42, ease: EASE }}
            >
              <div className="flex items-center justify-between px-5 pb-3 pt-5">
                <h2 className="font-heading text-[19px] font-extrabold tracking-[-0.02em] text-s-ink">Suche</h2>
                <button onClick={() => setOpen(false)} aria-label="Schliessen"
                  className="grid h-9 w-9 place-items-center rounded-full border border-s-border bg-white text-s-ink">
                  <X size={16} strokeWidth={2.2} />
                </button>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto px-3 pb-3">
                {/* SERVICE */}
                <StepCard active={step === "service"} icon={Search} label="Service" value={service} placeholder="Was suchst du?" onOpen={() => setStep("service")}>
                  <input autoFocus placeholder="Service, Salon oder Stylist:in"
                    className="mb-3 w-full rounded-[14px] border border-s-border bg-white px-4 py-3 text-[15px] text-s-ink placeholder:text-s-ink-3 focus:border-s-ink focus:outline-none"
                    onChange={(e) => setService(e.target.value)} />
                  <div className="flex flex-wrap gap-2">
                    {SERVICES.map(({ label, Icon }) => (
                      <button key={label} onClick={() => pick("service", setService, label)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] transition-colors ${service === label ? "border-s-border bg-s-bg-sunken font-semibold text-s-ink" : "border-s-border bg-white text-s-ink-2 hover:bg-s-bg-sunken"}`}>
                        <Icon size={13} strokeWidth={2} /> {label}
                      </button>
                    ))}
                  </div>
                  <p className="mb-2 mt-4 text-[12px] font-medium text-s-ink-3">Zuletzt gesucht</p>
                  <div className="flex flex-wrap gap-2">
                    {RECENTS.map((r) => (
                      <button key={r} onClick={() => pick("service", setService, r)}
                        className="rounded-full border border-s-border bg-white px-3.5 py-2 text-[13px] text-s-ink-2 hover:bg-s-bg-sunken">{r}</button>
                    ))}
                  </div>
                </StepCard>

                {/* LOCATION */}
                <StepCard active={step === "location"} icon={MapPin} label="Standort" value={city} placeholder="Stadt hinzufügen" onOpen={() => setStep("location")}>
                  <button onClick={() => pick("location", setCity, "In der Nähe")}
                    className="mb-1 flex w-full items-center gap-3 rounded-xl py-3 text-left hover:bg-s-bg-sunken">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-s-accent/10 text-s-accent"><Navigation size={16} /></span>
                    <span className="text-[15px] font-semibold text-s-accent">Aktuellen Standort verwenden</span>
                  </button>
                  <div className="max-h-[32vh] overflow-y-auto">
                    {CITIES.map((c) => (
                      <button key={c} onClick={() => pick("location", setCity, c)}
                        className={`flex w-full items-center gap-3 rounded-xl px-1 py-2.5 text-left hover:bg-s-bg-sunken ${city === c ? "bg-s-bg-sunken" : ""}`}>
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-s-bg-sunken text-s-ink-2"><MapPin size={15} /></span>
                        <span className="text-[15px] text-s-ink">{c}</span>
                      </button>
                    ))}
                  </div>
                </StepCard>

                {/* DATE */}
                <StepCard active={step === "date"} icon={Calendar} label="Datum" value={date} placeholder="Jederzeit" onOpen={() => setStep("date")}>
                  <div className="flex flex-wrap gap-2">
                    {DATES.map((d) => (
                      <button key={d} onClick={() => setDate(d)}
                        className={`rounded-full border px-4 py-2 text-[13px] transition-colors ${date === d ? "border-s-border bg-s-bg-sunken font-semibold text-s-ink" : "border-s-border bg-white text-s-ink-2 hover:bg-s-bg-sunken"}`}>{d}</button>
                    ))}
                  </div>
                </StepCard>
              </div>

              {/* selected-ok: this is the ONE primary commit CTA, ink per the design contract (not a selected state) */}
              <div className="border-t border-s-border bg-white px-4 pb-5 pt-3">
                <button className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-s-ink font-heading text-[15px] font-bold text-white active:scale-[0.98]">
                  <Search size={17} strokeWidth={2.2} /> Termine finden
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function StepCard({ active, icon: Icon, label, value, placeholder, onOpen, children }: {
  active: boolean; icon: LucideIcon; label: string; value: string; placeholder: string;
  onOpen: () => void; children: ReactNode;
}) {
  return (
    <motion.div layout transition={{ duration: 0.42, ease: EASE }}
      className={`overflow-hidden rounded-[20px] bg-white ${active ? "shadow-[0_10px_30px_rgba(10,10,10,0.10)]" : "border border-s-border"}`}>
      <button onClick={onOpen} className="flex w-full items-center justify-between px-5 py-4 text-left">
        <span className="flex items-center gap-3">
          <Icon size={20} strokeWidth={2} className="text-s-ink-3" />
          <span>
            <span className="block text-[12px] font-medium text-s-ink-3">{label}</span>
            <span className={`block text-[16px] font-semibold ${value ? "text-s-ink" : "text-s-ink-3"}`}>{value || placeholder}</span>
          </span>
        </span>
        {!active && <ChevronRight size={18} className="text-s-ink-3" />}
      </button>
      <AnimatePresence initial={false}>
        {active && (
          <motion.div key="body" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }} className="px-5 pb-5">
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
