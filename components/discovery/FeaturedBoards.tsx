"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import type { DiscoveryFilters } from "@/lib/types";

interface Board {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  gender: string | null;
  texture: string | null;
  cover_images: string[];
  pin_count: number;
}

interface FeaturedBoardsProps {
  onBoardSelect: (filters: Partial<DiscoveryFilters>) => void;
}

export default function FeaturedBoards({ onBoardSelect }: FeaturedBoardsProps) {
  const [boards, setBoards] = useState<Board[]>([]);

  useEffect(() => {
    fetch("/api/discovery/boards")
      .then((r) => r.json())
      .then((d) => setBoards(d.boards ?? []))
      .catch(() => {});
  }, []);

  if (boards.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="mb-3 flex items-center gap-2">
        <p className="text-[9px] font-heading font-bold uppercase tracking-[.20em] text-s-ink/30 dark:text-s-dm-text/30">
          Kollektionen
        </p>
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {boards.map((board) => (
          <button
            key={board.id}
            onClick={() => onBoardSelect({
              category: board.category as DiscoveryFilters["category"],
              gender: board.gender as DiscoveryFilters["gender"],
              texture: board.texture as DiscoveryFilters["texture"],
            })}
            className="flex-shrink-0 w-40 rounded-[12px] overflow-hidden bg-white dark:bg-s-dm-surface border border-s-ink/[0.06] dark:border-white/[0.05] hover:shadow-warm-lg hover:-translate-y-[6px] active:scale-[0.98] transition-all duration-250"
          >
            <div className="grid grid-cols-2 gap-px aspect-square overflow-hidden"
              style={{ background: "rgba(26,18,9,.05)" }}>
              {board.cover_images.slice(0, 4).map((img, i) => (
                <div key={i} className="relative">
                  <Image src={img} alt="" fill className="object-cover" sizes="80px" />
                </div>
              ))}
            </div>
            <div className="px-3 py-2.5">
              <p className="text-xs font-heading font-semibold text-s-ink dark:text-s-dm-text truncate">{board.name}</p>
              <p className="text-[9px] font-heading uppercase tracking-[.10em] text-s-ink/35 dark:text-s-dm-text/35 mt-0.5">
                {board.pin_count} Pins
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
