import Link from "next/link";

export default async function DatenschutzPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <div className="min-h-screen bg-white dark:bg-s-dm-bg pt-8 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h1 className="font-heading font-bold text-3xl text-s-ink dark:text-s-dm-text mb-8">
          Datenschutzerklärung
        </h1>

        <div className="prose prose-sm max-w-none text-s-ink/70 dark:text-s-dm-text/70 space-y-6">
          <section>
            <h2 className="font-heading font-semibold text-lg text-s-ink dark:text-s-dm-text">1. Verantwortliche Stelle</h2>
            <p>[PLATZHALTER — Bitte echten Text einsetzen]</p>
            <p>Solen.ch, [Adresse], Basel, Schweiz</p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-lg text-s-ink dark:text-s-dm-text">2. Erhobene Daten</h2>
            <p>[PLATZHALTER — Bitte echten Text einsetzen]</p>
            <p>Wir erheben folgende personenbezogene Daten:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Name, E-Mail-Adresse (bei Registrierung)</li>
              <li>Buchungsdaten (Termine, Services)</li>
              <li>Zahlungsinformationen (über Stripe verarbeitet)</li>
              <li>Nutzungsdaten (Cookies, Analytics)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-lg text-s-ink dark:text-s-dm-text">3. Zweck der Datenverarbeitung</h2>
            <p>[PLATZHALTER — Bitte echten Text einsetzen]</p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-lg text-s-ink dark:text-s-dm-text">4. Cookies</h2>
            <p>[PLATZHALTER — Bitte echten Text einsetzen]</p>
            <p>Wir verwenden funktionale Cookies und optional Analytics-Cookies (PostHog). Sie können Ihre Präferenzen im Cookie-Banner einstellen.</p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-lg text-s-ink dark:text-s-dm-text">5. Drittanbieter</h2>
            <p>Wir arbeiten mit folgenden Drittanbietern:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Supabase</strong> — Datenbank & Authentifizierung (EU-Server)</li>
              <li><strong>Stripe</strong> — Zahlungsabwicklung (PCI-DSS-zertifiziert)</li>
              <li><strong>Vercel</strong> — Hosting (Edge Network)</li>
              <li><strong>PostHog</strong> — Analytics (optional, nur mit Einwilligung)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-lg text-s-ink dark:text-s-dm-text">6. Ihre Rechte</h2>
            <p>[PLATZHALTER — Bitte echten Text einsetzen]</p>
            <p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Datenübertragbarkeit gemäss dem Schweizer Datenschutzgesetz (DSG).</p>
          </section>

          <section>
            <h2 className="font-heading font-semibold text-lg text-s-ink dark:text-s-dm-text">7. Kontakt</h2>
            <p>Bei Fragen zum Datenschutz kontaktieren Sie uns unter: [PLATZHALTER]@solen.ch</p>
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
