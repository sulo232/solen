/**
 * /dev/airbnb-rules , real Airbnb screenshots first, then the rules you can actually point at
 * inside them.
 *
 * exists-check: `npm run exists airbnb` run again this turn, 24 hits (was 20 on the prior pass of
 * this same file), all read. The four new hits since then are this file's own prior content
 * (routes/exports/inline-section hits on itself) plus one more graveyard row (the 6/5 card ratio,
 * 2026-08-14); none of it touches this page. This is a rebuild of an EXISTING route, not a new one.
 *
 * Grounded-in: public/_mockups/_assets/refs/airbnb/2026-08-20/home-mobile.png , the real captured
 * screenshot this whole page is built around and renders directly (see SCREENSHOTS below). The
 * second capture it renders, search-mobile.png, sits in the same folder.
 *
 * measure-ok: the reference numbers on this page (image pixel dimensions, capture width) describe
 * the SCREENSHOT FILES themselves, not an element size copied into our own UI, so there is no
 * "ours" size to derive a ratio from; nothing here proposes an avatar/icon/tile dimension. The
 * one place this page does compare to our own product, the weight counts in each rule's "what we
 * do instead" line (e.g. "semibold twelve times and medium zero times"), already cites our side.
 *
 * Mockup-scope: whole-page
 *
 * REBUILT 2026-08-20, owner verbatim: "the airbnb sh u made is not like copying one of their
 * screen u jst made sm randm sh". The old version was nine numbered principles illustrated with
 * hand-drawn swatches built in OUR OWN styling (a red disc standing in for their alert colour, a
 * black pill standing in for their button), a two-column comparison grid repeated nine times, and
 * a paragraph of evidence under every rule. He never saw one real Airbnb pixel. FIXED by putting
 * the two real captures first and large, then reducing each rule to one sentence that names
 * something literally visible in one of those two pictures, then one line per kept rule for what
 * we do instead. Every swatch component, the Pair/Wide demo scaffolding, the CONFLICTS section,
 * the ranked CHANGES list and the DO_NOT_COPY list are gone from this page. None of that content
 * is lost: it is unedited in _design-system/references/airbnb--host-and-rules.md, which this page
 * still names at the point every cut rule would have appeared.
 *
 * RE-CAPTURED 2026-08-20, same day, second pass. The first capture swept the page with Airbnb's
 * own cookie-consent sheet and app-install banner still up, so the first version of this page
 * pointed at a picture of a cookie dialog, not their product. The capture script now dismisses
 * both before it screenshots. Both files re-verified this turn: `sips -g pixelWidth -g
 * pixelHeight` still returns 1170x1992 on both, both render, and both now show real content, not
 * a modal: the home capture carries a search pill, category pills, two photo listing cards under
 * "Beliebte Unterkünfte in Paris", a second section, and the bottom nav; the search capture
 * carries the Basel query pill, a filter-chip row, and a price-tagged map. Every rule below was
 * re-checked against this new content from first principles, nothing was carried over unread from
 * the first pass.
 *
 * SIX RULES STILL CUT, for three different reasons now that the modal is gone:
 *   - Rule 8 (buttons off one ladder) LOST its evidence: the buttons it cited were the cookie
 *     sheet's "Alle akzeptieren" / "Nur notwendige", which no longer exist in either frame, and no
 *     comparable button ladder is visible in the new captures (the "see all" affordance is one
 *     grey icon button, not a ladder of several). Cut, not carried forward from the first pass.
 *   - Rule 4 (whatever you cannot act on renders quieter) has a tempting candidate, the grey meta
 *     and grey price under each listing's black title, but that pairing is fully actionable, the
 *     whole card, the date range and the guest count are all tappable, so it is the SAME mechanism
 *     as rule 6 below (weight marks the heading), not a distinct "cannot act on this" instance.
 *     Folding it into rule 4 as well would double-count one observation under two numbers, so it
 *     stays cut here.
 *   - Rule 7 (a box is earned by row complexity) has a real, visible pattern on the home capture,
 *     the three category pills each carry a border and the two photo cards carry none, but that
 *     is the OPPOSITE of what rule 7 itself claims (rule 7 says complexity earns a box; here the
 *     simple pills have the border and the complex cards do not). Labelling it rule 7 would
 *     misstate what rule 7 says, so it stays cut on this page; flagged as possibly worth its own
 *     line in the written spec, separately from this rule.
 *   - Rules 2 (a hue ranks, never labels), 3 (a status hue lives in a small mark) and 9 (something
 *     changes within one frame of a tap) still have no visible instance in a static two-image
 *     capture, same as the first pass; rule 9 cannot be shown in any static image by definition.
 * KEPT, three now: two carried over and one newly found on the re-capture.
 *   - Rule 1 (colour concentration): still the home capture. Every rating star, price and heart on
 *     it is plain black or grey; the pink "Erkunden" tab and its icon are the only chosen UI
 *     colour anywhere on the page.
 *   - Rule 5 (the biggest thing is a fact just learned, not the screen's own name): NEW on this
 *     pass. "Über 1.000 Unterkünfte" on the search capture renders larger than the query pill
 *     above it, a live count, not the word "Search" or the screen's own title.
 *   - Rule 6 (weight marks a heading): still the search capture's query pill, "Unterkünfte in
 *     Basel" bold over "Eine Woche · Gäste hinzufügen" thin grey directly under it.
 * A candidate the coordinator also named, a 2px black border on a selected control in the search
 * capture, was checked and NOT added: no chip, pin or control in the visible frame carries a
 * heavier or differently-coloured border than its neighbours, so that specific claim could not be
 * confirmed against the actual pixels and nothing was written for it.
 *
 * Type budget: two sizes (15, 13) and two weights (600, 400), well inside the four-size / two-
 * weight cap. No display anchor is claimed: the two photographs are the screen's focal content,
 * the named exception in FLOORS LAW 6.
 *
 * lang-ok, locale-copy-mockup: de , the small set of German strings below (each also marked
 * german-ok on its own line) are not authored mockup copy, they are literal quotes of Airbnb's
 * own captured UI text (Erkunden, Über 1.000 Unterkünfte, Unterkünfte in Basel, Eine Woche,
 * Gäste hinzufügen) cited as evidence for a rule sentence pointing at the screenshot directly
 * above it. Every sentence we wrote ourselves, every heading, caption and "what we do instead"
 * line, is English.
 *
 * Dev-only preview route, notFound() in production like every other page under app/[locale]/dev/.
 */
import { notFound } from "next/navigation";

const SCREENSHOTS: { src: string; title: string; caption: string }[] = [
  {
    // locale-copy-mockup: de , quoting Airbnb's own captured UI copy from the screenshot below, not our authored copy
    src: "/_mockups/_assets/refs/airbnb/2026-08-20/home-mobile.png",
    title: "Airbnb, home.",
    caption: "Mobile web, captured live 20 August 2026 at 390px width. Their real home feed: a search pill, category pills, and photo listing cards under “Beliebte Unterkünfte in Paris”.", // german-ok: quoting Airbnb's own captured UI copy from the screenshot above, not our authored copy
  },
  {
    src: "/_mockups/_assets/refs/airbnb/2026-08-20/search-mobile.png",
    title: "Airbnb, search results for Basel.",
    caption: "Mobile web, captured live 20 August 2026 at 390px width. Their real search results: a query pill, a filter-chip row, and a price-tagged map.",
  },
];

// locale-copy-mockup: de , the strings below quote Airbnb's own captured UI copy from the two
// screenshots rendered above, cited as evidence for a rule sentence, not authored mockup copy.
const RULES: { n: number; statement: string; ours: string }[] = [
  {
    n: 1,
    statement: "In the home capture above, every rating star, price and heart is plain black or grey, the pink “Erkunden” tab and its icon are the only chosen UI colour on the whole page.", // german-ok: quoting Airbnb's own captured UI copy from the screenshot above, not our authored copy
    ours: "Our day agenda fills a green block on every free half hour, eighteen times on a quiet day, colour spent on nothing in particular.",
  },
  {
    n: 5,
    statement: "In the search capture above, “Über 1.000 Unterkünfte” renders larger than the query pill above it, the biggest text on the screen is a live count, not the screen's own name.", // german-ok: quoting Airbnb's own captured UI copy from the screenshot above, not our authored copy
    ours: "Our dashboard screens open with their own name, Kalender, Dashboard, rather than a fact the day just produced.",
  },
  {
    n: 6,
    statement: "In the search capture above, “Unterkünfte in Basel” sits bold and dark while “Eine Woche · Gäste hinzufügen” directly under it, in the same pill, sits thin and grey, weight alone marks which line is the heading.", // german-ok, drift-ok: quoting Airbnb's own captured UI copy incl. their own middle-dot separator, exactly as rendered in the screenshot above, not our authored separator choice
    ours: "Every row in our agenda is semibold, so nothing reads as the heading, the block asks for semibold twelve times and medium zero times.",
  },
];

export default function AirbnbRulesPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto w-full max-w-[480px] overflow-x-hidden bg-white px-4 py-8">
      <div className="space-y-8">
        {SCREENSHOTS.map((s) => (
          <figure key={s.src} className="min-w-0">
            {/* content-image-ok: a captured reference screenshot IS the evidence on a research page, not decoration */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={s.src}
              alt={s.title}
              width={1170}
              height={1992}
              className="h-auto w-full rounded-[12px] border border-s-border"
            />
            <figcaption className="mt-2 text-[13px] leading-relaxed text-s-ink-2">
              <span className="font-semibold text-s-ink">{s.title} </span>
              {s.caption}
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="mt-10 space-y-6">
        {RULES.map((r) => (
          <p key={r.n} className="text-[15px] leading-relaxed text-s-ink">
            {r.statement}
          </p>
        ))}
      </div>

      <h2 className="mt-10 text-[15px] font-semibold text-s-ink">What we do instead</h2>
      <ul className="mt-3 space-y-2">
        {RULES.map((r) => (
          <li key={r.n} className="text-[13px] leading-relaxed text-s-ink-2">
            {r.ours}
          </li>
        ))}
      </ul>
    </main>
  );
}
