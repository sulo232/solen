"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import SaveToBoardSheet from "./SaveToBoardSheet";

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

export default function SaveButton(props: SaveButtonProps) {
  const { itemId, initialSaved, isAuthenticated, onAuthPrompt } = props;
  const [saved, setSaved] = useState(initialSaved);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Check guest saves on mount
  useEffect(() => {
    if (!isAuthenticated && !initialSaved) {
      const guest = getGuestSaves();
      if (guest.includes(itemId)) setSaved(true);
    }
  }, [isAuthenticated, initialSaved, itemId]);

  const onClick = () => {
    if (!isAuthenticated) {
      // Guest: keep the localStorage save + auth prompt (unchanged).
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
    // V3-D414 (Phase 2): authenticated → open the "Speichern in" board sheet (was a flat toggle).
    setSheetOpen(true);
  };

  return (
    <>
      <button
        onClick={onClick}
        className="group flex items-center gap-1 text-xs"
        aria-label={saved ? "Gespeichert" : "Speichern"}
        aria-pressed={saved}
      >
        <Heart
          size={18} strokeWidth={1.9}
          className={[
            "transition-[fill,color] duration-150",
            saved ? "fill-s-love text-s-love" : "text-s-ink/30 group-hover:text-s-ink-2",
          ].join(" ")}
        />
      </button>
      {isAuthenticated && (
        <SaveToBoardSheet itemId={itemId} open={sheetOpen} onClose={() => setSheetOpen(false)} onSaved={() => setSaved(true)} />
      )}
    </>
  );
}

/** Call after login to sync guest saves to DB */
export async function syncGuestSaves() {
  const guest = getGuestSaves();
  if (guest.length === 0) return;

  try {
    const res = await fetch("/api/discovery/save/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_ids: guest }),
    });
    if (res.ok) localStorage.removeItem(GUEST_SAVES_KEY);
  } catch {
    // Silent fail — will retry on next login
  }
}
