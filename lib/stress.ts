/**
 * Indicative baseline water stress by region (1 = low-medium, 4 = extremely high).
 * PLACEHOLDER VALUES for the prototype. Replace with a zonal-statistics export of
 * WRI Aqueduct 4.0 "bws" for each geoBoundaries ADM1 polygon (see README).
 */
const RULES: [RegExp, number][] = [
  [/north kazakhstan/i, 2],
  [/west kazakhstan/i, 2],
  [/east kazakhstan/i, 1],
  [/abai|abay/i, 1.5],
  [/akmola/i, 2],
  [/aktobe|aqtobe/i, 2],
  [/atyrau/i, 2.5],
  [/jambyl|zhambyl|jambul/i, 3.5],
  [/jetisu|zhetysu/i, 3],
  [/karaganda|qaraghandy/i, 2],
  [/kostanay|qostanay/i, 2],
  [/kyzylorda|qyzylorda/i, 3.5],
  [/mangystau|mangghystau/i, 4],
  [/pavlodar/i, 2],
  [/turkistan|turkestan/i, 4],
  [/ulytau/i, 2],
  [/shymkent/i, 4],
  [/astana|nur-sultan/i, 2],
  [/^almaty$|almaty city/i, 3.5],
  [/almaty/i, 3],
];

export function stressScore(name: string): number {
  for (const [re, s] of RULES) if (re.test(name)) return s;
  return 2.5;
}
export function stressLabel(score: number): string {
  if (score < 2) return 'Low to medium';
  if (score < 3) return 'Medium to high';
  if (score < 4) return 'High';
  return 'Extremely high';
}
export const STRESS_RAMP: [number, string][] = [
  [1, '#f7e7a6'],
  [2, '#f2b366'],
  [3, '#dd6b3b'],
  [4, '#a31f2d'],
];
