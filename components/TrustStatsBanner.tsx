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

  if (!stats) return (
    <section className="px-5 md:px-6 lg:px-10 xl:px-20 py-8 border-t border-s-ink/[0.08] dark:border-white/[0.08]">
      <div className="flex gap-3.5 justify-center flex-wrap">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[72px] w-40 rounded-[16px] bg-s-ink/[0.04] dark:bg-white/[0.04] animate-pulse" />
        ))}
      </div>
    </section>
  );

  return (
    <section
      ref={sectionRef}
      className="px-5 md:px-6 lg:px-10 xl:px-20 py-8 border-t border-s-ink/[0.08] dark:border-white/[0.08]"
    >
      <div className="flex gap-3.5 justify-center flex-wrap">

        {/* Salons */}
        <div
          className="flex items-center gap-3 px-5 py-3.5 rounded-[16px] bg-white dark:bg-s-dm-surface border border-s-ink/[0.08] dark:border-white/[0.08]"
          style={{ boxShadow: "0 1px 3px rgba(26,18,9,.05), 0 4px 12px rgba(26,18,9,.04)", minWidth: "152px" }}
        >
          <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: "rgba(232,98,74,.08)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E8624A" strokeWidth="2.2" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
          <div>
            <p className="font-heading font-extrabold text-[22px] text-s-ink dark:text-s-dm-text leading-none">{animatedValues.salons}+</p>
            <p className="font-body text-xs text-s-ink/40 dark:text-s-dm-text/40 mt-0.5">{t("trust_stats.salons") || "Salons"}</p>
          </div>
        </div>

        {/* Reviews */}
        <div
          className="flex items-center gap-3 px-5 py-3.5 rounded-[16px] bg-white dark:bg-s-dm-surface border border-s-ink/[0.08] dark:border-white/[0.08]"
          style={{ boxShadow: "0 1px 3px rgba(26,18,9,.05), 0 4px 12px rgba(26,18,9,.04)", minWidth: "152px" }}
        >
          <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: "rgba(232,98,74,.08)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E8624A" strokeWidth="2.2" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <div>
            <p className="font-heading font-extrabold text-[22px] text-s-ink dark:text-s-dm-text leading-none">{animatedValues.reviews}+</p>
            <p className="font-body text-xs text-s-ink/40 dark:text-s-dm-text/40 mt-0.5">{t("trust_stats.reviews") || "Bewertungen"}</p>
          </div>
        </div>

        {/* Bookings */}
        <div
          className="flex items-center gap-3 px-5 py-3.5 rounded-[16px] bg-white dark:bg-s-dm-surface border border-s-ink/[0.08] dark:border-white/[0.08]"
          style={{ boxShadow: "0 1px 3px rgba(26,18,9,.05), 0 4px 12px rgba(26,18,9,.04)", minWidth: "152px" }}
        >
          <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: "rgba(232,98,74,.08)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E8624A" strokeWidth="2.2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div>
            <p className="font-heading font-extrabold text-[22px] text-s-ink dark:text-s-dm-text leading-none">{animatedValues.bookings}+</p>
            <p className="font-body text-xs text-s-ink/40 dark:text-s-dm-text/40 mt-0.5">{t("trust_stats.bookings") || "Buchungen"}</p>
          </div>
        </div>

      </div>
    </section>
  );
}
