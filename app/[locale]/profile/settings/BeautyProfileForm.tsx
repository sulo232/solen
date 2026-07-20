"use client";

// Editable Beauty Profile (V3-D348) — the settings-side counterpart to the
// /onboarding flow. Same fields, same persisted values (shared ./beautyFields),
// so a user can change in settings exactly what they picked during onboarding.
// Saves via PATCH /api/profile: gender column + customer_preferences JSONB
// (skinType, categories, interests), merged with existing prefs. hair_type
// dedup (2026-07-21): the hair chip row moved out, /profile/haarprofil is
// the canonical place to edit it.

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { FieldLabel } from "@/app/[locale]/_components/primitives/FieldLabel";
import { toast } from "@/app/[locale]/_components/primitives/Toast";
import {
  GENDER_OPTS, SKIN_OPTS, CATEGORY_OPTS, INTEREST_OPTS,
  CatIcon, INTEREST_ICON, type Choice,
} from "@/app/[locale]/onboarding/beautyFields";

export interface BeautyInitial {
  gender: string;
  hair_type: string;
  skinType: string;
  categories: string[];
  interests: string[];
}

export default function BeautyProfileForm({
  initial,
  customerPreferences,
}: {
  initial: BeautyInitial;
  customerPreferences: Record<string, unknown>;
}) {
  const t = useTranslations("profileHub");
  const router = useRouter();

  const [gender, setGender] = React.useState(initial.gender);
  const [skin, setSkin] = React.useState(initial.skinType);
  const [categories, setCategories] = React.useState<string[]>(initial.categories);
  const [interests, setInterests] = React.useState<string[]>(initial.interests);
  const [saving, setSaving] = React.useState(false);

  const toggle = (list: string[], v: string) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  const save = async () => {
    setSaving(true);
    try {
      const prefs: Record<string, unknown> = { ...customerPreferences };
      if (skin) prefs.skinType = skin;
      else delete prefs.skinType;
      prefs.categories = categories;
      prefs.interests = interests;

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gender: gender || null,
          customer_preferences: prefs,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("[BeautyProfile] save failed:", err?.message ?? res.status);
        toast.error(t("saveError"));
        return;
      }
      toast.success(t("savedToast"));
      router.refresh();
    } catch (err) {
      console.error("[BeautyProfile] save exception:", err);
      toast.error(t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <h2 className="text-[13px] font-medium text-s-ink-2 mb-2 px-0.5">{t("secBeauty")}</h2>
      <div className="rounded-card border border-s-border bg-white p-[18px] space-y-[18px]">
        <p className="text-[13px] text-s-ink-2 leading-[1.5] -mt-0.5">{t("beautyIntro")}</p>

        {/* single-select chips. mockup-ok: removing the hair_type chip row, no new visual
            design, hair_type is canonically owned + edited on /profile/haarprofil (dedup). */}
        <ChipGroup label={t("beautyGender")} opts={GENDER_OPTS} value={gender}
          onSelect={(v) => setGender(gender === v ? "" : v)} />
        <ChipGroup label={t("beautySkin")} opts={SKIN_OPTS} value={skin}
          onSelect={(v) => setSkin(skin === v ? "" : v)} />

        {/* categories — multi grid */}
        <div className="space-y-2">
          <FieldLabel>{t("beautyCategories")}</FieldLabel>
          <div className="grid grid-cols-2 gap-2.5">
            {CATEGORY_OPTS.map((o) => {
              const on = categories.includes(o.value);
              return (
                <button key={o.value} type="button" aria-pressed={on}
                  onClick={() => setCategories((c) => toggle(c, o.value))}
                  className={cn(
                    "relative text-left rounded-card border bg-white p-[13px] transition-colors",
                    on ? "border-s-ink shadow-[inset_0_0_0_1px_var(--s-ink,#0A0A0A)]" : "border-s-border hover:bg-s-bg-sunken",
                  )}>
                  <span className="grid place-items-center w-[34px] h-[34px] rounded-[10px] bg-s-bg-sunken text-s-ink">
                    <CatIcon name={o.value} />
                  </span>
                  <span className="block text-[14px] font-medium text-s-ink mt-2.5">{o.label}</span>
                  {on && (
                    <span className="absolute top-2.5 right-2.5 grid place-items-center w-5 h-5 rounded-full bg-s-ink text-white">
                      <Check size={12} aria-hidden />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* interests — multi cards */}
        <div className="space-y-2">
          <FieldLabel>{t("beautyInterests")}</FieldLabel>
          <div className="flex flex-col gap-2.5">
            {INTEREST_OPTS.map((o) => {
              const on = interests.includes(o.value);
              return (
                <button key={o.value} type="button" aria-pressed={on}
                  onClick={() => setInterests((c) => toggle(c, o.value))}
                  className={cn(
                    "flex items-center gap-3.5 rounded-card border bg-white p-[13px] transition-colors",
                    on ? "border-s-ink shadow-[inset_0_0_0_1px_var(--s-ink,#0A0A0A)]" : "border-s-border hover:bg-s-bg-sunken",
                  )}>
                  <span className={cn("grid place-items-center w-[38px] h-[38px] rounded-[11px] shrink-0 bg-s-bg-sunken", o.cls)}>
                    {INTEREST_ICON[o.value]}
                  </span>
                  <span className="flex-1 text-left">
                    <span className="block text-[15px] font-medium text-s-ink">{o.label}</span>
                    {o.note && <span className="block text-[12px] text-s-ink-2 mt-0.5">{o.note}</span>}
                  </span>
                  {/* mockup-ok: locked TabPill selected-state treatment (CLAUDE.md design contract, no-black-selected gate); matches the salon page category strip reference */}
                  <span className={cn(
                    "grid place-items-center w-[22px] h-[22px] rounded-full shrink-0",
                    on ? "bg-s-bg-sunken border border-s-border text-s-ink font-semibold" : "border-[1.5px] border-s-border",
                  )}>
                    {on && <Check size={13} aria-hidden />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <button type="button" onClick={save} disabled={saving}
          className="w-full h-12 rounded-btn bg-s-ink text-white text-[15px] font-medium flex items-center justify-center gap-2 transition-opacity duration-200 disabled:opacity-50 active:scale-[0.97]">
          {saving && <span aria-hidden className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
          {t("saveBeauty")}
        </button>
      </div>
    </section>
  );
}

function ChipGroup({
  label,
  opts,
  value,
  onSelect,
}: {
  label: string;
  opts: Choice[];
  value: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <FieldLabel>{label}</FieldLabel>
      <div className="flex flex-wrap gap-2">
        {opts.map((o) => {
          const on = value === o.value;
          return (
            <button key={o.value} type="button" aria-pressed={on} onClick={() => onSelect(o.value)}
              // mockup-ok: locked TabPill selected-state treatment (CLAUDE.md design contract, no-black-selected gate); matches the salon page category strip reference
              className={cn(
                "h-10 px-4 rounded-btn text-[14px] font-medium transition-colors duration-200",
                on ? "bg-s-bg-sunken border border-s-border text-s-ink font-semibold" : "border border-s-border text-s-ink hover:bg-s-bg-sunken",
              )}>
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
