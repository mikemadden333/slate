import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// DATA SOURCE: FY26_Enrollment_Projections — Veritas Charter Schools
// ─────────────────────────────────────────────────────────────────────────────

export interface CampusEnrollment {
  name: string;
  short: string;
  capacity: number;
  enrolled: number;
  applied: number;
  accepted: number;
  yield: number;
  attrition: number;
  grade9: number;
  grade10: number;
  grade11: number;
  grade12: number;
  history: number[];    // [SY18–SY25]
  forecast: number[];   // [SY26–SY30]
}

export interface HistoricalYear {
  year: string;
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
// CAMPUS DATA
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_CAMPUSES: CampusEnrollment[] = [
  {
    name: 'Veritas Loop Academy', short: 'Loop', capacity: 1050,
    enrolled: 965, applied: 2100, accepted: 987, yield: 0.47, attrition: 0.033,
    grade9: 270, grade10: 258, grade11: 247, grade12: 190,
    history:  [820, 854, 891, 930, 942, 952, 958, 965],
    forecast: [987, 1005, 1018, 1025, 1030],
  },
  {
    name: 'Veritas Englewood Academy', short: 'Englewood', capacity: 800,
    enrolled: 718, applied: 1240, accepted: 744, yield: 0.60, attrition: 0.038,
    grade9: 203, grade10: 194, grade11: 185, grade12: 136,
    history:  [580, 605, 623, 648, 670, 688, 703, 718],
    forecast: [742, 758, 771, 778, 782],
  },
  {
    name: 'Veritas Woodlawn Academy', short: 'Woodlawn', capacity: 900,
    enrolled: 798, applied: 1380, accepted: 828, yield: 0.60, attrition: 0.035,
    grade9: 225, grade10: 215, grade11: 206, grade12: 152,
    history:  [650, 678, 702, 724, 740, 758, 774, 798],
    forecast: [823, 841, 855, 862, 868],
  },
  {
    name: 'Veritas Auburn Gresham Academy', short: 'Auburn Gresham', capacity: 750,
    enrolled: 655, applied: 980, accepted: 676, yield: 0.69, attrition: 0.040,
    grade9: 185, grade10: 177, grade11: 169, grade12: 124,
    history:  [490, 524, 558, 586, 608, 625, 640, 655],
    forecast: [678, 692, 703, 708, 710],
  },
  {
    name: 'Veritas Roseland Academy', short: 'Roseland', capacity: 600,
    enrolled: 503, applied: 740, accepted: 518, yield: 0.70, attrition: 0.042,
    grade9: 142, grade10: 136, grade11: 130, grade12: 95,
    history:  [380, 406, 428, 448, 464, 478, 490, 503],
    forecast: [521, 533, 542, 547, 550],
  },
  {
    name: 'Veritas Chatham Academy', short: 'Chatham', capacity: 950,
    enrolled: 864, applied: 1620, accepted: 891, yield: 0.55, attrition: 0.032,
    grade9: 244, grade10: 233, grade11: 222, grade12: 165,
    history:  [720, 752, 779, 802, 820, 836, 849, 864],
    forecast: [891, 910, 924, 932, 938],
  },
  {
    name: 'Veritas Austin Academy', short: 'Austin', capacity: 780,
    enrolled: 688, applied: 1150, accepted: 714, yield: 0.62, attrition: 0.037,
    grade9: 194, grade10: 185, grade11: 177, grade12: 132,
    history:  [540, 572, 598, 622, 642, 658, 673, 688],
    forecast: [711, 727, 739, 745, 749],
  },
  {
    name: 'Veritas North Lawndale Academy', short: 'North Lawndale', capacity: 400,
    enrolled: 312, applied: 420, accepted: 329, yield: 0.78, attrition: 0.045,
    grade9: 90, grade10: 86, grade11: 82, grade12: 54,
    history:  [185, 208, 228, 248, 264, 278, 295, 312],
    forecast: [329, 342, 352, 358, 362],
  },
  {
    name: 'Veritas Garfield Park Academy', short: 'Garfield Park', capacity: 720,
    enrolled: 631, applied: 980, accepted: 657, yield: 0.67, attrition: 0.036,
    grade9: 178, grade10: 170, grade11: 163, grade12: 120,
    history:  [488, 518, 544, 566, 584, 600, 615, 631],
    forecast: [652, 667, 678, 684, 688],
  },
  {
    name: 'Veritas Humboldt Park Academy', short: 'Humboldt Park', capacity: 560,
    enrolled: 473, applied: 720, accepted: 497, yield: 0.68, attrition: 0.039,
    grade9: 134, grade10: 128, grade11: 122, grade12: 89,
    history:  [340, 364, 384, 402, 416, 428, 450, 473],
    forecast: [489, 501, 511, 516, 520],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// NETWORK HISTORICAL
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_HISTORICAL: HistoricalYear[] = [
  { year: 'SY18', label: 'SY18', totalEnrolled: 6993, applications: 9100,  accepted: 5100, yieldRate: 0.56, attritionRate: 0.035, campusCount: 10, revenuePerPupil: 14200, isActual: true  },
  { year: 'SY19', label: 'SY19', totalEnrolled: 7085, applications: 9400,  accepted: 5300, yieldRate: 0.56, attritionRate: 0.036, campusCount: 10, revenuePerPupil: 14600, isActual: true  },
  { year: 'SY20', label: 'SY20', totalEnrolled: 7135, applications: 9600,  accepted: 5400, yieldRate: 0.56, attritionRate: 0.038, campusCount: 10, revenuePerPupil: 15200, isActual: true  },
  { year: 'SY21', label: 'SY21', totalEnrolled: 6976, applications: 8600,  accepted: 4900, yieldRate: 0.57, attritionRate: 0.052, campusCount: 10, revenuePerPupil: 15200, isActual: true  },
  { year: 'SY22', label: 'SY22', totalEnrolled: 7150, applications: 9300,  accepted: 5150, yieldRate: 0.55, attritionRate: 0.041, campusCount: 10, revenuePerPupil: 15500, isActual: true  },
  { year: 'SY23', label: 'SY23', totalEnrolled: 7301, applications: 9750,  accepted: 5400, yieldRate: 0.55, attritionRate: 0.038, campusCount: 10, revenuePerPupil: 15700, isActual: true  },
  { year: 'SY24', label: 'SY24', totalEnrolled: 6447, applications: 10050, accepted: 5500, yieldRate: 0.55, attritionRate: 0.036, campusCount: 10, revenuePerPupil: 16000, isActual: true  },
  { year: 'SY25', label: 'SY25', totalEnrolled: 6607, applications: 10200, accepted: 5440, yieldRate: 0.53, attritionRate: 0.035, campusCount: 10, revenuePerPupil: 16345, isActual: true  },
  { year: 'SY26', label: 'SY26', totalEnrolled: 6823, applications: 10460, accepted: 5550, yieldRate: 0.53, attritionRate: 0.035, campusCount: 10, revenuePerPupil: 16345, isActual: false },
];

// ─────────────────────────────────────────────────────────────────────────────
// FORECASTS SY27–SY30
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_FORECASTS: EnrollmentForecast[] = [
  { year: 'SY27', label: 'SY27', optimistic: 6910, probable: 6846, pessimistic: 6720, revenueOptimistic: 113.0, revenueProbable: 111.9, revenuePessimistic: 109.8 },
  { year: 'SY28', label: 'SY28', optimistic: 6990, probable: 6874, pessimistic: 6620, revenueOptimistic: 114.3, revenueProbable: 112.4, revenuePessimistic: 108.2 },
  { year: 'SY29', label: 'SY29', optimistic: 7060, probable: 6871, pessimistic: 6524, revenueOptimistic: 115.4, revenueProbable: 112.3, revenuePessimistic: 106.6 },
  { year: 'SY30', label: 'SY30', optimistic: 7120, probable: 6871, pessimistic: 6430, revenueOptimistic: 116.4, revenueProbable: 112.3, revenuePessimistic: 105.1 },
];

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN BRIDGE
// Merges data saved by AdminApp (slate_enrollment key) into roster data.
// Campus enrollment figures and scenario projections flow through from Admin.
// ─────────────────────────────────────────────────────────────────────────────
function mergeAdminData(base: RosterData): RosterData {
  try {
    const raw = localStorage.getItem('slate_enrollment');
    if (!raw) return base;
    const admin = JSON.parse(raw);

    // Build a lookup from short campus name → new enrollment value
    const enrollmentMap: Record<string, number> = {};
    if (Array.isArray(admin.campuses)) {
      admin.campuses.forEach((c: { name: string; enrollment: number }) => {
        enrollmentMap[c.name] = c.enrollment;
      });
    }

    // Update campus enrolled figures
    const updatedCampuses = base.campuses.map(c => {
      const newEnrolled = enrollmentMap[c.short] ?? enrollmentMap[c.name] ?? null;
      if (newEnrolled === null) return c;
      // Recalculate grade split proportionally
      const ratio = newEnrolled / c.enrolled;
      return {
        ...c,
        enrolled: newEnrolled,
        grade9:  Math.round(c.grade9  * ratio),
        grade10: Math.round(c.grade10 * ratio),
        grade11: Math.round(c.grade11 * ratio),
        grade12: Math.round(c.grade12 * ratio),
      };
    });

    // Update forecasts from Admin scenarios if present
    let updatedForecasts = base.forecasts;
    if (admin.scenarios) {
      const { optimistic, probable, pessimistic } = admin.scenarios;
      const rpp = admin.revenuePerPupil ?? base.revenuePerPupil;
      const years = ['SY27','SY28','SY29','SY30'];
      const adminYears = ['sy27','sy28','sy29','sy30'];
      updatedForecasts = base.forecasts.map((f, i) => {
        if (!years.includes(f.year)) return f;
        const key = adminYears[i];
        return {
          ...f,
          optimistic:         optimistic?.[key]  ?? f.optimistic,
          probable:           probable?.[key]    ?? f.probable,
          pessimistic:        pessimistic?.[key] ?? f.pessimistic,
          revenueOptimistic:  Math.round((optimistic?.[key]  ?? f.optimistic)  * rpp) / 1_000_000,
          revenueProbable:    Math.round((probable?.[key]    ?? f.probable)    * rpp) / 1_000_000,
          revenuePessimistic: Math.round((pessimistic?.[key] ?? f.pessimistic) * rpp) / 1_000_000,
        };
      });
    }

    return {
      ...base,
      campuses:        updatedCampuses,
      forecasts:       updatedForecasts,
      targetEnrollment: admin.targetEnrollment ?? base.targetEnrollment,
      revenuePerPupil:  admin.revenuePerPupil  ?? base.revenuePerPupil,
    };
  } catch {
    return base;
  }
}

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

const STORAGE_KEY = 'veritas-roster-v1';

const DEFAULT_DATA: RosterData = {
  sy: 'SY26',
  campuses: DEFAULT_CAMPUSES,
  historical: DEFAULT_HISTORICAL,
  forecasts: DEFAULT_FORECASTS,
  revenuePerPupil: 16345,
  targetEnrollment: 6823,
  lastUpdated: new Date(),
  updatedBy: 'FY26 Enrollment Projections',
};

function loadFromStorage(): RosterData {
  try {
    // 1. Try own saved state (edits made within Scholar itself)
    const raw = localStorage.getItem(STORAGE_KEY);
    const base: RosterData = raw
      ? { ...JSON.parse(raw), lastUpdated: new Date(JSON.parse(raw).lastUpdated) }
      : DEFAULT_DATA;

    // 2. Merge Admin panel data on top — Admin values win for enrollment & forecasts
    return mergeAdminData(base);
  } catch {
    return mergeAdminData(DEFAULT_DATA);
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
