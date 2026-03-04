/**
 * RiskScoreCard — Score display with expandable breakdown.
 * Shows base/acute/seasonal components when expanded.
 */

import { useState } from 'react';
import type { CampusRisk } from '../../sentinel-engine/types';
import { RISK_COLORS } from '../../sentinel-data/weights';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  risk: CampusRisk;
}

export default function RiskScoreCard({ risk }: Props) {
  const [expanded, setExpanded] = useState(false);
  const colors = RISK_COLORS[risk.label];

  return (
    <div style={{
      border: `1px solid ${colors.color}33`,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      background: '#fff',
    }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={{
            fontSize: 42,
            fontWeight: 800,
            color: colors.color,
            fontFamily: "'SF Mono', 'Roboto Mono', 'Courier New', monospace",
            lineHeight: 1,
          }}>
            {risk.score}
          </span>
          <span style={{
            fontSize: 14,
            fontWeight: 700,
            color: colors.color,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}>
            {risk.label}
          </span>
        </div>
        <div style={{ color: '#6B7280' }}>
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {/* Compact stats row */}
      <div style={{
        display: 'flex',
        gap: 16,
        marginTop: 8,
        fontSize: 12,
        color: '#6B7280',
      }}>
        <span>{risk.closeCount} within 0.5mi/24h</span>
        <span>{risk.nearCount} within 1mi/24h</span>
        <span>{risk.contagionZones.length} contagion zone{risk.contagionZones.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Expanded breakdown */}
      {expanded && (
        <div style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: '1px solid #E5E7EB',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
            Score Breakdown
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <ScoreRow label="Base (30-day incidents)" value={risk.base} max={75} color="#374151" />
            <ScoreRow label="Acute (6h urgent)" value={risk.acute} max={40} color={risk.acute > 0 ? '#D45B4F' : '#374151'} />
            <ScoreRow label="Seasonal (day/month/temp)" value={risk.seasonal} max={26} color="#374151" />
            {risk.shotSpotterBonus > 0 && (
              <ScoreRow label="ShotSpotter bonus" value={risk.shotSpotterBonus} max={25} color="#0F766E" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 12, color: '#6B7280', width: 180, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: '#E5E7EB', borderRadius: 3 }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: 3,
          transition: 'width 0.3s ease',
        }} />
      </div>
      <span style={{
        fontSize: 13,
        fontWeight: 600,
        color,
        fontFamily: "'SF Mono', monospace",
        width: 32,
        textAlign: 'right',
      }}>
        {value}
      </span>
    </div>
  );
}
