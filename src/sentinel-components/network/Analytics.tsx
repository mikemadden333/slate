/**
 * Intelligence — Network intelligence dashboard with 5 interconnected visualizations.
 *
 * 1. 7×24 heat map grid (when does violence happen)
 * 2. Ranked table with score bars (which campuses most affected)
 * 3. Multi-line score distribution chart
 * 4. Horizontal bar chart by community area
 * 5. Gantt-style contagion timeline (90 days)
 */

import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line,
} from 'recharts';
import type { CampusRisk, Incident, ContagionZone } from '../../sentinel-engine/types';
import { CAMPUSES } from '../../sentinel-data/campuses';
import { RISK_COLORS } from '../../sentinel-data/weights';
import { ageInHours, haversine } from '../../sentinel-engine/geo';
import { Brain } from 'lucide-react';
import Explainer from '../shared/Explainer';

interface Props {
  risks: CampusRisk[];
  incidents: Incident[];
  zones: ContagionZone[];
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function Intelligence({ risks, incidents, zones }: Props) {
  // --- 1. Heat map data: 7 days × 24 hours ---
  const heatData = useMemo(() => {
    const grid: number[][] = DAYS.map(() => Array(24).fill(0) as number[]);
    for (const inc of incidents) {
      const d = new Date(inc.date);
      const day = d.getDay();
      const hour = d.getHours();
      grid[day][hour]++;
    }
    return grid;
  }, [incidents]);

  const heatMax = useMemo(() => Math.max(1, ...heatData.flat()), [heatData]);

  // --- 2. Campus ranking ---
  const rankedCampuses = useMemo(() => {
    return [...risks].sort((a, b) => b.score - a.score).map(r => {
      const campus = CAMPUSES.find(c => c.id === r.campusId)!;
      return { ...r, campus };
    });
  }, [risks]);

  // --- 3. Community area incident counts ---
  const communityData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const inc of incidents) {
      if (ageInHours(inc.date) > 720) continue;
      for (const c of CAMPUSES) {
        if (haversine(c.lat, c.lng, inc.lat, inc.lng) <= 1.0) {
          counts.set(c.communityArea, (counts.get(c.communityArea) ?? 0) + 1);
          break;
        }
      }
    }
    return Array.from(counts.entries())
      .map(([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [incidents]);

  // --- 4. Contagion timeline ---
  const timelineData = useMemo(() => {
    return zones
      .filter(z => z.ageH <= 2160) // 90 days
      .sort((a, b) => new Date(b.homicideDate).getTime() - new Date(a.homicideDate).getTime())
      .slice(0, 15)
      .map(z => {
        const start = new Date(z.homicideDate);
        const daysAgo = Math.round(z.ageH / 24);
        return {
          id: z.incidentId,
          block: z.block || 'Unknown',
          phase: z.phase,
          daysAgo,
          daysLeft: z.daysLeft,
          startDate: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          retWin: z.retWin,
        };
      });
  }, [zones]);

  // --- Auto-generated insights ---
  const insights = useMemo(() => {
    const lines: string[] = [];
    const critical = risks.filter(r => r.label === 'CRITICAL').length;
    const high = risks.filter(r => r.label === 'HIGH').length;
    const low = risks.filter(r => r.label === 'LOW').length;
    const acuteZones = zones.filter(z => z.phase === 'ACUTE').length;

    if (low === 18) {
      lines.push('All 17 campuses are at LOW risk. No contagion-level events detected across the network.');
    } else {
      if (critical > 0) lines.push(`${critical} campus${critical > 1 ? 'es' : ''} at CRITICAL risk — active retaliation window${critical > 1 ? 's' : ''}.`);
      if (high > 0) lines.push(`${high} campus${high > 1 ? 'es' : ''} at HIGH risk — recent homicide${high > 1 ? 's' : ''} within 1 mile.`);
      if (acuteZones > 0) lines.push(`${acuteZones} ACUTE contagion zone${acuteZones > 1 ? 's' : ''} active across the network.`);
    }

    // Peak hours from heat map
    let peakHour = 0, peakCount = 0;
    for (let h = 0; h < 24; h++) {
      const total = DAYS.reduce((sum, _, d) => sum + heatData[d][h], 0);
      if (total > peakCount) { peakCount = total; peakHour = h; }
    }
    const amPm = peakHour >= 12 ? 'PM' : 'AM';
    const h12 = peakHour === 0 ? 12 : peakHour > 12 ? peakHour - 12 : peakHour;
    lines.push(`Peak incident hour: ${h12}:00 ${amPm} (${peakCount} incidents in the last 30 days).`);

    if (communityData.length > 0) {
      lines.push(`Highest incident density: ${communityData[0].area} (${communityData[0].count} incidents within 1mi of campus).`);
    }

    return lines;
  }, [risks, zones, heatData, communityData]);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Brain size={22} style={{ color: '#121315' }} />
          <span style={{ fontSize: 22, fontWeight: 800, color: '#121315' }}>Network Intelligence</span>
          <Explainer title="Intelligence Dashboard">
            <p style={{ margin: '0 0 12px' }}>This dashboard provides five interconnected views of network safety data, auto-generated from real-time incident feeds and the Papachristos contagion model.</p>
            <p style={{ margin: 0 }}>Insights at the top are generated automatically from the current data. All visualizations update every 90 seconds.</p>
          </Explainer>
        </div>

        {/* Auto-generated insights */}
        <div style={{
          padding: '14px 18px', background: '#F7F5F1', borderRadius: 10,
          borderLeft: '4px solid #121315',
        }}>
          {insights.map((line, i) => (
            <div key={i} style={{
              fontSize: 14, color: '#121315', lineHeight: 1.6,
              fontWeight: i === 0 ? 600 : 400,
            }}>
              {line}
            </div>
          ))}
        </div>
      </div>

      {/* 1. Heat Map */}
      <Section title="When Does Violence Happen?" subtitle="7×24 heat map — 30-day incident data">
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto repeat(24, 1fr)', gap: 2, minWidth: 600 }}>
            {/* Hour headers */}
            <div style={{ width: 40 }} />
            {HOURS.map(h => (
              <div key={h} style={{
                fontSize: 9, color: '#9CA3AF', textAlign: 'center',
                fontFamily: "'SF Mono', monospace",
              }}>
                {h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`}
              </div>
            ))}

            {/* Grid rows */}
            {DAYS.map((day, dayIdx) => (
              <HeatRow key={day} day={day} dayIdx={dayIdx} heatData={heatData} heatMax={heatMax} />
            ))}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 10, color: '#6B7280' }}>
            <span>Less</span>
            {['#F3F4F6', '#FEF3C7', '#FDE68A', '#F59E0B', '#D45B4F'].map(c => (
              <div key={c} style={{ width: 14, height: 14, borderRadius: 2, background: c }} />
            ))}
            <span>More</span>
          </div>
        </div>
      </Section>

      {/* 2. Campus Risk Ranking */}
      <Section title="Campus Risk Ranking" subtitle="All 17 campuses ranked by current risk score">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {rankedCampuses.map((r, idx) => {
            const colors = RISK_COLORS[r.label];
            const barWidth = Math.max(3, r.score);
            return (
              <div key={r.campusId} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', borderRadius: 8,
                background: idx === 0 ? colors.bg : '#fff',
                border: `1px solid ${idx < 3 ? colors.color + '30' : '#E5E7EB'}`,
              }}>
                <span style={{
                  fontFamily: "'SF Mono', monospace", fontSize: 20, fontWeight: 800,
                  color: colors.color, width: 36, textAlign: 'right', flexShrink: 0,
                }}>
                  {r.score}
                </span>
                <span style={{
                  fontSize: 9, fontWeight: 700, color: '#fff', background: colors.color,
                  padding: '2px 6px', borderRadius: 3, flexShrink: 0,
                }}>
                  {r.label}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#121315' }}>{r.campus.short}</div>
                  <div style={{ height: 4, background: '#F3F4F6', borderRadius: 2, marginTop: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${barWidth}%`,
                      background: colors.color, borderRadius: 2,
                    }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                  {r.inRetaliationWindow && <Badge label="RET" color="#D45B4F" />}
                  {r.contagionZones.some(z => z.phase === 'ACUTE') && <Badge label="ACUTE" color="#C66C3D" />}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* 3. Community Area Incident Density */}
      <Section title="Incident Density by Community Area" subtitle="30-day incidents within 1 mile of campuses">
        {communityData.length > 0 ? (
          <div style={{ height: Math.max(200, communityData.length * 36) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={communityData} layout="vertical" margin={{ left: 100, right: 16 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="area" tick={{ fontSize: 11 }} width={95} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const d = payload[0].payload as (typeof communityData)[number];
                    return (
                      <div style={{
                        background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6,
                        padding: '6px 10px', fontSize: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      }}>
                        <strong>{d.area}</strong>: {d.count} incidents
                      </div>
                    );
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {communityData.map((_, idx) => (
                    <Cell key={idx} fill={idx === 0 ? '#D45B4F' : idx < 3 ? '#C66C3D' : '#3B82F6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ padding: 20, textAlign: 'center', color: '#9CA3AF' }}>No data available</div>
        )}
      </Section>

      {/* 4. Score Distribution */}
      <Section title="Score Distribution" subtitle="Current score spread across the network">
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={rankedCampuses.map(r => ({
                name: r.campus.short,
                score: r.score,
                base: r.base,
                acute: r.acute,
              }))}
              margin={{ left: 10, right: 10, top: 5, bottom: 5 }}
            >
              <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const d = payload[0].payload as { name: string; score: number; base: number; acute: number };
                  return (
                    <div style={{
                      background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6,
                      padding: '6px 10px', fontSize: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}>
                      <strong>{d.name}</strong>: {d.score} (base: {d.base}, acute: {d.acute})
                    </div>
                  );
                }}
              />
              <Line type="monotone" dataKey="score" stroke="#121315" strokeWidth={2} dot={{ r: 3, fill: '#121315' }} />
              <Line type="monotone" dataKey="base" stroke="#6B7280" strokeWidth={1} strokeDasharray="4 4" dot={false} />
              <Line type="monotone" dataKey="acute" stroke="#D45B4F" strokeWidth={1} strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8, fontSize: 11, color: '#6B7280' }}>
          <span><span style={{ color: '#121315', fontWeight: 700 }}>—</span> Total Score</span>
          <span><span style={{ color: '#6B7280' }}>- -</span> Base</span>
          <span><span style={{ color: '#D45B4F' }}>- -</span> Acute</span>
        </div>
      </Section>

      {/* 5. Contagion Timeline */}
      <Section title="Contagion Zone Timeline" subtitle="Active and recent contagion zones — Gantt view">
        {timelineData.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Timeline header */}
            <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 140 }}>
              {[90, 60, 30, 14, 3, 0].map((d, i, arr) => (
                <div key={d} style={{
                  flex: i < arr.length - 1 ? (arr[i] - arr[i + 1]) / 90 : 0,
                  fontSize: 9, color: '#9CA3AF',
                }}>
                  {d > 0 ? `${d}d ago` : 'Today'}
                </div>
              ))}
            </div>

            {timelineData.map(z => {
              const totalDays = z.daysAgo + z.daysLeft;
              const startPct = Math.min(100, (z.daysAgo / 90) * 100);
              const widthPct = Math.min(100 - (100 - startPct), (totalDays / 90) * 100);
              const phaseColor = z.phase === 'ACUTE' ? '#D45B4F' : z.phase === 'ACTIVE' ? '#B79145' : '#9CA3AF';

              return (
                <div key={z.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 130, flexShrink: 0, fontSize: 11, color: '#374151',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    <span style={{ fontWeight: 600 }}>{z.startDate}</span> {z.block.slice(0, 12)}
                  </div>
                  <div style={{ flex: 1, height: 14, background: '#F3F4F6', borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
                    <div style={{
                      position: 'absolute',
                      right: `${100 - startPct}%`,
                      width: `${widthPct}%`,
                      height: '100%',
                      background: phaseColor,
                      borderRadius: 3,
                      opacity: z.phase === 'WATCH' ? 0.4 : 0.8,
                    }} />
                  </div>
                  <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                    <span style={{
                      fontSize: 9, fontWeight: 700, color: '#fff',
                      background: phaseColor, padding: '1px 5px', borderRadius: 3,
                    }}>
                      {z.phase}
                    </span>
                    {z.retWin && <Badge label="RET" color="#D45B4F" />}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: 20, textAlign: 'center', color: '#9CA3AF' }}>No active contagion zones</div>
        )}
      </Section>

      {/* Summary stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 10, marginTop: 8, marginBottom: 24,
      }}>
        <StatBox label="LOW" count={risks.filter(r => r.label === 'LOW').length} color="#16A34A" />
        <StatBox label="ELEVATED" count={risks.filter(r => r.label === 'ELEVATED').length} color="#B79145" />
        <StatBox label="HIGH" count={risks.filter(r => r.label === 'HIGH').length} color="#C66C3D" />
        <StatBox label="CRITICAL" count={risks.filter(r => r.label === 'CRITICAL').length} color="#D45B4F" />
      </div>
    </div>
  );
}

function HeatRow({ day, dayIdx, heatData, heatMax }: { day: string; dayIdx: number; heatData: number[][]; heatMax: number }) {
  return (
    <>
      <div style={{
        fontSize: 11, fontWeight: 600, color: '#374151',
        display: 'flex', alignItems: 'center', width: 40,
      }}>
        {day}
      </div>
      {HOURS.map(h => {
        const count = heatData[dayIdx][h];
        const intensity = count / heatMax;
        const bg = count === 0
          ? '#F3F4F6'
          : intensity < 0.25 ? '#FEF3C7'
          : intensity < 0.5 ? '#FDE68A'
          : intensity < 0.75 ? '#F59E0B'
          : '#D45B4F';
        return (
          <div
            key={`${dayIdx}-${h}`}
            title={`${day} ${h}:00 — ${count} incidents`}
            style={{
              height: 20,
              borderRadius: 2,
              background: bg,
            }}
          />
        );
      })}
    </>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div style={{
      border: '1px solid #E5E7EB', borderRadius: 12,
      padding: 16, marginBottom: 16,
    }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: '#121315', marginBottom: 2, paddingLeft: 10, borderLeft: '3px solid #F0B429' }}>{title}</div>
      <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 12 }}>{subtitle}</div>
      {children}
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 800, color: '#fff',
      background: color, padding: '2px 5px', borderRadius: 3,
    }}>
      {label}
    </span>
  );
}

function StatBox({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div style={{
      textAlign: 'center', padding: '8px', borderRadius: 8,
      background: `${color}10`, border: `1px solid ${color}30`,
    }}>
      <div style={{ fontSize: 20, fontWeight: 800, color, fontFamily: "'SF Mono', monospace" }}>
        {count}
      </div>
      <div style={{ fontSize: 10, color: '#6B7280', fontWeight: 600 }}>{label}</div>
    </div>
  );
}
