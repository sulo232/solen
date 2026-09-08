import { NextResponse } from "next/server";
import { requireAuth, requireSalonAccess } from "@/lib/auth/require";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { BRAND_HTML_COLORS, BRAND_HTML_FONT_STACK } from "@/lib/brand-html-constants";

// Store-authored text is also rendered to finance-granted staff. Keep it text.
function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}

// GET /api/salon/invoices/[payoutId]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ payoutId: string }> }
) {
  const { payoutId } = await params;
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  // Resolve only the Store identity before checking access to financial data.
  const admin = createAdminSupabaseClient();
  const { data: identity } = await admin.from("salon_payouts")
    .select("salon_id").eq("id", payoutId).maybeSingle();
  if (!identity) return NextResponse.json({ error: "Payout not found" }, { status: 404 });
  const access = await requireSalonAccess(identity.salon_id, "finance", auth);
  if (access instanceof NextResponse) return access;

  const { data: payout } = await admin
    .from("salon_payouts")
    .select("salon_id, gross_amount, commission_percent, commission_amount, net_amount, stripe_payment_intent_id, created_at, salons(owner_id, name, address, postal_code, cities(name_de), stripe_account_id), bookings(starts_at)")
    .eq("id", payoutId)
    .eq("salon_id", access.salon.id)
    .single();

  if (!payout) {
    return NextResponse.json({ error: "Payout not found" }, { status: 404 });
  }

  // Generate a simple HTML printable invoice
  const htmlInvoice = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <title>Rechnung - ${payoutId}</title>
      <style>
        body { font-family: ${BRAND_HTML_FONT_STACK}; padding: 40px; color: ${BRAND_HTML_COLORS.ink}; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid ${BRAND_HTML_COLORS.ink}; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: ${BRAND_HTML_COLORS.ink}; }
        table { width: 100%; border-collapse: collapse; margin-top: 30px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid ${BRAND_HTML_COLORS.border}; }
        th { background: ${BRAND_HTML_COLORS.bgSunken}; }
        .totals { margin-top: 30px; width: 50%; float: right; }
        .totals-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid ${BRAND_HTML_COLORS.border}; }
        .totals-row.final { font-weight: bold; font-size: 1.1em; border-top: 2px solid ${BRAND_HTML_COLORS.ink}; border-bottom: none; }
        @media print {
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 20px;">
        <button onclick="window.print()" style="padding: 10px 20px; background: ${BRAND_HTML_COLORS.ink}; color: white; border: none; border-radius: 6px; cursor: pointer;">Drucken / PDF speichern</button>
      </div>

      <div class="header">
        <div>
          <div class="logo">solen.ch</div>
          <p>Solen Plattform GmbH<br>Zürich, Schweiz</p>
        </div>
        <div style="text-align: right;">
          <h2>Abrechnung / Gutschrift</h2>
          <p><strong>Abrechnungs-Nr:</strong> ${payoutId.split('-')[0].toUpperCase()}</p>
          <p><strong>Datum:</strong> ${new Date(payout.created_at ?? new Date().toISOString()).toLocaleDateString("de-CH")}</p>
        </div>
      </div>

      <div style="margin-bottom: 40px;">
        <h3>Leistungsempfänger:</h3>
        <p>
          <strong>${escapeHtml(payout.salons.name)}</strong><br>
          ${escapeHtml(payout.salons.address || "")}<br>
          ${escapeHtml(payout.salons.postal_code || "")} ${escapeHtml(payout.salons.cities?.name_de || "")}<br>
          Stripe ID: ${escapeHtml(payout.salons.stripe_account_id || "N/A")}
        </p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Beschreibung</th>
            <th style="text-align: right;">Brutto (CHF)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              Kundenzahlung für Termin am 
              ${payout.bookings?.starts_at ? new Date(payout.bookings.starts_at).toLocaleDateString("de-CH") : "N/A"}<br>
              <small>Transaktion: ${escapeHtml(payout.stripe_payment_intent_id)}</small>
            </td>
            <td style="text-align: right;">${payout.gross_amount.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <div class="totals">
        <div class="totals-row">
          <span>Zwischensumme (Brutto-Umsatz)</span>
          <span>CHF ${payout.gross_amount.toFixed(2)}</span>
        </div>
        <div class="totals-row">
          <span>Plattformkommission (${payout.commission_percent}%)</span>
          <span style="color: ${BRAND_HTML_COLORS.ink2};">- CHF ${payout.commission_amount.toFixed(2)}</span>
        </div>
        <div class="totals-row">
          <span>Stripe Gateway Gebühren</span>
          <span style="color: ${BRAND_HTML_COLORS.ink2};">(durch Stripe abgezogen)</span>
        </div>
        <div class="totals-row final">
          <span>Netto-Auszahlungsbetrag</span>
          <span>CHF ${payout.net_amount.toFixed(2)}</span>
        </div>
      </div>

      <div style="clear: both; margin-top: 80px; font-size: 0.9em; color: ${BRAND_HTML_COLORS.ink2};">
        <p>Diese Abrechnung wurde maschinell erstellt und ist ohne Unterschrift gültig.</p>
        <p>Der Netto-Auszahlungsbetrag wurde für Ihren Stripe Connect Account vorgemerkt und wird gemäss Ihrem Payout-Schedule (Standard: wöchentlich) auf Ihr Bankkonto überwiesen.</p>
      </div>
    </body>
    </html>
  `;

  return new NextResponse(htmlInvoice, {
    headers: {
      "Content-Type": "text/html",
      "Content-Disposition": `inline; filename="solen-abrechnung-${payoutId.split('-')[0]}.html"`
    }
  });
}
