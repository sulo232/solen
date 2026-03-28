"use client";

import { useState, useEffect } from "react";
import { BookHeart, Plus, Save, X } from "lucide-react";
import { useTranslations } from "next-intl";
import BodyDiagram from "@/components/shared/BodyDiagram";

interface JournalEntry {
  id: string;
  tension_areas: string[];
  pain_level: number;
  skin_condition: string | null;
  pressure_preference: string | null;
  products_used: string[];
  aftercare_notes: string | null;
  notes: string | null;
  created_at: string;
}

const TENSION_OPTIONS = [
  "neck", "shoulders", "upper_back", "lower_back",
  "legs", "feet", "arms", "head", "hips",
];

const PRESSURE_OPTIONS = ["light", "medium", "firm", "deep"] as const;

export default function WellnessJournal({ salonId, clientId }: { salonId: string; clientId: string }) {
  const t = useTranslations("dashboardSpa") as any;
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    tension_areas: [] as string[],
    pain_level: 5,
    skin_condition: "",
    pressure_preference: "medium",
    products_used: [] as string[],
    aftercare_notes: "",
    notes: "",
    product_input: "",
  });
  const [visualMode, setVisualMode] = useState(false);

  useEffect(() => {
    if (!clientId) return;
    fetch(`/api/dashboard/spa/wellness-journal?client_id=${clientId}`)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d) => setEntries(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [salonId, clientId]);

  const resetForm = () => {
    setForm({ tension_areas: [], pain_level: 5, skin_condition: "", pressure_preference: "medium", products_used: [], aftercare_notes: "", notes: "", product_input: "" });
    setShowForm(false);
  };

  const toggleTension = (area: string) => {
    setForm((prev) => ({
      ...prev,
      tension_areas: prev.tension_areas.includes(area)
        ? prev.tension_areas.filter((a) => a !== area)
        : [...prev.tension_areas, area],
    }));
  };

  const addProduct = () => {
    const trimmed = form.product_input.trim();
    if (trimmed && !form.products_used.includes(trimmed)) {
      setForm((prev) => ({ ...prev, products_used: [...prev.products_used, trimmed], product_input: "" }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { product_input, ...rest } = form;
      const res = await fetch("/api/dashboard/spa/wellness-journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...rest, client_id: clientId }),
      });
      if (res.ok) {
        const { data } = await res.json();
        setEntries((prev) => [data, ...prev]);
        resetForm();
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-s-ink/40 dark:text-s-dm-text/40 py-4">{t("loading")}</p>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookHeart size={16} className="text-s-coral" />
          <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-amber">
            {t("wellness_journal")}
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            aria-label={t("add_entry")}
            className="flex items-center gap-1 text-xs text-s-coral hover:text-s-coral/80 transition-colors duration-150"
          >
            <Plus size={14} /> {t("add_entry")}
          </button>
        )}
      </div>

      {/* Add Entry Form */}
      {showForm && (
        <div className="rounded-[12px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] p-4 bg-white dark:bg-s-dm-surface space-y-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-heading font-semibold text-s-ink dark:text-s-dm-text">{t("new_entry")}</p>
            <button onClick={resetForm} aria-label={t("cancel")} className="text-s-ink/30 dark:text-s-dm-text/30 hover:text-s-ink dark:hover:text-s-dm-text transition-colors">
              <X size={14} />
            </button>
          </div>

          {/* Pain Level */}
          <div>
            <label className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/50 dark:text-s-dm-text/50 block mb-1">
              {t("pain")} ({form.pain_level}/10)
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={form.pain_level}
              onChange={(e) => setForm((p) => ({ ...p, pain_level: parseInt(e.target.value) }))}
              aria-label={t("pain")}
              className="w-full accent-s-coral"
            />
          </div>

          {/* Tension Areas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/50 dark:text-s-dm-text/50 block">
                {t("tension_areas")}
              </label>
              <button
                onClick={() => setVisualMode(!visualMode)}
                className={`rounded-[8px] border px-3 py-1.5 text-[10px] font-heading font-semibold transition-colors duration-150 ${
                  visualMode
                    ? "border-s-coral bg-s-coral/[0.06] text-s-coral"
                    : "border-s-ink/[0.06] dark:border-s-dm-text/[0.06] text-s-ink/40 dark:text-s-dm-text/40"
                }`}
                aria-label={t(visualMode ? "text_mode" : "visual_mode")}
              >
                {t(visualMode ? "text_mode" : "visual_mode")}
              </button>
            </div>

            {/* Visual Mode: Body Diagram for tension marking */}
            {visualMode && (
              <div className="mb-3">
                <BodyDiagram
                  selectedZones={form.tension_areas}
                  onZoneSelect={(zoneId, sel) => {
                    setForm((prev) => ({
                      ...prev,
                      tension_areas: sel
                        ? [...prev.tension_areas, zoneId]
                        : prev.tension_areas.filter((a) => a !== zoneId),
                    }));
                  }}
                  mode="spa"
                />
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {TENSION_OPTIONS.map((area) => (
                <button
                  key={area}
                  onClick={() => toggleTension(area)}
                  className={`px-2.5 py-1 rounded-[8px] text-[10px] font-heading font-bold uppercase tracking-[.06em] transition-colors duration-150 ${
                    form.tension_areas.includes(area)
                      ? "bg-s-coral text-white"
                      : "bg-s-ink/[0.05] dark:bg-s-dm-text/[0.05] text-s-ink/55 dark:text-s-dm-text/55 hover:bg-s-ink/[0.09] dark:hover:bg-s-dm-text/[0.09]"
                  }`}
                >
                  {t(`tension_area.${area}` as any)}
                </button>
              ))}
            </div>
          </div>

          {/* Pressure Preference */}
          <div>
            <label className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/50 dark:text-s-dm-text/50 block mb-1">
              {t("pressure_preference")}
            </label>
            <select
              value={form.pressure_preference}
              onChange={(e) => setForm((p) => ({ ...p, pressure_preference: e.target.value }))}
              aria-label={t("pressure_preference")}
              className="w-full rounded-[8px] border border-s-ink/[0.10] dark:border-s-dm-text/[0.10] px-3 py-2 text-xs bg-transparent text-s-ink dark:text-s-dm-text focus:outline-none focus:ring-2 focus:ring-s-coral/30"
            >
              {PRESSURE_OPTIONS.map((p) => (
                <option key={p} value={p}>{t(`pressure.${p}` as any)}</option>
              ))}
            </select>
          </div>

          {/* Skin Condition */}
          <div>
            <label className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/50 dark:text-s-dm-text/50 block mb-1">
              {t("skin_condition")}
            </label>
            <input
              value={form.skin_condition}
              onChange={(e) => setForm((p) => ({ ...p, skin_condition: e.target.value }))}
              aria-label={t("skin_condition")}
              className="w-full rounded-[8px] border border-s-ink/[0.10] dark:border-s-dm-text/[0.10] px-3 py-2 text-xs bg-transparent text-s-ink dark:text-s-dm-text focus:outline-none focus:ring-2 focus:ring-s-coral/30"
            />
          </div>

          {/* Products Used */}
          <div>
            <label className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/50 dark:text-s-dm-text/50 block mb-1">
              {t("products_used")}
            </label>
            <div className="flex gap-2">
              <input
                value={form.product_input}
                onChange={(e) => setForm((p) => ({ ...p, product_input: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addProduct())}
                placeholder={t("product_placeholder")}
                aria-label={t("products_used")}
                className="flex-1 rounded-[8px] border border-s-ink/[0.10] dark:border-s-dm-text/[0.10] px-3 py-2 text-xs bg-transparent text-s-ink dark:text-s-dm-text focus:outline-none focus:ring-2 focus:ring-s-coral/30"
              />
              <button
                onClick={addProduct}
                className="px-2 py-1 rounded-[8px] bg-s-ink/[0.05] dark:bg-s-dm-text/[0.05] text-s-ink/55 dark:text-s-dm-text/55 hover:bg-s-ink/[0.09] dark:hover:bg-s-dm-text/[0.09] transition-colors duration-150"
              >
                <Plus size={14} />
              </button>
            </div>
            {form.products_used.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.products_used.map((p) => (
                  <span key={p} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px] bg-s-sage-subtle dark:bg-s-sage/10 text-[10px] text-s-sage-text dark:text-s-sage">
                    {p}
                    <button onClick={() => setForm((prev) => ({ ...prev, products_used: prev.products_used.filter((x) => x !== p) }))} className="text-s-sage-text/50 hover:text-s-sage-text">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Aftercare Notes */}
          <div>
            <label className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/50 dark:text-s-dm-text/50 block mb-1">
              {t("aftercare_notes")}
            </label>
            <textarea
              value={form.aftercare_notes}
              onChange={(e) => setForm((p) => ({ ...p, aftercare_notes: e.target.value }))}
              rows={2}
              aria-label={t("aftercare_notes")}
              className="w-full rounded-[8px] border border-s-ink/[0.10] dark:border-s-dm-text/[0.10] px-3 py-2 text-xs bg-transparent text-s-ink dark:text-s-dm-text resize-none focus:outline-none focus:ring-2 focus:ring-s-coral/30"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/50 dark:text-s-dm-text/50 block mb-1">
              {t("notes")}
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              rows={2}
              aria-label={t("notes")}
              className="w-full rounded-[8px] border border-s-ink/[0.10] dark:border-s-dm-text/[0.10] px-3 py-2 text-xs bg-transparent text-s-ink dark:text-s-dm-text resize-none focus:outline-none focus:ring-2 focus:ring-s-coral/30"
            />
          </div>

          {/* Save / Cancel */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={resetForm}
              className="px-3 py-1.5 rounded-[8px] border border-s-ink/10 dark:border-s-dm-text/10 text-xs text-s-ink/60 dark:text-s-dm-text/60 transition-colors duration-150"
            >
              {t("cancel")}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              aria-label={t("save")}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-[8px] bg-s-coral text-white text-[11px] font-heading font-bold uppercase tracking-[.06em] hover:brightness-[1.06] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <Save size={12} />
              {saving ? t("saving") : t("save")}
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      {entries.length === 0 && !showForm ? (
        <div className="rounded-[12px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] border-dashed p-6 text-center bg-white dark:bg-s-dm-surface">
          <BookHeart size={20} className="mx-auto mb-2 text-s-ink/20 dark:text-s-dm-text/20" />
          <p className="text-xs text-s-ink/30 dark:text-s-dm-text/30">{t("no_entries")}</p>
        </div>
      ) : (
        <div className="rounded-[12px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] bg-white dark:bg-s-dm-surface overflow-hidden">
          {entries.map((e, i) => (
            <div
              key={e.id}
              className={`px-4 py-3 ${i < entries.length - 1 ? "border-b border-s-ink/[0.04] dark:border-s-dm-text/[0.04]" : ""}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-heading font-semibold text-s-ink dark:text-s-dm-text">
                  {new Date(e.created_at).toLocaleDateString("de-CH")}
                </span>
                {e.pressure_preference && (
                  <span className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40">
                    {t(`pressure.${e.pressure_preference}` as any)}
                  </span>
                )}
              </div>

              {/* Pain bar */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/30 dark:text-s-dm-text/30 w-16 shrink-0">
                  {t("pain")}
                </span>
                <div className="flex-1 h-2 rounded-full bg-s-ink/[0.06] dark:bg-s-dm-text/[0.06] overflow-hidden">
                  <div
                    className="h-full bg-s-coral rounded-full"
                    style={{ width: `${((e.pain_level ?? 0) / 10) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] data-text font-bold text-s-ink/50 dark:text-s-dm-text/50 w-6 text-right">
                  {e.pain_level ?? 0}
                </span>
              </div>

              {/* Tension areas */}
              {e.tension_areas?.length > 0 && (
                <p className="text-[10px] text-s-ink/50 dark:text-s-dm-text/50 mt-1">
                  {t("tension")}: {e.tension_areas.map((a) => t(`tension_area.${a}`)).join(", ")}
                </p>
              )}

              {/* Products */}
              {e.products_used?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {e.products_used.map((p) => (
                    <span key={p} className="px-1.5 py-0.5 rounded-[6px] bg-s-sage-subtle dark:bg-s-sage/10 text-[9px] text-s-sage-text dark:text-s-sage">
                      {p}
                    </span>
                  ))}
                </div>
              )}

              {/* Aftercare */}
              {e.aftercare_notes && (
                <p className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40 mt-1.5 italic">
                  {t("aftercare")}: {e.aftercare_notes}
                </p>
              )}

              {/* Notes */}
              {e.notes && (
                <p className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40 mt-1">
                  {e.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
