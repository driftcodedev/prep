// Pure helpers for the Cobscook Bay map: distances, ring colors, filters and formatting.
// No browser APIs here, so the tests can run all of it in Node.

const R = 6371008.8;         // mean Earth radius, meters
const MILE = 1609.344;
const RAD = Math.PI / 180;

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Straight-line distance in miles (haversine).
export function milesBetween(a, b) {
  const dLat = (b.lat - a.lat) * RAD;
  const dLon = (b.lon - a.lon) * RAD;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.sin(dLon / 2) ** 2;
  return (2 * R * Math.asin(Math.sqrt(h))) / MILE;
}

// GeoJSON Polygon or MultiPolygon -> list of polygons, each a list of rings of [lon, lat].
function polygonsOf(geometry) {
  if (geometry.type === "Polygon") return [geometry.coordinates];
  if (geometry.type === "MultiPolygon") return geometry.coordinates;
  throw new Error(`Unsupported geometry: ${geometry.type}`);
}

function inRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// Is [lon, lat] inside the polygon (and not in one of its holes)?
export function inPolygon(lon, lat, geometry) {
  return polygonsOf(geometry).some(([outer, ...holes]) => inRing(lon, lat, outer) && !holes.some((h) => inRing(lon, lat, h)));
}

// Builds a fast "miles from the bay shore" function for one bay outline. Points on the water get 0.
// Uses a flat projection centered on the bay, which is accurate to well under 1% at this size.
export function makeShoreDistance(bayGeometry) {
  const polys = polygonsOf(bayGeometry);
  let sumLat = 0, n = 0;
  for (const p of polys) for (const [, lat] of p[0]) { sumLat += lat; n++; }
  const lat0 = sumLat / n;
  const kx = R * RAD * Math.cos(lat0 * RAD);
  const ky = R * RAD;
  const segs = [];
  for (const p of polys) {
    for (const ring of p) {
      for (let i = 1; i < ring.length; i++) {
        segs.push([ring[i - 1][0] * kx, ring[i - 1][1] * ky, ring[i][0] * kx, ring[i][1] * ky]);
      }
    }
  }
  return function shoreMiles(lat, lon) {
    if (inPolygon(lon, lat, bayGeometry)) return 0;
    const px = lon * kx, py = lat * ky;
    let best = Infinity;
    for (const [ax, ay, bx, by] of segs) {
      const dx = bx - ax, dy = by - ay;
      const len = dx * dx + dy * dy;
      let t = len ? ((px - ax) * dx + (py - ay) * dy) / len : 0;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const ex = ax + t * dx - px, ey = ay + t * dy - py;
      const d = ex * ex + ey * ey;
      if (d < best) best = d;
    }
    return Math.sqrt(best) / MILE;
  };
}

// Which 1-mile ring a distance falls in: 0 = on the bay, 1 = 0–1 mi, ... 10 = 9–10 mi, 11 = beyond.
export function ringOf(miles) {
  if (miles <= 0) return 0;
  return Math.min(11, Math.ceil(miles));
}

// Colors for the picked distances. Ring k (k-1 to k miles) takes the color of the smallest picked
// distance >= k; rings past the largest pick are hidden (null).
// Returns { ringColors: [color|null x10], legend: [{ from, to, color }] }.
export function ringStyles(picked, colors) {
  const sorted = [...new Set(picked)].filter((m) => m >= 1 && m <= 10).sort((a, b) => a - b);
  const ringColors = Array.from({ length: 10 }, (_, i) => {
    const k = i + 1;
    const cap = sorted.find((m) => m >= k);
    return cap ? colors[cap - 1] : null;
  });
  const legend = sorted.map((m, i) => ({ from: i ? sorted[i - 1] : 0, to: m, color: colors[m - 1] }));
  return { ringColors, legend };
}

// Which houses pass the filters. info: Map of id -> { shore, ring }.
export function filterHouses(houses, f, info) {
  const maxRing = f.picked?.length ? Math.max(...f.picked) : 10;
  return houses.filter((h) => {
    if (f.power === "solar" && h.power !== "offgrid-solar") return false;
    if (f.power === "backup" && h.power === "none") return false;
    if (f.statuses && !f.statuses.has(statusGroup(h.status))) return false;
    if (f.maxPrice && h.price > f.maxPrice) return false;
    if (f.insideRings && info.get(h.id).ring > maxRing) return false;
    if (f.hideApprox && h.approx) return false;
    return true;
  });
}

// "under-contract" and "pending" are grouped: both mean an offer was accepted.
export function statusGroup(status) {
  return status === "under-contract" || status === "pending" ? "offer" : status;
}

export const STATUS_LABEL = {
  active: "For sale",
  "under-contract": "Under contract",
  pending: "Pending",
  expired: "Listing expired, unsold",
};

export const POWER_LABEL = {
  "offgrid-solar": "Off-grid solar",
  backup: "Backup power",
  none: "No backup power listed",
};

export function sortHouses(list, by, info) {
  const out = [...list];
  const key = {
    shore: (h) => info.get(h.id).shore,
    dennysville: (h) => info.get(h.id).dennysville,
    priceUp: (h) => h.price,
    priceDown: (h) => -h.price,
    newest: (h) => -(h.listed ? Date.parse(h.listed) : 0),
  }[by] || ((h) => info.get(h.id).shore);
  // Off-grid solar first, then backup power, then the rest; then by the chosen key.
  const rank = { "offgrid-solar": 0, backup: 1, none: 2 };
  return out.sort((a, b) => (by === "power" ? rank[a.power] - rank[b.power] : 0) || key(a) - key(b));
}

// ---------- formatting ----------

export function money(n) {
  return "$" + Math.round(n).toLocaleString("en-US");
}

export function shortMoney(n) {
  if (n >= 1e6) return "$" + Math.round(n / 1e4) / 100 + "M";
  return "$" + Math.round(n / 1000) + "k";
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function niceDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

// Whole days between two YYYY-MM-DD dates.
export function daysBetween(fromIso, toIso) {
  return Math.round((Date.parse(toIso) - Date.parse(fromIso)) / 86400000);
}

// A listing that went live in the last 14 days gets a "New" badge.
export const NEW_DAYS = 14;
export function isNew(h, today, days = NEW_DAYS) {
  if (!h.listed || h.status === "expired") return false;
  const d = daysBetween(h.listed, today);
  return d >= 0 && d <= days;
}

// The line under the map saying what the weekly check changed. changes: HOUSES_CHANGES.
export function changesText(changes) {
  if (!changes || !changes.previous) return "";
  const added = changes.added || [];
  const removed = changes.removed || [];
  const since = `since the last check on ${niceDate(changes.previous)}`;
  if (!added.length && !removed.length) return `No new or removed listings ${since}.`;
  const bits = [];
  if (added.length) bits.push(`${added.length} new listing${added.length === 1 ? "" : "s"} added`);
  if (removed.length) bits.push(`${removed.length} removed`);
  let text = `${bits.join(", ")} ${since}.`;
  text = text[0].toUpperCase() + text.slice(1);
  if (removed.length) text += ` Removed: ${removed.map((r) => `${r.address}, ${r.town} (${r.reason})`).join("; ")}.`;
  return text;
}

export function durationText(days) {
  if (days < 1) return "today";
  if (days < 45) return `${days} day${days === 1 ? "" : "s"}`;
  const months = Math.round(days / 30.44);
  if (months < 18) return `${days} days (about ${months} months)`;
  return `${days} days (about ${(days / 365.25).toFixed(1)} years)`;
}

// "Waterfront on Cobscook Bay" / "about 2.3 mi from Cobscook Bay". precision: "exact", "rounded"
// (longitude only to 2 decimals) or "approx" (no map point; pin placed by village or road).
export function shoreText(m, precision = "exact", place = "Cobscook Bay") {
  if (m < 0.05) return precision === "exact" ? `Waterfront on ${place}` : precision === "rounded" ? `By ${place}` : `Near ${place}`;
  return `${precision === "approx" ? "about " : ""}${milesText(m)} from ${place}`;
}

export const precisionOf = (h) => (h.approx ? "approx" : h.lonRounded ? "rounded" : "exact");

export function milesText(m) {
  if (m < 0.05) return "on the bay";
  if (m < 10) return `${m.toFixed(1)} mi`;
  return `${Math.round(m)} mi`;
}

// Daily power for a system of kw kilowatts, by season, using the local per-kW averages.
export function solarDaily(kw, perKw) {
  return {
    summer: kw * perKw.summer,
    spring: kw * perKw.spring,
    autumn: kw * perKw.autumn,
    winter: kw * perKw.winter,
  };
}

// Rows for "how long will it last": [{ part, life, until }]. Unknown parts get the full range.
export function lifespanRows(solar, lifespans) {
  const rows = [];
  const from = solar.installed;
  const span = ([a, b]) => `${a}–${b} years`;
  const until = ([a, b]) => (from ? `about ${from + a}–${from + b}` : "install year not listed");
  rows.push({ part: "Panels", life: span(lifespans.panels.years), until: until(lifespans.panels.years) });
  const bat = (solar.battery || "").toLowerCase();
  if (/lfp|lifepo|iron phosphate/.test(bat)) {
    rows.push({ part: "Battery (LFP)", life: span(lifespans.lfp.years), until: until(lifespans.lfp.years) });
  } else if (/lead/.test(bat)) {
    rows.push({ part: "Battery (lead-acid)", life: span(lifespans.leadAcid.years), until: until(lifespans.leadAcid.years) });
  } else {
    rows.push({ part: "Battery", life: `${lifespans.leadAcid.years[0]}–${lifespans.lfp.years[1]} years, depending on type`, until: "ask what type it is" });
  }
  rows.push({ part: "Inverter", life: span(lifespans.inverter.years), until: until(lifespans.inverter.years) });
  return rows;
}

// Satellite picture of a spot from map tiles: which tiles to draw and where, so the spot sits in the
// middle of a w x h box. Web Mercator, 256 px tiles.
export function tileView(lat, lon, z, w, h) {
  const n = 2 ** z;
  const px = ((lon + 180) / 360) * n * 256;
  const s = Math.sin(lat * RAD);
  const py = (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n * 256;
  const left = px - w / 2, top = py - h / 2;
  const tiles = [];
  for (let ty = Math.floor(top / 256); ty <= Math.floor((top + h - 1) / 256); ty++) {
    for (let tx = Math.floor(left / 256); tx <= Math.floor((left + w - 1) / 256); tx++) {
      tiles.push({ x: ((tx % n) + n) % n, y: ty, z, left: Math.round(tx * 256 - left), top: Math.round(ty * 256 - top) });
    }
  }
  return tiles;
}
