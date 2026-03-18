"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Plus, Trash2, ChevronRight, ChevronLeft, PartyPopper, Clock, Pencil, Loader2 } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import { slideSwitch } from "@/lib/animations";
import { serviceTemplates, DURATION_OPTIONS } from "@/lib/service-templates";
import type { ServiceTemplate } from "@/lib/service-templates";
import ImageUploader from "@/components/ui/ImageUploader";
import { validateStep, step1Schema, step2Schema, step3Schema, step4Schema } from "@/lib/registration-validation";
import type { SalonCategory, AgeGroup, Gender } from "@/lib/types";
import { createBrowserSupabaseClient } from "@/lib/supabase";

// ─────────────────────────────────────────
// Constants
// ─────────────────────────────────────────

const CATEGORIES: { value: SalonCategory; label: string }[] = [
  { value: "coiffeur",    label: "Coiffeur" },
  { value: "barbershop",  label: "Barbershop" },
  { value: "nails",       label: "Nails" },
  { value: "spa",         label: "Spa / Massage" },
  { value: "makeup",      label: "Make-up / Kosmetik" },
  { value: "waxing",      label: "Waxing / Sugaring" },
];

const QUARTIERE = [
  { value: "grossbasel", label: "Grossbasel" },
  { value: "kleinbasel", label: "Kleinbasel" },
  { value: "gundeli",    label: "Gundeli" },
  { value: "st_johann",  label: "St. Johann" },
  { value: "iselin",     label: "Iselin" },
  { value: "bruderholz", label: "Bruderholz" },
  { value: "breite",     label: "Breite" },
];

const DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const TOTAL_STEPS = 6;

// ─────────────────────────────────────────
// Step wrappers
// ─────────────────────────────────────────

function StepContainer({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/60 shadow-glass p-6 sm:p-8">
        <h2 className="font-heading font-bold text-2xl text-dark mb-1">{title}</h2>
        {subtitle && <p className="text-sm text-dark/50 mb-6">{subtitle}</p>}
        {!subtitle && <div className="mb-6" />}
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Step 1 — Basics
// ─────────────────────────────────────────

interface BasicsData {
  name: string;
  email: string;
  categories: SalonCategory[];
  quartier: string;
  address: string;
  phone: string;
}

function Step1({ data, onChange, errors }: { data: BasicsData; onChange: (d: BasicsData) => void; errors: Record<string, string> }) {
  const toggleCat = (c: SalonCategory) => {
    const next = data.categories.includes(c)
      ? data.categories.filter((x) => x !== c)
      : [...data.categories, c];
    onChange({ ...data, categories: next });
  };

  return (
    <StepContainer title="Dein Salon" subtitle="Erzähl uns das Wichtigste über deinen Salon.">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-dark/50 mb-1">Salon-Name *</label>
          <input
            value={data.name}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
            className={`w-full px-3 py-2.5 rounded-button border text-sm focus:outline-none focus:border-teal ${errors.name ? "border-coral" : "border-gray-200"}`}
            placeholder="z. B. Salon Lumière"
          />
          {errors.name && <p className="text-xs text-coral mt-0.5">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-dark/50 mb-1">E-Mail *</label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => onChange({ ...data, email: e.target.value })}
            className={`w-full px-3 py-2.5 rounded-button border text-sm focus:outline-none focus:border-teal ${errors.email ? "border-coral" : "border-gray-200"}`}
            placeholder="dein@salon.ch"
          />
          {errors.email && <p className="text-xs text-coral mt-0.5">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-dark/50 mb-2">Kategorien *</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => toggleCat(c.value)}
                className={[
                  "px-3 py-1.5 rounded-pill text-sm font-medium border transition-colors",
                  data.categories.includes(c.value)
                    ? "bg-teal text-white border-teal"
                    : "border-gray-200 text-dark/60 hover:border-teal",
                ].join(" ")}
              >
                {c.label}
              </button>
            ))}
          </div>
          {errors.categories && <p className="text-xs text-coral mt-1">{errors.categories}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-dark/50 mb-1">Quartier *</label>
          <select
            value={data.quartier}
            onChange={(e) => onChange({ ...data, quartier: e.target.value })}
            className={`w-full px-3 py-2.5 rounded-button border text-sm focus:outline-none focus:border-teal bg-white ${errors.quartier ? "border-coral" : "border-gray-200"}`}
          >
            <option value="">Bitte wählen…</option>
            {QUARTIERE.map((q) => (
              <option key={q.value} value={q.value}>{q.label}</option>
            ))}
          </select>
          {errors.quartier && <p className="text-xs text-coral mt-0.5">{errors.quartier}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-dark/50 mb-1">Adresse *</label>
          <input
            value={data.address}
            onChange={(e) => onChange({ ...data, address: e.target.value })}
            className={`w-full px-3 py-2.5 rounded-button border text-sm focus:outline-none focus:border-teal ${errors.address ? "border-coral" : "border-gray-200"}`}
            placeholder="Musterstrasse 12, 4051 Basel"
          />
          {errors.address && <p className="text-xs text-coral mt-0.5">{errors.address}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-dark/50 mb-1">Telefon (optional)</label>
          <input
            value={data.phone}
            onChange={(e) => onChange({ ...data, phone: e.target.value })}
            className="w-full px-3 py-2.5 rounded-button border border-gray-200 text-sm focus:outline-none focus:border-teal"
            placeholder="+41 61 000 00 00"
          />
        </div>
      </div>
    </StepContainer>
  );
}

// ─────────────────────────────────────────
// Step 2 — Profile
// ─────────────────────────────────────────

interface ProfileData {
  cover_photo_url: string;
  gallery_urls: string[];
  description_de: string;
  description_en: string;
  instagram_url: string;
  opening_hours: Record<string, { open: string; close: string } | null>;
}

function Step2({ data, onChange }: { data: ProfileData; onChange: (d: ProfileData) => void }) {
  const toggleDay = (key: string) => {
    const curr = data.opening_hours[key];
    onChange({
      ...data,
      opening_hours: {
        ...data.opening_hours,
        [key]: curr ? null : { open: "09:00", close: "18:00" },
      },
    });
  };

  const updateHours = (key: string, field: "open" | "close", val: string) => {
    const curr = data.opening_hours[key];
    if (!curr) return;
    onChange({ ...data, opening_hours: { ...data.opening_hours, [key]: { ...curr, [field]: val } } });
  };

  const addGallery = () => {
    if (data.gallery_urls.length >= 5) return;
    onChange({ ...data, gallery_urls: [...data.gallery_urls, ""] });
  };

  return (
    <StepContainer title="Salon-Profil" subtitle="Diese Infos sehen deine Kunden.">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-dark/50 mb-1">Cover-Foto *</label>
          <ImageUploader
            bucket="salon-photos"
            label="Titelbild hochladen"
            currentImageUrl={data.cover_photo_url || undefined}
            onUpload={(url) => onChange({ ...data, cover_photo_url: url })}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-dark/50">Galerie (max. 5)</label>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {data.gallery_urls.map((url, i) => (
              <div key={i} className="relative">
                {url ? (
                  <div className="relative rounded-card overflow-hidden border border-gray-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Galerie ${i + 1}`} className="w-full h-24 object-cover" />
                    <button
                      type="button"
                      onClick={() => onChange({ ...data, gallery_urls: data.gallery_urls.filter((_, j) => j !== i) })}
                      className="absolute top-1 right-1 p-1 rounded-full bg-white/90 text-dark/60 hover:text-coral"
                      aria-label="Bild entfernen"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ) : (
                  <ImageUploader
                    bucket="salon-photos"
                    label=""
                    maxSizeMB={5}
                    onUpload={(uploadedUrl) => {
                      const next = [...data.gallery_urls];
                      next[i] = uploadedUrl;
                      onChange({ ...data, gallery_urls: next });
                    }}
                  />
                )}
              </div>
            ))}
            {data.gallery_urls.length < 5 && (
              <button
                type="button"
                onClick={addGallery}
                className="h-24 rounded-card border-2 border-dashed border-gray-200 hover:border-teal transition-colors flex items-center justify-center"
              >
                <Plus size={16} className="text-dark/30" />
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-dark/50 mb-1">Beschreibung DE (max. 500)</label>
          <textarea
            value={data.description_de}
            onChange={(e) => onChange({ ...data, description_de: e.target.value })}
            maxLength={500}
            rows={3}
            className="w-full px-3 py-2 rounded-button border border-gray-200 text-sm focus:outline-none focus:border-teal resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-dark/50 mb-1">Beschreibung EN (optional)</label>
          <textarea
            value={data.description_en}
            onChange={(e) => onChange({ ...data, description_en: e.target.value })}
            maxLength={500}
            rows={2}
            className="w-full px-3 py-2 rounded-button border border-gray-200 text-sm focus:outline-none focus:border-teal resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-dark/50 mb-1">Instagram (optional)</label>
          <input
            value={data.instagram_url}
            onChange={(e) => onChange({ ...data, instagram_url: e.target.value })}
            className="w-full px-3 py-2.5 rounded-button border border-gray-200 text-sm focus:outline-none focus:border-teal"
            placeholder="https://instagram.com/deinsalon"
          />
          <p className="text-xs text-dark/30 mt-1">Verlinke dein Instagram für dein Portfolio</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-dark/50 mb-2">Öffnungszeiten</label>
          <div className="space-y-2">
            {DAY_KEYS.map((key, i) => {
              const hours = data.opening_hours[key];
              return (
                <div key={key} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleDay(key)}
                    className={[
                      "w-10 text-center text-xs font-medium py-1.5 rounded-button transition-colors",
                      hours ? "bg-teal text-white" : "bg-gray-100 text-dark/40",
                    ].join(" ")}
                  >
                    {DAYS[i]}
                  </button>
                  {hours ? (
                    <>
                      <input
                        type="time"
                        value={hours.open}
                        onChange={(e) => updateHours(key, "open", e.target.value)}
                        className="px-2 py-1 rounded-button border border-gray-200 text-xs focus:outline-none focus:border-teal"
                      />
                      <span className="text-xs text-dark/30">–</span>
                      <input
                        type="time"
                        value={hours.close}
                        onChange={(e) => updateHours(key, "close", e.target.value)}
                        className="px-2 py-1 rounded-button border border-gray-200 text-xs focus:outline-none focus:border-teal"
                      />
                    </>
                  ) : (
                    <span className="text-xs text-dark/30">Geschlossen</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </StepContainer>
  );
}

// ─────────────────────────────────────────
// Step 3 — Services
// ─────────────────────────────────────────

interface ServiceDraft {
  name_de: string;
  name_en: string;
  name_fr: string;
  name_it: string;
  category: SalonCategory | "";
  duration_minutes: number;
  price: number;
  description_de: string;
  suitable_for: AgeGroup[];
  suitable_gender: Gender[];
  _autoTranslated?: boolean;
}

const EMPTY_SERVICE: ServiceDraft = {
  name_de: "", name_en: "", name_fr: "", name_it: "", category: "", duration_minutes: 60, price: 80,
  description_de: "", suitable_for: [], suitable_gender: [],
};

const AGE_OPTIONS: { value: AgeGroup; label: string }[] = [
  { value: "child", label: "Kinder" }, { value: "teenager", label: "Teenager" },
  { value: "adult", label: "Erwachsene" }, { value: "senior", label: "Senioren" },
];
const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "Männlich" }, { value: "female", label: "Weiblich" },
  { value: "non_binary", label: "Non-binary" },
];

function Step3({ services, onChange, salonCategories }: {
  services: ServiceDraft[];
  onChange: (s: ServiceDraft[]) => void;
  salonCategories: SalonCategory[];
}) {
  const [adding, setAdding] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState<ServiceDraft>(EMPTY_SERVICE);
  const [translating, setTranslating] = useState(false);

  // Templates filtered by selected salon categories
  const availableTemplates = salonCategories.flatMap(cat => serviceTemplates[cat] || []);

  // Check if a template is already added (by name_de match)
  const isTemplateAdded = (t: ServiceTemplate) =>
    services.some(s => s.name_de === t.name_de);

  const addFromTemplate = (t: ServiceTemplate) => {
    if (isTemplateAdded(t)) return;
    onChange([...services, {
      name_de: t.name_de,
      name_en: t.name_en,
      name_fr: t.name_fr,
      name_it: t.name_it,
      category: t.category as SalonCategory,
      duration_minutes: t.duration,
      price: t.price,
      description_de: "",
      suitable_for: [],
      suitable_gender: [],
    }]);
  };

  // Auto-translate on blur of name_de
  const autoTranslate = async (text: string) => {
    if (!text || text.length < 2) return;
    setTranslating(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, from: "de", to: ["en", "fr", "it"] }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.translations) {
          setDraft(prev => ({
            ...prev,
            name_en: data.translations.en || prev.name_en,
            name_fr: data.translations.fr || prev.name_fr,
            name_it: data.translations.it || prev.name_it,
            _autoTranslated: true,
          }));
        }
      }
    } catch { /* fail silently */ }
    setTranslating(false);
  };

  const saveCustom = () => {
    if (!draft.name_de || !draft.category) return;
    if (editingIdx !== null) {
      const next = [...services];
      next[editingIdx] = draft;
      onChange(next);
      setEditingIdx(null);
    } else {
      onChange([...services, draft]);
    }
    setDraft(EMPTY_SERVICE);
    setAdding(false);
  };

  const startEdit = (i: number) => {
    setDraft(services[i]);
    setEditingIdx(i);
    setAdding(true);
  };

  const cancelEdit = () => {
    setDraft(EMPTY_SERVICE);
    setEditingIdx(null);
    setAdding(false);
  };

  return (
    <StepContainer title="Deine Services" subtitle="Wähle aus Vorlagen oder erstelle eigene Services.">
      {/* Template grid */}
      {availableTemplates.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-medium text-dark/50 mb-2">Vorlagen für deine Kategorien</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {availableTemplates.map((t) => {
              const added = isTemplateAdded(t);
              return (
                <button
                  key={`${t.category}-${t.name_de}`}
                  type="button"
                  disabled={added}
                  onClick={() => addFromTemplate(t)}
                  className={[
                    "flex items-center justify-between px-3 py-2.5 rounded-card border text-left transition-all",
                    added
                      ? "bg-teal/5 border-teal/20 opacity-60 cursor-default"
                      : "border-gray-200 hover:border-teal hover:bg-teal/5 cursor-pointer",
                  ].join(" ")}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-dark truncate">{t.name_de}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-dark/40">
                        <Clock size={10} /> {t.duration} min
                      </span>
                      <span className="text-xs font-data font-semibold text-dark/60">CHF {t.price}</span>
                    </div>
                  </div>
                  {added ? (
                    <Check size={14} className="text-teal shrink-0 ml-2" />
                  ) : (
                    <Plus size={14} className="text-teal shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Added services list */}
      {services.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-dark/50 mb-2">Deine Services ({services.length})</p>
          <div className="space-y-2">
            {services.map((s, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-50 rounded-card px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-dark truncate">{s.name_de}</p>
                  <p className="text-xs text-dark/40">{s.duration_minutes} min · CHF {s.price}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={() => startEdit(i)}
                    className="p-1.5 text-dark/30 hover:text-teal transition-colors"
                    aria-label="Service bearbeiten"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange(services.filter((_, j) => j !== i))}
                    className="p-1.5 text-dark/30 hover:text-coral transition-colors"
                    aria-label="Service entfernen"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom add / edit form */}
      {adding ? (
        <div className="border border-gray-200 rounded-card p-4 space-y-3">
          <p className="text-xs font-medium text-dark/50">
            {editingIdx !== null ? "Service bearbeiten" : "Eigener Service"}
          </p>
          <div>
            <label className="block text-xs font-medium text-dark/50 mb-1">Name DE *</label>
            <input
              value={draft.name_de}
              onChange={(e) => setDraft({ ...draft, name_de: e.target.value, _autoTranslated: false })}
              onBlur={() => { if (draft.name_de && !draft._autoTranslated) autoTranslate(draft.name_de); }}
              className="w-full px-3 py-2 rounded-button border border-gray-200 text-sm focus:outline-none focus:border-teal"
              placeholder="z. B. Waschen + Schneiden"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-dark/50 mb-1">EN</label>
              <input
                value={draft.name_en}
                onChange={(e) => setDraft({ ...draft, name_en: e.target.value })}
                className="w-full px-3 py-2 rounded-button border border-gray-200 text-sm focus:outline-none focus:border-teal"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark/50 mb-1">FR</label>
              <input
                value={draft.name_fr}
                onChange={(e) => setDraft({ ...draft, name_fr: e.target.value })}
                className="w-full px-3 py-2 rounded-button border border-gray-200 text-sm focus:outline-none focus:border-teal"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark/50 mb-1">IT</label>
              <input
                value={draft.name_it}
                onChange={(e) => setDraft({ ...draft, name_it: e.target.value })}
                className="w-full px-3 py-2 rounded-button border border-gray-200 text-sm focus:outline-none focus:border-teal"
              />
            </div>
          </div>
          {translating && (
            <p className="text-[10px] text-dark/40 flex items-center gap-1">
              <Loader2 size={10} className="animate-spin" /> Automatisch übersetzen…
            </p>
          )}
          {draft._autoTranslated && !translating && (
            <p className="text-[10px] text-dark/40">Automatisch übersetzt — du kannst die Übersetzungen anpassen.</p>
          )}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-dark/50 mb-1">Kategorie *</label>
              <select
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value as SalonCategory })}
                className="w-full px-2 py-2 rounded-button border border-gray-200 text-sm focus:outline-none focus:border-teal bg-white"
              >
                <option value="">Wählen…</option>
                {salonCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-dark/50 mb-1">Dauer</label>
              <select
                value={draft.duration_minutes}
                onChange={(e) => setDraft({ ...draft, duration_minutes: +e.target.value })}
                className="w-full px-2 py-2 rounded-button border border-gray-200 text-sm focus:outline-none focus:border-teal bg-white"
              >
                {DURATION_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d} min</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-dark/50 mb-1">Preis CHF</label>
              <input
                type="number"
                min={0}
                value={draft.price}
                onChange={(e) => setDraft({ ...draft, price: +e.target.value })}
                className="w-full px-2 py-2 rounded-button border border-gray-200 text-sm focus:outline-none focus:border-teal"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={cancelEdit}
              className="px-4 py-2 rounded-button border border-gray-200 text-sm text-dark/60">Abbrechen</button>
            <button type="button" onClick={saveCustom} disabled={!draft.name_de || !draft.category}
              className="px-4 py-2 rounded-button bg-teal text-white text-sm font-medium disabled:opacity-50">
              {editingIdx !== null ? "Speichern" : "Hinzufügen"}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => { setEditingIdx(null); setDraft(EMPTY_SERVICE); setAdding(true); }}
          className="w-full py-3 rounded-card border-2 border-dashed border-gray-200 text-sm text-dark/40 hover:border-teal hover:text-teal transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Eigener Service erstellen
        </button>
      )}
    </StepContainer>
  );
}

// ─────────────────────────────────────────
// Step 4 — Team
// ─────────────────────────────────────────

interface StaffDraft { name: string; avatar_url: string; role: string; specialties: string[] }
const EMPTY_STAFF: StaffDraft = { name: "", avatar_url: "", role: "", specialties: [] };

// Role suggestions based on salon categories
const ROLE_SUGGESTIONS: Record<string, string[]> = {
  barbershop: ["Barbier", "Junior Barbier", "Senior Barbier"],
  coiffeur: ["Stylist:in", "Colorist:in", "Junior Stylist:in", "Senior Stylist:in"],
  nails: ["Nageldesigner:in", "Pediküre-Spezialist:in"],
  spa: ["Masseur:in", "Kosmetiker:in", "Therapeut:in"],
  makeup: ["Visagist:in", "Lash Artist", "Brow Artist"],
  waxing: ["Waxing-Spezialist:in", "Kosmetiker:in"],
};

// Specialty suggestions based on categories
const SPECIALTY_SUGGESTIONS: Record<string, string[]> = {
  barbershop: ["Fade", "Beard Design", "Razor Shave", "Kids"],
  coiffeur: ["Balayage", "Coloring", "Updos", "Extensions", "Keratin"],
  nails: ["Gel", "Acryl", "Nail Art", "Medical Pedicure"],
  spa: ["Deep Tissue", "Hot Stone", "Facial", "Lymphdrainage"],
  makeup: ["Bridal", "Lash Extensions", "Microblading", "Permanent Makeup"],
  waxing: ["Brazilian", "Full Body", "Sugaring"],
};

function Step4({ staff, onChange, salonCategories }: {
  staff: StaffDraft[];
  onChange: (s: StaffDraft[]) => void;
  salonCategories: SalonCategory[];
}) {
  const [draft, setDraft] = useState<StaffDraft>(EMPTY_STAFF);
  const [adding, setAdding] = useState(staff.length === 0);

  // Merge suggestions from all salon categories
  const roles = [...new Set(salonCategories.flatMap(c => ROLE_SUGGESTIONS[c] || []))];
  const specialties = [...new Set(salonCategories.flatMap(c => SPECIALTY_SUGGESTIONS[c] || []))];

  const toggleSpecialty = (spec: string) => {
    const has = draft.specialties.includes(spec);
    setDraft({
      ...draft,
      specialties: has
        ? draft.specialties.filter(s => s !== spec)
        : [...draft.specialties, spec],
    });
  };

  const save = () => {
    if (!draft.name) return;
    onChange([...staff, draft]);
    setDraft(EMPTY_STAFF);
    setAdding(false);
  };

  return (
    <StepContainer title="Dein Team" subtitle="Wer arbeitet in deinem Salon?">
      <div className="space-y-2 mb-4">
        {staff.map((s, i) => (
          <div key={i} className="flex items-center justify-between bg-gray-50 rounded-card px-4 py-3">
            <div>
              <p className="text-sm font-medium text-dark">{s.name}</p>
              <p className="text-xs text-dark/40 mt-0.5">
                {[s.role, ...s.specialties].filter(Boolean).join(" · ") || "Keine Rolle"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onChange(staff.filter((_, j) => j !== i))}
              className="text-dark/30 hover:text-coral transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {adding ? (
        <div className="border border-gray-200 rounded-card p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-dark/50 mb-1">Name *</label>
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="w-full px-3 py-2 rounded-button border border-gray-200 text-sm focus:outline-none focus:border-teal"
              placeholder="z. B. Maria"
            />
          </div>

          {roles.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-dark/50 mb-1.5">Rolle</label>
              <div className="flex flex-wrap gap-1.5">
                {roles.map((r) => (
                  <button key={r} type="button" onClick={() => setDraft({ ...draft, role: draft.role === r ? "" : r })}
                    className={["px-2.5 py-1 rounded-pill text-xs border transition-colors",
                      draft.role === r ? "bg-teal text-white border-teal" : "border-gray-200 text-dark/50 hover:border-teal",
                    ].join(" ")}
                  >{r}</button>
                ))}
              </div>
            </div>
          )}

          {specialties.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-dark/50 mb-1.5">Spezialitäten</label>
              <div className="flex flex-wrap gap-1.5">
                {specialties.map((s) => (
                  <button key={s} type="button" onClick={() => toggleSpecialty(s)}
                    className={["px-2.5 py-1 rounded-pill text-xs border transition-colors",
                      draft.specialties.includes(s) ? "bg-teal/10 text-teal border-teal/30" : "border-gray-200 text-dark/40 hover:border-teal",
                    ].join(" ")}
                  >{s}</button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button type="button" onClick={() => { setAdding(false); setDraft(EMPTY_STAFF); }}
              className="px-4 py-2 rounded-button border border-gray-200 text-sm text-dark/60">Abbrechen</button>
            <button type="button" onClick={save} disabled={!draft.name}
              className="px-4 py-2 rounded-button bg-teal text-white text-sm font-medium disabled:opacity-50">Hinzufügen</button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <button type="button" onClick={() => setAdding(true)}
            className="w-full py-3 rounded-card border-2 border-dashed border-gray-200 text-sm text-dark/40 hover:border-teal hover:text-teal transition-colors flex items-center justify-center gap-2">
            <Plus size={16} /> Mitarbeiter hinzufügen
          </button>
          {staff.length === 0 && (
            <button type="button" onClick={() => onChange([{ name: "Nur ich", avatar_url: "", role: "Inhaber:in", specialties: [] }])}
              className="w-full py-2 rounded-button text-sm text-dark/40 hover:text-teal transition-colors">
              Nur ich (solo) →
            </button>
          )}
        </div>
      )}
    </StepContainer>
  );
}

// ─────────────────────────────────────────
// Step 5 — Availability
// ─────────────────────────────────────────

interface BreakSlot { start: string; end: string }
interface AvailDayData { start: string; end: string; breaks?: BreakSlot[] }
interface AvailData {
  template: Record<string, AvailDayData | null>;
}

function Step5({ data, onChange, slotCount }: {
  data: AvailData;
  onChange: (d: AvailData) => void;
  slotCount: number;
}) {
  const toggleDay = (key: string) => {
    const curr = data.template[key];
    onChange({ template: { ...data.template, [key]: curr ? null : { start: "09:00", end: "18:00", breaks: [] } } });
  };

  const addBreak = (key: string) => {
    const slot = data.template[key];
    if (!slot) return;
    const breaks = [...(slot.breaks || []), { start: "12:00", end: "13:00" }];
    onChange({ template: { ...data.template, [key]: { ...slot, breaks } } });
  };

  const updateBreak = (key: string, idx: number, field: "start" | "end", val: string) => {
    const slot = data.template[key];
    if (!slot) return;
    const breaks = [...(slot.breaks || [])];
    breaks[idx] = { ...breaks[idx], [field]: val };
    onChange({ template: { ...data.template, [key]: { ...slot, breaks } } });
  };

  const removeBreak = (key: string, idx: number) => {
    const slot = data.template[key];
    if (!slot) return;
    const breaks = (slot.breaks || []).filter((_, i) => i !== idx);
    onChange({ template: { ...data.template, [key]: { ...slot, breaks } } });
  };

  return (
    <StepContainer title="Verfügbarkeit" subtitle="Wöchentliche Vorlage für die nächsten 14 Tage.">
      <div className="space-y-3 mb-6">
        {DAY_KEYS.map((key, i) => {
          const slot = data.template[key];
          return (
            <div key={key}>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => toggleDay(key)}
                  className={["w-10 text-center text-xs font-medium py-1.5 rounded-button transition-colors",
                    slot ? "bg-teal text-white" : "bg-gray-100 text-dark/40"].join(" ")}>
                  {DAYS[i]}
                </button>
                {slot ? (
                  <>
                    <input type="time" value={slot.start}
                      onChange={(e) => onChange({ template: { ...data.template, [key]: { ...slot, start: e.target.value } } })}
                      className="px-2 py-1 rounded-button border border-gray-200 text-xs focus:outline-none focus:border-teal" />
                    <span className="text-xs text-dark/30">–</span>
                    <input type="time" value={slot.end}
                      onChange={(e) => onChange({ template: { ...data.template, [key]: { ...slot, end: e.target.value } } })}
                      className="px-2 py-1 rounded-button border border-gray-200 text-xs focus:outline-none focus:border-teal" />
                    <button type="button" onClick={() => addBreak(key)}
                      className="text-[10px] text-teal hover:underline shrink-0 ml-1">
                      + Pause
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-dark/30">Nicht verfügbar</span>
                )}
              </div>
              {/* Break rows */}
              {slot?.breaks?.map((brk, bi) => (
                <div key={bi} className="flex items-center gap-2 ml-[52px] mt-1.5">
                  <span className="text-[10px] text-dark/40 w-10 shrink-0">Pause</span>
                  <input type="time" value={brk.start}
                    onChange={(e) => updateBreak(key, bi, "start", e.target.value)}
                    className="px-1.5 py-0.5 rounded-button border border-coral/30 text-xs focus:outline-none focus:border-coral" />
                  <span className="text-xs text-dark/30">–</span>
                  <input type="time" value={brk.end}
                    onChange={(e) => updateBreak(key, bi, "end", e.target.value)}
                    className="px-1.5 py-0.5 rounded-button border border-coral/30 text-xs focus:outline-none focus:border-coral" />
                  <button type="button" onClick={() => removeBreak(key, bi)}
                    className="text-dark/30 hover:text-coral transition-colors">
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      {slotCount > 0 && (
        <div className="bg-teal/5 border border-teal/20 rounded-card px-4 py-3 text-sm text-teal font-medium">
          {slotCount} Slots für die nächsten 2 Wochen erstellt.
        </div>
      )}
    </StepContainer>
  );
}

// ─────────────────────────────────────────
// Step 6 — Last-Minute Settings
// ─────────────────────────────────────────

interface LMData { enabled: boolean; discount_percent: number; window_hours: number }

function Step6({ data, onChange }: { data: LMData; onChange: (d: LMData) => void }) {
  return (
    <StepContainer title="Last-Minute" subtitle="Automatische Rabatte für freie Slots.">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-dark">Last-Minute aktivieren</p>
            <p className="text-xs text-dark/40 mt-0.5">
              Nicht gebuchte Termine werden automatisch als Last-Minute angezeigt.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange({ ...data, enabled: !data.enabled })}
            className={["w-11 h-6 rounded-full transition-colors relative",
              data.enabled ? "bg-teal" : "bg-gray-200"].join(" ")}
          >
            <span className={["absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform",
              data.enabled ? "translate-x-5.5" : "translate-x-0.5"].join(" ")} />
          </button>
        </div>

        {data.enabled && (
          <>
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-medium text-dark/50">Rabatt</label>
                <span className="text-sm font-bold text-teal data-font">{data.discount_percent}%</span>
              </div>
              <input type="range" min={5} max={50} step={5} value={data.discount_percent}
                onChange={(e) => onChange({ ...data, discount_percent: +e.target.value })}
                className="w-full accent-teal" />
              <div className="flex justify-between text-xs text-dark/30 mt-1">
                <span>5%</span><span>50%</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-medium text-dark/50">Zeitfenster</label>
                <span className="text-sm font-bold text-teal data-font">{data.window_hours}h</span>
              </div>
              <input type="range" min={2} max={24} step={1} value={data.window_hours}
                onChange={(e) => onChange({ ...data, window_hours: +e.target.value })}
                className="w-full accent-teal" />
              <div className="flex justify-between text-xs text-dark/30 mt-1">
                <span>2h</span><span>24h</span>
              </div>
            </div>
          </>
        )}
      </div>
    </StepContainer>
  );
}

// ─────────────────────────────────────────
// Main Wizard
// ─────────────────────────────────────────

export default function SalonOnboardingPage() {
  const locale = useLocale();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState<1 | -1>(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  const goNext = () => {
    const errors = validateCurrentStep();
    if (Object.keys(errors).length > 0) {
      setStepErrors(errors);
      return;
    }
    setStepErrors({});
    setDir(1);
    setStep((s) => s + 1);
  };
  const goPrev = () => { setStepErrors({}); setDir(-1); setStep((s) => s - 1); };

  const validateCurrentStep = (): Record<string, string> => {
    if (step === 1) return validateStep(step1Schema, basics);
    if (step === 2) return validateStep(step2Schema, profile);
    if (step === 3) return validateStep(step3Schema, { services });
    if (step === 4) return validateStep(step4Schema, { staff: staffList });
    return {};
  };

  const [basics, setBasics] = useState<BasicsData>({
    name: "", email: "", categories: [], quartier: "", address: "", phone: "",
  });
  const [profile, setProfile] = useState<ProfileData>({
    cover_photo_url: "", gallery_urls: [], description_de: "", description_en: "",
    instagram_url: "",
    opening_hours: Object.fromEntries(DAY_KEYS.map((k, i) => [k, i < 5 ? { open: "09:00", close: "18:00" } : null])),
  });
  const [services, setServices] = useState<ServiceDraft[]>([]);
  const [staffList, setStaffList] = useState<StaffDraft[]>([]);
  const [avail, setAvail] = useState<AvailData>({
    template: Object.fromEntries(DAY_KEYS.map((k, i) => [k, i < 5 ? { start: "09:00", end: "18:00", breaks: [] } : null])),
  });
  const [lm, setLm] = useState<LMData>({ enabled: true, discount_percent: 10, window_hours: 6 });

  // Pre-fill email from authenticated user (Google OAuth or existing session)
  useEffect(() => {
    const sb = createBrowserSupabaseClient();
    sb.auth.getUser().then(({ data: { user } }) => {
      if (user?.email && !basics.email) {
        setBasics((prev) => ({ ...prev, email: user.email! }));
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute slot count preview for step 5
  const slotCount = Object.values(avail.template).filter(Boolean).length * 2 * 14; // approx

  const canProceed = () => {
    if (step === 1) return !!(basics.name && basics.email && basics.categories.length && basics.quartier && basics.address);
    if (step === 2) return !!profile.cover_photo_url;
    if (step === 3) return services.length >= 1;
    if (step === 4) return staffList.length >= 1;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await fetch("/api/salons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...basics,
          ...profile,
          services,
          staff: staffList,
          availability_template: avail.template,
          last_minute_discount_percent: lm.enabled ? lm.discount_percent : 0,
          last_minute_window_hours: lm.enabled ? lm.window_hours : 0,
        }),
      });
      setDone(true);
      setTimeout(() => router.push(`/${locale}/dashboard?onboarded=1`), 2200);
    } catch { /* ignore */ } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal/5 via-white to-coral/5 pb-24">
      {/* Celebration overlay */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-lg"
          >
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="flex flex-col items-center gap-4 text-center px-6"
            >
              <div className="w-20 h-20 rounded-full bg-teal/10 flex items-center justify-center">
                <PartyPopper size={36} className="text-teal" />
              </div>
              <h2 className="font-heading font-bold text-2xl text-dark">Salon erstellt!</h2>
              <p className="text-dark/50 text-sm max-w-xs">Dein Salon wird jetzt geprüft. Du wirst per E-Mail informiert.</p>
              <div className="flex gap-1.5 mt-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    className="w-2 h-2 rounded-full bg-teal"
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="font-heading font-bold text-base text-dark">
              solen<span className="text-teal">.</span>ch
            </span>
            <span className="text-xs text-dark/40">Schritt {step} von {TOTAL_STEPS}</span>
          </div>
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div
                key={i}
                className={[
                  "h-1.5 rounded-full transition-all duration-500",
                  i < step ? "bg-teal" : "bg-gray-100",
                  i === step - 1 ? "w-6" : "w-3",
                ].join(" ")}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Step content with AnimatePresence */}
      <div className="px-4 py-8 overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={slideSwitch(dir)}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {step === 1 && <Step1 data={basics} onChange={setBasics} errors={stepErrors} />}
            {step === 2 && <Step2 data={profile} onChange={setProfile} />}
            {step === 3 && <Step3 services={services} onChange={setServices} salonCategories={basics.categories} />}
            {step === 4 && <Step4 staff={staffList} onChange={setStaffList} salonCategories={basics.categories} />}
            {step === 5 && <Step5 data={avail} onChange={setAvail} slotCount={slotCount} />}
            {step === 6 && <Step6 data={lm} onChange={setLm} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Nav buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-100 px-4 py-4">
        <div className="max-w-xl mx-auto flex gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={goPrev}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-button border border-gray-200 text-sm text-dark/60 hover:text-dark transition-colors"
            >
              <ChevronLeft size={16} /> Zurück
            </button>
          )}
          <button
            type="button"
            disabled={submitting}
            onClick={step < TOTAL_STEPS ? goNext : handleSubmit}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-button bg-teal text-white text-sm font-medium hover:bg-teal/90 transition-colors disabled:opacity-50"
          >
            {submitting && <Spinner size="sm" invert />}
            {step < TOTAL_STEPS ? (
              <><span>Weiter</span><ChevronRight size={16} /></>
            ) : (
              <><Check size={16} /><span>Salon erstellen</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
