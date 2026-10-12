// Downloads and trims boundary / river / lake data into /public/data so the app loads fast and works offline.
// Usage: npm run data   (needs Node 18+)
import { mkdir, writeFile } from 'node:fs/promises';

const BBOX = { w: 46.3, s: 40.4, e: 87.5, n: 55.6 };
const inBox = (c) => (typeof c[0] === 'number' ? c[0] >= BBOX.w && c[0] <= BBOX.e && c[1] >= BBOX.s && c[1] <= BBOX.n : c.some(inBox));
const NE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson';

await mkdir('public/data', { recursive: true });

// geoBoundaries: resolve the current simplified ADM1 file through their API (handles LFS / releases)
const meta = await (await fetch('https://www.geoboundaries.org/api/current/gbOpen/KAZ/ADM1/')).json();
const adm1 = await (await fetch(meta.simplifiedGeometryGeoJSON)).json();
await writeFile('public/data/kz-adm1.geojson', JSON.stringify(adm1));
console.log('kz-adm1.geojson', adm1.features.length, 'regions');

import { execSync } from 'node:child_process';
execSync('node scripts/build-kz-hydrography.mjs', { stdio: 'inherit' });
