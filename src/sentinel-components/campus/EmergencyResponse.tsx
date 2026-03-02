/**
 * EmergencyResponse — Section 9: Emergency Response.
 *
 * 2x3 grid of code cards. Each: left border + tint, name, description, "Begin protocol".
 * Recommended code highlighted with navy badge.
 */

import { EMERGENCY_CODES } from '../../sentinel-data/codes';

interface Props {
  onSelectCode: (code: string) => void;
  recommendedCode?: string;
}

export default function EmergencyResponse({ onSelectCode, recommendedCode }: Props) {
  return (
    <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, marginBottom: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 20, color: '#0D1117', paddingLeft: 12, borderLeft: '3px solid #F0B429' }}>
          Safety Protocols
        </div>
        <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
          Emergency codes — tap any protocol to begin the guided response
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {EMERGENCY_CODES.map(ec => {
          const isRecommended = ec.code === recommendedCode;
          return (
            <button
              key={ec.code}
              onClick={() => onSelectCode(ec.code)}
              style={{
                padding: '14px 10px',
                borderRadius: 10,
                borderLeft: `4px solid ${ec.color}`,
                border: isRecommended ? `3px solid ${ec.color}` : `1px solid ${ec.color}44`,
                borderLeftWidth: 4,
                borderLeftColor: ec.color,
                background: isRecommended ? ec.color : ec.bgColor,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 6,
                position: 'relative',
                boxShadow: isRecommended ? `0 0 16px ${ec.color}44` : 'none',
                textAlign: 'left',
                minHeight: 100,
              }}
            >
              {isRecommended && (
                <div style={{
                  position: 'absolute', top: -8, right: -4,
                  fontSize: 9, fontWeight: 800, color: '#0D1117', background: '#F0B429',
                  padding: '2px 8px', borderRadius: 4, letterSpacing: 0.5,
                }}>
                  RECOMMENDED
                </div>
              )}
              <div style={{
                fontSize: 14, fontWeight: 800,
                color: isRecommended ? '#fff' : ec.color,
                letterSpacing: 1,
              }}>
                CODE {ec.code}
              </div>
              <div style={{
                fontSize: 11, lineHeight: 1.4,
                color: isRecommended ? 'rgba(255,255,255,0.9)' : '#374151',
              }}>
                {ec.description.split('.')[0]}
              </div>
              <div style={{
                fontSize: 11, fontWeight: 600, marginTop: 'auto',
                color: isRecommended ? 'rgba(255,255,255,0.8)' : ec.color,
              }}>
                Begin protocol →
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
