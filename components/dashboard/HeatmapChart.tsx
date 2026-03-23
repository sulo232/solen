"use client";

const DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8-19

interface HeatmapChartProps {
  data: Record<string, Record<string, number>>; // { "1": { "9": 5, "10": 3 }, ... } day -> hour -> count
}

export default function HeatmapChart({ data }: HeatmapChartProps) {
  // Find max value for intensity scaling
  let maxVal = 0;
  for (const day of Object.values(data)) {
    for (const count of Object.values(day)) {
      if (count > maxVal) maxVal = count;
    }
  }

  return (
    <div>
      <div className="flex gap-0.5">
        {/* Hour labels */}
        <div className="flex flex-col gap-0.5 pr-1">
          <div className="h-5" /> {/* spacer for day headers */}
          {HOURS.map((h) => (
            <div key={h} className="h-6 flex items-center justify-end text-[9px] text-s-ink/30 dark:text-s-dm-text/30 pr-1">
              {h}:00
            </div>
          ))}
        </div>
        {/* Grid */}
        {[1, 2, 3, 4, 5, 6, 0].map((dayNum, dayIdx) => {
          const dayData = data[String(dayNum)] ?? {};
          return (
            <div key={dayNum} className="flex-1 flex flex-col gap-0.5">
              <div className="h-5 text-center text-[9px] font-medium text-s-ink/50 dark:text-s-dm-text/50">{DAYS[dayIdx]}</div>
              {HOURS.map((h) => {
                const count = dayData[String(h)] ?? 0;
                const intensity = maxVal > 0 ? count / maxVal : 0;
                const opacity = Math.max(0.05, intensity);
                return (
                  <div
                    key={h}
                    className="h-6 rounded-sm cursor-default transition-colors"
                    style={{ backgroundColor: `rgba(232, 98, 74, ${opacity})` }}
                    title={`${DAYS[dayIdx]} ${h}:00 — ${count} Buchungen`}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
      {/* Legend */}
      <div className="flex items-center justify-end gap-1 mt-2 text-[9px] text-s-ink/30 dark:text-s-dm-text/30">
        <span>Weniger</span>
        {[0.1, 0.3, 0.5, 0.7, 1].map((o) => (
          <div key={o} className="w-3 h-3 rounded-sm" style={{ backgroundColor: `rgba(232, 98, 74, ${o})` }} />
        ))}
        <span>Mehr</span>
      </div>
    </div>
  );
}
