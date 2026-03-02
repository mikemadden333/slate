/**
 * SinceLastVisitCard — "Since you last checked (14 hours ago)"
 * Shows score changes, retaliation window updates, new incidents.
 * Auto-dismisses after 30 seconds or on scroll.
 */

import type { SinceLastVisit } from '../../sentinel-hooks/useCampusMemory';

interface Props {
  data: SinceLastVisit;
  onDismiss: () => void;
}

export default function SinceLastVisitCard({ data, onDismiss }: Props) {
  if (!data.show) return null;

  const timeLabel = data.hoursAgo < 24
    ? `${data.hoursAgo} hours ago`
    : `${Math.round(data.hoursAgo / 24)} days ago`;

  const scoreDir = data.scoreChange > 0 ? '↑' : data.scoreChange < 0 ? '↓' : '';
  const scoreColor = data.scoreChange > 0 ? '#DC2626' : data.scoreChange < 0 ? '#16A34A' : '#6B7280';
  const scoreWord = data.scoreChange > 0 ? 'rising' : data.scoreChange < 0 ? 'improving' : 'stable';

  return (
    <div style={{
      border: '1px solid #E5E7EB',
      borderLeft: '4px solid #1B3A6B',
      borderRadius: 12,
      padding: '16px 18px',
      marginBottom: 16,
      background: '#EEF2F9',
      position: 'relative',
      animation: 'slideInBottom 300ms ease',
    }}>
      {/* Close */}
      <button onClick={onDismiss} style={{
        position: 'absolute', top: 8, right: 8,
        background: 'none', border: 'none', color: '#9CA3AF',
        fontSize: 16, cursor: 'pointer', padding: 4,
      }}>
        ✕
      </button>

      <div style={{ fontSize: 15, fontWeight: 700, color: '#1B3A6B', marginBottom: 10 }}>
        Since you last checked ({timeLabel})
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
        {data.scoreChange !== 0 && (
          <div>
            <span style={{ color: scoreColor, fontWeight: 600 }}>
              {scoreDir} Score changed from {data.prevScore} → {data.prevScore + data.scoreChange}
            </span>
            <span style={{ color: '#6B7280' }}> ({scoreWord})</span>
          </div>
        )}
        {data.scoreChange === 0 && (
          <div>Score unchanged at {data.prevScore} — conditions are stable</div>
        )}

        {data.retWindowUpdate && (
          <div style={{ fontWeight: data.retWindowUpdate.includes('closed') ? 400 : 600 }}>
            {data.retWindowUpdate.includes('closed') ? '✓ ' : '• '}{data.retWindowUpdate}
          </div>
        )}
      </div>
    </div>
  );
}
