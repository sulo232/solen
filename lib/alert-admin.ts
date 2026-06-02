// lib/alert-admin.ts
//
// Lightweight money-path failure alerting. No external monitoring infra (Sentry
// etc.) — reuses the existing transactional-email pipe (lib/email `sendEmail` →
// Resend) to push a one-shot alert to getServerEnv().ADMIN_EMAIL.
//
// USE FOR: the genuinely-CRITICAL money-failure catch points only — an UNEXPECTED
// exception on a charge / refund / audit-trail write, NOT a normal Stripe decline
// or `requires_action` (those are expected business outcomes the callers already
// model as typed results). Over-alerting trains the inbox to ignore the alert.
//
// CONTRACT: best-effort. NEVER throws — a failing alert must not turn a recoverable
// money error into a crash, nor mask the original error. On its own failure (or an
// unset ADMIN_EMAIL) it console.errors and returns.

import { getServerEnv } from "@/lib/env";
import { sendEmail } from "@/lib/email";

/** Escape the few chars that would break out of an HTML text/attribute context. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Email a money-path failure alert to ADMIN_EMAIL. Best-effort, never throws.
 *
 * @param subject short human label, e.g. "off-session charge threw". Rendered into
 *   the email subject as "[Solen money-alert] {subject}".
 * @param details a string, or a structured object (rendered as pretty JSON). Use
 *   the object form to carry ids — booking_id, dispute_id, the error message, etc.
 */
export async function alertAdmin(
  subject: string,
  details: string | Record<string, unknown>,
): Promise<void> {
  try {
    const adminEmail = getServerEnv().ADMIN_EMAIL;
    if (!adminEmail) {
      // Mirrors the documented env contract: routes that need admin contact must
      // check explicitly and no-op when unset. We log so the failure isn't fully
      // silent even without an alert address configured.
      console.error(
        `[alert-admin] ADMIN_EMAIL not set — dropping money-alert "${subject}":`,
        details,
      );
      return;
    }

    const rendered =
      typeof details === "string" ? details : JSON.stringify(details, null, 2);

    await sendEmail({
      to: adminEmail,
      subject: `[Solen money-alert] ${subject}`,
      html:
        `<p><strong>Money-path failure on solen.ch</strong></p>` +
        `<p>${escapeHtml(subject)}</p>` +
        `<pre style="background:#F5F5F4;padding:12px;border-radius:8px;white-space:pre-wrap;word-break:break-word;font-family:monospace;font-size:13px">${escapeHtml(rendered)}</pre>` +
        `<p style="color:#999;font-size:12px;margin-top:16px">Automated alert. Sent at ${new Date().toISOString()}.</p>`,
    });
  } catch (e) {
    // The alert itself failed (Resend down, env throw, etc.). Swallow — this must
    // never mask the original money error or crash the caller.
    console.error(`[alert-admin] failed to send money-alert "${subject}":`, e);
  }
}
