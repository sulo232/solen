// locale-copy-mockup: de, this file is the formal Sie/Ihr register rewrite of the welcome
// email's German body, shown next to the real informal du/dein original for review.
//
// exists-check: net-new vs lib/email.ts because welcomeEmail() there only ships the informal
// du/dein German body; this file is the mockup's PROPOSED formal-register rewrite of that
// same body, used solely by this route's page.tsx for a Current/Proposed comparison. It is
// not a real send path and nothing else in the app imports it.
//
// VARY applied here, nothing else: the German ("de") html bodies for step 1 and step 2 are
// rewritten from the informal du/dein/dich register to the formal Sie/Ihr register, and the
// one em dash in the source is replaced with a comma. Content, links, and the subject lines
// are untouched (subject is FIXED per the brief, even though step 2's subject itself reads
// informal, see the concerns note returned with this build).
//
// escapeHtml below is a byte-copy of the private (unexported) helper in lib/email.ts, needed
// here because that function is not exported from the real module.
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export interface ProposedEmailPayload {
  subject: string;
  html: string;
}

/**
 * Same shape as lib/email.ts's welcomeEmail(), German locale only, formal register.
 *
 * Step 1 original: "Willkommen bei solen.ch, deiner Plattform fuer Beauty and Wellness in
 * Basel." (with an em dash where the comma now sits) plus "Entdecke Salons in deiner Naehe"
 * (em dash, "deiner" x2, imperative "Entdecke").
 * Step 2 original: "Vervollstaendige dein Profil, um personalisierte Empfehlungen zu
 * erhalten und schneller zu buchen." (imperative "Vervollstaendige", "dein").
 */
export function welcomeEmailProposedDe(vars: { name: string }, step: 1 | 2): ProposedEmailPayload {
  const steps: ProposedEmailPayload[] = [
    {
      subject: `Willkommen bei solen.ch, ${vars.name}!`,
      html: `<p>Hallo <strong>${escapeHtml(vars.name)}</strong>,</p><p>Willkommen bei solen.ch, Ihrer Plattform für Beauty & Wellness in Basel.</p><p><a href="https://solen.ch/de/search">Entdecken Sie Salons in Ihrer Nähe →</a></p>`,
    },
    {
      subject: `Dein Profil vervollständigen`,
      html: `<p>Vervollständigen Sie Ihr Profil, um personalisierte Empfehlungen zu erhalten und schneller zu buchen.</p><p><a href="https://solen.ch/de/account">Profil bearbeiten →</a></p>`,
    },
  ];
  return steps[step - 1];
}
