"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { User, AlertCircle, CheckCircle } from "lucide-react";
import { CustomerPreferences } from "@/lib/types";
import InteractiveHoverButton from "@/components/ui/interactive-hover-button";

interface CustomerPreferencesFormProps {
  onSave: (preferences: CustomerPreferences) => Promise<void>;
  initialPreferences?: CustomerPreferences;
  showSkip?: boolean;
  onSkip?: () => void;
}

export default function CustomerPreferencesForm({
  onSave,
  initialPreferences,
  showSkip = false,
  onSkip,
}: CustomerPreferencesFormProps) {
  const t = useTranslations("booking.preferences") as any;

  const [allergies, setAllergies] = useState(initialPreferences?.allergies || "");
  const [skinType, setSkinType] = useState(initialPreferences?.skinType || "");
  const [stylistGender, setStylistGender] = useState<"male" | "female" | "no-preference">(
    initialPreferences?.stylistGender || "no-preference"
  );
  const [accessibilityNeeds, setAccessibilityNeeds] = useState(
    initialPreferences?.accessibilityNeeds || ""
  );
  const [language, setLanguage] = useState(initialPreferences?.language || "");
  const [notes, setNotes] = useState(initialPreferences?.notes || "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await onSave({
        allergies: allergies.trim() || undefined,
        skinType: skinType.trim() || undefined,
        stylistGender,
        accessibilityNeeds: accessibilityNeeds.trim() || undefined,
        language: language.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error_save"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[--raised] rounded-[12px] shadow-warm-md border border-s-ink/[0.06] p-6">
      {/* Header */}
      <div className="flex items-start gap-3 mb-5">
        <div
          className="w-10 h-10 rounded-input flex items-center justify-center shrink-0"
          style={{ background: "rgba(27, 77, 27,.10)" }}
        >
          <User size={18} className="text-s-coral" />
        </div>
        <div>
          <p className="text-[9px] font-heading uppercase tracking-[.18em] text-s-ink/30 mb-0.5">
            {t("label_optional")}
          </p>
          <h2 className="font-heading text-base text-s-ink">{t("title")}</h2>
          <p className="text-xs font-body text-s-ink/50 mt-1">{t("subtitle")}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Allergies */}
        <div>
          <label className="block text-[10px] font-heading uppercase tracking-[.10em] text-s-ink/60 mb-2">
            {t("allergies_label")}
          </label>
          <input
            type="text"
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            placeholder={t("allergies_placeholder")}
            className="w-full px-4 py-3 rounded-input border border-s-ink/[0.08] bg-[--raised] text-sm font-body text-s-ink placeholder:text-s-ink/25 focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 outline-none transition-colors duration-150"
          />
        </div>

        {/* Skin Type */}
        <div>
          <label className="block text-[10px] font-heading uppercase tracking-[.10em] text-s-ink/60 mb-2">
            {t("skin_type_label")}
          </label>
          <input
            type="text"
            value={skinType}
            onChange={(e) => setSkinType(e.target.value)}
            placeholder={t("skin_type_placeholder")}
            className="w-full px-4 py-3 rounded-input border border-s-ink/[0.08] bg-[--raised] text-sm font-body text-s-ink placeholder:text-s-ink/25 focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 outline-none transition-colors duration-150"
          />
        </div>

        {/* Stylist Gender */}
        <div>
          <label className="block text-[10px] font-heading uppercase tracking-[.10em] text-s-ink/60 mb-2">
            {t("stylist_gender_label")}
          </label>
          <div className="flex gap-2">
            {(["male", "female", "no-preference"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={stylistGender === option}
                onClick={() => setStylistGender(option)}
                className={`flex-1 px-4 py-3 rounded-pill border text-[11px] font-heading uppercase tracking-[.06em] transition-[border-color,background-color,box-shadow,color] duration-150 ${
                  stylistGender === option
                    ? "border-s-coral bg-s-coral text-white shadow-warm-md"
                    : "border-s-ink/[0.08] text-s-ink/60 hover:border-s-coral/40"
                }`}
              >
                {t(`stylist_gender_${option}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Accessibility Needs */}
        <div>
          <label className="block text-[10px] font-heading uppercase tracking-[.10em] text-s-ink/60 mb-2">
            {t("accessibility_label")}
          </label>
          <input
            type="text"
            value={accessibilityNeeds}
            onChange={(e) => setAccessibilityNeeds(e.target.value)}
            placeholder={t("accessibility_placeholder")}
            className="w-full px-4 py-3 rounded-input border border-s-ink/[0.08] bg-[--raised] text-sm font-body text-s-ink placeholder:text-s-ink/25 focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 outline-none transition-colors"
          />
        </div>

        {/* Language */}
        <div>
          <label className="block text-[10px] font-heading uppercase tracking-[.10em] text-s-ink/60 mb-2">
            {t("language_label")}
          </label>
          <input
            type="text"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            placeholder={t("language_placeholder")}
            className="w-full px-4 py-3 rounded-input border border-s-ink/[0.08] bg-[--raised] text-sm font-body text-s-ink placeholder:text-s-ink/25 focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 outline-none transition-colors"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-[10px] font-heading uppercase tracking-[.10em] text-s-ink/60 mb-2">
            {t("notes_label")}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("notes_placeholder")}
            rows={3}
            className="w-full px-4 py-3 rounded-input border border-s-ink/[0.08] bg-[--raised] text-sm font-body text-s-ink placeholder:text-s-ink/25 focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 outline-none transition-colors duration-150 resize-none"
          />
        </div>

        {/* Error State */}
        {error && (
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-input border border-s-coral/20"
            style={{ background: "rgba(27, 77, 27,.06)" }}
          >
            <AlertCircle size={13} className="text-s-coral shrink-0" />
            <p className="text-xs font-body text-s-coral">{error}</p>
          </div>
        )}

        {/* Success State */}
        {success && (
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-input border border-s-success/25"
            style={{ background: "rgba(46,125,50,.06)" }}
          >
            <CheckCircle size={13} className="text-s-success shrink-0" />
            <p className="text-xs font-body text-s-success">{t("success_save")}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          {showSkip && onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="flex-1 px-5 py-3.5 rounded-pill border border-s-ink/10 text-[11px] font-heading uppercase tracking-[.06em] text-s-ink/60 hover:border-s-coral/40 hover:text-s-coral active:scale-[0.97] transition-[transform,border-color,color] duration-150"
            >
              {t("skip")}
            </button>
          )}
          <InteractiveHoverButton
            type="submit"
            disabled={saving}
            text={saving ? t("saving") : t("save")}
            className={`${
              showSkip ? "flex-1" : "w-full"
            } py-3.5 rounded-pill text-[11px] font-heading uppercase tracking-[.06em] shadow-elevation-2 transition-[transform,filter] duration-150 disabled:opacity-60`}
          />
        </div>
      </form>
    </div>
  );
}
