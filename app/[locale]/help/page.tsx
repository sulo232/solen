"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { motion } from "motion/react";
import { Search, Users, Store, Mail, BookOpen, ChevronRight } from "lucide-react";
import { Skeleton } from "@/app/[locale]/_components/primitives";
import EmptyState from "@/components-legacy/ui/EmptyState";

type HelpArticle = {
  id: string;
  slug: string;
  title: string;
  category: string;
  locale: string;
  sort_order: number;
};

// V3-D305: retired s-coral icon-chip colors → neutral s-bg-sunken + s-ink-2 (Layer 1 chrome per LOCKFILE §1 — icon-chips don't need accent)
const CATEGORIES = [
  { key: "customers", label: "Für Kunden", Icon: Users, color: "bg-s-bg-sunken text-s-ink" },
  { key: "salons", label: "Für Salons", Icon: Store, color: "bg-s-bg-sunken text-s-ink" },
  { key: "contact", label: "Kontakt", Icon: Mail, color: "bg-s-bg-sunken text-s-ink" },
];

export default function HelpPage() {
  const locale = useLocale();
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ locale });
    if (activeCategory) params.set("category", activeCategory);
    if (search.trim()) params.set("q", search.trim());

    fetch(`/api/help?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setArticles(data.articles ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [locale, activeCategory, search]);

  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    articles: articles.filter((a) => a.category === cat.key),
  }));

  return (
    <div className="min-h-screen bg-white">
      {/* V3-D305: retired s-coral (gradient, ring, fill) → neutral chrome; s-sand undefined → s-bg-sunken; active tab uses ink-fill per LOCKFILE TabPill pattern; arbitrary s-ink/X → canonical s-ink-2; H1 normalized to Page H2 spec (LOCKFILE §2) */}
      {/* Hero */}
      <div className="pt-8 pb-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="w-14 h-14 rounded-[12px] bg-s-bg-sunken flex items-center justify-center mx-auto mb-4">
            <BookOpen size={28} className="text-s-ink" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-s-ink leading-[1.05]">
            Hilfe & Support
          </h1>
          <p className="text-s-ink-2 font-body mt-2 text-sm sm:text-base">
            Finde Antworten auf häufige Fragen oder kontaktiere uns direkt.
          </p>

          {/* Search */}
          <div className="relative max-w-md mx-auto mt-6">
            <Search size={18} strokeWidth={1.9} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-s-ink-2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Suche nach Themen..."
              className="w-full !pl-10 pr-4 py-2.5 text-sm font-body text-s-ink transition-colors" // mockup-ok: dead-class removal only, type=text already caught before this change (V3-D-input-fill-2026-07-17)
            />
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveCategory(null)}
            className={[
              "px-3 py-1.5 rounded-pill text-xs font-medium font-body transition-colors",
              activeCategory === null
                ? "bg-s-ink text-white"
                : "bg-s-bg-sunken text-s-ink-2 hover:bg-s-border",
            ].join(" ")}
          >
            Alle
          </button>
          {CATEGORIES.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setActiveCategory(activeCategory === key ? null : key)}
              className={[
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-medium font-body transition-colors",
                activeCategory === key
                  ? "bg-s-ink text-white"
                  : "bg-s-bg-sunken text-s-ink-2 hover:bg-s-border",
              ].join(" ")}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          // mockup-ok: MOCKUP_QUEUE.md item 6, shaped Skeleton (icon chip + article rows,
          // matches the real grouped list below) replaces the ad-hoc centered Spinner.
          <div className="space-y-8">
            {[0, 1].map((g) => (
              <div key={g}>
                <div className="flex items-center gap-2 mb-3">
                  <Skeleton width={32} height={32} rounded={12} />
                  <Skeleton height={18} width={120} rounded={4} />
                </div>
                <div className="space-y-1">
                  {[0, 1, 2].map((r) => (
                    <Skeleton key={r} height={44} rounded={12} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Keine Artikel gefunden"
            message={search ? "Versuche eine andere Suchanfrage." : "Hier gibt es noch keine Hilfe-Artikel."}
          />
        ) : (
          <div className="space-y-8">
            {grouped
              .filter((g) => g.articles.length > 0)
              .map((group) => (
                <motion.div
                  key={group.key}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-btn ${group.color} flex items-center justify-center`}>
                      <group.Icon size={16} />
                    </div>
                    <h2 className="font-display text-lg font-semibold text-s-ink">{group.label}</h2>
                  </div>
                  <div className="space-y-1">
                    {group.articles.map((article) => (
                      <Link
                        key={article.id}
                        href={`/${locale}/help/${article.slug}`}
                        className="flex items-center justify-between px-4 py-3 rounded-[12px] bg-s-bg-surface hover:bg-s-bg-sunken transition-colors group"
                      >
                        <span className="font-body text-sm text-s-ink transition-colors">
                          {article.title}
                        </span>
                        <ChevronRight size={16} strokeWidth={1.9} className="text-s-ink-2 group-hover:text-s-ink transition-colors shrink-0" />
                      </Link>
                    ))}
                  </div>
                </motion.div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
