// solen.ch — Brevo email notification handler
// Deployed as a Vercel serverless function at /api/send-email
// API key is stored as BREVO_API_KEY in Vercel environment variables (never in code)

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    customerEmail,
    customerName,
    salonName,
    salonEmail,
    serviceName,
    date,
    time,
    lang
  } = req.body;

  const isDE = lang !== 'en';
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Email service not configured' });
  }

  // ── Email to CUSTOMER ────────────────────────────────
  const customerSubject = isDE
    ? `✅ Termin bestätigt — ${salonName}`
    : `✅ Appointment confirmed — ${salonName}`;

  const customerHtml = isDE ? `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#fafaf8;border-radius:16px;overflow:hidden">
      <div style="background:#0d0d0d;padding:32px 40px;text-align:center">
        <span style="font-size:28px;font-weight:800;color:white;letter-spacing:-1px">solen<span style="color:#c8a96e">.ch</span></span>
      </div>
      <div style="padding:40px">
        <h2 style="font-size:22px;font-weight:800;color:#0d0d0d;margin-bottom:8px">Dein Termin ist bestätigt! ✅</h2>
        <p style="color:#666;font-size:15px;margin-bottom:28px">Hallo ${customerName}, hier sind deine Buchungsdetails:</p>
        <div style="background:white;border-radius:12px;padding:24px;border:1px solid #e8e5df;margin-bottom:24px">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:10px 0;color:#888;font-size:13px;border-bottom:1px solid #f0ede7">Salon</td><td style="padding:10px 0;font-weight:700;font-size:14px;text-align:right;border-bottom:1px solid #f0ede7">${salonName}</td></tr>
            <tr><td style="padding:10px 0;color:#888;font-size:13px;border-bottom:1px solid #f0ede7">Dienstleistung</td><td style="padding:10px 0;font-weight:700;font-size:14px;text-align:right;border-bottom:1px solid #f0ede7">${serviceName}</td></tr>
            <tr><td style="padding:10px 0;color:#888;font-size:13px;border-bottom:1px solid #f0ede7">Datum</td><td style="padding:10px 0;font-weight:700;font-size:14px;text-align:right;border-bottom:1px solid #f0ede7">${date}</td></tr>
            <tr><td style="padding:10px 0;color:#888;font-size:13px">Uhrzeit</td><td style="padding:10px 0;font-weight:700;font-size:14px;text-align:right">${time} Uhr</td></tr>
          </table>
        </div>
        <p style="color:#666;font-size:13px;line-height:1.6">Bitte erscheine pünktlich. Bei Verhinderung kontaktiere den Salon direkt.<br>Bis bald in Basel! 👋</p>
      </div>
      <div style="background:#f5f2ec;padding:20px 40px;text-align:center;border-top:1px solid #e8e5df">
        <p style="color:#aaa;font-size:12px;margin:0">© 2025 solen.ch · Die Buchungsplattform für Basel · <a href="https://solen.ch" style="color:#c8a96e;text-decoration:none">solen.ch</a></p>
      </div>
    </div>` : `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#fafaf8;border-radius:16px;overflow:hidden">
      <div style="background:#0d0d0d;padding:32px 40px;text-align:center">
        <span style="font-size:28px;font-weight:800;color:white;letter-spacing:-1px">solen<span style="color:#c8a96e">.ch</span></span>
      </div>
      <div style="padding:40px">
        <h2 style="font-size:22px;font-weight:800;color:#0d0d0d;margin-bottom:8px">Your appointment is confirmed! ✅</h2>
        <p style="color:#666;font-size:15px;margin-bottom:28px">Hi ${customerName}, here are your booking details:</p>
        <div style="background:white;border-radius:12px;padding:24px;border:1px solid #e8e5df;margin-bottom:24px">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:10px 0;color:#888;font-size:13px;border-bottom:1px solid #f0ede7">Salon</td><td style="padding:10px 0;font-weight:700;font-size:14px;text-align:right;border-bottom:1px solid #f0ede7">${salonName}</td></tr>
            <tr><td style="padding:10px 0;color:#888;font-size:13px;border-bottom:1px solid #f0ede7">Service</td><td style="padding:10px 0;font-weight:700;font-size:14px;text-align:right;border-bottom:1px solid #f0ede7">${serviceName}</td></tr>
            <tr><td style="padding:10px 0;color:#888;font-size:13px;border-bottom:1px solid #f0ede7">Date</td><td style="padding:10px 0;font-weight:700;font-size:14px;text-align:right;border-bottom:1px solid #f0ede7">${date}</td></tr>
            <tr><td style="padding:10px 0;color:#888;font-size:13px">Time</td><td style="padding:10px 0;font-weight:700;font-size:14px;text-align:right">${time}</td></tr>
          </table>
        </div>
        <p style="color:#666;font-size:13px;line-height:1.6">Please arrive on time. If you can't make it, contact the salon directly.<br>See you in Basel! 👋</p>
      </div>
      <div style="background:#f5f2ec;padding:20px 40px;text-align:center;border-top:1px solid #e8e5df">
        <p style="color:#aaa;font-size:12px;margin:0">© 2025 solen.ch · Basel booking platform · <a href="https://solen.ch" style="color:#c8a96e;text-decoration:none">solen.ch</a></p>
      </div>
    </div>`;

  // ── Email to SALON ───────────────────────────────────
  const salonSubject = isDE
    ? `📅 Neue Buchung — ${customerName} — ${serviceName}`
    : `📅 New booking — ${customerName} — ${serviceName}`;

  const salonHtml = isDE ? `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#fafaf8;border-radius:16px;overflow:hidden">
      <div style="background:#0d0d0d;padding:32px 40px;text-align:center">
        <span style="font-size:28px;font-weight:800;color:white;letter-spacing:-1px">solen<span style="color:#c8a96e">.ch</span></span>
      </div>
      <div style="padding:40px">
        <h2 style="font-size:22px;font-weight:800;color:#0d0d0d;margin-bottom:8px">Neue Buchung eingegangen! 📅</h2>
        <p style="color:#666;font-size:15px;margin-bottom:28px">Ein Kunde hat einen Termin über solen.ch gebucht.</p>
        <div style="background:white;border-radius:12px;padding:24px;border:1px solid #e8e5df;margin-bottom:24px">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:10px 0;color:#888;font-size:13px;border-bottom:1px solid #f0ede7">Kunde</td><td style="padding:10px 0;font-weight:700;font-size:14px;text-align:right;border-bottom:1px solid #f0ede7">${customerName}</td></tr>
            <tr><td style="padding:10px 0;color:#888;font-size:13px;border-bottom:1px solid #f0ede7">E-Mail Kunde</td><td style="padding:10px 0;font-weight:700;font-size:14px;text-align:right;border-bottom:1px solid #f0ede7">${customerEmail}</td></tr>
            <tr><td style="padding:10px 0;color:#888;font-size:13px;border-bottom:1px solid #f0ede7">Dienstleistung</td><td style="padding:10px 0;font-weight:700;font-size:14px;text-align:right;border-bottom:1px solid #f0ede7">${serviceName}</td></tr>
            <tr><td style="padding:10px 0;color:#888;font-size:13px;border-bottom:1px solid #f0ede7">Datum</td><td style="padding:10px 0;font-weight:700;font-size:14px;text-align:right;border-bottom:1px solid #f0ede7">${date}</td></tr>
            <tr><td style="padding:10px 0;color:#888;font-size:13px">Uhrzeit</td><td style="padding:10px 0;font-weight:700;font-size:14px;text-align:right">${time} Uhr</td></tr>
          </table>
        </div>
        <p style="color:#666;font-size:13px;line-height:1.6">Bitte bestätige den Termin direkt mit dem Kunden per E-Mail.</p>
      </div>
      <div style="background:#f5f2ec;padding:20px 40px;text-align:center;border-top:1px solid #e8e5df">
        <p style="color:#aaa;font-size:12px;margin:0">© 2025 solen.ch · <a href="https://solen.ch" style="color:#c8a96e;text-decoration:none">solen.ch</a></p>
      </div>
    </div>` : `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#fafaf8;border-radius:16px;overflow:hidden">
      <div style="background:#0d0d0d;padding:32px 40px;text-align:center">
        <span style="font-size:28px;font-weight:800;color:white;letter-spacing:-1px">solen<span style="color:#c8a96e">.ch</span></span>
      </div>
      <div style="padding:40px">
        <h2 style="font-size:22px;font-weight:800;color:#0d0d0d;margin-bottom:8px">New booking received! 📅</h2>
        <p style="color:#666;font-size:15px;margin-bottom:28px">A customer just booked through solen.ch.</p>
        <div style="background:white;border-radius:12px;padding:24px;border:1px solid #e8e5df;margin-bottom:24px">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:10px 0;color:#888;font-size:13px;border-bottom:1px solid #f0ede7">Customer</td><td style="padding:10px 0;font-weight:700;font-size:14px;text-align:right;border-bottom:1px solid #f0ede7">${customerName}</td></tr>
            <tr><td style="padding:10px 0;color:#888;font-size:13px;border-bottom:1px solid #f0ede7">Customer email</td><td style="padding:10px 0;font-weight:700;font-size:14px;text-align:right;border-bottom:1px solid #f0ede7">${customerEmail}</td></tr>
            <tr><td style="padding:10px 0;color:#888;font-size:13px;border-bottom:1px solid #f0ede7">Service</td><td style="padding:10px 0;font-weight:700;font-size:14px;text-align:right;border-bottom:1px solid #f0ede7">${serviceName}</td></tr>
            <tr><td style="padding:10px 0;color:#888;font-size:13px;border-bottom:1px solid #f0ede7">Date</td><td style="padding:10px 0;font-weight:700;font-size:14px;text-align:right;border-bottom:1px solid #f0ede7">${date}</td></tr>
            <tr><td style="padding:10px 0;color:#888;font-size:13px">Time</td><td style="padding:10px 0;font-weight:700;font-size:14px;text-align:right">${time}</td></tr>
          </table>
        </div>
        <p style="color:#666;font-size:13px;line-height:1.6">Please confirm the appointment with the customer by email.</p>
      </div>
      <div style="background:#f5f2ec;padding:20px 40px;text-align:center;border-top:1px solid #e8e5df">
        <p style="color:#aaa;font-size:12px;margin:0">© 2025 solen.ch · <a href="https://solen.ch" style="color:#c8a96e;text-decoration:none">solen.ch</a></p>
      </div>
    </div>`;

  // ── Send both emails via Brevo API ───────────────────
  try {
    const sendEmail = async (to, toName, subject, html) => {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'solen.ch', email: 'noreply@solen.ch' },
          to: [{ email: to, name: toName }],
          subject,
          htmlContent: html
        })
      });
      return response.ok;
    };

    // Send to customer
    await sendEmail(customerEmail, customerName, customerSubject, customerHtml);

    // Send to salon (uses salon email if provided, otherwise falls back to admin)
    const salonTarget = salonEmail || 'hallo@solen.ch';
    await sendEmail(salonTarget, salonName, salonSubject, salonHtml);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Email error:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
