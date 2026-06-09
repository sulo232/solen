import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kontakt — Solen",
  description: "Kontaktiere Solen: allgemeine Anfragen, Hilfe für Kund:innen und Salons, Presse.",
};

export default async function KontaktPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const p = `/${locale}`;

  return (
    <main className="min-h-screen bg-white pb-24">
      <div className="max-w-2xl mx-auto px-4 pt-8">
        <Link
          href={p}
          className="inline-flex items-center gap-1 text-s-ink-2 hover:text-s-accent text-sm font-body transition-colors mb-8"
        >
          <ChevronLeft className="w-4 h-4" />
          Zurück
        </Link>

        <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-s-ink mb-2">
          Kontakt
        </h1>
        <p className="text-sm text-s-ink-2 mb-10">Wir helfen gern weiter.</p>

        <div className="space-y-8">
          <section>
            <h2 className="font-display text-s-ink text-lg font-semibold mb-3 pb-2 border-b border-s-border">
              Allgemeine Anfragen
            </h2>
            <p className="text-sm text-s-ink-2 leading-relaxed">
              <a href="mailto:hallo@solen.ch" className="text-s-accent hover:underline">
                hallo@solen.ch
              </a>
            </p>
          </section>

          <section>
            <h2 className="font-display text-s-ink text-lg font-semibold mb-3 pb-2 border-b border-s-border">
              Hilfe &amp; Support
            </h2>
            <ul className="space-y-2 text-sm text-s-ink-2">
              <li>
                <Link href={`${p}/help`} className="text-s-accent hover:underline">
                  Hilfe für Kund:innen
                </Link>
              </li>
              <li>
                <Link href={`${p}/partner`} className="text-s-accent hover:underline">
                  Hilfe für Salons
                </Link>
              </li>
              <li>
                Direkt:{" "}
                <a href="mailto:support@solen.ch" className="text-s-accent hover:underline">
                  support@solen.ch
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-s-ink text-lg font-semibold mb-3 pb-2 border-b border-s-border">
              Presse
            </h2>
            <p className="text-sm text-s-ink-2 leading-relaxed">
              Medienanfragen über die{" "}
              <Link href={`${p}/presse`} className="text-s-accent hover:underline">
                Presseseite
              </Link>{" "}
              oder{" "}
              <a href="mailto:hallo@solen.ch" className="text-s-accent hover:underline">
                hallo@solen.ch
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-s-ink text-lg font-semibold mb-3 pb-2 border-b border-s-border">
              Adresse
            </h2>
            <p className="text-sm text-s-ink-2 leading-relaxed">
              solen.ch, Basel-Stadt, 4000 Basel, Schweiz.{" "}
              <Link href={`${p}/impressum`} className="text-s-accent hover:underline">
                Impressum
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
