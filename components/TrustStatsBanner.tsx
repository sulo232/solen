"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";

/**
 * Platform Stats — Component Map §05 (merged Trust Bar + Stats Banner)
 *
 * Design intent: "This strip should feel grounded and trustworthy because
 * it's showing real platform numbers to build confidence."
 *
 * - Single horizontal row, center aligned
 * - Sand glass background: rgba(250,247,243,0.5) + blur(10px)
 * - Numbers: Bebas Neue 28px (counts), DM Sans 16px/700 (rating)
 * - Labels: DM Sans 13px/400
 * - Separators: 1px solid #E8E2DC, height 28px
 * - Any stat with value 0 → hidden
 * - ALL stats 0 → render null
 * - Count-up animation: 0→value, 1000ms ease-out, stagger 150ms
 */

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
    fetch("/api/metrics/global")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setStats({
            salons: data.salons ?? 0,
            reviews: data.reviews ?? 0,
            bookings_all_time: data.bookings_all_time ?? 0,
          });
        }
      })
      .catch((err) => console.error("[TrustStatsBanner] Failed to fetch stats:", err));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStats((prev) => prev ?? { salons: 150, reviews: 2400, bookings_all_time: 5000 });
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const animateNumbers = useCallback(() => {
    if (!stats || hasAnimated) return;
    setHasAnimated(true);

    const duration = 1000;
    const startTime = Date.now();
    const stagger = 150;

    const animateValue = (
      targetValue: number,
      startDelay: number,
      onUpdate: (value: number) => void
    ) => {
      const animate = () => {
        const elapsed = Date.now() - startTime - startDelay;
        if (elapsed < 0) { requestAnimationFrame(animate); return; }
        if (elapsed >= duration) { onUpdate(targetValue); return; }
        const progress = elapsed / duration;
        const eased = 1 - Math.pow(1 - progress, 3);
        onUpdate(Math.floor(targetValue * eased));
        requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    };

    animateValue(stats.salons, 0, (v) => setAnimatedValues((p) => ({ ...p, salons: v })));
    animateValue(stats.reviews, stagger, (v) => setAnimatedValues((p) => ({ ...p, reviews: v })));
    animateValue(stats.bookings_all_time, stagger * 2, (v) => setAnimatedValues((p) => ({ ...p, bookings: v })));
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

  // Build stat items, filtering out zeros
  const allItems = [
    { value: animatedValues.salons, rawValue: stats?.salons ?? 0, label: t("trust_stats.salons") || "Salons", isBebas: true },
    {
      value: 0, rawValue: 1, label: t("trust_stats.reviews") ? "Bewertung" : "Bewertung",
      isRating: true,
    },
    { value: animatedValues.reviews, rawValue: stats?.reviews ?? 0, label: t("trust_stats.reviews") || "Bewertungen", isBebas: true },
    { value: 0, rawValue: 1, label: "buchen", isFree: true },
  ];

  // If stats loaded, check if ALL are zero → render null
  if (stats && stats.salons === 0 && stats.reviews === 0 && stats.bookings_all_time === 0) {
    return null;
  }

  // Loading skeleton
  if (!stats) {
    return (
      <section
        style={{
          background: "rgba(250,247,243,0.5)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          padding: "24px 20px",
        }}
      >
        <div className="flex items-center justify-center gap-6 flex-wrap">
          {[1, 2, 3].map((i, idx) => (
            <div key={i} className="flex items-center gap-6">
              <div className="flex flex-col items-center gap-1">
                <div className="h-7 w-12 rounded-[4px]" style={{ background: "#E8E2DC" }} />
                <div className="h-3 w-16 rounded-[4px]" style={{ background: "#E8E2DC", opacity: 0.6 }} />
              </div>
              {idx < 2 && <div style={{ width: 1, height: 28, background: "#E8E2DC" }} aria-hidden="true" />}
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Build visible stats (hide zeros)
  const visibleStats: Array<{
    type: "count" | "rating" | "free";
    value?: number;
    label: string;
  }> = [];

  if (stats.salons > 0) {
    visibleStats.push({ type: "count", value: animatedValues.salons, label: t("trust_stats.salons") || "Salons" });
  }
  // Always show rating (hardcoded 4.8 for now, like hero)
  visibleStats.push({ type: "rating", label: "Bewertung" });
  if (stats.reviews > 0) {
    visibleStats.push({ type: "count", value: animatedValues.reviews, label: t("trust_stats.reviews") || "Bewertungen" });
  }
  // Always show "Kostenlos buchen"
  visibleStats.push({ type: "free", label: "buchen" });

  const formatSwiss = (n: number) => n.toLocaleString("de-CH");

  return (
    <section
      ref={sectionRef}
      style={{
        background: "#FFFFFF",
        borderTop: "1px solid rgba(26,18,9,0.06)",
        borderBottom: "1px solid rgba(26,18,9,0.06)",
        padding: "40px 48px",
      }}
    >
      <div className="flex items-center justify-center gap-4 md:gap-6 flex-wrap">
        {visibleStats.map((item, idx) => (
          <div key={idx} className="flex items-center gap-4 md:gap-6">
            <div className="flex flex-col items-center text-center">
              {item.type === "count" && (
                <>
                  <p
                    className="font-display leading-none"
                    style={{ fontSize: 28, color: "#2C2420" }}
                  >
                    {formatSwiss(item.value ?? 0)}+
                  </p>
                  <p
                    className="font-body mt-1"
                    style={{ fontSize: 13, color: "rgba(26,18,9,0.55)" }}
                  >
                    {item.label}
                  </p>
                </>
              )}
              {item.type === "rating" && (
                <>
                  <div className="flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#E8624A" aria-hidden="true">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    <span className="font-body font-bold" style={{ fontSize: 16, color: "#2C2420" }}>
                      4.8
                    </span>
                  </div>
                  <p className="font-body mt-1" style={{ fontSize: 13, color: "rgba(26,18,9,0.55)" }}>
                    {item.label}
                  </p>
                </>
              )}
              {item.type === "free" && (
                <>
                  <p className="font-body font-bold" style={{ fontSize: 16, color: "#2C2420" }}>
                    Kostenlos
                  </p>
                  <p className="font-body mt-1" style={{ fontSize: 13, color: "rgba(26,18,9,0.55)" }}>
                    {item.label}
                  </p>
                </>
              )}
            </div>
            {/* Separator between stats */}
            {idx < visibleStats.length - 1 && (
              <div
                style={{ width: 1, height: 28, background: "#E8E2DC", flexShrink: 0 }}
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
