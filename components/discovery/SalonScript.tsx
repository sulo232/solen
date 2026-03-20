"use client";

import { Scissors } from "lucide-react";
import type { DiscoveryItem } from "@/lib/types";

interface SalonScriptProps {
  item: DiscoveryItem;
  locale: string;
}

function getLocalizedScript(item: DiscoveryItem, locale: string): string | null {
  if (locale === "de" && item.salon_script_de) return item.salon_script_de;
  if (locale === "fr" && item.salon_script_fr) return item.salon_script_fr;
  if (locale === "it" && item.salon_script_it) return item.salon_script_it;
  return item.salon_script;
}

export default function SalonScript({ item, locale }: SalonScriptProps) {
  const script = getLocalizedScript(item, locale);
  if (!script) return null;

  return (
    <div className="p-4 rounded-card bg-s-coral/5 border border-s-coral/10">
      <div className="flex items-center gap-2 mb-2">
        <Scissors size={14} className="text-s-coral" />
        <span className="text-xs font-medium text-s-coral">
          {locale === "de" ? "Was dem Friseur sagen" : locale === "fr" ? "Quoi dire" : locale === "it" ? "Cosa dire" : "What to say"}
        </span>
      </div>
      <p className="text-sm text-s-ink/80 dark:text-s-dm-text/80 leading-relaxed italic whitespace-pre-line">
        &ldquo;{script}&rdquo;
      </p>
    </div>
  );
}
