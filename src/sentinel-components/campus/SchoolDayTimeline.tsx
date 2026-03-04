/**
 * SchoolDayTimeline — Visual timeline of seven school periods.
 * Highlights current period. Shows time context.
 */

import type { SchoolPeriod } from '../../sentinel-engine/types';
import { Clock } from 'lucide-react';

interface Props {
  currentPeriod: SchoolPeriod;
}

const PERIODS: Array<{ key: SchoolPeriod; label: string; time: string; color: string }> = [
  { key: 'PRE_SCHOOL',   label: 'Pre-School',   time: '< 7:00am',     color: '#6B7280' },
  { key: 'ARRIVAL',      label: 'Arrival',       time: '7:00–8:00',    color: '#2563EB' },
  { key: 'SCHOOL_DAY',   label: 'School Day',    time: '8:00–2:10',    color: '#16A34A' },
  { key: 'DISMISSAL',    label: 'Dismissal',     time: '2:10–4:00',    color: '#B79145' },
  { key: 'AFTER_SCHOOL', label: 'After School',  time: '4:00–8:00',    color: '#6B7280' },
  { key: 'OVERNIGHT',    label: 'Overnight',     time: '8:00pm–7:00',  color: '#374151' },
  { key: 'NO_SCHOOL',    label: 'No School',     time: 'Weekend/Break', color: '#9CA3AF' },
];

export default function SchoolDayTimeline({ currentPeriod }: Props) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      padding: '8px 0',
      marginBottom: 16,
      overflowX: 'auto',
    }}>
      <Clock size={14} style={{ color: '#6B7280', flexShrink: 0, marginRight: 4 }} />
      {PERIODS.map(p => {
        const isActive = p.key === currentPeriod;
        return (
          <div
            key={p.key}
            style={{
              padding: '4px 10px',
              borderRadius: 16,
              fontSize: 11,
              fontWeight: isActive ? 700 : 400,
              color: isActive ? '#fff' : '#6B7280',
              background: isActive ? p.color : '#F3F4F6',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
            }}
            title={p.time}
          >
            {p.label}
          </div>
        );
      })}
    </div>
  );
}
