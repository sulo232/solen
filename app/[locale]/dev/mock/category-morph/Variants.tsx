"use client";

// exists-check: `npm run exists "category morph"` = 0. The categories, their colours and their
// icons are IMPORTED from `searchCategories.ts`, the one source. Nothing is re-declared.
//
// ROUND 2, owner 2026-08-12: "i want the keep the structure and the thing yk i jst wanna change the
// icon and the shape yk i want glossy sh on the icon not the pill or circl bro".
//
// Round 1 was wrong in the place that mattered: it put the glass on the CONTAINER. The container is
// now the plain locked recipe in all three, and the gloss lives on the GLYPH ITSELF. What varies is
// how the glyph is made glossy, which is the only question left open.
//
// HOW A STROKE ICON IS MADE GLOSSY, since this is not a colour swap: our icons are Lucide, which
// renders a stroked SVG using `currentColor`. Painting a gradient onto a stroke needs a real SVG
// paint server, so each direction defines its own `<linearGradient>` once and points the stroke, or
// the fill, at it. That is why there is an inline `<svg>` of definitions at the bottom rather than
// a CSS filter: a filter blurs the shape, a paint server keeps it crisp.
//
// drift-ok on every gradient stop below: a gloss is made of INTERMEDIATE values between our ink and
// white, and the palette has no tokens at those steps by design. They exist only inside these three
// gradients in a dev mockup; if he picks one, the winning ramp becomes a named token in the same
// pass rather than staying loose here.
//
// lang-ok: category labels come from the app's own constant; the only strings this file owns are
// the three direction names, in English.

import * as React from "react";
import Image from "next/image";
import { CATEGORIES } from "@/app/[locale]/_components/homepage/searchCategories";

// ROUND 3, owner 2026-08-12: "the icons ur choosing doesnt make any scence bro why diamonds etc ik
// uon got but generate using higgsfield ir smth". He is right: a diamond is not a nail, and the
// scissors was doing duty for two categories. So a set was GENERATED rather than borrowed.
//
// What was generated and how, so the next person does not redo it: four flat coral shapes in one
// row, one prompt, four variants, 2 credits. Two of the four came back with the gloss on a TILE
// behind the object, which is the exact surface he told me not to gloss; one came back with the
// gloss ON the object and no tile, which is what he asked for. That one was cut into four squares,
// white made transparent, saved at 256px to /icons/categories/gloss/.
// Each object now means its own category: shears, clippers, a polish bottle, spa stones.
const GENERATED: Record<string, string> = {
  Coiffeur: "/icons/categories/gloss/coiffeur.png",
  Barbershop: "/icons/categories/gloss/barbershop.png",
  Nails: "/icons/categories/gloss/nails.png",
  "Spa & Wellness": "/icons/categories/gloss/spa.png",
};

function useSelection(initial = 0) {
  const [i, setI] = React.useState(initial);
  return { i, setI };
}

/**
 * The container, identical in all three and unchanged from what ships: circle at rest, the locked
 * sunken pill when chosen. No glass, no gradient, no highlight anywhere on it.
 */
function Row({ glossClass, iconStyle, art }: { glossClass?: string; iconStyle?: React.CSSProperties; art?: boolean }) {
  const { i, setI } = useSelection();
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
            {art ? (
              <Image src={GENERATED[c.label]} alt="" width={26} height={26} className="shrink-0" />
            ) : (
              <Icon size={22} strokeWidth={2.1} className={glossClass} style={iconStyle} />
            )}
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

const DIRECTIONS = [
  {
    key: "A",
    title: "Gloss along the stroke",
    note: "The line itself runs light at the top to deep at the bottom. Subtlest.",
    props: { iconStyle: { stroke: "url(#gloss-a)" } as React.CSSProperties },
  },
  {
    key: "B",
    title: "Gloss plus a lift",
    note: "Same idea, with a white edge above and a soft shadow under the glyph, so it sits off the surface.",
    props: { glossClass: "mock-gloss-b", iconStyle: { stroke: "url(#gloss-b)" } as React.CSSProperties },
  },
  {
    key: "D",
    title: "Generated set, gloss on the object",
    note: "Shears, clippers, a polish bottle, spa stones. Made for this, one colour, the shine on the shape itself.",
    props: { art: true },
  },
  {
    key: "C",
    title: "Filled and wet",
    note: "The glyph is filled as well as drawn, bright at the top and deep at the bottom. Heaviest, most liquid.",
    props: {
      glossClass: "mock-gloss-c",
      iconStyle: { stroke: "url(#gloss-c)", fill: "url(#gloss-c-fill)" } as React.CSSProperties,
    },
  },
];

export default function Variants() {
  return (
    <div className="space-y-8">
      <style>{`
        .mock-gloss-b { filter: drop-shadow(0 1px 0 rgba(255,255,255,0.95)) drop-shadow(0 1px 1px rgba(10,10,10,0.18)); }
        .mock-gloss-c { filter: drop-shadow(0 1px 0 rgba(255,255,255,0.9)) drop-shadow(0 2px 3px rgba(10,10,10,0.22)); }
      `}</style>

      {DIRECTIONS.map(({ key, title, note, props }) => (
        <section key={key}>
          <p className="text-[13px] font-semibold text-s-ink-2">
            {key}. {title}
          </p>
          <p className="mb-3 text-[13px] leading-snug text-s-ink-2">{note}</p>
          <Row {...props} />
        </section>
      ))}

      {/* The paint servers. One ramp per direction, referenced by the stroke and fill above. */}
      <svg width="0" height="0" aria-hidden focusable="false" className="absolute">
        <defs>
          <linearGradient id="gloss-a" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6E6E73" /> {/* drift-ok: gloss ramp step, no token at this value */}
            <stop offset="45%" stopColor="#2B2B2E" /> {/* drift-ok: gloss ramp step */}
            <stop offset="100%" stopColor="#0A0A0A" />
          </linearGradient>
          <linearGradient id="gloss-b" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9A9AA0" /> {/* drift-ok: gloss ramp step */}
            <stop offset="35%" stopColor="#3A3A3E" /> {/* drift-ok: gloss ramp step */}
            <stop offset="100%" stopColor="#0A0A0A" />
          </linearGradient>
          <linearGradient id="gloss-c" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#B8B8BE" /> {/* drift-ok: gloss ramp step */}
            <stop offset="100%" stopColor="#26262A" /> {/* drift-ok: gloss ramp step */}
          </linearGradient>
          <linearGradient id="gloss-c-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
            <stop offset="40%" stopColor="#D5D5DA" stopOpacity="0.75" /> {/* drift-ok: gloss ramp step */}
            <stop offset="100%" stopColor="#4A4A50" stopOpacity="0.55" /> {/* drift-ok: gloss ramp step */}
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
