"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, ChevronLeft, PartyPopper, Loader2, Building2, Sparkles, AlertCircle, Camera } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import InteractiveHoverButton from "@/components/ui/interactive-hover-button";
import { slideSwitch } from "@/lib/animations";
import AddressAutocomplete from "@/components/ui/AddressAutocomplete";
import ImageUpload from "@/components/ui/ImageUpload";
import type { SalonCategory } from "@/lib/types";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

// ─────────────────────────────────────────
// Constants
// ─────────────────────────────────────────
import { CATEGORY_OPTIONS } from "@/lib/constants/categories";

const TOTAL_STEPS = 3;

const STEP_META = [
  { icon: Building2, label: "basics" },
  { icon: Sparkles, label: "quickwin" },
  { icon: Camera, label: "photos" },
];

// ─────────────────────────────────────────
// Step wrapper
// ─────────────────────────────────────────

function StepContainer({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white rounded-card border border-s-ink/[0.07] p-6 sm:p-8"
        style={{ boxShadow: "0 1px 3px rgba(26,18,9,.05), 0 4px 16px rgba(26,18,9,.06)" }}
        role="form">
        {subtitle && (
          <p className="text-[9px] font-heading font-bold uppercase tracking-[.20em] text-s-ink/50 mb-1.5">
            {subtitle}
          </p>
        )}
        <h2 className="font-heading font-bold text-2xl text-s-ink mb-6">{title}</h2>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Step 1 — Basics (Name, Email, Category, City, Address, TOS)
// ─────────────────────────────────────────

interface BasicsData {
  name: string;
  email: string;
  categories: SalonCategory[];
  city: string;
  address: string;
  phone: string;
  tos_accepted: boolean;
  latitude: number | null;
  longitude: number | null;
  google_place_id: string;
}

type TFunc = (key: string, params?: Record<string, unknown>) => string;

function Step1({ data, onChange, errors, t, locale }: { data: BasicsData; onChange: (d: BasicsData) => void; errors: Record<string, string>; t: TFunc; locale: string }) {
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
          <label className="block text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-ink/40 mb-1.5">{t("step1.name")}</label>
          <input
            value={data.name}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
            className={`w-full px-4 py-3 rounded-input border text-sm text-s-ink bg-white focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/10 transition-[border-color,box-shadow] shadow-warm-sm ${errors.name ? "border-s-coral" : "border-s-ink/10"}`}
            placeholder={t("step1.namePlaceholder")}
          />
          {errors.name && <p className="text-xs text-s-coral mt-0.5">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-ink/40 mb-1.5">{t("step1.email")}</label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => onChange({ ...data, email: e.target.value })}
            className={`w-full px-4 py-3 rounded-input border text-sm text-s-ink bg-white focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/10 transition-[border-color,box-shadow] shadow-warm-sm ${errors.email ? "border-s-coral" : "border-s-ink/10"}`}
            placeholder={t("step1.emailPlaceholder")}
          />
          {errors.email && <p className="text-xs text-s-coral mt-0.5">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-ink/40 mb-2">{t("step1.categories")}</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => toggleCat(c.value)}
                className={[
                  "px-4 py-2.5 rounded-pill text-[11px] font-heading font-bold uppercase tracking-[.06em] border transition-colors active:scale-[0.97]",
                  data.categories.includes(c.value)
                    ? "bg-s-coral text-white border-s-coral shadow-coral-glow"
                    : "border-s-ink/[0.08] text-s-ink/55 hover:border-s-coral/50",
                ].join(" ")}
              >
                {c.label}
              </button>
            ))}
          </div>
          {errors.categories && <p className="text-xs text-s-coral mt-1">{errors.categories}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-ink/40 mb-1.5">{/* will add translations later if needed */} Stadt</label>
            <select
              value={data.city}
              onChange={(e) => onChange({ ...data, city: e.target.value })}
              className={`w-full px-4 py-3 rounded-input border text-sm text-s-ink focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/10 bg-white shadow-warm-sm transition-[border-color,box-shadow] ${errors.city ? "border-s-coral" : "border-s-ink/5"}`}
            >
              <option value="">Stadt wählen</option>
              <option value="zuerich">Zürich</option>
              <option value="basel">Basel</option>
              <option value="bern">Bern</option>
            </select>
            {errors.city && <p className="text-xs text-s-coral mt-0.5">{errors.city}</p>}
          </div>
        </div>

        <div>
          <label className="block text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-ink/40 mb-1.5">{t("step1.address")}</label>
          <AddressAutocomplete
            value={data.address}
            onChange={(val) => onChange({ ...data, address: val })}
            onPlaceSelect={({ formatted, lat, lng, placeId }) => onChange({ ...data, address: formatted, latitude: lat, longitude: lng, google_place_id: placeId })}
            placeholder={t("step1.addressPlaceholder")}
            hasError={!!errors.address}
          />
          {errors.address && <p className="text-xs text-s-coral mt-0.5">{errors.address}</p>}
        </div>

        {/* TOS checkbox */}
        <div className="pt-2">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={data.tos_accepted}
              onChange={(e) => onChange({ ...data, tos_accepted: e.target.checked })}
              className="mt-0.5 w-4 h-4 rounded border-s-ink/20 accent-s-coral"
            />
            <span className="text-xs text-s-ink/60 leading-relaxed">
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

// Step 2 is now Quick Win (phone verification removed)

// ─────────────────────────────────────────
// Step 3 — Quick Win (AI-suggested first service)
// ─────────────────────────────────────────

interface QuickWinData {
  service_name: string;
  service_duration: number;
  service_price: number;
}

function Step3({ data, onChange, category, t }: {
  data: QuickWinData;
  onChange: (d: QuickWinData) => void;
  category: string;
  t: TFunc;
}) {
  const [suggesting, setSuggesting] = useState(false);
  const [suggested, setSuggested] = useState(false);

  const fetchSuggestion = async () => {
    if (!category || suggested) return;
    setSuggesting(true);
    try {
      const res = await fetch("/api/ai/suggest-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
      });
      if (res.ok) {
        const { suggestion } = await res.json();
        if (suggestion && !data.service_name) {
          onChange({ ...data, service_name: suggestion });
        }
      }
    } catch { /* fail silently */ }
    setSuggesting(false);
    setSuggested(true);
  };

  useEffect(() => {
    fetchSuggestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  return (
    <StepContainer title={t("step3Quick.title")} subtitle={t("step3Quick.subtitle")}>
      <div className="space-y-4">
        <div>
          <label className="block text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-ink/40 mb-1.5">
            {t("step3Quick.serviceName")}
          </label>
          <div className="relative">
            <input
              value={data.service_name}
              onChange={(e) => onChange({ ...data, service_name: e.target.value })}
              className="w-full px-4 py-3 rounded-input border border-s-ink/10 text-sm text-s-ink bg-white focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/10 transition-[border-color,box-shadow] shadow-warm-sm"
              placeholder="z. B. Waschen, Schneiden, Föhnen"
            />
            {suggesting && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 size={16} className="animate-spin text-s-coral" />
              </div>
            )}
          </div>
          {suggested && data.service_name && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <Sparkles size={10} className="text-s-coral" />
              <p className="text-[9px] font-heading font-bold uppercase tracking-[.12em] text-s-ink/45">
                KI-Vorschlag · anpassbar
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-ink/40 mb-1.5">
              {t("step3Quick.duration")}
            </label>
            <select
              value={data.service_duration}
              onChange={(e) => onChange({ ...data, service_duration: +e.target.value })}
              className="w-full px-4 py-3 rounded-input border border-s-ink/5 text-sm text-s-ink focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/10 bg-white shadow-warm-sm transition-[border-color,box-shadow]"
            >
              {[15, 30, 45, 60, 75, 90, 120].map((d) => (
                <option key={d} value={d}>{d} min</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-ink/40 mb-1.5">
              {t("step3Quick.price")}
            </label>
            <input
              type="number"
              min={0}
              value={data.service_price}
              onChange={(e) => onChange({ ...data, service_price: +e.target.value })}
              className="w-full px-4 py-3 rounded-input border border-s-ink/5 text-sm text-s-ink bg-white focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/10 transition-all shadow-warm-sm"
              placeholder="CHF"
            />
          </div>
        </div>

        <div className="rounded-[12px] border border-s-coral/[0.12] p-4"
          style={{ background: "rgba(232,98,74,.04)" }}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles size={12} className="text-s-coral shrink-0" />
            <p className="text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-coral">
              {t("step3Quick.hint")}
            </p>
          </div>
          <p className="text-xs font-body text-s-ink/50 leading-relaxed">
            {t("step3Quick.hintDesc")}
          </p>
        </div>
      </div>
    </StepContainer>
  );
}

// ─────────────────────────────────────────
// Step 3 — Photos (optional)
// ─────────────────────────────────────────

function StepPhotos({
  uploadedUrls,
  onUpload,
  t,
}: {
  uploadedUrls: string[];
  onUpload: (urls: string[]) => void;
  t: TFunc;
}) {
  return (
    <StepContainer title={t("stepPhotos.title")} subtitle={t("stepPhotos.subtitle")}>
      <div className="space-y-5">
        <p className="text-sm text-s-ink/60">
          {t("stepPhotos.desc")}
        </p>

        <ImageUpload
          onUpload={onUpload}
          maxFiles={10}
          existingUrls={uploadedUrls}
          bucket="salon-gallery"
          pathPrefix="onboarding"
        />

        <div className="rounded-[12px] border border-s-coral/[0.12] p-4"
          style={{ background: "rgba(232,98,74,.04)" }}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Camera size={12} className="text-s-coral shrink-0" />
            <p className="text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-coral">
              {t("stepPhotos.hint")}
            </p>
          </div>
          <p className="text-xs font-body text-s-ink/50 leading-relaxed">
            {t("stepPhotos.hintDesc")}
          </p>
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
  const t = useTranslations("salonRegistration") as any;
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState<1 | -1>(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  // Step 1 state
  const [basics, setBasics] = useState<BasicsData>({
    name: "", email: "", categories: [], city: "", address: "",
    phone: "", tos_accepted: false, latitude: null, longitude: null, google_place_id: "",
  });



  // Step 2 state (quick win service)
  const [quickWin, setQuickWin] = useState<QuickWinData>({
    service_name: "", service_duration: 60, service_price: 80,
  });

  // Step 3 state (photos — optional)
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  // Restore wizard state: DB first, then sessionStorage fallback
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const restoreFromObj = (data: Record<string, unknown>) => {
      if (data.basics) setBasics(data.basics as BasicsData);
      if (data.quickWin) setQuickWin(data.quickWin as QuickWinData);
      if (data.photoUrls) setPhotoUrls(data.photoUrls as string[]);
    };

    const loadDraft = async () => {
      try {
        const res = await fetch("/api/salon-draft");
        if (res.ok) {
          const { draft } = await res.json();
          if (draft?.draft_data && Object.keys(draft.draft_data).length > 0) {
            restoreFromObj(draft.draft_data);
            if (draft.current_step) setStep(Math.min(draft.current_step, TOTAL_STEPS));
            setHydrated(true);
            return;
          }
        }
      } catch { /* fall through to sessionStorage */ }

      // Fallback: sessionStorage
      try {
        const saved = sessionStorage.getItem("solen_wizard");
        if (saved) {
          const data = JSON.parse(saved);
          restoreFromObj(data);
          if (data.step) setStep(Math.min(data.step, TOTAL_STEPS));
        }
      } catch { /* ignore corrupted data */ }
      setHydrated(true);
    };
    loadDraft();
  }, []);

  // Save wizard state to sessionStorage + DB (debounced)
  useEffect(() => {
    if (!hydrated) return;
    const stateObj = { basics, quickWin, photoUrls, step };
    try {
      sessionStorage.setItem("solen_wizard", JSON.stringify(stateObj));
    } catch { /* storage full */ }

    const timer = setTimeout(() => {
      fetch("/api/salon-draft", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft_data: { basics, quickWin, photoUrls },
          current_step: step,
        }),
      }).catch((err) => console.error("[OnboardingSalon] draft autosave failed:", err)); // fire-and-forget
    }, 2000);
    return () => clearTimeout(timer);
  }, [hydrated, basics, quickWin, photoUrls, step]);

  // Auth guard — redirect to register if no session
  const [authChecked, setAuthChecked] = useState(false);
  useEffect(() => {
    const sb = createBrowserSupabaseClient();
    sb.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace(`/${locale}/auth/register?intent=salon`);
        return;
      }
      if (session.user?.email && !basics.email) {
        setBasics((prev) => ({ ...prev, email: session.user!.email! }));
      }
      if (session.user?.user_metadata?.salon_name && !basics.name) {
        setBasics((prev) => ({ ...prev, name: session.user!.user_metadata!.salon_name }));
      }
      setAuthChecked(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateCurrentStep = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (step === 1) {
      if (!basics.name || basics.name.length < 2) errors.name = "Name muss mindestens 2 Zeichen haben";
      if (!basics.email || !basics.email.includes("@")) errors.email = "Ungültige E-Mail-Adresse";
      if (basics.categories.length === 0) errors.categories = "Wähle mindestens eine Kategorie";
      if (!basics.city) errors.city = "Wähle eine Stadt";
      if (!basics.address || basics.address.length < 5) errors.address = "Adresse ist zu kurz";
      if (!basics.tos_accepted) errors.tos_accepted = "Bitte akzeptiere die AGB und Datenschutzerklärung";
    }
    if (step === 2) {
      if (!quickWin.service_name || quickWin.service_name.length < 2) errors.service_name = "Service-Name erforderlich";
    }
    // Step 3 (photos) is optional — no validation needed
    return errors;
  };

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

  const handleSubmit = async () => {
    const errors = validateCurrentStep();
    if (Object.keys(errors).length > 0) {
      setStepErrors(errors);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/salons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: basics.name,
          email: basics.email,
          categories: basics.categories,
          city: basics.city,
          address: basics.address,
          phone: basics.phone,
          latitude: basics.latitude,
          longitude: basics.longitude,
          google_place_id: basics.google_place_id,
          tos_accepted: basics.tos_accepted,
          // Quick Win service as initial service
          services: quickWin.service_name ? [{
            name_de: quickWin.service_name,
            category: basics.categories[0],
            duration_minutes: quickWin.service_duration,
            price: quickWin.service_price,
          }] : [],
          // Gallery photos uploaded in step 3
          gallery_urls: photoUrls.length > 0 ? photoUrls : undefined,
          cover_photo_url: photoUrls[0] || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSubmitError(data.message || `Fehler beim Erstellen (${res.status})`);
        return;
      }
      sessionStorage.removeItem("solen_wizard");
      fetch("/api/salon-draft", { method: "DELETE" }).catch((err) => console.error("[OnboardingSalon] draft delete on submit failed:", err));
      setDone(true);
      setTimeout(() => router.push(`/${locale}/dashboard?onboarded=1`), 1500);
    } catch {
      setSubmitError("Netzwerkfehler — bitte prüfe deine Verbindung und versuche es erneut.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-s-bg-base">
        {/* Header skeleton */}
        <div className="bg-white border-b border-s-ink/[0.06] px-4 py-4">
          <div className="max-w-xl mx-auto space-y-3 animate-pulse">
            <div className="flex justify-between">
              <div className="h-4 w-20 bg-s-bg-sunken rounded" />
              <div className="h-3 w-16 bg-s-bg-sunken rounded" />
            </div>
            <div className="h-2 w-full bg-s-bg-sunken rounded-full" />
            <div className="h-2.5 w-32 bg-s-bg-sunken rounded mx-auto" />
          </div>
        </div>
        {/* Card skeleton */}
        <div className="px-4 py-8">
          <div className="max-w-xl mx-auto rounded-card border border-s-ink/[0.06] bg-white p-8 animate-pulse">
            <div className="h-2 w-24 bg-s-bg-sunken rounded mb-3" />
            <div className="h-7 w-48 bg-s-bg-sunken rounded mb-8" />
            <div className="space-y-5">
              <div>
                <div className="h-2 w-16 bg-s-bg-sunken rounded mb-2" />
                <div className="h-12 w-full bg-s-bg-sunken rounded-[12px]" />
              </div>
              <div>
                <div className="h-2 w-16 bg-s-bg-sunken rounded mb-2" />
                <div className="h-12 w-full bg-s-bg-sunken rounded-[12px]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-s-bg-base pb-36">
      {/* Subtle warm linear gradient for depth — Zone 3 compliant */}
      <div className="fixed inset-0 -z-10 pointer-events-none" aria-hidden>
        <div className="absolute top-0 left-0 right-0 h-[300px]"
          style={{ background: "linear-gradient(180deg, rgba(232,98,74,.03) 0%, transparent 100%)" }} />
      </div>

      {/* Celebration overlay */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95"
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
              className="flex flex-col items-center gap-5 text-center px-6"
            >
              {/* Icon box — NO scale animation */}
              <div className="w-20 h-20 rounded-[22px] flex items-center justify-center"
                style={{ background: "rgba(232,98,74,.10)" }}>
                <PartyPopper size={34} className="text-s-coral" />
              </div>

              <div>
                <p className="text-[9px] font-heading font-bold uppercase tracking-[.22em] text-s-coral mb-2">
                  Willkommen
                </p>
                <h2 className="font-heading font-bold text-2xl text-s-ink">
                  {t("done.title")}
                </h2>
                <p className="text-xs font-body text-s-ink/45 max-w-xs mt-2 leading-relaxed">
                  {t("done.subtitle")}
                </p>
                <p className="text-[10px] font-heading uppercase tracking-[.10em] text-s-ink/50 mt-3">
                  {t("done.dashboardHint")}
                </p>
                <Link href={`/${locale}/dashboard?onboarded=1`}
                  className="mt-4 px-6 py-3 rounded-btn bg-s-coral text-white text-xs font-heading font-bold uppercase tracking-[.06em] hover:brightness-[1.06] transition-[transform,filter] duration-150 shadow-coral-glow">
                  Zum Dashboard →
                </Link>
              </div>

              {/* Opacity-only pulse dots — NO scale */}
              <div className="flex gap-2 mt-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }}
                    className="w-2 h-2 rounded-full bg-s-coral"
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-white border-b border-s-ink/[0.06] px-4 py-4 sticky top-0 z-10">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="font-heading font-bold text-base text-s-ink">
              solen<span className="text-s-coral">.</span>ch
            </span>
            <span className="text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-ink/45">
              {t("header.stepOf", { step, total: TOTAL_STEPS })}
            </span>
          </div>
          {/* Progress Segment Line */}
          <div className="flex items-center gap-1 mt-1 bg-s-bg-sunken rounded-full p-1" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={TOTAL_STEPS} aria-label={t("header.stepOf", { step, total: TOTAL_STEPS })}>
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div
                key={i}
                className={[
                  "h-1.5 rounded-full transition-[width] duration-300 flex-1",
                  i < step ? "bg-s-coral" : "bg-transparent",
                ].join(" ")}
              />
            ))}
          </div>
          <p className="text-[9px] font-heading font-bold uppercase tracking-[.16em] text-s-ink/45 mt-2 text-center">
            {t(`progress.${STEP_META[step - 1]?.label}` as any)}
          </p>
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
            {step === 1 && <Step1 data={basics} onChange={setBasics} errors={stepErrors} t={t as any} locale={locale} />}
            {step === 2 && (
              <Step3
                data={quickWin}
                onChange={setQuickWin}
                category={basics.categories[0] || "coiffeur"}
                t={t as any}
              />
            )}
            {step === 3 && (
              <StepPhotos
                uploadedUrls={photoUrls}
                onUpload={setPhotoUrls}
                t={t as any}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Submit error banner */}
      {submitError && step >= TOTAL_STEPS - 1 && (
        <div className="max-w-xl mx-auto px-4 mb-4">
          <div className="flex items-start gap-3 rounded-[12px] border border-s-coral/20 p-4"
            style={{ background: "rgba(232,98,74,.05)" }}>
            <AlertCircle size={15} className="text-s-coral shrink-0 mt-0.5" />
            <p className="text-xs font-body text-s-coral">{submitError}</p>
          </div>
        </div>
      )}

      {/* Nav buttons */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-s-ink/[0.06] px-4 py-4" aria-label="Wizard navigation">
        <div className="max-w-xl mx-auto flex gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={goPrev}
              className="flex items-center gap-1.5 px-4 py-3 rounded-btn border border-s-ink/[0.08] text-xs font-heading font-bold uppercase tracking-[.06em] text-s-ink/55 hover:bg-s-bg-sunken hover:border-s-ink/20 active:translate-y-[1px] active:shadow-pressed transition-[transform,filter]"
            >
              <ChevronLeft size={16} /> {t("nav.back")}
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={goNext}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-btn bg-s-coral text-white text-xs font-heading font-bold uppercase tracking-[.04em] hover:brightness-[1.06] active:translate-y-[1px] active:shadow-pressed transition-[transform,filter] group shadow-coral-glow"
            >
              <span>{t("nav.next")}</span>
              <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
          ) : (
            <div className="flex-1" onClick={submitting ? undefined : handleSubmit}>
              <InteractiveHoverButton
                text={submitting ? "..." : t("nav.finish")}
                className="w-full bg-s-coral text-white shadow-coral-glow"
              />
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}
