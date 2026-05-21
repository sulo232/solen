"use client";

import { useEffect, useState } from "react";
import { Plus, Beaker } from "lucide-react";
import Spinner from "@/components-legacy/ui/Spinner";

interface Formula {
  id: string;
  brand: string | null;
  product_line: string | null;
  mix_formula: string;
  developer_volume: string | null;
  processing_minutes: number | null;
  notes: string | null;
  created_at: string;
}

interface FormulaTabProps {
  customerId: string;
}

export default function FormulaTab({ customerId }: FormulaTabProps) {
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [brand, setBrand] = useState("");
  const [productLine, setProductLine] = useState("");
  const [mixFormula, setMixFormula] = useState("");
  const [developerVolume, setDeveloperVolume] = useState("");
  const [processingMinutes, setProcessingMinutes] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/clients/${customerId}/formulas`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (!cancelled && d) setFormulas(d.items ?? []); })
      .catch((err) => console.error("[FormulaTab] failed to load formulas:", err))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [customerId]);

  const handleAdd = async () => {
    if (!mixFormula.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${customerId}/formulas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: brand.trim() || null,
          product_line: productLine.trim() || null,
          mix_formula: mixFormula.trim(),
          developer_volume: developerVolume.trim() || null,
          processing_minutes: processingMinutes ? Number(processingMinutes) : null,
          notes: notes.trim() || null,
        }),
      });
      if (res.ok) {
        const { data } = await res.json();
        setFormulas((prev) => [data, ...prev]);
        setShowAdd(false);
        setBrand(""); setProductLine(""); setMixFormula(""); setDeveloperVolume(""); setProcessingMinutes(""); setNotes("");
      }
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-6"><Spinner size="md" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-sm text-s-ink flex items-center gap-2">
          <Beaker size={14} className="text-s-coral" /> Farbformeln
        </h3>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1 text-xs text-s-coral hover:text-s-coral/80 transition-colors">
          <Plus size={12} /> Neue Formel
        </button>
      </div>

      {showAdd && (
        <div className="rounded-[16px] border border-s-coral/20 bg-s-coral/5 p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-s-ink/50 mb-1 block">Marke</label>
              <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="z.B. Wella"
                className="w-full px-2 py-1.5 rounded-input border border-s-ink/10 bg-white text-sm text-s-ink focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20" />
            </div>
            <div>
              <label className="text-xs text-s-ink/50 mb-1 block">Produktlinie</label>
              <input value={productLine} onChange={(e) => setProductLine(e.target.value)} placeholder="z.B. Koleston"
                className="w-full px-2 py-1.5 rounded-input border border-s-ink/10 bg-white text-sm text-s-ink focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20" />
            </div>
          </div>
          <div>
            <label className="text-xs text-s-ink/50 mb-1 block">Mischformel *</label>
            <input value={mixFormula} onChange={(e) => setMixFormula(e.target.value)} placeholder="z.B. 7/0 + 8/1 (1:1)"
              className="w-full px-2 py-1.5 rounded-input border border-s-ink/10 bg-white text-sm text-s-ink focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-s-ink/50 mb-1 block">Entwickler</label>
              <input value={developerVolume} onChange={(e) => setDeveloperVolume(e.target.value)} placeholder="z.B. 6%"
                className="w-full px-2 py-1.5 rounded-input border border-s-ink/10 bg-white text-sm text-s-ink focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20" />
            </div>
            <div>
              <label className="text-xs text-s-ink/50 mb-1 block">Einwirkzeit (Min.)</label>
              <input type="number" value={processingMinutes} onChange={(e) => setProcessingMinutes(e.target.value)} placeholder="35"
                className="w-full px-2 py-1.5 rounded-input border border-s-ink/10 bg-white text-sm text-s-ink focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20" />
            </div>
          </div>
          <div>
            <label className="text-xs text-s-ink/50 mb-1 block">Notizen</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Zusätzliche Hinweise…"
              className="w-full px-2 py-1.5 rounded-input border border-s-ink/10 bg-white text-sm text-s-ink focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20 resize-none" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 rounded-pill border border-s-ink/10 text-xs text-s-ink/60">Abbrechen</button>
            <button onClick={handleAdd} disabled={!mixFormula.trim() || saving}
              className="px-3 py-1.5 rounded-pill active:scale-[0.97] bg-s-coral text-white text-[11px] font-heading uppercase tracking-[.06em] disabled:opacity-50 flex items-center gap-1 shadow-elevation-2 transition-[transform,filter] duration-150">
              {saving && <Spinner size="sm" invert />} Speichern
            </button>
          </div>
        </div>
      )}

      {formulas.length === 0 ? (
        <p className="text-xs text-s-ink/30 text-center py-6">Keine Formeln gespeichert</p>
      ) : (
        <div className="space-y-2">
          {formulas.map((f) => (
            <div key={f.id} className="bg-white rounded-[16px] border border-s-ink/5 p-3">
              <p className="text-sm font-medium text-s-ink font-mono">{f.mix_formula}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-s-ink/40">
                {f.brand && <span>{f.brand}{f.product_line ? ` · ${f.product_line}` : ""}</span>}
                {f.developer_volume && <span>Entwickler: {f.developer_volume}</span>}
                {f.processing_minutes && <span>{f.processing_minutes} Min.</span>}
              </div>
              {f.notes && <p className="text-xs text-s-ink/30 mt-1">{f.notes}</p>}
              <p className="text-[10px] text-s-ink/20 mt-1">{new Date(f.created_at).toLocaleDateString("de-CH")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
