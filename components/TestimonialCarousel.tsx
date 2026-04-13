"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";

/**
 * TestimonialCarousel — Fresha-inspired reviews section
 *
 * Modern horizontal scroll carousel with clean cards
 */

interface ReviewData {
  id: string;
  rating: number;
  comment: string;
  reviewer_name: string;
  city?: string;
  created_at: string;
}

function StarRating({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i <= count ? "fill-[#FFC107] text-[#FFC107]" : "fill-[#E8E8E8] text-[#E8E8E8]"}`}
        />
      ))}
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 1) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "1 week ago";
  if (weeks < 5) return `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return "1 month ago";
  return `${months} months ago`;
}

export default function TestimonialCarousel() {
  const t = useTranslations("home");
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loaded, setLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -360 : 360;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (!loaded) return null;
  if (reviews.length < 3) return null;

  return (
    <div className="relative">
      {/* Navigation buttons */}
      <div className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10">
        <button
          onClick={() => scroll("left")}
          className="w-10 h-10 bg-white rounded-full border border-[#E8E8E8] shadow-md flex items-center justify-center hover:scale-105 hover:shadow-lg transition-all"
          aria-label="Previous reviews"
        >
          <ChevronLeft className="w-5 h-5 text-[#101010]" />
        </button>
      </div>
      <div className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10">
        <button
          onClick={() => scroll("right")}
          className="w-10 h-10 bg-white rounded-full border border-[#E8E8E8] shadow-md flex items-center justify-center hover:scale-105 hover:shadow-lg transition-all"
          aria-label="Next reviews"
        >
          <ChevronRight className="w-5 h-5 text-[#101010]" />
        </button>
      </div>

      {/* Reviews carousel */}
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 snap-x snap-mandatory"
        style={{ scrollbarWidth: "none" }}
      >
        {reviews.slice(0, 8).map((review) => (
          <article
            key={review.id}
            className="flex-shrink-0 w-[320px] md:w-[340px] snap-start bg-white rounded-2xl border border-[#E8E8E8] p-6 flex flex-col"
          >
            {/* Rating */}
            <StarRating count={review.rating} />

            {/* Quote icon */}
            <Quote className="w-8 h-8 text-[#E8E8E8] mt-4 mb-2" />

            {/* Comment */}
            <p className="text-[#101010] text-base leading-relaxed flex-1 line-clamp-4">
              {review.comment}
            </p>

            {/* Divider */}
            <div className="w-full h-px bg-[#E8E8E8] my-4" />

            {/* Author */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#101010] flex items-center justify-center text-white font-semibold text-sm">
                {review.reviewer_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-[#101010] text-sm">
                  {review.reviewer_name}
                </p>
                <p className="text-xs text-[#717171]">
                  {review.city || "Basel"} · {getTimeAgo(review.created_at)}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
