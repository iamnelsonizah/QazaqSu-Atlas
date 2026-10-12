import fs from 'node:fs';
import zlib from 'node:zlib';
import { PMTiles } from 'pmtiles';
import Pbf from 'pbf';
import { VectorTile } from '@mapbox/vector-tile';

console.log('=== Building Kazakhstan Atlas Hydrography ===');

// 1. Boundary & In-Polygon Geometry
const border = JSON.parse(fs.readFileSync('public/data/kz-border.geojson'));
const rings = border.features[0].geometry.coordinates;
const mainRing = rings[0];

function inPoly(x, y, poly = mainRing) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function inKazakhstan(x, y) {
  for (const r of rings) if (inPoly(x, y, r)) return true;
  return false;
}

function clipLine(coords) {
  const segments = [];
  let current = [];
  for (const pt of coords) {
    if (inKazakhstan(pt[0], pt[1])) {
      current.push([Math.round(pt[0] * 10000) / 10000, Math.round(pt[1] * 10000) / 10000]);
    } else {
      if (current.length >= 2) segments.push(current);
      current = [];
    }
  }
  if (current.length >= 2) segments.push(current);
  return segments;
}

// 2. Build kz-mask.geojson (World polygon with Kazakhstan cut out)
console.log('1. Building kz-mask.geojson...');
const worldOuter = [
  [-180.0, -89.9],
  [180.0, -89.9],
  [180.0, 89.9],
  [-180.0, 89.9],
  [-180.0, -89.9]
];
const maskFC = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    properties: { name: 'Kazakhstan Mask' },
    geometry: {
      type: 'Polygon',
      coordinates: [worldOuter, ...rings]
    }
  }]
};
fs.writeFileSync('public/data/kz-mask.geojson', JSON.stringify(maskFC));
console.log('   Done: kz-mask.geojson created.');

// 3. Build kz-basins.geojson (8 Official Water-Management Basins)
console.log('2. Building kz-basins.geojson...');
const adm1 = JSON.parse(fs.readFileSync('public/data/kz-adm1.geojson'));

const BASIN_DEFS = {
  'ertis': {
    name: 'Ertis Basin',
    name_en: 'Ertis Basin',
    name_kk: 'Ертіс алабы',
    name_ru: 'Иртышский бассейн',
    area: '316,500 km²',
    rivers: 'Irtysh (Ertis), Bukhtarma, Uba, Ulba, Char',
    key_waters: 'Lake Zaysan, Lake Markakol, Bukhtarma & Shulbinsk Reservoirs',
    hq: 'Semey / Oskemen',
    color: '#6366f1'
  },
  'shu-talas': {
    name: 'Shu-Talas Basin',
    name_en: 'Shu-Talas Basin',
    name_kk: 'Шу-Талас алабы',
    name_ru: 'Шу-Таласский бассейн',
    area: '115,000 km²',
    rivers: 'Chu (Shu), Talas, Assa, Kuragaty',
    key_waters: 'Tashotkel Reservoir, Teris-Ashybulak Reservoir',
    hq: 'Taraz',
    color: '#8b5cf6'
  },
  'tobyl-torgay': {
    name: 'Tobyl-Torgay Basin',
    name_en: 'Tobyl-Torgay Basin',
    name_kk: 'Тобыл-Торғай алабы',
    name_ru: 'Тобол-Торгайский бассейн',
    area: '214,000 km²',
    rivers: 'Tobol (Tobyl), Torgay, Irgiz, Ayat, Ui, Ubagan',
    key_waters: 'Karatomar Reservoir, Upper Tobol Reservoir, Lake Kushmurun',
    hq: 'Kostanay',
    color: '#3b82f6'
  },
  'zhayik-caspian': {
    name: 'Zhayik-Caspian Basin',
    name_en: 'Zhayik-Caspian Basin',
    name_kk: 'Жайық-Каспий алабы',
    name_ru: 'Урало-Каспийский бассейн',
    area: '500,000 km²',
    rivers: 'Ural (Zhayik), Emba (Zhem), Sagiz, Oyil, Ilek, Chagan, Utva',
    key_waters: 'Caspian Sea coastline, Lake Shalkar, Kargaly Reservoir',
    hq: 'Atyrau / Uralsk',
    color: '#10b981'
  },
  'nura-sarysu': {
    name: 'Nura-Sarysu Basin',
    name_en: 'Nura-Sarysu Basin',
    name_kk: 'Нұра-Сарысу алабы',
    name_ru: 'Нура-Сарысуский бассейн',
    area: '260,000 km²',
    rivers: 'Nura, Sarysu, Sherubainura, Kara-Kengir, Sary-Kengir',
    key_waters: 'Lake Tengiz, Lake Korgalzhyn, Samarkand Reservoir, Kengir Reservoir',
    hq: 'Karaganda',
    color: '#f59e0b'
  },
  'aral-syrdarya': {
    name: 'Aral-Syrdarya Basin',
    name_en: 'Aral-Syrdarya Basin',
    name_kk: 'Арал-Сырдария алабы',
    name_ru: 'Арало-Сырдарьинский бассейн',
    area: '345,000 km²',
    rivers: 'Syr Darya, Arys, Keles, Badam, Bugun',
    key_waters: 'North Aral Sea, Shardara Reservoir, Kokaral Dam',
    hq: 'Kyzylorda / Shymkent',
    color: '#0284c7'
  },
  'esil': {
    name: 'Esil Basin',
    name_en: 'Esil Basin',
    name_kk: 'Есіл алабы',
    name_ru: 'Ишимский бассейн',
    area: '245,000 km²',
    rivers: 'Ishim (Esil), Koluton, Zhabay, Terisakkan, Akkanburluk',
    key_waters: 'Sergeyevka Reservoir, Vyacheslav (Astana) Reservoir, Lake Burabay',
    hq: 'Astana / Petropavlovsk',
    color: '#06b6d4'
  },
  'balkhash-alakol': {
    name: 'Balkhash-Alakol Basin',
    name_en: 'Balkhash-Alakol Basin',
    name_kk: 'Балқаш-Алакөл алабы',
    name_ru: 'Балхаш-Алакольский бассейн',
    area: '412,000 km²',
    rivers: 'Ili (Ile), Karatal, Aksu, Lepsy, Ayagoz, Charyn, Koksu',
    key_waters: 'Lake Balkhash, Lake Alakol, Lake Sasykkol, Kapchagay Reservoir',
    hq: 'Almaty / Konayev',
    color: '#14b8a6'
  }
};

const REGION_TO_BASIN = {
  'Pavlodar Region': 'ertis',
  'East Kazakhstan Region': 'ertis',
  'Jambyl Region': 'shu-talas',
  'Almaty Region': 'balkhash-alakol',
  'Almaty': 'balkhash-alakol',
  'Kyzylorda Region': 'aral-syrdarya',
  'South Kazakhstan Region': 'aral-syrdarya',
  'North Kazakhstan Region': 'esil',
  'Akmola Region': 'esil',
  'Astana': 'esil',
  'Karaganda Region': 'nura-sarysu',
  'Kostanay Region': 'tobyl-torgay',
  'West Kazakhstan Region': 'zhayik-caspian',
  'Atyrau Region': 'zhayik-caspian',
  'Mangystau Region': 'zhayik-caspian',
  'Aktobe Region': 'zhayik-caspian'
};

const basinPolys = {};
for (const f of adm1.features) {
  const bId = REGION_TO_BASIN[f.properties.shapeName];
  if (!bId) continue;
  if (!basinPolys[bId]) basinPolys[bId] = [];
  const g = f.geometry;
  if (g.type === 'Polygon') {
    basinPolys[bId].push(g.coordinates);
  } else if (g.type === 'MultiPolygon') {
    for (const poly of g.coordinates) {
      basinPolys[bId].push(poly);
    }
  }
}

const basinFeatures = Object.entries(basinPolys).map(([id, polys]) => {
  const meta = BASIN_DEFS[id];
  return {
    type: 'Feature',
    properties: {
      id,
      name: meta.name,
      name_en: meta.name_en,
      name_kk: meta.name_kk,
      name_ru: meta.name_ru,
      area: meta.area,
      rivers: meta.rivers,
      key_waters: meta.key_waters,
      hq: meta.hq,
      color: meta.color
    },
    geometry: {
      type: 'MultiPolygon',
      coordinates: polys
    }
  };
});

const basinsFC = { type: 'FeatureCollection', features: basinFeatures };
fs.writeFileSync('public/data/kz-basins.geojson', JSON.stringify(basinsFC));
console.log(`   Done: kz-basins.geojson created with ${basinFeatures.length} basins.`);

// 4. Build kz-lakes.geojson
console.log('3. Building kz-lakes.geojson...');
const rawLakes = JSON.parse(fs.readFileSync('public/data/kz-lakes.geojson'));
const foreignNames = new Set([
  'Lake Chany', 'Bosten Hu', 'Ozero Kulundinskoye', 'Ubinskoye Lake',
  'Ozero Teletskoye', 'Ebinur Hu', "Ozero Bol'shoye Topol'noye",
  'Ozero Kuchukskoye', 'Ozero Gorkoye', 'Ozero Tandovo', 'Ebeyty Lake',
  'Ozero Sartlan', 'Mingevir Reservoir', 'Novosibirsk Reservoir',
  'Saratov Reservoir', 'Samara Reservoir', 'Toktogul Suu Saktagychy',
  'Volgograd Reservoir', 'Obanbori Qayroqum', 'Issyk-Kul', 'Sarygamysh Köli',
  'Aydar Ko‘l', 'South Aral Sea'
]);

const cleanLakes = [];
for (const f of rawLakes.features) {
  const p = f.properties || {};
  const name = p.name || p.name_en || '';
  if (foreignNames.has(name)) continue;

  const geom = f.geometry;
  if (!geom || !geom.coordinates) continue;
  let pt = null;
  if (geom.type === 'Polygon' && geom.coordinates[0]?.length) pt = geom.coordinates[0][0];
  else if (geom.type === 'MultiPolygon' && geom.coordinates[0]?.[0]?.length) pt = geom.coordinates[0][0][0];
  if (!pt) continue;

  if (inKazakhstan(pt[0], pt[1])) {
    let name_en = name || 'Lake';
    let name_kk = name || 'Көл';
    let name_ru = name || 'Озеро';
    let basin = 'Balkhash-Alakol';

    if (name.includes('Balkhash')) {
      name_en = 'Lake Balkhash'; name_kk = 'Балқаш көлі'; name_ru = 'Озеро Балхаш'; basin = 'Balkhash-Alakol';
    } else if (name.includes('Zaysan')) {
      name_en = 'Lake Zaysan (Bukhtarma Reservoir)'; name_kk = 'Зайсан көлі (Бұқтырма)'; name_ru = 'Озеро Зайсан (Бухтарминское вдхр.)'; basin = 'Ertis';
    } else if (name.includes('Alakol')) {
      name_en = 'Lake Alakol'; name_kk = 'Алакөл'; name_ru = 'Озеро Алаколь'; basin = 'Balkhash-Alakol';
    } else if (name.includes('Sasykkol')) {
      name_en = 'Lake Sasykkol'; name_kk = 'Сасықкөл'; name_ru = 'Озеро Сасыкколь'; basin = 'Balkhash-Alakol';
    } else if (name.includes('Tengiz')) {
      name_en = 'Lake Tengiz'; name_kk = 'Теңіз көлі'; name_ru = 'Озеро Тенгиз'; basin = 'Nura-Sarysu';
    } else if (name.includes('Marqakol')) {
      name_en = 'Lake Markakol'; name_kk = 'Марқакөл'; name_ru = 'Озеро Маркаколь'; basin = 'Ertis';
    } else if (name.includes('Siletitengiz')) {
      name_en = 'Lake Seletytengiz'; name_kk = 'Сілетітеңіз көлі'; name_ru = 'Озеро Селетытениз'; basin = 'Esil';
    } else if (name.includes('North Aral')) {
      name_en = 'North Aral Sea'; name_kk = 'Солтүстік Арал теңізі'; name_ru = 'Северное Аральское море'; basin = 'Aral-Syrdarya';
    } else if (name.includes('Shardara')) {
      name_en = 'Shardara Reservoir'; name_kk = 'Шардара су қоймасы'; name_ru = 'Шардаринское водохранилище'; basin = 'Aral-Syrdarya';
    } else if (name.includes('Kapchagay')) {
      name_en = 'Kapchagay Reservoir'; name_kk = 'Қапшағай су қоймасы'; name_ru = 'Капшагайское водохранилище'; basin = 'Balkhash-Alakol';
    } else if (name.includes('Qusmuryn')) {
      name_en = 'Lake Kushmurun'; name_kk = 'Құсмұрын көлі'; name_ru = 'Озеро Кушмурун'; basin = 'Tobyl-Torgay';
    } else if (name.includes('Shalkar')) {
      name_en = 'Lake Shalkar'; name_kk = 'Шалқар көлі'; name_ru = 'Озеро Шалкар'; basin = 'Zhayik-Caspian';
    } else if (name.includes('Teke')) {
      name_en = 'Lake Teke'; name_kk = 'Теке көлі'; name_ru = 'Озеро Теке'; basin = 'Esil';
    }

    f.properties = { ...p, name: name_en, name_en, name_kk, name_ru, basin };
    cleanLakes.push(f);
  }
}

const cleanLakesFC = { type: 'FeatureCollection', features: cleanLakes };
fs.writeFileSync('public/data/kz-lakes.geojson', JSON.stringify(cleanLakesFC));
console.log(`   Done: kz-lakes.geojson created with ${cleanLakes.length} lakes.`);

// 5. Build kz-rivers.geojson
console.log('4. Building kz-rivers.geojson...');
const riverFeatures = [];

// A. Extract and clip major stems from existing Natural Earth dataset
const rawRivers = JSON.parse(fs.readFileSync('public/data/kz-rivers.geojson'));
const MAJOR_KZ_STEMS = {
  'Ural': { en: 'Ural River (Zhayik)', kk: 'Жайық өзені', ru: 'Река Урал (Жайык)', basin: 'Zhayik-Caspian', stra: 8 },
  'Syr  Darya': { en: 'Syr Darya River', kk: 'Сырдария өзені', ru: 'Река Сырдарья', basin: 'Aral-Syrdarya', stra: 8 },
  'Tobol': { en: 'Tobol River (Tobyl)', kk: 'Тобыл өзені', ru: 'Река Тобол', basin: 'Tobyl-Torgay', stra: 7 },
  'Ertis': { en: 'Irtysh River (Ertis)', kk: 'Ертіс өзені', ru: 'Река Иртыш', basin: 'Ertis', stra: 8 },
  'Ile': { en: 'Ili River (Ile)', kk: 'Іле өзені', ru: 'Река Или', basin: 'Balkhash-Alakol', stra: 7 },
  'Esil': { en: 'Ishim River (Esil)', kk: 'Есіл өзені', ru: 'Река Ишим (Есиль)', basin: 'Esil', stra: 7 },
  'Ishim': { en: 'Ishim River (Esil)', kk: 'Есіл өзені', ru: 'Река Ишим (Есиль)', basin: 'Esil', stra: 7 }
};

for (const f of rawRivers.features) {
  const name = f.properties.name || f.properties.name_en || '';
  const meta = MAJOR_KZ_STEMS[name];
  if (!meta) continue;

  const geom = f.geometry;
  const rawLines = geom.type === 'LineString' ? [geom.coordinates] : geom.type === 'MultiLineString' ? geom.coordinates : [];
  for (const line of rawLines) {
    const clipped = clipLine(line);
    for (const seg of clipped) {
      riverFeatures.push({
        type: 'Feature',
        properties: {
          name: meta.en,
          name_en: meta.en,
          name_kk: meta.kk,
          name_ru: meta.ru,
          basin: meta.basin,
          stra: meta.stra,
          class: 'major'
        },
        geometry: { type: 'LineString', coordinates: seg }
      });
    }
  }
}
console.log(`   Added ${riverFeatures.length} clipped major stem segments.`);

// B. Extract high-density tributaries from HydroRIVERS PMTiles (Strahler >= 4)
function decompressTile(buf) {
  try { return zlib.gunzipSync(buf); } catch (e) {}
  try { return zlib.inflateSync(buf); } catch (e) {}
  try { return zlib.unzipSync(buf); } catch (e) {}
  return buf;
}

const fd = fs.openSync('public/data/hydrorivers.pmtiles', 'r');
const source = {
  getBytes: async (offset, length) => {
    const buf = Buffer.alloc(length);
    fs.readSync(fd, buf, 0, length, offset);
    return { data: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) };
  },
  getKey: () => 'hydrorivers'
};
const pmtiles = new PMTiles(source);

const z = 6;
const n = Math.pow(2, z);
const minX = 42, maxX = 47, minY = 20, maxY = 24;

const seen = new Set();
let hydroCount = 0;

for (let x = minX; x <= maxX; x++) {
  for (let y = minY; y <= maxY; y++) {
    const resp = await pmtiles.getZxy(z, x, y);
    if (!resp) continue;
    const buf = decompressTile(Buffer.from(resp.data));
    try {
      const vt = new VectorTile(new Pbf(buf));
      const layer = vt.layers['hydrorivers'];
      if (!layer) continue;
      for (let i = 0; i < layer.length; i++) {
        const feat = layer.feature(i);
        const stra = feat.properties.ORD_STRA || 1;
        // Keep Strahler order >= 4 for crisp network representation
        if (stra < 4) continue;
        const id = feat.properties.HYRIV_ID;
        if (id && seen.has(id)) continue;
        if (id) seen.add(id);

        const lines = feat.loadGeometry();
        for (const line of lines) {
          const rawCoords = [];
          for (const pt of line) {
            const lon = (x + pt.x / 4096) / n * 360 - 180;
            const latRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + pt.y / 4096) / n)));
            const lat = latRad * 180 / Math.PI;
            rawCoords.push([lon, lat]);
          }
          const clipped = clipLine(rawCoords);
          for (const seg of clipped) {
            hydroCount++;
            riverFeatures.push({
              type: 'Feature',
              properties: {
                name: stra >= 6 ? 'Major River Reach' : 'River Reach',
                name_en: stra >= 6 ? 'Major River Reach' : 'River Reach',
                name_kk: 'Өзен арнасы',
                name_ru: 'Русло реки',
                stra,
                class: stra >= 6 ? 'major' : stra >= 5 ? 'medium' : 'tributary'
              },
              geometry: { type: 'LineString', coordinates: seg }
            });
          }
        }
      }
    } catch (err) {}
  }
}
fs.closeSync(fd);
console.log(`   Added ${hydroCount} clipped HydroRIVERS reaches inside Kazakhstan.`);

// C. Add key named Kazakhstan river courses across all 8 basins (Western, Central & Northern rivers)
const NAMED_KZ_RIVERS = [
  // Zhayik-Caspian Basin
  {
    name: 'Emba River (Zhem)', name_en: 'Emba River (Zhem)', name_kk: 'Жем өзені', name_ru: 'Река Эмба (Жем)',
    basin: 'Zhayik-Caspian', stra: 6, class: 'major',
    points: [
      [58.42, 49.35], [58.12, 48.95], [57.75, 48.65], [57.25, 48.35],
      [56.65, 48.05], [56.12, 47.78], [55.55, 47.52], [54.85, 47.25],
      [54.25, 47.05], [53.65, 46.95], [53.15, 46.85]
    ]
  },
  {
    name: 'Sagiz River', name_en: 'Sagiz River', name_kk: 'Сағыз өзені', name_ru: 'Река Сагиз',
    basin: 'Zhayik-Caspian', stra: 5, class: 'medium',
    points: [
      [57.85, 48.85], [56.95, 48.55], [56.15, 48.25], [55.35, 47.95],
      [54.45, 47.65], [53.85, 47.45]
    ]
  },
  {
    name: 'Oyil River (Uil)', name_en: 'Oyil River (Uil)', name_kk: 'Ойыл өзені', name_ru: 'Река Ойыл (Уил)',
    basin: 'Zhayik-Caspian', stra: 5, class: 'medium',
    points: [
      [57.65, 50.15], [56.85, 49.95], [55.95, 49.75], [54.95, 49.45],
      [54.15, 49.15], [53.45, 48.85]
    ]
  },
  {
    name: 'Ilek River', name_en: 'Ilek River', name_kk: 'Елек өзені', name_ru: 'Река Илек',
    basin: 'Zhayik-Caspian', stra: 6, class: 'major',
    points: [
      [57.95, 50.25], [57.30, 50.28], [56.70, 50.45], [55.85, 50.75],
      [55.15, 50.95], [54.55, 51.15]
    ]
  },
  {
    name: 'Chagan River', name_en: 'Chagan River', name_kk: 'Шаған өзені', name_ru: 'Река Чаган',
    basin: 'Zhayik-Caspian', stra: 5, class: 'medium',
    points: [
      [51.85, 51.75], [51.55, 51.55], [51.40, 51.35], [51.36, 51.22]
    ]
  },
  {
    name: 'Utva River', name_en: 'Utva River', name_kk: 'Шыңғырлау өзені', name_ru: 'Река Утва (Шингирлау)',
    basin: 'Zhayik-Caspian', stra: 5, class: 'medium',
    points: [
      [53.45, 51.15], [53.15, 51.35], [52.85, 51.48]
    ]
  },

  // Tobyl-Torgay Basin
  {
    name: 'Torgay River', name_en: 'Torgay River', name_kk: 'Торғай өзені', name_ru: 'Река Торгай',
    basin: 'Tobyl-Torgay', stra: 6, class: 'major',
    points: [
      [65.75, 49.85], [64.85, 49.55], [63.95, 49.15], [63.15, 48.75],
      [62.65, 48.35], [62.25, 47.95]
    ]
  },
  {
    name: 'Irgiz River', name_en: 'Irgiz River', name_kk: 'Ырғыз өзені', name_ru: 'Река Иргиз',
    basin: 'Tobyl-Torgay', stra: 6, class: 'major',
    points: [
      [59.85, 50.45], [60.45, 49.85], [60.95, 49.25], [61.45, 48.75],
      [62.15, 48.25]
    ]
  },
  {
    name: 'Ayat River', name_en: 'Ayat River', name_kk: 'Аят өзені', name_ru: 'Река Аят',
    basin: 'Tobyl-Torgay', stra: 5, class: 'medium',
    points: [
      [61.25, 53.05], [61.85, 53.08], [62.45, 53.02], [62.95, 52.95]
    ]
  },
  {
    name: 'Ubagan River', name_en: 'Ubagan River', name_kk: 'Обаған өзені', name_ru: 'Река Обаган',
    basin: 'Tobyl-Torgay', stra: 5, class: 'medium',
    points: [
      [65.25, 52.45], [65.35, 53.15], [65.45, 53.85], [65.55, 54.35]
    ]
  },

  // Esil Basin
  {
    name: 'Koluton River', name_en: 'Koluton River', name_kk: 'Қалқұтан өзені', name_ru: 'Река Колутон',
    basin: 'Esil', stra: 5, class: 'medium',
    points: [
      [71.85, 51.75], [71.15, 51.65], [70.35, 51.55], [69.65, 51.52]
    ]
  },
  {
    name: 'Zhabay River', name_en: 'Zhabay River', name_kk: 'Жабай өзені', name_ru: 'Река Жабай',
    basin: 'Esil', stra: 5, class: 'medium',
    points: [
      [69.85, 52.45], [69.25, 52.15], [68.85, 51.85]
    ]
  },
  {
    name: 'Terisakkan River', name_en: 'Terisakkan River', name_kk: 'Терісаққан өзені', name_ru: 'Река Терсаккан',
    basin: 'Esil', stra: 5, class: 'medium',
    points: [
      [67.45, 49.85], [67.35, 50.45], [67.25, 51.05], [67.15, 51.65]
    ]
  },
  {
    name: 'Chaglinka River', name_en: 'Chaglinka River', name_kk: 'Шағалалы өзені', name_ru: 'Река Чаглинка (Шагалалы)',
    basin: 'Esil', stra: 5, class: 'medium',
    points: [
      [69.25, 52.85], [69.45, 53.25], [69.65, 53.65], [69.85, 54.05]
    ]
  },
  {
    name: 'Selety River', name_en: 'Selety River', name_kk: 'Сілеті өзені', name_ru: 'Река Селеты',
    basin: 'Esil', stra: 5, class: 'medium',
    points: [
      [72.65, 51.85], [72.85, 52.35], [73.05, 52.85], [73.25, 53.25]
    ]
  },

  // Nura-Sarysu Basin
  {
    name: 'Nura River', name_en: 'Nura River', name_kk: 'Нұра өзені', name_ru: 'Река Нура',
    basin: 'Nura-Sarysu', stra: 6, class: 'major',
    points: [
      [75.45, 49.75], [74.55, 49.85], [73.65, 50.05], [72.85, 50.15],
      [71.85, 50.25], [70.95, 50.35], [69.85, 50.45], [69.15, 50.48]
    ]
  },
  {
    name: 'Sarysu River', name_en: 'Sarysu River', name_kk: 'Сарысу өзені', name_ru: 'Река Сарысу',
    basin: 'Nura-Sarysu', stra: 6, class: 'major',
    points: [
      [72.85, 48.95], [71.85, 48.45], [70.85, 47.95], [69.65, 47.35],
      [68.45, 46.65], [67.45, 45.95], [66.45, 45.35]
    ]
  },
  {
    name: 'Kara-Kengir River', name_en: 'Kara-Kengir River', name_kk: 'Қаракеңгір өзені', name_ru: 'Река Кара-Кенгир',
    basin: 'Nura-Sarysu', stra: 5, class: 'medium',
    points: [
      [67.45, 49.35], [67.65, 48.75], [67.75, 48.15], [67.85, 47.65]
    ]
  },

  // Shu-Talas Basin
  {
    name: 'Chu River (Shu)', name_en: 'Chu River (Shu)', name_kk: 'Шу өзені', name_ru: 'Река Чу (Шу)',
    basin: 'Shu-Talas', stra: 6, class: 'major',
    points: [
      [75.15, 43.15], [74.45, 43.45], [73.85, 43.75], [73.15, 44.15],
      [72.45, 44.55], [71.45, 44.85], [70.45, 45.05], [69.25, 45.15]
    ]
  },
  {
    name: 'Talas River', name_en: 'Talas River', name_kk: 'Талас өзені', name_ru: 'Река Талас',
    basin: 'Shu-Talas', stra: 6, class: 'major',
    points: [
      [71.85, 42.85], [71.45, 43.15], [71.05, 43.65], [70.65, 44.15],
      [70.15, 44.55]
    ]
  },
  {
    name: 'Assa River', name_en: 'Assa River', name_kk: 'Аса өзені', name_ru: 'Река Аса',
    basin: 'Shu-Talas', stra: 5, class: 'medium',
    points: [
      [71.15, 42.75], [70.85, 43.15], [70.55, 43.55], [70.25, 43.95]
    ]
  },

  // Balkhash-Alakol Basin
  {
    name: 'Karatal River', name_en: 'Karatal River', name_kk: 'Қаратал өзені', name_ru: 'Река Каратал',
    basin: 'Balkhash-Alakol', stra: 6, class: 'major',
    points: [
      [78.85, 44.85], [78.45, 45.05], [77.85, 45.35], [77.25, 45.65],
      [76.85, 46.15], [76.55, 46.45]
    ]
  },
  {
    name: 'Aksu River (Balkhash)', name_en: 'Aksu River (Balkhash)', name_kk: 'Ақсу өзені', name_ru: 'Река Аксу (Балхаш)',
    basin: 'Balkhash-Alakol', stra: 6, class: 'major',
    points: [
      [79.85, 45.15], [79.25, 45.45], [78.65, 45.85], [78.15, 46.25],
      [77.85, 46.65]
    ]
  },
  {
    name: 'Lepsy River', name_en: 'Lepsy River', name_kk: 'Лепсі өзені', name_ru: 'Река Лепсы',
    basin: 'Balkhash-Alakol', stra: 6, class: 'major',
    points: [
      [80.65, 45.45], [80.15, 45.75], [79.55, 46.05], [78.95, 46.35],
      [78.45, 46.55]
    ]
  },
  {
    name: 'Ayagoz River', name_en: 'Ayagoz River', name_kk: 'Аягөз өзені', name_ru: 'Река Аягоз',
    basin: 'Balkhash-Alakol', stra: 5, class: 'medium',
    points: [
      [80.45, 47.95], [80.15, 47.45], [79.85, 46.95], [79.45, 46.65]
    ]
  },
  {
    name: 'Charyn River', name_en: 'Charyn River', name_kk: 'Шарын өзені', name_ru: 'Река Чарын',
    basin: 'Balkhash-Alakol', stra: 6, class: 'major',
    points: [
      [79.35, 43.15], [79.15, 43.45], [78.95, 43.75], [79.25, 44.05]
    ]
  },
  {
    name: 'Tentek River', name_en: 'Tentek River', name_kk: 'Тентек өзені', name_ru: 'Река Тентек',
    basin: 'Balkhash-Alakol', stra: 5, class: 'medium',
    points: [
      [81.25, 45.55], [81.15, 45.85], [80.95, 46.25], [80.85, 46.45]
    ]
  },

  // Aral-Syrdarya Basin
  {
    name: 'Arys River', name_en: 'Arys River', name_kk: 'Арыс өзені', name_ru: 'Река Арысь',
    basin: 'Aral-Syrdarya', stra: 6, class: 'major',
    points: [
      [70.65, 42.45], [70.05, 42.48], [69.45, 42.55], [68.75, 42.68]
    ]
  },
  {
    name: 'Keles River', name_en: 'Keles River', name_kk: 'Келес өзені', name_ru: 'Река Келес',
    basin: 'Aral-Syrdarya', stra: 5, class: 'medium',
    points: [
      [69.45, 41.75], [69.05, 41.55], [68.65, 41.35], [68.25, 41.15]
    ]
  },
  {
    name: 'Badam River', name_en: 'Badam River', name_kk: 'Бадам өзені', name_ru: 'Река Бадам',
    basin: 'Aral-Syrdarya', stra: 5, class: 'medium',
    points: [
      [70.15, 42.15], [69.75, 42.25], [69.35, 42.35]
    ]
  },

  // Ertis Basin & Canals
  {
    name: 'Bukhtarma River', name_en: 'Bukhtarma River', name_kk: 'Бұқтырма өзені', name_ru: 'Река Бухтарма',
    basin: 'Ertis', stra: 6, class: 'major',
    points: [
      [86.45, 49.35], [85.65, 49.55], [84.85, 49.65], [84.15, 49.75]
    ]
  },
  {
    name: 'Uba River', name_en: 'Uba River', name_kk: 'Уба өзені', name_ru: 'Река Уба',
    basin: 'Ertis', stra: 6, class: 'major',
    points: [
      [83.95, 50.85], [83.45, 50.65], [82.85, 50.45], [82.25, 50.35]
    ]
  },
  {
    name: 'Ulba River', name_en: 'Ulba River', name_kk: 'Үлбі өзені', name_ru: 'Река Ульба',
    basin: 'Ertis', stra: 5, class: 'medium',
    points: [
      [83.85, 50.25], [83.35, 50.05], [82.75, 49.95]
    ]
  },
  {
    name: 'Irtysh-Karaganda Canal', name_en: 'Irtysh-Karaganda Canal (Satpayev)', name_kk: 'Ертіс-Қарағанды каналы', name_ru: 'Канал Иртыш — Караганда',
    basin: 'Ertis', stra: 6, class: 'major',
    points: [
      [76.95, 52.05], [76.25, 51.85], [75.45, 51.55], [74.65, 51.15],
      [73.85, 50.65], [73.25, 50.15]
    ]
  }
];

for (const riv of NAMED_KZ_RIVERS) {
  const clipped = clipLine(riv.points);
  for (const seg of clipped) {
    riverFeatures.push({
      type: 'Feature',
      properties: {
        name: riv.name_en,
        name_en: riv.name_en,
        name_kk: riv.name_kk,
        name_ru: riv.name_ru,
        basin: riv.basin,
        stra: riv.stra,
        class: riv.class
      },
      geometry: { type: 'LineString', coordinates: seg }
    });
  }
}

console.log(`   Total combined clipped river features: ${riverFeatures.length}`);

// Strict verification: Ensure 100% of all vertices in all features are inside Kazakhstan!
let outsideCount = 0;
for (const feat of riverFeatures) {
  for (const pt of feat.geometry.coordinates) {
    if (!inKazakhstan(pt[0], pt[1])) {
      outsideCount++;
    }
  }
}
console.log(`   Outside vertices check: ${outsideCount} (MUST BE 0!)`);

const riversFC = { type: 'FeatureCollection', features: riverFeatures };
fs.writeFileSync('public/data/kz-rivers.geojson', JSON.stringify(riversFC));
console.log(`   Done: kz-rivers.geojson written (${(fs.statSync('public/data/kz-rivers.geojson').size / 1024 / 1024).toFixed(2)} MB).`);

console.log('=== Hydrography build complete! ===');
