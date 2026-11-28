"""Builds the water depth layer for the Cobscook Bay map from NOAA's BlueTopo depth files.

Not run by the site. Run it by hand from long-term/ when the source files change:
    pip install rasterio numpy pillow shapely matplotlib
    python3 tools/build_depth.py /path/to/BlueTopo_*.tiff

Source: NOAA Office of Coast Survey, BlueTopo: the National Bathymetric Source's compilation of the
best depth data it has (NOAA multibeam surveys, lidar and older surveys). Get the GeoTIFF tiles that
cover Cobscook Bay as the README says. They are too big for the repo, so keep them outside it.
Band 1 is elevation in meters above NAVD88 (negative under water).

Depths here are at low tide, below mean lower low water (MLLW), the datum nautical charts use. At
Eastport, NAVD88 is 3.029 m above MLLW, mean high water 5.729 m and mean higher high water 5.874 m
(NOAA tide station 8410140, 1983-2001 epoch). One offset is used for the whole bay.

Writes, in long-term/data/:
  depth.json             bounds, which tiles exist at each zoom, the color bands, datums and source
  depth/{z}/{x}/{y}.png  colored depth tiles with depth lines and light shading, zoom ZMIN to ZMAX
  depth/v/{x}/{y}.png    one-byte depth codes at zoom ZMAX - 1, read when someone taps the water
  depth-print.png        the whole bay with a key, for the printed report

Options:
  --zmax N     finest zoom (default: from the source cell size: 15 for 4 m, 14 for 8 m, 16 for 2 m)
  --source S   words for the "source" line in depth.json (default: NOAA BlueTopo)
"""
import argparse, glob, json, math, os, re, shutil, sys
import numpy as np
import rasterio
from rasterio.warp import reproject, Resampling, transform_bounds
from rasterio.features import rasterize
from rasterio.transform import from_origin
from shapely.geometry import shape, mapping, Polygon, box
from shapely.ops import transform as shp_transform
from pyproj import Transformer
from PIL import Image
from scipy.ndimage import distance_transform_edt
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "..", "data")
OUT_TILES = os.path.join(DATA, "depth")

R = 6378137.0
WORLD = 2 * math.pi * R
FT = 3.28084
NAVD88_ABOVE_MLLW = 3.029     # m, Eastport 8410140
MHW = 5.729                   # m above MLLW
MHHW = 5.874                  # m above MLLW
ZMIN = 11
BUFFER_M = 900                # keep this much past the bay outline: it's rough, and flats run past it
MOUTH_ALLOW_M = 300           # ...but only this much past the mouth line, into Friar Roads
PASSY_EDGE = [(-66.984, 44.897)]  # nothing east of here and north of this (the Passamaquoddy side of Eastport)
CHECKED = "2026-11-28"

# Depth at low tide, feet: upper edge of each band. Keep in step with js/depth.js (it reads these
# from depth.json). The first band is ground that dries at low tide (above MLLW, below MHHW).
BANDS = [
    (0, "#d8c28f", "Dries at low tide"),
    (6, "#e2f2f5", "0–6 ft"),
    (12, "#c2e3ec", "6–12 ft"),
    (20, "#9bcfe2", "12–20 ft"),
    (30, "#72b8d6", "20–30 ft"),
    (50, "#4b9cc6", "30–50 ft"),
    (75, "#2f7cb2", "50–75 ft"),
    (100, "#205a92", "75–100 ft"),
    (99999, "#173e6c", "Over 100 ft"),
]
LINE = np.array([16, 44, 66], float)   # depth lines: dark blue-gray, drawn at the band edges


# ---------- the one-byte depth code (keep in step with decodeDepth() in js/depth.js) ----------
# 0 no data; 1-40 dries, 0.5 to 20 ft above MLLW; 41-160 depth 0 to 59.5 ft by 0.5 ft;
# 161-230 depth 60 to 198 ft by 2 ft; 231-255 depth 200 to 440 ft by 10 ft.
def encode(depth_ft):
    d = np.asarray(depth_ft, float)
    code = np.zeros(d.shape, np.uint8)
    ok = np.isfinite(d)
    dry = ok & (d < -0.25)
    code[dry] = np.clip(np.round(-d[dry] / 0.5), 1, 40)
    a = ok & ~dry & (d < 59.75)
    code[a] = 41 + np.clip(np.round(np.maximum(d[a], 0) / 0.5), 0, 119)
    b = ok & (d >= 59.75) & (d < 199)
    code[b] = 161 + np.clip(np.round((d[b] - 60) / 2), 0, 69)
    c = ok & (d >= 199)
    code[c] = 231 + np.clip(np.round((d[c] - 200) / 10), 0, 24)
    return code


def decode(code):
    code = int(code)
    if code == 0:
        return None
    if code <= 40:
        return -code * 0.5
    if code <= 160:
        return (code - 41) * 0.5
    if code <= 230:
        return 60 + (code - 161) * 2
    return 200 + (code - 231) * 10


# ---------- web mercator tiles ----------
def res_at(z):
    return WORLD / (256 * 2 ** z)


def tile_range(bounds_m, z):
    """Tiles (x0, y0, x1, y1 inclusive) covering web mercator bounds (minx, miny, maxx, maxy)."""
    n = 2 ** z
    size = WORLD / n
    x0 = int(math.floor((bounds_m[0] + WORLD / 2) / size))
    x1 = int(math.floor((bounds_m[2] + WORLD / 2) / size))
    y0 = int(math.floor((WORLD / 2 - bounds_m[3]) / size))
    y1 = int(math.floor((WORLD / 2 - bounds_m[1]) / size))
    return x0, y0, x1, y1


def grid_for(bounds_m, z):
    x0, y0, x1, y1 = tile_range(bounds_m, z)
    size = WORLD / 2 ** z
    left = x0 * size - WORLD / 2
    top = WORLD / 2 - y0 * size
    w = (x1 - x0 + 1) * 256
    h = (y1 - y0 + 1) * 256
    return (x0, y0, x1, y1), from_origin(left, top, res_at(z), res_at(z)), (h, w)


# ---------- reading the sources ----------
def read_sources(paths, bounds_m, z):
    """Elevation above MLLW (m) on the zoom-z grid, finest source first, NaN where there is none."""
    tiles, tfm, shape_hw = grid_for(bounds_m, z)
    out = np.full(shape_hw, np.nan, np.float32)
    infos = []
    for p in paths:
        with rasterio.open(p) as src:
            infos.append((abs(src.res[0]), p))
    for _, p in sorted(infos):
        with rasterio.open(p) as src:
            band = src.read(1, masked=True).astype(np.float32).filled(np.nan)
            dst = np.full(shape_hw, np.nan, np.float32)
            reproject(band, dst, src_transform=src.transform, src_crs=src.crs, src_nodata=np.nan,
                      dst_transform=tfm, dst_crs="EPSG:3857", dst_nodata=np.nan,
                      resampling=Resampling.bilinear)
            fill = np.isnan(out) & np.isfinite(dst)
            out[fill] = dst[fill]
    return tiles, tfm, out + NAVD88_ABOVE_MLLW


def resample(src, src_tfm, bounds_m, z):
    tiles, tfm, shape_hw = grid_for(bounds_m, z)
    dst = np.full(shape_hw, np.nan, np.float32)
    reproject(src, dst, src_transform=src_tfm, src_crs="EPSG:3857", src_nodata=np.nan,
              dst_transform=tfm, dst_crs="EPSG:3857", dst_nodata=np.nan, resampling=Resampling.average)
    return tiles, tfm, dst


def clip_area(geo):
    """The bay's outline widened by BUFFER_M (the outline is rough, and the flats run past it), but
    stopped MOUTH_ALLOW_M past the mouth line and kept off the Passamaquoddy side of Moose Island."""
    to_m = Transformer.from_crs(4326, 3857, always_xy=True).transform
    bay = shp_transform(to_m, shape(geo["bay"])).buffer(BUFFER_M)
    (ax, ay), (bx, by) = [to_m(*pt) for pt in geo["mouth"]]
    ux, uy = (bx - ax), (by - ay)
    n = math.hypot(ux, uy)
    ux, uy = ux / n, uy / n
    ex, ey = uy, -ux                      # perpendicular, pointing east (out of the bay)
    if ex < 0:
        ex, ey = -ex, -ey
    far, k = 8000, MOUTH_ALLOW_M * 1.0 / math.cos(math.radians(44.9))
    a0 = (ax - ux * 1500 + ex * k, ay - uy * 1500 + ey * k)
    b0 = (bx + ux * 1500 + ex * k, by + uy * 1500 + ey * k)
    outside = Polygon([a0, b0, (b0[0] + ex * far, b0[1] + ey * far), (a0[0] + ex * far, a0[1] + ey * far)])
    px, py = to_m(*PASSY_EDGE[0])
    _, top = to_m(-66.98, 45.2)
    passy = box(px, py, px + far, top)
    return bay.difference(outside).difference(passy)


def bay_mask(geo, tfm, shape_hw):
    return rasterize([(mapping(clip_area(geo)), 1)], out_shape=shape_hw, transform=tfm, fill=0, dtype="uint8").astype(bool)


# ---------- drawing ----------
def band_index(depth_ft):
    edges = np.array([b[0] for b in BANDS[:-1]], float)
    return np.searchsorted(edges, depth_ft, side="right")


def fill_nearest(a):
    """NaNs filled from the nearest value, so the shading doesn't make a cliff at the shore."""
    bad = ~np.isfinite(a)
    if not bad.any() or bad.all():
        return np.nan_to_num(a)
    idx = distance_transform_edt(bad, return_distances=False, return_indices=True)
    return a[tuple(idx)]


def hillshade(elev, res, z):
    # Exaggerated more when zoomed out, so channels still show.
    zf = 2.5 * 2 ** (max(0, 15 - z) * 0.5)
    gy, gx = np.gradient(fill_nearest(elev), res)
    slope = np.arctan(zf * np.hypot(gx, gy))
    aspect = np.arctan2(-gx, gy)
    az, alt = math.radians(315), math.radians(45)
    hs = np.sin(alt) * np.cos(slope) + np.cos(alt) * np.sin(slope) * np.cos(az - aspect)
    return np.clip(hs, 0, 1)


def colorize(elev_mllw, inside, res, z, shade=True):
    depth_ft = -elev_mllw * FT
    valid = inside & np.isfinite(depth_ft) & (elev_mllw < MHHW)
    bi = band_index(np.where(valid, depth_ft, 0))
    colors = np.array([[int(c[1][i:i + 2], 16) for i in (1, 3, 5)] for c in BANDS], float)
    rgb = colors[bi]
    if shade:
        hs = hillshade(np.where(valid, elev_mllw, np.nan), res, z)
        rgb *= (0.78 + 0.32 * hs)[..., None]
    # Depth lines where the band changes.
    edge = np.zeros(bi.shape, bool)
    edge[:, :-1] |= (bi[:, :-1] != bi[:, 1:]) & valid[:, :-1] & valid[:, 1:]
    edge[:-1, :] |= (bi[:-1, :] != bi[1:, :]) & valid[:-1, :] & valid[1:, :]
    rgb[edge] = rgb[edge] * 0.45 + LINE * 0.55
    rgba = np.zeros(bi.shape + (4,), np.uint8)
    rgba[..., :3] = np.clip(rgb, 0, 255)
    rgba[..., 3] = np.where(valid, 255, 0)
    return rgba, valid, depth_ft


def save_png(arr, path, mode):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img = Image.fromarray(arr, mode)
    if mode == "RGBA":
        img = img.quantize(colors=96, method=Image.Quantize.FASTOCTREE)
    img.save(path, optimize=True)


def write_tiles(arr, tiles, folder, mode, keep):
    x0, y0, x1, y1 = tiles
    written = []
    for ty in range(y0, y1 + 1):
        for tx in range(x0, x1 + 1):
            r, c = (ty - y0) * 256, (tx - x0) * 256
            piece = arr[r:r + 256, c:c + 256]
            if not keep(piece):
                continue
            save_png(np.ascontiguousarray(piece), os.path.join(folder, str(tx), f"{ty}.png"), mode)
            written.append(f"{tx},{ty}")
    return written


# ---------- the printed map ----------
def labels(path):
    src = open(path, encoding="utf-8").read()
    names = re.findall(r'name: "([^"]+)", lat: ([\d.]+), lon: (-[\d.]+), tier: ([01])(?![^}]*outside)', src)
    return [(n, float(la), float(lo)) for n, la, lo, _ in names]


def render_print(path, rgba, tfm, geo, places, source_line):
    to_m = Transformer.from_crs(4326, 3857, always_xy=True).transform
    h, w = rgba.shape[:2]
    left, top = tfm.c, tfm.f
    right, bottom = left + w * tfm.a, top + h * tfm.e
    box_ll = (-67.235, 44.808, -66.965, 44.975)
    bx0, by0 = to_m(box_ll[0], box_ll[1])
    bx1, by1 = to_m(box_ll[2], box_ll[3])
    fig_w = 7.6
    fig = plt.figure(figsize=(fig_w, fig_w * (by1 - by0) / (bx1 - bx0) + 1.05), dpi=200)
    ax = fig.add_axes([0.01, 0.13, 0.98, 0.86])
    ax.imshow(rgba, extent=(left, right, bottom, top), interpolation="nearest")
    for ring in geo["bay"]["coordinates"]:
        xs, ys = zip(*[to_m(lo, la) for lo, la in ring])
        ax.plot(xs, ys, color="#1c2a29", lw=0.35, alpha=0.6)
    font = dict(fontsize=7.5, fontweight="bold", color="#1c2a29", ha="center", va="center",
                bbox=dict(boxstyle="round,pad=0.15", fc="white", ec="none", alpha=0.75))
    for n, la, lo in places:
        if box_ll[0] < lo < box_ll[2] and box_ll[1] < la < box_ll[3]:
            ax.text(*to_m(lo, la), n, **font)
    for n, la, lo in (("Dennysville", 44.9037, -67.2286), ("Eastport", 44.9062, -66.99), ("Lubec", 44.8606, -66.9842)):
        x, y = to_m(lo, la)
        ax.plot(x, y, "o", color="#1c2a29", ms=3)
        ax.text(x + 200, y + 200, n, fontsize=7, color="#1c2a29")
    ax.set_xlim(bx0, bx1)
    ax.set_ylim(by0, by1)
    ax.set_aspect("equal")
    ax.set_xticks([])
    ax.set_yticks([])
    for s in ax.spines.values():
        s.set_color("#c6cfcb")
    key = fig.add_axes([0.02, 0.005, 0.96, 0.115])
    key.axis("off")
    per_row = 5
    for i, (_, c, txt) in enumerate(BANDS):
        row, col = divmod(i, per_row)
        x = col / per_row
        y = 0.72 - row * 0.32
        key.add_patch(plt.Rectangle((x, y - 0.1), 0.028, 0.22, color=c, ec="#8a9a98", lw=0.3, transform=key.transAxes))
        key.text(x + 0.036, y, txt, fontsize=7.5, va="center", transform=key.transAxes, color="#1c2a29")
    key.text(0, 0.02, f"Depth at low tide (mean lower low water), feet. {source_line} Not for navigation.",
             fontsize=6.5, color="#4a5957", transform=key.transAxes)
    fig.savefig(path, facecolor="white")
    plt.close(fig)
    img = Image.open(path).convert("RGB")
    img.quantize(colors=64, method=Image.Quantize.MEDIANCUT).save(path, optimize=True)


def area_stats(depth_ft, valid, tfm, places, km=0.8):
    """Typical (middle) and deepest depth, and the share that dries, within km of each named place."""
    to_m = Transformer.from_crs(4326, 3857, always_xy=True).transform
    h, w = depth_ft.shape
    out = []
    for name, la, lo in places:
        x, y = to_m(lo, la)
        col = (x - tfm.c) / tfm.a
        row = (y - tfm.f) / tfm.e
        r_px = km * 1000 / math.cos(math.radians(la)) / tfm.a
        r0, r1 = int(max(0, row - r_px)), int(min(h, row + r_px + 1))
        c0, c1 = int(max(0, col - r_px)), int(min(w, col + r_px + 1))
        if r0 >= r1 or c0 >= c1:
            continue
        yy, xx = np.mgrid[r0:r1, c0:c1]
        near = ((yy - row) ** 2 + (xx - col) ** 2 <= r_px ** 2) & valid[r0:r1, c0:c1]
        d = depth_ft[r0:r1, c0:c1][near]
        if d.size < 20:
            continue
        wet = d[d >= 0]
        out.append({
            "name": name,
            "typicalFt": round(float(np.median(wet)), 1) if wet.size else None,
            "deepestFt": round(float(d.max()), 1),
            "driesShare": round(float((d < 0).mean()), 2),
        })
    return out


# ---------- main ----------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("sources", nargs="+")
    ap.add_argument("--zmax", type=int, default=0)
    ap.add_argument("--source", default="NOAA BlueTopo (NOAA surveys, lidar and older soundings).")
    args = ap.parse_args()
    paths = sorted({p for s in args.sources for p in glob.glob(s)})
    if not paths:
        sys.exit("No source files found.")

    geo = json.load(open(os.path.join(DATA, "geo.json")))
    to_m = Transformer.from_crs(4326, 3857, always_xy=True).transform
    bounds_m = clip_area(geo).bounds

    cell = min(abs(rasterio.open(p).res[0]) for p in paths)
    zmax = args.zmax or (16 if cell <= 2.5 else 15 if cell <= 5 else 14 if cell <= 10 else 13)
    print(f"{len(paths)} source files, finest cell {cell:g} m, building zoom {ZMIN}-{zmax}")

    tiles_max, tfm_max, elev = read_sources(paths, bounds_m, zmax)
    inside_max = bay_mask(geo, tfm_max, elev.shape)
    elev[~inside_max] = np.nan

    if os.path.isdir(OUT_TILES):
        shutil.rmtree(OUT_TILES)
    listing = {}
    stats = {}
    areas = []
    for z in range(ZMIN, zmax + 1):
        if z == zmax:
            tiles, tfm, e = tiles_max, tfm_max, elev
        else:
            tiles, tfm, e = resample(elev, tfm_max, bounds_m, z)
        inside = bay_mask(geo, tfm, e.shape)
        rgba, valid, depth_ft = colorize(e, inside, res_at(z), z)
        listing[str(z)] = write_tiles(rgba, tiles, os.path.join(OUT_TILES, str(z)), "RGBA", lambda p: p[..., 3].any())
        if z == zmax - 1:
            codes = np.where(valid, encode(depth_ft), 0).astype(np.uint8)
            listing["v"] = write_tiles(codes, tiles, os.path.join(OUT_TILES, "v"), "L", lambda p: p.any())
        if z == 13:
            render_print(os.path.join(DATA, "depth-print.png"), rgba, tfm, geo,
                         labels(os.path.join(DATA, "places.js")), args.source)
        if z == zmax:
            areas = area_stats(depth_ft, valid, tfm, labels(os.path.join(DATA, "places.js")))
            d = depth_ft[valid]
            stats = {
                "deepestFt": round(float(np.nanmax(d)), 1),
                "driesSqmi": round(float((d < 0).sum()) * (res_at(z) * math.cos(math.radians(44.9))) ** 2 / 2.59e6, 2),
            }

    to_ll = Transformer.from_crs(3857, 4326, always_xy=True).transform
    w, s = to_ll(bounds_m[0], bounds_m[1])
    e_, n = to_ll(bounds_m[2], bounds_m[3])
    out = {
        "source": args.source,
        "checked": CHECKED,
        "files": [os.path.basename(p) for p in paths],
        "cellM": cell,
        "datum": {"name": "MLLW", "navd88AboveMllwM": NAVD88_ABOVE_MLLW, "mhwFt": round(MHW * FT, 1),
                  "mhhwFt": round(MHHW * FT, 1), "station": "Eastport 8410140"},
        "bounds": [[round(s, 5), round(w, 5)], [round(n, 5), round(e_, 5)]],
        "zmin": ZMIN,
        "zmax": zmax,
        "valueZoom": zmax - 1,
        "bands": [{"maxFt": b[0], "color": b[1], "label": b[2]} for b in BANDS],
        "stats": stats,
        "areas": areas,
        "tiles": listing,
    }
    with open(os.path.join(DATA, "depth.json"), "w") as f:
        json.dump(out, f, separators=(",", ":"))
    size = sum(os.path.getsize(os.path.join(dp, fn)) for dp, _, fns in os.walk(OUT_TILES) for fn in fns)
    print("tiles per zoom:", {k: len(v) for k, v in listing.items()}, f"total {size / 1e6:.1f} MB", stats)


if __name__ == "__main__":
    main()
