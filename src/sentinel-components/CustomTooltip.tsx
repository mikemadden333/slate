import { NOBLE } from '../theme/colors';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color?: string }>;
  label?: string;
  formatter?: (value: number) => string;
}

export default function CustomTooltip({ active, payload, label, formatter }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div style={{
      background: NOBLE.navyDark,
      border: `1px solid ${NOBLE.navy}`,
      borderRadius: 8,
      padding: '10px 14px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
    }}>
      {label && (
        <div style={{
          fontSize: 12,
          color: 'rgba(255,255,255,0.65)',
          marginBottom: 6,
          fontFamily: "'Inter', sans-serif",
        }}>
          {label}
        </div>
      )}
      {payload.map((entry, i) => (
        <div key={i} style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 16,
          fontSize: 13,
          fontFamily: "'DM Mono', monospace",
          color: '#FFFFFF',
          lineHeight: 1.6,
        }}>
          <span style={{ color: entry.color ?? 'rgba(255,255,255,0.65)' }}>{entry.name}</span>
          <span>{formatter ? formatter(entry.value) : entry.value}</span>
        </div>
      ))}
    </div>
  );
}
