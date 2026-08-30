/**
 * scripts/_email-proposal.mjs , the proposed email frame, in ONE place.
 *
 * Extracted 2026-08-15 so the all-emails preview and the art-direction chooser share a single
 * frame instead of each carrying a copy. A second copy is how the two would silently drift
 * apart, and then a decision made on one would not be true of the other.
 *
 * Still NOT APPLIED to any real email. Nothing in lib/ imports this.
 */
import { EMAIL_FONT_STACK } from "../lib/email.ts";

export const INK = "#0A0A0A";
export const INK2 = "#6B6B6B";
export const BORDER = "#E4E4E7";
export const SUNKEN = "#F4F4F5";

export const INK_BUTTON =
  "display:inline-block;padding:13px 26px;background:#0A0A0A;color:#ffffff;border-radius:999px;" +
  "text-decoration:none;font-weight:600;font-size:15px";

const FOOT = {
  de: "Sie erhalten diese E-Mail, weil Sie einen Termin über solen.ch gebucht haben.",
  en: "You are receiving this email because you booked an appointment through solen.ch.",
  fr: "Vous recevez cet e-mail car vous avez réservé un rendez-vous via solen.ch.",
  it: "Ricevi questa email perché hai prenotato un appuntamento tramite solen.ch.",
};

/**
 * The frame. Tables because Outlook lays email out with Word, which has no flexbox or grid.
 * The card is FLUID up to 600: measured on a phone, a fixed 600 ran off a 350 wide screen.
 *
 * @param bodyHtml  the email's own content
 * @param locale    de | en | fr | it
 * @param opts.bleed  html placed edge to edge above the padded body (a colour band, a photo)
 */
export function proposedShell(bodyHtml, locale, opts = {}) {
  const bleed = opts.bleed ?? "";
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${SUNKEN};margin:0;padding:24px 12px;font-family:${EMAIL_FONT_STACK}">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden">
      <tr><td style="padding:24px 28px 18px;font-family:${EMAIL_FONT_STACK}">
        <span style="font-size:20px;font-weight:700;color:${INK};letter-spacing:-.01em">solen.ch</span>
      </td></tr>
      <tr><td style="padding:0 28px"><div style="height:1px;background:${BORDER};line-height:1px">&nbsp;</div></td></tr>
      ${bleed ? `<tr><td style="padding:0">${bleed}</td></tr>` : ""}
      <tr><td style="padding:22px 28px 28px;color:${INK};font-size:15px;line-height:1.55;font-family:${EMAIL_FONT_STACK}">${bodyHtml}</td></tr>
    </table>
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px">
      <tr><td style="padding:16px 28px 8px;color:${INK2};font-size:12px;line-height:1.5;font-family:${EMAIL_FONT_STACK}">${FOOT[locale]}</td></tr>
    </table>
  </td></tr>
</table>`;
}

/** A mail client renders on its own white page. Mirror that and nothing more. */
export function frameDoc(inner, pad = 16) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}img{max-width:100%}</style></head><body style="margin:0;padding:${pad}px;background:#ffffff">${inner}</body></html>`;
}
