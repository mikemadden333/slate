// @ts-nocheck
import { useState, useEffect, useCallback } from "react";

// ─── STORAGE KEYS (shared with all Slate modules) ──────────────────────────
export const SLATE_KEYS = {
  enrollment:  'slate_enrollment',
  financials:  'slate_financials',
  staff:       'slate_staff',
  risks:       'slate_risks',
  network:     'slate_network',
  nst:         'slate_nst',
};

// ─── DEFAULT DATA ──────────────────────────────────────────────────────────
export const DEFAULTS = {
  enrollment: {
    networkTotal: 6823,
    incoming9th: 1800,
    targetEnrollment: 6823,
    campuses: [
      { name: "Loop",           enrollment: 987 },
      { name: "Englewood",      enrollment: 742 },
      { name: "Woodlawn",       enrollment: 823 },
      { name: "Auburn Gresham", enrollment: 678 },
      { name: "Roseland",       enrollment: 521 },
      { name: "Chatham",        enrollment: 891 },
      { name: "Austin",         enrollment: 711 },
      { name: "North Lawndale", enrollment: 329 },
      { name: "Garfield Park",  enrollment: 652 },
      { name: "Humboldt Park",  enrollment: 489 },
    ],
    scenarios: {
      optimistic:  { sy27: 7050, sy28: 7175, sy29: 7280, sy30: 7350, sy31: 7400 },
      probable:    { sy27: 6700, sy28: 6620, sy29: 6580, sy30: 6550, sy31: 6510 },
      pessimistic: { sy27: 6500, sy28: 6380, sy29: 6260, sy30: 6150, sy31: 6040 },
    },
  },
  financials: {
    totalRevenue:    138300000,
    totalExpenses:   131900000,
    ebitda:           4200000,
    netSurplus:      -2100000,
    dscr:                 3.47,
    dscrCovenant:         1.00,
    contingency:      2200000,
    ytdRevActual:    80800000,
    ytdRevBudget:    78500000,
    ytdExpActual:    75500000,
    ytdExpBudget:    74200000,
    ytdSurplus:       5300000,
    daysCashOnHand:         62,
    totalDebt:        5800000,
    mads:             2000000,
  },
  staff: {
    totalPositions: 870,
    activeStaff:    831,
    vacancies:       29,
    onLeave:         10,
    licensureRate:   77,
    campuses: [
      { name: "Loop",           total: 112, licensed: 74, vacancies: 3 },
      { name: "Chatham",        total: 105, licensed: 69, vacancies: 4 },
      { name: "Woodlawn",       total:  97, licensed: 64, vacancies: 3 },
      { name: "Englewood",      total:  88, licensed: 58, vacancies: 4 },
      { name: "Auburn Gresham", total:  84, licensed: 55, vacancies: 2 },
      { name: "Austin",         total:  84, licensed: 55, vacancies: 3 },
      { name: "Garfield Park",  total:  79, licensed: 51, vacancies: 4 },
      { name: "Humboldt Park",  total:  62, licensed: 40, vacancies: 3 },
      { name: "Roseland",       total:  62, licensed: 40, vacancies: 4 },
      { name: "North Lawndale", total:  38, licensed: 25, vacancies: 3 },
    ],
    vacanciesByDept: [
      { dept: "Instruction",    count: 8  },
      { dept: "Special Ed.",    count: 11 },
      { dept: "Operations",     count: 3  },
      { dept: "Student Svcs",   count: 5  },
      { dept: "Admin",          count: 2  },
    ],
  },
  risks: {
    campuses: [
      { name: "Loop",           riskScore: 3, incidents30d: 2,  alertLevel: "low"    },
      { name: "Englewood",      riskScore: 7, incidents30d: 11, alertLevel: "high"   },
      { name: "Woodlawn",       riskScore: 5, incidents30d: 6,  alertLevel: "medium" },
      { name: "Auburn Gresham", riskScore: 4, incidents30d: 4,  alertLevel: "low"    },
      { name: "Roseland",       riskScore: 5, incidents30d: 5,  alertLevel: "medium" },
      { name: "Chatham",        riskScore: 4, incidents30d: 3,  alertLevel: "low"    },
      { name: "Austin",         riskScore: 8, incidents30d: 14, alertLevel: "high"   },
      { name: "North Lawndale", riskScore: 6, incidents30d: 8,  alertLevel: "medium" },
      { name: "Garfield Park",  riskScore: 7, incidents30d: 10, alertLevel: "high"   },
      { name: "Humboldt Park",  riskScore: 5, incidents30d: 6,  alertLevel: "medium" },
    ],
  },
  network: {
    name:         "Veritas Charter Schools",
    campusCount:  10,
    studentCount: 6823,
    city:         "Chicago",
    grades:       "9-12",
    foundedYear:  2001,
    authorizer:   "Chicago Public Schools",
    revenuePerPupil: 16345,
  },
  nst: {
    departments: [
      { name: "Academic Affairs",    actual: 1240, budget: 1200 },
      { name: "Finance",             actual:  410, budget:  420 },
      { name: "HR",                  actual:  380, budget:  375 },
      { name: "IT",                  actual:  290, budget:  310 },
      { name: "Facilities",          actual:  520, budget:  510 },
      { name: "External Affairs",    actual:  210, budget:  205 },
      { name: "Talent & Recruiting", actual:  340, budget:  330 },
      { name: "Student Services",    actual:  580, budget:  560 },
      { name: "Operations",          actual:  450, budget:  445 },
      { name: "Legal & Compliance",  actual:  180, budget:  175 },
      { name: "Communications",      actual:  160, budget:  155 },
      { name: "Data & Analytics",    actual:  220, budget:  215 },
      { name: "Development",         actual:  140, budget:  138 },
      { name: "Board Affairs",        actual:   90, budget:   88 },
      { name: "Executive Office",    actual:  220, budget:  218 },
    ],
  },
};

// ─── STORAGE HELPERS ───────────────────────────────────────────────────────
export function slateGet(key: string) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function slateSet(key: string, val: any) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

export function slateLoad(key: string) {
  return slateGet(key) ?? DEFAULTS[key.replace('slate_', '')];
}

// ─── DESIGN TOKENS ─────────────────────────────────────────────────────────
const C = {
  bg:     '#F7F5F1',
  white:  '#FFFFFF',
  deep:   '#121315',
  rock:   '#23272F',
  mid:    '#374151',
  muted:  '#6B7280',
  chalk:  '#E7E2D8',
  brass:  '#B79145',
  green:  '#0B7A5E',
  red:    '#B91C1C',
  amber:  '#B45309',
  blue:   '#1D4ED8',
  greenBg:'#ECFDF5',
  redBg:  '#FEF2F2',
  amberBg:'#FFFBEB',
};

// ─── SHARED COMPONENTS ─────────────────────────────────────────────────────
const Label = ({ children }) => (
  <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase',
    letterSpacing: '1.5px', marginBottom: 5 }}>{children}</div>
);

const Field = ({ label, value, onChange, type = 'text', prefix = '', suffix = '', wide = false }) => (
  <div style={{ marginBottom: 14 }}>
    <Label>{label}</Label>
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {prefix && <span style={{ padding: '7px 10px', background: C.chalk, border: `1px solid ${C.chalk}`,
        borderRight: 'none', borderRadius: '7px 0 0 7px', fontSize: 12, color: C.muted }}>{prefix}</span>}
      <input
        type={type}
        value={value}
        onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        style={{ flex: 1, padding: '7px 10px', border: `1px solid ${C.chalk}`, fontSize: 13,
          borderRadius: prefix ? '0' : suffix ? '7px 0 0 7px' : '7px',
          outline: 'none', background: C.white, color: C.deep,
          borderRight: suffix ? 'none' : `1px solid ${C.chalk}`,
        }}
      />
      {suffix && <span style={{ padding: '7px 10px', background: C.chalk, border: `1px solid ${C.chalk}`,
        borderLeft: 'none', borderRadius: '0 7px 7px 0', fontSize: 12, color: C.muted }}>{suffix}</span>}
    </div>
  </div>
);

const Card = ({ children, title, subtitle = '' }) => (
  <div style={{ background: C.white, borderRadius: 12, padding: '22px 24px', marginBottom: 18,
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)', border: `1px solid ${C.chalk}` }}>
    {title && <div style={{ fontSize: 13, fontWeight: 800, color: C.deep, marginBottom: subtitle ? 2 : 14 }}>{title}</div>}
    {subtitle && <div style={{ fontSize: 11, color: C.muted, marginBottom: 14 }}>{subtitle}</div>}
    {children}
  </div>
);

const SaveButton = ({ onClick, saved }) => (
  <button onClick={onClick} style={{
    padding: '9px 22px', borderRadius: 8, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
    background: saved ? C.green : C.brass, color: '#FFF', transition: 'background 0.3s',
  }}>{saved ? '✓ Saved' : 'Save Changes'}</button>
);

const RiskBadge = ({ level }) => {
  const map = { low: { bg: C.greenBg, color: C.green }, medium: { bg: C.amberBg, color: C.amber }, high: { bg: C.redBg, color: C.red } };
  const s = map[level] ?? map.low;
  return <span style={{ padding: '2px 9px', borderRadius: 10, fontSize: 10, fontWeight: 700,
    background: s.bg, color: s.color, textTransform: 'uppercase', letterSpacing: '1px' }}>{level}</span>;
};

const fmt = (n: number) => new Intl.NumberFormat('en-US').format(n);
const fmtM = (n: number) => `$${(n / 1000000).toFixed(2)}M`;

// ─── TAB: ENROLLMENT ───────────────────────────────────────────────────────
function EnrollmentTab() {
  const [data, setData] = useState(() => slateLoad(SLATE_KEYS.enrollment));
  const [saved, setSaved] = useState(false);

  const save = () => { slateSet(SLATE_KEYS.enrollment, data); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const updateCampus = (i: number, field: string, val: any) => {
    const c = [...data.campuses];
    c[i] = { ...c[i], [field]: val };
    const total = c.reduce((s, x) => s + Number(x.enrollment), 0);
    setData({ ...data, campuses: c, networkTotal: total });
  };

  const updateScenario = (scenario: string, year: string, val: number) => {
    setData({ ...data, scenarios: { ...data.scenarios, [scenario]: { ...data.scenarios[scenario], [year]: val } } });
  };

  return (
    <div>
      <Card title="Network Enrollment" subtitle="Core network-wide enrollment figures">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <Field label="Network Total" type="number" value={data.networkTotal}
            onChange={v => setData({ ...data, networkTotal: v })} />
          <Field label="Incoming 9th Graders" type="number" value={data.incoming9th}
            onChange={v => setData({ ...data, incoming9th: v })} />
          <Field label="Target Enrollment" type="number" value={data.targetEnrollment}
            onChange={v => setData({ ...data, targetEnrollment: v })} />
        </div>
      </Card>

      <Card title="Campus Enrollment" subtitle="Enrollment by campus — network total auto-updates">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0 24px' }}>
          {data.campuses.map((c, i) => (
            <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
              paddingBottom: 10, borderBottom: `1px solid ${C.chalk}` }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.deep, width: 130, flexShrink: 0 }}>{c.name}</div>
              <input type="number" value={c.enrollment}
                onChange={e => updateCampus(i, 'enrollment', Number(e.target.value))}
                style={{ width: 90, padding: '5px 8px', border: `1px solid ${C.chalk}`, borderRadius: 6,
                  fontSize: 13, fontWeight: 700, color: C.deep, outline: 'none', textAlign: 'right' }} />
              <div style={{ fontSize: 11, color: C.muted }}>
                {((c.enrollment / data.networkTotal) * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8, padding: '10px 14px', background: C.bg, borderRadius: 8,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.deep }}>Network Total</span>
          <span style={{ fontSize: 16, fontWeight: 900, color: C.brass, fontFamily: 'monospace' }}>
            {fmt(data.networkTotal)}
          </span>
        </div>
      </Card>

      <Card title="Enrollment Scenarios" subtitle="SY27–SY31 projections for each scenario">
        {['optimistic', 'probable', 'pessimistic'].map(scenario => (
          <div key={scenario} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: scenario === 'optimistic' ? C.green : scenario === 'pessimistic' ? C.red : C.amber,
              textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 8 }}>{scenario}</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {Object.entries(data.scenarios[scenario]).map(([yr, val]) => (
                <div key={yr} style={{ flex: 1 }}>
                  <Label>{yr.toUpperCase()}</Label>
                  <input type="number" value={val as number}
                    onChange={e => updateScenario(scenario, yr, Number(e.target.value))}
                    style={{ width: '100%', padding: '6px 8px', border: `1px solid ${C.chalk}`, borderRadius: 6,
                      fontSize: 12, fontWeight: 700, outline: 'none', textAlign: 'right', color: C.deep }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </Card>

      <SaveButton onClick={save} saved={saved} />
    </div>
  );
}

// ─── TAB: FINANCIALS ───────────────────────────────────────────────────────
function FinancialsTab() {
  const [data, setData] = useState(() => slateLoad(SLATE_KEYS.financials));
  const [saved, setSaved] = useState(false);

  const save = () => { slateSet(SLATE_KEYS.financials, data); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const upd = (field: string, val: any) => setData({ ...data, [field]: val });

  return (
    <div>
      <Card title="Budget Overview" subtitle="Full-year FY26 figures">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <Field label="Total Revenue" type="number" prefix="$" value={data.totalRevenue} onChange={v => upd('totalRevenue', v)} />
          <Field label="Total Expenses" type="number" prefix="$" value={data.totalExpenses} onChange={v => upd('totalExpenses', v)} />
          <Field label="EBITDA" type="number" prefix="$" value={data.ebitda} onChange={v => upd('ebitda', v)} />
          <Field label="Net Surplus / (Deficit)" type="number" prefix="$" value={data.netSurplus} onChange={v => upd('netSurplus', v)} />
          <Field label="Contingency Reserve" type="number" prefix="$" value={data.contingency} onChange={v => upd('contingency', v)} />
          <Field label="Total Debt" type="number" prefix="$" value={data.totalDebt} onChange={v => upd('totalDebt', v)} />
        </div>
      </Card>

      <Card title="Debt Service & Covenants">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <Field label="DSCR" type="number" value={data.dscr} onChange={v => upd('dscr', v)} suffix="x" />
          <Field label="DSCR Covenant Minimum" type="number" value={data.dscrCovenant} onChange={v => upd('dscrCovenant', v)} suffix="x" />
          <Field label="MADS" type="number" prefix="$" value={data.mads} onChange={v => upd('mads', v)} />
          <Field label="Days Cash on Hand" type="number" value={data.daysCashOnHand} onChange={v => upd('daysCashOnHand', v)} suffix=" days" />
        </div>
        <div style={{ padding: '12px 16px', background: data.dscr >= data.dscrCovenant ? C.greenBg : C.redBg,
          borderRadius: 8, fontSize: 12, fontWeight: 700,
          color: data.dscr >= data.dscrCovenant ? C.green : C.red }}>
          {data.dscr >= data.dscrCovenant
            ? `✓ DSCR ${data.dscr}x — In covenant (minimum ${data.dscrCovenant}x)`
            : `✕ DSCR ${data.dscr}x — COVENANT BREACH (minimum ${data.dscrCovenant}x)`}
        </div>
      </Card>

      <Card title="YTD Actuals vs. Budget" subtitle="Year-to-date through current month">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0 24px' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 10 }}>REVENUE</div>
            <Field label="Actual" type="number" prefix="$" value={data.ytdRevActual} onChange={v => upd('ytdRevActual', v)} />
            <Field label="Budget" type="number" prefix="$" value={data.ytdRevBudget} onChange={v => upd('ytdRevBudget', v)} />
            <div style={{ padding: '8px 12px', background: data.ytdRevActual >= data.ytdRevBudget ? C.greenBg : C.redBg,
              borderRadius: 7, fontSize: 12, fontWeight: 700, color: data.ytdRevActual >= data.ytdRevBudget ? C.green : C.red }}>
              {data.ytdRevActual >= data.ytdRevBudget ? '▲' : '▼'} {fmtM(Math.abs(data.ytdRevActual - data.ytdRevBudget))} vs. budget
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 10 }}>EXPENSES</div>
            <Field label="Actual" type="number" prefix="$" value={data.ytdExpActual} onChange={v => upd('ytdExpActual', v)} />
            <Field label="Budget" type="number" prefix="$" value={data.ytdExpBudget} onChange={v => upd('ytdExpBudget', v)} />
            <div style={{ padding: '8px 12px', background: data.ytdExpActual <= data.ytdExpBudget ? C.greenBg : C.redBg,
              borderRadius: 7, fontSize: 12, fontWeight: 700, color: data.ytdExpActual <= data.ytdExpBudget ? C.green : C.red }}>
              {data.ytdExpActual <= data.ytdExpBudget ? '▼ Under' : '▲ Over'} {fmtM(Math.abs(data.ytdExpActual - data.ytdExpBudget))} vs. budget
            </div>
          </div>
        </div>
        <div style={{ marginTop: 14, padding: '12px 16px', background: C.bg, borderRadius: 8,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.deep }}>YTD Net Surplus</span>
          <span style={{ fontSize: 16, fontWeight: 900, fontFamily: 'monospace',
            color: data.ytdSurplus >= 0 ? C.green : C.red }}>
            {data.ytdSurplus >= 0 ? '+' : ''}{fmtM(data.ytdSurplus)}
          </span>
        </div>
        <div style={{ marginTop: 8 }}>
          <Field label="YTD Net Surplus (override)" type="number" prefix="$" value={data.ytdSurplus}
            onChange={v => upd('ytdSurplus', v)} />
        </div>
      </Card>

      <SaveButton onClick={save} saved={saved} />
    </div>
  );
}

// ─── TAB: STAFF ────────────────────────────────────────────────────────────
function StaffTab() {
  const [data, setData] = useState(() => slateLoad(SLATE_KEYS.staff));
  const [saved, setSaved] = useState(false);

  const save = () => { slateSet(SLATE_KEYS.staff, data); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const updateCampus = (i: number, field: string, val: any) => {
    const c = [...data.campuses];
    c[i] = { ...c[i], [field]: val };
    setData({ ...data, campuses: c });
  };

  const updateDept = (i: number, val: number) => {
    const d = [...data.vacanciesByDept];
    d[i] = { ...d[i], count: val };
    setData({ ...data, vacanciesByDept: d });
  };

  return (
    <div>
      <Card title="Network Summary" subtitle="Top-line staff figures shown in Roster dashboard">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <Field label="Total Positions" type="number" value={data.totalPositions} onChange={v => setData({ ...data, totalPositions: v })} />
          <Field label="Active Staff" type="number" value={data.activeStaff} onChange={v => setData({ ...data, activeStaff: v })} />
          <Field label="Vacancies" type="number" value={data.vacancies} onChange={v => setData({ ...data, vacancies: v })} />
          <Field label="On Leave" type="number" value={data.onLeave} onChange={v => setData({ ...data, onLeave: v })} />
          <Field label="Licensure Rate" type="number" value={data.licensureRate} onChange={v => setData({ ...data, licensureRate: v })} suffix="%" />
        </div>
      </Card>

      <Card title="Headcount by Campus" subtitle="Total staff, licensed staff, and vacancies per campus">
        <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 1fr 1fr', gap: '0 12px',
          fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase',
          letterSpacing: '1px', marginBottom: 8, padding: '0 4px' }}>
          <div>Campus</div><div>Total</div><div>Licensed</div><div>Vacancies</div>
        </div>
        {data.campuses.map((c, i) => (
          <div key={c.name} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 1fr 1fr', gap: '0 12px',
            marginBottom: 8, alignItems: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.deep }}>{c.name}</div>
            {['total', 'licensed', 'vacancies'].map(field => (
              <input key={field} type="number" value={c[field]}
                onChange={e => updateCampus(i, field, Number(e.target.value))}
                style={{ padding: '5px 8px', border: `1px solid ${C.chalk}`, borderRadius: 6,
                  fontSize: 12, outline: 'none', textAlign: 'right', color: C.deep }} />
            ))}
          </div>
        ))}
      </Card>

      <Card title="Vacancies by Department">
        {data.vacanciesByDept.map((d, i) => (
          <div key={d.dept} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.deep, width: 150, flexShrink: 0 }}>{d.dept}</div>
            <input type="number" value={d.count}
              onChange={e => updateDept(i, Number(e.target.value))}
              style={{ width: 80, padding: '5px 8px', border: `1px solid ${C.chalk}`, borderRadius: 6,
                fontSize: 13, fontWeight: 700, outline: 'none', textAlign: 'right', color: C.deep }} />
            <span style={{ fontSize: 11, color: C.muted }}>open positions</span>
          </div>
        ))}
      </Card>

      <SaveButton onClick={save} saved={saved} />
    </div>
  );
}

// ─── TAB: RISKS ────────────────────────────────────────────────────────────
function RisksTab() {
  const [data, setData] = useState(() => slateLoad(SLATE_KEYS.risks));
  const [saved, setSaved] = useState(false);

  const save = () => { slateSet(SLATE_KEYS.risks, data); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const updateCampus = (i: number, field: string, val: any) => {
    const c = [...data.campuses];
    c[i] = { ...c[i], [field]: val };
    if (field === 'riskScore') {
      c[i].alertLevel = val >= 7 ? 'high' : val >= 5 ? 'medium' : 'low';
    }
    setData({ ...data, campuses: c });
  };

  return (
    <div>
      <Card title="Campus Risk Scores" subtitle="Risk score (1–10) and 30-day incident count. Alert level auto-sets: 1–4 low, 5–6 medium, 7–10 high.">
        <div style={{ display: 'grid', gridTemplateColumns: '140px 100px 120px 80px', gap: '0 16px',
          fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase',
          letterSpacing: '1px', marginBottom: 10, padding: '0 4px' }}>
          <div>Campus</div><div>Risk Score</div><div>Incidents (30d)</div><div>Alert</div>
        </div>
        {data.campuses.map((c, i) => (
          <div key={c.name} style={{ display: 'grid', gridTemplateColumns: '140px 100px 120px 80px', gap: '0 16px',
            marginBottom: 10, alignItems: 'center', paddingBottom: 10, borderBottom: `1px solid ${C.chalk}` }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.deep }}>{c.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="number" min="1" max="10" value={c.riskScore}
                onChange={e => updateCampus(i, 'riskScore', Number(e.target.value))}
                style={{ width: 60, padding: '5px 8px', border: `1px solid ${C.chalk}`, borderRadius: 6,
                  fontSize: 14, fontWeight: 800, outline: 'none', textAlign: 'center',
                  color: c.riskScore >= 7 ? C.red : c.riskScore >= 5 ? C.amber : C.green }} />
              <span style={{ fontSize: 10, color: C.muted }}>/10</span>
            </div>
            <input type="number" value={c.incidents30d}
              onChange={e => updateCampus(i, 'incidents30d', Number(e.target.value))}
              style={{ padding: '5px 8px', border: `1px solid ${C.chalk}`, borderRadius: 6,
                fontSize: 12, fontWeight: 700, outline: 'none', textAlign: 'right', color: C.deep }} />
            <RiskBadge level={c.alertLevel} />
          </div>
        ))}
      </Card>

      <SaveButton onClick={save} saved={saved} />
    </div>
  );
}

// ─── TAB: NETWORK ──────────────────────────────────────────────────────────
function NetworkTab() {
  const [data, setData] = useState(() => slateLoad(SLATE_KEYS.network));
  const [saved, setSaved] = useState(false);

  const save = () => { slateSet(SLATE_KEYS.network, data); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const upd = (f: string, v: any) => setData({ ...data, [f]: v });

  return (
    <div>
      <Card title="Network Identity" subtitle="Core network details used across all modules">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          <Field label="Network Name" value={data.name} onChange={v => upd('name', v)} />
          <Field label="City" value={data.city} onChange={v => upd('city', v)} />
          <Field label="Campus Count" type="number" value={data.campusCount} onChange={v => upd('campusCount', v)} />
          <Field label="Student Count" type="number" value={data.studentCount} onChange={v => upd('studentCount', v)} />
          <Field label="Grades Served" value={data.grades} onChange={v => upd('grades', v)} />
          <Field label="Founded Year" type="number" value={data.foundedYear} onChange={v => upd('foundedYear', v)} />
          <Field label="Authorizer" value={data.authorizer} onChange={v => upd('authorizer', v)} />
          <Field label="Revenue Per Pupil" type="number" prefix="$" value={data.revenuePerPupil} onChange={v => upd('revenuePerPupil', v)} />
        </div>
      </Card>

      <SaveButton onClick={save} saved={saved} />
    </div>
  );
}

// ─── TAB: NST ──────────────────────────────────────────────────────────────
function NSTTab() {
  const [data, setData] = useState(() => slateLoad(SLATE_KEYS.nst));
  const [saved, setSaved] = useState(false);

  const save = () => { slateSet(SLATE_KEYS.nst, data); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const updateDept = (i: number, field: string, val: number) => {
    const d = [...data.departments];
    d[i] = { ...d[i], [field]: val };
    setData({ ...data, departments: d });
  };

  const totalActual = data.departments.reduce((s, d) => s + d.actual, 0);
  const totalBudget = data.departments.reduce((s, d) => s + d.budget, 0);
  const totalVar = totalActual - totalBudget;

  return (
    <div>
      <Card title="NST Department Budgets" subtitle="Figures in thousands ($K). Variance auto-calculates.">
        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr 100px', gap: '0 12px',
          fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase',
          letterSpacing: '1px', marginBottom: 10, padding: '0 4px' }}>
          <div>Department</div><div>Actual ($K)</div><div>Budget ($K)</div><div>Variance</div>
        </div>
        {data.departments.map((d, i) => {
          const v = d.actual - d.budget;
          return (
            <div key={d.name} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr 100px', gap: '0 12px',
              marginBottom: 8, alignItems: 'center', paddingBottom: 8, borderBottom: `1px solid ${C.chalk}` }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.deep }}>{d.name}</div>
              {['actual', 'budget'].map(field => (
                <input key={field} type="number" value={d[field]}
                  onChange={e => updateDept(i, field, Number(e.target.value))}
                  style={{ padding: '5px 8px', border: `1px solid ${C.chalk}`, borderRadius: 6,
                    fontSize: 12, fontWeight: 700, outline: 'none', textAlign: 'right', color: C.deep }} />
              ))}
              <div style={{ fontSize: 12, fontWeight: 700, textAlign: 'right',
                color: v > 0 ? C.red : v < 0 ? C.green : C.muted }}>
                {v > 0 ? '+' : ''}{v}K
              </div>
            </div>
          );
        })}
        <div style={{ marginTop: 10, padding: '12px 16px', background: C.bg, borderRadius: 8,
          display: 'grid', gridTemplateColumns: '180px 1fr 1fr 100px', gap: '0 12px', alignItems: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.deep }}>Total NST</div>
          <div style={{ fontSize: 14, fontWeight: 900, color: C.deep, textAlign: 'right', fontFamily: 'monospace' }}>${fmt(totalActual)}K</div>
          <div style={{ fontSize: 14, fontWeight: 900, color: C.deep, textAlign: 'right', fontFamily: 'monospace' }}>${fmt(totalBudget)}K</div>
          <div style={{ fontSize: 13, fontWeight: 800, textAlign: 'right', fontFamily: 'monospace',
            color: totalVar > 0 ? C.red : totalVar < 0 ? C.green : C.muted }}>
            {totalVar > 0 ? '+' : ''}{totalVar}K
          </div>
        </div>
      </Card>

      <SaveButton onClick={save} saved={saved} />
    </div>
  );
}

// ─── TAB: IMPORT / EXPORT ──────────────────────────────────────────────────
function ImportExportTab() {
  const [importText, setImportText] = useState('');
  const [msg, setMsg] = useState('');

  const exportAll = () => {
    const bundle = {};
    Object.entries(SLATE_KEYS).forEach(([k, storageKey]) => {
      bundle[k] = slateLoad(storageKey);
    });
    const json = JSON.stringify(bundle, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `slate-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importAll = () => {
    try {
      const bundle = JSON.parse(importText);
      Object.entries(SLATE_KEYS).forEach(([k, storageKey]) => {
        if (bundle[k]) slateSet(storageKey, bundle[k]);
      });
      setMsg('✓ Data imported. Reload the page to see changes across all modules.');
      setImportText('');
    } catch {
      setMsg('✕ Invalid JSON. Check your file and try again.');
    }
  };

  const resetAll = () => {
    if (!window.confirm('Reset ALL Slate data to defaults? This cannot be undone.')) return;
    Object.values(SLATE_KEYS).forEach(k => localStorage.removeItem(k));
    setMsg('✓ All data reset to defaults. Reload the page.');
  };

  return (
    <div>
      <Card title="Export Configuration" subtitle="Download all Slate data as a JSON file. Use this to back up your data or share a config before a demo.">
        <button onClick={exportAll} style={{
          padding: '10px 22px', borderRadius: 8, background: C.deep, color: '#FFF',
          fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
        }}>⬇ Export All Data as JSON</button>
      </Card>

      <Card title="Import Configuration" subtitle="Paste JSON exported from Slate (or a shared config) to load new data across all modules.">
        <textarea value={importText} onChange={e => setImportText(e.target.value)}
          placeholder='Paste exported JSON here…'
          rows={10} style={{ width: '100%', padding: '12px', border: `1px solid ${C.chalk}`,
            borderRadius: 8, fontSize: 12, fontFamily: 'monospace', resize: 'vertical',
            outline: 'none', boxSizing: 'border-box', color: C.deep }} />
        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <button onClick={importAll} disabled={!importText.trim()} style={{
            padding: '10px 22px', borderRadius: 8, fontSize: 13, fontWeight: 700,
            background: importText.trim() ? C.brass : C.chalk, color: importText.trim() ? '#FFF' : C.muted,
            border: 'none', cursor: importText.trim() ? 'pointer' : 'not-allowed',
          }}>⬆ Import Data</button>
        </div>
        {msg && (
          <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            background: msg.startsWith('✓') ? C.greenBg : C.redBg,
            color: msg.startsWith('✓') ? C.green : C.red }}>{msg}</div>
        )}
      </Card>

      <Card title="Reset to Defaults" subtitle="Clears all saved data and restores Veritas demo defaults.">
        <button onClick={resetAll} style={{
          padding: '10px 22px', borderRadius: 8, background: C.redBg, color: C.red,
          fontSize: 13, fontWeight: 700, border: `1px solid ${C.red}30`, cursor: 'pointer',
        }}>↺ Reset All Data to Defaults</button>
      </Card>
    </div>
  );
}

// ─── ROOT ──────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'enrollment',    label: '📋 Enrollment'    },
  { id: 'financials',    label: '📊 Financials'    },
  { id: 'staff',         label: '👥 Staff'         },
  { id: 'risks',         label: '🛡 Risk Scores'  },
  { id: 'network',       label: '🏫 Network'       },
  { id: 'nst',           label: '🏢 NST Budgets'  },
  { id: 'importexport',  label: '⬇ Import / Export'},
];

export default function AdminApp() {
  const [tab, setTab] = useState('enrollment');

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: C.bg, minHeight: '100%' }}>
      <style>{`
        input[type=number]::-webkit-inner-spin-button { opacity: 0.4; }
        input:focus { border-color: #B79145 !important; box-shadow: 0 0 0 2px rgba(183,145,69,0.15); }
      `}</style>

      {/* Tab bar */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.chalk}`,
        display: 'flex', flexWrap: 'wrap', paddingLeft: 4 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '12px 18px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: tab === t.id ? 800 : 500,
            color: tab === t.id ? C.brass : C.muted,
            borderBottom: tab === t.id ? `2px solid ${C.brass}` : '2px solid transparent',
            transition: 'all 0.15s',
          }}>{t.label}</button>
        ))}
        <div style={{ marginLeft: 'auto', padding: '12px 20px', fontSize: 10, color: C.muted,
          alignSelf: 'center', letterSpacing: '1px', textTransform: 'uppercase' }}>
          Slate Admin · Data persists in browser
        </div>
      </div>

      <div style={{ padding: '24px 28px 40px', maxWidth: 900 }}>
        {tab === 'enrollment'   && <EnrollmentTab />}
        {tab === 'financials'   && <FinancialsTab />}
        {tab === 'staff'        && <StaffTab />}
        {tab === 'risks'        && <RisksTab />}
        {tab === 'network'      && <NetworkTab />}
        {tab === 'nst'          && <NSTTab />}
        {tab === 'importexport' && <ImportExportTab />}
      </div>
    </div>
  );
}
