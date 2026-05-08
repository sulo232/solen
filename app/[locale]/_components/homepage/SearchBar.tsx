"use client";

import * as React from "react";
import { motion, AnimatePresence, type Transition } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Hero search bar — Dynamic-Island-style morphing pill.
 *
 * Animation architecture (matches user-supplied DynamicIslandTOC reference):
 *   - ONE container morphs between explicit width/height/borderRadius values
 *     (NOT `layout` animation — explicit values are smoother & predictable)
 *   - TWO content layers stacked absolutely inside the morphing container
 *   - Cross-fade between layers with STAGGER DELAY (0.1s):
 *       collapsed → expanded: collapsed fades out 0s, expanded fades in 0.1s
 *       expanded → collapsed: expanded fades out 0s, collapsed fades in 0.1s
 *     The 0.1s stagger creates the "hand-off" feel — neither layer fights
 *     the other for visibility during the morph.
 *   - `overflow-hidden` on the morphing container clips content during morph
 *
 * Tween: cubic-bezier(0.22, 1, 0.36, 1) duration 0.5s — same as reference.
 */

type Segment = "service" | "stadt" | "zeit";

const islandTransition: Transition = {
  type: "tween",
  ease: [0.22, 1, 0.36, 1],
  duration: 0.5,
};

// Explicit heights per state — animations are smoother w fixed values vs height:auto
const COLLAPSED_HEIGHT = 280; // 3 rows × ~62px + button + padding
const EXPANDED_HEIGHT = 480; // header + picker content

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

  const isExpanded = active !== null;

  return (
    <>
      {/* Backdrop blur overlay */}
      <AnimatePresence>
        {isExpanded && (
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

      {/* Morphing container — animates height + borderRadius w explicit values */}
      <motion.div
        initial={false}
        animate={{
          height: isExpanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT,
          borderRadius: 16,
        }}
        transition={islandTransition}
        className={cn(
          "relative w-full max-w-[540px] overflow-hidden border border-black/5 bg-white",
          "shadow-[0_1px_3px_rgba(50,47,44,0.04),0_4px_12px_rgba(50,47,44,0.04)]",
          "max-md:mx-auto",
          isExpanded && "z-[70] md:max-w-[640px]",
          !isExpanded && "md:max-w-none",
          // Desktop pill morphs less drastically — keep it pill-shaped at idle
          !isExpanded && "md:!rounded-full md:!h-auto",
        )}
      >
        {/* COLLAPSED LAYER — 3 segments + submit button */}
        <motion.div
          initial={false}
          animate={{
            opacity: isExpanded ? 0 : 1,
            scale: isExpanded ? 0.95 : 1,
            filter: isExpanded ? "blur(4px)" : "blur(0px)",
          }}
          transition={{ ...islandTransition, delay: isExpanded ? 0 : 0.1 }}
          className={cn(
            "absolute inset-0 flex flex-col p-2 md:flex-row md:items-stretch md:p-[6px_6px_6px_8px]",
            isExpanded && "pointer-events-none",
          )}
        >
          <CollapsedRow
            icon={<IconSearch />}
            ariaLabel="Service suchen"
            value={service || "Service"}
            isPlaceholder={!service}
            isFirst
            onClick={() => setActive("service")}
          />
          <CollapsedRow
            icon={<IconPin />}
            ariaLabel="Standort wählen"
            value={stadt || "Stadt"}
            isPlaceholder={!stadt}
            onClick={() => setActive("stadt")}
          />
          <CollapsedRow
            icon={<IconCalendar />}
            ariaLabel="Zeit wählen"
            value={zeit || "Zeit"}
            isPlaceholder={!zeit}
            onClick={() => setActive("zeit")}
          />
          <button
            type="button"
            className="font-body shrink-0 rounded-full border-0 bg-s-brand p-4 font-semibold text-white transition-colors hover:bg-s-brand-mid md:px-7"
          >
            Solen durchsuchen
          </button>
        </motion.div>

        {/* EXPANDED LAYER — active segment's picker */}
        <motion.div
          initial={false}
          animate={{
            opacity: isExpanded ? 1 : 0,
            scale: isExpanded ? 1 : 1.05,
          }}
          transition={{ ...islandTransition, delay: isExpanded ? 0.1 : 0 }}
          className={cn(
            "absolute inset-0 flex flex-col",
            !isExpanded && "pointer-events-none",
          )}
        >
          {/* Header w segment tabs + close */}
          <div className="flex items-center justify-between gap-2 border-b border-black/5 px-5 py-4">
            <div className="flex gap-1">
              <SegmentTab
                active={active === "service"}
                onClick={() => setActive("service")}
                label={service || "Service"}
                isPlaceholder={!service}
              />
              <SegmentTab
                active={active === "stadt"}
                onClick={() => setActive("stadt")}
                label={stadt || "Stadt"}
                isPlaceholder={!stadt}
              />
              <SegmentTab
                active={active === "zeit"}
                onClick={() => setActive("zeit")}
                label={zeit || "Zeit"}
                isPlaceholder={!zeit}
              />
            </div>
            <button
              type="button"
              onClick={() => setActive(null)}
              aria-label="Schliessen"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-s-ink-3 transition-colors hover:bg-s-bg-sunken hover:text-s-ink"
            >
              <X size={18} />
            </button>
          </div>

          {/* Picker content — cross-fades when active segment changes */}
          <div className="flex-1 overflow-y-auto px-5 py-5">
            <AnimatePresence mode="wait" initial={false}>
              {active === "service" && (
                <motion.div
                  key="service"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                  <input
                    type="text"
                    autoFocus
                    placeholder="Was suchst du?"
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    className="w-full border-b border-black/5 bg-transparent pb-3 font-display text-[24px] font-black text-s-ink placeholder:text-s-ink-3 focus:outline-none focus:border-s-brand"
                  />
                  <div className="mt-5 flex flex-wrap gap-2">
                    {SERVICES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setService(s);
                          setActive("stadt");
                        }}
                        className="rounded-full border border-s-ink/10 bg-white px-4 py-2 font-body text-[14px] font-medium text-s-ink-2 transition-colors hover:border-s-brand hover:text-s-brand"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {active === "stadt" && (
                <motion.div
                  key="stadt"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                  <input
                    type="text"
                    autoFocus
                    placeholder="Wo?"
                    value={stadt}
                    onChange={(e) => setStadt(e.target.value)}
                    className="w-full border-b border-black/5 bg-transparent pb-3 font-display text-[24px] font-black text-s-ink placeholder:text-s-ink-3 focus:outline-none focus:border-s-brand"
                  />
                  <div className="mt-5 flex flex-wrap gap-2">
                    {CITIES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setStadt(c);
                          setActive("zeit");
                        }}
                        className="rounded-full border border-s-ink/10 bg-white px-4 py-2 font-body text-[14px] font-medium text-s-ink-2 transition-colors hover:border-s-brand hover:text-s-brand"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {active === "zeit" && (
                <motion.div
                  key="zeit"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="font-display text-[24px] font-black text-s-ink mb-5">
                    Wann?
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {TIMES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => {
                          setZeit(t.label);
                          setActive(null);
                        }}
                        className={cn(
                          "rounded-full border px-5 py-2.5 font-body text-[14px] font-medium transition-colors",
                          zeit === t.label
                            ? "border-s-brand bg-s-brand text-white"
                            : "border-s-ink/10 bg-white text-s-ink-2 hover:border-s-brand hover:text-s-brand",
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer w submit */}
          <div className="border-t border-black/5 p-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setService("");
                setStadt("");
                setZeit("");
              }}
              className="font-body text-[14px] font-semibold text-s-ink-3 underline-offset-2 px-3 py-2 hover:text-s-ink transition-colors"
            >
              Zurücksetzen
            </button>
            <button
              type="button"
              className="font-body shrink-0 rounded-full border-0 bg-s-brand px-6 py-3 font-semibold text-white transition-colors hover:bg-s-brand-mid"
            >
              Suchen
            </button>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}

/**
 * Compact row for the collapsed state. Same visual as before — divider line +
 * icon + value. Click triggers expand.
 */
function CollapsedRow({
  icon,
  ariaLabel,
  value,
  isPlaceholder,
  isFirst,
  onClick,
}: {
  icon: React.ReactNode;
  ariaLabel: string;
  value: string;
  isPlaceholder: boolean;
  isFirst?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        "group flex shrink-0 cursor-pointer items-center text-left",
        "rounded-[10px] p-[14px_16px]",
        "transition-colors hover:bg-s-bg-sunken",
        !isFirst && "border-t border-black/5 max-md:border-t md:border-t-0",
        "md:flex-1 md:rounded-full md:border-t-0 md:p-[14px_22px]",
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
  );
}

/**
 * Header tab inside the expanded state. Switches active segment.
 */
function SegmentTab({
  active,
  onClick,
  label,
  isPlaceholder,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  isPlaceholder: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 font-body text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors",
        active && "bg-s-brand text-white",
        !active && isPlaceholder && "text-s-ink-3 hover:text-s-ink",
        !active && !isPlaceholder && "text-s-ink hover:bg-s-bg-sunken",
      )}
    >
      {label}
    </button>
  );
}

// --- Icons ---
function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <circle cx={11} cy={11} r={7} />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
function IconPin() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <path d="M20 10c0 7-8 13-8 13s-8-6-8-13a8 8 0 0 1 16 0Z" />
      <circle cx={12} cy={10} r={3} />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <rect x={3} y={4} width={18} height={18} rx={2} />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
