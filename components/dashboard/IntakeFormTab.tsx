"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Sparkles } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import { INTAKE_TEMPLATES, type IntakeQuestion } from "@/lib/intake-templates";

const TEMPLATE_OPTIONS = [
  { key: "hair_consultation", label: "Haar-Beratung" },
  { key: "nail_consultation", label: "Nagel-Beratung" },
  { key: "waxing_consultation", label: "Waxing-Beratung" },
  { key: "makeup_consultation", label: "Make-up-Beratung" },
  { key: "spa_consultation", label: "Spa-Beratung" },
];

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
        setAiRec(data.recommendation ?? "Keine Empfehlung generiert.");
      }
    } catch {
      setAiRec("Fehler bei der AI-Empfehlung.");
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-6"><Spinner size="md" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-bold text-sm text-s-ink dark:text-s-dm-text flex items-center gap-2">
          <ClipboardList size={14} className="text-s-coral" /> Fragebogen
        </h3>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 text-xs text-s-coral hover:text-s-coral/80 transition-colors">
          <ClipboardList size={12} /> Neuer Fragebogen
        </button>
      </div>

      {showForm && (
        <div className="rounded-[16px] border border-s-coral/20 bg-s-coral/5 p-4 mb-4 space-y-4">
          {/* Template selector */}
          <div>
            <label className="text-xs text-s-ink/50 dark:text-s-dm-text/50 mb-1 block">Vorlage</label>
            <select value={templateKey} onChange={(e) => setTemplateKey(e.target.value)}
              className="w-full px-2 py-1.5 rounded-input border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-bg text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20">
              {TEMPLATE_OPTIONS.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Dynamic questions */}
          {questions.map((q) => (
            <div key={q.question_key}>
              <label className="text-xs text-s-ink/50 dark:text-s-dm-text/50 mb-1 block">{q.question_de}</label>
              {q.type === "boolean" ? (
                <div className="flex gap-3">
                  {["Ja", "Nein"].map((label) => {
                    const val = label === "Ja";
                    return (
                      <button key={label} onClick={() => setResponses((p) => ({ ...p, [q.question_key]: val }))}
                        className={`px-3 py-1.5 rounded-btn text-[11px] font-heading font-bold uppercase tracking-[.06em] transition-colors ${responses[q.question_key] === val ? "bg-s-coral text-white" : "border border-s-ink/10 dark:border-white/10 text-s-ink/60 dark:text-s-dm-text/60"}`}>
                        {label}
                      </button>
                    );
                  })}
                </div>
              ) : q.type === "select" ? (
                <select value={(responses[q.question_key] as string) ?? ""}
                  onChange={(e) => setResponses((p) => ({ ...p, [q.question_key]: e.target.value }))}
                  className="w-full px-2 py-1.5 rounded-input border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-bg text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20">
                  <option value="">Wählen…</option>
                  {q.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : (
                <input value={(responses[q.question_key] as string) ?? ""}
                  onChange={(e) => setResponses((p) => ({ ...p, [q.question_key]: e.target.value }))}
                  className="w-full px-2 py-1.5 rounded-input border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-bg text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20" />
              )}
            </div>
          ))}

          {/* AI recommendation */}
          <button onClick={generateRecommendation} disabled={aiLoading}
            className="flex items-center gap-1.5 text-xs text-s-coral hover:text-s-coral/80 transition-colors disabled:opacity-50">
            {aiLoading ? <Spinner size="sm" /> : <Sparkles size={12} />} Empfehlung generieren
          </button>
          {aiRec && (
            <div className="rounded-btn border border-s-amber/20 bg-s-amber-subtle p-3 text-xs text-s-ink dark:text-s-dm-text whitespace-pre-wrap">
              {aiRec}
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => { setShowForm(false); setAiRec(null); }}
              className="px-3 py-1.5 rounded-pill border border-s-ink/10 dark:border-white/10 text-xs text-s-ink/60 dark:text-s-dm-text/60">Abbrechen</button>
            <button onClick={handleSave} disabled={saving}
              className="px-3 py-1.5 rounded-pill active:scale-[0.97] bg-s-coral text-white text-[11px] font-heading font-bold uppercase tracking-[.06em] disabled:opacity-50 flex items-center gap-1 shadow-coral-glow transition-[transform,filter] duration-150">
              {saving && <Spinner size="sm" invert />} Speichern
            </button>
          </div>
        </div>
      )}

      {/* History */}
      {history.length === 0 ? (
        <p className="text-xs text-s-ink/30 dark:text-s-dm-text/30 text-center py-6">Keine Fragebögen ausgefüllt</p>
      ) : (
        <div className="space-y-2">
          {history.map((h) => {
            const tpl = TEMPLATE_OPTIONS.find((t) => t.key === h.template_key);
            return (
              <div key={h.id} className="bg-white dark:bg-s-dm-surface rounded-[16px] border border-s-ink/5 dark:border-white/5 p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-s-ink dark:text-s-dm-text">{tpl?.label ?? h.template_key}</p>
                  <span className="text-[10px] text-s-ink/30 dark:text-s-dm-text/30">{new Date(h.filled_at).toLocaleDateString("de-CH")}</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs text-s-ink/40 dark:text-s-dm-text/40">
                  {Object.entries(h.responses).slice(0, 4).map(([k, v]) => (
                    <span key={k}>{k}: {v === true ? "Ja" : v === false ? "Nein" : String(v)}</span>
                  ))}
                  {Object.keys(h.responses).length > 4 && <span>+{Object.keys(h.responses).length - 4} weitere</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
