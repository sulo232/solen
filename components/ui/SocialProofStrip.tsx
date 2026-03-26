"use client";

import { useEffect, useState, useRef } from "react";

interface StatItem {
  value: number;
  label: string;
  icon: string;
  isDecimal?: boolean;
}

const DEFAULT_STATS: StatItem[] = [
  { value: 247, label: "Buchungen diese Woche", icon: "\u{1F4C5}" },
  { value: 38, label: "Salons in Basel", icon: "\u2702" },
  { value: 4.9, label: "\u00D8 Bewertung", icon: "\u2605", isDecimal: true },
];

function useCountUp(target: number, isVisible: boolean, duration = 1200): number {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isVisible || hasAnimated.current || target === 0) return;
    hasAnimated.current = true;

    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isVisible, target, duration]);

  return count;
}

const glassCard: React.CSSProperties = {
  background: "var(--glass-bg-subtle)",
  backdropFilter: "blur(16px) saturate(1.2)",
  WebkitBackdropFilter: "blur(16px) saturate(1.2)",
  border: "1px solid var(--glass-border-subtle)",
  boxShadow:
    "var(--glass-shadow-inset), 0 1px 3px rgba(26,18,9,.07), 0 2px 8px rgba(26,18,9,.05)",
};

function StatCounter({ item, isVisible }: { item: StatItem; isVisible: boolean }) {
  const count = useCountUp(item.isDecimal ? 0 : item.value, isVisible);
  return (
    <div
      className="flex-1 min-w-[160px] rounded-[20px] p-6 text-center"
      style={glassCard}
    >
      <span className="text-[10px] font-heading font-bold uppercase tracking-[.16em] text-s-ink/40">
        {item.icon}
      </span>
      <div className="font-display text-[44px] leading-none text-s-coral mt-1">
        {item.isDecimal ? item.value.toFixed(1) : count.toLocaleString("de-CH")}
        {!item.isDecimal && "+"}
      </div>
      <div className="text-xs font-body text-s-ink/55 mt-1">
        {item.label}
      </div>
    </div>
  );
}

export default function SocialProofStrip() {
  const [stats, setStats] = useState<StatItem[]>(DEFAULT_STATS);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fetch real stats
  useEffect(() => {
    fetch("/api/analytics/platform")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.customers || data?.salons || data?.bookings_this_week || data?.avg_rating) {
          setStats([
            { value: data.bookings_this_week ?? DEFAULT_STATS[0].value, label: "Buchungen diese Woche", icon: "\u{1F4C5}" },
            { value: data.salons ?? DEFAULT_STATS[1].value, label: "Salons in Basel", icon: "\u2702" },
            { value: data.avg_rating ?? DEFAULT_STATS[2].value, label: "\u00D8 Bewertung", icon: "\u2605", isDecimal: true },
          ]);
        }
      })
      .catch(() => {});
  }, []);

  // Intersection Observer
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      <div className="max-w-5xl mx-auto px-4 py-8 flex gap-4 flex-wrap justify-center">
        {stats.map((item) => (
          <StatCounter key={item.label} item={item} isVisible={isVisible} />
        ))}
      </div>
    </div>
  );
}
