/**
 * NetworkDashboard — Slate Watch Network Intelligence
 *
 * First principle: What happened near our schools that could impact
 * the safety of our students and staff? Right now.
 *
 * Design: Clean, calm, Apple-level clarity. Typography does the work.
 * Color is a signal, not a style. Everything is interactive.
 */
import { useState, useEffect, useCallback } from 'react';
import type {
  CampusRisk, NetworkSummary, ForecastDay, IceAlert,
  ShotSpotterEvent, Incident,
} from '../../sentinel-engine/types';
import type { CitizenIncident } from '../../sentinel-api/citizen';
import type { DispatchIncident } from '../../sentinel-api/scannerIntel';
import { CAMPUSES } from '../../sentinel-data/campuses';
import { haversine } from '../../sentinel-engine/geo';

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface Props {
  risks: CampusRisk[];
  summary: NetworkSummary;
  forecast: ForecastDay[];
  iceAlerts: IceAlert[];
  shotSpotterEvents: ShotSpotterEvent[];
  acuteIncidents: Incident[];
  citizenIncidents?: CitizenIncident[];
  newsIncidents?: Incident[];
  dispatchIncidents?: DispatchIncident[];
  onSelectCampus: (id: number) => void;
  scannerCalls?: number;
  scannerSpikeZones?: number;
  newsSourceCount?: number;
  newsIncidentCount?: number;
  redditIncidentCount?: number;
  cpdCount?: number;
}

interface LiveItem {
  id: string;
  source: 'CITIZEN' | 'NEWS' | 'SCANNER';
  type: string;
  title: string;
  block: string;
  campus: string;
  campusId: number;
  distMi: number;
  tsMs: number;
  isViolent: boolean;
  isMajor: boolean;
}

interface SchoolActivity {
  campusId: number;
  campusName: string;
  campusShort: string;
  communityArea: string;
  items: LiveItem[];
  zones: CampusRisk['contagionZones'];
  hasIce: boolean;
  inRetaliationWindow: boolean;
}

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const VIOLENT = new Set([
  'HOMICIDE', 'MURDER', 'SHOOTING', 'BATTERY',
  'ROBBERY', 'ASSAULT', 'WEAPONS VIOLATION', 'CRIM SEXUAL ASSAULT',
  'WEAPONS', 'STABBING',
]);
const MAJOR = new Set(['HOMICIDE', 'MURDER', 'SHOOTING']);
const H24 = 24 * 3600 * 1000;

const C = {
  cream:  '#F7F5F1',
  cream2: '#EFECE6',
  white:  '#FFFFFF',
  deep:   '#121315',
  mid:    '#4B5563',
  light:  '#9CA3AF',
  chalk:  '#E7E2D8',
  brass:  '#B79145',
  watch:  '#D45B4F',
  ice:    '#7C3AED',
  green:  '#16A34A',
  red:    '#EF4444',
  amber:  '#D97706',
};

const GLOBAL_STYLES = `
  @keyframes pulseRing{0%{transform:scale(1);opacity:.5}100%{transform:scale(2.2);opacity:0}}
  @keyframes blink{0%,100%{opacity:1}55%{opacity:.2}}
  @keyframes tickerScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
  @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
`;

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function fmtAgo(ms: number): string {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function fmtTime(): string {
  return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
}

function nearestCampus(lat: number, lng: number): { name: string; short: string; id: number; dist: number } {
  let best = { name: '', short: '', id: 0, dist: 99 };
  for (const c of CAMPUSES) {
    const d = haversine(c.lat, c.lng, lat, lng);
    if (d < best.dist) best = { name: c.name, short: c.short, id: c.id, dist: d };
  }
  return best;
}

// ─── BUILD LIVE FEED ─────────────────────────────────────────────────────────
// CitizenIncident: uses inc.lat, inc.lng, inc.timestamp (ISO string), inc.title
// Incident (news): uses inc.lat, inc.lng, inc.date, inc.description, inc.type
// DispatchIncident: uses inc.latitude, inc.longitude, inc.time, inc.description

function buildLiveFeed(
  citizenIncidents: CitizenIncident[],
  newsIncidents: Incident[],
  dispatchIncidents: DispatchIncident[],
): LiveItem[] {
  const now = Date.now();
  const items: LiveItem[] = [];

  for (const inc of citizenIncidents) {
    if (!inc.lat || !inc.lng) continue;
    const tsMs = new Date(inc.timestamp).getTime();
    if (isNaN(tsMs) || now - tsMs > H24) continue;
    const nearest = nearestCampus(inc.lat, inc.lng);
    if (nearest.dist > 1.0) continue;
    const isViolent = /shoot|gun|shot|stab|attack|assault|robber|weapon|homicide|murder/i.test(inc.title);
    items.push({
      id: `cit_${inc.id}`,
      source: 'CITIZEN',
      type: inc.category || 'REPORT',
      title: inc.title,
      block: '',
      campus: nearest.short,
      campusId: nearest.id,
      distMi: nearest.dist,
      tsMs,
      isViolent,
      isMajor: /homicide|murder|shoot/i.test(inc.title),
    });
  }

  for (const inc of newsIncidents) {
    if (inc.lat == null || inc.lng == null) continue;
    const tsMs = new Date(inc.date).getTime();
    if (isNaN(tsMs) || now - tsMs > H24) continue;
    const nearest = nearestCampus(inc.lat, inc.lng);
    if (nearest.dist > 1.0) continue;
    const type = (inc.type || 'NEWS').toUpperCase();
    items.push({
      id: `news_${inc.id}`,
      source: 'NEWS',
      type,
      title: inc.description || inc.block || 'News report',
      block: inc.block || '',
      campus: nearest.short,
      campusId: nearest.id,
      distMi: nearest.dist,
      tsMs,
      isViolent: VIOLENT.has(type),
      isMajor: MAJOR.has(type),
    });
  }

  for (const inc of dispatchIncidents) {
    if (!inc.latitude || !inc.longitude) continue;
    const tsMs = new Date(inc.time).getTime();
    if (isNaN(tsMs) || now - tsMs > H24) continue;
    const nearest = nearestCampus(inc.latitude, inc.longitude);
    if (nearest.dist > 1.0) continue;
    items.push({
      id: `scan_${inc.id}`,
      source: 'SCANNER',
      type: inc.type || 'DISPATCH',
      title: inc.description || 'Police dispatch',
      block: inc.block || '',
      campus: nearest.short,
      campusId: nearest.id,
      distMi: nearest.dist,
      tsMs,
      isViolent: !!inc.isPriority,
      isMajor: false,
    });
  }

  return items.sort((a, b) => {
    if (a.isMajor && !b.isMajor) return -1;
    if (!a.isMajor && b.isMajor) return 1;
    if (a.isViolent && !b.isViolent) return -1;
    if (!a.isViolent && b.isViolent) return 1;
    return b.tsMs - a.tsMs;
  });
}

// ─── BUILD SCHOOL ACTIVITY ────────────────────────────────────────────────────

function buildSchoolActivity(
  liveItems: LiveItem[],
  risks: CampusRisk[],
  iceAlerts: IceAlert[],
): SchoolActivity[] {
  const map = new Map<number, SchoolActivity>();

  for (const item of liveItems) {
    if (!map.has(item.campusId)) {
      const campus = CAMPUSES.find(c => c.id === item.campusId);
      if (!campus) continue;
      const risk = risks.find(r => r.campusId === item.campusId);
      map.set(item.campusId, {
        campusId: item.campusId,
        campusName: campus.name,
        campusShort: campus.short,
        communityArea: campus.communityArea,
        items: [],
        zones: risk?.contagionZones ?? [],
        hasIce: false,
        inRetaliationWindow: risk?.inRetaliationWindow ?? false,
      });
    }
    map.get(item.campusId)!.items.push(item);
  }

  for (const alert of iceAlerts) {
    for (const campus of CAMPUSES) {
      const isNear = (alert.lat != null && alert.lng != null)
        ? haversine(campus.lat, campus.lng, alert.lat, alert.lng) <= 1.0
        : (alert as any).nearestCampusId === campus.id;
      if (!isNear) continue;
      if (!map.has(campus.id)) {
        const risk = risks.find(r => r.campusId === campus.id);
        map.set(campus.id, {
          campusId: campus.id,
          campusName: campus.name,
          campusShort: campus.short,
          communityArea: campus.communityArea,
          items: [],
          zones: risk?.contagionZones ?? [],
          hasIce: true,
          inRetaliationWindow: risk?.inRetaliationWindow ?? false,
        });
      } else {
        map.get(campus.id)!.hasIce = true;
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.inRetaliationWindow && !b.inRetaliationWindow) return -1;
    if (!a.inRetaliationWindow && b.inRetaliationWindow) return 1;
    const av = a.items.filter(i => i.isViolent).length;
    const bv = b.items.filter(i => i.isViolent).length;
    if (av !== bv) return bv - av;
    if (a.hasIce && !b.hasIce) return -1;
    if (!a.hasIce && b.hasIce) return 1;
    return b.items.length - a.items.length;
  });
}

// ─── AI NARRATIVE HOOK ───────────────────────────────────────────────────────

function useNetworkNarrative(
  schoolActivity: SchoolActivity[],
  allZones: any[],
  iceAlerts: IceAlert[],
  liveItems: LiveItem[],
) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(0);
  const prevKey = { schools: -1, zones: -1, ice: -1, items: -1 };

  const generate = useCallback(async () => {
    setLoading(true);
    try {
      const activeSchools = schoolActivity.map(s => ({
        campus: s.campusShort,
        incidents: s.items.length,
        violent: s.items.filter(i => i.isViolent).length,
        hasIce: s.hasIce,
        retWindow: s.inRetaliationWindow,
      }));
      const retWin = allZones.filter(z => z.retWin).length;
      const acuteZones = allZones.filter(z => z.phase === 'ACUTE').length;
      const quietCount = CAMPUSES.length - schoolActivity.length;
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      const dayStr = now.toLocaleDateString('en-US', { weekday: 'long' });

      const ctx = {
        time: `${dayStr} at ${timeStr}`,
        totalCampuses: CAMPUSES.length,
        activeSchools,
        quietCampuses: quietCount,
        retaliationWindows: retWin,
        acuteZones,
        totalZones: allZones.length,
        iceAlerts: iceAlerts.length,
        totalLiveIncidents: liveItems.length,
        violentIncidents: liveItems.filter(i => i.isViolent).length,
      };

      const res = await fetch('/api/anthropic-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 320,
          system: `You are Slate Watch. Write a 2-4 sentence network intelligence brief for a senior school network leader (CEO, COO, Chief of Schools).

Rules:
- Plain declarative sentences. No hedging. No "it appears."
- Name specific campuses when relevant.
- Be time-aware — mention time of day or day of week if relevant.
- If things are quiet, say so confidently.
- Close with the single most important thing to know right now.
- No bullet points, headers, or markdown.
- Peer-level tone — briefing a colleague, not generating a report.`,
          messages: [{ role: 'user', content: `Network conditions as of ${ctx.time}: ${JSON.stringify(ctx)}` }],
        }),
      });
      const data = await res.json();
      const narText = data.content?.find((b: any) => b.type === 'text')?.text || '';
      setText(narText);
      setLastRefresh(Date.now());
    } catch {
      setText('');
    } finally {
      setLoading(false);
    }
  }, [schoolActivity.length, allZones.length, iceAlerts.length, liveItems.length]);

  useEffect(() => {
    generate();
    const t = setInterval(generate, 60_000);
    return () => clearInterval(t);
  }, [generate]);

  return { text, loading, lastRefresh, refresh: generate };
}

// ─── SMALL COMPONENTS ────────────────────────────────────────────────────────

const LiveDot = ({ color = C.watch }: { color?: string }) => (
  <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 10, height: 10, flexShrink: 0 }}>
    <span style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', background: color, opacity: .5, animation: 'pulseRing 2s ease-out infinite' }} />
    <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, position: 'relative', zIndex: 1, animation: 'blink 2.2s ease-in-out infinite' }} />
  </span>
);

const GreenDot = () => (
  <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, flexShrink: 0, display: 'inline-block' }} />
);

const Badge = ({ label, variant }: { label: string; variant: 'red' | 'amber' | 'purple' | 'green' | 'gray' }) => {
  const v: Record<string, React.CSSProperties> = {
    red:    { background: '#FEF2F2', color: '#7F1D1D', border: '1px solid #FECACA' },
    amber:  { background: '#FFFBEB', color: '#78350F', border: '1px solid #FDE68A' },
    purple: { background: '#F5F3FF', color: '#4C1D95', border: '1px solid #DDD6FE' },
    green:  { background: '#F0FDF4', color: '#14532D', border: '1px solid #BBF7D0' },
    gray:   { background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB' },
  };
  return <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: 20, ...v[variant] }}>{label}</span>;
};

const Pill = ({ label, color, bg, border }: { label: string; color: string; bg: string; border?: string }) => (
  <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: 3, flexShrink: 0, marginTop: 3, color, background: bg, ...(border ? { border } : {}) }}>
    {label}
  </span>
);

function getSourcePill(source: LiveItem['source']) {
  if (source === 'CITIZEN') return <Pill label="Live"    color="#065F46" bg="#ECFDF5" border="1px solid #A7F3D0" />;
  if (source === 'NEWS')    return <Pill label="News"    color="#5B21B6" bg="#F5F3FF" border="1px solid #DDD6FE" />;
  return                            <Pill label="Scanner" color="#78350F" bg="#FFFBEB" border="1px solid #FDE68A" />;
}

function getTypePill(type: string) {
  const t = type.toUpperCase();
  if (MAJOR.has(t))  return <Pill label={type.slice(0,10)} color="#7F1D1D" bg="#FEF2F2" />;
  if (t === 'ICE')   return <Pill label="ICE"              color="#5B21B6" bg="#F5F3FF" />;
  return                    <Pill label={type.replace(/_/g,' ').slice(0,12)} color="#374151" bg="#F3F4F6" />;
}

// ─── LIVE TICKER ─────────────────────────────────────────────────────────────

const LiveTicker = ({ liveItems, zones, iceAlerts, scannerCalls, scannerSpikeZones, newsIncidentCount }: {
  liveItems: LiveItem[]; zones: any[]; iceAlerts: IceAlert[];
  scannerCalls: number; scannerSpikeZones: number; newsIncidentCount: number;
}) => {
  const retWin = zones.filter(z => z.retWin).length;
  const acute  = zones.filter(z => z.phase === 'ACUTE').length;
  const items = [
    scannerCalls > 0 ? `CPD Radio · ${scannerCalls} calls monitored${scannerSpikeZones > 0 ? ` · ${scannerSpikeZones} spike zone${scannerSpikeZones !== 1 ? 's' : ''}` : ''}` : 'CPD Radio · monitoring all zones',
    'Citizen App · near-real-time · all campuses',
    retWin > 0 ? `Contagion · ${retWin} retaliation window${retWin !== 1 ? 's' : ''} open` : `Contagion · ${zones.length} zone${zones.length !== 1 ? 's' : ''} tracked`,
    newsIncidentCount > 0 ? `News · ${newsIncidentCount} incidents geocoded · Block Club · ABC7 · NBC5 · CBS · Sun-Times · WGN` : 'News feeds · monitoring',
    iceAlerts.length > 0 ? `ICE · ${iceAlerts.length} alert${iceAlerts.length !== 1 ? 's' : ''} near our campuses` : 'ICE monitoring · no alerts',
    liveItems.length > 0 ? `Live feed · ${liveItems.length} incident${liveItems.length !== 1 ? 's' : ''} near our schools · last 24h` : 'Live feed · all clear near our schools',
  ];
  const doubled = [...items, ...items];
  return (
    <div style={{ background: C.deep, height: 28, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, padding: '0 12px', background: C.brass, display: 'flex', alignItems: 'center', fontSize: 8, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: C.deep, zIndex: 2, whiteSpace: 'nowrap' }}>LIVE</div>
      <div style={{ paddingLeft: 56, height: '100%', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', whiteSpace: 'nowrap', animation: 'tickerScroll 40s linear infinite' }}>
          {doubled.map((item, i) => (
            <span key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,.5)', padding: '0 36px' }}>{item}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── NARRATIVE CARD ───────────────────────────────────────────────────────────

const NarrativeCard = ({ text, loading, lastRefresh, onRefresh }: { text: string; loading: boolean; lastRefresh: number; onRefresh: () => void }) => {
  const [secAgo, setSecAgo] = useState(0);
  useEffect(() => { setSecAgo(0); const t = setInterval(() => setSecAgo(s => s + 1), 1000); return () => clearInterval(t); }, [lastRefresh]);
  const ageText = secAgo < 5 ? 'just now' : secAgo < 60 ? `${secAgo}s ago` : `${Math.floor(secAgo / 60)}m ago`;

  return (
    <div style={{ background: C.white, border: `1px solid ${C.chalk}`, borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
      <div style={{ padding: '18px 22px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: C.light }}>
            <LiveDot color={C.watch} /><span>Intelligence Brief · refreshes every minute</span>
          </div>
          <button onClick={onRefresh} style={{ fontSize: 11, color: C.light, background: 'none', border: `1px solid ${C.chalk}`, borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>↻</button>
        </div>
        {loading && !text ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {[92, 78, 55].map((w, i) => (
              <div key={i} style={{ height: 18, borderRadius: 4, width: `${w}%`, background: `linear-gradient(90deg, ${C.chalk} 0%, ${C.cream2} 50%, ${C.chalk} 100%)`, backgroundSize: '400px 100%', animation: 'shimmer 1.4s infinite linear' }} />
            ))}
          </div>
        ) : (
          <p style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 15.5, lineHeight: 1.82, color: C.deep, marginBottom: 16 }}>
            {text || 'Loading network intelligence…'}
          </p>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 22px', background: C.cream, borderTop: `1px solid ${C.chalk}`, flexWrap: 'wrap' }}>
        {[{ color: C.green, label: 'Citizen App' }, { color: C.brass, label: 'CPD Radio' }, { color: C.ice, label: 'News feeds' }, { color: C.ice, label: 'ICE monitoring' }].map(({ color, label }, i, arr) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, display: 'inline-block' }} />
            <span style={{ fontSize: 10.5, color: C.mid }}>{label}</span>
            {i < arr.length - 1 && <span style={{ color: C.chalk, marginLeft: 5 }}>·</span>}
          </span>
        ))}
        <span style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.light }}>{ageText}</span>
      </div>
    </div>
  );
};

// ─── ICE STRIP ────────────────────────────────────────────────────────────────

const IceStrip = ({ alerts }: { alerts: IceAlert[] }) => {
  if (!alerts.length) return null;
  return (
    <div style={{ background: C.white, border: '1px solid #DDD6FE', borderLeft: '3px solid #7C3AED', borderRadius: 12, padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, cursor: 'pointer' }}>
      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: 4, background: '#7C3AED', color: '#fff', flexShrink: 0 }}>ICE</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#4C1D95' }}>Immigration enforcement activity near {alerts.length} campus{alerts.length !== 1 ? 'es' : ''}</div>
        <div style={{ fontSize: 11, color: '#6D28D9', marginTop: 2 }}>Lock exterior doors · Contact Network Legal · Review shelter-in-place protocol</div>
      </div>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, color: '#7C3AED', flexShrink: 0 }}>{alerts.length} reports →</span>
    </div>
  );
};

// ─── INCIDENT DETAIL ─────────────────────────────────────────────────────────

const IncidentDetail = ({ item }: { item: LiveItem }) => (
  <div style={{ background: '#F9F8F5', borderTop: `1px solid ${C.chalk}`, padding: '12px 18px 14px', animation: 'fadeUp .15s ease' }}>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
      {([
        ['Source', item.source === 'CITIZEN' ? 'Citizen App · community report' : item.source === 'NEWS' ? 'News feed · geocoded' : 'CPD Radio · AI transcription'],
        ['Type', item.type.replace(/_/g, ' ')],
        ['Location', item.block || `Near ${item.campus}`],
        ['Distance', `${item.distMi < 0.1 ? '<0.1' : item.distMi.toFixed(1)} miles from ${item.campus}`],
        ['Reported', fmtAgo(item.tsMs)],
        ['Contagion trigger', item.isMajor ? 'Yes — tracked by model' : 'No'],
      ] as [string,string][]).map(([l, v]) => (
        <div key={l} style={{ padding: '5px 0', borderBottom: '1px solid #F0EDE6', fontSize: 11.5 }}>
          <div style={{ color: C.light }}>{l}</div>
          <div style={{ color: C.deep, fontWeight: 500, marginTop: 1 }}>{v}</div>
        </div>
      ))}
    </div>
  </div>
);

// ─── CONTAGION DETAIL ─────────────────────────────────────────────────────────

const ContagionDetail = ({ zones }: { zones: any[] }) => {
  const retWin = zones.filter(z => z.retWin);
  const top = retWin[0] || zones.find(z => z.phase === 'ACUTE') || zones[0];
  if (!top) return null;
  const phase = top.phase as string;
  return (
    <div style={{ background: '#FFFBEB', borderTop: '1px solid #FDE68A', padding: '14px 18px 16px', animation: 'fadeUp .15s ease' }}>
      <div style={{ height: 8, borderRadius: 4, display: 'flex', overflow: 'hidden', marginBottom: 6 }}>
        {[{ flex: 18, color: '#DC2626', active: phase === 'ACUTE' }, { flex: 54, color: '#C66C3D', active: phase === 'ACTIVE' }, { flex: 96, color: '#B79145', active: phase === 'WATCH' }, { flex: 336, color: '#9CA3AF', active: false }]
          .map((seg, i) => <div key={i} style={{ flex: seg.flex, height: '100%', background: seg.color, opacity: seg.active ? 1 : 0.2 }} />)}
      </div>
      <div style={{ display: 'flex', fontSize: 9, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 10 }}>
        {[{ l: '▶ ACUTE', r: '0–72h', p: 'ACUTE', f: 18 }, { l: 'ACTIVE', r: '3–14d', p: 'ACTIVE', f: 54 }, { l: 'WATCH', r: '14–125d', p: 'WATCH', f: 96 }, { l: 'MONITOR', r: '125d+', p: '', f: 168 }]
          .map(s => <div key={s.l} style={{ flex: s.f }}><div style={{ color: s.p === phase ? '#D97706' : C.light }}>{s.l}</div><div style={{ color: C.light, opacity: .7, fontWeight: 400 }}>{s.r}</div></div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        {([
          ['Trigger', `Homicide · ${top.block || 'nearby'}`],
          ['Phase', `${phase} · ${Math.round(top.ageH)}h elapsed`],
          ['Retaliation window', top.retWin ? 'OPEN — peak risk now' : top.ageH < 18 ? `Opens in ${Math.round(18 - top.ageH)}h` : 'Closed'],
          ['Distance', top.distanceFromCampus != null ? `${top.distanceFromCampus.toFixed(2)} miles` : 'Near campus'],
          ['Days remaining', `${top.daysLeft} of 125`],
          ['Model', 'Papachristos et al., Yale'],
        ] as [string,string][]).map(([l, v]) => (
          <div key={l} style={{ padding: '5px 0', borderBottom: '1px solid #FDE68A', fontSize: 11.5 }}>
            <div style={{ color: '#92400E' }}>{l}</div>
            <div style={{ color: '#78350F', fontWeight: 500, marginTop: 1 }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11.5, color: '#78350F', lineHeight: 1.65, padding: '10px 14px', background: 'rgba(255,255,255,.6)', borderRadius: 8, marginTop: 10 }}>
        Violence spreads like a disease — Papachristos et al., Yale/UChicago. A homicide creates predictable retaliatory violence in the 18–72h window. 70% of Chicago shootings occur within social networks representing less than 6% of the population.
      </div>
    </div>
  );
};

// ─── MINI MAP ─────────────────────────────────────────────────────────────────

const MiniMap = ({ items, onOpen }: { items: LiveItem[]; onOpen: () => void }) => {
  const [hovered, setHovered] = useState(false);
  const angles = [315, 45, 225, 135, 270, 90];
  const pins = items.slice(0, 5).map((item, i) => {
    const angle = (angles[i] * Math.PI) / 180;
    const dist = Math.min(item.distMi / 1.0, 0.75) * 38;
    return { x: 50 + Math.cos(angle) * dist, y: 50 + Math.sin(angle) * dist, isViolent: item.isViolent };
  });
  return (
    <div style={{ width: '100%', height: 76, background: C.cream2, borderTop: `1px solid ${C.chalk}`, position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
      onClick={onOpen} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {[{h:true,p:30},{h:true,p:52},{h:true,p:73},{h:false,p:25},{h:false,p:50},{h:false,p:73}].map((r,i) => (
        <div key={i} style={{ position: 'absolute', ...(r.h ? { left: 0, right: 0, top: `${r.p}%`, height: 1 } : { top: 0, bottom: 0, left: `${r.p}%`, width: 1 }), background: 'rgba(255,255,255,.65)' }} />
      ))}
      <div style={{ position: 'absolute', left: '50%', top: '50%', width: 66, height: 66, borderRadius: '50%', border: '1px dashed rgba(0,0,0,.12)', transform: 'translate(-50%,-50%)', zIndex: 2 }} />
      <div style={{ position: 'absolute', left: '50%', top: '50%', width: 10, height: 10, borderRadius: '50%', background: C.deep, border: '2px solid #fff', transform: 'translate(-50%,-50%)', zIndex: 4 }} />
      {pins.map((pin, i) => <div key={i} style={{ position: 'absolute', left: `${pin.x}%`, top: `${pin.y}%`, width: 7, height: 7, borderRadius: '50%', background: pin.isViolent ? C.red : C.amber, border: '1.5px solid #fff', transform: 'translate(-50%,-50%)', zIndex: 3 }} />)}
      {hovered && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: C.mid, fontWeight: 500, zIndex: 5 }}>Open full map →</div>}
    </div>
  );
};

// ─── SCHOOL CARD ──────────────────────────────────────────────────────────────

const SchoolCard = ({ activity, onSelectCampus }: { activity: SchoolActivity; onSelectCampus: (id: number) => void }) => {
  const [expanded, setExpanded] = useState(true);
  const [openDetails, setOpenDetails] = useState<Set<string>>(new Set());
  const [openContagion, setOpenContagion] = useState(false);

  const toggleDetail = (id: string) => {
    setOpenDetails(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const violentCount = activity.items.filter(i => i.isViolent).length;
  const indColor = activity.inRetaliationWindow ? '#DC2626' : violentCount > 0 ? C.red : activity.hasIce ? C.ice : C.amber;
  const dangerZones = (activity.zones ?? []).filter(z => z.retWin || z.phase === 'ACUTE' || z.phase === 'ACTIVE');

  return (
    <div style={{ background: C.white, border: `1px solid ${C.chalk}`, borderRadius: 14, overflow: 'hidden', marginBottom: 10 }}>
      <div style={{ padding: '16px 18px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setExpanded(!expanded)}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1 }}>
          <div style={{ width: 3, borderRadius: 2, flexShrink: 0, marginTop: 3, background: indColor, height: expanded ? Math.max(28, activity.items.length * 8) : 28, transition: 'height .2s' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: C.deep, marginBottom: 3 }}>{activity.campusName}</div>
            <div style={{ fontSize: 11, color: C.light }}>
              {activity.communityArea}{activity.items.length > 0 ? ` · ${activity.items.length} incident${activity.items.length !== 1 ? 's' : ''} nearby` : ''}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
          {violentCount > 0 && <Badge label={`${violentCount} violent`} variant="red" />}
          {dangerZones.length > 0 && <Badge label={activity.inRetaliationWindow ? 'ret. window' : 'contagion'} variant="amber" />}
          {activity.hasIce && <Badge label="ICE" variant="purple" />}
          <span style={{ fontSize: 11, color: C.light, display: 'inline-block', transform: expanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .2s' }}>▾</span>
        </div>
      </div>

      {expanded && (
        <div style={{ animation: 'fadeUp .2s ease' }}>
          {activity.items.length > 0 && <MiniMap items={activity.items} onOpen={() => onSelectCampus(activity.campusId)} />}

          {activity.items.map(item => (
            <div key={item.id}>
              <div
                style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '11px 18px', borderTop: '1px solid #F7F6F3', cursor: 'pointer', background: item.isViolent ? '#FEFAFA' : C.white, ...(item.isViolent ? { borderLeft: `3px solid ${C.red}` } : {}) }}
                onClick={() => toggleDetail(item.id)}
                onMouseEnter={e => (e.currentTarget.style.background = item.isViolent ? '#FFF5F5' : '#FAFAF8')}
                onMouseLeave={e => (e.currentTarget.style.background = item.isViolent ? '#FEFAFA' : C.white)}
              >
                {getSourcePill(item.source)}
                {getTypePill(item.type)}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: C.deep, lineHeight: 1.4 }}>{item.title}</div>
                  {item.block && <div style={{ fontSize: 10.5, color: C.light, marginTop: 2 }}>{item.block}</div>}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, fontWeight: 600, color: C.deep }}>{item.distMi < 0.1 ? '<0.1' : item.distMi.toFixed(1)} mi</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.light, marginTop: 2 }}>{fmtAgo(item.tsMs)}</div>
                </div>
              </div>
              {openDetails.has(item.id) && <IncidentDetail item={item} />}
            </div>
          ))}

          {activity.items.length === 0 && activity.hasIce && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 18px', borderTop: '1px solid #F7F6F3' }}>
              <Pill label="Live" color="#065F46" bg="#ECFDF5" border="1px solid #A7F3D0" />
              <Pill label="ICE" color="#5B21B6" bg="#F5F3FF" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: C.deep }}>Immigration enforcement activity reported nearby</div>
                <div style={{ fontSize: 10.5, color: C.light, marginTop: 2 }}>Contact Network Legal · Lock exterior doors</div>
              </div>
            </div>
          )}

          {dangerZones.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', background: '#FFFCF0', borderTop: '1px solid #FDE68A', cursor: 'pointer' }}
                onClick={() => setOpenContagion(!openContagion)}
                onMouseEnter={e => (e.currentTarget.style.background = '#FFFBEB')}
                onMouseLeave={e => (e.currentTarget.style.background = '#FFFCF0')}
              >
                <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 3, background: '#FEF3C7', color: '#78350F', border: '1px solid #FDE68A', flexShrink: 0 }}>
                  {activity.inRetaliationWindow ? 'Retaliation window' : `Contagion · ${dangerZones.length} zone${dangerZones.length !== 1 ? 's' : ''}`}
                </span>
                <span style={{ fontSize: 11.5, color: '#78350F', flex: 1 }}>
                  {activity.inRetaliationWindow
                    ? `Peak risk window open — ${Math.round(dangerZones[0]?.ageH ?? 0)}h elapsed · retaliatory violence most likely now`
                    : `${dangerZones[0]?.phase} zone · ${Math.round(dangerZones[0]?.ageH ?? 0)}h elapsed · ${dangerZones[0]?.block || 'nearby'}`}
                </span>
                <span style={{ fontSize: 11, color: C.brass, flexShrink: 0, display: 'inline-block', transform: openContagion ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▾</span>
              </div>
              {openContagion && <ContagionDetail zones={dangerZones} />}
            </>
          )}

          <div style={{ padding: '9px 18px', background: C.cream, borderTop: `1px solid ${C.chalk}`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', cursor: 'pointer' }}
            onClick={() => onSelectCampus(activity.campusId)}
            onMouseEnter={e => (e.currentTarget.style.background = C.cream2)}
            onMouseLeave={e => (e.currentTarget.style.background = C.cream)}
          >
            <span style={{ fontSize: 11.5, color: C.mid, fontWeight: 500 }}>Open {activity.campusShort} campus view →</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── QUIET SECTION ────────────────────────────────────────────────────────────

const QuietSection = ({ quietIds, onSelectCampus }: { quietIds: number[]; onSelectCampus: (id: number) => void }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ background: C.white, border: `1px solid ${C.chalk}`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
        onMouseEnter={e => (e.currentTarget.style.background = '#FAFAF8')}
        onMouseLeave={e => (e.currentTarget.style.background = C.white)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <GreenDot />
          <div>
            <div style={{ fontSize: 14, color: C.mid }}>{quietIds.length} campus{quietIds.length !== 1 ? 'es' : ''} — quiet in the last 24 hours</div>
            <div style={{ fontSize: 11, color: C.light, marginTop: 2 }}>No incidents reported · Citizen + News + CPD Radio · all clear</div>
          </div>
        </div>
        <span style={{ fontSize: 11, color: C.light, display: 'inline-block', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▾</span>
      </div>
      {expanded && (
        <div style={{ animation: 'fadeUp .2s ease' }}>
          {quietIds.map(id => {
            const campus = CAMPUSES.find(c => c.id === id);
            if (!campus) return null;
            return (
              <div key={id} style={{ display: 'flex', alignItems: 'center', padding: '10px 18px', borderTop: '1px solid #F7F6F3', cursor: 'pointer', gap: 10 }}
                onClick={() => onSelectCampus(id)}
                onMouseEnter={e => (e.currentTarget.style.background = '#FAFAF8')}
                onMouseLeave={e => (e.currentTarget.style.background = C.white)}
              >
                <div style={{ width: 3, height: 28, borderRadius: 2, background: C.chalk, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: C.mid }}>{campus.name}</div>
                  <div style={{ fontSize: 10.5, color: C.light, marginTop: 1 }}>{campus.communityArea}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: C.green }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.green, display: 'inline-block' }} />Quiet
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── DATA SOURCES ─────────────────────────────────────────────────────────────

const DataSources = ({ scannerCalls, scannerSpikeZones, newsSourceCount, newsIncidentCount, cpdCount, iceAlerts, shotSpotterEvents }: {
  scannerCalls: number; scannerSpikeZones: number; newsSourceCount: number; newsIncidentCount: number;
  cpdCount: number; iceAlerts: IceAlert[]; shotSpotterEvents: ShotSpotterEvent[];
}) => {
  const [open, setOpen] = useState(false);
  const sources = [
    { badge: 'LIVE',     bg: C.green,  name: 'Citizen App',           desc: 'Near-real-time community reports · minutes fresh',                                                          fresh: 'Minutes fresh', stale: false },
    { badge: 'LIVE',     bg: C.brass,  name: 'CPD Radio (OpenMHz)',    desc: `${scannerCalls} calls monitored · ${scannerSpikeZones} spike zone${scannerSpikeZones !== 1 ? 's' : ''} · AI transcription`, fresh: 'Real-time',    stale: false },
    { badge: 'NEWS',     bg: '#7C3AED',name: '6 News Feeds',           desc: `Block Club · ABC7 · NBC5 · CBS · Sun-Times · WGN · Fox 32 · ${newsIncidentCount} incidents geocoded`,       fresh: 'Hours fresh',  stale: false },
    { badge: 'ICE',      bg: '#7C3AED',name: 'ICE Monitoring',         desc: `${iceAlerts.length} active alert${iceAlerts.length !== 1 ? 's' : ''} near our campuses`,                   fresh: 'Active',       stale: false },
    { badge: 'ACOUSTIC', bg: '#0D9488',name: 'ShotSpotter',            desc: shotSpotterEvents.length > 0 ? `${shotSpotterEvents.length} activations detected` : 'No activations in last 2 hours', fresh: 'Real-time', stale: false },
    { badge: 'LAGGED',   bg: C.light,  name: 'CPD Verified Crime Data',desc: `${cpdCount.toLocaleString()} incidents · contagion model only · never shown as live`,                     fresh: '7–8 day lag',  stale: true, warn: 'Not used in the live feed above — pattern data only' },
  ];
  return (
    <div style={{ padding: '0 28px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 18px', cursor: 'pointer', fontSize: 12, color: C.light, background: C.white, border: `1px solid ${C.chalk}`, borderRadius: open ? '14px 14px 0 0' : 14 }}
        onClick={() => setOpen(!open)}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#FAFAF8'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.white; }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><span>⊕</span><span>Data Sources & Freshness — 6 feeds active</span></span>
        <span style={{ display: 'inline-block', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▾</span>
      </div>
      {open && (
        <div style={{ background: C.white, border: `1px solid ${C.chalk}`, borderTop: 'none', borderRadius: '0 0 14px 14px', padding: '0 18px 16px', animation: 'fadeUp .2s ease' }}>
          {sources.map(s => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0', borderBottom: '1px solid #F7F6F3' }}>
              <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 3, color: '#fff', background: s.bg, flexShrink: 0, marginTop: 2, minWidth: 52, textAlign: 'center' }}>{s.badge}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: C.deep }}>{s.name}</div>
                <div style={{ fontSize: 11, color: C.light, marginTop: 1 }}>{s.desc}</div>
                {(s as any).warn && <div style={{ fontSize: 10, color: C.amber, marginTop: 1 }}>⚠ {(s as any).warn}</div>}
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: s.stale ? C.amber : C.green, marginTop: 2 }}>{s.stale ? '⚠' : '●'} {s.fresh}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function NetworkDashboard({
  risks, summary, forecast, iceAlerts, shotSpotterEvents, acuteIncidents,
  citizenIncidents = [], newsIncidents = [], dispatchIncidents = [],
  onSelectCampus,
  scannerCalls = 0, scannerSpikeZones = 0, newsSourceCount = 0,
  newsIncidentCount = 0, redditIncidentCount = 0, cpdCount = 0,
}: Props) {
  const [clock, setClock] = useState(fmtTime());
  const [secAgo, setSecAgo] = useState(0);

  useEffect(() => {
    const t = setInterval(() => { setClock(fmtTime()); setSecAgo(s => s + 1); }, 1000);
    return () => clearInterval(t);
  }, []);

  const updText = secAgo < 5 ? 'Updated just now · risk engine running'
    : secAgo < 60 ? `Updated ${secAgo}s ago · risk engine running`
    : `Updated ${Math.floor(secAgo / 60)}m ago · risk engine running`;

  const liveItems   = buildLiveFeed(citizenIncidents, newsIncidents, dispatchIncidents);
  const schoolActivity = buildSchoolActivity(liveItems, risks, iceAlerts);
  const activeIds   = new Set(schoolActivity.map(s => s.campusId));
  const quietIds    = CAMPUSES.filter(c => !activeIds.has(c.id)).map(c => c.id);
  const allZones    = risks.flatMap(r => r.contagionZones ?? []);

  const narrative = useNetworkNarrative(schoolActivity, allZones, iceAlerts, liveItems);

  return (
    <div style={{ background: C.cream, fontFamily: "'Inter', -apple-system, sans-serif", color: C.deep }}>
      <style>{GLOBAL_STYLES}</style>

      <LiveTicker liveItems={liveItems} zones={allZones} iceAlerts={iceAlerts} scannerCalls={scannerCalls} scannerSpikeZones={scannerSpikeZones} newsIncidentCount={newsIncidentCount} />

      <div style={{ padding: '20px 28px 16px', borderBottom: `1px solid ${C.chalk}`, background: C.white }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: C.light }}>
            <LiveDot color={C.watch} /><span>Veritas Charter Schools · Network Intelligence</span>
          </div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.light }}>{clock}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: C.light }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.green, display: 'inline-block' }} />
          <span>{updText}</span>
        </div>
      </div>

      <div style={{ padding: '24px 28px 0' }}>
        <NarrativeCard text={narrative.text} loading={narrative.loading} lastRefresh={narrative.lastRefresh} onRefresh={narrative.refresh} />
      </div>

      <div style={{ padding: '0 28px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: C.light }}>
            <LiveDot color={C.watch} /><span>Near our schools · last 24 hours</span>
          </div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.light }}>
            {schoolActivity.length > 0 ? `${schoolActivity.length} campus${schoolActivity.length !== 1 ? 'es' : ''} with activity` : 'all campuses'}
          </span>
        </div>

        <IceStrip alerts={iceAlerts} />

        {liveItems.length === 0 && iceAlerts.length === 0 ? (
          <div style={{ background: C.white, border: '1px solid #D1FAE5', borderLeft: '3px solid #16A34A', borderRadius: 12, padding: '20px 20px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
            <GreenDot />
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#15803D' }}>Quiet — no incidents reported near any campus in the last 24 hours.</div>
              <div style={{ fontSize: 12, color: '#166534', marginTop: 4 }}>Citizen App · CPD Radio · News feeds — all clear as of {clock}.</div>
            </div>
          </div>
        ) : (
          schoolActivity.map(activity => (
            <SchoolCard key={activity.campusId} activity={activity} onSelectCampus={onSelectCampus} />
          ))
        )}

        {quietIds.length > 0 && <QuietSection quietIds={quietIds} onSelectCampus={onSelectCampus} />}
      </div>

      <DataSources scannerCalls={scannerCalls} scannerSpikeZones={scannerSpikeZones} newsSourceCount={newsSourceCount} newsIncidentCount={newsIncidentCount} cpdCount={cpdCount} iceAlerts={iceAlerts} shotSpotterEvents={shotSpotterEvents} />

      <div style={{ textAlign: 'center', padding: '8px 28px 16px', fontSize: 10, color: C.light, lineHeight: 1.8, borderTop: `1px solid ${C.chalk}` }}>
        Slate Watch · Start with the Facts · Madden Education Advisory<br />
        Citizen App · CPD Radio (OpenMHz) · Block Club Chicago · ABC7 · NBC5 · CBS · Sun-Times · WGN · Fox 32<br />
        Contagion model: Papachristos et al., Yale/UChicago · risk engine updates every 90 seconds · CPD crime data 7–8 day publication lag — used for contagion modeling only
      </div>
    </div>
  );
}
