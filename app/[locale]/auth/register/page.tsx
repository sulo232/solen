"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Image from "next/image";
import { Check } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import type { HairType, AgeGroup, Gender, SalonCategory } from "@/lib/types";

// ─────────────────────────────────────────
// Step 1 — Name + Avatar + Bio
// ─────────────────────────────────────────

function Step1({ onNext }: { onNext: (data: { display_name: string; bio: string; avatar_url: string }) => void }) {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: name, bio, avatar_url: avatarUrl || null }),
    });
    setSaving(false);
    onNext({ display_name: name, bio, avatar_url: avatarUrl });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="font-heading font-bold text-xl text-dark">Wie heisst du?</h2>

      {/* Avatar preview + URL */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center text-dark/20 text-2xl font-heading">
          {avatarUrl ? <Image src={avatarUrl} alt="" width={64} height={64} className="object-cover" /> : (name[0] ?? "👤")}
        </div>
        <input
          type="url"
          placeholder="Avatar-URL (optional)"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          className="flex-1 px-3 py-2 rounded-button border border-gray-200 text-sm outline-none focus:border-teal"
        />
      </div>

      <input
        type="text"
        placeholder="Dein Name *"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="px-4 py-2.5 rounded-button border border-gray-200 text-sm outline-none focus:border-teal"
      />
      <textarea
        placeholder="Kurze Bio (optional)"
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        rows={3}
        className="px-4 py-2.5 rounded-button border border-gray-200 text-sm outline-none focus:border-teal resize-none"
      />

      <button
        type="submit"
        disabled={!name || saving}
        className="w-full py-3 rounded-button bg-teal text-white font-semibold text-sm hover:bg-teal/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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

const AGE_OPTIONS: { value: AgeGroup; label: string; emoji: string }[] = [
  { value: "child", label: "Kind", emoji: "🧒" },
  { value: "teenager", label: "Teenager", emoji: "🧑" },
  { value: "adult", label: "Erwachsen", emoji: "👤" },
  { value: "senior", label: "Senior", emoji: "🧓" },
];

const GENDER_OPTIONS: { value: Gender; label: string; emoji: string }[] = [
  { value: "female", label: "Weiblich", emoji: "♀️" },
  { value: "male", label: "Männlich", emoji: "♂️" },
  { value: "non_binary", label: "Non-binary", emoji: "⚧️" },
  { value: "prefer_not_to_say", label: "Keine Angabe", emoji: "—" },
];

const HAIR_OPTIONS: { value: HairType; label: string; emoji: string }[] = [
  { value: "straight", label: "Glatt", emoji: "〰️" },
  { value: "wavy", label: "Wellig", emoji: "〜" },
  { value: "curly", label: "Lockig", emoji: "🌀" },
  { value: "coily", label: "Kraus", emoji: "🌿" },
  { value: "unknown", label: "Weiss nicht", emoji: "❓" },
];

function SelectCard<T extends string>({
  options, value, onChange,
}: {
  options: { value: T; label: string; emoji: string }[];
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
            "flex items-center gap-2 px-3 py-2 rounded-button border text-sm transition-all",
            value === o.value ? "border-teal bg-teal/5 text-teal font-medium" : "border-gray-200 text-dark/70 hover:border-teal/30",
          ].join(" ")}
        >
          <span>{o.emoji}</span>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Step2({ onNext }: { onNext: () => void }) {
  const [age, setAge] = useState<AgeGroup | null>(null);
  const [gender, setGender] = useState<Gender | null>(null);
  const [hair, setHair] = useState<HairType | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ age_group: age, gender, hair_type: hair }),
    });
    setSaving(false);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <h2 className="font-heading font-bold text-xl text-dark">Erzähl uns mehr</h2>

      <div>
        <p className="text-sm font-medium text-dark/70 mb-2">Altersgruppe</p>
        <SelectCard options={AGE_OPTIONS} value={age} onChange={setAge} />
      </div>
      <div>
        <p className="text-sm font-medium text-dark/70 mb-2">Geschlecht</p>
        <SelectCard options={GENDER_OPTIONS} value={gender} onChange={setGender} />
      </div>
      <div>
        <p className="text-sm font-medium text-dark/70 mb-2">Haartyp</p>
        <SelectCard options={HAIR_OPTIONS} value={hair} onChange={setHair} />
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onNext} className="flex-1 py-3 rounded-button border border-gray-200 text-sm text-dark/60 hover:border-teal transition-colors">
          Überspringen
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-3 rounded-button bg-teal text-white font-semibold text-sm hover:bg-teal/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving && <Spinner size="sm" invert />}
          Weiter
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────
// Step 3 — Category preferences + Confetti
// ─────────────────────────────────────────

const CATEGORY_OPTIONS: { value: SalonCategory; label: string; emoji: string }[] = [
  { value: "coiffeur", label: "Coiffeur", emoji: "✂️" },
  { value: "barbershop", label: "Barbershop", emoji: "🪒" },
  { value: "nails", label: "Nägel", emoji: "💅" },
  { value: "spa", label: "Spa", emoji: "🛁" },
  { value: "makeup", label: "Makeup", emoji: "💄" },
  { value: "waxing", label: "Waxing", emoji: "✨" },
];

function Step3({ onComplete }: { onComplete: () => void }) {
  const [selected, setSelected] = useState<SalonCategory[]>([]);
  const [saving, setSaving] = useState(false);

  const toggle = (cat: SalonCategory) =>
    setSelected((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favorite_categories: selected, onboarding_completed: true }),
    });
    setSaving(false);
    onComplete();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <h2 className="font-heading font-bold text-xl text-dark">Was interessiert dich?</h2>
      <p className="text-sm text-dark/50">Wähle deine Lieblingskategorien (mehrere möglich)</p>

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
                active ? "border-teal bg-teal/5" : "border-gray-100 hover:border-teal/30",
              ].join(" ")}
            >
              {active && (
                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-teal flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </span>
              )}
              <span className="text-2xl">{o.emoji}</span>
              <span className="text-sm font-medium text-dark">{o.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onComplete} className="flex-1 py-3 rounded-button border border-gray-200 text-sm text-dark/60 hover:border-teal transition-colors">
          Überspringen
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-3 rounded-button bg-coral text-white font-semibold text-sm hover:bg-coral/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving && <Spinner size="sm" invert />}
          Fertig 🎉
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────
// Main wizard
// ─────────────────────────────────────────

export default function RegisterPage() {
  const locale = useLocale();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);

  const handleComplete = () => {
    setDone(true);
    setTimeout(() => router.push(`/${locale}`), 2000);
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 gap-4 text-center">
        <span className="text-6xl">🎉</span>
        <p className="font-heading font-bold text-2xl text-dark">Willkommen bei solen.ch!</p>
        <p className="text-dark/50 text-sm">Du wirst weitergeleitet…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-6">
          <a href={`/${locale}`} className="font-heading font-bold text-2xl text-dark tracking-tight">
            solen<span className="text-teal">.</span>ch
          </a>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${s === step ? "w-8 bg-teal" : s < step ? "w-4 bg-teal/40" : "w-4 bg-gray-200"}`} />
          ))}
        </div>

        <div className="bg-white rounded-card shadow-card p-6">
          {step === 1 && <Step1 onNext={() => setStep(2)} />}
          {step === 2 && <Step2 onNext={() => setStep(3)} />}
          {step === 3 && <Step3 onComplete={handleComplete} />}
        </div>

        <p className="text-center text-xs text-dark/30 mt-4">
          Schritt {step} von 3
        </p>
      </div>
    </div>
  );
}
