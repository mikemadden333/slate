import type { VercelRequest, VercelResponse } from "@vercel/node";

const FEEDS = [
  { name: "Block Club Chicago", url: "https://blockclubchicago.org/feed/", color: "#B79145" },
  { name: "Chicago Tribune", url: "https://www.chicagotribune.com/arcio/rss/", color: "#6B8CAE" },
  { name: "Chicago Sun-Times", url: "https://chicago.suntimes.com/rss/index.xml", color: "#7A9E7E" },
];

const KEYWORDS = [
  "chicago", "south side", "west side", "loop", "englewood", "woodlawn",
  "auburn gresham", "roseland", "chatham", "austin", "lawndale",
  "garfield park", "humboldt park", "charter", "cps", "school",
  "student", "education", "shooting", "crime", "arrest", "fire",
  "police", "violence", "weather",
];

function parseItems(xml: string, name: string, color: string) {
  const items: { title: string; link: string; pubDate: string; source: string; sourceColor: string }[] = [];
  const itemMatches = xml.matchAll(/<item[\s\S]*?<\/item>/g);
  for (const match of itemMatches) {
    const block = match[0];
    const title = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/)?.[1] ?? "";
    const link = block.match(/<link>(.*?)<\/link>/)?.[1] ?? "";
    const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? "";
    if (title && link) items.push({ title: title.trim(), link: link.trim(), pubDate, source: name, sourceColor: color });
  }
  return items;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    const results = await Promise.allSettled(
      FEEDS.map(async (feed) => {
        const r = await fetch(feed.url, { headers: { "User-Agent": "Mozilla/5.0" } });
        const xml = await r.text();
        return parseItems(xml, feed.name, feed.color);
      })
    );

    let all: typeof results[0] extends PromiseFulfilledResult<infer T> ? T : never = [];
    results.forEach((r) => { if (r.status === "fulfilled") all = [...all, ...r.value]; });

    const filtered = all.filter(i => KEYWORDS.some(kw => i.title.toLowerCase().includes(kw)));
    const final = (filtered.length > 0 ? filtered : all)
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      .slice(0, 6);

    res.json({ items: final });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
