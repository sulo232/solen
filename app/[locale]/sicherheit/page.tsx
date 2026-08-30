import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sicherheit — Solen",
  description: "Wie Solen Sie schützt: sichere Zahlungen über Stripe, geprüfte Salons, Melde-Funktion.",
};

export default async function SicherheitPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const p = `/${locale}`;

  return (
    <main className="min-h-screen bg-white pb-24">
      {/* mockup-ok: max-w-2xl swapped for the shared prose-measure utility (68ch), punch-list
          long-form-prose sweep (globals.css:223-225, owner-approved law TASTE_LOG.md:187 2026-07-15). */}
      <div className="prose-measure mx-auto px-4 pt-8">
        <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-s-ink mb-2">
          Sicherheit
        </h1>
        <p className="text-sm text-s-ink-2 mb-10">Wie wir Sie auf Solen schützen.</p>

        <div className="space-y-8">
          <section>
            <h2 className="font-display text-s-ink text-lg font-semibold mb-3 pb-2 border-b border-s-border">
              Sichere Zahlungen
            </h2>
            <p className="text-sm text-s-ink-2 leading-relaxed">
              Alle Online-Zahlungen laufen über Stripe, einen PCI-DSS-zertifizierten
              Zahlungsdienstleister. Solen speichert keine Kartendaten.
            </p>
          </section>

          <section>
            <h2 className="font-display text-s-ink text-lg font-semibold mb-3 pb-2 border-b border-s-border">
              Geprüfte Salons
            </h2>
            <p className="text-sm text-s-ink-2 leading-relaxed">
              Neue Salons werden vor der Freischaltung geprüft, bevor sie auf Solen
              buchbar sind.
            </p>
          </section>

          <section>
            <h2 className="font-display text-s-ink text-lg font-semibold mb-3 pb-2 border-b border-s-border">
              Etwas melden
            </h2>
            <p className="text-sm text-s-ink-2 leading-relaxed">
              Unangemessene Inhalte, Profile oder Bewertungen können Sie jederzeit{" "}
              <Link href={`${p}/report`} className="text-s-accent">
                melden
              </Link>
              . Wir prüfen jede Meldung.
            </p>
          </section>

          <section>
            <h2 className="font-display text-s-ink text-lg font-semibold mb-3 pb-2 border-b border-s-border">
              Ihre Daten
            </h2>
            <p className="text-sm text-s-ink-2 leading-relaxed">
              Wie wir mit Ihren Daten umgehen, steht in der{" "}
              <Link href={`${p}/privacy`} className="text-s-accent">
                Datenschutzerklärung
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
