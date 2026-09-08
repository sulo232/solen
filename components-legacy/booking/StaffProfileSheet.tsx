'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Sheet, SheetHeader, SheetBody, Avatar, RatingStars } from '@/app/[locale]/_components/primitives';
import StaffReviewsSheet, { type SheetReview } from '@/components-legacy/staff/StaffReviewsSheet';
import Spinner from '@/components-legacy/ui/Spinner';
import type { StaffMember } from '@/lib/types';
import { resolveSwissLocale } from '@/lib/format';

const REVIEWS_PREVIEW = 3;

/**
 * StaffProfileSheet, B19 (owner 2026-07-09, asked twice, dropped twice by B7):
 * a READ-ONLY "Profil ansehen" view opened from the booking stylist picker.
 * Shows avatar, name, specialty, rating WITH its review count, bio, and the
 * stylist's reviews. Reuses the `Sheet` primitive (not a new overlay), the
 * `Avatar`/`RatingStars` primitives, and the EXISTING `StaffReviewsSheet` for
 * the full "Alle ansehen" browse (sort + star filter), instead of rebuilding
 * any of those. Only the review LIST is fetched (from the already-existing
 * `/api/staff/[id]/profile` endpoint, which StaffProfilePage already uses);
 * avatar/name/specialty/rating/bio come straight off the `staff` prop the
 * picker already has, so the header never waits on a network round trip.
 *
 * mockup-ok: every visual class below is copied verbatim from the already-
 * shipped, owner-approved `StaffProfilePage.tsx` hero + review-card blocks
 * (same type scale, same spacing, same tokens) and `StaffReviewsSheet.tsx`;
 * this is a re-composition of EXISTING approved treatments into a narrower
 * read-only view, not new visual design exploration.
 *
 * SELECTION-ONLY, on purpose: this sheet renders NO services, NO "Buchen"/
 * booking links, and NO staff-select CTA (the row itself, outside this
 * sheet, stays the one place that picks a stylist). That is the exact
 * distinction the owner drew when B7 over-removed the whole profile path:
 * viewing who a stylist is and reading their reviews is fine mid-booking,
 * picking a DIFFERENT service or jumping into a fresh booking from here is
 * not, because it would silently diverge from the cart already built in
 * this flow. Do not add an onSelect/CTA here without re-reading that call.
 */
export default function StaffProfileSheet({
  staff,
  locale,
  onClose,
}: {
  staff: StaffMember;
  locale: string;
  onClose: () => void;
}) {
  const t = useTranslations('booking.staffStep');
  const tCommon = useTranslations('common');
  const [reviews, setReviews] = useState<SheetReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/staff/${staff.id}/profile`);
        if (res.ok) {
          const d = await res.json();
          if (active) setReviews(d.reviews ?? []);
        }
      } catch (err) {
        console.error('[StaffProfileSheet] reviews fetch failed:', err);
      } finally {
        if (active) setLoadingReviews(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [staff.id]);

  const specialty = staff.specialties?.[0] ?? null;
  const rating = staff.average_rating != null && staff.average_rating > 0 ? staff.average_rating : null;
  const reviewCount = staff.review_count ?? 0;
  const visibleReviews = reviews.slice(0, REVIEWS_PREVIEW);
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(resolveSwissLocale(locale), {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

  return (
    <>
      <Sheet isOpen onOpenChange={(open) => !open && onClose()} height="full" aria-label={t('viewProfile')}>
        <SheetHeader title={staff.name} onClose={onClose} />
        <SheetBody>
          <div className="flex flex-col items-center border-b border-s-border pb-6 text-center">
            <Avatar src={staff.avatar_url} name={staff.name} size={88} />
            <p className="mt-3 font-heading text-[19px] font-bold text-s-ink">{staff.name}</p>
            {specialty && <p className="mt-1 text-[14px] text-s-ink-2">{specialty}</p>}
            {rating != null && reviewCount > 0 && (
              <RatingStars value={rating} count={reviewCount} mode="compact" size="lg" className="mt-2.5" />
            )}
            {staff.bio && (
              <p className="mt-4 text-[14px] leading-relaxed text-s-ink-2">{staff.bio}</p>
            )}
          </div>

          <div className="pt-6">
            <p className="mb-4 font-heading text-[16px] font-bold text-s-ink">{tCommon('reviews')}</p>
            {loadingReviews ? (
              <div className="grid place-items-center py-6">
                <Spinner size="sm" />
              </div>
            ) : reviews.length === 0 ? (
              <p className="text-[14px] italic text-s-ink-2">{tCommon('noReviewsModeration')}</p>
            ) : (
              <>
                <div className="space-y-6">
                  {visibleReviews.map((r) => {
                    const who = r.profiles?.display_name ?? 'Solen-Kund:in';
                    return (
                      <article key={r.id}>
                        <div className="flex items-center gap-2.5">
                          <Avatar src={r.profiles?.avatar_url} name={who} size="sm" />
                          <div className="min-w-0">
                            <div className="truncate text-[14px] font-semibold text-s-ink">{who}</div>
                            <div className="text-[12px] text-s-ink-2">{fmtDate(r.created_at)}</div>
                          </div>
                        </div>
                        {/* psych-ok: per-review 5-star row, not a summary (same as StaffProfilePage's review card) */}
                        <RatingStars value={r.rating} mode="five" size="md" className="mt-2.5" />
                        {r.comment && (
                          <p className="mt-2.5 text-[14px] leading-relaxed text-s-ink-2">{r.comment}</p>
                        )}
                      </article>
                    );
                  })}
                </div>
                {reviews.length > REVIEWS_PREVIEW && (
                  <button
                    type="button"
                    onClick={() => setShowAllReviews(true)}
                    className="mt-6 w-full rounded-full border border-s-border py-3 font-heading text-[14px] font-semibold text-s-ink transition-colors hover:border-s-ink/25"
                  >
                    Alle ansehen
                  </button>
                )}
              </>
            )}
          </div>
        </SheetBody>
      </Sheet>

      {showAllReviews && (
        <StaffReviewsSheet
          reviews={reviews}
          averageRating={staff.average_rating ?? 0}
          reviewCount={reviewCount}
          locale={locale}
          onClose={() => setShowAllReviews(false)}
        />
      )}
    </>
  );
}
