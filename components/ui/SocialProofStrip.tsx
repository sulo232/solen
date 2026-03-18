"use client";

import { useEffect, useState, useRef } from "react";

interface StatItem {
  value: number;
  label: string;
}

const DEFAULT_STATS: StatItem[] = [
  { value: 250, label: "Kund:innen" },
  { value: 45, label: "Salons" },
  { value: 120, label: "Buchungen diese Woche" },
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

function StatCounter({ item, isVisible }: { item: StatItem; isVisible: boolean }) {
  const count = useCountUp(item.value, isVisible);
  return (
    <div className="flex items-center gap-2">
      <span
        className="data-text font-bold text-base text-s-coral tabular-nums"
       
      >
        {count.toLocaleString("de-CH")}+
      </span>
      <span
        className="text-xs text-dark/60 font-body font-medium"
       
      >
        {item.label}
      </span>
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
        if (data?.customers || data?.salons || data?.bookings_this_week) {
          setStats([
            { value: data.customers ?? DEFAULT_STATS[0].value, label: "Kund:innen" },
            { value: data.salons ?? DEFAULT_STATS[1].value, label: "Salons" },
            { value: data.bookings_this_week ?? DEFAULT_STATS[2].value, label: "Buchungen diese Woche" },
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
    <div ref={ref} className="bg-s-coral/5 border-y border-s-coral/10">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-center gap-6 sm:gap-10 flex-wrap">
        {stats.map((item) => (
          <StatCounter key={item.label} item={item} isVisible={isVisible} />
        ))}
      </div>
    </div>
  );
}
