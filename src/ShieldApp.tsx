// @ts-nocheck
import { useState } from "react";

const COLORS = {
  deep: "#0D1117", rock: "#1C2333", mid: "#2D3748", lightText: "#4A5568",
  gold: "#F0B429", chalk: "#E8EDF2", bg: "#F5F7FA", white: "#FFFFFF", accent: "#8B5CF6",
};

const COMPLIANCE_AREAS = [
  { name: "FERPA", status: "compliant", lastAudit: "Feb 2026", nextDeadline: "Aug 2026", score: 98 },
  { name: "Title IX", status: "compliant", lastAudit: "Jan 2026", nextDeadline: "Jul 2026", score: 95 },
  { name: "504 / ADA", status: "attention", lastAudit: "Dec 2025", nextDeadline: "Mar 2026", score: 87 },
  { name: "OSHA", status: "compliant", lastAudit: "Nov 2025", nextDeadline: "May 2026", score: 94 },
  { name: "Food Safety (HACCP)", status: "compliant", lastAudit: "Jan 2026", nextDeadline: "Jul 2026", score: 96 },
  { name: "Fire Safety", status: "compliant", lastAudit: "Oct 2025", nextDeadline: "Apr 2026", score: 99 },
  { name: "Background Checks", status: "compliant", lastAudit: "Feb 2026", nextDeadline: "Ongoing", score: 100 },
  { name: "Mandated Reporting", status: "compliant", lastAudit: "Jan 2026", nextDeadline: "Jun 2026", score: 97 },
  { name: "Bond Covenants", status: "compliant", lastAudit: "Feb 2026", nextDeadline: "Jun 2026", score: 100 },
  { name: "Charter Agreement", status: "compliant", lastAudit: "Dec 2025", nextDeadline: "Sep 2026", score: 93 },
  { name: "Data Privacy (SOPPA)", status: "attention", lastAudit: "Nov 2025", nextDeadline: "Apr 2026", score: 85 },
  { name: "Transportation Safety", status: "compliant", lastAudit: "Jan 2026", nextDeadline: "Aug 2026", score: 91 },
];

const INCIDENTS = [
  { id: 1, date: "Feb 28, 2026", campus: "Johnson", type: "Slip & Fall", severity: "low", status: "closed", claim: false },
  { id: 2, date: "Feb 25, 2026", campus: "Bulls", type: "Property Damage", severity: "low", status: "closed", claim: false },
  { id: 3, date: "Feb 22, 2026", campus: "Noble Street", type: "Student Injury (PE)", severity: "medium", status: "open", claim: true },
  { id: 4, date: "Feb 18, 2026", campus: "Gary Comer", type: "Visitor Incident", severity: "low", status: "closed", claim: false },
  { id: 5, date: "Feb 14, 2026", campus: "Muchin", type: "Equipment Malfunction", severity: "medium", status: "under review", claim: true },
  { id: 6, date: "Feb 10, 2026", campus: "Pritzker", type: "Slip & Fall", severity: "low", status: "closed", claim: false },
  { id: 7, date: "Feb 5, 2026", campus: "Baker", type: "Vehicle Incident (Parking)", severity: "low", status: "closed", claim: false },
  { id: 8, date: "Jan 30, 2026", campus: "DRW Trading", type: "Water Damage", severity: "high", status: "open", claim: true },
];

const INSURANCE = [
  { type: "General Liability", carrier: "Travelers", premium: 1240000, expiry: "Jul 2026", coverage: 10000000 },
  { type: "Property", carrier: "Zurich", premium: 890000, expiry: "Jul 2026", coverage: 150000000 },
  { type: "Workers Comp", carrier: "Hartford", premium: 720000, expiry: "Jul 2026", coverage: 1000000 },
  { type: "D&O", carrier: "Chubb", premium: 185000, expiry: "Sep 2026", coverage: 5000000 },
  { type: "Cyber Liability", carrier: "AIG", premium: 95000, expiry: "Nov 2026", coverage: 3000000 },
  { type: "Auto", carrier: "Travelers", premium: 210000, expiry: "Jul 2026", coverage: 2000000 },
];

const statusColor = (s) => s === "compliant" ? "#059669" : s === "attention" ? "#D97706" : "#DC2626";
const sevColor = (s) => s === "low" ? "#059669" : s === "medium" ? "#D97706" : "#DC2626";

const KPI = ({ label, value, sub, color }) => (
  <div style={{ background: COLORS.white, borderRadius: 10, padding: "18px 20px", borderTop: "3px solid " + color, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
    <div style={{ fontSize: 10, fontWeight: 600, color: COLORS.lightText, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>{label}</div>
    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: COLORS.deep }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: COLORS.lightText, marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function ShieldApp() {
  const compliant = COMPLIANCE_AREAS.filter(c => c.status === "compliant").length;
  const attention = COMPLIANCE_AREAS.filter(c => c.status === "attention").length;
  const avgScore = Math.round(COMPLIANCE_AREAS.reduce((s, c) => s + c.score, 0) / COMPLIANCE_AREAS.length);
  const openIncidents = INCIDENTS.filter(i => i.status !== "closed").length;
  const totalPremium = INSURANCE.reduce((s, i) => s + i.premium, 0);

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{
        background: "linear-gradient(135deg, #4C1D95 0%, #7C3AED 100%)",
        borderRadius: 16, padding: "32px 36px", marginBottom: 24, position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", right: -20, top: -20, width: 160, height: 160, borderRadius: "50%", background: "#A78BFA", opacity: 0.1 }} />
        <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.white, marginBottom: 4 }}>Slate Shield</div>
        <div style={{ fontSize: 13, color: "#C4B5FD", lineHeight: 1.5 }}>
          Risk management, compliance monitoring, incident tracking, and insurance oversight across 17 campuses.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 24 }}>
        <KPI label="Compliance Score" value={avgScore + "%"} sub={compliant + " of " + COMPLIANCE_AREAS.length + " areas"} color="#8B5CF6" />
        <KPI label="Needs Attention" value={attention} sub="compliance areas" color="#D97706" />
        <KPI label="Open Incidents" value={openIncidents} sub={"of " + INCIDENTS.length + " total (90 days)"} color="#EF4444" />
        <KPI label="Active Claims" value={INCIDENTS.filter(i => i.claim).length} sub="insurance claims" color="#F0B429" />
        <KPI label="Annual Premiums" value={"$" + (totalPremium / 1000000).toFixed(1) + "M"} sub="6 policies" color="#10B981" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        {/* Compliance Grid */}
        <div style={{ background: COLORS.white, borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.deep, marginBottom: 16 }}>Compliance Status</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {COMPLIANCE_AREAS.map((c, i) => (
              <div key={i} style={{
                padding: "10px 14px", borderRadius: 8, border: "1px solid " + COLORS.chalk,
                background: c.status === "attention" ? "#FFFBEB" : COLORS.white,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.deep }}>{c.name}</span>
                  <span style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: statusColor(c.status),
                    boxShadow: c.status === "attention" ? "0 0 6px rgba(217,119,6,0.5)" : "none",
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: COLORS.lightText }}>
                  <span>Score: {c.score}%</span>
                  <span>Next: {c.nextDeadline}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Insurance Portfolio */}
        <div style={{ background: COLORS.white, borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.deep, marginBottom: 16 }}>Insurance Portfolio</div>
          {INSURANCE.map((ins, i) => (
            <div key={i} style={{ padding: "12px 0", borderBottom: i < INSURANCE.length - 1 ? "1px solid " + COLORS.chalk : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.deep }}>{ins.type}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: COLORS.deep }}>
                  ${(ins.premium / 1000).toFixed(0)}K
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: COLORS.lightText }}>
                <span>{ins.carrier} — Coverage: ${(ins.coverage / 1000000).toFixed(0)}M</span>
                <span>Exp: {ins.expiry}</span>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 14, padding: "10px 14px", background: "#F5F3FF", borderRadius: 8, fontSize: 12, color: "#6D28D9", fontWeight: 600 }}>
            Total Annual Premium: ${(totalPremium / 1000000).toFixed(2)}M
          </div>
        </div>
      </div>

      {/* Incident Log */}
      <div style={{ background: COLORS.white, borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.deep, marginBottom: 16 }}>Recent Incidents (90 Days)</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid " + COLORS.chalk }}>
              {["Date", "Campus", "Type", "Severity", "Status", "Claim"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 10, fontWeight: 600, color: COLORS.lightText, textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {INCIDENTS.map(inc => (
              <tr key={inc.id} style={{ borderBottom: "1px solid " + COLORS.chalk }}>
                <td style={{ padding: "10px 12px", color: COLORS.lightText }}>{inc.date}</td>
                <td style={{ padding: "10px 12px", fontWeight: 600, color: COLORS.deep }}>{inc.campus}</td>
                <td style={{ padding: "10px 12px" }}>{inc.type}</td>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600, background: sevColor(inc.severity) + "18", color: sevColor(inc.severity) }}>
                    {inc.severity.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600,
                    background: inc.status === "closed" ? "#ECFDF5" : inc.status === "open" ? "#FEF3C7" : "#F0F4FF",
                    color: inc.status === "closed" ? "#059669" : inc.status === "open" ? "#D97706" : "#6366F1",
                  }}>
                    {inc.status.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: "10px 12px", fontWeight: 600, color: inc.claim ? "#D97706" : COLORS.lightText }}>{inc.claim ? "Yes" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
