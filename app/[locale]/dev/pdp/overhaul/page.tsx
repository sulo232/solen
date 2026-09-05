// exists-check: `npm run exists overhaul` (2026-07-24) hits only this session's own new
// _overhaul/* components (PdpOverhaul, SalonHeroOverhaul, SalonImageGalleryOverhaul,
// SalonReviewsOverhaul, SalonCardOverhaul, SalonVenuesNearbyOverhaul, SalonAppCtaOverhaul) plus
// two unrelated graveyard entries (a rejected spec-chip checkmark; the rejected
// "customer-overhaul" before/after gallery, killed for German chrome + fake diffs , the exact
// mistake this route avoids by staying English and rendering the real live salon). No hit
// against the real production route app/[locale]/salon/[slug]/page.tsx (unmodified, reused as
// the loader pattern here) confirms this dev route is genuinely net-new.

import { notFound } from "next/navigation";
import { loadSalonDetailWithStatus } from "@/lib/salon-detail";
import { PdpOverhaul } from "../_overhaul/PdpOverhaul";

const FIXTURE_SLUG = "cuts-and-culture";

// ROUND 5 (owner "nine, twice"; the earlier six was my misread): the fixture salon "cuts-and-
// culture" only has 6 real gallery_urls and 0 staff_portfolio_images across its 3 stylists, so a
// real 3x3=9 grid cannot be filled there without fabricating photos (banned). "atelier-haarwerk"
// really does have 11 seeded gallery photos, so it's exposed here as an optional `?salon=` param
// to review the full 9-tile grid honestly, instead of faking data on the default fixture.
export default async function PdpOverhaulPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ salon?: string | string[] }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const { locale } = await params;
  const sp = await searchParams;
  const rawSalonParam = Array.isArray(sp.salon) ? sp.salon[0] : sp.salon;
  const slug = rawSalonParam || FIXTURE_SLUG;

  const result = await loadSalonDetailWithStatus(slug, locale);
  if (!result) notFound();
  const { salon, openStatus, todayKey } = result;

  const realPhotoCount = salon.gallery_urls?.length ?? 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Review banner , plain English context for the owner, not part of the PDP itself. */}
      <div className="border-b border-s-border bg-s-bg-sunken px-4 py-4 md:px-6">
        <div className="mx-auto max-w-[1180px]">
          <p className="font-body text-[12px] font-semibold text-s-ink-2">Solen , /dev/pdp/overhaul</p>
          <h1 className="mt-1 font-display text-[18px] font-semibold tracking-[-0.01em] text-s-ink">
            PDP overhaul , real salon &quot;{salon.name}&quot; ({realPhotoCount} real gallery photos), 5 changes applied
          </h1>
          <ul className="mt-2 space-y-1 font-body text-[13px] text-s-ink-2">
            <li>1. Hero photo tap now opens the full-screen gallery (was the bare swipe lightbox).</li>
            <li>2. That gallery&apos;s Salon tab is now CATEGORIZED (Fades / Haircuts / Beard trims sample split of the real gallery photos, plus a dense 3-col grid). Sample categories only , the DB has no per-photo category column yet, see the footnote at the bottom of the gallery.</li>
            <li>3. Reviews section is the owner-approved D3 &quot;Segmented&quot; direction: rating-tier filter chips (All / 5 / 4 / ...) over a hairline-grouped review list, with &quot;see all&quot; going to the dedicated /dev/pdp/reviews-full page instead of expanding inline.</li>
            <li>4. Nearby cards are bigger (~1.25 visible at 390px, was ~1.5) and now use the exact homepage SalonCard grammar (5:4 photo, rounded-22, discount pill, heart, name+star row).</li>
            <li>5. The black &quot;book at {salon.name}&quot; hero card is gone (book already lives in the sticky bottom bar + sidebar); only the quiet &quot;Find more&quot; discovery chips remain, now a peer section instead of a hero.</li>
          </ul>
          <p className="mt-3 font-body text-[12px] text-s-ink-2">
            Deviations from the real page, for review only: analytics/JSON-LD side effects and the
            Book/Walk-in toggle are omitted (book mode only) to keep this diff surgical to the 5
            changes above. Real photos, reviews and nearby data below, live from the database.
          </p>
          <p className="mt-2 font-body text-[12px] text-s-ink-2">
            Portfolio grid: this default salon (&quot;{FIXTURE_SLUG}&quot;) genuinely only has 6
            uploaded gallery photos, so its 3x3 grid is honestly short (footnote below the grid)
            rather than padded with invented tiles. To review the full 3x3=9 grid with real
            photos, open this same page with{" "}
            <code className="rounded bg-white px-1 py-0.5 text-[12px]">?salon=atelier-haarwerk</code>{" "}
            (11 real gallery photos).
          </p>
        </div>
      </div>

      <PdpOverhaul salon={salon} openStatus={openStatus} todayKey={todayKey} />
    </div>
  );
}
