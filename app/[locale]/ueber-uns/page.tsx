import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Über uns — Solen",
  description: "Solen ist die Schweizer Buchungsplattform für Beauty & Wellness. Salons finden, in 30 Sekunden buchen, ohne Anrufen.",
};

export default async function UeberUnsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const p = `/${locale}`;

  return (
    <main className="min-h-screen bg-white pb-24">
      <div className="max-w-2xl mx-auto px-4 pt-8">
        <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-s-ink mb-2">
          Über uns
        </h1>
        <p className="text-sm text-s-ink-2 mb-10">
          Beauty &amp; Wellness Booking für die ganze Schweiz.
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="font-display text-s-ink text-lg font-semibold mb-3 pb-2 border-b border-s-border">
              Was Solen ist
            </h2>
            <p className="text-sm text-s-ink-2 leading-relaxed">
              Solen verbindet Menschen in der ganzen Schweiz mit Coiffeur-, Barber-,
              Nagel-, Spa- und Massage-Salons. Den passenden Salon finden, in rund 30
              Sekunden einen Termin buchen, ohne Anrufen, mit sofortiger Bestätigung.
            </p>
          </section>

          <section>
            <h2 className="font-display text-s-ink text-lg font-semibold mb-3 pb-2 border-b border-s-border">
              Unser Versprechen
            </h2>
            <ul className="space-y-2 text-sm text-s-ink-2">
              <li>In 30 Sekunden buchen</li>
              <li>Ohne Anrufen</li>
              <li>Sofortige Bestätigung</li>
              <li>Faire, transparente Preise</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-s-ink text-lg font-semibold mb-3 pb-2 border-b border-s-border">
              Sind Sie ein Salon?
            </h2>
            <p className="text-sm text-s-ink-2 leading-relaxed">
              Mit Solen verwalten Sie Termine, Walk-ins und Zahlungen an einem Ort.{" "}
              <Link href={`${p}/partner`} className="text-s-accent">
                Mehr für Salons
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-s-ink text-lg font-semibold mb-3 pb-2 border-b border-s-border">
              Kontakt
            </h2>
            <p className="text-sm text-s-ink-2 leading-relaxed">
              Fragen oder Feedback? Schreib uns an{" "}
              <a href="mailto:hallo@solen.ch" className="text-s-accent">
                hallo@solen.ch
              </a>{" "}
              oder über die{" "}
              <Link href={`${p}/kontakt`} className="text-s-accent">
                Kontaktseite
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
