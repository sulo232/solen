// FlowPhone, one of the four host-flows proposals: a stylist takes a booking over the phone. The
// day already open on the counter is the first screen, the phone rings while it is up, then the
// stylist finds or adds the caller, picks the stylist, service, day and time, and the booking
// lands in that day's list.
//
// SHAPE: an indexed single-frame API, the same shape as the other flows in this folder. FRAMES is
// the ordered { key, caption } list; the default export takes { index } and renders exactly one
// frame inside PhoneFrame. page.tsx owns the stepper and which index is on screen.
//
// emphasis-ok: operator screen, governed by _design-system/TERMINAL_PRINCIPLES.md, not the
// customer FLOORS LAW / EMPHASIS BUDGET, which is scoped to customer discovery/PDP/booking
// screens. The font-semibold uses here are PILL_ON (the selected stylist/service/day/time pill),
// the CTA button text ("Put it in the book", the one commit action), the "Booking on the phone"
// frame heading, and the two small section labels ("Calendar", "Wed 26"), each marking a heading
// or a selected state rather than decorative bold.

import { Plus } from "lucide-react";
import { Avatar } from "@/app/[locale]/_components/primitives";

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
const ICON_BUTTON = "flex h-11 w-11 items-center justify-center rounded-full bg-s-ink text-white";
const NO_SCROLLBAR = "scrollbar-hide flex gap-2 overflow-x-auto px-5";

const FIXTURE_TODAY = "2026-08-19";
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

const DAY_PILLS = Array.from({ length: 14 }, (_, i) => addDaysFixture(FIXTURE_TODAY, i));
const TARGET_DAY = addDaysFixture(FIXTURE_TODAY, 7);

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
  return `${String(t.hour).padStart(2, "0")}:${String(t.minute).padStart(2, "0")}`;
}

const STAFF = [
  { id: "mia", name: "Mia Fischer" },
  { id: "nina", name: "Nina Herzog" },
  { id: "jonas", name: "Jonas Bruderer" },
];
const CALLER = "Lara Widmer";
const KNOWN_CLIENTS = ["Lara Widmer", "Elias Meier", "Sina Baumann", "Noah Frei"];
const SERVICE_NAME = "Cut, 30m";
const CHOSEN_STAFF = "mia";

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto h-[844px] w-full max-w-[390px] overflow-hidden rounded-[20px] border border-s-border bg-white">
      <div className="h-full overflow-y-auto">{children}</div>
    </div>
  );
}

function CalendarDayStep() {
  return (
    <>
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
    </>
  );
}

function LookupStep() {
  return (
    <>
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
        <input readOnly value="" placeholder="Phone number" inputMode="tel" className={INPUT_CLS + " mt-2"} />
      </div>
    </>
  );
}

function DetailsStep() {
  return (
    <>
      <div className={NO_SCROLLBAR + " pt-5"}>
        {STAFF.map((m) => (
          <span key={m.id} className={PILL_BASE + " " + (m.id === CHOSEN_STAFF ? PILL_ON : PILL_OFF)}>
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
      <div className={NO_SCROLLBAR + " mb-4 mt-2"}>
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
    </>
  );
}

function SavedStep() {
  return (
    <>
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
    </>
  );
}

export const FRAMES: { key: string; caption: string }[] = [
  { key: "calendar", caption: "The phone rings while this calendar day is already up on screen." },
  { key: "lookup", caption: "Is this someone we know?" },
  { key: "details", caption: "Stylist, service, day and time." },
  { key: "saved", caption: "Saved." },
];

export default function FlowPhone({ index }: { index: number }) {
  const frame = FRAMES[index] ?? FRAMES[0]!;
  return (
    <PhoneFrame>
      {frame.key === "calendar" && <CalendarDayStep />}
      {frame.key === "lookup" && <LookupStep />}
      {frame.key === "details" && <DetailsStep />}
      {frame.key === "saved" && <SavedStep />}
    </PhoneFrame>
  );
}
