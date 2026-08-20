/**
 * exists-check: `npm run exists agenda` returned 0 matches (run 2026-08-20), and there is no
 * calendar or agenda page under app/[locale]/dev/ (directory listing checked directly). Net new.
 *
 * Mockup-scope: whole-page
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
 * Dev-only preview route, blocked in production below like every other page under app/[locale]/dev/.
 */
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

export default function CalendarAgendaMockupPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="mx-auto w-full max-w-[390px] p-4">
        <h1 className="font-heading font-semibold text-[20px] text-s-ink mb-5">Day agenda: free time grouping</h1>

        <p className="font-heading font-semibold text-[14px] text-s-ink mb-2">Before, shipped today</p>
        <BeforeAgenda slots={DAY_SLOTS} />

        <p className="font-heading font-semibold text-[14px] text-s-ink mt-6 mb-2">After, proposed</p>
        <AfterAgenda slots={DAY_SLOTS} />

        <div className="mt-6 space-y-1">
          <p className="text-[12px] text-s-ink-2">Free time collapses into one band per run. Booked and blocked rows keep their own row, unchanged.</p>
          <p className="text-[12px] text-s-ink-2">The free band is neutral sunken and grey now, not green, so a booking is what your eye lands on.</p>
          <p className="text-[12px] text-s-ink-2">Two labels move from 13.5px to 14px, onto a size already used on this screen.</p>
        </div>
      </div>
    </div>
  );
}
