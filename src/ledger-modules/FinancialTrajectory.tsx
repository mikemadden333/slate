import { useState, useMemo } from 'react';
import { useLedger } from '../ledger-context/LedgerDataContext';
import AIFinancialAdvisor from './AIFinancialAdvisor';
import {
  ComposedChart, Area, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { NOBLE, BG, TEXT, STATUS } from '../theme/colors';
import { fmt, fmtDscr } from '../theme/formatters';
import { PROJECTIONS, SCENARIO_ASSUMPTIONS } from '../sentinel-data/scenarios';
import SectionHeader from '../sentinel-components/SectionHeader';
import TabBar from '../sentinel-components/TabBar';
import AIInsight from '../sentinel-components/AIInsight';
import CustomTooltip from '../sentinel-components/CustomTooltip';

type MetricTab = 'EBITDA' | 'Revenue' | 'Net Surplus' | 'DSCR';

const TABS: MetricTab[] = ['EBITDA', 'Revenue', 'Net Surplus', 'DSCR'];

const METRIC_FIELDS: Record<MetricTab, string> = {
  'EBITDA': 'ebitda',
  'Revenue': 'totalRevenue',
  'Net Surplus': 'netSurplus',
  'DSCR': 'dscr',
};

/* ── Narrative intelligence per metric ─────────────────────── */

const NARRATIVES: Record<MetricTab, { severity: 'green' | 'amber' | 'red'; title: string; body: string }> = {
  'EBITDA': {
    severity: 'amber',
    title: 'EBITDA Trajectory',
    body: 'EBITDA peaked at $10.8M in FY24, collapsed to $3.1M in FY25, and recovers to $7.5M in FY26 budget. The Reasonable scenario shows consecutive deficits in FY27 (-$1.9M) and FY28 (-$3.3M) before a slow recovery. The $6.7M gap between Optimistic ($4.8M) and Reasonable (-$1.9M) in FY27 hinges on two variables: the L1→L2 salary premium and health cost growth trajectory.',
  },
  'Revenue': {
    severity: 'green',
    title: 'Revenue Growth Outlook',
    body: 'Revenue grew 32% from FY20 ($186.5M) to FY26 ($246.6M), a 4.7% CAGR driven by CPS PCTC increases. All three scenarios project continued growth: Optimistic reaches $308.7M by FY31, Reasonable $298.1M. Revenue is not the problem — the $10.6M spread between scenarios by FY31 is modest. The risk is on the expense side, where personnel costs have grown faster than revenue since FY22.',
  },
  'Net Surplus': {
    severity: 'red',
    title: 'Surplus Volatility Warning',
    body: 'Net surplus is the most volatile metric: swinging from -$4.9M (FY22) to +$17.4M (FY24) to -$3.0M (FY25). Under the Reasonable scenario, Noble runs cumulative deficits of -$9.9M through FY30 before turning positive in FY31. The Pessimistic scenario shows an accelerating deficit reaching -$22.5M annually by FY31. Reserves built during FY23-FY24 surplus years provide a runway, but not indefinitely.',
  },
  'DSCR': {
    severity: 'red',
    title: 'Covenant Compliance at Risk',
    body: 'FY26 DSCR of 3.47x provides strong current headroom above the 1.0x minimum. However, the Reasonable scenario projects a breach to 0.72x in FY28 — the single most critical finding in this analysis. DSCR = (EBITDA + $6.2M depreciation + $1.3M interest) / $2.8M MADS. To avoid breach, Noble must generate at least $2.8M EBITDA deficit recovery or find $0.8M in additional cushion by FY28.',
  },
};

export default function FinancialTrajectory() {
  const { data: { budget, historical } } = useLedger();
  const [activeTab, setActiveTab] = useState<string>('EBITDA');
  const metric = activeTab as MetricTab;
  const field = METRIC_FIELDS[metric] ?? 'ebitda';
  const isDscr = metric === 'DSCR';
  const needsZeroLine = metric === 'EBITDA' || metric === 'Net Surplus';
  const tickFmt = isDscr ? fmtDscr : fmt;

  const chartData = useMemo(() => {
    const data: Record<string, unknown>[] = [];

    // Historical FY20–FY25
    for (const h of historical) {
      data.push({
        year: h.year,
        actual: (h as Record<string, unknown>)[field],
      });
    }

    // FY26 bridge year — all scenarios start here
    const fy26Val = (budget as Record<string, unknown>)[field] as number;
    data.push({
      year: 'FY26B',
      actual: fy26Val,
      optimistic: fy26Val,
      reasonable: fy26Val,
      pessimistic: fy26Val,
      fanBase: fy26Val,
      fanBand: 0,
    });

    // Projections FY27–FY31
    for (let i = 0; i < PROJECTIONS.optimistic.length; i++) {
      const opt = (PROJECTIONS.optimistic[i] as Record<string, unknown>)[field] as number;
      const reas = (PROJECTIONS.reasonable[i] as Record<string, unknown>)[field] as number;
      const pess = (PROJECTIONS.pessimistic[i] as Record<string, unknown>)[field] as number;
      data.push({
        year: PROJECTIONS.optimistic[i].year,
        optimistic: opt,
        reasonable: reas,
        pessimistic: pess,
        fanBase: pess,
        fanBand: opt - pess,
      });
    }

    return data;
  }, [field]);

  const narrative = NARRATIVES[metric];

  return (
    <div>
      <SectionHeader
        title="Financial Trajectory"
        subtitle="FY20–FY31 actuals with three-scenario forward projections"
      />

      {/* SECTION 1: Metric Selector */}
      <TabBar tabs={TABS as unknown as string[]} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* SECTION 2: Fan Chart */}
      <div style={{
        background: BG.card,
        border: `1px solid ${BG.border}`,
        borderRadius: 12,
        padding: '20px 20px 16px',
        marginTop: 24,
        marginBottom: 32,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={chartData} margin={{ top: 12, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={BG.border} strokeDasharray="3 3" vertical={false} />
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
              tickFormatter={(v: number) => tickFmt(v)}
            />
            <Tooltip content={<CustomTooltip formatter={(v: number) => tickFmt(v)} />} />
            <Legend
              align="right"
              verticalAlign="top"
              wrapperStyle={{ fontSize: 12, fontFamily: "'Inter', sans-serif", paddingBottom: 8 }}
            />

            {/* Fan area between pessimistic and optimistic */}
            <Area
              stackId="fan"
              type="monotone"
              dataKey="fanBase"
              fill="transparent"
              stroke="none"
              activeDot={false}
              legendType="none"
            />
            <Area
              stackId="fan"
              type="monotone"
              dataKey="fanBand"
              fill={`${NOBLE.gold}26`}
              stroke="none"
              activeDot={false}
              legendType="none"
            />

            {/* DSCR reference lines */}
            {isDscr && (
              <ReferenceLine
                y={1.0}
                stroke={STATUS.red}
                strokeDasharray="6 3"
                label={{ value: 'BREACH', fill: STATUS.red, fontSize: 11, position: 'right' }}
              />
            )}
            {isDscr && (
              <ReferenceLine
                y={1.1}
                stroke={STATUS.amber}
                strokeDasharray="6 3"
                label={{ value: 'Bond Doc Min', fill: STATUS.amber, fontSize: 11, position: 'right' }}
              />
            )}

            {/* Zero line for EBITDA / Net Surplus */}
            {needsZeroLine && (
              <ReferenceLine y={0} stroke={TEXT.dim} strokeDasharray="4 4" />
            )}

            {/* Historical actual line */}
            <Line
              type="monotone"
              dataKey="actual"
              name="Actual"
              stroke={NOBLE.navy}
              strokeWidth={2}
              dot={false}
              animationDuration={800}
            />

            {/* Scenario lines */}
            <Line
              type="monotone"
              dataKey="optimistic"
              name="Optimistic"
              stroke={STATUS.green}
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={false}
              animationDuration={800}
            />
            <Line
              type="monotone"
              dataKey="reasonable"
              name="Reasonable"
              stroke={STATUS.amber}
              strokeWidth={2.5}
              dot={{ fill: STATUS.amber, r: 3, strokeWidth: 0 }}
              animationDuration={800}
            />
            <Line
              type="monotone"
              dataKey="pessimistic"
              name="Pessimistic"
              stroke={STATUS.red}
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={false}
              animationDuration={800}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* SECTION 3: Narrative Intelligence */}
      <div style={{
        background: BG.card,
        border: `1px solid ${BG.border}`,
        borderLeft: `4px solid ${narrative.severity === 'green' ? STATUS.green : narrative.severity === 'amber' ? STATUS.amber : STATUS.red}`,
        borderRadius: '0 12px 12px 0',
        padding: '20px 24px',
        marginBottom: 32,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <h4 style={{
          fontSize: 15,
          fontWeight: 600,
          color: narrative.severity === 'green' ? STATUS.green : narrative.severity === 'amber' ? STATUS.amber : STATUS.red,
          fontFamily: "'DM Sans', sans-serif",
          margin: '0 0 8px',
        }}>
          {narrative.title}
        </h4>
        <div style={{
          fontSize: 14,
          fontFamily: "'Inter', sans-serif",
          color: TEXT.primary,
          lineHeight: 1.7,
        }}>
          {narrative.body}
        </div>
      </div>

      {/* SECTION 4: Scenario Assumptions Comparison */}
      <SectionHeader title="Scenario Assumptions" />
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16,
        marginBottom: 32,
      }}>
        {(['optimistic', 'reasonable', 'pessimistic'] as const).map(key => {
          const s = SCENARIO_ASSUMPTIONS[key];
          const borderColor =
            key === 'optimistic' ? STATUS.green
            : key === 'reasonable' ? STATUS.amber
            : STATUS.red;
          return (
            <div key={key} style={{
              background: BG.card,
              border: `1px solid ${BG.border}`,
              borderTop: `3px solid ${borderColor}`,
              borderRadius: 12,
              padding: '16px 20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <h4 style={{
                fontSize: 15,
                fontWeight: 600,
                color: borderColor,
                fontFamily: "'DM Sans', sans-serif",
                margin: '0 0 12px',
              }}>
                {s.label}
              </h4>
              <AssumptionRow label="PCTC Growth" value={s.pctcGrowth} />
              <AssumptionRow label="L2 Premium" value={`$${s.l2Premium.toLocaleString()}`} />
              <AssumptionRow label="Retention" value={`${(s.retention * 100).toFixed(0)}%`} />
              <AssumptionRow label="Philanthropy" value={`${(s.philanthropyGrowth * 100).toFixed(0)}%/yr`} />
              <AssumptionRow label="Health Cost" value={s.healthGrowth} />
              <AssumptionRow label="Contingency" value={`$${s.contingency.toFixed(1)}M`} />
            </div>
          );
        })}
      </div>

      {/* SECTION 5: AI Insight */}
      <AIInsight severity="red">
        FY28 is the critical inflection point. Under the Reasonable scenario,
        DSCR drops to 0.72x — the only year across all three scenarios that
        breaches the 1.0x covenant. The gap between Optimistic and Reasonable
        is $6.7M in FY27 EBITDA, driven by the L1→L2 salary premium ($2K vs
        $4K = $2.4M swing) and health cost trajectory ($2.1M swing).
      </AIInsight>
    </div>
  );
}

function AssumptionRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '4px 0',
      fontSize: 13,
      borderBottom: `1px solid ${BG.border}`,
    }}>
      <span style={{ color: TEXT.muted, fontFamily: "'Inter', sans-serif" }}>{label}</span>
      <span style={{ color: TEXT.primary, fontFamily: "'DM Mono', monospace" }}>{value}</span>

      <AIFinancialAdvisor mode="trajectory" compact={true} />
    </div>
  );
}
