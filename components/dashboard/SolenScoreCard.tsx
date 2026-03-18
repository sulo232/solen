"use client";

import { useEffect, useState } from "react";
import { Trophy, TrendingUp, Star, MessageCircle, UserCheck, Briefcase, Clock, Activity } from "lucide-react";

interface ScoreDetails {
  rating: number;    // max 30
  reviews: number;   // max 15
  response: number;  // max 15
  profile: number;   // max 15
  bookings: number;  // max 15
  activity: number;  // max 10
}

interface SolenScoreData {
  solen_score: number;
  solen_tier: "gold" | "teal" | "grey" | "dark";
  score_details: ScoreDetails;
}

const TIER_CONFIG = {
  gold: { label: "Top Salon", color: "#D4AF37", bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-200 dark:border-amber-700", icon: "⭐" },
  teal: { label: "Verifiziert", color: "#38B2AC", bg: "bg-teal/5 dark:bg-teal/10", border: "border-teal/20 dark:border-teal/30", icon: "🔵" },
  grey: { label: "Aktiv", color: "#9CA3AF", bg: "bg-gray-50 dark:bg-gray-800", border: "border-gray-200 dark:border-gray-700", icon: "⚪" },
  dark: { label: "Starter", color: "#6B7280", bg: "bg-gray-50 dark:bg-gray-800", border: "border-gray-200 dark:border-gray-700", icon: "🔘" },
};

const FACTOR_CONFIG = [
  { key: "rating" as const, label: "Bewertung", max: 30, Icon: Star, color: "text-amber-400" },
  { key: "reviews" as const, label: "Anzahl Reviews", max: 15, Icon: MessageCircle, color: "text-coral" },
  { key: "response" as const, label: "Antwortzeit", max: 15, Icon: Clock, color: "text-teal" },
  { key: "profile" as const, label: "Profil-Vollständigkeit", max: 15, Icon: UserCheck, color: "text-blue-500" },
  { key: "bookings" as const, label: "Buchungen", max: 15, Icon: Briefcase, color: "text-purple-500" },
  { key: "activity" as const, label: "Aktivität", max: 10, Icon: Activity, color: "text-emerald-500" },
];

const TIPS: Record<string, string> = {
  rating: "Biete exzellenten Service — zufriedene Kunden hinterlassen bessere Bewertungen.",
  reviews: "Bitte deine Stammkunden um eine Bewertung nach dem Besuch.",
  response: "Antworte schnell auf Nachrichten — Kunden schätzen schnelle Reaktionszeiten.",
  profile: "Vervollständige dein Profil: Foto, Beschreibung, Telefon und Öffnungszeiten.",
  bookings: "Mehr abgeschlossene Buchungen steigern deinen Score.",
  activity: "Logge dich regelmässig ein und halte deinen Kalender aktuell.",
};

/** Circular SVG progress meter */
function ScoreMeter({ score, tier }: { score: number; tier: SolenScoreData["solen_tier"] }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const tierColor = TIER_CONFIG[tier].color;

  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        {/* Background circle */}
        <circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" strokeWidth="8"
          className="text-gray-100 dark:text-gray-700" />
        {/* Progress arc */}
        <circle cx="60" cy="60" r={radius} fill="none" stroke={tierColor} strokeWidth="8"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference - progress}
          className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-data font-bold text-3xl text-dark dark:text-dm-text">{score}</span>
        <span className="text-[10px] text-dark/40 dark:text-dm-text/40 uppercase tracking-wide">Score</span>
      </div>
    </div>
  );
}

export default function SolenScoreCard({ salonId }: { salonId: string }) {
  const [data, setData] = useState<SolenScoreData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!salonId) return;
    fetch(`/api/salons/${salonId}/score`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [salonId]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-dm-surface rounded-card border border-gray-100 dark:border-white/5 p-6 shadow-card animate-pulse">
        <div className="h-32 w-32 mx-auto rounded-full bg-gray-100 dark:bg-gray-800" />
        <div className="mt-4 space-y-2">
          <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-2/3 mx-auto" />
          <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2 mx-auto" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const tier = TIER_CONFIG[data.solen_tier];
  const details = data.score_details;

  // Find lowest-scoring factor for improvement tip
  const lowestFactor = FACTOR_CONFIG.reduce((min, f) => {
    const pct = (details[f.key] ?? 0) / f.max;
    const minPct = (details[min.key] ?? 0) / min.max;
    return pct < minPct ? f : min;
  }, FACTOR_CONFIG[0]);

  return (
    <div className={`rounded-card border ${tier.border} ${tier.bg} p-6 shadow-card`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={18} style={{ color: tier.color }} />
        <h3 className="font-heading font-bold text-base text-dark dark:text-dm-text">Dein Solen Score</h3>
      </div>

      {/* Score meter */}
      <ScoreMeter score={data.solen_score} tier={data.solen_tier} />

      {/* Tier badge */}
      <div className="flex justify-center mt-3">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-xs font-bold"
          style={{ color: tier.color, backgroundColor: `${tier.color}15` }}
        >
          {tier.icon} {tier.label}
        </span>
      </div>

      {/* Factor breakdown */}
      <div className="mt-5 space-y-2.5">
        {FACTOR_CONFIG.map((f) => {
          const value = details[f.key] ?? 0;
          const pct = Math.round((value / f.max) * 100);
          return (
            <div key={f.key} className="flex items-center gap-2.5">
              <f.Icon size={13} className={`${f.color} shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs text-dark/60 dark:text-dm-text/60 truncate">{f.label}</span>
                  <span className="text-xs font-data font-medium text-dark dark:text-dm-text">{value}/{f.max}</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${pct}%`, backgroundColor: tier.color }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Improvement tip */}
      {data.solen_score < 80 && (
        <div className="mt-4 p-3 rounded-lg bg-white/60 dark:bg-white/5 border border-gray-100 dark:border-white/5">
          <div className="flex items-start gap-2">
            <TrendingUp size={14} className="text-teal shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-dark dark:text-dm-text">Tipp zur Verbesserung</p>
              <p className="text-xs text-dark/50 dark:text-dm-text/50 mt-0.5">
                {TIPS[lowestFactor.key]}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
