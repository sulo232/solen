"use client";

// Walk-in tip deep-link (QR / shared link target), keyed by the queue tracking TOKEN. Opens the
// shared <TipSheet> over a plain backdrop. In-app, the same sheet opens from the queue done-state
// button without navigating; this page is the standalone entry. /api/walkin/tip returns the
// clientSecret (100% to the salon's Connect account, no platform fee).

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import Spinner from "@/components-legacy/ui/Spinner";
import TipSheet from "@/app/[locale]/_components/tips/TipSheet";

export default function WalkinTipPage() {
  const params = useParams<{ token: string }>()!;
  const router = useRouter();
  const locale = useLocale();
  const token = params?.token as string;
  const demo = useSearchParams()?.get("demo") === "1"; // preview the full sheet without a live intent
  const [info, setInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/walkin/queue/status?token=${encodeURIComponent(token)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setInfo(d))
      .catch((err) => console.error("[WalkinTip] failed to load queue entry:", err))
      .finally(() => setLoading(false));
  }, [token]);

  const close = () => {
    setOpen(false);
    setTimeout(() => router.push(`/${locale}`), 250);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-s-bg-sunken">
        <Spinner size="md" />
      </div>
    );
  }

  // 7-day tip window (mockup 17): an old completed visit gets the specific expired state,
  // mirroring the 410 guard in /api/walkin/tip.
  const completedAt = info?.completedAt ? new Date(info.completedAt).getTime() : null;
  const expired = !demo && completedAt !== null && Date.now() - completedAt > 7 * 24 * 60 * 60 * 1000;
  if (expired) {
    const x =
      ({
        de: { title: "Dieser Trinkgeld-Link ist abgelaufen.", body: "Trinkgeld bleibt 7 Tage nach deinem Besuch möglich. Beim nächsten Mal findest du es auf deinem Warteschlangen-Screen.", cta: "Zur Startseite" },
        en: { title: "This tip link has expired.", body: "Tips stay open for 7 days after your visit. Next time it's on your queue screen.", cta: "Back to home" },
        fr: { title: "Ce lien de pourboire a expiré.", body: "Le pourboire reste possible 7 jours après ta visite. La prochaine fois, tu le trouveras sur ton écran de file d'attente.", cta: "Retour à l'accueil" },
        it: { title: "Questo link per la mancia è scaduto.", body: "La mancia resta possibile per 7 giorni dopo la tua visita. La prossima volta la trovi sulla schermata della coda.", cta: "Torna alla home" },
      } as const)[locale as "de" | "en" | "fr" | "it"] ?? {
        title: "Dieser Trinkgeld-Link ist abgelaufen.",
        body: "Trinkgeld bleibt 7 Tage nach deinem Besuch möglich.",
        cta: "Zur Startseite",
      };
    return (
      <div className="flex min-h-screen items-center justify-center bg-s-bg-sunken px-5">
        <div className="w-full max-w-sm rounded-card bg-white p-8 text-center shadow-elevation-1">
          <h1 className="font-heading text-[18px] font-semibold text-s-ink">{x.title}</h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-s-ink-2">{x.body}</p>
          <button
            onClick={() => router.push(`/${locale}`)}
            className="mt-6 w-full rounded-btn border border-s-border bg-white py-3 font-heading text-[14px] font-semibold text-s-ink transition-colors hover:border-s-ink"
          >
            {x.cta}
          </button>
        </div>
      </div>
    );
  }

  const fallback =
    ({ de: "dein Coiffeur", en: "your stylist", fr: "votre coiffeur", it: "il tuo parrucchiere" } as Record<string, string>)[
      locale
    ] ?? "dein Coiffeur";
  const recipientName = demo ? "Marco Bianchi" : (info?.recipientName ?? fallback);
  const contextLine = demo
    ? "Herrenschnitt Barber Brothers"
    : [info?.serviceName, info?.salonName].filter(Boolean).join(" ") || undefined;
  const recipientRating = demo ? 4.9 : info?.recipientRating;
  const recipientReviewCount = demo ? 62 : info?.recipientReviewCount;

  return (
    <div className="min-h-screen bg-s-bg-sunken">
      <TipSheet
        open={open}
        onClose={close}
        recipientName={recipientName}
        recipientPhoto={info?.recipientPhoto ?? null}
        recipientRating={recipientRating}
        recipientReviewCount={recipientReviewCount}
        contextLine={contextLine}
        locale={locale}
        demo={demo}
        createIntent={(amount) =>
          fetch("/api/walkin/tip", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, amount }),
          }).then((r) => r.json())
        }
      />
    </div>
  );
}
