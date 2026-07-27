// exists-check: `npm run exists reports-view` = 0 hits. `npm run exists content_reports` = 1
// hit, the live table (0 rows, RLS on) this page renders sample rows for; see _parts/data.ts
// for the full schema-vs-brief note. No existing admin report/moderation UI exists anywhere in
// the app (`npm run exists report` only surfaces the unrelated customer booking-dispute report
// flow at /bookings/[id]/report). Net-new dev route, scoped to app/[locale]/dev/reports-view/
// per the task's scope fence; does not touch app/[locale]/dashboard/**, app/api/**, or lib/**.
//
// Owner ask: "think of ui make mockup for report view" for the admin screen that works through
// content_reports. Three genuinely different queue models below, switch with ?v=1|2|3.

import { notFound } from "next/navigation";
import Link from "next/link";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { R1Triage } from "./_parts/R1Triage";
import { R2CaseCard } from "./_parts/R2CaseCard";
import { R3SplitInbox } from "./_parts/R3SplitInbox";

const DIRECTIONS = [
  {
    key: "1",
    label: "R1, Triage queue",
    title: "R1, Triage queue",
    desc: "A dense list built for volume: target-type icon, reason, age, reporter and status per row. Tap a row to expand it in place for the reported content and the action buttons. Optimized for scanning fifty-plus reports fast.",
  },
  {
    key: "2",
    label: "R2, Case card",
    title: "R2, Case card",
    desc: "One report at a time with full context: the reported content rendered as the customer sees it, the reporter's stated reason and details, target metadata, and the actions as a clear commit row. A Next case affordance moves through the queue. Optimized for judging correctly, not fast.",
  },
  {
    key: "3",
    label: "R3, Split inbox",
    title: "R3, Split inbox",
    desc: "A narrow scannable list on the left, the selected case's full detail on the right. Stacks to list-then-detail on mobile. Optimized for both scanning and judgment, at the cost of density on small screens.",
  },
] as const;

export default async function ReportsViewDevPage({
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const sp = await searchParams;
  const v: "1" | "2" | "3" = sp.v === "2" ? "2" : sp.v === "3" ? "3" : "1";
  const active = DIRECTIONS.find((d) => d.key === v) ?? DIRECTIONS[0];

  return (
    <main className="min-h-screen bg-white pb-24">
      <div className="mx-auto max-w-[900px] px-5 pt-10 md:px-8">
        <p className="font-body text-[12px] font-semibold text-s-ink-2">Solen, /dev/reports-view</p>
        <h1 className="mt-1 font-display text-[22px] font-bold tracking-[-0.02em] text-s-ink">
          Admin report view, 3 directions
        </h1>
        <p className="mt-2 font-body text-[13px] leading-relaxed text-s-ink-2">
          The screen an admin uses to work through user-submitted content reports
          (content_reports: reviews, salons, users). Three genuinely different working models,
          pick one with ?v=1|2|3.
        </p>

        <div className="mt-4 flex items-start gap-2.5 rounded-card border border-s-border bg-s-bg-sunken px-4 py-3">
          <Info size={15} strokeWidth={2} className="mt-0.5 shrink-0 text-s-ink-2" aria-hidden />
          <p className="font-body text-[12px] leading-relaxed text-s-ink-2">
            Sample rows: content_reports has 0 rows in dev. The 10 reports below are
            representative examples, not live data, and interacting with Dismiss / Mark
            reviewing / Hide content only updates this page&apos;s local state, nothing is
            written to the database.
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {DIRECTIONS.map((d) => (
            <Link
              key={d.key}
              href={`?v=${d.key}`}
              className={cn(
                "rounded-full border px-4 py-2.5 font-body text-[13px] font-semibold transition-colors",
                v === d.key
                  ? "border-s-border bg-s-bg-sunken text-s-ink"
                  : "border-s-border bg-white text-s-ink-2 hover:text-s-ink",
              )}
            >
              {d.label}
            </Link>
          ))}
        </div>

        <div className="mt-4 rounded-card border border-s-border bg-white p-4">
          <h2 className="font-body text-[14px] font-semibold text-s-ink">{active.title}</h2>
          <p className="mt-1 font-body text-[13px] leading-relaxed text-s-ink-2">{active.desc}</p>
        </div>
      </div>

      <div className="mt-8">
        {v === "1" && <R1Triage />}
        {v === "2" && <R2CaseCard />}
        {v === "3" && <R3SplitInbox />}
      </div>

      <div className="mx-auto mt-10 max-w-[900px] px-5 md:px-8">
        <p className="rounded-card bg-s-bg-sunken px-4 py-3.5 font-body text-[13px] leading-relaxed text-s-ink-2">
          <span className="font-semibold text-s-ink">Recommendation: R3, Split inbox.</span>{" "}
          It is the only direction that keeps queue-level awareness (which reports are old and
          still open, at a glance) and full per-case judgment context on the same screen,
          without R1&apos;s per-row expand/collapse tax or R2&apos;s full step-by-step
          navigation cost. It is also the pattern professional moderation and support tools
          converge on for exactly this scan-versus-judge tension, because that work happens at
          a desk, not on a phone, so R3&apos;s one real weakness, density on small screens,
          rarely applies to how this screen actually gets used.
        </p>
      </div>
    </main>
  );
}
