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
      <div className="text-center mb-2">
        <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/35 dark:text-s-dm-text/35 mb-2">
          Registrierung
        </p>
        <h2 className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text">
          Wie möchtest du starten?
        </h2>
      </div>

      {/* Customer choice */}
      <button onClick={onCustomer}
        className="group flex items-center gap-4 p-4 rounded-card border border-s-ink/[0.07] dark:border-white/10 hover:border-s-coral/40 hover:bg-s-coral/[0.03] transition-all text-left">
        <div className="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0"
          style={{ background: "rgba(232,98,74,.10)" }}>
          <User size={20} className="text-s-coral" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading font-semibold text-sm text-s-ink dark:text-s-dm-text">Ich bin ein Kunde</p>
          <p className="text-[10px] font-body text-s-ink/45 dark:text-s-dm-text/45 mt-0.5">Salons entdecken und Termine buchen</p>
        </div>
        <ChevronRight size={16} className="text-s-ink/20 dark:text-s-dm-text/20 group-hover:text-s-coral transition-colors shrink-0" />
      </button>

      {/* Salon choice */}
      <button onClick={onSalon}
        className="group flex items-center gap-4 p-4 rounded-card border border-s-ink/[0.07] dark:border-white/10 hover:border-s-coral/40 hover:bg-s-coral/[0.03] transition-all text-left">
        <div className="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0"
          style={{ background: "rgba(212,135,10,.10)" }}>
          <Building2 size={20} className="text-s-amber" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading font-semibold text-sm text-s-ink dark:text-s-dm-text">Ich bin Salon-Inhaber</p>
          <p className="text-[10px] font-body text-s-ink/45 dark:text-s-dm-text/45 mt-0.5">Meinen Salon registrieren und verwalten</p>
        </div>
        <ChevronRight size={16} className="text-s-ink/20 dark:text-s-dm-text/20 group-hover:text-s-coral transition-colors shrink-0" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────
// Step 0.5 — Register Email/Pass/DOB (NEW)
// ─────────────────────────────────────────
function StepRegister({ onNext, isSalon }: { onNext: () => void; isSalon?: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthday, setBirthday] = useState("");
  const [salonName, setSalonName] = useState("");
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
    
    if (!isSalon && calcAge(birthday) < 16) {
      toast("Du musst mindestens 16 Jahre alt sein.", "error");
      setSaving(false);
      return;
    }

    try {
      const payload = isSalon 
        ? { email, password, salon_name: salonName } 
        : { email, password, birthday };

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
      <div className="text-center py-6 flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-[14px] flex items-center justify-center"
          style={{ background: "rgba(232,98,74,.10)" }}>
          <Mail size={24} className="text-s-coral" />
        </div>
        <div>
          <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-coral mb-2">
            E-Mail gesendet
          </p>
          <p className="font-heading font-bold text-lg text-s-ink dark:text-s-dm-text">Fast fertig!</p>
          <p className="text-xs font-body text-s-ink/50 dark:text-s-dm-text/50 mt-1 leading-relaxed">
            Überprüfe deine E-Mails und klicke auf den Bestätigungslink.
          </p>
        </div>
        <button onClick={onNext}
          className="text-[11px] font-heading font-bold uppercase tracking-[.06em] text-s-coral/60 hover:text-s-coral transition-colors mt-2">
          Weiter →
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
        className="w-full px-4 py-3.5 rounded-input border border-s-ink/[0.08] dark:border-white/10 bg-white dark:bg-s-dm-surface text-sm font-body text-s-ink dark:text-s-dm-text placeholder:text-s-ink/30 focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 transition-colors"
      />
      <input
        type="password"
        placeholder="Passwort (min. 8 Zeichen, 1 Zahl, 1 Grossbuchstabe)"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full px-4 py-3.5 rounded-input border border-s-ink/[0.08] dark:border-white/10 bg-white dark:bg-s-dm-surface text-sm font-body text-s-ink dark:text-s-dm-text placeholder:text-s-ink/30 focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 transition-colors"
      />
      
      {isSalon ? (
        <div>
          <label className="block text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-ink/40 dark:text-s-dm-text/40 mb-1.5">
            Name des Salons
          </label>
          <input
            type="text"
            required
            placeholder="z.B. Studio 54"
            value={salonName}
            onChange={(e) => setSalonName(e.target.value)}
            className="w-full px-4 py-3.5 rounded-input border border-s-ink/[0.08] dark:border-white/10 bg-white dark:bg-s-dm-surface text-sm font-body text-s-ink dark:text-s-dm-text placeholder:text-s-ink/30 focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 transition-colors"
          />
        </div>
      ) : (
        <div>
          <label className="block text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-ink/40 dark:text-s-dm-text/40 mb-1.5">
            Geburtsdatum <span className="text-s-ink/25 dark:text-s-dm-text/25">(mind. 16 Jahre)</span>
          </label>
          <input
            type="date"
            required
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            className="w-full px-4 py-3.5 rounded-[12px] border border-s-ink/[0.08] dark:border-white/10 bg-white dark:bg-s-dm-surface text-sm font-body text-s-ink dark:text-s-dm-text placeholder:text-s-ink/30 focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 transition-colors"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={!email || !password || (isSalon ? !salonName : !birthday) || saving}
        className="w-full py-4 rounded-btn text-white text-xs font-heading font-bold uppercase tracking-[.04em] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ background: "#E8624A", boxShadow: "0 2px 4px rgba(232,98,74,.28), 0 6px 20px rgba(232,98,74,.18)" }}>
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
        className="w-full py-3 rounded-btn bg-s-coral text-white font-body font-semibold text-sm hover:brightness-[1.06] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-warm-sm"
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
            "flex items-center gap-2 px-3.5 py-2.5 rounded-btn border text-xs font-heading font-semibold transition-all duration-150",
            value === o.value
              ? "border-s-coral bg-s-coral/[0.08] text-s-coral font-bold"
              : "border-s-ink/[0.08] dark:border-white/10 text-s-ink/60 dark:text-s-dm-text/60 hover:border-s-coral/40 hover:text-s-coral",
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
          className="flex-1 py-3 rounded-btn bg-s-coral text-white font-body font-semibold text-sm hover:brightness-[1.06] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-warm-sm"
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
              className={`relative flex flex-col items-center justify-center gap-2.5 p-4 rounded-[12px] border transition-all duration-150 ${
                active
                  ? "border-s-coral bg-s-coral/[0.08]"
                  : "border-s-ink/[0.07] dark:border-white/10 hover:border-s-coral/40"
              }`}>
              {active && (
                <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-s-coral flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </span>
              )}
              <span className={active ? "text-s-coral" : "text-s-ink/50 dark:text-s-dm-text/50"}>{o.icon}</span>
              <span className="text-[11px] font-heading font-semibold text-s-ink dark:text-s-dm-text">{o.label}</span>
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
          className="flex-1 py-3 rounded-btn bg-s-coral text-white font-body font-semibold text-sm hover:brightness-[1.06] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-warm-md"
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
      {/* Icon — fade in only, NO scale */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
        className="w-16 h-16 rounded-[20px] flex items-center justify-center"
        style={{ background: "rgba(76,175,111,.12)" }}>
        <PartyPopper size={28} className="text-[#4CAF6F]" />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}>
        <p className="text-[9px] font-heading font-bold uppercase tracking-[.20em] text-[#4CAF6F] mb-2">
          Konto erstellt
        </p>
        <p className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text">Willkommen bei solen.ch!</p>
        <p className="font-body italic text-s-ink/45 dark:text-s-dm-text/45 text-sm mt-1">Du wirst weitergeleitet…</p>
      </motion.div>

      {/* Loading dots — opacity animation only */}
      <div className="flex gap-1.5 mt-1">
        {[0, 1, 2].map((i) => (
          <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-s-coral"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.25 }} />
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
    step === "done" || (step !== -1 && step !== "done" && prevStep !== "done" && Number(step) > Number(prevStep))
      ? "right"
      : "left";
  const variants = slideSwitch(direction);

  const totalSteps = 3;
  const currentStepNum = step === -1 ? 0 : step === "done" ? totalSteps : Number(step);

  return (
    <div className="min-h-screen bg-s-bg-base dark:bg-s-dm-bg flex flex-col items-center justify-center px-4 py-12">
      {/* Single ambient glow — Zone 3 exception */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute top-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full"
          style={{ background: "rgba(232,98,74,.07)", filter: "blur(120px)" }} />
      </div>

      <div className="w-full max-w-sm">
        {/* Logo lockup */}
        <div className="text-center mb-6">
          <p className="text-[9px] font-heading font-bold uppercase tracking-[.22em] text-s-amber mb-3">
            solen.ch
          </p>
          <a href={`/${locale}`}
            className="inline-block font-heading font-bold text-[32px] text-s-ink dark:text-s-dm-text leading-none hover:opacity-80 transition-opacity">
            solen<span className="text-s-coral">.</span>ch
          </a>
        </div>

        {/* Progress bar — linear track */}
        {step !== -1 && step !== "done" && (
          <div className="mb-5 px-1">
            <div className="flex gap-1">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex-1 h-1 rounded-full transition-all duration-300"
                  style={{ background: (s as number) <= (step as number) ? "#E8624A" : "rgba(26,18,9,.08)" }} />
              ))}
            </div>
            <p className="text-right text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-ink/30 dark:text-s-dm-text/30 mt-1.5">
              Schritt {currentStepNum} von {totalSteps}
            </p>
          </div>
        )}

        {/* Auth card — Zone 3, warm shadow */}
        <div className="rounded-[16px] border border-white/70 dark:border-white/10 overflow-hidden"
          style={{ background: "rgba(255,255,255,.90)", backdropFilter: "blur(20px) saturate(1.2)",
                   WebkitBackdropFilter: "blur(20px) saturate(1.2)",
                   boxShadow: "0 4px 12px rgba(26,18,9,.08), 0 16px 40px rgba(26,18,9,.06), inset 0 1px 0 rgba(255,255,255,.90)" }}>
          <div className="p-7">
            {(step === 2 || step === 3) && (
              <button
                onClick={() => goTo((step - 1) as WizardStep)}
                className="flex items-center gap-1.5 text-[11px] font-heading font-bold uppercase tracking-[.06em] text-s-ink/35 dark:text-s-dm-text/35 hover:text-s-ink dark:hover:text-s-dm-text transition-colors mb-4">
                <ArrowLeft size={12} /> Zurück
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
                {step === 0 && <StepRegister isSalon={salonIntent} onNext={() => {
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

        {step !== "done" && step === -1 && (
          <p className="text-center mt-6">
            <span className="text-[11px] font-heading font-bold uppercase tracking-[.08em] text-s-ink/30 dark:text-s-dm-text/30">
              Bereits registriert?{" "}
            </span>
            <a href={`/${locale}/auth/login`}
              className="text-[11px] font-heading font-bold uppercase tracking-[.08em] text-s-coral hover:underline">
              Anmelden
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
