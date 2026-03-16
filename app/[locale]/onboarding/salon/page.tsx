"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Check, Plus, Trash2, ChevronRight, ChevronLeft } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import type { SalonCategory, AgeGroup, Gender } from "@/lib/types";

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
      <h2 className="font-heading font-bold text-2xl text-dark mb-1">{title}</h2>
      {subtitle && <p className="text-sm text-dark/50 mb-6">{subtitle}</p>}
      {!subtitle && <div className="mb-6" />}
      {children}
    </div>
  );
}

// ─────────────────────────────────────────
// Step 1 — Basics
// ─────────────────────────────────────────

interface BasicsData {
  name: string;
  categories: SalonCategory[];
  quartier: string;
  address: string;
  phone: string;
}

function Step1({ data, onChange }: { data: BasicsData; onChange: (d: BasicsData) => void }) {
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
            required
            value={data.name}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
            className="w-full px-3 py-2.5 rounded-button border border-gray-200 text-sm focus:outline-none focus:border-teal"
            placeholder="z. B. Salon Lumière"
          />
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
        </div>

        <div>
          <label className="block text-xs font-medium text-dark/50 mb-1">Quartier *</label>
          <select
            value={data.quartier}
            onChange={(e) => onChange({ ...data, quartier: e.target.value })}
            className="w-full px-3 py-2.5 rounded-button border border-gray-200 text-sm focus:outline-none focus:border-teal bg-white"
          >
            <option value="">Bitte wählen…</option>
            {QUARTIERE.map((q) => (
              <option key={q.value} value={q.value}>{q.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-dark/50 mb-1">Adresse *</label>
          <input
            required
            value={data.address}
            onChange={(e) => onChange({ ...data, address: e.target.value })}
            className="w-full px-3 py-2.5 rounded-button border border-gray-200 text-sm focus:outline-none focus:border-teal"
            placeholder="Musterstrasse 12, 4051 Basel"
          />
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
          <label className="block text-xs font-medium text-dark/50 mb-1">Cover-Foto URL *</label>
          <input
            required
            value={data.cover_photo_url}
            onChange={(e) => onChange({ ...data, cover_photo_url: e.target.value })}
            className="w-full px-3 py-2.5 rounded-button border border-gray-200 text-sm focus:outline-none focus:border-teal"
            placeholder="https://…"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-dark/50">Galerie (max. 5)</label>
            {data.gallery_urls.length < 5 && (
              <button type="button" onClick={addGallery} className="text-xs text-teal flex items-center gap-1">
                <Plus size={12} /> Foto hinzufügen
              </button>
            )}
          </div>
          <div className="space-y-2">
            {data.gallery_urls.map((url, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={url}
                  onChange={(e) => {
                    const next = [...data.gallery_urls];
                    next[i] = e.target.value;
                    onChange({ ...data, gallery_urls: next });
                  }}
                  className="flex-1 px-3 py-2 rounded-button border border-gray-200 text-sm focus:outline-none focus:border-teal"
                  placeholder="https://…"
                />
                <button
                  type="button"
                  onClick={() => onChange({ ...data, gallery_urls: data.gallery_urls.filter((_, j) => j !== i) })}
                  className="p-2 text-dark/30 hover:text-coral transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
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
  category: SalonCategory | "";
  duration_minutes: number;
  price: number;
  description_de: string;
  suitable_for: AgeGroup[];
  suitable_gender: Gender[];
}

const EMPTY_SERVICE: ServiceDraft = {
  name_de: "", name_en: "", category: "", duration_minutes: 60, price: 80,
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
  const [draft, setDraft] = useState<ServiceDraft>(EMPTY_SERVICE);
  const [adding, setAdding] = useState(services.length === 0);

  const toggleArr = <T,>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  const save = () => {
    if (!draft.name_de || !draft.category) return;
    onChange([...services, draft]);
    setDraft(EMPTY_SERVICE);
    setAdding(false);
  };

  return (
    <StepContainer title="Deine Services" subtitle="Füge mindestens einen Service hinzu.">
      {/* Service list */}
      <div className="space-y-2 mb-4">
        {services.map((s, i) => (
          <div key={i} className="flex items-center justify-between bg-gray-50 rounded-card px-4 py-3">
            <div>
              <p className="text-sm font-medium text-dark">{s.name_de}</p>
              <p className="text-xs text-dark/40">{s.category} · {s.duration_minutes} min · CHF {s.price}</p>
            </div>
            <button
              type="button"
              onClick={() => onChange(services.filter((_, j) => j !== i))}
              className="text-dark/30 hover:text-coral transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {adding ? (
        <div className="border border-gray-200 rounded-card p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-dark/50 mb-1">Name DE *</label>
              <input
                value={draft.name_de}
                onChange={(e) => setDraft({ ...draft, name_de: e.target.value })}
                className="w-full px-3 py-2 rounded-button border border-gray-200 text-sm focus:outline-none focus:border-teal"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark/50 mb-1">Name EN</label>
              <input
                value={draft.name_en}
                onChange={(e) => setDraft({ ...draft, name_en: e.target.value })}
                className="w-full px-3 py-2 rounded-button border border-gray-200 text-sm focus:outline-none focus:border-teal"
              />
            </div>
          </div>
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
              <label className="block text-xs font-medium text-dark/50 mb-1">Dauer (Min)</label>
              <input
                type="number"
                min={15}
                step={15}
                value={draft.duration_minutes}
                onChange={(e) => setDraft({ ...draft, duration_minutes: +e.target.value })}
                className="w-full px-2 py-2 rounded-button border border-gray-200 text-sm focus:outline-none focus:border-teal"
              />
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
          <div>
            <label className="block text-xs font-medium text-dark/50 mb-1">Beschreibung</label>
            <textarea
              value={draft.description_de}
              onChange={(e) => setDraft({ ...draft, description_de: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-button border border-gray-200 text-sm focus:outline-none focus:border-teal resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-dark/50 mb-1">Geeignet für</label>
              <div className="flex flex-wrap gap-1">
                {AGE_OPTIONS.map((a) => (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() => setDraft({ ...draft, suitable_for: toggleArr(draft.suitable_for, a.value) })}
                    className={["px-2 py-1 rounded-pill text-xs border transition-colors",
                      draft.suitable_for.includes(a.value) ? "bg-teal text-white border-teal" : "border-gray-200 text-dark/50",
                    ].join(" ")}
                  >{a.label}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-dark/50 mb-1">Geschlecht</label>
              <div className="flex flex-wrap gap-1">
                {GENDER_OPTIONS.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setDraft({ ...draft, suitable_gender: toggleArr(draft.suitable_gender, g.value) })}
                    className={["px-2 py-1 rounded-pill text-xs border transition-colors",
                      draft.suitable_gender.includes(g.value) ? "bg-teal text-white border-teal" : "border-gray-200 text-dark/50",
                    ].join(" ")}
                  >{g.label}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setAdding(false); setDraft(EMPTY_SERVICE); }}
              className="px-4 py-2 rounded-button border border-gray-200 text-sm text-dark/60"
            >Abbrechen</button>
            <button
              type="button"
              onClick={save}
              disabled={!draft.name_de || !draft.category}
              className="px-4 py-2 rounded-button bg-teal text-white text-sm font-medium disabled:opacity-50"
            >Hinzufügen</button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="w-full py-3 rounded-card border-2 border-dashed border-gray-200 text-sm text-dark/40 hover:border-teal hover:text-teal transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Service hinzufügen
        </button>
      )}
    </StepContainer>
  );
}

// ─────────────────────────────────────────
// Step 4 — Team
// ─────────────────────────────────────────

interface StaffDraft { name: string; avatar_url: string; specialties: string[] }
const EMPTY_STAFF: StaffDraft = { name: "", avatar_url: "", specialties: [] };

function Step4({ staff, onChange }: { staff: StaffDraft[]; onChange: (s: StaffDraft[]) => void }) {
  const [draft, setDraft] = useState<StaffDraft>(EMPTY_STAFF);
  const [adding, setAdding] = useState(staff.length === 0);
  const [specInput, setSpecInput] = useState("");

  const addSpec = () => {
    if (!specInput.trim()) return;
    setDraft({ ...draft, specialties: [...draft.specialties, specInput.trim()] });
    setSpecInput("");
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
              {s.specialties.length > 0 && (
                <p className="text-xs text-dark/40 mt-0.5">{s.specialties.join(", ")}</p>
              )}
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
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-dark/50 mb-1">Foto URL (optional)</label>
            <input
              value={draft.avatar_url}
              onChange={(e) => setDraft({ ...draft, avatar_url: e.target.value })}
              className="w-full px-3 py-2 rounded-button border border-gray-200 text-sm focus:outline-none focus:border-teal"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-dark/50 mb-1">Spezialitäten</label>
            <div className="flex gap-2 mb-2">
              <input
                value={specInput}
                onChange={(e) => setSpecInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSpec(); } }}
                placeholder="z. B. Balayage, Färben…"
                className="flex-1 px-3 py-2 rounded-button border border-gray-200 text-sm focus:outline-none focus:border-teal"
              />
              <button type="button" onClick={addSpec} className="px-3 py-2 rounded-button bg-gray-100 text-sm text-dark/60">
                <Plus size={14} />
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {draft.specialties.map((s, i) => (
                <span key={i} className="flex items-center gap-1 px-2 py-0.5 bg-teal/10 text-teal text-xs rounded-pill">
                  {s}
                  <button type="button" onClick={() => setDraft({ ...draft, specialties: draft.specialties.filter((_, j) => j !== i) })}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
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
            <button type="button" onClick={() => onChange([{ name: "Nur ich", avatar_url: "", specialties: [] }])}
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

interface AvailData {
  template: Record<string, { start: string; end: string } | null>;
}

function Step5({ data, onChange, slotCount }: {
  data: AvailData;
  onChange: (d: AvailData) => void;
  slotCount: number;
}) {
  const toggleDay = (key: string) => {
    const curr = data.template[key];
    onChange({ template: { ...data.template, [key]: curr ? null : { start: "09:00", end: "18:00" } } });
  };

  return (
    <StepContainer title="Verfügbarkeit" subtitle="Wöchentliche Vorlage für die nächsten 14 Tage.">
      <div className="space-y-2 mb-6">
        {DAY_KEYS.map((key, i) => {
          const slot = data.template[key];
          return (
            <div key={key} className="flex items-center gap-3">
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
                </>
              ) : (
                <span className="text-xs text-dark/30">Nicht verfügbar</span>
              )}
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
  const [submitting, setSubmitting] = useState(false);

  const [basics, setBasics] = useState<BasicsData>({
    name: "", categories: [], quartier: "", address: "", phone: "",
  });
  const [profile, setProfile] = useState<ProfileData>({
    cover_photo_url: "", gallery_urls: [], description_de: "", description_en: "",
    instagram_url: "",
    opening_hours: Object.fromEntries(DAY_KEYS.map((k, i) => [k, i < 5 ? { open: "09:00", close: "18:00" } : null])),
  });
  const [services, setServices] = useState<ServiceDraft[]>([]);
  const [staffList, setStaffList] = useState<StaffDraft[]>([]);
  const [avail, setAvail] = useState<AvailData>({
    template: Object.fromEntries(DAY_KEYS.map((k, i) => [k, i < 5 ? { start: "09:00", end: "18:00" } : null])),
  });
  const [lm, setLm] = useState<LMData>({ enabled: true, discount_percent: 10, window_hours: 6 });

  // Compute slot count preview for step 5
  const slotCount = Object.values(avail.template).filter(Boolean).length * 2 * 14; // approx

  const canProceed = () => {
    if (step === 1) return !!(basics.name && basics.categories.length && basics.quartier && basics.address);
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
      router.push(`/${locale}/dashboard?onboarded=1`);
    } catch { /* ignore */ } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="font-heading font-bold text-base text-dark">
              solen<span className="text-teal">.</span>ch
            </span>
            <span className="text-xs text-dark/40">Schritt {step} von {TOTAL_STEPS}</span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal rounded-full transition-all duration-500"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="px-4 py-8">
        {step === 1 && <Step1 data={basics} onChange={setBasics} />}
        {step === 2 && <Step2 data={profile} onChange={setProfile} />}
        {step === 3 && <Step3 services={services} onChange={setServices} salonCategories={basics.categories} />}
        {step === 4 && <Step4 staff={staffList} onChange={setStaffList} />}
        {step === 5 && <Step5 data={avail} onChange={setAvail} slotCount={slotCount} />}
        {step === 6 && <Step6 data={lm} onChange={setLm} />}
      </div>

      {/* Nav buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4">
        <div className="max-w-xl mx-auto flex gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-button border border-gray-200 text-sm text-dark/60 hover:text-dark transition-colors"
            >
              <ChevronLeft size={16} /> Zurück
            </button>
          )}
          <button
            type="button"
            disabled={!canProceed() || submitting}
            onClick={step < TOTAL_STEPS ? () => setStep(step + 1) : handleSubmit}
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
