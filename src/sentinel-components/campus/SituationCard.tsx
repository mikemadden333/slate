/**
 * SituationCard — Section 1: The Situation.
 *
 * The most important card in the application.
 * White background, left border 6px in status color.
 *
 * - Top line: the single most important fact right now (deterministic)
 * - Context sentence below
 * - "What does this mean for me today?" modal with actions + begin protocol
 * - Risk score with horizontal bar (0-100, 4 zones marked)
 * - Tappable score → breakdown modal with tappable components
 * - ICE sub-banner when alerts exist
 */

import { useState, useEffect, useRef } from 'react';
import type { CampusRisk } from '../../sentinel-engine/types';
import { RISK_COLORS } from '../../sentinel-data/weights';
import ExplainModal from '../shared/ExplainModal';
import Explainer from '../shared/Explainer';
import { ChevronDown, ChevronUp } from 'lucide-react';

function useCountUp(target: number, duration = 800): number {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(target);
  useEffect(() => {
    const start = prevTarget.current === target ? 0 : prevTarget.current;
    prevTarget.current = target;
    const startTime = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(start + (target - start) * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

interface Props {
  risk: CampusRisk;
  campusName: string;
  onBeginProtocol?: (code: string) => void;
}

/* ---- Deterministic top sentence ---- */
function getTopSentence(risk: CampusRisk): { headline: string; context: string } {
  // Retaliation window — highest priority
  if (risk.inRetaliationWindow) {
    const retZone = risk.contagionZones.find(z => z.retWin && z.ageH >= 18 && z.ageH <= 72);
    if (retZone) {
      const hoursLeft = Math.max(0, 72 - retZone.ageH);
      return {
        headline: `Your campus is in a violence retaliation window. It closes in ${Math.round(hoursLeft)} hours.`,
        context: 'This places your campus in the Papachristos ACUTE contagion zone — the period of highest retaliatory violence risk.',
      };
    }
  }

  // ACUTE contagion zone (no ret window)
  const acuteZone = risk.contagionZones.find(z => z.phase === 'ACUTE');
  if (acuteZone) {
    const distStr = acuteZone.distanceFromCampus != null
      ? `${acuteZone.distanceFromCampus.toFixed(1)} miles away`
      : 'nearby';
    const agoStr = acuteZone.ageH < 24
      ? `${Math.round(acuteZone.ageH)} hours ago`
      : `${Math.round(acuteZone.ageH / 24)} days ago`;
    return {
      headline: `A homicide was reported ${distStr} ${agoStr} — your campus is in an active contagion zone.`,
      context: 'The contagion window remains open. See Contagion Intelligence below for the full timeline.',
    };
  }

  // Recent close incident
  if (risk.closeCount > 0 && risk.acute > 0) {
    return {
      headline: `${risk.closeCount} incident${risk.closeCount !== 1 ? 's' : ''} detected within 0.5 miles of your campus in the last 24 hours.`,
      context: risk.label === 'LOW'
        ? 'Activity is within normal ranges. Standard operations apply.'
        : `Your campus is at ${risk.label} risk. Review your security posture for today.`,
    };
  }

  // Quiet
  return {
    headline: 'Your campus neighborhood has been quiet.',
    context: 'Nothing in the last 24 hours requires your attention. That\'s a good morning.',
  };
}

/* ---- Recommended actions for modal ---- */
function getActions(risk: CampusRisk): string[] {
  if (risk.inRetaliationWindow) {
    return [
      'Brief your security team before first bell and position staff at all exterior entrances.',
      'Review dismissal corridors in the Safe Corridors section — modify routes if any are flagged.',
      'Prepare a staggered dismissal plan and notify families if risk is HIGH or above.',
    ];
  }
  if (risk.label === 'CRITICAL' || risk.label === 'HIGH') {
    return [
      'Brief your security team before first bell and position someone at primary entrances.',
      'Monitor dismissal closely — consider modified dismissal procedures.',
      'Coordinate with Noble Network Safety Director on current conditions.',
    ];
  }
  if (risk.label === 'ELEVATED') {
    return [
      'Notify your security coordinator of the elevated conditions.',
      'Monitor the dismissal window closely today.',
      'Check the 7-Day Forecast below for upcoming risk trends.',
    ];
  }
  return [
    'No special actions required — standard operations are appropriate.',
    'Review the Morning Intelligence briefing for overnight activity summary.',
    'Check the 7-Day Forecast to stay ahead of upcoming conditions.',
  ];
}

function getRecommendedProtocol(risk: CampusRisk): string | null {
  if (risk.label === 'CRITICAL') return 'RED';
  if (risk.label === 'HIGH') return 'YELLOW';
  return null;
}

/* ---- Human descriptors for risk labels ---- */
const LABEL_HUMAN: Record<string, string> = {
  LOW:      "Your campus neighborhood is quiet today.",
  ELEVATED: "Something happened near your campus recently. Stay aware.",
  HIGH:     "A serious incident occurred near your campus. Review protocols.",
  CRITICAL: "Immediate attention required. Act now.",
};

/* ---- Score bar zone boundaries ---- */
const SCORE_ZONES = [
  { label: 'LOW', end: 25, color: '#16A34A' },
  { label: 'ELEVATED', end: 45, color: '#D97706' },
  { label: 'HIGH', end: 70, color: '#EA580C' },
  { label: 'CRITICAL', end: 100, color: '#DC2626' },
];

export default function SituationCard({ risk, onBeginProtocol }: Props) {
  const [showActionModal, setShowActionModal] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [expandedComponent, setExpandedComponent] = useState<string | null>(null);

  const colors = RISK_COLORS[risk.label];
  const { headline, context } = getTopSentence(risk);
  const actions = getActions(risk);
  const recProtocol = getRecommendedProtocol(risk);
  const scorePos = Math.min(100, Math.max(0, risk.score));
  const animatedScore = useCountUp(risk.score);

  // Label change pop animation
  const [labelPop, setLabelPop] = useState(false);
  const prevLabel = useRef(risk.label);
  useEffect(() => {
    if (prevLabel.current !== risk.label) {
      setLabelPop(true);
      prevLabel.current = risk.label;
      const t = setTimeout(() => setLabelPop(false), 800);
      return () => clearTimeout(t);
    }
  }, [risk.label]);

  return (
    <>
      <div style={{
        background: '#fff',
        borderLeft: `6px solid ${colors.color}`,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 24,
        transition: 'border-color 800ms ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}>
        {/* ---- Top sentence ---- */}
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#111827',
            lineHeight: 1.4,
            marginBottom: 8,
          }}>
            {headline}
          </div>
          <div style={{
            fontSize: 16,
            color: '#6B7280',
            lineHeight: 1.5,
            marginBottom: 16,
          }}>
            {context}
          </div>

          {/* ---- What does this mean for me today? ---- */}
          <button
            onClick={() => setShowActionModal(true)}
            style={{
              width: '100%',
              padding: '14px 20px',
              background: '#0D1117',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: 20,
            }}
          >
            What does this mean for me today?
          </button>
        </div>

        {/* ---- Risk score + horizontal bar ---- */}
        <div style={{ padding: '0 20px 20px' }}>
          <div
            onClick={() => setShowBreakdown(!showBreakdown)}
            style={{ cursor: 'pointer' }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <span style={{
                  fontSize: 48,
                  fontWeight: 800,
                  color: colors.color,
                  fontFamily: "'SF Mono', 'Roboto Mono', 'Courier New', monospace",
                  lineHeight: 1,
                }}>
                  {animatedScore}
                </span>
                <Explainer title="How the Risk Score Works">
                  <p style={{ margin: '0 0 12px' }}>Your campus risk score (0-100) is composed of a <strong>contagion base</strong> (homicides, weapons, CSA), a small <strong>environmental context</strong> (battery, assault, robbery), an <strong>acute bonus</strong> from recent contagion crimes, and <strong>seasonal adjustments</strong>.</p>
                  <p style={{ margin: '0 0 12px' }}>The <strong>label</strong> (LOW/ELEVATED/HIGH/CRITICAL) is determined by specific events, not by the score number. Only contagion-level crimes (homicides, weapons violations, ShotSpotter alerts) can raise the label above LOW.</p>
                  <p style={{ margin: 0 }}>Tap the score to see the breakdown of each component.</p>
                </Explainer>
                <span style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#fff',
                  background: colors.color,
                  padding: '4px 12px',
                  borderRadius: 6,
                  letterSpacing: 0.5,
                  transition: 'background 800ms ease, transform 300ms ease',
                  transform: labelPop ? 'scale(1.15)' : 'scale(1)',
                }}>
                  {risk.label}
                </span>
              </div>
              <div style={{ color: '#9CA3AF' }}>
                {showBreakdown ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </div>

            {/* Human descriptor below label */}
            <div style={{ fontSize: 14, color: `${colors.color}CC`, marginBottom: 8 }}>
              {LABEL_HUMAN[risk.label] ?? ''}
            </div>

            {/* Horizontal bar with 4 zones */}
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <div style={{
                display: 'flex',
                height: 12,
                borderRadius: 6,
                overflow: 'hidden',
              }}>
                {SCORE_ZONES.map((zone, i) => {
                  const prevEnd = i > 0 ? SCORE_ZONES[i - 1].end : 0;
                  const width = zone.end - prevEnd;
                  return (
                    <div key={zone.label} style={{
                      width: `${width}%`,
                      background: `${zone.color}30`,
                      borderRight: i < 3 ? '1px solid #fff' : 'none',
                    }} />
                  );
                })}
              </div>
              {/* Marker */}
              <div style={{
                position: 'absolute',
                left: `${scorePos}%`,
                top: -3,
                transform: 'translateX(-50%)',
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: '#F0B429',
                border: '3px solid #fff',
                boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                transition: 'left 600ms ease',
              }} />
              {/* Zone labels */}
              <div style={{
                display: 'flex',
                marginTop: 6,
              }}>
                {SCORE_ZONES.map((zone, i) => {
                  const prevEnd = i > 0 ? SCORE_ZONES[i - 1].end : 0;
                  const width = zone.end - prevEnd;
                  return (
                    <div key={zone.label} style={{
                      width: `${width}%`,
                      fontSize: 9,
                      color: '#9CA3AF',
                      textAlign: 'center',
                      fontWeight: risk.label === zone.label ? 700 : 400,
                    }}>
                      {zone.label}
                    </div>
                  );
                })}
              </div>
            </div>

            {!showBreakdown && (
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
                Tap to see what drives this score
              </div>
            )}
          </div>

          {/* ---- Expanded breakdown ---- */}
          {showBreakdown && (
            <div style={{
              marginTop: 16,
              paddingTop: 16,
              borderTop: '1px solid #E5E7EB',
            }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#0D1117', marginBottom: 4 }}>
                Your score of {risk.score} is made up of three things.
              </div>
              <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>
                Tap any component to see the specific incidents driving it.
              </div>

              <ScoreComponent
                label="Base history"
                value={risk.base}
                max={75}
                color="#374151"
                points={`${risk.base} points`}
                expanded={expandedComponent === 'base'}
                onToggle={() => setExpandedComponent(expandedComponent === 'base' ? null : 'base')}
                summary={`${risk.closeCount + risk.nearCount} incidents near your campus in the last 30 days, weighted by how serious they were and how close they happened.`}
                detail={`Your base score of ${risk.base} reflects ${risk.closeCount + risk.nearCount} incidents within 1 mile over the last 30 days. Homicides within 0.25mi score highest (20 pts). Narcotics beyond 1mi score lowest. This component changes slowly as incidents age out.`}
              />
              <ScoreComponent
                label="Acute activity"
                value={risk.acute}
                max={40}
                color={risk.acute > 0 ? '#DC2626' : '#374151'}
                points={`${risk.acute} points`}
                expanded={expandedComponent === 'acute'}
                onToggle={() => setExpandedComponent(expandedComponent === 'acute' ? null : 'acute')}
                summary={risk.acute > 0
                  ? `Recent incidents within the last 6 hours are driving this score up.`
                  : `No significant incidents in the last 6 hours. This is good.`}
                detail={risk.acute > 0
                  ? `Your acute score of ${risk.acute} is driven by incidents within the last 6 hours. Homicides and weapons violations near campus produce the highest acute scores. This component responds fastest to changing conditions.`
                  : `No significant incidents in the last 6 hours. This component is 0, which means no urgent threats are present right now. It would rise rapidly if a homicide or weapons violation occurred nearby.`}
              />
              <ScoreComponent
                label="Seasonal context"
                value={risk.seasonal}
                max={26}
                color="#374151"
                points={`${risk.seasonal} points`}
                expanded={expandedComponent === 'seasonal'}
                onToggle={() => setExpandedComponent(expandedComponent === 'seasonal' ? null : 'seasonal')}
                summary={`${new Date().toLocaleDateString('en-US', { weekday: 'long' })} patterns and current temperature contribute to this score.`}
                detail={`Your seasonal score of ${risk.seasonal} accounts for day-of-week patterns (Fridays +8 pts, Saturdays +6 pts), summer months (June +10, July +8), and high temperatures (above 88°F adds +8 pts). These patterns are based on decades of Chicago crime data.`}
              />
              {risk.shotSpotterBonus > 0 && (
                <ScoreComponent
                  label="ShotSpotter detection"
                  value={risk.shotSpotterBonus}
                  max={25}
                  color="#0F766E"
                  points={`${risk.shotSpotterBonus} points`}
                  expanded={expandedComponent === 'shot'}
                  onToggle={() => setExpandedComponent(expandedComponent === 'shot' ? null : 'shot')}
                  summary="Gunfire detected near campus by acoustic sensors in the last 2 hours."
                  detail={`ShotSpotter detected gunfire near your campus in the last 2 hours. This acoustic sensor network provides earlier detection than CPD incident reports and adds ${risk.shotSpotterBonus} pts to your score.`}
                />
              )}
            </div>
          )}
        </div>

      </div>

      {/* ---- Action modal: What does this mean for me today? ---- */}
      {showActionModal && (
        <ExplainModal title="What This Means For You Today" onClose={() => setShowActionModal(false)}>
          <p style={{ marginTop: 0, fontSize: 16, fontWeight: 600, color: '#0D1117' }}>
            Current Situation
          </p>
          <p style={{ lineHeight: 1.7 }}>{headline} {context}</p>

          <p style={{ fontWeight: 600, color: '#0D1117', marginTop: 20 }}>
            What the research says:
          </p>
          <p style={{ lineHeight: 1.7 }}>
            {risk.inRetaliationWindow
              ? 'The Papachristos social contagion model shows retaliatory violence peaks between 18-72 hours after a homicide. Your campus is in this window. The risk is specific, measurable, and time-limited.'
              : risk.contagionZones.some(z => z.phase === 'ACUTE')
                ? 'University of Chicago research shows elevated violence risk for up to 125 days after a nearby homicide, with the highest risk in the first 72 hours.'
                : risk.label === 'LOW'
                  ? 'Current conditions are within normal parameters. No elevated risk patterns detected in the research models.'
                  : 'Seasonal patterns and recent incident activity are contributing to elevated risk. These patterns are well-documented in Chicago violence research.'}
          </p>

          <p style={{ fontWeight: 700, fontSize: 18, color: '#0D1117', marginTop: 20, marginBottom: 8 }}>
            What you should do right now:
          </p>
          <ol style={{ paddingLeft: 24, margin: 0 }}>
            {actions.map((action, i) => (
              <li key={i} style={{
                fontSize: 16,
                lineHeight: 1.6,
                marginBottom: 8,
                fontWeight: i === 0 ? 600 : 400,
              }}>
                {action}
              </li>
            ))}
          </ol>

          {recProtocol && onBeginProtocol && (
            <button
              onClick={() => { setShowActionModal(false); onBeginProtocol(recProtocol); }}
              style={{
                width: '100%',
                padding: '14px 20px',
                background: '#0D1117',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: 16,
              }}
            >
              Begin Protocol — Code {recProtocol}
            </button>
          )}
        </ExplainModal>
      )}
    </>
  );
}

/* ---- Score component row ---- */
function ScoreComponent({
  label, value, max, color, points, expanded, onToggle, summary, detail,
}: {
  label: string; value: number; max: number; color: string; points: string;
  expanded: boolean; onToggle: () => void; summary: string; detail: string;
}) {
  const pct = Math.min(100, (value / max) * 100);

  return (
    <div style={{ marginBottom: 4 }}>
      <div
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          cursor: 'pointer',
          padding: '8px 0',
          minHeight: 44,
        }}
      >
        <span style={{
          fontSize: 14,
          fontWeight: 600,
          color: '#0D1117',
          width: 160,
          flexShrink: 0,
        }}>
          {label}
        </span>
        <div style={{ flex: 1, height: 8, background: '#E5E7EB', borderRadius: 4 }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            background: color,
            borderRadius: 4,
            transition: 'width 0.3s ease',
          }} />
        </div>
        <span style={{
          fontSize: 14,
          fontWeight: 700,
          color,
          fontFamily: "'SF Mono', 'Roboto Mono', 'Courier New', monospace",
          width: 36,
          textAlign: 'right',
          flexShrink: 0,
        }}>
          {value}
        </span>
      </div>
      {expanded && (
        <div style={{
          padding: '8px 12px 12px',
          borderLeft: `3px solid ${color}33`,
          marginLeft: 4,
          marginBottom: 8,
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
            {points}: {summary}
          </div>
          <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>
            {detail}
          </div>
        </div>
      )}
    </div>
  );
}
