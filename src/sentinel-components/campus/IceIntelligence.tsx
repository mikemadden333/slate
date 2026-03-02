/**
 * IceIntelligence — Section 5: Immigration Activity Monitor.
 *
 * Informational, not emergency. Collapsed by default.
 * Light purple background, calm tone.
 * Tap to expand for details and Code White steps.
 */

import { useState } from 'react';
import type { IceAlert } from '../../sentinel-engine/types';
import { fmtAgo } from '../../sentinel-engine/geo';
import { Shield } from 'lucide-react';
import ExplainModal, { ExplainLink } from '../shared/ExplainModal';
import Explainer from '../shared/Explainer';

interface Props {
  iceAlerts: IceAlert[];
  onInitiateCodeWhite: () => void;
}

export default function IceIntelligence({ iceAlerts, onInitiateCodeWhite }: Props) {
  const [showExplain, setShowExplain] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const hasAlerts = iceAlerts.length > 0;

  return (
    <>
      <div style={{
        background: '#F5F0FF',
        borderLeft: '3px solid #7C3AED',
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        {/* Collapsed header — always visible */}
        <button
          onClick={() => setExpanded(v => !v)}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 20px',
            background: 'transparent', border: 'none', cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={16} style={{ color: '#7C3AED' }} />
            <span style={{ fontWeight: 600, fontSize: 14, color: '#374151' }}>
              Immigration Activity Monitor
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700, color: '#7C3AED',
              background: '#EDE9FE', padding: '2px 8px', borderRadius: 10,
            }}>
              ICE MONITOR
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 12, fontWeight: 600,
              color: hasAlerts ? '#7C3AED' : '#0EA5E9',
            }}>
              {hasAlerts
                ? `${iceAlerts.length} report${iceAlerts.length !== 1 ? 's' : ''}`
                : 'No activity'}
            </span>
            <span style={{
              fontSize: 14, color: '#9CA3AF',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 200ms',
            }}>
              ▾
            </span>
          </div>
        </button>

        {/* Expanded content */}
        {expanded && (
          <div style={{ padding: '0 20px 20px' }}>
            {/* Welcoming City notice */}
            <div style={{
              padding: '12px 14px', background: '#fff', borderRadius: 8, marginBottom: 14,
              fontSize: 13, color: '#374151', lineHeight: 1.6,
            }}>
              Activity has been reported near Noble campuses. Noble follows Chicago&apos;s
              Welcoming City Ordinance — ICE requires a criminal judicial warrant to enter schools.
            </div>

            {/* Quiet state */}
            {!hasAlerts && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 14px', background: '#F0FDF4', borderRadius: 8,
                marginBottom: 14,
              }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#0EA5E9', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#15803D' }}>
                  No confirmed immigration enforcement activity near Noble campuses. Monitoring active.
                </span>
              </div>
            )}

            {/* Alert list */}
            {hasAlerts && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                {iceAlerts.map(alert => (
                  <div key={alert.id} style={{
                    background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8,
                    padding: '12px 14px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600,
                        color: alert.confidence === 'CONFIRMED' ? '#7C3AED' : '#9CA3AF',
                        textTransform: 'uppercase',
                      }}>
                        {alert.confidence}
                      </span>
                      <span style={{ fontSize: 11, color: '#6B7280' }}>via {alert.source}</span>
                      <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 'auto' }}>{fmtAgo(alert.timestamp)}</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
                      {alert.description}
                    </div>
                    {alert.location && (
                      <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                        Location: {alert.location}
                        {alert.distanceFromCampus != null && <> — {alert.distanceFromCampus.toFixed(1)} mi from campus</>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Code White button — visible when expanded */}
            <button
              onClick={onInitiateCodeWhite}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 8,
                border: '1px solid #7C3AED',
                background: '#fff',
                color: '#7C3AED',
                fontWeight: 600, fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                marginBottom: 10,
              }}
            >
              <Shield size={16} />
              Initiate Code White — Neptune Protocol
            </button>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
              <ExplainLink onClick={() => setShowExplain(true)} label="What is Code White?" />
              <Explainer title="ICE Intelligence">
                <p style={{ margin: '0 0 12px' }}>Sentinel monitors news feeds and social media for immigration enforcement activity near Noble campuses using a <strong>three-tier verification filter</strong>.</p>
                <p style={{ margin: '0 0 12px' }}>Alerts are only surfaced when within <strong>3 miles</strong> of a campus with a <strong>non-zero distance</strong> (0.0 mi = geocoding failure, discarded).</p>
                <p style={{ margin: 0 }}>Code White (Neptune Protocol) is Noble&apos;s response protocol for confirmed ICE activity near campuses.</p>
              </Explainer>
            </div>
          </div>
        )}
      </div>

      {showExplain && (
        <ExplainModal title="Code White — Neptune Protocol" onClose={() => setShowExplain(false)}>
          <p style={{ marginTop: 0, fontSize: 15, lineHeight: 1.7 }}>
            <strong>Code White (Neptune Protocol)</strong> is Noble&apos;s response when immigration
            enforcement (ICE) activity is detected near a campus.
          </p>
          <p style={{ fontSize: 15, lineHeight: 1.7 }}>
            <strong>Chicago&apos;s Welcoming City Ordinance</strong> means ICE agents must present
            a criminal judicial warrant to enter school buildings. Administrative warrants are NOT sufficient.
          </p>
          <p style={{ fontWeight: 600 }}>When Code White is activated:</p>
          <ul style={{ paddingLeft: 20, fontSize: 15, lineHeight: 1.8 }}>
            <li>All exterior doors are locked immediately</li>
            <li>No one enters without Noble School ID</li>
            <li>Noble Legal is contacted immediately</li>
            <li>A family notification is sent (carefully worded to protect families)</li>
            <li>Normal dismissal may be modified</li>
          </ul>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: '#DC2626', fontWeight: 600 }}>
            Critical: The PA announcement and family notification must NEVER mention ICE, immigration,
            or the nature of the threat. Many Noble families include undocumented individuals who could
            be endangered by such information in a message.
          </p>
        </ExplainModal>
      )}
    </>
  );
}
