"use client";

// exists-check: `npm run exists "scroll motion condensing top bar frosted"` / `"frost glass sticky
// header"` (2026-07-25), 0 matches , net-new. GROUNDED in, not a duplicate of: `lib/frost-glass.ts`
// (FROST_GLASS values reused verbatim below, see deviation note), `SalonHero.tsx` (the exact
// back/share/heart icon cluster this bar's t=0 state mirrors , same BackButton primitive, same
// hand-wrapped FROST_GLASS Share chip, same HeartButton call), `SalonStickyTabNav.tsx` (the real
// PDP's OWN condensing chrome , a binary opacity-threshold swap at scrollY>200 with an opaque
// white bg; this file is the continuous/frosted alternative the owner is comparing it against, not
// a copy of it, and is never rendered alongside it), `primitives/motion.ts` (GLIDE_EASE +
// butterPress reused verbatim for press micro-interactions, not re-derived).

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useTransform, type MotionValue } from "motion/react";
import { Share } from "lucide-react";
import { BackButton, RatingStars } from "@/app/[locale]/_components/primitives";
import { HeartButton } from "@/app/[locale]/_components/homepage/HeartButton";
import { butterPress } from "@/app/[locale]/_components/primitives/motion";
import { FROST_GLASS } from "@/lib/frost-glass";
import { shareOrCopy } from "@/lib/share";
import type { SalonDetail } from "@/app/[locale]/_components/salon/_shared";
import { BAR_HEIGHT } from "./useHeroProgress";

export type BarVariant = "1" | "2" | "3";

/**
 * CondenseBar , the three scroll-linked directions.
 *
 * FROST RECIPE: reuses `lib/frost-glass.ts`'s FROST_GLASS values verbatim (white
 * 80% alpha, 4px backdrop-blur) as the bar's own condensed end-state, per the task
 * brief ("REUSE its values rather than picking new blur/alpha numbers"). ONE
 * deviation, stated per that same instruction: FROST_GLASS also carries a 1px
 * white inner border + a two-layer boxShadow, tuned for a small CIRCULAR CONTROL
 * chip floating alone over a photo. A full-bleed bar spanning the viewport isn't a
 * floating chip, so this bar drops that border/shadow and instead fades in a
 * bottom hairline (`s-border` at full opacity once frosted) , the exact edge
 * treatment the real `SalonStickyTabNav` already uses (`border-b border-s-border
 * bg-white`) for this same "PDP top chrome" role, satisfying the edge-visibility
 * floor (FLOORS LAW 4) without inventing new chrome.
 *
 * SCROLL MAPPING: intentionally LINEAR (no eased curve) , see useHeroProgress.ts.
 * The locked `glide` easing (via `butterPress()`, imported from the shared
 * primitives/motion.ts module, never re-derived) is applied instead to the actual
 * timed micro-transitions layered on top: icon/CTA press-and-hover feedback.
 *
 * ICON CLUSTER: back = the real `BackButton variant="glass"` primitive. Share = a
 * hand-wrapped FROST_GLASS chip, copied from SalonHero's own Share button (same
 * component doesn't exist as a standalone export). Heart = the real `HeartButton`,
 * wired to the real favorite-toggle endpoint, not a static glyph. All three are the
 * EXACT cluster SalonHero already renders at t=0 over the hero photo, so nothing
 * about "what the icons are" is invented here, only how the BAR around them
 * animates.
 */
export function CondenseBar({
  variant,
  salon,
  locale,
  progress,
  backdropSupported,
}: {
  variant: BarVariant;
  salon: SalonDetail;
  locale: string;
  progress: MotionValue<number>;
  backdropSupported: boolean;
}) {
  const router = useRouter();

  // Frost background + blur: [0, 0.55] , frost is the FIRST thing to appear
  // (reference t=1.0-2.0s), well before the title/action land, matching the
  // reference's own staged timing (frost first, condense second).
  const targetAlpha = backdropSupported ? 0.8 : 0.97; // solid-colour fallback: no blur -> read as
  // near-opaque instead of a weak 80%-see-through smear with nothing blurring what's under it.
  const bg = useTransform(
    progress,
    [0, 0.55],
    ["rgba(255,255,255,0)", `rgba(255,255,255,${targetAlpha})`],
  );
  const blurPx = useTransform(progress, [0, 0.55], [0, 4]); // FROST_GLASS's own 4px, reused
  const backdropFilter = useTransform(blurPx, (b) => (backdropSupported ? `blur(${b}px)` : "none"));
  const borderOpacity = useTransform(progress, [0.3, 0.6], [0, 1]);
  const borderColor = useTransform(borderOpacity, (o) => `rgba(228,228,231,${o})`); // s-border

  // Title (S2 + S3): salon name + rating/review stat slide up into the bar as the
  // real title (SalonHeader's h1, below the hero) scrolls out of view. [0.35,0.75]
  // , a later window than the frost so it lands after the bar has already frosted,
  // matching the reference (title/stat arrive after the frost, not with it).
  const titleOpacity = useTransform(progress, [0.35, 0.75], [0, 1]);
  const titleY = useTransform(progress, [0.35, 0.75], [10, 0]);

  // Compact action (S3 only): arrives last, [0.5, 0.85].
  const ctaOpacity = useTransform(progress, [0.5, 0.85], [0, 1]);
  const ctaScale = useTransform(progress, [0.5, 0.85], [0.92, 1]);
  const ctaPointerEvents = useTransform(progress, (p) => (p > 0.5 ? "auto" : "none"));

  // S3 only: the share chip steps aside as the action arrives, same window as the
  // CTA, so the row stays within a comfortable 375-402px budget (back 44 + title
  // flex + heart 44 + CTA ~86 fits; adding a persistent share chip on top of that
  // does not, the reference makes the identical trade , camera/search icons drop
  // out once "Follow" lands, only one secondary icon (ellipsis) survives).
  const shareFadeOpacity = useTransform(progress, [0.5, 0.85], [1, 0]);

  const showTitle = variant !== "1";
  const showCta = variant === "3";

  return (
    <motion.header
      style={{
        backgroundColor: bg,
        backdropFilter,
        WebkitBackdropFilter: backdropFilter,
        borderBottomWidth: 1,
        borderBottomStyle: "solid",
        borderBottomColor: borderColor,
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
      className="fixed inset-x-0 top-0 z-[60]"
    >
      <div
        className="flex w-full items-center gap-2 px-3"
        style={{ height: BAR_HEIGHT }}
      >
        {/* BackButton's own internal press-feedback (duration-150, active:scale-[0.94]) is left
            as-is , `cn()` in this codebase is plain clsx (no tailwind-merge), so passing a
            conflicting duration/ease class here would NOT reliably win the CSS cascade and
            would misrepresent this as an applied override. The locked `glide`/`butterPress`
            timing is applied below on the two elements this file actually owns (share, CTA). */}
        <BackButton variant="glass" label="Back" onClick={() => router.back()} />

        {showTitle ? (
          <motion.div style={{ opacity: titleOpacity, y: titleY }} className="min-w-0 flex-1">
            <p className="truncate font-display text-[14px] font-medium leading-tight text-s-ink">
              {salon.name}
            </p>
            {salon.average_rating != null && (
              <div className="mt-0.5 text-[12px] leading-tight text-s-ink-2">
                <RatingStars value={salon.average_rating} count={salon.review_count} size="sm" />
              </div>
            )}
          </motion.div>
        ) : (
          <div className="flex-1" aria-hidden />
        )}

        <div className="flex shrink-0 items-center gap-2">
          <motion.button
            type="button"
            aria-label="Share"
            onClick={() => shareOrCopy(salon.name, typeof window !== "undefined" ? window.location.href : "")}
            style={variant === "3" ? { opacity: shareFadeOpacity, scale: shareFadeOpacity } : undefined}
            className={`group grid h-11 w-11 shrink-0 place-items-center bg-transparent ${butterPress("icon")}`}
          >
            <span
              aria-hidden
              style={FROST_GLASS}
              className="grid h-[38px] w-[38px] place-items-center rounded-full"
            >
              <Share size={18} strokeWidth={2.1} className="text-s-ink" aria-hidden />
            </span>
          </motion.button>

          <HeartButton
            salonId={salon.id}
            salonName={salon.name}
            size={38}
            iconSize={18}
            className="!relative !right-auto !top-auto"
          />

          {showCta && (
            <motion.div style={{ opacity: ctaOpacity, scale: ctaScale, pointerEvents: ctaPointerEvents }}>
              <Link
                href={`/${locale}/salon/${salon.slug}/booking`}
                className={`inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full bg-s-ink px-4 text-[15px] font-semibold text-white ${butterPress("cta")}`}
              >
                Buchen
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </motion.header>
  );
}
