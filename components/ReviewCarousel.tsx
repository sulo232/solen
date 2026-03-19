"use client";

import { useEffect, useState, useRef } from "react";
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

const COLORS = ["bg-s-coral", "bg-s-coral", "bg-purple-500", "bg-blue-500", "bg-amber-500", "bg-rose-500"];

export default function ReviewCarousel() {
  const [reviews, setReviews] = useState<FeaturedReview[]>([]);

  useEffect(() => {
    fetch("/api/reviews/featured")
      .then((r) => r.json())
      .then((d) => setReviews(d.items ?? []))
      .catch(() => {});
  }, []);

  if (reviews.length === 0) return null;

  return (
    <section className="py-10">
      <div className="max-w-5xl mx-auto px-4">
        <div className="mb-6">
          <h2 className="font-heading font-bold text-2xl text-dark">
            Was Basler:innen sagen
          </h2>
          <p className="text-sm text-dark/50 mt-1 font-body">
            Echte Bewertungen von echten Kund:innen
          </p>
        </div>

        <div
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 md:grid md:grid-cols-3 md:overflow-visible md:snap-none md:mx-0 md:px-0 md:pb-0"
          style={{ scrollbarWidth: "none" } as React.CSSProperties}
        >
          {reviews.slice(0, 3).map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.1 }}
              className="snap-start shrink-0 w-[280px] md:w-auto bg-white/80 backdrop-blur-sm border border-s-ink/5 rounded-card p-5 hover:shadow-card transition-shadow"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-full ${COLORS[i % COLORS.length]} flex items-center justify-center text-white text-xs font-bold`}>
                  {getInitials(review.reviewer_name)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-dark truncate">{review.reviewer_name}</p>
                  <p className="text-xs text-dark/40 truncate">{review.salon_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-0.5 mb-2">
                {Array.from({ length: review.rating }).map((_, j) => (
                  <Star key={j} size={12} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-dark/70 font-body leading-relaxed line-clamp-3">
                &ldquo;{review.comment}&rdquo;
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
