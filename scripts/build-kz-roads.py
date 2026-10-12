#!/usr/bin/env python3
"""Build a local vector-tile road network from Geofabrik's OSM extract."""

import argparse
import json
import shutil
import subprocess
import tempfile
import urllib.request
from pathlib import Path

import osmium
from shapely.geometry import LineString, shape
from shapely.ops import unary_union


ROOT = Path(__file__).resolve().parents[1]
PBF_URL = "https://download.geofabrik.de/asia/kazakhstan-latest.osm.pbf"
ROAD_CLASSES = {"motorway", "trunk", "primary", "secondary", "tertiary"}


def line_parts(geometry):
    if geometry.geom_type == "LineString":
        yield geometry
    elif geometry.geom_type in {"MultiLineString", "GeometryCollection"}:
        for part in geometry.geoms:
            yield from line_parts(part)


def feature_from_way(way, border):
    highway = way.tags.get("highway")
    if not highway:
        return []
    road_class = highway.removesuffix("_link")
    if road_class not in ROAD_CLASSES:
        return []

    coords = []
    for node in way.nodes:
        if node.location.valid():
            point = (node.lon, node.lat)
            if not coords or coords[-1] != point:
                coords.append(point)
    if len(coords) < 2:
        return []

    try:
        clipped = LineString(coords).intersection(border)
    except Exception:
        return []

    properties = {
        "class": road_class,
        "highway": highway,
        "osm_id": way.id,
        "name": way.tags.get("name", ""),
        "ref": way.tags.get("ref", ""),
        "surface": way.tags.get("surface", ""),
        "oneway": way.tags.get("oneway", ""),
    }
    results = []
    for part in line_parts(clipped):
        points = [[round(x, 6), round(y, 6)] for x, y in part.coords]
        if len(points) < 2:
            continue
        results.append({
            "type": "Feature",
            "id": way.id,
            "properties": properties,
            "geometry": {"type": "LineString", "coordinates": points},
        })
    return results


class RoadHandler(osmium.SimpleHandler):
    def __init__(self, border, out):
        super().__init__()
        self.border = border
        self.out = out
        self.count = 0

    def way(self, way):
        for feature in feature_from_way(way, self.border):
            if self.count:
                self.out.write(",")
            self.out.write(json.dumps(feature, ensure_ascii=False, separators=(",", ":")))
            self.count += 1


def download_extract(path):
    print(f"Downloading {PBF_URL}")
    request = urllib.request.Request(PBF_URL, headers={"User-Agent": "KazakhstanWaterAtlas/1.0"})
    with urllib.request.urlopen(request, timeout=300) as response, path.open("wb") as output:
        shutil.copyfileobj(response, output)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, help="Use an existing Geofabrik PBF instead of downloading it")
    args = parser.parse_args()

    tippecanoe = shutil.which("tippecanoe")
    if not tippecanoe:
        raise SystemExit("tippecanoe is required; install it before running this script")

    regions = json.loads((ROOT / "public/data/kz-adm1.geojson").read_text())
    border = unary_union([shape(feature["geometry"]) for feature in regions["features"]])
    output_pmtiles = ROOT / "public/data/kz-roads.pmtiles"
    output_pmtiles.parent.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(prefix="kz-roads-") as temp_dir:
        temp = Path(temp_dir)
        pbf = args.input or temp / "kazakhstan.osm.pbf"
        if not args.input:
            download_extract(pbf)

        geojson = temp / "roads.geojson"
        with geojson.open("w", encoding="utf-8") as output:
            output.write('{"type":"FeatureCollection","features":[')
            handler = RoadHandler(border, output)
            handler.apply_file(str(pbf), locations=True, idx="flex_mem")
            output.write("]}")

        if not handler.count:
            raise SystemExit("No major OSM roads were found inside Kazakhstan")
        print(f"Clipped {handler.count:,} OSM road features; creating PMTiles")
        subprocess.run([
            tippecanoe,
            "--force",
            "--output", str(output_pmtiles),
            "--layer", "roads",
            "--minimum-zoom", "3",
            "--maximum-zoom", "12",
            "--drop-densest-as-needed",
            str(geojson),
        ], check=True)
    print(f"Wrote {output_pmtiles.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
