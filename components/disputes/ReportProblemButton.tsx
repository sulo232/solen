"use client";

import { useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import ReportProblemModal from "./ReportProblemModal";
import useSWR from "swr";

export function ReportProblemButton({ bookingId }: { bookingId: string }) {
  const t = useTranslations("Profile") as any;
  const [modalOpen, setModalOpen] = useState(false);

  const { data, mutate } = useSWR(`/api/bookings/${bookingId}/report`, (url) =>
    fetch(url).then((res) => res.json())
  );

  const dispute = data?.dispute;

  if (dispute) {
    return (
      <button
        disabled
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-btn border border-s-ink/10 dark:border-white/10 text-xs text-s-sage cursor-not-allowed"
      >
        <Check size={12} />
        {t("problemReported", { fallback: "Gemeldet ✓" })}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-btn border border-s-coral/30 text-xs text-s-coral hover:bg-s-coral/5 transition-colors"
      >
        <AlertTriangle size={12} />
        {t("reportProblem", { fallback: "Ein Problem melden" })}
      </button>

      {modalOpen && (
        <ReportProblemModal
          bookingId={bookingId}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false);
            mutate();
          }}
        />
      )}
    </>
  );
}
