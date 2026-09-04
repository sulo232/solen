/**
 * StatusInline — V3-D232 (2026-05-27, extracted from SalonSidebar for reuse).
 *
 * Split-color inline open/closed status. Word in s-success/s-closed,
 * time detail in muted ink. Replaces StatusPill in surfaces where the
 * pill chrome (background + radius) is too heavy (Fresha pattern —
 * inline text, no pill).
 *
 * Per Fresha capture (les-mains-basel @ 1440):
 *   "Closed" word in `#B7570B` burnt amber (we map → `s-urgency`)
 *   "- opens at 10:00 AM" continuation in `#767676` muted ink (we map → `s-ink-2`)
 *
 * 2026-07-24 PORT (P9, ref _overhaul/StatusInlineOverhaul.tsx): renders ONLY the
 * status word now (owner: "just make it closed", picked status-word-only over
 * "Geschlossen, opens Wednesday at 09:00"); the trailing clause below is dropped
 * entirely. Exact hours still live in the opening-hours section, so no information
 * is lost. Colour treatment is UNCHANGED.
 *
 * REVERSED 2026-08-15 (owner, dictated): "write it to when it's open or something",
 * matching his Fresha reference (one meta line reading "Geöffnet bis 18:00" beside
 * the rating). The trailing clause is back: the status word keeps its semantic
 * colour, and the rest of the label (the time / "opens at" clause) renders after
 * it in the calm secondary-ink token, no separator glyph between the two, the
 * colour step already separates them (taste rule 2). The 07-24 history above
 * stays on record rather than being deleted.
 *
 * label from computeOpenStatus is one of:
 *   "Geöffnet bis HH:MM"
 *   "Geschlossen[EM SPACE]Öffnet HH:MM"
 *   "Geschlossen[EM SPACE]Öffnet Mittwoch um 09:00"
 *   "Öffnungszeiten unbekannt" / "Heute geschlossen"
 * The closed-state labels join the two words with a U+2003 EM SPACE, not a plain
 * ASCII space, so splitting on /\s+/ (not a literal " ") is required to correctly
 * isolate just the leading status word.
 *
 * Layer 3 semantic UI (color carries meaning, universal-color convention:
 * success=green, closed=red s-closed #DC2626, V3-D421).
 *
 * RANGE LAW A1 (2026-07-25): font-semibold -> font-medium. The word already
 * carries its meaning through COLOR (green/red/amber), so stacking weight on
 * top was redundant (CLAUDE.md taste rule 2, "colour/weight contrast IS the
 * separator"), and it was one of the many status/meta lines pushing the PDP's
 * weight share to 83% against the 30% ceiling. Not in the task's explicit
 * "keep 600" list (salon name / section H2 / price / rating value / the one
 * commit CTA).
 */
import { cn } from "@/lib/utils";

export function StatusInline({
  isOpen,
  label,
  size = "md",
}: {
  isOpen: boolean;
  label: string;
  /** "sm" = 13px, "md" = 15px (default), "lg" = 16px (matches Fresha) */
  size?: "sm" | "md" | "lg";
}) {
  const [head, ...rest] = label.split(/\s+/);
  const tail = rest.join(" ");
  const sizeCls = size === "sm" ? "text-[13px]" : size === "lg" ? "text-[16px]" : "text-[15px]";
  // mockup-ok: restores the pre-07-24 s-ink-2 trailing-clause pattern this file's own docblock
  // already documented (Fresha ref); owner ask 2026-08-15, "write it to when it's open".
  return (
    <span className={cn("font-body inline-block", sizeCls)}>
      {/* mockup-ok: /dev/round5 , he picked green A there and that page named the two legal ways to
          use it, because A measures 2.68:1 on white and TEXT needs 4.5:1. Way one: the word goes
          darker than the dot. Way two: the word goes black and the dot alone carries the colour.
          This is way ONE, and only after measuring the page rather than assuming: way two reads
          fine in the abstract and collapses here, because the six green dots live in the
          Öffnungszeiten section 3270px down and THIS line has no dot at all. Way two would have
          left the header with no green whatsoever, on the exact line he asked to have it. */}
      <span className={cn("font-medium", isOpen ? "text-s-open-text" : "text-s-closed")}>{head}</span>
      {tail && <span className="font-normal text-s-ink-2"> {tail}</span>}
    </span>
  );
}
