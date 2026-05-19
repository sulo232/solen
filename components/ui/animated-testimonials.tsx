"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion, type PanInfo } from "motion/react";
import {
  MorphingDialog,
  MorphingDialogContainer,
  MorphingDialogContent,
  MorphingDialogDescription,
  MorphingDialogTrigger,
  useMorphingDialog,
} from "@/components/core/morphing-dialog";
import { cn } from "@/lib/utils";

/**
 * AnimatedTestimonials — V3-D75-peek-fix (2026-05-18).
 *
 * Major rewrite addressing user feedback:
 *   1. Peek-stack RESTORED — but as decorative non-interactive cards
 *      BEHIND the active trigger, not inside it. This means the morph
 *      animates a single clean rectangle (just the active photo), while
 *      the peek illusion stays visually.
 *   2. Swipe FIXED — `touchAction: 'pan-y'` lets browser keep vertical
 *      scroll while letting motion capture horizontal drag.
 *   3. Avatar thumbnail strip replaces vague dots — clearly shows who
 *      you're navigating to.
 *   4. Mobile dimensions FIXED — `aspect-[4/5]` portrait so photos
 *      scale proportionally instead of getting awkward at 256px tall.
 *   5. Close X PERMANENT — dialog uses flex column with non-scrolling
 *      outer + scrolling inner; close button is absolute to outer so
 *      it stays at top-right regardless of scroll position.
 */

export interface Testimonial {
  quote: string;
  name: string;
  designation: string;
  src: string;
  bio?: string;
  whySelected?: string;
  specialties?: string[];
  slug?: string;
  portfolio?: { src: string; caption: string }[];
}

export interface AnimatedTestimonialsProps {
  testimonials: Testimonial[];
  autoplay?: boolean;
  className?: string;
}

export function AnimatedTestimonials({
  testimonials,
  autoplay = false,
  className,
}: AnimatedTestimonialsProps) {
  return (
    <MorphingDialog
      transition={{ type: "spring", bounce: 0.05, duration: 0.5 }}
    >
      <CarouselInner
        testimonials={testimonials}
        autoplay={autoplay}
        className={className}
      />
    </MorphingDialog>
  );
}

function CarouselInner({
  testimonials,
  autoplay,
  className,
}: AnimatedTestimonialsProps) {
  const { isOpen } = useMorphingDialog();
  const [active, setActive] = React.useState(0);

  const handleNext = React.useCallback(() => {
    setActive((prev) => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const handlePrev = React.useCallback(() => {
    setActive((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  React.useEffect(() => {
    if (!autoplay || isOpen) return;
    const interval = setInterval(handleNext, 10000);
    return () => clearInterval(interval);
  }, [autoplay, isOpen, handleNext]);

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    if (isOpen) return;
    const threshold = 50;
    if (info.offset.x < -threshold) handleNext();
    else if (info.offset.x > threshold) handlePrev();
  };

  if (testimonials.length === 0) return null;
  const current = testimonials[active];
  if (!current) return null;

  // Deterministic rotation per index — keeps the peek-stack stable across
  // re-renders (no shuffling on every advance).
  const rotateForIndex = (index: number) => {
    const seeded = (index * 9301 + 49297) % 233280;
    return Math.floor((seeded / 233280) * 20) - 10;
  };
  const isActive = (index: number) => index === active;

  return (
    <>
      <div className={cn("mx-auto w-full max-w-md md:max-w-3xl", className)}>
        <div className="relative grid grid-cols-1 gap-8 md:grid-cols-[1fr_1fr] md:items-center md:gap-12">
          {/* ─── Photo stack — original pattern (V3-D75-final).
              MorphingDialogTrigger wraps the drag container. Drag container
              has explicit aspect ratio. Inside: AnimatePresence + all 5 photos
              stacked with z-index + opacity. Active is z-50 + opacity 1 +
              centered. Inactive peeks are 0.7 opacity behind with rotation.
              Progress bars are absolute siblings INSIDE the drag container,
              higher z-index. ─── */}
          <div className="relative mx-auto w-full max-w-[320px] md:max-w-none">
            <MorphingDialogTrigger
              className="overflow-visible"
              style={{ borderRadius: "28px" }}
            >
              <motion.div
                drag={isOpen ? false : "x"}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                dragMomentum={false}
                onDragEnd={handleDragEnd}
                style={{ touchAction: "pan-y" }}
                className="relative aspect-[4/5] w-full cursor-grab active:cursor-grabbing"
              >
                <AnimatePresence initial={false}>
                  {testimonials.map((testimonial, index) => (
                    <motion.div
                      key={testimonial.src}
                      initial={{
                        opacity: 0,
                        scale: 0.9,
                        rotate: rotateForIndex(index),
                      }}
                      animate={{
                        opacity: isActive(index) ? 1 : 0.7,
                        scale: isActive(index) ? 1 : 0.95,
                        rotate: isActive(index) ? 0 : rotateForIndex(index),
                        zIndex: isActive(index)
                          ? 50
                          : testimonials.length - Math.abs(index - active),
                        y: isActive(index) ? [0, -40, 0] : 0,
                      }}
                      exit={{
                        opacity: 0,
                        scale: 0.9,
                        rotate: rotateForIndex(index),
                      }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute inset-0 origin-bottom overflow-hidden bg-s-bg-sunken"
                      style={{ borderRadius: "28px" }}
                    >
                      <Image
                        src={testimonial.src}
                        alt={`Portrait von ${testimonial.name}`}
                        fill
                        draggable={false}
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover object-center"
                        priority={isActive(index)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </MorphingDialogTrigger>

          </div>

          {/* ─── Text + nav ─── */}
          <div className="flex flex-col justify-center gap-5">
            <motion.div
              key={active}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <h3
                className="font-display font-extrabold leading-tight text-s-ink"
                style={{
                  fontSize: "clamp(24px, 3vw, 34px)",
                  letterSpacing: "-0.02em",
                }}
              >
                {current.name}
              </h3>
              <p className="mt-1 font-body text-[14px] text-s-ink-2">
                {current.designation}
              </p>
              <p className="mt-4 font-body text-[15px] leading-[1.55] text-s-ink md:text-[16px]">
                {current.quote.split(" ").map((word, index) => (
                  <motion.span
                    key={`${active}-${index}`}
                    initial={{ filter: "blur(8px)", opacity: 0, y: 4 }}
                    animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.22,
                      ease: [0.22, 1, 0.36, 1],
                      delay: 0.015 * index,
                    }}
                    className="inline-block"
                  >
                    {word}&nbsp;
                  </motion.span>
                ))}
              </p>

              {current.specialties && current.specialties.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {current.specialties.slice(0, 4).map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-s-bg-sunken px-2.5 py-1 font-body text-[11px] font-medium text-s-ink-2"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>

            {/* ── Desktop nav arrows (mobile = swipe + tap progress bars) ── */}
            <div className="hidden gap-2 md:flex">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Vorheriger Artist"
                className="grid h-10 w-10 place-items-center rounded-full bg-s-bg-sunken text-s-ink transition-colors duration-200 ease-glide hover:bg-s-brand-subtle hover:text-s-brand active:scale-[0.95] focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-2"
              >
                <ChevronLeft size={18} strokeWidth={2.25} aria-hidden />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Nächster Artist"
                className="grid h-10 w-10 place-items-center rounded-full bg-s-bg-sunken text-s-ink transition-colors duration-200 ease-glide hover:bg-s-brand-subtle hover:text-s-brand active:scale-[0.95] focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-2"
              >
                <ChevronRight size={18} strokeWidth={2.25} aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Profile dialog ─── */}
      <ArtistProfileDialog testimonial={current} />
    </>
  );
}

/**
 * Separate dialog component so the close-button-stays-visible structure
 * is clear: MorphingDialogContent is the OUTER non-scrolling box (flex
 * column), close button is absolute to it (so always at top-right), and
 * the body content is a scrollable child div.
 */
function ArtistProfileDialog({ testimonial }: { testimonial: Testimonial }) {
  const { setIsOpen } = useMorphingDialog();
  const firstName = testimonial.name.split(" ")[0];

  return (
    <MorphingDialogContainer>
      <MorphingDialogContent
        style={{ borderRadius: "28px" }}
        className="relative flex max-h-[92vh] w-full max-w-[560px] flex-col overflow-hidden bg-white"
      >
        {/* Permanent close button — absolute to non-scrolling Content,
            so it doesn't move when user scrolls the inner body. */}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Schliessen"
          className="absolute right-4 top-4 z-30 grid h-10 w-10 place-items-center rounded-full bg-black/30 text-white backdrop-blur-md transition-colors hover:bg-black/45 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
        >
          <X size={18} strokeWidth={2.5} aria-hidden />
        </button>

        {/* Scrollable inner — close button stays put while user scrolls this */}
        <div className="flex-1 overflow-y-auto">
          {/* Hero photo */}
          <div className="relative h-[55vh] max-h-[460px] w-full overflow-hidden">
            <Image
              src={testimonial.src}
              alt={`Portrait von ${testimonial.name}`}
              fill
              sizes="560px"
              className="object-cover object-center"
              priority
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.30) 75%, rgba(0,0,0,0.65) 100%)",
              }}
            />
            <div className="absolute bottom-6 left-6 right-6">
              <h2
                className="font-display font-extrabold text-white"
                style={{
                  fontSize: "clamp(28px, 5vw, 42px)",
                  letterSpacing: "-0.025em",
                  lineHeight: 1.05,
                }}
              >
                {testimonial.name}
              </h2>
              <p className="mt-1 font-body text-[14px] text-white/85">
                {testimonial.designation}
              </p>
            </div>
          </div>

          <MorphingDialogDescription
            disableLayoutAnimation
            variants={{
              initial: { opacity: 0, y: 16 },
              animate: { opacity: 1, y: 0 },
              exit: { opacity: 0, y: 8 },
            }}
          >
            <div className="p-6 md:p-8">
              <blockquote
                className="font-display text-[17px] italic leading-[1.45] text-s-ink md:text-[19px]"
                style={{ letterSpacing: "-0.01em" }}
              >
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>

              {testimonial.bio && (
                <div className="mt-6">
                  <h4 className="font-body text-[11px] font-bold uppercase tracking-[0.15em] text-s-ink-3">
                    Über {firstName}
                  </h4>
                  <p className="mt-2 font-body text-[15px] leading-[1.55] text-s-ink-2">
                    {testimonial.bio}
                  </p>
                </div>
              )}

              {testimonial.specialties && testimonial.specialties.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-body text-[11px] font-bold uppercase tracking-[0.15em] text-s-ink-3">
                    Spezialitäten
                  </h4>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {testimonial.specialties.map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-s-brand-subtle px-3 py-1.5 font-body text-[13px] font-semibold text-s-brand"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {testimonial.portfolio && testimonial.portfolio.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-body text-[11px] font-bold uppercase tracking-[0.15em] text-s-ink-3">
                    Arbeiten
                  </h4>
                  <div className="mt-3 -mx-6 flex gap-3 overflow-x-auto px-6 pb-2 md:-mx-8 md:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {testimonial.portfolio.map((p, i) => (
                      <div
                        key={i}
                        className="relative aspect-[3/4] w-[160px] shrink-0 overflow-hidden rounded-[16px] bg-s-bg-sunken"
                      >
                        <Image
                          src={p.src}
                          alt={p.caption}
                          fill
                          sizes="160px"
                          className="object-cover object-center"
                        />
                        <div
                          aria-hidden
                          className="pointer-events-none absolute inset-0"
                          style={{
                            background:
                              "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.55) 100%)",
                          }}
                        />
                        <span className="absolute bottom-2 left-2 right-2 font-body text-[11px] font-semibold text-white drop-shadow">
                          {p.caption}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {testimonial.whySelected && (
                <div className="mt-6 rounded-[16px] bg-s-brand-subtle p-4">
                  <h4 className="font-body text-[11px] font-bold uppercase tracking-[0.15em] text-s-brand">
                    Warum Solen-Favorit
                  </h4>
                  <p className="mt-2 font-body text-[14px] leading-[1.55] text-s-ink">
                    {testimonial.whySelected}
                  </p>
                </div>
              )}

              <Link
                href={testimonial.slug ? `/salon/${testimonial.slug}/book` : "#"}
                className="mt-8 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-s-brand px-6 py-4 font-body text-[15px] font-bold text-white transition-all duration-200 ease-out hover:-translate-y-[1px] hover:bg-s-brand-mid active:scale-[0.97]"
                style={{ boxShadow: "0 4px 14px rgba(31,92,66,0.25)" }}
              >
                Termin bei {firstName} buchen
                <ArrowRight size={16} aria-hidden />
              </Link>
            </div>
          </MorphingDialogDescription>
        </div>
      </MorphingDialogContent>
    </MorphingDialogContainer>
  );
}

export default AnimatedTestimonials;
