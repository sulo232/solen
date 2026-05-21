"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Star, X } from "lucide-react";
import Spinner from "@/components-legacy/ui/Spinner";
import { motion } from "framer-motion";

interface SubRatingRowProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
}

function SubRatingRow({ label, value, onChange }: SubRatingRowProps) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-s-ink/70 w-28 shrink-0">{label}</span>
      <div className="flex gap-0.5" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHover(star)}
            onClick={() => onChange(value === star ? 0 : star)}
            className="p-0.5 focus:outline-none transition-[transform] duration-150 hover:scale-110"
          >
            <Star
              size={20}
              strokeWidth={1.5}
              className={(hover || value) >= star
                ? "fill-s-amber text-s-amber"
                : "text-s-ink/20"}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

interface ReviewFormProps {
  salonId: string;
  bookingId: string;
  onSuccess: () => void;
  onClose: () => void;
}

type SubRatings = {
  score_ergebnis: number;
  score_atmosphaere: number;
  score_preis_leistung: number;
};

export default function ReviewForm({ salonId, bookingId, onSuccess, onClose }: ReviewFormProps) {
  const t = useTranslations("reviews") as any;
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subRatings, setSubRatings] = useState<SubRatings>({
    score_ergebnis: 0,
    score_atmosphaere: 0,
    score_preis_leistung: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError(t("please_select_rating"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: bookingId,
          rating,
          comment: comment.trim() || undefined,
          ...(subRatings.score_ergebnis > 0 && { score_ergebnis: subRatings.score_ergebnis }),
          ...(subRatings.score_atmosphaere > 0 && { score_atmosphaere: subRatings.score_atmosphaere }),
          ...(subRatings.score_preis_leistung > 0 && { score_preis_leistung: subRatings.score_preis_leistung }),
        }),
      });

      let resData;
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.error || t("error_saving"));
      } else {
        resData = await res.json();
      }

      // Upload photos if any
      if (photos.length > 0 && resData?.data?.id) {
        setUploadProgress(t("uploading"));
        const formData = new FormData();
        photos.forEach(p => formData.append("photos", p));
        
        await fetch(`/api/reviews/${resData.data.id}/photos`, {
          method: "POST",
          body: formData,
        });
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-s-ink/40 backdrop-blur-sm px-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="bg-white rounded-[12px] shadow-warm-lg w-full max-w-md p-6 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-s-ink/40 hover:text-s-ink transition-colors"
        >
          <X size={20} />
        </button>

        <h3 className="font-heading text-xl text-s-ink mb-1">
          {t("title")}
        </h3>
        <p className="text-sm text-s-ink/50 mb-6">
          {t("subtitle")}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star Rating */}
          <div className="flex flex-col items-center gap-2">
            <div
              role="radiogroup"
              aria-label={t("rating")}
              className="flex gap-1"
              onMouseLeave={() => setHoverRating(0)}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  role="radio"
                  aria-checked={rating === star}
                  aria-label={`${star} ${star === 1 ? "star" : "stars"}`}
                  onMouseEnter={() => setHoverRating(star)}
                  onClick={() => setRating(star)}
                  className="p-1 focus:outline-none transition-[transform] duration-150 hover:scale-110"
                >
                  <Star
                    size={36}
                    strokeWidth={1.5}
                    className={(hoverRating || rating) >= star
                      ? "fill-s-amber text-s-amber"
                      : "text-s-ink/20"}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-s-ink/40 h-4">
              {rating > 0 ? t("rating_selected", { rating }) : t("rating_empty")}
            </p>
          </div>

          {/* Sub-category ratings — optional */}
          <div className="space-y-3 pt-4 border-t border-s-ink/5">
            <p className="text-xs font-heading text-s-ink/60 uppercase tracking-[.15em]">
              {t("detail_rating")}
            </p>
            {([
              { key: "score_ergebnis" as const, label: t("score_ergebnis") },
              { key: "score_atmosphaere" as const, label: t("score_atmosphaere") },
              { key: "score_preis_leistung" as const, label: t("score_preis_leistung") },
            ]).map(({ key, label }) => (
              <SubRatingRow
                key={key}
                label={label}
                value={subRatings[key]}
                onChange={(v) => setSubRatings(prev => ({ ...prev, [key]: v }))}
              />
            ))}
          </div>

          {/* Comment */}
          <div>
            <textarea
              placeholder={t("comment_placeholder")}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-3 rounded-[12px] border border-s-ink/10 bg-white text-s-ink text-sm focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20 resize-none"
              rows={4}
              maxLength={500}
            />
            <div className="flex justify-end mt-1">
              <span className="text-xs text-s-ink/40">
                {comment.length} / 500
              </span>
            </div>
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-medium text-s-ink mb-2">
              {t("photos_label")}
            </label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {photos.map((p, i) => (
                <div key={i} className="relative w-16 h-16 rounded-[12px] overflow-hidden border border-s-ink/10 shrink-0">
                  <img src={URL.createObjectURL(p)} alt="Preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-s-ink/50 hover:bg-s-ink/70 text-white rounded-full p-0.5 transition-colors" title={t("remove_photo")}>
                    <X size={10} />
                  </button>
                </div>
              ))}
              {photos.length < 3 && (
                <label className="w-16 h-16 flex items-center justify-center shrink-0 rounded-[12px] border-2 border-dashed border-s-ink/20 text-s-ink/40 hover:bg-s-ink/5:bg-white/5 cursor-pointer transition-colors">
                  <span className="text-xl">+</span>
                  <input type="file" accept="image/jpeg, image/png, image/webp" multiple className="hidden" onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setPhotos(prev => [...prev, ...files].slice(0, 3));
                  }} />
                </label>
              )}
            </div>
            {uploadProgress && <div className="text-xs font-medium text-s-coral">{uploadProgress}</div>}
          </div>

          {error && (
            <div id="review-error" role="alert" className="p-3 bg-red-50 text-red-600 text-xs rounded-btn">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 justify-center rounded-btn border border-s-ink/10 text-sm font-medium text-s-ink/60"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={loading || rating === 0}
              className="flex-1 py-3 flex justify-center items-center gap-2 rounded-btn active:scale-[0.97] bg-s-coral text-white text-sm font-medium disabled:opacity-50 transition-[transform,filter]"
            >
              {loading && <Spinner size="sm" invert />}
              {t("submit")}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
