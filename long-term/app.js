// Long Term plan: entry point.
//
// The page frame (shell/tabs.js) imports this file only after the password is entered. It then
// calls mount(root, context) to draw the plan inside #lt-root, and unmount(root) when the tab
// locks (switching tabs, the Lock button, or reloading). Each unlock calls mount() again, so
// mount() must draw from scratch. See README.md in this folder.
//
// The tab has four views, picked with the Map / Fishing / Netting / Salting switch at the top:
//   Map      the Cobscook Bay map. renderMap() draws the controls, list and notes as plain HTML
//            (the tests run it in Node); the first time the map is shown, mount() loads Leaflet
//            and js/map.js to bring it to life.
//   Fishing  how much food is in the bay, season by season (js/fishing.js).
//   Netting  the Fishing table cut down to the targets you can catch with a net (js/fishing.js).
//   Salting  a salt calculator (catch → salt → bay water → boiling and fuel) and how-to (js/salting.js).
// The last view picked is remembered in this browser (localStorage "prep-lt-view").
//
// Paper copy: "Print the full report" and "Download PDF" (top and bottom, like the Short Term tab)
// give everything on the tab in one report: js/report.js builds it once, as a list of blocks;
// reportHtml() draws them into the hidden .lt-print box that only shows when printing, and
// js/report-pdf.js turns the same blocks into a PDF with pdfmake (vendor/pdfmake).

import { PAGE, CURRENTS, DEPTH } from "./data/plan.js";
import { HOUSES } from "./data/houses.js";
import { RING_COLORS, DEFAULT_RINGS } from "./data/places.js";
import { esc } from "./js/geo.js";
import { renderFishing, renderNetting } from "./js/fishing.js";
import { renderSalting, initialInput } from "./js/salting.js";

export { esc };

export const VIEWS = [
  ["map", "Map", "Houses for sale and distance rings"],
  ["fish", "Fishing", "Food in the bay, by season"],
  ["net", "Netting", "Targets you can catch with a net"],
  ["salt", "Salting", "Salt for fish and game"],
];
const VIEW_KEY = "prep-lt-view";
const ICONS = {
  map: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 4v14M15 6v14" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  fish: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12c3-4.5 7-6 11-4.5 2 .8 3.5 2.3 4.5 4.5-1 2.2-2.5 3.7-4.5 4.5C10 18 6 16.5 3 12Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M18.5 12 22 8.5v7L18.5 12Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="13.5" cy="11" r="1.1" fill="currentColor"/></svg>',
  net: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 9 9 3.5M3.5 15 15 3.5M3.5 20.5l17-17M9 20.5 20.5 9M15 20.5l5.5-5.5M9 3.5 20.5 15M3.5 3.5l17 17M3.5 9l11.5 11.5M15 3.5l5.5 5.5M3.5 15 9 20.5" fill="none" stroke="currentColor" stroke-width="1.1"/></svg>',
  salt: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 9.5h7l1.2 10.2a1.2 1.2 0 0 1-1.2 1.3h-7a1.2 1.2 0 0 1-1.2-1.3L8.5 9.5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8.5 9.5C8.5 5.5 10 3 12 3s3.5 2.5 3.5 6.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="11" cy="6.2" r=".9" fill="currentColor"/><circle cx="13.2" cy="5.6" r=".9" fill="currentColor"/><circle cx="12.4" cy="7.6" r=".9" fill="currentColor"/></svg>',
};

// The Map / Fishing / Netting / Salting switch, then the views (all but Map hidden until picked).
export function render(page = PAGE, context = {}, data = undefined) {
  const tabs = VIEWS.map(([id, label, sub], i) => `
      <button type="button" role="tab" class="lt-view-tab" id="lt-tab-${id}" data-view="${id}" aria-controls="lt-panel-${id}" aria-selected="${i === 0}"${i === 0 ? "" : ' tabindex="-1"'}>
        ${ICONS[id]}<span class="lt-view-text"><span class="lt-view-label">${esc(label)}</span><span class="lt-view-sub">${esc(sub)}</span></span>
      </button>`).join("");
  return `
    <div class="lt-views" role="tablist" aria-label="Long-term plan views">${tabs}</div>
    <div class="lt-paper-top">${reportActions("top")}</div>
    <div class="lt-panel" id="lt-panel-map" role="tabpanel" aria-labelledby="lt-tab-map" data-panel="map">${renderMap(page, context, data)}</div>
    <div class="lt-panel" id="lt-panel-fish" role="tabpanel" aria-labelledby="lt-tab-fish" data-panel="fish" hidden>${renderFishing()}</div>
    <div class="lt-panel" id="lt-panel-net" role="tabpanel" aria-labelledby="lt-tab-net" data-panel="net" hidden>${renderNetting()}</div>
    <div class="lt-panel" id="lt-panel-salt" role="tabpanel" aria-labelledby="lt-tab-salt" data-panel="salt" hidden>${renderSalting(initialInput())}</div>
    <div class="report-foot lt-paper-foot">
      <p>Keep a paper copy. Print everything on this tab, or save it as a PDF to print later.</p>
      ${reportActions("bottom")}
    </div>
    <div class="lt-print"></div>
  `;
}

// The same two buttons as the Short Term tab.
export function reportActions(where) {
  return `
    <div class="report-actions" data-where="${where}">
      <button type="button" class="btn" data-lt-print>Print the full report</button>
      <button type="button" class="btn btn-quiet" data-lt-pdf>Download PDF</button>
      <span class="pdf-status" role="status" aria-live="polite"></span>
    </div>`;
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

          ${renderCurrentsControls()}

          ${renderDepthControls()}

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

// The Tidal currents control. js/map.js loads the data the first time it's used.
export function renderCurrentsControls(words = CURRENTS) {
  const modes = words.modes.map(([v, label]) => `
      <label class="ltm-seg-item"><input type="radio" name="ltm-cur" value="${v}"${v === "off" ? " checked" : ""}><span>${esc(label)}</span></label>`).join("");
  return `
          <div class="ltm-group ltm-cur" role="group" aria-labelledby="ltm-cur-label">
            <span id="ltm-cur-label" class="ltm-label">${esc(words.label)}</span>
            <div class="ltm-seg ltm-seg-3">${modes}</div>
            <div class="ltm-tide" data-tide hidden>
              <div class="ltm-tide-head">
                <label for="ltm-tide-hour" class="ltm-tide-label">${esc(words.tideLabel)}</label>
                <output for="ltm-tide-hour" class="ltm-tide-out" data-tide-out aria-live="polite"></output>
              </div>
              <div class="ltm-tide-row">
                <button type="button" class="btn btn-quiet ltm-tide-btn" data-tide-step="-1" aria-label="An hour earlier">‹</button>
                <input type="range" id="ltm-tide-hour" min="0" max="11" step="1" value="0" data-tide-hour>
                <button type="button" class="btn btn-quiet ltm-tide-btn" data-tide-step="1" aria-label="An hour later">›</button>
                <button type="button" class="btn btn-quiet ltm-tide-play" data-tide-play aria-pressed="false">Play</button>
              </div>
            </div>
            <label class="ltm-check"><input type="checkbox" data-flats> ${esc(words.flatsLabel)}</label>
            <p class="ltm-hint" data-cur-status>${esc(words.hint)}</p>
          </div>`;
}

// The Water depth control. js/map.js loads data/depth.json the first time it's turned on.
export function renderDepthControls(words = DEPTH) {
  return `
          <div class="ltm-group ltm-depth" role="group" aria-labelledby="ltm-depth-label">
            <span id="ltm-depth-label" class="ltm-label">${esc(words.label)}</span>
            <label class="ltm-check"><input type="checkbox" data-depth> ${esc(words.checkLabel)}</label>
            <p class="ltm-hint" data-depth-status>${esc(words.hint)}</p>
          </div>`;
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
let netting = null;  // the live Netting view, once it has been shown
let salting = null;  // the live Salting calculator, once it has been shown
let mapStarted = false;
let cleanup = [];

function readView() {
  try {
    const v = localStorage.getItem(VIEW_KEY);
    return VIEWS.some(([id]) => id === v) ? v : "map";
  } catch { return "map"; }
}
function saveView(v) {
  try { localStorage.setItem(VIEW_KEY, v); } catch { /* private mode */ }
}

// The bay outline and distance rings, fetched once for the map and the paper copy.
let geoJson = null;
function loadGeo() {
  if (!geoJson) {
    geoJson = fetch(new URL("./data/geo.json", import.meta.url)).then((r) => {
      if (!r.ok) throw new Error(`geo.json: ${r.status}`);
      return r.json();
    });
    geoJson.catch(() => { geoJson = null; });
  }
  return geoJson;
}

async function startMap(root) {
  mapStarted = true;
  try {
    const [L, { createMap }, geo] = await Promise.all([
      import("./vendor/leaflet/leaflet.esm.min.js"),
      import("./js/map.js"),
      loadGeo(),
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
  // Fishing and Netting share the targets, so each redraws from the saved state when shown again.
  if (id === "fish") {
    if (fishing) fishing.refresh();
    else {
      const { createFishing } = await import("./js/fishing.js");
      if (root.isConnected) fishing = createFishing(root.querySelector('[data-panel="fish"]'));
    }
  }
  if (id === "net") {
    if (netting) netting.refresh();
    else {
      const { createFishing } = await import("./js/fishing.js");
      if (root.isConnected) netting = createFishing(root.querySelector('[data-panel="net"]'), { mode: "net" });
    }
  }
  if (id === "salt" && !salting) {
    const { createSalting } = await import("./js/salting.js");
    if (root.isConnected) salting = createSalting(root.querySelector('[data-panel="salt"]'));
  }
}

export async function mount(root, context = {}) {
  view = null; fishing = null; netting = null; salting = null; mapStarted = false;
  root.classList.remove("lt-has-print");
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

  const onPaper = (e) => {
    const print = e.target.closest("[data-lt-print]");
    const pdf = e.target.closest("[data-lt-pdf]");
    if (print) printReport(root, print);
    if (pdf) downloadPdf(root, pdf);
  };
  root.addEventListener("click", onPaper);
  cleanup.push(() => root.removeEventListener("click", onPaper));

  await showView(root, readView());
  // Have the printout ready for the browser's own Print (Ctrl+P) too.
  const later = window.requestIdleCallback || ((fn) => setTimeout(fn, 1500));
  later(() => { if (root.isConnected) buildPrint(root).catch(() => {}); });
}

// ---------- paper copy ----------

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const todayText = () => new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

// The README pages, as the site publishes them (shell/readme-pages.js, in index.html).
function readmePages() {
  try { return JSON.parse(document.getElementById("rmpages")?.textContent || "[]"); } catch { return []; }
}

// The currents data and the printed currents map, as a data: URL (pdfmake needs one). Optional:
// if they don't load, the report leaves the currents section out.
async function loadReportCurrents() {
  try {
    const [data, blob] = await Promise.all([
      fetch(new URL("./data/currents.json", import.meta.url)).then((r) => (r.ok ? r.json() : null)),
      fetch(new URL("./data/currents-print.png", import.meta.url)).then((r) => (r.ok ? r.blob() : null)),
    ]);
    const image = blob ? await new Promise((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = () => resolve("");
      fr.readAsDataURL(blob);
    }) : "";
    return { currents: data, currentsImage: image };
  } catch {
    return { currents: null, currentsImage: "" };
  }
}

// The depth data and the printed depth map, the same way. Optional too.
async function loadReportDepth() {
  try {
    const [data, blob] = await Promise.all([
      fetch(new URL("./data/depth.json", import.meta.url)).then((r) => (r.ok ? r.json() : null)),
      fetch(new URL("./data/depth-print.png", import.meta.url)).then((r) => (r.ok ? r.blob() : null)),
    ]);
    const image = blob ? await new Promise((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = () => resolve("");
      fr.readAsDataURL(blob);
    }) : "";
    return { depth: data, depthImage: image };
  } catch {
    return { depth: null, depthImage: "" };
  }
}

let report = null; // { day, blocks }
async function reportBlocks() {
  const day = todayIso();
  if (report?.day === day) return report.blocks;
  const [{ buildReport }, geo, cur, dep] = await Promise.all([import("./js/report.js"), loadGeo(), loadReportCurrents(), loadReportDepth()]);
  const blocks = buildReport({ geo, today: day, dateText: todayText(), readme: readmePages(), ...cur, ...dep });
  report = { day, blocks };
  return blocks;
}

async function buildPrint(root) {
  const box = root.querySelector(".lt-print");
  if (!box) return;
  const blocks = await reportBlocks();
  if (box.dataset.day === report.day) return;
  const { reportHtml } = await import("./js/report.js");
  box.innerHTML = reportHtml(blocks);
  box.dataset.day = report.day;
  root.classList.add("lt-has-print");
}

function busy(button, text) {
  const status = button.parentElement.querySelector(".pdf-status");
  const label = button.textContent;
  button.disabled = true;
  button.textContent = text;
  status.textContent = "";
  return {
    say: (msg) => { status.textContent = msg; },
    done: () => { button.disabled = false; button.textContent = label; },
  };
}

async function printReport(root, button) {
  const b = busy(button, "Getting it ready…");
  try {
    await buildPrint(root);
    b.done();
    window.print();
  } catch (err) {
    console.error(err);
    b.say("The report didn't load. Check your connection and try again.");
    b.done();
  }
}

let pdfLib = null;
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`Couldn't load ${src}`));
    document.head.appendChild(s);
  });
}
async function loadPdfLib() {
  if (!pdfLib) {
    pdfLib = (async () => {
      // The Short Term tab may have loaded the same pdfmake already.
      if (!window.pdfMake?.createPdf) {
        await loadScript(new URL("./vendor/pdfmake/pdfmake.min.js", import.meta.url).href);
        await loadScript(new URL("./vendor/pdfmake/vfs_fonts.js", import.meta.url).href);
      }
      return window.pdfMake;
    })();
    pdfLib.catch(() => { pdfLib = null; });
  }
  return pdfLib;
}

async function downloadPdf(root, button) {
  const b = busy(button, "Making the PDF…");
  try {
    const [pdfMake, { reportPdf }, blocks] = await Promise.all([loadPdfLib(), import("./js/report-pdf.js"), reportBlocks()]);
    const doc = reportPdf(blocks, { date: todayText() });
    await pdfMake.createPdf(doc).download(`prep-long-term-${todayIso()}.pdf`);
    b.say("PDF downloaded.");
  } catch (err) {
    console.error(err);
    b.say("The PDF didn't download. Use Print the full report and choose Save as PDF instead.");
  } finally {
    b.done();
  }
}

export function unmount(root) {
  // Stops listeners, leaves full screen and removes the map. The frame empties #lt-root after this.
  for (const fn of cleanup) fn();
  cleanup = [];
  if (view) view.destroy();
  if (fishing) fishing.destroy();
  if (netting) netting.destroy();
  if (salting) salting.destroy();
  view = null; fishing = null; netting = null; salting = null; mapStarted = false;
  root.classList.remove("lt-has-print");
}
