// Long Term plan: entry point.
//
// The page frame (shell/tabs.js) imports this file only after the password is entered. It then
// calls mount(root, context) to draw the plan inside #lt-root, and unmount(root) when the tab
// locks (switching tabs, the Lock button, or reloading). Each unlock calls mount() again, so
// mount() must draw from scratch. See README.md in this folder.
//
// The page is the Cobscook Bay map. render() draws the controls, list and notes as plain HTML (the
// tests run it in Node); mount() then loads Leaflet and js/map.js to bring the map to life.

import { PAGE } from "./data/plan.js";
import { HOUSES } from "./data/houses.js";
import { RING_COLORS, DEFAULT_RINGS } from "./data/places.js";
import { esc } from "./js/geo.js";

export { esc };

const PRICE_CHOICES = [150000, 250000, 400000, 600000, 1000000];

// Data in, HTML out. Kept apart from mount() so the tests can run it without a browser.
// context.household is the household from the Short Term tab, or null (see README.md); the map
// doesn't use it.
export function render(page = PAGE, context = {}, data = { houses: HOUSES, colors: RING_COLORS, rings: DEFAULT_RINGS }) {
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

let view = null; // the live map while the plan is on screen

export async function mount(root, context = {}) {
  view = null;
  await Promise.all([loadCss("./vendor/leaflet/leaflet.css", "leaflet"), loadCss("./style.css", "style")]);
  root.innerHTML = render(PAGE, context);
  try {
    const [L, { createMap }, geo] = await Promise.all([
      import("./vendor/leaflet/leaflet.esm.min.js"),
      import("./js/map.js"),
      fetch(new URL("./data/geo.json", import.meta.url)).then((r) => {
        if (!r.ok) throw new Error(`geo.json: ${r.status}`);
        return r.json();
      }),
    ]);
    if (!root.isConnected) return;
    view = createMap(root, { L, geo });
  } catch (err) {
    console.error("Cobscook map failed to load:", err);
    const msg = root.querySelector("[data-loading]");
    if (msg) msg.textContent = "The map didn't load. Check your connection and reload the page.";
  }
}

export function unmount(root) {
  // Stops listeners, leaves full screen and removes the map. The frame empties #lt-root after this.
  if (view) view.destroy();
  view = null;
}
