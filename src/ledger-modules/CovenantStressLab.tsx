import { useLedger } from '../ledger-context/LedgerDataContext';
import AIFinancialAdvisor from './AIFinancialAdvisor';
import { useState, useMemo, useCallback } from 'react';
import {
  ComposedChart, Bar, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { NOBLE, BG, TEXT, STATUS } from '../theme/colors';
import { fmtDscr } from '../theme/formatters';
import { PROJECTIONS } from '../sentinel-data/scenarios';
import SectionHeader from '../sentinel-components/SectionHeader';
import StatusBadge from '../sentinel-components/StatusBadge';
import AIInsight from '../sentinel-components/AIInsight';

type Scenario = 'optimistic' | 'reasonable' | 'pessimistic';


function dscrStatus(dscr: number): 'pass' | 'tight' | 'breach' {
  if (dscr >= 1.1) return 'pass';
  if (dscr >= 1.0) return 'tight';
  return 'breach';
}

function dscrBarColor(dscr: number): string {
  if (dscr >= 1.1) return STATUS.green;
  if (dscr >= 1.0) return STATUS.amber;
  return STATUS.red;
}

function CovenantTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div style={{
      background: NOBLE.navyDark,
      border: `1px solid ${NOBLE.navy}`,
      borderRadius: 8,
      padding: '10px 14px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
    }}>
      {label && (
        <div style={{
          fontSize: 12,
          color: 'rgba(255,255,255,0.65)',
          marginBottom: 6,
          fontFamily: "'Inter', sans-serif",
        }}>
          {label}
        </div>
      )}
      {payload.map((entry, i) => (
        <div key={i} style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 16,
          fontSize: 13,
          fontFamily: "'DM Mono', monospace",
          color: '#FFFFFF',
          lineHeight: 1.6,
        }}>
          <span style={{ color: entry.color ?? 'rgba(255,255,255,0.65)' }}>{entry.name}</span>
          <span>
            {entry.name === 'DSCR' ? fmtDscr(entry.value) : `$${entry.value.toFixed(1)}M`}
          </span>
        </div>
      ))}
    </div>
  );
}

const AI_INSIGHTS: Record<Scenario, { severity: 'green' | 'amber' | 'red'; text: string }> = {
  optimistic: {
    severity: 'green',
    text: "All years pass covenant tests with significant margin. Lowest DSCR is 3.53x in FY27 with $7.1M cushion above the 1.0x minimum. No board action required under this scenario.",
  },
  reasonable: {
    severity: 'red',
    text: "COVENANT BREACH DETECTED: FY28 DSCR drops to 0.72x, below the 1.0x minimum. Cushion is -$798K. Under bond documents (MADS = $2.8M post-refunding), this triggers a Consultant Call Event requiring an independent management consultant. The breach is driven by L1\u2192L2 salary step increases outpacing PCTC growth. Recovery begins FY29 (1.45x) as revenue growth catches up.",
  },
  pessimistic: {
    severity: 'red',
    text: "SUSTAINED COVENANT BREACH: DSCR falls below 1.0x in FY27 (0.85x) and remains in breach through FY31 (-0.50x). Cumulative EBITDA deficit exceeds $72M over five years. This scenario would require immediate structural intervention: campus consolidation, significant headcount reduction, or emergency capital infusion.",
  },
};

export default function CovenantStressLab() {
  const { data: { budget, covenants }, ytd } = useLedger();
  const FY26B = { year: 'FY26B', dscr: budget.dscr, cushion: budget.ebitda, ebitda: budget.ebitda, enrollment: budget.enrollmentC1 };
  const [scenario, setScenario] = useState<Scenario>('reasonable');

  const handleScenarioClick = useCallback((s: Scenario) => {
    setScenario(s);
  }, []);

  const chartData = useMemo(() => {
    const projections = PROJECTIONS[scenario];
    const rows = [
      {
        year: FY26B.year,
        dscr: FY26B.dscr,
        cushion: FY26B.cushion,
        ebitda: FY26B.ebitda,
        enrollment: FY26B.enrollment,
      },
      ...projections.map(p => ({
        year: p.year,
        dscr: p.dscr,
        cushion: p.cushion,
        ebitda: p.ebitda,
        enrollment: p.enrollmentC1,
      })),
    ];
    return rows;
  }, [scenario]);

  const insight = AI_INSIGHTS[scenario];

  const isBreach = (year: string, dscr: number) =>
    scenario === 'reasonable' && year === 'FY28' && dscr < 1.0;

  return (
    <div>
      <SectionHeader
        title="Covenant Stress Lab"
        subtitle="Bond covenant compliance and distance-to-danger metrics"
      />

      {/* SECTION 1: Scenario Selector */}
      <div style={{
        display: 'flex',
        gap: 0,
        marginBottom: 24,
      }}>
        {(['optimistic', 'reasonable', 'pessimistic'] as const).map((s, i) => {
          const active = scenario === s;
          const label = s === 'optimistic' ? 'Optimistic' : s === 'reasonable' ? 'Reasonable' : 'Pessimistic';
          return (
            <button
              key={s}
              onClick={() => handleScenarioClick(s)}
              style={{
                padding: '10px 24px',
                fontSize: 14,
                fontFamily: "'Inter', sans-serif",
                fontWeight: active ? 600 : 400,
                color: active ? TEXT.onNavy : TEXT.muted,
                background: active ? NOBLE.navy : BG.card,
                border: `1px solid ${active ? NOBLE.navy : BG.border}`,
                borderRadius: i === 0 ? '8px 0 0 8px' : i === 2 ? '0 8px 8px 0' : 0,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                borderLeft: i > 0 ? 'none' : undefined,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* SECTION 2: DSCR Trajectory Chart */}
      <div style={{
        background: BG.card,
        border: `1px solid ${BG.border}`,
        borderRadius: 12,
        padding: '20px 20px 16px',
        marginBottom: 32,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={chartData} margin={{ top: 12, right: 60, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={BG.border} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="year"
              tick={{ fill: TEXT.muted, fontSize: 12, fontFamily: "'Inter', sans-serif" }}
              axisLine={{ stroke: BG.border }}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: TEXT.muted, fontSize: 11, fontFamily: "'DM Mono', monospace" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => fmtDscr(v)}
              label={{
                value: 'DSCR',
                angle: -90,
                position: 'insideLeft',
                style: { fill: TEXT.muted, fontSize: 11, fontFamily: "'Inter', sans-serif" },
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: TEXT.muted, fontSize: 11, fontFamily: "'DM Mono', monospace" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `$${v.toFixed(0)}M`}
              label={{
                value: 'Cushion $M',
                angle: 90,
                position: 'insideRight',
                style: { fill: TEXT.muted, fontSize: 11, fontFamily: "'Inter', sans-serif" },
              }}
            />
            <Tooltip content={<CovenantTooltip />} />
            <Legend
              align="right"
              verticalAlign="top"
              wrapperStyle={{ fontSize: 12, fontFamily: "'Inter', sans-serif", paddingBottom: 8 }}
            />

            {/* Reference lines */}
            <ReferenceLine
              yAxisId="left"
              y={1.0}
              stroke={STATUS.red}
              strokeDasharray="6 3"
              label={{ value: 'BREACH (1.0x)', fill: STATUS.red, fontSize: 11, position: 'right' }}
            />
            <ReferenceLine
              yAxisId="left"
              y={1.1}
              stroke={STATUS.amber}
              strokeDasharray="6 3"
              label={{ value: 'Bond Doc (1.1x)', fill: STATUS.amber, fontSize: 11, position: 'right' }}
            />

            {/* DSCR bars — colored by status */}
            <Bar yAxisId="left" dataKey="dscr" name="DSCR" barSize={36}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={dscrBarColor(entry.dscr)} fillOpacity={0.85} />
              ))}
            </Bar>

            {/* Cushion line overlay */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cushion"
              name="Cushion ($M)"
              stroke={NOBLE.navy}
              strokeWidth={2}
              dot={{ fill: NOBLE.navy, r: 4, strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* SECTION 3: Covenant Detail Table */}
      <SectionHeader title="Covenant Detail" />
      <div style={{
        background: BG.card,
        border: `1px solid ${BG.border}`,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 32,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
        }}>
          <thead>
            <tr>
              {['Year', 'DSCR', 'Status', 'Cushion ($M)', 'EBITDA ($M)', 'Enrollment'].map(h => (
                <th key={h} style={{
                  padding: '12px 16px',
                  fontSize: 12,
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                  color: TEXT.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  textAlign: h === 'Year' ? 'left' : 'right',
                  borderBottom: `1px solid ${BG.border}`,
                  background: BG.cardHover,
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chartData.map(row => {
              const breach = isBreach(row.year, row.dscr);
              return (
                <tr key={row.year} style={{
                  background: breach ? STATUS.redBg : 'transparent',
                }}>
                  <td style={{
                    padding: '10px 16px',
                    fontSize: 14,
                    fontFamily: "'Inter', sans-serif",
                    color: TEXT.primary,
                    borderBottom: `1px solid ${BG.border}`,
                  }}>
                    {row.year}
                  </td>
                  <td style={{
                    padding: '10px 16px',
                    fontSize: 14,
                    fontFamily: "'DM Mono', monospace",
                    color: TEXT.primary,
                    textAlign: 'right',
                    borderBottom: `1px solid ${BG.border}`,
                  }}>
                    {fmtDscr(row.dscr)}
                  </td>
                  <td style={{
                    padding: '10px 16px',
                    textAlign: 'right',
                    borderBottom: `1px solid ${BG.border}`,
                  }}>
                    <StatusBadge status={dscrStatus(row.dscr)} />
                  </td>
                  <td style={{
                    padding: '10px 16px',
                    fontSize: 14,
                    fontFamily: "'DM Mono', monospace",
                    color: row.cushion < 0 ? STATUS.red : TEXT.primary,
                    textAlign: 'right',
                    borderBottom: `1px solid ${BG.border}`,
                  }}>
                    ${row.cushion.toFixed(1)}
                  </td>
                  <td style={{
                    padding: '10px 16px',
                    fontSize: 14,
                    fontFamily: "'DM Mono', monospace",
                    color: row.ebitda < 0 ? STATUS.red : TEXT.primary,
                    textAlign: 'right',
                    borderBottom: `1px solid ${BG.border}`,
                  }}>
                    ${row.ebitda.toFixed(1)}
                  </td>
                  <td style={{
                    padding: '10px 16px',
                    fontSize: 14,
                    fontFamily: "'DM Mono', monospace",
                    color: TEXT.primary,
                    textAlign: 'right',
                    borderBottom: `1px solid ${BG.border}`,
                  }}>
                    {row.enrollment.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* SECTION 4: "What Would It Take?" Calculator */}
      {scenario === 'reasonable' && <WhatWouldItTake />}

      {/* SECTION 5: AI Insight (dynamic) */}
      <AIInsight severity={insight.severity}>
        {insight.text}
      </AIInsight>

      <AIFinancialAdvisor mode="covenant" compact={true} />
    </div>
  );
}

/* ── "What Would It Take?" calculator ──────────────────────── */

function WhatWouldItTake() {
  const fy28 = PROJECTIONS.reasonable[1]; // FY28
  const mads = 2.8;
  const gapToCompliance = Math.round((1.0 - fy28.dscr) * mads * 10) / 10; // ~$0.8M

  const levers = [
    {
      label: 'Revenue Growth',
      action: `+${(gapToCompliance / fy28.totalRevenue * 100).toFixed(1)}% additional revenue`,
      amount: `+$${gapToCompliance.toFixed(1)}M`,
      detail: 'Equivalent to ~95 additional students at $8,400 PCTC each',
    },
    {
      label: 'Personnel Savings',
      action: `${(gapToCompliance / 165.1 * 100).toFixed(1)}% reduction in personnel costs`,
      amount: `-$${gapToCompliance.toFixed(1)}M`,
      detail: `~${Math.round(gapToCompliance * 1_000_000 / 60000)} positions at avg $60K salary`,
    },
    {
      label: 'L2 Premium Reduction',
      action: 'Reduce L2 premium from $2,000 to ~$1,350',
      amount: `-$${gapToCompliance.toFixed(1)}M`,
      detail: 'Each $500 L2 reduction saves ~$1.5M annually',
    },
    {
      label: 'Health Cost Containment',
      action: 'Limit health growth to ~11% instead of 15%',
      amount: `-$${gapToCompliance.toFixed(1)}M`,
      detail: 'Each 1% health growth reduction saves ~$0.36M',
    },
  ];

  return (
    <>
      <SectionHeader
        title="What Would It Take?"
        subtitle="Minimum changes needed to avoid FY28 covenant breach"
      />
      <div style={{
        background: STATUS.redBg,
        border: `1px solid ${STATUS.red}`,
        borderRadius: 12,
        padding: '16px 20px',
        marginBottom: 16,
      }}>
        <div style={{
          fontSize: 14,
          fontFamily: "'Inter', sans-serif",
          color: TEXT.primary,
          lineHeight: 1.5,
        }}>
          FY28 Reasonable DSCR of{' '}
          <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, color: STATUS.red }}>
            {fmtDscr(fy28.dscr)}
          </span>{' '}
          needs{' '}
          <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, color: NOBLE.navy }}>
            ${gapToCompliance.toFixed(1)}M
          </span>{' '}
          improvement to reach 1.0x. Any <strong>one</strong> of these levers would close the gap:
        </div>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 16,
        marginBottom: 32,
      }}>
        {levers.map(lever => (
          <div key={lever.label} style={{
            background: BG.card,
            border: `1px solid ${BG.border}`,
            borderRadius: 12,
            padding: '20px 24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <div style={{
              fontSize: 13,
              fontFamily: "'Inter', sans-serif",
              color: TEXT.muted,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 8,
            }}>
              {lever.label}
            </div>
            <div style={{
              fontSize: 16,
              fontFamily: "'DM Mono', monospace",
              color: NOBLE.navy,
              fontWeight: 600,
              marginBottom: 4,
            }}>
              {lever.amount}
            </div>
            <div style={{
              fontSize: 14,
              fontFamily: "'Inter', sans-serif",
              color: TEXT.primary,
              marginBottom: 6,
            }}>
              {lever.action}
            </div>
            <div style={{
              fontSize: 12,
              fontFamily: "'Inter', sans-serif",
              color: TEXT.dim,
              fontStyle: 'italic',
            }}>
              {lever.detail}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
