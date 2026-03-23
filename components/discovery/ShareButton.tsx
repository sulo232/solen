"use client";

import { useState } from "react";
import { Share2, Check, Link2, MessageCircle, Download } from "lucide-react";
import type { DiscoveryItem } from "@/lib/types";

interface ShareButtonProps {
  item: DiscoveryItem;
}

const SL: Record<string, { copied: string; copyLink: string; download: string }> = {
  de: { copied: "Kopiert!", copyLink: "Link kopieren", download: "Herunterladen" },
  en: { copied: "Copied!", copyLink: "Copy link", download: "Download" },
  fr: { copied: "Copié !", copyLink: "Copier le lien", download: "Télécharger" },
  it: { copied: "Copiato!", copyLink: "Copia link", download: "Scarica" },
};

export default function ShareButton({ item }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const locale = typeof window !== "undefined" ? (document.documentElement.lang || "en") : "en";
  const t = SL[locale] ?? SL.en;
  const url = typeof window !== "undefined" ? window.location.href : "";
  const title = item.style_name ?? "Check this out";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
  };

  const shareWhatsApp = () => {
    const text = `${title} — ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareTikTok = () => {
    window.open(`https://www.tiktok.com/share?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`, "_blank");
  };

  const shareInstagram = () => {
    // Instagram Stories deep link (mobile only)
    window.open(`instagram://story-camera`, "_blank");
  };

  const downloadImage = async () => {
    const imgUrl = item.image_url || item.tiktok_thumbnail_url;
    if (!imgUrl) return;
    try {
      const res = await fetch(imgUrl);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${item.style_name ?? "discovery"}.webp`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch { /* silent */ }
  };

  const isMobile = typeof navigator !== "undefined" && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-full hover:bg-s-ink/5 dark:hover:bg-white/5 text-s-ink/40 dark:text-s-dm-text/40 hover:text-s-ink dark:hover:text-s-dm-text transition-colors"
        aria-label="Share"
      >
        <Share2 size={18} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-s-dm-surface border border-s-ink/10 dark:border-white/10 rounded-card shadow-warm-md py-1 min-w-[180px]">
            <button onClick={copyLink} className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-s-ink dark:text-s-dm-text hover:bg-s-ink/5 dark:hover:bg-white/5">
              {copied ? <Check size={14} className="text-s-success" /> : <Link2 size={14} />}
              {copied ? t.copied : t.copyLink}
            </button>
            <button onClick={shareWhatsApp} className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-s-ink dark:text-s-dm-text hover:bg-s-ink/5 dark:hover:bg-white/5">
              <MessageCircle size={14} className="text-s-success" />
              WhatsApp
            </button>
            <button onClick={shareTikTok} className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-s-ink dark:text-s-dm-text hover:bg-s-ink/5 dark:hover:bg-white/5">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.71a8.19 8.19 0 004.76 1.52V6.78a4.83 4.83 0 01-1-.09z" />
              </svg>
              TikTok
            </button>
            {isMobile && (
              <button onClick={shareInstagram} className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-s-ink dark:text-s-dm-text hover:bg-s-ink/5 dark:hover:bg-white/5">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="5" />
                  <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
                </svg>
                Instagram Story
              </button>
            )}
            {(item.image_url || item.tiktok_thumbnail_url) && (
              <button onClick={downloadImage} className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-s-ink dark:text-s-dm-text hover:bg-s-ink/5 dark:hover:bg-white/5">
                <Download size={14} />
                {t.download}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
