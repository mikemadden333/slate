/**
 * DismissalClock — Countdown with urgency escalation.
 * Dominant visual element during DISMISSAL period (2:10-4:00pm).
 * Urgency escalates as bell time approaches.
 * Turns red with retaliation window warning during active windows.
 */

import { useState, useEffect } from 'react';
import type { CampusRisk, SchoolPeriod } from '../../sentinel-engine/types';
import { RISK_COLORS } from '../../sentinel-data/weights';
import { Timer } from 'lucide-react';

interface Props {
  risk: CampusRisk;
  schoolPeriod: SchoolPeriod;
  inRetaliationWindow?: boolean;
}

export default function DismissalClock({ risk, schoolPeriod, inRetaliationWindow }: Props) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Show during ARRIVAL or DISMISSAL periods, or when SCHOOL_DAY and dismissal < 4h with retaliation window
  const showArrival = schoolPeriod === 'ARRIVAL' && risk.minutesToArrival > 0;
  const retaliationExpand = inRetaliationWindow && risk.minutesToDismissal > 0 && risk.minutesToDismissal <= 240;
  const showDismissal = schoolPeriod === 'DISMISSAL' ||
    (schoolPeriod === 'SCHOOL_DAY' && risk.minutesToDismissal <= 120 && risk.minutesToDismissal > 0) ||
    retaliationExpand;

  if (!showArrival && !showDismissal) return null;

  const minutes = showArrival ? risk.minutesToArrival : risk.minutesToDismissal;
  const label = showArrival ? 'ARRIVAL' : 'DISMISSAL';

  // Urgency escalation — override to red during retaliation window
  const isRetActive = !showArrival && inRetaliationWindow;
  const isUrgent = minutes <= 15 || isRetActive;
  const isImminent = minutes <= 5;
  const colors = isRetActive
    ? { color: '#DC2626', bg: '#FEF2F2' }
    : risk.label !== 'LOW' ? RISK_COLORS[risk.label] : { color: '#374151', bg: '#F3F4F6' };

  // Force re-render awareness
  void now;

  const h = Math.floor(Math.max(0, minutes) / 60);
  const m = Math.max(0, minutes) % 60;
  const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m`;

  return (
    <div style={{
      background: isImminent ? colors.color : isRetActive ? '#FEF2F2' : isUrgent ? colors.bg : '#F8F9FA',
      border: `2px solid ${isUrgent ? colors.color : '#E5E7EB'}`,
      borderRadius: 12,
      padding: '12px 16px',
      marginBottom: 16,
      transition: 'all 0.3s ease',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: isImminent ? '#fff' : colors.color,
          fontWeight: 600,
          fontSize: 13,
        }}>
          <Timer size={18} />
          {label} IN
        </div>
        <div style={{
          fontSize: isUrgent ? 32 : 24,
          fontWeight: 800,
          fontFamily: "'SF Mono', 'Roboto Mono', 'Courier New', monospace",
          color: isImminent ? '#fff' : colors.color,
          transition: 'font-size 0.3s ease',
        }}>
          {minutes <= 0 ? 'NOW' : timeStr}
        </div>
      </div>

      {/* Retaliation window dismissal warning */}
      {isRetActive && !showArrival && (
        <div style={{
          marginTop: 8,
          fontSize: 13,
          fontWeight: 600,
          color: '#DC2626',
          lineHeight: 1.5,
        }}>
          Dismissal in {timeStr} — retaliation window active — consider modified protocol
        </div>
      )}
    </div>
  );
}
