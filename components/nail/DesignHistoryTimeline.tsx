"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { RefreshCw, Share2, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import type { NailDesignHistory } from "@/lib/types";

interface DesignHistoryTimelineProps {
  customerId: string;
  salonId?: string | null;
  locale?: string;
}

export default function DesignHistoryTimeline({ customerId, salonId, locale = "de" }: DesignHistoryTimelineProps) {
  const t = useTranslations("nail_dashboard");
  const [designs, setDesigns] = useState<NailDesignHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/clients/${customerId}/nail-history?limit=20`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.history) setDesigns(d.history); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [customerId]);

  const handlePublish = async (design: NailDesignHistory) => {
    if (!design.image_url || !salonId) return;
    setPublishingId(design.id);
    try {
      await fetch("/api/nail-discovery/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: design.image_url,
          style: design.style,
          shape: design.shape,
          material: design.material,
        }),
      });
    } finally {
      setPublishingId(null);
    }
  };

  const BADGE_LABELS: Record<string, string> = {
    gel: "Gel", acrylic: "Acryl", dip_powder: "Dip Powder", polygel: "Polygel",
    shellac: "Shellac", french: "French", chrome: "Chrome", "3d_art": "3D Art",
    ombre: "Ombré", marble: "Marble", glitter: "Glitter", minimal: "Minimal",
    round: "Rund", square: "Square", oval: "Oval", almond: "Mandel",
    coffin: "Coffin", stiletto: "Stiletto",
  };

  if (loading) return <div className="py-4 text-center text-sm text-s-ink/40 dark:text-s-dm-text/40">{t("loading")}</div>;
  if (designs.length === 0) return <p className="text-sm text-s-ink/40 dark:text-s-dm-text/40 py-4">{t("timeline_no_designs")}</p>;

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-5 top-0 bottom-0 w-px bg-s-ink/10 dark:bg-s-dm-text/10" />

      <div className="space-y-6">
        {designs.map((d) => (
          <div key={d.id} className="relative pl-12">
            {/* Dot */}
            <div className="absolute left-3.5 top-2 w-3 h-3 rounded-full bg-s-coral border-2 border-white dark:border-s-dm-surface" />

            {/* Card */}
            <div className="rounded-card border border-s-ink/5 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface p-3">
              <div className="flex items-start gap-3">
                {/* Design image */}
                {d.image_url && (
                  <div className="w-20 h-20 rounded-btn overflow-hidden bg-s-bg-sunken dark:bg-s-dm-bg shrink-0">
                    <Image src={d.image_url} alt="" width={80} height={80} className="object-cover w-full h-full" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  {/* Date */}
                  <div className="flex items-center gap-1.5 text-xs text-s-ink/40 dark:text-s-dm-text/40 mb-1">
                    <Clock size={10} />
                    {new Date(d.created_at).toLocaleDateString(locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {[d.style, d.shape, d.material].filter(Boolean).map((b) => (
                      <span key={b} className="text-[10px] px-1.5 py-0.5 rounded-pill bg-s-coral/10 text-s-coral">
                        {BADGE_LABELS[b as string] || b}
                      </span>
                    ))}
                    {d.length && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-pill bg-s-blue/10 text-s-blue">
                        {d.length}
                      </span>
                    )}
                  </div>

                  {/* Color swatch */}
                  {d.color_primary && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-4 h-4 rounded-full border border-s-ink/10" style={{ backgroundColor: d.color_primary }} />
                      {d.color_secondary && (
                        <div className="w-4 h-4 rounded-full border border-s-ink/10" style={{ backgroundColor: d.color_secondary }} />
                      )}
                    </div>
                  )}

                  {d.notes && (
                    <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 line-clamp-2">{d.notes}</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-2 pt-2 border-t border-s-ink/5 dark:border-s-dm-text/10">
                <button className="flex items-center gap-1 text-xs text-s-coral hover:underline">
                  <RefreshCw size={10} />
                  {t("timeline_repeat")}
                </button>
                {d.image_url && salonId && (
                  <button
                    onClick={() => handlePublish(d)}
                    disabled={publishingId === d.id}
                    className="flex items-center gap-1 text-xs text-s-ink/50 dark:text-s-dm-text/50 hover:text-s-coral disabled:opacity-50"
                  >
                    <Share2 size={10} />
                    {publishingId === d.id ? t("timeline_publishing") : t("timeline_publish")}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
