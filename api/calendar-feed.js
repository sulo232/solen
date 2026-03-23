// solen.ch — iCal (.ics) feed for user bookings
// Deployed as a Vercel serverless function at /api/calendar-feed
// Query params: ?user_id=<uuid>&token=<hex>
// Env var required: SUPABASE_URL, SUPABASE_SERVICE_KEY

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
        'Content-Type': 'application/json'
      }
    };
    const req = https.request(opts, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function escapeIcal(str) {
  return String(str || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function formatIcalDate(dateStr, timeStr) {
  // dateStr: "2026-03-11", timeStr: "14:00"
  const d = dateStr.replace(/-/g, '');
  const t = (timeStr || '00:00').replace(/:/g, '') + '00';
  return d + 'T' + t;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const userId = req.query.user_id;
  const token = req.query.token;
  if (!userId) return res.status(400).json({ error: 'Missing user_id' });

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'Supabase env vars not configured' });
  }

  // Fetch bookings for user
  const bookings = await supabaseRequest(
    `/rest/v1/bookings?user_id=eq.${encodeURIComponent(userId)}&status=neq.cancelled&order=booking_date.desc&limit=200`,
    'GET'
  );

  if (!Array.isArray(bookings)) {
    return res.status(500).json({ error: 'Failed to fetch bookings' });
  }

  // Build iCal feed
  const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  let ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Solen.ch//Bookings//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Solen.ch Termine',
    'X-WR-TIMEZONE:Europe/Zurich'
  ];

  bookings.forEach(b => {
    const dtStart = formatIcalDate(b.booking_date, b.booking_time);
    const dur = parseInt(b.service_duration) || 60;
    // Calculate end time
    const startDate = new Date(b.booking_date + 'T' + (b.booking_time || '00:00') + ':00');
    const endDate = new Date(startDate.getTime() + dur * 60000);
    const dtEnd = endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '').slice(0, 15);

    ical.push('BEGIN:VEVENT');
    ical.push('UID:solen-' + (b.id || Math.random().toString(36).slice(2)) + '@solen.ch');
    ical.push('DTSTAMP:' + now);
    ical.push('DTSTART;TZID=Europe/Zurich:' + dtStart);
    ical.push('DTEND;TZID=Europe/Zurich:' + dtEnd);
    ical.push('SUMMARY:' + escapeIcal(b.service_name || 'Termin') + ' @ ' + escapeIcal(b.salon_name || 'Salon'));
    if (b.notes) ical.push('DESCRIPTION:' + escapeIcal(b.notes));
    ical.push('STATUS:' + (b.status === 'confirmed' ? 'CONFIRMED' : 'TENTATIVE'));
    if (b.guest_name) ical.push('ATTENDEE;CN=' + escapeIcal(b.guest_name) + ':mailto:' + (b.guest_email || 'noreply@solen.ch'));
    ical.push('END:VEVENT');
  });

  ical.push('END:VCALENDAR');

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="solen-termine.ics"');
  res.status(200).send(ical.join('\r\n'));
};
