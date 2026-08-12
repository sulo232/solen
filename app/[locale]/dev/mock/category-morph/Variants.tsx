"use client";

// exists-check: `npm run exists "category morph"` = 0. The categories come from
// `searchCategories.ts`, the one source; nothing is re-declared.
//
// ROUND 4, and the previous three are deleted rather than kept as options, because he closed them:
//   R1 he asked for circles that morph into pills, with a glare. I put the glass on the container.
//   R2 "i want glossy sh on the icon not the pill or circl bro" , moved it onto the glyph, three ways.
//   R3 "the icons ur choosing doesnt make any scence bro why diamonds etc ... generate" , generated
//      a coral set with the shine on the object.
//   R4 "wtf are these colors bro stop maiking dumb sh up make it black flat jst normal icons bro"
//
// So: black, flat, normal. No colour, no gloss, no gradient, no lift, no options. One row.
// The only thing kept from his own idea is the shape: circle at rest, the locked pill when chosen.
//
// The icons are generated, because our glyph set has no barber tool and no polish bottle, which is
// how nails ended up as a diamond and hair salon and barber ended up sharing one pair of scissors.
// Four solid black silhouettes: shears, clippers, a polish bottle, spa stones. Measured on the
// chosen sheet before cutting: 0.0% coloured pixels.
//
// lang-ok: the labels come from the app's own constant; this file owns no copy.

import * as React from "react";
import Image from "next/image";
import { CATEGORIES } from "@/app/[locale]/_components/homepage/searchCategories";

const ICON: Record<string, string> = {
  Coiffeur: "/icons/categories/flat/coiffeur.png",
  Barbershop: "/icons/categories/flat/barbershop.png",
  Nails: "/icons/categories/flat/nails.png",
  "Spa & Wellness": "/icons/categories/flat/spa.png",
};

export default function Variants() {
  const [i, setI] = React.useState(0);
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {CATEGORIES.map((c, n) => {
        const on = n === i;
        return (
          <button
            key={c.label}
            onClick={() => setI(n)}
            className={`flex h-12 shrink-0 items-center gap-2 overflow-hidden rounded-full transition-all duration-300 ease-glide ${
              on ? "bg-s-bg-sunken px-4" : "w-12 justify-center border border-s-border bg-white"
            }`}
          >
            <Image src={ICON[c.label]} alt="" width={22} height={22} className="shrink-0" />
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
