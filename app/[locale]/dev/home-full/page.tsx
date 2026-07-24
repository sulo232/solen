// exists-check: net-new dev route. Reuses the REAL home Page composition + data (FeedZone + every
// real section) and swaps ONLY the hero card, to show full-page previews of each search-card
// direction. Extends app/[locale]/dev/home-search. NOT shipped.

import Link from "next/link";
import { HeroHead, VariantA, VariantB, VariantC } from "../home-search/_variants";
import { FeedZone } from "@/app/[locale]/_components/homepage/SectionHeader";
import MobileCategoriesRow from "@/app/[locale]/_components/homepage/MobileCategoriesRow";
import SalonOfMonth from "@/app/[locale]/_components/homepage/SalonOfMonth";
import ForYouSalonRows from "@/app/[locale]/_components/homepage/ForYouSalonRows";
import RecentlyViewed from "@/app/[locale]/_components/homepage/RecentlyViewed";
import Nearby from "@/app/[locale]/_components/homepage/Nearby";
import WalkInBand from "@/app/[locale]/_components/homepage/WalkInBand";
import Entdecken from "@/app/[locale]/_components/homepage/Entdecken";
import Reviews from "@/app/[locale]/_components/homepage/Reviews";
import BusinessTeaser from "@/app/[locale]/_components/homepage/BusinessTeaser";
import { FORYOU_SALONS } from "@/app/[locale]/_components/homepage/forYouSalons";
import { NEARBY_SALON_IDS } from "@/app/[locale]/_components/homepage/nearbySalonIds";
import { getSalonCardDataMap, getTopSalonIds, getNearbyTeaserCount } from "@/app/[locale]/_components/homepage/salonCardData";

export const revalidate = 300;

const VARIANTS = { a: VariantA, b: VariantB, c: VariantC } as const;
const LABELS = { a: "A, Refined stack", b: "B, Single pill", c: "C, Segmented row" } as const;

export default async function HomeFullPreview({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const v: "a" | "b" | "c" = sp.v === "b" ? "b" : sp.v === "c" ? "c" : "a";
  const Card = VARIANTS[v];

  const [topSalonIds, nearbyCount] = await Promise.all([getTopSalonIds(4), getNearbyTeaserCount()]);
  const salonCardData = await getSalonCardDataMap([
    ...Object.values(FORYOU_SALONS).flatMap((list) => list.map((s) => s.id)),
    ...NEARBY_SALON_IDS,
    ...topSalonIds,
  ]);

  return (
    <div className="relative overflow-hidden bg-white">
      <div className="sticky top-0 z-[200] flex items-center gap-2 border-b border-s-border bg-white/95 px-4 py-2.5 backdrop-blur">
        <span className="font-body text-[12px] font-semibold text-s-ink-3">Preview</span>
        {(["a", "b", "c"] as const).map((key) => (
          <Link
            key={key}
            href={`?v=${key}` /* selected-ok: dev-only preview toolbar toggle between search-card variants, not a customer-facing chip/filter */}
            scroll={false}
            className={`rounded-full px-3 py-1 font-body text-[13px] font-semibold ${
              v === key ? "bg-s-ink text-white" : "bg-s-bg-sunken text-s-ink"
            }`}
          >
            {key.toUpperCase()}
          </Link>
        ))}
        <span className="ml-auto truncate font-body text-[12px] text-s-ink-3">{LABELS[v]}</span>
      </div>

      <section className="relative overflow-hidden">
        <div className="relative z-[1] mx-auto flex w-full max-w-[1280px] flex-col justify-center px-4 pt-10 pb-2 md:px-8 md:pt-14 md:pb-16">
          <HeroHead />
          <div className="mt-6 md:mt-8">
            <Card />
          </div>
        </div>
      </section>

      <FeedZone>
        <MobileCategoriesRow />
        <SalonOfMonth locale={locale} />
        <ForYouSalonRows salonData={salonCardData} />
        <RecentlyViewed salonData={salonCardData} topSalonIds={topSalonIds} />
        <Nearby salonData={salonCardData} nearbyCount={nearbyCount} />
        <WalkInBand />
        <Entdecken />
        <Reviews />
        <BusinessTeaser />
      </FeedZone>
    </div>
  );
}
