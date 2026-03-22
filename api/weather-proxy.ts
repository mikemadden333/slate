/**
 * Weather Proxy — Vercel Serverless Function
 * 
 * NEW: Server-side proxy for Open-Meteo weather data.
 * 
 * While Open-Meteo works client-side, this proxy adds caching and
 * combines current conditions with hourly forecast in one call.
 * 
 * Usage: /api/weather-proxy (returns Chicago weather)
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const cache: { data: any; ts: number } = { data: null, ts: 0 };
const TTL = 15 * 60 * 1000; // 15 minutes

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=600');

  if (cache.data && Date.now() - cache.ts < TTL) {
    return res.status(200).json(cache.data);
  }

  try {
    const url = 'https://api.open-meteo.com/v1/forecast'
      + '?latitude=41.8781&longitude=-87.6298'
      + '&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m'
      + '&hourly=temperature_2m,weather_code,precipitation_probability'
      + '&temperature_unit=fahrenheit'
      + '&wind_speed_unit=mph'
      + '&forecast_days=1'
      + '&timezone=America/Chicago';

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) throw new Error(`Open-Meteo returned ${response.status}`);

    const weather = await response.json();
    const data = { ...weather, fetchedAt: new Date().toISOString() };
    cache.data = data;
    cache.ts = Date.now();
    return res.status(200).json(data);
  } catch {
    return res.status(200).json({ error: 'weather_unavailable' });
  }
}
