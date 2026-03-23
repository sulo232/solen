"use client";

import { useState } from "react";
import { Scissors, Copy, Check, MessageCircle } from "lucide-react";
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

const TITLES: Record<string, string> = {
  de: "Was dem Friseur sagen",
  en: "What to tell your stylist",
  fr: "Quoi dire au coiffeur",
  it: "Cosa dire al parrucchiere",
};

export default function SalonScript({ item, locale }: SalonScriptProps) {
  const script = getLocalizedScript(item, locale);
  const [copied, setCopied] = useState(false);

  if (!script) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
  };

  const handleWhatsApp = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `${TITLES[locale] ?? TITLES.en}:\n\n"${script}"\n\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="p-4 rounded-card bg-s-coral/5 border border-s-coral/10">
      <div className="flex items-center gap-2 mb-2">
        <Scissors size={14} className="text-s-coral" />
        <span className="text-xs font-medium text-s-coral">
          {TITLES[locale] ?? TITLES.de}
        </span>
      </div>
      <p className="text-sm text-s-ink/80 dark:text-s-dm-text/80 leading-relaxed italic whitespace-pre-line">
        &ldquo;{script}&rdquo;
      </p>
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-s-ink/5 dark:bg-white/5 text-xs text-s-ink/60 dark:text-s-dm-text/60 hover:bg-s-ink/10 dark:hover:bg-white/10 transition-colors"
        >
          {copied ? <Check size={12} className="text-s-success" /> : <Copy size={12} />}
          {copied ? "Copied!" : "Copy"}
        </button>
        <button
          onClick={handleWhatsApp}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-s-success-bg text-xs text-s-success hover:bg-s-success/15 transition-colors"
        >
          <MessageCircle size={12} />
          WhatsApp
        </button>
      </div>
    </div>
  );
}
