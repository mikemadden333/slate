/**
 * SlateShell — App shell for the Slate platform.
 *
 * Provides:
 * - Dark sidebar with all Slate module navigation
 * - Watch module active state
 * - ASK SLATE persistent conversational bar at bottom
 * - WatchContext provider for cross-module state sharing
 *
 * What this file does NOT do:
 * - Touch any module internals (Ledger, Scholar, Roster, etc.)
 * - Modify any existing component logic
 * - Break any existing routing
 */
import { useState, useRef, useEffect } from 'react';
import { WatchContext } from './contexts/WatchContext';
import type { WatchState } from './contexts/WatchContext';

// ─── MODULE CONFIG ────────────────────────────────────────────────────────────
// Add href when a module has a real route. Leave blank to keep dimmed.

const MODULES = [
  { id: 'dashboard',  label: 'Dashboard',  icon: '⊞', active: false, href: '' },
  { id: 'briefing',   label: 'Briefing',   icon: '≡',  active: false, href: '' },
  { id: 'signal',     label: 'Signal',     icon: '◎',  active: false, href: '' },
  { id: 'watch',      label: 'Watch',      icon: '👁',  active: true,  href: '' },
  { id: 'ledger',     label: 'Ledger',     icon: '▤',  active: false, href: '' },
  { id: 'scholar',    label: 'Scholar',    icon: '◑',  active: false, href: '' },
  { id: 'roster',     label: 'Roster',     icon: '◻',  active: false, href: '' },
  { id: 'draft',      label: 'Draft',      icon: '✎',  active: false, href: '' },
  { id: 'guard',      label: 'Guard',      icon: '⬡',  active: false, href: '' },
  { id: 'grounds',    label: 'Grounds',    icon: '⌖',  active: false, href: '' },
  { id: 'civic',      label: 'Civic',      icon: '⊕',  active: false, href: '' },
  { id: 'raise',      label: 'Raise',      icon: '♥',  active: false, href: '', accent: true },
  { id: 'admin',      label: 'Admin',      icon: '⚙',  active: false, href: '' },
];

// ─── COLORS ──────────────────────────────────────────────────────────────────

const C = {
  sidebar:     '#171A20',
  sidebarBg:   '#1C2029',
  sidebarHover:'#23272F',
  active:      '#D45B4F',
  activeBg:    'rgba(212,91,79,.12)',
  accent:      '#B79145',
  white:       '#FFFFFF',
  dim:         'rgba(255,255,255,.35)',
  dimHover:    'rgba(255,255,255,.65)',
  brand:       '#FFFFFF',
  cream:       '#F7F5F1',
  chalk:       '#E7E2D8',
  deep:        '#121315',
  mid:         '#4B5563',
  light:       '#9CA3AF',
};

// ─── ASK SLATE MESSAGE TYPE ───────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

// ─── ASK SLATE BAR ────────────────────────────────────────────────────────────

const AskSlateBar = ({ watchState }: { watchState: WatchState }) => {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading]   = useState(false);
  const inputRef  = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Suggested prompts
  const suggestions = [
    'Which campuses should I worry about?',
    'What happened overnight?',
    'Show me the contagion zones',
    'What should I tell my principals?',
  ];

  // Auto-scroll on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const buildSystemPrompt = () => {
    const ctx = watchState;
    return `You are ASK SLATE — the AI intelligence assistant for Slate Watch, a safety intelligence platform for charter school networks.

Current network state:
- ${ctx.campusCount} campuses monitored
- ${ctx.elevatedCount} campuses at elevated status
- ${ctx.violentIncidents24h} violent incidents near campuses in the last 24 hours
- ${ctx.contagionZones} active contagion zones
- ${ctx.retaliationWindows} retaliation windows open
- ${ctx.iceAlerts} ICE enforcement alerts
- ${ctx.sourcesLive}/10 intelligence sources live
- Selected campus: ${ctx.selectedCampusName || 'Network view'}

Rules:
- You are briefing a senior school network leader (CEO, COO, Chief of Schools).
- Plain declarative sentences. No hedging. No "it appears."
- Be direct and actionable. Name specific campuses when relevant.
- Keep responses concise — 2-4 sentences unless asked for more.
- You can reference the live network data above in your answers.
- If asked something outside your data, say so clearly and briefly.`;
  };

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setQuery('');
    setLoading(true);

    try {
      const res = await fetch('/api/anthropic-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 400,
          system: buildSystemPrompt(),
          messages: newMessages.map(m => ({ role: m.role, content: m.text })),
        }),
      });
      const data = await res.json();
      const reply = data.content?.find((b: any) => b.type === 'text')?.text || 'Unable to generate response.';
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Connection error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(query); }
    if (e.key === 'Escape') { setOpen(false); }
  };

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 90 }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Chat panel — slides up from bar */}
      {open && (
        <div style={{
          position: 'absolute', bottom: 56, left: 0, right: 0,
          background: C.white, borderTop: `1px solid ${C.chalk}`,
          borderRadius: '12px 12px 0 0',
          boxShadow: '0 -8px 32px rgba(0,0,0,.1)',
          zIndex: 100, maxHeight: 360, display: 'flex', flexDirection: 'column',
          animation: 'slideUp .2s ease',
        }}>
          <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

          {/* Header */}
          <div style={{ padding: '12px 18px 8px', borderBottom: `1px solid ${C.chalk}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: C.active }}>ASK SLATE</span>
              <span style={{ fontSize: 11, color: C.light }}>· Network intelligence assistant</span>
            </div>
            <button onClick={() => { setOpen(false); setMessages([]); }} style={{ fontSize: 11, color: C.light, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>Clear ×</button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.length === 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 4 }}>
                {suggestions.map(s => (
                  <button key={s} onClick={() => { send(s); }} style={{ fontSize: 12, color: C.mid, background: C.cream, border: `1px solid ${C.chalk}`, borderRadius: 20, padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
                    onMouseEnter={e => { (e.currentTarget.style.background = C.chalk); }}
                    onMouseLeave={e => { (e.currentTarget.style.background = C.cream); }}
                  >{s}</button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
                <div style={{
                  fontSize: 13.5, lineHeight: 1.6, padding: '9px 14px', borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                  background: m.role === 'user' ? C.deep : C.cream,
                  color: m.role === 'user' ? C.white : C.deep,
                  maxWidth: '85%',
                  fontFamily: m.role === 'assistant' ? "Georgia, 'Times New Roman', serif" : 'inherit',
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ padding: '10px 14px', borderRadius: '12px 12px 12px 4px', background: C.cream }}>
                  <span style={{ display: 'flex', gap: 4 }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: C.light, animation: `dot .9s ease-in-out ${i * .2}s infinite alternate` }} />
                    ))}
                  </span>
                  <style>{`@keyframes dot{from{opacity:.3;transform:translateY(0)}to{opacity:1;transform:translateY(-3px)}}`}</style>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bar */}
      <div style={{
        height: 52, background: C.white, borderTop: `1px solid ${C.chalk}`,
        display: 'flex', alignItems: 'center', padding: '0 18px', gap: 12,
        position: 'relative', zIndex: 101,
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: C.active, flexShrink: 0 }}>ASK SLATE</span>
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => setOpen(true)}
          placeholder="Ask anything about your network…"
          style={{ flex: 1, fontSize: 13, color: C.deep, background: 'none', border: 'none', outline: 'none', fontFamily: 'inherit' }}
        />
        {query && (
          <button
            onClick={() => send(query)}
            style={{ fontSize: 11, fontWeight: 600, color: C.white, background: C.active, border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
          >
            Send →
          </button>
        )}
      </div>
    </>
  );
};

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────

const Sidebar = () => {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div style={{
      width: 200, flexShrink: 0, background: C.sidebarBg,
      display: 'flex', flexDirection: 'column',
      height: '100vh', position: 'sticky', top: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.white, letterSpacing: '-.5px', fontFamily: "'Inter', sans-serif" }}>
          Slate<span style={{ color: C.accent }}>.</span>
        </div>
      </div>

      {/* Modules */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {MODULES.map(mod => {
          const isActive  = mod.active;
          const isHovered = hovered === mod.id;
          const isRaise   = mod.accent;

          return (
            <div
              key={mod.id}
              onMouseEnter={() => setHovered(mod.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => mod.href && (window.location.href = mod.href)}
              style={{
                display: 'flex', alignItems: 'center', gap: 11,
                padding: '9px 16px 9px 18px',
                cursor: mod.href || isActive ? 'pointer' : 'default',
                background: isActive ? C.activeBg : isHovered && (mod.href || isActive) ? 'rgba(255,255,255,.04)' : 'transparent',
                borderLeft: isActive ? `2px solid ${C.active}` : '2px solid transparent',
                transition: 'all .12s',
                marginBottom: mod.id === 'watch' ? 4 : 0,
                marginTop: mod.id === 'watch' ? 4 : 0,
              }}
            >
              <span style={{
                fontSize: 14,
                opacity: isActive ? 1 : isRaise ? .9 : .3,
                color: isActive ? C.active : isRaise ? C.accent : C.white,
                width: 18, textAlign: 'center', flexShrink: 0,
              }}>
                {mod.icon}
              </span>
              <span style={{
                fontSize: 13, fontWeight: isActive ? 600 : 400,
                color: isActive ? C.white : isRaise ? `rgba(183,145,58,.85)` : C.dim,
                transition: 'color .12s',
                ...(isHovered && (mod.href || isActive) ? { color: C.white } : {}),
              }}>
                {mod.label}
              </span>
              {isActive && (
                <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: C.active, flexShrink: 0 }} />
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.2)', lineHeight: 1.6 }}>
          Madden Education<br />Advisory
        </div>
      </div>
    </div>
  );
};

// ─── SHELL ────────────────────────────────────────────────────────────────────

interface SlateShellProps {
  children: React.ReactNode;
}

export default function SlateShell({ children }: SlateShellProps) {
  const [watchState, setWatchStateInternal] = useState<WatchState>({
    campusCount: 0,
    elevatedCount: 0,
    violentIncidents24h: 0,
    contagionZones: 0,
    retaliationWindows: 0,
    iceAlerts: 0,
    sourcesLive: 0,
    selectedCampusName: '',
    networkSummaryText: '',
  });

  const setState = (partial: Partial<WatchState>) => {
    setWatchStateInternal(prev => ({ ...prev, ...partial }));
  };

  return (
    <WatchContext.Provider value={{ state: watchState, setState }}>
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#F7F5F1',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}>
        {/* Sidebar */}
        <Sidebar />

        {/* Main content area */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          minHeight: '100vh',
          position: 'relative',
          overflowX: 'hidden',
        }}>
          {/* Scrollable content */}
          <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 52 }}>
            {children}
          </div>

          {/* ASK SLATE — pinned to bottom */}
          <div style={{ position: 'sticky', bottom: 0, zIndex: 100 }}>
            <AskSlateBar watchState={watchState} />
          </div>
        </div>
      </div>
    </WatchContext.Provider>
  );
}

