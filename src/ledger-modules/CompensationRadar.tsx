import { useLedger } from '../ledger-context/LedgerDataContext';
import AIFinancialAdvisor from './AIFinancialAdvisor';
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import { NOBLE, BG, TEXT, STATUS, CHART } from '../theme/colors';
import { fmt } from '../theme/formatters';
import { COMPENSATION } from '../sentinel-data/compensation';
import SectionHeader from '../sentinel-components/SectionHeader';
import KPICard from '../sentinel-components/KPICard';
import AIInsight from '../sentinel-components/AIInsight';
import CustomTooltip from '../sentinel-components/CustomTooltip';

const scenarios = COMPENSATION.fy27Scenarios;
const gap = COMPENSATION.scenarioGap;

export default function CompensationRadar() {
  const { data: { budget, historical }, ytd } = useLedger();
  return (
    <div>
      <SectionHeader
        title="Compensation Radar"
        subtitle="Personnel cost drivers, CPS salary gap, and benefits pressure"
      />

      {/* SECTION 1 — KPI Strip */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
        <KPICard
          label="FY26 Personnel"
          value="$165.1M"
          subtitle="70% of operating expenses"
          trend="up"
          trendValue="70% of OpEx"
          status="neutral"
        />
        <KPICard
          label="Base Salaries"
          value="$122.5M"
          trend="up"
          trendValue="+$2.5M vs FY25"
          status="neutral"
        />
        <KPICard
          label="CPS Gap"
          value="-7.8%"
          subtitle="Noble $60K vs CPS $65,090"
          trend="down"
          trendValue="Noble $60K vs CPS $65,090"
          status="negative"
        />
        <KPICard
          label="5-Year Pressure"
          value="$24.4M"
          subtitle="SY25→SY30 salary growth"
          trend="up"
          trendValue="SY25→SY30"
          status="negative"
        />
      </div>

      {/* SECTION 2 — Personnel Composition Chart */}
      <SectionHeader title="Personnel Cost Composition" subtitle="FY20–FY26 stacked breakdown" />
      <div style={{
        background: BG.card,
        border: `1px solid ${BG.border}`,
        borderRadius: 12,
        padding: '20px 20px 16px',
        marginBottom: 32,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <ResponsiveContainer width="100%" height={380}>
          <AreaChart
            data={COMPENSATION.historicalPersonnel}
            margin={{ top: 12, right: 20, left: 0, bottom: 0 }}
          >
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
              tickFormatter={(v: number) => fmt(v)}
            />
            <Tooltip content={<CustomTooltip formatter={(v: number) => fmt(v)} />} />
            <Legend
              align="right"
              verticalAlign="top"
              wrapperStyle={{ fontSize: 12, fontFamily: "'Inter', sans-serif", paddingBottom: 8 }}
            />
            <Area
              type="monotone"
              dataKey="base"
              name="Base Salaries"
              stackId="1"
              fill={NOBLE.navy}
              fillOpacity={0.85}
              stroke={NOBLE.navyLight}
              strokeWidth={1.5}
            />
            <Area
              type="monotone"
              dataKey="benefits"
              name="Benefits"
              stackId="1"
              fill={CHART.purple}
              fillOpacity={0.7}
              stroke={CHART.purple}
              strokeWidth={1.5}
            />
            <Area
              type="monotone"
              dataKey="stipends"
              name="Stipends"
              stackId="1"
              fill={NOBLE.gold}
              fillOpacity={0.6}
              stroke={STATUS.amber}
              strokeWidth={1.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* SECTION 3 — FY27 Scenario Comparison */}
      <SectionHeader title="FY27 Personnel Scenarios" />
      <div style={{
        display: 'flex',
        gap: 0,
        alignItems: 'stretch',
        marginBottom: 32,
      }}>
        {/* Optimistic card */}
        <div style={{
          flex: 1,
          background: BG.card,
          border: `1px solid ${BG.border}`,
          borderTop: `3px solid ${STATUS.green}`,
          borderRadius: '12px 0 0 12px',
          padding: '20px 24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <h4 style={{
            fontSize: 15,
            fontWeight: 600,
            color: STATUS.green,
            fontFamily: "'DM Sans', sans-serif",
            margin: '0 0 12px',
          }}>
            Optimistic
          </h4>
          <div style={{
            fontSize: 28,
            fontFamily: "'DM Mono', monospace",
            color: TEXT.primary,
            fontWeight: 500,
            marginBottom: 4,
          }}>
            ${scenarios.optimistic.total}M
          </div>
          <div style={{
            fontSize: 13,
            fontFamily: "'DM Mono', monospace",
            color: TEXT.muted,
            marginBottom: 12,
          }}>
            +${scenarios.optimistic.delta}M vs FY26
          </div>
          <div style={{
            fontSize: 12,
            fontFamily: "'Inter', sans-serif",
            color: TEXT.dim,
          }}>
            L2 Premium: ${scenarios.optimistic.l2Premium.toLocaleString()} | Health: {scenarios.optimistic.healthGrowth}
          </div>
        </div>

        {/* Gap connector */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px 12px',
          background: BG.cardHover,
          borderTop: `1px solid ${BG.border}`,
          borderBottom: `1px solid ${BG.border}`,
          minWidth: 140,
        }}>
          <div style={{
            fontSize: 20,
            fontFamily: "'DM Mono', monospace",
            fontWeight: 700,
            color: NOBLE.navy,
            marginBottom: 6,
          }}>
            ${gap.totalGap}M GAP
          </div>
          <div style={{
            fontSize: 11,
            fontFamily: "'Inter', sans-serif",
            color: TEXT.muted,
            textAlign: 'center',
            lineHeight: 1.5,
          }}>
            {gap.pctExplained}% driven by L2 premium (${gap.l2PremiumSwing}M) + health costs (${gap.healthCostSwing}M)
          </div>
        </div>

        {/* Reasonable card */}
        <div style={{
          flex: 1,
          background: BG.card,
          border: `1px solid ${BG.border}`,
          borderTop: `3px solid ${STATUS.amber}`,
          padding: '20px 24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <h4 style={{
            fontSize: 15,
            fontWeight: 600,
            color: STATUS.amber,
            fontFamily: "'DM Sans', sans-serif",
            margin: '0 0 12px',
          }}>
            Reasonable
          </h4>
          <div style={{
            fontSize: 28,
            fontFamily: "'DM Mono', monospace",
            color: TEXT.primary,
            fontWeight: 500,
            marginBottom: 4,
          }}>
            ${scenarios.reasonable.total}M
          </div>
          <div style={{
            fontSize: 13,
            fontFamily: "'DM Mono', monospace",
            color: TEXT.muted,
            marginBottom: 12,
          }}>
            +${scenarios.reasonable.delta}M vs FY26
          </div>
          <div style={{
            fontSize: 12,
            fontFamily: "'Inter', sans-serif",
            color: TEXT.dim,
          }}>
            L2 Premium: ${scenarios.reasonable.l2Premium.toLocaleString()} | Health: {scenarios.reasonable.healthGrowth}
          </div>
        </div>

        {/* Pessimistic card */}
        <div style={{
          flex: 1,
          background: BG.card,
          border: `1px solid ${BG.border}`,
          borderTop: `3px solid ${STATUS.red}`,
          borderRadius: '0 12px 12px 0',
          padding: '20px 24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <h4 style={{
            fontSize: 15,
            fontWeight: 600,
            color: STATUS.red,
            fontFamily: "'DM Sans', sans-serif",
            margin: '0 0 12px',
          }}>
            Pessimistic
          </h4>
          <div style={{
            fontSize: 28,
            fontFamily: "'DM Mono', monospace",
            color: TEXT.primary,
            fontWeight: 500,
            marginBottom: 4,
          }}>
            ${scenarios.pessimistic.total}M
          </div>
          <div style={{
            fontSize: 13,
            fontFamily: "'DM Mono', monospace",
            color: TEXT.muted,
            marginBottom: 12,
          }}>
            +${scenarios.pessimistic.delta}M vs FY26
          </div>
          <div style={{
            fontSize: 12,
            fontFamily: "'Inter', sans-serif",
            color: TEXT.dim,
          }}>
            L2 Premium: ${scenarios.pessimistic.l2Premium.toLocaleString()} | Health: {scenarios.pessimistic.healthGrowth}
          </div>
        </div>
      </div>

      {/* SECTION 4 — Teacher Competitiveness Index */}
      <SectionHeader title="Teacher Competitiveness Index" subtitle="Noble vs CPS starting salary comparison" />
      <div style={{
        background: BG.card,
        border: `1px solid ${BG.border}`,
        borderRadius: 12,
        padding: '24px 28px',
        marginBottom: 32,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        {/* Visual comparison bars */}
        <div style={{ marginBottom: 24 }}>
          {[
            { label: 'CPS L1 Step 0', value: 65090, color: CHART.blue, width: 100 },
            { label: 'Noble Starting', value: 60000, color: NOBLE.navy, width: Math.round(60000 / 65090 * 100) },
          ].map(bar => (
            <div key={bar.label} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontFamily: "'Inter', sans-serif", color: TEXT.muted }}>
                  {bar.label}
                </span>
                <span style={{ fontSize: 14, fontFamily: "'DM Mono', monospace", fontWeight: 600, color: TEXT.primary }}>
                  ${bar.value.toLocaleString()}
                </span>
              </div>
              <div style={{
                height: 28,
                background: BG.cardHover,
                borderRadius: 6,
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${bar.width}%`,
                  height: '100%',
                  background: bar.color,
                  borderRadius: 6,
                  opacity: 0.85,
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Gap metrics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 20,
          padding: '16px 0',
          borderTop: `1px solid ${BG.border}`,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: TEXT.muted, fontFamily: "'Inter', sans-serif", marginBottom: 4 }}>
              Per-Teacher Gap
            </div>
            <div style={{ fontSize: 22, fontFamily: "'DM Mono', monospace", fontWeight: 700, color: STATUS.red }}>
              -$5,090
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: TEXT.muted, fontFamily: "'Inter', sans-serif", marginBottom: 4 }}>
              Teachers Affected
            </div>
            <div style={{ fontSize: 22, fontFamily: "'DM Mono', monospace", fontWeight: 700, color: TEXT.primary }}>
              ~400
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: TEXT.muted, fontFamily: "'Inter', sans-serif", marginBottom: 4 }}>
              Parity Cost
            </div>
            <div style={{ fontSize: 22, fontFamily: "'DM Mono', monospace", fontWeight: 700, color: NOBLE.navy }}>
              ~$2.0M
            </div>
          </div>
        </div>

        <div style={{
          fontSize: 13,
          fontFamily: "'Inter', sans-serif",
          color: TEXT.dim,
          textAlign: 'center',
          marginTop: 12,
          fontStyle: 'italic',
        }}>
          Closing the CPS gap for ~400 teachers at $5,090 each = ~$2.0M annual cost
        </div>
      </div>

      {/* SECTION 5 — AI Insight */}
      <AIInsight severity="red">
        Personnel costs grew 39% from FY20 ($124.2M) to FY26 ($165.1M) while enrollment
        declined 2.3%. The $4.5M gap between Optimistic and Reasonable FY27 scenarios is
        the single largest variable in Noble's financial future. It traces to two decisions:
        the L1{'\u2192'}L2 salary premium ($4K vs $2K = $2.4M annual swing) and health cost
        trajectory (10% vs 15% growth = $2.1M swing). Revenue per FTE must accelerate to
        sustain current staffing levels.
      </AIInsight>

      <AIFinancialAdvisor mode="compensation" compact={true} />
    </div>
  );
}
