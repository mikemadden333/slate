import { useLedger } from '../ledger-context/LedgerDataContext';
import AIFinancialAdvisor from './AIFinancialAdvisor';
import { useMemo } from 'react';
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import { NOBLE, BG, TEXT, STATUS } from '../theme/colors';
import { fmtNum } from '../theme/formatters';
import { ENROLLMENT_SCENARIOS, ENROLLMENT_SPREAD } from '../sentinel-data/enrollment';
import SectionHeader from '../sentinel-components/SectionHeader';
import AIInsight from '../sentinel-components/AIInsight';

function EnrollmentTooltip({ active, payload, label }: {
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
          <span>{fmtNum(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function EnrollmentObservatory() {
  const { data: { budget, historical } } = useLedger();
  const chartData = useMemo(() => {
    const opt = ENROLLMENT_SCENARIOS.optimistic.projections;
    const prob = ENROLLMENT_SCENARIOS.probable.projections;
    const pess = ENROLLMENT_SCENARIOS.pessimistic.projections;

    return opt.map((_, i) => ({
      year: opt[i].year,
      optimistic: opt[i].total,
      probable: prob[i].total,
      pessimistic: pess[i].total,
    }));
  }, []);

  const sy27 = ENROLLMENT_SCENARIOS.probable.projections[1];

  const gradeCards = [
    { grade: 9, value: '3,200', subtitle: 'Incoming cohort target (flat)', raw: sy27.g9 },
    { grade: 10, value: '3,073', subtitle: '98% retention from 9th', raw: sy27.g10 },
    { grade: 11, value: '3,022', subtitle: '98% retention waterfall', raw: sy27.g11 },
    { grade: 12, value: '2,835', subtitle: 'Graduation cohort', raw: sy27.g12 },
  ];

  return (
    <div>
      <SectionHeader
        title="Enrollment Observatory"
        subtitle="Enrollment scenarios and CPS market share projections"
      />

      {/* SECTION 1: Enrollment Fan Chart */}
      <div style={{
        background: BG.card,
        border: `1px solid ${BG.border}`,
        borderRadius: 12,
        padding: '20px 20px 16px',
        marginBottom: 32,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={chartData} margin={{ top: 12, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={BG.border} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="year"
              tick={{ fill: TEXT.muted, fontSize: 12, fontFamily: "'Inter', sans-serif" }}
              axisLine={{ stroke: BG.border }}
              tickLine={false}
            />
            <YAxis
              domain={[11200, 12400]}
              tick={{ fill: TEXT.muted, fontSize: 11, fontFamily: "'DM Mono', monospace" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => fmtNum(v)}
            />
            <Tooltip content={<EnrollmentTooltip />} />
            <Legend
              align="right"
              verticalAlign="top"
              wrapperStyle={{ fontSize: 12, fontFamily: "'Inter', sans-serif", paddingBottom: 8 }}
              formatter={(value: string) =>
                value === 'probable' ? 'Probable with 3,200 (Adopted Model)' : value.charAt(0).toUpperCase() + value.slice(1)
              }
            />

            {/* Optimistic area */}
            <Area
              type="monotone"
              dataKey="optimistic"
              name="optimistic"
              fill={STATUS.green}
              fillOpacity={0.12}
              stroke={STATUS.green}
              strokeWidth={1.5}
              dot={false}
            />

            {/* Probable area — adopted model, thicker */}
            <Area
              type="monotone"
              dataKey="probable"
              name="probable"
              fill={NOBLE.gold}
              fillOpacity={0.15}
              stroke={STATUS.amber}
              strokeWidth={2.5}
              dot={{ fill: STATUS.amber, r: 3, strokeWidth: 0 }}
            />

            {/* Pessimistic area */}
            <Area
              type="monotone"
              dataKey="pessimistic"
              name="pessimistic"
              fill={STATUS.red}
              fillOpacity={0.12}
              stroke={STATUS.red}
              strokeWidth={1.5}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* SECTION 2: Grade-Level Cohort Cards */}
      <SectionHeader title="Grade-Level Cohort Projections" subtitle="SY27 Probable scenario breakdown" />
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16,
        marginBottom: 32,
      }}>
        {gradeCards.map(card => (
          <div key={card.grade} style={{
            background: BG.card,
            border: `1px solid ${BG.border}`,
            borderRadius: 12,
            padding: '20px 24px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            {/* Large grade indicator behind the value */}
            <div style={{
              position: 'absolute',
              right: 16,
              top: 8,
              fontSize: 72,
              fontWeight: 800,
              color: NOBLE.navy,
              opacity: 0.06,
              fontFamily: "'DM Sans', sans-serif",
              lineHeight: 1,
              userSelect: 'none',
            }}>
              {card.grade}
            </div>
            <div style={{
              fontSize: 12,
              fontFamily: "'Inter', sans-serif",
              color: TEXT.muted,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 8,
            }}>
              {card.grade}th Grade
            </div>
            <div style={{
              fontSize: 24,
              fontFamily: "'DM Mono', monospace",
              color: TEXT.primary,
              fontWeight: 500,
              marginBottom: 4,
              position: 'relative',
            }}>
              {card.value}
            </div>
            <div style={{
              fontSize: 13,
              color: TEXT.dim,
              fontFamily: "'Inter', sans-serif",
            }}>
              {card.subtitle}
            </div>
          </div>
        ))}
      </div>

      {/* SECTION 3: Spread Analysis */}
      <div style={{
        background: BG.card,
        border: `1px solid ${BG.border}`,
        borderRadius: 12,
        padding: '20px 24px',
        marginBottom: 32,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{
          fontSize: 15,
          fontFamily: "'Inter', sans-serif",
          color: TEXT.primary,
          fontWeight: 500,
          marginBottom: 16,
          lineHeight: 1.5,
        }}>
          By SY31: <span style={{ fontFamily: "'DM Mono', monospace", color: NOBLE.navy }}>
            {fmtNum(ENROLLMENT_SPREAD.bySY31)}
          </span> student spread between scenarios = <span style={{ fontFamily: "'DM Mono', monospace", color: NOBLE.navy }}>
            ~${ENROLLMENT_SPREAD.revenueImpact}M
          </span> PCTC revenue difference
        </div>
        <div style={{
          display: 'flex',
          gap: 32,
          justifyContent: 'center',
        }}>
          {[
            { label: 'Optimistic', value: fmtNum(12140), color: STATUS.green },
            { label: 'Probable', value: fmtNum(12106), color: STATUS.amber },
            { label: 'Pessimistic', value: fmtNum(11518), color: STATUS.red },
          ].map(item => (
            <div key={item.label} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: 12,
                fontFamily: "'Inter', sans-serif",
                color: item.color,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 4,
              }}>
                {item.label}
              </div>
              <div style={{
                fontSize: 22,
                fontFamily: "'DM Mono', monospace",
                color: TEXT.primary,
                fontWeight: 500,
              }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4: Revenue-at-Risk Sensitivity Table */}
      <SectionHeader title="Revenue-at-Risk" subtitle="Impact of enrollment decline on PCTC revenue" />
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
              {['Enrollment Decline', 'Students Lost', 'Revenue Impact', 'Equivalent'].map(h => (
                <th key={h} style={{
                  padding: '12px 16px',
                  fontSize: 12,
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                  color: TEXT.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  textAlign: h === 'Enrollment Decline' ? 'left' : 'right',
                  borderBottom: `1px solid ${BG.border}`,
                  background: BG.cardHover,
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { pct: 1, label: '1%' },
              { pct: 3, label: '3%' },
              { pct: 5, label: '5%' },
              { pct: 10, label: '10%' },
            ].map(row => {
              const baseEnrollment = 12131;
              const pctcPerPupil = 16580;
              const studentsLost = Math.round(baseEnrollment * row.pct / 100);
              const revenueLost = (studentsLost * pctcPerPupil) / 1_000_000;
              const isAlert = row.pct >= 10;
              return (
                <tr key={row.pct} style={{
                  background: isAlert ? STATUS.redBg : 'transparent',
                }}>
                  <td style={{
                    padding: '10px 16px',
                    fontSize: 14,
                    fontFamily: "'Inter', sans-serif",
                    color: TEXT.primary,
                    fontWeight: isAlert ? 600 : 400,
                    borderBottom: `1px solid ${BG.border}`,
                  }}>
                    -{row.label}
                  </td>
                  <td style={{
                    padding: '10px 16px',
                    fontSize: 14,
                    fontFamily: "'DM Mono', monospace",
                    color: TEXT.primary,
                    textAlign: 'right',
                    borderBottom: `1px solid ${BG.border}`,
                  }}>
                    -{fmtNum(studentsLost)}
                  </td>
                  <td style={{
                    padding: '10px 16px',
                    fontSize: 14,
                    fontFamily: "'DM Mono', monospace",
                    color: isAlert ? STATUS.red : TEXT.primary,
                    fontWeight: isAlert ? 600 : 400,
                    textAlign: 'right',
                    borderBottom: `1px solid ${BG.border}`,
                  }}>
                    -${revenueLost.toFixed(1)}M
                  </td>
                  <td style={{
                    padding: '10px 16px',
                    fontSize: 13,
                    fontFamily: "'Inter', sans-serif",
                    color: TEXT.dim,
                    textAlign: 'right',
                    borderBottom: `1px solid ${BG.border}`,
                  }}>
                    {studentsLost < 350 ? `~${Math.round(studentsLost / 30)} classrooms` :
                     studentsLost < 700 ? '~1 small campus' :
                     `~${Math.round(studentsLost / 670)} campuses`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* SECTION 5: AI Insight */}
      <AIInsight severity="amber">
        The 'Probable with 3,200' model (the adopted enrollment plan) targets a flat 3,200 incoming
        9th graders annually. With 98% net retention across grades, total enrollment stabilizes near
        12,100 through SY31. The spread between optimistic and pessimistic widens to 622 students by
        SY31, representing approximately $10.3M in PCTC revenue — roughly equivalent to one full campus.
      </AIInsight>

      <AIFinancialAdvisor mode="enrollment" compact={true} />
    </div>
  );
}
