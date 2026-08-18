/**
 * Mockup-scope: whole-page
 *
 * Exists-check: `npm run exists outside-bookings` returns 0 matches, run 2026-08-17. The nearest
 * things are `_plans/MERCHANT_TERMINAL_2026-08-15.md` (the workstream record, prose, not a page) and
 * `_design-system/TERMINAL_PRINCIPLES.md` (design law, not product options). Net-new: the board he
 * asked for twice, as something he can open rather than a file he will not.
 *
 * THE ASK, verbatim, 2026-08-17: "i still havent gotten the idea board or smth from u n subagents n
 * evrth like critical stuff like appointments made outside of our platform that isnt using out full
 * dashboard like how does othr fresha etc do it or booking.com for example and is there smth for
 * dashboarditself to like be able to conncet".
 *
 * Every number and quote here came from a sourced research pass this session: four agents, 25+ live
 * vendor pages fetched, plus our own database and code. Nothing on this page is recalled.
 *
 * EMPHASIS: one weight per section, on the anchor only. The row labels (who does it, what it costs,
 * where it breaks) are ink-2 at normal weight and earn their separation from POSITION, not weight,
 * which is the same call the terminal made when it dropped from three weights to two.
 *
 * MEASURED on the rendered page rather than eyeballed, at 759px content width: 4 distinct sizes
 * (13 / 15 / 18 / 30) and 2 weights (400 / 600), 4% of characters at weight >= 600 against a 30%
 * ceiling, no horizontal overflow, nothing below 13px, and exactly two row paddings (24 and 20),
 * both on the 4pt scale. The 14px and the single 500 weight that also appear belong to the dev
 * layout's breadcrumb, which is chrome above this page and not part of it.
 *
 * Dev-only. Blocked in production below.
 */
import { notFound } from "next/navigation";

const INK = "text-s-ink";
const MUTED = "text-s-ink-2";
const LABEL = `font-body text-[13px] font-normal ${MUTED}`;
const BODY = `font-body text-[15px] font-normal leading-[1.5] ${INK}`;
const META = `font-body text-[13px] font-normal leading-[1.5] ${MUTED}`;

interface Path {
  n: string;
  title: string;
  what: string;
  who: string;
  cost: string;
  risk: string;
  verdict: string;
  verdictTone: "good" | "hard" | "no";
}

const PATHS: Path[] = [
  {
    n: "1",
    title: "The shop types it in",
    what:
      "A phone booking gets entered on the terminal: name, number, stylist, service, time. Built and working today.",
    who:
      "What every salon tool does. Fresha 5 steps, Treatwell 5 clicks, Shore 6, Square 9. Phorest wants first name, last name, mobile and email.",
    cost: "Done. It is on the terminal now.",
    risk:
      "This is the fragile one, and you named it before I did. It only works while somebody keeps typing. The day they stop, the board says a chair is free that is not.",
    verdict: "Necessary, and not enough on its own",
    verdictTone: "hard",
  },
  {
    n: "2",
    title: "The caller types it in",
    what:
      "The shop says I will send you a link, taps once, and the customer fills in their own name and number on their phone while still on the call.",
    who:
      "Nobody in salons does this. Fresha went further in May and had an AI answer the phone instead, English-speaking markets first.",
    cost: "A send-link button, a short booking page, and one text message. Days, not weeks.",
    risk:
      "Some callers will not do it. Older regulars, somebody ringing from a landline. There has to be a fallback, and that is path 1.",
    verdict: "The one I would build next",
    verdictTone: "good",
  },
  {
    n: "3",
    title: "Read the calendar they already keep",
    what: "We connect to their Google or Apple calendar and block whatever is in it.",
    who:
      "Five of seven tools do this. Every single one turns what it finds into busy, never into an appointment.",
    cost: "Weeks, plus login handling and a stack of edge cases.",
    risk:
      "It gives us no name, no service, no price, no money record. Square says so outright and so does Treatwell. Both could have read the event titles and chose not to. And in the closest real study only 11 in 100 of these businesses had any booking system to read from, so we would be building against something most of them do not own.",
    verdict: "Not worth it, and a vendor says so in writing",
    verdictTone: "no",
  },
  {
    n: "4",
    title: "Plug into the software they already pay for",
    what:
      "If the shop runs Salonized or something like it, we talk to that directly. They keep working exactly as they do now and our side stays true.",
    who:
      "The only model where the shop enters nothing and the platform stays right. Live in Switzerland today between two other products.",
    cost: "One integration per product. Real work, and it only pays off once many shops run the same tool.",
    risk:
      "Depends entirely on what a shop already has. Useless for the paper-book shops, which is most of them.",
    verdict: "Later, once we know what they run",
    verdictTone: "hard",
  },
];

const FACTS = [
  {
    fact: "Our own product already had the bug you were worried about",
    detail:
      "A walk-in sitting in a chair did not stop that stylist being booked online. Measured live, then fixed today.",
  },
  {
    fact: "Every calendar sync gives you busy, never a booking",
    detail:
      "Square, Treatwell and Fresha all bring outside events in as blocked time with no customer attached. Two of them say in writing that they refuse to read the details on purpose.",
  },
  {
    fact: "Nobody notices a shop that went quiet",
    detail:
      "Across seven products: no alert, no nudge, no check of the till against the calendar. Square runs both in one account and still never flags a sale with no appointment.",
  },
  {
    fact: "The phone is not a side channel, it is the channel",
    detail:
      "In the closest thing to a proper study, across 629 European restaurants: 65 in every 100 advance bookings came by phone, 88 came direct, and 6 came through every booking platform combined. Only 11 of those businesses had any booking system at all. That last number is what kills the calendar idea, not our opinion of it.",
  },
  {
    fact: "The no-show number everyone repeats is made up",
    detail:
      "The 20% figure traces back to one uncited sentence on a booking company's own blog. The proper research literature has no restaurant figure at all. Switzerland's real platform number is 1.9%, about one in fifty. Worth knowing before we ever build deposits on the strength of it.",
  },
  {
    fact: "93% of Swiss small businesses have no online booking at all",
    detail:
      "And hairdressers are the third most-wanted thing people want to book online, behind restaurants and doctors. Swiss study, 2025.",
  },
  {
    fact: "Blocking time out is often more work than entering the booking",
    detail:
      "In Fresha it is 9 steps to block versus 5 to enter the real appointment, so telling shops to just block it out makes things worse.",
  },
  {
    fact: "One of them answers your question on their own support page",
    detail:
      "Shore asks, as a heading: is Google Calendar suitable as a two-way bridge between two booking systems? Their answer is one word. No.",
  },
  {
    fact: "Phorest gave up on this in public",
    detail:
      "Their walk-in sales do not create calendar appointments at all, because a real appointment needs a name, a mobile and an email. A market leader shipping a permanent hole in its own numbers.",
  },
];

// WHAT THEY CHARGE, and it is on this page because the fee model decides the product. A platform
// paid per booking builds demand and charges the shop for its own popularity; a platform paid a flat
// fee builds tools. Every figure below was read off the vendor's own page or an SEC filing this week.
const MONEY = [
  {
    who: "OpenTable",
    model: "USD 149 to 499 a month, plus a dollar for every diner they send you",
    note:
      "Bookings from the restaurant's own website are free at the higher tiers. That is the tell: they sell demand, not software.",
  },
  {
    who: "TheFork, the European one",
    model: "A percentage of your average spend per guest, on every booking they send",
    note:
      "Same shape as OpenTable but the fee grows with your prices. Their own filing calls it a per seated diner fee. Owned by Tripadvisor, and they have a Swiss company.",
  },
  {
    who: "Resy and Tock",
    model: "USD 289 or 459 a month flat, nothing per booking",
    note:
      "American Express now owns both and has put them on one identical price list. The independent flat-fee challengers of ten years ago are all gone or bought.",
  },
  {
    who: "Yelp",
    model: "USD 129 to 279 a month, and they advertise never pay cover fees, ever",
    note: "The cheap tier is capped at 500 bookings a month, so volume is charged for by tier instead.",
  },
  {
    who: "The Swiss ones",
    model: "foratable CHF 115 to 180 a month flat, aleno quotes per shop, neither takes commission",
    note: "foratable says it plainly: a fixed price no matter how many reservations you get.",
  },
];

// THE HOTELS, because he named Booking.com and it is the sharpest comparison available: hotels hit
// this exact problem thirty years before salons had it. The answer is not what anyone expects.
const HOTELS = [
  {
    point: "They did not solve it with syncing. They solved it by being the book.",
    detail:
      "The hotel keeps one system, and everything else is a copy of it. Booking.com says so in its own help pages: always update in your own system, never in ours, because ours gets overwritten.",
  },
  {
    point: "For the small place with no software, the platform IS the book",
    detail:
      "A four-room bed and breakfast gets a free calendar they keep by hand. That is Booking.com's whole answer for them. Exactly our shops.",
  },
  {
    point: "They budget for getting it wrong, out loud",
    detail:
      "Booking.com charges no commission on a double booking if you have had four or fewer in a year. A company does not write a free-pass rule for something that never happens. It expects about four mistakes a year per place and eats them.",
  },
  {
    point: "Their own calendar sync runs two hours behind",
    detail:
      "And they admit in writing it causes double bookings. Airbnb's runs three hours behind and their blocked-out times may not even cross over. Our slots are 15 minutes long. That is not a slow feature, that is noise.",
  },
  {
    point: "Restaurants: only about 17 in 100 bookings came through the platform",
    detail:
      "The other 83 arrived by phone or somebody walking in, and staff typed them into the book on the counter. OpenTable was never the main way people booked. It was the book, and the book swallowed the phone.",
  },
];

// EVERY DECISION THAT IS ACTUALLY HIS, in one place he can open. They were scattered across a plan
// file he does not read, which is the same as not asking. Each one carries what I would do, so a
// yes or a no is a complete answer and he never has to compose a paragraph.
const DECISIONS = [
  {
    q: "Which of the four paths do we build?",
    mine: "The send-a-link one. It removes the typing instead of moving it.",
  },
  {
    q: "Do we write a rule for when we get it wrong?",
    mine:
      "Yes, and soon. Booking.com forgives four a year and eats the cost. Our version is our slot against their paper book, and no code can catch that one.",
  },
  {
    q: "Should the terminal show tomorrow, not just today?",
    mine:
      "Later. It is a different screen, not a wider query: today's list carries no date, the money line would sum both days, and the clash warning compares clock time only.",
  },
  {
    q: "Bring the phone booking across from where it is stranded?",
    mine:
      "Yes. It was built twice and merged neither time. Until it lands, the board understates a real day.",
  },
  {
    q: "Should accept and decline come back?",
    mine:
      "No. Every shop confirms instantly, and the only requests it ever showed were ones I had put there myself.",
  },
  {
    q: "Three text weights on the salon page, the rule says two. Which gives?",
    mine: "The rule. Three is what actually shipped and it reads fine.",
  },
];

const TONE: Record<Path["verdictTone"], string> = {
  good: "text-s-success",
  hard: "text-s-urgency",
  no: "text-s-ink-2",
};

export default async function OutsideBookingsBoard() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-[720px] bg-white px-5 pb-24 pt-10">
      <p className={LABEL}>The question</p>
      <h1 className={`font-heading mt-2 text-[30px] font-semibold leading-[1.15] ${INK}`}>
        A shop takes half its bookings by phone. How does our screen know?
      </h1>
      <p className={`${META} mt-3 text-[15px]`}>
        Four ways out, what each really costs, and what the shops that already solved it did. Every
        number here was checked against a live source this week, not remembered.
      </p>

      <div className="mt-10">
        <p className={LABEL}>The four paths</p>
        <ul className="mt-1">
          {PATHS.map((p) => (
            <li key={p.n} className="border-t border-s-border py-6 first:border-t-0">
              <div className="flex items-baseline gap-3">
                <span className={`font-body text-[13px] font-normal tabular-nums ${MUTED}`}>{p.n}</span>
                <h2 className={`font-heading text-[18px] font-semibold ${INK}`}>{p.title}</h2>
              </div>
              <p className={`${BODY} mt-2`}>{p.what}</p>
              <p className={`${META} mt-3`}>Who does it. {p.who}</p>
              <p className={`${META} mt-2`}>What it costs us. {p.cost}</p>
              <p className={`${META} mt-2`}>Where it breaks. {p.risk}</p>
              <p className={`font-body mt-3 text-[15px] font-normal ${TONE[p.verdictTone]}`}>{p.verdict}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-12">
        <p className={LABEL}>Nine things worth knowing</p>
        <ul className="mt-1">
          {FACTS.map((f) => (
            <li key={f.fact} className="border-t border-s-border py-5 first:border-t-0">
              <p className={`${BODY} leading-[1.4]`}>{f.fact}</p>
              <p className={`${META} mt-1`}>{f.detail}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-12">
        <p className={LABEL}>What the hotels did, since you asked about Booking.com</p>
        <ul className="mt-1">
          {HOTELS.map((h) => (
            <li key={h.point} className="border-t border-s-border py-5 first:border-t-0">
              <p className={`${BODY} leading-[1.4]`}>{h.point}</p>
              <p className={`${META} mt-1`}>{h.detail}</p>
            </li>
          ))}
        </ul>
        <p className={`${META} mt-4`}>
          The one thing here we do not have is the last idea in a different form: a published, priced
          tolerance for getting it wrong. We have the technical half, the database refuses a
          double booking. We have nothing for the collision that will actually happen, which is our
          slot against their paper book, and no database can see that one coming.
        </p>
      </div>

      <div className="mt-12">
        <p className={LABEL}>What they charge, since it decides what they build</p>
        <ul className="mt-1">
          {MONEY.map((m) => (
            <li key={m.who} className="border-t border-s-border py-5 first:border-t-0">
              <p className={`${BODY} leading-[1.4]`}>{m.who}</p>
              <p className={`${META} mt-1`}>{m.model}</p>
              <p className={`${META} mt-1`}>{m.note}</p>
            </li>
          ))}
        </ul>
        <p className={`${META} mt-4`}>
          The split is clean. Charge per booking and you end up building demand, then charging the
          shop for its own popularity, which is what drove a wave of restaurants off OpenTable. Charge
          a flat fee and you end up building tools, because you have no reason to route anybody. Both
          Swiss products took the flat side.
        </p>
      </div>

      <div className="mt-12 border-t border-s-border pt-6">
        <p className={LABEL}>What I need from you</p>
        <ul className="mt-1">
          {DECISIONS.map((d) => (
            <li key={d.q} className="border-t border-s-border py-5 first:border-t-0">
              <p className={`${BODY} leading-[1.4]`}>{d.q}</p>
              <p className={`${META} mt-1`}>{d.mine}</p>
            </li>
          ))}
        </ul>
        <p className={`${META} mt-4`}>
          Every one of these is waiting on you and nothing else. A yes or a no on any line is a
          complete answer.
        </p>
      </div>

      <div className="mt-12 border-t border-s-border pt-6">
        <p className={LABEL}>What I would do</p>
        <p className={`font-heading mt-2 text-[18px] font-semibold leading-[1.35] ${INK}`}>
          Keep the typing as the fallback it is, and build the send-a-link version next.
        </p>
        <p className={`${META} mt-3 text-[15px]`}>
          It is the only path that removes the typing instead of moving it, the customer ends up in
          the system properly with their own details, and it is days of work rather than weeks. The
          calendar-reading idea sounds like the answer and is not: it would hand us busy blocks with
          nobody attached, from a calendar most of these shops do not keep.
        </p>
      </div>
    </main>
  );
}
