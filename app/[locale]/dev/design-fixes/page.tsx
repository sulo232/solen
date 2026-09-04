// Grounded-in: app/[locale]/_components/homepage/WalkInBand.tsx, app/[locale]/_components/homepage/SalonCard.tsx,
// app/[locale]/_components/homepage/Reviews.tsx, components-legacy/SalonCard.tsx,
// app/[locale]/_components/profile/FavoritesList.tsx, app/[locale]/_components/salon/SalonServices.tsx
//
// Exists-check: `npm run exists design-fixes` ran this turn. Its only 2 hits are this task's own
// sibling files (DesignFixesClient.tsx, SalonServicesProposed.tsx, both written earlier this
// session). The four target surfaces this page compares already render, unchanged, elsewhere:
//   (1) the homepage walk-in band -> app/[locale]/_components/homepage/WalkInBand.tsx hand-builds
//       its own card (rounded-[13px] border border-s-border bg-white p-3) and paints the wait
//       estimate in text-s-success.
//   (2) the homepage review carousel -> app/[locale]/_components/homepage/Reviews.tsx renders a
//       card carrying border-s-border AND shadow-elevation-2 together (rounded-2xl border ...
//       shadow-elevation-2).
//   (3) /profile/favorites -> app/[locale]/profile/favorites/page.tsx feeds
//       app/[locale]/_components/profile/FavoritesList.tsx, which renders every saved salon
//       through components-legacy/SalonCard.tsx, a second, independent salon-card implementation
//       sitting alongside the homepage's own app/[locale]/_components/homepage/SalonCard.tsx.
//   (4) the salon PDP services section -> app/[locale]/_components/salon/SalonServices.tsx renders
//       type at 13/14/15/16/18-20px (source-read; re-measured live below).
// The one new thing is this comparison sheet: no new route, component, or query logic exists
// anywhere in the app for any of these four proposed treatments.
//
// Depicts: walk-in band card -> app/[locale]/_components/homepage/WalkInBand.tsx (real, unmodified import)
// Depicts: converged salon card -> app/[locale]/_components/homepage/SalonCard.tsx (real, unmodified import)
// Depicts: homepage review card -> app/[locale]/_components/homepage/Reviews.tsx (real, unmodified import; its
//   inner ReviewCard is not exported, so the byte-copy note below explains the one deviation)
// Depicts: saved-salon card -> components-legacy/SalonCard.tsx (real, unmodified import)
// Depicts: salon PDP services section -> app/[locale]/_components/salon/SalonServices.tsx (real, unmodified import)
// Depicts: font-snapped services copy -> NET-NEW copy of the same file, see SalonServicesProposed.tsx
//
// measured: SalonServices.tsx type sizes at 390px (source-read, re-confirmed live via
// getComputedStyle against this very route, see the returned report): 13/14/15/16/18-20px, 5-6
// distinct sizes. See ~/.claude/ss-measured.flag for the full note written before this file.
//
// PAIR B COPY NOTE: Reviews.tsx's card markup (ReviewCard) is a private, unexported function, so
// it cannot be imported for a byte-identical treatment-only diff without editing Reviews.tsx,
// which is out of this route's file scope (other coders own that file this session). The two
// review cards below are a manual byte-copy of that JSX (classes copied verbatim from the file as
// read), fed by one real fetched review, with the shadow class removed on the Proposed side only.
// The "Current" pair also renders the real <Reviews /> component itself unmodified above the byte
// copy, so the actual production card is visible too, not just the copy.

import { notFound } from "next/navigation";
import Link from "next/link";
import { Star, Store, ChevronRight } from "lucide-react";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getWalkinAvailability } from "@/lib/barber/walkin-availability";
import { getSalonCardDataMap } from "@/app/[locale]/_components/homepage/salonCardData";
import { nameForLocale } from "@/lib/min-price-service";
import { formatReviewDate } from "@/app/[locale]/_components/salon/_shared";
import type { Service, SalonDetail } from "@/app/[locale]/_components/salon/_shared";

import WalkInBand from "@/app/[locale]/_components/homepage/WalkInBand";
import { SalonCard as HomeSalonCard, type SalonCardProps } from "@/app/[locale]/_components/homepage/SalonCard";
import Reviews from "@/app/[locale]/_components/homepage/Reviews";
import { SalonServices } from "@/app/[locale]/_components/salon/SalonServices";
import { SalonServicesProposed } from "./SalonServicesProposed";
import { WalkinProposedRow, SavedCardCurrent } from "./DesignFixesClient";

const MUSE_SLUG = "muse-beauty-studio";

export default async function DesignFixesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  if (process.env.NODE_ENV === "production" && process.env.SOLEN_DEV_PAGES !== "1") notFound();

  const { locale } = await params;
  const admin = createAdminSupabaseClient();

  // ---- Pair A data: real walk-in salons (same filter as GET /api/walkin/nearby) ----
  const { data: walkinRows, error: walkinError } = await admin
    .from("salons")
    .select("id, slug, name, address, average_rating, review_count")
    .eq("walkin_enabled", true)
    .eq("is_active", true)
    .eq("listed_on_marketplace", true)
    .not("walkin_paused", "is", true)
    .order("average_rating", { ascending: false })
    .order("review_count", { ascending: false })
    .limit(4);
  if (walkinError) console.error("[dev/design-fixes] walk-in salons fetch failed:", walkinError);

  const walkinIds = (walkinRows ?? []).map((r) => r.id as string);
  const [availability, walkinCardData] = await Promise.all([
    getWalkinAvailability(admin, walkinIds),
    getSalonCardDataMap(walkinIds),
  ]);

  const walkinItems: { cardProps: SalonCardProps; waitMinutes: number; waitMinutesMax: number }[] = [];
  for (const row of walkinRows ?? []) {
    const id = row.id as string;
    const a = availability[id];
    const d = walkinCardData[id];
    if (!a || !d || !d.slug) continue;
    walkinItems.push({
      cardProps: {
        slug: d.slug,
        salonId: id,
        name: d.name ?? (row.name as string),
        rating: d.rating,
        reviewCount: d.reviewCount,
        photoUrl: d.photoUrl ?? undefined,
        category: d.category ?? "barbershop",
        variant: "availability",
        priceFromCHF: d.priceFromCHF,
        priceFromService: nameForLocale(d.priceFromServiceNames, locale),
        address: d.address ?? undefined,
        postalCode: d.postalCode ?? undefined,
        city: d.city ?? undefined,
        citySelected: Boolean(d.address),
      },
      waitMinutes: a.waitMinutes,
      waitMinutesMax: a.waitMinutesMax,
    });
  }

  // ---- Pair B data: one real review (same select as GET /api/reviews/featured) ----
  const { data: reviewRows, error: reviewError } = await admin
    .from("reviews")
    .select(
      "id, rating, comment, created_at, profiles!reviews_user_id_fkey(display_name), salons!reviews_salon_id_fkey!inner(name, slug, is_test, is_active, listed_on_marketplace)",
    )
    .gte("rating", 4)
    .not("comment", "is", null)
    .eq("is_flagged", false)
    .eq("is_hidden", false)
    .eq("salons.is_active", true)
    .eq("salons.listed_on_marketplace", true)
    .not("salons.is_test", "is", true)
    .order("created_at", { ascending: false })
    .limit(1);
  if (reviewError) console.error("[dev/design-fixes] review fetch failed:", reviewError);

  const reviewRow = (reviewRows ?? [])[0] as
    | {
        rating: number;
        comment: string;
        created_at: string;
        profiles: { display_name: string | null } | null;
        salons: { name: string; slug: string } | null;
      }
    | undefined;

  const reviewerName = reviewRow?.profiles?.display_name ?? "Anonymous"; // real fallback, translated: production's own copy of this map (app/api/reviews/featured/route.ts) falls back to the German literal "Anonym"; kept in English here per the standing mockup-copy rule.
  const reviewInitials = reviewerName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  const review = reviewRow
    ? {
        stars: Math.min(5, Math.max(1, Math.round(reviewRow.rating))),
        text: reviewRow.comment,
        initials: reviewInitials || "?",
        name: reviewerName,
        salonName: reviewRow.salons?.name ?? "",
        salonSlug: reviewRow.salons?.slug ?? "",
        dateText: reviewRow.created_at ? formatReviewDate(reviewRow.created_at, locale) : "",
      }
    : null;

  // ---- Pair C + D data: muse-beauty-studio, real photo + real services (15 seeded rows) ----
  const { data: museRow, error: museError } = await admin
    .from("salons")
    .select("*, services(*)")
    .eq("slug", MUSE_SLUG)
    .eq("is_active", true)
    .maybeSingle();
  if (museError) console.error("[dev/design-fixes] muse-beauty-studio fetch failed:", museError);

  const museServicesRaw = ((museRow?.services as Record<string, unknown>[] | null) ?? []).filter(
    (s) => s.is_active !== false,
  );

  // Legacy SalonCard shape, mirroring FavoritesList's own query
  // (app/[locale]/profile/favorites/page.tsx: select("*, services(price)") -> avg_price only, no
  // min_price / named service, which is why the legacy card below shows a bare price, not "ab X").
  const legacyPrices = museServicesRaw
    .map((s) => s.price as number)
    .filter((p) => typeof p === "number" && p > 0);
  const legacyAvgPrice =
    legacyPrices.length > 0
      ? Math.round(legacyPrices.reduce((a, b) => a + b, 0) / legacyPrices.length)
      : null;
  const { services: _museServicesDrop, ...museRest } = (museRow ?? {}) as Record<string, unknown>;
  const legacySalon = museRow ? { ...museRest, avg_price: legacyAvgPrice } : null;

  const museCardDataMap = museRow ? await getSalonCardDataMap([museRow.id as string]) : {};
  const museCardData = museRow ? museCardDataMap[museRow.id as string] : undefined;

  const services = museServicesRaw as unknown as Service[];
  const salonDetailStub = (museRow ?? {}) as unknown as SalonDetail; // unused inside SalonServices' render, see that file

  return (
    <main className="min-h-[100dvh] bg-white pb-16">
      <div className="mx-auto max-w-[390px] px-4 pt-6">
        <h1 className="font-display text-[20px] font-semibold text-s-ink">Design fixes, current vs proposed</h1>
        <p className="mt-1 text-[13px] text-s-ink-2">
          Four real sections, current then proposed, real components and real seeded data.
        </p>

        {/* ---------------- PAIR A ---------------- */}
        <PairTitle letter="A" title="Home walk-in band card" />
        <PairLabel variant="Current" rule="The real WalkInBand card: its own rounded-[13px] card, wait estimate in text-s-success." />
        <WalkInBand />
        <PairLabel
          variant="Proposed"
          rule="Same walk-in salons through the real homepage SalonCard; wait shown as plain ink text, never green."
        />
        {walkinItems.length > 0 ? (
          <WalkinProposedRow items={walkinItems} />
        ) : (
          <p className="text-[13px] text-s-ink-2">No walk-in salons resolved from the live query.</p>
        )}

        {/* ---------------- PAIR B ---------------- */}
        <PairTitle letter="B" title="Home review card" />
        <PairLabel variant="Current" rule="The real Reviews section, plus its card's own classes: border-s-border AND shadow-elevation-2 together." />
        <Reviews />
        {review ? (
          <ReviewCardCurrent review={review} locale={locale} />
        ) : (
          <p className="text-[13px] text-s-ink-2">No review matched the live query.</p>
        )}
        <PairLabel variant="Proposed" rule="Identical card, shadow-elevation-2 removed, border-s-border kept, per LOCKFILE: a card carrying elevation drops its border, never both." />
        {review && <ReviewCardProposed review={review} locale={locale} />}

        {/* ---------------- PAIR C ---------------- */}
        <PairTitle letter="C" title="Saved-salons card" />
        <PairLabel variant="Current" rule="components-legacy/SalonCard.tsx, exactly as FavoritesList.tsx calls it." />
        {legacySalon ? (
          <SavedCardCurrent salon={legacySalon} locale={locale} />
        ) : (
          <p className="text-[13px] text-s-ink-2">muse-beauty-studio did not resolve from the live query.</p>
        )}
        <PairLabel variant="Proposed" rule="The real homepage SalonCard for the same salon, per FLOORS LAW 8: one entity, one component." />
        {museCardData?.slug ? (
          <HomeSalonCard
            slug={museCardData.slug}
            salonId={museRow?.id as string}
            name={museCardData.name ?? ""}
            rating={museCardData.rating}
            reviewCount={museCardData.reviewCount}
            photoUrl={museCardData.photoUrl ?? undefined}
            category={museCardData.category ?? "coiffeur"}
            variant="service"
            priceFromCHF={museCardData.priceFromCHF}
            priceFromService={nameForLocale(museCardData.priceFromServiceNames, locale)}
            address={museCardData.address ?? undefined}
            postalCode={museCardData.postalCode ?? undefined}
            city={museCardData.city ?? undefined}
            citySelected={Boolean(museCardData.address)}
          />
        ) : (
          <p className="text-[13px] text-s-ink-2">muse-beauty-studio card data did not resolve.</p>
        )}

        {/* ---------------- PAIR D ---------------- */}
        <PairTitle letter="D" title="Salon page type scale (services section)" />
        <PairLabel variant="Current" rule="app/[locale]/_components/salon/SalonServices.tsx as-is: 13/14/15/16/18-20px, 5-6 sizes in one screen." />
        {services.length > 0 ? (
          <SalonServices services={services} locale={locale} slug={MUSE_SLUG} salon={salonDetailStub} />
        ) : (
          <p className="text-[13px] text-s-ink-2">muse-beauty-studio services did not resolve.</p>
        )}
        <PairLabel variant="Proposed" rule="Same component, every size snapped to the locked scale (name 14, meta 12, body 14, section-H2 18-20, CTA 15)." />
        {services.length > 0 && (
          <SalonServicesProposed services={services} locale={locale} slug={MUSE_SLUG} salon={salonDetailStub} />
        )}
      </div>
    </main>
  );
}

function PairTitle({ letter, title }: { letter: string; title: string }) {
  return (
    <h2 className="mt-10 border-t border-s-border pt-6 font-body text-[14px] font-semibold text-s-ink">
      {letter}. {title}
    </h2>
  );
}

function PairLabel({ variant, rule }: { variant: "Current" | "Proposed"; rule: string }) {
  return (
    <div className="mb-2 mt-4">
      <p className="text-[13px] font-semibold text-s-ink">{variant}</p>
      <p className="text-[12px] text-s-ink-2">{rule}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// PAIR B card copies. Manual byte-copy of Reviews.tsx's private ReviewCard JSX (classes copied
// verbatim from that file as read this session), because that function is not exported. Current
// keeps every class, including shadow-elevation-2; Proposed drops only that one class. No hooks
// (locale passed as a plain string prop), so plain functions, no "use client" needed.
// ---------------------------------------------------------------------------------------------

type ReviewCardData = {
  stars: number;
  text: string;
  initials: string;
  name: string;
  salonName: string;
  salonSlug: string;
  dateText: string;
};

function ReviewCardCurrent({ review, locale }: { review: ReviewCardData; locale: string }) {
  return (
    <div className="relative flex min-h-[220px] w-full flex-col rounded-2xl border border-s-border bg-s-bg-surface p-4 shadow-elevation-2">
      <ReviewCardBody review={review} locale={locale} />
    </div>
  );
}

function ReviewCardProposed({ review, locale }: { review: ReviewCardData; locale: string }) {
  return (
    <div className="relative flex min-h-[220px] w-full flex-col rounded-2xl border border-s-border bg-s-bg-surface p-4">
      <ReviewCardBody review={review} locale={locale} />
    </div>
  );
}

function ReviewCardBody({ review, locale }: { review: ReviewCardData; locale: string }) {
  return (
    <>
      <div className="mb-3 flex items-center gap-2.5">
        <div
          className="font-display grid h-10 w-10 shrink-0 place-items-center rounded-full bg-s-bg-sunken text-[14px] font-semibold text-s-ink-2"
          aria-hidden
        >
          {review.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-body text-[14px] font-semibold leading-[1.2] text-s-ink">
            {review.name}
          </div>
          <Link
            href={`/${locale}/salon/${review.salonSlug}`}
            aria-label={`Open ${review.salonName}`}
            className="mt-0.5 inline-flex items-center gap-1 font-body text-[12px] font-normal text-s-ink-2 transition-colors duration-150 ease-glide hover:text-s-ink"
          >
            <Store size={11} strokeWidth={2.25} aria-hidden />
            <span className="max-w-[140px] truncate">{review.salonName}</span>
            <ChevronRight size={11} strokeWidth={2.5} aria-hidden />
          </Link>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-[1px]">
          {Array.from({ length: review.stars }).map((_, i) => (
            <Star key={i} size={12} stroke="none" aria-hidden className="fill-s-star" />
          ))}
        </div>
        <span className="shrink-0 font-body text-[12px] font-normal tabular-nums text-s-ink-2">
          {review.dateText}
        </span>
      </div>

      <p className="flex-1 font-body text-[14px] leading-[1.5] text-s-ink line-clamp-3">
        &ldquo;{review.text}&rdquo;
      </p>
    </>
  );
}
