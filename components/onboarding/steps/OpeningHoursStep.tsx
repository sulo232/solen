"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import Spinner from "@/components/ui/Spinner";

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAYS_DE = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
const DAYS_EN = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAYS_SHORT = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

interface OpeningHoursStepProps {
  salonId: string;
  locale: string;
  onSaved: () => void;
}

export default function OpeningHoursStep({ salonId, locale, onSaved }: OpeningHoursStepProps) {
  const isDE = locale === "de" || locale === "fr";
  const dayLabels = isDE ? DAYS_DE : DAYS_EN;
  const [hours, setHours] = useState<Record<string, { open: string; close: string } | null>>(() => {
    const h: Record<string, { open: string; close: string } | null> = {};
    DAY_KEYS.forEach((k, i) => {
      h[k] = i < 5 ? { open: "09:00", close: "18:00" } : (i === 5 ? { open: "09:00", close: "16:00" } : null);
    });
    return h;
  });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!salonId) return;
    fetch(`/api/salons/${salonId}`)
      .then((r) => r.json())
      .then((s) => {
        if (s?.opening_hours && Object.keys(s.opening_hours).length > 0) {
          setHours(s.opening_hours);
        }
      })
      .finally(() => setLoaded(true));
  }, [salonId]);

  const toggle = (key: string) => {
    setHours((h) => ({ ...h, [key]: h[key] ? null : { open: "09:00", close: "18:00" } }));
  };

  const update = (key: string, field: "open" | "close", val: string) => {
    setHours((h) => {
      const curr = h[key];
      if (!curr) return h;
      return { ...h, [key]: { ...curr, [field]: val } };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/salons/${salonId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opening_hours: hours }),
      });
      onSaved();
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  };

  const hasAnyOpen = Object.values(hours).some((v) => v !== null);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-xl bg-s-coral/10 flex items-center justify-center">
          <Clock size={22} className="text-s-coral" />
        </div>
        <div>
          <h2 className="font-heading font-bold text-xl text-s-ink">
            {isDE ? "Öffnungszeiten" : "Opening Hours"}
          </h2>
          <p className="text-sm text-s-ink/40">
            {isDE ? "Wann ist dein Salon geöffnet?" : "When is your salon open?"}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-card border border-s-ink/5 p-6 space-y-3">
        {DAY_KEYS.map((key, i) => {
          const h = hours[key];
          return (
            <div key={key} className="flex items-center gap-4">
              <button
                onClick={() => toggle(key)}
                className={[
                  "w-20 text-center text-xs font-medium py-2 rounded-button transition-all",
                  h ? "bg-s-coral text-white shadow-sm" : "bg-s-bg-sunken text-s-ink/30 hover:text-s-ink/50",
                ].join(" ")}
              >
                {DAYS_SHORT[i]}
              </button>
              <span className="text-sm text-s-ink/60 w-24 hidden sm:block">{dayLabels[i]}</span>
              {h ? (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={h.open}
                    onChange={(e) => update(key, "open", e.target.value)}
                    className="px-3 py-2 rounded-button border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral"
                  />
                  <span className="text-s-ink/20">–</span>
                  <input
                    type="time"
                    value={h.close}
                    onChange={(e) => update(key, "close", e.target.value)}
                    className="px-3 py-2 rounded-button border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral"
                  />
                </div>
              ) : (
                <span className="text-sm text-s-ink/20 italic">
                  {isDE ? "Geschlossen" : "Closed"}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={handleSave}
        disabled={!hasAnyOpen || saving}
        className="w-full py-3 rounded-button bg-s-coral text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-s-coral/90 transition-colors"
      >
        {saving && <Spinner size="sm" invert />}
        {isDE ? "Speichern" : "Save"}
      </button>
    </div>
  );
}
