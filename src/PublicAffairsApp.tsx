// @ts-nocheck
import { useState, useMemo, useEffect } from 'react';

// ─── TOKENS ────────────────────────────────────────────────────────────────
const T = {
  bg:      '#F4F6F9',
  surface: '#FFFFFF',
  border:  '#E1E8EF',
  ink:     '#0D1B2A',
  inkMid:  '#374151',
  muted:   '#6B7280',
  faint:   '#9CA3AF',
  orange:  '#D95F0C',
  green:   '#0B7A5E',
  red:     '#B91C1C',
  amber:   '#B45309',
  blue:    '#1D4ED8',
  purple:  '#7C3AED',
  teal:    '#0F766E',
  redBg:   '#FEF2F2',
  amberBg: '#FFFBEB',
  greenBg: '#ECFDF5',
  blueBg:  '#EFF6FF',
  purpleBg:'#F5F3FF',
};
const mono = "'SF Mono','Fira Code',monospace";

// ─── TYPES ─────────────────────────────────────────────────────────────────
interface Bill {
  id: string;
  level: 'federal' | 'illinois' | 'local';
  number: string;
  title: string;
  sponsor: string;
  sponsorParty: 'D' | 'R' | 'I' | 'Bipartisan';
  chamber: string;
  status: string;
  stage: number;
  lastAction: string;
  lastActionDate: string;
  summary: string;
  veritasPosition: 'support' | 'oppose' | 'monitor' | 'neutral';
  trajectoryScore: number;
  charterImpact: 'high' | 'medium' | 'low';
  impactType: 'positive' | 'negative' | 'mixed';
  url: string;
  tags: string[];
  keyContacts?: string[];
}

interface HistoryEntry {
  id: string;
  date: string;
  billId: string;
  billNumber: string;
  billTitle: string;
  actionType: 'witness_slip' | 'email' | 'call' | 'testimony' | 'coalition' | 'other';
  who: string;
  notes: string;
  outcome?: string;
}

// ─── SEED DATA ─────────────────────────────────────────────────────────────
const SEED_BILLS: Bill[] = [
  // Federal
  {
    id: 'f1',
    level: 'federal',
    number: 'S. 257',
    title: 'Charter School Accountability and Transparency Act',
    sponsor: 'Sen. Patty Murray (D-WA)',
    sponsorParty: 'D',
    chamber: 'Senate',
    status: 'Senate HELP Committee',
    stage: 2,
    lastAction: 'Referred to Senate HELP Committee',
    lastActionDate: '2025-11-14',
    summary: 'Increases federal reporting requirements for charter schools, mandates financial audits, and restricts federal Charter School Program grants to schools meeting new transparency standards. Would require Veritas to produce significantly expanded federal disclosures and could constrain CSP grant eligibility.',
    veritasPosition: 'oppose',
    trajectoryScore: 4,
    charterImpact: 'high',
    impactType: 'negative',
    url: 'https://congress.gov',
    tags: ['federal funding', 'accountability', 'CSP grants'],
    keyContacts: ['Sen. Dick Durbin', 'Sen. Tammy Duckworth'],
  },
  {
    id: 'f2',
    level: 'federal',
    number: 'H.R. 1412',
    title: 'Education Freedom Scholarships and Opportunity Act',
    sponsor: 'Rep. Virginia Foxx (R-NC)',
    sponsorParty: 'R',
    chamber: 'House',
    status: 'House Education & Workforce Committee',
    stage: 2,
    lastAction: 'Markup scheduled',
    lastActionDate: '2026-01-22',
    summary: 'Creates federal tax credit scholarships for private and charter school choice. Could expand the pool of students choosing charter schools and increase competition for enrollment, but may also redirect federal attention toward private voucher programs over public charters.',
    veritasPosition: 'monitor',
    trajectoryScore: 5,
    charterImpact: 'medium',
    impactType: 'mixed',
    url: 'https://congress.gov',
    tags: ['school choice', 'vouchers', 'tax credits'],
    keyContacts: ['Rep. Mike Quigley', 'Rep. Jan Schakowsky'],
  },
  {
    id: 'f3',
    level: 'federal',
    number: 'H.R. 2890',
    title: 'IDEA Full Funding Act',
    sponsor: 'Rep. Don Beyer (D-VA)',
    sponsorParty: 'D',
    chamber: 'House',
    status: 'House Education & Workforce Committee',
    stage: 2,
    lastAction: 'Cosponsors added (67 total)',
    lastActionDate: '2026-02-03',
    summary: 'Increases federal special education funding toward the original IDEA promise of 40% of excess costs. Would increase per-pupil federal revenue for Veritas students with disabilities by an estimated $800–$1,200 per qualifying student. Broadly supported by charter networks.',
    veritasPosition: 'support',
    trajectoryScore: 3,
    charterImpact: 'high',
    impactType: 'positive',
    url: 'https://congress.gov',
    tags: ['special education', 'IDEA', 'federal funding'],
    keyContacts: ['Rep. Danny Davis', 'Rep. Bobby Rush'],
  },
  // Illinois
  {
    id: 'il1',
    level: 'illinois',
    number: 'SB 1871',
    title: 'Charter School Funding Equity Act',
    sponsor: 'Sen. Robert Martwick (D-Chicago)',
    sponsorParty: 'D',
    chamber: 'Senate',
    status: 'Senate Education Committee',
    stage: 2,
    lastAction: 'Hearing held Feb 18, 2026',
    lastActionDate: '2026-02-18',
    summary: 'Requires Chicago Public Schools to fund charter schools at 100% of per-pupil funding parity, eliminating the current ~12% funding gap. Estimated to increase Veritas annual revenue by $2–3M if enacted. Strong charter network support. CPS and CTU opposed.',
    veritasPosition: 'support',
    trajectoryScore: 6,
    charterImpact: 'high',
    impactType: 'positive',
    url: 'https://ilga.gov',
    tags: ['charter funding', 'CPS', 'per-pupil parity', 'priority'],
    keyContacts: ['Sen. Karina Villa', 'Sen. Ann Gillespie'],
  },
  {
    id: 'il2',
    level: 'illinois',
    number: 'HB 3204',
    title: 'Charter School Moratorium Extension',
    sponsor: 'Rep. Kam Buckner (D-Chicago)',
    sponsorParty: 'D',
    chamber: 'House',
    status: 'House Elementary & Secondary Ed Committee',
    stage: 2,
    lastAction: 'Second reading postponed',
    lastActionDate: '2026-02-25',
    summary: 'Extends the existing Chicago charter school enrollment cap and moratorium on new charter authorizations through 2030. Would prevent Veritas from opening any new campuses in Chicago for four years. CTU-backed. Governor has not indicated a position.',
    veritasPosition: 'oppose',
    trajectoryScore: 5,
    charterImpact: 'high',
    impactType: 'negative',
    url: 'https://ilga.gov',
    tags: ['moratorium', 'growth', 'authorization', 'priority'],
    keyContacts: ['Rep. Lamont Robinson', 'Rep. Thaddeus Jones'],
  },
  {
    id: 'il3',
    level: 'illinois',
    number: 'SB 2104',
    title: 'Educator Licensure Reform Act',
    sponsor: 'Sen. Laura Fine (D-Glenview)',
    sponsorParty: 'D',
    chamber: 'Senate',
    status: 'Senate Licensed Activities Committee',
    stage: 3,
    lastAction: 'Passed Senate 38-18, sent to House',
    lastActionDate: '2026-02-14',
    summary: 'Raises the state PEL requirement for charter instructional staff from 75% to 85% by 2028, and to 90% by 2030. Veritas is currently at approximately 77% PEL compliance. Would require aggressive licensure push and could limit flexible hiring. ISBE supports.',
    veritasPosition: 'oppose',
    trajectoryScore: 7,
    charterImpact: 'high',
    impactType: 'negative',
    url: 'https://ilga.gov',
    tags: ['licensure', 'PEL', 'staffing', 'compliance'],
    keyContacts: ['Rep. Robyn Gabel', 'Rep. Mary Beth Canty'],
  },
  {
    id: 'il4',
    level: 'illinois',
    number: 'HB 4511',
    title: 'Evidence-Based Funding Charter Equity Amendment',
    sponsor: 'Rep. Mary Flowers (D-Chicago)',
    sponsorParty: 'D',
    chamber: 'House',
    status: 'House Revenue & Finance Committee',
    stage: 2,
    lastAction: 'Committee hearing scheduled Mar 12',
    lastActionDate: '2026-03-01',
    summary: 'Amends the Evidence-Based Funding formula to fully include charter school students in Tier 3 and Tier 4 calculations, correcting a structural inequity in how EBF adequacy targets are calculated for charter students. Could increase Veritas state funding by $1.5–2.5M annually.',
    veritasPosition: 'support',
    trajectoryScore: 5,
    charterImpact: 'high',
    impactType: 'positive',
    url: 'https://ilga.gov',
    tags: ['EBF', 'state funding', 'equity', 'formula'],
    keyContacts: ['Rep. Justin Slaughter', 'Rep. Sonya Harper'],
  },
  // Local
  {
    id: 'loc1',
    level: 'local',
    number: 'CPS Board Res. 26-0212',
    title: 'Charter Performance Policy Revision',
    sponsor: 'CPS Board of Education',
    sponsorParty: 'Bipartisan',
    chamber: 'CPS Board',
    status: 'Under Revision — Public Comment Open',
    stage: 2,
    lastAction: 'Public comment period open through Mar 20, 2026',
    lastActionDate: '2026-03-01',
    summary: 'Revises CPS charter performance framework to add enrollment volatility, demographic shift, and financial reserves as renewal risk factors. New metrics could affect Veritas campuses with enrollment declines. Comment period is the key advocacy window.',
    veritasPosition: 'monitor',
    trajectoryScore: 8,
    charterImpact: 'high',
    impactType: 'mixed',
    url: 'https://cps.edu',
    tags: ['CPS', 'renewal', 'performance policy', 'priority'],
    keyContacts: ['Board Member Jill Underly', 'CPS Charter Schools Office'],
  },
  {
    id: 'loc2',
    level: 'local',
    number: 'Chicago Ord. O2026-1044',
    title: 'School Facility Utilization & Closure Framework',
    sponsor: 'Ald. Maria Hadden (49th Ward)',
    sponsorParty: 'D',
    chamber: 'City Council Education Committee',
    status: 'City Council Education Committee',
    stage: 2,
    lastAction: 'Committee hearing held Mar 2',
    lastActionDate: '2026-03-02',
    summary: 'Creates a new citywide framework for school facility utilization review, including charter schools leasing CPS space. Could create new reporting obligations and trigger utilization reviews for Veritas campuses in CPS-owned facilities. Legal review recommended.',
    veritasPosition: 'monitor',
    trajectoryScore: 4,
    charterImpact: 'medium',
    impactType: 'mixed',
    url: 'https://chicityclerk.com',
    tags: ['facilities', 'CPS space', 'utilization', 'city council'],
    keyContacts: ['Ald. Pat Dowell', 'Ald. Ronnie Mosley'],
  },
];

const STAGE_LABELS = ['', 'Introduced', 'In Committee', 'Floor / Vote', 'Passed Chamber', 'Enacted'];
const STAGE_COLORS = ['', T.muted, T.amber, T.orange, T.blue, T.green];

// ─── HELPERS ───────────────────────────────────────────────────────────────
const positionColor = (p: string) => ({
  support: T.green, oppose: T.red, monitor: T.amber, neutral: T.muted
}[p] ?? T.muted);

const positionBg = (p: string) => ({
  support: T.greenBg, oppose: T.redBg, monitor: T.amberBg, neutral: T.bg
}[p] ?? T.bg);

const impactColor = (t: string) => ({
  positive: T.green, negative: T.red, mixed: T.amber
}[t] ?? T.muted);

const levelLabel = { federal: '🇺🇸 Federal', illinois: '🏛 Illinois', local: '🏙 Chicago/Local' };

// ─── PULSE BAR ─────────────────────────────────────────────────────────────
function PulseBar({ bills }: { bills: Bill[] }) {
  const priority   = bills.filter(b => b.charterImpact === 'high').length;
  const supporting = bills.filter(b => b.veritasPosition === 'support').length;
  const opposing   = bills.filter(b => b.veritasPosition === 'oppose').length;
  const monitoring = bills.filter(b => b.veritasPosition === 'monitor').length;
  const highTraj   = bills.filter(b => b.trajectoryScore >= 7).length;

  const tiles = [
    { v: String(bills.length),  l: 'Bills Tracked',        c: T.ink    },
    { v: String(priority),      l: 'High Impact',           c: T.orange },
    { v: String(highTraj),      l: 'High Trajectory',       c: T.purple },
    { v: String(supporting),    l: 'Veritas Supports',      c: T.green  },
    { v: String(opposing),      l: 'Veritas Opposes',       c: T.red    },
    { v: String(monitoring),    l: 'Monitoring',            c: T.amber  },
  ];

  return (
    <div style={{ display:'flex', borderBottom:`1px solid ${T.border}`, background:T.surface }}>
      {tiles.map((t, i) => (
        <div key={i} style={{ flex:1, padding:'14px 20px', borderRight: i<tiles.length-1?`1px solid ${T.border}`:'none' }}>
          <div style={{ fontSize:9, fontWeight:800, color:T.muted, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:4 }}>{t.l}</div>
          <div style={{ fontSize:21, fontWeight:900, color:t.c, fontFamily:mono }}>{t.v}</div>
        </div>
      ))}
    </div>
  );
}

// ─── BILL CARD ─────────────────────────────────────────────────────────────
function BillCard({ bill, onSelect, selected }: { bill: Bill; onSelect: (b: Bill) => void; selected: boolean }) {
  const pct = (bill.stage / 5) * 100;
  return (
    <div onClick={() => onSelect(bill)} style={{
      background: T.surface, border:`1.5px solid ${selected ? T.orange : T.border}`,
      borderRadius:12, padding:18, cursor:'pointer',
      boxShadow: selected ? `0 0 0 3px ${T.orange}22` : 'none',
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:6 }}>
            <span style={{ fontSize:10, fontWeight:800, fontFamily:mono, color:T.muted }}>{bill.number}</span>
            <span style={{ fontSize:9, padding:'2px 7px', borderRadius:10, background:positionBg(bill.veritasPosition),
              color:positionColor(bill.veritasPosition), fontWeight:800, textTransform:'uppercase', letterSpacing:'0.07em' }}>
              {bill.veritasPosition === 'support' ? '✓ Support' : bill.veritasPosition === 'oppose' ? '✕ Oppose' : bill.veritasPosition === 'monitor' ? '◉ Monitor' : '— Neutral'}
            </span>
            {bill.charterImpact === 'high' && (
              <span style={{ fontSize:9, padding:'2px 7px', borderRadius:10, background:'#FFF1E6', color:T.orange, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.07em' }}>High Impact</span>
            )}
          </div>
          <div style={{ fontSize:13, fontWeight:700, color:T.ink, lineHeight:1.4, marginBottom:4 }}>{bill.title}</div>
          <div style={{ fontSize:11, color:T.muted }}>{bill.sponsor} · {bill.chamber}</div>
        </div>
        <div style={{ textAlign:'center', marginLeft:12, flexShrink:0 }}>
          <div style={{ fontSize:22, fontWeight:900, color: bill.trajectoryScore >= 7 ? T.red : bill.trajectoryScore >= 5 ? T.amber : T.green, fontFamily:mono }}>{bill.trajectoryScore}</div>
          <div style={{ fontSize:8, color:T.muted, textTransform:'uppercase', letterSpacing:'0.08em' }}>Trajectory</div>
        </div>
      </div>

      <div style={{ marginBottom:10 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
          <span style={{ fontSize:9, color:T.muted, textTransform:'uppercase', letterSpacing:'0.08em' }}>{STAGE_LABELS[bill.stage]}</span>
          <span style={{ fontSize:9, color:T.muted }}>{bill.lastActionDate}</span>
        </div>
        <div style={{ height:4, background:T.border, borderRadius:2, overflow:'hidden' }}>
          <div style={{ width:`${pct}%`, height:'100%', background:STAGE_COLORS[bill.stage], borderRadius:2 }} />
        </div>
      </div>

      <div style={{ fontSize:11, color:T.inkMid, lineHeight:1.6 }}>{bill.summary.slice(0,160)}…</div>

      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:10 }}>
        {bill.tags.map(t => (
          <span key={t} style={{ fontSize:9, padding:'2px 7px', borderRadius:8, background:T.bg, color:T.muted, border:`1px solid ${T.border}` }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

// ─── BILL DETAIL ────────────────────────────────────────────────────────────
function BillDetail({ bill, onAction }: { bill: Bill; onAction: (b: Bill, type: string) => void }) {
  const stages = ['Introduced','In Committee','Floor / Vote','Passed Chamber','Enacted'];
  return (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:24, position:'sticky', top:16 }}>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
        <span style={{ fontSize:10, fontWeight:800, fontFamily:mono, color:T.muted }}>{bill.number}</span>
        <span style={{ fontSize:9, padding:'2px 8px', borderRadius:10, background:positionBg(bill.veritasPosition),
          color:positionColor(bill.veritasPosition), fontWeight:800, textTransform:'uppercase' }}>
          Veritas: {bill.veritasPosition}
        </span>
        <span style={{ fontSize:9, padding:'2px 8px', borderRadius:10,
          background: bill.impactType==='positive' ? T.greenBg : bill.impactType==='negative' ? T.redBg : T.amberBg,
          color: impactColor(bill.impactType), fontWeight:800, textTransform:'uppercase' }}>
          {bill.impactType} impact
        </span>
      </div>
      <div style={{ fontSize:15, fontWeight:800, color:T.ink, lineHeight:1.4, marginBottom:8 }}>{bill.title}</div>
      <div style={{ fontSize:11, color:T.muted, marginBottom:16 }}>{bill.sponsor} · {bill.chamber} · {levelLabel[bill.level]}</div>

      <div style={{ marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
          {stages.map((s,i) => (
            <div key={s} style={{ textAlign:'center', flex:1 }}>
              <div style={{ width:10, height:10, borderRadius:'50%', margin:'0 auto 3px',
                background: i < bill.stage ? T.green : i === bill.stage-1 ? T.orange : T.border }} />
              <div style={{ fontSize:7, color: i === bill.stage-1 ? T.orange : T.muted, fontWeight: i===bill.stage-1?800:400, textTransform:'uppercase', letterSpacing:'0.06em' }}>{s}</div>
            </div>
          ))}
        </div>
        <div style={{ height:3, background:T.border, borderRadius:2, overflow:'hidden' }}>
          <div style={{ width:`${(bill.stage/5)*100}%`, height:'100%', background:T.orange }} />
        </div>
      </div>

      <div style={{ fontSize:12, color:T.inkMid, lineHeight:1.7, marginBottom:16 }}>{bill.summary}</div>

      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        <div style={{ flex:1, textAlign:'center', padding:'10px 8px', background:T.bg, borderRadius:8 }}>
          <div style={{ fontSize:22, fontWeight:900, fontFamily:mono, color: bill.trajectoryScore>=7?T.red:bill.trajectoryScore>=5?T.amber:T.green }}>{bill.trajectoryScore}/10</div>
          <div style={{ fontSize:8, color:T.muted, textTransform:'uppercase', letterSpacing:'0.08em' }}>Trajectory</div>
        </div>
        <div style={{ flex:1, textAlign:'center', padding:'10px 8px', background:T.bg, borderRadius:8 }}>
          <div style={{ fontSize:12, fontWeight:800, color: bill.charterImpact==='high'?T.red:bill.charterImpact==='medium'?T.amber:T.muted }}>{bill.charterImpact.toUpperCase()}</div>
          <div style={{ fontSize:8, color:T.muted, textTransform:'uppercase', letterSpacing:'0.08em' }}>Impact Level</div>
        </div>
        <div style={{ flex:1, textAlign:'center', padding:'10px 8px', background:T.bg, borderRadius:8 }}>
          <div style={{ fontSize:10, fontWeight:800, color:positionColor(bill.veritasPosition) }}>{bill.sponsorParty}</div>
          <div style={{ fontSize:8, color:T.muted, textTransform:'uppercase', letterSpacing:'0.08em' }}>Sponsor Party</div>
        </div>
      </div>

      {bill.keyContacts && bill.keyContacts.length > 0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:9, fontWeight:800, color:T.muted, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>Key Contacts</div>
          {bill.keyContacts.map(c => (
            <div key={c} style={{ fontSize:11, color:T.inkMid, padding:'4px 0', borderBottom:`1px solid ${T.border}` }}>👤 {c}</div>
          ))}
        </div>
      )}

      <div style={{ fontSize:9, fontWeight:800, color:T.muted, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Take Action</div>
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {bill.level === 'illinois' && (
          <button onClick={() => onAction(bill, 'witness_slip')} style={{
            padding:'9px 14px', borderRadius:8, background:T.orange, color:'#FFF',
            fontSize:12, fontWeight:700, border:'none', cursor:'pointer', textAlign:'left',
          }}>📋 Draft Witness Slip Statement</button>
        )}
        <button onClick={() => onAction(bill, 'email')} style={{
          padding:'9px 14px', borderRadius:8, background:T.ink, color:'#FFF',
          fontSize:12, fontWeight:700, border:'none', cursor:'pointer', textAlign:'left',
        }}>✉️ Draft Legislator Email</button>
        <button onClick={() => onAction(bill, 'talking_points')} style={{
          padding:'9px 14px', borderRadius:8, background:T.surface, color:T.ink,
          fontSize:12, fontWeight:700, border:`1.5px solid ${T.border}`, cursor:'pointer', textAlign:'left',
        }}>💬 Generate Talking Points</button>
      </div>
    </div>
  );
}

// ─── TAB 1: LEGISLATIVE RADAR ───────────────────────────────────────────────
function LegislativeRadar({ bills, onAction, onRefresh, refreshing }: {
  bills: Bill[]; onAction: (b: Bill, t: string) => void; onRefresh: () => void; refreshing: boolean;
}) {
  const [level, setLevel] = useState<'all'|'federal'|'illinois'|'local'>('all');
  const [position, setPos] = useState<'all'|'support'|'oppose'|'monitor'>('all');
  const [sortBy, setSort] = useState<'trajectory'|'impact'|'stage'>('trajectory');
  const [selected, setSelected] = useState<Bill | null>(null);

  const filtered = useMemo(() => bills
    .filter(b => level === 'all' || b.level === level)
    .filter(b => position === 'all' || b.veritasPosition === position)
    .sort((a, b) => sortBy === 'trajectory' ? b.trajectoryScore - a.trajectoryScore
                  : sortBy === 'impact' ? (b.charterImpact === 'high' ? 3 : b.charterImpact === 'medium' ? 2 : 1) - (a.charterImpact === 'high' ? 3 : a.charterImpact === 'medium' ? 2 : 1)
                  : b.stage - a.stage)
  , [bills, level, position, sortBy]);

  return (
    <div style={{ display:'flex', gap:20 }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10,
          padding:'10px 14px', marginBottom:14, display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ display:'flex', gap:4 }}>
            {(['all','federal','illinois','local'] as const).map(l => (
              <button key={l} onClick={() => setLevel(l)} style={{
                padding:'6px 12px', borderRadius:20, fontSize:11, fontWeight:600, cursor:'pointer', border:'none',
                background: level===l ? T.ink : T.bg, color: level===l ? '#FFF' : T.muted,
              }}>{l === 'all' ? 'All Levels' : levelLabel[l]}</button>
            ))}
          </div>
          <div style={{ display:'flex', gap:4, marginLeft:'auto' }}>
            <select value={position} onChange={e=>setPos(e.target.value as any)}
              style={{ padding:'6px 10px', borderRadius:8, border:`1px solid ${T.border}`, fontSize:11 }}>
              <option value="all">All Positions</option>
              <option value="support">Support</option>
              <option value="oppose">Oppose</option>
              <option value="monitor">Monitor</option>
            </select>
            <select value={sortBy} onChange={e=>setSort(e.target.value as any)}
              style={{ padding:'6px 10px', borderRadius:8, border:`1px solid ${T.border}`, fontSize:11 }}>
              <option value="trajectory">Sort: Trajectory</option>
              <option value="impact">Sort: Impact</option>
              <option value="stage">Sort: Stage</option>
            </select>
            <button onClick={onRefresh} disabled={refreshing} style={{
              padding:'6px 14px', borderRadius:8, background: refreshing ? T.bg : T.purple, color: refreshing ? T.muted : '#FFF',
              fontSize:11, fontWeight:700, border:'none', cursor: refreshing ? 'not-allowed' : 'pointer',
            }}>{refreshing ? '⟳ Scanning…' : '⟳ AI Refresh'}</button>
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {filtered.map(b => (
            <BillCard key={b.id} bill={b} onSelect={setSelected} selected={selected?.id === b.id} />
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign:'center', padding:40, color:T.muted, fontSize:13 }}>No bills match your filters.</div>
          )}
        </div>
      </div>

      <div style={{ width:320, flexShrink:0 }}>
        {selected ? (
          <BillDetail bill={selected} onAction={(b, t) => { onAction(b, t); }} />
        ) : (
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:32, textAlign:'center', color:T.muted }}>
            <div style={{ fontSize:28, marginBottom:8 }}>⚖️</div>
            <div style={{ fontSize:13 }}>Select a bill to see<br/>full details and actions</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TAB 2: ACTION CENTER ───────────────────────────────────────────────────
function ActionCenter({ bills, initialBill, initialType, onHistoryAdd }: {
  bills: Bill[]; initialBill?: Bill | null; initialType?: string; onHistoryAdd: (e: HistoryEntry) => void;
}) {
  const [selBill, setSelBill] = useState<Bill | null>(initialBill ?? null);
  const [actionType, setActionType] = useState(initialType ?? 'witness_slip');
  const [who, setWho] = useState('Office of External Affairs, Veritas Charter Schools');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (initialBill) setSelBill(initialBill); }, [initialBill]);
  useEffect(() => { if (initialType) setActionType(initialType); }, [initialType]);

  const generate = async () => {
    if (!selBill) return;
    setLoading(true); setDraft(''); setSaved(false); setError('');

    const context = `Bill: ${selBill.number} — ${selBill.title}
Sponsor: ${selBill.sponsor} | Chamber: ${selBill.chamber} | Level: ${selBill.level}
Current status: ${selBill.status} | Last action: ${selBill.lastAction} (${selBill.lastActionDate})
Veritas position: ${selBill.veritasPosition.toUpperCase()}
Charter impact: ${selBill.charterImpact} / ${selBill.impactType}
Summary: ${selBill.summary}
Organization: Veritas Charter Schools — a network of 10 public charter high schools in Chicago serving 6,823 students, predominantly low-income and first-generation college students on the South and West Sides.
Author / On behalf of: ${who}`;

    const prompts: Record<string, string> = {
      witness_slip: `${context}\n\nWrite a formal Illinois legislative witness slip statement for Veritas Charter Schools ${selBill.veritasPosition === 'support' ? 'SUPPORTING' : 'OPPOSING'} ${selBill.number}.\n\nFormat: 3–4 paragraphs. Open with organization ID and clear position. Paragraph 2: specific reasons grounded in the Veritas mission and student impact. Paragraph 3: data or concrete examples (enrollment, demographics, financials where relevant). Closing: clear ask. Tone: professional, confident, not combative. Under 300 words.`,

      email: `${context}\n\nWrite an email from Veritas Charter Schools to a relevant legislator regarding ${selBill.number}. Veritas ${selBill.veritasPosition === 'support' ? 'supports' : selBill.veritasPosition === 'oppose' ? 'opposes' : 'is monitoring'} this bill.\n\nFormat: Subject line, greeting, 3 paragraphs (position + rationale, student impact with data, specific ask), professional close. Tone: direct, collegial, mission-grounded. Under 250 words.`,

      talking_points: `${context}\n\nCreate talking points for Veritas Charter Schools staff and advocates on ${selBill.number}. Veritas ${selBill.veritasPosition === 'support' ? 'supports' : selBill.veritasPosition === 'oppose' ? 'opposes' : 'is monitoring'} this bill.\n\nFormat: 5–7 bullet points, each 1–2 sentences. Include: core position, student impact, 1–2 data points, contrast with opposition argument, call to action. Tone: clear, persuasive, conversational (these are for spoken advocacy). Include a one-sentence elevator pitch at the top.`,
    };

    try {
      const r = await fetch('/api/anthropic-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompts[actionType] }],
        }),
      });
      if (!r.ok) throw new Error(`API error ${r.status}`);
      const j = await r.json();
      const text = j.content?.map((b: any) => b.type === 'text' ? b.text : '').join('') ?? '';
      if (text) {
        setDraft(text);
      } else {
        setError('No content returned. Try again.');
      }
    } catch (err: any) {
      setError(`Draft generation failed: ${err.message}. Check the proxy configuration.`);
    } finally {
      setLoading(false);
    }
  };

  const saveToHistory = () => {
    if (!selBill || !draft) return;
    const entry: HistoryEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      billId: selBill.id,
      billNumber: selBill.number,
      billTitle: selBill.title,
      actionType: actionType as any,
      who,
      notes: draft.slice(0, 120) + '…',
      outcome: '',
    };
    onHistoryAdd(entry);
    setSaved(true);
  };

  const actionLabels: Record<string, string> = {
    witness_slip: '📋 Witness Slip Statement',
    email: '✉️ Legislator Email',
    talking_points: '💬 Talking Points',
  };

  const ilgaInstructions = selBill?.level === 'illinois' && actionType === 'witness_slip' ? (
    <div style={{ background:'#F0F9FF', border:'1px solid #BAE6FD', borderRadius:10, padding:14, marginBottom:14, fontSize:11, color:'#0369A1', lineHeight:1.7 }}>
      <strong>To submit on ILGA:</strong> Go to <strong>ilga.gov → Bills → Witness Slips</strong>, search {selBill.number}, select the hearing, and paste your statement into the "Slip Content" field. Sign in with your MyILGA account. This draft is for your review — staff must submit manually.
    </div>
  ) : null;

  return (
    <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:20 }}>
      {/* Left panel */}
      <div>
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:18, marginBottom:14 }}>
          <div style={{ fontSize:10, fontWeight:800, color:T.muted, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>Select Bill</div>
          <select value={selBill?.id ?? ''} onChange={e => setSelBill(bills.find(b=>b.id===e.target.value)??null)}
            style={{ width:'100%', padding:'8px 10px', borderRadius:8, border:`1px solid ${T.border}`, fontSize:12, marginBottom:10 }}>
            <option value="">— Select a bill —</option>
            {bills.filter(b=>b.veritasPosition!=='neutral').map(b => (
              <option key={b.id} value={b.id}>{b.number} — {b.title.slice(0,45)}…</option>
            ))}
          </select>

          {selBill && (
            <div style={{ background:T.bg, borderRadius:8, padding:10 }}>
              <div style={{ fontSize:11, fontWeight:700, color:T.ink, marginBottom:4 }}>{selBill.title}</div>
              <div style={{ fontSize:10, color:T.muted }}>{selBill.sponsor}</div>
              <div style={{ display:'flex', gap:6, marginTop:6 }}>
                <span style={{ fontSize:9, padding:'2px 7px', borderRadius:8, background:positionBg(selBill.veritasPosition), color:positionColor(selBill.veritasPosition), fontWeight:800 }}>
                  {selBill.veritasPosition}
                </span>
                <span style={{ fontSize:9, padding:'2px 7px', borderRadius:8, background:T.surface, color:T.muted, border:`1px solid ${T.border}` }}>
                  Trajectory {selBill.trajectoryScore}/10
                </span>
              </div>
            </div>
          )}
        </div>

        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:18, marginBottom:14 }}>
          <div style={{ fontSize:10, fontWeight:800, color:T.muted, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>Action Type</div>
          {Object.entries(actionLabels).map(([k, v]) => {
            const disabled = k === 'witness_slip' && selBill?.level !== 'illinois';
            return (
              <button key={k} onClick={() => !disabled && setActionType(k)} disabled={disabled} style={{
                display:'block', width:'100%', textAlign:'left', padding:'9px 12px', marginBottom:6,
                borderRadius:8, fontSize:12, fontWeight:600, cursor: disabled ? 'not-allowed' : 'pointer',
                border: `1.5px solid ${actionType===k ? T.orange : T.border}`,
                background: actionType===k ? '#FFF7F0' : T.surface, color: disabled ? T.faint : T.ink,
              }}>{v}{disabled ? <span style={{fontSize:9,color:T.faint,marginLeft:4}}>(IL only)</span> : ''}</button>
            );
          })}
        </div>

        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:18 }}>
          <div style={{ fontSize:10, fontWeight:800, color:T.muted, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Author / On Behalf Of</div>
          <textarea value={who} onChange={e=>setWho(e.target.value)} rows={3}
            style={{ width:'100%', padding:'8px 10px', borderRadius:8, border:`1px solid ${T.border}`, fontSize:11, resize:'vertical', boxSizing:'border-box' }} />
        </div>
      </div>

      {/* Right panel */}
      <div>
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={{ fontSize:14, fontWeight:800, color:T.ink }}>
              {selBill ? `${actionLabels[actionType]} — ${selBill.number}` : 'Select a bill to draft'}
            </div>
            <button onClick={generate} disabled={!selBill || loading} style={{
              padding:'9px 20px', borderRadius:8, background: !selBill||loading ? T.bg : T.orange,
              color: !selBill||loading ? T.muted : '#FFF', fontSize:12, fontWeight:700, border:'none', cursor: !selBill||loading ? 'not-allowed':'pointer',
            }}>{loading ? 'Drafting…' : 'Generate Draft'}</button>
          </div>

          {ilgaInstructions}

          {loading && (
            <div style={{ textAlign:'center', padding:40, color:T.muted, fontSize:13, fontStyle:'italic' }}>
              Drafting {actionLabels[actionType]}…
            </div>
          )}

          {error && !loading && (
            <div style={{ background:T.redBg, border:`1px solid ${T.red}30`, borderRadius:8, padding:'12px 16px', marginBottom:16, fontSize:12, color:T.red }}>
              {error}
            </div>
          )}

          {draft && !loading && (
            <>
              <textarea value={draft} onChange={e=>setDraft(e.target.value)} rows={18}
                style={{ width:'100%', padding:'14px', borderRadius:10, border:`1px solid ${T.border}`,
                  fontSize:12, lineHeight:1.8, resize:'vertical', fontFamily:'inherit', boxSizing:'border-box' }} />
              <div style={{ display:'flex', gap:8, marginTop:12 }}>
                <button onClick={() => navigator.clipboard?.writeText(draft)} style={{
                  padding:'8px 16px', borderRadius:8, background:T.ink, color:'#FFF', fontSize:12, fontWeight:700, border:'none', cursor:'pointer',
                }}>Copy to Clipboard</button>
                <button onClick={saveToHistory} style={{
                  padding:'8px 16px', borderRadius:8, background: saved ? T.green : T.surface,
                  color: saved ? '#FFF' : T.ink, fontSize:12, fontWeight:700, border:`1.5px solid ${saved ? T.green : T.border}`, cursor:'pointer',
                }}>{saved ? '✓ Saved to History' : 'Log to Advocacy History'}</button>
              </div>
              {selBill?.level === 'illinois' && actionType === 'witness_slip' && (
                <div style={{ marginTop:10, fontSize:11, color:T.muted, fontStyle:'italic' }}>
                  🔗 Submit at: ilga.gov/Senate/Committees or ilga.gov/House/Committees → search {selBill.number}
                </div>
              )}
            </>
          )}

          {!draft && !loading && !error && (
            <div style={{ textAlign:'center', padding:60, color:T.muted }}>
              <div style={{ fontSize:24, marginBottom:8 }}>✉️</div>
              <div style={{ fontSize:13 }}>Select a bill and action type,<br/>then click Generate Draft.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── TAB 3: ADVOCACY HISTORY ────────────────────────────────────────────────
function AdvocacyHistory({ history, onUpdate }: { history: HistoryEntry[]; onUpdate: (h: HistoryEntry[]) => void }) {
  const [editId, setEditId] = useState<string|null>(null);
  const [editOutcome, setEditOutcome] = useState('');

  const typeLabels: Record<string, string> = {
    witness_slip:'📋 Witness Slip', email:'✉️ Email', call:'📞 Call',
    testimony:'🎤 Testimony', coalition:'🤝 Coalition', other:'📌 Other'
  };

  const saveOutcome = (id: string) => {
    onUpdate(history.map(h => h.id===id ? {...h, outcome: editOutcome} : h));
    setEditId(null);
  };

  const remove = (id: string) => {
    if (window.confirm('Remove this advocacy log entry?')) onUpdate(history.filter(h=>h.id!==id));
  };

  const totals = {
    slips:  history.filter(h=>h.actionType==='witness_slip').length,
    emails: history.filter(h=>h.actionType==='email').length,
    calls:  history.filter(h=>h.actionType==='call').length,
    people: Array.from(new Set(history.map(h=>h.who.split(',')[0]))).length,
  };

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[
          { v:String(history.length), l:'Total Actions',       c:T.ink    },
          { v:String(totals.slips),   l:'Witness Slips',       c:T.orange },
          { v:String(totals.emails),  l:'Emails Sent',         c:T.blue   },
          { v:String(totals.people),  l:'Advocates Engaged',   c:T.purple },
        ].map((t,i) => (
          <div key={i} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:'14px 18px' }}>
            <div style={{ fontSize:9, fontWeight:800, color:T.muted, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>{t.l}</div>
            <div style={{ fontSize:26, fontWeight:900, fontFamily:mono, color:t.c }}>{t.v}</div>
          </div>
        ))}
      </div>

      {history.length === 0 ? (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:60, textAlign:'center', color:T.muted }}>
          <div style={{ fontSize:28, marginBottom:8 }}>📂</div>
          <div style={{ fontSize:13 }}>No advocacy actions logged yet.<br/>Drafts saved from the Action Center will appear here.</div>
        </div>
      ) : (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, overflow:'hidden' }}>
          <div style={{ padding:'10px 16px', background:'#F8FAFC', borderBottom:`1px solid ${T.border}`,
            display:'grid', gridTemplateColumns:'90px 130px 1fr 150px 120px 60px',
            fontSize:9, fontWeight:800, color:T.muted, textTransform:'uppercase', letterSpacing:'0.09em' }}>
            <div>Date</div><div>Bill</div><div>Notes</div><div>By</div><div>Outcome</div><div></div>
          </div>
          {[...history].reverse().map((h, i) => (
            <div key={h.id} style={{ display:'grid', gridTemplateColumns:'90px 130px 1fr 150px 120px 60px',
              padding:'12px 16px', borderBottom: i<history.length-1?`1px solid ${T.border}`:'none',
              background: i%2===0 ? T.surface : '#FAFBFC', alignItems:'start' }}>
              <div style={{ fontSize:11, color:T.muted }}>{h.date}</div>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:T.ink }}>{h.billNumber}</div>
                <div style={{ fontSize:9, color:T.muted }}>{typeLabels[h.actionType]}</div>
              </div>
              <div style={{ fontSize:11, color:T.inkMid, paddingRight:12 }}>{h.notes}</div>
              <div style={{ fontSize:11, color:T.muted }}>{h.who.split(',')[0]}</div>
              <div>
                {editId === h.id ? (
                  <div style={{ display:'flex', gap:4 }}>
                    <input value={editOutcome} onChange={e=>setEditOutcome(e.target.value)}
                      style={{ flex:1, padding:'3px 6px', borderRadius:5, border:`1px solid ${T.border}`, fontSize:10 }} />
                    <button onClick={()=>saveOutcome(h.id)} style={{ padding:'3px 7px', borderRadius:5, background:T.green, color:'#FFF', fontSize:9, border:'none', cursor:'pointer' }}>✓</button>
                  </div>
                ) : (
                  <div onClick={()=>{setEditId(h.id);setEditOutcome(h.outcome??'');}} style={{ fontSize:11, color:h.outcome?T.inkMid:T.faint, cursor:'pointer', fontStyle:h.outcome?'normal':'italic' }}>
                    {h.outcome || 'Add outcome…'}
                  </div>
                )}
              </div>
              <div style={{ textAlign:'right' }}>
                <button onClick={()=>remove(h.id)} style={{ padding:'3px 8px', borderRadius:5, background:T.redBg, color:T.red, fontSize:9, border:'none', cursor:'pointer', fontWeight:700 }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ROOT ───────────────────────────────────────────────────────────────────
const HISTORY_KEY = 'veritas_advocacy_history';
const BILLS_KEY   = 'veritas_tracked_bills';

const TABS = [
  { id:'radar',   l:'📡 Legislative Radar' },
  { id:'action',  l:'⚡ Action Center' },
  { id:'history', l:'📂 Advocacy History' },
];

export default function PublicAffairsApp() {
  const [tab, setTab] = useState('radar');
  const [bills, setBills] = useState<Bill[]>(() => {
    try { const s = localStorage.getItem(BILLS_KEY); return s ? JSON.parse(s) : SEED_BILLS; }
    catch { return SEED_BILLS; }
  });
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    try { const s = localStorage.getItem(HISTORY_KEY); return s ? JSON.parse(s) : []; }
    catch { return []; }
  });
  const [actionBill, setActionBill] = useState<Bill|null>(null);
  const [actionType, setActionType] = useState<string>('email');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { try { localStorage.setItem(BILLS_KEY, JSON.stringify(bills)); } catch {} }, [bills]);
  useEffect(() => { try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch {} }, [history]);

  const handleAction = (bill: Bill, type: string) => {
    setActionBill(bill); setActionType(type); setTab('action');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const prompt = `You are a legislative intelligence analyst for Veritas Charter Schools, a Chicago charter school network of 10 campuses serving 6,823 students.
Search for current (2025-2026) legislation affecting charter schools at three levels:
1. FEDERAL: Any bills in Congress affecting charter school funding, accountability, or IDEA
2. ILLINOIS: Any bills in the Illinois General Assembly affecting Chicago charter schools, including funding, moratoriums, licensure, or authorization
3. LOCAL: Any Chicago City Council actions or CPS Board resolutions affecting charter schools

For each bill found, provide a JSON array with fields: number, title, sponsor, sponsorParty (D/R/I/Bipartisan), chamber, level (federal/illinois/local), status, stage (1-5), lastAction, lastActionDate (YYYY-MM-DD), summary (2-3 sentences on charter school impact for Veritas Charter Schools), veritasPosition (support/oppose/monitor/neutral), trajectoryScore (1-10), charterImpact (high/medium/low), impactType (positive/negative/mixed), tags (array of strings).

Return ONLY a valid JSON array. No markdown, no explanation. Find 3-5 real current bills.`;

      const r = await fetch('/api/anthropic-proxy', {
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
      const text = j.content?.filter((b:any)=>b.type==='text').map((b:any)=>b.text).join('');
      if (text) {
        const clean = text.replace(/```json|```/g,'').trim();
        const start = clean.indexOf('[');
        const end   = clean.lastIndexOf(']') + 1;
        if (start >= 0 && end > start) {
          const parsed = JSON.parse(clean.slice(start, end));
          const newBills: Bill[] = parsed.map((p: any, i: number) => ({
            id: 'ai_' + Date.now() + '_' + i,
            url: p.level === 'illinois' ? 'https://ilga.gov' : p.level === 'federal' ? 'https://congress.gov' : 'https://cps.edu',
            keyContacts: [],
            veritasPosition: p.veritasPosition ?? p.noblePosition ?? 'monitor',
            ...p,
          }));
          setBills(prev => {
            const existingNums = new Set(prev.map(b=>b.number));
            const deduped = newBills.filter(b => !existingNums.has(b.number));
            return [...prev, ...deduped];
          });
        }
      }
    } catch (err) { console.error('Refresh error', err); }
    finally { setRefreshing(false); }
  };

  const addHistory = (e: HistoryEntry) => setHistory(prev => [...prev, e]);
  const updateHistory = (h: HistoryEntry[]) => setHistory(h);

  return (
    <div style={{ fontFamily:"'DM Sans','Inter',system-ui,sans-serif", background:T.bg, minHeight:'100%' }}>
      <PulseBar bills={bills} />

      <div style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, display:'flex', paddingLeft:20 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding:'12px 20px', background:'none', border:'none', cursor:'pointer',
            fontSize:13, fontWeight: tab===t.id ? 700 : 500,
            color: tab===t.id ? T.orange : T.muted,
            borderBottom: tab===t.id ? `2px solid ${T.orange}` : '2px solid transparent',
          }}>{t.l}</button>
        ))}
        <div style={{ marginLeft:'auto', padding:'12px 20px', fontSize:11, color:T.muted, alignSelf:'center' }}>
          Veritas Charter Schools · Slate Civic · {new Date().toLocaleDateString('en-US',{month:'short',year:'numeric'})}
        </div>
      </div>

      <div style={{ padding:'22px 24px 32px' }}>
        {tab==='radar'   && <LegislativeRadar bills={bills} onAction={handleAction} onRefresh={handleRefresh} refreshing={refreshing} />}
        {tab==='action'  && <ActionCenter bills={bills} initialBill={actionBill} initialType={actionType} onHistoryAdd={addHistory} />}
        {tab==='history' && <AdvocacyHistory history={history} onUpdate={updateHistory} />}
      </div>
    </div>
  );
}
