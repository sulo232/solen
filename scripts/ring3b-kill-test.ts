// Ring 3b kill test: equivalence proof for the O(n^2) -> O(n log n) overlap
// classification carve-out in app/api/cron/generate-slots/route.ts (nail
// station + barber chair capacity passes). The cron itself is NOT run here
// (it writes availability_slots to the live DB, off-limits per the ring
// brief); this test proves the pure classification logic is unchanged by
// diffing the OLD O(n^2) scan (copied verbatim below) against the NEW
// lib/slots/overlap.ts sweep on synthetic + randomized slot sets.
//
// Usage: npx tsx scripts/ring3b-kill-test.ts
import { classifyOverlapBlocks, type OverlapSlot } from "@/lib/slots/overlap";

// --- OLD logic, copied verbatim from the nail/barber passes (only the
// station/chair capacity param name was generalized to `capacity`; the
// comparison operators and the `s.id === slot.id` self-exclusion are
// untouched) ------------------------------------------------------------
function oldClassifyOverlapBlocks(slots: OverlapSlot[], bufferMs: number, capacity: number): Set<string> {
  const blocked = new Set<string>();
  for (const slot of slots) {
    const slotStart = new Date(slot.starts_at);
    const slotEndBuffered = new Date(new Date(slot.ends_at).getTime() + bufferMs);
    const concurrent = slots.filter((s) => {
      if (s.id === slot.id) return false;
      const sStart = new Date(s.starts_at);
      const sEnd = new Date(s.ends_at);
      return sStart < slotEndBuffered && sEnd > slotStart;
    });
    // +1 for the slot itself
    if (concurrent.length + 1 > capacity) {
      blocked.add(slot.id);
    }
  }
  return blocked;
}

// --- seeded PRNG (mulberry32), so random runs are reproducible ----------
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BASE = Date.parse("2026-08-01T08:00:00.000Z");

function slot(id: string, startMin: number, durationMin: number): OverlapSlot {
  return {
    id,
    starts_at: new Date(BASE + startMin * 60000).toISOString(),
    ends_at: new Date(BASE + (startMin + durationMin) * 60000).toISOString(),
  };
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

function sorted(set: Set<string>): string[] {
  return [...set].sort();
}

function randomSlots(rand: () => number, n: number): OverlapSlot[] {
  const out: OverlapSlot[] = [];
  for (let i = 0; i < n; i++) {
    const startMin = Math.floor(rand() * 4000); // spread over ~2.8 days of minutes
    const durationMin = 5 + Math.floor(rand() * 85); // 5..90 min, always positive
    out.push(slot(`r${i}`, startMin, durationMin));
  }
  return out;
}

function main() {
  let allPass = true;
  const rows: { scenario: string; pass: boolean; details: Record<string, unknown> }[] = [];

  // `expected` is a hand-derived blocked-id set (see comments per scenario
  // below): checked against the OLD reference too, so a scenario can't pass
  // by both implementations coincidentally sharing the same bug.
  function run(scenario: string, slots: OverlapSlot[], bufferMs: number, capacity: number, expected?: string[]) {
    const oldBlocked = oldClassifyOverlapBlocks(slots, bufferMs, capacity);
    const newBlocked = classifyOverlapBlocks(slots, bufferMs, capacity);
    const equivalent = setsEqual(oldBlocked, newBlocked);
    const matchesExpected = expected === undefined || setsEqual(oldBlocked, new Set(expected));
    const pass = equivalent && matchesExpected;
    if (!pass) allPass = false;
    rows.push({
      scenario,
      pass,
      details: {
        n: slots.length,
        bufferMs,
        capacity,
        oldBlocked: sorted(oldBlocked),
        newBlocked: sorted(newBlocked),
        expected: expected ? [...expected].sort() : undefined,
        equivalent,
        matchesExpected,
      },
    });
  }

  // --- 5 synthetic slot sets, per the ring brief --------------------------

  // 1. No overlap: evenly spaced slots, gap bigger than the buffer, capacity 1.
  //    Nothing should ever be blocked.
  run(
    "1. no overlap (spaced slots, capacity 1)",
    [slot("a", 0, 30), slot("b", 60, 30), slot("c", 120, 30), slot("d", 180, 30)],
    5 * 60000,
    1,
    [],
  );

  // 2. Full overlap: every slot spans the identical interval, capacity 2.
  //    All 5 must be blocked (each sees 4 concurrent others > capacity).
  run(
    "2. full overlap (identical intervals, capacity 2)",
    [slot("a", 0, 60), slot("b", 0, 60), slot("c", 0, 60), slot("d", 0, 60), slot("e", 0, 60)],
    0,
    2,
    ["a", "b", "c", "d", "e"],
  );

  // 3. Chain overlap: a-b overlap, b-c overlap, but a-c do NOT directly
  //    overlap (classic transitivity trap: the OLD scan is pairwise-direct,
  //    not transitive-closure, so a and c must NOT count each other). At
  //    capacity 2, a and c each see only 1 concurrent neighbor (not
  //    blocked) while b sees 2 (a AND c) and IS blocked, proving the
  //    pairwise-direct semantics carried over exactly, not a transitive merge.
  run(
    "3. chain overlap (a~b~c, a and c don't directly touch), capacity 2",
    [slot("a", 0, 40), slot("b", 30, 40), slot("c", 60, 40)],
    0,
    2,
    ["b"],
  );

  // 4. Touching boundaries: b.starts_at === a.ends_at exactly (zero buffer),
  //    same for c.starts_at === b.ends_at. Per the OLD strict operators
  //    (sStart < slotEndBuffered && sEnd > slotStart), a touching boundary
  //    must NOT count as overlap.
  run(
    "4. touching boundary (b starts exactly when a ends), capacity 1",
    [slot("a", 0, 30), slot("b", 30, 30), slot("c", 60, 30)],
    0,
    1,
    [],
  );

  // 5. Buffer-induced ASYMMETRIC overlap: a's buffer reaches into b's start,
  //    but b's own buffer (added to b's own end, per slot, when b is the
  //    "current" slot) does not reach back into a. Proves the non-symmetric
  //    "only X's own end is buffered" relation is preserved slot-by-slot,
  //    not folded into a symmetric interval merge. Hand-derived: a sees b as
  //    concurrent (a blocked at capacity 1); b does NOT see a as concurrent
  //    (b stays available).
  run(
    "5. buffer-induced asymmetric overlap, capacity 1",
    [slot("a", 0, 30), slot("b", 35, 10)], // a: [0,30), buffered [0,40); b: [35,45)
    10 * 60000, // 10 min buffer applied to whichever slot is "current"
    1,
    ["a"],
  );

  // --- 200 random slots x 20 seeded runs -----------------------------------
  const SEEDS = 20;
  const N = 200;
  let randomAllPass = true;
  for (let seed = 1; seed <= SEEDS; seed++) {
    const rand = mulberry32(seed * 2654435761);
    const slots = randomSlots(rand, N);
    const bufferMs = Math.floor(rand() * 20) * 60000; // 0..19 min buffer
    const capacity = 1 + Math.floor(rand() * 6); // 1..6

    const oldBlocked = oldClassifyOverlapBlocks(slots, bufferMs, capacity);
    const newBlocked = classifyOverlapBlocks(slots, bufferMs, capacity);
    const pass = setsEqual(oldBlocked, newBlocked);
    if (!pass) {
      randomAllPass = false;
      allPass = false;
      rows.push({
        scenario: `random seed ${seed} (n=${N}, bufferMs=${bufferMs}, capacity=${capacity})`,
        pass,
        details: {
          oldCount: oldBlocked.size,
          newCount: newBlocked.size,
          oldOnly: sorted(oldBlocked).filter((id) => !newBlocked.has(id)),
          newOnly: sorted(newBlocked).filter((id) => !oldBlocked.has(id)),
        },
      });
    }
  }
  if (randomAllPass) {
    rows.push({
      scenario: `random equivalence: ${SEEDS} seeds x ${N} slots`,
      pass: true,
      details: { seeds: SEEDS, n: N, note: "all seeds produced identical blocked-id sets, old vs new" },
    });
  }

  console.log("Ring 3b kill test: overlap classification O(n^2) -> O(n log n)\n");
  for (const row of rows) {
    console.log(`[${row.pass ? "PASS" : "FAIL"}] ${row.scenario}`);
    console.log(`       ${JSON.stringify(row.details)}`);
  }

  console.log("");
  console.log(allPass ? "All scenarios passed: old and new classification are identical." : "One or more scenarios FAILED, old and new classification diverged.");
  process.exit(allPass ? 0 : 1);
}

main();
