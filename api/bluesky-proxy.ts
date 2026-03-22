/**
 * Bluesky Feed Proxy — Vercel Serverless Function
 * 
 * NEW: Proxies CWB Chicago's Bluesky feed for real-time crime reporting.
 * CWB Chicago posts crime reports to Bluesky faster than any other source.
 * 
 * Usage: /api/bluesky-proxy?handle=cwbchicago.com&limit=50
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const cache: Record<string, { data: any; ts: number }> = {};
const TTL = 3 * 60 * 1000; // 3 minutes

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60');

  const handle = (req.query.handle as string) || 'cwbchicago.com';
  const limit = Math.min(Number(req.query.limit) || 50, 100);

  const key = `bsky_${handle}_${limit}`;
  const hit = cache[key];
  if (hit && Date.now() - hit.ts < TTL) return res.status(200).json(hit.data);

  try {
    const url = `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${handle}&limit=${limit}`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) throw new Error(`Bluesky returned ${response.status}`);

    const raw = await response.json();
    const posts = (raw.feed || []).map((item: any) => ({
      text: item.post?.record?.text || '',
      createdAt: item.post?.record?.createdAt || '',
      uri: item.post?.uri || '',
      cid: item.post?.cid || '',
      author: item.post?.author?.handle || handle,
      likeCount: item.post?.likeCount || 0,
      repostCount: item.post?.repostCount || 0,
    }));

    const data = { posts, count: posts.length, fetchedAt: new Date().toISOString() };
    cache[key] = { data, ts: Date.now() };
    return res.status(200).json(data);
  } catch {
    return res.status(200).json({ posts: [], count: 0, error: 'bluesky_unavailable' });
  }
}
