"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Droplets, Save, BarChart3 } from "lucide-react";

// Clinical swatch colours — decorative hints, not diagnostic
const UNDERTONES = [
  { key: "warm", labelKey: "undertone.warm", swatch: "#F5D0A9" },   // warm peachy
  { key: "cool", labelKey: "undertone.cool", swatch: "#F0C4D4" },   // cool pink
  { key: "neutral", labelKey: "undertone.neutral", swatch: "#F0D4C4" }, // neutral blend
] as const;

// Fitzpatrick scale I–VI — universal clinical classification, labels NOT translated
const FITZPATRICK = [
  { value: "I", label: "I", descKey: "fitz.I" },
  { value: "II", label: "II", descKey: "fitz.II" },
  { value: "III", label: "III", descKey: "fitz.III" },
  { value: "IV", label: "IV", descKey: "fitz.IV" },
  { value: "V", label: "V", descKey: "fitz.V" },
  { value: "VI", label: "VI", descKey: "fitz.VI" },
] as const;

interface SkinToneAnalytics {
  undertones: { key: string; count: number }[];
  fitzpatrick: { scale: string; count: number }[];
  total: number;
}

interface SkinToneMatcherProps {
  clientId: string | null;
  salonId?: string;
  onSave?: (data: { undertone: string; fitzpatrick: string; foundation_notes: string }) => void;
}

export default function SkinToneMatcher({ clientId, salonId, onSave }: SkinToneMatcherProps) {
  const t = useTranslations("dashboardMakeup") as any;
  const [undertone, setUndertone] = useState<string>("");
  const [fitzpatrick, setFitzpatrick] = useState<string>("");
  const [foundationNotes, setFoundationNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const [analytics, setAnalytics] = useState<SkinToneAnalytics | null>(null);

  useEffect(() => {
    if (!salonId) return;
    fetch(`/api/dashboard/makeup/skin-tone-analytics?salon_id=${salonId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setAnalytics(d); })
      .catch((err) => console.error("[SkinToneMatcher] failed to load skin tone analytics:", err));
  }, [salonId]);

  const handleSave = () => {
    if (!undertone || !fitzpatrick) return;
    onSave?.({ undertone, fitzpatrick, foundation_notes: foundationNotes });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!clientId) {
    return (
      <p className="text-xs text-s-ink/30 py-4 text-center">
        {t("select_client_first")}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Droplets size={16} className="text-s-coral" />
        <h3 className="font-heading text-sm text-s-ink">
          {t("skin_tone_title")}
        </h3>
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-s-ink/40 italic">
        {t("skin_tone_disclaimer")}
      </p>

      {/* Undertone selector */}
      <div className="space-y-2">
        <p className="text-[10px] font-heading uppercase tracking-[.10em] text-s-ink/40">
          {t("undertone_label")}
        </p>
        <div className="flex flex-wrap gap-2">
          {UNDERTONES.map((u) => (
            <button
              key={u.key}
              onClick={() => setUndertone(u.key)}
              className={`rounded-[12px] border p-3 flex items-center gap-2 transition-colors duration-150 ${
                undertone === u.key
                  ? "border-s-coral bg-s-coral/[0.06]"
                  : "border-s-ink/[0.06]"
              }`}
              aria-label={t(u.labelKey)}
            >
              <div
                className="w-4 h-4 rounded-full border border-s-ink/10"
                style={{ backgroundColor: u.swatch }}
              />
              <span className="text-xs font-heading text-s-ink">
                {t(u.labelKey)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Fitzpatrick scale */}
      <div className="space-y-2">
        <p className="text-[10px] font-heading uppercase tracking-[.10em] text-s-ink/40">
          {t("fitzpatrick_label")}
        </p>
        <div className="flex flex-wrap gap-2">
          {FITZPATRICK.map((f) => (
            <button
              key={f.value}
              onClick={() => setFitzpatrick(f.value)}
              className={`rounded-[12px] border px-4 py-2 transition-colors duration-150 ${
                fitzpatrick === f.value
                  ? "border-s-coral bg-s-coral/[0.06]"
                  : "border-s-ink/[0.06]"
              }`}
              aria-label={`Fitzpatrick ${f.label}`}
            >
              {/* Fitzpatrick labels are universal — not translated */}
              <span className="text-sm font-heading text-s-ink">{f.label}</span>
              <p className="text-[9px] text-s-ink/40 mt-0.5">{t(f.descKey)}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Foundation notes (free text) */}
      <div className="space-y-2">
        <p className="text-[10px] font-heading uppercase tracking-[.10em] text-s-ink/40">
          {t("foundation_notes")}
        </p>
        <textarea
          value={foundationNotes}
          onChange={(e) => setFoundationNotes(e.target.value)}
          rows={2}
          placeholder={t("foundation_notes_placeholder")}
          className="w-full px-3 py-2 rounded-[8px] border border-s-ink/[0.10] bg-transparent text-xs text-s-ink resize-none"
          aria-label={t("foundation_notes")}
        />
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={!undertone || !fitzpatrick}
        className="flex items-center gap-1 px-4 py-2 min-h-[44px] rounded-pill bg-s-coral text-white text-[11px] font-heading uppercase tracking-[.06em] hover:brightness-[1.06] active:scale-[0.97] shadow-elevation-2 transition-[transform,filter] duration-150 disabled:opacity-40"
        aria-label={saved ? t("saved") : t("save")}
      >
        <Save size={12} />
        {saved ? t("saved") : t("save")}
      </button>

      {/* Salon-wide distribution panel */}
      {analytics && analytics.total > 0 && (
        <div className="rounded-[12px] border border-s-ink/[0.06] p-4 bg-white space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 size={13} className="text-s-coral" />
            <p className="text-[10px] font-heading uppercase tracking-[.12em] text-s-ink/50">
              {t("skin_tone_analytics_title")} — {analytics.total} {t("skin_tone_analytics_clients")}
            </p>
          </div>

          {/* Undertone distribution */}
          <div>
            <p className="text-[9px] font-heading uppercase tracking-[.10em] text-s-ink/30 mb-2">
              {t("undertone_label")}
            </p>
            <div className="space-y-1.5">
              {analytics.undertones.map(({ key, count }) => {
                const swatch = UNDERTONES.find((u) => u.key === key)?.swatch ?? "#ccc";
                const pct = Math.round((count / analytics.total) * 100);
                return (
                  <div key={key} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border border-s-ink/10 shrink-0" style={{ backgroundColor: swatch }} />
                    <div className="flex-1 h-1.5 rounded-full bg-s-ink/[0.06] overflow-hidden">
                      <div className="h-full rounded-full bg-s-coral" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] tabular-nums text-s-ink/40 w-8 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fitzpatrick distribution */}
          <div>
            <p className="text-[9px] font-heading uppercase tracking-[.10em] text-s-ink/30 mb-2">
              {t("fitzpatrick_label")}
            </p>
            <div className="flex items-end gap-1.5 h-12">
              {analytics.fitzpatrick.map(({ scale, count }) => {
                const max = Math.max(...analytics.fitzpatrick.map((f) => f.count), 1);
                const heightPct = Math.round((count / max) * 100);
                return (
                  <div key={scale} className="flex-1 flex flex-col items-center gap-0.5">
                    <span className="text-[8px] tabular-nums text-s-ink/30">{count}</span>
                    <div
                      className="w-full rounded-t-[3px] bg-s-amber/70 transition-[width] duration-[250ms]"
                      style={{ height: `${Math.max(heightPct, 4)}%` }}
                    />
                    <span className="text-[9px] font-heading text-s-ink/40">{scale}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
