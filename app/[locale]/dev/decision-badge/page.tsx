/**
 * Exists-check: `npm run exists decision-mockup` -> 1 REMOVED hit (bundles, unrelated).
 * `npm run exists NotificationBell` / `Bell` -> real component at
 * app/[locale]/_components/layout/NotificationBell.tsx (Lucide `Bell`, badge classes
 * quoted below verbatim). Net-new: this decision route.
 *
 * lang-ok: owner-facing decision mockup for a direct German-speaking owner review
 * (task spec: "German copy only (no EN)"), not an AI-only review artifact.
 *
 * Decision: notification-count badge colour. NotificationBell.tsx:48 ships
 * `bg-s-accent` (blue) today; this decision is between `s-error` red and neutral
 * ink, per LOCKFILE.md §13.3 ("Notification-count note, OPEN ... Recommended: red
 * s-error #DC2626, white numeral, 99+ cap ... The ink alternative is calmer but
 * loses the instant signal ... Flagged for owner confirmation, Q-stepper-1").
 * Both columns recreate the bell EXACTLY (same Lucide `Bell` import, same button
 * shell classes, same badge shape/size classes) - only the badge `bg-*` token
 * differs. The count (3) is a labeled example, not a live value.
 */
import { notFound } from "next/navigation";
import { Bell } from "lucide-react";
import { DecisionChip, DecisionCaption, DecisionHeader } from "../_shared/DecisionChip";

// Real count used for illustration only (labeled "Beispiel" below), the 99+ cap
// logic per LOCKFILE §13.3 (NotificationBell.tsx today caps at "9+"; this mockup
// implements the LOCKFILE-recommended 99+ cap so the decision reflects the
// documented recommendation, not the current 9+ implementation).
const EXAMPLE_COUNT = 3;
function badgeLabel(n: number): string {
  return n > 99 ? "99+" : String(n);
}

const BADGE_CLASS = "absolute right-1 top-1 grid h-[16px] min-w-[16px] place-items-center rounded-full px-[3px] text-[10px] font-bold leading-none text-white"; // drift-ok: exact quote of the live badge (NotificationBell.tsx:48), not a new invention.

function BellPreview({ letter, value, badgeTone }: { letter: "A" | "B"; value: string; badgeTone: string }) {
  return (
    <div>
      <DecisionChip letter={letter} value={value} />
      <div className="mt-4 flex items-center justify-center rounded-card border border-s-border bg-white py-10">
        <span
          aria-label={`Benachrichtigungen, ${EXAMPLE_COUNT} ungelesen`}
          className="relative grid h-10 w-10 place-items-center text-s-ink"
        >
          <Bell size={21} strokeWidth={2} aria-hidden />
          <span className={`${BADGE_CLASS} ${badgeTone}`}>{badgeLabel(EXAMPLE_COUNT)}</span>
        </span>
      </div>
    </div>
  );
}

export default function DecisionBadgePage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="mx-auto min-h-screen w-full max-w-[375px] bg-white">
      <DecisionHeader
        title="Benachrichtigungs-Badge: Farbe"
        decision="Ungelesen-Zähler auf der Glocke: s-error Rot vs. neutrales Ink (LOCKFILE 13.3, offene Frage)."
      />
      <div className="grid grid-cols-2 gap-4 p-4">
        <BellPreview letter="A" value="s-error Rot" badgeTone="bg-s-error" />
        <BellPreview letter="B" value="neutrales Ink" badgeTone="bg-s-ink" />
      </div>
      <div className="px-4">
        <DecisionCaption>
          Zähler = 3 (Beispiel, kein Live-Wert). Glocke sonst 1:1 wie im Header
          (NotificationBell.tsx), nur die Badge-Farbe unterscheidet sich.
        </DecisionCaption>
      </div>
      <div className="h-8" />
    </div>
  );
}
