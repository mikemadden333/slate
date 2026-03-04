/**
 * SplashScreen — "Know. Prepare. Protect."
 * Deep navy overlay. Slate mark. Three words fade in 400ms apart.
 * Total: 2.4s, then fades away in 800ms.
 * Once per calendar day via localStorage.
 */

import { useState, useEffect } from 'react';

const SPLASH_KEY = 'pulse_splash_date';

export function shouldShowSplash(): boolean {
  const today = new Date().toDateString();
  return localStorage.getItem(SPLASH_KEY) !== today;
}

export function markSplashShown(): void {
  localStorage.setItem(SPLASH_KEY, new Date().toDateString());
}

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0); // 0=blank, 1=Know, 2=Prepare, 3=Protect, 4=fade out, 5=done

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 600),
      setTimeout(() => setPhase(3), 1000),
      setTimeout(() => setPhase(4), 1600),
      setTimeout(() => {
        setPhase(5);
        markSplashShown();
        onComplete();
      }, 2400),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  if (phase === 5) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 10000,
      background: '#121315',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 32,
      opacity: phase === 4 ? 0 : 1,
      transition: 'opacity 800ms ease-out',
    }}>
      {/* Slate mark */}
      <svg width="80" height="96" viewBox="0 0 80 96" fill="none" style={{
        opacity: phase >= 1 ? 1 : 0,
        transition: 'opacity 400ms ease',
      }}>
        <path
          d="M40 4L8 20v28c0 22.4 13.6 43.2 32 52 18.4-8.8 32-29.6 32-52V20L40 4z"
          fill="#F0B429"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="3"
        />
        <path
          d="M40 16L18 28v18c0 16.8 9.6 32.4 22 39 12.4-6.6 22-22.2 22-39V28L40 16z"
          fill="rgba(255,255,255,0.15)"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="1"
        />
        <text x="40" y="56" textAnchor="middle" fill="#121315"
          fontFamily="system-ui" fontSize="18" fontWeight="800" letterSpacing="2">
          N
        </text>
      </svg>

      {/* Three words */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        <Word text="Know." visible={phase >= 1} />
        <Word text="Prepare." visible={phase >= 2} />
        <Word text="Protect." visible={phase >= 3} gold />
      </div>
    </div>
  );
}

function Word({ text, visible, gold }: { text: string; visible: boolean; gold?: boolean }) {
  return (
    <span style={{
      fontSize: 32,
      fontWeight: gold ? 700 : 300,
      color: gold ? '#F0B429' : '#fff',
      letterSpacing: 3,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(8px)',
      transition: 'opacity 400ms ease, transform 400ms ease',
    }}>
      {text}
    </span>
  );
}
