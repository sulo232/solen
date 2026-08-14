"use client";

// exists-check: `npm run exists "category morph"` = 0. Categories come from `searchCategories.ts`.
//
// ROUND 5, owner: "icons are not at all what i want".
//
// I have now guessed the icon style FOUR times and been wrong four times: 3D renders in colour, a
// gloss on the container, a gloss on the glyph, a generated coral set, a generated black set. Every
// one of those was me choosing a style he never named. Guessing a fifth time is the expensive move,
// so this page stops proposing and starts asking with something to point at.
//
// WHAT IS ON THIS PAGE: the two icon families we ALREADY OWN and that he has NOT rejected, at the
// real size, in the real chip. Line is what every other icon in the product uses today. Solid is
// the same set filled. If either is it, he says a word and it is done; if neither, the fastest path
// is one screenshot of icons he likes from any app, because nothing on disk tells me.
//
// WHAT WAS CHECKED FIRST, so this is not a lazy question:
//   - his screenshots folder, for a reference he may already have dropped: nothing icon-related
//     since 2026-08-03
//   - TASTE_LOG for an approved icon FAMILY: it fixes stroke width by size and kills the grey tile
//     behind row glyphs, and never names a family
//   - the repo for a second icon set: `lucide-react` is the only one installed
//
// lang-ok: labels come from the app's own constant; this file owns no copy.

import * as React from "react";
import { CATEGORIES } from "@/app/[locale]/_components/homepage/searchCategories";

/** The chip, unchanged from what he approved: circle at rest, the locked pill when chosen. */
function Row({ fill }: { fill: boolean }) {
  const [i, setI] = React.useState(0);
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {CATEGORIES.map((c, n) => {
        const on = n === i;
        const Icon = c.icon;
        return (
          <button
            key={c.label}
            onClick={() => setI(n)}
            className={`flex h-12 shrink-0 items-center gap-2 overflow-hidden rounded-full transition-all duration-300 ease-glide ${
              on ? "bg-s-bg-sunken px-4" : "w-12 justify-center border border-s-border bg-white"
            }`}
          >
            <Icon
              size={22}
              strokeWidth={fill ? 1 : 2}
              className="shrink-0 text-s-ink"
              fill={fill ? "currentColor" : "none"}
            />
            <span
              className={`whitespace-nowrap text-[15px] font-semibold text-s-ink transition-all duration-300 ${
                on ? "max-w-[140px] opacity-100" : "max-w-0 opacity-0"
              }`}
            >
              {c.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function Variants() {
  return (
    <div className="space-y-8">
      <section>
        <p className="mb-3 text-[13px] font-semibold text-s-ink-2">Line, what the rest of the app uses</p>
        <Row fill={false} />
      </section>
      <section>
        <p className="mb-3 text-[13px] font-semibold text-s-ink-2">Solid, the same set filled in</p>
        <Row fill />
      </section>
    </div>
  );
}
