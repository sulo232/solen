/**
 * Grounded-in: components-legacy/discovery/DetailPage.tsx (the "book this look" salon row, lines 396-412).
 *
 * Exists-check: `npm run exists inspo detail price exact decision` -> 0 matches, net-new decision route.
 * `npm run exists decision-mockup` -> 1 REMOVED hit (bundles, unrelated to this surface).
 *
 * Depicts: book-this-look salon row -> components-legacy/discovery/DetailPage.tsx:396-412 (avatar, name,
 *   rating+review-count, price span, book pill , same classes, real markup, same 402px device width the
 *   real DetailPage container renders at on the owner's phone).
 * Depicts: row A price ("from CHF X") -> the CURRENT live render at DetailPage.tsx:409 (shown here as
 *   "from CHF X" in English; the shipped /de render literally says "ab CHF X").
 * Depicts: row B price (exact CHF + service subline) -> NET-NEW: the proposed treatment for the
 *   services.length===1 case computed in app/[locale]/inspo/[id]/page.tsx (priceExact/exactServiceName).
 *
 * Decision: the Inspo look-detail "book this look" salon row always renders "ab CHF X" (from CHF X) even
 * when a salon has exactly ONE in-category service, so the open-ended "from" word sits in front of a number
 * that is already the payable total, not a floor. Swiss PBV wants the payable total findable; this decision
 * is whether to drop "from" and show the exact service's name under the price when the salon has one
 * matching service, leaving the "several services" case (still genuinely a floor) unchanged.
 *
 * Both rows recreate the REAL row EXACTLY (avatar, name, rating+count, book pill) with the same classes
 * as DetailPage.tsx:396-412, only the trailing price block differs. CHF 45 / "Men's Haircut" are a labeled
 * example (this salon has one service in this look's category), not live data.
 *
 * Not-a-salon-card: this is the "book this look" compact list ROW inside DetailPage.tsx, not a
 * SalonResultCard/StoreCard result. It has no photo, no aspect-[3/2] image, no service-row list, no
 * "View store" off-ramp, and it never has, on the shipped page (a 40px initials avatar + name + rating +
 * inline price + a Buchen pill, one per line, no border between avatar and text). Copying it exactly is
 * the compliant move here, inventing SalonResultCard's photo-card grammar for a row that has never had one
 * would be the actual invented-UI violation.
 *
 * realsize-ok: a 2-up grid would halve this row below its real width. Stacked instead, both rows rendered
 * full-width at the 402px device constant (the same width the real DetailPage container renders at, per
 * _mockups/_BASE.md), one above the other, so each is judged at its real size, not a shrunk comparison pane.
 *
 * lang-ok: hardcoded English throughout per the mockup-copy rule, even though the shipped /de route reads
 * German ("ab CHF" / "Buchen") , the decision text says exactly where each row maps to the real German copy.
 */
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { DecisionChip, DecisionCaption, DecisionHeader } from "../_shared/DecisionChip";

const EXAMPLE_PRICE = 45;
const EXAMPLE_SERVICE_NAME = "Men's Haircut";
const EXAMPLE_SALON_NAME = "Barbershop Stein";

function RowShell({ letter, value, caption, priceBlock }: { letter: "A" | "B"; value: string; caption: string; priceBlock: React.ReactNode }) {
  return (
    <div className="mx-auto w-[402px] max-w-full">
      <DecisionChip letter={letter} value={value} />
      <div className="mt-4 rounded-card border border-s-border bg-white p-4">
        <div className="flex items-center gap-3">
          {/* content-image-ok: real initials-avatar treatment DetailPage.tsx ships today (its initials(s.name) helper), not a photo fallback , computed the same way (first letters), not a hardcoded icon. */}
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-s-bg-sunken font-heading text-[14px] font-bold tracking-[-0.02em] text-s-ink-2">{EXAMPLE_SALON_NAME.split(" ").map((w) => w.charAt(0)).join("")}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14.5px] font-semibold tracking-[-0.01em] text-s-ink">{EXAMPLE_SALON_NAME}</span>
            <span className="mt-0.5 inline-flex items-center gap-1 text-[12.5px] font-medium text-s-ink-2">
              <Star size={13} className="text-s-star" fill="currentColor" /> 4.82
              <span className="text-s-accent">(31)</span>
            </span>
          </span>
          <span className="flex items-center gap-3">
            {priceBlock}
            <span className="rounded-full border border-s-border bg-s-bg-sunken px-4 py-2 text-[13px] font-semibold text-s-ink">Book</span>
          </span>
        </div>
      </div>
      <DecisionCaption>{caption}</DecisionCaption>
    </div>
  );
}

export default function DecisionInspoExactPricePage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="mx-auto min-h-screen w-full max-w-[560px] bg-white">
      <DecisionHeader
        title="Inspo detail: price when exactly one service matches"
        decision={`Salon has ONE service in this look's category, priceFrom is already the payable total. A = today (always "from CHF X" / shipped German "ab CHF X"). B = "from" drops, service name shows as a subline (only when exactly one service matches; several services stays unchanged at "from CHF X").`}
      />
      <div className="flex flex-col gap-6 p-4">
        <RowShell
          letter="A"
          value='"from CHF X" (today)'
          caption="A one-service salon still shows the open-ended from word, even though the number is already the final price."
          priceBlock={
            <span className="font-heading text-[14.5px] font-bold tracking-[-0.01em] text-s-ink">from CHF {EXAMPLE_PRICE}</span>
          }
        />
        <RowShell
          letter="B"
          value="Exact price + service name"
          caption="from drops, the service name sits under the price (12px/400, text-s-ink-2). Several services: unchanged."
          priceBlock={
            <span>
              <span className="block font-heading text-[14.5px] font-bold tracking-[-0.01em] text-s-ink">CHF {EXAMPLE_PRICE}</span>
              <span className="block truncate text-[12px] font-normal text-s-ink-2">{EXAMPLE_SERVICE_NAME}</span>
            </span>
          }
        />
      </div>
    </div>
  );
}
