"use client";

// exists-check: `npm run exists "search field chrome"` = 0. /dev/search-field already exists and is
// where he picked variant A this morning; this is the NEXT question on the same control, so it sits
// beside it rather than replacing it. Column A below reproduces what ships right now, out of
// SearchOverlay.tsx, rather than redrawing it.
//
// THE QUESTION, and it is the only one left open on the search panel:
//   this morning, off /dev/search-field, he picked a FILLED GREY CAPSULE with the way back OUTSIDE
//   it. Tonight he sent an Airbnb screenshot and said "want full type ciew bro like in airbnb
//   refference i gave u". That reference's field is a WHITE BOX with a thin dark outline and the
//   arrow INSIDE it. Both are his, eleven hours apart, and they disagree about this one control.
//
// THE REFERENCE, MEASURED off his own capture (IMG_7114) with PIL, not eyeballed. Screen 402x874pt:
//   field box      left 24.0pt, width 354pt, height 55.7pt
//   border         1px, near-black
//   corner radius  about 15pt, taken off the arc rather than guessed
//   back arrow     INSIDE the box, on the left
//   placeholder    plain grey text, no magnifier
// Ours today, measured live: 48px tall, fully round, filled #F4F4F5, chevron in a 32x40 box OUTSIDE
// the capsule.
//
// Copy is English by house rule, though the app ships German.

import * as React from "react";
import { ChevronLeft, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

const ROWS = [
  { name: "Balayage", sub: "Basel" },
  { name: "Women's haircut", sub: "Zurich" },
  { name: "Muse Beauty Studio", sub: null },
];

function List() {
  return (
    <div className="mt-4">
      {ROWS.map((r) => (
        <div key={r.name} className="flex items-center gap-3.5 py-2.5">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-s-bg-sunken text-s-ink-2">
            <Search size={20} strokeWidth={1.9} aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-semibold text-s-ink">{r.name}</span>
            {r.sub ? <span className="block truncate text-[13px] text-s-ink-2">{r.sub}</span> : null}
          </span>
        </div>
      ))}
    </div>
  );
}

/** A. Exactly what ships now: filled capsule, way back OUTSIDE it. His pick this morning. */
function Capsule({ value }: { value?: string }) {
  return (
    <div className="flex h-12 items-center gap-2">
      <span className="grid h-10 w-8 shrink-0 place-items-center text-s-ink">
        <ChevronLeft size={24} strokeWidth={2} aria-hidden />
      </span>
      <div className="flex h-12 min-w-0 flex-1 items-center gap-2.5 rounded-full bg-s-bg-sunken px-4">
        <Search size={19} strokeWidth={2} className="shrink-0 text-s-ink-2" aria-hidden />
        <span className={cn("min-w-0 flex-1 truncate text-[16px]", value ? "text-s-ink" : "text-s-ink-2")}>
          {value || "Service, salon or stylist"}
        </span>
        {value ? (
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-s-ink/15 text-s-ink">
            <X size={13} strokeWidth={2.6} aria-hidden />
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** B. The reference, matched to the measured numbers: white box, thin dark outline, arrow inside. */
function Outlined({ value }: { value?: string }) {
  return (
    <div className="flex h-14 items-center">
      <div className="flex h-14 w-full min-w-0 items-center gap-3 rounded-[15px] border border-s-ink bg-white px-3.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center text-s-ink">
          <ChevronLeft size={22} strokeWidth={2} aria-hidden />
        </span>
        <span className={cn("min-w-0 flex-1 truncate text-[16px]", value ? "text-s-ink" : "text-s-ink-2")}>
          {value || "Service, salon or stylist"}
        </span>
        {value ? (
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-s-ink/15 text-s-ink">
            <X size={13} strokeWidth={2.6} aria-hidden />
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** C. The middle: his capsule, but the way back moves inside it, which is the reference's habit. */
function CapsuleArrowInside({ value }: { value?: string }) {
  return (
    <div className="flex h-12 items-center">
      <div className="flex h-12 w-full min-w-0 items-center gap-2.5 rounded-full bg-s-bg-sunken px-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center text-s-ink">
          <ChevronLeft size={22} strokeWidth={2} aria-hidden />
        </span>
        <span className={cn("min-w-0 flex-1 truncate text-[16px]", value ? "text-s-ink" : "text-s-ink-2")}>
          {value || "Service, salon or stylist"}
        </span>
        {value ? (
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-s-ink/15 text-s-ink">
            <X size={13} strokeWidth={2.6} aria-hidden />
          </span>
        ) : null}
      </div>
    </div>
  );
}

function Phone({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="w-[390px] shrink-0">
      <p className="mb-2 text-[13px] text-s-ink-2">{label}</p>
      <div className="h-[300px] overflow-hidden rounded-[20px] border border-s-border bg-white px-4 pt-4">
        {children}
      </div>
    </div>
  );
}

const COLUMNS = [
  {
    id: "A",
    title: "What ships now, and what you picked this morning",
    what: "A filled grey capsule. The way back sits outside it on the left, so the field itself holds only what you type.",
    cost: "It looks nothing like the field in the screenshot you sent tonight, and the arrow outside costs about 32px of typing room.",
    Field: Capsule,
  },
  {
    id: "B",
    title: "Your reference, matched to its measurements",
    what: "A white box with a thin dark outline and the arrow inside it. Measured off your own screenshot: 354 wide, 55.7 tall, 1px outline, corners about 15.",
    cost: "It undoes the pick you made this morning, and a dark outline on white is heavier than anything else on this screen.",
    Field: Outlined,
  },
  {
    id: "C",
    title: "Your capsule, the reference's arrow",
    what: "Keeps the grey capsule you chose and moves the way back inside it, which is the part of the reference that changes how the screen reads.",
    cost: "It matches neither exactly. The arrow inside a filled capsule is a shape neither of us has seen on a real app today.",
    Field: CapsuleArrowInside,
  },
];

export default function FieldChrome() {
  return (
    <div className="mt-10 space-y-14">
      {COLUMNS.map(({ id, title, what, cost, Field }) => (
        <section key={id}>
          <h2 className="font-display text-[20px] font-semibold tracking-[-0.01em] text-s-ink">
            {id}. {title}
          </h2>
          <p className="mt-1 max-w-[760px] text-[14px] leading-relaxed text-s-ink">{what}</p>
          <p className="mt-1 max-w-[760px] text-[14px] leading-relaxed text-s-ink-2">
            The cost: {cost}
          </p>
          <div className="mt-5 flex gap-6 overflow-x-auto pb-3">
            <Phone label="Nothing typed">
              <Field />
              <List />
            </Phone>
            <Phone label="Typing">
              <Field value="Balay" />
              <List />
            </Phone>
          </div>
        </section>
      ))}
    </div>
  );
}
