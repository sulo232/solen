"use client";

// exists-check: `npm run exists "search bar variations"` = 0. This does not redraw the search bar:
// variant A is the LIVE component's exact current class string, lifted out of
// app/[locale]/_components/homepage/HomeSearchPill.tsx, so the comparison is against the real
// thing. The other three change only the treatment named in each caption.

import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * MEASURED, NOT GUESSED. airbnb.ch, live, mobile viewport 390 wide, read with getComputedStyle on
 * their real search button (`aria-label="Jetzt suchen"`), 2026-08-10:
 *
 *   box        340 x 54, top 13
 *   radius     40px
 *   border     1px rgb(0,0,0)        <- a HARD BLACK ring, not a hairline
 *   shadow     0 6px 20px rgba(0,0,0,0.10)
 *   padding    19px each side
 *   layout     justify-content: center, text-align: center   <- the content is CENTRED
 *   label      14px, weight 500, black
 *   icon       12 x 12, 8px gap to the text
 *
 * Ours, measured the same way on /de at the same width: 358 x 46, top 4, hairline #E4E4E7,
 * 0 2px 8px 7%, padding 14, LEFT aligned, label 16px/500, icon 18 with a 12px gap.
 *
 * The three differences that carry the look are the black ring, the centring, and the small icon.
 * Height is a distant fourth.
 */
const AIRBNB = {
  h: 54,
  radius: 40,
  border: "1px solid #000000",
  shadow: "0 6px 20px rgba(0,0,0,0.10)",
  padX: 19,
  label: 14,
  icon: 12,
  gap: 8,
};

function Frame({
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
    <section className="mb-10">
      <h2 className="font-display text-[18px] font-semibold text-s-ink">
        {id}. {title}
      </h2>
      <p className="mt-1 max-w-[520px] font-body text-[14px] text-s-ink-2">{what}</p>
      <p className="mt-1 max-w-[520px] font-body text-[14px] text-s-ink-2">
        <span className="font-semibold text-s-ink">The cost:</span> {cost}
      </p>
      <div className="mt-4 w-[390px] rounded-[20px] border border-s-border bg-white py-3">
        {children}
        <div className="mt-3 flex gap-2 px-4">
          <span className="inline-flex h-10 items-center gap-1 rounded-[40px] bg-s-bg-sunken px-3.5 font-body text-[14px] text-s-ink">
            All
          </span>
          <span className="inline-flex h-10 items-center gap-1 rounded-[40px] bg-white px-3.5 font-body text-[14px] text-s-ink shadow-whisper">
            Coiffeur
          </span>
          <span className="inline-flex h-10 items-center gap-1 rounded-[40px] bg-white px-3.5 font-body text-[14px] text-s-ink shadow-whisper">
            Barber
          </span>
        </div>
      </div>
    </section>
  );
}

export default function SearchBarVariants() {
  return (
    <div className="mt-10">
      <Frame
        id="A"
        title="What ships right now (his branch)"
        what="Left aligned, a light hairline, a soft close shadow, 46 tall, 16px label, 18px icon. This is the live component's exact class string, not a redraw."
        cost="Next to theirs it reads flatter and thinner, and the eye has nothing to land on because the label starts at the far left."
      >
        <div className="px-4">
          <div className="flex w-full items-center gap-3 rounded-pill border border-s-border bg-white px-3.5 py-2.5 shadow-[0_2px_8px_0_rgba(0,0,0,0.07)]">
            <Search size={18} strokeWidth={2} className="shrink-0 text-s-ink-2" aria-hidden />
            <span className="block min-w-0 flex-1 truncate font-body text-[16px] font-medium text-s-ink">
              Suchen
            </span>
          </div>
        </div>
      </Frame>

      <Frame
        id="B"
        title="Their measurement, exactly (my pick)"
        what="Every value read off airbnb.ch live: 54 tall, 40px radius, a 1px BLACK ring, 0 6px 20px at 10%, 19px padding, content centred, 14px/500 label, 12px icon with an 8px gap."
        cost="The black ring is stronger than anything else on our home page, so the bar becomes the loudest object on the screen. That is exactly what Airbnb wants and it may be more than you want."
      >
        <div className="px-4">
          <div
            className="flex w-full items-center justify-center bg-white"
            style={{
              height: AIRBNB.h,
              borderRadius: AIRBNB.radius,
              border: AIRBNB.border,
              boxShadow: AIRBNB.shadow,
              paddingLeft: AIRBNB.padX,
              paddingRight: AIRBNB.padX,
              gap: AIRBNB.gap,
            }}
          >
            <Search size={AIRBNB.icon} strokeWidth={2.4} className="shrink-0 text-s-ink" aria-hidden />
            <span className="font-body text-[14px] font-medium text-s-ink">Suchen</span>
          </div>
        </div>
      </Frame>

      <Frame
        id="C"
        title="Their shape, our ink"
        what="Same 54 height, same 40px radius, same centring and same small icon. The hard black ring is replaced by our own hairline plus a real lift."
        cost="Softer than theirs. On a white page the bar stops shouting, which may read as us not committing to the pattern."
      >
        <div className="px-4">
          <div
            className="flex w-full items-center justify-center gap-2 rounded-[40px] border border-s-border bg-white shadow-elevation-3"
            style={{ height: AIRBNB.h, paddingLeft: AIRBNB.padX, paddingRight: AIRBNB.padX }}
          >
            <Search size={AIRBNB.icon} strokeWidth={2.4} className="shrink-0 text-s-ink" aria-hidden />
            <span className="font-body text-[14px] font-medium text-s-ink">Suchen</span>
          </div>
        </div>
      </Frame>

      <Frame
        id="D"
        title="Their weight, our left alignment"
        what="The black ring, the height and the lift, but the label stays on the left where a typed query reads naturally."
        cost="Centring is half of why theirs looks deliberate. Keeping the left edge keeps a real advantage for a filled-in search and gives up that look."
      >
        <div className="px-4">
          <div
            className="flex w-full items-center bg-white"
            style={{
              height: AIRBNB.h,
              borderRadius: AIRBNB.radius,
              border: AIRBNB.border,
              boxShadow: AIRBNB.shadow,
              paddingLeft: AIRBNB.padX,
              paddingRight: AIRBNB.padX,
              gap: 12,
            }}
          >
            <Search size={AIRBNB.icon + 2} strokeWidth={2.2} className="shrink-0 text-s-ink" aria-hidden />
            <span className="font-body text-[14px] font-medium text-s-ink">Suchen</span>
          </div>
        </div>
      </Frame>
    </div>
  );
}
