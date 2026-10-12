export type Status = 'Live' | 'Sample data' | 'Needs setup' | 'Confirm endpoint';
export interface Source { name: string; use: string; url: string; status: Status; how: string }

export const SOURCES: Source[] = [
  { name: 'Global Dam Watch (GRanD, GeoDAR)', use: 'Dams and reservoirs', url: 'https://www.globaldamwatch.org', status: 'Live', how: '24 major reservoirs in lib/places.ts with verified capacities, construction years, and coordinates from GDW and national registers.' },
  { name: 'HydroSHEDS HydroRIVERS', use: 'River network', url: 'https://www.hydrosheds.org', status: 'Live', how: 'Detailed HydroRIVERS PMTiles plus clipped national reaches cached in public/data for connected coverage across Kazakhstan.' },
  { name: 'HydroSHEDS HydroLAKES', use: 'Lakes and reservoirs', url: 'https://www.hydrosheds.org', status: 'Live', how: 'Detailed HydroLAKES PMTiles rendered beneath the Kazakhstan exterior mask.' },
  { name: 'OpenStreetMap contributors / Geofabrik', use: 'Major roads', url: 'https://download.geofabrik.de/asia/kazakhstan.html', status: 'Live', how: 'Motorway through tertiary road features from the Kazakhstan OSM extract, clipped to the national border and bundled as local PMTiles.' },
  { name: 'Basin Councils of Kazakhstan', use: '8 River Basins', url: 'https://www.gov.kz', status: 'Live', how: 'The 8 official water-management river basins of Kazakhstan in public/data/kz-basins.geojson.' },
  { name: 'Natural Earth', use: 'Selected named water bodies', url: 'https://www.naturalearthdata.com', status: 'Live', how: 'Used as a source for a subset of named national river reaches and lakes cached locally in public/data.' },
  { name: 'Basin councils of Kazakhstan', use: '8 basin council seats', url: 'https://www.gov.kz', status: 'Live', how: 'All 8 official basin council headquarters catalogued with seats and catchment mandates.' },
  { name: 'Copernicus EMS GloFAS', use: '100-year flood hazard', url: 'https://global-flood.emergency.copernicus.eu', status: 'Live', how: 'Verified WMS endpoint ows.globalfloods.eu with layer FloodHazard100y.' },
  { name: 'JRC Global Surface Water', use: 'Water 1984–2021', url: 'https://global-surface-water.appspot.com', status: 'Live', how: 'XYZ tiles from storage.googleapis.com/global-surface-water.' },
  { name: 'Dartmouth Flood Observatory', use: 'Past large floods', url: 'https://floodobservatory.colorado.edu', status: 'Live', how: 'Historical large flood records across northern, western, and southeastern Kazakhstan.' },
  { name: 'IGRAC GGIS', use: 'Aquifers (transboundary)', url: 'https://ggis.un-igrac.org', status: 'Live', how: 'Configured with verified WMS layer geonode:a__2021_TBA_GGIS_utf8.' },
  { name: 'BGR WHYMAP', use: 'Groundwater systems', url: 'https://www.whymap.org', status: 'Live', how: 'Configured with verified BGR WMS endpoint whymap_gwr layer 0.' },
  { name: 'Ramsar Sites Information Service', use: 'Wetlands of international importance', url: 'https://rsis.ramsar.org', status: 'Live', how: 'All 10 official Kazakhstan Ramsar sites in lib/places.ts with official areas, designations, and coordinates.' },
  { name: 'WRI Aqueduct 4.0', use: 'Water stress by region', url: 'https://www.wri.org/aqueduct', status: 'Sample data', how: 'Baseline water stress scores per region across all 8 river basins.' },
  { name: 'NASA GIBS', use: 'Daily satellite imagery', url: 'https://www.earthdata.nasa.gov/engage/open-data-services-software/earthdata-developer-portal/gibs-api', status: 'Live', how: 'MODIS Terra true colour, yesterday (UTC). No key needed.' },
  { name: 'Open-Meteo Flood API (GloFAS v4)', use: 'Daily modelled river discharge and forecast', url: 'https://open-meteo.com/en/docs/flood-api', status: 'Live', how: 'Fetched from the browser when the atlas loads and when Refresh data is clicked. Daily GloFAS river-flow estimates; forecast updates daily. These are model outputs, not station observations.' },
  { name: 'Kazhydromet', use: 'Official station observations and warnings', url: 'https://www.kazhydromet.kz/en/hydrological-monitoring/interaktivnaya-karta-gidrologicheskogo-monitoringa', status: 'Sample data', how: 'The official map publishes station levels, temperature and discharge, with daily updates. It is linked for observed readings; no machine-readable station feed is wired into the atlas.' },
  { name: 'geoBoundaries', use: 'Region boundaries (ADM1)', url: 'https://www.geoboundaries.org', status: 'Live', how: 'Cached locally in public/data/kz-adm1.geojson.' },
  { name: 'MapTiler, Stadia Maps, Protomaps, OpenStreetMap', use: 'Basemaps', url: 'https://www.maptiler.com', status: 'Live', how: 'Set a key in .env.local, or use a custom style URL (Protomaps). Falls back to OSM and Esri raster tiles.' },
];
