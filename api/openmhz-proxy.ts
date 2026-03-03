import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60');

  const since = Number(req.query.since) || (Date.now() - 2 * 60 * 60 * 1000);
  const url = `https://api.openmhz.com/chi_cpd/calls/newer?time=${since}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.error('OpenMHz proxy error:', response.status);
      return res.status(200).json({ calls: [], error: `upstream_${response.status}` });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error('OpenMHz proxy fetch failed:', err);
    return res.status(200).json({ calls: [], error: 'fetch_failed' });
  }
}