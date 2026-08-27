// =============================================================================
// lib/email-outreach.ts , cold-outreach salon email(s)
//
// Split out of lib/email.ts so this file can be the only place that imports
// unsubscribeToken (lib/unsubscribe-token.ts, which statically imports node's
// "crypto"). lib/email.ts itself is transitively pulled into 75+ edge routes via
// lib/ratelimit.ts -> lib/alert-admin.ts -> sendEmail(), and the edge bundler
// cannot resolve node's crypto module, so a crypto-importing dependency anywhere
// in lib/email.ts's own import graph breaks every one of those routes' builds.
// This file is never imported from an edge route (only from
// lib/email-preview-samples.ts, a dev-only /dev/emails preview tool, today), so
// it is safe for it to import unsubscribeToken directly.
//
// The em-dashes below are pre-existing production email copy carried over
// byte-for-byte from lib/email.ts (not authored here); left untouched since
// rewording shipped copy is out of scope for this relocation.
// =============================================================================

import type { EmailPayload } from "@/lib/email";
import { escapeHtml } from "@/lib/email";
import { EMAIL_COLORS } from "@/lib/email-colors";
import { unsubscribeToken } from "@/lib/unsubscribe-token";

export function salonOutreachInvitation(
  to: string,
  vars: { salonName: string; claimUrl: string }
): EmailPayload {
  return {
    to,
    subject: `${vars.salonName} ist jetzt auf solen.ch gelistet — kostenlos Buchungen aktivieren`,
    html: `
      <p>Guten Tag,</p>
      <p>Ihr Salon <strong>${escapeHtml(vars.salonName)}</strong> ist ab sofort auf <a href="https://solen.ch">solen.ch</a> gelistet — dem führenden Beauty-Buchungsportal der Region Basel.</p>
      <p>Kunden können Ihren Salon bereits finden und Ihre Kontaktdaten einsehen. Wenn Sie Online-Buchungen aktivieren möchten, können Sie Ihren Salon kostenlos beanspruchen:</p>
      <p><a href="${vars.claimUrl}" style="display:inline-block;padding:12px 24px;background:${EMAIL_COLORS.ink};color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Salon jetzt beanspruchen →</a></p>
      <p>Vorteile:</p>
      <ul>
        <li>Online-Buchungen 24/7 entgegennehmen</li>
        <li>Direktnachrichten von Kunden erhalten</li>
        <li>Kostenlos — keine Grundgebühr</li>
      </ul>
      <p>Bei Fragen: <a href="mailto:support@solen.ch">support@solen.ch</a></p>
      <p style="font-size:11px;color:${EMAIL_COLORS.ink2};margin-top:32px">
        solen.ch · Booking platform Basel ·
        <a href="https://solen.ch/unsubscribe?email=${encodeURIComponent(to)}&t=${unsubscribeToken(to)}" style="color:${EMAIL_COLORS.ink2}">Abmelden</a>
        · Diese E-Mail wurde an ${to} gesendet, da Ihr Salon öffentlich gelistet ist (nDSG Art. 31).
      </p>
    `,
  };
}
