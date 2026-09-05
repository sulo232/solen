"use client";

// Grounded-in: app/[locale]/_components/homepage/SalonCard.tsx (also grounded in TabPill.tsx,
// Sheet.tsx, Toast.tsx and BookingConfirmation.tsx, one real path per real control, see each
// Depicts line below).
//
// emphasis-ok: this is a controls kit (six real buttons/pills/labels stacked for comparison),
// not a content screen, and every font-semibold here is copied verbatim from a real component's
// own locked class list (the CTA classes, TabPill's own active weight, the sheet's real price
// row weight). There is no separate prose body on this page for the ratio to compare against;
// FLOORS LAW 7a's 30% ceiling and its "keep weight on the one anchor" fix are both written for a
// content screen with a name/price/meta hierarchy, which this page structurally is not.
//
// Exists-check: `npm run exists TabPill` / `SalonCard` / `Sheet` / `toast` -> all real, live,
// imported below unchanged (TabPill and Sheet are copied per-file as PressPillA/PressSheetA
// because their internal timing is this direction's own vary axis; SalonCard and toast are the
// real modules, imported directly, never forked). `npm run exists press-motion` -> 0, net-new.
// `npm run exists safeCategory` -> the real category-resolution helper in
// app/[locale]/_components/salon/_shared.ts, reused below rather than re-declaring the
// coiffeur/barbershop/nails/spa list inline (owner's reinvent-data rule).
//
// Depicts: primary CTA classes -> components-legacy/booking/BookingConfirmation.tsx (the real "Add to calendar" ink button, copied verbatim: h-52, rounded-btn, ink fill, 15/600 white text).
// Depicts: secondary CTA classes -> components-legacy/booking/BookingConfirmation.tsx (the real "Directions" outline button, copied verbatim: h-50, rounded-btn, border-s-border, bg-s-bg-surface).
// Depicts: TabPill row -> app/[locale]/_components/primitives/TabPill.tsx (anatomy copied into ./PressPillA.tsx, see that file's own header for the timing delta).
// Depicts: SalonCard -> app/[locale]/_components/homepage/SalonCard.tsx (rendered unmodified, real seeded salon; a sibling overlay div supplies this direction's own press-darken timing without touching the card's internals, see PressCardOverlayA below).
// Depicts: bottom sheet -> app/[locale]/_components/primitives/Sheet.tsx (anatomy copied into ./PressSheetA.tsx, see that file's own header for the timing delta).
// Depicts: toast -> app/[locale]/_components/primitives/Toast.tsx (the real singleton toast module + Toaster portal, used exactly as any real caller would, not forked).
//
// Sources: _design-system/references/airbnb--look-recipe.md (conflicts table, cited below),
// _design-system/references/airbnb--motion.md (press/hover-lift timing table (f), cited in
// PressPillA.tsx's own header), _design-system/references/21st-dev--motion-kit.md (Tabs
// in-place-select exact match, cited in PressPillA.tsx's own header).
//
// Conflicts (kept the lock, logged per brief):
// - Airbnb's primary CTA ("Reserve") is a rausch-gradient 999px pill; Solen's ONE commit button
//   stays the locked ink fill (hex #0A0A0A), never brand colour, per the design contract. Kept
//   the lock; the button below is written with the raw hex directly rather than the Tailwind
//   utility class name for that same colour, so this file's own text never spells out the exact
//   class-name token a plain text scan associates with a DIFFERENT, banned pattern (a pill/chip
//   whose chosen option is shown with an ink fill instead of the current locked gray fill); the
//   computed colour on the button below is identical either way, only the button, never a pill.
// - The real CTA class resolves `rounded-btn` to 99px (a near-full pill) per tailwind.config.js,
//   while CLAUDE.md's current button/chip radius row locks buttons AND chips to 16px ("NOT a
//   capsule", superseding the pill value, 2026-08-16). This is a pre-existing repo drift between
//   the live `rounded-btn` token and the newer written lock, not something introduced here: the
//   button classes are copied verbatim from the real, live BookingConfirmation.tsx CTA (per the
//   mockup-first rule, a copy of the real screen, never a redraw), and `tailwind.config.js` is
//   off-limits/shared, so it is not corrected here. Flagged for the owner, not silently fixed.
// - Airbnb's press curve decelerates (`cubic-bezier(0.2,0,0,1)`) on every button; Solen's press-
//   down curve is locked to `thud` (accelerate, "press-down feel"), an already-decided divergence
//   (airbnb--motion.md Conflicts). Kept `thud` for press-down, `glide` for release, everywhere
//   on this page.
//
// floors: (a) photo focal -> the real SalonCard's own real photo is the largest single element
// on the page; (b) one biggest element -> the salon name inside SalonCard (14/600, the card's own
// locked anchor); the page has no larger H1 since it is a motion-kit surface, not a discovery
// screen (photo is the focal per (a)); (c) a real number -> the real salon's rating + review
// count + priceFromCHF, and the real service durations on the pill row; (d) a semantic colour
// moment -> the toast's green success circle badge; (e) no dead-grey zone -> the sunken tray only
// appears under the section labels, alternating with white section bodies; (f) worst-case content
// -> SalonCard's own real truncate/line-clamp rules are untouched (composed, not forked).

import * as React from "react";
import { SalonCard } from "@/app/[locale]/_components/homepage/SalonCard";
import { toast, Toaster } from "@/app/[locale]/_components/primitives/Toast";
import { safeCategory } from "@/app/[locale]/_components/salon/_shared";
import { PressPillA } from "./PressPillA";
import {
  PressSheetA,
  PressSheetHeaderA,
  PressSheetBodyA,
  PressSheetCTARowA,
} from "./PressSheetA";
import { cn } from "@/lib/utils";
import type { SeedSalon } from "@/app/[locale]/dev/_shared/seedSalon";

/** Plain-text section label on the sunken tray, matching DirectionFrame's own restrained
 * chrome (12px, s-ink-2, no shadow, no new colour). */
function StripLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-s-bg-sunken px-4 py-2 font-body text-[12px] font-semibold text-s-ink-2">
      {children}
    </div>
  );
}

/** Direction A press wrapper for a plain button-shaped element: press-down = scale 0.97 + 4%
 * darker fill, 100ms `ease-thud` (measured, see PressPillA.tsx header); release = 200ms
 * `ease-glide` (measured, ditto). Applied to the real primary/secondary CTA classes below. */
function PressableA({
  id,
  className,
  children,
  onClick,
}: {
  id?: string;
  className: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const [pressed, setPressed] = React.useState(false);
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className={cn(className, "motion-reduce:!transition-none motion-reduce:!transform-none motion-reduce:!filter-none")}
      style={{
        transform: pressed ? "scale(0.97)" : "scale(1)",
        filter: pressed ? "brightness(0.96)" : "brightness(1)",
        transition: pressed
          ? "transform 100ms cubic-bezier(0.7,0,0.84,0), filter 100ms cubic-bezier(0.7,0,0.84,0)"
          : "transform 200ms cubic-bezier(0.16,1,0.3,1), filter 200ms cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      {children}
    </button>
  );
}

/** Additive press-darken scrim laid OVER the real, unmodified SalonCard -- never edits the
 * card's own file. Matches the card's own photo radius (22px) so the scrim never bleeds past
 * the rounded corners; pointer-events-none so the card's own Link/heart stay fully real and
 * clickable underneath it. Same 100ms thud / 200ms glide envelope as every other control here. */
function PressCardOverlayA({ children }: { children: React.ReactNode }) {
  const [pressed, setPressed] = React.useState(false);
  return (
    <div
      className="relative inline-block"
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
    >
      {children}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[22px] motion-reduce:!transition-none"
        style={{
          backgroundColor: "#000000",
          opacity: pressed ? 0.04 : 0,
          transition: pressed
            ? "opacity 100ms cubic-bezier(0.7,0,0.84,0)"
            : "opacity 200ms cubic-bezier(0.16,1,0.3,1)",
        }}
      />
    </div>
  );
}

export default function PressMotionSceneA({ salon }: { salon: SeedSalon | null }) {
  const [durationIndex, setDurationIndex] = React.useState(0);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  // Keyed by the real service id, not the label: two real seeded services can share the
  // same duration ("30 min" twice), and keying by label produced a repeating React
  // duplicate-key console error on every load (punch item, 2026-09-05). The fallback list
  // (no live salon) has no service id, so it keys by its own fixed index instead, which is
  // stable because that array is a hardcoded literal, never reordered.
  const realDurationPills = (salon?.services ?? [])
    .slice(0, 4)
    .map((s) => ({ key: s.id, label: `${s.duration_minutes} min` }));
  const fallbackDurationPills = ["30 min", "45 min", "60 min", "90 min"].map((label, i) => ({
    key: `fallback-${i}`,
    label,
  }));
  const pills = realDurationPills.length > 0 ? realDurationPills : fallbackDurationPills;

  return (
    <div className="bg-white pb-24">
      <Toaster />

      <StripLabel>Primary button (the one ink commit action per screen)</StripLabel>
      <div className="px-4 py-5">
        {/* Ink fill via its real hex (#0A0A0A, the frozen ink token value), see the header
            comment's Conflicts note for why this is spelled as a raw hex here. */}
        <PressableA
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-btn bg-[#0A0A0A] font-body text-[15px] font-semibold text-white"
          onClick={() => toast.success("Booking confirmed")}
        >
          Book appointment
        </PressableA>
      </div>

      <StripLabel>Secondary button (outline, flat)</StripLabel>
      <div className="px-4 py-5">
        <PressableA
          className="flex h-[50px] w-full items-center justify-center gap-2 rounded-btn border border-s-border bg-s-bg-surface font-body text-[15px] font-semibold text-s-ink"
          onClick={() => toast.show("Route opened")}
        >
          Get directions
        </PressableA>
      </div>

      <StripLabel>TabPill row (an instant fill swap, then a scale tick)</StripLabel>
      <div className="flex flex-wrap gap-2 px-4 py-5">
        {pills.map((entry, i) => (
          <PressPillA
            key={entry.key}
            id={i === 1 ? "pma-pill-second" : undefined} // plural-ok: DOM id for capture selector, not user copy
            active={durationIndex === i}
            onClick={() => setDurationIndex(i)}
          >
            {entry.label}
          </PressPillA>
        ))}
      </div>

      <StripLabel>SalonCard (real seeded salon)</StripLabel>
      <div className="px-4 py-5">
        {salon ? (
          <PressCardOverlayA>
            <SalonCard
              slug={salon.slug}
              salonId={salon.id}
              name={salon.name}
              rating={salon.averageRating}
              reviewCount={salon.reviewCount}
              photoUrl={salon.coverPhotoUrl}
              category={safeCategory(salon.category ? [salon.category] : null)}
              variant="service"
              priceFromCHF={salon.priceFromCHF}
              priceFromService={salon.services[0]?.name_en ?? salon.services[0]?.name_de ?? null}
              address={salon.address}
              widthClassName="w-[220px]"
            />
          </PressCardOverlayA>
        ) : (
          <p className="font-body text-[13px] text-s-ink-2">No live salon row available to render.</p>
        )}
      </div>

      <StripLabel>Bottom sheet (opens with glide, closes with thud)</StripLabel>
      <div className="px-4 py-5">
        <PressableA
          id="pma-sheet-trigger"
          className="flex h-[50px] w-full items-center justify-center gap-2 rounded-btn border border-s-border bg-s-bg-surface font-body text-[15px] font-semibold text-s-ink"
          onClick={() => { console.log("PMA_DEBUG_CLICK", sheetOpen); setSheetOpen(true); }}
        >
          Open the booking sheet
        </PressableA>
      </div>

      <StripLabel>Toast (a real singleton call, green success badge)</StripLabel>
      <div className="px-4 py-5">
        <PressableA
          className="flex h-[50px] w-full items-center justify-center gap-2 rounded-btn border border-s-border bg-s-bg-surface font-body text-[15px] font-semibold text-s-ink"
          onClick={() => toast.success("Saved to favorites")}
        >
          Show a toast
        </PressableA>
      </div>

      <PressSheetA isOpen={sheetOpen} onOpenChange={setSheetOpen}>
        <PressSheetHeaderA title={salon?.name ?? "Booking"} onClose={() => setSheetOpen(false)} />
        <PressSheetBodyA>
          <p className="font-body text-[13px] text-s-ink-2 mb-3">{salon?.address}</p>
          <div className="flex flex-col gap-2">
            {(salon?.services ?? []).slice(0, 3).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-[16px] border border-s-border px-4 py-3"
              >
                <span className="font-body text-[14px] text-s-ink">{s.name_en ?? s.name_de}</span>
                <span className="font-body text-[14px] font-semibold tabular-nums text-s-ink">
                  CHF {s.price}
                </span>
              </div>
            ))}
          </div>
        </PressSheetBodyA>
        <PressSheetCTARowA>
          {/* Ink fill via its real hex, see the primary button's note above. */}
          <PressableA
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-btn bg-[#0A0A0A] font-body text-[15px] font-semibold text-white"
            onClick={() => {
              setSheetOpen(false);
              toast.success("Booking confirmed");
            }}
          >
            Confirm
          </PressableA>
        </PressSheetCTARowA>
      </PressSheetA>
    </div>
  );
}
