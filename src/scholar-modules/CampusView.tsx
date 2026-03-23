/**
 * CampusView — Campus Intelligence Dashboard
 *
 * Layout:
 *   Header: Campus name, risk badge, KPI strip (violent crime only, 1mi)
 *   AI Briefing: Full-width intelligence narrative (auto-updates on violent crime changes)
 *   Two-column: Large map (left 60%) | Intel panel (right 40%)
 *   Contagion zones (if any)
 *   Ask Slate / Dismissal button
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useWatchData } from '@/hooks/useWatchData';
import { trpc } from '@/lib/trpc';
import WatchLayout from '@/components/layout/WatchLayout';
import { CAMPUSES, RISK_COLORS, SOURCE_STYLES, CONFIDENCE_STYLES } from '@/lib/campus-data';
import { haversine, bearing as calcBearing, compassLabel, fmtAgo, fmtDist } from '@/lib/geo';
import WatchMap from '@/components/map/WatchMap';
import LiveFeed from '@/components/feed/LiveFeed';
import DismissalAssistant from '@/components/dismissal/DismissalAssistant';
import { Loader2, MapPin, ArrowRight, ExternalLink, Shield, AlertTriangle, RefreshCw, Zap } from 'lucide-react';
import type { UnifiedIncident, CampusRisk, ContagionZone } from '@/lib/types';

// ─── Constants ──────────────────────────────────────────────

const PRIMARY_TABS = [
  { label: 'Network', href: '/network' },
  { label: 'My Campus', href: '/campus' },
  { label: 'How It Works', href: '/how-it-works' },
];

const SUB_TABS = [
  { label: 'Dashboard', id: 'dashboard' },
  { label: 'Map', id: 'map' },
  { label: 'News', id: 'news' },
  { label: 'Feed', id: 'feed' },
];

/** Violent crime filter — ONLY serious threats to student safety */
const SERIOUS_VIOLENT = /HOMICIDE|MURDER|SHOOTING|SHOT.?SPOTTER|CRIM SEXUAL ASSAULT|CRIMINAL SEXUAL|KIDNAPPING|AGGRAVATED ASSAULT.*HANDGUN|AGGRAVATED ASSAULT.*FIREARM/i;

const serif = "'Playfair Display', Georgia, 'Times New Roman', serif";
const sans = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
const mono = "'JetBrains Mono', 'SF Mono', Menlo, monospace";

// ─── Helpers ────────────────────────────────────────────────

function timeOfDay(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Overnight';
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  if (h < 21) return 'Evening';
  return 'Tonight';
}

function formatAge(ts: string): string {
  const mins = Math.round((Date.now() - new Date(ts).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ─── Violent Crime Computation Hook ─────────────────────────

function useViolentCrimeStats(campus: typeof CAMPUSES[0] | undefined, incidents: UnifiedIncident[]) {
  return useMemo(() => {
    if (!campus) return { violent7d: 0, violent24h: 0, topTypes: '', violentIncidents7d: [] as UnifiedIncident[] };

    const now = Date.now();

    const violent7d = incidents.filter(inc => {
      const d = haversine(campus.lat, campus.lng, inc.lat, inc.lng);
      const age = (now - new Date(inc.timestamp).getTime()) / (1000 * 3600 * 24);
      return d <= 1.0 && age <= 7 && SERIOUS_VIOLENT.test(inc.title + ' ' + inc.category);
    });

    const violent24h = incidents.filter(inc => {
      const d = haversine(campus.lat, campus.lng, inc.lat, inc.lng);
      const age = (now - new Date(inc.timestamp).getTime()) / (1000 * 3600);
      return d <= 1.0 && age <= 24 && SERIOUS_VIOLENT.test(inc.title + ' ' + inc.category);
    });

    // Top types for context
    const typeCounts: Record<string, number> = {};
    for (const inc of violent7d) {
      const cat = inc.category || 'OTHER';
      typeCounts[cat] = (typeCounts[cat] ?? 0) + 1;
    }
    const topTypes = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => `${type}: ${count}`)
      .join(', ');

    return { violent7d: violent7d.length, violent24h: violent24h.length, topTypes: topTypes || 'none', violentIncidents7d: violent7d };
  }, [campus, incidents]);
}

// ─── AI Briefing Hook ───────────────────────────────────────

function stripEchoedKPIs(raw: string): string {
  // The LLM sometimes echoes back KPI numbers before the narrative.
  // Strip lines like "0 VIOLENT 7D", "2 CONTAGION ZONES", etc.
  return raw
    .replace(/^\s*\d+\s+VIOLENT\s+\d+[DH]\s*$/gm, '')
    .replace(/^\s*\d+\s+CONTAGION\s+ZONES?\s*$/gm, '')
    .replace(/^\n+/, '')
    .trim();
}

function useCampusBriefing(
  campus: typeof CAMPUSES[0] | undefined,
  risk: CampusRisk | undefined,
  stats: { violent7d: number; violent24h: number; topTypes: string },
  tempF: number,
  dataReady: boolean,
) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const prevKeyRef = useRef('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const briefingMutation = trpc.briefing.generate.useMutation();

  // Build a cache key from the values that should trigger regeneration
  const cacheKey = `${campus?.id}-${stats.violent7d}-${stats.violent24h}-${risk?.label}-${risk?.contagionZones?.length ?? 0}-${risk?.inRetaliationWindow}`;

  const generate = useCallback(async () => {
    if (!campus || !risk) return;
    setLoading(true);
    try {
      const result = await briefingMutation.mutateAsync({
        campusShort: campus.short,
        communityArea: campus.communityArea,
        riskLabel: risk.label,
        riskScore: risk.score,
        violent7d: stats.violent7d,
        violent24h: stats.violent24h,
        topViolentTypes: stats.topTypes,
        contagionZones: risk.contagionZones?.length ?? 0,
        inRetaliationWindow: risk.inRetaliationWindow ?? false,
        iceNearby: 0,
        tempF: Math.round(tempF),
        timeOfDay: timeOfDay(),
      });
      setText(stripEchoedKPIs(result.text || ''));
    } catch (err) {
      console.error('[Briefing] Error:', err);
      setText('');
    } finally {
      setLoading(false);
    }
  }, [campus, risk, stats.violent7d, stats.violent24h, stats.topTypes, tempF, briefingMutation]);

  // Auto-regenerate with debounce — waits for data to stabilize (3s after last change)
  useEffect(() => {
    if (!dataReady || !campus || !risk) return;
    if (cacheKey === prevKeyRef.current) return;

    // Clear any pending debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      prevKeyRef.current = cacheKey;
      generate();
    }, 3000); // Wait 3s for data feeds to stabilize

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [cacheKey, campus, risk, generate, dataReady]);

  return { text, loading, refresh: generate };
}

// ─── Sparkline Component ────────────────────────────────────

function Sparkline({ data, color = '#C0392B', width = 120, height = 36 }: {
  data: number[]; color?: string; width?: number; height?: number;
}) {
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
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      {(() => {
        const lastX = width;
        const lastY = height - ((data[data.length - 1] - min) / range) * (height - 4) - 2;
        return <circle cx={lastX} cy={lastY} r={2.5} fill={color} />;
      })()}
    </svg>
  );
}

// ─── Status Badge ───────────────────────────────────────────

function StatusBadge({ label }: { label: string }) {
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
}

// ─── Campus Header with KPIs ────────────────────────────────

function CampusHeader({ campus, risk, stats, tempF, sparkData }: {
  campus: typeof CAMPUSES[0];
  risk: CampusRisk;
  stats: { violent7d: number; violent24h: number };
  tempF: number;
  sparkData: number[];
}) {
  const zoneCount = risk.contagionZones?.length ?? 0;

  return (
    <div style={{
      background: '#FFFFFF', borderRadius: 12, border: '1px solid #E5E1D8',
      borderTop: `4px solid ${risk.label === 'LOW' ? '#16A34A' : risk.label === 'ELEVATED' ? '#D97706' : '#C0392B'}`,
      padding: '24px 28px', marginBottom: 20,
    }}>
      {/* Top row: name + badge + sparkline */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <h1 style={{
            fontFamily: serif, fontSize: 28, fontWeight: 900,
            color: '#1A1A1A', letterSpacing: '-.02em', margin: 0,
          }}>
            {campus.short.toUpperCase()}
          </h1>
          <StatusBadge label={risk.label} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ textAlign: 'right' }}>
            <Sparkline data={sparkData} color={risk.label === 'LOW' ? '#16A34A' : '#C0392B'} />
            <div style={{ fontSize: 10, color: '#9CA3AF', fontFamily: sans, marginTop: 2 }}>
              7-day violent trend
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#6B7280', fontFamily: sans, display: 'flex', alignItems: 'center', gap: 4 }}>
            {Math.round(tempF)}°F
          </div>
        </div>
      </div>

      {/* Address */}
      <div style={{ fontSize: 12, color: '#9CA3AF', fontFamily: sans, marginTop: 6 }}>
        {campus.addr} · {campus.communityArea}
      </div>

      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 20 }}>
        {[
          { value: stats.violent7d, label: 'VIOLENT 7D', sublabel: 'within 1 mi', color: stats.violent7d > 0 ? '#C0392B' : '#1A1A1A' },
          { value: stats.violent24h, label: 'VIOLENT 24H', sublabel: 'within 1 mi', color: stats.violent24h > 0 ? '#C0392B' : '#1A1A1A' },
          { value: zoneCount, label: `CONTAGION ZONE${zoneCount !== 1 ? 'S' : ''}`, sublabel: '', color: zoneCount > 0 ? '#D97706' : '#1A1A1A' },
        ].map(kpi => (
          <div key={kpi.label} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: serif, fontSize: 36, fontWeight: 900, color: kpi.color, lineHeight: 1 }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.12em', color: '#9CA3AF', fontFamily: sans, marginTop: 6 }}>
              {kpi.label}
            </div>
            {kpi.sublabel && (
              <div style={{ fontSize: 8, color: '#9CA3AF', fontFamily: sans, marginTop: 2, fontWeight: 400, letterSpacing: '.05em' }}>
                {kpi.sublabel}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── AI Intelligence Briefing ───────────────────────────────

function AIBriefing({ briefing }: {
  briefing: { text: string; loading: boolean; refresh: () => void };
}) {
  const tod = timeOfDay().toUpperCase();

  return (
    <div style={{
      background: '#FFFDF8', borderRadius: 12,
      border: '1px solid #E5E1D8', padding: '24px 28px',
      marginBottom: 20,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Zap size={14} style={{ color: '#B79145' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A', fontFamily: sans, letterSpacing: '-.01em' }}>
            AI Intelligence Briefing
          </span>
        </div>
        <button
          onClick={briefing.refresh}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          title="Regenerate briefing"
        >
          <RefreshCw size={12} className={briefing.loading ? 'animate-spin' : ''} style={{ color: '#9CA3AF' }} />
        </button>
      </div>

      {/* Assessment label */}
      <div style={{
        fontSize: 9, fontWeight: 700, letterSpacing: '.14em',
        textTransform: 'uppercase', color: '#C0392B',
        fontFamily: sans, marginBottom: 14,
      }}>
        {tod} ASSESSMENT
      </div>

      {/* Narrative */}
      {briefing.loading && !briefing.text ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[95, 80, 60].map((w, i) => (
            <div key={i} style={{
              height: 16, borderRadius: 4, width: `${w}%`,
              background: 'linear-gradient(90deg, #E5E1D8 0%, #F3F0EA 50%, #E5E1D8 100%)',
              backgroundSize: '400px 100%', animation: 'shimmer 1.4s infinite linear',
            }} />
          ))}
          <style>{`@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}`}</style>
        </div>
      ) : (
        <div style={{
          fontFamily: serif, fontSize: 15, lineHeight: 1.85,
          color: '#1A1A1A', whiteSpace: 'pre-wrap',
        }}>
          {briefing.text || 'Generating campus intelligence briefing…'}
        </div>
      )}
    </div>
  );
}

// ─── Incident Timeline (compact, for right panel) ───────────

function IncidentPanel({ campus, incidents }: {
  campus: typeof CAMPUSES[0]; incidents: UnifiedIncident[];
}) {
  const now = Date.now();
  const nearby = useMemo(() =>
    incidents
      .filter(inc => {
        const d = haversine(campus.lat, campus.lng, inc.lat, inc.lng);
        const age = (now - new Date(inc.timestamp).getTime()) / (1000 * 3600);
        return d <= 1.5 && age <= 24;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10),
    [campus, incidents, now]
  );

  const isViolent = (inc: UnifiedIncident) => SERIOUS_VIOLENT.test(inc.title + ' ' + inc.category);

  return (
    <div style={{
      background: '#FFFFFF', borderRadius: 12,
      border: '1px solid #E5E1D8', padding: '16px 18px',
      height: '100%', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        fontSize: 9, fontWeight: 800, letterSpacing: '.14em',
        textTransform: 'uppercase', color: '#1A1A1A', fontFamily: sans,
        marginBottom: 12,
      }}>
        Nearby Incidents · 24h
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {nearby.length === 0 ? (
          <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 12, color: '#9CA3AF', fontFamily: sans }}>
            No incidents near campus in the last 24 hours.
          </div>
        ) : (
          nearby.map((inc, i) => {
            const dist = haversine(campus.lat, campus.lng, inc.lat, inc.lng);
            const violent = isViolent(inc);
            const srcStyle = SOURCE_STYLES[inc.source] ?? { color: '#6B7280', label: inc.source };

            return (
              <div key={inc.id || i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '8px 0',
                borderBottom: i < nearby.length - 1 ? '1px solid #F5F3EF' : 'none',
              }}>
                {/* Severity indicator */}
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: violent ? '#C0392B' : inc.severity === 'HIGH' ? '#D97706' : '#9CA3AF',
                  flexShrink: 0, marginTop: 5,
                }} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: '#1A1A1A', fontFamily: sans, lineHeight: 1.4, fontWeight: violent ? 600 : 400 }}>
                    {inc.title}
                  </div>
                  <div style={{ fontSize: 10, color: '#9CA3AF', fontFamily: sans, marginTop: 2, display: 'flex', gap: 8 }}>
                    <span style={{ fontFamily: mono, fontSize: 10 }}>{fmtDist(dist)}</span>
                    <span>{formatAge(inc.timestamp)}</span>
                    <span style={{ color: srcStyle.color, fontWeight: 600 }}>{srcStyle.label}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Risk Profile (compact) ─────────────────────────────────

function RiskProfile({ risk, campus, tempF, allRisks }: {
  risk: CampusRisk; campus: typeof CAMPUSES[0]; tempF: number; allRisks: CampusRisk[];
}) {
  const violenceIndex = (risk.score / 100 * 10).toFixed(1);
  const zoneCount = risk.contagionZones?.length ?? 0;
  const trendLabel = risk.inRetaliationWindow ? '↑ Rising' : risk.label === 'LOW' ? '→ Stable' : '↗ Elevated';
  const weatherDesc = tempF <= 20 ? 'Cold snap' : tempF <= 32 ? 'Freezing' : tempF >= 90 ? 'Heat advisory' : 'Normal';
  const networkAvg = allRisks.length > 0 ? allRisks.reduce((s, r) => s + r.score, 0) / allRisks.length : 0;

  const metrics = [
    { label: 'Violence Index', value: `${violenceIndex} / 10`, pct: Math.min(risk.score, 100), color: risk.score > 65 ? '#C0392B' : risk.score > 35 ? '#D97706' : '#16A34A' },
    { label: 'Contagion Risk', value: zoneCount > 0 ? `${zoneCount} zone${zoneCount > 1 ? 's' : ''}` : 'None', pct: zoneCount > 0 ? Math.min(zoneCount * 30, 100) : 0, color: zoneCount > 0 ? '#D97706' : '#16A34A' },
    { label: 'Trend', value: trendLabel, pct: risk.inRetaliationWindow ? 80 : risk.label === 'LOW' ? 20 : 50, color: risk.inRetaliationWindow ? '#C0392B' : risk.label === 'LOW' ? '#16A34A' : '#D97706' },
    { label: 'Weather', value: `${Math.round(tempF)}°F ${weatherDesc.toLowerCase()}`, pct: tempF <= 20 ? 60 : tempF <= 32 ? 40 : tempF >= 90 ? 50 : 15, color: tempF <= 32 ? '#3B82F6' : tempF >= 90 ? '#C0392B' : '#16A34A' },
  ];

  return (
    <div style={{
      background: '#FFFFFF', borderRadius: 12,
      border: '1px solid #E5E1D8', padding: '16px 18px',
    }}>
      <div style={{
        fontSize: 9, fontWeight: 800, letterSpacing: '.14em',
        textTransform: 'uppercase', color: '#1A1A1A', fontFamily: sans,
        marginBottom: 14,
      }}>
        Risk Profile
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {metrics.map(m => (
          <div key={m.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: '#6B7280', fontFamily: sans }}>{m.label}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#1A1A1A', fontFamily: sans }}>{m.value}</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: '#F0EDE6', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${m.pct}%`, background: m.color, borderRadius: 2, transition: 'width .4s ease' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Network comparison */}
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #E5E1D8' }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#9CA3AF', fontFamily: sans, marginBottom: 6 }}>
          vs Network Average
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 80, height: 4, borderRadius: 2, background: '#F0EDE6', position: 'relative', overflow: 'visible' }}>
            <div style={{ position: 'absolute', left: '50%', top: -2, width: 2, height: 8, background: '#9CA3AF', borderRadius: 1 }} />
            <div style={{
              position: 'absolute',
              left: `${Math.min(Math.max((risk.score / 100) * 100, 5), 95)}%`,
              top: -3, width: 10, height: 10, borderRadius: '50%',
              background: risk.score > networkAvg ? '#C0392B' : '#16A34A',
              border: '2px solid #FFFFFF',
            }} />
          </div>
          <span style={{ fontSize: 11, color: '#6B7280', fontFamily: sans }}>
            {campus.short} ({risk.score} vs avg {Math.round(networkAvg)})
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Contagion Zones Section ────────────────────────────────

function ContagionZonesSection({ zones }: { zones: ContagionZone[] }) {
  if (!zones || zones.length === 0) return null;

  return (
    <div style={{
      background: '#FFFFFF', borderRadius: 12,
      border: '1px solid #E5E1D8', padding: '18px 22px',
      marginBottom: 20,
    }}>
      <div style={{
        fontSize: 9, fontWeight: 800, letterSpacing: '.14em',
        textTransform: 'uppercase', color: '#1A1A1A', fontFamily: sans,
        marginBottom: 14,
      }}>
        Active Contagion Zones · {zones.length}
      </div>
      {zones.map((zone, i) => {
        const phaseColor = zone.phase === 'ACUTE' ? '#DC2626' : zone.phase === 'ACTIVE' ? '#D97706' : '#FBBF24';
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '10px 0',
            borderBottom: i < zones.length - 1 ? '1px solid #F5F3EF' : 'none',
          }}>
            <span style={{
              fontSize: 8, fontWeight: 800, letterSpacing: '.1em',
              textTransform: 'uppercase', color: phaseColor, fontFamily: sans,
              width: 60, flexShrink: 0,
            }}>
              {zone.phase}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1A1A1A', fontFamily: sans }}>
                {zone.distanceFromCampus?.toFixed(1) ?? '?'} mi {zone.bearing}
              </div>
            </div>
          </div>
        );
      })}
      <div style={{ fontSize: 9, color: '#9CA3AF', fontFamily: sans, marginTop: 10 }}>
        Contagion model: Papachristos et al., Yale/UChicago
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────

export default function CampusView() {
  const [, params] = useRoute('/campus/:id');
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showDismissal, setShowDismissal] = useState(false);
  const data = useWatchData();

  const campusId = params?.id ? parseInt(params.id, 10) : undefined;
  const campus = campusId ? CAMPUSES.find(c => c.id === campusId) : undefined;

  const risk = useMemo(() => {
    if (!campusId) return undefined;
    return data.campusRisks.find(r => r.campusId === campusId);
  }, [data.campusRisks, campusId]);

  // Compute violent crime stats (shared between KPIs and briefing)
  const violentStats = useViolentCrimeStats(campus, data.fusedIncidents);

  // AI briefing — reactive to violent crime count changes
  const briefing = useCampusBriefing(campus, risk, violentStats, data.weather.temperature, !data.isLoading);

  // 7-day sparkline data
  const sparkData = useMemo(() => {
    if (!campus) return [0, 0, 0, 0, 0, 0, 0];
    const now = Date.now();
    return Array.from({ length: 7 }, (_, i) => {
      const dayStart = now - (6 - i) * 86400000;
      const dayEnd = dayStart + 86400000;
      return data.fusedIncidents.filter(inc => {
        const d = haversine(campus.lat, campus.lng, inc.lat, inc.lng);
        const t = new Date(inc.timestamp).getTime();
        return d <= 1.0 && t >= dayStart && t < dayEnd && SERIOUS_VIOLENT.test(inc.title + ' ' + inc.category);
      }).length;
    });
  }, [campus, data.fusedIncidents]);

  // Campus-specific feed items
  const campusFeed = useMemo(() => {
    if (!campus) return [];
    return data.feedItems.filter(item => {
      if (item.lat == null || item.lng == null) return false;
      return haversine(campus.lat, campus.lng, item.lat, item.lng) <= 3;
    });
  }, [data.feedItems, campus]);

  // News items near campus
  const campusNews = useMemo(() => {
    if (!campus) return [];
    return data.feedItems.filter(item => {
      if (item.lat == null || item.lng == null) return false;
      const dist = haversine(campus.lat, campus.lng, item.lat, item.lng);
      return dist <= 5 && ['NEWS_RSS', 'NEWS_CWB', 'BLUESKY'].includes(item.source);
    });
  }, [data.feedItems, campus]);

  // ── Early returns AFTER all hooks ──

  if (!campusId || !campus) {
    return (
      <WatchLayout primaryTabs={PRIMARY_TABS}>
        <div className="px-6 py-8">
          <h2 className="text-base font-bold mb-4" style={{ color: '#121315' }}>Select Your Campus</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {CAMPUSES.map(c => {
              const campusRisk = data.campusRisks.find(r => r.campusId === c.id);
              const riskStyle = campusRisk ? RISK_COLORS[campusRisk.label] : RISK_COLORS.LOW;
              return (
                <button
                  key={c.id}
                  onClick={() => navigate(`/campus/${c.id}`)}
                  className="text-left px-5 py-4 rounded-xl flex items-center justify-between transition-colors"
                  style={{ background: '#FFFFFF', border: '1px solid #E7E2D8' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F7F5F1')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#FFFFFF')}
                >
                  <div>
                    <div className="text-sm font-semibold" style={{ color: '#121315' }}>{c.name}</div>
                    <div className="text-[11px] flex items-center gap-1 mt-0.5" style={{ color: '#9CA3AF' }}>
                      <MapPin size={9} /> {c.communityArea}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {campusRisk && (
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded" style={{ background: riskStyle.bg, color: riskStyle.color }}>
                        {campusRisk.label}
                      </span>
                    )}
                    <ArrowRight size={14} style={{ color: '#D1D5DB' }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </WatchLayout>
    );
  }

  if (data.isLoading) {
    return (
      <WatchLayout primaryTabs={PRIMARY_TABS}>
        <div className="flex items-center justify-center py-32">
          <div className="flex items-center gap-3">
            <Loader2 size={20} className="animate-spin" style={{ color: '#B79145' }} />
            <span className="text-sm" style={{ color: '#6B7280' }}>Loading campus intelligence...</span>
          </div>
        </div>
      </WatchLayout>
    );
  }

  const safeRisk = risk ?? {
    campusId: campusId,
    score: 0,
    label: 'LOW' as const,
    statusReason: '',
    incidentsNearby24h: 0,
    contagionZones: [],
    inRetaliationWindow: false,
  };

  return (
    <WatchLayout
      primaryTabs={PRIMARY_TABS}
      subTabs={SUB_TABS}
      activeSubTab={activeTab}
      onSubTabChange={setActiveTab}
      tagline={`${campus.name} · ${campus.communityArea}`}
      lastUpdate={data.lastUpdate}
      isLoading={data.isLoading}
      onRefresh={data.refresh}
    >
      <div className="px-6 py-5">
        {activeTab === 'dashboard' && (
          <div>
            {/* Campus Header with KPIs */}
            <CampusHeader
              campus={campus}
              risk={safeRisk}
              stats={violentStats}
              tempF={data.weather.temperature}
              sparkData={sparkData}
            />

            {/* AI Intelligence Briefing */}
            <AIBriefing briefing={briefing} />

            {/* Two-column layout: Map (60%) | Intel Panel (40%) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '3fr 2fr',
              gap: 16, marginBottom: 20,
              minHeight: 420,
            }}>
              {/* Left: Campus Map */}
              <div style={{
                background: '#FFFFFF', borderRadius: 12,
                border: '1px solid #E5E1D8', padding: '16px 18px',
                display: 'flex', flexDirection: 'column',
              }}>
                <div style={{
                  fontSize: 9, fontWeight: 800, letterSpacing: '.14em',
                  textTransform: 'uppercase', color: '#1A1A1A', fontFamily: sans,
                  marginBottom: 12,
                }}>
                  Campus Map · 1 Mile Radius
                </div>
                <div style={{ flex: 1, borderRadius: 8, overflow: 'hidden', minHeight: 360 }}>
                  <WatchMap
                    incidents={data.fusedIncidents}
                    campusRisks={data.campusRisks}
                    selectedCampusId={campusId}
                    onSelectCampus={(id) => navigate(`/campus/${id}`)}
                  />
                </div>
                {/* Map legend */}
                <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 10, color: '#9CA3AF', fontFamily: sans, flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C0392B', display: 'inline-block' }} />
                    Critical
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#D97706', display: 'inline-block' }} />
                    High
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A', display: 'inline-block' }} />
                    Low
                  </span>
                  {(safeRisk.contagionZones?.length ?? 0) > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(220,38,38,0.2)', border: '1px solid #C0392B', display: 'inline-block' }} />
                      Contagion Zone
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Incident Panel */}
              <IncidentPanel campus={campus} incidents={data.fusedIncidents} />
            </div>

            {/* Risk Profile */}
            <RiskProfile risk={safeRisk} campus={campus} tempF={data.weather.temperature} allRisks={data.campusRisks} />

            {/* Contagion Zones */}
            <div style={{ marginTop: 20 }}>
              <ContagionZonesSection zones={safeRisk.contagionZones ?? []} />
            </div>

            {/* Dismissal Assessment Button */}
            <button
              onClick={() => setShowDismissal(true)}
              className="w-full py-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
              style={{ background: '#121315', color: '#FFFFFF', marginTop: 8 }}
              onMouseEnter={e => (e.currentTarget.style.background = '#2D2D30')}
              onMouseLeave={e => (e.currentTarget.style.background = '#121315')}
            >
              <Shield size={14} />
              Run Dismissal Assessment
            </button>

            <DismissalAssistant
              isOpen={showDismissal}
              onClose={() => setShowDismissal(false)}
              campusRisks={data.campusRisks}
              weather={data.weather}
              nwsAlerts={data.nwsAlerts}
              incidents={data.fusedIncidents}
            />

            {/* Footer attribution */}
            <div style={{
              fontSize: 10, color: '#9CA3AF', lineHeight: 1.6,
              padding: '14px 0', marginTop: 20,
              borderTop: '1px solid #E5E1D8', textAlign: 'center', fontFamily: sans,
            }}>
              Data: CPD, Citizen App, CPD Radio, RSS news (9 sources), Open-Meteo weather.
              Contagion model: Papachristos et al., Yale/UChicago.
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-[2px] mb-3" style={{ color: '#121315' }}>
              {campus.short} Area Map — Incidents within 2 miles
            </h3>
            <div className="rounded-xl overflow-hidden" style={{ height: '600px', border: '1px solid #E7E2D8' }}>
              <WatchMap
                incidents={data.fusedIncidents}
                campusRisks={data.campusRisks}
                selectedCampusId={campusId}
                onSelectCampus={(id) => navigate(`/campus/${id}`)}
              />
            </div>
          </div>
        )}

        {activeTab === 'news' && (
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-[2px] mb-3" style={{ color: '#121315' }}>
              News Near {campus.short} — {campusNews.length} stories
            </h3>
            <div className="space-y-2">
              {campusNews.map(item => {
                const srcStyle = SOURCE_STYLES[item.source] ?? { color: '#6B7280', label: item.source };
                return (
                  <div key={item.id} className="rounded-xl px-5 py-4" style={{ background: '#FFFFFF', border: '1px solid #E7E2D8' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: srcStyle.color + '18', color: srcStyle.color }}>
                        {srcStyle.label}
                      </span>
                      <span className="text-[10px] ml-auto" style={{ color: '#9CA3AF' }}>{formatAge(item.timestamp)}</span>
                    </div>
                    <h4 className="text-sm font-semibold" style={{ color: '#121315', borderLeft: `3px solid ${srcStyle.color}`, paddingLeft: '10px' }}>
                      {item.title}
                    </h4>
                    {item.description && (
                      <p className="text-[11px] mt-1 pl-[13px]" style={{ color: '#6B7280' }}>
                        {item.description.slice(0, 200)}{item.description.length > 200 ? '...' : ''}
                      </p>
                    )}
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 pl-[13px] text-[10px]" style={{ color: '#3B82F6' }}>
                        <ExternalLink size={9} /> {new URL(item.url).hostname}
                      </a>
                    )}
                  </div>
                );
              })}
              {campusNews.length === 0 && (
                <div className="text-center py-12 text-xs" style={{ color: '#9CA3AF' }}>No news stories near {campus.short}.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'feed' && (
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-[2px] mb-3" style={{ color: '#121315' }}>
              Intelligence Feed Near {campus.short} — {campusFeed.length} items
            </h3>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E7E2D8', maxHeight: '700px' }}>
              <LiveFeed items={campusFeed} />
            </div>
          </div>
        )}
      </div>
    </WatchLayout>
  );
}
