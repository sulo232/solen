"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Sun, Pill, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";

interface SensitivityEntry {
  id: string;
  reaction_level: "none" | "mild" | "moderate" | "severe";
  affected_zones: string[];
  medications: string | null;
  sun_exposure_recent: boolean;
  aftercare_provided: string | null;
  notes: string | null;
  created_at: string;
}

const SEVERITY_STYLES: Record<string, string> = {
  none: "bg-s-success/10 text-s-success",
  mild: "bg-s-warning/10 text-s-warning",
  moderate: "bg-s-coral/10 text-s-coral",
  severe: "bg-s-error/10 text-s-error",
};

const REACTION_LEVELS = ["none", "mild", "moderate", "severe"] as const;

interface SensitivityLogProps {
  salonId: string;
  clientId: string;
}

export default function SensitivityLog({
  salonId,
  clientId,
}: SensitivityLogProps) {
  const t = useTranslations("dashboardWaxing") as any;
  const [entries, setEntries] = useState<SensitivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    reaction_level: "none" as (typeof REACTION_LEVELS)[number],
    affected_zones: "",
    medications: "",
    sun_exposure_recent: false,
    aftercare_provided: "",
    notes: "",
  });

  useEffect(() => {
    fetch(
      `/api/dashboard/waxing/sensitivity?salon_id=${salonId}&client_id=${clientId}`
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.data) setEntries(d.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [salonId, clientId]);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/waxing/sensitivity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salon_id: salonId,
          client_id: clientId,
          reaction_level: form.reaction_level,
          affected_zones: form.affected_zones
            ? form.affected_zones.split(",").map((z) => z.trim())
            : [],
          medications: form.medications || null,
          sun_exposure_recent: form.sun_exposure_recent,
          aftercare_provided: form.aftercare_provided || null,
          notes: form.notes || null,
        }),
      });
      if (res.ok) {
        const { data } = await res.json();
        if (data) setEntries((prev) => [data, ...prev]);
        setShowForm(false);
        setForm({
          reaction_level: "none",
          affected_zones: "",
          medications: "",
          sun_exposure_recent: false,
          aftercare_provided: "",
          notes: "",
        });
      }
    } catch {}
    setSaving(false);
  };

  const hasSevere = entries.some((e) => e.reaction_level === "severe");

  if (loading)
    return (
      <p className="text-sm text-s-ink/40 dark:text-s-dm-text/40 py-4">
        {t("loading")}
      </p>
    );

  return (
    <div className="w-full max-w-2xl">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-amber">
          {t("sensitivity_title")}
        </p>
        <button
          onClick={() => setShowForm(!showForm)}
          aria-label={t("add_entry")}
          className="flex items-center gap-1 px-3 py-1.5 rounded-[8px] bg-s-coral text-white text-[11px] font-heading font-bold uppercase tracking-[.06em] hover:brightness-[1.06] active:scale-[0.98] transition-all"
        >
          {showForm ? <X size={12} /> : <Plus size={12} />}
          {showForm ? t("cancel") : t("add_entry")}
        </button>
      </div>

      {/* Severe warning banner */}
      {hasSevere && (
        <div className="rounded-[8px] bg-s-error/[0.06] border border-s-error/20 p-3 mb-4">
          <p className="text-[10px] font-heading font-bold text-s-error flex items-center gap-1.5">
            <AlertTriangle size={12} />
            {t("severe_warning")}
          </p>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="rounded-[12px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] p-4 mb-4 bg-white dark:bg-s-dm-surface space-y-3">
          {/* Reaction level */}
          <div>
            <label className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/40 dark:text-s-dm-text/40 mb-1 block">
              {t("reaction_level")}
            </label>
            <div className="flex flex-wrap gap-2">
              {REACTION_LEVELS.map((level) => (
                <button
                  key={level}
                  onClick={() => setForm({ ...form, reaction_level: level })}
                  aria-label={t(`severity.${level}`)}
                  className={`rounded-[12px] border px-3 py-1.5 text-[10px] font-heading font-semibold transition-colors duration-150 ${
                    form.reaction_level === level
                      ? "border-s-coral bg-s-coral/[0.06] text-s-coral"
                      : "border-s-ink/[0.06] dark:border-s-dm-text/[0.06] text-s-ink/50 dark:text-s-dm-text/50"
                  }`}
                >
                  {t(`severity.${level}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Affected zones */}
          <div>
            <label className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/40 dark:text-s-dm-text/40 mb-1 block">
              {t("affected_zones")}
            </label>
            <input
              value={form.affected_zones}
              onChange={(e) =>
                setForm({ ...form, affected_zones: e.target.value })
              }
              placeholder={t("affected_zones_placeholder")}
              aria-label={t("affected_zones")}
              className="w-full px-3 py-2 rounded-[8px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] bg-transparent text-sm text-s-ink dark:text-s-dm-text"
            />
          </div>

          {/* Medications */}
          <div>
            <label className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/40 dark:text-s-dm-text/40 mb-1 block">
              <Pill size={10} className="inline mr-1" />
              {t("medications")}
            </label>
            <input
              value={form.medications}
              onChange={(e) =>
                setForm({ ...form, medications: e.target.value })
              }
              placeholder={t("medications_placeholder")}
              aria-label={t("medications")}
              className="w-full px-3 py-2 rounded-[8px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] bg-transparent text-sm text-s-ink dark:text-s-dm-text"
            />
          </div>

          {/* Sun exposure */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.sun_exposure_recent}
              onChange={(e) =>
                setForm({ ...form, sun_exposure_recent: e.target.checked })
              }
              className="accent-s-coral"
            />
            <Sun size={12} className="text-s-amber" />
            <span className="text-xs text-s-ink dark:text-s-dm-text">
              {t("sun_exposure")}
            </span>
          </label>

          {/* Aftercare */}
          <div>
            <label className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/40 dark:text-s-dm-text/40 mb-1 block">
              {t("aftercare")}
            </label>
            <input
              value={form.aftercare_provided}
              onChange={(e) =>
                setForm({ ...form, aftercare_provided: e.target.value })
              }
              placeholder={t("aftercare_placeholder")}
              aria-label={t("aftercare")}
              className="w-full px-3 py-2 rounded-[8px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] bg-transparent text-sm text-s-ink dark:text-s-dm-text"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/40 dark:text-s-dm-text/40 mb-1 block">
              {t("notes")}
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              aria-label={t("notes")}
              className="w-full px-3 py-2 rounded-[8px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] bg-transparent text-sm text-s-ink dark:text-s-dm-text resize-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={saving}
              aria-label={t("save")}
              className="px-4 py-1.5 rounded-[8px] bg-s-coral text-white text-[11px] font-heading font-bold uppercase tracking-[.06em] hover:brightness-[1.06] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {saving ? t("saving") : t("save")}
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      {entries.length === 0 ? (
        <p className="text-xs text-s-ink/30 dark:text-s-dm-text/30 text-center py-6">
          {t("no_entries")}
        </p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-[12px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] p-3 bg-white dark:bg-s-dm-surface"
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-[10px] font-heading font-bold uppercase tracking-[.10em] px-2 py-0.5 rounded-[6px] ${SEVERITY_STYLES[entry.reaction_level]}`}
                >
                  {t(`severity.${entry.reaction_level}`)}
                </span>
                <span className="text-[10px] text-s-ink/30 dark:text-s-dm-text/30">
                  {new Date(entry.created_at).toLocaleDateString()}
                </span>
              </div>

              {entry.affected_zones && entry.affected_zones.length > 0 && (
                <p className="text-xs text-s-ink/60 dark:text-s-dm-text/60 mb-1">
                  {entry.affected_zones.join(", ")}
                </p>
              )}

              {entry.medications && (
                <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 flex items-center gap-1 mb-1">
                  <Pill size={10} /> {entry.medications}
                </p>
              )}

              {entry.sun_exposure_recent && (
                <p className="text-xs text-s-amber flex items-center gap-1 mb-1">
                  <Sun size={10} /> {t("sun_exposure_flag")}
                </p>
              )}

              {entry.notes && (
                <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mt-1">
                  {entry.notes}
                </p>
              )}

              {entry.reaction_level === "severe" && (
                <div className="rounded-[8px] bg-s-error/[0.06] border border-s-error/20 p-2 mt-2">
                  <p className="text-[10px] font-heading font-bold text-s-error">
                    {t("severe_warning")}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
