"use client";

import { useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";
import AIProcessingIndicator from "@/components-legacy/discovery/AIProcessingIndicator";
import ImportProgressBar from "@/components-legacy/discovery/ImportProgressBar";
import Spinner from "@/components-legacy/ui/Spinner";
import {
  Search, Upload, CheckCircle, XCircle, Trash2, Eye,
  Video, RefreshCw, Download,
  AlertTriangle, GripVertical,
} from "lucide-react";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, rectSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { DiscoveryStagingItem, DiscoveryItem, DiscoveryCategory } from "@/lib/types";

const CATEGORIES: DiscoveryCategory[] = ["hair", "beard", "nails", "lashes", "brows"];
const TABS = ["Stock Import", "TikTok Import", "Manual Upload", "Staging", "Published", "Flagged"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABEL_KEYS = {
  "Stock Import": "tabStockImport",
  "TikTok Import": "tabTikTokImport",
  "Manual Upload": "tabManualUpload",
  Staging: "tabStaging",
  Published: "tabPublished",
  Flagged: "tabFlagged",
} as const satisfies Record<Tab, string>;

export default function DiscoveryAdminPage() {
  const t = useTranslations("dashboard.discoveryAdminPage");
  const [activeTab, setActiveTab] = useState<Tab>("Stock Import");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading text-s-ink">{t("title")}</h1>
          <p className="text-sm text-s-ink-2 mt-1">{t("subtitle")}</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                "px-4 py-2 rounded-btn text-sm font-medium whitespace-nowrap transition-colors",
                // selected-ok: dashboard vibrant skin (LOCKFILE §12.2/§12.4), s-coral retired, s-accent is the locked active-tab fill
                activeTab === tab
                  ? "bg-s-accent text-white"
                  : "bg-s-ink/5 text-s-ink-2 hover:bg-s-ink/10:bg-white/10",
              ].join(" ")}
            >
              {t(TAB_LABEL_KEYS[tab])}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "Stock Import" && <StockImportTab />}
        {activeTab === "TikTok Import" && <TikTokImportTab />}
        {activeTab === "Manual Upload" && <ManualUploadTab />}
        {activeTab === "Staging" && <StagingTab />}
        {activeTab === "Published" && <PublishedTab />}
        {activeTab === "Flagged" && <FlaggedTab />}
      </div>
    </DashboardLayout>
  );
}

// ─── Tab 1: Stock Import ───
function StockImportTab() {
  const t = useTranslations("dashboard.discoveryAdminPage");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<DiscoveryCategory>("hair");
  const [photos, setPhotos] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkResult, setBulkResult] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/discovery/search-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, category, source: "all", page: 1 }),
      });
      const data = await res.json();
      setPhotos(data.photos ?? []);
      setSelected(new Set());
    } finally {
      setLoading(false);
    }
  };

  const handleImportSelected = async () => {
    if (selected.size === 0) return;
    setImporting(true);
    setImportProgress({ current: 0, total: selected.size });
    const selectedPhotos = photos.filter((p) => selected.has(p.id));
    let imported = 0;
    for (const photo of selectedPhotos) {
      try {
        await fetch("/api/admin/discovery/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: photo.source,
            source_id: photo.id,
            source_url: photo.url,
            image_url: photo.url,
            thumbnail_url: photo.thumbnail,
            author_name: photo.author,
            alt_text: photo.alt_text,
            category,
            tags: photo.tags,
          }),
        });
        imported++;
      } catch { /* continue */ }
      setImportProgress({ current: imported, total: selected.size });
    }
    setImporting(false);
    setSelected(new Set());
  };

  // Type a term (e.g. "coffin nails") + hit this -> the route searches stock for it and imports the whole batch
  // into the chosen category. No term -> the category's preset queries. This is the "fill a category in one click".
  const handleBulkImport = async () => {
    setBulkImporting(true);
    setBulkResult(null);
    try {
      const res = await fetch("/api/admin/discovery/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, query: query.trim() || undefined, pages: 3 }),
      });
      const data = await res.json();
      if (!res.ok) { setBulkResult(data.error ?? "Import failed"); return; }
      setBulkResult(`Imported ${data.imported ?? 0} ${query.trim() ? `"${query.trim()}"` : category} photos into ${category}.`);
    } finally {
      setBulkImporting(false);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder={t("searchPhotosPlaceholder")}
          aria-label={t("searchStockAria")}
          className="flex-1 min-w-[200px] px-4 py-2.5 text-sm text-s-ink placeholder:text-s-ink/30" // mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17)
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as DiscoveryCategory)}
          aria-label={t("categoryFilterAria")}
          className="px-3 py-2.5 text-sm" // mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17)
        >
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={handleSearch} disabled={loading} className="px-4 py-2.5 rounded-btn bg-s-accent text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50">
          {loading ? <Spinner size="sm" /> : <Search size={16} strokeWidth={1.9} />} {t("searchBtn")}
        </button>
        <button onClick={handleBulkImport} disabled={bulkImporting} className="px-4 py-2.5 rounded-btn bg-s-amber text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50">
          {bulkImporting ? <Spinner size="sm" /> : <Download size={16} strokeWidth={1.9} />} {t("autoImportBtn")}
        </button>
      </div>

      {importing && <ImportProgressBar current={importProgress.current} total={importProgress.total} label={t("importingToStaging")} />}
      {bulkResult && (
        <div className="flex items-center gap-2 p-3 rounded-[12px] bg-s-success-bg border border-s-success/20">
          <CheckCircle size={16} strokeWidth={1.9} className="text-s-success" />
          <span className="text-sm text-s-success">{bulkResult}</span>
          <button onClick={() => setBulkResult(null)} className="ml-auto text-s-ink/30 hover:text-s-ink-2" aria-label={t("dismiss")}>
            <XCircle size={14} strokeWidth={1.6} />
          </button>
        </div>
      )}

      {selected.size > 0 && (
        <button onClick={handleImportSelected} disabled={importing} className="px-4 py-2 rounded-btn bg-s-accent text-white text-sm font-medium">
          {t("importSelected", { n: selected.size })}
        </button>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {photos.map((photo) => (
          <div
            key={photo.id}
            role="button"
            tabIndex={0}
            aria-label={selected.has(photo.id) ? t("deselectPhotoBy", { author: photo.author || t("unknownAuthor") }) : t("selectPhotoBy", { author: photo.author || t("unknownAuthor") })}
            onClick={() => toggleSelect(photo.id)}
            onKeyDown={(e) => e.key === "Enter" && toggleSelect(photo.id)}
            className={[
              "relative aspect-[3/4] rounded-[12px] overflow-hidden cursor-pointer border-2 transition-[background-color,border-color,box-shadow]",
              selected.has(photo.id) ? "border-s-coral ring-2 ring-s-coral/30" : "border-transparent",
            ].join(" ")}
          >
            <Image src={photo.thumbnail} alt={photo.alt_text || ""} fill className="object-cover" sizes="200px" />
            {selected.has(photo.id) && (
              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-s-accent flex items-center justify-center">
                <CheckCircle size={14} strokeWidth={1.6} className="text-white" />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <p className="text-[12px] text-white/80 truncate">{photo.author} {photo.source}</p>
            </div>
          </div>
        ))}
      </div>

      {photos.length === 0 && !loading && (
        <p className="text-center text-s-ink/30 py-12">{t("stockEmpty")}</p>
      )}
    </div>
  );
}

// ─── Tab 2: TikTok Import ───
function TikTokImportTab() {
  const t = useTranslations("dashboard.discoveryAdminPage");
  const [urls, setUrls] = useState("");
  const [category, setCategory] = useState<DiscoveryCategory>("hair");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<{ published: number; rejected: number; pending: number; failed: number } | null>(null);

  // Bulk import: parse + dedupe the pasted list, keep only real tiktok.com links, then import in small CHUNKS.
  // The per-URL oEmbed + AI tagging is slow, and one giant request both timed out AND silently dropped everything
  // past the route's 20-URL cap. Sequential chunks keep each request short, run the WHOLE list (nothing dropped),
  // and give live progress; the totals tick up as each chunk lands.
  const CHUNK = 4;
  const handleImport = async () => {
    const urlList = Array.from(new Set(urls.split(/\s+/).map((u) => u.trim()).filter(Boolean)))
      .filter((u) => u.includes("tiktok.com"));
    if (urlList.length === 0) return;
    setLoading(true);
    setResult(null);
    setProgress({ done: 0, total: urlList.length });
    const acc = { published: 0, rejected: 0, pending: 0, failed: 0 };
    try {
      for (let i = 0; i < urlList.length; i += CHUNK) {
        const chunk = urlList.slice(i, i + CHUNK);
        try {
          const res = await fetch("/api/admin/discovery/import-tiktok", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ urls: chunk, category }),
          });
          const data = await res.json();
          acc.published += data.published ?? 0;
          acc.rejected += data.rejected ?? 0;
          acc.pending += data.pending ?? 0;
          acc.failed += data.failed ?? 0;
        } catch (err) {
          console.error("[TikTokImport] chunk failed:", err);
          acc.failed += chunk.length;
        }
        setProgress({ done: Math.min(i + CHUNK, urlList.length), total: urlList.length });
        setResult({ ...acc });
      }
      if (acc.published > 0 || acc.pending > 0) setUrls("");
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <p className="text-sm text-s-ink-2">{t("tiktokIntro")}</p>
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value as DiscoveryCategory)}
        aria-label={t("tiktokCategoryAria")}
        className="px-3 py-2.5 text-sm" // mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17)
      >
        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <textarea
        value={urls}
        onChange={(e) => setUrls(e.target.value)}
        rows={8}
        aria-label={t("tiktokUrlsAria")}
        placeholder={"https://www.tiktok.com/@user/video/123...\nhttps://www.tiktok.com/@user/video/456..."}
        className="w-full px-4 py-3 text-sm text-s-ink placeholder:text-s-ink/30 font-mono" // mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17)
      />
      {loading && (
        <AIProcessingIndicator text={progress ? `${t("tiktokProcessing")} ${progress.done}/${progress.total}` : t("tiktokProcessing")} />
      )}
      <button onClick={handleImport} disabled={loading} className="px-4 py-2.5 rounded-btn bg-s-accent text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50">
        {loading ? <Spinner size="sm" /> : <Video size={16} strokeWidth={1.9} />} {t("importTikToksBtn")}
      </button>
      {result && (
        <div className="flex flex-wrap gap-4 text-sm">
          {result.published > 0 && <span className="text-s-success flex items-center gap-1"><CheckCircle size={14} strokeWidth={1.6} /> {t("resultPublished", { n: result.published })}</span>}
          {result.rejected > 0 && <span className="text-s-star flex items-center gap-1"><AlertTriangle size={14} strokeWidth={1.6} /> {t("resultAutoRejected", { n: result.rejected })}</span>}
          {result.pending > 0 && <span className="text-s-ink-2 flex items-center gap-1"><Eye size={14} strokeWidth={1.6} /> {t("resultSentToStaging", { n: result.pending })}</span>}
          {result.failed > 0 && <span className="text-s-error flex items-center gap-1"><XCircle size={14} strokeWidth={1.6} /> {t("resultFailed", { n: result.failed })}</span>}
        </div>
      )}
    </div>
  );
}

// ─── Tab 3: Manual Upload ───
function ManualUploadTab() {
  const t = useTranslations("dashboard.discoveryAdminPage");
  const [category, setCategory] = useState<DiscoveryCategory>("hair");
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadedItem, setUploadedItem] = useState<{ id: string; image_url: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("category", category);
      // A15-upload-hardening (2026-07-27): required by the route's CSRF guard, see
      // lib/upload-security.ts requireUploadHeader.
      const res = await fetch("/api/admin/discovery/upload", {
        method: "POST",
        headers: { "x-solen-upload": "1" },
        body: form,
      });
      const data = await res.json();
      if (data.id) {
        setUploadedItem(data);
        // Trigger AI analysis
        setAnalyzing(true);
        await fetch("/api/admin/discovery/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item_id: data.id, image_url: data.image_url }),
        });
        setAnalyzing(false);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-lg">
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value as DiscoveryCategory)}
        aria-label={t("uploadCategoryAria")}
        className="px-3 py-2.5 text-sm" // mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17)
      >
        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>

      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-s-border rounded-[12px] p-8 text-center cursor-pointer hover:border-s-coral/30 transition-colors"
      >
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} className="hidden" />
        {uploading ? (
          <Spinner size="lg" />
        ) : (
          <>
            <Upload size={32} className="mx-auto text-s-ink/20 mb-2" />
            <p className="text-sm text-s-ink/40">{t("uploadHint")}</p>
          </>
        )}
      </div>

      {analyzing && <AIProcessingIndicator />}

      {uploadedItem && !analyzing && (
        <div className="flex items-center gap-3 p-3 rounded-[12px] bg-s-success-bg border border-s-success/20">
          <CheckCircle size={18} strokeWidth={1.9} className="text-s-success" />
          <span className="text-sm text-s-success">{t("uploadSuccess")}</span>
        </div>
      )}
    </div>
  );
}

// ─── Tab 4: Staging ───
function StagingTab() {
  const t = useTranslations("dashboard.discoveryAdminPage");
  const [items, setItems] = useState<DiscoveryStagingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<string>("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: "pending" });
      if (category) params.set("category", category);
      const res = await fetch(`/api/admin/discovery/staging?${params}`);
      const data = await res.json();
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }, [category]);

  const handleAction = async (action: "approve" | "reject") => {
    if (selected.size === 0) return;
    setProcessing(true);
    try {
      await fetch("/api/admin/discovery/staging", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), action }),
      });
      setSelected(new Set());
      fetchItems();
    } finally {
      setProcessing(false);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const selectAll = () => {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((i) => i.id)));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label={t("stagingCategoryAria")}
          className="px-3 py-2 text-sm" // mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17)
        >
          <option value="">{t("allCategories")}</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={fetchItems} disabled={loading} aria-label={t("loadStagingAria")} className="px-3 py-2 rounded-btn bg-s-ink/5 text-sm flex items-center gap-1.5">
          <RefreshCw size={14} strokeWidth={1.6} className={loading ? "animate-spin" : ""} /> {t("loadBtn")}
        </button>
        {items.length > 0 && (
          <>
            <button onClick={selectAll} aria-label={selected.size === items.length ? t("deselectAllAria") : t("selectAllAria")} className="px-3 py-2 rounded-btn bg-s-ink/5 text-sm">
              {selected.size === items.length ? t("deselectAll") : t("selectAll")}
            </button>
            {selected.size > 0 && (
              <>
                <button onClick={() => handleAction("approve")} disabled={processing} className="px-3 py-2 rounded-btn bg-s-success text-white text-sm font-medium flex items-center gap-1.5 disabled:opacity-50">
                  <CheckCircle size={14} strokeWidth={1.6} /> {t("approveN", { n: selected.size })}
                </button>
                <button onClick={() => handleAction("reject")} disabled={processing} className="px-3 py-2 rounded-btn bg-s-error text-white text-sm font-medium flex items-center gap-1.5 disabled:opacity-50">
                  <XCircle size={14} strokeWidth={1.6} /> {t("rejectN", { n: selected.size })}
                </button>
              </>
            )}
          </>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => toggleSelect(item.id)}
            className={[
              "relative rounded-[12px] overflow-hidden cursor-pointer border-2 transition-[background-color,border-color,box-shadow]",
              selected.has(item.id) ? "border-s-coral ring-2 ring-s-coral/30" : "border-transparent bg-white",
            ].join(" ")}
          >
            <div className="aspect-[3/4] relative bg-s-ink/5">
              {(item.thumbnail_url || item.image_url) ? (
                <Image src={item.thumbnail_url || item.image_url!} alt={item.alt_text || ""} fill className="object-cover" sizes="200px" />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Video size={24} strokeWidth={2.4} className="text-s-ink/20" />
                </div>
              )}
              {item.media_type === "tiktok" && (
                <div className="absolute top-2 left-2">
                  <span className="text-[12px] px-1.5 py-0.5 rounded-pill bg-s-ink/60 text-white/90 backdrop-blur-sm font-medium">TikTok</span>
                </div>
              )}
              {selected.has(item.id) && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-s-accent flex items-center justify-center">
                  <CheckCircle size={14} strokeWidth={1.6} className="text-white" />
                </div>
              )}
            </div>
            <div className="p-2 space-y-1">
              <div className="flex items-center gap-1">
                <span className="text-[12px] px-1.5 py-0.5 rounded-pill bg-s-coral/10 text-s-coral font-medium">{item.category ?? item.auto_category ?? "?"}</span>
                <span className="text-[12px] px-1.5 py-0.5 rounded-pill bg-s-ink/5 text-s-ink-2">{item.source}</span>
              </div>
              {item.auto_style && <p className="text-xs text-s-ink-2 truncate">{item.auto_style}</p>}
              {item.auto_gender && <p className="text-[12px] text-s-ink/40">{item.auto_gender}</p>}
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && !loading && (
        <p className="text-center text-s-ink/30 py-12">{t("stagingEmpty")}</p>
      )}
    </div>
  );
}

// ─── Sortable Card ───
function SortablePublishedCard({ item, onArchive }: { item: DiscoveryItem; onArchive: (id: string) => void }) {
  const t = useTranslations("dashboard.discoveryAdminPage");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative rounded-[12px] overflow-hidden bg-white border border-s-ink/5">
      <div className="aspect-[3/4] relative bg-s-ink/5">
        {item.media_type === "photo" && item.image_url ? (
          <Image src={item.image_url} alt={item.alt_text || ""} fill className="object-cover" sizes="200px" />
        ) : item.tiktok_thumbnail_url ? (
          <Image src={item.tiktok_thumbnail_url} alt="" fill className="object-cover" sizes="200px" />
        ) : (
          <div className="flex items-center justify-center h-full"><Video size={24} strokeWidth={2.4} className="text-s-ink/20" /></div>
        )}
        <div className="absolute top-2 left-2">
          <button {...attributes} {...listeners} aria-label={t("dragToReorderAria")} className="w-7 h-7 rounded-full bg-s-ink/50 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none">
            <GripVertical size={14} strokeWidth={1.6} className="text-white" />
          </button>
        </div>
        <div className="absolute top-2 right-2 flex gap-1">
          <button onClick={() => onArchive(item.id)} aria-label={t("archiveItemAria")} className="w-6 h-6 rounded-full bg-s-ink/50 flex items-center justify-center hover:bg-s-error transition-colors">
            <Trash2 size={12} className="text-white" />
          </button>
        </div>
      </div>
      <div className="p-2 space-y-1">
        <div className="flex items-center gap-1">
          <span className="text-[12px] px-1.5 py-0.5 rounded-pill bg-s-coral/10 text-s-coral font-medium">{item.category}</span>
          <span className="text-[12px] px-1.5 py-0.5 rounded-pill bg-s-ink/5 text-s-ink-2">{item.media_type}</span>
        </div>
        {item.style_name && <p className="text-xs text-s-ink-2 truncate">{item.style_name}</p>}
        <div className="flex items-center gap-2 text-[12px] text-s-ink/30">
          <span>{t("likesN", { n: item.like_count })}</span>
          <span>{t("viewsN", { n: item.view_count })}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 5: Published ───
function PublishedTab() {
  const t = useTranslations("dashboard.discoveryAdminPage");
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<string>("");

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: "published" });
      if (category) params.set("category", category);
      const res = await fetch(`/api/admin/discovery?${params}`);
      const data = await res.json();
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }, [category]);

  const handleArchive = async (id: string) => {
    await fetch("/api/admin/discovery", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);

    // Persist new sort order
    const sortUpdates = reordered.map((item, idx) => ({ id: item.id, sort_order: idx }));
    try {
      await fetch("/api/admin/discovery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reorder: sortUpdates }),
      });
    } catch { /* best effort — UI already updated */ }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label={t("publishedCategoryAria")}
          className="px-3 py-2 text-sm" // mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17)
        >
          <option value="">{t("allCategories")}</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={fetchItems} disabled={loading} className="px-3 py-2 rounded-btn bg-s-ink/5 text-sm flex items-center gap-1.5">
          <RefreshCw size={14} strokeWidth={1.6} className={loading ? "animate-spin" : ""} /> {t("loadBtn")}
        </button>
        <span className="text-sm text-s-ink/40">{t("itemsCount", { n: items.length })}</span>
        {items.length > 0 && (
          <span className="text-xs text-s-ink/30 flex items-center gap-1">
            <GripVertical size={12} /> {t("dragToReorder")}
          </span>
        )}
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {items.map((item) => (
              <SortablePublishedCard key={item.id} item={item} onArchive={handleArchive} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {items.length === 0 && !loading && (
        <p className="text-center text-s-ink/30 py-12">{t("publishedEmpty")}</p>
      )}
    </div>
  );
}

// ─── Tab 6: Flagged ───
function FlaggedTab() {
  const t = useTranslations("dashboard.discoveryAdminPage");
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/discovery/moderation");
      const data = await res.json();
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAction = async (id: string, action: "approve" | "remove") => {
    await fetch("/api/admin/discovery/moderation", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <button onClick={fetchItems} disabled={loading} className="px-3 py-2 rounded-btn bg-s-ink/5 text-sm flex items-center gap-1.5">
          <RefreshCw size={14} strokeWidth={1.6} className={loading ? "animate-spin" : ""} /> {t("loadFlaggedBtn")}
        </button>
        <span className="text-sm text-s-ink/40">{t("flaggedItemsCount", { n: items.length })}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item.id} className="rounded-[12px] bg-white border border-s-ink/5 overflow-hidden">
            <div className="aspect-video relative bg-s-ink/5">
              {item.image_url ? (
                <Image src={item.image_url} alt="" fill className="object-cover" sizes="400px" />
              ) : (
                <div className="flex items-center justify-center h-full"><AlertTriangle size={24} strokeWidth={2.4} className="text-s-ink/20" /></div>
              )}
            </div>
            <div className="p-3 space-y-2">
              <div className="flex items-center gap-1">
                <span className="text-[12px] px-1.5 py-0.5 rounded-pill bg-s-coral/10 text-s-coral font-medium">{item.category}</span>
                <span className="text-[12px] px-1.5 py-0.5 rounded-pill bg-s-error-bg text-s-error font-medium">{item.content_type}</span>
              </div>
              {item.flag_reason && (
                <p className="text-xs text-s-error flex items-center gap-1"><AlertTriangle size={12} /> {item.flag_reason}</p>
              )}
              <div className="flex gap-2">
                <button onClick={() => handleAction(item.id, "approve")} className="flex-1 py-2 rounded-btn bg-s-success text-white text-sm font-medium flex items-center justify-center gap-1">
                  <CheckCircle size={14} strokeWidth={1.6} /> {t("approve")}
                </button>
                <button onClick={() => handleAction(item.id, "remove")} className="flex-1 py-2 rounded-btn bg-s-error text-white text-sm font-medium flex items-center justify-center gap-1">
                  <Trash2 size={14} strokeWidth={1.6} /> {t("remove")}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && !loading && (
        <p className="text-center text-s-ink/30 py-12">{t("flaggedEmpty")}</p>
      )}
    </div>
  );
}
