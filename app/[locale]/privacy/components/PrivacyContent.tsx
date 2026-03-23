export default function PrivacyContent() {
  return (
    <div className="prose prose-s-ink dark:prose-invert max-w-none w-full space-y-12">
      <Section id="section-1" titleDe="1. Verantwortliche Stelle" titleEn="1. Data Controller">
        <Article titleDe="1.1 Identität der Verantwortlichen Stelle" titleEn="1.1 Identity of the Data Controller">
          <ParDe>Verantwortlich für die Datenverarbeitung auf dieser Plattform ist solen.ch (Einzelunternehmen) mit Sitz in Basel-Stadt, Schweiz.</ParDe>
          <ParEn>The data controller responsible for the processing of data on this platform is solen.ch (sole proprietorship) based in Basel-Stadt, Switzerland.</ParEn>
          <ParDe><strong>Kontakt / Contact:</strong> support@solen.ch</ParDe>
        </Article>
      </Section>

      <Section id="section-2" titleDe="2. Erhobene Daten" titleEn="2. Data Collected">
        <Article titleDe="2.1 Arten der verarbeiteten Daten" titleEn="2.1 Types of Processed Data">
          <ParDe>Wir erheben und verarbeiten folgende Kategorien personenbezogener Daten:</ParDe>
          <ParEn>We collect and process the following categories of personal data:</ParEn>
          <ul className="list-disc pl-5 space-y-2 text-sm md:text-base text-s-ink dark:text-s-dm-text opacity-90">
            <li><strong>Kontodaten / Account Data:</strong> Name, E-Mail-Adresse, Telefonnummer, Profilbild / Name, email address, phone number, profile picture.</li>
            <li><strong>Buchungsdaten / Booking Data:</strong> Dienstleistungen, Termine, Salonpartner, Kundennotizen, Präferenzen, Allergien / Services, appointments, Salon Partners, client notes, preferences, allergies.</li>
            <li><strong>Zahlungsdaten / Payment Data:</strong> Transaktionsdetails (verarbeitet von Stripe) / Transaction details (processed by Stripe).</li>
            <li><strong>Nutzungsdaten / Usage Data:</strong> Interaktionen mit der Plattform (verarbeitet von PostHog), IP-Adresse, Gerätetyp, Browserty / Interactions with the platform (processed by PostHog), IP address, device type, browser.</li>
            <li><strong>Kommunikation / Communication:</strong> Chatnachrichten und E-Mails zwischen Nutzern und Plattform / Chat messages and emails between users and platform.</li>
          </ul>
        </Article>
      </Section>

      <Section id="section-3" titleDe="3. Verarbeitungszwecke" titleEn="3. Processing Purposes">
        <Article titleDe="3.1 Zwecke der Datenverarbeitung" titleEn="3.1 Purposes of Data Processing">
          <ParDe>Ihre Daten werden zu folgenden Zwecken verarbeitet:</ParDe>
          <ParEn>Your data is processed for the following purposes:</ParEn>
          <ul className="list-disc pl-5 space-y-2 text-sm md:text-base text-s-ink dark:text-s-dm-text opacity-90">
            <li><strong>Buchungsabwicklung / Booking Management:</strong> Vermittlung und Verwaltung von Dienstleistungen zwischen Kunden und Salonpartnern. / Facilitating and managing services between Customers and Salon Partners.</li>
            <li><strong>Zahlungsabwicklung / Payment Processing:</strong> Abwicklung der Bezahlung über unseren Zahlungsdienstleister Stripe. / Processing payments via our payment provider Stripe.</li>
            <li><strong>Kundenservice / Customer Support:</strong> Beantwortung von Benutzeranfragen und Beilegung von Streitigkeiten. / Responding to user inquiries and resolving disputes.</li>
            <li><strong>Sicherheit / Security:</strong> Betrugsprävention und Missbrauchsschutz. / Fraud prevention and protection against abuse.</li>
            <li><strong>Nutzererlebnis und Analytik / Analytics:</strong> Verbesserung der Plattform durch Analyse der Nutzung mit PostHog. / Improving the platform by analyzing usage with PostHog.</li>
            <li><strong>Rechtskonformität / Legal Compliance:</strong> Einhaltung gesetzlicher Verpflichtungen wie Aufbewahrungsfristen für Finanzdaten. / Compliance with legal obligations such as data retention periods for financial records.</li>
          </ul>
        </Article>
      </Section>

      <Section id="section-4" titleDe="4. Datenverarbeiter (Dritte)" titleEn="4. Data Processors (Third Parties)">
        <Article titleDe="4.1 Weitergabe an Dritte" titleEn="4.1 Sharing with Third Parties">
          <ParDe>Wir geben Ihre Daten nur an Dienstleister weiter, soweit dies für den Betrieb der Plattform erforderlich ist. Es werden keine Daten verkauft.</ParDe>
          <ParEn>We only share your data with service providers to the extent necessary to operate the platform. No data is sold.</ParEn>
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full text-sm text-left border border-s-ink/10 dark:border-s-dm-text/10 rounded-xl overflow-hidden block md:table">
              <thead className="bg-s-ink/5 dark:bg-white/5 border-b border-s-ink/10 dark:border-s-dm-text/10">
                <tr>
                  <th className="px-4 py-2 font-semibold">Dienstleister / Provider</th>
                  <th className="px-4 py-2 font-semibold">Zweck / Purpose</th>
                  <th className="px-4 py-2 font-semibold">Region / Region</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-s-ink/10 dark:divide-s-dm-text/10">
                <tr>
                  <td className="px-4 py-2"><strong>Stripe</strong></td>
                  <td className="px-4 py-2">Zahlungsabwicklung / Payment processing</td>
                  <td className="px-4 py-2">Global (Stripe Privacy Shield)</td>
                </tr>
                <tr>
                  <td className="px-4 py-2"><strong>Supabase</strong></td>
                  <td className="px-4 py-2">Datenbank & Authentifizierung / Database & Auth</td>
                  <td className="px-4 py-2">EU (Frankfurt)</td>
                </tr>
                <tr>
                  <td className="px-4 py-2"><strong>Vercel</strong></td>
                  <td className="px-4 py-2">Hosting & Computing</td>
                  <td className="px-4 py-2">Global / EU</td>
                </tr>
                <tr>
                  <td className="px-4 py-2"><strong>PostHog</strong></td>
                  <td className="px-4 py-2">Analytik / Analytics (nur nach Einwilligung / consent-only)</td>
                  <td className="px-4 py-2">EU</td>
                </tr>
                <tr>
                  <td className="px-4 py-2"><strong>Cloudflare</strong></td>
                  <td className="px-4 py-2">DNS, CDN & Web Security</td>
                  <td className="px-4 py-2">Global</td>
                </tr>
                <tr>
                  <td className="px-4 py-2"><strong>Resend</strong></td>
                  <td className="px-4 py-2">E-Mail Versand / Email delivery</td>
                  <td className="px-4 py-2">Regionale Datenspeicherung</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Article>
      </Section>

      <Section id="section-5" titleDe="5. Aufbewahrungsdauer" titleEn="5. Retention Periods">
        <Article titleDe="5.1 Dauer der Datenspeicherung" titleEn="5.1 Duration of Data Storage">
          <ParDe>Wir speichern Ihre Daten nur so lange, wie es für die beschriebenen Zwecke notwendig ist:</ParDe>
          <ParEn>We retain your data only as long as necessary for the described purposes:</ParEn>
          <ul className="list-disc pl-5 space-y-2 text-sm md:text-base text-s-ink dark:text-s-dm-text opacity-90">
            <li><strong>Personenbezogene Profildaten:</strong> Werden innerhalb von 30 Tagen nach einem Kontolöschungsantrag gelöscht. / <strong>Personal Profile Data:</strong> Deleted within 30 days after an account deletion request.</li>
            <li><strong>Finanz-, Rechnungs- und Buchungsdaten:</strong> Werden in anonymisierter Form für 10 Jahre aufbewahrt, um den schweizerischen handelsrechtlichen Vorgaben (OR Art. 958f) zu genügen. / <strong>Financial, Billing, and Booking Data:</strong> Retained in anonymized form for 10 years to comply with Swiss commercial law (CO Art. 958f).</li>
          </ul>
        </Article>
      </Section>

      <Section id="section-6" titleDe="6. Cookies" titleEn="6. Cookies">
        <Article titleDe="6.1 Verwendung von Cookies" titleEn="6.1 Use of Cookies">
          <ParDe>Die Plattform verwendet Cookies und vergleichbare Technologien für grundlegende Funktionen und Performance-Analysen:</ParDe>
          <ParEn>The platform uses cookies and similar technologies for essential functions and performance analytics:</ParEn>
          <ul className="list-disc pl-5 space-y-2 text-sm md:text-base text-s-ink dark:text-s-dm-text opacity-90">
            <li><strong>Notwendige Cookies (Essential Cookies):</strong> Werden verwendet, um das Einloggen, das Speichern Ihrer Regionalsprache und den Zahlungsverkehr in Stripe zu ermöglichen. Ohne diese Cookies kann die Plattform nicht korrekt funktionieren. Sie können nicht deaktiviert werden. / Essential for logging in, storing your locale, and payment processes via Stripe. Cannot be turned off.</li>
            <li><strong>Analyse Cookies (Analytics Cookies / PostHog):</strong> Werden verwendet, um anonymisiert das Verhalten auf der Plattform nachzuvollziehen und das Erlebnis zu verbessern. Diese Cookies sind <strong>einwilligungspflichtig</strong> (Opt-In über Cookie-Banner). / Used to anonymously trace platform behavior and improve user experience. These cookies require <strong>consent</strong> (opt-in via cookie banner).</li>
          </ul>
        </Article>
      </Section>

      <Section id="section-7" titleDe="7. Rechte nach nDSG" titleEn="7. Rights under Swiss DSG">
        <Article titleDe="7.1 Betroffenenrechte" titleEn="7.1 Data Subject Rights">
          <ParDe>Nach dem revidierten Schweizer Datenschutzgesetz (nDSG) sowie ggf. der europäischen DSGVO haben Sie bezüglich Ihrer personenbezogenen Daten die folgenden Rechte:</ParDe>
          <ParEn>Under the revised Swiss Data Protection Act (nDSG) and where applicable the GDPR, you have the following rights regarding your personal data:</ParEn>
          <ul className="list-disc pl-5 space-y-2 text-sm md:text-base text-s-ink dark:text-s-dm-text opacity-90">
            <li><strong>Zugang (Access):</strong> Sie können eine Kopie Ihrer gespeicherten Daten anfordern. / You may request a copy of your stored data.</li>
            <li><strong>Berichtigung (Rectification):</strong> Sie können falsche Daten in Ihrem Profilberichtigen. / You may correct inaccurate data in your profile.</li>
            <li><strong>Löschung (Deletion):</strong> Sie können die Löschung anfordern (vorbehältlich Abschnitt 5). / You may request deletion (subject to Section 5).</li>
            <li><strong>Datenübertragbarkeit (Portability):</strong> Sie können das Formatieren und Übertragen verlangen. / You can request formatting and transfer.</li>
            <li><strong>Widerspruch (Objection):</strong> Sie können Verarbeitungen wie Marketing oder Analytik ablehnen. / You may object to processing such as marketing or analytics.</li>
          </ul>
          <ParDe>Zur Ausübung dieser Rechte können Sie direkt im Dashboard Funktionen zur Kontolöschung und ggf. zum Datenexport nutzen oder uns per E-Mail kontaktieren: <strong>support@solen.ch</strong>.</ParDe>
          <ParEn>To exercise these rights, you can use built-in dashboard tools for account deletion or data export, or contact us by email: <strong>support@solen.ch</strong>.</ParEn>
        </Article>
      </Section>

      <Section id="section-8" titleDe="8. Schlussbestimmungen" titleEn="8. Final Provisions">
        <Article titleDe="8.1 Letzte Aktualisierung und anwendbares Recht" titleEn="8.1 Last Updated and Governing Law">
          <ParDe>Diese Datenschutzerklärung unterliegt <strong>Schweizer Recht</strong>. Solen.ch behält sich das Recht vor, diese Erklärung bei der Einführung neuer Funktionen oder wegen veränderter Rechtslage anzupassen. Vorab registrierte Benutzer werden rechtzeitig informiert.</ParDe>
          <ParEn>This Privacy Policy is governed by <strong>Swiss law</strong>. Solen.ch reserves the right to amend this statement upon introducing new features or due to changes in legislation. Pre-registered users will be informed in due time.</ParEn>
          <ParDe className="mt-4 font-semibold">Letzte Aktualisierung / Last updated: 23. März 2026</ParDe>
        </Article>
      </Section>
    </div>
  );
}

// Helper components for consistent layout

function Section({ id, titleDe, titleEn, children }: { id: string, titleDe: string, titleEn: string, children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-32 pb-8 border-b border-s-ink/10 dark:border-s-dm-text/10 last:border-0 relative">
      <h2 className="font-heading font-bold text-xl md:text-2xl text-s-ink dark:text-s-dm-text mb-1">
        {titleDe}
      </h2>
      <h3 className="font-heading font-medium text-lg text-s-ink/60 dark:text-s-dm-text/60 mb-6 italic">
        {titleEn}
      </h3>
      <div className="space-y-8">
        {children}
      </div>
    </section>
  );
}

function Article({ titleDe, titleEn, children }: { titleDe: string, titleEn: string, children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      {(titleDe || titleEn) && (
        <div className="mb-4">
          <h3 className="font-heading font-semibold text-lg text-s-ink dark:text-s-dm-text">
            {titleDe} 
            {titleEn && <span className="text-s-ink/50 dark:text-s-dm-text/50 font-normal ml-2">/ {titleEn}</span>}
          </h3>
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

function ParDe({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <p className={`text-sm md:text-base text-s-ink dark:text-s-dm-text leading-relaxed ${className}`}>
      {children}
    </p>
  );
}

function ParEn({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 pl-4 border-l-2 border-s-ink/10 dark:border-s-dm-text/10 mt-2 mb-4">
      <p className="text-xs md:text-sm text-s-ink/70 dark:text-s-dm-text/70 italic leading-relaxed">
        {children}
      </p>
    </div>
  );
}
