"use client";

import { useEffect, useState } from "react";
import { Trophy, TrendingUp, Star, MessageCircle, UserCheck, Briefcase, Clock, Activity, Shield, Circle } from "lucide-react";

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
  solen_tier: "gold" | "coral" | "grey" | "dark";
  score_details: ScoreDetails;
}

const TIER_CONFIG = {
  gold: { label: "Top Salon", color: "#D4870A", bg: "bg-s-amber-subtle dark:bg-s-amber-subtle", border: "border-s-amber/20 dark:border-s-amber/30", Icon: Star },
  coral: { label: "Verifiziert", color: "#E8624A", bg: "bg-s-coral/5 dark:bg-s-coral/10", border: "border-s-coral/20 dark:border-s-coral/30", Icon: Shield },
  grey: { label: "Aktiv", color: "#8A7A66", bg: "bg-s-bg-surface dark:bg-s-dm-surface", border: "border-s-ink/10 dark:border-white/10", Icon: Circle },
  dark: { label: "Starter", color: "#C4B8A6", bg: "bg-s-bg-surface dark:bg-s-dm-surface", border: "border-s-ink/10 dark:border-white/10", Icon: Circle },
};

const FACTOR_CONFIG = [
  { key: "rating" as const, label: "Bewertung", max: 30, Icon: Star, color: "text-s-amber" },
  { key: "reviews" as const, label: "Anzahl Reviews", max: 15, Icon: MessageCircle, color: "text-s-coral" },
  { key: "response" as const, label: "Antwortzeit", max: 15, Icon: Clock, color: "text-s-coral" },
  { key: "profile" as const, label: "Profil-Vollständigkeit", max: 15, Icon: UserCheck, color: "text-s-blue" },
  { key: "bookings" as const, label: "Buchungen", max: 15, Icon: Briefcase, color: "text-s-plum" },
  { key: "activity" as const, label: "Aktivität", max: 10, Icon: Activity, color: "text-s-sage" },
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
          className="text-s-ink/10 dark:text-s-dm-text/20" />
        {/* Progress arc */}
        <circle cx="60" cy="60" r={radius} fill="none" stroke={tierColor} strokeWidth="8"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference - progress}
          className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="data-text font-bold text-3xl text-s-ink dark:text-s-dm-text">{score}</span>
        <span className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40 uppercase tracking-wide">Score</span>
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
      <div className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/5 p-6 shadow-card animate-pulse">
        <div className="h-32 w-32 mx-auto rounded-full bg-s-bg-sunken dark:bg-s-dm-surface" />
        <div className="mt-4 space-y-2">
          <div className="h-4 bg-s-bg-sunken dark:bg-s-dm-surface rounded w-2/3 mx-auto" />
          <div className="h-3 bg-s-bg-sunken dark:bg-s-dm-surface rounded w-1/2 mx-auto" />
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
        <h3 className="font-heading font-bold text-base text-s-ink dark:text-s-dm-text">Dein Solen Score</h3>
      </div>

      {/* Score meter */}
      <ScoreMeter score={data.solen_score} tier={data.solen_tier} />

      {/* Tier badge */}
      <div className="flex justify-center mt-3">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-xs font-bold"
          style={{ color: tier.color, backgroundColor: `${tier.color}15` }}
        >
          <tier.Icon size={12} /> {tier.label}
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
                  <span className="text-xs text-s-ink/60 dark:text-s-dm-text/60 truncate">{f.label}</span>
                  <span className="text-xs data-text font-medium text-s-ink dark:text-s-dm-text">{value}/{f.max}</span>
                </div>
                <div className="h-1.5 rounded-full bg-s-sand dark:bg-s-dm-raised overflow-hidden">
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
        <div className="mt-4 p-3 rounded-card bg-white dark:bg-s-dm-surface border border-s-ink/5 dark:border-white/5">
          <div className="flex items-start gap-2">
            <TrendingUp size={14} className="text-s-coral shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-s-ink dark:text-s-dm-text">Tipp zur Verbesserung</p>
              <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 mt-0.5">
                {TIPS[lowestFactor.key]}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
