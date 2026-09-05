// exists-check: `npm run exists team-all` (2026-07-24) = 0 matches for a route (only this
// session's own new TeamAllOverhaul.tsx component). Same fixture-loading pattern as
// app/[locale]/dev/pdp/overhaul/page.tsx (loadSalonDetailWithStatus + an optional `?salon=`
// override), so this screen can be reviewed against any real salon's staff list, not just the
// default fixture. Net-new client tree lives in ../_overhaul/TeamAllOverhaul.tsx.

import { notFound } from "next/navigation";
import { loadSalonDetailWithStatus } from "@/lib/salon-detail";
import { TeamAllOverhaul } from "../_overhaul/TeamAllOverhaul";

const FIXTURE_SLUG = "cuts-and-culture";

export default async function TeamAllPage({
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
  const { salon } = result;

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-s-border bg-s-bg-sunken px-4 py-4 md:px-6">
        <div className="mx-auto max-w-[720px]">
          <p className="font-body text-[12px] font-semibold text-s-ink-2">Solen , /dev/pdp/team-all</p>
          <h2 className="mt-1 font-display text-[18px] font-semibold tracking-[-0.01em] text-s-ink">
            Team &quot;see all&quot; (T5/T6/T7) , real staff for &quot;{salon.name}&quot;
          </h2>
          <p className="mt-2 font-body text-[13px] text-s-ink-2">
            This is where the Team section&apos;s &quot;see all&quot; now navigates, instead of doing
            nothing. &quot;No preference&quot; and every stylist&apos;s &quot;Select&quot; button
            route into the real booking wizard (the wizard already reads and validates a
            <code className="mx-1 rounded bg-white px-1 py-0.5 text-[12px]">?staff=</code>
            preselect). &quot;View profile&quot; opens the real staff profile route.
          </p>
        </div>
      </div>

      <TeamAllOverhaul staff={salon.staff} slug={salon.slug} locale={locale} />
    </div>
  );
}
