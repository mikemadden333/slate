/**
 * WeekForecast — Section 5: 7-Day Risk Forecast.
 *
 * TODAY card is full width, largest. Days 2-7 in horizontal scroll.
 * Tapping any day → inline expansion below with explanation, recommendation.
 * "How is this calculated?" explain modal.
 * Updates every 10 minutes.
 */

import { useState } from 'react';
import type { ForecastDay } from '../../sentinel-engine/types';
import ExplainModal, { ExplainLink } from '../shared/ExplainModal';
import Explainer from '../shared/Explainer';

interface Props {
  forecast: ForecastDay[];
  onScrollToBriefing?: () => void;
}

const LABEL_COLORS: Record<string, { color: string; bg: string }> = {
  LOW:      { color: '#0EA5E9', bg: '#E0F2FE' },
  ELEVATED: { color: '#D97706', bg: '#FFFBEB' },
  HIGH:     { color: '#EA580C', bg: '#FFF7ED' },
};

const PHASE_COLORS: Record<string, { color: string; bg: string }> = {
  ACUTE:  { color: '#DC2626', bg: '#FEE2E2' },
  ACTIVE: { color: '#D97706', bg: '#FEF3C7' },
};

export default function WeekForecast({ forecast, onScrollToBriefing }: Props) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [showExplain, setShowExplain] = useState(false);

  if (forecast.length === 0) return null;

  const today = forecast[0];
  const futureDays = forecast.slice(1);
  const todayLc = LABEL_COLORS[today.label] ?? LABEL_COLORS.LOW;
  const todayContagion = today.contagionPhase === 'ACUTE' || today.contagionPhase === 'ACTIVE';
  const todayPc = todayContagion ? PHASE_COLORS[today.contagionPhase!] : null;

  return (
    <div id="week-forecast" style={{
      border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, marginBottom: 24,
    }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 20, color: '#1B3A6B', paddingLeft: 12, borderLeft: '3px solid #F0B429' }}>
              The Week Ahead
              <Explainer title="How the Forecast Works">
                <p style={{ margin: '0 0 12px' }}>The 7-day forecast projects campus risk forward using three inputs: <strong>contagion trajectories</strong> (how existing zones will age), <strong>seasonal patterns</strong> (day-of-week and monthly violence trends), and <strong>weather forecasts</strong> (high temperatures correlate with increased violence).</p>
                <p style={{ margin: '0 0 12px' }}>Confidence decreases for days further out. Today is most reliable; Day 7 is least reliable.</p>
                <p style={{ margin: 0 }}>Forecasts update every 10 minutes as new incident data arrives.</p>
              </Explainer>
            </div>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2, lineHeight: 1.4 }}>
              Projected risk based on contagion zones, seasonal patterns, and historical data
            </div>
          </div>
        </div>
      </div>

      {/* TODAY — full width card */}
      <div
        onClick={() => setExpandedDay(expandedDay === today.date ? null : today.date)}
        style={{
          background: '#EEF2F9',
          border: '2px solid #1B3A6B',
          borderRadius: 10,
          padding: '16px 20px',
          cursor: 'pointer',
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#1B3A6B' }}>TODAY</div>
            {todayPc && (
              <span style={{
                fontSize: 10, fontWeight: 800, color: todayPc.color, background: todayPc.bg,
                padding: '2px 8px', borderRadius: 4,
              }}>
                {today.contagionPhase}
              </span>
            )}
            <span style={{
              fontSize: 12, fontWeight: 700, color: todayLc.color, background: todayLc.bg,
              padding: '3px 10px', borderRadius: 10,
            }}>
              {today.label}
            </span>
          </div>
          <div style={{ fontSize: 13, color: '#6B7280' }}>
            {today.confidence}% confidence
          </div>
        </div>
        {today.drivers.length > 0 && (
          <div style={{ marginTop: 8 }}>
            {today.drivers.slice(0, 2).map((d, i) => (
              <div key={i} style={{
                fontSize: 13, color: '#374151', lineHeight: 1.5,
                fontWeight: /contagion|retaliation/i.test(d) ? 600 : 400,
              }}>
                • {d}
              </div>
            ))}
          </div>
        )}
        {onScrollToBriefing && (
          <div style={{ fontSize: 13, color: '#1B3A6B', fontWeight: 600, marginTop: 8 }}>
            Full briefing ↓
          </div>
        )}
      </div>

      {/* Days 2-7 horizontal scroll */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {futureDays.map(day => {
          const lc = LABEL_COLORS[day.label] ?? LABEL_COLORS.LOW;
          const hasContagion = day.contagionPhase === 'ACUTE' || day.contagionPhase === 'ACTIVE';
          const pc = hasContagion ? PHASE_COLORS[day.contagionPhase!] : null;
          const isExpanded = expandedDay === day.date;

          return (
            <div
              key={day.date}
              onClick={() => setExpandedDay(isExpanded ? null : day.date)}
              style={{
                background: isExpanded ? '#EEF2F9' : '#F8F9FA',
                border: hasContagion ? `2px solid ${pc!.color}55` : isExpanded ? '2px solid #1B3A6B' : '1px solid #E5E7EB',
                borderRadius: 8,
                padding: '10px 12px',
                textAlign: 'center',
                cursor: 'pointer',
                minWidth: 72,
                flexShrink: 0,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                {day.dayName.slice(0, 3).toUpperCase()}
              </div>
              <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 6 }}>
                {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>

              {hasContagion && pc && (
                <div style={{
                  fontSize: 9, fontWeight: 800, color: pc.color, background: pc.bg,
                  padding: '2px 6px', borderRadius: 4, display: 'inline-block', marginBottom: 4,
                }}>
                  {day.contagionPhase}
                </div>
              )}

              <div style={{
                fontSize: 11, fontWeight: 700, color: lc.color, background: lc.bg,
                padding: '2px 8px', borderRadius: 10, display: 'inline-block', marginBottom: 4,
              }}>
                {day.label}
              </div>

              <div style={{ fontSize: 10, color: '#6B7280' }}>{day.confidence}%</div>

              {!day.isSchoolDay && (
                <div style={{ fontSize: 9, color: '#9CA3AF', marginTop: 2 }}>No school</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Expanded day detail */}
      {expandedDay && (() => {
        const day = forecast.find(d => d.date === expandedDay);
        if (!day) return null;
        const lc = LABEL_COLORS[day.label] ?? LABEL_COLORS.LOW;
        const hasContagion = day.contagionPhase === 'ACUTE' || day.contagionPhase === 'ACTIVE';
        const isToday = forecast[0]?.date === day.date;

        const sorted = [...day.drivers].sort((a, b) => {
          const aContagion = /contagion|retaliation/i.test(a) ? 0 : 1;
          const bContagion = /contagion|retaliation/i.test(b) ? 0 : 1;
          return aContagion - bContagion;
        });

        const recommendation = getRecommendation(day);

        return (
          <div style={{
            marginTop: 12, padding: '16px 18px', background: '#F8F9FA',
            borderRadius: 10, border: `1px solid ${lc.color}33`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: '#1B3A6B' }}>
                {day.dayName}, {new Date(day.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} — {day.label}
              </span>
              {hasContagion && (
                <span style={{
                  fontSize: 10, fontWeight: 700, color: PHASE_COLORS[day.contagionPhase!].color,
                  background: PHASE_COLORS[day.contagionPhase!].bg, padding: '2px 8px', borderRadius: 4,
                }}>
                  {day.contagionPhase} ZONE
                </span>
              )}
            </div>

            <div style={{ fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 8 }}>
              Why {day.label}? Here is what we know today:
            </div>

            {sorted.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: 20, marginBottom: 12 }}>
                {sorted.map((d, idx) => (
                  <li key={idx} style={{
                    fontSize: 14, lineHeight: 1.6, marginBottom: 4,
                    color: /contagion|retaliation/i.test(d) ? '#DC2626' : '#374151',
                    fontWeight: /contagion|retaliation/i.test(d) ? 600 : 400,
                  }}>
                    {d}
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 12 }}>
                No significant risk drivers identified for this day.
              </div>
            )}

            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>
              Confidence: {day.confidence}% — confidence decreases for days further out
            </div>

            {recommendation && (
              <div style={{
                fontSize: 14, fontWeight: 600, color: '#1B3A6B', padding: '10px 14px',
                background: '#EEF2F9', borderRadius: 6,
              }}>
                Recommended preparation: {recommendation}
              </div>
            )}

            {isToday && onScrollToBriefing && (
              <button onClick={onScrollToBriefing} style={{
                marginTop: 8, background: 'none', border: 'none', padding: 0,
                cursor: 'pointer', fontSize: 13, color: '#1B3A6B', fontWeight: 600,
                textDecoration: 'underline', textUnderlineOffset: 3,
              }}>
                View today&apos;s full briefing above
              </button>
            )}
          </div>
        );
      })()}

      {/* Footer note */}
      <div style={{ marginTop: 12, fontSize: 12, color: '#9CA3AF' }}>
        Forecasts update every 10 minutes as new incident data arrives.{' '}
        <ExplainLink onClick={() => setShowExplain(true)} label="How is this calculated?" />
      </div>

      {showExplain && (
        <ExplainModal title="How the Forecast Works" onClose={() => setShowExplain(false)}>
          <p style={{ marginTop: 0, fontSize: 15, lineHeight: 1.7 }}>
            The 7-day forecast projects your campus risk forward based on three inputs:
          </p>
          <p style={{ fontSize: 15, lineHeight: 1.7 }}>
            <strong>1. Contagion trajectories:</strong> Every contagion zone ages day by day.
            An ACUTE zone today will be ACTIVE in 3 days and WATCH in 14 days. The forecast
            projects where each zone will be.
          </p>
          <p style={{ fontSize: 15, lineHeight: 1.7 }}>
            <strong>2. Seasonal patterns:</strong> Decades of Chicago crime data show that
            violence increases on Fridays, during summer months, and when temperatures exceed 88°F.
          </p>
          <p style={{ fontSize: 15, lineHeight: 1.7 }}>
            <strong>3. Weather forecast:</strong> High temperatures correlate with increased
            outdoor activity and higher violence risk.
          </p>
          <p style={{ fontSize: 15, lineHeight: 1.7 }}>
            <strong>Confidence</strong> decreases for days further in the future. Today&apos;s forecast
            is most reliable; day 7 is least reliable.
          </p>
          <p style={{ fontSize: 15, lineHeight: 1.7 }}>
            <strong>Risk labels:</strong> LOW (under 18 points), ELEVATED (18-34 points), HIGH (35+ points).
          </p>
        </ExplainModal>
      )}
    </div>
  );
}

function getRecommendation(day: ForecastDay): string | null {
  if (day.contagionPhase === 'ACUTE') return 'Full security posture — brief team, staff entrances, prepare modified dismissal.';
  if (day.contagionPhase === 'ACTIVE') return 'Maintain heightened awareness. Monitor contagion zone as it transitions.';
  if (day.label === 'HIGH') return 'Brief security team and plan for modified dismissal if conditions persist.';
  if (day.label === 'ELEVATED') return 'Notify security coordinator. Standard dismissal with extra monitoring.';
  return null;
}
