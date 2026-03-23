"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronLeft, PartyPopper, Loader2, Sparkles } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import InteractiveHoverButton from "@/components/ui/interactive-hover-button";
import { slideSwitch } from "@/lib/animations";
import { serviceTemplates } from "@/lib/service-templates";
import AddressAutocomplete from "@/components/ui/AddressAutocomplete";
import type { SalonCategory } from "@/lib/types";
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

const TOTAL_STEPS = 3;

// ─────────────────────────────────────────
// Shared wrapper
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
  tos_accepted: boolean;
  latitude: number | null;
  longitude: number | null;
  google_place_id: string;
}

function Step1Basics({
  data,
  onChange,
  errors,
  locale,
}: {
  data: BasicsData;
  onChange: (d: BasicsData) => void;
  errors: Record<string, string>;
  locale: string;
}) {
  const toggleCat = (c: SalonCategory) => {
    const next = data.categories.includes(c)
      ? data.categories.filter((x) => x !== c)
      : [...data.categories, c];
    onChange({ ...data, categories: next });
  };

  return (
    <StepContainer title="Dein Salon" subtitle="Erzähl uns das Wichtigste über deinen Betrieb.">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">Salon-Name *</label>
          <input
            value={data.name}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
            className={`w-full px-3 py-2.5 rounded-button border text-sm text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-raised focus:outline-none focus:border-s-coral ${errors.name ? "border-s-coral" : "border-s-ink/10 dark:border-white/10"}`}
            placeholder="z. B. Salon Belle"
          />
          {errors.name && <p className="text-xs text-s-coral mt-0.5">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">E-Mail *</label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => onChange({ ...data, email: e.target.value })}
            className={`w-full px-3 py-2.5 rounded-button border text-sm text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-raised focus:outline-none focus:border-s-coral ${errors.email ? "border-s-coral" : "border-s-ink/10 dark:border-white/10"}`}
            placeholder="salon@beispiel.ch"
          />
          {errors.email && <p className="text-xs text-s-coral mt-0.5">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-2">Kategorie(n) *</label>
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
          <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">Quartier *</label>
          <select
            value={data.quartier}
            onChange={(e) => onChange({ ...data, quartier: e.target.value })}
            className={`w-full px-3 py-2.5 rounded-button border text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral bg-white dark:bg-s-dm-raised ${errors.quartier ? "border-s-coral" : "border-s-ink/10 dark:border-white/10"}`}
          >
            <option value="">Quartier wählen</option>
            {QUARTIERE.map((q) => (
              <option key={q.value} value={q.value}>{q.label}</option>
            ))}
          </select>
          {errors.quartier && <p className="text-xs text-s-coral mt-0.5">{errors.quartier}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">Adresse *</label>
          <AddressAutocomplete
            value={data.address}
            onChange={(val) => onChange({ ...data, address: val })}
            onPlaceSelect={({ formatted, lat, lng, placeId }) =>
              onChange({ ...data, address: formatted, latitude: lat, longitude: lng, google_place_id: placeId })
            }
            placeholder="Musterstrasse 1, Basel"
            hasError={!!errors.address}
          />
          {errors.address && <p className="text-xs text-s-coral mt-0.5">{errors.address}</p>}
        </div>

        <div className="pt-2">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={data.tos_accepted}
              onChange={(e) => onChange({ ...data, tos_accepted: e.target.checked })}
              className="mt-0.5 w-4 h-4 rounded border-s-ink/20 dark:border-white/20 accent-s-coral"
            />
            <span className="text-xs text-s-ink/60 dark:text-s-dm-text/60 leading-relaxed">
              Ich akzeptiere die{" "}
              <a href={`/${locale}/legal/terms`} target="_blank" rel="noopener noreferrer" className="text-s-coral hover:underline">AGB</a>
              {" & "}
              <a href={`/${locale}/legal/privacy`} target="_blank" rel="noopener noreferrer" className="text-s-coral hover:underline">Datenschutzerklärung</a>
            </span>
          </label>
          {errors.tos_accepted && <p className="text-xs text-s-coral mt-1 ml-6">{errors.tos_accepted}</p>}
        </div>
      </div>
    </StepContainer>
  );
}

// ─────────────────────────────────────────
// Step 2 — Phone Verification
// ─────────────────────────────────────────

interface PhoneData {
  phone: string;
  phone_verified: boolean;
}

function Step2Phone({
  data,
  onChange,
  errors,
}: {
  data: PhoneData;
  onChange: (d: PhoneData) => void;
  errors: Record<string, string>;
}) {
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

  return (
    <StepContainer title="Telefon verifizieren" subtitle="Wir schicken dir einen Code per SMS — dauert 10 Sekunden.">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">Telefonnummer *</label>
          <div className="flex gap-2">
            <input
              value={data.phone}
              onChange={(e) => {
                onChange({ ...data, phone: e.target.value, phone_verified: false });
                setShowOtp(false);
                setCode("");
              }}
              disabled={data.phone_verified}
              className={`flex-1 px-3 py-2.5 rounded-button border text-sm focus:outline-none focus:border-s-coral bg-white dark:bg-s-dm-raised ${
                data.phone_verified
                  ? "border-green-500/50 text-green-700 dark:text-green-400"
                  : errors.phone_verified || errors.phone
                  ? "border-s-coral text-s-ink dark:text-s-dm-text"
                  : "border-s-ink/10 dark:border-white/10 text-s-ink dark:text-s-dm-text"
              }`}
              placeholder="+41 61 000 00 00"
            />
            {data.phone_verified ? (
              <div className="flex items-center justify-center px-4 bg-green-500/10 text-green-600 dark:text-green-400 rounded-button text-sm font-medium gap-1">
                <Check size={16} /> Verifiziert
              </div>
            ) : (
              <button
                type="button"
                onClick={sendOtp}
                disabled={sending || !data.phone || data.phone.length < 9}
                className="px-4 py-2.5 rounded-button bg-s-coral text-white text-sm font-medium disabled:opacity-50 hover:bg-s-coral/90 transition-colors"
              >
                {sending ? <Spinner size="sm" invert /> : "Code senden"}
              </button>
            )}
          </div>
          {(errors.phone || errors.phone_verified) && (
            <p className="text-xs text-s-coral mt-1">{errors.phone || errors.phone_verified}</p>
          )}
        </div>

        {showOtp && !data.phone_verified && (
          <div className="p-4 bg-s-coral/5 rounded-card border border-s-coral/20">
            <p className="text-xs text-s-ink/60 dark:text-s-dm-text/60 mb-3">Code per SMS erhalten?</p>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-28 px-3 py-2 text-center tracking-widest rounded-button border border-s-coral/30 text-sm focus:outline-none focus:border-s-coral bg-white dark:bg-s-dm-raised"
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

        {data.phone_verified && (
          <div className="flex items-center gap-2 p-3 bg-green-500/5 rounded-card border border-green-500/20">
            <Check size={16} className="text-green-600 shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-400">Telefonnummer erfolgreich verifiziert!</p>
          </div>
        )}
      </div>
    </StepContainer>
  );
}

// ─────────────────────────────────────────
// Step 3 — Quick Win Service
// ─────────────────────────────────────────

interface QuickServiceData {
  name_de: string;
  duration_minutes: number;
  price: number;
}

function Step3QuickWin({
  data,
  onChange,
  categories,
}: {
  data: QuickServiceData | null;
  onChange: (d: QuickServiceData | null) => void;
  categories: SalonCategory[];
}) {
  // Derive top suggestions from the first selected category
  const primaryCategory = categories[0];
  const suggestions = primaryCategory ? (serviceTemplates[primaryCategory] ?? []).slice(0, 4) : [];

  const [form, setForm] = useState<QuickServiceData>(
    data ?? { name_de: "", duration_minutes: 60, price: 80 }
  );

  const applySuggestion = (s: { name_de: string; duration: number; price: number }) => {
    const next = { name_de: s.name_de, duration_minutes: s.duration, price: s.price };
    setForm(next);
    onChange(next);
  };

  const handleChange = (patch: Partial<QuickServiceData>) => {
    const next = { ...form, ...patch };
    setForm(next);
    onChange(next.name_de ? next : null);
  };

  return (
    <StepContainer title="Erster Service" subtitle="Was buchst du am häufigsten? Tippe selbst oder wähle einen Vorschlag.">
      <div className="space-y-4">
        {suggestions.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles size={13} className="text-s-coral" />
              <p className="text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50">Schnellauswahl</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s.name_de}
                  type="button"
                  onClick={() => applySuggestion(s)}
                  className={[
                    "px-3 py-1.5 rounded-pill text-sm border transition-colors",
                    form.name_de === s.name_de
                      ? "bg-s-coral text-white border-s-coral"
                      : "border-s-ink/10 dark:border-white/10 text-s-ink/70 dark:text-s-dm-text/70 hover:border-s-coral",
                  ].join(" ")}
                >
                  {s.name_de}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">Service-Name</label>
          <input
            value={form.name_de}
            onChange={(e) => handleChange({ name_de: e.target.value })}
            className="w-full px-3 py-2.5 rounded-button border border-s-ink/10 dark:border-white/10 text-sm text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-raised focus:outline-none focus:border-s-coral"
            placeholder="z. B. Waschen, Schneiden, Föhnen"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">Dauer (Min)</label>
            <select
              value={form.duration_minutes}
              onChange={(e) => handleChange({ duration_minutes: +e.target.value })}
              className="w-full px-3 py-2.5 rounded-button border border-s-ink/10 dark:border-white/10 text-sm text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-raised focus:outline-none focus:border-s-coral"
            >
              {[15, 30, 45, 60, 75, 90, 120].map((v) => (
                <option key={v} value={v}>{v} Min</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">Preis (CHF)</label>
            <input
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => handleChange({ price: +e.target.value })}
              className="w-full px-3 py-2.5 rounded-button border border-s-ink/10 dark:border-white/10 text-sm text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-raised focus:outline-none focus:border-s-coral"
            />
          </div>
        </div>

        <p className="text-xs text-s-ink/30 dark:text-s-dm-text/30">
          Du kannst Services jederzeit im Dashboard ergänzen oder ändern.
        </p>
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

  const [basics, setBasics] = useState<BasicsData>({
    name: "", email: "", categories: [], quartier: "", address: "",
    tos_accepted: false, latitude: null, longitude: null, google_place_id: "",
  });
  const [phone, setPhone] = useState<PhoneData>({ phone: "", phone_verified: false });
  const [quickService, setQuickService] = useState<QuickServiceData | null>(null);

  // Pre-fill email from authenticated session
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

  // Persist state to sessionStorage
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("solen_wizard_v3");
      if (saved) {
        const data = JSON.parse(saved);
        if (data.basics) setBasics(data.basics);
        if (data.phone) setPhone(data.phone);
        if (data.quickService) setQuickService(data.quickService);
        if (data.step) setStep(data.step);
      }
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem("solen_wizard_v3", JSON.stringify({ basics, phone, quickService, step }));
    } catch { /* storage full */ }
  }, [hydrated, basics, phone, quickService, step]);

  const validateCurrentStep = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (step === 1) {
      if (!basics.name || basics.name.length < 2) errs.name = "Name muss mindestens 2 Zeichen haben";
      if (!basics.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(basics.email)) errs.email = "Ungültige E-Mail-Adresse";
      if (!basics.categories.length) errs.categories = "Wähle mindestens eine Kategorie";
      if (!basics.quartier) errs.quartier = "Wähle ein Quartier";
      if (!basics.address || basics.address.length < 5) errs.address = "Adresse ist zu kurz";
      if (!basics.tos_accepted) errs.tos_accepted = "Bitte akzeptiere die AGB und Datenschutzerklärung";
    }
    if (step === 2) {
      if (!phone.phone_verified) errs.phone_verified = "Bitte verifiziere deine Telefonnummer";
    }
    return errs;
  };

  const goNext = () => {
    const errs = validateCurrentStep();
    if (Object.keys(errs).length > 0) {
      setStepErrors(errs);
      return;
    }
    setStepErrors({});
    setDir(1);
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
    } else {
      handleSubmit();
    }
  };

  const goPrev = () => {
    setStepErrors({});
    setDir(-1);
    setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const services = quickService?.name_de
        ? [{ ...quickService, category: basics.categories[0] ?? "coiffeur" }]
        : [];

      await fetch("/api/salons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...basics,
          phone: phone.phone,
          phone_verified: phone.phone_verified,
          tos_accepted: basics.tos_accepted,
          services,
        }),
      });
      sessionStorage.removeItem("solen_wizard_v3");
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
              <h2 className="font-heading font-bold text-2xl text-s-ink dark:text-s-dm-text">
                {t("done.title")}
              </h2>
              <p className="text-s-ink/50 dark:text-s-dm-text/50 text-sm max-w-xs">
                {t("done.subtitle")}
              </p>
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
            <span className="text-xs text-s-ink/40 dark:text-s-dm-text/40">
              Schritt {step} von {TOTAL_STEPS}
            </span>
          </div>
          <div
            className="flex items-center gap-1 mt-1 bg-s-bg-sunken dark:bg-s-dm-raised rounded-full p-1"
            role="progressbar"
            aria-valuenow={step}
            aria-valuemin={1}
            aria-valuemax={TOTAL_STEPS}
          >
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

      {/* Step content */}
      <div className="px-4 pt-8">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={slideSwitch}
            initial="enter"
            animate="center"
            exit="exit"
          >
            {step === 1 && (
              <Step1Basics data={basics} onChange={setBasics} errors={stepErrors} locale={locale} />
            )}
            {step === 2 && (
              <Step2Phone data={phone} onChange={setPhone} errors={stepErrors} />
            )}
            {step === 3 && (
              <Step3QuickWin data={quickService} onChange={setQuickService} categories={basics.categories} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-s-dm-surface/90 backdrop-blur-lg border-t border-s-ink/5 dark:border-white/5 px-4 py-4 safe-area-pb">
        <div className="max-w-xl mx-auto flex gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={goPrev}
              className="flex items-center gap-1.5 px-4 py-3 rounded-button border border-s-ink/10 dark:border-white/10 text-sm text-s-ink/60 dark:text-s-dm-text/60 hover:border-s-coral transition-colors"
            >
              <ChevronLeft size={16} /> Zurück
            </button>
          )}
          <div className="flex-1" onClick={submitting ? undefined : goNext}>
            <InteractiveHoverButton
              text={
                submitting
                  ? "Wird gespeichert…"
                  : step === TOTAL_STEPS
                  ? "Fertig & zum Dashboard"
                  : "Weiter"
              }
              disabled={submitting}
              className="w-full"
            />
          </div>
          {step === TOTAL_STEPS && (
            <button
              type="button"
              onClick={() => {
                setQuickService(null);
                goNext();
              }}
              className="px-4 py-3 rounded-button border border-s-ink/10 dark:border-white/10 text-xs text-s-ink/40 dark:text-s-dm-text/40 hover:border-s-coral transition-colors shrink-0"
            >
              Überspringen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
