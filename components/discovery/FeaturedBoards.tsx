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
      <h3 className="text-sm font-medium text-s-ink/60 dark:text-s-dm-text/60 mb-2">Featured Collections</h3>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {boards.map((board) => (
          <button
            key={board.id}
            onClick={() => onBoardSelect({
              category: board.category as DiscoveryFilters["category"],
              gender: board.gender as DiscoveryFilters["gender"],
              texture: board.texture as DiscoveryFilters["texture"],
            })}
            className="flex-shrink-0 w-36 rounded-card overflow-hidden bg-white dark:bg-s-dm-surface border border-s-ink/5 dark:border-white/5 hover:shadow-card-hover hover:-translate-y-[5px] transition-all duration-250"
          >
            <div className="grid grid-cols-2 gap-0.5 aspect-square bg-s-ink/5 dark:bg-white/5">
              {board.cover_images.slice(0, 4).map((img, i) => (
                <div key={i} className="relative">
                  <Image src={img} alt="" fill className="object-cover" sizes="72px" />
                </div>
              ))}
            </div>
            <div className="p-2">
              <p className="text-xs font-medium text-s-ink dark:text-s-dm-text truncate">{board.name}</p>
              <p className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40">{board.pin_count} pins</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
