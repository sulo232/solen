"use client";

import { useState } from "react";
import { Flag } from "lucide-react";

interface ReportButtonProps {
  type: "item" | "comment";
  targetId: string;
}

export default function ReportButton({ type, targetId }: ReportButtonProps) {
  const [reported, setReported] = useState(false);

  const handleReport = async () => {
    if (reported) return;

    const reason = prompt(type === "item" ? "Why are you reporting this content?" : "Why are you reporting this comment?");
    if (!reason) return;

    try {
      // For items: flag in discovery_items; for comments: flag in discovery_comments
      const endpoint = type === "item"
        ? `/api/discovery/comments?report=true`
        : `/api/discovery/comments?report=true`;

      await fetch("/api/discovery/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: targetId,
          text: `[REPORT] ${reason}`,
        }),
      });
      setReported(true);
    } catch {
      // Silent
    }
  };

  if (reported) {
    return <span className="text-[10px] text-s-ink/30 dark:text-s-dm-text/30">Reported</span>;
  }

  return (
    <button
      onClick={handleReport}
      className="text-s-ink/20 dark:text-s-dm-text/20 hover:text-s-coral transition-colors ml-auto"
      aria-label="Report"
      title="Report"
    >
      <Flag size={10} />
    </button>
  );
}
