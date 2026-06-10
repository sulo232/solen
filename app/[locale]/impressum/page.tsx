import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Impressum — Solen",
};

export default function ImpressumPage() {
  return (
    <main className="min-h-screen bg-white pb-24">
      <div className="max-w-2xl mx-auto px-4 pt-8">
        {/* V3-D296: tracking-wider (too loose for LOCKFILE -0.03em); ALL-CAPS dropped; weight 700 per LOCKFILE §2 Page H2 role */}
        <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-s-ink mb-2">
          Impressum
        </h1>
        <p className="text-sm text-s-ink-2 mb-10">
          Angaben gemäss Art. 3 UWG (Bundesgesetz gegen unlauteren Wettbewerb)
        </p>

        {/* V3-D296: arbitrary opacity (s-ink/50, s-ink/40, s-ink/70) collapsed to canonical s-ink-2 muted ink; hover:text-s-accent → hover:text-s-accent */}
        <div className="space-y-8">

          <section>
            <h2 className="font-display text-s-ink text-lg font-semibold mb-3 pb-2 border-b border-s-border">
              Betreiberin der Website
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-4">
                <dt className="w-40 shrink-0 text-s-ink-2">Name</dt>
                <dd className="text-s-ink">solen.ch (Einzelunternehmen)</dd>
              </div>
              <div className="flex gap-4">
                <dt className="w-40 shrink-0 text-s-ink-2">Adresse</dt>
                <dd className="text-s-ink">Basel-Stadt, 4000 Basel, Schweiz</dd>
              </div>
              <div className="flex gap-4">
                <dt className="w-40 shrink-0 text-s-ink-2">E-Mail</dt>
                <dd className="text-s-ink">
                  <a href="mailto:info@solen.ch" className="hover:text-s-accent transition-colors">
                    info@solen.ch
                  </a>
                </dd>
              </div>
            </dl>
          </section>

          <section>
            <h2 className="font-display text-s-ink text-lg font-semibold mb-3 pb-2 border-b border-s-border">
              Handelsregister & Steuer
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-4">
                <dt className="w-40 shrink-0 text-s-ink-2">Rechtsform</dt>
                <dd className="text-s-ink">Einzelunternehmen</dd>
              </div>
              <div className="flex gap-4">
                <dt className="w-40 shrink-0 text-s-ink-2">CHE-Nummer</dt>
                  <dd className="text-s-ink-2 italic">Anmeldung in Bearbeitung</dd>
              </div>
              <div className="flex gap-4">
                <dt className="w-40 shrink-0 text-s-ink-2">MWST</dt>
                <dd className="text-s-ink-2 italic">Nicht MWST-pflichtig (Umsatz unter CHF 100&apos;000)</dd>
              </div>
            </dl>
          </section>

          <section>
            <h2 className="font-display text-s-ink text-lg font-semibold mb-3 pb-2 border-b border-s-border">
              Haftungsausschluss
            </h2>
            <div className="space-y-3 text-sm text-s-ink-2 leading-relaxed">
              <p>
                Die Inhalte dieser Website wurden mit grösster Sorgfalt erstellt. Für die Richtigkeit,
                Vollständigkeit und Aktualität der Inhalte kann jedoch keine Gewähr übernommen werden.
              </p>
              <p>
                Als Dienstanbieter sind wir gemäss Art. 8 DSG für eigene Inhalte auf diesen Seiten nach den
                allgemeinen Gesetzen verantwortlich. Wir sind jedoch nicht verpflichtet, übermittelte oder
                gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine
                rechtswidrige Tätigkeit hinweisen.
              </p>
              <p>
                Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss
                haben. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber
                verantwortlich.
              </p>
            </div>
          </section>

        </div>

        <p className="mt-12 text-xs text-s-ink-2">
          Stand: März 2026
        </p>
      </div>
    </main>
  );
}
