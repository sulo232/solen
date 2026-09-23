// scripts/lib/type-scale-allowed.mjs
//
// Shared allowed-type-scale source of truth for the type-scale consistency work. Both the
// report-mode detector (scripts/detect-type-scale-outliers.mjs) imports ONLY this module for
// the allowed/off-scale decision (same pattern as scripts/lib/icon-blessed-context.mjs).
//
// ALLOWED_PX (the authoritative locked type scale, TUNABLE, assembled by reading, not
// guessing): every px value the locked scale sanctions, sourced from
//   - LOCKFILE.md section 2 "Scale" table + the clamp-pattern block (line ~221-253)
//   - LOCKFILE.md section 2.5 "The 11 roles" table + "Core ramp" table (line ~287-333)
//   - project CLAUDE.md design-contract "text size" row (name 14, meta 12,
//     section-H2 clamp(18px,2vw,20px), body 14, CTA 15 never <=13 on a button, eyebrow 11,
//     PLUS the display floor: one display anchor >= 28 unless the photo is the focal)
// Both the mobile and desktop clamp endpoints of every role count as allowed, since either
// one can legitimately render as a fixed text-[Npx] at a given breakpoint. Values marked
// AMBIGUOUS are included per this module's own instruction: a false negative (an off-scale
// size that slips through unflagged) is cheaper than a false positive (a locked role value
// flagged as drift, which would make the report and the gate untrustworthy on first read).

export const ALLOWED_PX = new Map([
  [10, ["Tag/Status role, LOCKFILE section 2.5 table (10-12px) and migration mapping row (old text-[9-12px] swept to new text-[10-12px])"]],
  [11, ["Eyebrow mobile, LOCKFILE section 2 table (11px) and section 2.5 table (11 to 12px)", "Caption mobile, LOCKFILE section 2 table (11px)", "CLAUDE.md text-size row: eyebrow 11"]],
  [12, ["Eyebrow desktop, LOCKFILE section 2 table (12px) and section 2.5 table", "Caption desktop, LOCKFILE section 2 table (12px)", "Team-card role mobile, LOCKFILE section 2 table (12px)", "Tag/Status range top end, LOCKFILE section 2.5 table (10-12px)", "CLAUDE.md text-size row: meta 12"]],
  [13, ["Body small mobile, LOCKFILE section 2 table (13px)", "Service-row duration mobile, LOCKFILE section 2 table (13px)", "Team-card role desktop, LOCKFILE section 2 table (13px)", "Meta role desktop, LOCKFILE section 2.5 table and Core ramp table (secondary/meta)"]],
  [14, ["Body mobile+desktop-small, LOCKFILE section 2 table (14px)", "Body large mobile, LOCKFILE section 2 table (14px)", "CTA mobile, LOCKFILE section 2 table (14px)", "Service-row price mobile, LOCKFILE section 2 table (14px)", "Team-card name mobile, LOCKFILE section 2 table (14px)", "Star rating small, LOCKFILE section 2 table (14px)", "Body role, LOCKFILE section 2.5 table (clamp 14 to 15) and Core ramp table", "Tab label, LOCKFILE section 2.5 table (14px)", "CLAUDE.md text-size row: name 14, body 14"]],
  [15, ["Body desktop, LOCKFILE section 2 table (15px)", "CTA desktop, LOCKFILE section 2 table (15px)", "Service-row name mobile, LOCKFILE section 2 table (15px)", "Service-row price desktop, LOCKFILE section 2 table (15px)", "Team-card name desktop, LOCKFILE section 2 table (15px)", "Primary CTA and Secondary CTA, LOCKFILE section 2.5 table (15px)", "AMBIGUOUS: Hero sub mobile per LOCKFILE section 2.5 table (clamp(15,4vw,22)); section 2's own clamp-pattern block instead gives Hero sub as clamp(16px,4vw,22px), see the 16 entry below, same undocumented mismatch as the Hero H1 tension", "CLAUDE.md text-size row: CTA 15 (never <=13 on a button)"]],
  [16, ["Subsection H3 mobile, LOCKFILE section 2 table (16px), section 2.5 table (16 to 18) and Core ramp table (card title/anchor)", "Body large desktop, LOCKFILE section 2 table (16px)", "Service-row name desktop, LOCKFILE section 2 table (16px)", "AMBIGUOUS: Hero sub mobile per LOCKFILE section 2's own clamp-pattern block (text-[clamp(16px,4vw,22px)]), which disagrees with section 2.5's Hero-sub value of 15, see the 15 entry above"]],
  [18, ["Section H2 mobile, LOCKFILE section 2 table (18px), section 2.5 table (clamp 18 to 20) and Core ramp table", "Subsection H3 desktop, LOCKFILE section 2 table (18px)", "Star rating large mobile, LOCKFILE section 2 table (18px)", "CLAUDE.md text-size row: section-H2 clamp(18px,2vw,20px)"]],
  [20, ["Section H2 desktop, LOCKFILE section 2 table (20px) and section 2.5 table (clamp 18 to 20)", "Star rating large desktop, LOCKFILE section 2 table (20px)", "CLAUDE.md text-size row: section-H2 clamp(18px,2vw,20px)"]],
  [22, ["Salon-sidebar H2 mobile, LOCKFILE section 2 table (22px)", "Page H2 mobile, LOCKFILE section 2 table (22px), section 2.5 table (clamp 22 to 26) and Core ramp table", "Hero sub desktop, LOCKFILE section 2 table AND section 2.5 table both agree on 22 as the shared clamp max"]],
  [24, ["AMBIGUOUS: LOCKFILE section 2.5 Display-type recipe (DS-A1) names 24px explicitly as the dashboard-heading cap (\"Dashboard surfaces cap at 24px (information density)\"), a real sanctioned value for a dashboard-context Page H2 variant even though it is not one of the two clamp endpoints in the base role table"]],
  [26, ["Salon-sidebar H2 desktop, LOCKFILE section 2 table (26px)", "Page H2 desktop, LOCKFILE section 2 table (26px) and section 2.5 table (clamp 22 to 26)"]],
  [28, ["Hero H1 mobile per LOCKFILE section 2.5 table (clamp(28,7vw,64)), marked ENFORCED. Included per the known, logged tension with section 2's 40 (see the 40 entry and the report note below); both endpoints are treated as allowed rather than flagging Hero H1 as drift."]],
  [30, ["Salon-PDP H1 mobile, LOCKFILE section 2 table (30px)"]],
  [34, ["Salon-PDP H1 desktop, LOCKFILE section 2 table (34px)"]],
  [40, ["Hero H1 mobile per LOCKFILE section 2's own Scale table and clamp-pattern block (text-[clamp(40px,10vw,64px)]). This is the OTHER side of the logged section 2 vs section 2.5 contradiction on Hero H1 (see the 28 entry above and the report note below); both endpoints are treated as allowed rather than flagging Hero H1 as drift."]],
  [64, ["Hero H1 desktop, LOCKFILE section 2 table, section 2.5 table and the clamp-pattern block all agree on 64 as the shared max"]],
]);

// The one open contradiction this module deliberately does NOT resolve (owner call pending):
// _design-system/QUESTIONS.md "Consistency-system research tensions" item 2 records that LOCKFILE
// section 2 (clamp(40px,10vw,64px)) and section 2.5 (clamp(28,7vw,64), marked ENFORCED) disagree
// on the Hero H1 mobile minimum. Both 28 and 40 are in ALLOWED_PX above so Hero H1 usages of
// either value are never flagged as drift; this note exists so a reader of the report/gate sees
// the open tension instead of assuming it was silently resolved here.
export const HERO_H1_CONTRADICTION_NOTE =
  "Known open tension (not resolved by this module): LOCKFILE.md section 2 vs section 2.5 " +
  "disagree on the Hero H1 mobile clamp minimum (28 vs 40, both max at 64); logged in " +
  "_design-system/QUESTIONS.md \"Consistency-system research tensions\" item 2, needs owner " +
  "reconciliation. Both 28px and 40px are treated as allowed here so Hero H1 is never flagged.";

// Below the LOCKFILE's own legibility floor (Core ramp hard rule: "nothing below 12px") AND
// the OLD, explicitly-superseded Tag/Status range (section 2.5 migration mapping row: old
// text-[9-12px] swept to new text-[10-12px]). Not added to ALLOWED_PX; exported so the report
// can explain 9px specifically rather than lumping it into the plain odd-integer tail.
export const SUB_FLOOR_PX = 9;
export const SUB_FLOOR_NOTE =
  "text-[9px] sits below the LOCKFILE Core ramp legibility floor (\"nothing below 12px\") and is " +
  "the OLD Tag/Status range the migration mapping table explicitly sweeps to text-[10-12px]. " +
  "Flagged like any other off-scale value, called out here because it is a known deprecated " +
  "pattern, not an unexplained one-off.";

// ---------------------------------------------------------------------------------------
// Detection: text-[Npx] / text-[N.Npx] / text-[Nrem] / text-[N.Nrem]. Requires a digit
// immediately after the opening bracket, so text-[clamp(...)] (the locked roles' own idiom)
// never matches. Line-based, same reasoning as the icon-mismatch detector: a literal regex
// scan is precise enough here, no AST needed for a single-utility pattern.
// ---------------------------------------------------------------------------------------
export const TEXT_SIZE_RE = /text-\[(\d+(?:\.\d+)?)(px|rem)\]/g;

export function pxValue(numStr, unit) {
  const n = parseFloat(numStr);
  return unit === "rem" ? n * 16 : n;
}

export function isAllowedPx(px) {
  // ALLOWED_PX only ever holds whole-number px values (every source table reads in whole
  // pixels). Require an exact integer before even checking membership, so a fractional value
  // (a half-pixel utility, or a rem conversion that doesn't land on a whole pixel) can never
  // accidentally round into a false "allowed".
  if (Math.abs(px - Math.round(px)) > 1e-6) return false;
  return ALLOWED_PX.has(Math.round(px));
}

/** Every off-scale text-[Npx] / text-[N.Npx] / text-[Nrem] occurrence in `fileText`, line-based.
 *  Returns [{ raw, px, unit, line }]. This is the single shared source of truth the detector's
 *  report grouping and the gate's net-new count comparison both build on, so they can never
 *  disagree about what counts as off-scale. */
export function offScaleValues(fileText) {
  const out = [];
  const lines = String(fileText ?? "").split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    TEXT_SIZE_RE.lastIndex = 0;
    let m;
    while ((m = TEXT_SIZE_RE.exec(line))) {
      const raw = m[0]; // e.g. "text-[12.5px]"
      const px = pxValue(m[1], m[2]);
      if (isAllowedPx(px)) continue;
      out.push({ raw, px, unit: m[2], line: i + 1 });
    }
  }
  return out;
}

/** Nearest allowed px value(s) to an off-scale px, for gate block messages. Returns 1 value,
 *  or 2 on an exact tie (e.g. 13.5 is equidistant from both 13 and 14). */
export function nearestAllowedPx(px) {
  const allowed = [...ALLOWED_PX.keys()].sort((a, b) => a - b);
  let best = Infinity;
  for (const a of allowed) {
    const d = Math.abs(a - px);
    if (d < best) best = d;
  }
  return allowed.filter((a) => Math.abs(a - px) === best);
}
