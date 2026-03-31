"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import NailClientTab from "@/components/dashboard/nail/NailClientTab";
import InfillReminderConfig from "@/components/dashboard/nail/InfillReminderConfig";

export default function NailClientsPage() {
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
      .catch((err) => console.error("[DashboardNailClients] Failed to fetch salon profile:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout salonName={salonName} salonCategories={salonCategories}>
      <div className="mb-8">
        <p className="text-[9px] font-heading font-bold uppercase tracking-[.20em] text-s-ink/30 mb-1">Nails</p>
        <h1 className="font-heading font-bold text-[28px] text-s-ink dark:text-s-dm-text leading-none">
          Nagel Kunden
        </h1>
      </div>

      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-96 bg-s-bg-sunken dark:bg-s-dm-raised rounded-[12px]" />
          <div className="h-64 bg-s-bg-sunken dark:bg-s-dm-raised rounded-[12px]" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Full-width CRM tab */}
          <NailClientTab />

          {/* Reminder config below */}
          {salonId && <InfillReminderConfig salonId={salonId} />}
        </div>
      )}
    </DashboardLayout>
  );
}
