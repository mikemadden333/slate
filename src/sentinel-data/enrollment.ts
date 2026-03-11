export const ENROLLMENT_SCENARIOS = {
  optimistic: {
    label: 'Optimistic',
    retention: 0.98,
    c1Share: 0.14,
    projections: [
      { year: 'SY26', total: 6823 },
      { year: 'SY27', total: 6910 },
      { year: 'SY28', total: 6990 },
      { year: 'SY29', total: 7060 },
      { year: 'SY30', total: 7120 },
      { year: 'SY31', total: 7175 },
    ],
  },
  probable: {
    label: 'Probable with 1,800',
    retention: 0.98,
    c1Share: 0.135,
    incoming9th: 1800,
    projections: [
      { year: 'SY26', g9: 1800, g10: 1726, g11: 1662, g12: 1635, total: 6823 },
      { year: 'SY27', g9: 1800, g10: 1726, g11: 1691, g12: 1629, total: 6846 },
      { year: 'SY28', g9: 1800, g10: 1726, g11: 1691, g12: 1657, total: 6874 },
      { year: 'SY29', g9: 1825, g10: 1726, g11: 1691, g12: 1629, total: 6871 },
      { year: 'SY30', g9: 1800, g10: 1751, g11: 1691, g12: 1629, total: 6871 },
      { year: 'SY31', g9: 1800, g10: 1726, g11: 1716, g12: 1629, total: 6871 },
    ],
  },
  pessimistic: {
    label: 'Pessimistic',
    retention: 0.97,
    c1Share: 0.13,
    projections: [
      { year: 'SY26', total: 6823 },
      { year: 'SY27', total: 6720 },
      { year: 'SY28', total: 6620 },
      { year: 'SY29', total: 6524 },
      { year: 'SY30', total: 6430 },
      { year: 'SY31', total: 6340 },
    ],
  },
};

export const ENROLLMENT_SPREAD = {
  bySY31: 835,
  revenueImpact: 5.8,  // millions in PCTC
};
