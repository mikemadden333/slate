import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { useRoster } from '../scholar-context/RosterDataContext';
import AIEnrollmentAdvisor from './AIEnrollmentAdvisor';

const C = { card: '#161B22', border: '#30363D', text: '#E6EDF3', muted: '#8B949E', gold: '#F0B429', red: '#F85149', green: '#3FB950', amber: '#F59E0B' };

export default function AttritionRadar() {
  const { data, networkTotals } = useRoster();

  const campusData = useMemo(() =>
    [...data.campuses]
      .sort((a, b) => b.attrition - a.attrition)
      .map(c => ({
        name: c.short,
        attrition: +(c.attrition * 100).toFixed(1),
        studentsLost: Math.round(c.enrolled * c.attrition),
        revenueLost: +(c.enrolled * c.attrition * data.revenuePerPupil / 1_000_000).toFixed(2),
        color: c.attrition > 0.042 ? C.red : c.attrition > 0.034 ? C.amber : C.green,
      })),
  [data]);

  const networkAttritionLost = Math.round(networkTotals.enrolled * networkTotals.avgAttrition);
  const networkRevenueLost = +(networkTotals.enrolled * networkTotals.avgAttrition * data.revenuePerPupil / 1_000_000).toFixed(1);
  const onePointImprovement = Math.round(networkTotals.enrolled * 0.01);
  const onePointRevenue = +(onePointImprovement * data.revenuePerPupil / 1_000_000).toFixed(1);

  const historicalAttrition = data.historical.map(h => ({
    year: h.year,
    rate: +(h.attritionRate * 100).toFixed(1),
  }));

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Network Attrition Rate', value: `${(networkTotals.avgAttrition * 100).toFixed(1)}%`, sub: 'avg across 17 campuses', color: C.amber },
          { label: 'Students Lost to Attrition', value: networkAttritionLost.toLocaleString(), sub: 'annualized at current rate', color: C.red },
          { label: 'Revenue Impact', value: `$${networkRevenueLost}M`, sub: 'annual PCTC loss from attrition', color: C.red },
          { label: '1pt Improvement = ', value: `+${onePointImprovement} students`, sub: `+$${onePointRevenue}M revenue`, color: C.green },
        ].map((k, i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: k.color, fontFamily: "'DM Mono', monospace" }}>{k.value}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Campus attrition bar chart */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>Attrition by Campus</div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>Red &gt;4.2% · Amber 3.4–4.2% · Green &lt;3.4%</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={campusData} layout="vertical" barSize={12}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
              <XAxis type="number" tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: C.muted }} domain={[0, 6]} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: C.muted }} width={72} />
              <Tooltip
                contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text }}
                formatter={(v: number, name: string) => [`${v}%`, 'Attrition']}
              />
              <ReferenceLine x={3.4} stroke={C.amber} strokeDasharray="4 2" />
              <ReferenceLine x={4.2} stroke={C.red} strokeDasharray="4 2" />
              <Bar dataKey="attrition" radius={[0, 4, 4, 0]}>
                {campusData.map((c, i) => <Cell key={i} fill={c.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Historical trend + revenue table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 16 }}>Historical Attrition Rate</div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={historicalAttrition}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: C.muted }} />
                <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: C.muted }} domain={[0, 6]} />
                <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text }} />
                <Bar dataKey="rate" fill={C.gold} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>Revenue Cost by Campus</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {campusData.slice(0, 6).map(c => (
                <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: C.muted }}>{c.name}</span>
                  <span style={{ color: c.color, fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>
                    -{c.studentsLost} students · ${c.revenueLost}M
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AIEnrollmentAdvisor mode="attrition" />
    </div>
  );
}
