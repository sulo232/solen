"use client";

import { useState, useEffect } from "react";
import { Save, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { NailShape, NailLength, NailMaterial, NailAllergySeverity } from "@/lib/types";

interface NailPreferencesFormProps {
  customerId: string;
}

export default function NailPreferencesForm({ customerId }: NailPreferencesFormProps) {
  const t = useTranslations("nail_dashboard") as any;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shape, setShape] = useState<NailShape | "">("");
  const [length, setLength] = useState<NailLength | "">("");
  const [material, setMaterial] = useState<NailMaterial | "">("");
  const [preferredBrand, setPreferredBrand] = useState("");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [allergySeverity, setAllergySeverity] = useState<NailAllergySeverity>("mild");
  const [allergyNotes, setAllergyNotes] = useState("");
  const [newAllergy, setNewAllergy] = useState("");

  useEffect(() => {
    fetch(`/api/clients/${customerId}/nail-preferences`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.preferences) {
          const p = d.preferences;
          setShape(p.preferred_shape || "");
          setLength(p.preferred_length || "");
          setMaterial(p.preferred_material || "");
          setPreferredBrand(p.preferred_brand || "");
          setAllergies(p.allergies || []);
          setAllergySeverity(p.allergy_severity || "mild");
          setAllergyNotes(p.allergy_notes || "");
        }
      })
      .catch((err) => console.error("[NailPreferencesForm] failed to load nail preferences:", err))
      .finally(() => setLoading(false));
  }, [customerId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/clients/${customerId}/nail-preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferred_shape: shape || null,
          preferred_length: length || null,
          preferred_material: material || null,
          preferred_brand: preferredBrand || null,
          allergies,
          allergy_severity: allergySeverity,
          allergy_notes: allergyNotes || null,
        }),
      });
    } finally {
      setSaving(false);
    }
  };

  const addAllergy = () => {
    if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
      setAllergies([...allergies, newAllergy.trim()]);
      setNewAllergy("");
    }
  };

  if (loading) return <p className="text-sm text-s-ink/40 py-4">{t("loading")}</p>;

  return (
    <div className="space-y-4 max-w-md">
      {/* Shape */}
      <label className="block">
        <span className="text-sm font-medium text-s-ink">{t("prefs_shape")}</span>
        <select
          value={shape}
          onChange={(e) => setShape(e.target.value as NailShape)}
          className="mt-1 w-full px-3 py-2 rounded-input border border-s-ink/10 bg-white text-sm text-s-ink"
        >
          <option value="">{t("prefs_no_preference")}</option>
          <option value="round">{t("prefs_shape_round")}</option>
          <option value="square">{t("prefs_shape_square")}</option>
          <option value="oval">{t("prefs_shape_oval")}</option>
          <option value="almond">{t("prefs_shape_almond")}</option>
          <option value="coffin">{t("prefs_shape_coffin")}</option>
          <option value="stiletto">{t("prefs_shape_stiletto")}</option>
          <option value="squoval">{t("prefs_shape_squoval")}</option>
          <option value="ballerina">{t("prefs_shape_ballerina")}</option>
        </select>
      </label>

      {/* Length */}
      <label className="block">
        <span className="text-sm font-medium text-s-ink">{t("prefs_length")}</span>
        <select
          value={length}
          onChange={(e) => setLength(e.target.value as NailLength)}
          className="mt-1 w-full px-3 py-2 rounded-input border border-s-ink/10 bg-white text-sm text-s-ink"
        >
          <option value="">{t("prefs_no_preference")}</option>
          <option value="natural">{t("prefs_length_natural")}</option>
          <option value="short">{t("prefs_length_short")}</option>
          <option value="medium">{t("prefs_length_medium")}</option>
          <option value="long">{t("prefs_length_long")}</option>
          <option value="extra_long">{t("prefs_length_extra_long")}</option>
        </select>
      </label>

      {/* Material */}
      <label className="block">
        <span className="text-sm font-medium text-s-ink">{t("prefs_material")}</span>
        <select
          value={material}
          onChange={(e) => setMaterial(e.target.value as NailMaterial)}
          className="mt-1 w-full px-3 py-2 rounded-input border border-s-ink/10 bg-white text-sm text-s-ink"
        >
          <option value="">{t("prefs_no_preference")}</option>
          <option value="gel">{t("prefs_mat_gel")}</option>
          <option value="acrylic">{t("prefs_mat_acrylic")}</option>
          <option value="dip_powder">{t("prefs_mat_dip_powder")}</option>
          <option value="polygel">{t("prefs_mat_polygel")}</option>
          <option value="shellac">{t("prefs_mat_shellac")}</option>
        </select>
      </label>

      {/* Brand */}
      <label className="block">
        <span className="text-sm font-medium text-s-ink">{t("prefs_brand")}</span>
        <input
          value={preferredBrand}
          onChange={(e) => setPreferredBrand(e.target.value)}
          placeholder={t("prefs_brand_placeholder")}
          className="mt-1 w-full px-3 py-2 rounded-input border border-s-ink/10 bg-white text-sm text-s-ink"
        />
      </label>

      {/* Allergies */}
      <div>
        <span className="text-sm font-medium text-s-ink flex items-center gap-1">
          <AlertTriangle size={14} className="text-s-error" />
          {t("prefs_allergies")}
        </span>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {allergies.map((a) => (
            <span key={a} className="flex items-center gap-1 text-xs px-2 py-1 rounded-pill bg-s-error-bg text-s-error border border-s-error/20">
              {a}
              <button onClick={() => setAllergies(allergies.filter((x) => x !== a))} className="text-s-error/60 hover:text-s-error">&times;</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <input
            value={newAllergy}
            onChange={(e) => setNewAllergy(e.target.value)}
            placeholder={t("prefs_allergy_placeholder")}
            className="flex-1 px-3 py-1.5 rounded-input border border-s-ink/10 bg-white text-sm"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAllergy())}
          />
          <button onClick={addAllergy} className="text-xs px-3 py-1.5 rounded-btn bg-s-error-bg text-s-error border border-s-error/20">
            {t("add")}
          </button>
        </div>

        {allergies.length > 0 && (
          <div className="mt-2 space-y-2">
            <select
              value={allergySeverity}
              onChange={(e) => setAllergySeverity(e.target.value as NailAllergySeverity)}
              className="w-full px-3 py-1.5 rounded-input border border-s-ink/10 bg-white text-sm"
            >
              <option value="mild">{t("prefs_severity_mild")}</option>
              <option value="moderate">{t("prefs_severity_moderate")}</option>
              <option value="severe">{t("prefs_severity_severe")}</option>
            </select>
            <textarea
              value={allergyNotes}
              onChange={(e) => setAllergyNotes(e.target.value)}
              placeholder={t("prefs_allergy_notes_placeholder")}
              rows={2}
              className="w-full px-3 py-1.5 rounded-input border border-s-ink/10 bg-white text-sm resize-none"
            />
          </div>
        )}
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 rounded-pill active:scale-[0.97] bg-s-coral text-white text-[11px] font-heading font-bold uppercase tracking-[.06em] hover:brightness-[1.06] shadow-elevation-2 transition-[transform,filter] duration-150 disabled:opacity-50"
      >
        <Save size={14} />
        {saving ? t("saving") : t("prefs_save")}
      </button>
    </div>
  );
}
