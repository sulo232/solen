import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Presse — Solen",
  description: "Pressekontakt und Hintergrund zu Solen, der Schweizer Beauty- & Wellness-Buchungsplattform.",
};

export default async function PressePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <main className="min-h-screen bg-white pb-24">
      <div className="max-w-2xl mx-auto px-4 pt-8">
        <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-s-ink mb-2">
          Presse
        </h1>
        <p className="text-sm text-s-ink-2 mb-10">Medienanfragen und Pressekontakt.</p>

        <div className="space-y-8">
          <section>
            <h2 className="font-display text-s-ink text-lg font-semibold mb-3 pb-2 border-b border-s-border">
              Pressekontakt
            </h2>
            <p className="text-sm text-s-ink-2 leading-relaxed">
              Für Medienanfragen erreichen Sie uns unter{" "}
              <a href="mailto:hallo@solen.ch" className="text-s-accent">
                hallo@solen.ch
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-s-ink text-lg font-semibold mb-3 pb-2 border-b border-s-border">
              Über Solen
            </h2>
            <p className="text-sm text-s-ink-2 leading-relaxed">
              Solen ist eine Schweizer Online-Plattform für Beauty- und Wellness-Buchungen.
              Coiffeur, Barber, Nägel, Spa und Massage. Salon finden, in rund 30 Sekunden
              buchen, ohne Anrufen, mit sofortiger Bestätigung.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
