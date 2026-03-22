/**
 * NetworkIntelligence — Slate Watch · "The Analyst's View"
 *
 * Beautiful data visualization page — annual report infographics, not spreadsheets.
 *
 * Layout:
 *   1. Key Insights Strip — 4 instant-takeaway cards
 *   2. Violence Heatmap — 7×24 grid (days × hours) with school windows marked
 *   3. Campus Risk Ranking — horizontal bar chart
 *   4. Incident Density by Area — horizontal bar chart
 *   5. 30-Day Network Trend — line chart with threshold lines
 *   6. Contagion Zone Timeline — Gantt-style history
 *
 * Props match the existing Intelligence/Analytics interface:
 *   risks={allRisks}
 *   incidents={incidents}
 *   zones={zones}
 *
 * Drop-in replacement — no SentinelApp.tsx changes needed.
 */

import { useMemo } from 'react';
import type { Incident, CampusRisk, ContagionZone } from '../../sentinel-engine/types';
import { CAMPUSES } from '../../sentinel-data/campuses';
import { haversine } from '../../sentinel-engine/geo';

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface Props {
  risks: CampusRisk[];
  incidents: Incident[];
  zones: ContagionZone[];
}

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const C = {
  cream:   '#FAF8F5',
  cream2:  '#F3F0EA',
  white:   '#FFFFFF',
  deep:    '#1A1A1A',
  rock:    '#2D2D2D',
  mid:     '#6B7280',
  light:   '#9CA3AF',
  chalk:   '#E5E1D8',
  brass:   '#B79145',
  watch:   '#C0392B',
  section: '#C0392B',
  ice:     '#7C3AED',
  green:   '#16A34A',
  red:     '#DC2626',
  amber:   '#D97706',
  blue:    '#3B82F6',
};

const FONT = {
  heading: "'Playfair Display', Georgia, serif",
  body:    "'Inter', system-ui, sans-serif",
  mono:    "'JetBrains Mono', 'SF Mono', monospace",
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SERIOUS_VIOLENT = /HOMICIDE|MURDER|SHOOTING|SHOT.?SPOTTER|CRIM SEXUAL|KIDNAP|AGG.*HANDGUN|AGG.*FIREARM/i;

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 800, letterSpacing: '0.14em',
      textTransform: 'uppercase', color: C.section,
      fontFamily: FONT.body, marginBottom: 6,
    }}>
      {children}
    </div>
  );
}

function riskColor(label: string): string {
  if (label === 'CRITICAL') return C.red;
  if (label === 'HIGH') return '#C66C3D';
  if (label === 'ELEVATED') return C.amber;
  return C.green;
}

function heatColor(value: number, max: number): string {
  if (max === 0) return C.cream2;
  const ratio = Math.min(value / max, 1);
  if (ratio === 0) return C.cream2;
  if (ratio < 0.2) return '#FEF3C7';
  if (ratio < 0.4) return '#FDE68A';
  if (ratio < 0.6) return '#F59E0B';
  if (ratio < 0.8) return '#DC6B2F';
  return '#C0392B';
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export default function NetworkIntelligence({ risks, incidents, zones }: Props) {
  const now = Date.now();

  // ── Key Insights ──
  const insights = useMemo(() => {
    // Peak violence hour
    const hourCounts = new Array(24).fill(0);
    incidents.forEach(inc => {
      if (SERIOUS_VIOLENT.test(inc.type)) {
        const h = new Date(inc.date).getHours();
        hourCounts[h]++;
      }
    });
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
    const peakHourLabel = peakHour === 0 ? '12 AM' : peakHour <= 12 ? `${peakHour} ${peakHour < 12 ? 'AM' : 'PM'}` : `${peakHour - 12} PM`;

    // Highest density area
    const areaCounts: Record<string, number> = {};
    incidents.forEach(inc => {
      if (inc.communityArea) areaCounts[inc.communityArea] = (areaCounts[inc.communityArea] || 0) + 1;
    });
    const topArea = Object.entries(areaCounts).sort((a, b) => b[1] - a[1])[0];

    // 30-day trend
    const thirtyDaysAgo = now - 30 * 86400000;
    const fifteenDaysAgo = now - 15 * 86400000;
    const firstHalf = incidents.filter(i => {
      const t = new Date(i.date).getTime();
      return t >= thirtyDaysAgo && t < fifteenDaysAgo;
    }).length;
    const secondHalf = incidents.filter(i => {
      const t = new Date(i.date).getTime();
      return t >= fifteenDaysAgo;
    }).length;
    const trendPct = firstHalf > 0 ? Math.round(((secondHalf - firstHalf) / firstHalf) * 100) : 0;

    // Network avg score
    const avgScore = risks.length > 0
      ? Math.round(risks.reduce((s, r) => s + r.score, 0) / risks.length)
      : 0;

    return { peakHourLabel, peakHour, hourCounts, topArea, trendPct, avgScore };
  }, [incidents, risks]);

  // ── Heatmap data: 7 days × 24 hours ──
  const heatmap = useMemo(() => {
    const grid: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));
    let max = 0;
    incidents.forEach(inc => {
      const d = new Date(inc.date);
      const day = d.getDay();
      const hour = d.getHours();
      grid[day][hour]++;
      if (grid[day][hour] > max) max = grid[day][hour];
    });
    return { grid, max };
  }, [incidents]);

  // ── Campus Risk Ranking ──
  const sortedRisks = useMemo(() => {
    return [...risks].sort((a, b) => b.score - a.score);
  }, [risks]);

  // ── Incident Density by Area ──
  const areaDensity = useMemo(() => {
    const counts: Record<string, number> = {};
    incidents.forEach(inc => {
      if (inc.communityArea) counts[inc.communityArea] = (counts[inc.communityArea] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([area, count]) => ({
        area, count,
        hasCampus: CAMPUSES.some(c => c.communityArea.toLowerCase() === area.toLowerCase()),
      }));
  }, [incidents]);

  // ── 30-Day Trend ──
  const dailyTrend = useMemo(() => {
    const days: { date: string; count: number; violent: number }[] = [];
    for (let d = 29; d >= 0; d--) {
      const dayStart = now - (d + 1) * 86400000;
      const dayEnd = now - d * 86400000;
      let count = 0;
      let violent = 0;
      incidents.forEach(inc => {
        const t = new Date(inc.date).getTime();
        if (t >= dayStart && t < dayEnd) {
          count++;
          if (SERIOUS_VIOLENT.test(inc.type)) violent++;
        }
      });
      const dateLabel = new Date(dayEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      days.push({ date: dateLabel, count, violent });
    }
    return days;
  }, [incidents]);

  const trendMax = Math.max(...dailyTrend.map(d => d.count), 1);

  // ── Contagion Zone Timeline ──
  const zoneTimeline = useMemo(() => {
    return zones.slice(0, 10).map(zone => {
      const nearestCampus = CAMPUSES.reduce((best, c) => {
        const d = haversine(c.lat, c.lng, (zone as any).lat ?? 0, (zone as any).lng ?? 0);
        return d < best.dist ? { name: c.short, dist: d } : best;
      }, { name: 'Unknown', dist: Infinity });
      return { ...zone, nearestCampus };
    });
  }, [zones]);

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', fontFamily: FONT.body }}>

      {/* ═══ HEADER ═══ */}
      <SectionLabel>NETWORK INTELLIGENCE</SectionLabel>
      <h1 style={{
        fontFamily: FONT.heading, fontSize: 36, fontWeight: 900,
        color: C.deep, margin: '0 0 4px 0', lineHeight: 1.15,
        letterSpacing: '-0.02em',
      }}>
        The Analyst's View
      </h1>
      <div style={{
        fontSize: 13, color: C.mid, marginBottom: 28,
      }}>
        30-day analysis · {incidents.length} incidents · {risks.length} campuses
      </div>

      {/* ═══ KEY INSIGHTS STRIP ═══ */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
        marginBottom: 32,
      }}>
        {[
          {
            label: 'PEAK VIOLENCE HOUR',
            value: insights.peakHourLabel,
            sub: `${insights.hourCounts[insights.peakHour]} incidents at this hour`,
            color: C.red,
          },
          {
            label: 'HIGHEST DENSITY',
            value: insights.topArea?.[0] ?? '—',
            sub: insights.topArea ? `${insights.topArea[1]} incidents (30d)` : '',
            color: C.amber,
          },
          {
            label: '30-DAY TREND',
            value: `${insights.trendPct > 0 ? '↑' : insights.trendPct < 0 ? '↓' : '→'} ${Math.abs(insights.trendPct)}%`,
            sub: 'vs previous 15 days',
            color: insights.trendPct > 10 ? C.red : insights.trendPct < -10 ? C.green : C.amber,
          },
          {
            label: 'NETWORK AVG SCORE',
            value: insights.avgScore.toString(),
            sub: `${risks.filter(r => r.label !== 'LOW').length} campuses elevated+`,
            color: insights.avgScore >= 50 ? C.red : insights.avgScore >= 35 ? C.amber : C.green,
          },
        ].map((card, i) => (
          <div key={i} style={{
            background: C.white, border: `1px solid ${C.chalk}`, borderRadius: 12,
            padding: '18px 20px', borderTop: `3px solid ${card.color}`,
          }}>
            <div style={{
              fontSize: 9, fontWeight: 800, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: C.mid, marginBottom: 8,
            }}>{card.label}</div>
            <div style={{
              fontSize: 24, fontWeight: 900, color: card.color,
              fontFamily: FONT.heading, lineHeight: 1, marginBottom: 4,
            }}>{card.value}</div>
            <div style={{ fontSize: 11, color: C.light }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* ═══ VIOLENCE HEATMAP ═══ */}
      <SectionLabel>WHEN DOES VIOLENCE HAPPEN?</SectionLabel>
      <div style={{
        background: C.white, border: `1px solid ${C.chalk}`, borderRadius: 12,
        padding: '20px 24px', marginBottom: 32,
      }}>
        <div style={{ fontSize: 12, color: C.mid, marginBottom: 16 }}>
          30-day incident distribution · All types · School hours highlighted
        </div>

        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 700 }}>
            {/* Hour labels */}
            <div style={{ display: 'flex', paddingLeft: 40, marginBottom: 4 }}>
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} style={{
                  flex: 1, textAlign: 'center', fontSize: 9,
                  color: (h >= 7 && h <= 8) || (h >= 15 && h <= 16) ? C.watch : C.light,
                  fontWeight: (h >= 7 && h <= 8) || (h >= 15 && h <= 16) ? 700 : 400,
                  fontFamily: FONT.mono,
                }}>
                  {h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`}
                </div>
              ))}
            </div>

            {/* Grid rows */}
            {DAYS.map((day, dayIdx) => (
              <div key={dayIdx} style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
                <div style={{
                  width: 36, fontSize: 11, fontWeight: 600, color: C.mid,
                  fontFamily: FONT.body, flexShrink: 0,
                }}>{day}</div>
                <div style={{ display: 'flex', flex: 1, gap: 1 }}>
                  {Array.from({ length: 24 }, (_, h) => {
                    const val = heatmap.grid[dayIdx][h];
                    const isSchool = (h >= 7 && h <= 8) || (h >= 15 && h <= 16);
                    return (
                      <div key={h} style={{
                        flex: 1, height: 24, borderRadius: 2,
                        background: heatColor(val, heatmap.max),
                        border: isSchool ? `1px solid ${C.watch}40` : 'none',
                        position: 'relative',
                        cursor: val > 0 ? 'default' : undefined,
                      }}
                        title={`${day} ${h}:00 — ${val} incidents`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Legend */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, paddingLeft: 40,
            }}>
              <span style={{ fontSize: 10, color: C.mid }}>Less</span>
              {[C.cream2, '#FEF3C7', '#FDE68A', '#F59E0B', '#DC6B2F', C.watch].map((color, i) => (
                <div key={i} style={{
                  width: 16, height: 10, borderRadius: 2, background: color,
                }} />
              ))}
              <span style={{ fontSize: 10, color: C.mid }}>More</span>
              <span style={{
                fontSize: 10, color: C.watch, fontWeight: 600, marginLeft: 16,
              }}>
                ■ School arrival/dismissal windows
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ TWO-COLUMN: Risk Ranking + Area Density ═══ */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
        marginBottom: 32,
      }}>
        {/* Campus Risk Ranking */}
        <div style={{
          background: C.white, border: `1px solid ${C.chalk}`, borderRadius: 12,
          padding: '20px 24px',
        }}>
          <SectionLabel>CAMPUS RISK RANKING</SectionLabel>
          <div style={{ fontSize: 11, color: C.mid, marginBottom: 14 }}>
            All {risks.length} campuses · sorted by risk score
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sortedRisks.map((risk, i) => {
              const campus = CAMPUSES.find(c => c.id === risk.campusId);
              if (!campus) return null;
              const color = riskColor(risk.label);
              const maxScore = sortedRisks[0]?.score || 1;
              const pct = (risk.score / maxScore) * 100;
              return (
                <div key={campus.id}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: 3,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        fontSize: 12, fontWeight: 700, color: color,
                        fontFamily: FONT.mono, width: 28,
                      }}>{risk.score}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.deep }}>
                        {campus.short}
                      </span>
                    </div>
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 3,
                      background: color + '15', color: color,
                    }}>{risk.label}</span>
                  </div>
                  <div style={{
                    height: 6, borderRadius: 3, background: C.cream2,
                  }}>
                    <div style={{
                      height: '100%', borderRadius: 3,
                      background: `linear-gradient(90deg, ${color}40, ${color})`,
                      width: `${pct}%`,
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Incident Density by Area */}
        <div style={{
          background: C.white, border: `1px solid ${C.chalk}`, borderRadius: 12,
          padding: '20px 24px',
        }}>
          <SectionLabel>INCIDENT DENSITY BY AREA</SectionLabel>
          <div style={{ fontSize: 11, color: C.mid, marginBottom: 14 }}>
            Top 15 community areas · 30-day window
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {areaDensity.map((area, i) => {
              const maxCount = areaDensity[0]?.count || 1;
              const pct = (area.count / maxCount) * 100;
              return (
                <div key={i}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: 3,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.deep }}>
                        {area.area}
                      </span>
                      {area.hasCampus && (
                        <span style={{
                          width: 5, height: 5, borderRadius: '50%',
                          background: C.watch, flexShrink: 0,
                        }} />
                      )}
                    </div>
                    <span style={{
                      fontSize: 11, fontFamily: FONT.mono, color: C.mid,
                    }}>{area.count}</span>
                  </div>
                  <div style={{
                    height: 6, borderRadius: 3, background: C.cream2,
                  }}>
                    <div style={{
                      height: '100%', borderRadius: 3,
                      background: area.hasCampus
                        ? `linear-gradient(90deg, ${C.watch}40, ${C.watch})`
                        : `linear-gradient(90deg, ${C.blue}40, ${C.blue})`,
                      width: `${pct}%`,
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{
            display: 'flex', gap: 12, marginTop: 12, fontSize: 10, color: C.mid,
          }}>
            <span><span style={{ color: C.watch }}>●</span> Campus present</span>
            <span><span style={{ color: C.blue }}>●</span> No campus</span>
          </div>
        </div>
      </div>

      {/* ═══ 30-DAY NETWORK TREND ═══ */}
      <SectionLabel>30-DAY NETWORK TREND</SectionLabel>
      <div style={{
        background: C.white, border: `1px solid ${C.chalk}`, borderRadius: 12,
        padding: '20px 24px', marginBottom: 32,
      }}>
        <div style={{ fontSize: 12, color: C.mid, marginBottom: 16 }}>
          Daily incident count · all types within 5mi of network
        </div>

        {/* SVG Line Chart */}
        <div style={{ position: 'relative', height: 200 }}>
          <svg width="100%" height="100%" viewBox="0 0 600 200" preserveAspectRatio="none">
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map(pct => (
              <line key={pct} x1={0} x2={600} y1={pct * 180 + 10} y2={pct * 180 + 10}
                stroke={C.chalk} strokeWidth={0.5} />
            ))}

            {/* Area fill */}
            <path
              d={`M ${dailyTrend.map((d, i) => {
                const x = (i / (dailyTrend.length - 1)) * 580 + 10;
                const y = 190 - (d.count / trendMax) * 170;
                return `${x},${y}`;
              }).join(' L ')} L 590,190 L 10,190 Z`}
              fill={C.brass + '15'}
            />

            {/* Line */}
            <polyline
              points={dailyTrend.map((d, i) => {
                const x = (i / (dailyTrend.length - 1)) * 580 + 10;
                const y = 190 - (d.count / trendMax) * 170;
                return `${x},${y}`;
              }).join(' ')}
              fill="none" stroke={C.brass} strokeWidth={2}
              strokeLinecap="round" strokeLinejoin="round"
            />

            {/* Violent incidents as red dots */}
            {dailyTrend.map((d, i) => {
              if (d.violent === 0) return null;
              const x = (i / (dailyTrend.length - 1)) * 580 + 10;
              const y = 190 - (d.count / trendMax) * 170;
              return (
                <circle key={i} cx={x} cy={y} r={3}
                  fill={C.red} stroke={C.white} strokeWidth={1.5} />
              );
            })}
          </svg>

          {/* Y-axis labels */}
          <div style={{
            position: 'absolute', top: 0, left: -30, height: '100%',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            fontSize: 9, color: C.light, fontFamily: FONT.mono,
            paddingTop: 5, paddingBottom: 10,
          }}>
            <span>{trendMax}</span>
            <span>{Math.round(trendMax * 0.75)}</span>
            <span>{Math.round(trendMax * 0.5)}</span>
            <span>{Math.round(trendMax * 0.25)}</span>
            <span>0</span>
          </div>
        </div>

        {/* X-axis labels */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: 9, color: C.light, fontFamily: FONT.mono,
          marginTop: 4, paddingLeft: 10, paddingRight: 10,
        }}>
          {dailyTrend.filter((_, i) => i % 5 === 0).map((d, i) => (
            <span key={i}>{d.date}</span>
          ))}
        </div>

        {/* Legend */}
        <div style={{
          display: 'flex', gap: 16, marginTop: 12, fontSize: 10, color: C.mid,
        }}>
          <span>—— Total incidents</span>
          <span><span style={{ color: C.red }}>●</span> Days with violent incidents</span>
        </div>
      </div>

      {/* ═══ CONTAGION ZONE TIMELINE ═══ */}
      {zones.length > 0 && (
        <>
          <SectionLabel>CONTAGION ZONE TIMELINE</SectionLabel>
          <div style={{
            background: C.white, border: `1px solid ${C.chalk}`, borderRadius: 12,
            padding: '20px 24px', marginBottom: 32,
          }}>
            <div style={{ fontSize: 12, color: C.mid, marginBottom: 16 }}>
              Active and recent contagion zones · click to see affected campuses
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {zoneTimeline.map((zone, i) => {
                const startTime = new Date((zone as any).startDate || (zone as any).created || Date.now()).getTime();
                const age = Math.floor((now - startTime) / 3600000);
                const isActive = (zone as any).phase === 'ACUTE' || (zone as any).active !== false;
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', borderRadius: 8,
                    background: isActive ? C.amber + '08' : C.cream2,
                    border: `1px solid ${isActive ? C.amber + '30' : C.chalk}`,
                  }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: isActive ? C.amber : C.light,
                      flexShrink: 0,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 12, fontWeight: 600, color: C.deep,
                      }}>
                        {(zone as any).type || 'Contagion Zone'} — {(zone as any).communityArea || zone.nearestCampus.name}
                      </div>
                      <div style={{ fontSize: 10, color: C.mid }}>
                        {age < 24 ? `${age}h active` : `${Math.floor(age / 24)}d active`}
                        {' · '}Near {zone.nearestCampus.name} ({zone.nearestCampus.dist.toFixed(1)}mi)
                      </div>
                    </div>
                    <div style={{
                      fontSize: 10, fontWeight: 700,
                      color: isActive ? C.amber : C.light,
                      fontFamily: FONT.mono,
                    }}>
                      {isActive ? 'ACTIVE' : 'EXPIRED'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ═══ DATA SOURCE ═══ */}
      <div style={{
        textAlign: 'center', fontSize: 11, color: C.light,
        padding: '16px 0',
      }}>
        Data: Chicago Police Department · 30-day window · {incidents.length} total incidents
      </div>
    </div>
  );
}
