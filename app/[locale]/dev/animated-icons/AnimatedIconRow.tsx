"use client";

// exists-check: net-new vs _plans/AIRBNB_ANIMATED_ICONS.md and
// _plans/AIRBNB_ANIMATED_ICONS_R2.md, both read before writing this. Those are the WORKSTREAM
// files: R2 is 99KB of 43 rounds of the owner's feedback on generating the clips, and the first
// one is the research capture. Neither is a render surface, and neither wires anything into the
// product. `npm run exists "animated icon"` and `npm run exists animated-icons` both return 0.
// This file is the first place in the app that actually plays them, which is the whole point:
// a grep for `solen-icons` across app/ and lib/ returns zero hits, so 43 rounds of finished work
// has never once reached a screen.
//
// TRIGGER, measured rather than assumed. `_design-system/references/airbnb--animated-icons.md`
// records what airbnb.com actually does: hover does NOTHING (no play, no currentTime write, no
// transform, held 1.4s per tab), and CLICKING a tab plays the matching short clip once from 0.
// So this plays on select, once, and holds. Nothing loops in the row: a row of permanently moving
// icons is a distraction and a battery cost, and it is not what the reference does.

import * as React from "react";
import Image from "next/image";
import { Home } from "lucide-react";
import { cn } from "@/lib/utils";

const PILLS = [
  { key: "all", label: "All", still: null, clip: null },
  {
    key: "coiffeur",
    label: "Hair",
    still: "/icons/categories/scissors.png",
    clip: "/_pixel-refs/solen-icons/out/set-dryer.webm",
  },
  {
    key: "barber",
    label: "Barber",
    still: "/icons/categories/clippers.png",
    clip: "/_pixel-refs/solen-icons/out/set-barber.webm",
  },
  { key: "nails", label: "Nails", still: "/icons/categories/nails.png", clip: null },
  { key: "spa", label: "Spa", still: "/icons/categories/spa.png", clip: null },
] as const;

export default function AnimatedIconRow() {
  const [active, setActive] = React.useState<string>("all");
  const refs = React.useRef<Record<string, HTMLVideoElement | null>>({});

  const select = (key: string) => {
    setActive(key);
    const v = refs.current[key];
    if (v) {
      v.currentTime = 0;
      void v.play();
    }
  };

  return (
    <>
      <div className="mt-8 w-[375px] overflow-hidden rounded-[20px] border border-s-border bg-white py-4">
        <div className="flex items-center gap-2 overflow-x-auto px-4">
          {PILLS.map((p) => {
            const on = active === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => select(p.key)}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center gap-1 rounded-[40px] px-2.5",
                  "font-body text-[14px] font-normal leading-none text-s-ink",
                  on ? "bg-s-bg-sunken" : "bg-white shadow-whisper",
                )}
              >
                <span className="grid h-[26px] w-[26px] shrink-0 place-items-center">
                  {p.clip ? (
                    <video
                      ref={(el) => {
                        refs.current[p.key] = el;
                      }}
                      src={p.clip}
                      muted
                      playsInline
                      preload="auto"
                      className="h-[26px] w-[26px] object-contain"
                    />
                  ) : p.still ? (
                    <Image
                      src={p.still}
                      alt=""
                      width={64}
                      height={64}
                      sizes="78px"
                      className="h-[26px] w-[26px] object-contain"
                      aria-hidden
                    />
                  ) : (
                    <Home size={24} strokeWidth={2.2} aria-hidden />
                  )}
                </span>
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-3 max-w-[560px] font-body text-[14px] text-s-ink-2">
        Hair and Barber carry a clip and play on tap. Nails and Spa are the flat PNGs, because no
        mesh exists for them. That difference is the whole decision on this page.
      </p>

      <h2 className="mt-10 font-display text-[18px] font-semibold text-s-ink">
        The clips on their own, larger
      </h2>
      <div className="mt-4 flex flex-wrap gap-6">
        {PILLS.filter((p) => p.clip).map((p) => (
          <figure key={p.key} className="w-[160px]">
            <video
              src={p.clip as string}
              autoPlay
              loop
              muted
              playsInline
              className="h-[160px] w-[160px] rounded-[16px] bg-s-bg-sunken object-contain"
            />
            <figcaption className="mt-2 font-body text-[13px] text-s-ink-2">{p.label}</figcaption>
          </figure>
        ))}
      </div>
    </>
  );
}
