// solen.ch — Resend email notification handler
// Deployed as a Vercel serverless function at /api/send-email
// Env var required: RESEND_API_KEY

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://solen.ch');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { customerEmail, customerName, salonName, salonEmail, serviceName, date, time, lang } = req.body;
  const isDE = lang !== 'en';
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) return res.status(500).json({ error: 'RESEND_API_KEY not set in Vercel environment variables' });
  if (!customerEmail || !customerName) return res.status(400).json({ error: 'Missing customer details' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) return res.status(400).json({ error: 'Invalid customer email format' });
  if (salonEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(salonEmail)) return res.status(400).json({ error: 'Invalid salon email format' });
  if (!salonName || !serviceName || !date || !time) return res.status(400).json({ error: 'Missing booking details' });

  const sendEmail = async (to, toName, subject, htmlContent) => {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'solen.ch <noreply@solen.ch>',
        to: [`${toName} <${to}>`],
        subject,
        html: htmlContent
      })
    });
    const text = await r.text();
    if (!r.ok) throw new Error(`Resend error ${r.status}: ${text}`);
    return true;
  };

  const customerSubject = isDE ? `Läuft – din Termin bi ${salonName} steht` : `You're booked – ${salonName}`;
  const salonSubject = isDE ? `Neui Buchig vo ${customerName}` : `New booking from ${customerName}`;

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
    <h2 style="font-size:22px;font-weight:800;color:#0d0d0d;margin-bottom:8px">${isDE ? 'Läuft – din Termin steht!' : 'You\'re all set!'}</h2>
    <p style="color:#666;font-size:15px;margin-bottom:28px">${isDE ? `Hey ${customerName}, hier d Details zu dim Termin:` : `Hey ${customerName}, here's what's booked:`}</p>
    ${table(
      row(isDE ? 'Salon' : 'Salon', salonName) +
      row(isDE ? 'Dienstleistung' : 'Service', serviceName) +
      row(isDE ? 'Datum' : 'Date', date) +
      row(isDE ? 'Uhrzeit' : 'Time', time)
    )}
    <p style="color:#666;font-size:13px;line-height:1.6">${isDE ? 'Bitte pünktlich cho. Wenns nid gaat, meld dich direkt bim Salon, gäll.<br>Bis denn!' : "Try to be on time. If something comes up, just let the salon know directly.<br>See you!"}</p>
  `);

  const salonHtml = wrap(`
    <h2 style="font-size:22px;font-weight:800;color:#0d0d0d;margin-bottom:8px">${isDE ? 'Neui Buchig isch da!' : 'New booking just came in!'}</h2>
    <p style="color:#666;font-size:15px;margin-bottom:28px">${isDE ? 'Öpper het über solen.ch buecht – hier d Details:' : 'Someone just booked through solen.ch – here are the details:'}</p>
    ${table(
      row(isDE ? 'Kunde' : 'Customer', customerName) +
      row('Email', customerEmail) +
      row(isDE ? 'Dienstleistung' : 'Service', serviceName) +
      row(isDE ? 'Datum' : 'Date', date) +
      row(isDE ? 'Uhrzeit' : 'Time', time)
    )}
    <p style="color:#666;font-size:13px">${isDE ? 'Meld dich am beste churz bim Chund zum bestätige.' : 'Best to reach out to the customer to confirm.'}</p>
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
