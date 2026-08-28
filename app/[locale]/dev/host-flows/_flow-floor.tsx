/**
 * exists-check: net-new vs `_flow-phone.tsx` (a different flow in this folder, phone booking, no
 * floor plan), `_plans/DASHBOARD_OVERHAUL.md` and `docs/roadmaps/02-salon-cards.md` (dashboard and
 * card-listing roadmaps, greps for "floor", "chair position" and "placement" against both return
 * nothing), `scripts/check-trust-floor.mjs` (a payment trust-floor checker, "floor" collision only),
 * `_design-system/TERMINAL_PRINCIPLES.md` (cited below, the LAW this file follows, not a screen to
 * duplicate), `_roadmaps/roadmap-salon-onboarding.md` and `app/api/cron/salon-onboarding/route.ts`
 * (the "onboarding" keyword collision, both greps for "floor"/"chair position"/"placement" return
 * nothing, and neither one stores or renders a position). `_plans/SALON_FLOOR_2026-08-27.md` is
 * the real match, quoted throughout below because it is the brief this file was built against.
 *
 * Grounded-in: app/[locale]/dev/host-flows/_flow-empty.tsx (the phone-frame shell this file's
 * `ScreenShell` copies verbatim: h-[844px] w-full max-w-[390px], rounded-[20px] bezel, salon name
 * as chrome). Also grounded in app/[locale]/dev/host-flows/page.tsx (the h-11 rounded-full
 * icon-button recipe this file reuses for the chair-count stepper), app/api/salon/chairs/route.ts
 * and lib/validations.ts (`barberChairsSchema`, the real 1-to-20 cap Frame 3 stays inside), and
 * _design-system/TERMINAL_PRINCIPLES.md (the operator law this whole file follows). There is no
 * existing SALON FLOOR PLAN surface to capture a real route from, this is the one genuinely new
 * piece per the exists-check above (`npm run exists "floor plan"` = 0 this turn); what is grounded
 * is every recipe borrowed from a surface that already exists, not a page this file recreates.
 *
 * DEV mockup, the salon floor as a plan: chairs drawn where they really sit, not a list of cards.
 * `_plans/SALON_FLOOR_2026-08-27.md` is the brief this was built against, read in full this turn.
 *
 * His words, dictated 2026-08-27: "i want ths view too when its open like smth similar to ths n
 * when u set up u need to like put placement of chairs n allat n then u can see yk and instead of
 * the airplane like chairs or maybe square and lke on onboarding they select how many chairs is
 * there and then yk there is alrdy few templates but they can select em theymsleves and move arnd
 * abit yk allat acc think it trough and build me a mockuo the 2 refference are in teh download
 * file".
 *
 * THE REFERENCE, read not guessed: two Instagram screenshots of a Dribbble piece, "Aircraft
 * Dashboard Concept" by @sogasoux. A white aircraft drawn side-on, a grid of cargo positions
 * numbered 01 to 09 laid over it, one filled cell shown pale green. THE ONE IDEA WORTH COPYING,
 * and nothing else on either screenshot is the idea: it draws the physical object and puts its
 * contents in their real places on it, position 03 sits next to 04 on screen because it sits next
 * to it on the plane. `measure-ok`: no pixel dimension below is measured off that reference, on
 * purpose, per the brief's own instruction ("copy the spatial idea, nothing else"; the reference
 * itself is a dark glassy desktop dashboard, a different device class and theme this product does
 * not use). Every size in this file instead derives from THIS product's own container width, shown
 * worked in "THE GRID ARITHMETIC" below.
 *
 * EXISTS-CHECK, run this turn per the brief, quoted rather than re-run: `npm run exists chair`,
 * 11 hits. `barber_chairs` TABLE EXISTS (0 rows, RLS on) with `chair_count`, a shipped GET and PUT
 * at `app/api/salon/chairs/route.ts`, and `barberChairsSchema` (`lib/validations.ts:734`) caps it
 * 1 to 20. So HOW MANY CHAIRS is already built and already saved, and this file's chair-count step
 * (Frame 3) never promises a number that schema cannot hold. `npm run exists station` returns the
 * same shape a second time for nail salons (`nail_stations.station_count`, capped 1 to 50).
 * `npm run exists "floor plan"` returns zero: no layout, no position, nothing spatial anywhere in
 * the product. **So the net-new piece here is exactly one thing: WHERE each chair is.** Everything
 * else below extends a shipped concept rather than inventing one.
 * `public/_mockups/dashboard-overhaul/chairs.html` is NOT this: it is a grid of chair CARDS with a
 * hero size modifier, cards in a list, not chairs in a room. A graveyard hit binds this build:
 * REMOVED.md, owner 2026-07-15, verbatim: "i hate that... this left side green thingy. never do
 * this ever", against a coloured left-edge accent bar marking an occupied chair. Nothing below
 * carries a coloured edge of any kind; occupied is a fill plus text, exactly as the graveyard entry
 * requires. A second graveyard hit, "chairs pinned on top with the day scrolling below", does NOT
 * block this: it was a focus decision on the terminal's now-and-next strip, a different shape from
 * a plan of the room, and he asked for this one by name this turn, which is the owner yes the
 * graveyard itself asks for.
 *
 * WHY A ROUNDED SQUARE, NOT A CHAIR PICTOGRAM, argued from first principles rather than asserted:
 * at the roughly 76px this tile renders at, a chair glyph is unreadable line noise, and every
 * chair glyph looks like every other chair glyph, so the icon carries zero information regardless
 * of how well it is drawn. A plain rounded square carries none of that decorative cost and buys
 * two real facts in the same footprint: the customer's name and the time left, which is the exact
 * pair of things a host glancing at the floor from across the room actually needs. Taste rule 2
 * (CLAUDE.md, "no decorative artifacts"): every element carries information or it gets deleted. A
 * chair icon here fails that test; a square holding a name and a number passes it.
 *
 * SCREEN CLASS: operator screen. Governed by `_design-system/TERMINAL_PRINCIPLES.md` and the
 * merchant round in `TASTE_LOG.md` 2026-07-15 (Round D1), not the customer FLOORS LAW: no imagery
 * floor, no required semantic-colour moment, no sunken-tray-as-canvas rule (that rule is what
 * produced the grey background rejected by name on the terminal, TERMINAL_PRINCIPLES.md section 1;
 * this file's canvas is plain white throughout, the sunken token is used only as the LOCKED
 * occupied-fill inside a chair tile, never as the page background). D1's law as it binds this file:
 * one carded hero per screen (the room plan), everything else bare text on white; binary 16 and 32
 * gaps only; one pill spec per selectable context, no pill inside a pill; a person appears in
 * exactly one place.
 *
 * A NAMING NOTE FOR A READER OF THIS FILE, not a taste call: the chair tapped open in Frame 2 and
 * the chair picked up in Frame 5 are both called by a FOCUS/HOLD name (`focusId`, `heldId`),
 * deliberately never `selected`. That word is reserved in this codebase for a persistent choice
 * among peer options (a filter pill, a tab, a template), which the locked selected-state recipe
 * governs (calm gray fill, `no-black-selected-gate`). Tapping one chair to inspect it, or picking
 * one up to move it, is a different thing, a transient pointer to a single real object, not a
 * choice among alternatives, so it earns its own ink-border-plus-lift treatment (Frame 5's literal
 * spec) rather than borrowing a vocabulary that means something else.
 *
 * A STATUTORY COLLISION SURFACED RATHER THAN SMOOTHED OVER (CLAUDE.md precedence tier 2 outranks a
 * literal instruction below it): the brief's own words for a running-over chair are "text-s-error
 * TEXT", and an occupied chair's fill is "bg-s-bg-sunken". Measured independently this turn (sRGB
 * relative-luminance, not read off a doc): `#DC2626` on `#F4F4F5` is 4.39:1, under the 4.5:1 WCAG
 * AA floor for normal-size text; the same red on white is 4.83:1, well clear. None of this file's
 * four approved sizes (13/15/18/30) reaches the WCAG large-text exemption either (18.7px bold or
 * 24px normal), so no size choice rescues it. The fix below keeps the tile itself
 * `bg-s-bg-sunken` (the occupied signal stays intact, never a second fill for a sub-state) and
 * gives ONLY the over-time sub-label a small white pill behind the red text, matching the already-
 * locked "inline status chip" pattern (pale/white background plus saturated text) rather than
 * inventing a new device. Colour stays on the TEXT, exactly as asked; the background beneath it is
 * the a11y fix.
 *
 * TYPE BUDGET, verified across this whole file: four sizes, 13/15/18/30, matching the folder
 * ceiling exactly, no fifth introduced. Two weights, the Tailwind default (400, no explicit class)
 * and `font-semibold` (600); nothing else. The 18px salon-name line is CHROME on every frame, not
 * an anchor, mirroring how TERMINAL_PRINCIPLES.md section 2 describes the identical role. Each
 * frame that needs a true anchor (Frame 1's headline, Frame 3's chair count) carries exactly one
 * 30px element and never two, per that same section's "one anchor, never two."
 *
 * THE GRID ARITHMETIC, RECOMPUTED after a reviewer round caught the first version undercounting a
 * padding, reused unchanged for the live plan (Frame 1 and 2), the setup floor editor (Frame 5) and
 * the template thumbnails (Frame 4). THE ORIGINAL VERSION OF THIS PARAGRAPH COUNTED ONE PADDING
 * WHERE THERE ARE ACTUALLY TWO, PLUS TWO BORDERS, said plainly rather than smoothed over: it stopped
 * at page.tsx's own `px-4` (390 - 32 = 358) and treated that as the room's interior. The real chain,
 * every box here `box-sizing: border-box` per `globals.css`, so a border eats into the interior
 * rather than adding to the outside: page.tsx pads its outer shell `px-4` (390 - 32 = 358), THEN
 * this file's own `ScreenShell` outer div takes its own 1px border before its `px-4` padding even
 * starts (358 - 2 - 32 = 324), THEN the room card's own 1px border takes 2 more (324 - 2 = 322).
 * The true floor is roughly 322px at a 390 viewport, not 358px, so the old hardcoded `w-[352px]`
 * grid (four 76px tiles plus three 16px gaps: 4 x 76 + 3 x 16 = 352) overhung the real room by
 * roughly 30px: the outermost chair in each row rendered outside the drawn wall at a 390 viewport
 * and clipped outright at 375 and 360. THE FIX removes the fixed width rather than replacing it
 * with a better-guessed one: every grid that lays out chairs is `grid w-full grid-cols-4 gap-4`,
 * and every chair tile is `aspect-square w-full` in place of `h-[76px] w-[76px]` (radius stays
 * `rounded-[12px]`, the LOCKED input radius, unchanged). Four tiles and three 16px gaps then divide
 * whatever width the room card actually has, at any viewport, with nothing left to recompute and
 * nothing left to clip; the exact figure above (roughly 322px, roughly 68.5px per tile) is a
 * computed prediction from the CSS box model, not a number this fix depends on being exactly right,
 * which is the entire point of making the grid fluid. STATED PLAINLY: this pass could not reach the
 * running dev server through a browser tool to confirm the figure with a live `getBoundingClientRect`
 * reading (see VERIFICATION below); the fluid grid is correct by construction regardless, but the
 * exact pixel number here is unverified against the render and should be treated as computed, not
 * measured, until someone runs that check. The door/waiting strip inside `RoomFrame` used to borrow
 * the tile's own dead `h-[76px]` so its row would line up; it now carries its own `py-4` instead, so
 * it no longer depends on a tile height that no longer exists. The live plan still uses 8 chairs,
 * four along the top wall and four along the bottom, with the middle row left open as real floor
 * space; the setup editor (Frame 5) and the template thumbnails (Frame 4) now derive their row and
 * column counts from the same `rowsFor` / `cellOrder` / `layoutFor` functions (see the D3 fix note
 * further down), rather than a second hand-drawn copy of this same layout that could silently drift
 * from it.
 *
 * THE GAP LADDER, binary 16 and 32 only, per this file's own operator-screen law (TASTE_LOG.md
 * 2026-07-15 Round D1) which a reviewer round caught this file claiming to follow while shipping
 * five `mt-6` (24px) section transitions, a `gap-6` stepper and a `gap-3` thumbnail gap, none of
 * them legal. The distinction that decides which of the two a given gap must be: a BETWEEN-GROUP
 * gap, where a screen moves from one distinct block to the next (an anchor sentence to the room
 * below it, a frame's own content to the divider before its detail panel, one setup control to its
 * neighbour), takes `mt-8` / `gap-8` (32px). A label sitting directly under the number or name it
 * belongs to (the "m left" sub-label under a customer name, a title's own one-line description) is
 * one unit of meaning, not two blocks, and keeps its own tight sub-line leading (`mt-0.5`, `mt-1`,
 * `mt-1.5`, `gap-0.5`, `gap-1`, `gap-1.5`, all left untouched by this fix). Nothing in this file
 * uses any other `mt-*` or `gap-*` value.
 *
 * OUT OF SCOPE this turn, said plainly per the brief: no migration, no API change, no wiring to
 * real data, no change to the two existing chair/station count endpoints. Every position and every
 * occupancy value below lives in a named fixture constant or in this file's own component state,
 * never invented inline in JSX, and resets when the flow switcher mounts a different frame; nothing
 * here persists, which is correct for a mockup he reacts to before anything is built for real.
 *
 * White canvas only, no dark mode; tokens throughout, no raw hex; English copy; real lucide-react
 * icons only; no em dash, en dash or middot anywhere in this file, including this comment.
 * `h-[844px] w-full max-w-[390px]` on every frame, never a hard `w-[390px]`.
 *
 * VERIFICATION: `npx tsc --noEmit -p tsconfig.json` was run against this file this turn and printed
 * nothing for it. STATED PLAINLY, not smoothed over: this pass did not have a browser tool available
 * to reach the already-running dev server (Bash `curl` to a local address returns 000 in this shell,
 * confirmed this turn, so a live render was not screenshotted or measured here). Every number in
 * this file's header is therefore a computed prediction from the CSS box model and the component
 * tree, not a live `getBoundingClientRect` reading. The fixes below (fluid grids, hoisted state,
 * wired taps) are correct by construction and were typechecked, but D2's exact pixel figures, D3's
 * rendered chair positions and D6's tap behaviour still need a live render to confirm.
 */
"use client";

import { useState, type ReactNode } from "react";
import { Check, DoorOpen, Minus, Plus, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const SALON_NAME = "Studio Nord";
const SALON_CITY = "Zurich";
const WAITING_COUNT = 3;

// One chair position on the live floor. A free chair carries no service data at all (the type
// says so, not just convention), so a component cannot accidentally read a name off an empty
// chair. See the file header for why this is a discriminated union rather than optional fields.
type ChairFixture =
  | { id: number; state: "free" }
  | {
      id: number;
      state: "occupied";
      customerName: string;
      service: string;
      stylistName: string;
      minutesLeft: number; // negative = minutes over
      startedAt?: string;
      doneBy?: string;
    };

// The live floor, named fixture data per the no-fabrication rule. Order matters: the first four
// render along the top wall, the last four along the bottom wall (see RoomFrame below), matching
// the grid arithmetic in the file header. 5 occupied, 3 free, one running over, one detailed in
// Frame 2 (id 2, Mia, the only chair carrying startedAt/doneBy since it is the only one shown).
const CHAIRS_LIVE: ChairFixture[] = [
  { id: 1, state: "occupied", customerName: "Elif", service: "Cut", stylistName: "Noah", minutesLeft: 12 },
  {
    id: 2,
    state: "occupied",
    customerName: "Mia",
    service: "Color",
    stylistName: "Sara",
    minutesLeft: 18,
    startedAt: "2:10 PM",
    doneBy: "2:55 PM",
  },
  { id: 3, state: "free" },
  { id: 4, state: "occupied", customerName: "Jonas", service: "Beard trim", stylistName: "Noah", minutesLeft: -8 },
  { id: 5, state: "free" },
  { id: 6, state: "occupied", customerName: "Priya", service: "Cut", stylistName: "Sara", minutesLeft: 5 },
  { id: 7, state: "occupied", customerName: "Tom", service: "Cut and beard", stylistName: "Noah", minutesLeft: 20 },
  { id: 8, state: "free" },
];

/** The phone-frame shell every one of the five frames renders inside, matching the exact recipe
 *  `_flow-empty.tsx` already uses (h-[844px] w-full max-w-[390px], rounded bezel, salon name as
 *  chrome). `chromeSub` carries the one thing that differs between a live-floor frame and a setup
 *  step: "Zurich, open now" versus "Setting up, step N of 3". `flex-1 flex-col` on the content
 *  wrapper lets a setup frame vertically centre its own content by adding `justify-center` where it
 *  needs to, without duplicating this shell. */
function ScreenShell({ chromeSub, children }: { chromeSub: string; children: ReactNode }) {
  return (
    <div className="h-[844px] w-full max-w-[390px] overflow-hidden rounded-[20px] border border-s-border bg-white">
      <div className="flex h-full flex-col overflow-y-auto px-4 pb-8 pt-6">
        <p className="font-display text-[18px] text-s-ink">{SALON_NAME}</p>
        <p className="mt-0.5 font-body text-[13px] text-s-ink-2">{chromeSub}</p>
        <div className="mt-8 flex flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}

/** One chair on the live floor. Free chairs are quiet: white, a hairline, just the number, in
 *  ink-2 (LOCKFILE's one token authorised for non-load-bearing text). Occupied chairs are the
 *  locked selected-state fill (bg-s-bg-sunken + ink text) reused as the occupancy signal rather
 *  than invented fresh, per CLAUDE.md floor 9. A chair running over gets a white pill behind its
 *  red sub-label only, the a11y fix explained in the file header; the tile's own fill never
 *  changes, so occupied always reads as occupied at a glance regardless of timing state.
 *  `focused` adds a full ink border for Frame 2's tap-in (a FOCUS ring on one real object, not a
 *  selected-among-peers state, see the file header's naming note), never a coloured edge, per the
 *  graveyard entry quoted above. `onTap`, when passed, renders the tile as a real button (Frame 2);
 *  when it is absent (Frame 1) the tile stays a plain div with no click affordance at all, so a
 *  screen that cannot act on a chair never looks like it can. Both branches build their border with
 *  a single ternary, never two competing border utilities in one string: this codebase's `cn` is
 *  plain clsx with no tailwind-merge, so `border border-s-border` and `border-2 border-s-ink`
 *  emitted together would both land in the DOM and the later one would not reliably win. */
function ChairTile({
  chair,
  focused,
  onTap,
}: {
  chair: ChairFixture;
  focused?: boolean;
  onTap?: (id: number) => void;
}) {
  if (chair.state === "free") {
    const className = cn(
      "flex aspect-square w-full items-center justify-center rounded-[12px] bg-white",
      focused ? "border-2 border-s-ink" : "border border-s-border",
    );
    const inner = <span className="font-body text-[13px] text-s-ink-2">{chair.id}</span>;
    if (!onTap) return <div className={className}>{inner}</div>;
    return (
      <button type="button" aria-label={`Chair ${chair.id}, free`} onClick={() => onTap(chair.id)} className={className}>
        {inner}
      </button>
    );
  }
  const over = chair.minutesLeft < 0;
  const className = cn(
    "flex aspect-square w-full flex-col items-center justify-center gap-0.5 rounded-[12px] bg-s-bg-sunken px-1 text-center",
    focused ? "border-2 border-s-ink" : "",
  );
  const inner = (
    <>
      <span className="w-full truncate font-body text-[13px] font-semibold text-s-ink">{chair.customerName}</span>
      {over ? (
        <span className="w-full truncate rounded-full bg-white font-body text-[13px] text-s-error">
          {Math.abs(chair.minutesLeft)}m over
        </span>
      ) : (
        <span className="w-full truncate font-body text-[13px] text-s-ink-2">{chair.minutesLeft}m left</span>
      )}
    </>
  );
  if (!onTap) return <div className={className}>{inner}</div>;
  return (
    <button
      type="button"
      aria-label={`Chair ${chair.id}, ${chair.customerName}`}
      onClick={() => onTap(chair.id)}
      className={className}
    >
      {inner}
    </button>
  );
}

/** The room itself: a bordered rectangle (the one carded hero this screen is allowed, D1), chairs
 *  in their real places, a door mark and a waiting count filling the open floor between the two
 *  walls. `chairs` must carry exactly 8 entries (see the grid arithmetic in the file header); the
 *  first four render along the top wall, the last four along the bottom, relying on CSS grid's own
 *  source-order auto-flow rather than manual row/column placement, which is what keeps this
 *  component free of inline styles entirely. The grid is fluid (`w-full`, tiles `aspect-square
 *  w-full`) rather than a fixed pixel width, so it always exactly fills the room card's real inner
 *  width at any viewport instead of a guessed number that can overhang or clip (file header, D2).
 *  `onTapChair`, when passed, is forwarded to every tile so the caller decides whether this room is
 *  tappable (Frame 2) or a plain picture (Frame 1). */
function RoomFrame({
  chairs,
  focusId,
  onTapChair,
}: {
  chairs: ChairFixture[];
  focusId?: number;
  onTapChair?: (id: number) => void;
}) {
  return (
    <div className="rounded-card border border-s-border py-4">
      <div className="grid w-full grid-cols-4 gap-4">
        {chairs.slice(0, 4).map((chair) => (
          <ChairTile key={chair.id} chair={chair} focused={chair.id === focusId} onTap={onTapChair} />
        ))}
        <div className="col-span-4 flex items-center justify-between px-1 py-4">
          <span className="flex items-center gap-1.5 font-body text-[13px] text-s-ink-2">
            <DoorOpen size={14} strokeWidth={2} aria-hidden />
            Door
          </span>
          <span className="flex items-center gap-1.5 font-body text-[13px] text-s-ink-2">
            <Users size={14} strokeWidth={2} aria-hidden />
            {WAITING_COUNT} waiting
          </span>
        </div>
        {chairs.slice(4, 8).map((chair) => (
          <ChairTile key={chair.id} chair={chair} focused={chair.id === focusId} onTap={onTapChair} />
        ))}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="font-body text-[13px] text-s-ink-2">{label}</span>
      <span className="font-body text-[13px] text-s-ink">{value}</span>
    </div>
  );
}

/** Frame 1, the headline: the floor while the salon is open. One 30px anchor sentence, bare on the
 *  canvas per D1, then the room. */
function ScreenOpen() {
  const busy = CHAIRS_LIVE.filter((c) => c.state === "occupied").length;
  const free = CHAIRS_LIVE.length - busy;
  return (
    <ScreenShell chromeSub={`${SALON_CITY}, open now`}>
      <p className="font-display text-[30px] font-semibold leading-tight tracking-[-0.02em] text-s-ink">
        {busy} of {CHAIRS_LIVE.length} chairs are busy
      </p>
      <p className="mt-1.5 font-body text-[13px] text-s-ink-2">{free} free right now.</p>
      <div className="mt-8">
        <RoomFrame chairs={CHAIRS_LIVE} />
      </div>
    </ScreenShell>
  );
}

/** Frame 2, tapping a chair. `focusChairId` is real state now (D6): it opens on chair 2 (Mia,
 *  matching the copy this file's own frame caption promises) but tapping any OTHER chair in the
 *  room, free or occupied, moves the focus there and the panel below updates to match, because
 *  `RoomFrame` is given `onTapChair={setFocusChairId}` here. The person appears in exactly one
 *  place (TERMINAL_PRINCIPLES.md section 2.7): the focused chair's name is already on the tile, so
 *  the panel below deliberately never repeats it, in a heading or otherwise, it only adds the facts
 *  the tile has no room for. ONE action: "Mark as done", not "add time" or "edit". Chosen because it
 *  is the action that actually keeps the floor accurate, which is this whole screen's job;
 *  extending a running service resolves nothing, while checking a finished one out is the single
 *  most common thing a host does when they glance at an occupied chair. The action is wired to real
 *  state (not a decorative button) so tapping it is something he can actually try, matching the same
 *  "no dead click" bar `_flow-calendar.tsx` already sets in this folder. */
function ScreenChair() {
  const [chairs, setChairs] = useState<ChairFixture[]>(CHAIRS_LIVE);
  const [focusChairId, setFocusChairId] = useState(2);
  const chair = chairs.find((c) => c.id === focusChairId)!;

  function markDone() {
    setChairs((prev) => prev.map((c) => (c.id === focusChairId ? { id: c.id, state: "free" as const } : c)));
  }

  return (
    <ScreenShell chromeSub={`${SALON_CITY}, open now`}>
      <RoomFrame chairs={chairs} focusId={focusChairId} onTapChair={setFocusChairId} />
      {chair.state === "occupied" ? (
        <div className="mt-8 border-t border-s-border pt-1">
          <div className="divide-y divide-s-border">
            <DetailRow label="Service" value={chair.service} />
            <DetailRow label="Stylist" value={chair.stylistName} />
            <DetailRow label="Started" value={chair.startedAt ?? "Not set"} />
            <DetailRow label="Done by" value={chair.doneBy ?? "Not set"} />
          </div>
          <button
            type="button"
            onClick={markDone}
            className="mt-4 flex h-11 w-full items-center justify-center gap-1.5 rounded-btn bg-s-ink font-body text-[15px] font-semibold text-white"
          >
            Mark as done
            <Check size={16} strokeWidth={2.25} aria-hidden />
          </button>
        </div>
      ) : (
        <p className="mt-8 border-t border-s-border pt-4 font-body text-[13px] text-s-ink-2">
          Chair {focusChairId} is free.
        </p>
      )}
    </ScreenShell>
  );
}

type FloorPos = { row: number; col: number };
type TemplateId = "one-wall" | "two-walls" | "l-shape" | "island";

// The room is always 4 columns across (the grid arithmetic in the file header); only the row count
// varies per template and per chair count, computed below.
const FLOOR_COL_COUNT = 4;
const FLOOR_COLS = [0, 1, 2, 3];

/** The state Frame 3, 4 and 5 all share, lifted into `FlowFloor`'s default export (D3 fix note
 *  below) instead of living in each screen's own local `useState`, which is what let picking a
 *  different template do nothing: `FloorEditor` used to always read a single hardcoded
 *  `MOVE_START` regardless of which template was chosen or how many chairs were counted. `page.tsx`
 *  keeps this same `FlowFloor` instance mounted across every frame and only changes `index`, so
 *  state lifted here survives stepping between frames instead of resetting on every remount. */
interface SetupScreenProps {
  count: number;
  onChangeCount: (next: number) => void;
  templateId: TemplateId;
  onChangeTemplate: (id: TemplateId) => void;
  positions: Record<number, FloorPos>;
  onMovePosition: (id: number, pos: FloorPos) => void;
}

/** Frame 3, setup step one: how many chairs. Plain and large, centred, one line saying what the
 *  number is for and naming the real cap (`barberChairsSchema`, 1 to 20) so this mockup never
 *  promises a value the shipped schema cannot hold. `count` and `onChangeCount` come from the
 *  hoisted state (D3) so the number chosen here survives stepping to Frame 4 and Frame 5 instead of
 *  resetting every time this screen remounts. */
function ScreenCount({ count, onChangeCount }: SetupScreenProps) {
  return (
    <ScreenShell chromeSub="Setting up, step 1 of 3">
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="flex items-center gap-8">
          <button
            type="button"
            aria-label="Fewer chairs"
            disabled={count <= 1}
            onClick={() => onChangeCount(Math.max(1, count - 1))}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-s-border text-s-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Minus size={18} strokeWidth={2} aria-hidden />
          </button>
          <span className="font-display text-[30px] font-semibold tracking-[-0.02em] tabular-nums text-s-ink">
            {count}
          </span>
          <button
            type="button"
            aria-label="More chairs"
            disabled={count >= 20}
            onClick={() => onChangeCount(Math.min(20, count + 1))}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-s-border text-s-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={18} strokeWidth={2} aria-hidden />
          </button>
        </div>
        <p className="mt-4 font-body text-[13px] text-s-ink-2">This is how many chairs your salon has, up to 20.</p>
      </div>
    </ScreenShell>
  );
}

/** D3 FIX. Before this pass, four hardcoded `boolean[][]` thumbnail patterns and a single
 *  hardcoded `MOVE_START` record were the only two places a layout lived, and neither one read
 *  `count` or `templateId`: `FloorEditor` always seeded from `MOVE_START`, and `TemplateThumb` drew
 *  a fixed picture that could silently drift from what picking it actually produced. These three
 *  pure functions are now the one source the thumbnail, the editor and the row count all derive
 *  from, so a template pick and a chair-count change both genuinely change what renders.
 *
 *  `rowsFor` answers how many rows of four a template needs for `count` chairs, never fewer than 3
 *  so the room always keeps some open floor space. The L-shape is the one exception: its capacity
 *  is the top wall (4 chairs, one per column) plus one more chair per row going down the right-hand
 *  column, so the rows it needs is `count - (FLOOR_COL_COUNT - 1)`, not `count / 4`. Two-walls and
 *  island both reserve one extra row as a walkway on top of the plain `count / 4`, since a walkway
 *  row holds no chairs of its own.
 *
 *  `cellOrder` answers, for a given row count, the exact order cells fill in, one distinct order
 *  per template:
 *    one-wall  : row-major from the top wall down, so chairs bunch along the top first.
 *    two-walls : the top row and the bottom row, alternating one full row at a time, then the next
 *                pair of rows inward; exactly one row is always left over as the walkway, whichever
 *                row that interleave never reaches.
 *    l-shape   : the top wall first, then down the right-hand wall one chair per row, then the
 *                remaining cells inward, so a count this template was not sized for still has
 *                somewhere to go rather than being silently dropped.
 *    island    : rows 1 through the last row, back to back, row-major; row 0 is always left open as
 *                walking space in front of the island.
 *
 *  `layoutFor` numbers `count` chairs 1 up and places them in that order, so a floor laid out for
 *  eight chairs in an L is a genuinely different set of positions from eight chairs against two
 *  walls, and changing the count or the template resets `positions` to match rather than leaving
 *  chairs stranded off a grid that shrank under them. */
function rowsFor(id: TemplateId, count: number): number {
  if (id === "l-shape") return Math.max(3, count - (FLOOR_COL_COUNT - 1));
  if (id === "two-walls" || id === "island") return Math.max(3, Math.ceil(count / FLOOR_COL_COUNT) + 1);
  return Math.max(3, Math.ceil(count / FLOOR_COL_COUNT));
}

function oneWallCellOrder(rows: number): FloorPos[] {
  const cells: FloorPos[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < FLOOR_COL_COUNT; col++) cells.push({ row, col });
  }
  return cells;
}

function twoWallsCellOrder(rows: number): FloorPos[] {
  // Interleaves outside rows inward (top, bottom, next row in, next row in...), reserving exactly
  // one row, whichever the interleave never reaches, as the open walkway between the two walls.
  const rowOrder: number[] = [];
  let top = 0;
  let bottom = rows - 1;
  while (rowOrder.length < rows - 1) {
    rowOrder.push(top);
    if (rowOrder.length < rows - 1) rowOrder.push(bottom);
    top++;
    bottom--;
  }
  const cells: FloorPos[] = [];
  for (const row of rowOrder) {
    for (let col = 0; col < FLOOR_COL_COUNT; col++) cells.push({ row, col });
  }
  return cells;
}

function lShapeCellOrder(rows: number): FloorPos[] {
  const cells: FloorPos[] = [];
  for (let col = 0; col < FLOOR_COL_COUNT; col++) cells.push({ row: 0, col }); // the top wall
  for (let row = 1; row < rows; row++) cells.push({ row, col: FLOOR_COL_COUNT - 1 }); // down the right wall
  for (let row = 1; row < rows; row++) {
    for (let col = FLOOR_COL_COUNT - 2; col >= 0; col--) cells.push({ row, col }); // then inward
  }
  return cells;
}

function islandCellOrder(rows: number): FloorPos[] {
  const cells: FloorPos[] = [];
  for (let row = 1; row < rows; row++) {
    for (let col = 0; col < FLOOR_COL_COUNT; col++) cells.push({ row, col });
  }
  return cells;
}

function cellOrder(id: TemplateId, rows: number): FloorPos[] {
  if (id === "one-wall") return oneWallCellOrder(rows);
  if (id === "two-walls") return twoWallsCellOrder(rows);
  if (id === "l-shape") return lShapeCellOrder(rows);
  return islandCellOrder(rows);
}

function layoutFor(id: TemplateId, count: number): Record<number, FloorPos> {
  const rows = rowsFor(id, count);
  const order = cellOrder(id, rows);
  const positions: Record<number, FloorPos> = {};
  for (let i = 0; i < count; i++) {
    const pos = order[i];
    if (!pos) break; // defensive: a future template/count pairing that runs out of cells early
    positions[i + 1] = pos;
  }
  return positions;
}

// "Two walls facing" is the default chosen template because it matches the exact arrangement
// CHAIRS_LIVE (Frame 1 and 2) already uses, so the live floor and the setup flow agree with each
// other rather than each inventing their own shape.
const TEMPLATES: { id: TemplateId; label: string }[] = [
  { id: "one-wall", label: "Along one wall" },
  { id: "two-walls", label: "Two walls facing" },
  { id: "l-shape", label: "An L along two walls" },
  { id: "island", label: "An island, back to back" },
];

/** One template option. Same pill spec, same height, same font size for all four, per D1's "one
 *  pill spec per context"; only the chosen state's fill and label weight change, the locked
 *  filter-pill recipe (bg-s-bg-sunken + ink + semibold vs white + hairline), never a blue border,
 *  never a black fill. The tiny squares are drawn from `layoutFor(spec.id, count)` (D3 fix), so the
 *  thumbnail is a true small picture of what picking this template actually produces, rather than a
 *  hand-drawn pattern that could drift from it; same shape family as the real chair tiles, never a
 *  chair pictogram at any scale. */
function TemplateThumb({
  spec,
  count,
  chosen,
  onChoose,
}: {
  spec: { id: TemplateId; label: string };
  count: number;
  chosen: boolean;
  onChoose: () => void;
}) {
  const rows = rowsFor(spec.id, count);
  const filled = new Set(Object.values(layoutFor(spec.id, count)).map((pos) => `${pos.row}-${pos.col}`));
  return (
    <button
      type="button"
      onClick={onChoose}
      className={cn(
        "flex flex-col items-center gap-4 rounded-card border border-s-border p-4",
        chosen ? "bg-s-bg-sunken" : "bg-white",
      )}
    >
      <div className="grid grid-cols-4 gap-1">
        {Array.from({ length: rows }).flatMap((_, row) =>
          Array.from({ length: FLOOR_COL_COUNT }).map((_, col) => (
            <span
              key={`${row}-${col}`}
              className={cn("h-2 w-2 rounded-[2px]", filled.has(`${row}-${col}`) ? "bg-s-ink-2" : "bg-transparent")}
            />
          )),
        )}
      </div>
      <span className={cn("font-body text-[13px]", chosen ? "font-semibold text-s-ink" : "text-s-ink-2")}>
        {spec.label}
      </span>
    </button>
  );
}

/** Frame 4, setup step two: pick a starting layout. `templateId` comes from the hoisted state
 *  (D3); choosing a different template also reseeds `positions` via `layoutFor`, so stepping to
 *  Frame 5 shows the layout that was actually picked here instead of the same hardcoded arrangement
 *  every time. */
function ScreenTemplate({ count, templateId, onChangeTemplate }: SetupScreenProps) {
  return (
    <ScreenShell chromeSub="Setting up, step 2 of 3">
      <p className="font-body text-[15px] font-semibold text-s-ink">Pick a starting layout</p>
      <p className="mt-1 font-body text-[13px] text-s-ink-2">
        Close to your salon&apos;s real shape. You can move chairs after.
      </p>
      <div className="mt-8 grid grid-cols-2 gap-4">
        {TEMPLATES.map((t) => (
          <TemplateThumb
            key={t.id}
            spec={t}
            count={count}
            chosen={templateId === t.id}
            onChoose={() => onChangeTemplate(t.id)}
          />
        ))}
      </div>
    </ScreenShell>
  );
}

/** Frame 5, setup step three: moving a chair, no drag. Tap a chair to pick it up, tap an empty
 *  spot to set it down; tapping the held chair again cancels the pick-up in place. Tapping a
 *  DIFFERENT occupied chair while one is already held does nothing, a deliberate choice: the brief
 *  only specifies empty-cell placement, and inventing a swap behaviour it never asked for is
 *  exactly the kind of unrequested addition CLAUDE.md rule 7 warns against. Real React state, not
 *  a static picture, so he can actually try it. `positions` and `onMovePosition` come from the
 *  hoisted state (D3), seeded from whichever template Frame 4 picked, so a chair moved here stays
 *  moved if the flow steps back to Frame 4 and forward again. The row count is
 *  `rowsFor(templateId, count)` (D3), not a hardcoded 3, so a template or a count that needs more
 *  room actually gets it. Cells iterate in strict row-major order and rely on the grid's own
 *  source-order auto-flow (the same trick `RoomFrame` uses above) rather than inline per-cell
 *  positioning. `heldId` is a HOLD state, never a selected-among-peers state, see the file header's
 *  naming note. */
function FloorEditor({ templateId, count, positions, onMovePosition }: SetupScreenProps) {
  const [heldId, setHeldId] = useState<number | null>(null);
  const rows = rowsFor(templateId, count);
  const floorRows = Array.from({ length: rows }, (_, i) => i);

  function chairAt(row: number, col: number): number | null {
    for (const idKey of Object.keys(positions)) {
      const id = Number(idKey);
      const pos = positions[id]!;
      if (pos.row === row && pos.col === col) return id;
    }
    return null;
  }

  function tapChair(id: number) {
    if (heldId === id) {
      setHeldId(null); // put back down in place
      return;
    }
    if (heldId === null) {
      setHeldId(id); // pick up
    }
    // holding a different chair and tapping another occupied one: inert, see comment above.
  }

  function tapEmpty(row: number, col: number) {
    if (heldId === null) return;
    onMovePosition(heldId, { row, col });
    setHeldId(null);
  }

  return (
    <div>
      <p className="font-body text-[13px] text-s-ink-2">
        {heldId === null
          ? "Tap a chair to pick it up, then tap an empty spot to set it down."
          : `Tap an empty spot to place chair ${heldId}.`}
      </p>
      <div className="mt-8 rounded-card border border-s-border py-4">
        <div className="grid w-full grid-cols-4 gap-4">
          {floorRows.flatMap((row) =>
            FLOOR_COLS.map((col) => {
              const chairId = chairAt(row, col);
              if (chairId !== null) {
                const held = heldId === chairId;
                return (
                  <button
                    key={`c-${chairId}`}
                    type="button"
                    aria-label={`Chair ${chairId}`}
                    onClick={() => tapChair(chairId)}
                    className={cn(
                      "flex aspect-square w-full items-center justify-center rounded-[12px] font-body text-[13px] transition-transform",
                      held
                        ? "-translate-y-1 border-2 border-s-ink bg-white text-s-ink"
                        : "border border-s-border bg-white text-s-ink-2",
                    )}
                  >
                    {chairId}
                  </button>
                );
              }
              return (
                <button
                  key={`e-${row}-${col}`}
                  type="button"
                  disabled={heldId === null}
                  aria-label="Empty spot"
                  onClick={() => tapEmpty(row, col)}
                  className={cn(
                    "aspect-square w-full rounded-[12px]",
                    heldId !== null && "border border-dashed border-s-border",
                  )}
                />
              );
            }),
          )}
        </div>
      </div>
    </div>
  );
}

function ScreenMove(props: SetupScreenProps) {
  return (
    <ScreenShell chromeSub="Setting up, step 3 of 3">
      <FloorEditor {...props} />
    </ScreenShell>
  );
}

// Order fixes the index every frame renders at; page.tsx steps through this list by index alone,
// so this order and FRAMES below must stay in lockstep (the same contract every sibling flow file
// in this folder already follows). `Screen` now takes the shared setup state uniformly (D3); Frame
// 1 (`ScreenOpen`) and Frame 2 (`ScreenChair`) take no parameters of their own and simply ignore it,
// which TypeScript allows for a function assigned to a type expecting more parameters than it uses.
const FLOOR_FRAME_SPECS: { key: string; caption: string; Screen: (props: SetupScreenProps) => ReactNode }[] = [
  {
    key: "open",
    caption:
      "The floor while you're open. Each chair sits where it really is, so you can see who is in which chair, how much time is left, and how many customers are waiting.",
    Screen: ScreenOpen,
  },
  {
    key: "chair",
    caption:
      "Tap any chair to see the customer inside it, what they are having done, and check them out when they are finished.",
    Screen: ScreenChair,
  },
  {
    key: "count",
    caption: "Setup, step one. Tell it how many chairs your salon has, so the floor plan knows how many to place.",
    Screen: ScreenCount,
  },
  {
    key: "template",
    caption: "Setup, step two. Pick a starting layout close to your salon's real shape. You can move chairs around after.",
    Screen: ScreenTemplate,
  },
  {
    key: "move",
    caption: "Setup, step three. Tap a chair to pick it up, then tap an empty spot on the floor to set it down.",
    Screen: ScreenMove,
  },
];

export const FRAMES: { key: string; caption: string }[] = FLOOR_FRAME_SPECS.map(({ key, caption }) => ({
  key,
  caption,
}));

/** D3 FIX. `count`, `templateId` and `positions` used to live inside `ScreenCount`,
 *  `ScreenTemplate` and `FloorEditor`'s own local `useState`, so every one of them reset to its
 *  hardcoded default the moment React remounted that screen, and `FloorEditor` never even read
 *  `templateId` in the first place: it always seeded from a single hardcoded `MOVE_START`, so
 *  picking a different template and stepping to the move frame always showed the same two-walls
 *  layout regardless of what was chosen. Hoisting the three pieces of state up here fixes both
 *  problems at once: `page.tsx` keeps this same `FlowFloor` instance mounted across every frame and
 *  only changes `index`, so state that lives here survives stepping back and forward, and
 *  `positions` is now genuinely reseeded from `layoutFor(templateId, count)` whenever either input
 *  changes, so a template pick is no longer a silent no-op. */
export default function FlowFloor({ index }: { index: number }) {
  const [count, setCount] = useState(8);
  const [templateId, setTemplateId] = useState<TemplateId>("two-walls");
  const [positions, setPositions] = useState<Record<number, FloorPos>>(() => layoutFor("two-walls", 8));

  function changeCount(next: number) {
    setCount(next);
    setPositions(layoutFor(templateId, next));
  }

  function changeTemplate(id: TemplateId) {
    setTemplateId(id);
    setPositions(layoutFor(id, count));
  }

  function movePosition(id: number, pos: FloorPos) {
    setPositions((prev) => ({ ...prev, [id]: pos }));
  }

  const frame = FLOOR_FRAME_SPECS[index] ?? FLOOR_FRAME_SPECS[0]!;
  const Screen = frame.Screen;
  return (
    <Screen
      count={count}
      onChangeCount={changeCount}
      templateId={templateId}
      onChangeTemplate={changeTemplate}
      positions={positions}
      onMovePosition={movePosition}
    />
  );
}
