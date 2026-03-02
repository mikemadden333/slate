export const COMPENSATION = {
  fy26: {
    personnelTotal: 165.1,
    baseSalaries: 122.5,
    benefits: 36.8,
    stipends: 5.6,
    personnelPctOfOpex: 70,
  },
  historicalPersonnel: [
    { year: 'FY20', base: 88.1, benefits: 28.5, stipends: 7.6, total: 124.2 },
    { year: 'FY21', base: 99.2, benefits: 32.1, stipends: 8.0, total: 139.3 },
    { year: 'FY22', base: 109.8, benefits: 35.2, stipends: 9.0, total: 154.0 },
    { year: 'FY23', base: 111.0, benefits: 35.0, stipends: 8.8, total: 154.8 },
    { year: 'FY24', base: 112.5, benefits: 34.3, stipends: 8.0, total: 154.8 },
    { year: 'FY25', base: 118.0, benefits: 36.0, stipends: 8.5, total: 162.5 },
    { year: 'FY26', base: 122.5, benefits: 36.8, stipends: 5.6, total: 165.1 },
  ],
  cpsGap: {
    cpsL1Step0: 65090,
    nobleStarting: 60000,
    gapPct: -7.8,
  },
  fiveYearPressure: 24.4,  // millions SY25-SY30
  fy27Scenarios: {
    optimistic: { total: 170.7, delta: 5.6, l2Premium: 4000, healthGrowth: '10%' },
    reasonable: { total: 175.2, delta: 10.1, l2Premium: 2000, healthGrowth: '15%' },
    pessimistic: { total: 179.0, delta: 13.9, l2Premium: 2000, healthGrowth: '15%' },
  },
  scenarioGap: {
    totalGap: 4.5,  // millions between optimistic and reasonable
    l2PremiumSwing: 2.4,
    healthCostSwing: 2.1,
    pctExplained: 95,
  },
};
