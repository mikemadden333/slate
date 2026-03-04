/**
 * OnboardingRevelation — First-time user revelation sequence.
 * Not a tutorial. A revelation of what the principal didn't know.
 * 4 screens showing the gap Watch closes.
 */

import { useState } from 'react';
import type { Campus } from '../../sentinel-data/campuses';
import { Shield, MapPin, Activity, Bell } from 'lucide-react';

interface Props {
  campus: Campus | null;
  isNetwork?: boolean;
  networkCampusCount?: number;
  incidents30d: number;
  contagionZoneCount: number;
  inContagionZone: boolean;
  onComplete: () => void;
}

export default function OnboardingRevelation({
  campus, incidents30d, contagionZoneCount, inContagionZone, onComplete,
  isNetwork = false, networkCampusCount = 17,
}: Props) {
  const [step, setStep] = useState(0);

  const screens = [
    {
      icon: <MapPin size={48} style={{ color: '#D45B4F' }} />,
      title: 'What You Didn\'t Know',
      body: isNetwork
        ? `In the last 30 days, ${incidents30d} incidents occurred within 1 mile of Noble's ${networkCampusCount} campuses. Principals knew about very few of them. That gap between what happened and what they knew is the problem Watch solves.`
        : `In the last 30 days, ${incidents30d} incidents occurred within 1 mile of ${campus?.name ?? 'your campus'}. You likely knew about very few of them. That gap between what happened and what you knew is the problem Watch solves.`,
      bg: '#FEF2F2',
    },
    {
      icon: <Activity size={48} style={{ color: '#B79145' }} />,
      title: 'Your Neighborhood Right Now',
      body: inContagionZone
        ? isNetwork
          ? `${contagionZoneCount} active violence contagion zone${contagionZoneCount > 1 ? 's' : ''} exist across Noble campuses right now. These zones mean recent homicides have created statistically elevated risk of follow-on violence near those schools.`
          : `${campus?.name ?? 'Your campus'} is currently inside ${contagionZoneCount} violence contagion zone${contagionZoneCount > 1 ? 's' : ''}. This means a recent homicide near your campus has created a statistically elevated risk of follow-on violence. Watch tracks these zones continuously.`
        : isNetwork
          ? `No Noble campus is currently inside a violence contagion zone. Watch monitors all 17 campuses continuously and will alert immediately if that changes. Every homicide within 2 miles creates a 125-day zone.`
          : `${campus?.name ?? 'Your campus'} is not currently inside a violence contagion zone. This is good news — and Watch will alert you immediately if that changes. Every homicide within 2 miles creates a 125-day zone that Watch monitors.`,
      bg: '#FFFBEB',
    },
    {
      icon: <Shield size={48} style={{ color: '#7C3AED' }} />,
      title: 'Intelligence, Not Surveillance',
      body: 'Watch monitors public neighborhood safety signals — not students. It protects the dignity of your community while giving you the information you need. ICE intelligence protects families. Violence intelligence protects operations. Everything is public data, transformed into judgment.',
      bg: '#F5F3FF',
    },
    {
      icon: <Bell size={48} style={{ color: '#16A34A' }} />,
      title: 'Always On. Always Current.',
      body: 'Watch updates continuously — every time you open it, every time you return to it. Before school, during dismissal, after an incident. On quiet days it confirms the quiet. On high-risk days it tells you exactly what is happening and what to do. You will never run a Noble school without this information again.',
      bg: '#DCFCE7',
    },
  ];

  const screen = screens[step];
  const isLast = step === screens.length - 1;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      zIndex: 6000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        background: screen.bg,
        borderRadius: 20,
        maxWidth: 480,
        width: '100%',
        padding: '48px 32px 32px',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ marginBottom: 24 }}>{screen.icon}</div>
        <h2 style={{
          fontSize: 22,
          fontWeight: 800,
          color: '#121315',
          marginBottom: 16,
          lineHeight: 1.2,
        }}>
          {screen.title}
        </h2>
        <p style={{
          fontSize: 15,
          color: '#374151',
          lineHeight: 1.6,
          marginBottom: 32,
        }}>
          {screen.body}
        </p>

        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
          {screens.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: i === step ? '#121315' : '#D1D5DB',
                transition: 'width 0.3s ease',
              }}
            />
          ))}
        </div>

        <button
          onClick={() => isLast ? onComplete() : setStep(s => s + 1)}
          style={{
            background: '#121315',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            padding: '12px 32px',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            width: '100%',
          }}
        >
          {isLast ? 'Begin Using Watch' : 'Continue'}
        </button>

        {!isLast && (
          <button
            onClick={onComplete}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9CA3AF',
              fontSize: 12,
              cursor: 'pointer',
              marginTop: 12,
              padding: 4,
            }}
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
}
