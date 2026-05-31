"use client";

import * as React from "react";
import type { SalonDetail } from "./_shared";

/**
 * SalonAbout — venue DESCRIPTION only (V3-D389, Fresha 1:1 PDP capture).
 *
 * The map + address moved OUT to SalonLocation: Fresha keeps the "About" text
 * and the "Location" block as separate labeled sections, so we do too. Renders
 * just the description in the active locale; returns null when there is none
 * (the section + its sticky-nav tab simply don't appear — Fresha hides empties).
 *
 * V3-D209: pick one text in the active locale, fall back de → en.
 */
export function SalonAbout({ salon, locale }: { salon: SalonDetail; locale: string }) {
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

  return (
    <section id="section-about">
      {/* V3-D202 (A12): font-body → font-display + Scale B. */}
      <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
        Über uns
      </h2>
      <div className="mt-4 max-w-3xl space-y-4 text-[14px] leading-relaxed text-s-ink-2 md:text-[15px]">
        <p className="whitespace-pre-line">{text}</p>
      </div>
    </section>
  );
}
