"use client";

// Mockup-scope: whole-page
// Exists-check: `npm run exists "pill selected black ceramic"` -> 0 matches (2026-08-15). Also
// checked "selected state", "TabPill", "category pills": the only existing artefacts are the real
// TabPill primitive (imported below, not redrawn) and the booking step's own inline category pill,
// whose exact class string is reproduced here as the baseline. REMOVED.md carries no entry for a
// selected-pill treatment. The one genuinely NEW thing on this page is the ceramic surface
// treatment itself, which is what he asked to see.
//
// WHY THIS PAGE EXISTS, owner 2026-08-15, verbatim:
//   "can you make me a mock up? You know? We use, like, in the choose services and then when you
//    open all, then there's this, like, black. Right? But I don't really like that. What if we
//    make, like, black feel, like, ceramic Black surround... like, black field, but, like,
//    surrounding the bottom is a black gray. because right now, we have, like, field gray and
//    field black, and, like, it's, like, inconsistent. And I wanna use black, but just black looks
//    kinda weird. That's why. I'm asking you."
//
// THE INCONSISTENCY HE NAMED IS REAL, and measured before proposing anything. Two selected-pill
// treatments ship side by side in the same funnel:
//   salon page filter pills  -> TabPill, selected = #F4F4F5 gray fill + ink text   ("field gray")
//   booking category pills   -> inline, selected = #0A0A0A ink fill + white text   ("field black")
// The design contract's own selected/active row locks the FIRST one and lists the booking pills as
// a named exception he granted on 2026-07-19. So this is not drift, it is two decisions that never
// met. He is now saying the pure black half looks wrong on its own.
//
// English chrome throughout (mockup law). The pill labels are real service categories.

import * as React from "react";
import { notFound } from "next/navigation";
import { TabPill } from "@/app/[locale]/_components/primitives/TabPill";
import { cn } from "@/lib/utils";

const CATS = ["Beard", "Extras", "Combo", "Haircut"];

/** The booking step's real class string, reproduced byte-for-byte as the baseline to compare against. */
const SHIPPED_SELECTED =
  "h-11 shrink-0 whitespace-nowrap rounded-full px-3 text-[13px] font-semibold capitalize transition-colors bg-s-ink text-white";
const SHIPPED_IDLE =
  "h-11 shrink-0 whitespace-nowrap rounded-full px-3 text-[13px] font-semibold capitalize transition-colors border border-s-border bg-white text-s-ink-2";

// drift-ok: these four darks are the SUBJECT of the mockup, not drift in it. He asked what a black
// that is not flat pure black could look like, and there is no token for one, because the system
// has exactly one ink (#0A0A0A) by design. They exist only on this /dev page and nothing imports
// them; if he picks one, it becomes a token in tailwind.config.js first and the literal dies here.
// Each is a measured step off the shipped ink rather than a colour picked by feel:
//   CERAMIC_TOP   #262626  the same hue, lightened until an edge is just visible on a 44px pill
//   CERAMIC_BASE  #000000  true black, so the bottom reads as shadowed rather than tinted
//   SURROUND      #3F3F46  the existing s-ink-3 grey family, one step lighter than the field
//   SOFT_BLACK    #1C1C1F  ink lifted just off pure, still darker than any grey token we own
const CERAMIC_GRADIENT = "linear-gradient(180deg, #262626 0%, #0A0A0A 62%, #000000 100%)"; // drift-ok: mockup subject, see note above
const SURROUND_SHADOW = "0 2px 0 0 #3F3F46, 0 6px 14px -6px rgba(10,10,10,0.55)"; // drift-ok: mockup subject, see note above
const SOFT_BLACK = "#1C1C1F"; // drift-ok: mockup subject, see note above

type Direction = {
  id: string;
  name: string;
  what: string;
  cost: string;
  selected: string;
  style?: React.CSSProperties;
};

const DIRECTIONS: Direction[] = [
  {
    id: "A",
    name: "A. What ships today",
    what: "Flat ink fill, white text. Nothing else. This is the one you are reacting to.",
    cost: "At 44px tall a flat pure black reads as a hole punched in the page rather than a raised control, because nothing separates its top from its bottom.",
    selected: SHIPPED_SELECTED,
  },
  {
    id: "B",
    name: "B. Ceramic, lit from above",
    what: "Still black. A very slight lightening at the top and a darker base at the bottom, plus a one pixel darker rim. That is what makes a ceramic tile read as an object.",
    cost: "It is the most literal reading of what you described, and it is also the fussiest: on a small pill the gradient is nearly invisible, so it may buy nothing at this size.",
    selected: cn(SHIPPED_SELECTED, "shadow-[inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-1px_0_rgba(0,0,0,0.6)]"),
    style: { backgroundImage: CERAMIC_GRADIENT },
  },
  {
    id: "C",
    name: "C. Black field, black-grey surround",
    what: "The black field stays exactly as it is and gains a dark grey base underneath it, so the pill sits ON the page instead of being cut out of it. Closest to the words you used.",
    cost: "It is a shadow, and this system spent months removing shadows from calm controls. It will look heavier the moment several sit in a row.",
    selected: SHIPPED_SELECTED,
    style: { boxShadow: SURROUND_SHADOW },
  },
  {
    id: "D",
    name: "D. Soft black, one step off pure",
    what: "No gradient and no shadow. The fill simply stops being pure black and becomes a very dark charcoal, so it stays unmistakably black while losing the flat cut-out feel.",
    cost: "It changes the least, so if what bothers you is the SHAPE rather than the darkness, this will not fix anything.",
    selected: SHIPPED_SELECTED,
    style: { backgroundColor: SOFT_BLACK },
  },
];

export default function PillCeramicPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const [active, setActive] = React.useState<Record<string, string>>(
    Object.fromEntries(DIRECTIONS.map((d) => [d.id, CATS[0]])),
  );
  const [tabPillActive, setTabPillActive] = React.useState(CATS[0]);

  return (
    <main className="min-h-screen bg-white px-5 py-10">
      <div className="mx-auto max-w-[430px]">
        <h1 className="font-display text-[22px] font-bold text-s-ink">Selected pill, four treatments</h1>
        <p className="mt-2 font-body text-[14px] leading-relaxed text-s-ink-2">
          Tap the pills. Every direction uses the booking step&rsquo;s real class string, changed only
          where the direction says so.
        </p>
      </div>

      {/* The inconsistency he named, shown rather than described. */}
      <section className="mx-auto mt-9 max-w-[430px] rounded-[24px] border border-s-border bg-s-bg-sunken p-5">
        <h2 className="font-display text-[16px] font-semibold text-s-ink">The two we ship right now</h2>
        <p className="mt-1.5 font-body text-[13px] leading-relaxed text-s-ink-2">
          Same funnel, one tap apart. This is the &ldquo;field gray and field black&rdquo; you meant.
        </p>
        <p className="mt-4 font-body text-[12px] font-medium text-s-ink-2">Salon page filters, grey fill</p>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATS.map((c) => (
            <TabPill key={c} active={tabPillActive === c} onClick={() => setTabPillActive(c)} size="sm">
              {c}
            </TabPill>
          ))}
        </div>
        <p className="mt-5 font-body text-[12px] font-medium text-s-ink-2">Booking step, black fill</p>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setActive((s) => ({ ...s, A: c }))}
              className={active.A === c ? SHIPPED_SELECTED : SHIPPED_IDLE}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      <div className="mx-auto mt-10 flex max-w-[430px] flex-col gap-9">
        {DIRECTIONS.map((d) => (
          <section key={d.id}>
            <h2 className="font-display text-[16px] font-semibold text-s-ink">{d.name}</h2>
            <p className="mt-1.5 font-body text-[13px] leading-relaxed text-s-ink-2">{d.what}</p>
            <p className="mt-1.5 font-body text-[13px] leading-relaxed text-s-ink-2">
              <span className="font-semibold text-s-ink">The cost: </span>
              {d.cost}
            </p>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {CATS.map((c) => {
                const on = active[d.id] === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setActive((s) => ({ ...s, [d.id]: c }))}
                    className={on ? d.selected : SHIPPED_IDLE}
                    style={on ? d.style : undefined}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="mx-auto mt-10 max-w-[430px] rounded-[24px] border border-s-border bg-white p-5">
        <h2 className="font-display text-[16px] font-semibold text-s-ink">My pick, and why</h2>
        <p className="mt-2 font-body text-[13px] leading-relaxed text-s-ink-2">
          D, the soft black. It is the only one of the four that survives being repeated: a phone shows
          four of these pills at once, and both the gradient in B and the base in C multiply into
          visual noise the moment they sit in a row, which is exactly the failure this system spent
          months undoing when it removed shadows from calm controls. D keeps the pill unmistakably
          black, kills the cut-out feel, and adds nothing that repeats badly.
        </p>
        <p className="mt-3 font-body text-[13px] leading-relaxed text-s-ink-2">
          The part I cannot decide for you: none of this fixes the inconsistency you named. Grey-selected
          on the salon page and black-selected in booking stay two different answers to the same
          question. Picking one for both surfaces is the real decision, and it is yours, because the
          black booking pills were your own call on 19 July.
        </p>
      </div>
    </main>
  );
}
