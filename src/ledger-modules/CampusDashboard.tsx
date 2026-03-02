import { useMemo } from 'react';
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { NOBLE, BG, TEXT, STATUS } from '../theme/colors';
import { fmtNum } from '../theme/formatters';
import { CAMPUSES, CAMPUS_STATS } from '../sentinel-data/campuses';
import SectionHeader from '../sentinel-components/SectionHeader';
import KPICard from '../sentinel-components/KPICard';
import AIInsight from '../sentinel-components/AIInsight';
import CustomTooltip from '../sentinel-components/CustomTooltip';

interface CampusDashboardProps {
  campusName: string;
}

export default function CampusDashboard({ campusName }: CampusDashboardProps) {
  const campus = CAMPUSES.find(c => c.name === campusName);
  if (!campus) return <div style={{ color: TEXT.primary, padding: 40 }}>Campus not found.</div>;

  const avg = CAMPUS_STATS.networkAvgPerPupil;
  const delta = campus.deltaFromAvg;
  const retPct = Math.round(campus.retention * 100);
  const convPct = Math.round(campus.conversionRate * 100);

  // Campus health composite
  const healthLabel = useMemo(() => {
    let score = 0;
    if (campus.retention >= 0.93) score += 2; else if (campus.retention >= 0.89) score += 1;
    if (campus.deltaFromAvg <= 0) score += 1;
    if (campus.applications > 1000) score += 1;
    if (score >= 3) return { label: 'Strong', color: STATUS.green };
    if (score >= 2) return { label: 'Watch', color: STATUS.amber };
    return { label: 'At Risk', color: STATUS.red };
  }, [campus]);

  // Comparison chart data
  const comparisonData = useMemo(() => {
    const allRetentions = CAMPUSES.map(c => c.retention);
    const avgRetention = allRetentions.reduce((a, b) => a + b, 0) / allRetentions.length;
    const allApps = CAMPUSES.map(c => c.applications);
    const avgApps = allApps.reduce((a, b) => a + b, 0) / allApps.length;
    const allConv = CAMPUSES.map(c => c.conversionRate);
    const avgConv = allConv.reduce((a, b) => a + b, 0) / allConv.length;

    return [
      { metric: 'Per Pupil $', campus: campus.perPupil, network: avg },
      { metric: 'Retention %', campus: Math.round(campus.retention * 100), network: Math.round(avgRetention * 100) },
      { metric: 'Applications', campus: campus.applications, network: Math.round(avgApps) },
      { metric: 'Conversion %', campus: Math.round(campus.conversionRate * 100), network: Math.round(avgConv * 100) },
    ];
  }, [campus, avg]);

  // AI Insight generation
  const insight = useMemo(() => {
    const studentsPerPct = Math.round(campus.ehh / 100);
    const revenuePerStudent = 10290 * 0.82; // approx PCTC per pupil

    if (campus.retention < 0.89) {
      const lostStudents = Math.round(campus.ehh * (0.89 - campus.retention));
      const lostRevenue = ((lostStudents * revenuePerStudent) / 1_000_000).toFixed(1);
      return {
        severity: 'red' as const,
        text: `${campusName} retention of ${retPct}% is below the network floor of 89%. Each percentage point of retention represents approximately ${studentsPerPct} students and $${((studentsPerPct * revenuePerStudent) / 1_000_000).toFixed(1)}M in PCTC revenue. Closing the gap to 89% would retain ~${lostStudents} students worth ~$${lostRevenue}M.`,
      };
    }

    if (campus.retention >= 0.93 && campus.applications > 1200) {
      return {
        severity: 'green' as const,
        text: `${campusName} shows strong demand signals: ${fmtNum(campus.applications)} applications with ${convPct}% conversion rate and ${retPct}% retention. This campus is well-positioned for stable enrollment.`,
      };
    }

    const direction = delta >= 0 ? 'above' : 'below';
    const mlNote = campus.mlFund > 0
      ? ` This campus receives $${fmtNum(campus.mlFund)}K from the ML Fund to supplement its allocation.`
      : ' This campus does not receive ML Fund supplemental funding.';

    return {
      severity: 'amber' as const,
      text: `${campusName} per-pupil allocation of $${fmtNum(campus.perPupil)} is $${fmtNum(Math.abs(delta))} ${direction} the network average.${mlNote}`,
    };
  }, [campus, campusName, retPct, convPct, delta]);

  return (
    <div>
      {/* SECTION 1 — Campus Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          color: TEXT.primary,
          fontFamily: "'DM Sans', sans-serif",
          margin: 0,
        }}>
          {campusName}
        </h1>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginTop: 6,
        }}>
          <span style={{ fontSize: 14, color: TEXT.muted }}>SY26 Financial Summary</span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '3px 12px',
            borderRadius: 999,
            fontSize: 12,
            fontFamily: "'DM Mono', monospace",
            fontWeight: 500,
            color: healthLabel.color,
            background: healthLabel.color === STATUS.green ? STATUS.greenBg
              : healthLabel.color === STATUS.amber ? STATUS.amberBg
              : STATUS.redBg,
          }}>
            Campus Health: {healthLabel.label}
          </span>
        </div>
      </div>

      {/* SECTION 2 — Campus KPIs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16,
        marginBottom: 32,
      }}>
        <KPICard
          label="Enrollment"
          value={fmtNum(campus.ehh)}
          subtitle="Expected Head/Hours"
          trend="flat"
          trendValue="EHH"
          status="neutral"
        />
        <KPICard
          label="Per-Pupil Budget"
          value={`$${fmtNum(campus.perPupil)}`}
          subtitle={`$${fmtNum(Math.abs(delta))} ${delta >= 0 ? 'above' : 'below'} avg`}
          trend={delta >= 0 ? 'up' : 'down'}
          trendValue={`vs $${fmtNum(avg)} avg`}
          status={delta <= 0 ? 'positive' : 'negative'}
        />
        <KPICard
          label="Retention Rate"
          value={`${retPct}%`}
          trend={campus.retention >= 0.93 ? 'up' : campus.retention >= 0.89 ? 'flat' : 'down'}
          trendValue={campus.retention >= 0.93 ? 'Strong' : campus.retention >= 0.89 ? 'Watch' : 'Below floor'}
          status={campus.retention >= 0.93 ? 'positive' : campus.retention >= 0.89 ? 'neutral' : 'negative'}
        />
        <KPICard
          label="Application Pipeline"
          value={fmtNum(campus.applications)}
          subtitle={`${convPct}% conversion`}
          trend={campus.applications > 1000 ? 'up' : 'flat'}
          trendValue={`${convPct}% conversion`}
          status={campus.applications > 1000 ? 'positive' : 'neutral'}
        />
      </div>

      {/* SECTION 3 — Campus vs Network Comparison */}
      <SectionHeader title="Campus vs Network" subtitle={`${campusName} compared to network averages`} />
      <div style={{
        background: BG.card,
        border: `1px solid ${BG.border}`,
        borderRadius: 12,
        padding: '20px 20px 16px',
        marginBottom: 32,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={comparisonData}
            layout="vertical"
            margin={{ top: 4, right: 40, left: 8, bottom: 0 }}
          >
            <CartesianGrid stroke={BG.border} strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: TEXT.muted, fontSize: 11, fontFamily: "'DM Mono', monospace" }}
              axisLine={{ stroke: BG.border }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="metric"
              width={110}
              tick={{ fill: TEXT.muted, fontSize: 12, fontFamily: "'Inter', sans-serif" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip formatter={(v: number) => fmtNum(v)} />} />
            <Bar dataKey="campus" name={campusName} fill={NOBLE.navy} barSize={14} radius={[0, 4, 4, 0]} />
            <Bar dataKey="network" name="Network Avg" fill={TEXT.dim} barSize={14} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* SECTION 4 — Budget Position */}
      <SectionHeader title="Budget Position" />
      <div style={{
        background: BG.card,
        border: `1px solid ${BG.border}`,
        borderRadius: 12,
        padding: '24px 28px',
        marginBottom: 32,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24,
          marginBottom: 20,
        }}>
          <BudgetItem label="Pre-Tilt Budget" value={`$${fmtNum(campus.preTiltBudget)}K`} />
          <BudgetItem label="Per-Pupil Allocation" value={`$${fmtNum(campus.perPupil)}`} />
          <BudgetItem label="ML Fund" value={campus.mlFund > 0 ? `$${fmtNum(campus.mlFund)}K` : 'Not applicable'} />
        </div>
        <div style={{
          fontSize: 14,
          fontFamily: "'Inter', sans-serif",
          color: TEXT.primary,
          lineHeight: 1.6,
          padding: '12px 16px',
          background: BG.cardHover,
          borderRadius: 8,
        }}>
          You receive{' '}
          <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 500, color: delta >= 0 ? STATUS.red : STATUS.green }}>
            ${fmtNum(Math.abs(delta))}
          </span>{' '}
          {delta >= 0 ? 'above' : 'below'} the network average of{' '}
          <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>
            $10,290
          </span>{' '}
          per pupil.
        </div>
      </div>

      {/* SECTION 5 — Campus AI Insight */}
      <AIInsight severity={insight.severity}>
        {insight.text}
      </AIInsight>
    </div>
  );
}

function BudgetItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: TEXT.muted, fontFamily: "'Inter', sans-serif", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontFamily: "'DM Mono', monospace", fontWeight: 500, color: TEXT.primary }}>
        {value}
      </div>
    </div>
  );
}
