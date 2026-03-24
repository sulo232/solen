"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import {
  Check,
  User,
  Scissors,
  Baby,
  Users,
  UserCircle,
  HelpCircle,
  Minus,
  Wind,
  CloudRain,
  Waves,
  Sparkles,
  Building2,
  ChevronRight,
  ArrowLeft,
  PartyPopper,
  Mail,
} from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { slideSwitch } from "@/lib/animations";
import type { HairType, AgeGroup, Gender, SalonCategory } from "@/lib/types";

// ─────────────────────────────────────────
// Step 0 — Customer vs Salon choice (NEW)
// ─────────────────────────────────────────
function StepRole({ onCustomer, onSalon }: { onCustomer: () => void; onSalon: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <h2 className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text">Wie möchtest du starten?</h2>
        <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 font-body mt-1">Wähle deinen Profil-Typ</p>
      </div>

      <button
        onClick={onCustomer}
        className="group flex items-center gap-4 p-4 rounded-card border border-s-ink/5 dark:border-white/10 hover:border-s-coral/40 hover:bg-s-coral/[0.03] transition-all text-left"
      >
        <div className="w-12 h-12 rounded-card bg-s-coral/10 flex items-center justify-center flex-shrink-0">
          <User size={22} className="text-s-coral" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading font-semibold text-s-ink dark:text-s-dm-text">Ich bin ein Kunde</p>
          <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 font-body mt-0.5">Salons entdecken und Termine buchen</p>
        </div>
        <ChevronRight size={18} className="text-s-ink/20 dark:text-s-dm-text/20 group-hover:text-s-coral transition-colors" />
      </button>

      <button
        onClick={onSalon}
        className="group flex items-center gap-4 p-4 rounded-card border border-s-ink/5 dark:border-white/10 hover:border-s-coral/40 hover:bg-s-coral/[0.03] transition-all text-left"
      >
        <div className="w-12 h-12 rounded-card bg-s-coral/10 flex items-center justify-center flex-shrink-0">
          <Building2 size={22} className="text-s-coral" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading font-semibold text-s-ink dark:text-s-dm-text">Ich bin Salon-Inhaber</p>
          <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 font-body mt-0.5">Meinen Salon registrieren und verwalten</p>
        </div>
        <ChevronRight size={18} className="text-s-ink/20 dark:text-s-dm-text/20 group-hover:text-s-coral transition-colors" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────
// Step 0.5 — Register Email/Pass/DOB (NEW)
// ─────────────────────────────────────────
function StepRegister({ onNext }: { onNext: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthday, setBirthday] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const toast = useToast();

  const calcAge = (dateStr: string) => {
    if (!dateStr) return 0;
    const b = new Date(dateStr);
    const ageDifMs = Date.now() - b.getTime();
    return Math.abs(new Date(ageDifMs).getUTCFullYear() - 1970);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    if (calcAge(birthday) < 16) {
      toast("Du musst mindestens 16 Jahre alt sein.", "error");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, birthday }),
      });
      const data = await res.json();

      if (res.status === 409) {
        toast("Du hast bereits ein Konto. Bitte logge dich ein.", "error");
        setSaving(false);
        return;
      }
      if (!res.ok) {
        toast(data.message || "Registrierung fehlgeschlagen", "error");
        setSaving(false);
        return;
      }
      setSuccess(true);
    } catch {
      toast("Netzwerkfehler", "error");
    }
    setSaving(false);
  };

  if (success) {
    return (
      <div className="text-center py-6 flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-card bg-s-coral/10 flex items-center justify-center">
          <Mail size={26} className="text-s-coral" strokeWidth={1.5} />
        </div>
        <p className="font-heading font-semibold text-s-ink dark:text-s-dm-text text-lg">Fast fertig!</p>
        <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 font-body">
          Bitte überprüfe deine E-Mails, um dein Konto zu bestätigen.
        </p>
        <button onClick={onNext} className="text-sm text-s-coral hover:underline font-body mt-4">
          Weiter zum Onboarding (Test)
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text">Konto erstellen</h2>

      <input
        type="email"
        placeholder="E-Mail"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="px-4 py-2.5 rounded-btn border border-s-ink/10 dark:border-white/10 text-sm font-body text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-surface outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/10 transition-all"
      />
      <input
        type="password"
        placeholder="Passwort (min. 8 Zeichen, 1 Zahl, 1 Grossbuchstabe)"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="px-4 py-2.5 rounded-btn border border-s-ink/10 dark:border-white/10 text-sm font-body text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-surface outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/10 transition-all"
      />
      <div>
        <label className="text-xs text-s-ink/50 dark:text-s-dm-text/50 mb-1 block">Geburtsdatum (mind. 16 Jahre)</label>
        <input
          type="date"
          required
          value={birthday}
          onChange={(e) => setBirthday(e.target.value)}
          className="w-full px-4 py-2.5 rounded-btn border border-s-ink/10 dark:border-white/10 text-sm font-body text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-surface outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/10 transition-all"
        />
      </div>

      <button
        type="submit"
        disabled={!email || !password || !birthday || saving}
        className="w-full py-3 rounded-btn bg-s-coral text-white font-body font-semibold text-sm hover:bg-s-coral/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-warm-sm"
      >
        {saving && <Spinner size="sm" invert />}
        Registrieren
      </button>

      <p className="text-center text-xs text-s-ink/30 dark:text-s-dm-text/30 font-body mt-2">
        Du hast bereits ein Konto?{" "}
        <a href="/auth/login" className="text-s-coral hover:underline">
          Anmelden
        </a>
      </p>
    </form>
  );
}

// ─────────────────────────────────────────
// Step 1 — Name + Avatar + Bio
// ─────────────────────────────────────────
function Step1({ onNext }: { onNext: (data: { display_name: string; bio: string; avatar_url: string }) => void }) {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: name, bio, avatar_url: avatarUrl || null }),
      });
      if (!res.ok) {
        toast("Profil konnte nicht gespeichert werden", "error");
        setSaving(false);
        return;
      }
    } catch {
      toast("Netzwerkfehler", "error");
      setSaving(false);
      return;
    }
    setSaving(false);
    onNext({ display_name: name, bio, avatar_url: avatarUrl });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text">Wie heisst du?</h2>

      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-s-bg-sunken dark:bg-white/5 overflow-hidden shrink-0 flex items-center justify-center text-s-ink/20">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="" width={64} height={64} className="object-cover" />
          ) : (
            <User size={24} className="text-s-ink/30 dark:text-s-dm-text/30" />
          )}
        </div>
        <input
          type="url"
          placeholder="Avatar-URL (optional)"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          className="flex-1 px-3 py-2 rounded-btn border border-s-ink/10 dark:border-white/10 text-sm font-body text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-surface outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/10 transition-all"
        />
      </div>

      <input
        type="text"
        placeholder="Dein Name *"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="px-4 py-2.5 rounded-btn border border-s-ink/10 dark:border-white/10 text-sm font-body text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-surface outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/10 transition-all"
      />
      <textarea
        placeholder="Kurze Bio (optional)"
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        rows={3}
        className="px-4 py-2.5 rounded-btn border border-s-ink/10 dark:border-white/10 text-sm font-body text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-surface outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/10 transition-all resize-none"
      />

      <button
        type="submit"
        disabled={!name || saving}
        className="w-full py-3 rounded-btn bg-s-coral text-white font-body font-semibold text-sm hover:bg-s-coral/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-warm-sm"
      >
        {saving && <Spinner size="sm" invert />}
        Weiter
      </button>
    </form>
  );
}

// ─────────────────────────────────────────
// Step 2 — Age + Gender + Hair type
// ─────────────────────────────────────────

const AGE_OPTIONS: { value: AgeGroup; label: string; icon: React.ReactNode }[] = [
  // Removed from step 2 since we collect exact DOB in signup step
];

const GENDER_OPTIONS: { value: Gender; label: string; icon: React.ReactNode }[] = [
  { value: "female", label: "Weiblich", icon: <Sparkles size={16} /> },
  { value: "male", label: "Männlich", icon: <User size={16} /> },
  { value: "non_binary", label: "Non-binary", icon: <Minus size={16} /> },
  { value: "prefer_not_to_say", label: "Keine Angabe", icon: <HelpCircle size={16} /> },
];

const HAIR_OPTIONS: { value: HairType; label: string; icon: React.ReactNode }[] = [
  { value: "straight", label: "Glatt", icon: <Wind size={16} /> },
  { value: "wavy", label: "Wellig", icon: <CloudRain size={16} /> },
  { value: "curly", label: "Lockig", icon: <Waves size={16} /> },
  { value: "coily", label: "Kraus", icon: <Sparkles size={16} /> },
  { value: "unknown", label: "Weiss nicht", icon: <HelpCircle size={16} /> },
];

function SelectPill<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; icon: React.ReactNode }[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={[
            "flex items-center gap-2 px-3 py-2 rounded-btn border text-sm font-body transition-all",
            value === o.value
              ? "border-s-coral bg-s-coral/5 text-s-coral font-medium"
              : "border-s-ink/10 dark:border-white/10 text-s-ink/70 dark:text-s-dm-text/70 hover:border-s-coral/30",
          ].join(" ")}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Step2({ onNext }: { onNext: () => void }) {
  const [gender, setGender] = useState<Gender | null>(null);
  const [hair, setHair] = useState<HairType | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gender, hair_type: hair }),
      });
      if (!res.ok) {
        toast("Profil konnte nicht gespeichert werden", "error");
        setSaving(false);
        return;
      }
    } catch {
      toast("Netzwerkfehler", "error");
      setSaving(false);
      return;
    }
    setSaving(false);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <h2 className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text">Erzähl uns mehr</h2>

      <div>
        <p className="text-sm font-body font-medium text-s-ink/70 dark:text-s-dm-text/70 mb-2">Geschlecht</p>
        <SelectPill options={GENDER_OPTIONS} value={gender} onChange={setGender} />
      </div>
      <div>
        <p className="text-sm font-body font-medium text-s-ink/70 dark:text-s-dm-text/70 mb-2">Haartyp</p>
        <SelectPill options={HAIR_OPTIONS} value={hair} onChange={setHair} />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onNext}
          className="flex-1 py-3 rounded-btn border border-s-ink/10 dark:border-white/10 text-sm font-body text-s-ink/60 dark:text-s-dm-text/60 hover:border-s-coral transition-colors"
        >
          Überspringen
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-3 rounded-btn bg-s-coral text-white font-body font-semibold text-sm hover:bg-s-coral/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-warm-sm"
        >
          {saving && <Spinner size="sm" invert />}
          Weiter
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────
// Step 3 — Category preferences
// ─────────────────────────────────────────

const CATEGORY_OPTIONS: { value: SalonCategory; label: string; icon: React.ReactNode }[] = [
  { value: "coiffeur", label: "Coiffeur", icon: <Scissors size={20} /> },
  { value: "barbershop", label: "Barbershop", icon: <Scissors size={20} /> },
  { value: "nails", label: "Nägel", icon: <Sparkles size={20} /> },
  { value: "spa", label: "Spa", icon: <Waves size={20} /> },
  { value: "makeup", label: "Makeup", icon: <Sparkles size={20} /> },
  { value: "waxing", label: "Waxing", icon: <Wind size={20} /> },
];

function Step3({ onComplete }: { onComplete: () => void }) {
  const [selected, setSelected] = useState<SalonCategory[]>([]);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const toggle = (cat: SalonCategory) =>
    setSelected((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite_categories: selected, onboarding_completed: true }),
      });
      if (!res.ok) {
        toast("Profil konnte nicht gespeichert werden", "error");
        setSaving(false);
        return;
      }
    } catch {
      toast("Netzwerkfehler", "error");
      setSaving(false);
      return;
    }
    setSaving(false);
    onComplete();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h2 className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text">Was interessiert dich?</h2>
        <p className="text-sm font-body text-s-ink/50 dark:text-s-dm-text/50 mt-1">Wähle deine Lieblingskategorien</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {CATEGORY_OPTIONS.map((o) => {
          const active = selected.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => toggle(o.value)}
              className={[
                "relative flex flex-col items-center gap-2 p-4 rounded-card border transition-all",
                active ? "border-s-coral bg-s-coral/5" : "border-s-ink/5 dark:border-white/10 hover:border-s-coral/30",
              ].join(" ")}
            >
              {active && (
                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-s-coral flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </span>
              )}
              <span className="text-s-coral">{o.icon}</span>
              <span className="text-sm font-body font-medium text-s-ink dark:text-s-dm-text">{o.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onComplete}
          className="flex-1 py-3 rounded-btn border border-s-ink/10 dark:border-white/10 text-sm font-body text-s-ink/60 dark:text-s-dm-text/60 hover:border-s-coral transition-colors"
        >
          Überspringen
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-3 rounded-btn bg-s-coral text-white font-body font-semibold text-sm hover:bg-s-coral/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-warm-md"
        >
          {saving && <Spinner size="sm" invert />}
          Fertig
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────
// Completion screen — animated, no emoji
// ─────────────────────────────────────────
function DoneScreen() {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 18 }}
        className="w-20 h-20 rounded-card bg-s-coral/10 flex items-center justify-center"
      >
        <PartyPopper size={36} className="text-s-coral" />
      </motion.div>
      <div>
        <p className="font-heading font-bold text-2xl text-s-ink dark:text-s-dm-text">Willkommen bei solen.ch!</p>
        <p className="text-s-ink/50 dark:text-s-dm-text/50 font-body text-sm mt-1">Du wirst weitergeleitet…</p>
      </div>
      <div className="flex gap-1.5 mt-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-s-coral"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Main wizard
// ─────────────────────────────────────────

type WizardStep = -1 | 0 | 1 | 2 | 3 | "done";

export default function RegisterPage() {
  const locale = useLocale();
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>(-1);
  const [prevStep, setPrevStep] = useState<WizardStep>(-1);
  const [salonIntent, setSalonIntent] = useState(false);

  // Read intent=salon from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("intent") === "salon") {
      setSalonIntent(true);
      goTo(0); // Jump straight to registration form
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goTo = (next: WizardStep) => {
    setPrevStep(step);
    setStep(next);
  };

  const handleComplete = () => {
    goTo("done");
    setTimeout(() => router.push(`/${locale}`), 2200);
  };

  const handleSalonChoice = () => {
    setSalonIntent(true);
    goTo(0); // Show the registration form first — account must exist before onboarding
  };

  const direction =
    step === "done" || (step !== -1 && step !== "done" && prevStep !== "done" && step > (prevStep as number))
      ? "right"
      : "left";
  const variants = slideSwitch(direction);

  const totalSteps = 3;
  const currentStepNum = step === -1 ? 0 : step === "done" ? totalSteps : Number(step);

  return (
    <div className="min-h-screen bg-s-bg-base dark:bg-s-dm-bg flex flex-col items-center justify-center px-4 py-12">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-s-coral/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-s-coral/[0.06] blur-[80px]" />
      </div>

      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <a
            href={`/${locale}`}
            className="inline-block font-heading font-bold text-3xl text-s-ink dark:text-s-dm-text tracking-tight hover:opacity-80 transition-opacity"
          >
            solen<span className="text-s-coral">.</span>ch
          </a>
        </div>

        {/* Progress dots — only during customer steps */}
        {step !== -1 && step !== "done" && (
          <div className="flex justify-center gap-2 mb-5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  s === step ? "w-10 bg-s-coral" : s < step ? "w-4 bg-s-coral/40" : "w-4 bg-s-sand dark:bg-white/10"
                }`}
              />
            ))}
          </div>
        )}

        <div className="rounded-card border border-white/60 dark:border-white/10 bg-white/80 dark:bg-s-dm-surface/80 backdrop-blur-glass shadow-glass overflow-hidden">
          <div className="p-7">
            {(step === 2 || step === 3) && (
              <button
                onClick={() => goTo((step - 1) as WizardStep)}
                className="flex items-center gap-1.5 text-sm text-s-ink/40 dark:text-s-dm-text/40 hover:text-s-ink dark:hover:text-s-dm-text font-body mb-4 transition-colors"
              >
                <ArrowLeft size={14} />
                Zurück
              </button>
            )}

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={String(step)}
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {step === -1 && <StepRole onCustomer={() => goTo(0)} onSalon={handleSalonChoice} />}
                {step === 0 && <StepRegister onNext={() => {
                  if (salonIntent) {
                    router.push(`/${locale}/onboarding/salon`);
                  } else {
                    goTo(1);
                  }
                }} />}
                {step === 1 && <Step1 onNext={() => goTo(2)} />}
                {step === 2 && <Step2 onNext={() => goTo(3)} />}
                {step === 3 && <Step3 onComplete={handleComplete} />}
                {step === "done" && <DoneScreen />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {step !== "done" && (
          <p className="text-center text-xs text-s-ink/30 dark:text-s-dm-text/30 font-body mt-4">
            {step === -1 ? (
              <>
                Bereits registriert?{" "}
                <a href={`/${locale}/auth/login`} className="text-s-coral hover:underline">
                  Anmelden
                </a>
              </>
            ) : (
              `Schritt ${currentStepNum} von ${totalSteps}`
            )}
          </p>
        )}
      </div>
    </div>
  );
}
