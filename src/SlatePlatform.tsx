// @ts-nocheck
import { useState, useEffect } from "react";
import SentinelApp from "./SentinelApp";
import LedgerApp from "./LedgerApp";
import BriefApp from "./BriefApp";
import RosterApp from "./RosterApp";
import ShieldApp from "./ShieldApp";
import GroundsApp from "./GroundsApp";

/* ═══════════════════════════════════════════════════════════
   SLATE DESIGN SYSTEM — COLOR TOKENS
   From: Platform Design System v2.0
   ═══════════════════════════════════════════════════════════ */
const C = {
  deep:    "#0D1117",   // Primary backgrounds, headers, command surfaces
  rock:    "#1C2333",   // Secondary surfaces, nav, charts
  mid:     "#2D3748",   // Borders, secondary text, structural elements
  light:   "#4A5568",   // Tertiary text
  gold:    "#F0B429",   // CTAs, key data, brand moments
  chalk:   "#E8EDF2",   // Canvas backgrounds, cards, data tables
  signal:  "#0EA5E9",   // Interactive accents, links
  white:   "#FFFFFF",
  bg:      "#F5F7FA",
};

/* Module accent colors — one per module, never mixed */
const MOD = {
  sentinel: "#EF4444",
  ledger:   "#F0B429",
  roster:   "#3B82F6",
  brief:    "#10B981",
  shield:   "#8B5CF6",
  grounds:  "#F97316",
};

/* ═══════════════════════════════════════════════════════════
   MODULE DEFINITIONS
   ═══════════════════════════════════════════════════════════ */
const MODULES = [
  {
    id: "sentinel", label: "Sentinel", category: "SAFETY INTELLIGENCE",
    icon: "🛡", color: MOD.sentinel,
    desc: "Real-time violence intelligence. Campus risk scoring, retaliation window tracking, AI morning briefings.",
    status: "LIVE", metrics: "17 campuses monitored",
  },
  {
    id: "ledger", label: "Ledger", category: "FINANCIAL INTELLIGENCE",
    icon: "📊", color: MOD.ledger,
    desc: "Budget visibility, cash flow forecasting, variance analysis. CFO-grade financial intelligence.",
    status: "LIVE", metrics: "$240M budget tracked",
  },
  {
    id: "roster", label: "Roster", category: "ENROLLMENT INTELLIGENCE",
    icon: "📋", color: MOD.roster,
    desc: "Enrollment forecasting, recruitment funnel tracking, yield modeling, attrition early warning.",
    status: "LIVE", metrics: "12,120 students",
  },
  {
    id: "brief", label: "Brief", category: "COMMUNICATIONS INTELLIGENCE",
    icon: "✉️", color: MOD.brief,
    desc: "AI-drafted communications grounded in live Slate data. In your voice. Out in seconds.",
    status: "LIVE", metrics: "Powered by Claude",
  },
  {
    id: "shield", label: "Shield", category: "RISK MANAGEMENT INTELLIGENCE",
    icon: "⚖️", color: MOD.shield,
    desc: "Compliance monitoring, incident tracking, insurance analysis, regulatory deadline tracking.",
    status: "LIVE", metrics: "12 compliance areas",
  },
  {
    id: "grounds", label: "Grounds", category: "OPERATIONS INTELLIGENCE",
    icon: "🏫", color: MOD.grounds,
    desc: "Facilities management, capital projects, food service, transportation across all campuses.",
    status: "LIVE", metrics: "1.5M sq ft managed",
  },
];

/* ═══════════════════════════════════════════════════════════
   PARALLELOGRAM LOGO — SVG
   "A parallelogram — the exact shape of a physical slate tile,
    slightly angled to suggest motion. Two chalk lines: one
    full-width, one shorter."
   ═══════════════════════════════════════════════════════════ */
const SlateLogo = ({ size = 32, showText = true }) => (
  <div style={{ display: "flex", alignItems: "center", gap: size * 0.35, cursor: "default" }}>
    <svg width={size} height={size * 0.75} viewBox="0 0 40 30" fill="none">
      <path d="M8 2 L36 2 L32 28 L4 28 Z" fill={C.mid} opacity="0.9" />
      <line x1="10" y1="13" x2="30" y2="13" stroke={C.chalk} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="10" y1="19" x2="22" y2="19" stroke={C.chalk} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
    </svg>
    {showText && (
      <span style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        fontWeight: 900,
        fontSize: size * 0.65,
        color: C.white,
        letterSpacing: "-0.02em",
        lineHeight: 1,
      }}>
        Slate<span style={{ color: C.gold }}>.</span>
      </span>
    )}
  </div>
);

/* ═══════════════════════════════════════════════════════════
   SPLASH SCREEN
   4-second branded entry: logo, tagline, six module dots
   ═══════════════════════════════════════════════════════════ */
const SplashScreen = ({ onComplete }) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 400);
    const t2 = setTimeout(() => setPhase(2), 1200);
    const t3 = setTimeout(() => setPhase(3), 2200);
    const t4 = setTimeout(() => onComplete(), 3800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999, background: C.deep,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      opacity: phase >= 3 ? 0 : 1, transition: "opacity 0.8s ease",
    }}>
      {/* Subtle gradient overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 50% 40%, rgba(28,35,51,0.8) 0%, rgba(13,17,23,1) 70%)",
      }} />

      {/* Confidential badge */}
      <div style={{
        position: "relative", marginBottom: 48,
        padding: "8px 20px", borderRadius: 20,
        border: `1px solid ${C.mid}`,
        fontSize: 10, fontWeight: 600, letterSpacing: "3px", textTransform: "uppercase",
        color: C.light,
        opacity: phase >= 1 ? 1 : 0, transition: "opacity 0.6s ease",
      }}>
        Platform Design System — Version 2.0 — Confidential
      </div>

      {/* Logo mark */}
      <div style={{
        position: "relative",
        opacity: phase >= 1 ? 1 : 0,
        transform: phase >= 1 ? "translateY(0)" : "translateY(20px)",
        transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
      }}>
        <svg width="60" height="45" viewBox="0 0 40 30" fill="none">
          <path d="M8 2 L36 2 L32 28 L4 28 Z" fill={C.mid} opacity="0.9" />
          <line x1="10" y1="13" x2="30" y2="13" stroke={C.chalk} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="10" y1="19" x2="22" y2="19" stroke={C.chalk} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
        </svg>
      </div>

      {/* Wordmark */}
      <div style={{
        position: "relative", marginTop: 16,
        fontFamily: "'Inter', system-ui, sans-serif",
        fontWeight: 900, fontSize: 72, color: C.white,
        letterSpacing: "-0.03em", lineHeight: 1,
        opacity: phase >= 1 ? 1 : 0,
        transform: phase >= 1 ? "translateY(0)" : "translateY(20px)",
        transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.15s",
      }}>
        Slate<span style={{ color: C.gold }}>.</span>
      </div>

      {/* Tagline */}
      <div style={{
        position: "relative", marginTop: 20,
        fontSize: 13, fontWeight: 500, letterSpacing: "6px", textTransform: "uppercase",
        color: C.light,
        opacity: phase >= 2 ? 1 : 0, transition: "opacity 0.6s ease",
      }}>
        Start With The Facts
      </div>

      {/* Module dots */}
      <div style={{
        position: "relative", marginTop: 48,
        display: "flex", gap: 16,
        opacity: phase >= 2 ? 1 : 0,
        transform: phase >= 2 ? "translateY(0)" : "translateY(12px)",
        transition: "all 0.6s ease 0.2s",
      }}>
        {MODULES.map((m, i) => (
          <div key={m.id} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            opacity: phase >= 2 ? 1 : 0,
            transition: `opacity 0.4s ease ${0.3 + i * 0.08}s`,
          }}>
            <div style={{
              width: 10, height: 10, borderRadius: "50%",
              background: m.color, boxShadow: `0 0 12px ${m.color}40`,
            }} />
            <span style={{
              fontSize: 9, fontWeight: 600, letterSpacing: "2px",
              textTransform: "uppercase", color: m.color,
            }}>{m.label}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        position: "absolute", bottom: 40,
        fontSize: 11, color: C.mid, letterSpacing: "1px",
        opacity: phase >= 2 ? 1 : 0, transition: "opacity 0.6s ease 0.5s",
      }}>
        Intelligence Platform for Charter School Networks — Chicago · National
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   SIDEBAR
   ═══════════════════════════════════════════════════════════ */
const Sidebar = ({ activeModule, setActiveModule, collapsed, setCollapsed }) => {
  const w = collapsed ? 64 : 220;

  return (
    <div style={{
      width: w, minWidth: w, height: "100vh", background: C.deep,
      borderRight: `1px solid ${C.rock}`,
      display: "flex", flexDirection: "column",
      transition: "width 0.25s ease, min-width 0.25s ease",
      overflow: "hidden", position: "relative",
    }}>
      {/* Logo area */}
      <div
        onClick={() => setActiveModule("dashboard")}
        style={{
          padding: collapsed ? "20px 0" : "20px 20px",
          display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start",
          cursor: "pointer", borderBottom: `1px solid ${C.rock}`,
          minHeight: 68,
        }}
      >
        {collapsed ? (
          <svg width="28" height="21" viewBox="0 0 40 30" fill="none">
            <path d="M8 2 L36 2 L32 28 L4 28 Z" fill={C.mid} opacity="0.9" />
            <line x1="10" y1="13" x2="30" y2="13" stroke={C.chalk} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="10" y1="19" x2="22" y2="19" stroke={C.chalk} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
          </svg>
        ) : (
          <SlateLogo size={26} />
        )}
      </div>

      {/* Module nav */}
      <div style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
        {/* Dashboard */}
        <div
          onClick={() => setActiveModule("dashboard")}
          style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: collapsed ? "10px 0" : "10px 20px",
            justifyContent: collapsed ? "center" : "flex-start",
            cursor: "pointer", margin: "2px 8px", borderRadius: 8,
            background: activeModule === "dashboard" ? C.rock : "transparent",
            transition: "background 0.15s ease",
          }}
        >
          <span style={{ fontSize: 16, width: 24, textAlign: "center" }}>⬡</span>
          {!collapsed && (
            <span style={{ fontSize: 13, fontWeight: 600, color: C.chalk, letterSpacing: "-0.01em" }}>
              Dashboard
            </span>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: C.rock, margin: "10px 20px" }} />

        {/* Modules */}
        {MODULES.map(m => {
          const active = activeModule === m.id;
          return (
            <div
              key={m.id}
              onClick={() => setActiveModule(m.id)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: collapsed ? "10px 0" : "10px 20px",
                justifyContent: collapsed ? "center" : "flex-start",
                cursor: "pointer", margin: "2px 8px", borderRadius: 8,
                background: active ? `${m.color}15` : "transparent",
                borderLeft: active ? `3px solid ${m.color}` : "3px solid transparent",
                transition: "all 0.15s ease",
              }}
            >
              <span style={{ fontSize: 15, width: 24, textAlign: "center" }}>{m.icon}</span>
              {!collapsed && (
                <span style={{
                  fontSize: 13, fontWeight: active ? 700 : 500,
                  color: active ? m.color : C.chalk,
                  letterSpacing: "-0.01em",
                  transition: "color 0.15s ease",
                }}>
                  {m.label}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Collapse toggle */}
      <div
        onClick={() => setCollapsed(!collapsed)}
        style={{
          padding: "16px", borderTop: `1px solid ${C.rock}`,
          display: "flex", justifyContent: "center", cursor: "pointer",
          color: C.light, fontSize: 14,
        }}
      >
        {collapsed ? "→" : "←"}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   DASHBOARD
   "Zero to insight in 10 seconds."
   ═══════════════════════════════════════════════════════════ */
const Dashboard = ({ onModuleClick }) => {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      {/* Hero greeting */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontSize: 28, fontWeight: 800, color: C.deep,
          letterSpacing: "-0.02em", lineHeight: 1.2,
        }}>
          {greeting}, Mike.
        </div>
        <div style={{ fontSize: 14, color: C.light, marginTop: 6, lineHeight: 1.5 }}>
          Noble Schools — 17 campuses · 12,120 students · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </div>
      </div>

      {/* KPI strip */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32,
      }}>
        {[
          { label: "Campuses", value: "17", sub: "All operational", color: MOD.sentinel },
          { label: "Students", value: "12,120", sub: "98.4% of capacity", color: MOD.roster },
          { label: "YTD Budget", value: "+$5.9M", sub: "Surplus — tracking ahead", color: MOD.ledger },
          { label: "DSCR", value: "3.47x", sub: "Covenant: 1.0x", color: MOD.brief },
        ].map((kpi, i) => (
          <div key={i} style={{
            background: C.white, borderRadius: 12, padding: "20px 22px",
            borderTop: `3px solid ${kpi.color}`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}>
            <div style={{
              fontSize: 10, fontWeight: 600, color: C.light,
              textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6,
            }}>{kpi.label}</div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 26, fontWeight: 700, color: C.deep, letterSpacing: "-0.02em",
            }}>{kpi.value}</div>
            <div style={{ fontSize: 12, color: C.light, marginTop: 4 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Module cards */}
      <div style={{
        fontSize: 11, fontWeight: 600, color: C.light,
        textTransform: "uppercase", letterSpacing: "2px", marginBottom: 16,
      }}>
        Six Intelligences
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16,
      }}>
        {MODULES.map(m => (
          <div
            key={m.id}
            onClick={() => onModuleClick(m.id)}
            style={{
              background: C.white, borderRadius: 14, padding: "24px 24px 20px",
              cursor: "pointer",
              borderTop: `3px solid ${m.color}`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
              position: "relative", overflow: "hidden",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 24px ${m.color}18`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"; }}
          >
            {/* Module number + category */}
            <div style={{
              fontSize: 9, fontWeight: 600, letterSpacing: "2px",
              textTransform: "uppercase", color: m.color, marginBottom: 10,
            }}>
              Module {String(MODULES.indexOf(m) + 1).padStart(2, "0")} · {m.category.split(" ")[0]}
            </div>

            {/* Icon + Name */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 20 }}>{m.icon}</span>
              <span style={{
                fontSize: 20, fontWeight: 800, color: C.deep,
                letterSpacing: "-0.02em",
              }}>{m.label}</span>
            </div>

            {/* Description */}
            <div style={{
              fontSize: 13, color: C.light, lineHeight: 1.6, marginBottom: 14,
            }}>{m.desc}</div>

            {/* Footer: status + metric */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              paddingTop: 12, borderTop: `1px solid ${C.chalk}`,
            }}>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "1px",
                textTransform: "uppercase", color: m.color,
              }}>{m.status}</span>
              <span style={{
                fontSize: 11, fontWeight: 500, color: C.light,
                fontFamily: "'JetBrains Mono', monospace",
              }}>{m.metrics}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer manifesto line */}
      <div style={{
        marginTop: 40, padding: "20px 0", borderTop: `1px solid ${C.chalk}`,
        textAlign: "center",
      }}>
        <span style={{
          fontSize: 13, fontWeight: 600, color: C.mid, letterSpacing: "0.5px",
        }}>
          Every campus. Every morning.{" "}
          <span style={{ color: C.gold, fontWeight: 800 }}>Start with the facts.</span>
        </span>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MODULE PLACEHOLDER (not used anymore, but kept as fallback)
   ═══════════════════════════════════════════════════════════ */
const ModulePlaceholder = ({ module }) => (
  <div style={{
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", minHeight: 400, textAlign: "center",
  }}>
    <span style={{ fontSize: 48, marginBottom: 16 }}>{module?.icon}</span>
    <div style={{ fontSize: 24, fontWeight: 800, color: C.deep }}>{module?.label}</div>
    <div style={{ fontSize: 13, color: C.light, marginTop: 8 }}>{module?.category}</div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   MAIN PLATFORM SHELL
   ═══════════════════════════════════════════════════════════ */
export default function SlatePlatform() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeModule, setActiveModule] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const activeModuleData = MODULES.find(m => m.id === activeModule);
  const activeColor = activeModuleData?.color || C.gold;

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div style={{
      display: "flex", height: "100vh",
      fontFamily: "'Inter', system-ui, sans-serif",
      background: C.bg,
    }}>
      {/* Sidebar */}
      <Sidebar
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      {/* Main content area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top bar */}
        <div style={{
          height: 52, minHeight: 52,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 28px",
          borderBottom: `1px solid ${C.chalk}`,
          background: C.white,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {activeModule !== "dashboard" && activeModuleData && (
              <>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: activeColor,
                  boxShadow: `0 0 8px ${activeColor}40`,
                }} />
                <span style={{
                  fontSize: 13, fontWeight: 700, color: C.deep,
                  letterSpacing: "-0.01em",
                }}>
                  Slate {activeModuleData.label}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 600, color: C.light,
                  textTransform: "uppercase", letterSpacing: "1px",
                  marginLeft: 8,
                }}>
                  {activeModuleData.category}
                </span>
              </>
            )}
            {activeModule === "dashboard" && (
              <span style={{ fontSize: 13, fontWeight: 700, color: C.deep }}>
                Slate Dashboard
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 12, color: C.light }}>Noble Schools</span>
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: `linear-gradient(135deg, ${C.gold}, ${C.deep})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: C.white,
            }}>MM</div>
          </div>
        </div>

        {/* Content */}
        <div style={{
          flex: 1, overflow: "auto",
          padding: activeModule === "dashboard" ? "32px 36px" : "24px 28px",
        }}>
          {activeModule === "dashboard" ? (
            <Dashboard onModuleClick={setActiveModule} />
          ) : activeModule === "sentinel" ? (
            <SentinelApp />
          ) : activeModule === "ledger" ? (
            <LedgerApp />
          ) : activeModule === "brief" ? (
            <BriefApp />
          ) : activeModule === "roster" ? (
            <RosterApp />
          ) : activeModule === "shield" ? (
            <ShieldApp />
          ) : activeModule === "grounds" ? (
            <GroundsApp />
          ) : (
            <ModulePlaceholder module={activeModuleData} />
          )}
        </div>
      </div>
    </div>
  );
}
