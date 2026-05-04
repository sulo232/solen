"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import MiniSparkline from "@/components-legacy/dashboard/MiniSparkline";
import { itemVariants } from "@/lib/animations";

interface DeltaBadge {
  value: number;
  direction: "up" | "down" | "flat";
  label?: string;
}

export interface StatCardProps {
  label: string;
  value: number;
  Icon: React.ElementType;
  color: string;
  bg: string;
  isRating?: boolean;
  sparklineData?: number[];
  sparklineColor?: string;
  delta?: DeltaBadge;
}

function useCountUp(target: number, duration = 1000) {
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [value, setValue] = useState(prefersReduced ? target : 0);
  const raf = useRef<number>(0);
  useEffect(() => {
    if (prefersReduced) { setValue(target); return; }
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setValue(Math.round(target * progress));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration, prefersReduced]);
  return value;
}

export function StatCard({
  label,
  value,
  Icon,
  color,
  bg,
  isRating,
  sparklineData,
  sparklineColor,
  delta,
}: StatCardProps) {
  const count = useCountUp(value);
  const display = isRating ? (count / 10).toFixed(1) : count;

  const DeltaIcon =
    delta?.direction === "up" ? TrendingUp :
    delta?.direction === "down" ? TrendingDown : Minus;

  const deltaColors: Record<string, string> = {
    up: "text-[#15803D] bg-[#16A34A]/10",
    down: "text-s-coral bg-s-coral/10",
    flat: "text-s-ink/40 bg-s-ink/[0.05]",
  };

  return (
    <motion.div
      variants={itemVariants}
      className="bg-white rounded-[12px] border border-s-ink/[0.06] p-4"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-8 h-8 rounded-[10px] ${bg} flex items-center justify-center`}>
          <Icon size={15} className={color} />
        </div>
        {sparklineData && sparklineData.length > 1 && (
          <MiniSparkline data={sparklineData} color={sparklineColor} width={64} height={24} />
        )}
      </div>

      <p className="font-heading text-[28px] text-s-ink leading-none">
        {display}
      </p>
      <p className="text-[9px] font-heading uppercase tracking-[.16em] text-s-ink/35 mt-2">
        {label}
      </p>

      {delta && (
        <div className="mt-2.5 flex items-center gap-1">
          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-pill text-[9px] font-bold ${deltaColors[delta.direction]}`}>
            <DeltaIcon size={9} />
            {delta.direction !== "flat" && `${delta.direction === "up" ? "+" : ""}${delta.value}%`}
            {delta.direction === "flat" && "—"}
          </span>
          <span className="text-[9px] text-s-ink/30">
            {delta.label ?? "vs. Vorwoche"}
          </span>
        </div>
      )}
    </motion.div>
  );
}
