// solen.ch — Push notification subscription storage
// Deployed as a Vercel serverless function at /api/push-subscribe
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
        'Prefer': method === 'POST' ? 'return=representation,resolution=merge-duplicates' : undefined
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
  res.setHeader('Access-Control-Allow-Origin', 'https://solen.ch');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { user_id, subscription } = req.body;
  if (!user_id || !subscription) return res.status(400).json({ error: 'Missing user_id or subscription' });

  // Store push subscription (upsert by endpoint)
  const result = await supabaseRequest('/rest/v1/push_subscriptions', 'POST', {
    user_id,
    endpoint: subscription.endpoint,
    keys_p256dh: subscription.keys?.p256dh || null,
    keys_auth: subscription.keys?.auth || null,
    subscription_json: JSON.stringify(subscription),
    updated_at: new Date().toISOString()
  });

  return res.status(200).json({ ok: true });
};
