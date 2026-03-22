// @ts-nocheck
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SLATE WATCH — SentinelApp.tsx — Clean Slate Redesign — March 2026
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * TWO-LANE ARCHITECTURE:
 *   LANE 1 — LIVE INTEL   Citizen + Scanner/CPD Radio + News geocoder
 *                         (minutes-to-hours fresh — drives the verdict)
 *   LANE 2 — PATTERN      CPD 30-day historical data
 *                         (clearly labeled as lagged — drives contagion model)
 *
 * HERO VISUAL: The Danger Window — contagion phase timeline
 * PRINCIPLE:   One verdict per screen. Everything else is evidence.
 *
 * Campus tabs:  Watch | Contagion | Feed | Map
 * Network tabs: Dashboard | Contagion | Map | News | Feed
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CAMPUSES } from './sentinel-data/campuses';
import { RISK_COLORS } from './sentinel-data/weights';
import { buildContagionZones } from './sentinel-engine/contagion';
import { scoreCampus, scoreNetwork } from './sentinel-engine/scoring';
import { buildWeekForecast } from './sentinel-engine/forecast';
import { buildSafeCorridors } from './sentinel-engine/corridors';
import { getSchoolPeriod, minutesToArrival, minutesToDismissal } from './sentinel-engine/time';
import { haversine, ageInHours } from './sentinel-engine/geo';
import { fetchIncidents, fetchShotSpotter } from './sentinel-api/cpd';
import { fetchScannerActivity } from './sentinel-api/scanner';
import { transcribeSpikeCalls } from './sentinel-api/scannerIntel';
import type { DispatchIncident } from './sentinel-api/scannerIntel';
import type { ScannerSummary } from './sentinel-api/scanner';
import { fetchCitizenIncidents } from './sentinel-api/citizen';
import type { CitizenIncident } from './sentinel-api/citizen';
import { fetchWeather, fetchWeatherForecast } from './sentinel-api/weather';
import { fetchAllFeeds, parseNewsAsIncidents } from './sentinel-api/news';
import { geocodeNewsIncidents } from './sentinel-api/newsGeocoder';
import { fetchRedditIntel } from './sentinel-api/redditIntel';
import { fetchIceSignals } from './sentinel-api/ice';
import { fetchRealtimeIncidents } from './sentinel-api/cpdRealtime';
import CampusMap from './sentinel-components/campus/CampusMap';
import NetworkMap from './sentinel-components/network/NetworkMap';
import ProtocolModal from './sentinel-components/shared/ProtocolModal';
import IntelQuery from './sentinel-components/shared/IntelQuery';
import type {
  Incident, ShotSpotterEvent, ContagionZone, CampusRisk,
  NewsItem, IceAlert, DailyWeather, WeatherCurrent, SchoolPeriod,
} from './sentinel-engine/types';

export const appStartTime = Date.now();
export const SETTLE_TIME_MS = 15_000;

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS — exact match to src/theme/colors.ts + SlatePlatform.tsx
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  deep: '#121315', rock: '#23272F', mid: '#2C3440', light: '#6B7280',
  brass: '#B79145', chalk: '#E7E2D8', bg: '#F7F5F1', bg2: '#F0EDE6',
  white: '#FFFFFF', watch: '#D45B4F',
  low: '#2F8F95', elev: '#B79145', high: '#C66C3D', crit: '#D45B4F',
  clear: '#059669', ice: '#7C3AED',
  acute: '#DC2626', active: '#C66C3D', watch_c: '#B79145', monitor: '#6B7280',
} as const;

const PHASE_COLOR: Record<string, string> = {
  ACUTE: T.acute, ACTIVE: T.active, WATCH: T.watch_c, MONITOR: T.monitor,
};
const PHASE_BG: Record<string, string> = {
  ACUTE: '#FEF2F2', ACTIVE: '#FFF4EE', WATCH: '#FEF9E7', MONITOR: '#F9FAFB',
};
const PHASE_BD: Record<string, string> = {
  ACUTE: '#FECACA', ACTIVE: '#F5C4A0', WATCH: '#F0D88A', MONITOR: '#E5E7EB',
};
const RISK_GRADIENT: Record<string, string> = {
  LOW:      `linear-gradient(115deg,#065F46 0%,${T.low} 100%)`,
  ELEVATED: `linear-gradient(115deg,#78350F 0%,${T.elev} 100%)`,
  HIGH:     `linear-gradient(115deg,#9A3412 0%,${T.high} 100%)`,
  CRITICAL: `linear-gradient(115deg,#7F1D1D 0%,${T.crit} 100%)`,
};
const RISK_ACCENT: Record<string, string> = {
  LOW: T.low, ELEVATED: T.elev, HIGH: T.high, CRITICAL: T.crit,
};

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL STYLES
// ─────────────────────────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;600;700&display=swap');
    @keyframes blink{0%,100%{opacity:1}55%{opacity:.3}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes dotPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.6);opacity:.6}}
    @keyframes dangerGlow{0%,100%{box-shadow:0 0 0 0 rgba(255,255,255,.6)}60%{box-shadow:0 0 0 5px rgba(255,255,255,0)}}
    @keyframes liveFlash{0%,100%{opacity:1}50%{opacity:.5}}
    @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
    *{box-sizing:border-box;margin:0;padding:0;}
    ::-webkit-scrollbar{width:5px;}
    ::-webkit-scrollbar-track{background:transparent;}
    ::-webkit-scrollbar-thumb{background:rgba(45,55,72,.2);border-radius:3px;}
    ::selection{background:rgba(183,145,69,.2);}
    .sw-blink{animation:blink 2.2s ease-in-out infinite;}
    .sw-live{animation:liveFlash 2s ease-in-out infinite;}
    .sw-fade-up{animation:fadeUp .35s ease both;}
    .sw-danger-dot{animation:dangerGlow 2s ease-in-out infinite;}
    .sw-hover:hover{background:${T.bg}!important;transition:background .1s;}
    .sw-attn-hover:hover{background:#FFF4EE!important;transition:background .1s;}
    .sw-row:hover{background:${T.bg}!important;}
    .sw-tab{transition:all .15s;cursor:pointer;border:none;font-family:inherit;}
    .sw-btn{font-family:inherit;cursor:pointer;transition:opacity .15s;}
    .sw-btn:hover{opacity:.85;}
  `}</style>
);

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────
function fmtAgo(ms: number): string {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function fmtDayTime(): string {
  const now = new Date();
  const day = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${day} · ${time}`;
}

function fmtHours(h: number): string {
  if (h < 24) return `${Math.round(h)}h`;
  return `${Math.round(h / 24)}d`;
}

// Build live verdict from real-time sources only (not CPD lagged data)
function buildLiveVerdict(
  campus: any,
  citizenIncidents: CitizenIncident[],
  newsIncidents: Incident[],
  dispatchIncidents: DispatchIncident[],
  contagionZones: ContagionZone[],
  iceAlerts: IceAlert[],
): { label: string; score: number; sentence: string; supporting: string[]; actionNeeded: boolean } {
  const drivers: string[] = [];
  let score = 0;

  // Citizen — near-live community reports within 1mi, last 24h
  const nearCitizen = citizenIncidents.filter(inc => {
    const dist = haversine(campus.lat, campus.lng, inc.latitude, inc.longitude);
    const ageH = (Date.now() - (inc.cs || 0)) / 3600000;
    return dist <= 1.0 && ageH <= 24;
  });
  if (nearCitizen.length > 0) {
    score += Math.min(nearCitizen.length * 10, 40);
    drivers.push(`${nearCitizen.length} incident${nearCitizen.length !== 1 ? 's' : ''} reported nearby`);
  }

  // News geocoded within 1mi
  const nearNews = newsIncidents.filter(inc =>
    haversine(campus.lat, campus.lng, inc.lat, inc.lng) <= 1.0
  );
  if (nearNews.length > 0) {
    score += Math.min(nearNews.length * 8, 25);
    const violent = nearNews.filter(n => ['HOMICIDE','SHOOTING','ASSAULT','ROBBERY','WEAPONS VIOLATION'].includes((n.type || '').toUpperCase()));
    drivers.push(`${violent.length > 0 ? violent.length + ' violent' : nearNews.length} news report${nearNews.length !== 1 ? 's' : ''} nearby`);
  }

  // Dispatch / scanner within 1mi
  const nearDispatch = dispatchIncidents.filter(inc =>
    haversine(campus.lat, campus.lng, inc.latitude, inc.longitude) <= 1.0
  );
  if (nearDispatch.length > 0) {
    const priority = nearDispatch.filter(d => d.isPriority);
    score += priority.length * 12;
    if (priority.length > 0) drivers.push(`${priority.length} priority dispatch${priority.length !== 1 ? 'es' : ''} nearby`);
  }

  // Contagion
  const acute = contagionZones.filter(z => z.phase === 'ACUTE');
  const active = contagionZones.filter(z => z.phase === 'ACTIVE');
  if (acute.length > 0) { score += 45; drivers.push(`${acute.length} ACUTE contagion zone${acute.length !== 1 ? 's' : ''}`); }
  else if (active.length > 0) { score += 28; drivers.push(`${active.length} ACTIVE contagion zone${active.length !== 1 ? 's' : ''}`); }
  else if (contagionZones.length > 0) { score += 12; drivers.push(`${contagionZones.length} contagion zone${contagionZones.length !== 1 ? 's' : ''}`); }

  // ICE
  if (iceAlerts.length > 0) { score += 8; drivers.push(`${iceAlerts.length} ICE alert${iceAlerts.length !== 1 ? 's' : ''}`); }

  const label = score >= 55 ? 'HIGH' : score >= 22 ? 'ELEVATED' : 'LOW';
  const actionNeeded = score >= 22 || iceAlerts.length > 0 || acute.length > 0;

  // Build the one sentence
  let sentence = '';
  const totalNearby = nearCitizen.length + nearNews.length;
  if (totalNearby === 0 && score < 22 && iceAlerts.length === 0) {
    sentence = 'Quiet overnight — students arriving to stable conditions.';
  } else if (acute.length > 0) {
    const elap = acute[0].triggeredAt ? Math.round(ageInHours(acute[0].triggeredAt)) : '?';
    sentence = `Acute retaliation window — homicide trigger ${elap}h ago, highest risk now.`;
  } else if (active.length > 0 && totalNearby > 0) {
    sentence = `${totalNearby} incident${totalNearby !== 1 ? 's' : ''} overnight · active retaliation window open.`;
  } else if (totalNearby > 0) {
    const violent = nearCitizen.filter(c => /shoot|gun|shot|stab|attack|assault/i.test(c.title || c.address || ''));
    if (violent.length > 0) {
      sentence = `${violent.length} violent incident${violent.length !== 1 ? 's' : ''} reported within 1 mile overnight.`;
    } else {
      sentence = `${totalNearby} incident${totalNearby !== 1 ? 's' : ''} reported near campus in the last 24 hours.`;
    }
  } else if (iceAlerts.length > 0) {
    sentence = `ICE enforcement activity near campus — ${iceAlerts.length} alert${iceAlerts.length !== 1 ? 's' : ''} in your area.`;
  } else {
    sentence = 'Elevated risk conditions — review before students arrive.';
  }

  return { label, score, sentence, supporting: drivers, actionNeeded };
}

// Build woven live feed for campus (Citizen + News + Scanner merged, sorted)
function buildCampusFeed(
  campus: any,
  citizenIncidents: CitizenIncident[],
  newsIncidents: Incident[],
  dispatchIncidents: DispatchIncident[],
  radiusMi = 1.0,
  hoursBack = 24,
): any[] {
  const items: any[] = [];

  citizenIncidents
    .filter(inc => {
      const dist = haversine(campus.lat, campus.lng, inc.latitude, inc.longitude);
      const ageH = (Date.now() - (inc.cs || 0)) / 3600000;
      return dist <= radiusMi && ageH <= hoursBack;
    })
    .forEach(inc => items.push({
      id: `c_${inc.key}`,
      lane: 'LIVE',
      source: 'Citizen',
      sourceBadge: 'LIVE',
      badgeColor: T.clear,
      type: 'REPORT',
      title: inc.title || inc.address || 'Community Report',
      location: inc.address || inc.location || 'Near campus',
      lat: inc.latitude, lng: inc.longitude,
      timestamp: inc.cs || 0,
      dist: haversine(campus.lat, campus.lng, inc.latitude, inc.longitude),
      isViolent: /shoot|gun|shot|stab|attack|assault|robber|weapon/i.test(inc.title || inc.address || ''),
    }));

  newsIncidents
    .filter(inc => haversine(campus.lat, campus.lng, inc.lat, inc.lng) <= radiusMi)
    .forEach(inc => {
      const violent = ['HOMICIDE','SHOOTING','BATTERY','ASSAULT','ROBBERY','WEAPONS VIOLATION'];
      items.push({
        id: `n_${inc.id}`,
        lane: 'LIVE',
        source: inc.source || 'News',
        sourceBadge: 'NEWS',
        badgeColor: T.ice,
        type: inc.type || 'NEWS',
        title: inc.description || inc.block || 'News Report',
        location: inc.block || 'Near campus',
        lat: inc.lat, lng: inc.lng,
        timestamp: new Date(inc.date).getTime(),
        dist: haversine(campus.lat, campus.lng, inc.lat, inc.lng),
        isViolent: violent.includes((inc.type || '').toUpperCase()),
        newsSource: inc.source,
      });
    });

  dispatchIncidents
    .filter(inc => {
      if (!inc.latitude || !inc.longitude) return false;
      return haversine(campus.lat, campus.lng, inc.latitude, inc.longitude) <= radiusMi;
    })
    .forEach(inc => items.push({
      id: `d_${inc.id}`,
      lane: 'LIVE',
      source: 'CPD Radio',
      sourceBadge: 'SCANNER',
      badgeColor: T.brass,
      type: inc.type || 'DISPATCH',
      title: inc.description || inc.type || 'Police Dispatch',
      location: inc.block || 'Near campus',
      lat: inc.latitude, lng: inc.longitude,
      timestamp: new Date(inc.time).getTime(),
      dist: haversine(campus.lat, campus.lng, inc.latitude, inc.longitude),
      isViolent: inc.isPriority,
    }));

  return items.sort((a, b) => {
    if (a.isViolent && !b.isViolent) return -1;
    if (!a.isViolent && b.isViolent) return 1;
    return b.timestamp - a.timestamp;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// AI BRIEF HOOK
// ─────────────────────────────────────────────────────────────────────────────
function useAIBrief(campus: any, verdict: any, iceAlerts: IceAlert[], zones: ContagionZone[]) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const requested = useRef(false);

  const generate = useCallback(async () => {
    if (!campus) return;
    setLoading(true);
    try {
      const ctx = {
        campus: campus.name,
        riskLevel: verdict?.label || 'LOW',
        sentence: verdict?.sentence || '',
        drivers: verdict?.supporting || [],
        activeContagionZones: zones.filter(z => ['ACUTE','ACTIVE'].includes(z.phase)).length,
        iceAlerts: iceAlerts.length,
        dayTime: fmtDayTime(),
      };
      const res = await fetch('/api/anthropic-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 280,
          system: `You are Slate Watch. Write a morning safety brief for the principal of ${campus.name}. Plain sentences only — no bullets, no headers. 2-3 sentences. Direct. Specific. Close with exactly one action for today. Speak as a trusted colleague, not a system.`,
          messages: [{ role: 'user', content: `Current conditions: ${JSON.stringify(ctx)}` }],
        }),
      });
      const data = await res.json();
      setText(data.content?.find((b: any) => b.type === 'text')?.text || '');
    } catch { setText(''); } finally { setLoading(false); }
  }, [campus?.id, verdict?.label, iceAlerts.length]);

  useEffect(() => {
    if (campus && verdict && !requested.current) {
      requested.current = true;
      generate();
    }
  }, [campus?.id, verdict?.label]);

  return { text, loading, refresh: () => { requested.current = false; generate(); } };
}

function useNetworkBrief(allRisks: CampusRisk[], iceAlerts: IceAlert[], zones: ContagionZone[], networkSummary: any) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const requested = useRef(false);

  const generate = useCallback(async () => {
    setLoading(true);
    try {
      const highCampuses = allRisks.filter(r => r.label === 'HIGH' || r.label === 'CRITICAL')
        .map(r => CAMPUSES.find(c => c.id === r.campusId)?.name || '').filter(Boolean);
      const ctx = {
        network: 'Veritas Charter Schools',
        totalCampuses: CAMPUSES.length,
        highRisk: highCampuses,
        elevatedCount: allRisks.filter(r => r.label === 'ELEVATED').length,
        acuteZones: zones.filter(z => z.phase === 'ACUTE').length,
        activeZones: zones.filter(z => z.phase === 'ACTIVE').length,
        iceAlerts: iceAlerts.length,
        dayTime: fmtDayTime(),
      };
      const res = await fetch('/api/anthropic-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 280,
          system: `You are Slate Watch network intelligence. Write a morning brief for the network leader. Plain sentences, no bullets, no headers. 2-3 sentences. Name specific campuses. Close with one network-wide action. Direct, peer-level tone.`,
          messages: [{ role: 'user', content: `Network conditions: ${JSON.stringify(ctx)}` }],
        }),
      });
      const data = await res.json();
      setText(data.content?.find((b: any) => b.type === 'text')?.text || '');
    } catch { setText(''); } finally { setLoading(false); }
  }, [allRisks.length, iceAlerts.length, zones.length]);

  useEffect(() => {
    if (allRisks.length > 0 && !requested.current) {
      requested.current = true;
      generate();
    }
  }, [allRisks.length]);

  return { text, loading, refresh: generate };
}

// ─────────────────────────────────────────────────────────────────────────────
// UI COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// Source badge (LIVE / NEWS / SCANNER / CPD)
const SourceBadge = ({ label, color }: { label: string; color: string }) => (
  <span style={{
    fontSize: 8, fontWeight: 900, letterSpacing: '.1em',
    textTransform: 'uppercase', padding: '2px 7px', borderRadius: 4,
    background: color, color: T.white, flexShrink: 0,
  }} className={label === 'LIVE' ? 'sw-live' : ''}>
    {label}
  </span>
);

// Section header
const SectionHead = ({ label, right }: { label: string; right?: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
    <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: T.light }}>{label}</div>
    {right && <div style={{ fontSize: 11.5, fontWeight: 600, color: T.mid }}>{right}</div>}
  </div>
);

// Skeleton shimmer
const Skeleton = ({ w = '100%', h = 16 }: { w?: string; h?: number }) => (
  <div style={{
    width: w, height: h, borderRadius: 6,
    background: `linear-gradient(90deg,${T.chalk} 0%,${T.bg2} 50%,${T.chalk} 100%)`,
    backgroundSize: '400px 100%', animation: 'shimmer 1.4s infinite linear',
  }} />
);

// ── VERDICT BANNER ──────────────────────────────────────────────────────────
const VerdictBanner = ({
  verdict, campus, onProtocol, onContagionTab, iceAlerts, zones,
}: {
  verdict: any; campus: any; onProtocol: (c: string) => void;
  onContagionTab: () => void; iceAlerts: IceAlert[]; zones: ContagionZone[];
}) => {
  const acuteZones = zones.filter(z => z.phase === 'ACUTE');
  const activeZones = zones.filter(z => z.phase === 'ACTIVE');
  const label = verdict?.label || 'LOW';
  const bg = RISK_GRADIENT[label] || RISK_GRADIENT.LOW;

  return (
    <div style={{
      background: bg, padding: '18px 28px 16px',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,.6)', marginBottom: 5 }}>
          {campus?.name} Campus · Live Assessment
        </div>
        <div style={{ fontSize: 21, fontWeight: 900, color: T.white, lineHeight: 1.2, letterSpacing: '-.02em', marginBottom: 8 }}>
          {verdict?.sentence || 'Loading intelligence...'}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
          {verdict?.supporting?.map((d: string, i: number) => (
            <span key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,.82)' }}>· {d}</span>
          ))}
          {(acuteZones.length > 0 || activeZones.length > 0) && (
            <button onClick={onContagionTab} style={{
              background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.3)',
              color: T.white, padding: '3px 11px', borderRadius: 20,
              fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {acuteZones.length > 0 ? `${acuteZones.length} ACUTE` : `${activeZones.length} ACTIVE`} zone → View
            </button>
          )}
          {iceAlerts.length > 0 && (
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,.9)', fontWeight: 700 }}>
              · ICE: {iceAlerts.length} alert{iceAlerts.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,.48)', marginBottom: 10 }}>{fmtDayTime()}</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={() => onProtocol('WHITE')} style={{
            background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.28)',
            color: T.white, padding: '7px 14px', borderRadius: 20,
            fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
          }}>Protocols</button>
          {verdict?.actionNeeded && (
            <button onClick={() => onProtocol(label === 'CRITICAL' ? 'RED' : 'YELLOW')} style={{
              background: 'rgba(255,255,255,.95)', border: 'none',
              padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 800,
              cursor: 'pointer', fontFamily: 'inherit',
              color: RISK_ACCENT[label] || T.high,
            }}>What do I do?</button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── NETWORK VERDICT BANNER ──────────────────────────────────────────────────
const NetworkVerdictBanner = ({
  allRisks, iceAlerts, zones, onContagionTab,
}: {
  allRisks: CampusRisk[]; iceAlerts: IceAlert[]; zones: ContagionZone[]; onContagionTab: () => void;
}) => {
  const highCampuses = allRisks.filter(r => r.label === 'HIGH' || r.label === 'CRITICAL');
  const acuteZones = zones.filter(z => z.phase === 'ACUTE');
  const activeZones = zones.filter(z => z.phase === 'ACTIVE');
  const label = highCampuses.length > 0 ? 'HIGH' : 'ELEVATED';

  let sentence = '';
  if (highCampuses.length > 0) {
    sentence = `Call ${highCampuses.length} principal${highCampuses.length !== 1 ? 's' : ''} before students arrive.`;
  } else if (acuteZones.length > 0) {
    sentence = `${acuteZones.length} acute contagion zone${acuteZones.length !== 1 ? 's' : ''} active across the network.`;
  } else if (iceAlerts.length > 0) {
    sentence = `ICE enforcement active near ${iceAlerts.length} campus${iceAlerts.length !== 1 ? 'es' : ''} — network operational priority.`;
  } else {
    sentence = 'Network stable — normal conditions across all campuses.';
  }

  return (
    <div style={{
      background: RISK_GRADIENT[label], padding: '18px 28px 16px',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,.6)', marginBottom: 5 }}>
          Veritas Charter Schools · {CAMPUSES.length} Campuses · Live Network View
        </div>
        <div style={{ fontSize: 21, fontWeight: 900, color: T.white, lineHeight: 1.2, letterSpacing: '-.02em', marginBottom: 8 }}>
          {sentence}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.82)' }}>· {highCampuses.length} HIGH</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.82)' }}>· {allRisks.filter(r => r.label === 'ELEVATED').length} ELEVATED</span>
          {iceAlerts.length > 0 && <span style={{ fontSize: 12, color: 'rgba(255,255,255,.9)', fontWeight: 700 }}>· ICE: {iceAlerts.length} alerts</span>}
          {(acuteZones.length + activeZones.length) > 0 && (
            <button onClick={onContagionTab} style={{
              background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.3)',
              color: T.white, padding: '3px 11px', borderRadius: 20,
              fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {acuteZones.length + activeZones.length} contagion zone{acuteZones.length + activeZones.length !== 1 ? 's' : ''} active →
            </button>
          )}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,.48)', marginBottom: 10 }}>{fmtDayTime()}</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="sw-btn" style={{
            background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.28)',
            color: T.white, padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
          }}>Network Map</button>
          <button className="sw-btn" style={{
            background: 'rgba(255,255,255,.95)', border: 'none', padding: '7px 16px',
            borderRadius: 20, fontSize: 12, fontWeight: 800, color: RISK_ACCENT[label],
          }}>Morning Briefing</button>
        </div>
      </div>
    </div>
  );
};

// ── DO THIS NOW ─────────────────────────────────────────────────────────────
const DoThisNow = ({ items }: { items: string[] }) => {
  if (!items.length) return null;
  return (
    <div className="sw-fade-up" style={{
      background: T.deep, borderRadius: 12, padding: '16px 20px',
      display: 'flex', alignItems: 'flex-start', gap: 14,
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
        background: 'rgba(212,91,79,.2)', border: `1.5px solid rgba(212,91,79,.45)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15, marginTop: 1,
      }}>⚡</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: T.watch, marginBottom: 6 }}>
          Do This Before Students Arrive
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {items.map((item, i) => (
            <div key={i} style={{ fontSize: 13.5, fontWeight: 600, color: T.white, lineHeight: 1.5 }}>
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── ICE ALERT STRIP ─────────────────────────────────────────────────────────
const IceStrip = ({ alerts }: { alerts: IceAlert[] }) => {
  if (!alerts.length) return null;
  return (
    <div style={{
      background: '#F5F3FF', border: `1px solid #DDD6FE`, borderLeft: `4px solid ${T.ice}`,
      borderRadius: 12, padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
    }} className="sw-hover">
      <span style={{ background: T.ice, color: T.white, fontSize: 8, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 4, flexShrink: 0 }}>ICE</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.ice }}>Immigration enforcement activity near campus</div>
        <div style={{ fontSize: 11.5, color: T.mid, marginTop: 1 }}>
          {alerts.length} report{alerts.length !== 1 ? 's' : ''} in your area · Lock exterior doors · Contact Network Legal
        </div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: T.ice, flexShrink: 0 }}>{alerts.length} report{alerts.length !== 1 ? 's' : ''} →</div>
    </div>
  );
};

// ── LIVE FEED ITEM ──────────────────────────────────────────────────────────
const LiveFeedItem = ({ item }: { item: any }) => {
  const typeLabel = item.type?.replace(/_/g, ' ') || 'REPORT';
  const typeColor = item.isViolent ? '#FEE2E2' : T.bg2;
  const typeText = item.isViolent ? '#7F1D1D' : T.mid;

  return (
    <div className="sw-hover" style={{
      display: 'flex', alignItems: 'flex-start', padding: '11px 18px', gap: 11,
      borderBottom: `1px solid ${T.chalk}`, cursor: 'pointer',
    }}>
      {/* Type badge */}
      <span style={{
        fontSize: 8.5, fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase',
        padding: '3px 8px', borderRadius: 4, flexShrink: 0, background: typeColor, color: typeText,
        marginTop: 1, minWidth: 68, textAlign: 'center',
      }}>{typeLabel.slice(0, 12)}</span>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2, flexWrap: 'wrap' }}>
          <SourceBadge label={item.sourceBadge} color={item.badgeColor} />
          <span style={{ fontSize: 13.5, fontWeight: 600, color: T.deep, lineHeight: 1.3 }}>{item.title}</span>
        </div>
        <div style={{ fontSize: 11, color: T.light }}>
          {item.source} · {item.location}
          {item.newsSource && item.newsSource !== item.source ? ` · ${item.newsSource}` : ''}
        </div>
      </div>

      {/* Meta */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12.5, fontWeight: 600, color: T.deep }}>
          {item.dist < 0.1 ? '<0.1' : item.dist.toFixed(1)} mi
        </div>
        <div style={{ fontSize: 11, color: T.light, marginTop: 1 }}>{fmtAgo(item.timestamp)}</div>
      </div>
    </div>
  );
};

// ── LIVE FEED CARD ──────────────────────────────────────────────────────────
const LiveFeedCard = ({
  feed, campus, loading,
}: {
  feed: any[]; campus: any; loading: boolean;
}) => {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? feed : feed.slice(0, 6);
  const hasData = feed.length > 0;

  return (
    <div>
      <SectionHead
        label="Live Intel · Last 24H · Within 1 Mile"
        right={
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.clear, display: 'inline-block' }} className="sw-live" />
            Citizen + CPD Radio + News
          </span>
        }
      />
      <div style={{ background: T.white, border: `1px solid ${T.chalk}`, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.05),0 4px 12px rgba(0,0,0,.04)', overflow: 'hidden' }}>
        {loading && (
          <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Skeleton w="90%" h={18} /><Skeleton w="70%" h={14} /><Skeleton w="85%" h={18} />
          </div>
        )}
        {!loading && !hasData && (
          <div style={{ padding: '28px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>🌙</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.mid, marginBottom: 4 }}>Quiet overnight</div>
            <div style={{ fontSize: 12.5, color: T.light }}>No incidents reported near {campus?.short || campus?.name} in the last 24 hours.</div>
          </div>
        )}
        {!loading && visible.map(item => <LiveFeedItem key={item.id} item={item} />)}
        {!loading && hasData && (
          <div style={{
            background: T.bg, borderTop: `1px solid ${T.chalk}`, padding: '9px 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ fontSize: 11.5, color: T.mid }}>
              {feed.length} incident{feed.length !== 1 ? 's' : ''} · 24H · 1-mile radius
            </div>
            {feed.length > 6 && (
              <button onClick={() => setShowAll(!showAll)} style={{
                fontSize: 12, fontWeight: 600, color: T.mid, background: 'none',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              }}>{showAll ? 'Show less' : `Show all ${feed.length} →`}</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── CONTAGION TEASER STRIP ───────────────────────────────────────────────────
const ContagionTeaser = ({ zones, onView }: { zones: ContagionZone[]; onView: () => void }) => {
  if (!zones.length) return null;
  const acute = zones.filter(z => z.phase === 'ACUTE');
  const active = zones.filter(z => z.phase === 'ACTIVE');
  const topZone = acute[0] || active[0] || zones[0];
  const phase = topZone?.phase || 'WATCH';
  const color = PHASE_COLOR[phase];
  const bg = PHASE_BG[phase];
  const bd = PHASE_BD[phase];
  const elapsed = topZone?.triggeredAt ? Math.round(ageInHours(topZone.triggeredAt)) : null;
  const phaseEnds: Record<string, number> = { ACUTE: 18, ACTIVE: 72, WATCH: 168, MONITOR: 504 };
  const remaining = elapsed !== null ? Math.max(0, phaseEnds[phase] - elapsed) : null;

  return (
    <div onClick={onView} style={{
      background: bg, border: `1px solid ${bd}`, borderLeft: `4px solid ${color}`,
      borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
    }} className="sw-hover">
      <span style={{ background: color, color: T.white, fontSize: 8.5, fontWeight: 900, letterSpacing: '.1em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 5, flexShrink: 0 }}>
        {phase}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color }}>
          {zones.length} contagion zone{zones.length !== 1 ? 's' : ''} near campus
        </div>
        <div style={{ fontSize: 11.5, color: T.mid, marginTop: 1 }}>
          {topZone?.location || 'Nearby corridor'}
          {elapsed !== null ? ` · ${elapsed}h elapsed` : ''}
          {remaining !== null ? ` · ${fmtHours(remaining)} remaining` : ''}
        </div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color, flexShrink: 0 }}>View Danger Window →</div>
    </div>
  );
};

// ── AI MORNING BRIEF ────────────────────────────────────────────────────────
const AIBriefCard = ({ text, loading, campus, onRefresh }: {
  text: string; loading: boolean; campus: any; onRefresh: () => void;
}) => (
  <div style={{ background: T.white, border: `1px solid ${T.chalk}`, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.05),0 4px 12px rgba(0,0,0,.04)', overflow: 'hidden' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 0' }}>
      <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: T.light }}>
        Morning Brief · {campus?.short || campus?.name}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 10.5, color: T.light }}>AI · Refreshes as conditions change</span>
        <button onClick={onRefresh} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: T.light }} title="Refresh brief">↻</button>
      </div>
    </div>
    <div style={{ padding: '12px 20px 16px' }}>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Skeleton w="100%" h={18} /><Skeleton w="90%" h={18} /><Skeleton w="75%" h={18} />
        </div>
      ) : text ? (
        <p style={{ fontFamily: "Georgia,'Times New Roman',serif", fontSize: 15, lineHeight: 1.78, color: T.deep }}>{text}</p>
      ) : (
        <p style={{ fontFamily: "Georgia,'Times New Roman',serif", fontSize: 15, lineHeight: 1.78, color: T.light, fontStyle: 'italic' }}>Generating brief...</p>
      )}
    </div>
    <div style={{ display: 'flex', gap: 16, padding: '10px 20px', borderTop: `1px solid ${T.chalk}` }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: T.mid, textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer' }}>Ask Watch anything</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: T.mid, textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer' }}>View data sources</span>
    </div>
  </div>
);

// ── SCHOOL DAY TIMELINE ─────────────────────────────────────────────────────
const SchoolDayBar = ({ schoolPeriod, toArrival, toDismissal }: {
  schoolPeriod: SchoolPeriod; toArrival: number; toDismissal: number;
}) => {
  const periodLabel = schoolPeriod?.label || 'SCHOOL DAY';
  return (
    <div style={{ background: T.white, border: `1px solid ${T.chalk}`, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.05)', padding: '13px 18px' }}>
      <div style={{ display: 'flex', height: 5, borderRadius: 3, overflow: 'hidden', gap: 1.5, marginBottom: 6 }}>
        <div style={{ flex: 10, background: T.chalk }} />
        <div style={{ flex: 8, background: '#93C5FD' }} />
        <div style={{ flex: 46, background: T.deep }} />
        <div style={{ flex: 17, background: T.chalk }} />
        <div style={{ flex: 17, background: T.chalk }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8.5, color: T.light, letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 7 }}>
        <span>Pre</span><span>Arrival</span>
        <span style={{ color: T.deep, fontWeight: 800 }}>School Day</span>
        <span>Dismissal</span><span>After</span>
      </div>
      <div style={{ fontSize: 12.5, color: T.mid }}>
        {periodLabel === 'BEFORE_SCHOOL' && toArrival > 0
          ? <><strong style={{ color: T.deep }}>Arrival in {toArrival}m.</strong> Students approaching — staff visibility critical.</>
          : periodLabel === 'SCHOOL_DAY' && toDismissal > 0
          ? <><strong style={{ color: T.deep }}>Dismissal in {Math.round(toDismissal / 60)}h {toDismissal % 60}m.</strong> Brief staff before lunch, not at the bell.</>
          : periodLabel === 'AFTER_SCHOOL'
          ? <>School day complete. Monitor dismissal conditions.</>
          : <><strong style={{ color: T.deep }}>School in session.</strong> Next key moment: Dismissal.</>
        }
      </div>
    </div>
  );
};

// ── CPD PATTERN DATA CARD ────────────────────────────────────────────────────
const CPDPatternCard = ({ incidents, campus }: { incidents: Incident[]; campus: any }) => {
  const near = incidents.filter(inc =>
    haversine(campus.lat, campus.lng, inc.lat, inc.lng) <= 1.0
  );
  const violent = near.filter(inc =>
    ['HOMICIDE','SHOOTING','BATTERY','ASSAULT','ROBBERY','WEAPONS VIOLATION'].includes((inc.type || '').toUpperCase())
  );
  const mostRecent = incidents.length > 0
    ? `${Math.round(ageInHours(incidents[0]?.date))}h old`
    : 'unknown';

  return (
    <div style={{ background: T.white, border: `1px solid ${T.chalk}`, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.05)', overflow: 'hidden' }}>
      <div style={{ background: '#FFFBEB', borderBottom: `1px solid #FDE68A`, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12 }}>⚠️</span>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: '#78350F' }}>30-Day Pattern Data · CPD · {mostRecent} lag</span>
        <span style={{ fontSize: 10.5, color: '#92400E', marginLeft: 4 }}>This is historical — not last night</span>
      </div>
      <div style={{ padding: '14px 18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {[
            { label: 'Violent incidents', value: violent.length, sub: 'within 1 mile · 30 days' },
            { label: 'Total incidents', value: near.length, sub: 'all types · 30 days' },
            { label: 'Pattern score', value: `${Math.min(Math.round(near.length / 10), 99)}`, sub: 'CPD-based · not live' },
          ].map(({ label, value, sub }) => (
            <div key={label}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: T.light, marginBottom: 4 }}>{label}</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 20, fontWeight: 700, color: T.deep, marginBottom: 2 }}>{value}</div>
              <div style={{ fontSize: 10.5, color: T.light }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── DATA SOURCES FOOTER ──────────────────────────────────────────────────────
const DataSources = ({
  cpdCount, citizenCount, scannerCalls, newsCount, iceCount, updatedAt,
}: {
  cpdCount: number; citizenCount: number; scannerCalls: number; newsCount: number; iceCount: number; updatedAt: Date;
}) => {
  const [open, setOpen] = useState(false);
  const sources = [
    { name: 'Citizen App', status: 'LIVE', badge: T.clear, detail: `${citizenCount} incidents near campuses` },
    { name: 'CPD Radio (Scanner)', status: 'LIVE', badge: T.brass, detail: `${scannerCalls} calls monitored` },
    { name: 'News Feeds', status: 'LIVE', badge: T.ice, detail: `${newsCount} incidents geocoded` },
    { name: 'ICE Monitoring', status: 'LIVE', badge: T.ice, detail: `${iceCount} alerts` },
    { name: 'CPD Crime Data', status: 'LAGGED', badge: T.light, detail: `${cpdCount} incidents · 7-8 day publication lag` },
    { name: 'ShotSpotter', status: 'ACOUSTIC', badge: T.brass, detail: 'Acoustic sensor network · 2h window' },
  ];

  return (
    <div style={{ background: T.white, border: `1px solid ${T.chalk}`, borderRadius: 12 }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
      }}>
        <div style={{ fontSize: 12.5, color: T.mid, fontWeight: 500 }}>
          Data Sources &amp; Freshness
          <span style={{ fontSize: 10.5, color: T.light, marginLeft: 8 }}>6 active · {fmtAgo(updatedAt.getTime())}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {[T.clear, T.brass, T.ice, T.ice, T.light, T.brass].map((c, i) => (
            <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />
          ))}
          <span style={{ color: T.light, marginLeft: 4, fontSize: 10 }}>{open ? '▲' : '▾'}</span>
        </div>
      </button>
      {open && (
        <div style={{ borderTop: `1px solid ${T.chalk}`, padding: '10px 16px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sources.map(s => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ background: s.badge, color: T.white, fontSize: 7.5, fontWeight: 900, letterSpacing: '.1em', textTransform: 'uppercase', padding: '2px 6px', borderRadius: 3, flexShrink: 0, minWidth: 52, textAlign: 'center' }}>{s.status}</span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: T.deep, minWidth: 160 }}>{s.name}</span>
              <span style={{ fontSize: 12, color: T.light }}>{s.detail}</span>
            </div>
          ))}
          <div style={{ fontSize: 10, color: T.light, marginTop: 4, lineHeight: 1.6 }}>
            Data: Chicago Police Department · Citizen · CPD Radio (OpenMHz) · Block Club Chicago · WGN TV · ABC7 · NBC5 · CBS · Sun-Times · Fox 32 · Open-Meteo<br />
            Contagion model: Papachristos et al., Yale/UChicago. Risk engine updates every 90 seconds.
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// THE DANGER WINDOW — Hero contagion visualization
// ─────────────────────────────────────────────────────────────────────────────
const DangerWindow = ({ zone }: { zone: ContagionZone }) => {
  const elapsed = zone.triggeredAt ? ageInHours(zone.triggeredAt) : 0;
  const phase = zone.phase || 'ACTIVE';
  const color = PHASE_COLOR[phase];

  // Phase definitions: visual width (pct) + actual duration (hours)
  const phases = [
    { key: 'ACUTE',   label: 'Acute',   visualPct: 14, durationH: 18,  startH: 0   },
    { key: 'ACTIVE',  label: 'Active',  visualPct: 24, durationH: 54,  startH: 18  },
    { key: 'WATCH',   label: 'Watch',   visualPct: 27, durationH: 96,  startH: 72  },
    { key: 'MONITOR', label: 'Monitor', visualPct: 35, durationH: 336, startH: 168 },
  ];

  // Calculate marker position (0-100%)
  let markerPct = 0;
  let cumulativeVisualPct = 0;
  for (const p of phases) {
    if (p.key === phase) {
      const phaseElapsed = Math.max(0, elapsed - p.startH);
      const fraction = Math.min(phaseElapsed / p.durationH, 0.99);
      markerPct = cumulativeVisualPct + fraction * p.visualPct;
      break;
    }
    cumulativeVisualPct += p.visualPct;
  }

  const phaseEnds: Record<string, number> = { ACUTE: 18, ACTIVE: 72, WATCH: 168, MONITOR: 504 };
  const remaining = Math.max(0, phaseEnds[phase] - elapsed);

  const phaseDescriptions: Record<string, string> = {
    ACUTE: 'Trigger event just occurred — highest immediate risk. Retaliatory action most likely in this window.',
    ACTIVE: 'Peak retaliation window. Connected network nodes are most likely to act during this phase.',
    WATCH: 'Risk is declining but not gone. Continue monitoring. No new trigger events detected.',
    MONITOR: 'Returning to baseline. Low residual risk — remain aware.',
  };

  return (
    <div style={{ background: T.white, border: `1px solid ${T.chalk}`, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.05),0 4px 12px rgba(0,0,0,.04)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 22px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
            <span style={{ background: color, color: T.white, fontSize: 8.5, fontWeight: 900, letterSpacing: '.1em', textTransform: 'uppercase', padding: '4px 11px', borderRadius: 5 }}>
              {phase}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color }}>
              {phase === 'ACUTE' ? 'Highest risk · 0–18 hours' :
               phase === 'ACTIVE' ? 'Peak retaliation window · 18–72 hours' :
               phase === 'WATCH' ? 'Elevated but declining · 3–7 days' :
               'Returning to baseline · 7–21 days'}
            </span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.deep, marginBottom: 3 }}>
            {zone.location || 'Nearby Corridor'} — {zone.triggerType || 'Trigger'} event
          </div>
          <div style={{ fontSize: 12.5, color: T.mid, lineHeight: 1.5 }}>{phaseDescriptions[phase]}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>
            {Math.round(elapsed)}h
          </div>
          <div style={{ fontSize: 10.5, color: T.light, marginTop: 2 }}>elapsed</div>
        </div>
      </div>

      {/* THE DANGER WINDOW TRACK */}
      <div style={{ padding: '18px 22px 6px' }}>
        <div style={{ position: 'relative', height: 16, borderRadius: 8, overflow: 'visible', marginBottom: 6 }}>
          {/* Full gradient track */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 8,
            background: 'linear-gradient(to right, #DC2626 0%, #DC2626 14%, #C66C3D 14%, #C66C3D 38%, #B79145 38%, #B79145 65%, #6B7280 65%, #6B7280 100%)',
          }} />
          {/* Phase division lines */}
          {[14, 38, 65].map(pct => (
            <div key={pct} style={{
              position: 'absolute', top: -2, bottom: -2, left: `${pct}%`,
              width: 2, background: 'rgba(255,255,255,0.4)', zIndex: 2,
            }} />
          ))}
          {/* Elapsed portion — bright, the rest dimmed */}
          <div style={{
            position: 'absolute', top: 0, bottom: 0,
            left: `${markerPct}%`, right: 0, borderRadius: '0 8px 8px 0',
            background: 'rgba(18,19,21,0.52)', zIndex: 3,
            transition: 'left .8s ease',
          }} />
          {/* Marker dot */}
          <div className="sw-danger-dot" style={{
            position: 'absolute', top: '50%', left: `${markerPct}%`,
            transform: 'translate(-50%,-50%)',
            width: 22, height: 22, borderRadius: '50%',
            background: T.white, border: '2.5px solid rgba(18,19,21,.15)',
            boxShadow: `0 0 0 4px rgba(255,255,255,.35), 0 2px 8px rgba(0,0,0,.2)`,
            zIndex: 10, transition: 'left .8s ease',
          }} />
        </div>

        {/* Phase labels */}
        <div style={{ display: 'flex', marginBottom: 4 }}>
          {phases.map(p => (
            <div key={p.key} style={{ flex: `0 0 ${p.visualPct}%`, paddingRight: 2 }}>
              <div style={{
                fontSize: 8.5, fontWeight: p.key === phase ? 900 : 600,
                letterSpacing: '.05em', textTransform: 'uppercase',
                color: p.key === phase ? PHASE_COLOR[p.key] : T.light,
                opacity: p.key === phase ? 1 : 0.55,
              }}>
                {p.key === phase ? `▶ ${p.label.toUpperCase()}` : p.label.toUpperCase()}
              </div>
              <div style={{ fontSize: 9, color: T.light, opacity: p.key === phase ? 0.8 : 0.45, marginTop: 1 }}>
                {p.key === 'ACUTE' ? '0–18h' : p.key === 'ACTIVE' ? '18–72h' : p.key === 'WATCH' ? '3–7d' : '7–21d'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Time remaining + action */}
      <div style={{ padding: '0 22px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', gap: 24 }}>
          <div>
            <div style={{ fontSize: 10, color: T.light, marginBottom: 2 }}>Time remaining</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, fontWeight: 700, color: T.light }}>
              {fmtHours(remaining)}
            </div>
          </div>
          {zone.networkNodes !== undefined && (
            <div>
              <div style={{ fontSize: 10, color: T.light, marginBottom: 2 }}>Network nodes nearby</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, fontWeight: 700, color }}>
                {zone.networkNodes}
              </div>
            </div>
          )}
        </div>
        <div style={{
          background: PHASE_BG[phase], border: `1px solid ${PHASE_BD[phase]}`,
          borderLeft: `3px solid ${color}`, borderRadius: 8, padding: '10px 14px', maxWidth: 260,
        }}>
          <div style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: T.watch, marginBottom: 4 }}>Protocol</div>
          <div style={{ fontSize: 12.5, color: T.deep, lineHeight: 1.5 }}>
            {phase === 'ACUTE'
              ? 'All entry staff briefed. Exterior supervision elevated. Contact Network Leadership immediately.'
              : phase === 'ACTIVE'
              ? 'Brief arrival staff. Increase supervision at entry points. Do not dismiss early without network clearance.'
              : phase === 'WATCH'
              ? 'Remain aware. No immediate action required. Continue normal operations with heightened awareness.'
              : 'Risk returning to baseline. No additional protocols required.'}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── CONTAGION ZONE CARD (compact, for lists) ─────────────────────────────────
const ContagionZoneCard = ({ zone, onExpand }: { zone: ContagionZone; onExpand?: () => void }) => {
  const [expanded, setExpanded] = useState(false);
  const phase = zone.phase || 'WATCH';
  const color = PHASE_COLOR[phase];
  const elapsed = zone.triggeredAt ? Math.round(ageInHours(zone.triggeredAt)) : 0;
  const phaseEnds: Record<string, number> = { ACUTE: 18, ACTIVE: 72, WATCH: 168, MONITOR: 504 };
  const remaining = Math.max(0, phaseEnds[phase] - elapsed);

  // Mini track proportions
  const phases = [
    { key: 'ACUTE', pct: 14 }, { key: 'ACTIVE', pct: 24 },
    { key: 'WATCH', pct: 27 }, { key: 'MONITOR', pct: 35 },
  ];
  let markerPct = 0;
  let cum = 0;
  const phaseStarts: Record<string, number> = { ACUTE: 0, ACTIVE: 18, WATCH: 72, MONITOR: 168 };
  const phaseDurs: Record<string, number> = { ACUTE: 18, ACTIVE: 54, WATCH: 96, MONITOR: 336 };
  for (const p of phases) {
    if (p.key === phase) {
      markerPct = cum + Math.min((elapsed - phaseStarts[phase]) / phaseDurs[phase], 0.99) * p.pct;
      break;
    }
    cum += p.pct;
  }

  return (
    <div style={{
      background: PHASE_BG[phase], border: `1px solid ${PHASE_BD[phase]}`,
      borderRadius: 12, overflow: 'hidden',
    }}>
      <div style={{ padding: '13px 18px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 7 }}>
          <span style={{ background: color, color: T.white, fontSize: 8.5, fontWeight: 900, letterSpacing: '.1em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 5 }}>
            {phase}
          </span>
          <span style={{ fontSize: 10.5, fontWeight: 700, color }}>
            {phase === 'ACUTE' ? 'Highest risk window' :
             phase === 'ACTIVE' ? 'Peak retaliation window' :
             phase === 'WATCH' ? 'Declining · elevated awareness' :
             'Returning to baseline'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.deep, marginBottom: 3 }}>
              {zone.location || 'Nearby Corridor'}
            </div>
            <div style={{ fontSize: 12, color: T.mid, lineHeight: 1.45 }}>
              {zone.triggerType || 'Trigger'} event · {elapsed}h elapsed · {fmtHours(remaining)} remaining
              {zone.networkNodes ? ` · ${zone.networkNodes} network nodes nearby` : ''}
            </div>
          </div>
          <button onClick={() => setExpanded(!expanded)} style={{
            background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
            color, fontFamily: 'inherit', flexShrink: 0,
          }}>{expanded ? 'Less ▲' : 'Details ▼'}</button>
        </div>
      </div>

      {/* Mini track */}
      <div style={{ padding: '0 18px 12px' }}>
        <div style={{ position: 'relative', height: 5, borderRadius: 3, overflow: 'hidden', marginBottom: 3 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #DC2626 0%, #DC2626 14%, #C66C3D 14%, #C66C3D 38%, #B79145 38%, #B79145 65%, #6B7280 65%, #6B7280 100%)' }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${markerPct}%`, right: 0, background: 'rgba(18,19,21,0.52)' }} />
          <div style={{ position: 'absolute', top: '50%', left: `${markerPct}%`, transform: 'translate(-50%,-50%)', width: 9, height: 9, borderRadius: '50%', background: T.white, border: '1.5px solid rgba(0,0,0,.15)', zIndex: 10 }} />
        </div>
        <div style={{ display: 'flex' }}>
          {phases.map(p => (
            <div key={p.key} style={{ flex: `0 0 ${p.pct}%`, fontSize: 8, fontWeight: p.key === phase ? 800 : 500, color: p.key === phase ? PHASE_COLOR[p.key] : T.light, opacity: p.key === phase ? 1 : 0.5, textTransform: 'uppercase', letterSpacing: '.04em' }}>
              {p.key === phase ? `▶${p.key.slice(0,3)}` : p.key.slice(0,3)}
            </div>
          ))}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ background: T.white, borderTop: `1px solid ${PHASE_BD[phase]}`, padding: '12px 18px', display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}>
            {[
              { label: 'Trigger event', value: `${zone.triggerType || 'Unknown'} · ${zone.location || 'Unknown location'}` },
              { label: 'Elapsed', value: `${elapsed}h in ${phase} phase` },
              { label: 'Phase ends', value: `In ${fmtHours(remaining)}` },
              { label: 'Model', value: 'Papachristos et al., Yale/UChicago' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${T.chalk}`, fontSize: 12 }}>
                <span style={{ color: T.light }}>{label}</span>
                <span style={{ fontWeight: 600, color: T.deep }}>{value}</span>
              </div>
            ))}
          </div>
          <div style={{ width: 200, flexShrink: 0, background: PHASE_BG[phase], borderRadius: 8, borderLeft: `3px solid ${color}`, padding: '10px 12px' }}>
            <div style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: T.watch, marginBottom: 4 }}>Action</div>
            <div style={{ fontSize: 12, color: T.deep, lineHeight: 1.5 }}>
              {phase === 'ACUTE' ? 'Contact Network Leadership. Elevate exterior supervision immediately.'
               : phase === 'ACTIVE' ? 'Brief arrival and dismissal staff. No early release without network clearance.'
               : 'Continue normal operations with heightened situational awareness.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── CONTAGION SCIENCE EXPLAINER ──────────────────────────────────────────────
const ContagionScience = () => (
  <div style={{ background: T.deep, borderRadius: 12, padding: '16px 20px' }}>
    <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.32)', marginBottom: 8 }}>
      The Science Behind This
    </div>
    <p style={{ fontFamily: "Georgia,'Times New Roman',serif", fontSize: 13.5, lineHeight: 1.72, color: 'rgba(255,255,255,.82)' }}>
      Violence spreads like a disease — this is not a metaphor. Dr. Andrew Papachristos at Yale showed that gunshot victimization moves through social networks the same way infectious disease propagates through populations. A homicide creates retaliatory violence in{' '}
      <strong style={{ color: T.brass }}>predictable patterns over the following 18–72 hours</strong>.
      His research in Chicago showed 70% of all shootings occur within co-offending networks representing less than 6% of the population.{' '}
      <strong style={{ color: T.brass }}>Watch operationalizes this in real time.</strong>
    </p>
  </div>
);

// ── NETWORK KPI ROW ──────────────────────────────────────────────────────────
const NetworkKPIs = ({
  allRisks, iceAlerts, zones,
}: {
  allRisks: CampusRisk[]; iceAlerts: IceAlert[]; zones: ContagionZone[];
}) => {
  const overnight = allRisks.filter(r => r.label === 'CRITICAL').length;
  const high = allRisks.filter(r => r.label === 'HIGH').length;
  const elevated = allRisks.filter(r => r.label === 'ELEVATED').length;
  const acuteZones = zones.filter(z => z.phase === 'ACUTE');
  const activeZones = zones.filter(z => z.phase === 'ACTIVE');
  const allActiveZones = acuteZones.length + activeZones.length;
  const normalCount = allRisks.filter(r => r.label === 'LOW').length;

  const kpis = [
    {
      label: 'Overnight Violence',
      value: high + overnight === 0 ? 'All clear' : `${high + overnight} campus${high + overnight !== 1 ? 'es' : ''}`,
      sub: high + overnight === 0 ? 'No violent incidents near any campus' : `${high + overnight} HIGH · ${elevated} ELEVATED · ${normalCount} normal`,
      cls: high + overnight === 0 ? 'clr' : 'hi',
      valueColor: high + overnight === 0 ? T.clear : T.high,
      bg: high + overnight === 0 ? '#F0FDF4' : '#FFF4EE',
      bd: high + overnight === 0 ? '#BBF7D0' : '#F5C4A0',
    },
    {
      label: 'Contagion Zones',
      value: allActiveZones === 0 ? 'All clear' : `${allActiveZones} active`,
      sub: allActiveZones === 0 ? 'No active zones across the network'
        : `${acuteZones.length} ACUTE · ${activeZones.length} ACTIVE · ${zones.filter(z => z.phase === 'WATCH').length} WATCH`,
      valueColor: allActiveZones === 0 ? T.clear : T.elev,
      bg: allActiveZones === 0 ? '#F0FDF4' : '#FEF9E7',
      bd: allActiveZones === 0 ? '#BBF7D0' : '#F0D88A',
    },
    {
      label: 'ICE Activity',
      value: iceAlerts.length === 0 ? 'No alerts' : `${iceAlerts.length} alert${iceAlerts.length !== 1 ? 's' : ''}`,
      sub: iceAlerts.length === 0 ? 'No enforcement activity reported' : 'Contact Network Legal · Review shelter protocol',
      valueColor: iceAlerts.length === 0 ? T.clear : T.ice,
      bg: iceAlerts.length === 0 ? '#F0FDF4' : '#F5F3FF',
      bd: iceAlerts.length === 0 ? '#BBF7D0' : '#DDD6FE',
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
      {kpis.map(kpi => (
        <div key={kpi.label} style={{ background: kpi.bg, border: `1px solid ${kpi.bd}`, borderRadius: 12, padding: '15px 17px', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: T.light, marginBottom: 7 }}>{kpi.label}</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 19, fontWeight: 700, marginBottom: 4, color: kpi.valueColor }}>{kpi.value}</div>
          <div style={{ fontSize: 11.5, color: T.mid, lineHeight: 1.45 }}>{kpi.sub}</div>
        </div>
      ))}
    </div>
  );
};

// ── CALL LIST ────────────────────────────────────────────────────────────────
const CallList = ({ allRisks, zones, onSelectCampus }: {
  allRisks: CampusRisk[]; zones: ContagionZone[]; onSelectCampus: (id: number) => void;
}) => {
  const urgent = allRisks
    .filter(r => r.label === 'HIGH' || r.label === 'CRITICAL')
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (!urgent.length) return null;

  const getCampusName = (id: number) => CAMPUSES.find(c => c.id === id)?.name || 'Unknown Campus';
  const getCampusZones = (id: number) => zones.filter(z => z.campusId === id);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.crit, animation: 'blink 1.6s ease-in-out infinite' }} />
        <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: '#DC2626' }}>
          Call These Principals Now
        </div>
      </div>
      <div style={{ background: T.white, border: `1px solid ${T.chalk}`, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.05),0 4px 12px rgba(0,0,0,.04)', overflow: 'hidden' }}>
        {urgent.map((r, i) => {
          const cZones = getCampusZones(r.campusId);
          const hasAcute = cZones.some(z => z.phase === 'ACUTE');
          const hasActive = cZones.some(z => z.phase === 'ACTIVE');
          return (
            <div key={r.campusId} className="sw-attn-hover" style={{
              display: 'flex', alignItems: 'center', padding: '12px 18px', gap: 12,
              borderBottom: i < urgent.length - 1 ? `1px solid ${T.chalk}` : 'none',
            }}>
              <span style={{
                fontSize: 8.5, fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase',
                padding: '4px 9px', borderRadius: 5, flexShrink: 0,
                background: r.label === 'CRITICAL' ? '#FEF2F2' : '#FFF4EE',
                color: r.label === 'CRITICAL' ? '#7F1D1D' : '#78350F',
                border: `1px solid ${r.label === 'CRITICAL' ? '#FECACA' : '#F5C4A0'}`,
              }}>{r.label}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 2 }}>{getCampusName(r.campusId)}</div>
                <div style={{ fontSize: 12, color: T.mid, lineHeight: 1.4 }}>
                  Score {r.score}
                  {hasAcute ? ' · ACUTE contagion zone' : hasActive ? ' · ACTIVE contagion zone' : ''}
                  {r.contagionZones?.length > 0 ? '' : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
                <button className="sw-btn" style={{ padding: '5px 12px', border: `1px solid ${T.chalk}`, borderRadius: 6, background: T.white, fontSize: 11.5, fontWeight: 500, color: T.mid }}>
                  Copy Script
                </button>
                <button className="sw-btn" onClick={() => onSelectCampus(r.campusId)} style={{ padding: '5px 12px', background: T.deep, border: `1px solid ${T.deep}`, borderRadius: 6, color: T.white, fontSize: 11.5, fontWeight: 700 }}>
                  View →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── CAMPUS LIST ──────────────────────────────────────────────────────────────
const CampusList = ({ allRisks, zones, onSelectCampus }: {
  allRisks: CampusRisk[]; zones: ContagionZone[]; onSelectCampus: (id: number) => void;
}) => {
  const [showAll, setShowAll] = useState(false);
  const sorted = [...allRisks].sort((a, b) => b.score - a.score);
  const visible = showAll ? sorted : sorted.slice(0, 8);

  return (
    <div>
      <SectionHead label={`All Campuses · ${CAMPUSES.length} Total`} />
      <div style={{ background: T.white, border: `1px solid ${T.chalk}`, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.05),0 4px 12px rgba(0,0,0,.04)', overflow: 'hidden' }}>
        <div style={{ background: T.bg, padding: '8px 18px', borderBottom: `1px solid ${T.chalk}`, display: 'flex', justifyContent: 'space-between', fontSize: 8.5, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: T.light }}>
          <span>Campus</span><span>Condition · Live</span>
        </div>
        {visible.map((r, i) => {
          const campus = CAMPUSES.find(c => c.id === r.campusId);
          const cZones = zones.filter(z => z.campusId === r.campusId);
          const topZone = cZones.find(z => z.phase === 'ACUTE') || cZones.find(z => z.phase === 'ACTIVE') || cZones[0];
          const accent = RISK_ACCENT[r.label] || T.monitor;
          return (
            <div key={r.campusId} className="sw-row" onClick={() => onSelectCampus(r.campusId)} style={{
              display: 'flex', alignItems: 'center', padding: '10px 18px', gap: 12,
              borderBottom: i < visible.length - 1 ? `1px solid ${T.chalk}` : 'none', cursor: 'pointer',
            }}>
              <div style={{ flex: 1.3 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.deep }}>{campus?.short || campus?.name}</div>
                <div style={{ fontSize: 10.5, color: T.light, marginTop: 1 }}>{campus?.communityArea || ''}</div>
              </div>
              <div style={{ flex: 2.5, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: T.mid }}>
                <span style={{
                  fontSize: 8.5, fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase',
                  padding: '3px 8px', borderRadius: 4, flexShrink: 0,
                  background: r.label === 'HIGH' || r.label === 'CRITICAL' ? '#FFF4EE' : r.label === 'ELEVATED' ? '#FEF9E7' : '#F0FDF4',
                  color: r.label === 'HIGH' || r.label === 'CRITICAL' ? '#78350F' : r.label === 'ELEVATED' ? '#78350F' : T.clear,
                  border: `1px solid ${r.label === 'HIGH' || r.label === 'CRITICAL' ? '#F5C4A0' : r.label === 'ELEVATED' ? '#F0D88A' : '#BBF7D0'}`,
                }}>{r.label}</span>
                {topZone && (
                  <span style={{ color: PHASE_COLOR[topZone.phase], fontWeight: 600, fontSize: 11.5 }}>
                    {topZone.phase} zone
                  </span>
                )}
              </div>
              <div style={{ color: T.light, fontSize: 12 }}>→</div>
            </div>
          );
        })}
        <div onClick={() => setShowAll(!showAll)} style={{
          padding: '10px 18px', background: T.bg, borderTop: `1px solid ${T.chalk}`,
          fontSize: 12, fontWeight: 600, color: T.mid, cursor: 'pointer', textAlign: 'center',
        }}>
          {showAll ? 'Show less' : `Show all ${CAMPUSES.length} campuses →`}
        </div>
      </div>
    </div>
  );
};

// ── NETWORK BRIEF ────────────────────────────────────────────────────────────
const NetworkBriefCard = ({ text, loading, onRefresh }: {
  text: string; loading: boolean; onRefresh: () => void;
}) => (
  <div style={{ background: T.deep, borderRadius: 12, padding: '18px 22px' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)' }}>
        Network Brief · AI · {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
      </div>
      <button onClick={onRefresh} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'rgba(255,255,255,.3)' }}>↻</button>
    </div>
    {loading ? (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Skeleton w="100%" h={18} /><Skeleton w="88%" h={18} /><Skeleton w="72%" h={18} />
      </div>
    ) : (
      <p style={{ fontFamily: "Georgia,'Times New Roman',serif", fontSize: 14.5, lineHeight: 1.75, color: 'rgba(255,255,255,.88)', marginBottom: 14 }}>
        {text || 'Generating network brief...'}
      </p>
    )}
    <div style={{ display: 'flex', gap: 9 }}>
      <button className="sw-btn" style={{ background: T.brass, color: T.white, border: 'none', padding: '8px 17px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
        Send Network Alert
      </button>
      <button className="sw-btn" style={{ background: 'transparent', color: 'rgba(255,255,255,.6)', border: '1px solid rgba(255,255,255,.15)', padding: '8px 17px', borderRadius: 8, fontSize: 12, fontWeight: 500 }}>
        Ask Watch anything
      </button>
    </div>
  </div>
);

// ── NETWORK CONTAGION SUMMARY ─────────────────────────────────────────────────
const NetworkContagionSummary = ({ zones }: { zones: ContagionZone[] }) => {
  const byPhase = {
    ACUTE:   zones.filter(z => z.phase === 'ACUTE'),
    ACTIVE:  zones.filter(z => z.phase === 'ACTIVE'),
    WATCH:   zones.filter(z => z.phase === 'WATCH'),
    MONITOR: zones.filter(z => z.phase === 'MONITOR'),
  };
  const stats = [
    { label: 'Acute Zones', sub: '0–18 hours · Highest risk', count: byPhase.ACUTE.length, color: T.acute, detail: byPhase.ACUTE.map(z => z.location || '').filter(Boolean).join(' · ') || 'None' },
    { label: 'Active Zones', sub: '18–72h · Peak retaliation', count: byPhase.ACTIVE.length, color: T.active, detail: byPhase.ACTIVE.map(z => z.location || '').filter(Boolean).join(' · ') || 'None' },
    { label: 'Watch Zones', sub: '3–7 days · Declining', count: byPhase.WATCH.length, color: T.watch_c, detail: byPhase.WATCH.map(z => z.location || '').filter(Boolean).join(' · ') || 'None' },
    { label: 'Monitor Phase', sub: '7–21 days · Near baseline', count: byPhase.MONITOR.length, color: T.monitor, detail: byPhase.MONITOR.length === 0 ? 'All clear' : `${byPhase.MONITOR.length} zone${byPhase.MONITOR.length !== 1 ? 's' : ''}` },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {stats.map(s => (
        <div key={s.label} style={{ background: T.white, border: `1px solid ${T.chalk}`, borderRadius: 12, padding: '13px 16px' }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: T.light, marginBottom: 7 }}>{s.label}</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, fontWeight: 700, marginBottom: 3, color: s.count > 0 ? s.color : T.clear }}>
            {s.count === 0 ? 'All clear' : `${s.count} zone${s.count !== 1 ? 's' : ''}`}
          </div>
          <div style={{ fontSize: 10.5, color: T.light, marginBottom: 4 }}>{s.sub}</div>
          {s.count > 0 && <div style={{ fontSize: 11.5, color: T.mid }}>{s.detail}</div>}
        </div>
      ))}
    </div>
  );
};

// ── CAMPUS DROPDOWN ──────────────────────────────────────────────────────────
const CampusDropdown = ({ campuses, selectedId, onSelect }: {
  campuses: any[]; selectedId: number; onSelect: (id: number) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const selected = campuses.find(c => c.id === selectedId);
  const filtered = search.trim()
    ? campuses.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || (c.communityArea || '').toLowerCase().includes(search.toLowerCase()))
    : [...campuses].sort((a, b) => a.name.localeCompare(b.name));

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => { setOpen(!open); setSearch(''); }} style={{
        background: T.bg, border: `1px solid ${T.chalk}`, borderRadius: 9,
        padding: '5px 12px', fontSize: 12, fontWeight: 600, color: T.deep,
        cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
      }}>
        {selected?.short || selected?.name || 'Select campus'}
        <span style={{ fontSize: 9, opacity: .5 }}>▼</span>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
          marginTop: 4, width: 280, background: T.white, borderRadius: 12,
          boxShadow: '0 8px 30px rgba(0,0,0,.14)', zIndex: 2000,
          overflow: 'hidden', border: `1px solid ${T.chalk}`,
        }}>
          <input autoFocus type="text" placeholder="Search campuses..." value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '9px 13px', border: 'none', borderBottom: `1px solid ${T.chalk}`, fontSize: 13, outline: 'none', color: T.deep, boxSizing: 'border-box', fontFamily: 'inherit' }}
          />
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            {filtered.map(c => (
              <button key={c.id} onClick={() => { onSelect(c.id); setOpen(false); }} style={{
                display: 'block', width: '100%', padding: '9px 13px',
                border: 'none', borderBottom: `1px solid ${T.bg}`,
                background: c.id === selectedId ? T.bg : T.white,
                cursor: 'pointer', textAlign: 'left', fontSize: 13, fontFamily: 'inherit',
                color: c.id === selectedId ? T.deep : T.rock,
                fontWeight: c.id === selectedId ? 700 : 400,
              }}>
                <div>{c.short || c.name}</div>
                <div style={{ fontSize: 10.5, color: T.light, marginTop: 1 }}>{c.communityArea || ''}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────────────────
export default function SentinelApp() {
  // ── Navigation ──
  type View = 'campus' | 'network' | 'howItWorks';
  type CampusTab = 'watch' | 'contagion' | 'feed' | 'map';
  type NetworkTab = 'dashboard' | 'contagion' | 'map' | 'news' | 'feed';

  const [view, setView] = useState<View>('network');
  const [campusTab, setCampusTab] = useState<CampusTab>('watch');
  const [networkTab, setNetworkTab] = useState<NetworkTab>('dashboard');
  const [selectedCampusId, setSelectedCampusId] = useState(1);

  // ── UI State ──
  const [activeProtocol, setActiveProtocol] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [updatedText, setUpdatedText] = useState('just now');
  const [justRefreshed, setJustRefreshed] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [askQuery, setAskQuery] = useState('');
  const [askAnswer, setAskAnswer] = useState('');
  const [askLoading, setAskLoading] = useState(false);
  const [askOpen, setAskOpen] = useState(false);

  // Updated-ago ticker
  useEffect(() => {
    const tick = () => {
      const s = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
      setUpdatedText(s < 5 ? 'just now' : s < 60 ? `${s}s ago` : `${Math.floor(s / 60)}m ago`);
    };
    tick();
    setJustRefreshed(true);
    const flash = setTimeout(() => setJustRefreshed(false), 1500);
    const t = setInterval(tick, 1000);
    return () => { clearInterval(t); clearTimeout(flash); };
  }, [lastUpdated]);

  // ── Data State ──
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [acuteIncidents, setAcuteIncidents] = useState<Incident[]>([]);
  const [shotSpotterEvents, setShotSpotterEvents] = useState<ShotSpotterEvent[]>([]);
  const [weather, setWeather] = useState<WeatherCurrent>({ temperature: 65, apparentTemperature: 65, precipitation: 0, windSpeed: 0 });
  const [weatherForecast, setWeatherForecast] = useState<DailyWeather[]>([]);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [iceAlerts, setIceAlerts] = useState<IceAlert[]>([]);
  const [citizenIncidents, setCitizenIncidents] = useState<CitizenIncident[]>([]);
  const [scannerData, setScannerData] = useState<ScannerSummary | null>(null);
  const [dispatchIncidents, setDispatchIncidents] = useState<DispatchIncident[]>([]);
  const [newsIncidents, setNewsIncidents] = useState<Incident[]>([]);
  const [realtimeIncidents, setRealtimeIncidents] = useState<Incident[]>([]);

  // ── Derived Data ──
  const selectedCampus = CAMPUSES.find(c => c.id === selectedCampusId) ?? CAMPUSES[0];
  const now = new Date();
  const schoolPeriod = getSchoolPeriod(now, selectedCampus);
  const tempF = weather.apparentTemperature;

  const zones = useMemo(() => buildContagionZones(incidents), [incidents]);

  const allRisks = useMemo<CampusRisk[]>(
    () => CAMPUSES.map(c => scoreCampus(c, incidents, acuteIncidents, shotSpotterEvents, zones, tempF, getSchoolPeriod(now, c))),
    [incidents, acuteIncidents, shotSpotterEvents, zones, tempF],
  );

  const selectedRisk = allRisks.find(r => r.campusId === selectedCampusId) ?? allRisks[0];
  const campusZones = selectedRisk?.contagionZones || zones.filter(z => z.campusId === selectedCampusId);

  const networkSummary = useMemo(
    () => scoreNetwork(CAMPUSES, allRisks, acuteIncidents, iceAlerts.length),
    [allRisks, acuteIncidents, iceAlerts],
  );

  // Live verdict — built on real-time sources only
  const liveVerdict = useMemo(
    () => buildLiveVerdict(selectedCampus, citizenIncidents, newsIncidents, dispatchIncidents, campusZones, iceAlerts),
    [selectedCampus, citizenIncidents, newsIncidents, dispatchIncidents, campusZones, iceAlerts],
  );

  // Live feed — woven Citizen + News + Scanner
  const liveFeed = useMemo(
    () => buildCampusFeed(selectedCampus, citizenIncidents, newsIncidents, dispatchIncidents),
    [selectedCampus, citizenIncidents, newsIncidents, dispatchIncidents],
  );

  // Do This Now items
  const doThisItems = useMemo(() => {
    const items: string[] = [];
    if (iceAlerts.length > 0) items.push('Lock all exterior doors. Contact Network Legal regarding ICE activity before 7 AM.');
    const acuteZones = campusZones.filter(z => z.phase === 'ACUTE');
    const activeZones = campusZones.filter(z => z.phase === 'ACTIVE');
    if (acuteZones.length > 0) items.push('Contact Network Leadership now — ACUTE contagion window open. Elevate exterior supervision.');
    else if (activeZones.length > 0) items.push('Brief arrival staff on active retaliation window. Increase supervision at entry points.');
    const violentFeed = liveFeed.filter(f => f.isViolent);
    if (violentFeed.length > 0) items.push(`Review ${violentFeed.length} violent incident${violentFeed.length !== 1 ? 's' : ''} reported nearby — brief staff before students arrive.`);
    return items;
  }, [iceAlerts, campusZones, liveFeed]);

  // AI briefs
  const campusBrief = useAIBrief(selectedCampus, liveVerdict, iceAlerts, campusZones);
  const networkBrief = useNetworkBrief(allRisks, iceAlerts, zones, networkSummary);

  // ── Data Refresh Cycles (preserved from original) ──
  const refresh90s = useCallback(async () => {
    const [acute, shots, realtime] = await Promise.all([
      fetchIncidents(48, 500),
      fetchShotSpotter(2, 100),
      fetchRealtimeIncidents(),
    ]);
    setAcuteIncidents(acute);
    setShotSpotterEvents(shots);
    setRealtimeIncidents(realtime);
    setLastUpdated(new Date());
  }, []);

  const refresh10min = useCallback(async () => {
    const full = await fetchIncidents(720, 5000);
    setIncidents(full);
  }, []);

  const refresh30min = useCallback(async () => {
    const [wx, wxF] = await Promise.all([fetchWeather(), fetchWeatherForecast()]);
    setWeather(wx);
    setWeatherForecast(wxF);
  }, []);

  const refresh5min = useCallback(async () => {
    const news = await fetchAllFeeds();
    setNewsItems(news);
    const ice = await fetchIceSignals(news);
    setIceAlerts(ice);
    let parsed = await geocodeNewsIncidents(news);
    if (parsed.length === 0) parsed = parseNewsAsIncidents(news);
    setNewsIncidents(parsed);
    const reddit = await fetchRedditIntel(24);
    // reddit incidents can be merged into dispatch or news feeds if needed
  }, []);

  const refreshCitizen = useCallback(async () => {
    const campus = CAMPUSES.find(c => c.id === selectedCampusId) ?? CAMPUSES[0];
    const data = await fetchCitizenIncidents(campus.lat, campus.lng, 2.0);
    setCitizenIncidents(data);
  }, [selectedCampusId]);

  const refreshScanner = useCallback(async () => {
    const data = await fetchScannerActivity(120);
    setScannerData(data);
    const allCalls = data.zones.flatMap(z => z.recentCalls);
    if (allCalls.length > 0) {
      transcribeSpikeCalls(allCalls).then(dispatches => {
        setDispatchIncidents(dispatches);
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    void Promise.all([refresh90s(), refresh10min(), refresh30min(), refresh5min(), refreshCitizen(), refreshScanner()])
      .finally(() => setInitialLoading(false));
    const t90s = setInterval(() => void refresh90s(), 90_000);
    const t10m = setInterval(() => void refresh10min(), 600_000);
    const t30m = setInterval(() => void refresh30min(), 1_800_000);
    const t5m  = setInterval(() => void refresh5min(), 300_000);
    const tCit = setInterval(() => void refreshCitizen(), 300_000);
    const tScan= setInterval(() => void refreshScanner(), 300_000);
    const onViz = () => { if (document.visibilityState === 'visible') void Promise.all([refresh90s(), refresh5min(), refreshCitizen()]); };
    document.addEventListener('visibilitychange', onViz);
    return () => { clearInterval(t90s); clearInterval(t10m); clearInterval(t30m); clearInterval(t5m); clearInterval(tCit); clearInterval(tScan); document.removeEventListener('visibilitychange', onViz); };
  }, [refresh90s, refresh10min, refresh30min, refresh5min, refreshCitizen, refreshScanner]);

  // Campus change: refresh Citizen for new campus
  useEffect(() => { void refreshCitizen(); }, [selectedCampusId]);

  // ── Handlers ──
  const handleSelectCampus = (id: number) => {
    setSelectedCampusId(id);
    setView('campus');
    setCampusTab('watch');
  };

  const handleAsk = async () => {
    if (!askQuery.trim()) return;
    setAskLoading(true);
    setAskOpen(true);
    setAskAnswer('');
    try {
      const res = await fetch('/api/anthropic-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 400,
          system: `You are Slate Watch. Answer concisely in 2-4 sentences. Plain language. No bullets. Direct.`,
          messages: [{ role: 'user', content: askQuery }],
        }),
      });
      const data = await res.json();
      setAskAnswer(data.content?.find((b: any) => b.type === 'text')?.text || 'Unable to answer.');
    } catch { setAskAnswer('Something went wrong.'); } finally { setAskLoading(false); }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  const primaryNavStyle = (active: boolean): React.CSSProperties => ({
    padding: '12px 15px', background: 'none', border: 'none', cursor: 'pointer',
    fontFamily: 'inherit', fontSize: 13,
    fontWeight: active ? 700 : 500,
    color: active ? T.deep : T.light,
    borderBottom: `2.5px solid ${active ? T.brass : 'transparent'}`,
    transition: 'all .15s',
  });

  const secondaryNavStyle = (active: boolean): React.CSSProperties => ({
    padding: '9px 13px', background: 'none', border: 'none', cursor: 'pointer',
    fontFamily: 'inherit', fontSize: 12.5,
    fontWeight: active ? 700 : 500,
    color: active ? T.deep : T.light,
    borderBottom: `2px solid ${active ? T.deep : 'transparent'}`,
    transition: 'all .15s',
    display: 'flex', alignItems: 'center', gap: 6,
  });

  const contentStyle: React.CSSProperties = {
    maxWidth: 820, margin: '0 auto', padding: '20px 28px 64px',
    display: 'flex', flexDirection: 'column', gap: 14,
  };

  const wideContentStyle: React.CSSProperties = {
    maxWidth: 1080, margin: '0 auto', padding: '20px 28px 64px',
    display: 'flex', flexDirection: 'column', gap: 14,
  };

  const scrollAreaStyle: React.CSSProperties = {
    flex: 1, overflowY: 'auto',
    background: `linear-gradient(180deg,${T.bg} 0%,${T.bg2} 100%)`,
  };

  return (
    <div style={{ fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,sans-serif", color: T.deep }}>
      <GlobalStyles />

      {activeProtocol && (
        <ProtocolModal
          code={activeProtocol}
          campus={selectedCampus}
          risk={selectedRisk}
          onClose={() => setActiveProtocol(null)}
        />
      )}

      {/* ── PRIMARY NAV ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 0, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {(['network', 'campus', 'howItWorks'] as View[]).map(v => (
            <button key={v} className="sw-tab" onClick={() => setView(v)} style={primaryNavStyle(view === v)}>
              {v === 'network' ? 'Network' : v === 'campus' ? 'My Campus' : 'How It Works'}
            </button>
          ))}
          {view === 'network' && (
            <button className="sw-tab" style={{
              padding: '9px 15px', background: 'rgba(212,91,79,.06)',
              border: `1px solid rgba(212,91,79,.22)`, borderRadius: '8px 8px 0 0',
              color: T.watch, fontSize: 13, fontWeight: 600, marginLeft: 8, cursor: 'pointer', fontFamily: 'inherit',
            }}>Command Center</button>
          )}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
          {view === 'campus' && (
            <CampusDropdown campuses={CAMPUSES} selectedId={selectedCampusId} onSelect={id => { setSelectedCampusId(id); }} />
          )}
          <span style={{ color: justRefreshed ? T.brass : T.light, transition: 'color .5s', fontSize: 11 }}>
            ⟳ {updatedText}
          </span>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          CAMPUS VIEW
      ══════════════════════════════════════════ */}
      {view === 'campus' && (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>

          {/* Verdict banner */}
          <VerdictBanner
            verdict={liveVerdict}
            campus={selectedCampus}
            onProtocol={setActiveProtocol}
            onContagionTab={() => setCampusTab('contagion')}
            iceAlerts={iceAlerts}
            zones={campusZones}
          />

          {/* Secondary nav */}
          <div style={{ background: T.white, borderBottom: `1px solid ${T.chalk}`, padding: '0 28px', display: 'flex', alignItems: 'center' }}>
            <button className="sw-tab" onClick={() => setCampusTab('watch')} style={secondaryNavStyle(campusTab === 'watch')}>Watch</button>
            <button className="sw-tab" onClick={() => setCampusTab('contagion')} style={secondaryNavStyle(campusTab === 'contagion')}>
              Contagion
              {campusZones.filter(z => ['ACUTE','ACTIVE'].includes(z.phase)).length > 0 && (
                <span style={{ background: '#FFF4EE', color: T.high, border: `1px solid #F5C4A0`, fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 8 }}>
                  {campusZones.filter(z => ['ACUTE','ACTIVE'].includes(z.phase)).length} ACTIVE
                </span>
              )}
            </button>
            <button className="sw-tab" onClick={() => setCampusTab('feed')} style={secondaryNavStyle(campusTab === 'feed')}>Feed</button>
            <button className="sw-tab" onClick={() => setCampusTab('map')} style={secondaryNavStyle(campusTab === 'map')}>Map</button>
          </div>

          {/* Campus: WATCH tab */}
          {campusTab === 'watch' && (
            <div style={scrollAreaStyle}>
              <div style={contentStyle}>

                {/* Do This Now — only if needed */}
                {doThisItems.length > 0 && <DoThisNow items={doThisItems} />}

                {/* ICE */}
                <IceStrip alerts={iceAlerts} />

                {/* Live feed */}
                <LiveFeedCard feed={liveFeed} campus={selectedCampus} loading={initialLoading} />

                {/* Contagion teaser */}
                {campusZones.length > 0 && (
                  <ContagionTeaser zones={campusZones} onView={() => setCampusTab('contagion')} />
                )}

                {/* AI Brief */}
                <AIBriefCard
                  text={campusBrief.text}
                  loading={campusBrief.loading}
                  campus={selectedCampus}
                  onRefresh={campusBrief.refresh}
                />

                {/* School day timeline */}
                <SchoolDayBar
                  schoolPeriod={schoolPeriod}
                  toArrival={minutesToArrival(now, selectedCampus)}
                  toDismissal={minutesToDismissal(now, selectedCampus)}
                />

                {/* CPD pattern (clearly labeled as lagged) */}
                {incidents.length > 0 && (
                  <CPDPatternCard incidents={incidents} campus={selectedCampus} />
                )}

                {/* Data sources */}
                <DataSources
                  cpdCount={incidents.length}
                  citizenCount={citizenIncidents.length}
                  scannerCalls={scannerData?.totalCalls || 0}
                  newsCount={newsIncidents.length}
                  iceCount={iceAlerts.length}
                  updatedAt={lastUpdated}
                />

                {/* Intel query */}
                <div style={{ background: T.white, border: `1px solid ${T.chalk}`, borderRadius: 12, overflow: 'hidden' }}>
                  <IntelQuery campus={selectedCampus} risk={selectedRisk} />
                </div>

                {/* Footer */}
                <div style={{ fontSize: 10, color: T.light, lineHeight: 1.6, textAlign: 'center', padding: '8px 0 4px', borderTop: `1px solid ${T.chalk}` }}>
                  Slate Watch · Start with the Facts · {Math.round(weather.temperature)}°F<br />
                  <span style={{ fontSize: 9, color: 'rgba(0,0,0,.2)' }}>Madden Education Advisory · Chicago, Illinois · 2026</span>
                </div>

              </div>
            </div>
          )}

          {/* Campus: CONTAGION tab */}
          {campusTab === 'contagion' && (
            <div style={scrollAreaStyle}>
              <div style={contentStyle}>

                {campusZones.length === 0 ? (
                  <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '32px 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: 24, marginBottom: 10 }}>🌿</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: T.clear, marginBottom: 6 }}>No active contagion zones</div>
                    <div style={{ fontSize: 13.5, color: '#166534', lineHeight: 1.55 }}>
                      No homicides or weapons violations have triggered the contagion model near {selectedCampus.name} recently. The model will activate automatically when a trigger event occurs within the relevant network.
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Hero: Danger Window for top zone */}
                    <SectionHead label="Danger Window · Active Phase" />
                    <DangerWindow zone={campusZones[0]} />

                    {/* Additional zones */}
                    {campusZones.length > 1 && (
                      <div>
                        <SectionHead label={`All Zones Near This Campus · ${campusZones.length}`} />
                        {campusZones.map(zone => (
                          <ContagionZoneCard key={zone.id || zone.location} zone={zone} />
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Science */}
                <ContagionScience />

                {/* Footer */}
                <div style={{ fontSize: 10, color: T.light, lineHeight: 1.6, textAlign: 'center', padding: '8px 0' }}>
                  Contagion model: Papachristos et al., Yale/UChicago. Risk engine updates every 90 seconds.
                </div>

              </div>
            </div>
          )}

          {/* Campus: FEED tab */}
          {campusTab === 'feed' && (
            <div style={scrollAreaStyle}>
              <div style={contentStyle}>
                <SectionHead
                  label={`All Incidents · ${selectedCampus.short || selectedCampus.name} · Last 24H`}
                  right={<span style={{ fontSize: 11, color: T.light }}>Citizen + CPD Radio + News</span>}
                />
                {liveFeed.length === 0 ? (
                  <div style={{ background: T.white, border: `1px solid ${T.chalk}`, borderRadius: 12, padding: '36px 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, marginBottom: 9 }}>🌙</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.mid, marginBottom: 4 }}>Nothing in the feed</div>
                    <div style={{ fontSize: 12.5, color: T.light }}>No incidents reported near {selectedCampus.name} in the last 24 hours across all live sources.</div>
                  </div>
                ) : (
                  <div style={{ background: T.white, border: `1px solid ${T.chalk}`, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.05)', overflow: 'hidden' }}>
                    {liveFeed.map(item => <LiveFeedItem key={item.id} item={item} />)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Campus: MAP tab */}
          {campusTab === 'map' && (
            <div style={scrollAreaStyle}>
              <div style={{ padding: '20px 28px' }}>
                <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${T.chalk}`, boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
                  <CampusMap
                    campus={selectedCampus}
                    risk={selectedRisk}
                    incidents={[...acuteIncidents, ...newsIncidents, ...dispatchIncidents.map(d => ({ lat: d.latitude, lng: d.longitude, type: d.type, date: d.time, id: d.id, block: d.block } as any))]}
                    shotSpotterEvents={shotSpotterEvents}
                    contagionZones={campusZones}
                    corridors={buildSafeCorridors(selectedCampus, acuteIncidents)}
                    scannerData={scannerData}
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ══════════════════════════════════════════
          NETWORK VIEW
      ══════════════════════════════════════════ */}
      {view === 'network' && (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>

          {/* Network verdict */}
          <NetworkVerdictBanner
            allRisks={allRisks}
            iceAlerts={iceAlerts}
            zones={zones}
            onContagionTab={() => setNetworkTab('contagion')}
          />

          {/* Secondary nav */}
          <div style={{ background: T.white, borderBottom: `1px solid ${T.chalk}`, padding: '0 28px', display: 'flex', alignItems: 'center' }}>
            <button className="sw-tab" onClick={() => setNetworkTab('dashboard')} style={secondaryNavStyle(networkTab === 'dashboard')}>Dashboard</button>
            <button className="sw-tab" onClick={() => setNetworkTab('contagion')} style={secondaryNavStyle(networkTab === 'contagion')}>
              Contagion
              {zones.filter(z => ['ACUTE','ACTIVE'].includes(z.phase)).length > 0 && (
                <span style={{ background: '#FFF4EE', color: T.high, border: `1px solid #F5C4A0`, fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 8 }}>
                  {zones.filter(z => ['ACUTE','ACTIVE'].includes(z.phase)).length} ACTIVE
                </span>
              )}
            </button>
            <button className="sw-tab" onClick={() => setNetworkTab('map')} style={secondaryNavStyle(networkTab === 'map')}>Map</button>
            <button className="sw-tab" onClick={() => setNetworkTab('news')} style={secondaryNavStyle(networkTab === 'news')}>News</button>
            <button className="sw-tab" onClick={() => setNetworkTab('feed')} style={secondaryNavStyle(networkTab === 'feed')}>Feed</button>
          </div>

          {/* Network: DASHBOARD */}
          {networkTab === 'dashboard' && (
            <div style={scrollAreaStyle}>
              <div style={wideContentStyle}>
                <NetworkKPIs allRisks={allRisks} iceAlerts={iceAlerts} zones={zones} />
                {zones.filter(z => ['ACUTE','ACTIVE'].includes(z.phase)).length > 0 && (
                  <div style={{ background: '#FEF9E7', border: `1px solid #F0D88A`, borderRadius: 12, padding: '13px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: T.elev, marginBottom: 4 }}>Contagion Priority</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.deep, marginBottom: 2 }}>
                        {zones.filter(z => z.phase === 'ACUTE').length > 0
                          ? `${zones.filter(z => z.phase === 'ACUTE').length} ACUTE zone${zones.filter(z => z.phase === 'ACUTE').length !== 1 ? 's' : ''} — highest risk right now`
                          : `${zones.filter(z => z.phase === 'ACTIVE').length} ACTIVE zone${zones.filter(z => z.phase === 'ACTIVE').length !== 1 ? 's' : ''} — peak retaliation window`}
                      </div>
                      <div style={{ fontSize: 12, color: T.mid }}>
                        {zones[0]?.location || 'Network-wide'} · {zones[0]?.triggeredAt ? `${Math.round(ageInHours(zones[0].triggeredAt))}h elapsed` : 'Active now'}
                      </div>
                    </div>
                    <button onClick={() => setNetworkTab('contagion')} style={{ background: T.elev, color: T.white, border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                      View Danger Windows →
                    </button>
                  </div>
                )}
                <NetworkBriefCard text={networkBrief.text} loading={networkBrief.loading} onRefresh={networkBrief.refresh} />
                <IceStrip alerts={iceAlerts} />
                <CallList allRisks={allRisks} zones={zones} onSelectCampus={handleSelectCampus} />
                <CampusList allRisks={allRisks} zones={zones} onSelectCampus={handleSelectCampus} />
              </div>
            </div>
          )}

          {/* Network: CONTAGION */}
          {networkTab === 'contagion' && (
            <div style={scrollAreaStyle}>
              <div style={wideContentStyle}>
                <ContagionScience />
                <NetworkContagionSummary zones={zones} />

                {zones.length === 0 ? (
                  <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '28px 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, marginBottom: 9 }}>🌿</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: T.clear, marginBottom: 5 }}>No active contagion zones across the network</div>
                    <div style={{ fontSize: 13, color: '#166534' }}>The model activates automatically when a homicide or weapons violation occurs near any campus.</div>
                  </div>
                ) : (
                  <div>
                    <SectionHead label={`All Active Zones · ${zones.length} Total`} />
                    {zones
                      .sort((a, b) => {
                        const order = { ACUTE: 0, ACTIVE: 1, WATCH: 2, MONITOR: 3 };
                        return (order[a.phase] ?? 4) - (order[b.phase] ?? 4);
                      })
                      .map(zone => (
                        <div key={zone.id || zone.location} style={{ marginBottom: 10 }}>
                          <ContagionZoneCard zone={zone} />
                        </div>
                      ))
                    }
                  </div>
                )}

                <div style={{ fontSize: 10, color: T.light, lineHeight: 1.6, textAlign: 'center', padding: '8px 0', borderTop: `1px solid ${T.chalk}` }}>
                  Model: Papachristos et al., Yale/UChicago · Risk engine updates every 90 seconds · Triggered by homicides and weapons violations only
                </div>
              </div>
            </div>
          )}

          {/* Network: MAP */}
          {networkTab === 'map' && (
            <div style={scrollAreaStyle}>
              <div style={{ padding: '20px 28px' }}>
                <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${T.chalk}`, boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
                  <NetworkMap
                    risks={allRisks}
                    zones={zones}
                    incidents24h={acuteIncidents}
                    iceAlerts={iceAlerts}
                    onSelectCampus={handleSelectCampus}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Network: NEWS */}
          {networkTab === 'news' && (
            <div style={scrollAreaStyle}>
              <div style={wideContentStyle}>
                <SectionHead label={`News Intelligence · ${newsItems.length} items from ${new Set(newsItems.map(n => n.source)).size} sources`} />
                <div style={{ background: T.white, border: `1px solid ${T.chalk}`, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.05)', overflow: 'hidden' }}>
                  {newsItems.slice(0, 40).map((item, i) => (
                    <div key={item.id || i} className="sw-row" style={{
                      padding: '12px 18px', borderBottom: `1px solid ${T.chalk}`,
                      cursor: 'pointer',
                    }} onClick={() => item.url && window.open(item.url, '_blank')}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3, flexWrap: 'wrap' }}>
                            {item.campusProximity && (
                              <span style={{ fontSize: 8.5, fontWeight: 800, background: '#FEF2F2', color: '#7F1D1D', padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>Near {item.campusProximity}</span>
                            )}
                            {item.isBreaking && (
                              <span style={{ fontSize: 8.5, fontWeight: 800, background: '#DC2626', color: T.white, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>Breaking</span>
                            )}
                          </div>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: T.deep, lineHeight: 1.35, marginBottom: 4 }}>{item.title}</div>
                          {item.snippet && <div style={{ fontSize: 12, color: T.light, lineHeight: 1.5 }}>{item.snippet.slice(0, 120)}...</div>}
                          <div style={{ fontSize: 11, color: T.light, marginTop: 4 }}>{item.source} · {item.publishedAt ? fmtAgo(new Date(item.publishedAt).getTime()) : ''}</div>
                        </div>
                        <div style={{ fontSize: 12, color: T.light, flexShrink: 0 }}>↗</div>
                      </div>
                    </div>
                  ))}
                  {newsItems.length === 0 && (
                    <div style={{ padding: '32px 20px', textAlign: 'center', color: T.light }}>
                      <div style={{ fontSize: 20, marginBottom: 8 }}>📰</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.mid }}>Loading news feeds...</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Network: FEED */}
          {networkTab === 'feed' && (
            <div style={scrollAreaStyle}>
              <div style={wideContentStyle}>
                <SectionHead
                  label={`Network Violence &amp; ICE Feed`}
                  right={<span style={{ color: T.light, fontSize: 11 }}>All campuses · Live sources</span>}
                />
                <div style={{ background: T.white, border: `1px solid ${T.chalk}`, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.05)', overflow: 'hidden' }}>
                  {newsIncidents.length === 0 && citizenIncidents.length === 0 ? (
                    <div style={{ padding: '32px 20px', textAlign: 'center', color: T.light }}>
                      <div style={{ fontSize: 20, marginBottom: 8 }}>📡</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.mid }}>Loading live feed...</div>
                    </div>
                  ) : (
                    [...newsIncidents.map(inc => ({
                      id: `n_${inc.id}`,
                      type: inc.type,
                      source: inc.source || 'News',
                      sourceBadge: 'NEWS',
                      badgeColor: T.ice,
                      title: inc.description || inc.block || 'News Report',
                      location: inc.block || '',
                      timestamp: new Date(inc.date).getTime(),
                      isViolent: ['HOMICIDE','SHOOTING','BATTERY','ASSAULT','ROBBERY','WEAPONS VIOLATION'].includes((inc.type || '').toUpperCase()),
                      dist: 0,
                      campus: CAMPUSES.reduce((best, c) => {
                        const d = haversine(c.lat, c.lng, inc.lat, inc.lng);
                        return d < (best.d ?? 99) ? { name: c.short || c.name, d } : best;
                      }, { name: '', d: 99 }).name,
                    }))]
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, 50)
                    .map(item => (
                      <div key={item.id} className="sw-row" style={{ padding: '11px 18px', borderBottom: `1px solid ${T.chalk}`, display: 'flex', alignItems: 'flex-start', gap: 11 }}>
                        <SourceBadge label={item.sourceBadge} color={item.badgeColor} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <span style={{ fontSize: 8.5, fontWeight: 800, background: item.isViolent ? '#FEE2E2' : T.bg2, color: item.isViolent ? '#7F1D1D' : T.mid, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                              {(item.type || 'REPORT').slice(0, 12)}
                            </span>
                            {item.campus && <span style={{ fontSize: 10.5, fontWeight: 600, color: T.watch }}>near {item.campus}</span>}
                          </div>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: T.deep, lineHeight: 1.35 }}>{item.title}</div>
                          <div style={{ fontSize: 11, color: T.light, marginTop: 2 }}>{item.source} · {fmtAgo(item.timestamp)}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* How It Works */}
      {view === 'howItWorks' && (
        <div style={{ ...scrollAreaStyle, flex: 1 }}>
          <div style={contentStyle}>
            <ContagionScience />
            <div style={{ background: T.white, border: `1px solid ${T.chalk}`, borderRadius: 12, padding: '20px 22px' }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: T.light, marginBottom: 12 }}>Two-Lane Data Architecture</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '14px 16px' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: T.clear, marginBottom: 8 }}>Lane 1 — Live Intel</div>
                  <div style={{ fontSize: 12.5, color: T.mid, lineHeight: 1.6 }}>
                    <strong style={{ color: T.deep }}>Drives the verdict banner.</strong><br />
                    Citizen (minutes fresh) · CPD Radio scanner (real-time transcription) · News geocoder (RSS, hours fresh)<br /><br />
                    This is what happened last night and this morning near your campus.
                  </div>
                </div>
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '14px 16px' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: T.elev, marginBottom: 8 }}>Lane 2 — Pattern Data</div>
                  <div style={{ fontSize: 12.5, color: T.mid, lineHeight: 1.6 }}>
                    <strong style={{ color: T.deep }}>Drives the contagion model.</strong><br />
                    CPD 30-day crime data (7-8 day lag — clearly labeled) · Drives Papachristos zone calculations<br /><br />
                    This is historical context. Never presented as last night.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ASK SLATE ── */}
      <div style={{ flexShrink: 0, borderTop: `1px solid ${T.chalk}`, background: T.white }}>
        {askOpen && askAnswer && (
          <div style={{ padding: '14px 28px', borderBottom: `1px solid ${T.chalk}`, background: T.bg }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: T.brass, marginBottom: 5 }}>Slate</div>
                <div style={{ fontSize: 13, color: T.deep, lineHeight: 1.65 }}>
                  {askLoading ? 'Thinking...' : askAnswer}
                </div>
              </div>
              <button onClick={() => { setAskOpen(false); setAskAnswer(''); setAskQuery(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.light, fontSize: 16, padding: '0 4px', flexShrink: 0 }}>×</button>
            </div>
          </div>
        )}
        <div style={{ padding: '9px 28px', display: 'flex', gap: 11, alignItems: 'center' }}>
          <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: T.brass, flexShrink: 0 }}>Ask Slate</div>
          <input
            value={askQuery}
            onChange={e => setAskQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAsk(); }}
            placeholder={view === 'campus' ? `Ask anything about ${selectedCampus.short || selectedCampus.name}...` : 'Ask anything about your network...'}
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: T.deep, background: 'transparent', fontFamily: 'inherit' }}
          />
          {askQuery.trim() && (
            <button onClick={handleAsk} disabled={askLoading} style={{
              padding: '6px 16px', borderRadius: 7, background: askLoading ? T.chalk : T.deep,
              color: T.white, fontSize: 12, fontWeight: 600, border: 'none',
              cursor: askLoading ? 'default' : 'pointer', fontFamily: 'inherit', flexShrink: 0,
            }}>
              {askLoading ? '...' : 'Ask'}
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
