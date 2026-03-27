"use client";

import { useState, useEffect } from "react";
import { Store, Camera, Phone } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import ImageUploader from "@/components/ui/ImageUploader";
import { useTranslations } from "next-intl";

interface SalonProfileStepProps {
  salonId: string;
  onSaved: () => void;
}

export default function SalonProfileStep({ salonId, onSaved }: SalonProfileStepProps) {
  const t = useTranslations("onboarding");
  const tc = useTranslations("common");
  const [form, setForm] = useState({
    name: "",
    description_de: "",
    description_en: "",
    phone: "",
    cover_photo_url: "",
  });
  const [saving, setSaving] = useState(false);

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
        body: JSON.stringify(form),
      });
      onSaved();
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-card bg-s-coral/10 dark:bg-s-coral/20 flex items-center justify-center">
          <Store size={22} className="text-s-coral" />
        </div>
        <div>
          <h2 className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text">
            {t("profile.title")}
          </h2>
          <p className="text-sm text-s-ink/40 dark:text-s-dm-text/50">
            {t("profile.subtitle")}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/5 p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">
            {t("profile.name")} *
          </label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={t("profile.namePlaceholder")}
            className="w-full px-4 py-3 rounded-btn border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-raised text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">
            {t("profile.description")} *
          </label>
          <textarea
            value={form.description_de}
            onChange={(e) => setForm({ ...form, description_de: e.target.value })}
            rows={3}
            maxLength={500}
            placeholder={t("profile.descPlaceholder")}
            className="w-full px-4 py-3 rounded-btn border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-raised text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20 resize-none transition-colors"
          />
          <p className="text-[10px] text-s-ink/30 dark:text-s-dm-text/30 mt-0.5 text-right">{form.description_de.length}/500</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">
            <Phone size={12} className="inline mr-1" />
            {t("profile.phone")}
          </label>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+41 61 ..."
            className="w-full px-4 py-3 rounded-btn border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-raised text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">
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
        disabled={!form.name || !form.description_de || saving}
        className="w-full py-3 rounded-btn active:scale-[0.98] bg-s-coral text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 hover:brightness-[1.06] transition-all shadow-warm-sm"
      >
        {saving && <Spinner size="sm" invert />}
        {tc("save")}
      </button>
    </div>
  );
}
