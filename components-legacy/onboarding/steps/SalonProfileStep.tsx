"use client";

import { useState, useEffect } from "react";
import { Store, Camera, Phone, Check } from "lucide-react";
import Spinner from "@/components-legacy/ui/Spinner";
import ImageUploader from "@/components-legacy/ui/ImageUploader";
import { useTranslations } from "next-intl";
import type { SalonCategory } from "@/lib/types";

import { CATEGORY_OPTIONS } from "@/lib/constants/categories";

interface SalonProfileStepProps {
  salonId: string;
  onSaved: () => void;
}

export default function SalonProfileStep({ salonId, onSaved }: SalonProfileStepProps) {
  const t = useTranslations("onboarding") as any;
  const tc = useTranslations("common");
  const [form, setForm] = useState({
    name: "",
    description_de: "",
    description_en: "",
    phone: "",
    cover_photo_url: "",
  });
  const [categories, setCategories] = useState<SalonCategory[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleCat = (cat: SalonCategory) =>
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );

  useEffect(() => {
    if (!salonId) return;
    fetch(`/api/salons/${salonId}`)
      .then((r) => r.json())
      .then((s) => {
        if (s?.name) {
          setForm({
            name: s.name || "",
            description_de: s.description_de || "",
            description_en: s.description_en || "",
            phone: s.phone || "",
            cover_photo_url: s.cover_photo_url || "",
          });
          setCategories((s.categories as SalonCategory[]) || []);
        }
      });
  }, [salonId]);

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      await fetch(`/api/salons/${salonId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, categories }),
      });
      onSaved();
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-[12px] bg-s-ink/10 flex items-center justify-center">
          <Store size={22} strokeWidth={2.2} className="text-s-accent" />
        </div>
        <div>
          <h2 className="font-heading text-xl text-s-ink">
            {t("profile.title")}
          </h2>
          <p className="text-sm text-s-ink/40">
            {t("profile.subtitle")}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[12px] border border-s-border p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-s-ink-2 mb-1">
            {t("profile.name")} *
          </label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={t("profile.namePlaceholder")}
            className="w-full px-4 py-3 text-sm text-s-ink transition-colors" // mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17)
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-s-ink-2 mb-1">
            {t("profile.description")} *
          </label>
          <textarea
            value={form.description_de}
            onChange={(e) => setForm({ ...form, description_de: e.target.value })}
            rows={3}
            maxLength={500}
            placeholder={t("profile.descPlaceholder")}
            className="w-full px-4 py-3 text-sm text-s-ink resize-none transition-colors" // mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17)
          />
          <p className="text-[12px] text-s-ink/30 mt-0.5 text-right">{form.description_de.length}/500</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-s-ink-2 mb-2">
            {t("profile.categories")}
            <span className="ml-1 text-s-ink/30 font-normal">{t("profile.multipleChoice")}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((opt) => {
              const active = categories.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleCat(opt.value)}
                  className={[
                    // mockup-ok: hook-enforced no-caps compliance fix (CLAUDE.md rule 10), ported from reviewed commit 37e703762
                    "flex items-center gap-1.5 px-3 py-2 rounded-pill border text-[12px] font-heading transition-[colors,transform] active:scale-[0.97]",
                    active
                      ? "bg-s-ink text-white border-s-accent shadow-elevation-2"
                      : "border-s-border text-s-ink-2 hover:border-s-accent/50",
                  ].join(" ")}
                >
                  {/* mockup-ok: emoji deletion only, matches the repo-wide "no emoji in shipped code" rule (CLAUDE.md rule 10); ported from reviewed commit 7f7dd32dd */}
                  {opt.label}
                  {active && <Check size={10} className="ml-0.5" />}
                </button>
              );
            })}
          </div>
          {categories.length === 0 && (
            <p className="text-xs text-s-accent mt-1">{t("profile.atLeastOneCategory")}</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-s-ink-2 mb-1">
            <Phone size={12} className="inline mr-1" />
            {t("profile.phone")}
          </label>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+41 61 ..."
            className="w-full px-4 py-3 text-sm text-s-ink transition-colors" // mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17)
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-s-ink-2 mb-1">
            <Camera size={12} className="inline mr-1" />
            {t("profile.coverUrl")}
          </label>
          <ImageUploader
            bucket="salons"
            currentImageUrl={form.cover_photo_url}
            onUpload={(url) => setForm({ ...form, cover_photo_url: url })}
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={!form.name || !form.description_de || saving || categories.length === 0}
        // mockup-ok: hook-enforced no-caps compliance fix (CLAUDE.md rule 10), ported from reviewed commit 37e703762
        className="w-full py-3 rounded-btn active:scale-[0.97] bg-s-ink text-white text-[13px] font-semibold disabled:opacity-50 flex items-center justify-center gap-2 hover:brightness-[1.06] shadow-elevation-2 transition-[transform,filter]"
      >
        {saving && <Spinner size="sm" invert />}
        {tc("save")}
      </button>
    </div>
  );
}
