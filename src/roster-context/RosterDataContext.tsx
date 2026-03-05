import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface CampusEnrollment {
  name: string;
  short: string;
  capacity: number;
  // Current year actuals
  enrolled: number;
  applied: number;
  accepted: number;
  yield: number;
  attrition: number;
  // Grade cohorts
  grade9: number;
  grade10: number;
  grade11: number;
  grade12: number;
}

export interface HistoricalYear {
  year: string;         // 'SY20', 'SY21', etc.
  totalEnrolled: number;
  applications: number;
  accepted: number;
  yieldRate: number;
  attritionRate: number;
  campusCount: number;
  revenuePerPupil: number;
}

export interface EnrollmentForecast {
  year: string;
  optimistic: number;
  probable: number;
  pessimistic: number;
  revenueOptimistic: number;
  revenueProbable: number;
  revenuePessimistic: number;
}

export interface RosterData {
  sy: string;                       // Current school year e.g. 'SY26'
  campuses: CampusEnrollment[];
  historical: HistoricalYear[];
  forecasts: EnrollmentForecast[];
  revenuePerPupil: number;          // Current PCTC rate
  targetEnrollment: number;         // Board-approved enrollment target
  lastUpdated: Date;
  updatedBy: string;
}

// ── Default seed data ────────────────────────────────────────
const DEFAULT_CAMPUSES: CampusEnrollment[] = [
  { name: 'Baker College Prep',         short: 'Baker',    capacity: 520, enrolled: 500, applied: 980,  accepted: 530, yield: 0.51, attrition: 0.034, grade9: 145, grade10: 132, grade11: 120, grade12: 103 },
  { name: 'Chicago Bulls College Prep', short: 'Bulls',    capacity: 650, enrolled: 600, applied: 1340, accepted: 720, yield: 0.45, attrition: 0.028, grade9: 175, grade10: 158, grade11: 145, grade12: 122 },
  { name: 'Butler College Prep',        short: 'Butler',   capacity: 480, enrolled: 450, applied: 820,  accepted: 460, yield: 0.55, attrition: 0.039, grade9: 132, grade10: 118, grade11: 106, grade12: 94 },
  { name: 'Gary Comer College Prep',    short: 'Comer',    capacity: 580, enrolled: 550, applied: 1560, accepted: 780, yield: 0.35, attrition: 0.031, grade9: 160, grade10: 146, grade11: 135, grade12: 109 },
  { name: 'DRW College Prep',           short: 'DRW',      capacity: 520, enrolled: 500, applied: 1050, accepted: 560, yield: 0.48, attrition: 0.029, grade9: 147, grade10: 133, grade11: 122, grade12: 98 },
  { name: 'Golder College Prep',        short: 'Golder',   capacity: 520, enrolled: 500, applied: 1120, accepted: 600, yield: 0.45, attrition: 0.036, grade9: 147, grade10: 131, grade11: 121, grade12: 101 },
  { name: 'Hansberry College Prep',     short: 'Hansberry',capacity: 520, enrolled: 500, applied: 890,  accepted: 500, yield: 0.56, attrition: 0.042, grade9: 146, grade10: 130, grade11: 118, grade12: 106 },
  { name: 'Johnson College Prep',       short: 'Johnson',  capacity: 650, enrolled: 600, applied: 1240, accepted: 670, yield: 0.48, attrition: 0.033, grade9: 175, grade10: 160, grade11: 146, grade12: 119 },
  { name: 'Mansueto High School',       short: 'Mansueto', capacity: 420, enrolled: 400, applied: 780,  accepted: 430, yield: 0.51, attrition: 0.035, grade9: 118, grade10: 105, grade11: 95,  grade12: 82 },
  { name: 'Muchin College Prep',        short: 'Muchin',   capacity: 520, enrolled: 500, applied: 1680, accepted: 840, yield: 0.30, attrition: 0.045, grade9: 146, grade10: 130, grade11: 118, grade12: 106 },
  { name: 'Noble Street College Prep',  short: 'Noble St', capacity: 520, enrolled: 500, applied: 1290, accepted: 660, yield: 0.39, attrition: 0.034, grade9: 147, grade10: 132, grade11: 121, grade12: 100 },
  { name: 'Pritzker College Prep',      short: 'Pritzker', capacity: 520, enrolled: 500, applied: 1010, accepted: 555, yield: 0.50, attrition: 0.032, grade9: 147, grade10: 132, grade11: 121, grade12: 100 },
  { name: 'Rauner College Prep',        short: 'Rauner',   capacity: 520, enrolled: 500, applied: 1150, accepted: 620, yield: 0.43, attrition: 0.038, grade9: 147, grade10: 131, grade11: 120, grade12: 102 },
  { name: 'Rowe-Clark Math & Science',  short: 'Rowe',     capacity: 520, enrolled: 500, applied: 940,  accepted: 530, yield: 0.53, attrition: 0.040, grade9: 147, grade10: 130, grade11: 119, grade12: 104 },
  { name: 'ITW David Speer Academy',    short: 'Speer',    capacity: 520, enrolled: 500, applied: 870,  accepted: 500, yield: 0.57, attrition: 0.036, grade9: 147, grade10: 131, grade11: 120, grade12: 102 },
  { name: 'The Noble Academy',          short: 'TNA',      capacity: 520, enrolled: 500, applied: 1380, accepted: 700, yield: 0.36, attrition: 0.045, grade9: 146, grade10: 130, grade11: 118, grade12: 106 },
  { name: 'UIC College Prep',           short: 'UIC',      capacity: 500, enrolled: 480, applied: 1080, accepted: 580, yield: 0.44, attrition: 0.029, grade9: 141, grade10: 127, grade11: 116, grade12: 96 },
];

const DEFAULT_HISTORICAL: HistoricalYear[] = [
  { year: 'SY20', totalEnrolled: 10200, applications: 12400, accepted: 6800, yieldRate: 0.68, attritionRate: 0.038, campusCount: 17, revenuePerPupil: 14200 },
  { year: 'SY21', totalEnrolled: 9800,  applications: 11200, accepted: 6400, yieldRate: 0.65, attritionRate: 0.052, campusCount: 17, revenuePerPupil: 14600 },
  { year: 'SY22', totalEnrolled: 10400, applications: 13100, accepted: 7100, yieldRate: 0.67, attritionRate: 0.041, campusCount: 17, revenuePerPupil: 15100 },
  { year: 'SY23', totalEnrolled: 11200, applications: 14800, accepted: 7800, yieldRate: 0.69, attritionRate: 0.036, campusCount: 17, revenuePerPupil: 15800 },
  { year: 'SY24', totalEnrolled: 11800, applications: 16200, accepted: 8400, yieldRate: 0.70, attritionRate: 0.033, campusCount: 17, revenuePerPupil: 16400 },
  { year: 'SY25', totalEnrolled: 12100, applications: 17800, accepted: 9100, yieldRate: 0.71, attritionRate: 0.031, campusCount: 17, revenuePerPupil: 16900 },
  { year: 'SY26', totalEnrolled: 12080, applications: 18650, accepted: 9600, yieldRate: 0.48, attritionRate: 0.035, campusCount: 17, revenuePerPupil: 17400 },
];

const DEFAULT_FORECASTS: EnrollmentForecast[] = [
  { year: 'SY27', optimistic: 12400, probable: 12100, pessimistic: 11700, revenueOptimistic: 221.6, revenueProbable: 216.2, revenuePessimistic: 209.1 },
  { year: 'SY28', optimistic: 12700, probable: 12200, pessimistic: 11500, revenueOptimistic: 230.1, revenueProbable: 221.0, revenuePessimistic: 208.4 },
  { year: 'SY29', optimistic: 13000, probable: 12400, pessimistic: 11400, revenueOptimistic: 239.2, revenueProbable: 228.2, revenuePessimistic: 209.8 },
  { year: 'SY30', optimistic: 13200, probable: 12500, pessimistic: 11200, revenueOptimistic: 247.1, revenueProbable: 233.9, revenuePessimistic: 209.6 },
];

// ── Context ──────────────────────────────────────────────────
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

const STORAGE_KEY = 'roster-data-v1';

function loadFromStorage(): RosterData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {
      sy: 'SY26', campuses: DEFAULT_CAMPUSES, historical: DEFAULT_HISTORICAL,
      forecasts: DEFAULT_FORECASTS, revenuePerPupil: 17400,
      targetEnrollment: 12148, lastUpdated: new Date(), updatedBy: 'System Default',
    };
    const p = JSON.parse(raw);
    return { ...p, lastUpdated: new Date(p.lastUpdated) };
  } catch {
    return {
      sy: 'SY26', campuses: DEFAULT_CAMPUSES, historical: DEFAULT_HISTORICAL,
      forecasts: DEFAULT_FORECASTS, revenuePerPupil: 17400,
      targetEnrollment: 12148, lastUpdated: new Date(), updatedBy: 'System Default',
    };
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
    enrolled: data.campuses.reduce((s, c) => s + c.enrolled, 0),
    capacity: data.campuses.reduce((s, c) => s + c.capacity, 0),
    applied: data.campuses.reduce((s, c) => s + c.applied, 0),
    accepted: data.campuses.reduce((s, c) => s + c.accepted, 0),
    utilizationPct: data.campuses.reduce((s, c) => s + c.enrolled, 0) /
                    data.campuses.reduce((s, c) => s + c.capacity, 0) * 100,
    avgYield: data.campuses.reduce((s, c) => s + c.yield, 0) / data.campuses.length,
    avgAttrition: data.campuses.reduce((s, c) => s + c.attrition, 0) / data.campuses.length,
    revenueAtStake: (data.targetEnrollment - data.campuses.reduce((s, c) => s + c.enrolled, 0)) * data.revenuePerPupil / 1_000_000,
  };

  return (
    <RosterContext.Provider value={{ data, updateCampus, updateHistorical, setUpdatedBy, networkTotals }}>
      {children}
    </RosterContext.Provider>
  );
}
