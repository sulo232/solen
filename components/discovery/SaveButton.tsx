"use client";

import { useState, useTransition, useEffect } from "react";
import { Bookmark } from "lucide-react";

const GUEST_SAVES_KEY = "disc_saves_guest";

function getGuestSaves(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(GUEST_SAVES_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function setGuestSaves(ids: string[]) {
  localStorage.setItem(GUEST_SAVES_KEY, JSON.stringify(ids));
}

interface SaveButtonProps {
  itemId: string;
  initialSaved: boolean;
  isAuthenticated: boolean;
  onAuthPrompt?: () => void;
}

export default function SaveButton(props: Record<string, any>) {
  const { itemId, initialSaved, isAuthenticated, onAuthPrompt } = props;
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();

  // Check guest saves on mount
  useEffect(() => {
    if (!isAuthenticated && !initialSaved) {
      const guest = getGuestSaves();
      if (guest.includes(itemId)) setSaved(true);
    }
  }, [isAuthenticated, initialSaved, itemId]);

  const toggle = () => {
    if (!isAuthenticated) {
      // Guest: store in localStorage
      const guest = getGuestSaves();
      if (saved) {
        setGuestSaves(guest.filter((id) => id !== itemId));
        setSaved(false);
      } else {
        setGuestSaves([...guest, itemId]);
        setSaved(true);
        onAuthPrompt?.();
      }
      return;
    }

    const wasSaved = saved;
    setSaved(!wasSaved);

    startTransition(async () => {
      try {
        const res = await fetch("/api/discovery/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item_id: itemId }),
        });
        if (!res.ok) setSaved(wasSaved);
      } catch {
        setSaved(wasSaved);
      }
    });
  };

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className="flex items-center gap-1 text-xs group"
      aria-label={saved ? "Unsave" : "Save"}
    >
      <Bookmark
        size={18}
        className={[
          "transition-all duration-200",
          saved ? "fill-s-ink dark:fill-s-dm-text text-s-ink dark:text-s-dm-text" : "text-s-ink/30 dark:text-s-dm-text/30 group-hover:text-s-ink/60",
        ].join(" ")}
      />
    </button>
  );
}

/** Call after login to sync guest saves to DB */
export async function syncGuestSaves() {
  const guest = getGuestSaves();
  if (guest.length === 0) return;

  try {
    await fetch("/api/discovery/save/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_ids: guest }),
    });
    localStorage.removeItem(GUEST_SAVES_KEY);
  } catch {
    // Silent fail — will retry on next login
  }
}
