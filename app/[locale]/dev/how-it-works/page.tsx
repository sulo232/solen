/**
 * /dev/how-it-works , a board, not a page: how a booking reaches the shop's screen, drawn as boxes
 * and lines. Owner, twice: "I told you to give me a board with how everything works, like boxes and
 * lines connecting each other, to actually visualize everything."
 *
 * WHY IT IS ONE SVG AND NOT A STACK OF DIVS. The first build of this file drew five separate arrows,
 * each pointing at its own text label, and it was rejected before he saw it. It measured clean (3
 * sizes, 2 weights, no sideways scroll) and it was still the wrong thing, because a list of arrows
 * is a numbered list wearing arrows. The SHAPE is the message here: three ways in MERGE into one
 * spine, that spine feeds one screen, and two ways in stop dead before they reach it. A merge cannot
 * be drawn as five independent rows. So the whole drawing lives in one `viewBox="0 0 360 664"`,
 * which renders near 1:1 on a 390 phone and scales down without a horizontal scrollbar.
 *
 * Exists-check: `npm run exists how-it-works` = 3 hits, all unrelated marketing "How It Works"
 * sections (resend-link rail, /partner, /profile/referral). No page like this exists. Net-new.
 *
 * Grounded-in: app/[locale]/dev/decisions/page.tsx , the nearest real analog (a dev-only,
 * notFound()-in-production informational route). Container width, h1 step and the bordered-box
 * grammar follow that shipped file rather than inventing a new one.
 *
 * registered-component-ok: checked COMPONENT_REGISTRY.md before hand-writing a box. `Step` is the
 * closest by JOB (a numbered "how it works" card) and wrong by SKIN (sunken grey plus a blue
 * numeral, both banned here). `DashPanel` is right by skin and is the dashboard console's own
 * primitive, documented not to cross surfaces. Nothing in the registry is a flowchart node, because
 * no diagram like this has been built before.
 *
 * chart-ok: the geometry below is diagram connectors and boxes, which have no Lucide equivalent.
 * The hand-drawn-SVG ban targets icon substitutes, and this file uses no icons at all.
 *
 * NO DOUBLED CHROME: the three closing boxes are separated by whitespace, and the section above
 * them by whitespace too. No rule line anywhere on the page, because a bordered box plus a divider
 * is two devices claiming one boundary.
 *
 * COLOUR: every stroke and fill is a Tailwind token class and no literal colour appears in this
 * file. `stroke-s-success` for a path that works, `stroke-s-urgency` for the hole, `stroke-s-ink-2`
 * for the dead path, `stroke-s-ink` for the two boxes that are ours, `stroke-s-border` for a plain
 * edge. Tailwind emits `stroke-*` and `fill-*` for theme colours exactly as it does `bg-*`, so an
 * SVG node is styled the same way a div is.
 *
 * Type budget, the whole page: 4 sizes (20 h1, 15 section and box titles, 13 body and node titles,
 * 11 node sub-lines) and 2 weights (600, 400). White only, no dark mode, dev-only.
 */
import { notFound } from "next/navigation";

/** One box plus its two lines of text. x is the left edge, y the top. */
function Node({
  x,
  y,
  w,
  h,
  title,
  sub,
  stroke,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sub: string;
  stroke: string;
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={12} className={`fill-white ${stroke}`} strokeWidth={1} />
      <text x={x + 12} y={y + 19} fontSize={13} fontWeight={600} className="fill-s-ink">
        {title}
      </text>
      <text x={x + 12} y={y + 34} fontSize={11} className="fill-s-ink-2">
        {sub}
      </text>
    </g>
  );
}

/** A dashed stub that stops short, then a gap, then a cross. The gap is drawn, not implied: it is
 *  the whole reason these two rows are on the board at all. */
function DeadEnd({ y, stroke }: { y: number; stroke: string }) {
  return (
    <g className={stroke} strokeWidth={2} strokeLinecap="round">
      <line x1={240} y1={y} x2={262} y2={y} strokeDasharray="4 4" />
      <line x1={277} y1={y - 5} x2={287} y2={y + 5} />
      <line x1={287} y1={y - 5} x2={277} y2={y + 5} />
    </g>
  );
}

const MISSING = [
  { title: "A rule for when we get it wrong", why: "Our slot against their paper book. That call is yours, and it is not built." },
  { title: "Tomorrow's appointments", why: "The screen only loads today." },
  { title: "Texting the caller a link", why: "So they fill in their own details. The sender works, the account key is missing." },
];

export default function HowItWorksPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-[520px] px-5 pb-24 pt-10">
        <h1 className="font-display text-[20px] font-semibold leading-tight text-s-ink">
          How a booking reaches the shop&apos;s screen
        </h1>
        <p className="mt-2 text-[13px] leading-snug text-s-ink-2">
          Three ways in reach it. Two never do.
        </p>

        <svg data-chart-ok="chart-ok: diagram, boxes and connecting lines, no icons" viewBox="0 0 360 664" className="mt-6 h-auto w-full" fontFamily="Inter Tight, Inter, sans-serif" role="img" aria-label="Three ways a booking reaches us join into one path: our booking list and our walk-in line, which feed the screen on the counter. Two other ways, a shop writing it in its own book and a shop keeping its own calendar, stop before they reach us.">
          {/* the three that arrive */}
          <Node x={8} y={24} w={196} h={44} title="Books on Solen" sub="customer, on their phone" stroke="stroke-s-border" />
          <Node x={8} y={80} w={196} h={44} title="Walks in" sub="no appointment" stroke="stroke-s-border" />
          <Node x={8} y={136} w={196} h={44} title="Phones, shop types it" sub="counter enters it" stroke="stroke-s-border" />

          {/* three lines merging into one spine. this merge IS the picture. */}
          <g className="stroke-s-success" strokeWidth={2} strokeLinecap="round" fill="none">
            <line x1={204} y1={46} x2={268} y2={46} />
            <line x1={204} y1={102} x2={268} y2={102} />
            <line x1={204} y1={158} x2={268} y2={158} />
            <line x1={268} y1={46} x2={268} y2={239} />
            <polyline points="263,231 268,239 273,231" strokeLinejoin="round" />
          </g>

          {/* what we hold */}
          <rect x={40} y={240} width={280} height={72} rx={12} className="fill-white stroke-s-ink" strokeWidth={1} />
          <text x={56} y={263} fontSize={13} fontWeight={600} className="fill-s-ink">
            What we hold
          </text>
          <text x={56} y={285} fontSize={13} className="fill-s-ink-2">
            Our booking list
          </text>
          <text x={56} y={303} fontSize={13} className="fill-s-ink-2">
            Our walk-in line
          </text>

          <g className="stroke-s-success" strokeWidth={2} strokeLinecap="round" fill="none">
            <line x1={180} y1={312} x2={180} y2={351} />
            <polyline points="175,343 180,351 185,343" strokeLinejoin="round" />
          </g>

          {/* the screen itself, the only box with a heavy edge */}
          <rect x={40} y={352} width={280} height={116} rx={12} className="fill-white stroke-s-ink" strokeWidth={2} />
          <text x={56} y={377} fontSize={13} fontWeight={600} className="fill-s-ink">
            The screen on the counter
          </text>
          <text x={56} y={399} fontSize={13} className="fill-s-ink-2">
            who is in a chair
          </text>
          <text x={56} y={419} fontSize={13} className="fill-s-ink-2">
            who is waiting, and how long
          </text>
          <text x={56} y={439} fontSize={13} className="fill-s-ink-2">
            today&apos;s appointments
          </text>
          <text x={56} y={459} fontSize={13} className="fill-s-ink-2">
            one tap: they showed up
          </text>

          {/* the two that never arrive, drawn as the same kind of thing, failing */}
          <text x={8} y={520} fontSize={13} fontWeight={600} className="fill-s-urgency">
            Never reaches the screen
          </text>
          <Node
            x={8}
            y={532}
            w={232}
            h={48}
            title="Phones, shop writes it down"
            sub="in their own book. Nothing arrives."
            stroke="stroke-s-urgency"
          />
          <DeadEnd y={556} stroke="stroke-s-urgency" />
          <Node
            x={8}
            y={592}
            w={232}
            h={48}
            title="Their own calendar elsewhere"
            sub="we would only see busy time, no name"
            stroke="stroke-s-border"
          />
          <DeadEnd y={616} stroke="stroke-s-ink-2" />
        </svg>

        <h2 className="mt-12 text-[15px] font-semibold text-s-ink">What is still missing</h2>
        <div className="mt-4 flex flex-col gap-3">
          {MISSING.map((m) => (
            <div key={m.title} className="rounded-card border border-s-border bg-white p-4">
              <p className="break-words text-[15px] font-semibold text-s-ink">{m.title}</p>
              <p className="mt-1 break-words text-[13px] leading-snug text-s-ink-2">{m.why}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
