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
  // status backgrounds
  redBg:   '#FEF2F2',
  amberBg: '#FFFBEB',
  greenBg: '#ECFDF5',
  blueBg:  '#EFF6FF',
};

const mono = "'SF Mono', 'Fira Code', monospace";
const serif = "Georgia, 'Times New Roman', serif";

const $  = (n: number) => '$' + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
const $M = (n: number) => '$' + (n / 1_000_000).toFixed(2) + 'M';

// ─── DATA ─────────────────────────────────────────────────────────────────────
const EQUITY: Record<string, number> = {
  'DRW': 15.3, 'Johnson': 12.6, 'Rowe-Clark': 12.3, 'Comer MS': 10.3,
  'Baker': 9.2, 'Butler': 9.2, 'Comer': 7.8, 'Hansberry': 7.0,
  'Rauner': 6.2, 'Bulls': 5.9, 'Golder': 5.9, 'UIC': 5.4,
  'Noble Academy': 4.8, 'Pritzker': 4.6, 'Speer': 4.4,
  'Noble St.': 4.1, 'Muchin': 3.8, 'Mansueto': 3.3,
};

const SPEND: Record<string, { fac: number; it: number }> = {
  'Baker':         { fac: 24000,   it: 26500  },
  'Bulls':         { fac: 435000,  it: 79500  },
  'Butler':        { fac: 255000,  it: 73000  },
  'Comer':         { fac: 60000,   it: 43000  },
  'Comer MS':      { fac: 0,       it: 53000  },
  'DRW':           { fac: 200000,  it: 0      },
  'Golder':        { fac: 230000,  it: 16500  },
  'Hansberry':     { fac: 114942,  it: 53000  },
  'Johnson':       { fac: 175000,  it: 136000 },
  'Mansueto':      { fac: 35000,   it: 166500 },
  'Muchin':        { fac: 196000,  it: 53000  },
  'Noble Academy': { fac: 944800,  it: 60000  },
  'Noble St.':     { fac: 150000,  it: 26500  },
  'Pritzker':      { fac: 524240,  it: 76500  },
  'Rauner':        { fac: 384000,  it: 53000  },
  'Rowe-Clark':    { fac: 200000,  it: 131500 },
  'Speer':         { fac: 73500,   it: 79500  },
  'UIC':           { fac: 495978,  it: 46500  },
};

interface P {
  campus: string; cat: string; desc: string;
  budget: number; actual: number | null; variance: number | null;
  status: string; notes: string; type: string;
}

const PROJECTS: P[] = [
  { campus:'Baker',cat:'Programming',desc:'Floor Replacement',budget:24000,actual:24680,variance:-680,status:'Complete',notes:'',type:'Facilities'},
  { campus:'Bulls',cat:'Asset Management',desc:'3rd floor Classroom flooring',budget:80000,actual:76750,variance:3250,status:'Complete',notes:'',type:'Facilities'},
  { campus:'Bulls',cat:'Asset Management',desc:'Basement brick wall rebuild',budget:80000,actual:49750,variance:30250,status:'In Progress',notes:'Final invoice pending 2/6',type:'Facilities'},
  { campus:'Bulls',cat:'Asset Management',desc:'Elevator Modernization',budget:275000,actual:262374,variance:12626,status:'Complete',notes:'',type:'Facilities'},
  { campus:'Butler',cat:'Culture',desc:'Classroom 218 + 114 Flooring',budget:32000,actual:57500,variance:-25500,status:'Complete',notes:'',type:'Facilities'},
  { campus:'Butler',cat:'Culture',desc:'Lockers system upgrade',budget:223000,actual:205785,variance:17215,status:'Complete',notes:'',type:'Facilities'},
  { campus:'Comer',cat:'Asset Management',desc:'Classroom Whiteboards',budget:20000,actual:32398,variance:-12398,status:'Complete',notes:'',type:'Facilities'},
  { campus:'Comer',cat:'Asset Management',desc:'6 New Blower Motors',budget:15000,actual:14772,variance:228,status:'Complete',notes:'',type:'Facilities'},
  { campus:'Comer',cat:'Culture',desc:'Exterior storage shed',budget:25000,actual:29700,variance:-4700,status:'Complete',notes:'',type:'Facilities'},
  { campus:'DRW',cat:'Asset Management',desc:'Heat pump upgrade',budget:200000,actual:157666,variance:45552,status:'Complete',notes:'',type:'Facilities'},
  { campus:'Golder',cat:'Asset Management',desc:'Sewer rebuild',budget:50000,actual:null,variance:null,status:'Cancelled',notes:'Tree root cutting resolved issue',type:'Facilities'},
  { campus:'Golder',cat:'Culture',desc:'Subfloor upgrade / LVP flooring',budget:50000,actual:31718,variance:18282,status:'Complete',notes:'',type:'Facilities'},
  { campus:'Golder',cat:'Asset Management',desc:'Exterior tuckpointing',budget:130000,actual:171103,variance:-41103,status:'Complete',notes:'',type:'Facilities'},
  { campus:'Hansberry',cat:'Culture',desc:'Girls north bathroom partitions',budget:35000,actual:35000,variance:0,status:'Complete',notes:'',type:'Facilities'},
  { campus:'Hansberry',cat:'Programming',desc:'Dance Studio bars and mirrors',budget:41942,actual:40565,variance:1377,status:'Complete',notes:'',type:'Facilities'},
  { campus:'Hansberry',cat:'Asset Management',desc:'IDF Room Air Conditioning',budget:20000,actual:18118,variance:1882,status:'Complete',notes:'',type:'Facilities'},
  { campus:'Hansberry',cat:'Safety',desc:'ATV Plow',budget:18000,actual:null,variance:null,status:'Complete',notes:'Purchased on CC',type:'Facilities'},
  { campus:'Johnson',cat:'Programming',desc:'Gym Floor installation',budget:157000,actual:null,variance:null,status:'Cancelled',notes:'On hold — CPS work',type:'Facilities'},
  { campus:'Johnson',cat:'Safety',desc:'ATV Plow',budget:18000,actual:18118,variance:-118,status:'Complete',notes:'',type:'Facilities'},
  { campus:'Mansueto',cat:'Asset Management',desc:'IDF Room AC unit',budget:20000,actual:5922,variance:14078,status:'Complete',notes:'',type:'Facilities'},
  { campus:'Mansueto',cat:'Asset Management',desc:'Parking Lot Sealing + Striping',budget:15000,actual:6600,variance:8400,status:'In Progress',notes:'Invoice submitted to Stampli 2/3/26',type:'Facilities'},
  { campus:'Muchin',cat:'Asset Management',desc:'Classroom subdivision (2→4 rooms)',budget:130000,actual:58700,variance:71300,status:'Complete',notes:'Scope reduced — one room only',type:'Facilities'},
  { campus:'Muchin',cat:'Asset Management',desc:'New Bathroom Partition',budget:50000,actual:57493,variance:-7493,status:'Complete',notes:'',type:'Facilities'},
  { campus:'Muchin',cat:'Programming',desc:'Wiggle Room',budget:16000,actual:13487,variance:2513,status:'Complete',notes:'',type:'Facilities'},
  { campus:'Noble Academy',cat:'Programming',desc:'Track + basketball exterior court',budget:900000,actual:203708,variance:696292,status:'In Progress',notes:'Completes summer 2026',type:'Facilities'},
  { campus:'Noble Academy',cat:'Asset Management',desc:'VCT hallway floor upgrade',budget:44800,actual:null,variance:null,status:'Cancelled',notes:'Pushed to FY27',type:'Facilities'},
  { campus:'Noble St.',cat:'Culture',desc:'Building Refresh',budget:150000,actual:112950,variance:37050,status:'Complete',notes:'',type:'Facilities'},
  { campus:'Pritzker',cat:'Programming',desc:'Black Top Resurfacing',budget:250000,actual:32818,variance:217183,status:'In Progress',notes:'Weather delay — spring 2026',type:'Facilities'},
  { campus:'Pritzker',cat:'Asset Management',desc:'North building Roof replacement',budget:85240,actual:80240,variance:5000,status:'Complete',notes:'',type:'Facilities'},
  { campus:'Pritzker',cat:'Asset Management',desc:'Subfloor upgrade Room 213',budget:65000,actual:55310,variance:9690,status:'Complete',notes:'',type:'Facilities'},
  { campus:'Pritzker',cat:'Asset Management',desc:'Fire Rated Door Installation',budget:24000,actual:21322,variance:2678,status:'Complete',notes:'',type:'Facilities'},
  { campus:'Pritzker',cat:'Programming',desc:'Mini Bus Acquisition',budget:100000,actual:null,variance:null,status:'In Progress',notes:'Invoice routed through Darko',type:'Facilities'},
  { campus:'Rauner',cat:'Programming',desc:'MPR Flooring Phase 2',budget:115000,actual:114792,variance:208,status:'Complete',notes:'',type:'Facilities'},
  { campus:'Rauner',cat:'Asset Management',desc:'Locker Painting',budget:12000,actual:9968,variance:2032,status:'Complete',notes:'',type:'Facilities'},
  { campus:'Rauner',cat:'Culture',desc:'Hallway Flooring Installation',budget:44000,actual:35517,variance:8483,status:'Complete',notes:'',type:'Facilities'},
  { campus:'Rauner',cat:'Asset Management',desc:'Parking Lot Redo',budget:73000,actual:75020,variance:-2020,status:'In Progress',notes:'Invoice submitted to Stampli 2/3/26',type:'Facilities'},
  { campus:'Rauner',cat:'Asset Management',desc:'BAS System Upgrade',budget:140000,actual:140855,variance:-855,status:'Complete',notes:'',type:'Facilities'},
  { campus:'Rowe-Clark',cat:'Asset Management',desc:'Elevator system upgrade',budget:75000,actual:83363,variance:-8363,status:'In Progress',notes:'Over budget · Parts delayed · Summer 2026 start',type:'Facilities'},
  { campus:'Rowe-Clark',cat:'Asset Management',desc:'Lobby + office ceilings',budget:45000,actual:41518,variance:3482,status:'Complete',notes:'',type:'Facilities'},
  { campus:'Rowe-Clark',cat:'Asset Management',desc:'Gym Sinks Replacement',budget:40000,actual:37200,variance:2800,status:'Complete',notes:'',type:'Facilities'},
  { campus:'Rowe-Clark',cat:'Asset Management',desc:'Gym Lighting Upgrade',budget:20000,actual:18980,variance:1020,status:'Complete',notes:'',type:'Facilities'},
  { campus:'Rowe-Clark',cat:'Culture',desc:'Gravel Paving Installation',budget:15000,actual:16950,variance:-1950,status:'Complete',notes:'',type:'Facilities'},
  { campus:'Speer',cat:'Asset Management',desc:'Parking lot conversion',budget:12000,actual:15200,variance:-3200,status:'Complete',notes:'',type:'Facilities'},
  { campus:'Speer',cat:'Asset Management',desc:'Field Refresh',budget:19000,actual:17200,variance:1800,status:'Complete',notes:'',type:'Facilities'},
  { campus:'Speer',cat:'Asset Management',desc:'Locker Room Doors',budget:35000,actual:32213,variance:2787,status:'Complete',notes:'',type:'Facilities'},
  { campus:'UIC',cat:'Asset Management',desc:'Window upgrade Phase 1',budget:273000,actual:null,variance:null,status:'Cancelled',notes:'',type:'Facilities'},
  { campus:'UIC',cat:'Asset Management',desc:'Exterior student door entry #5',budget:36600,actual:33600,variance:null,status:'Complete',notes:'',type:'Facilities'},
  { campus:'UIC',cat:'Asset Management',desc:'Install Recirculating Pump',budget:7315,actual:6079,variance:1236,status:'Complete',notes:'',type:'Facilities'},
  { campus:'UIC',cat:'Asset Management',desc:'Floor epoxy main entry',budget:28655,actual:16800,variance:11855,status:'Complete',notes:'',type:'Facilities'},
  { campus:'UIC',cat:'Asset Management',desc:'Tuckpointing + sandstone',budget:92513,actual:null,variance:null,status:'Cancelled',notes:'Pushed to FY27',type:'Facilities'},
  { campus:'UIC',cat:'Asset Management',desc:'Subfloor + LVP upgrade',budget:39895,actual:8400,variance:31495,status:'Complete',notes:'One classroom only',type:'Facilities'},
  { campus:'UIC',cat:'Safety',desc:'ATV Plow',budget:18000,actual:null,variance:null,status:'Complete',notes:'',type:'Facilities'},
  { campus:'Comer MS',cat:'Asset Management',desc:'Cafeteria Renovation',budget:47350,actual:47350,variance:0,status:'In Progress',notes:'',type:'Facilities'},
  { campus:'Johnson',cat:'Asset Management',desc:'Concrete resurfacing + ledges',budget:150000,actual:150000,variance:0,status:'Complete',notes:'',type:'Facilities'},
  { campus:'Bulls',cat:'Asset Management',desc:'New Grease Trap',budget:5680,actual:5680,variance:0,status:'Complete',notes:'',type:'Facilities'},
  { campus:'Pritzker',cat:'Asset Management',desc:'Two-door fridge replacement',budget:5567,actual:5567,variance:0,status:'Complete',notes:'',type:'Facilities'},
  { campus:'Rowe-Clark',cat:'Asset Management',desc:'Gravel Paving',budget:11200,actual:11200,variance:0,status:'Complete',notes:'',type:'Facilities'},
  { campus:'Rowe-Clark',cat:'Asset Management',desc:'System Upgrade',budget:6100,actual:7423,variance:-1323,status:'In Progress',notes:'',type:'Facilities'},
  { campus:'Comer',cat:'Safety',desc:'Burglar System Install',budget:9054,actual:9054,variance:0,status:'Complete',notes:'',type:'Facilities'},
  { campus:'Golder',cat:'Asset Management',desc:'Grease trap replacement',budget:11749,actual:null,variance:null,status:'In Progress',notes:'Spring break completion',type:'Facilities'},
  { campus:'Bulls',cat:'Asset Management',desc:'Checks and Balance Test',budget:23760,actual:23760,variance:0,status:'Complete',notes:'',type:'Facilities'},
  { campus:'Hansberry',cat:'Asset Management',desc:'Replace failed check valves',budget:5150,actual:5150,variance:0,status:'Complete',notes:'',type:'Facilities'},
  { campus:'Hansberry',cat:'Programming',desc:'Architectural services for art program',budget:0,actual:10678,variance:-10678,status:'Not Started',notes:'',type:'Facilities'},
  { campus:'DRW',cat:'Asset Management',desc:'New Hardwired Security Alarm',budget:24000,actual:null,variance:24000,status:'In Progress',notes:'Begins mid-March 2026',type:'Facilities'},
  { campus:'TNA',cat:'Asset Management',desc:'NAC for Fire Control Panel',budget:8000,actual:null,variance:8000,status:'Not Started',notes:'Life safety item',type:'Facilities'},
  { campus:'Hansberry',cat:'Asset Management',desc:'Tuckpointing Door 5 + pavers',budget:25000,actual:null,variance:null,status:'In Progress',notes:'After spring break',type:'Facilities'},
  { campus:'Golder',cat:'Asset Management',desc:'Bathroom partitions 1st floor',budget:33000,actual:null,variance:null,status:'In Progress',notes:'After spring break',type:'Facilities'},
  { campus:'Baker',cat:'Copiers',desc:'1-BLW copier replacement',budget:26500,actual:24283,variance:2217,status:'Complete',notes:'',type:'IT'},
  { campus:'Bulls',cat:'Copiers',desc:'3-BLW copier replacement',budget:79500,actual:72848,variance:6652,status:'Complete',notes:'',type:'IT'},
  { campus:'Butler',cat:'AV/MPR',desc:'MPR projector system overhaul',budget:60000,actual:61101,variance:-1101,status:'Complete',notes:'',type:'IT'},
  { campus:'Butler',cat:'AV/Classroom',desc:'Network + cabling 5 classrooms',budget:13000,actual:0,variance:13000,status:'Cancelled',notes:'',type:'IT'},
  { campus:'Comer',cat:'Copiers',desc:'1-BLW 1-Color copier replacement',budget:43000,actual:38768,variance:4232,status:'Complete',notes:'',type:'IT'},
  { campus:'Comer MS',cat:'Copiers',desc:'2-BLW copier replacement',budget:53000,actual:48565,variance:4435,status:'Complete',notes:'',type:'IT'},
  { campus:'Golder',cat:'Copiers',desc:'1-Color copier replacement',budget:16500,actual:14486,variance:2014,status:'Complete',notes:'',type:'IT'},
  { campus:'Hansberry',cat:'Copiers',desc:'2-BLW copier replacement',budget:53000,actual:48565,variance:4435,status:'Complete',notes:'',type:'IT'},
  { campus:'Johnson',cat:'Safety & Security',desc:'Camera system overhaul',budget:136000,actual:106759,variance:29241,status:'Complete',notes:'',type:'IT'},
  { campus:'Mansueto',cat:'Copiers',desc:'1-Color copier replacement',budget:16500,actual:14486,variance:2014,status:'Complete',notes:'',type:'IT'},
  { campus:'Mansueto',cat:'AV/MPR',desc:'MPR projector system overhaul',budget:150000,actual:157522,variance:-7522,status:'Complete',notes:'',type:'IT'},
  { campus:'Muchin',cat:'Copiers',desc:'2-BLW copier replacement',budget:53000,actual:48565,variance:4435,status:'Complete',notes:'',type:'IT'},
  { campus:'Noble Academy',cat:'AV/MPR',desc:'Gym MPR AV system replacement',budget:60000,actual:56453,variance:3547,status:'Complete',notes:'',type:'IT'},
  { campus:'Noble St.',cat:'Copiers',desc:'1-BLW copier replacement',budget:26500,actual:24283,variance:2217,status:'Complete',notes:'',type:'IT'},
  { campus:'Pritzker',cat:'Copiers',desc:'1-Color copier replacement',budget:16500,actual:14486,variance:2014,status:'Complete',notes:'',type:'IT'},
  { campus:'Pritzker',cat:'AV/MPR',desc:'MPR projector system overhaul',budget:60000,actual:56236,variance:3764,status:'Complete',notes:'',type:'IT'},
  { campus:'Rauner',cat:'Copiers',desc:'2-BLW copier replacement',budget:53000,actual:48565,variance:4435,status:'Complete',notes:'',type:'IT'},
  { campus:'Rowe-Clark',cat:'Copiers',desc:'1-Color copier replacement',budget:16500,actual:14486,variance:2014,status:'Complete',notes:'',type:'IT'},
  { campus:'Rowe-Clark',cat:'AV/MPR',desc:'MPR AV system modernization',budget:75000,actual:81102,variance:-6102,status:'Complete',notes:'',type:'IT'},
  { campus:'Rowe-Clark',cat:'Safety & Security',desc:'Camera/NVR system replacement',budget:40000,actual:59736,variance:-19736,status:'Complete',notes:'',type:'IT'},
  { campus:'Speer',cat:'Copiers',desc:'3-BLW copier replacement',budget:79500,actual:72848,variance:6652,status:'Complete',notes:'',type:'IT'},
  { campus:'UIC',cat:'Copiers',desc:'1-BLW copier replacement',budget:26500,actual:24283,variance:2217,status:'Complete',notes:'',type:'IT'},
  { campus:'UIC',cat:'Safety & Security',desc:'Digital hallway clocks',budget:20000,actual:13973,variance:6027,status:'Complete',notes:'',type:'IT'},
];

// ─── DERIVED ──────────────────────────────────────────────────────────────────
const ip       = PROJECTS.filter(p => p.status === 'In Progress');
const done     = PROJECTS.filter(p => p.status === 'Complete');
const cancelled= PROJECTS.filter(p => p.status === 'Cancelled');
const over     = PROJECTS.filter(p => p.variance !== null && p.variance < -5000);
const totalBgt = PROJECTS.reduce((s, p) => s + p.budget, 0);
const totalAct = PROJECTS.reduce((s, p) => s + (p.actual ?? 0), 0);

// ─── PULSE BAR — always visible at top ───────────────────────────────────────
function PulseBar() {
  const pct = (totalAct / totalBgt * 100).toFixed(0);
  const tiles = [
    { v: $M(totalBgt),      l: 'CIP Budget',     c: T.ink    },
    { v: $M(totalAct),      l: 'Spent',           c: T.orange },
    { v: pct + '%',         l: 'of plan',         c: T.teal   },
    { v: String(ip.length), l: 'In Progress',     c: T.blue   },
    { v: String(over.length),l: 'Over Budget',    c: T.red    },
    { v: String(done.length),l: 'Complete',       c: T.green  },
  ];
  return (
    <div style={{
      display: 'flex', gap: 0, borderBottom: `1px solid ${T.border}`,
      background: T.surface, marginBottom: 0,
    }}>
      {tiles.map((t, i) => (
        <div key={i} style={{
          flex: 1, padding: '14px 20px',
          borderRight: i < tiles.length - 1 ? `1px solid ${T.border}` : 'none',
        }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>{t.l}</div>
          <div style={{ fontSize: 21, fontWeight: 900, color: t.c, fontFamily: mono, letterSpacing: '-0.02em' }}>{t.v}</div>
        </div>
      ))}
    </div>
  );
}

// ─── COMMAND CENTER ───────────────────────────────────────────────────────────
function CommandCenter() {
  // Budget burn
  const remaining = totalBgt - totalAct;
  const burnPct   = totalAct / totalBgt * 100;

  // Over-budget flags
  const flags = over.sort((a, b) => (a.variance??0) - (b.variance??0)).slice(0, 6);

  // In-progress burn
  const ipBgt = ip.reduce((s,p)=>s+p.budget,0);
  const ipAct = ip.reduce((s,p)=>s+(p.actual??0),0);

  // Campus spend data
  const campusData = Object.entries(SPEND)
    .map(([c, v]) => ({ name: c, fac: v.fac, it: v.it, total: v.fac + v.it }))
    .sort((a, b) => b.total - a.total);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Row 1 — alert flags + burn */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Budget Burn Card */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>Budget Execution</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: T.muted, marginBottom: 2 }}>Total budget</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: T.ink, fontFamily: mono }}>{$M(totalBgt)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: T.muted }}>Remaining</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: T.teal, fontFamily: mono }}>{$M(remaining)}</div>
            </div>
          </div>
          {/* Burn bar */}
          <div style={{ position: 'relative', height: 10, background: '#E5E9EF', borderRadius: 5, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: burnPct + '%',
              background: `linear-gradient(90deg, ${T.teal}, ${T.orange})`, borderRadius: 5 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.muted, marginBottom: 20 }}>
            <span>{burnPct.toFixed(0)}% deployed</span><span>{$M(remaining)} remaining</span>
          </div>

          {/* In-progress summary */}
          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
              In Progress — {ip.length} projects
            </div>
            <div style={{ display: 'flex', gap: 20 }}>
              <div>
                <div style={{ fontSize: 10, color: T.muted }}>Budgeted</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: T.ink, fontFamily: mono }}>{$M(ipBgt)}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: T.muted }}>Spent</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: T.orange, fontFamily: mono }}>{$M(ipAct)}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: T.muted }}>Left to spend</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: T.teal, fontFamily: mono }}>{$M(ipBgt - ipAct)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Attention Flags */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: T.red, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>
            ⚠ Needs Attention
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {[
              { c:'TNA',         d:'NAC Fire Control Panel',           n:'Not started — life safety item',                sev:'critical'},
              { c:'Rowe-Clark',  d:'Elevator upgrade',                 n:'$8.4K over budget · Parts delayed to summer',   sev:'critical'},
              { c:'Golder',      d:'Exterior tuckpointing',            n:'Completed $41K over budget',                    sev:'critical'},
              { c:'Butler',      d:'Classroom flooring',               n:'Completed $25.5K over budget',                  sev:'critical'},
              { c:'Rowe-Clark',  d:'Camera/NVR system',                n:'Completed $19.7K over budget',                  sev:'critical'},
              { c:'Noble Academy',d:'Track + court upgrade',           n:'$900K project — $696K unspent, summer finish',  sev:'watch'},
              { c:'DRW',         d:'Security Alarm System',            n:'Not started — begins mid-March',                sev:'watch'},
            ].map((f, i) => (
              <div key={i} style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                padding: '8px 12px', borderRadius: 8,
                background: f.sev === 'critical' ? T.redBg : T.amberBg,
                borderLeft: `3px solid ${f.sev === 'critical' ? T.red : T.amber}`,
              }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.ink }}>{f.c}</span>
                  <span style={{ fontSize: 12, color: T.inkMid }}> — {f.d}</span>
                  <div style={{ fontSize: 10, color: T.muted, marginTop: 2, fontStyle: 'italic' }}>{f.n}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2 — campus capital chart */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>
          FY26 Capital by Campus — Facilities vs IT
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={campusData} layout="vertical" barSize={10} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
            <XAxis type="number" tickFormatter={v => '$' + (v/1000).toFixed(0)+'K'} tick={{ fontSize: 10, fill: T.muted }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: T.inkMid }} width={95} />
            <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }}
              formatter={(v: number) => [$(v)]} />
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
  const campuses = ['All', ...Array.from(new Set(PROJECTS.map(p => p.campus))).sort()];
  const [fCampus, setFC] = useState('All');
  const [fStatus, setFS] = useState('All');
  const [fType,   setFT] = useState('All');
  const [search,  setSr] = useState('');

  const rows = useMemo(() => PROJECTS.filter(p =>
    (fCampus === 'All' || p.campus === fCampus) &&
    (fStatus === 'All' || p.status === fStatus) &&
    (fType   === 'All' || p.type   === fType) &&
    (!search || p.desc.toLowerCase().includes(search.toLowerCase()) || p.campus.toLowerCase().includes(search.toLowerCase()))
  ), [fCampus, fStatus, fType, search]);

  const chip = (s: string) => {
    const m: Record<string, [string,string]> = {
      'Complete':    [T.green, T.greenBg],
      'In Progress': [T.blue,  T.blueBg ],
      'Cancelled':   [T.muted, '#F1F5F9'],
      'Not Started': [T.amber, T.amberBg],
    };
    const [c, bg] = m[s] ?? [T.muted, '#F1F5F9'];
    return (
      <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 20,
        color: c, background: bg, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
        {s}
      </span>
    );
  };

  return (
    <div>
      {/* Filter bar */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 14px',
        marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => setSr(e.target.value)} placeholder="Search…"
          style={{ padding: '7px 12px', borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 12, outline: 'none', flex: '1 1 160px' }} />
        <select value={fCampus} onChange={e => setFC(e.target.value)}
          style={{ padding: '7px 10px', borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 12, flex: '1 1 110px' }}>
          {campuses.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={fStatus} onChange={e => setFS(e.target.value)}
          style={{ padding: '7px 10px', borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 12 }}>
          {['All','Complete','In Progress','Cancelled','Not Started'].map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={fType} onChange={e => setFT(e.target.value)}
          style={{ padding: '7px 10px', borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 12 }}>
          {['All','Facilities','IT'].map(t => <option key={t}>{t}</option>)}
        </select>
        <span style={{ fontSize: 11, color: T.muted, whiteSpace: 'nowrap' }}>
          {rows.length} · {$M(rows.reduce((s,p)=>s+p.budget,0))} budget
        </span>
      </div>

      {/* Table */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '88px 1fr 90px 86px 86px 86px',
          padding: '8px 14px', background: '#F8FAFC', borderBottom: `1px solid ${T.border}`,
          fontSize: 9, fontWeight: 800, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.09em' }}>
          <div>Campus</div><div>Project</div><div>Status</div>
          <div style={{textAlign:'right'}}>Budget</div>
          <div style={{textAlign:'right'}}>Actual</div>
          <div style={{textAlign:'right'}}>Variance</div>
        </div>
        <div style={{ maxHeight: 520, overflowY: 'auto' }}>
          {rows.map((p, i) => {
            const vc = p.variance === null ? T.muted : p.variance >= 0 ? T.green : T.red;
            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '88px 1fr 90px 86px 86px 86px',
                padding: '9px 14px', borderBottom: i < rows.length-1 ? `1px solid ${T.border}` : 'none',
                background: i % 2 === 0 ? T.surface : '#FAFBFC' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.ink }}>{p.campus}</div>
                <div>
                  <div style={{ fontSize: 11, color: T.inkMid }}>{p.desc}</div>
                  <div style={{ fontSize: 10, color: T.muted }}>{p.cat} · {p.type}</div>
                  {p.notes && <div style={{ fontSize: 9, color: T.muted, fontStyle:'italic', marginTop:1 }}>{p.notes.slice(0,70)}{p.notes.length>70?'…':''}</div>}
                </div>
                <div>{chip(p.status)}</div>
                <div style={{ fontSize: 11, textAlign:'right', fontFamily: mono, color: T.muted }}>{p.budget>0 ? $(p.budget) : '—'}</div>
                <div style={{ fontSize: 11, textAlign:'right', fontFamily: mono, color: T.muted }}>{p.actual !== null ? $(p.actual) : '—'}</div>
                <div style={{ fontSize: 11, textAlign:'right', fontFamily: mono, fontWeight: 700, color: vc }}>
                  {p.variance !== null ? (p.variance>=0?'+':'') + $(p.variance) : '—'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── EQUITY ───────────────────────────────────────────────────────────────────
function EquityAlignment() {
  const avg = Object.values(SPEND).reduce((s,v)=>s+v.fac+v.it,0) / Object.keys(SPEND).length;
  const data = Object.entries(EQUITY)
    .map(([campus, eq]) => ({
      campus, eq,
      spend: (SPEND[campus]?.fac ?? 0) + (SPEND[campus]?.it ?? 0),
    }))
    .sort((a,b) => b.eq - a.eq);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: '#FEFCE8', border: '1px solid #FEF08A', borderRadius: 10, padding: '11px 16px',
        fontSize: 12, color: '#713F12', lineHeight: 1.6 }}>
        <strong>Equity Index</strong> — Higher = greater facility need. DRW (15.3) and Johnson (12.6) carry the highest need in the network.
        Noble Academy (4.8) received $1M this cycle. This view exists to make that tension visible.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Scatter */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 22 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>Need vs Investment</div>
          <div style={{ fontSize: 11, color: T.muted, marginBottom: 16 }}>
            X axis = equity score (higher = more need) · Y = FY26 capital spend
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="x" name="Equity" type="number" domain={[0,17]} tick={{ fontSize:10, fill:T.muted }}
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
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 22 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>
            All Campuses — Sorted by Need
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 340, overflowY: 'auto' }}>
            {data.map(d => {
              const flag = d.eq >= 7 && d.spend < avg;
              return (
                <div key={d.campus} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '7px 11px',
                  background: flag ? '#FEFCE8' : '#F8FAFC', borderRadius: 8,
                  border: `1px solid ${flag ? '#FEF08A' : T.border}`,
                }}>
                  <div style={{ flex:'0 0 90px', fontSize:12, fontWeight:700, color:T.ink }}>{d.campus}</div>
                  <div style={{ flex:'0 0 42px', fontSize:14, fontWeight:900, fontFamily:mono,
                    color: d.eq>=12 ? T.red : d.eq>=8 ? T.amber : T.muted }}>{d.eq}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ height:4, background:T.border, borderRadius:2, overflow:'hidden', marginBottom:2 }}>
                      <div style={{ width:`${Math.min(d.spend/1100000*100,100)}%`, height:'100%', background:T.orange, borderRadius:2 }} />
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
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 22 }}>
        <div style={{ fontSize:10, fontWeight:800, color:T.muted, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:14 }}>
          FY26 Investment — Highest Need Campuses First
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.slice(0,14)} layout="vertical" barSize={14}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
            <XAxis type="number" tickFormatter={v=>'$'+(v/1000)+'K'} tick={{ fontSize:10, fill:T.muted }} />
            <YAxis type="category" dataKey="campus" tick={{ fontSize:11, fill:T.inkMid }} width={95} />
            <Tooltip contentStyle={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, fontSize:12 }}
              formatter={(v:number)=>[$(v),'FY26 Spend']} />
            <Bar dataKey="spend" radius={[0,4,4,0]}>
              {data.slice(0,14).map((d,i)=>(
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
  const [loading, setLoading] = useState(false);
  const [ran, setRan] = useState(false);
  const [mode, setMode] = useState<'brief'|'risk'|'equity'|'freeform'>('brief');
  const [q, setQ] = useState('');

  const ctx = `NOBLE SCHOOLS — FY26 CIP
Budget: $5.67M · Spent: $3.75M (66%) · 90 projects (69 complete, 13 in progress, 6 cancelled, 2 not started)
Over-budget completions: Golder tuckpointing $41K, Butler flooring $25.5K, Rowe-Clark security $19.7K, Muchin partition $7.5K
Life-safety concern: TNA fire control panel NAC ($8K, not started)
Largest in-progress: Noble Academy track/court $900K (22% spent), Pritzker blacktop $250K (13% spent, weather-delayed)
At-risk in-progress: Rowe-Clark elevator — over budget $8.4K, parts delayed to summer
Cancelled budget freed: UIC windows $273K, Johnson gym floor $157K, UIC tuckpointing $92.5K
Equity vs spend: DRW equity 15.3 got $200K · Johnson equity 12.6 got $311K · Comer MS equity 10.3 got $53K · Baker equity 9.2 got $50K · Noble Academy equity 4.8 got $1,005K · Pritzker equity 4.6 got $601K`;

  const prompts = {
    brief: `${ctx}\n\nYou are the COO of Noble Schools. Give a sharp executive CIP brief: (1) Overall execution status and what it says about capital discipline, (2) Top 3 items needing attention right now, (3) What the cancellations mean for FY27, (4) One strategic observation. Under 220 words. Numbers only, no platitudes.`,
    risk:  `${ctx}\n\nRisk-assess the FY26 CIP: (1) Highest-risk in-progress projects and why, (2) What the pattern of over-budget completions says about estimating, (3) Whether contingency is adequate, (4) Worst-case scenario for remaining in-progress spend. Under 220 words.`,
    equity:`${ctx}\n\nEquity-alignment analysis: (1) Which high-need campuses are underinvested, (2) Whether the Noble Academy and Pritzker concentrations are defensible given lower equity scores, (3) A specific FY27 reallocation recommendation. Under 220 words. Name campuses and dollars.`,
    freeform: `${ctx}\n\nQuestion: ${q}\n\nAnswer directly, reference actual data, under 200 words.`,
  };

  const run = async (m: typeof mode = mode) => {
    setLoading(true); setResponse(''); setRan(true);
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, messages: [{ role:'user', content: prompts[m] }] }),
      });
      const j = await r.json();
      setResponse(j.content?.map((b:any)=>b.type==='text'?b.text:'').join('') ?? 'No response.');
    } catch { setResponse('Analysis unavailable.'); }
    finally { setLoading(false); }
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
        {modes.map(m => (
          <button key={m.id} onClick={() => { setMode(m.id); setResponse(''); setRan(false); }} style={{
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
        {loading && <div style={{ fontSize:13, color:T.muted, fontStyle:'italic' }}>Analyzing FY26 CIP data…</div>}
        {response && <div style={{ fontSize:14, color:T.ink, lineHeight:1.85, whiteSpace:'pre-wrap' }}>{response}</div>}
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id:'command', l:'⚡ Command Center' },
  { id:'tracker', l:'📋 Project Tracker' },
  { id:'equity',  l:'⚖️ Equity Alignment' },
  { id:'ai',      l:'🤖 AI Advisor' },
];

export default function GroundsApp() {
  const [tab, setTab] = useState('command');

  return (
    <div style={{ fontFamily:"'DM Sans','Inter',system-ui,sans-serif", background:T.bg, minHeight:'100%' }}>
      {/* PULSE BAR — KPIs at top, no fake header */}
      <PulseBar />

      {/* Tab nav */}
      <div style={{ background:T.surface, borderBottom:`1px solid ${T.border}`,
        display:'flex', gap:0, paddingLeft:20 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            padding:'12px 20px', background:'none', border:'none', cursor:'pointer',
            fontSize:13, fontWeight: tab===t.id ? 700 : 500,
            color: tab===t.id ? T.orange : T.muted,
            borderBottom: tab===t.id ? `2px solid ${T.orange}` : '2px solid transparent',
          }}>{t.l}</button>
        ))}
        <div style={{ marginLeft:'auto', padding:'12px 20px', fontSize:11, color:T.muted, alignSelf:'center' }}>
          FY26 · 17 campuses · {$M(totalBgt)} CIP
        </div>
      </div>

      {/* Content */}
      <div style={{ padding:'22px 24px 32px' }}>
        {tab==='command' && <CommandCenter />}
        {tab==='tracker' && <ProjectTracker />}
        {tab==='equity'  && <EquityAlignment />}
        {tab==='ai'      && <AIAdvisor />}
      </div>
    </div>
  );
}
