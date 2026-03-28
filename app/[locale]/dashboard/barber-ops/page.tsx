"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import LiveQueuePanel from "@/components/dashboard/barber/LiveQueuePanel";
import ExpressMenu from "@/components/dashboard/barber/ExpressMenu";
import WalkinAnalytics from "@/components/dashboard/barber/WalkinAnalytics";
import FadeBlueprint from "@/components/dashboard/barber/FadeBlueprint";
import BarberLeaderboard from "@/components/dashboard/barber/BarberLeaderboard";

export default function BarberOpsPage() {
  const [salonId, setSalonId] = useState<string | undefined>();
  const [salonName, setSalonName] = useState<string | undefined>();
  const [salonCategories, setSalonCategories] = useState<string[] | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => {
        setSalonId(p?.salon_id);
        setSalonName(p?.salon_name);
        setSalonCategories(p?.salon_categories);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout salonName={salonName} salonCategories={salonCategories}>
      <div className="mb-8">
        <p className="text-[9px] font-heading font-bold uppercase tracking-[.20em] text-s-ink/30 mb-1">Barber</p>
        <h1 className="font-heading font-bold text-[28px] text-s-ink dark:text-s-dm-text leading-none">
          Barber Betrieb
        </h1>
      </div>

      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="h-64 bg-s-bg-sunken dark:bg-s-dm-raised rounded-[12px]" />
            <div className="h-64 bg-s-bg-sunken dark:bg-s-dm-raised rounded-[12px]" />
          </div>
          <div className="h-80 bg-s-bg-sunken dark:bg-s-dm-raised rounded-[12px]" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="h-96 bg-s-bg-sunken dark:bg-s-dm-raised rounded-[12px]" />
            <div className="h-96 bg-s-bg-sunken dark:bg-s-dm-raised rounded-[12px]" />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            {salonId && <LiveQueuePanel salonId={salonId} />}
            {salonId && <ExpressMenu salonId={salonId} />}
          </div>
          {salonId && <WalkinAnalytics salonId={salonId} />}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            {salonId && <FadeBlueprint salonId={salonId} />}
            {salonId && <BarberLeaderboard salonId={salonId} />}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
