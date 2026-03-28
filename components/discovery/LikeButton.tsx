"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  itemId: string;
  initialLiked?: boolean;
  initialCount?: number;
  isAuthenticated?: boolean;
  onAuthRequired?: () => void;
  onAuthPrompt?: () => void;
}

export default function LikeButton({
  itemId,
  initialLiked = false,
  initialCount = 0,
  isAuthenticated = false,
  onAuthRequired,
  onAuthPrompt,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();
  const [animating, setAnimating] = useState(false);

  const authCallback = onAuthRequired ?? onAuthPrompt;

  const toggle = () => {
    if (!isAuthenticated) {
      authCallback?.();
      return;
    }

    // Optimistic update — instant visual feedback
    const wasLiked = liked;
    setLiked(!wasLiked);
    setCount((c) => (wasLiked ? Math.max(0, c - 1) : c + 1));

    // Trigger heart pop animation
    if (!wasLiked) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 400);
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/discovery/like", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item_id: itemId }),
        });
        if (!res.ok) {
          setLiked(wasLiked);
          setCount((c) => (wasLiked ? c + 1 : Math.max(0, c - 1)));
        }
      } catch {
        setLiked(wasLiked);
        setCount((c) => (wasLiked ? c + 1 : Math.max(0, c - 1)));
      }
    });
  };

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className="flex items-center gap-1.5 group"
      aria-label={liked ? "Unlike" : "Like"}
      aria-pressed={liked}
    >
      <Heart
        size={18}
        className={cn(
          "transition-[transform,color] duration-150",
          liked
            ? "fill-red-500 text-red-500"
            : "text-s-ink/30 dark:text-s-dm-text/30 group-hover:text-red-400",
          animating && "scale-125"
        )}
      />
      {count > 0 && (
        <span
          className={cn(
            "text-xs font-body tabular-nums transition-colors",
            liked
              ? "text-red-500"
              : "text-s-ink/40 dark:text-s-dm-text/40"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
