"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";
import NailClientTab from "@/components-legacy/dashboard/nail/NailClientTab";
import InfillReminderConfig from "@/components-legacy/dashboard/nail/InfillReminderConfig";

export default function NailClientsPage() {
  const t = useTranslations("dashboard.nailClientsPage");
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
        <p className="text-[12px] font-heading uppercase tracking-[.20em] text-s-ink/30 mb-1">{t("eyebrow")}</p>
        <h1 className="text-[26px] font-semibold tracking-[-0.015em] text-s-ink leading-none">
          {t("title")}
        </h1>
      </div>

      {loading ? (
        // mockup-ok: WCAG 2.2.2 conformance, page-load skeleton bounded (tailwind.config.js pulse-bounded)
        <div className="space-y-6 animate-pulse-bounded">
          <div className="h-96 bg-s-bg-sunken rounded-2xl" />
          <div className="h-64 bg-s-bg-sunken rounded-2xl" />
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
