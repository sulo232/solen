"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Testimonials — Component Map §17
 *
 * Design intent: "This section should feel authentic and trustworthy because
 * it's quoting real customers — no fake reviews."
 *
 * - HORIZONTAL CAROUSEL (not vertical stack)
 * - Only renders when ≥3 real reviews exist in DB
 * - Warm white glass cards: rgba(255,255,255,0.65) + blur(14px)
 * - ALL avatars: coral #E8624A with white Syne letter
 * - Stars: 5× SVG 14px, fill coral
 * - Quote: DM Sans 15px/400 italic
 * - Section heading: DM Sans 28px/700 (Pattern A)
 * - Coral label: Syne 12px/700 uppercase
 *
 * P0: DELETE all fake testimonials. Show only from DB.
 * Pre-launch fallback: hide section entirely (render null).
 */

interface ReviewData {
  id: string;
  rating: number;
  comment: string;
  reviewer_name: string;
  city?: string;
  created_at: string;
}

function StarRow({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-0.5" role="img" aria-label={`${count} von 5 Sternen`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i <= count ? "#E8624A" : "#E8E2DC"} aria-hidden="true">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 1) return "heute";
  if (days === 1) return "gestern";
  if (days < 7) return `vor ${days} Tagen`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "vor 1 Woche";
  if (weeks < 5) return `vor ${weeks} Wochen`;
  const months = Math.floor(days / 30);
  if (months === 1) return "vor 1 Monat";
  return `vor ${months} Monaten`;
}

export default function TestimonialCarousel() {
  const t = useTranslations("home");
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Fetch real reviews from DB — homepage only shows 4+ star, max 6
    fetch("/api/reviews/homepage")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.reviews && Array.isArray(data.reviews)) {
          setReviews(data.reviews);
        }
        setLoaded(true);
      })
      .catch((err) => {
        console.error("[TestimonialCarousel] Failed to fetch reviews:", err);
        setLoaded(true);
      });
  }, []);

  // Don't render until loaded; if <3 real reviews, hide entirely
  if (!loaded) return null;
  if (reviews.length < 3) return null;

  return (
    <section
      className="py-8"
      style={{ background: "#FFFFFF" }}
      aria-labelledby="testimonials-heading"
    >
      <div className="px-5 md:px-10 lg:px-20">
        <h2
          id="testimonials-heading"
          className="font-heading font-bold text-s-ink"
          style={{ fontSize: 24, lineHeight: 1.2 }}
        >
          {t("testimonials.title") || "Was unsere Nutzer sagen"}
        </h2>
      </div>

      {/* Horizontal carousel */}
      <div
        className="flex gap-3 overflow-x-auto pb-2 mt-4"
        style={{
          paddingLeft: 20,
          paddingRight: 20,
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {reviews.slice(0, 6).map((review) => (
          <article
            key={review.id}
            className="flex-shrink-0 flex flex-col gap-3 active:scale-[0.99] transition-transform duration-150"
            style={{
              width: 300,
              minWidth: 300,
              maxWidth: 340,
              padding: 20,
              borderRadius: 16,
              background: "#FFFFFF",
              border: "1px solid rgba(26,18,9,0.08)",
              boxShadow: "0 1px 3px rgba(26,18,9,.04)",
              scrollSnapAlign: "start",
            }}
          >
            <StarRow count={review.rating} />

            <p
              className="font-body text-[15px] leading-relaxed flex-1"
              style={{
                color: "#2C2420",
                fontStyle: "italic",
                display: "-webkit-box",
                WebkitLineClamp: 4,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              &ldquo;{review.comment}&rdquo;
            </p>

            {/* Divider */}
            <div style={{ width: "100%", height: 1, background: "#E8E2DC", margin: "12px 0" }} aria-hidden="true" />

            {/* Author — ALL avatars coral */}
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-heading font-semibold text-[14px] text-white"
                style={{ background: "#E8624A" }}
                aria-hidden="true"
              >
                {review.reviewer_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-body font-semibold text-[14px] leading-tight" style={{ color: "#2C2420" }}>
                  {review.reviewer_name}
                </p>
                <p className="font-body text-[12px] leading-tight" style={{ color: "#8C8279" }}>
                  {review.city || "Basel"} · {getTimeAgo(review.created_at)}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
