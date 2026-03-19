"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { FileEdit, Save, Check } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Spinner from "@/components/ui/Spinner";
import { containerVariants, itemVariants } from "@/lib/animations";

/* ─── Types ─── */
interface ContentRow {
  key: string;
  value_de: string | null;
  value_en: string | null;
  value_fr: string | null;
  content_type: string;
  category: string;
  sort_order: number;
  is_auto: boolean;
  auto_override: string | null;
  updated_at: string;
}

const TABS = [
  { id: "hero", label: "Hero" },
  { id: "stats", label: "Statistiken" },
  { id: "banner", label: "Banner" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/* ─── Content Field ─── */
function ContentField({
  row,
  onSaved,
}: {
  row: ContentRow;
  onSaved: () => void;
}) {
  const [locale, setLocale] = useState<"de" | "en">("de");
  const [valueDe, setValueDe] = useState(row.value_de ?? "");
  const [valueEn, setValueEn] = useState(row.value_en ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const currentValue = locale === "de" ? valueDe : valueEn;
  const setCurrentValue = locale === "de" ? setValueDe : setValueEn;

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/admin/content/${row.key}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value_de: valueDe, value_en: valueEn }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onSaved();
  };

  return (
    <motion.div variants={itemVariants} className="bg-white rounded-card border border-s-ink/5 shadow-card p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-[10px] font-bold text-dark/30 uppercase tracking-wide">{row.key}</p>
          {row.is_auto && (
            <span className="inline-block px-1.5 py-0.5 rounded-pill bg-amber-50 text-amber-600 text-[10px] font-bold mt-0.5">
              Auto
            </span>
          )}
        </div>
        <div className="flex rounded-button overflow-hidden border border-s-ink/10 shrink-0">
          {(["de", "en"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLocale(l)}
              className={`px-2.5 py-1 text-[10px] font-medium transition-colors ${
                locale === l ? "bg-s-coral text-white" : "text-dark/40"
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {row.content_type === "text" && currentValue.length > 80 ? (
        <textarea
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          rows={3}
          className="w-full px-3 py-2.5 rounded-button border border-s-ink/10 text-sm font-body text-dark focus:outline-none focus:border-s-coral resize-y"
        />
      ) : (
        <input
          type={row.content_type === "number" ? "number" : "text"}
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          className="w-full px-3 py-2.5 rounded-button border border-s-ink/10 text-sm font-body text-dark focus:outline-none focus:border-s-coral"
        />
      )}

      <div className="flex items-center justify-between mt-2">
        <p className="text-[10px] text-dark/25">
          Zuletzt geändert: {new Date(row.updated_at).toLocaleDateString("de-CH", {
            day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
          })}
        </p>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button bg-s-coral text-white text-xs font-medium disabled:opacity-50 hover:bg-s-coral/90 transition-colors"
        >
          {saving ? <Spinner size="sm" invert /> : saved ? <Check size={12} /> : <Save size={12} />}
          {saved ? "Gespeichert" : "Speichern"}
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Main Page ─── */
export default function ContentEditorPage() {
  const [rows, setRows] = useState<ContentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("hero");

  const fetchContent = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/content-list")
      .then((r) => r.json())
      .then((d) => setRows(d.items ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  const filtered = rows
    .filter((r) => r.category === activeTab)
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl text-dark">Inhalte bearbeiten</h1>
        <p className="text-sm text-dark/40 mt-0.5">Website-Texte und Inhalte verwalten</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-pill text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-s-coral text-white"
                : "bg-white border border-s-ink/10 text-dark/60 hover:border-s-coral"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <FileEdit size={32} className="mx-auto mb-3 text-dark/20" />
          <p className="text-sm text-dark/40">Keine Inhalte in dieser Kategorie.</p>
        </div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-3">
          {filtered.map((row) => (
            <ContentField key={row.key} row={row} onSaved={fetchContent} />
          ))}
        </motion.div>
      )}
    </DashboardLayout>
  );
}
