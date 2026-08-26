"use client";

import { useEffect, useMemo, useState } from "react";
import {
  X,
  Check,
  ImagePlus,
  ShieldCheck,
  CreditCard,
  Dog,
  Baby,
  Wifi,
  Accessibility,
  Bus,
  Heart,
  Star,
  Home,
  GraduationCap,
  Repeat,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion, type Variants } from "motion/react";
import Spinner from "@/components-legacy/ui/Spinner";
import { useTranslations } from "next-intl";
import { RatingStars } from "@/app/[locale]/_components/primitives/RatingStars";
import { Avatar } from "@/app/[locale]/_components/primitives/Avatar";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ReviewFormProps {
  salonId: string;
  /**
   * The rater's own booking, when they have one. OPTIONAL since owner decision 4, 2026-08-09
   * ("4B like google maps"): anyone signed in can rate, so a rating with no appointment posts
   * against salonId instead. When present it links the rating to that booking and its stylist.
   */
  bookingId?: string;
  salonName?: string;
  salonSlug?: string;
  /** Staff first name for the "How was {name}?" heading (stylist variant). */
  staffName?: string;
  /** UUID for staff_member_id in the POST body. */
  staffMemberId?: string;
  /** Staff avatar URL (optional, stylist variant only). */
  staffPhotoUrl?: string;
  /**
   * "stylist" (default): avatar + "How was {staff}?" - staff rating focus.
   * "salon": no avatar, "How was {salonName}?" + amenity chips after rating.
   */
  variant?: "stylist" | "salon";
  onSuccess: () => void;
  onClose: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Amenity chip data (reused from SalonAdditionalInfo icon set)
// Lucide icons + stable keys matching salon DB column names
// ─────────────────────────────────────────────────────────────────────────────

type AmenityItem = {
  key: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  labelKey: string;
};

// EXPERIENTIAL amenities a customer confirms about the place (Google-Maps style).
// Deliberately EXCLUDES booking/platform features (instant booking, online pay, free
// cancel) , those are not something a reviewer attests to about the physical/social space.
// labelKey below is just the amenity key; the localized label is resolved via the
// shared searchUi i18n namespace (`amenity_${item.key}`, messages/*.json), same as
// the search filters , see tAmenity() at the render site.
const AMENITY_ITEMS: AmenityItem[] = [
  { key: "lgbtq_friendly", icon: Heart, labelKey: "lgbtq_friendly" },
  { key: "wheelchair_accessible", icon: Accessibility, labelKey: "wheelchair_accessible" },
  { key: "woman_owned", icon: Star, labelKey: "woman_owned" },
  { key: "wifi_friendly", icon: Wifi, labelKey: "wifi_friendly" },
  { key: "kid_friendly", icon: Baby, labelKey: "kid_friendly" },
  { key: "pet_friendly", icon: Dog, labelKey: "pet_friendly" },
  { key: "family_owned", icon: Home, labelKey: "family_owned" },
  { key: "near_public_transport", icon: Bus, labelKey: "near_public_transport" },
  { key: "student_discount", icon: GraduationCap, labelKey: "student_discount" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function ReviewForm({
  salonId,
  bookingId,
  salonName,
  staffName,
  staffMemberId,
  staffPhotoUrl,
  variant = "stylist",
  onSuccess,
  onClose,
}: ReviewFormProps) {
  const t = useTranslations("reviews") as any;
  // Amenity labels live in the searchUi namespace (shared with the search filters).
  const tAmenity = useTranslations("searchUi") as any;
  const reduced = useReducedMotion() ?? false;

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Salon variant: selected amenity keys (POSTed as attributes, persisted to review_attributes).
  const [selectedAmenities, setSelectedAmenities] = useState<Set<string>>(new Set());

  // One blob URL per photo, revoked when photos change / on unmount (no per-render leak).
  const previewUrls = useMemo(() => photos.map((p) => URL.createObjectURL(p)), [photos]);
  useEffect(() => () => previewUrls.forEach((u) => URL.revokeObjectURL(u)), [previewUrls]);

  const isSalon = variant === "salon";

  // Title: salon variant uses salonName, stylist uses staffName.
  // The stylist variant only names a stylist when the rating is linked to a booking that had one.
  // Without a booking (owner decision 4) there is no stylist AND no visit, so it falls through to
  // the existing how_was_salon string rather than asking "how was your visit" of someone who may
  // never have been. Existing key, all four locales, no new copy.
  const namesStylist = !isSalon && Boolean(staffName);
  const title = isSalon
    ? t("how_was_salon", { name: salonName ?? "" })
    : namesStylist
      ? t("how_was_staff", { name: staffName })
      : salonName
        ? t("how_was_salon", { name: salonName })
        : t("how_was_visit");

  const ratingWords = [
    "",
    t("rating_word_1"),
    t("rating_word_2"),
    t("rating_word_3"),
    t("rating_word_4"),
    t("rating_word_5"),
  ];

  // Stylist variant shows salon name as subtitle; salon variant has no subtitle. Suppressed when
  // the title itself is the salon name, so it is not printed twice.
  const subtitle = namesStylist ? (salonName ?? "") : "";

  const handleRating = (v: number) => {
    setRating(v);
    setError(null);
  };

  const toggleAmenity = (key: string) => {
    setSelectedAmenities((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
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
      // Owner decision 4, 2026-08-09: a rating with no appointment posts against the salon.
      // booking_id is sent only when the rater actually has one, so the review still links to it.
      const body: Record<string, unknown> = {
        ...(bookingId ? { booking_id: bookingId } : { salon_id: salonId }),
        rating,
        comment: comment.trim() || undefined,
      };
      if (staffMemberId) body.staff_member_id = staffMemberId;
      if (selectedAmenities.size > 0) body.attributes = [...selectedAmenities];

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
          // Required since 962fd4c65: the upload routes reject any multipart POST without this
          // header, because a plain cross-site <form> cannot set a custom header and the session
          // cookie alone was enough to submit one. Missing it here 403s every review photo.
          headers: { "x-solen-upload": "1" },
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

  // Animation variants (motion/react). Reduced motion: opacity fades only.
  const backdropVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const sheetVariants: Variants = {
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

  const contentVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.05 } },
  };

  const itemVariants: Variants = {
    hidden: { y: 16, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: [0.32, 0.72, 0, 1] },
    },
  };

  const revealVariants: Variants = {
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
        className="relative w-full max-w-lg mx-auto max-h-[88vh] overflow-y-auto rounded-t-[28px] bg-white px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        style={{ boxShadow: "0 -10px 40px rgba(10,10,10,.12)" }}
        variants={sheetVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Sticky header: grabber + Skip stay reachable while the body scrolls (sheet can be tall) */}
        <div className="sticky top-0 z-10 -mx-6 rounded-t-[28px] bg-white px-6 pt-2 pb-3">
          <div className="flex justify-center">
            <div className="h-1 w-9 rounded-full bg-s-border" />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Skip"
            className="absolute top-2.5 right-5 text-[14px] font-medium text-s-ink-2 hover:text-s-ink transition-colors"
          >
            Skip
          </button>
        </div>

        <motion.div
          className="flex w-full flex-col items-center"
          variants={reduced ? {} : contentVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Staff avatar , the canonical Avatar primitive (photo-or-initials). Rendered only when
              there IS a stylist to show. A rating with no appointment has none, and an initials
              disc standing in for a person who is not part of that rating is a fabricated element
              (taste rule 1) plus the grey-disc focal the never-again floors ban. */}
          {namesStylist && (
            <motion.div variants={reducedItem} className="mb-4 mt-2">
              <Avatar src={staffPhotoUrl} name={staffName ?? "Stylist"} size={64} />
            </motion.div>
          )}

          {/* No avatar above: keep the top margin the avatar used to provide */}
          {!namesStylist && <div className="mt-4" />}

          {/* Title: 20px semibold */}
          <motion.h2
            variants={reducedItem}
            className="font-display text-[20px] font-semibold leading-snug text-s-ink text-center"
          >
            {title}
          </motion.h2>

          {/* Subtitle: salon name at 13px ink-3 (stylist variant only) */}
          {subtitle && (
            <motion.p
              variants={reducedItem}
              className="mt-1 text-[13px] text-s-ink-2 text-center"
            >
              {subtitle}
            </motion.p>
          )}

          {/* 5 big tappable stars (42px) via RatingStars interactive mode */}
          <motion.div variants={reducedItem} className="mt-5">
            <RatingStars
              mode="interactive"
              value={rating}
              onChange={handleRating}
              starPx={42}
            />
          </motion.div>

          {/* "Tap to rate" hint - shown before any rating, disappears once rated */}
          <div className="h-7 flex items-center mt-2">
            <AnimatePresence mode="wait">
              {rating === 0 ? (
                <motion.span
                  key="hint"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-[13px] text-s-ink-2"
                >
                  {t("tap_to_rate")}
                </motion.span>
              ) : (
                <motion.span
                  key={rating}
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -8, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                  className="text-[20px] font-semibold text-s-ink"
                >
                  {ratingWords[rating]}
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
                    placeholder={t("comment_placeholder")}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    maxLength={500}
                    className="w-full resize-none px-[14px] py-[14px] text-[15px] text-s-ink placeholder:text-s-ink-2 focus:outline-none transition-colors duration-150" // mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17)
                    style={{ minHeight: "84px" }}
                  />

                  {/* Photos , stage 2 (after a rating). FULL-WIDTH image-icon upload card
                      (matches the comment field width, no lone small tile / blank gutter), no text.
                      Added photos preview as cards above it; the add card hides at the 3 cap. */}
                    <div className="mt-3 space-y-2">
                      {photos.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {photos.map((p, i) => (
                            <div
                              key={i}
                              className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[12px] border border-s-border"
                            >
                              <img
                                src={previewUrls[i]}
                                alt="Preview"
                                className="h-full w-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))}
                                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-s-ink/60 text-white"
                                aria-label="Remove photo"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {photos.length < 3 && (
                        <label
                          aria-label={t("photos_label")}
                          className="flex h-[72px] w-full cursor-pointer items-center justify-center rounded-[16px] border border-s-border bg-white text-s-ink-2 transition-colors hover:bg-s-bg-sunken hover:text-s-ink-2"
                        >
                          <ImagePlus size={24} strokeWidth={2.4} />
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

                  {/* Amenities , stage 2 (after a rating). */}
                    <div className="space-y-2.5">
                      <p className="text-[13px] font-semibold text-s-ink">
                        {t("amenities_label")}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {AMENITY_ITEMS.map((item) => {
                          const Icon = item.icon;
                          const selected = selectedAmenities.has(item.key);
                          return (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => toggleAmenity(item.key)}
                              aria-pressed={selected}
                              className={[
                                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] transition-colors",
                                selected
                                  ? "border-s-border bg-s-bg-sunken font-semibold text-s-ink"
                                  : "border-s-border bg-white font-normal text-s-ink-2 hover:bg-s-bg-sunken",
                              ].join(" ")}
                            >
                              {/* selected = gray fill, the amenity icon STAYS (no checkmark swap) */}
                              <Icon size={12} strokeWidth={2} className="shrink-0" />
                              <span>{tAmenity(`amenity_${item.key}`)}</span>
                            </button>
                          );
                        })}
                      </div>
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

                  {/* Submit: primary commit CTA, ink fill per LOCKFILE */}
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
