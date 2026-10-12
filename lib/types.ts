export type Lang = 'en' | 'kk' | 'ru';
export type PlaceType = 'dam' | 'lake' | 'river' | 'canal' | 'glacier' | 'ramsar' | 'gauge' | 'basinhq';
/** A = well documented, B = documented but figures approximate, C = placeholder, confirm before publishing */
export type Verification = 'A' | 'B' | 'C';

export const BASINS = [
  'Aral-Syrdarya',
  'Balkhash-Alakol',
  'Ertis',
  'Esil',
  'Nura-Sarysu',
  'Tobyl-Torgay',
  'Zhayik-Caspian',
  'Shu-Talas',
] as const;
export type Basin = (typeof BASINS)[number];

export interface PlacePhoto {
  url: string;
  thumbnail: string;
  caption: string;
  author?: string;
  license?: string;
  sourceUrl?: string;
}

export interface PlaceReference {
  title: string;
  url: string;
  source?: string;
  year?: string | number;
}

export interface Place {
  id: string;
  type: PlaceType;
  name: Record<Lang, string>;
  lat: number;
  lon: number;
  region: string;
  basin: Basin;
  verification: Verification;
  size?: number;
  sizeUnit?: string;
  year?: number;
  note?: string;
  source: string;
  approx?: boolean;

  // Rich encyclopedic metadata for slider drawer
  lengthKm?: number;
  lengthKzKm?: number;
  flowsInto?: string;
  sourceLocation?: string;
  regionsCrossed?: string;
  dischargeM3s?: number;
  streamOrder?: number;
  lineDrawnFrom?: string;
  wikipediaUrl?: string;
  wikidataId?: string;
  about?: Record<Lang, string> | string;
  photos?: PlacePhoto[];
  references?: PlaceReference[];

  // Hydrological Network & Connectivity (Physical & Basin Relations)
  drainageType?: 'endorheic' | 'exorheic';
  inflows?: string[];
  outflows?: string[];
  transboundaryInflow?: string;
  basinCouncil?: string;

  // Canals & hydraulic infrastructure
  canalCapacityM3s?: number;
  pumpingStations?: number;
  liftMeters?: number;

  // Glacial & alpine monitoring
  elevationM?: number;
  wgmsId?: string;
  meltwaterContribution?: string;
}

export type FC = GeoJSON.FeatureCollection;
export const EMPTY_FC: FC = { type: 'FeatureCollection', features: [] };

export interface WeatherPoint {
  name: string;
  lat: number;
  lon: number;
  yesterday: number;
  next3: number;
  tmax: number | null;
  days: { date: string; precip: number }[];
}

export type AlertLevel = 'normal' | 'watch' | 'warning' | 'nodata';
export interface FloodPoint {
  id: string;
  name: string;
  lat: number;
  lon: number;
  now: number | null;
  peak: number | null;
  base: number | null;
  ratio: number | null;
  level: AlertLevel;
  series: { date: string; q: number | null }[];
}

export type LoadState = 'idle' | 'loading' | 'ok' | 'error';
