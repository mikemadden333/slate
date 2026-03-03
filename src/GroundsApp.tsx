// @ts-nocheck
import { useState } from "react";

const C = { deep: "#0D1117", mid: "#2D3748", light: "#4A5568", chalk: "#E8EDF2", orange: "#F97316", white: "#FFFFFF", bg: "#F5F7FA" };

const CAMPUSES_FACILITIES = [
  { name: "Noble Street", sqft: 95000, condition: "good", openWO: 2, capProjects: 1, built: 2000, hvac: "good", roof: "fair" },
  { name: "Pritzker", sqft: 102000, condition: "excellent", openWO: 0, capProjects: 0, built: 2010, hvac: "excellent", roof: "good" },
  { name: "Rauner", sqft: 88000, condition: "fair", openWO: 5, capProjects: 2, built: 1998, hvac: "fair", roof: "poor" },
  { name: "Gary Comer", sqft: 110000, condition: "excellent", openWO: 1, capProjects: 0, built: 2008, hvac: "good", roof: "good" },
  { name: "UIC", sqft: 85000, condition: "good", openWO: 3, capProjects: 1, built: 2004, hvac: "good", roof: "good" },
  { name: "Muchin", sqft: 78000, condition: "fair", openWO: 6, capProjects: 2, built: 1995, hvac: "poor", roof: "fair" },
  { name: "Johnson", sqft: 92000, condition: "good", openWO: 2, capProjects: 0, built: 2006, hvac: "good", roof: "good" },
  { name: "Bulls", sqft: 98000, condition: "good", openWO: 1, capProjects: 1, built: 2012, hvac: "excellent", roof: "excellent" },
  { name: "ITW Speer", sqft: 86000, condition: "good", openWO: 2, capProjects: 0, built: 2005, hvac: "good", roof: "fair" },
  { name: "Baker", sqft: 90000, condition: "good", openWO: 1, capProjects: 0, built: 2009, hvac: "good", roof: "good" },
  { name: "Hansberry", sqft: 84000, condition: "fair", openWO: 4, capProjects: 1, built: 1999, hvac: "fair", roof: "fair" },
  { name: "DRW Trading", sqft: 105000, condition: "excellent", openWO: 0, capProjects: 0, built: 2014, hvac: "excellent", roof: "excellent" },
  { name: "Mansueto", sqft: 94000, condition: "good", openWO: 2, capProjects: 1, built: 2007, hvac: "good", roof: "good" },
  { name: "Butler", sqft: 88000, condition: "good", openWO: 3, capProjects: 0, built: 2003, hvac: "fair", roof: "good" },
  { name: "Goldblatt", sqft: 82000, condition: "fair", openWO: 5, capProjects: 2, built: 1997, hvac: "poor", roof: "poor" },
  { name: "TNA", sqft: 76000, condition: "fair", openWO: 4, capProjects: 1, built: 1996, hvac: "fair", roof: "fair" },
  { name: "Comer Science", sqft: 80000, condition: "good", openWO: 2, capProjects: 1, built: 2002, hvac: "good", roof: "fair" },
];

const totalSqft = CAMPUSES_FACILITIES.reduce((a, c) => a + c.sqft, 0);
const totalWO = CAMPUSES_FACILITIES.reduce((a, c) => a + c.openWO, 0);
const totalCap = CAMPUSES_FACILITIES.reduce((a, c) => a + c.capProjects, 0);
const condColor = (c: string) => c === 'excellent' ? '#059669' : c === 'good' ? '#0EA5E9' : c === 'fair' ? '#D97706' : '#DC2626';

export default function GroundsApp() {
  const [sortBy, setSortBy] = useState<'name' | 'condition' | 'workOrders'>('workOrders');
  const condRank = { excellent: 0, good: 1, fair: 2, poor: 3 };
  const sorted = [...CAMPUSES_FACILITIES].sort((a, b) =>
    sortBy === 'name' ? a.name.localeCompare(b.name) :
    sortBy === 'condition' ? (condRank[b.condition] || 0) - (condRank[a.condition] || 0) :
    b.openWO - a.openWO
  );

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: C.deep }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Sq Ft', value: (totalSqft / 1000000).toFixed(2) + 'M', sub: '17 campuses' },
          { label: 'Open Work Orders', value: String(totalWO), sub: totalWO < 30 ? 'Below average' : 'Above average' },
          { label: 'Capital Projects', value: String(totalCap), sub: `$${(totalCap * 1.2).toFixed(1)}M est. budget` },
          { label: 'Food Service', value: '6,200', sub: 'Meals served daily' },
        ].map((k, i) => (
          <div key={i} style={{ background: C.white, borderRadius: 14, padding: '20px 22px', borderTop: `3px solid ${C.orange}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.light, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 26, fontWeight: 700, color: C.deep }}>{k.value}</div>
            <div style={{ fontSize: 12, color: C.light, marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.light, textTransform: 'uppercase', letterSpacing: '2px' }}>Campus Facilities</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['workOrders', 'condition', 'name'] as const).map(s => (
            <button key={s} onClick={() => setSortBy(s)} style={{
              padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: sortBy === s ? 700 : 500,
              color: sortBy === s ? C.deep : C.light, background: sortBy === s ? C.chalk : 'transparent',
            }}>{s === 'workOrders' ? 'By Work Orders' : s === 'condition' ? 'By Condition' : 'A-Z'}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sorted.map(c => (
          <div key={c.name} style={{ background: C.white, borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: '0 0 130px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.deep }}>{c.name}</div>
              <div style={{ fontSize: 11, color: C.light, marginTop: 2 }}>{(c.sqft / 1000).toFixed(0)}K sq ft · Built {c.built}</div>
            </div>
            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: '1px', color: condColor(c.condition), background: condColor(c.condition) + '12' }}>
              {c.condition.toUpperCase()}
            </span>
            <div style={{ flex: 1 }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: C.light }}>HVAC</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: condColor(c.hvac) }}>{c.hvac}</div>
            </div>
            <div style={{ textAlign: 'center', marginLeft: 12 }}>
              <div style={{ fontSize: 11, color: C.light }}>Roof</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: condColor(c.roof) }}>{c.roof}</div>
            </div>
            <div style={{ textAlign: 'center', marginLeft: 12 }}>
              <div style={{ fontSize: 11, color: C.light }}>WOs</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: c.openWO > 3 ? '#DC2626' : C.deep }}>{c.openWO}</div>
            </div>
            {c.capProjects > 0 && (
              <span style={{ padding: '3px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700, color: C.orange, background: C.orange + '12' }}>
                {c.capProjects} project{c.capProjects > 1 ? 's' : ''}
              </span>
            )}
          </div>
        ))}
      </div>

      <footer style={{ textAlign: 'center', padding: '20px 16px', marginTop: 32, fontSize: 11, color: C.light, borderTop: '1px solid ' + C.chalk }}>
        <div>Slate Grounds — Operations Intelligence</div>
        <div style={{ fontSize: 9, color: '#94A3B8', marginTop: 4 }}>Slate Systems, Inc. · 2026</div>
      </footer>
    </div>
  );
}
