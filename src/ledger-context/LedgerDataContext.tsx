/**
 * LedgerDataContext — Veritas Charter Schools FY26
 * Single mutable financial data store for Ledger.
 * Reads from Admin panel (slate_financials) on load — Admin values override defaults.
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
  month: string;
  monthIndex: number;
  revenue: RevenueRow;
  expenses: ExpenseRow;
  ebitda: number;
  netSurplus: number;
  daysCash?: number;
  dscr?: number;
}

export interface AnnualBudget {
  fiscalYear: string;
  enrollment: number;
  enrollmentC1: number;
  revenue: RevenueRow;
  expenses: ExpenseRow;
  ebitda: number;
  netSurplus: number;
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

/* ── Defaults — Veritas Charter Schools FY26 ───────────────── */

const DEFAULT_BUDGET: AnnualBudget = {
  fiscalYear: 'FY26',
  enrollment: 6713,
  enrollmentC1: 6823,
  revenue: {
    cps:          110.6,
    otherPublic:   10.4,
    philanthropy:  11.1,
    campus:         1.0,
    other:          5.2,
    total:        138.3,
  },
  expenses: {
    personnel:    92.6,
    baseSalaries: 68.7,
    benefits:     20.6,
    stipends:      3.1,
    directStudent: 18.6,
    occupancy:     9.0,
    other:        11.7,
    total:        131.9,
  },
  ebitda:          4.2,
  netSurplus:     -2.1,
  dscr:            3.47,
  mads:            2.00,
  contingency:     2.2,
  daysCashTarget:  62,
};

const DEFAULT_ACTUALS: MonthlyActual[] = [
  { month: 'Jul 2025', monthIndex: 1,
    revenue:  { cps: 9.4, otherPublic: 0.8, philanthropy: 0.7, campus: 0.1, other: 0.4, total: 11.4 },
    expenses: { personnel: 7.6, baseSalaries: 5.7, benefits: 1.6, stipends: 0.4, directStudent: 1.5, occupancy: 0.7, other: 1.6, total: 11.5 },
    ebitda: -0.1, netSurplus: -0.6, daysCash: 68, dscr: 3.47 },
  { month: 'Aug 2025', monthIndex: 2,
    revenue:  { cps: 9.4, otherPublic: 0.8, philanthropy: 0.8, campus: 0.1, other: 0.5, total: 11.6 },
    expenses: { personnel: 7.5, baseSalaries: 5.6, benefits: 1.5, stipends: 0.4, directStudent: 1.5, occupancy: 0.7, other: 1.6, total: 11.3 },
    ebitda: 0.3, netSurplus: -0.2, daysCash: 66, dscr: 3.47 },
  { month: 'Sep 2025', monthIndex: 3,
    revenue:  { cps: 9.5, otherPublic: 1.0, philanthropy: 1.0, campus: 0.1, other: 0.6, total: 12.2 },
    expenses: { personnel: 7.7, baseSalaries: 5.7, benefits: 1.6, stipends: 0.4, directStudent: 1.6, occupancy: 0.8, other: 1.6, total: 11.7 },
    ebitda: 0.5, netSurplus: 0.2, daysCash: 65, dscr: 3.47 },
  { month: 'Oct 2025', monthIndex: 4,
    revenue:  { cps: 9.5, otherPublic: 1.2, philanthropy: 1.4, campus: 0.1, other: 0.7, total: 12.9 },
    expenses: { personnel: 7.7, baseSalaries: 5.8, benefits: 1.6, stipends: 0.4, directStudent: 1.6, occupancy: 0.8, other: 1.6, total: 11.7 },
    ebitda: 1.2, netSurplus: 0.8, daysCash: 65, dscr: 3.47 },
  { month: 'Nov 2025', monthIndex: 5,
    revenue:  { cps: 9.5, otherPublic: 1.3, philanthropy: 1.6, campus: 0.1, other: 0.7, total: 13.2 },
    expenses: { personnel: 7.8, baseSalaries: 5.8, benefits: 1.6, stipends: 0.4, directStudent: 1.6, occupancy: 0.8, other: 1.7, total: 11.9 },
    ebitda: 1.3, netSurplus: 1.0, daysCash: 65, dscr: 3.47 },
  { month: 'Dec 2025', monthIndex: 6,
    revenue:  { cps: 9.5, otherPublic: 1.0, philanthropy: 0.8, campus: 0.1, other: 0.5, total: 11.9 },
    expenses: { personnel: 7.7, baseSalaries: 5.7, benefits: 1.6, stipends: 0.4, directStudent: 1.6, occupancy: 0.8, other: 1.7, total: 11.8 },
    ebitda: 0.1, netSurplus: -0.3, daysCash: 64, dscr: 3.47 },
  { month: 'Jan 2026', monthIndex: 7,
    revenue:  { cps: 9.4, otherPublic: 0.6, philanthropy: 0.8, campus: 0.1, other: 0.4, total: 11.3 },
    expenses: { personnel: 7.6, baseSalaries: 5.7, benefits: 1.6, stipends: 0.4, directStudent: 1.6, occupancy: 0.8, other: 1.7, total: 11.7 },
    ebitda: -0.4, netSurplus: -0.8, daysCash: 62, dscr: 3.47 },
];

const DEFAULT_HISTORICAL: HistoricalYear[] = [
  { year: 'FY20', enrollment: 6876, cpsRevenue:  87.1, totalRevenue: 104.6, totalExpenses:  99.3, ebitda:  5.3, netSurplus:  3.3, dscr: 3.35, personnel: 69.7 },
  { year: 'FY21', enrollment: 7142, cpsRevenue:  91.9, totalRevenue: 109.2, totalExpenses: 105.0, ebitda:  4.2, netSurplus:  1.7, dscr: 2.30, personnel: 78.2 },
  { year: 'FY22', enrollment: 6935, cpsRevenue:  97.0, totalRevenue: 128.5, totalExpenses: 125.6, ebitda:  2.9, netSurplus: -2.7, dscr: 2.41, personnel: 86.4 },
  { year: 'FY23', enrollment: 6835, cpsRevenue: 100.6, totalRevenue: 128.6, totalExpenses: 124.6, ebitda:  4.0, netSurplus:  8.8, dscr: 2.70, personnel: 86.8 },
  { year: 'FY24', enrollment: 6799, cpsRevenue: 107.2, totalRevenue: 134.0, totalExpenses: 127.9, ebitda:  6.1, netSurplus:  9.8, dscr: 4.60, personnel: 86.8 },
  { year: 'FY25', enrollment: 6823, cpsRevenue: 105.9, totalRevenue: 133.0, totalExpenses: 131.2, ebitda:  1.7, netSurplus: -1.7, dscr: 2.82, personnel: 91.2 },
];

const DEFAULT_COVENANTS: CovenantConfig = {
  dscrMinimum:        1.00,
  dscrBondDoc:        1.10,
  madsPostRefunding:  2.00,
  daysCashMinimum:    30,
  currentRatioMinimum: 1.10,
  netAssetMinimum:    11.0,
  depreciation:        3.5,
  interestExpense:     0.7,
};

/* ── Admin Bridge ───────────────────────────────────────────── */
// Reads slate_financials written by AdminApp and merges into budget + covenants.

function mergeAdminFinancials(base: LedgerData): LedgerData {
  try {
    const raw = localStorage.getItem('slate_financials');
    if (!raw) return base;
    const a = JSON.parse(raw);

    const totalRevM = (a.totalRevenue ?? 0) / 1_000_000;
    const totalExpM = (a.totalExpenses ?? 0) / 1_000_000;
    const ebitdaM   = (a.ebitda       ?? 0) / 1_000_000;
    const surplusM  = (a.netSurplus   ?? 0) / 1_000_000;
    const contM     = (a.contingency  ?? 0) / 1_000_000;
    const madsM     = (a.mads         ?? 0) / 1_000_000;

    // Recompute revenue breakdown proportionally if total changed
    const revRatio = totalRevM > 0 ? totalRevM / base.budget.revenue.total : 1;
    const expRatio = totalExpM > 0 ? totalExpM / base.budget.expenses.total : 1;

    const updatedBudget: AnnualBudget = {
      ...base.budget,
      revenue: {
        cps:          parseFloat((base.budget.revenue.cps          * revRatio).toFixed(1)),
        otherPublic:  parseFloat((base.budget.revenue.otherPublic  * revRatio).toFixed(1)),
        philanthropy: parseFloat((base.budget.revenue.philanthropy * revRatio).toFixed(1)),
        campus:       parseFloat((base.budget.revenue.campus       * revRatio).toFixed(1)),
        other:        parseFloat((base.budget.revenue.other        * revRatio).toFixed(1)),
        total:        parseFloat(totalRevM.toFixed(1)),
      },
      expenses: {
        personnel:    parseFloat((base.budget.expenses.personnel    * expRatio).toFixed(1)),
        baseSalaries: parseFloat((base.budget.expenses.baseSalaries * expRatio).toFixed(1)),
        benefits:     parseFloat((base.budget.expenses.benefits     * expRatio).toFixed(1)),
        stipends:     parseFloat((base.budget.expenses.stipends     * expRatio).toFixed(1)),
        directStudent:parseFloat((base.budget.expenses.directStudent* expRatio).toFixed(1)),
        occupancy:    parseFloat((base.budget.expenses.occupancy    * expRatio).toFixed(1)),
        other:        parseFloat((base.budget.expenses.other        * expRatio).toFixed(1)),
        total:        parseFloat(totalExpM.toFixed(1)),
      },
      ebitda:         ebitdaM  || base.budget.ebitda,
      netSurplus:     surplusM || base.budget.netSurplus,
      dscr:           a.dscr         ?? base.budget.dscr,
      mads:           madsM    || base.budget.mads,
      contingency:    contM    || base.budget.contingency,
      daysCashTarget: a.daysCashOnHand ?? base.budget.daysCashTarget,
    };

    const updatedCovenants: CovenantConfig = {
      ...base.covenants,
      dscrMinimum:       a.dscrCovenant        ?? base.covenants.dscrMinimum,
      madsPostRefunding: madsM || base.covenants.madsPostRefunding,
    };

    return { ...base, budget: updatedBudget, covenants: updatedCovenants };
  } catch {
    return base;
  }
}

/* ── Derived / computed helpers ─────────────────────────────── */

export function computeYTD(actuals: MonthlyActual[]) {
  if (actuals.length === 0) return null;
  const rev = actuals.reduce((acc, m) => ({
    cps:          acc.cps          + m.revenue.cps,
    otherPublic:  acc.otherPublic  + m.revenue.otherPublic,
    philanthropy: acc.philanthropy + m.revenue.philanthropy,
    campus:       acc.campus       + m.revenue.campus,
    other:        acc.other        + m.revenue.other,
    total:        acc.total        + m.revenue.total,
  }), { cps: 0, otherPublic: 0, philanthropy: 0, campus: 0, other: 0, total: 0 });

  const exp = actuals.reduce((acc, m) => ({
    personnel:     acc.personnel     + m.expenses.personnel,
    baseSalaries:  acc.baseSalaries  + m.expenses.baseSalaries,
    benefits:      acc.benefits      + m.expenses.benefits,
    stipends:      acc.stipends      + m.expenses.stipends,
    directStudent: acc.directStudent + m.expenses.directStudent,
    occupancy:     acc.occupancy     + m.expenses.occupancy,
    other:         acc.other         + m.expenses.other,
    total:         acc.total         + m.expenses.total,
  }), { personnel: 0, baseSalaries: 0, benefits: 0, stipends: 0, directStudent: 0, occupancy: 0, other: 0, total: 0 });

  return {
    asOf: actuals[actuals.length - 1].month,
    monthsElapsed: actuals.length,
    revenue: rev,
    expenses: exp,
    ebitda: rev.total - exp.total,
    netSurplus: actuals.reduce((s, m) => s + m.netSurplus, 0),
    daysCash: actuals[actuals.length - 1].daysCash ?? 0,
    dscr: actuals[actuals.length - 1].dscr ?? 0,
    proratedBudgetFactor: actuals.length / 12,
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

const STORAGE_KEY = 'ledger-data-v2';   // bumped from v1 to force fresh Veritas load

export function LedgerProvider({ children }: { children: ReactNode }) {

  const loadFromStorage = (): LedgerData => {
    const base: LedgerData = (() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {
          budget: DEFAULT_BUDGET, actuals: DEFAULT_ACTUALS,
          historical: DEFAULT_HISTORICAL, covenants: DEFAULT_COVENANTS,
          lastUpdated: new Date(), updatedBy: 'System Default',
        };
        const parsed = JSON.parse(raw);
        return { ...parsed, lastUpdated: new Date(parsed.lastUpdated) };
      } catch {
        return {
          budget: DEFAULT_BUDGET, actuals: DEFAULT_ACTUALS,
          historical: DEFAULT_HISTORICAL, covenants: DEFAULT_COVENANTS,
          lastUpdated: new Date(), updatedBy: 'System Default',
        };
      }
    })();

    // Admin panel values override on every load
    return mergeAdminFinancials(base);
  };

  const [data, setData] = useState<LedgerData>(loadFromStorage);

  const saveToStorage = (d: LedgerData) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {}
  };

  const ytd = computeYTD(data.actuals);

  const updateBudget = useCallback((patch: Partial<AnnualBudget>) => {
    setData(d => {
      const next = { ...d, budget: { ...d.budget, ...patch }, lastUpdated: new Date() };
      saveToStorage(next); return next;
    });
  }, []);

  const addOrUpdateMonth = useCallback((month: MonthlyActual) => {
    setData(d => {
      const existing = d.actuals.findIndex(a => a.month === month.month);
      const actuals = existing >= 0
        ? d.actuals.map((a, i) => i === existing ? month : a)
        : [...d.actuals, month].sort((a, b) => a.monthIndex - b.monthIndex);
      const next = { ...d, actuals, lastUpdated: new Date() };
      saveToStorage(next); return next;
    });
  }, []);

  const replaceActuals = useCallback((months: MonthlyActual[]) => {
    setData(d => {
      const next = { ...d, actuals: months.sort((a, b) => a.monthIndex - b.monthIndex), lastUpdated: new Date() };
      saveToStorage(next); return next;
    });
  }, []);

  const updateCovenants = useCallback((patch: Partial<CovenantConfig>) => {
    setData(d => {
      const next = { ...d, covenants: { ...d.covenants, ...patch }, lastUpdated: new Date() };
      saveToStorage(next); return next;
    });
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
