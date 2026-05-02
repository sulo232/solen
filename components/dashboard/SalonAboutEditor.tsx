"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, Save, Loader2 } from "lucide-react";

interface SalonAboutEditorProps {
  salon: any; // using any temporarily to accommodate the new fields
  onUpdate: () => void;
}

export default function SalonAboutEditor({ salon, onUpdate }: SalonAboutEditorProps) {
  const t = useTranslations("salonAboutEditor") as any;
  const [activeLang, setActiveLang] = useState<"de" | "en" | "fr" | "it">("de");
  const [texts, setTexts] = useState({
    de: salon.about_text_de || "",
    en: salon.about_text_en || "",
    fr: salon.about_text_fr || "",
    it: salon.about_text_it || "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const maxLength = 500;

  const handleSave = async () => {
    setIsSaving(true);
    setStatus("idle");

    try {
      const res = await fetch("/api/salons/mine", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          about_text_de: texts.de,
          about_text_en: texts.en,
          about_text_fr: texts.fr,
          about_text_it: texts.it,
        }),
      });

      if (!res.ok) throw new Error(t("error_save"));

      setStatus("success");
      onUpdate();

      // Auto-hide success message
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message || t("error_generic"));
    } finally {
      setIsSaving(false);
    }
  };

  const LANGS = [
    { id: "de", label: "Deutsch" },
    { id: "en", label: "English" },
    { id: "fr", label: "Français" },
    { id: "it", label: "Italiano" },
  ] as const;

  return (
    <div className="bg-[--raised] rounded-[24px] border border-s-ink/5 p-6 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-heading font-bold text-lg text-s-ink">{t("title")}</h2>
          <p className="text-sm text-s-ink/50">
            {t("description")}
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          aria-label={t("save_button")}
          className="flex items-center justify-center gap-2 bg-s-coral text-white py-2 px-5 rounded-pill font-heading font-bold text-[11px] uppercase tracking-[.06em] hover:brightness-[1.06] active:scale-[0.97] transition-[transform,filter] duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-coral-glow"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {t("save_button")}
        </button>
      </div>

      {status === "success" && (
        <div className="flex items-center gap-2 bg-s-success-bg text-s-success px-3 py-2 rounded-input text-sm font-medium mb-4 animate-in fade-in slide-in-from-top-1 duration-[200ms]">
          <CheckCircle2 size={14} />
          {t("success_message")}
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-2 bg-s-error-bg text-s-error px-3 py-2 rounded-input text-sm font-medium mb-4 animate-in fade-in slide-in-from-top-1 duration-[200ms]">
          <AlertCircle size={14} />
          {errorMsg}
        </div>
      )}

      {/* Language Tabs */}
      <div className="flex gap-2 mb-4 border-b border-s-ink/5 pb-2 overflow-x-auto no-scrollbar">
        {LANGS.map((l) => (
          <button
            key={l.id}
            onClick={() => setActiveLang(l.id)}
            aria-pressed={activeLang === l.id}
            className={`px-3 py-1.5 text-xs font-heading font-semibold uppercase tracking-wider rounded-md transition-colors duration-150 whitespace-nowrap ${
              activeLang === l.id
                ? "bg-s-ink/5 text-s-ink"
                : "text-s-ink/40 hover:text-s-ink hover:bg-s-ink/5"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* Editor Area */}
      <div className="relative">
        <textarea
          value={texts[activeLang]}
          onChange={(e) => setTexts({ ...texts, [activeLang]: e.target.value })}
          maxLength={maxLength}
          placeholder={t("placeholder")}
          className="w-full h-32 p-4 rounded-input border border-s-ink/10 bg-s-bg-surface text-sm text-s-ink focus:outline-none focus:ring-2 focus:ring-s-coral/15 focus:border-s-coral resize-none transition-[border-color,box-shadow] duration-150 placeholder:text-s-ink/30"
        />
        <div className="absolute bottom-3 right-3 text-[10px] font-medium text-s-ink/30">
          {texts[activeLang]?.length || 0} / {maxLength}
        </div>
      </div>
    </div>
  );
}
