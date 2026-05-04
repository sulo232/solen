"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, Send } from "lucide-react";
import Spinner from "@/components-legacy/ui/Spinner";

export default function DisputeNotification({
  dispute,
  onResponded,
}: {
  dispute: any;
  onResponded: (bookingId: string) => void;
}) {
  const t = useTranslations("dashboard.disputes") as any;
  const [showReply, setShowReply] = useState(false);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (response.length < 10) {
      setError(t("minLengthError"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${dispute.booking_id}/report`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salon_response: response }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("sendError"));
      onResponded(dispute.booking_id);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="rounded-[12px] p-4 mt-3"
      style={{ background: "rgba(243,168,100,.08)", border: "1px solid rgba(243,168,100,.22)" }}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-s-coral shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-s-ink">{t("customerReported")}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 rounded-pill bg-white text-s-ink text-[11px] font-medium border border-s-ink/5">
              {dispute.issue_type}
            </span>
          </div>
          <p className="text-xs text-s-ink/60 mt-2 italic border-l-2 border-s-coral/30 pl-2">
            "{dispute.description.length > 100 ? dispute.description.slice(0, 100) + "..." : dispute.description}"
          </p>

          {!showReply ? (
            <button
              onClick={() => setShowReply(true)}
              className="mt-3 px-3 py-1.5 rounded-[8px] bg-s-coral text-white text-xs font-medium hover:brightness-[1.06] transition-colors"
            >
              {t("reply")}
            </button>
          ) : (
            <div className="mt-3 space-y-2">
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder={t("responsePlaceholder")}
                className="w-full min-h-[80px] rounded-input p-3 text-xs border border-s-ink/10 focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20 resize-none"
              />
              {error && <p className="text-xs text-s-coral">{error}</p>}
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowReply(false)}
                  className="px-3 py-1.5 text-xs text-s-ink/50 hover:text-s-ink"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-4 py-1.5 rounded-[8px] bg-s-coral text-white text-xs font-medium hover:brightness-[1.06] disabled:opacity-50 flex items-center gap-1.5 transition-colors"
                >
                  {loading && <Spinner size="sm" invert />}
                  {t("send")} <Send size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
