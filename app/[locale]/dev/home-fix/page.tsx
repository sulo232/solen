// exists-check: net-new dev route, extends app/[locale]/dev/home-full (adds 3 hero directions to
// fix the measured 88% white / 0.7% imagery opening viewport, with the first photo currently below
// the fold). Reuses home-full's exact data fetching + real FeedZone + sections VERBATIM, only the
// hero swaps per direction. NOT shipped.

import Link from "next/link";
import { HeroHead, CurrentCard } from "../home-search/_variants";
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

const LABELS = { a: "A, Imagery band", b: "B, Photo hero", c: "C, Warmth + rhythm" } as const;

export default async function HomeFixPreview({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const v: "a" | "b" | "c" = sp.v === "b" ? "b" : sp.v === "c" ? "c" : "a";

  const [topSalonIds, nearbyCount] = await Promise.all([getTopSalonIds(4), getNearbyTeaserCount()]);
  const salonCardData = await getSalonCardDataMap([
    ...Object.values(FORYOU_SALONS).flatMap((list) => list.map((s) => s.id)),
    ...NEARBY_SALON_IDS,
    ...topSalonIds,
  ]);

  // Same real cover photos the feed sections render below, so the hero never shows an image
  // the feed itself doesn't also use.
  const photos = Array.from(
    new Set(
      Object.values(salonCardData)
        .map((s) => s.photoUrl)
        .filter((u): u is string => Boolean(u)),
    ),
  );

  const blockA = (
    <section className="relative overflow-hidden">
      <div className="relative z-[1] mx-auto flex w-full max-w-[1280px] flex-col px-4 pt-10 pb-6 md:px-8 md:pt-14">
        <HeroHead />
        <div className="mt-6">
          <CurrentCard />
        </div>
        <div className="mt-7 grid grid-cols-3 gap-2.5">
          {["Coiffeur", "Barber", "Nails"].map((label, i) => (
            <a key={label} href={`/${locale}/search`} className="relative block aspect-[1/1.15] overflow-hidden rounded-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photos[i % photos.length]} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-3 pb-2 pt-6 font-body text-[13px] font-semibold text-white">
                {label}
              </span>
            </a>
          ))}
        </div>
        <div className="mt-3 -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
          {photos.slice(3, 8).map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={p} alt="" className="h-28 w-44 shrink-0 rounded-card object-cover" />
          ))}
        </div>
      </div>
    </section>
  );

  const blockB = (
    <section className="relative min-h-[62vh] overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photos[0]} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/20" />
      <div className="relative z-[1] mx-auto flex min-h-[62vh] w-full max-w-[1280px] flex-col justify-end px-4 pb-7 pt-16 md:px-8">
        <h1 className="mb-3 font-display text-[clamp(30px,8vw,44px)] font-bold leading-[1.08] tracking-[-0.02em] text-white">
          Appointments, instantly confirmed.
        </h1>
        <p className="mb-5 font-body text-[clamp(16px,4.5vw,20px)] font-normal leading-[1.35] text-white/85">
          Beauty and Wellness across Switzerland.
        </p>
        <div className="max-w-[540px]">
          <CurrentCard />
        </div>
      </div>
    </section>
  );

  const blockC = (
    <section
      className="relative overflow-hidden"
      style={{ background: "radial-gradient(120% 75% at 50% 0%, #FFE2D0 0%, #FFF1E9 42%, #FFFFFF 78%)" }} // drift-ok: dev preview mockup, Direction C warm-gradient hero exploration; exact hex literals from the task spec, unshipped so no DS token exists for them yet
    >
      <div className="relative z-[1] mx-auto flex w-full max-w-[1280px] flex-col px-4 pt-10 pb-6 md:px-8 md:pt-14">
        <HeroHead />
        <div className="mt-6">
          <CurrentCard />
        </div>
        <div className="mt-7 -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
          {photos.slice(0, 5).map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={p} alt="" className="h-32 w-48 shrink-0 rounded-card object-cover" />
          ))}
        </div>
      </div>
    </section>
  );

  const hero = v === "b" ? blockB : v === "c" ? blockC : blockA;

  return (
    <div className="relative overflow-hidden bg-white">
      <div className="sticky top-0 z-[200] flex items-center gap-2 border-b border-s-border bg-white/95 px-4 py-2.5 backdrop-blur">
        <span className="font-body text-[12px] font-semibold text-s-ink-2">Preview</span>
        {(["a", "b", "c"] as const).map((key) => (
          <Link
            key={key}
            href={`?v=${key}` /* selected-ok: dev-only preview toolbar toggle between hero directions, not a customer-facing chip/filter */}
            scroll={false}
            className={`rounded-full px-3 py-1 font-body text-[13px] font-semibold ${
              v === key ? "bg-s-ink text-white" : "bg-s-bg-sunken text-s-ink"
            }`}
          >
            {key.toUpperCase()}
          </Link>
        ))}
        <span className="ml-auto truncate font-body text-[12px] text-s-ink-2">{LABELS[v]}</span>
      </div>

      {hero}

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
