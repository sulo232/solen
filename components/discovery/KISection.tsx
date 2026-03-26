"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { usePostHog } from "posthog-js/react";
import { SalonCard } from "@/components";
import Skeleton from "@/components/ui/Skeleton";
import { RefreshCw } from "lucide-react";

interface RecommendedSalon {
  id: string;
  name: string;
  slug: string;
  cover_photo_url: string | null;
  average_rating: number;
  review_count: number;
  categories: string[];
  ai_reason?: string;
  ai_score?: number;
}

interface KISectionProps {
  zone?: 1 | 2 | 3 | 4; // Zone-aware styling per UI_RULES
  className?: string;
}

/**
 * KI (AI) Recommendations Section
 *
 * Zone 1 (Maximalist) visual identity:
 * - Warm gradient background (coral-subtle → sand-subtle)
 * - Premium spacing (py-12)
 * - Gemini 2.0 Flash AI-powered salon recommendations
 * - Locale-aware reason text
 * - Skeleton loading state (no custom shimmers)
 * - Manual refresh button
 */
export function KISection({ zone = 1, className = "" }: KISectionProps) {
  const t = useTranslations("recommendations");
  const locale = useLocale() as "de" | "en" | "fr" | "it";
  const posthog = usePostHog();

  const [recommendations, setRecommendations] = useState<RecommendedSalon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async (forceRefresh = false) => {
    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      // Get last viewed salon IDs from localStorage
      const viewedSalonsRaw = localStorage.getItem("solen_viewed_salons");
      const viewedSalonIds = viewedSalonsRaw ? JSON.parse(viewedSalonsRaw) : [];

      const params = new URLSearchParams({
        locale,
        viewedSalonIds: JSON.stringify(viewedSalonIds.slice(0, 10)),
      });

      const response = await fetch(`/api/recommendations?${params}`);
      const data = await response.json();

      if (data.fallback) {
        // AI unavailable or no recommendations
        setRecommendations([]);
        setError(data.message || null);
      } else {
        setRecommendations(data.recommendations || []);
      }
    } catch (e: any) {
      console.error("[KISection] Fetch error:", e);
      setError("Could not load recommendations");
      setRecommendations([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  // Don't render empty section
  if (!isLoading && recommendations.length === 0 && !error) {
    return null;
  }

  return (
    <section
      className={`py-12 bg-gradient-to-b from-s-coral-subtle/40 to-s-bg-base ${className}`}
    >
      <div className="container px-4 md:px-6 mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-heading text-s-ink text-2xl md:text-3xl">
            {t("for_you")}
          </h2>
          <button
            onClick={() => {
              posthog?.capture("ki_refresh_clicked", {
                locale,
                zone,
              });
              fetchRecommendations(true);
            }}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-heading font-bold uppercase tracking-[0.06em] text-s-ink-secondary hover:text-s-coral transition-colors disabled:opacity-50"
            aria-label={t("refresh")}
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">{t("refresh")}</span>
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton variant="card" />
            <Skeleton variant="card" />
            <Skeleton variant="card" />
          </div>
        )}

        {/* Error State (graceful degradation) */}
        {!isLoading && error && (
          <div className="text-center py-12">
            <p className="text-s-ink-secondary text-sm">{error}</p>
          </div>
        )}

        {/* Recommendations Grid */}
        {!isLoading && recommendations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendations.map((salon) => (
              <div
                key={salon.id}
                className="relative"
                onClick={() => {
                  posthog?.capture("ki_card_clicked", {
                    salon_id: salon.id,
                    salon_name: salon.name,
                    salon_slug: salon.slug,
                    ai_score: salon.ai_score,
                    is_ki_recommendation: true,
                  });
                }}
              >
                <SalonCard
                  salon={salon as any}
                  aiReason={salon.ai_reason}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
