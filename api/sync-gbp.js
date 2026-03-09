// api/sync-gbp.js — Google Business Profile auto-sync for solen.ch
// Pushes salon data to GBP when owner registers a new location.
//
// SETUP REQUIRED:
// 1. Create a Google Cloud project, enable Business Profile API
// 2. Create OAuth2 credentials (Web app type)
// 3. Have Sulo (account manager) complete OAuth consent once to get refresh token
// 4. Set Vercel env vars: GBP_CLIENT_ID, GBP_CLIENT_SECRET, GBP_REFRESH_TOKEN, GBP_ACCOUNT_NAME
//    GBP_ACCOUNT_NAME format: "accounts/123456789" (from GBP API accounts.list)
//
// NOTE: GBP API does NOT support service accounts — requires user OAuth2 tokens.

const { google } = require('googleapis');

async function getOAuthClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GBP_CLIENT_ID,
    process.env.GBP_CLIENT_SECRET,
    'https://solen.ch'
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GBP_REFRESH_TOKEN,
  });
  return oauth2Client;
}

function mapCategory(cat) {
  const map = {
    'Friseursalon':   'gcid:hair_salon',
    'Barbershop':     'gcid:barber_shop',
    'Nagelstudio':    'gcid:nail_salon',
    'Kosmetik':       'gcid:beauty_salon',
    'Spa & Wellness': 'gcid:day_spa',
    'Make-up Studio': 'gcid:make_up_artist',
    'Koerperkunst':   'gcid:tattoo_shop',
  };
  return map[cat] || 'gcid:beauty_salon';
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://solen.ch');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.GBP_CLIENT_ID || !process.env.GBP_REFRESH_TOKEN || !process.env.GBP_ACCOUNT_NAME) {
    console.warn('[sync-gbp] Missing env vars — skipping GBP sync');
    return res.status(200).json({ success: false, reason: 'gbp_not_configured' });
  }

  const { name, address, phone, website, description, category } = req.body || {};
  if (!name || !address) {
    return res.status(400).json({ error: 'name and address are required' });
  }

  try {
    const auth = await getOAuthClient();
    const mybusiness = google.mybusinessbusinessinformation({ version: 'v1', auth });

    const locationBody = {
      languageCode: 'de',
      storefrontAddress: {
        addressLines: [address],
        locality: 'Basel',
        postalCode: '4001',
        countryCode: 'CH',
      },
      title: name,
      phoneNumbers: phone ? { primaryPhone: phone } : undefined,
      websiteUri: website || undefined,
      profile: { description: (description || '').slice(0, 750) },
      categories: {
        primaryCategory: { name: mapCategory(category) },
      },
    };

    const response = await mybusiness.accounts.locations.create({
      parent: process.env.GBP_ACCOUNT_NAME,
      requestId: 'solen-' + Date.now(),
      requestBody: locationBody,
    });

    const locationName = response.data.name;
    console.log('[sync-gbp] Created GBP location: ' + locationName + ' for "' + name + '"');
    return res.status(200).json({ success: true, locationName });
  } catch (err) {
    console.error('[sync-gbp] GBP sync failed:', err.message);
    return res.status(200).json({ success: false, error: err.message });
  }
};
