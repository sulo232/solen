"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, MessageSquare, ArrowRight } from "lucide-react";
import { useLocale } from "next-intl";
import SignatureLockup from "@/components-legacy/ui/SignatureLockup";
import { formatRating } from "@/lib/format";

/**
 * SalonReviewsSummary — Q54 (locked 2026-05-02) salon-detail Reviews tab summary.
 *
 * Renders the LIGHTWEIGHT summary card per Q54 lock:
 *   - Q48 SignatureLockup: tracked-uppercase coral eyebrow `Bewertungen`
 *     + Anton headline = avg-rating + count (e.g. `4.8 · 127`)
 *   - 5-bar distribution chart (5★ → 1★ counts as horizontal bars)
 *   - 3 latest reviews with COLLAPSED reply chips (chip says
 *     `Antwort vom Salon →` if reply exists, expanded view in sub-page)
 *   - "Alle Bewertungen anzeigen →" link routing to /salon/[slug]/reviews
 *
 * NO truncation per Q41 — review text wraps full, never `...`.
 *
 * Distinct from the full SalonReviews component (389L) which lives on the
 * /salon/[slug]/reviews sub-page with filter chips + infinite-scroll +
 * expanded reply threads + photo upload + new-review form.
 */
interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_name?: string | null;
  user_avatar?: string | null;
  reply_text?: string | null;
}

interface SalonReviewsSummaryProps {
  salonSlug: string;
  averageRating: number;
  reviewCount: number;
  /** Distribution counts indexed [5★, 4★, 3★, 2★, 1★] */
  distribution: [number, number, number, number, number];
  /** 3 latest reviews; caller pre-sorts/limits */
  latestReviews: ReviewRow[];
}

export default function SalonReviewsSummary({
  salonSlug,
  averageRating,
  reviewCount,
  distribution,
  latestReviews,
}: SalonReviewsSummaryProps) {
  const locale = useLocale();
  const total = distribution.reduce((a, b) => a + b, 0) || 1;

  return (
    <section
      id="section-bewertungen"
      className="scroll-mt-[100px]"
      aria-label="Bewertungen"
    >
      <SignatureLockup
        eyebrow="Bewertungen"
        headline={`${formatRating(averageRating)} · ${reviewCount.toLocaleString("de-CH")}`}
        size="md"
        as="h2"
      />

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-6">
        {/* 5-bar distribution chart — Q54 per-star color buckets:
              5★ = brand color (post-Q64 brand-green #1B4D1B)
              4-3★ = amber #F3A864
              2-1★ = neutral warm-grey */}
        <div className="space-y-1.5" aria-label="Bewertungsverteilung">
          {[5, 4, 3, 2, 1].map((star, i) => {
            const count = distribution[i];
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            const barColor =
              star === 5 ? "#1B4D1B"
              : star >= 3 ? "#F3A864"
              : "#9F8A7E";
            return (
              <div key={star} className="flex items-center gap-2 font-body text-[11px] text-s-ink/65">
                <span className="w-3 tabular-nums">{star}</span>
                <Star size={11} className="text-s-amber fill-s-amber shrink-0" aria-hidden />
                <div className="flex-1 h-2 rounded-full bg-s-bg-sunken overflow-hidden">
                  <div
                    className="h-full rounded-full transition-[width] duration-500"
                    style={{ width: `${pct}%`, background: barColor }}
                  />
                </div>
                <span className="w-8 text-right tabular-nums text-s-ink/45">{count}</span>
              </div>
            );
          })}
        </div>

        {/* 3 latest reviews — collapsed reply chips */}
        <div className="space-y-4">
          {latestReviews.length === 0 ? (
            <p className="font-body text-[13px] text-s-ink/55 italic">
              Noch keine Bewertungen.
            </p>
          ) : (
            latestReviews.slice(0, 3).map((r) => (
              <article
                key={r.id}
                className="border-l-2 border-s-ink/[0.06] pl-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  {r.user_avatar ? (
                    <Image
                      src={r.user_avatar}
                      alt={r.user_name ?? "Reviewer"}
                      width={20}
                      height={20}
                      className="rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-s-bg-sunken flex items-center justify-center font-body text-[9px] font-bold text-s-ink/55 shrink-0">
                      {(r.user_name ?? "A")[0].toUpperCase()}
                    </span>
                  )}
                  <span className="font-body text-[12px] font-semibold text-s-ink truncate">
                    {r.user_name ?? "Anonym"}
                  </span>
                  <span className="ml-auto inline-flex items-center gap-0.5 shrink-0">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        size={10}
                        className={
                          i <= Math.round(r.rating)
                            ? "text-s-amber fill-s-amber"
                            : "text-s-ink/15"
                        }
                        aria-hidden
                      />
                    ))}
                  </span>
                </div>
                {r.comment && (
                  <p className="font-body text-[13px] leading-[1.5] text-s-ink/80">
                    {r.comment}
                  </p>
                )}
                {r.reply_text && (
                  <Link
                    href={`/${locale}/salon/${salonSlug}/reviews#review-${r.id}`}
                    className="mt-2 inline-flex items-center gap-1 font-body text-[10px] font-bold uppercase tracking-[.14em] text-s-coral-text hover:text-s-coral transition-colors duration-150"
                  >
                    <MessageSquare size={11} aria-hidden />
                    Antwort vom Salon
                    <ArrowRight size={10} aria-hidden />
                  </Link>
                )}
              </article>
            ))
          )}
        </div>
      </div>

      {/* See-all link */}
      {reviewCount > 3 && (
        <div className="mt-6 text-center">
          <Link
            href={`/${locale}/salon/${salonSlug}/reviews`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-s-ink/15 hover:border-s-coral/40 transition-colors duration-150 font-body text-[13px] font-semibold text-s-ink min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-2"
          >
            Alle {reviewCount.toLocaleString("de-CH")} Bewertungen
            <ArrowRight size={14} aria-hidden />
          </Link>
        </div>
      )}
    </section>
  );
}
