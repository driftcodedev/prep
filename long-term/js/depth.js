// Water depth at low tide on the Cobscook Bay map, from NOAA's BlueTopo (built by tools/build_depth.py
// into data/depth.json and the tiles in data/depth/). The colored tiles get sharper as you zoom in,
// and each depth band can be turned off with its toggle; tapping the water reads the depth from a
// one-byte "value" tile.
//
// The pure helpers (decodeDepth, tileAt, depthLines, bandFor) run in Node for the tests; createDepth()
// needs the browser and Leaflet.

const FT_PER_M = 3.28084;

// One byte per spot. Keep in step with encode() in tools/build_depth.py:
// 0 no data; 1–40 dries, 0.5 to 20 ft above MLLW; 41–160 depth 0 to 59.5 ft by 0.5 ft;
// 161–230 depth 60 to 198 ft by 2 ft; 231–255 depth 200 to 440 ft by 10 ft.
// Returns feet below mean lower low water (negative where it dries), or null.
export function decodeDepth(code) {
  if (!code) return null;
  if (code <= 40) return -code * 0.5;
  if (code <= 160) return (code - 41) * 0.5;
  if (code <= 230) return 60 + (code - 161) * 2;
  return 200 + (code - 231) * 10;
}

// The web mercator tile and the pixel inside it for a spot, at zoom z.
export function tileAt(lat, lon, z) {
  const n = 2 ** z;
  const x = ((lon + 180) / 360) * n;
  const r = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n;
  const tx = Math.floor(x);
  const ty = Math.floor(y);
  return { x: tx, y: ty, px: Math.min(255, Math.floor((x - tx) * 256)), py: Math.min(255, Math.floor((y - ty) * 256)) };
}

export const bandFor = (bands, ft) => bands.find((b) => ft < b.maxFt) || bands[bands.length - 1];

const ftText = (ft) => {
  const a = Math.abs(ft);
  const v = a < 10 ? Math.round(a * 2) / 2 : Math.round(a);
  return `${v} ft`;
};

// The lines for the popup when someone taps the water. ft: feet below MLLW (negative = dries).
export function depthLines(ft, datum) {
  if (ft === null || ft === undefined || !Number.isFinite(ft)) return [];
  const mhw = datum.mhwFt;
  if (ft < 0) {
    const covered = mhw + ft;
    return covered > 0
      ? [`Dries at low tide: about ${ftText(-ft)} above the lowest tides.`, `About ${ftText(covered)} of water here at an average high tide.`]
      : ["Dry at an average high tide."];
  }
  return [`Water depth at low tide: about ${ftText(ft)}.`, `At an average high tide: about ${ftText(ft + mhw)}.`];
}

export const depthTileUrl = (base, z, x, y) => `${base}/${z}/${x}/${y}.png`;
export const bandTileUrl = (base, z, x, y) => `${base}/b/${z}/${x}/${y}.png`;

// The color tile's pixels with the turned-off bands made clear. color: RGBA bytes; band: one band
// number per pixel (noBand where there's no depth); hidden: a Set of band numbers. Returns new bytes.
export function maskPixels(color, band, hidden, noBand = 255) {
  const out = new Uint8ClampedArray(color);
  if (!hidden.size) return out;
  for (let i = 0; i < band.length; i++) {
    const b = band[i];
    if (b !== noBand && hidden.has(b)) out[i * 4 + 3] = 0;
  }
  return out;
}

// The depth toggles: one chip per band, pressed while that band shows.
export function depthChipsHtml(bands, hidden = new Set()) {
  const esc = (v) => String(v).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
  return bands.map((b, i) => `<button type="button" class="ltm-chip ltm-depth-chip" data-depth-band="${i}" aria-pressed="${!hidden.has(i)}" title="${esc(b.label)}" aria-label="${esc(b.label)}" style="--c:${esc(b.color)}"><span class="ltm-swatch" aria-hidden="true"></span>${esc(b.short || b.label)}</button>`).join("");
}

// ---------- browser ----------

const BLANK = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

export function createDepth(map, L, { data, base }) {
  const pane = map.getPane("ltmDepth") || map.createPane("ltmDepth");
  pane.style.zIndex = 361;
  pane.style.pointerEvents = "none";
  const have = {};
  for (const [z, list] of Object.entries(data.tiles)) have[z] = new Set(list);

  // Each tile is drawn on a canvas from its color tile, with the bands someone turned off cut out
  // using the matching band tile. Only tiles listed in depth.json are fetched, so land tiles never
  // 404.
  const hidden = new Set();
  const noBand = data.noBand ?? 255;
  const live = new Set();
  const loadImg = (src) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`depth tile ${src}`));
    img.src = src;
  });
  const paint = (tile) => {
    const d = tile._depth;
    if (!d) return;
    const g = tile.getContext("2d");
    g.putImageData(new ImageData(maskPixels(d.color, d.band, hidden, noBand), 256, 256), 0, 0);
  };
  const DepthLayer = L.GridLayer.extend({
    createTile(c, done) {
      const tile = document.createElement("canvas");
      tile.width = 256; tile.height = 256;
      if (!have[String(c.z)]?.has(`${c.x},${c.y}`)) { setTimeout(() => done(null, tile), 0); return tile; }
      Promise.all([loadImg(depthTileUrl(base, c.z, c.x, c.y)), loadImg(bandTileUrl(base, c.z, c.x, c.y))])
        .then(([colorImg, bandImg]) => {
          const g = tile.getContext("2d", { willReadFrequently: true });
          g.drawImage(bandImg, 0, 0);
          const bandPx = g.getImageData(0, 0, 256, 256).data;
          const band = new Uint8Array(256 * 256);
          for (let i = 0; i < band.length; i++) band[i] = bandPx[i * 4];
          g.clearRect(0, 0, 256, 256);
          g.drawImage(colorImg, 0, 0);
          tile._depth = { color: g.getImageData(0, 0, 256, 256).data.slice(), band };
          live.add(tile);
          if (hidden.size) paint(tile);
          done(null, tile);
        })
        .catch((err) => { console.error(err); done(err, tile); });
      return tile;
    },
  });
  const layer = new DepthLayer({
    pane: "ltmDepth",
    minZoom: 0,
    maxZoom: 22,
    minNativeZoom: data.zmin,
    maxNativeZoom: data.zmax,
    bounds: L.latLngBounds(data.bounds),
    opacity: 0.92,
    keepBuffer: 2,
    className: "ltm-depth-tiles",
  });
  layer.on("tileunload", (e) => { live.delete(e.tile); e.tile._depth = null; });

  // Value tiles, decoded once each.
  const cache = new Map();
  function valueTile(x, y) {
    const key = `${x},${y}`;
    if (!have.v?.has(key)) return Promise.resolve(null);
    if (!cache.has(key)) {
      cache.set(key, new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          try {
            const c = document.createElement("canvas");
            c.width = 256; c.height = 256;
            const g = c.getContext("2d", { willReadFrequently: true });
            g.drawImage(img, 0, 0);
            const px = g.getImageData(0, 0, 256, 256).data;
            const codes = new Uint8Array(256 * 256);
            for (let i = 0; i < codes.length; i++) codes[i] = px[i * 4];
            resolve(codes);
          } catch (err) { console.error("Depth value tile failed:", err); resolve(null); }
        };
        img.onerror = () => { cache.delete(key); resolve(null); };
        img.src = `${base}/v/${x}/${y}.png`;
      }));
    }
    return cache.get(key);
  }

  async function depthAt(lat, lon) {
    const t = tileAt(lat, lon, data.valueZoom);
    const codes = await valueTile(t.x, t.y);
    if (!codes) return null;
    // The spot itself, or the nearest spot with data within 2 pixels (taps right at the shore).
    for (let r = 0; r <= 2; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const px = t.px + dx; const py = t.py + dy;
          if (px < 0 || py < 0 || px > 255 || py > 255) continue;
          const ft = decodeDepth(codes[py * 256 + px]);
          if (ft !== null) return ft;
        }
      }
    }
    return null;
  }

  let on = false;
  return {
    data,
    get on() { return on; },
    get hidden() { return new Set(hidden); },
    // Which bands to hide (a Set of band numbers); redraws the tiles already on the map.
    setHidden(next) {
      hidden.clear();
      for (const b of next) hidden.add(b);
      for (const tile of live) paint(tile);
    },
    setOn(next) {
      on = next;
      if (on) layer.addTo(map); else layer.remove();
    },
    async describe(lat, lon) {
      if (!on) return [];
      return depthLines(await depthAt(lat, lon), data.datum);
    },
    depthAt,
    destroy() { layer.remove(); cache.clear(); live.clear(); },
  };
}
