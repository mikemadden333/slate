/**
 * Citizen App Integration — Scanner-derived incidents 2-6h faster than CPD Data Portal.
 * No API key required — public incident feed.
 * Provides faster signals for morning awareness before CPD records appear.
 */

export interface CitizenIncident {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  timestamp: string;
  category: string;
  source: 'CITIZEN';
  confidence: 'SCANNER_DERIVED';
}

export async function fetchCitizenIncidents(
  lat: number, lng: number, radiusMiles: number = 2.0,
): Promise<CitizenIncident[]> {
  // Use Vercel serverless proxy to bypass CORS on citizen.com
  const url = `/api/citizen-proxy?lat=${lat}&lng=${lng}&radius=${radiusMiles}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data: unknown = await res.json();
    const obj = data as Record<string, unknown>;
    const raw = (obj.results ?? obj.incidents ?? data) as unknown[];
    if (!Array.isArray(raw)) return [];

    const incidents: CitizenIncident[] = [];
    for (const item of raw) {
      const i = item as Record<string, unknown>;
      const coords = i.coordinates as Record<string, number> | undefined;
      const cLat = coords?.latitude ?? (i.lat as number) ?? 0;
      const cLng = coords?.longitude ?? (i.lng as number) ?? 0;
      if (cLat === 0 && cLng === 0) continue;

      const title = String(i.title ?? i.raw ?? 'Incident reported');
      incidents.push({
        id: String(i.key ?? i.id ?? Math.random()),
        title,
        description: String(i.raw ?? i.title ?? ''),
        lat: cLat,
        lng: cLng,
        timestamp: i.ts
          ? new Date((i.ts as number) * 1000).toISOString()
          : new Date().toISOString(),
        category: classifyCitizenCategory(title),
        source: 'CITIZEN',
        confidence: 'SCANNER_DERIVED',
      });
    }
    console.log('Citizen fetch:', incidents.length, 'incidents');
    return incidents;
  } catch {
    console.log('Citizen fetch: 0 incidents (offline or blocked)');
    return [];
  }
}

function classifyCitizenCategory(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('shoot') || t.includes('shot') || t.includes('gun')) return 'SHOOTING';
  if (t.includes('homicide') || t.includes('murder') || t.includes('killed')) return 'HOMICIDE';
  if (t.includes('weapon') || t.includes('armed')) return 'WEAPONS';
  if (t.includes('robbery') || t.includes('robbed')) return 'ROBBERY';
  if (t.includes('stabbing') || t.includes('stabbed')) return 'STABBING';
  if (t.includes('assault') || t.includes('battery') || t.includes('fight')) return 'BATTERY';
  return 'OTHER';
}
