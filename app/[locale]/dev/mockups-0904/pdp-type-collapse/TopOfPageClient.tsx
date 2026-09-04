"use client";

// exists-check: `npm run exists "salon header type sizes"` and `npm run exists "pdp type collapse
// salon page font sizes"` both ran this turn, 0 hits. The nearest-keyword matches the tool
// returned (a homepage route, a loyalty status lib, a salon-client verifier, a section-observer
// hook, a mobile design-system plan doc, a dev terminal status file) touch none of the salon PDP
// hero/header/about cluster or a font-size comparison of it. The real target this file wraps,
// app/[locale]/_components/salon/{SalonHero,SalonHeader,SalonAbout}.tsx, is imported unmodified
// below, not duplicated.
//
// Grounded-in: app/[locale]/_components/salon/SalonHero.tsx,
// app/[locale]/_components/salon/SalonHeader.tsx, app/[locale]/_components/salon/SalonAbout.tsx,
// app/[locale]/_components/salon/StatusInline.tsx.
//
// Depicts: hero photo carousel (mobile) -> app/[locale]/_components/salon/SalonHero.tsx (real, unmodified import)
// Depicts: salon name + rating + open-status + address -> app/[locale]/_components/salon/SalonHeader.tsx (real, unmodified import)
// Depicts: open/closed status word + time -> app/[locale]/_components/salon/StatusInline.tsx (rendered inside SalonHeader, real, unmodified; font-size scoped via CSS in the Proposed block only, the file itself is never edited)
// Depicts: "About us" section -> app/[locale]/_components/salon/SalonAbout.tsx (real, unmodified import)
// Nothing here is net-new: no new component, no new data shape, no new copy. The only new thing
// in this whole task is the scoped <style> rule below plus the "Current"/"Proposed" labels.
//
// All three section components below are REAL, UNMODIFIED imports (same files
// app/[locale]/salon/[slug]/page.tsx renders through SalonDetailV3.tsx). This file only exists
// because SalonHero needs two function props (onOpenLightbox / onOpenGallery) a Server Component
// cannot hand a Client Component, the same reason design-fixes/DesignFixesClient.tsx exists.
//
// Current block: the three real components, no wrapper, no override, exactly what the live PDP
// renders above "Services" today.
//
// Proposed block: the SAME three real components, unmodified, inside a scoped <style> override.
// The one and only rule the override changes: StatusInline's hardcoded `text-[15px]` (its "md"
// size, the default SalonHeader.tsx passes) collapses to 14px, merging it into the Body role
// every sibling meta string in this cluster already uses. Nothing else in the CSS touches size,
// weight, color, or layout, see the report for why that is the ONLY size that needed to move.
import * as React from "react";
import { SalonHero } from "@/app/[locale]/_components/salon/SalonHero";
import { SalonHeader } from "@/app/[locale]/_components/salon/SalonHeader";
import { SalonAbout } from "@/app/[locale]/_components/salon/SalonAbout";
import type { SalonDetail, OpenStatus } from "@/app/[locale]/_components/salon/_shared";

function noop() {}

function TopOfPage({ salon, openStatus, locale }: { salon: SalonDetail; openStatus: OpenStatus; locale: string }) {
  return (
    <>
      <section className="w-full">
        <SalonHero salon={salon} onOpenLightbox={noop} onOpenGallery={noop} />
      </section>
      <div className="px-4 pt-5">
        <SalonHeader salon={salon} openStatus={openStatus} />
        <div className="mt-8">
          <SalonAbout salon={salon} locale={locale} />
        </div>
      </div>
    </>
  );
}

export function PdpTypeCollapseComparison({
  salon,
  openStatus,
  locale,
}: {
  salon: SalonDetail;
  openStatus: OpenStatus;
  locale: string;
}) {
  return (
    <div className="mx-auto w-full max-w-[402px] bg-white">
      <p className="px-4 pt-4 text-[13px] font-semibold text-s-ink">Current</p>
      <div className="pdp-current-scope border-b-8 border-s-bg-sunken pb-6">
        <TopOfPage salon={salon} openStatus={openStatus} locale={locale} />
      </div>

      <p className="px-4 pt-6 text-[13px] font-semibold text-s-ink">Proposed</p>
      <div className="pdp-proposed-scope pb-6">
        {/* The ONE font-size rule of this whole file. Targets the literal Tailwind
            arbitrary-value class StatusInline.tsx emits for size="md" (text-[15px]),
            scoped to this block only via the wrapping .pdp-proposed-scope class. */}
        <style>{".pdp-proposed-scope .text-\\[15px\\]{font-size:14px !important}"}</style>
        <TopOfPage salon={salon} openStatus={openStatus} locale={locale} />
      </div>
    </div>
  );
}
