"use client";

import { useEffect, useState } from "react";
import { DoorOpen, ShieldCheck, BookHeart, ClipboardCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";
import RoomManager from "@/components-legacy/dashboard/spa/RoomManager";
import SpaIntake from "@/components-legacy/dashboard/spa/SpaIntake";
import WellnessJournal from "@/components-legacy/dashboard/spa/WellnessJournal";
import ContraindicationAlert from "@/components-legacy/dashboard/spa/ContraindicationAlert";
import TreatmentOutcome from "@/components-legacy/dashboard/spa/TreatmentOutcome";
import ClientSelectorDropdown from "@/components-legacy/shared/ClientSelectorDropdown";

type Tab = "rooms" | "intake" | "journal" | "outcome";

const TABS: { id: Tab; labelKey: string; icon: React.ElementType }[] = [
  { id: "rooms", labelKey: "tabRooms", icon: DoorOpen },
  { id: "intake", labelKey: "tabIntake", icon: ShieldCheck },
  { id: "journal", labelKey: "tabJournal", icon: BookHeart },
  { id: "outcome", labelKey: "tabOutcome", icon: ClipboardCheck },
];

export default function SpaAdminPage() {
  const t = useTranslations("dashboardSpa") as any;
  const [salonId, setSalonId] = useState<string | undefined>();
  const [salonName, setSalonName] = useState<string | undefined>();
  const [salonCategories, setSalonCategories] = useState<string[] | undefined>();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("rooms");
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => {
        setSalonId(p?.salon_id);
        setSalonName(p?.salon_name);
        setSalonCategories(p?.salon_categories);
      })
      .catch((err) => console.error("[DashboardSpaAdmin] Failed to fetch salon profile:", err))
      .finally(() => setLoading(false));
  }, []);

  const needsClient = activeTab !== "rooms";

  return (
    <DashboardLayout salonName={salonName} salonCategories={salonCategories}>
      <div className="mb-6">
        <p className="text-[9px] font-heading uppercase tracking-[.20em] text-s-ink/50 mb-1">Spa</p>
        <h1 className="font-heading text-[28px] text-s-ink leading-none">
          {t("pageTitle")}
        </h1>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-5 scrollbar-hide">
        {TABS.map(({ id, labelKey, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            aria-label={t(labelKey)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-pill text-xs font-heading whitespace-nowrap transition-colors duration-150 shrink-0 ${
              activeTab === id
                ? "bg-s-coral text-white shadow-elevation-2"
                : "bg-s-ink/[0.05] text-s-ink/55 hover:bg-s-ink/[0.09]"
            }`}
          >
            <Icon size={12} />
            {t(labelKey)}
          </button>
        ))}
      </div>

      {/* Client selector for non-room tabs */}
      {needsClient && (
        <div className="bg-white rounded-[12px] border border-s-ink/[0.06] p-4 mb-4">
          <p className="text-[9px] font-heading uppercase tracking-[.15em] text-s-ink/45 mb-2">
            {t("selectClient")}
          </p>
          <ClientSelectorDropdown
            salonId={salonId}
            value={clientId}
            onChange={setClientId}
            placeholder={t("clientPlaceholder")}
          />
        </div>
      )}

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-s-ink/[0.04] rounded-[12px]" />
        </div>
      ) : !salonId ? null : (
        <div className="space-y-4">
          {activeTab === "rooms" && <RoomManager salonId={salonId} />}

          {activeTab === "intake" && (
            clientId ? (
              <>
                <ContraindicationAlert intakeData={null} />
                <SpaIntake customerId={clientId} />
              </>
            ) : (
              <EmptyClientPrompt label={t("selectClientFirst")} />
            )
          )}

          {activeTab === "journal" && (
            clientId
              ? <WellnessJournal salonId={salonId} clientId={clientId} />
              : <EmptyClientPrompt label={t("selectClientFirst")} />
          )}

          {activeTab === "outcome" && (
            clientId
              ? <TreatmentOutcome salonId={salonId} clientId={clientId} />
              : <EmptyClientPrompt label={t("selectClientFirst")} />
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

function EmptyClientPrompt({ label }: { label: string }) {
  return (
    <div className="rounded-[12px] border border-s-ink/[0.06] border-dashed p-12 text-center bg-white">
      <p className="text-xs font-heading text-s-ink/50 uppercase tracking-[.10em]">{label}</p>
    </div>
  );
}
