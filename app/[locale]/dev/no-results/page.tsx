// exists-check: dev-only mockup route (notFound in prod), net-new. `npm run exists
// no-results-variants` -> 0. C1 (single-CTA) no-results state applied per CAUSE
// (city / date / query / filters) so the recovery action fits why 0 results happened.
// English copy only (mockups are always english). Real Tailwind tokens; shipped state
// = SearchTemplate EmptyState + NoResultsHelper.
"use client";

import { notFound } from "next/navigation";
import {
  Globe,
  MapPinOff,
  CalendarOff,
  SearchX,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";

// The C1 shape (owner-picked): icon + short headline + ONE ink CTA + optional text link.
function C1State({
  Icon,
  headline,
  cta,
  CtaIcon,
  link,
}: {
  Icon: LucideIcon;
  headline: string;
  cta: string;
  CtaIcon?: LucideIcon;
  link?: string;
}) {
  return (
    <div className="flex flex-col items-center px-6 pt-11 pb-9 text-center">
      <div className="grid h-[68px] w-[68px] place-items-center rounded-full bg-s-bg-sunken shadow-[0_2px_8px_rgba(10,10,10,0.06)]">
        <Icon size={30} strokeWidth={1.5} className="text-s-ink" />
      </div>
      <h2 className="font-display mt-5 text-[20px] font-semibold leading-snug tracking-[-0.02em] text-s-ink">
        {headline}
      </h2>
      <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-btn bg-s-ink px-6 py-3.5 text-[15px] font-semibold text-white transition-colors duration-150 hover:bg-black">
        {CtaIcon ? <CtaIcon size={18} strokeWidth={2} /> : null}
        {cta}
      </button>
      {link ? (
        <button className="mt-4 text-[14px] font-medium text-s-accent hover:underline">{link}</button>
      ) : null}
    </div>
  );
}

const CAUSES: { key: string; label: string; note: string; state: React.ReactNode }[] = [
  {
    key: "city",
    label: "Cause: no supply in the city",
    note: "Drop the city, search nationwide.",
    state: <C1State Icon={MapPinOff} headline="No salons in Bern" cta="Search all of Switzerland" CtaIcon={Globe} link="Browse Coiffeur (8)" />,
  },
  {
    key: "date",
    label: "Cause: nothing free on the date",
    note: "Drop the date filter.",
    state: <C1State Icon={CalendarOff} headline="Nothing free on Sat, 5 Jul" cta="Show any date" link="Pick another day" />,
  },
  {
    key: "query",
    label: "Cause: query miss / typo",
    note: "Broaden + did-you-mean.",
    state: <C1State Icon={SearchX} headline={'No results for "keratin"'} cta="Search everywhere" CtaIcon={Globe} link="Did you mean Coiffeur? (8)" />,
  },
  {
    key: "filters",
    label: "Cause: filters too tight",
    note: "One tap to reset.",
    state: <C1State Icon={SlidersHorizontal} headline="No salons match your filters" cta="Clear filters" />,
  },
];

export default function NoResultsStatesPage() {
  if (process.env.NODE_ENV === "production") notFound(); // dev preview only

  return (
    <div className="min-h-screen bg-s-bg-sunken px-4 py-10">
      <div className="mx-auto max-w-[440px]">
        <h1 className="font-display text-[24px] font-bold tracking-[-0.02em] text-s-ink">
          No-results states by cause
        </h1>
        <p className="font-body mt-2 text-[14px] text-s-ink-2">
          C1 shape, one recovery action per reason there are 0 results.
        </p>
        <div className="mt-8 flex flex-col gap-10">
          {CAUSES.map((c) => (
            <div key={c.key}>
              <div className="mb-2">
                <div className="font-body text-[13px] font-semibold text-s-ink">{c.label}</div>
                <div className="font-body text-[12px] text-s-ink-2">{c.note}</div>
              </div>
              <div className="overflow-hidden rounded-[28px] border border-s-border bg-white">
                {c.state}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
