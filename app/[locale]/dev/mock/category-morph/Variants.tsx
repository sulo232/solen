"use client";

// exists-check: `npm run exists "category morph"` = 0. The categories, their colours and their
// icons are IMPORTED from `searchCategories.ts`, the one source; nothing is re-declared here. The
// locked pill treatment lives in `TabPill` and direction A reproduces its selected recipe rather
// than inventing a new one.
//
// Owner 2026-08-12: "instead of pills like circle n once u click then it bcms pill all morphism and
// also the icon i want it like abit glare yk like 3d liquid style icons yk".
//
// THE TENSION IN THE ASK, named rather than smoothed: "flat icons" and "3d liquid style" pull
// opposite ways. My reading is that he wants a FLAT SHAPE (not the photo-real hair dryer he
// rejected this morning) with a gloss on top so it reads as glass. So all three directions keep the
// real Lucide glyph and vary how much glass sits around it, rather than offering flat versus 3D.
//
// The drift ledger records this exact trap from 2026-07-12, "turned every icon into a colored glass
// disc", which I did unprompted. This time he asked for it by name, and the icon underneath is
// still the real one.
//
// lang-ok: category labels come from the app's own constant; the only strings this file owns are
// the three direction names, in English.

import * as React from "react";
import { CATEGORIES } from "@/app/[locale]/_components/homepage/searchCategories";

/** Shared behaviour: one selected at a time, circle when not, pill when it is. */
function useSelection(initial = 0) {
  const [i, setI] = React.useState(initial);
  return { i, setI };
}

/* ------------------------------------------------------------------ A: the locked pill, morphing */

/**
 * A. His idea on our existing recipe. Circle at rest, and on tap it grows into the pill this
 * project already locked: sunken grey fill, ink label, semibold. No glass anywhere.
 */
function DirectionA() {
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
            <Icon size={20} strokeWidth={1.9} className={on ? "text-s-ink" : "text-s-ink-2"} />
            <span className={`whitespace-nowrap text-[15px] font-semibold text-s-ink transition-all duration-300 ${on ? "max-w-[140px] opacity-100" : "max-w-0 opacity-0"}`}>
              {c.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* --------------------------------------------------------------- B: glass on the circle only */

/**
 * B. The glare he asked for, kept ON THE CIRCLE. Each resting circle is a tinted glass chip: the
 * category's own colour at low strength, a bright top edge, a soft inner shadow underneath. Tap it
 * and the glass stretches into a pill and the label appears inside it. The glyph stays flat.
 */
function DirectionB() {
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
            className={`relative flex h-12 shrink-0 items-center gap-2 overflow-hidden rounded-full transition-all duration-300 ease-glide ${c.bg} ${on ? "px-4" : "w-12 justify-center"}`}
            style={{
              boxShadow: on
                ? "inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -6px 12px rgba(0,0,0,0.06), 0 2px 6px rgba(10,10,10,0.06)"
                : "inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -6px 12px rgba(0,0,0,0.06)",
            }}
          >
            {/* the glare: a soft highlight across the top third, nothing more */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-full"
              style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.55), rgba(255,255,255,0))" }}
            />
            <Icon size={20} strokeWidth={1.9} className={`relative ${c.fg}`} />
            <span className={`relative whitespace-nowrap text-[15px] font-semibold text-s-ink transition-all duration-300 ${on ? "max-w-[140px] opacity-100" : "max-w-0 opacity-0"}`}>
              {c.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------- C: glass only on the one that is chosen */

/**
 * C. The opposite bet. At rest every circle is plain white with a hairline and a flat grey glyph,
 * so the row is quiet. The ONE you choose becomes the glass pill: its colour, its glare, its
 * shadow. The glass is then a signal rather than a texture, which is the argument for it.
 */
function DirectionC() {
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
            className={`relative flex h-12 shrink-0 items-center gap-2 overflow-hidden rounded-full transition-all duration-300 ease-glide ${
              on ? `${c.bg} px-4` : "w-12 justify-center border border-s-border bg-white"
            }`}
            style={
              on
                ? {
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -8px 14px rgba(0,0,0,0.07), 0 4px 12px rgba(10,10,10,0.10)",
                  }
                : undefined
            }
          >
            {on ? (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-full"
                style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.6), rgba(255,255,255,0))" }}
              />
            ) : null}
            <Icon size={20} strokeWidth={1.9} className={`relative ${on ? c.fg : "text-s-ink-2"}`} />
            <span className={`relative whitespace-nowrap text-[15px] font-semibold text-s-ink transition-all duration-300 ${on ? "max-w-[140px] opacity-100" : "max-w-0 opacity-0"}`}>
              {c.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------------------------- the screen */

const DIRECTIONS = [
  { key: "A", title: "Our pill, morphing", Comp: DirectionA },
  { key: "B", title: "Glass on every circle", Comp: DirectionB },
  { key: "C", title: "Glass only on the chosen one", Comp: DirectionC },
];

export default function Variants() {
  return (
    <div className="space-y-8">
      {DIRECTIONS.map(({ key, title, Comp }) => (
        <section key={key}>
          <p className="mb-3 text-[13px] font-semibold text-s-ink-2">
            {key}. {title}
          </p>
          <Comp />
        </section>
      ))}
    </div>
  );
}
