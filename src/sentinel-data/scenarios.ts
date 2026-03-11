export const SCENARIO_ASSUMPTIONS = {
  optimistic: {
    label: 'Optimistic',
    pctcGrowth: '7% FY27, 5% FY28+',
    l2Premium: 4000,
    retention: 0.98,
    c1Share: 0.14,
    philanthropyGrowth: 0.08,
    healthGrowth: '10% → 6%',
    contingency: 2.2,
  },
  reasonable: {
    label: 'Reasonable',
    pctcGrowth: '5% all years',
    l2Premium: 2000,
    retention: 0.98,
    c1Share: 0.135,
    philanthropyGrowth: 0.05,
    healthGrowth: '15% → 10%',
    contingency: 1.1,
  },
  pessimistic: {
    label: 'Pessimistic',
    pctcGrowth: '3% all years',
    l2Premium: 2000,
    retention: 0.97,
    c1Share: 0.13,
    philanthropyGrowth: 0.03,
    healthGrowth: '15% → 12%',
    contingency: 1.1,
  },
};

export const PROJECTIONS = {
  optimistic: [
    { year: 'FY27', enrollmentC1: 6834, totalRevenue: 142.9, totalExpenses: 138.0, ebitda: 2.7,  netSurplus: 1.6,   dscr: 3.53, cushion: 4.0  },
    { year: 'FY28', enrollmentC1: 6853, totalRevenue: 150.0, totalExpenses: 143.5, ebitda: 4.3,  netSurplus: 2.7,   dscr: 4.28, cushion: 5.2  },
    { year: 'FY29', enrollmentC1: 6838, totalRevenue: 156.8, totalExpenses: 148.8, ebitda: 5.8,  netSurplus: 3.9,   dscr: 4.95, cushion: 6.2  },
    { year: 'FY30', enrollmentC1: 6873, totalRevenue: 165.1, totalExpenses: 154.3, ebitda: 8.5,  netSurplus: 6.8,   dscr: 6.77, cushion: 9.1  },
    { year: 'FY31', enrollmentC1: 6879, totalRevenue: 173.2, totalExpenses: 160.2, ebitda: 10.8, netSurplus: 9.9,   dscr: 8.69, cushion: 12.1 },
  ],
  reasonable: [
    { year: 'FY27', enrollmentC1: 6834, totalRevenue: 140.5, totalExpenses: 140.4, ebitda: -1.1, netSurplus: -1.7,  dscr: 1.49, cushion: 0.8  },
    { year: 'FY28', enrollmentC1: 6803, totalRevenue: 145.6, totalExpenses: 146.3, ebitda: -1.9, netSurplus: -2.1,  dscr: 0.72, cushion: -0.4 },
    { year: 'FY29', enrollmentC1: 6793, totalRevenue: 152.9, totalExpenses: 152.0, ebitda: -0.2, netSurplus: -1.7,  dscr: 1.45, cushion: 0.7  },
    { year: 'FY30', enrollmentC1: 6792, totalRevenue: 159.9, totalExpenses: 157.9, ebitda: 0.8,  netSurplus: -0.4,  dscr: 2.22, cushion: 1.9  },
    { year: 'FY31', enrollmentC1: 6791, totalRevenue: 167.3, totalExpenses: 164.1, ebitda: 2.0,  netSurplus: 0.4,   dscr: 3.12, cushion: 3.3  },
  ],
  pessimistic: [
    { year: 'FY27', enrollmentC1: 6676, totalRevenue: 137.5, totalExpenses: 141.4, ebitda: -3.9, netSurplus: -5.3,  dscr: 0.85, cushion: -1.2 },
    { year: 'FY28', enrollmentC1: 6592, totalRevenue: 140.3, totalExpenses: 147.0, ebitda: -6.7, netSurplus: -8.1,  dscr: 0.20, cushion: -3.1 },
    { year: 'FY29', enrollmentC1: 6508, totalRevenue: 143.1, totalExpenses: 151.5, ebitda: -8.4, netSurplus: -9.8,  dscr: -0.10, cushion: -4.5 },
    { year: 'FY30', enrollmentC1: 6452, totalRevenue: 145.9, totalExpenses: 155.9, ebitda: -10.1, netSurplus: -11.5, dscr: -0.35, cushion: -5.9 },
    { year: 'FY31', enrollmentC1: 6396, totalRevenue: 148.7, totalExpenses: 159.9, ebitda: -11.2, netSurplus: -12.6, dscr: -0.50, cushion: -6.7 },
  ],
};
