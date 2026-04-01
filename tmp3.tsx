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
} from "lucide-react";
import SalonCard from "@/components/SalonCard";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import Footer from "@/components/layout/Footer";
// StickyMobileCTA removed ΓÇö user requested removal of mobile "Salon entdecken" button
import LastMinuteCard from "@/components/LastMinuteCard";
// BlobBackground removed ΓÇö V5 uses ambient-v5 CSS class
import GuidedSearch from "@/components/ui/GuidedSearch";
import AirbnbSearchBar from "@/components/ui/AirbnbSearchBar";
import CityCarouselSection from "@/components/ui/CityCarouselSection";
import RecentlyViewed from "@/components/RecentlyViewed";
import { useCityDetection } from "@/hooks/useCityDetection";
// WeatherBanner removed ΓÇö doesn't contribute to conversion (Phase 0.3)
import ReviewCarousel from "@/components/ReviewCarousel";
import TutorialTour from "@/components/TutorialTour";
import FeaturedSalonCarousel from "@/components/ui/FeaturedSalonCarousel";
import type { SalonCard as SalonCardType, LastMinuteSlot } from "@/lib/types";
import { getPersistedCity } from "@/lib/city-cookie";
import { type CitySlug } from "@/lib/cities";
import { gridContainerVariants, gridItemVariants, headingVariants } from "@/lib/motion";


// ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
// Animation variants
// ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

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

import { CoiffeurIcon } from "@/components/icons/category/CoiffeurIcon";
import { BarberIcon } from "@/components/icons/category/BarberIcon";
import { NailsIcon } from "@/components/icons/category/NailsIcon";
import { MakeupIcon } from "@/components/icons/category/MakeupIcon";
import { WaxingIcon } from "@/components/icons/category/WaxingIcon";
import DiscoverCarousel from "@/components/ui/DiscoverCarousel";

// ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
// Airbnb-style category cards (photo bg + Bebas Neue name + badge + price)
// ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

const BASE_CATEGORY_CARDS = [
  {
    key: "discover",
    label: "Entdecken",
    badge: "Inspiration",
    area: "Discovery Feed",
    price: null as string | null,
    Icon: Compass,
    gradient: "135deg, #6BA3C8 0%, #4A1E3C 100%",
    imgSrc: null as string | null,
  },
  {
    key: "coiffeur",
    label: "Coiffeur",
    badge: "Beliebt",
    area: "Basel ┬╖ 4051",
    price: "$$",
    Icon: CoiffeurIcon as React.ElementType,
    gradient: "160deg, #C85A42 0%, #1A1209 100%",
    imgSrc: "/images/categories/coiffeur.jpg",
  },
  {
    key: "nails",
    label: "N├ñgel",
    badge: "Trending",
    area: "Basel ┬╖ 4051",
    price: "$",
    Icon: NailsIcon as React.ElementType,
    gradient: "160deg, #C4910A 0%, #2A1A00 100%",
    imgSrc: "/images/categories/nails.jpg",
  },
  {
    key: "barbershop",
    label: "Barbershop",
    badge: "Gefragt",
    area: "Basel ┬╖ 4053",
    price: "$",
    Icon: BarberIcon as React.ElementType,
    gradient: "160deg, #3A1630 0%, #1A1209 100%",
    imgSrc: "/images/categories/barbershop.jpg",
  },
  {
    key: "makeup",
    label: "Makeup",
    badge: "Beliebt",
    area: "Basel ┬╖ 4051",
    price: "$$",
    Icon: MakeupIcon as React.ElementType,
    gradient: "160deg, #B8720A 0%, #1A1209 100%",
    imgSrc: null,
  },
  {
    key: "waxing",
    label: "Waxing",
    badge: "Schnell",
    area: "Basel ┬╖ 4058",
    price: "$$",
    Icon: WaxingIcon as React.ElementType,
    gradient: "160deg, #5A8A66 0%, #1A1209 100%",
    imgSrc: null,
  },
];

// ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
// AirbnbCategoryCard ΓÇö full-bleed photo card with gradient fallback
// ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

type AirbnbCategoryCardProps = {
  catKey: string;
  label: string;
  href: string;
  badge: string;
  area: string;
  price: string | null;
  Icon: React.ElementType;
  gradient: string;
  imgSrc: string | null;
  animationIndex: number;
  isRecent: boolean;
};

function AirbnbCategoryCard({
  catKey, label, href, badge, area, price, Icon, gradient, imgSrc, animationIndex, isRecent,
}: AirbnbCategoryCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const hasPhoto = !!imgSrc && !imgError;

  const handleClick = () => {
    if (catKey !== "discover") {
      try { localStorage.setItem("solen_recent_category", catKey); } catch {}
    }
  };

  return (
    <motion.div
      variants={categoryItemVariants}
      custom={animationIndex}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      style={{ flexShrink: 0, scrollSnapAlign: "start" }}
    >
      <Link
        href={href}
        onClick={handleClick}
        aria-label={label}
        style={{ display: "block", textDecoration: "none" }}
        className="active:scale-[0.97] transition-transform duration-[120ms] ease-out"
      >
        <div
          style={{
            position: "relative",
            width: "155px",
            height: "200px",
            borderRadius: "16px",
            overflow: "hidden",
          }}
        >
          {/* Gradient base */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(${gradient})`,
            }}
          />

          {/* Photo (fades in over gradient) */}
          {hasPhoto && (
            <img
              src={imgSrc!}
              alt={label}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: imgLoaded ? 1 : 0,
                transition: "opacity 400ms ease",
              }}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              loading={animationIndex < 2 ? "eager" : "lazy"}
            />
          )}

          {/* Icon (shows when no photo or photo loading) */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: hasPhoto && imgLoaded ? 0 : 0.28,
              transition: "opacity 400ms ease",
              pointerEvents: "none",
            }}
          >
            <Icon size={52} color="#FFFFFF" />
          </div>

          {/* Bottom gradient for text legibility */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.22) 55%, rgba(0,0,0,0) 100%)",
              pointerEvents: "none",
            }}
          />

          {/* Badge ΓÇö top left */}
          <div
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              background: "rgba(255,255,255,0.90)",
              backdropFilter: "blur(6px)",
              borderRadius: "9999px",
              padding: "3px 9px",
              fontSize: "9px",
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              color: "#1A1209",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {badge}
          </div>

          {/* Recently visited dot ΓÇö top right */}
          {isRecent && (
            <div
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#E8624A",
                boxShadow: "0 0 0 2px rgba(255,255,255,0.8)",
              }}
            />
          )}

          {/* Bottom info */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "10px 12px 12px" }}>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "21px",
                color: "#FFFFFF",
                margin: 0,
                lineHeight: 0.95,
                letterSpacing: "0.02em",
              }}
            >
              {label.toUpperCase()}
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "10px",
                  color: "rgba(255,255,255,0.65)",
                  margin: 0,
                }}
              >
                {area}
              </p>
              {price && (
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.80)",
                    margin: 0,
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                  }}
                >
                  {price}
                </p>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
// HomePage component
// ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

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

  // Recently visited category (persisted in localStorage)
  const [recentCategory, setRecentCategory] = useState<string | null>(null);
  useEffect(() => {
    try { setRecentCategory(localStorage.getItem("solen_recent_category")); } catch {}
  }, []);

  // Sort recently visited category to position 1 (after Entdecken)
  const orderedCategories = useMemo(() => {
    if (!recentCategory) return BASE_CATEGORY_CARDS;
    const discover = BASE_CATEGORY_CARDS[0];
    const recent = BASE_CATEGORY_CARDS.find((c) => c.key === recentCategory);
    if (!recent || recent.key === "discover") return BASE_CATEGORY_CARDS;
    const rest = BASE_CATEGORY_CARDS.filter((c) => c.key !== "discover" && c.key !== recentCategory);
    return [discover, recent, ...rest];
  }, [recentCategory]);
  const [userName, setUserName] = useState<string | null>(null);
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
      .catch(() => {});

    // Try to passively fetch nearby if geolocation permission already granted
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          fetchNearby();
        }
      }).catch(() => {});
    }
  }, [locale, fetchNearby]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFavoriteToggle = useCallback((salonId: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(salonId)) {
        next.delete(salonId);
        fetch(`/api/profile/favorites?salon_id=${salonId}`, { method: "DELETE" }).catch(() => {});
      } else {
        next.add(salonId);
        fetch("/api/profile/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ salon_id: salonId }),
        }).catch(() => {});
      }
      return next;
    });
  }, []);

  // ΓöÇΓöÇ Category grid visibility observer ΓåÆ drives header sticky row ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const categoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = categoryRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        window.dispatchEvent(
          new CustomEvent("categoryGridVisibility", {
            detail: { visible: entry.isIntersecting },
          })
        );
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen hero-cinematic relative overflow-x-hidden">

      {/* GuidedSearch sheet ΓÇö sheet-only, trigger rendered inline below */}
      <GuidedSearch categoryCounts={categoryCounts} hideTrigger />

      {/* ΓöÇΓöÇ Desktop Expanded Search Bar (Airbnb-style, hidden on scroll) ΓöÇΓöÇ */}
      <div className="hidden md:block max-w-4xl mx-auto px-6 pt-5 pb-2">
        <AirbnbSearchBar scrolledPast80={scrolledPast80} locale={locale} categoryCounts={categoryCounts} />
      </div>

      {/* ΓöÇΓöÇ Per-category Salon Carousels ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
      <div
        id="tour-services"
        ref={categoryRef}
        className="animate-in pt-6"
        style={{ animationDelay: "120ms" }}
      >
        {[
          { key: "coiffeur",   label: tNav("coiffeur")   as string },
          { key: "nails",      label: tNav("nails")      as string },
          { key: "barbershop", label: tNav("barbershop") as string },
          { key: "makeup",     label: tNav("makeup")     as string },
          { key: "waxing",     label: tNav("waxing")     as string },
        ].map(({ key, label }) => {
          const catSalons = categorySalons[key] ?? [];
          if (catSalons.length === 0) return null;
          const href = persistedCity ? `/${locale}/${persistedCity}/${key}` : `/${locale}/${key}`;
          const handleVisit = () => {
            try { localStorage.setItem("solen_recent_category", key); } catch {}
          };
          return (
            <CityCarouselSection
              key={key}
              title={label}
              viewAllHref={href}
              viewAllLabel={t("featured.viewAll")}
              salons={catSalons}
              locale={locale}
              favoriteIds={favoriteIds}
              onFavoriteToggle={handleFavoriteToggle}
              onViewAll={handleVisit}
            />
          );
        })}
      </div>

      {/* WeatherBanner removed ΓÇö Phase 0.3 */}

      {/* ΓöÇΓöÇ Wieder buchen? (logged-in users with past booking) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
      {sections.rebook && lastBookedSalon && (
        <section className="max-w-5xl mx-auto px-4 pt-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            className="flex items-center gap-4 p-4 border border-s-ink/[0.05] dark:border-white/[0.05] rounded-xl bg-s-bg-base/40 dark:bg-s-dm-surface/20">
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 bg-s-coral/[0.12] dark:bg-s-coral/[0.20]">
              <RefreshCw size={18} className="text-s-coral" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-bold text-s-ink dark:text-s-dm-text text-sm">{t("rebook.title")}</p>
              <p className="text-xs text-s-ink/50 font-body truncate">{t("rebook.lastVisit", { name: lastBookedSalon.name })}</p>
            </div>
            <Link href={`/${locale}/salon/${lastBookedSalon.slug}`}
              className="shrink-0 px-4 py-2 rounded-pill bg-s-coral text-white text-xs font-heading font-bold uppercase tracking-[.04em]"
              style={{ boxShadow: "0 2px 4px rgba(232,98,74,.25), 0 4px 16px rgba(232,98,74,.15)" }}
              aria-label={t("rebook.cta")}>
              {t("rebook.cta")}
            </Link>
          </motion.div>
        </section>
      )}

      {/* ΓöÇΓöÇ Recently Viewed (returning users) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
      <RecentlyViewed />

      {/* ΓöÇΓöÇ Discover Preview ΓÇö step 5 per A.6 ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
      {/* z-[2] + opaque bg blocks any bleed from category icons above (A.5) */}
      <section className="animate-in max-w-base mx-auto px-0 py-8 md:py-12 overflow-hidden relative z-[2]" style={{ background: "#F5F0EB", animationDelay: "320ms" }}>
        <div className="max-w-5xl mx-auto px-4 mb-2 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="block font-body font-semibold text-[12px] uppercase mb-2" style={{ letterSpacing: "2.5px", color: "#E8735A" }}>{t("discover.eyebrow")}</span>
            <h2 className="font-heading font-extrabold text-s-ink dark:text-s-dm-text" style={{ fontSize: "clamp(24px, 3.5vw, 42px)", letterSpacing: "-0.02em", lineHeight: "1.0" }}>
              {t("discover.title")}
            </h2>
          </div>
          <Link href={`/${locale}/discover`}
            className="inline-flex items-center gap-2 text-sm font-heading font-bold text-white bg-s-ink dark:bg-s-dm-raised px-6 py-3 rounded-pill hover:brightness-[1.08] active:scale-[0.98] transition-[transform,filter] duration-150 shrink-0 self-start">
            {t("discover.catalogCta")} ΓåÆ
          </Link>
        </div>

        {/* The new horizontal swiper component replaces the static subset */}
        <DiscoverCarousel locale={locale} />
      </section>

      {/* ΓöÇΓöÇ Partner Teaser (slim) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
      <section className="py-8 px-4 border-t border-s-ink/[0.06] dark:border-white/[0.06]">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm font-body text-s-ink/50 dark:text-s-dm-text/50">
            {t("partner.teaserPrompt")}{" "}
            <Link
              href={`/${locale}/partner`}
              className="font-heading font-bold text-s-coral hover:brightness-[1.06] transition-[filter] duration-150"
            >
              {t("partner.cta")} ΓåÆ
            </Link>
          </p>
        </div>
      </section>


      {/* ΓöÇΓöÇ Sticky Mobile CTA ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
      {/* StickyMobileCTA removed ΓÇö Phase 2 */}

      {/* ΓöÇΓöÇ Footer ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
      <Footer />

      {/* ΓöÇΓöÇ Tutorial Tour (first-visit logged-in users) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
      <TutorialTour isLoggedIn={!!userName} />
    </div>
  );
}
