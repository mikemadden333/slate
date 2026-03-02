import { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import { NOBLE } from '../theme/colors.js';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1000);   // subtitle fades in after logo
    const t2 = setTimeout(() => setPhase(2), 1800);   // gold line expands
    const t3 = setTimeout(() => setFadeOut(true), 3000); // begin dissolve out
    const t4 = setTimeout(() => onComplete(), 4000);   // unmount after dissolve

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: NOBLE.navy,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: fadeOut ? 0 : 1,
      transform: fadeOut ? 'scale(1.03)' : 'scale(1)',
      filter: fadeOut ? 'blur(4px)' : 'blur(0px)',
      transition: 'opacity 1.0s ease-in-out, transform 1.0s ease-in-out, filter 1.0s ease-in-out',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
      }}>
        {/* Shield Logo + Text */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          opacity: 1,
          transform: 'scale(1)',
          animation: 'splash-logo-in 1.0s ease-out both',
        }}>
          <Shield size={56} color={NOBLE.gold} strokeWidth={1.8} />
          <div>
            <div style={{
              fontSize: 42,
              fontWeight: 800,
              color: '#FFFFFF',
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '0.06em',
              lineHeight: 1,
            }}>
              NOBLE
            </div>
            <div style={{
              fontSize: 28,
              fontWeight: 600,
              color: '#FFFFFF',
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '0.12em',
              lineHeight: 1.2,
            }}>
              SCHOOLS
            </div>
          </div>
        </div>

        {/* Subtitle */}
        <div style={{
          marginTop: 20,
          fontSize: 16,
          fontFamily: "'Inter', sans-serif",
          fontWeight: 500,
          color: NOBLE.gold,
          textTransform: 'uppercase',
          letterSpacing: '3px',
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}>
          Financial Intelligence Platform
        </div>

        {/* Gold line */}
        <div style={{
          marginTop: 16,
          height: 2,
          background: NOBLE.gold,
          borderRadius: 1,
          width: phase >= 2 ? 200 : 0,
          transition: 'width 0.6s ease',
        }} />
      </div>

      <style>{`
        @keyframes splash-logo-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
