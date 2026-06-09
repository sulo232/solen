"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";
import BarberLeaderboard from "@/components-legacy/dashboard/barber/BarberLeaderboard";
import SmartReminderConfig from "@/components-legacy/dashboard/barber/SmartReminderConfig";

export default function BarberClientsPage() {
  const t = useTranslations("dashboard.barberClientsPage");
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
        <p className="text-[12px] font-heading uppercase tracking-[.20em] text-s-ink/30 mb-1">{t("eyebrow")}</p>
        <h1 className="text-[26px] font-semibold tracking-[-0.015em] text-s-ink leading-none">
          {t("title")}
        </h1>
        <p className="text-sm text-s-ink/40 mt-2">
          {t("subtitle")}
        </p>
      </div>

      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-64 bg-s-bg-sunken rounded-2xl" />
          <div className="h-64 bg-s-bg-sunken rounded-2xl" />
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
