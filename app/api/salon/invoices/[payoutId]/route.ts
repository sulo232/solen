import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

// GET /api/salon/invoices/[payoutId]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ payoutId: string }> }
) {
  const { payoutId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the payout and ensure user owns the salon
  const { data: payout } = await supabase
    .from("salon_payouts")
    .select("*, salons(owner_id, name, address, zip_code, city, stripe_account_id), bookings(starts_at)")
    .eq("id", payoutId)
    .single();

  if (!payout) {
    return NextResponse.json({ error: "Payout not found" }, { status: 404 });
  }

  if (payout.salons?.owner_id !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Generate a simple HTML printable invoice
  const htmlInvoice = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <title>Rechnung - ${payoutId}</title>
      <style>
        body { font-family: sans-serif; padding: 40px; color: #333; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #E8624A; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #E8624A; }
        table { width: 100%; border-collapse: collapse; margin-top: 30px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f9f9f9; }
        .totals { margin-top: 30px; width: 50%; float: right; }
        .totals-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
        .totals-row.final { font-weight: bold; font-size: 1.1em; border-top: 2px solid #E8624A; border-bottom: none; }
        @media print {
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 20px;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #E8624A; color: white; border: none; border-radius: 6px; cursor: pointer;">Drucken / PDF speichern</button>
      </div>

      <div class="header">
        <div>
          <div class="logo">solen.ch</div>
          <p>Solen Plattform GmbH<br>Zürich, Schweiz</p>
        </div>
        <div style="text-align: right;">
          <h2>Abrechnung / Gutschrift</h2>
          <p><strong>Abrechnungs-Nr:</strong> ${payoutId.split('-')[0].toUpperCase()}</p>
          <p><strong>Datum:</strong> ${new Date(payout.created_at).toLocaleDateString("de-CH")}</p>
        </div>
      </div>

      <div style="margin-bottom: 40px;">
        <h3>Leistungsempfänger:</h3>
        <p>
          <strong>${payout.salons.name}</strong><br>
          ${payout.salons.address || ""}<br>
          ${payout.salons.zip_code || ""} ${payout.salons.city || ""}<br>
          Stripe ID: ${payout.salons.stripe_account_id || "N/A"}
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
              <small>Transaktion: ${payout.stripe_payment_intent_id}</small>
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
          <span style="color: #E8624A;">- CHF ${payout.commission_amount.toFixed(2)}</span>
        </div>
        <div class="totals-row">
          <span>Stripe Gateway Gebühren</span>
          <span style="color: #E8624A;">(durch Stripe abgezogen)</span>
        </div>
        <div class="totals-row final">
          <span>Netto-Auszahlungsbetrag</span>
          <span>CHF ${payout.net_amount.toFixed(2)}</span>
        </div>
      </div>

      <div style="clear: both; margin-top: 80px; font-size: 0.9em; color: #666;">
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
