// @ts-nocheck
import { useState, useMemo, useEffect } from 'react';
import ReportsApp from './ReportsApp';

// ─── TOKENS ────────────────────────────────────────────────────────────────
const T = {
  bg:       '#F4F6F9',
  surface:  '#FFFFFF',
  border:   '#E1E8EF',
  ink:      '#0D1B2A',
  inkMid:   '#374151',
  muted:    '#6B7280',
  faint:    '#9CA3AF',
  gold:     '#B79145',
  green:    '#0B7A5E',
  red:      '#B91C1C',
  amber:    '#B45309',
  blue:     '#1D4ED8',
  purple:   '#7C3AED',
  teal:     '#0F766E',
  redBg:    '#FEF2F2',
  amberBg:  '#FFFBEB',
  greenBg:  '#ECFDF5',
  blueBg:   '#EFF6FF',
  goldBg:   '#FEFCE8',
  purpleBg: '#F5F3FF',
};
const mono = "'JetBrains Mono','SF Mono','Fira Code',monospace";
const GOAL = 10_000_000;

// ─── TYPES ─────────────────────────────────────────────────────────────────
type Stage = 'identification'|'qualification'|'cultivation'|'solicitation'|'negotiation'|'closed_won'|'stewardship'|'closed_lost';
type GiftType = 'major_gift'|'grant_foundation'|'grant_government'|'corporate'|'planned_giving'|'annual_fund';
type GrantType = 'federal'|'state'|'local'|'foundation'|'corporate';
type GrantStatus = 'new'|'reviewing'|'applying'|'submitted'|'awarded'|'declined';

interface Opportunity {
  id: string;
  name: string;
  type: GiftType;
  askAmount: number;
  projectedAmount: number;
  stage: Stage;
  assignedTo: string;
  nextAction: string;
  nextActionDate: string;
  openedDate: string;
  expectedCloseDate: string;
  notes: string;
  tags: string[];
  history: { date: string; action: string; by: string }[];
  priority: 'high'|'medium'|'low';
  capacity?: string;
  connection?: string;
}

interface GrantOpportunity {
  id: string;
  funder: string;
  program: string;
  type: GrantType;
  amountMin: number;
  amountMax: number;
  deadline: string;
  eligibility: string;
  fitScore: number;
  summary: string;
  url: string;
  tags: string[];
  status: GrantStatus;
  discoveredDate: string;
}

// ─── CONSTANTS ──────────────────────────────────────────────────────────────
const STAGES: { id: Stage; label: string; prob: number; color: string }[] = [
  { id: 'identification', label: 'Identification', prob: 0.05, color: T.faint  },
  { id: 'qualification',  label: 'Qualification',  prob: 0.15, color: T.muted  },
  { id: 'cultivation',    label: 'Cultivation',    prob: 0.35, color: T.blue   },
  { id: 'solicitation',   label: 'Solicitation',   prob: 0.60, color: T.amber  },
  { id: 'negotiation',    label: 'Negotiation',    prob: 0.80, color: T.purple },
  { id: 'closed_won',     label: 'Closed Won',     prob: 1.00, color: T.green  },
  { id: 'stewardship',    label: 'Stewardship',    prob: 1.00, color: T.teal   },
  { id: 'closed_lost',    label: 'Closed Lost',    prob: 0,    color: T.red    },
];

const TYPE_LABELS: Record<GiftType, string> = {
  major_gift:       '🤝 Major Gift',
  grant_foundation: '🏛 Foundation Grant',
  grant_government: '🏛 Gov. Grant',
  corporate:        '🏢 Corporate',
  planned_giving:   '📜 Planned Giving',
  annual_fund:      '📅 Annual Fund',
};

const GRANT_TYPE_LABELS: Record<GrantType, string> = {
  federal:    '🇺🇸 Federal',
  state:      '🏛 State',
  local:      '🏙 Local/City',
  foundation: '🏛 Foundation',
  corporate:  '🏢 Corporate',
};

const GRANT_STATUS_COLORS: Record<GrantStatus, { bg: string; color: string; label: string }> = {
  new:       { bg: T.blueBg,   color: T.blue,   label: '✦ New'       },
  reviewing: { bg: T.amberBg,  color: T.amber,  label: '◉ Reviewing' },
  applying:  { bg: T.purpleBg, color: T.purple, label: '✎ Applying'  },
  submitted: { bg: T.goldBg,   color: T.gold,   label: '▶ Submitted' },
  awarded:   { bg: T.greenBg,  color: T.green,  label: '✓ Awarded'   },
  declined:  { bg: T.redBg,    color: T.red,    label: '✕ Declined'  },
};

// ─── SEED DATA ──────────────────────────────────────────────────────────────
const SEED_OPPS: Opportunity[] = [
  {
    id: 'opp1', name: 'Crown Family Philanthropies', type: 'grant_foundation',
    askAmount: 1_000_000, projectedAmount: 750_000, stage: 'cultivation',
    assignedTo: 'Sara Chen', priority: 'high',
    nextAction: 'Submit LOI and schedule program officer site visit at Rauner campus',
    nextActionDate: '2026-03-18', openedDate: '2025-09-01', expectedCloseDate: '2026-06-30',
    capacity: '$500K–$2M/yr', connection: 'Board member introduction (Jim Crown)',
    notes: 'Strong Chicago education focus. College persistence and career readiness aligns with their strategic priorities. Multi-year ask opportunity. Invited to submit full LOI after positive concept paper feedback.',
    tags: ['foundation', 'chicago', 'multi-year', 'board connection', 'priority'],
    history: [
      { date: '2025-09-01', action: 'Identified through board prospect research session', by: 'Sara' },
      { date: '2025-11-14', action: 'Introductory meeting with program officer Rachel Kim', by: 'Sara' },
      { date: '2026-01-22', action: 'Submitted concept paper — received positive written feedback', by: 'Sara' },
      { date: '2026-02-28', action: 'Follow-up call — invited to submit full LOI by March 18', by: 'Sara' },
    ],
  },
  {
    id: 'opp2', name: 'MacArthur Foundation', type: 'grant_foundation',
    askAmount: 500_000, projectedAmount: 400_000, stage: 'solicitation',
    assignedTo: 'Sara Chen', priority: 'high',
    nextAction: 'Submit full proposal — deadline March 31',
    nextActionDate: '2026-03-31', openedDate: '2025-07-15', expectedCloseDate: '2026-05-01',
    capacity: '$250K–$750K', connection: 'Prior grant relationship (2021)',
    notes: 'Chicago-based. Education reform and equity track aligns with Noble mission. Prior grantee $250K (2021). Current ask focused on college persistence navigator program.',
    tags: ['foundation', 'chicago', 'repeat funder', 'priority'],
    history: [
      { date: '2025-07-15', action: 'Renewal outreach initiated — prior grant closed 2022', by: 'Sara' },
      { date: '2025-10-03', action: 'Pre-proposal meeting with program director', by: 'Sara' },
      { date: '2026-01-15', action: 'Invited to submit full proposal', by: 'Sara' },
    ],
  },
  {
    id: 'opp3', name: 'Boeing Global Engagement', type: 'corporate',
    askAmount: 250_000, projectedAmount: 200_000, stage: 'cultivation',
    assignedTo: 'Sara Chen', priority: 'high',
    nextAction: 'Present STEM pathway outcomes data at Boeing Chicago HQ',
    nextActionDate: '2026-03-25', openedDate: '2025-10-01', expectedCloseDate: '2026-08-01',
    capacity: '$100K–$500K', connection: 'Board member Tom Hayden',
    notes: 'Workforce pipeline angle — Noble graduates entering engineering pathways. Boeing has $5M+ Chicago philanthropy budget annually. Key contact is VP of Community Affairs Chicago.',
    tags: ['corporate', 'STEM', 'workforce', 'chicago', 'board connection'],
    history: [
      { date: '2025-10-01', action: 'Initial outreach via board member Tom Hayden', by: 'Mike' },
      { date: '2026-01-08', action: 'Introductory breakfast with VP Community Affairs', by: 'Sara' },
      { date: '2026-02-12', action: 'Sent Noble impact data and STEM program overview', by: 'Sara' },
    ],
  },
  {
    id: 'opp4', name: 'Anonymous Board Member', type: 'major_gift',
    askAmount: 500_000, projectedAmount: 500_000, stage: 'solicitation',
    assignedTo: 'Mike Madden', priority: 'high',
    nextAction: 'In-person ask meeting — confirm date this week',
    nextActionDate: '2026-03-10', openedDate: '2025-12-01', expectedCloseDate: '2026-04-15',
    capacity: '$500K–$1M+', connection: 'Direct board relationship',
    notes: 'Long-tenured board member. Annual giving $50K for 4 years. Expressed interest in legacy/transformational gift during board retreat. Capacity assessed at $1M+. Ready for major ask.',
    tags: ['major gift', 'board', 'transformational', 'priority'],
    history: [
      { date: '2025-12-01', action: 'Cultivation conversation during board retreat', by: 'Mike' },
      { date: '2026-01-15', action: 'One-on-one lunch — expressed interest in naming opportunity', by: 'Mike' },
      { date: '2026-02-20', action: 'Shared South Side campus expansion feasibility brief', by: 'Mike' },
    ],
  },
  {
    id: 'opp5', name: 'Searle Funds / Chicago Community Trust', type: 'grant_foundation',
    askAmount: 300_000, projectedAmount: 250_000, stage: 'solicitation',
    assignedTo: 'Sara Chen', priority: 'medium',
    nextAction: 'Submit CCT online application — portal closes April 1',
    nextActionDate: '2026-04-01', openedDate: '2025-11-01', expectedCloseDate: '2026-07-01',
    capacity: '$150K–$350K', connection: 'Prior grant relationship (CCT 2022, 2023)',
    notes: 'Education equity focus. Chicago-based. Application cycle opens Feb 1. CCT has funded Noble twice. Strong fit score. Requires updated 990 and audited financials.',
    tags: ['foundation', 'CCT', 'chicago', 'equity', 'repeat funder'],
    history: [
      { date: '2025-11-01', action: 'RFP released — assigned to Sara for application', by: 'Sara' },
      { date: '2026-01-20', action: 'Pre-application call with CCT program officer', by: 'Sara' },
      { date: '2026-02-28', action: 'Draft application reviewed internally — final edits in progress', by: 'Sara' },
    ],
  },
  {
    id: 'opp6', name: 'Pritzker Foundation', type: 'grant_foundation',
    askAmount: 500_000, projectedAmount: 250_000, stage: 'qualification',
    assignedTo: 'Sara Chen', priority: 'medium',
    nextAction: 'Request introductory meeting through Penny Pritzker board connection',
    nextActionDate: '2026-04-01', openedDate: '2026-01-15', expectedCloseDate: '2026-12-31',
    capacity: '$500K–$2M', connection: 'Board research — warm intro needed',
    notes: 'Education focus. Deep Chicago roots. No prior relationship — need warm introduction. Capacity very high. Long cultivation timeline expected (12–18 months).',
    tags: ['foundation', 'chicago', 'high capacity', 'needs intro'],
    history: [
      { date: '2026-01-15', action: 'Identified in prospect research — high-priority new target', by: 'Sara' },
      { date: '2026-02-10', action: 'Confirmed board connection exists — outreach pending', by: 'Mike' },
    ],
  },
  {
    id: 'opp7', name: 'CME Group Foundation', type: 'corporate',
    askAmount: 150_000, projectedAmount: 100_000, stage: 'cultivation',
    assignedTo: 'Sara Chen', priority: 'medium',
    nextAction: 'Submit LOI to CME Foundation grant portal',
    nextActionDate: '2026-04-15', openedDate: '2025-12-15', expectedCloseDate: '2026-09-01',
    capacity: '$75K–$200K', connection: 'Noble alumni in finance sector',
    notes: 'Financial literacy and math education focus aligns with Noble curriculum. CME funds Chicago education broadly. Prior connection through Noble alumna now at CME.',
    tags: ['corporate', 'financial literacy', 'math', 'chicago', 'alumni connection'],
    history: [
      { date: '2025-12-15', action: 'Identified through corporate prospect research', by: 'Sara' },
      { date: '2026-02-01', action: 'Met with CME Foundation director at Chicago Scholars event', by: 'Sara' },
    ],
  },
  {
    id: 'opp8', name: 'U.S. Dept. of Education — CSP Replication Grant', type: 'grant_government',
    askAmount: 2_000_000, projectedAmount: 1_500_000, stage: 'identification',
    assignedTo: 'Sara Chen', priority: 'high',
    nextAction: 'Confirm CSP grant cycle timeline with federal grants consultant',
    nextActionDate: '2026-05-01', openedDate: '2026-02-01', expectedCloseDate: '2027-03-01',
    capacity: '$1M–$3M', connection: 'Federal program — competitive',
    notes: 'Charter Schools Program Replication & Expansion. Noble meets high-performing criteria. Could fund 1–2 new campuses. Requires dedicated grant writer and third-party evaluator.',
    tags: ['federal', 'CSP', 'growth', 'capital', 'high value'],
    history: [
      { date: '2026-02-01', action: 'CSP NOFO expected Spring 2026 — tracking on grants.gov', by: 'Sara' },
    ],
  },
  {
    id: 'opp9', name: 'Goldman Sachs Gives', type: 'corporate',
    askAmount: 200_000, projectedAmount: 150_000, stage: 'cultivation',
    assignedTo: 'Sara Chen', priority: 'medium',
    nextAction: 'Present Noble college outcomes data to Goldman Chicago community affairs team',
    nextActionDate: '2026-04-10', openedDate: '2025-11-15', expectedCloseDate: '2026-10-01',
    capacity: '$100K–$250K', connection: 'Noble alumna at Goldman Chicago',
    notes: 'College access and economic mobility focus. Connection through Noble alumna now at Goldman. Goldman has $2M+ Chicago philanthropy portfolio. Need strong data deck.',
    tags: ['corporate', 'alumni connection', 'college access', 'chicago'],
    history: [
      { date: '2025-11-15', action: 'Noble alumna connected Sara to Goldman community affairs', by: 'Sara' },
      { date: '2026-02-03', action: 'Intro call with Goldman Gives director — positive', by: 'Sara' },
    ],
  },
  {
    id: 'opp10', name: 'ISBE — EBF Supplemental Grant', type: 'grant_government',
    askAmount: 750_000, projectedAmount: 750_000, stage: 'stewardship',
    assignedTo: 'Sara Chen', priority: 'medium',
    nextAction: 'Submit Q1 progress report — due April 15',
    nextActionDate: '2026-04-15', openedDate: '2025-07-01', expectedCloseDate: '2026-01-15',
    capacity: 'Awarded — $750K / 2 years', connection: 'ISBE relationship',
    notes: 'ISBE supplemental grant for high-performing charters. Awarded January 2026. $750K over 2 years for literacy intervention. First reporting period ends March 31.',
    tags: ['state', 'ISBE', 'literacy', 'awarded', 'reporting due'],
    history: [
      { date: '2025-07-01', action: 'NOFO released by ISBE', by: 'Sara' },
      { date: '2025-09-15', action: 'Application submitted', by: 'Sara' },
      { date: '2026-01-15', action: '🏆 Award notification received — $750,000', by: 'Sara' },
    ],
  },
];

const SEED_GRANTS: GrantOpportunity[] = [
  {
    id: 'g1', funder: 'W.K. Kellogg Foundation', program: 'Education & Learning — College Readiness Initiative',
    type: 'foundation', amountMin: 200_000, amountMax: 500_000, deadline: '2026-04-30',
    eligibility: 'Nonprofits and charter networks serving low-income students with college readiness programming',
    fitScore: 9,
    summary: 'Multi-year grants for college access and success for first-generation students. Strong fit with Noble\'s mission and demographics. Requires 2-year impact narrative and outcome data.',
    url: 'https://wkkf.org/grants', tags: ['college readiness', 'first-gen', 'multi-year'], status: 'reviewing', discoveredDate: '2026-02-15',
  },
  {
    id: 'g2', funder: 'U.S. Dept. of Education', program: 'Investing in Innovation (i3) — Scale-Up',
    type: 'federal', amountMin: 3_000_000, amountMax: 15_000_000, deadline: '2026-06-15',
    eligibility: 'LEAs, nonprofits, charter networks with evidence-based interventions at scale',
    fitScore: 7,
    summary: 'Competitive federal grant for scaling proven educational interventions. Noble\'s college readiness model has strong evidence base. Requires third-party evaluator and significant internal capacity.',
    url: 'https://ed.gov/programs/innovation', tags: ['federal', 'scale', 'evidence-based', 'major'], status: 'new', discoveredDate: '2026-03-01',
  },
  {
    id: 'g3', funder: 'Illinois State Board of Education', program: 'Student Mental Health & Wellness Grants',
    type: 'state', amountMin: 50_000, amountMax: 200_000, deadline: '2026-03-31',
    eligibility: 'Illinois public schools and charter schools serving K-12 students',
    fitScore: 8,
    summary: 'ISBE mental health initiative for trauma-informed care and counselor capacity. Noble\'s 10 campuses are all eligible. Per-campus or network-wide application accepted.',
    url: 'https://isbe.net/grants', tags: ['state', 'ISBE', 'mental health', 'wellness'], status: 'applying', discoveredDate: '2026-02-01',
  },
  {
    id: 'g4', funder: 'JPMorgan Chase Foundation', program: 'Chicago Workforce Initiative — PathForward',
    type: 'corporate', amountMin: 100_000, amountMax: 300_000, deadline: '2026-05-15',
    eligibility: 'Chicago-based nonprofits with workforce readiness and career pathways programming',
    fitScore: 8,
    summary: 'Chicago workforce initiative focusing on career readiness for under-resourced youth. Noble\'s internship network and career programming is strong fit. Must demonstrate employer partnerships.',
    url: 'https://jpmorgan.com/impact', tags: ['corporate', 'workforce', 'career', 'chicago'], status: 'new', discoveredDate: '2026-03-01',
  },
  {
    id: 'g5', funder: 'Chicago Community Trust', program: 'Education Equity Fund — Spring 2026 Cycle',
    type: 'local', amountMin: 75_000, amountMax: 250_000, deadline: '2026-04-01',
    eligibility: 'Chicago nonprofits focused on K-12 education equity and student outcomes',
    fitScore: 9,
    summary: 'CCT spring cycle for education equity. Noble has prior CCT grant history. Strong fit. Requires updated IRS 990 and audited financials. Portal open now.',
    url: 'https://cct.org/grants', tags: ['local', 'CCT', 'equity', 'chicago', 'repeat funder'], status: 'applying', discoveredDate: '2026-01-20',
  },
  {
    id: 'g6', funder: 'Lumina Foundation', program: 'Goal 2025 — Postsecondary Attainment',
    type: 'foundation', amountMin: 300_000, amountMax: 750_000, deadline: '2026-05-30',
    eligibility: 'Organizations demonstrating measurable impact on postsecondary attainment for underrepresented students',
    fitScore: 8,
    summary: 'Lumina focuses on increasing postsecondary credential attainment. Noble\'s college acceptance and persistence data is compelling for this funder. Letter of inquiry required first.',
    url: 'https://luminafoundation.org/grants', tags: ['foundation', 'college', 'postsecondary', 'national'], status: 'new', discoveredDate: '2026-02-20',
  },
];

const OPP_KEY   = 'noble_fund_opps';
const GRANT_KEY = 'noble_fund_grants';

// ─── HELPERS ────────────────────────────────────────────────────────────────
const fmt = (n: number) => n >= 1_000_000
  ? `$${(n/1_000_000).toFixed(1)}M`
  : n >= 1_000 ? `$${(n/1_000).toFixed(0)}K` : `$${n}`;

const fmtFull = (n: number) => '$' + n.toLocaleString();

const stageInfo = (id: Stage) => STAGES.find(s => s.id === id) ?? STAGES[0];

const daysUntil = (d: string) => {
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);
  return diff;
};

const priorityColor = (p: string) => ({ high: T.red, medium: T.amber, low: T.muted }[p] ?? T.muted);
const priorityBg    = (p: string) => ({ high: T.redBg, medium: T.amberBg, low: T.bg }[p] ?? T.bg);

const fitColor = (s: number) => s >= 8 ? T.green : s >= 6 ? T.amber : T.red;

// ─── PULSE BAR ──────────────────────────────────────────────────────────────
function PulseBar({ opps }: { opps: Opportunity[] }) {
  const today = new Date().toISOString().split('T')[0];
  const closed  = opps.filter(o => o.stage === 'closed_won' || o.stage === 'stewardship').reduce((s,o) => s + o.projectedAmount, 0);
  const pipeline = opps.filter(o => !['closed_won','stewardship','closed_lost'].includes(o.stage)).reduce((s,o) => s + o.askAmount, 0);
  const weighted = opps.filter(o => !['closed_won','stewardship','closed_lost'].includes(o.stage)).reduce((s,o) => {
    const prob = stageInfo(o.stage).prob;
    return s + o.projectedAmount * prob;
  }, 0);
  const overdue = opps.filter(o => o.nextActionDate < today && !['closed_won','stewardship','closed_lost'].includes(o.stage)).length;
  const open    = opps.filter(o => !['closed_won','stewardship','closed_lost'].includes(o.stage)).length;

  const pctClosed   = Math.min(closed / GOAL, 1);
  const pctWeighted = Math.min((closed + weighted) / GOAL, 1);

  const tiles = [
    { v: `${Math.round((closed/GOAL)*100)}%`, l: 'Goal Progress',      c: T.green   },
    { v: fmt(closed),                          l: 'Closed / Awarded',   c: T.green   },
    { v: fmt(weighted),                        l: 'Weighted Forecast',  c: T.blue    },
    { v: fmt(pipeline),                        l: 'Raw Pipeline',       c: T.ink     },
    { v: String(open),                         l: 'Open Opportunities', c: T.purple  },
    { v: String(overdue),                      l: 'Overdue Actions',    c: overdue > 0 ? T.red : T.muted },
  ];

  return (
    <div>
      {/* Goal thermometer */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '12px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            FY26 Philanthropy Goal — {fmt(GOAL)}
          </div>
          <div style={{ fontSize: 11, color: T.muted }}>
            <span style={{ color: T.green, fontWeight: 700 }}>{fmt(closed)} closed</span>
            {' · '}
            <span style={{ color: T.blue, fontWeight: 600 }}>{fmt(weighted)} weighted forecast</span>
            {' · '}
            <span style={{ color: T.faint }}>{fmt(GOAL - closed - weighted)} gap</span>
          </div>
        </div>
        <div style={{ height: 8, background: T.border, borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
          {/* Weighted layer */}
          <div style={{ position: 'absolute', left: 0, top: 0, width: `${pctWeighted * 100}%`, height: '100%', background: `${T.blue}40`, borderRadius: 4 }} />
          {/* Closed layer */}
          <div style={{ position: 'absolute', left: 0, top: 0, width: `${pctClosed * 100}%`, height: '100%', background: T.green, borderRadius: 4 }} />
        </div>
      </div>
      {/* Tiles */}
      <div style={{ display: 'flex', background: T.surface, borderBottom: `1px solid ${T.border}` }}>
        {tiles.map((t, i) => (
          <div key={i} style={{ flex: 1, padding: '12px 20px', borderRight: i < tiles.length-1 ? `1px solid ${T.border}` : 'none' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 3 }}>{t.l}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: t.c, fontFamily: mono }}>{t.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── OPPORTUNITY CARD ───────────────────────────────────────────────────────
function OppCard({ opp, onSelect, selected }: { opp: Opportunity; onSelect: (o: Opportunity) => void; selected: boolean }) {
  const today = new Date().toISOString().split('T')[0];
  const days  = daysUntil(opp.nextActionDate);
  const overdue = days < 0;
  const urgent  = days >= 0 && days <= 7;
  const si      = stageInfo(opp.stage);

  return (
    <div onClick={() => onSelect(opp)} style={{
      background: T.surface, border: `1.5px solid ${selected ? T.gold : T.border}`,
      borderRadius: 10, padding: 14, cursor: 'pointer',
      boxShadow: selected ? `0 0 0 3px ${T.gold}22` : 'none',
      borderLeft: `3px solid ${si.color}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 8, background: priorityBg(opp.priority), color: priorityColor(opp.priority), fontWeight: 800, textTransform: 'uppercase' }}>{opp.priority}</span>
            <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 8, background: T.bg, color: T.muted, border: `1px solid ${T.border}` }}>{TYPE_LABELS[opp.type].split(' ').slice(1).join(' ')}</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, lineHeight: 1.3 }}>{opp.name}</div>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{opp.assignedTo}</div>
        </div>
        <div style={{ textAlign: 'right', marginLeft: 12, flexShrink: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: T.ink, fontFamily: mono }}>{fmt(opp.askAmount)}</div>
          <div style={{ fontSize: 9, padding: '2px 8px', borderRadius: 8, background: `${si.color}18`, color: si.color, fontWeight: 700, marginTop: 4 }}>{si.label}</div>
        </div>
      </div>
      <div style={{
        fontSize: 11, fontWeight: 600,
        color: overdue ? T.red : urgent ? T.amber : T.muted,
        background: overdue ? T.redBg : urgent ? T.amberBg : 'transparent',
        borderRadius: 6, padding: overdue || urgent ? '3px 8px' : 0,
        display: 'inline-block',
      }}>
        {overdue ? `⚠ Overdue ${Math.abs(days)}d` : urgent ? `⏱ Due in ${days}d` : `Next: ${opp.nextActionDate}`}
      </div>
      <div style={{ fontSize: 11, color: T.inkMid, marginTop: 6, lineHeight: 1.5 }}>{opp.nextAction}</div>
    </div>
  );
}

// ─── OPPORTUNITY DETAIL ──────────────────────────────────────────────────────
function OppDetail({ opp, onLog, onStageChange }: {
  opp: Opportunity;
  onLog: (id: string, action: string) => void;
  onStageChange: (id: string, stage: Stage) => void;
}) {
  const [aiMode, setAiMode] = useState<'cultivation'|'solicitation'|'stewardship'|'meeting_brief'|null>(null);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [logText, setLogText] = useState('');

  const si = stageInfo(opp.stage);

  const generate = async (mode: 'cultivation'|'solicitation'|'stewardship'|'meeting_brief') => {
    setAiMode(mode); setLoading(true); setDraft('');
    const ctx = `Donor/Funder: ${opp.name}
Type: ${TYPE_LABELS[opp.type]}
Ask Amount: ${fmtFull(opp.askAmount)}
Stage: ${si.label}
Assigned To: ${opp.assignedTo}
Connection: ${opp.connection ?? 'None noted'}
Notes: ${opp.notes}
Veritas Charter Schools: Chicago's premier public charter network — 10 campuses, 6,823 students, predominantly low-income and first-generation college students. 98%+ college acceptance rate. $138M organization.`;

    const prompts = {
      cultivation: `${ctx}\n\nYou are a senior development director for Veritas Charter Schools. Write a specific, strategic cultivation plan for this prospect. Include: (1) a 90-day engagement sequence with specific touchpoints, (2) what materials and data to share and when, (3) who from Veritas leadership should be involved and in what order, (4) the specific case for support tailored to this funder's known priorities, (5) one concrete creative engagement idea beyond standard meetings. Be specific to Veritas Charter Schools and this funder. No generic advice. Under 400 words.`,
      solicitation: `${ctx}\n\nWrite a solicitation letter from Veritas Charter Schools to this prospect asking for ${fmtFull(opp.askAmount)}. Format: Date, salutation, 4 paragraphs (personal connection/gratitude, the need grounded in Veritas student data, the specific ask with naming/recognition opportunity if major gift, stewardship commitment), professional close. Tone: warm, serious, specific — not generic nonprofit boilerplate. Under 350 words.`,
      stewardship: `${ctx}\n\nWrite a stewardship impact report or thank-you communication for this ${TYPE_LABELS[opp.type]} from Veritas Charter Schools. Include: specific student outcomes, how the gift/grant was deployed, one illustrative student story (you may create a representative composite), what's next for the relationship, and a forward-looking ask signal. Warm, specific, data-grounded. Under 300 words.`,
    };

    // Meeting brief uses web search + live data — separate flow
    if (mode === 'meeting_brief') {
      try {
        const snap = (() => {
          try { const r = localStorage.getItem('slate_financials'); const f = r ? JSON.parse(r) : null;
            const er = localStorage.getItem('slate_enrollment'); const e = er ? JSON.parse(er) : null;
            return { ytdSurplus: f?.ytdSurplus ?? 5300000, dscr: f?.dscr ?? 3.47, daysCash: f?.daysCashOnHand ?? 62, enrollment: e?.networkTotal ?? 6823, targetEnroll: 6823 };
          } catch { return { ytdSurplus: 5300000, dscr: 3.47, daysCash: 62, enrollment: 6823, targetEnroll: 6823 }; }
        })();
        const meetingPrompt = `You are preparing a Pre-Meeting Intelligence Brief for a development director at Veritas Charter Schools who is about to meet with ${opp.name}.

DONOR PROFILE FROM CRM:
- Name: ${opp.name}
- Type: ${TYPE_LABELS[opp.type]}
- Ask Amount: ${fmtFull(opp.askAmount)}
- Stage: ${opp.stage}
- Connection: ${opp.connection ?? 'None noted'}
- Notes: ${opp.notes}
- Tags: ${opp.tags.join(', ')}
- Capacity: ${opp.capacity ?? 'Unknown'}

VERITAS LIVE DATA:
- Network: Veritas Charter Schools, 10 campuses, Chicago South/West Side + Loop
- Enrollment: ${snap.enrollment} students (target: ${snap.targetEnroll})
- Financial health: $${(snap.ytdSurplus/1000000).toFixed(1)}M surplus YTD, DSCR ${snap.dscr}x, ${snap.daysCash} days cash
- Student outcomes: 98%+ college acceptance rate, predominantly first-generation college students
- Neighborhoods served: Englewood, Woodlawn, Auburn Gresham, Roseland, Chatham, Austin, North Lawndale, Garfield Park, Humboldt Park, Loop

Using your knowledge of this funder and their publicly known priorities, generate a Pre-Meeting Intelligence Brief with these exact sections:

**WHO THEY ARE**
2-3 sentences on this funder — their mission, what they care about most, their giving philosophy.

**WHY THIS MEETING MATTERS**
1-2 sentences on why this is a high-value relationship for Veritas right now.

**WHAT THEY CARE ABOUT — CONNECTED TO VERITAS**
3-4 specific connections between this funder's known priorities and Veritas's actual work and outcomes. Be specific. Reference real program areas, student demographics, and outcomes data from above.

**YOUR ASK**
One paragraph: the specific ask of ${fmtFull(opp.askAmount)}, what it funds, why now, and the case for why this amount is right.

**QUESTIONS THEY WILL ASK**
3 questions this funder is likely to ask, with a one-sentence answer to each.

**THINGS TO AVOID**
2 things NOT to say or do in this meeting based on this funder's known sensitivities.

**YOUR OPENING LINE**
One sentence — the ideal way to open the meeting that connects personally to their priorities.

Write this as a professional briefing document. Specific, confident, actionable. No generic nonprofit language.`;

        const r = await fetch('/api/anthropic-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1200,
            system: 'You are an elite development strategist with deep knowledge of major foundation priorities, corporate giving programs, and high-net-worth donor psychology. You have researched thousands of funders and know what makes each one tick.',
            messages: [{ role: 'user', content: meetingPrompt }]
          }),
        });
        const j = await r.json();
        setDraft(j.content?.map((b: any) => b.type === 'text' ? b.text : '').join('') ?? 'Unable to generate.');
      } catch(err) { console.error('Meeting brief error:', err); setDraft('Error: ' + String(err)); }
      finally { setLoading(false); }
      return;
    }

    try {
      const r = await fetch('/api/anthropic-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, messages: [{ role: 'user', content: prompts[mode] }] }),
      });
      const j = await r.json();
      setDraft(j.content?.map((b: any) => b.type === 'text' ? b.text : '').join('') ?? 'Unable to generate.');
    } catch { setDraft('Generation unavailable.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 22, position: 'sticky', top: 16, maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 8, background: priorityBg(opp.priority), color: priorityColor(opp.priority), fontWeight: 800, textTransform: 'uppercase' }}>{opp.priority} priority</span>
        <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 8, background: `${si.color}18`, color: si.color, fontWeight: 800 }}>{si.label}</span>
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color: T.ink, marginBottom: 4 }}>{opp.name}</div>
      <div style={{ fontSize: 11, color: T.muted, marginBottom: 14 }}>{TYPE_LABELS[opp.type]} · {opp.assignedTo}</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        {[
          { l: 'Ask Amount', v: fmtFull(opp.askAmount), c: T.ink },
          { l: 'Projected', v: fmtFull(opp.projectedAmount), c: T.blue },
          { l: 'Expected Close', v: opp.expectedCloseDate, c: T.muted },
          { l: 'Capacity', v: opp.capacity ?? '—', c: T.muted },
        ].map((d, i) => (
          <div key={i} style={{ background: T.bg, borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: T.faint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{d.l}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: d.c, fontFamily: mono }}>{d.v}</div>
          </div>
        ))}
      </div>

      {/* Stage mover */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Move Stage</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {STAGES.map(s => (
            <button key={s.id} onClick={() => onStageChange(opp.id, s.id)} style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 9, fontWeight: 700, cursor: 'pointer', border: 'none',
              background: opp.stage === s.id ? s.color : T.bg,
              color: opp.stage === s.id ? '#FFF' : T.muted,
            }}>{s.label}</button>
          ))}
        </div>
      </div>

      {/* Connection */}
      {opp.connection && (
        <div style={{ marginBottom: 14, padding: '10px 12px', background: T.goldBg, borderRadius: 8, border: `1px solid ${T.gold}30` }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: T.amber, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Connection</div>
          <div style={{ fontSize: 11, color: T.inkMid }}>🔗 {opp.connection}</div>
        </div>
      )}

      {/* Next action */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Next Action</div>
        <div style={{ fontSize: 12, color: T.inkMid, lineHeight: 1.6 }}>{opp.nextAction}</div>
        <div style={{ fontSize: 11, color: daysUntil(opp.nextActionDate) < 0 ? T.red : T.muted, marginTop: 4 }}>
          📅 {opp.nextActionDate} {daysUntil(opp.nextActionDate) < 0 ? `(${Math.abs(daysUntil(opp.nextActionDate))}d overdue)` : daysUntil(opp.nextActionDate) <= 7 ? `(in ${daysUntil(opp.nextActionDate)}d)` : ''}
        </div>
      </div>

      <div style={{ fontSize: 12, color: T.inkMid, lineHeight: 1.7, marginBottom: 14 }}>{opp.notes}</div>

      {/* Tags */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
        {opp.tags.map(t => (
          <span key={t} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 8, background: T.bg, color: T.muted, border: `1px solid ${T.border}` }}>{t}</span>
        ))}
      </div>

      {/* History */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Interaction History</div>
        {[...opp.history].reverse().map((h, i) => (
          <div key={i} style={{ paddingLeft: 12, borderLeft: `2px solid ${T.border}`, marginBottom: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.muted }}>{h.date} · {h.by}</div>
            <div style={{ fontSize: 11, color: T.inkMid, lineHeight: 1.5 }}>{h.action}</div>
          </div>
        ))}
        {/* Log new */}
        <div style={{ marginTop: 10 }}>
          <input value={logText} onChange={e => setLogText(e.target.value)}
            placeholder="Log an interaction…"
            style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 11, boxSizing: 'border-box' }}
            onKeyDown={e => { if (e.key === 'Enter' && logText.trim()) { onLog(opp.id, logText); setLogText(''); } }}
          />
          <div style={{ fontSize: 9, color: T.faint, marginTop: 3 }}>Press Enter to log</div>
        </div>
      </div>

      {/* AI Actions */}
      <div style={{ fontSize: 9, fontWeight: 800, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>AI Actions</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
        <button onClick={() => generate('meeting_brief')} style={{ padding: '11px 14px', borderRadius: 8, background: '#0D1B2A', color: '#B79145', fontSize: 11, fontWeight: 700, border: '1.5px solid #B79145', cursor: 'pointer', textAlign: 'left', letterSpacing: '0.02em' }}>📋 Pre-Meeting Intelligence Brief</button>
        <button onClick={() => generate('cultivation')} style={{ padding: '9px 14px', borderRadius: 8, background: T.blue, color: '#FFF', fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', textAlign: 'left' }}>🧭 Generate Cultivation Strategy</button>
        <button onClick={() => generate('solicitation')} style={{ padding: '9px 14px', borderRadius: 8, background: T.gold, color: '#FFF', fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', textAlign: 'left' }}>✉️ Draft Solicitation Letter</button>
        <button onClick={() => generate('stewardship')} style={{ padding: '9px 14px', borderRadius: 8, background: T.surface, color: T.ink, fontSize: 11, fontWeight: 700, border: `1.5px solid ${T.border}`, cursor: 'pointer', textAlign: 'left' }}>📊 Draft Stewardship Report</button>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 20, color: T.muted, fontSize: 12, fontStyle: 'italic' }}>Generating…</div>}
      {draft && !loading && (
        <div>
          <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={12}
            style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 11, lineHeight: 1.8, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          <button onClick={() => navigator.clipboard?.writeText(draft)} style={{ marginTop: 8, padding: '7px 14px', borderRadius: 7, background: T.ink, color: '#FFF', fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer' }}>Copy</button>
        </div>
      )}
    </div>
  );
}

// ─── PIPELINE TAB ───────────────────────────────────────────────────────────
function PipelineTab({ opps, onUpdate }: { opps: Opportunity[]; onUpdate: (o: Opportunity[]) => void }) {
  const [stage, setStage] = useState<Stage|'all'>('all');
  const [type, setType] = useState<GiftType|'all'>('all');
  const [priority, setPriority] = useState<'all'|'high'|'medium'|'low'>('all');
  const [sortBy, setSort] = useState<'nextAction'|'amount'|'priority'>('nextAction');
  const [selected, setSelected] = useState<Opportunity|null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const filtered = useMemo(() => opps
    .filter(o => stage === 'all' || o.stage === stage)
    .filter(o => type === 'all' || o.type === type)
    .filter(o => priority === 'all' || o.priority === priority)
    .sort((a, b) => {
      if (sortBy === 'nextAction') return a.nextActionDate.localeCompare(b.nextActionDate);
      if (sortBy === 'amount') return b.askAmount - a.askAmount;
      if (sortBy === 'priority') return ['high','medium','low'].indexOf(a.priority) - ['high','medium','low'].indexOf(b.priority);
      return 0;
    }), [opps, stage, type, priority, sortBy]);

  // Stage summary bar
  const stageSummary = useMemo(() => STAGES.filter(s => s.id !== 'closed_lost').map(s => {
    const count = opps.filter(o => o.stage === s.id).length;
    const total = opps.filter(o => o.stage === s.id).reduce((sum, o) => sum + o.askAmount, 0);
    return { ...s, count, total };
  }), [opps]);

  const handleLog = (id: string, action: string) => {
    const today = new Date().toISOString().split('T')[0];
    onUpdate(opps.map(o => o.id === id ? { ...o, history: [...o.history, { date: today, action, by: 'You' }] } : o));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, history: [...prev.history, { date: today, action, by: 'You' }] } : null);
  };

  const handleStageChange = (id: string, s: Stage) => {
    onUpdate(opps.map(o => o.id === id ? { ...o, stage: s } : o));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, stage: s } : null);
  };

  return (
    <div>
      {/* Stage summary bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {stageSummary.map(s => (
          <div key={s.id} onClick={() => setStage(stage === s.id ? 'all' : s.id as Stage)}
            style={{ flexShrink: 0, background: T.surface, border: `1.5px solid ${stage === s.id ? s.color : T.border}`, borderRadius: 10, padding: '10px 14px', cursor: 'pointer', minWidth: 110 }}>
            <div style={{ fontSize: 8, fontWeight: 700, color: s.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: T.ink, fontFamily: mono }}>{s.count}</div>
            <div style={{ fontSize: 10, color: T.muted }}>{fmt(s.total)}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* Left: filters + list */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 14px', marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={type} onChange={e => setType(e.target.value as any)} style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 11 }}>
              <option value="all">All Types</option>
              {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v.split(' ').slice(1).join(' ')}</option>)}
            </select>
            <select value={priority} onChange={e => setPriority(e.target.value as any)} style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 11 }}>
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
            <select value={sortBy} onChange={e => setSort(e.target.value as any)} style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 11 }}>
              <option value="nextAction">Sort: Next Action</option>
              <option value="amount">Sort: Ask Amount</option>
              <option value="priority">Sort: Priority</option>
            </select>
            <button onClick={() => setShowAdd(true)} style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: 8, background: T.gold, color: '#FFF', fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer' }}>+ Add Opportunity</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(o => <OppCard key={o.id} opp={o} onSelect={setSelected} selected={selected?.id === o.id} />)}
            {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: T.muted, fontSize: 13 }}>No opportunities match your filters.</div>}
          </div>
        </div>

        {/* Right: detail panel */}
        <div style={{ width: 340, flexShrink: 0 }}>
          {selected ? (
            <OppDetail
              opp={opps.find(o => o.id === selected.id) ?? selected}
              onLog={handleLog}
              onStageChange={handleStageChange}
            />
          ) : (
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 32, textAlign: 'center', color: T.muted }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🤝</div>
              <div style={{ fontSize: 13 }}>Select an opportunity to see<br/>full details and AI actions</div>
            </div>
          )}
        </div>
      </div>

      {/* Add opportunity modal */}
      {showAdd && <AddOppModal onSave={(o) => { onUpdate([...opps, o]); setShowAdd(false); }} onClose={() => setShowAdd(false)} />}
    </div>
  );
}

// ─── ADD OPPORTUNITY MODAL ──────────────────────────────────────────────────
function AddOppModal({ onSave, onClose }: { onSave: (o: Opportunity) => void; onClose: () => void }) {
  const [form, setForm] = useState({ name: '', type: 'grant_foundation' as GiftType, askAmount: '', stage: 'identification' as Stage, assignedTo: 'Sara Chen', nextAction: '', nextActionDate: '', expectedCloseDate: '', priority: 'medium' as 'high'|'medium'|'low', notes: '', connection: '', capacity: '' });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const save = () => {
    if (!form.name || !form.askAmount) return;
    const today = new Date().toISOString().split('T')[0];
    onSave({
      id: 'opp_' + Date.now(),
      ...form,
      askAmount: parseInt(form.askAmount.replace(/\D/g, ''), 10) || 0,
      projectedAmount: parseInt(form.askAmount.replace(/\D/g, ''), 10) || 0,
      openedDate: today,
      tags: [],
      history: [{ date: today, action: 'Opportunity created', by: 'You' }],
    });
  };

  const inp = (placeholder: string, key: string, type = 'text') => (
    <input type={type} placeholder={placeholder} value={form[key as keyof typeof form] as string} onChange={e => set(key, e.target.value)}
      style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 12, boxSizing: 'border-box', marginBottom: 10 }} />
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: T.surface, borderRadius: 16, padding: 28, width: 480, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: T.ink, marginBottom: 18 }}>Add Opportunity</div>
        {inp('Donor / Funder Name *', 'name')}
        {inp('Ask Amount (e.g. 500000) *', 'askAmount')}
        {inp('Next Action', 'nextAction')}
        {inp('Next Action Date', 'nextActionDate', 'date')}
        {inp('Expected Close Date', 'expectedCloseDate', 'date')}
        {inp('Assigned To', 'assignedTo')}
        {inp('Connection / Warm Intro', 'connection')}
        {inp('Estimated Capacity', 'capacity')}
        <select value={form.type} onChange={e => set('type', e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 12, marginBottom: 10 }}>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={form.stage} onChange={e => set('stage', e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 12, marginBottom: 10 }}>
          {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <select value={form.priority} onChange={e => set('priority', e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 12, marginBottom: 10 }}>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>
        <textarea placeholder="Notes…" value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 12, resize: 'vertical', boxSizing: 'border-box', marginBottom: 14 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={save} style={{ flex: 1, padding: '10px', borderRadius: 8, background: T.gold, color: '#FFF', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer' }}>Save Opportunity</button>
          <button onClick={onClose} style={{ padding: '10px 16px', borderRadius: 8, background: T.bg, color: T.muted, fontSize: 13, fontWeight: 600, border: `1px solid ${T.border}`, cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── GRANT CARD ─────────────────────────────────────────────────────────────
function GrantCard({ grant, onSelect, selected, onStatusChange }: {
  grant: GrantOpportunity; onSelect: (g: GrantOpportunity) => void; selected: boolean; onStatusChange: (id: string, s: GrantStatus) => void;
}) {
  const days = daysUntil(grant.deadline);
  const urgent = days >= 0 && days <= 14;
  const overdue = days < 0;
  const gs = GRANT_STATUS_COLORS[grant.status];

  return (
    <div onClick={() => onSelect(grant)} style={{
      background: T.surface, border: `1.5px solid ${selected ? T.gold : T.border}`,
      borderRadius: 10, padding: 14, cursor: 'pointer',
      boxShadow: selected ? `0 0 0 3px ${T.gold}22` : 'none',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 8, background: T.bg, color: T.muted, border: `1px solid ${T.border}` }}>{GRANT_TYPE_LABELS[grant.type]}</span>
            <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 8, background: gs.bg, color: gs.color, fontWeight: 800 }}>{gs.label}</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, lineHeight: 1.3 }}>{grant.funder}</div>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{grant.program}</div>
        </div>
        <div style={{ textAlign: 'right', marginLeft: 12, flexShrink: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: fitColor(grant.fitScore), fontFamily: mono }}>{grant.fitScore}/10</div>
          <div style={{ fontSize: 8, color: T.muted, textTransform: 'uppercase' }}>Fit</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.ink, fontFamily: mono, marginTop: 4 }}>{fmt(grant.amountMax)}</div>
        </div>
      </div>
      <div style={{ fontSize: 11, color: overdue ? T.red : urgent ? T.amber : T.muted, fontWeight: urgent || overdue ? 700 : 400 }}>
        {overdue ? `⚠ Deadline passed ${Math.abs(days)}d ago` : `📅 Deadline: ${grant.deadline} ${urgent ? `(${days}d!)` : ''}`}
      </div>
      <div style={{ fontSize: 11, color: T.inkMid, marginTop: 6, lineHeight: 1.5 }}>{grant.summary.slice(0, 130)}…</div>
    </div>
  );
}

// ─── GRANT SOURCER TAB ───────────────────────────────────────────────────────
function GrantSourcerTab({ grants, onUpdate }: { grants: GrantOpportunity[]; onUpdate: (g: GrantOpportunity[]) => void }) {
  const [selected, setSelected] = useState<GrantOpportunity|null>(null);
  const [filterType, setFilterType] = useState<GrantType|'all'>('all');
  const [filterStatus, setFilterStatus] = useState<GrantStatus|'all'>('all');
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<string|null>(null);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const filtered = useMemo(() => grants
    .filter(g => filterType === 'all' || g.type === filterType)
    .filter(g => filterStatus === 'all' || g.status === filterStatus)
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
  , [grants, filterType, filterStatus]);

  const handleStatusChange = (id: string, status: GrantStatus) => {
    onUpdate(grants.map(g => g.id === id ? { ...g, status } : g));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
  };

  const scan = async () => {
    setScanning(true);
    try {
      const prompt = `You are a grants intelligence analyst for Veritas Charter Schools, Chicago's premier public charter school network (10 campuses, 6,823 students, predominantly low-income and first-generation college students, $138M organization).

Search for currently open grant opportunities in 2026 for:
1. FEDERAL: Any open NOFOs on grants.gov for charter schools, K-12 education, college readiness, or workforce development
2. ILLINOIS STATE: ISBE or DCEO grants open for charter schools or education nonprofits
3. LOCAL/CHICAGO: Chicago Community Trust, Community Foundation cycles, or city education grants currently open
4. NATIONAL FOUNDATIONS: Any major foundations with open cycles for urban education, college access, or first-generation students
5. CORPORATE: Any major corporate foundations with open Chicago or national education grant cycles

For each, return a JSON array with: funder, program, type (federal/state/local/foundation/corporate), amountMin, amountMax, deadline (YYYY-MM-DD), eligibility (1 sentence), fitScore (1-10 for Veritas Charter Schools specifically), summary (2-3 sentences on Veritas fit), tags (array), url.

Return ONLY valid JSON array. No markdown. Find 4-6 real current opportunities.`;

      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const j = await r.json();
      const text = j.content?.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('');
      if (text) {
        const clean = text.replace(/```json|```/g, '').trim();
        const start = clean.indexOf('[');
        const end   = clean.lastIndexOf(']') + 1;
        if (start >= 0 && end > start) {
          const parsed = JSON.parse(clean.slice(start, end));
          const today = new Date().toISOString().split('T')[0];
          const newGrants: GrantOpportunity[] = parsed.map((p: any, i: number) => ({
            id: 'g_ai_' + Date.now() + '_' + i,
            status: 'new' as GrantStatus,
            discoveredDate: today,
            ...p,
          }));
          onUpdate(prev => {
            const existing = new Set(prev.map(g => g.funder + g.program));
            const deduped = newGrants.filter(g => !existing.has(g.funder + g.program));
            return [...prev, ...deduped];
          });
          setLastScan(new Date().toLocaleString());
        }
      }
    } catch (err) { console.error('Scan error', err); }
    finally { setScanning(false); }
  };

  const analyzeGrant = async (grant: GrantOpportunity) => {
    setAnalysisLoading(true); setAiAnalysis('');
    const prompt = `Grant: ${grant.funder} — ${grant.program}
Type: ${grant.type} | Amount: $${grant.amountMin.toLocaleString()}–$${grant.amountMax.toLocaleString()} | Deadline: ${grant.deadline}
Eligibility: ${grant.eligibility}
Summary: ${grant.summary}

Veritas Charter Schools: Chicago's premier public charter network. 10 campuses, 6,823 students, 98% college acceptance, predominantly low-income and first-generation. Strong college readiness outcomes data, $138M organization, BBB-rated bonds.

Provide: (1) Application fit analysis — what's strong, what's a risk, (2) the single strongest argument Noble can make for this grant in 2–3 sentences, (3) application timeline — what needs to happen and when given the deadline, (4) who should be the application lead and who should review, (5) likelihood score 1–10 with rationale. Be specific and direct. No generic advice. Under 300 words.`;

    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 800, messages: [{ role: 'user', content: prompt }] }),
      });
      const j = await r.json();
      setAiAnalysis(j.content?.map((b: any) => b.type === 'text' ? b.text : '').join('') ?? 'Unable to generate.');
    } catch { setAiAnalysis('Analysis unavailable.'); }
    finally { setAnalysisLoading(false); }
  };

  return (
    <div>
      {/* Toolbar */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={filterType} onChange={e => setFilterType(e.target.value as any)} style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 11 }}>
          <option value="all">All Types</option>
          {Object.entries(GRANT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 11 }}>
          <option value="all">All Statuses</option>
          {Object.entries(GRANT_STATUS_COLORS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          {lastScan && <span style={{ fontSize: 10, color: T.faint }}>Last scan: {lastScan}</span>}
          <div style={{ fontSize: 10, color: T.faint }}>Scans daily · Manual refresh anytime</div>
          <button onClick={scan} disabled={scanning} style={{
            padding: '7px 16px', borderRadius: 8,
            background: scanning ? T.bg : T.purple, color: scanning ? T.muted : '#FFF',
            fontSize: 11, fontWeight: 700, border: 'none', cursor: scanning ? 'not-allowed' : 'pointer',
          }}>{scanning ? '⟳ Scanning grants…' : '⟳ AI Grant Scan'}</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* Left: grants list */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(g => (
            <GrantCard key={g.id} grant={g} onSelect={setSelected} selected={selected?.id === g.id} onStatusChange={handleStatusChange} />
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: T.muted, fontSize: 13 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
              <div>No grants match your filters.<br/>Run an AI Grant Scan to discover new opportunities.</div>
            </div>
          )}
        </div>

        {/* Right: grant detail */}
        <div style={{ width: 340, flexShrink: 0 }}>
          {selected ? (
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 22, position: 'sticky', top: 16, maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 8, background: T.bg, color: T.muted, border: `1px solid ${T.border}` }}>{GRANT_TYPE_LABELS[selected.type]}</span>
                <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 8, background: GRANT_STATUS_COLORS[selected.status].bg, color: GRANT_STATUS_COLORS[selected.status].color, fontWeight: 800 }}>{GRANT_STATUS_COLORS[selected.status].label}</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: T.ink, marginBottom: 4 }}>{selected.funder}</div>
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 14 }}>{selected.program}</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                {[
                  { l: 'Fit Score', v: `${selected.fitScore}/10`, c: fitColor(selected.fitScore) },
                  { l: 'Amount Range', v: `${fmt(selected.amountMin)}–${fmt(selected.amountMax)}`, c: T.ink },
                  { l: 'Deadline', v: selected.deadline, c: daysUntil(selected.deadline) <= 14 ? T.red : T.ink },
                  { l: 'Discovered', v: selected.discoveredDate, c: T.muted },
                ].map((d, i) => (
                  <div key={i} style={{ background: T.bg, borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: T.faint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{d.l}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: d.c, fontFamily: mono }}>{d.v}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 11, color: T.inkMid, lineHeight: 1.7, marginBottom: 14 }}>{selected.eligibility}</div>
              <div style={{ fontSize: 12, color: T.inkMid, lineHeight: 1.7, marginBottom: 14 }}>{selected.summary}</div>

              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
                {selected.tags.map(t => <span key={t} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 8, background: T.bg, color: T.muted, border: `1px solid ${T.border}` }}>{t}</span>)}
              </div>

              {/* Status update */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Update Status</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {Object.entries(GRANT_STATUS_COLORS).map(([k, v]) => (
                    <button key={k} onClick={() => handleStatusChange(selected.id, k as GrantStatus)} style={{
                      padding: '4px 10px', borderRadius: 6, fontSize: 9, fontWeight: 700, cursor: 'pointer', border: 'none',
                      background: selected.status === k ? v.color : T.bg,
                      color: selected.status === k ? '#FFF' : T.muted,
                    }}>{v.label}</button>
                  ))}
                </div>
              </div>

              <button onClick={() => analyzeGrant(selected)} style={{ width: '100%', padding: '10px', borderRadius: 8, background: T.blue, color: '#FFF', fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', marginBottom: 14 }}>
                🔍 AI Fit Analysis & Application Plan
              </button>

              {analysisLoading && <div style={{ textAlign: 'center', padding: 16, color: T.muted, fontSize: 12, fontStyle: 'italic' }}>Analyzing…</div>}
              {aiAnalysis && !analysisLoading && (
                <div style={{ background: T.blueBg, border: `1px solid ${T.blue}30`, borderRadius: 8, padding: 14, fontSize: 11, color: T.inkMid, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{aiAnalysis}</div>
              )}

              <a href={selected.url} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: 12, textAlign: 'center', fontSize: 11, color: T.blue, textDecoration: 'none' }}>→ View Funder Website</a>
            </div>
          ) : (
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 32, textAlign: 'center', color: T.muted }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
              <div style={{ fontSize: 13 }}>Select a grant to see<br/>details and AI analysis</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── STEWARDSHIP TAB ────────────────────────────────────────────────────────
function StewardshipTab({ opps }: { opps: Opportunity[] }) {
  const closed = opps.filter(o => o.stage === 'closed_won' || o.stage === 'stewardship');
  const upcoming = closed.filter(o => o.nextActionDate >= new Date().toISOString().split('T')[0]).sort((a,b) => a.nextActionDate.localeCompare(b.nextActionDate));
  const overdue  = closed.filter(o => o.nextActionDate < new Date().toISOString().split('T')[0]);

  const totalClosed = closed.reduce((s, o) => s + o.projectedAmount, 0);

  return (
    <div>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { v: String(closed.length),        l: 'Closed / Stewardship', c: T.green  },
          { v: fmt(totalClosed),             l: 'Total Closed YTD',     c: T.green  },
          { v: String(upcoming.length),      l: 'Upcoming Actions',     c: T.blue   },
          { v: String(overdue.length),       l: 'Overdue Reports',      c: overdue.length > 0 ? T.red : T.muted },
        ].map((d, i) => (
          <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{d.l}</div>
            <div style={{ fontSize: 26, fontWeight: 900, fontFamily: mono, color: d.c }}>{d.v}</div>
          </div>
        ))}
      </div>

      {/* Overdue */}
      {overdue.length > 0 && (
        <div style={{ background: T.redBg, border: `1px solid ${T.red}30`, borderRadius: 10, padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: T.red, marginBottom: 10 }}>⚠ Overdue Stewardship Actions</div>
          {overdue.map(o => (
            <div key={o.id} style={{ background: T.surface, borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{o.name}</div>
                  <div style={{ fontSize: 11, color: T.muted }}>{o.nextAction}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.red }}>{Math.abs(daysUntil(o.nextActionDate))}d overdue</div>
                  <div style={{ fontSize: 11, color: T.muted }}>{fmt(o.projectedAmount)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming actions */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Upcoming Stewardship Actions</div>
        {upcoming.length === 0 ? (
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 24, textAlign: 'center', color: T.muted, fontSize: 13 }}>No upcoming actions scheduled.</div>
        ) : (
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
            {upcoming.map((o, i) => (
              <div key={o.id} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 1fr 110px', padding: '14px 18px', borderBottom: i < upcoming.length-1 ? `1px solid ${T.border}` : 'none', alignItems: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: daysUntil(o.nextActionDate) <= 14 ? T.amber : T.muted }}>{o.nextActionDate}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{o.name}</div>
                  <div style={{ fontSize: 11, color: T.muted }}>{o.assignedTo}</div>
                </div>
                <div style={{ fontSize: 11, color: T.inkMid }}>{o.nextAction}</div>
                <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: T.green, fontFamily: mono }}>{fmt(o.projectedAmount)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Closed gifts log */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Closed Gifts & Grants — FY26</div>
        {closed.length === 0 ? (
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 40, textAlign: 'center', color: T.muted }}>No closed gifts yet.</div>
        ) : (
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 130px 120px', padding: '8px 18px', background: '#F8FAFC', borderBottom: `1px solid ${T.border}`, fontSize: 9, fontWeight: 800, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.09em' }}>
              <div>Donor / Funder</div><div>Type</div><div>Amount</div><div>Status</div>
            </div>
            {closed.map((o, i) => (
              <div key={o.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 130px 120px', padding: '12px 18px', borderBottom: i < closed.length-1 ? `1px solid ${T.border}` : 'none', background: i%2===0 ? T.surface : '#FAFBFC', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{o.name}</div>
                  <div style={{ fontSize: 11, color: T.muted }}>{o.assignedTo}</div>
                </div>
                <div style={{ fontSize: 11, color: T.inkMid }}>{TYPE_LABELS[o.type].split(' ').slice(1).join(' ')}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.green, fontFamily: mono }}>{fmtFull(o.projectedAmount)}</div>
                <div>
                  <span style={{ fontSize: 9, padding: '3px 8px', borderRadius: 8, background: T.greenBg, color: T.green, fontWeight: 800 }}>
                    {o.stage === 'stewardship' ? '◉ Stewardship' : '✓ Closed Won'}
                  </span>
                </div>
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 130px 120px', padding: '10px 18px', borderTop: `2px solid ${T.border}`, background: T.greenBg }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: T.green }}>Total Closed YTD</div>
              <div />
              <div style={{ fontSize: 15, fontWeight: 900, color: T.green, fontFamily: mono }}>{fmtFull(totalClosed)}</div>
              <div />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ROOT ───────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'pipeline',  l: '🤝 Pipeline'       },
  { id: 'sourcer',   l: '🔍 Grant Sourcer'   },
  { id: 'stewardship', l: '📊 Stewardship'   },
];

export default function FundApp() {
  const [tab, setTab] = useState('pipeline');
  const [opps, setOpps] = useState<Opportunity[]>(SEED_OPPS);
  const [grants, setGrants] = useState<GrantOpportunity[]>(SEED_GRANTS);

  useEffect(() => {
    try { const s = localStorage.getItem('noble_fund_opps');    if (s) setOpps(JSON.parse(s));    } catch {}
    try { const s = localStorage.getItem('noble_fund_grants');  if (s) setGrants(JSON.parse(s));  } catch {}
  }, []);

  useEffect(() => { try { localStorage.setItem('noble_fund_opps',   JSON.stringify(opps));   } catch {} }, [opps]);
  useEffect(() => { try { localStorage.setItem('noble_fund_grants', JSON.stringify(grants)); } catch {} }, [grants]);

  return (
    <div style={{ fontFamily: "'Inter','DM Sans',system-ui,sans-serif", background: T.bg, minHeight: '100%' }}>
      <PulseBar opps={opps} />

      {/* Tab nav */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, display: 'flex', paddingLeft: 20 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: tab === t.id ? 700 : 500,
            color: tab === t.id ? T.gold : T.muted,
            borderBottom: tab === t.id ? `2px solid ${T.gold}` : '2px solid transparent',
          }}>{t.l}</button>
        ))}
        <div style={{ marginLeft: 'auto', padding: '12px 20px', fontSize: 11, color: T.muted, alignSelf: 'center' }}>
          Veritas Charter Schools · Slate Fund · {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        </div>
      </div>

      <div style={{ padding: '22px 24px 32px' }}>
        {tab === 'pipeline'    && <PipelineTab opps={opps} onUpdate={setOpps} />}
        {tab === 'sourcer'     && <GrantSourcerTab grants={grants} onUpdate={setGrants} />}
        {tab === 'reports'    && <ReportsApp context="raise" />}
        {tab === 'stewardship' && <StewardshipTab opps={opps} />}
      </div>
    </div>
  );
}
