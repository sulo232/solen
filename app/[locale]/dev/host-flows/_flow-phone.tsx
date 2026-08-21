// exists-check: `npm run exists phone booking` / `npm run exists terminal` run this turn
// (2026-08-21). Every hit traces to the SAME family: app/[locale]/dev/terminal/Screen.tsx (the
// working phone-booking sheet, day pills, quarter-hour pills, staff/service pills, the
// /api/dev/terminal write route) and its siblings Terminal.tsx, StaffChip.tsx, loadTerminalData.ts,
// status.ts, prototype.ts. Nothing under app/[locale]/dev/host-flows existed before this file. This
// is FLOW THREE of a four-flow fan-out reviewing the mobile-dashboard redesign in
// _plans/MOBILE_DASHBOARD_2026-08-21.md ("The council's verdict"); the other three flows live in
// sibling files this build does not touch.
//
// Grounded-in: app/[locale]/dev/terminal/Screen.tsx
// Grounded-in: app/[locale]/dev/terminal/loadTerminalData.ts
// Grounded-in: app/[locale]/dev/terminal/prototype.ts
//
// SCREEN CLASS: operator screen. Governed by TASTE_LOG 2026-07-15 (Round D1) and
// _design-system/TERMINAL_PRINCIPLES.md, not the customer FLOORS LAW: no imagery floor, no required
// semantic-colour moment, no sunken-tray canvas. White canvas, bare rows, one ink commit at a time,
// at most 4 text sizes and 2 weights, colour only where it carries meaning.
//
// THE JOB, one sentence: the counter answers a call from a client already on the books, finds her
// in three taps instead of typing her from scratch, and writes her cut into next Wednesday without
// leaving the same phone-booking sheet the terminal already saves through.
//
// GROUNDED IN Screen.tsx, NOT INVENTED. Every row/pill/input/CTA class string below is copied
// verbatim from that file's local constants (ROW, ROW_NAME, ROW_SUB, ROW_TIME, the day-pill and
// time-pill button classes, the two text inputs, the "Booking on the phone" heading, the
// bg-s-ink/110px salon band, the h-11 w-11 icon-button). They are re-declared here rather than
// imported because Screen.tsx does not export them. The day and quarter-hour grammar, the staff and
// service pills, the 24-hour time format, and the save action ("Put it in the book", posting
// through the same /api/dev/terminal route action:"phone_booking") are the real ones; nothing about
// the sheet itself is redesigned here.
//
// WHAT IS ACTUALLY NEW (the two things the council added that the real sheet does not do yet):
//   1. The Add action is pre-filled by where the counter is standing: the Calendar tab's viewed
//      day, not the Today tab's "now". Frame 2.
//   2. Existing clients are looked up BEFORE a new name is typed. Today's real sheet only surfaces
//      a match after two letters are typed into the Name field (Screen.tsx around line 1385); this
//      proposes the same known-customer list, same pill grammar, surfaced first, on open. Frame 3.
//
// FIXTURE DATA, not live: The Fade Factory, Basel (the terminal's own fallback salon name in
// loadTerminalData.ts line 140, extended with the city the brief names) is a coiffeur with three
// stylists, Mia, Nina and Jonas, none of whom exist in any seed table. The caller, Lara Widmer, is
// one of the eight names already used as this exact terminal's scripted-arrival fixture list
// (prototype.ts ARRIVAL_NAMES), reused here rather than inventing a ninth identity. The call lands
// Wednesday 19 August at 14:12 asking for a cut the following Wednesday, 26 August; both dates are
// computed below from a fixed fixture anchor, never from the real clock, so this reads the same on
// any day it is opened. The booked service, "Cut, 30m", has no price: TerminalService
// (loadTerminalData.ts lines 113-117) carries only id, name and minutes, no price field, so Frame
// 5's saved row omits a CHF figure rather than inventing one. TerminalBooking does not carry a
// phone number against a saved customer either, which is why Frame 4 fills the caller's name from
// the lookup but still asks for her number: the real system does not save one against a name today,
// and this flow does not pretend it does.
//
// FIVE FRAMES, ONE SHEET. These are not five screens. The real phone-booking sheet is a single
// scrolling bottom sheet; the frames below are snapshots of that one sheet at five moments as it
// fills in, read top to bottom like a strip, never a wizard with five separate steps.

import { Plus } from "lucide-react";
import { Avatar } from "@/app/[locale]/_components/primitives";

// ---------------------------------------------------------------------------------------------
// Copied verbatim from Screen.tsx's local (unexported) row and pill grammar, so this flow renders
// with the identical anatomy the real sheet already ships. See the header note above.
// ---------------------------------------------------------------------------------------------
const ROW = "flex items-center gap-3 border-t border-s-border px-5 py-4 first:border-t-0";
const ROW_NAME = "font-body mt-0.5 truncate text-[15px] font-normal text-s-ink";
const ROW_SUB = "font-body mt-0.5 truncate text-[13px] font-normal text-s-ink-2";
const ROW_TIME = "font-body text-[13px] font-normal tabular-nums text-s-ink-2";
const INPUT_CLS =
  "font-body h-12 w-full rounded-xl bg-s-bg-sunken px-4 text-[15px] font-normal text-s-ink placeholder:text-s-ink-2";
const PILL_BASE = "font-body flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-[13px]";
const PILL_ON = "border-s-ink bg-s-bg-sunken font-semibold text-s-ink";
const PILL_OFF = "border-s-border bg-white font-normal text-s-ink-2";
const CTA =
  "font-body flex h-12 w-full items-center justify-center rounded-full bg-s-ink text-[15px] font-semibold text-white";
// The icon-button size is the LOCKED spec (LOCKFILE, icon-button row: h-11 w-11), reused for the
// Add action that does not exist as code yet, so it starts from the one locked size rather than a
// guessed one.
const ICON_BUTTON = "flex h-11 w-11 items-center justify-center rounded-full bg-s-ink text-white";
const STEP_LABEL = "font-body px-1 text-[13px] font-semibold text-s-ink-2";
const STEP_NOTE = "font-body px-1 pt-1 text-[13px] font-normal text-s-ink-2";
const NO_SCROLLBAR = "no-scrollbar flex gap-2 overflow-x-auto px-5";

// ---------------------------------------------------------------------------------------------
// The same day and time math Screen.tsx uses (addDays via UTC, weekday-short plus day-number
// labels, quarter hours 08:00 to 19:00), reimplemented locally because Screen.tsx does not export
// it and because a fixture flow must not depend on the real Date.now() to stay readable on any date
// it is opened. FIXTURE_TODAY is a Wednesday chosen only so the weekday labels compute correctly.
// ---------------------------------------------------------------------------------------------
const FIXTURE_TODAY = "2026-08-19"; // Wednesday, the fixture's own "today", not the real clock
const WEEKDAY_FMT = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Zurich", weekday: "short" });

function addDaysFixture(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function dayLabel(dateStr: string): string {
  if (dateStr === FIXTURE_TODAY) return "Today";
  if (dateStr === addDaysFixture(FIXTURE_TODAY, 1)) return "Tomorrow";
  const [y, m, d] = dateStr.split("-").map(Number);
  const noon = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return `${WEEKDAY_FMT.format(noon)} ${d}`;
}

// Fourteen pills, today plus the next thirteen, the same window Screen.tsx's dayOptions() builds.
const DAY_PILLS = Array.from({ length: 14 }, (_, i) => addDaysFixture(FIXTURE_TODAY, i));
const TARGET_DAY = addDaysFixture(FIXTURE_TODAY, 7); // next Wednesday, position 7 in that window

// Quarter hours 08:00 to 19:00, the same set ALL_TIME_SLOTS builds in Screen.tsx.
const TIME_PILLS: { hour: number; minute: number }[] = (() => {
  const slots: { hour: number; minute: number }[] = [];
  for (let h = 8; h <= 19; h++) {
    for (const m of [0, 15, 30, 45]) {
      if (h === 19 && m > 0) break;
      slots.push({ hour: h, minute: m });
    }
  }
  return slots;
})();
const TARGET_TIME = { hour: 10, minute: 30 };

function timeLabel(t: { hour: number; minute: number }): string {
  // 24 hour, always. A Swiss shop reading "06:00 PM" was a defect fixed 2026-08-18; this format
  // string cannot produce that.
  return `${String(t.hour).padStart(2, "0")}:${String(t.minute).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------------------------
// Fixture people. Stylists per the brief; the caller and her fellow known clients are reused from
// prototype.ts's own ARRIVAL_NAMES list rather than invented, since that list already exists as
// this exact terminal's fixture customer roster.
// ---------------------------------------------------------------------------------------------
const SALON_NAME = "The Fade Factory";
const STAFF = [
  { id: "mia", name: "Mia Fischer" },
  { id: "nina", name: "Nina Herzog" },
  { id: "jonas", name: "Jonas Bruderer" },
];
const CALLER = "Lara Widmer";
const KNOWN_CLIENTS = ["Lara Widmer", "Elias Meier", "Sina Baumann", "Noah Frei"];
const SERVICE_NAME = "Cut, 30m";
const CHOSEN_STAFF = "mia";

function Frame({
  step,
  title,
  note,
  children,
}: {
  step: number;
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[390px]">
      <p className={STEP_LABEL}>
        Step {step}. {title}
      </p>
      <p className={STEP_NOTE}>{note}</p>
      <div className="mt-3 overflow-hidden rounded-[20px] border border-s-border bg-white">{children}</div>
    </div>
  );
}

export default function FlowPhone() {
  return (
    <div className="min-h-[100dvh] w-full bg-white px-4 py-10">
      <div className="mx-auto w-full max-w-[390px]">
        <p className="font-heading text-[30px] font-semibold leading-tight text-s-ink">
          Taking a booking by phone
        </p>
        <p className="font-body mt-2 text-[13px] font-normal text-s-ink-2">
          One continuous sheet, five moments as it fills in. Not five screens: the sheet the
          terminal already saves through stays open the whole time.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-8">
        {/* Step 1: the call, on the Today tab. Chrome only, copied from the real bg-s-ink band at
            110px (Screen.tsx line 798), no invented "ringing" widget. */}
        <Frame
          step={1}
          title="The call comes in"
          note="Wed 19, 14:12. Lara Widmer calls: a cut, next week. The counter is looking at Today."
        >
          <div className="flex h-[110px] items-center justify-center bg-s-ink px-4">
            <span className="font-heading truncate text-[18px] font-semibold text-white">{SALON_NAME}</span>
          </div>
          <div className="px-5 py-4">
            <p className="font-body text-[13px] font-normal text-s-ink-2">Basel. Today.</p>
          </div>
        </Frame>

        {/* Step 2: the Calendar tab, pre-filled by where the counter is standing. First of the two
            things the council added over what the real sheet does today. */}
        <Frame
          step={2}
          title="Calendar, the day being looked at"
          note="The cut is for next week, not today, so the counter opens Calendar and taps Wed 26."
        >
          <div className="flex items-center justify-between px-5 py-4">
            <p className="font-body text-[13px] font-semibold text-s-ink-2">Calendar</p>
            <button type="button" aria-label="Add" tabIndex={-1} className={ICON_BUTTON}>
              <Plus size={18} strokeWidth={2.2} aria-hidden />
            </button>
          </div>
          <div className={NO_SCROLLBAR + " pb-4"}>
            {DAY_PILLS.slice(5, 10).map((d) => (
              <span key={d} className={PILL_BASE + " " + (d === TARGET_DAY ? PILL_ON : PILL_OFF)}>
                {dayLabel(d)}
              </span>
            ))}
          </div>
          <div className="px-5 pb-4">
            <p className="font-body text-[13px] font-normal text-s-ink-2">
              Add opens already set to Wed 26, because that is the day on screen. The same button on
              Today opens a walk in for right now instead.
            </p>
          </div>
        </Frame>

        {/* Step 3: the caller looked up before a new name is typed. Second of the two things the
            council added; today's real sheet only surfaces a match after two letters are typed. */}
        <Frame
          step={3}
          title="Is this someone we know?"
          note="Existing clients are the common case, so the sheet asks this before it asks for a new name."
        >
          <div className="px-5 pt-5">
            <p className="font-heading text-[18px] font-semibold text-s-ink">Booking on the phone</p>
          </div>
          <div className={NO_SCROLLBAR + " mt-3"}>
            {KNOWN_CLIENTS.map((n) => (
              <span key={n} className={PILL_BASE + " " + (n === CALLER ? PILL_ON : PILL_OFF)}>
                {n}
              </span>
            ))}
          </div>
          <div className="px-5 pb-5 pt-3">
            <p className="font-body text-[13px] font-normal text-s-ink-2">
              Selecting Lara fills her name. Not a match? Type a new caller below.
            </p>
            <input readOnly value={CALLER} placeholder="Name" className={INPUT_CLS + " mt-2"} />
            <input
              readOnly
              value=""
              placeholder="Phone number"
              inputMode="tel"
              className={INPUT_CLS + " mt-2"}
            />
          </div>
        </Frame>

        {/* Step 4: the rest of the same sheet, same grammar as Screen.tsx: staff, service, day (kept
            from Step 2), quarter-hour time. */}
        <Frame
          step={4}
          title="Stylist, service, day and time"
          note="Same pills the sheet has today. Day is already Wed 26; time is quarter hours, 24 hour."
        >
          <div className={NO_SCROLLBAR + " pt-5"}>
            {STAFF.map((m) => (
              <span
                key={m.id}
                className={PILL_BASE + " " + (m.id === CHOSEN_STAFF ? PILL_ON : PILL_OFF)}
              >
                <Avatar src={null} name={m.name} size={24} />
                {m.name.split(" ")[0]}
              </span>
            ))}
          </div>
          <div className={NO_SCROLLBAR + " mt-2"}>
            <span className={PILL_BASE + " " + PILL_ON}>{SERVICE_NAME}</span>
            <span className={PILL_BASE + " " + PILL_OFF}>Colour, 90m</span>
          </div>
          <div className={NO_SCROLLBAR + " mt-2"}>
            {DAY_PILLS.slice(5, 10).map((d) => (
              <span key={d} className={PILL_BASE + " " + (d === TARGET_DAY ? PILL_ON : PILL_OFF)}>
                {dayLabel(d)}
              </span>
            ))}
          </div>
          <div className={NO_SCROLLBAR + " mb-5 mt-2"}>
            {TIME_PILLS.slice(8, 14).map((t) => (
              <span
                key={`${t.hour}-${t.minute}`}
                className={
                  PILL_BASE +
                  " tabular-nums " +
                  (t.hour === TARGET_TIME.hour && t.minute === TARGET_TIME.minute ? PILL_ON : PILL_OFF)
                }
              >
                {timeLabel(t)}
              </span>
            ))}
          </div>
        </Frame>

        {/* Step 5: saved. Posts through the same /api/dev/terminal action:"phone_booking" route the
            real sheet already uses (Screen.tsx savePhoneBooking, around line 549). No CHF figure on
            the saved row: TerminalService carries no price field, so one is not invented. */}
        <Frame step={5} title="Saved" note="One tap, and Lara is in Wed 26's book.">
          <div className="px-5 pt-5">
            <button type="button" tabIndex={-1} className={CTA}>
              Put it in the book
            </button>
          </div>
          <div className="px-5 pb-2 pt-5">
            <p className="font-body text-[13px] font-semibold text-s-ink-2">Wed 26</p>
          </div>
          <ul>
            <li className={ROW}>
              <div className="min-w-0 flex-1">
                <p className={ROW_TIME}>{timeLabel(TARGET_TIME)}</p>
                <p className={ROW_NAME}>{CALLER}</p>
                <p className={ROW_SUB}>
                  {SERVICE_NAME}, with {STAFF.find((m) => m.id === CHOSEN_STAFF)?.name.split(" ")[0]}
                </p>
              </div>
            </li>
          </ul>
        </Frame>
      </div>
    </div>
  );
}
