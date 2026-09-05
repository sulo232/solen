// Grounded-in: app/[locale]/_components/homepage/SalonOfMonth.tsx (the real component this file
// forks; the data source, the gate on the feature flag and the self-hide behaviour are unchanged).
//
// Exists-check: ran `npm run exists SalonOfMonth`, hit the real, live component (server component,
// gated on the salon_of_month feature flag, self-hides when off or no winner is picked). This file
// is a COPY of it (off-limits rule: fork into _v<letter>/ when the anatomy must change), for the
// same LOOK-FULL reason as the other forks in this folder: it needs SalonCardAirbnb and
// SectionPrimitivesAirbnb instead of the real, shared ones, so a Salon of the Month card that
// happens to be on (flag-dependent, not observed on either this session) reads consistently with
// every other card on this direction rather than mixing the old 5:4/shadow card into an
// otherwise-restyled screen.
//
// Direction: home ?v=b, Airbnb look at FULL STRENGTH (LOCK MODE: LOOK-FULL).
//
// Conflicts: none new, carries the same four SalonCardAirbnb conflicts (ratio/radius/shadow/ink)
// and the same two SectionPrimitivesAirbnb conflicts (title size/weight, title ink), see those
// files' own headers, not duplicated here.
//
// No em-dashes. English copy only (real i18n keys, unchanged from the original).
import { getTranslations } from "next-intl/server";
import { getCurrentSalonOfMonth } from "@/lib/salon-of-month";
import { Section, SectionFrame, SectionTitle, ScrollRow } from "./SectionPrimitivesAirbnb";
import { SalonCardAirbnb } from "./SalonCardAirbnb";
import { safeCategory } from "@/app/[locale]/_components/salon/_shared";

export default async function SalonOfMonthAirbnb({ locale }: { locale: string }) {
  const winner = await getCurrentSalonOfMonth();
  if (!winner) return null;

  const t = await getTranslations({ locale, namespace: "home.salonOfMonth" });

  return (
    <Section>
      <SectionFrame>
        <SectionTitle title={t("title")} />
        <ScrollRow>
          <SalonCardAirbnb
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
            priority
          />
        </ScrollRow>
      </SectionFrame>
    </Section>
  );
}
