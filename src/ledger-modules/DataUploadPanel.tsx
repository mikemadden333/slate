/**
 * DataUploadPanel — CFO/FP&A data entry interface.
 * Supports: manual monthly actuals entry, budget override, CSV paste.
 * All data flows into LedgerDataContext — every module updates live.
 */
import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useLedger, type MonthlyActual } from '../ledger-context/LedgerDataContext';

const FISCAL_MONTHS = [
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
];

const FISCAL_YEAR = '2025-26';

export default function DataUploadPanel() {
  const { data, ytd, updateBudget, addOrUpdateMonth, setUpdatedBy } = useLedger();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'monthly' | 'budget' | 'csv'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(0); // index into FISCAL_MONTHS
  const [saved, setSaved] = useState('');
  const [error, setError] = useState('');
  const [updaterName, setUpdaterName] = useState('');

  // Monthly entry form state
  const existingMonth = data.actuals.find(a => a.monthIndex === selectedMonth + 1);
  const [form, setForm] = useState({
    revenueTotal: existingMonth?.revenue.total.toFixed(1) ?? '',
    cps: existingMonth?.revenue.cps.toFixed(1) ?? '',
    philanthropy: existingMonth?.revenue.philanthropy.toFixed(1) ?? '',
    otherPublic: existingMonth?.revenue.otherPublic.toFixed(1) ?? '',
    expensesTotal: existingMonth?.expenses.total.toFixed(1) ?? '',
    personnel: existingMonth?.expenses.personnel.toFixed(1) ?? '',
    directStudent: existingMonth?.expenses.directStudent.toFixed(1) ?? '',
    occupancy: existingMonth?.expenses.occupancy.toFixed(1) ?? '',
    other: existingMonth?.expenses.other.toFixed(1) ?? '',
    daysCash: existingMonth?.daysCash?.toString() ?? '',
    dscr: existingMonth?.dscr?.toString() ?? '',
  });

  const handleMonthChange = (monthIdx: number) => {
    setSelectedMonth(monthIdx);
    const m = data.actuals.find(a => a.monthIndex === monthIdx + 1);
    setForm({
      revenueTotal: m?.revenue.total.toFixed(1) ?? '',
      cps: m?.revenue.cps.toFixed(1) ?? '',
      philanthropy: m?.revenue.philanthropy.toFixed(1) ?? '',
      otherPublic: m?.revenue.otherPublic.toFixed(1) ?? '',
      expensesTotal: m?.expenses.total.toFixed(1) ?? '',
      personnel: m?.expenses.personnel.toFixed(1) ?? '',
      directStudent: m?.expenses.directStudent.toFixed(1) ?? '',
      occupancy: m?.expenses.occupancy.toFixed(1) ?? '',
      other: m?.expenses.other.toFixed(1) ?? '',
      daysCash: m?.daysCash?.toString() ?? '',
      dscr: m?.dscr?.toString() ?? '',
    });
  };

  const f = (v: string) => parseFloat(v) || 0;

  const saveMonth = () => {
    const rev = f(form.revenueTotal);
    const exp = f(form.expensesTotal);
    const fiscal_year = selectedMonth < 6 ? '2025' : '2026';
    const monthName = `${FISCAL_MONTHS[selectedMonth]} ${selectedMonth < 6 ? '2025' : '2026'}`;

    const month: MonthlyActual = {
      month: monthName,
      monthIndex: selectedMonth + 1,
      revenue: {
        cps: f(form.cps),
        otherPublic: f(form.otherPublic),
        philanthropy: f(form.philanthropy),
        campus: rev - f(form.cps) - f(form.otherPublic) - f(form.philanthropy) - f(form.other),
        other: f(form.other),
        total: rev,
      },
      expenses: {
        personnel: f(form.personnel),
        baseSalaries: f(form.personnel) * 0.742,
        benefits: f(form.personnel) * 0.223,
        stipends: f(form.personnel) * 0.035,
        directStudent: f(form.directStudent),
        occupancy: f(form.occupancy),
        other: f(form.other),
        total: exp,
      },
      ebitda: rev - exp,
      netSurplus: rev - exp - 0.19, // approx debt service monthly
      daysCash: f(form.daysCash) || undefined,
      dscr: f(form.dscr) || undefined,
    };

    addOrUpdateMonth(month);
    if (updaterName) setUpdatedBy(updaterName);
    setSaved(`${monthName} saved`);
    setTimeout(() => setSaved(''), 3000);
  };

  // CSV paste parser
  const [csvText, setCsvText] = useState('');
  const parseCSV = () => {
    try {
      const rows = csvText.trim().split('\n').slice(1); // skip header
      const months: MonthlyActual[] = rows.map((row, i) => {
        const cols = row.split(',').map(c => parseFloat(c.trim()) || 0);
        const [rev, cps, otherPub, phil, campus, other_rev, exp, personnel, directSt, occupancy, other_exp, daysCash, dscr] = cols;
        return {
          month: `${FISCAL_MONTHS[i]} ${i < 6 ? '2025' : '2026'}`,
          monthIndex: i + 1,
          revenue: { cps, otherPublic: otherPub, philanthropy: phil, campus, other: other_rev, total: rev },
          expenses: {
            personnel, baseSalaries: personnel * 0.742, benefits: personnel * 0.223, stipends: personnel * 0.035,
            directStudent: directSt, occupancy, other: other_exp, total: exp
          },
          ebitda: rev - exp,
          netSurplus: rev - exp - 0.19,
          daysCash: daysCash || undefined,
          dscr: dscr || undefined,
        };
      });
      if (updaterName) setUpdatedBy(updaterName);
      setSaved(`${months.length} months loaded from CSV`);
      setTimeout(() => setSaved(''), 3000);
    } catch (e) {
      setError('CSV parse error — check format');
      setTimeout(() => setError(''), 4000);
    }
  };

  const inputStyle = {
    width: '100%', padding: '8px 10px', borderRadius: 6,
    border: '1px solid #30363D', background: '#0D1117',
    color: '#E6EDF3', fontSize: 13, fontFamily: "'DM Mono', monospace",
    boxSizing: 'border-box' as const,
  };

  const labelStyle = { fontSize: 11, color: '#8B949E', marginBottom: 3, display: 'block' as const };

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '12px 16px',
          background: open ? '#161B22' : '#0D1117',
          border: '1px solid #30363D', borderRadius: open ? '10px 10px 0 0' : 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', color: '#E6EDF3',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Upload size={15} color="#F0B429" />
          <span style={{ fontSize: 13, fontWeight: 700 }}>Update Financial Data</span>
          <span style={{ fontSize: 11, color: '#8B949E' }}>
            Last updated: {data.lastUpdated.toLocaleTimeString()} by {data.updatedBy}
          </span>
        </div>
        {open ? <ChevronUp size={15} color="#8B949E" /> : <ChevronDown size={15} color="#8B949E" />}
      </button>

      {open && (
        <div style={{
          background: '#161B22', border: '1px solid #30363D', borderTop: 'none',
          borderRadius: '0 0 10px 10px', padding: 20,
        }}>
          {/* Who's updating */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Your name (optional)</label>
            <input value={updaterName} onChange={e => setUpdaterName(e.target.value)}
              placeholder="e.g. Sarah Chen, CFO" style={{ ...inputStyle, width: 260 }} />
          </div>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid #30363D' }}>
            {(['monthly', 'budget', 'csv'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '8px 18px', border: 'none', cursor: 'pointer',
                background: 'transparent', fontSize: 12, fontWeight: tab === t ? 700 : 500,
                color: tab === t ? '#F0B429' : '#8B949E',
                borderBottom: tab === t ? '2px solid #F0B429' : '2px solid transparent',
              }}>
                {t === 'monthly' ? 'Monthly Actuals' : t === 'budget' ? 'Annual Budget' : 'CSV Paste'}
              </button>
            ))}
          </div>

          {/* Monthly actuals entry */}
          {tab === 'monthly' && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Month</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {FISCAL_MONTHS.map((m, i) => {
                    const hasData = !!data.actuals.find(a => a.monthIndex === i + 1);
                    return (
                      <button key={m} onClick={() => handleMonthChange(i)} style={{
                        padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                        fontSize: 12, fontWeight: selectedMonth === i ? 700 : 500,
                        background: selectedMonth === i ? '#F0B429' : hasData ? '#21262D' : '#0D1117',
                        color: selectedMonth === i ? '#0D1117' : hasData ? '#E6EDF3' : '#8B949E',
                        outline: hasData ? '1px solid #30363D' : 'none',
                      }}>
                        {m} {hasData ? '✓' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#8B949E', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Revenue ($M)</div>
                  {[
                    ['Total Revenue', 'revenueTotal'],
                    ['CPS Revenue', 'cps'],
                    ['Philanthropy', 'philanthropy'],
                    ['Other Public', 'otherPublic'],
                  ].map(([label, key]) => (
                    <div key={key} style={{ marginBottom: 10 }}>
                      <label style={labelStyle}>{label}</label>
                      <input type="number" step="0.1"
                        value={form[key as keyof typeof form]}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        style={inputStyle} />
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#8B949E', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Expenses ($M)</div>
                  {[
                    ['Total Expenses', 'expensesTotal'],
                    ['Personnel', 'personnel'],
                    ['Direct Student', 'directStudent'],
                    ['Occupancy', 'occupancy'],
                    ['Other', 'other'],
                  ].map(([label, key]) => (
                    <div key={key} style={{ marginBottom: 10 }}>
                      <label style={labelStyle}>{label}</label>
                      <input type="number" step="0.1"
                        value={form[key as keyof typeof form]}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        style={inputStyle} />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 4 }}>
                <div>
                  <label style={labelStyle}>Days Cash on Hand</label>
                  <input type="number" value={form.daysCash}
                    onChange={e => setForm(f => ({ ...f, daysCash: e.target.value }))}
                    style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>DSCR</label>
                  <input type="number" step="0.01" value={form.dscr}
                    onChange={e => setForm(f => ({ ...f, dscr: e.target.value }))}
                    style={inputStyle} />
                </div>
              </div>

              <button onClick={saveMonth} style={{
                marginTop: 16, padding: '10px 24px', borderRadius: 8,
                border: 'none', background: '#F0B429', color: '#0D1117',
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}>
                Save {FISCAL_MONTHS[selectedMonth]} {selectedMonth < 6 ? '2025' : '2026'}
              </button>
            </div>
          )}

          {/* Budget update */}
          {tab === 'budget' && (
            <div>
              <div style={{ fontSize: 12, color: '#8B949E', marginBottom: 16 }}>
                Override the annual FY26 budget. All variance calculations update instantly.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  ['Total Revenue ($M)', 'revenue.total'],
                  ['Total Expenses ($M)', 'expenses.total'],
                  ['Personnel ($M)', 'expenses.personnel'],
                  ['EBITDA Target ($M)', 'ebitda'],
                  ['Enrollment Target', 'enrollment'],
                  ['Days Cash Target', 'daysCashTarget'],
                ].map(([label, key]) => {
                  const keys = key.split('.');
                  const val = keys.length === 2
                    ? (data.budget as any)[keys[0]][keys[1]]
                    : (data.budget as any)[key];
                  return (
                    <div key={key}>
                      <label style={labelStyle}>{label}</label>
                      <input type="number" step="0.1" defaultValue={val}
                        onBlur={e => {
                          const v = parseFloat(e.target.value);
                          if (isNaN(v)) return;
                          if (keys.length === 2) {
                            updateBudget({ [keys[0]]: { ...(data.budget as any)[keys[0]], [keys[1]]: v } } as any);
                          } else {
                            updateBudget({ [key]: v } as any);
                          }
                        }}
                        style={inputStyle} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CSV paste */}
          {tab === 'csv' && (
            <div>
              <div style={{ fontSize: 12, color: '#8B949E', marginBottom: 10 }}>
                Paste CSV with header row: <code style={{ color: '#F0B429' }}>revenue_total, cps, other_public, philanthropy, campus, other_rev, expenses_total, personnel, direct_student, occupancy, other_exp, days_cash, dscr</code>
              </div>
              <div style={{ fontSize: 11, color: '#8B949E', marginBottom: 12 }}>One row per fiscal month (Jul → Jun). Dollar amounts in millions.</div>
              <textarea
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
                rows={10}
                placeholder="revenue_total,cps,other_public,philanthropy,campus,other_rev,expenses_total,personnel,direct_student,occupancy,other_exp,days_cash,dscr
20.3,16.8,1.4,1.2,0.1,0.8,20.5,13.6,2.7,1.3,2.9,228,3.47
..."
                style={{ ...inputStyle, width: '100%', fontFamily: "'DM Mono', monospace", fontSize: 11, resize: 'vertical' }}
              />
              <button onClick={parseCSV} style={{
                marginTop: 10, padding: '10px 24px', borderRadius: 8,
                border: 'none', background: '#F0B429', color: '#0D1117',
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}>
                Load CSV Data
              </button>
            </div>
          )}

          {/* Reset */}
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #30363D' }}>
            <button onClick={() => {
              if (confirm('Reset all financial data to Noble FY26 defaults? This cannot be undone.')) {
                localStorage.removeItem('ledger-data-v1');
                window.location.reload();
              }
            }} style={{
              padding: '7px 16px', borderRadius: 6, border: '1px solid #F85149',
              background: 'transparent', color: '#F85149',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>
              Reset to Defaults
            </button>
            <span style={{ fontSize: 11, color: '#8B949E', marginLeft: 12 }}>
              Clears all custom data and reloads Noble FY26 seed data
            </span>
          </div>
          {/* Status messages */}
          {saved && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, color: '#3FB950' }}>
              <CheckCircle size={14} /> <span style={{ fontSize: 13 }}>{saved}</span>
            </div>
          )}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, color: '#F85149' }}>
              <AlertCircle size={14} /> <span style={{ fontSize: 13 }}>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
