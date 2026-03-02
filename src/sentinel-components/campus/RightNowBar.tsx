/**
 * RightNowBar — Section 2: The School Day Bar.
 *
 * 48px full-width bar showing exactly where we are in the school day.
 * Visual horizontal timeline: PRE-SCHOOL → ARRIVAL → SCHOOL DAY → DISMISSAL → AFTER-SCHOOL
 * Current period highlighted. Vertical line shows current time position.
 * Pulsing countdown under 15 minutes to dismissal.
 * Tappable → opens full day modal.
 */

import { useState, useEffect } from 'react';
import type { SchoolPeriod } from '../../sentinel-engine/types';

interface Props {
  schoolPeriod: SchoolPeriod;
  minutesToArrival: number;
  minutesToDismissal: number;
  riskLabel: 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  incidents6h?: number;
}

const KEYFRAMES = `
@keyframes countdownPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
`;

const PERIODS: { key: SchoolPeriod; label: string; width: number }[] = [
  { key: 'PRE_SCHOOL', label: 'PRE', width: 15 },
  { key: 'ARRIVAL', label: 'ARRIVAL', width: 12 },
  { key: 'SCHOOL_DAY', label: 'SCHOOL DAY', width: 40 },
  { key: 'DISMISSAL', label: 'DISMISS', width: 15 },
  { key: 'AFTER_SCHOOL', label: 'AFTER', width: 18 },
];

const PERIOD_COLORS: Record<string, string> = {
  PRE_SCHOOL: '#6B7280',
  ARRIVAL: '#2563EB',
  SCHOOL_DAY: '#16A34A',
  DISMISSAL: '#D97706',
  AFTER_SCHOOL: '#6B7280',
  OVERNIGHT: '#374151',
  NO_SCHOOL: '#9CA3AF',
};

export default function RightNowBar({
  schoolPeriod, minutesToArrival, minutesToDismissal, riskLabel, incidents6h,
}: Props) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const color = PERIOD_COLORS[schoolPeriod] ?? '#6B7280';
  const isDismissalUrgent = schoolPeriod === 'DISMISSAL' ||
    (schoolPeriod === 'SCHOOL_DAY' && minutesToDismissal > 0 && minutesToDismissal <= 15);
  const isPulsingCountdown = isDismissalUrgent && minutesToDismissal <= 15 && minutesToDismissal > 0;
  const message = getContextMessage(schoolPeriod, minutesToArrival, minutesToDismissal, riskLabel, incidents6h);

  // Compute timeline position
  const currentIdx = PERIODS.findIndex(p => p.key === schoolPeriod);
  let timelinePos = 0;
  if (currentIdx >= 0) {
    for (let i = 0; i < currentIdx; i++) timelinePos += PERIODS[i].width;
    timelinePos += PERIODS[currentIdx].width / 2;
  } else if (schoolPeriod === 'OVERNIGHT' || schoolPeriod === 'NO_SCHOOL') {
    timelinePos = 0;
  }

  const fmtTime = (m: number) => {
    if (m <= 0) return 'NOW';
    const h = Math.floor(m / 60);
    const min = m % 60;
    return h > 0 ? `${h}h ${min}m` : `${min}m`;
  };

  const showCountdown = (schoolPeriod === 'DISMISSAL' && minutesToDismissal > 0) ||
    (schoolPeriod === 'SCHOOL_DAY' && minutesToDismissal > 0 && minutesToDismissal <= 120) ||
    (schoolPeriod === 'PRE_SCHOOL' && minutesToArrival > 0) ||
    (schoolPeriod === 'ARRIVAL' && minutesToArrival > 0);

  const countdownValue = (schoolPeriod === 'DISMISSAL' || schoolPeriod === 'SCHOOL_DAY')
    ? minutesToDismissal : minutesToArrival;

  return (
    <div style={{ marginBottom: 24 }}>
      <style>{KEYFRAMES}</style>

      {/* Timeline bar */}
      <div style={{
        background: '#F8F9FA',
        borderRadius: 10,
        padding: '12px 16px',
        border: isDismissalUrgent ? `2px solid ${color}` : '1px solid #E5E7EB',
      }}>
        {/* Visual timeline */}
        {(schoolPeriod !== 'OVERNIGHT' && schoolPeriod !== 'NO_SCHOOL') && (
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden' }}>
              {PERIODS.map(p => {
                const isActive = p.key === schoolPeriod;
                const isPast = currentIdx >= 0 && PERIODS.indexOf(p) < currentIdx;
                const pColor = PERIOD_COLORS[p.key];
                return (
                  <div key={p.key} style={{
                    width: `${p.width}%`,
                    background: isActive ? pColor : isPast ? `${pColor}40` : '#E5E7EB',
                    borderRight: '1px solid #fff',
                    transition: 'background 300ms ease',
                  }} />
                );
              })}
            </div>
            {/* Current position marker */}
            {currentIdx >= 0 && (
              <div style={{
                position: 'absolute',
                left: `${timelinePos}%`,
                top: -4,
                transform: 'translateX(-50%)',
                width: 4,
                height: 16,
                background: color,
                borderRadius: 2,
                boxShadow: `0 0 6px ${color}66`,
              }} />
            )}
            {/* Period labels */}
            <div style={{ display: 'flex', marginTop: 4 }}>
              {PERIODS.map(p => (
                <div key={p.key} style={{
                  width: `${p.width}%`,
                  fontSize: 8,
                  fontWeight: p.key === schoolPeriod ? 800 : 400,
                  color: p.key === schoolPeriod ? color : '#9CA3AF',
                  textAlign: 'center',
                  letterSpacing: 0.3,
                  textTransform: 'uppercase',
                }}>
                  {p.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Context message + countdown */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 16,
              color: '#111827',
              lineHeight: 1.5,
              fontWeight: isDismissalUrgent ? 600 : 400,
            }}>
              {message}
            </div>
          </div>
          {showCountdown && (
            <div style={{
              fontSize: isPulsingCountdown ? 32 : 24,
              fontWeight: 800,
              fontFamily: "'SF Mono', 'Roboto Mono', 'Courier New', monospace",
              color: isPulsingCountdown
                ? (riskLabel !== 'LOW' ? '#DC2626' : color)
                : color,
              flexShrink: 0,
              animation: isPulsingCountdown ? 'countdownPulse 1s ease-in-out infinite' : 'none',
              lineHeight: 1,
            }}>
              {fmtTime(countdownValue)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getContextMessage(
  period: SchoolPeriod, minsToArrival: number, minsToDismissal: number,
  riskLabel: string, incidents6h?: number,
): string {
  const incStr = incidents6h != null && incidents6h > 0
    ? ` ${incidents6h} incident${incidents6h !== 1 ? 's' : ''} within 1mi in last 6h.`
    : '';

  switch (period) {
    case 'ARRIVAL':
      return `Students arriving now — this is the highest-risk period.${incStr}`;
    case 'SCHOOL_DAY': {
      if (minsToDismissal > 0 && minsToDismissal <= 120) {
        const action = riskLabel !== 'LOW'
          ? 'Review your dismissal plan now.'
          : 'Standard dismissal procedures apply.';
        return `Dismissal approaching. ${action}`;
      }
      const h = Math.floor(minsToDismissal / 60);
      const m = minsToDismissal % 60;
      const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
      return `School in session. Next key moment: Dismissal in ${timeStr}.`;
    }
    case 'DISMISSAL': {
      const prefix = riskLabel !== 'LOW' ? 'DISMISSAL ACTIVE' : 'Dismissal in progress';
      return `${prefix} — monitor student departure routes.${incStr}`;
    }
    case 'PRE_SCHOOL':
      return minsToArrival > 0
        ? `Staff should be arriving. First bell approaching.${incStr}`
        : 'Arrival period beginning shortly.';
    case 'AFTER_SCHOOL':
      return 'Dismissal complete. After-school activities in progress.';
    case 'OVERNIGHT': {
      const h = Math.floor(minsToArrival / 60);
      return h > 0
        ? `School starts in ${h} hours. Overnight intelligence is being gathered.`
        : 'Building secured. Network monitoring continues.';
    }
    case 'NO_SCHOOL':
      return 'Weekend or break. Network monitoring active.';
  }
}
