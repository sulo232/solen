/**
 * Exists-check: `npm run exists decision-mockup` -> 1 REMOVED hit (bundles, unrelated).
 * `npm run exists SalonResultCard` -> real component at
 * app/[locale]/_components/search/SalonResultCard.tsx (grid variant photo:
 * `rounded-[22px]`, SalonResultCard.tsx:611). Net-new: this decision route.
 *
 * lang-ok: owner-facing decision mockup for a direct German-speaking owner review
 * (task spec: "German copy only (no EN)"), not an AI-only review artifact.
 *
 * Decision: result-card photo radius, 18px vs 22px. NOTE (surfaced, not silently
 * fixed): the task brief frames 18px as "shipped drift" and 22px as "locked", but
 * SalonResultCard.tsx's grid/list/card photo wrappers ALL already ship
 * `rounded-[22px]` today (verified by reading the file - no live 18px instance was
 * found on this card). This route still renders the requested A=18 / B=22
 * comparison (a valid decision either way), the caption below states the real
 * current value instead of asserting an inaccurate "shipped" label.
 *
 * SalonResultCard.tsx is NOT edited. The radius override is a scoped CSS
 * child-selector on a wrapper class (`.radius-a` / `.radius-b`), targeting the
 * card's photo element structurally (first child of the card's `<Link>`), per the
 * task's "wrapper (scoped CSS child selector)" instruction.
 */
import { notFound } from "next/navigation";
import { SalonResultCard } from "@/app/[locale]/_components/search/SalonResultCard";
import { DecisionChip, DecisionCaption, DecisionHeader } from "../_shared/DecisionChip";
import { getSeedSalon } from "../_shared/seedSalon";

export default async function DecisionRadiusPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const salon = await getSeedSalon("de");
  if (!salon) notFound();

  return (
    <div className="mx-auto min-h-screen w-full max-w-[375px] bg-white">
      <style>{`
        .radius-a a.group > div:first-child { border-radius: 18px !important; }
        .radius-b a.group > div:first-child { border-radius: 22px !important; }
      `}</style>
      <DecisionHeader
        title="Ergebnis-Karte: Foto-Radius"
        decision="Foto-Ecken der Suchergebnis-Karte: 18px vs. 22px."
      />
      <div className="grid grid-cols-2 gap-4 p-4">
        <div>
          <DecisionChip letter="A" value="18px" />
          <div className="radius-a mt-3">
            <SalonResultCard
              slug={salon.slug}
              name={salon.name}
              locale="de"
              rating={salon.averageRating}
              reviewCount={salon.reviewCount}
              photoUrl={salon.coverPhotoUrl}
              category={salon.category}
              address={salon.address}
              city={salon.cityName}
              priceFromCHF={salon.priceFromCHF}
              variant="grid"
            />
          </div>
        </div>
        <div>
          <DecisionChip letter="B" value="22px" />
          <div className="radius-b mt-3">
            <SalonResultCard
              slug={salon.slug}
              name={salon.name}
              locale="de"
              rating={salon.averageRating}
              reviewCount={salon.reviewCount}
              photoUrl={salon.coverPhotoUrl}
              category={salon.category}
              address={salon.address}
              city={salon.cityName}
              priceFromCHF={salon.priceFromCHF}
              variant="grid"
            />
          </div>
        </div>
      </div>
      <div className="px-4">
        <DecisionCaption>
          Reale Karte von {salon.name}. Aktueller Live-Wert ist bereits 22px, dieser
          Vergleich zeigt beide Werte nebeneinander. SalonResultCard.tsx bleibt
          unverändert, der Radius kommt über eine Wrapper-Klasse.
        </DecisionCaption>
      </div>
      <div className="h-8" />
    </div>
  );
}
