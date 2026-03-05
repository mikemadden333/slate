import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// DATA SOURCE: FY26_Enrollment_Projections.xlsx → EnrollmentRollUps (C1 section)
// Historicals SY18–SY25: C1 actuals (Census 1 / October count)
// Projections SY26–SY30: C1 projected (EHH eliminated by CPS effective FY26)
// Campus "enrolled" = SY25 C1 actual
// Network target = SY26 C1 projection = 12,148
// ─────────────────────────────────────────────────────────────────────────────

export interface CampusEnrollment {
  name: string;
  short: string;
  capacity: number;
  enrolled: number;     // SY25 C1 actual
  applied: number;
  accepted: number;
  yield: number;
  attrition: number;
  grade9: number;
  grade10: number;
  grade11: number;
  grade12: number;
  // C1 historical + projections
  history: number[];    // [SY18, SY19, SY20, SY21, SY22, SY23, SY24, SY25]
  forecast: number[];   // [SY26, SY27, SY28, SY29, SY30]
}

export interface HistoricalYear {
  year: string;         // 'SY18', 'SY19', etc.
  label: string;
  totalEnrolled: number;
  applications: number;
  accepted: number;
  yieldRate: number;
  attritionRate: number;
  campusCount: number;
  revenuePerPupil: number;
  isActual: boolean;
}

export interface EnrollmentForecast {
  year: string;
  label: string;
  optimistic: number;
  probable: number;
  pessimistic: number;
  revenueOptimistic: number;
  revenueProbable: number;
  revenuePessimistic: number;
}

export interface RosterData {
  sy: string;
  campuses: CampusEnrollment[];
  historical: HistoricalYear[];
  forecasts: EnrollmentForecast[];
  revenuePerPupil: number;
  targetEnrollment: number;
  lastUpdated: Date;
  updatedBy: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CAMPUS DATA — C1 actuals & projections from spreadsheet
// history = [SY18, SY19, SY20, SY21, SY22, SY23, SY24, SY25]
// forecast = [SY26, SY27, SY28, SY29, SY30]
// Note: Comer Middle (campus 11) merged into Gary Comer combined from SY25
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_CAMPUSES: CampusEnrollment[] = [
  {
    name: 'Baker College Prep', short: 'Baker', capacity: 420,
    enrolled: 283, applied: 780, accepted: 410, yield: 0.52, attrition: 0.038,
    grade9: 80, grade10: 75, grade11: 70, grade12: 58,
    history:  [363, 229, 199, 245, 254, 273, 240, 283],
    forecast: [296, 306, 315, 317, 317],
  },
  {
    name: 'Chicago Bulls College Prep', short: 'Bulls', capacity: 1280,
    enrolled: 1067, applied: 1560, accepted: 820, yield: 0.52, attrition: 0.030,
    grade9: 295, grade10: 278, grade11: 265, grade12: 229,
    history:  [1137, 1138, 1168, 1194, 1172, 1178, 1152, 1067],
    forecast: [1035, 1055, 1118, 1152, 1205],
  },
  {
    name: 'Butler College Prep', short: 'Butler', capacity: 760,
    enrolled: 691, applied: 960, accepted: 530, yield: 0.55, attrition: 0.032,
    grade9: 195, grade10: 182, grade11: 170, grade12: 144,
    history:  [647, 678, 623, 637, 628, 652, 637, 691],
    forecast: [721, 709, 719, 722, 721],
  },
  {
    name: 'Gary Comer College Prep', short: 'Comer', capacity: 1100,
    enrolled: 1005, applied: 1400, accepted: 760, yield: 0.44, attrition: 0.033,
    grade9: 224, grade10: 205, grade11: 193, grade12: 127,
    history:  [782, 881, 847, 895, 810, 764, 772, 1005],
    forecast: [1045, 1015, 959, 953, 955],
  },
  {
    name: 'DRW College Prep', short: 'DRW', capacity: 500,
    enrolled: 317, applied: 680, accepted: 390, yield: 0.46, attrition: 0.040,
    grade9: 100, grade10: 82, grade11: 78, grade12: 57,
    history:  [514, 358, 284, 299, 318, 353, 375, 317],
    forecast: [279, 248, 233, 226, 227],
  },
  {
    name: 'Golder College Prep', short: 'Golder', capacity: 720,
    enrolled: 643, applied: 1020, accepted: 580, yield: 0.45, attrition: 0.036,
    grade9: 180, grade10: 166, grade11: 157, grade12: 140,
    history:  [664, 661, 648, 663, 671, 638, 650, 643],
    forecast: [642, 637, 662, 648, 649],
  },
  {
    name: 'Hansberry College Prep', short: 'Hansberry', capacity: 620,
    enrolled: 528, applied: 860, accepted: 490, yield: 0.55, attrition: 0.042,
    grade9: 148, grade10: 137, grade11: 130, grade12: 113,
    history:  [642, 559, 493, 499, 492, 500, 518, 528],
    forecast: [556, 554, 571, 589, 598],
  },
  {
    name: 'Johnson College Prep', short: 'Johnson', capacity: 660,
    enrolled: 505, applied: 840, accepted: 480, yield: 0.50, attrition: 0.037,
    grade9: 138, grade10: 130, grade11: 120, grade12: 117,
    history:  [802, 758, 643, 523, 496, 476, 459, 505],
    forecast: [558, 566, 586, 602, 615],
  },
  {
    name: 'Mansueto High School', short: 'Mansueto', capacity: 1150,
    enrolled: 1087, applied: 1260, accepted: 740, yield: 0.58, attrition: 0.028,
    grade9: 295, grade10: 282, grade11: 274, grade12: 236,
    history:  [526, 798, 1034, 1124, 1073, 1045, 1068, 1087],
    forecast: [1093, 1081, 1076, 1079, 1083],
  },
  {
    name: 'Muchin College Prep', short: 'Muchin', capacity: 980,
    enrolled: 916, applied: 1780, accepted: 920, yield: 0.32, attrition: 0.044,
    grade9: 260, grade10: 243, grade11: 225, grade12: 188,
    history:  [959, 972, 978, 982, 963, 861, 941, 916],
    forecast: [941, 923, 943, 947, 952],
  },
  {
    name: 'Noble Street College Prep', short: 'Noble St.', capacity: 740,
    enrolled: 685, applied: 1150, accepted: 640, yield: 0.42, attrition: 0.033,
    grade9: 188, grade10: 185, grade11: 161, grade12: 151,
    history:  [651, 668, 691, 692, 675, 662, 674, 685],
    forecast: [679, 681, 669, 666, 669],
  },
  {
    name: 'Pritzker College Prep', short: 'Pritzker', capacity: 1060,
    enrolled: 989, applied: 1340, accepted: 740, yield: 0.55, attrition: 0.029,
    grade9: 280, grade10: 265, grade11: 244, grade12: 200,
    history:  [986, 979, 984, 981, 977, 969, 990, 989],
    forecast: [1003, 997, 991, 991, 996],
  },
  {
    name: 'Rauner College Prep', short: 'Rauner', capacity: 660,
    enrolled: 556, applied: 980, accepted: 560, yield: 0.43, attrition: 0.040,
    grade9: 152, grade10: 143, grade11: 135, grade12: 126,
    history:  [632, 615, 626, 662, 652, 666, 599, 556],
    forecast: [509, 465, 478, 478, 480],
  },
  {
    name: 'Rowe-Clark Math & Science', short: 'Rowe-Clark', capacity: 420,
    enrolled: 311, applied: 680, accepted: 390, yield: 0.50, attrition: 0.040,
    grade9: 88, grade10: 78, grade11: 74, grade12: 71,
    history:  [468, 407, 418, 398, 383, 397, 345, 311],
    forecast: [316, 303, 307, 297, 296],
  },
  {
    name: 'ITW David Speer Academy', short: 'Speer', capacity: 1200,
    enrolled: 1130, applied: 1380, accepted: 780, yield: 0.56, attrition: 0.032,
    grade9: 320, grade10: 298, grade11: 280, grade12: 232,
    history:  [1019, 1067, 1019, 1133, 1167, 1111, 1099, 1130],
    forecast: [1116, 1107, 1106, 1111, 1120],
  },
  {
    name: 'The Noble Academy', short: 'TNA', capacity: 520,
    enrolled: 402, applied: 940, accepted: 520, yield: 0.40, attrition: 0.048,
    grade9: 108, grade10: 103, grade11: 98, grade12: 93,
    history:  [499, 440, 485, 533, 575, 593, 521, 402],
    forecast: [399, 372, 385, 418, 426],
  },
  {
    name: 'UIC College Prep', short: 'UIC', capacity: 1020,
    enrolled: 949, applied: 1260, accepted: 720, yield: 0.46, attrition: 0.031,
    grade9: 279, grade10: 260, grade11: 226, grade12: 184,
    history:  [935, 932, 969, 1004, 920, 903, 935, 949],
    forecast: [960, 994, 1012, 1009, 1013],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// NETWORK HISTORICAL — C1 actuals (Census 1 / October count)
// SY21 spike: COVID EHH inflated funded enrollment; C1 headcount reflects
// students-in-seats, which dipped then recovered.
// Applications/yield figures are placeholders pending actual GoCPS data.
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_HISTORICAL: HistoricalYear[] = [
  { year: 'SY18', label: 'SY18', totalEnrolled: 12543, applications: 16200, accepted: 9100, yieldRate: 0.56, attritionRate: 0.035, campusCount: 18, revenuePerPupil: 14200, isActual: true  },
  { year: 'SY19', label: 'SY19', totalEnrolled: 12450, applications: 16800, accepted: 9400, yieldRate: 0.56, attritionRate: 0.036, campusCount: 18, revenuePerPupil: 14600, isActual: true  },
  { year: 'SY20', label: 'SY20', totalEnrolled: 12424, applications: 17200, accepted: 9600, yieldRate: 0.56, attritionRate: 0.038, campusCount: 18, revenuePerPupil: 15200, isActual: true  },
  { year: 'SY21', label: 'SY21', totalEnrolled: 12755, applications: 15400, accepted: 8800, yieldRate: 0.57, attritionRate: 0.052, campusCount: 18, revenuePerPupil: 15200, isActual: true  },
  { year: 'SY22', label: 'SY22', totalEnrolled: 12518, applications: 16600, accepted: 9200, yieldRate: 0.55, attritionRate: 0.041, campusCount: 18, revenuePerPupil: 15500, isActual: true  },
  { year: 'SY23', label: 'SY23', totalEnrolled: 12317, applications: 17400, accepted: 9600, yieldRate: 0.55, attritionRate: 0.038, campusCount: 18, revenuePerPupil: 15700, isActual: true  },
  { year: 'SY24', label: 'SY24', totalEnrolled: 12240, applications: 17900, accepted: 9800, yieldRate: 0.55, attritionRate: 0.036, campusCount: 18, revenuePerPupil: 16000, isActual: true  },
  { year: 'SY25', label: 'SY25', totalEnrolled: 12064, applications: 18200, accepted: 9700, yieldRate: 0.53, attritionRate: 0.035, campusCount: 17, revenuePerPupil: 16345, isActual: true  },
  { year: 'SY26', label: 'SY26', totalEnrolled: 12148, applications: 18650, accepted: 9900, yieldRate: 0.53, attritionRate: 0.035, campusCount: 17, revenuePerPupil: 16345, isActual: false },
];

// ─────────────────────────────────────────────────────────────────────────────
// FORECASTS SY27–SY30 — C1 projected (probable = spreadsheet C1 projection)
// Optimistic / pessimistic = ±3% from probable
// Revenue at $17,700/pupil (SY26 rate) held flat for conservatism
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_FORECASTS: EnrollmentForecast[] = [
  { year: 'SY27', label: 'SY27', optimistic: 12373, probable: 12013, pessimistic: 11653, revenueOptimistic: 202.2, revenueProbable: 196.4, revenuePessimistic: 190.5 },
  { year: 'SY28', label: 'SY28', optimistic: 12494, probable: 12130, pessimistic: 11766, revenueOptimistic: 204.2, revenueProbable: 198.3, revenuePessimistic: 192.3 },
  { year: 'SY29', label: 'SY29', optimistic: 12571, probable: 12205, pessimistic: 11839, revenueOptimistic: 205.5, revenueProbable: 199.5, revenuePessimistic: 193.5 },
  { year: 'SY30', label: 'SY30', optimistic: 12692, probable: 12322, pessimistic: 11952, revenueOptimistic: 207.5, revenueProbable: 201.4, revenuePessimistic: 195.4 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────
interface RosterContextType {
  data: RosterData;
  updateCampus: (name: string, patch: Partial<CampusEnrollment>) => void;
  updateHistorical: (year: string, patch: Partial<HistoricalYear>) => void;
  setUpdatedBy: (name: string) => void;
  networkTotals: {
    enrolled: number;
    capacity: number;
    applied: number;
    accepted: number;
    utilizationPct: number;
    avgYield: number;
    avgAttrition: number;
    revenueAtStake: number;
  };
}

const RosterContext = createContext<RosterContextType | null>(null);

export function useRoster() {
  const ctx = useContext(RosterContext);
  if (!ctx) throw new Error('useRoster must be used within RosterProvider');
  return ctx;
}

const STORAGE_KEY = 'roster-data-v2';

const DEFAULT_DATA: RosterData = {
  sy: 'SY26',
  campuses: DEFAULT_CAMPUSES,
  historical: DEFAULT_HISTORICAL,
  forecasts: DEFAULT_FORECASTS,
  revenuePerPupil: 16345,
  targetEnrollment: 12148,
  lastUpdated: new Date(),
  updatedBy: 'FY26 Enrollment Projections',
};

function loadFromStorage(): RosterData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DATA;
    const p = JSON.parse(raw);
    return { ...p, lastUpdated: new Date(p.lastUpdated) };
  } catch {
    return DEFAULT_DATA;
  }
}

export function RosterProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<RosterData>(loadFromStorage);

  const save = (d: RosterData) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {}
  };

  const updateCampus = useCallback((name: string, patch: Partial<CampusEnrollment>) => {
    setData(d => {
      const next = {
        ...d,
        campuses: d.campuses.map(c => c.name === name ? { ...c, ...patch } : c),
        lastUpdated: new Date(),
      };
      save(next); return next;
    });
  }, []);

  const updateHistorical = useCallback((year: string, patch: Partial<HistoricalYear>) => {
    setData(d => {
      const next = {
        ...d,
        historical: d.historical.map(h => h.year === year ? { ...h, ...patch } : h),
        lastUpdated: new Date(),
      };
      save(next); return next;
    });
  }, []);

  const setUpdatedBy = useCallback((name: string) => {
    setData(d => ({ ...d, updatedBy: name }));
  }, []);

  const networkTotals = {
    enrolled:       data.campuses.reduce((s, c) => s + c.enrolled, 0),
    capacity:       data.campuses.reduce((s, c) => s + c.capacity, 0),
    applied:        data.campuses.reduce((s, c) => s + c.applied, 0),
    accepted:       data.campuses.reduce((s, c) => s + c.accepted, 0),
    utilizationPct: data.campuses.reduce((s, c) => s + c.enrolled, 0) /
                    data.campuses.reduce((s, c) => s + c.capacity, 0) * 100,
    avgYield:       data.campuses.reduce((s, c) => s + c.yield, 0) / data.campuses.length,
    avgAttrition:   data.campuses.reduce((s, c) => s + c.attrition, 0) / data.campuses.length,
    revenueAtStake: (data.targetEnrollment - data.campuses.reduce((s, c) => s + c.enrolled, 0)) *
                    data.revenuePerPupil / 1_000_000,
  };

  return (
    <RosterContext.Provider value={{ data, updateCampus, updateHistorical, setUpdatedBy, networkTotals }}>
      {children}
    </RosterContext.Provider>
  );
}
