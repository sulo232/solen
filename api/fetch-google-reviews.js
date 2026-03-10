// api/fetch-google-reviews.js — Pull Google reviews for a salon via Places API
// and upsert them into Supabase so they appear alongside manual reviews.
//
// SETUP REQUIRED:
// 1. Enable "Places API (New)" in Google Cloud Console
// 2. Create an API key restricted to this API
// 3. Set Vercel env vars:
//    GOOGLE_PLACES_API_KEY  — your Places API key
//    SUPABASE_URL           — your project URL
//    SUPABASE_SERVICE_KEY   — service-role key (bypasses RLS)
//
// Called from the frontend after a salon page opens (if google_place_id is set).

const { createClient } = require('@supabase/supabase-js');

const PLACES_BASE = 'https://places.googleapis.com/v1';

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://solen.ch');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.GOOGLE_PLACES_API_KEY || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.warn('[fetch-google-reviews] Missing env vars — skipping Google review sync');
    return res.status(200).json({ success: false, reason: 'not_configured' });
  }

  const { storeId, placeId } = req.body || {};
  if (!storeId || !placeId) {
    return res.status(400).json({ error: 'storeId and placeId are required' });
  }

  try {
    // Fetch reviews from Google Places API (New)
    const placeUrl = `${PLACES_BASE}/places/${placeId}?fields=reviews&languageCode=de`;
    const placeRes = await fetch(placeUrl, {
      headers: {
        'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'reviews',
      },
    });

    if (!placeRes.ok) {
      const errText = await placeRes.text();
      console.error('[fetch-google-reviews] Places API error:', errText);
      return res.status(200).json({ success: false, reason: 'places_api_error', detail: errText });
    }

    const placeData = await placeRes.json();
    const reviews = placeData.reviews || [];

    if (!reviews.length) {
      return res.status(200).json({ success: true, imported: 0 });
    }

    const supabase = getSupabase();

    // Upsert each review (skip if already imported via google_review_id)
    const rows = reviews.map(r => ({
      salon_id: storeId,
      reviewer_name: r.authorAttribution?.displayName || 'Google Nutzer',
      rating: Math.round(r.rating || 3),
      comment: r.text?.text || '',
      source: 'google',
      google_review_id: r.name, // e.g. "places/ChIJ.../reviews/..."
      created_at: r.publishTime || new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('reviews')
      .upsert(rows, { onConflict: 'google_review_id', ignoreDuplicates: true });

    if (error) {
      console.error('[fetch-google-reviews] Supabase upsert error:', error.message);
      return res.status(200).json({ success: false, reason: 'db_error', detail: error.message });
    }

    console.log(`[fetch-google-reviews] Imported ${rows.length} Google reviews for store ${storeId}`);
    return res.status(200).json({ success: true, imported: rows.length });
  } catch (err) {
    console.error('[fetch-google-reviews] Unexpected error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};
