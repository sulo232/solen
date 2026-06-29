"use client";

import Image from "next/image";
import { useState } from "react";
import { Star, X } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Spinner from "@/components-legacy/ui/Spinner";
import { useTranslations } from "next-intl";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ReviewFormProps {
  salonId: string;
  bookingId: string;
  salonName?: string;
  salonSlug?: string;
  /** Staff first name for the "How was {name}?" heading. */
  staffName?: string;
  /** UUID for staff_member_id in the POST body. */
  staffMemberId?: string;
  /** Staff avatar URL (optional). */
  staffPhotoUrl?: string;
  onSuccess: () => void;
  onClose: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const RATING_WORDS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

function initialsOf(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return ((parts[0][0] ?? "") + (parts[parts.length - 1][0] ?? "")).toUpperCase();
}

// ─────────────────────────────────────────────────────────────────────────────
// Interactive star row
// ─────────────────────────────────────────────────────────────────────────────

interface StarRowProps {
  value: number;
  onChange: (v: number) => void;
  reduced: boolean;
}

function InteractiveStarRow({ value, onChange, reduced }: StarRowProps) {
  const [hover, setHover] = useState(0);
  const active = hover || value;

  return (
    <div
      role="radiogroup"
      aria-label="Rating"
      className="flex gap-1"
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = active >= star;
        return (
          <motion.button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            onMouseEnter={() => setHover(star)}
            onClick={() => onChange(star)}
            className="p-1 focus:outline-none"
            whileTap={reduced ? {} : { scale: 0.85 }}
            animate={
              reduced
                ? {}
                : value >= star
                ? {
                    scale: [1, 1.38, 1],
                    transition: {
                      delay: (star - 1) * 0.07,
                      duration: 0.45,
                      ease: [0.34, 1.56, 0.64, 1],
                    },
                  }
                : { scale: 1 }
            }
          >
            <Star
              size={42}
              strokeWidth={1.2}
              className={
                filled
                  ? "fill-s-star text-s-star"
                  : "fill-transparent text-s-border"
              }
            />
          </motion.button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function ReviewForm({
  salonId: _salonId,
  bookingId,
  salonName,
  staffName,
  staffMemberId,
  staffPhotoUrl,
  onSuccess,
  onClose,
}: ReviewFormProps) {
  const t = useTranslations("reviews") as any;
  const reduced = useReducedMotion() ?? false;

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasStaff = Boolean(staffName);
  const title = hasStaff ? `How was ${staffName}?` : "How was your visit?";
  const subtitle = salonName ?? "";

  const handleRating = (v: number) => {
    setRating(v);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError(t("please_select_rating"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const body: Record<string, unknown> = {
        booking_id: bookingId,
        rating,
        comment: comment.trim() || undefined,
      };
      if (staffMemberId) body.staff_member_id = staffMemberId;

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      let resData;
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.error || t("error_saving"));
      } else {
        resData = await res.json();
      }

      // Photo upload: keep existing behavior, up to 3 photos
      if (photos.length > 0 && resData?.data?.id) {
        setUploadProgress(t("uploading"));
        const formData = new FormData();
        photos.forEach((p) => formData.append("photos", p));
        await fetch(`/api/reviews/${resData.data.id}/photos`, {
          method: "POST",
          body: formData,
        });
      }

      onSuccess();
    } catch (err: any) {
      console.error("[ReviewForm] submit error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  };

  // Animation variants (framer-motion). Reduced motion: opacity fades only.
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const sheetVariants = {
    hidden: { y: "100%", opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.38, ease: [0.32, 0.72, 0, 1] },
    },
    exit: {
      y: "100%",
      opacity: 0,
      transition: { duration: 0.22, ease: [0.4, 0, 1, 1] },
    },
  };

  const contentVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { y: 16, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: [0.32, 0.72, 0, 1] },
    },
  };

  const revealVariants = {
    hidden: { height: 0, opacity: 0 },
    visible: {
      height: "auto",
      opacity: 1,
      transition: { duration: 0.32, ease: [0.32, 0.72, 0, 1] },
    },
    exit: {
      height: 0,
      opacity: 0,
      transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
    },
  };

  const reducedItem = reduced
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : itemVariants;

  const reducedReveal = reduced
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } }
    : revealVariants;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-s-ink/40"
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ duration: 0.2 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        className="relative w-full max-w-lg mx-auto rounded-t-[28px] bg-white px-6 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        style={{ boxShadow: "0 -10px 40px rgba(10,10,10,.12)" }}
        variants={sheetVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Skip button (top-right) */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Skip"
          className="absolute top-5 right-5 text-[14px] font-medium text-s-ink-3 hover:text-s-ink transition-colors"
        >
          Skip
        </button>

        <motion.div
          className="flex flex-col items-center"
          variants={reduced ? {} : contentVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Staff avatar: 64px sunken circle with initials or photo */}
          <motion.div
            variants={reducedItem}
            className="mb-4 mt-2 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-s-bg-sunken text-[18px] font-semibold text-s-ink-2"
          >
            {staffPhotoUrl ? (
              <Image
                src={staffPhotoUrl}
                alt={staffName ?? "Stylist"}
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{initialsOf(staffName)}</span>
            )}
          </motion.div>

          {/* Title: 20px semibold */}
          <motion.h2
            variants={reducedItem}
            className="font-display text-[20px] font-semibold leading-snug text-s-ink text-center"
          >
            {title}
          </motion.h2>

          {/* Subtitle: salon name at 13px ink-3 */}
          {subtitle && (
            <motion.p
              variants={reducedItem}
              className="mt-1 text-[13px] text-s-ink-3 text-center"
            >
              {subtitle}
            </motion.p>
          )}

          {/* 5 big tappable stars (42px) */}
          <motion.div variants={reducedItem} className="mt-5">
            <InteractiveStarRow
              value={rating}
              onChange={handleRating}
              reduced={reduced}
            />
          </motion.div>

          {/* Rating word: rises+fades in on tap */}
          <div className="h-7 flex items-center mt-2">
            <AnimatePresence mode="wait">
              {rating > 0 && (
                <motion.span
                  key={rating}
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -8, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                  className="text-[20px] font-semibold text-s-ink"
                >
                  {RATING_WORDS[rating]}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Comment + submit: morphs up once a rating is selected */}
          <AnimatePresence>
            {rating > 0 && (
              <motion.div
                key="details"
                variants={reducedReveal}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="w-full overflow-hidden"
              >
                <form onSubmit={handleSubmit} className="w-full mt-4 space-y-4">
                  {/* Comment textarea: real bordered box, ink border on focus, no ring */}
                  <textarea
                    placeholder="Add a few words (optional)"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    maxLength={500}
                    className="w-full resize-none rounded-[16px] border border-s-border bg-white px-[14px] py-[14px] text-[15px] text-s-ink placeholder:text-s-ink-3 focus:outline-none focus:border-s-ink transition-colors duration-150"
                    style={{ minHeight: "84px" }}
                  />

                  {/* Photo previews + add slot (up to 3) */}
                  <div className="flex gap-2 flex-wrap">
                    {photos.map((p, i) => (
                      <div
                        key={i}
                        className="relative h-14 w-14 overflow-hidden rounded-[12px] border border-s-border shrink-0"
                      >
                        <img
                          src={URL.createObjectURL(p)}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setPhotos(photos.filter((_, idx) => idx !== i))
                          }
                          className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-s-ink/60 text-white"
                          aria-label="Remove photo"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    {photos.length < 3 && (
                      <label className="flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center rounded-[12px] border-2 border-dashed border-s-border text-s-ink-3 hover:bg-s-bg-sunken transition-colors">
                        <span className="text-lg leading-none">+</span>
                        <input
                          type="file"
                          accept="image/jpeg, image/png, image/webp"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            setPhotos((prev) => [...prev, ...files].slice(0, 3));
                          }}
                        />
                      </label>
                    )}
                  </div>

                  {uploadProgress && (
                    <p className="text-[13px] text-s-accent font-medium">
                      {uploadProgress}
                    </p>
                  )}

                  {error && (
                    <div
                      role="alert"
                      className="rounded-[12px] bg-s-error-bg px-3 py-2 text-[13px] text-s-error"
                    >
                      {error}
                    </div>
                  )}

                  {/* Submit: primary commit CTA, ink fill per LOCKFILE §3 */}
                  <button
                    type="submit"
                    disabled={loading || rating === 0}
                    className="w-full flex items-center justify-center gap-2 rounded-full bg-s-ink py-3.5 text-[15px] font-semibold text-white disabled:opacity-50 hover:brightness-[1.06] transition-[transform,opacity,filter] duration-150"
                    onPointerDown={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = "scale(0.97)";
                    }}
                    onPointerUp={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = "";
                    }}
                    onPointerLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = "";
                    }}
                  >
                    {loading && <Spinner size="sm" invert />}
                    {loading ? (uploadProgress ?? t("submit")) : t("submit")}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
