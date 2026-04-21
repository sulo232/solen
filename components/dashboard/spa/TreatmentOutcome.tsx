"use client";

import { useEffect, useState } from "react";
import { Star, Save, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

interface TreatmentOutcomeProps {
  salonId: string;
  clientId: string;
  bookingId?: string | null;
}

interface OutcomeForm {
  satisfaction_rating: number;
  skin_before: string;
  skin_after: string;
  products_used: string;
  follow_up_notes: string;
  next_visit_date: string;
}

const EMPTY: OutcomeForm = {
  satisfaction_rating: 0,
  skin_before: "",
  skin_after: "",
  products_used: "",
  follow_up_notes: "",
  next_visit_date: "",
};

interface SavedOutcome extends OutcomeForm {
  id: string;
  created_at: string;
}

export default function TreatmentOutcome({ salonId, clientId, bookingId }: TreatmentOutcomeProps) {
  const t = useTranslations("dashboardSpa") as any;
  const [outcomes, setOutcomes] = useState<SavedOutcome[]>([]);
  const [form, setForm] = useState<OutcomeForm>(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch(`/api/dashboard/spa/treatment-outcomes?salon_id=${salonId}&client_id=${clientId}`);
        if (!r.ok || cancelled) return;
        const d = await r.json();
        if (!cancelled && d?.outcomes) setOutcomes(d.outcomes);
      } catch {}
    };
    load();
    return () => { cancelled = true; };
  }, [salonId, clientId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/spa/treatment-outcomes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salon_id: salonId,
          client_id: clientId,
          booking_id: bookingId ?? null,
          ...form,
          products_used: form.products_used.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });
      if (res.ok) {
        const { outcome } = await res.json();
        setOutcomes((prev) => [outcome, ...prev]);
        setForm(EMPTY);
        setShowForm(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const StarRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} onClick={() => onChange(star)} aria-label={`${star} star`}
          className={`transition-colors ${star <= value ? "text-s-amber" : "text-s-ink/20 dark:text-s-dm-text/20"}`}>
          <Star size={18} fill={star <= value ? "currentColor" : "none"} />
        </button>
      ))}
    </div>
  );

  const inputCls = "w-full px-3 py-2 rounded-[8px] border border-s-ink/10 dark:border-s-dm-text/10 bg-transparent text-xs text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral";

  return (
    <div className="bg-[--raised] dark:bg-s-dm-surface rounded-[12px] border border-s-ink/[0.06] dark:border-white/[0.06] p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-blue">
          {t("outcomeTitle")}
        </p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 text-xs text-s-coral hover:text-s-coral/80 transition-colors duration-150"
          aria-label={t("outcomeAdd")}
        >
          <Plus size={12} /> {t("outcomeAdd")}
        </button>
      </div>

      {showForm && (
        <div className="space-y-3 mb-4 p-3 rounded-[8px] border border-s-blue/20 bg-s-blue/[0.03]">
          <div>
            <p className="text-[10px] font-heading font-bold text-s-ink/40 dark:text-s-dm-text/40 mb-1">{t("outcomeSatisfaction")}</p>
            <StarRating value={form.satisfaction_rating} onChange={(v) => setForm((p) => ({ ...p, satisfaction_rating: v }))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40 mb-1 block">{t("outcomeSkinBefore")}</label>
              <textarea rows={2} value={form.skin_before} onChange={(e) => setForm((p) => ({ ...p, skin_before: e.target.value }))}
                className={`${inputCls} resize-none`} aria-label={t("outcomeSkinBefore")} />
            </div>
            <div>
              <label className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40 mb-1 block">{t("outcomeSkinAfter")}</label>
              <textarea rows={2} value={form.skin_after} onChange={(e) => setForm((p) => ({ ...p, skin_after: e.target.value }))}
                className={`${inputCls} resize-none`} aria-label={t("outcomeSkinAfter")} />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40 mb-1 block">{t("outcomeProducts")}</label>
            <input value={form.products_used} onChange={(e) => setForm((p) => ({ ...p, products_used: e.target.value }))}
              placeholder={t("outcomeProductsPlaceholder")} className={inputCls} aria-label={t("outcomeProducts")} />
          </div>
          <div>
            <label className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40 mb-1 block">{t("outcomeNotes")}</label>
            <textarea rows={2} value={form.follow_up_notes} onChange={(e) => setForm((p) => ({ ...p, follow_up_notes: e.target.value }))}
              className={`${inputCls} resize-none`} aria-label={t("outcomeNotes")} />
          </div>
          <div>
            <label className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40 mb-1 block">{t("outcomeNextVisit")}</label>
            <input type="date" value={form.next_visit_date} onChange={(e) => setForm((p) => ({ ...p, next_visit_date: e.target.value }))}
              className={inputCls} aria-label={t("outcomeNextVisit")} />
          </div>
          <button onClick={handleSave} disabled={saving || form.satisfaction_rating === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-pill bg-s-coral text-white text-xs font-heading font-bold hover:brightness-[1.06] active:scale-[0.97] transition-[transform,filter] duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-coral-glow"
            aria-label={t("outcomeSave")}>
            <Save size={12} /> {saving ? t("saving") : t("outcomeSave")}
          </button>
        </div>
      )}

      {outcomes.length === 0 ? (
        <p className="text-xs text-s-ink/30 dark:text-s-dm-text/30 text-center py-4">{t("outcomeEmpty")}</p>
      ) : (
        <div className="space-y-3">
          {outcomes.map((o) => (
            <div key={o.id} className="border-b border-s-ink/[0.05] dark:border-s-dm-text/[0.05] pb-3 last:border-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={11} className={s <= o.satisfaction_rating ? "text-s-amber" : "text-s-ink/15"} fill={s <= o.satisfaction_rating ? "currentColor" : "none"} />
                  ))}
                </div>
                <span className="text-[10px] text-s-ink/35 dark:text-s-dm-text/35 data-text">
                  {new Date(o.created_at).toLocaleDateString("de-CH")}
                </span>
              </div>
              {o.follow_up_notes && <p className="text-[11px] text-s-ink/55 dark:text-s-dm-text/55 line-clamp-2">{o.follow_up_notes}</p>}
              {o.next_visit_date && (
                <p className="text-[10px] text-s-blue mt-0.5">{t("outcomeNextVisit")}: {o.next_visit_date}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
