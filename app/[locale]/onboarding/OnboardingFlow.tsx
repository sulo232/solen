"use client";

// Customer onboarding (V3-D348). Skippable, one-question-per-screen (Uber rhythm),
// B&W chrome with universal color only on semantic icons. Config-driven steps.
// Saves to PATCH /api/profile: gender + hair_type (columns) + customer_preferences
// JSONB (skinType, categories, interests) merged with any existing prefs.

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronLeft, Check } from "lucide-react";
import { SuccessMark } from "@/app/[locale]/_components/primitives/SuccessMark";
import { toast } from "@/app/[locale]/_components/primitives/Toast";
import {
  GENDER_OPTS, HAIR_OPTS, SKIN_OPTS, CATEGORY_OPTS, INTEREST_OPTS,
  CatIcon, INTEREST_ICON, type Choice, type InterestChoice,
} from "./beautyFields";
import { attributeStoredReferral } from "@/lib/referral/attributeStoredReferral";

type Prefs = Record<string, unknown>;

export interface OnboardingInitial {
  locale: string;
  redirect: string;
  customerPreferences: Prefs;
}

// ── step config ──────────────────────────────────────────────────
// Question copy lives here; the option sets come from ./beautyFields so the
// editable Beauty Profile in settings shares the exact same values.
type Step =
  | { id: string; kind: "chips"; q: string; sub?: string; field: "gender" | "hair_type" | "skinType"; opts: Choice[] }
  | { id: "categories"; kind: "grid"; q: string; sub?: string; opts: Choice[] }
  | { id: "interests"; kind: "cards"; q: string; sub?: string; opts: InterestChoice[] };

const STEPS: Step[] = [
  {
    id: "gender", kind: "chips", field: "gender",
    q: "Wie identifizieren Sie sich?", sub: "Damit wir Stylist:innen & Leistungen auf Sie abstimmen.",
    opts: GENDER_OPTS,
  },
  {
    id: "hair", kind: "chips", field: "hair_type",
    q: "Wie sind Ihre Haare?", sub: "Hilft uns, Sie mit den richtigen Profis zu matchen.",
    opts: HAIR_OPTS,
  },
  {
    id: "skin", kind: "chips", field: "skinType",
    q: "Und Ihre Haut?", sub: "Für Gesichtsbehandlungen, Waxing & empfindliche Haut.",
    opts: SKIN_OPTS,
  },
  {
    id: "categories", kind: "grid",
    q: "Was suchen Sie?", sub: "Wählen Sie, was Sie buchen — wir bauen Ihre Startseite darum.", // em-dash-ok: pre-existing, unrelated to this edit
    opts: CATEGORY_OPTS,
  },
  {
    id: "interests", kind: "cards",
    q: "Was interessiert Sie?", sub: "Das zeigen wir Ihnen zuerst auf Ihrer Startseite.",
    opts: INTEREST_OPTS,
  },
];
const TOTAL = STEPS.length;

export default function OnboardingFlow({ locale, redirect, customerPreferences }: OnboardingInitial) {
  const t = useTranslations("common");
  const router = useRouter();
  const [i, setI] = React.useState(0);
  const [done, setDone] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  // collected answers
  const [single, setSingle] = React.useState<Record<string, string>>({});
  const [multi, setMulti] = React.useState<Record<string, string[]>>({ categories: [], interests: [] });

  const step = STEPS[i];
  const progress = Math.round(((i + 1) / TOTAL) * 100);

  // GAP #49: attribute a pending referral. /referral/[code]/page.tsx stashes the code in
  // localStorage on mount but nothing ever reads it back, so the referrer was never
  // credited. This page is the earliest reliable point after signup where a session is
  // guaranteed (the server component above redirects to /auth/login when there is none),
  // so it is the right hook. Runs once on mount, fire-and-forget, never blocks the wizard.
  // A brand new user almost always has 0 bookings yet, so this call typically hits the
  // "book first" gate and leaves the code stored; the SECOND retry, once a booking
  // actually exists, lives in BookingConfirmation.tsx (shared logic: attributeStoredReferral).
  React.useEffect(() => {
    attributeStoredReferral();
  }, []);

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

      // Always persist — even a full skip counts as "been through onboarding",
      // so onboarding_completed flips and the user isn't re-prompted later.
      const body: Record<string, unknown> = { customer_preferences: prefs, onboarding_completed: true };
      if (single.gender) body.gender = single.gender;
      if (single.hair_type) body.hair_type = single.hair_type;
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        console.error("[Onboarding] save failed:", e?.message ?? res.status);
        toast.error("Speichern fehlgeschlagen — Sie können es später im Profil ergänzen."); // em-dash-ok: pre-existing, unrelated to this edit
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
        {/* 15 success moment (mockup 15, 2026-06-11): SuccessMark + staggered rise,
            consistent with booking / walk-in / gift-card celebrations. */}
        <SuccessMark size={58} className="mb-5" />
        <h1 className="celebrate-rise text-[24px] font-semibold tracking-[-0.02em] text-s-ink" style={{ animationDelay: "0.46s" }}>Alles bereit</h1>
        <p className="celebrate-rise text-[15px] text-s-ink-2 mt-2 max-w-[300px] leading-[1.4]" style={{ animationDelay: "0.56s" }}>Ihre Solen-Startseite ist auf das zugeschnitten, was Sie gewählt haben.</p>
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
        <button type="button" onClick={back} disabled={i === 0} aria-label={t("back")}
          className="grid place-items-center h-11 w-11 rounded-full border border-s-border text-s-ink disabled:opacity-40 hover:bg-s-bg-sunken transition-colors">{/* content-image-ok: back-button chevron glyph on an icon button, not a photo/avatar fallback slot */}
          <ChevronLeft size={16} strokeWidth={1.9} aria-hidden />
        </button>
        <div className="flex-1">
          <div className="h-[5px] rounded-pill bg-s-bg-sunken overflow-hidden">
            <div className="h-full rounded-pill bg-s-ink transition-[width] duration-300 ease-out" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[12px] text-s-ink-2 mt-1.5">Schritt {i + 1} von {TOTAL}</p>
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
                className={`h-[46px] px-5 rounded-pill text-[14.5px] font-medium transition-colors ${
                  // mockup-ok: locked selected-state contract (CLAUDE.md design contract, gate no-black-selected), gray sunken, never ink fill
                  on ? "bg-s-bg-sunken text-s-ink font-semibold border border-s-border" : "border border-s-border bg-white text-s-ink hover:bg-s-bg-sunken"
                }`}>
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
          <button type="button" onClick={next} className="text-[13px] font-medium text-s-ink-2 hover:text-s-ink transition-colors">Später</button>
        </div>
      </div>
    </div>
  );
}
