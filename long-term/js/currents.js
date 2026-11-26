// Tidal currents and tidal flats for the Cobscook Bay map.
//
// Data: data/currents.json, currents-peak.png and currents-flats.png, built by
// tools/build_currents.py from NOAA's WebGNOME model of Passamaquoddy Bay (12 snapshots through
// an average tide). The helpers are pure, so the tests run them in Node; createCurrents() draws
// on a live Leaflet map.
//
// currents.json: points[i] = [lon, lat, level, dryMask]; u[i][p], v[i][p] = east and north speed
// in hundredths of a knot at pattern p (0 when dry); bit p of dryMask = dry at pattern p.
// level 0 points show at every zoom, level 1 from zoom 11, level 2 from zoom 12.5.

export const CURRENT_BANDS = [
  { max: 0.5, color: "#d4ebf5", arrow: "#4f8aa6", label: "under 0.5" },
  { max: 1, color: "#86c3dd", arrow: "#2b6c90", label: "0.5–1" },
  { max: 2, color: "#f2c14e", arrow: "#cf9512", label: "1–2" },
  { max: 3, color: "#e8772e", arrow: "#d0601c", label: "2–3" },
  { max: Infinity, color: "#b0302a", arrow: "#a52a24", label: "over 3" },
];
export const FLATS_COLOR = "#c9a96b";
export const TIDE_HOURS = 12.42;
const DIRS = ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"];

export const bandOf = (knots) => CURRENT_BANDS.findIndex((b) => knots < b.max);

// ---------- the tide clock ----------

// Hours after high tide at Eastport for pattern p, 0 to 12.42.
export function hoursAfterHigh(p, data) {
  const h = ((p - data.hwPattern) * data.hoursPerPattern) % TIDE_HOURS;
  return h < 0 ? h + TIDE_HOURS : h;
}

function spanText(h) {
  const x = Math.round(h * 2) / 2;
  if (x === 0) return "";
  const whole = Math.floor(x);
  const half = x % 1 ? "½" : "";
  const n = `${whole || ""}${half}`;
  return `${n} hour${x > 1 ? "s" : ""}`;
}

// "½ hour after high tide", "2 hours before low tide", "Low tide".
export function tideLabel(p, data) {
  const t = hoursAfterHigh(p, data);
  const low = TIDE_HOURS / 2;
  const [ref, h, after] = t <= low / 2 ? ["high", t, true]
    : t < low ? ["low", low - t, false]
      : t <= low * 1.5 ? ["low", t - low, true]
        : ["high", TIDE_HOURS - t, false];
  const span = spanText(h);
  return span ? `${span} ${after ? "after" : "before"} ${ref} tide` : `${ref === "high" ? "High" : "Low"} tide`;
}

// Patterns in slider order, starting at the one nearest high tide.
export function tideOrder(data) {
  const start = Math.round(data.hwPattern) % 12;
  return Array.from({ length: 12 }, (_, k) => (start + k) % 12);
}

// ---------- speeds ----------

export const isDry = (data, i, p) => ((data.points[i][3] >> p) & 1) === 1;

export function compass(u, v) {
  const deg = ((Math.atan2(u, v) * 180) / Math.PI + 360) % 360;
  return DIRS[Math.round(deg / 45) % 8];
}

// { knots, toward } at point i and pattern p, or null when that spot is dry.
export function flowAt(data, i, p) {
  if (isDry(data, i, p)) return null;
  const u = data.u[i][p] / 100;
  const v = data.v[i][p] / 100;
  return { u, v, knots: Math.hypot(u, v), toward: compass(u, v) };
}

export function peakAt(data, i) {
  let best = 0;
  for (let p = 0; p < 12; p++) {
    const f = flowAt(data, i, p);
    if (f && f.knots > best) best = f.knots;
  }
  return best;
}

// Dry at low tide but covered at high tide.
export function driesAt(data, i) {
  const hw = Math.round(data.hwPattern) % 12;
  return isDry(data, i, data.lwPattern) && !isDry(data, i, hw);
}

function kmBetween(lat1, lon1, lat2, lon2) {
  const k = Math.cos((lat1 * Math.PI) / 180);
  return Math.hypot((lon2 - lon1) * 111.32 * k, (lat2 - lat1) * 110.57);
}

export function nearestPoint(data, lat, lon, maxKm = 0.45) {
  let best = -1;
  let bestD = maxKm;
  data.points.forEach(([plon, plat], i) => {
    const d = kmBetween(lat, lon, plat, plon);
    if (d <= bestD) { bestD = d; best = i; }
  });
  return best;
}

export function pointsNear(data, lat, lon, km) {
  const out = [];
  data.points.forEach(([plon, plat], i) => { if (kmBetween(lat, lon, plat, plon) <= km) out.push(i); });
  return out;
}

// The quietest pattern on the high-tide half of the cycle, and on the low-tide half.
export function slackPatterns(data, idx) {
  const mean = Array.from({ length: 12 }, (_, p) => {
    const f = idx.map((i) => flowAt(data, i, p)).filter(Boolean);
    return f.length ? f.reduce((s, x) => s + x.knots, 0) / f.length : Infinity;
  });
  const nearHigh = (p) => { const t = hoursAfterHigh(p, data); return t <= TIDE_HOURS / 4 || t >= (TIDE_HOURS * 3) / 4; };
  const pick = (keep) => [...mean.keys()].filter(keep).reduce((a, b) => (mean[b] < mean[a] ? b : a));
  return [pick(nearHigh), pick((p) => !nearHigh(p))];
}

// Typical and fastest peak current near a place, and when it slackens.
export function areaStats(data, lat, lon, km = 1.2) {
  const idx = pointsNear(data, lat, lon, km).filter((i) => peakAt(data, i) > 0);
  if (!idx.length) return null;
  const peaks = idx.map((i) => peakAt(data, i)).sort((a, b) => a - b);
  const mid = peaks.length >> 1;
  const typical = peaks.length % 2 ? peaks[mid] : (peaks[mid - 1] + peaks[mid]) / 2;
  return { typical, fastest: peaks.at(-1), slack: slackPatterns(data, idx), n: idx.length };
}

export const knotsText = (k) => (k < 0.1 ? "under 0.1" : k.toFixed(1));

export function slackText(data, [a, b]) {
  return `${tideLabel(a, data)} and ${tideLabel(b, data).replace(/^./, (c) => c.toLowerCase())}`;
}

// Lines for the popup when someone taps the water. mode: "off" | "peak" | "hour".
export function describeSpot(data, lat, lon, { mode = "peak", pattern = 0 } = {}) {
  const i = nearestPoint(data, lat, lon);
  if (i < 0) return [];
  const lines = [];
  if (mode === "hour") {
    const f = flowAt(data, i, pattern);
    lines.push(f
      ? `${tideLabel(pattern, data)} at Eastport: ${knotsText(f.knots)} knots, flowing ${f.toward}.`
      : `${tideLabel(pattern, data)} at Eastport: dry here.`);
  }
  const peak = peakAt(data, i);
  if (peak >= 0.1) lines.push(`Strongest current here on an average tide: about ${peak.toFixed(1)} knots.`);
  else if (peak > 0) lines.push("Almost no current here.");
  const near = areaStats(data, lat, lon, 0.8);
  if (near && near.fastest >= 0.8) lines.push(`Slackest about ${slackText(data, near.slack)}.`);
  if (driesAt(data, i)) lines.push("This spot dries at low tide.");
  return lines;
}

// ---------- the live layers ----------

// Draws the strongest-current shading, the tidal flats and the hour-by-hour arrows.
export function createCurrents(map, L, { data, peakUrl, flatsUrl }) {
  const panes = [["ltmCurFill", 362], ["ltmFlats", 364], ["ltmCurArrows", 370]];
  for (const [name, z] of panes) {
    const pane = map.getPane(name) || map.createPane(name);
    pane.style.zIndex = z;
    pane.style.pointerEvents = "none";
  }
  const peak = L.imageOverlay(peakUrl, data.bounds, { pane: "ltmCurFill", opacity: 0.78, interactive: false });
  const flats = L.imageOverlay(flatsUrl, data.bounds, { pane: "ltmFlats", opacity: 0.85, interactive: false });
  const canvas = L.DomUtil.create("canvas", "ltm-cur-canvas", map.getPane("ltmCurArrows"));
  const order = tideOrder(data);
  let mode = "off";
  let pattern = order[0];
  let showFlats = false;

  function draw() {
    const size = map.getSize();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(size.x * dpr);
    canvas.height = Math.round(size.y * dpr);
    canvas.style.width = `${size.x}px`;
    canvas.style.height = `${size.y}px`;
    L.DomUtil.setPosition(canvas, map.containerPointToLayerPoint([0, 0]));
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.x, size.y);
    if (mode !== "hour") return;
    const zoom = map.getZoom();
    const maxLevel = zoom < 11 ? 0 : zoom < 12.5 ? 1 : 2;
    const view = map.getBounds().pad(0.03);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    data.points.forEach(([lon, lat, level], i) => {
      if (level > maxLevel || !view.contains([lat, lon])) return;
      const f = flowAt(data, i, pattern);
      if (!f) return;
      const at = map.latLngToContainerPoint([lat, lon]);
      const color = CURRENT_BANDS[bandOf(f.knots)].arrow;
      if (f.knots < 0.08) {
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(at.x, at.y, 1.6, 0, Math.PI * 2); ctx.fill();
        return;
      }
      const len = Math.min(36, 7 + 9 * f.knots);
      const dx = (f.u / f.knots) * len;
      const dy = (-f.v / f.knots) * len;   // north is up; Web Mercator keeps angles
      const x1 = at.x + dx / 2;
      const y1 = at.y + dy / 2;
      const head = Math.min(7, 3 + len * 0.22);
      const ang = Math.atan2(dy, dx);
      const path = () => {
        ctx.beginPath();
        ctx.moveTo(at.x - dx / 2, at.y - dy / 2);
        ctx.lineTo(x1, y1);
        ctx.moveTo(x1 - head * Math.cos(ang - 0.5), y1 - head * Math.sin(ang - 0.5));
        ctx.lineTo(x1, y1);
        ctx.lineTo(x1 - head * Math.cos(ang + 0.5), y1 - head * Math.sin(ang + 0.5));
      };
      path(); ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.lineWidth = 4; ctx.stroke();
      path(); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
    });
  }

  const hide = () => { canvas.style.visibility = "hidden"; };
  const show = () => { canvas.style.visibility = ""; draw(); };
  map.on("zoomstart", hide);
  map.on("moveend zoomend resize viewreset", show);

  return {
    data,
    order,
    get mode() { return mode; },
    get pattern() { return pattern; },
    get flats() { return showFlats; },
    setMode(next) {
      mode = next;
      if (mode === "peak") peak.addTo(map); else peak.remove();
      draw();
    },
    setPattern(p) { pattern = p; draw(); },
    setFlats(on) {
      showFlats = on;
      if (on) flats.addTo(map); else flats.remove();
    },
    describe(lat, lon) { return describeSpot(data, lat, lon, { mode, pattern }); },
    destroy() {
      map.off("zoomstart", hide);
      map.off("moveend zoomend resize viewreset", show);
      peak.remove();
      flats.remove();
      canvas.remove();
    },
  };
}
