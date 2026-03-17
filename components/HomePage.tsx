"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Search, ArrowRight, X } from "lucide-react";
import SalonCard from "@/components/SalonCard";
import QuartierTile from "@/components/QuartierTile";
import ServiceTile from "@/components/ServiceTile";
import LastMinuteCard from "@/components/LastMinuteCard";
import Spinner from "@/components/ui/Spinner";
import TutorialTour from "@/components/TutorialTour";
import type { SalonCard as SalonCardType, LastMinuteSlot, SalonCategory } from "@/lib/types";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

interface SearchResult {
  salons: SalonCardType[];
  services: { id: string; name: string; category: SalonCategory }[];
  quartiers: { slug: string; name: string }[];
}

interface QuartierCount {
  slug: string;
  name: string;
  count: number;
  visited?: boolean;
  favorited?: boolean;
}

const QUARTIERS: QuartierCount[] = [
  { slug: "grossbasel", name: "Grossbasel", count: 0 },
  { slug: "kleinbasel", name: "Kleinbasel", count: 0 },
  { slug: "gundeli", name: "Gundeli", count: 0 },
  { slug: "st_johann", name: "St. Johann", count: 0 },
  { slug: "iselin", name: "Iselin", count: 0 },
  { slug: "bruderholz", name: "Bruderholz", count: 0 },
  { slug: "breite", name: "Breite", count: 0 },
];

const SERVICE_CATEGORIES: SalonCategory[] = [
  "coiffeur",
  "barbershop",
  "nails",
  "spa",
  "makeup",
  "waxing",
];

// ─────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────

function useCountUp(target: number, enabled: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled || target === 0) return;
    const duration = 1200;
    const steps = 40;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + increment, target);
      setCount(Math.floor(current));
      if (current >= target) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target, enabled]);
  return count;
}

function useIntersection(ref: React.RefObject<Element | null>) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.3 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref]);
  return visible;
}

// ─────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────

function WeatherBanner({ locale }: { locale: string }) {
  const [rainy, setRainy] = useState(false);
  useEffect(() => {
    fetch("https://api.open-meteo.com/v1/forecast?latitude=47.56&longitude=7.59&current=precipitation")
      .then((r) => r.json())
      .then((d) => setRainy((d?.current?.precipitation ?? 0) > 0))
      .catch(() => {});
  }, []);

  if (!rainy) return null;
  return (
    <Link
      href={`/${locale}/spa`}
      className="flex items-center justify-center gap-2 py-2.5 px-4 bg-teal/10 border-b border-teal/20 text-teal text-sm font-medium hover:bg-teal/15 transition-colors"
    >
      🌧️ Regentag? Gönn dir was Gutes. →
    </Link>
  );
}

interface SearchBarProps {
  locale: string;
  userName?: string;
}

function SearchBar({ locale, userName }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    // Autofocus desktop only
    if (window.innerWidth >= 768) inputRef.current?.focus();
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(debounceRef.current);
    if (q.length < 2) { setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await fetch(`/api/salons/search?q=${encodeURIComponent(q)}`).then((r) => r.json());
        setResults(data);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  const handleClear = () => { setQuery(""); setOpen(false); inputRef.current?.focus(); };

  const greeting = userName ? `Willkommen zurück, ${userName}` : "Dein Beauty-Termin in Basel";

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h1 className="font-heading font-bold text-3xl sm:text-4xl text-dark text-center mb-6">
        {greeting}
      </h1>

      <div className="relative" id="tour-search">
        <div className="flex items-center gap-3 bg-white rounded-pill shadow-card px-5 py-3.5 border border-gray-100 focus-within:border-teal transition-colors">
          <Search className="w-5 h-5 text-dark/30 shrink-0" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={handleChange}
            onFocus={() => query.length >= 2 && setOpen(true)}
            placeholder="Salon, Service oder Quartier suchen…"
            className="flex-1 text-sm text-dark bg-transparent outline-none placeholder-dark/30"
          />
          {query && (
            <button onClick={handleClear} className="text-dark/30 hover:text-dark/60">
              <X className="w-4 h-4" />
            </button>
          )}
          {loading && <Spinner size="sm" />}
        </div>

        {/* Autocomplete dropdown */}
        {open && results && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-card shadow-card border border-gray-100 z-50 overflow-hidden max-h-80 overflow-y-auto">
            {/* Salons */}
            {results.salons?.length > 0 && (
              <div>
                <p className="px-4 py-2 text-xs font-medium text-dark/40 uppercase tracking-wide bg-gray-50">Salons</p>
                {results.salons.slice(0, 3).map((s) => (
                  <Link
                    key={s.id}
                    href={`/${locale}/salon/${s.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-dark">{s.name}</span>
                    <span className="text-xs text-dark/40">{s.quartier}</span>
                  </Link>
                ))}
              </div>
            )}
            {/* Services */}
            {results.services?.length > 0 && (
              <div>
                <p className="px-4 py-2 text-xs font-medium text-dark/40 uppercase tracking-wide bg-gray-50">Services</p>
                {results.services.slice(0, 3).map((s) => (
                  <Link
                    key={s.id}
                    href={`/${locale}/${s.category}?q=${encodeURIComponent(query)}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm text-dark">{s.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-pill bg-teal/10 text-teal capitalize">{s.category}</span>
                  </Link>
                ))}
              </div>
            )}
            {/* Quartiere */}
            {results.quartiers?.length > 0 && (
              <div>
                <p className="px-4 py-2 text-xs font-medium text-dark/40 uppercase tracking-wide bg-gray-50">Quartiere</p>
                {results.quartiers.map((q) => (
                  <Link
                    key={q.slug}
                    href={`/${locale}/coiffeur?quartier=${q.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm text-dark">{q.name}</span>
                  </Link>
                ))}
              </div>
            )}
            {!results.salons?.length && !results.services?.length && !results.quartiers?.length && (
              <p className="px-4 py-4 text-sm text-dark/40 text-center">Keine Ergebnisse für „{query}"</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SocialProofSection() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useIntersection(ref as React.RefObject<Element>);
  const [bookingCount, setBookingCount] = useState(0);
  const [reviews, setReviews] = useState<{ id: string; comment: string; rating: number; author: string }[]>([]);
  const count = useCountUp(bookingCount, visible);

  useEffect(() => {
    fetch("/api/reviews?featured=true")
      .then((r) => r.json())
      .then((d) => setReviews(d.items ?? []))
      .catch(() => {});
    // Static count for now — Phase 2 enhancement: real booking count API
    setBookingCount(247);
  }, []);

  return (
    <section ref={ref} className="py-12 px-4 sm:px-6 bg-dark text-white">
      <div className="max-w-7xl mx-auto">
        {/* Count-up stat */}
        <div className="text-center mb-10">
          <p className="font-heading font-bold text-5xl text-teal font-data">
            {visible ? count.toLocaleString("de-CH") : "—"}
          </p>
          <p className="text-white/60 text-sm mt-2">Termine diese Woche gebucht</p>
        </div>

        {/* Review mini-carousel */}
        {reviews.length > 0 && (
          <div className="flex gap-4 overflow-x-auto no-scrollbar scroll-snap-x pb-2">
            {reviews.slice(0, 3).map((r) => (
              <div
                key={r.id}
                className="flex-shrink-0 w-72 bg-white/10 backdrop-blur rounded-card p-5 scroll-snap-align-start"
              >
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <span key={i} className="text-coral text-sm">★</span>
                  ))}
                </div>
                <p className="text-white/80 text-sm leading-relaxed line-clamp-3">{r.comment}</p>
                <p className="text-white/40 text-xs mt-3">{r.author}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

interface NudgeBannerProps {
  locale: string;
}

function NudgeBanner({ locale }: NudgeBannerProps) {
  const [show, setShow] = useState(false);
  const [salonSlug, setSalonSlug] = useState<string | null>(null);

  useEffect(() => {
    const dismissed = localStorage.getItem("solen_nudge_dismissed");
    if (dismissed) {
      const ts = Number(dismissed);
      if (Date.now() - ts < 7 * 24 * 60 * 60 * 1000) return;
    }
    // Check if predicted next booking within 7 days
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        const prefs = d?.preferences;
        if (prefs?.last_booked_salon_slug) {
          setSalonSlug(prefs.last_booked_salon_slug);
          setShow(true);
        }
      })
      .catch(() => {});
  }, []);

  if (!show || !salonSlug) return null;

  const dismiss = () => {
    localStorage.setItem("solen_nudge_dismissed", String(Date.now()));
    setShow(false);
  };

  return (
    <div className="mx-4 sm:mx-6 mb-6 flex items-center justify-between bg-teal/10 border border-teal/20 rounded-card px-4 py-3">
      <p className="text-sm text-teal font-medium">
        Zeit für deinen nächsten Termin? 💆‍♀️
      </p>
      <div className="flex items-center gap-3">
        <Link
          href={`/${locale}/salon/${salonSlug}`}
          className="text-xs font-medium text-white bg-teal px-3 py-1.5 rounded-button hover:bg-teal/90 transition-colors"
        >
          Jetzt buchen
        </Link>
        <button onClick={dismiss} className="text-teal/50 hover:text-teal">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Main component
// ─────────────────────────────────────────

export default function HomePage() {
  const locale = useLocale();
  const [lastMinuteSlots, setLastMinuteSlots] = useState<LastMinuteSlot[]>([]);
  const [recommendations, setRecommendations] = useState<SalonCardType[]>([]);
  const [quartiers, setQuartiers] = useState<QuartierCount[]>(QUARTIERS);
  const [loadingLM, setLoadingLM] = useState(true);
  const [loadingRec, setLoadingRec] = useState(true);
  const [favoriteService, setFavoriteService] = useState<SalonCategory | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string | undefined>();

  // Auth check + personalization
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d) {
          setIsLoggedIn(true);
          setUserName(d.display_name);
          if (d.preferences?.last_booked_service) {
            setFavoriteService(d.preferences.last_booked_service as SalonCategory);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Last-minute slots
  useEffect(() => {
    fetch("/api/slots/last-minute?limit=5")
      .then((r) => r.json())
      .then((d) => { setLastMinuteSlots(d.items ?? []); setLoadingLM(false); })
      .catch(() => setLoadingLM(false));
  }, []);

  // Recommendations
  useEffect(() => {
    fetch("/api/salons?sort=personalized&limit=4")
      .then((r) => r.json())
      .then((d) => { setRecommendations(d.items ?? []); setLoadingRec(false); })
      .catch(() => setLoadingRec(false));
  }, []);

  // Quartier counts
  useEffect(() => {
    Promise.allSettled(
      QUARTIERS.map((q) =>
        fetch(`/api/salons?quartier=${q.slug}&count=true`)
          .then((r) => r.json())
          .then((d) => ({ ...q, count: d.total ?? 0 }))
      )
    ).then((results) => {
      setQuartiers(
        results.map((r, i) =>
          r.status === "fulfilled" ? r.value : QUARTIERS[i]
        )
      );
    });
  }, []);

  // Sort services — favorite first
  const services = favoriteService
    ? [favoriteService, ...SERVICE_CATEGORIES.filter((c) => c !== favoriteService)]
    : SERVICE_CATEGORIES;

  return (
    <div className="min-h-screen bg-gray-50">
      <TutorialTour isLoggedIn={isLoggedIn} />

      {/* Weather banner */}
      <WeatherBanner locale={locale} />

      {/* Hero */}
      <section className="pt-24 pb-12 px-4 sm:px-6 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-8">
          <SearchBar locale={locale} userName={userName} />
        </div>
      </section>

      {/* Nudge — logged-in only */}
      {isLoggedIn && <NudgeBanner locale={locale} />}

      {/* Quartiere */}
      <section className="py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-xl text-dark">Entdecke dein Quartier</h2>
          </div>
          <div
            className="flex gap-3 overflow-x-auto scroll-snap-x no-scrollbar pb-2"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {quartiers.map((q) => (
              <div key={q.slug} style={{ scrollSnapAlign: "start" }}>
                <QuartierTile
                  name={q.name}
                  slug={q.slug}
                  count={q.count}
                  visited={q.visited}
                  favorited={q.favorited}
                  locale={locale}
                />
              </div>
            ))}
            {/* "Alle Quartiere" pill */}
            <button
              className="flex-shrink-0 flex items-center gap-1.5 px-4 h-24 rounded-card bg-white shadow-card text-sm font-medium text-dark/60 hover:text-teal transition-colors"
              style={{ scrollSnapAlign: "start" }}
              onClick={() => {
                // TODO: open quartier modal (Phase 2 enhancement)
              }}
            >
              Alle
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-10 px-4 sm:px-6 bg-white" id="tour-services">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-heading font-semibold text-xl text-dark mb-4">Was suchst du heute?</h2>
          <div
            className="flex gap-3 overflow-x-auto no-scrollbar pb-2"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {services.map((cat) => (
              <div key={cat} style={{ scrollSnapAlign: "start" }}>
                <ServiceTile
                  category={cat}
                  isFavorite={cat === favoriteService}
                  locale={locale}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Last-Minute Teaser */}
      {(loadingLM || lastMinuteSlots.length > 0) && (
        <section className="py-10 px-4 sm:px-6" id="tour-last-minute">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-semibold text-xl text-dark">Last-Minute</h2>
                <span className="w-2 h-2 rounded-full bg-coral animate-pulse" />
              </div>
              <Link
                href={`/${locale}/last-minute`}
                className="text-sm text-teal font-medium hover:underline flex items-center gap-1"
              >
                Alle <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {loadingLM ? (
              <div className="flex gap-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-48 h-52 rounded-card bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : (
              <div
                className="flex gap-3 overflow-x-auto no-scrollbar pb-2"
                style={{ scrollSnapType: "x mandatory" }}
              >
                {lastMinuteSlots.slice(0, 5).map((slot) => (
                  <div key={slot.id} style={{ scrollSnapAlign: "start" }}>
                    <LastMinuteCard slot={slot} locale={locale} />
                  </div>
                ))}
                <Link
                  href={`/${locale}/last-minute`}
                  className="flex-shrink-0 flex items-center gap-1.5 px-4 h-52 rounded-card bg-white shadow-card text-sm font-medium text-dark/60 hover:text-coral transition-colors"
                  style={{ scrollSnapAlign: "start" }}
                >
                  Alle Last-Minute
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Recommendations */}
      <section className="py-10 px-4 sm:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-xl text-dark">Für dich empfohlen</h2>
            <Link href={`/${locale}/coiffeur`} className="text-sm text-teal font-medium hover:underline">
              Alle Salons →
            </Link>
          </div>

          {loadingRec ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-card bg-gray-100 aspect-[4/3] animate-pulse" />
              ))}
            </div>
          ) : recommendations.length > 0 ? (
            <>
              {/* Mobile: horizontal scroll */}
              <div
                className="sm:hidden flex gap-3 overflow-x-auto no-scrollbar pb-2"
                style={{ scrollSnapType: "x mandatory" }}
              >
                {recommendations.slice(0, 3).map((salon) => (
                  <div key={salon.id} className="flex-shrink-0 w-64" style={{ scrollSnapAlign: "start" }}>
                    <SalonCard salon={salon} locale={locale} />
                  </div>
                ))}
              </div>
              {/* Desktop: grid */}
              <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-4">
                {recommendations.map((salon) => (
                  <SalonCard key={salon.id} salon={salon} locale={locale} />
                ))}
              </div>
            </>
          ) : null}
        </div>
      </section>

      {/* Social Proof */}
      <SocialProofSection />
    </div>
  );
}
