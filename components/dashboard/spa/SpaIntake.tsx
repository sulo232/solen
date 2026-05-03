"use client";

import { useTranslations } from "next-intl";
import { ShieldCheck } from "lucide-react";
import IntakeFormTab from "@/components/dashboard/IntakeFormTab";

interface SpaIntakeProps {
  customerId: string;
}

export default function SpaIntake({ customerId }: SpaIntakeProps) {
  const t = useTranslations("dashboardSpa") as any;

  return (
    <div className="space-y-3">
      <p className="text-[9px] font-heading uppercase tracking-[.18em] text-s-amber">
        {t("health_questionnaire")}
      </p>

      {/* Confidentiality notice */}
      <div className="flex items-start gap-2 rounded-[12px] border border-s-sage/20 bg-s-sage-subtle p-3">
        <ShieldCheck size={14} className="text-s-sage shrink-0 mt-0.5" />
        <p className="text-[10px] text-s-ink/50 italic leading-relaxed">
          {t("confidentiality_notice")}
        </p>
      </div>

      {/* Reuse existing IntakeFormTab — it already supports spa_consultation */}
      <IntakeFormTab customerId={customerId} />
    </div>
  );
}
