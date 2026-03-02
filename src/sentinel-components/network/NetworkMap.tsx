/**
 * NetworkMap — Executive intelligence map for the entire Noble network.
 * All 18 campus shields, contagion zones, incidents, shared zone lines.
 * Time scrubber with play/stop, corridor overlays, fullscreen command center mode.
 * Intelligence overlay panel with network status and corridor stats.
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  MapContainer, TileLayer, Circle, CircleMarker,
  Marker, Popup, Tooltip, Polyline, Polygon, useMap,
} from 'react-leaflet';
import L from 'leaflet';
import type { CampusRisk, ContagionZone, Incident, IceAlert } from '../../sentinel-engine/types';
import { CAMPUSES } from '../../sentinel-data/campuses';
import type { Campus } from '../../sentinel-data/campuses';
import { RISK_COLORS } from '../../sentinel-data/weights';
import { fmtAgo } from '../../sentinel-engine/geo';
import 'leaflet/dist/leaflet.css';

interface Props {
  risks: CampusRisk[];
  zones: ContagionZone[];
  incidents24h: Incident[];
  iceAlerts?: IceAlert[];
  onSelectCampus: (id: number) => void;
}

/* ═══ Constants ═══ */

const CHICAGO_CENTER: [number, number] = [41.8400, -87.6800];
const MI_TO_M = 1609.34;

const SHIELD_COLORS: Record<string, string> = {
  LOW: '#1B3A6B', ELEVATED: '#D97706', HIGH: '#EA580C', CRITICAL: '#DC2626',
};

const INC_COLORS: Record<string, string> = {
  'HOMICIDE': '#DC2626', 'WEAPONS VIOLATION': '#EA580C', 'BATTERY': '#D97706',
  'ASSAULT': '#EAB308', 'ROBBERY': '#7C3AED', 'NARCOTICS': '#0D9488',
};

const ZONE_FILLS: Record<string, { color: string; op: number }> = {
  ACUTE:  { color: '#DC2626', op: 0.40 },
  ACTIVE: { color: '#D97706', op: 0.25 },
  WATCH:  { color: '#6B7280', op: 0.08 },
};

const SNAP_HOURS = [2, 6, 24, 168, 336, 720];
const SNAP_LABELS = ['2h', '6h', '24h', '7d', '14d', '30d'];

type ZoneMode = 'ACUTE' | 'ACUTE_ACTIVE' | 'ALL';
type ChipFilter = 'ALL' | 'ELEVATED+' | 'RETALIATION' | 'ICE' | 'SOUTH' | 'WEST' | 'NORTH' | 'LAST24H';

const SOUTH_AREAS = new Set([47, 49, 43, 71, 68, 58]);
const WEST_AREAS = new Set([28, 29, 23, 20, 19, 30]);
const NORTH_AREAS = new Set([24, 32]);

/* Corridor definitions — convex hulls of campus clusters */
const CORRIDORS = [
  {
    name: 'South Side Corridor',
    campusIds: [1, 3, 4, 5, 8, 9],
    color: '#1B3A6B',
    labelPos: { lat: 41.755, lng: -87.620 },
  },
  {
    name: 'West Side Corridor',
    campusIds: [6, 10, 13, 15, 16, 18],
    color: '#1B3A6B',
    labelPos: { lat: 41.865, lng: -87.725 },
  },
  {
    name: 'Near North & Downtown',
    campusIds: [2, 7, 11, 12, 14, 17],
    color: '#1B3A6B',
    labelPos: { lat: 41.895, lng: -87.660 },
  },
];

function getCorridorPolygon(campusIds: number[]): [number, number][] {
  const pts = campusIds
    .map(id => CAMPUSES.find(c => c.id === id))
    .filter((c): c is Campus => c != null)
    .map(c => [c.lat, c.lng] as [number, number]);
  if (pts.length < 3) return pts;
  // Simple convex hull approximation: sort by angle from centroid
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  return pts.sort((a, b) => Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx));
}

function fmtTimeLabel(h: number): string {
  if (h <= 24) return `${h} hours`;
  return `${Math.round(h / 24)} days`;
}

/* ═══ CSS Keyframes ═══ */

const KEYFRAMES = `
@keyframes critPulse {
  0%, 100% { opacity: 0.85; }
  50% { opacity: 1; transform: scale(1.08); }
}
@keyframes acuteRotate {
  0% { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: 50; }
}
.pulse-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 3px;
  outline: none;
  cursor: pointer;
}
.pulse-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #1B3A6B;
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.3);
}
.pulse-slider::-moz-range-thumb {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #1B3A6B;
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.3);
  border: none;
}
`;

/* ═══ Shield DivIcon ═══ */

function makeShield(label: string, score: number, color: string, size: number, pulse: boolean): L.DivIcon {
  const w = size;
  const h = Math.round(size * 1.22);
  const anim = pulse ? 'animation:critPulse 1.5s ease-in-out infinite;' : '';
  return L.divIcon({
    html: `<div style="display:flex;flex-direction:column;align-items:center;${anim}">
      <div style="position:relative;">
        <svg width="${w}" height="${h}" viewBox="0 0 28 34">
          <path d="M14 1L2 7v12c0 9.3 5.1 17.9 12 21.5 6.9-3.6 12-12.2 12-21.5V7L14 1z"
            fill="${color}" stroke="#fff" stroke-width="1.5"/>
          <text x="14" y="20" text-anchor="middle" fill="#fff" font-size="9"
            font-weight="800" font-family="system-ui">N</text>
        </svg>
        <div style="position:absolute;top:-4px;right:-6px;background:${color};color:#fff;
          font-size:8px;font-weight:800;border-radius:8px;padding:1px 4px;
          border:1.5px solid #fff;font-family:'SF Mono',monospace;">${score}</div>
      </div>
      <div style="font-size:10px;font-weight:700;color:#1B3A6B;white-space:nowrap;margin-top:1px;
        text-shadow:0 0 3px #fff,0 0 3px #fff;">${label}</div>
    </div>`,
    className: '',
    iconSize: [80, h + 18],
    iconAnchor: [40, h],
  });
}

function shieldSize(enroll: number): number {
  if (enroll < 500) return 28;
  if (enroll <= 700) return 32;
  return 36;
}

/* ═══ MapController ═══ */

function MapController({ fitTrigger }: { fitTrigger: number }) {
  const map = useMap();
  useEffect(() => {
    if (fitTrigger > 0) {
      const pts = CAMPUSES.map(c => [c.lat, c.lng] as [number, number]);
      if (pts.length > 0) map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 13 });
    }
  }, [fitTrigger, map]);
  return null;
}

/* ═══ Shared zone detection ═══ */

interface SharedZone { zone: ContagionZone; campuses: Campus[]; }

function findSharedZones(zones: ContagionZone[], risks: CampusRisk[]): SharedZone[] {
  const shared: SharedZone[] = [];
  for (const zone of zones) {
    const affected = CAMPUSES.filter(c => {
      const r = risks.find(rr => rr.campusId === c.id);
      return r?.contagionZones.some(z => z.incidentId === zone.incidentId);
    });
    if (affected.length >= 2) shared.push({ zone, campuses: affected });
  }
  return shared;
}

/* ═══ Main Component ═══ */

export default function NetworkMap({ risks, zones, incidents24h, iceAlerts, onSelectCampus }: Props) {
  const [timeSnapIdx, setTimeSnapIdx] = useState(2);
  const timeWindowH = SNAP_HOURS[timeSnapIdx];
  const [zoneMode, setZoneMode] = useState<ZoneMode>('ACUTE_ACTIVE');
  const [riskThreshold, setRiskThreshold] = useState(0);
  const [chipFilter, setChipFilter] = useState<ChipFilter>('ALL');

  const [showCampuses, setShowCampuses] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [showConnections, setShowConnections] = useState(true);
  const [showCorridors, setShowCorridors] = useState(false);

  const [fullscreen, setFullscreen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [intelOpen, setIntelOpen] = useState(true);
  const [fitTrigger, setFitTrigger] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  /* Time scrubber auto-play */
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setTimeSnapIdx(prev => {
        if (prev >= SNAP_HOURS.length - 1) { setIsPlaying(false); return SNAP_HOURS.length - 1; }
        return prev + 1;
      });
    }, 1200);
    return () => clearInterval(id);
  }, [isPlaying]);

  const filteredInc = useMemo(() => {
    const cutoffMs = Date.now() - (timeWindowH * 60 * 60 * 1000);
    return incidents24h.filter(i => {
      if (!i.date) return false;
      const ms = new Date(i.date).getTime();
      return !isNaN(ms) && ms >= cutoffMs;
    });
  }, [incidents24h, timeWindowH]);

  const filteredZones = useMemo(() => {
    if (zoneMode === 'ACUTE') return zones.filter(z => z.phase === 'ACUTE');
    if (zoneMode === 'ACUTE_ACTIVE') return zones.filter(z => z.phase !== 'WATCH');
    return zones;
  }, [zones, zoneMode]);

  const filteredCampuses = useMemo(() => {
    return CAMPUSES.filter(c => {
      const r = risks.find(rr => rr.campusId === c.id);
      if (!r) return false;
      if (r.score < riskThreshold) return false;
      switch (chipFilter) {
        case 'ALL': return true;
        case 'ELEVATED+': return r.label !== 'LOW';
        case 'RETALIATION': return r.inRetaliationWindow;
        case 'ICE': return iceAlerts?.some(a => a.nearestCampusId === c.id) ?? false;
        case 'SOUTH': return SOUTH_AREAS.has(c.areaNumber);
        case 'WEST': return WEST_AREAS.has(c.areaNumber);
        case 'NORTH': return NORTH_AREAS.has(c.areaNumber);
        case 'LAST24H': return filteredInc.some(inc => {
          const dist = Math.sqrt((inc.lat - c.lat) ** 2 + (inc.lng - c.lng) ** 2) * 69;
          return dist <= 1.0;
        });
        default: return true;
      }
    });
  }, [risks, riskThreshold, chipFilter, iceAlerts, filteredInc]);

  const fadedCampusIds = useMemo(() => {
    const filtered = new Set(filteredCampuses.map(c => c.id));
    return new Set(CAMPUSES.filter(c => !filtered.has(c.id)).map(c => c.id));
  }, [filteredCampuses]);

  const sharedZones = useMemo(() => findSharedZones(filteredZones, risks), [filteredZones, risks]);

  const campusIcons = useMemo(() => {
    const icons: Record<number, L.DivIcon> = {};
    for (const c of CAMPUSES) {
      const r = risks.find(rr => rr.campusId === c.id);
      const label = r?.label ?? 'LOW';
      const score = r?.score ?? 0;
      const color = SHIELD_COLORS[label];
      const sz = shieldSize(c.enroll);
      icons[c.id] = makeShield(c.short, score, color, sz, label === 'CRITICAL');
    }
    return icons;
  }, [risks]);

  const getSituation = useCallback((r: CampusRisk): string => {
    if (r.inRetaliationWindow) {
      const acute = r.contagionZones.find(z => z.phase === 'ACUTE');
      if (acute) return `Retaliation window open — homicide ${acute.distanceFromCampus?.toFixed(1) ?? '?'}mi, ${fmtAgo(acute.homicideDate)}`;
    }
    if (r.contagionZones.length > 0) return `${r.contagionZones.length} contagion zone${r.contagionZones.length !== 1 ? 's' : ''} affecting campus`;
    if (r.closeCount > 0) return `${r.closeCount} incident${r.closeCount !== 1 ? 's' : ''} within 0.5mi in 24h`;
    return 'Quiet — no contagion crimes in last 72h';
  }, []);

  /* ═══ Intelligence overlay stats ═══ */
  const intelStats = useMemo(() => {
    const avgScore = risks.length > 0 ? Math.round(risks.reduce((s, r) => s + r.score, 0) / risks.length) : 0;
    const elevated = risks.filter(r => r.label !== 'LOW').length;
    const acuteCount = zones.filter(z => z.phase === 'ACUTE').length;
    const iceCount = iceAlerts?.length ?? 0;
    const sorted = [...risks].sort((a, b) => b.score - a.score);
    const highest = sorted[0];
    const highestCampus = highest ? CAMPUSES.find(c => c.id === highest.campusId) : null;
    return { avgScore, elevated, acuteCount, iceCount, highestCampus, highestScore: highest?.score ?? 0, highestLabel: highest?.label ?? 'LOW' };
  }, [risks, zones, iceAlerts]);

  const sliderBg = (pct: number) => `linear-gradient(to right, #1B3A6B ${pct}%, #E5E7EB ${pct}%)`;
  const timePct = (timeSnapIdx / (SNAP_HOURS.length - 1)) * 100;
  const riskPct = riskThreshold;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const mapH = fullscreen ? '100%' : (isMobile ? 420 : 560);

  const CHIPS: { key: ChipFilter; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'SOUTH', label: 'South Side' },
    { key: 'WEST', label: 'West Side' },
    { key: 'NORTH', label: 'Near North' },
    { key: 'ELEVATED+', label: 'Elevated+' },
    { key: 'RETALIATION', label: 'Retaliation Windows' },
    { key: 'ICE', label: 'ICE Alerts' },
    { key: 'LAST24H', label: 'Last 24h Activity' },
  ];

  /* ═══ Control Panel ═══ */
  const controlPanel = (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 20, fontSize: 14 }}>
      {/* Time Window */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontWeight: 600, color: '#1B3A6B' }}>Time Window</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => { if (isPlaying) setIsPlaying(false); else { setTimeSnapIdx(0); setIsPlaying(true); } }}
              style={{
                background: isPlaying ? '#DC2626' : '#1B3A6B', color: '#fff', border: 'none',
                borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', minHeight: 28,
              }}
            >{isPlaying ? '■ Stop' : '▶ Play'}</button>
            <span style={{ color: '#6B7280', fontSize: 13 }}>Last {fmtTimeLabel(timeWindowH)}</span>
          </div>
        </div>
        <input type="range" min={0} max={SNAP_HOURS.length - 1} value={timeSnapIdx}
          onChange={e => { setTimeSnapIdx(Number(e.target.value)); setIsPlaying(false); }}
          className="pulse-slider" style={{ background: sliderBg(timePct) }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9CA3AF', marginTop: 4 }}>
          {SNAP_LABELS.map(l => <span key={l}>{l}</span>)}
        </div>
      </div>

      {/* Zone Display */}
      <div>
        <div style={{ fontWeight: 600, color: '#1B3A6B', marginBottom: 8 }}>Contagion Zone Display</div>
        <div style={{ display: 'flex', border: '1px solid #D1D5DB', borderRadius: 8, overflow: 'hidden' }}>
          {([['ACUTE', 'Acute Only'], ['ACUTE_ACTIVE', 'Acute + Active'], ['ALL', 'All Zones']] as const).map(([val, label]) => (
            <button key={val} onClick={() => setZoneMode(val as ZoneMode)} style={{
              flex: 1, padding: '8px 4px', border: 'none', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', minHeight: 40,
              background: zoneMode === val ? '#1B3A6B' : '#fff',
              color: zoneMode === val ? '#fff' : '#6B7280',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Risk Filter */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontWeight: 600, color: '#1B3A6B' }}>Show campuses with score above</span>
          <span style={{ color: '#6B7280', fontSize: 13 }}>{riskThreshold}</span>
        </div>
        <input type="range" min={0} max={100} value={riskThreshold}
          onChange={e => setRiskThreshold(Number(e.target.value))}
          className="pulse-slider" style={{ background: sliderBg(riskPct) }} />
      </div>

      {/* Layers */}
      <div>
        <div style={{ fontWeight: 600, color: '#1B3A6B', marginBottom: 8 }}>Layers</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <LToggle label="Campus Markers" on={showCampuses} onToggle={() => setShowCampuses(v => !v)} />
          <LToggle label="Contagion Zones" on={showZones} onToggle={() => setShowZones(v => !v)} />
          <LToggle label="Incidents" on={showIncidents} onToggle={() => setShowIncidents(v => !v)} />
          <LToggle label="Network Lines" on={showConnections} onToggle={() => setShowConnections(v => !v)} />
          <LToggle label="Corridors" on={showCorridors} onToggle={() => setShowCorridors(v => !v)} />
        </div>
      </div>
    </div>
  );

  /* ═══ Render ═══ */
  return (
    <div style={fullscreen ? { position: 'fixed', inset: 0, zIndex: 9999, background: '#fff', display: 'flex', flexDirection: 'column' } : { marginBottom: 16 }}>
      <style>{KEYFRAMES}</style>

      {/* Fullscreen header */}
      {fullscreen && (
        <div style={{
          height: 48, background: 'linear-gradient(to bottom, rgba(27,58,107,0.95), rgba(27,58,107,0.7))',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px', color: '#fff', zIndex: 10001,
        }}>
          <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: 2, color: '#F0B429' }}>
            PULSE COMMAND CENTER — NOBLE SCHOOLS
          </span>
          <span style={{ fontSize: 13 }}>
            {new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </span>
        </div>
      )}

      {/* Filter chips */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 6,
        marginBottom: 8, padding: fullscreen ? '10px 16px 0' : 0,
      }}>
        {CHIPS.map(ch => (
          <button key={ch.key} onClick={() => setChipFilter(ch.key)} style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            border: '1px solid #D1D5DB', cursor: 'pointer', minHeight: 44,
            background: chipFilter === ch.key ? '#1B3A6B' : '#fff',
            color: chipFilter === ch.key ? '#fff' : '#4B5563',
          }}>{ch.label}</button>
        ))}
      </div>

      {/* Map */}
      <div style={{
        height: mapH, borderRadius: fullscreen ? 0 : 12,
        overflow: 'hidden', border: fullscreen ? 'none' : '1px solid #E5E7EB',
        position: 'relative', flex: fullscreen ? 1 : undefined,
      }}>
        <MapContainer center={CHICAGO_CENTER} zoom={11} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController fitTrigger={fitTrigger} />

          {/* Contagion zones */}
          {showZones && filteredZones.map(zone => {
            const zf = ZONE_FILLS[zone.phase];
            return (
              <Circle key={zone.incidentId} center={[zone.lat, zone.lng]} radius={zone.radius * MI_TO_M}
                pathOptions={{
                  color: zf.color, fillColor: zf.color, fillOpacity: zf.op,
                  weight: zone.phase === 'ACUTE' ? 2 : 1,
                  dashArray: zone.phase === 'WATCH' ? '4 4' : '6 4',
                }}>
                {zone.phase !== 'WATCH' && (
                  <Tooltip permanent direction="center">
                    <span style={{ fontSize: 9, fontWeight: 700, color: zf.color }}>{zone.phase}</span>
                  </Tooltip>
                )}
                <Popup>
                  <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                    <strong>{zone.phase}</strong> — Homicide
                    {zone.block && <><br />{zone.block}</>}
                    <br />{fmtAgo(zone.homicideDate)} — {zone.daysLeft}d remaining
                    {zone.retWin && <><br /><strong style={{ color: '#DC2626' }}>RETALIATION WINDOW ACTIVE</strong></>}
                  </div>
                </Popup>
              </Circle>
            );
          })}

          {/* Shared zone lines */}
          {showConnections && sharedZones.map(sz => {
            const pairs: [Campus, Campus][] = [];
            for (let i = 0; i < sz.campuses.length; i++)
              for (let j = i + 1; j < sz.campuses.length; j++)
                pairs.push([sz.campuses[i], sz.campuses[j]]);
            return pairs.map(([a, b]) => (
              <Polyline key={`${sz.zone.incidentId}-${a.id}-${b.id}`}
                positions={[[a.lat, a.lng], [b.lat, b.lng]]}
                pathOptions={{ color: '#DC2626', weight: 1.5, opacity: 0.4, dashArray: '4 4' }}>
                <Tooltip sticky>
                  <span style={{ fontSize: 10 }}>Shared zone — {sz.campuses.length} campuses affected</span>
                </Tooltip>
              </Polyline>
            ));
          })}

          {/* Corridor polygons */}
          {showCorridors && CORRIDORS.map(cor => {
            const coords = getCorridorPolygon(cor.campusIds);
            if (coords.length < 3) return null;
            const count = cor.campusIds.length;
            return (
              <Polygon key={cor.name} positions={coords}
                pathOptions={{
                  color: cor.color, fillColor: cor.color,
                  fillOpacity: 0.06, weight: 1, opacity: 0.3, dashArray: '6 4',
                }}>
                <Tooltip permanent direction="center">
                  <span style={{ fontSize: 11, fontWeight: 700, color: cor.color }}>
                    {cor.name} — {count} campuses
                  </span>
                </Tooltip>
              </Polygon>
            );
          })}

          {/* Incident markers — severity-scaled */}
          {showIncidents && filteredInc.map(inc => {
            const color = INC_COLORS[inc.type] ?? '#6B7280';
            const radius = inc.type === 'HOMICIDE' ? 12
              : inc.type === 'WEAPONS VIOLATION' ? 8
              : inc.type === 'CRIM SEXUAL ASSAULT' ? 8
              : inc.type === 'BATTERY' ? 6
              : 4;
            return (
              <CircleMarker key={inc.id} center={[inc.lat, inc.lng]} radius={radius}
                pathOptions={{
                  color, fillColor: color,
                  fillOpacity: inc.type === 'HOMICIDE' ? 0.85 : 0.6,
                  weight: inc.type === 'HOMICIDE' ? 2 : 1,
                }}>
                <Popup>
                  <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                    <strong>{inc.type}</strong><br />{inc.block}<br />{fmtAgo(inc.date)}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* Campus shield markers */}
          {showCampuses && CAMPUSES.map(campus => {
            const r = risks.find(rr => rr.campusId === campus.id);
            if (!r) return null;
            const isFaded = fadedCampusIds.has(campus.id);
            const colors = RISK_COLORS[r.label];
            return (
              <Marker key={campus.id} position={[campus.lat, campus.lng]}
                icon={campusIcons[campus.id]} opacity={isFaded ? 0.2 : 1}>
                <Popup>
                  <div style={{ fontSize: 13, lineHeight: 1.6, minWidth: 240 }}>
                    <strong style={{ fontSize: 15 }}>{campus.name}</strong>
                    <br /><span style={{ color: '#6B7280', fontSize: 12 }}>{campus.communityArea}</span>
                    <br />
                    <span style={{ fontSize: 28, fontWeight: 800, color: colors.color }}>{r.score}</span>
                    <span style={{
                      display: 'inline-block', marginLeft: 8,
                      padding: '2px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                      color: '#fff', background: colors.color,
                    }}>{r.label}</span>
                    <br /><span style={{ fontSize: 12, color: '#4B5563' }}>{getSituation(r)}</span>
                    <br /><span style={{ fontSize: 11, color: '#9CA3AF' }}>
                      Base {r.base} | Acute {r.acute} | Seasonal {r.seasonal}
                    </span>
                    {r.contagionZones.length > 0 && (
                      <><br /><span style={{ fontSize: 11, color: '#D97706' }}>
                        {r.contagionZones.filter(z => z.phase === 'ACUTE').length} ACUTE,{' '}
                        {r.contagionZones.filter(z => z.phase === 'ACTIVE').length} ACTIVE zones
                      </span></>
                    )}
                    <br />
                    <span style={{ fontSize: 11, color: '#6B7280' }}>
                      {r.closeCount} within 0.5mi/24h | {r.nearCount} within 1mi/7d
                    </span>
                    <br />
                    <a href="#" onClick={e => { e.preventDefault(); onSelectCampus(campus.id); }}
                      style={{ fontSize: 12, color: '#1B3A6B', fontWeight: 600 }}>
                      View Full Campus →
                    </a>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Map buttons */}
        <div style={{
          position: 'absolute', top: 10, right: 10, zIndex: 1000,
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <MapBtn label={'⊞ Fit all'} onClick={() => setFitTrigger(n => n + 1)} />
          <MapBtn label={fullscreen ? '✕ Exit' : '⛶ Command Center'} onClick={() => { setFullscreen(f => !f); setPanelOpen(true); }} />
        </div>

        {/* Intelligence overlay — always visible on map */}
        {(fullscreen || !isMobile) && (
          <div style={{
            position: 'absolute', top: fullscreen ? 58 : 10, right: fullscreen ? 60 : 60,
            width: intelOpen ? 260 : 44, zIndex: 1000,
            background: fullscreen ? 'rgba(27,58,107,0.92)' : 'rgba(255,255,255,0.95)',
            borderRadius: 10, boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            overflow: 'hidden', transition: 'width 300ms ease',
          }}>
            <button onClick={() => setIntelOpen(v => !v)} style={{
              width: '100%', padding: '8px 12px', border: 'none',
              background: 'transparent', cursor: 'pointer', textAlign: 'left',
              color: fullscreen ? '#F0B429' : '#1B3A6B', fontWeight: 700, fontSize: 12,
            }}>
              {intelOpen ? '▼ NETWORK STATUS' : '▶'}
            </button>
            {intelOpen && (
              <div style={{
                padding: '0 12px 12px', fontSize: 12, lineHeight: 1.8,
                color: fullscreen ? '#E5E7EB' : '#374151',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Avg Risk:</span>
                  <span style={{ fontWeight: 700 }}>{intelStats.avgScore}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Elevated:</span>
                  <span style={{ fontWeight: 700 }}>{intelStats.elevated} of 18</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>ACUTE Zones:</span>
                  <span style={{ fontWeight: 700 }}>{intelStats.acuteCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>ICE:</span>
                  <span style={{ fontWeight: 700, color: intelStats.iceCount > 0 ? '#7C3AED' : (fullscreen ? '#16A34A' : '#16A34A') }}>
                    {intelStats.iceCount > 0 ? `${intelStats.iceCount} ALERTS` : 'CLEAR'}
                  </span>
                </div>
                <div style={{
                  borderTop: `1px solid ${fullscreen ? 'rgba(255,255,255,0.15)' : '#E5E7EB'}`,
                  marginTop: 6, paddingTop: 6,
                }}>
                  {intelStats.highestCampus && (
                    <div style={{ fontSize: 11 }}>
                      <span style={{ color: fullscreen ? '#9CA3AF' : '#6B7280' }}>Highest: </span>
                      <span style={{ fontWeight: 700 }}>
                        {intelStats.highestCampus.short} — {intelStats.highestScore} — {intelStats.highestLabel}
                      </span>
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: fullscreen ? '#9CA3AF' : '#6B7280', marginTop: 2 }}>
                    Incidents shown: {filteredInc.length}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Control Panel */}
      {fullscreen ? (
        <div style={{
          position: 'absolute', top: 60, left: 10,
          width: panelOpen ? 340 : 44, maxHeight: 'calc(100vh - 80px)',
          overflowY: 'auto', background: 'rgba(255,255,255,0.95)',
          borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          zIndex: 10000, transition: 'width 300ms ease',
        }}>
          <button onClick={() => setPanelOpen(p => !p)} style={{
            width: 44, height: 44, border: 'none', background: 'transparent',
            cursor: 'pointer', fontSize: 16, color: '#1B3A6B', fontWeight: 700,
          }}>{panelOpen ? '◀' : '▶'}</button>
          {panelOpen && controlPanel}
        </div>
      ) : (
        <div style={{
          border: '1px solid #E5E7EB', borderTop: 'none',
          borderRadius: '0 0 12px 12px', background: '#FAFAFA',
        }}>
          {controlPanel}
        </div>
      )}
    </div>
  );
}

/* ═══ Sub-components ═══ */

function MapBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: 'rgba(255,255,255,0.92)', border: '1px solid #D1D5DB',
      borderRadius: 8, padding: '6px 10px', fontSize: 13,
      cursor: 'pointer', color: '#1B3A6B', fontWeight: 600,
      boxShadow: '0 1px 4px rgba(0,0,0,0.1)', minHeight: 44,
    }}>{label}</button>
  );
}

function LToggle({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 10px', borderRadius: 8, border: '1px solid #E5E7EB',
      background: on ? '#EEF2F9' : '#fff', cursor: 'pointer', fontSize: 12,
      color: on ? '#1B3A6B' : '#9CA3AF', fontWeight: on ? 600 : 400, minHeight: 44,
    }}>
      <span style={{
        width: 10, height: 10, borderRadius: '50%',
        background: on ? '#16A34A' : '#D1D5DB', transition: 'background 200ms',
      }} />
      {label}
    </button>
  );
}
