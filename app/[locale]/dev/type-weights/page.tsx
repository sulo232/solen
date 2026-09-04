"use client";

// Mockup-scope: whole-page
// Exists-check: `npm run exists "type weight budget"` -> 0 matches (2026-08-15). Nearest siblings
// are /dev/flatness (the 2026-07-25 emphasis-range comparison, a different question: SIZE range,
// not weight count) and /dev/pill-ceramic (today's pill colour pick). Neither compares weight
// budgets, and REMOVED.md has no entry for one.
//
// WHY THIS EXISTS. Owner 2026-08-15: "show me in mockups", about the one question left open, which
// is how many text weights the salon page is allowed to use.
//
// THIS IS THE REAL PAGE, NOT A REDRAW, which is the whole point of the mockup law. Each column is
// an <iframe> of the live salon route with ONE stylesheet injected on load. Nothing is rebuilt,
// nothing is approximated: what he compares is the actual product with a treatment swapped, and
// every number under each column is COUNTED in that frame at 390x844 rather than asserted by me.
//
// NO BLANKET RULES, deliberately, and the blanket-type gate is right to insist. The measured
// incident behind that gate is a `* { font-weight }` sweep that pushed body text UP while pulling
// emphasis DOWN, collapsing five weights to two and deleting the page's structure; the owner said
// every variant looked worse than the untouched page. So each override below targets the TIER it
// actually means, by the Tailwind class that already carries it: `.font-medium` is the middle step,
// `.font-semibold` is the heavy one. Body text is never touched by any variant, which is the
// difference between demoting a tier and erasing the system.
//
// emphasis-ok: this harness's OWN chrome carries one heavy word per block (the variant name, the
// words "The cost", the closing heading) and body copy at normal weight. It is a dev-only
// comparison tool that no customer can reach, in the same family the emphasis budget already
// exempts by name, and its real subject is the three phones below, whose emphasis share is
// measured live and printed under each one rather than being governed by this page's own chrome.
//
// English chrome throughout (mockup law). The product inside the frames renders its own locale,
// which the law explicitly exempts, and every word written HERE is English.

import * as React from "react";
import { notFound } from "next/navigation";

const TARGET = "/de/salon/cuts-and-culture";

type Variant = {
  id: string;
  name: string;
  what: string;
  cost: string;
  css: string;
};

const VARIANTS: Variant[] = [
  {
    id: "A",
    name: "A. What ships today",
    what: "Three weights. Body at the lightest, a middle step for the open status, the pills and the service names, and the heaviest for the salon name, the rating, the headings and the selected pill.",
    cost: "Breaks both of our own limits at once: three weights against a ceiling of two, and 37% of the visible text is bold against a ceiling of 30%.",
    css: "",
  },
  {
    id: "B",
    name: "B. Two weights, anchors stay bold",
    what: "The middle step drops to body weight. Only the salon name, the section headings, the rating, the price and the selected pill keep their weight. Body text is untouched.",
    cost: "The open status, every pill and every service name lose their step. The open status and the address end up looking equally important, and a service name reads the same as the minutes under it.",
    // Targets ONLY what already carries the middle tier. Body (400) and anchors (600) are not
    // selected at all, so this demotes a tier rather than flattening the page.
    css: `main .font-medium { font-weight: 400 !important; }`,
  },
  {
    id: "C",
    name: "C. Two weights, nothing bold",
    what: "The other way to two: the heavy tier drops to the middle step, so the strongest thing on the page is a medium. Body text is untouched here too.",
    cost: "The salon name stops being the anchor. Our own floor says every screen needs one clearly biggest, heaviest thing, and this removes half of that: the size stays, the weight goes.",
    // Targets ONLY what already carries the heavy tier, for the same reason as B.
    css: `main .font-semibold, main .font-bold { font-weight: 500 !important; }`,
  },
];

/** Counts weights and bold share inside one frame, at the same 390x844 the floors are measured at. */
const COUNT_SCRIPT = `
  (function () {
    try {
      var inFold = function (el) {
        var r = el.getBoundingClientRect();
        return r.top < 844 && r.bottom > 0 && r.width > 0 && r.height > 0;
      };
      var nodes = [].slice.call(document.querySelectorAll('main *')).filter(function (el) {
        if (!inFold(el)) return false;
        return [].slice.call(el.childNodes).some(function (n) {
          return n.nodeType === 3 && n.textContent.trim();
        });
      });
      var weights = {}, bold = 0;
      nodes.forEach(function (el) {
        var w = getComputedStyle(el).fontWeight;
        weights[w] = (weights[w] || 0) + 1;
        if (parseInt(w, 10) >= 600) bold++;
      });
      parent.postMessage({
        __typeCount: true,
        id: window.name,
        total: nodes.length,
        weights: Object.keys(weights).sort(),
        boldShare: nodes.length ? Math.round((bold / nodes.length) * 1000) / 10 : 0
      }, '*');
    } catch (e) { /* a frame that cannot be read reports nothing rather than a wrong number */ }
  })();
`;

export default function TypeWeightsPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const [counts, setCounts] = React.useState<Record<string, { total: number; weights: string[]; boldShare: number }>>({});

  React.useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data;
      if (d && d.__typeCount && d.id) {
        setCounts((c) => ({ ...c, [d.id]: { total: d.total, weights: d.weights, boldShare: d.boldShare } }));
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const onLoad = (v: Variant) => (e: React.SyntheticEvent<HTMLIFrameElement>) => {
    const doc = e.currentTarget.contentDocument;
    if (!doc) return;
    if (v.css) {
      const style = doc.createElement("style");
      style.textContent = v.css;
      doc.head.appendChild(style);
    }
    // Let the injected rule settle before counting.
    window.setTimeout(() => {
      const s = doc.createElement("script");
      s.textContent = COUNT_SCRIPT;
      doc.body.appendChild(s);
    }, 500);
  };

  return (
    <main className="min-h-screen bg-white px-5 py-10">
      <div className="mx-auto max-w-[1280px]">
        <h1 className="font-display text-[22px] font-semibold text-s-ink">Text weights, three ways</h1>
        <p className="mt-2 max-w-[620px] font-body text-[14px] leading-relaxed text-s-ink-2">
          Each column is the real salon page at phone size, with one rule swapped. Nothing is redrawn.
          The numbers under each are counted inside that frame, not written by hand.
        </p>

        <div className="mt-9 flex flex-wrap gap-8">
          {VARIANTS.map((v) => {
            const c = counts[v.id];
            const weightsOk = c ? c.weights.length <= 2 : null;
            const boldOk = c ? c.boldShare <= 30 : null;
            return (
              <section key={v.id} className="w-[390px] shrink-0">
                <h2 className="font-display text-[16px] font-semibold text-s-ink">{v.name}</h2>
                <p className="mt-1.5 font-body text-[13px] leading-relaxed text-s-ink-2">{v.what}</p>
                <p className="mt-1.5 font-body text-[13px] leading-relaxed text-s-ink-2">
                  The cost: {v.cost}
                </p>

                {/* plural-ok: a dev-only comparison harness that never ships to a customer and is
                    never localised. Its labels are deliberately English per the mockup law, so
                    routing a word like "weights" through next-intl would add four translations of
                    a string no customer can reach. */}
                {/* gap-4 rather than a separator glyph: the design contract forbids a middle dot
                    or a pipe, and a flex gap IS the no-glyph gap MetaDot exists to produce. Inside
                    a flex row MetaDot's own inline-block width collapses, which ran the three
                    readings together into one string the first time this rendered. */}
                <div className="mt-3 flex items-center gap-4 font-body text-[13px] tabular-nums text-s-ink-2">
                  {c ? (
                    <>
                      <span className={weightsOk ? "text-s-open" : "text-s-closed"}>
                        weights: {c.weights.length}
                      </span>
                      <span className={boldOk ? "text-s-open" : "text-s-closed"}>{c.boldShare}% bold</span>
                      <span>{c.total} text elements</span>
                    </>
                  ) : (
                    <span>counting…</span>
                  )}
                </div>

                <div className="mt-3 overflow-hidden rounded-card border border-s-border">
                  <iframe
                    name={v.id}
                    src={TARGET}
                    title={v.name}
                    onLoad={onLoad(v)}
                    width={390}
                    height={844}
                    className="block"
                  />
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-10 max-w-[620px] rounded-card border border-s-border p-5">
          <h2 className="font-display text-[16px] font-semibold text-s-ink">My pick, and why</h2>
          <p className="mt-2 font-body text-[13px] leading-relaxed text-s-ink-2">
            B, but I hold it loosely, and the honest version is that A may simply be right. The limits
            exist so a screen has a hierarchy rather than a wall of emphasis, and A already reads with
            a clear hierarchy: the salon name dominates, the price and rating carry weight, the meta
            recedes. B satisfies the rule and reads slightly flatter for it.
          </p>
          <p className="mt-3 font-body text-[13px] leading-relaxed text-s-ink-2">
            C is included because the mockup law asks for three, not because I would ship it. It gives
            up the anchor, which is a floor of its own.
          </p>
        </div>
      </div>
    </main>
  );
}
