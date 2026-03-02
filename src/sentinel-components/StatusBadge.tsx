import { STATUS } from '../theme/colors';

interface StatusBadgeProps {
  status: 'pass' | 'tight' | 'breach';
}

const STATUS_CONFIG = {
  pass: { color: STATUS.green, bg: STATUS.greenBg, label: 'PASS' },
  tight: { color: STATUS.amber, bg: STATUS.amberBg, label: 'TIGHT' },
  breach: { color: STATUS.red, bg: STATUS.redBg, label: 'BREACH' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { color, bg, label } = STATUS_CONFIG[status];

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 10px',
      borderRadius: 999,
      fontSize: 12,
      fontFamily: "'DM Mono', monospace",
      fontWeight: 500,
      color,
      background: bg,
      animation: status === 'breach' ? 'breach-pulse 2s ease-in-out infinite' : undefined,
    }}>
      {label}
    </span>
  );
}
