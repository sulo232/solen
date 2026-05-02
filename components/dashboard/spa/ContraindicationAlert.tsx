"use client";

import { ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";

interface IntakeData {
  pregnancy?: boolean;
  heart_condition?: boolean;
  recent_surgery?: boolean;
  [key: string]: unknown;
}

interface ContraindicationAlertProps {
  intakeData: IntakeData | null | undefined;
}

const FLAGS: { key: keyof IntakeData; labelKey: string }[] = [
  { key: "pregnancy", labelKey: "contraPregnancy" },
  { key: "heart_condition", labelKey: "contraHeart" },
  { key: "recent_surgery", labelKey: "contraSurgery" },
];

export default function ContraindicationAlert({ intakeData }: ContraindicationAlertProps) {
  const t = useTranslations("dashboardSpa") as any;
  if (!intakeData) return null;

  const active = FLAGS.filter((f) => intakeData[f.key] === true);
  if (active.length === 0) return null;

  return (
    <div className="flex gap-3 p-3 rounded-[10px] bg-orange-50 border border-orange-200 mb-4">
      <ShieldAlert size={15} className="text-orange-500 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-heading font-bold text-orange-600 mb-1">
          {t("contraindicationTitle")}
        </p>
        <div className="flex flex-wrap gap-1">
          {active.map((f) => (
            <span key={String(f.key)} className="px-2 py-0.5 rounded-[4px] bg-orange-100 text-[9px] font-heading font-bold text-orange-600">
              {t(f.labelKey)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
