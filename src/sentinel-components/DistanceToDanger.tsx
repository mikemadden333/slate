import { BG, TEXT, STATUS } from '../theme/colors';

interface DistanceToDangerProps {
  label: string;
  current: number;
  threshold: number;
  unit: string;
  headroom: string;
  bufferPct: number;
}

export default function DistanceToDanger({ label, current, threshold, unit, headroom, bufferPct }: DistanceToDangerProps) {
  const clampedPct = Math.max(0, Math.min(100, bufferPct));
  const barColor = clampedPct > 50 ? STATUS.green
    : clampedPct > 25 ? STATUS.amber
    : STATUS.red;

  return (
    <div style={{
      background: BG.card,
      border: `1px solid ${BG.border}`,
      borderRadius: 12,
      padding: '16px 20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 12,
      }}>
        <span style={{
          fontSize: 13,
          fontFamily: "'Inter', sans-serif",
          color: TEXT.muted,
        }}>
          {label}
        </span>
        <span style={{
          fontSize: 16,
          fontFamily: "'DM Mono', monospace",
          fontWeight: 500,
          color: barColor,
        }}>
          {headroom}
        </span>
      </div>
      <div style={{
        height: 8,
        background: BG.border,
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{
          height: '100%',
          width: `${clampedPct}%`,
          background: `linear-gradient(to right, ${STATUS.green}, ${clampedPct < 50 ? STATUS.amber : STATUS.green}${clampedPct < 25 ? `, ${STATUS.red}` : ''})`,
          borderRadius: 4,
          transition: 'width 0.5s ease',
        }} />
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: 8,
        fontSize: 11,
        fontFamily: "'DM Mono', monospace",
      }}>
        <span style={{ color: TEXT.dim }}>
          Current: {current} {unit}
        </span>
        <span style={{ color: STATUS.red }}>
          Threshold: {threshold} {unit}
        </span>
      </div>
    </div>
  );
}
