import { useState } from 'react';
import type { Incident, IceAlert } from '../../sentinel-engine/types';
import type { Campus } from '../../sentinel-data/campuses';
import { haversine } from '../../sentinel-engine/geo';

const VIOLENT = new Set(['HOMICIDE','MURDER','SHOOTING','BATTERY','ROBBERY','ASSAULT','SEX OFFENSE','KIDNAPPING','ARSON']);
type SortMode = 'recent' | 'distance' | 'campus' | 'type';
type Filter = 'all' | '7d' | '48h';
type TypeFilter = 'all' | 'HOMICIDE' | 'SHOOTING' | 'BATTERY' | 'ROBBERY' | 'ASSAULT' | 'ICE';

interface FeedItem {
  id: string; type: 'VIOLENT' | 'ICE'; subtype: string;
  block: string; date: Date; dist?: number; campusName?: string;
  source: string; confidence?: string; isLive: boolean;
}
interface Props {
  incidents: Incident[]; iceAlerts: IceAlert[];
  campus?: Campus | null; allCampuses?: Campus[];
}

function timeAgo(d: Date): string {
  const h = (Date.now() - d.getTime()) / 3600000;
  if (h < 1) return `${Math.round(h * 60)}m ago`;
  if (h < 24) return `${Math.round(h)}h ago`;
  return `${Math.round(h / 24)}d ago`;
}
function nearestCampus(lat: number, lng: number, campuses: Campus[]) {
  let best: { name: string; dist: number } | null = null;
  for (const c of campuses) {
    const d = haversine(c.lat, c.lng, lat, lng);
    if (!best || d < best.dist) best = { name: c.short ?? c.name, dist: d };
  }
  return best;
}
function typeColor(item: FeedItem) {
  if (item.type === 'ICE') return '#7b5ea7';
  if (['HOMICIDE','MURDER','SHOOTING'].includes(item.subtype)) return '#e05c52';
  if (item.subtype === 'ROBBERY') return '#c9943a';
  return '#4a7fb5';
}
function typeBg(item: FeedItem) {
  if (item.type === 'ICE') return 'rgba(123,94,167,0.07)';
  if (['HOMICIDE','MURDER','SHOOTING'].includes(item.subtype)) return 'rgba(224,92,82,0.06)';
  if (item.subtype === 'ROBBERY') return 'rgba(201,148,58,0.06)';
  return 'rgba(74,127,181,0.06)';
}
const LIVE_SOURCES = new Set(['DISPATCH','NEWS','CITIZEN','SHOTSPOTTER']);

export default function FeedView({ incidents, iceAlerts, campus, allCampuses = [] }: Props) {
  const isNetwork = !campus;
  const [sort, setSort] = useState<SortMode>('recent');
  const [filter, setFilter] = useState<Filter>('7d');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [campusFilter, setCampusFilter] = useState<string>('all');

  const cutoff = filter === '48h' ? 48 : filter === '7d' ? 168 : 99999;
  const now = Date.now();

  const items: FeedItem[] = [];

  for (const inc of incidents) {
    if (!VIOLENT.has(inc.type)) continue;
    const date = new Date(inc.date);
    if (isNaN(date.getTime())) continue;
    const ageH = (now - date.getTime()) / 3600000;
    if (ageH > cutoff) continue;

    let dist: number | undefined;
    let campusName: string | undefined;

    if (campus) {
      dist = haversine(campus.lat, campus.lng, inc.lat, inc.lng);
      if (dist > 3.0) continue;
    } else {
      const near = nearestCampus(inc.lat, inc.lng, allCampuses);
      if (!near || near.dist > 3.0) continue;
      dist = near.dist; campusName = near.name;
    }

    items.push({
      id: inc.id, type: 'VIOLENT', subtype: inc.type,
      block: inc.block ?? '', date, dist, campusName,
      source: inc.source ?? 'CPD',
      isLive: LIVE_SOURCES.has((inc.source ?? '').toUpperCase()),
    });
  }

  for (const alert of iceAlerts) {
    const date = new Date(alert.timestamp);
    if (isNaN(date.getTime())) continue;
    const ageH = (now - date.getTime()) / 3600000;
    if (ageH > cutoff) continue;

    // Compute actual distance for campus view
    let iceDist: number | undefined;
    if (campus && alert.lat != null && alert.lng != null) {
      iceDist = haversine(campus.lat, campus.lng, alert.lat, alert.lng);
      if (iceDist > 3.0) continue;
    } else if (campus && alert.distanceFromCampus != null) {
      iceDist = alert.distanceFromCampus;
      if (iceDist > 3.0) continue;
    } else if (campus) {
      // No location data — cannot verify proximity, skip
      continue;
    } else {
      // Network view — use nearest campus distance
      iceDist = alert.distanceFromCampus;
      if (iceDist == null || iceDist > 3.0) continue;
    }

    items.push({
      id: alert.id, type: 'ICE', subtype: 'ICE ACTIVITY',
      block: alert.location ?? 'Location undisclosed', date,
      dist: iceDist,
      campusName: isNetwork ? (allCampuses.find(c => c.id === alert.nearestCampusId)?.short) : undefined,
      source: alert.source, confidence: alert.confidence,
      isLive: true,
    });
  }

  // Apply type filter
  const visibleItems = items.filter(item => {
    if (typeFilter !== 'all') {
      if (typeFilter === 'ICE' && item.type !== 'ICE') return false;
      if (typeFilter !== 'ICE' && item.subtype !== typeFilter) return false;
    }
    if (campusFilter !== 'all' && item.campusName !== campusFilter) return false;
    return true;
  });

  if (sort === 'recent') visibleItems.sort((a, b) => b.date.getTime() - a.date.getTime());
  else if (sort === 'distance') visibleItems.sort((a, b) => (a.dist ?? 99) - (b.dist ?? 99));
  else if (sort === 'campus') visibleItems.sort((a, b) => (a.campusName ?? '').localeCompare(b.campusName ?? ''));
  else if (sort === 'type') visibleItems.sort((a, b) => a.subtype.localeCompare(b.subtype));

  const btnStyle = (active: boolean) => ({
    padding: '5px 14px', border: `1px solid ${active ? '#B79145' : '#E7E2D8'}`,
    borderRadius: 20, fontSize: 11, fontWeight: active ? 700 : 500,
    color: active ? '#B79145' : '#6B7280', background: active ? '#FDF9F0' : 'white',
    cursor: 'pointer', transition: 'all 0.15s',
  });

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#121315' }}>
            {isNetwork ? 'Network Violence & ICE Feed' : `${campus!.name} — Violence & ICE Feed`}
          </div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 3 }}>
            {visibleItems.length} {visibleItems.length === 1 ? 'incident' : 'incidents'} · violent crime + ICE only
            {campus ? ' · within 3 miles' : ' · within 3 miles of any campus'}
          </div>
        </div>
        {/* Controls */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Filter */}
          <div style={{ display: 'flex', gap: 4 }}>
            {(['48h','7d','all'] as Filter[]).map(f => (
              <button key={f} style={btnStyle(filter === f)} onClick={() => setFilter(f)}>
                {f === '48h' ? 'Last 48h' : f === '7d' ? 'Last 7d' : 'All'}
              </button>
            ))}
          </div>
          <div style={{ width: 1, height: 20, background: '#E7E2D8' }}/>
          {/* Sort */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {(['recent','distance'] as SortMode[]).map(s => (
              <button key={s} style={btnStyle(sort === s)} onClick={() => setSort(s)}>
                {s === 'recent' ? 'Recent' : 'Nearest'}
              </button>
            ))}
            {isNetwork && (
              <button style={btnStyle(sort === 'campus')} onClick={() => setSort('campus')}>Campus</button>
            )}
            <button style={btnStyle(sort === 'type')} onClick={() => setSort('type')}>Type</button>
          </div>
          <div style={{ width: 1, height: 20, background: '#E7E2D8' }}/>
          {/* Type filter */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {(['all','HOMICIDE','SHOOTING','BATTERY','ROBBERY','ASSAULT','ICE'] as TypeFilter[]).map(t => (
              <button key={t} style={btnStyle(typeFilter === t)} onClick={() => setTypeFilter(t)}>
                {t === 'all' ? 'All Types' : t}
              </button>
            ))}
          </div>
          {isNetwork && (
            <>
              <div style={{ width: 1, height: 20, background: '#E7E2D8' }}/>
              {/* Campus filter */}
              <select
                value={campusFilter}
                onChange={e => setCampusFilter(e.target.value)}
                style={{
                  padding: '5px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500,
                  border: campusFilter !== 'all' ? '1px solid #B79145' : '1px solid #E7E2D8',
                  color: campusFilter !== 'all' ? '#B79145' : '#6B7280',
                  background: campusFilter !== 'all' ? '#FDF9F0' : 'white',
                  cursor: 'pointer',
                }}
              >
                <option value="all">All Campuses</option>
                {allCampuses.map(c => (
                  <option key={c.id} value={c.short ?? c.name}>{c.short ?? c.name}</option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      {visibleItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 24px', color: '#6B7280' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
            No incidents in this window
          </div>
          <div style={{ fontSize: 13 }}>
            Try expanding the time filter. CPD data has a 5–10 day publication lag —
            the "All" filter will show the full 30-day window.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {visibleItems.map(item => (
            <div key={item.id} style={{
              background: typeBg(item),
              border: `1px solid ${typeColor(item)}20`,
              borderLeft: `3px solid ${typeColor(item)}`,
              borderRadius: 10, padding: '12px 16px',
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'flex-start', gap: 12,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
                    color: typeColor(item), textTransform: 'uppercase',
                    background: `${typeColor(item)}15`, padding: '2px 7px', borderRadius: 4,
                  }}>{item.subtype}</span>
                  {item.isLive && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                      color: '#fff', background: '#3a9e6e',
                      padding: '2px 7px', borderRadius: 4,
                    }}>LIVE</span>
                  )}
                  {item.confidence && (
                    <span style={{
                      fontSize: 9, fontWeight: 600,
                      color: item.confidence === 'CONFIRMED' ? '#e05c52' : '#c9943a',
                      background: item.confidence === 'CONFIRMED' ? 'rgba(224,92,82,0.1)' : 'rgba(201,148,58,0.1)',
                      padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase',
                    }}>{item.confidence}</span>
                  )}
                  {isNetwork && item.campusName && (
                    <span style={{
                      fontSize: 10, fontWeight: 600, color: '#374151',
                      background: '#F3F4F6', padding: '2px 7px', borderRadius: 4,
                    }}>near {item.campusName}</span>
                  )}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#121315', marginBottom: 2 }}>
                  {item.block || 'Location undisclosed'}
                </div>
                <div style={{ fontSize: 11, color: '#9CA3AF' }}>{item.source}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{timeAgo(item.date)}</div>
                {item.dist !== undefined && (
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{item.dist.toFixed(1)} mi</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 16, textAlign: 'center', lineHeight: 1.8 }}>
        HOMICIDE · SHOOTING · BATTERY · ROBBERY · ASSAULT · ICE ACTIVITY only
        <br/>CPD data: 5–10 day publication lag · <span style={{ color: '#3a9e6e', fontWeight: 600 }}>LIVE</span> = dispatch, news, or Citizen source
      </div>
    </div>
  );
}
