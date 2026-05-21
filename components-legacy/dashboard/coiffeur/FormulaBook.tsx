"use client";

import { useEffect, useState } from "react";
import { Beaker, Plus, Copy, Check, ChevronDown, ChevronUp, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import Spinner from "@/components-legacy/ui/Spinner";
import FormulaPhotoUpload from "@/components-legacy/dashboard/coiffeur/FormulaPhotoUpload";

interface Formula {
  id: string;
  brand: string | null;
  product_line: string | null;
  mix_formula: string;
  shade_code: string | null;
  developer_volume: string | null;
  processing_minutes: number | null;
  root_formula: Record<string, unknown>;
  mid_lengths_formula: Record<string, unknown>;
  ends_formula: Record<string, unknown>;
  notes: string | null;
  created_at: string;
}

interface FormulaBookProps {
  clientId: string | null;
  salonId: string;
}

export default function FormulaBook({ clientId, salonId }: FormulaBookProps) {
  const t = useTranslations("dashboardCoiffeur") as any;
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [techniqueFilter, setTechniqueFilter] = useState<string | null>(null);

  const TECHNIQUES = ["Root", "Highlights", "Balayage", "Ombré", "Toning", "Gloss", "Full colour"];

  // Form fields
  const [brand, setBrand] = useState("");
  const [shadeCode, setShadeCode] = useState("");
  const [mixFormula, setMixFormula] = useState("");
  const [developerVolume, setDeveloperVolume] = useState("");
  const [processingMinutes, setProcessingMinutes] = useState("");
  const [notes, setNotes] = useState("");
  const [rootFormula, setRootFormula] = useState("");
  const [midFormula, setMidFormula] = useState("");
  const [endsFormula, setEndsFormula] = useState("");

  useEffect(() => {
    if (!clientId) return;
    setLoading(true);
    fetch(`/api/clients/${clientId}/formulas`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setFormulas(d?.items ?? []))
      .catch((err) => console.error("[FormulaBook] failed to load client formulas:", err))
      .finally(() => setLoading(false));
  }, [clientId]);

  const resetForm = () => {
    setBrand(""); setShadeCode(""); setMixFormula(""); setDeveloperVolume("");
    setProcessingMinutes(""); setNotes(""); setRootFormula(""); setMidFormula(""); setEndsFormula("");
  };

  const handleAdd = async () => {
    if (!clientId || !mixFormula.trim()) return;
    setSaving(true);
    setSaveError(false);
    try {
      const res = await fetch(`/api/clients/${clientId}/formulas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: brand.trim() || undefined,
          shade_code: shadeCode.trim() || undefined,
          mix_formula: mixFormula.trim(),
          developer_volume: developerVolume.trim() || undefined,
          processing_minutes: processingMinutes ? Number(processingMinutes) : undefined,
          notes: notes.trim() || undefined,
          root_formula: rootFormula.trim() ? { text: rootFormula.trim() } : undefined,
          mid_lengths_formula: midFormula.trim() ? { text: midFormula.trim() } : undefined,
          ends_formula: endsFormula.trim() ? { text: endsFormula.trim() } : undefined,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.data) {
          setFormulas((prev) => [json.data, ...prev]);
          setShowAdd(false);
          resetForm();
        } else {
          setSaveError(true);
        }
      } else {
        setSaveError(true);
      }
    } catch { setSaveError(true); } finally {
      setSaving(false);
    }
  };

  const copyFormula = (f: Formula) => {
    const parts = [
      f.brand && `${t("brand")}: ${f.brand}`,
      f.shade_code && `${t("shade_code")}: ${f.shade_code}`,
      `${t("mixing_ratio")}: ${f.mix_formula}`,
      f.developer_volume && `${t("developer_volume")}: ${f.developer_volume}`,
      f.processing_minutes && `${t("processing_minutes")}: ${f.processing_minutes} min`,
      f.root_formula?.text && `${t("root")}: ${f.root_formula.text}`,
      f.mid_lengths_formula?.text && `${t("mid_lengths")}: ${f.mid_lengths_formula.text}`,
      f.ends_formula?.text && `${t("ends")}: ${f.ends_formula.text}`,
      f.notes && `${t("notes")}: ${f.notes}`,
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(parts);
    setCopied(f.id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!clientId) {
    return (
      <div className="rounded-[12px] border border-s-ink/[0.06] p-6 bg-white text-center">
        <Beaker size={20} className="mx-auto mb-2 text-s-ink/20" />
        <p className="text-xs text-s-ink/30">{t("select_client_first")}</p>
      </div>
    );
  }

  const inputClass = "w-full px-2 py-1.5 rounded-[8px] border border-s-ink/10 bg-white text-sm text-s-ink focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20";

  return (
    <div className="rounded-[12px] border border-s-ink/[0.06] p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[9px] font-heading uppercase tracking-[.18em] text-s-amber">
          {t("formula_history")}
        </p>
        <button
          onClick={() => setShowAdd(!showAdd)}
          aria-label={t("add_formula")}
          className="flex items-center gap-1 text-xs text-s-coral hover:text-s-coral/80 transition-colors duration-150"
        >
          <Plus size={12} /> {t("add_formula")}
        </button>
      </div>

      {/* Search + technique filter */}
      <div className="space-y-2 mb-3">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-s-ink/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("formulaSearch")}
            className="w-full pl-7 pr-3 py-1.5 rounded-[8px] border border-s-ink/10 bg-s-ink/[0.02] text-xs text-s-ink focus:outline-none focus:border-s-coral"
            aria-label={t("formulaSearch")}
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {TECHNIQUES.map((tech) => (
            <button
              key={tech}
              onClick={() => setTechniqueFilter(techniqueFilter === tech ? null : tech)}
              className={`px-2 py-0.5 text-[9px] font-heading rounded-pill transition-[background-color,color,box-shadow] duration-150 ${
                techniqueFilter === tech
                  ? "bg-s-amber text-white"
                  : "bg-s-ink/[0.05] text-s-ink/50 hover:bg-s-ink/[0.09]"
              }`}
              aria-label={tech}
            >
              {tech}
            </button>
          ))}
        </div>
      </div>

      {showAdd && (
        <div className="rounded-[12px] border border-s-coral/20 bg-s-coral/5 p-4 mb-4 space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-heading uppercase tracking-[.10em] text-s-ink/30 mb-1 block">{t("brand")}</label>
              <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="z.B. Wella" className={inputClass} aria-label={t("brand")} />
            </div>
            <div>
              <label className="text-[10px] font-heading uppercase tracking-[.10em] text-s-ink/30 mb-1 block">{t("shade_code")}</label>
              <input value={shadeCode} onChange={(e) => setShadeCode(e.target.value)} placeholder="z.B. 7/0" className={inputClass} aria-label={t("shade_code")} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-heading uppercase tracking-[.10em] text-s-ink/30 mb-1 block">{t("mixing_ratio")} *</label>
            <input value={mixFormula} onChange={(e) => setMixFormula(e.target.value)} placeholder="z.B. 7/0 + 8/1 (1:1)" className={inputClass} aria-label={t("mixing_ratio")} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-heading uppercase tracking-[.10em] text-s-ink/30 mb-1 block">{t("developer_volume")}</label>
              <input value={developerVolume} onChange={(e) => setDeveloperVolume(e.target.value)} placeholder="z.B. 6%" className={inputClass} aria-label={t("developer_volume")} />
            </div>
            <div>
              <label className="text-[10px] font-heading uppercase tracking-[.10em] text-s-ink/30 mb-1 block">{t("processing_minutes")}</label>
              <input type="number" value={processingMinutes} onChange={(e) => setProcessingMinutes(e.target.value)} placeholder="35" className={inputClass} aria-label={t("processing_minutes")} />
            </div>
          </div>

          {/* Zone sections: Root / Mid-lengths / Ends */}
          <div className="space-y-2">
            <div>
              <label className="text-[10px] font-heading uppercase tracking-[.10em] text-s-ink/30 mb-1 block">{t("root")}</label>
              <input value={rootFormula} onChange={(e) => setRootFormula(e.target.value)} placeholder={t("root_placeholder")} className={inputClass} aria-label={t("root")} />
            </div>
            <div>
              <label className="text-[10px] font-heading uppercase tracking-[.10em] text-s-ink/30 mb-1 block">{t("mid_lengths")}</label>
              <input value={midFormula} onChange={(e) => setMidFormula(e.target.value)} placeholder={t("mid_lengths_placeholder")} className={inputClass} aria-label={t("mid_lengths")} />
            </div>
            <div>
              <label className="text-[10px] font-heading uppercase tracking-[.10em] text-s-ink/30 mb-1 block">{t("ends")}</label>
              <input value={endsFormula} onChange={(e) => setEndsFormula(e.target.value)} placeholder={t("ends_placeholder")} className={inputClass} aria-label={t("ends")} />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-heading uppercase tracking-[.10em] text-s-ink/30 mb-1 block">{t("notes")}</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={`${inputClass} resize-none`} aria-label={t("notes")} />
          </div>

          {saveError && (
            <p className="text-[11px] text-s-error" role="alert">{t("save_error")}</p>
          )}
          <div className="flex gap-2">
            <button onClick={() => { setShowAdd(false); resetForm(); setSaveError(false); }} className="px-3 py-1.5 rounded-pill border border-s-ink/10 text-xs text-s-ink/60 hover:border-s-coral/40 hover:text-s-coral active:scale-[0.97] transition-[transform,border-color,color] duration-150" aria-label={t("cancel")}>
              {t("cancel")}
            </button>
            <button onClick={handleAdd} disabled={!mixFormula.trim() || saving}
              className="px-3 py-1.5 rounded-pill bg-s-coral text-white text-[11px] font-heading uppercase tracking-[.06em] disabled:opacity-50 flex items-center gap-1 hover:brightness-[1.06] active:scale-[0.97] shadow-elevation-2 transition-[transform,filter] duration-150"
              aria-label={t("save")}
            >
              {saving && <Spinner size="sm" invert />} {t("save")}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-6"><Spinner size="md" /></div>
      ) : formulas.length === 0 ? (
        <p className="text-xs text-s-ink/30 text-center py-6">{t("no_formulas")}</p>
      ) : (
        <div className="space-y-2">
          {formulas
            .filter((f) => {
              const q = search.toLowerCase();
              const matchSearch = !q || [f.brand, f.shade_code, f.mix_formula, f.notes]
                .some((v) => v?.toLowerCase().includes(q));
              const matchTech = !techniqueFilter || f.notes?.includes(techniqueFilter) || f.mix_formula?.includes(techniqueFilter);
              return matchSearch && matchTech;
            })
            .map((f) => {
            const isExpanded = expandedId === f.id;
            return (
              <div key={f.id} className="border-b border-s-ink/[0.04] py-3 last:border-0">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : f.id)}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-heading text-s-ink truncate">
                      {f.brand ? `${f.brand}` : ""}{f.shade_code ? ` — ${f.shade_code}` : ""}{!f.brand && !f.shade_code ? f.mix_formula : ""}
                    </p>
                    <span className="text-[10px] data-text text-s-ink/40">
                      {new Date(f.created_at).toLocaleDateString("de-CH")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 ml-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); copyFormula(f); }}
                      aria-label={t("copy_formula")}
                      className="p-1 text-s-ink/30 hover:text-s-coral transition-colors duration-150"
                    >
                      {copied === f.id ? <Check size={12} className="text-s-sage" /> : <Copy size={12} />}
                    </button>
                    {isExpanded ? <ChevronUp size={14} className="text-s-ink/30" /> : <ChevronDown size={14} className="text-s-ink/30" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-2 grid grid-cols-1 lg:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] font-heading uppercase tracking-[.10em] text-s-ink/30">{t("mixing_ratio")}</span>
                      <p className="text-s-ink/70 mt-0.5 font-mono text-[11px]">{f.mix_formula}</p>
                    </div>
                    {f.developer_volume && (
                      <div>
                        <span className="text-[10px] font-heading uppercase tracking-[.10em] text-s-ink/30">{t("developer_volume")}</span>
                        <p className="text-s-ink/70 mt-0.5">{f.developer_volume}</p>
                      </div>
                    )}
                    {f.processing_minutes && (
                      <div>
                        <span className="text-[10px] font-heading uppercase tracking-[.10em] text-s-ink/30">{t("processing_minutes")}</span>
                        <p className="text-s-ink/70 mt-0.5">{f.processing_minutes} min</p>
                      </div>
                    )}
                    {(f.root_formula as { text?: string })?.text && (
                      <div>
                        <span className="text-[10px] font-heading uppercase tracking-[.10em] text-s-ink/30">{t("root")}</span>
                        <p className="text-s-ink/70 mt-0.5">{(f.root_formula as { text?: string }).text}</p>
                      </div>
                    )}
                    {(f.mid_lengths_formula as { text?: string })?.text && (
                      <div>
                        <span className="text-[10px] font-heading uppercase tracking-[.10em] text-s-ink/30">{t("mid_lengths")}</span>
                        <p className="text-s-ink/70 mt-0.5">{(f.mid_lengths_formula as { text?: string }).text}</p>
                      </div>
                    )}
                    {(f.ends_formula as { text?: string })?.text && (
                      <div>
                        <span className="text-[10px] font-heading uppercase tracking-[.10em] text-s-ink/30">{t("ends")}</span>
                        <p className="text-s-ink/70 mt-0.5">{(f.ends_formula as { text?: string }).text}</p>
                      </div>
                    )}
                    {f.notes && (
                      <div className="lg:col-span-2">
                        <span className="text-[10px] font-heading uppercase tracking-[.10em] text-s-ink/30">{t("notes")}</span>
                        <p className="text-s-ink/50 mt-0.5">{f.notes}</p>
                      </div>
                    )}
                  </div>
                )}
                {isExpanded && (
                  <FormulaPhotoUpload
                    formulaId={f.id}
                    beforeUrl={(f as any).before_photo_url}
                    afterUrl={(f as any).after_photo_url}
                    onSaved={(b, a) => setFormulas((prev) =>
                      prev.map((x) => x.id === f.id ? { ...x, before_photo_url: b, after_photo_url: a } as any : x)
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
