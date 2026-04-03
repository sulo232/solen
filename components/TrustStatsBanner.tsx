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

  if (!stats) return null;

  return (
    <section
      ref={sectionRef}
      className="px-5 md:px-6 lg:px-10 xl:px-20 py-10 border-t border-s-ink/[0.08]"
    >
      <div className="flex flex-col sm:flex-row justify-center items-center gap-10 sm:gap-16">
        {/* Stat 1: Salons */}
        <div className="flex flex-col items-center gap-1">
          <p className="font-heading font-bold text-[32px] md:text-[40px] text-s-ink">
            {animatedValues.salons}+
          </p>
          <p className="font-body text-[14px] text-[#6A6A6A]">
            {t("trust_stats.salons") || "Salons"}
          </p>
        </div>

        {/* Stat 2: Reviews */}
        <div className="flex flex-col items-center gap-1">
          <p className="font-heading font-bold text-[32px] md:text-[40px] text-s-ink">
            {animatedValues.reviews}+
          </p>
          <p className="font-body text-[14px] text-[#6A6A6A]">
            {t("trust_stats.reviews") || "Bewertungen"}
          </p>
        </div>

        {/* Stat 3: Bookings */}
        <div className="flex flex-col items-center gap-1">
          <p className="font-heading font-bold text-[32px] md:text-[40px] text-s-ink">
            {animatedValues.bookings}+
          </p>
          <p className="font-body text-[14px] text-[#6A6A6A]">
            {t("trust_stats.bookings") || "Buchungen"}
          </p>
        </div>
      </div>
    </section>
  );
}
