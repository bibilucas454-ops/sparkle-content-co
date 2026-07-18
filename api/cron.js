export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  const expectedToken = process.env.CRON_SECRET;

  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !anonKey) {
    return res.status(500).json({ error: 'Missing Supabase configuration' });
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/cron-scheduler`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: '{}',
      }
    );

    const data = await response.json();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('[Cron] Error invoking scheduler:', err);
    return res.status(500).json({ error: err.message });
  }
}
