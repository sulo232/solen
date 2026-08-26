/**
 * scripts/_email-frame-v2.mjs , the v2 email frame, superseding scripts/_email-proposal.mjs.
 *
 * OWNER, 2026-08-26: sent 26 screenshots of his own inbox (Bolt + Klarna transactional
 * emails) and said "make it like this." Measured with PIL off IMG_7994, a 1206x2622 capture
 * at 3x, so a 402pt phone:
 *   - the colour band is 370.0pt wide with a 16.0pt inset each side, 287.7pt tall, square
 *     corners, fill #4D9B69. That is 288 of the phone's 874 points, so a third of the first
 *     screen goes to the block before the illustration even starts.
 *   - IMG_7993 (Klarna): headline ink band 28.3pt against body 15.0pt, so the headline runs
 *     about 2.0x the body.
 *   - IMG_8001: the CTA pill measures 138.3 x 41.7pt, so about a 44px tall fully-rounded pill,
 *     which is also this project's own 44px touch floor.
 *   - IMG_8015 / IMG_8016 / IMG_8008: the picture inside the email is their own app, drawn.
 *
 * Still NOT APPLIED to any real email. Nothing in lib/ imports this, same as v1.
 *
 * WHY V2 AND NOT AN EDIT TO v1: v1 (_email-proposal.mjs) never gained a preheader, never
 * carried the measured photographic art (that only exists as of scripts/build-email-art.mjs,
 * built the same session), and only ever rendered one shape. Rather than bolt three unrelated
 * additions onto a frame that already ships zero real emails, this is the frame v1 was always
 * a placeholder for , v1 stays on disk as the record of what came before, not deleted.
 *
 * THREE SHAPES, because the reference set contains all three and the choice belongs to a
 * look, not a description: "band" is the Bolt shape with the booking card photographed from
 * the app underneath it, "plain" is the Klarna shape (no block, wordmark and headline sit
 * straight on white), "object" is the Bolt shape again but with a made-for-us 3D object
 * breaking out of the block's bottom edge instead of a photographed card underneath it, the
 * same overlap IMG_7994's own scooter makes. Rows/cta/footer are shared by all three; only the
 * top block and the picture slot change.
 */
import { EMAIL_FONT_STACK } from "../lib/email.ts";

export const INK = "#0A0A0A";
export const INK2 = "#6B6B6B";
export const BORDER = "#E4E4E7";
export const SUNKEN = "#F4F4F5";
// Not a token in lib/email-colors.ts (nothing there needs to name white), but every colour in
// this file's markup is still a named const per the brief, none typed as a bare hex inline.
export const WHITE = "#ffffff";

// Why the band is ink and not the success green the state chip already uses inside the art:
// white text on #16A34A measures 3.30:1 (checked against the WCAG formula by hand: relative
// luminance of white and of #16A34A, then (L1+0.05)/(L2+0.05)), which fails the 4.5:1 AA floor
// for body text outright. White on #0A0A0A measures about 19.8:1. The green still appears, as
// the small state chip baked into the picture, where it sits behind dark text on a pale tint
// and never carries white text itself, so it stays legal there.
const BAND_BG = INK;

export const INK_BUTTON =
  `display:inline-block;padding:14px 28px;background:${INK};color:${WHITE};border-radius:999px;` +
  "text-decoration:none;font-weight:600;font-size:15px";

// Copied from scripts/_email-proposal.mjs's own FOOT (that const is module-local there, not
// exported, so there is nothing to import) rather than authored fresh, per the brief: reuse
// the four locale strings that already exist instead of writing new ones.
const FOOT = {
  de: "Sie erhalten diese E-Mail, weil Sie einen Termin über solen.ch gebucht haben.",
  en: "You are receiving this email because you booked an appointment through solen.ch.",
  fr: "Vous recevez cet e-mail car vous avez réservé un rendez-vous via solen.ch.",
  it: "Ricevi questa email perché hai prenotato un appuntamento tramite solen.ch.",
};

// Fixed output of scripts/build-email-art.mjs, same two files regardless of which email or
// treatment is being framed.
const WORDMARK_WHITE_SRC = "/_email-assets/art/wordmark-white.png";
const WORDMARK_INK_SRC = "/_email-assets/art/wordmark-ink.png";

/**
 * The hidden preheader. None of the 67 existing templates carry one (checked by hand across
 * lib/email.ts + lib/email-templates/**), so today Gmail's inbox list shows the subject and
 * then the first real words of the body, which for the confirmation is literally "Hallo,".
 * The zero-width-space + nbsp run pushes that real copy far enough down that Gmail's preview
 * window (roughly 90-140 characters wide, varies by client and screen) never reaches it; 40
 * repeats is a generous round buffer, not a measured client limit, and costs nothing to keep
 * generous since the whole block is display:none.
 */
function preheaderHtml(text) {
  const filler = "&#8203;&nbsp;".repeat(40);
  return `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${WHITE};opacity:0">${text}${filler}</div>`;
}

/** A 1px rule with no visible height contribution, the same spacer idiom v1 uses for its own hairline. */
function spacer(px) {
  return `<div style="height:${px}px;line-height:${px}px;font-size:1px;">&nbsp;</div>`;
}

function headlineHtml(text, color) {
  // 32 against this project's 16px body is 2.0x, matching the 2.0x Klarna ratio measured
  // above and clearing LOCKFILE's own 1.8x anchor floor with room, not chosen independently.
  return `<h1 style="margin:0;font-size:32px;line-height:1.15;font-weight:700;letter-spacing:-.02em;color:${color};font-family:${EMAIL_FONT_STACK}">${text}</h1>`;
}

function topBlock(treatment, headline) {
  // "object" reuses the exact same full-bleed band as "band" , only the picture slot below it
  // (objectBreakoutRow vs artRow) differs between the two.
  if (treatment === "band" || treatment === "object") {
    return `<tr><td style="background:${BAND_BG};padding:28px;text-align:left;">
      <img src="${WORDMARK_WHITE_SRC}" width="96" alt="solen.ch" style="display:block;border:0;outline:none;">
      ${spacer(22)}
      ${headlineHtml(headline, WHITE)}
    </td></tr>`;
  }
  return `<tr><td style="padding:28px 28px 0;text-align:left;">
    <img src="${WORDMARK_INK_SRC}" width="96" alt="solen.ch" style="display:block;border:0;outline:none;">
    ${spacer(22)}
    ${headlineHtml(headline, INK)}
  </td></tr>`;
}

function artRow(art) {
  if (!art) return "";
  return `<tr><td style="background:${WHITE};padding:20px 28px 0;text-align:center;">
    <img src="${art}" width="552" alt="" style="display:block;margin:0 auto;width:100%;max-width:552px;height:auto;border:0;outline:none;">
  </td></tr>`;
}

/**
 * The "object" treatment's picture: a 140px 3D object breaking out of the band above it, the
 * same move IMG_7994's scooter makes off the Bolt band's bottom edge. Outlook's Word engine
 * ignores negative margins outright (checked against how it renders the rest of this file's
 * own layout, which is why everything else here is table padding, never margin math), so the
 * overlap and a plain non-overlapping fallback are mutually exclusive via MSO conditional
 * comments: Outlook only ever parses the `[if mso]` block, every other client only ever parses
 * the `[if !mso]` block, so exactly one image ever paints for a given reader.
 */
function objectBreakoutRow(object) {
  if (!object) return "";
  return `<tr><td style="background:${WHITE};padding:0 28px;text-align:center;">
    <!--[if mso]>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding-top:16px;">
    <img src="${object}" width="140" alt="" style="display:inline-block;border:0;outline:none;">
    </td></tr></table>
    <![endif]-->
    <!--[if !mso]><!-->
    <img src="${object}" width="140" alt="" style="display:inline-block;margin-top:-46px;border:0;outline:none;">
    <!--<![endif]-->
  </td></tr>`;
}

function rowsTable(rows) {
  if (!rows || rows.length === 0) return "";
  const trs = rows
    .map((r, i) => {
      const rule = i > 0 ? `border-top:1px solid ${BORDER};` : "";
      return `<tr>
        <td style="padding:8px 0;font-size:14px;color:${INK2};${rule}font-family:${EMAIL_FONT_STACK}">${r.label}</td>
        <td align="right" style="padding:8px 0;font-size:15px;font-weight:600;color:${INK};font-variant-numeric:tabular-nums;${rule}font-family:${EMAIL_FONT_STACK}">${r.value}</td>
      </tr>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${trs}</table>`;
}

/**
 * framedEmail() , the whole message body: preheader, top block (band or plain), the art
 * picture, the fact rows, one CTA, an optional note, the footer. Tables only, because Outlook
 * lays a message out with the Word engine: no flexbox, no grid, and no border-radius that
 * survives on a <td>, which is why the rounding lives in the ART picture (drawn by Chromium,
 * baked into a flat file) rather than attempted here in markup.
 *
 * @param {object} p
 * @param {"de"|"en"|"fr"|"it"} p.locale
 * @param {"band"|"plain"|"object"} p.treatment
 * @param {string} p.preheader  hidden inbox-list preview text
 * @param {string} p.eyebrow    optional small label above the headline (reserved, not yet placed
 *                               in any shape; all three references put the identity in the
 *                               wordmark and the state in the headline, so it stays unused rather
 *                               than invented into a fourth slot without a reference for it)
 * @param {string} p.headline
 * @param {string|null} p.art     /_email-assets/art/*.jpg booking-card picture, used by "band"
 *                                  and "plain"; ignored by "object". Falsy skips the row.
 * @param {string|null} p.object  /_email-assets/art/obj-*.png 3D object, used only by "object"
 *                                  (that treatment never shows the booking-card picture: the
 *                                  object IS the picture). Falsy skips the row.
 * @param {{label:string,value:string}[]} p.rows
 * @param {{label:string,href:string}} p.cta
 * @param {string} [p.note]
 */
export function framedEmail({ locale, treatment, preheader, eyebrow, headline, art, object, rows, cta, note }) {
  void eyebrow; // see the jsdoc note above: reserved, intentionally not rendered by any shape yet
  const outer = `background:${SUNKEN};margin:0;padding:24px 12px;font-family:${EMAIL_FONT_STACK}`;
  const cardTable = `width:100%;max-width:600px;background:${WHITE};border-radius:16px;overflow:hidden`;
  const footTable = `width:100%;max-width:600px`;
  const pictureRow = treatment === "object" ? objectBreakoutRow(object) : artRow(art);

  return `${preheaderHtml(preheader)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${outer}">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="${cardTable}">
      ${topBlock(treatment, headline)}
      ${pictureRow}
      <tr><td style="padding:22px 28px 28px;font-family:${EMAIL_FONT_STACK}">
        ${rowsTable(rows)}
        <p style="margin:24px 0 0;"><a href="${cta.href}" style="${INK_BUTTON}">${cta.label}</a></p>
        ${note ? `<p style="margin:12px 0 0;font-size:13px;color:${INK2};">${note}</p>` : ""}
      </td></tr>
    </table>
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="${footTable}">
      <tr><td style="padding:16px 28px 8px;"><div style="height:1px;background:${BORDER};line-height:1px">&nbsp;</div></td></tr>
      <tr><td style="padding:12px 28px 8px;color:${INK2};font-size:12px;line-height:1.5;font-family:${EMAIL_FONT_STACK}">${FOOT[locale]}</td></tr>
    </table>
  </td></tr>
</table>`;
}

/** A mail client renders on its own white page. Mirror that and nothing more. Same helper as v1. */
export function frameDoc(inner, pad = 16) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><style>*{box-sizing:border-box}img{max-width:100%}</style></head><body style="margin:0;padding:${pad}px;background:#ffffff">${inner}</body></html>`;
}
