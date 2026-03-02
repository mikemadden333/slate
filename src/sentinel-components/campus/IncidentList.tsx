/**
 * IncidentList — Section 6: Recent Incidents Near Your Campus.
 *
 * Full filter bar: Time / Distance / Type / Sort
 * Each row: colored type badge, block address, distance+compass, time ago
 * HOMICIDE: red border, red bg. SHOTSPOTTER: teal, [UNCONFIRMED] tag.
 * Tapping → slide-up detail panel with grid, contagion check, dismissal guidance.
 * Empty state: green calm message.
 */

import { useState, useMemo } from 'react';
import type { Incident, ContagionZone } from '../../sentinel-engine/types';
import type { Campus } from '../../sentinel-data/campuses';
import { haversine, bearing, compassLabel, fmtAgo, fmtDist } from '../../sentinel-engine/geo';

interface Props {
  campus: Campus;
  incidents: Incident[];
  contagionZones?: ContagionZone[];
}

type SortMode = 'newest' | 'oldest' | 'closest' | 'severe';

const TIME_OPTIONS = [
  { label: '2H', hours: 2 }, { label: '6H', hours: 6 }, { label: '24H', hours: 24 },
  { label: '7D', hours: 168 }, { label: '30D', hours: 720 },
] as const;

const DISTANCE_OPTIONS = [
  { label: '0.25mi', miles: 0.25 }, { label: '0.5mi', miles: 0.5 },
  { label: '1mi', miles: 1.0 }, { label: '2mi', miles: 2.0 },
] as const;

const TYPE_FILTERS = [
  { key: 'HOMICIDE', label: 'HOMICIDE', color: '#DC2626' },
  { key: 'WEAPONS VIOLATION', label: 'WEAPONS', color: '#EA580C' },
  { key: 'BATTERY', label: 'BATTERY', color: '#D97706' },
  { key: 'ASSAULT', label: 'ASSAULT', color: '#B45309' },
  { key: 'ROBBERY', label: 'ROBBERY', color: '#7C3AED' },
  { key: 'NARCOTICS', label: 'NARCOTICS', color: '#0D9488' },
] as const;

const TYPE_COLORS: Record<string, string> = {
  'HOMICIDE': '#DC2626', 'WEAPONS VIOLATION': '#EA580C', 'BATTERY': '#D97706',
  'ASSAULT': '#B45309', 'ROBBERY': '#7C3AED', 'NARCOTICS': '#0D9488',
};

const SEVERITY_ORDER: Record<string, number> = {
  'HOMICIDE': 0, 'WEAPONS VIOLATION': 1, 'BATTERY': 2,
  'ASSAULT': 3, 'ROBBERY': 4, 'NARCOTICS': 5,
};

const COMPASS_ARROWS: Record<string, string> = {
  N: '↑', NE: '↗', E: '→', SE: '↘',
  S: '↓', SW: '↙', W: '←', NW: '↖',
};

interface EnrichedIncident extends Incident {
  distance: number;
  bearing: number;
  ageH: number;
  ts: number;
}

export default function IncidentList({ campus, incidents, contagionZones }: Props) {
  const [timeHours, setTimeHours] = useState(24);
  const [maxDist, setMaxDist] = useState(1.0);
  const [enabledTypes, setEnabledTypes] = useState<Set<string>>(() => new Set(TYPE_FILTERS.map(t => t.key)));
  const [sort, setSort] = useState<SortMode>('newest');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleType = (key: string) => {
    setEnabledTypes(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const enriched = useMemo(() => {
    const seen = new Set<string>();
    const deduped: Incident[] = [];
    for (const inc of incidents) {
      if (!seen.has(inc.id)) { seen.add(inc.id); deduped.push(inc); }
    }

    const cutoffMs = Date.now() - (timeHours * 60 * 60 * 1000);

    return deduped
      .map(inc => {
        const dist = haversine(campus.lat, campus.lng, inc.lat, inc.lng);
        const brng = bearing(campus.lat, campus.lng, inc.lat, inc.lng);
        const ts = new Date(inc.date).getTime();
        const age = isNaN(ts) ? Infinity : (Date.now() - ts) / 3_600_000;
        return { ...inc, distance: dist, bearing: brng, ageH: age, ts: isNaN(ts) ? 0 : ts } as EnrichedIncident;
      })
      .filter(inc => !isNaN(inc.ts) && inc.ts !== 0 && inc.ts >= cutoffMs)
      .filter(inc => inc.distance <= maxDist)
      .filter(inc => enabledTypes.has(inc.type) || !TYPE_COLORS[inc.type])
      .sort((a, b) => {
        switch (sort) {
          case 'newest': return b.ts - a.ts;
          case 'oldest': return a.ts - b.ts;
          case 'closest': return a.distance - b.distance;
          case 'severe': return (SEVERITY_ORDER[a.type] ?? 99) - (SEVERITY_ORDER[b.type] ?? 99);
        }
      })
      .slice(0, 100);
  }, [incidents, campus, timeHours, maxDist, enabledTypes, sort]);

  const isInContagion = (inc: EnrichedIncident): boolean => {
    if (!contagionZones) return false;
    return contagionZones.some(z => haversine(z.lat, z.lng, inc.lat, inc.lng) <= z.radius);
  };

  const timeLabel = TIME_OPTIONS.find(t => t.hours === timeHours)?.label ?? '';
  const distLabel = DISTANCE_OPTIONS.find(d => d.miles === maxDist)?.label ?? '';

  return (
    <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, marginBottom: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 20, color: '#0D1117' }}>
          What's Happened Near Your Campus
        </div>
        <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
          Verified Chicago Police reports — incidents typically appear 2-6 hours after they occur
        </div>
      </div>

      {/* Filter bar */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16,
        padding: '12px 14px', background: '#F8F9FA', borderRadius: 10,
      }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>Time:</span>
            {TIME_OPTIONS.map(t => (
              <FilterBtn key={t.label} label={t.label} active={timeHours === t.hours} onClick={() => setTimeHours(t.hours)} />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>Dist:</span>
            {DISTANCE_OPTIONS.map(d => (
              <FilterBtn key={d.label} label={d.label} active={maxDist === d.miles} onClick={() => setMaxDist(d.miles)} />
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>Type:</span>
          {TYPE_FILTERS.map(t => (
            <button key={t.key} onClick={() => toggleType(t.key)} style={{
              padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700,
              color: enabledTypes.has(t.key) ? '#fff' : t.color,
              background: enabledTypes.has(t.key) ? t.color : `${t.color}15`,
              border: `1px solid ${t.color}`, cursor: 'pointer', minHeight: 44,
            }}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>Sort:</span>
            <select value={sort} onChange={e => setSort(e.target.value as SortMode)} style={{
              fontSize: 12, padding: '4px 10px', borderRadius: 4, border: '1px solid #D1D5DB',
              background: '#fff', color: '#374151', minHeight: 44,
            }}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="closest">Closest First</option>
              <option value="severe">Most Severe First</option>
            </select>
          </div>
          <span style={{ fontSize: 14, color: '#374151', fontWeight: 600 }}>
            Showing {enriched.length} incident{enriched.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Incident rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {enriched.length === 0 && (
          <div style={{
            padding: '32px 20px', textAlign: 'center', background: '#F0FDF4',
            borderRadius: 10, border: '1px solid #BBF7D0',
          }}>
            <div style={{ fontSize: 16, color: '#15803D', fontWeight: 500, marginBottom: 4 }}>
              Your campus neighborhood has been quiet.
            </div>
            <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 12 }}>
              Nothing in the last {timeLabel} within {distLabel} requires your attention. That's a good morning.
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {timeHours < 168 && (
                <button onClick={() => setTimeHours(168)} style={{
                  padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                  background: '#fff', border: '1px solid #BBF7D0', color: '#15803D', cursor: 'pointer',
                }}>Try 7 days</button>
              )}
              {maxDist < 2.0 && (
                <button onClick={() => setMaxDist(2.0)} style={{
                  padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                  background: '#fff', border: '1px solid #BBF7D0', color: '#15803D', cursor: 'pointer',
                }}>Expand to 2mi</button>
              )}
              {enabledTypes.size < TYPE_FILTERS.length && (
                <button onClick={() => setEnabledTypes(new Set(TYPE_FILTERS.map(t => t.key)))} style={{
                  padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                  background: '#fff', border: '1px solid #BBF7D0', color: '#15803D', cursor: 'pointer',
                }}>Show all types</button>
              )}
            </div>
          </div>
        )}

        {enriched.map(inc => {
          const isHomicide = inc.type === 'HOMICIDE';
          const isShotSpotter = inc.type === 'SHOTSPOTTER';
          const isNew = inc.ageH < 1;
          const compass = compassLabel(inc.bearing);
          const arrow = COMPASS_ARROWS[compass] ?? '';
          const isExpanded = expandedId === inc.id;
          const inContagion = isHomicide && isInContagion(inc);

          return (
            <div key={inc.id}>
              <div
                onClick={() => setExpandedId(isExpanded ? null : inc.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px',
                  borderRadius: isExpanded ? '8px 8px 0 0' : 8,
                  background: isHomicide ? '#FEF2F2' : isShotSpotter ? '#F0FDFA' : isExpanded ? '#F8F9FA' : 'transparent',
                  borderLeft: `4px solid ${isShotSpotter ? '#0D9488' : TYPE_COLORS[inc.type] ?? '#9CA3AF'}`,
                  cursor: 'pointer',
                  minHeight: 48,
                }}
              >
                <div style={{
                  fontSize: 10, fontWeight: 700, color: '#fff',
                  background: isShotSpotter ? '#0D9488' : TYPE_COLORS[inc.type] ?? '#9CA3AF',
                  padding: '3px 8px', borderRadius: 4, flexShrink: 0,
                  minWidth: 68, textAlign: 'center', textTransform: 'uppercase',
                }}>
                  {isShotSpotter ? 'SHOTS' : inc.type === 'WEAPONS VIOLATION' ? 'WEAPONS' :
                   inc.type === 'MOTOR VEHICLE THEFT' ? 'MV THEFT' :
                   inc.type === 'CRIMINAL DAMAGE' ? 'CRIM DMG' : inc.type}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14, color: isHomicide ? '#991B1B' : '#374151',
                    fontWeight: isHomicide ? 700 : 500,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {inc.block}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                  {isNew && (
                    <span style={{ fontSize: 9, fontWeight: 800, color: '#DC2626', background: '#FEE2E2', padding: '2px 6px', borderRadius: 3 }}>NEW</span>
                  )}
                  {isShotSpotter && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#0D9488', background: '#CCFBF1', padding: '2px 6px', borderRadius: 3 }}>UNCONFIRMED</span>
                  )}
                  {isHomicide && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#DC2626' }}>See contagion</span>
                  )}
                </div>
                <div style={{
                  fontSize: 12, color: '#6B7280',
                  fontFamily: "'SF Mono', 'Roboto Mono', 'Courier New', monospace",
                  flexShrink: 0, textAlign: 'right', lineHeight: 1.5,
                }}>
                  <div>{fmtDist(inc.distance)} {arrow}</div>
                  <div>{fmtAgo(inc.date)}</div>
                </div>
              </div>

              {/* Expanded detail panel */}
              {isExpanded && (
                <div style={{
                  padding: '16px 18px', background: '#F8F9FA',
                  borderLeft: `4px solid ${isShotSpotter ? '#0D9488' : TYPE_COLORS[inc.type] ?? '#9CA3AF'}`,
                  borderRadius: '0 0 8px 8px', marginBottom: 4,
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14, marginBottom: 12 }}>
                    <div>
                      <div style={{ color: '#6B7280', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Block Address</div>
                      <div style={{ color: '#111827', fontWeight: 600 }}>{inc.block}</div>
                    </div>
                    <div>
                      <div style={{ color: '#6B7280', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Date & Time</div>
                      <div style={{ color: '#111827' }}>
                        {new Date(inc.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at{' '}
                        {new Date(inc.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#6B7280', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Distance</div>
                      <div style={{ color: '#111827' }}>{fmtDist(inc.distance)} {compass} {arrow} of your campus</div>
                    </div>
                    <div>
                      <div style={{ color: '#6B7280', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Time Ago</div>
                      <div style={{ color: '#111827' }}>{fmtAgo(inc.date)}</div>
                    </div>
                  </div>

                  {isHomicide && (
                    <div style={{
                      padding: '12px 14px', borderRadius: 8, marginBottom: 12,
                      background: inContagion ? '#FEF2F2' : '#F0FDF4',
                      border: `1px solid ${inContagion ? '#FECACA' : '#BBF7D0'}`,
                    }}>
                      <div style={{ fontWeight: 600, color: inContagion ? '#DC2626' : '#15803D', marginBottom: 2, fontSize: 14 }}>
                        Is this in a contagion zone? {inContagion ? 'YES' : 'NO'}
                      </div>
                      <div style={{ color: '#6B7280', fontSize: 13 }}>
                        {inContagion
                          ? 'See the Contagion Intelligence section above for details.'
                          : 'This homicide is outside any currently tracked contagion zone.'}
                      </div>
                    </div>
                  )}

                  <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
                    <strong>What should I do about this?</strong>{' '}
                    {isHomicide
                      ? 'A homicide near campus creates a contagion zone. Review the Contagion Intelligence section above.'
                      : inc.distance <= 0.25
                        ? 'Very close to campus. Ensure staff are aware and monitor for follow-up activity.'
                        : inc.distance <= 0.5
                          ? 'Within half a mile. Note any patterns and stay aware.'
                          : 'In your wider neighborhood. No immediate action needed unless part of a pattern.'}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FilterBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '4px 12px', borderRadius: 4, fontSize: 12,
      fontWeight: active ? 700 : 400, color: active ? '#fff' : '#374151',
      background: active ? '#0D1117' : '#fff', border: '1px solid #D1D5DB',
      cursor: 'pointer', minHeight: 44,
    }}>
      {label}
    </button>
  );
}
