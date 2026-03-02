// @ts-nocheck
import { useState } from "react";

const COLORS = {
  deep: "#0D1117", rock: "#1C2333", mid: "#2D3748", lightText: "#4A5568",
  gold: "#F0B429", chalk: "#E8EDF2", bg: "#F5F7FA", white: "#FFFFFF", accent: "#F97316",
};

const FACILITIES = [
  { name: "Noble Street", sqft: 95000, condition: "good", openWO: 1, lastInspection: "Jan 2026" },
  { name: "Pritzker", sqft: 88000, condition: "good", openWO: 0, lastInspection: "Feb 2026" },
  { name: "Rauner", sqft: 91000, condition: "fair", openWO: 3, lastInspection: "Dec 2025" },
  { name: "Gary Comer", sqft: 102000, condition: "excellent", openWO: 0, lastInspection: "Feb 2026" },
  { name: "UIC", sqft: 87000, condition: "good", openWO: 2, lastInspection: "Jan 2026" },
  { name: "Muchin", sqft: 76000, condition: "fair", openWO: 4, lastInspection: "Nov 2025" },
  { name: "Johnson", sqft: 94000, condition: "good", openWO: 1, lastInspection: "Feb 2026" },
  { name: "Bulls", sqft: 89000, condition: "good", openWO: 1, lastInspection: "Jan 2026" },
  { name: "ITW Speer", sqft: 82000, condition: "good", openWO: 0, lastInspection: "Feb 2026" },
  { name: "Baker", sqft: 85000, condition: "good", openWO: 2, lastInspection: "Jan 2026" },
  { name: "Hansberry", sqft: 79000, condition: "fair", openWO: 3, lastInspection: "Dec 2025" },
  { name: "DRW Trading", sqft: 98000, condition: "excellent", openWO: 0, lastInspection: "Feb 2026" },
  { name: "Mansueto", sqft: 91000, condition: "good", openWO: 1, lastInspection: "Jan 2026" },
  { name: "Butler", sqft: 74000, condition: "fair", openWO: 2, lastInspection: "Nov 2025" },
  { name: "Goldblatt", sqft: 86000, condition: "good", openWO: 1, lastInspection: "Jan 2026" },
  { name: "TNA", sqft: 92000, condition: "good", openWO: 1, lastInspection: "Feb 2026" },
  { name: "Comer Science", sqft: 88000, condition: "good", openWO: 1, lastInspection: "Jan 2026" },
];

const CAPITAL_PROJECTS = [
  { name: "Muchin HVAC Replacement", campus: "Muchin", budget: 1200000, spent: 890000, status: "in progress", completion: 72 },
  { name: "Gary Comer Roof Repair", campus: "Gary Comer", budget: 450000, spent: 445000, status: "complete", completion: 100 },
  { name: "Rauner Science Lab Renovation", campus: "Rauner", budget: 680000, spent: 204000, status: "in progress", completion: 30 },
  { name: "Network Security Camera Upgrade", campus: "All", budget: 340000, spent: 85000, status: "in progress", completion: 25 },
  { name: "Butler Window Replacement", campus: "Butler", budget: 520000, spent: 0, status: "planned", completion: 0 },
  { name: "Hansberry Gymnasium Floor", campus: "Hansberry", budget: 280000, spent: 0, status: "planned", completion: 0 },
];

const FOOD_SERVICE = {
  mealsPerDay: 11200,
  breakfastParticipation: 0.78,
  lunchParticipation: 0.92,
  supper: 2100,
  vendor: "Aramark",
  costPerMeal: 3.42,
  satisfaction: 3.6,
};

const totalSqFt = FACILITIES.reduce((s, f) => s + f.sqft, 0);
const totalWO = FACILITIES.reduce((s, f) => s + f.openWO, 0);
const totalCapBudget = CAPITAL_PROJECTS.reduce((s, p) => s + p.budget, 0);
const totalCapSpent = CAPITAL_PROJECTS.reduce((s, p) => s + p.spent, 0);

const condColor = (c) => c === "excellent" ? "#059669" : c === "good" ? "#3B82F6" : c === "fair" ? "#D97706" : "#DC2626";

const KPI = ({ label, value, sub, color }) => (
  <div style={{ background: COLORS.white, borderRadius: 10, padding: "18px 20px", borderTop: "3px solid " + color, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
    <div style={{ fontSize: 10, fontWeight: 600, color: COLORS.lightText, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>{label}</div>
    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: COLORS.deep }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: COLORS.lightText, marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function GroundsApp() {
  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{
        background: "linear-gradient(135deg, #7C2D12 0%, #EA580C 100%)",
        borderRadius: 16, padding: "32px 36px", marginBottom: 24, position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", right: -20, top: -20, width: 160, height: 160, borderRadius: "50%", background: "#FB923C", opacity: 0.1 }} />
        <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.white, marginBottom: 4 }}>Slate Grounds</div>
        <div style={{ fontSize: 13, color: "#FED7AA", lineHeight: 1.5 }}>
          Facilities management, capital projects, food service, and operations across 17 campuses and 1.5M square feet.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 24 }}>
        <KPI label="Total Sq Footage" value={(totalSqFt / 1000).toFixed(0) + "K"} sub="across 17 facilities" color="#F97316" />
        <KPI label="Open Work Orders" value={totalWO} sub="23 avg resolution: 3.2 days" color="#EF4444" />
        <KPI label="Capital Budget" value={"$" + (totalCapBudget / 1000000).toFixed(1) + "M"} sub={(totalCapSpent / totalCapBudget * 100).toFixed(0) + "% deployed"} color="#F0B429" />
        <KPI label="Meals / Day" value={FOOD_SERVICE.mealsPerDay.toLocaleString()} sub={FOOD_SERVICE.lunchParticipation * 100 + "% lunch participation"} color="#10B981" />
        <KPI label="Facilities Rating" value="Good" sub="2 excellent, 11 good, 4 fair" color="#3B82F6" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        {/* Capital Projects */}
        <div style={{ background: COLORS.white, borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.deep, marginBottom: 16 }}>Capital Projects</div>
          {CAPITAL_PROJECTS.map((p, i) => (
            <div key={i} style={{ padding: "14px 0", borderBottom: i < CAPITAL_PROJECTS.length - 1 ? "1px solid " + COLORS.chalk : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.deep }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: COLORS.lightText }}>{p.campus}</div>
                </div>
                <span style={{
                  padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600,
                  background: p.status === "complete" ? "#ECFDF5" : p.status === "in progress" ? "#FEF3C7" : "#F0F4FF",
                  color: p.status === "complete" ? "#059669" : p.status === "in progress" ? "#D97706" : "#6366F1",
                }}>{p.status.toUpperCase()}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, height: 6, background: COLORS.chalk, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: p.completion + "%", background: p.status === "complete" ? "#059669" : "#F97316", borderRadius: 3 }} />
                </div>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: COLORS.lightText, minWidth: 32 }}>{p.completion}%</span>
              </div>
              <div style={{ fontSize: 11, color: COLORS.lightText, marginTop: 4 }}>
                Budget: ${(p.budget / 1000).toFixed(0)}K — Spent: ${(p.spent / 1000).toFixed(0)}K
              </div>
            </div>
          ))}
        </div>

        {/* Food Service */}
        <div>
          <div style={{ background: COLORS.white, borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.deep, marginBottom: 16 }}>Food Service Overview</div>
            {[
              { label: "Vendor", value: FOOD_SERVICE.vendor },
              { label: "Meals Served Daily", value: FOOD_SERVICE.mealsPerDay.toLocaleString() },
              { label: "Breakfast Participation", value: (FOOD_SERVICE.breakfastParticipation * 100) + "%" },
              { label: "Lunch Participation", value: (FOOD_SERVICE.lunchParticipation * 100) + "%" },
              { label: "Supper Program", value: FOOD_SERVICE.supper.toLocaleString() + " meals" },
              { label: "Cost per Meal", value: "$" + FOOD_SERVICE.costPerMeal },
              { label: "Satisfaction Score", value: FOOD_SERVICE.satisfaction + " / 5.0" },
            ].map((item, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", padding: "8px 0",
                borderBottom: i < 6 ? "1px solid " + COLORS.chalk : "none",
              }}>
                <span style={{ fontSize: 13, color: COLORS.mid }}>{item.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: COLORS.deep }}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* Quick Stats */}
          <div style={{ background: COLORS.white, borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.deep, marginBottom: 12 }}>Condition Summary</div>
            <div style={{ display: "flex", gap: 8 }}>
              {["excellent", "good", "fair"].map(cond => {
                const count = FACILITIES.filter(f => f.condition === cond).length;
                return (
                  <div key={cond} style={{
                    flex: 1, padding: "12px", borderRadius: 8, textAlign: "center",
                    background: condColor(cond) + "10", border: "1px solid " + condColor(cond) + "30",
                  }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: condColor(cond) }}>{count}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: condColor(cond), textTransform: "uppercase" }}>{cond}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Facilities Table */}
      <div style={{ background: COLORS.white, borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.deep, marginBottom: 16 }}>Facilities Overview</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid " + COLORS.chalk }}>
              {["Campus", "Sq Footage", "Condition", "Open WOs", "Last Inspection"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 10, fontWeight: 600, color: COLORS.lightText, textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FACILITIES.map((f, i) => (
              <tr key={i} style={{ borderBottom: "1px solid " + COLORS.chalk }}>
                <td style={{ padding: "10px 12px", fontWeight: 600, color: COLORS.deep }}>{f.name}</td>
                <td style={{ padding: "10px 12px", fontFamily: "'JetBrains Mono', monospace" }}>{(f.sqft / 1000).toFixed(0)}K</td>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600, background: condColor(f.condition) + "18", color: condColor(f.condition) }}>
                    {f.condition.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: "10px 12px", fontFamily: "'JetBrains Mono', monospace", color: f.openWO > 2 ? "#DC2626" : f.openWO > 0 ? "#D97706" : "#059669", fontWeight: 600 }}>{f.openWO}</td>
                <td style={{ padding: "10px 12px", color: COLORS.lightText }}>{f.lastInspection}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
