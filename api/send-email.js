// solen.ch — Brevo email notification handler
// Deployed as a Vercel serverless function at /api/send-email

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { customerEmail, customerName, salonName, salonEmail, serviceName, date, time, lang } = req.body;
  const isDE = lang !== 'en';
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) return res.status(500).json({ error: 'BREVO_API_KEY not set in Vercel environment variables' });
  if (!customerEmail || !customerName) return res.status(400).json({ error: 'Missing customer details' });

  const sendEmail = async (to, toName, subject, htmlContent) => {
    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
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
        htmlContent
      })
    });
    const text = await r.text();
    if (!r.ok) throw new Error(`Brevo error ${r.status}: ${text}`);
    return true;
  };

  const customerSubject = isDE ? `✅ Termin bestätigt — ${salonName}` : `✅ Appointment confirmed — ${salonName}`;
  const salonSubject = isDE ? `📅 Neue Buchung — ${customerName}` : `📅 New booking — ${customerName}`;

  const row = (label, value) => `
    <tr>
      <td style="padding:10px 0;color:#888;font-size:13px;border-bottom:1px solid #f0ede7">${label}</td>
      <td style="padding:10px 0;font-weight:700;font-size:14px;text-align:right;border-bottom:1px solid #f0ede7">${value}</td>
    </tr>`;

  const wrap = (body) => `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#fafaf8;border-radius:16px;overflow:hidden">
      <div style="background:#0d0d0d;padding:32px 40px;text-align:center">
        <span style="font-size:28px;font-weight:800;color:white;letter-spacing:-1px">solen<span style="color:#c8a96e">.ch</span></span>
      </div>
      <div style="padding:40px">${body}</div>
      <div style="background:#f5f2ec;padding:20px 40px;text-align:center;border-top:1px solid #e8e5df">
        <p style="color:#aaa;font-size:12px;margin:0">© 2025 solen.ch · Basel · <a href="https://solen.ch" style="color:#c8a96e;text-decoration:none">solen.ch</a></p>
      </div>
    </div>`;

  const table = (rows) => `
    <div style="background:white;border-radius:12px;padding:24px;border:1px solid #e8e5df;margin-bottom:24px">
      <table style="width:100%;border-collapse:collapse">${rows}</table>
    </div>`;

  const customerHtml = wrap(`
    <h2 style="font-size:22px;font-weight:800;color:#0d0d0d;margin-bottom:8px">${isDE ? 'Dein Termin ist bestätigt! ✅' : 'Your appointment is confirmed! ✅'}</h2>
    <p style="color:#666;font-size:15px;margin-bottom:28px">${isDE ? `Hallo ${customerName}, hier sind deine Buchungsdetails:` : `Hi ${customerName}, here are your booking details:`}</p>
    ${table(
      row(isDE ? 'Salon' : 'Salon', salonName) +
      row(isDE ? 'Dienstleistung' : 'Service', serviceName) +
      row(isDE ? 'Datum' : 'Date', date) +
      row(isDE ? 'Uhrzeit' : 'Time', time)
    )}
    <p style="color:#666;font-size:13px;line-height:1.6">${isDE ? 'Bitte erscheine pünktlich. Bei Verhinderung kontaktiere den Salon direkt.<br>Bis bald in Basel! 👋' : "Please arrive on time. If you can't make it, contact the salon directly.<br>See you in Basel! 👋"}</p>
  `);

  const salonHtml = wrap(`
    <h2 style="font-size:22px;font-weight:800;color:#0d0d0d;margin-bottom:8px">${isDE ? 'Neue Buchung eingegangen! 📅' : 'New booking received! 📅'}</h2>
    <p style="color:#666;font-size:15px;margin-bottom:28px">${isDE ? 'Ein Kunde hat über solen.ch gebucht.' : 'A customer just booked through solen.ch.'}</p>
    ${table(
      row(isDE ? 'Kunde' : 'Customer', customerName) +
      row('Email', customerEmail) +
      row(isDE ? 'Dienstleistung' : 'Service', serviceName) +
      row(isDE ? 'Datum' : 'Date', date) +
      row(isDE ? 'Uhrzeit' : 'Time', time)
    )}
    <p style="color:#666;font-size:13px">${isDE ? 'Bitte bestätige den Termin direkt mit dem Kunden.' : 'Please confirm the appointment with the customer directly.'}</p>
  `);

  try {
    await sendEmail(customerEmail, customerName, customerSubject, customerHtml);
    const salonTarget = salonEmail || 'hallo@solen.ch';
    await sendEmail(salonTarget, salonName, salonSubject, salonHtml);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Email error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
