// @ts-nocheck
import { useState } from "react";

const C = { deep: "#0D1117", mid: "#2D3748", light: "#4A5568", chalk: "#E8EDF2", purple: "#8B5CF6", white: "#FFFFFF", bg: "#F5F7FA" };

const COMPLIANCE_AREAS = [
  { area: "FERPA", status: "compliant", lastAudit: "2026-01-15", nextAudit: "2026-07-15", items: 0, desc: "Student data privacy" },
  { area: "Title IX", status: "compliant", lastAudit: "2025-11-01", nextAudit: "2026-05-01", items: 2, desc: "Gender equity & harassment" },
  { area: "OSHA", status: "action_needed", lastAudit: "2025-09-20", nextAudit: "2026-03-20", items: 4, desc: "Workplace safety" },
  { area: "Fire Safety", status: "compliant", lastAudit: "2026-02-01", nextAudit: "2026-08-01", items: 0, desc: "Inspections & drills" },
  { area: "Food Safety", status: "compliant", lastAudit: "2026-01-10", nextAudit: "2026-04-10", items: 1, desc: "USDA & health dept" },
  { area: "Special Education", status: "monitoring", lastAudit: "2025-12-15", nextAudit: "2026-06-15", items: 3, desc: "IEP compliance" },
  { area: "Transportation", status: "compliant", lastAudit: "2026-02-10", nextAudit: "2026-08-10", items: 0, desc: "Vehicle & driver certs" },
  { area: "Background Checks", status: "compliant", lastAudit: "2026-02-20", nextAudit: "2026-08-20", items: 0, desc: "Staff clearances" },
  { area: "Insurance", status: "compliant", lastAudit: "2025-10-01", nextAudit: "2026-10-01", items: 0, desc: "Property, liability, D&O" },
  { area: "Bond Covenants", status: "compliant", lastAudit: "2026-01-30", nextAudit: "2026-07-30", items: 0, desc: "S&P BBB-Stable requirements" },
  { area: "Charter Agreement", status: "compliant", lastAudit: "2025-08-01", nextAudit: "2026-08-01", items: 1, desc: "CPS authorizer terms" },
  { area: "Cybersecurity", status: "monitoring", lastAudit: "2026-02-15", nextAudit: "2026-05-15", items: 2, desc: "SOC 2 prep & data protection" },
];

const INCIDENTS = [
  { date: "2026-02-28", type: "Slip & Fall", campus: "Johnson", status: "open", severity: "minor" },
  { date: "2026-02-25", type: "Property Damage", campus: "Bulls", status: "investigating", severity: "moderate" },
  { date: "2026-02-20", type: "Student Altercation", campus: "Hansberry", status: "resolved", severity: "minor" },
  { date: "2026-02-18", type: "Bus Incident", campus: "Rauner", status: "resolved", severity: "minor" },
  { date: "2026-02-12", type: "Water Leak", campus: "Muchin", status: "resolved", severity: "moderate" },
  { date: "2026-02-08", type: "Fire Alarm (false)", campus: "DRW", status: "resolved", severity: "minor" },
];

const statusColor = (s: string) => s === 'compliant' ? '#059669' : s === 'action_needed' ? '#DC2626' : '#D97706';
const statusLabel = (s: string) => s === 'compliant' ? 'COMPLIANT' : s === 'action_needed' ? 'ACTION NEEDED' : 'MONITORING';

export default function ShieldApp() {
  const [tab, setTab] = useState<'compliance' | 'incidents' | 'insurance'>('compliance');
  const compliant = COMPLIANCE_AREAS.filter(c => c.status === 'compliant').length;
  const totalItems = COMPLIANCE_AREAS.reduce((a, c) => a + c.items, 0);
  const openIncidents = INCIDENTS.filter(i => i.status !== 'resolved').length;

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: C.deep }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Compliance Areas', value: String(COMPLIANCE_AREAS.length), sub: `${compliant} compliant`, color: '#059669' },
          { label: 'Open Items', value: String(totalItems), sub: totalItems === 0 ? 'All clear' : `${totalItems} require attention`, color: totalItems > 0 ? '#D97706' : '#059669' },
          { label: 'Open Incidents', value: String(openIncidents), sub: `${INCIDENTS.length} total this month`, color: openIncidents > 0 ? '#D97706' : '#059669' },
          { label: 'Next Audit', value: 'Mar 20', sub: 'OSHA — Workplace Safety', color: C.purple },
        ].map((k, i) => (
          <div key={i} style={{ background: C.white, borderRadius: 14, padding: '20px 22px', borderTop: `3px solid ${C.purple}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.light, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 26, fontWeight: 700, color: C.deep }}>{k.value}</div>
            <div style={{ fontSize: 12, color: k.color, marginTop: 4, fontWeight: 600 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '1px solid ' + C.chalk }}>
        {(['compliance', 'incidents', 'insurance'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '12px 22px', border: 'none', cursor: 'pointer', fontSize: 13,
            fontWeight: tab === t ? 700 : 500, color: tab === t ? C.deep : C.light, background: 'transparent',
            borderBottom: tab === t ? '2px solid ' + C.purple : '2px solid transparent',
            textTransform: 'capitalize', transition: 'all 0.15s',
          }}>{t}</button>
        ))}
      </div>

      {tab === 'compliance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {COMPLIANCE_AREAS.map(c => (
            <div key={c.area} style={{ background: C.white, borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: '0 0 160px' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.deep }}>{c.area}</div>
                <div style={{ fontSize: 11, color: C.light, marginTop: 2 }}>{c.desc}</div>
              </div>
              <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: '1px', color: statusColor(c.status), background: statusColor(c.status) + '12' }}>
                {statusLabel(c.status)}
              </span>
              <div style={{ flex: 1 }} />
              {c.items > 0 && <span style={{ fontSize: 12, fontWeight: 600, color: '#D97706' }}>{c.items} item{c.items > 1 ? 's' : ''}</span>}
              <div style={{ fontSize: 11, color: C.light }}>Next: {c.nextAudit}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'incidents' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {INCIDENTS.map((inc, i) => (
            <div key={i} style={{ background: C.white, borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 12, color: C.light, fontFamily: "'JetBrains Mono', monospace", flex: '0 0 90px' }}>{inc.date}</div>
              <div style={{ flex: '0 0 140px', fontWeight: 600, color: C.deep, fontSize: 14 }}>{inc.type}</div>
              <div style={{ flex: '0 0 100px', fontSize: 13, color: C.mid }}>{inc.campus}</div>
              <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: '1px', color: inc.status === 'resolved' ? '#059669' : '#D97706', background: (inc.status === 'resolved' ? '#059669' : '#D97706') + '12' }}>
                {inc.status.toUpperCase()}
              </span>
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 11, color: inc.severity === 'moderate' ? '#D97706' : C.light, fontWeight: 600 }}>{inc.severity}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'insurance' && (
        <div style={{ background: C.white, borderRadius: 14, padding: '28px 32px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.deep, marginBottom: 20 }}>Insurance Coverage Summary</div>
          {[
            { type: 'General Liability', carrier: 'Philadelphia Indemnity', premium: '$842K', expiry: '2026-10-01', limit: '$10M' },
            { type: 'Property', carrier: 'Zurich', premium: '$1.2M', expiry: '2026-10-01', limit: '$175M' },
            { type: 'D&O', carrier: 'Chubb', premium: '$156K', expiry: '2026-10-01', limit: '$5M' },
            { type: 'Workers Comp', carrier: 'Hartford', premium: '$620K', expiry: '2026-07-01', limit: 'Statutory' },
            { type: 'Cyber Liability', carrier: 'Coalition', premium: '$84K', expiry: '2026-10-01', limit: '$3M' },
            { type: 'Umbrella', carrier: 'AIG', premium: '$210K', expiry: '2026-10-01', limit: '$25M' },
          ].map((ins, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0', borderBottom: i < 5 ? '1px solid ' + C.chalk : 'none' }}>
              <div style={{ flex: '0 0 160px', fontWeight: 600, fontSize: 14, color: C.deep }}>{ins.type}</div>
              <div style={{ flex: '0 0 160px', fontSize: 13, color: C.mid }}>{ins.carrier}</div>
              <div style={{ flex: '0 0 80px', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: C.deep }}>{ins.premium}</div>
              <div style={{ flex: '0 0 80px', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: C.deep }}>{ins.limit}</div>
              <div style={{ flex: 1 }} />
              <div style={{ fontSize: 11, color: C.light }}>Expires {ins.expiry}</div>
            </div>
          ))}
        </div>
      )}

      <footer style={{ textAlign: 'center', padding: '20px 16px', marginTop: 32, fontSize: 11, color: C.light, borderTop: '1px solid ' + C.chalk }}>
        <div>Slate Shield — Risk Management Intelligence</div>
        <div style={{ fontSize: 9, color: '#94A3B8', marginTop: 4 }}>Slate Systems, LLC · Madden Advisory Group · 2026</div>
      </footer>
    </div>
  );
}
