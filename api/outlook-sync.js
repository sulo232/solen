// solen.ch — Outlook Calendar two-way sync via Microsoft Graph API
// Deployed as a Vercel serverless function at /api/outlook-sync
// Env vars: MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, SUPABASE_URL, SUPABASE_SERVICE_KEY

const https = require('https');
const querystring = require('querystring');

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
        'Prefer': method === 'PATCH' ? 'return=representation' : (method === 'POST' ? 'return=representation' : undefined)
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

function graphApi(method, path, accessToken, body) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'graph.microsoft.com',
      path: '/v1.0' + path,
      method: method,
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json'
      }
    };
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

async function refreshOutlookToken(refreshToken) {
  const postData = querystring.stringify({
    client_id: process.env.MICROSOFT_CLIENT_ID,
    client_secret: process.env.MICROSOFT_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
    scope: 'Calendars.ReadWrite offline_access User.Read'
  });
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'login.microsoftonline.com', path: '/common/oauth2/v2.0/token', method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(postData) }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { resolve(data); } });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://solen.ch');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { user_id, action } = req.body;
  if (!user_id) return res.status(400).json({ error: 'Missing user_id' });

  // Get stored tokens
  const tokens = await supabaseRequest(
    `/rest/v1/calendar_tokens?user_id=eq.${encodeURIComponent(user_id)}&provider=eq.outlook&limit=1`,
    'GET'
  );
  if (!Array.isArray(tokens) || !tokens.length) {
    return res.status(401).json({ error: 'No Outlook Calendar connection found. Please connect first.' });
  }

  let token = tokens[0];
  let accessToken = token.access_token;

  // Refresh if expired
  if (new Date(token.expires_at) <= new Date()) {
    if (!token.refresh_token) return res.status(401).json({ error: 'Token expired and no refresh token available.' });
    const refreshed = await refreshOutlookToken(token.refresh_token);
    if (!refreshed.access_token) return res.status(401).json({ error: 'Token refresh failed.' });
    accessToken = refreshed.access_token;
    await supabaseRequest(
      `/rest/v1/calendar_tokens?id=eq.${token.id}`,
      'PATCH',
      { access_token: accessToken, expires_at: new Date(Date.now() + (refreshed.expires_in || 3600) * 1000).toISOString() }
    );
  }

  // ACTION: push — sync Solen bookings to Outlook Calendar
  if (action === 'push') {
    const bookings = await supabaseRequest(
      `/rest/v1/bookings?user_id=eq.${encodeURIComponent(user_id)}&status=neq.cancelled&outlook_event_id=is.null&order=booking_date.asc&limit=50`,
      'GET'
    );

    if (!Array.isArray(bookings)) return res.status(500).json({ error: 'Failed to load bookings' });

    let synced = 0;
    for (const b of bookings) {
      const startDt = b.booking_date + 'T' + (b.booking_time || '00:00') + ':00';
      const dur = parseInt(b.service_duration) || 60;
      const endDate = new Date(new Date(startDt).getTime() + dur * 60000);

      const event = {
        subject: (b.service_name || 'Termin') + ' @ ' + (b.salon_name || 'Salon'),
        start: { dateTime: startDt, timeZone: 'Europe/Zurich' },
        end: { dateTime: endDate.toISOString().replace('Z', ''), timeZone: 'Europe/Zurich' },
        body: { contentType: 'text', content: 'Gebucht via Solen.ch' + (b.notes ? '\n' + b.notes : '') },
        location: { displayName: b.salon_name || 'Salon' }
      };

      const created = await graphApi('POST', '/me/events', accessToken, event);
      if (created.id) {
        await supabaseRequest(
          `/rest/v1/bookings?id=eq.${b.id}`,
          'PATCH',
          { outlook_event_id: created.id }
        );
        synced++;
      }
    }

    return res.status(200).json({ synced, message: `${synced} Termine mit Outlook synchronisiert.` });
  }

  // ACTION: pull — read Outlook Calendar events for cancellations
  if (action === 'pull') {
    const now = new Date();
    const startDt = new Date(now.getTime() - 7 * 86400000).toISOString();
    const endDt = new Date(now.getTime() + 90 * 86400000).toISOString();

    const events = await graphApi(
      'GET',
      `/me/calendarview?startDateTime=${encodeURIComponent(startDt)}&endDateTime=${encodeURIComponent(endDt)}&$top=100&$select=id,subject,body,isCancelled,start,end`,
      accessToken
    );

    if (!events.value) return res.status(200).json({ events: 0 });

    let updated = 0;
    const solenEvents = events.value.filter(e => (e.body?.content || '').includes('Solen.ch'));
    for (const e of solenEvents) {
      if (e.isCancelled) {
        const bookings = await supabaseRequest(
          `/rest/v1/bookings?outlook_event_id=eq.${encodeURIComponent(e.id)}&status=neq.cancelled&limit=1`,
          'GET'
        );
        if (Array.isArray(bookings) && bookings.length) {
          await supabaseRequest(`/rest/v1/bookings?id=eq.${bookings[0].id}`, 'PATCH', { status: 'cancelled' });
          updated++;
        }
      }
    }

    return res.status(200).json({ events: solenEvents.length, updated });
  }

  return res.status(400).json({ error: 'Invalid action. Use "push" or "pull".' });
};
