"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import LiveQueuePanel from "@/components/dashboard/barber/LiveQueuePanel";

export default function QueueDisplayPage() {
  const locale = useLocale();
  const [salonId, setSalonId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  const today = new Date().toLocaleDateString("de-CH", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => { setSalonId(p?.salon_id); })
      .catch((err) => console.error("[DashboardQueueDisplay] Failed to fetch salon profile:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6 sm:p-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <Link
              href={`/${locale}/dashboard/barber-ops`}
              className="text-xs text-white/30 hover:text-white/60 transition-colors mb-4 inline-block font-heading uppercase tracking-[.08em]"
            >
              ← Dashboard
            </Link>
            <h1 className="font-heading text-[28px] sm:text-[56px] leading-tight text-white">
              Live Queue
            </h1>
            <p className="text-white/35 font-heading uppercase tracking-[.14em] text-sm mt-2">
              {today}
            </p>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-[12px] border border-white/[0.08] bg-white/[0.04]">
            <div className="w-2 h-2 rounded-full bg-[#4CAF6F]" />
            <span className="text-xs font-heading text-white/60 uppercase tracking-[.10em]">
              Live
            </span>
          </div>
        </div>

        {/* Queue Panel */}
        {loading ? (
          <div className="w-full h-64 bg-white/[0.04] rounded-[12px] animate-pulse" />
        ) : salonId ? (
          <div className="w-full">
            <LiveQueuePanel salonId={salonId} />
          </div>
        ) : (
          <div className="text-center py-24">
            <p className="text-white/30 font-heading text-sm uppercase tracking-[.12em]">
              Kein Salon gefunden
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
