"use client";

// Exists-check: `npm run exists sheet` , reuses the real `Sheet` / `SheetHeader` / `SheetBody`
// primitives (app/[locale]/_components/primitives/Sheet.tsx) unmodified for the "Current" column.
// The "Proposed" column imports the same-shaped API from `./_ProposedSheet.tsx` (extracted from
// `claude/context-compact-architecture-5d1ace`, see that file's provenance comment), aliased to
// avoid a name clash with the real Sheet. Both columns render the SAME content (six real seeded
// salon names, passed in from the server component) so the only variable is the drag-release
// physics. Dev-only, gated out of production by the parent page.

import * as React from "react";
import {
  Sheet,
  SheetHeader,
  SheetBody,
} from "@/app/[locale]/_components/primitives";
import {
  Sheet as ProposedSheet,
  SheetHeader as ProposedSheetHeader,
  SheetBody as ProposedSheetBody,
} from "./_ProposedSheet";

function SalonList({ salonNames }: { salonNames: string[] }) {
  return (
    <ul>
      {salonNames.map((name) => (
        <li
          key={name}
          className="py-4 border-b border-s-border last:border-b-0 text-s-ink"
        >
          {name}
        </li>
      ))}
    </ul>
  );
}

export default function SheetFlickClient({ salonNames }: { salonNames: string[] }) {
  const [currentOpen, setCurrentOpen] = React.useState(false);
  const [proposedOpen, setProposedOpen] = React.useState(false);

  return (
    <main className="min-h-dvh bg-white px-4 py-8">
      <h1 className="font-body font-semibold text-[20px] leading-[1.3] text-s-ink">
        Sheet gesture comparison
      </h1>
      <p className="mt-2 font-body font-normal text-[14px] leading-[1.5] text-s-ink-2">
        Same primitive shell, same six real salons in both sheets. Only the drag-release
        physics differs between the two columns below.
      </p>

      <div className="mt-8 flex flex-col gap-8">
        <section>
          <h2 className="font-body font-semibold text-[14px] text-s-ink">Current</h2>
          <button
            type="button"
            onClick={() => setCurrentOpen(true)}
            className="mt-4 h-11 px-5 rounded-[16px] bg-s-ink font-body font-semibold text-[15px] text-white"
          >
            Open sheet
          </button>
          <p className="mt-4 font-body font-normal text-[14px] leading-[1.5] text-s-ink-2">
            Closes after dragging down more than 90px, no matter how fast or slow you drag.
          </p>

          <Sheet isOpen={currentOpen} onOpenChange={setCurrentOpen} height="auto">
            <SheetHeader title="Salons near you" onClose={() => setCurrentOpen(false)} />
            <SheetBody>
              <SalonList salonNames={salonNames} />
            </SheetBody>
          </Sheet>
        </section>

        <section>
          <h2 className="font-body font-semibold text-[14px] text-s-ink">Proposed</h2>
          <button
            type="button"
            onClick={() => setProposedOpen(true)}
            className="mt-4 h-11 px-5 rounded-[16px] bg-s-ink font-body font-semibold text-[15px] text-white"
          >
            Open sheet
          </button>
          <p className="mt-4 font-body font-normal text-[14px] leading-[1.5] text-s-ink-2">
            Closes on a quick downward flick regardless of distance, returns home on a quick
            upward flick regardless of distance, and otherwise closes only once the drag's own
            momentum would carry it past about a quarter of the sheet&apos;s height.
          </p>

          <ProposedSheet isOpen={proposedOpen} onOpenChange={setProposedOpen} height="auto">
            <ProposedSheetHeader title="Salons near you" onClose={() => setProposedOpen(false)} />
            <ProposedSheetBody>
              <SalonList salonNames={salonNames} />
            </ProposedSheetBody>
          </ProposedSheet>
        </section>
      </div>
    </main>
  );
}
