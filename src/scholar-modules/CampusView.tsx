import { useState } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { useRoster } from '../scholar-context/RosterDataContext';

const C = {
  bg: '#0D1117', card: '#161B22', border: '#30363D',
  text: '#E6EDF3', muted: '#8B949E', gold: '#F0B429',
  green: '#3FB950', red: '#F85149', blue: '#58A6FF', purple: '#BC8CFF',
};

const YEARS_HIST  = ['SY18','SY19','SY20','SY21','SY22','SY23','SY24','SY25'];
const YEARS_PROJ  = ['SY26','SY27','SY28','SY29','SY30'];

export default function CampusView() {
  const { data } = useRoster();
  const [selectedName, setSelectedName] = useState(data.campuses[0].name);
  const [aiResponse, setAiResponse]     = useState('');
  const [aiLoading, setAiLoading]       = useState(false);
  const [aiRan, setAiRan]               = useState(false);

  const campus = data.campuses.find(c => c.name === selectedName)!;

  // Build chart data — history bars + forecast lines
  const chartData = [
    ...YEARS_HIST.map((yr, i) => ({
      year: yr,
      actual: campus.history[i] ?? null,
      forecast: null as number | null,
    })),
    ...YEARS_PROJ.map((yr, i) => ({
      year: yr,
      actual: null as number | null,
      forecast: campus.forecast[i] ?? null,
    })),
  ];

  const sy25 = campus.history[7];
  const sy26 = campus.forecast[0];
  const sy30 = campus.forecast[4];
  const delta2526 = sy26 !== undefined && sy25 !== undefined ? sy26 - sy25 : null;
  const delta2530 = sy30 !== undefined && sy25 !== undefined ? sy30 - sy25 : null;
  const utilPct   = sy25 / campus.capacity * 100;

  // Grade breakdown (HS only — grade6-8 not tracked for most campuses)
  const gradeTotal = campus.grade9 + campus.grade10 + campus.grade11 + campus.grade12;
  const grades = [
    { label: '9th', value: campus.grade9 },
    { label: '10th', value: campus.grade10 },
    { label: '11th', value: campus.grade11 },
    { label: '12th', value: campus.grade12 },
  ];

  const analyze = async () => {
    setAiLoading(true);
    setAiResponse('');
    setAiRan(true);

    const histStr = YEARS_HIST.map((yr, i) => `${yr}: ${campus.history[i] ?? 'N/A'}`).join(', ');
    const projStr = YEARS_PROJ.map((yr, i) => `${yr}: ${campus.forecast[i] ?? 'N/A'}`).join(', ');

    const prompt = `
NOBLE SCHOOLS — CAMPUS ENROLLMENT ANALYSIS
Campus: ${campus.name}
SY25 Enrolled: ${sy25} / Capacity: ${campus.capacity} (${utilPct.toFixed(1)}% utilization)
SY26 Projected: ${sy26} (${delta2526 !== null ? (delta2526 >= 0 ? '+' : '') + delta2526 : 'N/A'} vs SY25)
SY30 Projected: ${sy30} (${delta2530 !== null ? (delta2530 >= 0 ? '+' : '') + delta2530 : 'N/A'} vs SY25)
Yield Rate: ${(campus.yield * 100).toFixed(1)}%
Attrition Rate: ${(campus.attrition * 100).toFixed(1)}%
Applications: ${campus.applied.toLocaleString()} | Accepted: ${campus.accepted.toLocaleString()}
Grade breakdown (SY25): 9th=${campus.grade9}, 10th=${campus.grade10}, 11th=${campus.grade11}, 12th=${campus.grade12}

C1 Actuals (SY18–SY25): ${histStr}
C1 Projections (SY26–SY30): ${projStr}

You are an enrollment strategist. Analyze this campus in 3 parts:
1. What the historical trend tells us — is this campus growing, declining, or volatile? Why?
2. What the SY26–SY30 projection implies for this campus and any risks to watch.
3. One specific, actionable recommendation for the enrollment director at this campus.
Under 200 words. Use actual numbers. No platitudes.`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const json = await res.json();
      const text = json.content?.map((b: { type: string; text?: string }) =>
        b.type === 'text' ? b.text : '').join('') ?? 'No response.';
      setAiResponse(text);
    } catch {
      setAiResponse('Analysis unavailable.');
    } finally {
      setAiLoading(false);
    }
  };

  // Reset AI when campus changes
  const handleCampusChange = (name: string) => {
    setSelectedName(name);
    setAiResponse('');
    setAiRan(false);
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Campus selector */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          Select Campus
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {data.campuses.map(c => (
            <button
              key={c.name}
              onClick={() => handleCampusChange(c.name)}
              style={{
                padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', border: `1px solid ${selectedName === c.name ? C.gold : C.border}`,
                background: selectedName === c.name ? C.gold + '22' : C.card,
                color: selectedName === c.name ? C.gold : C.muted,
                transition: 'all 0.15s',
              }}
            >
              {c.short}
            </button>
          ))}
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          {
            label: 'SY25 Enrolled', value: sy25?.toLocaleString() ?? '—',
            sub: `of ${campus.capacity.toLocaleString()} capacity`, color: C.blue,
          },
          {
            label: 'Utilization', value: `${utilPct.toFixed(1)}%`,
            sub: utilPct >= 95 ? 'At capacity' : `${(campus.capacity - sy25).toLocaleString()} seats open`,
            color: utilPct >= 95 ? C.green : utilPct >= 85 ? C.gold : C.red,
          },
          {
            label: 'SY26 Projected', value: sy26?.toLocaleString() ?? '—',
            sub: delta2526 !== null ? `${delta2526 >= 0 ? '+' : ''}${delta2526} vs SY25` : '',
            color: delta2526 !== null && delta2526 >= 0 ? C.green : C.red,
          },
          {
            label: 'SY30 Projected', value: sy30?.toLocaleString() ?? '—',
            sub: delta2530 !== null ? `${delta2530 >= 0 ? '+' : ''}${delta2530} vs SY25` : '',
            color: delta2530 !== null && delta2530 >= 0 ? C.green : C.red,
          },
          {
            label: 'Yield Rate', value: `${(campus.yield * 100).toFixed(1)}%`,
            sub: `${campus.accepted.toLocaleString()} offers → enrolled`,
            color: campus.yield >= 0.52 ? C.green : campus.yield >= 0.42 ? C.gold : C.red,
          },
          {
            label: 'Attrition Rate', value: `${(campus.attrition * 100).toFixed(1)}%`,
            sub: `~${Math.round(sy25 * campus.attrition)} students/yr`,
            color: campus.attrition > 0.042 ? C.red : campus.attrition > 0.034 ? C.gold : C.green,
          },
        ].map((k, i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: k.color, fontFamily: "'DM Mono', monospace" }}>{k.value}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Trend chart */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>
          {campus.name} — Enrollment Trend
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>
          SY18–SY25 C1 actuals · SY26–SY30 C1 projected (EHH eliminated FY26)
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: C.muted }} />
            <YAxis
              domain={[0, Math.ceil((campus.capacity * 1.05) / 100) * 100]}
              tickFormatter={v => v.toLocaleString()}
              tick={{ fontSize: 11, fill: C.muted }}
            />
            <Tooltip
              contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text }}
              formatter={(v: number, name: string) => [v?.toLocaleString() ?? '—', name]}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: C.muted }} />
            <ReferenceLine
              y={campus.capacity}
              stroke={C.purple}
              strokeDasharray="6 3"
              label={{ value: 'Capacity', fill: C.purple, fontSize: 10, position: 'right' }}
            />
            <Bar dataKey="actual" name="Actual (C1)" fill={C.blue} radius={[3,3,0,0]} maxBarSize={44} />
            <Line
              dataKey="forecast" name="Projected (C1)" stroke={C.gold}
              strokeWidth={2.5} dot={{ fill: C.gold, r: 4 }} connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Grade breakdown */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16 }}>
          Grade Distribution — SY25
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {grades.map(g => {
            const pct = gradeTotal > 0 ? g.value / gradeTotal * 100 : 0;
            // Cohort shrink from 9→12 is natural; flag if drop >15%
            const expectedDrop = g.label !== '9th' ? grades[0].value * (1 - campus.attrition) ** (grades.indexOf(g)) : null;
            return (
              <div key={g.label} style={{ flex: 1, background: '#21262D', borderRadius: 10, padding: '16px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>Grade {g.label}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: C.text, fontFamily: "'DM Mono', monospace" }}>
                  {g.value}
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{pct.toFixed(1)}% of school</div>
                {/* Visual bar */}
                <div style={{ height: 4, background: C.border, borderRadius: 2, marginTop: 10, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: C.blue, borderRadius: 2 }} />
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 12, fontSize: 11, color: C.muted }}>
          9th→12th cohort retention: {gradeTotal > 0 ? ((campus.grade12 / campus.grade9) * 100).toFixed(1) : '—'}%
          · Avg attrition per grade: ~{Math.round((campus.grade9 - campus.grade12) / 3)} students
        </div>
      </div>

      {/* AI campus analysis */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>AI Campus Analysis — {campus.short}</span>
          {aiRan && !aiLoading && (
            <button onClick={analyze} style={{
              marginLeft: 'auto', fontSize: 11, color: C.muted, background: 'none',
              border: `1px solid ${C.border}`, borderRadius: 6, padding: '3px 10px', cursor: 'pointer',
            }}>Re-analyze</button>
          )}
        </div>
        {!aiRan && (
          <button onClick={analyze} style={{
            padding: '9px 20px', borderRadius: 8, background: C.gold, color: '#000',
            fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer',
          }}>Analyze {campus.short}</button>
        )}
        {aiLoading && <div style={{ fontSize: 13, color: C.muted, fontStyle: 'italic' }}>Analyzing {campus.short}...</div>}
        {aiResponse && <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{aiResponse}</div>}
      </div>

    </div>
  );
}
