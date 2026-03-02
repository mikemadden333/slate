// @ts-nocheck
import { useState, useEffect } from "react";
import SentinelApp from "./SentinelApp";
import LedgerApp from "./LedgerApp";
import BriefApp from "./BriefApp";

const COLORS = {
  deep: "#0D1117",
  rock: "#1C2333",
  mid: "#2D3748",
  lightText: "#4A5568",
  gold: "#F0B429",
  chalk: "#E8EDF2",
  bg: "#F5F7FA",
  white: "#FFFFFF",
  signal: "#0EA5E9",
  red: "#EF4444",
};

const MODULES = [
  {
    id: "sentinel", name: "Sentinel", subtitle: "Safety Intelligence",
    accent: "#EF4444", icon: "\u{1F6E1}", status: "LIVE",
    description: "Real-time violence intelligence built on Papachristos contagion research. Campus risk scoring, retaliation window tracking, AI morning briefings.",
    metrics: [
      { label: "Campuses Monitored", value: "17" },
      { label: "Data Sources", value: "4 live" },
      { label: "Refresh Cycle", value: "90s" },
    ],
  },
  {
    id: "ledger", name: "Ledger", subtitle: "Financial Intelligence",
    accent: "#F0B429", icon: "\u{1F4CA}", status: "BUILD",
    description: "Real-time financial analytics with Distance-to-Danger framing, three-scenario projections, reverse solvers, and AI-powered board reporting.",
    metrics: [
      { label: "Annual Budget", value: "$240M" },
      { label: "YTD Surplus", value: "+$5.9M" },
      { label: "DSCR", value: "3.47x" },
    ],
  },
  {
    id: "roster", name: "Roster", subtitle: "Enrollment Intelligence",
    accent: "#3B82F6", icon: "\u{1F4CB}", status: "PLANNED",
    description: "Enrollment forecasting, recruitment funnel tracking, yield modeling, and attrition early warning across all campuses.",
    metrics: [
      { label: "Students", value: "12,120" },
      { label: "Campuses", value: "17" },
      { label: "Retention", value: "89.2%" },
    ],
  },
  {
    id: "brief", name: "Brief", subtitle: "Communications Intelligence",
    accent: "#10B981", icon: "\u{2709}\u{FE0F}", status: "PLANNED",
    description: "AI-drafted family communications, crisis messaging, board reports, and staff briefings grounded in your Slate data, in your voice.",
    metrics: [
      { label: "Languages", value: "3" },
      { label: "Voice Profiles", value: "17" },
      { label: "Channels", value: "Email, SMS, Push" },
    ],
  },
  {
    id: "shield", name: "Shield", subtitle: "Risk Management Intelligence",
    accent: "#8B5CF6", icon: "\u{2696}\u{FE0F}", status: "PLANNED",
    description: "Compliance monitoring, incident tracking, insurance analysis, policy management, and regulatory deadline tracking.",
    metrics: [
      { label: "Compliance Areas", value: "12" },
      { label: "Active Policies", value: "48" },
      { label: "Next Deadline", value: "14 days" },
    ],
  },
  {
    id: "grounds", name: "Grounds", subtitle: "Operations Intelligence",
    accent: "#F97316", icon: "\u{1F3EB}", status: "PLANNED",
    description: "Facilities management, capital projects, vendor management, food service, transportation, and real estate portfolio oversight.",
    metrics: [
      { label: "Facilities", value: "17" },
      { label: "Open Work Orders", value: "23" },
      { label: "Capital Projects", value: "4" },
    ],
  },
];

const SplashScreen = ({ onComplete }) => {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 1800),
      setTimeout(() => setPhase(4), 2800),
      setTimeout(() => onComplete(), 3800),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999, background: COLORS.deep,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      transition: "opacity 1s ease, transform 1s ease",
      opacity: phase >= 4 ? 0 : 1,
      transform: phase >= 4 ? "scale(1.05)" : "scale(1)",
      pointerEvents: phase >= 4 ? "none" : "auto",
    }}>
      <div style={{
        width: 64, height: 48, transform: "skewX(-12deg)",
        border: "3px solid " + COLORS.gold, position: "relative",
        opacity: phase >= 1 ? 1 : 0, transition: "opacity 0.8s ease", marginBottom: 24,
      }}>
        <div style={{ position: "absolute", top: 14, left: 8, right: 8, height: 3, background: COLORS.gold }} />
        <div style={{ position: "absolute", top: 24, left: 8, width: "60%", height: 3, background: COLORS.gold, opacity: 0.5 }} />
      </div>
      <div style={{
        fontFamily: "'Inter', system-ui, sans-serif", fontSize: 48, fontWeight: 700, color: COLORS.white,
        letterSpacing: "-1px", opacity: phase >= 1 ? 1 : 0,
        transform: phase >= 1 ? "translateY(0)" : "translateY(20px)", transition: "all 0.8s ease",
      }}>Slate.</div>
      <div style={{
        fontFamily: "'Inter', system-ui, sans-serif", fontSize: 12, fontWeight: 400,
        color: COLORS.gold, letterSpacing: "4px", marginTop: 8,
        opacity: phase >= 2 ? 1 : 0, transition: "opacity 0.8s ease",
      }}>START WITH THE FACTS</div>
      <div style={{ width: phase >= 3 ? 200 : 0, height: 2, background: COLORS.gold, marginTop: 32, transition: "width 0.6s ease" }} />
      <div style={{ marginTop: 48, display: "flex", gap: 16, opacity: phase >= 3 ? 1 : 0, transition: "opacity 0.8s ease" }}>
        {MODULES.map(m => (<div key={m.id} style={{ width: 8, height: 8, borderRadius: "50%", background: m.accent, opacity: 0.8 }} />))}
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const config = {
    LIVE: { bg: "#ECFDF5", color: "#059669", label: "LIVE" },
    BUILD: { bg: "#FFFBEB", color: "#D97706", label: "IN BUILD" },
    PLANNED: { bg: "#F0F4FF", color: "#6366F1", label: "PLANNED" },
  };
  const c = config[status] || config.PLANNED;
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: 12,
      fontSize: 10, fontWeight: 600, letterSpacing: "0.5px",
      background: c.bg, color: c.color, fontFamily: "'Inter', system-ui, sans-serif",
    }}>{c.label}</span>
  );
};

const ModuleCard = ({ module, onClick, index }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div onClick={() => onClick(module.id)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        background: COLORS.white, borderRadius: 12, padding: 0, cursor: "pointer",
        transition: "all 0.25s ease",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered ? "0 12px 32px rgba(0,0,0,0.12)" : "0 1px 3px rgba(0,0,0,0.06)",
        overflow: "hidden", animation: "fadeUp 0.5s ease " + (index * 0.08) + "s both",
      }}>
      <div style={{ height: 4, background: module.accent }} />
      <div style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>{module.icon}</span>
            <div>
              <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 16, fontWeight: 700, color: COLORS.deep }}>{module.name}</div>
              <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 11, fontWeight: 500, color: COLORS.lightText, letterSpacing: "0.3px" }}>{module.subtitle}</div>
            </div>
          </div>
          <StatusBadge status={module.status} />
        </div>
        <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 13, lineHeight: 1.55, color: COLORS.mid, marginBottom: 16, minHeight: 40 }}>{module.description}</div>
        <div style={{ display: "flex", gap: 0, borderTop: "1px solid " + COLORS.chalk, paddingTop: 14 }}>
          {module.metrics.map((m, i) => (
            <div key={i} style={{
              flex: 1,
              borderRight: i < module.metrics.length - 1 ? "1px solid " + COLORS.chalk : "none",
              paddingRight: i < module.metrics.length - 1 ? 12 : 0,
              paddingLeft: i > 0 ? 12 : 0,
            }}>
              <div style={{ fontFamily: "'JetBrains Mono', 'SF Mono', monospace", fontSize: 15, fontWeight: 600, color: COLORS.deep }}>{m.value}</div>
              <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 10, color: COLORS.lightText, marginTop: 2 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ activeModule, onSelect, collapsed }) => (
  <div style={{
    width: collapsed ? 64 : 220, background: COLORS.deep, height: "100vh",
    position: "fixed", left: 0, top: 0, display: "flex", flexDirection: "column",
    transition: "width 0.3s ease", zIndex: 100, borderRight: "1px solid " + COLORS.rock,
  }}>
    <div onClick={() => onSelect("dashboard")} style={{ padding: collapsed ? "20px 12px" : "20px 20px", cursor: "pointer", borderBottom: "1px solid " + COLORS.rock }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 28, height: 20, transform: "skewX(-12deg)", border: "2px solid " + COLORS.gold, position: "relative", flexShrink: 0 }}>
          <div style={{ position: "absolute", top: 5, left: 4, right: 4, height: 2, background: COLORS.gold }} />
          <div style={{ position: "absolute", top: 10, left: 4, width: "55%", height: 2, background: COLORS.gold, opacity: 0.5 }} />
        </div>
        {!collapsed && <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 20, fontWeight: 700, color: COLORS.white, letterSpacing: "-0.5px" }}>Slate.</span>}
      </div>
    </div>
    <div style={{ flex: 1, paddingTop: 8, overflow: "auto" }}>
      {MODULES.map(m => {
        const active = activeModule === m.id;
        return (
          <div key={m.id} onClick={() => onSelect(m.id)} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: collapsed ? "12px 20px" : "10px 20px", cursor: "pointer",
            background: active ? COLORS.rock : "transparent",
            borderLeft: active ? "3px solid " + m.accent : "3px solid transparent",
            transition: "all 0.15s ease", position: "relative",
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>{m.icon}</span>
            {!collapsed && <div>
              <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 13, fontWeight: active ? 600 : 400, color: active ? COLORS.white : "#8892A0" }}>{m.name}</div>
              <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 10, color: active ? m.accent : "#5A6577" }}>{m.subtitle}</div>
            </div>}
            {!collapsed && m.status === "LIVE" && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#059669", position: "absolute", right: 16, boxShadow: "0 0 6px rgba(5,150,105,0.5)" }} />}
          </div>
        );
      })}
    </div>
    <div style={{ padding: collapsed ? "16px 12px" : "16px 20px", borderTop: "1px solid " + COLORS.rock }}>
      {!collapsed ? <div>
        <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 12, fontWeight: 600, color: COLORS.white }}>Noble Schools</div>
        <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 10, color: "#5A6577" }}>17 campuses · Chicago, IL</div>
      </div> : <div style={{ width: 28, height: 28, borderRadius: 6, background: COLORS.rock, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', system-ui, sans-serif", fontSize: 11, fontWeight: 700, color: COLORS.gold }}>N</div>}
    </div>
  </div>
);

const ModulePlaceholder = ({ module }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", textAlign: "center", padding: 40 }}>
    <div style={{ fontSize: 56, marginBottom: 16, filter: module.status === "PLANNED" ? "grayscale(0.5)" : "none" }}>{module.icon}</div>
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 28, fontWeight: 700, color: COLORS.deep, marginBottom: 4 }}>Slate {module.name}</div>
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 14, color: COLORS.lightText, marginBottom: 24, letterSpacing: "0.5px" }}>{module.subtitle}</div>
    <StatusBadge status={module.status} />
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 14, color: COLORS.mid, maxWidth: 500, lineHeight: 1.6, marginTop: 24 }}>{module.description}</div>
    <div style={{ display: "flex", gap: 16, marginTop: 32, flexWrap: "wrap", justifyContent: "center" }}>
      {module.metrics.map((m, i) => (
        <div key={i} style={{ background: COLORS.white, borderRadius: 10, padding: "16px 24px", minWidth: 120, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", borderTop: "3px solid " + module.accent }}>
          <div style={{ fontFamily: "'JetBrains Mono', 'SF Mono', monospace", fontSize: 20, fontWeight: 700, color: COLORS.deep }}>{m.value}</div>
          <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 11, color: COLORS.lightText, marginTop: 4 }}>{m.label}</div>
        </div>
      ))}
    </div>
    <div style={{ marginTop: 40, padding: "12px 24px", background: module.accent + "12", borderRadius: 8, fontFamily: "'Inter', system-ui, sans-serif", fontSize: 13, color: module.accent, fontWeight: 500 }}>
      {module.status === "LIVE" ? "Module active — click to view live intelligence" : module.status === "BUILD" ? "Module in development — Noble reference data loaded" : "Module designed — proof of concept in progress"}
    </div>
  </div>
);

const Dashboard = ({ onModuleClick }) => {
  const now = new Date();
  const hour = now.getHours();
  const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  return (
    <div>
      <div style={{
        background: "linear-gradient(135deg, " + COLORS.deep + " 0%, " + COLORS.rock + " 100%)",
        borderRadius: 16, padding: "36px 40px", marginBottom: 28, position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", right: -20, top: -20, width: 200, height: 200, borderRadius: "50%", background: COLORS.gold, opacity: 0.04 }} />
        <div style={{ position: "absolute", right: 60, bottom: -40, width: 120, height: 120, borderRadius: "50%", background: COLORS.gold, opacity: 0.03 }} />
        <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 13, color: "#8892A0", marginBottom: 4 }}>{dateStr} · {timeStr}</div>
        <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 26, fontWeight: 700, color: COLORS.white, marginBottom: 6 }}>
          Good {hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening"}, Mike.
        </div>
        <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 14, color: "#8892A0", lineHeight: 1.5 }}>
          Noble Schools — 17 campuses · 12,000 students · Chicago, Illinois
        </div>
        <div style={{ display: "flex", gap: 24, marginTop: 24, flexWrap: "wrap" }}>
          {[
            { label: "Safety Status", value: "All campuses LOW", color: "#059669" },
            { label: "YTD Budget", value: "+$5.9M surplus", color: COLORS.gold },
            { label: "Enrollment", value: "12,120 students", color: COLORS.signal },
            { label: "DSCR", value: "3.47x (covenant: 1.0x)", color: "#059669" },
          ].map((item, i) => (
            <div key={i}>
              <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 10, color: "#5A6577", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 3 }}>{item.label}</div>
              <div style={{ fontFamily: "'JetBrains Mono', 'SF Mono', monospace", fontSize: 13, fontWeight: 600, color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 18, fontWeight: 700, color: COLORS.deep }}>Intelligence Modules</div>
        <div style={{ height: 2, flex: 1, background: "linear-gradient(90deg, " + COLORS.gold + ", transparent)" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
        {MODULES.map((m, i) => (<ModuleCard key={m.id} module={m} onClick={onModuleClick} index={i} />))}
      </div>
      <div style={{ textAlign: "center", marginTop: 48, paddingTop: 24, borderTop: "1px solid " + COLORS.chalk }}>
        <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 10, letterSpacing: "3px", color: COLORS.lightText }}>
          SIX INTELLIGENCES · ONE PLATFORM · EVERY MORNING
        </div>
      </div>
    </div>
  );
};

export default function SlatePlatform() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeModule, setActiveModule] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const activeModuleData = MODULES.find(m => m.id === activeModule);
  const sidebarWidth = sidebarCollapsed ? 64 : 220;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #CBD5E0; border-radius: 3px; }
      `}</style>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <div style={{ display: "flex", minHeight: "100vh", background: COLORS.bg, fontFamily: "'Inter', system-ui, sans-serif" }}>
        <Sidebar activeModule={activeModule} onSelect={setActiveModule} collapsed={sidebarCollapsed} />
        <div style={{ marginLeft: sidebarWidth, flex: 1, transition: "margin-left 0.3s ease" }}>
          <div style={{
            height: 56, background: COLORS.white, borderBottom: "1px solid " + COLORS.chalk,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 28px", position: "sticky", top: 0, zIndex: 50,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: COLORS.mid, padding: 4 }}>&#9776;</button>
              <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.deep }}>
                {activeModule === "dashboard" ? "Platform Dashboard" : "Slate " + (activeModuleData?.name || "")}
              </div>
              {activeModuleData && <StatusBadge status={activeModuleData.status} />}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ padding: "6px 14px", background: COLORS.bg, borderRadius: 8, fontSize: 12, color: COLORS.lightText }}>Noble Schools</div>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: COLORS.deep, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: COLORS.gold }}>MM</div>
            </div>
          </div>
          <div style={{ padding: "28px" }}>
            {activeModule === "dashboard" ? <Dashboard onModuleClick={setActiveModule} /> : activeModule === "sentinel" ? <SentinelApp /> : activeModule === "ledger" ? <LedgerApp /> : activeModule === "brief" ? <BriefApp /> : <ModulePlaceholder module={activeModuleData} />}
          </div>
        </div>
      </div>
    </>
  );
}