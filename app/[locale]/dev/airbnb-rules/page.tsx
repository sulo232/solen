/**
 * /dev/airbnb-rules , the nine rules Airbnb actually follows, what we do instead, what to change,
 * and what only the owner can decide.
 *
 * exists-check: `npm run exists airbnb` run this turn. 20 hits, all read. Four dev routes already
 * exist (airbnb-01-home, airbnb-02-search, airbnb-03-salon, airbnb-findings). airbnb-findings is
 * the closest neighbour and it is a per-SCREEN gap list of 51 measured findings; it holds no rules,
 * no host screens and no colour-distribution work. The four graveyard hits were read: black
 * selected state, the white pill border, the bottom nav (reversed 2026-08-10) and the 6/5 card
 * ratio. Nothing on this page re-opens any of them; the black selected state is surfaced as a
 * conflict with its kill date attached, never proposed. Net new.
 *
 * Mockup-scope: whole-page
 *
 * SOURCES, two halves with different confidence:
 *   - Web: live airbnb.ch, first viewport, real browser at 390 wide, swept 2026-08-20. Raw sweep at
 *     public/_pixel-refs/airbnb/2026-08-20/computed.json. That folder is gitignored (.gitignore:83),
 *     so the two mobile screenshots were COPIED to public/_mockups/_assets/refs/airbnb/2026-08-20/,
 *     which is tracked and served, and that copy is what this page renders.
 *   - Host: Mobbin iOS stills, because airbnb.com/hosting and /multicalendar both redirect to a
 *     login we do not have. Mobbin gives ordered stills and no video, so TIMING IS NOT MEASURED
 *     anywhere on this page and no number is given for it.
 *
 * The durable version of everything here is _design-system/references/airbnb--host-and-rules.md.
 *
 * Type budget: four sizes (28, 18, 15, 13) and two weights (600, 400) on the whole page.
 * Airbnb hex values are quoted literally where a swatch has to BE their colour to make the point,
 * each carrying `drift-ok` and a note saying it is a measured reference value, not a new token.
 * Everything that is ours uses tokens.
 *
 * Dev-only preview route, notFound() in production like every other page under app/[locale]/dev/.
 */
import type { ReactNode } from "react";
import { notFound } from "next/navigation";

/* ------------------------------------------------------------------ blocks */

function Pair({
  leftLabel, left, leftNote, rightLabel, right, rightNote,
}: {
  leftLabel: string; left: ReactNode; leftNote: string;
  rightLabel: string; right: ReactNode; rightNote: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-s-ink mb-2">{leftLabel}</p>
        <div className="rounded-[16px] border border-s-border bg-white p-3">{left}</div>
        <p className="mt-2 text-[13px] leading-relaxed text-s-ink-2">{leftNote}</p>
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-s-ink mb-2">{rightLabel}</p>
        <div className="rounded-[16px] border border-s-border bg-white p-3">{right}</div>
        <p className="mt-2 text-[13px] leading-relaxed text-s-ink-2">{rightNote}</p>
      </div>
    </div>
  );
}

function Wide({ label, note, children }: { label: string; note: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[13px] font-semibold text-s-ink mb-2">{label}</p>
      <div className="rounded-[16px] border border-s-border bg-white p-3">{children}</div>
      <p className="mt-2 text-[13px] leading-relaxed text-s-ink-2">{note}</p>
    </div>
  );
}

function Rule({
  n, statement, evidence, demo, ours,
}: {
  n: number; statement: string; evidence: string; demo?: ReactNode; ours: string;
}) {
  return (
    <section className="mt-12">
      <h2 className="font-heading font-semibold text-[18px] leading-snug text-s-ink">
        {n}. {statement}
      </h2>
      <p className="mt-2 text-[13px] leading-relaxed text-s-ink-2">{evidence}</p>
      {demo ? <div className="mt-4 space-y-4">{demo}</div> : null}
      <p className="mt-4 text-[15px] leading-relaxed text-s-ink">
        <span className="font-semibold">What we do instead. </span>{ours}
      </p>
    </section>
  );
}

/* ------------------------------------------------------- reference swatches */
/* Every hex in this section was measured off Airbnb this week. A swatch has to BE the colour to
   make its point, so these are quoted literally rather than mapped onto one of our tokens. */

const AB_INK = "rgb(34,34,34)";     // drift-ok: measured Airbnb ink, quoted reference value
const AB_GREY = "rgb(108,108,108)"; // drift-ok: measured Airbnb secondary grey, quoted reference value
const AB_HAIRLINE = "#DDDDDD";      // drift-ok: measured Airbnb hairline, quoted reference value
const AB_BRAND = "#FF385C";         // drift-ok: measured Airbnb brand fill, quoted reference value
const AB_PAST = "#EBEBEB";          // drift-ok: measured Airbnb past-cell grey, quoted reference value
const AB_RED_DISC = "#C13515";      // drift-ok: measured Airbnb alert disc, quoted reference value
const AB_BLUE_DISC = "#0073E6";     // drift-ok: measured Airbnb alert disc on web, quoted reference value

/* Our own agenda hexes, copied verbatim from the real screen so the comparison is real.
   app/[locale]/dashboard/calendar/page.tsx:653 CAT_AGENDA_BG. */
const OUR_CAT = [
  { name: "coiffeur", bg: "#EAEFFE" },   // drift-ok: quoting our own shipped CAT_AGENDA_BG value
  { name: "barbershop", bg: "#FFEDD5" }, // drift-ok: quoting our own shipped CAT_AGENDA_BG value
  { name: "nails", bg: "#F3E8FF" },      // drift-ok: quoting our own shipped CAT_AGENDA_BG value
  { name: "spa", bg: "#E8F5E9" },        // drift-ok: quoting our own shipped CAT_AGENDA_BG value
];

/* ------------------------------------------------------------------- demos */

function TheirListing() {
  return (
    <div className="space-y-2">
      {["Ascona, lake view", "Zurich, one bedroom", "Zermatt, cabin"].map((s) => (
        <div key={s} className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[13px]" style={{ color: AB_INK }}>{s}</span>
          <span className="shrink-0 text-[13px]" style={{ color: AB_GREY }}>CHF 180</span>
        </div>
      ))}
      <div
        className="mt-3 rounded-[8px] px-2 py-2 text-center text-[13px] font-semibold text-white"
        style={{ background: AB_BRAND }}
      >
        Reserve
      </div>
    </div>
  );
}

function OurAgendaLoud() {
  return (
    <div className="space-y-1">
      {["09:00", "09:30", "10:00", "10:30", "11:00"].map((t) => (
        <div key={t} className="flex items-center gap-2">
          <span className="w-[34px] shrink-0 text-[13px] tabular-nums text-s-ink-2">{t}</span>
          <span className="flex-1 rounded-[8px] bg-s-success-bg px-2 py-1.5 text-[13px] font-semibold text-s-success">
            Free
          </span>
        </div>
      ))}
    </div>
  );
}

function TheirRankedHue() {
  return (
    <div className="space-y-3">
      {[AB_RED_DISC, AB_BLUE_DISC].map((c) => (
        <div key={c} className="flex items-center gap-2">
          <span className="h-5 w-5 shrink-0 rounded-full" style={{ background: c }} />
          <span className="min-w-0 truncate text-[13px]" style={{ color: AB_INK }}>Add a payout method</span>
        </div>
      ))}
    </div>
  );
}

function OurLabelledHue() {
  return (
    <div className="space-y-2">
      {OUR_CAT.map((c) => (
        <div key={c.name} className="flex items-center gap-2">
          <span className="h-5 w-5 shrink-0 rounded-[6px]" style={{ background: c.bg }} />
          <span className="min-w-0 truncate text-[13px] text-s-ink">{c.name}</span>
        </div>
      ))}
    </div>
  );
}

function TheirStatusMark() {
  return (
    <div className="space-y-2">
      {["Confirmed", "Awaiting", "Cancelled"].map((s) => (
        <span
          key={s}
          className="flex w-fit items-center gap-2 rounded-full bg-white px-2 py-1"
          style={{ border: `1px solid ${AB_HAIRLINE}` }}
        >
          <span className="h-[6px] w-[6px] shrink-0 rounded-full bg-s-success" />
          <span className="text-[13px]" style={{ color: AB_INK }}>{s}</span>
        </span>
      ))}
    </div>
  );
}

function OurStatusText() {
  return (
    <div className="space-y-2">
      {["Free", "Free", "Free"].map((s, i) => (
        <span key={i} className="flex w-fit rounded-[8px] bg-s-success-bg px-2 py-1 text-[13px] font-semibold text-s-success">
          {s}
        </span>
      ))}
    </div>
  );
}

function TheirQuietPast() {
  return (
    <div className="grid grid-cols-3 gap-1">
      {[
        { d: "Mo 12", past: true },
        { d: "Tu 13", past: false },
        { d: "We 14", past: false },
      ].map((c) => (
        <div
          key={c.d}
          className="rounded-[6px] px-1 py-3 text-center text-[13px]"
          style={{
            background: c.past ? AB_PAST : "#FFFFFF", // drift-ok: quoting their measured cell fills
            border: `1px solid ${AB_HAIRLINE}`,
            color: c.past ? AB_GREY : AB_INK,
          }}
        >
          {c.d}
        </div>
      ))}
    </div>
  );
}

function OurLoudEmpty() {
  return (
    <div className="space-y-1">
      <div className="rounded-[8px] bg-s-success-bg px-2 py-2 text-[13px] font-semibold text-s-success">Free</div>
      <div className="rounded-[8px] bg-s-accent-pale px-2 py-2 text-[13px] font-semibold text-s-ink">Cut, Emma</div>
      <div className="rounded-[8px] bg-s-success-bg px-2 py-2 text-[13px] font-semibold text-s-success">Free</div>
    </div>
  );
}

function TheirAnchor() {
  return (
    <div>
      <p className="text-[13px]" style={{ color: AB_GREY }}>Earnings</p>
      <p className="mt-1 font-heading font-semibold text-[28px] leading-tight" style={{ color: AB_INK }}>
        {"You've made $0.00 this month"}
      </p>
    </div>
  );
}

function OurAnchor() {
  return (
    <div>
      <p className="font-heading font-semibold text-[18px] text-s-ink">Kalender</p>
      <p className="mt-1 text-[13px] text-s-ink-2">18</p>
    </div>
  );
}

function TheirWeight() {
  return (
    <div className="space-y-2">
      <p className="text-[13px] font-semibold" style={{ color: AB_INK }}>Wednesday</p>
      {["Ascona, 2 nights", "Zurich, 1 night", "Zermatt, 4 nights", "Lugano, 2 nights", "Bern, 1 night"].map((s) => (
        <p key={s} className="truncate text-[13px]" style={{ color: AB_INK }}>{s}</p>
      ))}
    </div>
  );
}

function OurWeight() {
  return (
    <div className="space-y-2">
      {["Free", "Free", "Cut", "Free", "Blocked", "Free"].map((s, i) => (
        <p key={i} className="truncate text-[13px] font-semibold text-s-ink">{s}</p>
      ))}
    </div>
  );
}

function TheirSimpleRows() {
  return (
    <div>
      {["Personal info", "Login and security", "Payments", "Notifications"].map((s) => (
        <p key={s} className="py-2 text-[13px]" style={{ color: AB_INK }}>{s}</p>
      ))}
      <div style={{ borderTop: `1px solid ${AB_HAIRLINE}` }} />
      <p className="py-2 text-[13px]" style={{ color: AB_GREY }}>Log out</p>
    </div>
  );
}

function TheirComplexRows() {
  return (
    <div>
      {[
        ["Cleaning fee", "CHF 40"],
        ["Weekly discount", "10%"],
        ["Minimum stay", "2 nights"],
      ].map(([k, v], i) => (
        <div
          key={k}
          className="flex items-baseline justify-between gap-2 py-2"
          style={i > 0 ? { borderTop: `1px solid ${AB_HAIRLINE}` } : undefined}
        >
          <span className="min-w-0 truncate text-[13px]" style={{ color: AB_INK }}>{k}</span>
          <span className="shrink-0 text-[13px]" style={{ color: AB_GREY }}>{v}</span>
        </div>
      ))}
    </div>
  );
}

function OurBoxInBox() {
  return (
    <div className="rounded-[16px] border border-s-border bg-white p-2 space-y-1">
      <div className="rounded-[12px] bg-s-success-bg px-2 py-2 text-[13px] font-semibold text-s-success">Free</div>
      <div className="rounded-[12px] bg-s-success-bg px-2 py-2 text-[13px] font-semibold text-s-success">Free</div>
      <div className="rounded-[12px] bg-s-accent-pale px-2 py-2 text-[13px] font-semibold text-s-ink">Cut</div>
    </div>
  );
}

function TheirButtonLadder() {
  return (
    <div className="space-y-2">
      <div className="rounded-[8px] px-3 py-2 text-center text-[13px] font-semibold text-white" style={{ background: AB_INK }}>
        Continue
      </div>
      <div
        className="rounded-[8px] bg-white px-3 py-2 text-center text-[13px] font-semibold"
        style={{ border: `1px solid ${AB_INK}`, color: AB_INK }}
      >
        Save and exit
      </div>
      <div className="w-fit rounded-full bg-s-bg-sunken px-3 py-1.5 text-[13px] text-s-ink">Learn more</div>
      <p className="text-[13px] underline" style={{ color: AB_INK }}>Deactivate your account</p>
    </div>
  );
}

function OurButtonAnswers() {
  return (
    <div className="space-y-2">
      <div className="rounded-[8px] bg-s-ink px-3 py-2 text-center text-[13px] font-semibold text-white">Buchen</div>
      <div className="rounded-[8px] bg-s-accent px-3 py-2 text-center text-[13px] font-semibold text-white">Dashboard CTA</div>
      <div className="rounded-[8px] bg-s-success px-3 py-2 text-center text-[13px] font-semibold text-white">Outcome CTA</div>
    </div>
  );
}

function TapBar({ pct, caption }: { pct: number; caption: string }) {
  return (
    <div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-s-bg-sunken">
        <div className="h-full rounded-full bg-s-ink" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-s-ink-2">{caption}</p>
    </div>
  );
}

/* ------------------------------------------------------------------- lists */

const CHANGES: { title: string; body: string }[] = [
  {
    title: "Kill the wall of green",
    body: "Collapse runs of consecutive free slots into one quiet grey line reading the range and the count, 09:00 bis 13:00, 8 frei, and let only real bookings render as a filled block. About 30 to 40 lines inside renderAgenda plus one mockup round. This also fixes the box in a box, since the row block goes away.",
  },
  {
    title: "Make the free label legible today, in one class string",
    body: "text-s-success becomes text-s-ink. Green on green at 2.93 to 1 is below the statutory floor, so this does not wait for a mockup and does not need a design decision. Minutes.",
  },
  {
    title: "One source of status colour for phone and desktop",
    body: "Right now booked is pale blue on the phone and solid black on the desktop, free is green on the phone and 15% ink on the desktop, and today is ink on the phone and blue on the desktop. Lift slotBg into the single source and delete CAT_AGENDA_BG and its four hardcoded hexes. This also kills a live defect: CAT_AGENDA_BG.spa is #E8F5E9 and s-success.bg is #E8F5E9, so a booked massage and an empty half hour are the identical colour in the same list. The desktop is the one that already agrees with Airbnb, so it wins.",
  },
  {
    title: "Give the day a sentence",
    body: "One line above the agenda reading the state with the live number, 4 Termine heute, 3 Stunden frei, at 28 to 30px. bookedCount and availableCount already exist in the same file with i18n keys that take a count, so this needs no new data. Must be measured in German and French, which run 15 to 35% longer. It must render honestly at zero.",
  },
  {
    title: "Empty day becomes one unit",
    body: "Today it is a centred grey sentence with py-12 and no action, while the three buttons that would actually fix an empty day sit in a separate row further down. Our own floor asks for one centred cluster with a message to action gap of 24px or less.",
  },
  {
    title: "Six sizes down to four",
    body: "12, 12.5, 13.5, 14, 16 and 17, where the largest is only 1.26 times the workhorse and two sizes sit half a pixel from their neighbours. Collapse to the ladder already approved on the merchant terminal, 13 / 15 / 18 / 30. About 12 class strings.",
  },
  {
    title: "Two illegal greys",
    body: "The hour column is text-s-ink/30, which resolves to 2.03 to 1, and the slot count is /40 at 2.71 to 1. Both are lighter than the grey our own floor already bans by name. Swap to s-ink-2, #6B6B6B, 5.33 to 1. Statutory, so no mockup round.",
  },
  {
    title: "Close the tap dead zone",
    body: "Wire useLinkStatus so something moves on the tap itself rather than when the route resolves. It has zero call sites in the app today and we are already on the Next version that ships it.",
  },
  {
    title: "Housekeeping, not Airbnb",
    body: "tailwind.config.js line 255 sets the input radius to 16px, against LOCKFILE line 576 which records that you kept the shipped 12 over 16 on 2026-06-08. Our own memory index already flagged this token as a drift trap and it was never fixed. One value.",
  },
];

const CONFLICTS: { axis: string; ref: string; lock: string }[] = [
  {
    axis: "The 28px anchor floor",
    ref: "Airbnb's mobile home has a largest visible element of 18px over a 12px body, a ratio of 1.5, across five sizes. The single 28px node in this morning's sweep is a screen reader heading measured at 1px by 1px and clipped, so it never paints.",
    lock: "FLOORS LAW 6, 2026-07-21, requires an anchor of at least 28px on every customer screen, and at least 1.8 times body. Their home fails all three of our floors. Floors outrank a taste source, so nothing changes without you. Worth deciding separately: our floor has no not-applicable clause, so on a screen with no fact to lead on a builder is forced to manufacture an anchor.",
  },
  {
    axis: "Card depth, two parts, both frozen literals",
    ref: "Their listing tile carries a 1px ring and a real drop shadow at the same time, on 18 elements in one viewport, and the ring resolves to 1.04 to 1 so it reads as edge definition rather than a border. At the identical 10% alpha their shadow reaches about 20px below the box and ours reaches about 10px, because of a minus 14px spread.",
    lock: "Our surface table, 2026-07-21, says a card carrying elevation drops its border, never both. Dropping the spread is a one value change to a frozen literal.",
  },
  {
    axis: "The blue selected state",
    ref: "Airbnb's selected state is a 2px black border on white, measured across four of their screens including the time slot sheet itself.",
    lock: "Blue is locked by name as one of exactly four exceptions, and the graveyard records on 2026-06-23 that the booking calendar, slots and tabs were left on blue pending an explicit go-ahead. Separately, on 2026-07-02 you killed a black surround on a selected state in the same breath as the blue one, and a gate enforces it, so Airbnb's answer is dead here twice over and this page does not propose it. Two facts if you reopen it: the dashboard agenda has no selected state at all today, so this only bites the customer booking picker, and the Airbnb screen it comes from may be guest facing rather than host facing.",
  },
  {
    axis: "The separator dot",
    ref: "Airbnb ships 110 of them on one home page. They are legal there only because of their value, 1.80 to 1, which makes them disappear.",
    lock: "Taste rule 2 bans the dot by name and says that where two bits already differ by colour or weight, that contrast is the separator. A dated house rule against the source of truth.",
  },
  {
    axis: "The two weight cap",
    ref: "Airbnb's visible content runs three weights, 400, 500 and 600. The 700 in the raw sweep is 112 commas and a clipped heading, so the reference stretches the cap by one, not by two.",
    lock: "NEVER AGAIN floor 2 caps a screen at two weights, while our own roles table puts body at 400, CTA at 500 and headings at 600, so any screen with a heading, some text and a button is at three before anyone decides anything. The reference licenses raising the cap to exactly three and naming the two jobs weight is allowed to do, not going to four.",
  },
  {
    axis: "Blue links",
    ref: "Airbnb has not one blue link across roughly 150 screens. Sixteen link strings are all black and underlined.",
    lock: "Taste rule 3 locks text links to blue, dated 2026-06-10. That block already records that the Apple and Airbnb citations behind the lock were corrected as wrong on 2026-07-28, leaving Fresha as the only support, and Fresha is no longer our source of truth. A narrow version, operator screens only, touches about four class strings and leaves customer surfaces alone. A shop owner would barely notice this one, which is why it ranks last.",
  },
];

const DO_NOT_COPY: string[] = [
  "Their 700 weight. It is 112 commas and a clipped heading, not an emphasis decision.",
  "Their fixed row pitch. 56.0pt with zero variance holds because none of those rows carries anything but a label. Ours carry the next appointment, the saved card, active vouchers, saved stores and stamps, which you kept by name on 2026-08-05.",
  "The grey $0.00. They set the number itself in grey inside black words. Here the number is the fact, and faint grey on load-bearing text is banned on contrast grounds.",
  "Their single 20px radius. It would erase the 16 for an individual card versus 24 for a grouped card split you made by name on 2026-07-19, and it buys 4px.",
  "Their secondary grey. #6C6C6C against our #6B6B6B is a colour distance of 0.40, below the point where a human can see any difference.",
  "Their web empty state. It leaves well over 30% dead space below its action, which our own floor bans. Their iOS one does it properly.",
  "10 spots left as a third fact on a slot row. That is capacity on a group experience and a chair seats one person. Our honest third fact is how many stylists are open at that time.",
  "Their brand fill, unchecked. They keep a bright fill at 3.52 to 1 and a separate darker text red at 5.04 to 1. We ship one blue for both jobs and it drops to 4.17 to 1 on our sunken tray. We do not need a new hex, s-accent.deep is already in the config at 6.98 to 1 on white.",
];

/* -------------------------------------------------------------------- page */

export default function AirbnbRulesPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto w-full max-w-[720px] overflow-x-hidden bg-white px-4 py-8">
      <h1 className="font-heading font-semibold text-[28px] leading-tight text-s-ink">
        Nine rules Airbnb follows
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-s-ink">
        Airbnb has been our source of truth since you said so on 12 August. This is not about whether
        to follow them. It is about what following them actually means, written as rules you can
        check a screen against, with our own screen held next to each one so the gap is visible
        rather than described.
      </p>
      <p className="mt-3 text-[13px] leading-relaxed text-s-ink-2">
        Their web numbers were taken this morning on the live site at phone width. Their host screens
        came from Mobbin stills, because the real host pages sit behind a login we do not have, and
        Mobbin gives pictures and no video, so nothing on this page claims a timing for them. Eleven
        Airbnb documents already existed and were read first; this adds where their colour goes, why
        a hue is a rank and not a label, and when a box or a line is earned. It corrects three things
        we had written down wrong.
      </p>

      <Rule
        n={1}
        statement="Colour is concentrated into one object, or the screen has none at all."
        evidence="Their pay button is 2.08% of the screen and holds 79% of all the colour on it. Their host Insights and host Earnings screens measure zero. Their whole host calendar month grid measures 0.07%. Colour is not rationed evenly by size, it is spent on one thing or not at all."
        demo={
          <Pair
            leftLabel="Airbnb"
            left={<TheirListing />}
            leftNote="One small object carries all of it. Everything around it is silent, which is what makes it loud."
            rightLabel="Our day calendar"
            right={<OurAgendaLoud />}
            rightNote="Eighteen of these on a quiet day. Colour is spread evenly and lands on nothing."
          />
        }
        ours="On a quiet day the loudest colour on the shop owner's phone is the absence of work. The free-slot row fills its whole width with green, eighteen times, half hour after half hour."
      />

      <Rule
        n={2}
        statement="A hue ranks how much something matters. It never says what something is about."
        evidence="The same missing-payout problem renders with a red disc on their phone app and a blue disc on their website. The identical Guest favorite badge is gold in one place and black in another. Destructive is not red either: Deactivate your account is black underlined text and Cancel Reservation is a black filled button."
        demo={
          <Pair
            leftLabel="Airbnb"
            left={<TheirRankedHue />}
            leftNote="Same problem, two colours, and neither is wrong, because the colour was never the label."
            rightLabel="Our day calendar"
            right={<OurLabelledHue />}
            rightNote="Four hues, one per service category. The colour says spa instead of saying this matters."
          />
        }
        ours="A booked slot picks its fill from a lookup keyed on the service category. That is a colour used as a name, which means we can never later use colour to say which booking is the urgent one."
      />

      <Rule
        n={3}
        statement="A status hue lives in a small mark, and the words next to it stay ink."
        evidence="Their status pattern is a 6px coloured dot inside a white pill with black text. Colour never carries text on top of itself. The flip side of the same rule: a mark that carries no information, a hairline or a gridline, is free to be as faint as it likes. Their palest grey, 1.80 to 1, appears 110 times on the home page and every single instance is a comma or a dot."
        demo={
          <Pair
            leftLabel="Airbnb"
            left={<TheirStatusMark />}
            leftNote="The hue is a 6px dot. The word stays black, so it stays readable."
            rightLabel="Our day calendar"
            right={<OurStatusText />}
            rightNote="Green text on its own green tint measures 2.93 to 1. Accessibility needs 4.5 to 1."
          />
        }
        ours="We set the status word in the status colour on a tint of the same colour. The loudest thing on the screen is also the least legible thing on it, and that is a statutory floor, not a taste call."
      />

      <Rule
        n={4}
        statement="Whatever you cannot act on is rendered quieter than whatever you can."
        evidence="On their host calendar a past day measures #EBEBEB at 83% brightness and a bookable future day measures #FFFFFF at 88%. Grey literally means you cannot act on this. Blocked dates and missing amenities are grey strikethrough. Nothing meaning nothing here is ever the loudest object on a screen."
        demo={
          <Pair
            leftLabel="Airbnb"
            left={<TheirQuietPast />}
            leftNote="The past is dimmed. The bookable day is the bright one."
            rightLabel="Our day calendar"
            right={<OurLoudEmpty />}
            rightNote="Empty is saturated green. A real booking recedes into pale blue."
          />
        }
        ours="We inverted it. Free half hours shout and the paid work whispers, which is exactly backwards for someone opening the app to see their day."
      />

      <Rule
        n={5}
        statement="The biggest thing on a screen is a fact it just learned, never the screen's own name, and a zero is shown honestly."
        evidence="On their host Earnings screen the word Earnings is a small label and the sentence underneath runs 2.2 to 2.9 times body size. A screen with no data renders the same layout with zeros rather than swapping in an empty state."
        demo={
          <div className="space-y-4">
            <Wide
              label="Airbnb"
              note="The title is a small label. The sentence with the live number is the anchor, and it shows zero without hiding."
            >
              <TheirAnchor />
            </Wide>
            <Wide
              label="Our day calendar"
              note="The only rendered figure in 1192 lines is a slot count at 12px at 40% ink, and only on desktop. The biggest type on the phone is a 17px date."
            >
              <OurAnchor />
            </Wide>
          </div>
        }
        ours="Our screen leads with its own name and never states the day. The two numbers that would make the sentence, how many appointments and how much free time, are already computed in the same file."
      />

      <Rule
        n={6}
        statement="Weight does exactly two jobs, a heading and a row's identifying label."
        evidence="Values, meta, timestamps and prices in body position are all regular. Measured on their home this morning: 5 of 43 visible content nodes at weight 600 or above, 14%. Their own product page runs 3.1%. Ours runs 17.6%."
        demo={
          <Pair
            leftLabel="Airbnb"
            left={<TheirWeight />}
            leftNote="One label carries the weight. The rows underneath are regular, so the label reads as a heading."
            rightLabel="Our day calendar"
            right={<OurWeight />}
            rightNote="Every row is semibold, so nothing is. The agenda block asks for semibold twelve times and medium zero times."
          />
        }
        ours="Everything in the agenda is bold, which means bold has stopped encoding anything. Emphasis only works if most things do not have it."
      />

      <Rule
        n={7}
        statement="A box and a line are the same decision at two scales, and both are earned by how complicated a row is."
        evidence="Two of their lists, same device, one minute apart. Rows carrying only an icon, a label and a chevron run at a fixed pitch with zero dividers inside the group and exactly one line where the group ends. Rows carrying a label, a value and an action get a line after every row. Same margins, same greys, opposite answer, and row complexity was the only thing that changed."
        demo={
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-s-ink mb-2">Airbnb, simple rows</p>
                <div className="rounded-[16px] border border-s-border bg-white p-3">
                  <TheirSimpleRows />
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-s-ink-2">No lines inside. One line where the group ends.</p>
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-s-ink mb-2">Airbnb, dense rows</p>
                <div className="rounded-[16px] border border-s-border bg-white p-3">
                  <TheirComplexRows />
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-s-ink-2">Label plus value plus action, so every row gets a line.</p>
              </div>
            </div>
            <Wide
              label="Our day calendar"
              note="A bordered card holding rows that each get their own coloured block. Two containers doing one container's job, and neither one carries a selected state."
            >
              <OurBoxInBox />
            </Wide>
          </div>
        }
        ours="We wrap a list of identical rows in a bordered card and then put every row inside its own coloured block. We legislate a line's colour and its inset and never say when a line appears, so every list in the product decides for itself."
      />

      <Rule
        n={8}
        statement="Buttons come off one ladder chosen by stakes, and colour is reserved for the single irreversible commit."
        evidence="Black filled on Next, Continue, Save, Log out and even Cancel Reservation. Their brand colour appears only on Reserve, Confirm and pay, and Request to book. One flow carries a black Next and a coloured Request to book three screens later, split exactly at the point of no return. Zero coloured buttons on any operator screen across four capture passes. And an alert never gets the primary button."
        demo={
          <Pair
            leftLabel="Airbnb"
            left={<TheirButtonLadder />}
            leftNote="Four rungs: the commit, the real secondary, a low-stakes grey pill, then bare underlined text."
            rightLabel="Ours"
            right={<OurButtonAnswers />}
            rightNote="Three different answers for the same question, all locked in different documents. We have no grey pill tier at all."
          />
        }
        ours="Our lockfile says primary stays ink, another section locks a blue dashboard CTA, and a third gives outcome screens a semantic one. Three answers for one control, and the cheap read-only rung is missing entirely."
      />

      <Rule
        n={9}
        statement="Something on screen changes within one frame of a tap, and that something is never the data."
        evidence="Instrumented live on their category switcher: the address updates inside the click handler before any network request fires, and a skeleton appears within 40 to 60ms every single time, cold or warm. The real content arrives between 100ms and 949ms later and is completely decoupled. Their smoothness is not an animation, it is the absence of a dead zone."
        demo={
          <div className="space-y-4">
            <Wide label="Airbnb" note="Tap, then something moves at 40 to 60ms. The content lands whenever it lands.">
              <TapBar pct={6} caption="Skeleton on screen before you have lifted your finger." />
            </Wide>
            <Wide label="Ours" note="Tap, then nothing at all for 360 to 400ms, measured over two clean trials.">
              <TapBar pct={38} caption="Half of this has closed since, the three category routes now have a loading file. The other half is open." />
            </Wide>
          </div>
        }
        ours="We make confirming the tap wait for the data. The tool that fixes it, useLinkStatus, has zero call sites anywhere in the app and ships with the version of Next we already run."
      />

      <h2 className="mt-16 font-heading font-semibold text-[18px] leading-snug text-s-ink">
        What to change, ranked by what a salon owner would notice
      </h2>
      <p className="mt-2 text-[13px] leading-relaxed text-s-ink-2">
        Nothing here is applied. Items 2 and 7 are contrast floors rather than design calls, so they
        do not need a mockup round.
      </p>
      <ol className="mt-4 space-y-5">
        {CHANGES.map((c, i) => (
          <li key={c.title} className="min-w-0">
            <p className="text-[15px] leading-snug text-s-ink">
              <span className="font-semibold">{i + 1}. {c.title}. </span>
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-s-ink-2">{c.body}</p>
          </li>
        ))}
      </ol>

      <h2 className="mt-16 font-heading font-semibold text-[18px] leading-snug text-s-ink">
        Six things only you can decide
      </h2>
      <p className="mt-2 text-[13px] leading-relaxed text-s-ink-2">
        Each of these is Airbnb against something you locked by name and dated. A source of truth
        does not outrank an accessibility floor or a decision you made, so none of them is applied
        and none of them is a recommendation. They are here so the collision is visible.
      </p>
      <div className="mt-4 space-y-4">
        {CONFLICTS.map((c) => (
          <div key={c.axis} className="min-w-0 rounded-[16px] border border-s-border bg-white p-4">
            <p className="text-[13px] text-s-ink-2">Your call</p>
            <p className="mt-1 font-heading font-semibold text-[15px] leading-snug text-s-ink">{c.axis}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-s-ink">
              <span className="font-semibold">Airbnb does this. </span>{c.ref}
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-s-ink">
              <span className="font-semibold">You locked this. </span>{c.lock}
            </p>
          </div>
        ))}
      </div>

      <h2 className="mt-16 font-heading font-semibold text-[18px] leading-snug text-s-ink">
        What we should not copy
      </h2>
      <ul className="mt-4 space-y-3">
        {DO_NOT_COPY.map((s) => (
          <li key={s} className="text-[13px] leading-relaxed text-s-ink-2">{s}</li>
        ))}
      </ul>

      <h2 className="mt-16 font-heading font-semibold text-[18px] leading-snug text-s-ink">
        The screens these numbers came from
      </h2>
      <p className="mt-2 text-[13px] leading-relaxed text-s-ink-2">
        Live airbnb.ch this morning at phone width. The originals sit in a folder git does not track,
        so both were copied into the mockup assets folder to keep this page working after a clone.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {[
          { src: "/_mockups/_assets/refs/airbnb/2026-08-20/home-mobile.png", cap: "Home, 390 wide" },
          { src: "/_mockups/_assets/refs/airbnb/2026-08-20/search-mobile.png", cap: "Search, 390 wide" },
        ].map((s) => (
          <figure key={s.src} className="min-w-0">
            {/* content-image-ok: a captured reference screenshot IS the evidence on a research page, not decoration */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={s.src}
              alt={s.cap}
              width={1170}
              height={1992}
              className="h-auto w-full rounded-[12px] border border-s-border"
            />
            <figcaption className="mt-2 text-[13px] leading-relaxed text-s-ink-2">{s.cap}</figcaption>
          </figure>
        ))}
      </div>

      <p className="mt-12 text-[13px] leading-relaxed text-s-ink-2">
        The same nine rules written down to stay:
        _design-system/references/airbnb--host-and-rules.md. The day calendar rebuilt to them:
        /dev/calendar-agenda, third block.
      </p>
    </main>
  );
}
