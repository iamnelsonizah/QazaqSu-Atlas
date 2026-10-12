import { EMPTY_FC, type FC } from './types';
import { stressScore } from './stress';

const BBOX = { w: 46.3, s: 40.4, e: 87.5, n: 55.6 };

function inBox(coords: any): boolean {
  if (typeof coords[0] === 'number') {
    const [x, y] = coords as number[];
    return x >= BBOX.w && x <= BBOX.e && y >= BBOX.s && y <= BBOX.n;
  }
  for (const c of coords) if (inBox(c)) return true;
  return false;
}

async function load(local: string, remote?: string, filter?: (f: any) => boolean): Promise<FC> {
  const urls = [local, remote].filter(Boolean) as string[];
  for (const url of urls) {
    try {
      const r = await fetch(url);
      if (!r.ok) continue;
      const j = (await r.json()) as FC;
      if (!j.features) continue;
      return filter ? { ...j, features: j.features.filter(filter) } : j;
    } catch {
      /* try next */
    }
  }
  return EMPTY_FC;
}

const GB = 'https://raw.githubusercontent.com/wmgeolab/geoBoundaries/main/releaseData/gbOpen/KAZ/ADM1/geoBoundaries-KAZ-ADM1_simplified.geojson';
const NE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson';

export const REGION_LABELS_FC: FC = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { id: 'KZ-PAV', name_en: 'PAVLODAR', name_kk: 'ПАВЛОДАР', name_ru: 'ПАВЛОДАР', name: 'PAVLODAR' }, geometry: { type: 'Point', coordinates: [76.372, 52.236] } },
    { type: 'Feature', properties: { id: 'KZ-ZHA', name_en: 'JAMBYL', name_kk: 'ЖАМБЫЛ', name_ru: 'ЖАМБЫЛ', name: 'JAMBYL' }, geometry: { type: 'Point', coordinates: [72.445, 44.164] } },
    { type: 'Feature', properties: { id: 'KZ-KUS', name_en: 'KOSTANAY', name_kk: 'ҚОСТАНАЙ', name_ru: 'КОСТАНАЙ', name: 'KOSTANAY' }, geometry: { type: 'Point', coordinates: [64.043, 51.444] } },
    { type: 'Feature', properties: { id: 'KZ-MAN', name_en: 'MANGYSTAU', name_kk: 'МАҢҒЫСТАУ', name_ru: 'МАНГИСТАУ', name: 'MANGYSTAU' }, geometry: { type: 'Point', coordinates: [53.374, 43.883] } },
    { type: 'Feature', properties: { id: 'KZ-KAR', name_en: 'KARAGANDA', name_kk: 'ҚАРАҒАНДЫ', name_ru: 'КАРАГАНДА', name: 'KARAGANDA' }, geometry: { type: 'Point', coordinates: [70.326, 48.655] } },
    { type: 'Feature', properties: { id: 'KZ-KZY', name_en: 'KYZYLORDA', name_kk: 'ҚЫЗЫЛОРДА', name_ru: 'КЫЗЫЛОРДА', name: 'KYZYLORDA' }, geometry: { type: 'Point', coordinates: [63.545, 45.075] } },
    { type: 'Feature', properties: { id: 'KZ-VOS', name_en: 'EAST KAZAKHSTAN', name_kk: 'ШЫҒЫС ҚАЗАҚСТАН', name_ru: 'ВОСТОЧНЫЙ КАЗАХСТАН', name: 'EAST KAZAKHSTAN' }, geometry: { type: 'Point', coordinates: [81.953, 48.622] } },
    { type: 'Feature', properties: { id: 'KZ-AKT', name_en: 'AKTOBE', name_kk: 'АҚТӨБЕ', name_ru: 'АКТОБЕ', name: 'AKTOBE' }, geometry: { type: 'Point', coordinates: [58.954, 48.247] } },
    { type: 'Feature', properties: { id: 'KZ-ATY', name_en: 'ATYRAU', name_kk: 'АТЫРАУ', name_ru: 'АТЫРАУ', name: 'ATYRAU' }, geometry: { type: 'Point', coordinates: [51.761, 47.626] } },
    { type: 'Feature', properties: { id: 'KZ-YUZ', name_en: 'TURKISTAN', name_kk: 'ТҮРКІСТАН', name_ru: 'ТУРКЕСТАН', name: 'TURKISTAN' }, geometry: { type: 'Point', coordinates: [68.471, 43.285] } },
    { type: 'Feature', properties: { id: 'KZ-AKM', name_en: 'AKMOLA', name_kk: 'АҚМОЛА', name_ru: 'АКМОЛА', name: 'AKMOLA' }, geometry: { type: 'Point', coordinates: [69.806, 51.862] } },
    { type: 'Feature', properties: { id: 'KZ-ALM', name_en: 'ALMATY REGION', name_kk: 'АЛМАТЫ ОБЛЫСЫ', name_ru: 'АЛМАТИНСКАЯ ОБЛ.', name: 'ALMATY REGION' }, geometry: { type: 'Point', coordinates: [78.155, 44.771] } },
    { type: 'Feature', properties: { id: 'KZ-SEV', name_en: 'NORTH KAZAKHSTAN', name_kk: 'СОЛТҮСТІК ҚАЗАҚСТАН', name_ru: 'СЕВЕРНЫЙ КАЗАХСТАН', name: 'NORTH KAZAKHSTAN' }, geometry: { type: 'Point', coordinates: [70.000, 53.844] } },
    { type: 'Feature', properties: { id: 'KZ-ALA', name_en: 'ALMATY CITY', name_kk: 'АЛМАТЫ', name_ru: 'АЛМАТЫ', name: 'ALMATY CITY' }, geometry: { type: 'Point', coordinates: [76.953, 43.218] } },
    { type: 'Feature', properties: { id: 'KZ-ZAP', name_en: 'WEST KAZAKHSTAN', name_kk: 'БАТЫС ҚАЗАҚСТАН', name_ru: 'ЗАПАДНЫЙ КАЗАХСТАН', name: 'WEST KAZAKHSTAN' }, geometry: { type: 'Point', coordinates: [50.529, 49.848] } },
    { type: 'Feature', properties: { id: 'KZ-AST', name_en: 'ASTANA', name_kk: 'АСТАНА', name_ru: 'АСТАНА', name: 'ASTANA' }, geometry: { type: 'Point', coordinates: [71.504, 51.176] } },
  ],
};

export async function loadRegions(): Promise<FC> {
  const fc = await load('/data/kz-adm1.geojson', GB);
  return {
    ...fc,
    features: fc.features.map((f) => {
      const name = String((f.properties as any)?.shapeName ?? '');
      return { ...f, properties: { ...(f.properties ?? {}), name, stress: stressScore(name) } };
    }),
  };
}
export const loadRivers = () =>
  load('/data/kz-rivers.geojson', '');
export const loadLakes = () =>
  load('/data/kz-lakes.geojson', '');

export const loadBorder = () =>
  load('/data/kz-border.geojson', '');

export const loadMask = () =>
  load('/data/kz-mask.geojson', '');

export const loadBasins = () =>
  load('/data/kz-basins.geojson', '');

export const loadCanals = () =>
  load('/data/kz-canals.geojson', '');

export async function loadRegionLabels(): Promise<FC> {
  const fc = await load('/data/kz-region-labels.geojson', '');
  return fc.features.length ? fc : REGION_LABELS_FC;
}
