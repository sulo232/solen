"use client";

import { useState, useEffect } from "react";
import { ClipboardList, X } from "lucide-react";
import Spinner from "@/components/ui/Spinner";

interface WaitlistModalProps {
  salonId: string;
  serviceId?: string;
  date: string; // ISO date string e.g. "2026-03-20"
  onClose: () => void;
}

export default function WaitlistModal({ salonId, serviceId, date, onClose }: WaitlistModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Escape key to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salon_id: salonId, service_id: serviceId, preferred_date: date }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message ?? "Fehler");
      }
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler beim Eintragen");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-s-ink/40 backdrop-blur-lg" onClick={onClose}>
      <div className="bg-white rounded-[12px] p-6 mx-4 max-w-sm w-full shadow-surface" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-s-coral" />
            <h3 className="font-heading text-s-ink">Warteliste</h3>
          </div>
          <button onClick={onClose} aria-label="Schliessen" className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-btn hover:bg-s-bg-sunken:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-s-ink/40" />
          </button>
        </div>

        {done ? (
          <div className="text-center py-4">
            <p className="text-sm text-s-ink/70">
              Du wirst per E-Mail benachrichtigt, sobald ein Platz am {date} frei wird.
            </p>
            <button
              onClick={onClose}
              className="mt-3 px-4 py-2 rounded-btn active:scale-[0.97] bg-s-coral text-white text-sm hover:brightness-[1.06] transition-[transform,filter] duration-150"
            >
              Schliessen
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-s-ink/60 mb-4">
              Am {date} sind leider keine Termine frei. Möchtest du benachrichtigt werden, wenn ein Platz frei wird?
            </p>
            {error && <p className="text-xs text-s-coral mb-3">{error}</p>}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-btn active:scale-[0.97] bg-s-coral text-white text-sm font-medium hover:brightness-[1.06] transition-[transform,filter] duration-150 disabled:opacity-50"
            >
              {submitting && <Spinner size="sm" invert />}
              {submitting ? "Wird eingetragen…" : "Benachrichtige mich"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
