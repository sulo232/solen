/**
 * Exists-check: `npm run exists decision-mockup` -> 1 REMOVED hit (bundles, unrelated).
 * `npm run exists BackButton` -> real component at
 * app/[locale]/_components/primitives/BackButton.tsx (glass variant, h-10 w-10 = 40px).
 * Net-new: this decision route. No dev route compares BackButton sizes today.
 *
 * Decision: BackButton glass circle 40px (shipped, BackButton.tsx:35 `h-10 w-10`)
 * vs 44px (the LOCKED design-contract "touch target >= 44px (h-11)" row in CLAUDE.md).
 * BackButton.tsx itself is untouched; the 44px variant is forced via a wrapper
 * className override (`!h-11 !w-11`), the pattern the task calls for.
 */
import { notFound } from "next/navigation";
import Image from "next/image";
import { BackButton } from "@/app/[locale]/_components/primitives";
import { DecisionChip, DecisionCaption, DecisionHeader } from "../_shared/DecisionChip";
import { getSeedSalon } from "../_shared/seedSalon";

export default async function DecisionBackButtonPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const salon = await getSeedSalon("de");
  if (!salon) notFound();

  return (
    <div className="mx-auto min-h-screen w-full max-w-[375px] bg-white">
      <DecisionHeader
        title="Zurück-Button: Kreisgrösse"
        decision="Glas-Zurück-Button über dem Hero-Foto: 40px (aktuell) vs. 44px (Touch-Ziel-Vorgabe)."
      />
      <div className="space-y-6 p-4">
        {(
          [
            { letter: "A" as const, value: "40px", sizeClass: "" },
            { letter: "B" as const, value: "44px", sizeClass: "!h-11 !w-11" },
          ]
        ).map(({ letter, value, sizeClass }) => (
          <div key={letter}>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-card bg-s-bg-sunken">
              <Image
                src={salon.coverPhotoUrl}
                alt={`Foto von ${salon.name}`}
                fill
                sizes="375px"
                className="object-cover"
              />
              <div className="absolute left-3 top-3 z-10">
                <BackButton variant="glass" label="Back" className={sizeClass} />
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <DecisionChip letter={letter} value={value} />
            </div>
          </div>
        ))}
      </div>
      <div className="px-4">
        <DecisionCaption>
          Reales Foto von {salon.name}. BackButton.tsx bleibt unverändert, die 44px-Variante
          kommt über eine Wrapper-Klasse.
        </DecisionCaption>
      </div>
      <div className="h-8" />
    </div>
  );
}
