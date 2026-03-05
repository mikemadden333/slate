/**
 * LedgerDataContext — single mutable financial data store for Ledger.
 * CFO/FP&A can update budget and monthly actuals at runtime.
 * All modules read from here — nothing hardcoded.
 */
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

/* ── Types ─────────────────────────────────────────────────── */

export interface RevenueRow {
  cps: number;
  otherPublic: number;
  philanthropy: number;
  campus: number;
  other: number;
  total: number;
}

export interface ExpenseRow {
  personnel: number;
  baseSalaries: number;
  benefits: number;
  stipends: number;
  directStudent: number;
  occupancy: number;
  other: number;
  total: number;
}

export interface MonthlyActual {
  month: string;         // 'Jul 2025', 'Aug 2025', ...
  monthIndex: number;    // 1-12
  revenue: RevenueRow;
  expenses: ExpenseRow;
  ebitda: number;
  netSurplus: number;
  daysCash?: number;
  dscr?: number;
}

export interface AnnualBudget {
  fiscalYear: string;    // 'FY26'
  enrollment: number;
  enrollmentC1: number;
  revenue: RevenueRow;
  expenses: ExpenseRow;
  ebitda: number;        // target
  netSurplus: number;    // target
  dscr: number;
  mads: number;
  contingency: number;
  daysCashTarget: number;
}

export interface HistoricalYear {
  year: string;
  enrollment: number;
  totalRevenue: number;
  totalExpenses: number;
  ebitda: number;
  netSurplus: number;
  dscr: number;
  personnel: number;
  cpsRevenue: number;
}

export interface CovenantConfig {
  dscrMinimum: number;
  dscrBondDoc: number;
  madsPostRefunding: number;
  daysCashMinimum: number;
  currentRatioMinimum: number;
  netAssetMinimum: number;
  depreciation: number;
  interestExpense: number;
}

export interface LedgerData {
  budget: AnnualBudget;
  actuals: MonthlyActual[];
  historical: HistoricalYear[];
  covenants: CovenantConfig;
  lastUpdated: Date;
  updatedBy: string;
}

/* ── Defaults (Noble FY26 seed data) ───────────────────────── */

const DEFAULT_BUDGET: AnnualBudget = {
  fiscalYear: 'FY26',
  enrollment: 11969,
  enrollmentC1: 12148,
  revenue: {
    cps: 197.2,
    otherPublic: 18.5,
    philanthropy: 19.8,
    campus: 1.8,
    other: 9.3,
    total: 246.6,
  },
  expenses: {
    personnel: 165.1,
    baseSalaries: 122.5,
    benefits: 36.8,
    stipends: 5.6,
    directStudent: 33.1,
    occupancy: 16.1,
    other: 20.8,
    total: 235.1,
  },
  ebitda: 7.5,
  netSurplus: -3.7,
  dscr: 3.47,
  mads: 3.56,
  contingency: 4.0,
  daysCashTarget: 180,
};

const DEFAULT_ACTUALS: MonthlyActual[] = [
  { month: 'Jul 2025', monthIndex: 1,
    revenue: { cps: 16.8, otherPublic: 1.4, philanthropy: 1.2, campus: 0.1, other: 0.8, total: 20.3 },
    expenses: { personnel: 13.6, baseSalaries: 10.1, benefits: 2.8, stipends: 0.7, directStudent: 2.7, occupancy: 1.3, other: 2.9, total: 20.5 },
    ebitda: -0.2, netSurplus: -1.1, daysCash: 228, dscr: 3.47 },
  { month: 'Aug 2025', monthIndex: 2,
    revenue: { cps: 16.8, otherPublic: 1.5, philanthropy: 1.4, campus: 0.1, other: 0.9, total: 20.7 },
    expenses: { personnel: 13.4, baseSalaries: 10.0, benefits: 2.7, stipends: 0.7, directStudent: 2.7, occupancy: 1.3, other: 2.8, total: 20.2 },
    ebitda: 0.5, netSurplus: -0.3, daysCash: 222, dscr: 3.47 },
  { month: 'Sep 2025', monthIndex: 3,
    revenue: { cps: 16.9, otherPublic: 1.8, philanthropy: 1.8, campus: 0.2, other: 1.1, total: 21.8 },
    expenses: { personnel: 13.7, baseSalaries: 10.2, benefits: 2.8, stipends: 0.7, directStudent: 2.8, occupancy: 1.4, other: 2.9, total: 20.8 },
    ebitda: 1.0, netSurplus: 0.4, daysCash: 218, dscr: 3.47 },
  { month: 'Oct 2025', monthIndex: 4,
    revenue: { cps: 16.9, otherPublic: 2.1, philanthropy: 2.5, campus: 0.2, other: 1.2, total: 22.9 },
    expenses: { personnel: 13.8, baseSalaries: 10.3, benefits: 2.8, stipends: 0.7, directStudent: 2.8, occupancy: 1.4, other: 2.9, total: 20.9 },
    ebitda: 2.0, netSurplus: 1.4, daysCash: 220, dscr: 3.47 },
  { month: 'Nov 2025', monthIndex: 5,
    revenue: { cps: 16.9, otherPublic: 2.4, philanthropy: 2.8, campus: 0.2, other: 1.3, total: 23.6 },
    expenses: { personnel: 13.9, baseSalaries: 10.3, benefits: 2.9, stipends: 0.7, directStudent: 2.9, occupancy: 1.4, other: 3.0, total: 21.2 },
    ebitda: 2.4, netSurplus: 1.8, daysCash: 219, dscr: 3.47 },
  { month: 'Dec 2025', monthIndex: 6,
    revenue: { cps: 16.9, otherPublic: 1.8, philanthropy: 1.5, campus: 0.2, other: 0.9, total: 21.3 },
    expenses: { personnel: 13.8, baseSalaries: 10.2, benefits: 2.8, stipends: 0.8, directStudent: 2.8, occupancy: 1.4, other: 3.1, total: 21.1 },
    ebitda: 0.2, netSurplus: -0.5, daysCash: 215, dscr: 3.47 },
  { month: 'Jan 2026', monthIndex: 7,
    revenue: { cps: 16.8, otherPublic: 1.0, philanthropy: 1.5, campus: 0.1, other: 0.7, total: 20.1 },
    expenses: { personnel: 13.6, baseSalaries: 10.1, benefits: 2.8, stipends: 0.7, directStudent: 2.8, occupancy: 1.4, other: 3.1, total: 20.9 },
    ebitda: -0.8, netSurplus: -1.4, daysCash: 215, dscr: 3.47 },
];

const DEFAULT_HISTORICAL: HistoricalYear[] = [
  { year: 'FY20', enrollment: 12254, cpsRevenue: 155.3, totalRevenue: 186.5, totalExpenses: 177.0, ebitda: 9.5, netSurplus: 5.8, dscr: 3.35, personnel: 124.2 },
  { year: 'FY21', enrollment: 12730, cpsRevenue: 163.8, totalRevenue: 194.7, totalExpenses: 187.2, ebitda: 7.5, netSurplus: 3.1, dscr: 2.30, personnel: 139.3 },
  { year: 'FY22', enrollment: 12361, cpsRevenue: 172.9, totalRevenue: 229.1, totalExpenses: 223.9, ebitda: 5.2, netSurplus: -4.9, dscr: 2.41, personnel: 154.0 },
  { year: 'FY23', enrollment: 12183, cpsRevenue: 179.3, totalRevenue: 229.2, totalExpenses: 222.1, ebitda: 7.1, netSurplus: 15.7, dscr: 2.70, personnel: 154.8 },
  { year: 'FY24', enrollment: 12120, cpsRevenue: 191.0, totalRevenue: 238.9, totalExpenses: 228.1, ebitda: 10.8, netSurplus: 17.4, dscr: 4.60, personnel: 154.8 },
  { year: 'FY25', enrollment: 12163, cpsRevenue: 188.8, totalRevenue: 237.0, totalExpenses: 233.9, ebitda: 3.1, netSurplus: -3.0, dscr: 2.82, personnel: 162.5 },
];

const DEFAULT_COVENANTS: CovenantConfig = {
  dscrMinimum: 1.0,
  dscrBondDoc: 1.10,
  madsPostRefunding: 2.8,
  daysCashMinimum: 30,
  currentRatioMinimum: 1.10,
  netAssetMinimum: 20.0,
  depreciation: 6.2,
  interestExpense: 1.3,
};

/* ── Derived / computed helpers ─────────────────────────────── */

export function computeYTD(actuals: MonthlyActual[]) {
  if (actuals.length === 0) return null;
  const rev = actuals.reduce((acc, m) => ({
    cps: acc.cps + m.revenue.cps,
    otherPublic: acc.otherPublic + m.revenue.otherPublic,
    philanthropy: acc.philanthropy + m.revenue.philanthropy,
    campus: acc.campus + m.revenue.campus,
    other: acc.other + m.revenue.other,
    total: acc.total + m.revenue.total,
  }), { cps: 0, otherPublic: 0, philanthropy: 0, campus: 0, other: 0, total: 0 });

  const exp = actuals.reduce((acc, m) => ({
    personnel: acc.personnel + m.expenses.personnel,
    baseSalaries: acc.baseSalaries + m.expenses.baseSalaries,
    benefits: acc.benefits + m.expenses.benefits,
    stipends: acc.stipends + m.expenses.stipends,
    directStudent: acc.directStudent + m.expenses.directStudent,
    occupancy: acc.occupancy + m.expenses.occupancy,
    other: acc.other + m.expenses.other,
    total: acc.total + m.expenses.total,
  }), { personnel: 0, baseSalaries: 0, benefits: 0, stipends: 0, directStudent: 0, occupancy: 0, other: 0, total: 0 });

  const monthsElapsed = actuals.length;
  const proratedBudgetFactor = monthsElapsed / 12;

  return {
    asOf: actuals[actuals.length - 1].month,
    monthsElapsed,
    revenue: rev,
    expenses: exp,
    ebitda: rev.total - exp.total,
    netSurplus: actuals.reduce((s, m) => s + m.netSurplus, 0),
    daysCash: actuals[actuals.length - 1].daysCash ?? 0,
    dscr: actuals[actuals.length - 1].dscr ?? 0,
    proratedBudgetFactor,
  };
}

/* ── Context ─────────────────────────────────────────────────── */

interface LedgerContextType {
  data: LedgerData;
  ytd: ReturnType<typeof computeYTD>;
  updateBudget: (budget: Partial<AnnualBudget>) => void;
  addOrUpdateMonth: (month: MonthlyActual) => void;
  replaceActuals: (months: MonthlyActual[]) => void;
  updateCovenants: (c: Partial<CovenantConfig>) => void;
  setUpdatedBy: (name: string) => void;
}

const LedgerContext = createContext<LedgerContextType | null>(null);

export function LedgerProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<LedgerData>({
    budget: DEFAULT_BUDGET,
    actuals: DEFAULT_ACTUALS,
    historical: DEFAULT_HISTORICAL,
    covenants: DEFAULT_COVENANTS,
    lastUpdated: new Date(),
    updatedBy: 'System Default',
  });

  const ytd = computeYTD(data.actuals);

  const updateBudget = useCallback((patch: Partial<AnnualBudget>) => {
    setData(d => ({ ...d, budget: { ...d.budget, ...patch }, lastUpdated: new Date() }));
  }, []);

  const addOrUpdateMonth = useCallback((month: MonthlyActual) => {
    setData(d => {
      const existing = d.actuals.findIndex(a => a.month === month.month);
      const actuals = existing >= 0
        ? d.actuals.map((a, i) => i === existing ? month : a)
        : [...d.actuals, month].sort((a, b) => a.monthIndex - b.monthIndex);
      return { ...d, actuals, lastUpdated: new Date() };
    });
  }, []);

  const replaceActuals = useCallback((months: MonthlyActual[]) => {
    setData(d => ({ ...d, actuals: months.sort((a, b) => a.monthIndex - b.monthIndex), lastUpdated: new Date() }));
  }, []);

  const updateCovenants = useCallback((patch: Partial<CovenantConfig>) => {
    setData(d => ({ ...d, covenants: { ...d.covenants, ...patch }, lastUpdated: new Date() }));
  }, []);

  const setUpdatedBy = useCallback((name: string) => {
    setData(d => ({ ...d, updatedBy: name }));
  }, []);

  return (
    <LedgerContext.Provider value={{ data, ytd, updateBudget, addOrUpdateMonth, replaceActuals, updateCovenants, setUpdatedBy }}>
      {children}
    </LedgerContext.Provider>
  );
}

export function useLedger() {
  const ctx = useContext(LedgerContext);
  if (!ctx) throw new Error('useLedger must be used within LedgerProvider');
  return ctx;
}
