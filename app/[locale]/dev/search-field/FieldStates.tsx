"use client";

// exists-check: `npm run exists "search field states"` = 0. Row 0 of every column reproduces the
// LIVE field's own recipe out of SearchOverlay.tsx rather than redrawing it. Copy is English by
// house rule even though the app ships German.
//
// REFERENCE, read on Mobbin this turn (iOS), six apps, and they agree with each other:
//   Character AI  filled grey capsule, back chevron OUTSIDE on the left, clear X inside on the
//                 right, suggestions each with a small magnifier
//   Twitch        same, and the matched part of each suggestion is bold while the typed part is not
//   KakaoTalk     same again, chevron outside, filled capsule, clear X inside
//   Bloom         filled grey capsule with "Cancel" as a TEXT link to the right of it
//   Corner        dark filled capsule, magnifier inside on the left, X outside on the right
//   Opera         filled capsule, no chevron, suggestions in a card below
// The through-line: once a search field is focused it becomes a FILLED capsule, the way out sits
// OUTSIDE the field, and the clear sits inside it.
//
// Ours today: a white box with a hairline, and the way out (a back arrow) INSIDE the field, sharing
// the row with the text.

import * as React from "react";
import { ArrowLeft, ChevronLeft, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

const SUGGESTIONS = ["Haarsalon Margot", "Haarwerk Atelier", "Haarschnitt"];

function Rows({ typed }: { typed?: string }) {
  return (
    <div className="mt-3 space-y-3 px-1">
      {(typed ? SUGGESTIONS : ["Muse Beauty Studio", "Glow Lab Basel", "Salon Lumiere"]).map((n) => (
        <div key={n} className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-s-bg-sunken text-s-ink-2">
            <Search size={15} strokeWidth={2} aria-hidden />
          </span>
          <span className="font-body text-[15px] text-s-ink">
            {typed ? (
              <>
                <span className="text-s-ink-2">{typed}</span>
                {n.slice(typed.length)}
              </>
            ) : (
              n
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

function State({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <p className="mb-2 font-body text-[13px] text-s-ink-2">{label}</p>
      <div className="w-[350px] rounded-[16px] border border-s-border bg-white p-3">{children}</div>
    </div>
  );
}

/** 0. Exactly what ships today. */
function Current() {
  const field = "flex h-12 items-center gap-2 rounded-[14px] border border-s-border bg-white px-3.5";
  return (
    <>
      <State label="closed">
        <div className={field}>
          <Search size={19} strokeWidth={2} className="shrink-0 text-s-ink-2" aria-hidden />
          <span className="min-w-0 flex-1 truncate font-body text-[16px] text-s-ink-2">
            Service, salon or stylist
          </span>
        </div>
      </State>
      <State label="focused, empty">
        <div className={field}>
          <ArrowLeft size={20} strokeWidth={2} className="shrink-0 text-s-ink" aria-hidden />
          <span className="min-w-0 flex-1 truncate font-body text-[16px] text-s-ink-2">
            Service, salon or stylist
          </span>
        </div>
        <Rows />
      </State>
      <State label="typing">
        <div className={field}>
          <ArrowLeft size={20} strokeWidth={2} className="shrink-0 text-s-ink" aria-hidden />
          <span className="min-w-0 flex-1 font-body text-[16px] text-s-ink">Haar</span>
          <X size={18} strokeWidth={2.2} className="shrink-0 text-s-ink-2" aria-hidden />
        </div>
        <Rows typed="Haar" />
      </State>
    </>
  );
}

/** A. The Mobbin through-line: filled capsule, way out OUTSIDE, clear inside. */
function Filled() {
  const capsule = "flex h-12 min-w-0 flex-1 items-center gap-2 rounded-full bg-s-bg-sunken px-4";
  return (
    <>
      <State label="closed">
        <div className={cn(capsule, "flex-none")}>
          <Search size={18} strokeWidth={2} className="shrink-0 text-s-ink-2" aria-hidden />
          <span className="min-w-0 flex-1 truncate font-body text-[16px] text-s-ink-2">
            Service, salon or stylist
          </span>
        </div>
      </State>
      <State label="focused, empty">
        <div className="flex items-center gap-2">
          <span className="grid h-10 w-8 shrink-0 place-items-center text-s-ink">
            <ChevronLeft size={24} strokeWidth={2} aria-hidden />
          </span>
          <div className={capsule}>
            <Search size={18} strokeWidth={2} className="shrink-0 text-s-ink-2" aria-hidden />
            <span className="min-w-0 flex-1 truncate font-body text-[16px] text-s-ink-2">
              Service, salon or stylist
            </span>
          </div>
        </div>
        <Rows />
      </State>
      <State label="typing">
        <div className="flex items-center gap-2">
          <span className="grid h-10 w-8 shrink-0 place-items-center text-s-ink">
            <ChevronLeft size={24} strokeWidth={2} aria-hidden />
          </span>
          <div className={capsule}>
            <Search size={18} strokeWidth={2} className="shrink-0 text-s-ink-2" aria-hidden />
            <span className="min-w-0 flex-1 font-body text-[16px] text-s-ink">Haar</span>
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-s-ink/15 text-s-ink">
              <X size={13} strokeWidth={2.6} aria-hidden />
            </span>
          </div>
        </div>
        <Rows typed="Haar" />
      </State>
    </>
  );
}

/** B. Filled capsule, but the way out is a word instead of a glyph (Bloom). */
function WithCancel() {
  const capsule = "flex h-12 min-w-0 flex-1 items-center gap-2 rounded-full bg-s-bg-sunken px-4";
  return (
    <>
      <State label="closed">
        <div className={cn(capsule, "flex-none")}>
          <Search size={18} strokeWidth={2} className="shrink-0 text-s-ink-2" aria-hidden />
          <span className="min-w-0 flex-1 truncate font-body text-[16px] text-s-ink-2">
            Service, salon or stylist
          </span>
        </div>
      </State>
      <State label="focused, empty">
        <div className="flex items-center gap-3">
          <div className={capsule}>
            <Search size={18} strokeWidth={2} className="shrink-0 text-s-ink-2" aria-hidden />
            <span className="min-w-0 flex-1 truncate font-body text-[16px] text-s-ink-2">
              Service, salon or stylist
            </span>
          </div>
          <span className="shrink-0 font-body text-[15px] text-s-ink">Cancel</span>
        </div>
        <Rows />
      </State>
      <State label="typing">
        <div className="flex items-center gap-3">
          <div className={capsule}>
            <Search size={18} strokeWidth={2} className="shrink-0 text-s-ink-2" aria-hidden />
            <span className="min-w-0 flex-1 font-body text-[16px] text-s-ink">Haar</span>
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-s-ink/15 text-s-ink">
              <X size={13} strokeWidth={2.6} aria-hidden />
            </span>
          </div>
          <span className="shrink-0 font-body text-[15px] text-s-ink">Cancel</span>
        </div>
        <Rows typed="Haar" />
      </State>
    </>
  );
}

const COLUMNS = [
  {
    id: "0",
    title: "What ships today",
    what: "A white box with a hairline. The way out is an arrow INSIDE the field, sharing the row with the text.",
    cost: "The field looks the same empty as full, and the arrow inside competes with the text for the same line.",
    Body: Current,
  },
  {
    id: "A",
    title: "Filled capsule, chevron outside (my pick)",
    what: "Focused, the field becomes a filled grey capsule and the way back moves outside it on the left. The clear sits inside on a soft disc. Matches Character AI, Twitch and KakaoTalk.",
    cost: "The chevron eats about 32px of the row, so a long typed query has less room than it does today.",
    Body: Filled,
  },
  {
    id: "B",
    title: "Filled capsule, Cancel as a word",
    what: "Same capsule, but the way out is the word Cancel to the right, which is what Bloom does and what iOS itself does.",
    cost: "A word costs more width than a glyph, and it has to be translated into four languages where the German is longest.",
    Body: WithCancel,
  },
];

export default function FieldStates() {
  return (
    <div className="mt-10 flex flex-wrap gap-10">
      {COLUMNS.map(({ id, title, what, cost, Body }) => (
        <section key={id} className="w-[380px]">
          <h2 className="font-display text-[18px] font-semibold text-s-ink">
            {id}. {title}
          </h2>
          <p className="mt-1 font-body text-[14px] text-s-ink-2">{what}</p>
          <p className="mb-5 mt-1 font-body text-[14px] text-s-ink-2">
            <span className="font-semibold text-s-ink">The cost:</span> {cost}
          </p>
          <Body />
        </section>
      ))}
    </div>
  );
}
