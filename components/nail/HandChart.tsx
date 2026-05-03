"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HandChartProps {
  customerId: string;
}

type FingerKey =
  | "l_pinky" | "l_ring" | "l_middle" | "l_index" | "l_thumb"
  | "r_thumb" | "r_index" | "r_middle" | "r_ring" | "r_pinky";

export default function HandChart({ customerId }: HandChartProps) {
  const t = useTranslations("nail_dashboard") as any;
  const [notes, setNotes] = useState<Record<FingerKey, string>>({} as Record<FingerKey, string>);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedFinger, setSelectedFinger] = useState<FingerKey | null>(null);

  const FINGERS_LEFT: { id: FingerKey; label: string }[] = [
    { id: "l_pinky", label: t("finger_l_pinky") },
    { id: "l_ring", label: t("finger_l_ring") },
    { id: "l_middle", label: t("finger_l_middle") },
    { id: "l_index", label: t("finger_l_index") },
    { id: "l_thumb", label: t("finger_l_thumb") },
  ];

  const FINGERS_RIGHT: { id: FingerKey; label: string }[] = [
    { id: "r_thumb", label: t("finger_r_thumb") },
    { id: "r_index", label: t("finger_r_index") },
    { id: "r_middle", label: t("finger_r_middle") },
    { id: "r_ring", label: t("finger_r_ring") },
    { id: "r_pinky", label: t("finger_r_pinky") },
  ];

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch(`/api/nail/hand-chart?client_id=${customerId}`);
        if (!r.ok || cancelled) return;
        const d = await r.json();
        if (!cancelled && d.notes) setNotes(d.notes);
      } catch {
        // silent — chart just starts empty
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [customerId]);

  const saveNotes = async (newNotes: Record<FingerKey, string>) => {
    setSaving(true);
    try {
      const r = await fetch("/api/nail/hand-chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: customerId, notes: newNotes }),
      });
      if (!r.ok) return;
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
        <h3 className="text-sm font-heading font-bold text-s-ink uppercase tracking-[.06em]">
          {t("hand_chart_title")}
        </h3>
        <p className="text-xs text-s-ink/60 mt-1">
          {t("hand_chart_hint")}
        </p>
      </div>

      <div className="max-w-md mx-auto aspect-[16/9] relative bg-s-coral/[0.03] rounded-[24px] border border-s-coral/10 p-4 flex justify-between items-end pb-8">

        {/* Left Hand */}
        <div className="flex gap-1.5 items-end h-[140px]">
          {FINGERS_LEFT.map((finger, i) => {
            const hasNote = !!notes[finger.id];
            return (
              <button
                key={finger.id}
                onClick={() => setSelectedFinger(finger.id)}
                aria-label={finger.label}
                aria-pressed={selectedFinger === finger.id}
                className={`relative w-[28px] rounded-full transition-[border-color,background-color,box-shadow,transform] duration-150 border ${
                  selectedFinger === finger.id
                    ? "border-s-coral bg-s-coral shadow-elevation-2 scale-105"
                    : hasNote
                      ? "border-s-coral/40 bg-s-coral/10 hover:border-s-coral/60"
                      : "border-s-ink/10 bg-[--raised] hover:bg-s-ink/5:bg-white/5"
                }`}
                style={{
                  height: i === 4 ? "80px" : i === 3 ? "110px" : i === 2 ? "130px" : i === 1 ? "120px" : "90px",
                  transformOrigin: "bottom center",
                  transform: i === 4 ? "rotate(15deg) translateY(10px)" : "none"
                }}
              >
                {hasNote && selectedFinger !== finger.id && (
                  <div className="absolute -top-2 -right-2 w-3.5 h-3.5 rounded-full bg-s-coral border-2 border-[--raised]" />
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
                aria-label={finger.label}
                aria-pressed={selectedFinger === finger.id}
                className={`relative w-[28px] rounded-full transition-[border-color,background-color,box-shadow,transform] duration-150 border ${
                  selectedFinger === finger.id
                    ? "border-s-coral bg-s-coral shadow-elevation-2 scale-105"
                    : hasNote
                      ? "border-s-coral/40 bg-s-coral/10 hover:border-s-coral/60"
                      : "border-s-ink/10 bg-[--raised] hover:bg-s-ink/5:bg-white/5"
                }`}
                style={{
                  height: i === 0 ? "80px" : i === 1 ? "110px" : i === 2 ? "130px" : i === 3 ? "120px" : "90px",
                  transformOrigin: "bottom center",
                  transform: i === 0 ? "rotate(-15deg) translateY(10px)" : "none"
                }}
              >
                {hasNote && selectedFinger !== finger.id && (
                  <div className="absolute -top-2 -right-2 w-3.5 h-3.5 rounded-full bg-s-coral border-2 border-[--raised]" />
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
            className="absolute bottom-[-10px] left-0 right-0 p-4 bg-[--raised] rounded-[16px] shadow-warm-lg border border-s-ink/10"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-heading font-bold text-s-ink">
                {[...FINGERS_LEFT, ...FINGERS_RIGHT].find(f => f.id === selectedFinger)?.label}
              </span>
              <button
                onClick={() => setSelectedFinger(null)}
                aria-label={t("close")}
                className="p-1 rounded-pill text-s-ink/40 hover:text-s-ink transition-colors duration-150"
              >
                <X size={16} />
              </button>
            </div>
            <textarea
              autoFocus
              className="w-full text-sm rounded-input border border-s-ink/10 p-3 bg-s-bg-sunken focus:outline-none focus:border-s-coral focus:ring-1 focus:ring-s-coral resize-none"
              rows={2}
              placeholder={t("hand_chart_placeholder")}
              value={notes[selectedFinger] || ""}
              onChange={(e) => handleUpdateNote(e.target.value)}
              aria-label={t("hand_chart_note_label")}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-[10px] text-s-ink/40">
                {t("hand_chart_autosave")}
              </span>
              {saving && <Loader2 size={12} className="animate-spin text-s-coral" />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
