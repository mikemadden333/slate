/**
 * StatusBanner — The first thing seen. The most important element.
 * Full-width. Auto-generates statusReason. Priority: CRITICAL → HIGH → ELEVATED → ALL CLEAR.
 * ICE alert appears as second banner below — never merged.
 */

import type { CampusRisk, IceAlert } from '../../sentinel-engine/types';
import { RISK_COLORS } from '../../sentinel-data/weights';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';

interface Props {
  risk: CampusRisk;
  campusName: string;
  iceAlerts: IceAlert[];
}

export default function StatusBanner({ risk, campusName, iceAlerts }: Props) {
  const colors = RISK_COLORS[risk.label];

  const icon = risk.label === 'LOW'
    ? <CheckCircle size={20} />
    : risk.label === 'CRITICAL'
      ? <AlertTriangle size={20} />
      : <Shield size={20} />;

  const heading = risk.label === 'LOW'
    ? 'ALL CLEAR'
    : `${risk.label} RISK`;

  return (
    <>
      {/* Violence status banner */}
      <div style={{
        background: colors.bg,
        borderLeft: `4px solid ${colors.color}`,
        padding: '12px 16px',
        borderRadius: 8,
        marginBottom: iceAlerts.length > 0 ? 8 : 16,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: colors.color,
          fontWeight: 700,
          fontSize: 15,
          marginBottom: 4,
        }}>
          {icon}
          {heading} — {campusName}
        </div>
        <div style={{
          color: '#374151',
          fontSize: 14,
          lineHeight: 1.5,
        }}>
          {risk.statusReason}
        </div>
      </div>

      {/* ICE alert banner — independent, never merged */}
      {iceAlerts.length > 0 && (
        <div style={{
          background: '#F5F3FF',
          borderLeft: '4px solid #7C3AED',
          padding: '12px 16px',
          borderRadius: 8,
          marginBottom: 16,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: '#7C3AED',
            fontWeight: 700,
            fontSize: 15,
            marginBottom: 4,
          }}>
            <Shield size={20} />
            ICE ALERT — {iceAlerts.length} report{iceAlerts.length !== 1 ? 's' : ''}
          </div>
          <div style={{ color: '#374151', fontSize: 14, lineHeight: 1.5 }}>
            {iceAlerts[0].description}
            {iceAlerts[0].distanceFromCampus != null && (
              <> — {iceAlerts[0].distanceFromCampus.toFixed(1)} mi from campus</>
            )}
          </div>
        </div>
      )}
    </>
  );
}
