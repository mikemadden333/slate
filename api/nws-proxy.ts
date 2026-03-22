/**
 * NWS Weather Alerts Proxy — Vercel Serverless Function
 * 
 * NEW: Server-side proxy for National Weather Service alerts.
 * 
 * Why proxy? NWS API sometimes blocks client-side requests and
 * requires a proper User-Agent string. This proxy adds retry logic
 * and caching for reliability.
 * 
 * Usage: /api/nws-proxy (returns active alerts for Chicago area)
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const cache: { data: any; ts: number } | null = { data: null, ts: 0 };
const TTL = 5 * 60 * 1000;

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=120');

  if (cache && cache.data && Date.now() - cache.ts < TTL) {
    return res.status(200).json(cache.data);
  }

  // Chicago area: Cook County, IL
  const urls = [
    'https://api.weather.gov/alerts/active?zone=ILZ014',  // Chicago
    'https://api.weather.gov/alerts/active?area=IL',       // fallback: all IL
  ];

  for (const url of urls) {
    for (let i = 0; i < 3; i++) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': '(SlateWatch, safety@slateschools.org)',
            'Accept': 'application/geo+json',
          },
          signal: AbortSignal.timeout(10000),
        });

        if (response.ok) {
          const data = await response.json();
          const alerts = (data.features || []).map((f: any) => ({
            id: f.id,
            event: f.properties?.event,
            headline: f.properties?.headline,
            description: f.properties?.description,
            severity: f.properties?.severity,
            urgency: f.properties?.urgency,
            certainty: f.properties?.certainty,
            effective: f.properties?.effective,
            expires: f.properties?.expires,
            areaDesc: f.properties?.areaDesc,
          }));

          const result = { alerts, count: alerts.length, fetchedAt: new Date().toISOString() };
          cache!.data = result;
          cache!.ts = Date.now();
          return res.status(200).json(result);
        }
      } catch {
        if (i < 2) await new Promise(r => setTimeout(r, 1000));
      }
    }
  }

  return res.status(200).json({ alerts: [], count: 0, error: 'nws_unavailable' });
}
