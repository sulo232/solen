/**
 * Mockup-scope: whole-page
 * Exists-check: `npm run exists mock-backbutton` -> 0 hits (net-new route).
 * `npm run exists decision-backbutton` -> the v1 A/B panel mockup
 * (app/[locale]/dev/decision-backbutton/page.tsx, kept on disk untouched, superseded
 * by this route per the owner's 2026-07-13 rewrite: "a preview of the whole page", not
 * an isolated component panel). `npm run exists SalonDetailV3/BackButton` -> both real
 * (app/[locale]/_components/salon/SalonDetailV3.tsx; app/[locale]/_components/primitives/
 * BackButton.tsx, h-10 w-10 = 40px). Net-new: this whole-page route. No dev route renders
 * the FULL real PDP (hero through footer) for this decision today, v1 only cropped the
 * hero photo into a 375px panel.
 *
 * Decision: BackButton glass circle over the PDP hero, 40px (shipped, BackButton.tsx:35
 * `h-10 w-10`) vs 44px (the LOCKED design-contract "touch target >= 44px" row, CLAUDE.md).
 *
 * Renders the REAL salon PDP top to bottom: SalonDetailV3 is the exact client component
 * app/[locale]/salon/[slug]/page.tsx mounts, fed via the SAME loadSalonDetailWithStatus()
 * loader that page.tsx calls, for the shared real seed salon (dev/_shared/seedSalon.ts).
 * SalonHero.tsx / BackButton.tsx are NOT edited: the 44px variant is forced with a scoped
 * <style> child-selector keyed on the real button's own `aria-label="Zurück"` (stable
 * regardless of class order), the wrapper-override pattern this change-set requires.
 *
 * Real-composition blocker (named, not faked): the app-wide Header + Breadcrumb
 * (app/[locale]/layout.tsx, gated by HideInBooking's `coverSalonDetail`) only hide on the
 * REAL PDP pathname `/salon/[slug]`. This route lives at `/dev/mock-backbutton`, so that
 * gate never fires, an extra global Header/Breadcrumb bar renders above the real
 * SalonHero/SalonHeader content that a real PDP visitor never sees. This is structural to
 * every `/dev/*` route in this repo (identical on every pre-existing dev mockup, including
 * v1's own decision-backbutton) and cannot be fixed without editing the shipped
 * HideInBooking.tsx or layout.tsx, both out of scope this turn.
 */
import { notFound } from "next/navigation";
import { loadSalonDetailWithStatus } from "@/lib/salon-detail";
import { SalonDetailV3 } from "@/app/[locale]/_components/salon/SalonDetailV3";
import { getSeedSalon } from "../_shared/seedSalon";
import { VariantSwitcher } from "../_shared/VariantSwitcher";

export default async function MockBackButtonPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { locale } = await params;
  const { v } = await searchParams;
  const variant = v === "44" ? "44" : "40";

  const seed = await getSeedSalon("de");
  if (!seed) notFound();
  const detail = await loadSalonDetailWithStatus(seed.slug, locale);
  if (!detail) notFound();

  return (
    <div className={variant === "44" ? "mock-backbutton-44" : undefined}>
      {variant === "44" && (
        <style>{`
          .mock-backbutton-44 button[aria-label="Zurück"] {
            height: 44px !important;
            width: 44px !important;
          }
        `}</style>
      )}
      <SalonDetailV3
        salon={detail.salon}
        openStatus={detail.openStatus}
        todayKey={detail.todayKey}
      />
      <VariantSwitcher
        options={[
          { value: "40", label: "40px" },
          { value: "44", label: "44px" },
        ]}
      />
    </div>
  );
}
