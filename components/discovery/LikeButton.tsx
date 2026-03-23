"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";

interface LikeButtonProps {
  itemId: string;
  initialLiked: boolean;
  initialCount: number;
  isAuthenticated: boolean;
  onAuthRequired?: () => void;
}

export default function LikeButton({ itemId, initialLiked, initialCount, isAuthenticated, onAuthRequired }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();
  const [animating, setAnimating] = useState(false);

  const toggle = () => {
    if (!isAuthenticated) {
      onAuthRequired?.();
      return;
    }

    // Optimistic update
    const wasLiked = liked;
    const prevCount = count;
    setLiked(!wasLiked);
    setCount(wasLiked ? prevCount - 1 : prevCount + 1);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);

    startTransition(async () => {
      try {
        const res = await fetch("/api/discovery/like", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item_id: itemId }),
        });
        if (!res.ok) {
          // Revert on failure
          setLiked(wasLiked);
          setCount(prevCount);
        }
      } catch {
        setLiked(wasLiked);
        setCount(prevCount);
      }
    });
  };

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className="flex items-center gap-1 text-xs group"
      aria-label={liked ? "Unlike" : "Like"}
    >
      <Heart
        size={18}
        className={[
          "transition-all duration-200",
          liked ? "fill-s-coral text-s-coral" : "text-s-ink/30 dark:text-s-dm-text/30 group-hover:text-s-coral/60",
          animating ? "scale-125" : "scale-100",
        ].join(" ")}
      />
      {count > 0 && (
        <span className={liked ? "text-s-coral font-medium" : "text-s-ink/40 dark:text-s-dm-text/40"}>
          {count}
        </span>
      )}
    </button>
  );
}
