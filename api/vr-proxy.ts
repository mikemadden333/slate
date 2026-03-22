/**
 * Violence Reduction Data Proxy — Vercel Serverless Function
 * 
 * NEW: Server-side proxy for Chicago Violence Reduction data from Socrata.
 * 
 * This dataset tracks violence reduction program incidents and is more
 * current than CPD crime data (often same-day vs 7-10 day lag).
 * 
 * Usage: /api/vr-proxy?days=30
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const cache: Record<string, { data: any; ts: number }> = {};
const TTL = 10 * 60 * 1000;

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
  throw new Error('Socrata VR fetch failed after retries');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300');

  const days = Math.min(Number(req.query.days) || 30, 90);

  const key = `vr_${days}`;
  const hit = cache[key];
  if (hit && Date.now() - hit.ts < TTL) return res.status(200).json(hit.data);

  try {
    const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
    const url = `https://data.cityofchicago.org/resource/gumc-mgzr.json`
      + `?$where=${encodeURIComponent(`date>'${since}T00:00:00.000'`)}`
      + `&$order=date DESC`
      + `&$limit=5000`;

    const rows = await fetchWithRetry(url);

    const data = {
      incidents: rows,
      count: rows.length,
      days,
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
