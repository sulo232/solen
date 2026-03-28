"use client";

import { useEffect, useState } from "react";
import { Sparkles, RefreshCw, ImageOff } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

interface ArtEntry {
  id: string;
  image_url: string;
  prompt_summary: string;
  created_at: string;
  is_saved: boolean;
}

interface AiArtGalleryProps {
  salonId: string;
}

export default function AiArtGallery({ salonId }: AiArtGalleryProps) {
  const t = useTranslations("nail_dashboard") as any;
  const [entries, setEntries] = useState<ArtEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/dashboard/nail/ai-history?salon_id=${salonId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.history) setEntries(d.history); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [salonId]);

  const toggleSave = async (id: string, current: boolean) => {
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, is_saved: !current } : e));
    await fetch("/api/dashboard/nail/ai-history", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_saved: !current }),
    }).catch(() => {
      setEntries((prev) => prev.map((e) => e.id === id ? { ...e, is_saved: current } : e));
    });
  };

  if (loading) {
    return (
      <div className="columns-2 md:columns-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="mb-3 rounded-[12px] bg-s-ink/[0.04] dark:bg-s-dm-text/[0.04] animate-pulse"
            style={{ height: `${140 + (i % 3) * 40}px` }} />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-s-ink/[0.05] dark:bg-s-dm-text/[0.05] flex items-center justify-center">
          <ImageOff size={20} className="text-s-ink/30 dark:text-s-dm-text/30" />
        </div>
        <p className="text-sm text-s-ink/40 dark:text-s-dm-text/40">{t("gallery_empty")}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={14} className="text-s-coral" />
        <p className="text-sm font-heading font-bold text-s-ink dark:text-s-dm-text">
          {t("gallery_title")}
        </p>
        <span className="text-[10px] text-s-ink/35 dark:text-s-dm-text/35 ml-1">
          {entries.length} {t("gallery_items")}
        </span>
      </div>

      <div className="columns-2 md:columns-3 gap-3">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="mb-3 rounded-[12px] overflow-hidden border border-s-ink/[0.06] dark:border-white/[0.06] relative group"
          >
            <div className="relative aspect-square">
              <Image
                src={entry.image_url}
                alt={entry.prompt_summary}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
            </div>

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-s-ink/0 group-hover:bg-s-ink/40 transition-opacity duration-150 flex flex-col justify-end p-2 opacity-0 group-hover:opacity-100">
              <p className="text-[9px] text-white leading-snug line-clamp-2 mb-1.5">
                {entry.prompt_summary}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => toggleSave(entry.id, entry.is_saved)}
                  className={`flex-1 py-1 rounded-[6px] text-[9px] font-heading font-bold transition-colors duration-150 ${
                    entry.is_saved
                      ? "bg-s-coral text-white"
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                  aria-label={entry.is_saved ? t("gallery_unsave") : t("gallery_save")}
                >
                  {entry.is_saved ? t("gallery_saved") : t("gallery_save")}
                </button>
              </div>
            </div>

            {entry.is_saved && (
              <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-s-coral flex items-center justify-center">
                <Sparkles size={8} className="text-white" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
