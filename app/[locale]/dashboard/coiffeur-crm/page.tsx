"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import FormulaBook from "@/components/dashboard/coiffeur/FormulaBook";
import ConsultationNotes from "@/components/dashboard/coiffeur/ConsultationNotes";
import ColourCycleConfig from "@/components/dashboard/coiffeur/ColourCycleConfig";

export default function CoiffeurCRMPage() {
  const [salonId, setSalonId] = useState<string | undefined>();
  const [salonName, setSalonName] = useState<string | undefined>();
  const [salonCategories, setSalonCategories] = useState<string[] | undefined>();
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState<string | null>(null);

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
        <p className="text-[9px] font-heading font-bold uppercase tracking-[.20em] text-s-ink/30 mb-1">Coiffeur</p>
        <h1 className="font-heading font-bold text-[28px] text-s-ink dark:text-s-dm-text leading-none">
          Coiffeur CRM
        </h1>
      </div>

      {/* Optional client selector */}
      <div className="mb-6 bg-white dark:bg-s-dm-surface rounded-[12px] border border-s-ink/[0.06] p-4">
        <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/35 mb-2">
          Aktiver Kunde (optional — für Formeln und Notizen filtern)
        </p>
        <input
          value={clientId ?? ""}
          onChange={(e) => setClientId(e.target.value || null)}
          placeholder="Kunden-ID eingeben..."
          className="w-full max-w-sm px-3 py-2 rounded-btn border border-s-ink/[0.10] dark:border-white/10 bg-transparent text-xs text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral transition-colors"
        />
      </div>

      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="h-96 bg-s-bg-sunken dark:bg-s-dm-raised rounded-[12px]" />
            <div className="h-96 bg-s-bg-sunken dark:bg-s-dm-raised rounded-[12px]" />
          </div>
          <div className="h-64 bg-s-bg-sunken dark:bg-s-dm-raised rounded-[12px]" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Formula Book + Consultation Notes side by side on large */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {salonId && <FormulaBook clientId={clientId} salonId={salonId} />}
            {salonId && <ConsultationNotes clientId={clientId} salonId={salonId} />}
          </div>

          {/* Colour Cycle Config full width */}
          {salonId && <ColourCycleConfig salonId={salonId} />}
        </div>
      )}
    </DashboardLayout>
  );
}
