import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Karriere — Solen",
  description: "Arbeite mit Solen an der Zukunft des Beauty- & Wellness-Bookings in der Schweiz.",
};

export default async function KarrierePage({ params }: { params: Promise<{ locale: string }> }) {
  await params;

  return (
    <main className="min-h-screen bg-white pb-24">
      <div className="max-w-2xl mx-auto px-4 pt-8">
        <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-s-ink mb-2">
          Karriere
        </h1>
        <p className="text-sm text-s-ink-2 mb-10">
          Mit uns die Beauty-Branche der Schweiz einfacher machen.
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="font-display text-s-ink text-lg font-semibold mb-3 pb-2 border-b border-s-border">
              Offene Stellen
            </h2>
            <p className="text-sm text-s-ink-2 leading-relaxed">
              Aktuell haben wir keine Stellen ausgeschrieben.
            </p>
          </section>

          <section>
            <h2 className="font-display text-s-ink text-lg font-semibold mb-3 pb-2 border-b border-s-border">
              Initiativbewerbung
            </h2>
            <p className="text-sm text-s-ink-2 leading-relaxed">
              Du willst trotzdem mit uns arbeiten? Schreib uns, woran du arbeiten möchtest,
              an{" "}
              <a href="mailto:hallo@solen.ch" className="text-s-accent">
                hallo@solen.ch
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
