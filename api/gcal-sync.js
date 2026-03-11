// solen.ch — Google Calendar two-way sync
// Deployed as a Vercel serverless function at /api/gcal-sync
// Syncs bookings → Google Calendar events and vice versa
// Env vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SUPABASE_URL, SUPABASE_SERVICE_KEY

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
        'Prefer': method === 'PATCH' ? 'return=representation' : (method === 'POST' ? 'return=representation,resolution=merge-duplicates' : undefined)
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

function googleApi(method, path, accessToken, body) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'www.googleapis.com',
      path: path,
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

async function refreshGoogleToken(refreshToken) {
  const postData = querystring.stringify({
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  });
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'oauth2.googleapis.com', path: '/token', method: 'POST',
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
    `/rest/v1/calendar_tokens?user_id=eq.${encodeURIComponent(user_id)}&provider=eq.google&limit=1`,
    'GET'
  );
  if (!Array.isArray(tokens) || !tokens.length) {
    return res.status(401).json({ error: 'No Google Calendar connection found. Please connect first.' });
  }

  let token = tokens[0];
  let accessToken = token.access_token;

  // Refresh if expired
  if (new Date(token.expires_at) <= new Date()) {
    if (!token.refresh_token) return res.status(401).json({ error: 'Token expired and no refresh token available.' });
    const refreshed = await refreshGoogleToken(token.refresh_token);
    if (!refreshed.access_token) return res.status(401).json({ error: 'Token refresh failed.' });
    accessToken = refreshed.access_token;
    // Update stored token
    await supabaseRequest(
      `/rest/v1/calendar_tokens?id=eq.${token.id}`,
      'PATCH',
      { access_token: accessToken, expires_at: new Date(Date.now() + (refreshed.expires_in || 3600) * 1000).toISOString() }
    );
  }

  // ACTION: push — sync Solen bookings to Google Calendar
  if (action === 'push') {
    const bookings = await supabaseRequest(
      `/rest/v1/bookings?user_id=eq.${encodeURIComponent(user_id)}&status=neq.cancelled&gcal_event_id=is.null&order=booking_date.asc&limit=50`,
      'GET'
    );

    if (!Array.isArray(bookings)) return res.status(500).json({ error: 'Failed to load bookings' });

    let synced = 0;
    for (const b of bookings) {
      const startDt = b.booking_date + 'T' + (b.booking_time || '00:00') + ':00';
      const dur = parseInt(b.service_duration) || 60;
      const endDate = new Date(new Date(startDt).getTime() + dur * 60000);

      const event = {
        summary: (b.service_name || 'Termin') + ' @ ' + (b.salon_name || 'Salon'),
        start: { dateTime: startDt, timeZone: 'Europe/Zurich' },
        end: { dateTime: endDate.toISOString(), timeZone: 'Europe/Zurich' },
        description: 'Gebucht via Solen.ch' + (b.notes ? '\n' + b.notes : ''),
        source: { title: 'Solen.ch', url: 'https://solen.ch' }
      };

      const created = await googleApi('POST', '/calendar/v3/calendars/primary/events', accessToken, event);
      if (created.id) {
        await supabaseRequest(
          `/rest/v1/bookings?id=eq.${b.id}`,
          'PATCH',
          { gcal_event_id: created.id }
        );
        synced++;
      }
    }

    return res.status(200).json({ synced, message: `${synced} Termine mit Google Calendar synchronisiert.` });
  }

  // ACTION: pull — read Google Calendar events and check for cancellations
  if (action === 'pull') {
    const now = new Date();
    const timeMin = new Date(now.getTime() - 7 * 86400000).toISOString();
    const timeMax = new Date(now.getTime() + 90 * 86400000).toISOString();

    const events = await googleApi(
      'GET',
      `/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&maxResults=100&singleEvents=true&orderBy=startTime`,
      accessToken
    );

    if (!events.items) return res.status(200).json({ events: 0 });

    // Check for cancelled Solen events
    let updated = 0;
    const solenEvents = events.items.filter(e => (e.description || '').includes('Solen.ch') || (e.source?.url || '').includes('solen.ch'));
    for (const e of solenEvents) {
      if (e.status === 'cancelled') {
        // Find matching booking and cancel it
        const bookings = await supabaseRequest(
          `/rest/v1/bookings?gcal_event_id=eq.${encodeURIComponent(e.id)}&status=neq.cancelled&limit=1`,
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
