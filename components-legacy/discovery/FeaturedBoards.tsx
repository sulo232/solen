"use client";

// V3-D346 (2026-05-29) Move 1 — collections row on the discovery feed.
// Renders is_active discovery_boards as Pinterest-style board-cover tiles (B&W skin).
// Tapping a board applies its category + keyword (style_name) as the feed search.
// Returns null when no boards exist, so the row simply disappears on an empty library.

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { Images } from "lucide-react";
import type { DiscoveryBoard, DiscoveryFilters, DiscoveryCategory } from "@/lib/types";

const LABEL: Record<string, string> = {
  de: "Kollektionen", en: "Collections", fr: "Collections", it: "Collezioni",
};

// V3-D379 (2026-05-30): robust board-cover collage. The old version rendered a fixed 2×2 grid and hid a dead/missing
// thumbnail with visibility:hidden — which left the grid cell reserved, showing a grey hole (the "Textured Crops" bug).
// This tracks which covers actually load and recomputes the layout from the live ones (3 → 1-big+2-stacked collage,
// 2 → split, 1 → full-bleed, 0 → board initial), so the tile always reads as an intentional collage.
function BoardTile({
  label, covers, onSelect,
}: {
  label: string;
  covers: string[];
  onSelect: () => void;
}) {
  const [failed, setFailed] = useState<number[]>([]);
  const live = covers.map((url, i) => ({ url, i })).filter((c) => !failed.includes(c.i));
  const markFailed = (i: number) => setFailed((p) => (p.includes(i) ? p : [...p, i]));
  const n = live.length;

  return (
    <button
      onClick={onSelect}
      aria-label={label}
      className="shrink-0 w-32 text-left active:scale-[0.98] transition-transform duration-150"
    >
      <div
        className={[
          "w-32 h-32 rounded-2xl overflow-hidden bg-s-bg-sunken border border-s-border shadow-elevation-1 grid gap-0.5",
          n >= 3 ? "grid-cols-2 grid-rows-2" : n === 2 ? "grid-cols-2 grid-rows-1" : "grid-cols-1 grid-rows-1",
        ].join(" ")}
      >
        {n === 0 ? (
          // V3-D380: neutral icon fallback (was a letter-initial — user dislikes letters-in-circles/tiles).
          <div className="flex items-center justify-center">
            <Images size={20} className="text-s-ink-3" strokeWidth={1.75} />
          </div>
        ) : (
          live.map((c, idx) => (
            <img
              key={c.i}
              src={c.url}
              alt=""
              loading="lazy"
              onError={() => markFailed(c.i)}
              className={`w-full h-full object-cover ${n >= 3 && idx === 0 ? "row-span-2" : ""}`}
            />
          ))
        )}
      </div>
      {/* V3-D380: board name only — the "X Looks" count was removed (doesn't scale, user flag). */}
      <p className="text-[12px] font-medium text-s-ink mt-2 truncate">{label}</p>
    </button>
  );
}

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

  return (
    <section className="mb-6">
      {/* V3-D381 (2026-05-30): section label de-eyebrowed — sentence-case ink header (was uppercase+tracked
          11px eyebrow, the "weird font" the user flagged; treatment, not typeface — it's Geist either way). */}
      <p className="text-[13px] font-semibold text-s-ink tracking-[-0.01em] mb-3">
        {LABEL[locale] ?? LABEL.en}
      </p>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
        {boards.map((b) => (
          <BoardTile
            key={b.id}
            label={localName(b)}
            covers={(b.cover_images ?? []).slice(0, 3)}
            onSelect={() => onBoardSelect?.({
              category: (b.category as DiscoveryCategory) || undefined,
              search: b.style_name || undefined,
            })}
          />
        ))}
      </div>
    </section>
  );
}
