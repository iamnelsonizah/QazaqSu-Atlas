# Roadmap

QazaqSu Atlas is about one month old. It already brings 16 water layers for Kazakhstan into one trilingual web map, with live rain and river-flow data, 85 catalogued places (dams, lakes, rivers, canals, glaciers, Ramsar sites, flood-watch points and basin councils), river tracing and a "Near me" view.

This roadmap lists what should come next, in priority order. It is written for three groups of users:

- **Students and teachers** who need a clear, Kazakh- and Russian-language picture of where the country's water comes from and where the risks are.
- **Researchers, journalists and NGOs** who need figures they can trust, cite and download.
- **Residents and local officials** in flood-prone regions who need a quick, plain view of river conditions near them.

## 1. Make the data trustworthy (do first)

The atlas is only useful to researchers if every number can be traced and the app is honest about what is sample data. Right now there are gaps:

- **Verification levels are all "A".** All 85 places are marked A (well documented), even though the README says some figures are approximate. Each record needs an honest A, B or C grade.
- **Citations need to point at the real document.** 25 of the 47 reference links go to a site's homepage, not to the report they name. Each reference should link to the actual bulletin, dataset or page, or be removed.
- **Water stress uses placeholder scores** (`lib/stress.ts`). Replace them with zonal statistics from WRI Aqueduct 4.0 for each region.
- **Past floods should use the real archive.** Load the Dartmouth Flood Observatory records for Kazakhstan, and add the 2024 spring floods by district.

## 2. Fix gaps on the live site

- **Detailed rivers and lakes don't load in production.** The HydroRIVERS and HydroLAKES PMTiles files are too large for the repo, so the live site returns 404 for them, and upstream/downstream river tracing doesn't work there. Host them on object storage that supports range requests (for example Cloudflare R2) and set `NEXT_PUBLIC_HYDRORIVERS_PMTILES` and `NEXT_PUBLIC_HYDROLAKES_PMTILES`.
- **Turn on HydroBASINS.** The archive is already built (`public/data/hydrobasins.pmtiles`) but isn't wired up in production.

## 3. Researchers: download, cite, reproduce

- **Export what you see.** CSV and GeoJSON download for the place list, the current filter and the flow and rain tables. Download a PNG of the current map view with attribution.
- **Cite the atlas.** Add a `CITATION.cff`, archive releases on Zenodo for a DOI, and add a "How to cite" box with the data version and access date.
- **Open dataset.** Publish the curated places, basins and canals as a versioned dataset (one GeoJSON per release) with a data dictionary for each field.
- **Reproducible pipelines.** Document every script in `scripts/`, pin the source data versions, and record when each file was last rebuilt.
- **Longer flow records.** Show more than 60 days of river discharge, compare against the long-term median, and let users download the series.
- **Real gauges.** Where Kazhydromet publishes station readings, link or show the nearest official station next to the modelled GloFAS value, so users can see the difference.

## 4. Students and teachers

- **Guided stories.** Short, map-driven explainers in Kazakh, Russian and English: the Aral Sea, the Irtysh and transboundary rivers, glaciers as water towers, the 2024 floods, and where Almaty's water comes from.
- **Glossary.** Plain definitions of basin, discharge, return period, water stress, aquifer, and so on, linked from the layer panel.
- **Change over time.** A time slider for JRC surface water (1984–2021) to show shrinking and growing lakes.
- **Printable maps.** A print layout with title, legend, scale and sources, for classrooms and reports.
- **Review of Kazakh and Russian text** by native speakers, especially technical terms.

## 5. Residents and local officials

- **Clearer flood screening.** Explain on each flood-watch point what "watch" and "warning" mean, that it is a model screening and not an official warning, and link to the official Kazhydromet and Ministry of Emergency Situations channels.
- **More flood-watch points** on the rivers that flooded in 2024 (Ural, Ilek, Tobol, Ishim, Nura), placed on the river channel.
- **Works on weak connections.** Cache the app shell and base data so it opens on slow mobile networks, and test it at phone width.

## Done

- **Source labels now match the data.** Past floods are marked as sample data, and the HydroSHEDS rows say the detailed tiles aren't on the public site yet.
- **The IGRAC and WHYMAP groundwater layers are on by default**, using the layer names from the local setup, so they also draw on the public site.
- **The Statistics tab no longer says "Verified".** It asks readers to check each record's source before citing it.

## 6. Quality and maintenance

- **Tests and CI.** Add type-checking, a build check and a few tests (URL state, date formatting, flood alert thresholds) on every push with GitHub Actions.
- **Data checks.** A script that validates `lib/places.ts`: coordinates inside Kazakhstan, every record has a source, every verification level is set, and every name exists in all three languages.
- **Accessibility.** Keyboard access to the map controls and drawer, sufficient colour contrast in every layer, and text alternatives for the charts.
- **Split large components.** `MapView.tsx` (about 1,100 lines) and `DetailDrawer.tsx` (about 850 lines) should be broken up so that others can contribute.
- **Contributor guide.** A `CONTRIBUTING.md` explaining how to add a place, a layer or a translation, with a source required for every number.

## Not planned

- Official warnings. The atlas will keep pointing to official agencies for warnings and will not issue its own.
- Commercial use of Open-Meteo data without checking its terms.
