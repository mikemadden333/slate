/**
 * NetworkDashboard — Slate Watch · Concept E "The Living Document"
 *
 * A flowing narrative intelligence document that Watch AI writes and updates
 * in real-time. The dashboard reads like a premium newsletter — not a control panel.
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

const GUNS_AND_MURDER = new Set(['HOMICIDE', 'MURDER', 'SHOOTING']);
const H24 = 24 * 3600 * 1000;

const C = {
  cream:   '#FAF8F5',
  cream2:  '#F3F0EA',
  white:   '#FFFFFF',
  deep:    '#1A1A1A',
  rock:    '#2D2D2D',
  mid:     '#6B7280',
  light:   '#9CA3AF',
  chalk:   '#E5E1D8',
  brass:   '#B79145',
  watch:   '#C0392B',
  section: '#C0392B',
  ice:     '#7C3AED',
  green:   '#16A34A',
  red:     '#DC2626',
  amber:   '#D97706',
};

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
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
    if (!isViolent) continue;
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
    if (!GUNS_AND_MURDER.has(type)) continue;
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
    if (!inc.isPriority) continue;
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
      setText(data?.content?.[0]?.text ?? '');
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

// ─── TYPOGRAPHY ──────────────────────────────────────────────────────────────

const serif = "Playfair Display, Georgia, 'Times New Roman', serif";
const sans  = "Inter, -apple-system, BlinkMacSystemFont, sans-serif";
const mono  = "JetBrains Mono, 'SF Mono', Menlo, monospace";

// ─── SECTION DIVIDER ─────────────────────────────────────────────────────────

const SectionLabel = ({ label }: { label: string }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '.18em',
      textTransform: 'uppercase', color: C.section, fontFamily: sans,
      marginBottom: 8,
    }}>
      {label}
    </div>
    <div style={{ height: 1, background: C.chalk }} />
  </div>
);

// ─── LIVE DOT ─────────────────────────────────────────────────────────────────

const LiveDot = () => (
  <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 8, height: 8, flexShrink: 0 }}>
    <span style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', background: C.green, opacity: .45, animation: 'pulseRing 2s ease-out infinite' }} />
    <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.green, position: 'relative', zIndex: 1 }} />
  </span>
);

// ─── SECTION 1 — THE OPENING ─────────────────────────────────────────────────

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
  const tod = timeOfDay();

  return (
    <div style={{ position: 'relative' }}>
      {/* Headline */}
      <h1 style={{
        fontFamily: serif,
        fontSize: 42, fontWeight: 900, color: C.deep,
        letterSpacing: '-.03em', lineHeight: 1.15,
        margin: '0 0 12px 0',
      }}>
        Your Network This {tod.charAt(0).toUpperCase() + tod.slice(1)}
      </h1>

      {/* Dateline */}
      <div style={{
        fontFamily: mono, fontSize: 12, color: C.light,
        marginBottom: 28, letterSpacing: '.02em',
      }}>
        {fmtDateTime()}
      </div>

      {/* Narrative prose */}
      {narrative.loading && !narrative.text ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[92, 78, 55].map((w, i) => (
            <div key={i} style={{
              height: 20, borderRadius: 4, width: `${w}%`,
              background: `linear-gradient(90deg, ${C.chalk} 0%, ${C.cream2} 50%, ${C.chalk} 100%)`,
              backgroundSize: '400px 100%', animation: 'shimmer 1.4s infinite linear',
            }} />
          ))}
        </div>
      ) : (
        <p style={{
          fontFamily: serif,
          fontSize: 19, lineHeight: 1.85, color: C.deep,
          margin: '0 0 20px 0', maxWidth: 640,
        }}>
          {narrative.text || 'Loading network intelligence…'}
        </p>
      )}

      {/* Status badges — inline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        {elevated > 0 ? (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '5px 14px', borderRadius: 20,
            background: '#FEF3C7', color: '#92400E', fontFamily: sans,
          }}>
            {elevated} ELEVATED
          </span>
        ) : (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '5px 14px', borderRadius: 20,
            background: '#DCFCE7', color: '#14532D', fontFamily: sans,
          }}>
            ALL CLEAR
          </span>
        )}
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '5px 14px', borderRadius: 20,
          background: C.white, color: C.mid, border: `1px solid ${C.chalk}`, fontFamily: sans,
        }}>
          {liveItems.length} incident{liveItems.length !== 1 ? 's' : ''} (24h)
        </span>
        {allZones.length > 0 && (
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '5px 14px', borderRadius: 20,
            background: C.white, color: C.mid, border: `1px solid ${C.chalk}`, fontFamily: sans,
          }}>
            {allZones.length} contagion zone{allZones.length !== 1 ? 's' : ''}
          </span>
        )}
        {iceAlerts.length > 0 && (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '5px 14px', borderRadius: 20,
            background: '#EDE9FE', color: '#5B21B6', fontFamily: sans,
          }}>
            {iceAlerts.length} ICE alert{iceAlerts.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Refresh indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <LiveDot />
        <span style={{ fontSize: 11, color: C.light, fontFamily: mono }}>
          Refreshed {secAgo < 5 ? 'just now' : secAgo < 60 ? `${secAgo}s ago` : `${Math.floor(secAgo / 60)}m ago`}
        </span>
        <button
          onClick={onRefresh}
          style={{
            fontSize: 11, color: C.light, background: 'none',
            border: `1px solid ${C.chalk}`, borderRadius: 4,
            padding: '2px 8px', cursor: 'pointer', fontFamily: mono,
          }}
        >
          ↻
        </button>
      </div>
    </div>
  );
};

// ─── SECTION 2 — WHAT HAPPENED ───────────────────────────────────────────────

const SectionWhatHappened = ({
  liveItems, schoolActivity, allZones, iceAlerts, onSelectCampus,
}: {
  liveItems: LiveItem[]; schoolActivity: SchoolActivity[];
  allZones: any[]; iceAlerts: IceAlert[];
  onSelectCampus: (id: number) => void;
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (liveItems.length === 0 && iceAlerts.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '8px 0' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.green, flexShrink: 0, marginTop: 8 }} />
        <div>
          <p style={{ fontFamily: serif, fontSize: 17, lineHeight: 1.8, color: C.deep, margin: 0 }}>
            No shootings or homicides reported near any campus in the last 24 hours.
            All intelligence sources — Citizen App, CPD Radio, and nine news feeds — are clear as of {fmtTime()}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 36, alignItems: 'start' }}>
      {/* Left — narrative incident list */}
      <div>
        {/* Prose intro */}
        <p style={{ fontFamily: serif, fontSize: 17, lineHeight: 1.8, color: C.deep, margin: '0 0 24px 0' }}>
          {liveItems.length === 1
            ? 'One incident was reported near our campuses in the last 24 hours:'
            : `${liveItems.length} incidents were reported near our campuses in the last 24 hours:`
          }
        </p>

        {/* Incident cards */}
        {liveItems.map(item => {
          const isOpen = expandedId === item.id;
          const srcLabel = item.source === 'CITIZEN' ? 'Citizen' : item.source === 'NEWS' ? 'News' : 'Scanner';
          const srcColor = item.source === 'CITIZEN' ? C.green : item.source === 'NEWS' ? C.ice : C.amber;

          return (
            <div key={item.id} style={{ marginBottom: 4 }}>
              <div
                onClick={() => setExpandedId(isOpen ? null : item.id)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                  padding: '16px 0', borderBottom: `1px solid ${C.chalk}`,
                  cursor: 'pointer',
                }}
              >
                {/* Red accent bar */}
                <div style={{
                  width: 3, minHeight: 44, borderRadius: 2,
                  background: C.watch, flexShrink: 0, marginTop: 2,
                }} />

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: sans, fontSize: 15, fontWeight: 600,
                    color: C.deep, lineHeight: 1.4, marginBottom: 6,
                  }}>
                    {item.title}
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 11, color: C.light, fontFamily: sans, flexWrap: 'wrap',
                  }}>
                    <span style={{
                      fontWeight: 700, color: srcColor, letterSpacing: '.05em',
                      textTransform: 'uppercase', fontSize: 9,
                    }}>
                      {srcLabel}
                    </span>
                    <span style={{ color: C.chalk }}>·</span>
                    <span>{item.distMi < 0.1 ? '<0.1' : item.distMi.toFixed(1)} mi from {item.campus}</span>
                    <span style={{ color: C.chalk }}>·</span>
                    <span>{fmtAgo(item.tsMs)}</span>
                    {item.block && (
                      <>
                        <span style={{ color: C.chalk }}>·</span>
                        <span>{item.block}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Campus link */}
                <button
                  onClick={e => { e.stopPropagation(); onSelectCampus(item.campusId); }}
                  style={{
                    fontSize: 11, color: C.mid, background: C.cream,
                    border: `1px solid ${C.chalk}`, borderRadius: 6,
                    padding: '4px 10px', cursor: 'pointer', fontFamily: sans,
                    flexShrink: 0, marginTop: 2,
                  }}
                >
                  {item.campus} →
                </button>
              </div>

              {/* Expanded detail */}
              {isOpen && (
                <div style={{
                  padding: '14px 20px', background: '#F9F8F5',
                  borderBottom: `1px solid ${C.chalk}`,
                  animation: 'fadeUp .15s ease',
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, fontSize: 12, fontFamily: sans }}>
                    {[
                      ['Source', item.source === 'CITIZEN' ? 'Citizen App' : item.source === 'NEWS' ? 'News feed' : 'CPD Radio'],
                      ['Location', item.block || `Near ${item.campus}`],
                      ['Distance', `${item.distMi < 0.1 ? '<0.1' : item.distMi.toFixed(1)} mi from ${item.campus}`],
                      ['Reported', fmtAgo(item.tsMs)],
                      ['Type', item.type.replace(/_/g, ' ')],
                      ['Contagion trigger', 'Yes — tracked by model'],
                    ].map(([l, v]) => (
                      <div key={l}>
                        <div style={{ color: C.light, marginBottom: 3, fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em' }}>{l}</div>
                        <div style={{ color: C.deep, fontWeight: 500 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* ICE alerts */}
        {iceAlerts.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 14,
            padding: '16px 0', borderBottom: `1px solid ${C.chalk}`,
          }}>
            <div style={{ width: 3, minHeight: 44, borderRadius: 2, background: C.ice, flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: sans, fontSize: 15, fontWeight: 600, color: '#4C1D95', marginBottom: 6 }}>
                {iceAlerts.length} ICE enforcement report{iceAlerts.length !== 1 ? 's' : ''} near our campuses
              </div>
              <div style={{ fontSize: 12, color: '#6D28D9', fontFamily: sans }}>
                Network Legal notified · Lock exterior doors · Review shelter-in-place protocol
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right — contagion monitor */}
      <div style={{
        background: C.white, border: `1px solid ${C.chalk}`,
        borderRadius: 10, padding: '20px 22px',
      }}>
        <div style={{
          fontSize: 9, fontWeight: 800, letterSpacing: '.16em',
          textTransform: 'uppercase', color: C.light, marginBottom: 16, fontFamily: sans,
        }}>
          Contagion Monitor
        </div>

        {allZones.length === 0 ? (
          <div style={{ fontSize: 13, color: C.light, fontFamily: sans }}>
            No active zones near our campuses.
          </div>
        ) : (
          allZones.slice(0, 5).map((zone: any, i: number) => {
            const isRet = zone.retWin;
            const isAcute = zone.phase === 'ACUTE';
            const phaseColor = isRet ? C.watch : isAcute ? C.red : C.amber;
            const phaseLabel = isRet ? 'RET. WINDOW' : zone.phase;
            const pct = Math.round((zone.ageH / (125 * 24)) * 100);

            return (
              <div key={i} style={{
                marginBottom: 14, padding: '12px 14px',
                background: isRet ? '#FEF2F2' : '#FAFAF8',
                borderRadius: 8, border: `1px solid ${isRet ? '#FECACA' : C.chalk}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: phaseColor, fontFamily: sans }}>{phaseLabel}</span>
                  <span style={{ fontSize: 9, fontWeight: 500, color: C.light, fontFamily: mono }}>{zone.daysLeft}d left</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.deep, marginBottom: 3, fontFamily: sans }}>
                  {zone.block || 'Nearby corridor'} — Homicide trigger
                </div>
                <div style={{ fontSize: 11, color: C.mid, marginBottom: 8, fontFamily: sans }}>
                  {zone.distanceFromCampus != null ? `${zone.distanceFromCampus.toFixed(2)} mi` : '?'} from nearest campus · {Math.round(zone.ageH)}h elapsed
                </div>
                <div style={{ height: 3, borderRadius: 2, background: C.chalk, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: phaseColor, borderRadius: 2 }} />
                </div>
              </div>
            );
          })
        )}

        {allZones.length > 5 && (
          <div style={{ fontSize: 11, color: C.light, marginTop: 4, fontFamily: sans }}>+{allZones.length - 5} more</div>
        )}

        <div style={{
          marginTop: 14, fontSize: 10, color: C.light, lineHeight: 1.6,
          borderTop: `1px solid ${C.chalk}`, paddingTop: 10, fontFamily: sans,
        }}>
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
  const incidentCounts = new Map<number, number>();
  for (const item of liveItems) {
    incidentCounts.set(item.campusId, (incidentCounts.get(item.campusId) ?? 0) + 1);
  }

  const sorted = [...risks].sort((a, b) => {
    const ai = incidentCounts.get(a.campusId) ?? 0;
    const bi = incidentCounts.get(b.campusId) ?? 0;
    if (ai !== bi) return bi - ai;
    return b.score - a.score;
  });

  const maxCount = Math.max(...sorted.map(r => incidentCounts.get(r.campusId) ?? 0), 1);

  return (
    <div>
      <p style={{ fontFamily: serif, fontSize: 17, lineHeight: 1.8, color: C.deep, margin: '0 0 24px 0' }}>
        Here's how each campus stands right now:
      </p>

      {/* Bar chart */}
      <div style={{
        display: 'flex', gap: 0, alignItems: 'flex-end',
        height: 90, marginBottom: 0, position: 'relative',
      }}>
        {sorted.map(risk => {
          const campus = CAMPUSES.find(c => c.id === risk.campusId);
          if (!campus) return null;
          const count = incidentCounts.get(risk.campusId) ?? 0;
          const isRet = risk.inRetaliationWindow;
          const barH = count > 0 ? Math.max((count / maxCount) * 72, 22) : risk.label !== 'LOW' ? 16 : 6;
          const barColor = isRet ? C.watch : count > 0 ? C.amber : risk.label !== 'LOW' ? '#93C5FD' : C.chalk;

          return (
            <div
              key={risk.campusId}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', cursor: 'pointer', padding: '0 1px',
              }}
              onClick={() => onSelectCampus(risk.campusId)}
              title={`${campus.short}: ${count} incidents`}
            >
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: 80 }}>
                <div style={{
                  width: '100%', borderRadius: '3px 3px 0 0',
                  background: barColor, height: barH,
                  transition: 'height .3s ease',
                  opacity: count > 0 || risk.label !== 'LOW' ? 1 : .4,
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
          const count = incidentCounts.get(risk.campusId) ?? 0;
          return (
            <div
              key={risk.campusId}
              style={{ flex: 1, textAlign: 'center', padding: '8px 1px 0', cursor: 'pointer' }}
              onClick={() => onSelectCampus(risk.campusId)}
            >
              <div style={{
                fontSize: 8, color: count > 0 ? C.deep : C.light,
                fontWeight: count > 0 ? 700 : 400, fontFamily: sans,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {campus?.short ?? ''}
              </div>
            </div>
          );
        })}
      </div>

      {/* Narrative summary below chart */}
      <p style={{
        fontFamily: serif, fontSize: 15, lineHeight: 1.8,
        color: C.mid, margin: '20px 0 0 0',
      }}>
        {(() => {
          const elevated = sorted.filter(r => {
            const count = incidentCounts.get(r.campusId) ?? 0;
            return count > 0 || r.label !== 'LOW';
          });
          const quiet = sorted.length - elevated.length;
          if (elevated.length === 0) return `All ${sorted.length} campuses are in nominal conditions.`;
          const names = elevated.slice(0, 3).map(r => {
            const c = CAMPUSES.find(c => c.id === r.campusId);
            const count = incidentCounts.get(r.campusId) ?? 0;
            return `${c?.short ?? '?'} (${count} incident${count !== 1 ? 's' : ''})`;
          }).join(', ');
          return `${names}${elevated.length > 3 ? `, and ${elevated.length - 3} more` : ''} require attention. The remaining ${quiet} campuses are nominal.`;
        })()}
      </p>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, marginTop: 16, fontSize: 11, color: C.light, fontFamily: sans }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: C.watch, display: 'inline-block' }} />
          Retaliation window
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: C.amber, display: 'inline-block' }} />
          Active incidents
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: '#93C5FD', display: 'inline-block' }} />
          Elevated
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: C.chalk, display: 'inline-block' }} />
          Nominal
        </span>
      </div>
    </div>
  );
};

// ─── SECTION 4 — WHAT TO WATCH ───────────────────────────────────────────────

const SectionWatchFor = ({ allZones, iceAlerts, risks, liveItems }: {
  allZones: any[]; iceAlerts: IceAlert[]; risks: CampusRisk[]; liveItems: LiveItem[];
}) => {
  const items: { text: string; severity: 'red' | 'purple' | 'amber' | 'blue' }[] = [];

  const retWin = allZones.filter(z => z.retWin);
  const acute = allZones.filter(z => z.phase === 'ACUTE');

  if (retWin.length > 0) {
    items.push({
      text: `Retaliation windows are open near ${retWin.length} campus${retWin.length !== 1 ? 'es' : ''} — peak risk period, heightened awareness at arrival and dismissal.`,
      severity: 'red',
    });
  }
  if (acute.length > 0 && retWin.length === 0) {
    items.push({
      text: `${acute.length} ACUTE contagion zone${acute.length !== 1 ? 's' : ''} active — violence is most likely to recur within 72 hours of the original incident.`,
      severity: 'red',
    });
  }
  if (iceAlerts.length > 0) {
    items.push({
      text: `ICE enforcement activity reported near ${iceAlerts.length} campus${iceAlerts.length !== 1 ? 'es' : ''} — Network Legal has been notified. Shelter-in-place protocol is available.`,
      severity: 'purple',
    });
  }

  const activeZones = allZones.filter(z => z.phase === 'ACTIVE');
  if (activeZones.length > 0) {
    items.push({
      text: `${activeZones.length} ACTIVE contagion zone${activeZones.length !== 1 ? 's' : ''} remain open through the next 14 days — sustained elevated awareness recommended.`,
      severity: 'amber',
    });
  }

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDay = tomorrow.toLocaleDateString('en-US', { weekday: 'long' });
  items.push({
    text: `${tomorrowDay} morning briefing will be generated at 5:30 AM with overnight updates from all 10 intelligence sources.`,
    severity: 'blue',
  });

  if (items.length === 1) {
    items.unshift({
      text: 'All campuses are in normal conditions. Continue standard monitoring protocols.',
      severity: 'blue',
    });
  }

  const severityColors = {
    red: C.watch,
    purple: C.ice,
    amber: C.amber,
    blue: '#60A5FA',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 14,
            padding: '14px 0',
            borderBottom: i < items.length - 1 ? `1px solid ${C.chalk}` : 'none',
          }}
        >
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: severityColors[item.severity],
            flexShrink: 0, marginTop: 8,
          }} />
          <span style={{ fontFamily: sans, fontSize: 14, color: C.deep, lineHeight: 1.7 }}>
            {item.text}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── SECTION 5 — SOURCES ─────────────────────────────────────────────────────

const SectionSources = ({ scannerCalls, newsIncidentCount, cpdCount, iceAlerts, shotSpotterEvents, liveItems }: {
  scannerCalls: number; newsIncidentCount: number; cpdCount: number;
  iceAlerts: IceAlert[]; shotSpotterEvents: ShotSpotterEvent[]; liveItems: LiveItem[];
}) => {
  const [open, setOpen] = useState(false);

  const sources = [
    { label: 'Citizen App',        color: C.green, desc: 'Near-real-time reports' },
    { label: 'CPD Radio',          color: C.amber, desc: `${scannerCalls} calls · AI transcription` },
    { label: 'Block Club Chicago', color: C.ice,   desc: 'RSS · geocoded' },
    { label: 'ABC7 Chicago',       color: C.ice,   desc: 'RSS · geocoded' },
    { label: 'NBC5 Chicago',       color: C.ice,   desc: 'RSS · geocoded' },
    { label: 'CBS Chicago',        color: C.ice,   desc: 'RSS · geocoded' },
    { label: 'Chicago Sun-Times',  color: C.ice,   desc: 'RSS · geocoded' },
    { label: 'WGN News',           color: C.ice,   desc: 'RSS · geocoded' },
    { label: 'ICE Monitoring',     color: '#7C3AED', desc: `${iceAlerts.length} active alerts` },
    { label: 'CPD Crime Portal',   color: C.light, desc: `${cpdCount.toLocaleString()} incidents · 7–8d lag · contagion model only` },
  ];

  return (
    <div>
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        onClick={() => setOpen(!open)}
      >
        <p style={{ fontFamily: serif, fontSize: 15, color: C.mid, margin: 0 }}>
          10 of 10 intelligence sources are live.
        </p>
        <button style={{
          fontSize: 11, color: C.light, background: 'none',
          border: 'none', cursor: 'pointer', fontFamily: sans,
        }}>
          {open ? 'Hide ▴' : 'Show all ▾'}
        </button>
      </div>

      {open && (
        <div style={{
          marginTop: 18, display: 'flex', gap: 8, flexWrap: 'wrap',
          animation: 'fadeUp .2s ease',
        }}>
          {sources.map(s => (
            <div key={s.label} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', background: C.white,
              border: `1px solid ${C.chalk}`, borderRadius: 20,
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: '50%',
                background: s.color, display: 'inline-block', flexShrink: 0,
              }} />
              <span style={{ fontSize: 11, color: C.deep, fontWeight: 500, fontFamily: sans }}>{s.label}</span>
              <span style={{ fontSize: 10, color: C.light, fontFamily: sans }}>· {s.desc}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── QUICK STATS SIDEBAR ─────────────────────────────────────────────────────

const QuickStats = ({ risks, liveItems, allZones, iceAlerts }: {
  risks: CampusRisk[]; liveItems: LiveItem[]; allZones: any[]; iceAlerts: IceAlert[];
}) => {
  const elevated = risks.filter(r => r.label !== 'LOW').length;

  const rows = [
    { label: 'Campuses monitored', value: String(CAMPUSES.length), alert: false },
    { label: 'Elevated', value: String(elevated), alert: elevated > 0 },
    { label: 'Incidents (24h)', value: String(liveItems.length), alert: liveItems.length > 0 },
    { label: 'Contagion zones', value: String(allZones.length), alert: allZones.length > 0 },
    { label: 'ICE alerts', value: String(iceAlerts.length), alert: iceAlerts.length > 0 },
    { label: 'Sources live', value: '10/10', alert: false },
  ];

  return (
    <div style={{
      background: C.white, border: `1px solid ${C.chalk}`,
      borderRadius: 10, padding: '20px 22px',
      position: 'sticky', top: 24,
    }}>
      <div style={{
        fontSize: 9, fontWeight: 800, letterSpacing: '.16em',
        textTransform: 'uppercase', color: C.light, marginBottom: 16, fontFamily: sans,
      }}>
        Quick Stats
      </div>

      {rows.map(row => (
        <div key={row.label} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          padding: '7px 0', borderBottom: `1px solid #F5F3EF`,
        }}>
          <span style={{ fontSize: 12, color: C.mid, fontFamily: sans }}>{row.label}</span>
          <span style={{
            fontSize: 13, fontWeight: 700,
            color: row.alert ? C.watch : C.deep,
            fontFamily: mono,
          }}>
            {row.value}
          </span>
        </div>
      ))}

      <div style={{ marginTop: 16, fontSize: 11, color: C.light, fontFamily: sans }}>
        Next briefing: {(() => {
          const h = new Date().getHours();
          if (h < 5) return 'Today 5:30 AM';
          if (h < 12) return 'Today Noon';
          if (h < 17) return 'Today 5:00 PM';
          return 'Tomorrow 5:30 AM';
        })()}
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function NetworkDashboard({
  risks, summary, forecast, iceAlerts, shotSpotterEvents, acuteIncidents,
  citizenIncidents = [], newsIncidents = [], dispatchIncidents = [],
  onSelectCampus,
  scannerCalls = 0, scannerSpikeZones = 0, newsSourceCount = 0,
  newsIncidentCount = 0, redditIncidentCount = 0, cpdCount = 0,
}: Props) {
  const [secAgo, setSecAgo] = useState(0);

  const liveItems      = buildLiveFeed(citizenIncidents, newsIncidents, dispatchIncidents);
  const schoolActivity = buildSchoolActivity(liveItems, risks, iceAlerts);
  const allZones       = risks.flatMap(r => r.contagionZones ?? []);
  const narrative      = useNetworkNarrative(schoolActivity, allZones, iceAlerts, liveItems);

  useEffect(() => {
    setSecAgo(0);
    const t = setInterval(() => setSecAgo(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [narrative.lastRefresh]);

  return (
    <div style={{ background: C.cream, fontFamily: sans, color: C.deep, minHeight: '100vh' }}>
      <style>{STYLES}</style>

      {/* ── Main layout: centered column + sticky sidebar ── */}
      <div style={{
        maxWidth: 1080, margin: '0 auto',
        padding: '40px 40px 64px',
        display: 'grid', gridTemplateColumns: '1fr 240px',
        gap: 40, alignItems: 'start',
      }}>
        {/* ── Left: The Living Document ── */}
        <div style={{ minWidth: 0 }}>

          {/* Section 1 — The Opening */}
          <section style={{ marginBottom: 48 }}>
            <SectionLabel label="The Opening" />
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
            <SectionLabel label={`What Happened ${timeOfDay() === 'morning' ? 'Overnight' : 'Near Our Schools'}`} />
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
            <SectionLabel label="Your Campuses at a Glance" />
            <SectionCampusGrid risks={risks} liveItems={liveItems} onSelectCampus={onSelectCampus} />
          </section>

          <div style={{ height: 1, background: C.chalk, marginBottom: 48 }} />

          {/* Section 4 — What to Watch */}
          <section style={{ marginBottom: 48 }}>
            <SectionLabel label={`What to Watch For ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}`} />
            <SectionWatchFor allZones={allZones} iceAlerts={iceAlerts} risks={risks} liveItems={liveItems} />
          </section>

          <div style={{ height: 1, background: C.chalk, marginBottom: 48 }} />

          {/* Section 5 — Sources */}
          <section>
            <SectionLabel label="Sources" />
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

        {/* ── Right: Sticky Quick Stats ── */}
        <QuickStats
          risks={risks}
          liveItems={liveItems}
          allZones={allZones}
          iceAlerts={iceAlerts}
        />
      </div>
    </div>
  );
}
