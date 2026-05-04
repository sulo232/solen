"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { useTranslations } from "next-intl";

interface ReportButtonProps {
  type: "item" | "comment";
  targetId: string;
}

export default function ReportButton({ type, targetId }: ReportButtonProps) {
  const t = useTranslations("discover") as any;
  const [reported, setReported] = useState(false);

  const handleReport = async () => {
    if (reported) return;

    const reason = prompt(type === "item" ? t("report") : t("report"));
    if (!reason) return;

    try {
      const endpoint = type === "item"
        ? `/api/discovery/items/${targetId}/report`
        : `/api/discovery/comments/${targetId}/report`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) return;
      setReported(true);
    } catch {
      // Silent
    }
  };

  if (reported) {
    return <span className="text-[10px] text-s-ink/30">{t("reported")}</span>;
  }

  return (
    <button
      onClick={handleReport}
      className="text-s-ink/20 hover:text-s-coral transition-colors ml-auto"
      aria-label={t("report")}
      title={t("report")}
    >
      <Flag size={10} />
    </button>
  );
}
