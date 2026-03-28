"use client";

import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

interface AllergyAlertProps {
  allergies: string | null | undefined;
  chemicalSensitivities?: string[] | null;
  patchTestDate?: string | null;
}

export default function AllergyAlert({ allergies, chemicalSensitivities, patchTestDate }: AllergyAlertProps) {
  const t = useTranslations("dashboardCoiffeur") as any;

  const hasAllergen = (allergies && allergies.trim().length > 0) ||
    (chemicalSensitivities && chemicalSensitivities.length > 0);

  if (!hasAllergen) return null;

  const patchOverdue = patchTestDate
    ? (Date.now() - new Date(patchTestDate).getTime()) > 365 * 24 * 60 * 60 * 1000
    : true;

  return (
    <div className="flex gap-3 p-3 rounded-[10px] bg-s-error/8 dark:bg-s-error/15 border border-s-error/20 dark:border-s-error/20 mb-4">
      <AlertTriangle size={15} className="text-s-error shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-heading font-bold text-s-error dark:text-s-error mb-0.5">
          {t("allergyAlertTitle")}
        </p>
        {allergies && (
          <p className="text-[11px] text-s-error/70 dark:text-s-error/70">{allergies}</p>
        )}
        {chemicalSensitivities && chemicalSensitivities.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {chemicalSensitivities.map((s) => (
              <span key={s} className="px-1.5 py-0.5 rounded-[4px] bg-s-error/12 dark:bg-s-error/15 text-[9px] font-heading font-bold text-s-error dark:text-s-error">
                {s}
              </span>
            ))}
          </div>
        )}
        {patchOverdue && (
          <p className="text-[10px] text-s-amber mt-1">
            ⚠ {t("patchTestOverdue")}
          </p>
        )}
      </div>
    </div>
  );
}
