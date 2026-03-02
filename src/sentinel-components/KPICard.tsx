import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { BG, TEXT, NOBLE, STATUS } from '../theme/colors';

interface KPICardProps {
  label: string;
  value: string;
  subtitle?: string;
  trend: 'up' | 'down' | 'flat';
  trendValue: string;
  status: 'positive' | 'negative' | 'neutral';
}

export default function KPICard({ label, value, subtitle, trend, trendValue, status }: KPICardProps) {
  const [hovered, setHovered] = useState(false);

  const trendColor = status === 'positive' ? STATUS.green
    : status === 'negative' ? STATUS.red
    : TEXT.muted;

  const TrendIcon = trend === 'up' ? TrendingUp
    : trend === 'down' ? TrendingDown
    : Minus;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: BG.card,
        border: `1px solid ${hovered ? NOBLE.navy : BG.border}`,
        borderRadius: 12,
        padding: '20px 24px',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        boxShadow: hovered
          ? '0 4px 12px rgba(0,68,125,0.10)'
          : '0 1px 3px rgba(0,0,0,0.04)',
        flex: 1,
        minWidth: 200,
      }}
    >
      <div style={{
        fontSize: 12,
        fontFamily: "'Inter', sans-serif",
        color: TEXT.muted,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 24,
        fontFamily: "'DM Mono', monospace",
        color: TEXT.primary,
        fontWeight: 500,
        marginBottom: 4,
      }}>
        {value}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <TrendIcon size={16} color={trendColor} />
        <span style={{
          fontSize: 13,
          fontFamily: "'DM Mono', monospace",
          color: trendColor,
        }}>
          {trendValue}
        </span>
        {subtitle && (
          <span style={{
            fontSize: 13,
            color: TEXT.dim,
            marginLeft: 4,
          }}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
