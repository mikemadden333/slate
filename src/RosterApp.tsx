import { useState } from 'react';
import { RosterProvider, useRoster } from './roster-context/RosterDataContext';
import RosterCommandCenter from './roster-modules/RosterCommandCenter';
import AttritionRadar from './roster-modules/AttritionRadar';
import EnrollmentFunnel from './roster-modules/EnrollmentFunnel';
import AIEnrollmentAdvisor from './roster-modules/AIEnrollmentAdvisor';
import CampusView from './roster-modules/CampusView';

const C = {
  bg: '#F8F9FA', surface: '#FFFFFF', border: '#E5E7EB',
  navy: '#1B2A4A', text: '#1F2937', muted: '#6B7280', gold: '#F0B429',
};

const TABS = [
  { id: 'command',  label: 'Command Center' },
  { id: 'campus',   label: 'Campus View' },
  { id: 'funnel',   label: 'Recruitment Funnel' },
  { id: 'attrition',label: 'Attrition Radar' },
  { id: 'ask',      label: 'Ask AI' },
];

function RosterInner() {
  const [activeTab, setActiveTab] = useState('command');
  const { data, networkTotals } = useRoster();

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: C.bg, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: C.navy, padding: '20px 32px 0', borderBottom: `1px solid rgba(255,255,255,0.08)` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>
              SLATE ROSTER
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: '#FFFFFF', fontFamily: "'DM Sans', sans-serif" }}>Roster</span>
              <span style={{ fontSize: 11, color: C.gold, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Enrollment Intelligence</span>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 2, fontStyle: 'italic' }}>
              {networkTotals.enrolled.toLocaleString()} students enrolled · {data.sy} · {data.campuses.length} campuses
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24, textAlign: 'right' }}>
            {[
              { label: 'vs Target', value: `${networkTotals.enrolled - data.targetEnrollment >= 0 ? '+' : ''}${(networkTotals.enrolled - data.targetEnrollment).toLocaleString()}` },
              { label: 'Utilization', value: `${networkTotals.utilizationPct.toFixed(1)}%` },
              { label: 'Avg Yield', value: `${(networkTotals.avgYield * 100).toFixed(1)}%` },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.gold, fontFamily: "'DM Mono', monospace" }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Tab nav */}
        <div style={{ display: 'flex', gap: 4 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: activeTab === t.id ? 700 : 500,
              color: activeTab === t.id ? '#FFFFFF' : 'rgba(255,255,255,0.45)',
              borderBottom: activeTab === t.id ? `2px solid ${C.gold}` : '2px solid transparent',
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '28px 32px' }}>
        {activeTab === 'command'   && <RosterCommandCenter />}
        {activeTab === 'campus'    && <CampusView />}
        {activeTab === 'funnel'    && <EnrollmentFunnel />}
        {activeTab === 'attrition' && <AttritionRadar />}
        {activeTab === 'ask' && (
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 6 }}>Enrollment Intelligence</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>
              Ask anything about Noble enrollment — forecasts, at-risk campuses, yield scenarios, revenue impact.
            </div>
            <AIEnrollmentAdvisor mode="forecast" autoRun={false} />
            <AIEnrollmentAdvisor mode="freeform" />
          </div>
        )}
      </div>

      <footer style={{ textAlign: 'center', padding: '20px 16px', fontSize: 11, color: C.muted, borderTop: `1px solid ${C.border}` }}>
        Slate Roster — Noble Schools — Enrollment Intelligence — {data.sy} · Slate Systems, LLC · Madden Advisory Group · 2026
      </footer>
    </div>
  );
}

export default function RosterApp() {
  return (
    <RosterProvider>
      <RosterInner />
    </RosterProvider>
  );
}
