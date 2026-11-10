// Shareable links: the parts of the atlas a person would want to send someone,
// kept in the page URL. Every value is validated, so an edited or out-of-date
// link falls back to defaults instead of breaking the page.
//
//   ?place=dam-kapchagay          selected place (opens its details)
//   &tab=flood                    section (omitted for the map)
//   &v=43.920,77.104,8.50         map view: lat, lon, zoom
//   &layers=rivers,lakes,regions  map layers (omitted when they are the defaults; "none" for none)
//   &base=satellite               basemap (omitted for the default map)
//   &region=Almaty  &basin=Ertis  &q=balkhash   list filters
//   &lang=kk                      read only: lets a link open in Kazakh or Russian

import { BASEMAPS, type BasemapId } from './basemaps';
import { DEFAULT_LAYERS, LAYERS, type LayerId } from './layers';
import { PLACES, REGIONS } from './places';
import { BASINS, type Lang } from './types';

export interface MapViewState { lat: number; lon: number; zoom: number }

export interface UrlState {
  tab?: string;
  place?: string;
  view?: MapViewState;
  layers?: LayerId[];
  base?: BasemapId;
  region?: string;
  basin?: string;
  q?: string;
  lang?: Lang;
}

const LAYER_IDS = new Set(LAYERS.filter((l) => !l.needs).map((l) => l.id));
const BASEMAP_IDS = new Set(BASEMAPS.map((b) => b.id));
const PLACE_IDS = new Set(PLACES.map((p) => p.id));
const REGION_SET = new Set<string>(REGIONS);
const BASIN_SET = new Set<string>(BASINS);

function parseView(raw: string | null): MapViewState | undefined {
  if (!raw) return undefined;
  const [lat, lon, zoom] = raw.split(',').map(Number);
  if (![lat, lon, zoom].every(Number.isFinite)) return undefined;
  if (Math.abs(lat) > 85 || Math.abs(lon) > 180 || zoom < 0 || zoom > 22) return undefined;
  return { lat, lon, zoom };
}

export function readUrlState(search: string, tabIds: readonly string[]): UrlState {
  const p = new URLSearchParams(search);
  const out: UrlState = {};
  const tab = p.get('tab');
  if (tab && tabIds.includes(tab)) out.tab = tab;
  const place = p.get('place');
  if (place && PLACE_IDS.has(place)) out.place = place;
  out.view = parseView(p.get('v'));
  const layers = p.get('layers');
  if (layers != null) {
    out.layers = layers === 'none' ? [] : (layers.split(',').filter((id) => LAYER_IDS.has(id as LayerId)) as LayerId[]);
  }
  const base = p.get('base');
  if (base && BASEMAP_IDS.has(base as BasemapId)) out.base = base as BasemapId;
  const region = p.get('region');
  if (region && REGION_SET.has(region)) out.region = region;
  const basin = p.get('basin');
  if (basin && BASIN_SET.has(basin)) out.basin = basin;
  const q = p.get('q');
  if (q) out.q = q.slice(0, 100);
  const lang = p.get('lang');
  if (lang === 'en' || lang === 'kk' || lang === 'ru') out.lang = lang;
  return out;
}

const sameLayers = (a: Set<LayerId>, b: readonly LayerId[]) => a.size === b.length && b.every((id) => a.has(id));

export function buildSearch(s: {
  tab: string;
  place: string | null;
  view: MapViewState | null;
  layers: Set<LayerId>;
  base: BasemapId;
  region: string;
  basin: string;
  q: string;
}): string {
  const p = new URLSearchParams();
  if (s.place) p.set('place', s.place);
  if (s.tab !== 'map') p.set('tab', s.tab);
  if (s.view) p.set('v', `${s.view.lat.toFixed(3)},${s.view.lon.toFixed(3)},${s.view.zoom.toFixed(2)}`);
  if (!sameLayers(s.layers, DEFAULT_LAYERS)) p.set('layers', s.layers.size ? Array.from(s.layers).join(',') : 'none');
  if (s.base !== 'map') p.set('base', s.base);
  if (s.region) p.set('region', s.region);
  if (s.basin) p.set('basin', s.basin);
  if (s.q.trim()) p.set('q', s.q.trim());
  const str = p.toString().replace(/%2C/g, ',');
  return str ? `?${str}` : '';
}
