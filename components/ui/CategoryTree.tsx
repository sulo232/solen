"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { ChevronDown, ChevronRight } from "lucide-react";

interface Category {
  id: string;
  name_de: string;
  name_en: string | null;
  slug: string;
  parent_id: string | null;
  icon_name: string | null;
  sort_order: number;
  level: number;
  children?: Category[];
}

interface CategoryTreeProps {
  activeSlug?: string;
}

export default function CategoryTree({ activeSlug }: CategoryTreeProps) {
  const locale = useLocale();
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => {
        setCategories(d.items ?? []);
        setLoading(false);
        // Auto-expand parent of active slug
        if (activeSlug && d.flat) {
          const active = d.flat.find((c: Category) => c.slug === activeSlug);
          if (active?.parent_id) {
            const parent = d.flat.find((c: Category) => c.id === active.parent_id);
            setExpandedIds(new Set([active.parent_id, ...(parent?.parent_id ? [parent.parent_id] : [])]));
          }
        }
      })
      .catch(() => setLoading(false));
  }, [activeSlug]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getName = (cat: Category) => (locale === "de" ? cat.name_de : cat.name_en ?? cat.name_de);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 bg-s-bg-sunken dark:bg-white/5 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  // ─── Mobile: horizontal scrollable chips (level 1 only) ───
  const mobileChips = (
    <div className="md:hidden flex gap-2 overflow-x-auto no-scrollbar pb-2">
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/${locale}/behandlungen/${cat.slug}`}
          className={[
            "px-3 py-1.5 rounded-pill text-xs font-body font-medium whitespace-nowrap transition-all duration-200 border flex items-center shrink-0",
            activeSlug === cat.slug
              ? "bg-s-coral text-white border-s-coral"
              : "bg-white/70 dark:bg-s-dm-surface backdrop-blur-sm text-dark/70 dark:text-s-dm-text/70 border-white/60 dark:border-white/10 hover:border-s-coral/50",
          ].join(" ")}
        >
          {getName(cat)}
        </Link>
      ))}
    </div>
  );

  // ─── Desktop: collapsible tree sidebar ───
  const renderNode = (cat: Category, depth: number = 0) => {
    const hasChildren = cat.children && cat.children.length > 0;
    const isExpanded = expandedIds.has(cat.id);
    const isActive = activeSlug === cat.slug;

    return (
      <div key={cat.id}>
        <div
          className={[
            "flex items-center gap-1.5 py-1.5 px-2 rounded-lg text-sm font-body transition-colors cursor-pointer",
            isActive
              ? "bg-s-coral/10 text-s-coral font-medium"
              : "text-dark/70 dark:text-s-dm-text/70 hover:bg-s-bg-surface dark:hover:bg-white/5",
          ].join(" ")}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {hasChildren ? (
            <button
              onClick={(e) => { e.preventDefault(); toggleExpand(cat.id); }}
              className="p-0.5 shrink-0"
            >
              {isExpanded
                ? <ChevronDown className="w-3.5 h-3.5" />
                : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <span className="w-4" />
          )}
          <Link
            href={`/${locale}/behandlungen/${cat.slug}`}
            className="flex-1 truncate"
          >
            {getName(cat)}
          </Link>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {cat.children!.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const desktopTree = (
    <div className="hidden md:block sticky top-24 w-56 shrink-0">
      <h3 className="font-heading font-semibold text-sm text-dark dark:text-s-dm-text mb-3 px-2">
        Kategorien
      </h3>
      <nav className="space-y-0.5 max-h-[calc(100vh-8rem)] overflow-y-auto">
        {categories.map((cat) => renderNode(cat))}
      </nav>
    </div>
  );

  return (
    <>
      {mobileChips}
      {desktopTree}
    </>
  );
}
