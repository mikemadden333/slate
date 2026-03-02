export const ENROLLMENT_SCENARIOS = {
  optimistic: {
    label: 'Optimistic',
    retention: 0.98,
    c1Share: 0.14,
    projections: [
      { year: 'SY26', total: 12192 },
      { year: 'SY27', total: 12180 },
      { year: 'SY28', total: 12175 },
      { year: 'SY29', total: 12160 },
      { year: 'SY30', total: 12150 },
      { year: 'SY31', total: 12140 },
    ],
  },
  probable: {
    label: 'Probable with 3,200',
    retention: 0.98,
    c1Share: 0.135,
    incoming9th: 3200,
    projections: [
      { year: 'SY26', g9: 3200, g10: 3147, g11: 2952, g12: 2856, total: 12155 },
      { year: 'SY27', g9: 3200, g10: 3073, g11: 3022, g12: 2835, total: 12131 },
      { year: 'SY28', g9: 3200, g10: 3073, g11: 2952, g12: 2903, total: 12128 },
      { year: 'SY29', g9: 3250, g10: 3073, g11: 2952, g12: 2835, total: 12110 },
      { year: 'SY30', g9: 3200, g10: 3121, g11: 2952, g12: 2835, total: 12108 },
      { year: 'SY31', g9: 3200, g10: 3073, g11: 2998, g12: 2835, total: 12106 },
    ],
  },
  pessimistic: {
    label: 'Pessimistic',
    retention: 0.97,
    c1Share: 0.13,
    projections: [
      { year: 'SY26', total: 12112 },
      { year: 'SY27', total: 11980 },
      { year: 'SY28', total: 11850 },
      { year: 'SY29', total: 11720 },
      { year: 'SY30', total: 11600 },
      { year: 'SY31', total: 11518 },
    ],
  },
};

export const ENROLLMENT_SPREAD = {
  bySY31: 622,
  revenueImpact: 10.3,  // millions in PCTC
};
