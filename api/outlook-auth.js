// solen.ch — Microsoft Outlook Calendar OAuth2 authorization flow
// Deployed as a Vercel serverless function at /api/outlook-auth
// Env vars: MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_REDIRECT_URI
// Usage:
//   GET /api/outlook-auth?action=authorize&user_id=<uuid> → redirects to Microsoft consent
//   GET /api/outlook-auth?code=<code>&state=<user_id>     → handles OAuth callback

const https = require('https');
const querystring = require('querystring');

const SCOPES = 'Calendars.ReadWrite offline_access User.Read';

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
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const redirectUri = process.env.MICROSOFT_REDIRECT_URI || 'https://solen.ch/api/outlook-auth';

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Microsoft OAuth credentials not configured. Set MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET in Vercel env vars.' });
  }

  const action = req.query.action;
  const code = req.query.code;
  const state = req.query.state;

  // Step 1: Redirect user to Microsoft consent screen
  if (action === 'authorize') {
    const userId = req.query.user_id;
    if (!userId) return res.status(400).json({ error: 'Missing user_id' });

    const authUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?' + querystring.stringify({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: SCOPES,
      response_mode: 'query',
      state: userId
    });
    return res.redirect(302, authUrl);
  }

  // Step 2: Handle OAuth callback
  if (code && state) {
    const userId = state;

    // Exchange code for tokens
    const tokenData = await httpsPost('login.microsoftonline.com', '/common/oauth2/v2.0/token', {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      scope: SCOPES
    });

    if (!tokenData.access_token) {
      return res.status(400).json({ error: 'Token exchange failed', details: tokenData });
    }

    // Store tokens in Supabase
    await supabaseRequest('/rest/v1/calendar_tokens', 'POST', {
      user_id: userId,
      provider: 'outlook',
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      expires_at: new Date(Date.now() + (tokenData.expires_in || 3600) * 1000).toISOString(),
      scope: SCOPES
    });

    // Redirect back to the app
    return res.redirect(302, 'https://solen.ch/#pageBookings?cal_sync=outlook_connected');
  }

  return res.status(400).json({ error: 'Invalid request. Use ?action=authorize&user_id=<uuid> to start.' });
};
