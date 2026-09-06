// Exists-check: `npm run exists "directions-0905-r2 confirmation"` and `npm run exists
// "confirmation lift r2"` (both run this turn) return 0 matches; no round-2 confirmation
// switcher exists yet. This file is the shared, minimal ?s= router the task brief asks for
// (create-if-missing, one branch per look system): "lift" and "rule" are built, "tray" falls
// through to the one-line placeholder below until its own builder lands.
//
// Depicts: routing only -> NET-NEW: this file draws no UI of its own, it reads ?s= and renders
// the matching system's own folder (app/[locale]/dev/directions-0905-r2/confirmation/_lift/ or
// _rule/). No DirectionFrame, no strip naming components (Part B cross-system rule: "No
// scaffolding in the fold").
//
// Grounded-in: app/[locale]/dev/directions-0905-r2/_kit/systems.ts (SystemKey = "lift" | "rule"
// | "tray", the same three keys this switch reads).
//
// EDIT 2026-09-06 (rule-system builder): added the "rule" branch only, per the orchestrator
// brief's own instruction for this shared file ("if it exists, add only your key's branch with a
// minimal edit, never restructure it"). Nothing else in this file was touched.
//
// EDIT 2026-09-06 (tray-system builder): added the "tray" branch + its import, same minimal-edit
// instruction. Only the "tray" `if` block, its import line, and the fallback message's mention of
// ?s=tray were touched; the file's structure, the lift/rule branches and this header's prior text
// are unchanged.

import ConfirmationLift from "./_lift/ConfirmationLift";
import ConfirmationRule from "./_rule/ConfirmationRule";
import ConfirmationTray from "./_tray/ConfirmationTray";

export default async function ConfirmationR2Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ s?: string }>;
}) {
  const { locale } = await params;
  const { s } = await searchParams;

  if (s === "lift") {
    return <ConfirmationLift locale={locale} />;
  }

  if (s === "rule") {
    return <ConfirmationRule locale={locale} />;
  }

  if (s === "tray") {
    return <ConfirmationTray locale={locale} />;
  }

  return (
    <div className="px-4 py-16 text-center text-[13px] text-s-ink-2">
      Unknown system &quot;{s ?? ""}&quot;. Try ?s=lift, ?s=rule or ?s=tray.
    </div>
  );
}
