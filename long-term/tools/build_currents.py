"""Builds the tidal current and tidal flat layers for the Cobscook Bay map.

Not run by the site. Run it by hand from long-term/ when the source file changes:
    pip install netCDF4 numpy matplotlib pillow
    python3 tools/build_currents.py

Source: NOAA's WebGNOME location file for Passamaquoddy Bay, ME (gnome.orr.noaa.gov, Location
Files -> Passamaquoddy Bay -> run the wizard -> Save -> "Download Your Model Setup"). The saved
.gnome file is a zip; it is kept in tools/source/. Inside:
  PQBayCur.nc4         12 current patterns through one average (M2) tide, on a triangle grid
                       (Bedford Institute of Oceanography QUODDY model, with flooding and drying)
  PassamaquoddyTOP.dat the grid's triangles; vertex k of this file is node TransposeArray[k] of
                       the .nc4 file
Patterns are about 1.035 hours apart and are scaled to the average tide at Estes Head, Eastport
(the model's 2.3 knots there matches NOAA's 2.2 flood / 2.4 ebb).

Writes, in long-term/data/:
  currents.json        arrow points (3 zoom levels), u/v per pattern, dry flags, high-water pattern
  currents-peak.png    strongest current on an average tide, in 5 bands (Web Mercator, for the map)
  currents-flats.png   ground that dries at low tide (Web Mercator, for the map)
  currents-print.png   the same for paper, with labels and a key (for the printed report)
"""
import json, os, re, zipfile, io, math
import numpy as np
import netCDF4
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.tri as mtri
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "..", "data")
SOURCE = os.path.join(HERE, "source", "passamaquoddy_bay_save.gnome")

KNOTS = 1.94384                      # per m/s
LON0, LON1, LAT0, LAT1 = -67.30, -66.86, 44.83, 45.12   # the map's water, cropped from the model
# South of 44.83 (Quoddy Narrows) the grid turns coarse near the model's open edge, so it is left out.
BANDS = [0, 0.5, 1, 2, 3, 99]        # knots
COLORS = ["#d4ebf5", "#86c3dd", "#f2c14e", "#e8772e", "#b0302a"]   # keep in step with js/currents.js
FLATS = "#c9a96b"
SPACING_M = [1600, 800, 400]         # arrow points: zoomed out, middle, zoomed in
EASTPORT = (-66.9829, 44.9046)       # NOAA tide station 8410140
CHECKED = "2026-11-26"


def load():
    with zipfile.ZipFile(SOURCE) as z:
        nc_bytes = z.read("PQBayCur.nc4")
        top = z.read("PassamaquoddyTOP.dat").decode("latin-1").splitlines()
    d = netCDF4.Dataset("in-memory", memory=nc_bytes)
    lon = np.array(d["lon"][:], float)
    lat = np.array(d["lat"][:], float)
    u = np.array(d["u"][:], float)
    v = np.array(d["v"][:], float)
    z = np.array(d["z"][:], float)
    head = [i for i, l in enumerate(top) if l.split() and l.split()[0] in ("Vertices", "Topology")]
    nv = int(top[0].split()[1])
    transpose = np.array([int(top[1 + k]) for k in range(nv)])
    ti = [i for i in head if top[i].startswith("Topology")][0]
    nt = int(top[ti].split()[1])
    tri_top = np.array([list(map(int, top[ti + 1 + k].split()[:3])) for k in range(nt)])
    tri = transpose[tri_top]                                   # triangles in .nc4 node numbers
    return lon, lat, u, v, z, tri


def merc_y(lat):
    return np.log(np.tan(np.pi / 4 + np.radians(lat) / 2))


def render_png(path, lon, lat, tri, field, levels, colors, width=2400, merc=True):
    """Filled contours of a node field over the crop box, transparent elsewhere."""
    y = merc_y(lat) if merc else lat
    y0, y1 = (merc_y(LAT0), merc_y(LAT1)) if merc else (LAT0, LAT1)
    x_span = math.radians(LON1 - LON0)
    height = int(round(width * (y1 - y0) / x_span))
    fig = plt.figure(figsize=(width / 100, height / 100), dpi=100)
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(LON0, LON1)
    ax.set_ylim(y0, y1)
    ax.axis("off")
    t = mtri.Triangulation(lon, y, tri)
    t.set_mask(np.isnan(field[tri]).any(axis=1))
    ax.tricontourf(t, np.nan_to_num(field), levels=levels, colors=colors, antialiased=True)
    buf = io.BytesIO()
    fig.savefig(buf, transparent=True, format="png")
    plt.close(fig)
    img = Image.open(buf).convert("RGBA")
    img.quantize(colors=32, method=Image.Quantize.FASTOCTREE).save(path, optimize=True)
    return height


def sample_points(lon, lat, wet_any):
    """Nodes on a coarse-to-fine grid, so arrows stay evenly spaced at each zoom level."""
    k = math.cos(math.radians(44.95))
    x = (lon - LON0) * 111320 * k
    y = (lat - LAT0) * 110570
    taken = {}
    order = []
    for level, s in enumerate(SPACING_M):
        cells = {}
        for i in np.where(wet_any)[0]:
            key = (int(x[i] // s), int(y[i] // s))
            cx, cy = (key[0] + 0.5) * s, (key[1] + 0.5) * s
            d = (x[i] - cx) ** 2 + (y[i] - cy) ** 2
            if key not in cells or d < cells[key][0]:
                cells[key] = (d, i)
        for key, (_, i) in cells.items():
            cell_has = any((int(x[j] // s), int(y[j] // s)) == key for j in taken)
            if not cell_has and i not in taken:
                taken[i] = level
                order.append(i)
    return order, taken


def places(path):
    """Every water name and spot in data/places.js: (name, lat, lon)."""
    src = open(path, encoding="utf-8").read()
    return [(n, float(la), float(lo)) for n, la, lo in re.findall(r'name: "([^"]+)", lat: ([\d.]+), lon: (-[\d.]+), (?:tier|kind)', src)]


def area_stats(lon, lat, peak, spd, hw, ok, name_list, km=1.2):
    """Typical and fastest peak current within km of each place, and its two slack patterns."""
    out = []
    hours = [((p - hw) * 12.42 / 12) % 12.42 for p in range(12)]
    near_high = [h <= 12.42 / 4 or h >= 12.42 * 3 / 4 for h in hours]
    for name, la, lo in name_list:
        k = math.cos(math.radians(la))
        d = np.hypot((lon - lo) * 111.32 * k, (lat - la) * 110.57)
        sel = ok & (d <= km) & (np.nan_to_num(peak) > 0)
        if not sel.any():
            continue
        p = np.sort(peak[sel])
        with np.errstate(all="ignore"):
            mean = np.nanmean(spd[:, sel], axis=1)
        mean = np.where(np.isnan(mean), np.inf, mean)
        hi = min((i for i in range(12) if near_high[i]), key=lambda i: mean[i])
        lo_ = min((i for i in range(12) if not near_high[i]), key=lambda i: mean[i])
        out.append({"name": name, "typical": round(float(np.median(p)), 2), "fastest": round(float(p[-1]), 2),
                    "slack": [hi, lo_], "nodes": int(sel.sum())})
    return out


def labels(path):
    """Water names (tier 0-1), from data/places.js, for the print figure."""
    src = open(path, encoding="utf-8").read()
    names = re.findall(r'name: "([^"]+)", lat: ([\d.]+), lon: (-[\d.]+), tier: ([01])(?![^}]*outside)', src)
    return [(n, float(la), float(lo)) for n, la, lo, _ in names]


def render_print(path, lon, lat, tri, peak, flats_lw, geo, places):
    box = (-67.235, -66.965, 44.83, 44.975)
    k = math.cos(math.radians(44.9))
    fig = plt.figure(figsize=(7.6, 7.6 * (box[3] - box[2]) / ((box[1] - box[0]) * k) + 0.9), dpi=200)
    ax = fig.add_axes([0.01, 0.12, 0.98, 0.87])
    t = mtri.Triangulation(lon, lat, tri)
    t.set_mask(np.isnan(peak[tri]).any(axis=1))
    ax.tricontourf(t, np.nan_to_num(peak), levels=BANDS, colors=COLORS)
    t2 = mtri.Triangulation(lon, lat, tri)
    ax.tricontourf(t2, flats_lw, levels=[0.5, 1.5], colors=[FLATS])
    for ring in geo["bay"]["coordinates"]:
        r = np.array(ring)
        ax.plot(r[:, 0], r[:, 1], color="#1c2a29", lw=0.35, alpha=0.6)
    font = dict(fontsize=7.5, fontweight="bold", color="#1c2a29", ha="center", va="center",
                bbox=dict(boxstyle="round,pad=0.15", fc="white", ec="none", alpha=0.75))
    for n, la, lo in places:
        if box[0] < lo < box[1] and box[2] < la < box[3]:
            ax.text(lo, la, n, **font)
    ax.plot(-67.1272, 44.8837, marker="^", color="#b0302a", ms=6, mec="white", mew=0.8)
    ax.text(-67.1272, 44.8800, "Reversing Falls", fontsize=7.5, fontweight="bold", color="#b0302a", ha="center", va="top")
    for n, la, lo in (("Dennysville", 44.9037, -67.2286), ("Eastport", 44.9062, -66.99), ("Lubec", 44.8606, -66.9842)):
        ax.plot(lo, la, "o", color="#1c2a29", ms=3)
        ax.text(lo + 0.003, la + 0.002, n, fontsize=7, color="#1c2a29")
    ax.set_xlim(box[0], box[1])
    ax.set_ylim(box[2], box[3])
    ax.set_aspect(1 / k)
    ax.set_xticks([])
    ax.set_yticks([])
    for s in ax.spines.values():
        s.set_color("#c6cfcb")
    key = fig.add_axes([0.02, 0.01, 0.96, 0.09])
    key.axis("off")
    items = [(COLORS[0], "under 0.5 knots"), (COLORS[1], "0.5–1"), (COLORS[2], "1–2"), (COLORS[3], "2–3"), (COLORS[4], "over 3"), (FLATS, "dries at low tide")]
    for i, (c, txt) in enumerate(items):
        x = i / len(items)
        key.add_patch(plt.Rectangle((x, 0.45), 0.03, 0.4, color=c, transform=key.transAxes))
        key.text(x + 0.037, 0.65, txt, fontsize=7.5, va="center", transform=key.transAxes, color="#1c2a29")
    key.text(0, 0.05, "Strongest current on an average tide. NOAA WebGNOME Passamaquoddy Bay model (Bedford Institute of Oceanography).",
             fontsize=6.5, color="#4a5957", transform=key.transAxes)
    fig.savefig(path, facecolor="white")
    plt.close(fig)
    img = Image.open(path).convert("RGB")
    img.quantize(colors=48, method=Image.Quantize.MEDIANCUT).save(path, optimize=True)


def main():
    lon, lat, u, v, z, tri = load()
    dry = (u > 500) | (v > 500) | (u < -9000)
    spd = np.where(dry, np.nan, np.hypot(u, v)) * KNOTS
    with np.errstate(all="ignore"):
        peak = np.where(dry.all(axis=0), np.nan, np.nanmax(np.nan_to_num(spd, nan=-1), axis=0))

    # High water at Eastport, as a fractional pattern number, from a one-cycle cosine fit.
    e = int(np.argmin((lon - EASTPORT[0]) ** 2 + (lat - EASTPORT[1]) ** 2))
    ph = np.angle(np.sum(z[:, e] * np.exp(-2j * np.pi * np.arange(12) / 12)))
    hw = (-ph / (2 * np.pi) * 12) % 12
    lw_pattern = int(round(hw + 6)) % 12
    hw_pattern = int(round(hw)) % 12
    flats_lw = (dry[lw_pattern] & ~dry[hw_pattern]).astype(float)

    # Crop to the map's water.
    inbox = (lon >= LON0) & (lon <= LON1) & (lat >= LAT0) & (lat <= LAT1)
    keep_tri = tri[inbox[tri].all(axis=1)]
    wet_any = inbox & ~dry.all(axis=0)

    os.makedirs(DATA, exist_ok=True)
    render_png(os.path.join(DATA, "currents-peak.png"), lon, lat, keep_tri, np.where(inbox, peak, np.nan), BANDS, COLORS)
    render_png(os.path.join(DATA, "currents-flats.png"), lon, lat, keep_tri, np.where(inbox, flats_lw, np.nan), [0.5, 1.5], [FLATS])

    order, level = sample_points(lon, lat, wet_any)
    pts, us, vs = [], [], []
    for i in order:
        mask = sum(1 << p for p in range(12) if dry[p, i])
        pts.append([round(lon[i], 5), round(lat[i], 5), level[i], mask])
        us.append([0 if dry[p, i] else int(round(u[p, i] * KNOTS * 100)) for p in range(12)])
        vs.append([0 if dry[p, i] else int(round(v[p, i] * KNOTS * 100)) for p in range(12)])

    out = {
        "source": "NOAA WebGNOME location file, Passamaquoddy Bay, ME (Bedford Institute of Oceanography QUODDY model)",
        "checked": CHECKED,
        "bounds": [[LAT0, LON0], [LAT1, LON1]],
        "bands": BANDS[1:-1],
        "colors": COLORS,
        "flatsColor": FLATS,
        "hoursPerPattern": round(12.42 / 12, 4),
        "hwPattern": round(float(hw), 2),
        "lwPattern": lw_pattern,
        "fields": ["lon", "lat", "level", "dryMask"],
        "levels": SPACING_M,
        "areas": area_stats(lon, lat, peak, spd, hw, wet_any, places(os.path.join(DATA, "places.js"))),
        "points": pts,
        "u": us,
        "v": vs,
    }
    with open(os.path.join(DATA, "currents.json"), "w") as f:
        json.dump(out, f, separators=(",", ":"))

    geo = json.load(open(os.path.join(DATA, "geo.json")))
    render_print(os.path.join(DATA, "currents-print.png"), lon, lat, keep_tri, peak, flats_lw, geo, labels(os.path.join(DATA, "places.js")))
    print(f"high water pattern {hw:.2f}, low water pattern {lw_pattern}; {len(pts)} arrow points;",
          f"peak in box {np.nanmax(peak[inbox]):.2f} kn")


if __name__ == "__main__":
    main()
