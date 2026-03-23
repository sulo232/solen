"use client";

import { useState, useCallback } from "react";
import { Search, Link2, Sparkles, Download, Check, X, Loader2, Play, Image as ImageIcon, ChevronDown } from "lucide-react";

interface StockPhoto {
  id: string;
  url: string;
  thumbnail: string;
  author: string;
  source: string;
  alt_text: string;
  tags: string[];
}

type Tab = "tiktok" | "smart" | "category";

const CATEGORIES = ["hair", "beard", "nails", "makeup", "waxing"] as const;

export default function DiscoveryAdmin() {
  const [tab, setTab] = useState<Tab>("smart");
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mb-4 flex items-center gap-2 px-4 py-2 rounded-card bg-s-coral text-white text-sm font-medium hover:bg-s-coral/90 transition-colors"
      >
        <Download size={16} />
        Import Content
      </button>
    );
  }

  return (
    <div className="mb-6 rounded-card border border-s-coral/20 dark:border-s-coral/10 bg-white dark:bg-s-dm-surface overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-s-coral/5 dark:bg-s-coral/10 border-b border-s-coral/10">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-s-coral" />
          <span className="text-sm font-medium text-s-ink dark:text-s-dm-text">Content Import</span>
        </div>
        <button onClick={() => setOpen(false)} className="text-s-ink/40 hover:text-s-ink dark:text-s-dm-text/40 dark:hover:text-s-dm-text">
          <X size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-s-ink/5 dark:border-white/5">
        {([
          { id: "smart" as Tab, label: "Smart Search", icon: Search },
          { id: "tiktok" as Tab, label: "TikTok URLs", icon: Play },
          { id: "category" as Tab, label: "Quick Import", icon: Download },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors ${
              tab === t.id
                ? "text-s-coral border-b-2 border-s-coral"
                : "text-s-ink/40 dark:text-s-dm-text/40 hover:text-s-ink dark:hover:text-s-dm-text"
            }`}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {tab === "smart" && <SmartSearchTab />}
        {tab === "tiktok" && <TikTokImportTab />}
        {tab === "category" && <CategoryImportTab />}
      </div>
    </div>
  );
}

// ═══ Smart Search Tab ═══
function SmartSearchTab() {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("hair");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<StockPhoto[]>([]);
  const [queries, setQueries] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!description.trim()) return;
    setSearching(true);
    setResults([]);
    setQueries([]);
    setSelected(new Set());
    setImportResult(null);

    try {
      const res = await fetch("/api/admin/discovery/smart-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim(), category }),
      });
      const data = await res.json();
      setResults(data.results ?? []);
      setQueries(data.queries ?? []);
    } catch {
      setImportResult("Search failed. Try again.");
    } finally {
      setSearching(false);
    }
  }, [description, category]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === results.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(results.map((r) => r.id)));
    }
  };

  const handleImport = useCallback(async () => {
    if (!selected.size) return;
    setImporting(true);
    setImportResult(null);

    const photos = results.filter((r) => selected.has(r.id));
    try {
      const res = await fetch("/api/admin/discovery/smart-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "import", photos, category }),
      });
      const data = await res.json();
      setImportResult(`Imported ${data.imported} of ${data.total} photos`);
      // Remove imported from results
      setResults((prev) => prev.filter((r) => !selected.has(r.id)));
      setSelected(new Set());
    } catch {
      setImportResult("Import failed. Try again.");
    } finally {
      setImporting(false);
    }
  }, [selected, results, category]);

  return (
    <div className="space-y-4">
      {/* Description input */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-s-ink/60 dark:text-s-dm-text/60">
          Describe what you want to import
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="e.g. textured French crops for men, balayage on dark hair..."
            className="flex-1 px-3 py-2 text-sm rounded-card border border-s-ink/10 dark:border-white/10 bg-s-bg-base dark:bg-s-dm-bg text-s-ink dark:text-s-dm-text placeholder:text-s-ink/30 dark:placeholder:text-s-dm-text/30 focus:outline-none focus:ring-2 focus:ring-s-coral/30"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-2 py-2 text-xs rounded-card border border-s-ink/10 dark:border-white/10 bg-s-bg-base dark:bg-s-dm-bg text-s-ink dark:text-s-dm-text"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleSearch}
          disabled={searching || !description.trim()}
          className="flex items-center gap-2 px-4 py-2 rounded-card bg-s-coral text-white text-sm font-medium hover:bg-s-coral/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {searching ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {searching ? "Gemini is searching..." : "Smart Search"}
        </button>
      </div>

      {/* Generated queries */}
      {queries.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40 mr-1">Queries:</span>
          {queries.map((q, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded-pill bg-s-ink/5 dark:bg-white/5 text-s-ink/60 dark:text-s-dm-text/60">
              {q}
            </span>
          ))}
        </div>
      )}

      {/* Results grid */}
      {results.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-s-ink/60 dark:text-s-dm-text/60">
              {results.length} results — {selected.size} selected
            </span>
            <div className="flex items-center gap-2">
              <button onClick={selectAll} className="text-[10px] text-s-coral hover:underline">
                {selected.size === results.length ? "Deselect all" : "Select all"}
              </button>
              {selected.size > 0 && (
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="flex items-center gap-1 px-3 py-1 rounded-card bg-s-coral text-white text-xs font-medium hover:bg-s-coral/90 disabled:opacity-50"
                >
                  {importing ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                  Import {selected.size}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[400px] overflow-y-auto">
            {results.map((photo) => (
              <button
                key={photo.id}
                onClick={() => toggleSelect(photo.id)}
                className={`relative aspect-[3/4] rounded-card overflow-hidden border-2 transition-all ${
                  selected.has(photo.id)
                    ? "border-s-coral ring-2 ring-s-coral/30"
                    : "border-transparent hover:border-s-ink/10 dark:hover:border-white/10"
                }`}
              >
                <img
                  src={photo.thumbnail || photo.url}
                  alt={photo.alt_text}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {selected.has(photo.id) && (
                  <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-s-coral flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-1.5">
                  <p className="text-[9px] text-white/80 truncate">{photo.source} · {photo.author}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Import result */}
      {importResult && (
        <div className="text-xs px-3 py-2 rounded-card bg-s-success-bg text-s-success">
          {importResult}
        </div>
      )}
    </div>
  );
}

// ═══ TikTok Import Tab ═══
function TikTokImportTab() {
  const [urls, setUrls] = useState("");
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<Array<{ url: string; status: string; style_name?: string }>>([]);

  const handleImport = useCallback(async () => {
    const urlList = urls
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.includes("tiktok.com"));

    if (!urlList.length) return;
    setImporting(true);
    setResults([]);

    try {
      const res = await fetch("/api/admin/discovery/import-tiktok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: urlList }),
      });
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([{ url: "all", status: "Request failed" }]);
    } finally {
      setImporting(false);
    }
  }, [urls]);

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-xs font-medium text-s-ink/60 dark:text-s-dm-text/60">
          Paste TikTok URLs (one per line)
        </label>
        <textarea
          value={urls}
          onChange={(e) => setUrls(e.target.value)}
          placeholder={"https://www.tiktok.com/@user/video/123456\nhttps://www.tiktok.com/@user/video/789012"}
          rows={4}
          className="w-full px-3 py-2 text-sm rounded-card border border-s-ink/10 dark:border-white/10 bg-s-bg-base dark:bg-s-dm-bg text-s-ink dark:text-s-dm-text placeholder:text-s-ink/30 dark:placeholder:text-s-dm-text/30 focus:outline-none focus:ring-2 focus:ring-s-coral/30 resize-none font-mono"
        />
      </div>

      <button
        onClick={handleImport}
        disabled={importing || !urls.trim()}
        className="flex items-center gap-2 px-4 py-2 rounded-card bg-s-coral text-white text-sm font-medium hover:bg-s-coral/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {importing ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
        {importing ? "Importing + AI analyzing..." : "Import TikToks"}
      </button>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-1">
          {results.map((r, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 text-xs px-3 py-2 rounded-card ${
                r.status === "imported"
                  ? "bg-s-success-bg text-s-success"
                  : r.status === "already_exists"
                  ? "bg-s-yellow-subtle text-s-yellow-text"
                  : "bg-s-error-bg text-s-error"
              }`}
            >
              {r.status === "imported" ? <Check size={14} className="shrink-0 mt-0.5" /> : <X size={14} className="shrink-0 mt-0.5" />}
              <div className="min-w-0">
                <p className="truncate font-mono">{r.url}</p>
                <p className="text-[10px] opacity-70">
                  {r.status === "imported" && r.style_name ? `✓ ${r.style_name}` : r.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══ Category Quick-Import Tab ═══
function CategoryImportTab() {
  const [importing, setImporting] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const handleImport = useCallback(async (category: string) => {
    setImporting(category);
    setResult(null);

    try {
      const res = await fetch("/api/admin/discovery/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
      });
      const data = await res.json();
      setResult(`Imported ${data.imported} ${category} photos`);
    } catch {
      setResult(`Failed to import ${category}`);
    } finally {
      setImporting(null);
    }
  }, []);

  return (
    <div className="space-y-3">
      <p className="text-xs text-s-ink/60 dark:text-s-dm-text/60">
        Quick-import stock photos by category from Unsplash.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => handleImport(cat)}
            disabled={!!importing}
            className={`flex items-center justify-center gap-2 px-3 py-3 rounded-card border text-sm font-medium transition-all ${
              importing === cat
                ? "border-s-coral bg-s-coral/10 text-s-coral"
                : "border-s-ink/10 dark:border-white/10 text-s-ink dark:text-s-dm-text hover:border-s-coral hover:bg-s-coral/5"
            } disabled:opacity-50`}
          >
            {importing === cat ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <ImageIcon size={14} />
            )}
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {result && (
        <div className="text-xs px-3 py-2 rounded-card bg-s-success-bg text-s-success">
          {result}
        </div>
      )}
    </div>
  );
}
