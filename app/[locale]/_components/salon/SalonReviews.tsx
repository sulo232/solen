"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Star, MessageSquare } from "lucide-react";
import type { Review } from "./_shared";
import { formatReviewDate, publicReply } from "./_shared";
import { formatNumber } from "@/lib/format";
import { Avatar, RatingStars, SeeAllButton } from "@/app/[locale]/_components/primitives";
import { TabPill } from "../primitives/TabPill";
import { cn } from "@/lib/utils";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

/**
 * SalonReviews, D3 "Segmented" (2026-07-24 PORT, owner "I love this D3 segmented
 * look", ref _overhaul/reviews/DirectionSegmented.tsx). A compact summary line
 * (star + average + grey count), then rating-tier TabPill chips (built only for
 * tiers that actually have reviews) filtering a hairline-divided list capped at 3
 * rows below. "Alle N Bewertungen" always navigates to the real full reviews page,
 * never an inline expand, and the old "+N ohne Kommentar" line is gone (owner
 * deleted it, logged in REMOVED.md).
 *
 * Each card:
 *   • Initial-based colored avatar circle (deterministic per name)
 *   • Name (bold) + date (muted)
 *   • 5-star row
 *   • Comment with line-clamp-3 + "Mehr lesen" toggle when truncated
 */
type Tier = "all" | 5 | 4 | 3 | 2 | 1;

export function SalonReviews({
  average,
  count,
  reviews,
  salonId,
  salonSlug,
  salonName,
  locale,
  layout = "stack",
}: {
  average: number | null;
  count: number;
  reviews: Review[];
  /** When the parent passes no review bodies (the salon fetch returns only the
   *  aggregate count), the card self-fetches them client-side. reviews are public-read. */
  salonId?: string;
  /** With slug+locale, "Alle ansehen" navigates to the full reviews view (Fresha
   *  reviews-portfolio-tap capture) instead of expanding inline. */
  salonSlug?: string;
  /** Round 10 Y3: label an owner reply "Antwort von {salonName}". */
  salonName?: string;
  locale?: string;
  /**
   * Retired (2026-07-24 D3 port): the stack/swipe/collapsed A/B/C comparison is
   * superseded by the one approved Segmented design below, which now renders
   * unconditionally. Kept, unused-by-render, only so app/[locale]/dev/pdp/reviews/page.tsx
   * (left as reference, not deleted) still compiles , same pattern as SalonCard's
   * `nextSlotLabel`.
   */
  layout?: "stack" | "swipe" | "collapsed";
}) {
  const t = useTranslations("salonDetail");
  const [fetched, setFetched] = React.useState<Review[] | null>(null);

  React.useEffect(() => {
    if (reviews.length > 0 || !salonId) return;
    let cancelled = false;
    (async () => {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data, error } = await supabase
          .from("reviews")
          .select("id, rating, comment, created_at, profiles(display_name, avatar_url), review_replies(reply_text, is_public, created_at)")
          .eq("salon_id", salonId)
          .eq("is_hidden", false)
          .order("created_at", { ascending: false })
          .limit(50);
        if (error) throw error;
        if (!cancelled) setFetched((data ?? []) as unknown as Review[]);
      } catch (err) {
        console.error("[SalonReviews] review fetch failed:", err);
        if (!cancelled) setFetched([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reviews.length, salonId]);

  const all = React.useMemo(() => (reviews.length > 0 ? reviews : fetched ?? []), [reviews, fetched]);
  // Anti-wall (owner 2026-06-12): a list of identical "Anonym + 5 stars, no text"
  // rows reads fake. Rows = reviews with TEXT or a real name; rating-only
  // anonymous reviews are simply not shown in the compact preview (no separate
  // count line for them, owner-deleted, logged in REMOVED.md).
  const hasIdentity = (r: Review) =>
    Boolean(r.comment ?? r.comment_de ?? r.comment_en) || Boolean(r.profiles?.display_name);
  const rows = React.useMemo(() => all.filter(hasIdentity), [all]);

  // D3 Segmented tier chips: index 0 = 1-star .. index 4 = 5-star, real counts off
  // the actual loaded rows, never fabricated.
  const ratingCounts = React.useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    all.forEach((r) => {
      const idx = Math.min(5, Math.max(1, Math.round(r.rating))) - 1;
      counts[idx] += 1;
    });
    return counts;
  }, [all]);
  const tiers = React.useMemo(() => {
    const list: { key: Tier; count: number }[] = [{ key: "all", count: rows.length }];
    ([5, 4, 3, 2, 1] as const).forEach((star) => {
      const c = ratingCounts[star - 1];
      if (c > 0) list.push({ key: star, count: c });
    });
    return list;
  }, [rows.length, ratingCounts]);

  const [active, setActive] = React.useState<Tier>("all");
  const filtered = active === "all" ? rows : rows.filter((r) => Math.round(r.rating) === active);
  const visible = filtered.slice(0, 3);

  return (
    <div id="section-reviews">
      <section
        // mockup-ok: the card is GONE (owner 2026-08-15: "on the review section, she's too
        // fucking cluttered. I told you about that."). His Fresha reference, measured: FOUR
        // hairlines in the entire screen, none of them around the reviews block and none between
        // the rows either. So the section sits directly on the page like About and Portfolio do,
        // and the row dividers go with it (see the row wrapper below).
        //
        // FLOORS LAW 4 (edge visibility) does not collide with this, which is worth saying rather
        // than quietly overriding: that floor bounds ELEVATED CONTAINERS, and there is no
        // container here any more. It is a heading and its content, the same as every other
        // section on this page that carries no card.
        className=""
      >
        {/* V3-D202 (A9): font-body → font-display + Scale B. */}
        <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
          {t("reviewsHeading")}
        </h2>

        {/* mockup-ok: owner 2026-08-15, holding up his Fresha "Bewertungen" capture: "I just
            want, like, the stars to be more big and, you know, like, the colors too and also,
            like, more like simple."

            What that reference actually does, so this copies a structure and not a description:
            a BIG solid-yellow five-star row on its own line, then the average and the review
            count on the line below, with the count carrying the brand's clickable colour.
            What shipped here before was the opposite: one cramped line with a 16px star, and
            the count in grey.

            The 2026-07-24 D3 Segmented decision is what is being amended, and only on this
            summary block. Its tier filter chips and its 3-row cap below are untouched.

            26px IS MEASURED, and the 28px it replaces was not. Corrected 2026-08-15 the same day:
            the first pass took 28 from our own display-anchor floor (FLOORS LAW 6) because his
            screenshots had arrived as chat attachments with no file path, so nothing could be
            sampled. They landed on disk later that day, and PIL on his Fresha Bewertungen capture
            (920px wide) measures the summary star row at 61px, which is 0.0663 of the viewport
            width, so 26px at our 390px measurement viewport.

            The count takes `text-s-accent`, and that is now measured too rather than assumed: the
            same capture puts Fresha's own count in their brand purple, a saturated violet sampled
            straight off the pixels, so a count in OUR accent is the correct translation of what he
            pointed at rather than a liberty taken with it. It also matches the review count in
            this page's own header, so one number reads one way on one screen. */}
        <div className="mt-4">
          <RatingStars value={average ?? 0} mode="five" starPx={26} /> {/* psych-ok: law 6 is "a rating never appears without its sample size", and it does not here, the count renders 8px below inside this same block as one two-line unit, which is the reference anatomy; passing count too would print the number twice */}
          <div className="mt-2 flex items-baseline gap-2">
            {/* mockup-ok: /dev/round5 "All four fixed", approved 2026-08-16, and his verdict on
                tapping it was "those are the hierarchy that I want". 16px -> 44px, so the SCORE is
                the biggest thing in the block instead of a number tucked under a heading.
                Measured from the reference, not chosen: Airbnb's reviews screen sets its rating
                digit at 72px with a 46px gap down to the next size, while its section heading stays
                small, and ours had that exactly upside down. 44 rather than their 72 because their
                rating has no page heading competing beside it and ours does; that difference is
                deliberate and is why this is not simply their number copied. */}
            <span className="font-display text-[44px] font-semibold leading-none text-s-ink tabular-nums">
              {average?.toFixed(1) ?? "-"}
            </span>
            {/* mockup-ok: 13, not 14, so the count joins the same meta tier as every date in this
                section. Finding F1 of the measured diagnosis written before any of this was
                touched (_plans/PDP_REVIEWS_DIAGNOSIS_2026-08-15.md): the section carried EIGHT
                distinct type sizes against a ceiling of four, which is what "looks weird" measured
                out to. This was the last stray, and at 14 it sat 1px off the tier below it, which
                the typography floor calls a rendering glitch rather than a hierarchy. Not a new
                size: 13 is already this section's meta tier. */}
            <span className="font-body text-[13px] text-s-accent">
              {t("reviewsCountPlural", { count })}
            </span>
          </div>
        </div>

        {/* GUARDED ON `rows`, NOT `all` (fixed 2026-07-28). `all` is every loaded review;
            `rows` is the ones that actually RENDER after the anti-wall filter drops rating-only
            anonymous entries (owner 2026-06-12). Guarding on `all` meant a salon whose reviews
            are ALL rating-only fell into the else branch and drew the tier chips anyway, so the
            page showed "Alle (0)" directly beneath a count of 11, then "no reviews in this
            group". Two true numbers contradicting each other on screen. Measured on
            muse-beauty-studio: 11 reviews, zero with a comment or a display name.
            The branch below already had the right answer for exactly this case; it was simply
            unreachable. */}
        {rows.length === 0 ? (
          // Aggregate without bodies (count > 0) softens to "texts coming"; truly-empty (0) stays.
          count > 0 ? (
            <p className="font-body mt-5 text-[14px] text-s-ink-2">
              {t("reviewTextsComing")}
            </p>
          ) : (
            <p className="font-body mt-5 text-[14px] text-s-ink-2">
              {t("noReviewsYet")}
            </p>
          )
        ) : (
          <>
            {/* mockup-ok: rating-tier TabPill filter row (D3 Segmented), built only for
                tiers that actually have reviews, over a hairline-grouped list , the
                owner-approved fix for "hard to distinguish between things, not grouped". */}
            <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {tiers.map((t) => (
                <TabPill key={String(t.key)} active={active === t.key} onClick={() => setActive(t.key)} size="sm">
                  {/* mockup-ok: revert of the bracket, owner 2026-08-15 verbatim, "ion fw the pill
                      yk how it looks like star5(10) yk jst make 5star and then counts wout()".
                      The parentheses were doing no work: a pill reading "5 [star] 13" already has
                      three parts separated by a glyph and a gap, so the brackets were a fourth
                      separator around something nothing could be confused with (taste rule 2, an
                      element carries information or it goes). Dropped on the star tiers AND on
                      Alle, because leaving them on one and not the other is the inconsistency
                      that reads as a bug. The count itself is unchanged and still real. */}
                  {/* mockup-ok: the count is GONE from the star pills, owner 2026-08-16, and he had
                      already said it once: "I do not want the counts anymore because it just doesn't
                      make any sense. Like, just make it how many stars there. It's, like, four star,
                      like, four and then one star. You know? Not, like, how many counts there is."
                      He is right that the old shape was unreadable. "5 [star] 13" put two unrelated
                      numbers side by side with only a glyph between them, so the pill read as a
                      single quantity and neither number was legible as itself. The pill now says one
                      thing: which rating it filters to. The total still lives on "Alle", one pill to
                      the left, where a total belongs.
                      The star also grows 11px -> 15px, his second point in the same breath, "the star
                      inside of the pill is just like too small". 15 sits with the 13px label rather
                      than under it. */}
                  {t.key === "all" ? (
                    `Alle ${t.count}`
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      {t.key}
                      <Star size={15} strokeWidth={0} aria-hidden className="fill-s-star" />
                    </span>
                  )}
                </TabPill>
              ))}
            </div>

            <div className="mt-5 flex flex-col">
              {visible.length === 0 ? (
                <p className="font-body text-[14px] text-s-ink-2">{t("noReviewsInGroup")}</p>
              ) : (
                visible.map((r) => (
                  // mockup-ok: the hairline between rows goes with the card (owner 2026-08-15,
                  // "too cluttered"). Measured in his own Fresha capture: no divider between
                  // reviews at all, the gap alone separates them. 28px here, up from the 20px the
                  // divider used to sit inside, because once the line goes the space has to carry
                  // the grouping on its own (FLOORS LAW 5: a deletion names what it keeps, and the
                  // surviving cue has to pass a measured floor).
                  <div key={r.id} className="[&+&]:mt-7">
                    <ReviewCard review={r} salonName={salonName} locale={locale} />
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </section>

      {rows.length > 0 && salonSlug && locale && (
        <div className="mt-5 flex justify-center">
          {/* mockup-ok: SeeAllButton port, byte-identical pill class string, same instance as
              SalonServices/SalonTeam on this page. Always navigates to the real full reviews
              page (owner: no inline expand). Sibling of the card, not nested inside it (owner
              2026-07-25: "outside of the reviews group card"); gap matches SalonServices.tsx's
              established card→SeeAllButton mt-5 (both direct children of a non-card wrapper). */}
          <SeeAllButton
            label={t("allNReviews", { count: formatNumber(count, locale) })}
            href={`/${locale}/salon/${salonSlug}/reviews`}
          />
        </div>
      )}
    </div>
  );
}

function ReviewCard({ review, salonName, locale }: { review: Review; salonName?: string; locale?: string }) {
  const t = useTranslations("reviews");
  const tCommon = useTranslations("common");
  const original = review.comment ?? review.comment_de ?? review.comment_en ?? "";
  const [showFull, setShowFull] = React.useState(false);
  const reply = publicReply(review.review_replies);

  // ON-READ TRANSLATION (2026-07-27). Reviews are written in German by default and carry no
  // language column. A visitor reading in another locale gets a translation fetched lazily
  // from /api/reviews/translate, which caches it (measured: 7.7s cold, 209ms warm).
  //
  // THE ORIGINAL IS NEVER REPLACED, only covered. `showOriginal` puts it back in one tap, and
  // the label always says the text was translated. A machine translation must not silently
  // become what a customer said about a business , that is somebody's reputation.
  const [translated, setTranslated] = React.useState<string | null>(null);
  const [showOriginal, setShowOriginal] = React.useState(false);
  const needsTranslation = !!original && !!locale && locale !== "de";

  React.useEffect(() => {
    if (!needsTranslation) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/reviews/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: [review.id], locale }),
        });
        if (!res.ok) return;
        const json = await res.json();
        const value = json?.translations?.[review.id];
        // No translation is not an error state worth surfacing: the original is already
        // rendered and is true. Fail quiet.
        if (!cancelled && typeof value === "string" && value.trim()) setTranslated(value);
      } catch {
        /* fail quiet, the original stays */
      }
    })();
    return () => { cancelled = true; };
  }, [needsTranslation, review.id, locale]);

  const showingTranslation = !!translated && !showOriginal;
  const text = showingTranslation ? translated! : original;
  const isLong = text.length > 200;

  // Reviewer name only when a public profile exists. Anonymous/seed reviews show a
  // "Verifizierte Buchung · date" line instead of a repeated placeholder name.
  const displayName = review.profiles?.display_name ?? null;

  return (
    <article>
      {/* Fresha row anatomy (pdp-bottom capture): avatar disc + NAME 16/600 with
          the grey date stacked under, star row below, text below. Anonymous reviews
          show "Anonym" (the established label on /reviews). */}
      <div className="flex items-start gap-3.5">
        {/* mockup-ok: /dev/round5 "All four fixed", approved 2026-08-16 ("you can go implement
            this"). 62px is measured off HIS Fresha screenshot with PIL (the reviewer disc there is
            62px at 2.359 device px per CSS px); ours was 44. He named this one twice, first picking
            it out of the earlier option and then again in the combined one. */}
        <Avatar src={review.profiles?.avatar_url} name={displayName ?? tCommon("anonymous")} size={62} />
        <div className="min-w-0 flex-1">
          <div className="font-body truncate text-[16px] font-semibold text-s-ink">
            {displayName ?? tCommon("anonymous")}
          </div>
          <div className="font-body mt-0.5 text-[13px] text-s-ink-2">
            {formatReviewDate(review.created_at, locale)}
          </div>
        </div>
        {/* The per-row report Flag that used to sit here is GONE (owner 2026-08-15: "the report
            button, we need to remove that because, you know, customer is not gonna report it.
            It's gonna look so weird and not official."). It was added on his own 2026-07-25 ask
            for report affordances on "surfaces that lack it"; the later call wins. */}
      </div>

      {/* Stars */}
      {/* REVERTED to "md" (13px) on 2026-08-15, same day, and this is a correction of my own
          eyeball rather than a change of his mind. Earlier that day I read "the stars to be more
          big" as applying to every star row and bumped this one from md to lg, 13px to 16px.
          Measuring his actual Fresha capture afterwards (image 8, 920px wide) puts the PER-REVIEW
          star row at 30px, which is 0.0326 of viewport width, so 13px at our 390px viewport, i.e.
          exactly the md it already was. Only the SUMMARY row is big in his reference, at 61px, a
          little over twice these. So the bump moved this away from the thing he pointed at. */}
      {/* mockup-ok: /dev/round5 "All four fixed", approved 2026-08-16. 13px -> 18px, his words:
          "I don't like how the stars here are just so fucking small", then after tapping it, "the
          star is, like, big enough to actually, like, identify". Said plainly because it matters
          later: BOTH references are SMALLER than what we already shipped, Fresha's row star at
          12.7px and Airbnb's at 9px, so this is his taste going past both and not a reference match.
          starPx is passed rather than changing the shared md tier, so nothing else on the site moves. */}
      <RatingStars value={review.rating} mode="five" size="md" starPx={18} className="mt-3" />

      {text && (
        <>
          {/* ig7 (2026-07-17): shared .prose-measure (68ch) caps the line length,
              matching SalonAbout.tsx (same utility, same rationale) - the review
              body was rendering with no width cap at all before this. */}
          <p
            className={cn(
              "prose-measure font-body mt-2.5 text-[15px] leading-relaxed text-s-ink-2",
              !showFull && "line-clamp-3"
            )}
          >
            {text}
          </p>
          {isLong && !showFull && (
            <button
              type="button"
              onClick={() => setShowFull(true)}
              className="font-body mt-1 text-[13px] font-medium text-s-accent transition-[opacity,transform] hover:opacity-80 active:scale-[0.98] active:duration-[80ms] active:ease-glide"
            >
              {t("readMore")}
            </button>
          )}
          {/* The provenance line renders ONLY when a translation is actually being shown, so a
              German reader never sees it and a failed fetch never claims something happened.
              Text link + hover underline per the LOCKFILE link row , it is a small clickable
              bit of metadata, which is exactly what s-accent is reserved for. */}
          {translated && (
            <p className="font-body mt-1.5 text-[12px] text-s-ink-2">
              {showingTranslation ? t("translatedFrom") : null}{" "}
              <button
                type="button"
                onClick={() => setShowOriginal((v) => !v)}
                className="font-medium text-s-accent underline-offset-2 transition-opacity hover:underline hover:opacity-80"
              >
                {showingTranslation ? t("showOriginal") : t("showTranslation")}
              </button>
            </p>
          )}
        </>
      )}

      {/* mockup-ok: owner reply (round 10 Y3, explicit spec , indented, neutral tokens,
          never a coloured callout). Same rounded-[12px]/bg-s-bg-sunken/border-s-border
          tray grammar as the full reviews page's reply block (components-legacy/salon/
          SalonReviews.tsx), so the two surfaces read as one consistent feature. */}
      {reply && (
        <div className="mt-3 ml-4 border-l-2 border-s-border pl-3">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-s-ink">
            <MessageSquare size={13} aria-hidden />
            {salonName ? t("replyFrom", { salon: salonName }) : t("replyFromSalon")}
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-s-ink-2">{reply.reply_text}</p>
          <p className="mt-1.5 text-[13px] text-s-ink-2">{formatReviewDate(reply.created_at, locale)}</p>
        </div>
      )}
    </article>
  );
}
