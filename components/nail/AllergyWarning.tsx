"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

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
  const [data, setData] = useState<AllergyData | null>(null);

  useEffect(() => {
    if (!customerId) return;
    fetch(`/api/clients/${customerId}/nail-allergies`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setData(d); })
      .catch(() => {});
  }, [customerId]);

  if (!data?.hasAllergy) return null;

  const isSevere = data.severity === "severe";

  return (
    <div
      className={`flex items-start gap-2.5 p-3 rounded-card border ${
        isSevere
          ? "border-red-300 bg-red-50 dark:border-red-500/30 dark:bg-red-900/10"
          : "border-s-amber/30 bg-s-amber-subtle dark:border-s-amber/20 dark:bg-s-amber/5"
      }`}
    >
      <AlertTriangle
        size={18}
        className={`shrink-0 mt-0.5 ${isSevere ? "text-red-500" : "text-s-amber"}`}
      />
      <div>
        <p className={`text-sm font-medium ${isSevere ? "text-red-700 dark:text-red-400" : "text-s-amber-text dark:text-s-amber"}`}>
          {isSevere ? "Schwere Allergie" : "Allergie-Hinweis"}
        </p>
        <p className={`text-xs mt-0.5 ${isSevere ? "text-red-600/80 dark:text-red-300/80" : "text-s-ink/60 dark:text-s-dm-text/60"}`}>
          Allergie gegen {data.allergies.join(", ")} — bitte informiere das Nagelstudio
        </p>
        {data.notes && (
          <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 mt-1 italic">{data.notes}</p>
        )}
      </div>
    </div>
  );
}
