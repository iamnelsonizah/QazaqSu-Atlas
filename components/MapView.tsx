'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl, { type GeoJSONSource, type Map as MLMap } from 'maplibre-gl';
import { Protocol } from 'pmtiles';
import { getInitialMapStyle, nasaTiles, type BasemapId } from '@/lib/basemaps';
import { ENV, wmsTiles, type LayerId } from '@/lib/layers';
import { PAST_FLOODS } from '@/lib/floods';
import { placeProps, placesToGeoJSON, TYPE_META, REGION_BOUNDS, BASIN_BOUNDS, REGION_SHAPE_NAMES, PLACES, nameOf } from '@/lib/places';
import { stressLabel } from '@/lib/stress';
import { formatNumber, tr } from '@/lib/i18n';
import { EMPTY_FC, type FC, type FloodPoint, type Lang, type Place, type WeatherPoint } from '@/lib/types';

export interface GeoBundle {
  regions: FC;
  rivers: FC;
  lakes: FC;
  canals?: FC;
  border?: FC;
  labels?: FC;
  mask?: FC;
  basins?: FC;
}

interface Props {
  visible: boolean;
  basemap: BasemapId;
  dark?: boolean;
  layers: Set<LayerId>;
  places: Place[];
  lang: Lang;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  region?: string;
  basin?: string;
  geo: GeoBundle;
  weather: WeatherPoint[] | null;
  flood: FloodPoint[] | null;
  onNotice: (msg: string) => void;
}

/** which map layers belong to each toggle */
const LAYER_MAP: Record<LayerId, string[]> = {
  regions: ['regions-line'],
  rivers: ['rivers-line', 'hydrorivers-line', 'hydrorivers-trace', 'hydrorivers-hit'],
  lakes: ['lakes-fill', 'lakes-line'],
  canals: ['canals-casing', 'canals-line'],
  roads: ['roads-casing', 'roads-primary', 'roads-secondary', 'roads-tertiary', 'roads-trunk', 'roads-expressway', 'roads-hit'],
  hydrorivers: ['hydrorivers-line'],
  hydrolakes: ['lakes-fill', 'lakes-line'],
  basins: ['basins-fill', 'basins-line'],
  surfaceWater: ['gsw'],
  flood100: ['flood100'],
  glofasAlerts: ['alerts-halo', 'alerts-circle'],
  pastFloods: ['floods-circle'],
  aquifers: ['aquifers'],
  whymap: ['whymap'],
  waterStress: ['stress-fill'],
  rainYesterday: ['rain-y'],
  rain3day: ['rain-3d'],
  nasa: ['nasa'],
};
const SOURCE_TO_LAYER: Record<string, { id: LayerId; label: string }> = {
  gsw: { id: 'surfaceWater', label: 'JRC Global Surface Water' },
  flood100: { id: 'flood100', label: 'GloFAS 100-year flood hazard' },
  aquifers: { id: 'aquifers', label: 'IGRAC aquifers' },
  whymap: { id: 'whymap', label: 'WHYMAP groundwater' },
  nasa: { id: 'nasa', label: 'NASA GIBS imagery' },
  hydrorivers: { id: 'rivers', label: 'River network' },
  hydrolakes: { id: 'lakes', label: 'Lakes' },
  'osm-roads': { id: 'roads', label: 'OpenStreetMap roads' },
  hydrobasins: { id: 'basins', label: 'Basins' },
};
const ROAD_INTERACTIVE = ['roads-hit', 'roads-expressway', 'roads-trunk', 'roads-primary', 'roads-secondary', 'roads-tertiary'];
const INTERACTIVE = ['places-circle', 'alerts-circle', 'floods-circle', 'rain-y', 'rain-3d', 'regions-hit', 'basins-fill', 'lakes-fill', 'rivers-line', 'hydrorivers-line', 'hydrorivers-hit', ...ROAD_INTERACTIVE];
const TYPE_ZOOM: Record<string, number> = { dam: 9, lake: 7, river: 7, canal: 8, glacier: 11, ramsar: 8, gauge: 8, basinhq: 8 };
const TYPE_COLORS = Object.entries(TYPE_META).flatMap(([k, v]) => [k, v.color]);
type RiverTrace = { direction: 'upstream' | 'downstream'; mainRiver: number; reachId: number };

let protocolReady = false;

function el(tag: string, text?: string, cls?: string): HTMLElement {
  const n = document.createElement(tag);
  if (text != null) n.textContent = text;
  if (cls) n.className = cls;
  return n;
}
function row(root: HTMLElement, k: string, v: string | number | undefined) {
  if (v === undefined || v === '' || v === 0) return;
  const r = el('div', undefined, 'popup-row');
  r.append(el('span', k), el('b', String(v)));
  root.append(r);
}

function popupEl(
  lang: Lang,
  layer: string,
  p: Record<string, any>,
  onTrace: (direction: RiverTrace['direction']) => void,
): HTMLElement {
  const root = el('div', undefined, 'popup');
  if (layer === 'places-circle') {
    root.append(el('strong', p.name));
    if (p.alt) root.append(el('div', p.alt, 'popup-alt'));
    root.append(el('div', `${tr(lang, p.typeLabel)} · ${tr(lang, p.region)}`, 'popup-sub'));
    row(root, tr(lang, 'Size'), p.size);
    row(root, tr(lang, 'Basin'), tr(lang, p.basin));
    row(root, tr(lang, 'Year'), p.year);
    row(root, tr(lang, 'Verification'), p.verification + (p.approx ? ` (${tr(lang, 'location approximate')})` : ''));
    if (p.note) root.append(el('p', tr(lang, p.note)));
    root.append(el('div', `${tr(lang, 'Source:')} ${p.source}`, 'popup-src'));
  } else if (layer === 'floods-circle') {
    root.append(el('strong', p.name));
    root.append(el('div', `${p.year} · ${tr(lang, p.region)}`, 'popup-sub'));
    root.append(el('p', tr(lang, p.note)));
    root.append(el('div', tr(lang, 'Dartmouth Flood Observatory archive record.'), 'popup-src'));
  } else if (layer === 'alerts-circle') {
    const place = PLACES.find((item) => item.id === p.id);
    root.append(el('strong', place ? nameOf(place, lang) : p.name));
    root.append(el('div', `${tr(lang, 'River flow:')} ${tr(lang, String(p.level).toLowerCase())}`, 'popup-sub'));
    row(root, tr(lang, 'Flow now'), p.now != null && p.now !== 'null' ? `${formatNumber(Number(p.now), lang, { maximumFractionDigits: 0 })} ${tr(lang, 'm³/s')}` : undefined);
    row(root, tr(lang, '7-day peak'), p.peak != null && p.peak !== 'null' ? `${formatNumber(Number(p.peak), lang, { maximumFractionDigits: 0 })} ${tr(lang, 'm³/s')}` : undefined);
    row(root, tr(lang, 'Peak vs last week'), p.ratio != null && p.ratio !== 'null' ? `×${formatNumber(Number(p.ratio), lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : undefined);
    root.append(el('div', tr(lang, 'Modelled flow from the Open-Meteo Flood API (GloFAS). Not an official warning.'), 'popup-src'));
  } else if (layer === 'rain-y' || layer === 'rain-3d') {
    root.append(el('strong', p.name));
    row(root, tr(lang, 'Rain yesterday'), `${formatNumber(Number(p.y), lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mm`);
    row(root, tr(lang, 'Rain, next 3 days'), `${formatNumber(Number(p.f3), lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mm`);
    row(root, tr(lang, 'Max temperature today'), p.tmax != null && p.tmax !== 'null' ? `${formatNumber(Number(p.tmax), lang, { maximumFractionDigits: 0 })} °C` : undefined);
  } else if (layer === 'basins-fill') {
    root.append(el('strong', p.name || 'River Basin'));
    if (p.name_kk || p.name_ru) {
      root.append(el('div', [p.name_kk, p.name_ru].filter(Boolean).join(' · '), 'popup-alt'));
    }
    root.append(el('div', tr(lang, 'Water-Management Basin Council'), 'popup-sub'));
    row(root, tr(lang, 'Area'), p.area);
    row(root, tr(lang, 'Main rivers'), p.rivers);
    row(root, tr(lang, 'Key waters'), p.key_waters);
    row(root, tr(lang, 'Council HQ'), p.hq);
    root.append(el('div', tr(lang, 'Water-management river basin of the Republic of Kazakhstan'), 'popup-src'));
  } else if (layer === 'lakes-fill') {
    root.append(el('strong', p.name || p.Lake_name || 'Unnamed lake'));
    if (p.name_kk || p.name_ru) {
      root.append(el('div', [p.name_kk, p.name_ru].filter(Boolean).join(' · '), 'popup-alt'));
    }
    if (p.basin) row(root, tr(lang, 'Basin'), tr(lang, p.basin));
    row(root, tr(lang, 'Area'), p.Lake_area != null ? `${formatNumber(Number(p.Lake_area), lang)} ${tr(lang, 'km²')}` : undefined);
    row(root, tr(lang, 'Average depth'), p.Depth_avg != null ? `${formatNumber(Number(p.Depth_avg), lang)} ${tr(lang, 'm')}` : undefined);
    row(root, tr(lang, 'Volume'), p.Vol_total != null ? `${formatNumber(Number(p.Vol_total), lang)} ${tr(lang, 'km³')}` : undefined);
    row(root, tr(lang, 'Shoreline'), p.Shore_len != null ? `${formatNumber(Number(p.Shore_len), lang)} ${tr(lang, 'km')}` : undefined);
    row(root, tr(lang, 'Elevation'), p.Elevation != null ? `${formatNumber(Number(p.Elevation), lang)} ${tr(lang, 'm')}` : undefined);
    row(root, tr(lang, 'HydroLAKES ID'), p.Hylak_id);
    root.append(el('div', 'HydroLAKES global lake database', 'popup-src'));
  } else if (layer === 'hydrorivers-line' || layer === 'hydrorivers-trace' || layer === 'hydrorivers-hit' || layer === 'rivers-line') {
    const title = p.name || p.name_en || (p.HYRIV_ID ? 'River network reach' : 'River');
    root.append(el('strong', title));
    if (p.name_kk || p.name_ru) root.append(el('div', [p.name_kk, p.name_ru].filter(Boolean).join(' · '), 'popup-alt'));
    if (p.basin) row(root, tr(lang, 'Basin'), tr(lang, p.basin));
    row(root, tr(lang, 'Reach length'), p.LENGTH_KM != null ? `${formatNumber(Number(p.LENGTH_KM), lang)} ${tr(lang, 'km')}` : undefined);
    row(root, tr(lang, 'River order'), p.ORD_STRA);
    row(root, tr(lang, 'Average flow'), p.DIS_AV_CMS != null ? `${formatNumber(Number(p.DIS_AV_CMS), lang)} ${tr(lang, 'm³/s')}` : undefined);
    row(root, tr(lang, 'Upstream area'), p.UPLAND_SKM != null ? `${formatNumber(Number(p.UPLAND_SKM), lang)} ${tr(lang, 'km²')}` : undefined);
    row(root, tr(lang, 'Distance to outlet'), p.DIST_DN_KM != null ? `${formatNumber(Number(p.DIST_DN_KM), lang)} ${tr(lang, 'km')}` : undefined);
    row(root, tr(lang, 'HydroRIVERS ID'), p.HYRIV_ID);
    if (Number.isFinite(Number(p.MAIN_RIV)) && Number.isFinite(Number(p.DIST_DN_KM))) {
      const actions = el('div', undefined, 'popup-actions');
      const upstream = el('button', tr(lang, 'Trace upstream network')) as HTMLButtonElement;
      upstream.type = 'button';
      upstream.addEventListener('click', () => onTrace('upstream'));
      const downstream = el('button', tr(lang, 'Trace downstream')) as HTMLButtonElement;
      downstream.type = 'button';
      downstream.addEventListener('click', () => onTrace('downstream'));
      actions.append(upstream, downstream);
      root.append(actions);
    } else if (layer === 'rivers-line') {
      root.append(el('div', tr(lang, 'Zoom in and select a detailed river reach to trace its network.'), 'popup-src'));
    }
    root.append(el('div', 'HydroSHEDS HydroRIVERS', 'popup-src'));
  } else if (ROAD_INTERACTIVE.includes(layer)) {
    root.append(el('strong', p.name || p.ref || 'Unnamed road'));
    if (p.name && p.ref) root.append(el('div', `Route ${p.ref}`, 'popup-sub'));
    row(root, tr(lang, 'Road class'), p.class || p.highway);
    row(root, tr(lang, 'Surface'), p.surface);
    row(root, tr(lang, 'One way'), p.oneway);
    row(root, tr(lang, 'OSM way ID'), p.osm_id);
    root.append(el('div', 'OpenStreetMap · Geofabrik Kazakhstan', 'popup-src'));
  } else if (layer === 'regions-hit') {
    root.append(el('strong', p.name || 'Region'));
    if (p.stress != null) row(root, tr(lang, 'Baseline water stress'), tr(lang, stressLabel(Number(p.stress))));
    root.append(el('div', tr(lang, p.stress != null ? 'Water stress values are placeholders pending WRI Aqueduct zonal statistics.' : 'Administrative boundary from geoBoundaries ADM1.'), 'popup-src'));
  } else {
    root.append(el('strong', p.name || 'Map feature'));
    root.append(el('div', tr(lang, 'Select a mapped feature to inspect its available attributes.'), 'popup-src'));
  }
  return root;
}

function weatherFC(w: WeatherPoint[] | null): FC {
  if (!w) return EMPTY_FC;
  return {
    type: 'FeatureCollection',
    features: w.map((x) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [x.lon, x.lat] },
      properties: { name: x.name, y: x.yesterday, f3: x.next3, tmax: x.tmax },
    })),
  };
}
function alertFC(f: FloodPoint[] | null, lang: Lang): FC {
  if (!f) return EMPTY_FC;
  return {
    type: 'FeatureCollection',
    features: f.map((x) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [x.lon, x.lat] },
      properties: { id: x.id, name: PLACES.find((place) => place.id === x.id) ? nameOf(PLACES.find((place) => place.id === x.id)!, lang) : x.name, level: x.level, now: x.now, peak: x.peak, ratio: x.ratio },
    })),
  };
}

export default function MapView(props: Props) {
  const [riverTrace, setRiverTrace] = useState<RiverTrace | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const P = useRef(props);
  P.current = props;
  const applied = useRef<Record<string, unknown>>({});
  const popup = useRef<maplibregl.Popup | null>(null);
  const warned = useRef<Set<string>>(new Set());
  const currentBase = useRef<BasemapId>(props.basemap);
  const ready = useRef(false);

  /** add sources/layers that are missing, then push current data + visibility */
  const sync = useRef(() => {});
  sync.current = () => {
    const map = mapRef.current;
    if (!map || !ready.current) return;
    const p = P.current;
    const isDark = !!p.dark;
    const isImagery = ['satellite', 'nasa', 'terrain'].includes(p.basemap);
    const outline = p.basemap === 'outline';

    const addSource = (id: string, spec: any) => {
      if (!map.getSource(id)) map.addSource(id, spec);
    };
    const addLayer = (spec: any) => {
      if (!map.getLayer(spec.id)) map.addLayer({ ...spec, layout: { visibility: 'none', ...(spec.layout ?? {}) } });
    };
    const geo = (id: string, data: FC, attribution?: string) => {
      addSource(id, { type: 'geojson', data, ...(attribution ? { attribution } : {}) });
      if (applied.current[id] !== data) {
        (map.getSource(id) as GeoJSONSource).setData(data as any);
        applied.current[id] = data;
      }
    };

    // --- raster overlays (bottom) ---
    addSource('nasa', { type: 'raster', tiles: [nasaTiles()], tileSize: 256, maxzoom: 9, attribution: 'NASA GIBS' });
    addLayer({ id: 'nasa', type: 'raster', source: 'nasa', paint: { 'raster-opacity': 0.95 } });
    addSource('gsw', { type: 'raster', tiles: ['https://storage.googleapis.com/global-surface-water/tiles2021/occurrence/{z}/{x}/{y}.png'], tileSize: 256, maxzoom: 13, attribution: 'JRC Global Surface Water' });
    addLayer({ id: 'gsw', type: 'raster', source: 'gsw', paint: { 'raster-opacity': 0.85 } });
    addSource('flood100', { type: 'raster', tiles: [wmsTiles(ENV.glofasWms, ENV.glofasLayer)], tileSize: 256, attribution: 'Copernicus EMS GloFAS' });
    addLayer({ id: 'flood100', type: 'raster', source: 'flood100', paint: { 'raster-opacity': 0.75 } });
    if (ENV.igracLayer) {
      addSource('aquifers', { type: 'raster', tiles: [wmsTiles(ENV.igracWms, ENV.igracLayer)], tileSize: 256, attribution: 'IGRAC GGIS' });
      addLayer({ id: 'aquifers', type: 'raster', source: 'aquifers', paint: { 'raster-opacity': 0.7 } });
    }
    if (ENV.whymapLayer) {
      addSource('whymap', { type: 'raster', tiles: [wmsTiles(ENV.whymapWms, ENV.whymapLayer)], tileSize: 256, attribution: 'BGR / WHYMAP' });
      addLayer({ id: 'whymap', type: 'raster', source: 'whymap', paint: { 'raster-opacity': 0.7 } });
    }

    // --- regions: outline-mode fill, water-stress choropleth ---
    geo('regions', p.geo.regions);
    addLayer({ id: 'regions-base', type: 'fill', source: 'regions', paint: { 'fill-color': '#ffffff', 'fill-opacity': 1 } });
    addLayer({
      id: 'stress-fill', type: 'fill', source: 'regions',
      paint: { 'fill-opacity': 0.6, 'fill-color': ['interpolate', ['linear'], ['get', 'stress'], 1, '#f7e7a6', 2, '#f2b366', 3, '#dd6b3b', 4, '#a31f2d'] },
    });

    const toPmtilesUrl = (path: string) => {
      if (!path) return '';
      if (path.startsWith('http://') || path.startsWith('https://')) return `pmtiles://${path}`;
      if (typeof window !== 'undefined') {
        const base = window.location.origin;
        const clean = path.startsWith('/') ? path : `/${path}`;
        return `pmtiles://${base}${clean}`;
      }
      return `pmtiles://${path}`;
    };

    // Detailed HydroSHEDS vector tiles complement the smaller, curated
    // national GeoJSON. Add them below the exterior mask so water features
    // outside Kazakhstan stay subdued in every basemap mode.
    const hydroRiversUrl = toPmtilesUrl(ENV.hydroRivers);
    if (hydroRiversUrl) {
      addSource('hydrorivers', { type: 'vector', url: hydroRiversUrl, attribution: 'HydroRIVERS / HydroSHEDS' });
      addLayer({
        id: 'hydrorivers-line',
        type: 'line',
        source: 'hydrorivers',
        'source-layer': 'hydrorivers',
        minzoom: 3,
        paint: {
          'line-color': isImagery ? '#38bdf8' : '#1c6aa8',
          'line-width': [
            'interpolate', ['linear'], ['zoom'],
            3, ['interpolate', ['linear'], ['to-number', ['get', 'ORD_STRA']], 1, 0.35, 8, 0.95],
            5, ['interpolate', ['linear'], ['to-number', ['get', 'ORD_STRA']], 1, 0.65, 8, 1.5],
            9, ['interpolate', ['linear'], ['to-number', ['get', 'ORD_STRA']], 1, 1.0, 8, 2.4],
          ],
          'line-opacity': isImagery ? 0.92 : 0.85,
        },
      });
      addLayer({
        id: 'hydrorivers-trace',
        type: 'line',
        source: 'hydrorivers',
        'source-layer': 'hydrorivers',
        minzoom: 3,
        filter: ['==', ['get', 'HYRIV_ID'], -1],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#f2b705',
          'line-width': ['interpolate', ['linear'], ['zoom'], 3, 2.5, 6, 4, 10, 6],
          'line-opacity': 0.98,
        },
      });
      addLayer({
        id: 'hydrorivers-hit',
        type: 'line',
        source: 'hydrorivers',
        'source-layer': 'hydrorivers',
        minzoom: 3,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#ffffff',
          'line-width': ['interpolate', ['linear'], ['zoom'], 3, 7, 7, 10, 12, 13],
          'line-opacity': 0.01,
        },
      });
    }

    const hydroLakesUrl = toPmtilesUrl(ENV.hydroLakes);
    if (hydroLakesUrl) {
      addSource('hydrolakes', { type: 'vector', url: hydroLakesUrl, attribution: 'HydroLAKES / HydroSHEDS' });
      addLayer({
        id: 'lakes-fill',
        type: 'fill',
        source: 'hydrolakes',
        'source-layer': 'hydrolakes',
        minzoom: 3,
        paint: { 'fill-color': isImagery ? '#38bdf8' : '#7fb9e0', 'fill-opacity': isImagery ? 0.82 : 0.88 },
      });
      addLayer({
        id: 'lakes-line',
        type: 'line',
        source: 'hydrolakes',
        'source-layer': 'hydrolakes',
        minzoom: 3,
        paint: { 'line-color': isImagery ? '#0284c7' : '#5aa2cf', 'line-width': 0.8 },
      });
    }

    // The detailed OSM road network is bundled as local PMTiles so the
    // overlay works without external vector-tile hosts.
    const roadsUrl = toPmtilesUrl(ENV.roads);
    if (roadsUrl) {
      addSource('osm-roads', {
        type: 'vector',
        url: roadsUrl,
        attribution: '© OpenStreetMap contributors',
      });
      addLayer({
        id: 'roads-casing',
        type: 'line',
        source: 'osm-roads',
        'source-layer': 'roads',
        minzoom: 3,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': isDark ? '#020617' : 'rgba(255, 255, 255, 0.9)',
          'line-width': ['interpolate', ['linear'], ['zoom'], 4, 2.8, 7, 4.2, 10, 6],
          'line-opacity': 0.8,
        },
      });
    }
    const roadLayer = (
      id: string,
      roadClass: string,
      color: string,
      width: any,
      opacity = 0.95,
    ) => addLayer({
      id,
      type: 'line',
      source: 'osm-roads',
      'source-layer': 'roads',
      minzoom: 3,
      filter: ['==', ['get', 'class'], roadClass],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': color,
        'line-width': width,
        'line-opacity': opacity,
      },
    });
    roadLayer('roads-expressway', 'motorway', isDark ? '#fb923c' : '#ea580c', ['interpolate', ['linear'], ['zoom'], 4, 1.6, 7, 2.8, 10, 4.5]);
    roadLayer('roads-trunk', 'trunk', isDark ? '#facc15' : '#ca8a04', ['interpolate', ['linear'], ['zoom'], 4, 1.4, 7, 2.5, 10, 4]);
    roadLayer('roads-primary', 'primary', isDark ? '#cbd5e1' : '#475569', ['interpolate', ['linear'], ['zoom'], 4, 1.2, 7, 2.1, 10, 3.5]);
    roadLayer('roads-secondary', 'secondary', isDark ? '#94a3b8' : '#64748b', ['interpolate', ['linear'], ['zoom'], 5, 1, 8, 1.8, 11, 3], 0.88);
    roadLayer('roads-tertiary', 'tertiary', isDark ? '#64748b' : '#94a3b8', ['interpolate', ['linear'], ['zoom'], 7, 0.8, 10, 1.6, 13, 2.6], 0.8);
    addLayer({
      id: 'roads-hit',
      type: 'line',
      source: 'osm-roads',
      'source-layer': 'roads',
      minzoom: 3,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#ffffff', 'line-width': ['interpolate', ['linear'], ['zoom'], 3, 8, 8, 12, 12, 15], 'line-opacity': 0.01 },
    });

    // --- EXTERIOR MASK (Subdues/darkens the whole world outside Kazakhstan, matching Nigeria Atlas) ---
    if (p.geo.mask) {
      geo('mask', p.geo.mask);
      addLayer({
        id: 'mask-fill',
        type: 'fill',
        source: 'mask',
        paint: {
          'fill-color': isImagery ? '#080e18' : outline ? '#cbd5e1' : '#0f172a',
          'fill-opacity': isImagery ? 0.76 : outline ? 1 : 0.70,
        },
      });
    }

    // --- basins: 8 Official Water-Management Basins of Kazakhstan ---
    if (p.geo.basins) {
      geo('basins', p.geo.basins);
      addLayer({
        id: 'basins-fill',
        type: 'fill',
        source: 'basins',
        paint: {
          'fill-color': ['coalesce', ['get', 'color'], '#6366f1'],
          'fill-opacity': isImagery ? 0.16 : 0.12,
        },
      });
      addLayer({
        id: 'basins-line',
        type: 'line',
        source: 'basins',
        paint: {
          'line-color': ['coalesce', ['get', 'color'], '#6366f1'],
          'line-width': ['interpolate', ['linear'], ['zoom'], 3, 1.2, 7, 2.2],
          'line-dasharray': [3, 2],
        },
      });
      addLayer({
        id: 'basin-selected-fill',
        type: 'fill',
        source: 'basins',
        filter: ['==', ['get', 'name'], ''],
        paint: {
          'fill-color': '#6366f1',
          'fill-opacity': isDark ? 0.25 : 0.18,
        },
      });
      addLayer({
        id: 'basin-selected-line',
        type: 'line',
        source: 'basins',
        filter: ['==', ['get', 'name'], ''],
        paint: {
          'line-color': '#4f46e5',
          'line-width': 3.5,
        },
      });
    }

    // --- canals: Strategic inter-basin transfer canals of Kazakhstan ---
    if (p.geo.canals) {
      geo('canals', p.geo.canals);
      addLayer({
        id: 'canals-casing',
        type: 'line',
        source: 'canals',
        paint: {
          'line-color': isDark ? '#083344' : '#cffafe',
          'line-width': ['interpolate', ['linear'], ['zoom'], 3, 3.2, 7, 6.5],
          'line-opacity': 0.85,
        },
      });
      addLayer({
        id: 'canals-line',
        type: 'line',
        source: 'canals',
        paint: {
          'line-color': '#06b6d4',
          'line-width': ['interpolate', ['linear'], ['zoom'], 3, 1.8, 7, 3.8],
          'line-dasharray': [4, 2],
          'line-opacity': 0.95,
        },
      });
    }

    // --- curated GeoJSON fallback when no HydroLAKES archive is configured ---
    if (!ENV.hydroLakes) {
      geo('lakes', p.geo.lakes);
      addLayer({
        id: 'lakes-fill',
        type: 'fill',
        source: 'lakes',
        paint: {
          'fill-color': isImagery ? '#38bdf8' : '#7fb9e0',
          'fill-opacity': isImagery ? 0.82 : 0.88,
        },
      });
      addLayer({
        id: 'lakes-line',
        type: 'line',
        source: 'lakes',
        paint: {
          'line-color': isImagery ? '#0284c7' : '#5aa2cf',
          'line-width': 0.8,
        },
      });
    }

    // --- rivers: Rich, connected network strictly within Kazakhstan ---
    geo('rivers', p.geo.rivers);
    addLayer({
      id: 'rivers-line',
      type: 'line',
      source: 'rivers',
      paint: {
        'line-color': isImagery ? '#38bdf8' : '#1c6aa8',
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          3, ['interpolate', ['linear'], ['coalesce', ['to-number', ['get', 'stra']], 4], 1, 0.35, 8, 0.95],
          5, ['interpolate', ['linear'], ['coalesce', ['to-number', ['get', 'stra']], 4], 1, 0.65, 8, 1.5],
          9, ['interpolate', ['linear'], ['coalesce', ['to-number', ['get', 'stra']], 4], 1, 1.0, 8, 2.4],
        ] as any,
        'line-opacity': isImagery ? 0.92 : 0.85,
      },
    });

    // Regional internal borders
    const casingWidth = isImagery || isDark
      ? ['interpolate', ['linear'], ['zoom'], 3, 14, 5, 18, 7, 24, 10, 32]
      : outline
      ? ['interpolate', ['linear'], ['zoom'], 3, 6.5, 6, 8.5, 9, 11]
      : ['interpolate', ['linear'], ['zoom'], 3, 11, 5, 14, 7, 18, 10, 24];

    const lineWidth = isImagery || isDark
      ? ['interpolate', ['linear'], ['zoom'], 3, 8.5, 5, 12, 7, 16, 10, 22]
      : outline
      ? ['interpolate', ['linear'], ['zoom'], 3, 3.8, 6, 5.2, 9, 7.5]
      : ['interpolate', ['linear'], ['zoom'], 3, 7, 5, 9, 7, 12, 10, 16];

    const casingColor = isImagery || isDark
      ? 'rgba(0, 0, 0, 0.95)'
      : outline
      ? 'rgba(15, 42, 51, 0.35)'
      : 'rgba(15, 42, 51, 0.85)';

    addLayer({
      id: 'regions-line',
      type: 'line',
      source: 'regions',
      paint: {
        'line-color': isImagery ? 'rgba(255, 255, 255, 0.85)' : outline ? '#cbd5e1' : '#5a8296',
        'line-width': isImagery ? ['interpolate', ['linear'], ['zoom'], 3, 1.5, 7, 2.4] : ['interpolate', ['linear'], ['zoom'], 3, 1.0, 8, 2.0],
      },
    });
    addLayer({
      id: 'region-selected-fill',
      type: 'fill',
      source: 'regions',
      filter: ['==', ['get', 'name'], ''],
      paint: {
        'fill-color': isDark ? '#38bdf8' : '#0284c7',
        'fill-opacity': isDark ? 0.22 : 0.16,
      },
    });
    addLayer({
      id: 'region-selected-line',
      type: 'line',
      source: 'regions',
      filter: ['==', ['get', 'name'], ''],
      paint: {
        'line-color': isDark ? '#38bdf8' : '#0284c7',
        'line-width': 3,
        'line-dasharray': [3, 1],
      },
    });

    // --- NATIONAL BORDER (extra thick, bold, prominent across Satellite, Terrain, NASA daily) ---
    // Placed above hydrography layers so border is never clipped by lakes or rivers
    const borderData = p.geo.border?.features?.length ? p.geo.border : p.geo.regions;
    geo('border', borderData);
    addLayer({
      id: 'border-glow',
      type: 'line',
      source: 'border',
      paint: {
        'line-color': '#000000',
        'line-width': ['interpolate', ['linear'], ['zoom'], 3, 20, 5, 26, 7, 34, 10, 44],
        'line-blur': 4,
        'line-opacity': 0.7,
      },
      layout: { 'line-cap': 'round', 'line-join': 'round' },
    });
    addLayer({
      id: 'border-casing',
      type: 'line',
      source: 'border',
      paint: {
        'line-color': casingColor,
        'line-width': casingWidth as any,
        'line-opacity': 0.95,
      },
      layout: { 'line-cap': 'round', 'line-join': 'round' },
    });
    addLayer({
      id: 'border-line',
      type: 'line',
      source: 'border',
      paint: {
        'line-color': '#22c55e',
        'line-width': lineWidth as any,
        'line-opacity': 1,
      },
      layout: { 'line-cap': 'round', 'line-join': 'round' },
    });

    if (p.geo.labels) {
      geo('labels', p.geo.labels);
      addLayer({
        id: 'region-labels',
        type: 'symbol',
        source: 'labels',
        layout: {
          'text-field': ['coalesce', ['get', `name_${p.lang}`], ['get', 'name']],
          'text-font': ['Open Sans Bold', 'Noto Sans Bold', 'Open Sans Regular'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 3, 9, 6, 12, 9, 15],
          'text-letter-spacing': 0.08,
          'text-transform': 'uppercase',
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': isImagery ? '#ffffff' : '#1e293b',
          'text-halo-color': isImagery ? 'rgba(0, 0, 0, 0.95)' : '#ffffff',
          'text-halo-width': isImagery ? 2.5 : 2.0,
        },
      });
    }

    // --- point layers ---
    geo('floods', PAST_FLOODS);
    addLayer({ id: 'floods-circle', type: 'circle', source: 'floods', paint: { 'circle-color': '#d86a4a', 'circle-opacity': 0.55, 'circle-radius': ['get', 'r'], 'circle-stroke-color': '#a8432a', 'circle-stroke-width': 1.5 } });
    geo('alerts', alertFC(p.flood, p.lang));
    addLayer({ id: 'alerts-halo', type: 'circle', source: 'alerts', paint: { 'circle-radius': 14, 'circle-opacity': 0.25, 'circle-color': ['match', ['get', 'level'], 'warning', '#c62828', 'watch', '#e0a100', 'nodata', '#9aa5ab', '#4a9d6a'] } });
    addLayer({ id: 'alerts-circle', type: 'circle', source: 'alerts', paint: { 'circle-radius': 7, 'circle-color': ['match', ['get', 'level'], 'warning', '#c62828', 'watch', '#e0a100', 'nodata', '#9aa5ab', '#4a9d6a'], 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 } });
    geo('rain', weatherFC(p.weather));
    addLayer({ id: 'rain-y', type: 'circle', source: 'rain', paint: { 'circle-color': '#3a7bd5', 'circle-opacity': 0.55, 'circle-stroke-color': '#1d4f9c', 'circle-stroke-width': 1, 'circle-radius': ['interpolate', ['linear'], ['get', 'y'], 0, 3, 5, 10, 25, 22] } });
    addLayer({ id: 'rain-3d', type: 'circle', source: 'rain', paint: { 'circle-color': '#7a4fd1', 'circle-opacity': 0.5, 'circle-stroke-color': '#4d2a9c', 'circle-stroke-width': 1, 'circle-radius': ['interpolate', ['linear'], ['get', 'f3'], 0, 3, 10, 11, 40, 24] } });

    geo('places', placesToGeoJSON(p.places, p.lang));
    addLayer({
      id: 'places-circle', type: 'circle', source: 'places',
      paint: {
        'circle-color': ['match', ['get', 'type'], ...TYPE_COLORS, '#888'] as any,
        'circle-radius': ['get', 'r'],
        'circle-opacity': ['case', ['==', ['get', 'approx'], 1], 0.5, 0.9],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1.5,
      },
    });
    addLayer({ id: 'places-selected', type: 'circle', source: 'places', filter: ['==', ['get', 'id'], ''], paint: { 'circle-radius': 17, 'circle-color': 'rgba(0,0,0,0)', 'circle-stroke-color': '#f2b705', 'circle-stroke-width': 3 } });

    // Click hit target for regions
    addLayer({ id: 'regions-hit', type: 'fill', source: 'regions', paint: { 'fill-opacity': 0 } });

    // --- visibility & basemap dynamic styling ---
    // A rendered layer can be shared by a visible toggle and a legacy alias
    // (for example, `rivers` and `hydrorivers`). Combine those toggles before
    // setting visibility so an inactive alias cannot turn an active layer off.
    const visibilityByLayer = new Map<string, boolean>();
    (Object.keys(LAYER_MAP) as LayerId[]).forEach((id) => {
      LAYER_MAP[id].forEach((layerId) => {
        visibilityByLayer.set(layerId, (visibilityByLayer.get(layerId) ?? false) || p.layers.has(id));
      });
    });
    visibilityByLayer.forEach((on, layerId) => {
      if (map.getLayer(layerId)) map.setLayoutProperty(layerId, 'visibility', on ? 'visible' : 'none');
    });

    // Background color
    if (map.getLayer('bg')) {
      map.setPaintProperty('bg', 'background-color', isDark ? '#081318' : '#dfe9ec');
    }

    // Toggle basemap raster layers (Map mode switches to Esri World Dark Gray Canvas in dark mode - NO API key needed)
    const showMapDark = isDark && p.basemap === 'map';
    const showMapLight = !isDark && p.basemap === 'map';
    if (map.getLayer('base-osm')) map.setLayoutProperty('base-osm', 'visibility', showMapLight ? 'visible' : 'none');
    if (map.getLayer('base-esri-dark')) map.setLayoutProperty('base-esri-dark', 'visibility', showMapDark ? 'visible' : 'none');
    if (map.getLayer('base-satellite')) map.setLayoutProperty('base-satellite', 'visibility', p.basemap === 'satellite' ? 'visible' : 'none');
    if (map.getLayer('base-terrain')) map.setLayoutProperty('base-terrain', 'visibility', p.basemap === 'terrain' ? 'visible' : 'none');
    if (map.getLayer('base-nasa')) map.setLayoutProperty('base-nasa', 'visibility', p.basemap === 'nasa' ? 'visible' : 'none');

    // Outline mode fill: territory for Kazakhstan
    if (map.getLayer('regions-base')) {
      map.setLayoutProperty('regions-base', 'visibility', outline ? 'visible' : 'none');
      map.setPaintProperty('regions-base', 'fill-color', isDark ? '#12262e' : '#ffffff');
    }

    // Exterior mask dynamic styling across basemaps and dark mode
    if (map.getLayer('mask-fill')) {
      const maskColor = isDark ? '#04070a' : isImagery ? '#080e18' : outline ? '#cbd5e1' : '#0f172a';
      const maskOpacity = isDark ? 0.82 : isImagery ? 0.76 : outline ? 1 : 0.70;
      map.setPaintProperty('mask-fill', 'fill-color', maskColor);
      map.setPaintProperty('mask-fill', 'fill-opacity', maskOpacity);
    }

    // Rivers line color & opacity (glows luminous cyan in dark mode for maximum contrast)
    if (map.getLayer('rivers-line')) {
      const riverColor = isDark || isImagery ? '#38bdf8' : '#1c6aa8';
      map.setPaintProperty('rivers-line', 'line-color', riverColor);
      map.setPaintProperty('rivers-line', 'line-opacity', isDark || isImagery ? 0.95 : 0.85);
    }
    if (map.getLayer('hydrorivers-line')) {
      map.setPaintProperty('hydrorivers-line', 'line-color', isDark || isImagery ? '#38bdf8' : '#1c6aa8');
      map.setPaintProperty('hydrorivers-line', 'line-opacity', isDark || isImagery ? 0.95 : 0.85);
    }

    // Keep the OSM road overlay legible after basemap and theme changes.
    const roadColors: Record<string, string> = {
      'roads-casing': isDark ? '#020617' : 'rgba(255, 255, 255, 0.9)',
      'roads-expressway': isDark ? '#fb923c' : '#ea580c',
      'roads-trunk': isDark ? '#facc15' : '#ca8a04',
      'roads-primary': isDark ? '#cbd5e1' : '#475569',
      'roads-secondary': isDark ? '#94a3b8' : '#64748b',
      'roads-tertiary': isDark ? '#64748b' : '#94a3b8',
    };
    Object.entries(roadColors).forEach(([id, color]) => {
      if (map.getLayer(id)) map.setPaintProperty(id, 'line-color', color);
    });

    // Lakes fill & line
    if (map.getLayer('lakes-fill')) {
      const lakeColor = isDark ? '#0284c7' : isImagery ? '#38bdf8' : '#7fb9e0';
      map.setPaintProperty('lakes-fill', 'fill-color', lakeColor);
      map.setPaintProperty('lakes-fill', 'fill-opacity', isDark ? 0.85 : isImagery ? 0.82 : 0.88);
    }
    if (map.getLayer('lakes-line')) {
      map.setPaintProperty('lakes-line', 'line-color', isDark || isImagery ? '#38bdf8' : '#5aa2cf');
    }

    // National border outline: ALWAYS visible and extra thick across Satellite, Terrain, NASA daily
    if (map.getLayer('border-glow')) {
      map.setLayoutProperty('border-glow', 'visibility', isImagery || isDark ? 'visible' : 'none');
    }
    if (map.getLayer('border-casing')) {
      map.setLayoutProperty('border-casing', 'visibility', 'visible');
      map.setPaintProperty('border-casing', 'line-color', casingColor);
      map.setPaintProperty('border-casing', 'line-width', casingWidth);
    }
    if (map.getLayer('border-line')) {
      map.setLayoutProperty('border-line', 'visibility', 'visible');
      map.setPaintProperty('border-line', 'line-color', '#22c55e');
      map.setPaintProperty('border-line', 'line-width', lineWidth);
    }

    // Regional internal borders & labels: visible across all basemaps or when a region is selected
    const showRegions = p.layers.has('regions') || outline || isImagery || !!p.region;
    if (map.getLayer('regions-line')) {
      map.setLayoutProperty('regions-line', 'visibility', showRegions ? 'visible' : 'none');
      map.setPaintProperty(
        'regions-line',
        'line-color',
        isDark ? 'rgba(148, 163, 184, 0.45)' : isImagery ? 'rgba(255, 255, 255, 0.85)' : outline ? '#cbd5e1' : '#5a8296'
      );
      map.setPaintProperty(
        'regions-line',
        'line-width',
        isImagery || isDark ? ['interpolate', ['linear'], ['zoom'], 3, 1.2, 7, 2.2] : ['interpolate', ['linear'], ['zoom'], 3, 1.0, 8, 2.0]
      );
    }
    if (map.getLayer('region-labels')) {
      map.setLayoutProperty('region-labels', 'visibility', showRegions ? 'visible' : 'none');
      map.setPaintProperty('region-labels', 'text-color', isDark || isImagery ? '#ffffff' : '#1e293b');
      map.setPaintProperty('region-labels', 'text-halo-color', isDark ? 'rgba(8, 19, 24, 0.95)' : isImagery ? 'rgba(0, 0, 0, 0.95)' : '#ffffff');
      map.setPaintProperty('region-labels', 'text-halo-width', isDark || isImagery ? 2.5 : 2.0);
    }

    // Selected region highlight filter & visibility
    if (map.getLayer('region-selected-fill') && map.getLayer('region-selected-line')) {
      if (p.region) {
        const matches = [p.region, `${p.region} Region`, ...(REGION_SHAPE_NAMES[p.region] || [])];
        const matchFilter: any = ['match', ['get', 'name'], matches, true, false];
        map.setFilter('region-selected-fill', matchFilter);
        map.setFilter('region-selected-line', matchFilter);
        map.setLayoutProperty('region-selected-fill', 'visibility', 'visible');
        map.setLayoutProperty('region-selected-line', 'visibility', 'visible');
      } else {
        map.setLayoutProperty('region-selected-fill', 'visibility', 'none');
        map.setLayoutProperty('region-selected-line', 'visibility', 'none');
      }
    }

    // Selected basin highlight filter & visibility
    if (map.getLayer('basin-selected-fill') && map.getLayer('basin-selected-line')) {
      if (p.basin) {
        const basinTarget = `${p.basin} Basin`;
        const matchFilter: any = ['==', ['get', 'name'], basinTarget];
        map.setFilter('basin-selected-fill', matchFilter);
        map.setFilter('basin-selected-line', matchFilter);
        map.setLayoutProperty('basin-selected-fill', 'visibility', 'visible');
        map.setLayoutProperty('basin-selected-line', 'visibility', 'visible');
      } else {
        map.setLayoutProperty('basin-selected-fill', 'visibility', 'none');
        map.setLayoutProperty('basin-selected-line', 'visibility', 'none');
      }
    }

    ['places-circle', 'places-selected'].forEach((l) => map.setLayoutProperty(l, 'visibility', 'visible'));
    if (map.getLayer('regions-hit')) {
      map.setLayoutProperty('regions-hit', 'visibility', p.layers.has('regions') ? 'visible' : 'none');
    }
    map.setFilter('places-selected', ['==', ['get', 'id'], p.selectedId ?? '']);
  };

  // ---- init once ----
  useEffect(() => {
    if (!box.current) return;
    if (!protocolReady) {
      maplibregl.addProtocol('pmtiles', new Protocol().tile);
      protocolReady = true;
    }
    const map = new maplibregl.Map({
      container: box.current,
      style: getInitialMapStyle(P.current.basemap),
      center: [67, 48],
      zoom: 3.9,
      minZoom: 2.5,
      maxZoom: 14,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

    const onMapReady = () => {
      if (ready.current) return;
      ready.current = true;
      applied.current = {};
      sync.current();

      // If initial region is present on map load, zoom to it
      if (P.current.region && REGION_BOUNDS[P.current.region]) {
        const b = REGION_BOUNDS[P.current.region];
        const isCity = P.current.region.includes('city') || P.current.region === 'Astana' || P.current.region === 'Almaty';
        map.fitBounds([[b[0], b[1]], [b[2], b[3]]], {
          padding: { top: 60, bottom: 60, left: 60, right: 60 },
          duration: 800,
          maxZoom: isCity ? 11 : 8.5,
        });
      }
    };

    if (map.loaded() || map.isStyleLoaded()) {
      onMapReady();
    } else {
      map.on('load', onMapReady);
      map.on('styledata', () => {
        if (map.isStyleLoaded()) onMapReady();
      });
    }

    map.on('error', (e: any) => {
      const status = e?.error?.status;
      if (status === 404 || status === 204) return;
      const hit = e?.sourceId ? SOURCE_TO_LAYER[e.sourceId] : undefined;
      if (hit && P.current.layers.has(hit.id) && !warned.current.has(hit.id)) {
        warned.current.add(hit.id);
        P.current.onNotice(`${tr(P.current.lang, hit.label)} ${tr(P.current.lang, 'did not load.')}`);
      }
    });

    const visibleInteractiveLayers = () => INTERACTIVE.filter((l) => map.getLayer(l) && map.getLayoutProperty(l, 'visibility') !== 'none');

    map.on('mousemove', (e) => {
      const layers = visibleInteractiveLayers();
      const f = map.queryRenderedFeatures(e.point, { layers }).filter((x) => x.layer.id !== 'regions-hit' && x.layer.id !== 'stress-fill');
      map.getCanvas().style.cursor = f.length ? 'pointer' : '';
    });

    map.on('click', (e) => {
      const layers = visibleInteractiveLayers();
      const hits = map.queryRenderedFeatures(e.point, { layers }).filter((x) => x.layer.id !== 'stress-fill');
      const f = hits.find((x) => x.layer.id === 'places-circle')
        ?? hits.find((x) => ROAD_INTERACTIVE.includes(x.layer.id))
        ?? hits.find((x) => x.layer.id === 'lakes-fill')
        ?? hits.find((x) => x.layer.id === 'hydrorivers-line' || x.layer.id === 'hydrorivers-hit')
        ?? hits.find((x) => x.layer.id === 'rivers-line')
        ?? hits[0];
      if (!f) return;
      if (f.layer.id === 'places-circle') {
        P.current.onSelect(String(f.properties?.id));
        return;
      }
      P.current.onSelect(null);
      popup.current?.remove();
      const trace = (direction: RiverTrace['direction']) => {
        const properties = f.properties ?? {};
        const mainRiver = Number(properties.MAIN_RIV);
        const reachId = Number(properties.HYRIV_ID);
        const distanceToOutlet = Number(properties.DIST_DN_KM);
        if (!Number.isFinite(mainRiver) || !Number.isFinite(reachId) || !Number.isFinite(distanceToOutlet)) {
          P.current.onNotice(tr(P.current.lang, 'This river line has no HydroRIVERS connectivity data. Select a detailed River network reach to trace it.'));
          return;
        }
        const traceLayer = 'hydrorivers-trace';
        if (!map.getLayer(traceLayer)) return;
        const distanceFilter = direction === 'upstream' ? '>=' : '<=';
        map.setFilter(traceLayer, [
          'all',
          ['==', ['to-number', ['get', 'MAIN_RIV']], mainRiver],
          [distanceFilter, ['to-number', ['get', 'DIST_DN_KM']], distanceToOutlet],
        ] as any);
        map.setPaintProperty(traceLayer, 'line-color', direction === 'upstream' ? '#f2b705' : '#f97316');
        map.setLayoutProperty(traceLayer, 'visibility', 'visible');
        const nextTrace = { direction, mainRiver, reachId };
        setRiverTrace(nextTrace);
        popup.current?.remove();
        map.fitBounds([[46, 40], [88, 56]], {
          padding: { top: 155, bottom: 55, left: 50, right: 50 },
          duration: 900,
          maxZoom: 5.5,
        });
      };
      popup.current = new maplibregl.Popup({ maxWidth: '300px', offset: 10 })
        .setLngLat(e.lngLat)
        .setDOMContent(popupEl(P.current.lang, f.layer.id, f.properties ?? {}, trace))
        .addTo(map);
    });

    return () => {
      popup.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ---- react to prop changes ----
  useEffect(() => { sync.current(); }, [props.layers, props.places, props.lang, props.geo, props.weather, props.flood, props.selectedId, props.dark, props.region, props.basin]);

  useEffect(() => {
    currentBase.current = props.basemap;
    sync.current();
  }, [props.basemap]);

  useEffect(() => {
    if (props.visible) setTimeout(() => mapRef.current?.resize(), 30);
  }, [props.visible]);

  // ---- fly to region / basin when selected in dropdown ----
  const prevRegion = useRef<string | undefined>(props.region);
  const prevBasin = useRef<string | undefined>(props.basin);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const r = props.region;
    const b = props.basin;

    const regionChanged = prevRegion.current !== r;
    const basinChanged = prevBasin.current !== b;
    prevRegion.current = r;
    prevBasin.current = b;

    if (!regionChanged && !basinChanged) return;

    if (r) {
      const bounds = REGION_BOUNDS[r];
      if (bounds) {
        const isCity = r.includes('city') || r === 'Astana' || r === 'Almaty';
        map.fitBounds(
          [[bounds[0], bounds[1]], [bounds[2], bounds[3]]],
          {
            padding: { top: 60, bottom: 60, left: 60, right: 60 },
            duration: 1200,
            maxZoom: isCity ? 11 : 8.5,
          }
        );
      }
    } else if (b) {
      const bounds = BASIN_BOUNDS[b];
      if (bounds) {
        map.fitBounds(
          [[bounds[0], bounds[1]], [bounds[2], bounds[3]]],
          {
            padding: { top: 60, bottom: 60, left: 60, right: 60 },
            duration: 1200,
            maxZoom: 7.5,
          }
        );
      }
    } else if (regionChanged || basinChanged) {
      map.flyTo({
        center: [67, 48],
        zoom: 3.9,
        speed: 1.0,
      });
    }
  }, [props.region, props.basin]);

  // ---- selection: fly to feature framed beside the detail drawer ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    popup.current?.remove();
    if (!props.selectedId) return;
    const place = props.places.find((x) => x.id === props.selectedId);
    if (!place) return;
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 900;
    map.flyTo({
      center: [place.lon, place.lat],
      zoom: Math.max(map.getZoom(), TYPE_ZOOM[place.type] ?? 7),
      speed: 1.2,
      padding: isMobile
        ? { top: 60, bottom: 280, left: 20, right: 20 }
        : { top: 80, bottom: 40, left: 40, right: 460 },
    });
  }, [props.selectedId]);

  const clearRiverTrace = () => {
    const map = mapRef.current;
    if (map?.getLayer('hydrorivers-trace')) {
      map.setFilter('hydrorivers-trace', ['==', ['get', 'HYRIV_ID'], -1]);
      map.setLayoutProperty('hydrorivers-trace', 'visibility', 'none');
    }
    setRiverTrace(null);
  };

  return (
    <>
      <div ref={box} className="map-canvas" aria-label={tr(props.lang, 'Map of Kazakhstan water resources')} />
      {riverTrace && (
        <div className="river-trace-control" role="status">
          <span className={`river-trace-swatch ${riverTrace.direction}`} />
          <span>{tr(props.lang, riverTrace.direction === 'upstream' ? 'Upstream network' : 'Downstream channel')} · {tr(props.lang, 'reach')} {riverTrace.reachId}</span>
          <button type="button" onClick={clearRiverTrace}>{tr(props.lang, 'Clear trace')}</button>
        </div>
      )}
    </>
  );
}
