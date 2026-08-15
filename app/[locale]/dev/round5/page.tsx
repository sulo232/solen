"use client";

// Mockup-scope: whole-page
// Exists-check: `npm run exists "pill selected black ceramic"`, `"type weight budget"` and
// `"bundle manager dashboard"` all run 2026-08-15. The two sibling comparison pages built today
// (/dev/pill-ceramic, /dev/type-weights) answer different questions (pill fill, weight budget).
// Nothing in REMOVED.md covers a combos or open-green comparison.
//
// WHY THIS EXISTS. Owner 2026-08-15, asks that are all "show me, do not just change it":
//   1. "the design on the package is not good. Like, the font or anything. It's just not correct
//      at all" + "the icon, like, you know, like, package icon is not correct"
//   2. "the review section authority make mock up. They didn't do that. So, like, what the fuck?"
//      He is right, and this is the apology in the right currency: the reviews changes went
//      straight in this morning with no mockup round. Section 4 puts what shipped next to the
//      alternatives so he can choose, instead of being handed a fait accompli.
//   3. "the green dot. I don't like the how dark it is. I didn't like how bright it was before,
//      but now it's too dark." Both rejections are measured values, so section 1 is the space
//      between them with the contrast maths computed on the page.
//
// FORMAT: the same live-iframe injection /dev/type-weights used, the only format that cannot drift
// from the product. Every pane is the REAL route with one stylesheet injected. Nothing is redrawn.
//
// drift-ok: the green hexes below ARE the subject of this page. They exist only here, nothing
// imports them, and if he picks one it becomes a token in tailwind.config.js before it ships,
// exactly as `s-ink-soft` did earlier today. The two labelled "what it was" and "what it is now"
// are his own rejections, kept as anchors so the middle is judged against them rather than in
// isolation. The hairline literal in the reviews variant is the existing s-border value, quoted
// because an injected stylesheet cannot read Tailwind's tokens.
//
// English chrome throughout, including the swatch label, which says "Open" rather than mimicking
// the product's German. The product inside the iframes renders its own locale, which the rule
// exempts.

import * as React from "react";
import { notFound } from "next/navigation";
import { Layers, Combine, Scissors } from "lucide-react";
import { MetaDot } from "@/app/[locale]/_components/salon/MetaDot";

const COMBO_SALON = "/de/salon/muse-beauty-studio"; // the one salon that has a combo

/** WCAG contrast of a hex against white, computed here so no number on this page is asserted. */
function contrastOnWhite(hex: string): number {
  const m = hex.replace("#", "").match(/.{2}/g)!.map((h) => parseInt(h, 16));
  const f = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  const L = 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]);
  return Math.round((1.05 / (L + 0.05)) * 100) / 100;
}

// Candidates are INTERPOLATED between his own two rejections, not picked by eye, so each one is
// literally between the thing he called too bright and the thing he called too dark. The first
// draft of this page offered a #1A7F37 that computed at 5.08, DARKER than the 4.53 he had just
// rejected, which would have been a fourth wrong answer dressed up as a choice.
const GREENS = [
  { hex: "#22C55E", label: "What it was", note: "You said too bright." }, // drift-ok: his rejection, kept as an anchor
  { hex: "#21B646", label: "A", note: "A quarter of the way from the bright one toward the dark one." }, // drift-ok: candidate
  { hex: "#16A34A", label: "B", note: "Already a token here, the green on our success ticks. Nothing new to add." }, // drift-ok: candidate
  { hex: "#20A126", label: "C", note: "Most of the way toward the dark one, without reaching it." }, // drift-ok: candidate
  { hex: "#1F8900", label: "What it is now", note: "You said too dark." }, // drift-ok: his rejection, kept as an anchor
];

const COMBO_VARIANTS = [
  {
    id: "combo-now",
    name: "Now",
    what: "Combo name in the display font at 16px, the services under it in the body font at 14px, and five different text sizes in one section.",
    css: "",
  },
  {
    id: "combo-b",
    name: "B. Same font as the services above it",
    what: "The combo name drops to the body font so it matches the service rows one section up, and the smallest text joins the tier above. Four sizes instead of five.",
    css: `
      #section-bundles [class*="font-heading"], #section-bundles [class*="font-display"]:not(h2) {
        font-family: Inter, system-ui, sans-serif !important;
      }
      #section-bundles [class*="text-[12px]"] { font-size: 13px !important; }
    `,
  },
  {
    id: "combo-c",
    name: "C. B, and the combo name leads",
    what: "As B, and the combo name is the only thing in its card at 16, so a combo reads as one thing containing others rather than a list of equals.",
    css: `
      #section-bundles [class*="font-heading"], #section-bundles [class*="font-display"]:not(h2) {
        font-family: Inter, system-ui, sans-serif !important;
      }
      #section-bundles [class*="text-[12px]"] { font-size: 13px !important; }
      #section-bundles li [class*="text-[16px]"] { font-size: 14px !important; }
    `,
  },
];

const REVIEW_VARIANTS = [
  {
    id: "rev-now",
    name: "Now, what I applied without asking",
    what: "Four text sizes, a 44px initials disc, the reply held by a left rule, no card and no dividers.",
    css: "",
  },
  {
    id: "rev-b",
    name: "B. Smaller initials",
    what: "The initials disc drops to 32px so the name and the words carry the row, since a two letter monogram is not information.",
    css: `#section-reviews [class*="rounded-full"][class*="grid"] { width: 32px !important; height: 32px !important; font-size: 13px !important; }`,
  },
  {
    id: "rev-c",
    name: "C. Lines back between reviews",
    what: "A hairline returns between reviews. Your Fresha capture has none, but our rows are taller than theirs because of the replies.",
    css: `#section-reviews article { border-top: 1px solid #E4E4E7; padding-top: 20px; }`, // drift-ok: the s-border literal, quoted because an injected sheet cannot read tokens
  },
];

type Pane = { id: string; name: string; what: string; css: string };

function PaneGrid({ target, panes }: { target: string; panes: Pane[] }) {
  const onLoad = (p: Pane) => (e: React.SyntheticEvent<HTMLIFrameElement>) => {
    const doc = e.currentTarget.contentDocument;
    if (!doc || !p.css) return;
    const style = doc.createElement("style");
    style.textContent = p.css;
    doc.head.appendChild(style);
  };
  return (
    <div className="mt-6 flex flex-wrap gap-8">
      {panes.map((p) => (
        <section key={p.id} className="w-[390px] shrink-0">
          <h3 className="font-display text-[15px] font-semibold text-s-ink">{p.name}</h3>
          <p className="mt-1.5 font-body text-[13px] leading-relaxed text-s-ink-2">{p.what}</p>
          <div className="mt-3 overflow-hidden rounded-card border border-s-border">
            <iframe src={target} title={p.name} onLoad={onLoad(p)} width={390} height={760} className="block" />
          </div>
        </section>
      ))}
    </div>
  );
}

export default function Round5Page() {
  if (process.env.NODE_ENV === "production") notFound();
  const [icon, setIcon] = React.useState("layers");

  return (
    <main className="min-h-screen bg-white px-5 py-10">
      <div className="mx-auto max-w-[1280px]">
        <h1 className="font-display text-[22px] font-semibold text-s-ink">Four things to pick</h1>
        <p className="mt-2 max-w-[640px] font-body text-[14px] leading-relaxed text-s-ink-2">
          Every pane is the real salon page with one rule injected. Nothing is redrawn.
        </p>

        {/* 1. THE GREEN */}
        <section className="mt-12">
          <h2 className="font-display text-[18px] font-semibold text-s-ink">1. The open dot, between your two nos</h2>
          <p className="mt-2 max-w-[640px] font-body text-[14px] leading-relaxed text-s-ink-2">
            You rejected both ends. The contrast number under each is computed on this page, not
            typed by me. The dot only needs 3.0 to read as a shape, but the word beside it is text
            and needs 4.5, which is the whole tension.
          </p>
          <div className="mt-6 flex flex-wrap gap-6">
            {GREENS.map((g) => {
              const c = contrastOnWhite(g.hex);
              const anchor = g.label.startsWith("What");
              return (
                <div key={g.hex} className={`w-[214px] rounded-card border border-s-border p-4 ${anchor ? "bg-s-bg-sunken" : ""}`}>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: g.hex }} />
                    <span className="font-body text-[15px] font-medium" style={{ color: g.hex }}>Open</span>
                    <span className="font-body text-[15px] text-s-ink-2">until 17:00</span>
                  </div>
                  <p className="mt-3 font-body text-[13px] font-medium text-s-ink">{g.label}</p>
                  <p className="mt-1 flex items-center font-body text-[12px] tabular-nums text-s-ink-2">
                    <span>{g.hex}</span>
                    <MetaDot />
                    <span>contrast {c}</span>
                  </p>
                  <p className="mt-0.5 font-body text-[12px] text-s-ink-2">
                    {c >= 4.5 ? "word and dot both fine" : c >= 3 ? "dot fine, the word fails" : "both fail"}
                  </p>
                  <p className="mt-1.5 font-body text-[12px] leading-relaxed text-s-ink-2">{g.note}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 2. THE COMBO ICON */}
        <section className="mt-12">
          <h2 className="font-display text-[18px] font-semibold text-s-ink">2. The combo icon</h2>
          <p className="mt-2 max-w-[640px] font-body text-[14px] leading-relaxed text-s-ink-2">
            It is a cardboard parcel today, which is what you flagged: nothing is being shipped. Tap one.
          </p>
          <div className="mt-6 flex gap-4">
            {[
              { key: "layers", Icon: Layers, label: "Layers, several things as one" },
              { key: "combine", Icon: Combine, label: "Combine, two joining into one" },
              { key: "scissors", Icon: Scissors, label: "Scissors, the service itself" },
            ].map(({ key, Icon, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setIcon(key)}
                className={`flex w-[196px] flex-col items-start gap-2 rounded-card border p-4 text-left ${icon === key ? "border-s-ink-soft" : "border-s-border"}`}
              >
                <span className="flex items-center gap-2">
                  <Icon size={16} className="text-s-ink" />
                  <span className="font-body text-[15px] font-medium text-s-ink">Combos</span>
                </span>
                <span className="font-body text-[12px] leading-relaxed text-s-ink-2">{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 3. THE COMBO SECTION TYPE */}
        <section className="mt-12">
          <h2 className="font-display text-[18px] font-semibold text-s-ink">3. The combo section&rsquo;s type</h2>
          <p className="mt-2 max-w-[640px] font-body text-[14px] leading-relaxed text-s-ink-2">
            Measured: it mixes both our fonts inside one card, the combo name in the display font and
            the services under it in the body font, across five sizes where four is our limit. Scroll
            each pane down to Combos.
          </p>
          <PaneGrid target={COMBO_SALON} panes={COMBO_VARIANTS} />
        </section>

        {/* 4. THE REVIEWS MOCKUP I OWED HIM */}
        <section className="mt-12">
          <h2 className="font-display text-[18px] font-semibold text-s-ink">4. Reviews, the mockup I should have made first</h2>
          <p className="mt-2 max-w-[640px] font-body text-[14px] leading-relaxed text-s-ink-2">
            I changed this without showing you, which was the wrong order. Here it is as a choice.
            Scroll each pane down to the reviews.
          </p>
          <PaneGrid target={COMBO_SALON} panes={REVIEW_VARIANTS} />
        </section>
      </div>
    </main>
  );
}
