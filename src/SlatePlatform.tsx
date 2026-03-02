// @ts-nocheck
import { useState, useEffect } from "react";
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
  .slate-module-box { position: relative !important; width: 100% !important; }
  .slate-module-box [style*="position: fixed"], .slate-module-box [style*="position:fixed"] { position: absolute !important; z-index: 10 !important; }
  .slate-module-box > div { height: auto !important; min-height: auto !important; max-height: none !important; }
  .slate-scroll::-webkit-scrollbar { width: 6px; }
  .slate-scroll::-webkit-scrollbar-track { background: transparent; }
  .slate-scroll::-webkit-scrollbar-thumb { background: ${C.chalk}; border-radius: 3px; }
  @keyframes slateGlow { 0%,100%{opacity:0.04;transform:scale(1)} 50%{opacity:0.08;transform:scale(1.05)} }
  @keyframes slateDotPulse { 0%,100%{box-shadow:0 0 12px currentColor} 50%{box-shadow:0 0 22px currentColor} }
`}</style>);

/* ═══════════════════════════════════════════════════════════
   SPLASH SCREEN — Slow dissolve, readable, corporate
   ═══════════════════════════════════════════════════════════ */
const SplashScreen = ({ onComplete }) => {
  const [p, setP] = useState(0);
  useEffect(() => {
    const t = [
      setTimeout(() => setP(1), 800),
      setTimeout(() => setP(2), 2600),
      setTimeout(() => setP(3), 4400),
      setTimeout(() => setP(4), 6200),
      setTimeout(() => onComplete(), 7800),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "linear-gradient(160deg, #111827 0%, #0D1117 35%, #1C2333 65%, #111827 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      opacity: p >= 4 ? 0 : 1, transition: "opacity 1.6s cubic-bezier(0.4, 0, 0.2, 1)",
    }}>
      <div style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", background: `radial-gradient(circle, ${C.gold}06 0%, transparent 60%)`, top: "35%", left: "50%", transform: "translate(-50%, -50%)", animation: "slateGlow 5s ease-in-out infinite" }} />

      {/* Badge */}
      <div style={{ position: "relative", marginBottom: 60, padding: "10px 28px", borderRadius: 24, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.06)", fontSize: 10, fontWeight: 600, letterSpacing: "3px", textTransform: "uppercase", color: "rgba(255,255,255,0.60)", opacity: p >= 1 ? 1 : 0, transition: "opacity 1s ease" }}>
        Platform Design System — Version 2.0 — Confidential
      </div>

      {/* Mark */}
      <div style={{ position: "relative", opacity: p >= 1 ? 1 : 0, transform: p >= 1 ? "translateY(0) scale(1)" : "translateY(30px) scale(0.9)", transition: "all 1.4s cubic-bezier(0.16, 1, 0.3, 1)" }}>
        <svg width="80" height="60" viewBox="0 0 40 30" fill="none">
          <path d="M8 2 L36 2 L32 28 L4 28 Z" fill="rgba(255,255,255,0.10)" />
          <path d="M8 2 L36 2 L32 28 L4 28 Z" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
          <line x1="10" y1="13" x2="30" y2="13" stroke={C.chalk} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="10" y1="19" x2="22" y2="19" stroke={C.chalk} strokeWidth="2.5" strokeLinecap="round" opacity="0.45" />
        </svg>
      </div>

      {/* Wordmark */}
      <div style={{ position: "relative", marginTop: 24, fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 900, fontSize: 88, color: C.white, letterSpacing: "-0.04em", lineHeight: 1, opacity: p >= 1 ? 1 : 0, transform: p >= 1 ? "translateY(0)" : "translateY(24px)", transition: "all 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.25s" }}>
        Slate<span style={{ color: C.gold }}>.</span>
      </div>

      {/* Tagline */}
      <div style={{ position: "relative", marginTop: 28, fontSize: 14, fontWeight: 500, letterSpacing: "8px", textTransform: "uppercase", color: "rgba(255,255,255,0.60)", opacity: p >= 2 ? 1 : 0, transform: p >= 2 ? "translateY(0)" : "translateY(10px)", transition: "all 1s ease" }}>
        Start With The Facts
      </div>

      {/* Module dots */}
      <div style={{ position: "relative", marginTop: 64, display: "flex", gap: 24, opacity: p >= 2 ? 1 : 0, transition: "opacity 0.8s ease 0.4s" }}>
        {MODULES.map((m, i) => (
          <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, opacity: p >= 2 ? 1 : 0, transition: `opacity 0.6s ease ${0.5 + i * 0.12}s` }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: m.color, boxShadow: `0 0 14px ${m.color}60`, color: m.color, animation: p >= 2 ? "slateDotPulse 3s ease-in-out infinite" : "none", animationDelay: `${i * 0.3}s` }} />
            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", color: m.color }}>{m.label}</span>
          </div>
        ))}
      </div>

      {/* Descriptor */}
      <div style={{ position: "relative", marginTop: 64, fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.40)", letterSpacing: "1.5px", opacity: p >= 3 ? 1 : 0, transition: "opacity 1s ease" }}>
        Intelligence Platform for Charter School Networks — Chicago · National
      </div>

      {/* Corporate footer */}
      <div style={{ position: "absolute", bottom: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, opacity: p >= 3 ? 1 : 0, transition: "opacity 1s ease 0.4s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "2px", textTransform: "uppercase", fontWeight: 600 }}>
          <span>Slate Systems, LLC</span>
          <span style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(255,255,255,0.25)" }} />
          <span>Madden Advisory Group</span>
        </div>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.22)", letterSpacing: "1px" }}>
          Proprietary & Confidential · All Rights Reserved · 2026
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
      <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.45)", letterSpacing: "2.5px", textTransform: "uppercase" }}>Slate {m.label}</span>
      <span style={{ marginLeft: 8, padding: "2px 10px", borderRadius: 12, background: `${m.color}20`, border: `1px solid ${m.color}35`, fontSize: 9, fontWeight: 700, color: m.color, letterSpacing: "1.5px", textTransform: "uppercase" }}>{m.status}</span>
    </div>
    <div style={{ display: "flex", alignItems: "baseline", gap: 16, position: "relative" }}>
      <span style={{ fontSize: 30, fontWeight: 900, color: C.white, letterSpacing: "-0.03em" }}>{m.label}</span>
      <span style={{ fontSize: 9, fontWeight: 600, color: m.color, letterSpacing: "2.5px", textTransform: "uppercase" }}>{m.category}</span>
    </div>
    <div style={{ fontSize: 14, color: "rgba(255,255,255,0.50)", marginTop: 8, fontStyle: "italic", position: "relative" }}>{m.tagline}</div>
  </div>
);

/* ═══════════════════════════════════════════════════════════ */
const Sidebar = ({ activeModule, setActiveModule, collapsed, setCollapsed }) => {
  const w = collapsed ? 64 : 232;
  return (
    <div style={{ width: w, minWidth: w, height: "100vh", background: C.deep, borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", transition: "width 0.25s ease, min-width 0.25s ease", overflow: "hidden", flexShrink: 0, zIndex: 200 }}>
      <div onClick={() => setActiveModule("dashboard")} style={{ padding: collapsed ? "22px 0" : "22px 24px", display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: 10, cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.06)", minHeight: 72, flexShrink: 0 }}>
        <svg width={collapsed ? 24 : 26} height={collapsed ? 18 : 19.5} viewBox="0 0 40 30" fill="none"><path d="M8 2 L36 2 L32 28 L4 28 Z" fill="rgba(255,255,255,0.12)" /><line x1="10" y1="13" x2="30" y2="13" stroke={C.chalk} strokeWidth="2.5" strokeLinecap="round" /><line x1="10" y1="19" x2="22" y2="19" stroke={C.chalk} strokeWidth="2.5" strokeLinecap="round" opacity="0.5" /></svg>
        {!collapsed && <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 900, fontSize: 18, color: C.white, letterSpacing: "-0.02em" }}>Slate<span style={{ color: C.gold }}>.</span></span>}
      </div>
      <div style={{ flex: 1, padding: "16px 0", overflowY: "auto", flexShrink: 1 }}>
        <NI label="Dashboard" icon="⬡" color={C.gold} active={activeModule === "dashboard"} collapsed={collapsed} onClick={() => setActiveModule("dashboard")} />
        <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "12px 16px" }} />
        {!collapsed && <div style={{ padding: "0 24px", marginBottom: 10, fontSize: 9, fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>Modules</div>}
        {MODULES.map(m => <NI key={m.id} label={m.label} icon={m.icon} color={m.color} active={activeModule === m.id} collapsed={collapsed} onClick={() => setActiveModule(m.id)} />)}
      </div>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        {!collapsed && <div style={{ padding: "14px 24px 4px" }}><div style={{ fontSize: 9, color: "rgba(255,255,255,0.22)", letterSpacing: "1.5px", lineHeight: 1.8, textTransform: "uppercase", fontWeight: 600 }}>Slate Systems, LLC</div><div style={{ fontSize: 8, color: "rgba(255,255,255,0.14)", letterSpacing: "1px" }}>Madden Advisory Group</div></div>}
        <div onClick={() => setCollapsed(!collapsed)} style={{ padding: "14px 24px", display: "flex", justifyContent: collapsed ? "center" : "flex-end", cursor: "pointer", color: "rgba(255,255,255,0.22)", fontSize: 12 }}>{collapsed ? "▸" : "◂"}</div>
      </div>
    </div>
  );
};
const NI = ({ label, icon, color, active, collapsed, onClick }) => (
  <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 12, padding: collapsed ? "11px 0" : "11px 24px", justifyContent: collapsed ? "center" : "flex-start", cursor: "pointer", margin: "1px 10px", borderRadius: 10, background: active ? `${color}12` : "transparent", borderLeft: active ? `3px solid ${color}` : "3px solid transparent", transition: "all 0.15s ease" }} onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }} onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? `${color}12` : "transparent"; }}>
    <span style={{ fontSize: 15, width: 22, textAlign: "center", flexShrink: 0 }}>{icon}</span>
    {!collapsed && <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? color : "rgba(255,255,255,0.60)", letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>{label}</span>}
  </div>
);

/* ═══════════════════════════════════════════════════════════ */
const Dashboard = ({ onModuleClick }) => {
  const h = new Date().getHours();
  const g = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 30, fontWeight: 900, color: C.deep, letterSpacing: "-0.03em" }}>{g}, Mike.</div>
        <div style={{ fontSize: 14, color: C.light, marginTop: 8 }}>Noble Schools — 17 campuses · 12,120 students · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 36 }}>
        {[{ l: "Campuses", v: "17", s: "All operational", c: MOD.sentinel }, { l: "Students", v: "12,120", s: "98.4% of capacity", c: MOD.roster }, { l: "YTD Budget", v: "+$5.9M", s: "Surplus — tracking ahead", c: MOD.ledger }, { l: "DSCR", v: "3.47x", s: "Covenant: 1.0x", c: MOD.brief }].map((k, i) => (
          <div key={i} style={{ background: C.white, borderRadius: 14, padding: "22px 24px", borderTop: `3px solid ${k.c}`, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.light, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 6 }}>{k.l}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 700, color: C.deep }}>{k.v}</div>
            <div style={{ fontSize: 12, color: C.light, marginTop: 4 }}>{k.s}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.light, textTransform: "uppercase", letterSpacing: "3px", marginBottom: 18 }}>Six Intelligences · One Platform</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
        {MODULES.map((m, idx) => (
          <div key={m.id} onClick={() => onModuleClick(m.id)} style={{ background: C.white, borderRadius: 16, cursor: "pointer", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", transition: "transform 0.2s ease, box-shadow 0.2s ease" }} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 12px 32px ${m.color}15`; }} onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)"; }}>
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
      <div style={{ marginTop: 48, padding: "24px 0 16px", borderTop: `1px solid ${C.chalk}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.mid }}>Every campus. Every morning. <span style={{ color: C.gold, fontWeight: 800 }}>Start with the facts.</span></span>
        <span style={{ fontSize: 9, color: "rgba(0,0,0,0.22)", letterSpacing: "1px", textTransform: "uppercase" }}>Slate Systems, LLC · Madden Advisory Group · 2026</span>
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
      <Sidebar activeModule={activeModule} setActiveModule={setActiveModule} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        <div style={{ height: 52, minHeight: 52, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", borderBottom: `1px solid ${C.chalk}`, background: C.white }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {activeModule !== "dashboard" && activeModuleData ? (<><div style={{ width: 8, height: 8, borderRadius: "50%", background: activeModuleData.color, boxShadow: `0 0 8px ${activeModuleData.color}40` }} /><span style={{ fontSize: 13, fontWeight: 700, color: C.deep }}>Slate {activeModuleData.label}</span><span style={{ fontSize: 10, fontWeight: 600, color: C.light, textTransform: "uppercase", letterSpacing: "1px", marginLeft: 8 }}>{activeModuleData.category}</span></>) : (<span style={{ fontSize: 13, fontWeight: 700, color: C.deep }}>Slate Dashboard</span>)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 11, color: C.light }}>Noble Schools</span>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${C.gold}, ${C.deep})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: C.white, boxShadow: `0 2px 8px ${C.gold}30` }}>MM</div>
          </div>
        </div>
        <div className="slate-scroll" style={{ flex: 1, overflow: "auto", padding: activeModule === "dashboard" ? "32px 36px" : "24px 28px" }}>
          {activeModule === "dashboard" ? <Dashboard onModuleClick={setActiveModule} /> : renderModule()}
        </div>
      </div>
    </div>
  );
}
