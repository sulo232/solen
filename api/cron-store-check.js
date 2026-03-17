// solen.ch — Active store health check (runs monthly via Vercel Cron)
// Sends ping emails to salon owners. After 3 unanswered pings, freezes the store.
// Env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY, CRON_SECRET

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
  if (req.headers.authorization !== 'Bearer ' + process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Find stores that haven't had activity in 6+ months
  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();

  const stores = await supabaseRequest(
    `/rest/v1/stores?status=eq.active&last_active=lt.${sixMonthsAgo}&select=id,name,user_id,ping_count&limit=100`,
    'GET'
  );

  if (!Array.isArray(stores) || !stores.length) {
    return res.status(200).json({ pinged: 0, frozen: 0 });
  }

  let pinged = 0, frozen = 0;

  for (const store of stores) {
    const pingCount = (store.ping_count || 0) + 1;

    if (pingCount >= 3) {
      // Freeze the store after 3 unanswered pings
      await supabaseRequest(`/rest/v1/stores?id=eq.${store.id}`, 'PATCH', {
        status: 'frozen',
        ping_count: pingCount
      });

      // Cancel future bookings at this store
      await supabaseRequest(
        `/rest/v1/bookings?salon_id=eq.${store.id}&status=eq.confirmed&booking_date=gte.${new Date().toISOString().split('T')[0]}`,
        'PATCH',
        { status: 'cancelled' }
      );

      frozen++;
    } else {
      // Increment ping count and send warning email
      await supabaseRequest(`/rest/v1/stores?id=eq.${store.id}`, 'PATCH', {
        ping_count: pingCount
      });

      // Get owner email
      const profiles = await supabaseRequest(
        `/rest/v1/profiles?id=eq.${store.user_id}&select=email,first_name&limit=1`,
        'GET'
      );
      const owner = Array.isArray(profiles) && profiles[0];

      if (owner && owner.email) {
        const warning = pingCount === 1
          ? 'Ist dein Salon noch aktiv auf solen? Bitte bestätige, indem du dich einloggst.'
          : `Zweite Erinnerung: Dein Salon "${store.name}" wird bald eingefroren, wenn du nicht reagierst.`;

        // Send via existing email endpoint (internal call)
        try {
          await fetch(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/api/send-email` : 'https://solen.ch/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: owner.email,
              subject: `Ist "${store.name}" noch aktiv? (Erinnerung ${pingCount}/3)`,
              html: `<p>Hoi ${owner.first_name || ''},</p><p>${warning}</p><p><a href="https://solen.ch/#pageSalonDash" style="background:#9B1D30;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin:16px 0">Jetzt einloggen</a></p><p>Dein solen Team</p>`
            })
          });
        } catch (e) {
          console.error('Email failed for store', store.id, e);
        }
      }

      pinged++;
    }
  }

  return res.status(200).json({ pinged, frozen, message: `${pinged} pinged, ${frozen} frozen.` });
};
