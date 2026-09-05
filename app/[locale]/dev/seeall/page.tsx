// Exists-check: `npm run exists "see all button comparison directions"` (2026-07-25) = 0 matches.
// `npm run exists seeall` hits only the real SeeAllButton primitive (app/[locale]/_components/
// primitives/SeeAllButton.tsx, reused unmodified below) and one unrelated inline-section note; the
// one graveyard hit is the rejected per-row ink Select button (a different problem, row-commit not
// see-all), not re-proposed here. Net-new dev route, sibling shape to the existing /dev/pdp/team-all
// and /dev/pdp/overhaul (same loadSalonDetailWithStatus + real "cuts-and-culture" fixture, same
// English review-banner-over-real-German-content pattern) and to /dev/home-fix (same `?v=` Link
// switcher over a server component, so the direction is shareable/bookmarkable, not client state).
//
// Built for `_design-system/CONTROL_ELEVATION.md`'s "THE SEE-ALL / CTA LADDER" (owner 2026-07-24:
// "we have multiple CTA variations, we need ONE principle variation"). SeeAllButton.tsx exports
// "pill" | "pill-outline" | "link"; pill-outline was already deprecated to resolve to "pill" earlier
// the same day. This page renders the SAME three real list sections (Services / Team / Bewertungen
// for the real salon "cuts-and-culture") three times over, varying only the see-all treatment, so
// the owner can confirm or overturn the ladder's rung-3 default against a real render instead of
// prose.
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadSalonDetailWithStatus } from "@/lib/salon-detail";
import { SeeAllDirections, type Direction } from "./_parts/SeeAllDirections";

const FIXTURE_SLUG = "cuts-and-culture";

const DIRECTIONS: { key: Direction; short: string; description: string }[] = [
  {
    key: "1",
    short: "V1 Centred pill",
    description:
      "One gray sunken pill, centred under every list, everywhere, including where a top-right link is used today.",
  },
  {
    key: "2",
    short: "V2 Top-right link",
    description:
      "The see-all always sits on the section header, right-aligned beside the title, as ink text plus a chevron. No pill under any list.",
  },
  {
    key: "3",
    short: "V3 Hybrid by intent",
    description:
      "Treatment follows what the button does: a list that expands in place gets the centred pill, a list that navigates gets the top-right link. Labeled per section below.",
  },
];

export default async function SeeAllDirectionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const { locale } = await params;
  const sp = await searchParams;
  const v: Direction = sp.v === "2" ? "2" : sp.v === "3" ? "3" : "1";

  const result = await loadSalonDetailWithStatus(FIXTURE_SLUG, locale);
  if (!result) notFound();
  const { salon } = result;

  return (
    <div className="min-h-screen bg-white pb-16">
      {/* Review banner, plain English context for the owner, not part of any real PDP. */}
      <div className="border-b border-s-border bg-s-bg-sunken px-4 py-5 md:px-6 md:py-6">
        <div className="mx-auto max-w-[640px]">
          <p className="font-body text-[12px] font-semibold text-s-ink-2">Solen, /dev/seeall</p>
          <h1 className="mt-1 font-display text-[18px] font-semibold tracking-[-0.01em] text-s-ink">
            See-all button, 3 directions, real data for &quot;{salon.name}&quot;
          </h1>
          <p className="mt-2 font-body text-[13px] text-s-ink-2">
            SeeAllButton.tsx ships three variants today, chosen by which surface happened to build
            them, not by one rule. Pick ONE canonical treatment below, applied to the same three
            real list sections every time.
          </p>

          {/* Direction switcher, ?v=1|2|3, shareable and bookmarkable (same Link-based pattern as
              /dev/home-fix's ?v= toggle). Active = white tile on this sunken banner (the locked
              "tile on a gray tray = white, no shadow" depth rule), never blue or black fill. */}
          <div className="mt-4 flex flex-wrap gap-2">
            {DIRECTIONS.map((d) => (
              <Link
                key={d.key}
                href={`?v=${d.key}` /* selected-ok: dev-only preview toolbar toggle between see-all directions, not a customer-facing chip/filter */}
                scroll={false}
                aria-current={v === d.key ? "true" : undefined}
                className={`inline-flex h-11 items-center whitespace-nowrap rounded-full border px-4 font-body text-[13px] font-semibold transition-colors ${
                  v === d.key
                    ? "border-s-border bg-white text-s-ink"
                    : "border-transparent bg-transparent text-s-ink-2 hover:text-s-ink"
                }`}
              >
                {d.short}
              </Link>
            ))}
          </div>

          {/* One-line description per direction, active one emphasized. */}
          <ul className="mt-3 flex flex-col gap-1">
            {DIRECTIONS.map((d) => (
              <li
                key={d.key}
                className={`font-body text-[12px] ${
                  v === d.key ? "font-semibold text-s-ink" : "text-s-ink-2"
                }`}
              >
                {d.short}: {d.description}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* The three real list sections, in context, stacked. Only the see-all placement varies. */}
      <div className="mx-auto mt-8 max-w-[640px] px-4 md:px-6">
        <SeeAllDirections direction={v} salon={salon} locale={locale} />
      </div>

      {/* Recommendation, MY chrome (English), not shipped copy. */}
      <div className="mx-auto mt-10 max-w-[640px] px-4 md:px-6">
        <div className="rounded-[16px] border border-s-border bg-s-bg-sunken p-5">
          <p className="font-body text-[12px] font-semibold text-s-ink-2">Recommendation</p>
          <p className="mt-1.5 font-body text-[13.5px] leading-relaxed text-s-ink-2">
            <span className="font-semibold text-s-ink">V1, centred pill, everywhere.</span> The ask
            was for ONE principle, and the CTA ladder in CONTROL_ELEVATION.md independently lands on
            the same answer: a see-all is rung 3 (expand or navigate a list), never rung 2&apos;s
            link-weight, so it should look identical no matter which list it sits under. V2
            under-signals Services, the one section that leads straight into booking, by shrinking
            it to a header link most people skim past before reading the list below it. V3&apos;s
            split is elegant on paper, but every see-all on the real PDP already navigates today
            (services to booking, team to the team page, reviews to the reviews page), so unless
            reviews genuinely learn to expand in place, V3 quietly collapses back into V2 the moment
            it ships, a second look with no reason a visitor can see is the exact inconsistency this
            exercise exists to remove. One thing worth checking on the render above: Team moved OFF
            the pill on 2026-07-19 specifically because it read too big next to its avatar row, so
            look closely at V1&apos;s Team section. If that crowding shows up again, that is the
            concrete case for keeping Team on the link as a scoped exception, not a reason to
            abandon V1 everywhere else.
          </p>
        </div>
      </div>
    </div>
  );
}
