// exists-check: `npm run exists flatness` = 0 hits. Net-new dev route.
//
// This page is the visual, non-technical companion to
// _design-system/research/FLATNESS_DIAGNOSIS_2026-07-25.md , the owner cannot act on a
// markdown diagnosis, so this SHOWS the measured cause instead of describing it. Four
// side-by-side "Today" vs "With range" demonstrations; each pair renders IDENTICAL content,
// only the treatment (weight / size / imagery / shadow) differs. Every number on this page is
// pasted verbatim from that diagnosis file / `npm run check:floors` (re-run this session,
// confirmed matching), never re-derived.
//
// Scope fence: this single file only, no app/[locale]/dev/flatness/_parts/ needed, everything
// fits comfortably in one page per the task's "keep it tight" brief.

import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { loadSalonDetailWithStatus } from "@/lib/salon-detail";

const H2 = "font-display text-[clamp(18px,2vw,20px)] font-semibold tracking-[-0.02em] text-s-ink";

export default async function FlatnessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const { locale } = await params;

  // Demo 3 (imagery) needs one REAL seeded salon photo, never a grey box , loaded the exact
  // same way the real PDP does (app/[locale]/salon/[slug]/page.tsx).
  const result = await loadSalonDetailWithStatus("cuts-and-culture", locale);
  const photo = result?.salon.gallery_urls[0] ?? null;

  return (
    <main className="min-h-screen bg-white pb-24">
      <div className="mx-auto max-w-[760px] px-5 pt-10 md:px-8">
        <p className="font-body text-[12px] font-semibold text-s-ink-2">Solen, /dev/flatness</p>
        <h1 className="mt-1 font-display text-[28px] font-bold leading-[1.15] tracking-[-0.02em] text-s-ink">
          Why the design looks flat
        </h1>
        <p className="mt-3 max-w-[600px] font-body text-[15px] leading-relaxed text-s-ink-2">
          Emphasis is spent evenly instead of on one thing, so the screen has almost no range,
          and range is what makes a design look finished rather than like a wireframe.
        </p>

        <div className="mt-8">
          <h2 className={H2}>The measured numbers</h2>
          <p className="mt-1 font-body text-[13px] leading-relaxed text-s-ink-2">
            From{" "}
            <code className="font-mono-code rounded-[4px] bg-s-bg-sunken px-1.5 py-0.5 text-[12px] text-s-ink">
              npm run check:floors
            </code>
            , the live checker that reads the rendered page, not a guess.
          </p>
          <div className="mt-3 rounded-card border border-s-border bg-white px-4">
            {RESULTS.map((r) => (
              <ResultRow key={r.surface + r.metric} {...r} />
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-10">
          <EmphasisDemo />
          <SizeRangeDemo />
          <ImageryDemo photo={photo} />
          <DepthDemo />
        </div>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------------------------
// Results table (verbatim numbers, task brief + `npm run check:floors` re-confirmed this session)
// ---------------------------------------------------------------------------------------------

type ResultRowData = { surface: string; metric: string; measured: string; target: string; pass: boolean };

const RESULTS: ResultRowData[] = [
  { surface: "Home", metric: "Imagery share", measured: "4.66%", target: "floor 33%", pass: false },
  { surface: "Home", metric: "Weight share", measured: "50%", target: "ceiling 30%", pass: false },
  { surface: "Home", metric: "Display anchor", measured: "31.2px", target: "floor 28px", pass: true },
  { surface: "PDP", metric: "Imagery share", measured: "34.66%", target: "floor 33%", pass: true },
  { surface: "PDP", metric: "Display anchor", measured: "22px", target: "floor 28px", pass: false },
  { surface: "PDP", metric: "Weight share", measured: "83%", target: "ceiling 30%", pass: false },
  { surface: "PDP", metric: "Anchor ratio", measured: "1.57x", target: "floor 1.8x", pass: false },
];

function ResultRow({ surface, metric, measured, target, pass }: ResultRowData) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-s-border py-2.5 first:border-t-0">
      <div>
        <p className="font-body text-[12px] font-semibold text-s-ink-2">{surface}</p>
        <p className="font-body text-[13px] text-s-ink">{metric}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <p className="font-body text-[12px] tabular-nums text-s-ink-2">
          {measured} <span className="text-s-ink-2">({target})</span>
        </p>
        <StatusPill pass={pass} />
      </div>
    </div>
  );
}

function StatusPill({ pass }: { pass: boolean }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 font-body text-[12px] font-semibold",
        pass ? "bg-s-success-bg text-s-success" : "bg-s-error-bg text-s-error",
      )}
    >
      {pass ? "Pass" : "Fail"}
    </span>
  );
}

// ---------------------------------------------------------------------------------------------
// Shared demo shell
// ---------------------------------------------------------------------------------------------

function DemoWrap({
  index,
  title,
  caption,
  children,
}: {
  index: number;
  title: string;
  caption: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className={H2}>
        {index}. {title}
      </h2>
      <div className="mt-3 rounded-card bg-s-bg-sunken p-4">
        <div className="grid grid-cols-2 gap-3">{children}</div>
      </div>
      <p className="mt-3 font-body text-[13px] leading-relaxed text-s-ink-2">{caption}</p>
    </section>
  );
}

function DemoColumn({
  label,
  flush = false,
  children,
}: {
  label: string;
  flush?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 font-body text-[12px] font-semibold text-s-ink-2">{label}</p>
      <div className={cn("overflow-hidden rounded-panel border border-s-border bg-white", !flush && "p-3")}>
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Demo 1 , emphasis inflation (the core cause)
// ---------------------------------------------------------------------------------------------

const REVIEW = {
  name: "Elena Fischer",
  date: "Jul 18, 2026",
  rating: "5.0",
  // psych-ok: illustrative review-card fixture for this weight/size demo, not a real Solen review.
  count: "48 reviews",
  comment: "Great haircut and such a warm, welcoming team from the moment I walked in.",
};

function EmphasisDemo() {
  return (
    <DemoWrap
      index={1}
      title="Emphasis inflation, the core cause"
      caption="On the real salon page, 86% of text is semibold, so bold stops meaning anything."
    >
      <DemoColumn label="Today">
        {/* type-budget-ok: this column intentionally breaks the 4-size/2-weight ceiling on
            purpose , it IS demo 1's proof of the emphasis-inflation bug (86% semibold on the
            real PDP), not a UI meant to ship. */}
        <div className="flex flex-col gap-2">
          <p className="font-body truncate text-[15px] font-semibold text-s-ink">{REVIEW.name}</p>
          <p className="font-body text-[13px] font-semibold text-s-ink-2">{REVIEW.date}</p>
          <div className="flex items-center gap-1">
            <Star size={14} stroke="none" aria-hidden className="fill-s-star" />
            <span className="font-body text-[14px] font-semibold text-s-ink">{REVIEW.rating}</span>
            <span className="font-body text-[13px] font-normal text-s-ink-2">{REVIEW.count}</span>
          </div>
          <p className="font-body line-clamp-2 text-[14px] font-semibold leading-snug text-s-ink-2">
            {REVIEW.comment}
          </p>
        </div>
      </DemoColumn>
      <DemoColumn label="With range">
        <div className="flex flex-col gap-2">
          <p className="font-body truncate text-[19px] font-semibold text-s-ink">{REVIEW.name}</p>
          <p className="font-body text-[13px] font-normal text-s-ink-2">{REVIEW.date}</p>
          <div className="flex items-center gap-1">
            <Star size={14} stroke="none" aria-hidden className="fill-s-star" />
            <span className="font-body text-[13px] font-normal text-s-ink">{REVIEW.rating}</span>
            <span className="font-body text-[13px] font-normal text-s-ink-2">{REVIEW.count}</span>
          </div>
          <p className="font-body line-clamp-2 text-[13px] font-normal leading-snug text-s-ink-2">
            {REVIEW.comment}
          </p>
        </div>
      </DemoColumn>
    </DemoWrap>
  );
}

// ---------------------------------------------------------------------------------------------
// Demo 2 , size range
// ---------------------------------------------------------------------------------------------

function SizeRangeDemo() {
  return (
    <DemoWrap
      index={2}
      title="Size range"
      caption="Today the biggest text is only 1.57x the body, so nothing wins."
    >
      <DemoColumn label="Today">
        {/* type-budget-ok: reproduces the measured PDP ladder (13/14/15/22, all within ~9px of
            each other), the clustered-size trap this demo exists to show, not a UI meant to
            ship. */}
        <div className="flex flex-col items-start gap-2.5">
          <span className="font-body text-[13px] font-normal text-s-ink">Meta</span>
          <span className="font-body text-[14px] font-normal text-s-ink">Label</span>
          <span className="font-body text-[15px] font-normal text-s-ink">Body</span>
          <span className="font-body text-[22px] font-semibold text-s-ink">Title</span>
        </div>
      </DemoColumn>
      <DemoColumn label="With range">
        <div className="flex flex-col items-start gap-2.5">
          <span className="font-body text-[13px] font-normal text-s-ink">Meta</span>
          <span className="font-body text-[15px] font-normal text-s-ink">Label</span>
          <span className="font-body text-[20px] font-normal text-s-ink">Body</span>
          <span className="font-body text-[30px] font-semibold text-s-ink">Title</span>
        </div>
      </DemoColumn>
    </DemoWrap>
  );
}

// ---------------------------------------------------------------------------------------------
// Demo 3 , imagery (real seeded photo, loaded server-side exactly like the real PDP)
// ---------------------------------------------------------------------------------------------

function FormShape({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2 p-3", className)}>
      <div className="h-6 rounded-[8px] bg-s-bg-sunken" />
      <div className="h-6 rounded-[8px] bg-s-bg-sunken" />
      <div className="h-6 rounded-[8px] bg-s-bg-sunken" />
      <div className="mt-1 h-7 rounded-btn bg-s-ink" />
    </div>
  );
}

function ImageryDemo({ photo }: { photo: string | null }) {
  return (
    <DemoWrap
      index={3}
      title="Imagery"
      caption="Today the first screen is 4.7% photo against a 33% floor, a beauty marketplace opens on an empty form instead of the thing being sold."
    >
      <DemoColumn label="Today" flush>
        <div className="relative aspect-[390/844] w-full bg-white">
          <FormShape className="absolute inset-x-0 top-0" />
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" className="absolute inset-x-0 bottom-0 h-[4.7%] w-full object-cover" />
          )}
        </div>
      </DemoColumn>
      <DemoColumn label="With range" flush>
        <div className="relative aspect-[390/844] w-full bg-white">
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" className="absolute inset-x-0 top-0 h-[33%] w-full object-cover" />
          )}
          <FormShape className="absolute inset-x-0 bottom-0 top-[33%]" />
        </div>
      </DemoColumn>
    </DemoWrap>
  );
}

// ---------------------------------------------------------------------------------------------
// Demo 4 , depth
// ---------------------------------------------------------------------------------------------

function MiniCard({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5 rounded-panel bg-white p-3", className)}>
      <div className="h-8 w-8 shrink-0 rounded-[8px] bg-s-bg-sunken" />
      <div className="min-w-0">
        <p className="font-body truncate text-[13px] font-semibold text-s-ink">Deep conditioning</p>
        <p className="font-body text-[12px] text-s-ink-2">50 min</p>
      </div>
    </div>
  );
}

function DepthDemo() {
  return (
    <DemoWrap
      index={4}
      title="Depth"
      caption="One shadow value means everything sits on the same plane."
    >
      <DemoColumn label="Today">
        {/* demo-intentional: both cards below share the identical faint shadow-card value on
            purpose , that IS demo 4's point, the two cannot be told apart by depth. */}
        <div className="flex flex-col gap-3">
          <MiniCard className="shadow-card" />
          <MiniCard className="shadow-card" />
        </div>
      </DemoColumn>
      <DemoColumn label="With range">
        <div className="flex flex-col gap-3">
          <MiniCard className="border border-s-border" />
          <MiniCard className="shadow-elevation-3" />
        </div>
      </DemoColumn>
    </DemoWrap>
  );
}
