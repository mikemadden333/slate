import { useMemo } from 'react';
import {
  BarChart, Bar,
  ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer, Cell, ZAxis,
} from 'recharts';
import { NOBLE, BG, TEXT, STATUS } from '../theme/colors';
import { fmtNum } from '../theme/formatters';
import { CAMPUSES, CAMPUS_STATS } from '../sentinel-data/campuses';
import SectionHeader from '../sentinel-components/SectionHeader';
import CustomTooltip from '../sentinel-components/CustomTooltip';

interface CampusNetworkContextProps {
  campusName: string;
}

export default function CampusNetworkContext({ campusName }: CampusNetworkContextProps) {
  const campus = CAMPUSES.find(c => c.name === campusName);
  if (!campus) return <div style={{ color: TEXT.primary, padding: 40 }}>Campus not found.</div>;

  const sortedByPerPupil = useMemo(() =>
    [...CAMPUSES].sort((a, b) => b.perPupil - a.perPupil),
  []);

  // Scatter data
  const scatterData = useMemo(() =>
    CAMPUSES.map(c => ({
      name: c.name,
      x: c.applications,
      y: Math.round(c.retention * 100),
      isSelected: c.name === campusName,
    })),
  [campusName]);

  // Medians for quadrant lines
  const medianApps = useMemo(() => {
    const sorted = [...CAMPUSES].map(c => c.applications).sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  }, []);

  const medianRetention = useMemo(() => {
    const sorted = [...CAMPUSES].map(c => Math.round(c.retention * 100)).sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  }, []);

  // Rankings
  const rankings = useMemo(() => {
    const byEnrollment = [...CAMPUSES].sort((a, b) => b.ehh - a.ehh);
    const byRetention = [...CAMPUSES].sort((a, b) => b.retention - a.retention);
    const byApps = [...CAMPUSES].sort((a, b) => b.applications - a.applications);
    const byPerPupil = [...CAMPUSES].sort((a, b) => a.perPupil - b.perPupil); // lower is better

    return [
      { label: 'Enrollment', rank: byEnrollment.findIndex(c => c.name === campusName) + 1, value: fmtNum(campus.ehh) },
      { label: 'Retention', rank: byRetention.findIndex(c => c.name === campusName) + 1, value: `${Math.round(campus.retention * 100)}%` },
      { label: 'Applications', rank: byApps.findIndex(c => c.name === campusName) + 1, value: fmtNum(campus.applications) },
      { label: 'Per-Pupil Cost', rank: byPerPupil.findIndex(c => c.name === campusName) + 1, value: `$${fmtNum(campus.perPupil)}` },
    ];
  }, [campus, campusName]);

  return (
    <div>
      <SectionHeader
        title="Network Context"
        subtitle={`Where ${campusName} sits among all 17 Noble campuses`}
      />

      {/* SECTION 1 — Per-Pupil Comparison */}
      <div style={{
        background: BG.card,
        border: `1px solid ${BG.border}`,
        borderRadius: 12,
        padding: '20px 20px 16px',
        marginBottom: 32,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <h3 style={{
          fontSize: 15,
          fontWeight: 600,
          color: TEXT.primary,
          fontFamily: "'DM Sans', sans-serif",
          margin: '0 0 16px',
        }}>
          Per-Pupil Allocation — All Campuses
        </h3>
        <ResponsiveContainer width="100%" height={520}>
          <BarChart
            data={sortedByPerPupil}
            layout="vertical"
            margin={{ top: 4, right: 40, left: 8, bottom: 0 }}
          >
            <CartesianGrid stroke={BG.border} strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: TEXT.muted, fontSize: 11, fontFamily: "'DM Mono', monospace" }}
              axisLine={{ stroke: BG.border }}
              tickLine={false}
              tickFormatter={(v: number) => `$${fmtNum(v)}`}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              tick={{ fill: TEXT.muted, fontSize: 12, fontFamily: "'Inter', sans-serif" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip formatter={(v: number) => `$${fmtNum(v)}`} />} />
            <ReferenceLine
              x={CAMPUS_STATS.networkAvgPerPupil}
              stroke={STATUS.amber}
              strokeDasharray="6 3"
              label={{ value: `$${fmtNum(CAMPUS_STATS.networkAvgPerPupil)} avg`, fill: STATUS.amber, fontSize: 11, position: 'top' }}
            />
            <Bar dataKey="perPupil" name="Per Pupil $" radius={[0, 4, 4, 0]} barSize={16}>
              {sortedByPerPupil.map((c, i) => (
                <Cell
                  key={i}
                  fill={c.name === campusName ? NOBLE.gold : TEXT.dim}
                  fillOpacity={c.name === campusName ? 1 : 0.5}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* SECTION 2 — Demand vs Retention Scatter */}
      <SectionHeader title="Demand vs Retention" subtitle="Applications (x) vs Retention % (y) — top-right is strongest" />
      <div style={{
        background: BG.card,
        border: `1px solid ${BG.border}`,
        borderRadius: 12,
        padding: '20px 20px 16px',
        marginBottom: 32,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <ResponsiveContainer width="100%" height={380}>
          <ScatterChart margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
            <CartesianGrid stroke={BG.border} strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="x"
              name="Applications"
              tick={{ fill: TEXT.muted, fontSize: 11, fontFamily: "'DM Mono', monospace" }}
              axisLine={{ stroke: BG.border }}
              tickLine={false}
              label={{ value: 'Applications', position: 'insideBottomRight', offset: -4, style: { fill: TEXT.muted, fontSize: 11 } }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Retention %"
              domain={[82, 96]}
              tick={{ fill: TEXT.muted, fontSize: 11, fontFamily: "'DM Mono', monospace" }}
              axisLine={false}
              tickLine={false}
              label={{ value: 'Retention %', angle: -90, position: 'insideLeft', style: { fill: TEXT.muted, fontSize: 11 } }}
            />
            <ZAxis range={[80, 80]} />
            <ReferenceLine x={medianApps} stroke={BG.border} strokeDasharray="4 4" />
            <ReferenceLine y={medianRetention} stroke={BG.border} strokeDasharray="4 4" />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div style={{
                    background: NOBLE.navyDark,
                    border: `1px solid ${NOBLE.navy}`,
                    borderRadius: 8,
                    padding: '8px 12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}>
                    <div style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
                      {d.name}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, fontFamily: "'DM Mono', monospace" }}>
                      {fmtNum(d.x)} apps · {d.y}% retention
                    </div>
                  </div>
                );
              }}
            />
            <Scatter data={scatterData.filter(d => !d.isSelected)} name="Other Campuses">
              {scatterData.filter(d => !d.isSelected).map((_, i) => (
                <Cell key={i} fill={TEXT.dim} fillOpacity={0.5} />
              ))}
            </Scatter>
            <Scatter data={scatterData.filter(d => d.isSelected)} name={campusName}>
              {scatterData.filter(d => d.isSelected).map((_, i) => (
                <Cell key={i} fill={NOBLE.gold} r={10} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <div style={{
          textAlign: 'center',
          fontSize: 12,
          color: TEXT.dim,
          fontFamily: "'Inter', sans-serif",
          marginTop: 4,
        }}>
          Top-right quadrant = High Demand / High Retention
        </div>
      </div>

      {/* SECTION 3 — Campus Rankings */}
      <SectionHeader title="Campus Rankings" subtitle={`${campusName} position out of 17 campuses`} />
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16,
        marginBottom: 32,
      }}>
        {rankings.map(r => (
          <div key={r.label} style={{
            background: BG.card,
            border: `1px solid ${BG.border}`,
            borderRadius: 12,
            padding: '20px 24px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <div style={{ fontSize: 12, color: TEXT.muted, fontFamily: "'Inter', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              {r.label}
            </div>
            <div style={{
              fontSize: 32,
              fontFamily: "'DM Mono', monospace",
              fontWeight: 700,
              color: r.rank <= 5 ? STATUS.green : r.rank <= 12 ? TEXT.primary : STATUS.red,
              lineHeight: 1,
              marginBottom: 4,
            }}>
              #{r.rank}
            </div>
            <div style={{ fontSize: 13, fontFamily: "'DM Mono', monospace", color: TEXT.muted }}>
              {r.value}
            </div>
            <div style={{ fontSize: 11, color: TEXT.dim, marginTop: 2 }}>
              of 17
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
