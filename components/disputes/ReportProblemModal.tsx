"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import GlassModal from "@/components/ui/GlassModal";
import InteractiveHoverButton from "@/components/ui/interactive-hover-button";

const ISSUE_TYPES = [
  { id: "quality", labelDe: "Qualität", labelEn: "Quality" },
  { id: "no_show_by_salon", labelDe: "Salon erschien nicht", labelEn: "No-show by salon" },
  { id: "wrong_service", labelDe: "Falsche Leistung", labelEn: "Wrong service" },
  { id: "overcharge", labelDe: "Zu viel berechnet", labelEn: "Overcharged" },
  { id: "other", labelDe: "Sonstiges", labelEn: "Other" },
];

export default function ReportProblemModal({
  bookingId,
  onClose,
  onSuccess,
}: {
  bookingId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [issueType, setIssueType] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!issueType) {
      setError("Bitte wählen Sie eine Art des Problems.");
      return;
    }
    if (description.length < 20) {
      setError("Bitte beschreiben Sie das Problem genauer (min. 20 Zeichen).");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/bookings/${bookingId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issue_type: issueType, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler beim Senden");
      onSuccess();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <GlassModal open onClose={onClose} title="Ein Problem melden">
      <div className="mb-4">
        <p className="text-sm text-s-ink/60 mb-3">
          Wählen Sie die Art des Problems:
        </p>
        <div className="flex flex-wrap gap-2">
          {ISSUE_TYPES.map((type) => {
            const isSelected = issueType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setIssueType(type.id)}
                className={`px-3 py-1.5 rounded-btn text-xs font-medium transition-colors border ${
                  isSelected
                    ? "bg-s-coral text-white border-s-coral"
                    : "bg-s-bg-surface text-s-ink border-s-ink/10 hover:border-s-coral/50"
                }`}
              >
                {type.labelDe}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-5">
        <label className="block text-sm text-s-ink/60 mb-2">
          Beschreibung (min. 20 Zeichen):
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Bitte beschreiben Sie detailliert, was vorgefallen ist..."
          className="w-full min-h-[100px] bg-s-bg-sunken rounded-btn p-4 text-sm text-s-ink border border-s-ink/5 focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20 resize-none"
        />
        {error && <p className="text-s-coral text-xs mt-2">{error}</p>}
      </div>

      <div className="flex justify-end gap-3 mt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm text-s-ink/60 hover:text-s-ink transition-colors"
        >
          Abbrechen
        </button>
        <div onClick={(!loading) ? handleSubmit : undefined}>
          <InteractiveHoverButton
            text={loading ? "Wird gemeldet..." : "Melden"}
            className="bg-s-coral border-none text-white hover:brightness-[1.06]"
          />
        </div>
      </div>
    </GlassModal>
  );
}
