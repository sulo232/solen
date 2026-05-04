"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

interface AllergyWarningProps {
  customerId: string | null;
}

interface AllergyData {
  allergies: string[];
  severity: string;
  hasAllergy: boolean;
  notes: string | null;
}

export default function AllergyWarning({ customerId }: AllergyWarningProps) {
  const t = useTranslations("booking") as any;
  const [data, setData] = useState<AllergyData | null>(null);

  useEffect(() => {
    if (!customerId) return;
    let cancelled = false;
    fetch(`/api/clients/${customerId}/nail-allergies`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d) setData(d); })
      .catch((err) => console.error("[AllergyWarning] failed to load nail allergy data:", err));
    return () => { cancelled = true; };
  }, [customerId]);

  if (!data?.hasAllergy) return null;

  const isSevere = data.severity === "severe";

  return (
    <div
      className={`flex items-start gap-2.5 p-3 rounded-[16px] border ${
        isSevere
          ? "border-s-coral/30 bg-s-coral/5"
          : "border-s-amber/30 bg-s-amber-subtle"
      }`}
    >
      <AlertTriangle
        size={18}
        className={`shrink-0 mt-0.5 ${isSevere ? "text-s-coral" : "text-s-amber"}`}
      />
      <div>
        <p className={`text-sm font-medium ${isSevere ? "text-s-coral" : "text-s-amber-text"}`}>
          {isSevere ? t("allergy_severe") : t("allergy_notice")}
        </p>
        <p className={`text-xs mt-0.5 ${isSevere ? "text-s-coral/80" : "text-s-ink/60"}`}>
          {t("allergy_against", { allergens: data.allergies.join(", ") })}
        </p>
        {data.notes && (
          <p className="text-xs text-s-ink/50 mt-1 italic">{data.notes}</p>
        )}
      </div>
    </div>
  );
}
