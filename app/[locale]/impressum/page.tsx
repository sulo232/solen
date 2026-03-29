import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Impressum — Solen",
};

export default function ImpressumPage() {
  return (
    <main className="min-h-screen bg-[--base] pb-24">
      <div className="max-w-2xl mx-auto px-4 pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-s-ink/50 hover:text-s-coral text-sm font-heading font-semibold transition-colors mb-8"
        >
          <ChevronLeft className="w-4 h-4" />
          Zurück
        </Link>

        <h1 className="font-display text-5xl tracking-wider text-s-ink dark:text-s-dm-text mb-2">
          IMPRESSUM
        </h1>
        <p className="text-sm text-s-ink/50 mb-10">
          Angaben gemäss Art. 3 UWG (Bundesgesetz gegen unlauteren Wettbewerb)
        </p>

        <div className="space-y-8">

          <section>
            <h2 className="font-heading font-bold text-s-ink dark:text-s-dm-text text-base mb-3 pb-2 border-b border-s-ink/10">
              Betreiberin der Website
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-4">
                <dt className="w-40 shrink-0 text-s-ink/50">Name</dt>
                {/* TODO: Replace with your full legal name */}
                <dd className="text-s-ink dark:text-s-dm-text">[Vollständiger Name]</dd>
              </div>
              <div className="flex gap-4">
                <dt className="w-40 shrink-0 text-s-ink/50">Adresse</dt>
                {/* TODO: Replace with your street address */}
                <dd className="text-s-ink dark:text-s-dm-text">[Strasse Nr.], [PLZ] Basel, Schweiz</dd>
              </div>
              <div className="flex gap-4">
                <dt className="w-40 shrink-0 text-s-ink/50">E-Mail</dt>
                <dd className="text-s-ink dark:text-s-dm-text">
                  <a href="mailto:info@solen.ch" className="hover:text-s-coral transition-colors">
                    info@solen.ch
                  </a>
                </dd>
              </div>
            </dl>
          </section>

          <section>
            <h2 className="font-heading font-bold text-s-ink dark:text-s-dm-text text-base mb-3 pb-2 border-b border-s-ink/10">
              Handelsregister & Steuer
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-4">
                <dt className="w-40 shrink-0 text-s-ink/50">Rechtsform</dt>
                <dd className="text-s-ink dark:text-s-dm-text">Einzelunternehmen</dd>
              </div>
              <div className="flex gap-4">
                <dt className="w-40 shrink-0 text-s-ink/50">CHE-Nummer</dt>
                {/* TODO: Replace with your CHE number once registered, or remove this row if not yet applicable */}
                <dd className="text-s-ink/40 dark:text-s-dm-text/40 italic">[ausstehend]</dd>
              </div>
              <div className="flex gap-4">
                <dt className="w-40 shrink-0 text-s-ink/50">MWST</dt>
                <dd className="text-s-ink/40 dark:text-s-dm-text/40 italic">Nicht MWST-pflichtig (Umsatz unter CHF 100&apos;000)</dd>
              </div>
            </dl>
          </section>

          <section>
            <h2 className="font-heading font-bold text-s-ink dark:text-s-dm-text text-base mb-3 pb-2 border-b border-s-ink/10">
              Haftungsausschluss
            </h2>
            <div className="space-y-3 text-sm text-s-ink/70 dark:text-s-dm-text/70 leading-relaxed">
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

        <p className="mt-12 text-xs text-s-ink/30 dark:text-s-dm-text/30">
          Stand: März 2026
        </p>
      </div>
    </main>
  );
}
