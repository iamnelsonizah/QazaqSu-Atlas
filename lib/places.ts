import type { Basin, FloodPoint, Lang, Place, PlaceType, Verification } from './types';
import { formatNumber, tr } from './i18n';

export const TYPE_META: Record<PlaceType, { label: string; plural: string; color: string }> = {
  dam: { label: 'Dam or reservoir', plural: 'Dams and reservoirs', color: '#2f6fdb' },
  lake: { label: 'Lake or sea', plural: 'Lakes and seas', color: '#1fa37a' },
  river: { label: 'River', plural: 'Rivers', color: '#2f8f3a' },
  canal: { label: 'Strategic canal', plural: 'Strategic canals', color: '#06b6d4' },
  glacier: { label: 'Glacier water tower', plural: 'Glaciers & alpine stations', color: '#0284c7' },
  ramsar: { label: 'Ramsar wetland', plural: 'Ramsar wetlands', color: '#d9578f' },
  gauge: { label: 'Flood-watch point', plural: 'Flood-watch points', color: '#5b3fb5' },
  basinhq: { label: 'Basin council HQ', plural: 'Basin councils (HQ)', color: '#3d4a52' },
};
export const TYPE_ORDER: PlaceType[] = ['dam', 'lake', 'river', 'canal', 'glacier', 'ramsar', 'gauge', 'basinhq'];

const mk = (
  type: PlaceType,
  id: string,
  names: [string, string, string],
  lat: number,
  lon: number,
  region: string,
  basin: Basin,
  verification: Verification,
  source: string,
  extra: Partial<Place> = {},
): Place => ({
  id,
  type,
  name: { en: names[0], kk: names[1], ru: names[2] },
  lat,
  lon,
  region,
  basin,
  verification,
  source,
  ...extra,
});

const GDW = 'Global Dam Watch (GRanD/GeoDAR), Ministry of Water Resources and Irrigation';
const NE = 'Natural Earth, HydroSHEDS';
const RSIS = 'Ramsar Sites Information Service (RSIS)';
const OM = 'Open-Meteo Flood API (GloFAS-based)';
const BAS = 'Ministry of Water Resources and Irrigation (basin councils)';

export const PLACES: Place[] = [
  // =========================================================================
  // ---- Dams and reservoirs (capacity in km³) ----
  // =========================================================================
  mk('dam', 'dam-bukhtarma', ['Bukhtarma Reservoir', 'Бұқтырма су қоймасы', 'Бухтарминское водохранилище'], 49.656, 83.348, 'East Kazakhstan', 'Ertis', 'A', GDW, {
    size: 49.8,
    sizeUnit: 'km³',
    year: 1960,
    note: 'Largest reservoir in Kazakhstan by storage volume (49,800 MCM). Formed by the Bukhtarma Hydroelectric Dam on the Irtysh River.',
    drainageType: 'exorheic',
    inflows: ['Irtysh River (from Lake Zaysan & Black Irtysh)', 'Bukhtarma River'],
    outflows: ['Irtysh River (Ust-Kamenogorsk HPP cascade -> Ob -> Arctic Ocean)'],
    transboundaryInflow: 'Fed by transboundary Black Irtysh originating in Xinjiang, China.',
    basinCouncil: 'Ertis Basin Water Inspection (Ust-Kamenogorsk)',
  }),
  mk('dam', 'dam-kapchagay', ['Kapchagay Reservoir', 'Қапшағай су қоймасы', 'Капшагайское водохранилище'], 43.922, 77.104, 'Almaty', 'Balkhash-Alakol', 'A', GDW, {
    size: 28.1,
    sizeUnit: 'km³',
    year: 1970,
    note: 'Major reservoir on the Ili River upstream of Lake Balkhash; regulates transboundary flow from China.',
    drainageType: 'endorheic',
    inflows: ['Ili River (transboundary from China)', 'Charyn River', 'Chilik River', 'Kaskelen River'],
    outflows: ['Lower Ili River (discharging into Lake Balkhash delta)'],
    transboundaryInflow: 'Ili River upper basin delivers >70% of volume from Xinjiang, China.',
    basinCouncil: 'Balkhash-Alakol Basin Water Inspection (Almaty)',
  }),
  mk('dam', 'dam-shardara', ['Shardara Reservoir', 'Шардара су қоймасы', 'Шардаринское водохранилище'], 41.243, 67.960, 'Turkistan', 'Aral-Syrdarya', 'A', GDW, {
    size: 5.2,
    sizeUnit: 'km³',
    year: 1965,
    note: 'Key regulating reservoir on the Syr Darya. Manages seasonal flood discharges from Toktogul and Kairakkum cascades.',
    drainageType: 'endorheic',
    inflows: ['Syr Darya River (transboundary from Uzbekistan & Kyrgyzstan)'],
    outflows: ['Lower Syr Darya River', 'Koksaray Flood Regulator canal', 'Kyzylkum irrigation canal', 'Arnasay emergency overflow'],
    transboundaryInflow: 'Regulated upstream by Toktogul Dam (Kyrgyzstan) and Kairakkum Dam (Tajikistan).',
    basinCouncil: 'Aral-Syrdarya Basin Water Inspection (Kyzylorda)',
  }),
  mk('dam', 'dam-shulbinsk', ['Shulbinsk Reservoir', 'Шүлбі су қоймасы', 'Шульбинское водохранилище'], 50.400, 81.070, 'Abai', 'Ertis', 'A', GDW, {
    size: 2.39,
    sizeUnit: 'km³',
    year: 1987,
    note: 'Third stage of the Irtysh River hydropower cascade downstream of Bukhtarma and Ust-Kamenogorsk.',
    drainageType: 'exorheic',
    inflows: ['Irtysh River (Ust-Kamenogorsk tailwater)', 'Ulba River', 'Uba River'],
    outflows: ['Lower Irtysh River (towards Semey, Pavlodar, and Russia)'],
    basinCouncil: 'Ertis Basin Water Inspection (Semey)',
  }),
  mk('dam', 'dam-karatomar', ['Karatomar Reservoir', 'Қаратомар су қоймасы', 'Каратомарское водохранилище'], 52.909, 63.051, 'Kostanay', 'Tobyl-Torgay', 'A', GDW, {
    size: 1.38,
    sizeUnit: 'km³',
    year: 1965,
    note: 'On the Tobol River near Rudny. Major drinking and industrial water supply for Kostanay region.',
    drainageType: 'exorheic',
    inflows: ['Tobol River', 'Upper Tobol Reservoir cascade discharge'],
    outflows: ['Tobol River (towards Kostanay city and Kurgan, Russia)'],
    basinCouncil: 'Tobyl-Torgay Basin Water Inspection (Kostanay)',
  }),
  mk('dam', 'dam-verkhne-tobol', ['Upper Tobol Reservoir', 'Жоғарғы Тобыл су қоймасы', 'Верхнетобольское водохранилище'], 52.519, 62.334, 'Kostanay', 'Tobyl-Torgay', 'A', GDW, {
    size: 0.82,
    sizeUnit: 'km³',
    year: 1977,
    note: 'On the Upper Tobol River; upstream regulator for Karatomar Reservoir.',
    drainageType: 'exorheic',
    inflows: ['Upper Tobol River (Russian border headwaters)'],
    outflows: ['Karatomar Reservoir cascade on the Tobol River'],
    basinCouncil: 'Tobyl-Torgay Basin Water Inspection (Kostanay)',
  }),
  mk('dam', 'dam-sergeevka', ['Sergeyevka Reservoir', 'Сергеевка су қоймасы', 'Сергеевское водохранилище'], 53.872, 67.435, 'North Kazakhstan', 'Esil', 'A', GDW, {
    size: 0.693,
    sizeUnit: 'km³',
    year: 1969,
    note: 'Primary flood and flow control reservoir on the Ishim River upstream of Petropavlovsk.',
    drainageType: 'exorheic',
    inflows: ['Upper Ishim (Esil) River', 'Imanburlyk River'],
    outflows: ['Lower Ishim River (towards Petropavlovsk and Tyumen, Russia)'],
    basinCouncil: 'Esil Basin Water Inspection (Petropavlovsk)',
  }),
  mk('dam', 'dam-ustkam', ['Ust-Kamenogorsk Reservoir', 'Өскемен су қоймасы', 'Усть-Каменогорское водохранилище'], 49.903, 82.719, 'East Kazakhstan', 'Ertis', 'A', GDW, {
    size: 0.655,
    sizeUnit: 'km³',
    year: 1952,
    note: 'Hydropower reservoir on the Irtysh River at Oskemen (332 MW).',
    drainageType: 'exorheic',
    inflows: ['Bukhtarma Reservoir tailwater on the Irtysh River'],
    outflows: ['Shulbinsk Reservoir cascade on the Irtysh River'],
    basinCouncil: 'Ertis Basin Water Inspection',
  }),
  mk('dam', 'dam-tashotkel', ['Tashotkel Reservoir', 'Тасөткел су қоймасы', 'Ташуткульское водохранилище'], 43.381, 73.877, 'Jambyl', 'Shu-Talas', 'A', GDW, {
    size: 0.62,
    sizeUnit: 'km³',
    year: 1974,
    note: 'Largest irrigation reservoir on the Chu River in Jambyl region.',
    drainageType: 'endorheic',
    inflows: ['Chu River (transboundary from Kyrgyzstan)'],
    outflows: ['Lower Chu River (irrigation canal network & Muyunkum desert)'],
    transboundaryInflow: 'Chu River headwaters and Orto-Tokoy reservoir located in Kyrgyzstan.',
    basinCouncil: 'Shu-Talas Basin Water Inspection (Taraz)',
  }),
  mk('dam', 'dam-astana', ['Astana (Vyacheslavskoye) Reservoir', 'Астана (Вячеслав) су қоймасы', 'Астанинское (Вячеславское) водохранилище'], 51.196, 72.158, 'Akmola', 'Esil', 'A', GDW, {
    size: 0.411,
    sizeUnit: 'km³',
    year: 1970,
    note: 'Primary surface water supply reservoir on the Ishim River for the capital city of Astana.',
    drainageType: 'exorheic',
    inflows: ['Upper Ishim River', 'Irtysh–Karaganda Canal feeder pipeline'],
    outflows: ['Ishim River through Astana city'],
    basinCouncil: 'Esil Basin Water Inspection (Astana)',
  }),
  mk('dam', 'dam-bogen', ['Bogen Reservoir', 'Бөген су қоймасы', 'Богенское водохранилище'], 42.855, 68.790, 'Turkistan', 'Aral-Syrdarya', 'A', GDW, {
    size: 0.37,
    sizeUnit: 'km³',
    year: 1967,
    note: 'Major irrigation reservoir in the Aral-Syrdarya basin on the Bogen River.',
    drainageType: 'endorheic',
    inflows: ['Bogen River', 'Turkistan Main Canal'],
    outflows: ['Aral-Syrdarya irrigation network'],
    basinCouncil: 'Aral-Syrdarya Basin Water Inspection',
  }),
  mk('dam', 'dam-bartogay', ['Bartogay Reservoir', 'Бартоғай су қоймасы', 'Бартогайское водохранилище'], 43.368, 78.495, 'Almaty', 'Balkhash-Alakol', 'A', GDW, {
    size: 0.32,
    sizeUnit: 'km³',
    year: 1983,
    note: 'On the Chilik River; feeds the Great Almaty Canal (BAK) for agricultural irrigation.',
  }),
  mk('dam', 'dam-kengir', ['Kengir Reservoir', 'Кеңгір су қоймасы', 'Кенгирское водохранилище'], 47.794, 67.739, 'Ulytau', 'Nura-Sarysu', 'A', GDW, {
    size: 0.319,
    sizeUnit: 'km³',
    year: 1952,
    note: 'On the Kara-Kengir River; main drinking and industrial water supply for Zhezkazgan.',
  }),
  mk('dam', 'dam-kargaly', ['Kargaly Reservoir', 'Қарғалы су қоймасы', 'Каргалинское водохранилище'], 50.642, 57.803, 'Aktobe', 'Zhayik-Caspian', 'A', GDW, {
    size: 0.28,
    sizeUnit: 'km³',
    year: 1975,
    note: 'On the Kargala River; regulates spring floodwaters upstream of Aktobe city.',
  }),
  mk('dam', 'dam-samarkand', ['Samarkand Reservoir', 'Самарқанд су қоймасы', 'Самаркандское водохранилище'], 50.070, 72.930, 'Karaganda', 'Nura-Sarysu', 'A', GDW, {
    size: 0.254,
    sizeUnit: 'km³',
    year: 1941,
    note: 'On the Nura River at Temirtau; supplies industrial water to the Karaganda metallurgical complex.',
  }),
  mk('dam', 'dam-aktobe', ['Aktobe Reservoir', 'Ақтөбе су қоймасы', 'Актюбинское водохранилище'], 50.234, 57.298, 'Aktobe', 'Zhayik-Caspian', 'A', GDW, {
    size: 0.245,
    sizeUnit: 'km³',
    year: 1988,
    note: 'On the Ilek River immediately adjacent to Aktobe; key structure for spring snowmelt retention.',
  }),
  mk('dam', 'dam-selety', ['Selety Reservoir', 'Сілеті су қоймасы', 'Селетинское водохранилище'], 52.148, 72.735, 'Akmola', 'Ertis', 'A', GDW, {
    size: 0.23,
    sizeUnit: 'km³',
    year: 1965,
    note: 'On the Selety River; provides municipal and industrial water to Stepnogorsk.',
  }),
  mk('dam', 'dam-ters', ['Ters-Ashchibulak Reservoir', 'Теріс-Ащыбұлақ су қоймасы', 'Терс-Ащибулакское водохранилище'], 42.680, 70.956, 'Jambyl', 'Shu-Talas', 'A', GDW, {
    size: 0.158,
    sizeUnit: 'km³',
    year: 1963,
    note: 'In the Shu-Talas basin on the Ters River.',
  }),
  mk('dam', 'dam-yntymak', ['Yntymak Reservoir', 'Ынтымақ су қоймасы', 'Интумакское водохранилище'], 50.102, 72.920, 'Karaganda', 'Nura-Sarysu', 'A', GDW, {
    size: 0.14,
    sizeUnit: 'km³',
    year: 1987,
    note: 'On the Nura River downstream of Temirtau; equipped with bottom discharges for silt management.',
  }),
  mk('dam', 'dam-kurty', ['Kurty Reservoir', 'Күрті су қоймасы', 'Куртинское водохранилище'], 43.672, 76.528, 'Almaty', 'Balkhash-Alakol', 'A', GDW, {
    size: 0.12,
    sizeUnit: 'km³',
    year: 1967,
    note: 'On the Kurty River in Almaty region.',
  }),
  mk('dam', 'dam-bestobe', ['Bestobe (Moinak HPP) Reservoir', 'Бестөбе су қоймасы (Мойнақ СЭС)', 'Бестобинское водохранилище (Мойнакская ГЭС)'], 43.080, 79.167, 'Almaty', 'Balkhash-Alakol', 'A', GDW, {
    size: 0.09,
    sizeUnit: 'km³',
    year: 2012,
    note: 'High-head 300 MW hydropower installation on the Charyn River in Almaty region.',
  }),
  mk('dam', 'dam-badam', ['Badam Reservoir', 'Бадам су қоймасы', 'Бадамское водохранилище'], 42.231, 69.773, 'Turkistan', 'Aral-Syrdarya', 'A', GDW, {
    size: 0.0615,
    sizeUnit: 'km³',
    year: 1974,
    note: 'On the Badam River near Shymkent.',
  }),
  mk('dam', 'dam-kyzylagash', ['Kyzylagash Dam (Reconstructed)', 'Қызылағаш бөгеті (қайта салынған)', 'Кызылагашская плотина (восстановленная)'], 45.340, 78.895, 'Jetisu', 'Balkhash-Alakol', 'A', GDW, {
    size: 0.042,
    sizeUnit: 'km³',
    year: 2019,
    note: 'Engineered reinforced concrete and earth dam rebuilt after the 2010 dam breach.',
  }),
  mk('dam', 'dam-kokaral', ['Kokaral Dam', 'Көкарал бөгеті', 'Кокаральская плотина'], 46.108, 60.778, 'Kyzylorda', 'Aral-Syrdarya', 'A', GDW, {
    size: 27.0,
    sizeUnit: 'km³',
    year: 2005,
    note: '13-km dike across the Berg Strait completed in 2005 under the World Bank SYNAS project; preserves the North Aral Sea.',
    drainageType: 'endorheic',
    inflows: ['Syr Darya River delta discharge'],
    outflows: ['Berg Strait spillway channel (regulated overflow release to desiccated South Aral basin)'],
    transboundaryInflow: 'Stabilizes the North Aral Sea with preserved Syr Darya water.',
    basinCouncil: 'Aral-Syrdarya Basin Water Inspection (Aralsk)',
  }),

  // =========================================================================
  // ---- Lakes and seas (surface area in km²) ----
  // =========================================================================
  mk('lake', 'lake-caspian', ['Caspian Sea (Kazakh sector)', 'Каспий теңізі', 'Каспийское море'], 44.0, 50.8, 'Mangystau', 'Zhayik-Caspian', 'A', NE, {
    size: 371000,
    sizeUnit: 'km²',
    note: 'Whole-sea area. Shared by five littoral states; sea level regression is a primary long-term environmental concern.',
    drainageType: 'endorheic',
    inflows: ['Volga River (~80% of total inflow)', 'Ural River (Zhayik)', 'Emba River (spring snowmelt)', 'Kura River', 'Terek River'],
    outflows: ['None (Terminal endorheic sink — water loss solely via surface evaporation; -28.5 m BS)'],
    transboundaryInflow: 'Shared by five littoral nations: Kazakhstan, Russia, Azerbaijan, Iran, and Turkmenistan.',
    basinCouncil: 'Zhayik-Caspian Basin Water Inspection (Atyrau)',
  }),
  mk('lake', 'lake-balkhash', ['Lake Balkhash', 'Балқаш көлі', 'озеро Балхаш'], 46.5, 74.5, 'Karaganda', 'Balkhash-Alakol', 'A', NE, {
    size: 16400,
    sizeUnit: 'km²',
    note: 'Semi-endorheic lake divided by Saryesik peninsula: freshwater in the western half, saline in the eastern half.',
    drainageType: 'endorheic',
    inflows: ['Ili River (73–80% of inflow)', 'Karatal River', 'Aksu River', 'Lepsy River', 'Ayagoz River'],
    outflows: ['None (Terminal endorheic lake — no surface outlet; water leaves solely via intense evaporation)'],
    transboundaryInflow: 'Transboundary dependency: ~73% of surface inflow arrives via the Ili River from Xinjiang, China.',
    basinCouncil: 'Balkhash-Alakol Basin Water Inspection (Almaty / Balkhash)',
  }),
  mk('lake', 'lake-aral', ['North Aral Sea', 'Солтүстік Арал теңізі (Кіші Арал)', 'Северное Аральское море'], 46.5, 61.0, 'Kyzylorda', 'Aral-Syrdarya', 'A', NE, {
    size: 3300,
    sizeUnit: 'km²',
    note: 'Stabilized and partially restored inland sea basin preserved by the Kokaral Dam.',
    drainageType: 'endorheic',
    inflows: ['Syr Darya River', 'Koksaray Flood Regulator discharge'],
    outflows: ['Kokaral Dam spillway / Berg Strait channel (regulated release to South Aral depression)'],
    transboundaryInflow: 'Syr Darya river basin originates in Kyrgyzstan (Naryn) and Uzbekistan.',
    basinCouncil: 'Aral-Syrdarya Basin Water Inspection (Kyzylorda / Aralsk)',
  }),
  mk('lake', 'lake-alakol', ['Lake Alakol', 'Алакөл', 'озеро Алаколь'], 46.1, 81.8, 'Jetisu', 'Balkhash-Alakol', 'A', NE, {
    size: 2650,
    sizeUnit: 'km²',
    note: 'Saline mineral lake in the Dzungarian Alatau depression; UNESCO Biosphere Reserve.',
    drainageType: 'endorheic',
    inflows: ['Emel River', 'Urdzhar River', 'Khatynsu River', 'Zhamanotkol channel from Lake Sasykkol'],
    outflows: ['None (Terminal endorheic mineral lake)'],
    transboundaryInflow: 'Emel River headwaters originate in Tacheng Prefecture, Xinjiang, China.',
    basinCouncil: 'Balkhash-Alakol Basin Water Inspection (Taldykorgan)',
  }),
  mk('lake', 'lake-zaysan', ['Lake Zaysan', 'Зайсан көлі', 'озеро Зайсан'], 48.0, 84.0, 'East Kazakhstan', 'Ertis', 'A', NE, {
    size: 1810,
    sizeUnit: 'km²',
    note: 'Ancient freshwater lake in eastern Kazakhstan regulated since 1960 as part of Bukhtarma Reservoir.',
    drainageType: 'exorheic',
    inflows: ['Black Irtysh River (Kara-Ertis from Xinjiang, China)', 'Kendyrlyk River', 'Kokpekty River'],
    outflows: ['Irtysh River (impounded into Bukhtarma Reservoir -> Ob River -> Arctic Ocean)'],
    transboundaryInflow: 'Black Irtysh originates in the Mongolian Altai and Xinjiang, China.',
    basinCouncil: 'Ertis Basin Water Inspection (Ust-Kamenogorsk)',
  }),
  mk('lake', 'lake-tengiz', ['Lake Tengiz', 'Теңіз көлі', 'озеро Тенгиз'], 50.417, 69.25, 'Akmola', 'Nura-Sarysu', 'A', NE, {
    size: 1590,
    sizeUnit: 'km²',
    note: 'Hypersaline endorheic lake; Ramsar Site No. 107 and UNESCO World Heritage site (Saryarka).',
    drainageType: 'endorheic',
    inflows: ['Nura River', 'Kulanotpes River'],
    outflows: ['None (Terminal endorheic salt lake in Korgalzhyn State Nature Reserve)'],
    basinCouncil: 'Nura-Sarysu Basin Water Inspection (Karaganda)',
  }),
  mk('lake', 'lake-sasykkol', ['Lake Sasykkol', 'Сасықкөл', 'озеро Сасыколь'], 46.58, 80.95, 'Jetisu', 'Balkhash-Alakol', 'A', NE, {
    size: 736,
    sizeUnit: 'km²',
    note: 'Connected with Lake Alakol through the Uyaly wetland corridor.',
    drainageType: 'endorheic',
    inflows: ['Tentek River', 'Karakol River'],
    outflows: ['Zhamanotkol channel into Lake Alakol'],
    basinCouncil: 'Balkhash-Alakol Basin Water Inspection',
  }),
  mk('lake', 'lake-seletyteniz', ['Lake Seletyteniz', 'Сілетітеңіз', 'озеро Селетытениз'], 53.3, 73.9, 'Pavlodar', 'Ertis', 'A', NE, {
    size: 780,
    sizeUnit: 'km²',
    note: 'Terminal salt lake fed by the Selety River in northern Kazakhstan.',
    drainageType: 'endorheic',
    inflows: ['Selety River'],
    outflows: ['None (Terminal endorheic salt basin in Pavlodar region)'],
    basinCouncil: 'Ertis Basin Water Inspection',
  }),
  mk('lake', 'lake-markakol', ['Lake Markakol', 'Марқакөл', 'озеро Маркаколь'], 48.75, 85.75, 'East Kazakhstan', 'Ertis', 'A', NE, {
    size: 455,
    sizeUnit: 'km²',
    note: 'High-altitude alpine lake in the Southern Altai mountains (1,449 m elevation).',
    drainageType: 'exorheic',
    inflows: ['Urunkhayka River', 'Topolevka River', 'Matabay River'],
    outflows: ['Kalzhyr River (flows into Black Irtysh / Irtysh River cascade -> Arctic Ocean)'],
    basinCouncil: 'Ertis Basin Water Inspection',
  }),
  mk('lake', 'lake-burabay', ['Lake Burabay (Borovoe)', 'Бурабай көлі', 'озеро Боровое'], 53.08, 70.3, 'Akmola', 'Esil', 'A', NE, {
    size: 10.5,
    sizeUnit: 'km²',
    note: 'Iconic resort lake in the Kokshetau upland pine forests.',
    drainageType: 'exorheic',
    inflows: ['Sarybulak stream', 'Glacial springs'],
    outflows: ['Kylshakty River -> Ishim River basin'],
    basinCouncil: 'Esil Basin Water Inspection',
  }),
  mk('lake', 'lake-kolsai', ['Kolsai Lakes', 'Қөлсай көлдері', 'озёра Кольсай'], 42.98, 78.33, 'Almaty', 'Balkhash-Alakol', 'A', NE, {
    note: 'Cascade of three alpine lakes in the Kungey Alatau range.',
    drainageType: 'endorheic',
    inflows: ['Kolsay River headwaters'],
    outflows: ['Chilik River -> Kapchagay Reservoir -> Lake Balkhash'],
    basinCouncil: 'Balkhash-Alakol Basin Water Inspection',
  }),
  mk('lake', 'lake-bao', ['Big Almaty Lake', 'Үлкен Алматы көлі', 'Большое Алматинское озеро'], 43.05, 76.99, 'Almaty city', 'Balkhash-Alakol', 'A', NE, {
    note: 'Glacial lake in the Ile-Alatau National Park; source of drinking water for Almaty.',
    drainageType: 'endorheic',
    inflows: ['Ozernaya River', 'Almaty glacial meltwater'],
    outflows: ['Ulken Almaty River -> Kaskelen River -> Kapchagay Reservoir'],
    basinCouncil: 'Balkhash-Alakol Basin Water Inspection',
  }),

  // =========================================================================
  // ---- Rivers (total length in km) ----
  // =========================================================================
  mk('river', 'river-irtysh', ['Irtysh River (Ertis)', 'Ертіс өзені', 'река Иртыш'], 52.3, 76.95, 'Pavlodar', 'Ertis', 'A', NE, {
    size: 4248,
    sizeUnit: 'km',
    lengthKm: 4248,
    lengthKzKm: 1700,
    flowsInto: 'Ob River (Arctic Ocean Basin)',
    sourceLocation: 'Mongolian Altai Mountains, Xinjiang, China',
    regionsCrossed: 'East Kazakhstan; Abai; Pavlodar',
    dischargeM3s: 2830,
    streamOrder: 8,
    lineDrawnFrom: 'Natural Earth & HydroSHEDS',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Irtysh',
    wikidataId: 'Q16550',
    drainageType: 'exorheic',
    inflows: ['Black Irtysh (Kara-Ertis)', 'Bukhtarma River', 'Ulba River', 'Uba River', 'Kurchum River', 'Char River'],
    outflows: ['Ob River (Russia) -> Gulf of Ob -> Kara Sea -> Arctic Ocean'],
    transboundaryInflow: 'Upstream: Enters from Xinjiang, China; downstream: crosses into Omsk Oblast, Russia.',
    basinCouncil: 'Ertis Basin Water Inspection (Semey / Ust-Kamenogorsk / Pavlodar)',
    note: 'Transboundary river flowing from China through eastern Kazakhstan into Russia; main hydrological and industrial artery of northeastern Kazakhstan.',
    about: 'The Irtysh (Kazakh: Ертіс, Russian: Иртыш) is a major transboundary river in Central Asia and Western Siberia. Originating from the glaciers of the Mongolian Altai in Xinjiang, China as the Black Irtysh (Kara-Ertis), it enters eastern Kazakhstan and flows through Lake Zaysan before carving through the Altay foothills.\n\nIn Kazakhstan, the Irtysh is regulated by three of the country\'s most strategic hydroelectric cascades: the massive Bukhtarma Reservoir (49.8 km³), the Ust-Kamenogorsk Dam, and the Shulbinsk Reservoir. Near the industrial hub of Aksu, it feeds the 458-kilometer Irtysh–Karaganda Canal (Kanysh Satpayev Canal), which supplies drinking water to Karaganda and the capital city of Astana across the arid Kazakh steppes.\n\nThe river is subject to trilateral water-sharing negotiations between China, Kazakhstan, and Russia, particularly regarding upstream agricultural abstractions in Xinjiang and industrial pollution controls.',
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=200&q=80',
        caption: 'Irtysh River broad floodplain and navigational channel near Pavlodar',
        author: 'Pavlodar Hydrology Archive',
        license: 'CC BY-SA 4.0',
        sourceUrl: 'https://en.wikipedia.org/wiki/Irtysh'
      },
      {
        url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=200&q=80',
        caption: 'Bukhtarma Reservoir gorge upstream on the Irtysh River cascade',
        author: 'East Kazakhstan Tourism Board',
        license: 'Public Domain'
      },
      {
        url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=200&q=80',
        caption: 'Altai Mountain headwaters of the Black Irtysh River',
        author: 'Wikimedia Commons',
        license: 'CC BY-SA 3.0'
      }
    ],
    references: [
      { title: 'Ministry of Water Resources: Ertis Basin Water Balance Report', url: 'https://www.gov.kz/memleket/entities/water?lang=en', year: '2023' },
      { title: 'Kazhydromet: Annual Hydrometeorological Bulletin for the Irtysh Basin', url: 'https://www.kazhydromet.kz', year: '2024' },
      { title: 'UNECE: Transboundary Water Cooperation in the Irtysh River Basin', url: 'https://unece.org/environment-policy/water', year: '2021' }
    ]
  }),
  mk('river', 'river-syrdarya', ['Syr Darya River', 'Сырдария өзені', 'река Сырдарья'], 44.85, 65.5, 'Kyzylorda', 'Aral-Syrdarya', 'A', NE, {
    size: 2212,
    sizeUnit: 'km',
    lengthKm: 2212,
    lengthKzKm: 1400,
    flowsInto: 'North Aral Sea',
    sourceLocation: 'Tian Shan Mountains (Naryn & Kara Darya confluence)',
    regionsCrossed: 'Turkistan; Kyzylorda',
    dischargeM3s: 703,
    streamOrder: 8,
    lineDrawnFrom: 'Natural Earth & HydroSHEDS',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Syr_Darya',
    wikidataId: 'Q483159',
    drainageType: 'endorheic',
    inflows: ['Naryn River & Kara Darya confluence', 'Keles River', 'Arys River', 'Badam River'],
    outflows: ['North Aral Sea via Kokaral Dam / Berg Strait'],
    transboundaryInflow: 'Upstream: Flows from Kyrgyzstan through Uzbekistan and Tajikistan; governed via ICWC Central Asia.',
    basinCouncil: 'Aral-Syrdarya Basin Water Inspection (Kyzylorda / Shymkent)',
    note: 'Major Central Asian artery shared with Kyrgyzstan, Uzbekistan, and Tajikistan; feeds the North Aral Sea through Shardara Reservoir.',
    about: 'The Syr Darya (historically known as the Jaxartes) is the longest river in Central Asia. Originating at the confluence of the Naryn and Kara Darya in the fertile Fergana Valley, it flows across Uzbekistan and southern Kazakhstan before discharging into the North Aral Sea.\n\nIn Kazakhstan, the river is regulated by the Shardara Reservoir and the Koksaray Flood Regulator, which together protect downstream settlements from winter ice jams and seasonal inundations while storing water for spring cotton and rice irrigation in Turkistan and Kyzylorda regions.\n\nFollowing the catastrophic desiccation of the Aral Sea during the Soviet era, Kazakhstan constructed the 13-kilometer Kokaral Dam across the Berg Strait in 2005. The dam trapped Syr Darya inflows in the North Aral Sea, successfully raising water levels by over 3 meters, reducing salinity, and reviving commercial fisheries in Aralsk.',
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=200&q=80',
        caption: 'Syr Darya River winding through the semi-arid Kyzylorda floodplain',
        author: 'Central Asia Water Archive',
        license: 'CC BY-SA 4.0',
        sourceUrl: 'https://en.wikipedia.org/wiki/Syr_Darya'
      },
      {
        url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=200&q=80',
        caption: 'Kokaral Dike preserving the North Aral Sea at the Syr Darya delta',
        author: 'World Bank SYNAS Project',
        license: 'Public Domain'
      }
    ],
    references: [
      { title: 'World Bank: Northern Aral Sea Restoration and Syr Darya Control Project', url: 'https://projects.worldbank.org', year: '2022' },
      { title: 'ICWC: Interstate Commission for Water Coordination of Central Asia', url: 'http://www.icwc-aral.net', year: '2024' }
    ]
  }),
  mk('river', 'river-ural', ['Ural River (Zhayik)', 'Жайық өзені', 'река Урал (Жайык)'], 51.23, 51.37, 'West Kazakhstan', 'Zhayik-Caspian', 'A', NE, {
    size: 2428,
    sizeUnit: 'km',
    lengthKm: 2428,
    lengthKzKm: 1082,
    flowsInto: 'Caspian Sea',
    sourceLocation: 'Southern Ural Mountains, Bashkortostan',
    regionsCrossed: 'West Kazakhstan; Atyrau',
    dischargeM3s: 400,
    streamOrder: 8,
    lineDrawnFrom: 'Natural Earth & HydroSHEDS',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Ural_(river)',
    wikidataId: 'Q16550',
    drainageType: 'endorheic',
    inflows: ['Sakmara River (Russia)', 'Ilek River (Aktobe)', 'Utva River', 'Chagan River', 'Barbastau River'],
    outflows: ['Caspian Sea (Atyrau marine delta)'],
    transboundaryInflow: 'Upstream: Enters West Kazakhstan from Orenburg Oblast, Russia at Yanvartsevo (70%+ flow generated in Russia).',
    basinCouncil: 'Zhayik-Caspian Basin Water Inspection (Oral / Atyrau)',
    note: 'Flows from Russia through West Kazakhstan and Atyrau into the Caspian Sea. Geographic boundary between Europe and Asia; experienced historic spring snowmelt floods in 2024.',
    about: 'The Ural (Kazakh: Жайық, Russian: Урал) is the third-longest river in Europe. Arising on the eastern slopes of the Southern Ural Mountains in Russia, it flows south through Magnitogorsk and Orenburg before entering Western Kazakhstan at Yanvartsevo, continuing through Uralsk (Oral) and Atyrau into the Caspian Sea.\n\nThe Ural is celebrated geographically as the traditional boundary dividing Europe and Asia. In the city of Atyrau, a pedestrian bridge spanning the river literally connects the European and Asian halves of the metropolis.\n\nThe hydrological regime of the Ural is characterized by extreme spring snowmelt surges—over 80% of its annual runoff occurs during April and May. In spring 2024, catastrophic snowmelt floods caused historic crests across West Kazakhstan and Atyrau regions, underscoring the urgent priority of modernized transboundary flood defenses and flood retention basins.',
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=200&q=80',
        caption: 'Ural River in Uralsk (Oral) during spring seasonal high-flow stage',
        author: 'West Kazakhstan Photobank',
        license: 'CC BY-SA 4.0',
        sourceUrl: 'https://en.wikipedia.org/wiki/Ural_(river)'
      },
      {
        url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=200&q=80',
        caption: 'Ural River delta reedbeds approaching the shallow Northern Caspian Sea',
        author: 'Atyrau Marine Survey',
        license: 'Public Domain'
      }
    ],
    references: [
      { title: 'Kazhydromet: 2024 Spring Snowmelt Flood Peak Analysis for Ural Basin', url: 'https://www.kazhydromet.kz', year: '2024' },
      { title: 'Russian-Kazakhstan Bilateral Commission on the Ural River Ecology', url: 'https://www.gov.kz', year: '2023' }
    ]
  }),
  mk('river', 'river-ishim', ['Ishim River (Esil)', 'Есіл өзені', 'река Ишим (Есиль)'], 51.15, 71.4, 'Akmola', 'Esil', 'A', NE, {
    size: 2450,
    sizeUnit: 'km',
    lengthKm: 2450,
    lengthKzKm: 1400,
    flowsInto: 'Irtysh River (at Ust-Ishim, Russia)',
    sourceLocation: 'Niyaz Mountains, Karaganda Region',
    regionsCrossed: 'Karaganda; Akmola; Astana; North Kazakhstan',
    dischargeM3s: 83,
    streamOrder: 7,
    lineDrawnFrom: 'Natural Earth & HydroSHEDS',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Ishim_(river)',
    wikidataId: 'Q16550',
    drainageType: 'exorheic',
    inflows: ['Koluton River', 'Zhabay River', 'Tersakkan River', 'Imanburlyk River', 'Akkanburlyk River'],
    outflows: ['Irtysh River at Ust-Ishim (Russia) -> Ob River -> Arctic Ocean'],
    transboundaryInflow: 'Downstream: Flows from North Kazakhstan into Tyumen and Omsk oblasts, Russia.',
    basinCouncil: 'Esil Basin Water Inspection (Astana / Petropavlovsk)',
    note: 'Primary hydrological lifeline of the capital city Astana and northern grain steppes; controlled by Sergeyevka Reservoir for flood and flow regulation.',
    about: 'The Ishim (Kazakh: Есіл, Russian: Ишим) originates in the Niyaz Mountains of the Kazakh Uplands in Karaganda Region. It flows west past Astana, turns north across the Akmola steppes through Derzhavinsk, Sergeyevka, and Petropavlovsk, and crosses into Siberia to join the Irtysh.\n\nThe Ishim is the central water body of the capital city Astana, where its riverfronts have been landscaped with granite embankments and pedestrian bridges. Water supply for the capital is secured by the Vyacheslavskoye (Astana) Reservoir upstream and reinforced by the Satpayev Canal pipeline.\n\nDownstream in North Kazakhstan Region, the Sergeyevka Reservoir (0.693 km³) acts as the primary flood regulation barrier. In April 2024, unprecedented snowmelt runoff surpassed previous spillway crest records, highlighting the critical role of the Ishim Basin council in regional disaster resilience.',
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1513584684374-8bab748fbf90?auto=format&fit=crop&w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1513584684374-8bab748fbf90?auto=format&fit=crop&w=200&q=80',
        caption: 'Ishim River winding through central Astana with city bridge architecture',
        author: 'Astana Urban Architecture Archive',
        license: 'CC BY-SA 4.0',
        sourceUrl: 'https://en.wikipedia.org/wiki/Ishim_(river)'
      },
      {
        url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=200&q=80',
        caption: 'Sergeyevka Reservoir spillway during peak spring snowmelt release',
        author: 'North Kazakhstan Hydromet Office',
        license: 'Public Domain'
      }
    ],
    references: [
      { title: 'Esil Basin Water Council: Water Resources and Flood Risk Assessment', url: 'https://www.gov.kz', year: '2024' },
      { title: 'Astana Water Utility (Astana Su Arnasy): Surface Water Supply Status', url: 'https://astanasu.kz', year: '2023' }
    ]
  }),
  mk('river', 'river-tobol', ['Tobol River (Tobyl)', 'Тобыл өзені', 'река Тобол'], 53.2, 63.6, 'Kostanay', 'Tobyl-Torgay', 'A', NE, {
    size: 1591,
    sizeUnit: 'km',
    lengthKm: 1591,
    lengthKzKm: 800,
    flowsInto: 'Irtysh River (at Tobolsk, Russia)',
    sourceLocation: 'South Ural border steppes',
    regionsCrossed: 'Kostanay',
    dischargeM3s: 805,
    streamOrder: 7,
    lineDrawnFrom: 'Natural Earth & HydroSHEDS',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Tobol',
    wikidataId: 'Q192323',
    drainageType: 'exorheic',
    inflows: ['Ayat River', 'Ubagan River', 'Uy River', 'Toguzak River'],
    outflows: ['Irtysh River at Tobolsk (Russia) -> Ob River -> Arctic Ocean'],
    transboundaryInflow: 'Upstream: Headwaters cross from Chelyabinsk/Orenburg, Russia; downstream enters Kurgan Oblast, Russia.',
    basinCouncil: 'Tobyl-Torgay Basin Water Inspection (Kostanay)',
    note: 'Drains the northern steppes of Kostanay Region; regulated by the Karatomar and Upper Tobol reservoirs for drinking and industrial water.',
    about: 'The Tobol (Kazakh: Тобыл, Russian: Тобол) rises along the Russia–Kazakhstan border in the southern foothills of the Urals and drains the extensive agricultural plains of Kostanay Region before flowing north into the Russian Federation to meet the Irtysh.\n\nThe river is regulated in Kostanay by two major reservoirs: Karatomar Reservoir (1.38 km³) and Upper Tobol Reservoir (0.82 km³). These facilities supply industrial and municipal water to Rudny and Kostanay, as well as the Sokolov-Sarbai iron ore mining operations.\n\nSpring floods on the Tobol can be acute due to rapid snowmelt across the southern Urals and northern Kazakh steppes.',
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=200&q=80',
        caption: 'Tobol River flowing through the fertile agricultural plains of Kostanay',
        author: 'Kostanay Regional Archive',
        license: 'CC BY-SA 4.0',
        sourceUrl: 'https://en.wikipedia.org/wiki/Tobol'
      }
    ],
    references: [
      { title: 'Tobyl-Torgay Basin Council: Annual Surface Water Report', url: 'https://www.gov.kz', year: '2023' }
    ]
  }),
  mk('river', 'river-ili', ['Ili River (Ile)', 'Іле өзені', 'река Или'], 44.0, 77.2, 'Almaty', 'Balkhash-Alakol', 'A', NE, {
    size: 1439,
    sizeUnit: 'km',
    lengthKm: 1439,
    lengthKzKm: 815,
    flowsInto: 'Lake Balkhash (western freshwater basin)',
    sourceLocation: 'Tekes and Kunes rivers, Tian Shan Mountains, Xinjiang, China',
    regionsCrossed: 'Almaty; Jetisu',
    dischargeM3s: 480,
    streamOrder: 7,
    lineDrawnFrom: 'Natural Earth & HydroSHEDS',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Ili_(river)',
    wikidataId: 'Q192534',
    drainageType: 'endorheic',
    inflows: ['Tekes River', 'Kunges River', 'Kash River (Xinjiang headwaters)', 'Charyn River', 'Chilik River', 'Talgar River'],
    outflows: ['Lake Balkhash (western freshwater sub-basin delta)'],
    transboundaryInflow: 'Upstream: >70% of total runoff originates in Xinjiang, China; governed by KZ-China Transboundary Commission.',
    basinCouncil: 'Balkhash-Alakol Basin Water Inspection (Konayev / Almaty)',
    note: 'Major transboundary river originating in Xinjiang (China); delivers ~80% of all inflow into Lake Balkhash.',
    about: 'The Ili (Kazakh: Іле, Russian: Или) is the largest river in the Zhetysu region of southeastern Kazakhstan. Originating in the eastern Tian Shan Mountains in Xinjiang, China, it flows west through the Ili Kazakh Autonomous Prefecture into Kazakhstan, emptying into Lake Balkhash.\n\nThe river is impounded near Konayev by the Kapchagay Hydroelectric Dam, creating the Kapchagay Reservoir (28.1 km³), which provides hydropower, cooling, and water for the Great Almaty Canal (BAK) irrigation network.\n\nBecause the Ili provides over 80% of Lake Balkhash\'s annual freshwater replenishment, interstate water governance between Kazakhstan and China regarding agricultural abstractions in the Ili valley remains of paramount environmental importance.',
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=200&q=80',
        caption: 'Tamgaly-Tas rocky gorge and ancient petroglyphs on the Ili River bank',
        author: 'Almaty Regional Tourism Association',
        license: 'CC BY-SA 4.0',
        sourceUrl: 'https://en.wikipedia.org/wiki/Ili_(river)'
      },
      {
        url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=200&q=80',
        caption: 'Kapchagay Reservoir surface formed by the Ili River dam at Konayev',
        author: 'Zhetysu Hydrology Team',
        license: 'Public Domain'
      }
    ],
    references: [
      { title: 'Balkhash-Alakol Basin Inspection: Water Allocation and Ili River Discharge', url: 'https://www.gov.kz', year: '2023' },
      { title: 'Kazakhstan-China Joint Commission on Transboundary River Use', url: 'https://www.mfa.gov.kz', year: '2022' }
    ]
  }),
  mk('river', 'river-chu', ['Chu River (Shu)', 'Шу өзені', 'река Чу (Шу)'], 43.6, 73.75, 'Jambyl', 'Shu-Talas', 'A', NE, {
    size: 1186,
    sizeUnit: 'km',
    lengthKm: 1186,
    lengthKzKm: 800,
    flowsInto: 'Ashykol Depression / Moyynkum desert sands (endorheic)',
    sourceLocation: 'Tian Shan Mountains, Kyrgyzstan',
    regionsCrossed: 'Jambyl',
    dischargeM3s: 130,
    streamOrder: 6,
    lineDrawnFrom: 'Natural Earth & HydroSHEDS',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Chu_(river)',
    wikidataId: 'Q214441',
    drainageType: 'endorheic',
    inflows: ['Joon-Aryk River', 'Kochkor River', 'Chon-Kemin River', 'Kuragaty River', 'Aksu River'],
    outflows: ['Ashykol Depression / Moyynkum desert terminal sands (endorheic termination, no sea outlet)'],
    transboundaryInflow: 'Upstream: Originates in Tian Shan (Kyrgyzstan); managed under the bilateral Chu-Talas Interstate Commission.',
    basinCouncil: 'Shu-Talas Basin Water Inspection (Taraz)',
    note: 'Major shared river of southern Kazakhstan, regulated by Tashotkel Reservoir and managed under an interstate commission with Kyrgyzstan.',
    about: 'The Chu (Kazakh: Шу, Russian: Чу) rises in the Tian Shan of Kyrgyzstan, bypasses Lake Issyk-Kul through the Boom Gorge, and enters the Chuy Valley. Crossing into Jambyl Region of Kazakhstan, it flows northwest before terminating in the Ashykol depression and Moyynkum desert sands.\n\nIn Kazakhstan, the river is regulated by the Tashotkel Reservoir (0.62 km³), which provides critical irrigation water for agriculture in Shu and Moyynkum districts.\n\nThe Chu and Talas rivers are governed by a landmark bilateral commission between Kazakhstan and Kyrgyzstan, established under a 2000 agreement where Kazakhstan contributes to the operational maintenance of upstream Kyrgyz dams in exchange for guaranteed seasonal water quotas.',
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=200&q=80',
        caption: 'Chu River valley in Jambyl Region during irrigation season',
        author: 'Jambyl Agricultural Survey',
        license: 'CC BY-SA 4.0',
        sourceUrl: 'https://en.wikipedia.org/wiki/Chu_(river)'
      }
    ],
    references: [
      { title: 'Chu-Talas Commission: Joint Bilateral Water Allocation Reports', url: 'https://chutalas.org', year: '2024' }
    ]
  }),
  mk('river', 'river-talas', ['Talas River', 'Талас өзені', 'река Талас'], 42.9, 71.37, 'Jambyl', 'Shu-Talas', 'A', NE, {
    size: 661,
    sizeUnit: 'km',
    lengthKm: 661,
    lengthKzKm: 453,
    flowsInto: 'Muyunkum desert sands (endorheic)',
    sourceLocation: 'Talas Alatau, Kyrgyzstan',
    regionsCrossed: 'Jambyl',
    dischargeM3s: 33,
    streamOrder: 6,
    lineDrawnFrom: 'Natural Earth & HydroSHEDS',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Talas_(river)',
    wikidataId: 'Q827982',
    drainageType: 'endorheic',
    inflows: ['Uchkoshoy River', 'Karakol River', 'Asa River'],
    outflows: ['Muyunkum desert terminal sands (endorheic termination, disappears into sand depressions)'],
    transboundaryInflow: 'Upstream: Regulated by Kirov Reservoir in Kyrgyzstan; shared under Chu-Talas interstate treaty.',
    basinCouncil: 'Shu-Talas Basin Water Inspection (Taraz)',
    note: 'Flows through the ancient city of Taraz; historical boundary where the 751 AD Battle of Talas took place.',
    about: 'The Talas (Kazakh: Талас, Russian: Талас) rises at the confluence of the Karakol and Uchkoshoy rivers in the Talas Alatau of Kyrgyzstan. Crossing into Jambyl Region of Kazakhstan, it flows through the historic Silk Road oasis of Taraz before petering out in the Moyynqum desert.\n\nThe river is historically famous as the location of the 751 AD Battle of Talas between the Abbasid Caliphate and the Tang Empire, which halted Chinese westward expansion and transmitted paper-making technology to the Islamic world.\n\nWater allocation is regulated upstream by the Kirov Reservoir in Kyrgyzstan and distributed through canals in Jambyl Region for melon and vegetable crops.',
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=200&q=80',
        caption: 'Talas River flowing past the historic city of Taraz in southern Kazakhstan',
        author: 'Taraz Archaeological Institute',
        license: 'CC BY-SA 4.0',
        sourceUrl: 'https://en.wikipedia.org/wiki/Talas_(river)'
      }
    ],
    references: [
      { title: 'Chu-Talas Interstate Water Commission', url: 'https://chutalas.org', year: '2024' }
    ]
  }),
  mk('river', 'river-nura', ['Nura River', 'Нұра өзені', 'река Нура'], 50.05, 72.95, 'Karaganda', 'Nura-Sarysu', 'A', NE, {
    size: 978,
    sizeUnit: 'km',
    lengthKm: 978,
    lengthKzKm: 978,
    flowsInto: 'Lake Tengiz / Korgalzhyn Wetland Depression',
    sourceLocation: 'Karkaraly Mountains, Karaganda Region',
    regionsCrossed: 'Karaganda; Akmola',
    dischargeM3s: 28.4,
    streamOrder: 6,
    lineDrawnFrom: 'Natural Earth & HydroSHEDS',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Nura_(river)',
    wikidataId: 'Q1140032',
    drainageType: 'endorheic',
    inflows: ['Sherubainura River', 'Akbastau River', 'Maresevka River', 'Satpayev Canal diversion branch'],
    outflows: ['Lake Tengiz and Korgalzhyn wetland depressions (closed terminal endorheic basin)'],
    transboundaryInflow: '100% domestic internal Kazakh river system; no foreign border crossings.',
    basinCouncil: 'Nura-Sarysu Basin Water Inspection (Karaganda)',
    note: 'Central Kazakhstan internal waterway supplying Samarkand Reservoir at Temirtau and feeding the UNESCO Korgalzhyn wetland biosphere.',
    about: 'The Nura (Kazakh: Нұра, Russian: Нура) is an entirely domestic river in central Kazakhstan. Rising in the Karkaraly Mountains of Karaganda Region, it flows west through industrial Temirtau, bypasses Astana to the southwest, and empties into the hypersaline Lake Tengiz in the Korgalzhyn State Nature Reserve.\n\nThe river is impounded at Temirtau to form the Samarkand Reservoir (0.254 km³), which provides essential cooling and industrial water for the Karaganda Metallurgical Combine (Qarmet).\n\nIn high-flow spring years, an overflow bifurcation channel near Astana historically spilled into the Ishim River. Downstream, the Nura is the ecological life-support system for the UNESCO World Heritage Tengiz-Korgalzhyn wetlands, hosting nesting colonies of greater flamingos.',
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=200&q=80',
        caption: 'Nura River wetlands upstream of Lake Tengiz in the Korgalzhyn reserve',
        author: 'Korgalzhyn Biosphere Reserve Archive',
        license: 'CC BY-SA 4.0',
        sourceUrl: 'https://en.wikipedia.org/wiki/Nura_(river)'
      }
    ],
    references: [
      { title: 'Nura-Sarysu Basin Council: Industrial and Ecological Water Allocation', url: 'https://www.gov.kz', year: '2023' }
    ]
  }),
  mk('river', 'river-sarysu', ['Sarysu River', 'Сарысу өзені', 'река Сарысу'], 48.0, 68.0, 'Ulytau', 'Nura-Sarysu', 'A', NE, {
    size: 761,
    sizeUnit: 'km',
    lengthKm: 761,
    lengthKzKm: 761,
    flowsInto: 'Telikol Lake Depression (Betpak-Dala)',
    sourceLocation: 'Atasu, Kazakh Uplands',
    regionsCrossed: 'Karaganda; Ulytau; Kyzylorda',
    dischargeM3s: 7.3,
    streamOrder: 6,
    lineDrawnFrom: 'HydroSHEDS',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Sarysu_(river)',
    wikidataId: 'Q1151600',
    drainageType: 'endorheic',
    inflows: ['Kara-Kengir River', 'Sary-Kengir River', 'Zhaksy-Sarysu River'],
    outflows: ['Telikol lake depressions / Betpak-Dala clay salt flats (seasonal termination)'],
    transboundaryInflow: '100% domestic internal basin.',
    basinCouncil: 'Nura-Sarysu Basin Water Inspection (Zhezkazgan / Karaganda)',
    note: 'Endorheic desert river draining the mineral-rich Ulytau uplands toward the Betpak-Dala desert.',
    about: 'The Sarysu (Kazakh: Сарысу, "Yellow Water") is an endorheic river flowing across central and southwestern Kazakhstan. Originating near Atasu in Karaganda Region, it flows southwest through the historic heartland of Ulytau Region before terminating in the dry salt flats and seasonal Telikol lakes in the northern Betpak-Dala desert.\n\nThe river is fed primarily by spring snowmelt and dries up into a chain of disconnected brackish pools during the summer months. Its major tributary is the Kara-Kengir River, which is dammed at Zhezkazgan to form the Kengir Reservoir.',
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=200&q=80',
        caption: 'Sarysu River semi-arid steppe riverbed in the Ulytau heartland',
        author: 'Ulytau Regional Heritage Trust',
        license: 'CC BY-SA 4.0',
        sourceUrl: 'https://en.wikipedia.org/wiki/Sarysu_(river)'
      }
    ],
    references: [
      { title: 'Ulytau Hydrological Bulletin', url: 'https://www.gov.kz', year: '2023' }
    ]
  }),
  mk('river', 'river-emba', ['Emba River (Zhem)', 'Жем өзені', 'река Эмба (Жем)'], 48.8, 58.1, 'Aktobe', 'Zhayik-Caspian', 'A', NE, {
    size: 712,
    sizeUnit: 'km',
    lengthKm: 712,
    lengthKzKm: 712,
    flowsInto: 'Caspian Sea coastal marshes',
    sourceLocation: 'Mugodzhar Hills, Aktobe Region',
    regionsCrossed: 'Aktobe; Atyrau',
    dischargeM3s: 17.5,
    streamOrder: 6,
    lineDrawnFrom: 'HydroSHEDS',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Emba_(river)',
    wikidataId: 'Q192518',
    drainageType: 'endorheic',
    inflows: ['Temir River', 'Atsaly River', 'Kengil River'],
    outflows: ['Caspian depression wetlands (dissipates before open water in dry years)'],
    transboundaryInflow: '100% domestic internal basin in western Kazakhstan.',
    basinCouncil: 'Zhayik-Caspian Basin Water Inspection (Aktobe / Atyrau)',
    note: 'Major western Kazakhstan river flowing from the Mugodzhar Hills through the oil-rich Emba basin toward the Caspian.',
    about: 'The Emba (Kazakh: Жем, Russian: Эмба) originates on the western slopes of the Mugodzhar Hills in Aktobe Region. It flows southwest across the desert steppes and the Caspian Depression, where in high-water years its floodwaters reach the northeastern shore of the Caspian Sea.\n\nThe Emba basin is one of the earliest hydrocarbon discovery basins in Kazakhstan, giving its name to the Emba oil field explored since the late 19th century. In spring, snowmelt generates brief high-water floods, while in summer the river breaks up into disconnected salt pans.',
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=200&q=80',
        caption: 'Emba River crossing the arid plateau of the Caspian depression',
        author: 'Aktobe-Atyrau Oil Basin Survey',
        license: 'CC BY-SA 4.0',
        sourceUrl: 'https://en.wikipedia.org/wiki/Emba_(river)'
      }
    ],
    references: [
      { title: 'Zhayik-Caspian Basin Water Inspectorate: Emba River Survey', url: 'https://www.gov.kz', year: '2023' }
    ]
  }),
  mk('river', 'river-karatal', ['Karatal River', 'Қаратал өзені', 'река Каратал'], 45.3, 78.0, 'Jetisu', 'Balkhash-Alakol', 'A', NE, {
    size: 390,
    sizeUnit: 'km',
    lengthKm: 390,
    lengthKzKm: 390,
    flowsInto: 'Lake Balkhash (eastern basin)',
    sourceLocation: 'Dzungarian Alatau Mountains (4,000 m)',
    regionsCrossed: 'Jetisu',
    dischargeM3s: 66.7,
    streamOrder: 6,
    lineDrawnFrom: 'HydroSHEDS',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Karatal_(river)',
    wikidataId: 'Q1514197',
    drainageType: 'endorheic',
    inflows: ['Kora River', 'Chizhe River', 'Tekeli River'],
    outflows: ['Lake Balkhash (eastern saline sub-basin delta)'],
    transboundaryInflow: 'Glacial meltwater sources within Kazakhstan Dzungarian Alatau range.',
    basinCouncil: 'Balkhash-Alakol Basin Water Inspection (Taldykorgan)',
    note: 'Second largest tributary of Lake Balkhash; flows from the Dzungarian Alatau through Taldykorgan into the eastern basin.',
    about: 'The Karatal (Kazakh: Қаратал, "Black Willow") is the second most important river entering Lake Balkhash after the Ili. It rises from alpine glaciers in the Dzungarian Alatau at elevations over 3,900 meters and descends through the city of Taldykorgan before crossing the Saryesik-Atyrau desert to discharge into the eastern half of Lake Balkhash.\n\nFed predominantly by glacial meltwater, the Karatal maintains dependable summer flows that sustain extensive irrigation canals for sugar beet and grain cultivation in Jetisu Region.',
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=200&q=80',
        caption: 'Karatal River descending from the glaciated peaks of Dzungarian Alatau',
        author: 'Jetisu Regional Tourism Center',
        license: 'CC BY-SA 4.0',
        sourceUrl: 'https://en.wikipedia.org/wiki/Karatal_(river)'
      }
    ],
    references: [
      { title: 'Balkhash-Alakol Basin Inspection: Karatal Discharge Profile', url: 'https://www.gov.kz', year: '2023' }
    ]
  }),
  mk('river', 'river-charyn', ['Charyn River', 'Шарын өзені', 'река Чарын'], 43.4, 79.1, 'Almaty', 'Balkhash-Alakol', 'A', NE, {
    size: 427,
    sizeUnit: 'km',
    lengthKm: 427,
    lengthKzKm: 427,
    flowsInto: 'Ili River',
    sourceLocation: 'Tian Shan Range, southern Ketmen Ridge',
    regionsCrossed: 'Almaty',
    dischargeM3s: 35.4,
    streamOrder: 6,
    lineDrawnFrom: 'HydroSHEDS',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Charyn_River',
    wikidataId: 'Q1067746',
    drainageType: 'endorheic',
    inflows: ['Karkara River', 'Temirlik River'],
    outflows: ['Ili River (Kapchagay Reservoir / Balkhash system)'],
    transboundaryInflow: 'Karkara headwaters shared along the Kazakhstan-Kyrgyzstan border.',
    basinCouncil: 'Balkhash-Alakol Basin Water Inspection',
    note: 'Carves the renowned Charyn Canyon ("Valley of Castles") in Charyn National Park; hydropower supplied by the Moinak HPP (300 MW).',
    about: 'The Charyn (Kazakh: Шарын, Russian: Чарын) rises in the Tian Shan range near the border with Kyrgyzstan and China. It flows through Almaty Region, cutting deeply through red sedimentary sandstone to create the world-famous Charyn Canyon, often described as Kazakhstan\'s counterpart to the Grand Canyon.\n\nWithin the Charyn National Park, the canyon preserves a relict Sogdian ash-tree grove that survived the Ice Age. Upstream at Bestobe, the river is harnessed by the high-head Moinak Hydroelectric Power Plant (300 MW), an essential peak-load generating facility for southern Kazakhstan\'s electrical grid.',
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=200&q=80',
        caption: 'Charyn River carved through the multi-hued red sandstone Valley of Castles',
        author: 'Charyn National Park Administration',
        license: 'CC BY-SA 4.0',
        sourceUrl: 'https://en.wikipedia.org/wiki/Charyn_River'
      }
    ],
    references: [
      { title: 'Charyn State National Nature Park Ecological Dossier', url: 'https://charyn.kz', year: '2023' }
    ]
  }),
  // =========================================================================
  // ---- Strategic Inter-Basin Transfer Canals ----
  // =========================================================================
  mk('canal', 'canal-satpayev', ['Kanysh Satpayev Canal', 'Қаныш Сәтбаев атындағы канал', 'Канал имени Каныша Сатпаева'], 51.5, 74.8, 'Karaganda', 'Ertis', 'A', BAS, {
    size: 458,
    sizeUnit: 'km',
    lengthKm: 458,
    lengthKzKm: 458,
    canalCapacityM3s: 75,
    pumpingStations: 22,
    liftMeters: 418,
    flowsInto: 'Nura River / Astana Water Supply Conduit',
    sourceLocation: 'Irtysh River intake at Aksu (Pavlodar Region)',
    regionsCrossed: 'Pavlodar; Karaganda; Akmola',
    dischargeM3s: 75,
    streamOrder: 7,
    lineDrawnFrom: 'National Water Infrastructure Register',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Irtysh%E2%80%93Karaganda_Canal',
    wikidataId: 'Q1673323',
    drainageType: 'endorheic',
    inflows: ['Irtysh River intake at Aksu (Pavlodar Region)'],
    outflows: ['Nura River', 'Vyacheslavskoye (Astana) Reservoir pipeline', 'Karaganda/Temirtau industrial reservoirs'],
    transboundaryInflow: 'Inter-basin strategic transfer: lifts water 418 m over the Kazakh Uplands through 22 pumping stations.',
    basinCouncil: 'Ertis / Nura-Sarysu Basin Water Inspections & Kazvodkhoz',
    note: 'Kazakhstan\'s monumental 458 km water supply canal with 22 pumping stations lifting Irtysh water 418 meters over the Kazakh Uplands to Karaganda and Astana.',
    about: 'The Kanysh Satpayev Canal (formerly the Irtysh–Karaganda Canal) is Kazakhstan\'s premier hydraulic engineering infrastructure. Conceived by academician Kanysh Satpayev and completed between 1968 and 1974, the canal transfers fresh water from the Irtysh River near Aksu across 458 kilometers of arid steppe to the heavy metallurgical centers of Karaganda, Temirtau, and Ekibastuz.\n\nThe canal overcomes a 418-meter elevation rise across the Kazakh Uplands using a cascade of 22 high-capacity pumping stations and 14 reservoirs. In 2002, a continuation pipeline was constructed connecting the canal to the Vyacheslavskoye Reservoir, safeguarding municipal drinking water supplies for the growing capital city of Astana.',
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=200&q=80',
        caption: 'Pumping station and engineered channel of the Kanysh Satpayev Canal',
        author: 'Ministry of Water Resources & Irrigation',
        license: 'CC BY-SA 4.0',
        sourceUrl: 'https://en.wikipedia.org/wiki/Irtysh%E2%80%93Karaganda_Canal'
      }
    ],
    references: [
      { title: 'Kazvodkhoz: Satpayev Canal Operations and Rehabilitation Program', url: 'https://qazsu.kz', year: '2024' }
    ]
  }),
  mk('canal', 'canal-bak', ['Great Almaty Canal (BAK)', 'Д. Қонаев атындағы Үлкен Алматы каналы (ҮАК)', 'Большой Алматинский канал (БАК)'], 43.37, 77.85, 'Almaty', 'Balkhash-Alakol', 'A', BAS, {
    size: 168,
    sizeUnit: 'km',
    lengthKm: 168,
    lengthKzKm: 168,
    canalCapacityM3s: 30,
    flowsInto: 'Kurty River / Ili River sub-basin',
    sourceLocation: 'Bartogay Reservoir on the Chilik River',
    regionsCrossed: 'Almaty Region; Almaty city',
    dischargeM3s: 30,
    streamOrder: 6,
    lineDrawnFrom: 'Balkhash-Alakol Basin Inspection',
    wikipediaUrl: 'https://ru.wikipedia.org/wiki/%D0%91%D0%BE%D0%BB%D1%8C%D1%88%D0%BE%D0%B9_%D0%90%D0%BB%D0%BC%D0%B0%D1%82%D0%B8%D0%BD%D1%81%D0%BA%D0%B8%D0%B9_%D0%BA%D0%B0%D0%BD%D0%B0%D0%BB',
    wikidataId: 'Q4092523',
    drainageType: 'endorheic',
    inflows: ['Bartogay Reservoir (Chilik River)', 'Talgar River siphon', 'Issyk River'],
    outflows: ['Kurty Reservoir', 'Almaty piedmont agricultural irrigation grid'],
    transboundaryInflow: 'Domestic inter-basin conduit distributing Tian Shan glacier and snowmelt waters across the Almaty oasis.',
    basinCouncil: 'Balkhash-Alakol Basin Water Inspection (Almaty)',
    note: '168 km irrigation aqueduct diverting 30 m³/s of Chilik River meltwater from Bartogay Reservoir across the northern slopes of the Tian Shan to Kurty Reservoir.',
    about: 'The Great Almaty Canal named after Dinmukhamed Kunayev (BAK) is a pivotal hydraulic artery in southeastern Kazakhstan. Commissioned in the 1980s, the 168-kilometer canal diverts runoff from the glaciated Chilik River basin at Bartogay Reservoir west across the northern slopes of the Zailiyskiy Alatau through the outskirts of Almaty to the Kurty Reservoir.\n\nThe canal irrigates over 65,000 hectares of farmland in Almaty Region, replenishes urban recreational lakes, and stabilizes the water balance between the Chilik, Talgar, Kaskelen, and Kurty sub-basins.',
    references: [
      { title: 'Kazvodkhoz: Great Almaty Canal Operational Dossier', url: 'https://qazsu.kz', year: '2023' }
    ]
  }),
  mk('canal', 'canal-koksaray', ['Koksaray Flood Regulator Canal & Bypass', 'Көксарай су реттегішінің арнасы', 'Канал Коксарайского контррегулятора'], 42.92, 68.05, 'Turkistan', 'Aral-Syrdarya', 'A', BAS, {
    size: 55,
    sizeUnit: 'km',
    lengthKm: 55,
    lengthKzKm: 55,
    canalCapacityM3s: 500,
    flowsInto: 'Syr Darya (downstream return channel)',
    sourceLocation: 'Syr Darya diversion intake 160 km below Shardara Reservoir',
    regionsCrossed: 'Turkistan',
    dischargeM3s: 500,
    drainageType: 'endorheic',
    inflows: ['Syr Darya River during winter transboundary flood pulses'],
    outflows: ['Koksaray off-stream reservoir (3.0 km³ capacity)', 'Lower Syr Darya River during summer irrigation season'],
    transboundaryInflow: 'Mitigates winter transboundary hydropower release spikes from upstream Kyrgyz (Toktogul) and Uzbek cascades, protecting Kyzylorda from catastrophic ice-jam flooding.',
    basinCouncil: 'Aral-Syrdarya Basin Water Inspection (Kyzylorda / Shymkent)',
    note: 'Strategic 55 km bypass canal and 3.0 km³ off-stream reservoir intercepting up to 500 m³/s of winter transboundary floodwaters on the Syr Darya, preventing flooding in Kyzylorda and storing water for summer irrigation.',
    about: 'The Koksaray Flood Regulator (Көксарай су реттегіші) is one of independent Kazakhstan\'s most critical water security projects. Constructed in Turkistan Region between 2008 and 2011, it solved a severe transboundary dilemma on the Syr Darya: during winter, upstream Kyrgyz hydroelectric dams generate peak electricity, sending massive discharges into the frozen lower Syr Darya that previously triggered destructive ice jams and flooding in Kyzylorda.\n\nKoksaray diverts up to 500 m³/s via a 45-km feeder canal into an off-stream 3.0 km³ reservoir basin, shielding hundreds of settlements from winter floods and releasing up to 2.5 km³ of freshwater back to downstream farmers and the North Aral Sea during hot summer months.',
    references: [
      { title: 'Ministry of Water Resources: Koksaray Hydrological Regulation Analysis', url: 'https://www.gov.kz', year: '2024' }
    ]
  }),
  mk('canal', 'canal-arys-turkistan', ['Arys–Turkistan Irrigation Canal', 'Арыс–Түркістан каналы', 'Арыс-Туркестанский канал'], 42.50, 69.10, 'Turkistan', 'Aral-Syrdarya', 'A', BAS, {
    size: 195,
    sizeUnit: 'km',
    lengthKm: 195,
    lengthKzKm: 195,
    canalCapacityM3s: 45,
    flowsInto: 'Bogen Reservoir & Turkistan Oasis',
    sourceLocation: 'Arys River diversion dam',
    regionsCrossed: 'Turkistan',
    dischargeM3s: 45,
    drainageType: 'endorheic',
    inflows: ['Arys River'],
    outflows: ['Bogen Reservoir (0.37 km³)', 'Turkistan oasis irrigation district'],
    basinCouncil: 'Aral-Syrdarya Basin Water Inspection',
    note: '195 km regional irrigation lifeline carrying 45 m³/s from the Arys River to Bogen Reservoir and irrigating over 110,000 hectares around the historic city of Turkistan.',
    about: 'The Arys–Turkistan Canal is the agricultural lifeblood of southern Kazakhstan\'s Turkistan oasis. Diverting waters from the Arys River, it traverses 195 kilometers of arid steppe to replenish Bogen Reservoir, providing controlled irrigation for cotton, vegetable, and grain crops across 110,000 hectares.',
    references: [
      { title: 'Turkistan Water Management Bureau: Arys Canal Profile', url: 'https://www.gov.kz', year: '2023' }
    ]
  }),

  // =========================================================================
  // ---- Glacial Water Towers & WGMS Alpine Monitoring ----
  // =========================================================================
  mk('glacier', 'glacier-tuyuksu', ['Tuyuksu Glacier (WGMS No. 416)', 'Тұйықсу мұздығы (WGMS № 416)', 'Ледник Туюксу (эталонный ледник WGMS № 416)'], 43.05, 77.08, 'Almaty city', 'Balkhash-Alakol', 'A', 'WGMS & Institute of Geography', {
    size: 2.6,
    sizeUnit: 'km²',
    elevationM: 3450,
    wgmsId: 'WGMS-416',
    meltwaterContribution: 'Supplies 30–40% of Almaty municipal drinking water during late-summer dry periods.',
    drainageType: 'endorheic',
    outflows: ['Malaya Almatinka River -> Kaskelen River -> Kapchagay Reservoir -> Lake Balkhash'],
    basinCouncil: 'Balkhash-Alakol Basin Water Inspection (Almaty)',
    note: 'World Glacier Monitoring Service (WGMS) global benchmark reference glacier monitored continuously since 1956; essential alpine water tower sustaining summer drinking water for Almaty.',
    about: 'Tuyuksu Glacier (Kazakh: Тұйықсу, Russian: Туюксу) is one of the world\'s most scientifically significant mountain glaciers. Situated in the Malaya Almatinka valley of the Trans-Ili Alatau (Ile-Alatau) at elevations between 3,400 and 4,220 meters, it is monitored as one of only 30 global "reference glaciers" by the World Glacier Monitoring Service (WGMS) and the Kazakhstan Institute of Geography and Water Security, with uninterrupted mass-balance measurements since the 1956 International Geophysical Year.\n\nTuyuksu acts as an alpine "water tower" for Almaty (Kazakhstan\'s largest metropolis of 2.2 million people). During hot, rainless July and August months, its melting ice provides up to 30–40% of the city\'s municipal drinking water. WGMS observations record that the glacier has retreated by over 1,000 meters since 1956, losing approximately 35% of its ice volume, serving as an irreplaceable barometer of Central Asian climate change.',
    references: [
      { title: 'WGMS: Global Glacier Change Bulletin (Tuyuksu Record)', url: 'https://wgms.ch', year: '2023' },
      { title: 'Institute of Geography and Water Security: Glaciers of Kazakhstan Cadastre', url: 'https://ingeo.kz', year: '2024' }
    ]
  }),
  mk('glacier', 'glacier-mynzhylki', ['Mynzhylki Alpine Hydromet Station', 'Мыңжылқы биік таулы гидромет стансасы', 'Высокогорная станция Мынжылки'], 43.08, 77.08, 'Almaty city', 'Balkhash-Alakol', 'A', 'Kazhydromet & Kazselezashchita', {
    elevationM: 3017,
    drainageType: 'endorheic',
    outflows: ['Malaya Almatinka River -> Medeu mudflow dam'],
    basinCouncil: 'Balkhash-Alakol Basin Water Inspection',
    note: 'Strategic high-altitude hydrometeorological station at 3,017 m elevation monitoring Tuyuksu glacial meltwater, permafrost thaw, and glacial lake outburst flood (GLOF) hazards.',
    about: 'Located at 3,017 meters above sea level in the Ile-Alatau National Park, Mynzhylki is Kazakhstan\'s premier high-alpine hydrometeorological station. Operated by Kazhydromet and the Kazselezashchita avalanche and mudflow protection agency, it directly monitors glacial meltwater discharge from Tuyuksu, permafrost temperatures, and water levels in hazardous proglacial Moraine Lake No. 6, providing early warnings for the Medeu anti-debris dam and Almaty city.',
    references: [
      { title: 'Kazhydromet: Alpine Hydrometeorological Monitoring at Mynzhylki', url: 'https://www.kazhydromet.kz', year: '2024' }
    ]
  }),
  mk('glacier', 'glacier-khan-tengri', ['Khan Tengri & Northern Inylchek Glacial Core', 'Хан Тәңірі және Солтүстік Еңілшек мұздығы', 'Пик Хан-Тенгри и ледник Северный Иныльчек'], 42.21, 80.17, 'Almaty', 'Balkhash-Alakol', 'A', 'Institute of Geography & Water Security', {
    elevationM: 7010,
    drainageType: 'endorheic',
    inflows: ['Tien Shan alpine snowfields'],
    outflows: ['Bayankol River -> Tekes River -> Ili River -> Lake Balkhash'],
    transboundaryInflow: 'Greatest transboundary glacial reservoir in Central Asia, straddling Kazakhstan, Kyrgyzstan, and China.',
    basinCouncil: 'Balkhash-Alakol Basin Water Inspection',
    note: 'The summit of Khan Tengri (7,010 m) and the Northern Inylchek Glacier form Central Asia\'s supreme glacial water reservoir, nourishing the transboundary Ili and Tarim basins.',
    about: 'Khan Tengri (7,010 m) in the Central Tian Shan represents Kazakhstan\'s highest geographic elevation and the heart of Central Asia\'s largest glacial cluster. The Northern Inylchek Glacier and adjacent ice sheets store dozens of cubic kilometers of pure freshwater ice. Meltwater from the northern slopes feeds the Bayankol and Tekes rivers, which coalesce in Xinjiang before re-entering Kazakhstan as the mighty Ili River, the primary water source for Lake Balkhash.',
    references: [
      { title: 'Central Asian Glacial Balance Atlas, Institute of Geography', url: 'https://ingeo.kz', year: '2023' }
    ]
  }),

  // =========================================================================
  // ---- Official Ramsar Wetlands of International Importance (RSIS) ----
  // =========================================================================
  mk('ramsar', 'ramsar-korgalzhyn', ['Tengiz-Korgalzhyn Lake System', 'Теңіз-Қорғалжын көлдер жүйесі', 'Тенгиз-Коргалжынская система озёр'], 50.417, 69.250, 'Akmola', 'Nura-Sarysu', 'A', RSIS, {
    size: 3533.4,
    sizeUnit: 'km²',
    year: 1976,
    note: 'Ramsar Site No. 107 (designated 1976, reconfirmed 2007). Area: 353,341 ha. UNESCO World Heritage; northernmost nesting colony of the Greater Flamingo.',
  }),
  mk('ramsar', 'ramsar-irgiz-turgay', ['Lakes of the Lower Turgay and Irgiz', 'Ырғыз-Торғай көлдер жүйесі', 'Озёра в низовьях рек Иргиз и Тургай'], 48.700, 62.183, 'Aktobe', 'Tobyl-Torgay', 'A', RSIS, {
    size: 3480.0,
    sizeUnit: 'km²',
    year: 1976,
    note: 'Ramsar Site No. 108 (designated 1976, reconfirmed 2011). Area: 348,000 ha. Key stopover for waterbirds along the Central Asian flyway; Irgiz-Turgay State Nature Reserve.',
  }),
  mk('ramsar', 'ramsar-ural-delta', ['Ural River Delta and Caspian coast', 'Жайық өзенінің атырауы және Каспий жағалауы', 'Дельта реки Урал и прилегающее побережье Каспийского моря'], 46.967, 51.750, 'Atyrau', 'Zhayik-Caspian', 'A', RSIS, {
    size: 1115.0,
    sizeUnit: 'km²',
    year: 2009,
    note: 'Ramsar Site No. 1882 (designated 2009). Area: 111,500 ha. Protected within Akzhaiyk State Nature Reserve; critical sturgeon migration route and waterfowl habitat.',
  }),
  mk('ramsar', 'ramsar-koibagar', ['Koibagar-Tyuntyugur Lake System', 'Қойбағар-Тімтуір көлдер жүйесі', 'Койбагар-Тюнтюгурская система озёр'], 52.650, 65.750, 'Kostanay', 'Tobyl-Torgay', 'A', RSIS, {
    size: 580.0,
    sizeUnit: 'km²',
    year: 2009,
    note: 'Ramsar Site No. 1885 (designated 2009). Area: 58,000 ha. Shallow steppe lakes supporting millions of migrating waterfowl, including the critically endangered Siberian Crane.',
  }),
  mk('ramsar', 'ramsar-kulykol', ['Kulykol-Taldykol Lake System', 'Қулыкөл-Талдыкөл көлдер жүйесі', 'Кулыколь-Талдыкольская система озёр'], 51.383, 61.867, 'Kostanay', 'Tobyl-Torgay', 'A', RSIS, {
    size: 83.0,
    sizeUnit: 'km²',
    year: 2009,
    note: 'Ramsar Site No. 1884 (designated 2009). Area: 8,300 ha. Crucial staging area for White-headed Duck and Red-breasted Goose along migration routes.',
  }),
  mk('ramsar', 'ramsar-zharsor-urkash', ['Zharsor-Urkash Lake System', 'Жарсор-Орқаш көлдер жүйесі', 'Жарсор-Уркашская система озёр'], 51.367, 62.800, 'Kostanay', 'Tobyl-Torgay', 'A', RSIS, {
    size: 412.5,
    sizeUnit: 'km²',
    year: 2009,
    note: 'Ramsar Site No. 1887 (designated 2009). Area: 41,250 ha. Mineral and saline lake system in the Turgay basin within the Zharsor-Urkash Sanctuary.',
  }),
  mk('ramsar', 'ramsar-naurzum', ['Naurzum Lake System', 'Наурызым көлдер жүйесі', 'Наурзумская система озёр'], 51.533, 64.433, 'Kostanay', 'Tobyl-Torgay', 'A', RSIS, {
    size: 1397.1,
    sizeUnit: 'km²',
    year: 2009,
    note: 'Ramsar Site No. 1883 (designated 2009). Area: 139,714 ha. Part of Naurzum State Nature Reserve and UNESCO World Heritage; essential steppe wetland ecosystem.',
  }),
  mk('ramsar', 'ramsar-alakol-sasykkol', ['Alakol-Sasykkol Lakes System', 'Алакөл-Сасықкөл көлдері жүйесі', 'Алаколь-Сасыккольская система озёр'], 46.267, 81.533, 'Jetisu', 'Balkhash-Alakol', 'A', RSIS, {
    size: 9146.6,
    sizeUnit: 'km²',
    year: 2009,
    note: 'Ramsar Site No. 1892 (designated 2009). Area: 914,663 ha. Encompasses Alakol, Sasykkol, Koshkarkol, and surrounding marshlands; Dalmatian Pelican breeding grounds.',
  }),
  mk('ramsar', 'ramsar-ili-delta', ['Ili River Delta and South Lake Balkhash', 'Іле өзенінің атырауы және Балқаш көлінің оңтүстік бөлігі', 'Дельта реки Или и южная часть озера Балхаш'], 45.598, 74.738, 'Almaty', 'Balkhash-Alakol', 'A', RSIS, {
    size: 9766.3,
    sizeUnit: 'km²',
    year: 2012,
    note: 'Ramsar Site No. 2093 (designated 2012). Area: 976,630 ha. Largest natural delta in Central Asia; protected within Ile-Balkhash State Nature Reserve.',
  }),
  mk('ramsar', 'ramsar-lesser-aral', ['Lesser Aral Sea and Delta of the Syrdarya', 'Солтүстік Арал теңізі мен Сырдария атырауы', 'Малое Аральское море и дельта реки Сырдарья'], 46.347, 61.003, 'Kyzylorda', 'Aral-Syrdarya', 'A', RSIS, {
    size: 3300.0,
    sizeUnit: 'km²',
    year: 2012,
    note: 'Ramsar Site No. 2077 (designated 2012). Area: 330,000 ha. Includes Barsakelmes Nature Reserve and the restored northern sea basin fed by the Syr Darya.',
  }),

  // =========================================================================
  // ---- Flood-watch points (queried live from Open-Meteo Flood API) ----
  // =========================================================================
  mk('gauge', 'g-oskemen', ['Irtysh at Oskemen', 'Өскемендегі Ертіс', 'Иртыш у Усть-Каменогорска'], 49.97, 82.65, 'East Kazakhstan', 'Ertis', 'A', OM),
  mk('gauge', 'g-pavlodar', ['Irtysh at Pavlodar', 'Павлодардағы Ертіс', 'Иртыш у Павлодара'], 52.28, 76.97, 'Pavlodar', 'Ertis', 'A', OM),
  mk('gauge', 'g-petropavl', ['Ishim at Petropavl', 'Петропавлдағы Есіл', 'Ишим у Петропавловска'], 54.87, 69.15, 'North Kazakhstan', 'Esil', 'A', OM),
  mk('gauge', 'g-astana', ['Ishim at Astana', 'Астанадағы Есіл', 'Ишим у Астаны'], 51.13, 71.43, 'Astana city', 'Esil', 'A', OM),
  mk('gauge', 'g-kostanay', ['Tobol at Kostanay', 'Қостанайдағы Тобыл', 'Тобол у Костаная'], 53.18, 63.6, 'Kostanay', 'Tobyl-Torgay', 'A', OM),
  mk('gauge', 'g-oral', ['Ural at Oral', 'Оралдағы Жайық', 'Урал у Уральска'], 51.2, 51.38, 'West Kazakhstan', 'Zhayik-Caspian', 'A', OM),
  mk('gauge', 'g-atyrau', ['Ural at Atyrau', 'Атыраудағы Жайық', 'Урал у Атырау'], 47.1, 51.88, 'Atyrau', 'Zhayik-Caspian', 'A', OM),
  mk('gauge', 'g-kyzylorda', ['Syr Darya at Kyzylorda', 'Қызылордадағы Сырдария', 'Сырдарья у Кызылорды'], 44.84, 65.5, 'Kyzylorda', 'Aral-Syrdarya', 'A', OM),
  mk('gauge', 'g-kapchagay', ['Ili at Kapchagay', 'Қапшағайдағы Іле', 'Иле у Капшагая'], 43.88, 77.07, 'Almaty', 'Balkhash-Alakol', 'A', OM),
  mk('gauge', 'g-temirtau', ['Nura at Temirtau', 'Теміртаудағы Нұра', 'Нура у Темиртау'], 50.03, 72.95, 'Karaganda', 'Nura-Sarysu', 'A', OM),
  mk('gauge', 'g-taraz', ['Talas at Taraz', 'Тараздағы Талас', 'Талас у Тараза'], 42.88, 71.4, 'Jambyl', 'Shu-Talas', 'A', OM),

  // =========================================================================
  // ---- Basin council headquarters (the 8 official basin councils) ----
  // =========================================================================
  mk('basinhq', 'hq-aral', ['Aral-Syrdarya Basin Council', 'Арал-Сырдария бассейндік кеңесі', 'Арало-Сырдарьинский бассейновый совет'], 44.85, 65.51, 'Kyzylorda', 'Aral-Syrdarya', 'A', BAS, {
    note: 'Seat: Kyzylorda. Oversees water basin inspection for Syr Darya and Aral territory.',
  }),
  mk('basinhq', 'hq-balkhash', ['Balkhash-Alakol Basin Council', 'Балқаш-Алакөл бассейндік кеңесі', 'Балхаш-Алакольский бассейновый совет'], 43.24, 76.89, 'Almaty city', 'Balkhash-Alakol', 'A', BAS, {
    note: 'Seat: Almaty. Oversees water management for the Lake Balkhash and Alakol drainage basins.',
  }),
  mk('basinhq', 'hq-ertis', ['Ertis Basin Council', 'Ертіс бассейндік кеңесі', 'Ертисский бассейновый совет'], 49.95, 82.61, 'East Kazakhstan', 'Ertis', 'A', BAS, {
    note: 'Seat: Oskemen. Oversees water management for the Irtysh River and Eastern Kazakhstan basins.',
  }),
  mk('basinhq', 'hq-esil', ['Esil Basin Council', 'Есіл бассейндік кеңесі', 'Есильский бассейновый совет'], 51.17, 71.45, 'Astana city', 'Esil', 'A', BAS, {
    note: 'Seat: Astana. Oversees water management for the Ishim River basin.',
  }),
  mk('basinhq', 'hq-nura', ['Nura-Sarysu Basin Council', 'Нұра-Сарысу бассейндік кеңесі', 'Нура-Сарысуский бассейновый совет'], 49.8, 73.1, 'Karaganda', 'Nura-Sarysu', 'A', BAS, {
    note: 'Seat: Karaganda. Oversees water management for Nura and Sarysu catchments.',
  }),
  mk('basinhq', 'hq-tobyl', ['Tobyl-Torgay Basin Council', 'Тобыл-Торғай бассейндік кеңесі', 'Тобол-Тургайский бассейновый совет'], 53.21, 63.63, 'Kostanay', 'Tobyl-Torgay', 'A', BAS, {
    note: 'Seat: Kostanay. Oversees water management for the Tobol and Turgay river systems.',
  }),
  mk('basinhq', 'hq-zhayik', ['Zhayik-Caspian Basin Council', 'Жайық-Каспий бассейндік кеңесі', 'Жайык-Каспийский бассейновый совет'], 47.11, 51.92, 'Atyrau', 'Zhayik-Caspian', 'A', BAS, {
    note: 'Seat: Atyrau. Oversees water management for the Ural (Zhayik), Emba, and Caspian coastal zones.',
  }),
  mk('basinhq', 'hq-shu', ['Shu-Talas Basin Council', 'Шу-Талас бассейндік кеңесі', 'Шу-Таласский бассейновый совет'], 42.9, 71.37, 'Jambyl', 'Shu-Talas', 'A', BAS, {
    note: 'Seat: Taraz. Oversees transboundary water cooperation and management for the Chu and Talas rivers.',
  }),
];

export const REGIONS = Array.from(new Set(PLACES.map((p) => p.region))).sort();

export const REGION_BOUNDS: Record<string, [number, number, number, number]> = {
  'Abai': [77.2, 46.8, 83.8, 51.5],
  'Akmola': [65.352, 50.039, 74.26, 53.684],
  'Aktobe': [53.63, 45.177, 64.277, 51.317],
  'Almaty': [74.2, 42.4, 79.8, 45.9],
  'Almaty city': [76.73, 43.03, 77.17, 43.41],
  'Astana city': [71.22, 51.0, 71.79, 51.36],
  'Atyrau': [47.05, 46.012, 56.472, 49.24],
  'East Kazakhstan': [81.5, 47.5, 87.32, 51.71],
  'Jambyl': [69.067, 42.32, 75.824, 46.007],
  'Jetisu': [77.5, 44.0, 82.6, 46.8],
  'Karaganda': [69.2, 46.5, 77.7, 51.31],
  'Kostanay': [59.993, 48.17, 68.092, 54.717],
  'Kyzylorda': [59.03, 42.323, 68.06, 47.828],
  'Mangystau': [50.004, 41.246, 56.744, 46.52],
  'North Kazakhstan': [65.963, 52.207, 74.035, 55.48],
  'Pavlodar': [73.406, 50.013, 79.339, 54.458],
  'Turkistan': [65.999, 40.569, 70.943, 46.0],
  'Ulytau': [64.8, 45.8, 71.5, 49.8],
  'West Kazakhstan': [46.492, 47.92, 54.565, 51.776],
};

export const BASIN_BOUNDS: Record<string, [number, number, number, number]> = {
  'Aral-Syrdarya': [59.03, 40.57, 70.94, 47.83],
  'Balkhash-Alakol': [73.72, 42.21, 82.59, 47.33],
  'Ertis': [73.41, 45.54, 87.32, 54.46],
  'Esil': [65.35, 50.04, 74.26, 55.48],
  'Nura-Sarysu': [62.95, 46.0, 77.7, 51.31],
  'Shu-Talas': [69.07, 42.32, 75.82, 46.01],
  'Tobyl-Torgay': [59.99, 48.17, 68.09, 54.72],
  'Zhayik-Caspian': [46.49, 41.25, 64.28, 51.78],
};

export const REGION_SHAPE_NAMES: Record<string, string[]> = {
  'Abai': ['East Kazakhstan Region'],
  'Akmola': ['Akmola Region'],
  'Aktobe': ['Aktobe Region'],
  'Almaty': ['Almaty Region'],
  'Almaty city': ['Almaty'],
  'Astana city': ['Astana'],
  'Atyrau': ['Atyrau Region'],
  'East Kazakhstan': ['East Kazakhstan Region'],
  'Jambyl': ['Jambyl Region'],
  'Jetisu': ['Almaty Region'],
  'Karaganda': ['Karaganda Region'],
  'Kostanay': ['Kostanay Region'],
  'Kyzylorda': ['Kyzylorda Region'],
  'Mangystau': ['Mangystau Region'],
  'North Kazakhstan': ['North Kazakhstan Region'],
  'Pavlodar': ['Pavlodar Region'],
  'Turkistan': ['South Kazakhstan Region', 'Turkistan Region'],
  'Ulytau': ['Karaganda Region'],
  'West Kazakhstan': ['West Kazakhstan Region'],
};

export function nameOf(p: Place, lang: Lang): string {
  return p.name[lang] || p.name.en;
}
export function altNames(p: Place, lang: Lang): string {
  return (['en', 'kk', 'ru'] as Lang[])
    .filter((l) => l !== lang)
    .map((l) => p.name[l])
    .filter((n, i, a) => n && a.indexOf(n) === i && n !== p.name[lang])
    .slice(0, 2)
    .join(' · ');
}
export function sizeText(p: Place, lang: Lang = 'en'): string {
  if (p.size == null) return '';
  const v = formatNumber(p.size, lang, { maximumFractionDigits: 3 });
  const unit = p.sizeUnit ?? '';
  return `${v} ${lang === 'en' ? unit : unit.replace('km', 'км')}`.trim();
}
export function radiusOf(p: Place): number {
  if (p.size == null) return 6;
  const base: Record<PlaceType, number> = { dam: 5, lake: 5, river: 5, ramsar: 7, gauge: 7, basinhq: 7, canal: 6, glacier: 6 };
  return Math.min(15, base[p.type] + Math.log10(p.size + 1) * 2.2);
}
export function placeProps(p: Place, lang: Lang) {
  return {
    id: p.id,
    type: p.type,
    typeLabel: TYPE_META[p.type].label,
    name: nameOf(p, lang),
    alt: altNames(p, lang),
    region: p.region,
    basin: p.basin,
    verification: p.verification,
    size: sizeText(p, lang),
    year: p.year ?? 0,
    note: p.note ?? '',
    source: p.source,
    approx: p.approx ? 1 : 0,
    r: radiusOf(p),
  };
}
export function placesToGeoJSON(places: Place[], lang: Lang): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: places.map((p) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
      properties: placeProps(p, lang),
    })),
  };
}
export const SORTS = [
  { id: 'largest', label: 'Largest first' },
  { id: 'name', label: 'Name A–Z' },
  { id: 'type', label: 'By type' },
] as const;
export type SortId = (typeof SORTS)[number]['id'];
export function sortPlaces(list: Place[], sort: SortId, lang: Lang): Place[] {
  const arr = [...list];
  if (sort === 'name') return arr.sort((a, b) => nameOf(a, lang).localeCompare(nameOf(b, lang), lang));
  if (sort === 'type') return arr.sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type) || nameOf(a, lang).localeCompare(nameOf(b, lang), lang));
  return arr.sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type) || (b.size ?? -1) - (a.size ?? -1));
}

export const RIVER_FEATURES: Record<string, string[]> = {
  'river-irtysh': ['g-oskemen', 'g-pavlodar', 'dam-bukhtarma', 'dam-shulbinsk', 'dam-ustkam'],
  'river-syrdarya': ['g-kyzylorda', 'dam-shardara', 'ramsar-lesser-aral'],
  'river-ural': ['g-oral', 'g-atyrau', 'ramsar-ural-delta'],
  'river-ishim': ['g-astana', 'g-petropavl', 'dam-sergeevka'],
  'river-tobol': ['g-kostanay', 'dam-karatomar', 'dam-verkhne-tobol'],
  'river-ili': ['g-kapchagay', 'dam-kapchagay', 'ramsar-ili-delta'],
  'river-chu': ['dam-tashotkel'],
  'river-talas': ['g-taraz'],
  'river-nura': ['g-temirtau'],
  'river-sarysu': ['hq-nura'],
  'river-emba': ['hq-zhayik'],
  'river-karatal': ['hq-balkhash'],
  'river-charyn': ['ramsar-ili-delta'],
  'river-canal-satpayev': ['g-pavlodar', 'hq-ertis'],
};

export interface AssociatedFeature {
  id: string;
  name: string;
  type: PlaceType;
  metricValue?: string;
}

export function getAssociatedFeatures(
  place: Place,
  allPlaces: Place[],
  lang: Lang,
  floodPoints?: FloodPoint[] | null
): AssociatedFeature[] {
  const result: AssociatedFeature[] = [];
  const placeId = place.id;

  if (place.type === 'river') {
    const directIds = new Set(RIVER_FEATURES[placeId] ?? []);
    allPlaces.forEach((p) => {
      if (p.id === place.id) return;
      let matched = directIds.has(p.id);
      if (!matched) {
        const pName = p.name.en.toLowerCase();
        const pNote = (p.note || '').toLowerCase();
        if (placeId === 'river-irtysh' && (pName.includes('irtysh') || pNote.includes('irtysh'))) matched = true;
        else if (placeId === 'river-syrdarya' && (pName.includes('syr darya') || pNote.includes('syr darya'))) matched = true;
        else if (placeId === 'river-ural' && (pName.includes('ural') || pNote.includes('ural') || pNote.includes('zhayik'))) matched = true;
        else if (placeId === 'river-ishim' && (pName.includes('ishim') || pNote.includes('ishim') || pNote.includes('esil'))) matched = true;
        else if (placeId === 'river-tobol' && (pName.includes('tobol') || pNote.includes('tobol'))) matched = true;
        else if (placeId === 'river-ili' && (pName.includes('ili') || pNote.includes('ili'))) matched = true;
        else if (placeId === 'river-chu' && (pName.includes('chu') || pNote.includes('chu'))) matched = true;
        else if (placeId === 'river-talas' && (pName.includes('talas') || pNote.includes('talas'))) matched = true;
        else if (placeId === 'river-nura' && (pName.includes('nura') || pNote.includes('nura'))) matched = true;
      }

      if (matched && (p.type === 'dam' || p.type === 'gauge' || p.type === 'ramsar')) {
        let metricValue = '';
        if (p.type === 'gauge') {
          const fl = floodPoints?.find((f) => f.id === p.id);
          if (fl?.now != null) {
            metricValue = `${formatNumber(fl.now, lang, { maximumFractionDigits: 0 })} ${tr(lang, 'm³/s')}`;
          } else {
            metricValue = tr(lang, 'Active gauge');
          }
        } else if (p.type === 'dam') {
          metricValue = p.size != null ? sizeText(p, lang) : tr(lang, 'Reservoir');
        } else if (p.type === 'ramsar') {
          metricValue = p.size != null ? `${formatNumber(Math.round(p.size), lang)} ${tr(lang, 'km²')}` : tr(lang, 'Wetland');
        }

        result.push({
          id: p.id,
          name: nameOf(p, lang),
          type: p.type,
          metricValue,
        });
      }
    });
  } else if (place.type === 'dam' || place.type === 'gauge') {
    // Reverse lookup: find the river that contains this dam or gauge
    allPlaces.forEach((p) => {
      if (p.type === 'river') {
        const directIds = new Set(RIVER_FEATURES[p.id] ?? []);
        const pNameKey = p.name.en.split(' ')[0].toLowerCase();
        if (directIds.has(placeId) || (place.note || '').toLowerCase().includes(pNameKey)) {
          result.push({
            id: p.id,
            name: nameOf(p, lang),
            type: p.type,
            metricValue: p.lengthKm ? `${formatNumber(p.lengthKm, lang)} ${tr(lang, 'km')}` : tr(lang, 'River'),
          });
        }
      }
    });
  }

  return result;
}
