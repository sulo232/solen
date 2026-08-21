// exists-check: `npm run exists host-flows` run this turn, zero matches, safe to build new. The
// route this file will be mounted under does not exist yet either (checked with ls on
// app/[locale]/dev/host-flows/, empty of a page.tsx). The decision this file BUILDS was already made
// and is not re-opened here: _plans/MOBILE_DASHBOARD_2026-08-21.md, "The council's verdict,
// 2026-08-21", read end to end before a line of markup was written. The real dashboard section names
// below were read off `ls app/[locale]/dashboard/` this turn (48 real folders), not guessed and not
// carried over from memory of the verdict's own prose.
//
// Grounded-in: app/[locale]/dev/terminal/Screen.tsx (the bare-row grammar, the 32/16 section
// spacing, the floating tab-bar shape, and the avatar-edge-as-state device all come from this real,
// currently-rendering file, not invented for this one) and app/[locale]/dashboard/ (the live
// directory listing the Menu screen below sorts, read this turn, not recalled from the verdict).
//
// measure-ok: the reference above was read from its SOURCE, not rendered in a browser (this shell
// could not reach localhost this turn, stated plainly rather than claimed otherwise). That is a
// weaker proof than a live measurement, but it is not the same gap the PDP case behind this gate
// named: the PDP complaint was about page-level facts that only exist once rendered (the canvas
// colour ratio across the whole viewport, the size distribution across many elements interacting
// with the cascade). What is borrowed from Screen.tsx here is the opposite kind of fact, literal
// Tailwind utility-class values with no cascade and no runtime computation: `py-4`/`mt-8` spacing,
// `text-[13/15/18/30px]` sizes, `text-s-ink`/`text-s-ink-2` colour tokens, the `shadow-whisper` row
// rung, and the `rounded-full` floating-bar shape. A literal `text-[15px]` in that file's source is
// 15px on the rendered page by construction, Tailwind does not recompute a bracketed pixel value from
// context, so reading it off the source is not an estimate the way eyeballing a screenshot would be.
// Cited from app/[locale]/dev/terminal/Screen.tsx lines 68-85 (the ROW/ROW_BUTTON constants) and the
// floating bar block near the end of that file (`shadow-elevation-2`, `rounded-full`, the nav-button
// sizing), read this turn.
//
// LANGUAGE NOTE, and why the tab names differ from the brief's own wording. The brief that produced
// this file, quoting the council's verdict, names the four tabs in German. This file renders them in
// English instead: the armed `mockup-english-gate.py` refused the write with German tab text
// present ("mockups must be written in ENGLISH... this rule is mockup/dev comparison surfaces only")
// and named its own remedy in the deny text, rewrite the mockup text in English. That gate outranks a
// literal copy match to the brief per this project's own precedence chain (hooks and gates sit above
// a pinned instruction), and the fix it names is exactly what CLAUDE.md's mockup policy already says
// for a hardcoded, non-i18n file: give the English rendering, because the real app would show English
// tab labels on its own /en locale through next-intl, which this static file does not run through.
// So "Today, Calendar, Customers, Menu" below is the /en reading of the same four tabs the brief
// named, not a fifth, different shape. Flagged as a concern in the build report rather than resolved
// silently.
//
// CLASS: operator screen. Governed by TASTE_LOG.md 2026-07-15 (Round D1) plus
// _design-system/TERMINAL_PRINCIPLES.md, per this build's own brief. The customer FLOORS LAW does
// not apply here: no imagery floor, no required semantic-colour moment, no sunken grey tray. White
// canvas only, no dark mode.
//
// JOB, one sentence with a person in it: a salon owner in Basel, mid-Wednesday, picks up her phone
// to see who is in a chair right now, whether anyone still needs a yes or a no, and where the rest
// of the shop's day and its other sections live.
//
// FIXTURE DATA, not wired to anything live. A Basel coiffeur, three stylists (Mia, Nina, Jonas) and a
// normal Wednesday, 19 August 2026. Every number below (chair state, the pending request, the queue,
// today's appointments, the client list, the month grid, the client and month totals) is invented for
// this mockup and stated as such here rather than left for a reader to mistake for a real query. The
// council's own doc frames this stage as M2, a MOCKUP of the tab shape and the menu, before any of it
// touches a real loader.
//
// ANCHOR SENTENCES, written before the markup per TERMINAL_PRINCIPLES section 10 step 4, one per
// frame, each carrying the live (fixture) number and the fixture "column" it would read from once
// wired:
//   Today      "8 appointments today"             a count of TODAY_APPOINTMENTS plus the two
//                                                  stylists currently in a chair (CHAIRS below).
//   Calendar   "156 appointments this month"       MONTH_TOTAL, summed from AUGUST_WEEKS, not typed
//                                                  by hand twice, so the grid and the headline cannot
//                                                  drift apart.
//   Customers  "24 clients"                        CLIENT_TOTAL, a fixture count; six sample rows are
//                                                  shown and the rest are named in one summary line.
//   Menu       no 30px anchor. A menu is navigation, not a state report, so it carries the group
//              labels (13px) and the row labels (15px) only. Adding an anchor here would be a size
//              used once for no role, which section 4 rule 3 of TERMINAL_PRINCIPLES calls a mistake
//              with a number on it.
//
// TARGETS, written before the markup per the same build order:
//   Boxes: ONE kind on the whole file, the "Needs a decision" card on Today (`boxed-ok` on its own
//          line), cap 2 shown (1 used here). Calendar's month grid carries no border of any kind, one
//          hairline separates the weekday-letter row from the dates and nothing else, so there is no
//          container to compete with. Customers and Menu render zero content boxes. Every remaining
//          bordered or shadowed element on the file (the dev-tool frame outline, ROW_BUTTON's own
//          pill border, the client-search input's own border, the floating tab bar's own shadow) is
//          chrome or a standalone control, never a container wrapping grouped rows, and each is
//          marked `boxed-ok` on its own line for the static checker, the same exclusion
//          TERMINAL_PRINCIPLES section 6 gives the terminal's own floating bar.
//   Gaps:  32 between sections (`mt-8`), 16 is not used as a section gap anywhere in this file (row
//          padding uses the terminal's own `py-4` device instead); 12/8/4/2 only inside one block
//          (a title to its sub-line, an icon to its label). The 20px horizontal gutter (`px-5`) and
//          the frame's own top inset are off the layout ladder, per TERMINAL_PRINCIPLES section 3.
//   Type:  4 sizes (13, 15, 18, 30), 2 weights (400, 600). The anchor-to-workhorse ratio is 30/13,
//          2.31x, over the 1.8x floor. This is a tighter budget than the terminal itself currently
//          ships (which admits a third weight as an open defect in its own doc); this file does not
//          repeat that breach.
//
// TONES, and the fixture column each is derived from: the chair indicator is green when
// `stylist.state === "free"` and ink when `"busy"`, mirroring the terminal's own `staffTone`. Nothing
// else on any of the four frames carries colour, because a normal Wednesday with one pending request
// and one twelve-minute wait has very little that needs a person, and TERMINAL_PRINCIPLES section 5
// is explicit that colour is proportional to how much is wrong, not a fixed decoration budget. The
// indicator is a 2px solid border, not a Tailwind `ring` utility, per the no-focus-ring-gate: a real
// border reads as a real border, a `ring-*` class reads as a focus glow regardless of intent.
//
// ELEMENTS ALREADY REPEATED, checked before adding anything new to carry a state (section 5 rule):
// the avatar's own edge (colours the chair state, nothing new added), the row's own hairline
// (separates every list without a card), the chevron already on every Menu and client row (implies
// "opens something" without a second affordance). The one genuinely new element is the ink "Add"
// pill, because nothing already on Today or Calendar could carry "start something new" without being
// mistaken for a state.
//
// ONE INK COMMIT PER SCREEN, a deliberate departure from the terminal's own precedent named here
// rather than silently copied: on the terminal, Accept is the page's one ink fill. On Today, the
// verdict itself names "Add" as this shape's own headline feature (both landing tabs carry one black
// Add), so Add takes the one ink fill on both of those frames and Accept moves to the same white
// hairline rung as Start elsewhere in this system, staying visually primary inside its own card by
// being the only filled pill in that card rather than by being the page's ink colour.
//
// MENU SORTING: the BUSINESS group is the verdict's own list, English labels because this file is a
// hardcoded mockup (CLAUDE.md mockup-english-gate). Platform-admin folders (approvals, all-salons,
// all-users, revenue, commission-admin, platform-analytics, ai-limits-admin, badge-manager,
// content-editor, review-moderation, reports, segments, editor, discovery-admin, homepage-admin,
// cities-admin, salon-of-month-admin, feature-flags-admin, admin-sandbox, cases) are left out by
// name, per the verdict: a salon must never see these. "calendar" and "clients" are not menu rows
// because the verdict promotes both to their own tabs (Calendar, Customers). "messages" is dead
// (REMOVED.md, 2026-06-13) and does not appear. "help-editor" is the verdict's own unclassified
// folder and is left out rather than guessed into a group. "Terminal" is named in the verdict as a
// future row once it graduates out of the dev segment; it has not, so it is not rendered here.
// "Setup" is the verdict's own conditional row (it disappears once the shop goes live); this fixture
// salon is mid-Wednesday with a normal day of bookings, so it is already live and Setup is left out
// for the same reason the verdict gives. The six category-conditional rows (barber-ops,
// barber-clients, nail-admin, nail-clients, spa-admin, coiffeur-crm) are not rendered because this
// fixture's own applicable subset was not specified in the brief and is not guessed here.
//
// VERIFICATION: `npx tsc --noEmit` and `npx eslint` were run against this file this turn (see the
// build report). A local dev server could not be reached from this shell, so nothing below has been
// screenshotted or rendered; that is stated plainly rather than claimed.

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
  Sun,
  Tv,
  Users,
  Wallet,
} from "lucide-react";
import { Avatar } from "@/app/[locale]/_components/primitives";

// ---------------------------------------------------------------------------------------------
// Fixture data. Nothing below reads from a database. A Basel coiffeur, three stylists, a normal
// Wednesday, invented for this mockup only.
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

const PENDING_REQUEST = {
  customer: "Sara Meier",
  service: "Balayage",
  time: "15:30",
  askedMinutesAgo: 6,
};

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
// appointments booked that day, per the verdict's own correction (a salon's number is a count, not
// a price, the price lives on the service). Sundays render 0, this salon is closed Sundays.
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
// anywhere in this file, including the dev-tool frame captions below.
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

type NavKey = "today" | "calendar" | "clients" | "menu";

// English tab labels. The brief and the council's verdict name these four tabs in German (see the
// LANGUAGE NOTE above); this file renders the /en reading because the armed mockup-english-gate
// refuses hardcoded German in a dev/mockup surface.
const TABS: { key: NavKey; label: string; icon: LucideIcon }[] = [
  { key: "today", label: "Today", icon: Sun },
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
// button, just the viewport bounds so four screens can sit side by side without their content
// bleeding into one another. 390x844 matches TERMINAL_PRINCIPLES's own measurement viewport.
function PhoneFrame({ caption, active, children }: { caption: string; active: NavKey; children: React.ReactNode }) {
  return (
    <figure className="shrink-0">
      <figcaption className="font-body mb-3 text-[13px] font-semibold text-s-ink-2">{caption}</figcaption>
      <div className="relative h-[844px] w-[390px] overflow-hidden border border-s-border bg-white"> {/* boxed-ok: dev-tool viewport boundary only, not a content card; every list inside is separated by its own row hairline instead. */}
        <div className="flex h-full flex-col overflow-y-auto">
          <ChromeHeader />
          {/* The scroll container's own bottom padding clears the floating bar plus one gap-ladder
              step (TERMINAL_PRINCIPLES section 3), so the last row is never hidden behind it. */}
          <div className="flex-1 pb-24">{children}</div>
        </div>
        <TabBar active={active} />
      </div>
    </figure>
  );
}

// ---------------------------------------------------------------------------------------------
// Frame 1: Today, the landing tab.
// ---------------------------------------------------------------------------------------------

function TodayScreen() {
  return (
    <>
      {/* Who is in a chair right now. The board's own answer to that question, painted with
          people: a name and a face, not a slot. */}
      <div className="overflow-x-auto">
        <div className="flex gap-4 px-5 pb-1 pt-5">
          {CHAIRS.map((stylist) => (
            <div key={stylist.name} className="flex w-[104px] shrink-0 flex-col items-center text-center">
              {/* The chair state lives on the avatar's own edge, a real 2px border (never a Tailwind
                  `ring` utility, which the focus-ring gate treats as a glow regardless of intent). */}
              <span
                className={
                  "flex h-[64px] w-[64px] items-center justify-center rounded-full border-2 " +
                  (stylist.state === "busy" ? "border-s-ink" : "border-s-success")
                }
              >
                <Avatar name={stylist.name} size={56} />
              </span>
              <p className="font-body mt-2 w-full truncate text-[13px] font-normal text-s-ink">
                {stylist.name.split(" ")[0]}
              </p>
              {/* Neutral text under a coloured edge, the edge is the only indicator, per
                  TERMINAL_PRINCIPLES section 2 rule 7: a state is reported in one place. */}
              <p className="font-body w-full truncate text-[13px] font-normal text-s-ink-2">
                {stylist.state === "free" ? "Free" : `${stylist.customer}, ${stylist.minutesLeft}m`}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* The anchor. One sentence, the live number inside it, plus the one ink commit for this
          screen: Add, pre-filled to open a walk-in from wherever you are standing. */}
      <div className="flex items-start justify-between px-5 pt-8">
        <div className="min-w-0">
          <h1 className={ANCHOR}>{TODAY_TOTAL} appointments today</h1>
          <p className={SUBLINE}>CHF {TAKEN_SO_FAR} taken so far.</p>
        </div>
        <button type="button" aria-label="Add a walk-in" className={INK_PILL + " mt-1"}>
          <Plus size={16} strokeWidth={2} aria-hidden />
          Add
        </button>
      </div>

      {/* The one thing on this screen sitting on a yes or a no. */}
      <div className="mt-8 px-5">
        <p className="font-body pb-3 text-[13px] font-semibold text-s-ink-2">Needs a decision (1)</p>
        <div className="rounded-[24px] border border-s-border p-4"> {/* boxed-ok: the one earned box on this file, CONTAINER TEST case 2, a peer item that will not resolve itself if nobody acts, capped at 2, one shown. */}
          <p className="font-body text-[15px] font-normal text-s-ink">{PENDING_REQUEST.customer}</p>
          <p className={ROW_SUB}>
            {PENDING_REQUEST.service} at {PENDING_REQUEST.time}, asked {PENDING_REQUEST.askedMinutesAgo} min ago
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

      {/* Who is waiting, and how long. */}
      <div className="mt-8">
        <p className={SECTION}>Waiting</p>
        <div className={ROW}>
          <div className="min-w-0 flex-1">
            <p className={ROW_NAME}>{WAITING.customer}</p>
            <p className={ROW_SUB}>
              {WAITING.service}, waiting {WAITING.waitedMinutes} min
            </p>
          </div>
          <button type="button" className={ROW_BUTTON}>
            Start
          </button>
        </div>
      </div>

      {/* The rest of today's book, in time order, each with a one-tap arrival. */}
      <div className="mt-8">
        <p className={SECTION}>Coming up today</p>
        <ul>
          {TODAY_APPOINTMENTS.map((appt) => (
            <li key={appt.time + appt.customer} className={ROW}>
              <span className="font-body w-[44px] shrink-0 text-[13px] font-normal tabular-nums text-s-ink-2">
                {appt.time}
              </span>
              <div className="min-w-0 flex-1">
                <p className={ROW_NAME}>{appt.customer}</p>
                <p className={ROW_SUB}>
                  {appt.service}, CHF {appt.price}
                </p>
              </div>
              {appt.arrivedAt ? (
                <span className="font-body shrink-0 text-[13px] font-normal tabular-nums text-s-ink-2">
                  here {appt.arrivedAt}
                </span>
              ) : (
                <button type="button" className={ROW_BUTTON}>
                  Arrived
                </button>
              )}
            </li>
          ))}
        </ul>
        <p className={QUIET_LINE + " pt-4"}>{MORE_TODAY_COUNT} more today.</p>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------------------------
// Frame 2: Calendar. Every day that is not today, months stacking with a count under every date.
// No card and no grid lines: one hairline separates the weekday letters from the dates, and that is
// the only border in this frame.
// ---------------------------------------------------------------------------------------------

function CalendarScreen() {
  return (
    <>
      <div className="flex items-start justify-between px-5 pt-8">
        <div className="min-w-0">
          <h1 className={ANCHOR}>{MONTH_TOTAL} appointments this month</h1>
          <p className={SUBLINE}>August 2026. Tap a date to open it.</p>
        </div>
        <button type="button" aria-label="Add an appointment on this day" className={INK_PILL + " mt-1"}>
          <Plus size={16} strokeWidth={2} aria-hidden />
          Add
        </button>
      </div>

      <div className="mt-8 px-5">
        <div className="grid grid-cols-7 border-b border-s-border pb-2">
          {WEEKDAY_LETTERS.map((day) => (
            <div key={day} className="font-body text-center text-[13px] font-semibold text-s-ink-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {AUGUST_WEEKS.flat().map((cell, i) => (
            <div key={i} className="flex h-[52px] flex-col items-center justify-center gap-0.5">
              {cell && (
                <>
                  {cell.date === TODAY_DATE ? (
                    <span className="font-body flex h-6 w-6 items-center justify-center rounded-full bg-s-ink text-[13px] font-semibold tabular-nums text-white">
                      {cell.date}
                    </span>
                  ) : (
                    <span className="font-body text-[13px] font-normal tabular-nums text-s-ink">{cell.date}</span>
                  )}
                  <span className="font-body text-[13px] font-normal tabular-nums text-s-ink-2">
                    {cell.count > 0 ? cell.count : ""}
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <p className={QUIET_LINE + " mt-8"}>The cell for today opens Today. It is never drawn twice.</p>
    </>
  );
}

// ---------------------------------------------------------------------------------------------
// Frame 3: Customers. One person at a time, starting from the directory.
// ---------------------------------------------------------------------------------------------

function CustomersScreen() {
  return (
    <>
      <div className="px-5 pt-8">
        <h1 className={ANCHOR}>{CLIENT_TOTAL} clients</h1>
        <p className={SUBLINE}>Their visits, notes and a way to book them again.</p>
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
// Frame 4: Menu. Plain rows, a line icon, a label, a chevron, on bare canvas, two labelled groups,
// a black log out button at the bottom.
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
      <div className="mt-6">
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
// The four frames, side by side, plus the two things the brief asked to be visible in every one of
// them: the bottom bar itself, and what that tab actually lands on.
// ---------------------------------------------------------------------------------------------

export default function FlowTabs() {
  return (
    <div className="min-h-screen w-full bg-white py-10">
      <div className="px-6">
        <p className="font-body text-[13px] font-semibold text-s-ink-2">
          Flow 1: the tabs and the menu. Four phone-sized frames, 390 wide each, no fake phone.
        </p>
      </div>
      <div className="mt-6 flex gap-8 overflow-x-auto px-6 pb-4">
        <PhoneFrame caption="1. Today, landing tab" active="today">
          <TodayScreen />
        </PhoneFrame>
        <PhoneFrame caption="2. Calendar" active="calendar">
          <CalendarScreen />
        </PhoneFrame>
        <PhoneFrame caption="3. Customers" active="clients">
          <CustomersScreen />
        </PhoneFrame>
        <PhoneFrame caption="4. Menu" active="menu">
          <MenuScreen />
        </PhoneFrame>
      </div>
    </div>
  );
}
