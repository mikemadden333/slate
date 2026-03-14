// LocalNewsBlock.tsx
// Drop into your Briefing page component. Fetches RSS via CORS proxy.
// Refreshes every 3 minutes. Filters by Chicago campus neighborhood keywords.
// No API key required. Zero cost for demo.

import { useEffect, useState, useCallback } from "react";

const CAMPUS_KEYWORDS = [
  "chicago", "south side", "west side", "loop",
  "englewood", "woodlawn", "auburn gresham", "roseland",
  "chatham", "austin", "lawndale", "garfield park", "humboldt park",
  "charter", "cps", "school", "student", "education",
  "shooting", "crime", "arrest", "fire", "protest",
  "police", "violence", "weather", "traffic",
];

const RSS_FEEDS = [
  {
    name: "Block Club Chicago",
    url: "https://blockclubchicago.org/feed/",
    color: "#B79145",
  },
  {
    name: "Chicago Tribune",
    url: "https://www.chicagotribune.com/arcio/rss/",
    color: "#6B8CAE",
  },
  {
    name: "Chicago Sun-Times",
    url: "https://chicago.suntimes.com/rss/index.xml",
    color: "#7A9E7E",
  },
];

const CORS_PROXY = "https://api.allorigins.win/get?url=";
const REFRESH_INTERVAL = 3 * 60 * 1000; // 3 minutes
const MAX_ITEMS = 6;

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  sourceColor: string;
}

function parseRSS(xmlText: string, sourceName: string, sourceColor: string): NewsItem[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "text/xml");
  const items = Array.from(doc.querySelectorAll("item"));

  const all = items.map((item) => ({
    title: item.querySelector("title")?.textContent?.trim() ?? "",
    link: item.querySelector("link")?.textContent?.trim() ?? "",
    pubDate: item.querySelector("pubDate")?.textContent?.trim() ?? "",
    source: sourceName,
    sourceColor,
  })).filter((item) => item.title && item.link);

  const filtered = all.filter((item) => {
    const lower = item.title.toLowerCase();
    return CAMPUS_KEYWORDS.some((kw) => lower.includes(kw));
  });

  return filtered.length > 0 ? filtered : all.slice(0, 3);
}

function timeAgo(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const diff = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diff < 1) return "just now";
    if (diff < 60) return `${diff}m ago`;
    const hrs = Math.floor(diff / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch {
    return "";
  }
}

export default function LocalNewsBlock() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [error, setError] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const results = await Promise.allSettled(
        RSS_FEEDS.map(async (feed) => {
          const res = await fetch(
            `${CORS_PROXY}${encodeURIComponent(feed.url)}`
          );
          const json = await res.json();
          return parseRSS(json.contents, feed.name, feed.color);
        })
      );

      const all: NewsItem[] = [];
      results.forEach((r) => {
        if (r.status === "fulfilled") all.push(...r.value);
      });

      // Sort by pubDate descending, take top MAX_ITEMS
      const sorted = all
        .filter((i) => i.title && i.link)
        .sort(
          (a, b) =>
            new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
        )
        .slice(0, MAX_ITEMS);

      setItems(sorted);
      setLastRefresh(new Date());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchAll]);

  return (
    <div
      style={{
        background: "#1A1C1F",
        borderRadius: "12px",
        padding: "24px",
        marginTop: "24px",
        fontFamily: "inherit",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.1em",
              color: "#B79145",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}
          >
            Local Intelligence
          </div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: "#F7F5F1" }}>
            Chicago News
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          {lastRefresh && (
            <div style={{ fontSize: "11px", color: "#666", marginBottom: "6px" }}>
              Updated {lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          )}
          <button
            onClick={fetchAll}
            style={{
              fontSize: "11px",
              color: "#B79145",
              background: "transparent",
              border: "1px solid #B79145",
              borderRadius: "6px",
              padding: "4px 10px",
              cursor: "pointer",
              letterSpacing: "0.05em",
            }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Feed source pills */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        {RSS_FEEDS.map((f) => (
          <span
            key={f.name}
            style={{
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.06em",
              color: f.color,
              background: `${f.color}18`,
              border: `1px solid ${f.color}40`,
              borderRadius: "20px",
              padding: "3px 10px",
            }}
          >
            {f.name.toUpperCase()}
          </span>
        ))}
      </div>

      {/* States */}
      {loading && (
        <div style={{ color: "#555", fontSize: "13px", padding: "16px 0" }}>
          Loading headlines...
        </div>
      )}

      {error && !loading && (
        <div style={{ color: "#E05A5A", fontSize: "13px", padding: "16px 0" }}>
          Could not load feeds. Check connection or CORS proxy availability.
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div style={{ color: "#555", fontSize: "13px", padding: "16px 0" }}>
          No neighborhood-relevant stories in the last cycle.
        </div>
      )}

      {/* Headlines */}
      {!loading && items.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {items.map((item, i) => (
            <a
              key={i}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "14px",
                padding: "14px 0",
                borderBottom:
                  i < items.length - 1 ? "1px solid #2A2C2F" : "none",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              {/* Source dot */}
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: item.sourceColor,
                  marginTop: "5px",
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#F7F5F1",
                    lineHeight: "1.4",
                    marginBottom: "5px",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    ((e.target as HTMLElement).style.color = "#B79145")
                  }
                  onMouseLeave={(e) =>
                    ((e.target as HTMLElement).style.color = "#F7F5F1")
                  }
                >
                  {item.title}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    fontSize: "11px",
                    color: "#555",
                  }}
                >
                  <span style={{ color: item.sourceColor, fontWeight: 600 }}>
                    {item.source}
                  </span>
                  <span>{timeAgo(item.pubDate)}</span>
                </div>
              </div>
              <div style={{ color: "#444", fontSize: "14px", flexShrink: 0, marginTop: "2px" }}>
                ↗
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          marginTop: "16px",
          paddingTop: "12px",
          borderTop: "1px solid #2A2C2F",
          fontSize: "10px",
          color: "#444",
          letterSpacing: "0.05em",
        }}
      >
        FILTERED BY CAMPUS NEIGHBORHOODS · AUTO-REFRESHES EVERY 3 MIN
      </div>
    </div>
  );
}
