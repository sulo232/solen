"use client";

// V3-D414: collections row on the discovery feed, rebuilt as bigger 2-col collage cards (mockup frame 3) that
// OPEN a board-detail page (/inspo/board/[id]) — was small tiles that just applied a feed filter (the "tapping
// does nothing" problem). Renders is_active discovery_boards; returns null on an empty library.

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Images } from "lucide-react";
import type { DiscoveryBoard, DiscoveryFilters } from "@/lib/types";

const LABEL: Record<string, string> = {
  de: "Kollektionen", en: "Collections", fr: "Collections", it: "Collezioni",
};

// Robust board-cover collage: tracks which covers actually load and recomputes the layout from the live ones
// (3 → 1-big + 2-stacked, 2 → split, 1 → full-bleed, 0 → neutral icon) so a dead thumbnail never leaves a grey hole.
function BoardCard({ label, covers, onClick }: { label: string; covers: string[]; onClick: () => void }) {
  const [failed, setFailed] = useState<number[]>([]);
  const live = covers.map((url, i) => ({ url, i })).filter((c) => !failed.includes(c.i));
  const markFailed = (i: number) => setFailed((p) => (p.includes(i) ? p : [...p, i]));
  const n = live.length;

  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="w-[168px] shrink-0 text-left transition-transform duration-150 active:scale-[0.98]"
    >
      <div
        className={[
          "grid h-[118px] w-full gap-0.5 overflow-hidden rounded-2xl border border-s-border bg-s-bg-sunken",
          n >= 3 ? "grid-cols-2 grid-rows-2" : n === 2 ? "grid-cols-2 grid-rows-1" : "grid-cols-1 grid-rows-1",
        ].join(" ")}
      >
        {n === 0 ? (
          <div className="flex items-center justify-center">
            <Images size={22} className="text-s-ink-3" strokeWidth={1.75} />
          </div>
        ) : (
          live.map((c, idx) => (
            <img
              key={c.i}
              src={c.url}
              alt=""
              loading="lazy"
              onError={() => markFailed(c.i)}
              className={`h-full w-full object-cover ${n >= 3 && idx === 0 ? "row-span-2" : ""}`}
            />
          ))
        )}
      </div>
      <p className="mt-2 truncate font-heading text-[14px] font-semibold text-s-ink">{label}</p>
    </button>
  );
}

export default function FeaturedBoards(_props: { onBoardSelect?: (filters: Partial<DiscoveryFilters>) => void }) {
  const locale = useLocale();
  const router = useRouter();
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

  if (!loaded || boards.length === 0) return null;

  const localName = (b: DiscoveryBoard) =>
    (locale === "de" ? b.name_de : locale === "en" ? b.name_en : locale === "fr" ? b.name_fr : b.name_it) || b.name;

  return (
    <section className="mb-6">
      <p className="mb-3 text-[13px] font-semibold tracking-[-0.01em] text-s-ink">{LABEL[locale] ?? LABEL.en}</p>
      {/* V3-D414: horizontal scroll (like the chip row), NOT a 2-col grid that stacks into 2-3 lines on mobile. */}
      <div className="-mx-4 flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-1">
        {boards.map((b) => (
          <BoardCard
            key={b.id}
            label={localName(b)}
            covers={(b.cover_images ?? []).slice(0, 3)}
            onClick={() => router.push(`/${locale}/inspo/board/${b.id}`)}
          />
        ))}
      </div>
    </section>
  );
}
