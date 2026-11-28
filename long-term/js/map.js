// The live Cobscook Bay map: Leaflet, the ring and house filters, full screen, resizing and the list.
// Browser only; app.js loads it after the password is entered. Everything it adds to window or
// document is removed again by destroy().

import { HOUSES, HOUSES_CHECKED, HOUSES_CHANGES } from "../data/houses.js";
import {
  MAP_VIEW, DENNYSVILLE, RING_COLORS, DEFAULT_RINGS, TOWNS, WATER_NAMES, SPOTS, BASE_MAPS, PHOTO_TILES,
} from "../data/places.js";
import * as POWER from "../data/power.js";
import {
  esc, makeShoreDistance, milesBetween, ringOf, ringStyles, filterHouses, sortHouses, milesText, niceDate,
  changesText,
} from "./geo.js";
import { popupHtml, cardHtml } from "./popup.js";
import { createCurrents, tideLabel, CURRENT_BANDS, FLATS_COLOR } from "./currents.js";
import { createDepth } from "./depth.js";
import { CURRENTS, DEPTH } from "../data/plan.js";

const HEIGHT_KEY = "prep-lt-map-height";
const ICONS = {
  "offgrid-solar": '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/></g></svg>',
  backup: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 2 5 13.5h5.2L9 22l9-12.2h-5.4z"/></svg>',
  none: "",
};

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function createMap(root, { L, geo }) {
  const $ = (sel) => root.querySelector(sel);
  const stage = $("[data-stage]");
  const wrap = $("[data-mapwrap]");
  const listEl = $("[data-list]");
  const countEl = $("[data-count]");
  const legendEl = $("[data-legend]");
  const today = localToday();
  const changesEl = $("[data-changes]");
  const changes = changesText(HOUSES_CHANGES);
  if (changesEl && changes) { changesEl.textContent = changes; changesEl.hidden = false; }
  const cleanups = [];
  const on = (target, type, fn, opts) => { target.addEventListener(type, fn, opts); cleanups.push(() => target.removeEventListener(type, fn, opts)); };

  // ---------- distances for every house, once ----------
  const shoreMiles = makeShoreDistance(geo.bay);
  const info = new Map(HOUSES.map((h) => {
    const shore = shoreMiles(h.lat, h.lon);
    return [h.id, { shore, ring: ringOf(shore), dennysville: milesBetween(h, DENNYSVILLE) }];
  }));

  const state = {
    picked: new Set(DEFAULT_RINGS),
    power: "all",
    statuses: new Set(["active", "offer", "expired"]),
    maxPrice: 0,
    insideRings: false,
    hideApprox: false,
    sort: "shore",
  };

  // ---------- map ----------
  let savedHeight = null;
  try { savedHeight = Number(localStorage.getItem(HEIGHT_KEY)) || null; } catch { /* storage blocked */ }
  if (savedHeight) wrap.style.height = `${Math.max(260, Math.min(savedHeight, window.innerHeight * 0.92))}px`;

  // The whole 10-mile area: the outside of the 10-mile ring.
  const wholeArea = L.geoJSON({ type: "FeatureCollection", features: geo.rings.map((r) => ({ type: "Feature", geometry: r.geometry })) }).getBounds();

  const map = L.map($("[data-map]"), {
    center: MAP_VIEW.center,
    zoom: MAP_VIEW.zoom,
    minZoom: MAP_VIEW.minZoom,
    maxZoom: MAP_VIEW.maxZoom,
    maxBounds: wholeArea.pad(0.08),
    maxBoundsViscosity: 1,
    zoomSnap: 0.5,
    worldCopyJump: false,
  });
  $("[data-loading]")?.remove();

  const bases = {};
  for (const b of BASE_MAPS) {
    bases[b.name] = L.tileLayer(b.url, { attribution: b.credit, maxZoom: b.maxZoom, subdomains: b.subdomains || "abc", detectRetina: false });
  }
  bases.Map.addTo(map);

  // Open on the whole 10-mile area, whatever the screen size, and don't let it zoom out past that.
  // The limit is worked out again whenever the map changes size (full screen, the resize handle).
  const showWholeArea = () => map.fitBounds(wholeArea, { padding: [8, 8] });
  const limitZoomOut = () => map.setMinZoom(map.getBoundsZoom(wholeArea, false, L.point(16, 16)));
  limitZoomOut();
  showWholeArea();
  map.on("resize", limitZoomOut);

  map.createPane("ltmRings").style.zIndex = 350;
  map.createPane("ltmBay").style.zIndex = 360;
  map.createPane("ltmLabels").style.zIndex = 450;
  map.getPane("ltmLabels").style.pointerEvents = "none";

  // Rings, drawn once and recolored when the picks change.
  const ringLayers = geo.rings.map((r) => L.geoJSON(r.geometry, { pane: "ltmRings", interactive: false }));

  function drawRings() {
    const { ringColors, legend } = ringStyles([...state.picked], RING_COLORS);
    ringLayers.forEach((layer, i) => {
      const c = ringColors[i];
      if (!c) { if (map.hasLayer(layer)) map.removeLayer(layer); return; }
      // Lighter while the currents or depths are shown, so their colors don't blend with the rings'.
      const quiet = (currents && currents.mode !== "off") || depth?.on;
      layer.setStyle({ color: c, weight: 0.6, opacity: quiet ? 0.45 : 0.7, fillColor: c, fillOpacity: quiet ? 0.12 : 0.32 });
      if (!map.hasLayer(layer)) layer.addTo(map);
    });
    ringKey = legend.length
      ? legend.map((l) => `<li><span class="ltm-key-swatch" style="background:${esc(l.color)}"></span>${l.from}–${l.to} mi</li>`).join("")
      : '<li class="muted">No distance rings picked</li>';
    renderLegend();
    root.querySelectorAll("[data-ring]").forEach((b) => b.setAttribute("aria-pressed", String(state.picked.has(Number(b.dataset.ring)))));
  }

  let ringKey = "";
  function renderLegend() {
    const mode = currents?.mode || "off";
    const bands = mode === "off" ? "" : `
      <li class="ltm-key-cur"><span class="ltm-key-title">${mode === "peak" ? "Strongest current" : "Current now (arrows)"}, knots:</span>
        ${CURRENT_BANDS.map((b) => `<span class="ltm-key-band"><span class="ltm-key-swatch" style="background:${esc(mode === "peak" ? b.color : b.arrow)}"></span>${esc(b.label)}</span>`).join("")}
      </li>`;
    const flats = currents?.flats ? `<li><span class="ltm-key-swatch" style="background:${FLATS_COLOR}"></span>Dries at low tide</li>` : "";
    const depthKey = depth?.on ? `
      <li class="ltm-key-cur ltm-key-depth"><span class="ltm-key-title">${esc(DEPTH.keyTitle)}</span>
        ${depth.data.bands.map((b) => `<span class="ltm-key-band"><span class="ltm-key-swatch" style="background:${esc(b.color)}"></span>${esc(b.label)}</span>`).join("")}
      </li>` : "";
    legendEl.innerHTML = `
      <ul class="ltm-key" aria-label="Map key">
        ${ringKey}
        <li><span class="ltm-key-pin ltm-pin-offgrid-solar">${ICONS["offgrid-solar"]}</span>Off-grid solar</li>
        <li><span class="ltm-key-pin ltm-pin-backup">${ICONS.backup}</span>Backup power</li>
        <li><span class="ltm-key-pin ltm-pin-none"></span>No backup listed</li>
        <li><span class="ltm-key-pin ltm-pin-none is-approx"></span>Approximate pin</li>
        ${bands}${flats}${depthKey}
      </ul>`;
  }

  // The bay itself, and the line where it ends.
  L.geoJSON(geo.bay, { pane: "ltmBay", interactive: false, style: { color: "#164659", weight: 1.2, fillColor: "#2f7fb5", fillOpacity: 0.18 } }).addTo(map);
  L.polyline(geo.mouth.map(([lon, lat]) => [lat, lon]), { pane: "ltmBay", color: "#164659", weight: 2, dashArray: "4 5", interactive: false }).addTo(map);

  // Labels.
  const fmt = (n) => n.toLocaleString("en-US");
  const towns = L.layerGroup(TOWNS.map((t) => L.marker([t.lat, t.lon], {
    pane: "ltmLabels", interactive: false, keyboard: false,
    icon: L.divIcon({
      className: `ltm-label-town ltm-label-${t.kind}`, iconSize: null,
      html: `<div class="ltm-tl"><span class="ltm-town-name">${esc(t.name)}</span>${t.kind === "town" ? `<span class="ltm-town-pop">${t.pop ? `${fmt(t.pop)} people` : "724 in 6 townships"}</span>` : ""}</div>`,
    }),
  })));
  const water = L.layerGroup(WATER_NAMES.map((w) => L.marker([w.lat, w.lon], {
    pane: "ltmLabels", interactive: false, keyboard: false,
    icon: L.divIcon({ className: `ltm-label-water ltm-water-t${w.tier}${w.outside ? " is-outside" : ""}`, iconSize: null, html: `<div class="ltm-tl">${esc(w.name)}</div>` }),
  })));
  const spots = L.layerGroup(SPOTS.map((s) => L.marker([s.lat, s.lon], {
    title: s.name,
    icon: L.divIcon({ className: `ltm-spot ltm-spot-${s.kind}`, iconSize: [26, 26], iconAnchor: [13, 13], html: `<span aria-hidden="true">${s.kind === "danger" ? "!" : s.kind === "park" ? "▲" : "★"}</span>` }),
  }).bindPopup(`<strong>${esc(s.name)}</strong><br>${esc(s.note)}`, { className: "ltm-popup" })));
  towns.addTo(map); water.addTo(map); spots.addTo(map);
  const overlays = { "Towns": towns, "Parts of the bay": water, "Spots": spots };

  // Bay names get crowded when zoomed out: show the small ones only when zoomed in.
  const zoomClasses = () => {
    const z = map.getZoom();
    for (const level of [11, 12, 13]) wrap.classList.toggle(`ltm-z${level}`, z >= level);
  };
  map.on("zoomend", zoomClasses);
  zoomClasses();

  // ---------- houses ----------
  const pins = L.layerGroup().addTo(map);
  const markers = new Map();
  const ctx = { tileUrl: PHOTO_TILES, today, power: POWER };
  for (const h of HOUSES) {
    const size = h.power === "offgrid-solar" ? 32 : h.power === "backup" ? 24 : 16;
    const cls = ["ltm-pin", `ltm-pin-${h.power}`, `ltm-pin-${h.status}`, h.approx ? "is-approx" : ""].join(" ");
    const m = L.marker([h.lat, h.lon], {
      title: `${h.address}, ${h.town}`,
      alt: `${h.address}, ${h.town}`,
      riseOnHover: true,
      zIndexOffset: h.power === "offgrid-solar" ? 1000 : h.power === "backup" ? 500 : 0,
      icon: L.divIcon({ className: cls, iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -size / 2], html: ICONS[h.power] }),
    });
    m.bindPopup(() => popupHtml(h, info.get(h.id), ctx), { className: "ltm-popup", maxWidth: 300, minWidth: 260, autoPanPadding: [12, 12] });
    markers.set(h.id, m);
  }

  // Tap anywhere else: how far is this spot?
  map.on("click", (e) => {
    const { lat, lng } = e.latlng;
    const shore = shoreMiles(lat, lng);
    const ring = ringOf(shore);
    const where = shore === 0 ? "This spot is on the water of Cobscook Bay." : `This spot is ${milesText(shore)} from the bay${ring <= 10 ? ` (the ${ring - 1}–${ring} mi ring)` : ", past the 10-mile ring"}.`;
    const tide = currents ? currents.describe(lat, lng) : [];
    const html = (depthText) => `<p class="ltm-measure">${esc(where)}<br>${esc(milesText(milesBetween({ lat, lon: lng }, DENNYSVILLE)))} from Dennysville in a straight line.</p>${depthText}${tide.length ? `<p class="ltm-measure ltm-measure-cur">${tide.map(esc).join("<br>")}</p>` : ""}`;
    const depthP = (lines) => (lines.length ? `<p class="ltm-measure ltm-measure-depth">${lines.map(esc).join("<br>")}</p>` : "");
    const popup = L.popup({ className: "ltm-popup" })
      .setLatLng(e.latlng)
      .setContent(html(depth?.on ? depthP([DEPTH.loading]) : ""))
      .openOn(map);
    // The depth comes from a small tile, so it fills in a moment later.
    if (depth?.on) {
      depth.describe(lat, lng).then((lines) => { if (map.hasLayer(popup)) popup.setContent(html(depthP(lines))); });
    }
  });

  function applyFilters() {
    const shown = filterHouses(HOUSES, { ...state, picked: [...state.picked] }, info);
    const ids = new Set(shown.map((h) => h.id));
    for (const [id, m] of markers) {
      if (ids.has(id)) { if (!pins.hasLayer(m)) pins.addLayer(m); }
      else if (pins.hasLayer(m)) pins.removeLayer(m);
    }
    countEl.textContent = shown.length === HOUSES.length
      ? `Showing all ${HOUSES.length} houses (checked ${niceDate(HOUSES_CHECKED)}).`
      : `Showing ${shown.length} of ${HOUSES.length} houses.`;
    const sorted = sortHouses(shown, state.sort, info);
    listEl.innerHTML = sorted.length
      ? sorted.map((h) => cardHtml(h, info.get(h.id), today)).join("")
      : '<li class="ltm-empty muted">No houses match these filters.</li>';
  }

  function showHouse(id) {
    const h = HOUSES.find((x) => x.id === id);
    const m = markers.get(id);
    if (!h || !m) return;
    if (!pins.hasLayer(m)) pins.addLayer(m);
    if (!stage.classList.contains("is-full")) stage.scrollIntoView({ behavior: "smooth", block: "start" });
    map.setView([h.lat, h.lon], Math.max(map.getZoom(), 14));
    setTimeout(() => m.openPopup(), 250);
  }

  // ---------- controls ----------
  on(root, "click", (e) => {
    const chip = e.target.closest("[data-ring]");
    if (chip) {
      const m = Number(chip.dataset.ring);
      state.picked.has(m) ? state.picked.delete(m) : state.picked.add(m);
      drawRings(); applyFilters();
      return;
    }
    const quick = e.target.closest("[data-rings]");
    if (quick) {
      const v = quick.dataset.rings;
      state.picked = new Set(v === "all" ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] : v === "none" ? [] : [Number(v)]);
      drawRings(); applyFilters();
      return;
    }
    const show = e.target.closest("[data-show]");
    if (show) { showHouse(show.dataset.show); return; }
    const step = e.target.closest("[data-tide-step]");
    if (step) { stopPlay(); setTideStep((tideStep + Number(step.dataset.tideStep) + 12) % 12); return; }
    if (e.target.closest("[data-tide-play]")) togglePlay();
  });

  // ---------- tidal currents and flats ----------
  // The data (about 250 KB) and pictures load the first time either control is used.
  let currents = null;
  let currentsLoading = null;
  let destroyed = false;
  let tideStep = 0;
  let playTimer = null;
  const curStatus = $("[data-cur-status]");
  const tideBox = $("[data-tide]");
  const tideRange = $("[data-tide-hour]");
  const tideOut = $("[data-tide-out]");
  const playBtn = $("[data-tide-play]");

  function loadCurrents() {
    if (currents) return Promise.resolve(currents);
    if (!currentsLoading) {
      if (curStatus) curStatus.textContent = CURRENTS.loading;
      currentsLoading = fetch(new URL("../data/currents.json", import.meta.url))
        .then((r) => { if (!r.ok) throw new Error(`currents.json: ${r.status}`); return r.json(); })
        .then((data) => {
          if (destroyed) return null;
          currents = createCurrents(map, L, {
            data,
            peakUrl: new URL("../data/currents-peak.png", import.meta.url).href,
            flatsUrl: new URL("../data/currents-flats.png", import.meta.url).href,
          });
          if (curStatus) curStatus.textContent = CURRENTS.hint;
          return currents;
        })
        .catch((err) => {
          console.error("Currents failed to load:", err);
          currentsLoading = null;
          if (curStatus) curStatus.textContent = CURRENTS.failed;
          return null;
        });
    }
    return currentsLoading;
  }

  async function setCurrentsMode(mode) {
    if (mode !== "hour") stopPlay();
    if (tideBox) tideBox.hidden = mode !== "hour";
    if (mode === "off" && !currents) return;
    const c = await loadCurrents();
    if (!c) return;
    c.setMode(mode);
    if (mode === "hour") setTideStep(tideStep);
    drawRings();
  }

  function setTideStep(k) {
    tideStep = k;
    if (tideRange) tideRange.value = String(k);
    if (!currents) return;
    const p = currents.order[k];
    currents.setPattern(p);
    if (tideOut) tideOut.textContent = `${tideLabel(p, currents.data)} at Eastport`;
  }

  function stopPlay() {
    if (playTimer) clearInterval(playTimer);
    playTimer = null;
    if (playBtn) { playBtn.textContent = "Play"; playBtn.setAttribute("aria-pressed", "false"); }
  }
  function togglePlay() {
    if (playTimer) { stopPlay(); return; }
    playTimer = setInterval(() => setTideStep((tideStep + 1) % 12), 1100);
    if (playBtn) { playBtn.textContent = "Pause"; playBtn.setAttribute("aria-pressed", "true"); }
  }

  // ---------- water depth ----------
  // depth.json (the list of tiles, about 20 KB) loads the first time the box is ticked.
  let depth = null;
  let depthLoading = null;
  const depthStatus = $("[data-depth-status]");

  function loadDepth() {
    if (depth) return Promise.resolve(depth);
    if (!depthLoading) {
      if (depthStatus) depthStatus.textContent = DEPTH.loading;
      depthLoading = fetch(new URL("../data/depth.json", import.meta.url))
        .then((r) => { if (!r.ok) throw new Error(`depth.json: ${r.status}`); return r.json(); })
        .then((data) => {
          if (destroyed) return null;
          depth = createDepth(map, L, { data, base: new URL("../data/depth", import.meta.url).href });
          if (depthStatus) depthStatus.textContent = DEPTH.hint;
          return depth;
        })
        .catch((err) => {
          console.error("Depths failed to load:", err);
          depthLoading = null;
          if (depthStatus) depthStatus.textContent = DEPTH.failed;
          return null;
        });
    }
    return depthLoading;
  }

  async function setDepth(on) {
    if (!on && !depth) return;
    const d = await loadDepth();
    if (!d) return;
    d.setOn(on);
    drawRings();
  }

  async function setFlats(on) {
    if (!on && !currents) return;
    const c = await loadCurrents();
    if (!c) return;
    c.setFlats(on);
    renderLegend();
  }

  on(root, "change", (e) => {
    const t = e.target;
    if (t.name === "ltm-power") state.power = t.value;
    else if (t.dataset.status) t.checked ? state.statuses.add(t.dataset.status) : state.statuses.delete(t.dataset.status);
    else if (t.matches("[data-price]")) state.maxPrice = Number(t.value);
    else if (t.matches("[data-inside]")) state.insideRings = t.checked;
    else if (t.matches("[data-hide-approx]")) state.hideApprox = t.checked;
    else if (t.matches("[data-sort]")) state.sort = t.value;
    else if (t.name === "ltm-cur") { setCurrentsMode(t.value); return; }
    else if (t.matches("[data-tide-hour]")) { setTideStep(Number(t.value)); return; }
    else if (t.matches("[data-flats]")) { setFlats(t.checked); return; }
    else if (t.matches("[data-depth]")) { setDepth(t.checked); return; }
    else if (t.dataset.layer) {
      const layer = { towns, water, spots }[t.dataset.layer];
      t.checked ? layer.addTo(map) : map.removeLayer(layer);
      return;
    } else return;
    applyFilters();
  });

  on(root, "input", (e) => {
    if (e.target.matches("[data-tide-hour]")) { stopPlay(); setTideStep(Number(e.target.value)); }
  });

  // Keep the label checkboxes in step with the map's own layer menu.
  const syncLayerBoxes = () => {
    for (const [key, layer] of Object.entries({ towns, water, spots })) {
      const box = root.querySelector(`[data-layer="${key}"]`);
      if (box) box.checked = map.hasLayer(layer);
    }
  };
  map.on("overlayadd overlayremove", syncLayerBoxes);

  L.control.layers(bases, overlays, { collapsed: true, position: "topright" }).addTo(map);
  L.control.scale({ imperial: true, metric: false, position: "bottomleft" }).addTo(map);

  // Full screen and reset buttons.
  const Buttons = L.Control.extend({
    options: { position: "topleft" },
    onAdd() {
      const box = L.DomUtil.create("div", "leaflet-bar ltm-mapbtns");
      box.innerHTML = `
        <a href="#" role="button" class="ltm-btn-full" title="Full screen" aria-label="Full screen" aria-pressed="false"><span aria-hidden="true">⤢</span></a>
        <a href="#" role="button" class="ltm-btn-reset" title="Show the whole 10-mile area" aria-label="Show the whole 10-mile area"><span aria-hidden="true">⌂</span></a>`;
      L.DomEvent.disableClickPropagation(box);
      L.DomEvent.on(box.querySelector(".ltm-btn-full"), "click", (e) => { L.DomEvent.preventDefault(e); toggleFull(); });
      L.DomEvent.on(box.querySelector(".ltm-btn-reset"), "click", (e) => { L.DomEvent.preventDefault(e); showWholeArea(); });
      return box;
    },
  });
  map.addControl(new Buttons());

  // ---------- full screen ----------
  // The map and its filters fill the screen. Uses the browser's full screen where it exists (not on
  // iPhone), and a fixed overlay either way.
  let full = false;
  let oldOverflow = "";
  function setFull(next) {
    if (next === full) return;
    full = next;
    stage.classList.toggle("is-full", full);
    const btn = root.querySelector(".ltm-btn-full");
    if (btn) { btn.setAttribute("aria-pressed", String(full)); btn.title = full ? "Leave full screen" : "Full screen"; btn.setAttribute("aria-label", btn.title); }
    if (full) {
      oldOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      stage.requestFullscreen?.().catch(() => { /* fixed overlay still works */ });
    } else {
      document.body.style.overflow = oldOverflow;
      if (document.fullscreenElement === stage) document.exitFullscreen?.().catch(() => {});
    }
    setTimeout(() => map.invalidateSize(), 60);
  }
  function toggleFull() { setFull(!full); }
  on(document, "fullscreenchange", () => { if (!document.fullscreenElement && full) setFull(false); });
  on(document, "keydown", (e) => { if (e.key === "Escape" && full) setFull(false); });

  // ---------- resizing ----------
  const handle = $("[data-resize]");
  let drag = null;
  const setHeight = (px) => {
    const h = Math.round(Math.max(260, Math.min(px, window.innerHeight * 0.92)));
    wrap.style.height = `${h}px`;
    try { localStorage.setItem(HEIGHT_KEY, String(h)); } catch { /* storage blocked */ }
  };
  on(handle, "pointerdown", (e) => {
    drag = { y: e.clientY, h: wrap.getBoundingClientRect().height };
    handle.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  on(handle, "pointermove", (e) => { if (drag) setHeight(drag.h + e.clientY - drag.y); });
  const endDrag = () => { drag = null; };
  on(handle, "pointerup", endDrag);
  on(handle, "pointercancel", endDrag);
  on(handle, "keydown", (e) => {
    const step = e.shiftKey ? 120 : 40;
    if (e.key === "ArrowUp") { setHeight(wrap.getBoundingClientRect().height - step); e.preventDefault(); }
    if (e.key === "ArrowDown") { setHeight(wrap.getBoundingClientRect().height + step); e.preventDefault(); }
  });
  const ro = new ResizeObserver(() => map.invalidateSize());
  ro.observe(wrap);

  drawRings();
  applyFilters();

  return {
    map,
    destroy() {
      destroyed = true;
      stopPlay();
      if (currents) currents.destroy();
      currents = null;
      if (depth) depth.destroy();
      depth = null;
      setFull(false);
      ro.disconnect();
      for (const off of cleanups) off();
      map.off();
      map.remove();
    },
  };
}
