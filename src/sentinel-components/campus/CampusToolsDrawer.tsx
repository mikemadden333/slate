import { useState } from 'react';

interface Props {
  children: React.ReactNode;
}

export default function CampusToolsDrawer({ children }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ borderTop: '1px solid #E7E2D8', paddingTop: 8 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '14px 0',
          background: 'transparent', border: 'none',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: 'pointer', fontSize: 13, fontWeight: 600,
          color: '#6B7280',
        }}
      >
        <span>Tools & Details</span>
        <span style={{
          fontSize: 11, fontWeight: 500,
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease',
          display: 'inline-block',
        }}>▼</span>
      </button>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 8 }}>
          {children}
        </div>
      )}
    </div>
  );
}
