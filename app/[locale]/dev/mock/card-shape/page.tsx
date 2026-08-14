/**
 * /dev/mock/card-shape , the salon tile, the only thing eight branches actually disagree about.
 *
 * Owner 2026-08-14, answering how to settle a screen clash: "Show me each version, I pick", and to
 * the question of which screen first: "mockup bro harden".
 *
 * WHAT THE CLASH ACTUALLY IS, measured across every branch that carries its own SalonCard.tsx
 * rather than assumed from the file count. Eight branches have their own copy and the files differ,
 * but on the four things you can SEE they are nearly identical:
 *
 *   version                                  photo shape   corner   shadow         name
 *   main                                     5/4           10       elevation-2    12 semibold
 *   animation-reference-recognition          5/4           10       elevation-2    12 semibold
 *   quirky-ellis                             5/4           10       elevation-2    12 semibold
 *   clever-mirzakhani                        6/5           10       elevation-2    12 semibold
 *   crazy-bose                               6/5           10       elevation-2    12 semibold
 *   design-system-consolidation              6/5           10       elevation-2    12 semibold
 *   elated-raman                             6/5           10       elevation-2    12 semibold
 *   happy-jackson                            6/5           10       elevation-2    12 semibold
 *   sad-austin                               6/5           10       elevation-2    12 semibold
 *
 * So there are not eight looks to choose between. There are TWO, and the whole disagreement is
 * whether the photo is 5/4 (1.25, what ships) or 6/5 (1.2, what six branches settled on). Corner,
 * shadow and text are the same in all nine.
 *
 * For scale, measured on Airbnb's own home the same week: 1.053, squarer than either.
 *
 * The shape follows the mockup definition at the top of public/_mockups/_BASE.md: one real screen,
 * full-bleed, silent, before and after on a toggle. No prose on the page.
 *
 * exists-check: `npm run exists "salon card shape"` = 0 matches, run this turn.
 *
 * Dev-only, notFound() in production.
 */
import { notFound } from "next/navigation";
import { MockShell, MockRoute } from "../_shell/MockShell";

// The one thing that differs. 6/5 is what six of the eight branches chose.
const PROPOSED = `
  [class*="aspect-[5/4]"] { aspect-ratio: 6 / 5 !important; }
`;

// THREE STOPS, not two (owner 2026-08-14, "shapes i want now"). The branches only ever disagreed
// about A versus B, and measured on the rendered home card those two sit 8px apart: 239x191 at 5/4
// against 239x199 at 6/5. A choice you cannot see is not a choice, so the reference joined it:
// Airbnb's own home card measured 1.053, which is 239x227 at our width. measure-ok, numbers from
// getBoundingClientRect on this page and from the Airbnb capture, neither eyeballed.
const SHAPES = [
  { label: "A", css: "" },
  { label: "B", css: `[class*="aspect-[5/4]"] { aspect-ratio: 6 / 5 !important; }` },
  { label: "C", css: `[class*="aspect-[5/4]"] { aspect-ratio: 20 / 19 !important; }` },
];

export default function CardShapePage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <MockShell proposed={PROPOSED} options={SHAPES}>
      <MockRoute src="/de" />
    </MockShell>
  );
}
