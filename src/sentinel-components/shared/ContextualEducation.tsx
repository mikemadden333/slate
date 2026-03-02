/**
 * ContextualEducation — Teaches at the exact moment a concept is relevant.
 *
 * Six concepts:
 * 1. First ELEVATED label
 * 2. First ACUTE contagion zone
 * 3. First retaliation window → triggers full modal (handled by RetaliationBanner)
 * 4. First score jump > 15 points
 * 5. First ICE alert → full Code White explainer
 * 6. First Friday afternoon
 *
 * Cards slide in from bottom, never block the UI, persist via localStorage.
 */

import { useState, useEffect } from 'react';
import { useFirstSeen } from '../../sentinel-hooks/useFirstSeen';
import type { CampusRisk, IceAlert } from '../../sentinel-engine/types';

const SLIDE_IN_KEYFRAMES = `
@keyframes slideInBottom {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

interface Props {
  risk: CampusRisk;
  iceAlerts: IceAlert[];
  lastScore?: number;
  dataLoaded?: boolean;
}

export default function ContextualEducation({ risk, iceAlerts, lastScore, dataLoaded }: Props) {
  return (
    <>
      <style>{SLIDE_IN_KEYFRAMES}</style>
      <ElevatedFirstSeen risk={risk} />
      <AcuteFirstSeen risk={risk} />
      <ScoreJumpFirstSeen risk={risk} lastScore={lastScore} />
      <IceFirstSeen iceAlerts={iceAlerts} dataLoaded={!!dataLoaded} />
      <FridayAfternoonFirstSeen />
    </>
  );
}

/* ---- Card wrapper ---- */
function EducationCard({ children, borderColor, onGotIt, onDismiss }: {
  children: React.ReactNode;
  borderColor: string;
  onGotIt: () => void;
  onDismiss: () => void;
}) {
  return (
    <div style={{
      border: `2px solid ${borderColor}`,
      borderRadius: 12,
      padding: '16px 18px',
      marginBottom: 16,
      background: '#fff',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      animation: 'slideInBottom 300ms ease',
    }}>
      {children}
      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
        <button onClick={onGotIt} style={{
          padding: '8px 16px', borderRadius: 6,
          background: borderColor, color: '#fff',
          border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          Got it
        </button>
        <button onClick={onDismiss} style={{
          padding: '8px 16px', borderRadius: 6,
          background: 'transparent', color: '#6B7280',
          border: '1px solid #E5E7EB', fontSize: 13, cursor: 'pointer',
        }}>
          Don't show again
        </button>
      </div>
    </div>
  );
}

/* ---- Concept 1: First ELEVATED ---- */
function ElevatedFirstSeen({ risk }: { risk: CampusRisk }) {
  const { seen, markSeen, markDismissed } = useFirstSeen('elevated_label');
  if (seen || risk.label === 'LOW') return null;

  return (
    <EducationCard borderColor="#D97706" onGotIt={markSeen} onDismiss={markDismissed}>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#D97706', marginBottom: 8 }}>
        Your campus just moved to ELEVATED.
      </div>
      <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.7 }}>
        This means a contagion-category crime — a shooting, weapons violation, or homicide — occurred
        within 1 mile in the last 72 hours. ELEVATED doesn't mean danger is certain.
        It means something happened nearby that warrants your awareness and may warrant adjusted protocols.
      </div>
    </EducationCard>
  );
}

/* ---- Concept 2: First ACUTE contagion zone ---- */
function AcuteFirstSeen({ risk }: { risk: CampusRisk }) {
  const { seen, markSeen, markDismissed } = useFirstSeen('acute_zone');
  const hasAcute = risk.contagionZones.some(z => z.phase === 'ACUTE');
  if (seen || !hasAcute) return null;

  return (
    <EducationCard borderColor="#DC2626" onGotIt={markSeen} onDismiss={markDismissed}>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#DC2626', marginBottom: 8 }}>
        You're seeing an ACUTE zone for the first time.
      </div>
      <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.7 }}>
        This is the most serious phase of the violence contagion model developed by Professor Andrew Papachristos at Yale.
        When a homicide occurs near a campus, Sentinel tracks the 125-day window of elevated risk it creates — with the first
        72 hours being the most dangerous. This is peer-reviewed science, not speculation.
      </div>
    </EducationCard>
  );
}

/* ---- Concept 4: First score jump > 15 ---- */
function ScoreJumpFirstSeen({ risk, lastScore }: { risk: CampusRisk; lastScore?: number }) {
  const { seen, markSeen, markDismissed } = useFirstSeen('score_jump');
  if (seen || lastScore == null) return null;
  const jump = risk.score - lastScore;
  if (jump < 15) return null;

  return (
    <EducationCard borderColor="#1B3A6B" onGotIt={markSeen} onDismiss={markDismissed}>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#1B3A6B', marginBottom: 8 }}>
        Your score just jumped {jump} points.
      </div>
      <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.7 }}>
        The score responds to real events in real time — when something happens near your campus,
        the score moves immediately to reflect it. This jump indicates a significant event
        was recently reported near your neighborhood.
      </div>
    </EducationCard>
  );
}

/* ---- Concept 5: First ICE alert — full modal ---- */
function IceFirstSeen({ iceAlerts, dataLoaded }: { iceAlerts: IceAlert[]; dataLoaded: boolean }) {
  const { seen, markSeen, markDismissed } = useFirstSeen('ice_alert');
  const [showModal, setShowModal] = useState(false);

  // The ICE explainer modal must ONLY appear when ALL of these are true:
  // 1. There is a CONFIRMED (not REPORTED) ICE alert
  // 2. The alert is within 0.5 miles of the selected campus
  // 3. The user has not seen this specific alert before
  // 4. NOT on initial app load — only after data has fully loaded
  const hasConfirmedNearby = iceAlerts.some(a =>
    a.confidence === 'CONFIRMED' &&
    a.distanceFromCampus != null &&
    a.distanceFromCampus > 0 &&
    a.distanceFromCampus <= 0.5,
  );

  useEffect(() => {
    if (!seen && dataLoaded && hasConfirmedNearby) {
      setShowModal(true);
    }
  }, [seen, dataLoaded, hasConfirmedNearby]);

  if (seen || !hasConfirmedNearby) return null;

  if (!showModal) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, maxWidth: 500, width: '90%',
        maxHeight: '85vh', overflowY: 'auto', padding: '24px',
        border: '3px solid #7C3AED',
      }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#7C3AED', marginBottom: 16 }}>
          Immigration Enforcement Alert — What You Need to Know
        </div>

        <div style={{ fontSize: 15, color: '#374151', lineHeight: 1.7, marginBottom: 16 }}>
          <strong>Noble Schools follows Chicago's Welcoming City Ordinance.</strong> This means
          ICE agents must present a criminal judicial warrant signed by a federal judge to enter
          our buildings. Administrative warrants are NOT sufficient.
        </div>

        <div style={{ fontSize: 15, color: '#374151', lineHeight: 1.7, marginBottom: 16 }}>
          <strong>What ICE cannot do:</strong> Enter school buildings without a criminal warrant.
          Detain students or staff inside schools. Access student records without consent.
        </div>

        <div style={{ fontSize: 15, color: '#374151', lineHeight: 1.7, marginBottom: 16 }}>
          <strong>Code White steps:</strong>
        </div>
        <ol style={{ paddingLeft: 20, fontSize: 14, lineHeight: 1.8, color: '#374151', marginBottom: 16 }}>
          <li>Lock all exterior doors immediately</li>
          <li>No one enters without Noble School ID</li>
          <li>Contact Noble Legal immediately</li>
          <li>Do NOT mention ICE or immigration in PA announcements</li>
          <li>Prepare family notification (carefully worded)</li>
        </ol>

        <div style={{
          fontSize: 14, color: '#DC2626', fontWeight: 600, lineHeight: 1.6,
          padding: '12px 14px', background: '#FEF2F2', borderRadius: 8, marginBottom: 16,
        }}>
          Critical: Never mention ICE, immigration, or the nature of the alert in any
          PA announcement or family communication. Many Noble families include undocumented
          individuals who could be endangered by such information.
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => { setShowModal(false); markSeen(); }} style={{
            padding: '12px 20px', borderRadius: 8,
            background: '#7C3AED', color: '#fff',
            border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', flex: 1,
          }}>
            I understand
          </button>
          <button onClick={() => { setShowModal(false); markDismissed(); }} style={{
            padding: '12px 20px', borderRadius: 8,
            background: '#F3F4F6', color: '#6B7280',
            border: 'none', fontSize: 13, cursor: 'pointer',
          }}>
            Don't show again
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---- Concept 6: First Friday afternoon ---- */
function FridayAfternoonFirstSeen() {
  const { seen, markSeen } = useFirstSeen('friday_afternoon');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const now = new Date();
    if (!seen && now.getDay() === 5 && now.getHours() >= 12) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        markSeen();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [seen, markSeen]);

  if (!visible) return null;

  return (
    <div style={{
      background: '#FEF9EC', border: '1px solid #F0B429',
      borderRadius: 10, padding: '12px 16px', marginBottom: 16,
      animation: 'slideInBottom 300ms ease',
      fontSize: 14, color: '#92400E', lineHeight: 1.6,
    }}>
      Friday afternoons have the highest violence concentration near Noble campuses — 3.2× the Monday morning rate.
      Dismissal protocols deserve extra attention today.
    </div>
  );
}
