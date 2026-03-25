'use client';

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, MapPin, X, ArrowRight, TrendingUp } from "lucide-react";
import { SalonCard } from "../components/SalonCard";
import { LastMinuteCard } from "../components/LastMinuteCard";
import { QuartierTile } from "../components/QuartierTile";
import { ServiceTile } from "../components/ServiceTile";
import { Spinner } from "../components/ui/Spinner";
import { QUARTIERS, SERVICE_CATEGORIES } from "../lib/quartiers";
import type { Salon, LastMinuteSalon, UserProfile, UserPreferences, Review } from "../lib/types";

interface WeatherData {
  current_weather?: { weathercode: number; temperature: number };
}

function isRainyOrCold(weather: WeatherData): boolean {
  const code = weather.current_weather?.weathercode ?? 0;
  const temp = weather.current_weather?.temperature ?? 20;
  return code >= 51 || temp < 8; // rain codes 51+ or below 8°C
}

interface SearchResult {
  type: "salon" | "service" | "quartier";
  label: string;
  sublabel?: string;
  href: string;
}

let searchDebounceTimer: ReturnType<typeof setTimeout>;

export function HomePage({ locale = "de" }: { locale?: string }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [lastMinuteItems, setLastMinuteItems] = useState<LastMinuteSalon[]>([]);
  const [recommendations, setRecommendations] = useState<Salon[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [weeklyCount, setWeeklyCount] = useState(0);
  const [weeklyCountDisplay, setWeeklyCountDisplay] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showWeatherBanner, setShowWeatherBanner] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(() => {
    const val = localStorage.getItem("solen_nudge_dismissed");
    return val ? Date.now() - Number(val) < 7 * 24 * 60 * 60 * 1000 : false;
  });
  const [showNudge, setShowNudge] = useState(false);
  const [showLastMinuteFloating, setShowLastMinuteFloating] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Fetch all data on mount
  useEffect(() => {
    // Profile
    fetch("/api/profile")
      .then((r) => r.json())
      .then(setProfile)
      .catch(() => {});

    // Preferences
    fetch("/api/profile/preferences")
      .then((r) => r.json())
      .then((data: UserPreferences) => {
        setPreferences(data);
        // Nudge logic: check if within 1 week of next booking
        if (data.booking_intervals?.length) {
          const interval = data.booking_intervals[0];
          if (interval) {
            const lastDate = new Date(interval.last_booking_date);
            const predictedNext = new Date(lastDate);
            predictedNext.setDate(predictedNext.getDate() + interval.avg_days);
            const daysUntilNext = (predictedNext.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
            if (daysUntilNext <= 7 && !nudgeDismissed) setShowNudge(true);
          }
        }
        // Floating last-minute pill
        const sameDay = data.booking_intervals?.filter((b) => {
          const d = new Date(b.last_booking_date);
          return d.toDateString() === new Date().toDateString();
        });
        if ((sameDay?.length ?? 0) >= 2) setShowLastMinuteFloating(true);
      })
      .catch(() => {});

    // Last-minute
    fetch("/api/salons/last-minute?limit=5")
      .then((r) => r.json())
      .then((data: LastMinuteSalon[]) => setLastMinuteItems(data ?? []))
      .catch(() => {});

    // Recommendations
    fetch("/api/salons?sort=personalized&limit=4")
      .then((r) => r.json())
      .then((data: { salons: Salon[] }) => setRecommendations(data.salons ?? []))
      .catch(() => {});

    // Reviews
    fetch("/api/reviews?sort=recent&limit=3")
      .then((r) => r.json())
      .then((data: Review[]) => setReviews(data ?? []))
      .catch(() => {});

    // Stats
    fetch("/api/stats/weekly-bookings")
      .then((r) => r.json())
      .then((data: { count: number }) => setWeeklyCount(data.count ?? 127))
      .catch(() => setWeeklyCount(127));

    // Weather
    fetch("https://api.open-meteo.com/v1/forecast?latitude=47.5596&longitude=7.5886&current_weather=true")
      .then((r) => r.json())
      .then((data: WeatherData) => setShowWeatherBanner(isRainyOrCold(data)))
      .catch(() => {});
  }, []);

  // Count-up animation on scroll
  useEffect(() => {
    if (!weeklyCount || !statsRef.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      let start = 0;
      const step = Math.ceil(weeklyCount / 40);
      const timer = setInterval(() => {
        start = Math.min(start + step, weeklyCount);
        setWeeklyCountDisplay(start);
        if (start >= weeklyCount) clearInterval(timer);
      }, 30);
      observer.disconnect();
    }, { threshold: 0.3 });
    observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, [weeklyCount, statsRef.current]);

  // Search
  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    clearTimeout(searchDebounceTimer);
    if (!q.trim()) { setSearchResults([]); setShowSearchResults(false); return; }
    setIsSearching(true);
    searchDebounceTimer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/salons/search?q=${encodeURIComponent(q)}`);
        const data: { salons?: Salon[]; services?: { name: string; category: string }[]; quartiers?: string[] } = await res.json();
        const results: SearchResult[] = [
          ...(data.salons ?? []).slice(0, 4).map((s) => ({
            type: "salon" as const,
            label: s.name,
            sublabel: s.quartier,
            href: `/${locale}/salon/${s.slug}`,
          })),
          ...(data.services ?? []).slice(0, 3).map((s) => ({
            type: "service" as const,
            label: s.name,
            sublabel: s.category,
            href: `/${locale}/${s.category}?q=${encodeURIComponent(s.name)}`,
          })),
          ...(data.quartiers ?? []).slice(0, 3).map((q2) => ({
            type: "quartier" as const,
            label: q2,
            href: `/${locale}/coiffeur?quartier=${q2.toLowerCase()}`,
          })),
        ];
        setSearchResults(results);
        setShowSearchResults(true);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, [locale]);

  // Reorder quartiers based on preferences
  const orderedQuartiers = preferences?.top_quartier
    ? [
        ...QUARTIERS.filter((q) => q.id === preferences.top_quartier),
        ...QUARTIERS.filter((q) => q.id !== preferences.top_quartier),
      ]
    : QUARTIERS;

  // Reorder service categories based on last booked
  const orderedServices = preferences?.last_booked_category
    ? [
        ...SERVICE_CATEGORIES.filter((s) => s.id === preferences.last_booked_category),
        ...SERVICE_CATEGORIES.filter((s) => s.id !== preferences.last_booked_category),
      ]
    : [...SERVICE_CATEGORIES];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="pt-28 pb-10 px-4 max-w-2xl mx-auto">
        <h1 className="font-heading font-bold text-3xl md:text-4xl text-dark mb-2 text-center">
          {profile ? `Willkommen zurück, ${profile.display_name}` : "Dein Beauty-Termin in Basel"}
        </h1>

        {/* Weather banner */}
        {showWeatherBanner && (
          <a
            href={`/${locale}/spa`}
            className="block mt-3 mb-4 mx-auto max-w-md bg-teal/10 border border-teal/20 rounded-card px-4 py-2.5 text-sm text-center text-dark hover:bg-teal/15 transition-colors"
          >
            🌧️ Regentag? Gönn dir was Gutes. <span className="text-teal font-medium underline">Spa entdecken →</span>
          </a>
        )}

        {/* Search bar */}
        <div className="relative mt-4">
          <div className="relative flex items-center bg-white border border-gray-200 rounded-btn shadow-card overflow-hidden focus-within:border-teal focus-within:ring-2 focus-within:ring-teal/20 transition-all">
            <Search size={18} className="absolute left-4 text-gray-400 pointer-events-none" />
            <input
              ref={searchRef}
              type="search"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
              placeholder="Salon, Service oder Quartier suchen..."
              autoFocus
              className="w-full pl-11 pr-10 py-3.5 text-sm text-dark placeholder-gray-400 bg-transparent focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); setSearchResults([]); setShowSearchResults(false); }}
                className="absolute right-3 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Search results dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-full mt-1 w-full bg-white rounded-card shadow-card border border-gray-100 py-1 z-30 max-h-80 overflow-y-auto">
              {/* Group by type */}
              {[
                { type: "salon", label: "Salons" },
                { type: "service", label: "Services" },
                { type: "quartier", label: "Quartiere" },
              ].map(({ type, label }) => {
                const items = searchResults.filter((r) => r.type === type);
                if (!items.length) return null;
                return (
                  <div key={type}>
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide px-3 pt-2 pb-1">{label}</p>
                    {items.map((result, i) => (
                      <a
                        key={i}
                        href={result.href}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors"
                        onClick={() => setShowSearchResults(false)}
                      >
                        <span className="flex-1 text-sm text-dark">{result.label}</span>
                        {result.sublabel && (
                          <span className="text-xs text-gray-400">{result.sublabel}</span>
                        )}
                      </a>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {isSearching && (
            <div className="absolute top-full mt-1 w-full flex justify-center py-3">
              <Spinner size={20} />
            </div>
          )}
        </div>
      </section>

      {/* Personalized Nudge */}
      {showNudge && !nudgeDismissed && (
        <div className="mx-4 max-w-xl md:mx-auto mb-4 bg-teal/5 border border-teal/20 rounded-card px-4 py-3 flex items-center justify-between gap-3">
          <a
            href={`/${locale}/coiffeur?quartier=${preferences?.top_quartier ?? ""}`}
            className="text-sm text-dark hover:text-teal transition-colors flex-1"
          >
            Zeit für deinen nächsten Haarschnitt? Dein letzter war vor{" "}
            {preferences?.booking_intervals?.[0]
              ? Math.round(
                  (Date.now() - new Date(preferences.booking_intervals[0].last_booking_date).getTime()) /
                    (1000 * 60 * 60 * 24)
                ) + " Tagen"
              : "einiger Zeit"}.
          </a>
          <button
            onClick={() => {
              setNudgeDismissed(true);
              setShowNudge(false);
              localStorage.setItem("solen_nudge_dismissed", String(Date.now()));
            }}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
            aria-label="Schließen"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Quartier Section */}
      <section className="py-6 px-4 max-w-6xl mx-auto">
        <h2 className="font-heading font-semibold text-dark text-lg mb-3">Entdecke dein Quartier</h2>
        <div className="flex gap-3 overflow-x-auto scrollbar-none snap-x-mandatory pb-2 -mx-4 px-4">
          {orderedQuartiers.map((quartier) => (
            <QuartierTile
              key={quartier.id}
              quartier={quartier}
              isVisited={preferences?.visited_quartier_ids?.includes(quartier.id)}
              isFavorited={preferences?.favorite_salon_ids?.some((id) => id.startsWith(quartier.id))}
              lastCategory={preferences?.last_booked_category ?? "coiffeur"}
            />
          ))}
          <a
            href="#quartiere-alle"
            className="flex-shrink-0 snap-start w-[120px] h-[100px] rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-sm text-teal font-medium hover:bg-gray-100 transition-colors"
          >
            Alle Quartiere →
          </a>
        </div>
      </section>

      {/* Service Category Section */}
      <section className="py-6 px-4 max-w-6xl mx-auto">
        <h2 className="font-heading font-semibold text-dark text-lg mb-3">Was suchst du heute?</h2>
        <div className="flex gap-3 overflow-x-auto scrollbar-none snap-x-mandatory pb-2 -mx-4 px-4">
          {orderedServices.map((service) => (
            <ServiceTile
              key={service.id}
              id={service.id}
              label={service.label}
              icon={service.icon}
              startingPrice={service.startingPrice}
              isFavorite={preferences?.last_booked_category === service.id}
            />
          ))}
        </div>
      </section>

      {/* Last-Minute Section */}
      {lastMinuteItems.length > 0 && (
        <section className="py-6 px-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-heading font-semibold text-dark text-lg">Last-Minute Heute</h2>
            <span className="w-2 h-2 rounded-full bg-coral pulse-coral inline-block" />
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-none snap-x-mandatory pb-2 -mx-4 px-4">
            {lastMinuteItems.map((item) => (
              <LastMinuteCard key={item.id} item={item} />
            ))}
            <a
              href={`/${locale}/last-minute`}
              className="flex-shrink-0 snap-start w-[160px] h-[220px] rounded-card bg-gray-50 border border-gray-200 flex items-center justify-center text-sm text-coral font-medium hover:bg-gray-100 transition-colors text-center px-3"
            >
              Alle Last-Minute →
            </a>
          </div>
        </section>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <section className="py-6 px-4 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-semibold text-dark text-lg">Empfohlen für dich</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendations.map((salon) => (
              <SalonCard key={salon.id} salon={salon} />
            ))}
          </div>
          <div className="mt-4 text-center">
            <a
              href={`/${locale}/coiffeur`}
              className="text-sm text-teal font-medium hover:underline inline-flex items-center gap-1"
            >
              Alle Salons entdecken <ArrowRight size={14} />
            </a>
          </div>
        </section>
      )}

      {/* Social Proof */}
      <section className="py-8 px-4 max-w-6xl mx-auto" ref={statsRef}>
        <div className="text-center mb-6">
          <p className="font-heading font-bold text-3xl text-dark">
            <span className="font-data text-teal">{weeklyCountDisplay || weeklyCount}</span>
            {" "}Termine diese Woche gebucht
          </p>
          <p className="text-sm text-gray-500 mt-1 flex items-center justify-center gap-1">
            <TrendingUp size={14} className="text-teal" />
            Beliebt in Basel
          </p>
        </div>

        {reviews.length > 0 && (
          <div className="flex gap-4 overflow-x-auto scrollbar-none pb-2 -mx-4 px-4">
            {reviews.map((review) => (
              <div key={review.id} className="flex-shrink-0 w-72 bg-white rounded-card shadow-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  {review.avatar_url ? (
                    <img src={review.avatar_url} alt={review.display_name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-teal/20 flex items-center justify-center text-teal font-bold text-sm">
                      {review.display_name[0]}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-dark">{review.display_name}</p>
                    <div className="flex">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span key={i} className={`text-xs ${i < review.rating ? "text-amber-400" : "text-gray-200"}`}>★</span>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{review.text}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Floating Last-Minute pill */}
      {showLastMinuteFloating && (
        <div
          className="fixed bottom-6 right-4 z-40"
          style={{ animation: "slideUp 0.3s ease" }}
        >
          <a
            href={`/${locale}/last-minute`}
            className="flex items-center gap-2 bg-coral text-white px-4 py-2.5 rounded-pill shadow-coral-glow text-sm font-semibold"
          >
            <span className="w-2 h-2 bg-white rounded-full pulse-coral" />
            3 Last-Minute Slots jetzt
          </a>
        </div>
      )}
    </div>
  );
}
