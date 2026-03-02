/**
 * Explainer — Reusable "?" icon that opens a full-screen explanation modal.
 * Circular ? icon. Full-screen modal slides up on mobile, fades in on desktop.
 * Used throughout Sentinel to explain every technical concept in plain English.
 */

import { useState } from 'react';
import { X, HelpCircle } from 'lucide-react';

interface ExplainerProps {
  title: string;
  children: React.ReactNode;
  size?: number;
}

export default function Explainer({ title, children, size = 18 }: ExplainerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        aria-label={`Explain: ${title}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size + 4,
          height: size + 4,
          borderRadius: '50%',
          border: '1px solid #D1D5DB',
          background: '#F9FAFB',
          cursor: 'pointer',
          padding: 0,
          color: '#6B7280',
          flexShrink: 0,
          transition: 'all 200ms ease',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.background = '#E5E7EB';
          (e.currentTarget as HTMLButtonElement).style.color = '#374151';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background = '#F9FAFB';
          (e.currentTarget as HTMLButtonElement).style.color = '#6B7280';
        }}
      >
        <HelpCircle size={size - 4} />
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 6000,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: 0,
            animation: 'explainerBackdropIn 200ms ease',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '16px 16px 0 0',
              width: '100%',
              maxWidth: 560,
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 -4px 30px rgba(0,0,0,0.25)',
              animation: 'explainerSlideUp 300ms ease',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 24px 16px',
              borderBottom: '1px solid #E5E7EB',
              position: 'sticky',
              top: 0,
              background: '#fff',
              borderRadius: '16px 16px 0 0',
              zIndex: 1,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <HelpCircle size={18} style={{ color: '#F0B429' }} />
                <div style={{ fontWeight: 700, fontSize: 17, color: '#1B3A6B' }}>
                  {title}
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: '#F3F4F6',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  padding: 8,
                  color: '#6B7280',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div style={{
              padding: '20px 24px 32px',
              fontSize: 14,
              lineHeight: 1.8,
              color: '#374151',
            }}>
              {children}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes explainerSlideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes explainerBackdropIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}

/** Inline ? icon that can be placed next to section headers */
export function ExplainerInline({ title, children, size }: ExplainerProps) {
  return <Explainer title={title} size={size}>{children}</Explainer>;
}
