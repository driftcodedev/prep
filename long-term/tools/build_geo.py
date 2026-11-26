"""Builds long-term/data/geo.json: the Cobscook Bay outline and 1-mile distance rings out to 10 miles.

Not run by the site. Run it by hand only when the shapes need rebuilding:
    pip install basemap basemap-data-hires shapely pyproj
    python3 long-term/tools/build_geo.py

Coastline: GSHHS full resolution (via basemap-data-hires). Distances are measured in UTM zone 19N
(EPSG:32619) from the shore of Cobscook Bay, and the rings cover land only.
The bay is closed off at its mouth by a straight line from the south tip of Eastport (Moose Island)
to the Lubec shore, so Friar Roads and Lubec Narrows count as outside the bay.
"""
import json, os
from mpl_toolkits.basemap import Basemap
from shapely.geometry import Polygon, Point, box, mapping
from shapely.ops import unary_union, transform
import pyproj

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "data", "geo.json")

LAT0, LAT1, LON0, LON1 = 44.58, 45.20, -67.58, -66.68   # wide enough for a 10-mile ring
MILE = 1609.344
MOUTH_A, MOUTH_B = (-66.998, 44.8945), (-66.990, 44.8655)  # Eastport south tip -> Lubec shore
SEED = Point(-67.0555, 44.9095)                             # GNIS point for Cobscook Bay (open water)

fwd = pyproj.Transformer.from_crs(4326, 32619, always_xy=True).transform
inv = pyproj.Transformer.from_crs(32619, 4326, always_xy=True).transform


def land_polygons():
    # basemap clips the coastline to the map frame, and one big frame can join the shore up wrongly,
    # so build the land from a 3 x 3 grid of smaller frames and join them.
    lats = [LAT0 + (LAT1 - LAT0) * i / 3 for i in range(4)]
    lons = [LON0 + (LON1 - LON0) * j / 3 for j in range(4)]
    pieces = []
    for i in range(3):
        for j in range(3):
            frame = box(lons[j], lats[i], lons[j + 1], lats[i + 1])
            m = Basemap(projection="cyl", llcrnrlat=lats[i], urcrnrlat=lats[i + 1],
                        llcrnrlon=lons[j], urcrnrlon=lons[j + 1], resolution="f")
            parts = []
            for xy, kind in zip(m.coastpolygons, m.coastpolygontypes):
                if kind in (1, 3):  # land, and islands in lakes
                    p = Polygon(list(zip(xy[0], xy[1])))
                    parts.append(p if p.is_valid else p.buffer(0))
            if parts:
                pieces.append(unary_union(parts).intersection(frame))
    frame = box(LON0, LAT0, LON1, LAT1)
    land = unary_union(pieces).buffer(0)
    return land, frame.difference(land)


def cobscook(water):
    cut = Polygon([(LON0, LAT0), (LON0, LAT1), (MOUTH_A[0], LAT1), MOUTH_A, MOUTH_B, (MOUTH_B[0], LAT0)])
    parts = list(getattr(water.intersection(cut), "geoms", [water.intersection(cut)]))
    return max((p for p in parts if p.distance(SEED) < 1e-9), key=lambda p: p.area)


def rounded(geom, digits=5):
    def r(x, y, z=None):
        return (round(x, digits), round(y, digits))
    return transform(r, geom)


def main():
    land, water = land_polygons()
    bay = cobscook(water)
    bay_m, land_m = transform(fwd, bay), transform(fwd, land)

    rings, inner = [], None
    for miles in range(1, 11):
        reach = bay_m.buffer(miles * MILE, resolution=24).intersection(land_m)
        ring = reach if inner is None else reach.difference(inner)
        inner = reach
        ring = ring.simplify(35, preserve_topology=True).buffer(0)
        rings.append({"miles": miles, "sqmi": round(ring.area / MILE**2, 1),
                      "geometry": mapping(rounded(transform(inv, ring)))})
        print(f"ring {miles - 1}-{miles} mi: {ring.area / MILE**2:.1f} sq mi")

    bay_simple = transform(inv, bay_m.simplify(20, preserve_topology=True))
    data = {
        "source": "GSHHS full-resolution coastline (basemap-data-hires); distances in UTM 19N from the Cobscook Bay shore; rings cover land only.",
        "mouth": [MOUTH_A, MOUTH_B],
        "bay": mapping(rounded(bay_simple)),
        "baySqmi": round(bay_m.area / MILE**2, 1),
        "rings": rings,
    }
    with open(OUT, "w") as f:
        json.dump(data, f, separators=(",", ":"))
    print("wrote", OUT, os.path.getsize(OUT) // 1024, "KB")


if __name__ == "__main__":
    main()
