/**
 * AI-powered geocoding for breaking news headlines.
 * Sends violence headlines to Claude for location extraction,
 * then plots them as real-time map incidents.
 */

import { CAMPUSES } from '../sentinel-data/campuses';
import type { Incident, NewsItem } from '../sentinel-engine/types';

const REALTIME_NEWS_SOURCES = [
  'Block Club Chicago',
  'ABC7 Chicago',
  'NBC5 Chicago',
  'CBS Chicago',
];

const VIOLENCE_KEYWORDS = [
  'shot', 'shooting', 'shoot', 'homicide', 'killed', 'kill',
  'stabbed', 'stab', 'murder', 'wounded', 'fatal', 'weapon',
  'dead', 'gunfire', 'victim', 'robbery', 'carjack', 'gang',
];

export async function geocodeNewsIncidents(newsItems: NewsItem[]): Promise<Incident[]> {
  const candidates = newsItems.filter(item =>
    REALTIME_NEWS_SOURCES.includes(item.source) &&
    VIOLENCE_KEYWORDS.some(k =>
      (item.title + ' ' + (item.description ?? '')).toLowerCase().includes(k)
    )
  );

  if (candidates.length === 0) {
    console.log('News geocoder: no violence headlines found');
    return [];
  }

  console.log(`News geocoder: ${candidates.length} violence headlines to geocode`);

  const prompt = `You are a Chicago geography expert. For each news headline below, extract the location of the incident and return coordinates.

Chicago neighborhoods and approximate centers:
Englewood: 41.779, -87.641
West Englewood: 41.779, -87.657
Auburn Gresham: 41.744, -87.651
Chatham: 41.744, -87.620
North Lawndale: 41.869, -87.717
South Lawndale/Little Village: 41.850, -87.718
Humboldt Park: 41.900, -87.724
Roseland: 41.704, -87.637
Pullman/Burnside: 41.710, -87.608
South Shore: 41.765, -87.584
Woodlawn: 41.773, -87.596
Brighton Park: 41.809, -87.701
Back of the Yards: 41.800, -87.657
Hermosa: 41.918, -87.715
Belmont Cragin: 41.918, -87.763
Near West Side: 41.873, -87.673
Loop/Near North: 41.883, -87.629
Pilsen: 41.855, -87.657
Rogers Park: 41.998, -87.665
Austin: 41.900, -87.763

Major intersections:
63rd/Halsted: 41.779, -87.648
71st/Halsted: 41.764, -87.648
79th/Halsted: 41.750, -87.648
87th/Halsted: 41.736, -87.648
95th/Halsted: 41.722, -87.648
63rd/King Drive: 41.779, -87.615
79th/Cottage Grove: 41.750, -87.606
87th/Cottage Grove: 41.736, -87.606
Pulaski/Chicago Ave: 41.896, -87.724
Pulaski/North Ave: 41.910, -87.724
Kedzie/North Ave: 41.910, -87.705
Western/Madison: 41.881, -87.685
California/Roosevelt: 41.867, -87.695
Western/47th: 41.809, -87.685
Ashland/63rd: 41.779, -87.665
Stony Island/79th: 41.750, -87.586

Instructions:
- For each headline, identify if it describes a violent incident IN CHICAGO
- Extract the most specific location mentioned
- Return ONLY a JSON array, no other text, no markdown, no backticks
- Each object: {"id": NUMBER, "lat": NUMBER, "lng": NUMBER, "confidence": "INTERSECTION|NEIGHBORHOOD|AREA|UNKNOWN", "type": "HOMICIDE|SHOOTING|WEAPONS VIOLATION|BATTERY|ROBBERY|UNKNOWN"}
- INTERSECTION = specific street address or intersection mentioned
- NEIGHBORHOOD = neighborhood name mentioned but no specific address
- AREA = only general area mentioned (South Side, West Side, etc.)
- UNKNOWN = cannot determine Chicago location or not a Chicago incident
- id must match the headline number exactly

Headlines:
${candidates.map((item, i) => `${i}: [${item.source}] ${item.title}`).join('\n')}

Respond with ONLY the JSON array, starting with [ and ending with ]:`;

  try {
    const response = await fetch('/api/anthropic-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      console.error('News geocoder API error:', response.status);
      return [];
    }

    const data = await response.json();
    const text = (data.content?.[0]?.text ?? '').trim();

    // Strip any accidental markdown fences
    const clean = text.replace(/```json|```/g, '').trim();
    const results: Array<{
      id: number;
      lat: number;
      lng: number;
      confidence: string;
      type: string;
    }> = JSON.parse(clean);

    const incidents: Incident[] = [];

    for (const result of results) {
      if (result.confidence === 'UNKNOWN') continue;
      if (isNaN(result.lat) || isNaN(result.lng)) continue;
      // Sanity: must be within Chicago metro bounds
      if (result.lat < 41.6 || result.lat > 42.1) continue;
      if (result.lng < -87.95 || result.lng > -87.5) continue;

      // Must be within 3 miles of at least one Noble campus
      const nearCampus = CAMPUSES.some(c => {
        const dlat = (c.lat - result.lat) * 69;
        const dlng = (c.lng - result.lng) * 55;
        return Math.sqrt(dlat * dlat + dlng * dlng) <= 3.0;
      });
      if (!nearCampus) continue;

      const item = candidates[result.id];
      if (!item) continue;

      // Jitter based on confidence level
      const jitter = result.confidence === 'INTERSECTION' ? 0.001
        : result.confidence === 'NEIGHBORHOOD' ? 0.004 : 0.008;
      const lat = result.lat + (Math.random() - 0.5) * jitter;
      const lng = result.lng + (Math.random() - 0.5) * jitter;

      incidents.push({
        id: `news_${item.id ?? item.title.slice(0, 20).replace(/\s/g, '_')}`,
        type: result.type === 'UNKNOWN' ? 'BATTERY' : result.type,
        date: item.pubDate ?? new Date().toISOString(),
        block: `~${result.confidence} — ${item.source}`,
        lat,
        lng,
        description: item.title,
        source: 'NEWS' as const,
        confidence: 'NEWS_REPORTED' as const,
        headline: item.title,
        url: item.link,
      });
    }

    console.log(`News geocoder: ${incidents.length} incidents plotted from ${candidates.length} headlines`);
    return incidents;

  } catch (err) {
    console.error('News geocoder failed:', err);
    return [];
  }
}
