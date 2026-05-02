"use client";

import { Sparkles } from "lucide-react";
import type { DiscoveryItem } from "@/lib/types";

interface DescriptionCardProps {
  item: DiscoveryItem;
  locale: string;
}

function getLocalizedDescription(item: DiscoveryItem, locale: string): string | null {
  const key = `description_${locale}` as keyof DiscoveryItem;
  return (item[key] as string | null) ?? item.description;
}

const MAINTENANCE_CONFIG = {
  low: { label: "Low maintenance", color: "bg-s-success-bg text-s-success border-s-success/20" },
  medium: { label: "Medium maintenance", color: "bg-s-amber/10 text-s-amber border-s-amber/20" },
  high: { label: "High maintenance", color: "bg-s-error-bg text-s-error border-s-error/20" },
};

const FALLBACKS: Record<string, string> = {
  de: "Stil wird analysiert...",
  en: "Analyzing this style...",
  fr: "Analyse du style en cours...",
  it: "Analisi dello stile in corso...",
};

export default function DescriptionCard({ item, locale }: DescriptionCardProps) {
  const desc = getLocalizedDescription(item, locale);
  const maintenance = item.maintenance as keyof typeof MAINTENANCE_CONFIG | null;
  const maintenanceConfig = maintenance ? MAINTENANCE_CONFIG[maintenance] : null;

  return (
    <div className="mt-4 px-1">
      <div className="p-4 rounded-[16px] bg-s-bg-surface border border-s-ink/5">
        {/* AI-generated tag */}
        <div className="flex items-center gap-1.5 mb-3">
          <Sparkles size={12} className="text-violet-400" />
          <span className="text-[10px] text-s-ink/30 font-medium">AI-generated</span>
        </div>

        {/* Description */}
        {desc ? (
          <p className="text-sm text-s-ink/80 leading-relaxed whitespace-pre-line">
            {desc}
          </p>
        ) : item.alt_text ? (
          /* Use TikTok caption as temporary description */
          <div>
            <p className="text-sm text-s-ink/70 leading-relaxed">
              {item.alt_text}
            </p>
            <p className="text-[10px] text-s-ink/25 mt-2 italic">
              {locale === "de" ? "Originalbeschreibung — KI-Analyse folgt" : "Original caption — AI analysis coming soon"}
            </p>
          </div>
        ) : (
          <p className="text-xs text-s-ink/30">{FALLBACKS[locale] ?? FALLBACKS.en}</p>
        )}

        {/* Maintenance level */}
        {maintenanceConfig && (
          <div className="mt-3">
            <span className={`text-[10px] px-2 py-0.5 rounded-pill border font-medium ${maintenanceConfig.color}`}>
              {maintenanceConfig.label}
            </span>
          </div>
        )}

        {/* Face shapes */}
        {item.face_shapes?.length > 0 && (
          <div className="mt-3">
            <p className="text-[10px] text-s-ink/40 font-medium mb-1.5">Works for face shapes</p>
            <div className="flex flex-wrap gap-1">
              {item.face_shapes.map((shape) => (
                <span key={shape} className="text-[10px] px-2 py-0.5 rounded-pill bg-s-ink/5 text-s-ink/60 capitalize">
                  {shape}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Hair type match */}
        {item.hair_type_match?.length > 0 && (
          <div className="mt-3">
            <p className="text-[10px] text-s-ink/40 font-medium mb-1.5">Best for hair types</p>
            <div className="flex flex-wrap gap-1">
              {item.hair_type_match.map((type) => (
                <span key={type} className="text-[10px] px-2 py-0.5 rounded-pill bg-s-coral/5 text-s-coral/70 capitalize">
                  {type}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
