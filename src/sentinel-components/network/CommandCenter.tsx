/**
 * Sentinel Command Center — Full operational command interface.
 * Dark mode only. CSS Grid fixed-panel layout. Every pixel serves a purpose.
 *
 * Two users on one screen:
 *   Executives: 30,000-foot network view, decision support
 *   Safety Operators: real-time operational control, crisis response workflows
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  MapContainer, TileLayer, Circle, CircleMarker, Marker, Tooltip,
} from 'react-leaflet';
import L from 'leaflet';
import type {
  CampusRisk, ContagionZone, Incident, ShotSpotterEvent,
  IceAlert, NewsItem, ForecastDay, NetworkSummary,
} from '../../sentinel-engine/types';
import { CAMPUSES } from '../../sentinel-data/campuses';
import type { Campus } from '../../sentinel-data/campuses';
// Risk colors defined locally for dark theme
import { haversine, ageInHours, fmtAgo } from '../../sentinel-engine/geo';
import 'leaflet/dist/leaflet.css';

/* ════════════════════════════════════════════════════
   Design Tokens — Dark Ops Theme
   ════════════════════════════════════════════════════ */
const BG = '#0A0F1E';
const PANEL = '#0F172A';
const BORDER = '#1E293B';
const TEXT = '#F1F5F9';
const TEXT2 = '#94A3B8';
const GOLD = '#F0B429';

const LABEL_COLORS: Record<string, string> = {
  CRITICAL: '#DC2626', HIGH: '#EA580C', ELEVATED: '#D97706', LOW: '#0EA5E9',
};

const INC_TYPE_COLORS: Record<string, string> = {
  'HOMICIDE': '#DC2626', 'WEAPONS VIOLATION': '#EA580C', 'BATTERY': '#D97706',
  'ASSAULT': '#EAB308', 'ROBBERY': '#7C3AED', 'CRIM SEXUAL ASSAULT': '#DC2626',
  'NARCOTICS': '#0D9488', 'MOTOR VEHICLE THEFT': '#6366F1',
};

const MONO = "'SF Mono', 'Roboto Mono', 'Courier New', monospace";
const SANS = "system-ui, -apple-system, sans-serif";

const CHICAGO_CENTER: [number, number] = [41.8400, -87.6800];
const MI_TO_M = 1609.34;

/* ════════════════════════════════════════════════════
   CSS Keyframes
   ════════════════════════════════════════════════════ */
const KEYFRAMES = `
@keyframes cc-pulse { 0%,100%{opacity:.7} 50%{opacity:1} }
@keyframes cc-flash { 0%{background:${GOLD}22} 100%{background:transparent} }
@keyframes cc-slideIn { 0%{transform:translateY(-20px);opacity:0} 100%{transform:translateY(0);opacity:1} }
@keyframes cc-goldSweep { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
@keyframes cc-newPill { 0%,100%{opacity:.6} 50%{opacity:1} }
.cc-scroll::-webkit-scrollbar{width:4px}
.cc-scroll::-webkit-scrollbar-track{background:${PANEL}}
.cc-scroll::-webkit-scrollbar-thumb{background:${BORDER};border-radius:2px}
`;

/* ════════════════════════════════════════════════════
   Types
   ════════════════════════════════════════════════════ */

interface Props {
  risks: CampusRisk[];
  incidents: Incident[];
  acuteIncidents: Incident[];
  shotSpotterEvents: ShotSpotterEvent[];
  zones: ContagionZone[];
  newsItems: NewsItem[];
  iceAlerts: IceAlert[];
  forecast: ForecastDay[];
  networkSummary: NetworkSummary;
  onClose: () => void;
  onSelectCampus: (id: number) => void;
}

interface LogEntry {
  id: string;
  time: Date;
  action: string;
  campus?: string;
  status: 'complete' | 'pending';
}

type TimeWindow = 2 | 6 | 24;
type ModalType = '911' | 'principal' | 'cps' | 'nst' | 'leadership' | 'comms' | 'contagion' | null;

/* ════════════════════════════════════════════════════
   Shield Icon for Map
   ════════════════════════════════════════════════════ */
function makeMapShield(label: string, score: number, color: string): L.DivIcon {
  return L.divIcon({
    html: `<div style="display:flex;flex-direction:column;align-items:center">
      <svg width="24" height="29" viewBox="0 0 28 34">
        <path d="M14 1L2 7v12c0 9.3 5.1 17.9 12 21.5 6.9-3.6 12-12.2 12-21.5V7L14 1z"
          fill="${color}" stroke="#fff" stroke-width="1.5"/>
        <text x="14" y="20" text-anchor="middle" fill="#fff" font-size="9"
          font-weight="800" font-family="system-ui">N</text>
      </svg>
      <div style="position:absolute;top:-4px;right:-8px;background:${color};color:#fff;
        font-size:7px;font-weight:800;border-radius:6px;padding:0 3px;
        border:1px solid #fff;font-family:${MONO}">${score}</div>
      <div style="font-size:8px;font-weight:700;color:#fff;white-space:nowrap;margin-top:1px;
        text-shadow:0 0 3px #000,0 0 3px #000">${label}</div>
    </div>`,
    className: '',
    iconSize: [60, 44],
    iconAnchor: [30, 29],
  });
}

/* ════════════════════════════════════════════════════
   Helper: nearest campus to an incident
   ════════════════════════════════════════════════════ */
function nearestCampus(lat: number, lng: number): { campus: Campus; dist: number } {
  let best = CAMPUSES[0];
  let bestDist = Infinity;
  for (const c of CAMPUSES) {
    const d = haversine(c.lat, c.lng, lat, lng);
    if (d < bestDist) { bestDist = d; best = c; }
  }
  return { campus: best, dist: bestDist };
}

/* ════════════════════════════════════════════════════
   Main Component
   ════════════════════════════════════════════════════ */
export default function CommandCenter({
  risks, incidents: _incidents, acuteIncidents, shotSpotterEvents, zones,
  newsItems: _newsItems, iceAlerts, forecast, networkSummary, onClose, onSelectCampus,
}: Props) {
  // --- State ---
  const [clock, setClock] = useState(new Date());
  const [incidentWindow, setIncidentWindow] = useState<TimeWindow>(2);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [incidentLog, setIncidentLog] = useState<LogEntry[]>([
    { id: '0', time: new Date(), action: 'Command Center opened', status: 'complete' },
  ]);
  const [activeCampusId, setActiveCampusId] = useState<number>(() => {
    const sorted = [...risks].sort((a, b) => b.score - a.score);
    return sorted[0]?.campusId ?? 1;
  });
  const [detailCampusId, setDetailCampusId] = useState<number | null>(null);
  const [alertIncident, setAlertIncident] = useState<Incident | null>(null);
  const [commsTab, setCommsTab] = useState<'family' | 'staff' | 'media'>('family');
  const prevIncidentIdsRef = useRef<Set<string>>(new Set(acuteIncidents.map(i => i.id)));
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // --- Derived data ---
  const sorted = useMemo(() => [...risks].sort((a, b) => b.score - a.score), [risks]);
  const activeCampus = CAMPUSES.find(c => c.id === activeCampusId) ?? CAMPUSES[0];
  const activeRisk = risks.find(r => r.campusId === activeCampusId) ?? sorted[0];
  const elevatedCount = risks.filter(r => r.label !== 'LOW').length;
  const contagionCount = networkSummary.acuteZones + networkSummary.activeZones;

  // Incidents for the feed — filter by time window and proximity to any campus
  const feedIncidents = useMemo(() => {
    const cutoffMs = Date.now() - (incidentWindow * 60 * 60 * 1000);
    return acuteIncidents
      .filter(inc => {
        if (!inc.date) return false;
        const ms = new Date(inc.date).getTime();
        if (isNaN(ms) || ms < cutoffMs) return false;
        const { dist } = nearestCampus(inc.lat, inc.lng);
        return dist <= 2.0;
      })
      .sort((a, b) => {
        const aMs = new Date(a.date).getTime() || 0;
        const bMs = new Date(b.date).getTime() || 0;
        return bMs - aMs;
      });
  }, [acuteIncidents, incidentWindow]);

  // --- Clock tick ---
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // --- New incident detection ---
  useEffect(() => {
    const currentIds = new Set(acuteIncidents.map(i => i.id));
    for (const inc of acuteIncidents) {
      if (!prevIncidentIdsRef.current.has(inc.id)) {
        const nearest = nearestCampus(inc.lat, inc.lng);
        if (nearest.dist <= 2.0) {
          setAlertIncident(inc);
          setTimeout(() => setAlertIncident(prev => prev?.id === inc.id ? null : prev), 15000);
        }
      }
    }
    prevIncidentIdsRef.current = currentIds;
  }, [acuteIncidents]);

  // --- Keyboard shortcuts ---
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (activeModal) {
        if (e.key === 'Escape') setActiveModal(null);
        return;
      }
      const modals: ModalType[] = ['911', 'principal', 'cps', 'nst', 'leadership', 'comms', 'contagion'];
      const num = parseInt(e.key);
      if (num >= 1 && num <= 7) setActiveModal(modals[num - 1]);
      if (e.key === 'Escape') onClose();
      if (e.key.toLowerCase() === 'c') {
        // Cycle active campus
        const idx = sorted.findIndex(r => r.campusId === activeCampusId);
        const next = sorted[(idx + 1) % sorted.length];
        if (next) setActiveCampusId(next.campusId);
      }
      if (e.key.toLowerCase() === 'r') {
        // Force refresh visual
        setClock(new Date());
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeModal, activeCampusId, sorted, onClose]);

  // --- Log action ---
  const logAction = useCallback((action: string, campus?: string, status: 'complete' | 'pending' = 'complete') => {
    setIncidentLog(prev => [
      ...prev,
      { id: String(Date.now()), time: new Date(), action, campus, status },
    ]);
  }, []);

  // --- Situation generators ---
  const generateSituationSummary = useCallback(() => {
    const campus = activeCampus;
    const risk = activeRisk;
    if (!risk) return '';
    const recentInc = acuteIncidents.find(inc => {
      const dist = haversine(campus.lat, campus.lng, inc.lat, inc.lng);
      return dist <= 1.0 && ageInHours(inc.date) <= 24;
    });
    const incDesc = recentInc
      ? `${recentInc.type} reported ${haversine(campus.lat, campus.lng, recentInc.lat, recentInc.lng).toFixed(1)}mi away at ${fmtAgo(recentInc.date)}`
      : 'no specific incident reported';
    return `${risk.label} situation near ${campus.name} at ${campus.addr}. ${incDesc}. We are implementing appropriate safety protocols and requesting coordination support.`;
  }, [activeCampus, activeRisk, acuteIncidents]);

  const generateExportReport = useCallback(() => {
    const lines: string[] = [];
    lines.push('NOBLE SCHOOLS — Sentinel SITUATION REPORT');
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push('═'.repeat(50));
    lines.push('');
    lines.push('NETWORK STATUS');
    lines.push(`  Average Risk Score: ${networkSummary.avgScore}`);
    lines.push(`  Campuses Elevated+: ${elevatedCount} of 18`);
    lines.push(`  Active Contagion Zones: ${contagionCount}`);
    lines.push(`  ICE Status: ${iceAlerts.length > 0 ? `${iceAlerts.length} ACTIVE` : 'CLEAR'}`);
    lines.push('');
    lines.push('CAMPUS STATUS (sorted by risk)');
    for (const r of sorted) {
      const c = CAMPUSES.find(ca => ca.id === r.campusId);
      if (!c) continue;
      lines.push(`  ${r.score.toString().padStart(3)} ${r.label.padEnd(9)} ${c.short} — ${r.statusReason}`);
    }
    lines.push('');
    lines.push(`ACTIVE INCIDENTS (last ${incidentWindow}h)`);
    for (const inc of feedIncidents.slice(0, 20)) {
      const { campus, dist } = nearestCampus(inc.lat, inc.lng);
      lines.push(`  ${new Date(inc.date).toLocaleTimeString()} ${inc.type} — ${dist.toFixed(1)}mi from ${campus.short} — ${inc.block}`);
    }
    lines.push('');
    lines.push('CONTAGION ZONES');
    for (const z of zones.filter(z => z.phase !== 'WATCH')) {
      lines.push(`  ${z.phase} — ${z.block ?? 'Unknown'} — ${fmtAgo(z.homicideDate)} — ${z.daysLeft}d remaining${z.retWin ? ' — RETALIATION WINDOW' : ''}`);
    }
    lines.push('');
    lines.push('SESSION LOG');
    for (const entry of incidentLog) {
      const t = entry.time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      lines.push(`  ${t}  ${entry.action}${entry.campus ? ` — ${entry.campus}` : ''}`);
    }
    return lines.join('\n');
  }, [networkSummary, elevatedCount, contagionCount, iceAlerts, sorted, feedIncidents, incidentWindow, zones, incidentLog]);

  // --- Time formatting ---
  const clockStr = clock.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
  const dateStr = clock.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  /* ════════════════════════════════════════════════════
     Mobile Layout
     ════════════════════════════════════════════════════ */
  if (isMobile) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: BG, color: TEXT, zIndex: 9999, overflowY: 'auto', fontFamily: SANS }}>
        <style>{KEYFRAMES}</style>
        <div style={{ padding: 12, background: PANEL, borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: GOLD, fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: 2 }}>COMMAND CENTER</span>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 4, color: TEXT2, cursor: 'pointer', padding: '4px 10px', fontSize: 11 }}>EXIT</button>
        </div>
        <div style={{ padding: 12, background: '#1E293B', fontSize: 11, color: GOLD, textAlign: 'center' }}>
          For full Command Center, use desktop or tablet
        </div>
        {/* Campus grid — 2 columns */}
        <div style={{ padding: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {sorted.map(r => {
            const c = CAMPUSES.find(ca => ca.id === r.campusId)!;
            return (
              <div key={r.campusId} style={{ background: PANEL, border: `1px solid ${LABEL_COLORS[r.label]}30`, borderRadius: 6, padding: 8 }}
                onClick={() => onSelectCampus(r.campusId)}>
                <div style={{ fontSize: 11, fontWeight: 600, color: TEXT }}>{c.short}</div>
                <div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 800, color: LABEL_COLORS[r.label] }}>{r.score}</div>
                <div style={{ fontSize: 9, color: LABEL_COLORS[r.label], fontWeight: 700 }}>{r.label}</div>
              </div>
            );
          })}
        </div>
        {/* Crisis buttons — vertical stack */}
        <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {WORKFLOW_BUTTONS.map(wb => (
            <button key={wb.key} onClick={() => setActiveModal(wb.key as ModalType)}
              style={{ ...workflowBtnBase, background: wb.bg, color: wb.fg, borderColor: wb.border }}>
              {wb.icon} {wb.label}
            </button>
          ))}
        </div>
        {/* Incident log */}
        <div style={{ padding: 8 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: GOLD, marginBottom: 4, letterSpacing: 1 }}>INCIDENT LOG</div>
          {incidentLog.map(entry => (
            <div key={entry.id} style={{ fontSize: 11, color: TEXT2, padding: '3px 0', borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontFamily: MONO, color: TEXT, marginRight: 8 }}>
                {entry.time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </span>
              {entry.action}
            </div>
          ))}
        </div>
        {activeModal && renderModal()}
      </div>
    );
  }

  /* ════════════════════════════════════════════════════
     Render Modal (shared between mobile/desktop)
     ════════════════════════════════════════════════════ */
  function renderModal() {
    const close = () => setActiveModal(null);
    const overlay: React.CSSProperties = {
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 10001,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    };
    const modal: React.CSSProperties = {
      background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 12,
      padding: 24, maxWidth: 560, width: '90vw', maxHeight: '80vh', overflowY: 'auto',
      color: TEXT, fontFamily: SANS,
    };
    const heading: React.CSSProperties = {
      fontFamily: MONO, fontSize: 14, fontWeight: 700, color: GOLD,
      letterSpacing: 1, marginBottom: 16,
    };
    const btnClose: React.CSSProperties = {
      position: 'absolute', top: 12, right: 12, background: 'transparent',
      border: 'none', color: TEXT2, cursor: 'pointer', fontSize: 18,
    };
    const actionBtn = (bg: string, label: string, onClick: () => void): React.ReactElement => (
      <button onClick={onClick} style={{
        background: bg, color: '#fff', border: 'none', borderRadius: 8,
        padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
        width: '100%', marginTop: 8, minHeight: 44,
      }}>{label}</button>
    );
    const copyBtn = (text: string, label = 'Copy to Clipboard') => (
      <button onClick={() => { navigator.clipboard.writeText(text); logAction(`Copied: ${label}`); }} style={{
        background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 6,
        padding: '8px 16px', color: GOLD, cursor: 'pointer', fontSize: 12,
        fontWeight: 600, width: '100%', marginTop: 8, minHeight: 40,
      }}>{label}</button>
    );
    const preBlock = (text: string): React.ReactElement => (
      <pre style={{ background: BG, padding: 12, borderRadius: 8, fontSize: 12, fontFamily: MONO, color: TEXT, whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: '8px 0' }}>{text}</pre>
    );
    const ts = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

    switch (activeModal) {
      case '911': {
        return (
          <div style={overlay} onClick={e => { if (e.target === e.currentTarget) close(); }}>
            <div style={{ ...modal, position: 'relative' }}>
              <button style={btnClose} onClick={close}>&times;</button>
              <div style={heading}>CALL 911</div>
              <a href="tel:911" onClick={() => logAction('911 called', activeCampus.short)}
                style={{ display: 'block', background: '#DC2626', color: '#fff', borderRadius: 8, padding: 16, fontSize: 20, fontWeight: 800, textAlign: 'center', textDecoration: 'none', marginBottom: 16 }}>
                Call 911 Now
              </a>
              <label style={{ fontSize: 12, color: TEXT2 }}>Which campus?</label>
              <select value={activeCampusId} onChange={e => setActiveCampusId(Number(e.target.value))}
                style={{ width: '100%', padding: 10, background: BG, color: TEXT, border: `1px solid ${BORDER}`, borderRadius: 6, fontSize: 14, marginTop: 4, marginBottom: 12 }}>
                {sorted.map(r => {
                  const c = CAMPUSES.find(ca => ca.id === r.campusId)!;
                  return <option key={r.campusId} value={r.campusId}>{c.short} — Score: {r.score}</option>;
                })}
              </select>
              <div style={{ fontSize: 13, color: TEXT2, marginBottom: 8 }}>Was 911 already called by campus?</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {actionBtn('#0EA5E9', 'Yes — Already Called', () => { logAction('911 confirmed — already called by campus', activeCampus.short); close(); })}
                {actionBtn('#D97706', 'No — I am calling', () => { logAction('911 called — initiated from Command Center', activeCampus.short); close(); })}
              </div>
            </div>
          </div>
        );
      }
      case 'principal': {
        return (
          <div style={overlay} onClick={e => { if (e.target === e.currentTarget) close(); }}>
            <div style={{ ...modal, position: 'relative', maxHeight: '85vh' }}>
              <button style={btnClose} onClick={close}>&times;</button>
              <div style={heading}>CONTACT PRINCIPAL</div>
              <div style={{ fontSize: 12, color: TEXT2, marginBottom: 12 }}>Pre-written message:</div>
              {preBlock(`This is the Noble central office calling regarding a safety situation near ${activeCampus.short}. Can you give me a status update?`)}
              {copyBtn(`This is the Noble central office calling regarding a safety situation near ${activeCampus.short}. Can you give me a status update?`, 'Copy Message')}
              <div style={{ marginTop: 16, maxHeight: 360, overflowY: 'auto' }} className="cc-scroll">
                {CAMPUSES.map(c => (
                  <div key={c.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                    borderBottom: `1px solid ${BORDER}`,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{c.short}</div>
                      <div style={{ fontSize: 11, color: TEXT2 }}>{c.name}</div>
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 11, color: TEXT2, minWidth: 100 }}>
                      (___) ___-____
                    </div>
                    <button onClick={() => { logAction('Principal contacted', c.short); }}
                      style={{ background: '#D97706', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', minHeight: 32 }}>
                      Log Call
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }
      case 'cps': {
        const situationMsg = `This is Noble Schools calling. We have a ${activeRisk?.label ?? 'ELEVATED'} situation near ${activeCampus.name} at ${activeCampus.addr}. ${generateSituationSummary()}`;
        return (
          <div style={overlay} onClick={e => { if (e.target === e.currentTarget) close(); }}>
            <div style={{ ...modal, position: 'relative' }}>
              <button style={btnClose} onClick={close}>&times;</button>
              <div style={heading}>CPS SAFETY CENTER</div>
              <div style={{ fontSize: 13, color: TEXT2, marginBottom: 8 }}>CPS Office of Safety & Security</div>
              <div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 800, color: TEXT, marginBottom: 12 }}>(773) 553-1600</div>
              <a href="tel:7735531600" onClick={() => logAction('CPS Safety Center called', activeCampus.short)}
                style={{ display: 'block', background: '#D97706', color: '#fff', borderRadius: 8, padding: 14, fontSize: 16, fontWeight: 700, textAlign: 'center', textDecoration: 'none', marginBottom: 16 }}>
                Call Now
              </a>
              <div style={{ fontSize: 12, color: TEXT2, marginBottom: 4 }}>Situation summary:</div>
              {preBlock(situationMsg)}
              {copyBtn(situationMsg, 'Copy Situation Summary')}
              {actionBtn('#0EA5E9', 'Log: CPS Notified', () => { logAction('CPS Safety Center notified', activeCampus.short); close(); })}
            </div>
          </div>
        );
      }
      case 'nst': {
        const deployMsg = `NST DEPLOYMENT ALERT — ${ts}\nCampus: ${activeCampus.name}\nSituation: ${generateSituationSummary()}\nReport to: ${activeCampus.addr}\nAuthorization: [Safety Director]`;
        return (
          <div style={overlay} onClick={e => { if (e.target === e.currentTarget) close(); }}>
            <div style={{ ...modal, position: 'relative' }}>
              <button style={btnClose} onClick={close}>&times;</button>
              <div style={heading}>DEPLOY NST TEAM</div>
              <label style={{ fontSize: 12, color: TEXT2 }}>Confirm campus for deployment:</label>
              <select value={activeCampusId} onChange={e => setActiveCampusId(Number(e.target.value))}
                style={{ width: '100%', padding: 10, background: BG, color: TEXT, border: `1px solid ${BORDER}`, borderRadius: 6, fontSize: 14, marginTop: 4, marginBottom: 12 }}>
                {CAMPUSES.map(c => <option key={c.id} value={c.id}>{c.short} — {c.addr}</option>)}
              </select>
              {preBlock(deployMsg)}
              {copyBtn(deployMsg, 'Copy Deployment Message')}
              <div style={{ marginTop: 12, fontSize: 12, color: TEXT2 }}>
                <label>ETA to campus: </label>
                <input type="text" placeholder="__ minutes" style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 4, color: TEXT, padding: '4px 8px', fontSize: 12, width: 100 }} />
              </div>
              {actionBtn(GOLD, 'Confirm Deployment', () => { logAction('NST Team deployed', activeCampus.short); close(); })}
            </div>
          </div>
        );
      }
      case 'leadership': {
        const leaderMsg = `NOBLE SAFETY ALERT — ${ts}\nCampus: ${activeCampus.name} — ${activeCampus.communityArea}\nSituation: ${generateSituationSummary()}\nCurrent risk level: ${activeRisk?.label ?? 'ELEVATED'} (Score: ${activeRisk?.score ?? 0})\nActions taken: ${incidentLog.slice(1).map(e => e.action).join('; ') || 'None yet'}\nNext update: 30 minutes\nContact: Senior Director of Safety & Security`;
        const subject = encodeURIComponent(`NOBLE SAFETY ALERT — ${activeCampus.short} — ${activeRisk?.label ?? 'ELEVATED'}`);
        const body = encodeURIComponent(leaderMsg);
        return (
          <div style={overlay} onClick={e => { if (e.target === e.currentTarget) close(); }}>
            <div style={{ ...modal, position: 'relative' }}>
              <button style={btnClose} onClick={close}>&times;</button>
              <div style={heading}>NOTIFY SENIOR LEADERSHIP</div>
              {preBlock(leaderMsg)}
              {copyBtn(leaderMsg, 'Copy Notification')}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <a href={`mailto:?subject=${subject}&body=${body}`}
                  onClick={() => logAction('Leadership notified — email', activeCampus.short)}
                  style={{ flex: 1, display: 'block', background: '#1E3A5F', color: '#fff', borderRadius: 8, padding: 10, textAlign: 'center', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                  Send via Email
                </a>
                <a href={`sms:?body=${body}`}
                  onClick={() => logAction('Leadership notified — text', activeCampus.short)}
                  style={{ flex: 1, display: 'block', background: '#1E3A5F', color: '#fff', borderRadius: 8, padding: 10, textAlign: 'center', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                  Send via Text
                </a>
              </div>
              {actionBtn('#0EA5E9', 'Log: Leadership Notified', () => { logAction('Leadership notified', activeCampus.short); close(); })}
            </div>
          </div>
        );
      }
      case 'comms': {
        const familyMsg = `Dear Noble Families,\n\nWe want to update you on a situation near ${activeCampus.name}. ${activeRisk?.label === 'CRITICAL' || activeRisk?.label === 'HIGH' ? 'Out of an abundance of caution, we have activated enhanced safety protocols at our campus.' : 'We are aware of an incident in the surrounding area and are closely monitoring the situation.'} Your student's safety is our priority. ${activeRisk?.label === 'CRITICAL' ? 'Please do not come to the school at this time. We will notify you when it is safe to do so.' : 'We will provide updates as the situation develops.'}\n\n— Noble Schools`;
        const staffMsg = `Noble Staff Alert — ${activeCampus.short} — ${ts}\nSituation: ${generateSituationSummary()}\nAction required: Follow established safety protocols. Await further instructions from campus leadership.\nReport concerns to: Senior Director of Safety & Security`;
        const mediaMsg = `Noble Schools is aware of an incident in the vicinity of ${activeCampus.name}. The safety of our students and staff is our top priority. We are working closely with Chicago Police Department and have implemented appropriate safety protocols. We will provide updates as more information becomes available.`;
        const msgs = { family: familyMsg, staff: staffMsg, media: mediaMsg };
        const labels = { family: 'Family Message', staff: 'Staff Message', media: 'Media/Public Statement' };
        return (
          <div style={overlay} onClick={e => { if (e.target === e.currentTarget) close(); }}>
            <div style={{ ...modal, position: 'relative' }}>
              <button style={btnClose} onClick={close}>&times;</button>
              <div style={heading}>FAMILY & STAFF COMMUNICATIONS</div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                {(['family', 'staff', 'media'] as const).map(tab => (
                  <button key={tab} onClick={() => setCommsTab(tab)} style={{
                    flex: 1, padding: '8px 4px', borderRadius: 6, border: 'none',
                    background: commsTab === tab ? GOLD : 'transparent',
                    color: commsTab === tab ? BG : TEXT2,
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', minHeight: 36,
                    textTransform: 'capitalize',
                  }}>{tab}</button>
                ))}
              </div>
              <div style={{ fontSize: 12, color: GOLD, fontWeight: 600, marginBottom: 4 }}>{labels[commsTab]}</div>
              {preBlock(msgs[commsTab])}
              {copyBtn(msgs[commsTab], `Copy ${labels[commsTab]}`)}
              {actionBtn('#0EA5E9', `Log: ${labels[commsTab]} Drafted`, () => { logAction(`${labels[commsTab]} drafted`, activeCampus.short, 'pending'); close(); })}
            </div>
          </div>
        );
      }
      case 'contagion': {
        const acuteZones = zones.filter(z => z.phase === 'ACUTE');
        const activeZones = zones.filter(z => z.phase === 'ACTIVE');
        const retWindows = zones.filter(z => z.retWin);
        const campusesInAcute = risks.filter(r => r.contagionZones.some(z => z.phase === 'ACUTE'));
        const campusesInRet = risks.filter(r => r.inRetaliationWindow);
        const report = `NOBLE NETWORK CONTAGION ASSESSMENT — ${new Date().toLocaleDateString()}\nActive zones: ${acuteZones.length + activeZones.length}\nCampuses in ACUTE phase: ${campusesInAcute.map(r => CAMPUSES.find(c => c.id === r.campusId)?.short).join(', ') || 'None'}\nRetaliation windows open: ${campusesInRet.map(r => CAMPUSES.find(c => c.id === r.campusId)?.short).join(', ') || 'None'}\nHighest risk period: ${forecast[0]?.dayName ?? 'Today'} — ${forecast[0]?.label ?? 'LOW'}\nRecommended actions: ${campusesInRet.length > 0 ? 'Enhanced monitoring for retaliation-window campuses. Consider NST deployment.' : campusesInAcute.length > 0 ? 'Heightened awareness. Monitor contagion zone evolution.' : 'Standard monitoring. No immediate action required.'}`;
        return (
          <div style={overlay} onClick={e => { if (e.target === e.currentTarget) close(); }}>
            <div style={{ ...modal, position: 'relative', maxWidth: 640 }}>
              <button style={btnClose} onClick={close}>&times;</button>
              <div style={heading}>CONTAGION ASSESSMENT</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
                <StatTile label="ACUTE Zones" value={String(acuteZones.length)} color="#DC2626" />
                <StatTile label="ACTIVE Zones" value={String(activeZones.length)} color="#D97706" />
                <StatTile label="Ret. Windows" value={String(retWindows.length)} color="#DC2626" />
              </div>
              <div style={{ fontSize: 12, color: GOLD, fontWeight: 600, marginBottom: 6 }}>Campuses in ACUTE zones:</div>
              {campusesInAcute.length === 0 ? (
                <div style={{ fontSize: 12, color: '#0EA5E9', marginBottom: 12 }}>None — network clear of ACUTE exposure</div>
              ) : (
                <div style={{ marginBottom: 12 }}>
                  {campusesInAcute.map(r => {
                    const c = CAMPUSES.find(ca => ca.id === r.campusId)!;
                    return (
                      <div key={r.campusId} style={{ fontSize: 12, color: TEXT, padding: '4px 0', borderBottom: `1px solid ${BORDER}` }}>
                        <span style={{ fontWeight: 700, color: LABEL_COLORS[r.label] }}>{c.short}</span> — {r.contagionZones.filter(z => z.phase === 'ACUTE').length} ACUTE zone(s)
                        {r.inRetaliationWindow && <span style={{ color: '#DC2626', marginLeft: 8, fontWeight: 700 }}>RET WIN</span>}
                      </div>
                    );
                  })}
                </div>
              )}
              <div style={{ fontSize: 12, color: GOLD, fontWeight: 600, marginBottom: 6 }}>7-Day Contagion Projection:</div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                {forecast.map((day, i) => (
                  <div key={i} style={{
                    flex: 1, padding: 6, background: BG, borderRadius: 6, textAlign: 'center',
                    border: `1px solid ${day.contagionPhase === 'ACUTE' ? '#DC2626' : day.contagionPhase === 'ACTIVE' ? '#D97706' : BORDER}`,
                  }}>
                    <div style={{ fontSize: 9, color: TEXT2 }}>{day.dayName.slice(0, 3)}</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: LABEL_COLORS[day.label] ?? TEXT2 }}>{day.label}</div>
                  </div>
                ))}
              </div>
              {preBlock(report)}
              {copyBtn(report, 'Copy Assessment Report')}
            </div>
          </div>
        );
      }
      default: return null;
    }
  }

  /* ════════════════════════════════════════════════════
     Desktop Layout — CSS Grid
     ════════════════════════════════════════════════════ */
  return (
    <div style={{
      position: 'fixed', inset: 0, background: BG, color: TEXT, zIndex: 9999,
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 340px',
      gridTemplateRows: '48px 28px 1fr auto 1fr',
      fontFamily: SANS, overflow: 'hidden',
    }}>
      <style>{KEYFRAMES}</style>

      {/* ──── HEADER BAR (Row 1, all columns) ──── */}
      <div style={{
        gridColumn: '1 / -1', gridRow: '1',
        background: PANEL, borderBottom: `1px solid ${BORDER}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px',
      }}>
        {/* Left: branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="20" height="24" viewBox="0 0 28 34" style={{ flexShrink: 0 }}>
            <path d="M14 1L2 7v12c0 9.3 5.1 17.9 12 21.5 6.9-3.6 12-12.2 12-21.5V7L14 1z"
              fill={GOLD} stroke="#fff" strokeWidth="1"/>
            <text x="14" y="20" textAnchor="middle" fill={BG} fontSize="9" fontWeight="800" fontFamily="system-ui">N</text>
          </svg>
          <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: GOLD, letterSpacing: 2 }}>
            Sentinel COMMAND CENTER &mdash; NOBLE SCHOOLS
          </span>
        </div>

        {/* Center: metrics */}
        <div style={{ display: 'flex', gap: 20 }}>
          <HeaderMetric label="Network Avg" value={String(networkSummary.avgScore)} color={TEXT} />
          <HeaderMetric label="Elevated" value={String(elevatedCount)} color={elevatedCount > 0 ? '#D97706' : '#0EA5E9'} />
          <HeaderMetric label="Contagion" value={String(contagionCount)} color={contagionCount > 0 ? '#DC2626' : '#0EA5E9'} />
          <HeaderMetric label="ICE" value={iceAlerts.length > 0 ? 'ACTIVE' : 'CLEAR'} color={iceAlerts.length > 0 ? '#7C3AED' : '#0EA5E9'} />
        </div>

        {/* Right: clock + campus selector + export + exit */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <select value={activeCampusId} onChange={e => { setActiveCampusId(Number(e.target.value)); logAction('Campus selected', CAMPUSES.find(c => c.id === Number(e.target.value))?.short); }}
            title="Active Campus (C)"
            style={{ background: BG, color: TEXT, border: `1px solid ${BORDER}`, borderRadius: 4, padding: '4px 8px', fontSize: 11, fontFamily: MONO }}>
            {sorted.map(r => {
              const c = CAMPUSES.find(ca => ca.id === r.campusId)!;
              return <option key={r.campusId} value={r.campusId}>{c.short} ({r.score})</option>;
            })}
          </select>
          <button onClick={() => {
            const report = generateExportReport();
            const blob = new Blob([report], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `pulse-sitrep-${Date.now()}.txt`; a.click();
            URL.revokeObjectURL(url);
            logAction('Situation report exported');
          }} title="Generate Situation Report"
            style={{ background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 4, color: TEXT2, cursor: 'pointer', padding: '4px 8px', fontSize: 11, fontFamily: MONO, minHeight: 28 }}>
            SITREP
          </button>
          <span style={{ fontFamily: MONO, fontSize: 13, color: TEXT, letterSpacing: 1 }}>{clockStr}</span>
          <button onClick={onClose} style={{
            background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 4,
            color: TEXT2, cursor: 'pointer', padding: '4px 10px', fontSize: 11, fontWeight: 700,
            fontFamily: MONO, minHeight: 28,
          }}>EXIT</button>
        </div>
      </div>

      {/* ──── DATE SUB-BAR (Row 2, all columns) ──── */}
      <div style={{
        gridColumn: '1 / -1', gridRow: '2',
        background: alertIncident ? undefined : 'transparent',
        backgroundImage: alertIncident ? `linear-gradient(90deg, transparent, ${GOLD}22, transparent)` : undefined,
        backgroundSize: '200% 100%',
        animation: alertIncident ? 'cc-goldSweep 2s linear infinite' : undefined,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, color: TEXT2, fontFamily: MONO,
        borderBottom: `1px solid ${BORDER}`,
      }}>
        {alertIncident ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: GOLD, fontWeight: 700 }}>
            <span>NEW INCIDENT</span>
            <span style={{ color: INC_TYPE_COLORS[alertIncident.type] ?? TEXT }}>{alertIncident.type}</span>
            <span>&mdash; {nearestCampus(alertIncident.lat, alertIncident.lng).dist.toFixed(1)}mi from {nearestCampus(alertIncident.lat, alertIncident.lng).campus.short}</span>
            <span>&mdash; {fmtAgo(alertIncident.date)}</span>
            <button onClick={() => setAlertIncident(null)} style={{ background: 'none', border: 'none', color: TEXT2, cursor: 'pointer', fontSize: 14 }}>&times;</button>
          </div>
        ) : (
          <span>{dateStr} &mdash; {clockStr}</span>
        )}
      </div>

      {/* ──── PANEL 1: CAMPUS GRID (Row 3, Col 1) ──── */}
      <div style={{
        gridColumn: '1', gridRow: '3',
        borderRight: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <PanelHeader title="CAMPUS STATUS" sub={`18 campuses — ${elevatedCount} elevated`} />
        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }} className="cc-scroll">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {sorted.map(r => {
              const c = CAMPUSES.find(ca => ca.id === r.campusId)!;
              const labelColor = LABEL_COLORS[r.label];
              const tint = r.label === 'CRITICAL' ? 'rgba(220,38,38,0.08)'
                : r.label === 'HIGH' ? 'rgba(234,88,12,0.06)'
                : r.label === 'ELEVATED' ? 'rgba(217,119,6,0.05)'
                : PANEL;
              return (
                <div key={r.campusId}
                  onClick={() => setDetailCampusId(detailCampusId === r.campusId ? null : r.campusId)}
                  style={{
                    background: tint, border: `1px solid ${labelColor}30`,
                    borderRadius: 6, padding: '6px 8px', cursor: 'pointer',
                    animation: r.label === 'CRITICAL' ? 'cc-pulse 2s ease-in-out infinite' : undefined,
                    transition: 'border-color 200ms',
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: TEXT }}>{c.short}</span>
                    <span style={{ fontFamily: MONO, fontSize: 18, fontWeight: 800, color: labelColor }}>{r.score}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <span style={{ fontSize: 8, fontWeight: 700, color: '#fff', background: labelColor, padding: '1px 5px', borderRadius: 3 }}>{r.label}</span>
                    {r.inRetaliationWindow && <span style={{ fontSize: 7, fontWeight: 800, color: '#fff', background: '#DC2626', padding: '1px 4px', borderRadius: 3 }}>RET.WIN</span>}
                    {iceAlerts.some(a => a.nearestCampusId === r.campusId) && <span style={{ fontSize: 7, fontWeight: 800, color: '#fff', background: '#7C3AED', padding: '1px 4px', borderRadius: 3 }}>ICE</span>}
                    {shotSpotterEvents.some(s => haversine(c.lat, c.lng, s.lat, s.lng) <= 0.5 && ageInHours(s.date) <= 2) && <span style={{ fontSize: 7, fontWeight: 800, color: '#fff', background: '#0D9488', padding: '1px 4px', borderRadius: 3 }}>SHOT</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Slide-up detail */}
        {detailCampusId != null && (() => {
          const dr = risks.find(r => r.campusId === detailCampusId);
          const dc = CAMPUSES.find(c => c.id === detailCampusId);
          if (!dr || !dc) return null;
          return (
            <div style={{
              background: PANEL, borderTop: `2px solid ${LABEL_COLORS[dr.label]}`,
              padding: 12, maxHeight: 160, overflowY: 'auto',
            }} className="cc-scroll">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: TEXT }}>{dc.name}</span>
                <button onClick={() => setDetailCampusId(null)} style={{ background: 'none', border: 'none', color: TEXT2, cursor: 'pointer', fontSize: 16 }}>&times;</button>
              </div>
              <div style={{ fontSize: 12, color: TEXT2, lineHeight: 1.6 }}>
                <span style={{ fontFamily: MONO, fontWeight: 800, color: LABEL_COLORS[dr.label], fontSize: 18, marginRight: 8 }}>{dr.score}</span>
                <span style={{ color: LABEL_COLORS[dr.label], fontWeight: 700 }}>{dr.label}</span>
                <span style={{ marginLeft: 8 }}>&mdash; {dc.communityArea}</span>
                <br />{dr.statusReason}
                <br /><span style={{ color: TEXT2, fontSize: 11 }}>Base {dr.base} | Acute {dr.acute} | Seasonal {dr.seasonal} | Close {dr.closeCount} | Near {dr.nearCount}</span>
              </div>
              <button onClick={() => { onSelectCampus(detailCampusId); onClose(); }}
                style={{ marginTop: 6, background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 4, color: GOLD, cursor: 'pointer', padding: '4px 10px', fontSize: 11, fontWeight: 600, minHeight: 28 }}>
                View Full Campus &rarr;
              </button>
            </div>
          );
        })()}
      </div>

      {/* ──── PANEL 2: NETWORK MAP (Row 3, Col 2) ──── */}
      <div style={{
        gridColumn: '2', gridRow: '3',
        borderRight: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <PanelHeader title="NETWORK MAP" sub={`Updated ${clock.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`} />
        <div style={{ flex: 1, position: 'relative' }}>
          <MapContainer center={CHICAGO_CENTER} zoom={11} style={{ height: '100%', width: '100%', background: '#0A0F1E' }}
            scrollWheelZoom={false} zoomControl={false} dragging={false} doubleClickZoom={false}
            attributionControl={false}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            {/* Contagion zones */}
            {zones.filter(z => z.phase !== 'WATCH').map(zone => (
              <Circle key={zone.incidentId} center={[zone.lat, zone.lng]} radius={zone.radius * MI_TO_M}
                pathOptions={{
                  color: zone.phase === 'ACUTE' ? '#DC2626' : '#D97706',
                  fillColor: zone.phase === 'ACUTE' ? '#DC2626' : '#D97706',
                  fillOpacity: zone.phase === 'ACUTE' ? 0.25 : 0.12,
                  weight: 1, dashArray: '4 4',
                }} />
            ))}
            {/* Incident markers (24h) */}
            {acuteIncidents.filter(i => ageInHours(i.date) <= 24).map(inc => (
              <CircleMarker key={inc.id} center={[inc.lat, inc.lng]}
                radius={inc.type === 'HOMICIDE' ? 6 : 3}
                pathOptions={{
                  color: INC_TYPE_COLORS[inc.type] ?? '#6B7280',
                  fillColor: INC_TYPE_COLORS[inc.type] ?? '#6B7280',
                  fillOpacity: 0.7, weight: 1,
                }} />
            ))}
            {/* Campus shields */}
            {CAMPUSES.map(campus => {
              const r = risks.find(rr => rr.campusId === campus.id);
              if (!r) return null;
              const color = LABEL_COLORS[r.label] ?? '#0EA5E9';
              return (
                <Marker key={campus.id} position={[campus.lat, campus.lng]}
                  icon={makeMapShield(campus.short, r.score, color)}
                  eventHandlers={{ click: () => setDetailCampusId(campus.id) }}>
                  <Tooltip direction="top" offset={[0, -20]}>
                    <span style={{ fontSize: 11 }}>{campus.short} — {r.score} {r.label}</span>
                  </Tooltip>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>

      {/* ──── PANEL 3: ACTIVE INCIDENTS (Row 3-5, Col 3) ──── */}
      <div style={{
        gridColumn: '3', gridRow: '3 / 6',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{
          padding: '8px 12px', borderBottom: `1px solid ${BORDER}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: 1 }}>
              ACTIVE INCIDENTS
            </span>
            {feedIncidents.length > 0 && (
              <span style={{ marginLeft: 6, background: '#DC2626', color: '#fff', fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 8 }}>
                {feedIncidents.length}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            {([2, 6, 24] as TimeWindow[]).map(w => (
              <button key={w} onClick={() => setIncidentWindow(w)} style={{
                padding: '3px 8px', borderRadius: 4, border: 'none', fontSize: 10, fontWeight: 700,
                cursor: 'pointer', fontFamily: MONO, minHeight: 24,
                background: incidentWindow === w ? GOLD : 'transparent',
                color: incidentWindow === w ? BG : TEXT2,
              }}>{w}H</button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }} className="cc-scroll">
          {feedIncidents.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: '#0EA5E9', fontWeight: 600, marginBottom: 4 }}>
                No incidents reported near Noble campuses in the last {incidentWindow} hours.
              </div>
              <div style={{ fontSize: 11, color: TEXT2 }}>Network quiet.</div>
            </div>
          ) : (
            feedIncidents.map((inc, idx) => {
              const { campus, dist } = nearestCampus(inc.lat, inc.lng);
              const isNew = ageInHours(inc.date) < 0.25; // 15 minutes
              const typeColor = INC_TYPE_COLORS[inc.type] ?? '#6B7280';
              return (
                <div key={inc.id} style={{
                  padding: '8px 6px', borderBottom: `1px solid ${BORDER}`,
                  animation: idx === 0 ? 'cc-slideIn 0.3s ease' : undefined,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{
                      fontSize: 8, fontWeight: 800, color: '#fff', background: typeColor,
                      padding: '1px 5px', borderRadius: 3, textTransform: 'uppercase',
                    }}>{inc.type}</span>
                    {isNew && (
                      <span style={{
                        fontSize: 7, fontWeight: 800, color: BG, background: GOLD,
                        padding: '1px 5px', borderRadius: 3,
                        animation: 'cc-newPill 1.5s ease-in-out infinite',
                      }}>NEW</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: TEXT, marginBottom: 2 }}>
                    <span style={{ fontWeight: 600 }}>{dist.toFixed(1)}mi</span> from <span style={{ color: GOLD }}>{campus.short}</span>
                  </div>
                  <div style={{ fontSize: 10, color: TEXT2 }}>{inc.block}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                    <span style={{ fontSize: 9, color: TEXT2, fontFamily: MONO }}>{fmtAgo(inc.date)}</span>
                    <span style={{ fontSize: 8, fontWeight: 700, color: TEXT2, background: `${BORDER}`, padding: '1px 5px', borderRadius: 3 }}>CPD</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ──── PANEL 4: 7-DAY FORECAST (Row 4, Col 1-2) ──── */}
      <div style={{
        gridColumn: '1 / 3', gridRow: '4',
        borderBottom: `1px solid ${BORDER}`,
        display: 'flex', flexDirection: 'column',
      }}>
        <PanelHeader title="NETWORK RISK FORECAST" sub="NEXT 7 DAYS" />
        <div style={{ flex: 1, display: 'flex', gap: 6, padding: '6px 12px', alignItems: 'stretch' }}>
          {forecast.map((day, i) => {
            const labelColor = LABEL_COLORS[day.label] ?? '#0EA5E9';
            const dateObj = new Date(day.date);
            const dateShort = dateObj.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
            return (
              <div key={i} style={{
                flex: i === 0 ? 1.3 : 1,
                background: i === 0 ? `${labelColor}15` : BG,
                border: `1px solid ${i === 0 ? labelColor + '40' : BORDER}`,
                borderRadius: 6, padding: '8px 6px', textAlign: 'center',
                display: 'flex', flexDirection: 'column', justifyContent: 'center',
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: i === 0 ? GOLD : TEXT2 }}>
                  {i === 0 ? 'TODAY' : day.dayName.slice(0, 3).toUpperCase()}
                </div>
                <div style={{ fontSize: 9, color: TEXT2 }}>{dateShort}</div>
                <div style={{
                  margin: '4px auto', padding: '2px 8px', borderRadius: 4,
                  background: labelColor, color: '#fff', fontSize: 9, fontWeight: 800,
                }}>{day.label}</div>
                <div style={{ fontSize: 9, color: TEXT2, fontFamily: MONO }}>{day.confidence}%</div>
                {i === 0 && day.drivers[0] && (
                  <div style={{ fontSize: 8, color: TEXT2, marginTop: 2, lineHeight: 1.3 }}>
                    {day.drivers[0].length > 40 ? day.drivers[0].slice(0, 40) + '...' : day.drivers[0]}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ──── PANEL 5: CRISIS WORKFLOWS (Row 5, Col 1) ──── */}
      <div style={{
        gridColumn: '1', gridRow: '5',
        borderRight: `1px solid ${BORDER}`,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <PanelHeader title="CRISIS RESPONSE" sub="7 one-tap actions" />
        <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, alignContent: 'start' }} className="cc-scroll">
          {WORKFLOW_BUTTONS.map(wb => (
            <button key={wb.key} onClick={() => { setActiveModal(wb.key as ModalType); logAction(`Opened: ${wb.label}`, activeCampus.short); }}
              style={{
                ...workflowBtnBase,
                background: wb.bg, color: wb.fg, borderColor: wb.border,
                gridColumn: wb.key === '911' ? '1 / -1' : undefined,
              }}>
              <span style={{ fontSize: 16 }}>{wb.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>{wb.label}</span>
              <span style={{ fontSize: 8, color: TEXT2, fontFamily: MONO }}>[{wb.shortcut}]</span>
            </button>
          ))}
        </div>
      </div>

      {/* ──── PANEL 6: INCIDENT LOG (Row 5, Col 2) ──── */}
      <div style={{
        gridColumn: '2', gridRow: '5',
        borderRight: `1px solid ${BORDER}`,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{
          padding: '6px 12px', borderBottom: `1px solid ${BORDER}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: 1 }}>
            INCIDENT LOG
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => {
              const report = generateExportReport();
              navigator.clipboard.writeText(report);
              logAction('Log exported to clipboard');
            }} style={{ background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 3, color: TEXT2, cursor: 'pointer', padding: '2px 6px', fontSize: 9, fontFamily: MONO, minHeight: 20 }}>
              Export
            </button>
            <button onClick={() => {
              if (incidentLog.length <= 1) return;
              setIncidentLog([{ id: '0', time: new Date(), action: 'Log cleared and restarted', status: 'complete' }]);
            }} style={{ background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 3, color: TEXT2, cursor: 'pointer', padding: '2px 6px', fontSize: 9, fontFamily: MONO, minHeight: 20 }}>
              Clear
            </button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 12px' }} className="cc-scroll">
          <div style={{ fontFamily: MONO, fontSize: 10, color: TEXT2, padding: '4px 0', borderBottom: `1px solid ${BORDER}` }}>
            INCIDENT LOG &mdash; {dateStr}
          </div>
          {incidentLog.length <= 1 && (
            <div style={{ fontSize: 11, color: TEXT2, padding: '8px 0', lineHeight: 1.6 }}>
              No actions logged this session. When you take action — calling 911, contacting a principal, deploying NST — it will appear here automatically.
            </div>
          )}
          {incidentLog.map(entry => (
            <div key={entry.id} style={{ fontSize: 11, padding: '4px 0', borderBottom: `1px solid ${BORDER}15`, display: 'flex', gap: 8 }}>
              <span style={{ fontFamily: MONO, fontSize: 10, color: GOLD, flexShrink: 0, width: 70 }}>
                {entry.time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </span>
              <span style={{ color: TEXT, flex: 1 }}>
                {entry.action}
                {entry.campus && <span style={{ color: TEXT2 }}> &mdash; {entry.campus}</span>}
              </span>
              <span style={{ fontSize: 8, color: entry.status === 'complete' ? '#0EA5E9' : '#D97706', flexShrink: 0 }}>
                {entry.status === 'complete' ? '✓' : '○'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ──── Modal overlay ──── */}
      {activeModal && renderModal()}
    </div>
  );
}

/* ════════════════════════════════════════════════════
   Sub-Components
   ════════════════════════════════════════════════════ */

function PanelHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{
      padding: '6px 12px', borderBottom: `1px solid ${BORDER}`,
      display: 'flex', alignItems: 'baseline', gap: 8,
    }}>
      <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: 1 }}>{title}</span>
      <span style={{ fontSize: 9, color: TEXT2 }}>{sub}</span>
    </div>
  );
}

function HeaderMetric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 8, color: TEXT2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontFamily: MONO, fontSize: 14, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

function StatTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 6, padding: 8, textAlign: 'center' }}>
      <div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 9, color: TEXT2, marginTop: 2 }}>{label}</div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   Workflow Button Data
   ════════════════════════════════════════════════════ */
const workflowBtnBase: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
  padding: '10px 8px', borderRadius: 8, border: '1px solid',
  cursor: 'pointer', fontFamily: SANS, transition: 'opacity 150ms',
  minHeight: 60,
};

const WORKFLOW_BUTTONS = [
  { key: '911', icon: '🚨', label: 'CALL 911', bg: '#DC262620', fg: '#DC2626', border: '#DC262660', shortcut: '1' },
  { key: 'principal', icon: '📞', label: 'CONTACT PRINCIPAL', bg: '#D9770620', fg: '#D97706', border: '#D9770660', shortcut: '2' },
  { key: 'cps', icon: '🏛️', label: 'CPS SAFETY', bg: '#D9770620', fg: '#D97706', border: '#D9770660', shortcut: '3' },
  { key: 'nst', icon: '🛡️', label: 'DEPLOY NST', bg: `${GOLD}20`, fg: GOLD, border: `${GOLD}60`, shortcut: '4' },
  { key: 'leadership', icon: '👔', label: 'NOTIFY LEADERSHIP', bg: '#1E3A5F', fg: TEXT, border: `${GOLD}40`, shortcut: '5' },
  { key: 'comms', icon: '📢', label: 'FAMILY & STAFF', bg: '#1E3A8A20', fg: '#60A5FA', border: '#60A5FA60', shortcut: '6' },
  { key: 'contagion', icon: '🔬', label: 'CONTAGION', bg: '#0D948820', fg: '#0D9488', border: '#0D948860', shortcut: '7' },
] as const;
