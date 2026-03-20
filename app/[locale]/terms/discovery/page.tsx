import { getLocale } from "next-intl/server";

const CONTENT: Record<string, { title: string; sections: { heading: string; text: string }[] }> = {
  de: {
    title: "Nutzungsbedingungen — Discovery",
    sections: [
      { heading: "1. Urheberrecht", text: "Sie müssen das Recht haben, die von Ihnen hochgeladenen Inhalte zu veröffentlichen. Das Hochladen urheberrechtlich geschützter Inhalte ohne Genehmigung ist verboten." },
      { heading: "2. Lizenzgewährung", text: "Durch das Hochladen von Inhalten auf solen.ch gewähren Sie solen.ch eine nicht-exklusive, weltweite, gebührenfreie Lizenz zur Anzeige, Verbreitung und Bewerbung Ihrer Inhalte auf der Plattform." },
      { heading: "3. Inhaltsregeln", text: "Verbotene Inhalte: Nacktheit, Hassrede, Gewalt, Spam, irreführende Informationen, Inhalte die Minderjährige darstellen. Verstöße führen zur sofortigen Entfernung und möglicherweise zur Sperrung des Kontos." },
      { heading: "4. Inhaltsentfernung", text: "solen.ch behält sich das Recht vor, Inhalte ohne Vorankündigung zu entfernen, die gegen diese Bedingungen verstoßen oder anderweitig unangemessen sind." },
      { heading: "5. DSGVO-Konformität", text: "Hochgeladene Inhalte werden auf Servern in der EU/Schweiz gespeichert. Sie können die Löschung Ihrer Inhalte jederzeit über Ihre Profileinstellungen oder per E-Mail an privacy@solen.ch beantragen." },
      { heading: "6. Haftungsausschluss", text: "solen.ch übernimmt keine Garantie für die Genauigkeit von KI-generierten Beschreibungen. Die angezeigten Preise sind Schätzungen und können je nach Salon variieren." },
    ],
  },
  en: {
    title: "Terms of Service — Discovery",
    sections: [
      { heading: "1. Copyright", text: "You must have the right to publish the content you upload. Uploading copyrighted content without permission is prohibited." },
      { heading: "2. License Grant", text: "By uploading content to solen.ch, you grant solen.ch a non-exclusive, worldwide, royalty-free license to display, distribute, and promote your content on the platform." },
      { heading: "3. Content Rules", text: "Prohibited content: nudity, hate speech, violence, spam, misleading information, content depicting minors. Violations result in immediate removal and possible account suspension." },
      { heading: "4. Content Removal", text: "solen.ch reserves the right to remove content without notice that violates these terms or is otherwise inappropriate." },
      { heading: "5. GDPR Compliance", text: "Uploaded content is stored on EU/Swiss servers. You may request deletion of your content at any time via your profile settings or by emailing privacy@solen.ch." },
      { heading: "6. Disclaimer", text: "solen.ch makes no guarantees about the accuracy of AI-generated descriptions. Displayed prices are estimates and may vary by salon." },
    ],
  },
  fr: {
    title: "Conditions d'utilisation — Discovery",
    sections: [
      { heading: "1. Droit d'auteur", text: "Vous devez avoir le droit de publier le contenu que vous téléchargez. Le téléchargement de contenu protégé par le droit d'auteur sans autorisation est interdit." },
      { heading: "2. Licence accordée", text: "En téléchargeant du contenu sur solen.ch, vous accordez à solen.ch une licence non exclusive, mondiale et gratuite pour afficher, distribuer et promouvoir votre contenu sur la plateforme." },
      { heading: "3. Règles de contenu", text: "Contenu interdit: nudité, discours haineux, violence, spam, informations trompeuses, contenu représentant des mineurs. Les violations entraînent la suppression immédiate et la suspension éventuelle du compte." },
      { heading: "4. Suppression de contenu", text: "solen.ch se réserve le droit de supprimer sans préavis tout contenu violant ces conditions ou jugé inapproprié." },
      { heading: "5. Conformité RGPD", text: "Le contenu téléchargé est stocké sur des serveurs UE/Suisse. Vous pouvez demander la suppression de votre contenu à tout moment via vos paramètres de profil ou par e-mail à privacy@solen.ch." },
      { heading: "6. Avertissement", text: "solen.ch ne garantit pas l'exactitude des descriptions générées par l'IA. Les prix affichés sont des estimations et peuvent varier selon le salon." },
    ],
  },
  it: {
    title: "Termini di servizio — Discovery",
    sections: [
      { heading: "1. Diritto d'autore", text: "Devi avere il diritto di pubblicare i contenuti che carichi. Il caricamento di contenuti protetti da copyright senza autorizzazione è vietato." },
      { heading: "2. Concessione di licenza", text: "Caricando contenuti su solen.ch, concedi a solen.ch una licenza non esclusiva, mondiale e gratuita per visualizzare, distribuire e promuovere i tuoi contenuti sulla piattaforma." },
      { heading: "3. Regole sui contenuti", text: "Contenuti vietati: nudità, discorsi d'odio, violenza, spam, informazioni fuorvianti, contenuti che raffigurano minori. Le violazioni comportano la rimozione immediata e la possibile sospensione dell'account." },
      { heading: "4. Rimozione dei contenuti", text: "solen.ch si riserva il diritto di rimuovere senza preavviso i contenuti che violano questi termini o sono altrimenti inappropriati." },
      { heading: "5. Conformità GDPR", text: "I contenuti caricati sono archiviati su server UE/Svizzera. Puoi richiedere la cancellazione dei tuoi contenuti in qualsiasi momento tramite le impostazioni del profilo o inviando un'e-mail a privacy@solen.ch." },
      { heading: "6. Disclaimer", text: "solen.ch non garantisce l'accuratezza delle descrizioni generate dall'IA. I prezzi visualizzati sono stime e possono variare in base al salone." },
    ],
  },
};

export default async function DiscoveryTermsPage() {
  const locale = await getLocale();
  const content = CONTENT[locale] ?? CONTENT.de;

  return (
    <main className="min-h-screen bg-s-bg-base dark:bg-s-dm-bg px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-heading font-bold text-s-ink dark:text-s-dm-text mb-8">{content.title}</h1>
        <div className="space-y-6">
          {content.sections.map((section) => (
            <div key={section.heading}>
              <h2 className="text-base font-heading font-semibold text-s-ink dark:text-s-dm-text mb-2">{section.heading}</h2>
              <p className="text-sm text-s-ink/70 dark:text-s-dm-text/70 leading-relaxed">{section.text}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-s-ink/30 dark:text-s-dm-text/30 mt-12">
          © {new Date().getFullYear()} solen.ch — Basel, Switzerland
        </p>
      </div>
    </main>
  );
}
