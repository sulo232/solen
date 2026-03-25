"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface StyleNamePillsProps {
  selected: string | null;
  onSelect: (style: string | null) => void;
}

export default function StyleNamePills({ selected, onSelect }: StyleNamePillsProps) {
  const [styles, setStyles] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    fetch("/api/discovery/style-names")
      .then((r) => r.json())
      .then((d) => setStyles(d.styles ?? []))
      .catch(() => {});
  }, []);

  if (styles.length === 0) return null;

  return (
    <div>
      <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/30 dark:text-s-dm-text/30 mb-2">
        Style
      </p>
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
        <button
          onClick={() => onSelect(null)}
          className={cn(
            "px-3.5 py-2 rounded-pill text-[10px] font-heading font-bold uppercase tracking-[.06em] whitespace-nowrap border transition-all duration-150",
            !selected
              ? "border-s-amber bg-s-amber/[0.08] text-s-amber"
              : "border-s-ink/[0.07] dark:border-white/[0.07] text-s-ink/50 dark:text-s-dm-text/50 hover:border-s-amber/40"
          )}
        >
          Alle Styles
        </button>
        {styles.slice(0, 20).map((s) => (
          <button
            key={s.name}
            onClick={() => onSelect(s.name)}
            className={cn(
              "px-3.5 py-2 rounded-pill text-[10px] font-heading font-bold uppercase tracking-[.06em] whitespace-nowrap border transition-all duration-150",
              selected === s.name
                ? "border-s-amber bg-s-amber/[0.08] text-s-amber"
                : "border-s-ink/[0.07] dark:border-white/[0.07] text-s-ink/50 dark:text-s-dm-text/50 hover:border-s-amber/40"
            )}
          >
            {s.name} ({s.count})
          </button>
        ))}
      </div>
    </div>
  );
}
