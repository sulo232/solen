import Link from "next/link";

export default function AGBPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-dm-bg pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h1 className="font-heading font-bold text-3xl text-dark dark:text-dm-text mb-8">
          Allgemeine Geschäftsbedingungen (AGB)
        </h1>

        <div className="prose prose-sm max-w-none text-dark/70 dark:text-dm-text/70 space-y-6">
          <section>
            <h2 className="font-heading font-semibold text-lg text-dark dark:text-dm-text">1. Geltungsbereich</h2>
            <p>[PLATZHALTER — Bitte echten Text einsetzen]</p>
            <p>Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung der Plattform solen.ch.</p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-lg text-dark dark:text-dm-text">2. Vertragsschluss</h2>
            <p>[PLATZHALTER — Bitte echten Text einsetzen]</p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-lg text-dark dark:text-dm-text">3. Buchungen & Stornierung</h2>
            <p>[PLATZHALTER — Bitte echten Text einsetzen]</p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-lg text-dark dark:text-dm-text">4. Preise & Zahlungsbedingungen</h2>
            <p>[PLATZHALTER — Bitte echten Text einsetzen]</p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-lg text-dark dark:text-dm-text">5. Haftung</h2>
            <p>[PLATZHALTER — Bitte echten Text einsetzen]</p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-lg text-dark dark:text-dm-text">6. Datenschutz</h2>
            <p>
              Informationen zur Verarbeitung personenbezogener Daten finden Sie in unserer{" "}
              <Link href="/de/datenschutz" className="text-s-coral hover:underline">
                Datenschutzerklärung
              </Link>.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-lg text-dark dark:text-dm-text">7. Schlussbestimmungen</h2>
            <p>[PLATZHALTER — Bitte echten Text einsetzen]</p>
            <p>Gerichtsstand: Basel-Stadt, Schweiz</p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-100">
          <Link href="/de" className="text-sm text-s-coral hover:underline">
            ← Zurück zur Startseite
          </Link>
        </div>
      </div>
    </div>
  );
}
