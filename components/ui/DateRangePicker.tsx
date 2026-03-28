"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

export interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

function toInputValue(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function DateRangePicker({ value, onChange, className = "" }: DateRangePickerProps) {
  const t = useTranslations("dashboard");
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(toInputValue(value.from));
  const [to, setTo] = useState(toInputValue(value.to));
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const PRESETS = [
    { label: t("rangeThisWeek"), days: 7 },
    { label: t("rangeThisMonth"), days: 30 },
    { label: t("rangeLastMonth"), days: 60 },
    { label: t("rangeQuarter"), days: 90 },
  ];

  function applyPreset(days: number) {
    const end = new Date();
    const start = new Date(end.getTime() - days * 86400000);
    setFrom(toInputValue(start));
    setTo(toInputValue(end));
    onChange({ from: start, to: end });
    setOpen(false);
  }

  function applyCustom() {
    const fromDate = new Date(from + "T00:00:00");
    const toDate = new Date(to + "T23:59:59");
    if (!isNaN(fromDate.getTime()) && !isNaN(toDate.getTime()) && fromDate <= toDate) {
      onChange({ from: fromDate, to: toDate });
      setOpen(false);
    }
  }

  const displayLabel = `${new Date(from).toLocaleDateString("de-CH", { day: "2-digit", month: "short" })} – ${new Date(to).toLocaleDateString("de-CH", { day: "2-digit", month: "short", year: "numeric" })}`;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-btn border border-s-ink/[0.10] dark:border-white/10 bg-white dark:bg-s-dm-surface text-[11px] font-heading font-bold text-s-ink/70 dark:text-s-dm-text/70 hover:border-s-coral/40 transition-colors"
        aria-label={displayLabel}
      >
        <Calendar size={12} className="text-s-ink/40" />
        <span>{displayLabel}</span>
        <ChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-1 right-0 z-50 bg-white dark:bg-s-dm-surface rounded-[12px] border border-s-ink/[0.08] dark:border-white/[0.08] shadow-warm-md p-4 min-w-[240px]">
          {/* Presets */}
          <p className="text-[8px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/30 mb-2">
            {t("quickRange")}
          </p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {PRESETS.map((p) => (
              <button
                key={p.days}
                onClick={() => applyPreset(p.days)}
                className="px-2.5 py-1 rounded-pill text-[10px] font-heading font-bold bg-s-ink/[0.05] dark:bg-white/[0.06] text-s-ink/60 dark:text-s-dm-text/60 hover:bg-s-coral/10 hover:text-s-coral transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom range */}
          <p className="text-[8px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/30 mb-2">
            {t("customRange")}
          </p>
          <div className="space-y-2 mb-3">
            <div>
              <label className="block text-[9px] text-s-ink/40 mb-1">{t("from")}</label>
              <input
                type="date"
                value={from}
                max={to}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-btn border border-s-ink/[0.10] dark:border-white/10 bg-transparent text-[11px] text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral"
              />
            </div>
            <div>
              <label className="block text-[9px] text-s-ink/40 mb-1">{t("to")}</label>
              <input
                type="date"
                value={to}
                min={from}
                onChange={(e) => setTo(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-btn border border-s-ink/[0.10] dark:border-white/10 bg-transparent text-[11px] text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral"
              />
            </div>
          </div>
          <button
            onClick={applyCustom}
            className="w-full py-1.5 rounded-btn bg-s-coral text-white text-[11px] font-heading font-bold hover:brightness-[1.06] active:scale-[0.98] transition-all"
          >
            {t("applyRange")}
          </button>
        </div>
      )}
    </div>
  );
}
