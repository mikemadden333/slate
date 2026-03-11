export const FY26_BUDGET = {
  enrollment: 6713,
  enrollmentC1: 6823,
  totalRevenue: 138.3,
  totalExpenses: 131.9,
  ebitda: 4.2,
  netSurplus: -2.1,
  dscr: 3.47,
  contingency: 2.2,
  mads: 2.00,
  personnelTotal: 92.6,
  baseSalaries: 68.7,
  benefits: 20.6,
  stipends: 3.1,
};

export const FY26_YTD = {
  asOf: 'January 2026',
  monthsElapsed: 7,
  revenue: {
    cps:          { actual: 66.2,  budget: 66.1,  variance: 0.1  },
    otherPublic:  { actual: 6.7,   budget: 5.9,   variance: 0.8  },
    campus:       { actual: 0.6,   budget: 0.6,   variance: 0.1  },
    philanthropy: { actual: 7.1,   budget: 5.9,   variance: 1.3  },
    total:        { actual: 80.8,  budget: 78.5,  variance: 2.2  },
  },
  expenses: {
    personnel:    { actual: 53.8,  budget: 52.0,  variance: -1.8 },
    directStudent:{ actual: 10.7,  budget: 10.9,  variance: 0.2  },
    occupancy:    { actual: 5.3,   budget: 5.3,   variance: 0.0  },
    other:        { actual: 5.5,   budget: 5.2,   variance: -0.3 },
    total:        { actual: 75.5,  budget: 73.7,  variance: -1.8 },
  },
  ebitda:     { actual: 5.2,  budget: 4.8,  variance: 0.4 },
  netSurplus: { actual: 4.3,  budget: 1.0,  variance: 3.3 },
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
  depreciation: 3.5,
  interestExpense: 0.7,
};
