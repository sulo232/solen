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
  // Which half to render. Both halves used to render from every instance (a bare fragment of
  // mobileChips + desktopTree), which starved the results column to zero width below md: the
  // tree is hidden there but the chips are not, so a first CategoryTree call meant only to supply
  // the desktop tree also dumped a live 326px chip row into the flex layout, measured leaving 20
  // salon cards at width 0. Pick exactly one half per call site, never both.
  variant?: "tree" | "chips";
}

export default function CategoryTree({ activeSlug, variant = "tree" }: CategoryTreeProps) {
  const locale = useLocale();
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/categories")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (cancelled) return;
        if (!d) { setLoading(false); return; }
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
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
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
          // mockup-ok: WCAG 2.2.2 conformance, mount-load skeleton bounded (tailwind.config.js pulse-bounded)
          <div key={i} className="h-8 bg-s-bg-sunken rounded animate-pulse-bounded" />
        ))}
      </div>
    );
  }

  // ─── Mobile: horizontal scrollable chips (level 1 only) ───
  const mobileChips = (
    <div className="md:hidden flex gap-2 overflow-x-auto scrollbar-hide pb-2">
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/${locale}/behandlungen/${cat.slug}`}
          className={[
            "px-3 py-1.5 rounded-pill text-xs font-body font-medium whitespace-nowrap transition-colors duration-150 border flex items-center shrink-0",
            activeSlug === cat.slug
              ? "bg-s-ink text-white border-s-accent"
              : "bg-white/70 backdrop-blur-sm text-s-ink/70 border-white/60 hover:border-s-accent/50",
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
            "flex items-center gap-1.5 py-1.5 px-2 rounded-btn text-sm font-body transition-colors cursor-pointer",
            isActive
              ? "bg-s-ink/10 text-s-accent font-medium"
              : "text-s-ink/70 hover:bg-s-bg-surface:bg-white/5",
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
      <h3 className="font-heading text-sm text-s-ink mb-3 px-2">
        Kategorien
      </h3>
      <nav className="space-y-0.5 max-h-[calc(100vh-8rem)] overflow-y-auto">
        {categories.map((cat) => renderNode(cat))}
      </nav>
    </div>
  );

  return variant === "chips" ? mobileChips : desktopTree;
}
