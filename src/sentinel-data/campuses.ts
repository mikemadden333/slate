export interface Campus {
  id: number;
  name: string;
  short: string;
  addr: string;
  lat: number;
  lng: number;
  communityArea: string;
  areaNumber: number;
  enroll: number;
  arrH: number;
  arrM: number;
  dH: number;
  dM: number;
  // Financial & enrollment metrics
  perPupil: number;
  deltaFromAvg: number;
  retention: number;
  applications: number;
  conversionRate: number;
  ehh: number;        // Enrollment headcount
  mlFund: number;     // ML fund allocation (thousands)
}

export const CAMPUSES: Campus[] = [
  { id: 1,  name: "Baker College Prep",            short: "Baker",       addr: "7801 S. Ingleside Ave",     lat: 41.7217, lng: -87.6073, communityArea: "Burnside",        areaNumber: 47, enroll: 500, arrH: 7, arrM: 30, dH: 15, dM: 10, perPupil: 10120, deltaFromAvg: -170,  retention: 0.91, applications: 980,  conversionRate: 0.51, ehh: 487,  mlFund: 62 },
  { id: 2,  name: "Chicago Bulls College Prep",    short: "Bulls",       addr: "2040 W. Adams St",          lat: 41.8731, lng: -87.6726, communityArea: "Near West Side",  areaNumber: 28, enroll: 600, arrH: 7, arrM: 30, dH: 15, dM: 10, perPupil: 10450, deltaFromAvg: 160,   retention: 0.93, applications: 1340, conversionRate: 0.45, ehh: 612,  mlFund: 78 },
  { id: 3,  name: "Butler College Prep",           short: "Butler",      addr: "1231 W. 122nd St",          lat: 41.7043, lng: -87.6366, communityArea: "Roseland",        areaNumber: 49, enroll: 450, arrH: 7, arrM: 30, dH: 15, dM: 10, perPupil: 9650,  deltaFromAvg: -640,  retention: 0.88, applications: 820,  conversionRate: 0.55, ehh: 441,  mlFund: 55 },
  { id: 4,  name: "Gary Comer College Prep",       short: "Comer",       addr: "7131 S. South Chicago Ave", lat: 41.7652, lng: -87.5844, communityArea: "South Shore",     areaNumber: 43, enroll: 550, arrH: 7, arrM: 30, dH: 15, dM: 10, perPupil: 11894, deltaFromAvg: 1604,  retention: 0.95, applications: 1560, conversionRate: 0.35, ehh: 563,  mlFund: 72 },
  { id: 6,  name: "DRW College Prep",              short: "DRW",         addr: "931 S. Homan Ave",          lat: 41.8687, lng: -87.7172, communityArea: "North Lawndale",  areaNumber: 29, enroll: 500, arrH: 7, arrM: 30, dH: 15, dM: 10, perPupil: 10280, deltaFromAvg: -10,   retention: 0.92, applications: 1050, conversionRate: 0.48, ehh: 498,  mlFund: 65 },
  { id: 7,  name: "Golder College Prep",           short: "Golder",      addr: "1454 W. Superior St",       lat: 41.8947, lng: -87.6676, communityArea: "West Town",       areaNumber: 24, enroll: 500, arrH: 7, arrM: 30, dH: 15, dM: 10, perPupil: 10190, deltaFromAvg: -100,  retention: 0.90, applications: 1120, conversionRate: 0.45, ehh: 494,  mlFund: 60 },
  { id: 8,  name: "Hansberry College Prep",        short: "Hansberry",   addr: "8748 S. Aberdeen St",       lat: 41.7444, lng: -87.6512, communityArea: "Auburn Gresham",  areaNumber: 71, enroll: 500, arrH: 7, arrM: 30, dH: 15, dM: 10, perPupil: 10050, deltaFromAvg: -240,  retention: 0.89, applications: 890,  conversionRate: 0.56, ehh: 492,  mlFund: 58 },
  { id: 9,  name: "Johnson College Prep",          short: "Johnson",     addr: "1 N. Damen Ave",            lat: 41.7794, lng: -87.6406, communityArea: "Englewood",       areaNumber: 68, enroll: 600, arrH: 7, arrM: 30, dH: 15, dM: 10, perPupil: 10380, deltaFromAvg: 90,    retention: 0.92, applications: 1240, conversionRate: 0.48, ehh: 608,  mlFund: 75 },
  { id: 10, name: "Mansueto High School",          short: "Mansueto",    addr: "2911 W. 47th St",           lat: 41.8090, lng: -87.7012, communityArea: "Brighton Park",   areaNumber: 58, enroll: 400, arrH: 7, arrM: 30, dH: 15, dM: 10, perPupil: 10220, deltaFromAvg: -70,   retention: 0.91, applications: 780,  conversionRate: 0.51, ehh: 392,  mlFund: 48 },
  { id: 11, name: "Muchin College Prep",           short: "Muchin",      addr: "1 N. Dearborn St",          lat: 41.8826, lng: -87.6290, communityArea: "Loop",            areaNumber: 32, enroll: 500, arrH: 7, arrM: 30, dH: 15, dM: 10, perPupil: 10890, deltaFromAvg: 600,   retention: 0.94, applications: 1680, conversionRate: 0.30, ehh: 511,  mlFund: 68 },
  { id: 12, name: "Noble Street College Prep",     short: "Noble St",    addr: "1010 N. Noble St",          lat: 41.8963, lng: -87.6676, communityArea: "West Town",       areaNumber: 24, enroll: 500, arrH: 7, arrM: 30, dH: 15, dM: 10, perPupil: 10340, deltaFromAvg: 50,    retention: 0.93, applications: 1290, conversionRate: 0.39, ehh: 505,  mlFund: 64 },
  { id: 13, name: "Pritzker College Prep",         short: "Pritzker",    addr: "4351 W. Wrightwood Ave",    lat: 41.9175, lng: -87.7145, communityArea: "Hermosa",         areaNumber: 20, enroll: 500, arrH: 7, arrM: 30, dH: 15, dM: 10, perPupil: 10180, deltaFromAvg: -110,  retention: 0.91, applications: 1010, conversionRate: 0.50, ehh: 496,  mlFund: 61 },
  { id: 14, name: "Rauner College Prep",           short: "Rauner",      addr: "1337 W. Ohio St",           lat: 41.8847, lng: -87.6726, communityArea: "Near West Side",  areaNumber: 28, enroll: 500, arrH: 7, arrM: 30, dH: 15, dM: 10, perPupil: 10410, deltaFromAvg: 120,   retention: 0.92, applications: 1150, conversionRate: 0.43, ehh: 503,  mlFund: 63 },
  { id: 15, name: "Rowe-Clark Math & Science",     short: "Rowe-Clark",  addr: "3645 W. Chicago Ave",       lat: 41.9003, lng: -87.7440, communityArea: "Humboldt Park",   areaNumber: 23, enroll: 500, arrH: 7, arrM: 30, dH: 15, dM: 10, perPupil: 10060, deltaFromAvg: -230,  retention: 0.90, applications: 940,  conversionRate: 0.53, ehh: 493,  mlFund: 57 },
  { id: 16, name: "ITW David Speer Academy",       short: "Speer",       addr: "5935 W. Bloomingdale Ave",  lat: 41.9178, lng: -87.7631, communityArea: "Belmont Cragin",  areaNumber: 19, enroll: 500, arrH: 7, arrM: 30, dH: 15, dM: 10, perPupil: 10150, deltaFromAvg: -140,  retention: 0.90, applications: 870,  conversionRate: 0.57, ehh: 489,  mlFund: 56 },
  { id: 17, name: "The Noble Academy",             short: "Noble Acad",  addr: "1443 N. Ogden Ave",         lat: 41.9067, lng: -87.6598, communityArea: "Near North Side", areaNumber: 8,  enroll: 500, arrH: 7, arrM: 30, dH: 15, dM: 10, perPupil: 10480, deltaFromAvg: 190,   retention: 0.93, applications: 1380, conversionRate: 0.36, ehh: 508,  mlFund: 67 },
  { id: 18, name: "UIC College Prep",              short: "UIC",         addr: "2235 S. Millard Ave",       lat: 41.8502, lng: -87.7183, communityArea: "South Lawndale",  areaNumber: 30, enroll: 480, arrH: 7, arrM: 30, dH: 15, dM: 10, perPupil: 10320, deltaFromAvg: 30,    retention: 0.91, applications: 1080, conversionRate: 0.44, ehh: 487,  mlFund: 62 },
];

export const CAMPUS_STATS = {
  networkAvgPerPupil: 10290,
  totalEHH: 12125.5,
  totalPreTilt: 124.9,
  perPupilSpread: 2244,
  highestPerPupil: { name: "Gary Comer", value: 11894 },
  lowestPerPupil: { name: "Butler", value: 9650 },
  mlFundTotal: 1.1,
};
