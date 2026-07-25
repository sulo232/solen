"use client";

// exists-check: `npm run exists "motion gallery snap glide demo"` (2026-07-25), 0 matches.
// COPIED from the real `components-legacy/salon/SalonModeToggle.tsx` per the task brief
// ("copy it into _parts rather than editing it"), not a duplicate left to drift: this file is
// scoped to /dev/motion only and the real component is untouched. Two changes from the original:
// (1) the real component crossfades each segment's own `bg-white` independently, it never
// actually TRAVELS between segments , this copy adds a single travelling indicator so the "state
// flip vs travel" comparison has something to measure; (2) the real component's de/en/fr/it
// `COPY` record is authored chrome baked into the file (not live data), so under /dev it must be
// English per the mockup-english-gate , "Book" / "Walk-in" stand in for "Termin" / "Walk-in".
import type { ReactNode } from "react";
import { Calendar, Footprints } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

type Mode = "book" | "walkin";

export function ModeToggleCopy({
  mode,
  onChange,
  durationS,
  ease,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
  durationS: number;
  ease: readonly number[];
}) {
  const segs: { key: Mode; label: string; icon: ReactNode }[] = [
    { key: "book", label: "Book", icon: <Calendar className="w-[18px] h-[18px]" /> },
    { key: "walkin", label: "Walk-in", icon: <Footprints size={19} strokeWidth={2.25} /> },
  ];
  const activeIndex = segs.findIndex((s) => s.key === mode);

  return (
    <div className="relative flex rounded-btn bg-s-sand p-1">
      <motion.div
        aria-hidden
        className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-btn bg-white shadow-[0_1px_3px_rgba(0,0,0,.12)]"
        animate={{ x: activeIndex === 0 ? 0 : "calc(100% + 4px)" }}
        transition={{ duration: durationS, ease: [...ease] as [number, number, number, number] }}
      />
      {segs.map(({ key, label, icon }) => {
        const active = mode === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-pressed={active}
            className={cn(
              "relative z-10 flex flex-1 items-center justify-center gap-2 h-11 rounded-btn font-heading text-[15px]",
              active ? "text-s-ink font-semibold" : "text-s-ink-2 font-medium",
            )}
          >
            {icon}
            {label}
          </button>
        );
      })}
    </div>
  );
}
