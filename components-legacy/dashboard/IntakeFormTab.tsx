"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ClipboardList, Sparkles } from "lucide-react";
import Spinner from "@/components-legacy/ui/Spinner";
import { INTAKE_TEMPLATES, type IntakeQuestion } from "@/lib/intake-templates";

const TEMPLATE_KEYS = [
  "hair_consultation",
  "nail_consultation",
  "waxing_consultation",
  "makeup_consultation",
  "spa_consultation",
] as const;

interface IntakeResponse {
  id: string;
  template_key: string;
  responses: Record<string, string | boolean>;
  ai_recommendation?: string | null;
  filled_at: string;
}

interface IntakeFormTabProps {
  customerId: string;
}

export default function IntakeFormTab({ customerId }: IntakeFormTabProps) {
  const t = useTranslations("dashboard.intakeFormTab");
  const TEMPLATE_LABELS = {
    hair_consultation: t("templateHairConsultation"),
    nail_consultation: t("templateNailConsultation"),
    waxing_consultation: t("templateWaxingConsultation"),
    makeup_consultation: t("templateMakeupConsultation"),
    spa_consultation: t("templateSpaConsultation"),
  } as const;
  const [history, setHistory] = useState<IntakeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [templateKey, setTemplateKey] = useState("hair_consultation");
  const [responses, setResponses] = useState<Record<string, string | boolean>>({});
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRec, setAiRec] = useState<string | null>(null);

  const questions = INTAKE_TEMPLATES[templateKey] ?? [];

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/clients/${customerId}/intake`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (!cancelled && d) setHistory(d.items ?? []); })
      .catch((err) => console.error("[IntakeFormTab] failed to load intake history:", err))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [customerId]);

  // Reset responses when template changes
  useEffect(() => {
    setResponses({});
    setAiRec(null);
  }, [templateKey]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${customerId}/intake`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_key: templateKey, responses }),
      });
      if (res.ok) {
        const { data } = await res.json();
        setHistory((prev) => [data, ...prev]);
        setShowForm(false);
        setResponses({});
        setAiRec(null);
      }
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  };

  const generateRecommendation = async () => {
    setAiLoading(true);
    try {
      // Build a prompt from the intake responses
      const summary = questions.map((q) => {
        const val = responses[q.question_key];
        return `${q.question_de}: ${val === true ? "Ja" : val === false ? "Nein" : val || "—"}`;
      }).join("\n");

      const res = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_key: templateKey,
          intake_summary: summary,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiRec(data.recommendation ?? t("noRecommendation"));
      }
    } catch {
      setAiRec(t("aiError"));
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-6"><Spinner size="md" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-sm text-s-ink flex items-center gap-2">
          <ClipboardList size={14} strokeWidth={1.6} className="text-s-coral" /> {t("title")}
        </h3>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 text-xs text-s-coral hover:text-s-coral/80 transition-colors">
          <ClipboardList size={12} /> {t("newForm")}
        </button>
      </div>

      {showForm && (
        <div className="rounded-[16px] border border-s-coral/20 bg-s-coral/5 p-4 mb-4 space-y-4">
          {/* Template selector */}
          <div>
            <label className="text-xs text-s-ink-2 mb-1 block">{t("template")}</label>
            <select value={templateKey} onChange={(e) => setTemplateKey(e.target.value)}
              className="w-full px-2 py-1.5 text-sm text-s-ink focus:outline-none"> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
              {TEMPLATE_KEYS.map((key) => (
                <option key={key} value={key}>{TEMPLATE_LABELS[key]}</option>
              ))}
            </select>
          </div>

          {/* Dynamic questions */}
          {questions.map((q) => (
            <div key={q.question_key}>
              <label className="text-xs text-s-ink-2 mb-1 block">{q.question_de}</label>
              {q.type === "boolean" ? (
                <div className="flex gap-3">
                  {[{ val: true, label: t("yes") }, { val: false, label: t("no") }].map(({ val, label }) => {
                    return (
                      <button key={label} onClick={() => setResponses((p) => ({ ...p, [q.question_key]: val }))}
                        // selected-ok: dashboard vibrant skin (LOCKFILE §12.2/§12.4), s-coral retired, s-accent is the locked selected fill
                        className={`px-3 py-1.5 rounded-btn text-[12px] font-heading uppercase tracking-[.06em] transition-colors ${responses[q.question_key] === val ? "bg-s-accent text-white" : "border border-s-border text-s-ink-2"}`}>
                        {label}
                      </button>
                    );
                  })}
                </div>
              ) : q.type === "select" ? (
                <select value={(responses[q.question_key] as string) ?? ""}
                  onChange={(e) => setResponses((p) => ({ ...p, [q.question_key]: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm text-s-ink focus:outline-none"> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
                  <option value="">{t("selectPlaceholder")}</option>
                  {q.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : (
                // mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17)
                <input value={(responses[q.question_key] as string) ?? ""}
                  onChange={(e) => setResponses((p) => ({ ...p, [q.question_key]: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm text-s-ink focus:outline-none" />
              )}
            </div>
          ))}

          {/* AI recommendation */}
          <button onClick={generateRecommendation} disabled={aiLoading}
            className="flex items-center gap-1.5 text-xs text-s-coral hover:text-s-coral/80 transition-colors disabled:opacity-50">
            {aiLoading ? <Spinner size="sm" /> : <Sparkles size={12} />} {t("generateRecommendation")}
          </button>
          {aiRec && (
            <div className="rounded-btn border border-s-amber/20 bg-s-amber-subtle p-3 text-xs text-s-ink whitespace-pre-wrap">
              {aiRec}
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => { setShowForm(false); setAiRec(null); }}
              className="px-3 py-1.5 rounded-pill border border-s-border text-xs text-s-ink-2">{t("cancel")}</button>
            <button onClick={handleSave} disabled={saving}
              className="px-3 py-1.5 rounded-pill active:scale-[0.97] bg-s-accent text-white text-[12px] font-heading uppercase tracking-[.06em] disabled:opacity-50 flex items-center gap-1 shadow-elevation-2 transition-[transform,filter] active:duration-[80ms] active:ease-glide">
              {saving && <Spinner size="sm" invert />} {t("save")}
            </button>
          </div>
        </div>
      )}

      {/* History */}
      {history.length === 0 ? (
        <p className="text-xs text-s-ink/30 text-center py-6">{t("emptyHistory")}</p>
      ) : (
        <div className="space-y-2">
          {history.map((h) => {
            const label = TEMPLATE_LABELS[h.template_key as keyof typeof TEMPLATE_LABELS];
            return (
              <div key={h.id} className="bg-white rounded-[16px] border border-s-ink/5 p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-s-ink">{label ?? h.template_key}</p>
                  <span className="text-[12px] text-s-ink/30">{new Date(h.filled_at).toLocaleDateString("de-CH")}</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs text-s-ink/40">
                  {Object.entries(h.responses).slice(0, 4).map(([k, v]) => (
                    <span key={k}>{k}: {v === true ? t("yes") : v === false ? t("no") : String(v)}</span>
                  ))}
                  {Object.keys(h.responses).length > 4 && <span>{t("moreCount", { n: Object.keys(h.responses).length - 4 })}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
