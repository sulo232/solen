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
 * - Warm white glass cards: rgba(255,255,255,0.65) + blur(14px) per §6
 * - ALL avatars: coral #1B4D1B circle with white Anton uppercase letter
 * - Stars: 5× SVG 14px, fill amber #F3A864 per Q43 + SOLEN_UI #5b
 * - Quote: Figtree 15px/400 italic per Q24 voice
 * - Section heading: Anton uppercase per Q48
 * - Coral label: Figtree 11px/700 .22em uppercase per Q48 eyebrow
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
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i <= count ? "#F3A864" : "#EFE7DD"} aria-hidden="true">
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

  // C6 LOCKED 2026-05-03: refit to match reference REVIEWS section
  // (public/solen-coral.html:995-1029 + 296-309). 3-column GRID (not carousel),
  // category-rotating avatars (coral / blue / sage), tighter typography.
  // Avatar palette per ref :1004,1011,1018 — these are visual variety
  // accents, NOT brand-restricted; semantic distinction per SOLEN_UI #5b.
  const AVATAR_BG = ["#1B4D1B", "#6BA3C8", "#7BA688"]; // brand-green / blue / sage
  return (
    <section
      className="px-5 md:px-10 lg:px-20 py-16 md:py-20"
      style={{ background: "#FAF7F3" }} // var(--sur) sunken surface per ref :296
      aria-labelledby="testimonials-heading"
    >
      <div className="max-w-[1200px] mx-auto">
        {/* Eyebrow + headline per ref :999-1000 */}
        <span
          className="block font-body font-bold uppercase mb-3"
          style={{ color: "#F3A864", fontSize: 11, letterSpacing: ".22em" }}
        >
          Bewertungen
        </span>
        <h2
          id="testimonials-heading"
          className="font-heading text-s-ink uppercase mb-7"
          style={{ fontSize: "clamp(28px, 4vw, 48px)", letterSpacing: "0.01em", lineHeight: 1.05 }}
        >
          Was Basel sagt
        </h2>

        {/* 3-col grid per ref :297, single col mobile per ref :394, gap 18px */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[18px]">
          {reviews.slice(0, 3).map((review, idx) => (
            <article
              key={review.id}
              className="flex flex-col transition-[border-color,transform] duration-[250ms] ease-out hover:border-s-coral/40 hover:-translate-y-0.5"
              style={{
                background: "#FFFFFF",
                border: "1px solid rgba(26,18,9,0.08)",
                borderRadius: 20,
                padding: "22px 20px",
              }}
            >
              {/* Stars — amber per ref :304 (already amber in StarRow component).
                  10px gap below stars per ref `.rev-stars{margin-bottom:10px}`. */}
              <div className="mb-2.5">
                <StarRow count={review.rating} />
              </div>

              {/* Quote — Figtree italic 14px ink-2 per ref :305 */}
              <p
                className="font-body italic mb-3.5"
                style={{ fontSize: 14, color: "#56463E", lineHeight: 1.8 }}
              >
                &ldquo;{review.comment}&rdquo;
              </p>

              {/* Author row — gap 10px per ref :306 */}
              <div className="flex items-center" style={{ gap: 10 }}>
                {/* Avatar — 32px circle, category-rotating bg per ref :307 + the 3 ref examples */}
                <div
                  className="rounded-full flex items-center justify-center flex-shrink-0 font-body font-bold text-white"
                  style={{
                    width: 32,
                    height: 32,
                    background: AVATAR_BG[idx % AVATAR_BG.length],
                    fontSize: 12,
                  }}
                  aria-hidden
                >
                  {review.reviewer_name.charAt(0).toUpperCase()}
                  {(review.reviewer_name.split(/\s+/)[1] || "").charAt(0).toUpperCase()}
                </div>
                <div>
                  {/* Name — Figtree 700 12px ink per ref :308 */}
                  <div className="font-body font-bold leading-tight" style={{ fontSize: 12, color: "#1A1209" }}>
                    {review.reviewer_name}
                  </div>
                  {/* Location — 11px ink-3 per ref :309 */}
                  <div className="font-body leading-tight mt-0.5" style={{ fontSize: 11, color: "#9F8A7E" }}>
                    {review.city || "Basel"} · {getTimeAgo(review.created_at)}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
