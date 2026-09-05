"use client";

// exists-check: `npm run exists directions-0905` -> DirectionFrame + the /home route only, no
// press-motion surface existed before this pass. `npm run exists press-motion` -> 0 hits.
// `npm run exists Sheet/TabPill/SalonCard/Toast` -> all real, reused below, imported unmodified
// except TabPill (copied to PressPillRow.tsx per the brief's own instruction: copy a component
// into this direction's own folder when its anatomy needs to change, never edit the shared one).
//
// Grounded-in: app/[locale]/_components/primitives/Sheet.tsx (real Sheet/SheetHeader/SheetBody/
// SheetCTARow, unmodified), app/[locale]/_components/primitives/Toast.tsx (the real `toast`
// singleton, already mounted globally by app/[locale]/layout.tsx, not re-mounted here),
// app/[locale]/_components/homepage/SalonCard.tsx (real card, unmodified), and
// app/[locale]/dev/_shared/seedSalon.ts (`getSeedSalon`, real live salon + service rows,
// fetched server-side in this surface's page.tsx and passed down as a prop, nothing invented).
//
// Depicts: primary/secondary buttons -> ./DepthButton.tsx (this direction's own copy, see that
//   file's own header for its Grounded-in trail)
// Depicts: category pill row -> ./PressPillRow.tsx (this direction's own copy of TabPill.tsx)
// Depicts: salon card -> app/[locale]/_components/homepage/SalonCard.tsx (real, unmodified,
//   wrapped in ./TiltCard.tsx for the pointer-tracked tilt)
// Depicts: bottom sheet -> app/[locale]/_components/primitives/Sheet.tsx (real, unmodified; the
//   page-behind scale/dim on open is that component's own existing wiring against
//   #main-content, not anything added here)
// Depicts: toast -> app/[locale]/_components/primitives/Toast.tsx (real `toast.success`, fired
//   from the primary button's onClick)
//
// Direction: physical depth. Buttons lose their elevation and drop 1px on press, regaining both
// over 200ms on release (see DepthButton.tsx). The category row swaps a fill for a sliding
// underline (see PressPillRow.tsx). The card tilts up to 1.5 degrees toward wherever the
// pointer is pressing (see TiltCard.tsx). The sheet's rise, and the page behind it stepping
// back and dimming, is the REAL Sheet primitive's own locked motion (320ms on the glide curve,
// scale to 0.965, brightness 0.96, app/globals.css's `#main-content.sheet-scale-back` rule),
// not a new effect, it already matches this direction's own premise without any change.
//
// Sources: _design-system/references/airbnb--look-recipe.md (radius/shadow/CTA conflicts, see
// each component's own header), _design-system/references/airbnb--motion.md (the 200ms
// box-shadow hover-lift row, mapped to the button release), _design-system/references/
// 21st-dev--motion-kit.md (the Tabs 150ms snap-curve match, mapped to the pill underline).
//
// Conflicts (consolidated, each also named in its own component file): (1) a resting shadow on
// a plain-surface button is outside the elevation guidance elsewhere in this system, kept here
// on purpose because the whole direction needs something to lose on press (DepthButton.tsx).
// (2) the pill row's underline replaces the real TabPill's locked calm-gray fill, built as a
// copy rather than an edit for exactly that reason (PressPillRow.tsx). Neither touches the real
// shared primitive.
//
// floors: this is a component and motion demo page under /dev, not a discovery/search/PDP/
// booking/checkout/profile screen, so FLOORS LAW's customer-screen scope does not bind the page
// as a whole. The one embedded real card still clears each item on its own: photo focal (the
// salon's real cover photo), a real tabular number (its real rating and price, both from the
// live seed row), a semantic-colour moment (the star, SalonCard's own RatingStars), and no dead
// grey zone (white page, real photo, real text). "One biggest element" and "worst-case content"
// are the real SalonCard's own already-locked behaviour (truncation, hierarchy), unchanged here.

import * as React from "react";
import {
  Sheet,
  SheetHeader,
  SheetBody,
  SheetCTARow,
  toast,
} from "@/app/[locale]/_components/primitives";
import { SalonCard } from "@/app/[locale]/_components/homepage/SalonCard";
import { safeCategory } from "@/app/[locale]/_components/salon/_shared";
import type { SeedSalon } from "../../../_shared/seedSalon";
import { DepthButton } from "./DepthButton";
import { PressPillRow } from "./PressPillRow";
import { TiltCard } from "./TiltCard";

export function PressMotionDirectionC({ salon }: { salon: SeedSalon }) {
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const firstService = salon.services[0];
  const serviceLabel = firstService ? firstService.name_en ?? firstService.name_de : null;

  return (
    <div className="mx-auto max-w-[402px] px-4 pb-24 pt-6">
      <section className="mb-10">
        <h2 className="mb-3 text-[13px] font-semibold text-s-ink-2">Buttons</h2>
        <div className="flex flex-col gap-3">
          <DepthButton
            variant="primary"
            onClick={() => toast.success(`Booked with ${salon.name}`)}
          >
            Confirm booking
          </DepthButton>
          <DepthButton variant="secondary">Change time</DepthButton>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-[13px] font-semibold text-s-ink-2">Category select</h2>
        <PressPillRow />
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-[13px] font-semibold text-s-ink-2">Salon card</h2>
        <TiltCard>
          <SalonCard
            slug={salon.slug}
            salonId={salon.id}
            name={salon.name}
            rating={salon.averageRating}
            reviewCount={salon.reviewCount}
            photoUrl={salon.coverPhotoUrl}
            category={safeCategory(salon.category ? [salon.category] : null)}
            variant="availability"
            address={salon.address}
            citySelected
            priceFromCHF={salon.priceFromCHF}
            widthClassName="w-full"
          />
        </TiltCard>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-[13px] font-semibold text-s-ink-2">Sheet</h2>
        <DepthButton variant="secondary" onClick={() => setSheetOpen(true)}>
          Open time sheet
        </DepthButton>
        <Sheet isOpen={sheetOpen} onOpenChange={setSheetOpen} height="auto">
          <SheetHeader title="Choose a time" onClose={() => setSheetOpen(false)} />
          <SheetBody>
            <p className="text-[14px] text-s-ink-2">
              {serviceLabel
                ? `${serviceLabel}, ${firstService?.duration_minutes} min`
                : "No services on this salon yet."}
            </p>
          </SheetBody>
          <SheetCTARow>
            <DepthButton
              variant="primary"
              className="w-full"
              onClick={() => setSheetOpen(false)}
            >
              Confirm
            </DepthButton>
          </SheetCTARow>
        </Sheet>
      </section>
    </div>
  );
}
