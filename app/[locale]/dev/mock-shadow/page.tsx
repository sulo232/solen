/**
 * Mockup-scope: whole-page
 * Exists-check: `npm run exists mock-shadow` -> 0 hits (net-new route). `npm run exists
 * decision-shadow` -> the v1 A/B panel mockup (app/[locale]/dev/decision-shadow/page.tsx,
 * kept on disk untouched, superseded by this route per the owner's 2026-07-13 rewrite).
 * `npm run exists SalonServices/SalonDetailV3` -> both real
 * (app/[locale]/_components/salon/SalonServices.tsx ships `shadow-whisper` at rest, no
 * hover; app/[locale]/_components/salon/SalonDetailV3.tsx is the real page composition).
 * Net-new: this whole-page route. No dev route renders the FULL real PDP scrolled to a
 * real services section for this decision today, v1 hand-copied 2 services into an
 * isolated static block.
 *
 * Decision: PDP services-card shadow. shadow-whisper at rest, no hover (shipped,
 * SalonServices.tsx:139) vs flat at rest + hover:shadow-elevation-2 (copied from the two
 * real sibling PDP cards that already use this pattern, SalonLoyalty.tsx:72 /
 * SalonOtherLocations.tsx:67).
 *
 * Same composition as mock-backbutton (the real SalonDetailV3, real seed salon, real
 * services via loadSalonDetailWithStatus), auto-scrolled to the real
 * `#section-services` anchor on mount (ScrollToId, dev/_shared, new) so the mock opens
 * centered on the section under review instead of the reviewer scrolling past the hero,
 * team, and reviews sections by hand. SalonServices.tsx is NOT edited: "gesetz" overrides
 * the card's shadow with a scoped <style> child-selector using the literal shadow-whisper
 * / shadow-elevation-2 rgba values already defined in tailwind.config.js (lines 274/278),
 * not invented ones.
 *
 * Real-composition blocker (named, not faked): same app-wide Header/Breadcrumb caveat as
 * mock-backbutton (HideInBooking's `coverSalonDetail` only hides on the real `/salon/[slug]`
 * pathname, not `/dev/mock-shadow`), see that route's docstring for the full explanation.
 */
import { notFound } from "next/navigation";
import { loadSalonDetailWithStatus } from "@/lib/salon-detail";
import { SalonDetailV3 } from "@/app/[locale]/_components/salon/SalonDetailV3";
import { getSeedSalon } from "../_shared/seedSalon";
import { VariantSwitcher } from "../_shared/VariantSwitcher";
import { ScrollToId } from "../_shared/ScrollToId";

export default async function MockShadowPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { locale } = await params;
  const { v } = await searchParams;
  const variant = v === "gesetz" ? "gesetz" : "aktuell";

  const seed = await getSeedSalon("de");
  if (!seed) notFound();
  const detail = await loadSalonDetailWithStatus(seed.slug, locale);
  if (!detail || detail.salon.services.length === 0) notFound();

  return (
    <div className={variant === "gesetz" ? "mock-shadow-gesetz" : undefined}>
      {variant === "gesetz" && (
        <style>{`
          .mock-shadow-gesetz #section-services ul {
            box-shadow: none !important;
            transition: box-shadow 200ms ease;
          }
          .mock-shadow-gesetz #section-services ul:hover {
            box-shadow: 0 2px 8px rgba(50,47,44,0.09) !important;
          }
        `}</style>
      )}
      <ScrollToId id="section-services" />
      <SalonDetailV3
        salon={detail.salon}
        openStatus={detail.openStatus}
        todayKey={detail.todayKey}
      />
      <VariantSwitcher
        options={[
          { value: "aktuell", label: "shadow-whisper" },
          { value: "gesetz", label: "Hover: elevation-2" },
        ]}
      />
    </div>
  );
}
