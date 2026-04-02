"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { motion } from "framer-motion";

interface FeaturedReview {
  id: string;
  rating: number;
  comment: string;
  reviewer_name: string;
  salon_name: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const COLORS = ["bg-s-coral", "bg-s-blue", "bg-s-sage", "bg-s-plum", "bg-s-amber", "bg-s-sand"];

export default function ReviewCarousel() {
  const [reviews, setReviews] = useState<FeaturedReview[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/reviews/featured")
      .then((r) => r.json())
      .then((d) => setReviews(d.items ?? []))
      .catch((err) => console.error("[ReviewCarousel] failed to fetch featured reviews:", err))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) {
    return (
      <section className="py-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="h-6 w-48 bg-s-bg-sunken dark:bg-white/10 rounded-btn animate-pulse mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="border border-s-ink/[0.06] dark:border-white/[0.06] rounded-[12px] p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-s-bg-sunken dark:bg-white/10 animate-pulse" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 w-24 bg-s-bg-sunken dark:bg-white/10 rounded animate-pulse" />
                    <div className="h-3 w-16 bg-s-bg-sunken dark:bg-white/10 rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-3 w-20 bg-s-bg-sunken dark:bg-white/10 rounded animate-pulse" />
                <div className="space-y-1.5">
                  <div className="h-3 w-full bg-s-bg-sunken dark:bg-white/10 rounded animate-pulse" />
                  <div className="h-3 w-3/4 bg-s-bg-sunken dark:bg-white/10 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (reviews.length === 0) return null;

  return (
    <section className="py-10">
      <div className="max-w-5xl mx-auto px-4">
        <div className="mb-6">
          <span className="block font-heading font-bold text-[11px] uppercase tracking-[.22em] text-s-amber mb-2">
            Bewertungen
          </span>
          <h2 className="font-heading font-extrabold text-s-ink dark:text-s-dm-text"
            style={{ fontSize: "clamp(26px, 3.5vw, 44px)", letterSpacing: "-0.02em" }}>
            Was Basler:innen sagen
          </h2>
          <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 mt-1 font-body">
            Echte Bewertungen von echten Kund:innen
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-4">
          {reviews.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.1 }}
              className="rounded-[20px] p-5 border border-s-ink/[0.06] dark:border-white/[0.06] hover:-translate-y-[5px] transition-[transform] duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-full ${COLORS[i % COLORS.length]} flex items-center justify-center text-white text-xs font-bold`}>
                  {getInitials(review.reviewer_name)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-s-ink dark:text-s-dm-text truncate">{review.reviewer_name}</p>
                  <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 truncate">{review.salon_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-0.5 mb-2">
                {Array.from({ length: review.rating }).map((_, j) => (
                  <Star key={j} size={12} className="fill-s-coral text-s-coral" />
                ))}
              </div>
              <p className="text-sm text-s-ink/70 dark:text-s-dm-text/70 font-body leading-relaxed line-clamp-3">
                &ldquo;{review.comment}&rdquo;
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
