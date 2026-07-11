// RING 3b. Pure helper extracted from app/api/cron/generate-slots/route.ts's
// nail-station and barber-chair capacity passes. Both passes ran an IDENTICAL
// O(n^2) scan: for every slot, filter the whole array for "concurrent" slots.
// classifyOverlapBlocks below replaces that scan with an O(n log n) sort +
// bounded-window computation that returns the EXACT same set of blocked ids.
// Equivalence proof (old O(n^2) copied verbatim vs this function, 5 synthetic
// cases + 200 random slots x 20 seeded runs): scripts/ring3b-kill-test.ts.

export interface OverlapSlot {
  id: string;
  starts_at: string; // ISO timestamp
  ends_at: string; // ISO timestamp
}

// Concurrency definition, preserved EXACTLY from the original O(n^2) scan
// (app/api/cron/generate-slots/route.ts, nail pass ~:265-275 / barber pass
// ~:326-334 before this change): for a given slot X, another slot S counts as
// "concurrent" with X iff
//
//   S.starts_at < (X.ends_at + bufferMs)  AND  S.ends_at > X.starts_at
//
// Note the buffer is added ONLY to X's end (not to S's), so this is NOT a
// symmetric relation: "S concurrent with X" and "X concurrent with S" can
// differ for the same pair. Touching boundaries (S.ends_at === X.starts_at,
// or S.starts_at === X.ends_at + bufferMs) do NOT count, because both
// comparisons above are strict.
//
// The original scan also does not scope by staff_member_id: the SELECT
// feeding it is `.eq("salon_id", salon.id)` only, so slots from different
// staff at the same salon DO interact (shared physical station/chair
// resource). This helper mirrors that: no staff grouping.
//
// A slot is blocked when its concurrent count + 1 (itself) exceeds capacity,
// exactly as the original `if (concurrent.length + 1 > stationCount)` check.
export function classifyOverlapBlocks(slots: OverlapSlot[], bufferMs: number, capacity: number): Set<string> {
  const n = slots.length;
  const blocked = new Set<string>();
  if (n === 0) return blocked;

  const starts = slots.map((s) => new Date(s.starts_at).getTime());
  const ends = slots.map((s) => new Date(s.ends_at).getTime());

  // Process slots in start-ascending order so X.starts_at is non-decreasing
  // across the sweep (ties broken by original index; irrelevant to the
  // result, the concurrency predicate is order-independent).
  const byStart = slots.map((_, i) => i).sort((a, b) => starts[a] - starts[b] || a - b);
  const sortedStarts = byStart.map((i) => starts[i]);
  const sortedEnds = [...ends].sort((a, b) => a - b);

  // Derivation used below (see kill test for the exhaustive check):
  //   concurrent(X) = |{S: S.start < BE}| - |{S: S.end <= X.start}| - 1
  // where BE = X.ends_at + bufferMs, over the WHOLE slot set (self included
  // in both counts, hence the trailing -1). This holds because any S with
  // S.end <= X.start automatically satisfies S.start < BE too (positive
  // duration => S.start <= S.end <= X.start < BE), so subtracting the global
  // "ends <= X.start" count from the global "starts < BE" count leaves
  // exactly the slots that overlap X's buffered window, plus X itself.

  // Running two-pointer over sortedEnds: X.start only grows across the sweep,
  // so the count of ends <= X.start only grows too, one forward pointer
  // suffices (no slot with a LATER start can ever have end <= an EARLIER
  // X.start, given positive duration, so this stays correct globally, not
  // just over a prefix).
  let endPtr = 0;

  for (const idx of byStart) {
    const xStart = starts[idx];
    const xEnd = ends[idx];
    const bufferedEnd = xEnd + bufferMs;

    while (endPtr < n && sortedEnds[endPtr] <= xStart) endPtr++;
    const endsLE = endPtr;

    // bufferedEnd is NOT monotonic across the sweep (slot durations vary), so
    // this needs a fresh binary search per slot rather than a shared pointer.
    const startsLT = countLessThan(sortedStarts, bufferedEnd);

    const concurrent = startsLT - endsLE - 1;
    if (concurrent + 1 > capacity) blocked.add(slots[idx].id);
  }

  return blocked;
}

// Count of entries in ascending-sorted `arr` strictly less than `value`.
function countLessThan(arr: number[], value: number): number {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (arr[mid] < value) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}
