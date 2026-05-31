"use client";

// Customer onboarding (V3-D348). Skippable, one-question-per-screen (Uber rhythm),
// B&W chrome with universal color only on semantic icons. Config-driven steps.
// Saves to PATCH /api/profile: gender + hair_type (columns) + customer_preferences
// JSONB (skinType, categories, interests) merged with any existing prefs.

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Star, Heart, Droplet, Zap, Check } from "lucide-react";
import { toast } from "@/app/[locale]/_components/primitives/Toast";

type Prefs = Record<string, unknown>;

export interface OnboardingInitial {
  locale: string;
  redirect: string;
  customerPreferences: Prefs;
}

// ── category icons (inline — match the approved mockup) ──────────
const CAT_PATHS: Record<string, React.ReactNode> = {
  coiffeur: (<><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12" /></>),
  barbershop: (<><rect x="4" y="4" width="16" height="6" rx="2" /><path d="M12 10v5M9 18h6" /></>),
  nails: (<path d="M9 21V8a3 3 0 0 1 6 0v13M9 21h6M8 8c0-2 1-5 4-5s4 3 4 5" />),
  spa: (<path d="M11 20A7 7 0 0 1 4 13c0-6 5-9 16-9 0 8-3 14-9 16zM4 20c2-5 6-8 11-9" />),
  makeup: (<><path d="M14 4 20 10 11 19l-5 1 1-5z" /><path d="m12 6 6 6" /></>),
  waxing: (<path d="M4 8c4-3 12-3 16 0M4 13c4-3 12-3 16 0M4 18c4-3 12-3 16 0" />),
};
function CatIcon({ name }: { name: string }) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {CAT_PATHS[name]}
    </svg>
  );
}

// ── step config ──────────────────────────────────────────────────
type Choice = { value: string; label: string };
type Step =
  | { id: string; kind: "chips"; q: string; sub?: string; field: "gender" | "hair_type" | "skinType"; opts: Choice[] }
  | { id: "categories"; kind: "grid"; q: string; sub?: string; opts: { value: string; label: string }[] }
  | { id: "interests"; kind: "cards"; q: string; sub?: string; opts: { value: string; label: string; note?: string; cls: string }[] };

const STEPS: Step[] = [
  {
    id: "gender", kind: "chips", field: "gender",
    q: "Wie identifizierst du dich?", sub: "Damit wir Stylist:innen & Leistungen auf dich abstimmen.",
    opts: [
      { value: "female", label: "Frau" }, { value: "male", label: "Mann" },
      { value: "non_binary", label: "Non-binär" }, { value: "prefer_not_to_say", label: "Keine Angabe" },
    ],
  },
  {
    id: "hair", kind: "chips", field: "hair_type",
    q: "Wie sind deine Haare?", sub: "Hilft uns, dich mit den richtigen Profis zu matchen.",
    opts: [
      { value: "straight", label: "Glatt" }, { value: "wavy", label: "Wellig" },
      { value: "curly", label: "Lockig" }, { value: "coily", label: "Kraus" }, { value: "unknown", label: "Weiss nicht" },
    ],
  },
  {
    id: "skin", kind: "chips", field: "skinType",
    q: "Und deine Haut?", sub: "Für Gesichtsbehandlungen, Waxing & empfindliche Haut.",
    opts: [
      { value: "dry", label: "Trocken" }, { value: "normal", label: "Normal" },
      { value: "combination", label: "Mischhaut" }, { value: "oily", label: "Fettig" }, { value: "sensitive", label: "Empfindlich" },
    ],
  },
  {
    id: "categories", kind: "grid",
    q: "Was suchst du?", sub: "Wähle, was du buchst — wir bauen deine Startseite darum.",
    opts: [
      { value: "coiffeur", label: "Coiffeur" }, { value: "barbershop", label: "Barbershop" },
      { value: "nails", label: "Nails" }, { value: "spa", label: "Spa & Wellness" },
      { value: "makeup", label: "Makeup" }, { value: "waxing", label: "Waxing" },
    ],
  },
  {
    id: "interests", kind: "cards",
    q: "Was interessiert dich?", sub: "Das zeigen wir dir zuerst auf deiner Startseite.",
    opts: [
      { value: "top_rated", label: "Top-Salons", cls: "text-s-star" },
      { value: "deals", label: "Deals & Angebote", note: "Gutscheine, Last-Minute", cls: "text-s-urgency" },
      { value: "favorites", label: "Favoriten", cls: "text-[#FF3366]" },
      { value: "spa", label: "Spa & Entspannung", cls: "text-s-accent-bright" },
    ],
  },
];
const TOTAL = STEPS.length;

const INTEREST_ICON: Record<string, React.ReactNode> = {
  top_rated: <Star size={20} aria-hidden />, deals: <Zap size={20} aria-hidden />,
  favorites: <Heart size={20} aria-hidden />, spa: <Droplet size={20} aria-hidden />,
};

export default function OnboardingFlow({ locale, redirect, customerPreferences }: OnboardingInitial) {
  const router = useRouter();
  const [i, setI] = React.useState(0);
  const [done, setDone] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  // collected answers
  const [single, setSingle] = React.useState<Record<string, string>>({});
  const [multi, setMulti] = React.useState<Record<string, string[]>>({ categories: [], interests: [] });

  const step = STEPS[i];
  const progress = Math.round(((i + 1) / TOTAL) * 100);

  const toggleMulti = (id: string, v: string) =>
    setMulti((m) => {
      const cur = m[id] ?? [];
      return { ...m, [id]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] };
    });

  const finish = async () => {
    setSaving(true);
    try {
      const prefs: Prefs = { ...customerPreferences };
      if (single.skinType) prefs.skinType = single.skinType;
      if (multi.categories.length) prefs.categories = multi.categories;
      if (multi.interests.length) prefs.interests = multi.interests;

      const body: Record<string, unknown> = { customer_preferences: prefs };
      if (single.gender) body.gender = single.gender;
      if (single.hair_type) body.hair_type = single.hair_type;
      if (single.gender || single.hair_type || Object.keys(prefs).length) {
        const res = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          console.error("[Onboarding] save failed:", e?.message ?? res.status);
          toast.error("Speichern fehlgeschlagen — du kannst es später im Profil ergänzen.");
        }
      }
    } catch (err) {
      console.error("[Onboarding] save exception:", err);
    } finally {
      setSaving(false);
      setDone(true);
    }
  };

  const next = () => { if (i < TOTAL - 1) setI(i + 1); else finish(); };
  const back = () => { if (i > 0) setI(i - 1); };
  const go = () => router.push(redirect.startsWith("/") ? redirect : `/${locale}`);

  if (done) {
    const picks = [
      ...multi.categories.map((c) => STEPS[3].opts.find((o) => o.value === c)?.label).filter(Boolean),
      ...(multi.interests.includes("deals") ? ["Deals"] : []),
    ].slice(0, 4) as string[];
    return (
      <div className="flex flex-col items-center text-center pt-8">
        <div className="grid place-items-center w-16 h-16 rounded-full mb-5 bg-s-success-bg text-s-success">
          <Check size={32} aria-hidden />
        </div>
        <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-s-ink">Alles bereit</h1>
        <p className="text-[15px] text-s-ink-2 mt-2 max-w-[300px] leading-[1.4]">Deine Solen-Startseite ist auf das zugeschnitten, was du gewählt hast.</p>
        {picks.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {picks.map((p) => (
              <span key={p} className="h-[34px] px-3.5 inline-flex items-center rounded-pill bg-s-bg-sunken text-[13px] font-medium text-s-ink">{p}</span>
            ))}
          </div>
        )}
        <button type="button" onClick={go} className="w-full max-w-sm h-12 rounded-btn bg-s-ink text-white text-[15px] font-medium mt-7 active:scale-[0.99] transition-transform">
          Solen entdecken
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* topbar: back · progress · skip */}
      <div className="flex items-center gap-3 mb-5">
        <button type="button" onClick={back} disabled={i === 0} aria-label="Zurück"
          className="grid place-items-center w-8 h-8 rounded-full border border-s-border text-s-ink disabled:opacity-40 hover:bg-s-bg-sunken transition-colors">
          <ArrowLeft size={16} aria-hidden />
        </button>
        <div className="flex-1">
          <div className="h-[5px] rounded-pill bg-s-bg-sunken overflow-hidden">
            <div className="h-full rounded-pill bg-s-ink transition-[width] duration-300 ease-out" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[11px] text-s-ink-2 mt-1.5">Schritt {i + 1} von {TOTAL}</p>
        </div>
        <button type="button" onClick={next} className="text-[13px] font-medium text-s-ink-2 hover:text-s-ink transition-colors">Überspringen</button>
      </div>

      <h1 className="text-[24px] font-semibold tracking-[-0.02em] leading-[1.15] text-s-ink">{step.q}</h1>
      {step.sub && <p className="text-[14px] text-s-ink-2 mt-1.5 leading-[1.4]">{step.sub}</p>}

      {/* CHIPS — single select (gender/hair/skin) */}
      {step.kind === "chips" && (
        <div className="flex flex-wrap gap-2.5 mt-6">
          {step.opts.map((o) => {
            const on = single[step.field] === o.value;
            return (
              <button key={o.value} type="button"
                onClick={() => setSingle((s) => ({ ...s, [step.field]: o.value }))}
                aria-pressed={on}
                className={`h-[46px] px-5 rounded-pill text-[14.5px] font-medium transition-colors ${on ? "bg-s-ink text-white" : "border border-s-border bg-white text-s-ink hover:bg-s-bg-sunken"}`}>
                {o.label}
              </button>
            );
          })}
        </div>
      )}

      {/* GRID — categories (multi, B&W) */}
      {step.kind === "grid" && (
        <div className="grid grid-cols-2 gap-2.5 mt-6">
          {step.opts.map((o) => {
            const on = multi.categories.includes(o.value);
            return (
              <button key={o.value} type="button" onClick={() => toggleMulti("categories", o.value)} aria-pressed={on}
                className={`relative text-left rounded-card border bg-white p-[15px] transition-colors ${on ? "border-s-ink shadow-[inset_0_0_0_1px_var(--s-ink,#0A0A0A)]" : "border-s-border hover:bg-s-bg-sunken"}`}>
                <span className="grid place-items-center w-[38px] h-[38px] rounded-[11px] bg-s-bg-sunken text-s-ink"><CatIcon name={o.value} /></span>
                <span className="block text-[14.5px] font-medium text-s-ink mt-3">{o.label}</span>
                {on && <span className="absolute top-3 right-3 grid place-items-center w-5 h-5 rounded-full bg-s-ink text-white"><Check size={12} aria-hidden /></span>}
              </button>
            );
          })}
        </div>
      )}

      {/* CARDS — interests (multi, universal-color icons) */}
      {step.kind === "cards" && (
        <div className="flex flex-col gap-2.5 mt-6">
          {step.opts.map((o) => {
            const on = multi.interests.includes(o.value);
            return (
              <button key={o.value} type="button" onClick={() => toggleMulti("interests", o.value)} aria-pressed={on}
                className={`flex items-center gap-3.5 rounded-card border bg-white p-[13px] transition-colors ${on ? "border-s-ink shadow-[inset_0_0_0_1px_var(--s-ink,#0A0A0A)]" : "border-s-border hover:bg-s-bg-sunken"}`}>
                <span className={`grid place-items-center w-[38px] h-[38px] rounded-[11px] shrink-0 bg-s-bg-sunken ${o.cls}`}>{INTEREST_ICON[o.value]}</span>
                <span className="flex-1 text-left">
                  <span className="block text-[15px] font-medium text-s-ink">{o.label}</span>
                  {o.note && <span className="block text-[12px] text-s-ink-2 mt-0.5">{o.note}</span>}
                </span>
                <span className={`grid place-items-center w-[22px] h-[22px] rounded-full shrink-0 ${on ? "bg-s-ink border border-s-ink text-white" : "border-[1.5px] border-s-border"}`}>{on && <Check size={13} aria-hidden />}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-7 flex flex-col gap-3">
        <button type="button" onClick={next} disabled={saving}
          className="w-full h-12 rounded-btn bg-s-ink text-white text-[15px] font-medium disabled:opacity-50 active:scale-[0.99] transition-transform flex items-center justify-center gap-2">
          {saving && <span aria-hidden className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
          {i === TOTAL - 1 ? "Fertig" : "Weiter"}
        </button>
        <div className="text-center">
          <button type="button" onClick={next} className="text-[13px] text-s-ink-2 underline underline-offset-2 hover:text-s-ink transition-colors">Später</button>
        </div>
      </div>
    </div>
  );
}
