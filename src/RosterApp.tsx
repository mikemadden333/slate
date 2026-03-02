// @ts-nocheck
import { useState } from "react";

const C = { deep: "#0D1117", mid: "#2D3748", light: "#4A5568", chalk: "#E8EDF2", blue: "#3B82F6", white: "#FFFFFF", bg: "#F5F7FA" };

const CAMPUSES = [
  { name: "Noble Street", capacity: 750, enrolled: 738, applied: 412, accepted: 298, yield: 0.72, attrition: 0.034 },
  { name: "Pritzker", capacity: 820, enrolled: 804, applied: 445, accepted: 320, yield: 0.71, attrition: 0.028 },
  { name: "Rauner", capacity: 700, enrolled: 688, applied: 380, accepted: 275, yield: 0.69, attrition: 0.041 },
  { name: "Gary Comer", capacity: 780, enrolled: 762, applied: 398, accepted: 290, yield: 0.74, attrition: 0.031 },
  { name: "UIC", capacity: 720, enrolled: 706, applied: 356, accepted: 260, yield: 0.73, attrition: 0.029 },
  { name: "Muchin", capacity: 680, enrolled: 648, applied: 310, accepted: 228, yield: 0.68, attrition: 0.045 },
  { name: "Johnson", capacity: 760, enrolled: 744, applied: 402, accepted: 295, yield: 0.72, attrition: 0.033 },
  { name: "Bulls", capacity: 700, enrolled: 678, applied: 342, accepted: 252, yield: 0.70, attrition: 0.038 },
  { name: "ITW Speer", capacity: 680, enrolled: 662, applied: 325, accepted: 240, yield: 0.71, attrition: 0.036 },
  { name: "Baker", capacity: 720, enrolled: 698, applied: 368, accepted: 270, yield: 0.72, attrition: 0.032 },
  { name: "Hansberry", capacity: 700, enrolled: 674, applied: 335, accepted: 248, yield: 0.69, attrition: 0.042 },
  { name: "DRW Trading", capacity: 780, enrolled: 758, applied: 415, accepted: 305, yield: 0.73, attrition: 0.027 },
  { name: "Mansueto", capacity: 720, enrolled: 702, applied: 372, accepted: 268, yield: 0.71, attrition: 0.035 },
  { name: "Butler", capacity: 700, enrolled: 680, applied: 348, accepted: 255, yield: 0.70, attrition: 0.039 },
  { name: "Goldblatt", capacity: 680, enrolled: 656, applied: 312, accepted: 230, yield: 0.68, attrition: 0.044 },
  { name: "TNA", capacity: 660, enrolled: 638, applied: 298, accepted: 218, yield: 0.67, attrition: 0.047 },
  { name: "Comer Science", capacity: 640, enrolled: 622, applied: 285, accepted: 210, yield: 0.66, attrition: 0.048 },
];

const totals = CAMPUSES.reduce((a, c) => ({
  capacity: a.capacity + c.capacity, enrolled: a.enrolled + c.enrolled,
  applied: a.applied + c.applied, accepted: a.accepted + c.accepted,
}), { capacity: 0, enrolled: 0, applied: 0, accepted: 0 });

export default function RosterApp() {
  const [sortBy, setSortBy] = useState<'name' | 'enrolled' | 'yield' | 'attrition'>('enrolled');
  const sorted = [...CAMPUSES].sort((a, b) => sortBy === 'name' ? a.name.localeCompare(b.name) : sortBy === 'yield' ? b.yield - a.yield : sortBy === 'attrition' ? b.attrition - a.attrition : b.enrolled - a.enrolled);

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: C.deep }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Enrolled', value: totals.enrolled.toLocaleString(), sub: `${(totals.enrolled / totals.capacity * 100).toFixed(1)}% of capacity` },
          { label: 'Network Capacity', value: totals.capacity.toLocaleString(), sub: `${totals.capacity - totals.enrolled} seats available` },
          { label: 'Applications', value: totals.applied.toLocaleString(), sub: `FY26 cycle — ${(totals.accepted / totals.applied * 100).toFixed(0)}% acceptance rate` },
          { label: 'Avg Yield Rate', value: `${(CAMPUSES.reduce((a, c) => a + c.yield, 0) / CAMPUSES.length * 100).toFixed(1)}%`, sub: 'Accepted → Enrolled' },
        ].map((k, i) => (
          <div key={i} style={{ background: C.white, borderRadius: 14, padding: '20px 22px', borderTop: `3px solid ${C.blue}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.light, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 26, fontWeight: 700, color: C.deep }}>{k.value}</div>
            <div style={{ fontSize: 12, color: C.light, marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.light, textTransform: 'uppercase', letterSpacing: '2px' }}>Campus Enrollment</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['enrolled', 'yield', 'attrition', 'name'] as const).map(s => (
            <button key={s} onClick={() => setSortBy(s)} style={{
              padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: sortBy === s ? 700 : 500,
              color: sortBy === s ? C.deep : C.light, background: sortBy === s ? C.chalk : 'transparent',
            }}>{s === 'enrolled' ? 'By Size' : s === 'yield' ? 'By Yield' : s === 'attrition' ? 'By Attrition' : 'A-Z'}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sorted.map(c => {
          const pct = c.enrolled / c.capacity;
          return (
            <div key={c.name} style={{ background: C.white, borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: '0 0 140px' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.deep }}>{c.name}</div>
                <div style={{ fontSize: 11, color: C.light, marginTop: 2 }}>{c.enrolled} / {c.capacity}</div>
              </div>
              <div style={{ flex: 1, height: 8, background: C.chalk, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${pct * 100}%`, height: '100%', background: pct > 0.95 ? '#059669' : pct > 0.85 ? C.blue : '#D97706', borderRadius: 4, transition: 'width 0.3s' }} />
              </div>
              <div style={{ flex: '0 0 60px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: pct > 0.95 ? '#059669' : C.deep }}>
                {(pct * 100).toFixed(1)}%
              </div>
              <div style={{ flex: '0 0 80px', textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: C.light }}>Yield</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.deep }}>{(c.yield * 100).toFixed(0)}%</div>
              </div>
              <div style={{ flex: '0 0 80px', textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: C.light }}>Attrition</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: c.attrition > 0.04 ? '#DC2626' : C.deep }}>{(c.attrition * 100).toFixed(1)}%</div>
              </div>
            </div>
          );
        })}
      </div>

      <footer style={{ textAlign: 'center', padding: '20px 16px', marginTop: 32, fontSize: 11, color: C.light, borderTop: '1px solid ' + C.chalk }}>
        <div>Slate Roster — Enrollment Intelligence — FY2026 Cycle</div>
        <div style={{ fontSize: 9, color: '#94A3B8', marginTop: 4 }}>Slate Systems, LLC · Madden Advisory Group · 2026</div>
      </footer>
    </div>
  );
}
