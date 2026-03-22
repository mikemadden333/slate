/**
 * NetworkNews — Slate Watch · "The Wire"
 *
 * Newspaper-style intelligence wire. Two-column editorial layout.
 *
 * Layout:
 *   Header: "THE WIRE" + source count + last update
 *   Left (65%): Priority stories sorted by campus proximity
 *   Right (35%): AI Analysis + Source breakdown + Trending areas
 *
 * Props match the existing NewsView interface:
 *   newsItems={newsItems}
 *   campusName={selectedCampus.short}
 *
 * Drop-in replacement — no SentinelApp.tsx changes needed.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { CAMPUSES } from '../../sentinel-data/campuses';
import { haversine } from '../../sentinel-engine/geo';

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface NewsItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  description?: string;
  lat?: number;
  lng?: number;
  communityArea?: string;
}

interface Props {
  newsItems: NewsItem[];
  campusName: string;
}

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const C = {
  cream:   '#FAF8F5',
  cream2:  '#F3F0EA',
  white:   '#FFFFFF',
  deep:    '#1A1A1A',
  rock:    '#2D2D2D',
  mid:     '#6B7280',
  light:   '#9CA3AF',
  chalk:   '#E5E1D8',
  brass:   '#B79145',
  watch:   '#C0392B',
  section: '#C0392B',
  ice:     '#7C3AED',
  green:   '#16A34A',
  red:     '#DC2626',
  amber:   '#D97706',
  blue:    '#3B82F6',
};

const FONT = {
  heading: "'Playfair Display', Georgia, serif",
  body:    "'Inter', system-ui, sans-serif",
  mono:    "'JetBrains Mono', 'SF Mono', monospace",
};

const SAFETY_KEYWORDS = /shoot|shot|gun|murder|homicide|kill|stab|assault|attack|carjack|kidnap|sexual|rape|robbery|armed|weapon|victim|dead|death|fatal|violence|violent|crime|arrest|suspect|police|fire|blaze|arson/i;
const VIOLENT_KEYWORDS = /shoot|shot|gun|murder|homicide|kill|stab|sexual|rape|kidnap/i;

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 800, letterSpacing: '0.14em',
      textTransform: 'uppercase', color: C.section,
      fontFamily: FONT.body, marginBottom: 6,
    }}>
      {children}
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function nearestCampusInfo(lat?: number, lng?: number): { name: string; dist: number } | null {
  if (lat == null || lng == null) return null;
  let best = { name: '', dist: Infinity };
  for (const c of CAMPUSES) {
    const d = haversine(c.lat, c.lng, lat, lng);
    if (d < best.dist) best = { name: c.short, dist: d };
  }
  return best.dist < 10 ? best : null;
}

function proximityColor(dist: number): string {
  if (dist <= 0.5) return C.red;
  if (dist <= 1.0) return C.amber;
  if (dist <= 2.0) return C.brass;
  return C.mid;
}

// ─── AI ANALYSIS HOOK ────────────────────────────────────────────────────────

function useNewsAnalysis(newsItems: NewsItem[]) {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const generate = useCallback(async () => {
    setLoading(true);
    try {
      const nearCampus = newsItems.filter(item => {
        const info = nearestCampusInfo(item.lat, item.lng);
        return info && info.dist <= 2.0;
      });

      const sources = [...new Set(newsItems.map(n => n.source))];
      const areas = newsItems.reduce((acc, n) => {
        if (n.communityArea) acc[n.communityArea] = (acc[n.communityArea] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const topAreas = Object.entries(areas).sort((a, b) => b[1] - a[1]).slice(0, 5);

      const violentStories = newsItems.filter(n => VIOLENT_KEYWORDS.test(n.title));

      const prompt = `You are Slate Watch's news intelligence analyst. Summarize today's Chicago news landscape for a school network CEO in 3-4 sentences.

Context:
- ${newsItems.length} total stories from ${sources.length} sources
- ${nearCampus.length} stories mention areas near our ${CAMPUSES.length} campuses
- ${violentStories.length} stories involve violent crime
- Top areas: ${topAreas.map(([a, c]) => `${a} (${c})`).join(', ')}
- Recent headlines: ${newsItems.slice(0, 8).map(n => n.title).join(' | ')}

Focus on: What should a school CEO know from today's news? Any patterns? Any areas of concern near campuses? Be specific and concise. No bullet points.`;

      const res = await fetch('/api/anthropic-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 250,
          system: prompt,
          messages: [{ role: 'user', content: 'Analyze the news landscape.' }],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.content?.[0]?.text ?? '';
        if (text) { setAnalysis(text); setLoading(false); return; }
      }

      // Fallback
      setAnalysis(`${newsItems.length} stories tracked across ${sources.length} Chicago news sources. ${nearCampus.length} stories reference areas within 2 miles of campuses. ${violentStories.length > 0 ? `${violentStories.length} involve violent crime — review the priority stories below.` : 'No violent crime stories near campuses at this time.'}`);
    } catch {
      setAnalysis('News analysis temporarily unavailable.');
    }
    setLoading(false);
  }, [newsItems.length]);

  useEffect(() => { generate(); }, [generate]);

  return { analysis, loading };
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export default function NetworkNews({ newsItems, campusName }: Props) {
  const [filter, setFilter] = useState<'all' | 'near' | 'violent'>('all');
  const { analysis, loading: analysisLoading } = useNewsAnalysis(newsItems);

  // Enrich news items with campus proximity
  const enriched = useMemo(() => {
    return newsItems.map(item => {
      const info = nearestCampusInfo(item.lat, item.lng);
      const isViolent = VIOLENT_KEYWORDS.test(item.title) || VIOLENT_KEYWORDS.test(item.description || '');
      const isSafety = SAFETY_KEYWORDS.test(item.title) || SAFETY_KEYWORDS.test(item.description || '');
      return { ...item, nearestCampus: info, isViolent, isSafety };
    }).sort((a, b) => {
      // Sort: near campus first, then violent, then by time
      const aDist = a.nearestCampus?.dist ?? 99;
      const bDist = b.nearestCampus?.dist ?? 99;
      const aScore = (aDist <= 1 ? 100 : aDist <= 2 ? 50 : 0) + (a.isViolent ? 30 : 0);
      const bScore = (bDist <= 1 ? 100 : bDist <= 2 ? 50 : 0) + (b.isViolent ? 30 : 0);
      if (aScore !== bScore) return bScore - aScore;
      return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
    });
  }, [newsItems]);

  // Apply filter
  const filtered = useMemo(() => {
    if (filter === 'near') return enriched.filter(n => n.nearestCampus && n.nearestCampus.dist <= 2.0);
    if (filter === 'violent') return enriched.filter(n => n.isViolent);
    return enriched;
  }, [enriched, filter]);

  // Source breakdown
  const sourceBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    newsItems.forEach(n => { counts[n.source] = (counts[n.source] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [newsItems]);

  // Trending areas
  const trendingAreas = useMemo(() => {
    const counts: Record<string, number> = {};
    newsItems.forEach(n => {
      if (n.communityArea) counts[n.communityArea] = (counts[n.communityArea] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([area, count]) => {
      const hasCampus = CAMPUSES.some(c => c.communityArea.toLowerCase() === area.toLowerCase());
      return { area, count, hasCampus };
    });
  }, [newsItems]);

  const nearCampusCount = enriched.filter(n => n.nearestCampus && n.nearestCampus.dist <= 2.0).length;
  const uniqueSources = [...new Set(newsItems.map(n => n.source))].length;

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', fontFamily: FONT.body }}>

      {/* ═══ HEADER ═══ */}
      <SectionLabel>NEWS INTELLIGENCE</SectionLabel>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
        <h1 style={{
          fontFamily: FONT.heading, fontSize: 36, fontWeight: 900,
          color: C.deep, margin: 0, lineHeight: 1.15,
          letterSpacing: '-0.02em',
        }}>
          The Wire
        </h1>
        <div style={{
          fontSize: 12, color: C.mid, fontFamily: FONT.mono,
          textAlign: 'right',
        }}>
          {newsItems.length} stories · {uniqueSources} sources
        </div>
      </div>
      <div style={{
        fontSize: 14, color: C.mid, marginBottom: 20,
        fontFamily: FONT.body,
      }}>
        Chicago safety intelligence from {uniqueSources} news sources, updated every 5 minutes
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[
          { key: 'all' as const, label: `All Stories (${newsItems.length})` },
          { key: 'near' as const, label: `Near Campuses (${nearCampusCount})` },
          { key: 'violent' as const, label: `Violent Crime (${enriched.filter(n => n.isViolent).length})` },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            border: `1px solid ${filter === f.key ? C.deep : C.chalk}`,
            background: filter === f.key ? C.deep : C.white,
            color: filter === f.key ? C.white : C.mid,
            cursor: 'pointer', fontFamily: FONT.body,
          }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* ═══ TWO-COLUMN LAYOUT ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>

        {/* LEFT: Priority Stories */}
        <div>
          {filtered.length === 0 ? (
            <div style={{
              padding: '40px 0', textAlign: 'center',
              fontSize: 14, color: C.mid,
            }}>
              No stories match the current filter.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {filtered.slice(0, 30).map((item, i) => {
                const isClose = item.nearestCampus && item.nearestCampus.dist <= 0.5;
                return (
                  <div key={i} style={{
                    padding: '18px 0',
                    borderBottom: `1px solid ${C.chalk}`,
                    borderLeft: isClose ? `3px solid ${C.red}` : item.isViolent ? `3px solid ${C.amber}` : 'none',
                    paddingLeft: isClose || item.isViolent ? 16 : 0,
                  }}>
                    {/* Proximity + type badges */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                      {item.nearestCampus && item.nearestCampus.dist <= 2.0 && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                          background: proximityColor(item.nearestCampus.dist) + '15',
                          color: proximityColor(item.nearestCampus.dist),
                        }}>
                          NEAR {item.nearestCampus.name.toUpperCase()}
                        </span>
                      )}
                      {item.isViolent && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                          background: C.red + '12', color: C.red,
                        }}>BREAKING</span>
                      )}
                      {item.communityArea && (
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                          background: C.cream2, color: C.mid,
                        }}>
                          {item.communityArea}
                        </span>
                      )}
                    </div>

                    {/* Headline */}
                    <a href={item.link} target="_blank" rel="noopener noreferrer" style={{
                      fontFamily: FONT.heading, fontSize: 17, fontWeight: 700,
                      color: C.deep, textDecoration: 'none', lineHeight: 1.35,
                      display: 'block', marginBottom: 6,
                    }}>
                      {item.title}
                      <span style={{ fontSize: 12, marginLeft: 6, color: C.light }}>↗</span>
                    </a>

                    {/* Excerpt */}
                    {item.description && (
                      <div style={{
                        fontSize: 13, lineHeight: 1.55, color: C.mid,
                        marginBottom: 6, maxHeight: 42, overflow: 'hidden',
                      }}>
                        {item.description.slice(0, 180)}{item.description.length > 180 ? '…' : ''}
                      </div>
                    )}

                    {/* Source + time */}
                    <div style={{
                      display: 'flex', gap: 8, alignItems: 'center',
                      fontSize: 11, color: C.light,
                    }}>
                      <span style={{ fontWeight: 600, color: C.mid }}>{item.source}</span>
                      <span>·</span>
                      <span style={{ fontFamily: FONT.mono }}>{formatTimeAgo(item.pubDate)}</span>
                      {item.nearestCampus && (
                        <>
                          <span>·</span>
                          <span>{item.nearestCampus.dist.toFixed(1)}mi from {item.nearestCampus.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT: Intelligence Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* AI Analysis */}
          <div style={{
            background: C.white, border: `1px solid ${C.chalk}`, borderRadius: 12,
            padding: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 12 }}>✦</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.deep }}>AI Analysis</span>
            </div>
            <SectionLabel>NEWS LANDSCAPE</SectionLabel>
            {analysisLoading ? (
              <div>
                {[90, 80, 70, 50].map((w, i) => (
                  <div key={i} style={{
                    height: 12, borderRadius: 3, marginBottom: 8, width: `${w}%`,
                    background: C.cream2,
                  }} />
                ))}
              </div>
            ) : (
              <div style={{
                fontSize: 13, lineHeight: 1.65, color: C.rock,
              }}>
                {analysis}
              </div>
            )}
          </div>

          {/* Source Breakdown */}
          <div style={{
            background: C.white, border: `1px solid ${C.chalk}`, borderRadius: 12,
            padding: '20px',
          }}>
            <SectionLabel>BY SOURCE</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sourceBreakdown.slice(0, 10).map(([source, count], i) => {
                const maxCount = sourceBreakdown[0]?.[1] || 1;
                const pct = (count as number / (maxCount as number)) * 100;
                return (
                  <div key={i}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      fontSize: 12, marginBottom: 3,
                    }}>
                      <span style={{ fontWeight: 600, color: C.deep }}>{source}</span>
                      <span style={{ fontFamily: FONT.mono, color: C.mid, fontSize: 11 }}>
                        {count}
                      </span>
                    </div>
                    <div style={{
                      height: 4, borderRadius: 2, background: C.cream2,
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%', borderRadius: 2,
                        background: C.brass, width: `${pct}%`,
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trending Areas */}
          <div style={{
            background: C.white, border: `1px solid ${C.chalk}`, borderRadius: 12,
            padding: '20px',
          }}>
            <SectionLabel>TRENDING AREAS</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {trendingAreas.map((area, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '6px 0',
                  borderBottom: i < trendingAreas.length - 1 ? `1px solid ${C.chalk}` : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontSize: 13, fontWeight: 600, color: C.deep,
                    }}>{area.area}</span>
                    {area.hasCampus && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
                        background: C.watch + '12', color: C.watch,
                      }}>CAMPUS</span>
                    )}
                  </div>
                  <span style={{
                    fontSize: 12, fontFamily: FONT.mono, color: C.mid,
                  }}>{area.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div style={{
            background: C.cream2, borderRadius: 12,
            padding: '16px 20px',
          }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
            }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: C.deep, fontFamily: FONT.heading }}>
                  {nearCampusCount}
                </div>
                <div style={{ fontSize: 10, color: C.mid, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Near campuses
                </div>
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: C.deep, fontFamily: FONT.heading }}>
                  {uniqueSources}
                </div>
                <div style={{ fontSize: 10, color: C.mid, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Sources live
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
