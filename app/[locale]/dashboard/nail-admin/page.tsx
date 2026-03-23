"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Upload, FileText, Shield, Wand2 } from "lucide-react";
import { STYLE_PRESETS, COLOR_PRESETS, SKIN_TONE_PRESETS } from "@/lib/nail/ai-prompts";
import type { NailShape } from "@/lib/types";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Spinner from "@/components/ui/Spinner";

type Tab = "import" | "content" | "moderation" | "generate";

export default function NailAdminPage() {
  const locale = useLocale();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("import");

  // Admin guard
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => {
        if (p?.role !== "admin") {
          router.push(`/${locale}/dashboard`);
        } else {
          setIsAdmin(true);
        }
      })
      .catch(() => router.push(`/${locale}/dashboard`))
      .finally(() => setLoading(false));
  }, [locale, router]);

  if (loading || !isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12"><Spinner /></div>
      </DashboardLayout>
    );
  }

  const TABS: { key: Tab; label: string; icon: React.FC<{ size?: number; className?: string }> }[] = [
    { key: "import", label: "Import", icon: Upload },
    { key: "content", label: "Inhalte", icon: FileText },
    { key: "moderation", label: "Moderation", icon: Shield },
    { key: "generate", label: "AI Generate", icon: Wand2 },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <h1 className="font-heading text-xl font-bold text-s-ink dark:text-s-dm-text mb-4">Nail Content Studio</h1>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-s-ink/5 dark:border-s-dm-text/10 mb-6">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm border-b-2 transition-colors ${
                activeTab === key
                  ? "border-s-coral text-s-coral font-medium"
                  : "border-transparent text-s-ink/50 dark:text-s-dm-text/50 hover:text-s-ink dark:hover:text-s-dm-text"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "import" && <ImportTab />}
        {activeTab === "content" && <ContentTab />}
        {activeTab === "moderation" && <ModerationTab />}
        {activeTab === "generate" && <GenerateTab />}
      </div>
    </DashboardLayout>
  );
}

// ─── Import Tab ───────────────────────────────

function ImportTab() {
  const [query, setQuery] = useState("nail art");
  const [results, setResults] = useState<{ url: string; alt: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);

  const searchStock = async () => {
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/discovery/stock-search?q=${encodeURIComponent(query)}&category=nails`);
      if (res.ok) {
        const d = await res.json();
        setResults(d.images ?? []);
      }
    } finally {
      setSearching(false);
    }
  };

  const importImage = async (url: string) => {
    setImporting(url);
    try {
      await fetch("/api/admin/discovery/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_url: url, category: "nails", source: "stock_photo" }),
      });
    } finally {
      setImporting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Suche: nail art, french manicure, gel nails..."
          className="flex-1 px-3 py-2 rounded-button border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface text-sm"
          onKeyDown={(e) => e.key === "Enter" && searchStock()}
        />
        <button
          onClick={searchStock}
          disabled={searching}
          className="px-4 py-2 rounded-button bg-s-coral text-white text-sm font-medium"
        >
          {searching ? "..." : "Suchen"}
        </button>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {results.map((img, i) => (
          <div key={i} className="relative group rounded-card overflow-hidden bg-s-bg-sunken dark:bg-s-dm-bg">
            <img src={img.url} alt={img.alt} className="w-full aspect-square object-cover" />
            <button
              onClick={() => importImage(img.url)}
              disabled={importing === img.url}
              className="absolute inset-0 bg-s-ink/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium"
            >
              {importing === img.url ? "Importieren..." : "Importieren"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Content Tab ──────────────────────────────

function ContentTab() {
  const [items, setItems] = useState<{ id: string; image_url: string; name_de: string; status: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/discovery?category=nails")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.items) setItems(d.items); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-6"><Spinner /></div>;

  return (
    <div>
      <p className="text-sm text-s-ink/40 dark:text-s-dm-text/40 mb-4">{items.length} Nail-Inhalte</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-card border border-s-ink/5 dark:border-s-dm-text/10 overflow-hidden bg-white dark:bg-s-dm-surface">
            <img src={item.image_url} alt="" className="w-full aspect-square object-cover" />
            <div className="p-2">
              <p className="text-xs text-s-ink dark:text-s-dm-text truncate">{item.name_de}</p>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-pill ${
                item.status === "published" ? "bg-s-sage/20 text-s-sage" : "bg-s-amber-subtle text-s-amber"
              }`}>
                {item.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Generate Tab ────────────────────────────

const SHAPE_OPTIONS: { value: NailShape; label: string }[] = [
  { value: "round", label: "Rund" },
  { value: "square", label: "Square" },
  { value: "oval", label: "Oval" },
  { value: "almond", label: "Mandel" },
  { value: "coffin", label: "Coffin" },
  { value: "stiletto", label: "Stiletto" },
];

function GenerateTab() {
  const [shape, setShape] = useState("almond");
  const [style, setStyle] = useState(STYLE_PRESETS[0].value);
  const [colors, setColors] = useState(COLOR_PRESETS[0].value);
  const [skinTone, setSkinTone] = useState(SKIN_TONE_PRESETS[2].value);
  const [shotType, setShotType] = useState<"hero" | "detail" | "lifestyle">("hero");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ image_url: string; staging_id: string | null; prompt: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [budget, setBudget] = useState<{ spent: number; budget: number; percentUsed: number } | null>(null);

  // Load budget on mount
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
      setError("Netzwerkfehler");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Budget tracker */}
      {budget && (
        <div className="p-3 rounded-card bg-s-bg-surface dark:bg-s-dm-bg">
          <div className="flex items-center justify-between text-xs text-s-ink/60 dark:text-s-dm-text/60 mb-1">
            <span>Diesen Monat</span>
            <span>CHF {budget.spent.toFixed(2)} / CHF {budget.budget.toFixed(2)}</span>
          </div>
          <div className="h-2 rounded-full bg-s-ink/10 dark:bg-s-dm-text/10">
            <div
              className={`h-full rounded-full transition-all ${budget.percentUsed > 0.8 ? "bg-s-error" : "bg-s-sage"}`}
              style={{ width: `${Math.min(100, budget.percentUsed * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Selectors */}
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-medium text-s-ink/60 dark:text-s-dm-text/60">Form</span>
          <select value={shape} onChange={(e) => setShape(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-button border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface text-sm text-s-ink dark:text-s-dm-text">
            {SHAPE_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-s-ink/60 dark:text-s-dm-text/60">Stil</span>
          <select value={style} onChange={(e) => setStyle(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-button border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface text-sm text-s-ink dark:text-s-dm-text">
            {STYLE_PRESETS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-s-ink/60 dark:text-s-dm-text/60">Farbe</span>
          <select value={colors} onChange={(e) => setColors(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-button border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface text-sm text-s-ink dark:text-s-dm-text">
            {COLOR_PRESETS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-s-ink/60 dark:text-s-dm-text/60">Hautton</span>
          <select value={skinTone} onChange={(e) => setSkinTone(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-button border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface text-sm text-s-ink dark:text-s-dm-text">
            {SKIN_TONE_PRESETS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>
      </div>

      {/* Shot type pills */}
      <div>
        <span className="text-xs font-medium text-s-ink/60 dark:text-s-dm-text/60 mb-1.5 block">Aufnahme</span>
        <div className="flex gap-2">
          {(["hero", "detail", "lifestyle"] as const).map((t) => (
            <button key={t} onClick={() => setShotType(t)}
              className={`px-3 py-1.5 rounded-pill text-xs font-medium transition-colors ${
                shotType === t ? "bg-s-coral text-white" : "bg-s-ink/5 dark:bg-s-dm-text/10 text-s-ink/60 dark:text-s-dm-text/60"
              }`}>
              {t === "hero" ? "Volle Hand" : t === "detail" ? "Makro" : "Lifestyle"}
            </button>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <button onClick={handleGenerate} disabled={generating}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-button bg-s-coral text-white text-sm font-medium hover:bg-s-coral-hover transition-colors disabled:opacity-50">
        <Wand2 size={16} />
        {generating ? "Generiere..." : "Generieren"}
      </button>

      {/* Error */}
      {error && <p className="text-sm text-s-error">{error}</p>}

      {/* Result preview */}
      {result && (
        <div className="rounded-card border border-s-ink/10 dark:border-s-dm-text/10 overflow-hidden bg-white dark:bg-s-dm-surface">
          <img src={result.image_url} alt="AI generated nail art" className="w-full aspect-square object-cover" />
          <div className="p-3 space-y-2">
            <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 line-clamp-2">{result.prompt}</p>
            {result.staging_id && (
              <p className="text-xs text-s-sage">In Staging-Pipeline — zur Moderation bereit</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Moderation Tab ───────────────────────────

function ModerationTab() {
  const [pending, setPending] = useState<{ id: string; image_url: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/discovery/staging?category=nails&status=pending")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.items) setPending(d.items); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    await fetch(`/api/admin/discovery/staging/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: action === "approve" ? "approved" : "rejected" }),
    });
    setPending((prev) => prev.filter((p) => p.id !== id));
  };

  if (loading) return <div className="flex justify-center py-6"><Spinner /></div>;

  return (
    <div>
      <p className="text-sm text-s-ink/40 dark:text-s-dm-text/40 mb-4">{pending.length} ausstehend</p>
      {pending.length === 0 ? (
        <p className="text-center text-sm text-s-ink/30 dark:text-s-dm-text/30 py-8">Keine ausstehenden Inhalte</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {pending.map((item) => (
            <div key={item.id} className="rounded-card border border-s-ink/5 dark:border-s-dm-text/10 overflow-hidden bg-white dark:bg-s-dm-surface">
              <img src={item.image_url} alt="" className="w-full aspect-square object-cover" />
              <div className="p-2">
                <p className="text-xs text-s-ink dark:text-s-dm-text truncate mb-2">{item.title}</p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleAction(item.id, "approve")}
                    className="flex-1 text-xs py-1 rounded-button bg-s-sage/20 text-s-sage hover:bg-s-sage/30"
                  >
                    Genehmigen
                  </button>
                  <button
                    onClick={() => handleAction(item.id, "reject")}
                    className="flex-1 text-xs py-1 rounded-button bg-s-error-bg dark:bg-s-error/10 text-s-error hover:bg-s-error/15"
                  >
                    Ablehnen
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
