"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Armchair, Save } from "lucide-react";

interface ChairManagerProps {
  salonId: string;
}

export default function ChairManager({ salonId }: ChairManagerProps) {
  const tc = useTranslations("common");
  const [chairCount, setChairCount] = useState(1);
  const [bufferMinutes, setBufferMinutes] = useState(5);
  const [occupiedChairs, setOccupiedChairs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchChairs = async () => {
      try {
        const res = await fetch("/api/salon/chairs");
        if (res.ok) {
          const data = await res.json();
          const chairs = data.chairs;
          setChairCount(chairs.chair_count ?? 1);
          setBufferMinutes(chairs.buffer_minutes ?? 5);
        }

        // Get currently occupied chairs
        const qRes = await fetch(`/api/walkin/queue?salon_id=${salonId}`);
        if (qRes.ok) {
          const qData = await qRes.json();
          const inChair = (qData.queue ?? []).filter(
            (q: { status: string }) => q.status === "in_chair"
          ).length;
          setOccupiedChairs(inChair);
        }
      } catch {
        // Error loading
      }
      setLoading(false);
    };
    fetchChairs();
  }, [salonId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/salon/chairs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chair_count: chairCount, buffer_minutes: bufferMinutes }),
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

  const utilization = chairCount > 0 ? Math.round((occupiedChairs / chairCount) * 100) : 0;

  if (loading) {
    return <div className="py-4 text-center text-sm text-s-ink/40 dark:text-s-dm-text/40">Laden...</div>;
  }

  return (
    <div className="rounded-card bg-white dark:bg-s-dm-surface border border-s-ink/5 dark:border-s-dm-text/10 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Armchair size={18} className="text-s-coral" />
        <h3 className="font-heading text-sm font-bold text-s-ink dark:text-s-dm-text">Stuhl-Verwaltung</h3>
      </div>

      {/* Utilization bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-s-ink/50 dark:text-s-dm-text/50 mb-1">
          <span>{occupiedChairs} von {chairCount} Stühlen belegt</span>
          <span>{utilization}%</span>
        </div>
        <div className="h-2 rounded-pill bg-s-sand-subtle dark:bg-s-dm-bg overflow-hidden">
          <div
            className={`h-full rounded-pill transition-all ${
              utilization >= 90 ? "bg-s-error" : utilization >= 70 ? "bg-s-amber" : "bg-s-sage"
            }`}
            style={{ width: `${Math.min(utilization, 100)}%` }}
          />
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-s-ink/70 dark:text-s-dm-text/70 mb-1">
            Anzahl Stühle
          </label>
          <input
            type="number"
            value={chairCount}
            onChange={(e) => setChairCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
            min={1}
            max={20}
            className="w-full rounded-btn border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-bg px-3 py-2 text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:ring-2 focus:ring-s-coral/30"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-s-ink/70 dark:text-s-dm-text/70 mb-1">
            Puffer zwischen Terminen (Min.)
          </label>
          <input
            type="number"
            value={bufferMinutes}
            onChange={(e) => setBufferMinutes(Math.max(0, Math.min(30, parseInt(e.target.value) || 0)))}
            min={0}
            max={30}
            className="w-full rounded-btn border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-bg px-3 py-2 text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:ring-2 focus:ring-s-coral/30"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-4 w-full flex items-center justify-center gap-2 rounded-btn active:scale-[0.98] bg-s-coral text-white font-medium py-2 text-sm hover:bg-s-coral-hover disabled:opacity-50 transition-all"
      >
        <Save size={14} />
        {saving ? tc("saving") : saved ? tc("saved") : tc("save")}
      </button>
    </div>
  );
}
