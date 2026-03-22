/**
 * CWB Chicago RSS Proxy — Vercel Serverless Function
 * 
 * NEW: Proxies CWB Chicago (CrimeIsDown) RSS feed which blocks
 * many User-Agents with Cloudflare 403.
 * 
 * Uses a browser-like UA and retry logic to get through.
 * Falls back to CWB Bluesky feed if RSS fails.
 * 
 * Usage: /api/cwb-proxy (returns RSS XML or Bluesky posts)
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const cache: { data: any; ts: number } = { data: null, ts: 0 };
const TTL = 10 * 60 * 1000;

const USER_AGENTS = [
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

async function fetchCWBRSS(): Promise<string | null> {
  for (const ua of USER_AGENTS) {
    for (let i = 0; i < 2; i++) {
      try {
        const res = await fetch('https://cwbchicago.com/feed', {
          headers: {
            'User-Agent': ua,
            'Accept': 'application/rss+xml, application/xml, text/xml, */*',
          },
          signal: AbortSignal.timeout(12000),
        });
        if (res.ok) {
          const text = await res.text();
          if (text.includes('<rss') || text.includes('<feed')) return text;
        }
      } catch { /* retry */ }
    }
  }
  return null;
}

async function fetchCWBBluesky(): Promise<any[]> {
  try {
    // CWB Chicago's Bluesky handle
    const res = await fetch(
      'https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=cwbchicago.com&limit=30',
      {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.feed || []).map((item: any) => ({
      text: item.post?.record?.text || '',
      createdAt: item.post?.record?.createdAt || '',
      uri: item.post?.uri || '',
      author: item.post?.author?.handle || 'cwbchicago.com',
    }));
  } catch {
    return [];
  }
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300');

  if (cache.data && Date.now() - cache.ts < TTL) {
    return res.status(200).json(cache.data);
  }

  // Try RSS first
  const rss = await fetchCWBRSS();
  if (rss) {
    const data = { source: 'rss', xml: rss, fetchedAt: new Date().toISOString() };
    cache.data = data;
    cache.ts = Date.now();
    return res.status(200).json(data);
  }

  // Fallback to Bluesky
  const posts = await fetchCWBBluesky();
  const data = {
    source: 'bluesky',
    posts,
    count: posts.length,
    fetchedAt: new Date().toISOString(),
    note: 'CWB RSS blocked, using Bluesky feed',
  };
  cache.data = data;
  cache.ts = Date.now();
  return res.status(200).json(data);
}
