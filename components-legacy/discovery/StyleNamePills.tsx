"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface StyleNamePillsProps {
  selected: string | null;
  onSelect: (style: string | null) => void;
}

export default function StyleNamePills({ selected, onSelect }: StyleNamePillsProps) {
  const t = useTranslations("discoveryFilters") as any;
  const [styles, setStyles] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/discovery/style-names")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d?.styles) setStyles(d.styles); })
      .catch((err) => console.error("[StyleNamePills] failed to load style names:", err));
    return () => { cancelled = true; };
  }, []);

  if (styles.length === 0) return null;

  return (
    <div>
      {/* V3-D346 (2026-05-29): filter-pill selected-state swept s-amber→ink (A9-equivalent); eyebrow .18em→.08em (A8). */}
      <p className="text-[12px] font-heading uppercase tracking-[.08em] text-s-ink/30 mb-2">
        Style
      </p>
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
        <button
          onClick={() => onSelect(null)}
          aria-pressed={!selected}
          className={cn(
            "px-3.5 py-2 rounded-pill text-[12px] font-heading font-medium whitespace-nowrap border transition-colors duration-150",
            !selected
              ? "border-s-ink bg-s-ink text-white"
              : "border-s-ink/[0.07] text-s-ink-2 hover:border-s-ink/40"
          )}
        >
          {t("all_styles")}
        </button>
        {styles.slice(0, 20).map((s) => (
          <button
            key={s.name}
            onClick={() => onSelect(s.name)}
            aria-pressed={selected === s.name}
            className={cn(
              "px-3.5 py-2 rounded-pill text-[12px] font-heading font-medium whitespace-nowrap border transition-colors duration-150",
              selected === s.name
                ? "border-s-ink bg-s-ink text-white"
                : "border-s-ink/[0.07] text-s-ink-2 hover:border-s-ink/40"
            )}
          >
            {s.name} ({s.count})
          </button>
        ))}
      </div>
    </div>
  );
}
