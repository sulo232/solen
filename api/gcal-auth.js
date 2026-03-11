// solen.ch — Google Calendar OAuth2 authorization flow
// Deployed as a Vercel serverless function at /api/gcal-auth
// Env vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
// Usage:
//   GET /api/gcal-auth?action=authorize&user_id=<uuid> → redirects to Google consent
//   GET /api/gcal-auth?code=<code>&state=<user_id>     → handles OAuth callback

const https = require('https');
const querystring = require('querystring');

const SCOPES = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly';

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
        'Prefer': method === 'POST' ? 'return=representation' : undefined
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

function httpsPost(hostname, path, formData) {
  const postData = querystring.stringify(formData);
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname, path, method: 'POST',
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
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'https://solen.ch/api/gcal-auth';

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Google OAuth credentials not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Vercel env vars.' });
  }

  const action = req.query.action;
  const code = req.query.code;
  const state = req.query.state;

  // Step 1: Redirect user to Google consent screen
  if (action === 'authorize') {
    const userId = req.query.user_id;
    if (!userId) return res.status(400).json({ error: 'Missing user_id' });

    const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + querystring.stringify({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: SCOPES,
      access_type: 'offline',
      prompt: 'consent',
      state: userId
    });
    return res.redirect(302, authUrl);
  }

  // Step 2: Handle OAuth callback
  if (code && state) {
    const userId = state;

    // Exchange code for tokens
    const tokenData = await httpsPost('oauth2.googleapis.com', '/token', {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    });

    if (!tokenData.access_token) {
      return res.status(400).json({ error: 'Token exchange failed', details: tokenData });
    }

    // Store tokens in Supabase
    await supabaseRequest('/rest/v1/calendar_tokens', 'POST', {
      user_id: userId,
      provider: 'google',
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      expires_at: new Date(Date.now() + (tokenData.expires_in || 3600) * 1000).toISOString(),
      scope: SCOPES
    });

    // Redirect back to the app
    return res.redirect(302, 'https://solen.ch/#pageBookings?cal_sync=google_connected');
  }

  return res.status(400).json({ error: 'Invalid request. Use ?action=authorize&user_id=<uuid> to start.' });
};
