/**
 * CampusSelector — Full-screen campus selection on first visit of the day.
 * Noble navy background, gold accents.
 * Option 1: Select a campus from searchable dropdown → My Campus view
 * Option 2: Go to Network view
 * Remembers selection in localStorage.
 */

import { useState } from 'react';
import { CAMPUSES } from '../../sentinel-data/campuses';
import { Search } from 'lucide-react';

const CAMPUS_KEY = 'pulse_last_campus';
const SELECTOR_KEY = 'pulse_selector_session';

export function shouldShowSelector(): boolean {
  // Show if no session marker AND no remembered campus from today
  return !sessionStorage.getItem(SELECTOR_KEY);
}

export function getLastCampusId(): number | null {
  const val = localStorage.getItem(CAMPUS_KEY);
  if (!val) return null;
  const id = Number(val);
  if (CAMPUSES.some(c => c.id === id)) return id;
  return null;
}

export function saveSelectedCampus(id: number): void {
  localStorage.setItem(CAMPUS_KEY, String(id));
  sessionStorage.setItem(SELECTOR_KEY, '1');
}

export function markSelectorDismissed(): void {
  sessionStorage.setItem(SELECTOR_KEY, '1');
}

interface Props {
  onSelectCampus: (id: number) => void;
  onSelectNetwork: () => void;
}

export default function CampusSelector({ onSelectCampus, onSelectNetwork }: Props) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(getLastCampusId());

  const sorted = [...CAMPUSES].sort((a, b) => a.name.localeCompare(b.name));
  const filtered = search.trim()
    ? sorted.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.communityArea.toLowerCase().includes(search.toLowerCase()) ||
        c.short.toLowerCase().includes(search.toLowerCase())
      )
    : sorted;

  const handleGoCampus = () => {
    if (selectedId == null) return;
    saveSelectedCampus(selectedId);
    onSelectCampus(selectedId);
  };

  const handleGoNetwork = () => {
    markSelectorDismissed();
    onSelectNetwork();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: '#1B3A6B',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      overflowY: 'auto',
    }}>
      {/* Noble shield */}
      <svg width="56" height="68" viewBox="0 0 80 96" fill="none" style={{ marginBottom: 20 }}>
        <path
          d="M40 4L8 20v28c0 22.4 13.6 43.2 32 52 18.4-8.8 32-29.6 32-52V20L40 4z"
          fill="#F0B429" stroke="rgba(255,255,255,0.9)" strokeWidth="3"
        />
        <text x="40" y="56" textAnchor="middle" fill="#1B3A6B"
          fontFamily="system-ui" fontSize="18" fontWeight="800">N</text>
      </svg>

      <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 6, textAlign: 'center' }}>
        Welcome to PULSE
      </div>
      <div style={{ fontSize: 18, color: '#F0B429', marginBottom: 32, textAlign: 'center' }}>
        Select your campus or view the Noble network
      </div>

      <div style={{
        display: 'flex',
        gap: 20,
        flexWrap: 'wrap',
        justifyContent: 'center',
        maxWidth: 700,
        width: '100%',
      }}>
        {/* Option 1: My Campus */}
        <div style={{
          flex: '1 1 300px',
          background: '#fff',
          borderRadius: 16,
          padding: 24,
          border: '2px solid #1B3A6B',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}>
          <div style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#1B3A6B',
            paddingLeft: 12,
            borderLeft: '3px solid #F0B429',
          }}>
            My Campus
          </div>

          {/* Search input */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            border: '1px solid #D1D5DB',
            borderRadius: 8,
            background: '#F9FAFB',
          }}>
            <Search size={16} style={{ color: '#9CA3AF', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search campuses..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: 15,
                color: '#111827',
                width: '100%',
              }}
            />
          </div>

          {/* Campus list */}
          <div style={{
            maxHeight: 220,
            overflowY: 'auto',
            border: '1px solid #E5E7EB',
            borderRadius: 8,
          }}>
            {filtered.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                  padding: '10px 14px',
                  border: 'none',
                  borderBottom: '1px solid #F3F4F6',
                  background: selectedId === c.id ? '#EEF2F9' : '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div>
                  <div style={{
                    fontSize: 14,
                    fontWeight: selectedId === c.id ? 700 : 500,
                    color: selectedId === c.id ? '#1B3A6B' : '#374151',
                  }}>
                    {c.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>{c.communityArea}</div>
                </div>
                {selectedId === c.id && (
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: '#F0B429', flexShrink: 0,
                  }} />
                )}
              </button>
            ))}
          </div>

          <button
            onClick={handleGoCampus}
            disabled={selectedId == null}
            style={{
              padding: '14px 20px',
              background: selectedId != null ? '#1B3A6B' : '#9CA3AF',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 600,
              cursor: selectedId != null ? 'pointer' : 'default',
              opacity: selectedId != null ? 1 : 0.6,
            }}
          >
            Go to My Campus →
          </button>
        </div>

        {/* Option 2: Noble Network */}
        <div style={{
          flex: '1 1 300px',
          background: '#fff',
          borderRadius: 16,
          padding: 24,
          border: '2px solid #1B3A6B',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}>
          <div style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#1B3A6B',
            paddingLeft: 12,
            borderLeft: '3px solid #F0B429',
          }}>
            Noble Network
          </div>

          <div style={{ fontSize: 15, color: '#374151', lineHeight: 1.6, flex: 1 }}>
            View all 18 campuses &mdash; network intelligence, maps, analytics, and command center.
          </div>

          <div style={{
            padding: '12px 16px',
            background: '#FEF9EC',
            borderRadius: 8,
            fontSize: 13,
            color: '#1B3A6B',
            lineHeight: 1.5,
          }}>
            Network dashboard, campus ranking, contagion map, and executive intelligence.
          </div>

          <button
            onClick={handleGoNetwork}
            style={{
              padding: '14px 20px',
              background: '#1B3A6B',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Go to Network View →
          </button>
        </div>
      </div>
    </div>
  );
}
