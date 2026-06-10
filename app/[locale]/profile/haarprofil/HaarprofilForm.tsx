"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { HAIR_OPTS, HAIR_LENGTH_OPTS, HAIR_THICKNESS_OPTS, type Choice } from "@/app/[locale]/onboarding/beautyFields";
import { toast } from "@/app/[locale]/_components/primitives/Toast";

/**
 * HaarprofilForm — the editable V1 of the hair profile (real columns only).
 * Same pill affordance as the booking HairStep / settings ChipGroup so the
 * profile never "looks different" from where the values are used.
 */

function PillRow({
  label, opts, value, onSelect,
}: { label: string; opts: Choice[]; value: string; onSelect: (v: string) => void }) {
  return (
    <div className="mt-6">
      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-s-ink-3">{label}</p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {opts.map((o) => {
          const on = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onSelect(on ? "" : o.value)}
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
    </div>
  );
}

export default function HaarprofilForm({
  initial,
}: {
  initial: { hair_type: string; hair_length: string; hair_thickness: string };
}) {
  const t = useTranslations("haarprofil");
  const [hairType, setHairType] = React.useState(initial.hair_type === "unknown" ? "" : initial.hair_type);
  const [hairLength, setHairLength] = React.useState(initial.hair_length);
  const [hairThickness, setHairThickness] = React.useState(initial.hair_thickness);
  const [saving, setSaving] = React.useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hair_type: hairType || null,
          hair_length: hairLength || null,
          hair_thickness: hairThickness || null,
        }),
      });
      if (!res.ok) throw new Error(`PATCH failed: ${res.status}`);
      toast.success(t("saved"));
    } catch (err) {
      console.error("[Haarprofil] save failed:", err);
      toast.error(t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-24">
      <PillRow label={t("type")} opts={HAIR_OPTS.filter((o) => o.value !== "unknown")} value={hairType} onSelect={setHairType} />
      <PillRow label={t("length")} opts={HAIR_LENGTH_OPTS} value={hairLength} onSelect={setHairLength} />
      <PillRow label={t("thickness")} opts={HAIR_THICKNESS_OPTS} value={hairThickness} onSelect={setHairThickness} />

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="mt-8 h-[52px] w-full rounded-btn bg-s-ink text-[15px] font-semibold text-white transition-transform duration-150 active:scale-[0.98] disabled:opacity-60"
      >
        {t("save")}
      </button>
    </div>
  );
}
