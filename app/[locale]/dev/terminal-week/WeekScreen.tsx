"use client";

// Mockup-scope: whole-page
//
// exists-check: npm run exists "week calendar" and npm run exists "day grid" both returned 0
// matches (run 2026-08-18). Net new.
//
// Grounded-in: app/[locale]/dev/terminal/Screen.tsx (the row grammar this file's block/label
// sizes copy: name 15/normal, meta 13/normal-ink-2, section label 13/semibold-ink-2, the LAYOUT
// gap ladder of 32/16, and the "name leads by SIZE not weight" correction already made there) and
// app/[locale]/dev/terminal/status.ts (read, not imported: no block on this page needs a live
// status tone, see the file-header note below for why).
//
// Operator screen. Governed by TASTE_LOG 2026-07-15 (Round D1) plus TERMINAL_PRINCIPLES.md. The
// customer FLOORS LAW does not apply here: no imagery floor, no required semantic-colour moment,
// no sunken tray as a page canvas.
//
// THE JOB, one sentence: a person running the counter looks at this page to see, for any day this
// week, which stylist has which chair time and, just as importantly, which stretches are open,
// so a phone call can be answered with a real time instead of "let me check the book."
//
// WHY A GRID (see the brief this file was built from, and _plans/MERCHANT_TERMINAL_2026-08-15.md
// R21-6): a time-ordered LIST only ever shows things that exist. A gap has no row, so free time is
// invisible on the live board today. A grid draws duration as block height and free time as bare
// canvas, for free, which a list structurally cannot do.
//
// COLOUR: this page renders no status.ts tone anywhere. Every distinction on it (a booked
// appointment vs a walk-in vs a break vs open time) is carried by WORDS and by a flat sunken fill
// vs a hairline border, never by a new hue. That is what "reuse status.ts, never mint a new colour
// meaning" resolves to when the screen has nothing that needs a "does this need me, how soon"
// signal: this is a look-ahead proposal board, not a live queue.
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

export interface WeekBooking {
  id: string;
  startsAt: string;
  customerName: string;
  serviceName: string;
  durationMinutes: number;
  staffId: string | null;
}

export interface WeekWalkIn {
  id: string;
  customerName: string;
  serviceName: string;
  startedAt: string;
  durationMinutes: number;
  staffId: string;
}

export interface WeekStaffMember {
  id: string;
  name: string;
}

interface WeekScreenProps {
  salonName: string;
  staff: WeekStaffMember[];
  bookings: WeekBooking[];
  walkIns: WeekWalkIn[];
  /** Zurich calendar date, yyyy-mm-dd, of "today" at load time. */
  todayStr: string;
}

// ── THE GRID'S OWN COORDINATE SYSTEM ────────────────────────────────────────────────────────
// 08:00 to 19:00, per the brief. 11 hours.
const GRID_START_HOUR = 8;
const GRID_END_HOUR = 19;
const GRID_START_MIN = GRID_START_HOUR * 60;
const GRID_END_MIN = GRID_END_HOUR * 60;

// 1px per minute (60px per hour). Picked over a smaller ratio so duration keeps reading as height
// even at the small end: this shop's shortest real service today is Eyebrows at 10 minutes, which
// still draws a visible 10px sliver next to the 60-minute Full Package's 60px block. At 60px/hour
// the math is also the simplest possible: a block's top and height are its own start-minute and
// duration-minute, no separate scale factor to carry around or get wrong.
const PX_PER_MIN = 1;
const GRID_TOTAL_PX = (GRID_END_MIN - GRID_START_MIN) * PX_PER_MIN; // 660

// Row content width at 390 is 350px (Screen.tsx:68, px-5 gutters). "12:48" at 13px measures 33px,
// so 40 leaves a few px of air around it.
const GUTTER_W = 40;
const COLS_W = 310; // 350 - 40
const COL_W = COLS_W / 3; // 103.33, matches the brief's "103px each"

// SCROLL_VIEWPORT_H: shows 08:00 through 15:00, 7 hours, with no scroll at all. That stretch is
// not arbitrary: today's real bookings start at 12:48, so the default view already contains the
// morning setup AND the first appointments without anyone touching the screen. The remaining 4
// hours (15:00-19:00) are one scroll away INSIDE this box; the page around it does not move.
const SCROLL_VIEWPORT_H = 7 * 60 * PX_PER_MIN; // 420

// A free stretch shorter than this reads as a seam between two bookings, not an offer. Below it,
// no tap target is drawn (there would be nothing meaningful to book into it anyway).
const MIN_TAPPABLE_GAP_MIN = 20;

const ZURICH_DATE_FMT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Zurich",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const ZURICH_TIME_PARTS_FMT = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Zurich",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const ZURICH_WEEKDAY_FMT = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Zurich", weekday: "short" });
const ZURICH_LONG_DAY_FMT = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Zurich",
  weekday: "long",
  day: "numeric",
  month: "long",
});

function zurichDateStrOf(iso: string): string {
  return ZURICH_DATE_FMT.format(new Date(iso));
}

function zurichMinutesSinceMidnight(iso: string): number {
  const parts = ZURICH_TIME_PARTS_FMT.formatToParts(new Date(iso));
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return h * 60 + m;
}

function formatHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function dayNumOf(dateStr: string): string {
  return String(Number(dateStr.split("-")[2]));
}

function zurichAnchorDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  // Noon UTC, so a Zurich +1/+2 offset never pushes the formatted weekday/day into the next or
  // previous calendar date.
  return new Date(Date.UTC(y, m - 1, d, 12));
}

function topPx(min: number): number {
  return (min - GRID_START_MIN) * PX_PER_MIN;
}

function heightPx(startMin: number, endMin: number): number {
  const s = Math.max(GRID_START_MIN, startMin);
  const e = Math.min(GRID_END_MIN, endMin);
  return Math.max(0, (e - s) * PX_PER_MIN);
}

type BlockKind = "appointment" | "walkin" | "break";

interface GridBlock {
  key: string;
  kind: BlockKind;
  startMin: number;
  endMin: number;
  title: string;
  sub: string;
}

interface FreeGap {
  startMin: number;
  endMin: number;
}

const BLOCK_BASE = "absolute overflow-hidden rounded-lg px-1.5 py-0.5 leading-tight";
// boxed-ok: an appointment/walk-in block is an INDIVIDUAL bordered card at its own grid position,
// exactly one card per real event (brief section C: "an appointment: white, hairline edge"). The
// hour lines elsewhere in this grid are timeline ticks, not list-row dividers around a group of
// peers, so this is not the "container plus per-row hairline" doubled-chrome pattern the gate
// targets, it is the individual-entity-card grammar the same law asks for.
const BLOCK_CARD = BLOCK_BASE + " border border-s-border bg-white";
// A flat sunken fill, no border, no customer name ever: this draws TIME THAT IS NOT A BOOKING, so
// it has to read as structurally different from a real appointment at a glance, per the brief.
const BLOCK_BREAK = BLOCK_BASE + " bg-s-bg-sunken";

export default function WeekScreen({ salonName, staff, bookings, walkIns, todayStr }: WeekScreenProps) {
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [tapNote, setTapNote] = useState<string | null>(null);

  const isToday = selectedDate === todayStr;

  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const dateStr = addDays(todayStr, i);
        const count = bookings.filter((b) => zurichDateStrOf(b.startsAt) === dateStr).length;
        return {
          dateStr,
          count,
          weekday: ZURICH_WEEKDAY_FMT.format(zurichAnchorDate(dateStr)),
          dayNum: dayNumOf(dateStr),
        };
      }),
    [todayStr, bookings],
  );

  // The two "not a booking" examples are named by stylist so they land on real people without
  // needing an invented staff id. Neither table exists yet (see the footer), so these are the
  // ONE or TWO hardcoded blocks the brief asks for, and nothing else on this page is invented.
  const lunchStaffId = staff.find((s) => s.name === "Mia")?.id ?? null;
  const goneStaffId = staff.find((s) => s.name === "Nina")?.id ?? null;

  function blocksForStaff(staffId: string): GridBlock[] {
    const list: GridBlock[] = [];

    for (const b of bookings) {
      if (b.staffId !== staffId) continue;
      if (zurichDateStrOf(b.startsAt) !== selectedDate) continue;
      const startMin = zurichMinutesSinceMidnight(b.startsAt);
      const endMin = startMin + b.durationMinutes;
      if (startMin >= GRID_END_MIN || endMin <= GRID_START_MIN) continue; // outside 08:00-19:00
      list.push({ key: `appt-${b.id}`, kind: "appointment", startMin, endMin, title: b.customerName, sub: b.serviceName });
    }

    // The one wired "walk-in currently in a chair" case: only ever shown on TODAY, because a
    // walk-in has no booked time and only exists once it has actually joined.
    if (isToday) {
      for (const w of walkIns) {
        if (w.staffId !== staffId) continue;
        const startMin = zurichMinutesSinceMidnight(w.startedAt);
        const endMin = startMin + w.durationMinutes;
        if (startMin >= GRID_END_MIN || endMin <= GRID_START_MIN) continue;
        list.push({
          key: `walkin-${w.id}`,
          kind: "walkin",
          startMin,
          endMin,
          title: w.customerName,
          sub: `Walk-in, ${w.serviceName}`,
        });
      }
    }

    // HARDCODED, no table yet (footer names this). Every day, so the concept reads the same
    // regardless of which day is selected; real bookings on this salon never fall inside it.
    if (lunchStaffId && staffId === lunchStaffId) {
      list.push({ key: "example-lunch", kind: "break", startMin: 12 * 60, endMin: 12 * 60 + 30, title: "Lunch", sub: "" });
    }
    // HARDCODED, no table yet. Restricted to non-today so it never sits under Nina's real
    // afternoon bookings on today's actual seed data.
    if (goneStaffId && staffId === goneStaffId && !isToday) {
      list.push({ key: "example-gone", kind: "break", startMin: 15 * 60, endMin: GRID_END_MIN, title: "Gone for the day", sub: "" });
    }

    return list.sort((a, b) => a.startMin - b.startMin);
  }

  function freeGapsFor(blocks: GridBlock[]): FreeGap[] {
    const occupied = blocks
      .map((b): [number, number] => [Math.max(GRID_START_MIN, b.startMin), Math.min(GRID_END_MIN, b.endMin)])
      .filter(([s, e]) => e > s)
      .sort((a, b) => a[0] - b[0]);

    const gaps: FreeGap[] = [];
    let cursor = GRID_START_MIN;
    for (const [s, e] of occupied) {
      if (s > cursor) gaps.push({ startMin: cursor, endMin: s });
      cursor = Math.max(cursor, e);
    }
    if (cursor < GRID_END_MIN) gaps.push({ startMin: cursor, endMin: GRID_END_MIN });

    return gaps.filter((g) => g.endMin - g.startMin >= MIN_TAPPABLE_GAP_MIN);
  }

  const hours = useMemo(() => {
    const list: number[] = [];
    for (let h = GRID_START_HOUR; h <= GRID_END_HOUR; h++) list.push(h);
    return list;
  }, []);

  const totalWeekCount = bookings.length;

  return (
    <div className="min-h-dvh bg-white">
      <div className="px-5 pt-8">
        <h1 className="font-heading text-[30px] font-semibold leading-[1.1] text-s-ink">
          {totalWeekCount} appointments across the week
        </h1>
        <p className="font-body mt-1 text-[13px] font-normal text-s-ink-2">
          {salonName}, {staff.length} stylists. Tap a day to see who is booked, and what is still open.
        </p>
      </div>

      {/* A. WEEK STRIP. Today first, 7 days, one number per day: how many appointments. */}
      <div className="mt-8 px-5">
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day) => {
            const selected = day.dateStr === selectedDate;
            return (
              <button
                key={day.dateStr}
                type="button"
                onClick={() => {
                  setSelectedDate(day.dateStr);
                  setTapNote(null);
                }}
                className={"flex flex-col items-center gap-0.5 rounded-xl py-3 " + (selected ? "bg-s-bg-sunken" : "bg-white")}
              >
                <span className={"font-body text-[13px] " + (selected ? "font-semibold text-s-ink" : "font-normal text-s-ink-2")}>
                  {day.weekday}
                </span>
                <span className={"font-body text-[15px] " + (selected ? "font-semibold text-s-ink" : "font-normal text-s-ink")}>
                  {day.dayNum}
                </span>
                <span
                  className={
                    "font-body tabular-nums text-[13px] " + (selected ? "font-semibold text-s-ink" : "font-normal text-s-ink-2")
                  }
                >
                  {day.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* B + C + D. DAY GRID: a time gutter, one column per stylist, blocks by start+duration, a
          tap target on the empty space between them. */}
      <div className="mt-8 px-5">
        <p className="font-body text-[13px] font-semibold text-s-ink-2">{ZURICH_LONG_DAY_FMT.format(zurichAnchorDate(selectedDate))}</p>

        {tapNote && <p className="font-body mt-2 text-[13px] font-normal text-s-ink-2">{tapNote}</p>}

        <div className="mt-3 flex" style={{ width: GUTTER_W + COLS_W }}>
          <div style={{ width: GUTTER_W, flexShrink: 0 }} />
          {staff.map((member) => (
            <div
              key={member.id}
              className="font-body truncate text-center text-[13px] font-semibold text-s-ink"
              style={{ width: COL_W, flexShrink: 0 }}
            >
              {member.name}
            </div>
          ))}
        </div>

        {/* The grid scrolls inside this box. The page around it does not. */}
        <div
          className="relative mt-2 overflow-y-auto overscroll-contain border-t border-s-border"
          style={{ height: SCROLL_VIEWPORT_H, width: GUTTER_W + COLS_W }}
        >
          <div className="relative" style={{ height: GRID_TOTAL_PX }}>
            {hours.map((h) => (
              <div key={h} className="absolute left-0 right-0 border-t border-s-border" style={{ top: topPx(h * 60) }}>
                <span
                  className="font-body absolute -top-[7px] left-0 bg-white pr-1 text-[13px] font-normal tabular-nums text-s-ink-2"
                  style={{ width: GUTTER_W }}
                >
                  {String(h).padStart(2, "0")}:00
                </span>
              </div>
            ))}

            {staff.map((_, i) =>
              i === 0 ? null : (
                <div
                  key={"sep-" + i}
                  className="absolute bottom-0 top-0 border-l border-s-border"
                  style={{ left: GUTTER_W + i * COL_W }}
                />
              ),
            )}

            {staff.map((member, i) => {
              const blocks = blocksForStaff(member.id);
              const gaps = freeGapsFor(blocks);
              const left = GUTTER_W + i * COL_W;
              return (
                <div key={member.id}>
                  {gaps.map((gap, gi) => (
                    <button
                      key={"gap-" + member.id + "-" + gi}
                      type="button"
                      aria-label={`Start a booking with ${member.name} at ${formatHHMM(gap.startMin)}`}
                      onClick={() => setTapNote(`Would start a booking with ${member.name} at ${formatHHMM(gap.startMin)}.`)}
                      className="group absolute flex items-center justify-center"
                      style={{ left, width: COL_W, top: topPx(gap.startMin), height: heightPx(gap.startMin, gap.endMin) }}
                    >
                      <Plus size={14} strokeWidth={1.75} className="text-s-ink-2 opacity-40 transition-opacity group-hover:opacity-70" />
                    </button>
                  ))}

                  {blocks.map((block) => (
                    <div
                      key={block.key}
                      className={block.kind === "break" ? BLOCK_BREAK : BLOCK_CARD}
                      style={{
                        left: left + 2,
                        width: COL_W - 4,
                        top: topPx(block.startMin),
                        height: heightPx(block.startMin, block.endMin),
                      }}
                    >
                      {block.kind === "break" ? (
                        <p className="font-body truncate text-[13px] font-normal text-s-ink-2">{block.title}</p>
                      ) : (
                        <>
                          <p className="font-body truncate text-[15px] font-normal text-s-ink">{block.title}</p>
                          <p className="font-body truncate text-[13px] font-normal text-s-ink-2">{block.sub}</p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* E. Footer: what is not wired. */}
      <div className="mt-8 px-5 pb-10">
        <p className="font-body text-[13px] font-normal text-s-ink-2">
          Not wired yet: the Lunch and Gone for the day blocks are hardcoded examples, there is no
          time-off table yet. Tapping empty space shows what it would do and does not start a real
          booking. Real bookings do drive the week strip&apos;s counts and the appointment blocks
          above. One real booking today (19:23) starts after this grid&apos;s 19:00 cutoff and is
          counted in the week strip but does not draw a block below.
        </p>
      </div>
    </div>
  );
}
