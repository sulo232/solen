"use client";

import { Calendar } from "lucide-react";

interface ScheduleStepProps {
  locale: string;
  onSaved: () => void;
}

export default function ScheduleStep({ locale, onSaved }: ScheduleStepProps) {
  const isDE = locale === "de" || locale === "fr";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-xl bg-s-coral/10 flex items-center justify-center">
          <Calendar size={22} className="text-s-coral" />
        </div>
        <div>
          <h2 className="font-heading font-bold text-xl text-s-ink">
            {isDE ? "Arbeitszeiten & Pausen" : "Working Hours & Breaks"}
          </h2>
          <p className="text-sm text-s-ink/40">
            {isDE ? "Lege fest, wann dein Team arbeitet" : "Set when your team works"}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-card border border-s-ink/5 p-6 space-y-4">
        <p className="text-sm text-s-ink/60">
          {isDE
            ? "Arbeitszeiten und Pausen kannst du jederzeit im Dashboard unter Kalender → Arbeitszeiten verwalten. Standardmässig übernehmen Mitarbeiter die Öffnungszeiten des Salons."
            : "You can manage working hours and breaks anytime in the Dashboard under Calendar → Working Hours. By default, staff inherits salon opening hours."}
        </p>

        <div className="bg-s-coral/5 border border-s-coral/20 rounded-card px-4 py-3">
          <p className="text-xs text-s-coral font-medium">
            ✓ {isDE ? "Automatisch eingestellt" : "Automatically configured"}
          </p>
          <p className="text-[10px] text-s-ink/40 mt-0.5">
            {isDE
              ? "Deine Öffnungszeiten werden als Standard-Arbeitszeiten verwendet."
              : "Your opening hours are used as default working hours."}
          </p>
        </div>

        <div className="bg-s-bg-surface rounded-card px-4 py-3">
          <p className="text-xs text-s-ink/40">
            💡 {isDE
              ? "Du kannst individuelle Arbeitszeiten pro Mitarbeiter nach dem Setup im Dashboard festlegen."
              : "You can set individual working hours per staff member after setup in the dashboard."}
          </p>
        </div>
      </div>
    </div>
  );
}
