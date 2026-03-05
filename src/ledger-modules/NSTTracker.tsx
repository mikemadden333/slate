import { useLedger } from '../ledger-context/LedgerDataContext';
import AIFinancialAdvisor from './AIFinancialAdvisor';
import { useMemo } from 'react';
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell,
} from 'recharts';
import { NOBLE, BG, TEXT, STATUS } from '../theme/colors';
import { fmtNum } from '../theme/formatters';
import { NST_DEPARTMENTS, NST_TOTALS } from '../sentinel-data/nst';
import SectionHeader from '../sentinel-components/SectionHeader';
import KPICard from '../sentinel-components/KPICard';
import AIInsight from '../sentinel-components/AIInsight';

function NSTTooltip({ active, payload, label }: {
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
          <span>${(entry.value / 1000).toFixed(1)}M</span>
        </div>
      ))}
    </div>
  );
}

export default function NSTTracker() {
  const { data: { budget }, ytd } = useLedger();
  const sortedDepts = useMemo(() =>
    [...NST_DEPARTMENTS].sort((a, b) => b.variance - a.variance),
  []);

  const chartHeight = sortedDepts.length * 36 + 60;

  return (
    <div>
      <SectionHeader
        title="NST Spending"
        subtitle="Network Support Team departmental budget variance"
      />

      {/* SECTION 1 — Summary KPIs */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
        <KPICard
          label="NST Actual YTD"
          value="$13.6M"
          trend="down"
          trendValue="+$300K over"
          status="negative"
        />
        <KPICard
          label="NST Budget YTD"
          value="$13.3M"
          trend="flat"
          trendValue="plan"
          status="neutral"
        />
        <KPICard
          label="Variance"
          value="+2.3%"
          trend="down"
          trendValue="$300K over budget"
          status="negative"
        />
      </div>

      {/* SECTION 2 — Department Variance Chart */}
      <SectionHeader title="Department Budget vs. Actual" />
      <div style={{
        background: BG.card,
        border: `1px solid ${BG.border}`,
        borderRadius: 12,
        padding: '20px 20px 16px',
        marginBottom: 32,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={sortedDepts}
            layout="vertical"
            margin={{ top: 8, right: 100, left: 8, bottom: 0 }}
          >
            <CartesianGrid stroke={BG.border} strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: TEXT.muted, fontSize: 11, fontFamily: "'DM Mono', monospace" }}
              axisLine={{ stroke: BG.border }}
              tickLine={false}
              tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}M`}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={180}
              tick={{ fill: TEXT.muted, fontSize: 12, fontFamily: "'Inter', sans-serif" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<NSTTooltip />} />
            <Legend
              align="right"
              verticalAlign="top"
              wrapperStyle={{ fontSize: 12, fontFamily: "'Inter', sans-serif", paddingBottom: 8 }}
            />
            <Bar dataKey="actual" name="Actual" barSize={10} radius={[0, 3, 3, 0]}>
              {sortedDepts.map((_, i) => (
                <Cell key={i} fill={NOBLE.navy} />
              ))}
            </Bar>
            <Bar dataKey="budget" name="Budget" barSize={10} radius={[0, 3, 3, 0]}>
              {sortedDepts.map((_, i) => (
                <Cell key={i} fill={TEXT.dim} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Variance labels overlay — rendered as a list below chart for clarity */}
        <div style={{ marginTop: 8 }}>
          {sortedDepts.map(dept => (
            <div key={dept.name} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '3px 12px',
              background: dept.variance > 0
                ? STATUS.redBg
                : dept.variance < 0
                ? STATUS.greenBg
                : 'transparent',
              borderRadius: 4,
              marginBottom: 1,
            }}>
              <span style={{
                fontSize: 12,
                fontFamily: "'Inter', sans-serif",
                color: TEXT.muted,
              }}>
                {dept.name}
              </span>
              <span style={{
                fontSize: 12,
                fontFamily: "'DM Mono', monospace",
                color: dept.variance > 0 ? STATUS.red : dept.variance < 0 ? STATUS.green : TEXT.muted,
                fontWeight: 500,
              }}>
                {dept.variance > 0 ? '+' : ''}{dept.variance === 0 ? '--' : `$${Math.abs(dept.variance)}K`}
                {dept.variance !== 0 && (
                  <span style={{ color: TEXT.dim, marginLeft: 6 }}>
                    ({dept.variance > 0 ? '+' : ''}{((dept.variance / dept.budget) * 100).toFixed(0)}%)
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3 — Top Overruns and Offsets */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
        marginBottom: 32,
      }}>
        {/* Largest Overruns */}
        <div style={{
          background: BG.card,
          border: `1px solid ${BG.border}`,
          borderLeft: `3px solid ${STATUS.red}`,
          borderRadius: '0 12px 12px 0',
          padding: '16px 20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <h4 style={{
            fontSize: 14,
            fontWeight: 600,
            color: STATUS.red,
            fontFamily: "'DM Sans', sans-serif",
            margin: '0 0 12px',
          }}>
            Largest Overruns
          </h4>
          {[
            { name: 'Academic', amount: '+$457K', pct: '+40%' },
            { name: 'Health, Fitness, Athletics', amount: '+$237K', pct: '+43%' },
            { name: 'Facilities', amount: '+$135K', pct: '+24%' },
          ].map(item => (
            <div key={item.name} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 0',
              borderBottom: `1px solid ${BG.border}`,
            }}>
              <span style={{ fontSize: 13, color: TEXT.primary, fontFamily: "'Inter', sans-serif" }}>
                {item.name}
              </span>
              <div>
                <span style={{ fontSize: 13, fontFamily: "'DM Mono', monospace", color: STATUS.red }}>
                  {item.amount}
                </span>
                <span style={{ fontSize: 12, color: TEXT.muted, marginLeft: 6 }}>
                  ({item.pct})
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Largest Offsets */}
        <div style={{
          background: BG.card,
          border: `1px solid ${BG.border}`,
          borderLeft: `3px solid ${STATUS.green}`,
          borderRadius: '0 12px 12px 0',
          padding: '16px 20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <h4 style={{
            fontSize: 14,
            fontWeight: 600,
            color: STATUS.green,
            fontFamily: "'DM Sans', sans-serif",
            margin: '0 0 12px',
          }}>
            Largest Offsets
          </h4>
          {[
            { name: 'Education Team', amount: '-$173K', pct: '-24%' },
            { name: 'IT', amount: '-$129K', pct: '-8%' },
            { name: 'Legal', amount: '-$80K', pct: '-12%' },
          ].map(item => (
            <div key={item.name} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 0',
              borderBottom: `1px solid ${BG.border}`,
            }}>
              <span style={{ fontSize: 13, color: TEXT.primary, fontFamily: "'Inter', sans-serif" }}>
                {item.name}
              </span>
              <div>
                <span style={{ fontSize: 13, fontFamily: "'DM Mono', monospace", color: STATUS.green }}>
                  {item.amount}
                </span>
                <span style={{ fontSize: 12, color: TEXT.muted, marginLeft: 6 }}>
                  ({item.pct})
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4 — Burn Rate Projection */}
      <BurnRateProjection />

      {/* SECTION 5 — AI Insight */}
      <AIInsight severity="amber">
        9 of 19 NST departments are over budget through January. The three largest
        overruns — Academic (+$457K, 40% over), Health/Fitness/Athletics (+$237K, 43%
        over), and Facilities (+$135K, 24% over) — total $829K. These are partially
        offset by underspends in Education Team (-$173K), IT (-$129K), and Legal
        (-$80K), totaling $382K in savings. Net NST variance: $300K over budget (2.3%).
      </AIInsight>

      <AIFinancialAdvisor mode="freeform" compact={true} />
    </div>
  );
}

/* ── Burn Rate Projection ──────────────────────────────────── */

function BurnRateProjection() {
  const MONTHS_ELAPSED = 7; // Through January

  const burnData = useMemo(() => {
    return NST_DEPARTMENTS.map(dept => {
      const monthlyRunRate = Math.round(dept.actual / MONTHS_ELAPSED);
      const projectedFullYear = monthlyRunRate * 12;
      const annualBudget = Math.round(dept.budget / MONTHS_ELAPSED * 12);
      const projVarianceFromAnnual = projectedFullYear - annualBudget;
      return {
        name: dept.name,
        monthlyRate: monthlyRunRate,
        projectedFY: projectedFullYear,
        annualBudget,
        projVariance: projVarianceFromAnnual,
        projVariancePct: annualBudget > 0 ? Math.round(projVarianceFromAnnual / annualBudget * 100) : 0,
      };
    }).sort((a, b) => b.projVariance - a.projVariance);
  }, []);

  const totalMonthlyRate = Math.round(NST_TOTALS.actual / MONTHS_ELAPSED);
  const totalProjectedFY = totalMonthlyRate * 12;
  const totalAnnualBudget = Math.round(NST_TOTALS.budget / MONTHS_ELAPSED * 12);
  const totalProjVariance = totalProjectedFY - totalAnnualBudget;

  return (
    <>
      <SectionHeader
        title="Burn Rate Projection"
        subtitle="Current monthly run rate extrapolated to full fiscal year"
      />
      <div style={{
        background: BG.card,
        border: `1px solid ${BG.border}`,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 32,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Department', 'Monthly Rate', 'Projected FY', 'Annual Budget', 'Proj. Variance'].map((h, i) => (
                <th key={h} style={{
                  padding: '12px 16px',
                  fontSize: 12,
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                  color: TEXT.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  textAlign: i === 0 ? 'left' : 'right',
                  borderBottom: `1px solid ${BG.border}`,
                  background: BG.cardHover,
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {burnData.slice(0, 10).map(row => (
              <tr key={row.name}>
                <td style={{
                  padding: '8px 16px',
                  fontSize: 13,
                  fontFamily: "'Inter', sans-serif",
                  color: TEXT.primary,
                  borderBottom: `1px solid ${BG.border}`,
                }}>
                  {row.name}
                </td>
                <td style={{
                  padding: '8px 16px',
                  fontSize: 13,
                  fontFamily: "'DM Mono', monospace",
                  color: TEXT.primary,
                  textAlign: 'right',
                  borderBottom: `1px solid ${BG.border}`,
                }}>
                  ${fmtNum(row.monthlyRate)}K
                </td>
                <td style={{
                  padding: '8px 16px',
                  fontSize: 13,
                  fontFamily: "'DM Mono', monospace",
                  color: TEXT.primary,
                  textAlign: 'right',
                  borderBottom: `1px solid ${BG.border}`,
                }}>
                  ${fmtNum(row.projectedFY)}K
                </td>
                <td style={{
                  padding: '8px 16px',
                  fontSize: 13,
                  fontFamily: "'DM Mono', monospace",
                  color: TEXT.muted,
                  textAlign: 'right',
                  borderBottom: `1px solid ${BG.border}`,
                }}>
                  ${fmtNum(row.annualBudget)}K
                </td>
                <td style={{
                  padding: '8px 16px',
                  fontSize: 13,
                  fontFamily: "'DM Mono', monospace",
                  fontWeight: 500,
                  color: row.projVariance > 0 ? STATUS.red : row.projVariance < 0 ? STATUS.green : TEXT.muted,
                  textAlign: 'right',
                  borderBottom: `1px solid ${BG.border}`,
                }}>
                  {row.projVariance > 0 ? '+' : ''}{row.projVariance === 0 ? '--' : `$${fmtNum(Math.abs(row.projVariance))}K`}
                  {row.projVariance !== 0 && (
                    <span style={{ color: TEXT.dim, marginLeft: 4 }}>
                      ({row.projVariancePct > 0 ? '+' : ''}{row.projVariancePct}%)
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {/* Total row */}
            <tr style={{ background: BG.cardHover }}>
              <td style={{
                padding: '10px 16px',
                fontSize: 13,
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 700,
                color: TEXT.primary,
                borderTop: `2px solid ${BG.border}`,
              }}>
                TOTAL NST
              </td>
              <td style={{
                padding: '10px 16px',
                fontSize: 13,
                fontFamily: "'DM Mono', monospace",
                fontWeight: 700,
                color: TEXT.primary,
                textAlign: 'right',
                borderTop: `2px solid ${BG.border}`,
              }}>
                ${fmtNum(totalMonthlyRate)}K
              </td>
              <td style={{
                padding: '10px 16px',
                fontSize: 13,
                fontFamily: "'DM Mono', monospace",
                fontWeight: 700,
                color: TEXT.primary,
                textAlign: 'right',
                borderTop: `2px solid ${BG.border}`,
              }}>
                ${fmtNum(totalProjectedFY)}K
              </td>
              <td style={{
                padding: '10px 16px',
                fontSize: 13,
                fontFamily: "'DM Mono', monospace",
                fontWeight: 700,
                color: TEXT.muted,
                textAlign: 'right',
                borderTop: `2px solid ${BG.border}`,
              }}>
                ${fmtNum(totalAnnualBudget)}K
              </td>
              <td style={{
                padding: '10px 16px',
                fontSize: 13,
                fontFamily: "'DM Mono', monospace",
                fontWeight: 700,
                color: totalProjVariance > 0 ? STATUS.red : STATUS.green,
                textAlign: 'right',
                borderTop: `2px solid ${BG.border}`,
              }}>
                {totalProjVariance > 0 ? '+' : ''}${fmtNum(Math.abs(totalProjVariance))}K
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
