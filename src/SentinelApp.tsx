// @ts-nocheck
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SLATE WATCH — SentinelApp.tsx — v2 Corrected — March 2026
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * KEY CORRECTIONS FROM v1:
 *   - ContagionZone fields: block (not location), ageH (not triggeredAt),
 *     homicideDate (not triggerType), retWin boolean, daysLeft — no networkNodes
 *   - Phase boundaries: ACUTE 0–72h, ACTIVE 72h–336h, WATCH 336h–3000h
 *   - retWin (18–72h) is the peak retaliation signal — surfaces prominently
 *   - Feed filter: inc.lat != null (not inc.lat — zero is falsy)
 *   - Network dashboard: Verdict → KPIs → Brief → Call List → Campus List only
 *
 * DESIGN PRINCIPLE: One verdict per screen. Everything else is evidence.
 *   CEO opens → "Call 3 principals before students arrive."
 *   Principal opens → "Quiet overnight." or "3 shootings near your campus."
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CAMPUSES } from './sentinel-data/campuses';
import { buildContagionZones, getCampusExposure } from './sentinel-engine/contagion';
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

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  deep: '#121315', rock: '#23272F', mid: '#2C3440', light: '#6B7280',
  brass: '#B79145', chalk: '#E7E2D8', bg: '#F7F5F1', bg2: '#F0EDE6',
  white: '#FFFFFF', watch: '#D45B4F',
  clear: '#059669', ice: '#7C3AED',
  // Risk
  high: '#C66C3D', highBg: '#FFF4EE', highBd: '#F5C4A0',
  elev: '#B79145', elevBg: '#FEF9E7', elevBd: '#F0D88A',
  // Contagion phases — CORRECTED boundaries
  // ACUTE:  0–72h    (includes retWin 18–72h peak)
  // ACTIVE: 72–336h  (days 3–14)
  // WATCH:  336–3000h (days 14–125)
  acute: '#DC2626', activePh: '#C66C3D', watchPh: '#B79145', monitorPh: '#6B7280',
} as const;

const PHASE_COLOR: Record<string, string> = {
  ACUTE: T.acute, ACTIVE: T.activePh, WATCH: T.watchPh,
};
const PHASE_BG: Record<string, string> = {
  ACUTE: '#FEF2F2', ACTIVE: T.highBg, WATCH: T.elevBg,
};
const PHASE_BD: Record<string, string> = {
  ACUTE: '#FECACA', ACTIVE: T.highBd, WATCH: T.elevBd,
};
// Phase durations in hours (for visual proportions)
const PHASE_DURATION_H = { ACUTE: 72, ACTIVE: 264, WATCH: 2664 };
const PHASE_START_H = { ACUTE: 0, ACTIVE: 72, WATCH: 336 };

const RISK_GRADIENT: Record<string, string> = {
  LOW:      `linear-gradient(115deg,#065F46 0%,${T.clear} 100%)`,
  ELEVATED: `linear-gradient(115deg,#78350F 0%,${T.elev} 100%)`,
  HIGH:     `linear-gradient(115deg,#9A3412 0%,${T.high} 100%)`,
  CRITICAL: `linear-gradient(115deg,#7F1D1D 0%,${T.watch} 100%)`,
};

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL STYLES
// ─────────────────────────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;600;700&display=swap');
    @keyframes blink{0%,100%{opacity:1}55%{opacity:.3}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes liveFlash{0%,100%{opacity:1}50%{opacity:.45}}
    @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
    *{box-sizing:border-box;margin:0;padding:0;}
    ::-webkit-scrollbar{width:5px;}
    ::-webkit-scrollbar-track{background:transparent;}
    ::-webkit-scrollbar-thumb{background:rgba(45,55,72,.18);border-radius:3px;}
    ::selection{background:rgba(183,145,69,.2);}
    .sw-blink{animation:blink 2.2s ease-in-out infinite;}
    .sw-live{animation:liveFlash 2s ease-in-out infinite;}
    .sw-fade{animation:fadeUp .3s ease both;}
    .sw-row:hover{background:${T.bg}!important;cursor:pointer;}
    .sw-tab{transition:all .15s;cursor:pointer;border:none;font-family:inherit;}
    .sw-btn{font-family:inherit;cursor:pointer;transition:opacity .15s;}
    .sw-btn:hover{opacity:.82;}
  `}</style>
);

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────
function fmtAgo(ms: number): string {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
function fmtTime(): string {
  return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
function fmtDayTime(): string {
  const now = new Date();
  const day = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  return `${day} · ${fmtTime()}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// LIVE VERDICT — built from real-time sources only (Citizen + Scanner + News)
// CPD data is 8+ days lagged and never drives the verdict headline
// ─────────────────────────────────────────────────────────────────────────────
function buildLiveVerdict(
  campus: any,
  citizenIncidents: CitizenIncident[],
  newsIncidents: Incident[],
  dispatchIncidents: DispatchIncident[],
  campusZones: ContagionZone[], // already filtered to this campus via getCampusExposure
  iceAlerts: IceAlert[],
): { label: string; score: number; sentence: string; supporting: string[]; actionNeeded: boolean } {
  const drivers: string[] = [];
  let score = 0;

  // Citizen — near-live, within 1mi, last 24h
  const nearCitizen = citizenIncidents.filter(inc => {
    const dist = haversine(campus.lat, campus.lng, inc.latitude, inc.longitude);
    const ageH = (Date.now() - (inc.cs || 0)) / 3600000;
    return dist <= 1.0 && ageH <= 24;
  });
  if (nearCitizen.length > 0) {
    score += Math.min(nearCitizen.length * 10, 35);
    drivers.push(`${nearCitizen.length} Citizen report${nearCitizen.length !== 1 ? 's' : ''} nearby`);
  }

  // News geocoded within 1mi
  const nearNews = newsIncidents.filter(inc =>
    inc.lat != null && inc.lng != null &&
    haversine(campus.lat, campus.lng, inc.lat, inc.lng) <= 1.0
  );
  if (nearNews.length > 0) {
    const violent = nearNews.filter(n =>
      ['HOMICIDE','SHOOTING','ASSAULT','ROBBERY','WEAPONS VIOLATION'].includes((n.type || '').toUpperCase())
    );
    score += Math.min(nearNews.length * 7, 25);
    if (violent.length > 0) drivers.push(`${violent.length} violent incident${violent.length !== 1 ? 's' : ''} in news`);
    else drivers.push(`${nearNews.length} news incident${nearNews.length !== 1 ? 's' : ''} nearby`);
  }

  // Scanner/dispatch within 1mi
  const nearDispatch = dispatchIncidents.filter(inc =>
    inc.latitude && inc.longitude &&
    haversine(campus.lat, campus.lng, inc.latitude, inc.longitude) <= 1.0
  );
  if (nearDispatch.length > 0) {
    const priority = nearDispatch.filter(d => d.isPriority);
    if (priority.length > 0) {
      score += priority.length * 10;
      drivers.push(`${priority.length} priority dispatch${priority.length !== 1 ? 'es' : ''} nearby`);
    }
  }

  // Contagion — use retWin for peak signal
  const retWinZones = campusZones.filter(z => z.retWin);
  const acuteZones  = campusZones.filter(z => z.phase === 'ACUTE' && !z.retWin);
  const activeZones = campusZones.filter(z => z.phase === 'ACTIVE');

  if (retWinZones.length > 0) {
    score += 50;
    drivers.push(`${retWinZones.length} zone${retWinZones.length !== 1 ? 's' : ''} in retaliation window`);
  } else if (acuteZones.length > 0) {
    score += 35;
    drivers.push(`${acuteZones.length} ACUTE contagion zone${acuteZones.length !== 1 ? 's' : ''}`);
  } else if (activeZones.length > 0) {
    score += 20;
    drivers.push(`${activeZones.length} ACTIVE contagion zone${activeZones.length !== 1 ? 's' : ''}`);
  } else if (campusZones.length > 0) {
    score += 8;
    drivers.push(`${campusZones.length} WATCH zone${campusZones.length !== 1 ? 's' : ''}`);
  }

  // ICE
  if (iceAlerts.length > 0) { score += 10; drivers.push(`${iceAlerts.length} ICE alert${iceAlerts.length !== 1 ? 's' : ''}`); }

  const label = score >= 55 ? 'HIGH' : score >= 22 ? 'ELEVATED' : 'LOW';
  const actionNeeded = score >= 22 || iceAlerts.length > 0;

  // One sentence
  const totalNearby = nearCitizen.length + nearNews.length;
  let sentence = '';
  if (retWinZones.length > 0) {
    const z = retWinZones[0];
    sentence = `Retaliation window open — homicide ${Math.round(z.ageH)}h ago near ${z.block || 'campus'}.`;
  } else if (totalNearby === 0 && score < 22 && iceAlerts.length === 0) {
    sentence = 'Quiet overnight — no incidents reported near campus.';
  } else if (totalNearby > 0) {
    const violent = nearCitizen.filter(c => /shoot|gun|shot|stab|attack|assault|robber|weapon/i.test(c.title || c.address || ''));
    if (violent.length > 0) {
      sentence = `${violent.length} violent incident${violent.length !== 1 ? 's' : ''} reported within 1 mile overnight.`;
    } else {
      sentence = `${totalNearby} incident${totalNearby !== 1 ? 's' : ''} reported near campus in the last 24 hours.`;
    }
  } else if (iceAlerts.length > 0) {
    sentence = `ICE enforcement activity near campus — ${iceAlerts.length} alert${iceAlerts.length !== 1 ? 's' : ''}.`;
  } else if (campusZones.length > 0) {
    sentence = `${campusZones.length} contagion zone${campusZones.length !== 1 ? 's' : ''} near campus — review before students arrive.`;
  } else {
    sentence = 'Elevated risk conditions — review before students arrive.';
  }

  return { label, score, sentence, supporting: drivers, actionNeeded };
}

// Build woven live feed for campus (Citizen + News + Scanner)
function buildCampusFeed(
  campus: any,
  citizenIncidents: CitizenIncident[],
  newsIncidents: Incident[],
  dispatchIncidents: DispatchIncident[],
  radiusMi = 1.0,
  hoursBack = 24,
): any[] {
  const items: any[] = [];
  const VIOLENT = ['HOMICIDE','SHOOTING','BATTERY','ASSAULT','ROBBERY','WEAPONS VIOLATION'];

  citizenIncidents
    .filter(inc => {
      const dist = haversine(campus.lat, campus.lng, inc.latitude, inc.longitude);
      const ageH = (Date.now() - (inc.cs || 0)) / 3600000;
      return dist <= radiusMi && ageH <= hoursBack;
    })
    .forEach(inc => items.push({
      id: `c_${inc.key}`,
      sourceBadge: 'LIVE', badgeColor: T.clear,
      type: 'REPORT',
      title: inc.title || inc.address || 'Community Report',
      location: inc.address || inc.location || 'Near campus',
      timestamp: inc.cs || 0,
      dist: haversine(campus.lat, campus.lng, inc.latitude, inc.longitude),
      isViolent: /shoot|gun|shot|stab|attack|assault|robber|weapon/i.test(inc.title || inc.address || ''),
    }));

  newsIncidents
    .filter(inc => inc.lat != null && inc.lng != null &&
      haversine(campus.lat, campus.lng, inc.lat, inc.lng) <= radiusMi)
    .forEach(inc => items.push({
      id: `n_${inc.id}`,
      sourceBadge: 'NEWS', badgeColor: T.ice,
      type: inc.type || 'NEWS',
      title: inc.description || inc.block || 'News Report',
      location: inc.block || 'Near campus',
      timestamp: new Date(inc.date).getTime(),
      dist: haversine(campus.lat, campus.lng, inc.lat, inc.lng),
      isViolent: VIOLENT.includes((inc.type || '').toUpperCase()),
      source: inc.source,
    }));

  dispatchIncidents
    .filter(inc => inc.latitude && inc.longitude &&
      haversine(campus.lat, campus.lng, inc.latitude, inc.longitude) <= radiusMi)
    .forEach(inc => items.push({
      id: `d_${inc.id}`,
      sourceBadge: 'SCANNER', badgeColor: T.brass,
      type: inc.type || 'DISPATCH',
      title: inc.description || 'Police Dispatch',
      location: inc.block || 'Near campus',
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
// AI HOOKS
// ─────────────────────────────────────────────────────────────────────────────
function useAIBrief(campus: any, verdict: any, iceAlerts: IceAlert[], zones: ContagionZone[]) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const done = useRef(false);

  const generate = useCallback(async () => {
    if (!campus) return;
    setLoading(true);
    try {
      const retWin = zones.filter(z => z.retWin).length;
      const ctx = {
        campus: campus.name, riskLevel: verdict?.label || 'LOW',
        sentence: verdict?.sentence || '', drivers: verdict?.supporting || [],
        retaliationWindowZones: retWin, iceAlerts: iceAlerts.length,
        dayTime: fmtDayTime(),
      };
      const res = await fetch('/api/anthropic-proxy', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 280,
          system: `You are Slate Watch. Write a morning safety brief for the principal of ${campus.name}. Plain sentences only — no bullets, no headers. 2–3 sentences. Direct and specific. Close with exactly one action for today. Peer-level tone, not system-generated.`,
          messages: [{ role: 'user', content: `Conditions: ${JSON.stringify(ctx)}` }],
        }),
      });
      const data = await res.json();
      setText(data.content?.find((b: any) => b.type === 'text')?.text || '');
    } catch { setText(''); } finally { setLoading(false); }
  }, [campus?.id, verdict?.label, iceAlerts.length]);

  useEffect(() => {
    if (campus && verdict && !done.current) { done.current = true; generate(); }
  }, [campus?.id, verdict?.label]);

  return { text, loading, refresh: () => { done.current = false; generate(); } };
}

function useNetworkBrief(allRisks: CampusRisk[], iceAlerts: IceAlert[], zones: ContagionZone[]) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const done = useRef(false);

  const generate = useCallback(async () => {
    setLoading(true);
    try {
      const highCampuses = allRisks.filter(r => r.label === 'HIGH' || r.label === 'CRITICAL')
        .map(r => CAMPUSES.find(c => c.id === r.campusId)?.name || '').filter(Boolean);
      const retWin = zones.filter(z => z.retWin).length;
      const ctx = {
        network: 'Veritas Charter Schools', totalCampuses: CAMPUSES.length,
        highRisk: highCampuses, elevated: allRisks.filter(r => r.label === 'ELEVATED').length,
        retaliationWindows: retWin, iceAlerts: iceAlerts.length, dayTime: fmtDayTime(),
      };
      const res = await fetch('/api/anthropic-proxy', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 260,
          system: `You are Slate Watch. Write a morning brief for the network leader of Veritas Charter Schools. Plain sentences, no bullets. 2–3 sentences. Name specific campuses. Close with one network-wide action. Direct peer-level tone.`,
          messages: [{ role: 'user', content: `Network: ${JSON.stringify(ctx)}` }],
        }),
      });
      const data = await res.json();
      setText(data.content?.find((b: any) => b.type === 'text')?.text || '');
    } catch { setText(''); } finally { setLoading(false); }
  }, [allRisks.length, iceAlerts.length, zones.length]);

  useEffect(() => {
    if (allRisks.length > 0 && !done.current) { done.current = true; generate(); }
  }, [allRisks.length]);

  return { text, loading, refresh: generate };
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED UI COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
const Skeleton = ({ w = '100%', h = 16 }: { w?: string; h?: number }) => (
  <div style={{ width: w, height: h, borderRadius: 6, background: `linear-gradient(90deg,${T.chalk} 0%,${T.bg2} 50%,${T.chalk} 100%)`, backgroundSize: '400px 100%', animation: 'shimmer 1.4s infinite linear' }} />
);

const SectionHead = ({ label, right }: { label: string; right?: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
    <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: T.light }}>{label}</div>
    {right}
  </div>
);

const SourceBadge = ({ label, color }: { label: string; color: string }) => (
  <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: '.09em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: 4, background: color, color: T.white, flexShrink: 0 }}
    className={label === 'LIVE' ? 'sw-live' : ''}>{label}</span>
);

// ─────────────────────────────────────────────────────────────────────────────
// VERDICT BANNER
// ─────────────────────────────────────────────────────────────────────────────
const VerdictBanner = ({ verdict, campus, onProtocol, onContagionTab, iceAlerts, zones }: {
  verdict: any; campus: any; onProtocol: (c: string) => void;
  onContagionTab: () => void; iceAlerts: IceAlert[]; zones: ContagionZone[];
}) => {
  const label = verdict?.label || 'LOW';
  const retWin = zones.filter(z => z.retWin);
  const acuteZ = zones.filter(z => z.phase === 'ACUTE');

  return (
    <div style={{ background: RISK_GRADIENT[label], padding: '18px 28px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,.6)', marginBottom: 5 }}>
          {campus?.name} · Live Assessment
        </div>
        <div style={{ fontSize: 21, fontWeight: 900, color: T.white, lineHeight: 1.22, letterSpacing: '-.02em', marginBottom: 8 }}>
          {verdict?.sentence || 'Loading...'}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          {verdict?.supporting?.map((d: string, i: number) => (
            <span key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,.82)' }}>· {d}</span>
          ))}
          {(retWin.length > 0 || acuteZ.length > 0) && (
            <button onClick={onContagionTab} className="sw-btn" style={{ background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.3)', color: T.white, padding: '3px 11px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
              {retWin.length > 0 ? `Retaliation window open →` : `${acuteZ.length} ACUTE zone${acuteZ.length !== 1 ? 's' : ''} →`}
            </button>
          )}
          {iceAlerts.length > 0 && (
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,.9)', fontWeight: 700 }}>· ICE: {iceAlerts.length} alert{iceAlerts.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,.48)', marginBottom: 10 }}>{fmtDayTime()}</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={() => onProtocol('WHITE')} className="sw-btn" style={{ background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.28)', color: T.white, padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>Protocols</button>
          {verdict?.actionNeeded && (
            <button onClick={() => onProtocol(label)} className="sw-btn" style={{ background: 'rgba(255,255,255,.95)', border: 'none', padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 800, color: label === 'HIGH' ? T.high : T.elev }}>What do I do?</button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// NETWORK VERDICT BANNER
// ─────────────────────────────────────────────────────────────────────────────
const NetworkVerdictBanner = ({ allRisks, iceAlerts, zones, onContagionTab }: {
  allRisks: CampusRisk[]; iceAlerts: IceAlert[]; zones: ContagionZone[]; onContagionTab: () => void;
}) => {
  const highCount = allRisks.filter(r => r.label === 'HIGH' || r.label === 'CRITICAL').length;
  const retWin = zones.filter(z => z.retWin);
  const label = highCount > 0 ? 'HIGH' : retWin.length > 0 ? 'ELEVATED' : 'LOW';

  let sentence = '';
  if (highCount > 0) sentence = `Call ${highCount} principal${highCount !== 1 ? 's' : ''} before students arrive.`;
  else if (retWin.length > 0) sentence = `${retWin.length} retaliation window${retWin.length !== 1 ? 's' : ''} open across the network.`;
  else if (iceAlerts.length > 0) sentence = `ICE enforcement active near ${iceAlerts.length} campus${iceAlerts.length !== 1 ? 'es' : ''} — network priority.`;
  else sentence = 'Network stable — normal conditions across all campuses.';

  const elevCount = allRisks.filter(r => r.label === 'ELEVATED').length;

  return (
    <div style={{ background: RISK_GRADIENT[label], padding: '18px 28px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,.6)', marginBottom: 5 }}>
          Veritas Charter Schools · {CAMPUSES.length} Campuses · Live Network View
        </div>
        <div style={{ fontSize: 21, fontWeight: 900, color: T.white, lineHeight: 1.22, letterSpacing: '-.02em', marginBottom: 8 }}>
          {sentence}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.82)' }}>· {highCount} HIGH</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.82)' }}>· {elevCount} ELEVATED</span>
          {iceAlerts.length > 0 && <span style={{ fontSize: 12, color: 'rgba(255,255,255,.9)', fontWeight: 700 }}>· ICE: {iceAlerts.length} alerts</span>}
          {retWin.length > 0 && (
            <button onClick={onContagionTab} className="sw-btn" style={{ background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.3)', color: T.white, padding: '3px 11px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
              {retWin.length} retaliation window{retWin.length !== 1 ? 's' : ''} →
            </button>
          )}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,.48)', marginBottom: 10 }}>{fmtDayTime()}</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="sw-btn" style={{ background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.28)', color: T.white, padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>Network Map</button>
          <button className="sw-btn" style={{ background: 'rgba(255,255,255,.95)', border: 'none', padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 800, color: label === 'HIGH' ? T.high : T.elev }}>Morning Brief</button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DO THIS NOW
// ─────────────────────────────────────────────────────────────────────────────
const DoThisNow = ({ items }: { items: string[] }) => {
  if (!items.length) return null;
  return (
    <div className="sw-fade" style={{ background: T.deep, borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
      <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: 'rgba(212,91,79,.18)', border: `1.5px solid rgba(212,91,79,.4)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, marginTop: 1 }}>⚡</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: T.watch, marginBottom: 6 }}>Do This Before Students Arrive</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {items.map((item, i) => (
            <div key={i} style={{ fontSize: 13.5, fontWeight: 600, color: T.white, lineHeight: 1.5 }}>{item}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ICE STRIP
// ─────────────────────────────────────────────────────────────────────────────
const IceStrip = ({ alerts }: { alerts: IceAlert[] }) => {
  if (!alerts.length) return null;
  return (
    <div style={{ background: '#F5F3FF', border: `1px solid #DDD6FE`, borderLeft: `4px solid ${T.ice}`, borderRadius: 12, padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
      <span style={{ background: T.ice, color: T.white, fontSize: 8, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 4, flexShrink: 0 }}>ICE</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.ice }}>Immigration enforcement activity near campus</div>
        <div style={{ fontSize: 11.5, color: T.mid, marginTop: 1 }}>{alerts.length} report{alerts.length !== 1 ? 's' : ''} · Lock exterior doors · Contact Network Legal</div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: T.ice, flexShrink: 0 }}>{alerts.length} reports →</div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// LIVE FEED ITEM
// ─────────────────────────────────────────────────────────────────────────────
const LiveFeedItem = ({ item }: { item: any }) => {
  const typeLabel = (item.type || 'REPORT').replace(/_/g, ' ').slice(0, 14);
  return (
    <div className="sw-row" style={{ display: 'flex', alignItems: 'flex-start', padding: '11px 18px', gap: 11, borderBottom: `1px solid ${T.chalk}` }}>
      <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 4, flexShrink: 0, background: item.isViolent ? '#FEE2E2' : T.bg2, color: item.isViolent ? '#7F1D1D' : T.mid, marginTop: 1, minWidth: 64, textAlign: 'center' }}>
        {typeLabel}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2, flexWrap: 'wrap' }}>
          <SourceBadge label={item.sourceBadge} color={item.badgeColor} />
          <span style={{ fontSize: 13.5, fontWeight: 600, color: T.deep, lineHeight: 1.3 }}>{item.title}</span>
        </div>
        <div style={{ fontSize: 11, color: T.light }}>{item.location}{item.source ? ` · ${item.source}` : ''}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12.5, fontWeight: 600, color: T.deep }}>
          {item.dist < 0.1 ? '<0.1' : item.dist.toFixed(1)} mi
        </div>
        <div style={{ fontSize: 11, color: T.light, marginTop: 1 }}>{fmtAgo(item.timestamp)}</div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// LIVE FEED CARD
// ─────────────────────────────────────────────────────────────────────────────
const LiveFeedCard = ({ feed, campus, loading }: { feed: any[]; campus: any; loading: boolean }) => {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? feed : feed.slice(0, 6);

  return (
    <div>
      <SectionHead label="Live Intel · Last 24H · Within 1 Mile"
        right={<span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: T.light }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.clear, display: 'inline-block' }} className="sw-live" />
          Citizen + CPD Radio + News
        </span>}
      />
      <div style={{ background: T.white, border: `1px solid ${T.chalk}`, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.05),0 4px 12px rgba(0,0,0,.04)', overflow: 'hidden' }}>
        {loading && <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}><Skeleton w="90%" h={18} /><Skeleton w="70%" h={14} /><Skeleton w="85%" h={18} /></div>}
        {!loading && feed.length === 0 && (
          <div style={{ padding: '28px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>🌙</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.mid, marginBottom: 4 }}>Quiet overnight</div>
            <div style={{ fontSize: 12.5, color: T.light }}>No incidents near {campus?.short || campus?.name} in the last 24 hours.</div>
          </div>
        )}
        {!loading && visible.map(item => <LiveFeedItem key={item.id} item={item} />)}
        {!loading && feed.length > 0 && (
          <div style={{ background: T.bg, borderTop: `1px solid ${T.chalk}`, padding: '9px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 11.5, color: T.mid }}>{feed.length} incident{feed.length !== 1 ? 's' : ''} · 24H · 1-mile radius</div>
            {feed.length > 6 && (
              <button onClick={() => setShowAll(!showAll)} style={{ fontSize: 12, fontWeight: 600, color: T.mid, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                {showAll ? 'Show less' : `Show all ${feed.length} →`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CONTAGION TEASER (campus Watch tab)
// ─────────────────────────────────────────────────────────────────────────────
const ContagionTeaser = ({ zones, onView }: { zones: ContagionZone[]; onView: () => void }) => {
  if (!zones.length) return null;
  const retWin = zones.filter(z => z.retWin);
  const acute  = zones.filter(z => z.phase === 'ACUTE');
  const top = retWin[0] || acute[0] || zones[0];
  const phase = top.phase;
  const color = PHASE_COLOR[phase];
  const bg    = PHASE_BG[phase];
  const bd    = PHASE_BD[phase];
  const remaining = top.daysLeft;

  return (
    <div onClick={onView} style={{ background: bg, border: `1px solid ${bd}`, borderLeft: `4px solid ${color}`, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
      <span style={{ background: color, color: T.white, fontSize: 8.5, fontWeight: 900, letterSpacing: '.1em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 5, flexShrink: 0 }}>
        {retWin.length > 0 ? 'RET. WINDOW' : phase}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color }}>
          {zones.length} contagion zone{zones.length !== 1 ? 's' : ''} near campus
          {retWin.length > 0 ? ' — retaliation window open' : ''}
        </div>
        <div style={{ fontSize: 11.5, color: T.mid, marginTop: 1 }}>
          {top.block || 'Nearby'} · {Math.round(top.ageH)}h elapsed · {remaining}d remaining
        </div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color, flexShrink: 0 }}>View Danger Window →</div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// AI BRIEF CARD
// ─────────────────────────────────────────────────────────────────────────────
const AIBriefCard = ({ text, loading, campus, onRefresh }: { text: string; loading: boolean; campus: any; onRefresh: () => void }) => (
  <div style={{ background: T.white, border: `1px solid ${T.chalk}`, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.05),0 4px 12px rgba(0,0,0,.04)', overflow: 'hidden' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 0' }}>
      <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: T.light }}>Morning Brief · {campus?.short || campus?.name}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 10.5, color: T.light }}>AI · Updates as conditions change</span>
        <button onClick={onRefresh} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: T.light }}>↻</button>
      </div>
    </div>
    <div style={{ padding: '12px 20px 16px' }}>
      {loading ? <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><Skeleton w="100%" /><Skeleton w="90%" /><Skeleton w="75%" /></div>
        : text ? <p style={{ fontFamily: "Georgia,'Times New Roman',serif", fontSize: 15, lineHeight: 1.78, color: T.deep }}>{text}</p>
        : <p style={{ fontFamily: "Georgia,serif", fontSize: 15, lineHeight: 1.78, color: T.light, fontStyle: 'italic' }}>Generating brief...</p>}
    </div>
    <div style={{ display: 'flex', gap: 16, padding: '10px 20px', borderTop: `1px solid ${T.chalk}` }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: T.mid, textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer' }}>Ask Watch anything</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: T.mid, textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer' }}>View data sources</span>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SCHOOL DAY TIMELINE
// ─────────────────────────────────────────────────────────────────────────────
const SchoolDayBar = ({ schoolPeriod, toArrival, toDismissal }: { schoolPeriod: any; toArrival: number; toDismissal: number }) => (
  <div style={{ background: T.white, border: `1px solid ${T.chalk}`, borderRadius: 12, padding: '13px 18px' }}>
    <div style={{ display: 'flex', height: 5, borderRadius: 3, overflow: 'hidden', gap: 1.5, marginBottom: 6 }}>
      <div style={{ flex: 10, background: T.chalk }} /><div style={{ flex: 8, background: '#93C5FD' }} />
      <div style={{ flex: 46, background: T.deep }} /><div style={{ flex: 17, background: T.chalk }} /><div style={{ flex: 17, background: T.chalk }} />
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8.5, color: T.light, letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 7 }}>
      <span>Pre</span><span>Arrival</span><span style={{ color: T.deep, fontWeight: 800 }}>School Day</span><span>Dismissal</span><span>After</span>
    </div>
    <div style={{ fontSize: 12.5, color: T.mid }}>
      {toArrival > 0
        ? <><strong style={{ color: T.deep }}>Arrival in {toArrival}m.</strong> Students approaching — staff visibility critical.</>
        : toDismissal > 0
        ? <><strong style={{ color: T.deep }}>Dismissal in {Math.floor(toDismissal / 60)}h {toDismissal % 60}m.</strong> Brief staff before lunch, not at the bell.</>
        : <>School day complete. Monitor dismissal conditions.</>}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// THE DANGER WINDOW — corrected phase boundaries
// ACUTE: 0–72h | ACTIVE: 72–336h | WATCH: 336–3000h
// ─────────────────────────────────────────────────────────────────────────────
const DangerWindow = ({ zone }: { zone: ContagionZone }) => {
  const phase = zone.phase;
  const ageH  = zone.ageH;
  const color = PHASE_COLOR[phase];
  const remaining = zone.daysLeft;

  // Visual proportions — log-scaled so all phases are visible
  // ACUTE=72h gets 18%, ACTIVE=264h gets 28%, WATCH=2664h gets 54%
  const VISUAL = { ACUTE: 18, ACTIVE: 28, WATCH: 54 };

  // Marker position 0–100%
  let markerPct = 0;
  if (phase === 'ACUTE') {
    markerPct = (Math.min(ageH, 72) / 72) * 18;
  } else if (phase === 'ACTIVE') {
    markerPct = 18 + ((Math.min(ageH - 72, 264) / 264) * 28);
  } else {
    markerPct = 46 + ((Math.min(ageH - 336, 2664) / 2664) * 54);
  }
  markerPct = Math.min(markerPct, 99);

  const phaseDesc: Record<string, string> = {
    ACUTE:  'Trigger event just occurred. Highest immediate risk.',
    ACTIVE: 'Peak retaliation window. Connected network nodes most likely to act now.',
    WATCH:  'Risk declining but not gone. Continue monitoring.',
  };
  const protocol: Record<string, string> = {
    ACUTE:  'Contact Network Leadership now. Elevate exterior supervision immediately.',
    ACTIVE: 'Brief arrival and dismissal staff. No early release without network clearance.',
    WATCH:  'Normal operations with heightened situational awareness.',
  };

  return (
    <div style={{ background: T.white, border: `1px solid ${T.chalk}`, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.05),0 4px 12px rgba(0,0,0,.04)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 22px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
            <span style={{ background: color, color: T.white, fontSize: 8.5, fontWeight: 900, letterSpacing: '.1em', textTransform: 'uppercase', padding: '4px 11px', borderRadius: 5 }}>
              {zone.retWin ? 'RETALIATION WINDOW' : phase}
            </span>
            {zone.retWin && (
              <span style={{ fontSize: 11, fontWeight: 700, color: T.acute }}>18–72h peak — highest retaliation risk</span>
            )}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.deep, marginBottom: 3 }}>
            {zone.block || 'Nearby corridor'} — Homicide trigger
          </div>
          <div style={{ fontSize: 12.5, color: T.mid, lineHeight: 1.5 }}>
            {phaseDesc[phase]}
            {zone.gang && ' · Possible gang involvement.'}
            {zone.firearm && ' · Firearm incident.'}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>{Math.round(ageH)}h</div>
          <div style={{ fontSize: 10.5, color: T.light, marginTop: 2 }}>elapsed</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 600, color: T.light, marginTop: 3 }}>{remaining}d left</div>
        </div>
      </div>

      {/* DANGER WINDOW TRACK */}
      <div style={{ padding: '18px 22px 6px' }}>
        <div style={{ position: 'relative', height: 16, borderRadius: 8, overflow: 'visible', marginBottom: 6 }}>
          {/* Gradient track */}
          <div style={{ position: 'absolute', inset: 0, borderRadius: 8, background: `linear-gradient(to right, ${T.acute} 0%, ${T.acute} 18%, ${T.activePh} 18%, ${T.activePh} 46%, ${T.watchPh} 46%, ${T.watchPh} 100%)` }} />
          {/* Division lines */}
          {[18, 46].map(pct => (
            <div key={pct} style={{ position: 'absolute', top: -2, bottom: -2, left: `${pct}%`, width: 2, background: 'rgba(255,255,255,.4)', zIndex: 2 }} />
          ))}
          {/* Dimmed future */}
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${markerPct}%`, right: 0, borderRadius: '0 8px 8px 0', background: 'rgba(18,19,21,.5)', zIndex: 3, transition: 'left .8s ease' }} />
          {/* Marker dot */}
          <div style={{ position: 'absolute', top: '50%', left: `${markerPct}%`, transform: 'translate(-50%,-50%)', width: 22, height: 22, borderRadius: '50%', background: T.white, border: '2.5px solid rgba(18,19,21,.15)', boxShadow: '0 0 0 4px rgba(255,255,255,.35),0 2px 8px rgba(0,0,0,.2)', zIndex: 10, transition: 'left .8s ease' }} />
        </div>

        {/* Phase labels */}
        <div style={{ display: 'flex', marginBottom: 4 }}>
          {[
            { key: 'ACUTE',  pct: 18, label: 'ACUTE',  range: '0–72h' },
            { key: 'ACTIVE', pct: 28, label: 'ACTIVE', range: '3–14d' },
            { key: 'WATCH',  pct: 54, label: 'WATCH',  range: '14–125d' },
          ].map(p => (
            <div key={p.key} style={{ flex: `0 0 ${p.pct}%` }}>
              <div style={{ fontSize: 8.5, fontWeight: p.key === phase ? 900 : 600, letterSpacing: '.05em', textTransform: 'uppercase', color: p.key === phase ? PHASE_COLOR[p.key] : T.light, opacity: p.key === phase ? 1 : 0.5 }}>
                {p.key === phase ? `▶ ${p.label}` : p.label}
              </div>
              <div style={{ fontSize: 8.5, color: T.light, opacity: p.key === phase ? 0.7 : 0.4, marginTop: 1 }}>{p.range}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Protocol */}
      <div style={{ padding: '0 22px 18px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ background: PHASE_BG[phase], border: `1px solid ${PHASE_BD[phase]}`, borderLeft: `3px solid ${color}`, borderRadius: 8, padding: '10px 14px', flex: 1 }}>
          <div style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: T.watch, marginBottom: 4 }}>Protocol</div>
          <div style={{ fontSize: 12.5, color: T.deep, lineHeight: 1.5 }}>{protocol[phase]}</div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CONTAGION ZONE CARD (compact, for lists)
// ─────────────────────────────────────────────────────────────────────────────
const ContagionZoneCard = ({ zone }: { zone: ContagionZone }) => {
  const [exp, setExp] = useState(false);
  const phase = zone.phase;
  const color = PHASE_COLOR[phase];

  const VISUAL = { ACUTE: 18, ACTIVE: 28, WATCH: 54 };
  let markerPct = 0;
  if (phase === 'ACUTE') markerPct = (Math.min(zone.ageH, 72) / 72) * 18;
  else if (phase === 'ACTIVE') markerPct = 18 + ((Math.min(zone.ageH - 72, 264) / 264) * 28);
  else markerPct = 46 + ((Math.min(zone.ageH - 336, 2664) / 2664) * 54);
  markerPct = Math.min(markerPct, 99);

  return (
    <div style={{ background: PHASE_BG[phase], border: `1px solid ${PHASE_BD[phase]}`, borderRadius: 12, overflow: 'hidden', marginBottom: 10 }}>
      <div style={{ padding: '13px 18px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ background: color, color: T.white, fontSize: 8.5, fontWeight: 900, letterSpacing: '.09em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 5 }}>
            {zone.retWin ? 'RET. WINDOW' : phase}
          </span>
          <span style={{ fontSize: 10.5, fontWeight: 700, color }}>
            {zone.retWin ? 'Peak 18–72h window — act now' :
             phase === 'ACUTE' ? 'High risk · 0–72h' :
             phase === 'ACTIVE' ? 'Peak retaliation · days 3–14' : 'Declining · days 14–125'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.deep, marginBottom: 2 }}>
              {zone.block || 'Nearby corridor'} — Homicide
            </div>
            <div style={{ fontSize: 12, color: T.mid, lineHeight: 1.45 }}>
              {Math.round(zone.ageH)}h elapsed · {zone.daysLeft}d remaining
              {zone.distanceFromCampus != null ? ` · ${zone.distanceFromCampus.toFixed(2)} mi from campus` : ''}
              {zone.gang ? ' · Gang-related' : ''}
              {zone.firearm ? ' · Firearm' : ''}
            </div>
          </div>
          <button onClick={() => setExp(!exp)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, color, fontFamily: 'inherit', flexShrink: 0 }}>
            {exp ? 'Less ▲' : 'Details ▼'}
          </button>
        </div>
      </div>

      {/* Mini track */}
      <div style={{ padding: '0 18px 12px' }}>
        <div style={{ position: 'relative', height: 5, borderRadius: 3, overflow: 'hidden', marginBottom: 3 }}>
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to right, ${T.acute} 0%, ${T.acute} 18%, ${T.activePh} 18%, ${T.activePh} 46%, ${T.watchPh} 46%, ${T.watchPh} 100%)` }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${markerPct}%`, right: 0, background: 'rgba(18,19,21,.5)' }} />
          <div style={{ position: 'absolute', top: '50%', left: `${markerPct}%`, transform: 'translate(-50%,-50%)', width: 9, height: 9, borderRadius: '50%', background: T.white, border: '1.5px solid rgba(0,0,0,.15)', zIndex: 10 }} />
        </div>
        <div style={{ display: 'flex', fontSize: 8, fontWeight: 600, color: T.light, textTransform: 'uppercase', letterSpacing: '.04em' }}>
          {[{ k: 'ACUTE', p: 18 }, { k: 'ACTIVE', p: 28 }, { k: 'WATCH', p: 54 }].map(s => (
            <div key={s.k} style={{ flex: `0 0 ${s.p}%`, color: s.k === phase ? PHASE_COLOR[s.k] : T.light, opacity: s.k === phase ? 1 : 0.5 }}>
              {s.k === phase ? `▶${s.k.slice(0,3)}` : s.k.slice(0,3)}
            </div>
          ))}
        </div>
      </div>

      {/* Expanded */}
      {exp && (
        <div style={{ background: T.white, borderTop: `1px solid ${PHASE_BD[phase]}`, padding: '12px 18px' }}>
          {[
            { l: 'Trigger', v: `Homicide · ${zone.block || 'Unknown location'}` },
            { l: 'Age', v: `${Math.round(zone.ageH)}h in ${phase} phase` },
            { l: 'Retaliation window', v: zone.retWin ? 'ACTIVE — peak risk now' : zone.ageH < 18 ? 'Not yet open (opens at 18h)' : 'Closed' },
            { l: 'Days remaining', v: `${zone.daysLeft} of 125` },
            { l: 'Model', v: 'Papachristos et al., Yale/UChicago' },
          ].map(({ l, v }) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${T.chalk}`, fontSize: 12 }}>
              <span style={{ color: T.light }}>{l}</span>
              <span style={{ fontWeight: 600, color: T.deep }}>{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// NETWORK: SIMPLIFIED DASHBOARD COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
const NetworkKPIs = ({ allRisks, iceAlerts, zones }: { allRisks: CampusRisk[]; iceAlerts: IceAlert[]; zones: ContagionZone[] }) => {
  const highCount  = allRisks.filter(r => r.label === 'HIGH' || r.label === 'CRITICAL').length;
  const elevCount  = allRisks.filter(r => r.label === 'ELEVATED').length;
  const retWin     = zones.filter(z => z.retWin).length;
  const acuteZones = zones.filter(z => z.phase === 'ACUTE').length;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
      {[
        {
          label: 'Campus Risk', bg: highCount > 0 ? T.highBg : '#F0FDF4', bd: highCount > 0 ? T.highBd : '#BBF7D0',
          value: highCount > 0 ? `${highCount} HIGH` : 'All stable',
          sub: `${highCount} HIGH · ${elevCount} ELEVATED · ${allRisks.filter(r => r.label === 'LOW').length} normal`,
          valColor: highCount > 0 ? T.high : T.clear,
        },
        {
          label: 'Contagion Zones', bg: retWin > 0 ? '#FEF2F2' : acuteZones > 0 ? T.highBg : T.elevBg, bd: retWin > 0 ? '#FECACA' : acuteZones > 0 ? T.highBd : T.elevBd,
          value: retWin > 0 ? `${retWin} ret. window${retWin !== 1 ? 's' : ''}` : `${zones.length} zone${zones.length !== 1 ? 's' : ''}`,
          sub: `${acuteZones} ACUTE · ${zones.filter(z => z.phase === 'ACTIVE').length} ACTIVE · ${zones.filter(z => z.phase === 'WATCH').length} WATCH`,
          valColor: retWin > 0 ? T.acute : acuteZones > 0 ? T.high : T.elev,
        },
        {
          label: 'ICE Activity', bg: iceAlerts.length > 0 ? '#F5F3FF' : '#F0FDF4', bd: iceAlerts.length > 0 ? '#DDD6FE' : '#BBF7D0',
          value: iceAlerts.length > 0 ? `${iceAlerts.length} alert${iceAlerts.length !== 1 ? 's' : ''}` : 'No alerts',
          sub: iceAlerts.length > 0 ? 'Contact Network Legal · Review shelter protocol' : 'No enforcement activity reported',
          valColor: iceAlerts.length > 0 ? T.ice : T.clear,
        },
      ].map(kpi => (
        <div key={kpi.label} style={{ background: kpi.bg, border: `1px solid ${kpi.bd}`, borderRadius: 12, padding: '15px 17px', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: T.light, marginBottom: 7 }}>{kpi.label}</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, fontWeight: 700, marginBottom: 4, color: kpi.valColor }}>{kpi.value}</div>
          <div style={{ fontSize: 11.5, color: T.mid, lineHeight: 1.45 }}>{kpi.sub}</div>
        </div>
      ))}
    </div>
  );
};

const NetworkBriefCard = ({ text, loading, onRefresh }: { text: string; loading: boolean; onRefresh: () => void }) => (
  <div style={{ background: T.deep, borderRadius: 12, padding: '18px 22px' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)' }}>Network Brief · AI · {fmtTime()}</div>
      <button onClick={onRefresh} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'rgba(255,255,255,.3)' }}>↻</button>
    </div>
    {loading ? <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><Skeleton /><Skeleton w="88%" /><Skeleton w="72%" /></div>
      : <p style={{ fontFamily: "Georgia,'Times New Roman',serif", fontSize: 14.5, lineHeight: 1.75, color: 'rgba(255,255,255,.88)', marginBottom: 14 }}>{text || 'Generating brief...'}</p>}
    <div style={{ display: 'flex', gap: 9 }}>
      <button className="sw-btn" style={{ background: T.brass, color: T.white, border: 'none', padding: '8px 17px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>Send Network Alert</button>
      <button className="sw-btn" style={{ background: 'transparent', color: 'rgba(255,255,255,.6)', border: '1px solid rgba(255,255,255,.15)', padding: '8px 17px', borderRadius: 8, fontSize: 12, fontWeight: 500 }}>Ask Watch anything</button>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// CALL LIST
// ─────────────────────────────────────────────────────────────────────────────
const CallList = ({ allRisks, campusZones, onSelectCampus }: {
  allRisks: CampusRisk[]; campusZones: Record<number, ContagionZone[]>; onSelectCampus: (id: number) => void;
}) => {
  const urgent = allRisks
    .filter(r => r.label === 'HIGH' || r.label === 'CRITICAL')
    .sort((a, b) => b.score - a.score).slice(0, 5);
  if (!urgent.length) return null;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#DC2626' }} className="sw-blink" />
        <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: '#DC2626' }}>Call These Principals Now</div>
      </div>
      <div style={{ background: T.white, border: `1px solid ${T.chalk}`, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.05),0 4px 12px rgba(0,0,0,.04)', overflow: 'hidden' }}>
        {urgent.map((r, i) => {
          const campus = CAMPUSES.find(c => c.id === r.campusId);
          const zones = campusZones[r.campusId] || [];
          const hasRetWin = zones.some(z => z.retWin);
          const hasAcute  = zones.some(z => z.phase === 'ACUTE');
          return (
            <div key={r.campusId} style={{ display: 'flex', alignItems: 'center', padding: '12px 18px', gap: 12, borderBottom: i < urgent.length - 1 ? `1px solid ${T.chalk}` : 'none', background: T.white, cursor: 'pointer', transition: 'background .1s' }}
              onMouseEnter={e => (e.currentTarget as any).style.background = T.highBg}
              onMouseLeave={e => (e.currentTarget as any).style.background = T.white}>
              <span style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase', padding: '4px 9px', borderRadius: 5, flexShrink: 0, background: T.highBg, color: '#7F1D1D', border: `1px solid ${T.highBd}` }}>
                {r.label}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 2 }}>{campus?.name}</div>
                <div style={{ fontSize: 12, color: T.mid, lineHeight: 1.4 }}>
                  Score {r.score}
                  {hasRetWin ? ' · Retaliation window open' : hasAcute ? ' · ACUTE contagion zone' : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
                <button className="sw-btn" style={{ padding: '5px 12px', border: `1px solid ${T.chalk}`, borderRadius: 6, background: T.white, fontSize: 11.5, fontWeight: 500, color: T.mid }}>Copy Script</button>
                <button className="sw-btn" onClick={() => onSelectCampus(r.campusId)} style={{ padding: '5px 12px', background: T.deep, border: `1px solid ${T.deep}`, borderRadius: 6, color: T.white, fontSize: 11.5, fontWeight: 700 }}>View →</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CAMPUS LIST
// ─────────────────────────────────────────────────────────────────────────────
const CampusList = ({ allRisks, campusZones, onSelectCampus }: {
  allRisks: CampusRisk[]; campusZones: Record<number, ContagionZone[]>; onSelectCampus: (id: number) => void;
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
          const zones = campusZones[r.campusId] || [];
          const topZone = zones.find(z => z.retWin) || zones.find(z => z.phase === 'ACUTE') || zones[0];
          const bg = r.label === 'HIGH' || r.label === 'CRITICAL' ? T.highBg : r.label === 'ELEVATED' ? T.elevBg : '#F0FDF4';
          const textColor = r.label === 'HIGH' || r.label === 'CRITICAL' ? '#7F1D1D' : r.label === 'ELEVATED' ? '#78350F' : T.clear;
          const bdColor = r.label === 'HIGH' || r.label === 'CRITICAL' ? T.highBd : r.label === 'ELEVATED' ? T.elevBd : '#BBF7D0';

          return (
            <div key={r.campusId} className="sw-row" onClick={() => onSelectCampus(r.campusId)} style={{ display: 'flex', alignItems: 'center', padding: '10px 18px', gap: 12, borderBottom: i < visible.length - 1 ? `1px solid ${T.chalk}` : 'none' }}>
              <div style={{ flex: 1.3 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.deep }}>{campus?.short || campus?.name}</div>
                <div style={{ fontSize: 10.5, color: T.light, marginTop: 1 }}>{campus?.communityArea || ''}</div>
              </div>
              <div style={{ flex: 2.5, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 4, background: bg, color: textColor, border: `1px solid ${bdColor}`, flexShrink: 0 }}>
                  {r.label}
                </span>
                {topZone && (
                  <span style={{ color: topZone.retWin ? T.acute : PHASE_COLOR[topZone.phase], fontWeight: 600, fontSize: 11.5 }}>
                    {topZone.retWin ? 'ret. window' : topZone.phase.toLowerCase()} zone
                  </span>
                )}
              </div>
              <div style={{ color: T.light, fontSize: 12 }}>→</div>
            </div>
          );
        })}
        <div onClick={() => setShowAll(!showAll)} style={{ padding: '10px 18px', background: T.bg, borderTop: `1px solid ${T.chalk}`, fontSize: 12, fontWeight: 600, color: T.mid, cursor: 'pointer', textAlign: 'center' }}>
          {showAll ? 'Show less' : `Show all ${CAMPUSES.length} campuses →`}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CAMPUS DROPDOWN
// ─────────────────────────────────────────────────────────────────────────────
const CampusDropdown = ({ campuses, selectedId, onSelect }: { campuses: any[]; selectedId: number; onSelect: (id: number) => void }) => {
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
      <button onClick={() => { setOpen(!open); setSearch(''); }} style={{ background: T.bg, border: `1px solid ${T.chalk}`, borderRadius: 9, padding: '5px 12px', fontSize: 12, fontWeight: 600, color: T.deep, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
        {selected?.short || selected?.name || 'Select campus'}<span style={{ fontSize: 9, opacity: .5 }}>▼</span>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, width: 260, background: T.white, borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,.14)', zIndex: 2000, overflow: 'hidden', border: `1px solid ${T.chalk}` }}>
          <input autoFocus type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '9px 13px', border: 'none', borderBottom: `1px solid ${T.chalk}`, fontSize: 13, outline: 'none', color: T.deep, boxSizing: 'border-box', fontFamily: 'inherit' }} />
          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
            {filtered.map(c => (
              <button key={c.id} onClick={() => { onSelect(c.id); setOpen(false); }} style={{ display: 'block', width: '100%', padding: '9px 13px', border: 'none', borderBottom: `1px solid ${T.bg}`, background: c.id === selectedId ? T.bg : T.white, cursor: 'pointer', textAlign: 'left', fontSize: 13, fontFamily: 'inherit', color: T.rock, fontWeight: c.id === selectedId ? 700 : 400 }}>
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
// CONTAGION SCIENCE EXPLAINER
// ─────────────────────────────────────────────────────────────────────────────
const ContagionScience = () => (
  <div style={{ background: T.deep, borderRadius: 12, padding: '16px 20px' }}>
    <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.32)', marginBottom: 8 }}>The Science Behind This</div>
    <p style={{ fontFamily: "Georgia,'Times New Roman',serif", fontSize: 13.5, lineHeight: 1.72, color: 'rgba(255,255,255,.82)' }}>
      Violence spreads like a disease — this is not a metaphor. Dr. Andrew Papachristos at Yale showed that gunshot victimization moves through social networks the same way infectious disease propagates through populations. A homicide creates retaliatory violence in{' '}
      <strong style={{ color: T.brass }}>predictable patterns over the following 18–72 hours</strong>.
      His research in Chicago showed 70% of all shootings occur within co-offending networks representing less than 6% of the population.{' '}
      <strong style={{ color: T.brass }}>Watch operationalizes this in real time.</strong>
    </p>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// NETWORK CONTAGION SUMMARY
// ─────────────────────────────────────────────────────────────────────────────
const NetworkContagionSummary = ({ zones }: { zones: ContagionZone[] }) => {
  const retWin = zones.filter(z => z.retWin);
  const acute  = zones.filter(z => z.phase === 'ACUTE' && !z.retWin);
  const active = zones.filter(z => z.phase === 'ACTIVE');
  const watch  = zones.filter(z => z.phase === 'WATCH');

  const cards = [
    { label: 'Retaliation Window (18–72h)', count: retWin.length, color: T.acute, bg: '#FEF2F2', bd: '#FECACA', sub: 'Peak risk — act now', detail: retWin.map(z => z.block || '').filter(Boolean).join(' · ') },
    { label: 'ACUTE (0–72h)', count: acute.length + retWin.length, color: T.acute, bg: '#FEF2F2', bd: '#FECACA', sub: 'New homicide triggers', detail: '' },
    { label: 'ACTIVE (3–14 days)', count: active.length, color: T.activePh, bg: T.highBg, bd: T.highBd, sub: 'Peak retaliation phase', detail: active.map(z => z.block || '').filter(Boolean).join(' · ') },
    { label: 'WATCH (14–125 days)', count: watch.length, color: T.watchPh, bg: T.elevBg, bd: T.elevBd, sub: 'Context only', detail: '' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {cards.map(c => (
        <div key={c.label} style={{ background: T.white, border: `1px solid ${T.chalk}`, borderRadius: 12, padding: '13px 16px' }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: T.light, marginBottom: 7 }}>{c.label}</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, fontWeight: 700, marginBottom: 3, color: c.count > 0 ? c.color : T.clear }}>
            {c.count === 0 ? 'All clear' : `${c.count} zone${c.count !== 1 ? 's' : ''}`}
          </div>
          <div style={{ fontSize: 10.5, color: T.light, marginBottom: 3 }}>{c.sub}</div>
          {c.count > 0 && c.detail && <div style={{ fontSize: 11.5, color: T.mid }}>{c.detail}</div>}
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DATA SOURCES FOOTER
// ─────────────────────────────────────────────────────────────────────────────
const DataSources = ({ cpdCount, citizenCount, scannerCalls, newsCount, iceCount, updatedAt }: {
  cpdCount: number; citizenCount: number; scannerCalls: number; newsCount: number; iceCount: number; updatedAt: Date;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: T.white, border: `1px solid ${T.chalk}`, borderRadius: 12 }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
        <div style={{ fontSize: 12.5, color: T.mid, fontWeight: 500 }}>Data Sources & Freshness <span style={{ fontSize: 10.5, color: T.light, marginLeft: 8 }}>6 active · {fmtAgo(updatedAt.getTime())}</span></div>
        <span style={{ color: T.light, fontSize: 10 }}>{open ? '▲' : '▾'}</span>
      </button>
      {open && (
        <div style={{ borderTop: `1px solid ${T.chalk}`, padding: '10px 16px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
          {[
            { name: 'Citizen App', status: 'LIVE', color: T.clear, detail: `${citizenCount} incidents` },
            { name: 'CPD Radio (Scanner)', status: 'LIVE', color: T.brass, detail: `${scannerCalls} calls monitored` },
            { name: 'News Feeds', status: 'LIVE', color: T.ice, detail: `${newsCount} incidents geocoded` },
            { name: 'ICE Monitoring', status: 'LIVE', color: T.ice, detail: `${iceCount} alerts` },
            { name: 'CPD Crime Data', status: 'LAGGED', color: T.light, detail: `${cpdCount} incidents · 7–8 day lag` },
          ].map(s => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ background: s.color, color: T.white, fontSize: 7.5, fontWeight: 900, letterSpacing: '.1em', textTransform: 'uppercase', padding: '2px 6px', borderRadius: 3, flexShrink: 0, minWidth: 48, textAlign: 'center' }}>{s.status}</span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: T.deep, minWidth: 160 }}>{s.name}</span>
              <span style={{ fontSize: 12, color: T.light }}>{s.detail}</span>
            </div>
          ))}
          <div style={{ fontSize: 10, color: T.light, marginTop: 4, lineHeight: 1.6 }}>
            Contagion model: Papachristos et al., Yale/UChicago. CPD data has 7–8 day publication lag — clearly labeled, never drives the verdict. Risk engine updates every 90 seconds.
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
  type View = 'campus' | 'network' | 'howItWorks';
  type CampusTab = 'watch' | 'contagion' | 'feed' | 'map';
  type NetworkTab = 'dashboard' | 'contagion' | 'map' | 'news' | 'feed';

  const [view, setView] = useState<View>('network');
  const [campusTab, setCampusTab] = useState<CampusTab>('watch');
  const [networkTab, setNetworkTab] = useState<NetworkTab>('dashboard');
  const [selectedCampusId, setSelectedCampusId] = useState(1);

  const [activeProtocol, setActiveProtocol] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [updatedText, setUpdatedText] = useState('just now');
  const [initialLoading, setInitialLoading] = useState(true);
  const [askQuery, setAskQuery] = useState('');
  const [askAnswer, setAskAnswer] = useState('');
  const [askLoading, setAskLoading] = useState(false);
  const [askOpen, setAskOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      const s = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
      setUpdatedText(s < 5 ? 'just now' : s < 60 ? `${s}s ago` : `${Math.floor(s / 60)}m ago`);
    }, 1000);
    return () => clearInterval(t);
  }, [lastUpdated]);

  // Data state
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [acuteIncidents, setAcuteIncidents] = useState<Incident[]>([]);
  const [shotSpotterEvents, setShotSpotterEvents] = useState<ShotSpotterEvent[]>([]);
  const [weather, setWeather] = useState<WeatherCurrent>({ temperature: 65, apparentTemperature: 65, precipitation: 0, windSpeed: 0 });
  const [weatherForecast, setWeatherForecast] = useState<any[]>([]);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [iceAlerts, setIceAlerts] = useState<IceAlert[]>([]);
  const [citizenIncidents, setCitizenIncidents] = useState<CitizenIncident[]>([]);
  const [scannerData, setScannerData] = useState<ScannerSummary | null>(null);
  const [dispatchIncidents, setDispatchIncidents] = useState<DispatchIncident[]>([]);
  const [newsIncidents, setNewsIncidents] = useState<Incident[]>([]);

  const selectedCampus = CAMPUSES.find(c => c.id === selectedCampusId) ?? CAMPUSES[0];
  const now = new Date();
  const schoolPeriod = getSchoolPeriod(now, selectedCampus);
  const tempF = weather.apparentTemperature;

  // All contagion zones from full 30-day CPD data
  const allZones = useMemo(() => buildContagionZones(incidents), [incidents]);

  // Per-campus exposure: use getCampusExposure for accurate campus-zone mapping
  const campusZonesMap = useMemo<Record<number, ContagionZone[]>>(() => {
    const map: Record<number, ContagionZone[]> = {};
    for (const campus of CAMPUSES) {
      map[campus.id] = getCampusExposure(campus, allZones);
    }
    return map;
  }, [allZones]);

  const campusZones = campusZonesMap[selectedCampusId] || [];

  // Risk scores
  const allRisks = useMemo<CampusRisk[]>(
    () => CAMPUSES.map(c => scoreCampus(c, incidents, acuteIncidents, shotSpotterEvents, campusZonesMap[c.id] || [], tempF, getSchoolPeriod(now, c))),
    [incidents, acuteIncidents, shotSpotterEvents, campusZonesMap, tempF],
  );
  const selectedRisk = allRisks.find(r => r.campusId === selectedCampusId) ?? allRisks[0];

  // Live verdict
  const liveVerdict = useMemo(
    () => buildLiveVerdict(selectedCampus, citizenIncidents, newsIncidents, dispatchIncidents, campusZones, iceAlerts),
    [selectedCampus, citizenIncidents, newsIncidents, dispatchIncidents, campusZones, iceAlerts],
  );

  // Live feed (woven)
  const liveFeed = useMemo(
    () => buildCampusFeed(selectedCampus, citizenIncidents, newsIncidents, dispatchIncidents),
    [selectedCampus, citizenIncidents, newsIncidents, dispatchIncidents],
  );

  // Do This Now
  const doThisItems = useMemo(() => {
    const items: string[] = [];
    if (iceAlerts.length > 0) items.push('Lock all exterior doors. Contact Network Legal regarding ICE activity before 7 AM.');
    const retWin = campusZones.filter(z => z.retWin);
    if (retWin.length > 0) items.push(`Retaliation window is open — elevate exterior supervision now. Contact Network Leadership.`);
    const violent = liveFeed.filter(f => f.isViolent);
    if (violent.length > 0) items.push(`Review ${violent.length} violent incident${violent.length !== 1 ? 's' : ''} reported nearby — brief staff before students arrive.`);
    return items;
  }, [iceAlerts, campusZones, liveFeed]);

  // AI briefs
  const campusBrief = useAIBrief(selectedCampus, liveVerdict, iceAlerts, campusZones);
  const networkBrief = useNetworkBrief(allRisks, iceAlerts, allZones);

  // Data refresh
  const refresh90s = useCallback(async () => {
    const [acute, shots] = await Promise.all([fetchIncidents(48, 500), fetchShotSpotter(2, 100)]);
    setAcuteIncidents(acute); setShotSpotterEvents(shots); setLastUpdated(new Date());
  }, []);

  const refresh10min = useCallback(async () => {
    const full = await fetchIncidents(720, 5000);
    setIncidents(full);
  }, []);

  const refresh30min = useCallback(async () => {
    const [wx, wxF] = await Promise.all([fetchWeather(), fetchWeatherForecast()]);
    setWeather(wx); setWeatherForecast(wxF);
  }, []);

  const refresh5min = useCallback(async () => {
    const news = await fetchAllFeeds();
    setNewsItems(news);
    const ice = await fetchIceSignals(news);
    setIceAlerts(ice);
    let parsed = await geocodeNewsIncidents(news);
    if (parsed.length === 0) parsed = parseNewsAsIncidents(news);
    setNewsIncidents(parsed);
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
      transcribeSpikeCalls(allCalls).then(d => setDispatchIncidents(d)).catch(() => {});
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
  }, []);

  useEffect(() => { void refreshCitizen(); }, [selectedCampusId]);

  const handleSelectCampus = (id: number) => { setSelectedCampusId(id); setView('campus'); setCampusTab('watch'); };
  const handleAsk = async () => {
    if (!askQuery.trim()) return;
    setAskLoading(true); setAskOpen(true); setAskAnswer('');
    try {
      const res = await fetch('/api/anthropic-proxy', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 400, system: 'You are Slate Watch. Answer in 2–4 sentences. Plain language. No bullets. Direct.', messages: [{ role: 'user', content: askQuery }] }),
      });
      const data = await res.json();
      setAskAnswer(data.content?.find((b: any) => b.type === 'text')?.text || 'Unable to answer.');
    } catch { setAskAnswer('Something went wrong.'); } finally { setAskLoading(false); }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // NAV STYLES
  // ─────────────────────────────────────────────────────────────────────────
  const pnav = (active: boolean): React.CSSProperties => ({
    padding: '12px 15px', background: 'none', border: 'none', cursor: 'pointer',
    fontFamily: 'inherit', fontSize: 13, fontWeight: active ? 700 : 500,
    color: active ? T.deep : T.light, borderBottom: `2.5px solid ${active ? T.brass : 'transparent'}`, transition: 'all .15s',
  });

  const snav = (active: boolean): React.CSSProperties => ({
    padding: '9px 13px', background: 'none', border: 'none', cursor: 'pointer',
    fontFamily: 'inherit', fontSize: 12.5, fontWeight: active ? 700 : 500,
    color: active ? T.deep : T.light, borderBottom: `2px solid ${active ? T.deep : 'transparent'}`, transition: 'all .15s',
    display: 'flex', alignItems: 'center', gap: 6,
  });

  const scrollArea: React.CSSProperties = {
    flex: 1, overflowY: 'auto', background: `linear-gradient(180deg,${T.bg} 0%,${T.bg2} 100%)`,
  };
  const content: React.CSSProperties = { maxWidth: 820, margin: '0 auto', padding: '20px 28px 64px', display: 'flex', flexDirection: 'column', gap: 14 };
  const wideContent: React.CSSProperties = { maxWidth: 1060, margin: '0 auto', padding: '20px 28px 64px', display: 'flex', flexDirection: 'column', gap: 14 };

  // Contagion zones for network tab (just zone list without campus filtering)
  const retWinZones    = allZones.filter(z => z.retWin);
  const acuteNetZones  = allZones.filter(z => z.phase === 'ACUTE');
  const activeNetZones = allZones.filter(z => z.phase === 'ACTIVE');

  return (
    <div style={{ fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,sans-serif", color: T.deep }}>
      <GlobalStyles />

      {activeProtocol && (
        <ProtocolModal code={activeProtocol} campus={selectedCampus} risk={selectedRisk} onClose={() => setActiveProtocol(null)} />
      )}

      {/* PRIMARY NAV */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, borderBottom: `1px solid ${T.chalk}`, background: T.white, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {(['network','campus','howItWorks'] as View[]).map(v => (
            <button key={v} className="sw-tab" onClick={() => setView(v)} style={pnav(view === v)}>
              {v === 'network' ? 'Network' : v === 'campus' ? 'My Campus' : 'How It Works'}
            </button>
          ))}
          {view === 'network' && (
            <button className="sw-tab" style={{ padding: '9px 15px', background: 'rgba(212,91,79,.06)', border: `1px solid rgba(212,91,79,.22)`, borderRadius: '8px 8px 0 0', color: T.watch, fontSize: 13, fontWeight: 600, marginLeft: 8 }}>
              Command Center
            </button>
          )}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, paddingRight: 20, fontSize: 12 }}>
          {view === 'campus' && (
            <CampusDropdown campuses={CAMPUSES} selectedId={selectedCampusId} onSelect={id => { setSelectedCampusId(id); }} />
          )}
          <span style={{ color: T.light, fontSize: 11 }}>⟳ {updatedText}</span>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          CAMPUS VIEW
      ══════════════════════════════════════════ */}
      {view === 'campus' && (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <VerdictBanner verdict={liveVerdict} campus={selectedCampus} onProtocol={setActiveProtocol} onContagionTab={() => setCampusTab('contagion')} iceAlerts={iceAlerts} zones={campusZones} />

          <div style={{ background: T.white, borderBottom: `1px solid ${T.chalk}`, padding: '0 28px', display: 'flex', alignItems: 'center' }}>
            <button className="sw-tab" onClick={() => setCampusTab('watch')} style={snav(campusTab === 'watch')}>Watch</button>
            <button className="sw-tab" onClick={() => setCampusTab('contagion')} style={snav(campusTab === 'contagion')}>
              Contagion
              {campusZones.filter(z => z.retWin || z.phase === 'ACUTE').length > 0 && (
                <span style={{ background: '#FEF2F2', color: T.acute, border: `1px solid #FECACA`, fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 8 }}>
                  {campusZones.filter(z => z.retWin).length > 0 ? 'RET. WINDOW' : `${campusZones.filter(z => z.phase === 'ACUTE').length} ACUTE`}
                </span>
              )}
            </button>
            <button className="sw-tab" onClick={() => setCampusTab('feed')} style={snav(campusTab === 'feed')}>Feed</button>
            <button className="sw-tab" onClick={() => setCampusTab('map')} style={snav(campusTab === 'map')}>Map</button>
          </div>

          {/* CAMPUS WATCH */}
          {campusTab === 'watch' && (
            <div style={scrollArea}>
              <div style={content}>
                {doThisItems.length > 0 && <DoThisNow items={doThisItems} />}
                <IceStrip alerts={iceAlerts} />
                <LiveFeedCard feed={liveFeed} campus={selectedCampus} loading={initialLoading} />
                {campusZones.length > 0 && <ContagionTeaser zones={campusZones} onView={() => setCampusTab('contagion')} />}
                <AIBriefCard text={campusBrief.text} loading={campusBrief.loading} campus={selectedCampus} onRefresh={campusBrief.refresh} />
                <SchoolDayBar schoolPeriod={schoolPeriod} toArrival={minutesToArrival(now, selectedCampus)} toDismissal={minutesToDismissal(now, selectedCampus)} />
                <DataSources cpdCount={incidents.length} citizenCount={citizenIncidents.length} scannerCalls={scannerData?.totalCalls || 0} newsCount={newsIncidents.length} iceCount={iceAlerts.length} updatedAt={lastUpdated} />
                <div style={{ background: T.white, border: `1px solid ${T.chalk}`, borderRadius: 12, overflow: 'hidden' }}>
                  <IntelQuery campus={selectedCampus} risk={selectedRisk} />
                </div>
              </div>
            </div>
          )}

          {/* CAMPUS CONTAGION */}
          {campusTab === 'contagion' && (
            <div style={scrollArea}>
              <div style={content}>
                {campusZones.length === 0 ? (
                  <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '32px 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: 24, marginBottom: 10 }}>🌿</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: T.clear, marginBottom: 6 }}>No contagion zones near campus</div>
                    <div style={{ fontSize: 13.5, color: '#166534', lineHeight: 1.55 }}>No homicides have been recorded within range of {selectedCampus.name} in the contagion tracking window. The model activates automatically when a trigger event occurs.</div>
                  </div>
                ) : (
                  <>
                    <SectionHead label={`Danger Window · ${campusZones.length} Zone${campusZones.length !== 1 ? 's' : ''} Near This Campus`} />
                    <DangerWindow zone={campusZones[0]} />
                    {campusZones.length > 1 && (
                      <div>
                        <SectionHead label={`All Zones · ${campusZones.length}`} />
                        {campusZones.map((zone, i) => <ContagionZoneCard key={i} zone={zone} />)}
                      </div>
                    )}
                  </>
                )}
                <ContagionScience />
              </div>
            </div>
          )}

          {/* CAMPUS FEED */}
          {campusTab === 'feed' && (
            <div style={scrollArea}>
              <div style={content}>
                <SectionHead label={`All Incidents · ${selectedCampus.short || selectedCampus.name} · Last 24H`} />
                {liveFeed.length === 0 ? (
                  <div style={{ background: T.white, border: `1px solid ${T.chalk}`, borderRadius: 12, padding: '36px 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, marginBottom: 9 }}>🌙</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.mid }}>Nothing in the feed</div>
                    <div style={{ fontSize: 12.5, color: T.light, marginTop: 4 }}>No incidents near {selectedCampus.name} in the last 24 hours.</div>
                  </div>
                ) : (
                  <div style={{ background: T.white, border: `1px solid ${T.chalk}`, borderRadius: 12, overflow: 'hidden' }}>
                    {liveFeed.map(item => <LiveFeedItem key={item.id} item={item} />)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CAMPUS MAP */}
          {campusTab === 'map' && (
            <div style={scrollArea}>
              <div style={{ padding: '20px 28px' }}>
                <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${T.chalk}` }}>
                  <CampusMap campus={selectedCampus} risk={selectedRisk} incidents={[...acuteIncidents, ...newsIncidents.filter(i => i.lat != null)]} shotSpotterEvents={shotSpotterEvents} contagionZones={campusZones} corridors={buildSafeCorridors(selectedCampus, acuteIncidents)} scannerData={scannerData} />
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
          <NetworkVerdictBanner allRisks={allRisks} iceAlerts={iceAlerts} zones={allZones} onContagionTab={() => setNetworkTab('contagion')} />

          <div style={{ background: T.white, borderBottom: `1px solid ${T.chalk}`, padding: '0 28px', display: 'flex', alignItems: 'center' }}>
            <button className="sw-tab" onClick={() => setNetworkTab('dashboard')} style={snav(networkTab === 'dashboard')}>Dashboard</button>
            <button className="sw-tab" onClick={() => setNetworkTab('contagion')} style={snav(networkTab === 'contagion')}>
              Contagion
              {retWinZones.length + acuteNetZones.length > 0 && (
                <span style={{ background: '#FEF2F2', color: T.acute, border: `1px solid #FECACA`, fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 8 }}>
                  {retWinZones.length > 0 ? `${retWinZones.length} RET. WIN` : `${acuteNetZones.length} ACUTE`}
                </span>
              )}
            </button>
            <button className="sw-tab" onClick={() => setNetworkTab('map')} style={snav(networkTab === 'map')}>Map</button>
            <button className="sw-tab" onClick={() => setNetworkTab('news')} style={snav(networkTab === 'news')}>News</button>
            <button className="sw-tab" onClick={() => setNetworkTab('feed')} style={snav(networkTab === 'feed')}>Feed</button>
          </div>

          {/* NETWORK DASHBOARD — simplified */}
          {networkTab === 'dashboard' && (
            <div style={scrollArea}>
              <div style={wideContent}>
                <NetworkKPIs allRisks={allRisks} iceAlerts={iceAlerts} zones={allZones} />
                <NetworkBriefCard text={networkBrief.text} loading={networkBrief.loading} onRefresh={networkBrief.refresh} />
                {iceAlerts.length > 0 && <IceStrip alerts={iceAlerts} />}
                <CallList allRisks={allRisks} campusZones={campusZonesMap} onSelectCampus={handleSelectCampus} />
                <CampusList allRisks={allRisks} campusZones={campusZonesMap} onSelectCampus={handleSelectCampus} />
              </div>
            </div>
          )}

          {/* NETWORK CONTAGION */}
          {networkTab === 'contagion' && (
            <div style={scrollArea}>
              <div style={wideContent}>
                <ContagionScience />
                <NetworkContagionSummary zones={allZones} />
                {allZones.length === 0 ? (
                  <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '28px 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, marginBottom: 9 }}>🌿</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: T.clear, marginBottom: 5 }}>No active contagion zones across the network</div>
                    <div style={{ fontSize: 13, color: '#166534' }}>The model activates when a homicide is recorded near any campus in the CPD data.</div>
                  </div>
                ) : (
                  <div>
                    <SectionHead label={`All Active Zones · ${allZones.length} Total`} />
                    {[...allZones].sort((a, b) => {
                      if (a.retWin && !b.retWin) return -1;
                      if (!a.retWin && b.retWin) return 1;
                      const phaseOrder: Record<string, number> = { ACUTE: 0, ACTIVE: 1, WATCH: 2 };
                      if (phaseOrder[a.phase] !== phaseOrder[b.phase]) return phaseOrder[a.phase] - phaseOrder[b.phase];
                      return a.ageH - b.ageH;
                    }).map((zone, i) => <ContagionZoneCard key={i} zone={zone} />)}
                  </div>
                )}
                <div style={{ fontSize: 10, color: T.light, lineHeight: 1.6, textAlign: 'center', padding: '8px 0', borderTop: `1px solid ${T.chalk}` }}>
                  Model: Papachristos et al., Yale/UChicago · Homicides only · ACUTE 0–72h · ACTIVE 3–14d · WATCH 14–125d · Updates every 90 seconds · CPD data 7–8 day lag
                </div>
              </div>
            </div>
          )}

          {/* NETWORK MAP */}
          {networkTab === 'map' && (
            <div style={scrollArea}>
              <div style={{ padding: '20px 28px' }}>
                <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${T.chalk}` }}>
                  <NetworkMap risks={allRisks} zones={allZones} incidents24h={acuteIncidents} iceAlerts={iceAlerts} onSelectCampus={handleSelectCampus} />
                </div>
              </div>
            </div>
          )}

          {/* NETWORK NEWS */}
          {networkTab === 'news' && (
            <div style={scrollArea}>
              <div style={wideContent}>
                <SectionHead label={`News Intelligence · ${newsItems.length} items`} />
                <div style={{ background: T.white, border: `1px solid ${T.chalk}`, borderRadius: 12, overflow: 'hidden' }}>
                  {newsItems.slice(0, 40).map((item, i) => (
                    <div key={i} className="sw-row" style={{ padding: '12px 18px', borderBottom: `1px solid ${T.chalk}` }} onClick={() => item.url && window.open(item.url, '_blank')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                        {item.campusProximity && <span style={{ fontSize: 8.5, fontWeight: 800, background: '#FEF2F2', color: '#7F1D1D', padding: '2px 7px', borderRadius: 4 }}>Near {item.campusProximity}</span>}
                        {item.isBreaking && <span style={{ fontSize: 8.5, fontWeight: 800, background: '#DC2626', color: T.white, padding: '2px 7px', borderRadius: 4 }}>Breaking</span>}
                      </div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: T.deep, lineHeight: 1.35, marginBottom: 4 }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: T.light }}>{item.source} · {item.publishedAt ? fmtAgo(new Date(item.publishedAt).getTime()) : ''} ↗</div>
                    </div>
                  ))}
                  {newsItems.length === 0 && <div style={{ padding: '32px', textAlign: 'center', color: T.light }}>Loading news feeds...</div>}
                </div>
              </div>
            </div>
          )}

          {/* NETWORK FEED */}
          {networkTab === 'feed' && (
            <div style={scrollArea}>
              <div style={wideContent}>
                <SectionHead label="Network Violence & ICE Feed · All campuses · Live sources" />
                <div style={{ background: T.white, border: `1px solid ${T.chalk}`, borderRadius: 12, overflow: 'hidden' }}>
                  {newsIncidents
                    .filter(inc => inc.lat != null && inc.lng != null)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 50)
                    .map((inc, i) => {
                      const VIOLENT = ['HOMICIDE','SHOOTING','BATTERY','ASSAULT','ROBBERY','WEAPONS VIOLATION'];
                      const isViolent = VIOLENT.includes((inc.type || '').toUpperCase());
                      const nearCampus = CAMPUSES.reduce((best, c) => {
                        const d = haversine(c.lat, c.lng, inc.lat, inc.lng);
                        return d < best.d ? { name: c.short || c.name, d } : best;
                      }, { name: '', d: 99 });
                      return (
                        <div key={i} className="sw-row" style={{ padding: '11px 18px', borderBottom: `1px solid ${T.chalk}`, display: 'flex', alignItems: 'flex-start', gap: 11 }}>
                          <SourceBadge label="NEWS" color={T.ice} />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                              <span style={{ fontSize: 8.5, fontWeight: 800, background: isViolent ? '#FEE2E2' : T.bg2, color: isViolent ? '#7F1D1D' : T.mid, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase' }}>
                                {(inc.type || 'REPORT').slice(0, 12)}
                              </span>
                              {nearCampus.d < 1.5 && <span style={{ fontSize: 10.5, fontWeight: 600, color: T.watch }}>near {nearCampus.name}</span>}
                            </div>
                            <div style={{ fontSize: 13.5, fontWeight: 600, color: T.deep, lineHeight: 1.35 }}>{inc.description || inc.block || 'News Report'}</div>
                            <div style={{ fontSize: 11, color: T.light, marginTop: 2 }}>{inc.source} · {fmtAgo(new Date(inc.date).getTime())}</div>
                          </div>
                        </div>
                      );
                    })}
                  {newsIncidents.length === 0 && <div style={{ padding: '32px', textAlign: 'center', color: T.light }}>Loading live feed...</div>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* HOW IT WORKS */}
      {view === 'howItWorks' && (
        <div style={scrollArea}>
          <div style={content}>
            <ContagionScience />
            <div style={{ background: T.white, border: `1px solid ${T.chalk}`, borderRadius: 12, padding: '20px 22px' }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: T.light, marginBottom: 12 }}>Two-Lane Data Architecture</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '14px 16px' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: T.clear, marginBottom: 8 }}>Lane 1 — Live Intel</div>
                  <div style={{ fontSize: 12.5, color: T.mid, lineHeight: 1.6 }}>
                    <strong style={{ color: T.deep }}>Drives the verdict banner.</strong><br />
                    Citizen (minutes fresh) · CPD Radio scanner (real-time) · News geocoder (hours fresh)<br /><br />
                    This is what happened last night near your campus.
                  </div>
                </div>
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '14px 16px' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: T.elev, marginBottom: 8 }}>Lane 2 — Pattern Data</div>
                  <div style={{ fontSize: 12.5, color: T.mid, lineHeight: 1.6 }}>
                    <strong style={{ color: T.deep }}>Drives the contagion model.</strong><br />
                    CPD 30-day crime data (7–8 day lag) · Homicides only · 125-day tracking window<br /><br />
                    Never presented as last night. Always labeled.
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 16, padding: '12px 16px', background: T.bg, borderRadius: 8, fontSize: 12.5, color: T.mid, lineHeight: 1.6 }}>
                <strong style={{ color: T.deep }}>Contagion phase boundaries:</strong> ACUTE (0–72h) — highest risk, includes the 18–72h peak retaliation window · ACTIVE (3–14 days) — elevated, peak retaliation phase · WATCH (14–125 days) — context only, risk declining
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ASK SLATE BAR */}
      <div style={{ flexShrink: 0, borderTop: `1px solid ${T.chalk}`, background: T.white }}>
        {askOpen && askAnswer && (
          <div style={{ padding: '14px 28px', borderBottom: `1px solid ${T.chalk}`, background: T.bg }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: T.brass, marginBottom: 5 }}>Slate</div>
                <div style={{ fontSize: 13, color: T.deep, lineHeight: 1.65 }}>{askLoading ? 'Thinking...' : askAnswer}</div>
              </div>
              <button onClick={() => { setAskOpen(false); setAskAnswer(''); setAskQuery(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.light, fontSize: 16, padding: '0 4px' }}>×</button>
            </div>
          </div>
        )}
        <div style={{ padding: '9px 28px', display: 'flex', gap: 11, alignItems: 'center' }}>
          <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: T.brass, flexShrink: 0 }}>Ask Slate</div>
          <input value={askQuery} onChange={e => setAskQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAsk(); }}
            placeholder={view === 'campus' ? `Ask anything about ${selectedCampus.short || selectedCampus.name}...` : 'Ask anything about your network...'}
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: T.deep, background: 'transparent', fontFamily: 'inherit' }} />
          {askQuery.trim() && (
            <button onClick={handleAsk} disabled={askLoading} style={{ padding: '6px 16px', borderRadius: 7, background: askLoading ? T.chalk : T.deep, color: T.white, fontSize: 12, fontWeight: 600, border: 'none', cursor: askLoading ? 'default' : 'pointer', fontFamily: 'inherit' }}>
              {askLoading ? '...' : 'Ask'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
