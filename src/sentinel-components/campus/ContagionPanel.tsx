/**
 * ContagionPanel — Section 4: Contagion Intelligence.
 *
 * "The science of how violence spreads — and what it means for your campus today"
 * QUIET: green reassurance. RETALIATION: animated red, countdown, progress bar, inline map.
 * ACTIVE: amber, progress bar, declining risk messaging. WATCH: collapsed single line.
 * Network contagion: shared corridor alerts.
 */

import { useState, useEffect } from 'react';
import type { ContagionZone, CampusRisk, ForecastDay } from '../../sentinel-engine/types';
import { CAMPUSES } from '../../sentinel-data/campuses';
import { compassLabel, fmtAgo } from '../../sentinel-engine/geo';
import { ChevronDown, ChevronRight } from 'lucide-react';
import ExplainModal, { ExplainLink } from '../shared/ExplainModal';
import Explainer from '../shared/Explainer';

const CONTAGION_KEYFRAMES = `
@keyframes contagionGlow {
  0%, 100% { box-shadow: 0 1px 4px rgba(0,0,0,0.3), 0 0 4px rgba(252,165,165,0.3); }
  50% { box-shadow: 0 1px 4px rgba(0,0,0,0.3), 0 0 12px rgba(252,165,165,0.8); }
}
`;

interface Props {
  zones: ContagionZone[];
  inRetaliationWindow: boolean;
  campusName: string;
  campusId: number;
  allRisks: CampusRisk[];
  forecast: ForecastDay[];
  onOpenForecast?: () => void;
  onBeginProtocol?: (code: string) => void;
}

const KEYFRAMES = `
@keyframes retGradient {
  0%, 100% { background: linear-gradient(135deg, #D45B4F, #991B1B); }
  50% { background: linear-gradient(135deg, #991B1B, #7F1D1D); }
}
@keyframes retPulse {
  0%, 100% { background-color: #D45B4F; }
  50% { background-color: #9B1C1C; }
}
`;

const PHASE_STYLES: Record<string, { color: string; bg: string }> = {
  ACUTE:  { color: '#D45B4F', bg: '#FEF2F2' },
  ACTIVE: { color: '#B79145', bg: '#FFFBEB' },
  WATCH:  { color: '#6B7280', bg: '#F3F4F6' },
};

/* ---- Network contagion helpers ---- */
interface CorridorGroup {
  incidentId: string;
  block?: string;
  campuses: { name: string; distance: number }[];
}

function findNetworkContagion(
  myZones: ContagionZone[], myCampusId: number, allRisks: CampusRisk[],
): CorridorGroup[] {
  const myAcuteIds = new Set(myZones.filter(z => z.phase === 'ACUTE').map(z => z.incidentId));
  if (myAcuteIds.size === 0) return [];

  const byIncident = new Map<string, { campuses: { name: string; distance: number }[]; block?: string }>();
  for (const risk of allRisks) {
    if (risk.campusId === myCampusId) continue;
    for (const z of risk.contagionZones) {
      if (z.phase === 'ACUTE' && myAcuteIds.has(z.incidentId)) {
        const campus = CAMPUSES.find(c => c.id === risk.campusId);
        if (!campus) continue;
        let entry = byIncident.get(z.incidentId);
        if (!entry) { entry = { campuses: [], block: z.block }; byIncident.set(z.incidentId, entry); }
        if (!entry.campuses.some(c => c.name === campus.name)) {
          entry.campuses.push({ name: campus.name, distance: z.distanceFromCampus ?? 0 });
        }
      }
    }
  }

  return Array.from(byIncident.entries()).map(([incidentId, data]) => ({
    incidentId, block: data.block, campuses: data.campuses,
  }));
}

/* ---- Forecast summary ---- */
function forecastContagionSummary(forecast: ForecastDay[]): {
  level: 'LOW' | 'ELEVATED' | 'HIGH'; throughDate: string | null;
} {
  const contagionDays = forecast.filter(d => d.contagionPhase === 'ACUTE' || d.contagionPhase === 'ACTIVE');
  if (contagionDays.length === 0) return { level: 'LOW', throughDate: null };
  const hasAcute = contagionDays.some(d => d.contagionPhase === 'ACUTE');
  return { level: hasAcute ? 'HIGH' : 'ELEVATED', throughDate: contagionDays[contagionDays.length - 1].date };
}

/* ---- Main component ---- */
export default function ContagionPanel({
  zones, inRetaliationWindow, campusName, campusId, allRisks, forecast, onOpenForecast, onBeginProtocol,
}: Props) {
  const [now, setNow] = useState(Date.now());
  const [watchExpanded, setWatchExpanded] = useState(false);
  const [showExplain, setShowExplain] = useState(false);
  const [showRetDismissal, setShowRetDismissal] = useState(false);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const acuteOrActive = zones.filter(z => z.phase === 'ACUTE' || z.phase === 'ACTIVE');
  const watchZones = zones.filter(z => z.phase === 'WATCH');
  const retZone = zones.find(z => z.retWin && z.ageH >= 18 && z.ageH <= 72);

  const state: 'QUIET' | 'RETALIATION' | 'ELEVATED' =
    acuteOrActive.length === 0 ? 'QUIET'
      : (inRetaliationWindow && retZone) ? 'RETALIATION'
      : 'ELEVATED';

  const corridors = findNetworkContagion(zones, campusId, allRisks);
  const fcSummary = forecastContagionSummary(forecast);

  /* ---- Section header ---- */
  const header = (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 20, color: '#121315', paddingLeft: 12, borderLeft: '3px solid #F0B429' }}>
            Violence Spread Monitor
            <Explainer title="Violence Contagion Model">
              <p style={{ margin: '0 0 12px' }}>Based on research by Yale sociologist Andrew Papachristos, gun violence spreads through social networks like an infectious disease. A person's risk of being shot increases by <strong>900%</strong> if someone in their social network was recently shot.</p>
              <p style={{ margin: '0 0 12px' }}>The contagion effect peaks between <strong>18-72 hours</strong> after a homicide (the "retaliation window") and persists for up to <strong>125 days</strong>.</p>
              <p style={{ margin: 0 }}>Watch tracks three phases: <strong>ACUTE</strong> (0-72h, 0.5mi radius), <strong>ACTIVE</strong> (3-14d, 1mi), and <strong>WATCH</strong> (14-125d, 1.5mi).</p>
            </Explainer>
          </div>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2, lineHeight: 1.4 }}>
            Tracks how violence moves through social networks near your campus — based on peer-reviewed research
          </div>
        </div>
      </div>
      <div style={{ marginTop: 6 }}>
        <ExplainLink onClick={() => setShowExplain(true)} label="Learn about this model" />
      </div>
    </div>
  );

  /* ---- STATE 1: QUIET ---- */
  if (state === 'QUIET') {
    return (
      <div style={{ borderRadius: 12, padding: 20, marginBottom: 24, border: '1px solid #E5E7EB' }}>
        {header}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '16px', background: '#F0FDF4', borderRadius: 10, border: '1px solid #BBF7D0',
        }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#16A34A', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#15803D', lineHeight: 1.3 }}>
              Your campus is outside all active violence contagion zones.
            </div>
            <div style={{ fontSize: 14, color: '#6B7280', marginTop: 4, lineHeight: 1.5 }}>
              No homicides near your neighborhood in the last 14 days have created elevated network risk. That's good news.
            </div>
            {zones.length > 0 && (
              <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 8 }}>
                {zones.length} older zone{zones.length !== 1 ? 's' : ''} in WATCH phase — historical context only.
              </div>
            )}
          </div>
        </div>

        <NetworkContagionSection corridors={corridors} campusName={campusName} />
        <ForecastLine summary={fcSummary} onOpen={onOpenForecast} />
        {showExplain && <PapachristosModal onClose={() => setShowExplain(false)} />}
      </div>
    );
  }

  /* ---- STATE 2: RETALIATION WINDOW ---- */
  if (state === 'RETALIATION' && retZone) {
    const homicideMs = new Date(retZone.homicideDate).getTime();
    const windowCloseMs = homicideMs + 72 * 3_600_000;
    const msRemaining = Math.max(0, windowCloseMs - now);
    const hoursLeft = Math.floor(msRemaining / 3_600_000);
    const minutesLeft = Math.floor((msRemaining % 3_600_000) / 60_000);

    const windowStartMs = homicideMs + 18 * 3_600_000;
    const windowDuration = 54 * 3_600_000;
    const elapsed = now - windowStartMs;
    const progressPct = Math.min(100, Math.max(0, (elapsed / windowDuration) * 100));
    const isPeakRisk = progressPct > 20 && progressPct < 60;

    const otherZones = acuteOrActive.filter(z => z.incidentId !== retZone.incidentId);
    const direction = compassLabel(retZone.bearingFromCampus ?? 0).toLowerCase();

    return (
      <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
        <style>{KEYFRAMES}{CONTAGION_KEYFRAMES}</style>

        {/* Header on white */}
        <div style={{ padding: '20px 20px 0', background: '#fff', border: '1px solid #D45B4F44', borderBottom: 'none', borderRadius: '12px 12px 0 0' }}>
          {header}
        </div>

        {/* Animated red card */}
        <div style={{
          animation: 'retPulse 2s ease-in-out infinite',
          padding: '24px 20px 20px',
          color: '#fff',
          boxSizing: 'border-box',
        }}>
          <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 1, marginBottom: 4 }}>
            ⚠ RETALIATION WINDOW OPEN
          </div>
          <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 8 }}>
            The most dangerous period following a homicide near your campus
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, marginBottom: 16, lineHeight: 1 }}>
            Window closes in {hoursLeft}h {minutesLeft}m
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.3)', marginBottom: 16 }} />

          {/* Incident details card */}
          <div style={{
            background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '14px 16px', marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <CompassArrow bearing={retZone.bearingFromCampus ?? 0} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, lineHeight: 1.4 }}>
                  HOMICIDE · {retZone.block || 'Address unavailable'} ·{' '}
                  {retZone.distanceFromCampus != null
                    ? `${retZone.distanceFromCampus.toFixed(1)} miles ${compassLabel(retZone.bearingFromCampus ?? 0)}`
                    : 'distance unknown'} · {fmtAgo(retZone.homicideDate)}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {retZone.gang && <TagPill label="GANG-RELATED" />}
                  {retZone.firearm && <TagPill label="FIREARM-INVOLVED" />}
                </div>
              </div>
            </div>
          </div>

          {/* Progress bar: retaliation window position */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, opacity: 0.7, marginBottom: 6 }}>
              <span>Window opened (18h)</span>
              {isPeakRisk && <span style={{ fontWeight: 700 }}>Peak risk now</span>}
              <span>Window closes (72h)</span>
            </div>
            <div style={{ height: 8, background: 'rgba(0,0,0,0.3)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
              <div style={{
                height: '100%', width: `${progressPct}%`, background: '#FCA5A5',
                borderRadius: 4, transition: 'width 1s linear',
              }} />
              {/* Current position marker with shimmer glow */}
              <div style={{
                position: 'absolute', left: `${progressPct}%`, top: -2,
                transform: 'translateX(-50%)', width: 12, height: 12, borderRadius: '50%',
                background: '#fff', border: '2px solid #FCA5A5',
                boxShadow: '0 1px 4px rgba(0,0,0,0.3), 0 0 8px rgba(252,165,165,0.6)',
                animation: 'contagionGlow 4s ease-in-out infinite',
              }} />
            </div>
          </div>

          {/* Action buttons */}
          <button
            onClick={() => setShowRetDismissal(true)}
            style={{
              width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8,
              color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 8,
              textAlign: 'left',
            }}
          >
            What does this mean for dismissal today?
          </button>

          {onBeginProtocol && (
            <button
              onClick={() => onBeginProtocol('YELLOW')}
              style={{
                width: '100%', padding: '14px 16px', background: '#121315',
                border: 'none', borderRadius: 8, color: '#fff',
                fontSize: 16, fontWeight: 700, cursor: 'pointer', marginBottom: 8,
              }}
            >
              Prepare Dismissal Plan →
            </button>
          )}

          <button
            onClick={() => setShowMap(!showMap)}
            style={{
              width: '100%', padding: '10px 16px', background: 'transparent',
              border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8,
              color: '#fff', fontSize: 13, cursor: 'pointer',
            }}
          >
            {showMap ? 'Hide map' : 'View on map'}
          </button>
        </div>

        {/* Inline map placeholder (uses CSS circles since we can't use Leaflet inline easily) */}
        {showMap && (
          <div style={{
            padding: 16, background: '#fff', borderTop: '1px solid #E5E7EB',
          }}>
            <div style={{
              position: 'relative', width: '100%', height: 200,
              background: '#F3F4F6', borderRadius: 8, overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {/* Concentric rings */}
              <div style={{
                position: 'absolute', width: 160, height: 160, borderRadius: '50%',
                border: '2px dashed #B79145', opacity: 0.3,
              }} />
              <div style={{
                position: 'absolute', width: 100, height: 100, borderRadius: '50%',
                border: '2px solid #D45B4F', background: '#D45B4F15',
              }} />
              {/* Campus marker */}
              <div style={{
                position: 'absolute', width: 16, height: 16, borderRadius: '50%',
                background: '#121315', border: '3px solid #fff', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                zIndex: 2,
              }} />
              {/* Incident marker */}
              <div style={{
                position: 'absolute',
                left: `${50 + (retZone.bearingFromCampus != null ? Math.sin((retZone.bearingFromCampus * Math.PI) / 180) * 25 : 20)}%`,
                top: `${50 - (retZone.bearingFromCampus != null ? Math.cos((retZone.bearingFromCampus * Math.PI) / 180) * 25 : 20)}%`,
                width: 12, height: 12, borderRadius: '50%',
                background: '#D45B4F', border: '2px solid #fff', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                zIndex: 2,
              }} />
              {/* Legend */}
              <div style={{
                position: 'absolute', bottom: 8, left: 8,
                fontSize: 10, color: '#6B7280', background: 'rgba(255,255,255,0.9)',
                padding: '4px 8px', borderRadius: 4, lineHeight: 1.5,
              }}>
                <div>● Navy = Your campus</div>
                <div>● Red = Incident ({retZone.distanceFromCampus?.toFixed(1) ?? '?'}mi {direction})</div>
                <div>○ Red circle = 0.5mi ACUTE radius</div>
                <div>○ Amber = 1.0mi ACTIVE radius</div>
              </div>
            </div>
          </div>
        )}

        {/* Other active zones */}
        {otherZones.length > 0 && (
          <div style={{ padding: '12px 20px', background: '#FEF2F2' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#991B1B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Other active zones
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {otherZones.map(z => <ElevatedZoneCard key={z.incidentId} zone={z} />)}
            </div>
          </div>
        )}

        {/* Watch zones - collapsed single line */}
        {watchZones.length > 0 && (
          <div style={{ padding: '8px 20px', background: '#fff', borderTop: '1px solid #E5E7EB' }}>
            <WatchCollapse watchZones={watchZones} expanded={watchExpanded} onToggle={() => setWatchExpanded(!watchExpanded)} />
          </div>
        )}

        <div style={{ padding: '0 20px', background: '#fff' }}>
          <NetworkContagionSection corridors={corridors} campusName={campusName} />
        </div>
        <div style={{ padding: '0 20px 20px', background: '#fff' }}>
          <ForecastLine summary={fcSummary} onOpen={onOpenForecast} />
        </div>

        {showExplain && <PapachristosModal onClose={() => setShowExplain(false)} />}
        {showRetDismissal && <RetaliationDismissalModal direction={direction} onClose={() => setShowRetDismissal(false)} />}
      </div>
    );
  }

  /* ---- STATE 3: ELEVATED (ACTIVE zones, no retaliation window) ---- */
  const activeZone = acuteOrActive[0];
  const isAcutePhase = acuteOrActive.some(z => z.phase === 'ACUTE');

  // Compute ACTIVE progress (3-14 days)
  let activeProgressPct = 0;
  if (activeZone && activeZone.phase === 'ACTIVE') {
    const daysSinceHomicide = activeZone.ageH / 24;
    activeProgressPct = Math.min(100, Math.max(0, ((daysSinceHomicide - 3) / 11) * 100));
  }

  return (
    <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
      <div style={{ padding: 20 }}>
        {header}

        <div style={{
          padding: '16px', borderRadius: 10, marginBottom: 12,
          background: isAcutePhase ? '#FEF2F2' : '#FFFBEB',
          border: `1px solid ${isAcutePhase ? '#FECACA' : '#FDE68A'}`,
        }}>
          <div style={{
            fontSize: 18, fontWeight: 700, marginBottom: 6,
            color: isAcutePhase ? '#D45B4F' : '#B79145',
          }}>
            {isAcutePhase
              ? `Active Contagion Zone — ACUTE phase`
              : `Active Contagion Zone — ${activeZone?.daysLeft ?? '?'} days remaining`}
          </div>
          <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, marginBottom: 12 }}>
            {isAcutePhase
              ? 'An ACUTE contagion zone (0-72 hours from a homicide) is active near your campus. Risk is highest during this phase.'
              : `A homicide ${activeZone?.distanceFromCampus != null ? `${activeZone.distanceFromCampus.toFixed(1)} miles ${compassLabel(activeZone.bearingFromCampus ?? 0)}` : 'nearby'} ${activeZone ? Math.round(activeZone.ageH / 24) + ' days ago' : ''} places your campus in an elevated risk period. The peak retaliation window has passed. Risk is declining but remains elevated.`}
          </div>

          {/* ACTIVE progress bar */}
          {!isAcutePhase && activeZone && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9CA3AF', marginBottom: 4 }}>
                <span>Day 3</span>
                <span>Day 14 (resolves)</span>
              </div>
              <div style={{ height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${activeProgressPct}%`, background: '#B79145',
                  borderRadius: 3, transition: 'width 1s linear',
                }} />
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {acuteOrActive.map(zone => <ElevatedZoneCard key={zone.incidentId} zone={zone} />)}
        </div>

        {watchZones.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <WatchCollapse watchZones={watchZones} expanded={watchExpanded} onToggle={() => setWatchExpanded(!watchExpanded)} />
          </div>
        )}
      </div>

      <div style={{ padding: '0 20px' }}>
        <NetworkContagionSection corridors={corridors} campusName={campusName} />
      </div>
      <div style={{ padding: '0 20px 20px' }}>
        <ForecastLine summary={fcSummary} onOpen={onOpenForecast} />
      </div>

      {showExplain && <PapachristosModal onClose={() => setShowExplain(false)} />}
    </div>
  );
}

/* ============================================================ */
/*  Sub-components                                                */
/* ============================================================ */

function TagPill({ label }: { label: string }) {
  return (
    <span style={{
      background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: 4,
      fontSize: 11, fontWeight: 700, letterSpacing: 0.5, border: '1px solid rgba(255,255,255,0.3)',
    }}>
      {label}
    </span>
  );
}

function CompassArrow({ bearing: deg }: { bearing: number }) {
  return (
    <svg width={44} height={44} viewBox="0 0 44 44" style={{ flexShrink: 0 }}>
      <circle cx={22} cy={22} r={20} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
      <g transform={`rotate(${deg}, 22, 22)`}>
        <polygon points="22,4 28,30 22,24 16,30" fill="#FCA5A5" />
      </g>
    </svg>
  );
}

function ElevatedZoneCard({ zone }: { zone: ContagionZone }) {
  const style = PHASE_STYLES[zone.phase];
  return (
    <div style={{
      background: style.bg, borderLeft: `3px solid ${style.color}`, borderRadius: 8, padding: '12px 14px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 11, color: '#fff', background: style.color, padding: '2px 8px', borderRadius: 4 }}>
            {zone.phase}
          </span>
          {zone.distanceFromCampus != null && (
            <span style={{ fontSize: 13, color: '#374151' }}>
              {zone.distanceFromCampus.toFixed(1)} mi {compassLabel(zone.bearingFromCampus ?? 0)}
            </span>
          )}
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: style.color }}>{zone.daysLeft}d left</span>
      </div>
      <div style={{ fontSize: 13, color: '#374151' }}>
        HOMICIDE — {zone.block || 'Address unavailable'} — {fmtAgo(zone.homicideDate)}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        {zone.gang && <span style={{ background: '#FEE2E2', color: '#B91C1C', padding: '2px 6px', borderRadius: 3, fontWeight: 600, fontSize: 10 }}>GANG</span>}
        {zone.firearm && <span style={{ background: '#FEE2E2', color: '#B91C1C', padding: '2px 6px', borderRadius: 3, fontWeight: 600, fontSize: 10 }}>FIREARM</span>}
      </div>
    </div>
  );
}

function WatchCollapse({ watchZones, expanded, onToggle }: { watchZones: ContagionZone[]; expanded: boolean; onToggle: () => void }) {
  return (
    <>
      <button onClick={onToggle} style={{
        display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
        cursor: 'pointer', color: '#6B7280', fontSize: 13, padding: '6px 0', minHeight: 44,
      }}>
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {watchZones.length} older zone{watchZones.length !== 1 ? 's' : ''} (historical context)
      </button>
      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
          {watchZones.map(zone => (
            <div key={zone.incidentId} style={{
              background: '#F3F4F6', borderLeft: '2px solid #9CA3AF', borderRadius: 4,
              padding: '6px 10px', fontSize: 12, color: '#6B7280',
            }}>
              {zone.distanceFromCampus != null ? `${zone.distanceFromCampus.toFixed(1)} mi ${compassLabel(zone.bearingFromCampus ?? 0)}` : 'Distance unknown'} — {fmtAgo(zone.homicideDate)} — {zone.daysLeft}d remaining
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function NetworkContagionSection({ corridors }: { corridors: CorridorGroup[]; campusName: string }) {
  if (corridors.length === 0) return null;
  return (
    <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 16, marginTop: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: '#121315', marginBottom: 8 }}>Network Alert</div>
      {corridors.map(group => {
        const names = group.campuses.map(c => c.name);
        return (
          <div key={group.incidentId} style={{
            background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8,
            padding: '12px 14px', fontSize: 14, color: '#991B1B', lineHeight: 1.6, marginBottom: 6,
          }}>
            <strong>{names.join(', ')}</strong> ({group.campuses.map(c => `${c.distance.toFixed(1)}mi away`).join(', ')})
            {' '}is in the same contagion zone. This homicide{group.block ? ` near ${group.block}` : ''} affects multiple campuses simultaneously.
          </div>
        );
      })}
    </div>
  );
}

const FC_COLORS: Record<string, { color: string; bg: string }> = {
  LOW: { color: '#16A34A', bg: '#DCFCE7' },
  ELEVATED: { color: '#B79145', bg: '#FFFBEB' },
  HIGH: { color: '#D45B4F', bg: '#FEF2F2' },
};

function ForecastLine({ summary, onOpen }: { summary: { level: string; throughDate: string | null }; onOpen?: () => void }) {
  const fc = FC_COLORS[summary.level] ?? FC_COLORS.LOW;
  const throughStr = summary.throughDate
    ? new Date(summary.throughDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : null;
  return (
    <div onClick={onOpen} style={{
      marginTop: 16, padding: '10px 14px', background: fc.bg, borderRadius: 8,
      fontSize: 13, color: fc.color, fontWeight: 500, cursor: onOpen ? 'pointer' : 'default',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <span>Contagion risk projected <strong>{summary.level}</strong>{throughStr ? ` through ${throughStr}` : ''}</span>
      {onOpen && <span style={{ fontSize: 12, opacity: 0.7 }}>View forecast →</span>}
    </div>
  );
}

/* ---- Papachristos modal ---- */
function PapachristosModal({ onClose }: { onClose: () => void }) {
  return (
    <ExplainModal title="The Papachristos Model" onClose={onClose}>
      <p style={{ marginTop: 0, fontSize: 16, lineHeight: 1.8 }}>
        University of Chicago researchers discovered that gun violence spreads through social networks
        like an infectious disease. When someone is killed, people connected to them — friends, family,
        rivals — face dramatically elevated risk of violence for up to 125 days.
      </p>
      <p style={{ fontSize: 16, lineHeight: 1.8 }}>
        Watch tracks every homicide near your campus and calculates where you are in that risk window.
        This science has never been applied to school safety before. <strong>This has never been done before.</strong>
      </p>
      <p style={{ fontWeight: 600, color: '#121315', fontSize: 16 }}>The three phases:</p>
      <ul style={{ paddingLeft: 20, fontSize: 15, lineHeight: 1.8 }}>
        <li><strong style={{ color: '#D45B4F' }}>ACUTE (0-72 hours):</strong> Highest danger. 0.5-mile radius. The 18-72 hour window is when retaliatory violence is most likely.</li>
        <li><strong style={{ color: '#B79145' }}>ACTIVE (3-14 days):</strong> Elevated risk continues. 1-mile radius. Community tension may still be high.</li>
        <li><strong style={{ color: '#6B7280' }}>WATCH (14-125 days):</strong> Risk declining but not gone. 1.5-mile radius. Historical context only.</li>
      </ul>
      <p style={{ fontSize: 15, lineHeight: 1.8 }}>
        <strong>What should you do?</strong> During ACUTE phase: increase security staff at entrances,
        consider modified dismissal routes, brief your team. During ACTIVE phase: maintain heightened awareness.
        WATCH phase requires no special action.
      </p>
    </ExplainModal>
  );
}

/* ---- Retaliation dismissal modal ---- */
function RetaliationDismissalModal({ direction, onClose }: { direction: string; onClose: () => void }) {
  return (
    <ExplainModal title="Retaliation Window — Dismissal Guidance" onClose={onClose}>
      <p style={{ marginTop: 0, color: '#D45B4F', fontWeight: 600, fontSize: 16 }}>
        You are in an active retaliation window. Dismissal is the highest-risk moment of your school day.
      </p>
      <p style={{ fontSize: 15, lineHeight: 1.7 }}>
        Students traveling through the <strong>{direction}</strong> corridor are most exposed. Here is your specific guidance:
      </p>
      <ol style={{ paddingLeft: 20, fontSize: 15, lineHeight: 1.8 }}>
        <li><strong>Review your dismissal corridors</strong> — Check the Safe Corridors section below. If any corridor is flagged, modify routes.</li>
        <li><strong>Position extra staff</strong> — Place additional adults at all exit points and the first two blocks of each primary walking route.</li>
        <li><strong>Consider staggered release</strong> — Release students in waves rather than all at once.</li>
        <li><strong>Communicate with families</strong> — If risk is HIGH or CRITICAL, send a brief ParentSquare message noting modified procedures.</li>
        <li><strong>Coordinate with neighboring schools</strong> — If multiple campuses are in the same contagion corridor, coordinate dismissal timing.</li>
      </ol>
    </ExplainModal>
  );
}
