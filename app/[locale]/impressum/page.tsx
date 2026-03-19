import Link from "next/link";

export default async function ImpressumPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <div className="min-h-screen bg-white dark:bg-s-dm-bg pt-8 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h1 className="font-heading font-bold text-3xl text-dark dark:text-s-dm-text mb-8">Impressum</h1>

        <div className="prose prose-sm max-w-none text-dark/70 dark:text-s-dm-text/70 space-y-6">
          <section>
            <h2 className="font-heading font-semibold text-lg text-dark dark:text-s-dm-text">Angaben gemäss Art. 3 UWG</h2>
            <p>[PLATZHALTER — Bitte echten Text einsetzen]</p>
            <p>
              Solen.ch<br />
              [Strasse und Hausnummer]<br />
              [PLZ] Basel<br />
              Schweiz
            </p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-lg text-dark dark:text-s-dm-text">Kontakt</h2>
            <p>
              E-Mail: [PLATZHALTER]@solen.ch<br />
              Telefon: [PLATZHALTER]
            </p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-lg text-dark dark:text-s-dm-text">Vertretungsberechtigte Person</h2>
            <p>[PLATZHALTER — Name der vertretungsberechtigten Person]</p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-lg text-dark dark:text-s-dm-text">Handelsregistereintrag</h2>
            <p>[PLATZHALTER — Handelsregisternummer, Rechtsform]</p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-lg text-dark dark:text-s-dm-text">Mehrwertsteuernummer</h2>
            <p>[PLATZHALTER — CHE-XXX.XXX.XXX MWST]</p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-lg text-dark dark:text-s-dm-text">Haftungsausschluss</h2>
            <p>[PLATZHALTER — Bitte echten Haftungsausschluss-Text einsetzen]</p>
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
