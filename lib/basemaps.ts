import type { StyleSpecification } from 'maplibre-gl';

export type BasemapId = 'outline' | 'map' | 'satellite' | 'terrain' | 'nasa';
export const BASEMAPS: { id: BasemapId; label: string }[] = [
  { id: 'outline', label: 'Outline' },
  { id: 'map', label: 'Map' },
  { id: 'satellite', label: 'Satellite' },
  { id: 'terrain', label: 'Terrain' },
  { id: 'nasa', label: 'NASA daily' },
];

const CUSTOM = process.env.NEXT_PUBLIC_CUSTOM_STYLE_URL || '';
const MT = process.env.NEXT_PUBLIC_MAPTILER_KEY || '';
const ST = process.env.NEXT_PUBLIC_STADIA_KEY || '';

/** Which provider is serving the basemap right now (shown in the UI) */
export const BASEMAP_PROVIDER = CUSTOM ? 'Custom style' : MT ? 'MapTiler' : ST ? 'Stadia Maps' : 'OpenStreetMap / Esri (no key)';

function raster(id: string, tiles: string[], attribution: string, maxzoom = 19, tileSize = 256, bg = '#e4ecef'): StyleSpecification {
  return {
    version: 8,
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: { [id]: { type: 'raster', tiles, tileSize, maxzoom, attribution } },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': bg } },
      { id: `base-${id}`, type: 'raster', source: id },
    ],
  };
}

export function nasaDateUTC(): string {
  const d = new Date(Date.now() - 2 * 24 * 3600 * 1000);
  if (d.getUTCFullYear() > 2024) {
    return '2024-10-08';
  }
  return d.toISOString().slice(0, 10);
}

export const NASA_LAYER = 'VIIRS_SNPP_CorrectedReflectance_TrueColor';
export function nasaTiles(date = nasaDateUTC()): string {
  return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${NASA_LAYER}/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`;
}

export function getInitialMapStyle(initialId: BasemapId = 'map'): StyleSpecification {
  return {
    version: 8,
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: {
      osm: {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors',
      },
      'esri-dark': {
        type: 'raster',
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        attribution: 'Tiles © Esri',
      },
      'esri-sat': {
        type: 'raster',
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        attribution: 'Imagery © Esri, Maxar, Earthstar Geographics',
      },
      opentopo: {
        type: 'raster',
        tiles: [
          'https://tile.opentopomap.org/{z}/{x}/{y}.png',
          'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
          'https://b.tile.opentopomap.org/{z}/{x}/{y}.png',
          'https://c.tile.opentopomap.org/{z}/{x}/{y}.png',
        ],
        tileSize: 256,
        maxzoom: 17,
        attribution: 'Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap (CC-BY-SA)',
      },
      'nasa-base': {
        type: 'raster',
        tiles: [nasaTiles()],
        tileSize: 256,
        maxzoom: 9,
        attribution: 'Imagery: NASA GIBS / VIIRS SNPP corrected reflectance (2 days ago)',
      },
    },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': '#dfe9ec' } },
      { id: 'base-osm', type: 'raster', source: 'osm', layout: { visibility: initialId === 'map' ? 'visible' : 'none' } },
      { id: 'base-esri-dark', type: 'raster', source: 'esri-dark', layout: { visibility: 'none' } },
      { id: 'base-satellite', type: 'raster', source: 'esri-sat', layout: { visibility: initialId === 'satellite' ? 'visible' : 'none' } },
      { id: 'base-terrain', type: 'raster', source: 'opentopo', layout: { visibility: initialId === 'terrain' ? 'visible' : 'none' } },
      { id: 'base-nasa', type: 'raster', source: 'nasa-base', layout: { visibility: initialId === 'nasa' ? 'visible' : 'none' } },
    ],
  };
}

export function getBasemapStyle(id: BasemapId): StyleSpecification | string {
  switch (id) {
    case 'outline':
      return {
        version: 8,
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: {},
        layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#dfe9ec' } }],
      };
    case 'map':
      if (CUSTOM) return CUSTOM;
      if (MT) return `https://api.maptiler.com/maps/streets-v2/style.json?key=${MT}`;
      if (ST) return `https://tiles.stadiamaps.com/styles/osm_bright.json?api_key=${ST}`;
      return raster('osm', ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], '© OpenStreetMap contributors');
    case 'satellite':
      if (MT) return `https://api.maptiler.com/maps/satellite/style.json?key=${MT}`;
      if (ST) return `https://tiles.stadiamaps.com/styles/alidade_satellite.json?api_key=${ST}`;
      return raster('esri-sat', ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], 'Imagery © Esri, Maxar, Earthstar Geographics');
    case 'terrain':
      if (MT) return `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${MT}`;
      if (ST) return `https://tiles.stadiamaps.com/styles/stamen_terrain.json?api_key=${ST}`;
      return raster(
        'opentopo',
        [
          'https://tile.opentopomap.org/{z}/{x}/{y}.png',
          'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
          'https://b.tile.opentopomap.org/{z}/{x}/{y}.png',
          'https://c.tile.opentopomap.org/{z}/{x}/{y}.png',
        ],
        'Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap (CC-BY-SA)',
        17
      );
    case 'nasa':
      return raster('nasa-base', [nasaTiles()], 'Imagery: NASA GIBS / VIIRS SNPP corrected reflectance (2 days ago)', 9);
  }
}
