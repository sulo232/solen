"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Plus, Trash2, Save } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import type { DynamicPricingRuleType } from "@/lib/types";

interface PricingRule {
  id: string;
  rule_type: DynamicPricingRuleType;
  day_of_week: number | null;
  start_time: string | null;
  end_time: string | null;
  modifier: number;
  is_active: boolean;
}

const DAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const RULE_TYPES: { value: DynamicPricingRuleType; label: string }[] = [
  { value: "peak_hour", label: "Stosszeit" },
  { value: "off_peak", label: "Randzeiten" },
  { value: "weekend", label: "Wochenende" },
  { value: "last_minute", label: "Last Minute" },
  { value: "loyalty", label: "Stammkunden" },
];

export default function DynamicPricingConfig({ salonId }: { salonId: string }) {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newRule, setNewRule] = useState<Partial<PricingRule> | null>(null);

  useEffect(() => {
    fetch(`/api/nail/pricing?salon_id=${salonId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.rules) setRules(d.rules); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [salonId]);

  const addRule = async () => {
    if (!newRule?.rule_type || newRule.modifier == null) return;
    setSaving(true);
    try {
      const res = await fetch("/api/nail/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salon_id: salonId, ...newRule }),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.rule) setRules((prev) => [...prev, d.rule]);
        setNewRule(null);
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteRule = async (id: string) => {
    await fetch(`/api/nail/pricing/${id}`, { method: "DELETE" });
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  if (loading) return <div className="flex justify-center py-6"><Spinner /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-s-coral" />
          <h3 className="font-heading font-semibold text-sm text-s-ink dark:text-s-dm-text">Dynamische Preise</h3>
        </div>
        <button onClick={() => setNewRule({ rule_type: "peak_hour", modifier: 1.2, day_of_week: 6, start_time: "10:00", end_time: "14:00" })}
          className="flex items-center gap-1 px-3 py-1.5 rounded-button text-xs font-medium bg-s-coral text-white">
          <Plus size={12} />
          Neue Regel
        </button>
      </div>

      {/* Weekly heatmap preview */}
      <div className="p-3 rounded-card bg-s-bg-surface dark:bg-s-dm-bg">
        <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mb-2">Preis-Übersicht (Woche)</p>
        <div className="grid grid-cols-7 gap-1">
          {DAYS.map((day, i) => {
            const dayRules = rules.filter((r) => r.day_of_week === i && r.is_active);
            const maxMod = dayRules.length > 0 ? Math.max(...dayRules.map((r) => r.modifier)) : 1;
            const color = maxMod > 1.3 ? "bg-red-400" : maxMod > 1.1 ? "bg-s-amber" : maxMod < 0.9 ? "bg-s-sage" : "bg-s-ink/10 dark:bg-s-dm-text/10";
            return (
              <div key={i} className="text-center">
                <span className="text-[9px] text-s-ink/40 dark:text-s-dm-text/40">{day}</span>
                <div className={`h-6 rounded-sm ${color} mt-0.5 flex items-center justify-center`}>
                  {maxMod !== 1 && <span className="text-[8px] text-white font-medium">{maxMod.toFixed(1)}x</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* New rule form */}
      {newRule && (
        <div className="p-3 rounded-card border border-s-coral/20 bg-white dark:bg-s-dm-surface space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <select value={newRule.rule_type || "peak_hour"}
              onChange={(e) => setNewRule({ ...newRule, rule_type: e.target.value as DynamicPricingRuleType })}
              className="px-3 py-2 rounded-button border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface text-sm text-s-ink dark:text-s-dm-text">
              {RULE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select value={newRule.day_of_week ?? 6}
              onChange={(e) => setNewRule({ ...newRule, day_of_week: parseInt(e.target.value) })}
              className="px-3 py-2 rounded-button border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface text-sm text-s-ink dark:text-s-dm-text">
              {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </div>
          <div className="flex gap-2 items-center">
            <input type="time" value={newRule.start_time || "10:00"}
              onChange={(e) => setNewRule({ ...newRule, start_time: e.target.value })}
              className="px-3 py-2 rounded-button border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface text-sm" />
            <span className="text-xs text-s-ink/40 dark:text-s-dm-text/40">bis</span>
            <input type="time" value={newRule.end_time || "14:00"}
              onChange={(e) => setNewRule({ ...newRule, end_time: e.target.value })}
              className="px-3 py-2 rounded-button border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface text-sm" />
          </div>
          <div>
            <label className="text-xs text-s-ink/60 dark:text-s-dm-text/60 mb-1 block">
              Preisfaktor: {(newRule.modifier ?? 1.2).toFixed(1)}x
              {(newRule.modifier ?? 1.2) > 1 ? ` (+${Math.round(((newRule.modifier ?? 1.2) - 1) * 100)}%)` : ` (${Math.round(((newRule.modifier ?? 1.2) - 1) * 100)}%)`}
            </label>
            <input type="range" min="0.5" max="2.0" step="0.1" value={newRule.modifier ?? 1.2}
              onChange={(e) => setNewRule({ ...newRule, modifier: parseFloat(e.target.value) })}
              className="w-full accent-s-coral" />
            <div className="flex justify-between text-[9px] text-s-ink/30 dark:text-s-dm-text/30">
              <span>0.5x</span><span>1.0x</span><span>1.5x</span><span>2.0x</span>
            </div>
          </div>
          <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50">
            Vorschau: {DAYS[newRule.day_of_week ?? 6]} {newRule.start_time || "10:00"}–{newRule.end_time || "14:00"} → {(newRule.modifier ?? 1.2) > 1 ? "+" : ""}{Math.round(((newRule.modifier ?? 1.2) - 1) * 100)}%
          </p>
          <div className="flex gap-2">
            <button onClick={addRule} disabled={saving}
              className="flex items-center gap-1 px-4 py-2 rounded-button bg-s-coral text-white text-xs font-medium">
              <Save size={12} />
              {saving ? "..." : "Speichern"}
            </button>
            <button onClick={() => setNewRule(null)} className="px-4 py-2 rounded-button text-xs text-s-ink/50 dark:text-s-dm-text/50">
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Existing rules */}
      <div className="space-y-2">
        {rules.map((rule) => (
          <div key={rule.id} className="flex items-center justify-between p-3 rounded-card border border-s-ink/5 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface">
            <div>
              <p className="text-xs font-medium text-s-ink dark:text-s-dm-text">
                {RULE_TYPES.find((t) => t.value === rule.rule_type)?.label ?? rule.rule_type}
              </p>
              <p className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40">
                {rule.day_of_week != null ? DAYS[rule.day_of_week] : "Alle Tage"} {rule.start_time}–{rule.end_time} → {rule.modifier.toFixed(1)}x
              </p>
            </div>
            <button onClick={() => deleteRule(rule.id)}
              className="p-1.5 rounded-button hover:bg-red-50 dark:hover:bg-red-900/10 text-s-ink/30 dark:text-s-dm-text/30 hover:text-red-500">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {rules.length === 0 && !newRule && (
          <p className="text-center text-sm text-s-ink/30 dark:text-s-dm-text/30 py-6">Keine Preisregeln konfiguriert</p>
        )}
      </div>
    </div>
  );
}
