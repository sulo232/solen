"use client";

// V3-D414: collections row on the discovery feed, rebuilt as bigger 2-col collage cards (mockup frame 3) that
// OPEN a board-detail page (/inspo/board/[id]) — was small tiles that just applied a feed filter (the "tapping
// does nothing" problem). Renders is_active discovery_boards; returns null on an empty library.

import { useState, useEffect, type ReactNode } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Images } from "lucide-react";
import type { DiscoveryBoard, DiscoveryFilters } from "@/lib/types";

const LABEL: Record<string, string> = {
  de: "Kollektionen", en: "Collections", fr: "Collections", it: "Collezioni",
};

// F (owner pick 2026-06-23): the collections row MIXES layouts , a different collage grid per card by index, so
// the row never reads as one uniform block (and never the rejected big+2-stacked E). Three distinct templates cycle
// by position: hero+strip / triptych / split. Each still recomputes from the covers that actually LOAD (failed
// thumbnails drop out, never leaving a grey hole), degrading to whatever live count remains.
function BoardCard({ label, covers, variant, onClick }: { label: string; covers: string[]; variant: number; onClick: () => void }) {
  const [failed, setFailed] = useState<number[]>([]);
  const live = covers.map((url, i) => ({ url, i })).filter((c) => !failed.includes(c.i));
  const markFailed = (i: number) => setFailed((p) => (p.includes(i) ? p : [...p, i]));
  const n = live.length;
  const v = variant % 3;

  const Cell = ({ c, cls = "" }: { c: { url: string; i: number }; cls?: string }) => (
    <img src={c.url} alt="" loading="lazy" onError={() => markFailed(c.i)} className={`h-full w-full object-cover ${cls}`} />
  );

  let inner: ReactNode;
  if (n === 0) {
    inner = <div className="flex h-full items-center justify-center"><Images size={22} className="text-s-ink-3" strokeWidth={1.75} /></div>;
  } else if (v === 0) {
    // hero + strip , one big cover over a row of the rest
    inner = (
      <div className="flex h-full flex-col gap-0.5">
        <div className="h-[66px] overflow-hidden"><Cell c={live[0]} /></div>
        {n > 1 && (
          <div className="flex flex-1 gap-0.5">
            {live.slice(1).map((c) => <div key={c.i} className="flex-1 overflow-hidden"><Cell c={c} /></div>)}
          </div>
        )}
      </div>
    );
  } else if (v === 1) {
    // triptych , equal vertical columns
    inner = (
      <div className="grid h-full gap-0.5" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        {live.map((c) => <Cell key={c.i} c={c} />)}
      </div>
    );
  } else {
    // split pair , two side by side (one full-bleed if only a single cover survived)
    inner = n >= 2
      ? <div className="grid h-full grid-cols-2 gap-0.5">{live.slice(0, 2).map((c) => <Cell key={c.i} c={c} />)}</div>
      : <Cell c={live[0]} />;
  }

  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="w-[168px] shrink-0 text-left transition-transform duration-150 active:scale-[0.98]"
    >
      <div className="h-[118px] w-full overflow-hidden rounded-2xl border border-s-border bg-s-bg-sunken">{inner}</div>
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
        {boards.map((b, idx) => (
          <BoardCard
            key={b.id}
            label={localName(b)}
            covers={(b.cover_images ?? []).slice(0, 3)}
            variant={idx}
            onClick={() => router.push(`/${locale}/inspo/board/${b.id}`)}
          />
        ))}
      </div>
    </section>
  );
}
