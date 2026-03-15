/**
 * CampusBudgetDetail — Per-campus P&L derived from network budget.
 * Allocates network totals by enrollment share. Shows per-pupil economics,
 * revenue breakdown, expense breakdown, and AI campus-level advisor.
 */
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useLedger } from '../ledger-context/LedgerDataContext';
import AIFinancialAdvisor from './AIFinancialAdvisor';
import { CAMPUSES, CAMPUS_STATS } from '../sentinel-data/campuses';
import SectionHeader from '../sentinel-components/SectionHeader';
import { NOBLE, BG, TEXT, STATUS } from '../theme/colors';

const CAMPUS_COUNT = 17;
const fmt = (n: number) => n >= 1 ? `$${n.toFixed(1)}M` : `$${(n * 1000).toFixed(0)}K`;
const fmtK = (n: number) => `$${Math.round(n).toLocaleString()}`;

interface CampusBudgetDetailProps {
  campusName: string;
}

export default function CampusBudgetDetail({ campusName }: CampusBudgetDetailProps) {
  const { data: { budget }, ytd } = useLedger();
  const campus = CAMPUSES.find(c => c.name === campusName);

  const derived = useMemo(() => {
    if (!campus) return null;

    const totalEnroll = CAMPUSES.reduce((s, c) => s + c.enroll, 0);
    const enrollShare = campus.enroll / totalEnroll;
    const occupancyShare = 1 / CAMPUS_COUNT;

    // Revenue allocation
    const cpsRevenue = (budget.revenue.cps * enrollShare);
    const otherPublic = (budget.revenue.otherPublic * enrollShare);
    const philanthropy = (budget.revenue.philanthropy * enrollShare);
    const campusRevenue = (budget.revenue.campus * occupancyShare);
    const totalRevenue = cpsRevenue + otherPublic + philanthropy + campusRevenue;

    // Expense allocation
    const personnel = (budget.expenses.personnel * enrollShare);
    const directStudent = (budget.expenses.directStudent * enrollShare);
    const occupancy = (budget.expenses.occupancy * occupancyShare);
    const nstAlloc = (13.3 * enrollShare); // NST total allocated by enrollment
    const totalExpenses = personnel + directStudent + occupancy + nstAlloc;

    const ebitda = totalRevenue - totalExpenses;
    const perPupilRevenue = (totalRevenue * 1000000) / campus.enroll;
    const perPupilExpense = (totalExpenses * 1000000) / campus.enroll;
    const perPupilEbitda = perPupilRevenue - perPupilExpense;
    const networkAvgPerPupilRevenue = (budget.revenue.total * 1000000) / budget.enrollment;
    const networkAvgPerPupilExpense = (budget.expenses.total * 1000000) / budget.enrollment;

    // YTD allocation
    const ytdRevenue = ytd ? ytd.revenue.total * enrollShare : null;
    const ytdExpenses = ytd ? ytd.expenses.total * enrollShare : null;
    const ytdEbitda = ytdRevenue !== null && ytdExpenses !== null ? ytdRevenue - ytdExpenses : null;
    const proratedBudgetRevenue = ytd ? totalRevenue * ytd.proratedBudgetFactor : null;
    const proratedBudgetExpenses = ytd ? totalExpenses * ytd.proratedBudgetFactor : null;

    return {
      enrollShare, cpsRevenue, otherPublic, philanthropy, campusRevenue, totalRevenue,
      personnel, directStudent, occupancy, nstAlloc, totalExpenses,
      ebitda, perPupilRevenue, perPupilExpense, perPupilEbitda,
      networkAvgPerPupilRevenue, networkAvgPerPupilExpense,
      ytdRevenue, ytdExpenses, ytdEbitda, proratedBudgetRevenue, proratedBudgetExpenses,
    };
  }, [campus, budget, ytd]);

  if (!campus || !derived) return (
    <div style={{ padding: 40, color: TEXT.muted }}>Campus not found.</div>
  );

  const ebitdaColor = derived.ebitda >= 0 ? STATUS.green : STATUS.red;
  const perPupilVsNetwork = derived.perPupilRevenue - derived.networkAvgPerPupilRevenue;

  const revenueChart = [
    { name: 'CPS', value: derived.cpsRevenue, color: NOBLE.navy },
    { name: 'Other Public', value: derived.otherPublic, color: '#3B82F6' },
    { name: 'Philanthropy', value: derived.philanthropy, color: '#8B5CF6' },
    { name: 'Campus', value: derived.campusRevenue, color: '#06B6D4' },
  ];

  const expenseChart = [
    { name: 'Personnel', value: derived.personnel, color: '#F59E0B' },
    { name: 'Direct Student', value: derived.directStudent, color: '#10B981' },
    { name: 'Occupancy', value: derived.occupancy, color: '#6366F1' },
    { name: 'NST Alloc.', value: derived.nstAlloc, color: '#EC4899' },
  ];

  const ytdVarianceChart = derived.ytdRevenue !== null ? [
    {
      name: 'Revenue',
      actual: derived.ytdRevenue,
      budget: derived.proratedBudgetRevenue ?? 0,
      variance: derived.ytdRevenue - (derived.proratedBudgetRevenue ?? 0),
    },
    {
      name: 'Expenses',
      actual: derived.ytdExpenses ?? 0,
      budget: derived.proratedBudgetExpenses ?? 0,
      variance: (derived.ytdExpenses ?? 0) - (derived.proratedBudgetExpenses ?? 0),
    },
  ] : [];

  const card = (label: string, value: string, sub?: string, color?: string) => (
    <div style={{
      background: BG.card, border: `1px solid ${BG.border}`,
      borderRadius: 10, padding: '16px 20px', flex: 1,
    }}>
      <div style={{ fontSize: 11, color: TEXT.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: color ?? TEXT.primary, fontFamily: "'DM Mono', monospace" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: TEXT.muted, marginTop: 4 }}>{sub}</div>}
    </div>
  );

  return (
    <div>
      <SectionHeader
        title={`${campus.name} — Budget Detail`}
        subtitle={`FY26 allocation · ${campus.enroll.toLocaleString()} students · ${(derived.enrollShare * 100).toFixed(1)}% of network enrollment`}
      />

      {/* KPI row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {card('Allocated Revenue', fmt(derived.totalRevenue), `${fmtK(derived.perPupilRevenue)}/student`)}
        {card('Allocated Expenses', fmt(derived.totalExpenses), `${fmtK(derived.perPupilExpense)}/student`)}
        {card('Campus EBITDA', fmt(derived.ebitda), derived.ebitda >= 0 ? 'Surplus' : 'Deficit', ebitdaColor)}
        {card('Per-Pupil vs Network',
          `${perPupilVsNetwork >= 0 ? '+' : ''}${fmtK(perPupilVsNetwork)}`,
          `Network avg: ${fmtK(derived.networkAvgPerPupilRevenue)}`,
          perPupilVsNetwork >= 0 ? STATUS.green : STATUS.red
        )}
      </div>

      {/* Revenue & Expense breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div style={{ background: BG.card, border: `1px solid ${BG.border}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: TEXT.primary, marginBottom: 16 }}>Revenue Breakdown</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={revenueChart} layout="vertical" barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke={BG.border} horizontal={false} />
              <XAxis type="number" tickFormatter={v => `$${v.toFixed(1)}M`} tick={{ fontSize: 10, fill: TEXT.muted }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: TEXT.muted }} width={80} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {revenueChart.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: BG.card, border: `1px solid ${BG.border}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: TEXT.primary, marginBottom: 16 }}>Expense Breakdown</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={expenseChart} layout="vertical" barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke={BG.border} horizontal={false} />
              <XAxis type="number" tickFormatter={v => `$${v.toFixed(1)}M`} tick={{ fontSize: 10, fill: TEXT.muted }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: TEXT.muted }} width={80} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {expenseChart.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* YTD Variance */}
      {ytdVarianceChart.length > 0 && (
        <div style={{ background: BG.card, border: `1px solid ${BG.border}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: TEXT.primary, marginBottom: 4 }}>
            YTD Performance — {ytd?.asOf}
          </div>
          <div style={{ fontSize: 12, color: TEXT.muted, marginBottom: 16 }}>
            Actual vs prorated budget ({ytd?.monthsElapsed} of 12 months · {Math.round((ytd?.proratedBudgetFactor ?? 0) * 100)}% of year)
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            {ytdVarianceChart.map(row => {
              const isRevenue = row.name === 'Revenue';
              const favourable = isRevenue ? row.variance >= 0 : row.variance <= 0;
              const varColor = favourable ? STATUS.green : STATUS.red;
              return (
                <div key={row.name} style={{
                  flex: 1, background: BG.surface, borderRadius: 8,
                  padding: '14px 18px', border: `1px solid ${BG.border}`,
                }}>
                  <div style={{ fontSize: 11, color: TEXT.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{row.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: TEXT.muted }}>Actual</span>
                    <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: TEXT.primary }}>{fmt(row.actual)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: TEXT.muted }}>Prorated Budget</span>
                    <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: TEXT.muted }}>{fmt(row.budget)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: `1px solid ${BG.border}` }}>
                    <span style={{ fontSize: 12, color: TEXT.muted }}>Variance</span>
                    <span style={{ fontSize: 13, fontWeight: 800, fontFamily: "'DM Mono', monospace", color: varColor }}>
                      {row.variance >= 0 ? '+' : ''}{fmt(row.variance)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Allocation methodology note */}
      <div style={{
        background: '#FFFBEB', border: '1px solid #FDE68A',
        borderRadius: 8, padding: '10px 14px', marginBottom: 20,
        fontSize: 12, color: '#92400E', lineHeight: 1.5,
      }}>
        <strong>Allocation methodology:</strong> Personnel and direct student expenses allocated by enrollment share ({(derived.enrollShare * 100).toFixed(1)}%).
        Occupancy and NST allocated equally across {CAMPUS_COUNT} campuses. Revenue allocated by enrollment-weighted per-pupil rates.
        Actual campus P&L may differ based on site-specific grants, staffing, and occupancy costs.
      </div>

      <AIFinancialAdvisor mode="freeform" question={`Analyze the budget position of ${campus.name} in the Veritas Charter Schools network. This campus has ${campus.enroll} students (${(derived.enrollShare * 100).toFixed(1)}% of network enrollment), allocated revenue of ${fmt(derived.totalRevenue)}, expenses of ${fmt(derived.totalExpenses)}, and EBITDA of ${fmt(derived.ebitda)}. Per-pupil revenue is ${fmtK(derived.perPupilRevenue)} vs network average of ${fmtK(derived.networkAvgPerPupilRevenue)}. What should the campus principal and CFO focus on?`} />
    </div>
  );
}
