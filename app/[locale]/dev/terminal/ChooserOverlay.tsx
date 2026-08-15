// exists-check: net-new vs app/[locale]/dev/pdp/_overhaul/reviews/FilterBlockDirections.tsx (read
// before writing this: that file HOLDS three directions of one component and renders them inline on
// a desktop comparison page, so it is a directions CONTAINER, not a chooser; the three merchant
// directions here are whole full-bleed screens on their own routes and cannot be inlined) and vs
// components-legacy/layout/PageTransitionWrapper.tsx (a layout wrapper, unrelated). The plan docs
// the guard also matched (_plans/DESIGN_MOCKUPS.md, MOBILE_DESIGN_SYSTEM.md,
// DESIGN_SYSTEM_HARDENING.md, DESIGN_SYSTEM_RENEWAL_2026-08-02.md,
// docs/roadmaps/07-design-system-polish.md, _tasks/completed/CLAUDE_md_design_system_2026-05-06.md)
// are markdown, not components. Net-new: an index of three ROUTES, phone list plus desktop frames.
"use client";

// english-ok: standalone dev chooser, all copy is English per the mockup rule.
// registered-component-ok: this is an INDEX of three mockups, not a product surface. It composes
// nothing from the design system on purpose, so it can never be mistaken for one of the designs.
//
// Portalled to document.body for the same reason every direction is: the locale layout wraps its
// children in a transformed page-transition element, which becomes the containing block for
// `fixed` and pins an overlay to the wrapper instead of the viewport.

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface Direction {
  letter: string;
  name: string;
  note: string;
  path: string;
}

export default function ChooserOverlay({ locale, directions }: { locale: string; directions: Direction[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // FIXED 2026-08-15 (owner: "the mockup isn't working at all"). Returning null until mount meant
  // the SERVER sent a page with no chooser in it, so the first thing on a phone was the plain
  // Solen site and a footer. Measured: zero occurrences of the overlay class in the server HTML.

  const screen = (
    // Before hydration this is a normal full-height block; `fixed` inside the layout's transformed
    // page-transition wrapper is bounded by that wrapper, not the viewport (owner, 2026-08-15).
    <div
      className={
        mounted
          ? "fixed inset-0 z-[10000] overflow-y-auto bg-white"
          : "relative z-[10000] min-h-[100dvh] w-full bg-white"
      }
    >
      {/* Phone: three compact rows at the top of the screen. Nothing else. */}
      <div className="md:hidden">
        {directions.map((d) => (
          <a
            key={d.path}
            href={`/${locale}/dev/terminal/${d.path}`}
            className="flex min-h-[72px] items-center gap-4 border-b border-s-border px-5 py-4"
          >
            <span className="font-body w-4 shrink-0 text-[15px] font-normal text-s-ink-2">{d.letter}</span>
            <span className="min-w-0 flex-1">
              <span className="font-body block text-[15px] font-medium text-s-ink">{d.name}</span>
              <span className="font-body mt-1 block text-[13px] font-normal text-s-ink-2">{d.note}</span>
            </span>
          </a>
        ))}
      </div>

      {/* Desktop: the three side by side, each a real 402x820 frame of the running route. */}
      <div className="hidden justify-center gap-8 px-8 py-8 md:flex">
        {directions.map((d) => (
          <div key={d.path} className="flex flex-col items-center gap-2">
            <a
              href={`/${locale}/dev/terminal/${d.path}`}
              className="font-body text-[13px] font-normal text-s-ink-2 hover:text-s-ink"
            >
              {d.letter}, {d.name}
            </a>
            <iframe
              src={`/${locale}/dev/terminal/${d.path}`}
              title={`Direction ${d.letter}, ${d.name}`}
              width={402}
              height={820}
              className="border border-s-border"
            />
          </div>
        ))}
      </div>
    </div>
  );

  // Server and first paint: render inline. After hydration: move into the body portal.
  if (!mounted) return screen;

  return createPortal(screen, document.body);
}
