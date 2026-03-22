/**
 * NetworkFeed — Slate Watch · "The Chronograph"
 *
 * Real-time intelligence feed with visual severity hierarchy.
 * Think: Twitter/X timeline meets intelligence wire.
 *
 * Layout:
 *   Header: Filter pills (type + time)
 *   Left (70%): Card-based timeline with colored severity bars
 *   Right (30%): Feed summary + Most active areas + Source status
 *
 * Props match the existing FeedView interface:
 *   incidents={allIncidents}
 *   iceAlerts={iceAlerts}
 *   allCampuses={CAMPUSES}
 *
 * Drop-in replacement — no SentinelApp.tsx changes needed.
 */

import { useState, useMemo } from 'react';
import type { Incident, IceAlert } from '../../sentinel-engine/types';
import { CAMPUSES } from '../../sentinel-data/campuses';
import { haversine } from '../../sentinel-engine/geo';

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface Campus {
  id: number; name: string; short: string; lat: number; lng: number;
  communityArea: string;
}

interface Props {
  incidents: Incident[];
  iceAlerts: IceAlert[];
  allCampuses: Campus[];
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

const SERIOUS_VIOLENT = /HOMICIDE|MURDER|SHOOTING|SHOT.?SPOTTER|CRIM SEXUAL|KIDNAP|AGG.*HANDGUN|AGG.*FIREARM/i;
const ASSAULT_TYPES = /BATTERY|ASSAULT|AGG/i;
const PROPERTY_TYPES = /THEFT|ROBBERY|BURGLARY|MOTOR VEHICLE|CRIMINAL DAMAGE|ARSON/i;

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

function getSeverity(type: string): { color: string; label: string; priority: number } {
  if (SERIOUS_VIOLENT.test(type)) return { color: C.red, label: 'CRITICAL', priority: 4 };
  if (ASSAULT_TYPES.test(type)) return { color: C.amber, label: 'ELEVATED', priority: 3 };
  if (/ICE/i.test(type)) return { color: C.ice, label: 'ICE', priority: 3 };
  if (PROPERTY_TYPES.test(type)) return { color: C.blue, label: 'PROPERTY', priority: 1 };
  return { color: C.mid, label: 'OTHER', priority: 0 };
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

function nearestCampus(lat: number, lng: number): { name: string; dist: number } {
  let best = { name: '', dist: Infinity };
  for (const c of CAMPUSES) {
    const d = haversine(c.lat, c.lng, lat, lng);
    if (d < best.dist) best = { name: c.short, dist: d };
  }
  return best;
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export default function NetworkFeed({ incidents, iceAlerts, allCampuses }: Props) {
  const [typeFilter, setTypeFilter] = useState<'all' | 'violent' | 'near' | 'ice' | 'property'>('all');
  const [timeFilter, setTimeFilter] = useState<'4h' | '24h' | '7d' | 'all'>('24h');
  const [showCount, setShowCount] = useState(40);

  const now = Date.now();

  // Merge incidents + ICE alerts into unified feed
  const feedItems = useMemo(() => {
    const items: Array<{
      id: string; type: string; description: string; date: string;
      lat: number; lng: number; block?: string; communityArea?: string;
      source?: string; severity: ReturnType<typeof getSeverity>;
      nearest: { name: string; dist: number };
    }> = [];

    for (const inc of incidents) {
      const severity = getSeverity(inc.type);
      const nearest = nearestCampus(inc.lat, inc.lng);
      items.push({
        id: inc.id || `inc_${inc.date}_${inc.lat}`,
        type: inc.type, description: inc.description || inc.type,
        date: inc.date, lat: inc.lat, lng: inc.lng,
        block: inc.block, communityArea: inc.communityArea,
        source: (inc as any).source || 'CPD',
        severity, nearest,
      });
    }

    // Add ICE alerts as feed items
    for (const alert of iceAlerts) {
      const lat = (alert as any).lat ?? 0;
      const lng = (alert as any).lng ?? 0;
      const nearest = lat && lng ? nearestCampus(lat, lng) : { name: 'Unknown', dist: 99 };
      items.push({
        id: `ice_${(alert as any).id || Math.random()}`,
        type: 'ICE ENFORCEMENT',
        description: (alert as any).description || 'ICE enforcement activity reported',
        date: (alert as any).date || (alert as any).timestamp || new Date().toISOString(),
        lat, lng, source: 'ICE',
        severity: { color: C.ice, label: 'ICE', priority: 3 },
        nearest,
      });
    }

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [incidents, iceAlerts]);

  // Apply filters
  const filtered = useMemo(() => {
    let result = feedItems;

    // Time filter
    const timeMs = timeFilter === '4h' ? 4 * 3600000
      : timeFilter === '24h' ? 24 * 3600000
      : timeFilter === '7d' ? 7 * 86400000
      : Infinity;
    if (timeMs < Infinity) {
      result = result.filter(item => now - new Date(item.date).getTime() <= timeMs);
    }

    // Type filter
    if (typeFilter === 'violent') result = result.filter(i => SERIOUS_VIOLENT.test(i.type));
    if (typeFilter === 'near') result = result.filter(i => i.nearest.dist <= 1.0);
    if (typeFilter === 'ice') result = result.filter(i => /ICE/i.test(i.type));
    if (typeFilter === 'property') result = result.filter(i => PROPERTY_TYPES.test(i.type));

    return result;
  }, [feedItems, typeFilter, timeFilter]);

  // Stats for sidebar
  const stats = useMemo(() => {
    const timeMs = timeFilter === '4h' ? 4 * 3600000
      : timeFilter === '24h' ? 24 * 3600000
      : timeFilter === '7d' ? 7 * 86400000
      : Infinity;
    const inWindow = feedItems.filter(i => timeMs === Infinity || now - new Date(i.date).getTime() <= timeMs);

    const byType: Record<string, number> = {};
    inWindow.forEach(i => { byType[i.severity.label] = (byType[i.severity.label] || 0) + 1; });

    const byArea: Record<string, number> = {};
    inWindow.forEach(i => {
      if (i.communityArea) byArea[i.communityArea] = (byArea[i.communityArea] || 0) + 1;
    });
    const topAreas = Object.entries(byArea).sort((a, b) => b[1] - a[1]).slice(0, 8);

    const bySrc: Record<string, number> = {};
    inWindow.forEach(i => {
      if (i.source) bySrc[i.source] = (bySrc[i.source] || 0) + 1;
    });

    return { total: inWindow.length, byType, topAreas, bySrc };
  }, [feedItems, timeFilter]);

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', fontFamily: FONT.body }}>

      {/* ═══ HEADER ═══ */}
      <SectionLabel>REAL-TIME INTELLIGENCE</SectionLabel>
      <h1 style={{
        fontFamily: FONT.heading, fontSize: 36, fontWeight: 900,
        color: C.deep, margin: '0 0 4px 0', lineHeight: 1.15,
        letterSpacing: '-0.02em',
      }}>
        Network Feed
      </h1>
      <div style={{
        fontSize: 13, color: C.mid, marginBottom: 20,
      }}>
        {stats.total} events · {Object.keys(stats.bySrc).length} sources · within 5 miles of any campus
      </div>

      {/* Filter bars */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
        {/* Time filters */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { key: '4h' as const, label: 'Last 4h' },
            { key: '24h' as const, label: 'Last 24h' },
            { key: '7d' as const, label: '7 Days' },
            { key: 'all' as const, label: 'All' },
          ].map(f => (
            <button key={f.key} onClick={() => setTimeFilter(f.key)} style={{
              padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
              border: `1px solid ${timeFilter === f.key ? C.brass : C.chalk}`,
              background: timeFilter === f.key ? C.brass + '15' : C.white,
              color: timeFilter === f.key ? C.brass : C.mid,
              cursor: 'pointer', fontFamily: FONT.body,
            }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Type filters */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { key: 'all' as const, label: 'All Types' },
            { key: 'violent' as const, label: 'Violent', color: C.red },
            { key: 'near' as const, label: 'Near Campus', color: C.amber },
            { key: 'ice' as const, label: 'ICE', color: C.ice },
            { key: 'property' as const, label: 'Property', color: C.blue },
          ].map(f => (
            <button key={f.key} onClick={() => setTypeFilter(f.key)} style={{
              padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
              border: `1px solid ${typeFilter === f.key ? (f.color || C.deep) : C.chalk}`,
              background: typeFilter === f.key ? (f.color || C.deep) + '12' : C.white,
              color: typeFilter === f.key ? (f.color || C.deep) : C.mid,
              cursor: 'pointer', fontFamily: FONT.body,
            }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ TWO-COLUMN LAYOUT ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>

        {/* LEFT: Feed Timeline */}
        <div>
          {filtered.length === 0 ? (
            <div style={{
              padding: '40px 0', textAlign: 'center',
              fontSize: 14, color: C.mid,
            }}>
              No events match the current filters.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.slice(0, showCount).map((item, i) => (
                <div key={item.id + i} style={{
                  display: 'flex', gap: 0,
                  background: C.white, border: `1px solid ${C.chalk}`, borderRadius: 10,
                  overflow: 'hidden',
                }}>
                  {/* Severity bar */}
                  <div style={{
                    width: 4, flexShrink: 0,
                    background: item.severity.color,
                  }} />

                  {/* Content */}
                  <div style={{ flex: 1, padding: '12px 16px', minWidth: 0 }}>
                    {/* Top row: badges */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                        background: item.severity.color + '15', color: item.severity.color,
                      }}>{item.type}</span>
                      {item.source && (
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4,
                          background: C.cream2, color: C.mid,
                        }}>{item.source}</span>
                      )}
                      {item.nearest.dist <= 1.0 && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                          background: C.watch + '12', color: C.watch,
                        }}>NEAR {item.nearest.name.toUpperCase()}</span>
                      )}
                    </div>

                    {/* Description */}
                    <div style={{
                      fontSize: 14, fontWeight: 600, color: C.deep,
                      lineHeight: 1.4, marginBottom: 4,
                    }}>
                      {item.description}
                    </div>

                    {/* Meta row */}
                    <div style={{
                      display: 'flex', gap: 8, alignItems: 'center',
                      fontSize: 11, color: C.light,
                    }}>
                      {item.block && <span>{item.block}</span>}
                      {item.communityArea && (
                        <>
                          {item.block && <span>·</span>}
                          <span>{item.communityArea}</span>
                        </>
                      )}
                      <span>·</span>
                      <span style={{ fontFamily: FONT.mono }}>{formatTimeAgo(item.date)}</span>
                    </div>
                  </div>

                  {/* Right: distance */}
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
                    justifyContent: 'center', padding: '12px 16px', flexShrink: 0,
                    minWidth: 100,
                  }}>
                    <div style={{
                      fontSize: 14, fontWeight: 700, color: item.nearest.dist <= 1 ? C.watch : C.mid,
                      fontFamily: FONT.mono,
                    }}>
                      {item.nearest.dist.toFixed(1)}mi
                    </div>
                    <div style={{
                      fontSize: 10, color: C.light, marginTop: 2,
                    }}>
                      {item.nearest.name}
                    </div>
                  </div>
                </div>
              ))}

              {/* Load more */}
              {filtered.length > showCount && (
                <button onClick={() => setShowCount(s => s + 30)} style={{
                  padding: '12px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  border: `1px solid ${C.chalk}`, background: C.white,
                  color: C.mid, cursor: 'pointer', fontFamily: FONT.body,
                  textAlign: 'center',
                }}>
                  Load more ({filtered.length - showCount} remaining)
                </button>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Feed Intelligence Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Feed Summary */}
          <div style={{
            background: C.white, border: `1px solid ${C.chalk}`, borderRadius: 12,
            padding: '20px',
          }}>
            <SectionLabel>FEED SUMMARY</SectionLabel>
            <div style={{
              fontSize: 32, fontWeight: 900, color: C.deep,
              fontFamily: FONT.heading, lineHeight: 1, marginBottom: 4,
            }}>
              {filtered.length}
            </div>
            <div style={{ fontSize: 11, color: C.mid, marginBottom: 16 }}>
              events matching filters
            </div>

            {/* Breakdown by severity */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Critical', color: C.red, count: stats.byType['CRITICAL'] || 0 },
                { label: 'Elevated', color: C.amber, count: stats.byType['ELEVATED'] || 0 },
                { label: 'ICE', color: C.ice, count: stats.byType['ICE'] || 0 },
                { label: 'Property', color: C.blue, count: stats.byType['PROPERTY'] || 0 },
                { label: 'Other', color: C.mid, count: stats.byType['OTHER'] || 0 },
              ].filter(s => s.count > 0).map((s, i) => {
                const pct = stats.total > 0 ? (s.count / stats.total) * 100 : 0;
                return (
                  <div key={i}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      fontSize: 11, marginBottom: 3,
                    }}>
                      <span style={{ fontWeight: 600, color: s.color }}>{s.label}</span>
                      <span style={{ fontFamily: FONT.mono, color: C.mid }}>{s.count}</span>
                    </div>
                    <div style={{
                      height: 4, borderRadius: 2, background: C.cream2,
                    }}>
                      <div style={{
                        height: '100%', borderRadius: 2,
                        background: s.color, width: `${pct}%`,
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Most Active Areas */}
          <div style={{
            background: C.white, border: `1px solid ${C.chalk}`, borderRadius: 12,
            padding: '20px',
          }}>
            <SectionLabel>MOST ACTIVE AREAS</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {stats.topAreas.map(([area, count], i) => {
                const hasCampus = CAMPUSES.some(c =>
                  c.communityArea.toLowerCase() === (area as string).toLowerCase()
                );
                return (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '6px 0',
                    borderBottom: i < stats.topAreas.length - 1 ? `1px solid ${C.chalk}` : 'none',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.deep }}>{area}</span>
                      {hasCampus && (
                        <span style={{
                          width: 5, height: 5, borderRadius: '50%',
                          background: C.watch, flexShrink: 0,
                        }} />
                      )}
                    </div>
                    <span style={{ fontSize: 11, fontFamily: FONT.mono, color: C.mid }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Source Status */}
          <div style={{
            background: C.white, border: `1px solid ${C.chalk}`, borderRadius: 12,
            padding: '20px',
          }}>
            <SectionLabel>SOURCES</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Object.entries(stats.bySrc).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([src, count], i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: C.green, flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.deep, flex: 1 }}>{src}</span>
                  <span style={{ fontSize: 11, fontFamily: FONT.mono, color: C.mid }}>{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div style={{
            background: C.cream2, borderRadius: 12, padding: '14px 16px',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.mid, marginBottom: 8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Severity Legend
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { color: C.red, label: 'Homicide / Shooting / Gun Violence' },
                { color: C.amber, label: 'Assault / Battery' },
                { color: C.ice, label: 'ICE Enforcement' },
                { color: C.blue, label: 'Property Crime' },
                { color: C.green, label: 'Resolved / Cleared' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 12, height: 3, borderRadius: 1, background: s.color,
                    flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 10, color: C.mid }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
