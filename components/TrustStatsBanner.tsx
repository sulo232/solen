"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Building2, Star, CalendarCheck, Shield } from "lucide-react";

/**
 * TrustStatsBanner — Fresha-inspired stats section
 *
 * Clean, modern layout with animated counters
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

  const animateNumbers = useCallback(() => {
    if (!stats || hasAnimated) return;
    setHasAnimated(true);

    const duration = 1500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setAnimatedValues({
        salons: Math.floor(stats.salons * eased),
        reviews: Math.floor(stats.reviews * eased),
        bookings: Math.floor(stats.bookings_all_time * eased),
      });

      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
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
      { threshold: 0.3 }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [animateNumbers, hasAnimated]);

  if (stats && stats.salons === 0 && stats.reviews === 0 && stats.bookings_all_time === 0) {
    return null;
  }

  const formatNumber = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M+";
    if (n >= 1000) return (n / 1000).toFixed(0) + "K+";
    return n.toLocaleString("de-CH") + "+";
  };

  const statItems = [
    {
      icon: Building2,
      value: stats ? formatNumber(animatedValues.salons) : "---",
      label: t("trust_stats.salons") || "Partner salons",
      show: !stats || stats.salons > 0,
    },
    {
      icon: Star,
      value: "4.8",
      label: t("trust_stats.rating") || "Average rating",
      show: true,
    },
    {
      icon: CalendarCheck,
      value: stats ? formatNumber(animatedValues.bookings) : "---",
      label: t("trust_stats.bookings") || "Appointments booked",
      show: !stats || stats.bookings_all_time > 0,
    },
    {
      icon: Shield,
      value: "Free",
      label: t("trust_stats.free") || "To use",
      show: true,
    },
  ].filter(item => item.show);

  // Loading skeleton
  if (!stats) {
    return (
      <section ref={sectionRef} className="py-12 bg-[#F7F7F7] rounded-3xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-[#E8E8E8] animate-pulse mb-4" />
              <div className="h-8 w-16 bg-[#E8E8E8] rounded animate-pulse mb-2" />
              <div className="h-4 w-24 bg-[#E8E8E8] rounded animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="py-12 md:py-16 bg-[#F7F7F7] rounded-3xl">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
        {statItems.map((item, index) => (
          <div key={index} className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm">
              <item.icon className="w-6 h-6 text-[#101010]" />
            </div>
            <p className="text-3xl md:text-4xl font-bold text-[#101010] tracking-tight">
              {item.value}
            </p>
            <p className="mt-1 text-sm text-[#717171]">
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
