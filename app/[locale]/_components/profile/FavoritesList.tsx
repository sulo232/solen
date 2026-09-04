"use client";

// Client wrapper for the favorites grid. FLOORS LAW 8 (2026-09-04, owner-approved from
// /en/dev/design-fixes pair C, "yeah, make the proposed"): renders the real homepage
// SalonCard for every saved salon (same photo, real cheapest service and price, standard
// heart) instead of the older components-legacy/SalonCard.tsx bare-avg-price card.
//
// Un-save wiring (2026-09-04, replaces the earlier MutationObserver approach): the real
// SalonCard's heart (HeartButton) already persists its own toggle directly
// (POST /api/favorites/toggle, the same `favorites` table this page reads) whenever it is
// passed a `salonId`, so this list cannot call a second write path (that would double-toggle
// the row). It now learns of an un-save the ordinary way, HeartButton's new `onToggled`
// callback, forwarded through SalonCard, instead of watching the `aria-pressed` DOM
// attribute and scraping a `data-vt-salon` element back to a salon. On a save->false
// callback it drops the card from THIS list's view and shows the same neutral Undo toast as
// before; Undo re-POSTs the same toggle endpoint, which flips the row back to saved.

import * as React from "react";
import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { SalonCard, type SalonCardProps } from "@/app/[locale]/_components/homepage/SalonCard";
import { toast } from "@/app/[locale]/_components/primitives/Toast";

type FavoriteCard = SalonCardProps & { salonId: string };

export default function FavoritesList({
  cards: initial,
  locale,
}: {
  cards: FavoriteCard[];
  locale: string;
}) {
  const t = useTranslations("toasts");
  const tProfile = useTranslations("Profile");
  const [cards, setCards] = React.useState<FavoriteCard[]>(initial);
  const cardsRef = React.useRef(cards);
  cardsRef.current = cards;

  const removeFavorite = React.useCallback(
    (salonId: string) => {
      const idx = cardsRef.current.findIndex((c) => c.salonId === salonId);
      if (idx === -1) return;
      const removed = cardsRef.current[idx];

      // Optimistic drop. The DB write already happened inside the real HeartButton's
      // own click handler, so there is nothing to await here.
      setCards((prev) => prev.filter((c) => c.salonId !== salonId));

      // Neutral toast (not a green check, nothing "succeeded", a salon left the list)
      // with a grey outline heart = "no longer saved", plus Undo.
      // mockup-ok: restores, byte-identical to this file's own toast styling before this edit
      toast.show(t("removedFromFavorites"), {
        icon: Heart,
        iconClassName: "bg-s-bg-sunken text-s-ink-2",
        action: {
          label: t("undo"),
          onClick: () => {
            setCards((prev) => {
              if (prev.some((c) => c.salonId === salonId)) return prev;
              const next = [...prev];
              next.splice(Math.min(idx, next.length), 0, removed);
              return next;
            });
            // Same shared toggle endpoint HeartButton itself calls; the row is
            // currently un-saved (that is why we are here), so calling it again
            // flips it back to saved.
            fetch("/api/favorites/toggle", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ salon_id: salonId }),
            }).catch((err) => console.error("[FavoritesList] undo re-add failed:", err));
          },
        },
      });
    },
    [t],
  );

  // Fires once HeartButton's own toggle settles. Every card here starts saved, so only a
  // settle-to-false is a real un-save; a settle-to-true (e.g. after Undo's re-POST lands
  // async, or a retried failed write) is a no-op here, the optimistic Undo already restored it.
  const handleToggled = React.useCallback(
    (salonId: string) => (isSaved: boolean) => {
      if (!isSaved) removeFavorite(salonId);
    },
    [removeFavorite],
  );

  // Removed the last one this session: keep it simple (the rich discovery empty
  // state renders on a fresh load via the server component).
  if (cards.length === 0) {
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
        {tProfile("salonsCount", { count: cards.length })}
      </p>
      <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((c) => (
          <SalonCard
            key={c.salonId}
            {...c}
            widthClassName="w-full"
            onToggled={handleToggled(c.salonId)}
          />
        ))}
      </section>
    </>
  );
}
