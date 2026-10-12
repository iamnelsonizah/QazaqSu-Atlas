import fs from 'node:fs';
import path from 'node:path';

// Precise path coordinates for Kazakhstan's major strategic inter-basin transfer canals
// All coordinates strictly inside Kazakhstan borders
const canals = [
  {
    type: 'Feature',
    properties: {
      id: 'canal-satpayev',
      name: 'Kanysh Satpayev Canal (Irtysh–Karaganda)',
      name_kk: 'Қаныш Сәтбаев атындағы канал',
      name_ru: 'Канал имени Каныша Сатпаева',
      lengthKm: 458,
      capacityM3s: 75,
      pumpingStations: 22,
      liftMeters: 418,
      source: 'Irtysh River (Aksu)',
      destination: 'Nura River, Karaganda & Astana',
      purpose: 'Inter-basin municipal and metallurgical water transfer',
    },
    geometry: {
      type: 'LineString',
      coordinates: [
        [76.920, 52.050], // Aksu intake on Irtysh River
        [76.750, 52.000],
        [76.450, 51.920],
        [76.100, 51.850],
        [75.700, 51.800],
        [75.320, 51.720], // Ekibastuz reservoir junction
        [74.950, 51.600],
        [74.600, 51.450],
        [74.250, 51.250],
        [73.900, 50.950],
        [73.650, 50.600],
        [73.450, 50.300],
        [73.250, 50.050],
        [73.150, 49.850], // Karaganda / Temirtau terminal
      ],
    },
  },
  {
    type: 'Feature',
    properties: {
      id: 'canal-satpayev-astana-branch',
      name: 'Satpayev Canal – Astana Pipeline Conduit',
      name_kk: 'Сәтбаев каналы – Астана су құбыры',
      name_ru: 'Водовод канала Сатпаева к Астане',
      lengthKm: 145,
      capacityM3s: 18,
      source: 'Satpayev Canal (Nura junction)',
      destination: 'Vyacheslavskoye (Astana) Reservoir',
      purpose: 'Capital city water supply emergency reinforcement',
    },
    geometry: {
      type: 'LineString',
      coordinates: [
        [73.650, 50.600],
        [73.200, 50.800],
        [72.750, 51.000],
        [72.400, 51.100],
        [72.158, 51.196], // Astana Reservoir
      ],
    },
  },
  {
    type: 'Feature',
    properties: {
      id: 'canal-bak',
      name: 'Great Almaty Canal (BAK named after D. Kunayev)',
      name_kk: 'Д. Қонаев атындағы Үлкен Алматы каналы (ҮАК)',
      name_ru: 'Большой Алматинский канал имени Д. Кунаева (БАК)',
      lengthKm: 168,
      capacityM3s: 30,
      source: 'Bartogay Reservoir (Chilik River)',
      destination: 'Kurty River / Almaty piedmont irrigation',
      purpose: 'Tian Shan foothill irrigation and Almaty urban buffer',
    },
    geometry: {
      type: 'LineString',
      coordinates: [
        [78.495, 43.368], // Bartogay Reservoir on Chilik River
        [78.300, 43.420],
        [78.050, 43.480],
        [77.750, 43.490],
        [77.450, 43.450],
        [77.200, 43.380],
        [76.950, 43.350], // Northern Almaty bypass
        [76.750, 43.420],
        [76.550, 43.550],
        [76.528, 43.672], // Kurty Reservoir discharge
      ],
    },
  },
  {
    type: 'Feature',
    properties: {
      id: 'canal-koksaray',
      name: 'Koksaray Flood Regulator Canal & Bypass',
      name_kk: 'Көксарай су реттегішінің арнасы',
      name_ru: 'Канал Коксарайского контррегулятора',
      lengthKm: 55,
      capacityM3s: 500,
      source: 'Syr Darya (downstream of Shardara)',
      destination: 'Koksaray off-stream reservoir (3.0 km³)',
      purpose: 'Winter flood diversion and summer irrigation storage',
    },
    geometry: {
      type: 'LineString',
      coordinates: [
        [68.100, 42.820], // Syr Darya diversion intake
        [68.070, 42.870],
        [68.020, 42.920],
        [67.970, 42.980], // Koksaray off-stream reservoir basin
        [67.900, 43.020],
        [67.850, 43.060], // Outlet return to Syr Darya
      ],
    },
  },
  {
    type: 'Feature',
    properties: {
      id: 'canal-arys-turkistan',
      name: 'Arys–Turkistan Irrigation Canal',
      name_kk: 'Арыс–Түркістан каналы',
      name_ru: 'Арыс-Туркестанский канал',
      lengthKm: 195,
      capacityM3s: 45,
      source: 'Arys River',
      destination: 'Bogen Reservoir & Turkistan oasis',
      purpose: 'Oasis agriculture and Syr Darya sub-basin regulation',
    },
    geometry: {
      type: 'LineString',
      coordinates: [
        [69.180, 42.420], // Arys River intake
        [69.050, 42.550],
        [68.950, 42.700],
        [68.790, 42.855], // Bogen Reservoir
        [68.650, 43.000],
        [68.450, 43.150],
        [68.250, 43.300], // Turkistan city outskirts
      ],
    },
  },
];

const fc = {
  type: 'FeatureCollection',
  features: canals,
};

const outPath = path.resolve(process.cwd(), 'public/data/kz-canals.geojson');
fs.writeFileSync(outPath, JSON.stringify(fc, null, 2), 'utf-8');
console.log(`Saved ${canals.length} strategic canal corridors to ${outPath}`);
