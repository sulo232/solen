"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Plus, Trash2, ChevronRight, ChevronLeft, PartyPopper, Clock, Pencil, Loader2, Eye, ExternalLink, Star, MapPin } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import InteractiveHoverButton from "@/components/ui/interactive-hover-button";
import { slideSwitch } from "@/lib/animations";
import { serviceTemplates, DURATION_OPTIONS } from "@/lib/service-templates";
import type { ServiceTemplate } from "@/lib/service-templates";
import ImageUploader from "@/components/ui/ImageUploader";
import { formatCurrency } from "@/lib/format-currency";
import { validateStep, step1Schema, step2Schema, step3Schema, step4Schema, step5Schema, step6Schema } from "@/lib/registration-validation";
import AddressAutocomplete from "@/components/ui/AddressAutocomplete";
import type { SalonCategory, AgeGroup, Gender } from "@/lib/types";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

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

const TOTAL_STEPS = 7;

// ─────────────────────────────────────────
// Step wrappers
// ─────────────────────────────────────────

function StepContainer({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white/70 dark:bg-s-dm-surface/80 backdrop-blur-glass rounded-card border border-s-ink/5 dark:border-white/5 shadow-warm-md p-6 sm:p-8">
        <h2 className="font-heading font-bold text-2xl text-s-ink dark:text-s-dm-text mb-1">{title}</h2>
        {subtitle && <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 mb-6">{subtitle}</p>}
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
  phone_verified: boolean;
  tos_accepted: boolean;
  latitude: number | null;
  longitude: number | null;
  google_place_id: string;
}

type TFunc = (key: string, params?: Record<string, unknown>) => string;

function Step1({ data, onChange, errors, t, locale }: { data: BasicsData; onChange: (d: BasicsData) => void; errors: Record<string, string>; t: TFunc; locale: string }) {
  const [sending, setSending] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  const sendOtp = async () => {
    if (!data.phone || data.phone.length < 9) return;
    setSending(true);
    setVerifyError("");
    try {
      const res = await fetch("/api/auth/verify-phone/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: data.phone }),
      });
      if (res.ok) {
        setShowOtp(true);
      } else {
        const d = await res.json();
        setVerifyError(d.message || "Fehler beim Senden");
      }
    } catch {
      setVerifyError("Netzwerkfehler");
    } finally {
      setSending(false);
    }
  };

  const verifyOtp = async () => {
    if (code.length < 4) return;
    setVerifying(true);
    setVerifyError("");
    try {
      const res = await fetch("/api/auth/verify-phone/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: data.phone, code }),
      });
      if (res.ok) {
        onChange({ ...data, phone_verified: true });
        setShowOtp(false);
      } else {
        const d = await res.json();
        setVerifyError(d.message || "Falscher Code");
      }
    } catch {
      setVerifyError("Netzwerkfehler");
    } finally {
      setVerifying(false);
    }
  };

  const toggleCat = (c: SalonCategory) => {
    const next = data.categories.includes(c)
      ? data.categories.filter((x) => x !== c)
      : [...data.categories, c];
    onChange({ ...data, categories: next });
  };

  return (
    <StepContainer title={t("step1.title")} subtitle={t("step1.subtitle")}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">{t("step1.name")}</label>
          <input
            value={data.name}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
            className={`w-full px-3 py-2.5 rounded-button border text-sm text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-raised focus:outline-none focus:border-s-coral ${errors.name ? "border-s-coral" : "border-s-ink/10 dark:border-white/10"}`}
            placeholder={t("step1.namePlaceholder")}
          />
          {errors.name && <p className="text-xs text-s-coral mt-0.5">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">{t("step1.email")}</label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => onChange({ ...data, email: e.target.value })}
            className={`w-full px-3 py-2.5 rounded-button border text-sm text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-raised focus:outline-none focus:border-s-coral ${errors.email ? "border-s-coral" : "border-s-ink/10 dark:border-white/10"}`}
            placeholder={t("step1.emailPlaceholder")}
          />
          {errors.email && <p className="text-xs text-s-coral mt-0.5">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-2">{t("step1.categories")}</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => toggleCat(c.value)}
                className={[
                  "px-3 py-1.5 rounded-pill text-sm font-medium border transition-colors",
                  data.categories.includes(c.value)
                    ? "bg-s-coral text-white border-s-coral"
                    : "border-s-ink/10 dark:border-white/10 text-s-ink/60 dark:text-s-dm-text/60 hover:border-s-coral",
                ].join(" ")}
              >
                {c.label}
              </button>
            ))}
          </div>
          {errors.categories && <p className="text-xs text-s-coral mt-1">{errors.categories}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">{t("step1.quartier")}</label>
          <select
            value={data.quartier}
            onChange={(e) => onChange({ ...data, quartier: e.target.value })}
            className={`w-full px-3 py-2.5 rounded-button border text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral bg-white dark:bg-s-dm-raised ${errors.quartier ? "border-s-coral" : "border-s-ink/10 dark:border-white/10"}`}
          >
            <option value="">{t("step1.selectPlaceholder")}</option>
            {QUARTIERE.map((q) => (
              <option key={q.value} value={q.value}>{q.label}</option>
            ))}
          </select>
          {errors.quartier && <p className="text-xs text-s-coral mt-0.5">{errors.quartier}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">{t("step1.address")}</label>
          <AddressAutocomplete
            value={data.address}
            onChange={(val) => onChange({ ...data, address: val })}
            onPlaceSelect={({ formatted, lat, lng, placeId }) => onChange({ ...data, address: formatted, latitude: lat, longitude: lng, google_place_id: placeId })}
            placeholder={t("step1.addressPlaceholder")}
            hasError={!!errors.address}
          />
          {errors.address && <p className="text-xs text-s-coral mt-0.5">{errors.address}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">{t("step1.phone")}</label>
          <div className="flex gap-2">
            <input
              value={data.phone}
              onChange={(e) => {
                onChange({ ...data, phone: e.target.value, phone_verified: false }); // Reset verification on change
                setShowOtp(false);
              }}
              disabled={data.phone_verified}
              className={`flex-1 px-3 py-2.5 rounded-button border text-sm focus:outline-none focus:border-s-coral bg-white dark:bg-s-dm-raised ${data.phone_verified ? "border-green-500/50 text-green-700 dark:text-green-400" : errors.phone_verified || errors.phone ? "border-s-coral text-s-ink dark:text-s-dm-text" : "border-s-ink/10 dark:border-white/10 text-s-ink dark:text-s-dm-text"}`}
              placeholder="+41 61 000 00 00"
            />
            {data.phone_verified ? (
              <div className="flex items-center justify-center px-4 bg-green-500/10 text-green-600 dark:text-green-400 rounded-button text-sm font-medium">
                <Check size={16} className="mr-1" /> Verifiziert
              </div>
            ) : (
              <button
                type="button"
                onClick={sendOtp}
                disabled={sending || !data.phone || data.phone.length < 9}
                className="px-4 py-2.5 rounded-button bg-s-coral text-white text-sm font-medium disabled:opacity-50 hover:bg-s-coral/90 transition-colors"
              >
                {sending ? <Spinner size="sm" invert /> : "Verifizieren"}
              </button>
            )}
          </div>
          {(errors.phone || errors.phone_verified) && <p className="text-xs text-s-coral mt-1">{errors.phone || errors.phone_verified}</p>}

          {showOtp && !data.phone_verified && (
            <div className="mt-2 p-3 bg-s-coral/5 rounded-card border border-s-coral/20">
              <p className="text-xs text-s-ink/60 dark:text-s-dm-text/60 mb-2">Code per SMS erhalten?</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-24 px-3 py-2 text-center tracking-widest rounded-button border border-s-coral/30 text-sm focus:outline-none focus:border-s-coral bg-white dark:bg-s-dm-raised"
                />
                <button
                  type="button"
                  onClick={verifyOtp}
                  disabled={verifying || code.length < 4}
                  className="px-4 py-2 rounded-button bg-s-coral/10 text-s-coral text-sm font-medium disabled:opacity-50 hover:bg-s-coral/20 transition-colors"
                >
                  {verifying ? <Spinner size="sm" /> : "Code prüfen"}
                </button>
              </div>
              {verifyError && <p className="text-xs text-s-coral mt-1.5">{verifyError}</p>}
            </div>
          )}
        </div>

        {/* TOS checkbox */}
        <div className="pt-2">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={data.tos_accepted}
              onChange={(e) => onChange({ ...data, tos_accepted: e.target.checked })}
              className="mt-0.5 w-4 h-4 rounded border-s-ink/20 dark:border-white/20 accent-s-coral"
            />
            <span className="text-xs text-s-ink/60 dark:text-s-dm-text/60 leading-relaxed">
              {t("step1.tosPrefix")}{" "}
              <a href={`/${locale}/legal/terms`} target="_blank" rel="noopener noreferrer" className="text-s-coral hover:underline">{t("step1.tosLink")}</a>
              {" & "}
              <a href={`/${locale}/legal/privacy`} target="_blank" rel="noopener noreferrer" className="text-s-coral hover:underline">{t("step1.privacyLink")}</a>
            </span>
          </label>
          {errors.tos_accepted && <p className="text-xs text-s-coral mt-1 ml-6">{errors.tos_accepted}</p>}
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
  website_url: string;
  tiktok_url: string;
  opening_hours: Record<string, { open: string; close: string } | null>;
}

function Step2({ data, onChange, t }: { data: ProfileData; onChange: (d: ProfileData) => void; t: TFunc }) {
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
    <StepContainer title={t("step2.title")} subtitle={t("step2.subtitle")}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">{t("step2.coverPhoto")}</label>
          <ImageUploader
            bucket="salon-photos"
            label={t("step2.uploadCover")}
            currentImageUrl={data.cover_photo_url || undefined}
            onUpload={(url) => onChange({ ...data, cover_photo_url: url })}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50">{t("step2.gallery")}</label>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {data.gallery_urls.map((url, i) => (
              <div key={i} className="relative">
                {url ? (
                  <div className="relative rounded-card overflow-hidden border border-s-ink/10 dark:border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Galerie ${i + 1}`} className="w-full h-24 object-cover" />
                    <button
                      type="button"
                      onClick={() => onChange({ ...data, gallery_urls: data.gallery_urls.filter((_, j) => j !== i) })}
                      className="absolute top-1 right-1 p-1 rounded-full bg-white/90 dark:bg-s-dm-raised/90 text-s-ink/60 dark:text-s-dm-text/60 hover:text-s-coral"
                      aria-label={t("step2.removeImage")}
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
                className="h-24 rounded-card border-2 border-dashed border-s-ink/10 dark:border-white/10 hover:border-s-coral transition-colors flex items-center justify-center"
              >
                <Plus size={16} className="text-s-ink/30 dark:text-s-dm-text/30" />
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">{t("step2.descDe")}</label>
          <textarea
            value={data.description_de}
            onChange={(e) => onChange({ ...data, description_de: e.target.value })}
            maxLength={500}
            rows={3}
            className="w-full px-3 py-2 rounded-button border border-s-ink/10 dark:border-white/10 text-sm text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-raised focus:outline-none focus:border-s-coral resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">{t("step2.descEn")}</label>
          <textarea
            value={data.description_en}
            onChange={(e) => onChange({ ...data, description_en: e.target.value })}
            maxLength={500}
            rows={2}
            className="w-full px-3 py-2 rounded-button border border-s-ink/10 dark:border-white/10 text-sm text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-raised focus:outline-none focus:border-s-coral resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">{t("step2.instagram")}</label>
          <input
            value={data.instagram_url}
            onChange={(e) => onChange({ ...data, instagram_url: e.target.value })}
            className="w-full px-3 py-2.5 rounded-button border border-s-ink/10 dark:border-white/10 text-sm text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-raised focus:outline-none focus:border-s-coral"
            placeholder="https://instagram.com/deinsalon"
          />
          <p className="text-xs text-s-ink/30 dark:text-s-dm-text/30 mt-1">{t("step2.instagramHint")}</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">{t("step2.website")}</label>
          <input
            value={data.website_url}
            onChange={(e) => onChange({ ...data, website_url: e.target.value })}
            className="w-full px-3 py-2.5 rounded-button border border-s-ink/10 dark:border-white/10 text-sm text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-raised focus:outline-none focus:border-s-coral"
            placeholder="https://dein-salon.ch"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">{t("step2.tiktok")}</label>
          <input
            value={data.tiktok_url}
            onChange={(e) => onChange({ ...data, tiktok_url: e.target.value })}
            className="w-full px-3 py-2.5 rounded-button border border-s-ink/10 dark:border-white/10 text-sm text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-raised focus:outline-none focus:border-s-coral"
            placeholder="https://tiktok.com/@deinsalon"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-2">{t("step2.hours")}</label>
          <div className="space-y-2">
            {DAY_KEYS.map((key, i) => {
              const hours = data.opening_hours[key];
              return (
                <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => toggleDay(key)}
                    className={[
                      "w-10 text-center text-xs font-medium py-1.5 rounded-button transition-colors shrink-0",
                      hours ? "bg-s-coral text-white" : "bg-s-bg-sunken dark:bg-s-dm-raised text-s-ink/40 dark:text-s-dm-text/40",
                    ].join(" ")}
                  >
                    {DAYS[i]}
                  </button>
                  {hours ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        type="time"
                        value={hours.open}
                        onChange={(e) => updateHours(key, "open", e.target.value)}
                        className="px-2 py-1 rounded-button border border-s-ink/10 dark:border-white/10 text-xs text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-raised focus:outline-none focus:border-s-coral"
                      />
                      <span className="text-xs text-s-ink/30 dark:text-s-dm-text/30">–</span>
                      <input
                        type="time"
                        value={hours.close}
                        onChange={(e) => updateHours(key, "close", e.target.value)}
                        className="px-2 py-1 rounded-button border border-s-ink/10 dark:border-white/10 text-xs text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-raised focus:outline-none focus:border-s-coral"
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-s-ink/30 dark:text-s-dm-text/30">{t("step2.closed")}</span>
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

function Step3({ services, onChange, salonCategories, t, locale }: {
  services: ServiceDraft[];
  onChange: (s: ServiceDraft[]) => void;
  salonCategories: SalonCategory[];
  t: TFunc;
  locale: string;
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
    <StepContainer title={t("step3.title")} subtitle={t("step3.subtitle")}>
      {/* Template grid */}
      {availableTemplates.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-2">{t("step3.templates")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {availableTemplates.map((tmpl) => {
              const added = isTemplateAdded(tmpl);
              return (
                <button
                  key={`${tmpl.category}-${tmpl.name_de}`}
                  type="button"
                  disabled={added}
                  onClick={() => addFromTemplate(tmpl)}
                  className={[
                    "flex items-center justify-between px-3 py-2.5 rounded-card border text-left transition-all",
                    added
                      ? "bg-s-coral/5 border-s-coral/20 opacity-60 cursor-default"
                      : "border-s-ink/10 dark:border-white/10 hover:border-s-coral hover:bg-s-coral/5 hover:shadow-card-hover hover:-translate-y-1 cursor-pointer",
                  ].join(" ")}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-s-ink dark:text-s-dm-text truncate">{tmpl.name_de}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-s-ink/40 dark:text-s-dm-text/40">
                        <Clock size={10} /> {tmpl.duration} min
                      </span>
                      <span className="text-xs data-text font-semibold text-s-ink/60 dark:text-s-dm-text/60">{formatCurrency(tmpl.price, locale)}</span>
                    </div>
                  </div>
                  {added ? (
                    <Check size={14} className="text-s-coral shrink-0 ml-2" />
                  ) : (
                    <Plus size={14} className="text-s-coral shrink-0 ml-2" />
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
          <p className="text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-2">{t("step3.yourServices", { count: services.length })}</p>
          <div className="space-y-2">
            {services.map((s, i) => (
              <div key={i} className="flex items-center justify-between bg-s-bg-surface dark:bg-s-dm-raised rounded-card px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-s-ink dark:text-s-dm-text truncate">{s.name_de}</p>
                  <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40">{s.duration_minutes} min · {formatCurrency(s.price, locale)}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={() => startEdit(i)}
                    className="p-1.5 text-s-ink/30 dark:text-s-dm-text/30 hover:text-s-coral transition-colors"
                    aria-label={t("step3.editLabel")}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange(services.filter((_, j) => j !== i))}
                    className="p-1.5 text-s-ink/30 dark:text-s-dm-text/30 hover:text-s-coral transition-colors"
                    aria-label={t("step3.removeLabel")}
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
        <div className="border border-s-ink/10 dark:border-white/10 rounded-card p-4 space-y-3">
          <p className="text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50">
            {editingIdx !== null ? t("step3.editService") : t("step3.customService")}
          </p>
          <div>
            <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">{t("step3.nameDe")}</label>
            <input
              value={draft.name_de}
              onChange={(e) => setDraft({ ...draft, name_de: e.target.value, _autoTranslated: false })}
              onBlur={() => { if (draft.name_de && !draft._autoTranslated) autoTranslate(draft.name_de); }}
              className="w-full px-3 py-2 rounded-button border border-s-ink/10 dark:border-white/10 text-sm text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-raised focus:outline-none focus:border-s-coral"
              placeholder="z. B. Waschen + Schneiden"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">EN</label>
              <input
                value={draft.name_en}
                onChange={(e) => setDraft({ ...draft, name_en: e.target.value })}
                className="w-full px-3 py-2 rounded-button border border-s-ink/10 dark:border-white/10 text-sm text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-raised focus:outline-none focus:border-s-coral"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">FR</label>
              <input
                value={draft.name_fr}
                onChange={(e) => setDraft({ ...draft, name_fr: e.target.value })}
                className="w-full px-3 py-2 rounded-button border border-s-ink/10 dark:border-white/10 text-sm text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-raised focus:outline-none focus:border-s-coral"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">IT</label>
              <input
                value={draft.name_it}
                onChange={(e) => setDraft({ ...draft, name_it: e.target.value })}
                className="w-full px-3 py-2 rounded-button border border-s-ink/10 dark:border-white/10 text-sm text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-raised focus:outline-none focus:border-s-coral"
              />
            </div>
          </div>
          {translating && (
            <p className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40 flex items-center gap-1">
              <Loader2 size={10} className="animate-spin" /> {t("step3.translating")}
            </p>
          )}
          {draft._autoTranslated && !translating && (
            <p className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40">{t("step3.translated")}</p>
          )}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">{t("step3.category")}</label>
              <select
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value as SalonCategory })}
                className="w-full px-2 py-2 rounded-button border border-s-ink/10 dark:border-white/10 text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral bg-white dark:bg-s-dm-raised"
              >
                <option value="">{t("step3.selectCategory")}</option>
                {salonCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">{t("step3.duration")}</label>
              <select
                value={draft.duration_minutes}
                onChange={(e) => setDraft({ ...draft, duration_minutes: +e.target.value })}
                className="w-full px-2 py-2 rounded-button border border-s-ink/10 dark:border-white/10 text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral bg-white dark:bg-s-dm-raised"
              >
                {DURATION_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d} min</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">{t("step3.price")}</label>
              <input
                type="number"
                min={0}
                value={draft.price}
                onChange={(e) => setDraft({ ...draft, price: +e.target.value })}
                className="w-full px-2 py-2 rounded-button border border-s-ink/10 dark:border-white/10 text-sm text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-raised focus:outline-none focus:border-s-coral"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={cancelEdit}
              className="px-4 py-2 rounded-button border border-s-ink/10 dark:border-white/10 text-sm text-s-ink/60 dark:text-s-dm-text/60">{t("common.cancel")}</button>
            <button type="button" onClick={saveCustom} disabled={!draft.name_de || !draft.category}
              className="px-4 py-2 rounded-button bg-s-coral text-white text-sm font-medium disabled:opacity-50">
              {editingIdx !== null ? t("common.save") : t("common.add")}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => { setEditingIdx(null); setDraft(EMPTY_SERVICE); setAdding(true); }}
          className="w-full py-3 rounded-card border-2 border-dashed border-s-ink/10 dark:border-white/10 text-sm text-s-ink/40 dark:text-s-dm-text/40 hover:border-s-coral hover:text-s-coral transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={16} /> {t("step3.createCustom")}
        </button>
      )}
    </StepContainer>
  );
}

// ─────────────────────────────────────────
// Step 4 — Team
// ─────────────────────────────────────────

interface StaffDraft { name: string; avatar_url: string; role: string; tier: string; specialties: string[] }
const EMPTY_STAFF: StaffDraft = { name: "", avatar_url: "", role: "", tier: "Senior", specialties: [] };

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

function Step4({ staff, onChange, salonCategories, t }: {
  staff: StaffDraft[];
  onChange: (s: StaffDraft[]) => void;
  salonCategories: SalonCategory[];
  t: TFunc;
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
    <StepContainer title={t("step4.title")} subtitle={t("step4.subtitle")}>
      <div className="space-y-2 mb-4">
        {staff.map((s, i) => (
          <div key={i} className="flex items-center justify-between bg-s-bg-surface dark:bg-s-dm-raised rounded-card px-4 py-3">
            <div>
              <p className="text-sm font-medium text-s-ink dark:text-s-dm-text">{s.name}</p>
              <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mt-0.5">
                {[s.tier, s.role, ...s.specialties].filter(Boolean).join(" · ") || t("step4.noRole")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onChange(staff.filter((_, j) => j !== i))}
              className="text-s-ink/30 dark:text-s-dm-text/30 hover:text-s-coral transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {adding ? (
        <div className="border border-s-ink/10 dark:border-white/10 rounded-card p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">{t("step4.name")}</label>
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="w-full px-3 py-2 rounded-button border border-s-ink/10 dark:border-white/10 text-sm text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-raised focus:outline-none focus:border-s-coral"
              placeholder="z. B. Maria"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1.5">Level / Tier</label>
            <div className="flex flex-wrap gap-1.5">
              {["Junior", "Senior", "Master"].map((t) => (
                <button key={t} type="button" onClick={() => setDraft({ ...draft, tier: t })}
                  className={["px-3 py-1.5 rounded-pill text-xs font-medium transition-colors",
                    draft.tier === t ? "bg-s-ink text-white dark:bg-white dark:text-s-ink" : "bg-s-bg-sunken dark:bg-s-dm-raised text-s-ink/60 dark:text-s-dm-text/60 hover:bg-s-ink/5",
                  ].join(" ")}
                >{t}</button>
              ))}
            </div>
          </div>

          {roles.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1.5">{t("step4.role")}</label>
              <div className="flex flex-wrap gap-1.5">
                {roles.map((r) => (
                  <button key={r} type="button" onClick={() => setDraft({ ...draft, role: draft.role === r ? "" : r })}
                    className={["px-2.5 py-1 rounded-pill text-xs border transition-colors",
                      draft.role === r ? "bg-s-coral text-white border-s-coral" : "border-s-ink/10 dark:border-white/10 text-s-ink/50 dark:text-s-dm-text/50 hover:border-s-coral",
                    ].join(" ")}
                  >{r}</button>
                ))}
              </div>
            </div>
          )}

          {specialties.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1.5">{t("step4.specialties")}</label>
              <div className="flex flex-wrap gap-1.5">
                {specialties.map((s) => (
                  <button key={s} type="button" onClick={() => toggleSpecialty(s)}
                    className={["px-2.5 py-1 rounded-pill text-xs border transition-colors",
                      draft.specialties.includes(s) ? "bg-s-coral/10 text-s-coral border-s-coral/30" : "border-s-ink/10 dark:border-white/10 text-s-ink/40 dark:text-s-dm-text/40 hover:border-s-coral",
                    ].join(" ")}
                  >{s}</button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button type="button" onClick={() => { setAdding(false); setDraft(EMPTY_STAFF); }}
              className="px-4 py-2 rounded-button border border-s-ink/10 dark:border-white/10 text-sm text-s-ink/60 dark:text-s-dm-text/60">{t("common.cancel")}</button>
            <button type="button" onClick={save} disabled={!draft.name}
              className="px-4 py-2 rounded-button bg-s-coral text-white text-sm font-medium disabled:opacity-50">{t("common.add")}</button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <button type="button" onClick={() => setAdding(true)}
            className="w-full py-3 rounded-card border-2 border-dashed border-s-ink/10 dark:border-white/10 text-sm text-s-ink/40 dark:text-s-dm-text/40 hover:border-s-coral hover:text-s-coral transition-colors flex items-center justify-center gap-2">
            <Plus size={16} /> {t("step4.addStaff")}
          </button>
          {staff.length === 0 && (
            <button type="button" onClick={() => onChange([{ name: "Nur ich", avatar_url: "", role: "Inhaber:in", specialties: [] }])}
              className="w-full py-2 rounded-button text-sm text-s-ink/40 dark:text-s-dm-text/40 hover:text-s-coral transition-colors">
              {t("step4.solo")}
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

function Step5({ data, onChange, slotCount, t }: {
  data: AvailData;
  onChange: (d: AvailData) => void;
  slotCount: number;
  t: TFunc;
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
    <StepContainer title={t("step5.title")} subtitle={t("step5.subtitle")}>
      <div className="space-y-3 mb-6">
        {DAY_KEYS.map((key, i) => {
          const slot = data.template[key];
          return (
            <div key={key}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <button type="button" onClick={() => toggleDay(key)}
                  className={["w-10 text-center text-xs font-medium py-1.5 rounded-button transition-colors shrink-0",
                    slot ? "bg-s-coral text-white" : "bg-s-bg-sunken dark:bg-s-dm-raised text-s-ink/40 dark:text-s-dm-text/40"].join(" ")}>
                  {DAYS[i]}
                </button>
                {slot ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <input type="time" value={slot.start}
                      onChange={(e) => onChange({ template: { ...data.template, [key]: { ...slot, start: e.target.value } } })}
                      className="px-2 py-1 rounded-button border border-s-ink/10 dark:border-white/10 text-xs text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-raised focus:outline-none focus:border-s-coral" />
                    <span className="text-xs text-s-ink/30 dark:text-s-dm-text/30">–</span>
                    <input type="time" value={slot.end}
                      onChange={(e) => onChange({ template: { ...data.template, [key]: { ...slot, end: e.target.value } } })}
                      className="px-2 py-1 rounded-button border border-s-ink/10 dark:border-white/10 text-xs text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-raised focus:outline-none focus:border-s-coral" />
                    <button type="button" onClick={() => addBreak(key)}
                      className="text-[10px] text-s-coral hover:underline shrink-0 ml-1">
                      {t("step5.addBreak")}
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-s-ink/30 dark:text-s-dm-text/30">{t("step5.unavailable")}</span>
                )}
              </div>
              {/* Break rows */}
              {slot?.breaks?.map((brk, bi) => (
                <div key={bi} className="flex items-center gap-2 ml-[52px] mt-1.5">
                  <span className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40 w-10 shrink-0">{t("step5.break")}</span>
                  <input type="time" value={brk.start}
                    onChange={(e) => updateBreak(key, bi, "start", e.target.value)}
                    className="px-1.5 py-0.5 rounded-button border border-s-coral/30 text-xs text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-raised focus:outline-none focus:border-s-coral" />
                  <span className="text-xs text-s-ink/30 dark:text-s-dm-text/30">–</span>
                  <input type="time" value={brk.end}
                    onChange={(e) => updateBreak(key, bi, "end", e.target.value)}
                    className="px-1.5 py-0.5 rounded-button border border-s-coral/30 text-xs text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-raised focus:outline-none focus:border-s-coral" />
                  <button type="button" onClick={() => removeBreak(key, bi)}
                    className="text-s-ink/30 dark:text-s-dm-text/30 hover:text-s-coral transition-colors">
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      {slotCount > 0 && (
        <div className="bg-s-coral/5 border border-s-coral/20 rounded-card px-4 py-3 text-sm text-s-coral font-medium">
          {t("step5.slotsCreated", { count: slotCount })}
        </div>
      )}
    </StepContainer>
  );
}

// ─────────────────────────────────────────
// Step 6 — Last-Minute Settings
// ─────────────────────────────────────────

interface LMData { enabled: boolean; discount_percent: number; window_hours: number; cancellation_policy: string }

function Step6({ data, onChange, t }: { data: LMData; onChange: (d: LMData) => void; t: TFunc }) {
  return (
    <StepContainer title={t("step6.title")} subtitle={t("step6.subtitle")}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-s-ink dark:text-s-dm-text">{t("step6.enable")}</p>
            <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mt-0.5">
              {t("step6.enableDesc")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange({ ...data, enabled: !data.enabled })}
            className={["w-11 h-6 rounded-full transition-colors relative",
              data.enabled ? "bg-s-coral" : "bg-s-sand"].join(" ")}
          >
            <span className={["absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform",
              data.enabled ? "translate-x-[22px]" : "translate-x-[2px]"].join(" ")} />
          </button>
        </div>

        {data.enabled && (
          <>
            <div>
              <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-2">Stornierungsrichtlinie</label>
              <div className="space-y-2">
                {[
                  { id: "flexible", label: "Flexibel", desc: "Kostenfreie Stornierung bis 2h vor Termin." },
                  { id: "moderate", label: "Moderat", desc: "Kostenfreie Stornierung bis 24h vor Termin." },
                  { id: "strict", label: "Strikt", desc: "Kostenfreie Stornierung bis 48h vor Termin." }
                ].map((pol) => (
                  <label key={pol.id} className={[
                    "flex items-start gap-3 p-3 rounded-card border cursor-pointer transition-colors",
                    data.cancellation_policy === pol.id ? "border-s-coral bg-s-coral/5" : "border-s-ink/10 dark:border-white/10 hover:border-s-coral hover:bg-s-coral/5"
                  ].join(" ")}>
                    <input type="radio" value={pol.id} checked={data.cancellation_policy === pol.id}
                      onChange={(e) => onChange({ ...data, cancellation_policy: e.target.value })}
                      className="mt-1 w-4 h-4 text-s-coral accent-s-coral" />
                    <div>
                      <p className="text-sm font-medium text-s-ink dark:text-s-dm-text">{pol.label}</p>
                      <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50">{pol.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="h-px w-full bg-s-ink/5 dark:bg-white/5 my-2"></div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50">{t("step6.discount")}</label>
                <span className="text-sm font-bold text-s-coral data-text">{data.discount_percent}%</span>
              </div>
              <input type="range" min={5} max={50} step={5} value={data.discount_percent}
                onChange={(e) => onChange({ ...data, discount_percent: +e.target.value })}
                className="w-full accent-s-coral" />
              <div className="flex justify-between text-xs text-s-ink/30 dark:text-s-dm-text/30 mt-1">
                <span>5%</span><span>50%</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50">{t("step6.window")}</label>
                <span className="text-sm font-bold text-s-coral data-text">{data.window_hours}h</span>
              </div>
              <input type="range" min={2} max={24} step={1} value={data.window_hours}
                onChange={(e) => onChange({ ...data, window_hours: +e.target.value })}
                className="w-full accent-s-coral" />
              <div className="flex justify-between text-xs text-s-ink/30 dark:text-s-dm-text/30 mt-1">
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
// Step 7 — Review
// ─────────────────────────────────────────

function Step7({ basics, profile, services, staffList, avail, lm, onEdit, t }: {
  basics: BasicsData;
  profile: ProfileData;
  services: ServiceDraft[];
  staffList: StaffDraft[];
  avail: AvailData;
  lm: LMData;
  onEdit: (step: number) => void;
  t: TFunc;
}) {
  const activeDays = Object.values(avail.template).filter(Boolean).length;
  return (
    <StepContainer title={t("step7.title")} subtitle={t("step7.subtitle")}>
      <div className="bg-white dark:bg-s-dm-surface rounded-card overflow-hidden border border-s-ink/5 dark:border-white/5 shadow-card relative mb-6">
        {/* Cover Photo Area */}
        <div className="aspect-[4/3] w-full bg-s-bg-sunken dark:bg-s-dm-raised relative">
          {profile.cover_photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.cover_photo_url} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-s-ink/20 dark:text-s-dm-text/20">
              <span className="text-sm font-medium">Kein Titelbild</span>
            </div>
          )}
          
          {/* Top Rated Badge Mock */}
          <div className="absolute top-3 left-3 bg-s-yellow-subtle text-s-yellow-text px-2 py-1 rounded-pill text-[10px] font-bold uppercase tracking-wider backdrop-blur-glass flex items-center gap-1">
            <Star size={10} className="fill-current" /> Neu
          </div>
        </div>

        {/* Card Content Area */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-heading font-bold text-lg text-s-ink dark:text-s-dm-text">{basics.name || "Dein Salon"}</h3>
              <p className="text-xs text-s-ink/60 dark:text-s-dm-text/60 flex items-center gap-1 mt-0.5">
                <MapPin size={12} /> {basics.quartier ? basics.quartier.charAt(0).toUpperCase() + basics.quartier.slice(1) : "Standort"}
              </p>
            </div>
            {/* Rating Mock */}
            <div className="flex items-center gap-1 bg-s-ink/5 dark:bg-white/5 px-1.5 py-0.5 rounded text-xs font-semibold data-text">
              <Star size={10} className="fill-s-ink dark:fill-s-dm-text opacity-40" /> —
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {basics.categories.length > 0 ? basics.categories.map(c => (
              <span key={c} className="px-2 py-0.5 border border-s-ink/5 dark:border-white/5 bg-s-bg-base dark:bg-s-dm-bg rounded-pill text-[10px] text-s-ink/70 dark:text-s-dm-text/70">{c}</span>
            )) : <span className="px-2 py-0.5 border border-s-ink/5 dark:border-white/5 bg-s-bg-base dark:bg-s-dm-bg rounded-pill text-[10px] text-s-ink/40 dark:text-s-dm-text/40">Kategorie fehlt</span>}
          </div>
          
          <div className="h-px w-full bg-s-ink/5 dark:bg-white/5 mb-3"></div>
          
          <div className="flex gap-4 text-xs text-s-ink/60 dark:text-s-dm-text/60">
            <div><span className="font-semibold text-s-ink dark:text-s-dm-text data-text">{services.length}</span> Services</div>
            <div><span className="font-semibold text-s-ink dark:text-s-dm-text data-text">{staffList.length}</span> Team</div>
            <div><span className="font-semibold text-s-ink dark:text-s-dm-text data-text">{activeDays}</span> Tage offen</div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 uppercase tracking-wider mb-3">Abschnitte bearbeiten</p>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => onEdit(1)} className="p-3 text-left rounded-button border border-s-ink/5 dark:border-white/5 hover:border-s-coral hover:bg-s-coral/5 transition-colors text-sm text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-raised flex justify-between items-center group">
            {t("step7.basics")} <Pencil size={12} className="text-s-ink/20 group-hover:text-s-coral transition-colors" />
          </button>
          <button type="button" onClick={() => onEdit(2)} className="p-3 text-left rounded-button border border-s-ink/5 dark:border-white/5 hover:border-s-coral hover:bg-s-coral/5 transition-colors text-sm text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-raised flex justify-between items-center group">
            {t("step7.profile")} <Pencil size={12} className="text-s-ink/20 group-hover:text-s-coral transition-colors" />
          </button>
          <button type="button" onClick={() => onEdit(3)} className="p-3 text-left rounded-button border border-s-ink/5 dark:border-white/5 hover:border-s-coral hover:bg-s-coral/5 transition-colors text-sm text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-raised flex justify-between items-center group">
            {t("step7.services")} <Pencil size={12} className="text-s-ink/20 group-hover:text-s-coral transition-colors" />
          </button>
          <button type="button" onClick={() => onEdit(4)} className="p-3 text-left rounded-button border border-s-ink/5 dark:border-white/5 hover:border-s-coral hover:bg-s-coral/5 transition-colors text-sm text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-raised flex justify-between items-center group">
            {t("step7.team")} <Pencil size={12} className="text-s-ink/20 group-hover:text-s-coral transition-colors" />
          </button>
          <button type="button" onClick={() => onEdit(5)} className="p-3 text-left rounded-button border border-s-ink/5 dark:border-white/5 hover:border-s-coral hover:bg-s-coral/5 transition-colors text-sm text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-raised flex justify-between items-center group">
            {t("step7.availability")} <Pencil size={12} className="text-s-ink/20 group-hover:text-s-coral transition-colors" />
          </button>
          <button type="button" onClick={() => onEdit(6)} className="p-3 text-left rounded-button border border-s-ink/5 dark:border-white/5 hover:border-s-coral hover:bg-s-coral/5 transition-colors text-sm text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-raised flex justify-between items-center group">
            {t("step7.lastMinute")} <Pencil size={12} className="text-s-ink/20 group-hover:text-s-coral transition-colors" />
          </button>
        </div>
      </div>
    </StepContainer>
  );
}

// ─────────────────────────────────────────
// Main Wizard
// ─────────────────────────────────────────

export default function SalonOnboardingPage() {
  const locale = useLocale();
  const t = useTranslations("salonRegistration");
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState<1 | -1>(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [returnToReview, setReturnToReview] = useState(false);

  const goNext = () => {
    const errors = validateCurrentStep();
    if (Object.keys(errors).length > 0) {
      setStepErrors(errors);
      return;
    }
    setStepErrors({});
    if (returnToReview) {
      setReturnToReview(false);
      setDir(1);
      setStep(7);
      return;
    }
    setDir(1);
    setStep((s) => s + 1);
  };
  const goPrev = () => { setStepErrors({}); setDir(-1); setStep((s) => s - 1); };

  const onEditStep = (targetStep: number) => {
    setReturnToReview(true);
    setDir(-1);
    setStep(targetStep);
  };

  const validateCurrentStep = (): Record<string, string> => {
    if (step === 1) return validateStep(step1Schema, basics);
    if (step === 2) return validateStep(step2Schema, profile);
    if (step === 3) return validateStep(step3Schema, { services });
    if (step === 4) return validateStep(step4Schema, { staff: staffList });
    if (step === 5) return validateStep(step5Schema, avail);
    if (step === 6) return validateStep(step6Schema, lm);
    return {};
  };

  const [basics, setBasics] = useState<BasicsData>({
    name: "", email: "", categories: [], quartier: "", address: "", phone: "", phone_verified: false,
    tos_accepted: false, latitude: null, longitude: null, google_place_id: "",
  });
  const [profile, setProfile] = useState<ProfileData>({
    cover_photo_url: "", gallery_urls: [], description_de: "", description_en: "",
    instagram_url: "", website_url: "", tiktok_url: "",
    opening_hours: Object.fromEntries(DAY_KEYS.map((k, i) => [k, i < 5 ? { open: "09:00", close: "18:00" } : null])),
  });
  const [services, setServices] = useState<ServiceDraft[]>([]);
  const [staffList, setStaffList] = useState<StaffDraft[]>([]);
  const [avail, setAvail] = useState<AvailData>({
    template: Object.fromEntries(DAY_KEYS.map((k, i) => [k, i < 5 ? { start: "09:00", end: "18:00", breaks: [] } : null])),
  });
  const [lm, setLm] = useState<LMData>({ enabled: true, discount_percent: 10, window_hours: 6, cancellation_policy: "flexible" });

  // Restore wizard state from sessionStorage on mount
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("solen_wizard");
      if (saved) {
        const data = JSON.parse(saved);
        if (data.basics) setBasics(data.basics);
        if (data.profile) setProfile(data.profile);
        if (data.services) setServices(data.services);
        if (data.staffList) setStaffList(data.staffList);
        if (data.avail) setAvail(data.avail);
        if (data.lm) setLm(data.lm);
        if (data.step) setStep(data.step);
      }
    } catch { /* ignore corrupted data */ }
    setHydrated(true);
  }, []);

  // Save wizard state to sessionStorage on changes
  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem("solen_wizard", JSON.stringify({ basics, profile, services, staffList, avail, lm, step }));
    } catch { /* storage full */ }
  }, [hydrated, basics, profile, services, staffList, avail, lm, step]);

  // Pre-fill email from authenticated user (Google OAuth or existing session)
  useEffect(() => {
    const sb = createBrowserSupabaseClient();
    sb.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user;
      if (user?.email && !basics.email) {
        setBasics((prev) => ({ ...prev, email: user.email! }));
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute slot count preview for step 5
  const slotCount = Object.values(avail.template).filter(Boolean).length * 2 * 14; // approx

  const canProceed = () => {
    if (step === 1) return !!(basics.name && basics.email && basics.categories.length && basics.quartier && basics.address && basics.tos_accepted);
    if (step === 2) return !!profile.cover_photo_url;
    if (step === 3) return services.length >= 1;
    if (step === 4) return staffList.length >= 1;
    if (step === 7) return true; // review step is always valid
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
          cancellation_policy: lm.cancellation_policy,
          tos_accepted: basics.tos_accepted,
        }),
      });
      sessionStorage.removeItem("solen_wizard");
      setDone(true);
      setTimeout(() => router.push(`/${locale}/dashboard?onboarded=1`), 2200);
    } catch { /* ignore */ } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-s-coral/5 via-white to-s-coral/5 dark:from-s-dm-bg dark:via-s-dm-bg dark:to-s-dm-bg pb-36">
      {/* Celebration overlay */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 dark:bg-s-dm-bg/90 backdrop-blur-lg"
          >
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="flex flex-col items-center gap-4 text-center px-6"
            >
              <div className="w-20 h-20 rounded-full bg-s-coral/10 flex items-center justify-center">
                <PartyPopper size={36} className="text-s-coral" />
              </div>
              <h2 className="font-heading font-bold text-2xl text-s-ink dark:text-s-dm-text">{t("done.title")}</h2>
              <p className="text-s-ink/50 dark:text-s-dm-text/50 text-sm max-w-xs">{t("done.subtitle")}</p>
              <div className="flex gap-1.5 mt-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    className="w-2 h-2 rounded-full bg-s-coral"
                  />
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-s-ink/5 dark:border-white/5 w-full">
                <p className="text-xs font-medium text-s-ink dark:text-s-dm-text mb-2 text-left">Nächster Schritt:</p>
                <a href={`/${locale}/dashboard/settings/payments`} className="flex items-center gap-2 p-3 rounded-card bg-[#635BFF] text-white text-sm font-medium hover:bg-[#524BFF] transition-colors shadow-warm-md w-full justify-between">
                  <span>Stripe Connect einrichten (Auszahlungen)</span>
                  <ExternalLink size={16} />
                </a>
                <p className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40 mt-2 text-left">Pflichtfeld, um Vorauszahlungen bei Buchungen empfangen zu können.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-white/80 dark:bg-s-dm-surface/80 backdrop-blur-lg border-b border-s-ink/5 dark:border-white/5 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="font-heading font-bold text-base text-s-ink dark:text-s-dm-text">
              solen<span className="text-s-coral">.</span>ch
            </span>
            <span className="text-xs text-s-ink/40 dark:text-s-dm-text/40">{t("header.stepOf", { step, total: TOTAL_STEPS })}</span>
          </div>
          {/* Progress Segment Line */}
          <div className="flex items-center gap-1 mt-1 bg-s-bg-sunken dark:bg-s-dm-raised rounded-full p-1" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={TOTAL_STEPS} aria-label={t("header.stepOf", { step, total: TOTAL_STEPS })}>
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div
                key={i}
                className={[
                  "h-1.5 rounded-full transition-all duration-300 flex-1",
                  i < step ? "bg-s-coral" : "bg-transparent",
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
            {step === 1 && <Step1 data={basics} onChange={setBasics} errors={stepErrors} t={t} locale={locale} />}
            {step === 2 && <Step2 data={profile} onChange={setProfile} t={t} />}
            {step === 3 && <Step3 services={services} onChange={setServices} salonCategories={basics.categories} t={t} locale={locale} />}
            {step === 4 && <Step4 staff={staffList} onChange={setStaffList} salonCategories={basics.categories} t={t} />}
            {step === 5 && <Step5 data={avail} onChange={setAvail} slotCount={slotCount} t={t} />}
            {step === 6 && <Step6 data={lm} onChange={setLm} t={t} />}
            {step === 7 && <Step7 basics={basics} profile={profile} services={services} staffList={staffList} avail={avail} lm={lm} onEdit={onEditStep} t={t} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Nav buttons */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-s-dm-surface/80 backdrop-blur-lg border-t border-s-ink/5 dark:border-white/5 px-4 py-4" aria-label="Wizard navigation">
        <div className="max-w-xl mx-auto flex gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={goPrev}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-button border border-s-ink/10 dark:border-white/10 text-sm text-s-ink/60 dark:text-s-dm-text/60 hover:text-s-ink dark:hover:text-s-dm-text transition-colors"
            >
              <ChevronLeft size={16} /> {t("nav.back")}
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <button
              type="button"
              disabled={submitting}
              onClick={goNext}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-button bg-s-coral text-white text-sm font-medium hover:bg-s-coral-hover transition-colors shadow-warm-sm disabled:opacity-50 group"
            >
              {submitting && <Spinner size="sm" invert />}
              <span>{t("nav.next")}</span>
              <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
          ) : (
            <div className="flex-1" onClick={submitting ? undefined : handleSubmit}>
              <InteractiveHoverButton
                text={submitting ? "..." : t("nav.create")}
                className="w-full bg-s-coral text-white shadow-coral-glow"
              />
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}
