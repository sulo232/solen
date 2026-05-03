"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Calendar } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import { useTranslations, useLocale } from "next-intl";

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
  const t = useTranslations("dashboard.closure_manager") as any;
  const locale = useLocale();
  const [closures, setClosures] = useState<Closure[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadClosures = () => {
    fetch(`/api/salon/closures?salon_id=${salonId}`)
      .then((r) => {
        if (!r.ok) throw new Error("fetch failed");
        return r.json();
      })
      .then((d) => setClosures(d.closures ?? d.items ?? []))
      .catch((err) => console.error("[ClosureManager] failed to load closures:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadClosures(); }, [salonId]);

  const handleAdd = async () => {
    setFormError(null);
    if (!startDate || !endDate) return;
    if (endDate < startDate) {
      setFormError(t("invalidDates"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/salon/closures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salon_id: salonId,
          start_date: startDate,
          end_date: endDate,
          reason: reason.trim(),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setFormError(d.error ?? d.message ?? t("saveError"));
        return;
      }
      setShowAdd(false);
      setStartDate("");
      setEndDate("");
      setReason("");
      loadClosures();
    } catch {
      setFormError(t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t("confirmDelete"))) return;
    setDeleteError(null);
    // Optimistic remove
    const previous = [...closures];
    setClosures((prev) => prev.filter((c) => c.id !== id));
    try {
      const res = await fetch(`/api/salon/closures?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
    } catch {
      setClosures(previous);
      setDeleteError(t("deleteError"));
    }
  };

  if (loading) return <div className="flex justify-center py-6"><Spinner size="md" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-sm text-s-ink flex items-center gap-2">
          <Calendar size={14} className="text-s-coral" /> {t("title")}
        </h3>
        <button
          onClick={() => { setShowAdd(!showAdd); setFormError(null); }}
          className="flex items-center gap-1 text-xs text-s-coral hover:text-s-coral/80 transition-colors"
        >
          <Plus size={12} /> {t("add")}
        </button>
      </div>

      {deleteError && (
        <p role="alert" className="text-xs text-s-coral mb-3">{deleteError}</p>
      )}

      {showAdd && (
        <div className="rounded-[16px] border border-s-coral/20 bg-s-coral/5 p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-s-ink/50 mb-1 block">{t("from")}</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setFormError(null); }}
                className="w-full px-2 py-1.5 rounded-input border border-s-ink/10 bg-white text-sm text-s-ink focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20"
              />
            </div>
            <div>
              <label className="text-xs text-s-ink/50 mb-1 block">{t("to")}</label>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => { setEndDate(e.target.value); setFormError(null); }}
                className="w-full px-2 py-1.5 rounded-input border border-s-ink/10 bg-white text-sm text-s-ink focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20"
              />
            </div>
          </div>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("reason_placeholder")}
            className="w-full px-3 py-2 rounded-input border border-s-ink/10 bg-white text-sm text-s-ink focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20"
          />
          {formError && <p role="alert" className="text-xs text-s-coral">{formError}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => { setShowAdd(false); setFormError(null); }}
              className="px-3 py-1.5 rounded-pill border border-s-ink/10 text-xs text-s-ink/60"
            >
              {t("cancel")}
            </button>
            <button
              onClick={handleAdd}
              disabled={!startDate || !endDate || saving}
              className="px-3 py-1.5 rounded-pill active:scale-[0.97] bg-s-coral text-white text-[11px] font-heading uppercase tracking-[.06em] disabled:opacity-50 flex items-center gap-1 shadow-elevation-2 transition-[transform,filter] duration-150"
            >
              {saving && <Spinner size="sm" invert />} {t("save")}
            </button>
          </div>
        </div>
      )}

      {closures.length === 0 ? (
        <p className="text-xs text-s-ink/30 text-center py-4">{t("empty")}</p>
      ) : (
        <div className="space-y-2">
          {closures.map((c) => {
            const dateLocale =
              locale === "de" ? "de-CH" :
              locale === "fr" ? "fr-CH" :
              locale === "it" ? "it-CH" : "en-US";
            return (
              <div
                key={c.id}
                className="flex items-center justify-between bg-white rounded-[16px] border border-s-ink/5 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-s-ink">
                    {c.reason || t("default_reason")}
                  </p>
                  <p className="text-xs text-s-ink/40">
                    {new Date(c.start_date).toLocaleDateString(dateLocale)} —{" "}
                    {new Date(c.end_date).toLocaleDateString(dateLocale)}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(c.id)}
                  aria-label={t("confirmDelete")}
                  className="p-1.5 text-s-ink/20 hover:text-s-coral transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
