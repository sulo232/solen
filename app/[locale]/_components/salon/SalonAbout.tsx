"use client";

import * as React from "react";
import type { SalonDetail } from "./_shared";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

/**
 * SalonAbout, venue DESCRIPTION only (V3-D389, Fresha 1:1 PDP capture).
 *
 * The map + address moved OUT to SalonLocation: Fresha keeps the "About" text
 * and the "Location" block as separate labeled sections, so we do too. Renders
 * just the description in the active locale; returns null when there is none
 * (the section + its sticky-nav tab simply don't appear, Fresha hides empties).
 *
 * V3-D209: pick one text in the active locale, fall back de to en.
 *
 * 2026-08-15, COLLAPSIBLE. Owner: "on the about us, make it so it's collapsible, and, like, make
 * it expand or not expand like it is finished that I attached before." The reference he attached
 * is his Fresha PDP capture, where "Ueber" clamps to four lines with an inline coloured "Mehr
 * erfahren" at the end of the last line, and the section sits directly under the address.
 *
 * NOT A NEW AFFORDANCE, and deliberately so. The clamp-plus-inline-accent-toggle is the pattern
 * copy economy rule 2 already locks for long text ("Long text truncates with a blue Mehr lesen ...
 * clamp ~150 chars / 3 lines with an inline text-s-accent that expands IN PLACE, Fresha pattern"),
 * and SalonReviews.tsx already implements exactly it for review bodies. Same clamp mechanism, same
 * accent toggle, so About and a review body behave identically instead of growing two dialects of
 * the same control (FLOORS LAW 8).
 *
 * Two things it does that the review version does not, both because this text is longer:
 *   - it collapses again. The label flips to "Weniger anzeigen", so expanding is reversible; a
 *     review body is short enough that one-way expansion never traps anyone, a four-line About
 *     paragraph on a phone does.
 *   - the toggle only renders when the text is actually long enough to clip. A short seed
 *     description gets no control at all rather than a "Mehr anzeigen" that reveals nothing.
 *
 * Both labels come from `salonDetail.readMore` / `readLess`, which already ship in all four
 * locales, so no new copy was written for this.
 */
/**
 * 2026-08-15, HIS QUESTION ANSWERED HONESTLY: "the about us is too long. Do we even have the limit
 * or did you just make that set up?"
 *
 * I made it up. The first version clamped at 4 lines / 170 characters and neither number came from
 * anywhere. There IS a documented limit and it is tighter than what I picked: copy economy rule 2
 * in CLAUDE.md says long text "clamps (~150 chars / 3 lines) with an inline text-s-accent Mehr
 * lesen that expands in place". So these are now that rule's numbers instead of mine, which also
 * makes the collapsed block shorter, which is what he was complaining about.
 */
const CLAMP_MIN_CHARS = 150;

export function SalonAbout({ salon, locale }: { salon: SalonDetail; locale: string }) {
  const t = useTranslations("salonDetail");
  const [expanded, setExpanded] = React.useState(false);
  const localized = (key: string) => (salon as unknown as Record<string, string | undefined>)[key];
  const text =
    localized(`about_text_${locale}`) ??
    localized(`description_${locale}`) ??
    salon.about_text_de ??
    salon.description_de ??
    salon.about_text_en ??
    salon.description_en ??
    null;

  if (!text) return null;

  const clampable = text.length >= CLAMP_MIN_CHARS;

  return (
    <section id="section-about">
      {/* V3-D202 (A12): font-body to font-display + Scale B. */}
      <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
        {t("aboutUs")}
      </h2>
      {/* ig7 (owner-approved 2026-07-16): shared .prose-measure (68ch) replaces the
          hand-rolled max-w-3xl for a readable line length. */}
      <div className="prose-measure mt-4 space-y-4 text-[14px] leading-relaxed text-s-ink-2 md:text-[15px]">
        <p className={cn("whitespace-pre-line", clampable && !expanded && "line-clamp-3")}>
          {text}
        </p>
        {clampable && (
          // mockup-ok: byte-identical toggle chrome to SalonReviews.tsx's own "Mehr lesen"
          // (13px, medium, text-s-accent, the shared press transition), so the two read as one
          // control. Copy economy rule 2 locks this treatment for long text.
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="font-body mt-1 text-[13px] font-medium text-s-accent transition-[opacity,transform] hover:opacity-80 active:scale-[0.98] active:duration-[80ms] active:ease-glide"
          >
            {expanded ? t("readLess") : t("readMore")}
          </button>
        )}
      </div>
    </section>
  );
}
