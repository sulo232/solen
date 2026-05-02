"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import BarberLeaderboard from "@/components/dashboard/barber/BarberLeaderboard";
import SmartReminderConfig from "@/components/dashboard/barber/SmartReminderConfig";

export default function BarberClientsPage() {
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
      .catch((err) => console.error("[DashboardBarberClients] failed to fetch profile:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout salonName={salonName} salonCategories={salonCategories}>
      <div className="mb-8">
        <p className="text-[9px] font-heading font-bold uppercase tracking-[.20em] text-s-ink/30 mb-1">Barber</p>
        <h1 className="font-heading font-bold text-[28px] text-s-ink leading-none">
          Barber Kunden
        </h1>
        <p className="text-sm text-s-ink/40 mt-2">
          Kundenverlauf, Leaderboard & automatische Erinnerungen
        </p>
      </div>

      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-64 bg-s-bg-sunken rounded-[12px]" />
          <div className="h-64 bg-s-bg-sunken rounded-[12px]" />
        </div>
      ) : (
        <div className="space-y-6">
          {salonId && <BarberLeaderboard salonId={salonId} />}
          {salonId && <SmartReminderConfig salonId={salonId} />}
        </div>
      )}
    </DashboardLayout>
  );
}
