"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HandChartProps {
  customerId: string;
}

type FingerKey = 
  | "l_pinky" | "l_ring" | "l_middle" | "l_index" | "l_thumb"
  | "r_thumb" | "r_index" | "r_middle" | "r_ring" | "r_pinky";

const FINGERS_LEFT: { id: FingerKey; label: string }[] = [
  { id: "l_pinky", label: "Kleiner Finger (L)" },
  { id: "l_ring", label: "Ringfinger (L)" },
  { id: "l_middle", label: "Mittelfinger (L)" },
  { id: "l_index", label: "Zeigefinger (L)" },
  { id: "l_thumb", label: "Daumen (L)" },
];

const FINGERS_RIGHT: { id: FingerKey; label: string }[] = [
  { id: "r_thumb", label: "Daumen (R)" },
  { id: "r_index", label: "Zeigefinger (R)" },
  { id: "r_middle", label: "Mittelfinger (R)" },
  { id: "r_ring", label: "Ringfinger (R)" },
  { id: "r_pinky", label: "Kleiner Finger (R)" },
];

export default function HandChart({ customerId }: HandChartProps) {
  const t = useTranslations("nail_dashboard") as any;
  const [notes, setNotes] = useState<Record<FingerKey, string>>({} as Record<FingerKey, string>);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedFinger, setSelectedFinger] = useState<FingerKey | null>(null);

  useEffect(() => {
    fetch(`/api/nail/hand-chart?client_id=${customerId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.notes) setNotes(d.notes);
      })
      .finally(() => setLoading(false));
  }, [customerId]);

  const saveNotes = async (newNotes: Record<FingerKey, string>) => {
    setSaving(true);
    try {
      await fetch("/api/nail/hand-chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: customerId, notes: newNotes }),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateNote = (val: string) => {
    if (!selectedFinger) return;
    const next = { ...notes, [selectedFinger]: val };
    if (!val.trim()) delete next[selectedFinger];
    
    setNotes(next);
    saveNotes(next);
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin text-s-coral/50" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2 pb-12 relative">
      <div className="text-center mb-6">
        <h3 className="text-sm font-heading font-bold text-s-ink dark:text-white uppercase tracking-[.06em]">
          Visual Hand Chart
        </h3>
        <p className="text-xs text-s-ink/60 dark:text-white/60 mt-1">
          Tippe auf einen Finger, um spezifische Notizen oder Farb-Codes zu speichern.
        </p>
      </div>

      <div className="max-w-md mx-auto aspect-[16/9] relative bg-s-coral/[0.03] rounded-[24px] border border-s-coral/10 p-4 flex justify-between items-end pb-8">
        
        {/* Left Hand SVG interpretation using buttons */}
        <div className="flex gap-1.5 items-end h-[140px]">
          {FINGERS_LEFT.map((finger, i) => {
            const hasNote = !!notes[finger.id];
            return (
              <button
                key={finger.id}
                onClick={() => setSelectedFinger(finger.id)}
                className={`relative w-[28px] rounded-full transition-all border ${
                  selectedFinger === finger.id 
                    ? "border-s-coral bg-s-coral shadow-coral-glow scale-105" 
                    : hasNote 
                      ? "border-s-coral/40 bg-s-coral/10 hover:border-s-coral/60"
                      : "border-s-ink/10 bg-white dark:border-white/10 dark:bg-s-dm-surface hover:bg-s-ink/5 dark:hover:bg-white/5"
                }`}
                style={{ 
                  height: i === 4 ? "80px" : i === 3 ? "110px" : i === 2 ? "130px" : i === 1 ? "120px" : "90px",
                  transformOrigin: "bottom center",
                  transform: i === 4 ? "rotate(15deg) translateY(10px)" : "none"
                }}
              >
                {hasNote && selectedFinger !== finger.id && (
                  <div className="absolute -top-2 -right-2 w-3.5 h-3.5 rounded-full bg-s-coral border-2 border-white dark:border-s-dm-bg" />
                )}
              </button>
            );
          })}
        </div>

        {/* Right Hand */}
        <div className="flex gap-1.5 items-end h-[140px]">
          {FINGERS_RIGHT.map((finger, i) => {
            const hasNote = !!notes[finger.id];
            return (
              <button
                key={finger.id}
                onClick={() => setSelectedFinger(finger.id)}
                className={`relative w-[28px] rounded-full transition-all border ${
                  selectedFinger === finger.id 
                    ? "border-s-coral bg-s-coral shadow-coral-glow scale-105" 
                    : hasNote 
                      ? "border-s-coral/40 bg-s-coral/10 hover:border-s-coral/60"
                      : "border-s-ink/10 bg-white dark:border-white/10 dark:bg-s-dm-surface hover:bg-s-ink/5 dark:hover:bg-white/5"
                }`}
                style={{ 
                  height: i === 0 ? "80px" : i === 1 ? "110px" : i === 2 ? "130px" : i === 3 ? "120px" : "90px",
                  transformOrigin: "bottom center",
                  transform: i === 0 ? "rotate(-15deg) translateY(10px)" : "none"
                }}
              >
                {hasNote && selectedFinger !== finger.id && (
                  <div className="absolute -top-2 -right-2 w-3.5 h-3.5 rounded-full bg-s-coral border-2 border-white dark:border-s-dm-bg" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {selectedFinger && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-[-10px] left-0 right-0 p-4 bg-white dark:bg-s-dm-surface rounded-[16px] shadow-warm-lg border border-s-ink/10 dark:border-white/10"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-heading font-bold text-s-ink dark:text-white">
                {[...FINGERS_LEFT, ...FINGERS_RIGHT].find(f => f.id === selectedFinger)?.label}
              </span>
              <button onClick={() => setSelectedFinger(null)} className="text-s-ink/40 hover:text-s-ink dark:text-white/40 dark:hover:text-white">
                <X size={16} />
              </button>
            </div>
            <textarea 
              autoFocus
              className="w-full text-sm rounded-input border border-s-ink/10 dark:border-white/10 p-3 bg-s-bg-sunken dark:bg-s-dm-bg focus:outline-none focus:border-s-coral focus:ring-1 focus:ring-s-coral resize-none"
              rows={2}
              placeholder="Z.B. Nagel gebrochen, spezieller Farb-Code..."
              value={notes[selectedFinger] || ""}
              onChange={(e) => handleUpdateNote(e.target.value)}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-[10px] text-s-ink/40 dark:text-white/40">
                Wird automatisch gespeichert
              </span>
              {saving && <Loader2 size={12} className="animate-spin text-s-coral" />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
