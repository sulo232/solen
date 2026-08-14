/**
 * Exists-check: `npm run exists decision-mockup` -> 1 REMOVED hit (bundles, unrelated).
 * `npm run exists SalonServices` -> real component at
 * app/[locale]/_components/salon/SalonServices.tsx (grouped service-card shell +
 * ServiceRow markup, quoted below). Net-new: this decision route.
 *
 * lang-ok / english-ok: owner-facing decision mockup for a direct German-speaking
 * owner review (task spec: "German copy only (no EN)"), not an AI-only review
 * artifact; the German strings below are genuinely required by that spec.
 *
 * Decision: PDP section-card shadow. NOTE (surfaced, not silently fixed): the task
 * brief says "SalonServices.tsx has the raw box-shadow ... hover shadow", but
 * reading the live file shows the grouped card ships `shadow-whisper` (a Tailwind
 * token that IS defined as literal rgba values in tailwind.config.js:274, so it is
 * a "raw rgba" shadow in that sense) AT REST, with no hover state at all - despite
 * the file's own stale JSDoc (SalonServices.tsx:32) still claiming "hover lift".
 * "The law" (B) is not invented either: it is copied from two REAL sibling PDP
 * section cards that already use this exact rest/hover pattern
 * (SalonLoyalty.tsx:72, SalonOtherLocations.tsx:67 - `border-s-border bg-white
 * transition-shadow hover:shadow-elevation-2`).
 *
 * SalonServices.tsx is NOT edited. This route copies its card-shell + ServiceRow
 * markup (2 real services from the same seed salon as M1/M4) into two static
 * blocks; hover is real (`hover:shadow-elevation-2` is a live CSS hover, works
 * with a mouse over the rendered card).
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { PriceFrom } from "@/app/[locale]/_components/primitives";
import { DecisionChip, DecisionCaption, DecisionHeader } from "../_shared/DecisionChip";
import { getSeedSalon } from "../_shared/seedSalon";

function formatDurationDE(mins: number): string {
  return `${mins} min`;
}

function ServiceRow({ name, duration, price, href }: { name: string; duration: string; price: number; href: string }) {
  return (
    <li className="border-t border-s-border px-5 py-[18px] first:border-t-0 md:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="font-body text-[15px] font-semibold text-s-ink md:text-[16px]">{name}</div>
          <div className="font-body mt-1 text-[13px] text-s-ink-3 md:text-[14px]">{duration}</div>
          <div className="font-body mt-3 text-[14px] font-normal text-s-ink-2 md:text-[15px]">
            <PriceFrom amount={price} label="ab" />
          </div>
        </div>
        <Link
          href={href}
          className="font-body shrink-0 rounded-full border border-s-border bg-white px-5 py-2 text-[13px] font-semibold text-s-ink transition-colors hover:bg-s-bg-sunken md:px-6 md:py-2.5 md:text-[14px]"
        >
          Buchen
        </Link>
      </div>
    </li>
  );
}

export default async function DecisionShadowPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const salon = await getSeedSalon("de");
  if (!salon || salon.services.length === 0) notFound();

  const rows = salon.services.slice(0, 3);
  const bookingHref = (serviceId: string) => `/de/salon/${salon.slug}/booking?service=${serviceId}`;

  return (
    <div className="mx-auto min-h-screen w-full max-w-[375px] bg-white">
      <DecisionHeader
        title="PDP-Sektionskarte: Schatten"
        decision="Services-Karte: shadow-whisper in Ruhe, kein Hover (aktuell) vs. flach/Haarlinie in Ruhe + shadow-elevation-2 bei Hover (Nachbar-Karten SalonLoyalty/SalonOtherLocations)."
      />
      <div className="space-y-8 p-4">
        <div>
          <DecisionChip letter="A" value="shadow-whisper" />
          <ul className="mt-3 overflow-hidden rounded-[24px] border border-s-border bg-white shadow-whisper">
            {rows.map((s) => (
              <ServiceRow
                key={s.id}
                name={s.name_de}
                duration={formatDurationDE(s.duration_minutes)}
                price={s.price}
                href={bookingHref(s.id)}
              />
            ))}
          </ul>
        </div>
        <div>
          <DecisionChip letter="B" value="Hover: elevation-2" />
          <ul className="mt-3 overflow-hidden rounded-[24px] border border-s-border bg-white transition-shadow duration-200 hover:shadow-elevation-2">
            {rows.map((s) => (
              <ServiceRow
                key={s.id}
                name={s.name_de}
                duration={formatDurationDE(s.duration_minutes)}
                price={s.price}
                href={bookingHref(s.id)}
              />
            ))}
          </ul>
        </div>
      </div>
      <div className="px-4">
        <DecisionCaption>
          Reale Services von {salon.name}. SalonServices.tsx bleibt unverändert; B
          übernimmt exakt das Hover-Muster von SalonLoyalty.tsx / SalonOtherLocations.tsx.
        </DecisionCaption>
      </div>
      <div className="h-8" />
    </div>
  );
}
