/**
 * NetworkDashboard — Watch Network View
 *
 * First principle: What happened near our schools that could impact
 * the safety of our students and staff?
 *
 * Chapter 1: What happened — live feed, last 24h, near any campus
 * Chapter 2: Contagion — is anything still dangerous?
 * Chapter 3: ICE — enforcement activity near campuses
 * Chapter 4: Campus list — all schools, sorted by risk
 * Chapter 5: Data sources — transparency, collapsed
 */
import { useState } from 'react';
import type {
  CampusRisk, NetworkSummary, ForecastDay, IceAlert,
  ShotSpotterEvent, Incident, ContagionZone,
} from '../../sentinel-engine/types';
import type { CitizenIncident } from '../../sentinel-api/citizen';
import type { DispatchIncident } from '../../sentinel-api/scannerIntel';
import { CAMPUSES } from '../../sentinel-data/campuses';
import { RISK_COLORS } from '../../sentinel-data/weights';
import { haversine, ageInHours } from '../../sentinel-engine/geo';

interface Props {
  risks: CampusRisk[];
  summary: NetworkSummary;
  forecast: ForecastDay[];
  iceAlerts: IceAlert[];
  shotSpotterEvents: ShotSpotterEvent[];
  acuteIncidents: Incident[];
  citizenIncidents?: CitizenIncident[];
  newsIncidents?: Incident[];
  dispatchIncidents?: DispatchIncident[];
  onSelectCampus: (id: number) => void;
  scannerCalls?: number;
  scannerSpikeZones?: number;
  newsSourceCount?: number;
  newsIncidentCount?: number;
  redditIncidentCount?: number;
  cpdCount?: number;
}

const VIOLENT = new Set([
  'HOMICIDE', 'MURDER', 'SHOOTING', 'BATTERY',
  'ROBBERY', 'ASSAULT', 'WEAPONS VIOLATION', 'CRIM SEXUAL ASSAULT',
]);

function fmtAgo(ms: number): string {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function nearestCampus(lat: number, lng: number): { name: string; dist: number } {
  let best = { name: '', dist: 99 };
  for (const c of CAMPUSES) {
    const d = haversine(c.lat, c.lng, lat, lng);
    if (d < best.dist) best = { name: c.short, dist: d };
  }
  return best;
}

export default function NetworkDashboard({
  risks, summary, forecast, iceAlerts, shotSpotterEvents, acuteIncidents,
  citizenIncidents = [], newsIncidents = [], dispatchIncidents = [],
  onSelectCampus,
  scannerCalls = 0, scannerSpikeZones = 0, newsSourceCount = 0,
  newsIncidentCount = 0, redditIncidentCount = 0, cpdCount = 0,
}: Props) {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const sorted = [...risks].sort((a, b) => b.score - a.score);
  const now = Date.now();
  const H24 = 24 * 3600 * 1000;

  // ── BUILD LIVE FEED ──────────────────────────────────────────────────────
  // Citizen + News + Scanner, within 1mi of any campus, last 24h
  const liveItems: {
    id: string;
    source: 'CITIZEN' | 'NEWS' | 'SCANNER';
    type: string;
    title: string;
    block: string;
    campus: string;
    distMi: number;
    tsMs: number;
    isViolent: boolean;
  }[] = [];

  for (const inc of citizenIncidents) {
    const tsMs = inc.cs || 0;
    if (now - tsMs > H24) continue;
    const nearest = nearestCampus(inc.latitude, inc.longitude);
    if (nearest.dist > 1.0) continue;
    const title = inc.title || inc.address || 'Community report';
    liveItems.push({
      id: `cit_${inc.key}`,
      source: 'CITIZEN',
      type: 'REPORT',
      title,
      block: inc.address || inc.location || '',
      campus: nearest.name,
      distMi: nearest.dist,
      tsMs,
      isViolent: /shoot|gun|shot|stab|attack|assault|robber|weapon/i.test(title),
    });
  }

  for (const inc of newsIncidents) {
    if (inc.lat == null || inc.lng == null) continue;
    const tsMs = new Date(inc.date).getTime();
    if (now - tsMs > H24) continue;
    const nearest = nearestCampus(inc.lat, inc.lng);
    if (nearest.dist > 1.0) continue;
    liveItems.push({
      id: `news_${inc.id}`,
      source: 'NEWS',
      type: inc.type || 'NEWS',
      title: inc.description || inc.block || 'News report',
      block: inc.block || '',
      campus: nearest.name,
      distMi: nearest.dist,
      tsMs,
      isViolent: VIOLENT.has((inc.type || '').toUpperCase()),
    });
  }

  for (const inc of dispatchIncidents) {
    if (!inc.latitude || !inc.longitude) continue;
    const tsMs = new Date(inc.time).getTime();
    if (now - tsMs > H24) continue;
    const nearest = nearestCampus(inc.latitude, inc.longitude);
    if (nearest.dist > 1.0) continue;
    liveItems.push({
      id: `scan_${inc.id}`,
      source: 'SCANNER',
      type: inc.type || 'DISPATCH',
      title: inc.description || 'Police dispatch',
      block: inc.block || '',
      campus: nearest.name,
      distMi: nearest.dist,
      tsMs,
      isViolent: inc.isPriority,
    });
  }

  // Violent first, then most recent
  liveItems.sort((a, b) => {
    if (a.isViolent && !b.isViolent) return -1;
    if (!a.isViolent && b.isViolent) return 1;
    return b.tsMs - a.tsMs;
  });

  // ── CONTAGION ────────────────────────────────────────────────────────────
  const allZones = risks.flatMap(r => r.contagionZones ?? []);
  const retWinZones = allZones.filter(z => z.retWin);
  const acuteZones  = allZones.filter(z => z.phase === 'ACUTE');
  const activeZones = allZones.filter(z => z.phase === 'ACTIVE');
  const watchZones  = allZones.filter(z => z.phase === 'WATCH');
  const dangerousZones = [...retWinZones, ...acuteZones, ...activeZones];

  // ── CAMPUS BADGES ────────────────────────────────────────────────────────
  const campusBadges = new Map<number, { ice: boolean; shot: boolean }>();
  for (const campus of CAMPUSES) {
    const hasIce = iceAlerts.some(a => {
      if (a.lat == null || a.lng == null) return a.nearestCampusId === campus.id;
      return haversine(campus.lat, campus.lng, a.lat, a.lng) <= 1.0;
    });
    const hasShot = shotSpotterEvents.some(s =>
      ageInHours(s.date) <= 24 && haversine(campus.lat, campus.lng, s.lat, s.lng) <= 0.5,
    );
    campusBadges.set(campus.id, { ice: hasIce, shot: hasShot });
  }

  const elevatedCount = sorted.filter(r => r.label !== 'LOW').length;
  const timeStr = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  // Source colors
  const SOURCE_COLOR = { CITIZEN: '#059669', NEWS: '#7C3AED', SCANNER: '#B79145' };
  const SOURCE_LABEL = { CITIZEN: 'LIVE', NEWS: 'NEWS', SCANNER: 'SCANNER' };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px 48px' }}>

      {/* ── CHAPTER 1: WHAT HAPPENED NEAR OUR SCHOOLS ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 12,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
            color: '#9CA3AF', textTransform: 'uppercase',
          }}>
            Near Our Schools · Last 24 Hours
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: '#6B7280' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', display: 'inline-block' }} />
              Citizen
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7C3AED', display: 'inline-block' }} />
              News
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#B79145', display: 'inline-block' }} />
              CPD Radio
            </span>
          </div>
        </div>

        {liveItems.length === 0 ? (
          <div style={{
            background: '#F0FDF4', border: '1px solid #D1FAE5',
            borderLeft: '4px solid #16A34A',
            borderRadius: 12, padding: '20px 20px',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: '#16A34A', flexShrink: 0,
            }} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#15803D' }}>
                Quiet — no incidents reported near any campus in the last 24 hours.
              </div>
              <div style={{ fontSize: 12, color: '#166534', marginTop: 4 }}>
                Citizen App · CPD Radio · News feeds — all clear as of {timeStr}.
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            background: '#fff', border: '1px solid #E7E2D8',
            borderRadius: 12, overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}>
            {liveItems.slice(0, 15).map((item, i) => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '12px 16px',
                borderBottom: i < Math.min(liveItems.length, 15) - 1
                  ? '1px solid #F3F4F6' : 'none',
                background: item.isViolent ? '#FFF8F7' : '#fff',
              }}>
                {/* Source */}
                <span style={{
                  fontSize: 8, fontWeight: 900, letterSpacing: '0.08em',
                  textTransform: 'uppercase', padding: '3px 7px', borderRadius: 3,
                  background: SOURCE_COLOR[item.source], color: '#fff',
                  flexShrink: 0, marginTop: 2,
                }}>{SOURCE_LABEL[item.source]}</span>

                {/* Type */}
                <span style={{
                  fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.05em', padding: '3px 7px', borderRadius: 3,
                  background: item.isViolent ? '#FEE2E2' : '#F3F4F6',
                  color: item.isViolent ? '#7F1D1D' : '#374151',
                  flexShrink: 0, marginTop: 1,
                }}>{item.type.replace(/_/g, ' ').slice(0, 14)}</span>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13.5, fontWeight: 600, color: '#121315',
                    lineHeight: 1.35,
                  }}>{item.title}</div>
                  {item.block && (
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                      {item.block}
                    </div>
                  )}
                </div>

                {/* Meta */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#121315' }}>
                    {item.distMi < 0.1 ? '<0.1' : item.distMi.toFixed(1)} mi
                  </div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
                    near {item.campus}
                  </div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                    {fmtAgo(item.tsMs)}
                  </div>
                </div>
              </div>
            ))}
            {liveItems.length > 15 && (
              <div style={{
                padding: '10px 16px', background: '#F9FAFB',
                borderTop: '1px solid #F3F4F6',
                fontSize: 12, color: '#6B7280', textAlign: 'center',
              }}>
                + {liveItems.length - 15} more incidents in the last 24 hours
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── CHAPTER 2: CONTAGION ── */}
      {dangerousZones.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
            color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 12,
          }}>
            Contagion — Active Zones Near Our Schools
          </div>
          <div style={{
            background: '#fff', border: '1px solid #E7E2D8',
            borderRadius: 12, overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}>
            {dangerousZones.slice(0, 6).map((zone, i) => {
              const isRetWin = zone.retWin;
              const phaseColor = isRetWin ? '#D45B4F'
                : zone.phase === 'ACUTE' ? '#DC2626'
                : '#C66C3D';
              const phaseBg = isRetWin ? '#FEF2F2'
                : zone.phase === 'ACUTE' ? '#FEF2F2'
                : '#FFF4EE';
              const phaseLabel = isRetWin ? 'RET. WINDOW'
                : zone.phase === 'ACUTE' ? 'ACUTE'
                : 'ACTIVE';
              const phaseDesc = isRetWin ? 'Peak retaliation risk — 18–72h window'
                : zone.phase === 'ACUTE' ? '0–72h · High risk'
                : '3–14 days · Elevated risk';

              // Find nearest campus to this zone
              const nearest = nearestCampus(zone.lat, zone.lng);

              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px',
                  borderBottom: i < dangerousZones.slice(0, 6).length - 1
                    ? '1px solid #F3F4F6' : 'none',
                  background: phaseBg,
                }}>
                  <span style={{
                    fontSize: 8, fontWeight: 900, letterSpacing: '0.08em',
                    textTransform: 'uppercase', padding: '3px 7px', borderRadius: 3,
                    background: phaseColor, color: '#fff', flexShrink: 0,
                  }}>{phaseLabel}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#121315' }}>
                      {zone.block || zone.communityArea || 'Nearby corridor'} — Homicide trigger
                    </div>
                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                      {phaseDesc} · {Math.round(zone.ageH)}h elapsed · {zone.daysLeft}d remaining
                      {zone.gang ? ' · Gang-related' : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: phaseColor }}>
                      {nearest.dist.toFixed(1)} mi
                    </div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
                      near {nearest.name}
                    </div>
                  </div>
                </div>
              );
            })}
            <div style={{
              padding: '10px 16px', background: '#FAFAF8',
              borderTop: '1px solid #F3F4F6', fontSize: 11, color: '#6B7280',
            }}>
              {retWinZones.length > 0 && (
                <span style={{ marginRight: 16 }}>
                  <strong style={{ color: '#D45B4F' }}>{retWinZones.length}</strong> retaliation window{retWinZones.length !== 1 ? 's' : ''} open
                </span>
              )}
              <span style={{ marginRight: 16 }}>
                <strong style={{ color: '#DC2626' }}>{acuteZones.length}</strong> ACUTE
              </span>
              <span style={{ marginRight: 16 }}>
                <strong style={{ color: '#C66C3D' }}>{activeZones.length}</strong> ACTIVE
              </span>
              <span>
                <strong style={{ color: '#B79145' }}>{watchZones.length}</strong> WATCH
              </span>
              <span style={{ marginLeft: 8, color: '#9CA3AF' }}>
                · Model: Papachristos et al., Yale/UChicago · updates every 90s
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── CHAPTER 3: ICE ── */}
      {iceAlerts.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
            color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 12,
          }}>
            ICE Activity Near Our Schools
          </div>
          <div style={{
            background: '#F5F3FF', border: '1px solid #DDD6FE',
            borderLeft: '4px solid #7C3AED',
            borderRadius: 12, padding: '16px 18px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{
                fontSize: 9, fontWeight: 900, letterSpacing: '0.1em',
                textTransform: 'uppercase', padding: '3px 8px', borderRadius: 3,
                background: '#7C3AED', color: '#fff',
              }}>ICE</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#4C1D95' }}>
                {iceAlerts.length} enforcement report{iceAlerts.length !== 1 ? 's' : ''} near our campuses
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#5B21B6', lineHeight: 1.6 }}>
              Lock exterior doors. Contact Network Legal. Review shelter-in-place protocol.
            </div>
          </div>
        </div>
      )}

      {/* ── CHAPTER 4: CAMPUS LIST ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
          color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 12,
        }}>
          All Campuses — {CAMPUSES.length} total · {elevatedCount} elevated
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {sorted.map(risk => {
            const campus = CAMPUSES.find(c => c.id === risk.campusId)!;
            const colors = RISK_COLORS[risk.label];
            const badges = campusBadges.get(risk.campusId)!;
            const isElevated = risk.label !== 'LOW';

            return (
              <div key={risk.campusId}
                onClick={() => onSelectCampus(risk.campusId)}
                style={{
                  padding: '11px 14px', borderRadius: 10, cursor: 'pointer',
                  border: `1px solid ${isElevated ? colors.color + '44' : '#E7E2D8'}`,
                  background: isElevated ? colors.bg : '#fff',
                  transition: 'transform 0.1s, box-shadow 0.1s',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateX(3px)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span style={{
                  fontSize: 9, fontWeight: 700, color: '#fff',
                  background: colors.color, padding: '2px 7px', borderRadius: 4,
                  flexShrink: 0,
                }}>{risk.label}</span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: 700, fontSize: 13.5, color: '#121315' }}>
                    {campus.short}
                  </span>
                  <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 8 }}>
                    {campus.communityArea}
                  </span>
                  {isElevated && (
                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 3 }}>
                      {getSituation(risk)}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'center' }}>
                  {risk.inRetaliationWindow && (
                    <span style={{
                      fontSize: 8, fontWeight: 800, color: '#fff',
                      background: '#D45B4F', padding: '2px 5px', borderRadius: 3,
                    }}>RET</span>
                  )}
                  {badges?.ice && (
                    <span style={{
                      fontSize: 8, fontWeight: 800, color: '#fff',
                      background: '#7C3AED', padding: '2px 5px', borderRadius: 3,
                    }}>ICE</span>
                  )}
                  {badges?.shot && (
                    <span style={{
                      fontSize: 8, fontWeight: 800, color: '#fff',
                      background: '#0D9488', padding: '2px 5px', borderRadius: 3,
                    }}>SHOT</span>
                  )}
                  <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 4 }}>→</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CHAPTER 5: DATA SOURCES — collapsed ── */}
      <div style={{ borderTop: '1px solid #E7E2D8', paddingTop: 8 }}>
        <button
          onClick={() => setSourcesOpen(o => !o)}
          style={{
            width: '100%', padding: '14px 0', background: 'transparent', border: 'none',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#6B7280',
          }}
        >
          <span>Data Sources & Freshness</span>
          <span style={{
            fontSize: 11,
            transform: sourcesOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s', display: 'inline-block',
          }}>▼</span>
        </button>

        {sourcesOpen && (
          <div style={{ paddingTop: 12, paddingBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 12, lineHeight: 1.6 }}>
              The feed above draws from live sources only — Citizen, CPD Radio, and news feeds.
              These update in minutes to hours. CPD verified crime data has a 5–10 day publication
              lag and is used only for the contagion model, never the live feed.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
              {[
                {
                  badge: 'LIVE', color: '#059669',
                  label: 'Citizen App',
                  value: 'Near-real-time community reports · Minutes fresh',
                },
                {
                  badge: 'LIVE', color: '#B79145',
                  label: 'CPD Radio (Scanner)',
                  value: scannerCalls > 0
                    ? `${scannerCalls} calls monitored · ${scannerSpikeZones} spike zone${scannerSpikeZones !== 1 ? 's' : ''}`
                    : 'Monitoring · No spike activity',
                },
                {
                  badge: 'NEWS', color: '#7C3AED',
                  label: 'News Feeds',
                  value: `${newsSourceCount} sources · ${newsIncidentCount} incidents geocoded · Hours fresh`,
                },
                {
                  badge: 'ICE', color: '#7C3AED',
                  label: 'ICE Monitoring',
                  value: `${iceAlerts.length} active alert${iceAlerts.length !== 1 ? 's' : ''}`,
                },
                {
                  badge: 'LAGGED', color: '#9CA3AF',
                  label: 'CPD Verified Crime Data',
                  value: `${(cpdCount ?? 0).toLocaleString()} incidents · 5–10 day publication lag · Used for contagion model only`,
                  warn: true,
                },
                {
                  badge: 'ACOUSTIC', color: '#0D9488',
                  label: 'ShotSpotter',
                  value: shotSpotterEvents?.length > 0
                    ? `${shotSpotterEvents.length} activations detected`
                    : 'No recent gunfire detected',
                },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{
                    fontSize: 8, fontWeight: 800, color: '#fff',
                    background: row.color, padding: '2px 6px', borderRadius: 3,
                    flexShrink: 0, marginTop: 2, minWidth: 52, textAlign: 'center',
                  }}>{row.badge}</span>
                  <div>
                    <span style={{ fontWeight: 600, color: '#374151' }}>{row.label}</span>
                    <div style={{ color: '#6B7280', fontSize: 11, marginTop: 1 }}>{row.value}</div>
                    {row.warn && (
                      <div style={{ color: '#B79145', fontSize: 10, marginTop: 1 }}>
                        ⚠ Not used in the live feed — pattern data only
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

function getSituation(risk: CampusRisk): string {
  if (risk.inRetaliationWindow) {
    const zone = risk.contagionZones?.find(z => z.retWin);
    if (zone) return `Retaliation window open — homicide ${zone.distanceFromCampus?.toFixed(1) ?? '?'}mi away, ${Math.round(zone.ageH)}h ago`;
    return 'Active retaliation window open';
  }
  const acute = risk.contagionZones?.filter(z => z.phase === 'ACUTE') ?? [];
  if (acute.length > 0) return `${acute.length} ACUTE contagion zone${acute.length > 1 ? 's' : ''} nearby`;
  const active = risk.contagionZones?.filter(z => z.phase === 'ACTIVE') ?? [];
  if (active.length > 0) return `${active.length} ACTIVE contagion zone${active.length > 1 ? 's' : ''} nearby`;
  if (risk.label === 'HIGH') return 'Elevated violent activity nearby in last 14 days';
  if (risk.label === 'ELEVATED') return 'Increased violent activity nearby in last 14 days';
  return '';
}
