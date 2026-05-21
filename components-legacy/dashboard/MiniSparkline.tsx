"use client";

interface MiniSparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

/**
 * Tiny SVG sparkline for dashboard stat cards.
 * Renders a 4-7 point trend line with no axes or labels.
 */
export default function MiniSparkline({
  data,
  color = "#1B4D1B",
  width = 80,
  height = 28,
}: MiniSparklineProps) {
  if (!data.length || data.every((v) => v === 0)) return null;

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const padding = 2;

  const points = data
    .map((val, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2);
      const y = padding + (1 - (val - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0"
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
