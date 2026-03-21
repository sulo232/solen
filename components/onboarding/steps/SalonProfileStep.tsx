"use client";

import { useState, useEffect } from "react";
import { Store, Camera, Phone } from "lucide-react";
import Spinner from "@/components/ui/Spinner";

interface SalonProfileStepProps {
  salonId: string;
  locale: string;
  onSaved: () => void;
}

export default function SalonProfileStep({ salonId, locale, onSaved }: SalonProfileStepProps) {
  const isDE = locale === "de" || locale === "fr";
  const [form, setForm] = useState({
    name: "",
    description_de: "",
    description_en: "",
    phone: "",
    cover_photo_url: "",
  });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load existing salon data
  useEffect(() => {
    if (!salonId) return;
    fetch(`/api/salons/${salonId}`)
      .then((r) => r.json())
      .then((s) => {
        if (s?.name) {
          setForm({
            name: s.name || "",
            description_de: s.description_de || "",
            description_en: s.description_en || "",
            phone: s.phone || "",
            cover_photo_url: s.cover_photo_url || "",
          });
        }
      })
      .finally(() => setLoaded(true));
  }, [salonId]);

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      await fetch(`/api/salons/${salonId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      onSaved();
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-xl bg-s-coral/10 flex items-center justify-center">
          <Store size={22} className="text-s-coral" />
        </div>
        <div>
          <h2 className="font-heading font-bold text-xl text-s-ink">
            {isDE ? "Dein Salon" : "Your Salon"}
          </h2>
          <p className="text-sm text-s-ink/40">
            {isDE ? "Grundlegende Informationen über deinen Salon" : "Basic information about your salon"}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-card border border-s-ink/5 p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-s-ink/50 mb-1">
            {isDE ? "Salon-Name" : "Salon name"} *
          </label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={isDE ? "z.B. Hair Studio Basel" : "e.g. Hair Studio Basel"}
            className="w-full px-4 py-3 rounded-button border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-s-ink/50 mb-1">
            {isDE ? "Beschreibung" : "Description"} *
          </label>
          <textarea
            value={form.description_de}
            onChange={(e) => setForm({ ...form, description_de: e.target.value })}
            rows={3}
            maxLength={500}
            placeholder={isDE ? "Beschreibe deinen Salon für Kunden..." : "Describe your salon for customers..."}
            className="w-full px-4 py-3 rounded-button border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral resize-none transition-colors"
          />
          <p className="text-[10px] text-s-ink/30 mt-0.5 text-right">{form.description_de.length}/500</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-s-ink/50 mb-1">
            {isDE ? "Beschreibung (EN)" : "Description (EN)"}
          </label>
          <textarea
            value={form.description_en}
            onChange={(e) => setForm({ ...form, description_en: e.target.value })}
            rows={2}
            maxLength={500}
            placeholder="English description (optional)"
            className="w-full px-4 py-3 rounded-button border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral resize-none transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-s-ink/50 mb-1">
              <Phone size={12} className="inline mr-1" />
              {isDE ? "Telefon" : "Phone"}
            </label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+41 61 ..."
              className="w-full px-4 py-3 rounded-button border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-s-ink/50 mb-1">
              <Camera size={12} className="inline mr-1" />
              {isDE ? "Titelbild URL" : "Cover photo URL"}
            </label>
            <input
              value={form.cover_photo_url}
              onChange={(e) => setForm({ ...form, cover_photo_url: e.target.value })}
              placeholder="https://..."
              className="w-full px-4 py-3 rounded-button border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral transition-colors"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={!form.name || !form.description_de || saving}
        className="w-full py-3 rounded-button bg-s-coral text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-s-coral/90 transition-colors"
      >
        {saving && <Spinner size="sm" invert />}
        {isDE ? "Speichern" : "Save"}
      </button>
    </div>
  );
}
