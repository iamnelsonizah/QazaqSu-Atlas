import fs from 'node:fs';
import zlib from 'node:zlib';
import { PMTiles } from 'pmtiles';
import Pbf from 'pbf';
import { VectorTile } from '@mapbox/vector-tile';

console.log('Starting hydrography generation...');

// 1. Load Kazakhstan boundary
const border = JSON.parse(fs.readFileSync('public/data/kz-border.geojson'));
const rings = border.features[0].geometry.coordinates;
const mainRing = rings[0];

// Ray casting point-in-polygon
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

// Check if a point is anywhere inside Kazakhstan (mainland or islands)
function inKazakhstan(x, y) {
  for (const r of rings) {
    if (inPoly(x, y, r)) return true;
  }
  return false;
}

// 2. Build kz-mask.geojson (World polygon with Kazakhstan cut out)
console.log('Generating kz-mask.geojson...');
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
console.log('kz-mask.geojson generated successfully.');


// 3. Clean and filter Lakes
console.log('Processing lakes...');
const rawLakes = JSON.parse(fs.readFileSync('public/data/kz-lakes.geojson'));

// Known foreign lakes to exclude explicitly
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

  // Verify coordinates
  const geom = f.geometry;
  if (!geom || !geom.coordinates) continue;
  
  // Test representative point
  let pt = null;
  if (geom.type === 'Polygon' && geom.coordinates[0]?.length) {
    pt = geom.coordinates[0][0];
  } else if (geom.type === 'MultiPolygon' && geom.coordinates[0]?.[0]?.length) {
    pt = geom.coordinates[0][0][0];
  }
  if (!pt) continue;

  if (inKazakhstan(pt[0], pt[1])) {
    // Determine proper localized names
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

    f.properties = {
      ...p,
      name: name_en,
      name_en,
      name_kk,
      name_ru,
      basin
    };
    cleanLakes.push(f);
  }
}

console.log(`Retained ${cleanLakes.length} lakes inside Kazakhstan.`);
const cleanLakesFC = { type: 'FeatureCollection', features: cleanLakes };
fs.writeFileSync('public/data/kz-lakes.geojson', JSON.stringify(cleanLakesFC));
console.log('kz-lakes.geojson updated.');

