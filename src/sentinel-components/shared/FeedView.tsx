import type { Incident, IceAlert } from '../../sentinel-engine/types';
import type { Campus } from '../../sentinel-data/campuses';
import { haversine } from '../../sentinel-engine/geo';

const VIOLENT = new Set(['HOMICIDE','MURDER','SHOOTING','BATTERY','ROBBERY','ASSAULT','SEX OFFENSE','KIDNAPPING','ARSON']);

interface FeedItem {
  id: string;
  type: 'VIOLENT' | 'ICE';
  subtype: string;
  block: string;
  date: Date;
  dist?: number;
  campusName?: string;
  source: string;
  confidence?: string;
}

interface Props {
  incidents: Incident[];
  iceAlerts: IceAlert[];
  campus?: Campus | null;       // null = network view
  allCampuses?: Campus[];
}

function timeAgo(d: Date): string {
  const h = (Date.now() - d.getTime()) / 3600000;
  if (h < 1) return `${Math.round(h * 60)}m ago`;
  if (h < 24) return `${Math.round(h)}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function nearestCampus(lat: number, lng: number, campuses: Campus[]): { name: string; dist: number } | null {
  let best: { name: string; dist: number } | null = null;
  for (const c of campuses) {
    const d = haversine(c.lat, c.lng, lat, lng);
    if (!best || d < best.dist) best = { name: c.short ?? c.name, dist: d };
  }
  return best;
}

export default function FeedView({ incidents, iceAlerts, campus, allCampuses = [] }: Props) {
  const isNetwork = !campus;

  // Build feed items
  const items: FeedItem[] = [];

  // Violent incidents
  for (const inc of incidents) {
    if (!VIOLENT.has(inc.type)) continue;
    const date = new Date(inc.date);
    if (isNaN(date.getTime())) continue;

    let dist: number | undefined;
    let campusName: string | undefined;

    if (campus) {
      dist = haversine(campus.lat, campus.lng, inc.lat, inc.lng);
      if (dist > 3.0) continue; // campus view: 3mi radius only
    } else {
      const near = nearestCampus(inc.lat, inc.lng, allCampuses);
      if (!near || near.dist > 3.0) continue; // network: only near a campus
      dist = near.dist;
      campusName = near.name;
    }

    items.push({
      id: inc.id,
      type: 'VIOLENT',
      subtype: inc.type,
      block: inc.block ?? '',
      date,
      dist,
      campusName,
      source: inc.source ?? 'CPD',
      confidence: undefined,
    });
  }

  // ICE alerts
  for (const alert of iceAlerts) {
    const date = new Date(alert.timestamp);
    if (isNaN(date.getTime())) continue;

    items.push({
      id: alert.id,
      type: 'ICE',
      subtype: 'ICE ACTIVITY',
      block: alert.location ?? '',
      date,
      dist: alert.distanceFromCampus,
      campusName: campus ? undefined : (allCampuses.find(c => c.id === alert.nearestCampusId)?.short),
      source: alert.source,
      confidence: alert.confidence,
    });
  }

  // Sort: campus = by distance, network = by recency
  if (campus) {
    items.sort((a, b) => (a.dist ?? 99) - (b.dist ?? 99));
  } else {
    items.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  const typeColor = (t: FeedItem) => {
    if (t.type === 'ICE') return '#7b5ea7';
    if (['HOMICIDE','MURDER','SHOOTING'].includes(t.subtype)) return '#e05c52';
    if (t.subtype === 'ROBBERY') return '#c9943a';
    return '#4a7fb5';
  };

  const typeBg = (t: FeedItem) => {
    if (t.type === 'ICE') return 'rgba(123,94,167,0.08)';
    if (['HOMICIDE','MURDER','SHOOTING'].includes(t.subtype)) return 'rgba(224,92,82,0.07)';
    if (t.subtype === 'ROBBERY') return 'rgba(201,148,58,0.07)';
    return 'rgba(74,127,181,0.07)';
  };

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 24px', color: '#6B7280' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
          No violent incidents or ICE activity
        </div>
        <div style={{ fontSize: 13 }}>
          {campus
            ? `No reports within 3 miles of ${campus.name} in the current data window.`
            : 'No reports within 3 miles of any Noble campus in the current data window.'}
        </div>
        <div style={{ fontSize: 11, marginTop: 12, color: '#9CA3AF' }}>
          CPD data lags 5–10 days · Dispatch pins appear in real time on spike zones
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#121315' }}>
            {isNetwork ? 'Network Violence & ICE Feed' : `${campus!.name} — Violence & ICE Feed`}
          </div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 3 }}>
            {items.length} {items.length === 1 ? 'incident' : 'incidents'} · violent crime + ICE activity only
            {campus ? ' · within 3 miles · sorted by distance' : ' · within 3 miles of any campus · sorted by recency'}
          </div>
        </div>
        <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'right' }}>
          CPD: 5–10 day lag<br/>Dispatch: real time
        </div>
      </div>

      {/* Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map(item => (
          <div key={item.id} style={{
            background: typeBg(item),
            border: `1px solid ${typeColor(item)}22`,
            borderLeft: `3px solid ${typeColor(item)}`,
            borderRadius: 10,
            padding: '14px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                {/* Type badge */}
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
                  color: typeColor(item), textTransform: 'uppercase',
                  background: `${typeColor(item)}15`,
                  padding: '2px 8px', borderRadius: 4,
                }}>
                  {item.subtype}
                </span>
                {/* ICE confidence */}
                {item.confidence && (
                  <span style={{
                    fontSize: 9, fontWeight: 600, letterSpacing: '0.1em',
                    color: item.confidence === 'CONFIRMED' ? '#e05c52' : '#c9943a',
                    textTransform: 'uppercase',
                    padding: '2px 8px', borderRadius: 4,
                    background: item.confidence === 'CONFIRMED' ? 'rgba(224,92,82,0.1)' : 'rgba(201,148,58,0.1)',
                  }}>
                    {item.confidence}
                  </span>
                )}
                {/* Network: campus callout */}
                {isNetwork && item.campusName && (
                  <span style={{
                    fontSize: 10, fontWeight: 600, color: '#374151',
                    background: '#F3F4F6', padding: '2px 8px', borderRadius: 4,
                  }}>
                    near {item.campusName}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#121315', marginBottom: 3, lineHeight: 1.3 }}>
                {item.block || 'Location undisclosed'}
              </div>
              <div style={{ fontSize: 11, color: '#6B7280' }}>
                {item.source}
              </div>
            </div>

            {/* Right: time + distance */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
                {timeAgo(item.date)}
              </div>
              {item.dist !== undefined && (
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                  {item.dist.toFixed(1)} mi
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 20, textAlign: 'center', lineHeight: 1.7 }}>
        Showing HOMICIDE · SHOOTING · BATTERY · ROBBERY · ASSAULT · ICE ACTIVITY only.
        CPD data reflects a 5–10 day publication lag. Dispatch-derived incidents appear within 15 minutes of spike detection.
      </div>
    </div>
  );
}
