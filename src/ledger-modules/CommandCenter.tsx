import { useMemo } from 'react';
import {
  ComposedChart, Area, Line, Bar, Cell,
  BarChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import { NOBLE, BG, TEXT, CHART, STATUS } from '../theme/colors';
import { fmt } from '../theme/formatters';
import { HISTORICAL } from '../sentinel-data/historical';
import { FY26_BUDGET, FY26_YTD } from '../sentinel-data/fy26';
import KPICard from '../sentinel-components/KPICard';
import AIInsight from '../sentinel-components/AIInsight';
import SectionHeader from '../sentinel-components/SectionHeader';
import DistanceToDanger from '../sentinel-components/DistanceToDanger';
import CustomTooltip from '../sentinel-components/CustomTooltip';

/* ── Waterfall tooltip ──────────────────────────────────────── */

function WaterfallTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; dataKey: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const item = payload.find(p => p.dataKey === 'delta');
  if (!item) return null;

  return (
    <div style={{
      background: NOBLE.navyDark,
      border: `1px solid ${NOBLE.navy}`,
      borderRadius: 8,
      padding: '8px 12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    }}>
      <div style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
        {label}
      </div>
      <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: "'DM Mono', monospace" }}>
        {item.value >= 0 ? '+' : ''}{`$${item.value.toFixed(1)}M`}
      </div>
    </div>
  );
}

export default function CommandCenter() {
  const chartData = useMemo(() => [
    ...HISTORICAL.map(h => ({
      year: h.year,
      totalRevenue: h.totalRevenue,
      totalExpenses: h.totalExpenses,
      ebitda: h.ebitda,
    })),
    {
      year: 'FY26B',
      totalRevenue: FY26_BUDGET.totalRevenue,
      totalExpenses: FY26_BUDGET.totalExpenses,
      ebitda: FY26_BUDGET.ebitda,
    },
  ], []);

  /* ── Revenue waterfall data ─────────────────────────────── */

  const revWaterfall = useMemo(() => {
    const r = FY26_YTD.revenue;
    const budget = r.total.budget;   // 139.9
    let running = budget;

    const items = [
      { name: 'Budget', base: 0, delta: budget, total: budget, isTotal: true },
      { name: 'CPS Revenue', base: running, delta: r.cps.variance, total: running + r.cps.variance, isTotal: false },
    ];
    running += r.cps.variance;

    items.push({ name: 'Other Public', base: running, delta: r.otherPublic.variance, total: running + r.otherPublic.variance, isTotal: false });
    running += r.otherPublic.variance;

    items.push({ name: 'Philanthropy', base: running, delta: r.philanthropy.variance, total: running + r.philanthropy.variance, isTotal: false });
    running += r.philanthropy.variance;

    items.push({ name: 'Campus Rev', base: running, delta: r.campus.variance, total: running + r.campus.variance, isTotal: false });
    running += r.campus.variance;

    items.push({ name: 'Actual', base: 0, delta: r.total.actual, total: r.total.actual, isTotal: true });

    return items;
  }, []);

  /* ── Expense waterfall data ─────────────────────────────── */

  const expWaterfall = useMemo(() => {
    const e = FY26_YTD.expenses;
    const budget = e.total.budget;   // 131.3
    let running = budget;

    // Expense variances are negative when over budget (bad), so flip sign for waterfall
    const items = [
      { name: 'Budget', base: 0, delta: budget, total: budget, isTotal: true },
      { name: 'Personnel', base: running, delta: -e.personnel.variance, total: running + (-e.personnel.variance), isTotal: false },
    ];
    running += (-e.personnel.variance);

    items.push({ name: 'Other OpEx', base: running, delta: -e.other.variance, total: running + (-e.other.variance), isTotal: false });
    running += (-e.other.variance);

    items.push({ name: 'Direct Student', base: running, delta: -e.directStudent.variance, total: running + (-e.directStudent.variance), isTotal: false });
    running += (-e.directStudent.variance);

    items.push({ name: 'Occupancy', base: running, delta: -e.occupancy.variance, total: running + (-e.occupancy.variance), isTotal: false });
    running += (-e.occupancy.variance);

    items.push({ name: 'Actual', base: 0, delta: e.total.actual, total: e.total.actual, isTotal: true });

    return items;
  }, []);

  return (
    <div>
      <SectionHeader
        title="Command Center"
        subtitle="Executive overview of Noble Schools financial health"
      />

      {/* SECTION 1: KPI Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 32,
      }}>
        <KPICard
          label="YTD Revenue"
          value="$144.0M"
          trend="up"
          trendValue="+$4.0M vs budget"
          status="positive"
        />
        <KPICard
          label="YTD EBITDA"
          value="$9.3M"
          trend="up"
          trendValue="+$0.7M vs budget"
          status="positive"
        />
        <KPICard
          label="Net Surplus"
          value="$7.7M"
          trend="up"
          trendValue="+$5.9M ahead"
          status="positive"
        />
        <KPICard
          label="DSCR"
          value="3.47x"
          trend="up"
          trendValue="vs 1.0x minimum"
          status="positive"
        />
        <KPICard
          label="Enrollment"
          value="11,969"
          trend="down"
          trendValue="vs 12,148 C1"
          status="negative"
        />
      </div>

      {/* SECTION 2: Distance to Danger */}
      <SectionHeader title="Distance to Danger" />
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 16,
        marginBottom: 32,
      }}>
        <DistanceToDanger
          label="DSCR Breach (1.0x)"
          current={3.47}
          threshold={1.0}
          unit="x"
          headroom="$8.8M cushion"
          bufferPct={71}
        />
        <DistanceToDanger
          label="CPS Net Assets (20% min)"
          current={69.1}
          threshold={20.0}
          unit="%"
          headroom="$130M+ buffer"
          bufferPct={85}
        />
        <DistanceToDanger
          label="Days Cash (30 day min)"
          current={215}
          threshold={30}
          unit="days"
          headroom="7.2× minimum"
          bufferPct={86}
        />
        <DistanceToDanger
          label="EBITDA Target (3%)"
          current={6.5}
          threshold={3.0}
          unit="%"
          headroom="$5.1M above floor"
          bufferPct={68}
        />
      </div>

      {/* SECTION 3: Revenue & Expense Waterfalls */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 24,
        marginBottom: 32,
      }}>
        {/* Revenue Waterfall */}
        <div style={{
          background: BG.card,
          border: `1px solid ${BG.border}`,
          borderRadius: 12,
          padding: '20px 20px 16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <h3 style={{
            fontSize: 15,
            fontWeight: 600,
            color: TEXT.primary,
            fontFamily: "'DM Sans', sans-serif",
            margin: '0 0 16px',
          }}>
            Revenue Variance Waterfall (YTD)
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revWaterfall} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={BG.border} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: TEXT.muted, fontSize: 11, fontFamily: "'Inter', sans-serif" }}
                axisLine={{ stroke: BG.border }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: TEXT.muted, fontSize: 11, fontFamily: "'DM Mono', monospace" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `$${v}M`}
                domain={[0, 'auto']}
              />
              <Tooltip content={<WaterfallTooltip />} />
              <Bar dataKey="base" stackId="stack" fill="transparent" legendType="none" />
              <Bar dataKey="delta" stackId="stack" name="Variance" radius={[4, 4, 0, 0]} barSize={32}>
                {revWaterfall.map((item, i) => (
                  <Cell
                    key={i}
                    fill={item.isTotal ? NOBLE.navy : item.delta >= 0 ? STATUS.green : STATUS.red}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Waterfall */}
        <div style={{
          background: BG.card,
          border: `1px solid ${BG.border}`,
          borderRadius: 12,
          padding: '20px 20px 16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <h3 style={{
            fontSize: 15,
            fontWeight: 600,
            color: TEXT.primary,
            fontFamily: "'DM Sans', sans-serif",
            margin: '0 0 16px',
          }}>
            Expense Variance Waterfall (YTD)
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={expWaterfall} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={BG.border} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: TEXT.muted, fontSize: 11, fontFamily: "'Inter', sans-serif" }}
                axisLine={{ stroke: BG.border }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: TEXT.muted, fontSize: 11, fontFamily: "'DM Mono', monospace" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `$${v}M`}
                domain={[0, 'auto']}
              />
              <Tooltip content={<WaterfallTooltip />} />
              <Bar dataKey="base" stackId="stack" fill="transparent" legendType="none" />
              <Bar dataKey="delta" stackId="stack" name="Variance" radius={[4, 4, 0, 0]} barSize={32}>
                {expWaterfall.map((item, i) => (
                  <Cell
                    key={i}
                    fill={item.isTotal ? NOBLE.navy : item.delta > 0 ? STATUS.red : item.delta < 0 ? STATUS.green : TEXT.dim}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SECTION 4 + 5: Chart & AI Insights side by side */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 2fr)',
        gap: 24,
        marginBottom: 32,
      }}>
        {/* Chart */}
        <div style={{
          background: BG.card,
          border: `1px solid ${BG.border}`,
          borderRadius: 12,
          padding: '20px 20px 16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <h3 style={{
            fontSize: 16,
            fontWeight: 600,
            color: TEXT.primary,
            fontFamily: "'DM Sans', sans-serif",
            margin: '0 0 16px',
          }}>
            7-Year P&L Trajectory
          </h3>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid
                stroke={BG.border}
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="year"
                tick={{ fill: TEXT.muted, fontSize: 12, fontFamily: "'Inter', sans-serif" }}
                axisLine={{ stroke: BG.border }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: TEXT.muted, fontSize: 11, fontFamily: "'DM Mono', monospace" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => fmt(v)}
              />
              <Tooltip
                content={<CustomTooltip formatter={(v: number) => fmt(v)} />}
              />
              <Legend
                align="right"
                verticalAlign="top"
                wrapperStyle={{
                  fontSize: 12,
                  fontFamily: "'Inter', sans-serif",
                  color: TEXT.muted,
                  paddingBottom: 8,
                }}
              />
              <Area
                type="monotone"
                dataKey="totalRevenue"
                name="Revenue"
                fill={`${NOBLE.navy}1A`}
                stroke={NOBLE.navy}
                strokeWidth={2}
                animationDuration={800}
              />
              <Line
                type="monotone"
                dataKey="totalExpenses"
                name="Expenses"
                stroke={CHART.blue}
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={false}
                animationDuration={800}
              />
              <Bar
                dataKey="ebitda"
                name="EBITDA"
                fill={NOBLE.gold}
                radius={[4, 4, 0, 0]}
                barSize={28}
                animationDuration={800}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* AI Insights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{
            fontSize: 16,
            fontWeight: 600,
            color: TEXT.primary,
            fontFamily: "'DM Sans', sans-serif",
            margin: 0,
          }}>
            AI Insights
          </h3>
          <AIInsight severity="green">
            FY26 YTD is $5.9M ahead of budget through January, driven by
            philanthropy outperformance (+$2.3M) and other public revenue
            (+$1.5M) offsetting personnel overruns (+$3.2M over budget).
          </AIInsight>
          <AIInsight severity="amber">
            The Reasonable scenario projects EBITDA deficits in FY27 (-$1.9M)
            and FY28 (-$3.3M) before recovering in FY29+. The FY28 DSCR of
            0.72x would breach the 1.0x bond covenant minimum.
          </AIInsight>
          <AIInsight severity="red">
            Personnel spending is $3.2M over budget YTD ($95.8M vs $92.7M).
            At 70% of operating expenses, this is the single largest cost
            pressure. The L1→L2 salary premium and health cost trajectory are
            the key swing factors — a $4.5M gap between optimistic and
            reasonable scenarios.
          </AIInsight>
        </div>
      </div>
    </div>
  );
}
