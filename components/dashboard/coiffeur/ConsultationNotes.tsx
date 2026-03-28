"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import Spinner from "@/components/ui/Spinner";

interface ConsultationNote {
  id: string;
  hair_condition: string | null;
  scalp_condition: string | null;
  current_dislikes: string | null;
  desired_outcome: string | null;
  allergies: string | null;
  notes: string | null;
  created_at: string;
}

interface ConsultationNotesProps {
  clientId: string | null;
  salonId: string;
}

export default function ConsultationNotes({ clientId, salonId }: ConsultationNotesProps) {
  const t = useTranslations("dashboardCoiffeur") as any;
  const [notesList, setNotesList] = useState<ConsultationNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [hairCondition, setHairCondition] = useState("");
  const [scalpCondition, setScalpCondition] = useState("");
  const [currentDislikes, setCurrentDislikes] = useState("");
  const [desiredOutcome, setDesiredOutcome] = useState("");
  const [allergies, setAllergies] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!clientId) return;
    setLoading(true);
    fetch(`/api/dashboard/coiffeur/consultations?client_id=${clientId}`)
      .then((r) => r.json())
      .then((d) => setNotesList(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clientId]);

  const resetForm = () => {
    setHairCondition(""); setScalpCondition(""); setCurrentDislikes("");
    setDesiredOutcome(""); setAllergies(""); setNotes("");
  };

  const handleAdd = async () => {
    if (!clientId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/coiffeur/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          hair_condition: hairCondition.trim() || undefined,
          scalp_condition: scalpCondition.trim() || undefined,
          current_dislikes: currentDislikes.trim() || undefined,
          desired_outcome: desiredOutcome.trim() || undefined,
          allergies: allergies.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      if (res.ok) {
        const { data } = await res.json();
        setNotesList((prev) => [data, ...prev]);
        setShowAdd(false);
        resetForm();
      }
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  };

  if (!clientId) {
    return (
      <div className="rounded-[12px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] p-6 bg-white dark:bg-s-dm-surface text-center">
        <ClipboardList size={20} className="mx-auto mb-2 text-s-ink/20 dark:text-s-dm-text/20" />
        <p className="text-xs text-s-ink/30 dark:text-s-dm-text/30">{t("select_client_first")}</p>
      </div>
    );
  }

  const inputClass = "w-full px-2 py-1.5 rounded-[8px] border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-bg text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20";

  return (
    <div className="rounded-[12px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] p-4 bg-white dark:bg-s-dm-surface">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-amber">
          {t("consultation_history")}
        </p>
        <button
          onClick={() => setShowAdd(!showAdd)}
          aria-label={t("add_note")}
          className="flex items-center gap-1 text-xs text-s-coral hover:text-s-coral/80 transition-colors duration-150"
        >
          <Plus size={12} /> {t("add_note")}
        </button>
      </div>

      {showAdd && (
        <div className="rounded-[12px] border border-s-coral/20 bg-s-coral/5 dark:bg-s-coral/[0.03] p-4 mb-4 space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/30 dark:text-s-dm-text/30 mb-1 block">{t("hair_condition")}</label>
              <input value={hairCondition} onChange={(e) => setHairCondition(e.target.value)} className={inputClass} aria-label={t("hair_condition")} />
            </div>
            <div>
              <label className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/30 dark:text-s-dm-text/30 mb-1 block">{t("scalp_condition")}</label>
              <input value={scalpCondition} onChange={(e) => setScalpCondition(e.target.value)} className={inputClass} aria-label={t("scalp_condition")} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/30 dark:text-s-dm-text/30 mb-1 block">{t("current_dislikes")}</label>
            <input value={currentDislikes} onChange={(e) => setCurrentDislikes(e.target.value)} className={inputClass} aria-label={t("current_dislikes")} />
          </div>
          <div>
            <label className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/30 dark:text-s-dm-text/30 mb-1 block">{t("desired_outcome")}</label>
            <input value={desiredOutcome} onChange={(e) => setDesiredOutcome(e.target.value)} className={inputClass} aria-label={t("desired_outcome")} />
          </div>
          <div>
            <label className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/30 dark:text-s-dm-text/30 mb-1 block">{t("allergies")}</label>
            <input value={allergies} onChange={(e) => setAllergies(e.target.value)} className={inputClass} aria-label={t("allergies")} />
          </div>
          <div>
            <label className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/30 dark:text-s-dm-text/30 mb-1 block">{t("notes")}</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={`${inputClass} resize-none`} aria-label={t("notes")} />
          </div>

          <div className="flex gap-2">
            <button onClick={() => { setShowAdd(false); resetForm(); }} className="px-3 py-1.5 rounded-[8px] border border-s-ink/10 dark:border-s-dm-text/10 text-xs text-s-ink/60 dark:text-s-dm-text/60" aria-label={t("cancel")}>
              {t("cancel")}
            </button>
            <button onClick={handleAdd} disabled={saving}
              className="px-3 py-1.5 rounded-[8px] bg-s-coral text-white text-[11px] font-heading font-bold uppercase tracking-[.06em] disabled:opacity-50 flex items-center gap-1 hover:brightness-[1.06] active:scale-[0.98] transition-all"
              aria-label={t("save")}
            >
              {saving && <Spinner size="sm" invert />} {t("save")}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-6"><Spinner size="md" /></div>
      ) : notesList.length === 0 ? (
        <p className="text-xs text-s-ink/30 dark:text-s-dm-text/30 text-center py-6">{t("no_notes")}</p>
      ) : (
        <div className="space-y-0">
          {notesList.map((n) => (
            <div key={n.id} className="py-3 border-b border-s-ink/[0.04] dark:border-s-dm-text/[0.04] last:border-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] data-text text-s-ink/40 dark:text-s-dm-text/40">
                  {new Date(n.created_at).toLocaleDateString("de-CH")}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {n.hair_condition && (
                  <div>
                    <span className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/30 dark:text-s-dm-text/30">{t("hair_condition")}</span>
                    <p className="text-xs text-s-ink/70 dark:text-s-dm-text/70 mt-0.5">{n.hair_condition}</p>
                  </div>
                )}
                {n.scalp_condition && (
                  <div>
                    <span className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/30 dark:text-s-dm-text/30">{t("scalp_condition")}</span>
                    <p className="text-xs text-s-ink/70 dark:text-s-dm-text/70 mt-0.5">{n.scalp_condition}</p>
                  </div>
                )}
                {n.desired_outcome && (
                  <div>
                    <span className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/30 dark:text-s-dm-text/30">{t("desired_outcome")}</span>
                    <p className="text-xs text-s-ink/70 dark:text-s-dm-text/70 mt-0.5">{n.desired_outcome}</p>
                  </div>
                )}
                {n.current_dislikes && (
                  <div>
                    <span className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/30 dark:text-s-dm-text/30">{t("current_dislikes")}</span>
                    <p className="text-xs text-s-ink/70 dark:text-s-dm-text/70 mt-0.5">{n.current_dislikes}</p>
                  </div>
                )}
                {n.allergies && (
                  <div className="col-span-2">
                    <span className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-coral/60">{t("allergies")}</span>
                    <p className="text-xs text-s-coral/80 mt-0.5">{n.allergies}</p>
                  </div>
                )}
                {n.notes && (
                  <div className="col-span-2">
                    <span className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/30 dark:text-s-dm-text/30">{t("notes")}</span>
                    <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 mt-0.5">{n.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
