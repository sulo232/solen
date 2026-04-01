"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { usePostHog } from "posthog-js/react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  RefreshCw,
  Search,
  Compass,
  ArrowRight,
} from "lucide-react";
import Footer from "@/components/layout/Footer";
import GuidedSearch from "@/components/ui/GuidedSearch";
import CityCarouselSection from "@/components/ui/CityCarouselSection";
import RecentlyViewed from "@/components/RecentlyViewed";
import { useCityDetection } from "@/hooks/useCityDetection";
import ReviewCarousel from "@/components/ReviewCarousel";
import TutorialTour from "@/components/TutorialTour";
import FeaturedSalonCarousel from "@/components/ui/FeaturedSalonCarousel";
import type { SalonCard as SalonCardType, LastMinuteSlot } from "@/lib/types";
import { getPersistedCity } from "@/lib/city-cookie";
import { cn } from "@/lib/utils";
import { type CitySlug } from "@/lib/cities";
import { useRecentVisits } from "@/hooks/useRecentVisits";
import DiscoverCarousel from "@/components/ui/DiscoverCarousel";


// GöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇ
// Animation variants
// GöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇ

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
} as const;

const categoryContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
} as const;

const categoryItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1], delay: i * 0.06 },
  }),
};


const fadeUp = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: {
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] },
  },
} as const;

// GöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇ
// HomePage component
// GöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇ

type HomePageProps = {
  initialData?: {
    salons: SalonCardType[];
    lastMinuteSlots: LastMinuteSlot[];
    newSalons: SalonCardType[];
    trendingSalons: SalonCardType[];
    categoryCounts: Record<string, number>;
    sections: Record<string, boolean>;
    salonsWithCoords?: number;
    categorySalons?: Record<string, SalonCardType[]>;
  }
};

export default function HomePage({ initialData }: HomePageProps) {
  useCityDetection();
  const posthog = usePostHog();

  useEffect(() => {
    posthog?.capture("homepage_viewed");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("home") as any;
  const tNav = useTranslations("navigation") as any;
  const [loading, setLoading] = useState(false);
  const [lastBookedSalon, setLastBookedSalon] = useState<{ name: string; slug: string } | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [nearbySalons, setNearbySalons] = useState<SalonCardType[]>([]);
  const [locationError, setLocationError] = useState(false);
  const [persistedCity, setPersistedCity] = useState<CitySlug | null>(null);
  const [scrolledPast80, setScrolledPast80] = useState(false);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>(initialData?.categoryCounts || {});
  const salonsWithCoords = initialData?.salonsWithCoords ?? 0;

  const [salons, setSalons] = useState<SalonCardType[]>(initialData?.salons || []);
  const [categorySalons] = useState<Record<string, SalonCardType[]>>(initialData?.categorySalons ?? {});
  const [lastMinuteSlots, setLastMinuteSlots] = useState<LastMinuteSlot[]>(initialData?.lastMinuteSlots || []);
  const [newSalons, setNewSalons] = useState<SalonCardType[]>(initialData?.newSalons || []);
  const [trendingSalons, setTrendingSalons] = useState<SalonCardType[]>(initialData?.trendingSalons || []);

  useEffect(() => {
    setPersistedCity(getPersistedCity());
  }, []);

  useEffect(() => {
    const h = () => setScrolledPast80(window.scrollY > 80);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const { recentCats, visitCategory, bubbleRank, isMounted } = useRecentVisits();

  // Sort categories: bubble up according to recentCats ranking
  // Order: Entdecken (trending), then category carousels
  const orderedSectionKeys = useMemo(() => {
    const baseKeys = [
      { key: "coiffeur", label: tNav("coiffeur") as string },
      { key: "nails", label: tNav("nails") as string },
      { key: "barbershop", label: tNav("barbershop") as string },
      { key: "makeup", label: tNav("makeup") as string },
      { key: "waxing", label: tNav("waxing") as string },
    ];
    
    // Sort the keys based on the recentCats array ranking
    const sortedKeysData = bubbleRank(baseKeys.map(k => k.key as any));
    
    // Rebuild the array of objects in the new sorted order
    const result = [];
    for (const key of sortedKeysData) {
      const found = baseKeys.find(k => k.key === key);
      if (found) result.push(found);
    }
    
    return result;
  }, [bubbleRank, tNav]);
  const [userName, setUserName] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [nextBooking, setNextBooking] = useState<{ date: string; salon: string } | null>(null);
  const [sections, setSections] = useState<Record<string, boolean>>(
    initialData?.sections || {
      trending: true, nearby: true, new_salons: true,
      rebook: true, reviews: true, last_minute: true, featured: true,
      social_proof: true, partner_cta: true,
    }
  );
  const [showNearby, setShowNearby] = useState(false);

  const fetchNearby = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        fetch(`/api/salons?limit=6&sort=distance&lat=${latitude}&lng=${longitude}`)
          .then((r) => r.ok ? r.json() : null)
          .then((data) => {
            if (!data) { setLocationError(true); return; }
            setNearbySalons(data.items ?? []);
            setLocationError(false);
          })
          .catch(() => setLocationError(true));
      },
      () => setLocationError(true)
    );
  }, []);

  const fetchData = useCallback(async () => {
    // Single consolidated call for all user-specific data (bookings, profile, favorites)
    // Category counts are now SSR'd via initialData.categoryCounts
    fetch("/api/me")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return;
        if (data.profile?.first_name) setUserName(data.profile.first_name);
        if (data.lastBooking?.slug) setLastBookedSalon({ slug: data.lastBooking.slug, name: data.lastBooking.name });
        if (data.nextBooking?.date) {
          const date = new Date(data.nextBooking.date).toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" });
          setNextBooking({ date, salon: data.nextBooking.salon });
        }
        if (Array.isArray(data.favorites)) setFavoriteIds(new Set(data.favorites as string[]));
      })
      .catch((err) => console.error("[HomePage] failed to fetch user data:", err));

    // Try to passively fetch nearby if geolocation permission already granted
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          fetchNearby();
        }
      }).catch((err) => console.error("[HomePage] geolocation permission query failed:", err));
    }
  }, [locale, fetchNearby]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFavoriteToggle = useCallback((salonId: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(salonId)) {
        next.delete(salonId);
        fetch(`/api/profile/favorites?salon_id=${salonId}`, { method: "DELETE" }).catch((err) => console.error("[HomePage] failed to remove favorite:", err));
      } else {
        next.add(salonId);
        fetch("/api/profile/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ salon_id: salonId }),
        }).catch((err) => console.error("[HomePage] failed to add favorite:", err));
      }
      return next;
    });
  }, []);

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-white dark:bg-s-dm-bg">
      {/* GuidedSearch sheet GÇö sheet-only, trigger rendered inline in header */}
      <GuidedSearch categoryCounts={categoryCounts} hideTrigger />

      <main className="max-w-[2520px] mx-auto pb-16">
        
        {/* GöÇGöÇ 1. Entdecken block (Algorithmic feed) GöÇGöÇ */}
        <section className="animate-in mx-auto px-4 sm:px-6 pt-6 pb-8 md:py-12 relative z-[2]" style={{ animationDelay: "120ms" }}>
          <div className="mb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="block font-body font-semibold text-[12px] uppercase mb-2" style={{ letterSpacing: "2.5px", color: "#E8735A" }}>{t("discover.eyebrow")}</span>
              <h2 className="font-heading font-semibold text-[22px] tracking-tight text-[#222222] dark:text-white" style={{ lineHeight: "1.1" }}>
                {t("discover.title")}
              </h2>
            </div>
            <Link href={`/${locale}/discover`}
              className="inline-flex items-center gap-2 text-[14px] font-body font-semibold text-[#222222] dark:text-white rounded-pill border border-s-ink/15 dark:border-white/15 px-5 py-2.5 hover:border-s-coral/40 hover:text-s-coral active:scale-[0.98] transition-all duration-150 shrink-0 self-start">
              {t("discover.catalogCta")}
            </Link>
          </div>

          <DiscoverCarousel locale={locale} />
        </section>

        {/* GöÇGöÇ 2. Category Snapshot Rows GöÇGöÇ */}
        <section className="px-4 sm:px-6 py-6 pb-12 space-y-12">
          {orderedSectionKeys.map(({ key, label }) => {
            const salonsForCategory = categorySalons[key] || [];
            // No null guard GÇö FeaturedSalonCarousel shows demo cards when salonsForCategory is empty

            return (
              <div key={key}>
                {/* We removed the inline H3 here since FeaturedSalonCarousel handles its own labeling now via title prop */}
                <div className="-mx-4 sm:-mx-6 px-4 sm:px-6 relative">
                  <FeaturedSalonCarousel salons={salonsForCategory} locale={locale} title={label} />
                  <div className="mt-2 text-right px-6">
                    <Link href={`/${locale}/${key}`} className="group inline-flex items-center gap-1.5 text-[14px] font-body font-semibold text-[#222222] dark:text-white hover:text-s-coral transition-colors duration-150">
                      Alle {label} ansehen
                      <ArrowRight size={14} className="transition-transform duration-150 group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* GöÇGöÇ 3. Wieder buchen? (logged-in users with past booking) GöÇGöÇ */}
        {sections.rebook && lastBookedSalon && (
          <section className="px-4 sm:px-6 pt-6 pb-10">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
              className="flex items-center gap-4 p-4 border border-s-ink/[0.05] dark:border-white/[0.05] rounded-xl bg-[#f7f7f7] dark:bg-s-dm-surface/20">
              <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 bg-[#E8735A]/10">
                <RefreshCw size={18} className="text-[#E8735A]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-bold text-[#222222] dark:text-white text-[15px]">{t("rebook.title")}</p>
                <p className="text-sm text-[#717171] font-body truncate">{t("rebook.lastVisit", { name: lastBookedSalon.name })}</p>
              </div>
              <Link href={`/${locale}/salon/${lastBookedSalon.slug}`}
                className="shrink-0 px-4 py-2 rounded-lg bg-[#E8735A] text-white text-sm font-heading font-bold transition-transform hover:scale-[1.02]"
                aria-label={t("rebook.cta")}>
                {t("rebook.cta")}
              </Link>
            </motion.div>
          </section>
        )}

        {/* GöÇGöÇ 4. Recently Viewed GöÇGöÇ */}
        <div className="px-4 sm:px-6">
           <RecentlyViewed />
        </div>

        {/* GöÇGöÇ 5. High-Conversion Partner CTA GöÇGöÇ */}
        <section className="mt-16 sm:px-6 px-4">
          <div className="bg-[#222222] rounded-[16px] overflow-hidden text-white flex flex-col md:flex-row relative">
            <div className="p-10 md:p-16 flex-1 flex flex-col justify-center relative z-10">
              <h2 className="font-heading font-extrabold text-[32px] md:text-[48px] leading-[1.1] tracking-tight mb-4 text-white">
                Solen f++r Salons
              </h2>
              <p className="font-body text-[16px] md:text-[18px] text-white/80 mb-8 max-w-[400px]">
                {t("partner.teaserPrompt") || "Erreichen Sie Tausende von Kunden, f++llen Sie Ihren Kalender und verwalten Sie Ihr Gesch+ñft mit Leichtigkeit."}
              </p>
              <Link
                href={`/${locale}/partner`}
                className="inline-flex items-center justify-center h-12 px-8 rounded-pill bg-s-coral text-white font-heading font-bold hover:brightness-[1.06] active:scale-[0.98] transition-all duration-150 self-start whitespace-nowrap"
              >
                {t("partner.cta")}
              </Link>
            </div>
            {/* Ambient decoration */}
            <div className="hidden md:block absolute right-0 top-0 bottom-0 w-1/2 overflow-hidden select-none pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-[#222222] to-transparent z-10" />
                <div className="w-full h-full bg-[#333] opacity-50" />
            </div>
          </div>
        </section>

      </main>

      {/* GöÇGöÇ Footer GöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇ */}
      <Footer />

      {/* GöÇGöÇ Tutorial Tour (first-visit logged-in users) GöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇ */}
      <TutorialTour isLoggedIn={!!userName} />
    </div>
  );
}
