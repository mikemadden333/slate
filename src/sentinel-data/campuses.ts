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
}

export const CAMPUSES: Campus[] = [
  { id: 1,  name: 'Baker College Prep',            short: 'Baker',       addr: '7801 S. Ingleside Ave',     lat: 41.7217, lng: -87.6073, communityArea: 'Burnside',        areaNumber: 47, enroll: 500, arrH: 7, arrM: 30, dH: 15, dM: 10 },
  { id: 2,  name: 'Chicago Bulls College Prep',    short: 'Bulls',       addr: '2040 W. Adams St',          lat: 41.8731, lng: -87.6726, communityArea: 'Near West Side',  areaNumber: 28, enroll: 600, arrH: 7, arrM: 30, dH: 15, dM: 10 },
  { id: 3,  name: 'Butler College Prep',           short: 'Butler',      addr: '1231 W. 122nd St',          lat: 41.7043, lng: -87.6366, communityArea: 'Roseland',        areaNumber: 49, enroll: 450, arrH: 7, arrM: 30, dH: 15, dM: 10 },
  { id: 4,  name: 'Gary Comer College Prep',       short: 'Comer',       addr: '7131 S. South Chicago Ave', lat: 41.7652, lng: -87.5844, communityArea: 'South Shore',     areaNumber: 43, enroll: 550, arrH: 7, arrM: 30, dH: 15, dM: 10 },
  { id: 5,  name: 'Gary Comer Middle School',      short: 'Comer MS',    addr: '7131 S. South Chicago Ave', lat: 41.7648, lng: -87.5850, communityArea: 'South Shore',     areaNumber: 43, enroll: 350, arrH: 7, arrM: 30, dH: 15, dM: 10 },
  { id: 6,  name: 'DRW College Prep',              short: 'DRW',         addr: '931 S. Homan Ave',          lat: 41.8687, lng: -87.7172, communityArea: 'North Lawndale',  areaNumber: 29, enroll: 500, arrH: 7, arrM: 30, dH: 15, dM: 10 },
  { id: 7,  name: 'Golder College Prep',           short: 'Golder',      addr: '1454 W. Superior St',       lat: 41.8947, lng: -87.6676, communityArea: 'West Town',       areaNumber: 24, enroll: 500, arrH: 7, arrM: 30, dH: 15, dM: 10 },
  { id: 8,  name: 'Hansberry College Prep',        short: 'Hansberry',   addr: '8748 S. Aberdeen St',       lat: 41.7444, lng: -87.6512, communityArea: 'Auburn Gresham',  areaNumber: 71, enroll: 500, arrH: 7, arrM: 30, dH: 15, dM: 10 },
  { id: 9,  name: 'Johnson College Prep',          short: 'Johnson',     addr: '1 N. Damen Ave',            lat: 41.7794, lng: -87.6406, communityArea: 'Englewood',       areaNumber: 68, enroll: 600, arrH: 7, arrM: 30, dH: 15, dM: 10 },
  { id: 10, name: 'Mansueto High School',          short: 'Mansueto',    addr: '2911 W. 47th St',           lat: 41.8090, lng: -87.7012, communityArea: 'Brighton Park',   areaNumber: 58, enroll: 400, arrH: 7, arrM: 30, dH: 15, dM: 10 },
  { id: 11, name: 'Muchin College Prep',           short: 'Muchin',      addr: '1 N. Dearborn St',          lat: 41.8826, lng: -87.6290, communityArea: 'Loop',            areaNumber: 32, enroll: 500, arrH: 7, arrM: 30, dH: 15, dM: 10 },
  { id: 12, name: 'Noble Street College Prep',     short: 'Noble St',    addr: '1010 N. Noble St',          lat: 41.8963, lng: -87.6676, communityArea: 'West Town',       areaNumber: 24, enroll: 500, arrH: 7, arrM: 30, dH: 15, dM: 10 },
  { id: 13, name: 'Pritzker College Prep',         short: 'Pritzker',    addr: '4351 W. Wrightwood Ave',    lat: 41.9175, lng: -87.7145, communityArea: 'Hermosa',         areaNumber: 20, enroll: 500, arrH: 7, arrM: 30, dH: 15, dM: 10 },
  { id: 14, name: 'Rauner College Prep',           short: 'Rauner',      addr: '1337 W. Ohio St',           lat: 41.8847, lng: -87.6726, communityArea: 'Near West Side',  areaNumber: 28, enroll: 500, arrH: 7, arrM: 30, dH: 15, dM: 10 },
  { id: 15, name: 'Rowe-Clark Math & Science',     short: 'Rowe-Clark',  addr: '3645 W. Chicago Ave',       lat: 41.9003, lng: -87.7440, communityArea: 'Humboldt Park',   areaNumber: 23, enroll: 500, arrH: 7, arrM: 30, dH: 15, dM: 10 },
  { id: 16, name: 'ITW David Speer Academy',       short: 'Speer',       addr: '5935 W. Bloomingdale Ave',  lat: 41.9178, lng: -87.7631, communityArea: 'Belmont Cragin',  areaNumber: 19, enroll: 500, arrH: 7, arrM: 30, dH: 15, dM: 10 },
  { id: 17, name: 'The Noble Academy',             short: 'Noble Acad',  addr: '17 E. 71st St',             lat: 41.8780, lng: -87.6320, communityArea: 'West Town',       areaNumber: 24, enroll: 500, arrH: 7, arrM: 30, dH: 15, dM: 10 },
  { id: 18, name: 'UIC College Prep',              short: 'UIC',         addr: '2235 S. Millard Ave',       lat: 41.8502, lng: -87.7183, communityArea: 'South Lawndale',  areaNumber: 30, enroll: 480, arrH: 7, arrM: 30, dH: 15, dM: 10 },
];
