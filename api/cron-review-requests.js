// solen.ch — Automated review request emails after completed bookings
// Deployed as Vercel serverless function, triggered by Vercel Cron
// Runs daily. Sends review request 24h after booking completion.
// Env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY

const https = require('https');

function supabaseRequest(path, method, body) {
  const url = new URL(path, process.env.SUPABASE_URL);
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: method || 'GET',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_KEY,
        'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
        'Prefer': method === 'PATCH' ? 'return=representation' : undefined
      }
    };
    Object.keys(opts.headers).forEach(k => { if (!opts.headers[k]) delete opts.headers[k]; });
    const req = https.request(opts, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { resolve(data); } });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

module.exports = async function handler(req, res) {
  // Verify this is a cron request (Vercel sets this header)
  if (req.headers.authorization !== 'Bearer ' + process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Find bookings completed 24h ago that haven't been reviewed yet
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const dayBefore = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const bookings = await supabaseRequest(
    `/rest/v1/bookings?status=eq.completed&review_requested=is.null&booking_date=gte.${dayBefore.toISOString().split('T')[0]}&booking_date=lte.${yesterday.toISOString().split('T')[0]}&select=id,user_id,salon_name,service_name&limit=50`,
    'GET'
  );

  if (!Array.isArray(bookings) || !bookings.length) {
    return res.status(200).json({ sent: 0, message: 'No review requests to send.' });
  }

  let sent = 0;
  for (const b of bookings) {
    // Get user email
    const users = await supabaseRequest(
      `/rest/v1/profiles?id=eq.${b.user_id}&select=email,first_name&limit=1`,
      'GET'
    );
    const user = Array.isArray(users) && users[0];
    if (!user || !user.email) continue;

    // Send review request email via existing send-email endpoint
    try {
      const emailRes = await new Promise((resolve, reject) => {
        const postData = JSON.stringify({
          to: user.email,
          subject: `Wie war dein Termin bei ${b.salon_name || 'deinem Salon'}?`,
          html: `<p>Hoi ${user.first_name || ''},</p>
<p>Dein Termin <strong>${b.service_name || ''}</strong> bei <strong>${b.salon_name || ''}</strong> liegt nun hinter dir.</p>
<p>Wir würden uns freuen, wenn du eine kurze Bewertung hinterlässt. Das hilft anderen Kund*innen und dem Salon!</p>
<p><a href="https://solen.ch/#pageBookings" style="background:#9B1D30;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin:16px 0">Bewertung abgeben</a></p>
<p>Merci vielmal!<br>Dein solen Team</p>`
        });
        const eReq = https.request({
          hostname: new URL(process.env.SUPABASE_URL).hostname.replace('.supabase.co', ''),
          path: '/api/send-email',
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
        }, eRes => {
          let d = '';
          eRes.on('data', c => d += c);
          eRes.on('end', () => resolve(d));
        });
        eReq.on('error', reject);
        eReq.write(postData);
        eReq.end();
      });

      // Mark booking as review_requested
      await supabaseRequest(
        `/rest/v1/bookings?id=eq.${b.id}`,
        'PATCH',
        { review_requested: true }
      );
      sent++;
    } catch (e) {
      console.error('Failed to send review request for booking', b.id, e);
    }
  }

  return res.status(200).json({ sent, message: `${sent} review requests sent.` });
};
