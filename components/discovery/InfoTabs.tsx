"use client";

import { useState } from "react";
import type { DiscoveryItem } from "@/lib/types";
import SalonScript from "./SalonScript";
import CutGuide from "./CutGuide";

interface InfoTabsProps {
  item: DiscoveryItem;
  locale: string;
}

type Tab = "script" | "guide";

export default function InfoTabs({ item, locale }: InfoTabsProps) {
  const hasScript = !!(item.salon_script || item.salon_script_de || item.salon_script_fr || item.salon_script_it);
  const hasGuide = !!item.cut_guide;

  if (!hasScript && !hasGuide) return null;

  const tabs: { key: Tab; label: string }[] = [];
  if (hasScript) tabs.push({ key: "script", label: locale === "de" ? "Was dem Friseur sagen" : locale === "fr" ? "Quoi dire au coiffeur" : locale === "it" ? "Cosa dire al parrucchiere" : "What to tell your stylist" });
  if (hasGuide) tabs.push({ key: "guide", label: locale === "de" ? "Schnittanleitung" : locale === "fr" ? "Guide de coupe" : locale === "it" ? "Guida al taglio" : "Cut guide" });

  const [active, setActive] = useState<Tab>(tabs[0].key);

  return (
    <div className="mt-4 px-1">
      {tabs.length > 1 && (
        <div className="flex gap-1 mb-3 bg-s-ink/5 dark:bg-white/5 rounded-pill p-0.5 w-fit">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={[
                "px-3 py-1.5 rounded-pill text-xs font-medium transition-colors",
                active === key
                  ? "bg-white dark:bg-s-dm-surface text-s-ink dark:text-s-dm-text shadow-warm-sm"
                  : "text-s-ink/40 dark:text-s-dm-text/40",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {active === "script" && hasScript && <SalonScript item={item} locale={locale} />}
      {active === "guide" && hasGuide && <CutGuide guide={item.cut_guide!} />}
    </div>
  );
}
