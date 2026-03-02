import { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer, Cell,
} from 'recharts';
import { NOBLE, BG, TEXT, STATUS, CHART } from '../theme/colors';
import { fmtNum } from '../theme/formatters';
import { CAMPUSES, CAMPUS_STATS } from '../sentinel-data/campuses';
import SectionHeader from '../sentinel-components/SectionHeader';
import TabBar from '../sentinel-components/TabBar';
import AIInsight from '../sentinel-components/AIInsight';
import CustomTooltip from '../sentinel-components/CustomTooltip';

type CampusTab = 'Per Pupil $' | 'Enrollment' | 'Δ from Avg' | 'Applications' | 'Retention';

const TABS: string[] = ['Per Pupil $', 'Enrollment', 'Δ from Avg', 'Applications', 'Retention'];

export default function CampusIntelligence() {
  const [activeTab, setActiveTab] = useState<string>('Per Pupil $');
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const tab = activeTab as CampusTab;

  const { sortedData, dataKey, getColor, refLine } = useMemo(() => {
    const sorted = [...CAMPUSES];
    const avg = CAMPUS_STATS.networkAvgPerPupil;

    switch (tab) {
      case 'Per Pupil $':
        sorted.sort((a, b) => b.perPupil - a.perPupil);
        return {
          sortedData: sorted,
          dataKey: 'perPupil' as const,
          getColor: (c: typeof CAMPUSES[0]) =>
            c.perPupil > avg + 400 ? STATUS.red
            : c.perPupil < avg - 400 ? STATUS.green
            : NOBLE.gold,
          refLine: { x: avg, label: `$${fmtNum(avg)} avg` },
        };
      case 'Enrollment':
        sorted.sort((a, b) => b.ehh - a.ehh);
        return {
          sortedData: sorted,
          dataKey: 'ehh' as const,
          getColor: () => CHART.blue,
          refLine: null,
        };
      case 'Δ from Avg':
        sorted.sort((a, b) => a.deltaFromAvg - b.deltaFromAvg);
        return {
          sortedData: sorted,
          dataKey: 'deltaFromAvg' as const,
          getColor: (c: typeof CAMPUSES[0]) =>
            c.deltaFromAvg > 0 ? STATUS.red : STATUS.green,
          refLine: null,
        };
      case 'Applications':
        sorted.sort((a, b) => b.applications - a.applications);
        return {
          sortedData: sorted,
          dataKey: 'applications' as const,
          getColor: () => CHART.blue,
          refLine: null,
        };
      case 'Retention':
        sorted.sort((a, b) => b.retention - a.retention);
        return {
          sortedData: sorted,
          dataKey: 'retention' as const,
          getColor: (c: typeof CAMPUSES[0]) =>
            c.retention >= 0.93 ? STATUS.green
            : c.retention >= 0.89 ? STATUS.amber
            : STATUS.red,
          refLine: null,
        };
      default:
        return {
          sortedData: sorted,
          dataKey: 'perPupil' as const,
          getColor: () => CHART.blue,
          refLine: null,
        };
    }
  }, [tab]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleBarClick = useCallback((data: any) => {
    const name = (data?.name ?? data?.payload?.name) as string | undefined;
    if (name) {
      setSelectedName(prev => prev === name ? null : name);
    }
  }, []);

  const selectedCampus = selectedName
    ? CAMPUSES.find(c => c.name === selectedName) ?? null
    : null;

  const formatValue = useCallback((v: number) => {
    if (tab === 'Retention') return `${(v * 100).toFixed(0)}%`;
    if (tab === 'Δ from Avg') {
      return `${v >= 0 ? '+' : '-'}$${fmtNum(Math.abs(v))}`;
    }
    if (tab === 'Per Pupil $') return `$${fmtNum(v)}`;
    return fmtNum(v);
  }, [tab]);

  return (
    <div>
      <SectionHeader
        title="Campus Intelligence"
        subtitle="17-campus financial comparison and per-pupil analysis"
      />

      {/* SECTION 1: Sort Selector */}
      <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* SECTION 2: Horizontal Bar Chart */}
      <div style={{
        background: BG.card,
        border: `1px solid ${BG.border}`,
        borderRadius: 12,
        padding: '20px 20px 16px',
        marginTop: 24,
        marginBottom: 24,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <ResponsiveContainer width="100%" height={560}>
          <BarChart
            data={sortedData}
            layout="vertical"
            margin={{ top: 4, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid stroke={BG.border} strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: TEXT.muted, fontSize: 11, fontFamily: "'DM Mono', monospace" }}
              axisLine={{ stroke: BG.border }}
              tickLine={false}
              tickFormatter={formatValue}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: TEXT.muted, fontSize: 12, fontFamily: "'Inter', sans-serif" }}
              axisLine={false}
              tickLine={false}
              width={100}
            />
            <Tooltip content={<CustomTooltip formatter={formatValue} />} />
            {refLine && (
              <ReferenceLine
                x={refLine.x}
                stroke={NOBLE.navy}
                strokeDasharray="6 3"
                label={{ value: refLine.label, fill: NOBLE.navy, fontSize: 11, position: 'top' }}
              />
            )}
            <Bar
              dataKey={dataKey}
              radius={[0, 4, 4, 0]}
              cursor="pointer"
              onClick={handleBarClick}
            >
              {sortedData.map((c, i) => (
                <Cell key={i} fill={getColor(c)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* SECTION 3: Campus Detail Panel */}
      {selectedCampus && (
        <div style={{
          background: BG.cardHover,
          borderLeft: `4px solid ${NOBLE.navy}`,
          borderRadius: '0 12px 12px 0',
          padding: '16px 20px',
          marginBottom: 24,
          position: 'relative',
        }}>
          <button
            onClick={() => setSelectedName(null)}
            style={{
              position: 'absolute',
              top: 12,
              right: 16,
              background: 'none',
              border: 'none',
              color: TEXT.muted,
              fontSize: 18,
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            ✕
          </button>
          <h4 style={{
            fontSize: 16,
            fontWeight: 600,
            color: TEXT.primary,
            fontFamily: "'DM Sans', sans-serif",
            margin: '0 0 12px',
          }}>
            {selectedCampus.name}
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '8px 24px',
          }}>
            <DetailItem label="EHH Enrollment" value={fmtNum(selectedCampus.ehh)} />
            <DetailItem label="Pre-Tilt Budget" value={`$${fmtNum(selectedCampus.preTiltBudget)}K`} />
            <DetailItem label="Per Pupil" value={`$${fmtNum(selectedCampus.perPupil)}`} />
            <DetailItem
              label="Δ from Average"
              value={`${selectedCampus.deltaFromAvg >= 0 ? '+' : '-'}$${fmtNum(Math.abs(selectedCampus.deltaFromAvg))}`}
              color={selectedCampus.deltaFromAvg > 0 ? STATUS.red : STATUS.green}
            />
            <DetailItem label="ML Fund" value={selectedCampus.mlFund > 0 ? `$${fmtNum(selectedCampus.mlFund)}K` : '—'} />
            <DetailItem label="Applications" value={fmtNum(selectedCampus.applications)} />
            <DetailItem label="Conversion Rate" value={`${(selectedCampus.conversionRate * 100).toFixed(0)}%`} />
            <DetailItem
              label="Retention Rate"
              value={`${(selectedCampus.retention * 100).toFixed(0)}%`}
              color={
                selectedCampus.retention >= 0.93 ? STATUS.green
                : selectedCampus.retention >= 0.89 ? STATUS.amber
                : STATUS.red
              }
            />
          </div>
        </div>
      )}

      {/* SECTION 4: Per-Pupil Spread Analysis */}
      <SectionHeader title="Per-Pupil Spread Analysis" />
      <div style={{
        background: BG.card,
        border: `1px solid ${BG.border}`,
        borderRadius: 12,
        padding: '24px 20px',
        marginBottom: 32,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <PerPupilSpread />
      </div>

      {/* SECTION 5: AI Insight */}
      <AIInsight severity="amber">
        Three campuses show correlated demand risk: Baker (378 apps, 44%
        conversion, 84% retention — lowest in network), Rowe-Clark (747 apps,
        45% conversion, 88% retention), and DRW (563 apps, 59% conversion, 89%
        retention). Combined: 905 students, ~$9.2M in PCTC revenue. A 10%
        enrollment decline across these three campuses would reduce revenue by
        approximately $920K.
      </AIInsight>
    </div>
  );
}

function DetailItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ padding: '4px 0' }}>
      <div style={{ fontSize: 11, color: TEXT.dim, fontFamily: "'Inter', sans-serif" }}>
        {label}
      </div>
      <div style={{
        fontSize: 15,
        fontFamily: "'DM Mono', monospace",
        fontWeight: 500,
        color: color ?? TEXT.primary,
      }}>
        {value}
      </div>
    </div>
  );
}

function PerPupilSpread() {
  const { lowestPerPupil, highestPerPupil, networkAvgPerPupil, perPupilSpread } = CAMPUS_STATS;
  const low = lowestPerPupil.value;
  const high = highestPerPupil.value;
  const avg = networkAvgPerPupil;
  const range = high - low;
  const avgPct = ((avg - low) / range) * 100;
  const spreadPct = ((perPupilSpread / networkAvgPerPupil) * 100).toFixed(0);

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 12,
        fontFamily: "'Inter', sans-serif",
        color: TEXT.muted,
        marginBottom: 8,
      }}>
        <span>Lowest</span>
        <span>Average</span>
        <span>Highest</span>
      </div>

      {/* Track with markers */}
      <div style={{ position: 'relative', height: 32, margin: '0 0 8px' }}>
        <div style={{
          position: 'absolute',
          top: 14,
          left: 0,
          right: 0,
          height: 4,
          background: BG.border,
          borderRadius: 2,
        }} />
        {/* Low marker */}
        <div style={{ position: 'absolute', left: 0, top: 8 }}>
          <div style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: STATUS.green,
          }} />
        </div>
        {/* Average marker */}
        <div style={{ position: 'absolute', left: `${avgPct}%`, top: 4, transform: 'translateX(-50%)' }}>
          <div style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: NOBLE.gold,
            border: `2px solid ${BG.card}`,
            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
          }} />
        </div>
        {/* High marker */}
        <div style={{ position: 'absolute', right: 0, top: 8 }}>
          <div style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: STATUS.red,
          }} />
        </div>
      </div>

      {/* Value labels */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 13,
        fontFamily: "'DM Mono', monospace",
      }}>
        <span style={{ color: STATUS.green }}>
          {lowestPerPupil.name} ${fmtNum(low)}
        </span>
        <span style={{ color: NOBLE.navy }}>
          ${fmtNum(avg)}
        </span>
        <span style={{ color: STATUS.red }}>
          {highestPerPupil.name} ${fmtNum(high)}
        </span>
      </div>

      <div style={{
        textAlign: 'center',
        marginTop: 12,
        fontSize: 13,
        fontFamily: "'DM Mono', monospace",
        color: TEXT.muted,
      }}>
        Spread: ${fmtNum(perPupilSpread)} ({spreadPct}%)
      </div>
    </div>
  );
}
