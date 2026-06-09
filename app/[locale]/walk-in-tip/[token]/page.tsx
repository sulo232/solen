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
