export const COMPENSATION = {
  fy26: {
    personnelTotal: 92.6,
    baseSalaries: 68.7,
    benefits: 20.6,
    stipends: 3.1,
    personnelPctOfOpex: 70,
  },
  historicalPersonnel: [
    { year: 'FY20', base: 49.4, benefits: 16.0, stipends: 4.3, total: 69.7 },
    { year: 'FY21', base: 55.7, benefits: 18.0, stipends: 4.5, total: 78.2 },
    { year: 'FY22', base: 61.6, benefits: 19.7, stipends: 5.0, total: 86.4 },
    { year: 'FY23', base: 62.3, benefits: 19.6, stipends: 4.9, total: 86.9 },
    { year: 'FY24', base: 63.1, benefits: 19.2, stipends: 4.5, total: 86.8 },
    { year: 'FY25', base: 66.2, benefits: 20.2, stipends: 4.8, total: 91.1 },
    { year: 'FY26', base: 68.7, benefits: 20.6, stipends: 3.1, total: 92.5 },
  ],
  cpsGap: {
    cpsL1Step0: 65090,
    veritasStarting: 60000,
    gapPct: -7.8,
  },
  fiveYearPressure: 13.7,  // millions SY25-SY30
  fy27Scenarios: {
    optimistic:  { total: 95.8,  delta: 3.1, l2Premium: 4000, healthGrowth: '10%' },
    reasonable:  { total: 98.3,  delta: 5.7, l2Premium: 2000, healthGrowth: '15%' },
    pessimistic: { total: 100.4, delta: 7.8, l2Premium: 2000, healthGrowth: '15%' },
  },
  scenarioGap: {
    totalGap: 2.5,        // millions between optimistic and reasonable
    l2PremiumSwing: 1.3,
    healthCostSwing: 1.2,
    pctExplained: 95,
  },
};
