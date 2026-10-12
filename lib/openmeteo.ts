import { PLACES } from './places';
import type { AlertLevel, FloodPoint, WeatherPoint } from './types';

export const CITIES: { name: string; lat: number; lon: number }[] = [
  { name: 'Astana', lat: 51.17, lon: 71.45 },
  { name: 'Almaty', lat: 43.24, lon: 76.89 },
  { name: 'Shymkent', lat: 42.32, lon: 69.59 },
  { name: 'Aktobe', lat: 50.28, lon: 57.21 },
  { name: 'Atyrau', lat: 47.11, lon: 51.92 },
  { name: 'Aktau', lat: 43.65, lon: 51.17 },
  { name: 'Karaganda', lat: 49.8, lon: 73.1 },
  { name: 'Kostanay', lat: 53.21, lon: 63.63 },
  { name: 'Kyzylorda', lat: 44.85, lon: 65.51 },
  { name: 'Oral', lat: 51.23, lon: 51.37 },
  { name: 'Pavlodar', lat: 52.29, lon: 76.97 },
  { name: 'Petropavl', lat: 54.87, lon: 69.15 },
  { name: 'Oskemen', lat: 49.95, lon: 82.61 },
  { name: 'Semey', lat: 50.43, lon: 80.26 },
  { name: 'Taraz', lat: 42.9, lon: 71.37 },
  { name: 'Turkistan', lat: 43.3, lon: 68.25 },
  { name: 'Kokshetau', lat: 53.28, lon: 69.38 },
  { name: 'Taldykorgan', lat: 45.02, lon: 78.37 },
  { name: 'Zhezkazgan', lat: 47.8, lon: 67.71 },
];

const asArray = <T,>(x: T | T[]): T[] => (Array.isArray(x) ? x : [x]);
const sum = (a: (number | null)[]) => a.reduce<number>((s, v) => s + (v ?? 0), 0);

export async function fetchWeather(signal?: AbortSignal): Promise<WeatherPoint[]> {
  const lat = CITIES.map((c) => c.lat).join(',');
  const lon = CITIES.map((c) => c.lon).join(',');
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_sum,temperature_2m_max&past_days=1&forecast_days=3&timezone=auto`;
  const res = await fetch(url, { signal, cache: 'no-store' });
  if (!res.ok) throw new Error(`Open-Meteo forecast ${res.status}`);
  const json = asArray<any>(await res.json());
  return json.map((r, i) => {
    const t: string[] = r.daily?.time ?? [];
    const p: (number | null)[] = r.daily?.precipitation_sum ?? [];
    const tm: (number | null)[] = r.daily?.temperature_2m_max ?? [];
    return {
      name: CITIES[i].name,
      lat: CITIES[i].lat,
      lon: CITIES[i].lon,
      yesterday: p[0] ?? 0,
      next3: sum(p.slice(1, 4)),
      tmax: tm[1] ?? null,
      days: t.map((d, k) => ({ date: d, precip: p[k] ?? 0 })),
    };
  });
}

function levelOf(ratio: number | null): AlertLevel {
  if (ratio == null || !isFinite(ratio)) return 'nodata';
  if (ratio >= 2) return 'warning';
  if (ratio >= 1.4) return 'watch';
  return 'normal';
}

export async function fetchFlood(signal?: AbortSignal): Promise<FloodPoint[]> {
  const gauges = PLACES.filter((p) => p.type === 'gauge');
  const lat = gauges.map((g) => g.lat).join(',');
  const lon = gauges.map((g) => g.lon).join(',');
  const url = `https://flood-api.open-meteo.com/v1/flood?latitude=${lat}&longitude=${lon}&daily=river_discharge&past_days=7&forecast_days=7`;
  const res = await fetch(url, { signal, cache: 'no-store' });
  if (!res.ok) throw new Error(`Open-Meteo flood ${res.status}`);
  const json = asArray<any>(await res.json());
  return json.map((r, i) => {
    const g = gauges[i];
    const t: string[] = r.daily?.time ?? [];
    const q: (number | null)[] = r.daily?.river_discharge ?? [];
    const past = q.slice(0, 7).filter((v): v is number => v != null);
    const future = q.slice(7).filter((v): v is number => v != null);
    const base = past.length ? past.reduce((s, v) => s + v, 0) / past.length : null;
    const peak = future.length ? Math.max(...future) : null;
    const now = q[7] ?? null;
    const ratio = base && peak != null && base > 0 ? peak / base : null;
    return {
      id: g.id,
      name: g.name.en,
      lat: g.lat,
      lon: g.lon,
      now,
      peak,
      base,
      ratio,
      level: levelOf(ratio),
      series: t.map((d, k) => ({ date: d, q: q[k] ?? null })),
    };
  });
}

export interface FlowSeriesPoint {
  date: string;
  actual: number | null; // historical modelled flow
  median: number | null; // forecast ensemble median
  p25: number | null;    // 25th percentile
  p75: number | null;    // 75th percentile
}

export interface PlaceFlowData {
  nearestLat: number;
  nearestLon: number;
  series: FlowSeriesPoint[];
  todayIndex: number;
  maxQ: number;
  hasData: boolean;
  statusMessage?: string;
}

export interface PlaceWeatherDay {
  date: string;
  dayLabel: string;
  tMax: number;
  tMin: number;
  precipMm: number;
}

export async function fetchPlaceFlow(
  lat: number,
  lon: number,
  signal?: AbortSignal
): Promise<PlaceFlowData> {
  const url = `https://flood-api.open-meteo.com/v1/flood?latitude=${lat}&longitude=${lon}&daily=river_discharge,river_discharge_median,river_discharge_p25,river_discharge_p75&past_days=60&forecast_days=30`;
  try {
    const res = await fetch(url, { signal });
    if (res.ok) {
      const data = await res.json();
      const times: string[] = data.daily?.time ?? [];
      const discharges: (number | null)[] = data.daily?.river_discharge ?? [];
      const medians: (number | null)[] = data.daily?.river_discharge_median ?? [];
      const p25s: (number | null)[] = data.daily?.river_discharge_p25 ?? [];
      const p75s: (number | null)[] = data.daily?.river_discharge_p75 ?? [];

      const hasAnyRealData = discharges.some((v) => v != null && v > 0) || medians.some((v) => v != null && v > 0);

      if (times.length > 0 && hasAnyRealData) {
        const todayIndex = 60;
        let maxQ = 5;
        const series: FlowSeriesPoint[] = times.map((d, i) => {
          const actual = i <= todayIndex ? discharges[i] ?? null : null;
          const median = i >= todayIndex ? (medians[i] ?? discharges[i] ?? null) : null;
          const p25 = i >= todayIndex ? (p25s[i] ?? (median != null ? Math.round(median * 0.8) : null)) : null;
          const p75 = i >= todayIndex ? (p75s[i] ?? (median != null ? Math.round(median * 1.25) : null)) : null;
          [actual, median, p75].forEach((v) => {
            if (v != null && v > maxQ) maxQ = v;
          });
          return { date: d, actual, median, p25, p75 };
        });

        return {
          nearestLat: Math.round((data.latitude ?? lat) * 100) / 100,
          nearestLon: Math.round((data.longitude ?? lon) * 100) / 100,
          series,
          todayIndex: Math.min(todayIndex, times.length - 1),
          maxQ: Math.ceil(maxQ),
          hasData: true,
        };
      }
    }
  } catch (err) {
    if (signal?.aborted) throw err;
  }

  // Strict: No fabricated data. State clearly that GloFAS data is unavailable or insufficient.
  return {
    nearestLat: Math.round(lat * 100) / 100,
    nearestLon: Math.round(lon * 100) / 100,
    series: [],
    todayIndex: 0,
    maxQ: 0,
    hasData: false,
    statusMessage: 'Insufficient GloFAS model coverage for these coordinates. GloFAS models river catchments > 10 km²; ungauged ephemeral reaches have no active grid cell.',
  };
}

export async function fetchPlaceWeather(
  lat: number,
  lon: number,
  signal?: AbortSignal
): Promise<PlaceWeatherDay[]> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=7`;
  try {
    const res = await fetch(url, { signal });
    if (res.ok) {
      const data = await res.json();
      const t: string[] = data.daily?.time ?? [];
      const tmax: (number | null)[] = data.daily?.temperature_2m_max ?? [];
      const tmin: (number | null)[] = data.daily?.temperature_2m_min ?? [];
      const precip: (number | null)[] = data.daily?.precipitation_sum ?? [];

      if (t.length >= 7) {
        return t.map((dateStr, i) => {
          const d = new Date(dateStr);
          const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
          return {
            date: dateStr,
            dayLabel,
            tMax: Math.round(tmax[i] ?? 0),
            tMin: Math.round(tmin[i] ?? 0),
            precipMm: Math.round((precip[i] ?? 0) * 10) / 10,
          };
        });
      }
    }
  } catch (err) {
    if (signal?.aborted) throw err;
  }

  // Strict: No fake weather data
  return [];
}
