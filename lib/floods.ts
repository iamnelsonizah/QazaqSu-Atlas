import type { FC } from './types';

/**
 * Past large floods. Illustrative records for the prototype.
 * Replace with the Dartmouth Flood Observatory archive (https://floodobservatory.colorado.edu)
 * filtered to Kazakhstan: export the "Global Active Archive of Large Flood Events" and convert to GeoJSON.
 */
export const PAST_FLOODS: FC = {
  type: 'FeatureCollection',
  features: [
    f('2024 spring floods: Ural at Oral', 51.23, 51.37, 2024, 'West Kazakhstan', 'Worst spring flooding in decades across northern and western Kazakhstan; tens of thousands evacuated.', 'B', 14),
    f('2024 spring floods: Aktobe region', 50.28, 57.2, 2024, 'Aktobe', 'Part of the same 2024 spring snowmelt event.', 'B', 11),
    f('2024 spring floods: Tobol at Kostanay', 53.2, 63.6, 2024, 'Kostanay', 'Part of the same 2024 spring snowmelt event.', 'B', 12),
    f('2024 spring floods: Ishim at Petropavl', 54.87, 69.15, 2024, 'North Kazakhstan', 'Part of the same 2024 spring snowmelt event.', 'B', 12),
    f('2010 Kyzylagash dam failure', 45.4, 79.3, 2010, 'Jetisu', 'Earth dam failed during spring melt; fatalities and destroyed homes. Confirm location and casualty figure.', 'C', 9, true),
    f('1973 Kishi Almaty mudflow', 43.16, 77.06, 1973, 'Almaty city', 'Large glacial-lake mudflow above Almaty, stopped by the Medeu dam.', 'B', 10),
  ],
};

function f(name: string, lat: number, lon: number, year: number, region: string, note: string, verification: string, r: number, approx = false): GeoJSON.Feature {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [lon, lat] },
    properties: { name, year, region, note, verification, r, approx: approx ? 1 : 0 },
  };
}
