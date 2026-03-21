"use client";

import { useState, useEffect } from "react";
import { Save, AlertTriangle } from "lucide-react";
import type { NailShape, NailLength, NailMaterial, NailAllergySeverity } from "@/lib/types";

interface NailPreferencesFormProps {
  customerId: string;
}

export default function NailPreferencesForm({ customerId }: NailPreferencesFormProps) {
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
      .catch(() => {})
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

  if (loading) return <p className="text-sm text-s-ink/40 dark:text-s-dm-text/40 py-4">Laden...</p>;

  return (
    <div className="space-y-4 max-w-md">
      {/* Shape */}
      <label className="block">
        <span className="text-sm font-medium text-s-ink dark:text-s-dm-text">Bevorzugte Form</span>
        <select
          value={shape}
          onChange={(e) => setShape(e.target.value as NailShape)}
          className="mt-1 w-full px-3 py-2 rounded-button border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface text-sm text-s-ink dark:text-s-dm-text"
        >
          <option value="">Keine Präferenz</option>
          <option value="round">Rund</option>
          <option value="square">Square</option>
          <option value="oval">Oval</option>
          <option value="almond">Mandel</option>
          <option value="coffin">Coffin</option>
          <option value="stiletto">Stiletto</option>
          <option value="squoval">Squoval</option>
          <option value="ballerina">Ballerina</option>
        </select>
      </label>

      {/* Length */}
      <label className="block">
        <span className="text-sm font-medium text-s-ink dark:text-s-dm-text">Bevorzugte Länge</span>
        <select
          value={length}
          onChange={(e) => setLength(e.target.value as NailLength)}
          className="mt-1 w-full px-3 py-2 rounded-button border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface text-sm text-s-ink dark:text-s-dm-text"
        >
          <option value="">Keine Präferenz</option>
          <option value="natural">Natürlich</option>
          <option value="short">Kurz</option>
          <option value="medium">Mittel</option>
          <option value="long">Lang</option>
          <option value="extra_long">Extra Lang</option>
        </select>
      </label>

      {/* Material */}
      <label className="block">
        <span className="text-sm font-medium text-s-ink dark:text-s-dm-text">Bevorzugtes Material</span>
        <select
          value={material}
          onChange={(e) => setMaterial(e.target.value as NailMaterial)}
          className="mt-1 w-full px-3 py-2 rounded-button border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface text-sm text-s-ink dark:text-s-dm-text"
        >
          <option value="">Keine Präferenz</option>
          <option value="gel">Gel</option>
          <option value="acrylic">Acryl</option>
          <option value="dip_powder">Dip Powder</option>
          <option value="polygel">Polygel</option>
          <option value="shellac">Shellac</option>
        </select>
      </label>

      {/* Brand */}
      <label className="block">
        <span className="text-sm font-medium text-s-ink dark:text-s-dm-text">Lieblingsmarke</span>
        <input
          value={preferredBrand}
          onChange={(e) => setPreferredBrand(e.target.value)}
          placeholder="z.B. OPI, Essie, CND..."
          className="mt-1 w-full px-3 py-2 rounded-button border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface text-sm text-s-ink dark:text-s-dm-text"
        />
      </label>

      {/* Allergies */}
      <div>
        <span className="text-sm font-medium text-s-ink dark:text-s-dm-text flex items-center gap-1">
          <AlertTriangle size={14} className="text-red-500" />
          Allergien
        </span>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {allergies.map((a) => (
            <span key={a} className="flex items-center gap-1 text-xs px-2 py-1 rounded-pill bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20">
              {a}
              <button onClick={() => setAllergies(allergies.filter((x) => x !== a))} className="text-red-400 hover:text-red-600">&times;</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <input
            value={newAllergy}
            onChange={(e) => setNewAllergy(e.target.value)}
            placeholder="z.B. Methacrylat"
            className="flex-1 px-3 py-1.5 rounded-button border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface text-sm"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAllergy())}
          />
          <button onClick={addAllergy} className="text-xs px-3 py-1.5 rounded-button bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20">
            Hinzufügen
          </button>
        </div>

        {allergies.length > 0 && (
          <div className="mt-2 space-y-2">
            <select
              value={allergySeverity}
              onChange={(e) => setAllergySeverity(e.target.value as NailAllergySeverity)}
              className="w-full px-3 py-1.5 rounded-button border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface text-sm"
            >
              <option value="mild">Mild</option>
              <option value="moderate">Moderat</option>
              <option value="severe">Schwer</option>
            </select>
            <textarea
              value={allergyNotes}
              onChange={(e) => setAllergyNotes(e.target.value)}
              placeholder="Zusätzliche Notizen..."
              rows={2}
              className="w-full px-3 py-1.5 rounded-button border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface text-sm resize-none"
            />
          </div>
        )}
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 rounded-button bg-s-coral text-white text-sm font-medium hover:bg-s-coral-hover transition-colors disabled:opacity-50"
      >
        <Save size={14} />
        {saving ? "Speichern..." : "Präferenzen speichern"}
      </button>
    </div>
  );
}
