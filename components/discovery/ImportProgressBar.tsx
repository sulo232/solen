"use client";

interface ImportProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

export default function ImportProgressBar({ current, total, label }: ImportProgressBarProps) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-s-ink/60 dark:text-s-dm-text/60">{label}</span>
          <span className="font-medium text-s-ink dark:text-s-dm-text tabular-nums">{current}/{total}</span>
        </div>
      )}
      <div className="w-full h-2 bg-s-ink/5 dark:bg-white/5 rounded-pill overflow-hidden">
        <div
          className="h-full bg-s-coral rounded-pill transition-[width] duration-200"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
