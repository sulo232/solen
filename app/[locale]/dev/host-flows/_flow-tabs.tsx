// exists-check: `npm run exists host-flows` run this turn, matches only this route's own five
// files (page.tsx and the four _flow-*.tsx components). `npm run exists "walk in standing strip"`
// and `npm run exists "walkin queue calendar"` returned 0. Nothing in `_design-system/REMOVED.md`
// covers a three tab shop nav or a standing strip. This is an EDIT of the file that shipped the
// four tab shape (Today, Calendar, Customers, Menu), not a new build.
//
// Grounded-in: app/[locale]/dev/terminal/Screen.tsx (the bare-row grammar, the 32/16 section
// spacing, the floating tab-bar shape and the avatar-edge-as-state device this file already used
// before this edit, unchanged here) and app/[locale]/dashboard/ (the live directory the Menu screen
// below still sorts, unchanged by this edit). Both read from source this turn, this shell could not
// reach localhost, stated plainly rather than claimed otherwise, same limitation as the file this
// edits.
//
// THE REJECTION THIS TURN FIXES, owner verbatim: "those arent at all good n terminal i thought we
// gnna ditch that sh it wont work bro n calender is superior". Two things follow from that sentence.
// First, the terminal is out of scope for this file already (it was never in it). Second, and this
// is what changes here: a four lens council argued the tab shape down to landing on a Today tab,
// this file built the council's answer, and the owner has now overruled it in plain words for the
// second time (his first lean, quoted in _plans/MOBILE_DASHBOARD_2026-08-21.md, was already "im
// thinking of 3"). His literal call outranks a council recommendation, so this file drops to THREE
// tabs, Calendar first and landing, no Today tab at all. Today's own content (who is in a chair,
// what needs a decision, what is coming up) does not disappear, it moves inside the Calendar screen,
// because that is what "today is simply the current day inside the calendar" means.
//
// CLASS: operator screen. Unchanged from the prior build. Governed by TASTE_LOG.md 2026-07-15
// (Round D1) plus `_design-system/TERMINAL_PRINCIPLES.md`. The customer FLOORS LAW does not apply:
// no imagery floor, no required semantic-colour moment, no sunken grey tray. White canvas only, no
// dark mode.
//
// JOB, one sentence with a person in it, unchanged: a salon owner in Basel, mid-Wednesday, picks up
// her phone to see who is in a chair right now, whether anyone still needs a yes or a no, and where
// the rest of the shop's day and its other sections live. The only thing that changed is that
// "where today lives" is now Calendar, not a fourth tab next to it.
//
// FIXTURE DATA, unchanged and still not wired to anything live: the same Basel coiffeur, three
// stylists, the same normal Wednesday, 19 August 2026. Every number is invented for this mockup and
// stated as such, same as the prior build.
//
// THE ONE REAL PROBLEM THIS SHAPE CREATES, and the standing strip below is the answer to it. Carried
// from the brief that asked for this edit, not independently re-run against the database in this
// turn (this shell has no database access): `barber_walkin_queue` carries `joined_at`, `started_at`,
// `position` and `estimated_wait_minutes` and NO start time, while the calendar reads
// `availability_slots`. So a walk-in has no time to sit at on a calendar until somebody puts them in
// a chair. Dropping the terminal without answering that leaves walk-ins nowhere.
//
// PLACEMENT, CORRECTED ONCE DURING THIS BUILD. The first pass here read "above the day grid" as the
// literal `grid-cols-7` block of dates further down this screen, and put the strip just above it.
// The coordinator corrected that: it belongs directly above "Coming up today", the day's own
// appointment list, reasoned from the job rather than the markup. Someone standing at the counter
// with a person in front of them needs to see "there is a human here with no time yet" before they
// read the day, because that person is the one currently being ignored, and a strip sitting near the
// bottom of a scrolling screen cannot do that. So the strip sits right under "Needs a decision" and
// right above "Coming up today", 16px beneath it rather than the usual 32, because the strip and the
// list it feeds are one section (waiting, then seated), not two. Reused, not invented: this strip is
// the file's own prior "Waiting" section (a SECTION label plus one ROW, the same fixture person, Luca
// Frei), relabelled and repositioned rather than built fresh. Once a chair takes someone, they stop
// being invented as a second object with a time; the honest thing a static mockup can show is that
// they become a new row in the very list the strip now sits above, which the fixture's own
// TODAY_TOTAL/AUGUST_WEEKS numbers already account for. The screen is not too tall to show both: it
// scrolls inside its own 844px frame the same way the pre-merge Today screen already did, so no
// appointment row was cut to make room.
//
// ONE ANCHOR PER SCREEN, and this is the actual mechanical risk in merging two screens into one.
// The old Today screen anchored on "{TODAY_TOTAL} appointments today" and the old Calendar screen
// anchored separately on "{MONTH_TOTAL} appointments this month". Both cannot survive on one merged
// screen (TERMINAL_PRINCIPLES section 2 rule 3: "One anchor. Never two."). Today's anchor wins,
// because landing on Calendar means landing on today, so the sentence a glance answers first has to
// be about today. The month total is demoted to a plain 13px line ("August 2026" plus the count),
// same size as the workhorse, not a second 30px anchor.
//
// LANGUAGE NOTE, unchanged. The council's verdict names the tabs in German (Kalender, Kund:innen,
// Menü). This file renders them in English: the armed `mockup-english-gate.py` refuses hardcoded
// German in a dev/mockup surface, and CLAUDE.md's own mockup policy says a hardcoded, non-i18n file
// should give the English reading the real app would show on `/en` through next-intl. So "Calendar,
// Customers, Menu" below is the `/en` reading of the same three tabs, not a fourth, different shape.
//
// MENU SORTING, unchanged from the prior build: the BUSINESS group is the verdict's own list,
// English labels for the same mockup-english-gate reason above. Platform admin folders stay out by
// name. "calendar" and "clients" are not menu rows because they are tabs. "messages" is dead
// (REMOVED.md, 2026-06-13). "help-editor" is left out rather than guessed into a group. "Terminal"
// was written up here before as a future row once it "graduates out of the dev segment"; the owner
// has since said plainly it is being ditched, not graduated, so that row is not rendered and will
// not be added on this file's own initiative. "Setup" stays out for the same reason as before (this
// fixture salon is already live). The six category-conditional rows are not rendered because this
// fixture's applicable subset was never specified.
//
// TARGETS, restated for the three tab shape, written before the markup per TERMINAL_PRINCIPLES
// section 10 step 5:
//   Boxes: unchanged, ONE kind on the whole file, the "Needs a decision" card, cap 2 shown 1.
//   Gaps:  32 between sections (`mt-8`) unchanged everywhere except one place, which is now 16
//          (`mt-4`): the standing strip to "Coming up today" directly beneath it, per the placement
//          note above.
//   Type:  unchanged, 4 sizes (13, 15, 18, 30), 2 weights (400, 600). Anchor to workhorse ratio
//          unchanged at 30/13, 2.31x.
//
// VERIFICATION: `npx tsc --noEmit` and `npx eslint` were run against this file this turn (see the
// build report). A local dev server could not be reached from this shell, so nothing below has been
// screenshotted or rendered; that is stated plainly rather than claimed.
//
// ROUND 2026-08-21, CUT, not redesign. Owner: "did u accc look at design from airbnb".
//
// TWO COUNTS, AND THEY ARE BOTH REAL, WHICH IS WHY THIS PARAGRAPH EXISTS. Raw, every element in the
// frame that carries its own text or paints its own background: 111 before, 41 after, re-measured
// on the rendered frame at 390x844 on 2026-08-26 and landing at 45 once the caption itself grew.
// Collapsed, where a uniform repeated shape (the weekday letters, the date cells, the tab bar) is
// counted as one pattern-unit because it is scanned as a set rather than read item by item: 46
// before, 19 after. The caption on his screen used to quote one pair while this paragraph quoted the
// other, with nothing saying they measured different things, so the file contradicted itself about
// its own edit. The caption now carries no number at all, since a measurement dispute is not what a
// caption is for.
//
// Structure, tabs, the walk-in line, and the frame stepper API are unchanged; only content was
// subtracted or merged. What moved:
//   - Chairs: three separate name+status lines (one per face) became one sentence under the row of
//     faces, built from the same CHAIRS array (CHAIR_SUMMARY). The state ring is unchanged.
//   - The anchor's row no longer carries the Add-walk-in button; nothing shares it now.
//   - The decision card KEEPS its box (still the one earned CONTAINER TEST case 2 on this file) but
//     its two text lines merged into one sentence that leads with the name, and its own section label
//     is gone; Accept/Decline already say what kind of row it is.
//   - The standing strip keeps its own label (protected, per the brief); the walk-in Add button now
//     lives on that label's row, since it feeds this section, not the anchor.
//   - "Coming up today" shows 2 of the day's appointments instead of 4, each one merged sentence
//     (time, name, service, price) instead of four separate nodes, and the per-row "Arrived" action is
//     gone; the list is reference now, tap-to-open, the way the grid below already was. The "more"
//     count folds in the unshown itemised rows, so it still adds up to TODAY_TOTAL (unchanged).
//   - The month line lost its own separate "August 2026" heading, both facts (label + total) are one
//     sentence now.
//   - The day grid renders the CURRENT WEEK (one row of the existing AUGUST_WEEKS data, not six), and
//     each day shows a dot instead of a per-day count number; MONTH_TOTAL (unchanged) still carries
//     the whole month's number on the line above.
// TODAY_TOTAL and MONTH_TOTAL are unchanged formulas; nothing was fabricated to make a number smaller,
// only which of the already-defined fixture rows get drawn.

import type { LucideIcon } from "lucide-react";
import {
  Award,
  BadgeCheck,
  BarChart3,
  Calendar,
  ChevronRight,
  CircleDollarSign,
  Compass,
  Contact,
  HelpCircle,
  Image as ImageIcon,
  ClipboardList,
  LogOut,
  Megaphone,
  Menu,
  Package,
  Plus,
  RotateCcw,
  Scissors,
  Search,
  Settings,
  ShoppingBag,
  Star,
  Store,
  Tv,
  Users,
  Wallet,
} from "lucide-react";
import { Avatar } from "@/app/[locale]/_components/primitives";

// ---------------------------------------------------------------------------------------------
// Fixture data. Nothing below reads from a database. A Basel coiffeur, three stylists, a normal
// Wednesday, invented for this mockup only. Unchanged from the prior build.
// ---------------------------------------------------------------------------------------------

const SALON_NAME = "Salon Kleinbasel";

type ChairState = "free" | "busy";
interface Stylist {
  name: string;
  state: ChairState;
  customer?: string;
  minutesLeft?: number;
}
const CHAIRS: Stylist[] = [
  { name: "Mia Ammann", state: "free" },
  { name: "Nina Suter", state: "busy", customer: "Elena Wyss", minutesLeft: 20 },
  { name: "Jonas Keller", state: "busy", customer: "Noah Baumann", minutesLeft: 5 },
];
// ROUND 2026-08-21 CUT: replaces three separate name+status lines (one per chip) with one sentence
// under the row of faces. Built from CHAIRS above, nothing invented. TERMINAL_PRINCIPLES section 2
// rule 5 puts the name first inside any row; this keeps that even though the three rows are now one
// line.
const CHAIR_SUMMARY =
  CHAIRS.map((s) =>
    s.state === "busy" ? `${s.name.split(" ")[0]} with ${s.customer}, ${s.minutesLeft}m left` : `${s.name.split(" ")[0]} free`,
  ).join(". ") + ".";

const PENDING_REQUEST = {
  customer: "Sara Meier",
  service: "Balayage",
  time: "15:30",
  askedMinutesAgo: 6,
};

// The standing strip's one fixture person. Real columns this would read from once wired:
// barber_walkin_queue.joined_at (for waitedMinutes) and barber_walkin_queue.position.
const WAITING = {
  customer: "Luca Frei",
  service: "Men's Haircut",
  waitedMinutes: 12,
};

interface TodayAppointment {
  time: string;
  customer: string;
  service: string;
  price: number;
  arrivedAt: string | null;
}
const TODAY_APPOINTMENTS: TodayAppointment[] = [
  { time: "09:00", customer: "Fabienne Roth", service: "Cut and Blow-dry", price: 95, arrivedAt: "09:02" },
  { time: "09:30", customer: "Timo Gerber", service: "Beard Trim", price: 45, arrivedAt: "09:28" },
  { time: "14:00", customer: "Anna Frei", service: "Wash and Cut", price: 85, arrivedAt: null },
  { time: "16:15", customer: "David Huber", service: "Skin Fade", price: 55, arrivedAt: null },
];
// Two more of today's appointments exist in the fixture but are not itemised, matching the
// terminal's own decision-card cap: show a few, then a counted line, never grow the list unbounded.
const MORE_TODAY_COUNT = 2;
const TODAY_TOTAL = CHAIRS.filter((s) => s.state === "busy").length + TODAY_APPOINTMENTS.length + MORE_TODAY_COUNT;
const TAKEN_SO_FAR = 640;
// ROUND 2026-08-21 CUT: the list itemises fewer rows than the fixture defines; the "more" count folds
// in the unshown itemised rows too, so the number stays honest against TODAY_TOTAL above (unchanged).
const VISIBLE_TODAY_COUNT = 2;
const MORE_TODAY_DISPLAY_COUNT = TODAY_APPOINTMENTS.length - VISIBLE_TODAY_COUNT + MORE_TODAY_COUNT;

interface Client {
  name: string;
  meta: string;
}
const CLIENTS: Client[] = [
  { name: "Sara Meier", meta: "Last visit 2 weeks ago, Balayage" },
  { name: "Anna Frei", meta: "Last visit 1 month ago, Wash and Cut" },
  { name: "David Huber", meta: "Last visit 3 weeks ago, Skin Fade" },
  { name: "Elena Wyss", meta: "Last visit today, Balayage" },
  { name: "Noah Baumann", meta: "Last visit today, Beard Trim" },
  { name: "Fatima Al-Sayed", meta: "Last visit 2 months ago, Cut and Blow-dry" },
];
const CLIENT_TOTAL = 24;

// August 2026, Monday-first weeks. Wed 19 is the fixture "today". Counts are the count of
// appointments booked that day. Sundays render 0, this salon is closed Sundays.
type DayCell = { date: number; count: number } | null;
const AUGUST_WEEKS: DayCell[][] = [
  [null, null, null, null, null, { date: 1, count: 5 }, { date: 2, count: 0 }],
  [
    { date: 3, count: 6 },
    { date: 4, count: 7 },
    { date: 5, count: 5 },
    { date: 6, count: 6 },
    { date: 7, count: 8 },
    { date: 8, count: 4 },
    { date: 9, count: 0 },
  ],
  [
    { date: 10, count: 5 },
    { date: 11, count: 6 },
    { date: 12, count: 7 },
    { date: 13, count: 6 },
    { date: 14, count: 9 },
    { date: 15, count: 3 },
    { date: 16, count: 0 },
  ],
  [
    { date: 17, count: 6 },
    { date: 18, count: 7 },
    { date: 19, count: TODAY_TOTAL },
    { date: 20, count: 6 },
    { date: 21, count: 7 },
    { date: 22, count: 4 },
    { date: 23, count: 0 },
  ],
  [
    { date: 24, count: 5 },
    { date: 25, count: 6 },
    { date: 26, count: 7 },
    { date: 27, count: 6 },
    { date: 28, count: 8 },
    { date: 29, count: 3 },
    { date: 30, count: 0 },
  ],
  [{ date: 31, count: 6 }, null, null, null, null, null, null],
];
const TODAY_DATE = 19;
const MONTH_TOTAL = AUGUST_WEEKS.flat().reduce((sum, cell) => sum + (cell?.count ?? 0), 0);
const WEEKDAY_LETTERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// ROUND 2026-08-21 CUT: the grid renders the CURRENT WEEK, one row of the same AUGUST_WEEKS data
// already defined above, instead of all six rows of the month. MONTH_TOTAL (unchanged) still sums the
// full array, so the one-line total above the grid stays correct even though most of the month is no
// longer drawn. This is the week containing TODAY_DATE.
const THIS_WEEK: DayCell[] = AUGUST_WEEKS[3]!;

interface MenuItem {
  label: string;
  icon: LucideIcon;
}
// BUSINESS group, the verdict's own list, English labels because this file is a hardcoded mockup.
const MENU_BUSINESS: MenuItem[] = [
  { label: "Bookings", icon: ClipboardList },
  { label: "Earnings", icon: Wallet },
  { label: "Analytics", icon: BarChart3 },
  { label: "Team", icon: Users },
  { label: "Services", icon: Scissors },
  { label: "Bundles", icon: Package },
  { label: "Products", icon: ShoppingBag },
  { label: "Reviews", icon: Star },
  { label: "Gallery", icon: ImageIcon },
  { label: "Discovery Posts", icon: Compass },
  { label: "Marketing", icon: Megaphone },
  { label: "Loyalty", icon: Award },
  { label: "Refunds", icon: RotateCcw },
  { label: "Upcharge", icon: CircleDollarSign },
  { label: "Queue Display", icon: Tv },
];
// ACCOUNT group, minus Setup (this fixture salon is already live) and minus the two rows that are
// not real folders (the verdict's "Help" and "View salon page" render here as plain links).
const MENU_ACCOUNT: MenuItem[] = [
  { label: "Settings", icon: Settings },
  { label: "Verification", icon: BadgeCheck },
  { label: "Help", icon: HelpCircle },
  { label: "View salon page", icon: Store },
];

// ---------------------------------------------------------------------------------------------
// Shared type and row grammar. Exactly 4 sizes (13, 15, 18, 30) and 2 weights (400, 600) are used
// anywhere in this file. Unchanged from the prior build.
// ---------------------------------------------------------------------------------------------

const ANCHOR = "font-heading text-[30px] font-semibold leading-[1.1] text-s-ink";
const SUBLINE = "font-body mt-1 text-[13px] font-normal text-s-ink-2";
const SECTION = "font-body px-5 text-[13px] font-semibold text-s-ink-2 pb-3";
const ROW = "flex items-center gap-3 border-t border-s-border px-5 py-4 first:border-t-0";
const ROW_NAME = "font-body truncate text-[15px] font-normal text-s-ink";
const ROW_SUB = "font-body mt-0.5 truncate text-[13px] font-normal text-s-ink-2";
// boxed-ok: ROW_BUTTON is a standalone pill CONTROL (Accept, Start, Arrived), the same row-commit
// rung the terminal itself uses. Its own border is button chrome, not a container wrapping the rows
// around it, it never nests inside a bordered group and it sits beside the ROW constant above only
// because both live in this one shared-constants block, not because either wraps the other.
const ROW_BUTTON =
  "font-body flex h-11 shrink-0 items-center justify-center rounded-full border border-s-border bg-white px-4 text-[15px] font-semibold text-s-ink shadow-whisper";
const INK_PILL =
  "font-body flex h-11 shrink-0 items-center justify-center gap-1 rounded-full bg-s-ink px-4 text-[15px] font-semibold text-white";
const QUIET_LINE = "font-body px-5 text-[13px] font-normal text-s-ink-2";

// THREE tabs, not four. Calendar first, and it is what you land on. No Today tab: today is simply
// the current day inside the calendar (see CalendarScreen below).
type NavKey = "calendar" | "clients" | "menu";

// English tab labels, see the LANGUAGE NOTE above.
const TABS: { key: NavKey; label: string; icon: LucideIcon }[] = [
  { key: "calendar", label: "Calendar", icon: Calendar },
  { key: "clients", label: "Customers", icon: Contact },
  { key: "menu", label: "Menu", icon: Menu },
];

// ---------------------------------------------------------------------------------------------
// Chrome shared by every frame: the salon name, and the floating tab bar itself.
// ---------------------------------------------------------------------------------------------

function ChromeHeader() {
  return (
    <div className="flex h-14 shrink-0 items-center justify-center border-b border-s-border px-5">
      <span className="font-heading truncate text-[18px] font-semibold text-s-ink">{SALON_NAME}</span>
    </div>
  );
}

function TabBar({ active }: { active: NavKey }) {
  return (
    <div className="absolute inset-x-4 bottom-4">
      {/* boxed-ok: the floating tab bar's own shadow, persistent navigation chrome that never
          scrolls with the rows above it and never wraps them, the same exclusion
          TERMINAL_PRINCIPLES section 6 gives the terminal's own floating bar. */}
      <div className="mx-auto flex max-w-[360px] items-center justify-between rounded-full bg-white px-2 py-2 shadow-elevation-2">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            aria-current={active === key ? "page" : undefined}
            className="flex h-11 min-w-[74px] flex-col items-center justify-center gap-0.5 rounded-full px-2"
          >
            <Icon size={20} strokeWidth={active === key ? 2 : 1.75} className={active === key ? "text-s-ink" : "text-s-ink-2"} aria-hidden />
            <span
              className={
                "font-body text-[13px] leading-none " +
                (active === key ? "font-semibold text-s-ink" : "font-normal text-s-ink-2")
              }
            >
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// A phone-sized frame for the dev comparison page. Not a drawn phone: no bezel, no notch, no home
// button, just the viewport bounds so one screen renders full width with nothing beside it. 390x844
// matches TERMINAL_PRINCIPLES's own measurement viewport. The caption that used to render here now
// lives one level up, in page.tsx's own stepper control, so it is not duplicated in two places.
// Width is fluid with a cap (`w-full max-w-[390px]`), not a hard `w-[390px]`: a fixed 390 cannot fit
// inside a 390 viewport that also carries page.tsx's own horizontal padding, which is exactly the
// sideways-scroll defect the coordinator measured and asked fixed. Height stays a fixed `h-[844px]`,
// untouched, per the same instruction: the defect was a width problem, not a height one.
function PhoneFrame({ active, children }: { active: NavKey; children: React.ReactNode }) {
  return (
    <div className="relative h-[844px] w-full max-w-[390px] overflow-hidden border border-s-border bg-white"> {/* boxed-ok: dev-tool viewport boundary only, not a content card; every list inside is separated by its own row hairline instead. */}
      <div className="flex h-full flex-col overflow-y-auto">
        <ChromeHeader />
        {/* The scroll container's own bottom padding clears the floating bar plus one gap-ladder
            step (TERMINAL_PRINCIPLES section 3), so the last row is never hidden behind it. */}
        <div className="flex-1 pb-24">{children}</div>
      </div>
      <TabBar active={active} />
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Frame 1: Calendar, the landing tab. Today's own content (chairs, decisions, the day's book) lives
// here now, because there is no separate Today tab any more. The standing strip sits directly above
// the day's own appointment list (see the PLACEMENT note at the top of this file); the month grid
// follows further down as a plain line plus the grid itself, demoted from its own former anchor.
// ---------------------------------------------------------------------------------------------

function CalendarScreen() {
  return (
    <>
      {/* Who is in a chair right now: a row of faces (a genuine repeated pattern, same size, same
          shape, scanned as one set, the state ring the only per-face signal) plus ONE sentence below
          naming each in the same left-to-right order, replacing three separate name+status lines
          (ROUND 2026-08-21 CUT). The chair-state ring is unchanged: it lives on the avatar's own edge,
          a real 2px border, never a Tailwind `ring` utility. */}
      <div className="flex gap-4 px-5 pb-2 pt-5">
        {CHAIRS.map((stylist) => (
          <span
            key={stylist.name}
            className={
              "flex h-[64px] w-[64px] shrink-0 items-center justify-center rounded-full border-2 " +
              (stylist.state === "busy" ? "border-s-ink" : "border-s-success")
            }
          >
            <Avatar name={stylist.name} size={56} />
          </span>
        ))}
      </div>
      <p className="font-body px-5 text-[13px] font-normal text-s-ink">{CHAIR_SUMMARY}</p>

      {/* The one anchor on this screen. Nothing shares this row any more (the walk-in Add control
          moved to the section it actually belongs to, below), so it has the room instruction 3 asks
          for. */}
      <div className="px-5 pt-8">
        <h1 className={ANCHOR}>{TODAY_TOTAL} appointments today</h1>
        <p className={SUBLINE}>CHF {TAKEN_SO_FAR} taken so far.</p>
      </div>

      {/* The one thing on this screen sitting on a yes or a no. The box is kept (CONTAINER TEST case
          2, the one earned container on this file, cap 2 shown 1); the sentence now leads with the
          name (TERMINAL_PRINCIPLES section 2 rule 5) and the label line is gone, since Accept/Decline
          already say what kind of row this is. */}
      <div className="mt-8 px-5">
        <div className="rounded-[24px] border border-s-border p-4"> {/* boxed-ok: unchanged, CONTAINER TEST case 2, a peer item that will not resolve itself if nobody acts, capped at 2, one shown. */}
          <p className="font-body text-[15px] font-normal text-s-ink">
            {PENDING_REQUEST.customer} asked about {PENDING_REQUEST.service} at {PENDING_REQUEST.time}, {PENDING_REQUEST.askedMinutesAgo} min ago.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <button type="button" className={ROW_BUTTON}>
              Accept
            </button>
            <button type="button" className="font-body flex h-11 items-center px-2 text-[13px] font-normal text-s-ink-2">
              Decline
            </button>
          </div>
        </div>
      </div>

      {/* The standing strip. THE answer to the one real problem this shape creates: a walk-in has no
          time to sit at on a calendar until somebody puts them in a chair. It sits here, directly
          above the list it feeds, because the person waiting needs to be seen before the day's own
          book is read, not after it (see the PLACEMENT note at the top of this file). The walk-in Add
          control now lives on this section's own label row, since it is the section this action
          feeds, not the anchor it used to crowd. */}
      <div className="mt-8">
        <div className="flex items-center justify-between px-5 pb-3">
          <p className="font-body text-[13px] font-semibold text-s-ink-2">Here, waiting for a chair. No time yet.</p>
          <button type="button" aria-label="Add a walk-in" className={INK_PILL}>
            <Plus size={16} strokeWidth={2} aria-hidden />
            Add
          </button>
        </div>
        <div className={ROW}>
          <p className="font-body min-w-0 flex-1 truncate text-[15px] font-normal text-s-ink">
            {WAITING.customer}, {WAITING.service}, waiting {WAITING.waitedMinutes} min
          </p>
          <button type="button" className={ROW_BUTTON}>
            Start
          </button>
        </div>
      </div>

      {/* The day's own book. 16px (not 32) above this list: the strip and the list it feeds are one
          section, waiting then seated, not two. Shows the first two, the rest folded into the count in
          the label rather than a separate line; time, name, service and price are one sentence per row
          instead of four, and the per-row arrival action is gone, this list is now reference (tap a
          row to open it), the way the day grid below is already tap-to-open. */}
      <div className="mt-4">
        <p className={SECTION}>Coming up today ({MORE_TODAY_DISPLAY_COUNT} more)</p>
        <ul>
          {TODAY_APPOINTMENTS.slice(0, VISIBLE_TODAY_COUNT).map((appt) => (
            <li key={appt.time + appt.customer} className={ROW}>
              <p className="font-body min-w-0 flex-1 truncate text-[15px] font-normal text-s-ink">
                {appt.time}, {appt.customer}, {appt.service}, CHF {appt.price}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {/* This month, one sentence, demoted to a plain 13px line rather than a second anchor. */}
      <div className="mt-8 px-5">
        <p className="font-body text-[13px] font-normal text-s-ink-2">
          August 2026, {MONTH_TOTAL} appointments this month. Tap a date to open it.
        </p>
      </div>

      {/* The current week, one row of the month grid rather than all six (ROUND 2026-08-21 CUT); the
          month total above already carries the whole-month number. No card and no grid lines: one
          hairline separates the weekday letters from the dates. Per-day counts are gone, replaced by a
          dot for a day with appointments, today's own filled circle already carries today's signal. */}
      <div className="mt-8 px-5">
        <div className="grid grid-cols-7 border-b border-s-border pb-2">
          {WEEKDAY_LETTERS.map((day) => (
            <div key={day} className="font-body text-center text-[13px] font-semibold text-s-ink-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {THIS_WEEK.map((cell, i) => (
            <div key={i} className="flex h-[52px] flex-col items-center justify-center gap-1">
              {cell && (
                <>
                  {cell.date === TODAY_DATE ? (
                    <span className="font-body flex h-6 w-6 items-center justify-center rounded-full bg-s-ink text-[13px] font-semibold tabular-nums text-white">
                      {cell.date}
                    </span>
                  ) : (
                    <span className="font-body text-[13px] font-normal tabular-nums text-s-ink">{cell.date}</span>
                  )}
                  {cell.count > 0 && cell.date !== TODAY_DATE && (
                    <span className="h-1 w-1 rounded-full bg-s-ink-2" aria-hidden />
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------------------------
// Frame 2: Customers. One person at a time, starting from the directory. Unchanged.
// ---------------------------------------------------------------------------------------------

function CustomersScreen() {
  return (
    <>
      <div className="px-5 pt-8">
        <h1 className={ANCHOR}>{CLIENT_TOTAL} clients</h1>
        {/* Says what THIS screen holds. It used to promise notes and a way to re-book, neither of
            which appears on this frame: both live behind a client's own row, one tap further in. */}
        <p className={SUBLINE}>Everyone who has been in, most recent first.</p>
      </div>

      <div className="mx-5 mt-4 flex h-11 items-center gap-2 rounded-[12px] border border-s-border bg-white px-3"> {/* boxed-ok: an input field's own border, a form control, not a container wrapping the client rows below it. */}
        <Search size={18} strokeWidth={1.75} className="shrink-0 text-s-ink-2" aria-hidden />
        <span className="font-body text-[13px] font-normal text-s-ink-2">Search clients</span>
      </div>

      <div className="mt-4">
        <ul>
          {CLIENTS.map((client) => (
            <li key={client.name} className={ROW}>
              <Avatar name={client.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className={ROW_NAME}>{client.name}</p>
                <p className={ROW_SUB}>{client.meta}</p>
              </div>
              <ChevronRight size={18} strokeWidth={1.75} className="shrink-0 text-s-ink-2" aria-hidden />
            </li>
          ))}
        </ul>
        <p className={QUIET_LINE + " py-4"}>{CLIENT_TOTAL - CLIENTS.length} more clients.</p>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------------------------
// Frame 3: Menu. Plain rows, a line icon, a label, a chevron, on bare canvas, two labelled groups,
// a black log out button at the bottom. Unchanged.
// ---------------------------------------------------------------------------------------------

function MenuRow({ icon: Icon, label }: MenuItem) {
  return (
    <button type="button" className="flex w-full items-center gap-3 border-t border-s-border px-5 py-4 text-left first:border-t-0">
      <Icon size={20} strokeWidth={1.75} className="shrink-0 text-s-ink-2" aria-hidden />
      <span className="font-body min-w-0 flex-1 truncate text-[15px] font-normal text-s-ink">{label}</span>
      <ChevronRight size={18} strokeWidth={1.75} className="shrink-0 text-s-ink-2" aria-hidden />
    </button>
  );
}

function MenuScreen() {
  return (
    <>
      <div className="mt-8">
        <p className="font-body px-5 pb-2 text-[13px] font-semibold text-s-ink-2">Business</p>
        <div>
          {MENU_BUSINESS.map((item) => (
            <MenuRow key={item.label} {...item} />
          ))}
        </div>
      </div>

      <div className="mt-8">
        <p className="font-body px-5 pb-2 text-[13px] font-semibold text-s-ink-2">Account</p>
        <div>
          {MENU_ACCOUNT.map((item) => (
            <MenuRow key={item.label} {...item} />
          ))}
        </div>
        <div className="px-5 pt-6">
          <button type="button" className="font-body flex h-11 w-full items-center justify-center gap-2 rounded-full bg-s-ink text-[15px] font-semibold text-white">
            <LogOut size={18} strokeWidth={1.75} aria-hidden />
            Log out
          </button>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------------------------
// The indexed, one-frame-at-a-time API page.tsx steps through. FLOW_TABS_FRAMES is the ordered list
// (also the source of each frame's short caption); the default export renders exactly the one frame
// at `index`, full width, nothing beside it.
// ---------------------------------------------------------------------------------------------

export const FLOW_TABS_FRAMES: { key: NavKey; caption: string }[] = [
  {
    key: "calendar",
    caption:
      "Calendar, the tab you land on. Who is in a chair, one line for how the day is going, the one thing waiting on a yes or no, the walk-in line, the next two appointments, and this week with a dot on the busy days.",
  },
  {
    key: "clients",
    caption: "Customers. Everyone who has been in, most recent first. Tapping a name opens that person, which is where notes and booking them again live.",
  },
  {
    key: "menu",
    caption: "Menu. The real Solen sections, in two groups, on bare canvas. No platform admin.",
  },
];

export default function FlowTabsFrame({ index }: { index: number }) {
  const frame = FLOW_TABS_FRAMES[index] ?? FLOW_TABS_FRAMES[0]!;
  return (
    <PhoneFrame active={frame.key}>
      {frame.key === "calendar" && <CalendarScreen />}
      {frame.key === "clients" && <CustomersScreen />}
      {frame.key === "menu" && <MenuScreen />}
    </PhoneFrame>
  );
}
