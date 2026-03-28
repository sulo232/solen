"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Plus, Trash2, Save } from "lucide-react";
import { useTranslations } from "next-intl";
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

const RULE_TYPE_VALUES: DynamicPricingRuleType[] = [
  "peak_hour",
  "off_peak",
  "weekend",
  "last_minute",
  "loyalty",
];

const RULE_TYPE_KEYS: Record<DynamicPricingRuleType, string> = {
  peak_hour: "pricing_peak",
  off_peak: "pricing_off_peak",
  weekend: "pricing_weekend",
  last_minute: "pricing_last_minute",
  loyalty: "pricing_loyalty",
};

export default function DynamicPricingConfig({ salonId }: { salonId: string }) {
  const t = useTranslations("nail_dashboard") as any;
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newRule, setNewRule] = useState<Partial<PricingRule> | null>(null);

  const DAYS = [
    t("day_sun"),
    t("day_mon"),
    t("day_tue"),
    t("day_wed"),
    t("day_thu"),
    t("day_fri"),
    t("day_sat"),
  ];

  const ruleTypeOptions = RULE_TYPE_VALUES.map((value) => ({
    value,
    label: t(RULE_TYPE_KEYS[value]),
  }));

  const getRuleTypeLabel = (ruleType: DynamicPricingRuleType) =>
    t(RULE_TYPE_KEYS[ruleType]) ?? ruleType;

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
    try {
      const res = await fetch(`/api/nail/pricing/${id}`, { method: "DELETE" });
      if (res.ok) {
        setRules((prev) => prev.filter((r) => r.id !== id));
      }
    } catch {
      // Request failed — keep rule in state
    }
  };

  if (loading) return <div className="flex justify-center py-6"><Spinner /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-s-coral" />
          <h3 className="font-heading font-semibold text-sm text-s-ink dark:text-s-dm-text">{t("pricing_title")}</h3>
        </div>
        <button onClick={() => setNewRule({ rule_type: "peak_hour", modifier: 1.2, day_of_week: 6, start_time: "10:00", end_time: "14:00" })}
          className="flex items-center gap-1 px-3 py-1.5 rounded-btn text-[11px] font-heading font-bold uppercase tracking-[.06em] bg-s-coral text-white">
          <Plus size={12} />
          {t("pricing_new_rule")}
        </button>
      </div>

      {/* Weekly heatmap — 7 days × 12 hours */}
      <div className="p-3 rounded-[16px] bg-s-bg-surface dark:bg-s-dm-bg overflow-x-auto">
        <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mb-2">{t("pricing_overview")}</p>
        <div className="min-w-[320px]">
          {/* Hour headers */}
          <div className="grid gap-0.5" style={{ gridTemplateColumns: "40px repeat(12, 1fr)" }}>
            <div />
            {Array.from({ length: 12 }, (_, h) => (
              <span key={h} className="text-[8px] text-center text-s-ink/30 dark:text-s-dm-text/30">{(h + 8).toString().padStart(2, "0")}</span>
            ))}
          </div>
          {/* Day rows */}
          {DAYS.map((day, dayIdx) => (
            <div key={dayIdx} className="grid gap-0.5 mt-0.5" style={{ gridTemplateColumns: "40px repeat(12, 1fr)" }}>
              <span className="text-[9px] text-s-ink/40 dark:text-s-dm-text/40 truncate">{day}</span>
              {Array.from({ length: 12 }, (_, h) => {
                const hour = h + 8;
                const hourStr = `${hour.toString().padStart(2, "0")}:00`;
                const matching = rules.filter(
                  (r) => r.is_active && r.day_of_week === dayIdx && r.start_time && r.end_time && r.start_time <= hourStr && r.end_time > hourStr
                );
                const maxMod = matching.length > 0 ? Math.max(...matching.map((r) => r.modifier)) : 1;
                const bg = maxMod > 1.3 ? "bg-s-coral-subtle" : maxMod > 1.1 ? "bg-s-coral-subtle/50" : maxMod < 0.9 ? "bg-s-sage-subtle" : "bg-white dark:bg-s-dm-surface";
                return (
                  <div key={h} className={`h-5 rounded-sm ${bg} flex items-center justify-center border border-s-ink/5 dark:border-s-dm-text/5`}>
                    {maxMod !== 1 && <span className="text-[7px] text-s-ink/60 dark:text-s-dm-text/60 data-text">{maxMod.toFixed(1)}x</span>}
                  </div>
                );
              })}
            </div>
          ))}
          {/* Legend */}
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-s-sage-subtle" /><span className="text-[8px] text-s-ink/40 dark:text-s-dm-text/40">{t("pricing_discount")}</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-white dark:bg-s-dm-surface border border-s-ink/5" /><span className="text-[8px] text-s-ink/40 dark:text-s-dm-text/40">{t("pricing_base")}</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-s-coral-subtle" /><span className="text-[8px] text-s-ink/40 dark:text-s-dm-text/40">{t("pricing_premium")}</span></div>
          </div>
        </div>
      </div>

      {/* New rule form */}
      {newRule && (
        <div className="p-3 rounded-[16px] border border-s-coral/20 bg-white dark:bg-s-dm-surface space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <select value={newRule.rule_type || "peak_hour"}
              onChange={(e) => setNewRule({ ...newRule, rule_type: e.target.value as DynamicPricingRuleType })}
              className="px-3 py-2 rounded-btn border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface text-sm text-s-ink dark:text-s-dm-text">
              {ruleTypeOptions.map((rt) => <option key={rt.value} value={rt.value}>{rt.label}</option>)}
            </select>
            <select value={newRule.day_of_week ?? 6}
              onChange={(e) => setNewRule({ ...newRule, day_of_week: parseInt(e.target.value) })}
              className="px-3 py-2 rounded-btn border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface text-sm text-s-ink dark:text-s-dm-text">
              {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </div>
          <div className="flex gap-2 items-center">
            <input type="time" value={newRule.start_time || "10:00"}
              onChange={(e) => setNewRule({ ...newRule, start_time: e.target.value })}
              className="px-3 py-2 rounded-btn border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface text-sm" />
            <span className="text-xs text-s-ink/40 dark:text-s-dm-text/40">{t("pricing_to")}</span>
            <input type="time" value={newRule.end_time || "14:00"}
              onChange={(e) => setNewRule({ ...newRule, end_time: e.target.value })}
              className="px-3 py-2 rounded-btn border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface text-sm" />
          </div>
          <div>
            <label className="text-xs text-s-ink/60 dark:text-s-dm-text/60 mb-1 block">
              {t("pricing_factor")}: {(newRule.modifier ?? 1.2).toFixed(1)}x
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
            {t("pricing_preview")}: {DAYS[newRule.day_of_week ?? 6]} {newRule.start_time || "10:00"}–{newRule.end_time || "14:00"} → {(newRule.modifier ?? 1.2) > 1 ? "+" : ""}{Math.round(((newRule.modifier ?? 1.2) - 1) * 100)}%
          </p>
          <div className="flex gap-2">
            <button onClick={addRule} disabled={saving}
              className="flex items-center gap-1 px-4 py-2 rounded-btn active:scale-[0.98] bg-s-coral text-white text-[11px] font-heading font-bold uppercase tracking-[.06em] transition-all">
              <Save size={12} />
              {saving ? t("saving") : t("save")}
            </button>
            <button onClick={() => setNewRule(null)} className="px-4 py-2 rounded-btn text-xs text-s-ink/50 dark:text-s-dm-text/50">
              {t("cancel")}
            </button>
          </div>
        </div>
      )}

      {/* Existing rules */}
      <div className="space-y-2">
        {rules.map((rule) => (
          <div key={rule.id} className="flex items-center justify-between p-3 rounded-[16px] border border-s-ink/5 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface">
            <div>
              <p className="text-xs font-medium text-s-ink dark:text-s-dm-text">
                {getRuleTypeLabel(rule.rule_type)}
              </p>
              <p className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40">
                {rule.day_of_week != null ? DAYS[rule.day_of_week] : t("pricing_all_days")} {rule.start_time}–{rule.end_time} → {rule.modifier.toFixed(1)}x
              </p>
            </div>
            <button onClick={() => deleteRule(rule.id)}
              aria-label={t("delete")}
              className="p-1.5 min-h-12 rounded-btn hover:bg-s-error-bg dark:hover:bg-s-error/10 text-s-ink/30 dark:text-s-dm-text/30 hover:text-s-error">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {rules.length === 0 && !newRule && (
          <p className="text-center text-sm text-s-ink/30 dark:text-s-dm-text/30 py-6">{t("pricing_empty")}</p>
        )}
      </div>
    </div>
  );
}
