// Exists-check: `npm run exists directions-0905-r3` (run this session) returned 7 REMOVED hits,
// none of them a ghost-preview illustration (they cover the grey-band tray look system, the home
// A/B/C structures, the round-2 lift/rule/tray builds of this screen family, a search heading
// line, a review count, an index switcher block, a service-row button harness -- see
// _design-system/REMOVED.md for the full detail). `npm run exists "ghost preview"` (run this
// session) returned one prose mention only, a round-1 floors note that names the idea without
// building it, and one unrelated notes file, no existing component. `npm run exists Skeleton`
// found the real `<Skeleton>` / `<SkeletonCard>` primitives (components-legacy/ui/Skeleton.tsx,
// app/[locale]/_components/primitives/Skeleton.tsx + SkeletonCard.tsx) -- deliberately NOT
// composed here: those are the LOADING primitive (shimmer animation, per CLAUDE.md's own
// design-contract "states" row, which names two different anatomies for two different
// conditions), and reusing a shimmering loading placeholder for a screen that has nothing in it
// would misrepresent it as still loading. This file draws a STATIC content-shape preview instead,
// composing the real, registered kit `<Card>` primitive (FLOORS LAW 9) for its photo-shaped block
// rather than hand-rolling a rounded div.
//
// Depicts: the photo-shaped placeholder block -> ../../_kit/Card.tsx variant="photo" hasPhoto (composed under system "c", never redrawn).
//
// Real-source: app/[locale]/profile/favorites/page.tsx (the heart-corner citation two paragraphs below).
//
// Grounded-in: CLAUDE.md's own design-contract "states" row (the condition with nothing in it
// gets a filled ink CTA plus a 3D category icon or a ghost-preview, never a bare glyph). The PNGs
// under public/icons/categories/ (coiffeur/barbershop/nails/spa) are salon-CATEGORY icons; none of
// the three screens this build renders (bookings, saved, results) maps to a salon category, so
// the lock's other named option applies. The round-3 diagnosis note for this screen family
// (section 6, against Airbnb) records Airbnb's own highest-fidelity version of this same idea as
// "a real product screenshot" / "a fanned card-stack illustration previewing the content's own
// shape" -- this component rebuilds that idea on Solen's own tokens: a miniature, non-interactive
// preview of what a real result card will look like once its list is populated.
//
// The block's 160x120 size rounds _design-system/references/airbnb--look-recipe.md row 11
// (search-result card photo ratio, measured 1.331) to a clean 1.333 for a preview-scale
// illustration; the two text-placeholder bars sit flush under it with no gap-then-pad, per that
// same file's row 51 ("card name sits directly under the photo with no extra top padding").
//
// The favorites-only heart accent (top-right of the photo block) places itself where
// app/[locale]/profile/favorites/page.tsx's own live copy (messages/en.json
// profileFavorites.hintText) already tells a user to look: "You'll find the heart in the top
// right of every salon photo." Its FILL is Solen's own universal save hue, #FF3366
// (_plans/R3_ONE_SYSTEM.md's own "locks all three candidates inherit" preamble names this
// unconditionally), not the achromatic `OVER_PHOTO_CONTROL_C.saveHeart` port in tokens.ts
// (rgba(0,0,0,0.5) fill / white stroke): that token is written for a LIVE, working save button on
// a real photo, and swapping in its colourless version here would remove this fold's one clean
// semantic-colour moment (FLOORS LAW 1d) for no gain. The white STROKE from that same token is
// kept regardless of fill colour, since it is what keeps a small icon legible over a flat fill.
//
// measured / floors: see ./page.tsx's own header for the full six-item finished pass; this file
// draws one reusable illustration, it is not a screen on its own.
//
// system: candidate C only. The photo block's flat / no-shadow / 20px-radius treatment comes
// entirely from <Card>'s own useSystem() read (its hasPhoto branch, keyed on system.key === "c");
// this file does not read useSystem() a second time or duplicate that logic.

import { Heart } from "lucide-react";
import { Card, COLOR } from "../../_kit";

export interface GhostContentPreviewProps {
  /** Adds the favorites-only heart accent (see header comment for why only this one carries it). */
  withHeartAccent?: boolean;
}

/** A static, non-interactive preview of the shape a real result card will take once its own list
 * is populated: a photo-block placeholder (candidate C's own flat Card recipe, 20px radius) plus
 * two short text-placeholder bars in its exact anatomy (a name line, a meta line), flush under the
 * photo with no gap-then-pad. */
export function GhostContentPreview({ withHeartAccent }: GhostContentPreviewProps) {
  return (
    <div aria-hidden="true" className="flex flex-col items-center">
      <Card variant="photo" hasPhoto className="relative w-[160px] h-[120px]">
        <div className="absolute inset-0" style={{ backgroundColor: COLOR.hairline }} />
        {withHeartAccent && (
          <Heart
            size={20}
            fill={COLOR.save}
            stroke="#FFFFFF"
            strokeWidth={1.5}
            style={{ position: "absolute", top: 8, right: 8 }}
          />
        )}
      </Card>
      <div className="mt-[10px] flex flex-col items-center gap-[6px]">
        <div style={{ width: 100, height: 8, borderRadius: 9999, backgroundColor: COLOR.hairline }} />
        <div style={{ width: 64, height: 8, borderRadius: 9999, backgroundColor: COLOR.hairline }} />
      </div>
    </div>
  );
}
