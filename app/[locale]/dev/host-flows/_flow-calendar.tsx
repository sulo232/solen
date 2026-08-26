"use client";

/**
 * FlowCalendar, flow two of the host-flows batch: a day in the calendar.
 *
 * exists-check: net-new vs app/[locale]/dashboard/calendar/page.tsx and
 * app/[locale]/dev/calendar-agenda/page.tsx, both read in full before a line of this file was
 * written; `npm run exists` returned 0 matches for this shape (see below) and REMOVED.md has no
 * calendar-shaped entry.
 *
 * Grounded-in: app/[locale]/dashboard/calendar/page.tsx (the real, shipped dashboard calendar this
 * flow proposes a successor shape for, specifically its `renderAgenda()` free-slot painting named
 * in the build brief) and app/[locale]/dev/calendar-agenda/page.tsx (the prior-art day-list mockup
 * this file's own day view reuses the treatment of, see below). Both share the "calendar" token
 * with this file and were read before a line of this component was written.
 *
 * registered-component-ok: two registry candidates were read before anything here was hand-drawn,
 * and neither covers this role. `primitives/DateTimePicker.tsx` (V3-D445, "the one date/time
 * primitive") is a JOB mismatch, not a skin mismatch: its `value`/`onChange` picks ONE date for a
 * booking and renders time SLOTS under it, with no concept of a per-date business metric, no
 * "today excluded, links to another tab" behaviour, and its selected state is blue (Layer 2 accent)
 * which TERMINAL_PRINCIPLES section 5 bans outright on this screen class. `dashboard/DashboardUI.
 * tsx`'s `DashPanel` (white rounded-2xl + hairline card) matches this file's box SHAPE but not its
 * governing law: TERMINAL_PRINCIPLES section 9's own comparison table says plainly "No `Dash*`
 * primitive belongs on the terminal. They carry the console's skin: sunken canvas, blue primary,
 * saturated pill text", and this build brief binds the file to TERMINAL_PRINCIPLES, not to the
 * dashboard console. This file's month grid and day-block list are the net-new anatomy
 * TERMINAL_PRINCIPLES exists to let a second operator screen build, not a re-skin of either
 * existing primitive.
 *
 * Full exists-check trail (2026-08-21): `npm run exists "host calendar month grid"`,
 * `"day blocks calendar"` and `"airbnb calendar host"` each returned 0 matches, and
 * `_design-system/REMOVED.md` has no calendar-shaped entry. `app/[locale]/dev/calendar-agenda/
 * page.tsx` already explored a day-list treatment (its "Airbnb way" block: no colour, one anchor
 * sentence, quiet free time, a card only for a booking) and this file follows that same treatment
 * for its own day view rather than inventing a second one; nothing is imported from it because it
 * is page-local to another route, so the pattern is re-expressed here, not duplicated wholesale.
 * Separately, net-new vs the exists-guard's own fuzzy hits on this file's generic vocabulary
 * (salon, month, service, design: lib/salon-of-month.ts, lib/service-templates.ts,
 * lib/verify-salon-client.ts, scripts/check-trust-floor.mjs, app/api/salon-of-month/route.ts,
 * _plans/OWNER_ANSWERS_BATCH.md, _plans/MOBILE_DESIGN_SYSTEM.md, _plans/IG_DESIGN_PRINCIPLES.md);
 * each was read and none is a calendar, a month grid, or a day view.
 *
 * OPERATOR SCREEN. Governed by `_design-system/TERMINAL_PRINCIPLES.md` (per the build brief), not
 * the customer FLOORS LAW: no imagery floor, no required semantic-colour moment, no sunken page
 * canvas. Read `_plans/MOBILE_DASHBOARD_2026-08-21.md`, "The council's verdict", before touching
 * this file, it is settled and this is the build, not a re-decision.
 *
 * THE JOB, one sentence: an owner looks at a month to see which days are busy, taps one that is
 * not today, and sees that day as blocks of time they can block, open or drop an appointment into.
 *
 * THE COUNCIL'S KEY RULE, shown rather than described: the calendar holds every day that is NOT
 * today. Today's cell carries no appointment count at all, it carries a small blue link instead,
 * and tapping it does not open a day view here, because that would be drawing today a second time.
 * This is the one interaction the whole file exists to demonstrate.
 *
 * german-ok: the small blue link's own label, and the two explanatory sentences that describe
 * where it goes, use "Heute" as a PROPER NOUN, the real, already-locked name of the tab it points
 * at (the council's four-tab shape, `_plans/MOBILE_DASHBOARD_2026-08-21.md`), not translated UI
 * copy standing in for the English word "today". The surrounding sentences are English prose, same
 * as the plan doc's own convention of writing English prose with the German tab names left as
 * names, e.g. "Today's cell links across to Heute rather than drawing today a second time." Every
 * render site below carries its own inline `german-ok` marker for the same reason, since this gate
 * checks per line, not per file.
 *
 * THE NUMBER UNDER EVERY DATE IS A COUNT, NOT A PRICE. Airbnb's own host calendar puts a nightly
 * rate under each date because a rental's price is a property of the DAY. A salon's price lives on
 * the service, not the day, a haircut costs the same on a Tuesday as a Saturday, so the one number
 * a day can honestly carry is how many appointments it already holds.
 *
 * FIXTURE DATA, not wired to any table, and not random: a Basel salon with three stylists, Mia,
 * Nina and Jonas, offering Cut / Colour / Beard trim / Blow-dry. `WEEKDAY_COUNT` gives one
 * appointment count per weekday (Sunday closed and quiet, Saturday the busiest) and repeats across
 * every rendered week, which is what "a normal week" looks like stretched over two months: some
 * days busy, some nearly empty, the same shape every week. `DAY_TEMPLATE` lays out one literal
 * 09:00-18:00 Saturday (lunch always blocked, eight booking-eligible slots) and a day's own count
 * fills the first N of those eight in time order, so a quiet day books the morning and a full day
 * books the whole span. "Today" is fixed at Friday 21 August 2026 rather than read from the
 * visitor's clock, so the one thing this file demonstrates does not depend on when it is opened.
 *
 * TYPE, per TERMINAL_PRINCIPLES section 4: 13 is the workhorse (everything ordinary), 15 is the
 * promoted size (a date digit, a booking's service name, a control label), 30 is the one anchor
 * per view, reused verbatim from the terminal's own measured anchor rather than derived fresh,
 * because 30 against this file's 13px workhorse is already the terminal's own vetted 2.31x ratio,
 * comfortably past the >=1.8x floor the same section sets. Three sizes, not four, the ceiling in
 * the build brief is "at most four", not "exactly four". Two weights only, 400 and 600, never a
 * third, so this file does not repeat the terminal's own recorded three-weight breach.
 *
 * emphasis-ok: this is an operator screen (TERMINAL_PRINCIPLES governs, not the customer FLOORS
 * LAW / EMPHASIS BUDGET, which is scoped to customer discovery/PDP/booking screens). The weight-600
 * uses that remain are the date digit in every grid cell (the calendar's actual content, bold in
 * every real calendar app including the one this file is built from), the one 30px anchor sentence,
 * a booking's service name (the row's identity, TERMINAL section 2 rule 5), and three control
 * labels (Block / Open / Add appointment). The two frame captions that carried no real information
 * ("Calendar tab", "Opens when you tap a date") were dropped to font-normal rather than kept bold,
 * which is the actual fix the gate asks for; what is left is emphasis on content, not on chrome.
 *
 * measure-ok: no reference screenshot arrived with this brief, so there is nothing to pixel-sample.
 * "Taken from Airbnb's real host calendar" in the build brief describes STRUCTURE (day letters, a
 * number under every date, months stacking with no paging), not a screenshot with pixel values to
 * match; the brief itself hands over no image and no px/pt table. Every size, gap and radius below
 * is instead grounded in an existing LOCKED value, cited rather than eyeballed: the type ladder and
 * its 1.8x anchor-to-workhorse ratio come from TERMINAL_PRINCIPLES section 4 (its own 30/13 pair,
 * reused verbatim, not re-derived), the 32/16 section gaps and the 20px gutter exception come from
 * its section 3, the pill radius comes from the design contract's "button/chip pill" row, and the
 * card radius (16) and hairline (`border-s-border`) are the same literals
 * `app/[locale]/dev/calendar-agenda/page.tsx` already uses for a booking row.
 *
 * COLOUR: the ONLY chromatic thing in this file is the blue "Heute" link, because it is the ONLY
 * thing on either frame that is actually clickable to somewhere else. Every other date, every
 * booking, every free or blocked line is ink or grey. The selected date's calm gray fill is the
 * locked selected-state token (`bg-s-bg-sunken`), not a colour, per the design contract's
 * selected/active row.
 *
 * CONTAINERS: frame one (the month grid) draws zero, bare numbers on white, matching Airbnb's own
 * calendar which does not box a date either. Frame two draws exactly one boxed KIND, a confirmed
 * booking, because it is the only row carrying three facts a reader must see the edge of (case 2 of
 * the container test); free and blocked runs stay bare single lines on the canvas, per the brief's
 * explicit instruction not to paint free time as a loud row. No instance cap is applied to the
 * booking cards: unlike the terminal's queue, a day's bookings are already-decided facts the
 * screen's whole job is to show, not an unbounded live queue, so capping them would hide the thing
 * the view exists for.
 *
 * PREFLIGHT: `npx tsc --noEmit` and `npx eslint app/[locale]/dev/host-flows/_flow-calendar.tsx`
 * were both run this turn (see the closing report); this file has no test harness of its own since
 * it renders no wired data, so those two are the checks a sandbox can actually run.
 */

import { useState } from "react";
import { ArrowUpRight, Check, Lock, Plus, Unlock } from "lucide-react";

// ---------------------------------------------------------------------------------------------
// Fixture data. See the file header. Nothing below reads a table, a clock or a random source.
// ---------------------------------------------------------------------------------------------

// The three stylists' names, as a union type (not a runtime array: nothing here iterates the
// roster, each fixture row just names who is working it).
type Stylist = "Mia" | "Nina" | "Jonas";

const WEEKDAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];
const WEEKDAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// One appointment count per weekday (Mon..Sun), repeated across every rendered week. A quiet
// Sunday, a slow Monday, climbing to the busiest Saturday, the shape of "a normal week".
const WEEKDAY_COUNT = [3, 4, 6, 4, 7, 8, 0];

// Fixed fixture "today", not read from the visitor's clock (see file header).
const TODAY = { year: 2026, month: 8, day: 21 };

// The two months shown, stacking and scrolling into each other, no paging and no month picker.
const MONTHS = [
  { year: 2026, month: 8 },
  { year: 2026, month: 9 },
];

// Default selected date for frame two on first render: a busy Saturday, close to today, so the
// day view opens already showing a mix of bookings and free time rather than an empty day.
const DEFAULT_SELECTED = { year: 2026, month: 8, day: 22 };

// The real tab name, a proper noun (see the file header's german-ok note). Kept as one constant so
// every render site shares one wording rather than three hand-typed copies.
const TODAY_ARIA_LABEL = "Today. Opens the Heute tab, not a day here."; // german-ok, proper noun

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// 0 = Monday .. 6 = Sunday, converted from JS's 0 = Sunday .. 6 = Saturday.
function weekdayIndexMon(year: number, month: number, day: number): number {
  const js = new Date(year, month - 1, day).getDay();
  return (js + 6) % 7;
}

interface DateCell {
  year: number;
  month: number;
  day: number;
  isToday: boolean;
  count: number;
}

function buildMonth(year: number, month: number): DateCell[] {
  const total = daysInMonth(year, month);
  const cells: DateCell[] = [];
  for (let day = 1; day <= total; day++) {
    const weekday = weekdayIndexMon(year, month, day);
    cells.push({
      year,
      month,
      day,
      isToday: year === TODAY.year && month === TODAY.month && day === TODAY.day,
      count: WEEKDAY_COUNT[weekday],
    });
  }
  return cells;
}

type DayBlock =
  | { kind: "free"; startMin: number; endMin: number }
  | { kind: "blocked"; startMin: number; endMin: number; note: string }
  | { kind: "booking"; startMin: number; endMin: number; stylist: string; service: string };

// One literal 09:00-18:00 day: lunch always blocked, eight booking-eligible slots in time order.
// A day's own count fills the first N of the eight, so a quiet day books only the morning and the
// busiest day (8) fills the whole template exactly, both ends already checked to sum to 540 minutes.
const DAY_TEMPLATE: {
  startMin: number;
  endMin: number;
  kind: "free" | "lunch" | "slot";
  stylist?: Stylist;
  service?: string;
}[] = [
  { startMin: 540, endMin: 570, kind: "free" }, // 09:00-09:30
  { startMin: 570, endMin: 630, kind: "slot", stylist: "Mia", service: "Colour" }, // 09:30-10:30
  { startMin: 630, endMin: 660, kind: "free" }, // 10:30-11:00
  { startMin: 660, endMin: 690, kind: "slot", stylist: "Nina", service: "Cut" }, // 11:00-11:30
  { startMin: 690, endMin: 720, kind: "slot", stylist: "Jonas", service: "Beard trim" }, // 11:30-12:00
  { startMin: 720, endMin: 750, kind: "lunch" }, // 12:00-12:30
  { startMin: 750, endMin: 780, kind: "slot", stylist: "Mia", service: "Cut" }, // 12:30-13:00
  { startMin: 780, endMin: 840, kind: "slot", stylist: "Nina", service: "Colour" }, // 13:00-14:00
  { startMin: 840, endMin: 870, kind: "free" }, // 14:00-14:30
  { startMin: 870, endMin: 900, kind: "slot", stylist: "Jonas", service: "Cut" }, // 14:30-15:00
  { startMin: 900, endMin: 930, kind: "free" }, // 15:00-15:30
  { startMin: 930, endMin: 990, kind: "slot", stylist: "Mia", service: "Colour" }, // 15:30-16:30
  { startMin: 990, endMin: 1020, kind: "slot", stylist: "Nina", service: "Cut" }, // 16:30-17:00
  { startMin: 1020, endMin: 1080, kind: "free" }, // 17:00-18:00
];

function buildDayBlocks(count: number): DayBlock[] {
  let filled = 0;
  const raw: DayBlock[] = DAY_TEMPLATE.map((t) => {
    if (t.kind === "lunch") {
      return { kind: "blocked", startMin: t.startMin, endMin: t.endMin, note: "Lunch" };
    }
    if (t.kind === "slot") {
      if (filled < count) {
        filled += 1;
        return { kind: "booking", startMin: t.startMin, endMin: t.endMin, stylist: t.stylist!, service: t.service! };
      }
      return { kind: "free", startMin: t.startMin, endMin: t.endMin };
    }
    return { kind: "free", startMin: t.startMin, endMin: t.endMin };
  });

  // Merge consecutive free entries into one run so a reverted slot joins its neighbours, the same
  // grouping AfterAgenda / AirbnbWayAgenda apply in app/[locale]/dev/calendar-agenda/page.tsx.
  const merged: DayBlock[] = [];
  for (const block of raw) {
    const prev = merged[merged.length - 1];
    if (block.kind === "free" && prev && prev.kind === "free") {
      prev.endMin = block.endMin;
    } else {
      merged.push({ ...block });
    }
  }
  return merged;
}

function fmt(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function plural(count: number, word: string): string {
  return count === 1 ? word : `${word}s`;
}

// ---------------------------------------------------------------------------------------------

export const FRAMES: { key: string; caption: string }[] = [
  {
    key: "month",
    caption:
      "The month. A number under each day says how many appointments it holds, the way Airbnb puts a price under every date. Today carries a link to the Heute tab instead of a number, because today lives there.",
  },
  {
    key: "day",
    caption:
      "Tap a day and it opens as its own hours: what is booked, what is free, what is blocked. Free time is the point, so it is named, not left blank.",
  },
];

export default function FlowCalendar({ index }: { index: number }) {
  const [selected, setSelected] = useState(DEFAULT_SELECTED);
  const [todayTapped, setTodayTapped] = useState(false);
  const [openRow, setOpenRow] = useState<string | null>(null);
  // Which bookings have been marked arrived, keyed the same way openRow is (String(startMin)), so
  // more than one booking can be arrived at once. A Set, not a boolean per block, because the same
  // key is reused across days (DAY_TEMPLATE is one literal day, see file header), matching the
  // reset openRow already gets below.
  const [arrivedRows, setArrivedRows] = useState<Set<string>>(new Set());

  function onCellTap(cell: DateCell) {
    if (cell.isToday) {
      setTodayTapped(true);
      return;
    }
    setTodayTapped(false);
    setOpenRow(null);
    setArrivedRows(new Set());
    setSelected({ year: cell.year, month: cell.month, day: cell.day });
  }

  const selWeekday = weekdayIndexMon(selected.year, selected.month, selected.day);
  const selCount = WEEKDAY_COUNT[selWeekday];
  const dayBlocks = buildDayBlocks(selCount);
  const freeMinutes = dayBlocks
    .filter((b): b is Extract<DayBlock, { kind: "free" }> => b.kind === "free")
    .reduce((sum, b) => sum + (b.endMin - b.startMin), 0);
  const freeHours = freeMinutes / 60;

  const frame = FRAMES[index] ?? FRAMES[0]!;

  return (
    <div className="relative h-[844px] w-full max-w-[390px] overflow-hidden rounded-[16px] border border-s-border bg-white">
    <div className="h-full overflow-y-auto">
    {frame.key === "month" && (
      <div className="">
        <div className="px-5 pt-4">
          <span className="text-[13px] text-s-ink-2">Calendar tab</span>
        </div>
        <div className="px-5 pb-8 pt-4">
          {MONTHS.map((m) => {
            const cells = buildMonth(m.year, m.month);
            const lead = weekdayIndexMon(m.year, m.month, 1);
            return (
              <div key={`${m.year}-${m.month}`} className="mb-8 last:mb-0">
                <div className="font-heading font-semibold text-[15px] text-s-ink mb-3">
                  {MONTH_NAMES[m.month - 1]} {m.year}
                </div>
                <div className="grid grid-cols-7">
                  {WEEKDAY_LETTERS.map((letter, i) => (
                    <div key={i} className="h-6 flex items-center justify-center text-[13px] text-s-ink-2">
                      {letter}
                    </div>
                  ))}
                  {Array.from({ length: lead }).map((_, i) => (
                    <div key={`lead-${i}`} />
                  ))}
                  {cells.map((cell) => {
                    const isSelected =
                      !cell.isToday &&
                      cell.year === selected.year &&
                      cell.month === selected.month &&
                      cell.day === selected.day;
                    const showTodayRing = cell.isToday && todayTapped;
                    return (
                      <button
                        key={cell.day}
                        type="button"
                        onClick={() => onCellTap(cell)}
                        aria-label={
                          cell.isToday
                            ? TODAY_ARIA_LABEL
                            : `${MONTH_NAMES[cell.month - 1]} ${cell.day}, ${cell.count} ${plural(cell.count, "appointment")}`
                        }
                        className="h-14 flex flex-col items-center justify-center gap-0.5"
                      >
                        <span
                          className={[
                            "flex h-8 w-8 items-center justify-center rounded-full font-heading font-semibold text-[15px] text-s-ink",
                            isSelected || showTodayRing ? "bg-s-bg-sunken" : "",
                          ].join(" ")}
                        >
                          {cell.day}
                        </span>
                        {cell.isToday ? (
                          <span className="flex items-center gap-0.5 text-[13px] font-semibold text-s-accent hover:underline">
                            {"Heute"}{/* german-ok, proper noun: the real tab name, see file header */}
                            <ArrowUpRight size={10} strokeWidth={2.5} aria-hidden />
                          </span>
                        ) : cell.count > 0 ? (
                          <span className="text-[13px] text-s-ink-2 tabular-nums">{cell.count}</span>
                        ) : (
                          <span className="text-[13px] text-transparent select-none" aria-hidden>
                            0
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}

    {frame.key === "day" && (
      <div className="">
        <div className="px-5 pt-4">
          <span className="text-[13px] text-s-ink-2">Opens when you tap a date</span>
        </div>
        <div className="px-5 pb-8 pt-4">
          {todayTapped ? (
            <div className="pt-8 text-center">
              <div className="font-heading font-semibold text-[15px] text-s-ink">
                {"Today opens on Heute"}{/* german-ok, proper noun: the real tab name */}
              </div>
              <div className="mt-2 text-[13px] leading-relaxed text-s-ink-2">
                {"The calendar holds every day that is not today. Today is not drawn here a "
                  + "second time, it lives on the Heute tab instead."}{/* german-ok, proper noun */}
              </div>
            </div>
          ) : (
            <>
              <div className="text-[13px] text-s-ink-2">
                {WEEKDAY_NAMES[selWeekday]}, {MONTH_NAMES[selected.month - 1]} {selected.day}
              </div>
              <div className="font-heading font-semibold text-[30px] leading-tight text-s-ink mt-1">
                {selCount} {plural(selCount, "appointment")} today
              </div>
              <div className="text-[13px] text-s-ink-2 mt-1">{freeHours} hours still open</div>

              <div className="mt-4 flex flex-col gap-3">
                {dayBlocks.map((block) => {
                  const key = String(block.startMin);

                  if (block.kind === "booking") {
                    // A booking used to be the one row in this list nothing could be done with:
                    // FREE and BLOCKED both toggle openRow and reveal an action pill, this row was a
                    // plain div. That was the actual gap, the row holding a real person had no tap.
                    // Same grammar as its neighbours below: tap opens it, one pill, no menu.
                    const open = openRow === key;
                    const arrived = arrivedRows.has(key);
                    return (
                      <div key={key} className="rounded-[16px] border border-s-border bg-white px-3 py-3">
                        <button
                          type="button"
                          onClick={() => setOpenRow(open ? null : key)}
                          aria-label={`${block.service}, ${block.stylist}, ${fmt(block.startMin)} to ${fmt(block.endMin)}`}
                          className="block w-full text-left"
                        >
                          <div className="text-[13px] text-s-ink-2 tabular-nums">
                            {fmt(block.startMin)} to {fmt(block.endMin)}
                          </div>
                          <div className="font-heading font-semibold text-[15px] text-s-ink mt-0.5">
                            {block.service}
                          </div>
                          <div className="text-[13px] text-s-ink-2 mt-0.5">{block.stylist}</div>
                        </button>
                        {open && (
                          arrived ? (
                            <div className="mt-2 flex items-center gap-1.5 text-[13px] text-s-ink-2">
                              <Check size={14} strokeWidth={2.2} aria-hidden />
                              Arrived
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setArrivedRows((prev) => new Set(prev).add(key))}
                              className="mt-2 flex h-11 items-center gap-2 rounded-full border border-s-border px-3 text-[13px] font-semibold text-s-ink"
                            >
                              <Check size={14} strokeWidth={2.2} aria-hidden />
                              They showed up
                            </button>
                          )
                        )}
                      </div>
                    );
                  }

                  if (block.kind === "blocked") {
                    const open = openRow === key;
                    return (
                      <div key={key}>
                        <button
                          type="button"
                          onClick={() => setOpenRow(open ? null : key)}
                          className="w-full py-1 text-left text-[13px] text-s-ink-2 line-through"
                        >
                          <span className="tabular-nums">
                            {fmt(block.startMin)} to {fmt(block.endMin)}
                          </span>{" "}
                          blocked, {block.note}
                        </button>
                        {open && (
                          <button
                            type="button"
                            className="mt-1 flex h-11 items-center gap-2 rounded-full border border-s-border px-3 text-[13px] font-semibold text-s-ink"
                          >
                            <Unlock size={14} strokeWidth={2.2} aria-hidden />
                            Open this time
                          </button>
                        )}
                      </div>
                    );
                  }

                  // free
                  const open = openRow === key;
                  const slots = Math.round((block.endMin - block.startMin) / 30);
                  return (
                    <div key={key}>
                      <button
                        type="button"
                        onClick={() => setOpenRow(open ? null : key)}
                        className="w-full py-1 text-left text-[13px] text-s-ink-2"
                      >
                        <span className="tabular-nums">
                          {fmt(block.startMin)} to {fmt(block.endMin)}
                        </span>{" "}
                        open, {slots} {plural(slots, "slot")}
                      </button>
                      {open && (
                        <div className="mt-1 flex gap-2">
                          <button
                            type="button"
                            className="flex h-11 items-center gap-2 rounded-full border border-s-border px-3 text-[13px] font-semibold text-s-ink"
                          >
                            <Lock size={14} strokeWidth={2.2} aria-hidden />
                            Block
                          </button>
                          <button
                            type="button"
                            className="flex h-11 items-center gap-2 rounded-full border border-s-border px-3 text-[13px] font-semibold text-s-ink"
                          >
                            <Plus size={14} strokeWidth={2.2} aria-hidden />
                            Add appointment
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    )}
    </div>
    </div>
  );
}
