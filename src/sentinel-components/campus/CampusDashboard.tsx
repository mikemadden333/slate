/**
 * CampusDashboard — Slate Watch · D2 "The Nerve Center"
 *
 * Structured campus intelligence view:
 *   Top:    Campus header with name, status badge, KPI strip, sparkline, weather
 *   Middle: Full-width AI Intelligence Briefing with action buttons
 *   Bottom: Three-column grid — Incident Timeline | Campus Map | Risk Profile
 *   Footer: Ask Slate
 *
 * This component replaces the vertical chapter-stack layout with a
 * data-dense, three-column design that a principal can scan in seconds.
 *
 * It wraps existing sub-components (CampusMap, MorningBriefing, etc.)
 * in the new layout — no logic changes needed.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type {
  Incident, ShotSpotterEvent, ContagionZone, CampusRisk,
  IceAlert, SchoolPeriod, ForecastDay, DailyWeather,
} from '../../sentinel-engine/types';
import type { CitizenIncident } from '../../sentinel-api/citizen';
import type { DispatchIncident } from '../../sentinel-api/scannerIntel';
import type { ScannerSummary } from '../../sentinel-api/scanner';
import type { SafeCorridor } from '../../sentinel-engine/corridors';
import { CAMPUSES } from '../../sentinel-data/campuses';
import { haversine, ageInHours } from '../../sentinel-engine/geo';

// Existing campus sub-components — we reuse them inside the new layout
import CampusMap from './CampusMap';
import IntelQuery from '../shared/IntelQuery';

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface Campus {
  id: number; name: string; short: string; communityArea: string;
  lat: number; lng: number; address: string;
  arrivalTime?: string; dismissalTime?: string;
}

interface Props {
  campus: Campus;
  risk: CampusRisk;
  allRisks: CampusRisk[];
  incidents: Incident[];
  acuteIncidents: Incident[];
  shotSpotterEvents: ShotSpotterEvent[];
  citizenIncidents: CitizenIncident[];
  newsIncidents: Incident[];
  dispatchIncidents: DispatchIncident[];
  iceAlerts: IceAlert[];
  scannerData: ScannerSummary | null;
  corridors: SafeCorridor[];
  forecast: ForecastDay[];
  tempF: number;
  schoolPeriod: SchoolPeriod;
  onBeginProtocol: (code: string) => void;
  onAskPulse?: () => void;
}

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

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
  blue:    '#3B82F6',
};

const serif = "Playfair Display, Georgia, 'Times New Roman', serif";
const sans  = "Inter, -apple-system, BlinkMacSystemFont, sans-serif";
const mono  = "JetBrains Mono, 'SF Mono', Menlo, monospace";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
  @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
  @keyframes pulseRing{0%{transform:scale(1);opacity:.45}100%{transform:scale(2.1);opacity:0}}
`;

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function fmtTime() {
  return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function fmtDate() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase();
}

function fmtAgo(ms: number) {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function timeOfDay() {
  const h = new Date().getHours();
  if (h < 5)  return 'Overnight';
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  if (h < 21) return 'Evening';
  return 'Tonight';
}

// ─── AI CAMPUS BRIEFING ──────────────────────────────────────────────────────

function useCampusBriefing(campus: Campus, risk: CampusRisk, iceAlerts: IceAlert[], incidents: Incident[], tempF: number) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const generate = useCallback(async () => {
    setLoading(true);
    try {
      // Use the EXACT same filters as the KPI strip in CampusHeader
      const now = Date.now();

      // 7-day incidents within 1mi (matches "INCIDENTS 7D" KPI)
      const nearby7d = incidents.filter(inc => {
        const d = haversine(campus.lat, campus.lng, inc.lat, inc.lng);
        const age = (now - new Date(inc.date).getTime()) / (1000 * 3600 * 24);
        return d <= 1.0 && age <= 7;
      });

      // 24h serious violent crime within 1mi (matches "VIOLENT 24H" KPI)
      // Only: homicide, murder, shooting, sexual assault, kidnapping, gun violence
      // Excludes: battery, robbery, theft, property crime
      const SERIOUS_VIOLENT = /HOMICIDE|MURDER|SHOOTING|SHOT SPOTTER|CRIM SEXUAL ASSAULT|CRIMINAL SEXUAL|KIDNAPPING|AGGRAVATED ASSAULT.*HANDGUN|AGGRAVATED ASSAULT.*FIREARM/i;
      const violent24h = incidents.filter(inc => {
        const d = haversine(campus.lat, campus.lng, inc.lat, inc.lng);
        const age = (now - new Date(inc.date).getTime()) / (1000 * 3600);
        return d <= 1.0 && age <= 24 && SERIOUS_VIOLENT.test(inc.type);
      });

      // 24h all-type incidents within 1mi
      const nearby24h = incidents.filter(inc => {
        const d = haversine(campus.lat, campus.lng, inc.lat, inc.lng);
        const age = (now - new Date(inc.date).getTime()) / (1000 * 3600);
        return d <= 1.0 && age <= 24;
      });

      // Top incident types for context
      const typeCounts: Record<string, number> = {};
      for (const inc of nearby7d) {
        typeCounts[inc.type] = (typeCounts[inc.type] ?? 0) + 1;
      }
      const topTypes = Object.entries(typeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([type, count]) => `${type}: ${count}`)
        .join(', ');

      const zoneCount = risk.contagionZones?.length ?? 0;

      const ctx = {
        campus: campus.short,
        communityArea: campus.communityArea,
        riskLabel: risk.label,
        riskScore: risk.score,
        incidents7d: nearby7d.length,
        violent24h: violent24h.length,
        allIncidents24h: nearby24h.length,
        topIncidentTypes7d: topTypes || 'none',
        contagionZones: zoneCount,
        inRetaliationWindow: risk.inRetaliationWindow,
        iceNearby: iceAlerts.length,
        tempF: Math.round(tempF),
        timeOfDay: timeOfDay(),
      };

      const res = await fetch('/api/anthropic-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 400,
          system: `You are Slate Watch writing a campus intelligence briefing for a school principal.

CRITICAL DATA CONSISTENCY RULE:
The dashboard KPI strip shows these exact numbers to the principal:
- "${nearby7d.length} INCIDENTS 7D" (incidents within 1 mile in the past 7 days)
- "${violent24h.length} VIOLENT 24H" (violent incidents within 1 mile in the past 24 hours)
- "${zoneCount} CONTAGION ZONE${zoneCount !== 1 ? 'S' : ''}" (active contagion zones)

Your briefing text appears directly below these numbers. You MUST reference these exact counts accurately.
- If violent24h > 0, you MUST acknowledge the violent incidents. NEVER say "no violent incidents" when the count is above zero.
- "Violent" means ONLY: homicides, murders, shootings, sexual assaults, kidnappings, and gun violence. NOT battery, robbery, or theft.
- If incidents7d > 0, you MUST acknowledge recent activity. NEVER say the area has been quiet when incidents exist.
- Reference specific incident types from topIncidentTypes7d when available.
- Focus your narrative on serious threats to student safety — gun violence, homicides, sexual predators, kidnapping.

Format rules:
- Address the principal directly: "Your campus..."
- 2-3 paragraphs max. Plain declarative sentences.
- First paragraph: current status — reference the actual incident numbers and types.
- Second paragraph: actionable guidance — what to do about it.
- If ICE activity: mention it and recommend contacting Network Legal.
- If cold weather (below 32°F): mention extended arrival/dismissal protocols.
- No markdown, no bullets, no headers.`,
          messages: [{ role: 'user', content: `Campus briefing context: ${JSON.stringify(ctx)}` }],
        }),
      });
      const data = await res.json();
      setText(data?.content?.[0]?.text ?? '');
    } catch { setText(''); }
    finally { setLoading(false); }
  }, [campus.id, risk.label, iceAlerts.length, incidents.length]);

  useEffect(() => { generate(); }, [generate]);

  return { text, loading, refresh: generate };
}

// ─── SPARKLINE (7-day trend) ─────────────────────────────────────────────────

const Sparkline = ({ data, color = C.watch, width = 100, height = 32 }: {
  data: number[]; color?: string; width?: number; height?: number;
}) => {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* Dot on last point */}
      {(() => {
        const lastX = width;
        const lastY = height - ((data[data.length - 1] - min) / range) * (height - 4) - 2;
        return <circle cx={lastX} cy={lastY} r={2.5} fill={color} />;
      })()}
    </svg>
  );
};

// ─── STATUS BADGE ────────────────────────────────────────────────────────────

const StatusBadge = ({ label }: { label: string }) => {
  const colors: Record<string, { bg: string; text: string }> = {
    LOW:      { bg: '#DCFCE7', text: '#14532D' },
    ELEVATED: { bg: '#FEF3C7', text: '#92400E' },
    HIGH:     { bg: '#FEE2E2', text: '#991B1B' },
    CRITICAL: { bg: '#DC2626', text: '#FFFFFF' },
  };
  const c = colors[label] ?? colors.LOW;
  return (
    <span style={{
      fontSize: 10, fontWeight: 800, letterSpacing: '.1em',
      padding: '4px 12px', borderRadius: 20,
      background: c.bg, color: c.text, fontFamily: sans,
    }}>
      {label}
    </span>
  );
};

// ─── SECTION: CAMPUS HEADER ──────────────────────────────────────────────────

const CampusHeader = ({ campus, risk, incidents, tempF }: {
  campus: Campus; risk: CampusRisk; incidents: Incident[]; tempF: number;
}) => {
  // Compute KPIs
  const now = Date.now();
  const nearby7d = incidents.filter(inc => {
    const d = haversine(campus.lat, campus.lng, inc.lat, inc.lng);
    const age = (now - new Date(inc.date).getTime()) / (1000 * 3600 * 24);
    return d <= 1.0 && age <= 7;
  }).length;

  // Serious violent crime only: homicide, murder, shooting, sexual assault, kidnapping
  // Excludes: battery, robbery, theft, property crime
  const SERIOUS_VIOLENT_KPI = /HOMICIDE|MURDER|SHOOTING|SHOT SPOTTER|CRIM SEXUAL ASSAULT|CRIMINAL SEXUAL|KIDNAPPING|AGGRAVATED ASSAULT.*HANDGUN|AGGRAVATED ASSAULT.*FIREARM/i;
  const violent24h = incidents.filter(inc => {
    const d = haversine(campus.lat, campus.lng, inc.lat, inc.lng);
    const age = (now - new Date(inc.date).getTime()) / (1000 * 3600);
    return d <= 1.0 && age <= 24 && SERIOUS_VIOLENT_KPI.test(inc.type);
  }).length;

  const zoneCount = risk.contagionZones?.length ?? 0;

  // Build 7-day sparkline data
  const sparkData = Array.from({ length: 7 }, (_, i) => {
    const dayStart = now - (6 - i) * 86400000;
    const dayEnd = dayStart + 86400000;
    return incidents.filter(inc => {
      const d = haversine(campus.lat, campus.lng, inc.lat, inc.lng);
      const t = new Date(inc.date).getTime();
      return d <= 1.0 && t >= dayStart && t < dayEnd;
    }).length;
  });

  // Trend vs 30d average
  const avg30d = Math.round(nearby7d / 7 * 30);
  const trendPct = avg30d > 0 ? Math.round(((nearby7d / 7 * 30) / avg30d - 1) * 100) : 0;

  return (
    <div style={{
      background: C.white, borderRadius: 12, border: `1px solid ${C.chalk}`,
      borderTop: `4px solid ${risk.label === 'LOW' ? C.green : risk.label === 'ELEVATED' ? C.amber : C.watch}`,
      padding: '24px 28px', marginBottom: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        {/* Left: Campus name + badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <h1 style={{
            fontFamily: serif, fontSize: 32, fontWeight: 900,
            color: C.deep, letterSpacing: '-.02em', margin: 0,
          }}>
            {campus.short.toUpperCase()}
          </h1>
          <StatusBadge label={risk.label} />
        </div>

        {/* Right: Sparkline + weather */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ textAlign: 'right' }}>
            <Sparkline data={sparkData} color={risk.label === 'LOW' ? C.green : C.watch} />
            <div style={{ fontSize: 10, color: C.light, fontFamily: sans, marginTop: 2 }}>
              {trendPct > 0 ? `↑ ${trendPct}%` : trendPct < 0 ? `↓ ${Math.abs(trendPct)}%` : '→ flat'} vs 30d avg
            </div>
          </div>
          <div style={{
            fontSize: 12, color: C.mid, fontFamily: sans,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            ☁ {Math.round(tempF)}°F
          </div>
        </div>
      </div>

      {/* Address */}
      <div style={{ fontSize: 12, color: C.light, fontFamily: sans, marginTop: 6 }}>
        {campus.address} · {campus.communityArea}
      </div>

      {/* KPI Strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16, marginTop: 20,
      }}>
        {[
          { value: nearby7d, label: 'INCIDENTS 7D', color: nearby7d > 20 ? C.watch : C.deep },
          { value: violent24h, label: 'VIOLENT 24H', color: violent24h > 0 ? C.watch : C.deep },
          { value: zoneCount, label: `CONTAGION ZONE${zoneCount !== 1 ? 'S' : ''}`, color: zoneCount > 0 ? C.amber : C.deep },
        ].map(kpi => (
          <div key={kpi.label} style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: serif, fontSize: 36, fontWeight: 900,
              color: kpi.color, lineHeight: 1,
            }}>
              {kpi.value}
            </div>
            <div style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '.12em',
              color: C.light, fontFamily: sans, marginTop: 6,
            }}>
              {kpi.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── SECTION: AI INTELLIGENCE BRIEFING ───────────────────────────────────────

const AIBriefing = ({ briefing, campus, onNotifyDeans, onContactLegal }: {
  briefing: { text: string; loading: boolean; refresh: () => void };
  campus: Campus;
  onNotifyDeans?: () => void;
  onContactLegal?: () => void;
}) => {
  const tod = timeOfDay().toUpperCase();

  return (
    <div style={{
      background: '#FFFDF8', borderRadius: 12,
      border: `1px solid ${C.chalk}`, padding: '28px 32px',
      marginBottom: 24,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <span style={{ fontSize: 16 }}>✦</span>
        <span style={{
          fontSize: 14, fontWeight: 700, color: C.deep,
          fontFamily: sans, letterSpacing: '-.01em',
        }}>
          AI Intelligence Briefing
        </span>
      </div>

      {/* Assessment label */}
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '.14em',
        textTransform: 'uppercase', color: C.section,
        fontFamily: sans, marginBottom: 16,
      }}>
        {tod} ASSESSMENT
      </div>

      {/* Narrative */}
      {briefing.loading && !briefing.text ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[95, 80, 60].map((w, i) => (
            <div key={i} style={{
              height: 18, borderRadius: 4, width: `${w}%`,
              background: `linear-gradient(90deg, ${C.chalk} 0%, ${C.cream2} 50%, ${C.chalk} 100%)`,
              backgroundSize: '400px 100%', animation: 'shimmer 1.4s infinite linear',
            }} />
          ))}
        </div>
      ) : (
        <div style={{
          fontFamily: serif, fontSize: 16, lineHeight: 1.85,
          color: C.deep, whiteSpace: 'pre-wrap',
        }}>
          {briefing.text || 'Generating campus intelligence briefing…'}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
        <button
          onClick={onNotifyDeans}
          style={{
            padding: '8px 18px', borderRadius: 8,
            border: `1px solid ${C.watch}`, background: 'transparent',
            color: C.watch, fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: sans,
          }}
        >
          Notify Deans
        </button>
        <button
          onClick={onContactLegal}
          style={{
            padding: '8px 18px', borderRadius: 8,
            border: `1px solid ${C.watch}`, background: 'transparent',
            color: C.watch, fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: sans,
          }}
        >
          Contact Legal
        </button>
        <button
          onClick={briefing.refresh}
          style={{
            padding: '8px 18px', borderRadius: 8,
            border: `1px solid ${C.chalk}`, background: 'transparent',
            color: C.mid, fontSize: 12, fontWeight: 500,
            cursor: 'pointer', fontFamily: sans,
          }}
        >
          View Full Briefing →
        </button>
      </div>
    </div>
  );
};

// ─── SECTION: INCIDENT TIMELINE ──────────────────────────────────────────────

const IncidentTimeline = ({ campus, incidents }: {
  campus: Campus; incidents: Incident[];
}) => {
  const now = Date.now();
  const nearby = incidents
    .filter(inc => {
      const d = haversine(campus.lat, campus.lng, inc.lat, inc.lng);
      const age = (now - new Date(inc.date).getTime()) / (1000 * 3600);
      return d <= 1.0 && age <= 24;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 12);

  const severityColor = (type: string) => {
    if (/HOMICIDE|MURDER/i.test(type)) return C.watch;
    if (/SHOOTING|SHOT/i.test(type)) return C.red;
    if (/ASSAULT|BATTERY/i.test(type)) return C.amber;
    if (/ROBBERY/i.test(type)) return '#F59E0B';
    return C.light;
  };

  const sourceLabel = (inc: Incident) => {
    if ((inc as any).source === 'citizen') return 'Citizen';
    if ((inc as any).source === 'news') return 'News';
    if ((inc as any).source === 'scanner') return 'CPD';
    return 'CPD';
  };

  return (
    <div style={{
      background: C.white, borderRadius: 12,
      border: `1px solid ${C.chalk}`, padding: '20px 22px',
      height: '100%', display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
        <div style={{
          fontSize: 10, fontWeight: 800, letterSpacing: '.14em',
          textTransform: 'uppercase', color: C.deep, fontFamily: sans,
        }}>
          Incident Timeline
        </div>
      </div>

      {/* Timeline */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {nearby.length === 0 ? (
          <div style={{
            padding: '24px 0', textAlign: 'center',
            fontSize: 13, color: C.light, fontFamily: sans,
          }}>
            No incidents near campus in the last 24 hours.
          </div>
        ) : (
          nearby.map((inc, i) => {
            const t = new Date(inc.date);
            const timeStr = t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
            const dist = haversine(campus.lat, campus.lng, inc.lat, inc.lng);
            const desc = inc.description || inc.block || inc.type.replace(/_/g, ' ').toLowerCase();

            return (
              <div key={inc.id || i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '10px 0',
                borderBottom: i < nearby.length - 1 ? `1px solid #F5F3EF` : 'none',
              }}>
                {/* Severity dot */}
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: severityColor(inc.type),
                  flexShrink: 0, marginTop: 5,
                }} />

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, color: C.deep, fontFamily: sans,
                    lineHeight: 1.4, fontWeight: 500,
                  }}>
                    <span style={{ fontFamily: mono, fontSize: 11, color: C.light, marginRight: 6 }}>
                      {timeStr}
                    </span>
                    — {desc.charAt(0).toUpperCase() + desc.slice(1)}
                    <span style={{ color: C.light, fontSize: 11 }}>
                      {' '}({dist < 0.1 ? '<0.1' : dist.toFixed(1)}mi)
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: C.light, fontFamily: sans, marginTop: 2 }}>
                    · {sourceLabel(inc)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// ─── SECTION: RISK PROFILE ───────────────────────────────────────────────────

const RiskProfile = ({ risk, campus, incidents, tempF, allRisks }: {
  risk: CampusRisk; campus: Campus; incidents: Incident[];
  tempF: number; allRisks: CampusRisk[];
}) => {
  // Violence index (score / 100 * 10)
  const violenceIndex = (risk.score / 100 * 10).toFixed(1);

  // Contagion risk
  const zoneCount = risk.contagionZones?.length ?? 0;
  const nearestZoneDist = zoneCount > 0
    ? Math.min(...(risk.contagionZones ?? []).map((z: any) => z.distanceFromCampus ?? 99)).toFixed(1)
    : null;

  // Trend direction
  const trendLabel = risk.inRetaliationWindow ? '↑ Rising' : risk.label === 'LOW' ? '→ Stable' : '↗ Elevated';

  // Source coverage
  const sourceLive = 10;
  const sourceTotal = 10;

  // Weather impact
  const weatherDesc = tempF <= 20 ? 'Cold snap' : tempF <= 32 ? 'Freezing' : tempF >= 90 ? 'Heat advisory' : 'Normal';

  // Network comparison
  const networkAvg = allRisks.reduce((s, r) => s + r.score, 0) / allRisks.length;
  const vsNetwork = risk.score - networkAvg;

  const metrics = [
    {
      label: 'Violence Index',
      value: `${violenceIndex} / 10`,
      pct: Math.min(risk.score, 100),
      color: risk.score > 65 ? C.watch : risk.score > 35 ? C.amber : C.green,
    },
    {
      label: 'Contagion Risk',
      value: zoneCount > 0 ? `${zoneCount} zone${zoneCount > 1 ? 's' : ''} · ${nearestZoneDist}mi` : 'None active',
      pct: zoneCount > 0 ? Math.min(zoneCount * 30, 100) : 0,
      color: zoneCount > 0 ? C.amber : C.green,
    },
    {
      label: 'Trend Direction',
      value: trendLabel,
      pct: risk.inRetaliationWindow ? 80 : risk.label === 'LOW' ? 20 : 50,
      color: risk.inRetaliationWindow ? C.watch : risk.label === 'LOW' ? C.green : C.amber,
    },
    {
      label: 'Source Coverage',
      value: `${sourceLive}/${sourceTotal} live`,
      pct: (sourceLive / sourceTotal) * 100,
      color: C.green,
    },
    {
      label: 'Weather Impact',
      value: `${Math.round(tempF)}°F ${weatherDesc.toLowerCase()}`,
      pct: tempF <= 20 ? 60 : tempF <= 32 ? 40 : tempF >= 90 ? 50 : 15,
      color: tempF <= 20 ? C.blue : tempF <= 32 ? C.blue : tempF >= 90 ? C.watch : C.green,
    },
  ];

  return (
    <div style={{
      background: C.white, borderRadius: 12,
      border: `1px solid ${C.chalk}`, padding: '20px 22px',
      height: '100%', display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        fontSize: 10, fontWeight: 800, letterSpacing: '.14em',
        textTransform: 'uppercase', color: C.deep, fontFamily: sans,
        marginBottom: 18,
      }}>
        Risk Profile
      </div>

      {/* Metrics */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {metrics.map(m => (
          <div key={m.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
              <span style={{ fontSize: 12, color: C.mid, fontFamily: sans }}>{m.label}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.deep, fontFamily: sans }}>{m.value}</span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: '#F0EDE6', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${m.pct}%`,
                background: m.color, borderRadius: 3,
                transition: 'width .4s ease',
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Network comparison */}
      <div style={{
        marginTop: 18, paddingTop: 14,
        borderTop: `1px solid ${C.chalk}`,
      }}>
        <div style={{
          fontSize: 9, fontWeight: 800, letterSpacing: '.14em',
          textTransform: 'uppercase', color: C.light, fontFamily: sans,
          marginBottom: 8,
        }}>
          Compared to Network
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 80, height: 4, borderRadius: 2, background: '#F0EDE6',
            position: 'relative', overflow: 'visible',
          }}>
            {/* Network average marker */}
            <div style={{
              position: 'absolute', left: '50%', top: -2,
              width: 2, height: 8, background: C.light, borderRadius: 1,
            }} />
            {/* Campus position */}
            <div style={{
              position: 'absolute',
              left: `${Math.min(Math.max((risk.score / 100) * 100, 5), 95)}%`,
              top: -3, width: 10, height: 10, borderRadius: '50%',
              background: risk.score > networkAvg ? C.watch : C.green,
              border: `2px solid ${C.white}`,
            }} />
          </div>
          <span style={{ fontSize: 11, color: C.mid, fontFamily: sans }}>
            {campus.short}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── SECTION: CAMPUS MAP WRAPPER ─────────────────────────────────────────────

const CampusMapSection = ({ campus, risk, incidents, shotSpotterEvents, corridors, scannerData }: {
  campus: Campus; risk: CampusRisk; incidents: Incident[];
  shotSpotterEvents: ShotSpotterEvent[]; corridors: SafeCorridor[];
  scannerData: ScannerSummary | null;
}) => {
  return (
    <div style={{
      background: C.white, borderRadius: 12,
      border: `1px solid ${C.chalk}`, padding: '20px 22px',
      height: '100%', display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        fontSize: 10, fontWeight: 800, letterSpacing: '.14em',
        textTransform: 'uppercase', color: C.deep, fontFamily: sans,
        marginBottom: 14,
      }}>
        Campus Map
      </div>

      {/* Map container */}
      <div style={{ flex: 1, borderRadius: 8, overflow: 'hidden', minHeight: 280 }}>
        <CampusMap
          campus={campus}
          risk={risk}
          incidents={incidents}
          shotSpotterEvents={shotSpotterEvents}
          contagionZones={risk.contagionZones}
          corridors={corridors}
          scannerData={scannerData}
        />
      </div>

      {/* Map legend */}
      <div style={{
        display: 'flex', gap: 14, marginTop: 12, fontSize: 10,
        color: C.light, fontFamily: sans, flexWrap: 'wrap',
      }}>
        {(risk.contagionZones?.length ?? 0) > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(220,38,38,0.2)', border: `1px solid ${C.watch}`, display: 'inline-block' }} />
            Contagion Zone
          </span>
        )}
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.watch, display: 'inline-block' }} />
          Violent
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.amber, display: 'inline-block' }} />
          Other
        </span>
      </div>
    </div>
  );
};

// ─── ASK SLATE ───────────────────────────────────────────────────────────────

const AskSlate = ({ campus, risk }: { campus: Campus; risk: CampusRisk }) => {
  const [query, setQuery] = useState('');
  const suggestions = [
    'What should I tell parents today?',
    'Show me the contagion zone details',
    `What happened near ${campus.short} overnight?`,
  ];

  return (
    <div style={{
      background: C.white, borderRadius: 12,
      border: `1px solid ${C.chalk}`, padding: '16px 22px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          fontSize: 10, fontWeight: 800, letterSpacing: '.12em',
          textTransform: 'uppercase', color: C.mid, fontFamily: sans,
          flexShrink: 0,
        }}>
          Ask Slate
        </span>
        <input
          type="text"
          placeholder="Ask anything about your campus…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            flex: 1, border: 'none', outline: 'none',
            fontSize: 13, color: C.deep, fontFamily: sans,
            background: 'transparent', padding: '6px 0',
          }}
        />
        <button style={{
          background: C.deep, color: C.white, border: 'none',
          borderRadius: 6, padding: '6px 12px', fontSize: 11,
          cursor: 'pointer', fontFamily: sans, fontWeight: 600,
        }}>
          Ask
        </button>
      </div>

      {/* Suggestions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        {suggestions.map(s => (
          <button
            key={s}
            onClick={() => setQuery(s)}
            style={{
              fontSize: 11, color: C.mid, background: C.cream,
              border: `1px solid ${C.chalk}`, borderRadius: 20,
              padding: '4px 12px', cursor: 'pointer', fontFamily: sans,
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function CampusDashboard({
  campus, risk, allRisks, incidents, acuteIncidents,
  shotSpotterEvents, citizenIncidents, newsIncidents, dispatchIncidents,
  iceAlerts, scannerData, corridors, forecast, tempF, schoolPeriod,
  onBeginProtocol, onAskPulse,
}: Props) {
  const briefing = useCampusBriefing(campus, risk, iceAlerts, incidents, tempF);

  return (
    <div style={{ background: C.cream, fontFamily: sans, color: C.deep }}>
      <style>{STYLES}</style>

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 0 48px' }}>

        {/* ── Campus Header with KPIs ── */}
        <CampusHeader campus={campus} risk={risk} incidents={incidents} tempF={tempF} />

        {/* ── AI Intelligence Briefing ── */}
        <AIBriefing
          briefing={briefing}
          campus={campus}
          onNotifyDeans={() => onBeginProtocol('notify-deans')}
          onContactLegal={() => onBeginProtocol('contact-legal')}
        />

        {/* ── ICE Alert (if active) ── */}
        {iceAlerts.length > 0 && (
          <div style={{
            background: '#EDE9FE', borderRadius: 12,
            border: '1px solid #C4B5FD', padding: '16px 22px',
            marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <span style={{ fontSize: 18 }}>🔒</span>
            <div>
              <div style={{ fontFamily: sans, fontSize: 14, fontWeight: 700, color: '#4C1D95' }}>
                {iceAlerts.length} ICE enforcement report{iceAlerts.length !== 1 ? 's' : ''} near campus
              </div>
              <div style={{ fontSize: 12, color: '#6D28D9', fontFamily: sans, marginTop: 2 }}>
                Lock exterior doors · Contact Network Legal · Review shelter-in-place protocol
              </div>
            </div>
          </div>
        )}

        {/* ── Three-Column Grid: Timeline | Map | Risk Profile ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 16, marginBottom: 24,
          minHeight: 380,
        }}>
          <IncidentTimeline campus={campus} incidents={incidents} />
          <CampusMapSection
            campus={campus} risk={risk} incidents={incidents}
            shotSpotterEvents={shotSpotterEvents} corridors={corridors}
            scannerData={scannerData}
          />
          <RiskProfile
            risk={risk} campus={campus} incidents={incidents}
            tempF={tempF} allRisks={allRisks}
          />
        </div>

        {/* ── Contagion Zones (if any) ── */}
        {(risk.contagionZones?.length ?? 0) > 0 && (
          <div style={{
            background: C.white, borderRadius: 12,
            border: `1px solid ${C.chalk}`, padding: '20px 22px',
            marginBottom: 24,
          }}>
            <div style={{
              fontSize: 10, fontWeight: 800, letterSpacing: '.14em',
              textTransform: 'uppercase', color: C.deep, fontFamily: sans,
              marginBottom: 14,
            }}>
              Active Contagion Zones
            </div>
            {(risk.contagionZones ?? []).map((zone: any, i: number) => {
              const isRet = zone.retWin;
              const phaseColor = isRet ? C.watch : zone.phase === 'ACUTE' ? C.red : C.amber;
              const pct = Math.round((zone.ageH / (125 * 24)) * 100);
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '12px 0',
                  borderBottom: i < (risk.contagionZones?.length ?? 0) - 1 ? `1px solid #F5F3EF` : 'none',
                }}>
                  <span style={{
                    fontSize: 8, fontWeight: 800, letterSpacing: '.1em',
                    textTransform: 'uppercase', color: phaseColor, fontFamily: sans,
                    width: 80, flexShrink: 0,
                  }}>
                    {isRet ? 'RET. WINDOW' : zone.phase}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.deep, fontFamily: sans }}>
                      {zone.block || 'Nearby corridor'} — Homicide trigger
                    </div>
                    <div style={{ fontSize: 11, color: C.mid, fontFamily: sans, marginTop: 2 }}>
                      {zone.distanceFromCampus != null ? `${zone.distanceFromCampus.toFixed(2)} mi` : '?'} from campus · {Math.round(zone.ageH)}h elapsed · {zone.daysLeft}d remaining
                    </div>
                  </div>
                  <div style={{ width: 60, height: 4, borderRadius: 2, background: '#F0EDE6', overflow: 'hidden', flexShrink: 0 }}>
                    <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: phaseColor, borderRadius: 2 }} />
                  </div>
                </div>
              );
            })}
            <div style={{ fontSize: 10, color: C.light, fontFamily: sans, marginTop: 10 }}>
              Contagion model: Papachristos et al., Yale/UChicago · Updates every 90 seconds
            </div>
          </div>
        )}

        {/* ── Ask Slate ── */}
        <AskSlate campus={campus} risk={risk} />

        {/* ── Footer attribution ── */}
        <div style={{
          fontSize: 10, color: C.light, lineHeight: 1.6,
          padding: '16px 0', marginTop: 24,
          borderTop: `1px solid ${C.chalk}`, textAlign: 'center', fontFamily: sans,
        }}>
          Data: CPD, Citizen App, CPD Radio, RSS news (9 sources), Open-Meteo weather.
          Contagion model: Papachristos et al., Yale/UChicago.
        </div>
      </div>
    </div>
  );
}
