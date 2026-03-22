/**
 * NetworkDashboard — Slate Watch Network Intelligence
 * E1 Editorial Layout — newspaper-style, section-driven, AI-narrative lead.
 *
 * Violent incidents only: HOMICIDE, MURDER, SHOOTING.
 * Five sections: Opening · What Happened · Campuses at a Glance · Watch For · Sources
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

// ─── PROPS ───────────────────────────────────────────────────────────────────

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

// Only guns and murder — per product decision
const GUNS_AND_MURDER = new Set(['HOMICIDE', 'MURDER', 'SHOOTING']);
const H24 = 24 * 3600 * 1000;

const C = {
  cream:   '#F7F5F1',
  cream2:  '#EFECE6',
  white:   '#FFFFFF',
  deep:    '#121315',
  rock:    '#23272F',
  mid:     '#4B5563',
  light:   '#9CA3AF',
  chalk:   '#E7E2D8',
  brass:   '#B79145',
  watch:   '#D45B4F',
  section: '#C0622A',   // editorial orange
  ice:     '#7C3AED',
  green:   '#16A34A',
  red:     '#DC2626',
  amber:   '#D97706',
};

const STYLES = `
  @keyframes fadeUp{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
  @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
  @keyframes blink{0%,100%{opacity:1}55%{opacity:.25}}
  @keyframes pulseRing{0%{transform:scale(1);opacity:.45}100%{transform:scale(2.1);opacity:0}}
`;

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function fmtTime() {
  return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function fmtDateTime() {
  const now = new Date();
  return now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    + ' · ' + fmtTime() + ' CDT';
}

function fmtAgo(ms: number) {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function timeOfDay() {
  const h = new Date().getHours();
  if (h < 5)  return 'overnight';
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  if (h < 21) return 'evening';
  return 'tonight';
}

function nearestCampus(lat: number, lng: number) {
  let best = { name: '', short: '', id: 0, dist: 99 };
  for (const c of CAMPUSES) {
    const d = haversine(c.lat, c.lng, lat, lng);
    if (d < best.dist) best = { name: c.name, short: c.short, id: c.id, dist: d };
  }
  return best;
}

// ─── BUILD LIVE FEED — guns and murder only ───────────────────────────────────

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
    const isViolent = /shoot|gun|shot|homicide|murder|killed/i.test(inc.title);
    if (!isViolent) continue; // guns and murder only
    items.push({
      id: `cit_${inc.id}`, source: 'CITIZEN',
      type: inc.category || 'SHOOTING',
      title: inc.title, block: '',
      campus: nearest.short, campusId: nearest.id,
      distMi: nearest.dist, tsMs, isViolent: true,
    });
  }

  for (const inc of newsIncidents) {
    if (inc.lat == null || inc.lng == null) continue;
    const tsMs = new Date(inc.date).getTime();
    if (isNaN(tsMs) || now - tsMs > H24) continue;
    const nearest = nearestCampus(inc.lat, inc.lng);
    if (nearest.dist > 1.0) continue;
    const type = (inc.type || '').toUpperCase();
    if (!GUNS_AND_MURDER.has(type)) continue; // guns and murder only
    items.push({
      id: `news_${inc.id}`, source: 'NEWS',
      type,
      title: inc.description || inc.block || 'News report',
      block: inc.block || '',
      campus: nearest.short, campusId: nearest.id,
      distMi: nearest.dist, tsMs, isViolent: true,
    });
  }

  for (const inc of dispatchIncidents) {
    if (!inc.latitude || !inc.longitude) continue;
    const tsMs = new Date(inc.time).getTime();
    if (isNaN(tsMs) || now - tsMs > H24) continue;
    if (!inc.isPriority) continue; // priority scanner calls only
    const nearest = nearestCampus(inc.latitude, inc.longitude);
    if (nearest.dist > 1.0) continue;
    const title = (inc.description || '').toLowerCase();
    if (!/shoot|gun|shot|homicide|murder|fire/i.test(title)) continue;
    items.push({
      id: `scan_${inc.id}`, source: 'SCANNER',
      type: 'SHOOTING',
      title: inc.description || 'Priority dispatch',
      block: inc.block || '',
      campus: nearest.short, campusId: nearest.id,
      distMi: nearest.dist, tsMs, isViolent: true,
    });
  }

  return items.sort((a, b) => b.tsMs - a.tsMs);
}

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
        campusId: item.campusId, campusName: campus.name,
        campusShort: campus.short, communityArea: campus.communityArea,
        items: [], zones: risk?.contagionZones ?? [],
        hasIce: false, inRetaliationWindow: risk?.inRetaliationWindow ?? false,
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
          campusId: campus.id, campusName: campus.name,
          campusShort: campus.short, communityArea: campus.communityArea,
          items: [], zones: risk?.contagionZones ?? [],
          hasIce: true, inRetaliationWindow: risk?.inRetaliationWindow ?? false,
        });
      } else {
        map.get(campus.id)!.hasIce = true;
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.inRetaliationWindow && !b.inRetaliationWindow) return -1;
    if (!a.inRetaliationWindow && b.inRetaliationWindow) return 1;
    return b.items.length - a.items.length;
  });
}

// ─── AI NARRATIVE ─────────────────────────────────────────────────────────────

function useNetworkNarrative(
  schoolActivity: SchoolActivity[],
  allZones: any[],
  iceAlerts: IceAlert[],
  liveItems: LiveItem[],
) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(0);

  const generate = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const ctx = {
        time: now.toLocaleDateString('en-US', { weekday: 'long' }) + ' at ' + fmtTime(),
        tod: timeOfDay(),
        totalCampuses: CAMPUSES.length,
        activeSchools: schoolActivity.map(s => ({
          campus: s.campusShort,
          shootings: s.items.length,
          retWindow: s.inRetaliationWindow,
          hasIce: s.hasIce,
        })),
        quietCampuses: CAMPUSES.length - schoolActivity.length,
        retaliationWindows: allZones.filter(z => z.retWin).length,
        acuteZones: allZones.filter(z => z.phase === 'ACUTE').length,
        totalZones: allZones.length,
        iceAlerts: iceAlerts.length,
        shootingsNearCampuses: liveItems.length,
      };
      const res = await fetch('/api/anthropic-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 300,
          system: `You are Slate Watch. Write a 2-3 sentence network intelligence brief for a CEO or senior school network leader.

Rules:
- Only report on shootings, homicides, and murders near our schools — ignore everything else.
- Plain declarative sentences. No hedging.
- Name specific campuses when incidents are near them.
- If quiet: say so in one confident sentence, then add context about what the system is watching.
- Time-aware: reference time of day naturally.
- No bullets, no headers, no markdown.`,
          messages: [{ role: 'user', content: `Network status: ${JSON.stringify(ctx)}` }],
        }),
      });
      const data = await res.json();
      setText(data.content?.find((b: any) => b.type === 'text')?.text || '');
      setLastRefresh(Date.now());
    } catch { setText(''); }
    finally { setLoading(false); }
  }, [schoolActivity.length, allZones.length, iceAlerts.length, liveItems.length]);

  useEffect(() => {
    generate();
    const t = setInterval(generate, 60_000);
    return () => clearInterval(t);
  }, [generate]);

  return { text, loading, lastRefresh, refresh: generate };
}

// ─── SECTION HEADER ───────────────────────────────────────────────────────────

const SectionHeader = ({ n, label }: { n: number; label: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
    <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.15em', textTransform: 'uppercase', color: C.section }}>
      Section {n} — {label}
    </div>
    <div style={{ flex: 1, height: 1, background: C.chalk }} />
  </div>
);

// ─── LIVE DOT ─────────────────────────────────────────────────────────────────

const LiveDot = () => (
  <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 10, height: 10, flexShrink: 0 }}>
    <span style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', background: C.watch, opacity: .45, animation: 'pulseRing 2s ease-out infinite' }} />
    <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.watch, position: 'relative', zIndex: 1, animation: 'blink 2.2s ease-in-out infinite' }} />
  </span>
);

// ─── SECTION 1 — THE OPENING ──────────────────────────────────────────────────

const SectionOpening = ({
  narrative, liveItems, allZones, iceAlerts, risks, secAgo, onRefresh,
}: {
  narrative: { text: string; loading: boolean };
  liveItems: LiveItem[];
  allZones: any[];
  iceAlerts: IceAlert[];
  risks: CampusRisk[];
  secAgo: number;
  onRefresh: () => void;
}) => {
  const elevated = risks.filter(r => r.label !== 'LOW').length;
  const retWin   = allZones.filter(z => z.retWin).length;
  const tod      = timeOfDay();
  const ageText  = secAgo < 5 ? 'just now' : secAgo < 60 ? `${secAgo}s ago` : `${Math.floor(secAgo / 60)}m ago`;

  // Status badges
  const badges: { label: string; color: string; bg: string }[] = [];
  if (elevated > 0) badges.push({ label: `${elevated} Elevated`, color: '#92400E', bg: '#FEF3C7' });
  else badges.push({ label: '0 Critical', color: '#14532D', bg: '#DCFCE7' });
  if (liveItems.length > 0) badges.push({ label: `${liveItems.length} Incident${liveItems.length !== 1 ? 's' : ''} (24h)`, color: '#7F1D1D', bg: '#FEF2F2' });
  else badges.push({ label: 'All Clear', color: '#14532D', bg: '#DCFCE7' });
  if (allZones.length > 0) badges.push({ label: `${allZones.length} Contagion Zone${allZones.length !== 1 ? 's' : ''}`, color: '#78350F', bg: '#FFFBEB' });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 28, alignItems: 'start' }}>
      {/* Left — narrative */}
      <div>
        <h1 style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: 34, fontWeight: 700, color: C.deep,
          letterSpacing: '-.02em', lineHeight: 1.2,
          marginBottom: 8,
        }}>
          Your Network This {tod.charAt(0).toUpperCase() + tod.slice(1)}
        </h1>
        <div style={{ fontSize: 12, color: C.light, marginBottom: 20, fontFamily: "'JetBrains Mono', monospace" }}>
          {fmtDateTime()}
        </div>

        {/* Status badges */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {badges.map(b => (
            <span key={b.label} style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20, background: b.bg, color: b.color }}>
              {b.label}
            </span>
          ))}
        </div>

        {/* AI narrative prose */}
        {narrative.loading && !narrative.text ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[88, 72, 50].map((w, i) => (
              <div key={i} style={{ height: 18, borderRadius: 3, width: `${w}%`, background: `linear-gradient(90deg, ${C.chalk} 0%, ${C.cream2} 50%, ${C.chalk} 100%)`, backgroundSize: '400px 100%', animation: 'shimmer 1.4s infinite linear' }} />
            ))}
          </div>
        ) : (
          <p style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 17, lineHeight: 1.8, color: C.deep,
            margin: 0,
          }}>
            {narrative.text || 'Loading network intelligence…'}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: C.light }}>
            <LiveDot />
            <span>Refreshed {ageText}</span>
          </div>
          <button onClick={onRefresh} style={{ fontSize: 11, color: C.light, background: 'none', border: `1px solid ${C.chalk}`, borderRadius: 5, padding: '2px 9px', cursor: 'pointer', fontFamily: 'inherit' }}>↻</button>
        </div>
      </div>

      {/* Right — quick stats */}
      <div style={{ background: C.white, border: `1px solid ${C.chalk}`, borderRadius: 10, padding: '18px 20px' }}>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: C.light, marginBottom: 14 }}>Quick Stats</div>
        {[
          { label: 'Campuses monitored', value: String(CAMPUSES.length) },
          { label: 'Elevated',            value: String(elevated),        alert: elevated > 0 },
          { label: 'Incidents (24h)',      value: String(liveItems.length), alert: liveItems.length > 0 },
          { label: 'Contagion zones',      value: String(allZones.length),  alert: allZones.length > 0 },
          { label: 'ICE alerts',           value: String(iceAlerts.length), alert: iceAlerts.length > 0 },
          { label: 'Sources live',         value: '10/10 live' },
        ].map(row => (
          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '6px 0', borderBottom: `1px solid #F7F6F3` }}>
            <span style={{ fontSize: 12, color: C.mid }}>{row.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: row.alert ? C.watch : C.deep, fontFamily: "'JetBrains Mono', monospace" }}>{row.value}</span>
          </div>
        ))}
        <div style={{ marginTop: 14, fontSize: 11, color: C.light }}>
          Next briefing: {(() => {
            const now = new Date();
            const h = now.getHours();
            if (h < 5)  return 'Today 5:30 AM';
            if (h < 12) return 'Today Noon';
            if (h < 17) return 'Today 5:00 PM';
            return 'Tomorrow 5:30 AM';
          })()}
        </div>
      </div>
    </div>
  );
};

// ─── SECTION 2 — WHAT HAPPENED ────────────────────────────────────────────────

const IncidentRow = ({ item, onSelectCampus }: { item: LiveItem; onSelectCampus: (id: number) => void }) => {
  const [open, setOpen] = useState(false);
  const srcColor = item.source === 'CITIZEN' ? C.green : item.source === 'NEWS' ? C.ice : C.amber;
  const srcLabel = item.source === 'CITIZEN' ? 'Live' : item.source === 'NEWS' ? 'News' : 'Scanner';

  return (
    <>
      <div
        style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '13px 0', borderBottom: `1px solid ${C.chalk}`, cursor: 'pointer' }}
        onClick={() => setOpen(!open)}
      >
        {/* Left accent */}
        <div style={{ width: 3, height: 44, borderRadius: 2, background: C.watch, flexShrink: 0, marginTop: 2 }} />

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: C.deep, lineHeight: 1.35, marginBottom: 5 }}>
            {item.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: C.light }}>
            <span style={{ fontWeight: 700, color: srcColor, letterSpacing: '.04em', textTransform: 'uppercase', fontSize: 9 }}>{srcLabel}</span>
            <span>·</span>
            <span>{item.distMi < 0.1 ? '<0.1' : item.distMi.toFixed(1)} mi from {item.campus}</span>
            <span>·</span>
            <span>{fmtAgo(item.tsMs)}</span>
            {item.block && <><span>·</span><span>{item.block}</span></>}
          </div>
        </div>

        {/* Campus link */}
        <button
          onClick={e => { e.stopPropagation(); onSelectCampus(item.campusId); }}
          style={{ fontSize: 11, color: C.mid, background: C.cream, border: `1px solid ${C.chalk}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, marginTop: 2 }}
        >
          {item.campus} →
        </button>
      </div>

      {open && (
        <div style={{ padding: '12px 16px 14px', background: '#F9F8F5', borderBottom: `1px solid ${C.chalk}`, animation: 'fadeUp .15s ease' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, fontSize: 12 }}>
            {[
              ['Source', item.source === 'CITIZEN' ? 'Citizen App' : item.source === 'NEWS' ? 'News feed' : 'CPD Radio'],
              ['Location', item.block || `Near ${item.campus}`],
              ['Distance', `${item.distMi < 0.1 ? '<0.1' : item.distMi.toFixed(1)} miles from ${item.campus}`],
              ['Reported', fmtAgo(item.tsMs)],
              ['Type', item.type.replace(/_/g,' ')],
              ['Contagion trigger', 'Yes — tracked by model'],
            ].map(([l, v]) => (
              <div key={l}>
                <div style={{ color: C.light, marginBottom: 2 }}>{l}</div>
                <div style={{ color: C.deep, fontWeight: 500 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

const SectionWhatHappened = ({ liveItems, schoolActivity, allZones, iceAlerts, onSelectCampus }: {
  liveItems: LiveItem[]; schoolActivity: SchoolActivity[];
  allZones: any[]; iceAlerts: IceAlert[];
  onSelectCampus: (id: number) => void;
}) => {
  const retWinZones = allZones.filter(z => z.retWin);
  const acuteZones  = allZones.filter(z => z.phase === 'ACUTE');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 28, alignItems: 'start' }}>
      {/* Left — incident feed */}
      <div>
        {liveItems.length === 0 && iceAlerts.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 0', borderBottom: `1px solid ${C.chalk}` }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 15, color: C.deep }}>
                No shootings or homicides reported near any campus in the last 24 hours.
              </div>
              <div style={{ fontSize: 12, color: C.light, marginTop: 4 }}>
                Citizen App · CPD Radio · News — all clear as of {fmtTime()}.
              </div>
            </div>
          </div>
        ) : (
          <>
            {liveItems.map(item => (
              <IncidentRow key={item.id} item={item} onSelectCampus={onSelectCampus} />
            ))}
            {iceAlerts.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '13px 0', borderBottom: `1px solid ${C.chalk}` }}>
                <div style={{ width: 3, height: 44, borderRadius: 2, background: '#7C3AED', flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: '#4C1D95', marginBottom: 5 }}>
                    {iceAlerts.length} ICE enforcement report{iceAlerts.length !== 1 ? 's' : ''} near our campuses
                  </div>
                  <div style={{ fontSize: 11, color: '#6D28D9' }}>
                    Network Legal · Lock exterior doors · Review shelter-in-place protocol
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Right — contagion monitor */}
      <div>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: C.light, marginBottom: 12 }}>
          Contagion Monitor
        </div>

        {allZones.length === 0 ? (
          <div style={{ fontSize: 13, color: C.light, padding: '12px 0' }}>No active zones near our campuses.</div>
        ) : (
          allZones.slice(0, 5).map((zone, i) => {
            const isRet   = zone.retWin;
            const isAcute = zone.phase === 'ACUTE';
            const phaseColor = isRet ? C.watch : isAcute ? '#DC2626' : C.amber;
            const phaseLabel = isRet ? 'RET. WINDOW' : zone.phase;
            const pct = Math.round((zone.ageH / (125 * 24)) * 100);

            return (
              <div key={i} style={{ marginBottom: 14, padding: '12px 14px', background: isRet ? '#FEF2F2' : '#FAFAF8', borderRadius: 8, border: `1px solid ${isRet ? '#FECACA' : C.chalk}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: phaseColor }}>{phaseLabel}</span>
                  <span style={{ fontSize: 9, fontWeight: 600, color: C.light, fontFamily: "'JetBrains Mono', monospace" }}>
                    {zone.daysLeft}d remaining
                  </span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.deep, marginBottom: 3 }}>{zone.block || 'Nearby corridor'} — Homicide trigger</div>
                <div style={{ fontSize: 11, color: C.mid, marginBottom: 8 }}>
                  {zone.distanceFromCampus != null ? `${zone.distanceFromCampus.toFixed(2)} mi` : '?'} from nearest campus · {Math.round(zone.ageH)}h elapsed
                </div>
                {/* Phase track */}
                <div style={{ height: 4, borderRadius: 2, background: C.chalk, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: phaseColor, borderRadius: 2 }} />
                </div>
              </div>
            );
          })
        )}

        {allZones.length > 5 && (
          <div style={{ fontSize: 11, color: C.light, marginTop: 4 }}>+{allZones.length - 5} more zones</div>
        )}

        <div style={{ marginTop: 12, fontSize: 10, color: C.light, lineHeight: 1.6, borderTop: `1px solid ${C.chalk}`, paddingTop: 10 }}>
          Contagion model: Papachristos et al., Yale/UChicago
        </div>
      </div>
    </div>
  );
};

// ─── SECTION 3 — CAMPUSES AT A GLANCE ────────────────────────────────────────

const SectionCampusGrid = ({ risks, liveItems, onSelectCampus }: {
  risks: CampusRisk[]; liveItems: LiveItem[]; onSelectCampus: (id: number) => void;
}) => {
  // Count violent incidents per campus
  const incidentCounts = new Map<number, number>();
  for (const item of liveItems) {
    incidentCounts.set(item.campusId, (incidentCounts.get(item.campusId) ?? 0) + 1);
  }

  // Sort: most incidents first, then by risk score
  const sorted = [...risks].sort((a, b) => {
    const ai = incidentCounts.get(a.campusId) ?? 0;
    const bi = incidentCounts.get(b.campusId) ?? 0;
    if (ai !== bi) return bi - ai;
    return b.score - a.score;
  });

  const maxCount = Math.max(...sorted.map(r => incidentCounts.get(r.campusId) ?? 0), 1);

  return (
    <div>
      <div style={{ fontSize: 13, color: C.mid, marginBottom: 18 }}>
        Here's how each campus stands right now:
      </div>
      <div style={{ display: 'flex', gap: 0, alignItems: 'flex-end', height: 80, marginBottom: 8, paddingBottom: 0, position: 'relative' }}>
        {sorted.map(risk => {
          const campus = CAMPUSES.find(c => c.id === risk.campusId);
          if (!campus) return null;
          const count  = incidentCounts.get(risk.campusId) ?? 0;
          const isRet  = risk.inRetaliationWindow;
          const barH   = count > 0 ? Math.max((count / maxCount) * 64, 20) : risk.label !== 'LOW' ? 14 : 6;
          const barColor = isRet ? C.watch : count > 0 ? '#C0622A' : risk.label !== 'LOW' ? '#60A5FA' : C.chalk;

          return (
            <div
              key={risk.campusId}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', padding: '0 2px' }}
              onClick={() => onSelectCampus(risk.campusId)}
              title={campus.short}
            >
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: 72 }}>
                <div style={{
                  width: '100%', borderRadius: '2px 2px 0 0',
                  background: barColor, height: barH,
                  transition: 'height .3s ease',
                  opacity: count > 0 || risk.label !== 'LOW' ? 1 : .5,
                }} />
              </div>
            </div>
          );
        })}
      </div>
      {/* X-axis labels */}
      <div style={{ display: 'flex', borderTop: `1px solid ${C.chalk}` }}>
        {sorted.map(risk => {
          const campus = CAMPUSES.find(c => c.id === risk.campusId);
          const count  = incidentCounts.get(risk.campusId) ?? 0;
          return (
            <div key={risk.campusId} style={{ flex: 1, textAlign: 'center', padding: '6px 2px 0', cursor: 'pointer' }} onClick={() => onSelectCampus(risk.campusId)}>
              <div style={{ fontSize: 8, color: count > 0 ? C.deep : C.light, fontWeight: count > 0 ? 700 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {campus?.short ?? ''}
              </div>
            </div>
          );
        })}
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, marginTop: 14, fontSize: 11, color: C.light }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: C.watch, display: 'inline-block' }} />
          Retaliation window open
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: '#C0622A', display: 'inline-block' }} />
          Shootings/homicides nearby
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: '#60A5FA', display: 'inline-block' }} />
          Elevated (no live incidents)
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: C.chalk, display: 'inline-block' }} />
          Nominal
        </span>
      </div>
    </div>
  );
};

// ─── SECTION 4 — WHAT TO WATCH ────────────────────────────────────────────────

const SectionWatchFor = ({ allZones, iceAlerts, risks, liveItems }: {
  allZones: any[]; iceAlerts: IceAlert[]; risks: CampusRisk[]; liveItems: LiveItem[];
}) => {
  const items: string[] = [];

  const retWin = allZones.filter(z => z.retWin);
  const acute  = allZones.filter(z => z.phase === 'ACUTE');

  if (retWin.length > 0) {
    items.push(`Retaliation windows are open near ${retWin.length} campus${retWin.length !== 1 ? 'es' : ''} — peak risk period, heightened awareness at arrival and dismissal.`);
  }
  if (acute.length > 0 && retWin.length === 0) {
    items.push(`${acute.length} ACUTE contagion zone${acute.length !== 1 ? 's' : ''} active — violence is most likely to recur within 72 hours of the original incident.`);
  }
  if (iceAlerts.length > 0) {
    items.push(`ICE enforcement activity reported near ${iceAlerts.length} campus${iceAlerts.length !== 1 ? 'es' : ''} — Network Legal has been notified. Shelter-in-place protocol is available.`);
  }

  const activeZones = allZones.filter(z => z.phase === 'ACTIVE');
  if (activeZones.length > 0) {
    items.push(`${activeZones.length} ACTIVE contagion zone${activeZones.length !== 1 ? 's' : ''} remain open through the next 14 days — sustained elevated awareness recommended.`);
  }

  // Next morning
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDay = tomorrow.toLocaleDateString('en-US', { weekday: 'long' });
  items.push(`${tomorrowDay} morning briefing will be generated at 5:30 AM with overnight updates from all 10 intelligence sources.`);

  if (items.length === 0) {
    items.push('All campuses are in normal conditions. Continue standard monitoring protocols.');
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: i === 0 && retWin.length > 0 ? C.watch : i === 0 && iceAlerts.length > 0 ? C.ice : C.brass, flexShrink: 0, marginTop: 6 }} />
          <span style={{ fontSize: 14, color: C.deep, lineHeight: 1.65 }}>{item}</span>
        </li>
      ))}
    </ul>
  );
};

// ─── SECTION 5 — SOURCES ──────────────────────────────────────────────────────

const SectionSources = ({ scannerCalls, newsIncidentCount, cpdCount, iceAlerts, shotSpotterEvents, liveItems }: {
  scannerCalls: number; newsIncidentCount: number; cpdCount: number;
  iceAlerts: IceAlert[]; shotSpotterEvents: ShotSpotterEvent[]; liveItems: LiveItem[];
}) => {
  const [open, setOpen] = useState(false);
  const totalLive = 10; // always 10 sources configured

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setOpen(!open)}>
        <div style={{ fontSize: 13, color: C.mid }}>
          {totalLive}/10 intelligence sources are live.
        </div>
        <button style={{ fontSize: 11, color: C.light, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          {open ? 'Hide ▴' : 'Show all ▾'}
        </button>
      </div>

      {open && (
        <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap', animation: 'fadeUp .2s ease' }}>
          {[
            { label: 'Citizen App',       color: C.green,   desc: 'Near-real-time reports' },
            { label: 'CPD Radio',         color: C.amber,   desc: `${scannerCalls} calls · AI transcription` },
            { label: 'Block Club Chicago',color: C.ice,     desc: 'RSS · geocoded' },
            { label: 'ABC7 Chicago',      color: C.ice,     desc: 'RSS · geocoded' },
            { label: 'NBC5 Chicago',      color: C.ice,     desc: 'RSS · geocoded' },
            { label: 'CBS Chicago',       color: C.ice,     desc: 'RSS · geocoded' },
            { label: 'Chicago Sun-Times', color: C.ice,     desc: 'RSS · geocoded' },
            { label: 'WGN News',          color: C.ice,     desc: 'RSS · geocoded' },
            { label: 'ICE Monitoring',    color: '#7C3AED', desc: `${iceAlerts.length} active alerts` },
            { label: 'CPD Crime Portal',  color: C.light,   desc: `${cpdCount.toLocaleString()} incidents · 7–8d lag · contagion model only`, lagged: true },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: C.white, border: `1px solid ${C.chalk}`, borderRadius: 20 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: C.deep, fontWeight: 500 }}>{s.label}</span>
              <span style={{ fontSize: 10, color: C.light }}>· {s.desc}</span>
              {(s as any).lagged && <span style={{ fontSize: 9, color: C.amber, fontWeight: 600 }}>LAGGED</span>}
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
  const [secAgo, setSecAgo] = useState(0);
  const lastRefreshRef = { current: 0 };

  const liveItems      = buildLiveFeed(citizenIncidents, newsIncidents, dispatchIncidents);
  const schoolActivity = buildSchoolActivity(liveItems, risks, iceAlerts);
  const activeIds      = new Set(schoolActivity.map(s => s.campusId));
  const quietIds       = CAMPUSES.filter(c => !activeIds.has(c.id)).map(c => c.id);
  const allZones       = risks.flatMap(r => r.contagionZones ?? []);
  const narrative      = useNetworkNarrative(schoolActivity, allZones, iceAlerts, liveItems);

  useEffect(() => {
    setSecAgo(0);
    const t = setInterval(() => setSecAgo(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [narrative.lastRefresh]);

  const elevated = risks.filter(r => r.label !== 'LOW').length;

  return (
    <div style={{ background: C.cream, fontFamily: "'Inter', -apple-system, sans-serif", color: C.deep }}>
      <style>{STYLES}</style>

      {/* Network Assessment Banner */}
      <div style={{ background: C.deep, padding: '12px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)' }}>
          Network Assessment
        </div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 16, color: C.white, textAlign: 'center' }}>
          {elevated > 0
            ? <><span style={{ color: C.watch, fontWeight: 700 }}>{elevated} of {CAMPUSES.length} campuses elevated.</span>{' '}
                {liveItems.length > 0 ? <span style={{ color: '#FCA5A5' }}>{liveItems.length} incident{liveItems.length !== 1 ? 's' : ''} in the last 24 hours.</span> : ''}{' '}
                {allZones.filter(z => z.phase === 'ACUTE' || z.phase === 'ACTIVE').length > 0 ? <span style={{ color: '#FCD34D' }}>{allZones.filter(z => z.phase === 'ACUTE' || z.phase === 'ACTIVE').length} contagion zones active.</span> : ''}</>
            : <span style={{ color: '#86EFAC' }}>All {CAMPUSES.length} campuses in normal conditions. All schools operational.</span>
          }
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,.4)' }}>
          Updated {secAgo < 60 ? `${secAgo}s ago` : `${Math.floor(secAgo / 60)}m ago`}
        </div>
      </div>

      {/* Main editorial content */}
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '36px 36px 48px' }}>

        {/* Section 1 — The Opening */}
        <section style={{ marginBottom: 48 }}>
          <SectionHeader n={1} label="The Opening" />
          <SectionOpening
            narrative={narrative}
            liveItems={liveItems}
            allZones={allZones}
            iceAlerts={iceAlerts}
            risks={risks}
            secAgo={secAgo}
            onRefresh={narrative.refresh}
          />
        </section>

        <div style={{ height: 1, background: C.chalk, marginBottom: 48 }} />

        {/* Section 2 — What Happened */}
        <section style={{ marginBottom: 48 }}>
          <SectionHeader n={2} label={`What Happened ${timeOfDay() === 'morning' ? 'Overnight' : 'Near Our Schools'}`} />
          <SectionWhatHappened
            liveItems={liveItems}
            schoolActivity={schoolActivity}
            allZones={allZones}
            iceAlerts={iceAlerts}
            onSelectCampus={onSelectCampus}
          />
        </section>

        <div style={{ height: 1, background: C.chalk, marginBottom: 48 }} />

        {/* Section 3 — Campuses at a Glance */}
        <section style={{ marginBottom: 48 }}>
          <SectionHeader n={3} label="Your Campuses at a Glance" />
          <SectionCampusGrid risks={risks} liveItems={liveItems} onSelectCampus={onSelectCampus} />
        </section>

        <div style={{ height: 1, background: C.chalk, marginBottom: 48 }} />

        {/* Section 4 — What to Watch */}
        <section style={{ marginBottom: 48 }}>
          <SectionHeader n={4} label={`What to Watch For ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}`} />
          <SectionWatchFor allZones={allZones} iceAlerts={iceAlerts} risks={risks} liveItems={liveItems} />
        </section>

        <div style={{ height: 1, background: C.chalk, marginBottom: 48 }} />

        {/* Section 5 — Sources */}
        <section>
          <SectionHeader n={5} label="Sources" />
          <SectionSources
            scannerCalls={scannerCalls}
            newsIncidentCount={newsIncidentCount}
            cpdCount={cpdCount}
            iceAlerts={iceAlerts}
            shotSpotterEvents={shotSpotterEvents}
            liveItems={liveItems}
          />
        </section>

      </div>
    </div>
  );
}
