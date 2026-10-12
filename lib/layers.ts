export type LayerId =
  | 'regions' | 'rivers' | 'lakes' | 'canals' | 'roads' | 'hydrorivers' | 'hydrolakes' | 'basins'
  | 'surfaceWater' | 'flood100' | 'glofasAlerts' | 'pastFloods'
  | 'aquifers' | 'whymap' | 'waterStress'
  | 'rainYesterday' | 'rain3day' | 'nasa';

export const ENV = {
  hydroRivers: process.env.NEXT_PUBLIC_HYDRORIVERS_PMTILES ?? (process.env.NODE_ENV === 'production' ? '' : '/data/hydrorivers.pmtiles'),
  hydroLakes: process.env.NEXT_PUBLIC_HYDROLAKES_PMTILES ?? (process.env.NODE_ENV === 'production' ? '' : '/data/hydrolakes.pmtiles'),
  hydroBasins: process.env.NEXT_PUBLIC_HYDROBASINS_PMTILES || '',
  roads: process.env.NEXT_PUBLIC_ROADS_PMTILES || '/data/kz-roads.pmtiles',
  glofasWms: process.env.NEXT_PUBLIC_GLOFAS_WMS || 'https://ows.globalfloods.eu/glofas-ows/ows.py',
  glofasLayer: process.env.NEXT_PUBLIC_GLOFAS_LAYER || 'FloodHazard100y',
  igracWms: process.env.NEXT_PUBLIC_IGRAC_WMS || 'https://ggis.un-igrac.org/geoserver/ows',
  igracLayer: process.env.NEXT_PUBLIC_IGRAC_LAYER || '',
  whymapWms: process.env.NEXT_PUBLIC_WHYMAP_WMS || 'https://services.bgr.de/wms/grundwasser/whymap_gwr/',
  whymapLayer: process.env.NEXT_PUBLIC_WHYMAP_LAYER || '',
};

export function wmsTiles(base: string, layer: string): string {
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}service=WMS&version=1.1.1&request=GetMap&layers=${encodeURIComponent(layer)}&styles=&format=image/png&transparent=true&srs=EPSG:3857&width=256&height=256&bbox={bbox-epsg-3857}`;
}

export interface LegendItem { color: string; label: string; kind?: 'swatch' | 'line' | 'dot' }
export interface LayerDef {
  id: LayerId;
  label: string;
  group: 'Hydrography' | 'Floods' | 'Groundwater' | 'Weather' | 'Context';
  source: string;
  /** set when the layer needs an env var before it can draw */
  needs?: string;
  legend: LegendItem[];
}

export const LAYERS: LayerDef[] = [
  { id: 'rivers', label: 'River network', group: 'Hydrography', source: 'HydroSHEDS HydroRIVERS', legend: [{ color: '#2d86c4', label: 'Rivers and streams', kind: 'line' }] },
  { id: 'lakes', label: 'Lakes', group: 'Hydrography', source: 'HydroSHEDS HydroLAKES', legend: [{ color: '#7fb9e0', label: 'Lakes, reservoirs and seas' }] },
  {
    id: 'canals',
    label: 'Strategic canals',
    group: 'Hydrography',
    source: 'National Water Infrastructure Register',
    legend: [{ color: '#06b6d4', label: 'Inter-basin transfer canals', kind: 'line' }],
  },
  {
    id: 'roads',
    label: 'Major roads',
    group: 'Context',
    source: 'OpenStreetMap (Geofabrik Kazakhstan extract)',
    legend: [
      { color: '#f97316', label: 'Expressway', kind: 'line' },
      { color: '#eab308', label: 'Trunk road', kind: 'line' },
      { color: '#64748b', label: 'Primary road', kind: 'line' },
      { color: '#94a3b8', label: 'Secondary and tertiary roads', kind: 'line' },
    ],
  },
  { id: 'basins', label: 'Basins', group: 'Hydrography', source: '8 Basin Councils of Kazakhstan', legend: [{ color: '#6366f1', label: '8 River basin councils', kind: 'line' }] },
  { id: 'regions', label: 'Regions', group: 'Context', source: 'geoBoundaries ADM1', legend: [{ color: '#6b7c85', label: 'Regions and cities of republican significance', kind: 'line' }] },

  { id: 'flood100', label: '100-year flood zone', group: 'Floods', source: 'Copernicus EMS GloFAS', legend: [{ color: '#1f3a93', label: 'Flood depth in a 100-year flood (GloFAS)' }] },
  { id: 'glofasAlerts', label: 'GloFAS alerts', group: 'Floods', source: 'Open-Meteo Flood API', legend: [{ color: '#e0a100', label: 'River flow rising (watch)', kind: 'dot' }, { color: '#c62828', label: 'Strong rise forecast (warning)', kind: 'dot' }, { color: '#4a9d6a', label: 'Normal', kind: 'dot' }] },
  { id: 'pastFloods', label: 'Past floods', group: 'Floods', source: 'Dartmouth Flood Observatory (sample)', legend: [{ color: '#d86a4a', label: 'Past large floods; size reflects extent', kind: 'dot' }] },
  { id: 'surfaceWater', label: 'Water 1984–2021', group: 'Floods', source: 'JRC Global Surface Water', legend: [{ color: '#0b4fd6', label: 'Surface water seen in satellite record (JRC)' }] },

  { id: 'aquifers', label: 'Aquifers (IGRAC)', group: 'Groundwater', source: 'IGRAC GGIS WMS', needs: ENV.igracLayer ? undefined : 'NEXT_PUBLIC_IGRAC_LAYER', legend: [{ color: '#8e5a2b', label: 'IGRAC aquifer layer' }] },
  { id: 'whymap', label: 'Groundwater (WHYMAP)', group: 'Groundwater', source: 'BGR WHYMAP WMS', needs: ENV.whymapLayer ? undefined : 'NEXT_PUBLIC_WHYMAP_LAYER', legend: [{ color: '#3c8d7a', label: 'WHYMAP groundwater systems' }] },
  { id: 'waterStress', label: 'Water stress by region', group: 'Groundwater', source: 'WRI Aqueduct (placeholder values)', legend: [{ color: '#f7e7a6', label: 'Low to medium' }, { color: '#f2b366', label: 'Medium to high' }, { color: '#dd6b3b', label: 'High' }, { color: '#a31f2d', label: 'Extremely high' }] },

  { id: 'rainYesterday', label: 'Rain yesterday', group: 'Weather', source: 'Open-Meteo', legend: [{ color: '#3a7bd5', label: 'Rain yesterday (mm); size = amount', kind: 'dot' }] },
  { id: 'rain3day', label: 'Rain, next 3 days', group: 'Weather', source: 'Open-Meteo', legend: [{ color: '#7a4fd1', label: 'Forecast rain, next 3 days (mm)', kind: 'dot' }] },
  { id: 'nasa', label: 'Satellite today', group: 'Weather', source: 'NASA GIBS (MODIS)', legend: [{ color: '#556b4a', label: 'NASA true-colour image, yesterday' }] },
];

export const LAYER_GROUPS: LayerDef['group'][] = ['Hydrography', 'Floods', 'Groundwater', 'Weather', 'Context'];
export const DEFAULT_LAYERS: LayerId[] = ['regions', 'rivers', 'lakes'];
