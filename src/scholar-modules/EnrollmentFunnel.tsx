import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis } from 'recharts';
import { useRoster } from '../roster-context/RosterDataContext';
import AIEnrollmentAdvisor from './AIEnrollmentAdvisor';

const C = { card: '#161B22', border: '#30363D', text: '#E6EDF3', muted: '#8B949E', gold: '#F0B429', red: '#F85149', green: '#3FB950', blue: '#58A6FF', amber: '#F59E0B' };

export default function EnrollmentFunnel() {
  const { data, networkTotals } = useRoster();

  const funnelSteps = [
    { stage: 'Applied', value: networkTotals.applied, pct: 100 },
    { stage: 'Accepted', value: networkTotals.accepted, pct: +(networkTotals.accepted / networkTotals.applied * 100).toFixed(1) },
    { stage: 'Enrolled', value: networkTotals.enrolled, pct: +(networkTotals.enrolled / networkTotals.applied * 100).toFixed(1) },
  ];

  const campusYield = useMemo(() =>
    [...data.campuses].sort((a, b) => b.yield - a.yield).map(c => ({
      name: c.short,
      yield: +(c.yield * 100).toFixed(1),
      applied: c.applied,
      enrolled: c.enrolled,
      color: c.yield > 0.52 ? C.green : c.yield > 0.42 ? C.gold : C.red,
    })),
  [data]);

  const fivePointImprovement = Math.round(networkTotals.accepted * 0.05);
  const fivePointRevenue = +(fivePointImprovement * data.revenuePerPupil / 1_000_000).toFixed(1);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Applications', value: networkTotals.applied.toLocaleString(), sub: `${data.sy} cycle`, color: C.blue },
          { label: 'Acceptance Rate', value: `${(networkTotals.accepted / networkTotals.applied * 100).toFixed(1)}%`, sub: `${networkTotals.accepted.toLocaleString()} offers extended`, color: C.gold },
          { label: 'Network Yield Rate', value: `${(networkTotals.avgYield * 100).toFixed(1)}%`, sub: 'accepted → enrolled', color: networkTotals.avgYield > 0.55 ? C.green : C.amber },
          { label: '+5pt Yield = ', value: `+${fivePointImprovement} students`, sub: `+$${fivePointRevenue}M revenue`, color: C.green },
        ].map((k, i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: k.color, fontFamily: "'DM Mono', monospace" }}>{k.value}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 20, marginBottom: 24 }}>
        {/* Funnel */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 20 }}>Network Funnel</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {funnelSteps.map((s, i) => (
              <div key={s.stage}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{s.stage}</span>
                  <span style={{ fontSize: 13, fontFamily: "'DM Mono', monospace", color: C.gold, fontWeight: 700 }}>
                    {s.value.toLocaleString()} ({s.pct}%)
                  </span>
                </div>
                <div style={{ height: 20, background: '#21262D', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{
                    width: `${s.pct}%`, height: '100%', borderRadius: 6,
                    background: i === 0 ? C.blue : i === 1 ? C.gold : C.green,
                    transition: 'width 0.5s',
                  }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 24, padding: '14px 16px', background: '#21262D', borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Funnel conversion (apply → enroll)</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.text, fontFamily: "'DM Mono', monospace" }}>
              {(networkTotals.enrolled / networkTotals.applied * 100).toFixed(1)}%
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
              {networkTotals.applied - networkTotals.enrolled} applicants did not enroll
            </div>
          </div>
        </div>

        {/* Yield by campus */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>Yield Rate by Campus</div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>Green &gt;52% · Amber 42–52% · Red &lt;42%</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={campusYield} layout="vertical" barSize={12}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
              <XAxis type="number" tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: C.muted }} domain={[0, 70]} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: C.muted }} width={72} />
              <Tooltip
                contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text }}
                formatter={(v: number) => [`${v}%`, 'Yield']}
              />
              <Bar dataKey="yield" radius={[0, 4, 4, 0]}>
                {campusYield.map((c, i) => <Cell key={i} fill={c.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <AIEnrollmentAdvisor mode="funnel" />
    </div>
  );
}
