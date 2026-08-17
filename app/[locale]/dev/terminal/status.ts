/**
 * THE INDICATION SYSTEM for the merchant terminal.
 *
 * Owner, 2026-08-17: "make acc system fir indication instead of rndm sg". Before this, every
 * coloured thing on the screen was decided on its own: green because free felt green, red because
 * late felt red, ink because a stylist working is not an alarm. Each call was defensible and
 * together they were not a system, because nothing said what a colour MEANS or what has to be true
 * for it to appear.
 *
 * THE SYSTEM, and it is one sentence: a colour answers "does this need me, and how soon".
 *
 *   green   nothing needed. A free chair, or a person still comfortably inside the wait we promised.
 *   orange  needed soon. A person at or past three quarters of their promised wait, or a booking
 *           sitting on a decision. Nothing is broken yet, and it will be if it is ignored.
 *   red     a promise is already broken. A person has waited longer than the wait we gave them.
 *   ink     nothing to decide. A stylist mid-cut is the ordinary state of a salon, and the ordinary
 *           state does not get a colour, or the colours stop meaning anything.
 *
 * WHERE THE COLOUR LIVES: on the RING around the stylist's photo, not on a badge and not on a dot
 * (owner 2026-08-17, twice: "make it no pill n jdt circle", then "not round dott"). The circle that
 * is already there IS the indicator. Nothing is added to the screen to carry a state.
 *
 * On a list row there is no ring, and this system does NOT invent a pip to put one there: taste rule
 * 2 bans decorative dots, and the warning orange measures 1.94:1 on white, below the text floor. So
 * a row shows only the one tone that is legible and load-bearing, `late`, on the number itself.
 *
 * TWO RULES that keep it a system rather than a palette:
 *   1. Every tone must be DERIVED from data that exists. There is no "looks busy" tone, because
 *      nothing in the database says that. `joined_at` and `estimated_wait_minutes` are real columns
 *      and every threshold below is computed from them.
 *   2. One tone per thing, shown one way: the dot. Colour never doubles up on the text beside it,
 *      because then a row says the same thing twice and neither says it clearly.
 *
 * The 0.75 threshold is a HOUSE NUMBER, not a sourced one: it is the point where a warning still
 * leaves time to act on a wait of any length. Named as a house number rather than dressed up.
 */

export type Tone = "free" | "soon" | "late" | "idle";

/** The ring's colour. `text-*` because the ring is an SVG stroke reading `currentColor`. */
export const TONE_RING: Record<Tone, string> = {
  free: "text-s-success",
  soon: "text-s-warning",
  late: "text-s-error",
  idle: "text-s-ink",
};

/** What the counter would say out loud. Used for the accessible label, never rendered as a chip. */
export const TONE_LABEL: Record<Tone, string> = {
  free: "free",
  soon: "waiting almost too long",
  late: "waited longer than promised",
  idle: "working",
};

/**
 * A stylist's ring, and this is where the four tones actually earn their place, because a colour is
 * only worth having if it changes what the person at the counter does next:
 *
 *   ink     working. Nothing to do.
 *   green   free, and nobody is waiting. Nothing to do either, but the chair is open.
 *   orange  free WHILE somebody is waiting. Seat them.
 *   red     free while somebody has already waited longer than we promised them. Seat them now.
 *
 * Written this way on purpose rather than "free = green, busy = grey": a free chair with a queue in
 * front of it is the one situation on this screen that is nobody's fault yet and becomes somebody's
 * fault in a minute, and that is exactly what an amber is for.
 */
export function staffTone(busy: boolean, worstWaiting: Tone = "idle"): Tone {
  if (busy) return "idle";
  if (worstWaiting === "late") return "late";
  if (worstWaiting === "soon") return "soon";
  return "free";
}

/** The most urgent tone in a set, so a whole queue can be summarised into one ring. */
export function worstTone(tones: Tone[]): Tone {
  if (tones.includes("late")) return "late";
  if (tones.includes("soon")) return "soon";
  return "idle";
}

/**
 * A person in the queue, against the wait THEY were promised. Returns "free" while they are
 * comfortably inside it, so a calm queue reads calm.
 */
export function waitingTone(waitedMinutes: number | null, promisedMinutes: number): Tone {
  if (waitedMinutes === null || promisedMinutes <= 0) return "idle";
  if (waitedMinutes > promisedMinutes) return "late";
  if (waitedMinutes >= promisedMinutes * 0.75) return "soon";
  return "free";
}

/** A booking: only one thing about a booking needs the counter, and that is an unanswered one. */
export function bookingTone(status: string): Tone {
  return status === "pending_approval" ? "soon" : "idle";
}
