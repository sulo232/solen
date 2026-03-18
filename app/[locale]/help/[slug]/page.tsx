"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { useParams } from "next/navigation";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";

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
  const params = useParams();
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
    return (
      <div className="min-h-screen bg-white flex justify-center items-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="min-h-screen bg-white pt-24 px-4">
        <div className="max-w-3xl mx-auto">
          <EmptyState
            icon={BookOpen}
            title="Artikel nicht gefunden"
            message="Dieser Hilfe-Artikel existiert nicht oder wurde entfernt."
            action={
              <Link
                href={`/${locale}/help`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-button bg-teal text-white text-sm font-body font-medium hover:bg-teal-dark transition-colors"
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-12">
        {/* Back link */}
        <Link
          href={`/${locale}/help`}
          className="inline-flex items-center gap-1.5 text-sm font-body text-dark/40 hover:text-dark/70 transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Zurück zur Hilfe
        </Link>

        {/* Article */}
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-dark mb-2">
          {article.title}
        </h1>
        <p className="text-xs font-body text-dark/30 mb-8">
          Aktualisiert: {new Date(article.updated_at).toLocaleDateString("de-CH")}
        </p>

        {/* Markdown-like content rendering */}
        <div className="prose prose-sm max-w-none font-body text-dark/80 leading-relaxed">
          {article.content.split("\n").map((line, i) => {
            if (line.startsWith("## ")) {
              return <h2 key={i} className="font-heading font-semibold text-lg text-dark mt-6 mb-2">{line.slice(3)}</h2>;
            }
            if (line.startsWith("### ")) {
              return <h3 key={i} className="font-heading font-semibold text-base text-dark mt-4 mb-1">{line.slice(4)}</h3>;
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
