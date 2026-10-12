# QazaqSu Atlas: Kazakhstan Water Atlas

A layered water atlas for Kazakhstan built with **Next.js 14 (App Router)**, **MapLibre GL JS** and **PMTiles**.
Sidebar list with search and filters, five basemaps, 16 toggleable data layers, live rain and river-flow data, a trilingual (English, Kazakh, Russian) place list, and six tabs.

## Run it

```bash
npm install
cp .env.example .env.local     # optional: add a basemap key (see below)
npm run data                   # refreshes boundaries and hydrography in /public/data
npm run roads                  # refreshes the local OSM road-network PMTiles
npm run dev                    # http://localhost:3000
```

Without any keys the app runs on free OpenStreetMap and Esri raster tiles. Those are fine for development; for production use a keyed provider.

## Basemap options

Set one in `.env.local` (priority top to bottom):

| Variable | Provider |
| --- | --- |
| `NEXT_PUBLIC_CUSTOM_STYLE_URL` | Any MapLibre style JSON, for example a Protomaps style you host |
| `NEXT_PUBLIC_MAPTILER_KEY` | MapTiler: Streets, Satellite, Outdoor |
| `NEXT_PUBLIC_STADIA_KEY` | Stadia Maps: OSM Bright, Alidade Satellite, Stamen Terrain |

"NASA daily" is always NASA GIBS (MODIS Terra, yesterday) and needs no key.

## Layers and what each one needs

| Layer | Source | Status out of the box |
| --- | --- | --- |
| Regions | geoBoundaries ADM1 | Live |
| River network | HydroSHEDS HydroRIVERS | Live; local PMTiles |
| Lakes | HydroSHEDS HydroLAKES | Live; local PMTiles |
| Major roads | OpenStreetMap via Geofabrik | Live; local PMTiles |
| Basins | 8 official Kazakhstan Basin Councils | Live; local GeoJSON |
| 100-year flood zone | Copernicus GloFAS WMS | Confirm WMS URL and layer name |
| GloFAS alerts | Open-Meteo Flood API | Live |
| Past floods | Dartmouth Flood Observatory | Sample records |
| Water 1984–2021 | JRC Global Surface Water | Live |
| Aquifers | IGRAC GGIS WMS | Needs layer name |
| Groundwater | BGR WHYMAP WMS | Needs layer name |
| Water stress by region | WRI Aqueduct | Placeholder values |
| Rain yesterday, Rain next 3 days | Open-Meteo | Live |
| Satellite today | NASA GIBS | Live |

Layers that need setup show as dashed, disabled toggles with a tooltip naming the variable to set.

### HydroSHEDS and road network

The included HydroRIVERS and HydroLAKES archives are loaded as PMTiles by default. You can override their local paths with `NEXT_PUBLIC_HYDRORIVERS_PMTILES` and `NEXT_PUBLIC_HYDROLAKES_PMTILES` in `.env.local`. If you replace the archives, the vector layer names must remain `hydrorivers` and `hydrolakes`.

The Major roads overlay uses local PMTiles built from Geofabrik's Kazakhstan OSM extract, so it works without an external tile server. To refresh it, install the Python requirements in `scripts/requirements-roads.txt` and [Tippecanoe](https://github.com/felt/tippecanoe), then run `npm run roads`. The refresh downloads a temporary PBF extract, clips motorway, trunk, primary, secondary and tertiary roads to Kazakhstan, and replaces `public/data/kz-roads.pmtiles`.

Click a mapped river, lake or major road to inspect its available source attributes. Detailed HydroRIVERS reaches also offer upstream-network and downstream-channel tracing, using the source's river IDs and distance-to-outlet values; select **Clear trace** to return to the normal map.

To rebuild the PMTiles archives from HydroSHEDS source data, download HydroRIVERS, HydroLAKES and HydroBASINS (Asia), then clip and convert with GDAL and tippecanoe:

```bash
# bbox covers Kazakhstan
ogr2ogr -f GeoJSONSeq -spat 46 40 88 56 rivers.geojsonl HydroRIVERS_v10_as.shp
tippecanoe -o hydrorivers.pmtiles -l hydrorivers -Z3 -z11 --drop-densest-as-needed rivers.geojsonl

ogr2ogr -f GeoJSONSeq -spat 46 40 88 56 lakes.geojsonl HydroLAKES_polys_v10.shp
tippecanoe -o hydrolakes.pmtiles -l hydrolakes -Z3 -z11 --drop-densest-as-needed lakes.geojsonl

ogr2ogr -f GeoJSONSeq -spat 46 40 88 56 basins.geojsonl hybas_as_lev05_v1c.shp
tippecanoe -o hydrobasins.pmtiles -l hydrobasins -Z3 -z10 --drop-densest-as-needed basins.geojsonl
```

The `-l` layer names must match exactly. Put the files in `public/data/` and set the matching `NEXT_PUBLIC_*_PMTILES` variable, or host them on R2/S3 and use the full URL (the host must support HTTP range requests and CORS).

### WMS layers

Find layer names with a GetCapabilities request, for example
`https://ggis.un-igrac.org/geoserver/ows?service=WMS&request=GetCapabilities`, then set
`NEXT_PUBLIC_IGRAC_LAYER` and `NEXT_PUBLIC_WHYMAP_LAYER` (and the `_WMS` URLs if they differ). Do the same for the GloFAS flood hazard layer if the default does not draw. If a layer fails to load, the map shows a notice naming it.

## Replacing the sample data

- **Places** (dams, lakes, rivers, Ramsar sites, flood-watch points, basin councils): `lib/places.ts`. Each record has trilingual names, region, basin and a verification level (A well documented, B approximate, C confirm before use). The sample set is small and some figures and coordinates are marked C on purpose.
- **Past floods**: `lib/floods.ts`. Swap in the Dartmouth Flood Observatory archive.
- **Water stress**: `lib/stress.ts`. The scores are placeholders. Compute baseline water stress per ADM1 polygon from WRI Aqueduct 4.0 and replace the rules.
- **Flood-watch points**: any place with `type: 'gauge'` is sent to the Open-Meteo Flood API. Those are 5 km model grid cells, so a point away from the river can read low. Move points onto the channel, or swap in real gauge data if Kazhydromet shares it.

## Project layout

```
app/                 layout, page, global styles
components/Atlas.tsx state, tabs, data loading
components/MapView.tsx  MapLibre map, sources, layers, popups
components/Sidebar.tsx, LayerBar.tsx, Legend.tsx
components/tabs/     Flood watch, Rain, Basins, Statistics, Data sources
lib/                 places, layers, basemaps, Open-Meteo client, data loaders
scripts/fetch-data.mjs  caches boundaries, rivers and lakes locally
```

## Notes

- Open-Meteo is free for non-commercial use. Check its terms before commercial deployment.
- The flood alert is a screening heuristic (forecast peak vs last week's mean), not an official warning.
- Add more languages by extending the `name` record and the `Lang` type.
