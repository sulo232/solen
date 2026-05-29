"use client";

// V3-D346 (2026-05-29) Move 1 — collections row on the discovery feed.
// Renders is_active discovery_boards as Pinterest-style board-cover tiles (B&W skin).
// Tapping a board applies its category + keyword (style_name) as the feed search.
// Returns null when no boards exist, so the row simply disappears on an empty library.

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import type { DiscoveryBoard, DiscoveryFilters, DiscoveryCategory } from "@/lib/types";

const LABEL: Record<string, string> = {
  de: "Kollektionen", en: "Collections", fr: "Collections", it: "Collezioni",
};

export default function FeaturedBoards({ onBoardSelect }: { onBoardSelect?: (filters: Partial<DiscoveryFilters>) => void }) {
  const locale = useLocale();
  const [boards, setBoards] = useState<DiscoveryBoard[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/discovery/boards")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled) { setBoards(d?.boards ?? []); setLoaded(true); } })
      .catch((err) => {
        console.error("[FeaturedBoards] failed to load boards:", err);
        if (!cancelled) setLoaded(true);
      });
    return () => { cancelled = true; };
  }, []);

  if (loaded && boards.length === 0) return null;
  if (!loaded) return null;

  const localName = (b: DiscoveryBoard) =>
    (locale === "de" ? b.name_de : locale === "en" ? b.name_en : locale === "fr" ? b.name_fr : b.name_it) || b.name;
  const looks = (n: number) => (locale === "it" ? `${n} look` : `${n} Looks`);

  return (
    <section className="mb-6">
      <p className="text-[11px] font-heading uppercase tracking-[.08em] text-s-ink-3 mb-3">
        {LABEL[locale] ?? LABEL.en}
      </p>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
        {boards.map((b) => {
          const covers = (b.cover_images ?? []).slice(0, 3);
          return (
            <button
              key={b.id}
              onClick={() => onBoardSelect?.({
                category: (b.category as DiscoveryCategory) || undefined,
                search: b.style_name || undefined,
              })}
              aria-label={localName(b)}
              className="shrink-0 w-32 text-left active:scale-[0.98] transition-transform duration-150"
            >
              {/* Covers via same-origin thumb proxy; onError hides a dead thumbnail so the grey cell shows (graceful — discovery thumbnails can expire). */}
              <div className="w-32 h-32 rounded-2xl overflow-hidden grid grid-cols-2 grid-rows-2 gap-0.5 bg-s-bg-sunken border border-s-border shadow-elevation-1">
                {covers[0] && <img src={covers[0]} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} className="row-span-2 w-full h-full object-cover" />}
                {covers[1] && <img src={covers[1]} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} className="w-full h-full object-cover" />}
                {covers[2] && <img src={covers[2]} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} className="w-full h-full object-cover" />}
              </div>
              <p className="text-[13px] font-heading font-semibold text-s-ink mt-2 truncate">{localName(b)}</p>
              <p className="text-[11px] text-s-ink-3 mt-0.5">{looks(b.pin_count)}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
