"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { AlertTriangle, Check } from "lucide-react";
import { useBooking } from "@/lib/booking-context";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { HAIR_OPTS, HAIR_LENGTH_OPTS, HAIR_THICKNESS_OPTS, HAIR_BEARD_OPTS, type Choice } from "@/app/[locale]/onboarding/beautyFields";
import { Avatar, useEnterMotion } from "@/app/[locale]/_components/primitives";
import type { StaffMember } from "@/lib/types";

/**
 * HairStep v3 — owner-approved mockup booking-hair-step-v2.html (2026-06-11).
 *
 * Punch-list rules baked in: NO hand-drawn glyphs (Lucide-only), NO tracked-uppercase
 * labels (normal-case 13px semibold), uniform pills for every group, white cards,
 * step is fully skippable (Überspringen — it prepares, never gates).
 *
 *  - Card 1 "hair facts": Haartyp / Länge / Dicke — pre-filled from the real profile
 *    columns; provenance chip only when something WAS pre-filled.
 *  - Card 2 "for the barber": Bart (only when the cart has a barbershop service —
 *    data-driven via the wizard's showBeard) + a one-line Notiz that travels WITH THE
 *    BOOKING (bookings.customer_note via formData), not the profile.
 *  - Weiter persists hair facts (+beard) back to the profile (logged-in only).
 */

function PillGroup({
  label, opts, value, onSelect,
}: { label: string; opts: Choice[]; value: string; onSelect: (v: string) => void }) {
  return (
    <div className="mt-4 first:mt-0">
      <p className="text-[13px] font-semibold text-s-ink">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {opts.map((o) => {
          const on = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onSelect(on ? "" : o.value)}
              aria-pressed={on}
              className={`rounded-full border px-4 py-2 text-[13.5px] font-medium transition-colors duration-150 ${
                // mockup-ok: locked selected-state contract (CLAUDE.md design contract, gate no-black-selected), gray sunken, never ink fill
                on ? "border-s-border bg-s-bg-sunken text-s-ink font-semibold" : "border-s-border bg-white text-s-ink hover:border-s-ink/30"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const SHORT_HINTS = ["kurzhaar", "kurz", "short hair", "buzz"];
const LONG_HINTS = ["langhaar", "lange haare", "long hair"];

export default function HairStep({
  staff,
  showBeard,
}: {
  /** The selected stylist (null when "Keine Präferenz") — heads the barber card. */
  staff: StaffMember | null;
  /** Cart contains a barbershop service → show the Bart group (data-driven). */
  showBeard: boolean;
}) {
  const t = useTranslations("booking");
  const { formData, goToStep, updateFormData } = useBooking();

  const [hairType, setHairType] = React.useState("");
  const [hairLength, setHairLength] = React.useState("");
  const [hairThickness, setHairThickness] = React.useState("");
  const [beard, setBeard] = React.useState("");
  const [note, setNote] = React.useState(formData.customerNote ?? "");
  const [prefilled, setPrefilled] = React.useState(false);
  const [loggedIn, setLoggedIn] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    // Local session read first (no network) — guests skip the fetch entirely,
    // otherwise the guest hair step logs a 401 console error.
    createBrowserSupabaseClient().auth.getSession().then(({ data }) => {
      if (!alive || !data.session) return;
      fetch("/api/profile")
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => {
          if (!alive || !j) return;
          const p = j.data ?? j;
          setLoggedIn(true);
          const ht = p?.hair_type && p.hair_type !== "unknown" ? p.hair_type : "";
          const hl = p?.hair_length ?? "";
          const hd = p?.hair_thickness ?? "";
          const hb = p?.hair_beard ?? "";
          if (ht) setHairType(ht);
          if (hl) setHairLength(hl);
          if (hd) setHairThickness(hd);
          if (hb) setBeard(hb);
          if (ht || hl || hd) setPrefilled(true);
        })
        .catch(() => { /* offline — picker still usable, nothing persisted */ });
    });
    return () => { alive = false; };
  }, []);

  const serviceNames = formData.services.map((s) => (s.name_de || s.name_en || "").toLowerCase());
  const impliesShort = serviceNames.some((n) => SHORT_HINTS.some((h) => n.includes(h)));
  const impliesLong = serviceNames.some((n) => LONG_HINTS.some((h) => n.includes(h)));
  const mismatch =
    (impliesShort && (hairLength === "long" || hairLength === "very_long")) ||
    (impliesLong && hairLength === "short");
  const lengthLabel = HAIR_LENGTH_OPTS.find((o) => o.value === hairLength)?.label ?? "";

  const advance = () => goToStep("pay-confirm");

  // ENTER RECIPE (MOTION.md, owner-approved 2026-07-09), applied per-card, not the
  // `pb-32` root: the root also holds the fixed bottom action bar, and a resting
  // `filter: blur(0px)` never collapses to `none` (framer-motion only special cases
  // `transform`), so it would establish a containing block and detach the bar from
  // the viewport. Neither card has a `position: fixed` descendant, so both are safe.
  const cardOneMotion = useEnterMotion();
  const cardTwoMotion = useEnterMotion(0.05);

  const handleNext = () => {
    // The note rides on THIS booking (bookings.customer_note), not the profile.
    updateFormData({ customerNote: note.trim() || null });
    // Best-effort profile save, fire-and-forget: awaiting it blocked the step
    // transition for a full roundtrip (owner 2026-06-12: "the notes takes us
    // too long"). The booking itself never depends on this PATCH.
    if (loggedIn && (hairType || hairLength || hairThickness || beard)) {
      fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(hairType ? { hair_type: hairType } : {}),
          ...(hairLength ? { hair_length: hairLength } : {}),
          ...(hairThickness ? { hair_thickness: hairThickness } : {}),
          ...(beard ? { hair_beard: beard } : {}),
        }),
      }).catch((err) => console.error("[HairStep] profile save failed:", err));
    }
    advance();
  };

  return (
    <div className="pb-32">
      <p className="text-[14px] text-s-ink-2">{t("hairSub")}</p>

      {/* Card 1, hair facts. mockup-ok: approved /dev/motion-recipe ENTER RECIPE */}
      <motion.div {...cardOneMotion} className="mt-4 rounded-card border border-s-border bg-white p-4 shadow-elevation-1">
        {prefilled && (
          <div className="mb-4 flex items-center gap-2.5 rounded-[12px] bg-s-bg-sunken px-3 py-2.5 text-[13px] text-s-ink-2">
            <span>
              {t.rich("hairFromProfile", {
                b: (chunks) => <span className="font-semibold text-s-ink">{chunks}</span>,
              })}
            </span>
            <Check size={14} strokeWidth={1.6} className="ml-auto shrink-0 text-s-success" aria-hidden />
          </div>
        )}
        <PillGroup label={t("hairTypeLabel")} opts={HAIR_OPTS.filter((o) => o.value !== "unknown")} value={hairType} onSelect={setHairType} />
        <PillGroup label={t("hairLengthLabel")} opts={HAIR_LENGTH_OPTS} value={hairLength} onSelect={setHairLength} />
        <PillGroup label={t("hairThicknessLabel")} opts={HAIR_THICKNESS_OPTS} value={hairThickness} onSelect={setHairThickness} />
      </motion.div>

      {/* Card 2, for the barber: beard (barbershop carts) + the one-line note. mockup-ok: approved /dev/motion-recipe ENTER RECIPE */}
      <motion.div {...cardTwoMotion} className="mt-3 rounded-card border border-s-border bg-white p-4 shadow-elevation-1">
        <div className="flex items-center gap-2.5">
          {staff ? (
            <>
              <Avatar src={staff.avatar_url} name={staff.name} size={38} />
              <div className="min-w-0">
                <p className="truncate font-heading text-[15px] font-semibold text-s-ink">{t("hairForStaff", { name: staff.name })}</p>
                <p className="text-[12.5px] text-s-ink-2">{t("hairYourStylist")}</p>
              </div>
            </>
          ) : (
            <p className="font-heading text-[15px] font-semibold text-s-ink">{t("hairForSalon")}</p>
          )}
        </div>

        {showBeard && (
          <PillGroup label={t("hairBeardLabel")} opts={HAIR_BEARD_OPTS} value={beard} onSelect={setBeard} />
        )}

        {/* Notiz — the standard textarea primitive (globals.css input base:
            filled grey, no bespoke shell/icon), short placeholder + counter.
            Owner 2026-06-12 (3rd ask): the pencil-disc one-liner was off-system. */}
        <div className="mt-4">
          <label htmlFor="booking-note" className="text-[13px] font-semibold text-s-ink">
            {t("hairNoteLabel")}
          </label>
          {/* 500 (was 140): the note doubles as the discovery "how to cut it" instruction, which is auto-filled
              when booking a look (the AI cut-script runs ~400 chars), so the one-liner cap would truncate it. */}
          <textarea
            id="booking-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            rows={note.length > 140 ? 5 : 3}
            placeholder={t("hairNotePlaceholder")}
            className="mt-2 w-full"
          />
          <p className="mt-1 text-right text-[11.5px] tabular-nums text-s-ink-2">{note.length}/500</p>
        </div>
      </motion.div>

      {/* Mismatch, non-blocking, one line */}
      {mismatch && (
        <div className="mt-3 flex items-start gap-2.5 rounded-[12px] bg-s-warning/10 px-3.5 py-2.5">
          <AlertTriangle size={15} strokeWidth={1.9} className="mt-0.5 shrink-0 text-s-warning" aria-hidden />
          <p className="text-[12.5px] leading-relaxed text-s-ink-2">
            <span className="font-semibold text-s-ink">{t("hairMismatchTitle")}</span>{" "}
            {t("hairMismatchBody", { length: lengthLabel })}{" "}
            <button type="button" onClick={() => goToStep("services-staff")} className="font-semibold text-s-accent">
              {t("hairChangeService")}
            </button>
          </p>
        </div>
      )}

      {/* Weiter + Überspringen */}
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
          <button
            type="button"
            onClick={advance}
            className="mt-2.5 block w-full text-center text-[13.5px] font-medium text-s-ink-2"
          >
            {t("hairSkip")}
          </button>
        </div>
      </div>
    </div>
  );
}
