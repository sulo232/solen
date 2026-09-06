/**
 * Exists-check: `npm run exists directions-0905-r3` (run this turn) returned 21 page routes
 * (app/[locale]/dev/directions-0905-r3/<slug>/<a|b|c>/page.tsx across seven screen slugs, all seven
 * of which are indexed below) plus 14 inline page-section
 * hits and 29 shared component hits, all inside this same directions-0905-r3 tree. Zero REMOVED.md
 * hits. No top-level index for this round existed before this file. The only net-new thing here is
 * this index page itself; every route it links to already exists and is untouched.
 *
 * Grounded-in: app/[locale]/dev/directions-0905-r3/confirmation/a/page.tsx (one of the 21 real,
 * already-built, already-reviewed candidate routes this index links to and screenshots; every
 * href and image path below resolves to a sibling file under this same directions-0905-r3 tree,
 * nothing hand-drawn). Mechanics only (scroll-only structure, no tabs, no switcher, no iframe,
 * English, sized next/image thumbnails, min-w-0 so nothing scrolls sideways at 390px) came from
 * reading the immediately prior round's own index page, and explicitly NOT its opening structure
 * or explainer framing, which he could not read on sight. Content is pulled from the round-3
 * arbiter's report and the round-3 value-sheet plan (both read whole this pass).
 *
 * Depicts: this index page's own UI -> NET-NEW: aggregates the 21 already-built, already-reviewed
 * app/[locale]/dev/directions-0905-r3/<slug>/<a|b|c>/page.tsx routes into one scroll-only comparison;
 * draws no product feature of its own (no pill, card, or button styling).
 *
 * Type budget (this round's instruction): 28px anchor, 18px section heading, 14px body, 12px meta,
 * weights 400 and 500 only, nowhere else on the page.
 *
 * Reference-checked: _design-system/references/fresha--look-recipes.md,
 * _design-system/references/airbnb--look-recipe.md,
 * _design-system/references/treatwell--look-recipes.md (all three read this pass; every
 * Fresha/Treatwell/Airbnb line in the Decisions section below is copied from these captures,
 * none from memory).
 *
 * SCOPE NOTE, RESOLVED: this index originally shipped six of seven screens because the seventh
 * screen's plain-English lines happened to match a _design-system/REMOVED.md graveyard entry for a
 * killed round-2 batch of directions on the same general topic. The orchestrator has since scoped
 * that graveyard entry's keyword down to the round-2 batch by name, so it no longer collides with
 * this file's own, separate, already-built round-3 candidates for the seventh screen, which are now
 * indexed below in the position the brief gave them, after Profile and before Category pills.
 */
import Image from "next/image";
import Link from "next/link";

type Candidate = "a" | "b" | "c";
const CANDIDATE_LABEL: Record<Candidate, string> = { a: "A", b: "B", c: "C" };
const CANDIDATES: Candidate[] = ["a", "b", "c"];

interface ScreenSpec {
  slug: string;
  title: string;
  recommended: Candidate;
  /** Set only when the arbiter's by-eye winner differs from `recommended`. */
  bestByEye?: Candidate;
  lines: Record<Candidate, string>;
}

const SCREENS: ScreenSpec[] = [
  {
    slug: "confirmation",
    title: "Booking confirmation",
    recommended: "a",
    bestByEye: "b",
    lines: {
      a: "the photo runs the full width at the top, then the date, then the steps as plain rows on a thin line, no boxes at all.",
      b: "the photo runs the full width at the top, then everything below it sits inside three separate boxes.",
      c: "the photo sits inside a rounded box like a card in an app, the steps are in one box, and the “Confirmed” tag is grey instead of green.",
    },
  },
  {
    slug: "search-results",
    title: "Search results",
    recommended: "a",
    lines: {
      a: "no box around each salon, the three prices sit together in one grey block.",
      b: "a white box around each salon with a soft shadow, and the three prices sit in three separate grey blocks.",
      c: "no box around each salon, the three prices sit in one block with a thin outline instead of a grey fill.",
    },
  },
  {
    slug: "bookings-list",
    title: "Bookings list",
    recommended: "a",
    lines: {
      a: "one outlined box for the next visit, the older ones are plain rows separated by thin lines, and its photo is black and white where the other two are in colour.",
      b: "a soft-shadowed box for the next visit and a separate box around every older booking too.",
      c: "same boxes as B but rounder, the buttons are grey rectangles instead of outlines, and every status tag is grey, so “Cancelled” looks the same as “Confirmed”.",
    },
  },
  {
    slug: "payment-step",
    title: "Review and pay",
    recommended: "a",
    bestByEye: "c",
    lines: {
      a: "one outlined box holds the booking, the payment choice sits loose below it, and the bottom bar has no line above it.",
      b: "exactly what you already approved, unchanged.",
      c: "the boxes are rounder and float on a soft shadow, and the pay button is a rectangle instead of a capsule.",
    },
  },
  {
    slug: "profile",
    title: "Profile",
    recommended: "a",
    lines: {
      a: "a sentence at the top tells you when your next visit is, and the appointment sits in one outlined box.",
      b: "your own name is the biggest thing on the screen, and the appointment box is held by a shadow so faint you have to look for it.",
      c: "same sentence as A, but the appointment has no box or line around it at all, so it floats.",
    },
  },
  {
    slug: "empty-states",
    title: "Empty states",
    recommended: "a",
    bestByEye: "c",
    lines: {
      a: "a grey panel, a plain grey rectangle standing in for the missing picture, then the message and a black button.",
      b: "a grey panel, and under it a row of real photos pulled from Inspo, some still showing the TikTok logo.",
      c: "a grey panel with a proper ghost outline of a card, so it looks like a missing item rather than a missing image.",
    },
  },
  {
    slug: "category-pills",
    title: "Category pills",
    recommended: "a",
    lines: {
      a: "the chosen one turns light grey.",
      b: "the chosen one turns black.",
      c: "the chosen one keeps its white fill and only its outline goes black.",
    },
  },
];

interface Decision {
  question: string;
  recommendation: string;
  fresha: string;
  treatwell: string;
  airbnb: string;
  verdict: string;
}

const DECISIONS: Decision[] = [
  {
    question: "The pill and button corner: 16px, the value in the written lock, or the capsule these three builds all use.",
    recommendation:
      "16px, the value already in the written lock. One word from him settles it. None of the three screens below actually show 16px, so whichever pill row he picks here, he has not yet chosen the corner.",
    fresha: "No reference file has a measured Fresha corner radius on any element. That capture is missing, and it is our gap, not his.",
    treatwell: "Filter pill is a true capsule with a visible 1px border in every state; cards and the primary button are 4px. Its own file says not to port this, citing his 2026-08-16 rejection by name.",
    airbnb: "No single answer by design: multi-step CTA 12px, Reserve button a full capsule, filter chip 24px on a 34px control (which reads as a capsule), top-nav tab 40px.",
    verdict: "ASK",
  },
  {
    question: "The chosen pill: keep the light grey fill, or an outline-only treatment.",
    recommendation: "Keep the light grey. It is his own dated call and nothing has beaten it.",
    fresha: "No fill was captured for the chosen option on this row. The booking-flow capture should have recorded one.",
    treatwell: "Every pill carries a 1px border in every state; no chosen-option fill was reachable to measure.",
    airbnb: "Only the border colour changes, light grey to near-black. The fill stays white, the text is unchanged, no checkmark, no bolding.",
    verdict: "SHOW, and it is already built: category pills A, B and C are the three treatments on his phone.",
  },
  {
    question: "Status colour: keep the pale-green “Confirmed”, or go neutral the way one reference does.",
    recommendation: "Keep the pale green. Going neutral costs more than it buys, and this round shows the cost.",
    fresha: "Colour-codes: a pale-lavender chip with a checkmark carries the status on the confirmation, a pale-green form chip elsewhere.",
    treatwell: "No confirmation, appointments list or status screen was reachable, live or on Mobbin. Not invented.",
    airbnb: "Colour never carries the status. Badges read white or dark grey regardless of meaning, and confirmation status renders as plain text with no chip at all.",
    verdict: "SHOW, and it is already built: on C, “Confirmed” and “Cancelled” render as the same grey chip, only the glyph inside differs.",
  },
  {
    question: "Confirmation: photo across the full width, or photo sitting inside a rounded card.",
    recommendation: "Full width. Placement is Fresha's axis under his own rule, and this is a placement question.",
    fresha: "A photo hero spans the full width at the top with the back arrow in a white circle, top left.",
    treatwell: "Not reachable, login-gated and not on Mobbin.",
    airbnb: "The photo sits inside the white receipt card, and the trip card does the same.",
    verdict: "SHOW, and it is already built: confirmation A and confirmation C are the two treatments with everything else held constant.",
  },
  {
    question: "The bookings card photo: the salon's own cover photo, or a map graphic.",
    recommendation: "Not decided this round. Nothing here depends on it, and it is already logged.",
    fresha: "A small map graphic with a location pin, not a venue photo. Its own file already logs this as a conflict, noting the map helps orient a return trip.",
    treatwell: "Not reachable.",
    airbnb: "Uses a destination photo, not a map.",
    verdict: "PARK",
  },
];

function RecommendedTag() {
  return (
    <span className="inline-flex h-6 items-center rounded-full bg-s-bg-sunken px-2.5 text-[12px] font-medium text-s-ink">
      Recommended
    </span>
  );
}

function BestByEyeTag() {
  return (
    <span className="inline-flex h-5 items-center rounded-full border border-s-border px-2 text-[12px] font-normal text-s-ink-2">
      Best by eye on this screen
    </span>
  );
}

function CandidateRow({
  slug,
  candidate,
  line,
  recommended,
  bestByEye,
}: {
  slug: string;
  candidate: Candidate;
  line: string;
  recommended: boolean;
  bestByEye: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Link
        href={`/en/dev/directions-0905-r3/${slug}/${candidate}`}
        className="block min-w-0 overflow-hidden rounded-card border border-s-border"
      >
        <Image
          src={`/_mockups/directions-0905-r3/${slug}-${candidate}-fold.png`}
          alt={`Candidate ${CANDIDATE_LABEL[candidate]}, ${slug}`}
          width={390}
          height={844}
          sizes="(max-width: 640px) 90vw, 358px"
          className="h-auto w-full"
        />
      </Link>
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[14px] font-medium text-s-ink">{CANDIDATE_LABEL[candidate]}</span>
            {recommended ? <RecommendedTag /> : null}
            {bestByEye ? <BestByEyeTag /> : null}
          </div>
          <p className="mt-1 text-[14px] font-normal leading-relaxed text-s-ink-2">{line}</p>
        </div>
      </div>
      <Link
        href={`/en/dev/directions-0905-r3/${slug}/${candidate}`}
        className="inline-flex h-11 w-fit items-center text-[14px] font-normal text-s-accent underline"
      >
        Open on your phone
      </Link>
    </div>
  );
}

function ScreenSection({ screen }: { screen: ScreenSpec }) {
  return (
    <section className="border-t border-s-border px-4 py-8">
      <h2 className="text-[18px] font-medium text-s-ink">{screen.title}</h2>
      <div className="mt-4 flex flex-col gap-6">
        {CANDIDATES.map((c) => (
          <CandidateRow
            key={c}
            slug={screen.slug}
            candidate={c}
            line={screen.lines[c]}
            recommended={screen.recommended === c}
            bestByEye={screen.bestByEye === c && screen.bestByEye !== screen.recommended}
          />
        ))}
      </div>
    </section>
  );
}

function DecisionCard({ d }: { d: Decision }) {
  return (
    <div className="rounded-card border border-s-border p-4">
      <p className="text-[14px] font-medium text-s-ink">{d.question}</p>
      <p className="mt-3 text-[14px] font-normal leading-relaxed text-s-ink-2">
        Recommendation: {d.recommendation}
      </p>
      <p className="mt-3 text-[14px] font-normal leading-relaxed text-s-ink-2">Fresha: {d.fresha}</p>
      <p className="mt-1 text-[14px] font-normal leading-relaxed text-s-ink-2">Treatwell: {d.treatwell}</p>
      <p className="mt-1 text-[14px] font-normal leading-relaxed text-s-ink-2">Airbnb: {d.airbnb}</p>
      <span className="mt-3 inline-flex h-6 items-center rounded-full bg-s-bg-sunken px-2.5 text-[12px] font-medium text-s-ink">
        {d.verdict}
      </span>
    </div>
  );
}

export default function DirectionsR3IndexPage() {
  return (
    <div data-index-scope="directions-0905-r3" className="mx-auto max-w-[600px] bg-white pb-16">
      <div className="px-4 pt-8">
        <h1 className="text-[28px] font-medium text-s-ink">Round 3, 2026-09-06</h1>
        <p className="mt-2 text-[14px] font-normal leading-relaxed text-s-ink-2">
          One system for every screen: each one below is built three times, A, B and C, so you can
          pick the column you want everywhere.
        </p>
      </div>

      <section className="border-t border-s-border px-4 py-8">
        <h2 className="text-[18px] font-medium text-s-ink">The recommendation</h2>
        <p className="mt-3 text-[14px] font-normal leading-relaxed text-s-ink-2">
          Candidate A: no shadows anywhere, one thin grey outline around each record, and thin grey
          lines between groups. It is the only one of the three whose card edge never failed on any
          of the seven screens, and both outside references, Treatwell and Airbnb, put a line around
          a card rather than a shadow under it.
        </p>
        <p className="mt-3 text-[14px] font-normal leading-relaxed text-s-ink-2">
          The cost is real: picking A means editing the review-and-pay screen, the one you already
          approved, since Candidate B renders it byte for byte and A drops its second card and the
          sticky bar&apos;s top line. A also means nothing in the product ever lifts off the page.
        </p>
        <p className="mt-3 text-[14px] font-normal leading-relaxed text-s-ink-2">
          It flips to B if the older bookings should each sit in their own box instead of being
          separated by lines. It flips to C if the payment card looks better with a real shadow, and
          if so the fix is a measured shadow and a bigger radius, not a thicker version of ours.
        </p>
      </section>

      {SCREENS.map((screen) => (
        <ScreenSection key={screen.slug} screen={screen} />
      ))}

      <section className="border-t border-s-border px-4 py-8">
        <h2 className="text-[18px] font-medium text-s-ink">Decisions for him</h2>
        <div className="mt-4 flex flex-col gap-5">
          {DECISIONS.map((d) => (
            <DecisionCard key={d.question} d={d} />
          ))}
        </div>
      </section>
    </div>
  );
}
