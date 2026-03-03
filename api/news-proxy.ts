import type { VercelRequest, VercelResponse } from '@vercel/node';
const NEWS_FEEDS = [
  { name: 'Block Club Chicago', url: 'https://blockclubchicago.org/feed/', priority: 1 },
  { name: 'ABC7 Chicago',       url: 'https://abc7chicago.com/feed/', priority: 1 },
  { name: 'NBC5 Chicago',       url: 'https://www.nbcchicago.com/?rss=y', priority: 1 },
  { name: 'CBS Chicago',        url: 'https://www.cbsnews.com/chicago/latest/rss/main', priority: 1 },
  { name: 'Chicago Sun-Times',  url: 'https://chicago.suntimes.com/rss/index.xml', priority: 2 },
  { name: 'WGN TV',             url: 'https://wgntv.com/feed/', priority: 2 },
  { name: 'WBEZ',               url: 'https://www.wbez.org/rss', priority: 3 },
  { name: 'Chalkbeat Chicago',  url: 'https://www.chalkbeat.org/chicago/feed/', priority: 2 },
  { name: 'Fox 32 Chicago',     url: 'https://www.fox32chicago.com/rss/category/news', priority: 2 },
  { name: 'Chicago Tribune',    url: 'https://www.chicagotribune.com/arcio/rss/', priority: 1 },
  { name: 'Reddit r/chicago',        url: 'https://www.reddit.com/r/chicago/new/.rss', priority: 3 },
  { name: 'Reddit r/CrimeInChicago', url: 'https://www.reddit.com/r/CrimeInChicago/new/.rss', priority: 2 },
];
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300');
  const results = await Promise.allSettled(
    NEWS_FEEDS.map(async feed => {
      const response = await fetch(feed.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; PULSE/2.0; +https://nobleschools.org)',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        },
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error(`${response.status}`);
      const xml = await response.text();
      return { name: feed.name, url: feed.url, priority: feed.priority, xml, ok: true };
    })
  );
  const feeds = results.map((r, i) => ({
    name: NEWS_FEEDS[i].name,
    priority: NEWS_FEEDS[i].priority,
    ok: r.status === 'fulfilled',
    xml: r.status === 'fulfilled' ? r.value.xml : '',
    error: r.status === 'rejected' ? String(r.reason) : null,
  }));
  return res.status(200).json({ feeds, timestamp: new Date().toISOString() });
}