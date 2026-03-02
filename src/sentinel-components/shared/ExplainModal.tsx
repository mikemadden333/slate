/**
 * ExplainModal — Reusable "What is this?" overlay.
 * Plain-English explanations for every technical concept in Sentinel.
 * Clicking the backdrop closes the modal.
 */

import { X } from 'lucide-react';

interface Props {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export default function ExplainModal({ title, onClose, children }: Props) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 5000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 16,
          maxWidth: 480,
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid #E5E7EB',
        }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#0D1117' }}>
            {title}
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#F3F4F6',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              padding: 6,
              color: '#6B7280',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: 20,
          fontSize: 14,
          lineHeight: 1.7,
          color: '#374151',
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/** Reusable "What is this?" link */
export function ExplainLink({
  onClick,
  label,
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: '#6B7280',
        fontSize: 12,
        padding: 0,
        textDecoration: 'underline',
        textDecorationStyle: 'dotted' as const,
        textUnderlineOffset: 2,
      }}
    >
      {label ?? 'What is this?'}
    </button>
  );
}
