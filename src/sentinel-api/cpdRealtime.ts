/**
 * CPD Realtime — Alternative Chicago data endpoints with less lag than
 * the primary Crimes dataset (ijzp-q8t2) which has 5-10 day publication delay.
 *
 * Tries multiple endpoints in order and returns the first one with fresh data.
 */

import type { Incident } from '../sentinel-engine/types';

const NOBLE_BOUNDS = {
  latMin: 41.65,
  latMax: 41.97,
  lngMin: -87.82,
  lngMax: -87.57,
};

const REALTIME_ENDPOINTS = [
  {
    name: 'CPD Calls for Service',
    url: 'https://data.cityofchicago.org/resource/x2n5-8w5q.json',
    dateField: 'date',
    typeField: 'description',
  },
];

function classifyType(description: string): string {
  const d = description.toLowerCase();
  if (d.includes('homicide') || d.includes('murder')) return 'HOMICIDE';
  if (d.includes('shoot') || d.includes('shot') || d.includes('gun')) return 'SHOOTING';
  if (d.includes('weapon') || d.includes('armed')) return 'WEAPONS VIOLATION';
  if (d.includes('battery') || d.includes('assault')) return 'BATTERY';
  if (d.includes('robbery')) return 'ROBBERY';
  if (d.includes('narcotic') || d.includes('drug')) return 'NARCOTICS';
  return 'OTHER';
}

export async function fetchRealtimeIncidents(): Promise<Incident[]> {
  for (const endpoint of REALTIME_ENDPOINTS) {
    try {
      const since = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 19);
      const where = `${endpoint.dateField} > '${since}'`
        + ` AND latitude > ${NOBLE_BOUNDS.latMin}`
        + ` AND latitude < ${NOBLE_BOUNDS.latMax}`
        + ` AND longitude > ${NOBLE_BOUNDS.lngMin}`
        + ` AND longitude < ${NOBLE_BOUNDS.lngMax}`
        + ` AND latitude IS NOT NULL`;

      const url = `${endpoint.url}?$limit=500&$order=${endpoint.dateField} DESC&$where=${encodeURIComponent(where)}`;

      const res = await fetch(url);
      if (!res.ok) {
        console.log(`${endpoint.name}: HTTP ${res.status}, skipping`);
        continue;
      }

      const data = await res.json() as Record<string, string>[];
      if (!data.length) {
        console.log(`${endpoint.name}: 0 records, skipping`);
        continue;
      }

      const mostRecent = new Date(data[0][endpoint.dateField]);
      const hoursOld = (Date.now() - mostRecent.getTime()) / 3600000;

      console.log(`${endpoint.name}: ${data.length} records, most recent ${Math.round(hoursOld)}h old`);

      if (hoursOld > 48) {
        console.log(`${endpoint.name}: too stale (${Math.round(hoursOld)}h), skipping`);
        continue;
      }

      return data
        .filter(r => r.latitude && r.longitude)
        .map(r => {
          const lat = parseFloat(r.latitude);
          const lng = parseFloat(r.longitude);
          return { lat, lng, r };
        })
        .filter(({ lat, lng }) =>
          lat >= NOBLE_BOUNDS.latMin && lat <= NOBLE_BOUNDS.latMax &&
          lng >= NOBLE_BOUNDS.lngMin && lng <= NOBLE_BOUNDS.lngMax &&
          !isNaN(lat) && !isNaN(lng),
        )
        .map(({ lat, lng, r }) => ({
          id: r.rd_no || r.event_number || String(Math.random()),
          type: classifyType(r[endpoint.typeField] || ''),
          date: r[endpoint.dateField],
          block: r.block || r.street_address || 'Unknown',
          lat,
          lng,
          description: r[endpoint.typeField] || '',
          source: 'CPD_REALTIME' as const,
          confidence: 'VERIFIED' as const,
        }));

    } catch (err) {
      console.log(`${endpoint.name}: failed —`, err);
      continue;
    }
  }

  console.log('All CPD realtime endpoints too stale or failed');
  return [];
}
