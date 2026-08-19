"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Section, SectionFrame, SectionTitle } from "./SectionHeader";
import { HeartButton } from "./HeartButton";
import { cn } from "@/lib/utils";
import { opticalGlyphNudge } from "@/lib/optical";

/**
 * Entdecken preview — V2-D62 (2026-05-15) — TikTok-only homepage variant.
 *
 * Homepage shows TikTok videos only (uniform 9:16 portrait + play button).
 * The full /inspo route (Phase 2) ships the Pinterest mixed-media feed
 * with photo + video tiles at varied aspect ratios — that lives at the
 * destination page, not the homepage preview.
 *
 * Key behaviors carried over from V2-D49g:
 *   1. Center-zoom: card under viewport center scales 1.03 / opacity 1;
 *      neighbors scale 0.88 / opacity 0.6 (mobile) or 0.95 / 0.8 (desktop).
 *   2. Final CTA card "Alle entdecken" with same center-zoom behavior.
 *   3. Aspect-[9/16] portrait, fixed `w-[44vw] max-w-[200px]`.
 *   4. Bottom gradient inside card for overlay-text legibility.
 *
 * V2-D62 deltas vs V2-D49g:
 *   - Demo data: real Unsplash photos (no more `bgGradient` placeholders).
 *   - All entries `isVideo: true` (TikTok-only on homepage).
 *   - Dropped the "Hair · TikTok" top-left tag — redundant when all tiles
 *     are TikTok and the play button already signals video.
 *   - Dropped Bookmark icon — only Heart save (matches salon-card pattern).
 *   - Pills now use V3 liquid-glass recipe (white tint + heavy blur + inset
 *     top highlight + no border), aligned with SalonCard's V2-D61-fu pills.
 */

interface Look {
  slug: string;
  styleName: string;
  /** V3-palette gradient — used as background when no real thumbnail is
   *  available, OR as the visible color while a thumbnail is loading. */
  bgGradient: string;
  /** Real TikTok thumbnail URL when a DB-backed item is rendered. Empty
   *  for the static DEMO fallback. When set, the card shows this image
   *  instead of the gradient. */
  bgImage?: string;
  /** TikTok creator handle from `discovery_items.author_name`. Shown in
   *  the bottom-left pill (prefixed with @) when present; DEMO entries
   *  fall back to the long styleName. */
  authorName?: string;
  /** Lowest price (CHF) from `discovery_items.price_min`, when present , shown right of the creator. */
  price?: number;
}

// V3-D100 (2026-05-22): gradients migrated to 5-stripe Orange identity.
// Each gradient blends two stops from the palette {cream, orange, yellow, navy}
// — paired-color identity. No more cool-hue ladder.
const DEMO: Look[] = [
  { slug: "voluminous-layers", styleName: "Voluminous Layers",  bgGradient: "linear-gradient(150deg, #1a1f2b 0%, #2b3445 100%)" },
  { slug: "cool-hair-life",    styleName: "Cool Hair for Life", bgGradient: "linear-gradient(150deg, #1a1f2b 0%, #2b3445 100%)" },
  { slug: "textured-shag",     styleName: "Textured Shag",      bgGradient: "linear-gradient(150deg, #1a1f2b 0%, #2b3445 100%)" },
  { slug: "layered-butterfly", styleName: "Layered Butterfly",  bgGradient: "linear-gradient(150deg, #1a1f2b 0%, #2b3445 100%)" },
  { slug: "curtain-bangs",     styleName: "Curtain Bangs",      bgGradient: "linear-gradient(150deg, #1a1f2b 0%, #2b3445 100%)" },
  { slug: "wolf-cut",          styleName: "Wolf Cut",           bgGradient: "linear-gradient(150deg, #1a1f2b 0%, #2b3445 100%)" },
  { slug: "soft-balayage",     styleName: "Soft Balayage",      bgGradient: "linear-gradient(150deg, #1a1f2b 0%, #2b3445 100%)" },
];

/** V3-D141 (2026-05-25): SOLID white pill for the bottom-left author/style
 *  label per user "make ths not transparent and match like other pills yk."
 *  Matches the SalonCard `whiteNeutralStyle` family (Top bewertet / Beliebt /
 *  Neu badges) — near-solid white bg + subtle border + small shadow + s-ink
 *  text. The liquid-glass recipe that used to live here was for the centered
 *  play orb + heart, both retired V3-D161/V3-D162 (heart → HeartButton,
 *  play orb → removed). */
const solidLabelStyle = {
  background: "rgba(255, 255, 255, 0.95)",
  border: "1px solid rgba(255, 255, 255, 0.75)",
  backdropFilter: "blur(14px) saturate(1.1)",
  WebkitBackdropFilter: "blur(14px) saturate(1.1)",
  boxShadow: "0 1px 3px rgba(26, 18, 9, 0.10)",
} as const;

export default function Entdecken() {
  // 2026-08-15: this label was a hardcoded German literal, so it rendered German on /en,
  // /fr and /it. Same bug class the owner caught on the recently-viewed row that day.
  const t = useTranslations("home.discover");
  const tTrend = useTranslations("home.trending");
  const locale = useLocale();
  const scrollRef = React.useRef<HTMLDivElement>(null);
  // V3-D160 (2026-05-26): live wire to /api/discovery/feed restored.
  // Pattern lifted from the original DiscoverCarousel.tsx (deleted in
  // commit 3e3ddeb during V3 cleanup). Initial state is DEMO so the
  // section renders instantly with gradient placeholders; the fetch then
  // swaps in real items if the DB returns ≥1 published hair-category
  // TikTok. If the fetch fails or the response is empty, DEMO stays.
  const [looks, setLooks] = React.useState<Look[]>(DEMO);

  // M5 (2026-06-05): per-card thumbnail-error tracking. A CSS `background:
  // url()` has no load/error event, so a failed (expired) TikTok thumb used
  // to silently fall through to the bare gradient layered under it — which
  // read as "broken". We now probe each card's bgImage with a hidden <img>
  // (see the JSX) and, on its onError, flag the slug here. A flagged card
  // renders the branded dark fallback (Solen mark + play glyph + caption)
  // instead of the empty gradient. Keyed by slug; only image-backed cards
  // are ever probed/flagged.
  const [failedThumbs, setFailedThumbs] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/discovery/feed?category=hair&limit=8");
        if (!res.ok) return;
        const json = await res.json();
        const items = Array.isArray(json?.items) ? json.items : [];
        if (cancelled || items.length === 0) return;
        const mapped: Look[] = items.map((item: {
          id: string;
          style_name?: string | null;
          name_de?: string | null;
          name?: string | null;
          author_name?: string | null;
          tiktok_url?: string | null;
          price_min?: number | null;
        }, i: number) => ({
          slug: item.id,
          styleName:
            item.style_name || item.name_de || item.name || "Look",
          bgGradient: DEMO[i % DEMO.length].bgGradient,
          // V3-D160 (2026-05-26): point at the server proxy, not the raw
          // tiktok_thumbnail_url. The stored URL is signed by TikTok's CDN
          // and expires; the proxy re-signs via oEmbed on demand and caches
          // for 1h. Falls back to the gradient layered underneath if the
          // proxy returns 502 (see the layered `background:` in the JSX).
          bgImage: item.tiktok_url
            ? `/api/discovery/thumb/${item.id}`
            : undefined,
          authorName: item.author_name || undefined,
          price: typeof item.price_min === "number" ? item.price_min : undefined,
        }));
        setLooks(mapped);
      } catch (err) {
        console.error("[Entdecken] discovery feed fetch failed:", err);
        // DEMO already in state — no recovery needed.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // V3-D163 (2026-05-26): center-zoom dim retired.
  //
  // Previously an IntersectionObserver tracked the most-centered card and
  // dimmed/shrank the others (scale-0.88 opacity-0.6). The pattern had a
  // dead-edge bug: the first and last cards could never reach geometric
  // center (you can't scroll past 0 or past end), so they stayed
  // permanently dimmed even when on-screen. Cleanest fix was to drop the
  // whole effect — TikTok/Pinterest/Airbnb horizontal feeds don't dim
  // off-center tiles, and the bug + the cost (extra observer + state on
  // every paint) outweighed the flair. Cards now render flat: scale-1,
  // opacity-1 always. Desktop hover bump on cards still active.

  return (
    // V3-D120 (2026-05-24): section bg tint REMOVED per user "remove these
    // color dividing things." Future-state homepage = all-white substrate.
    <Section>
      <SectionFrame>
        <SectionTitle
          title={t("inspirationTitle")}
          link={{ label: `${t("browseAll")} →`, href: `/${locale}/inspo` }}
          scrollRef={scrollRef}
        />
        <div
          ref={scrollRef}
          className={cn(
            "mt-3 flex gap-4 overflow-x-auto py-2",
            "[scroll-snap-type:x_mandatory] [-webkit-overflow-scrolling:touch]",
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            // Negative-margin bleed so cards reach SectionFrame's rounded edge,
            // matched scroll-padding so snap targets align to padding edge.
            "-mx-3 px-3 md:-mx-4 md:px-4",
            "scroll-pl-3 md:scroll-pl-4",
          )}
        >
          {looks.map((look) => {
            // M5 (2026-06-05): a card is in the branded-fallback state when it
            // has a real thumbnail URL that failed to load (expired TikTok
            // CDN signature, proxy 502, etc.). DEMO cards (no bgImage) never
            // enter this state — their gradient IS the intended look.
            const showImage = Boolean(look.bgImage) && !failedThumbs[look.slug];
            const showFallback = Boolean(look.bgImage) && failedThumbs[look.slug];
            return (
              <Link
                key={look.slug}
                href={`/${locale}/inspo/${look.slug}`}
                aria-label={`${look.styleName} – TikTok-Inspo`}
                className="group relative flex flex-col shrink-0 snap-center w-[44vw] max-w-[200px] transition-transform active:scale-[0.97] active:duration-[80ms] focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-4 focus-visible:rounded-[16px]"
              >
                <div
                  className={cn(
                    "relative w-full aspect-[9/16] rounded-[16px] overflow-hidden origin-center",
                    "transition-transform duration-150 ease-glide",
                    // V3-D163: dim/scroll-zoom removed. Cards stay scale-1 +
                    // opacity-1 always; only desktop hover bumps the active
                    // card up. Mobile = flat, no observer.
                    "md:group-hover:scale-[1.03] md:group-hover:z-10",
                  )}
                  style={{
                    // V3-D160 + M5 (2026-06-05): three background states.
                    //   1. showImage  → real thumb on top, brand gradient
                    //      under (covers the brief load gap).
                    //   2. showFallback → the dark Solen brand gradient
                    //      (matches the approved mockup, NOT the colorful
                    //      DEMO gradient) — the branded-fallback surface.
                    //   3. DEMO (no bgImage) → its own colorful gradient.
                    background: showImage
                      ? `url("${look.bgImage}") center/cover no-repeat, ${look.bgGradient}`
                      : showFallback
                        ? "linear-gradient(150deg, #1a1f2b 0%, #2b3445 100%)"
                        : look.bgGradient,
                  }}
                >
                  {/* M5 (2026-06-05): hidden probe — the ONLY reliable way to
                      detect a CSS-background image failure. Renders only while
                      a real thumb is expected and hasn't already failed. On
                      error we flag the slug → card flips to the branded
                      fallback above. aria-hidden + display:none so it adds no
                      layout, no a11y noise, no second visible image. */}
                  {showImage && (
                    <img
                      src={look.bgImage}
                      alt=""
                      aria-hidden
                      className="hidden"
                      onError={() =>
                        setFailedThumbs((prev) =>
                          prev[look.slug] ? prev : { ...prev, [look.slug]: true },
                        )
                      }
                    />
                  )}

                  {/* M5 (2026-06-05): branded fallback chrome — only when a
                      real thumb failed. Dark gradient (above) + Solen mark
                      top-left (accent dot + wordmark) + centered translucent
                      play glyph. Matches public/solen-qa-fixes.html §4. The
                      existing @author / style-name pill + bottom gradient
                      below still render, so the caption is preserved. */}
                  {showFallback && (
                    <>
                      <div
                        aria-hidden
                        className="absolute top-2 left-2 z-10 flex items-center gap-1"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        <span className="font-display text-[12px] font-semibold leading-none text-white/90">
                          Solen
                        </span>
                      </div>
                      <div
                        aria-hidden
                        className="absolute left-1/2 top-1/2 grid h-[34px] w-[34px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
                        style={{
                          background: "rgba(255, 255, 255, 0.22)",
                          backdropFilter: "blur(4px)",
                          WebkitBackdropFilter: "blur(4px)",
                        }}
                      >
                        {/* mockup-ok: owner-approved 2026-07-15 optical nudge (RATIONALE.md:144, lib/optical.ts).
                            Play is asymmetric (a triangle, visual mass toward the point), so flexbox's
                            bounding-box centering reads it off-center. */}
                        <Play size={15} style={{ marginLeft: opticalGlyphNudge(15) }} className="text-white" fill="currentColor" />
                      </div>
                    </>
                  )}
                  {/* Bottom gradient for legibility under the style-name pill */}
                  <div
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"
                  />

                  {/* V3-D162 (2026-05-26): centered play orb removed — it
                      covered the face on every real TikTok thumbnail and
                      over-communicated the "video" affordance that the 9:16
                      portrait format + horizontal carousel + @author pill
                      already signal. Pinterest / Airbnb / Uber Eats all do
                      this on video tiles. */}

                  {/* V3-D161 (2026-05-26): Top-right Heart save —
                      promoted from static glass div to the shared
                      HeartButton component used on SalonCards. Gives the
                      same white-frosted visual, the 44×44 hit target,
                      saved/unsaved toggle with spring pop animation, and
                      the SR-live announcement. Always visible (matches
                      SalonCard behavior — no more desktop-hover-only). */}
                  <HeartButton salonName={look.authorName || look.styleName} />

                  {/* Bottom: style-name pill — liquid-glass.
                      Mobile: always-visible. Desktop: hover-only. */}
                  <div
                    className={cn(
                      "absolute bottom-2 left-2 right-2",
                      "opacity-100 md:opacity-0 group-hover:md:opacity-100 transition-opacity duration-150",
                    )}
                  >
                    <div
                      className="inline-block max-w-[80%] rounded-full px-2.5 py-1"
                      style={solidLabelStyle}
                    >
                      <p className="truncate font-body text-[12px] font-medium text-s-ink">
                        {look.styleName}
                      </p>
                    </div>
                  </div>

                  {/* V3-D165 (2026-05-26): marquee moved bottom-right →
                      top-left (Insta-style header row). The original
                      V3-D164c Insta-calibrated specs are preserved
                      (11px / weight 400 / pure white / natural case /
                      no tracking / two-copy seamless loop) — but a
                      text-shadow is added that Insta doesn't need.
                      Why: Insta's video player has its own UI chrome
                      darkening the top edge. Our card has no top
                      gradient overlay (the bottom gradient at h-1/2
                      only darkens the lower half), so white text in
                      the top corner needs its own legibility crutch
                      against potentially-bright photo content.
                      M5 (2026-06-05): hidden on the branded-fallback state —
                      the Solen mark takes the top-left slot there and the
                      centered play glyph already signals video, so the
                      marquee would both collide and double up. */}
                  {!showFallback && (
                  <div
                    // V3-D179 (2026-05-26): top-2 → top-4 so the marquee
                    // text baseline aligns with the heart icon's visual
                    // center on the same row. Measured: heart center
                    // sits ~24px from card top (button h-11 with h-8
                    // visible glass at top-[2px]). Marquee text height
                    // ~16px → top should be 16 to put center at 24. ✓
                    // geometry sweep (2026-07-17, _geometry-triage.md #4): py-[3px] -> py-1
                    // (4, unambiguous nearest 4pt rung). px-2.5 (10px) left AS IS: it sits
                    // exactly between px-2/px-3 with no documented pixel rationale to break
                    // the tie, a taste call, not a mechanical fix.
                    className="absolute top-2 left-2 z-[2] inline-flex items-center rounded-full bg-black/55 px-2.5 py-1 backdrop-blur-[4px] pointer-events-none"
                    aria-hidden
                  >
                    {/* mockup-ok: 11px -> 12px, owner-approved public/_mockups/improve/type-scale.html
                        (8 -> 4 type-scale merge); this is the one merge that grows, not shrinks. */}
                    <span className="font-body text-[12px] font-semibold leading-none text-white">TikTok</span>
                  </div>
                  )}

                  {/* V3-D165: Clapperboard at bottom-right = static
                      video signal where the marquee used to live.
                      Sits inside the bottom-gradient overlay area so
                      the white glyph reads cleanly with just a subtle
                      drop-shadow. lucide icon (not animate-ui) per the
                      "one icon system at a time" convo — easy to
                      swap to an animated version later if you want. */}
                  {/* V3-D179 (2026-05-26): bottom-2 → bottom-[13px] so the
                      Clapperboard icon's visual center aligns with the
                      @author pill text center on the same row. Measured
                      bottom-2 put clap 6px below pill text center
                      (pill's py-1 + smaller text-y-offset). bottom-[13px]
                      lifts it 5px so both center on the same baseline. */}
                  {/* M5 (2026-06-05): hidden on the branded-fallback state —
                      the centered play glyph is the single video signal there
                      (matches the approved mockup), so the clapperboard would
                      double up. */}
                  {/* video signalled by the top-left TikTok pill; clapperboard removed 2026-06-29 */}
                </div>
                {(look.authorName || look.price != null) && (
                  <div className="flex items-baseline gap-2 px-0.5 pt-1.5">
                    {look.authorName && (
                      <span className="truncate font-body text-[12px] text-s-ink-2">
                        {look.authorName}
                      </span>
                    )}
                    {look.price != null && (
                      <span className="ml-auto shrink-0 font-body text-[12px] font-semibold text-s-ink">
                        {tTrend("priceFrom", { price: look.price })}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}

          {/* V3-D163 (2026-05-26): "Alle entdecken" CTA card — center-zoom
              + dimmed-when-inactive removed alongside the look cards (see
              the comment in the Entdecken function body). Static styling
              + desktop-only hover bump. */}
          <Link
            href={`/${locale}/inspo`}
            aria-label={t("browseAllLooks")}
            className="group relative block shrink-0 snap-center w-[44vw] max-w-[200px] transition-transform active:scale-[0.97] active:duration-[80ms] focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-4 focus-visible:rounded-[16px]"
          >
            <div
              className={cn(
                "flex h-full w-full origin-center flex-col items-center justify-center rounded-[16px] p-6 text-center",
                "border-2 border-dashed border-s-ink/30 bg-white",
                "transition-[transform,border-color] duration-150 ease-glide",
                "md:group-hover:scale-[1.03] md:group-hover:z-10 md:group-hover:border-s-ink",
              )}
            >
              <div
                className={cn(
                  "grid h-12 w-12 place-items-center rounded-full bg-s-ink text-white mb-4",
                  "transition-transform duration-150 ease-glide",
                  "md:group-hover:scale-110",
                )}
              >
                <ArrowRight size={20} strokeWidth={2.2} aria-hidden />
              </div>
              {/* mockup-ok: 16px -> 14px, owner-approved public/_mockups/improve/type-scale.html
                  (8 -> 4 type-scale merge), the other named real cost of that merge. */}
              <h3 className="font-body text-[14px] font-semibold leading-tight text-s-ink">
                {t("browseAll")}
              </h3>
              <p className="mt-2 font-body text-[12px] text-s-ink-2">
                {t("inspireSub")}
              </p>
            </div>
          </Link>
        </div>
      </SectionFrame>
    </Section>
  );
}
