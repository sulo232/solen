// exists-check: net-new. `npm run exists SalonOfMonth` only hits lib/salon-of-month.ts
// (this component's own data source) and the admin picker's zod schema. The
// removed ArtistOfTheMonth.tsx (unmounted per page.tsx's own V3-D104 comment,
// "remove ths whole thing") is a DIFFERENT feature (invented demo stylists,
// no backend), not reused here, this section is real-data-only.
import { getTranslations } from "next-intl/server";
import { getCurrentSalonOfMonth } from "@/lib/salon-of-month";
import { Section, SectionFrame, SectionTitle, ScrollRow } from "./SectionHeader";
import { SalonCard } from "./SalonCard";
import { safeCategory } from "../salon/_shared";

/**
 * Salon of the Month , server component, real data only.
 *
 * Editorial homepage slot: the admin's current pick from
 * salon_of_month_winners (20260713140000_salon_of_month.sql), gated on the
 * `salon_of_month` feature_flags toggle. Renders nothing (not an empty
 * state) when the toggle is off or no winner has been picked yet, matching
 * every other homepage curation row on this page (ForYouSalonRows etc.)
 * that quietly disappears rather than showing a placeholder box on a public
 * marketing surface , an admin-facing empty/loading/error state belongs on
 * the picker (dashboard/salon-of-month-admin), not here.
 *
 * Single card, same ScrollRow + SalonCard grammar as every other homepage
 * feed (Nearby, ForYouSalonRows) , no bespoke sizing, SalonCard already
 * owns its own responsive width per §16.2. The categories->card-category
 * bridge (safeCategory) is shared with salonCardData.ts, see ../salon/_shared.ts.
 */
export default async function SalonOfMonth({ locale }: { locale: string }) {
  const winner = await getCurrentSalonOfMonth();
  if (!winner) return null;

  const t = await getTranslations({ locale, namespace: "home.salonOfMonth" });

  return (
    <Section>
      <SectionFrame>
        <SectionTitle title={t("title")} />
        <ScrollRow>
          <SalonCard
            slug={winner.salon.slug}
            salonId={winner.salon.id}
            name={winner.salon.name}
            rating={winner.salon.averageRating}
            reviewCount={winner.salon.reviewCount}
            photoUrl={winner.salon.coverPhotoUrl ?? undefined}
            category={safeCategory(winner.salon.categories)}
            curation="solen-favorit"
            variant="service"
            address={winner.salon.quartier ?? undefined}
          />
        </ScrollRow>
      </SectionFrame>
    </Section>
  );
}
