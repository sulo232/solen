import Link from "next/link";
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
              <a href="mailto:hallo@solen.ch" className="text-s-accent">
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
                <Link href={`${p}/help`} className="text-s-accent">
                  Hilfe für Kund:innen
                </Link>
              </li>
              <li>
                <Link href={`${p}/partner`} className="text-s-accent">
                  Hilfe für Salons
                </Link>
              </li>
              <li>
                Direkt:{" "}
                <a href="mailto:support@solen.ch" className="text-s-accent">
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
              <Link href={`${p}/presse`} className="text-s-accent">
                Presseseite
              </Link>{" "}
              oder{" "}
              <a href="mailto:hallo@solen.ch" className="text-s-accent">
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
              <Link href={`${p}/impressum`} className="text-s-accent">
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
