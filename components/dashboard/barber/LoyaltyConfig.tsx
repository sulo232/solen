"use client";

import { useEffect, useState } from "react";
import { Award, Save, Check, Circle } from "lucide-react";

interface LoyaltyProgram {
  id?: string;
  name: string;
  stamps_required: number;
  reward_type: "free_service" | "chf_discount" | "percentage_discount";
  reward_value: number;
  is_active: boolean;
}

interface LoyaltyConfigProps {
  salonId: string;
}

export default function LoyaltyConfig({ salonId }: LoyaltyConfigProps) {
  const [program, setProgram] = useState<LoyaltyProgram>({
    name: "Treuekarte",
    stamps_required: 10,
    reward_type: "free_service",
    reward_value: 0,
    is_active: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchProgram = async () => {
      try {
        const res = await fetch(`/api/salon/loyalty?salon_id=${salonId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.program) setProgram(data.program);
        }
      } catch {
        // No program yet
      }
      setLoading(false);
    };
    fetchProgram();
  }, [salonId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/salon/loyalty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(program),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // Error saving
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="py-4 text-center text-sm text-s-ink/40 dark:text-s-dm-text/40">Laden...</div>;
  }

  // Preview stamp card
  const previewStamps = Array.from({ length: program.stamps_required }, (_, i) => i);
  const previewFilled = Math.floor(program.stamps_required * 0.6);

  return (
    <div className="rounded-card bg-white dark:bg-s-dm-surface border border-s-ink/5 dark:border-s-dm-text/10 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Award size={18} className="text-s-coral" />
        <h3 className="font-heading text-sm font-bold text-s-ink dark:text-s-dm-text">Treueprogramm</h3>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-s-ink/70 dark:text-s-dm-text/70 mb-1">Name</label>
          <input
            type="text"
            value={program.name}
            onChange={(e) => setProgram({ ...program, name: e.target.value })}
            maxLength={100}
            className="w-full rounded-input border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-bg px-3 py-2 text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:ring-2 focus:ring-s-coral/30"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-s-ink/70 dark:text-s-dm-text/70 mb-1">
            Stempel benötigt
          </label>
          <input
            type="number"
            value={program.stamps_required}
            onChange={(e) => setProgram({ ...program, stamps_required: Math.max(3, Math.min(20, parseInt(e.target.value) || 10)) })}
            min={3}
            max={20}
            className="w-full rounded-input border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-bg px-3 py-2 text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:ring-2 focus:ring-s-coral/30"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-s-ink/70 dark:text-s-dm-text/70 mb-1">Belohnung</label>
          <select
            value={program.reward_type}
            onChange={(e) => setProgram({ ...program, reward_type: e.target.value as LoyaltyProgram["reward_type"] })}
            className="w-full rounded-input border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-bg px-3 py-2 text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:ring-2 focus:ring-s-coral/30"
          >
            <option value="free_service">Gratis Service</option>
            <option value="chf_discount">CHF Rabatt</option>
            <option value="percentage_discount">% Rabatt</option>
          </select>
        </div>

        {program.reward_type !== "free_service" && (
          <div>
            <label className="block text-xs font-medium text-s-ink/70 dark:text-s-dm-text/70 mb-1">
              {program.reward_type === "chf_discount" ? "Rabatt (CHF)" : "Rabatt (%)"}
            </label>
            <input
              type="number"
              value={program.reward_value}
              onChange={(e) => setProgram({ ...program, reward_value: parseInt(e.target.value) || 0 })}
              min={0}
              className="w-full rounded-input border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-bg px-3 py-2 text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:ring-2 focus:ring-s-coral/30"
            />
          </div>
        )}

        {/* Active toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-s-ink dark:text-s-dm-text">Aktiv</span>
          <button
            onClick={() => setProgram({ ...program, is_active: !program.is_active })}
            className={`w-10 h-6 rounded-full transition-colors ${
              program.is_active ? "bg-s-coral" : "bg-s-ink/20 dark:bg-s-dm-text/20"
            }`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-1 ${
              program.is_active ? "translate-x-4" : "translate-x-0"
            }`} />
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="mt-4 p-3 rounded-btn bg-s-bg-surface dark:bg-s-dm-bg border border-s-ink/5 dark:border-s-dm-text/5">
        <p className="text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-2">Vorschau</p>
        <p className="text-sm font-medium text-s-ink dark:text-s-dm-text mb-2">{program.name}</p>
        <div className="flex flex-wrap gap-1.5">
          {previewStamps.map((i) => (
            i < previewFilled ? (
              <Check key={i} size={18} className="text-s-coral" />
            ) : (
              <Circle key={i} size={18} className="text-s-ink/15 dark:text-s-dm-text/15" />
            )
          ))}
        </div>
        <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 mt-2">
          {previewFilled}/{program.stamps_required} Stempel
        </p>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-4 w-full flex items-center justify-center gap-2 rounded-btn active:scale-[0.98] bg-s-coral text-white font-medium py-2 text-sm hover:bg-s-coral-hover disabled:opacity-50 transition-all"
      >
        <Save size={14} />
        {saving ? "Speichern..." : saved ? "Gespeichert!" : "Speichern"}
      </button>
    </div>
  );
}
