"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Pause, Play } from "lucide-react";
import { Section, SectionFrame } from "./SectionHeader";
import { opticalGlyphNudge } from "@/lib/optical";
import { useTranslations } from "next-intl";

/**
 * SolenStory — V3-D105 (2026-05-23).
 *
 * Glossier-style editorial story section: text block on the left + looping
 * muted video on the right. Replaces what would otherwise be a generic
 * "why book with us" panel with a lifestyle/atmosphere moment.
 *
 * Pattern matches Glossier's homepage "Our favorite scents..." section
 * (left: headline + outline CTA + optional carousel; right: video with
 * subtle text overlays and pause control).
 *
 * Video specs:
 *   - Source: theoneiwant.MOV, re-encoded to mp4 (949 KB) + webm (1.0 MB),
 *     scaled to 1280px wide, audio stripped, CRF 28 / VP9 quality 34.
 *   - Path: /video/solen-story-loop.{mp4,webm}
 *   - Autoplay muted loop. No sound (per user "kill the sound").
 *   - Pause toggle in bottom-right corner (browser-controls hidden).
 *
 * Mobile: stack vertically — video first, text below. Desktop: 2-col split.
 */

export default function SolenStory() {
  // 2026-08-15 i18n sweep: these were hardcoded German literals, so they rendered German
  // on /en, /fr and /it. Same class the owner caught on the recently-viewed row.
  const t = useTranslations("home.sections");
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [isPaused, setIsPaused] = React.useState(false);

  const togglePause = React.useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setIsPaused(false);
    } else {
      v.pause();
      setIsPaused(true);
    }
  }, []);

  return (
    <Section>
      <SectionFrame>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12 md:items-center">
          {/* ─── LEFT: text block ─── */}
          <div className="order-2 md:order-1">
            {/* De-eyebrowed 2026-06-11 (owner ban on tracked-uppercase): normal-case kicker. */}
            <p className="mb-4 font-body text-[13px] font-semibold text-s-ink-2">
              {t("theApp")}
            </p>
            <h2 className="mb-5 font-display text-[clamp(26px,7vw,30px)] font-semibold leading-[1.04] tracking-[-0.025em] text-s-ink">
              Buchen in
              <br />
              30 Sekunden.
              {/* V3-D119: text-s-ink → text-s-ink per Rule 1 cleanup
                  (brand color is CTA-only, never on headline highlights). */}
              <span className="block text-s-ink">{t("fromYourPocket")}</span>
            </h2>
            <p className="mb-7 max-w-[42ch] font-body text-[14px] leading-[1.55] text-s-ink-2 md:text-[15px]">
              Kein Anrufen, kein &laquo;wir melden uns&raquo;. Preis sehen Sie
              direkt &mdash; fertig.
            </p>
            <Link
              href="/de/search"
              // V3-D117 (2026-05-23): outline pill → primary green pill per
              // critique fix #5 (CTA family lockdown). The previous V3-D110
              // outline-green-border style was a 3rd CTA treatment outside
              // the primary/secondary system documented in Rule 8 of
              // `_rules/solen-color-60-30-10.md`. SolenStory's CTA is high-
              // intent (book), so it gets PRIMARY (filled green pill).
              className="group inline-flex items-center gap-2 rounded-full bg-s-ink px-6 py-3 font-body text-[13px] font-bold text-white shadow-[0_4px_14px_rgba(5,79,49,0.25)] transition-all duration-200 ease-out hover:bg-black hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(5,79,49,0.32)] active:scale-[0.97] active:duration-[80ms] md:text-[14px]"
            >
              Book Solen Now
              <ArrowRight
                size={14}
                strokeWidth={1.6}
                className="transition-transform duration-200 ease-out group-hover:translate-x-1"
              />
            </Link>
          </div>

          {/* ─── RIGHT: looping video with overlays ─── */}
          {/* V3-D106 (2026-05-23):
              • "SOLEN · JETZT BUCHEN" chip removed per user "solen jet
                buchen is kinda unnesecary."
              • "Only one click." size bumped (was 22/26px → now 32/44px).
              • Video container radius bumped 18px → 28px (more rounded
                per user "can u make ths more rounded this part"). */}
          <div className="order-1 md:order-2">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[28px] bg-s-ink">
              <video
                ref={videoRef}
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                className="absolute inset-0 h-full w-full object-cover"
                poster=""
              >
                <source src="/video/solen-story-loop.webm" type="video/webm" />
                <source src="/video/solen-story-loop.mp4" type="video/mp4" />
              </video>

              {/* Bottom CTA text overlay — readable on darker video frames */}
              <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/70 to-transparent p-6 pt-16">
                <p className="font-display text-[32px] font-semibold leading-[1.02] tracking-[-0.025em] text-white drop-shadow-md md:text-[44px]">
                  Only one click.
                </p>
              </div>

              {/* Pause / play toggle — bottom-right */}
              <button
                type="button"
                onClick={togglePause}
                aria-label={isPaused ? "Video abspielen" : "Video pausieren"}
                className="absolute bottom-4 right-4 z-20 grid h-9 w-9 place-items-center rounded-full border border-white/30 bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
              >
                {isPaused ? (
                  // mockup-ok: owner-approved 2026-07-15 optical nudge (RATIONALE.md:144, lib/optical.ts).
                  // Play is asymmetric (a triangle), nudged. Pause (two bars) is symmetric and stays
                  // un-nudged, flexbox already centers it correctly.
                  <Play size={14} strokeWidth={2} fill="white" style={{ marginLeft: opticalGlyphNudge(14) }} />
                ) : (
                  <Pause size={14} strokeWidth={2} fill="white" />
                )}
              </button>
            </div>
          </div>
        </div>
      </SectionFrame>
    </Section>
  );
}
