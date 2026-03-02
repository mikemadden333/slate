/**
 * RetaliationBanner — Persistent banner below header during active retaliation window.
 * Always visible while scrolling. Never disappears during an active window.
 * Includes progress bar, incident details, and "What does this mean?" modal.
 */

import { useState } from 'react';
import type { RetaliationWindowState } from '../../sentinel-hooks/useRetaliationWindow';
import type { SchoolPeriod } from '../../sentinel-engine/types';

interface Props {
  retWin: RetaliationWindowState;
  campusName: string;
  onBeginProtocol?: (code: string) => void;
}

const BANNER_KEYFRAMES = `
@keyframes retBannerPulse {
  0%, 100% { border-color: #DC262680; }
  50% { border-color: #DC2626; }
}
@keyframes timelineGlow {
  0%, 100% { box-shadow: 0 0 4px #F0B429; }
  50% { box-shadow: 0 0 10px #F0B429, 0 0 20px #F0B42940; }
}
`;

export default function RetaliationBanner({ retWin, campusName, onBeginProtocol }: Props) {
  const [showModal, setShowModal] = useState(false);

  if (!retWin.active || !retWin.zone) return null;

  const pct = Math.round(retWin.percentComplete);

  return (
    <>
      <style>{BANNER_KEYFRAMES}</style>
      <div style={{
        position: 'fixed',
        top: 72,
        left: 0,
        right: 0,
        zIndex: 999,
        background: '#7F1D1D',
        borderBottom: '2px solid #DC2626',
        animation: 'retBannerPulse 3s ease-in-out infinite',
        padding: '12px 20px',
        color: '#fff',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          {/* Top line */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: 1 }}>
              RETALIATION WINDOW OPEN
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.15)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
              <div style={{
                height: '100%',
                width: `${pct}%`,
                background: 'linear-gradient(90deg, #FCA5A5, #F87171)',
                borderRadius: 4,
                transition: 'width 1s linear',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, opacity: 0.6, marginTop: 3 }}>
              <span>18h</span>
              <span>{pct}% through peak period</span>
              <span>72h</span>
            </div>
          </div>

          {/* Details line */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontSize: 13, opacity: 0.9 }}>
              Homicide · {retWin.distance.toFixed(1)}mi · {retWin.hoursElapsed}h ago · Closes in {retWin.hoursRemaining}h
            </div>
            <button
              onClick={() => setShowModal(true)}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 6,
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                padding: '4px 12px',
                cursor: 'pointer',
              }}
            >
              What does this mean?
            </button>
          </div>
        </div>
      </div>

      {/* "What does this mean?" Full modal */}
      {showModal && (
        <RetaliationExplainModal
          retWin={retWin}
          campusName={campusName}
          onClose={() => setShowModal(false)}
          onBeginProtocol={onBeginProtocol}
        />
      )}
    </>
  );
}

/* ---- Full-screen explainer modal ---- */
function RetaliationExplainModal({ retWin, campusName, onClose, onBeginProtocol }: {
  retWin: RetaliationWindowState;
  campusName: string;
  onClose: () => void;
  onBeginProtocol?: (code: string) => void;
}) {
  const pct = retWin.percentComplete;

  const periodGuidance = getSchoolPeriodGuidance(retWin.schoolPeriod, retWin.hoursElapsed, retWin.minutesToDismissal);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: '#0F172A', color: '#fff',
      overflowY: 'auto',
    }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 20px 40px' }}>
        {/* Close button */}
        <button onClick={onClose} style={{
          position: 'fixed', top: 16, right: 16, zIndex: 2001,
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '50%', width: 40, height: 40,
          color: '#fff', fontSize: 20, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          ✕
        </button>

        {/* Section 1 — Right now */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#F0B429', letterSpacing: 2, marginBottom: 12, textTransform: 'uppercase' }}>
            Right Now
          </div>
          <div style={{ fontSize: 18, lineHeight: 1.7, color: '#E2E8F0' }}>
            {retWin.hoursElapsed} hours ago, a homicide occurred {retWin.distance.toFixed(1)} miles from {campusName} at {retWin.address}.
            Under the Papachristos social contagion model, this has opened an 18-72 hour peak retaliation window.
            You are currently {retWin.hoursElapsed} hours into that window.
            It closes in {retWin.hoursRemaining} hours.
          </div>
        </div>

        {/* Section 2 — What the research says */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#F0B429', letterSpacing: 2, marginBottom: 12, textTransform: 'uppercase' }}>
            What the Research Says
          </div>
          <div style={{ fontSize: 16, lineHeight: 1.7, color: '#CBD5E1' }}>
            The peak retaliation window is the most dangerous period in the 125-day contagion cycle.
            During this window, the probability of retaliatory violence in the affected social network is highest.
            This does not mean violence is certain — it means the risk is elevated and specific actions are warranted.
          </div>
        </div>

        {/* Section 3 — What it means for today */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#F0B429', letterSpacing: 2, marginBottom: 12, textTransform: 'uppercase' }}>
            What It Means for Today
          </div>
          <div style={{ fontSize: 16, lineHeight: 1.7, color: '#CBD5E1' }}>
            {periodGuidance}
          </div>
        </div>

        {/* Section 4 — Three specific actions */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#F0B429', letterSpacing: 2, marginBottom: 12, textTransform: 'uppercase' }}>
            Actions to Take
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {getRetaliationActions(retWin.schoolPeriod, retWin.hoursRemaining).map((action, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, padding: '14px 16px',
                background: 'rgba(255,255,255,0.05)', borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: '#F0B429', color: '#0F172A',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 14, flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <div style={{ fontSize: 15, lineHeight: 1.6, color: '#E2E8F0' }}>
                  {action}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5 — Window tracker timeline */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#F0B429', letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' }}>
            Contagion Timeline
          </div>
          <div style={{ position: 'relative', height: 60, marginBottom: 8 }}>
            {/* Track */}
            <div style={{
              position: 'absolute', top: 20, left: 0, right: 0, height: 4,
              background: 'rgba(255,255,255,0.1)', borderRadius: 2,
            }} />

            {/* Phases */}
            <TimelineMarker left="0%" label="Homicide" sublabel="" top />
            <TimelineMarker left="14.4%" label="18h" sublabel="Window opens" top />
            <TimelineMarker left="57.6%" label="72h" sublabel="Window closes" top />
            <TimelineMarker left="100%" label="125d" sublabel="Zone closes" top={false} />

            {/* Active window highlight */}
            <div style={{
              position: 'absolute', top: 18, left: '14.4%', width: '43.2%', height: 8,
              background: '#DC262660', borderRadius: 4,
            }} />

            {/* NOW marker */}
            <div style={{
              position: 'absolute',
              top: 12,
              left: `${14.4 + (pct / 100) * 43.2}%`,
              transform: 'translateX(-50%)',
              width: 4, height: 20,
              background: '#F0B429',
              borderRadius: 2,
              animation: 'timelineGlow 4s ease-in-out infinite',
            }} />
            <div style={{
              position: 'absolute',
              top: 36,
              left: `${14.4 + (pct / 100) * 43.2}%`,
              transform: 'translateX(-50%)',
              fontSize: 10, fontWeight: 700, color: '#F0B429',
              whiteSpace: 'nowrap',
            }}>
              NOW
            </div>
          </div>
        </div>

        {/* Protocol button */}
        {onBeginProtocol && (
          <button
            onClick={() => { onClose(); onBeginProtocol('YELLOW'); }}
            style={{
              width: '100%', padding: '16px 20px',
              background: '#F0B429', color: '#0F172A',
              border: 'none', borderRadius: 10,
              fontSize: 16, fontWeight: 700, cursor: 'pointer',
              marginTop: 8,
            }}
          >
            Review Code Yellow Protocol
          </button>
        )}
      </div>
    </div>
  );
}

function TimelineMarker({ left, label, sublabel, top }: { left: string; label: string; sublabel: string; top: boolean }) {
  return (
    <div style={{
      position: 'absolute',
      left,
      top: top ? 0 : undefined,
      bottom: top ? undefined : 0,
      transform: 'translateX(-50%)',
      textAlign: 'center',
    }}>
      <div style={{ width: 2, height: 8, background: 'rgba(255,255,255,0.3)', margin: top ? '0 auto 0' : '0 auto' }} />
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', marginTop: 2 }}>
        {label}
      </div>
      {sublabel && <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>{sublabel}</div>}
    </div>
  );
}

function getSchoolPeriodGuidance(period: SchoolPeriod, hoursElapsed: number, minutesToDismissal: number): string {
  switch (period) {
    case 'PRE_SCHOOL':
    case 'ARRIVAL':
      return `Your arrivals this morning occur during the retaliation window. Consider stationed staff at all entrances and primary student walking routes.`;
    case 'SCHOOL_DAY':
      if (minutesToDismissal > 0 && minutesToDismissal <= 240) {
        const h = Math.floor(minutesToDismissal / 60);
        const m = minutesToDismissal % 60;
        return `TODAY'S DISMISSAL IS THE MOST CRITICAL MOMENT. Your dismissal occurs ${hoursElapsed} hours into the retaliation window${h > 0 ? ` — ${h}h ${m}m from now` : ''}. Review Code Yellow protocol now.`;
      }
      return `Your campus is in session during the retaliation window. Standard protocols apply. Ensure all staff are aware of elevated conditions.`;
    case 'DISMISSAL':
      return `YOUR DISMISSAL IS HAPPENING DURING THE RETALIATION WINDOW. This is the highest-risk moment. Ensure all exits are staffed, walking routes are monitored, and consider staggered release.`;
    case 'AFTER_SCHOOL':
    case 'OVERNIGHT':
      return `The highest-risk period for today has passed. Tomorrow morning arrivals will still occur within the window if it remains open.`;
    default:
      return `The retaliation window is active. Standard heightened protocols apply.`;
  }
}

function getRetaliationActions(period: SchoolPeriod, hoursRemaining: number): string[] {
  const actions: string[] = [];

  if (period === 'PRE_SCHOOL' || period === 'ARRIVAL') {
    actions.push('Station an adult at every entrance and the first two blocks of each primary student walking route.');
    actions.push('Brief your security team on the specific homicide location and direction from campus before first bell.');
    actions.push('Prepare a modified dismissal plan now — don\'t wait until afternoon to decide.');
  } else if (period === 'DISMISSAL') {
    actions.push('Execute modified dismissal — staggered release, all exits staffed, walking route monitors deployed.');
    actions.push('Hold students inside if any new incident occurs near campus in the next hour.');
    actions.push('Send a brief family notification about modified procedures (do not reference the homicide directly).');
  } else {
    actions.push('Brief all staff on elevated conditions — they should be aware without alarming students.');
    actions.push(`Review Safe Corridors below and prepare modified routes for dismissal in ${hoursRemaining > 4 ? 'the coming hours' : 'the next few hours'}.`);
    actions.push('Contact Noble Network Safety Director to coordinate with nearby campuses in the same contagion zone.');
  }

  return actions;
}
