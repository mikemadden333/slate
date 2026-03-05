import { useMemo } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine, Area, AreaChart,
} from 'recharts';
import { useRoster } from '../roster-context/RosterDataContext';

const C = {
  bg: '#0D1117', card: '#161B22', border: '#30363D',
  text: '#E6EDF3', muted: '#8B949E', gold: '#F0B429',
  green: '#3FB950', red: '#F85149', blue: '#58A6FF', purple: '#BC8CFF',
};

const fmt = (n: number) => n.toLocaleString();
const fmtM = (n: number) => `$${n.toFixed(1)}M`;

export default function RosterCommandCenter() {
  const { data, networkTotals } = useRoster();

  const trendData = useMemo(() => {
    const hist = data.historical.map(h => ({
      year: h.year,
      enrolled: h.totalEnrolled,
      target: null as number | null,
      optimistic: null as number | null,
      probable: null as number | null,
      pessimistic: null as number | null,
      revenue: +(h.totalEnrolled * h.revenuePerPupil / 1_000_000).toFixed(1),
    }));
    const forecasts = data.forecasts.map(f => ({
      year: f.year,
      enrolled: null as number | null,
      target: data.targetEnrollment,
      optimistic: f.optimistic,
      probable: f.probable,
      pessimistic: f.pessimistic,
      revenue: +f.revenueProbable.toFixed(1),
    }));
    return [...hist, ...forecasts];
  }, [data]);

  const currentVsTarget = networkTotals.enrolled - data.targetEnrollment;
  const currentVsPriorYear = networkTotals.enrolled - (data.historical[data.historical.length - 2]?.totalEnrolled ?? 0);
  const revenueRisk = Math.abs(Math.min(0, currentVsTarget)) * data.revenuePerPupil / 1_000_000;

  const kpis = [
    {
      label: 'Total Enrolled', value: fmt(networkTotals.enrolled),
      sub: `${currentVsTarget >= 0 ? '+' : ''}${fmt(currentVsTarget)} vs target`,
      color: currentVsTarget >= 0 ? C.green : C.red,
    },
    {
      label: 'SY26 Target', value: fmt(data.targetEnrollment),
      sub: `${(networkTotals.enrolled / data.targetEnrollment * 100).toFixed(1)}% achieved`,
      color: C.gold,
    },
    {
      label: 'vs Prior Year', value: `${currentVsPriorYear >= 0 ? '+' : ''}${fmt(currentVsPriorYear)}`,
      sub: `SY25: ${fmt(data.historical[data.historical.length - 2]?.totalEnrolled ?? 0)}`,
      color: currentVsPriorYear >= 0 ? C.green : C.red,
    },
    {
      label: 'Capacity Utilization', value: `${networkTotals.utilizationPct.toFixed(1)}%`,
      sub: `${fmt(networkTotals.capacity - networkTotals.enrolled)} seats available`,
      color: networkTotals.utilizationPct > 95 ? C.green : networkTotals.utilizationPct > 85 ? C.gold : C.red,
    },
    {
      label: 'Applications', value: fmt(networkTotals.applied),
      sub: `${(networkTotals.accepted / networkTotals.applied * 100).toFixed(0)}% acceptance rate`,
      color: C.blue,
    },
    {
      label: 'Revenue at Risk', value: revenueRisk > 0 ? fmtM(revenueRisk) : '$0',
      sub: revenueRisk > 0 ? 'from enrollment gap' : 'On or above target',
      color: revenueRisk > 0 ? C.red : C.green,
    },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 28 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: k.color, fontFamily: "'DM Mono', monospace" }}>{k.value}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Main trend chart */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>Enrollment Trajectory — Historical & Forecast</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>
          SY20–SY26 actuals · SY27–SY30 scenario projections · Target: {fmt(data.targetEnrollment)} students
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: C.muted }} />
            <YAxis domain={[9000, 14000]} tickFormatter={v => v.toLocaleString()} tick={{ fontSize: 11, fill: C.muted }} />
            <Tooltip
              contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text }}
              formatter={(v: number, name: string) => [v?.toLocaleString() ?? '—', name]}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: C.muted }} />
            <ReferenceLine y={data.targetEnrollment} stroke={C.gold} strokeDasharray="6 3" label={{ value: 'Target', fill: C.gold, fontSize: 10 }} />
            <Bar dataKey="enrolled" name="Actual Enrolled" fill={C.blue} radius={[3, 3, 0, 0]} maxBarSize={40} />
            <Line dataKey="optimistic" name="Optimistic" stroke={C.green} strokeWidth={2} dot={false} strokeDasharray="4 2" connectNulls />
            <Line dataKey="probable" name="Probable" stroke={C.gold} strokeWidth={2.5} dot={false} connectNulls />
            <Line dataKey="pessimistic" name="Pessimistic" stroke={C.red} strokeWidth={2} dot={false} strokeDasharray="4 2" connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue trend */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>CPS Revenue Tied to Enrollment</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>
          Each student = ${fmt(data.revenuePerPupil)}/yr in PCTC funding · 100-student swing = ${(data.revenuePerPupil * 100 / 1_000_000).toFixed(1)}M
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: C.muted }} />
            <YAxis tickFormatter={v => `$${v}M`} tick={{ fontSize: 11, fill: C.muted }} />
            <Tooltip
              contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text }}
              formatter={(v: number) => [`$${v?.toFixed(1)}M`, 'Revenue']}
            />
            <Area dataKey="revenue" name="Revenue" stroke={C.gold} fill={C.gold} fillOpacity={0.15} strokeWidth={2} connectNulls />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Campus utilization table */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16 }}>Campus Enrollment vs Target</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[...data.campuses].sort((a, b) => (b.enrolled / b.capacity) - (a.enrolled / a.capacity)).map(c => {
            const pct = c.enrolled / c.capacity;
            const color = pct >= 0.96 ? C.green : pct >= 0.88 ? C.gold : C.red;
            return (
              <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: '0 0 160px', fontSize: 12, color: C.text, fontWeight: 600 }}>{c.short}</div>
                <div style={{ flex: 1, height: 8, background: '#21262D', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(pct * 100, 100)}%`, height: '100%', background: color, borderRadius: 4 }} />
                </div>
                <div style={{ flex: '0 0 100px', textAlign: 'right', fontSize: 12, fontFamily: "'DM Mono', monospace", color }}>
                  {fmt(c.enrolled)} / {fmt(c.capacity)}
                </div>
                <div style={{ flex: '0 0 55px', textAlign: 'right', fontSize: 12, fontWeight: 700, color }}>
                  {(pct * 100).toFixed(1)}%
                </div>
                <div style={{ flex: '0 0 70px', textAlign: 'right', fontSize: 11, color: c.attrition > 0.04 ? C.red : C.muted }}>
                  {(c.attrition * 100).toFixed(1)}% atr
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
