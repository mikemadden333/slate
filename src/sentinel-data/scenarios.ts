export const SCENARIO_ASSUMPTIONS = {
  optimistic: {
    label: 'Optimistic',
    pctcGrowth: '7% FY27, 5% FY28+',
    l2Premium: 4000,
    retention: 0.98,
    c1Share: 0.14,
    philanthropyGrowth: 0.08,
    healthGrowth: '10% → 6%',
    contingency: 4.0,
  },
  reasonable: {
    label: 'Reasonable',
    pctcGrowth: '5% all years',
    l2Premium: 2000,
    retention: 0.98,
    c1Share: 0.135,
    philanthropyGrowth: 0.05,
    healthGrowth: '15% → 10%',
    contingency: 2.0,
  },
  pessimistic: {
    label: 'Pessimistic',
    pctcGrowth: '3% all years',
    l2Premium: 2000,
    retention: 0.97,
    c1Share: 0.13,
    philanthropyGrowth: 0.03,
    healthGrowth: '15% → 12%',
    contingency: 2.0,
  },
};

export const PROJECTIONS = {
  optimistic: [
    { year: 'FY27', enrollmentC1: 12182, totalRevenue: 254.7, totalExpenses: 245.9, ebitda: 4.8, netSurplus: 2.8, dscr: 3.53, cushion: 7.1 },
    { year: 'FY28', enrollmentC1: 12215, totalRevenue: 267.4, totalExpenses: 255.8, ebitda: 7.6, netSurplus: 4.9, dscr: 4.28, cushion: 9.2 },
    { year: 'FY29', enrollmentC1: 12188, totalRevenue: 279.5, totalExpenses: 265.2, ebitda: 10.3, netSurplus: 6.9, dscr: 4.95, cushion: 11.1 },
    { year: 'FY30', enrollmentC1: 12251, totalRevenue: 294.2, totalExpenses: 275.0, ebitda: 15.1, netSurplus: 12.1, dscr: 6.77, cushion: 16.2 },
    { year: 'FY31', enrollmentC1: 12262, totalRevenue: 308.7, totalExpenses: 285.4, ebitda: 19.3, netSurplus: 17.6, dscr: 8.69, cushion: 21.5 },
  ],
  reasonable: [
    { year: 'FY27', enrollmentC1: 12182, totalRevenue: 250.4, totalExpenses: 250.3, ebitda: -1.9, netSurplus: -3.0, dscr: 1.49, cushion: 1.4 },
    { year: 'FY28', enrollmentC1: 12128, totalRevenue: 259.5, totalExpenses: 260.8, ebitda: -3.3, netSurplus: -3.8, dscr: 0.72, cushion: -0.8 },
    { year: 'FY29', enrollmentC1: 12110, totalRevenue: 272.5, totalExpenses: 270.9, ebitda: -0.4, netSurplus: -3.1, dscr: 1.45, cushion: 1.3 },
    { year: 'FY30', enrollmentC1: 12108, totalRevenue: 285.0, totalExpenses: 281.5, ebitda: 1.5, netSurplus: -0.8, dscr: 2.22, cushion: 3.4 },
    { year: 'FY31', enrollmentC1: 12106, totalRevenue: 298.1, totalExpenses: 292.5, ebitda: 3.6, netSurplus: 0.8, dscr: 3.12, cushion: 5.9 },
  ],
  pessimistic: [
    { year: 'FY27', enrollmentC1: 11900, totalRevenue: 245.0, totalExpenses: 252.0, ebitda: -7.0, netSurplus: -9.5, dscr: 0.85, cushion: -2.1 },
    { year: 'FY28', enrollmentC1: 11750, totalRevenue: 250.0, totalExpenses: 262.0, ebitda: -12.0, netSurplus: -14.5, dscr: 0.20, cushion: -5.6 },
    { year: 'FY29', enrollmentC1: 11600, totalRevenue: 255.0, totalExpenses: 270.0, ebitda: -15.0, netSurplus: -17.5, dscr: -0.10, cushion: -8.1 },
    { year: 'FY30', enrollmentC1: 11500, totalRevenue: 260.0, totalExpenses: 278.0, ebitda: -18.0, netSurplus: -20.5, dscr: -0.35, cushion: -10.5 },
    { year: 'FY31', enrollmentC1: 11400, totalRevenue: 265.0, totalExpenses: 285.0, ebitda: -20.0, netSurplus: -22.5, dscr: -0.50, cushion: -12.0 },
  ],
};
