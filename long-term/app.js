// Long Term plan: entry point.
//
// The page frame (shell/tabs.js) imports this file only after the password is entered. It then
// calls mount(root, context) to draw the plan inside #lt-root, and unmount(root) when the tab
// locks (switching tabs, the Lock button, or reloading). Each unlock calls mount() again, so
// mount() must draw from scratch. See README.md in this folder.
//
// The tab has two views, picked with the Map / Fishing switch at the top:
//   Map      the Cobscook Bay map. renderMap() draws the controls, list and notes as plain HTML
//            (the tests run it in Node); the first time the map is shown, mount() loads Leaflet
//            and js/map.js to bring it to life.
//   Fishing  what the bay could feed you, season by season (js/fishing.js).
// The last view picked is remembered in this browser (localStorage "prep-lt-view").

import { PAGE } from "./data/plan.js";
import { HOUSES } from "./data/houses.js";
import { RING_COLORS, DEFAULT_RINGS } from "./data/places.js";
import { esc } from "./js/geo.js";
import { renderFishing } from "./js/fishing.js";

export { esc };

export const VIEWS = [
  ["map", "Map", "Houses for sale and distance rings"],
  ["fish", "Fishing", "What the bay feeds you, by season"],
];
const VIEW_KEY = "prep-lt-view";
const ICONS = {
  map: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 4v14M15 6v14" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  fish: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12c3-4.5 7-6 11-4.5 2 .8 3.5 2.3 4.5 4.5-1 2.2-2.5 3.7-4.5 4.5C10 18 6 16.5 3 12Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M18.5 12 22 8.5v7L18.5 12Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="13.5" cy="11" r="1.1" fill="currentColor"/></svg>',
};

// The Map / Fishing switch, then both views (the Fishing one hidden until picked).
export function render(page = PAGE, context = {}, data = undefined) {
  const tabs = VIEWS.map(([id, label, sub], i) => `
      <button type="button" role="tab" class="lt-view-tab" id="lt-tab-${id}" data-view="${id}" aria-controls="lt-panel-${id}" aria-selected="${i === 0}"${i === 0 ? "" : ' tabindex="-1"'}>
        ${ICONS[id]}<span class="lt-view-text"><span class="lt-view-label">${esc(label)}</span><span class="lt-view-sub">${esc(sub)}</span></span>
      </button>`).join("");
  return `
    <div class="lt-views" role="tablist" aria-label="Long-term plan views">${tabs}</div>
    <div class="lt-panel" id="lt-panel-map" role="tabpanel" aria-labelledby="lt-tab-map" data-panel="map">${renderMap(page, context, data)}</div>
    <div class="lt-panel" id="lt-panel-fish" role="tabpanel" aria-labelledby="lt-tab-fish" data-panel="fish" hidden>${renderFishing()}</div>
  `;
}

const PRICE_CHOICES = [150000, 250000, 400000, 600000, 1000000];

// Data in, HTML out. Kept apart from mount() so the tests can run it without a browser.
// context.household is the household from the Short Term tab, or null (see README.md); the map
// doesn't use it.
export function renderMap(page = PAGE, context = {}, data = { houses: HOUSES, colors: RING_COLORS, rings: DEFAULT_RINGS }) {
  const { houses, colors, rings } = data;
  const counts = {
    all: houses.length,
    backup: houses.filter((h) => h.power !== "none").length,
    solar: houses.filter((h) => h.power === "offgrid-solar").length,
  };
  const chips = colors.map((c, i) => {
    const m = i + 1;
    const on = rings.includes(m);
    return `<button type="button" class="ltm-chip" data-ring="${m}" aria-pressed="${on}" style="--c:${esc(c)}"><span class="ltm-swatch" aria-hidden="true"></span>${m} mi</button>`;
  }).join("");
  const seg = [
    ["all", `All houses`, counts.all],
    ["backup", `Any backup power`, counts.backup],
    ["solar", `Off-grid solar`, counts.solar],
  ].map(([v, label, n], i) => `
      <label class="ltm-seg-item"><input type="radio" name="ltm-power" value="${v}"${i === 0 ? " checked" : ""}><span>${esc(label)} <b>${n}</b></span></label>`).join("");
  const prices = PRICE_CHOICES.map((p) => `<option value="${p}">Up to $${p >= 1e6 ? p / 1e6 + " million" : p / 1000 + "k"}</option>`).join("");
  const notes = (page.notes || []).map((n) => `<li>${esc(n)}</li>`).join("");

  return `
    <section class="ltm" aria-labelledby="ltm-heading">
      <h2 id="ltm-heading" class="section-title">${esc(page.heading)}</h2>
      <p class="muted ltm-intro">${esc(page.intro)}</p>

      <div class="ltm-stage" data-stage>
        <div class="ltm-controls">
          <div class="ltm-group" role="group" aria-labelledby="ltm-rings-label">
            <div class="ltm-group-head">
              <span id="ltm-rings-label" class="ltm-label">${esc(page.ringsLabel)}</span>
              <span class="ltm-quick">
                <button type="button" class="btn-link" data-rings="1">1 mi</button>
                <button type="button" class="btn-link" data-rings="all">All</button>
                <button type="button" class="btn-link" data-rings="none">Clear</button>
              </span>
            </div>
            <div class="ltm-chips">${chips}</div>
            <p class="ltm-hint">${esc(page.ringsHint)}</p>
          </div>

          <div class="ltm-group" role="radiogroup" aria-labelledby="ltm-power-label">
            <span id="ltm-power-label" class="ltm-label">${esc(page.powerLabel)}</span>
            <div class="ltm-seg">${seg}</div>
          </div>

          <details class="ltm-more">
            <summary>More filters and map layers</summary>
            <div class="ltm-more-body">
              <fieldset class="ltm-fieldset">
                <legend>Listing status</legend>
                <label><input type="checkbox" data-status="active" checked> For sale</label>
                <label><input type="checkbox" data-status="offer" checked> Under contract or pending</label>
                <label><input type="checkbox" data-status="expired" checked> Expired, unsold</label>
              </fieldset>
              <label class="field ltm-field">
                <span class="field-label">Price</span>
                <select data-price><option value="0">Any price</option>${prices}</select>
              </label>
              <fieldset class="ltm-fieldset">
                <legend>Pins</legend>
                <label><input type="checkbox" data-inside> Only houses inside the rings I picked</label>
                <label><input type="checkbox" data-hide-approx> Hide approximate pins</label>
              </fieldset>
              <fieldset class="ltm-fieldset">
                <legend>Labels</legend>
                <label><input type="checkbox" data-layer="towns" checked> Towns and populations</label>
                <label><input type="checkbox" data-layer="water" checked> Parts of the bay</label>
                <label><input type="checkbox" data-layer="spots" checked> Falls, park and your plan spots</label>
              </fieldset>
            </div>
          </details>
        </div>

        <div class="ltm-mapwrap" data-mapwrap>
          <div class="ltm-map" data-map role="region" aria-label="Map of Cobscook Bay"></div>
          <p class="ltm-map-loading" data-loading>Loading the map…</p>
        </div>
        <button type="button" class="ltm-resize" data-resize aria-label="Resize the map: drag, or use the up and down arrow keys"><span aria-hidden="true"></span></button>
      </div>

      <div class="ltm-legend" data-legend></div>
      <p class="ltm-count" data-count aria-live="polite"></p>
      <p class="ltm-changes" data-changes hidden></p>

      <div class="ltm-list-head">
        <h3 class="sub-title">${esc(page.listHeading)}</h3>
        <label class="ltm-sort">Sort
          <select data-sort>
            <option value="shore">Closest to the bay</option>
            <option value="power">Off-grid solar first</option>
            <option value="dennysville">Closest to Dennysville</option>
            <option value="priceUp">Price, low to high</option>
            <option value="priceDown">Price, high to low</option>
            <option value="newest">Newest listings</option>
          </select>
        </label>
      </div>
      <ol class="ltm-list" data-list></ol>

      <details class="ltm-notes">
        <summary>${esc(page.notesHeading)}</summary>
        <ul>${notes}</ul>
      </details>
    </section>
  `;
}

// Loads the scoped Leaflet styles and style.css from this folder the first time the plan opens.
function loadCss(href, key) {
  if (document.querySelector(`link[data-long-term="${key}"]`)) return Promise.resolve();
  return new Promise((resolve) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = new URL(href, import.meta.url).href;
    link.dataset.longTerm = key;
    link.onload = link.onerror = () => resolve();
    document.head.appendChild(link);
  });
}

let view = null;     // the live map, once it has been shown
let fishing = null;  // the live Fishing view, once it has been shown
let mapStarted = false;
let cleanup = [];

function readView() {
  try { return localStorage.getItem(VIEW_KEY) === "fish" ? "fish" : "map"; } catch { return "map"; }
}
function saveView(v) {
  try { localStorage.setItem(VIEW_KEY, v); } catch { /* private mode */ }
}

async function startMap(root) {
  mapStarted = true;
  try {
    const [L, { createMap }, geo] = await Promise.all([
      import("./vendor/leaflet/leaflet.esm.min.js"),
      import("./js/map.js"),
      fetch(new URL("./data/geo.json", import.meta.url)).then((r) => {
        if (!r.ok) throw new Error(`geo.json: ${r.status}`);
        return r.json();
      }),
    ]);
    if (!root.isConnected || !mapStarted) return;
    view = createMap(root.querySelector('[data-panel="map"]'), { L, geo });
  } catch (err) {
    console.error("Cobscook map failed to load:", err);
    const msg = root.querySelector("[data-loading]");
    if (msg) msg.textContent = "The map didn't load. Check your connection and reload the page.";
  }
}

async function showView(root, id, { focus = false } = {}) {
  for (const tab of root.querySelectorAll(".lt-view-tab")) {
    const on = tab.dataset.view === id;
    tab.setAttribute("aria-selected", String(on));
    tab.tabIndex = on ? 0 : -1;
    if (on && focus) tab.focus();
  }
  for (const panel of root.querySelectorAll("[data-panel]")) panel.hidden = panel.dataset.panel !== id;
  saveView(id);
  if (id === "map" && !mapStarted) await startMap(root);
  if (id === "fish" && !fishing) {
    const { createFishing } = await import("./js/fishing.js");
    if (root.isConnected) fishing = createFishing(root.querySelector('[data-panel="fish"]'));
  }
}

export async function mount(root, context = {}) {
  view = null; fishing = null; mapStarted = false;
  await Promise.all([loadCss("./vendor/leaflet/leaflet.css", "leaflet"), loadCss("./style.css", "style")]);
  root.innerHTML = render(PAGE, context);

  const tablist = root.querySelector(".lt-views");
  const onClick = (e) => {
    const tab = e.target.closest(".lt-view-tab");
    if (tab) showView(root, tab.dataset.view);
  };
  const onKey = (e) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    const ids = VIEWS.map(([id]) => id);
    const now = ids.indexOf(document.activeElement?.dataset.view);
    if (now < 0) return;
    e.preventDefault();
    const next = e.key === "Home" ? 0 : e.key === "End" ? ids.length - 1 : (now + (e.key === "ArrowRight" ? 1 : -1) + ids.length) % ids.length;
    showView(root, ids[next], { focus: true });
  };
  tablist.addEventListener("click", onClick);
  tablist.addEventListener("keydown", onKey);
  cleanup = [() => tablist.removeEventListener("click", onClick), () => tablist.removeEventListener("keydown", onKey)];

  await showView(root, readView());
}

export function unmount(root) {
  // Stops listeners, leaves full screen and removes the map. The frame empties #lt-root after this.
  for (const fn of cleanup) fn();
  cleanup = [];
  if (view) view.destroy();
  if (fishing) fishing.destroy();
  view = null; fishing = null; mapStarted = false;
}
