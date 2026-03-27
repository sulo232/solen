"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import BarberLeaderboard from "@/components/dashboard/barber/BarberLeaderboard";
import ChairManager from "@/components/dashboard/barber/ChairManager";
import SmartReminderConfig from "@/components/dashboard/barber/SmartReminderConfig";
import WalkinAnalytics from "@/components/dashboard/barber/WalkinAnalytics";
import WalkinQueue from "@/components/barber/WalkinQueue";
import LiveQueuePanel from "@/components/dashboard/barber/LiveQueuePanel";
import ExpressMenu from "@/components/dashboard/barber/ExpressMenu";
import Spinner from "@/components/ui/Spinner";
import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";

export default function BarberOpsPage() {
  const t = useTranslations("dashboardBarber");
  const [salonId, setSalonId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSalon = async () => {
      try {
        const res = await fetch("/api/dashboard/clients?category=barbershop");
        if (res.ok) {
          const data = await res.json();
          setSalonId(data.salon_id ?? "");
        }
      } catch {
        // Error
      }
      setLoading(false);
    };
    fetchSalon();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12"><Spinner /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-xl font-bold text-s-ink dark:text-s-dm-text">
            {t("ops_title")}
          </h1>
          <a
            href="/dashboard/queue-display"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-heading font-semibold text-s-coral hover:brightness-[1.06] transition-all"
            aria-label={t("tv_display")}
          >
            <ExternalLink size={14} />
            {t("tv_display")}
          </a>
        </div>

        {/* NEW: Live queue + Express menu at top (most urgent) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <LiveQueuePanel salonId={salonId} />
          <ExpressMenu salonId={salonId} />
        </div>

        {/* Existing components below */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChairManager salonId={salonId} />
          <WalkinAnalytics salonId={salonId} />
        </div>

        <WalkinQueue salonId={salonId} />
        <SmartReminderConfig salonId={salonId} />
        <BarberLeaderboard salonId={salonId} />
      </div>
    </DashboardLayout>
  );
}
