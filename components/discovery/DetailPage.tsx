"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowLeft, ChevronDown, ExternalLink, Play } from "lucide-react";
import { motion } from "framer-motion";
import type { DiscoveryItem } from "@/lib/types";
import SourceBadge from "./SourceBadge";
import LikeButton from "./LikeButton";
import SaveButton from "./SaveButton";
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
  const [showCutGuide, setShowCutGuide] = useState(false);
  const dt = DL[locale] ?? DL.en;
  // Consider it a video if media_type is tiktok OR if tiktok data exists
  const isVideo = item.media_type === "tiktok" || !!item.tiktok_url || !!item.tiktok_embed_html;
  const displayImage = item.image_url || item.tiktok_thumbnail_url;

  return (
    <div className="max-w-2xl mx-auto pb-24">
      {/* Back button */}
      <button
        onClick={() => window.history.back()}
        className="flex items-center gap-1.5 text-sm text-s-ink/50 hover:text-s-ink mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        <span>{dt.back}</span>
      </button>

      {/* ═══ Section 1: Hero Media ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="relative rounded-[16px] overflow-hidden bg-s-ink"
      >
        {isVideo && (item.tiktok_thumbnail_url || displayImage) ? (
          <div className="relative w-full aspect-[9/16] max-h-[80vh] bg-s-ink">
            <Image
              src={item.tiktok_thumbnail_url || displayImage!}
              alt={item.alt_text || item.style_name || "TikTok"}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 672px"
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
                <span className="flex items-center gap-1.5 text-white text-xs font-heading font-semibold bg-s-ink/50 backdrop-blur-sm px-3 py-1.5 rounded-pill">
                  <ExternalLink size={12} />
                  Auf TikTok ansehen
                </span>
              </a>
            )}
          </div>
        ) : displayImage ? (
          <div className="relative aspect-[3/4] max-h-[70vh]">
            <Image
              src={displayImage}
              alt={item.alt_text || item.style_name || "Discovery item"}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 672px"
              priority
            />
          </div>
        ) : (
          <div className="aspect-[3/4] flex items-center justify-center text-s-ink/20">
            {dt.noMedia}
          </div>
        )}
      </motion.div>

      {/* Source + Author + Date */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        className="flex items-center gap-2 mt-3 px-1"
      >
        <SourceBadge contentType={
          (item.tiktok_url || item.tiktok_embed_html || item.media_type === "tiktok")
            ? "tiktok"
            : item.content_type
        } />
        {item.author_name && (
          <span className="text-xs text-s-ink/50">
            {item.author_url ? (
              <a href={item.author_url} target="_blank" rel="noopener noreferrer" className="hover:text-s-coral transition-colors">@{item.author_name}</a>
            ) : `@${item.author_name}`}
          </span>
        )}
        <span className="text-xs text-s-ink/30">{formatDate(item.created_at, locale)}</span>
      </motion.div>

      {/* ═══ Section 2: Actions Bar ═══ */}
      <div className="flex items-center justify-between mt-3 px-1">
        <div className="flex items-center gap-4">
          <LikeButton itemId={item.id} initialLiked={false} initialCount={item.like_count} isAuthenticated={isAuthenticated} />
          <SaveButton itemId={item.id} initialSaved={false} isAuthenticated={isAuthenticated} />
        </div>
        <ShareButton item={item} />
      </div>

      {/* ═══ Section 3: Title + Tags ═══ */}
      <div className="mt-4 px-1">
        {item.style_name && (
          <h1 className="text-xl font-heading font-bold text-s-ink">{item.style_name}</h1>
        )}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {item.tags.map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-pill bg-s-ink/5 text-s-ink/60">
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
      <SimilarStyles itemId={item.id} category={item.category} tags={item.tags} />

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
              <p className="text-xs text-s-ink/60 font-mono leading-relaxed whitespace-pre-line">
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
    </div>
  );
}
