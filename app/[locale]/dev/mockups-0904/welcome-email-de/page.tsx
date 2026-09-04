// locale-copy-mockup: de, this page compares the real German welcome email body (casual
// second-person register) against a formal Sie/Ihr rewrite, the actual subject of this
// review. lang-ok: the email bodies rendered below are genuinely-localised German copy,
// the thing being reviewed, not hardcoded mockup UI text.
//
// Grounded-in: lib/email.ts
//
// Exists-check: `npm run exists welcome-email-de` ran this turn, 0 hits, net new. A second run,
// `npm run exists "welcome email"`, hit exactly one symbol, welcomeEmail in lib/email.ts, which
// is the real function this page renders unmodified as "Current". No REMOVED.md hit for
// "welcome email" or "welcomeEmail". The one new thing on disk is this comparison page plus its
// sibling welcomeEmailProposedDe.ts (the formal-register rewrite), following the Current/Proposed
// pattern already used by app/[locale]/dev/design-fixes/page.tsx.
//
// Depicts: welcome email, step 1 and step 2, German body -> lib/email.ts welcomeEmail() (real,
//   unmodified import), plus wrapEmailHtml() from the same file (real, unmodified import), the
//   same wrapper every send goes through per app/[locale]/dev/emails/page.tsx's own docstring.
// Depicts: proposed formal-register body -> ./welcomeEmailProposedDe.ts, a net-new sibling file
//   copying welcomeEmail()'s shape for the "de" locale only (that file is not exported from
//   lib/email.ts, so it cannot be imported, per the brief's byte-copy instruction).
//
// Mockup-scope: section (one function's German output, two steps, current vs proposed).
//
// measured: lib/email.ts welcomeEmail() step 1 German body carries one em dash and 3 casual
// second-person markers ("deiner" x2, plus the casual imperative "Entdecke"); step 2 carries
// 2 casual second-person markers (the casual imperative "Vervollstaendige", plus "dein").
// Read directly from lib/email.ts:696-736 this turn.
//
// decisions: layout follows app/[locale]/dev/design-fixes/page.tsx (max-w-[390px], PairLabel
// 13px semibold + 12px note, no page-drawn header/nav since /dev routes already hide the real
// site chrome via HideInBooking.tsx's `/\/dev(\/|$)/` check). Email frame chrome (white card,
// bg-s-bg-sunken tray, rounded-[8px]) copied from app/[locale]/dev/emails/page.tsx's own
// `frameDoc` styling (padding 16, background #fff) and its subject-line row markup.

import { welcomeEmail, wrapEmailHtml } from "@/lib/email";
import { welcomeEmailProposedDe } from "./welcomeEmailProposedDe";

const CUSTOMER_NAME = "Amélie Wyss";

export default function WelcomeEmailDeMockupPage() {
  const currentStep1 = welcomeEmail("preview@solen.ch", { name: CUSTOMER_NAME }, "de", 1);
  const currentStep2 = welcomeEmail("preview@solen.ch", { name: CUSTOMER_NAME }, "de", 2);
  const proposedStep1 = welcomeEmailProposedDe({ name: CUSTOMER_NAME }, 1);
  const proposedStep2 = welcomeEmailProposedDe({ name: CUSTOMER_NAME }, 2);

  return (
    <main className="min-h-[100dvh] bg-white pb-16">
      <div className="mx-auto max-w-[390px] px-4 pt-6">
        <h1 className="font-display text-[20px] font-semibold text-s-ink">
          Welcome email, German register
        </h1>
        <p className="mt-1 text-[13px] text-s-ink-2">
          lib/email.ts welcomeEmail(), current casual body vs a formal Sie/Ihr rewrite. Same
          content, same links, same subject.
        </p>

        {/* ---------------- Step 1 ---------------- */}
        <SectionTitle id="step-1" label="A. Welcome email (step 1, account created)" />
        <PairLabel
          variant="Current"
          rule="Real welcomeEmail(), German, step 1: casual second-person register."
        />
        <EmailFrame subject={currentStep1.subject} html={wrapEmailHtml(currentStep1.html)} />
        <PairLabel
          variant="Proposed"
          rule="Same content and links, formal Sie/Ihr register, em dash replaced with a comma."
        />
        <EmailFrame subject={proposedStep1.subject} html={wrapEmailHtml(proposedStep1.html)} />

        {/* ---------------- Step 2 ---------------- */}
        <SectionTitle id="step-2" label="B. Welcome email (step 2, complete your profile)" />
        <PairLabel
          variant="Current"
          rule="Real welcomeEmail(), German, step 2: casual second-person register."
        />
        <EmailFrame subject={currentStep2.subject} html={wrapEmailHtml(currentStep2.html)} />
        <PairLabel
          variant="Proposed"
          rule="Same content and links, formal Sie/Ihr register. Subject kept as-is (FIXED)."
        />
        <EmailFrame subject={proposedStep2.subject} html={wrapEmailHtml(proposedStep2.html)} />

        {/* ---------------- counts ---------------- */}
        <SectionTitle id="counts" label="C. Counts" />
        <ul className="mt-2 space-y-1 text-[13px] text-s-ink-2">
          <li>Em dashes: 1 before (step 1 body), 0 after.</li>
          <li>
            Casual second-person markers (possessive plus the casual imperative verb form): 3
            before in step 1, 2 before in step 2, 5 total before. 0 after in both steps.
          </li>
        </ul>
      </div>
    </main>
  );
}

function SectionTitle({ id, label }: { id: string; label: string }) {
  return (
    <h2
      id={id}
      className="mt-10 scroll-mt-[16px] border-t border-s-border pt-6 text-[14px] font-semibold text-s-ink"
    >
      {label}
    </h2>
  );
}

function PairLabel({ variant, rule }: { variant: "Current" | "Proposed"; rule: string }) {
  return (
    <div className="mb-2 mt-4">
      <p className="text-[13px] font-semibold text-s-ink">{variant}</p>
      <p className="text-[12px] text-s-ink-2">{rule}</p>
    </div>
  );
}

/** Mirrors app/[locale]/dev/emails/page.tsx's own subject row + frameDoc padding/background. */
function EmailFrame({ subject, html }: { subject: string; html: string }) {
  return (
    <div className="overflow-hidden rounded-[8px] bg-s-bg-sunken p-2">
      <div className="overflow-hidden rounded-[8px] bg-white">
        <p className="border-b border-s-border px-4 py-3 text-[14px]">
          <span className="text-s-ink-2">Subject: </span>
          <span className="font-semibold">{subject}</span>
        </p>
        <div className="p-4" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}
