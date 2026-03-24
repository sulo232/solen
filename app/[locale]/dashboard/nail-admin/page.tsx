"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Upload, FileText, Shield, Wand2, TrendingUp, Zap, Package } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Spinner from "@/components/ui/Spinner";
import DynamicPricingConfig from "@/components/dashboard/nail/DynamicPricingConfig";
import AiArtGenerator from "@/components/dashboard/nail/AiArtGenerator";
import StationManager from "@/components/dashboard/nail/StationManager";
import RetailManager from "@/components/dashboard/nail/RetailManager";

type Tab = "pricing" | "generate" | "stations" | "retail" | "import" | "content" | "moderation";

export default function NailAdminPage() {
  const locale = useLocale();
  const router = useRouter();
  const [role, setRole] = useState<"admin" | "salon_owner" | null>(null);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("pricing");

  // Auth guard: allow admins and salon owners
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => {
        if (p?.role === "admin") {
          setRole("admin");
          setSalonId(p.salon_id ?? null);
        } else if (p?.role === "salon_owner" && p.salon_id) {
          setRole("salon_owner");
          setSalonId(p.salon_id);
        } else {
          router.push(`/${locale}/dashboard`);
        }
      })
      .catch(() => router.push(`/${locale}/dashboard`))
      .finally(() => setLoading(false));
  }, [locale, router]);

  if (loading || !role) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12"><Spinner /></div>
      </DashboardLayout>
    );
  }

  const isAdmin = role === "admin";

  // Salon owner tabs: pricing, AI art, stations, retail
  // Admin tabs: all salon owner tabs + import, content, moderation
  const TABS: { key: Tab; label: string; icon: React.FC<{ size?: number; className?: string }>; adminOnly?: boolean }[] = [
    { key: "pricing", label: "Preise", icon: TrendingUp },
    { key: "generate", label: "AI Art", icon: Wand2 },
    { key: "stations", label: "Stationen", icon: Zap },
    { key: "retail", label: "Retail", icon: Package },
    { key: "import", label: "Import", icon: Upload, adminOnly: true },
    { key: "content", label: "Inhalte", icon: FileText, adminOnly: true },
    { key: "moderation", label: "Moderation", icon: Shield, adminOnly: true },
  ];

  const visibleTabs = TABS.filter((t) => !t.adminOnly || isAdmin);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <h1 className="font-heading text-xl font-bold text-s-ink dark:text-s-dm-text mb-4">Nail Admin Suite</h1>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-s-ink/5 dark:border-s-dm-text/10 mb-6 overflow-x-auto">
          {visibleTabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm border-b-2 transition-colors whitespace-nowrap ${
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
        {activeTab === "pricing" && salonId && <DynamicPricingConfig salonId={salonId} />}
        {activeTab === "generate" && <AiArtGenerator />}
        {activeTab === "stations" && salonId && <StationManager salonId={salonId} />}
        {activeTab === "retail" && salonId && <RetailManager salonId={salonId} />}
        {activeTab === "import" && isAdmin && <ImportTab />}
        {activeTab === "content" && isAdmin && <ContentTab />}
        {activeTab === "moderation" && isAdmin && <ModerationTab />}

        {/* No salon fallback for admin without salon */}
        {!salonId && (activeTab === "pricing" || activeTab === "stations" || activeTab === "retail") && (
          <p className="text-center text-sm text-s-ink/40 dark:text-s-dm-text/40 py-8">
            Kein Salon verknüpft. Bitte wähle einen Salon aus.
          </p>
        )}
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
