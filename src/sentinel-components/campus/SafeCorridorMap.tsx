/**
 * SafeCorridorMap — Section 7: Student Travel Safety.
 *
 * Visible during DISMISSAL and ARRIVAL. Collapsed otherwise with toggle.
 * Corridor grid: GREEN=clear, AMBER=caution, RED=avoid.
 * Route advisory when any corridor is RED.
 */

import { useState } from 'react';
import type { SafeCorridor, SchoolPeriod } from '../../sentinel-engine/types';
import type { Campus } from '../../sentinel-data/campuses';
import ExplainModal, { ExplainLink } from '../shared/ExplainModal';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  campus: Campus;
  corridors: SafeCorridor[];
  schoolPeriod: SchoolPeriod;
}

const STATUS_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  CLEAR:   { color: '#0EA5E9', bg: '#E0F2FE', label: 'Clear' },
  CAUTION: { color: '#D97706', bg: '#FFFBEB', label: 'Caution' },
  AVOID:   { color: '#DC2626', bg: '#FEF2F2', label: 'Avoid' },
};

export default function SafeCorridorMap({ corridors, schoolPeriod }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [showExplain, setShowExplain] = useState(false);

  const isActiveTime = schoolPeriod === 'DISMISSAL' || schoolPeriod === 'ARRIVAL';
  const hasFlagged = corridors.some(c => c.status !== 'CLEAR');
  const hasRedCorridor = corridors.some(c => c.status === 'AVOID');
  const redCorridor = corridors.find(c => c.status === 'AVOID');
  const flagged = corridors.filter(c => c.status !== 'CLEAR');

  if (!isActiveTime && !hasFlagged) {
    return (
      <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: '14px 20px', marginBottom: 24 }}>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, background: 'none',
            border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: 14, padding: 0,
            width: '100%', minHeight: 44,
          }}
        >
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          Student Walking Routes — expand to see corridor status
        </button>
        {expanded && <CorridorBody corridors={corridors} flagged={flagged} />}
        <ExplainLink onClick={() => setShowExplain(true)} label="How are corridors determined?" />
        {showExplain && <CorridorExplainModal onClose={() => setShowExplain(false)} />}
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, marginBottom: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 20, color: '#1B3A6B' }}>Student Walking Routes</div>
        <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
          Recommended routes to and from campus based on current incident locations
        </div>
      </div>

      {hasRedCorridor && redCorridor && (
        <div style={{
          padding: '14px 16px', background: '#FEF2F2', border: '1px solid #FECACA',
          borderRadius: 10, marginBottom: 16,
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#DC2626', marginBottom: 4 }}>
            Route Advisory — {redCorridor.name} corridor has recent activity
          </div>
          <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.5 }}>
            Consider advising students to use an alternate route today.
          </div>
        </div>
      )}

      <CorridorBody corridors={corridors} flagged={flagged} />
      <ExplainLink onClick={() => setShowExplain(true)} label="How are corridors determined?" />
      {showExplain && <CorridorExplainModal onClose={() => setShowExplain(false)} />}
    </div>
  );
}

function CorridorBody({ corridors, flagged }: { corridors: SafeCorridor[]; flagged: SafeCorridor[] }) {
  return (
    <>
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, marginTop: 12, fontSize: 12 }}>
        {Object.entries(STATUS_COLORS).map(([key, val]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: val.color }} />
            <span style={{ color: '#6B7280' }}>{val.label}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
        {corridors.map(c => {
          const s = STATUS_COLORS[c.status];
          return (
            <div key={c.direction} style={{
              background: s.bg, border: `1px solid ${s.color}33`,
              borderRadius: 10, padding: '12px 8px', textAlign: 'center', minHeight: 44,
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: s.color }}>{c.direction}</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                {c.incidentCount24h > 0 ? `${c.incidentCount24h} incident${c.incidentCount24h !== 1 ? 's' : ''}` : 'Clear'}
              </div>
            </div>
          );
        })}
      </div>
      {flagged.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
          {flagged.map(c => (
            <div key={c.direction} style={{
              background: STATUS_COLORS[c.status].bg, borderRadius: 8,
              padding: '10px 14px', fontSize: 14, lineHeight: 1.5,
            }}>
              <span style={{ fontWeight: 600 }}>{c.name}</span>
              {' — '}{c.incidentCount24h} incident{c.incidentCount24h !== 1 ? 's' : ''} in 24h
              {c.mostRecentIncident && <span style={{ color: '#6B7280' }}> (most recent: {c.mostRecentIncident.type.toLowerCase()})</span>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function CorridorExplainModal({ onClose }: { onClose: () => void }) {
  return (
    <ExplainModal title="How Corridors Are Determined" onClose={onClose}>
      <p style={{ marginTop: 0 }}>
        Sentinel identifies 4 primary walking corridors radiating from your campus based on the street grid.
      </p>
      <ul style={{ paddingLeft: 20 }}>
        <li><strong style={{ color: '#0EA5E9' }}>GREEN:</strong> No incidents in last 6h. Clear.</li>
        <li><strong style={{ color: '#D97706' }}>AMBER:</strong> Incidents in last 24h. Exercise awareness.</li>
        <li><strong style={{ color: '#DC2626' }}>RED:</strong> Incidents in last 6h or active ShotSpotter. Consider alternate routes.</li>
      </ul>
    </ExplainModal>
  );
}
