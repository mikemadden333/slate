import type { ReactNode } from 'react';
import { TrendingUp, AlertTriangle, AlertCircle } from 'lucide-react';
import { TEXT, STATUS } from '../theme/colors';

interface AIInsightProps {
  severity: 'green' | 'amber' | 'red';
  children: ReactNode;
}

const SEVERITY_CONFIG = {
  green: { color: STATUS.green, bg: STATUS.greenBg, Icon: TrendingUp },
  amber: { color: STATUS.amber, bg: STATUS.amberBg, Icon: AlertTriangle },
  red: { color: STATUS.red, bg: STATUS.redBg, Icon: AlertCircle },
};

export default function AIInsight({ severity, children }: AIInsightProps) {
  const { color, bg, Icon } = SEVERITY_CONFIG[severity];

  return (
    <div style={{
      background: bg,
      borderLeft: `3px solid ${color}`,
      borderRadius: '0 8px 8px 0',
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
    }}>
      <Icon size={16} color={color} style={{ marginTop: 2, flexShrink: 0 }} />
      <div style={{
        fontSize: 14,
        fontFamily: "'Inter', sans-serif",
        color: TEXT.primary,
        lineHeight: 1.5,
      }}>
        {children}
      </div>
    </div>
  );
}
