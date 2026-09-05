// exists-check: `npm run exists report` (this session) surfaces only the admin queue mockup
// (dev/reports-view, a DIFFERENT screen, built by mistake for this same brief last time) and
// the unrelated booking-dispute flow (bookings/[id]/report). No customer-facing report SCREEN
// exists anywhere: the real trigger, components-legacy/discovery/ReportButton.tsx, is a bare
// Modal + RadioGroup + Textarea with an empty submitted state (setOpen(false) + a boolean,
// no confirmation content at all). That emptiness is the actual complaint this route mocks.
// Net-new dev route, scoped to app/[locale]/dev/report-flow/ only; does not touch
// ReportButton.tsx, app/api/**, lib/**, or app/[locale]/dashboard/**.
//
// Owner ask (verbatim): "what I mean by make a mockup is that when a person should report,
// like that screen, I wanna mockup because they're not just empty, right, and no back end."
// Three genuinely different interaction models for the SAME real review target, switch with
// ?v=1|2|3, jump to any of the 3 real beats with ?step=reason|detail|done. Nothing here calls
// POST /api/reports; "Send report" only flips local React state to the confirmation beat.

import { notFound } from "next/navigation";
import Link from "next/link";
import { loadSalonDetailWithStatus } from "@/lib/salon-detail";
import { cn } from "@/lib/utils";
import { formatEnglishDate } from "./_parts/data";
import type { ReportedReview, Step } from "./_parts/types";
import { D1OneSheet } from "./_parts/D1OneSheet";
import { D2TwoStepSheet } from "./_parts/D2TwoStepSheet";
import { D3FullPage } from "./_parts/D3FullPage";

const FIXTURE_SLUG = "cuts-and-culture";

const DIRECTIONS = [
  {
    key: "1",
    label: "D1, One sheet",
    desc: "A single bottom sheet: pick a reason, add an optional note, one commit button, then the sheet's own content swaps to the confirmation in place. Fewest taps, least ceremony; reason and detail live on the same screen, so the Detail pill above shows the same view as Reason.",
  },
  {
    key: "2",
    label: "D2, Two-step sheet",
    desc: "Reason on its own step, then a dedicated second step for detail plus a plain-language summary of what gets sent, then confirmation. Slower than D1, but the user sees exactly what they are about to submit before committing, which suits an accusation.",
  },
  {
    key: "3",
    label: "D3, Full page",
    desc: "Report is its own route, not a sheet: the reported content stays pinned at the top for certainty, reasons render as a full list, detail sits below, then a full confirmation screen. Most serious in tone, most room for the what-happens-next copy; reason and detail again share one page, so the Detail pill shows the same view as Reason.",
  },
] as const;

const STEPS: { key: Step; label: string }[] = [
  { key: "reason", label: "1 Reason" },
  { key: "detail", label: "2 Detail" },
  { key: "done", label: "3 Submitted" },
];

export default async function ReportFlowDevPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ v?: string; step?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const { locale } = await params;
  const sp = await searchParams;
  const v: "1" | "2" | "3" = sp.v === "2" ? "2" : sp.v === "3" ? "3" : "1";
  const step: Step = sp.step === "detail" ? "detail" : sp.step === "done" ? "done" : "reason";
  // A fresh load (no ?step= at all) shows the realistic CLOSED entry point (the review row +
  // Flag button). Any explicit "Jump to beat" click, including "1 Reason", opens straight to
  // that beat, so the pill visibly does something , without this, ?step=reason was
  // indistinguishable from no param at all, the sheet stayed closed either way.
  const stepRequested = sp.step === "reason" || sp.step === "detail" || sp.step === "done";
  const active = DIRECTIONS.find((d) => d.key === v) ?? DIRECTIONS[0];

  const result = await loadSalonDetailWithStatus(FIXTURE_SLUG, locale);
  if (!result) notFound();
  const { salon } = result;

  // Same "has real identity" test as SalonReviews.tsx's hasIdentity(): a review with text
  // AND a real reviewer name reads best in a report-target preview. Falls back to any review
  // with text, then to a clearly-labelled representative example (brief-mandated fallback).
  const withIdentity = salon.reviews.find(
    (r) => Boolean(r.comment ?? r.comment_de ?? r.comment_en) && Boolean(r.profiles?.display_name)
  );
  const withComment = salon.reviews.find((r) => Boolean(r.comment ?? r.comment_de ?? r.comment_en));
  const picked = withIdentity ?? withComment ?? null;

  const review: ReportedReview = picked
    ? {
        id: picked.id,
        authorName: picked.profiles?.display_name ?? "Anonymous",
        authorAvatarUrl: picked.profiles?.avatar_url ?? null,
        rating: picked.rating,
        comment: (picked.comment ?? picked.comment_de ?? picked.comment_en ?? "").trim(),
        createdAtLabel: formatEnglishDate(picked.created_at),
        isRepresentative: false,
      }
    : {
        id: "representative-example",
        authorName: "Nina K.",
        authorAvatarUrl: null,
        rating: 2,
        comment:
          "Representative example: cuts-and-culture has no review text loaded in this environment, so this stands in for a real one.",
        createdAtLabel: formatEnglishDate(new Date().toISOString()),
        isRepresentative: true,
      };

  return (
    <main className="min-h-screen bg-white pb-24">
      <div className="mx-auto max-w-[640px] px-5 pt-10 md:px-8">
        <p className="font-body text-[12px] font-semibold text-s-ink-2">Solen, /dev/report-flow</p>
        <h1 className="mt-1 font-display text-[22px] font-bold tracking-[-0.02em] text-s-ink">
          Customer report screen, 3 directions
        </h1>
        <p className="mt-2 font-body text-[13px] leading-relaxed text-s-ink-2">
          What a customer sees after tapping Report on a review. Real reasons/target-type
          taxonomy from lib/content-reports.ts, real copy from messages/en.json (report.*), real
          review data for &quot;{salon.name}&quot; loaded server-side the way the real PDP does.
          Nothing here writes to content_reports; Send report only flips local state to the
          confirmation beat. The shipped screen renders German through i18n; this mockup stays
          English per the mockup-english rule.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {DIRECTIONS.map((d) => (
            <Link
              key={d.key}
              href={`?v=${d.key}&step=${step}`}
              className={cn(
                "rounded-full border px-4 py-2.5 font-body text-[13px] font-semibold transition-colors",
                v === d.key
                  ? "border-s-border bg-s-bg-sunken text-s-ink"
                  : "border-s-border bg-white text-s-ink-2 hover:text-s-ink"
              )}
            >
              {d.label}
            </Link>
          ))}
        </div>
        <div className="mt-3 rounded-card border border-s-border bg-white p-4">
          <h2 className="font-body text-[14px] font-semibold text-s-ink">{active.label}</h2>
          <p className="mt-1 font-body text-[13px] leading-relaxed text-s-ink-2">{active.desc}</p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="font-body text-[12px] font-semibold text-s-ink-2">Jump to beat</span>
          {STEPS.map((s) => (
            <Link
              key={s.key}
              href={`?v=${v}&step=${s.key}`}
              className={cn(
                "rounded-full border px-3 py-1.5 font-body text-[12px] font-semibold transition-colors",
                step === s.key
                  ? "border-s-border bg-s-bg-sunken text-s-ink"
                  : "border-s-border bg-white text-s-ink-2 hover:text-s-ink"
              )}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-[450px] rounded-[24px] border border-s-border bg-s-bg-sunken p-3">
        <div className="mx-auto max-w-[402px]">
          {v === "1" && <D1OneSheet review={review} initialStep={step} initialOpen={stepRequested} />}
          {v === "2" && <D2TwoStepSheet review={review} initialStep={step} initialOpen={stepRequested} />}
          {v === "3" && <D3FullPage review={review} initialStep={step} initialOpen={stepRequested} />}
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-[640px] px-5 md:px-8">
        <p className="rounded-card bg-s-bg-sunken px-4 py-3.5 font-body text-[13px] leading-relaxed text-s-ink-2">
          <span className="font-semibold text-s-ink">Recommendation: D2, Two-step sheet.</span>{" "}
          Reporting content is an accusation, and D1&apos;s one-screen speed makes it too easy to
          fire off a reason without a moment to reconsider, which produces more mis-fired reports
          and leaves the reporter less sure it was handled correctly. D3&apos;s full-page context
          switch is the opposite problem: it pulls the user completely out of the reviews they
          were reading for what is, in practice, a rare, incidental action, so the weight of a
          whole new route is disproportionate to how often this control actually gets used. D2
          keeps the lightweight sheet model appropriate for an occasional action, but still forces
          a real second step where the user sees exactly what reason and detail are about to be
          sent before they commit, which matches the seriousness of the action without leaving
          the page.
        </p>
      </div>
    </main>
  );
}
