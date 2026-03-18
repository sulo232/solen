"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Users, Store, Mail, BookOpen, ChevronRight } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";

type HelpArticle = {
  id: string;
  slug: string;
  title: string;
  category: string;
  locale: string;
  sort_order: number;
};

const CATEGORIES = [
  { key: "customers", label: "Für Kunden", Icon: Users, color: "bg-teal/10 text-teal" },
  { key: "salons", label: "Für Salons", Icon: Store, color: "bg-coral/10 text-coral" },
  { key: "contact", label: "Kontakt", Icon: Mail, color: "bg-dark/5 text-dark/70" },
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
      {/* Hero */}
      <div className="bg-gradient-to-b from-teal/5 via-white to-transparent pt-24 pb-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-teal/10 flex items-center justify-center mx-auto mb-4">
            <BookOpen size={28} className="text-teal" />
          </div>
          <h1 className="font-heading font-bold text-2xl sm:text-4xl text-dark">
            Hilfe & Support
          </h1>
          <p className="text-dark/50 font-body mt-2 text-sm sm:text-base">
            Finde Antworten auf häufige Fragen oder kontaktiere uns direkt.
          </p>

          {/* Search */}
          <div className="relative max-w-md mx-auto mt-6">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark/30" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Suche nach Themen..."
              className="w-full pl-10 pr-4 py-2.5 rounded-pill border border-gray-200 bg-white text-sm font-body focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-colors"
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
                ? "bg-teal text-white"
                : "bg-gray-100 text-dark/60 hover:bg-gray-200",
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
                  ? "bg-teal text-white"
                  : "bg-gray-100 text-dark/60 hover:bg-gray-200",
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
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
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
                    <div className={`w-8 h-8 rounded-lg ${group.color} flex items-center justify-center`}>
                      <group.Icon size={16} />
                    </div>
                    <h2 className="font-heading font-semibold text-lg text-dark">{group.label}</h2>
                  </div>
                  <div className="space-y-1">
                    {group.articles.map((article) => (
                      <Link
                        key={article.id}
                        href={`/${locale}/help/${article.slug}`}
                        className="flex items-center justify-between px-4 py-3 rounded-card bg-gray-50 hover:bg-gray-100 transition-colors group"
                      >
                        <span className="font-body text-sm text-dark/80 group-hover:text-dark transition-colors">
                          {article.title}
                        </span>
                        <ChevronRight size={16} className="text-dark/20 group-hover:text-dark/40 transition-colors shrink-0" />
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
