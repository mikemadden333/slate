import { useState } from 'react';
import { NOBLE, BG, TEXT } from '../theme/colors';

interface TabBarProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function TabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  return (
    <div style={{
      display: 'flex',
      gap: 4,
      borderBottom: `1px solid ${BG.border}`,
    }}>
      {tabs.map(tab => (
        <TabButton
          key={tab}
          label={tab}
          active={tab === activeTab}
          onClick={() => onTabChange(tab)}
        />
      ))}
    </div>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '10px 20px',
        fontSize: 14,
        fontFamily: "'Inter', sans-serif",
        fontWeight: active ? 600 : 400,
        color: active ? NOBLE.navy : hovered ? TEXT.primary : TEXT.muted,
        background: 'transparent',
        border: 'none',
        borderBottom: active ? `2px solid ${NOBLE.navy}` : '2px solid transparent',
        cursor: 'pointer',
        transition: 'color 0.15s ease',
      }}
    >
      {label}
    </button>
  );
}
