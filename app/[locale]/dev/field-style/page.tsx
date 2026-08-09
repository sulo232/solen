/**
 * /dev/field-style , the input BOX, three ways, from measurements taken on the live sites.
 *
 * He asked "is this style even correct how does airbnb n uber do", meaning the flat grey box. Both
 * references were opened and measured on 2026-08-09; not one number here is recalled.
 *
 *   OURS    44px tall (h-11), 12px corner, flat #F4F4F5 fill, NO edge at rest and none on focus.
 *   AIRBNB  60px tall, 12px corner, NO fill (transparent), a 1px grey edge rgb(140,140,140).
 *   UBER    48px tall, 8px corner, grey fill rgb(246,246,246), and a 2px BLACK edge on focus.
 *
 * EDGES ARE BORDERS HERE, NOT RINGS, and that is not a workaround. The no-focus-ring rule refused
 * the first version and it was right to: he has killed the glow halo three times, and the design
 * contract says input focus is ONE INK EDGE and no halo. A border is both the compliant way and the
 * accurate one, because neither reference uses a glow either. Airbnb paints a 1px inset box-shadow
 * that reads as a hairline edge, Uber a 2px solid border.
 *
 * Each block shows a resting field AND a focused one, because a screenshot cannot tap and the whole
 * finding is that ours has no focus edge at all.
 *
 * The two foreign hex values carry `drift-ok`: they are the REFERENCES, measured off another
 * company's site. Mapping them to our tokens would destroy the only thing this page is for.
 *
 * Dev-only, notFound() in production. English copy: dev surface.
 * exists-check: `npm run exists field-style` = 0 matches. Nearest is /dev/form-labels, which this
 * deliberately does NOT extend , that page is the LABEL, this one is the BOX.
 */
import { notFound } from "next/navigation";

type Style = {
  key: string;
  who: string;
  measured: string;
  rest: string;
  focus: string;
  note: string;
};

const AIRBNB_EDGE = "border-[#8C8C8C]"; // drift-ok: measured off airbnb.ch, their value not ours
const UBER_FILL = "bg-[#F6F6F6]"; // drift-ok: measured off auth.uber.com, their value not ours

const STYLES: Style[] = [
  {
    key: "Ours today",
    who: "solen",
    measured: "44 tall, 12 corner, grey fill, no edge",
    rest: "h-11 w-full rounded-[12px] bg-s-bg-sunken px-3 text-[16px] text-s-ink",
    focus: "h-11 w-full rounded-[12px] bg-s-bg-sunken px-3 text-[16px] text-s-ink",
    note: "Rest and tapped look identical here, which is the finding. The field has no boundary of its own, so a stack of them reads as one grey area rather than as separate things to fill.",
  },
  {
    key: "Airbnb",
    who: "measured on their live login",
    measured: "60 tall, 12 corner, no fill, 1px grey edge",
    rest:
      "h-[60px] w-full rounded-[12px] bg-white px-3 text-[16px] text-s-ink border " + AIRBNB_EDGE,
    focus:
      "h-[60px] w-full rounded-[12px] bg-white px-3 text-[16px] text-s-ink border-2 border-s-ink",
    note: "No grey at all. White field, one hairline edge, and 16px taller than ours. The edge thickens to ink when you tap in, so the boundary does all the work.",
  },
  {
    key: "Uber",
    who: "measured on their live sign-in",
    measured: "48 tall, 8 corner, grey fill, 2px black on focus",
    rest: "h-12 w-full rounded-[8px] px-3 text-[16px] text-s-ink " + UBER_FILL,
    focus: "h-12 w-full rounded-[8px] px-3 text-[16px] text-s-ink border-2 border-s-ink " + UBER_FILL,
    note: "Almost our grey, almost our shape, and then a solid black edge appears the moment you tap in. That edge is the entire state change, and it is the part we do not have.",
  },
];

/**
 * A field rendered as a DIV, not an <input>, and that is a finding rather than a shortcut.
 *
 * The first version used real inputs and every single one came back identical when measured:
 * 48px tall, 12px corner, grey fill, whatever classes were on it. `app/globals.css` carries a
 * blanket rule , `input:not([type=checkbox])...` , setting `min-height: 48px; border-radius: 12px;
 * border: 1px solid transparent` on every input in the product, and it out-specifies the utilities.
 * So a comparison page built from inputs would have shown him three identical grey boxes and called
 * them three different designs. The screenshot looked fine; only measuring caught it.
 *
 * THE PRODUCT FINDING HIDING IN THAT: our fields already HAVE a 1px border. It is transparent. The
 * missing edge is one colour value away, not a redesign.
 */
function Box({ cls, children }: { cls: string; children: React.ReactNode }) {
  return (
    <div className={"mt-1.5 flex items-center " + cls}>
      <span className="truncate">{children}</span>
    </div>
  );
}

function Row({ s }: { s: Style }) {
  return (
    <section className="rounded-card border border-s-border bg-white p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-s-ink">{s.key}</h2>
        <span className="text-[12px] text-s-ink-2">{s.who}</span>
      </div>
      <p className="mt-1 text-[12px] tabular-nums text-s-ink-2">{s.measured}</p>

      <p className="mt-4 text-[12px] text-s-ink-2">at rest</p>
      <Box cls={s.rest}>anna@example.ch</Box>

      <p className="mt-4 text-[12px] text-s-ink-2">tapped in</p>
      <Box cls={s.focus}>anna@example.ch</Box>

      <p className="mt-4 text-[14px] leading-[1.55] text-s-ink-2">{s.note}</p>
    </section>
  );
}

export default function FieldStylePage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="min-h-dvh bg-s-bg-sunken">
      <div className="mx-auto max-w-[560px] px-4 py-10">
        <h1 className="font-display text-[30px] font-semibold leading-[1.1] text-s-ink">
          The grey box, three ways
        </h1>
        <p className="mt-3 text-[14px] leading-[1.55] text-s-ink-2">
          Every number here was measured on their live sites today, not remembered. Each one shows
          the field at rest and the same field tapped into, because that is where ours differs most.
        </p>

        <div className="mt-8 space-y-4">
          {STYLES.map((s) => (
            <Row key={s.key} s={s} />
          ))}
        </div>

        <div className="mt-8 rounded-card border border-s-border bg-white p-4">
          <p className="text-[15px] font-semibold text-s-ink">Three of ours in a row</p>
          <p className="mt-1 text-[14px] leading-[1.55] text-s-ink-2">
            This is what a real form looks like today. The boxes run together, because nothing
            separates them from each other or from the tray behind them.
          </p>
          <div className="mt-4 space-y-2 rounded-[16px] bg-s-bg-sunken p-3">
            <Box cls="h-11 w-full rounded-[12px] bg-s-bg-sunken px-3 text-[16px] text-s-ink">anna@example.ch</Box>
            <Box cls="h-11 w-full rounded-[12px] bg-s-bg-sunken px-3 text-[16px] text-s-ink">+41 79 123 45 67</Box>
            <Box cls="h-11 w-full rounded-[12px] bg-s-bg-sunken px-3 text-[16px] text-s-ink">Basel</Box>
          </div>

          <p className="mt-5 text-[15px] font-semibold text-s-ink">The same three with an edge</p>
          <div className="mt-3 space-y-2 rounded-[16px] bg-s-bg-sunken p-3">
            <Box cls="h-11 w-full rounded-[12px] border border-s-border bg-white px-3 text-[16px] text-s-ink">anna@example.ch</Box>
            <Box cls="h-11 w-full rounded-[12px] border border-s-border bg-white px-3 text-[16px] text-s-ink">+41 79 123 45 67</Box>
            <Box cls="h-11 w-full rounded-[12px] border border-s-border bg-white px-3 text-[16px] text-s-ink">Basel</Box>
          </div>
        </div>

        <p className="mt-8 text-[14px] leading-[1.55] text-s-ink-2">
          My pick is Uber&apos;s: keep the grey, add the black edge on tap. It is the smallest change
          of the three, it keeps everything already built, and it fixes the part that is actually
          wrong, which is that tapping a field currently looks like nothing happened. Airbnb&apos;s
          white-with-an-edge is the better-looking one, and it means every field in the product gets
          16px taller and loses its fill.
        </p>
      </div>
    </main>
  );
}
