/**
 * exists-check: `npm run exists agenda` returned 0 matches (run 2026-08-20), and there is no
 * calendar or agenda page under app/[locale]/dev/ (directory listing checked directly). Net new.
 *
 * Mockup-scope: whole-page
 *
 * REBUILT 2026-08-20, owner verbatim: "the day list doesnt make any scence so much clutter". The
 * page used to stack all three treatments full length, one after another, eighteen rows then nine
 * then the Airbnb version, so comparing the top block to the bottom one meant scrolling about three
 * thousand pixels and holding the first one in memory. That is the defect, not the treatments
 * themselves. FIXED by turning the three stacked lists into ONE list under a segmented control
 * (Today / Grouped / Airbnb way, matching the Tag / Woche / Monat control at
 * app/[locale]/dashboard/calendar/page.tsx:786) that swaps the same fixture in place, plus one
 * caption line under the list naming what the current option changed. The three treatments below
 * (BeforeAgenda, AfterAgenda, AirbnbWayAgenda) are byte-for-byte the same components as before this
 * rebuild, only the page shell around them changed.
 *
 * BEFORE and AFTER comparison of the dashboard day agenda list. renderAgenda() in
 * app/[locale]/dashboard/calendar/page.tsx renders eighteen equal-weight "Frei" rows for a
 * populated Wednesday, and a direct edit to that real component was correctly refused by the
 * mockup-visual gate for having no approved mockup yet. This route is that mockup.
 *
 * BEFORE is a faithful copy of renderAgenda's classes and colors, not a redrawing: the
 * `rounded-[16px] border border-s-border bg-white p-3 space-y-2` container, the 40px tabular
 * time gutter at 12px, the `rounded-[12px] px-3 py-2.5 min-h-[44px]` band, the 13.5px semibold
 * label, `bg-s-success-bg` plus `text-s-success` for free, `bg-s-bg-sunken` plus `text-s-ink-2`
 * for blocked, and the `bg-[#EAEFFE]` booked fill. That hex is copied verbatim from the real
 * screen's CAT_AGENDA_BG fallback, not invented here.
 *
 * AFTER changes exactly three things and nothing else: (1) consecutive free slots collapse into
 * one band per run, a run of one still renders as a band, booked and blocked rows keep their own
 * row same as today; (2) the free band goes quiet, neutral sunken background plus grey text
 * instead of the green fill, so green stops being the loudest thing on an empty day; (3) the
 * type budget, folded in here so it is approved once: the real screen carries six text sizes
 * (16, 17, 14, 13.5, 12.5, 12) against the four-size cap, so every 13.5px label in the AFTER
 * column renders at 14px instead. 12.5px does not occur inside the agenda itself, so there is
 * nothing of that size to change in this component.
 *
 * DATA: a hardcoded fixture, not wired data. A realistic Wednesday, open 09:00 to 18:00 on the
 * half hour (eighteen slots), three bookings interrupting it, and a blocked lunch. Both columns
 * render the exact same fixture array so the only difference between them is the treatment.
 * Times are pre-formatted strings rather than parsed from an ISO Date, since this file has no
 * real timezone to be correct about, only the display.
 *
 * ADDED 2026-08-20, a THIRD block: the same Wednesday, same fixture, built to the nine Airbnb
 * rules written up in _design-system/references/airbnb--host-and-rules.md and shown at
 * /dev/airbnb-rules. The first two blocks are untouched. What the third one changes and why:
 *   - ZERO colour (rule 1 and rule 2). Their host screens measure 0.00% chromatic, and an operator
 *     day list has no irreversible commit on it, so nothing here earns a hue. That removes the
 *     green-on-green 2.93 to 1 contrast failure as a side effect rather than as a patch.
 *   - A sentence with the live number as the anchor, at 28px (rule 5). Both figures are DERIVED
 *     from the fixture in the component, not typed, and the copy is written so it stays honest at
 *     zero. 28px sits outside the four-size body budget as the one display anchor (FLOORS LAW 6);
 *     the body budget itself is 14 / 13.5 / 12, the 13.5 is the BEFORE block's faithful copy of
 *     the defect.
 *   - Free time collapses to one bare line per run carrying a count (rule 4 and rule 7): a
 *     single-line row does not earn a container, and free time is not something the owner acts on,
 *     so it goes quiet. Blocked time is quieter still, struck through, since it cannot be acted on
 *     at all.
 *   - A booking carries time plus service plus stylist, so it is the only complex row on the
 *     screen, and complexity is what earns it a white card with a hairline (rule 7).
 *   - Weight does two jobs only (rule 6): the anchor, and the identifying label on a booking. Times,
 *     counts and stylist names are all regular.
 *   - NO PRICE on the row, on purpose. Their slot row carries one and ours has no price source in
 *     this fixture, so printing one would be inventing data.
 *   - The selected row uses OUR locked treatment, the calm gray sunken fill. Airbnb's answer is a
 *     2px black border and it is NOT used here: a black surround on a selected state was killed
 *     2026-07-02 and a gate enforces it. That collision is written up in
 *     _design-system/references/airbnb--host-and-rules.md (the "black selected state" conflict);
 *     /dev/airbnb-rules itself no longer lists it since its 2026-08-20 rebuild to real screenshots
 *     only keeps rules visible in the two captures it renders.
 *
 * Dev-only preview route, blocked in production below like every other page under app/[locale]/dev/.
 */
"use client";

import { useState } from "react";
import { notFound } from "next/navigation";

type FixtureSlot = {
  id: string;
  start: string;
  end: string;
  status: "available" | "booked" | "blocked";
  serviceLabel?: string;
  staffFirstName?: string;
};

// Hardcoded fixture, see file header. Not wired to any table.
const DAY_SLOTS: FixtureSlot[] = [
  { id: "1", start: "09:00", end: "09:30", status: "available" },
  { id: "2", start: "09:30", end: "10:00", status: "available" },
  { id: "3", start: "10:00", end: "10:30", status: "available" },
  { id: "4", start: "10:30", end: "11:00", status: "booked", serviceLabel: "Cut", staffFirstName: "Emma" },
  { id: "5", start: "11:00", end: "11:30", status: "available" },
  { id: "6", start: "11:30", end: "12:00", status: "available" },
  { id: "7", start: "12:00", end: "12:30", status: "blocked" },
  { id: "8", start: "12:30", end: "13:00", status: "available" },
  { id: "9", start: "13:00", end: "13:30", status: "booked", serviceLabel: "Colour", staffFirstName: "Luca" },
  { id: "10", start: "13:30", end: "14:00", status: "available" },
  { id: "11", start: "14:00", end: "14:30", status: "available" },
  { id: "12", start: "14:30", end: "15:00", status: "available" },
  { id: "13", start: "15:00", end: "15:30", status: "available" },
  { id: "14", start: "15:30", end: "16:00", status: "available" },
  { id: "15", start: "16:00", end: "16:30", status: "booked", serviceLabel: "Cut", staffFirstName: "Marco" },
  { id: "16", start: "16:30", end: "17:00", status: "available" },
  { id: "17", start: "17:00", end: "17:30", status: "available" },
  { id: "18", start: "17:30", end: "18:00", status: "available" },
];

function pluralSlots(count: number): string {
  return count === 1 ? "slot" : "slots";
}

// BEFORE: faithful copy of renderAgenda's per-slot loop (see file header for the class list).
function BeforeAgenda({ slots }: { slots: FixtureSlot[] }) {
  return (
    <div className="rounded-[16px] border border-s-border bg-white p-3 space-y-2">
      {slots.map((s) => {
        let bg = "bg-[#EAEFFE]"; // copied verbatim from the real screen's CAT_AGENDA_BG fallback
        let label = s.serviceLabel ?? "Booked";
        let labelCls = "text-s-ink";
        let det: string | undefined = s.staffFirstName;
        if (s.status === "blocked") { bg = "bg-s-bg-sunken"; label = "Blocked"; labelCls = "text-s-ink-2"; det = undefined; }
        else if (s.status === "available") { bg = "bg-s-success-bg"; label = "Free"; labelCls = "text-s-success"; det = undefined; }
        return (
          <div key={s.id} className="w-full flex items-stretch gap-3 text-left">
            <span className="font-heading font-semibold text-[12px] text-s-ink-2 w-[40px] shrink-0 pt-3 tabular-nums">{s.start}</span>
            <span className={`flex-1 rounded-[12px] px-3 py-2.5 min-h-[44px] flex flex-col justify-center ${bg}`}>
              <span className={`font-heading font-semibold text-[13.5px] ${labelCls}`}>{label}</span>
              {det && <span className="text-[12px] text-s-ink-2 mt-0.5">{det}</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

type AgendaItem = { kind: "free"; runSlots: FixtureSlot[] } | { kind: "slot"; slot: FixtureSlot };

// Walks the fixture in order and groups each run of consecutive `available` slots, same logic
// proposed for the real renderAgenda.
function groupRuns(slots: FixtureSlot[]): AgendaItem[] {
  const items: AgendaItem[] = [];
  for (const s of slots) {
    const prev = items[items.length - 1];
    if (s.status === "available" && prev?.kind === "free") prev.runSlots.push(s);
    else if (s.status === "available") items.push({ kind: "free", runSlots: [s] });
    else items.push({ kind: "slot", slot: s });
  }
  return items;
}

// AFTER: the three changes named in the file header, applied to the same fixture.
function AfterAgenda({ slots }: { slots: FixtureSlot[] }) {
  const items = groupRuns(slots);
  return (
    <div className="rounded-[16px] border border-s-border bg-white p-3 space-y-2">
      {items.map((item) => {
        if (item.kind === "free") {
          const first = item.runSlots[0];
          const last = item.runSlots[item.runSlots.length - 1];
          return (
            <div key={first.id} className="w-full flex items-stretch gap-3 text-left">
              <span className="font-heading font-semibold text-[12px] text-s-ink-2 w-[40px] shrink-0 pt-3 tabular-nums">{first.start}</span>
              <span className="flex-1 rounded-[12px] px-3 py-2.5 min-h-[44px] flex flex-col justify-center bg-s-bg-sunken">
                <span className="font-heading font-semibold text-[14px] text-s-ink-2">
                  {first.start} to {last.end} free, {item.runSlots.length} {pluralSlots(item.runSlots.length)}
                </span>
              </span>
            </div>
          );
        }
        const s = item.slot;
        let bg = "bg-[#EAEFFE]"; // unchanged, same literal as BEFORE
        let label = s.serviceLabel ?? "Booked";
        let labelCls = "text-s-ink";
        let det: string | undefined = s.staffFirstName;
        if (s.status === "blocked") { bg = "bg-s-bg-sunken"; label = "Blocked"; labelCls = "text-s-ink-2"; det = undefined; }
        return (
          <div key={s.id} className="w-full flex items-stretch gap-3 text-left">
            <span className="font-heading font-semibold text-[12px] text-s-ink-2 w-[40px] shrink-0 pt-3 tabular-nums">{s.start}</span>
            <span className={`flex-1 rounded-[12px] px-3 py-2.5 min-h-[44px] flex flex-col justify-center ${bg}`}>
              <span className={`font-heading font-semibold text-[14px] ${labelCls}`}>{label}</span>
              {det && <span className="text-[12px] text-s-ink-2 mt-0.5">{det}</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function pluralAppointments(count: number): string {
  return count === 1 ? "appointment" : "appointments";
}

// AIRBNB WAY: the same fixture, rebuilt to the nine rules. See the file header for the reasoning.
// The one row shown in the selected state is the 13:00 booking.
function AirbnbWayAgenda({ slots }: { slots: FixtureSlot[] }) {
  const items = groupRuns(slots);
  const bookedCount = slots.filter((s) => s.status === "booked").length;
  const freeHours = slots.filter((s) => s.status === "available").length * 0.5;
  const selectedId = "9"; // static in a mockup, the 13:00 booking, so the state is visible

  return (
    <div>
      <p className="text-[12px] text-s-ink-2">Wednesday</p>
      <p className="font-heading font-semibold text-[28px] leading-tight text-s-ink mt-1">
        {bookedCount} {pluralAppointments(bookedCount)} today
      </p>
      <p className="text-[14px] text-s-ink-2 mt-1">{freeHours} hours still open</p>

      <div className="mt-4 space-y-2">
        {items.map((item) => {
          if (item.kind === "free") {
            const first = item.runSlots[0];
            const last = item.runSlots[item.runSlots.length - 1];
            return (
              <p key={first.id} className="text-[14px] text-s-ink-2 py-1">
                <span className="tabular-nums">{first.start} to {last.end}</span> open, {item.runSlots.length}{" "}
                {pluralSlots(item.runSlots.length)}
              </p>
            );
          }
          const s = item.slot;
          if (s.status === "blocked") {
            return (
              <p key={s.id} className="text-[14px] text-s-ink-2 py-1 line-through">
                <span className="tabular-nums">{s.start} to {s.end}</span> blocked
              </p>
            );
          }
          const isSelected = s.id === selectedId;
          return (
            <div
              key={s.id}
              className={[
                "rounded-[16px] border px-3 py-3 min-h-[44px]",
                isSelected ? "border-s-border bg-s-bg-sunken" : "border-s-border bg-white",
              ].join(" ")}
            >
              <p className="text-[12px] text-s-ink-2 tabular-nums">{s.start} to {s.end}</p>
              <p className="font-heading font-semibold text-[14px] text-s-ink mt-0.5">{s.serviceLabel}</p>
              <p className="text-[12px] text-s-ink-2 mt-0.5">{s.staffFirstName}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// One list, three treatments, a segmented control instead of three stacked copies. Control
// treatment matched to app/[locale]/dashboard/calendar/page.tsx:786-793 (bg-s-bg-sunken pill,
// white selected pill + soft shadow, ink text). Size stepped from that control's 12.5px to 14px
// so this page still fits inside the four-size body budget already spent by the three treatments.
type ViewOption = "today" | "grouped" | "airbnb";

const VIEW_OPTIONS: { key: ViewOption; label: string; caption: string }[] = [
  {
    key: "today",
    label: "Today",
    caption: "Ships today: every slot gets its own row, and a free half hour fills it green edge to edge, eighteen times on a quiet day.",
  },
  {
    key: "grouped",
    label: "Grouped",
    caption: "Consecutive free slots collapse into one quiet grey line with a count. Bookings and the blocked lunch keep their own row, unchanged.",
  },
  {
    key: "airbnb",
    label: "Airbnb way",
    caption: "Same Wednesday rebuilt to the nine Airbnb rules: no colour anywhere, a sentence with the live count as the anchor, and a card only where a row carries three facts.",
  },
];

export default function CalendarAgendaMockupPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const [view, setView] = useState<ViewOption>("today");
  const active = VIEW_OPTIONS.find((o) => o.key === view)!;

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="mx-auto w-full max-w-[390px] p-4">
        <div className="flex bg-s-bg-sunken rounded-full p-[3px] gap-[2px]">
          {VIEW_OPTIONS.map((o) => (
            <button
              key={o.key}
              onClick={() => setView(o.key)}
              className={[
                "flex-1 font-heading font-semibold text-[14px] py-[7px] rounded-full transition-colors",
                view === o.key ? "bg-white text-s-ink shadow-[0_1px_3px_rgba(0,0,0,0.09)]" : "text-s-ink-2",
              ].join(" ")}
            >
              {o.label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {view === "today" && <BeforeAgenda slots={DAY_SLOTS} />}
          {view === "grouped" && <AfterAgenda slots={DAY_SLOTS} />}
          {view === "airbnb" && <AirbnbWayAgenda slots={DAY_SLOTS} />}
        </div>

        <p className="mt-3 text-[14px] leading-relaxed text-s-ink-2">{active.caption}</p>
      </div>
    </div>
  );
}
