import { useState } from 'react';

const C = {
  bg: '#F8F9FA', card: '#FFFFFF', border: '#E5E7EB',
  navy: '#1B2A4A', text: '#1F2937', muted: '#6B7280',
  orange: '#F97316', gold: '#F0B429',
  green: '#059669', blue: '#0EA5E9', red: '#DC2626', amber: '#D97706',
};

const condColor = (c: string) =>
  c === 'excellent' ? C.green : c === 'good' ? C.blue : c === 'fair' ? C.amber : C.red;

const CAMPUSES_FACILITIES = [
  { name: 'Baker College Prep',         short: 'Baker',    sqft: 90000,  condition: 'good',      openWO: 1, capProjects: 0, built: 2009, hvac: 'good',      roof: 'good'      },
  { name: 'Chicago Bulls College Prep', short: 'Bulls',    sqft: 98000,  condition: 'good',      openWO: 1, capProjects: 1, built: 2012, hvac: 'excellent', roof: 'excellent' },
  { name: 'Butler College Prep',        short: 'Butler',   sqft: 88000,  condition: 'good',      openWO: 3, capProjects: 0, built: 2003, hvac: 'fair',      roof: 'good'      },
  { name: 'Gary Comer College Prep',    short: 'Comer',    sqft: 110000, condition: 'excellent', openWO: 1, capProjects: 0, built: 2008, hvac: 'good',      roof: 'good'      },
  { name: 'DRW College Prep',           short: 'DRW',      sqft: 105000, condition: 'excellent', openWO: 0, capProjects: 0, built: 2014, hvac: 'excellent', roof: 'excellent' },
  { name: 'Golder College Prep',        short: 'Golder',   sqft: 82000,  condition: 'fair',      openWO: 4, capProjects: 1, built: 1997, hvac: 'fair',      roof: 'poor'      },
  { name: 'Hansberry College Prep',     short: 'Hansberry',sqft: 84000,  condition: 'fair',      openWO: 4, capProjects: 1, built: 1999, hvac: 'fair',      roof: 'fair'      },
  { name: 'Johnson College Prep',       short: 'Johnson',  sqft: 92000,  condition: 'good',      openWO: 2, capProjects: 0, built: 2006, hvac: 'good',      roof: 'good'      },
  { name: 'Mansueto High School',       short: 'Mansueto', sqft: 94000,  condition: 'good',      openWO: 2, capProjects: 1, built: 2007, hvac: 'good',      roof: 'good'      },
  { name: 'Muchin College Prep',        short: 'Muchin',   sqft: 78000,  condition: 'fair',      openWO: 6, capProjects: 2, built: 1995, hvac: 'poor',      roof: 'fair'      },
  { name: 'Noble Street College Prep',  short: 'Noble St', sqft: 95000,  condition: 'good',      openWO: 2, capProjects: 1, built: 2000, hvac: 'good',      roof: 'fair'      },
  { name: 'Pritzker College Prep',      short: 'Pritzker', sqft: 102000, condition: 'excellent', openWO: 0, capProjects: 0, built: 2010, hvac: 'excellent', roof: 'good'      },
  { name: 'Rauner College Prep',        short: 'Rauner',   sqft: 88000,  condition: 'fair',      openWO: 5, capProjects: 2, built: 1998, hvac: 'fair',      roof: 'poor'      },
  { name: 'Rowe-Clark Math & Science',  short: 'Rowe',     sqft: 86000,  condition: 'good',      openWO: 2, capProjects: 0, built: 2005, hvac: 'good',      roof: 'fair'      },
  { name: 'ITW David Speer Academy',    short: 'Speer',    sqft: 86000,  condition: 'good',      openWO: 2, capProjects: 0, built: 2005, hvac: 'good',      roof: 'fair'      },
  { name: 'The Noble Academy',          short: 'TNA',      sqft: 76000,  condition: 'fair',      openWO: 4, capProjects: 1, built: 1996, hvac: 'fair',      roof: 'fair'      },
  { name: 'UIC College Prep',           short: 'UIC',      sqft: 85000,  condition: 'good',      openWO: 3, capProjects: 1, built: 2004, hvac: 'good',      roof: 'good'      },
];

const totalSqft = CAMPUSES_FACILITIES.reduce((a, c) => a + c.sqft, 0);
const totalWO   = CAMPUSES_FACILITIES.reduce((a, c) => a + c.openWO, 0);
const totalCap  = CAMPUSES_FACILITIES.reduce((a, c) => a + c.capProjects, 0);
const poorCount = CAMPUSES_FACILITIES.filter(c => c.condition === 'poor' || c.condition === 'fair').length;

export default function GroundsApp() {
  const [sortBy, setSortBy] = useState<'workOrders' | 'condition' | 'name'>('workOrders');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRan, setAiRan] = useState(false);
  const [freeform, setFreeform] = useState('');

  const condRank: Record<string, number> = { excellent: 0, good: 1, fair: 2, poor: 3 };
  const sorted = [...CAMPUSES_FACILITIES].sort((a, b) =>
    sortBy === 'name' ? a.name.localeCompare(b.name) :
    sortBy === 'condition' ? (condRank[b.condition] ?? 0) - (condRank[a.condition] ?? 0) :
    b.openWO - a.openWO
  );

  const analyzeGrounds = async (question?: string) => {
    setAiLoading(true);
    setAiResponse('');
    setAiRan(true);
    const context = `
NOBLE SCHOOLS — FACILITIES & OPERATIONS — FY26
Network: 17 campuses · ${(totalSqft / 1_000_000).toFixed(2)}M sq ft total
Open Work Orders: ${totalWO} · Capital Projects Active: ${totalCap}
Campuses in Fair/Poor Condition: ${poorCount} of 17
Meals Served Daily: 6,200

CAMPUS FACILITY STATUS:
${CAMPUSES_FACILITIES.map(c => `${c.short}: ${c.condition} condition, ${c.openWO} WOs, HVAC: ${c.hvac}, Roof: ${c.roof}, Built: ${c.built}`).join('\n')}
`;
    const prompt = question
      ? `${context}\n\nQuestion: ${question}\n\nAnswer specifically using the campus data above. Under 200 words.`
      : `${context}\n\nYou are a facilities director advising Noble Schools leadership. Based on the facility data above: (1) Which campuses need immediate attention and why, (2) What is the deferred maintenance risk across the network, (3) What capital planning priorities should leadership be aware of for the next 2 years, (4) Which HVAC or roof conditions create the highest operational risk. Under 220 words. Be specific with campus names.`;

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
      const text = json.content?.map((b: { type: string; text?: string }) => b.type === 'text' ? b.text : '').join('') ?? 'No response.';
      setAiResponse(text);
    } catch {
      setAiResponse('Analysis unavailable.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: C.bg, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: C.navy, padding: '20px 32px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 28 }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>SLATE GROUNDS</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={{ fontSize: 28, fontWeight: 900, color: '#FFFFFF' }}>Grounds</span>
          <span style={{ fontSize: 11, color: C.orange, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Facilities & Operations</span>
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 2, fontStyle: 'italic' }}>
          17 campuses · {(totalSqft / 1_000_000).toFixed(2)}M sq ft · {totalWO} open work orders
        </div>
      </div>

      <div style={{ padding: '0 32px 32px' }}>
        {/* KPI Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Total Sq Footage', value: `${(totalSqft / 1_000_000).toFixed(2)}M`, sub: '17 campuses' },
            { label: 'Open Work Orders', value: String(totalWO), sub: totalWO > 35 ? 'Above threshold' : 'Within range', color: totalWO > 35 ? C.red : C.green },
            { label: 'Active Cap Projects', value: String(totalCap), sub: `~$${(totalCap * 1.2).toFixed(1)}M est. budget`, color: C.amber },
            { label: 'Fair/Poor Facilities', value: `${poorCount} of 17`, sub: 'Need attention', color: poorCount > 5 ? C.red : C.amber },
          ].map((k, i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 20px', borderTop: `3px solid ${k.color ?? C.orange}` }}>
              <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{k.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: k.color ?? C.text, fontFamily: "'DM Mono', monospace" }}>{k.value}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Sort controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Campus Facility Status</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['workOrders', 'condition', 'name'] as const).map(s => (
              <button key={s} onClick={() => setSortBy(s)} style={{
                padding: '6px 14px', borderRadius: 8, border: `1px solid ${C.border}`,
                background: sortBy === s ? C.navy : C.card,
                color: sortBy === s ? '#FFFFFF' : C.muted,
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>
                {s === 'workOrders' ? 'By Work Orders' : s === 'condition' ? 'By Condition' : 'A–Z'}
              </button>
            ))}
          </div>
        </div>

        {/* Campus list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
          {sorted.map(c => (
            <div key={c.name} style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
              padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div style={{ flex: '0 0 160px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{c.short}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{(c.sqft / 1000).toFixed(0)}K sq ft · Built {c.built}</div>
              </div>
              <span style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                color: condColor(c.condition), background: condColor(c.condition) + '18',
                letterSpacing: '0.05em',
              }}>
                {c.condition.toUpperCase()}
              </span>
              <div style={{ flex: 1, display: 'flex', gap: 24, justifyContent: 'flex-end', alignItems: 'center' }}>
                {[
                  { label: 'HVAC', val: c.hvac },
                  { label: 'Roof', val: c.roof },
                ].map(item => (
                  <div key={item.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: C.muted }}>{item.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: condColor(item.val) }}>{item.val}</div>
                  </div>
                ))}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: C.muted }}>Work Orders</div>
                  <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "'DM Mono', monospace", color: c.openWO > 4 ? C.red : c.openWO > 2 ? C.amber : C.green }}>
                    {c.openWO}
                  </div>
                </div>
                {c.capProjects > 0 && (
                  <span style={{ padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, color: C.orange, background: C.orange + '15' }}>
                    {c.capProjects} cap project{c.capProjects > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* AI Facilities Advisor */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 18 }}>🏗️</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>AI Facilities Advisor</span>
            {aiRan && !aiLoading && (
              <button onClick={() => analyzeGrounds()} style={{ marginLeft: 'auto', fontSize: 11, color: C.muted, background: 'none', border: `1px solid ${C.border}`, borderRadius: 6, padding: '3px 10px', cursor: 'pointer' }}>
                Re-analyze
              </button>
            )}
          </div>

          {/* Freeform */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <input
              value={freeform}
              onChange={e => setFreeform(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && freeform.trim() && analyzeGrounds(freeform)}
              placeholder="e.g. Which campuses need a capital plan in the next 2 years?"
              style={{
                flex: 1, padding: '9px 14px', borderRadius: 8, border: `1px solid ${C.border}`,
                background: C.bg, color: C.text, fontSize: 13, outline: 'none',
              }}
            />
            <button onClick={() => freeform.trim() && analyzeGrounds(freeform)} style={{
              padding: '9px 18px', borderRadius: 8, background: C.orange, color: '#FFF',
              fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer',
            }}>Ask</button>
          </div>

          {!aiRan && (
            <button onClick={() => analyzeGrounds()} style={{
              padding: '9px 20px', borderRadius: 8, background: C.navy, color: '#FFF',
              fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer',
            }}>
              Run Facilities Analysis
            </button>
          )}

          {aiLoading && <div style={{ fontSize: 13, color: C.muted, fontStyle: 'italic' }}>Analyzing facility data...</div>}
          {aiResponse && <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7, whiteSpace: 'pre-wrap', marginTop: 8 }}>{aiResponse}</div>}
        </div>
      </div>

      <footer style={{ textAlign: 'center', padding: '20px 16px', fontSize: 11, color: C.muted, borderTop: `1px solid ${C.border}` }}>
        Slate Grounds — Noble Schools — Facilities & Operations Intelligence · Slate Systems, LLC · Madden Advisory Group · 2026
      </footer>
    </div>
  );
}
