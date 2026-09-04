// Grounded-in: app/[locale]/_components/search/SearchOverlay.tsx (the Where/location step)
// Exists-check: `npm run exists "where step search overlay location"` and `npm run exists "where-step-height"` both ran this turn (4 separate runs, same empty/near-empty result each time); the only hit is this task's own sibling file (ProposedWhereCard.tsx, written earlier this turn). Nothing in the app already renders a content-sized Where-step sheet; the bug this compares against is live in SearchOverlay.tsx today (slotSizes ~line 1264, locNeed ~line 879, onFocus grow(1) ~line 2387). No REMOVED.md hit. The one new thing: a content-sized copy of the Where step's own card, next to the two real screenshots of the bug.
//
// Depicts: the bug, focused Where step with "Bas" typed -> app/[locale]/_components/search/SearchOverlay.tsx (real production screenshots, see the note below on why this is images rather than a live mount)
// Depicts: the fix, Where step card sized to its own content -> NET-NEW: no content-sized version of this card exists today; ./ProposedWhereCard.tsx byte-copies SearchOverlay.tsx's real location-slot JSX and changes only the height
//
// Why "Current" is the real screenshots, not a live-mounted SearchOverlay: the component's props
// DO allow opening straight on the Where step (`initialFocus="stadt"`), so a live mount was tried
// first. But `initialFocus="stadt"` only opens the step; it does not set `inputFocused` or call
// `grow(1)` (those only fire for `autoFocusService` on the SERVICE step), so it lands on the
// unfocused city list, not the focused/typed/keyboard-up bug state this brief measures. Reaching
// that exact state also needs `window.visualViewport` to shrink the way a REAL iOS keyboard shrinks
// it (the `kbInset` term SearchOverlay.tsx reads at ~line 753), which a headless render cannot
// produce. The two screenshots below are the real production capture of that exact state instead,
// per the fallback this task named.
//
// Mockup-scope: section

import Image from "next/image";
import { notFound } from "next/navigation";
import { ProposedWhereCard, WHERE_CARD_CONTENT_HEIGHT } from "./ProposedWhereCard";

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-[13px] font-semibold text-s-ink">{children}</p>;
}

function Caption({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-[13px] text-s-ink-2">{children}</p>;
}

// Real backdrop tone sampled directly off the production screenshot (PIL, center-top pixels read
// 219-229 across R/G/B), the blurred rest-of-page behind the sheet. Stands in for that same blurred
// page here so the "sheet no longer fills the screen" fix is visible against something.
const BACKDROP = "#e2e2e2"; // drift-ok: PIL-sampled off the real production screenshot's backdrop, not a design token (the real overlay composites a black/40 scrim over a blurred photo; no flat hex token exists for that composite)

export default function WhereStepHeightPage() {
  if (process.env.NODE_ENV === "production" && process.env.SOLEN_DEV_PAGES !== "1") notFound();

  return (
    <div className="mx-auto max-w-[402px] bg-white px-4 py-6">
      <Label>Current, real screenshot, 844px viewport (no keyboard)</Label>
      <div className="relative overflow-hidden rounded-[20px]" style={{ height: 422 }}>
        <Image
          src="/_mockups/_assets/where-step-height/current-844.png"
          alt="Where step focused on Basel, real production screenshot, 390x844"
          width={390}
          height={844}
          className="h-auto w-full"
          unoptimized
        />
      </div>
      <Caption>
        Measured: sheet 794px tall, white gap under &quot;Basel&quot; = 522px (root cause:
        SearchOverlay.tsx slotSizes ~line 1264 hands all surplus height to the open step).
      </Caption>

      <Label>
        <span className="mt-6 block">Current, real screenshot, 508px viewport (keyboard up)</span>
      </Label>
      <div className="relative overflow-hidden rounded-[20px]" style={{ height: 254 }}>
        <Image
          src="/_mockups/_assets/where-step-height/current-508.png"
          alt="Where step focused on Basel, real production screenshot, 390x508, keyboard up"
          width={390}
          height={508}
          className="h-auto w-full"
          unoptimized
        />
      </div>
      <Caption>
        Measured: sheet 458px tall (794 clipped to the 508px viewport), white gap under
        &quot;Basel&quot; = 186px.
      </Caption>

      <div className="my-8 h-px bg-s-border" />

      <Label>Proposed, 844px viewport (no keyboard)</Label>
      <div
        className="relative overflow-hidden rounded-[20px] px-3 pt-[50px]"
        style={{ height: 422, background: BACKDROP }}
      >
        <ProposedWhereCard />
      </div>
      <Caption>
        Card height = its own content ({WHERE_CARD_CONTENT_HEIGHT}px: 32 card padding + 64 input
        row + 136 for the 2 rows), not the leftover viewport. Gap under &quot;Basel&quot; = 16px
        (the card&apos;s own bottom padding), down from 522px. The rest of the frame is the same
        blurred backdrop the real overlay already shows, now visible instead of covered in white.
      </Caption>

      <Label>
        <span className="mt-6 block">Proposed, 508px viewport (keyboard up)</span>
      </Label>
      <div
        className="relative overflow-hidden rounded-[20px] px-3 pt-[50px]"
        style={{ height: 254, background: BACKDROP }}
      >
        <ProposedWhereCard />
      </div>
      <Caption>
        Same {WHERE_CARD_CONTENT_HEIGHT}px card, well under the 508px keyboard-up viewport so no
        capping applies. Gap under &quot;Basel&quot; = 16px, down from 186px.
      </Caption>
    </div>
  );
}
