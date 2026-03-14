import { useState, useMemo } from "react";
import ReportsApp from "./ReportsApp";

// ─── SLATE DESIGN SYSTEM ───
const C = {
  deep: '#0D1117', rock: '#1C2333', mid: '#2D3748', light: '#4A5568',
  gold: '#F0B429', chalk: '#E8EDF2', signal: '#0EA5E9',
  shield: '#8B5CF6', // Module accent
  white: '#FFFFFF',
  critical: '#DC2626', high: '#EA580C', medium: '#D97706', low: '#059669',
  criticalBg: '#FEF2F2', highBg: '#FFF7ED', mediumBg: '#FFFBEB', lowBg: '#ECFDF5',
};

const LENS_COLORS = {
  Core: { bg: '#DBEAFE', color: '#1E40AF', border: '#93C5FD' },
  Existential: { bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5' },
  Emergent: { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D' },
};

const CATEGORY_ICONS = {
  'Legal, Policy & Compliance': '⚖️',
  'Financial': '💰',
  'Talent & Culture': '👥',
  'Operational & Safety': '🛡',
  'Technology & Cyber': '🔒',
  'Political, Reputational & External': '📢',
  'Strategic & Mission': '🎯',
};

const VELOCITY_DISPLAY = {
  Slow: { icon: '›', label: 'Slow', color: '#059669', desc: 'Years to develop' },
  Moderate: { icon: '››', label: 'Moderate', color: '#D97706', desc: 'Months to build' },
  Fast: { icon: '›››', label: 'Fast', color: '#DC2626', desc: 'Days or weeks' },
};

const TIER_COLORS = {
  'Tier 1 — Board Focus': { bg: '#FEE2E2', color: '#991B1B', label: 'TIER 1' },
  'Tier 2 — Executive Team': { bg: '#FEF3C7', color: '#92400E', label: 'TIER 2' },
  'Tier 3 — Working Group': { bg: '#DBEAFE', color: '#1E40AF', label: 'TIER 3' },
};

const TREND_DISPLAY = {
  '↑ Increasing': { icon: '↑', color: '#DC2626', label: 'Increasing' },
  '→ Stable': { icon: '→', color: '#4A5568', label: 'Stable' },
  '↓ Decreasing': { icon: '↓', color: '#059669', label: 'Decreasing' },
};

// ─── RISK DATA (5 actual + representative across all 7 categories) ───
const RISKS = [
  {
    id: 'R-001', name: 'Charter Renewal Risk', dateIdentified: '2025-11-15',
    description: 'Charter renewal at risk due to shifting political climate, authorizer changes, or performance criteria modifications that could threaten operating authority.',
    lens: 'Existential', category: 'Legal, Policy & Compliance', owner: 'CEO',
    likelihood: 2, impact: 5, velocity: 'Slow',
    controls: 'Renewal readiness process; compliance audits; stakeholder engagement; performance dashboards',
    mitigation: 'Strengthen authorizer relations; enhance renewal evidence portfolio; invest in priority academic supports; advocacy strategy',
    mitigationStatus: 'In Progress', targetScore: 6, tier: 'Tier 1 — Board Focus',
    kri: 'Authorizer satisfaction score; compliance audit findings count',
    lastReview: '2026-01-15', nextReview: '2026-04-15', trend: '→ Stable',
    notes: 'Next renewal cycle: 2027. WG monitoring authorizer signals.'
  },
  {
    id: 'R-002', name: 'Labor Relations & Workforce Stability', dateIdentified: '2025-11-15',
    description: 'Growing labor organizing activity, wage pressure, and evolving workforce expectations could materially affect staffing stability and operating costs.',
    lens: 'Existential', category: 'Talent & Culture', owner: 'CEO',
    likelihood: 3, impact: 5, velocity: 'Fast',
    controls: 'Competitive compensation analysis; employee engagement surveys; labor relations counsel',
    mitigation: 'Proactive engagement strategy; compensation benchmarking; culture investment; leadership pipeline development',
    mitigationStatus: 'In Progress', targetScore: 8, tier: 'Tier 1 — Board Focus',
    kri: 'Staff turnover rate; engagement survey scores; organizing activity indicators',
    lastReview: '2026-01-15', nextReview: '2026-04-15', trend: '↑ Increasing',
    notes: 'National charter labor trends accelerating. WG monitoring closely.'
  },
  {
    id: 'R-003', name: 'Tier 3/4 Student Behaviors', dateIdentified: '2025-11-15',
    description: 'Rising severity and frequency of serious student behavioral incidents impacting safety, culture, and instructional continuity across campuses.',
    lens: 'Core', category: 'Operational & Safety', owner: 'Chief Schools Officer',
    likelihood: 4, impact: 4, velocity: 'Moderate',
    controls: 'MTSS framework; crisis intervention teams; behavioral health partnerships; incident reporting systems',
    mitigation: 'Expand counseling capacity; strengthen de-escalation training; implement restorative practices; community partnerships',
    mitigationStatus: 'In Progress', targetScore: 8, tier: 'Tier 1 — Board Focus',
    kri: 'Tier 3/4 incident rate per 100 students; out-of-school suspension rate; staff safety perception',
    lastReview: '2026-01-15', nextReview: '2026-04-15', trend: '↑ Increasing',
    notes: 'Post-pandemic behavioral trends continue. Cross-campus analysis underway.'
  },
  {
    id: 'R-004', name: 'Public Funding Variability', dateIdentified: '2025-11-15',
    description: 'Federal and state funding instability, potential per-pupil reductions, and shifting political priorities could materially affect revenue sustainability.',
    lens: 'Existential', category: 'Financial', owner: 'CFO',
    likelihood: 4, impact: 5, velocity: 'Moderate',
    controls: 'Revenue diversification strategy; reserves policy; budget scenario modeling; legislative monitoring',
    mitigation: 'Advocacy coalition building; philanthropy growth; cost structure flexibility; multi-year financial planning',
    mitigationStatus: 'In Progress', targetScore: 10, tier: 'Tier 1 — Board Focus',
    kri: 'Per-pupil funding trend; federal grant pipeline; state budget allocation trajectory',
    lastReview: '2026-01-15', nextReview: '2026-04-15', trend: '↑ Increasing',
    notes: 'Federal funding landscape increasingly uncertain. ESSER cliff effects monitored.'
  },
  {
    id: 'R-005', name: 'Cybersecurity & Data Privacy', dateIdentified: '2025-11-15',
    description: 'Data breach, ransomware attack, or student data privacy violation could cause operational disruption, legal exposure, and reputational damage.',
    lens: 'Core', category: 'Technology & Cyber', owner: 'CIO',
    likelihood: 2, impact: 5, velocity: 'Fast',
    controls: 'MFA enforcement; endpoint detection; FERPA compliance framework; annual penetration testing; cyber insurance',
    mitigation: 'Zero-trust architecture migration; staff security awareness training; incident response plan testing; vendor security audits',
    mitigationStatus: 'In Progress', targetScore: 4, tier: 'Tier 2 — Executive Team',
    kri: 'Security incidents per quarter; phishing test click rate; patch compliance rate',
    lastReview: '2026-01-15', nextReview: '2026-04-15', trend: '→ Stable',
    notes: 'K-12 sector increasingly targeted. Annual tabletop exercise scheduled Q2.'
  },
  // Representative risks across remaining categories
  {
    id: 'R-006', name: 'Enrollment & Demographic Shifts', dateIdentified: '2025-12-01',
    description: 'Declining birth rates, neighborhood demographic shifts, and increased school choice competition may erode enrollment and per-pupil revenue.',
    lens: 'Existential', category: 'Strategic & Mission', owner: 'CEO',
    likelihood: 3, impact: 5, velocity: 'Slow',
    controls: 'Enrollment forecasting models; campus-level demand analysis; marketing and recruitment strategy',
    mitigation: 'Portfolio optimization; geographic demand mapping; brand differentiation; program innovation',
    mitigationStatus: 'In Progress', targetScore: 8, tier: 'Tier 1 — Board Focus',
    kri: 'Application volume trend; retention rates; waitlist depth by campus',
    lastReview: '2026-02-01', nextReview: '2026-05-01', trend: '→ Stable',
    notes: 'South and West Side demographic shifts being tracked.'
  },
  {
    id: 'R-007', name: 'Political & Media Narrative Risk', dateIdentified: '2025-12-01',
    description: 'Anti-charter political activity, negative media coverage, or social media incidents could damage public perception and political standing.',
    lens: 'Core', category: 'Political, Reputational & External', owner: 'President',
    likelihood: 3, impact: 3, velocity: 'Fast',
    controls: 'Media monitoring; proactive communications strategy; community engagement calendar; crisis communications plan',
    mitigation: 'Strengthen earned media program; build aldermanic relationships; parent ambassador network; rapid response protocol',
    mitigationStatus: 'In Progress', targetScore: 4, tier: 'Tier 2 — Executive Team',
    kri: 'Media sentiment trend; legislative threat indicators; community perception surveys',
    lastReview: '2026-02-01', nextReview: '2026-05-01', trend: '→ Stable',
    notes: 'Election cycle monitoring activated.'
  },
  {
    id: 'R-008', name: 'Teacher Retention & Pipeline', dateIdentified: '2025-12-01',
    description: 'Difficulty recruiting and retaining high-quality teachers, especially in STEM and special education, threatens instructional quality.',
    lens: 'Core', category: 'Talent & Culture', owner: 'CHRO',
    likelihood: 4, impact: 3, velocity: 'Moderate',
    controls: 'Competitive salary schedule; mentorship program; professional development investment; exit interview analysis',
    mitigation: 'Grow-your-own pipeline; university partnerships; retention bonuses for critical roles; culture initiatives',
    mitigationStatus: 'In Progress', targetScore: 6, tier: 'Tier 2 — Executive Team',
    kri: 'Voluntary turnover rate; mid-year departure count; offer acceptance rate',
    lastReview: '2026-02-01', nextReview: '2026-05-01', trend: '↑ Increasing',
    notes: 'National teacher shortage worsening in urban districts.'
  },
  {
    id: 'R-009', name: 'Facilities Aging & Capital Needs', dateIdentified: '2025-12-01',
    description: 'Deferred maintenance backlog and aging facilities infrastructure could create safety hazards, operational disruptions, and unplanned capital expenditures.',
    lens: 'Core', category: 'Operational & Safety', owner: 'COO',
    likelihood: 3, impact: 3, velocity: 'Slow',
    controls: 'Facilities condition assessments; preventive maintenance program; capital reserve fund; insurance coverage',
    mitigation: 'Multi-year capital plan; prioritized maintenance schedule; facilities modernization roadmap',
    mitigationStatus: 'In Progress', targetScore: 4, tier: 'Tier 3 — Working Group',
    kri: 'Work order backlog count; capital reserve balance; facilities condition index',
    lastReview: '2026-02-01', nextReview: '2026-05-01', trend: '→ Stable',
    notes: 'Facilities condition assessment scheduled for summer 2026.'
  },
  {
    id: 'R-010', name: 'Regulatory Compliance Burden', dateIdentified: '2025-12-01',
    description: 'Increasing federal and state regulatory requirements create compliance burden and risk of inadvertent violations.',
    lens: 'Core', category: 'Legal, Policy & Compliance', owner: 'General Counsel',
    likelihood: 3, impact: 2, velocity: 'Moderate',
    controls: 'Compliance calendar; legal review process; staff training; third-party audit program',
    mitigation: 'Compliance management system implementation; dedicated compliance staff; automated tracking tools',
    mitigationStatus: 'Not Started', targetScore: 3, tier: 'Tier 3 — Working Group',
    kri: 'Compliance findings count; deadline miss rate; training completion rate',
    lastReview: '2026-02-01', nextReview: '2026-05-01', trend: '→ Stable',
    notes: 'FERPA, Title IX, and special education compliance areas of focus.'
  },
  {
    id: 'R-011', name: 'AI Governance & Emerging Technology', dateIdentified: '2026-01-15',
    description: 'Rapid AI adoption across education creates governance gaps, data ethics questions, and potential for misuse or unintended consequences.',
    lens: 'Emergent', category: 'Technology & Cyber', owner: 'CIO',
    likelihood: null, impact: null, velocity: null,
    controls: 'AI use policy drafted; staff guidance document; vendor AI audit requirements',
    mitigation: 'Develop comprehensive AI governance framework; establish ethical use guidelines; student data protection protocols',
    mitigationStatus: 'Not Started', targetScore: null, tier: 'Tier 3 — Working Group',
    kri: 'AI tool adoption count; policy violation reports; student data exposure incidents',
    lastReview: '2026-02-01', nextReview: '2026-05-01', trend: '↑ Increasing',
    notes: 'Emergent topic — tracking signals, not yet scorable. WG monitoring.'
  },
  {
    id: 'R-012', name: 'Federal Education Policy Shifts', dateIdentified: '2026-01-15',
    description: 'Potential changes to federal education policy, Title I funding structures, or charter school regulations under evolving political landscape.',
    lens: 'Emergent', category: 'Political, Reputational & External', owner: 'President',
    likelihood: null, impact: null, velocity: null,
    controls: 'Federal policy monitoring; advocacy coalition membership; scenario planning exercises',
    mitigation: 'Build bipartisan relationships; diversify revenue sources; develop contingency scenarios',
    mitigationStatus: 'Not Started', targetScore: null, tier: 'Tier 3 — Working Group',
    kri: 'Federal legislation tracker; appropriations signals; advocacy coalition alerts',
    lastReview: '2026-02-01', nextReview: '2026-05-01', trend: '↑ Increasing',
    notes: 'Emergent topic — insufficient data for confident scoring. Sensemaking phase.'
  },
];

// ─── COMPUTED VALUES ───
function getInherentScore(r) { return (r.likelihood && r.impact) ? r.likelihood * r.impact : null; }
function getVelocityMultiplier(v) { return v === 'Slow' ? 1.0 : v === 'Moderate' ? 1.2 : v === 'Fast' ? 1.4 : null; }
function getAdjustedScore(r) {
  const s = getInherentScore(r); const m = getVelocityMultiplier(r.velocity);
  return (s && m) ? Math.round(s * m) : null;
}
function getRating(score) {
  if (!score) return null;
  if (score >= 20) return 'Critical'; if (score >= 12) return 'High';
  if (score >= 6) return 'Medium'; return 'Low';
}
function getRatingColor(rating) {
  if (rating === 'Critical') return { bg: C.criticalBg, color: C.critical };
  if (rating === 'High') return { bg: C.highBg, color: C.high };
  if (rating === 'Medium') return { bg: C.mediumBg, color: C.medium };
  if (rating === 'Low') return { bg: C.lowBg, color: C.low };
  return { bg: '#F3F4F6', color: '#6B7280' };
}

// ─── HEAT MAP COLORS ───
function heatColor(score) {
  if (score >= 20) return '#DC2626';
  if (score >= 15) return '#EA580C';
  if (score >= 10) return '#D97706';
  if (score >= 5) return '#EAB308';
  return '#22C55E';
}

// ─── COMPONENTS ───

function KpiCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: C.white, borderRadius: 12, padding: '20px 24px',
      border: `1px solid ${C.chalk}`, flex: 1, minWidth: 140,
      borderTop: `3px solid ${accent || C.shield}`,
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: C.light, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: C.deep, fontFamily: "'DM Mono', monospace" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: C.light, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function LensBadge({ lens }) {
  const c = LENS_COLORS[lens] || LENS_COLORS.Core;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
    }}>{lens}</span>
  );
}

function VelocityBadge({ velocity }) {
  if (!velocity) return <span style={{ fontSize: 11, color: '#9CA3AF' }}>—</span>;
  const v = VELOCITY_DISPLAY[velocity];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 12, fontWeight: 700, color: v.color,
    }}>
      <span style={{ fontSize: 16, letterSpacing: -2 }}>{v.icon}</span> {v.label}
    </span>
  );
}

function TierBadge({ tier }) {
  const t = TIER_COLORS[tier];
  if (!t) return null;
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
      background: t.bg, color: t.color, letterSpacing: '0.5px',
    }}>{t.label}</span>
  );
}

function TrendIndicator({ trend }) {
  const t = TREND_DISPLAY[trend];
  if (!t) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 600, color: t.color }}>
      <span style={{ fontSize: 16 }}>{t.icon}</span> {t.label}
    </span>
  );
}

function ScoreBadge({ score }) {
  if (!score) return <span style={{ fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' }}>Not Scorable</span>;
  const rating = getRating(score);
  const rc = getRatingColor(rating);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700,
      background: rc.bg, color: rc.color,
    }}>
      {score} — {rating}
    </span>
  );
}

function MitigationBar({ status }) {
  const pct = status === 'Implemented' ? 100 : status === 'Monitored' ? 85 : status === 'In Progress' ? 50 : 10;
  const clr = pct >= 85 ? C.low : pct >= 40 ? C.medium : C.critical;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#E5E7EB' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: clr, transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ fontSize: 11, color: C.light, whiteSpace: 'nowrap' }}>{status}</span>
    </div>
  );
}

// ─── DASHBOARD VIEW ───
function DashboardView({ risks, onSelectRisk }) {
  const scorable = risks.filter(r => getAdjustedScore(r) !== null);
  const tier1 = risks.filter(r => r.tier === 'Tier 1 — Board Focus');
  const tier2 = risks.filter(r => r.tier === 'Tier 2 — Executive Team');
  const tier3 = risks.filter(r => r.tier === 'Tier 3 — Working Group');
  const increasing = risks.filter(r => r.trend === '↑ Increasing');
  const avgScore = scorable.length ? (scorable.reduce((s, r) => s + getAdjustedScore(r), 0) / scorable.length).toFixed(1) : '—';

  const byCat = {};
  risks.forEach(r => { byCat[r.category] = (byCat[r.category] || 0) + 1; });
  const byLens = {};
  risks.forEach(r => { byLens[r.lens] = (byLens[r.lens] || 0) + 1; });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* KPI Strip */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard label="Total Risks" value={risks.length} sub={`${scorable.length} scorable · ${risks.length - scorable.length} signals`} />
        <KpiCard label="Tier 1 — Board" value={tier1.length} accent={C.critical} />
        <KpiCard label="Tier 2 — Exec" value={tier2.length} accent={C.medium} />
        <KpiCard label="Tier 3 — WG" value={tier3.length} accent={C.signal} />
        <KpiCard label="Avg Score" value={avgScore} sub="Velocity-adjusted" />
        <KpiCard label="Increasing" value={increasing.length} accent={C.critical} sub={`of ${risks.length} risks`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* By Category */}
        <div style={{ background: C.white, borderRadius: 12, padding: 24, border: `1px solid ${C.chalk}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.deep, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Risks by Category</div>
          {Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.chalk}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.mid }}>
                <span>{CATEGORY_ICONS[cat] || '📋'}</span> {cat}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: Math.max(count * 28, 28), height: 8, borderRadius: 4, background: `${C.shield}30`, position: 'relative' }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: 4, background: C.shield }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.deep, fontFamily: "'DM Mono', monospace", minWidth: 20, textAlign: 'right' }}>{count}</span>
              </div>
            </div>
          ))}
        </div>

        {/* By Lens */}
        <div style={{ background: C.white, borderRadius: 12, padding: 24, border: `1px solid ${C.chalk}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.deep, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Risks by Lens</div>
          {Object.entries(byLens).map(([lens, count]) => {
            const lc = LENS_COLORS[lens];
            return (
              <div key={lens} style={{ background: lc.bg, borderRadius: 10, padding: '16px 20px', marginBottom: 10, border: `1px solid ${lc.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: lc.color }}>{lens}</span>
                  <span style={{ fontSize: 24, fontWeight: 800, color: lc.color, fontFamily: "'DM Mono', monospace" }}>{count}</span>
                </div>
                <div style={{ fontSize: 12, color: lc.color, opacity: 0.75 }}>
                  {lens === 'Core' ? 'Foundational — managed by leadership teams' :
                   lens === 'Existential' ? 'Endurance — Board & exec team oversight' :
                   'Signals — Working Group monitoring'}
                </div>
              </div>
            );
          })}
          <div style={{ marginTop: 16, padding: '12px 16px', background: '#F9FAFB', borderRadius: 8, borderLeft: `3px solid ${C.shield}` }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.light, textTransform: 'uppercase', marginBottom: 4 }}>Framework Principle</div>
            <div style={{ fontSize: 12, color: C.mid, lineHeight: 1.5 }}>
              If we cannot articulate a clear risk statement (cause → event → impact), we do not force scoring. We track signals instead.
            </div>
          </div>
        </div>
      </div>

      {/* Top Tier Risks */}
      <div style={{ background: C.white, borderRadius: 12, padding: 24, border: `1px solid ${C.chalk}` }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.deep, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tier 1 — Board Focus Risks</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tier1.map(r => {
            const adj = getAdjustedScore(r);
            return (
              <div key={r.id} onClick={() => onSelectRisk(r)} style={{
                display: 'grid', gridTemplateColumns: '56px 2fr 100px 100px 100px 120px 100px', alignItems: 'center', gap: 12,
                padding: '14px 16px', borderRadius: 8, cursor: 'pointer',
                background: '#FAFAFA', border: `1px solid ${C.chalk}`,
                transition: 'all 0.15s ease',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = `${C.shield}08`; e.currentTarget.style.borderColor = `${C.shield}40`; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#FAFAFA'; e.currentTarget.style.borderColor = C.chalk; }}
              >
                <span style={{ fontSize: 11, fontWeight: 600, color: C.light, fontFamily: "'DM Mono', monospace" }}>{r.id}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.deep }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: C.light, marginTop: 2 }}>{CATEGORY_ICONS[r.category]} {r.category}</div>
                </div>
                <LensBadge lens={r.lens} />
                <ScoreBadge score={adj} />
                <VelocityBadge velocity={r.velocity} />
                <MitigationBar status={r.mitigationStatus} />
                <TrendIndicator trend={r.trend} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── HEAT MAP VIEW ───
function HeatMapView({ risks, onSelectRisk }) {
  const [filterLens, setFilterLens] = useState('All');
  const scorable = risks.filter(r => getInherentScore(r) !== null);
  const filtered = filterLens === 'All' ? scorable : scorable.filter(r => r.lens === filterLens);

  const impactLabels = ['Critical', 'Major', 'Moderate', 'Minor', 'Negligible'];
  const likelihoodLabels = ['Remote', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.light }}>FILTER BY LENS:</span>
        {['All', 'Core', 'Existential', 'Emergent'].map(l => (
          <button key={l} onClick={() => setFilterLens(l)} style={{
            padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: filterLens === l ? 700 : 500,
            background: filterLens === l ? (l === 'All' ? C.shield : LENS_COLORS[l]?.bg || C.shield) : '#F3F4F6',
            color: filterLens === l ? (l === 'All' ? C.white : LENS_COLORS[l]?.color || C.white) : C.light,
            transition: 'all 0.15s ease',
          }}>{l}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 20 }}>
        {/* Heat Map Grid */}
        <div style={{ background: C.white, borderRadius: 12, padding: 24, border: `1px solid ${C.chalk}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(5, 1fr)', gridTemplateRows: 'auto repeat(5, 80px)', gap: 3 }}>
            {/* Header row */}
            <div />
            {likelihoodLabels.map((l, i) => (
              <div key={l} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: C.light, padding: '4px 0' }}>
                {i + 1}<br /><span style={{ fontWeight: 400, fontSize: 9 }}>{l}</span>
              </div>
            ))}

            {/* Grid rows — impact 5 down to 1 */}
            {[5, 4, 3, 2, 1].map(impact => (
              <>
                <div key={`label-${impact}`} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                  fontSize: 10, fontWeight: 600, color: C.light, padding: '0 4px',
                }}>
                  {impact}<br /><span style={{ fontWeight: 400, fontSize: 9 }}>{impactLabels[5 - impact]}</span>
                </div>
                {[1, 2, 3, 4, 5].map(likelihood => {
                  const cellScore = likelihood * impact;
                  const cellRisks = filtered.filter(r => r.likelihood === likelihood && r.impact === impact);
                  return (
                    <div key={`${impact}-${likelihood}`} style={{
                      background: heatColor(cellScore) + '18',
                      border: `1px solid ${heatColor(cellScore)}30`,
                      borderRadius: 6,
                      display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center',
                      gap: 4, padding: 4, position: 'relative', minHeight: 70,
                    }}>
                      {cellRisks.length === 0 && (
                        <span style={{ fontSize: 10, color: heatColor(cellScore) + '40', fontWeight: 600 }}>{cellScore}</span>
                      )}
                      {cellRisks.map(r => (
                        <div key={r.id} onClick={() => onSelectRisk(r)} title={`${r.id}: ${r.name}`}
                          style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: heatColor(cellScore),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 8, fontWeight: 700, color: C.white, cursor: 'pointer',
                            border: `2px solid ${C.white}`,
                            boxShadow: `0 1px 3px ${heatColor(cellScore)}60`,
                            transition: 'transform 0.15s ease',
                            position: 'relative',
                          }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.3)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          {r.id.replace('R-', '')}
                          {r.velocity && (
                            <span style={{
                              position: 'absolute', top: -6, right: -6,
                              fontSize: 8, fontWeight: 800,
                              color: VELOCITY_DISPLAY[r.velocity]?.color || '#999',
                            }}>
                              {VELOCITY_DISPLAY[r.velocity]?.icon}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
          {/* Axis labels */}
          <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11, fontWeight: 700, color: C.light, letterSpacing: '1px' }}>
            LIKELIHOOD →
          </div>
          <div style={{
            position: 'absolute', left: -20, top: '50%', transform: 'rotate(-90deg) translateX(-50%)',
            fontSize: 11, fontWeight: 700, color: C.light, letterSpacing: '1px',
          }}>
            ← IMPACT
          </div>
        </div>

        {/* Velocity Legend + Risk List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: C.white, borderRadius: 12, padding: 20, border: `1px solid ${C.chalk}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.deep, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Velocity Overlay</div>
            {Object.entries(VELOCITY_DISPLAY).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: v.color, width: 30, letterSpacing: -2 }}>{v.icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.deep }}>{v.label}</div>
                  <div style={{ fontSize: 10, color: C.light }}>{v.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: C.white, borderRadius: 12, padding: 20, border: `1px solid ${C.chalk}`, flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.deep, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Plotted Risks ({filtered.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filtered.sort((a, b) => (getAdjustedScore(b) || 0) - (getAdjustedScore(a) || 0)).map(r => (
                <div key={r.id} onClick={() => onSelectRisk(r)} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6,
                  cursor: 'pointer', fontSize: 11, transition: 'background 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = `${C.shield}10`}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    background: heatColor(getInherentScore(r)),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 7, fontWeight: 700, color: C.white,
                  }}>{r.id.replace('R-', '')}</div>
                  <div style={{ flex: 1, fontWeight: 500, color: C.mid, lineHeight: 1.2 }}>{r.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scoring guardrail */}
      <div style={{ background: '#F9FAFB', borderRadius: 8, padding: '12px 16px', borderLeft: `3px solid ${C.gold}`, fontSize: 12, color: C.light, lineHeight: 1.5 }}>
        <strong style={{ color: C.mid }}>Important Guardrail:</strong> Scoring is directional, not precise. The goal is relative priority, not false precision. Disagreement is expected and strengthens the assessment.
      </div>
    </div>
  );
}

// ─── REGISTER VIEW ───
function RegisterView({ risks, onSelectRisk }) {
  const [sortField, setSortField] = useState('score');
  const [filterCat, setFilterCat] = useState('All');
  const [filterLens, setFilterLens] = useState('All');

  const cats = ['All', ...new Set(risks.map(r => r.category))];
  const lenses = ['All', 'Core', 'Existential', 'Emergent'];

  const filtered = risks
    .filter(r => filterCat === 'All' || r.category === filterCat)
    .filter(r => filterLens === 'All' || r.lens === filterLens)
    .sort((a, b) => {
      if (sortField === 'score') return (getAdjustedScore(b) || 0) - (getAdjustedScore(a) || 0);
      if (sortField === 'name') return a.name.localeCompare(b.name);
      if (sortField === 'likelihood') return (b.likelihood || 0) - (a.likelihood || 0);
      if (sortField === 'impact') return (b.impact || 0) - (a.impact || 0);
      return 0;
    });

  const SortBtn = ({ field, label }) => (
    <span onClick={() => setSortField(field)} style={{
      cursor: 'pointer', fontWeight: sortField === field ? 700 : 500,
      color: sortField === field ? C.shield : C.light,
    }}>{label}</span>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.light }}>CATEGORY:</span>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{
            padding: '5px 10px', borderRadius: 6, border: `1px solid ${C.chalk}`, fontSize: 12,
            color: C.mid, background: C.white, cursor: 'pointer',
          }}>
            {cats.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.light }}>LENS:</span>
          {lenses.map(l => (
            <button key={l} onClick={() => setFilterLens(l)} style={{
              padding: '4px 12px', borderRadius: 16, border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: filterLens === l ? 700 : 500,
              background: filterLens === l ? (l === 'All' ? C.shield : LENS_COLORS[l]?.bg || '#F3F4F6') : '#F3F4F6',
              color: filterLens === l ? (l === 'All' ? C.white : LENS_COLORS[l]?.color || C.light) : C.light,
            }}>{l}</button>
          ))}
        </div>
        <span style={{ fontSize: 12, color: C.light, marginLeft: 'auto' }}>{filtered.length} of {risks.length} risks</span>
      </div>

      {/* Table */}
      <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.chalk}`, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '52px 2fr 90px 130px 50px 50px 70px 80px 90px 80px',
          gap: 8, padding: '12px 16px', background: '#F9FAFB', borderBottom: `1px solid ${C.chalk}`,
          fontSize: 10, fontWeight: 700, color: C.light, textTransform: 'uppercase', letterSpacing: '0.5px',
        }}>
          <span>ID</span>
          <SortBtn field="name" label="Risk Name" />
          <span>Lens</span>
          <span>Category</span>
          <SortBtn field="likelihood" label="L" />
          <SortBtn field="impact" label="I" />
          <span>Velocity</span>
          <SortBtn field="score" label="Score ↓" />
          <span>Mitigation</span>
          <span>Trend</span>
        </div>

        {/* Rows */}
        {filtered.map(r => {
          const adj = getAdjustedScore(r);
          return (
            <div key={r.id} onClick={() => onSelectRisk(r)} style={{
              display: 'grid', gridTemplateColumns: '52px 2fr 90px 130px 50px 50px 70px 80px 90px 80px',
              gap: 8, padding: '12px 16px', borderBottom: `1px solid ${C.chalk}`,
              cursor: 'pointer', transition: 'background 0.1s',
              alignItems: 'center', fontSize: 12,
            }}
              onMouseEnter={e => e.currentTarget.style.background = `${C.shield}06`}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600, fontSize: 11, color: C.light }}>{r.id}</span>
              <div>
                <div style={{ fontWeight: 600, color: C.deep }}>{r.name}</div>
                <div style={{ fontSize: 10, color: C.light, marginTop: 1 }}>{r.owner}</div>
              </div>
              <LensBadge lens={r.lens} />
              <span style={{ fontSize: 11, color: C.mid }}>{CATEGORY_ICONS[r.category]} {r.category.split(' & ')[0]}</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600, color: r.likelihood ? C.deep : '#D1D5DB', textAlign: 'center' }}>{r.likelihood || '—'}</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600, color: r.impact ? C.deep : '#D1D5DB', textAlign: 'center' }}>{r.impact || '—'}</span>
              <VelocityBadge velocity={r.velocity} />
              <ScoreBadge score={adj} />
              <MitigationBar status={r.mitigationStatus} />
              <TrendIndicator trend={r.trend} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── DETAIL VIEW ───
function DetailView({ risk, onBack }) {
  const adj = getAdjustedScore(risk);
  const inherent = getInherentScore(risk);
  const rating = getRating(adj);
  const rc = getRatingColor(rating);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Back button */}
      <button onClick={onBack} style={{
        alignSelf: 'flex-start', padding: '6px 16px', borderRadius: 8, border: `1px solid ${C.chalk}`,
        background: C.white, cursor: 'pointer', fontSize: 12, fontWeight: 500, color: C.mid,
      }}>← Back to Register</button>

      {/* Header */}
      <div style={{ background: C.white, borderRadius: 12, padding: 28, border: `1px solid ${C.chalk}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.light, fontFamily: "'DM Mono', monospace" }}>{risk.id}</span>
              <LensBadge lens={risk.lens} />
              <TierBadge tier={risk.tier} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: C.deep, margin: 0 }}>{risk.name}</h2>
            <div style={{ fontSize: 13, color: C.light, marginTop: 4 }}>{CATEGORY_ICONS[risk.category]} {risk.category} · Owner: <strong>{risk.owner}</strong></div>
          </div>
          {adj && (
            <div style={{
              textAlign: 'center', padding: '16px 24px', borderRadius: 12,
              background: rc.bg, border: `2px solid ${rc.color}20`,
            }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: rc.color, fontFamily: "'DM Mono', monospace" }}>{adj}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: rc.color, letterSpacing: '0.5px' }}>{rating}</div>
            </div>
          )}
        </div>
        <p style={{ fontSize: 14, color: C.mid, lineHeight: 1.7, margin: 0 }}>{risk.description}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Scoring */}
        <div style={{ background: C.white, borderRadius: 12, padding: 24, border: `1px solid ${C.chalk}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.deep, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Risk Assessment</div>
          {risk.likelihood ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Likelihood bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.mid }}>Likelihood</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.deep, fontFamily: "'DM Mono', monospace" }}>{risk.likelihood}/5</span>
                </div>
                <div style={{ display: 'flex', gap: 3 }}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{ flex: 1, height: 8, borderRadius: 4, background: i <= risk.likelihood ? C.shield : '#E5E7EB' }} />
                  ))}
                </div>
              </div>
              {/* Impact bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.mid }}>Impact</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.deep, fontFamily: "'DM Mono', monospace" }}>{risk.impact}/5</span>
                </div>
                <div style={{ display: 'flex', gap: 3 }}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{ flex: 1, height: 8, borderRadius: 4, background: i <= risk.impact ? C.shield : '#E5E7EB' }} />
                  ))}
                </div>
              </div>
              {/* Velocity */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTop: `1px solid ${C.chalk}` }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.mid }}>Velocity</span>
                <VelocityBadge velocity={risk.velocity} />
              </div>
              {/* Score breakdown */}
              <div style={{ background: '#F9FAFB', borderRadius: 8, padding: '12px 16px', marginTop: 4 }}>
                <div style={{ fontSize: 11, color: C.light, marginBottom: 4 }}>Score Calculation</div>
                <div style={{ fontSize: 12, color: C.mid, fontFamily: "'DM Mono', monospace" }}>
                  {risk.likelihood} × {risk.impact} = {inherent} inherent × {getVelocityMultiplier(risk.velocity)} velocity = <strong style={{ color: C.deep }}>{adj} adjusted</strong>
                </div>
              </div>
              {risk.targetScore && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: C.light }}>Target Score</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.low, fontFamily: "'DM Mono', monospace" }}>{risk.targetScore}</span>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: 20, textAlign: 'center', background: '#FFFBEB', borderRadius: 8, border: '1px solid #FCD34D' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#92400E', marginBottom: 4 }}>Not Yet Scorable</div>
              <div style={{ fontSize: 12, color: '#B45309' }}>Emergent topic — tracking signals, not yet sufficient data for confident scoring.</div>
            </div>
          )}
        </div>

        {/* Controls & Mitigation */}
        <div style={{ background: C.white, borderRadius: 12, padding: 24, border: `1px solid ${C.chalk}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.deep, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Controls & Mitigation</div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.light, marginBottom: 6, textTransform: 'uppercase' }}>Current Controls</div>
            <p style={{ fontSize: 13, color: C.mid, lineHeight: 1.6, margin: 0 }}>{risk.controls}</p>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.light, marginBottom: 6, textTransform: 'uppercase' }}>Mitigation Strategy</div>
            <p style={{ fontSize: 13, color: C.mid, lineHeight: 1.6, margin: 0 }}>{risk.mitigation}</p>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.light, marginBottom: 8, textTransform: 'uppercase' }}>Mitigation Status</div>
            <MitigationBar status={risk.mitigationStatus} />
          </div>
        </div>
      </div>

      {/* Governance & Monitoring */}
      <div style={{ background: C.white, borderRadius: 12, padding: 24, border: `1px solid ${C.chalk}` }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.deep, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Governance & Monitoring</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.light, marginBottom: 4, textTransform: 'uppercase' }}>Key Risk Indicators</div>
            <p style={{ fontSize: 13, color: C.mid, lineHeight: 1.6, margin: 0 }}>{risk.kri}</p>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.light, marginBottom: 4, textTransform: 'uppercase' }}>Last Review</div>
            <p style={{ fontSize: 13, color: C.mid, margin: 0, fontFamily: "'DM Mono', monospace" }}>{risk.lastReview}</p>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.light, marginBottom: 4, textTransform: 'uppercase' }}>Next Review</div>
            <p style={{ fontSize: 13, color: C.mid, margin: 0, fontFamily: "'DM Mono', monospace" }}>{risk.nextReview}</p>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.light, marginBottom: 4, textTransform: 'uppercase' }}>Trend</div>
            <TrendIndicator trend={risk.trend} />
          </div>
        </div>
        {risk.notes && (
          <div style={{ marginTop: 16, padding: '12px 16px', background: '#F9FAFB', borderRadius: 8, borderLeft: `3px solid ${C.shield}` }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.light, marginBottom: 4 }}>NOTES / BOARD COMMENTS</div>
            <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.5 }}>{risk.notes}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN APP ───
export default function ShieldApp() {
  const [view, setView] = useState('dashboard');
  const [selectedRisk, setSelectedRisk] = useState(null);

  const handleSelectRisk = (risk) => {
    setSelectedRisk(risk);
    setView('detail');
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'heatmap', label: 'Heat Map' },
    { id: 'register', label: 'Risk Register' },
  ];

  return (
    <div style={{
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      background: '#F5F7FA', minHeight: '100vh', color: C.deep,
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        background: C.deep, padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `2px solid ${C.shield}30`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Slate parallelogram mark */}
            <svg width="28" height="22" viewBox="0 0 40 30">
              <path d="M8 2 L36 2 L32 28 L4 28 Z" fill={C.gold} opacity="0.9" />
              <line x1="10" y1="14" x2="34" y2="14" stroke={C.deep} strokeWidth="2.5" />
              <line x1="12" y1="20" x2="26" y2="20" stroke={C.deep} strokeWidth="2" />
            </svg>
            <span style={{ fontSize: 16, fontWeight: 700, color: C.white, letterSpacing: '-0.5px' }}>Slate</span>
          </div>
          <span style={{ color: '#4A5568', fontSize: 14 }}>·</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.shield }}>Shield</span>
            <span style={{ fontSize: 12, color: '#6B7280' }}>Risk Management</span>
          </div>
        </div>
        <div style={{ fontSize: 11, color: '#6B7280' }}>
          Enterprise Risk Register · Updated February 2026
        </div>
      </div>

      {/* Navigation */}
      <div style={{
        background: C.white, padding: '0 28px', borderBottom: `1px solid ${C.chalk}`,
        display: 'flex', alignItems: 'center', gap: 2,
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setView(t.id); setSelectedRisk(null); }} style={{
            padding: '14px 20px', border: 'none', cursor: 'pointer', fontSize: 13,
            fontWeight: view === t.id || (view === 'detail' && t.id === 'register') ? 700 : 500,
            color: view === t.id || (view === 'detail' && t.id === 'register') ? C.shield : C.light,
            background: 'transparent',
            borderBottom: `2px solid ${view === t.id || (view === 'detail' && t.id === 'register') ? C.shield : 'transparent'}`,
            transition: 'all 0.15s ease',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '24px 28px', maxWidth: 1280, margin: '0 auto' }}>
        {view === 'dashboard' && <DashboardView risks={RISKS} onSelectRisk={handleSelectRisk} />}
        {view === 'heatmap' && <HeatMapView risks={RISKS} onSelectRisk={handleSelectRisk} />}
        {view === 'register' && <RegisterView risks={RISKS} onSelectRisk={handleSelectRisk} />}
        {view === 'detail' && selectedRisk && <DetailView risk={selectedRisk} onBack={() => setView('register')} />}
      </div>
    </div>
  );
}
