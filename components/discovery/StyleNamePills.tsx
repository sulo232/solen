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
    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "px-3 py-1.5 rounded-pill text-xs font-medium whitespace-nowrap transition-colors border",
          !selected
            ? "bg-s-coral text-white border-s-coral"
            : "bg-white dark:bg-s-dm-surface text-s-ink/60 dark:text-s-dm-text/60 border-s-ink/10 dark:border-white/10"
        )}
      >
        All Styles
      </button>
      {styles.slice(0, 20).map((s) => (
        <button
          key={s.name}
          onClick={() => onSelect(s.name)}
          className={cn(
            "px-3 py-1.5 rounded-pill text-xs font-medium whitespace-nowrap transition-colors border",
            selected === s.name
              ? "bg-s-coral text-white border-s-coral"
              : "bg-white dark:bg-s-dm-surface text-s-ink/60 dark:text-s-dm-text/60 border-s-ink/10 dark:border-white/10"
          )}
        >
          {s.name} ({s.count})
        </button>
      ))}
    </div>
  );
}
