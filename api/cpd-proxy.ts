/**
 * CPD Crime Data Proxy — Vercel Serverless Function
 * 
 * NEW: Server-side proxy for Chicago Data Portal (Socrata) CPD crime data.
 * 
 * Why proxy instead of direct client fetch?
 * 1. Retry logic — Socrata is flaky, drops connections
 * 2. Caching — 10-min cache prevents hammering the API
 * 3. Larger window — CPD data lags 7-10 days, so we fetch 30 days by default
 * 4. Pre-filtering — Only returns violent crimes to reduce payload size
 * 
 * Usage: /api/cpd-proxy?days=30&limit=5000
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const cache: Record<string, { data: any; ts: number }> = {};
const TTL = 10 * 60 * 1000; // 10 minutes

const VIOLENT_TYPES = [
  'HOMICIDE', 'ASSAULT', 'BATTERY', 'ROBBERY', 'CRIM SEXUAL ASSAULT',
  'CRIMINAL SEXUAL ASSAULT', 'WEAPONS VIOLATION', 'KIDNAPPING',
  'HUMAN TRAFFICKING', 'INTIMIDATION', 'ARSON',
];

async function fetchWithRetry(url: string, retries = 3): Promise<any> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(20000),
      });
      if (res.ok) return res.json();
      if (i < retries) await new Promise(r => setTimeout(r, 2000));
    } catch {
      if (i < retries) await new Promise(r => setTimeout(r, 2000));
    }
  }
  throw new Error('Socrata fetch failed after retries');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300');

  const days = Math.min(Number(req.query.days) || 30, 90);
  const limit = Math.min(Number(req.query.limit) || 5000, 10000);
  const violentOnly = req.query.violent !== 'false';

  const key = `cpd_${days}_${limit}_${violentOnly}`;
  const hit = cache[key];
  if (hit && Date.now() - hit.ts < TTL) return res.status(200).json(hit.data);

  try {
    const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
    
    let whereClause = `date>'${since}T00:00:00.000'`;
    if (violentOnly) {
      const typeFilter = VIOLENT_TYPES.map(t => `primary_type='${t}'`).join(' OR ');
      whereClause += ` AND (${typeFilter})`;
    }

    // Build URL manually to avoid $ encoding issues with URLSearchParams
    const url = `https://data.cityofchicago.org/resource/ijzp-q8t2.json`
      + `?$where=${encodeURIComponent(whereClause)}`
      + `&$order=date DESC`
      + `&$limit=${limit}`;

    const rows = await fetchWithRetry(url);

    const data = {
      incidents: rows,
      count: rows.length,
      days,
      violentOnly,
      mostRecent: rows[0]?.date || null,
      fetchedAt: new Date().toISOString(),
    };

    cache[key] = { data, ts: Date.now() };
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(200).json({
      incidents: [],
      count: 0,
      error: 'fetch_failed',
      message: err.message,
    });
  }
}
