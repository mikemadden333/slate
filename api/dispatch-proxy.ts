/**
 * CPD 911 Dispatch Proxy — Vercel Serverless Function
 * 
 * NEW: Fetches real-time CPD 911 dispatch/call data from Chicago Data Portal.
 * 
 * This is DIFFERENT from CPD crime data (which lags 7-10 days).
 * Dispatch data is near-real-time (minutes to hours old) and shows
 * what officers are responding to RIGHT NOW.
 * 
 * Great supplement to OpenMHz scanner — gives structured dispatch data
 * with call types, locations, and districts.
 * 
 * Usage: /api/dispatch-proxy?hours=6
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const cache: Record<string, { data: any; ts: number }> = {};
const TTL = 3 * 60 * 1000; // 3 minutes (dispatch is time-sensitive)

// Priority dispatch types that matter for school safety
const PRIORITY_TYPES = [
  'SHOOTING', 'PERSON SHOT', 'PERSON WITH A GUN', 'SHOTS FIRED',
  'BATTERY IN PROGRESS', 'ASSAULT', 'ROBBERY', 'STABBING',
  'DOMESTIC BATTERY', 'PERSON WITH A KNIFE', 'HOMICIDE',
  'SUSPICIOUS PERSON', 'FIGHT', 'GANG DISTURBANCE',
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
  throw new Error('Dispatch fetch failed');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60');

  const hours = Math.min(Number(req.query.hours) || 6, 48);

  const key = `dispatch_${hours}`;
  const hit = cache[key];
  if (hit && Date.now() - hit.ts < TTL) return res.status(200).json(hit.data);

  try {
    const since = new Date(Date.now() - hours * 3600000).toISOString();
    const url = `https://data.cityofchicago.org/resource/n9g2-c7vt.json`
      + `?$where=${encodeURIComponent(`entry_datetime>'${since}'`)}`
      + `&$order=entry_datetime DESC`
      + `&$limit=500`;

    const rows = await fetchWithRetry(url);

    const dispatches = rows.map((r: any) => {
      const type = (r.initial_type_description || r.initial_type || '').toUpperCase();
      const isPriority = PRIORITY_TYPES.some(pt => type.includes(pt));
      return {
        id: r.event_no || r._id,
        time: r.entry_datetime,
        type: r.initial_type_description || r.initial_type || 'Unknown',
        typeCode: r.initial_type || '',
        block: r.block || '',
        district: r.district || '',
        beat: r.beat || '',
        priority: r.priority || '',
        isPriority,
        status: r.current_disposition || '',
      };
    });

    const priorityCount = dispatches.filter((d: any) => d.isPriority).length;

    const data = {
      dispatches,
      count: dispatches.length,
      priorityCount,
      hours,
      mostRecent: dispatches[0]?.time || null,
      fetchedAt: new Date().toISOString(),
    };

    cache[key] = { data, ts: Date.now() };
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(200).json({
      dispatches: [],
      count: 0,
      priorityCount: 0,
      error: 'fetch_failed',
      message: err.message,
    });
  }
}
