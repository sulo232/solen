"use client";

import { useState, useEffect } from "react";
import { Wand2 } from "lucide-react";
import { STYLE_PRESETS, COLOR_PRESETS, SKIN_TONE_PRESETS } from "@/lib/nail/ai-prompts";
import type { NailShape } from "@/lib/types";
import { useTranslations } from "next-intl";

const SHAPE_OPTIONS: { value: NailShape; label: string }[] = [
  { value: "round", label: "Rund" },
  { value: "square", label: "Square" },
  { value: "oval", label: "Oval" },
  { value: "almond", label: "Mandel" },
  { value: "coffin", label: "Coffin" },
  { value: "stiletto", label: "Stiletto" },
];

export default function AiArtGenerator() {
  const t = useTranslations("aiArtGenerator") as any;
  const [shape, setShape] = useState("almond");
  const [style, setStyle] = useState(STYLE_PRESETS[0].value);
  const [colors, setColors] = useState(COLOR_PRESETS[0].value);
  const [skinTone, setSkinTone] = useState(SKIN_TONE_PRESETS[2].value);
  const [shotType, setShotType] = useState<"hero" | "detail" | "lifestyle">("hero");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ image_url: string; staging_id: string | null; prompt: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [budget, setBudget] = useState<{ spent: number; budget: number; percentUsed: number } | null>(null);

  useEffect(() => {
    fetch("/api/admin/nail/generate")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setBudget(d); })
      .catch(() => {});
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/nail/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shape, style, colors, skinTone, shotType, material: "gel", length: "medium" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Generation failed");
        return;
      }
      setResult({ image_url: data.image_url, staging_id: data.staging_id, prompt: data.prompt });
      if (data.budget) setBudget(data.budget);
    } catch {
      setError(t("network_error"));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Wand2 size={16} className="text-s-coral" />
        <h3 className="font-heading font-semibold text-sm text-s-ink dark:text-s-dm-text">{t("title")}</h3>
      </div>

      {/* Budget tracker */}
      {budget && (
        <div className="p-3 rounded-[16px] bg-s-bg-surface dark:bg-s-dm-bg">
          <div className="flex items-center justify-between text-xs text-s-ink/60 dark:text-s-dm-text/60 mb-1">
            <span>{t("this_month")}</span>
            <span className="data-text">{budget.spent.toFixed(2)} / {budget.budget.toFixed(2)} CHF</span>
          </div>
          <div className="h-2 rounded-pill bg-s-sand-subtle dark:bg-s-dm-text/10">
            <div
              className={`h-full rounded-pill transition-all ${budget.percentUsed > 0.8 ? "bg-s-error" : "bg-s-coral"}`}
              style={{ width: `${Math.min(100, budget.percentUsed * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Selectors */}
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-medium text-s-ink/60 dark:text-s-dm-text/60">{t("shape")}</span>
          <select value={shape} onChange={(e) => setShape(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-btn border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface text-sm text-s-ink dark:text-s-dm-text">
            {SHAPE_OPTIONS.map((s) => <option key={s.value} value={s.value}>{t(`shapes.${s.value}` as any)}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-s-ink/60 dark:text-s-dm-text/60">{t("style")}</span>
          <select value={style} onChange={(e) => setStyle(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-btn border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface text-sm text-s-ink dark:text-s-dm-text">
            {STYLE_PRESETS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-s-ink/60 dark:text-s-dm-text/60">{t("color")}</span>
          <select value={colors} onChange={(e) => setColors(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-btn border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface text-sm text-s-ink dark:text-s-dm-text">
            {COLOR_PRESETS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-s-ink/60 dark:text-s-dm-text/60">{t("skin_tone")}</span>
          <select value={skinTone} onChange={(e) => setSkinTone(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-btn border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface text-sm text-s-ink dark:text-s-dm-text">
            {SKIN_TONE_PRESETS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>
      </div>

      {/* Shot type pills */}
      <div>
        <span className="text-xs font-medium text-s-ink/60 dark:text-s-dm-text/60 mb-1.5 block">{t("shot_type")}</span>
        <div className="flex gap-2">
          {(["hero", "detail", "lifestyle"] as const).map((tType) => (
            <button key={tType} onClick={() => setShotType(tType)}
              className={`px-3 py-1.5 rounded-pill text-xs font-medium transition-colors ${
                shotType === tType ? "bg-s-coral text-white" : "bg-s-ink/5 dark:bg-s-dm-text/10 text-s-ink/60 dark:text-s-dm-text/60"
              }`}>
              {tType === "hero" ? t("shot_hero") : tType === "detail" ? t("shot_macro") : t("shot_lifestyle")}
            </button>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <button onClick={handleGenerate} disabled={generating}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-btn active:scale-[0.98] bg-s-coral text-white text-[11px] font-heading font-bold uppercase tracking-[.06em] hover:brightness-[1.06] transition-all disabled:opacity-50">
        <Wand2 size={16} />
        {generating ? t("generating") : t("generate")}
      </button>

      {error && <p className="text-sm text-s-error">{error}</p>}

      {/* Result preview */}
      {result && (
        <div className="rounded-[16px] border border-s-ink/10 dark:border-s-dm-text/10 overflow-hidden bg-white dark:bg-s-dm-surface">
          <img src={result.image_url} alt="AI generated nail art" className="w-full aspect-square object-cover" />
          <div className="p-3 space-y-2">
            <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 line-clamp-2">{result.prompt}</p>
            {result.staging_id && (
              <p className="text-xs text-s-sage">{t("staging_message")}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
