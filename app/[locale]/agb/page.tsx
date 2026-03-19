import Link from "next/link";

export default async function AGBPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <div className="min-h-screen bg-white dark:bg-s-dm-bg pt-8 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h1 className="font-heading font-bold text-3xl text-s-ink dark:text-s-dm-text mb-8">
          Allgemeine Geschäftsbedingungen (AGB)
        </h1>

        <div className="prose prose-sm max-w-none text-s-ink/70 dark:text-s-dm-text/70 space-y-6">
          <section>
            <h2 className="font-heading font-semibold text-lg text-s-ink dark:text-s-dm-text">1. Geltungsbereich</h2>
            <p>[PLATZHALTER — Bitte echten Text einsetzen]</p>
            <p>Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung der Plattform solen.ch.</p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-lg text-s-ink dark:text-s-dm-text">2. Vertragsschluss</h2>
            <p>[PLATZHALTER — Bitte echten Text einsetzen]</p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-lg text-s-ink dark:text-s-dm-text">3. Buchungen & Stornierung</h2>
            <p>[PLATZHALTER — Bitte echten Text einsetzen]</p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-lg text-s-ink dark:text-s-dm-text">4. Preise & Zahlungsbedingungen</h2>
            <p>[PLATZHALTER — Bitte echten Text einsetzen]</p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-lg text-s-ink dark:text-s-dm-text">5. Haftung</h2>
            <p>[PLATZHALTER — Bitte echten Text einsetzen]</p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-lg text-s-ink dark:text-s-dm-text">6. Datenschutz</h2>
            <p>
              Informationen zur Verarbeitung personenbezogener Daten finden Sie in unserer{" "}
              <Link href={`/${locale}/datenschutz`} className="text-s-coral hover:underline">
                Datenschutzerklärung
              </Link>.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-lg text-s-ink dark:text-s-dm-text">7. Schlussbestimmungen</h2>
            <p>[PLATZHALTER — Bitte echten Text einsetzen]</p>
            <p>Gerichtsstand: Basel-Stadt, Schweiz</p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-s-ink/5">
          <Link href={`/${locale}`} className="text-sm text-s-coral hover:underline">
            ← Zurück zur Startseite
          </Link>
        </div>
      </div>
    </div>
  );
}
