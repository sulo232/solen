"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Calendar, Scissors, Star } from "lucide-react";

interface StatItem {
  value: number | null;
  labelKey: "bookingsThisWeek" | "partnerSalons" | "avgRating";
  Icon: typeof Calendar;
  isDecimal?: boolean;
}

const BASE_STATS: Omit<StatItem, "value">[] = [
  { labelKey: "bookingsThisWeek", Icon: Calendar },
  { labelKey: "partnerSalons", Icon: Scissors },
  { labelKey: "avgRating", Icon: Star, isDecimal: true },
];

function useCountUp(target: number | null, isVisible: boolean, duration = 1200): number | null {
  const [count, setCount] = useState<number | null>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isVisible || hasAnimated.current || target === null || target === 0) return;
    hasAnimated.current = true;
    setCount(0);

    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
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

function StatCounter({
  item,
  isVisible,
}: {
  item: StatItem;
  isVisible: boolean;
}) {
  const t = useTranslations("home.socialProof");
  const count = useCountUp(item.isDecimal ? null : item.value, isVisible);
  const label = t(item.labelKey);

  const displayValue = () => {
    if (item.value === null) return "–";
    if (item.isDecimal) return item.value.toFixed(1);
    if (count === null) return "–";
    return count.toLocaleString("de-CH") + "+";
  };

  return (
    <div className="flex-1 min-w-[160px] rounded-[20px] p-6 text-center" style={glassCard}>
      <div className="flex items-center justify-center mb-2">
        <item.Icon size={14} className="text-s-ink/40" aria-hidden="true" />
      </div>
      <div className="font-display text-[44px] leading-none text-s-coral mt-1">
        {displayValue()}
      </div>
      <div className="text-xs font-body text-s-ink/55 mt-1">{label}</div>
    </div>
  );
}

export default function SocialProofStrip() {
  const [stats, setStats] = useState<StatItem[]>(
    BASE_STATS.map((s) => ({ ...s, value: null }))
  );
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fetch real stats
  useEffect(() => {
    fetch("/api/metrics/global")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setStats([
          { ...BASE_STATS[0], value: data.bookings_this_week ?? null },
          { ...BASE_STATS[1], value: data.salons ?? null },
          { ...BASE_STATS[2], value: data.avg_rating ?? null },
        ]);
      })
      .catch(() => {
        // Keep null values — shows "–" placeholder instead of fake numbers
      });
  }, []);

  // Intersection Observer
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      <div className="max-w-5xl mx-auto px-4 py-8 flex gap-4 flex-wrap justify-center">
        {stats.map((item) => (
          <StatCounter key={item.labelKey} item={item} isVisible={isVisible} />
        ))}
      </div>
    </div>
  );
}
