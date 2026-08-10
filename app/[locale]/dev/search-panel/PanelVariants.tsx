"use client";

// exists-check: `npm run exists "search panel"` = 0. Variant 0 reproduces the LIVE SearchOverlay's
// current collapsed-row and heading recipe rather than redrawing it, so the comparison is against
// the real thing. Copy is English by house rule, even though the app ships German.
//
// REFERENCE, read on Mobbin this turn rather than from memory (iOS, Airbnb's own search sheet):
//   - the page behind is blurred, the sheet floats over it
//   - a TYPE switcher across the top (Homes / Experiences / Services) with icons and an underline,
//     plus a circular X on the right
//   - each inactive step is its own WHITE CARD with a radius and a shadow, separated by real gaps,
//     showing a grey label on the left and the chosen value on the right
//   - the ACTIVE step is a taller white card with a large bold question as its heading
//   - the action bar sits on the BACKDROP under the sheet, not inside it: "Clear all" as an
//     underlined text link on the left, a wide pill with a magnifier and "Search" on the right

import * as React from "react";
import { CalendarDays, MapPin, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex h-14 items-center justify-between rounded-[20px] bg-white px-4 shadow-[0_16px_48px_rgba(10,10,10,0.10)]">
      <span className="font-body text-[14px] font-medium text-s-ink-2">{label}</span>
      <span className={cn("font-body text-[14px]", muted ? "text-s-ink-2" : "font-semibold text-s-ink")}>
        {value}
      </span>
    </div>
  );
}

function Phone({
  id,
  title,
  what,
  cost,
  children,
}: {
  id: string;
  title: string;
  what: string;
  cost: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <h2 className="font-display text-[18px] font-semibold text-s-ink">
        {id}. {title}
      </h2>
      <p className="mt-1 max-w-[520px] font-body text-[14px] text-s-ink-2">{what}</p>
      <p className="mt-1 max-w-[520px] font-body text-[14px] text-s-ink-2">
        <span className="font-semibold text-s-ink">The cost:</span> {cost}
      </p>
      <div className="relative mt-4 h-[600px] w-[390px] overflow-hidden rounded-[20px] border border-s-border bg-s-bg-sunken">
        {children}
      </div>
    </section>
  );
}

const PRIMARY =
  "inline-flex h-12 items-center gap-2 rounded-full bg-s-ink px-6 font-body text-[15px] font-semibold text-white";
const CARD = "rounded-[20px] bg-white shadow-[0_16px_48px_rgba(10,10,10,0.10)]";
const FIELD = "flex h-12 items-center gap-2 rounded-[14px] border border-s-border px-3.5";

export default function PanelVariants() {
  return (
    <div className="mt-10">
      <Phone
        id="0"
        title="What the panel looks like now"
        what="Three stacked cards, the open one carrying a 24px bold question, and a footer inside the sheet with Reset on the left and a black Search pill on the right."
        cost="This is the one he asked to improve."
      >
        <div className="flex h-full flex-col gap-3 p-3 pt-6">
          <div className={cn(CARD, "p-4")}>
            <p className="font-heading text-[24px] font-bold leading-tight tracking-[-0.02em] text-s-ink">
              What are you looking for?
            </p>
            <div className={cn(FIELD, "mt-3")}>
              <Search size={18} strokeWidth={2} className="text-s-ink-2" aria-hidden />
              <span className="font-body text-[16px] text-s-ink-2">Service, salon or stylist</span>
            </div>
          </div>
          <Row label="Where?" value="No preference" muted />
          <Row label="When?" value="Anytime" muted />
          <div className="mt-auto flex items-center justify-between px-1 pb-2">
            <span className="font-body text-[14px] text-s-ink">Reset</span>
            <span className={PRIMARY}>
              <Search size={16} strokeWidth={2.4} aria-hidden /> Search
            </span>
          </div>
        </div>
      </Phone>

      <Phone
        id="A"
        title="Their anatomy, ours everywhere else (my pick)"
        what="A circular close top right, the action bar moved OUT of the sheet onto the backdrop, Reset as an underlined link, and a leading icon on each closed row so the three read as different questions instead of three identical grey bars."
        cost="With the action bar on the backdrop the sheet can never scroll under it, so on a small phone the open card gets slightly less room than today."
      >
        <div className="flex h-full flex-col">
          <div className="flex justify-end p-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-elevation-2">
              <X size={18} strokeWidth={2.2} className="text-s-ink" aria-hidden />
            </span>
          </div>
          <div className="flex flex-col gap-3 px-3">
            <div className={cn(CARD, "p-4")}>
              <p className="font-heading text-[26px] font-bold leading-tight tracking-[-0.02em] text-s-ink">
                What are you looking for?
              </p>
              <div className={cn(FIELD, "mt-3")}>
                <Search size={18} strokeWidth={2} className="text-s-ink-2" aria-hidden />
                <span className="font-body text-[16px] text-s-ink-2">Service, salon or stylist</span>
              </div>
            </div>
            <div className={cn(CARD, "flex h-14 items-center gap-3 px-4")}>
              <MapPin size={18} strokeWidth={2} className="shrink-0 text-s-ink-2" aria-hidden />
              <span className="font-body text-[14px] font-medium text-s-ink-2">Where?</span>
              <span className="ml-auto font-body text-[14px] text-s-ink-2">No preference</span>
            </div>
            <div className={cn(CARD, "flex h-14 items-center gap-3 px-4")}>
              <CalendarDays size={18} strokeWidth={2} className="shrink-0 text-s-ink-2" aria-hidden />
              <span className="font-body text-[14px] font-medium text-s-ink-2">When?</span>
              <span className="ml-auto font-body text-[14px] text-s-ink-2">Anytime</span>
            </div>
          </div>
          <div className="mt-auto flex items-center justify-between border-t border-s-border bg-white/70 px-4 py-3 backdrop-blur">
            <span className="font-body text-[14px] text-s-ink underline underline-offset-4">Reset</span>
            <span className={PRIMARY}>
              <Search size={16} strokeWidth={2.4} aria-hidden /> Search
            </span>
          </div>
        </div>
      </Phone>

      <Phone
        id="B"
        title="One card, three rows"
        what="The three questions live in a single card divided by hairlines instead of three floating cards. The open question grows inside it."
        cost="Loses the sense that each step is its own object, which is what makes the current one feel like a real stack. Quieter, but flatter."
      >
        <div className="flex h-full flex-col p-3 pt-6">
          <div className={cn(CARD, "overflow-hidden")}>
            <div className="p-4">
              <p className="font-heading text-[26px] font-bold leading-tight tracking-[-0.02em] text-s-ink">
                What are you looking for?
              </p>
              <div className={cn(FIELD, "mt-3")}>
                <Search size={18} strokeWidth={2} className="text-s-ink-2" aria-hidden />
                <span className="font-body text-[16px] text-s-ink-2">Service, salon or stylist</span>
              </div>
            </div>
            <div className="flex h-14 items-center justify-between border-t border-s-border px-4">
              <span className="font-body text-[14px] font-medium text-s-ink-2">Where?</span>
              <span className="font-body text-[14px] text-s-ink-2">No preference</span>
            </div>
            <div className="flex h-14 items-center justify-between border-t border-s-border px-4">
              <span className="font-body text-[14px] font-medium text-s-ink-2">When?</span>
              <span className="font-body text-[14px] text-s-ink-2">Anytime</span>
            </div>
          </div>
          <div className="mt-auto flex items-center justify-between px-1 pb-2">
            <span className="font-body text-[14px] text-s-ink underline underline-offset-4">Reset</span>
            <span className={PRIMARY}>
              <Search size={16} strokeWidth={2.4} aria-hidden /> Search
            </span>
          </div>
        </div>
      </Phone>

      <Phone
        id="C"
        title="Full sheet, no floating cards"
        what="The sheet fills the screen. The open question is a plain heading on the sheet itself, and the two unanswered ones are quiet rows pinned at the bottom."
        cost="Furthest from Airbnb of the three, and it gives up the layered look that was approved when this panel was built."
      >
        <div className="flex h-full flex-col bg-white">
          <div className="flex items-center justify-between px-4 pt-4">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-s-bg-sunken">
              <X size={18} strokeWidth={2.2} className="text-s-ink" aria-hidden />
            </span>
          </div>
          <div className="px-4 pt-6">
            <p className="font-heading text-[30px] font-bold leading-tight tracking-[-0.02em] text-s-ink">
              What are you looking for?
            </p>
            <div className="mt-4 flex h-12 items-center gap-2 rounded-[14px] bg-s-bg-sunken px-3.5">
              <Search size={18} strokeWidth={2} className="text-s-ink-2" aria-hidden />
              <span className="font-body text-[16px] text-s-ink-2">Service, salon or stylist</span>
            </div>
          </div>
          <div className="mt-auto">
            <div className="flex h-14 items-center justify-between border-t border-s-border px-4">
              <span className="font-body text-[14px] font-medium text-s-ink-2">Where?</span>
              <span className="font-body text-[14px] text-s-ink-2">No preference</span>
            </div>
            <div className="flex h-14 items-center justify-between border-t border-s-border px-4">
              <span className="font-body text-[14px] font-medium text-s-ink-2">When?</span>
              <span className="font-body text-[14px] text-s-ink-2">Anytime</span>
            </div>
            <div className="flex items-center justify-between border-t border-s-border px-4 py-3">
              <span className="font-body text-[14px] text-s-ink underline underline-offset-4">Reset</span>
              <span className={PRIMARY}>
                <Search size={16} strokeWidth={2.4} aria-hidden /> Search
              </span>
            </div>
          </div>
        </div>
      </Phone>
    </div>
  );
}
