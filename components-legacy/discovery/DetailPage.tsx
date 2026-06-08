"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown, ExternalLink, Play } from "lucide-react";
import type { DiscoveryItem } from "@/lib/types";
import SourceBadge from "./SourceBadge";
import LikeButton from "./LikeButton";
import { formatCreator } from "./format";
import DescriptionCard from "./DescriptionCard";
import SalonScript from "./SalonScript";
import ProductRecommendations from "./ProductRecommendations";
import BookCTA from "./BookCTA";
import ShareButton from "./ShareButton";
import CommentSection from "./CommentSection";
import SimilarStyles from "./SimilarStyles";
import RelatedTikToks from "./RelatedTikToks";
import PickStylistFlow from "./PickStylistFlow";

interface DetailPageProps {
  item: DiscoveryItem;
  locale: string;
  isAuthenticated: boolean;
}


function formatDate(dateStr: string, locale: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(locale === "de" ? "de-CH" : locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

const DL: Record<string, { back: string; cutGuide: string; noMedia: string }> = {
  de: { back: "Zurück", cutGuide: "Technische Schnittanleitung", noMedia: "Kein Medium" },
  en: { back: "Back", cutGuide: "Technical cut guide", noMedia: "No media" },
  fr: { back: "Retour", cutGuide: "Guide de coupe technique", noMedia: "Aucun média" },
  it: { back: "Indietro", cutGuide: "Guida tecnica al taglio", noMedia: "Nessun media" },
};

export default function DetailPage({ item, locale, isAuthenticated }: DetailPageProps) {
  // V3-D390: heart-only save concept (SaveButton removed); hero routes through the refresh proxy.
  const [showCutGuide, setShowCutGuide] = useState(false);
  const dt = DL[locale] ?? DL.en;
  // Consider it a video if media_type is tiktok OR if tiktok data exists
  const isVideo = item.media_type === "tiktok" || !!item.tiktok_url || !!item.tiktok_embed_html;
  const displayImage = item.image_url || item.tiktok_thumbnail_url;
  // V3-D390: TikTok thumbnails expire → route the hero through the /api/discovery/thumb refresh proxy (same as the
  // feed cards) so the detail hero isn't a blank grey box.
  const heroSrc = item.tiktok_url ? `/api/discovery/thumb/${item.id}` : displayImage;
  const creator = formatCreator(item.author_name);

  return (
    <div className="max-w-5xl mx-auto pb-24">
      {/* V3-D346 Pass-2 (2026-05-29): own back button removed — global Breadcrumb already
          provides a mobile back button + the desktop trail (was a duplicate "Zurück" on mobile). */}
      {/* V3-D346 (Move 3): 2-column on desktop — sticky hero left, content right; single column on mobile. */}
      <div className="md:grid md:grid-cols-2 md:gap-8 md:items-start">
      {/* ═══ Left column: Hero Media (sticky on desktop) ═══ */}
      <div className="md:sticky md:top-20">
      {/* ═══ Section 1: Hero Media ═══ */}
      {/* V3-D390: was a framer-motion entrance that stranded the hero at opacity:0 on mount (invisible even though the
          image loaded). Plain div — always visible. */}
      <div className="relative rounded-[16px] overflow-hidden bg-s-ink">
        {isVideo && heroSrc ? (
          <div className="relative w-full aspect-[9/16] max-h-[80vh] bg-s-ink">
            <Image
              src={heroSrc}
              alt={item.alt_text || item.style_name || "TikTok"}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 480px"
              priority
            />
            {/* TikTok play overlay — opens in new tab instead of embedding (avoids GDPR cookie wall) */}
            {item.tiktok_url && (
              <a
                href={item.tiktok_url}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-s-ink/30 hover:bg-s-ink/40 transition-colors duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                  <Play size={22} className="text-white ml-1" fill="white" />
                </div>
                <span className="flex items-center gap-1.5 text-white text-xs font-heading bg-s-ink/50 backdrop-blur-sm px-3 py-1.5 rounded-pill">
                  <ExternalLink size={12} />
                  Auf TikTok ansehen
                </span>
              </a>
            )}
          </div>
        ) : heroSrc ? (
          <div className="relative aspect-[3/4] max-h-[70vh]">
            <Image
              src={heroSrc}
              alt={item.alt_text || item.style_name || "Discovery item"}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 480px"
              priority
            />
          </div>
        ) : (
          <div className="aspect-[3/4] flex items-center justify-center text-s-ink/20">
            {dt.noMedia}
          </div>
        )}
      </div>
      </div>{/* /left column */}

      {/* ═══ Right column: all detail content ═══ */}
      <div className="min-w-0">

      {/* Source + Author + Date */}
      <div className="flex items-center gap-2 mt-3 px-1">
        <SourceBadge contentType={
          (item.tiktok_url || item.tiktok_embed_html || item.media_type === "tiktok")
            ? "tiktok"
            : item.content_type
        } />
        {/* V3-D390: same junk-handle filter as the feed cards (formatCreator) — a scraped "@☆" reads as broken. */}
        {creator && (
          <span className="text-xs text-s-ink-2">
            {item.author_url ? (
              <a href={item.author_url} target="_blank" rel="noopener noreferrer" className="hover:text-s-ink transition-colors">@{creator}</a>
            ) : `@${creator}`}
          </span>
        )}
        <span className="text-xs text-s-ink/30">{formatDate(item.created_at, locale)}</span>
      </div>

      {/* ═══ Section 2: Actions Bar ═══ */}
      <div className="flex items-center justify-between mt-3 px-1">
        <div className="flex items-center gap-4">
          {/* V3-D390: heart only (no bookmark — Solen has a single save concept). Bare variant for the light toolbar. */}
          <LikeButton itemId={item.id} initialLiked={false} isAuthenticated={isAuthenticated} variant="bare" />
        </div>
        <ShareButton item={item} />
      </div>

      {/* ═══ Section 3: Title + Tags ═══ */}
      <div className="mt-4 px-1">
        {item.style_name && (
          <h1 className="text-xl font-heading font-semibold tracking-[-0.01em] text-s-ink">{item.style_name}</h1>
        )}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {/* V3-D390: cap to 6 — the raw 14-tag cloud read cluttered. */}
            {item.tags.slice(0, 6).map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-pill bg-s-ink/5 text-s-ink-2">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ═══ Section 4: AI Description ═══ */}
      <DescriptionCard item={item} locale={locale} />

      {/* ═══ Section 5: Salon Script ═══ */}
      <div className="mt-4 px-1">
        <SalonScript item={item} locale={locale} />
      </div>

      {/* ═══ Section 6: Product Recommendations ═══ */}
      <ProductRecommendations products={item.products_needed ?? []} locale={locale} />

      {/* ═══ Section 7: Booking CTA ═══ */}
      <BookCTA item={item} locale={locale} />

      {/* Pick a stylist (for salon-linked items) */}
      {item.owner_salon_id && (
        <div className="mt-4 px-1">
          <PickStylistFlow
            salonId={item.owner_salon_id}
            salonSlug={item.owner_salon_id}
            locale={locale}
            onSelect={(staffId) => {
              const route = item.category === "beard" ? "barbershop" : item.category === "nails" ? "nails" : "coiffeur";
              window.location.href = `/${locale}/${route}?staff=${staffId ?? ""}`;
            }}
          />
        </div>
      )}

      {/* ═══ Section 8: Similar Styles ═══ */}
      <SimilarStyles itemId={item.id} category={item.category} tags={item.tags} isAuthenticated={isAuthenticated} />

      {/* ═══ Section 9: Related TikToks ═══ */}
      <RelatedTikToks itemId={item.id} isCurrentTikTok={item.media_type === "tiktok"} />

      {/* ═══ Section 10: Technical Cut Guide (collapsible) ═══ */}
      {item.cut_guide && (
        <div className="mt-6 px-1">
          <button
            onClick={() => setShowCutGuide(!showCutGuide)}
            className="flex items-center gap-1.5 text-xs text-s-ink/40 hover:text-s-ink transition-colors"
          >
            <ChevronDown size={14} className={`transition-transform ${showCutGuide ? "rotate-180" : ""}`} />
            {dt.cutGuide}
          </button>
          {showCutGuide && (
            <div className="mt-2 p-4 rounded-[16px] bg-s-bg-surface border border-s-ink/5">
              <p className="text-xs text-s-ink-2 font-mono leading-relaxed whitespace-pre-line">
                {item.cut_guide}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ═══ Section 11: Comments ═══ */}
      <div className="mt-6 px-1">
        <CommentSection itemId={item.id} isAuthenticated={isAuthenticated} />
      </div>
      </div>{/* /right column */}
      </div>{/* /grid */}
    </div>
  );
}
