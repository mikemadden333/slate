/**
 * NetworkDashboard — Watch Network View
 *
 * Chapter 1: Four Questions — direct answers to what leadership needs
 * Chapter 2: The Brief — exec summary + who to call
 * Chapter 3: Campus Heat Board — all 17, sorted by risk
 * Chapter 4: Tools — forecast, collapsed
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

export default function NetworkDashboard({
  risks, summary, forecast, iceAlerts, shotSpotterEvents, acuteIncidents, onSelectCampus,
}: Props) {
  const [toolsOpen, setToolsOpen] = useState(false);
  const sorted = [...risks].sort((a, b) => b.score - a.score);

  // Per-campus badges
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

  const allZones = risks.flatMap(r => r.contagionZones);
  const callRecs = getPrincipalCallList(risks, allZones, acuteIncidents);
  const elevatedCampuses = sorted.filter(r => r.label !== 'LOW');
  const retWindows = sorted.filter(r => r.inRetaliationWindow);
  const calmCount = Math.min(sorted.length, 17) - elevatedCampuses.length;

  // Four Questions data
  const VIOLENT = new Set(['HOMICIDE','MURDER','SHOOTING','BATTERY','ROBBERY','ASSAULT','WEAPONS VIOLATION']);
  const now = Date.now();

  const overnightViolent = acuteIncidents.filter(inc => {
    if (!VIOLENT.has(inc.type)) return false;
    const ageH = (now - new Date(inc.date).getTime()) / 3600000;
    if (ageH > 12) return false;
    return CAMPUSES.some(c => haversine(c.lat, c.lng, inc.lat, inc.lng) <= 1.0);
  });

  const daytimeViolent = acuteIncidents.filter(inc => {
    if (!VIOLENT.has(inc.type)) return false;
    const ageH = (now - new Date(inc.date).getTime()) / 3600000;
    if (ageH > 4) return false;
    return CAMPUSES.some(c => haversine(c.lat, c.lng, inc.lat, inc.lng) <= 1.0);
  });

  const risingContagion = allZones.filter(z => z.phase === 'ACUTE' || z.phase === 'ACTIVE');
  const needsAttention = sorted.filter(r => r.label !== 'LOW');

  const timeStr = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px 32px' }}>

      {/* ── CHAPTER 1: FOUR QUESTIONS ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 12 }}>
          {greeting} · As of {timeStr}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>

          {/* Q1: Overnight violence */}
          <QuestionCard
            question="Overnight violent crime near our schools?"
            answer={overnightViolent.length === 0 ? 'None reported' : `${overnightViolent.length} incident${overnightViolent.length !== 1 ? 's' : ''}`}
            detail={overnightViolent.length === 0
              ? 'No violent incidents near any campus in the last 12 hours.'
              : overnightViolent.slice(0, 2).map(i => {
                  const c = CAMPUSES.reduce((best, c) => haversine(c.lat, c.lng, i.lat, i.lng) < haversine(best.lat, best.lng, i.lat, i.lng) ? c : best);
                  return `${i.type} near ${c.short}`;
                }).join(' · ')}
            status={overnightViolent.length === 0 ? 'clear' : 'alert'}
          />

          {/* Q2: Daytime/dismissal violence */}
          <QuestionCard
            question="Active violence impacting dismissal?"
            answer={daytimeViolent.length === 0 ? 'None reported' : `${daytimeViolent.length} incident${daytimeViolent.length !== 1 ? 's' : ''}`}
            detail={daytimeViolent.length === 0
              ? 'No violent incidents near campuses in the last 4 hours.'
              : daytimeViolent.slice(0, 2).map(i => {
                  const c = CAMPUSES.reduce((best, c) => haversine(c.lat, c.lng, i.lat, i.lng) < haversine(best.lat, best.lng, i.lat, i.lng) ? c : best);
                  return `${i.type} near ${c.short}`;
                }).join(' · ')}
            status={daytimeViolent.length === 0 ? 'clear' : 'alert'}
          />

          {/* Q3: Contagion */}
          <QuestionCard
            question="Rising contagion zones to watch?"
            answer={risingContagion.length === 0 ? 'None active' : `${risingContagion.length} zone${risingContagion.length !== 1 ? 's' : ''}`}
            detail={risingContagion.length === 0
              ? 'No ACUTE or ACTIVE contagion zones near any campus.'
              : risingContagion.slice(0, 2).map(z => `${z.phase} — ${z.communityArea ?? 'nearby'}`).join(' · ')}
            status={risingContagion.length === 0 ? 'clear' : risingContagion.some(z => z.phase === 'ACUTE') ? 'alert' : 'warn'}
          />

          {/* Q4: Campuses needing attention */}
          <QuestionCard
            question="Campuses needing extra attention?"
            answer={needsAttention.length === 0 ? 'All clear' : `${needsAttention.length} campus${needsAttention.length !== 1 ? 'es' : ''}`}
            detail={needsAttention.length === 0
              ? 'All 17 campuses are at LOW risk.'
              : needsAttention.slice(0, 3).map(r => {
                  const c = CAMPUSES.find(x => x.id === r.campusId);
                  return `${c?.short ?? '?'} (${r.label})`;
                }).join(' · ')}
            status={needsAttention.length === 0 ? 'clear' : needsAttention.some(r => r.label === 'HIGH' || r.label === 'CRITICAL') ? 'alert' : 'warn'}
          />
        </div>
      </div>

      {/* ── CHAPTER 2: THE BRIEF ── */}
      <div style={{
        background: '#FAFAF8', border: '1px solid #E7E2D8',
        borderLeft: '4px solid #121315',
        borderRadius: 12, padding: '20px 20px', marginBottom: 20,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#121315', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Network Brief
        </div>
        <div style={{ fontSize: 15, color: '#121315', lineHeight: 1.8, marginBottom: callRecs.length > 0 ? 20 : 0 }}>
          {generateExecBriefing(calmCount, elevatedCampuses, retWindows, iceAlerts, summary)}
        </div>

        {callRecs.length > 0 && (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#121315', marginBottom: 10, paddingTop: 16, borderTop: '1px solid #E7E2D8' }}>
              Who to call today
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {callRecs.map(rec => {
                const urgColor = rec.urgency === 'CALL NOW' ? '#D45B4F' : rec.urgency === 'CALL TODAY' ? '#B79145' : '#6B7280';
                return (
                  <div key={rec.campusId} style={{
                    borderLeft: `3px solid ${urgColor}`,
                    padding: '12px 14px', borderRadius: 8,
                    background: '#fff', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
                  }} onClick={() => onSelectCampus(rec.campusId)}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: urgColor, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{rec.urgency}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#121315' }}>{rec.campusName}</span>
                      </div>
                      <div style={{ fontSize: 13, color: '#374151' }}>{rec.reason}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button onClick={e => { e.stopPropagation(); void navigator.clipboard?.writeText(rec.suggestedMessage); }} style={{
                        background: 'none', border: '1px solid #E5E7EB', borderRadius: 6,
                        padding: '4px 10px', fontSize: 11, color: '#6B7280', cursor: 'pointer',
                      }}>Copy</button>
                      <button onClick={e => { e.stopPropagation(); onSelectCampus(rec.campusId); }} style={{
                        background: 'none', border: '1px solid #121315', borderRadius: 6,
                        padding: '4px 10px', fontSize: 11, color: '#121315', fontWeight: 600, cursor: 'pointer',
                      }}>View →</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
        {callRecs.length === 0 && (
          <div style={{ padding: '12px 14px', background: '#F0FDF4', borderRadius: 8, color: '#15803D', fontSize: 13, marginTop: 12 }}>
            All campuses in normal conditions. No calls recommended today.
          </div>
        )}
      </div>

      {/* ── CHAPTER 3: CAMPUS HEAT BOARD ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#121315', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          All Campuses — 17 total · {elevatedCampuses.length} elevated
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {sorted.map(risk => {
            const campus = CAMPUSES.find(c => c.id === risk.campusId)!;
            const colors = RISK_COLORS[risk.label];
            const badges = campusBadges.get(risk.campusId)!;
            const isElevated = risk.label !== 'LOW';

            return (
              <div key={risk.campusId} onClick={() => onSelectCampus(risk.campusId)} style={{
                padding: '12px 16px', borderRadius: 10,
                border: `1px solid ${isElevated ? colors.color + '44' : '#E7E2D8'}`,
                background: isElevated ? colors.bg : '#fff',
                cursor: 'pointer', transition: 'transform 0.1s, box-shadow 0.1s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(3px)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontFamily: "'SF Mono', monospace", fontSize: 22, fontWeight: 800, color: colors.color, width: 40, textAlign: 'right', flexShrink: 0 }}>
                    {risk.score}
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', background: colors.color, padding: '2px 7px', borderRadius: 4 }}>
                    {risk.label}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#121315' }}>{campus.short}</span>
                    <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 8 }}>{campus.communityArea}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    {risk.inRetaliationWindow && <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: '#D45B4F', padding: '2px 5px', borderRadius: 3 }}>RET</span>}
                    {badges.ice && <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: '#7C3AED', padding: '2px 5px', borderRadius: 3 }}>ICE</span>}
                    {badges.shot && <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: '#0D9488', padding: '2px 5px', borderRadius: 3 }}>SHOT</span>}
                    {badges.inc24h > 0 && <span style={{ fontSize: 9, fontWeight: 700, color: '#374151', background: '#F3F4F6', padding: '2px 6px', borderRadius: 3 }}>{badges.inc24h}</span>}
                  </div>
                  <span style={{ fontSize: 12, color: '#9CA3AF', flexShrink: 0 }}>→</span>
                </div>
                {isElevated && (
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 6, paddingLeft: 52 }}>
                    {getSituation(risk)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CHAPTER 4: TOOLS ── */}
      <div style={{ borderTop: '1px solid #E7E2D8', paddingTop: 8 }}>
        <button onClick={() => setToolsOpen(o => !o)} style={{
          width: '100%', padding: '14px 0', background: 'transparent', border: 'none',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#6B7280',
        }}>
          <span>Tools & Details</span>
          <span style={{ fontSize: 11, transform: toolsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>▼</span>
        </button>
        {toolsOpen && (
          <div style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <WeekForecast forecast={forecast} />
            {/* Network Data Sources */}
            <div style={{ borderTop: '1px solid #E7E2D8', paddingTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#121315', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Data Sources — Network View
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                {[
                  { badge: 'VERIFIED', color: '#121315', label: 'CPD Verified', value: `${(cpdCount ?? 0).toLocaleString()} incidents loaded — 5-10 day publication lag`, warn: true },
                  { badge: 'LIVE', color: '#0D9488', label: 'CPD Radio', value: scannerCalls > 0 ? `${scannerCalls} calls monitored — ${scannerSpikeZones} spike zone${scannerSpikeZones !== 1 ? 's' : ''}` : 'No scanner traffic' },
                  { badge: 'NEWS', color: '#3B82F6', label: 'News Feeds', value: `${newsSourceCount} sources active — ${newsIncidentCount} incidents geocoded` },
                  { badge: 'SOCIAL', color: '#FF4500', label: 'Reddit Intel', value: redditIncidentCount > 0 ? `${redditIncidentCount} incidents from r/ChicagoScanner + r/CrimeInChicago` : 'Monitoring — no violence posts in last 24h' },
                  { badge: 'ICE', color: '#7C3AED', label: 'ICE Monitoring', value: `Active — ${iceAlerts.length} alert${iceAlerts.length !== 1 ? 's' : ''}` },
                  { badge: 'ACOUSTIC', color: '#0D9488', label: 'ShotSpotter', value: (shotSpotterEvents?.length ?? 0) > 0 ? `${shotSpotterEvents.length} activations` : 'No recent gunfire detected' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: row.color, padding: '2px 6px', borderRadius: 3, flexShrink: 0, marginTop: 1, minWidth: 54, textAlign: 'center' }}>
                      {row.badge}
                    </span>
                    <div>
                      <span style={{ fontWeight: 600, color: '#374151' }}>{row.label}</span>
                      <div style={{ color: '#6B7280', fontSize: 11 }}>{row.value}</div>
                      {row.warn && <div style={{ color: '#B79145', fontSize: 10, marginTop: 1 }}>⚠ CPD portal has a 5-10 day publication lag</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Question Card ── */
function QuestionCard({ question, answer, detail, status }: {
  question: string; answer: string; detail: string;
  status: 'clear' | 'warn' | 'alert';
}) {
  const colors = status === 'clear'
    ? { border: '#D1FAE5', bg: '#F0FDF4', answer: '#15803D', dot: '#16A34A' }
    : status === 'warn'
    ? { border: '#FDE68A', bg: '#FFFBEB', answer: '#B79145', dot: '#B79145' }
    : { border: '#FECACA', bg: '#FEF2F2', answer: '#D45B4F', dot: '#D45B4F' };

  return (
    <div style={{
      border: `1px solid ${colors.border}`, borderRadius: 12,
      padding: '14px 16px', background: colors.bg,
    }}>
      <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6, lineHeight: 1.4 }}>{question}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors.dot, flexShrink: 0 }} />
        <div style={{ fontSize: 16, fontWeight: 800, color: colors.answer }}>{answer}</div>
      </div>
      <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.5 }}>{detail}</div>
    </div>
  );
}

/* ── Campus situation one-liner ── */
function getSituation(risk: CampusRisk): string {
  if (risk.inRetaliationWindow) {
    const zone = risk.contagionZones.find(z => z.retWin);
    if (zone) return `Retaliation window open — homicide ${zone.distanceFromCampus?.toFixed(1) ?? '?'}mi, ${Math.round(zone.ageH)}h ago`;
    return 'Active retaliation window';
  }
  const acute = risk.contagionZones.filter(z => z.phase === 'ACUTE');
  if (acute.length > 0) return `${acute.length} ACUTE contagion zone${acute.length > 1 ? 's' : ''} nearby`;
  const active = risk.contagionZones.filter(z => z.phase === 'ACTIVE');
  if (active.length > 0) return `${active.length} active contagion zone${active.length > 1 ? 's' : ''} nearby`;
  if (risk.label === 'HIGH') return 'Elevated violent activity nearby in last 14 days.';
  if (risk.label === 'ELEVATED') return 'Increased violent activity nearby in last 14 days.';
  return '';
}

/* ── Exec briefing text ── */
function generateExecBriefing(
  calmCount: number, elevated: CampusRisk[], retWindows: CampusRisk[],
  iceAlerts: IceAlert[], summary: NetworkSummary,
): string {
  const parts: string[] = [];
  const totalCampuses = 17;
  const actualCalm = totalCampuses - elevated.length;
  parts.push(`${actualCalm} of ${totalCampuses} campuses are in normal conditions.`);
  if (elevated.length > 0) {
    const names = elevated.slice(0, 3).map(r => CAMPUSES.find(c => c.id === r.campusId)?.short ?? '?');
    const nameStr = names.length <= 2 ? names.join(' and ') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
    parts.push(`${nameStr} ${elevated.length === 1 ? 'is' : 'are'} at elevated risk.`);
  }
  if (retWindows.length > 0) {
    parts.push(`${retWindows.length} campus${retWindows.length !== 1 ? 'es have' : ' has'} an open retaliation window — priority today.`);
  }
  if (iceAlerts.length > 0) {
    parts.push(`ICE activity reported near ${iceAlerts.length} campus${iceAlerts.length !== 1 ? 'es' : ''}.`);
  }
  return parts.join(' ');
}
