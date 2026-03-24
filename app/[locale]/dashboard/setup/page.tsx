"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Store } from "lucide-react";
import SetupWizard from "@/components/onboarding/SetupWizard";
import SalonProfileStep from "@/components/onboarding/steps/SalonProfileStep";
import OpeningHoursStep from "@/components/onboarding/steps/OpeningHoursStep";
import ServicesStep from "@/components/onboarding/steps/ServicesStep";
import TeamStep from "@/components/onboarding/steps/TeamStep";
import ScheduleStep from "@/components/onboarding/steps/ScheduleStep";
import PaymentsStep from "@/components/onboarding/steps/PaymentsStep";
import GoLiveStep from "@/components/onboarding/steps/GoLiveStep";
import Spinner from "@/components/ui/Spinner";

interface Step {
  key: string;
  label: string;
  label_en: string;
  complete: boolean;
}

export default function SetupPage() {
  const locale = useLocale();
  const router = useRouter();
  const [steps, setSteps] = useState<Step[]>([]);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/salon/setup-progress")
      .then((r) => r.json())
      .then((d) => {
        setSteps(d.steps ?? []);
        setSalonId(d.salon_id ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleComplete = () => {
    router.push(`/${locale}/dashboard`);
  };

  const refreshProgress = () => {
    fetch("/api/salon/setup-progress")
      .then((r) => r.json())
      .then((d) => setSteps(d.steps ?? []));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-s-bg-surface">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!salonId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-s-bg-surface dark:bg-s-dm-bg px-4">
        <div className="text-center max-w-sm">
          <div className="flex justify-center mb-4">
            <Store size={48} className="text-s-ink/20 dark:text-s-dm-text/20" />
          </div>
          <h1 className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text mb-2">
            {locale === "de" ? "Kein Salon gefunden" : "No salon found"}
          </h1>
          <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 mb-6">
            {locale === "de"
              ? "Du musst zuerst einen Salon erstellen, um das Setup zu starten."
              : "You need to create a salon first to start the setup."}
          </p>
          <button
            onClick={() => router.push(`/${locale}/dashboard`)}
            className="px-6 py-2.5 rounded-btn bg-s-coral text-white text-sm font-medium"
          >
            {locale === "de" ? "Zum Dashboard" : "Go to Dashboard"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <SetupWizard
      salonId={salonId}
      initialSteps={steps}
      locale={locale}
      onComplete={handleComplete}
    >
      {/* Step 1: Salon Profile */}
      <SalonProfileStep salonId={salonId} onSaved={refreshProgress} />
      {/* Step 2: Opening Hours */}
      <OpeningHoursStep salonId={salonId} onSaved={refreshProgress} />
      {/* Step 3: Services */}
      <ServicesStep onSaved={refreshProgress} />
      {/* Step 4: Team */}
      <TeamStep onSaved={refreshProgress} />
      {/* Step 5: Schedule */}
      <ScheduleStep onSaved={refreshProgress} />
      {/* Step 6: Payments */}
      <PaymentsStep salonId={salonId} onSaved={refreshProgress} />
      {/* Step 7: Go Live */}
      <GoLiveStep onGoLive={handleComplete} />
    </SetupWizard>
  );
}
