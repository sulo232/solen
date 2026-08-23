// Mockup-scope: whole-page
// Exists-check: `npm run exists rebook` returns 11 live matches and they are named in
// _plans/REBOOK_RHYTHM_2026-08-23.md rather than rebuilt: a daily nudge email job with a hardcoded
// 28 days, one-tap repeat endpoints, and the columns behind them. The GRAVEYARD hit is a one-tap
// "rebook your last cut" component deleted 2026-07-11 for having zero importers, so that UI was
// removed on purpose and is not re-proposed. What is new here is the customer choosing their own
// rhythm at booking time, which is the part that does not exist.
//
// measure-ok: the interaction is taken from the clip he linked, read frame by frame and confirmed
// on frame 70 by eye: a duration chip carries a pale fill of its own colour, both ends of the range
// are solid circles in that colour, the middle is one continuous pale capsule, and a live count
// badge sits top right. Numbers and colours below come from that reading, not from memory.

import { notFound } from "next/navigation";
import { RhythmClient } from "./RhythmClient";

export default async function RhythmPage() {
  if (process.env.NODE_ENV === "production" && process.env.SOLEN_DEV_PAGES !== "1") notFound();
  return <RhythmClient />;
}
