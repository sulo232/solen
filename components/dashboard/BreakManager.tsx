"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Coffee } from "lucide-react";
import Spinner from "@/components/ui/Spinner";

const DAY_LABELS: Record<number, string> = {
  0: "Sonntag", 1: "Montag", 2: "Dienstag", 3: "Mittwoch",
  4: "Donnerstag", 5: "Freitag", 6: "Samstag",
};

interface Break {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface BreakManagerProps {
  staffMemberId: string;
}

export default function BreakManager({ staffMemberId }: BreakManagerProps) {
  const [breaks, setBreaks] = useState<Break[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState("12:00");
  const [endTime, setEndTime] = useState("13:00");
  const [saving, setSaving] = useState(false);

  const loadBreaks = () => {
    fetch(`/api/staff/breaks?staff_member_id=${staffMemberId}`)
      .then(r => r.json())
      .then(d => setBreaks(d.breaks ?? d.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadBreaks(); }, [staffMemberId]);

  const handleAdd = async () => {
    setSaving(true);
    try {
      await fetch("/api/staff/breaks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staff_member_id: staffMemberId,
          day_of_week: dayOfWeek,
          start_time: startTime,
          end_time: endTime,
        }),
      });
      setShowAdd(false);
      loadBreaks();
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/staff/breaks?id=${id}`, { method: "DELETE" });
    setBreaks(prev => prev.filter(b => b.id !== id));
  };

  if (loading) return <div className="flex justify-center py-6"><Spinner size="md" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-bold text-sm text-s-ink dark:text-s-dm-text flex items-center gap-2">
          <Coffee size={14} className="text-s-coral" /> Pausen
        </h3>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1 text-xs text-s-coral hover:text-s-coral/80 transition-colors">
          <Plus size={12} /> Hinzufügen
        </button>
      </div>

      {showAdd && (
        <div className="rounded-card border border-s-coral/20 bg-s-coral/5 p-4 mb-4 space-y-3">
          <div>
            <label className="text-xs text-s-ink/50 dark:text-s-dm-text/50 mb-1 block">Wochentag</label>
            <select value={dayOfWeek} onChange={e => setDayOfWeek(Number(e.target.value))}
              className="w-full px-2 py-1.5 rounded-button border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-bg text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral">
              {Object.entries(DAY_LABELS).map(([v, label]) => (
                <option key={v} value={v}>{label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-s-ink/50 dark:text-s-dm-text/50 mb-1 block">Von</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                className="w-full px-2 py-1.5 rounded-button border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-bg text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral" />
            </div>
            <div>
              <label className="text-xs text-s-ink/50 dark:text-s-dm-text/50 mb-1 block">Bis</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                className="w-full px-2 py-1.5 rounded-button border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-bg text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 rounded-button border border-s-ink/10 dark:border-white/10 text-xs text-s-ink/60 dark:text-s-dm-text/60">Abbrechen</button>
            <button onClick={handleAdd} disabled={saving}
              className="px-3 py-1.5 rounded-button bg-s-coral text-white text-xs font-medium disabled:opacity-50 flex items-center gap-1">
              {saving && <Spinner size="sm" invert />} Speichern
            </button>
          </div>
        </div>
      )}

      {breaks.length === 0 ? (
        <p className="text-xs text-s-ink/30 dark:text-s-dm-text/30 text-center py-4">Keine Pausen eingetragen</p>
      ) : (
        <div className="space-y-2">
          {breaks.map(b => (
            <div key={b.id} className="flex items-center justify-between bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/5 p-3">
              <div>
                <p className="text-sm font-medium text-s-ink dark:text-s-dm-text">{DAY_LABELS[b.day_of_week]}</p>
                <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40">{b.start_time} — {b.end_time}</p>
              </div>
              <button onClick={() => handleDelete(b.id)} className="p-1.5 text-s-ink/20 dark:text-s-dm-text/20 hover:text-s-coral transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
