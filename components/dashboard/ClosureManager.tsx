"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Calendar, X } from "lucide-react";
import Spinner from "@/components/ui/Spinner";

interface Closure {
  id: string;
  start_date: string;
  end_date: string;
  reason: string;
}

interface ClosureManagerProps {
  salonId: string;
}

export default function ClosureManager({ salonId }: ClosureManagerProps) {
  const [closures, setClosures] = useState<Closure[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const loadClosures = () => {
    fetch(`/api/salon/closures?salon_id=${salonId}`)
      .then(r => r.json())
      .then(d => setClosures(d.closures ?? d.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadClosures(); }, [salonId]);

  const handleAdd = async () => {
    if (!startDate || !endDate) return;
    setSaving(true);
    try {
      await fetch("/api/salon/closures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salon_id: salonId, start_date: startDate, end_date: endDate, reason: reason.trim() }),
      });
      setShowAdd(false);
      setStartDate("");
      setEndDate("");
      setReason("");
      loadClosures();
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/salon/closures?id=${id}`, { method: "DELETE" });
    setClosures(prev => prev.filter(c => c.id !== id));
  };

  if (loading) return <div className="flex justify-center py-6"><Spinner size="md" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-bold text-sm text-s-ink dark:text-s-dm-text flex items-center gap-2">
          <Calendar size={14} className="text-s-coral" /> Feiertage & Schliessungen
        </h3>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1 text-xs text-s-coral hover:text-s-coral/80 transition-colors">
          <Plus size={12} /> Hinzufügen
        </button>
      </div>

      {showAdd && (
        <div className="rounded-card border border-s-coral/20 bg-s-coral/5 p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-s-ink/50 dark:text-s-dm-text/50 mb-1 block">Von</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full px-2 py-1.5 rounded-button border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-bg text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral" />
            </div>
            <div>
              <label className="text-xs text-s-ink/50 dark:text-s-dm-text/50 mb-1 block">Bis</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="w-full px-2 py-1.5 rounded-button border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-bg text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral" />
            </div>
          </div>
          <input
            type="text"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Grund (z.B. Weihnachten)"
            className="w-full px-3 py-2 rounded-button border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-bg text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral"
          />
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 rounded-button border border-s-ink/10 dark:border-white/10 text-xs text-s-ink/60 dark:text-s-dm-text/60">Abbrechen</button>
            <button onClick={handleAdd} disabled={!startDate || !endDate || saving}
              className="px-3 py-1.5 rounded-button bg-s-coral text-white text-xs font-medium disabled:opacity-50 flex items-center gap-1">
              {saving && <Spinner size="sm" invert />} Speichern
            </button>
          </div>
        </div>
      )}

      {closures.length === 0 ? (
        <p className="text-xs text-s-ink/30 dark:text-s-dm-text/30 text-center py-4">Keine Schliessungen geplant</p>
      ) : (
        <div className="space-y-2">
          {closures.map(c => (
            <div key={c.id} className="flex items-center justify-between bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/5 p-3">
              <div>
                <p className="text-sm font-medium text-s-ink dark:text-s-dm-text">{c.reason || "Schliessung"}</p>
                <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40">
                  {new Date(c.start_date).toLocaleDateString("de-CH")} — {new Date(c.end_date).toLocaleDateString("de-CH")}
                </p>
              </div>
              <button onClick={() => handleDelete(c.id)} className="p-1.5 text-s-ink/20 dark:text-s-dm-text/20 hover:text-s-coral transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
