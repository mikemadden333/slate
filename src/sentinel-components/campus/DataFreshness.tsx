/**
 * DataFreshness — Transparency panel showing data source status.
 * Sits at the bottom of the campus view.
 */

import { HelpCircle, Info } from 'lucide-react';
import { useState } from 'react';

interface Props {
  cpdLastUpdate: Date;
  cpdCount: number;
  citizenLastUpdate: Date;
  citizenCount: number;
  shotSpotterStatus: string;
  newsLastUpdate: Date;
  newsSourceCount: number;
  iceAlertCount: number;
  realtimeCount?: number;
  realtimeLastUpdate?: Date;
  newsIncidentCount?: number;
  scannerCalls?: number;
  scannerSpikeZones?: number;
}

function isCpdLagExpected(): boolean {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0 = Sunday
  // Sunday all day, or any day before 10am
  return day === 0 || hour < 10;
}

function minutesAgo(d: Date): string {
  const mins = Math.floor((Date.now() - d.getTime()) / 60_000);
  if (mins < 1) return 'just now';
  return `${mins}m ago`;
}

function Tip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <HelpCircle
        size={13}
        style={{ color: '#9CA3AF', cursor: 'pointer' }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(v => !v)}
      />
      {show && (
        <div style={{
          position: 'absolute', bottom: 20, left: -100, width: 240,
          background: '#121315', color: '#fff', padding: '8px 12px',
          borderRadius: 8, fontSize: 11, lineHeight: 1.5, zIndex: 100,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}>
          {text}
        </div>
      )}
    </span>
  );
}

export default function DataFreshness({
  cpdLastUpdate, cpdCount, citizenLastUpdate, citizenCount,
  shotSpotterStatus, newsLastUpdate, newsSourceCount, iceAlertCount,
  realtimeCount = 0, realtimeLastUpdate, newsIncidentCount = 0,
  scannerCalls = 0, scannerSpikeZones = 0,
}: Props) {
  const showLagMessage = cpdCount === 0 && isCpdLagExpected();

  return (
    <div style={{
      border: '1px solid #E5E7EB', borderRadius: 12, padding: 16,
      marginBottom: 24, background: '#FAFAFA',
    }}>
      <div style={{
        fontWeight: 700, fontSize: 14, color: '#121315', marginBottom: 4,
        paddingLeft: 10, borderLeft: '3px solid #F0B429',
      }}>
        Data Sources & Freshness
      </div>
      <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 12, paddingLeft: 13 }}>
        Data as of {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
      </div>

      {showLagMessage && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 8,
          padding: '10px 14px', marginBottom: 12,
          background: '#EFF6FF', border: '1px solid #BFDBFE',
          borderRadius: 8, fontSize: 13, color: '#1E40AF', lineHeight: 1.5,
        }}>
          <Info size={16} style={{ flexShrink: 0, marginTop: 2, color: '#3B82F6' }} />
          <div>
            Overnight reports are still being filed by CPD officers.
            Check back after 9am for last night's verified data. Watch uses Citizen scanner data and news feeds to bridge the gap until official reports arrive.
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
        <Row
          label="CPD Verified"
          value={`Updated ${minutesAgo(cpdLastUpdate)} — ${cpdCount} incidents loaded`}
          badge={{ text: 'VERIFIED', color: '#121315' }}
          tip="Chicago Police Department verified incident reports. CPD publishes with a 5-10 day delay — this is a CPD limitation, not a Watch issue."
          warning={cpdCount === 0 && !showLagMessage ? "CPD portal has a 5-10 day publication lag" : undefined}
        />
        <Row
          label="CPD Realtime"
          value={realtimeCount > 0
            ? `${realtimeCount} incidents — updated ${realtimeLastUpdate ? minutesAgo(realtimeLastUpdate) : 'never'}`
            : 'No realtime data available — alternative endpoints offline or stale'}
          badge={{ text: realtimeCount > 0 ? 'LIVE' : 'OFFLINE', color: realtimeCount > 0 ? '#0D9488' : '#9CA3AF' }}
          tip="Alternative Chicago data endpoints (Calls for Service, OEMC Dispatch) that update faster than the primary Crimes dataset."
        />
        <Row
          label="Citizen"
          value={citizenCount > 0
            ? `Updated ${minutesAgo(citizenLastUpdate)} — ${citizenCount} incidents near campus`
            : 'No community-reported incidents near your campus in the last hour.'}
          badge={{ text: 'LIVE', color: '#0D9488' }}
          tip="Scanner-derived incidents from Citizen app. Available 5-15 minutes after CPD dispatch. Unverified."
        />
       <Row
          label="CPD Radio"
          value={scannerCalls > 0
            ? `${scannerCalls} calls monitored${scannerSpikeZones > 0 ? ` — ${scannerSpikeZones} spike zone${scannerSpikeZones !== 1 ? 's' : ''} detected` : ' — no spike zones'}`
            : 'Scanner offline or no recent traffic'}
          badge={{ text: scannerCalls > 0 ? 'LIVE' : 'OFFLINE', color: scannerCalls > 0 ? '#0D9488' : '#9CA3AF' }}
          tip="CPD radio traffic via OpenMHz. Monitors zone-level call volume for unusual spikes near campuses. 2-hour rolling window, 5-minute refresh."
        />
        <Row
          label="ShotSpotter"
          value={shotSpotterStatus}
          badge={{ text: 'ACOUSTIC', color: '#0D9488' }}
          tip="Acoustic gunshot detection system. Activations are unverified and may include false positives."
        />
        <Row
          label="News feeds"
          value={`Updated ${minutesAgo(newsLastUpdate)} — ${newsSourceCount} sources active`}
          badge={{ text: 'NEWS', color: '#3B82F6' }}
          tip="RSS feeds from Block Club Chicago, ABC7, NBC5, CBS Chicago, Sun-Times, WGN, WBEZ, Chalkbeat."
        />
        <Row
          label="News Intel"
          value={newsIncidentCount > 0
            ? `${newsIncidentCount} incident${newsIncidentCount !== 1 ? 's' : ''} parsed from 4 sources (Block Club, ABC7, NBC5, CBS)`
            : 'No violence headlines with campus-proximate locations'}
          badge={{ text: 'PARSED', color: '#2563EB' }}
          tip="Violence headlines from Block Club Chicago, ABC7, NBC5, and CBS Chicago parsed into map-plottable incidents using campus proximity matching."
        />
        <Row
          label="ICE monitoring"
          value={`Active — ${iceAlertCount > 0 ? `${iceAlertCount} alerts` : 'no alerts'}`}
          badge={{ text: 'ICE', color: '#7C3AED' }}
          tip="Monitors news and social media for immigration enforcement activity near campuses."
        />
      </div>
    </div>
  );
}

function Row({ label, value, badge, tip, warning }: {
  label: string;
  value: string;
  badge: { text: string; color: string };
  tip: string;
  warning?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      <span style={{
        fontSize: 10, fontWeight: 800, color: '#fff',
        background: badge.color, padding: '2px 6px', borderRadius: 3,
        flexShrink: 0, marginTop: 2, minWidth: 54, textAlign: 'center',
      }}>
        {badge.text}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontWeight: 600, color: '#374151' }}>{label}</span>
          <Tip text={tip} />
        </div>
        <div style={{ color: '#6B7280', fontSize: 12 }}>{value}</div>
        {warning && (
          <div style={{ color: '#B79145', fontSize: 11, marginTop: 2 }}>
            ⚠ {warning}
          </div>
        )}
      </div>
    </div>
  );
}
