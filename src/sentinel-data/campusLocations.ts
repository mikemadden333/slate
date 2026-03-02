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

export const CAMPUS_LOCATIONS: Campus[] = [
  { id: 1,  name: 'Baker College Prep',            short: 'Baker',       addr: '2710 E. 89th St',     lat: 41.7374, lng: -87.5614, communityArea: 'Burnside',        areaNumber: 47, enroll: 500, arrH: 7, arrM: 30, dH: 15, dM: 10 },
  { id: 2,  name: 'Chicago Bulls College Prep',    short: 'Bulls',       addr: '2040 W. Adams St',    lat: 41.8780, lng: -87.6780, communityArea: 'Near West Side',  areaNumber: 28, enroll: 600, arrH: 7, arrM: 30, dH: 15, dM: 10 },
  { id: 3,  name: 'Butler College Prep',           short: 'Butler',      addr: '821 E. 103rd St',     lat: 41.7147, lng: -87.6078, communityArea: 'Roseland',        areaNumber: 49, enroll: 450, arrH: 7, arrM: 30, dH: 15, dM: 10 },
  { id: 4,  name: 'Gary Comer College Prep',       short: 'Comer',       addr: '7131 S. Chicago Ave',  lat: 41.7635, lng: -87.5974, communityArea: 'South Shore',     areaNumber: 43, enroll: 550, arrH: 7, arrM: 30, dH: 15, dM: 10 },
  { id: 5,  name: 'Gary Comer Middle School',      short: 'Comer MS',    addr: '1010 E. 72nd St',     lat: 41.7648, lng: -87.6031, communityArea: 'South Shore',     areaNumber: 43, enroll: 350, arrH: 7, arrM: 30, dH: 15, dM: 10 },
  { id: 6,  name: 'DRW College Prep',              short: 'DRW',         addr: '921 S. Homan Ave',    lat: 41.8663, lng: -87.7113, communityArea: 'North Lawndale',  areaNumber: 29, enroll: 500, arrH: 7, arrM: 30, dH: 15, dM: 10 },
  { id: 7,  name: 'Golder College Prep',           short: 'Golder',      addr: '1454 W. Superior St', lat: 41.8930, lng: -87.6636, communityArea: 'West Town',       areaNumber: 24, enroll: 500, arrH: 7, arrM: 30, dH: 15, dM: 10 },
  { id: 8,  name: 'Hansberry College Prep',        short: 'Hansberry',   addr: '8748 S. Aberdeen St', lat: 41.7398, lng: -87.6549, communityArea: 'Auburn Gresham',  areaNumber: 71, enroll: 500, arrH: 7, arrM: 30, dH: 15, dM: 10 },
  { id: 9,  name: 'Johnson College Prep',          short: 'Johnson',     addr: '6350 S. Stewart Ave', lat: 41.7786, lng: -87.6377, communityArea: 'Englewood',       areaNumber: 68, enroll: 600, arrH: 7, arrM: 30, dH: 15, dM: 10 },
  { id: 10, name: 'Mansueto High School',          short: 'Mansueto',    addr: '2911 W. 47th St',     lat: 41.8052, lng: -87.6993, communityArea: 'Brighton Park',   areaNumber: 58, enroll: 400, arrH: 7, arrM: 30, dH: 15, dM: 10 },
  { id: 11, name: 'Muchin College Prep',           short: 'Muchin',      addr: '1 N. State St',       lat: 41.8817, lng: -87.6279, communityArea: 'Loop',            areaNumber: 32, enroll: 500, arrH: 7, arrM: 30, dH: 15, dM: 10 },
  { id: 12, name: 'Noble Street College Prep',     short: 'Noble St',    addr: '1010 N. Noble St',    lat: 41.8975, lng: -87.6573, communityArea: 'West Town',       areaNumber: 24, enroll: 500, arrH: 7, arrM: 30, dH: 15, dM: 10 },
  { id: 13, name: 'Pritzker College Prep',         short: 'Pritzker',    addr: '4131 W. Cortland St', lat: 41.9119, lng: -87.7293, communityArea: 'Hermosa',         areaNumber: 20, enroll: 500, arrH: 7, arrM: 30, dH: 15, dM: 10 },
  { id: 14, name: 'Rauner College Prep',           short: 'Rauner',      addr: '1337 W. Ohio St',     lat: 41.8909, lng: -87.6607, communityArea: 'Near West Side',  areaNumber: 28, enroll: 500, arrH: 7, arrM: 30, dH: 15, dM: 10 },
  { id: 15, name: 'Rowe-Clark Math & Science',     short: 'Rowe-Clark',  addr: '3645 W. Chicago Ave', lat: 41.8941, lng: -87.7173, communityArea: 'Humboldt Park',   areaNumber: 23, enroll: 500, arrH: 7, arrM: 30, dH: 15, dM: 10 },
  { id: 16, name: 'ITW David Speer Academy',       short: 'Speer',       addr: '5321 W. Grand Ave',   lat: 41.9201, lng: -87.7628, communityArea: 'Belmont Cragin',  areaNumber: 19, enroll: 500, arrH: 7, arrM: 30, dH: 15, dM: 10 },
  { id: 17, name: 'The Noble Academy',             short: 'Noble Acad',  addr: '1443 N. Ogden Ave',   lat: 41.9054, lng: -87.6552, communityArea: 'West Town',       areaNumber: 24, enroll: 500, arrH: 7, arrM: 30, dH: 15, dM: 10 },
];
