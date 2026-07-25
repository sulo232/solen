"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { useParams } from "next/navigation";
import { Skeleton } from "@/app/[locale]/_components/primitives";
import EmptyState from "@/components-legacy/ui/EmptyState";

type HelpArticle = {
  id: string;
  slug: string;
  title: string;
  content: string;
  category: string;
  locale: string;
  updated_at: string;
};

export default function HelpArticlePage() {
  const locale = useLocale();
  const params = useParams()!;
  const slug = params.slug as string;
  const [article, setArticle] = useState<HelpArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/help/${slug}?locale=${locale}`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then((data) => {
        if (data?.article) setArticle(data.article);
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [slug, locale]);

  if (loading) {
    // mockup-ok: MOCKUP_QUEUE.md item 6, shaped Skeleton (title + meta line + paragraph
    // lines, matches the real article layout below) replaces the ad-hoc centered Spinner.
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-12">
          <Skeleton height={32} width="70%" rounded={4} className="mb-3" />
          <Skeleton height={14} width={140} rounded={4} className="mb-8" />
          <div className="space-y-2">
            <Skeleton height={14} width="100%" rounded={4} />
            <Skeleton height={14} width="95%" rounded={4} />
            <Skeleton height={14} width="88%" rounded={4} />
            <Skeleton height={14} width="60%" rounded={4} />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="min-h-screen bg-white pt-8 px-4">
        {/* V3-D306: retired s-coral CTA → bg-s-ink primary CTA (LOCKFILE §0 rule 2 — primary CTA stays ink) */}
        <div className="max-w-3xl mx-auto">
          <EmptyState
            icon={BookOpen}
            title="Artikel nicht gefunden"
            message="Dieser Hilfe-Artikel existiert nicht oder wurde entfernt."
            action={
              <Link
                href={`/${locale}/help`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-btn bg-s-ink text-white text-sm font-body font-medium hover:brightness-110 transition-[filter] duration-200"
              >
                Zurück zur Hilfe
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* V3-D306: arbitrary s-ink/X opacities → canonical s-ink-2; H1 normalized to Page H2 spec; H2/H3 weighted per LOCKFILE §2 */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-12">
        {/* Article */}
        <h1 className="font-display text-2xl sm:text-[40px] font-semibold tracking-tight text-s-ink leading-[1.05] mb-2">
          {article.title}
        </h1>
        <p className="text-xs font-body text-s-ink-2 mb-8">
          Aktualisiert: {new Date(article.updated_at).toLocaleDateString("de-CH")}
        </p>

        {/* Markdown-like content rendering */}
        <div className="prose prose-sm max-w-none font-body text-s-ink leading-relaxed">
          {article.content.split("\n").map((line, i) => {
            if (line.startsWith("## ")) {
              return <h2 key={i} className="font-display text-xl font-semibold tracking-tight text-s-ink mt-6 mb-2">{line.slice(3)}</h2>;
            }
            if (line.startsWith("### ")) {
              return <h3 key={i} className="font-display text-lg font-semibold text-s-ink mt-4 mb-1">{line.slice(4)}</h3>;
            }
            if (line.startsWith("- ")) {
              return <li key={i} className="ml-4 list-disc">{line.slice(2)}</li>;
            }
            if (line.trim() === "") {
              return <br key={i} />;
            }
            return <p key={i} className="mb-2">{line}</p>;
          })}
        </div>
      </div>
    </div>
  );
}
