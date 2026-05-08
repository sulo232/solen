"use client";

import * as React from "react";
import { motion, AnimatePresence, type Transition } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Hero search bar with Dynamic-Island-style expanding segments.
 *
 * State machine:
 *   - idle: 3 collapsed segments + submit button
 *   - service-active: Service segment expanded → category chips + text input
 *   - stadt-active: Stadt segment expanded → city chips + text input
 *   - zeit-active: Zeit segment expanded → time chips
 *
 * Tap segment → expands into picker, others stay visible but compact.
 * Tap backdrop or X → collapses back to idle.
 *
 * Animation pattern from user-supplied DynamicIslandTOC component:
 *   tween cubic-bezier(0.22, 1, 0.36, 1) duration 0.5s
 *   backdrop blur(4px) bg-black/20
 */

type Segment = "service" | "stadt" | "zeit";

const islandTransition: Transition = {
  type: "tween",
  ease: [0.22, 1, 0.36, 1],
  duration: 0.4,
};

const SERVICES = [
  "Coiffeur",
  "Barbershop",
  "Nails",
  "Spa & Wellness",
  "Massage",
  "Maniküre",
  "Pediküre",
  "Färben",
];

const CITIES = ["Basel", "Zürich", "Bern", "Lausanne", "Genf", "Luzern", "St. Gallen", "Winterthur"];

const TIMES = [
  { label: "Jetzt", value: "now" },
  { label: "Heute", value: "today" },
  { label: "Morgen", value: "tomorrow" },
  { label: "Diese Woche", value: "thisweek" },
  { label: "Nächste Woche", value: "nextweek" },
  { label: "Datum wählen", value: "custom" },
];

export function SearchBar() {
  const [active, setActive] = React.useState<Segment | null>(null);
  const [service, setService] = React.useState("");
  const [stadt, setStadt] = React.useState("");
  const [zeit, setZeit] = React.useState("");

  // Lock body scroll when expanded
  React.useEffect(() => {
    if (active) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [active]);

  // Esc key dismisses
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    if (active) {
      document.addEventListener("keydown", onKey);
      return () => document.removeEventListener("keydown", onKey);
    }
  }, [active]);

  return (
    <>
      {/* Backdrop blur overlay when expanded */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={islandTransition}
            className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[4px]"
            onClick={() => setActive(null)}
            aria-hidden
          />
        )}
      </AnimatePresence>

      {/* Search bar — same position, but elevates above backdrop when active */}
      <motion.div
        layout
        transition={islandTransition}
        className={cn(
          "flex w-full max-w-[540px] flex-col rounded-2xl border border-black/5 bg-white p-2",
          "shadow-[0_1px_3px_rgba(50,47,44,0.04),0_4px_12px_rgba(50,47,44,0.04)]",
          "max-md:mx-auto",
          "md:max-w-none md:flex-row md:items-stretch md:rounded-full md:p-[6px_6px_6px_8px]",
          "md:shadow-[0_1px_3px_rgba(50,47,44,0.04),0_8px_24px_rgba(50,47,44,0.08)]",
          // When active, the search bar floats above the backdrop
          active && "relative z-[70]",
        )}
      >
        <SegmentRow
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
              <circle cx={11} cy={11} r={7} />
              <path d="m21 21-4.3-4.3" />
            </svg>
          }
          ariaLabel="Service suchen"
          value={service || "Service"}
          isPlaceholder={!service}
          isActive={active === "service"}
          isFirst
          onClick={() => setActive(active === "service" ? null : "service")}
        >
          {/* Service picker */}
          <input
            type="text"
            autoFocus
            placeholder="Was suchst du?"
            value={service}
            onChange={(e) => setService(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-transparent border-none text-base text-s-ink placeholder:text-s-ink-3 focus:outline-none"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {SERVICES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setService(s);
                  setActive("stadt");
                }}
                className="rounded-full border border-s-ink/10 bg-white px-3 py-1.5 font-body text-[13px] font-medium text-s-ink-2 transition-colors hover:border-s-brand hover:text-s-brand"
              >
                {s}
              </button>
            ))}
          </div>
        </SegmentRow>

        <SegmentRow
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
              <path d="M20 10c0 7-8 13-8 13s-8-6-8-13a8 8 0 0 1 16 0Z" />
              <circle cx={12} cy={10} r={3} />
            </svg>
          }
          ariaLabel="Standort wählen"
          value={stadt || "Stadt"}
          isPlaceholder={!stadt}
          isActive={active === "stadt"}
          onClick={() => setActive(active === "stadt" ? null : "stadt")}
        >
          {/* Stadt picker */}
          <input
            type="text"
            autoFocus
            placeholder="Wo?"
            value={stadt}
            onChange={(e) => setStadt(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-transparent border-none text-base text-s-ink placeholder:text-s-ink-3 focus:outline-none"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {CITIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setStadt(c);
                  setActive("zeit");
                }}
                className="rounded-full border border-s-ink/10 bg-white px-3 py-1.5 font-body text-[13px] font-medium text-s-ink-2 transition-colors hover:border-s-brand hover:text-s-brand"
              >
                {c}
              </button>
            ))}
          </div>
        </SegmentRow>

        <SegmentRow
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
              <rect x={3} y={4} width={18} height={18} rx={2} />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          }
          ariaLabel="Zeit wählen"
          value={zeit || "Zeit"}
          isPlaceholder={!zeit}
          isActive={active === "zeit"}
          onClick={() => setActive(active === "zeit" ? null : "zeit")}
        >
          {/* Zeit picker — chip selector */}
          <div className="flex flex-wrap gap-2 pt-1">
            {TIMES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setZeit(t.label);
                  setActive(null);
                }}
                className={cn(
                  "rounded-full border px-4 py-2 font-body text-[14px] font-medium transition-colors",
                  zeit === t.label
                    ? "border-s-brand bg-s-brand text-white"
                    : "border-s-ink/10 bg-white text-s-ink-2 hover:border-s-brand hover:text-s-brand",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </SegmentRow>

        {/* Submit — hidden when expanded; submit happens via segment-flow chains */}
        <button
          type="button"
          className={cn(
            "font-body shrink-0 rounded-full border-0 bg-s-brand p-4 font-semibold text-white transition-colors",
            "hover:bg-s-brand-mid",
            "md:px-7",
          )}
        >
          Solen durchsuchen
        </button>
      </motion.div>

      {/* Floating close button when expanded */}
      <AnimatePresence>
        {active && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={islandTransition}
            onClick={() => setActive(null)}
            aria-label="Schliessen"
            className="fixed right-4 top-4 z-[80] grid h-11 w-11 place-items-center rounded-full border border-black/5 bg-white text-s-ink shadow-md hover:bg-s-bg-sunken md:right-6 md:top-6"
          >
            <X size={20} />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}

interface SegmentRowProps {
  icon: React.ReactNode;
  ariaLabel: string;
  value: string;
  isPlaceholder: boolean;
  isActive: boolean;
  isFirst?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function SegmentRow({
  icon,
  ariaLabel,
  value,
  isPlaceholder,
  isActive,
  isFirst,
  onClick,
  children,
}: SegmentRowProps) {
  return (
    <motion.div
      layout
      transition={islandTransition}
      className={cn(
        "shrink-0 cursor-pointer rounded-[10px]",
        isActive ? "bg-s-brand/[0.05]" : "hover:bg-s-bg-sunken",
        !isFirst && "border-t border-black/5 max-md:border-t md:border-t-0",
        "md:flex-1 md:rounded-full md:border-t-0",
      )}
    >
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={isActive}
        onClick={onClick}
        className={cn(
          "flex w-full items-center text-left",
          "p-[14px_16px]",
          "md:p-[14px_22px]",
        )}
      >
        <span className="flex shrink-0 items-center justify-center pr-3 text-s-ink-2 border-r border-black/10">
          {icon}
        </span>
        <span
          className={cn(
            "font-body min-w-0 flex-1 truncate text-base text-s-ink-3 pl-4",
            isPlaceholder ? "font-normal" : "font-medium",
          )}
        >
          {value}
        </span>
      </button>

      {/* Expanded picker content — animated */}
      <AnimatePresence initial={false}>
        {isActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={islandTransition}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
