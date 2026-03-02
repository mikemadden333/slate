import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60');

  const { lat, lng, radius = '2.0' } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

  const delta = Number(radius) / 69;
  const latN = Number(lat);
  const lngN = Number(lng);

  const url = `https://citizen.com/api/v2/incidents` +
    `?insideBoundingBox[0]=${latN + delta}` +
    `&insideBoundingBox[1]=${lngN - delta}` +
    `&insideBoundingBox[2]=${latN - delta}` +
    `&insideBoundingBox[3]=${lngN + delta}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://citizen.com/',
        'Origin': 'https://citizen.com',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return res.status(200).json({ results: [], error: 'upstream_failed' });
    const data = await response.json();
    return res.status(200).json(data);
  } catch {
    return res.status(200).json({ results: [], error: 'fetch_failed' });
  }
}
