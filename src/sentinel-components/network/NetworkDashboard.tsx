/**
 * NetworkDashboard — The Executive Experience.
 *
 * Network Status Bar: 4 tappable metric tiles.
 * Executive Morning Briefing.
 * Campus Intelligence Grid: 18 rows sorted by score.
 * Network Forecast.
 */

import { useState } from 'react';
import type {
  CampusRisk, NetworkSummary, ForecastDay, IceAlert,
  ShotSpotterEvent, Incident,
} from '../../sentinel-engine/types';
import { CAMPUSES } from '../../sentinel-data/campuses';
import { RISK_COLORS } from '../../sentinel-data/weights';
import { haversine, ageInHours } from '../../sentinel-engine/geo';
import { getPrincipalCallList } from '../../sentinel-engine/principalPriority';
import WeekForecast from '../campus/WeekForecast';
import Explainer from '../shared/Explainer';

interface Props {
  risks: CampusRisk[];
  summary: NetworkSummary;
  forecast: ForecastDay[];
  iceAlerts: IceAlert[];
  shotSpotterEvents: ShotSpotterEvent[];
  acuteIncidents: Incident[];
  onSelectCampus: (id: number) => void;
}

type MetricFilter = 'all' | 'elevated' | 'contagion' | 'ice';

export default function NetworkDashboard({
  risks, summary, forecast, iceAlerts, shotSpotterEvents, acuteIncidents, onSelectCampus,
}: Props) {
  const [filter, setFilter] = useState<MetricFilter>('all');
  const sorted = [...risks].sort((a, b) => b.score - a.score);

  // Precompute per-campus data
  const campusBadges = new Map<number, { ice: boolean; shot: boolean; inc24h: number }>();
  for (const campus of CAMPUSES) {
    const hasIce = iceAlerts.some(a => {
      if (a.lat == null || a.lng == null) return a.nearestCampusId === campus.id;
      return haversine(campus.lat, campus.lng, a.lat, a.lng) <= 1.0;
    });
    const hasShot = shotSpotterEvents.some(s =>
      ageInHours(s.date) <= 24 && haversine(campus.lat, campus.lng, s.lat, s.lng) <= 0.5,
    );
    let inc24h = 0;
    for (const inc of acuteIncidents) {
      if (ageInHours(inc.date) <= 24 && haversine(campus.lat, campus.lng, inc.lat, inc.lng) <= 0.5) inc24h++;
    }
    campusBadges.set(campus.id, { ice: hasIce, shot: hasShot, inc24h });
  }

  // Principal call recommendations
  const allZones = risks.flatMap(r => r.contagionZones);
  const callRecs = getPrincipalCallList(risks, allZones, acuteIncidents);

  const filtered = sorted.filter(risk => {
    if (filter === 'all') return true;
    if (filter === 'elevated') return risk.label !== 'LOW';
    if (filter === 'contagion') return risk.contagionZones.some(z => z.phase === 'ACUTE' || z.phase === 'ACTIVE');
    if (filter === 'ice') return campusBadges.get(risk.campusId)?.ice ?? false;
    return true;
  });

  const getSituation = (risk: CampusRisk): string => {
    if (risk.inRetaliationWindow) {
      const zone = risk.contagionZones.find(z => z.retWin);
      if (zone) return `Retaliation window open — homicide ${zone.distanceFromCampus?.toFixed(1) ?? '?'}mi, ${Math.round(zone.ageH)}h ago`;
      return 'Active retaliation window';
    }
    const acute = risk.contagionZones.filter(z => z.phase === 'ACUTE');
    if (acute.length > 0) return `${acute.length} ACUTE contagion zone${acute.length > 1 ? 's' : ''} nearby`;
    const active = risk.contagionZones.filter(z => z.phase === 'ACTIVE');
    if (active.length > 0) return `${active.length} active contagion zone${active.length > 1 ? 's' : ''} nearby`;
    if (risk.label === 'LOW') return 'Quiet — no significant incidents in 24h';
    return `${risk.closeCount} incidents within 0.5mi/24h`;
  };

  // Executive briefing
  const elevatedCampuses = sorted.filter(r => r.label !== 'LOW');
  const retWindows = sorted.filter(r => r.inRetaliationWindow);
  const calmCount = sorted.length - elevatedCampuses.length;

  const briefing = generateExecBriefing(calmCount, elevatedCampuses, retWindows, iceAlerts, summary);

  // Status bar color
  const barBg = summary.campusesElevated === 0 ? '#EEF2F9' :
    summary.campusesElevated <= 3 ? '#FFFBEB' : '#FEF2F2';

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '16px 16px 0' }}>
      {/* Network Status Bar */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 8, marginBottom: 20, padding: 12, borderRadius: 12,
        background: barBg,
      }}>
        <MetricTile label="Network Avg" value={String(summary.avgScore)}
          sub={summary.trends.scoreVsLastWeek !== 0 ? `${summary.trends.scoreVsLastWeek > 0 ? '↑' : '↓'}${Math.abs(summary.trends.scoreVsLastWeek).toFixed(0)} vs last wk` : 'stable'}
          active={filter === 'all'} onClick={() => setFilter('all')} color="#1B3A6B" />
        <MetricTile label="Elevated" value={`${summary.campusesElevated}`}
          sub="of 17" active={filter === 'elevated'} onClick={() => setFilter('elevated')}
          color={summary.campusesElevated > 0 ? '#D97706' : '#0EA5E9'} />
        <MetricTile label="Contagion" value={`${summary.acuteZones + summary.activeZones}`}
          sub={`${summary.acuteZones} ACUTE · ${summary.activeZones} ACTIVE`}
          active={filter === 'contagion'} onClick={() => setFilter('contagion')}
          color={summary.acuteZones > 0 ? '#DC2626' : summary.activeZones > 0 ? '#D97706' : '#0EA5E9'} />
        <MetricTile label="ICE" value={summary.iceAlerts > 0 ? 'ACTIVE' : 'CLEAR'}
          sub={summary.iceAlerts > 0 ? `${summary.iceAlerts} alert${summary.iceAlerts !== 1 ? 's' : ''}` : 'No reports'}
          active={filter === 'ice'} onClick={() => setFilter('ice')}
          color={summary.iceAlerts > 0 ? '#7C3AED' : '#0EA5E9'} />
      </div>

      {/* Executive Morning Briefing */}
      <div style={{
        borderLeft: '4px solid #1B3A6B', padding: '20px', marginBottom: 20,
        background: '#FEF9EC', borderRadius: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, fontWeight: 700, color: '#1B3A6B', marginBottom: 12, paddingLeft: 12, borderLeft: '3px solid #F0B429' }}>
          Noble Network
          <Explainer title="Noble Network">
            <p style={{ margin: '0 0 12px' }}>The Network Intelligence view provides a holistic picture across all 18 Noble campuses. Campuses are ranked by risk score and tagged with badges for active conditions.</p>
            <p style={{ margin: '0 0 12px' }}><strong>RET</strong> = active retaliation window. <strong>ICE</strong> = ICE enforcement activity nearby. <strong>SHOT</strong> = ShotSpotter gunfire detected nearby.</p>
            <p style={{ margin: 0 }}>Use the metric tiles to filter campuses by condition. Tap any campus row to switch to its detailed view.</p>
          </Explainer>
        </div>
        <div style={{ fontSize: 16, color: '#1B3A6B', lineHeight: 1.8 }}>
          {briefing}
        </div>

        {/* Principal Call Recommendations */}
        {callRecs.length > 0 ? (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1B3A6B' }}>
              Which principals should I call today?
            </div>
            {callRecs.map(rec => {
              const urgColors = rec.urgency === 'CALL NOW'
                ? { border: '#DC2626', bg: '#FEF2F220' }
                : rec.urgency === 'CALL TODAY'
                  ? { border: '#D97706', bg: '#FFFBEB20' }
                  : { border: '#1B3A6B', bg: 'transparent' };
              return (
                <div key={rec.campusId} style={{
                  borderLeft: `4px solid ${urgColors.border}`,
                  background: urgColors.bg,
                  padding: '14px 16px',
                  borderRadius: 8,
                  cursor: 'pointer',
                }} onClick={() => onSelectCampus(rec.campusId)}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 800,
                      color: urgColors.border,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                    }}>
                      {rec.urgency}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#1B3A6B' }}>
                      {rec.campusName}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                    {rec.reason}
                  </div>
                  {rec.detail !== 'No additional context.' && (
                    <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>
                      {rec.detail}
                    </div>
                  )}
                  <div style={{
                    fontSize: 12, color: '#6B7280', fontStyle: 'italic',
                    padding: '8px 12px', background: '#F8F9FA', borderRadius: 6,
                  }}>
                    <strong>Suggested opener:</strong> {rec.suggestedMessage}
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); void navigator.clipboard?.writeText(rec.suggestedMessage); }}
                      style={{
                        background: 'none', border: '1px solid #E5E7EB', borderRadius: 6,
                        padding: '4px 12px', fontSize: 12, color: '#6B7280', cursor: 'pointer',
                      }}
                    >
                      Copy message
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelectCampus(rec.campusId); }}
                      style={{
                        background: 'none', border: '1px solid #1B3A6B', borderRadius: 6,
                        padding: '4px 12px', fontSize: 12, color: '#1B3A6B', fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      View campus →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ marginTop: 16, padding: '14px 16px', background: '#F0FDF4', borderRadius: 10, color: '#15803D', fontSize: 14, lineHeight: 1.6 }}>
            All campuses are operating in normal conditions today. No calls recommended based on current data.
          </div>
        )}
      </div>

      {/* Network Forecast */}
      <WeekForecast forecast={forecast} />

      {/* Campus Intelligence Grid */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#6B7280' }}>
          {filter === 'all' ? 'All 18 campuses' : `Showing ${filtered.length} campus${filtered.length !== 1 ? 'es' : ''}`}
          {filter !== 'all' && (
            <button onClick={() => setFilter('all')} style={{
              marginLeft: 8, background: 'none', border: 'none', color: '#1B3A6B',
              fontSize: 12, cursor: 'pointer', textDecoration: 'underline',
            }}>
              Show all
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
        {filtered.map(risk => {
          const campus = CAMPUSES.find(c => c.id === risk.campusId)!;
          const colors = RISK_COLORS[risk.label];
          const badges = campusBadges.get(risk.campusId)!;
          const barWidth = Math.max(3, risk.score);
          const situation = getSituation(risk);

          return (
            <div
              key={risk.campusId}
              onClick={() => onSelectCampus(risk.campusId)}
              style={{
                padding: '12px 16px', borderRadius: 10,
                border: `1px solid ${colors.color}33`,
                background: risk.score >= 45 ? colors.bg : '#fff',
                cursor: 'pointer',
                transition: 'transform 0.1s ease, box-shadow 0.1s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{
                  fontFamily: "'SF Mono', monospace", fontSize: 24, fontWeight: 800,
                  color: colors.color, width: 44, textAlign: 'right', flexShrink: 0,
                }}>
                  {risk.score}
                </div>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: '#fff', background: colors.color,
                  padding: '2px 8px', borderRadius: 4, flexShrink: 0,
                }}>
                  {risk.label}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#1B3A6B' }}>{campus.short}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>{campus.communityArea}</div>
                </div>
                {badges.inc24h > 0 && (
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', background: '#F3F4F6', padding: '2px 8px', borderRadius: 4 }}>
                    {badges.inc24h}/24h
                  </div>
                )}
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  {risk.inRetaliationWindow && <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: '#DC2626', padding: '2px 5px', borderRadius: 3 }}>RET</span>}
                  {badges.ice && <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: '#7C3AED', padding: '2px 5px', borderRadius: 3 }}>ICE</span>}
                  {badges.shot && <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: '#0D9488', padding: '2px 5px', borderRadius: 3 }}>SHOT</span>}
                </div>
              </div>
              <div style={{ height: 6, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
                <div style={{
                  height: '100%', width: `${barWidth}%`,
                  background: `linear-gradient(90deg, ${colors.color}CC, ${colors.color})`,
                  borderRadius: 3, transition: 'width 0.3s ease',
                }} />
              </div>
              <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.4 }}>{situation}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MetricTile({ label, value, sub, active, onClick, color }: {
  label: string; value: string; sub: string; active: boolean; onClick: () => void; color: string;
}) {
  return (
    <button onClick={onClick} style={{
      padding: '14px 10px', borderRadius: 10,
      border: active ? `2px solid ${color}` : '1px solid #E5E7EB',
      background: active ? `${color}10` : '#fff',
      cursor: 'pointer', textAlign: 'center', minHeight: 44,
    }}>
      <div style={{ fontSize: 10, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: "'SF Mono', monospace" }}>{value}</div>
      <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>{sub}</div>
    </button>
  );
}

function generateExecBriefing(
  calmCount: number, elevated: CampusRisk[], retWindows: CampusRisk[],
  iceAlerts: IceAlert[], summary: NetworkSummary,
): string {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const parts: string[] = [];

  parts.push(`Good morning. As of ${timeStr}, ${calmCount} of 18 Noble campuses are operating in normal conditions.`);

  if (elevated.length > 0) {
    const names = elevated.slice(0, 3).map(r => CAMPUSES.find(c => c.id === r.campusId)?.short ?? '?');
    const nameStr = names.length <= 2 ? names.join(' and ') : names.join(', ');
    if (retWindows.length > 0) {
      parts.push(`${nameStr} ${elevated.length <= 1 ? 'is' : 'are'} in active contagion zones. ${retWindows.length} campus${retWindows.length !== 1 ? 'es have' : ' has'} an open retaliation window.`);
    } else {
      parts.push(`${nameStr} ${elevated.length <= 1 ? 'is' : 'are'} at elevated risk.`);
    }
  }

  if (iceAlerts.length > 0) {
    parts.push(`ICE activity has been reported near ${iceAlerts.length} Noble campus${iceAlerts.length !== 1 ? 'es' : ''}.`);
  } else {
    parts.push(`No ICE activity near any Noble campus.`);
  }

  if (summary.trends.incidentsVsLastWeek < 0) {
    parts.push(`This is the ${Math.abs(summary.trends.incidentsVsLastWeek).toFixed(0)}% below-average incident week network-wide.`);
  }

  return parts.join(' ');
}
