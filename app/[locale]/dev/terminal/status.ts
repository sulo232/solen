/**
 * THE INDICATION SYSTEM for the merchant terminal.
 *
 * Owner, 2026-08-17: "make acc system fir indication instead of rndm sg". Before this, every
 * coloured thing on the screen was decided on its own. Each call was defensible and together they
 * were not a system, because nothing said what a colour MEANS or what has to be true for it to show.
 *
 * THE SYSTEM, in one sentence: a colour answers "does this need me, and how soon".
 *
 * ── THE WAIT COLOUR IS ABSOLUTE, NOT RELATIVE (owner, 2026-08-17, and he was right) ──────────────
 * It used to be relative to the wait each person was PROMISED: red once waited > promised. That is
 * defensible and it looked broken, and looking broken is the thing that matters here. He measured
 * it: 28 minutes rendered red while 33 rendered grey two rows below, because the first was promised
 * 15 and the second 45. The promise is not on the screen, so the reader sees only two numbers and
 * one rule that appears to be counting rows.
 *
 * His thresholds, used verbatim:            < 25 min  quiet    25 to 39  soon    >= 40  late
 *
 * THE COST, named rather than buried: an absolute number ignores what we told the customer. Somebody
 * promised 85 minutes and waiting 40 now shows an alarm although we are well inside our word, and
 * somebody promised 15 and waiting 24 stays quiet although we are one minute from breaking it. The
 * trade is deliberate: a rule the reader can verify at a glance beats a truer rule they cannot see.
 * If the promise ever renders on the row, this is worth revisiting.
 *
 * WHERE THE COLOUR LIVES on a stylist: the RING around their photo (owner: "make it no pill n jdt
 * circle", then "not round dott", then "remove the pill thats underneath"). The circle that is
 * already there IS the indicator; nothing is added to the screen to carry a state.
 *
 * RING TONES, corrected 2026-08-17 after he caught the inversion: a free stylist used to go red when
 * somebody in the queue was overdue, so red meant "problem" on a number and "available" on a face.
 * One colour, three meanings now, in one viewport (orange added 2026-08-18, see `staffTone` below).
 *      green    free, a chair is confirmed open
 *      orange   unconfirmed, the chair reads open only because the board has gone quiet
 *      ink      working, and the row says when they finish
 *
 * TWO RULES that keep it a system rather than a palette:
 *   1. Every tone is DERIVED from data that exists. There is no "looks busy" tone, because nothing
 *      in the database says that. `joined_at`, `started_at` and `services.duration_minutes` are real
 *      columns and every number below is computed from them.
 *   2. One tone per thing, shown one way. Colour never doubles up on the text beside it.
 */

export type Tone = "free" | "soon" | "late" | "idle";

/** The ring's colour. `text-*` because the ring is an SVG stroke reading `currentColor`. */
export const TONE_RING: Record<Tone, string> = {
  free: "text-s-success",
  soon: "text-s-urgency",
  late: "text-s-error",
  idle: "text-s-ink",
};

/**
 * The wait number's colour. `s-urgency` is #C2410C, which measures 4.9:1 on white and so is legal as
 * TEXT, unlike `s-warning` #F1AE27 at 1.94:1. That is why the middle tone is this orange and not the
 * system's warning amber.
 */
export const TONE_TEXT: Record<Tone, string> = {
  free: "text-s-ink-2",
  soon: "text-s-urgency",
  late: "text-s-error",
  idle: "text-s-ink-2",
};

/**
 * What the counter (or a screen reader) would say out loud. Only `StaffChip.tsx` reads this today
 * (a waiting-queue row colours its number from `TONE_TEXT`, never speaks `TONE_LABEL`), so `soon`
 * is worded for the stylist it now actually describes rather than for the queue entry it was
 * originally written for: a chair that reads open only because the board itself has gone quiet is
 * UNCONFIRMED, not "waiting". If a queue row ever reads this label too, its `soon` case will need
 * its own wording, because "unconfirmed" is not true of a person we measured waiting 30 minutes.
 */
export const TONE_LABEL: Record<Tone, string> = {
  free: "free",
  soon: "unconfirmed",
  late: "waiting a long time",
  idle: "working",
};

/** Owner's thresholds, 2026-08-17. Minutes actually waited, nothing relative. */
export const WAIT_SOON_MINUTES = 25;
export const WAIT_LATE_MINUTES = 40;

export function waitingTone(waitedMinutes: number | null): Tone {
  if (waitedMinutes === null) return "idle";
  if (waitedMinutes >= WAIT_LATE_MINUTES) return "late";
  if (waitedMinutes >= WAIT_SOON_MINUTES) return "soon";
  return "free";
}

/**
 * A stylist: green when a chair is confirmed open, ink while they are working, and now ORANGE
 * when the chair reads open only because the board itself has gone quiet.
 *
 * Added 2026-08-18. Green is this file's own "the one colour the counter acts on without
 * thinking" (see the header above), which is exactly why a STALE board cannot keep painting it
 * with full confidence: an empty chair on a board nobody has touched in ninety minutes
 * (`boardIsStale`, Screen.tsx ~line 676) is exactly as likely to be a stylist who stepped away
 * without logging it as it is to be genuinely free.
 *
 * The honest tone for that case is `soon`, not a new one, and not `late` or `idle` either.
 * `late`/red would claim we KNOW something is wrong, which we do not, we only know the data has
 * gone quiet. `idle`/ink would claim we KNOW they are working, which we also do not. `soon`'s own
 * definition in this file, "does this need me, and how soon", is exactly the true answer to an
 * unconfirmed chair: maybe, go look. A chair we KNOW is occupied (`busy=true`, from `joined_at`,
 * `started_at` or a live appointment) still wins outright regardless of staleness, because that IS
 * data that exists (rule 1 above); the absence of a queue entry is not proof of anything once the
 * board has stopped being updated.
 *
 * `boardIsStale` defaults to false so a caller that has not been touched by this change (there is
 * currently only one, Screen.tsx) keeps compiling and keeps its old, correct behaviour.
 */
export function staffTone(busy: boolean, boardIsStale = false): Tone {
  if (busy) return "idle";
  return boardIsStale ? "soon" : "free";
}

/** A booking: the only thing about one that needs the counter is an unanswered one. */
export function bookingTone(status: string): Tone {
  return status === "pending_approval" ? "soon" : "idle";
}

/**
 * Minutes left in a chair, from the service's own duration. Null when the service has no duration on
 * file or the start was never recorded, and the screen then says nothing rather than inventing a
 * number, because "12 min left" is a promise to whoever is next in line.
 */
export function minutesLeft(startedAt: string | null, durationMinutes: number | null): number | null {
  if (!startedAt || !durationMinutes) return null;
  const elapsed = (Date.now() - new Date(startedAt).getTime()) / 60_000;
  return Math.max(0, Math.round(durationMinutes - elapsed));
}
