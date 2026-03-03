// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import SentinelApp from "./SentinelApp";
import LedgerApp from "./LedgerApp";
import BriefApp from "./BriefApp";
import RosterApp from "./RosterApp";
import ShieldApp from "./ShieldApp";
import GroundsApp from "./GroundsApp";

const C = {
  deep: "#0D1117", rock: "#1C2333", mid: "#2D3748", light: "#4A5568",
  gold: "#F0B429", chalk: "#E8EDF2", signal: "#0EA5E9", white: "#FFFFFF", bg: "#F5F7FA",
};
const MOD = { sentinel: "#EF4444", ledger: "#F0B429", roster: "#3B82F6", brief: "#10B981", shield: "#8B5CF6", grounds: "#F97316" };

const MODULES = [
  { id: "sentinel", label: "Sentinel", category: "SAFETY INTELLIGENCE", icon: "🛡", color: MOD.sentinel, desc: "Real-time violence intelligence. Campus risk scoring, retaliation window tracking, AI morning briefings.", status: "LIVE", metrics: "17 campuses monitored", tagline: "Know what happened before your students arrive." },
  { id: "ledger", label: "Ledger", category: "FINANCIAL INTELLIGENCE", icon: "📊", color: MOD.ledger, desc: "Budget visibility, cash flow forecasting, variance analysis. CFO-grade financial intelligence.", status: "LIVE", metrics: "$240M budget tracked", tagline: "See your money the way your board needs to." },
  { id: "roster", label: "Roster", category: "ENROLLMENT INTELLIGENCE", icon: "📋", color: MOD.roster, desc: "Enrollment forecasting, recruitment funnel tracking, yield modeling, attrition early warning.", status: "LIVE", metrics: "12,120 students", tagline: "Stop managing enrollment in spreadsheets." },
  { id: "brief", label: "Brief", category: "COMMUNICATIONS INTELLIGENCE", icon: "✉️", color: MOD.brief, desc: "AI-drafted communications grounded in live Slate data. In your voice. Out in seconds.", status: "LIVE", metrics: "Powered by Claude", tagline: "Your voice. Your data. Seconds, not hours." },
  { id: "shield", label: "Shield", category: "RISK MANAGEMENT INTELLIGENCE", icon: "⚖️", color: MOD.shield, desc: "Compliance monitoring, incident tracking, insurance analysis, regulatory deadline tracking.", status: "LIVE", metrics: "12 compliance areas", tagline: "Every deadline. Every policy. Every campus." },
  { id: "grounds", label: "Grounds", category: "OPERATIONS INTELLIGENCE", icon: "🏫", color: MOD.grounds, desc: "Facilities management, capital projects, food service, transportation across all campuses.", status: "LIVE", metrics: "1.5M sq ft managed", tagline: "The building is the first thing families see." },
];

/* ═══════════════════════════════════════════════════════════ */
const GlobalCSS = () => (<style>{`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; }
  body { margin: 0; padding: 0; overflow: hidden; }
  .slate-module-box { overflow: visible; }
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .slate-module-box > * {
    animation: fadeIn 0.35s ease both;
  }
  /* Custom scrollbar — thin, dark, elegant */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(45,55,72,0.25); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(45,55,72,0.45); }
  /* Sidebar nav hover */
  .nav-item { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); border-radius: 10px; }
  .nav-item:hover { background: rgba(255,255,255,0.06); }
  .nav-item.active { background: rgba(255,255,255,0.08); }
  /* Module card hover lift */
  .mod-card { transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
  .mod-card:hover { transform: translateY(-4px); }
  .mod-card:active { transform: translateY(-1px); transition-duration: 0.1s; }
  /* KPI card hover */
  .dash-card { transition: transform 0.2s ease, box-shadow 0.2s ease; cursor: default; }
  .dash-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
  /* Smooth page transitions */
  .slate-module-box { transition: opacity 0.3s ease; }
  /* Selection color */
  ::selection { background: rgba(240,180,41,0.2); color: #0D1117; }
  .dash-card {
    animation: fadeSlideUp 0.5s ease both;
  }
  .dash-card:nth-child(1) { animation-delay: 0.05s; }
  .dash-card:nth-child(2) { animation-delay: 0.1s; }
  .dash-card:nth-child(3) { animation-delay: 0.15s; }
  .dash-card:nth-child(4) { animation-delay: 0.2s; }
  .mod-card {
    animation: fadeSlideUp 0.5s ease both;
  }
  .mod-card:nth-child(1) { animation-delay: 0.15s; }
  .mod-card:nth-child(2) { animation-delay: 0.2s; }
  .mod-card:nth-child(3) { animation-delay: 0.25s; }
  .mod-card:nth-child(4) { animation-delay: 0.3s; }
  .mod-card:nth-child(5) { animation-delay: 0.35s; }
  .mod-card:nth-child(6) { animation-delay: 0.4s; }
  .slate-scroll::-webkit-scrollbar { width: 6px; }
  .slate-scroll::-webkit-scrollbar-track { background: transparent; }
  .slate-scroll::-webkit-scrollbar-thumb { background: ${C.chalk}; border-radius: 3px; }
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
  * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
  @keyframes slateGlow { 0%,100%{opacity:0.04;transform:scale(1)} 50%{opacity:0.08;transform:scale(1.05)} }
  @keyframes slateDotPulse { 0%,100%{box-shadow:0 0 12px currentColor} 50%{box-shadow:0 0 22px currentColor} }
`}</style>);

/* ═══════════════════════════════════════════════════════════
   SPLASH SCREEN — Slow dissolve, readable, corporate
   ═══════════════════════════════════════════════════════════ */
const SplashScreen = ({ onComplete }) => {
  const [p, setP] = useState(0);

  // Stone strike sound — best effort, silent if browser blocks
  useEffect(() => {
    let played = false;
    const playStrike = () => {
      if (played) return;
      played = true;
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const g1 = ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(110, now);
        osc1.frequency.exponentialRampToValueAtTime(82, now + 0.8);
        g1.gain.setValueAtTime(0.18, now);
        g1.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        osc1.connect(g1); g1.connect(ctx.destination);
        osc1.start(now); osc1.stop(now + 1.2);
        const osc2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.value = 220;
        g2.gain.setValueAtTime(0.08, now);
        g2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
        osc2.connect(g2); g2.connect(ctx.destination);
        osc2.start(now + 0.02); osc2.stop(now + 0.9);
        const buf = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.008));
        const click = ctx.createBufferSource();
        const gC = ctx.createGain();
        click.buffer = buf;
        gC.gain.setValueAtTime(0.12, now);
        gC.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        click.connect(gC); gC.connect(ctx.destination);
        click.start(now);
        const osc3 = ctx.createOscillator();
        const g3 = ctx.createGain();
        osc3.type = 'sine';
        osc3.frequency.value = 55;
        g3.gain.setValueAtTime(0.06, now + 0.05);
        g3.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
        osc3.connect(g3); g3.connect(ctx.destination);
        osc3.start(now + 0.05); osc3.stop(now + 2.0);
        setTimeout(() => ctx.close(), 3000);
      } catch (e) {}
      document.removeEventListener('click', playStrike);
      document.removeEventListener('touchstart', playStrike);
    };
    playStrike();
    if (!played) {
      document.addEventListener('click', playStrike, { once: true });
      document.addEventListener('touchstart', playStrike, { once: true });
    }
    return () => {
      document.removeEventListener('click', playStrike);
      document.removeEventListener('touchstart', playStrike);
    };
  }, []);

  // Splash phase timers
  useEffect(() => {
    const t = [
      setTimeout(() => setP(1), 600),
      setTimeout(() => setP(2), 2800),
      setTimeout(() => setP(3), 5000),
      setTimeout(() => setP(4), 7400),
      setTimeout(() => onComplete(), 9800),
    ];
    return () => t.forEach(clearTimeout);
  }, []);
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "linear-gradient(160deg, #161D2F 0%, #0D1117 35%, #1C2333 65%, #161D2F 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      opacity: p >= 4 ? 0 : 1, transition: "opacity 2.2s cubic-bezier(0.4, 0, 0.2, 1)",
    }}>
      <div style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", background: `radial-gradient(circle, ${C.gold}06 0%, transparent 60%)`, top: "35%", left: "50%", transform: "translate(-50%, -50%)", animation: "slateGlow 5s ease-in-out infinite" }} />

      <div style={{ position: "relative", marginBottom: 60, padding: "10px 28px", borderRadius: 24, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.06)", fontSize: 10, fontWeight: 600, letterSpacing: "3px", textTransform: "uppercase", color: "rgba(255,255,255,0.70)", opacity: p >= 1 ? 1 : 0, transition: "opacity 1s ease" }}>
        Platform Design System — Version 2.0 — Confidential
      </div>

      <div style={{ position: "relative", opacity: p >= 1 ? 1 : 0, transform: p >= 1 ? "translateY(0) scale(1)" : "translateY(30px) scale(0.9)", transition: "all 1.4s cubic-bezier(0.16, 1, 0.3, 1)" }}>
        <svg width="80" height="60" viewBox="0 0 40 30" fill="none">
          <path d="M8 2 L36 2 L32 28 L4 28 Z" fill="rgba(255,255,255,0.10)" />
          <path d="M8 2 L36 2 L32 28 L4 28 Z" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
          <line x1="10" y1="13" x2="30" y2="13" stroke={C.chalk} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="10" y1="19" x2="22" y2="19" stroke={C.chalk} strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />
        </svg>
      </div>

      <div style={{ position: "relative", marginTop: 24, fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 900, fontSize: 88, color: C.white, letterSpacing: "-0.04em", lineHeight: 1, opacity: p >= 1 ? 1 : 0, transform: p >= 1 ? "translateY(0)" : "translateY(24px)", transition: "all 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.25s" }}>
        Slate<span style={{ color: C.gold }}>.</span>
      </div>

      <div style={{ position: "relative", marginTop: 28, fontSize: 14, fontWeight: 500, letterSpacing: "8px", textTransform: "uppercase", color: "rgba(255,255,255,0.65)", opacity: p >= 2 ? 1 : 0, transform: p >= 2 ? "translateY(0)" : "translateY(10px)", transition: "all 1s ease" }}>
        Start With The Facts
      </div>

      <div style={{ position: "relative", marginTop: 64, display: "flex", gap: 24, opacity: p >= 2 ? 1 : 0, transition: "opacity 0.8s ease 0.4s" }}>
        {MODULES.map((m, i) => (
          <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, opacity: p >= 2 ? 1 : 0, transition: `opacity 0.6s ease ${0.5 + i * 0.12}s` }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: m.color, boxShadow: `0 0 14px ${m.color}60`, color: m.color, animation: p >= 2 ? "slateDotPulse 3s ease-in-out infinite" : "none", animationDelay: `${i * 0.3}s` }} />
            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", color: m.color }}>{m.label}</span>
          </div>
        ))}
      </div>

      <div style={{ position: "relative", marginTop: 64, fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.50)", letterSpacing: "1.5px", opacity: p >= 3 ? 1 : 0, transition: "opacity 1s ease" }}>
        Intelligence for School Systems
      </div>
      <div style={{ position: "absolute", bottom: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, opacity: p >= 3 ? 1 : 0, transition: "opacity 1s ease 0.4s" }}>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 700 }}>
            Slate Systems, Inc.
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 500 }}>
            Founded by Mike Madden
          </div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Proprietary & Confidential · All Rights Reserved · 2026
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════ */
const ModuleHeader = ({ module: m }) => (
  <div style={{ background: `linear-gradient(135deg, ${C.deep} 0%, ${C.rock} 60%, ${m.color}15 100%)`, borderRadius: 16, padding: "26px 32px", marginBottom: 20, position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", right: -40, top: -40, width: 200, height: 200, borderRadius: "50%", background: m.color, opacity: 0.05 }} />
    <div style={{ position: "absolute", right: 80, bottom: -60, width: 140, height: 140, borderRadius: "50%", background: m.color, opacity: 0.03 }} />
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, position: "relative" }}>
      <svg width="16" height="12" viewBox="0 0 40 30" fill="none"><path d="M8 2 L36 2 L32 28 L4 28 Z" fill="rgba(255,255,255,0.12)" /><line x1="10" y1="13" x2="30" y2="13" stroke={C.chalk} strokeWidth="2.5" strokeLinecap="round" /><line x1="10" y1="19" x2="22" y2="19" stroke={C.chalk} strokeWidth="2.5" strokeLinecap="round" opacity="0.5" /></svg>
      <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.55)", letterSpacing: "2.5px", textTransform: "uppercase" }}>Slate {m.label}</span>
      <span style={{ marginLeft: 8, padding: "2px 10px", borderRadius: 12, background: `${m.color}20`, border: `1px solid ${m.color}35`, fontSize: 9, fontWeight: 700, color: m.color, letterSpacing: "1.5px", textTransform: "uppercase" }}>{m.status}</span>
    </div>
    <div style={{ display: "flex", alignItems: "baseline", gap: 16, position: "relative" }}>
      <span style={{ fontSize: 30, fontWeight: 900, color: C.white, letterSpacing: "-0.03em" }}>{m.label}</span>
      <span style={{ fontSize: 9, fontWeight: 600, color: m.color, letterSpacing: "2.5px", textTransform: "uppercase" }}>{m.category}</span>
    </div>
    <div style={{ fontSize: 14, color: "rgba(255,255,255,0.60)", marginTop: 8, fontStyle: "italic", position: "relative" }}>{m.tagline}</div>
  </div>
);

/* ═══════════════════════════════════════════════════════════ */
const Sidebar = ({ activeModule, setActiveModule, collapsed, setCollapsed }) => {
  const w = collapsed ? 64 : 232;
  return (
    <div style={{ width: w, minWidth: w, height: "100vh", background: C.deep, borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", transition: "width 0.25s ease, min-width 0.25s ease", overflow: "hidden", flexShrink: 0, zIndex: 200 }}>
      <div onClick={() => setActiveModule("dashboard")} style={{ padding: collapsed ? "22px 0" : "22px 24px", display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: 10, cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.06)", minHeight: 72, flexShrink: 0, transition: "opacity 0.2s", }} onMouseEnter={e => e.currentTarget.style.opacity = "0.8"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
        <svg width={collapsed ? 24 : 26} height={collapsed ? 18 : 19.5} viewBox="0 0 40 30" fill="none"><path d="M8 2 L36 2 L32 28 L4 28 Z" fill="rgba(255,255,255,0.12)" /><line x1="10" y1="13" x2="30" y2="13" stroke={C.chalk} strokeWidth="2.5" strokeLinecap="round" /><line x1="10" y1="19" x2="22" y2="19" stroke={C.chalk} strokeWidth="2.5" strokeLinecap="round" opacity="0.5" /></svg>
        {!collapsed && <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 900, fontSize: 18, color: C.white, letterSpacing: "-0.02em" }}>Slate<span style={{ color: C.gold }}>.</span></span>}
      </div>
      <div style={{ flex: 1, padding: "16px 0", overflowY: "auto", flexShrink: 1 }}>
        <NI label="Dashboard" icon="⬡" color={C.gold} active={activeModule === "dashboard"} collapsed={collapsed} onClick={() => setActiveModule("dashboard")} />
        <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "12px 16px" }} />
        {!collapsed && <div style={{ padding: "0 24px", marginBottom: 10, fontSize: 9, fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", color: "rgba(255,255,255,0.32)" }}>Modules</div>}
        {MODULES.map(m => <NI key={m.id} label={m.label} icon={m.icon} color={m.color} active={activeModule === m.id} collapsed={collapsed} onClick={() => setActiveModule(m.id)} />)}
      </div>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        {!collapsed && <div style={{ padding: "14px 24px 4px" }}><div style={{ fontSize: 9, color: "rgba(255,255,255,0.32)", letterSpacing: "1.5px", lineHeight: 1.8, textTransform: "uppercase", fontWeight: 600 }}>Slate Systems, Inc.</div></div>}
        <div onClick={() => setCollapsed(!collapsed)} style={{ padding: "14px 24px", display: "flex", justifyContent: collapsed ? "center" : "flex-end", cursor: "pointer", color: "rgba(255,255,255,0.32)", fontSize: 12 }}>{collapsed ? "▸" : "◂"}</div>
      </div>
    </div>
  );
};
const NI = ({ label, icon, color, active, collapsed, onClick }) => (
  <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 12, padding: collapsed ? "11px 0" : "11px 24px", justifyContent: collapsed ? "center" : "flex-start", cursor: "pointer", margin: "1px 10px", borderRadius: 10, background: active ? `${color}12` : "transparent", borderLeft: active ? `3px solid ${color}` : "3px solid transparent", transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)" }} onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }} onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? `${color}12` : "transparent"; }}>
    <span style={{ fontSize: 15, width: 22, textAlign: "center", flexShrink: 0, filter: active ? `drop-shadow(0 0 6px ${color})` : "none", transform: active ? "scale(1.15)" : "scale(1)", transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)" }}>{icon}</span>
    {!collapsed && <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? "#fff" : "rgba(255,255,255,0.55)", textShadow: active ? `0 0 12px ${color}40` : "none", letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>{label}</span>}
  </div>
);

/* ═══════════════════════════════════════════════════════════ */
const Dashboard = ({ onModuleClick }) => {
  const now = new Date();
  const h = now.getHours();
  const g = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 32, animation: "fadeSlideUp 0.6s ease both" }}>
        <div style={{ fontSize: 32, fontWeight: 900, color: C.deep, letterSpacing: "-0.03em", lineHeight: 1.2 }}>{g}, Mike.</div>
        <div style={{ fontSize: 14, color: C.light, marginTop: 8 }}>17 Campuses · 12,120 Students · {dayName} · {timeStr}</div>
        <div style={{ width: 48, height: 3, background: C.gold, borderRadius: 2, marginTop: 14 }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 36 }}>
        {[{ l: "Campuses", v: "17", s: "All operational", c: MOD.sentinel }, { l: "Students", v: "12,120", s: "98.4% of capacity", c: MOD.roster }, { l: "YTD Budget", v: "+$5.9M", s: "Surplus — tracking ahead", c: MOD.ledger }, { l: "DSCR", v: "3.47x", s: "Covenant: 1.0x", c: MOD.brief }].map((k, i) => (
          <div key={i} className="dash-card" style={{ background: C.white, borderRadius: 14, padding: "22px 24px", borderTop: `3px solid ${k.c}`, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.light, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 6 }}>{k.l}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 700, color: C.deep }}>{k.v}</div>
            <div style={{ fontSize: 12, color: C.light, marginTop: 4 }}>{k.s}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.light, textTransform: "uppercase", letterSpacing: "3px", marginBottom: 18, animation: "fadeSlideUp 0.5s ease 0.12s both" }}>Six Intelligences — One Platform</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
        {MODULES.map((m, idx) => (
          <div key={m.id} className="mod-card" onClick={() => onModuleClick(m.id)} style={{ background: C.white, borderRadius: 16, cursor: "pointer", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", transition: "transform 0.2s ease, box-shadow 0.2s ease" }}>
            <div style={{ height: 3, background: m.color }} />
            <div style={{ padding: "22px 24px 18px" }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: m.color, marginBottom: 12 }}>Module {String(idx + 1).padStart(2, "0")}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}><span style={{ fontSize: 22 }}>{m.icon}</span><span style={{ fontSize: 22, fontWeight: 900, color: C.deep, letterSpacing: "-0.02em" }}>{m.label}</span></div>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: C.light, marginBottom: 10 }}>{m.category}</div>
              <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.65, marginBottom: 16, minHeight: 44 }}>{m.desc}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTop: `1px solid ${C.chalk}` }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: m.color }}>{m.status}</span>
                <span style={{ fontSize: 11, color: C.light, fontFamily: "'JetBrains Mono', monospace" }}>{m.metrics}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 48, padding: "24px 0 16px", borderTop: `1px solid ${C.chalk}`, animation: "fadeIn 1s ease 0.5s both", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.mid }}>Every campus. Every morning. <span style={{ color: C.gold, fontWeight: 800 }}>Start with the facts.</span></span>
        <span style={{ fontSize: 9, color: "rgba(0,0,0,0.22)", letterSpacing: "1px", textTransform: "uppercase" }}>Slate Systems, Inc. · 2026</span>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN SHELL
   ═══════════════════════════════════════════════════════════ */
export default function SlatePlatform() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeModule, setActiveModule] = useState("dashboard");
  const strikeRef = useRef(false);
  const handleModuleClick = (mod) => {
    if (strikeRef.current === false) {
      strikeRef.current = true;
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const now = ctx.currentTime;
        // Note 1: E5 — bright, clean entry
        const o1 = ctx.createOscillator(); const g1 = ctx.createGain();
        o1.type = 'sine'; o1.frequency.value = 659.25;
        g1.gain.setValueAtTime(0, now);
        g1.gain.linearRampToValueAtTime(0.15, now + 0.015);
        g1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        o1.connect(g1); g1.connect(ctx.destination);
        o1.start(now); o1.stop(now + 0.7);
        // Note 2: B5 — perfect fifth up, the lift
        const o2 = ctx.createOscillator(); const g2 = ctx.createGain();
        o2.type = 'sine'; o2.frequency.value = 987.77;
        g2.gain.setValueAtTime(0, now + 0.08);
        g2.gain.linearRampToValueAtTime(0.12, now + 0.095);
        g2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        o2.connect(g2); g2.connect(ctx.destination);
        o2.start(now + 0.08); o2.stop(now + 0.9);
        // Shimmer: E6 — octave harmonic, barely there
        const o3 = ctx.createOscillator(); const g3 = ctx.createGain();
        o3.type = 'sine'; o3.frequency.value = 1318.5;
        g3.gain.setValueAtTime(0, now + 0.12);
        g3.gain.linearRampToValueAtTime(0.04, now + 0.14);
        g3.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        o3.connect(g3); g3.connect(ctx.destination);
        o3.start(now + 0.12); o3.stop(now + 0.8);
        setTimeout(() => ctx.close(), 1500);
      } catch (e) {}
    }
    setActiveModule(mod);
  };
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const activeModuleData = MODULES.find(m => m.id === activeModule);

  if (showSplash) return (<><GlobalCSS /><SplashScreen onComplete={() => setShowSplash(false)} /></>);

  const renderModule = () => {
    const mod = activeModuleData;
    if (!mod) return null;
    const apps = { sentinel: <SentinelApp />, ledger: <LedgerApp />, brief: <BriefApp />, roster: <RosterApp />, shield: <ShieldApp />, grounds: <GroundsApp /> };
   return (<><ModuleHeader module={mod} /><div className="slate-module-box">{apps[mod.id]}</div></>);
  };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", fontFamily: "'Inter', system-ui, sans-serif", background: C.bg, overflow: "hidden" }}>
      <GlobalCSS />
      <Sidebar activeModule={activeModule} setActiveModule={handleModuleClick} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0, transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}>
        <div style={{ height: 52, minHeight: 52, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", borderBottom: `1px solid ${C.chalk}`, background: C.white }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {activeModule !== "dashboard" && activeModuleData ? (<><div style={{ width: 8, height: 8, borderRadius: "50%", background: activeModuleData.color, boxShadow: `0 0 8px ${activeModuleData.color}40` }} /><span style={{ fontSize: 13, fontWeight: 700, color: C.deep }}>Slate {activeModuleData.label}</span><span style={{ fontSize: 10, fontWeight: 600, color: C.light, textTransform: "uppercase", letterSpacing: "1px", marginLeft: 8 }}>{activeModuleData.category}</span></>) : (<span style={{ fontSize: 13, fontWeight: 700, color: C.deep }}>Slate Dashboard</span>)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${C.gold}, ${C.deep})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: C.white, boxShadow: `0 2px 8px ${C.gold}30` }}>MM</div>
          </div>
        </div>
        <div className="slate-scroll" style={{ flex: 1, overflow: "auto", padding: activeModule === "dashboard" ? "32px 36px" : "24px 28px", background: "linear-gradient(180deg, #F5F7FA 0%, #EEF1F5 100%)" }}>
          {activeModule === "dashboard" ? <Dashboard onModuleClick={handleModuleClick} /> : renderModule()}
        </div>
      </div>
    </div>
  );
}
