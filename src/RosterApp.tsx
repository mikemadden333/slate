// @ts-nocheck
import { useState } from "react";

const COLORS = {
  deep: "#0D1117", rock: "#1C2333", mid: "#2D3748", lightText: "#4A5568",
  gold: "#F0B429", chalk: "#E8EDF2", bg: "#F5F7FA", white: "#FFFFFF", accent: "#3B82F6",
};

const CAMPUSES = [
  { name: "Noble Street", enrolled: 742, capacity: 800, apps: 412, yield: 0.68, retention: 0.91 },
  { name: "Pritzker", enrolled: 698, capacity: 750, apps: 388, yield: 0.71, retention: 0.89 },
  { name: "Rauner", enrolled: 721, capacity: 750, apps: 345, yield: 0.65, retention: 0.88 },
  { name: "Gary Comer", enrolled: 685, capacity: 700, apps: 401, yield: 0.72, retention: 0.93 },
  { name: "UIC", enrolled: 756, capacity: 800, apps: 378, yield: 0.69, retention: 0.90 },
  { name: "Muchin", enrolled: 612, capacity: 650, apps: 298, yield: 0.64, retention: 0.87 },
  { name: "Johnson", enrolled: 734, capacity: 775, apps: 356, yield: 0.67, retention: 0.89 },
  { name: "Bulls", enrolled: 701, capacity: 750, apps: 410, yield: 0.73, retention: 0.92 },
  { name: "ITW Speer", enrolled: 688, capacity: 725, apps: 334, yield: 0.66, retention: 0.88 },
  { name: "Baker", enrolled: 714, capacity: 750, apps: 367, yield: 0.70, retention: 0.90 },
  { name: "Hansberry", enrolled: 692, capacity: 725, apps: 321, yield: 0.63, retention: 0.86 },
  { name: "DRW Trading", enrolled: 745, capacity: 800, apps: 425, yield: 0.74, retention: 0.94 },
  { name: "Mansueto", enrolled: 703, capacity: 750, apps: 352, yield: 0.68, retention: 0.89 },
  { name: "Butler", enrolled: 678, capacity: 700, apps: 298, yield: 0.62, retention: 0.85 },
  { name: "Goldblatt", enrolled: 719, capacity: 750, apps: 341, yield: 0.67, retention: 0.88 },
  { name: "TNA", enrolled: 731, capacity: 775, apps: 389, yield: 0.71, retention: 0.91 },
  { name: "Comer Science", enrolled: 701, capacity: 725, apps: 356, yield: 0.69, retention: 0.90 },
];

const MONTHLY_APPS = [
  { month: "Sep", apps: 234 }, { month: "Oct", apps: 412 }, { month: "Nov", apps: 589 },
  { month: "Dec", apps: 823 }, { month: "Jan", apps: 1456 }, { month: "Feb", apps: 2102 },
  { month: "Mar", apps: 3241 }, { month: "Apr", apps: 4012 }, { month: "May", apps: 4534 },
  { month: "Jun", apps: 5123 }, { month: "Jul", apps: 5534 }, { month: "Aug", apps: 5871 },
];

const totalEnrolled = CAMPUSES.reduce((s, c) => s + c.enrolled, 0);
const totalCapacity = CAMPUSES.reduce((s, c) => s + c.capacity, 0);
const totalApps = CAMPUSES.reduce((s, c) => s + c.apps, 0);
const avgYield = CAMPUSES.reduce((s, c) => s + c.yield, 0) / CAMPUSES.length;
const avgRetention = CAMPUSES.reduce((s, c) => s + c.retention, 0) / CAMPUSES.length;

const KPI = ({ label, value, sub, color }) => (
  <div style={{ background: COLORS.white, borderRadius: 10, padding: "18px 20px", borderTop: "3px solid " + color, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
    <div style={{ fontSize: 10, fontWeight: 600, color: COLORS.lightText, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>{label}</div>
    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: COLORS.deep }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: COLORS.lightText, marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function RosterApp() {
  const [sortBy, setSortBy] = useState("name");
  const sorted = [...CAMPUSES].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "enrolled") return b.enrolled - a.enrolled;
    if (sortBy === "yield") return b.yield - a.yield;
    if (sortBy === "retention") return b.retention - a.retention;
    return 0;
  });

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{
        background: "linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)",
        borderRadius: 16, padding: "32px 36px", marginBottom: 24, position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", right: -20, top: -20, width: 160, height: 160, borderRadius: "50%", background: COLORS.accent, opacity: 0.08 }} />
        <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.white, marginBottom: 4 }}>Slate Roster</div>
        <div style={{ fontSize: 13, color: "#93C5FD", lineHeight: 1.5 }}>
          Enrollment intelligence across 17 campuses. Application tracking, yield modeling, retention early warning.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 24 }}>
        <KPI label="Total Enrolled" value={totalEnrolled.toLocaleString()} sub={"of " + totalCapacity.toLocaleString() + " capacity"} color="#3B82F6" />
        <KPI label="Utilization" value={(totalEnrolled / totalCapacity * 100).toFixed(1) + "%"} sub="across 17 campuses" color="#8B5CF6" />
        <KPI label="Applications" value={totalApps.toLocaleString()} sub="FY26 cycle" color="#F0B429" />
        <KPI label="Avg Yield" value={(avgYield * 100).toFixed(1) + "%"} sub="application to enrollment" color="#10B981" />
        <KPI label="Avg Retention" value={(avgRetention * 100).toFixed(1) + "%"} sub="year over year" color="#EF4444" />
      </div>

      {/* Application Funnel */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <div style={{ background: COLORS.white, borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.deep, marginBottom: 16 }}>Application Funnel — FY26</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { stage: "Inquiries", count: 8420, pct: 100 },
              { stage: "Applications Started", count: 5871, pct: 69.7 },
              { stage: "Applications Completed", count: 4102, pct: 48.7 },
              { stage: "Offers Extended", count: 3241, pct: 38.5 },
              { stage: "Offers Accepted", count: 2456, pct: 29.2 },
              { stage: "Enrolled (Day 10)", count: 2102, pct: 25.0 },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: COLORS.mid, marginBottom: 3 }}>
                  <span>{s.stage}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{s.count.toLocaleString()} ({s.pct}%)</span>
                </div>
                <div style={{ height: 6, background: COLORS.chalk, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: s.pct + "%", background: "linear-gradient(90deg, #3B82F6, #8B5CF6)", borderRadius: 3, transition: "width 0.5s ease" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: COLORS.white, borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.deep, marginBottom: 16 }}>Cumulative Applications by Month</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 180 }}>
            {MONTHLY_APPS.map((m, i) => {
              const maxApps = MONTHLY_APPS[MONTHLY_APPS.length - 1].apps;
              const h = (m.apps / maxApps) * 160;
              return (
                <div key={i} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: COLORS.lightText, marginBottom: 3 }}>
                    {m.apps > 999 ? (m.apps / 1000).toFixed(1) + "k" : m.apps}
                  </div>
                  <div style={{
                    height: h, background: i <= 5 ? "linear-gradient(180deg, #3B82F6, #2563EB)" : "linear-gradient(180deg, #93C5FD, #BFDBFE)",
                    borderRadius: "3px 3px 0 0", transition: "height 0.3s ease",
                  }} />
                  <div style={{ fontSize: 9, color: COLORS.lightText, marginTop: 3 }}>{m.month}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Campus Table */}
      <div style={{ background: COLORS.white, borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.deep }}>Campus Enrollment Detail</div>
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { id: "name", label: "Name" }, { id: "enrolled", label: "Enrolled" },
              { id: "yield", label: "Yield" }, { id: "retention", label: "Retention" },
            ].map(s => (
              <button key={s.id} onClick={() => setSortBy(s.id)} style={{
                padding: "4px 10px", borderRadius: 6, border: "1px solid " + COLORS.chalk,
                background: sortBy === s.id ? "#EFF6FF" : COLORS.white,
                color: sortBy === s.id ? "#2563EB" : COLORS.lightText,
                fontSize: 11, fontWeight: 500, cursor: "pointer",
              }}>{s.label}</button>
            ))}
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid " + COLORS.chalk }}>
                {["Campus", "Enrolled", "Capacity", "Utilization", "Applications", "Yield", "Retention"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 10, fontWeight: 600, color: COLORS.lightText, textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((c, i) => {
                const util = c.enrolled / c.capacity;
                return (
                  <tr key={i} style={{ borderBottom: "1px solid " + COLORS.chalk }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: COLORS.deep }}>{c.name}</td>
                    <td style={{ padding: "10px 12px", fontFamily: "'JetBrains Mono', monospace" }}>{c.enrolled.toLocaleString()}</td>
                    <td style={{ padding: "10px 12px", fontFamily: "'JetBrains Mono', monospace", color: COLORS.lightText }}>{c.capacity.toLocaleString()}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 60, height: 5, background: COLORS.chalk, borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: (util * 100) + "%", background: util > 0.95 ? "#EF4444" : util > 0.85 ? "#F0B429" : "#10B981", borderRadius: 3 }} />
                        </div>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{(util * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "10px 12px", fontFamily: "'JetBrains Mono', monospace" }}>{c.apps}</td>
                    <td style={{ padding: "10px 12px", fontFamily: "'JetBrains Mono', monospace", color: c.yield >= 0.70 ? "#059669" : c.yield >= 0.65 ? "#D97706" : "#DC2626" }}>{(c.yield * 100).toFixed(0)}%</td>
                    <td style={{ padding: "10px 12px", fontFamily: "'JetBrains Mono', monospace", color: c.retention >= 0.90 ? "#059669" : c.retention >= 0.87 ? "#D97706" : "#DC2626" }}>{(c.retention * 100).toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
