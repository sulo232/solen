"use client";

import { useState } from "react";
import { AlertTriangle, Send } from "lucide-react";
import Spinner from "@/components/ui/Spinner";

export default function DisputeNotification({
  dispute,
  onResponded,
}: {
  dispute: any;
  onResponded: (bookingId: string) => void;
}) {
  const [showReply, setShowReply] = useState(false);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (response.length < 10) {
      setError("Die Antwort muss mindestens 10 Zeichen lang sein.");
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
      if (!res.ok) throw new Error(data.error || "Fehler beim Senden");
      onResponded(dispute.booking_id);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="rounded-[12px] p-4 mt-3"
      style={{ background: "rgba(212,135,10,.08)", border: "1px solid rgba(212,135,10,.22)" }}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-s-coral shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-s-ink">Ein Kunde hat ein Problem gemeldet</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 rounded-pill bg-white dark:bg-s-dm-surface text-s-ink dark:text-s-dm-text text-[11px] font-medium border border-s-ink/5 dark:border-white/5">
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
              Antworten
            </button>
          ) : (
            <div className="mt-3 space-y-2">
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Ihre Stellungnahme zum Vorfall..."
                className="w-full min-h-[80px] rounded-input p-3 text-xs border border-s-ink/10 focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20 resize-none"
              />
              {error && <p className="text-xs text-s-coral">{error}</p>}
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowReply(false)}
                  className="px-3 py-1.5 text-xs text-s-ink/50 hover:text-s-ink"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-4 py-1.5 rounded-[8px] bg-s-coral text-white text-xs font-medium hover:brightness-[1.06] disabled:opacity-50 flex items-center gap-1.5 transition-colors"
                >
                  {loading && <Spinner size="xs" invert />}
                  Senden <Send size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
