"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";

interface TrustStats {
  salons: number;
  reviews: number;
  bookings_all_time: number;
}

export default function TrustStatsBanner() {
  const t = useTranslations("home");
  const [stats, setStats] = useState<TrustStats | null>(null);
  const [animatedValues, setAnimatedValues] = useState({ salons: 0, reviews: 0, bookings: 0 });
  const [hasAnimated, setHasAnimated] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch global stats
    fetch("/api/metrics/global")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setStats({
            salons: data.salons,
            reviews: data.reviews,
            bookings_all_time: data.bookings_all_time,
          });
        }
      })
      .catch((err) => console.error("[TrustStatsBanner] Failed to fetch stats:", err));
  }, []);

  const animateNumbers = useCallback(() => {
    if (!stats || hasAnimated) return;

    setHasAnimated(true);
    const duration = 1500; // 1.5 seconds
    const startTime = Date.now();
    const staggerDelay = 100; // 100ms between each stat

    const animateValue = (
      targetValue: number,
      startDelay: number,
      onUpdate: (value: number) => void
    ) => {
      const animate = () => {
        const now = Date.now();
        const elapsed = now - startTime - startDelay;

        if (elapsed < 0) {
          requestAnimationFrame(animate);
          return;
        }

        if (elapsed >= duration) {
          onUpdate(targetValue);
        } else {
          const progress = elapsed / duration;
          const easedProgress = 1 - Math.pow(1 - progress, 3);
          onUpdate(Math.floor(targetValue * easedProgress));
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    };

    // Stagger the three stats by 100ms each
    animateValue(stats.salons, 0, (val) =>
      setAnimatedValues((prev) => ({ ...prev, salons: val }))
    );
    animateValue(stats.reviews, staggerDelay, (val) =>
      setAnimatedValues((prev) => ({ ...prev, reviews: val }))
    );
    animateValue(stats.bookings_all_time, staggerDelay * 2, (val) =>
      setAnimatedValues((prev) => ({ ...prev, bookings: val }))
    );
  }, [stats, hasAnimated]);

  useEffect(() => {
    if (!sectionRef.current || hasAnimated) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          animateNumbers();
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(sectionRef.current);

    return () => observer.disconnect();
  }, [animateNumbers, hasAnimated]);

  const statItems = [
    { value: animatedValues.salons, label: t("trust_stats.salons") || "Salons" },
    { value: animatedValues.reviews, label: t("trust_stats.reviews") || "Bewertungen" },
    { value: animatedValues.bookings, label: t("trust_stats.bookings") || "Buchungen" },
  ];

  const sectionStyle: React.CSSProperties = {
    background: "#FFFFFF",
    borderTop: "1px solid rgba(26,18,9,0.06)",
    borderBottom: "1px solid rgba(26,18,9,0.06)",
    padding: "40px 48px",
  };

  const divider = (
    <div
      aria-hidden="true"
      style={{ width: 1, height: 40, background: "rgba(26,18,9,0.12)", flexShrink: 0 }}
    />
  );

  if (!stats) return (
    <section style={sectionStyle}>
      <div className="flex items-center justify-center gap-12">
        {[1, 2, 3].map((i, idx) => (
          <div key={i} className="flex items-center gap-12">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-20 rounded-[4px] bg-s-ink/[0.06] animate-pulse" />
              <div className="h-3.5 w-28 rounded-[4px] bg-s-ink/[0.04] animate-pulse" />
            </div>
            {idx < 2 && divider}
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <section ref={sectionRef} style={sectionStyle}>
      <div className="flex items-center justify-center gap-12 flex-wrap">
        {statItems.map((item, idx) => (
          <div key={item.label} className="flex items-center gap-12">
            <div className="flex flex-col items-center text-center">
              <p
                className="font-heading font-extrabold leading-none"
                style={{ fontSize: 32, color: "#1A1209" }}
              >
                {item.value.toLocaleString()}+
              </p>
              <p
                className="font-body mt-2"
                style={{ fontSize: 14, color: "rgba(26,18,9,0.55)" }}
              >
                {item.label}
              </p>
            </div>
            {idx < statItems.length - 1 && divider}
          </div>
        ))}
      </div>
    </section>
  );
}
