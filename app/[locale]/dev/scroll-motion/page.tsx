// exists-check: `npm run exists "scroll motion condensing top bar frosted"` and `npm run exists
// "frost glass sticky header"` (2026-07-25) both returned 0 matches , net-new /dev mockup route.
// Reference: owner screen recording ScreenRecording_07-25-2026 15-43-36_1.mp4 (X/Twitter profile,
// @60fpsdesign), 5.15s, frames extracted to the session scratchpad at 2fps and read directly
// (10 frames + a contact sheet) before building , the frames are the spec, not re-described from
// memory. Real content via `loadSalonDetailWithStatus`, the SAME loader
// `app/[locale]/salon/[slug]/page.tsx` calls server-side, fixture slug "cuts-and-culture" , the
// same fixture already used by the sibling direction-comparison routes `dev/pdp/overhaul`,
// `dev/pdp/reviews-directions`, `dev/pdp/reviews-filter` (`?salon=` override follows that last
// file's precedent). Dev-only, `notFound()` in production, matching every other `/dev/pdp/*` /
// `/dev/search-morph` route.
// lang-ok: the recommendation paragraph below quotes two REAL production strings verbatim ,
// "Termin buchen" (SalonMobileBookBar.tsx's actual bottom-bar CTA label) and "Buchen" (this
// route's own S3 CondenseBar CTA label, also real, wired to the real booking href). Both are
// cited as evidence inside otherwise-English review prose, the same "real copy" carve-out
// documented at dev/search-model-b/page.tsx , not authored German mockup chrome.

import { notFound } from "next/navigation";
import Link from "next/link";
import { loadSalonDetailWithStatus } from "@/lib/salon-detail";
import { ScrollMotionDemo } from "./_parts/ScrollMotionDemo";
import type { BarVariant } from "./_parts/CondenseBar";
import { cn } from "@/lib/utils";

const FIXTURE_SLUG = "cuts-and-culture";

const DIRECTIONS: { key: BarVariant; label: string; desc: string }[] = [
  {
    key: "1",
    label: "S1 , Frost only",
    desc: "The bar stays minimal (back + share + heart) and only gains a frosted translucent background as you scroll. No title ever moves in , the most restrained reading.",
  },
  {
    key: "2",
    label: "S2 , Frost + title",
    desc: "Frost appears, then the salon name (with its rating) slides up into the bar as the real title scrolls out of view. No action button added.",
  },
  {
    key: "3",
    label: "S3 , Frost + title + action",
    desc: "Frost, title, AND a compact booking action appear, so a commit action is always reachable. The share icon steps aside to make room once the action lands.",
  },
];

export default async function ScrollMotionPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ v?: string; salon?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const { locale } = await params;
  const sp = await searchParams;
  const variant: BarVariant = sp.v === "2" ? "2" : sp.v === "3" ? "3" : "1";
  const slug = sp.salon?.trim() || FIXTURE_SLUG;

  const result = await loadSalonDetailWithStatus(slug, locale);
  if (!result) notFound();
  const { salon, openStatus } = result;

  const active = DIRECTIONS.find((d) => d.key === variant) ?? DIRECTIONS[0];

  return (
    <main className="min-h-screen bg-white">
      <div className="border-b border-s-border">
        <div className="mx-auto max-w-[600px] px-4 py-6">
          <p className="font-body text-[12px] font-semibold text-s-ink-2">Solen , /dev/scroll-motion</p>
          <h1 className="mt-1 font-display text-[20px] font-semibold tracking-[-0.01em] text-s-ink">
            Scroll-linked condensing top bar , 3 directions
          </h1>
          <p className="mt-2 font-body text-[13px] text-s-ink-2">
            Reference: a recorded X/Twitter profile scroll , the bar over the header photo gains a
            frosted background, then the title slides in, then a compact action appears, all
            continuous and scroll-linked, never a threshold snap. Demoed on real data for &quot;
            {salon.name}&quot;, loaded live via loadSalonDetailWithStatus (real photos, services,
            team, reviews, not lorem). Scroll the panel below to feel each direction.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {DIRECTIONS.map((d) => (
              <Link
                key={d.key}
                href={`?v=${d.key}`}
                className={cn(
                  "rounded-full border px-4 py-2 font-body text-[13px] font-semibold transition-colors",
                  variant === d.key
                    ? "border-s-border bg-s-bg-sunken text-s-ink"
                    : "border-s-border bg-white text-s-ink-2 hover:text-s-ink",
                )}
              >
                {d.label}
              </Link>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-s-border bg-white p-4">
            <h2 className="font-body text-[14px] font-semibold text-s-ink">{active.label}</h2>
            <p className="mt-1 font-body text-[13px] text-s-ink-2">{active.desc}</p>
          </div>
        </div>
      </div>

      <ScrollMotionDemo variant={variant} salon={salon} openStatus={openStatus} locale={locale} />

      <div className="border-t border-s-border">
        <div className="mx-auto max-w-[600px] px-4 py-8">
          <p className="rounded-2xl bg-s-bg-sunken px-4 py-3 font-body text-[13px] text-s-ink-2">
            <span className="font-semibold text-s-ink">Recommendation: S2 (Frost + title).</span>{" "}
            Solen&apos;s real PDP already shows the salon name once you scroll past the hero (today,
            as a binary opaque swap in SalonStickyTabNav), and it already keeps booking reachable via
            the always-on-screen bottom booking bar (real label: &quot;Termin buchen&quot;). S2
            upgrades the existing name-on-scroll moment to a continuous, frosted transition with no
            loss of information, without adding a second, redundant booking action that duplicates
            what the bottom bar already owns. S1 is the strongest runner-up for a more editorial,
            photo-forward feel, but it drops the orientation cue (salon name) that production already
            provides once you are deep in Reviews or Team. S3 imports the reference most literally,
            but on THIS page it means two simultaneous booking affordances on screen at once (top
            &quot;Buchen&quot; pill + bottom bar) and forces the share icon out to make room , worth
            it only if the owner wants the booking action reachable from a one-thumb reach at the TOP
            too, not just the bottom.
          </p>
        </div>
      </div>
    </main>
  );
}
