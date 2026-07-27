"use client";

// Exists-check: `npm run exists seeall` (2026-07-25) hits only the real SeeAllButton primitive
// itself (app/[locale]/_components/primitives/SeeAllButton.tsx, reused below unmodified) and an
// unrelated inline page-section note; `npm run exists "cta ladder mockup"` = 0. The one graveyard
// hit ("ink black select button") is the rejected per-row ink Select button on a peer-choice list,
// a different problem (row-commit, not see-all), not re-proposed here. Net-new: this comparison
// harness, built for `_design-system/CONTROL_ELEVATION.md`'s "THE SEE-ALL / CTA LADDER".
//
// Renders three simplified, real-data list sections (Services / Team / Bewertungen for salon
// "cuts-and-culture") three times over via the `direction` prop, varying ONLY where/how the real
// SeeAllButton primitive appears. No new SeeAllButton variant was needed: "pill" (existing
// default) and "link" (existing top-right variant) already cover every direction below, so the
// primitive itself is untouched.
//
// lang-ok: this task explicitly asks for real product copy on the parts that render real data
// (section titles "Services"/"Team"/"Bewertungen", the SeeAllButton labels "Alle ansehen" /
// "Alle N Bewertungen", and the live service/staff/review content itself) so the owner sees the
// exact strings that ship, matching the established pattern in ../../pdp/team-all/page.tsx and
// ../../pdp/overhaul/page.tsx (real German salon content inside an English review banner). This
// file's OWN chrome (the "no data yet" dev-tool fallbacks) stays English.
import * as React from "react";
import { Star } from "lucide-react";
import { Avatar, PriceFrom, RatingStars, SeeAllButton } from "@/app/[locale]/_components/primitives";
import type { Review, SalonDetail } from "@/app/[locale]/_components/salon/_shared";
import { formatNumber } from "@/lib/format";

export type Direction = "1" | "2" | "3";

const SERVICES_PREVIEW = 5;
const TEAM_PREVIEW = 4;
const REVIEWS_PREVIEW = 3;

// Byte-identical formatting to the real SalonServices.tsx row (owner spec: always minutes,
// lowercase "min", no trailing period).
function formatDurationDE(mins: number): string {
  return `${mins} min`;
}

// Same anti-wall filter as the real SalonReviews.tsx: a review with no comment AND no display
// name reads as fake ("Anonym, 5 stars, no text") so it's excluded from this preview too.
function hasIdentity(r: Review): boolean {
  return Boolean(r.comment ?? r.comment_de ?? r.comment_en) || Boolean(r.profiles?.display_name);
}

/**
 * Shared card chrome (LOCKED grouped list-card grammar: rounded-[24px], hairline border,
 * shadow-whisper, byte-identical wrapper class string to SalonServices/SalonTeam/SalonReviews).
 * `topRight` = the see-all placed beside the H2 (V2 everywhere, V3 for a navigating list).
 * `bottomCenter` = the see-all centred under the list (V1 everywhere, V3 for an expanding list).
 */
function Section({
  id,
  title,
  topRight,
  bottomCenter,
  intentNote,
  children,
}: {
  id: string;
  title: string;
  topRight?: React.ReactNode;
  bottomCenter?: React.ReactNode;
  intentNote?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="rounded-[24px] border border-s-border bg-white p-5 shadow-whisper md:p-7">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
          {title}
        </h2>
        {topRight}
      </div>
      {/* V3-only annotation, MY chrome (English), never uppercase/tracked per the mockup copy rules. */}
      {intentNote && <p className="mt-1 font-body text-[12px] text-s-ink-2">{intentNote}</p>}
      <div className="mt-5">{children}</div>
      {bottomCenter && <div className="mt-6 flex justify-center">{bottomCenter}</div>}
    </section>
  );
}

export function SeeAllDirections({
  direction,
  salon,
  locale,
}: {
  direction: Direction;
  salon: SalonDetail;
  locale: string;
}) {
  const services = salon.services.slice(0, SERVICES_PREVIEW);
  const team = salon.staff.slice(0, TEAM_PREVIEW);
  const identifiedReviews = React.useMemo(() => salon.reviews.filter(hasIdentity), [salon.reviews]);

  // V3 only: the reviews list demonstrates "expands in place" (no navigation) via local state,
  // revealing more of the SAME already-loaded real reviews, grounded in components-legacy/
  // staff/StaffProfilePage.tsx, whose "Alle ansehen" also uses onClick (not href) to reveal more
  // reviews without a page navigation (there, into a sheet; here, inline growth of the same list).
  // Services + Team keep their real navigation targets (booking / team page) in every direction.
  const [reviewsExpanded, setReviewsExpanded] = React.useState(false);
  const visibleReviews =
    direction === "3" && reviewsExpanded ? identifiedReviews : identifiedReviews.slice(0, REVIEWS_PREVIEW);

  const bookingHref = `/${locale}/salon/${salon.slug}/booking`;
  const teamHref = `/${locale}/salon/${salon.slug}/team`;
  const reviewsHref = `/${locale}/salon/${salon.slug}/reviews`;
  // Real product copy (this renders real data, so the label is the product's own German, not
  // mockup chrome): SalonReviews.tsx:192's exact "Alle N Bewertungen" fold-in-the-count pattern.
  const reviewsCountLabel = `Alle ${formatNumber(salon.review_count, locale)} Bewertungen`;

  // Services + Team: pill in V1, link (top-right) in V2 and V3, both always navigate for real
  // (booking flow / team page), matching today's shipped SalonServices/SalonTeam hrefs exactly.
  const navVariant = direction === "1" ? "pill" : "link";

  const servicesSeeAll =
    services.length > 0 ? (
      <SeeAllButton label="Alle ansehen" href={bookingHref} variant={navVariant} />
    ) : null;

  const teamSeeAll =
    team.length > 0 ? <SeeAllButton label="Alle ansehen" href={teamHref} variant={navVariant} /> : null;

  const reviewsHasMore = identifiedReviews.length > REVIEWS_PREVIEW;
  const reviewsSeeAll = !reviewsHasMore
    ? null
    : direction === "3"
      ? !reviewsExpanded && (
          <SeeAllButton label={reviewsCountLabel} onClick={() => setReviewsExpanded(true)} variant="pill" />
        )
      : <SeeAllButton label={reviewsCountLabel} href={reviewsHref} variant={navVariant} />;

  return (
    <div className="flex flex-col gap-6">
      <Section
        id="demo-services"
        title="Services"
        topRight={direction !== "1" ? servicesSeeAll : null}
        bottomCenter={direction === "1" ? servicesSeeAll : null}
        intentNote={direction === "3" ? "Navigates to the booking flow." : undefined}
      >
        {services.length === 0 ? (
          <p className="font-body text-[14px] text-s-ink-2">This salon has no services yet.</p>
        ) : (
          <ul className="divide-y divide-s-border overflow-hidden rounded-[16px] border border-s-border">
            {services.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-4 px-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-body text-[15px] font-semibold text-s-ink">{s.name_de}</div>
                  <div className="mt-1 font-body text-[13px] text-s-ink-2">
                    {formatDurationDE(s.duration_minutes)}
                  </div>
                </div>
                <div className="shrink-0 font-body text-[14px] font-bold text-s-ink">
                  <PriceFrom amount={s.price} label="ab" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        id="demo-team"
        title="Team"
        topRight={direction !== "1" ? teamSeeAll : null}
        bottomCenter={direction === "1" ? teamSeeAll : null}
        intentNote={direction === "3" ? "Navigates to the team page." : undefined}
      >
        {team.length === 0 ? (
          <p className="font-body text-[14px] text-s-ink-2">This salon has no team members yet.</p>
        ) : (
          <div className="flex gap-5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {team.map((m) => {
              const showRating = (m.staff_review_count ?? 0) > 0 && (m.staff_average_rating ?? 0) > 0;
              return (
                <div key={m.id} className="flex w-[88px] shrink-0 flex-col items-center text-center">
                  <Avatar src={m.avatar_url} name={m.name} size={72} />
                  <div className="mt-2.5 truncate font-body text-[13px] font-medium text-s-ink">{m.name}</div>
                  {showRating && (
                    <span className="mt-0.5 inline-flex items-center gap-1 font-body text-[12px] text-s-ink-2">
                      <Star size={11} strokeWidth={0} aria-hidden className="fill-s-star" />
                      {(m.staff_average_rating as number).toFixed(1)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Section>

      <Section
        id="demo-reviews"
        title="Bewertungen"
        topRight={direction === "2" ? reviewsSeeAll : null}
        bottomCenter={direction !== "2" ? reviewsSeeAll : null}
        intentNote={direction === "3" ? "Expands in place, same page, no navigation." : undefined}
      >
        {visibleReviews.length === 0 ? (
          <p className="font-body text-[14px] text-s-ink-2">No reviews yet.</p>
        ) : (
          <div className="flex flex-col">
            {visibleReviews.map((r) => {
              const who = r.profiles?.display_name ?? "Anonym";
              const text = r.comment ?? r.comment_de ?? r.comment_en ?? "";
              return (
                <div key={r.id} className="border-t border-s-border pt-5 first:border-t-0 first:pt-0 [&+&]:mt-5">
                  <div className="flex items-center gap-3">
                    <Avatar src={r.profiles?.avatar_url} name={who} size={40} />
                    <div className="min-w-0">
                      <div className="truncate font-body text-[14px] font-semibold text-s-ink">{who}</div>
                      {/* psych-ok: mode="five" fills stars to THIS review's own rating, one data point not an aggregate claim, byte-identical to the shipped SalonReviews.tsx ReviewCard (no count on a per-review five-star fill). */}
                      <RatingStars value={r.rating} mode="five" size="sm" className="mt-0.5" />
                    </div>
                  </div>
                  {text && (
                    <p className="mt-2.5 line-clamp-2 font-body text-[14px] leading-relaxed text-s-ink-2">{text}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}
