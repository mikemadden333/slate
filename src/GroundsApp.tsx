// @ts-nocheck
import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis,
} from 'recharts';

// ─── TOKENS ───────────────────────────────────────────────────────────────────
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
  teal:    '#0F766E',
  redBg:   '#FEF2F2',
  amberBg: '#FFFBEB',
  greenBg: '#ECFDF5',
  blueBg:  '#EFF6FF',
};

const mono  = "'SF Mono', 'Fira Code', monospace";

const $  = (n: number) => '$' + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
const $M = (n: number) => '$' + (n / 1_000_000).toFixed(2) + 'M';

// ─── CAMPUS SHORT NAMES ───────────────────────────────────────────────────────
// Matches Veritas network: 1 downtown, 4 south side, 4 west side, 1 additional
// Keys used throughout: Loop | Englewood | Woodlawn | Auburn Gresham | Roseland
//                       Chatham | Austin | North Lawndale | Garfield Park | Humboldt Park

// ─── EQUITY INDEX ─────────────────────────────────────────────────────────────
const EQUITY: Record<string, number> = {
  'North Lawndale': 14.8,
  'Garfield Park':  13.9,
  'Roseland':       12.4,
  'Englewood':      11.8,
  'Humboldt Park':  10.2,
  'Auburn Gresham':  9.1,
  'Austin':          8.7,
  'Chatham':         7.3,
  'Woodlawn':        6.1,
  'Loop':            3.4,
};

// ─── FY26 CAPITAL SPEND ───────────────────────────────────────────────────────
const SPEND: Record<string, { fac: number; it: number }> = {
  'Loop':           { fac: 285000,  it: 89000  },
  'Englewood':      { fac: 342000,  it: 76000  },
  'Woodlawn':       { fac: 198000,  it: 63000  },
  'Auburn Gresham': { fac: 145000,  it: 53000  },
  'Roseland':       { fac: 415000,  it: 86000  },
  'Chatham':        { fac: 112000,  it: 43000  },
  'Austin':         { fac: 524000,  it: 94000  },
  'North Lawndale': { fac: 248000,  it: 68000  },
  'Garfield Park':  { fac: 392000,  it: 71000  },
  'Humboldt Park':  { fac: 268000,  it: 58000  },
};

// ─── PROJECTS ─────────────────────────────────────────────────────────────────
interface P {
  campus: string; cat: string; desc: string;
  budget: number; actual: number | null; variance: number | null;
  status: string; notes: string; type: string;
}

const PROJECTS: P[] = [
  // LOOP
  { campus:'Loop',          cat:'Programming',       desc:'Main entry floor replacement',            budget:28000,  actual:27400,  variance:600,    status:'Complete',    notes:'',                                          type:'Facilities'},
  { campus:'Loop',          cat:'Asset Management',  desc:'IDF room air conditioning unit',          budget:18000,  actual:17200,  variance:800,    status:'Complete',    notes:'',                                          type:'Facilities'},
  { campus:'Loop',          cat:'Culture',           desc:'Lobby refresh + signage',                 budget:42000,  actual:38800,  variance:3200,   status:'Complete',    notes:'',                                          type:'Facilities'},
  { campus:'Loop',          cat:'AV/MPR',            desc:'MPR projector system overhaul',           budget:60000,  actual:57200,  variance:2800,   status:'Complete',    notes:'',                                          type:'IT'},
  { campus:'Loop',          cat:'Copiers',           desc:'BLW copier replacement',                  budget:26500,  actual:24100,  variance:2400,   status:'Complete',    notes:'',                                          type:'IT'},

  // ENGLEWOOD
  { campus:'Englewood',     cat:'Asset Management',  desc:'Roof repair Section B',                   budget:145000, actual:138200, variance:6800,   status:'Complete',    notes:'',                                          type:'Facilities'},
  { campus:'Englewood',     cat:'Asset Management',  desc:'Gymnasium lighting upgrade',              budget:32000,  actual:29800,  variance:2200,   status:'Complete',    notes:'',                                          type:'Facilities'},
  { campus:'Englewood',     cat:'Culture',           desc:'Girls bathroom partition replacement',     budget:35000,  actual:35000,  variance:0,      status:'Complete',    notes:'',                                          type:'Facilities'},
  { campus:'Englewood',     cat:'Asset Management',  desc:'Parking lot sealing + striping',          budget:22000,  actual:null,   variance:null,   status:'In Progress', notes:'Invoice submitted to finance 3/1/26',       type:'Facilities'},
  { campus:'Englewood',     cat:'Safety & Security', desc:'Camera system overhaul',                  budget:95000,  actual:88400,  variance:6600,   status:'Complete',    notes:'',                                          type:'IT'},
  { campus:'Englewood',     cat:'Copiers',           desc:'BLW copier replacement 2x',               budget:53000,  actual:48600,  variance:4400,   status:'Complete',    notes:'',                                          type:'IT'},

  // WOODLAWN
  { campus:'Woodlawn',      cat:'Asset Management',  desc:'Exterior tuckpointing',                   budget:85000,  actual:91200,  variance:-6200,  status:'Complete',    notes:'Scope expanded mid-project',                type:'Facilities'},
  { campus:'Woodlawn',      cat:'Culture',           desc:'Subfloor upgrade + LVP flooring',         budget:58000,  actual:54400,  variance:3600,   status:'Complete',    notes:'',                                          type:'Facilities'},
  { campus:'Woodlawn',      cat:'Asset Management',  desc:'Replace failed HVAC check valves',        budget:12000,  actual:12000,  variance:0,      status:'Complete',    notes:'',                                          type:'Facilities'},
  { campus:'Woodlawn',      cat:'AV/MPR',            desc:'MPR AV system modernization',             budget:72000,  actual:74100,  variance:-2100,  status:'Complete',    notes:'',                                          type:'IT'},
  { campus:'Woodlawn',      cat:'Copiers',           desc:'Color copier replacement',                budget:43000,  actual:38800,  variance:4200,   status:'Complete',    notes:'',                                          type:'IT'},

  // AUBURN GRESHAM
  { campus:'Auburn Gresham',cat:'Asset Management',  desc:'Parking lot resurfacing',                 budget:78000,  actual:null,   variance:null,   status:'In Progress', notes:'Weather delay — spring 2026 completion',    type:'Facilities'},
  { campus:'Auburn Gresham',cat:'Asset Management',  desc:'BAS system upgrade',                      budget:64000,  actual:67200,  variance:-3200,  status:'Complete',    notes:'',                                          type:'Facilities'},
  { campus:'Auburn Gresham',cat:'Copiers',           desc:'BLW copier replacement',                  budget:26500,  actual:24100,  variance:2400,   status:'Complete',    notes:'',                                          type:'IT'},

  // ROSELAND
  { campus:'Roseland',      cat:'Programming',       desc:'Track + exterior court resurfacing',      budget:320000, actual:87400,  variance:232600, status:'In Progress', notes:'Major project — summer 2026 completion',    type:'Facilities'},
  { campus:'Roseland',      cat:'Programming',       desc:'Cafeteria renovation',                    budget:95000,  actual:92100,  variance:2900,   status:'Complete',    notes:'',                                          type:'Facilities'},
  { campus:'Roseland',      cat:'Asset Management',  desc:'Fire rated door installation',            budget:24000,  actual:22400,  variance:1600,   status:'Complete',    notes:'',                                          type:'Facilities'},
  { campus:'Roseland',      cat:'Copiers',           desc:'Color + BLW copier replacement',          budget:43000,  actual:38800,  variance:4200,   status:'Complete',    notes:'',                                          type:'IT'},
  { campus:'Roseland',      cat:'Safety & Security', desc:'NVR camera system replacement',           budget:62000,  actual:null,   variance:null,   status:'Not Started', notes:'Life safety item — installation pending',   type:'IT'},

  // CHATHAM
  { campus:'Chatham',       cat:'Culture',           desc:'Hallway flooring installation',           budget:42000,  actual:39800,  variance:2200,   status:'Complete',    notes:'',                                          type:'Facilities'},
  { campus:'Chatham',       cat:'Culture',           desc:'Locker system upgrade',                   budget:38000,  actual:35200,  variance:2800,   status:'Complete',    notes:'',                                          type:'Facilities'},
  { campus:'Chatham',       cat:'Asset Management',  desc:'Grease trap replacement',                 budget:12000,  actual:null,   variance:null,   status:'In Progress', notes:'Spring break completion',                   type:'Facilities'},
  { campus:'Chatham',       cat:'Copiers',           desc:'BLW copier replacement',                  budget:26500,  actual:24100,  variance:2400,   status:'Complete',    notes:'',                                          type:'IT'},

  // AUSTIN
  { campus:'Austin',        cat:'Asset Management',  desc:'HVAC replacement Phase 1',                budget:285000, actual:241000, variance:44000,  status:'In Progress', notes:'Phase 2 planned FY27',                      type:'Facilities'},
  { campus:'Austin',        cat:'Asset Management',  desc:'Window upgrade Phase 1',                  budget:165000, actual:null,   variance:null,   status:'Cancelled',   notes:'Pushed to FY27 — contractor unavailable',  type:'Facilities'},
  { campus:'Austin',        cat:'Culture',           desc:'Classroom subdivision (2 into 4 rooms)',  budget:88000,  actual:42000,  variance:46000,  status:'In Progress', notes:'Framing complete — finish work ongoing',    type:'Facilities'},
  { campus:'Austin',        cat:'Safety & Security', desc:'Camera + NVR system replacement',         budget:87000,  actual:94200,  variance:-7200,  status:'Complete',    notes:'Over budget — scope expanded on site',      type:'IT'},
  { campus:'Austin',        cat:'AV/MPR',            desc:'Gym MPR AV system replacement',           budget:60000,  actual:56400,  variance:3600,   status:'Complete',    notes:'',                                          type:'IT'},
  { campus:'Austin',        cat:'Copiers',           desc:'BLW copier replacement 2x',               budget:53000,  actual:48600,  variance:4400,   status:'Complete',    notes:'',                                          type:'IT'},

  // NORTH LAWNDALE
  { campus:'North Lawndale', cat:'Safety',           desc:'NAC for fire control panel',              budget:8000,   actual:null,   variance:null,   status:'Not Started', notes:'Life safety item — must complete Q4',       type:'Facilities'},
  { campus:'North Lawndale', cat:'Asset Management', desc:'Elevator modernization',                  budget:195000, actual:178400, variance:16600,  status:'In Progress', notes:'Final inspection pending April 2026',       type:'Facilities'},
  { campus:'North Lawndale', cat:'Culture',          desc:'Bathroom renovation 2nd floor',           budget:68000,  actual:65200,  variance:2800,   status:'Complete',    notes:'',                                          type:'Facilities'},
  { campus:'North Lawndale', cat:'Asset Management', desc:'Locker room door replacement',            budget:22000,  actual:24800,  variance:-2800,  status:'Complete',    notes:'Custom sizing required',                    type:'Facilities'},
  { campus:'North Lawndale', cat:'Copiers',          desc:'BLW copier replacement 2x',               budget:53000,  actual:48600,  variance:4400,   status:'Complete',    notes:'',                                          type:'IT'},

  // GARFIELD PARK
  { campus:'Garfield Park',  cat:'Asset Management', desc:'Subfloor + LVP upgrade',                  budget:72000,  actual:69800,  variance:2200,   status:'Complete',    notes:'',                                          type:'Facilities'},
  { campus:'Garfield Park',  cat:'Programming',      desc:'Gymnasium floor installation',            budget:145000, actual:null,   variance:null,   status:'In Progress', notes:'Weather delay — spring start confirmed',    type:'Facilities'},
  { campus:'Garfield Park',  cat:'Asset Management', desc:'Exterior tuckpointing + sandstone',       budget:95000,  actual:null,   variance:null,   status:'Cancelled',   notes:'Pushed to FY27',                           type:'Facilities'},
  { campus:'Garfield Park',  cat:'Safety',           desc:'ATV plow acquisition',                    budget:18000,  actual:18000,  variance:0,      status:'Complete',    notes:'',                                          type:'Facilities'},
  { campus:'Garfield Park',  cat:'Culture',          desc:'Exterior signage refresh',                budget:18000,  actual:21400,  variance:-3400,  status:'Complete',    notes:'Additional panels required',                type:'Facilities'},
  { campus:'Garfield Park',  cat:'Safety & Security',desc:'Camera system overhaul',                  budget:95000,  actual:89200,  variance:5800,   status:'Complete',    notes:'',                                          type:'IT'},
  { campus:'Garfield Park',  cat:'Copiers',          desc:'Color copier replacement',                budget:43000,  actual:38800,  variance:4200,   status:'Complete',    notes:'',                                          type:'IT'},

  // HUMBOLDT PARK
  { campus:'Humboldt Park',  cat:'Asset Management', desc:'Roof replacement north wing',             budget:210000, actual:204800, variance:5200,   status:'Complete',    notes:'',                                          type:'Facilities'},
  { campus:'Humboldt Park',  cat:'Asset Management', desc:'IDF room AC unit',                        budget:18000,  actual:17200,  variance:800,    status:'Complete',    notes:'',                                          type:'Facilities'},
  { campus:'Humboldt Park',  cat:'Culture',          desc:'Dance studio bars + mirrors',             budget:28000,  actual:26800,  variance:1200,   status:'Complete',    notes:'',                                          type:'Facilities'},
  { campus:'Humboldt Park',  cat:'Asset Management', desc:'Bathroom partitions 1st floor',           budget:33000,  actual:null,   variance:null,   status:'In Progress', notes:'After spring break',                        type:'Facilities'},
  { campus:'Humboldt Park',  cat:'AV/MPR',           desc:'MPR projector system overhaul',           budget:60000,  actual:57600,  variance:2400,   status:'Complete',    notes:'',                                          type:'IT'},
  { campus:'Humboldt Park',  cat:'Copiers',          desc:'BLW copier replacement 2x',               budget:53000,  actual:48600,  variance:4400,   status:'Complete',    notes:'',                                          type:'IT'},
];

// ─── DERIVED ──────────────────────────────────────────────────────────────────
const ip        = PROJECTS.filter(p => p.status === 'In Progress');
const done      = PROJECTS.filter(p => p.status === 'Complete');
const cancelled = PROJECTS.filter(p => p.status === 'Cancelled');
const over      = PROJECTS.filter(p => p.variance !== null && p.variance < -2000);
const totalBgt  = PROJECTS.reduce((s, p) => s + p.budget, 0);
const totalAct  = PROJECTS.reduce((s, p) => s + (p.actual ?? 0), 0);

// ─── PULSE BAR ────────────────────────────────────────────────────────────────
function PulseBar() {
  const pct = (totalAct / totalBgt * 100).toFixed(0);
  const tiles = [
    { v: $M(totalBgt),       l: 'CIP Budget',   c: T.ink    },
    { v: $M(totalAct),       l: 'Spent',         c: T.orange },
    { v: pct + '%',          l: 'of plan',       c: T.teal   },
    { v: String(ip.length),  l: 'In Progress',   c: T.blue   },
    { v: String(over.length),l: 'Over Budget',   c: T.red    },
    { v: String(done.length),l: 'Complete',      c: T.green  },
  ];
  return (
    <div style={{ display:'flex', gap:0, borderBottom:`1px solid ${T.border}`, background:T.surface }}>
      {tiles.map((t, i) => (
        <div key={i} style={{ flex:1, padding:'14px 20px', borderRight: i < tiles.length-1 ? `1px solid ${T.border}` : 'none' }}>
          <div style={{ fontSize:9, fontWeight:800, color:T.muted, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:4 }}>{t.l}</div>
          <div style={{ fontSize:21, fontWeight:900, color:t.c, fontFamily:mono, letterSpacing:'-0.02em' }}>{t.v}</div>
        </div>
      ))}
    </div>
  );
}

// ─── COMMAND CENTER ───────────────────────────────────────────────────────────
function CommandCenter() {
  const remaining = totalBgt - totalAct;
  const burnPct   = totalAct / totalBgt * 100;
  const ipBgt     = ip.reduce((s,p)=>s+p.budget,0);
  const ipAct     = ip.reduce((s,p)=>s+(p.actual??0),0);

  const campusData = Object.entries(SPEND)
    .map(([c, v]) => ({ name: c, fac: v.fac, it: v.it, total: v.fac + v.it }))
    .sort((a, b) => b.total - a.total);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

        {/* Budget Burn */}
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:24 }}>
          <div style={{ fontSize:10, fontWeight:800, color:T.muted, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:16 }}>Budget Execution</div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:12 }}>
            <div>
              <div style={{ fontSize:11, color:T.muted, marginBottom:2 }}>Total budget</div>
              <div style={{ fontSize:28, fontWeight:900, color:T.ink, fontFamily:mono }}>{$M(totalBgt)}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:11, color:T.muted }}>Remaining</div>
              <div style={{ fontSize:20, fontWeight:800, color:T.teal, fontFamily:mono }}>{$M(remaining)}</div>
            </div>
          </div>
          <div style={{ position:'relative', height:10, background:'#E5E9EF', borderRadius:5, overflow:'hidden', marginBottom:8 }}>
            <div style={{ position:'absolute', left:0, top:0, height:'100%', width:burnPct+'%',
              background:`linear-gradient(90deg, ${T.teal}, ${T.orange})`, borderRadius:5 }} />
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:T.muted, marginBottom:20 }}>
            <span>{burnPct.toFixed(0)}% deployed</span><span>{$M(remaining)} remaining</span>
          </div>
          <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:16 }}>
            <div style={{ fontSize:10, fontWeight:700, color:T.muted, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>
              In Progress — {ip.length} projects
            </div>
            <div style={{ display:'flex', gap:20 }}>
              <div><div style={{ fontSize:10, color:T.muted }}>Budgeted</div><div style={{ fontSize:16, fontWeight:800, color:T.ink, fontFamily:mono }}>{$M(ipBgt)}</div></div>
              <div><div style={{ fontSize:10, color:T.muted }}>Spent</div><div style={{ fontSize:16, fontWeight:800, color:T.orange, fontFamily:mono }}>{$M(ipAct)}</div></div>
              <div><div style={{ fontSize:10, color:T.muted }}>Left to spend</div><div style={{ fontSize:16, fontWeight:800, color:T.teal, fontFamily:mono }}>{$M(ipBgt-ipAct)}</div></div>
            </div>
          </div>
        </div>

        {/* Attention Flags */}
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:24 }}>
          <div style={{ fontSize:10, fontWeight:800, color:T.red, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:14 }}>⚠ Needs Attention</div>
          <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
            {[
              { c:'North Lawndale', d:'NAC fire control panel',          n:'Not started — life safety item, must complete Q4',   sev:'critical'},
              { c:'Austin',         d:'Camera + NVR replacement',         n:'Completed $7.2K over budget — scope expanded on site', sev:'critical'},
              { c:'Woodlawn',       d:'Exterior tuckpointing',            n:'Completed $6.2K over budget',                        sev:'critical'},
              { c:'Auburn Gresham', d:'BAS system upgrade',               n:'Completed $3.2K over budget',                        sev:'critical'},
              { c:'Garfield Park',  d:'Exterior signage refresh',         n:'Completed $3.4K over budget — additional panels',    sev:'critical'},
              { c:'Roseland',       d:'Track + court resurfacing',        n:'$320K project — $232K unspent, summer finish',       sev:'watch'},
              { c:'Austin',         d:'HVAC replacement Phase 1',         n:'$285K project — $44K unspent, Phase 2 in FY27',      sev:'watch'},
            ].map((f, i) => (
              <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'8px 12px', borderRadius:8,
                background: f.sev==='critical' ? T.redBg : T.amberBg,
                borderLeft:`3px solid ${f.sev==='critical' ? T.red : T.amber}` }}>
                <div style={{ flex:1 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:T.ink }}>{f.c}</span>
                  <span style={{ fontSize:12, color:T.inkMid }}> — {f.d}</span>
                  <div style={{ fontSize:10, color:T.muted, marginTop:2, fontStyle:'italic' }}>{f.n}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Campus Capital Chart */}
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:24 }}>
        <div style={{ fontSize:10, fontWeight:800, color:T.muted, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:16 }}>
          FY26 Capital by Campus — Facilities vs IT
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={campusData} layout="vertical" barSize={10} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
            <XAxis type="number" tickFormatter={v=>'$'+(v/1000).toFixed(0)+'K'} tick={{ fontSize:10, fill:T.muted }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize:10, fill:T.inkMid }} width={110} />
            <Tooltip contentStyle={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, fontSize:12 }}
              formatter={(v:number)=>[$( v)]} />
            <Bar dataKey="fac" name="Facilities" fill={T.orange} stackId="s" />
            <Bar dataKey="it"  name="IT"         fill={T.blue}   stackId="s" radius={[0,3,3,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── PROJECT TRACKER ──────────────────────────────────────────────────────────
function ProjectTracker() {
  const campuses = ['All', ...Array.from(new Set(PROJECTS.map(p=>p.campus))).sort()];
  const [fCampus, setFC] = useState('All');
  const [fStatus, setFS] = useState('All');
  const [fType,   setFT] = useState('All');
  const [search,  setSr] = useState('');

  const rows = useMemo(() => PROJECTS.filter(p =>
    (fCampus==='All' || p.campus===fCampus) &&
    (fStatus==='All' || p.status===fStatus) &&
    (fType  ==='All' || p.type  ===fType  ) &&
    (!search || p.desc.toLowerCase().includes(search.toLowerCase()) || p.campus.toLowerCase().includes(search.toLowerCase()))
  ), [fCampus, fStatus, fType, search]);

  const chip = (s: string) => {
    const m: Record<string,[string,string]> = {
      'Complete':    [T.green, T.greenBg],
      'In Progress': [T.blue,  T.blueBg ],
      'Cancelled':   [T.muted, '#F1F5F9'],
      'Not Started': [T.amber, T.amberBg],
    };
    const [c, bg] = m[s] ?? [T.muted, '#F1F5F9'];
    return (
      <span style={{ fontSize:9, fontWeight:800, padding:'2px 8px', borderRadius:20,
        color:c, background:bg, letterSpacing:'0.06em', textTransform:'uppercase', whiteSpace:'nowrap' }}>
        {s}
      </span>
    );
  };

  return (
    <div>
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:'12px 14px',
        marginBottom:12, display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
        <input value={search} onChange={e=>setSr(e.target.value)} placeholder="Search…"
          style={{ padding:'7px 12px', borderRadius:7, border:`1px solid ${T.border}`, fontSize:12, outline:'none', flex:'1 1 160px' }} />
        <select value={fCampus} onChange={e=>setFC(e.target.value)}
          style={{ padding:'7px 10px', borderRadius:7, border:`1px solid ${T.border}`, fontSize:12, flex:'1 1 130px' }}>
          {campuses.map(c=><option key={c}>{c}</option>)}
        </select>
        <select value={fStatus} onChange={e=>setFS(e.target.value)}
          style={{ padding:'7px 10px', borderRadius:7, border:`1px solid ${T.border}`, fontSize:12 }}>
          {['All','Complete','In Progress','Cancelled','Not Started'].map(s=><option key={s}>{s}</option>)}
        </select>
        <select value={fType} onChange={e=>setFT(e.target.value)}
          style={{ padding:'7px 10px', borderRadius:7, border:`1px solid ${T.border}`, fontSize:12 }}>
          {['All','Facilities','IT'].map(t=><option key={t}>{t}</option>)}
        </select>
        <span style={{ fontSize:11, color:T.muted, whiteSpace:'nowrap' }}>
          {rows.length} · {$M(rows.reduce((s,p)=>s+p.budget,0))} budget
        </span>
      </div>

      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:'110px 1fr 90px 86px 86px 86px',
          padding:'8px 14px', background:'#F8FAFC', borderBottom:`1px solid ${T.border}`,
          fontSize:9, fontWeight:800, color:T.muted, textTransform:'uppercase', letterSpacing:'0.09em' }}>
          <div>Campus</div><div>Project</div><div>Status</div>
          <div style={{textAlign:'right'}}>Budget</div>
          <div style={{textAlign:'right'}}>Actual</div>
          <div style={{textAlign:'right'}}>Variance</div>
        </div>
        <div style={{ maxHeight:520, overflowY:'auto' }}>
          {rows.map((p, i) => {
            const vc = p.variance===null ? T.muted : p.variance>=0 ? T.green : T.red;
            return (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'110px 1fr 90px 86px 86px 86px',
                padding:'9px 14px', borderBottom: i<rows.length-1 ? `1px solid ${T.border}` : 'none',
                background: i%2===0 ? T.surface : '#FAFBFC' }}>
                <div style={{ fontSize:11, fontWeight:700, color:T.ink }}>{p.campus}</div>
                <div>
                  <div style={{ fontSize:11, color:T.inkMid }}>{p.desc}</div>
                  <div style={{ fontSize:10, color:T.muted }}>{p.cat} · {p.type}</div>
                  {p.notes && <div style={{ fontSize:9, color:T.muted, fontStyle:'italic', marginTop:1 }}>{p.notes.slice(0,70)}{p.notes.length>70?'…':''}</div>}
                </div>
                <div>{chip(p.status)}</div>
                <div style={{ fontSize:11, textAlign:'right', fontFamily:mono, color:T.muted }}>{p.budget>0 ? $(p.budget) : '—'}</div>
                <div style={{ fontSize:11, textAlign:'right', fontFamily:mono, color:T.muted }}>{p.actual!==null ? $(p.actual) : '—'}</div>
                <div style={{ fontSize:11, textAlign:'right', fontFamily:mono, fontWeight:700, color:vc }}>
                  {p.variance!==null ? (p.variance>=0?'+':'') + $(p.variance) : '—'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── EQUITY ALIGNMENT ─────────────────────────────────────────────────────────
function EquityAlignment() {
  const avg = Object.values(SPEND).reduce((s,v)=>s+v.fac+v.it,0) / Object.keys(SPEND).length;
  const data = Object.entries(EQUITY)
    .map(([campus, eq]) => ({
      campus, eq,
      spend: (SPEND[campus]?.fac ?? 0) + (SPEND[campus]?.it ?? 0),
    }))
    .sort((a,b)=>b.eq-a.eq);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ background:'#FEFCE8', border:'1px solid #FEF08A', borderRadius:10, padding:'11px 16px',
        fontSize:12, color:'#713F12', lineHeight:1.6 }}>
        <strong>Equity Index</strong> — Higher = greater facility need. North Lawndale (14.8) and Garfield Park (13.9) carry the highest need in the network.
        Roseland (12.4) received significant capital this cycle for the track project. This view exists to make the tension between investment and need visible.
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {/* Scatter */}
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:22 }}>
          <div style={{ fontSize:10, fontWeight:800, color:T.muted, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:4 }}>Need vs Investment</div>
          <div style={{ fontSize:11, color:T.muted, marginBottom:16 }}>X axis = equity score (higher = more need) · Y = FY26 capital spend</div>
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="x" name="Equity" type="number" domain={[0,16]} tick={{ fontSize:10, fill:T.muted }}
                label={{ value:'Need →', position:'insideBottom', offset:-3, fontSize:10, fill:T.muted }} />
              <YAxis dataKey="y" name="Spend $K" type="number" tickFormatter={v=>'$'+v+'K'} tick={{ fontSize:10, fill:T.muted }} />
              <ZAxis range={[55,55]} />
              <Tooltip content={({ payload }) => {
                if (!payload?.length) return null;
                const d = payload[0]?.payload;
                return (
                  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:'8px 12px', fontSize:12 }}>
                    <div style={{ fontWeight:800 }}>{d?.campus}</div>
                    <div>Equity: {d?.x}</div>
                    <div>FY26 spend: {$((d?.y??0)*1000)}</div>
                  </div>
                );
              }} />
              <Scatter data={data.map(d=>({ x:d.eq, y:d.spend/1000, campus:d.campus }))} fill={T.orange} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Ranked table */}
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:22 }}>
          <div style={{ fontSize:10, fontWeight:800, color:T.muted, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:14 }}>
            All Campuses — Sorted by Need
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:340, overflowY:'auto' }}>
            {data.map(d => {
              const flag = d.eq >= 7 && d.spend < avg;
              return (
                <div key={d.campus} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 11px',
                  background: flag ? '#FEFCE8' : '#F8FAFC', borderRadius:8,
                  border:`1px solid ${flag ? '#FEF08A' : T.border}` }}>
                  <div style={{ flex:'0 0 110px', fontSize:12, fontWeight:700, color:T.ink }}>{d.campus}</div>
                  <div style={{ flex:'0 0 42px', fontSize:14, fontWeight:900, fontFamily:mono,
                    color: d.eq>=12 ? T.red : d.eq>=8 ? T.amber : T.muted }}>{d.eq}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ height:4, background:T.border, borderRadius:2, overflow:'hidden', marginBottom:2 }}>
                      <div style={{ width:`${Math.min(d.spend/700000*100,100)}%`, height:'100%', background:T.orange, borderRadius:2 }} />
                    </div>
                    <div style={{ fontSize:9, color:T.muted }}>{$(d.spend)}</div>
                  </div>
                  {flag && <span style={{ fontSize:8, fontWeight:900, color:'#92400E', background:'#FEF9C3', padding:'2px 6px', borderRadius:8, textTransform:'uppercase', letterSpacing:'0.06em' }}>High Need</span>}
                </div>
              );
            })}
          </div>
          <div style={{ fontSize:10, color:T.muted, marginTop:8 }}>🟡 Yellow = equity ≥7 and below-average investment</div>
        </div>
      </div>

      {/* Bar sorted by need */}
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:22 }}>
        <div style={{ fontSize:10, fontWeight:800, color:T.muted, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:14 }}>
          FY26 Investment — Highest Need Campuses First
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} layout="vertical" barSize={16}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
            <XAxis type="number" tickFormatter={v=>'$'+(v/1000)+'K'} tick={{ fontSize:10, fill:T.muted }} />
            <YAxis type="category" dataKey="campus" tick={{ fontSize:11, fill:T.inkMid }} width={110} />
            <Tooltip contentStyle={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, fontSize:12 }}
              formatter={(v:number)=>[ $(v),'FY26 Spend']} />
            <Bar dataKey="spend" radius={[0,4,4,0]}>
              {data.map((d,i)=>(
                <Cell key={i} fill={d.eq>=12 ? T.red : d.eq>=8 ? T.amber : T.orange} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── AI ADVISOR ───────────────────────────────────────────────────────────────
function AIAdvisor() {
  const [response, setResponse] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [ran,      setRan]      = useState(false);
  const [mode,     setMode]     = useState<'brief'|'risk'|'equity'|'freeform'>('brief');
  const [q,        setQ]        = useState('');

  const ctx = `VERITAS CHARTER SCHOOLS — FY26 CIP
10 campuses across Chicago's South and West sides plus downtown Loop.
Budget: ${$M(totalBgt)} · Spent: ${$M(totalAct)} (${(totalAct/totalBgt*100).toFixed(0)}%) · ${PROJECTS.length} projects (${done.length} complete, ${ip.length} in progress, ${cancelled.length} cancelled)
Over-budget completions: Austin camera/NVR $7.2K, Woodlawn tuckpointing $6.2K, Auburn Gresham BAS $3.2K, Garfield Park signage $3.4K
Life-safety concern: North Lawndale fire control panel NAC ($8K, not started — must complete Q4)
Largest in-progress: Roseland track/court $320K (27% spent, summer finish), Austin HVAC Phase 1 $285K (85% spent)
At-risk: North Lawndale elevator — in progress, final inspection pending April 2026
Cancelled budget freed: Austin windows $165K, Garfield Park tuckpointing $95K
Equity vs spend: North Lawndale equity 14.8 got $316K · Garfield Park equity 13.9 got $463K · Roseland equity 12.4 got $501K · Englewood equity 11.8 got $418K · Loop equity 3.4 got $374K`;

  const prompts = {
    brief:    `${ctx}\n\nYou are the COO of Veritas Charter Schools. Give a sharp executive CIP brief: (1) Overall execution status and what it says about capital discipline, (2) Top 3 items needing attention right now, (3) What the cancellations mean for FY27, (4) One strategic observation. Under 220 words. Numbers only, no platitudes.`,
    risk:     `${ctx}\n\nRisk-assess the FY26 CIP: (1) Highest-risk in-progress projects and why, (2) What the pattern of over-budget completions says about estimating, (3) Whether contingency is adequate, (4) Worst-case scenario for remaining in-progress spend. Under 220 words.`,
    equity:   `${ctx}\n\nEquity-alignment analysis: (1) Which high-need campuses are underinvested relative to their equity score, (2) Whether the Roseland and Loop investment levels are defensible, (3) A specific FY27 reallocation recommendation. Under 220 words. Name campuses and dollars.`,
    freeform: `${ctx}\n\nQuestion: ${q}\n\nAnswer directly, reference actual data, under 200 words.`,
  };

  const run = async (m: typeof mode = mode) => {
    setLoading(true); setResponse(''); setRan(true);
    try {
      const r = await fetch('/api/anthropic-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role:'user', content: prompts[m] }],
        }),
      });
      const j = await r.json();
      setResponse(j.content?.map((b:any)=>b.type==='text'?b.text:'').join('') ?? 'No response.');
    } catch {
      setResponse('Analysis unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const modes = [
    { id:'brief'    as const, l:'Executive Brief'  },
    { id:'risk'     as const, l:'Risk Assessment'  },
    { id:'equity'   as const, l:'Equity Alignment' },
    { id:'freeform' as const, l:'Ask a Question'   },
  ];

  return (
    <div>
      <div style={{ display:'flex', gap:6, marginBottom:18, flexWrap:'wrap' }}>
        {modes.map(m=>(
          <button key={m.id} onClick={()=>{ setMode(m.id); setResponse(''); setRan(false); }} style={{
            padding:'8px 18px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer',
            border:`1.5px solid ${mode===m.id ? T.orange : T.border}`,
            background: mode===m.id ? T.orange : T.surface,
            color: mode===m.id ? '#FFF' : T.muted,
          }}>{m.l}</button>
        ))}
      </div>
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:26 }}>
        {mode==='freeform' && (
          <div style={{ display:'flex', gap:8, marginBottom:16 }}>
            <input value={q} onChange={e=>setQ(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&q.trim()&&run('freeform')}
              placeholder="e.g. Which campuses have the most deferred work from cancellations?"
              style={{ flex:1, padding:'10px 13px', borderRadius:8, border:`1px solid ${T.border}`, fontSize:13, outline:'none' }} />
            <button onClick={()=>run('freeform')} disabled={!q.trim()||loading}
              style={{ padding:'10px 20px', borderRadius:8, background:T.orange, color:'#FFF', fontWeight:700, fontSize:13, border:'none', cursor:'pointer' }}>Ask</button>
          </div>
        )}
        {mode!=='freeform' && !ran && (
          <button onClick={()=>run(mode)}
            style={{ padding:'10px 24px', borderRadius:8, background:T.ink, color:'#FFF', fontWeight:700, fontSize:13, border:'none', cursor:'pointer', marginBottom:16 }}>
            Run Analysis
          </button>
        )}
        {ran && !loading && (
          <button onClick={()=>run(mode)}
            style={{ marginBottom:12, fontSize:11, color:T.muted, background:'none', border:`1px solid ${T.border}`, borderRadius:6, padding:'3px 10px', cursor:'pointer' }}>
            Re-run
          </button>
        )}
        {loading  && <div style={{ fontSize:13, color:T.muted, fontStyle:'italic' }}>Analyzing FY26 CIP data…</div>}
        {response && <div style={{ fontSize:14, color:T.ink, lineHeight:1.85, whiteSpace:'pre-wrap' }}>{response}</div>}
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id:'command', l:'⚡ Command Center'  },
  { id:'tracker', l:'📋 Project Tracker' },
  { id:'equity',  l:'⚖️ Equity Alignment'},
  { id:'ai',      l:'🤖 AI Advisor'      },
];

export default function GroundsApp() {
  const [tab, setTab] = useState('command');
  return (
    <div style={{ fontFamily:"'DM Sans','Inter',system-ui,sans-serif", background:T.bg, minHeight:'100%' }}>
      <PulseBar />
      <div style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, display:'flex', gap:0, paddingLeft:20 }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            padding:'12px 20px', background:'none', border:'none', cursor:'pointer',
            fontSize:13, fontWeight: tab===t.id ? 700 : 500,
            color: tab===t.id ? T.orange : T.muted,
            borderBottom: tab===t.id ? `2px solid ${T.orange}` : '2px solid transparent',
          }}>{t.l}</button>
        ))}
        <div style={{ marginLeft:'auto', padding:'12px 20px', fontSize:11, color:T.muted, alignSelf:'center' }}>
          FY26 · 10 campuses · {$M(totalBgt)} CIP
        </div>
      </div>
      <div style={{ padding:'22px 24px 32px' }}>
        {tab==='command' && <CommandCenter />}
        {tab==='tracker' && <ProjectTracker />}
        {tab==='equity'  && <EquityAlignment />}
        {tab==='ai'      && <AIAdvisor />}
      </div>
    </div>
  );
}
