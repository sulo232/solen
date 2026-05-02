"use client";

import { useState, useEffect } from "react";
import { Store, Camera, Phone, Check } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import ImageUploader from "@/components/ui/ImageUploader";
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
        <div className="w-12 h-12 rounded-[12px] bg-s-coral/10 flex items-center justify-center">
          <Store size={22} className="text-s-coral" />
        </div>
        <div>
          <h2 className="font-heading font-bold text-xl text-s-ink">
            {t("profile.title")}
          </h2>
          <p className="text-sm text-s-ink/40">
            {t("profile.subtitle")}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[12px] border border-s-ink/5 p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-s-ink/50 mb-1">
            {t("profile.name")} *
          </label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={t("profile.namePlaceholder")}
            className="w-full px-4 py-3 rounded-input border border-s-ink/10 bg-white text-sm text-s-ink focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-s-ink/50 mb-1">
            {t("profile.description")} *
          </label>
          <textarea
            value={form.description_de}
            onChange={(e) => setForm({ ...form, description_de: e.target.value })}
            rows={3}
            maxLength={500}
            placeholder={t("profile.descPlaceholder")}
            className="w-full px-4 py-3 rounded-input border border-s-ink/10 bg-white text-sm text-s-ink focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20 resize-none transition-colors"
          />
          <p className="text-[10px] text-s-ink/30 mt-0.5 text-right">{form.description_de.length}/500</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-s-ink/50 mb-2">
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
                    "flex items-center gap-1.5 px-3 py-2 rounded-pill border text-[11px] font-heading font-bold uppercase tracking-[.06em] transition-colors active:scale-[0.97]",
                    active
                      ? "bg-s-coral text-white border-s-coral shadow-coral-glow"
                      : "border-s-ink/[0.08] text-s-ink/55 hover:border-s-coral/50",
                  ].join(" ")}
                >
                  <span className="text-[13px] leading-none">{opt.emoji}</span>
                  {opt.label}
                  {active && <Check size={10} className="ml-0.5" />}
                </button>
              );
            })}
          </div>
          {categories.length === 0 && (
            <p className="text-xs text-s-coral mt-1">{t("profile.atLeastOneCategory")}</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-s-ink/50 mb-1">
            <Phone size={12} className="inline mr-1" />
            {t("profile.phone")}
          </label>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+41 61 ..."
            className="w-full px-4 py-3 rounded-input border border-s-ink/10 bg-white text-sm text-s-ink focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-s-ink/50 mb-1">
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
        className="w-full py-3 rounded-btn active:scale-[0.97] bg-s-coral text-white text-[11px] font-heading font-bold uppercase tracking-[.06em] disabled:opacity-50 flex items-center justify-center gap-2 hover:brightness-[1.06] shadow-coral-glow transition-[transform,filter]"
      >
        {saving && <Spinner size="sm" invert />}
        {tc("save")}
      </button>
    </div>
  );
}
