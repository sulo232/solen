"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import { useBooking } from "@/lib/booking-context";
import { HAIR_OPTS, HAIR_LENGTH_OPTS } from "@/app/[locale]/onboarding/beautyFields";
import { Avatar } from "@/app/[locale]/_components/primitives";

/**
 * HairStep — booking step 3 "Deine Haare" (owner mockup booking-hair-step.html, audit gap).
 *
 * Light, optional-feeling step between Zeit and Bezahlen, only mounted when the cart
 * contains hair services (wizard gates it by service category — data-driven, no
 * category branches inside this component, V3-D205).
 *
 *  - Pre-fills hair type + length from the customer's profile (real columns
 *    profiles.hair_type / hair_length) and shows the "Aus deinem Haarprofil übernommen"
 *    chip ONLY when something was actually pre-filled (no fabricated provenance).
 *  - Non-blocking mismatch hint when a chosen service name implies a length that
 *    contradicts the selection ("Kurzhaarschnitt" while profile/selection says long).
 *  - Weiter saves the values BACK to the profile (logged-in only; PATCH /api/profile)
 *    and advances to pay-confirm. Guests can still pick — values just aren't persisted.
 *
 * Option VALUES come from the shared beautyFields source (straight/wavy/… short/…)
 * so the booking step and the profile editor can never drift. Labels there are
 * German-only for now (documented follow-up in QUESTIONS.md Q-onboarding-i18n).
 */

// Inline stroke glyphs matching the mockup's hair-texture icons (straight lines →
// waves → curls → coils). Decorative — the label carries the meaning.
function HairGlyph({ type }: { type: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const };
  switch (type) {
    case "straight":
      return (
        <svg width="26" height="26" viewBox="0 0 24 24" {...common} aria-hidden>
          <path d="M8 4v16M12 4v16M16 4v16" />
        </svg>
      );
    case "wavy":
      return (
        <svg width="26" height="26" viewBox="0 0 24 24" {...common} aria-hidden>
          <path d="M8 4c2 2-2 4 0 6s-2 4 0 6 2 4 0 4M13 4c2 2-2 4 0 6s-2 4 0 6 2 4 0 4M18 4c2 2-2 4 0 6s-2 4 0 6 2 4 0 4" />
        </svg>
      );
    case "curly":
      return (
        <svg width="26" height="26" viewBox="0 0 24 24" {...common} aria-hidden>
          <path d="M8 4a2 2 0 1 1 0 4 2 2 0 1 0 0 4 2 2 0 1 1 0 4 2 2 0 1 0 0 4M15 4a2 2 0 1 1 0 4 2 2 0 1 0 0 4 2 2 0 1 1 0 4 2 2 0 1 0 0 4" />
        </svg>
      );
    default: // coily
      return (
        <svg width="26" height="26" viewBox="0 0 24 24" {...common} aria-hidden>
          <path d="M7 4q3 1.5 0 3t0 3 0 3 0 3 0 3M12 4q3 1.5 0 3t0 3 0 3 0 3 0 3M17 4q3 1.5 0 3t0 3 0 3 0 3 0 3" />
        </svg>
      );
  }
}

// Length keywords a service name can imply (lowercased compare). Conservative on
// purpose: only flag clear contradictions, never block.
const SHORT_HINTS = ["kurzhaar", "kurz", "short hair", "buzz"];
const LONG_HINTS = ["langhaar", "lange haare", "long hair"];

export default function HairStep() {
  const t = useTranslations("booking");
  const { formData, goToStep } = useBooking();

  const [hairType, setHairType] = React.useState<string>("");
  const [hairLength, setHairLength] = React.useState<string>("");
  const [prefilled, setPrefilled] = React.useState(false);
  const [profileName, setProfileName] = React.useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [loggedIn, setLoggedIn] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // Pre-fill from the real profile. 401 = guest → step still works, nothing persisted.
  React.useEffect(() => {
    let alive = true;
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!alive || !j) return;
        const p = j.data ?? j;
        setLoggedIn(true);
        setProfileName(p?.display_name ?? null);
        setAvatarUrl(p?.avatar_url ?? null);
        const ht = p?.hair_type && p.hair_type !== "unknown" ? p.hair_type : "";
        const hl = p?.hair_length ?? "";
        if (ht) setHairType(ht);
        if (hl) setHairLength(hl);
        if (ht || hl) setPrefilled(true);
      })
      .catch(() => { /* guest / offline — picker still usable */ });
    return () => { alive = false; };
  }, []);

  // Mismatch: a selected service NAME implies a length that contradicts the chosen one.
  const serviceNames = formData.services.map((s) => (s.name_de || s.name_en || "").toLowerCase());
  const impliesShort = serviceNames.some((n) => SHORT_HINTS.some((h) => n.includes(h)));
  const impliesLong = serviceNames.some((n) => LONG_HINTS.some((h) => n.includes(h)));
  const mismatch =
    (impliesShort && (hairLength === "long" || hairLength === "very_long")) ||
    (impliesLong && hairLength === "short");
  const lengthLabel = HAIR_LENGTH_OPTS.find((o) => o.value === hairLength)?.label ?? "";

  const handleNext = async () => {
    if (loggedIn && (hairType || hairLength)) {
      setSaving(true);
      try {
        await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(hairType ? { hair_type: hairType } : {}),
            ...(hairLength ? { hair_length: hairLength } : {}),
          }),
        });
      } catch (err) {
        console.error("[HairStep] profile save failed:", err);
        // non-fatal — the booking continues either way
      } finally {
        setSaving(false);
      }
    }
    goToStep("pay-confirm");
  };

  return (
    <div className="pb-28">
      <p className="text-[14px] leading-relaxed text-s-ink-2">{t("hairSub")}</p>

      {/* Provenance chip — only when something was really pre-filled */}
      {prefilled && (
        <div className="mt-4 flex items-center gap-3 rounded-[14px] bg-s-bg-sunken px-4 py-3">
          <Avatar src={avatarUrl} name={profileName ?? "?"} size={32} />
          <p className="text-[14px] text-s-ink-2">
            {t.rich("hairFromProfile", {
              b: (chunks) => <span className="font-semibold text-s-ink">{chunks}</span>,
            })}
          </p>
        </div>
      )}

      {/* Mismatch hint — non-blocking, only on a real contradiction */}
      {mismatch && (
        <div className="mt-4 flex items-start gap-3 rounded-[14px] bg-s-warning/10 px-4 py-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-s-warning" aria-hidden />
          <div className="min-w-0 text-[14px]">
            <p className="font-semibold text-s-ink">{t("hairMismatchTitle")}</p>
            <p className="mt-0.5 text-s-ink-2">
              {t("hairMismatchBody", { length: lengthLabel })}{" "}
              <button
                type="button"
                onClick={() => goToStep("services-staff")}
                className="font-semibold text-s-accent"
              >
                {t("hairChangeService")}
              </button>
            </p>
          </div>
        </div>
      )}

      {/* HAARTYP — 4 tiles, icon above label (mockup) */}
      <p className="mt-6 text-[12px] font-semibold uppercase tracking-[0.08em] text-s-ink-3">{t("hairTypeLabel")}</p>
      <div className="mt-2.5 grid grid-cols-4 gap-2">
        {HAIR_OPTS.filter((o) => o.value !== "unknown").map((o) => {
          const on = hairType === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => setHairType(on ? "" : o.value)}
              aria-pressed={on}
              className={`flex flex-col items-center gap-2 rounded-[14px] border py-4 transition-colors duration-150 ${
                on ? "border-s-ink bg-s-ink text-white" : "border-s-border bg-white text-s-ink hover:border-s-ink/30"
              }`}
            >
              <HairGlyph type={o.value} />
              <span className="text-[13px] font-medium">{o.label}</span>
            </button>
          );
        })}
      </div>

      {/* LÄNGE — pills */}
      <p className="mt-6 text-[12px] font-semibold uppercase tracking-[0.08em] text-s-ink-3">{t("hairLengthLabel")}</p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {HAIR_LENGTH_OPTS.map((o) => {
          const on = hairLength === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => setHairLength(on ? "" : o.value)}
              aria-pressed={on}
              className={`rounded-full border px-5 py-2.5 text-[14px] font-medium transition-colors duration-150 ${
                on ? "border-s-ink bg-s-ink text-white" : "border-s-border bg-white text-s-ink hover:border-s-ink/30"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>

      {/* Weiter — fixed action bar matching the wizard's other steps */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-s-border bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto max-w-2xl">
          <button
            type="button"
            onClick={handleNext}
            disabled={saving}
            className="h-[52px] w-full rounded-btn bg-s-ink text-[15px] font-semibold text-white transition-transform duration-150 active:scale-[0.98] disabled:opacity-60"
          >
            {t("hairNext")}
          </button>
        </div>
      </div>
    </div>
  );
}
