"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Heart } from "lucide-react";

interface LikeButtonProps {
  itemId: string;
  initialLiked?: boolean;
  /** Kept for caller compatibility; not rendered (clean grid). */
  initialCount?: number;
  isAuthenticated?: boolean;
  onAuthRequired?: () => void;
  onAuthPrompt?: () => void;
  /** "overlay" (default) = frosted-glass circle for on-image cards. "bare" = plain heart for light-bg toolbars. */
  variant?: "overlay" | "bare";
  /**
   * Save mode: when provided, the heart calls onSave(itemId) instead of toggling a like, and the PARENT decides
   * what happens. Since collections were ditched (2026-06-23) the parent does a plain save toggle (no board picker).
   * The `/api/discovery/like` path is untouched for callers that don't pass onSave (e.g. the detail-page action bar).
   */
  onSave?: (itemId: string) => void;
  /** Save mode only: controlled "is this look saved" fill — owned by the page (optimistic, reconciled to the server). */
  saved?: boolean;
}

// V3-D380 (2026-05-30): canonical heart (matches HeartButton): #FF3366 fill saved, ink stroke unsaved.
// V3-D390 (2026-05-30): added "bare" variant — a plain heart with no frosted puck, for the detail-page action bar
// (a white toolbar, where the frosted circle reads as an invisible disc). Discovery-like API unchanged.
export default function LikeButton({
  itemId,
  initialLiked = false,
  isAuthenticated = false,
  onAuthRequired,
  onAuthPrompt,
  variant = "overlay",
  onSave,
  saved = false,
}: LikeButtonProps) {
  const tCommon = useTranslations("common");
  const [liked, setLiked] = useState(initialLiked);
  const [popKey, setPopKey] = useState(0);
  const [, startTransition] = useTransition();
  const authCallback = onAuthRequired ?? onAuthPrompt;
  // Save mode is opt-in per-caller: the feed passes onSave, so its hearts open the picker; everyone else likes.
  const saveMode = !!onSave;
  const filled = saveMode ? saved : liked;

  const handleClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      authCallback?.();
      return;
    }
    // Save mode: hand the itemId to the page, which opens the lookbook picker for it. No optimistic fill here —
    // the heart fills only once the page reports a real save (via the `saved` prop), so we never claim a save
    // the user didn't complete (they can still cancel the sheet).
    if (saveMode) {
      onSave!(itemId);
      return;
    }
    const wasLiked = liked;
    setLiked(!wasLiked);
    if (!wasLiked) setPopKey((k) => k + 1);

    startTransition(async () => {
      try {
        const res = await fetch("/api/discovery/like", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item_id: itemId }),
        });
        if (!res.ok) setLiked(wasLiked);
      } catch (err) {
        console.error("[LikeButton] like toggle failed:", err);
        setLiked(wasLiked);
      }
    });
  };

  const heart = (size: number, strokeWidth: number) => (
    <Heart
      // Re-mount on the meaningful transition so the pop animation runs once: in save mode that's saved→true,
      // in like mode it's each fresh like (popKey).
      key={saveMode ? String(saved) : popKey}
      size={size}
      strokeWidth={strokeWidth}
      fill={filled ? "#FF3366" : "none"}
      stroke={filled ? "none" : "var(--color-heading)"}
      className={(saveMode ? saved : liked && popKey > 0) ? "animate-heart-pop" : undefined}
      aria-hidden
    />
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={filled ? tCommon("saved") : tCommon("save")}
      aria-pressed={filled}
      className="group grid h-11 w-11 place-items-center bg-transparent p-0 focus-visible:rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-s-ink"
    >
      {variant === "bare" ? (
        <span className="grid place-items-center transition-transform duration-200 ease-glide group-hover:scale-110 group-active:scale-[0.94] group-active:duration-[80ms]">
          {heart(22, 2)}
        </span>
      ) : (
        <span
          aria-hidden
          style={{
            background: "rgba(255, 255, 255, 0.80)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            border: "1px solid rgba(255, 255, 255, 0.6)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.4)",
          }}
          className="grid h-7 w-7 place-items-center rounded-full transition-transform duration-200 ease-glide group-hover:scale-110 group-active:scale-[0.97] group-active:duration-[80ms]"
        >
          {heart(16, 2.25)}
        </span>
      )}
    </button>
  );
}
