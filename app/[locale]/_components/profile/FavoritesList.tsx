"use client";

// Client wrapper for the favorites grid. SalonCard only renders its heart when an
// `onFavoriteToggle` handler is passed, and the (server) favorites page never passed
// one — so you could add favorites everywhere but never REMOVE one from your list
// (owner 2026-06-13). This wires the heart: tapping it optimistically drops the card,
// DELETEs the favorite, and shows a neutral toast with Undo (re-adds in place).

import * as React from "react";
import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import SalonCard from "@/components-legacy/SalonCard";
import { toast } from "@/app/[locale]/_components/primitives/Toast";

interface FavoriteSalon {
  id: string;
  [key: string]: unknown;
}

export default function FavoritesList({
  salons: initial,
  locale,
}: {
  salons: FavoriteSalon[];
  locale: string;
}) {
  const t = useTranslations("toasts");
  const [salons, setSalons] = React.useState<FavoriteSalon[]>(initial);

  const removeFavorite = React.useCallback(
    async (salonId: string) => {
      // Snapshot position so a failure (or Undo) can re-insert the card in place.
      const idx = salons.findIndex((s) => s.id === salonId);
      if (idx === -1) return;
      const removed = salons[idx];

      const reinsert = () =>
        setSalons((prev) => {
          if (prev.some((s) => s.id === salonId)) return prev;
          const next = [...prev];
          next.splice(Math.min(idx, next.length), 0, removed);
          return next;
        });

      // Optimistic drop.
      setSalons((prev) => prev.filter((s) => s.id !== salonId));

      try {
        const res = await fetch(`/api/profile/favorites?salon_id=${salonId}`, { method: "DELETE" });
        if (!res.ok) throw new Error(String(res.status));
        // Neutral toast (not a green check — nothing "succeeded", a salon left the list)
        // with a grey outline heart = "no longer saved", plus Undo.
        toast.show(t("removedFromFavorites"), {
          icon: Heart,
          iconClassName: "bg-s-bg-sunken text-s-ink-2",
          action: {
            label: t("undo"),
            onClick: () => {
              reinsert();
              fetch("/api/profile/favorites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ salon_id: salonId }),
              }).catch((err) => console.error("[FavoritesList] undo re-add failed:", err));
            },
          },
        });
      } catch (err) {
        console.error("[FavoritesList] remove favorite failed:", err);
        reinsert(); // revert the optimistic drop
        toast.error(t("removeFailed"), {
          action: { label: t("retry"), onClick: () => removeFavorite(salonId) },
        });
      }
    },
    [salons, t],
  );

  // Removed the last one this session — keep it simple (the rich discovery empty
  // state renders on a fresh load via the server component).
  if (salons.length === 0) {
    return (
      <div className="mt-10 text-center">
        <p className="font-body text-[15px] text-s-ink-2">{t("removedFromFavorites")}.</p>
        <a
          href={`/${locale}/inspo`}
          className="mt-2 inline-block font-body text-[14px] font-medium text-s-accent"
        >
          {t("view")}
        </a>
      </div>
    );
  }

  return (
    <>
      <p className="font-body text-[13px] text-s-ink-2">
        {salons.length} {salons.length === 1 ? "Salon" : "Salons"}
      </p>
      <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {salons.map((s) => (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <SalonCard key={s.id} salon={s as any} locale={locale} isFavorited onFavoriteToggle={removeFavorite} />
        ))}
      </section>
    </>
  );
}
