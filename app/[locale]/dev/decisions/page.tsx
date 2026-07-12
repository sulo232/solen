/**
 * Exists-check: `npm run exists decision-mockup` -> 1 REMOVED hit (bundles,
 * unrelated). `npm run exists dev-flows` style hub pattern already exists
 * (app/[locale]/dev/flows/page.tsx, app/[locale]/dev/mockups/page.tsx = plain
 * card-list index conventions for /dev/*); this route reuses that convention
 * (hairline-separated list) rather than inventing new index chrome. Net-new:
 * the 5 links to the M1-M5 decision routes below.
 *
 * lang-ok: owner-facing decision mockup for a direct German-speaking owner review
 * (task spec: "German copy only (no EN)"), not an AI-only review artifact.
 *
 * Plain list of the 5 decision-mockup routes, hairline-separated rows, no
 * invented chrome.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

const DECISIONS = [
  { href: "decision-backbutton", name: "Zurück-Button: Kreisgrösse", desc: "40px vs. 44px" },
  { href: "decision-disabled", name: "Deaktiviert-Zustand: Deckkraft", desc: "opacity-40 vs. opacity-50" },
  { href: "decision-badge", name: "Benachrichtigungs-Badge: Farbe", desc: "s-error Rot vs. neutrales Ink" },
  { href: "decision-radius", name: "Ergebnis-Karte: Foto-Radius", desc: "18px vs. 22px" },
  { href: "decision-shadow", name: "PDP-Sektionskarte: Schatten", desc: "shadow-whisper vs. Hover elevation-2" },
];

export default function DecisionsIndexPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="mx-auto min-h-screen w-full max-w-[375px] bg-white">
      <div className="border-b border-s-border px-4 pb-4 pt-6">
        <h1 className="font-display text-[18px] font-semibold tracking-[-0.01em] text-s-ink">
          Entscheidungs-Mockups
        </h1>
        <p className="mt-1 text-[13px] leading-[1.4] text-s-ink-2">5 A/B-Vergleiche zur Wahl.</p>
      </div>
      <div>
        {DECISIONS.map((d) => (
          <Link
            key={d.href}
            href={d.href}
            className="flex items-center justify-between gap-3 border-b border-s-border px-4 py-4 last:border-b-0"
          >
            <span className="min-w-0">
              <span className="block truncate text-[14px] font-semibold text-s-ink">{d.name}</span>
              <span className="block truncate text-[12px] text-s-ink-2">{d.desc}</span>
            </span>
            <ChevronRight size={18} className="shrink-0 text-s-ink" aria-hidden />
          </Link>
        ))}
      </div>
    </div>
  );
}
