import { useState, useMemo, useCallback } from 'react';
import {
  ComposedChart, Bar, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { NOBLE, BG, TEXT, STATUS } from '../theme/colors';
import { fmt, fmtDscr } from '../theme/formatters';
import { COVENANTS } from '../sentinel-data/fy26';
import SectionHeader from '../sentinel-components/SectionHeader';
import StatusBadge from '../sentinel-components/StatusBadge';
import AIInsight from '../sentinel-components/AIInsight';

/* ── constants ────────────────────────────────────────────── */

const BASE_REVENUE = 246.6;
const BASE_EXPENSES = 235.1;
const BASE_PCTC = 200.0;
const BASE_PERSONNEL = 165.1;
const MADS = COVENANTS.madsPostRefunding;    // 2.8
const DEPRECIATION = COVENANTS.depreciation; // 6.2
const INTEREST = COVENANTS.interestExpense;  // 1.3
const FY26_C1 = 12148;

const YEARS = ['FY27', 'FY28', 'FY29', 'FY30', 'FY31'] as const;

/* ── preset configs ───────────────────────────────────────── */

interface SliderValues {
  pctc: number;
  enrollment: number;
  l2Premium: number;
  health: number;
  vacancy: number;
  contingency: number;
}

const PRESETS: Record<string, SliderValues> = {
  Optimistic: { pctc: 7, enrollment: 12200, l2Premium: 4000, health: 10, vacancy: 4, contingency: 4 },
  Reasonable: { pctc: 5, enrollment: 12100, l2Premium: 2000, health: 12, vacancy: 4, contingency: 2 },
  Stress:     { pctc: 3, enrollment: 11600, l2Premium: 2000, health: 15, vacancy: 4, contingency: 2 },
};

/* ── slider definitions ───────────────────────────────────── */

interface SliderDef {
  key: keyof SliderValues;
  label: string;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
}

const SLIDER_DEFS: SliderDef[] = [
  { key: 'pctc',        label: 'PCTC Annual Growth %',  min: 2,     max: 8,     step: 0.5,  format: v => `${v.toFixed(1)}%` },
  { key: 'enrollment',  label: 'C1 Enrollment',         min: 11500, max: 12500, step: 50,   format: v => v.toLocaleString() },
  { key: 'l2Premium',   label: 'L1→L2 Salary Premium',  min: 1000,  max: 5000,  step: 500,  format: v => `$${v.toLocaleString()}` },
  { key: 'health',      label: 'Health Cost Growth %',   min: 5,     max: 18,    step: 1,    format: v => `${v}%` },
  { key: 'vacancy',     label: 'Vacancy Rate %',         min: 1,     max: 8,     step: 0.5,  format: v => `${v.toFixed(1)}%` },
  { key: 'contingency', label: 'Contingency ($M)',       min: 0,     max: 6,     step: 0.5,  format: v => `$${v.toFixed(1)}M` },
];

/* ── projection row type ──────────────────────────────────── */

interface ProjectionRow {
  year: string;
  totalRevenue: number;
  totalExpenses: number;
  ebitda: number;
  dscr: number;
}

/* ── tooltip ──────────────────────────────────────────────── */

function WarRoomTooltip({ active, payload, label }: {
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
            {entry.name === 'DSCR' ? fmtDscr(entry.value) : fmt(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── helpers ──────────────────────────────────────────────── */

function dscrStatus(dscr: number): 'pass' | 'tight' | 'breach' {
  if (dscr >= 1.1) return 'pass';
  if (dscr >= 1.0) return 'tight';
  return 'breach';
}

function matchesPreset(vals: SliderValues): string | null {
  for (const [name, preset] of Object.entries(PRESETS)) {
    if (
      vals.pctc === preset.pctc &&
      vals.enrollment === preset.enrollment &&
      vals.l2Premium === preset.l2Premium &&
      vals.health === preset.health &&
      vals.vacancy === preset.vacancy &&
      vals.contingency === preset.contingency
    ) return name;
  }
  return null;
}

/* ── component ────────────────────────────────────────────── */

export default function ScenarioWarRoom() {
  const [pctc, setPctc] = useState(5.0);
  const [enrollment, setEnrollment] = useState(12100);
  const [l2Premium, setL2Premium] = useState(2000);
  const [health, setHealth] = useState(12);
  const [vacancy, setVacancy] = useState(4.0);
  const [contingency, setContingency] = useState(2.0);

  const sliderValues: SliderValues = { pctc, enrollment, l2Premium, health, vacancy, contingency };

  const setters: Record<keyof SliderValues, (v: number) => void> = {
    pctc: setPctc,
    enrollment: setEnrollment,
    l2Premium: setL2Premium,
    health: setHealth,
    vacancy: setVacancy,
    contingency: setContingency,
  };

  const applyPreset = useCallback((name: string) => {
    const p = PRESETS[name];
    setPctc(p.pctc);
    setEnrollment(p.enrollment);
    setL2Premium(p.l2Premium);
    setHealth(p.health);
    setVacancy(p.vacancy);
    setContingency(p.contingency);
  }, []);

  /* ── projection engine ────────────────────────────────── */

  const projections = useMemo<ProjectionRow[]>(() => {
    const enrollmentRatio = enrollment / FY26_C1;

    return YEARS.map((year, i) => {
      const exp = i + 1;

      // Revenue
      const pctcRevenue = BASE_PCTC * enrollmentRatio * Math.pow(1 + pctc / 100, exp);
      const otherRevenue = (BASE_REVENUE - BASE_PCTC) * Math.pow(1.03, exp);
      const totalRevenue = pctcRevenue + otherRevenue;

      // Expenses
      const personnelGrowth = Math.pow(1.04, exp);
      const l2Impact = (l2Premium * enrollment * 0.25) / 1_000_000;
      const healthImpact = BASE_PERSONNEL * 0.22 * (Math.pow(1 + health / 100, exp) - 1);
      const vacancySavings = BASE_PERSONNEL * (vacancy / 100 - 0.04) * personnelGrowth;
      const personnelCost = BASE_PERSONNEL * personnelGrowth + l2Impact + healthImpact - vacancySavings;
      const otherExpenses = (BASE_EXPENSES - BASE_PERSONNEL) * Math.pow(1.03, exp);
      const totalExpenses = personnelCost + otherExpenses + contingency;

      const ebitda = totalRevenue - totalExpenses;
      const dscr = (ebitda + DEPRECIATION + INTEREST) / MADS;

      return {
        year,
        totalRevenue: Math.round(totalRevenue * 10) / 10,
        totalExpenses: Math.round(totalExpenses * 10) / 10,
        ebitda: Math.round(ebitda * 10) / 10,
        dscr: Math.round(dscr * 100) / 100,
      };
    });
  }, [pctc, enrollment, l2Premium, health, vacancy, contingency]);

  /* ── covenant compliance check ────────────────────────── */

  const firstBreachYear = useMemo(() => {
    for (const row of projections) {
      if (row.dscr < 1.0) return row.year;
    }
    return null;
  }, [projections]);

  const activePreset = matchesPreset(sliderValues);

  /* ── slider fill percentage for styling ────────────────── */

  const fillPct = (val: number, min: number, max: number) =>
    ((val - min) / (max - min)) * 100;

  return (
    <div>
      <SectionHeader
        title="Scenario War Room"
        subtitle="Interactive slider-driven FY27–FY31 financial projections"
      />

      {/* SECTION 2 — Preset Buttons */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20 }}>
        {Object.keys(PRESETS).map((name, i, arr) => {
          const active = activePreset === name;
          return (
            <button
              key={name}
              onClick={() => applyPreset(name)}
              style={{
                padding: '10px 24px',
                fontSize: 14,
                fontFamily: "'Inter', sans-serif",
                fontWeight: active ? 600 : 400,
                color: active ? TEXT.onNavy : TEXT.muted,
                background: active ? NOBLE.navy : BG.card,
                border: `1px solid ${active ? NOBLE.navy : BG.border}`,
                borderRadius: i === 0 ? '8px 0 0 8px' : i === arr.length - 1 ? '0 8px 8px 0' : 0,
                borderLeft: i > 0 ? 'none' : undefined,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {name}
            </button>
          );
        })}
      </div>

      {/* SECTION 1 — Driver Sliders + SECTION 4 — Compliance Indicator */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 32, alignItems: 'flex-start' }}>
        {/* Sliders grid */}
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
        }}>
          {SLIDER_DEFS.map(def => {
            const val = sliderValues[def.key];
            const pct = fillPct(val, def.min, def.max);
            return (
              <div key={def.key} style={{
                background: BG.card,
                border: `1px solid ${BG.border}`,
                borderRadius: 12,
                padding: '16px 20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: 12,
                }}>
                  <span style={{
                    fontSize: 14,
                    fontFamily: "'Inter', sans-serif",
                    color: TEXT.primary,
                  }}>
                    {def.label}
                  </span>
                  <span style={{
                    fontSize: 16,
                    fontFamily: "'DM Mono', monospace",
                    color: NOBLE.navy,
                    fontWeight: 500,
                  }}>
                    {def.format(val)}
                  </span>
                </div>
                <input
                  type="range"
                  min={def.min}
                  max={def.max}
                  step={def.step}
                  value={val}
                  onChange={e => setters[def.key](parseFloat(e.target.value))}
                  style={{
                    width: '100%',
                    height: 6,
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    background: `linear-gradient(to right, ${NOBLE.navy} 0%, ${NOBLE.navy} ${pct}%, ${BG.border} ${pct}%, ${BG.border} 100%)`,
                    borderRadius: 3,
                    outline: 'none',
                    cursor: 'pointer',
                    accentColor: NOBLE.navy,
                  }}
                />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 4,
                  fontSize: 11,
                  fontFamily: "'DM Mono', monospace",
                  color: TEXT.dim,
                }}>
                  <span>{def.format(def.min)}</span>
                  <span>{def.format(def.max)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Compliance indicator */}
        <div style={{
          minWidth: 220,
          background: BG.card,
          border: `1px solid ${BG.border}`,
          borderRadius: 12,
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: firstBreachYear ? STATUS.redBg : STATUS.greenBg,
            border: `3px solid ${firstBreachYear ? STATUS.red : STATUS.green}`,
            animation: 'breach-pulse 2s ease-in-out infinite',
          }} />
          <div style={{
            fontSize: 14,
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 700,
            color: firstBreachYear ? STATUS.red : STATUS.green,
            textAlign: 'center',
            lineHeight: 1.4,
          }}>
            {firstBreachYear
              ? `COVENANT BREACH IN ${firstBreachYear}`
              : 'ALL COVENANTS PASS'
            }
          </div>
          {firstBreachYear && (
            <div style={{
              fontSize: 12,
              fontFamily: "'DM Mono', monospace",
              color: STATUS.red,
            }}>
              DSCR {fmtDscr(projections.find(r => r.year === firstBreachYear)!.dscr)}
            </div>
          )}
          {!firstBreachYear && (
            <div style={{
              fontSize: 12,
              fontFamily: "'DM Mono', monospace",
              color: STATUS.green,
            }}>
              Min DSCR {fmtDscr(Math.min(...projections.map(r => r.dscr)))}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 5 — Live Charts */}
      <div style={{
        background: BG.card,
        border: `1px solid ${BG.border}`,
        borderRadius: 12,
        padding: '20px 20px 16px',
        marginBottom: 32,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <ResponsiveContainer width="100%" height={380}>
          <ComposedChart data={projections} margin={{ top: 12, right: 60, left: 0, bottom: 0 }}>
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
              tickFormatter={(v: number) => fmt(v)}
              label={{
                value: 'EBITDA ($M)',
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
              tickFormatter={(v: number) => fmtDscr(v)}
              label={{
                value: 'DSCR',
                angle: 90,
                position: 'insideRight',
                style: { fill: TEXT.muted, fontSize: 11, fontFamily: "'Inter', sans-serif" },
              }}
            />
            <Tooltip content={<WarRoomTooltip />} />
            <Legend
              align="right"
              verticalAlign="top"
              wrapperStyle={{ fontSize: 12, fontFamily: "'Inter', sans-serif", paddingBottom: 8 }}
            />

            {/* Reference lines */}
            <ReferenceLine
              yAxisId="left"
              y={0}
              stroke={TEXT.dim}
              strokeDasharray="4 4"
            />
            <ReferenceLine
              yAxisId="right"
              y={1.0}
              stroke={STATUS.red}
              strokeDasharray="6 3"
              label={{ value: 'DSCR 1.0x', fill: STATUS.red, fontSize: 11, position: 'right' }}
            />

            {/* EBITDA bars */}
            <Bar yAxisId="left" dataKey="ebitda" name="EBITDA ($M)" barSize={40}>
              {projections.map((row, index) => (
                <Cell
                  key={index}
                  fill={row.ebitda >= 0 ? STATUS.green : STATUS.red}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>

            {/* DSCR line */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="dscr"
              name="DSCR"
              stroke={NOBLE.navy}
              strokeWidth={2}
              dot={{ fill: NOBLE.navy, r: 4, strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* SECTION 6 — Pro Forma Summary Table */}
      <SectionHeader title="Pro Forma Summary" />
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
              {['Year', 'Revenue ($M)', 'Expenses ($M)', 'EBITDA ($M)', 'DSCR'].map(h => (
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
            {projections.map(row => (
              <tr key={row.year}>
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
                  ${row.totalRevenue.toFixed(1)}
                </td>
                <td style={{
                  padding: '10px 16px',
                  fontSize: 14,
                  fontFamily: "'DM Mono', monospace",
                  color: TEXT.primary,
                  textAlign: 'right',
                  borderBottom: `1px solid ${BG.border}`,
                }}>
                  ${row.totalExpenses.toFixed(1)}
                </td>
                <td style={{
                  padding: '10px 16px',
                  fontSize: 14,
                  fontFamily: "'DM Mono', monospace",
                  color: row.ebitda >= 0 ? STATUS.green : STATUS.red,
                  textAlign: 'right',
                  borderBottom: `1px solid ${BG.border}`,
                }}>
                  ${row.ebitda.toFixed(1)}
                </td>
                <td style={{
                  padding: '10px 16px',
                  textAlign: 'right',
                  borderBottom: `1px solid ${BG.border}`,
                }}>
                  <span style={{ marginRight: 8, fontFamily: "'DM Mono', monospace", fontSize: 14, color: TEXT.primary }}>
                    {fmtDscr(row.dscr)}
                  </span>
                  <StatusBadge status={dscrStatus(row.dscr)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SECTION 7 — Reverse Solver */}
      <ReverseSolver sliderValues={sliderValues} />

      {/* SECTION 8 — AI Insight */}
      <AIInsight severity="amber">
        Key sensitivity: Every 1% of PCTC growth {'\u2248'} $2.0M in revenue. Every $1,000
        in L2 premium {'\u2248'} $1.2M in annual personnel cost. The crossover point where
        assumptions produce positive EBITDA across all years is approximately: PCTC {'\u2265'} 5.5%
        + L2 {'\u2264'} $2,500 + health {'\u2264'} 10%.
      </AIInsight>
    </div>
  );
}

/* ── Reverse Solver ──────────────────────────────────────────── */

function solveForDscr(
  base: SliderValues,
  targetDscr: number,
  yearIdx: number,
): { pctc: number | null; enrollment: number | null; l2Premium: number | null; health: number | null } {
  const solve = (key: keyof SliderValues, _min: number, _max: number, step: number, direction: 'up' | 'down') => {
    const def = SLIDER_DEFS.find(d => d.key === key)!;
    const lo = direction === 'up' ? base[key] : def.min;
    const hi = direction === 'up' ? def.max : base[key];
    let low = lo, high = hi;

    for (let iter = 0; iter < 50; iter++) {
      const mid = Math.round((low + high) / step) * step;
      if (Math.abs(high - low) < step) break;

      const testVals = { ...base, [key]: mid };
      const row = computeProjection(testVals, yearIdx);
      if (row.dscr >= targetDscr) {
        high = mid;
      } else {
        low = mid + step;
      }
    }

    const result = Math.round(high / step) * step;
    if (result < def.min || result > def.max) return null;
    if (direction === 'up' && result <= base[key]) return base[key];
    if (direction === 'down' && result >= base[key]) return base[key];
    return result;
  };

  return {
    pctc: solve('pctc', 2, 8, 0.5, 'up'),
    enrollment: solve('enrollment', 11500, 12500, 50, 'up'),
    l2Premium: solve('l2Premium', 1000, 5000, 500, 'down'),
    health: solve('health', 5, 18, 1, 'down'),
  };
}

function computeProjection(vals: SliderValues, yearIdx: number): ProjectionRow {
  const exp = yearIdx + 1;
  const enrollmentRatio = vals.enrollment / FY26_C1;
  const pctcRevenue = BASE_PCTC * enrollmentRatio * Math.pow(1 + vals.pctc / 100, exp);
  const otherRevenue = (BASE_REVENUE - BASE_PCTC) * Math.pow(1.03, exp);
  const totalRevenue = pctcRevenue + otherRevenue;
  const personnelGrowth = Math.pow(1.04, exp);
  const l2Impact = (vals.l2Premium * vals.enrollment * 0.25) / 1_000_000;
  const healthImpact = BASE_PERSONNEL * 0.22 * (Math.pow(1 + vals.health / 100, exp) - 1);
  const vacancySavings = BASE_PERSONNEL * (vals.vacancy / 100 - 0.04) * personnelGrowth;
  const personnelCost = BASE_PERSONNEL * personnelGrowth + l2Impact + healthImpact - vacancySavings;
  const otherExpenses = (BASE_EXPENSES - BASE_PERSONNEL) * Math.pow(1.03, exp);
  const totalExpenses = personnelCost + otherExpenses + vals.contingency;
  const ebitda = totalRevenue - totalExpenses;
  const dscr = (ebitda + DEPRECIATION + INTEREST) / MADS;
  return {
    year: YEARS[yearIdx],
    totalRevenue: Math.round(totalRevenue * 10) / 10,
    totalExpenses: Math.round(totalExpenses * 10) / 10,
    ebitda: Math.round(ebitda * 10) / 10,
    dscr: Math.round(dscr * 100) / 100,
  };
}

function ReverseSolver({ sliderValues }: { sliderValues: SliderValues }) {
  const [targetDscr, setTargetDscr] = useState(1.0);
  const [targetYear, setTargetYear] = useState(1); // FY28

  const solutions = useMemo(() =>
    solveForDscr(sliderValues, targetDscr, targetYear),
  [sliderValues, targetDscr, targetYear]);

  const currentRow = useMemo(() =>
    computeProjection(sliderValues, targetYear),
  [sliderValues, targetYear]);

  const leverDefs = [
    { key: 'pctc' as const, label: 'Min PCTC Growth', format: (v: number) => `${v.toFixed(1)}%`, current: sliderValues.pctc },
    { key: 'enrollment' as const, label: 'Min Enrollment', format: (v: number) => v.toLocaleString(), current: sliderValues.enrollment },
    { key: 'l2Premium' as const, label: 'Max L2 Premium', format: (v: number) => `$${v.toLocaleString()}`, current: sliderValues.l2Premium },
    { key: 'health' as const, label: 'Max Health Growth', format: (v: number) => `${v}%`, current: sliderValues.health },
  ];

  return (
    <>
      <SectionHeader
        title="Reverse Solver"
        subtitle={`What inputs achieve target DSCR in ${YEARS[targetYear]}?`}
      />
      <div style={{
        background: BG.card,
        border: `1px solid ${BG.border}`,
        borderRadius: 12,
        padding: '20px 24px',
        marginBottom: 32,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        {/* Controls row */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 20, alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: 12, color: TEXT.muted, fontFamily: "'Inter', sans-serif", display: 'block', marginBottom: 4 }}>
              Target DSCR
            </label>
            <input
              type="number"
              value={targetDscr}
              step={0.1}
              min={0.5}
              max={5.0}
              onChange={e => setTargetDscr(parseFloat(e.target.value) || 1.0)}
              style={{
                width: 80,
                padding: '6px 10px',
                border: `1px solid ${BG.border}`,
                borderRadius: 6,
                fontSize: 14,
                fontFamily: "'DM Mono', monospace",
                color: TEXT.primary,
                background: BG.surface,
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: TEXT.muted, fontFamily: "'Inter', sans-serif", display: 'block', marginBottom: 4 }}>
              Target Year
            </label>
            <div style={{ display: 'flex', gap: 0 }}>
              {YEARS.map((y, i) => (
                <button
                  key={y}
                  onClick={() => setTargetYear(i)}
                  style={{
                    padding: '6px 14px',
                    fontSize: 13,
                    fontFamily: "'DM Mono', monospace",
                    fontWeight: targetYear === i ? 600 : 400,
                    color: targetYear === i ? TEXT.onNavy : TEXT.muted,
                    background: targetYear === i ? NOBLE.navy : BG.surface,
                    border: `1px solid ${targetYear === i ? NOBLE.navy : BG.border}`,
                    borderRadius: i === 0 ? '6px 0 0 6px' : i === YEARS.length - 1 ? '0 6px 6px 0' : 0,
                    borderLeft: i > 0 ? 'none' : undefined,
                    cursor: 'pointer',
                  }}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: TEXT.muted, fontFamily: "'Inter', sans-serif" }}>
              Current {YEARS[targetYear]} DSCR
            </div>
            <div style={{
              fontSize: 20,
              fontFamily: "'DM Mono', monospace",
              fontWeight: 700,
              color: currentRow.dscr >= targetDscr ? STATUS.green : STATUS.red,
            }}>
              {fmtDscr(currentRow.dscr)}
            </div>
          </div>
        </div>

        {/* Solutions grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
        }}>
          {leverDefs.map(lever => {
            const solved = solutions[lever.key];
            const achievable = solved !== null;
            const alreadyMet = currentRow.dscr >= targetDscr;
            return (
              <div key={lever.key} style={{
                background: BG.cardHover,
                borderRadius: 8,
                padding: '16px 16px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 12, color: TEXT.muted, fontFamily: "'Inter', sans-serif", marginBottom: 8 }}>
                  {lever.label}
                </div>
                <div style={{
                  fontSize: 20,
                  fontFamily: "'DM Mono', monospace",
                  fontWeight: 700,
                  color: alreadyMet ? STATUS.green : achievable ? NOBLE.navy : STATUS.red,
                  marginBottom: 4,
                }}>
                  {alreadyMet ? lever.format(lever.current)
                   : achievable ? lever.format(solved!)
                   : 'N/A'}
                </div>
                <div style={{ fontSize: 11, color: TEXT.dim, fontFamily: "'Inter', sans-serif" }}>
                  {alreadyMet ? 'Already met' : achievable ? `vs current ${lever.format(lever.current)}` : 'Cannot solve alone'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
