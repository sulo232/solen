// exists-check: `npm run exists "reviews-filter"` + `npm run exists "filter by"` (2026-07-24) =
// only this session's own new FilterBlockDirections.tsx (no existing route). The only existing
// filter block is this session's own ReviewsFullFilterList.tsx on /dev/pdp/reviews-full (the
// heavy-ink-bar version the owner is reacting to: "weird / too black / monochrome, ink bars +
// ink digits + grey counts read as one flat black mass"). This is a NEW comparison route, side by
// side with 3 distinct filter-block directions (FilterBlockDirections.tsx), switchable via
// ?dir=1|2|3 , same pattern as the existing /dev/pdp/reviews-directions comparison route. Real
// reviews for "cuts-and-culture" (or an owner-supplied ?salon= override) via
// loadSalonDetailWithStatus, same loader as every other /dev/pdp/* page. Does not touch
// ReviewsFullFilterList.tsx or the shipped reviews page.
import { notFound } from "next/navigation";
import Link from "next/link";
import { loadSalonDetailWithStatus } from "@/lib/salon-detail";
import {
  FilterStarWeighted,
  FilterChips,
  FilterLedger,
} from "../_overhaul/reviews/FilterBlockDirections";
import { cn } from "@/lib/utils";

const FIXTURE_SLUG = "cuts-and-culture";

const DIRECTIONS = [
  {
    key: "1",
    label: "F1 , Star-weighted",
    desc: "The same checkbox rows, but the track fill is the STAR yellow #FFC32B instead of ink, and the digit carries a small star glyph. Warmer, on-brand for a reviews section, smallest change from today.",
  },
  {
    key: "2",
    label: "F2 , Chips + count",
    desc: "No bars at all. Five compact selectable chips (5 down to 1, each with its count), calm gray-sunken when selected. Reads as a control row, not a chart.",
  },
  {
    key: "3",
    label: "F3 , Minimal ledger",
    desc: "No bars, no chips. A tight right-aligned numeric ledger (digit, percentage, count) with hairline-divided rows. Only the selected tier gains weight. The most restrained option.",
  },
] as const;

export default async function ReviewsFilterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ dir?: string; salon?: string | string[] }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const { locale } = await params;
  const sp = await searchParams;
  const dir: "1" | "2" | "3" = sp.dir === "2" ? "2" : sp.dir === "3" ? "3" : "1";
  const rawSalonParam = Array.isArray(sp.salon) ? sp.salon[0] : sp.salon;
  const slug = rawSalonParam || FIXTURE_SLUG;

  const result = await loadSalonDetailWithStatus(slug, locale);
  if (!result) notFound();
  const { salon } = result;

  const active = DIRECTIONS.find((d) => d.key === dir) ?? DIRECTIONS[0];

  return (
    <main className="min-h-screen bg-white">
      <div className="border-b border-s-border bg-s-bg-sunken px-4 py-4 md:px-6">
        <div className="mx-auto max-w-[720px]">
          <p className="font-body text-[12px] font-semibold text-s-ink-2">Solen , /dev/pdp/reviews-filter</p>
          <h1 className="mt-1 font-display text-[18px] font-semibold tracking-[-0.01em] text-s-ink">
            Reviews &quot;Filter by&quot; block , 3 directions
          </h1>
          <p className="mt-2 font-body text-[13px] text-s-ink-2">
            Owner complaint grounding this pass: the current filter block on /dev/pdp/reviews-full
            reads as &quot;weird / too black / monochrome&quot; , ink-filled bars, ink digits, and
            grey counts read as one flat black mass. Real reviews for &quot;{salon.name}&quot;,
            loaded live via loadSalonDetailWithStatus. Each direction below is fully functional:
            selecting a tier actually filters the rendered review list using the real ReviewCard.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[520px] px-4 py-8 md:px-6">
        <div className="flex flex-wrap gap-2">
          {DIRECTIONS.map((d) => (
            <Link
              key={d.key}
              href={`?dir=${d.key}${rawSalonParam ? `&salon=${rawSalonParam}` : ""}`}
              className={cn(
                "rounded-full border px-4 py-2 font-body text-[13px] font-semibold transition-colors",
                dir === d.key
                  ? "border-s-border bg-s-bg-sunken text-s-ink"
                  : "border-s-border bg-white text-s-ink-2 hover:text-s-ink",
              )}
            >
              {d.label}
            </Link>
          ))}
        </div>

        <p className="mt-3 font-body text-[13px] text-s-ink-2">{active.desc}</p>

        <div className="mt-5 rounded-2xl border border-s-border bg-white p-4">
          <span className="font-body text-[13px] font-semibold text-s-ink">Recommendation: F1 (Star-weighted).</span>{" "}
          <span className="font-body text-[13px] text-s-ink-2">
            It is the most direct fix for the exact complaint (&quot;too black&quot;): the fill
            colour becomes the star yellow the section already owns semantically, so the block
            reads as a rating summary instead of a generic chart, without changing the anatomy the
            owner already reviewed once. F2 (Chips) is the strongest runner-up if the goal is to
            stop the block from reading as a chart at all , it turns filtering into a visible
            control row. F3 (Ledger) is the most restrained but also the coolest/quietest of the
            three, worth a look if the owner wants the section to recede rather than draw the eye.
          </span>
        </div>

        <div className="mt-6 rounded-2xl border border-s-border bg-white p-5 shadow-whisper">
          {dir === "1" && <FilterStarWeighted reviews={salon.reviews} />}
          {dir === "2" && <FilterChips reviews={salon.reviews} />}
          {dir === "3" && <FilterLedger reviews={salon.reviews} />}
        </div>
      </div>
    </main>
  );
}
