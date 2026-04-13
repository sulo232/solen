"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Search, MapPin, Scissors, Sparkles, Heart } from "lucide-react";

/**
 * HomepageHero — Fresha-inspired Design
 *
 * Clean, centered layout with:
 * - Bold centered headline
 * - Large search bar
 * - Social proof stats
 * - Category quick links
 */

interface HomepageHeroProps {
  categoryCounts?: Record<string, number>;
  reviewCount?: number;
}

export default function HomepageHero({ categoryCounts, reviewCount = 2400 }: HomepageHeroProps) {
  const t = useTranslations("home.hero") as any;
  const tNav = useTranslations("navigation") as any;
  const locale = useLocale();
  const [appointmentsToday, setAppointmentsToday] = useState(0);

  // Animate counter
  useEffect(() => {
    const target = 1247;
    const duration = 2000;
    const start = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAppointmentsToday(Math.floor(target * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    
    requestAnimationFrame(animate);
  }, []);

  const categories = [
    { key: "coiffeur", label: tNav("coiffeur") || "Hair Salons", icon: Scissors },
    { key: "nails", label: tNav("nails") || "Nail Salons", icon: Sparkles },
    { key: "barbershop", label: tNav("barbershop") || "Barbers", icon: Scissors },
    { key: "spa", label: tNav("spa") || "Spa & Wellness", icon: Heart },
    { key: "makeup", label: tNav("makeup") || "Makeup", icon: Sparkles },
  ];

  return (
    <section className="relative bg-white pt-24 md:pt-32 pb-16 md:pb-24 overflow-hidden">
      {/* Subtle background pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #101010 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#101010] tracking-tight leading-[1.1]"
        >
          {t("headlineWord1") || "Book local"}
          <br />
          <span className="text-[#101010]">
            {t("headlineAccent") || "selfcare services"}
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
          className="mt-6 text-lg md:text-xl text-[#717171] max-w-2xl mx-auto"
        >
          {t("sub") || "Discover top-rated salons, barbers, medspas, wellness studios and beauty experts trusted by millions worldwide"}
        </motion.p>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="mt-10"
        >
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("openSearchSheet", { detail: { step: 1 } }))}
            className="w-full max-w-xl mx-auto flex items-center gap-4 px-6 py-4 bg-white rounded-full border border-[#E8E8E8] shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <Search className="w-5 h-5 text-[#101010]" />
            <span className="flex-1 text-left text-[#717171] text-base md:text-lg">
              {t("searchPlaceholder") || "Search treatments, salons..."}
            </span>
            <span className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#101010] text-white text-sm font-semibold rounded-full group-hover:bg-[#2a2a2a] transition-colors">
              <Search className="w-4 h-4" />
              Search
            </span>
          </button>
        </motion.div>

        {/* Social Proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 flex items-center justify-center gap-2 text-sm text-[#717171]"
        >
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="font-semibold text-[#101010]">{appointmentsToday.toLocaleString("de-CH")}</span>
          </span>
          <span>{t("appointmentsToday") || "appointments booked today"}</span>
        </motion.div>

        {/* Category Pills */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-3"
        >
          {categories.map(({ key, label, icon: Icon }, index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.6 + index * 0.05 }}
            >
              <Link
                href={`/${locale}/${key}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F7F7F7] hover:bg-[#EBEBEB] text-[#101010] text-sm font-medium rounded-full transition-all duration-200 hover:-translate-y-0.5"
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-16 pt-8 border-t border-[#E8E8E8] flex flex-wrap items-center justify-center gap-8 md:gap-12"
        >
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <svg key={i} className="w-5 h-5 text-[#FFC107]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-sm text-[#717171]">
              <span className="font-semibold text-[#101010]">4.8</span> average rating
            </span>
          </div>
          
          <div className="text-sm text-[#717171]">
            <span className="font-semibold text-[#101010]">{reviewCount.toLocaleString("de-CH")}+</span> reviews
          </div>
          
          <div className="text-sm text-[#717171]">
            <span className="font-semibold text-[#101010]">Free</span> to book
          </div>
        </motion.div>
      </div>
    </section>
  );
}
