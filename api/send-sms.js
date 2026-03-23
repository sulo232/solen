// SMS sending via Seven.io (Swiss-friendly EU provider)
// Set SEVEN_API_KEY in Vercel environment variables
// Docs: https://docs.seven.io/en/rest-api/sms

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://solen.ch');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { to, message, from: sender } = req.body || {};

  if (!to || !message) {
    return res.status(400).json({ error: 'Missing required fields: to, message' });
  }

  const apiKey = process.env.SEVEN_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'SMS service not configured' });
  }

  // Normalise recipients – accept string or array
  const recipients = Array.isArray(to) ? to : [to];

  // Seven.io accepts comma-separated numbers
  const toParam = recipients
    .map(n => String(n).replace(/\s/g, ''))
    .join(',');

  try {
    const response = await fetch('https://gateway.seven.io/api/sms', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
        'SentWith': 'Solen.ch',
      },
      body: JSON.stringify({
        to: toParam,
        from: sender || 'Solen.ch',
        text: message,
        unicode: 1,
      }),
    });

    const result = await response.json();

    if (!response.ok || result.success === 'false' || result.success === false) {
      console.error('Seven.io error:', result);
      return res.status(502).json({ error: 'SMS provider error', detail: result });
    }

    return res.status(200).json({
      ok: true,
      sent: recipients.length,
      result,
    });
  } catch (err) {
    console.error('send-sms error:', err);
    return res.status(500).json({ error: err.message });
  }
}
