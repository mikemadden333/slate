export const FY26_BUDGET = {
  enrollment: 11969,
  enrollmentC1: 12148,
  totalRevenue: 246.6,
  totalExpenses: 235.1,
  ebitda: 7.5,
  netSurplus: -3.7,
  dscr: 3.47,
  contingency: 4.0,
  mads: 3.56,
  personnelTotal: 165.1,
  baseSalaries: 122.5,
  benefits: 36.8,
  stipends: 5.6,
};

export const FY26_YTD = {
  asOf: 'January 2026',
  monthsElapsed: 7,
  revenue: {
    cps: { actual: 118.0, budget: 117.9, variance: 0.1 },
    otherPublic: { actual: 12.0, budget: 10.5, variance: 1.5 },
    campus: { actual: 1.1, budget: 1.0, variance: 0.1 },
    philanthropy: { actual: 12.7, budget: 10.5, variance: 2.3 },
    total: { actual: 144.0, budget: 139.9, variance: 4.0 },
  },
  expenses: {
    personnel: { actual: 95.8, budget: 92.7, variance: -3.2 },
    directStudent: { actual: 19.1, budget: 19.4, variance: 0.4 },
    occupancy: { actual: 9.4, budget: 9.4, variance: 0.0 },
    other: { actual: 9.8, budget: 9.3, variance: -0.5 },
    total: { actual: 134.6, budget: 131.3, variance: -3.3 },
  },
  ebitda: { actual: 9.3, budget: 8.6, variance: 0.7 },
  netSurplus: { actual: 7.7, budget: 1.8, variance: 5.9 },
  dscr: 3.47,
  daysCash: 215,
  currentRatio: 3.00,
  netAssetRatio: 69.1,
};

export const COVENANTS = {
  dscrMinimum: 1.0,
  dscrBondDoc: 1.10,
  madsPostRefunding: 2.8,
  madsPreRefunding: 3.18,
  daysCashMinimum: 30,
  currentRatioMinimum: 1.10,
  netAssetMinimum: 20.0,
  depreciation: 6.2,
  interestExpense: 1.3,
};
