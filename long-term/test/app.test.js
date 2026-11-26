import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { render } from "../app.js";
import { PAGE } from "../data/plan.js";
import { HOUSES, HOUSES_CHECKED } from "../data/houses.js";
import { RING_COLORS, DEFAULT_RINGS, TOWNS, WATER_NAMES, MAP_VIEW, DENNYSVILLE } from "../data/places.js";
import * as POWER from "../data/power.js";
import {
  makeShoreDistance, inPolygon, milesBetween, ringOf, ringStyles, filterHouses, sortHouses,
  shortMoney, money, durationText, daysBetween, niceDate, milesText, shoreText, tileView, lifespanRows, statusGroup,
} from "../js/geo.js";
import { popupHtml, cardHtml, listedText } from "../js/popup.js";

const geo = JSON.parse(readFileSync(new URL("../data/geo.json", import.meta.url), "utf8"));
const shore = makeShoreDistance(geo.bay);
const info = new Map(HOUSES.map((h) => {
  const s = shore(h.lat, h.lon);
  return [h.id, { shore: s, ring: ringOf(s), dennysville: milesBetween(h, DENNYSVILLE) }];
}));

// ---------- page ----------

test("the page draws its heading, ten ring chips and the house counts", () => {
  const html = render(PAGE, { household: null });
  assert.match(html, /<h2[^>]*>Cobscook Bay map<\/h2>/);
  assert.equal((html.match(/data-ring="\d+"/g) || []).length, 10);
  for (const m of DEFAULT_RINGS) assert.match(html, new RegExp(`data-ring="${m}" aria-pressed="true"`));
  assert.match(html, new RegExp(`All houses <b>${HOUSES.length}</b>`));
  assert.match(html, /Off-grid solar <b>3<\/b>/);
});

test("text from data is escaped", () => {
  const html = render({ ...PAGE, heading: "<b>x</b>", intro: "a & b", notes: ["<i>"] });
  assert.ok(html.includes("&lt;b&gt;x&lt;/b&gt;"));
  assert.ok(html.includes("a &amp; b"));
  assert.ok(html.includes("&lt;i&gt;"));
});

// ---------- the shapes ----------

test("geo.json has the bay and ten 1-mile rings", () => {
  assert.equal(geo.bay.type, "Polygon");
  assert.equal(geo.rings.length, 10);
  geo.rings.forEach((r, i) => {
    assert.equal(r.miles, i + 1);
    assert.ok(["Polygon", "MultiPolygon"].includes(r.geometry.type));
    assert.ok(r.sqmi > 20, `ring ${r.miles} looks too small`);
  });
});

test("shore distances match the Python (shapely) measurements", () => {
  // Measured with long-term/tools/build_geo.py's shapes in UTM 19N.
  const expected = [
    [44.9037, -67.2286, 0.917],  // Dennysville village
    [45.026512, -67.28, 7.841],  // 1235 Ayers Junction Road
    [44.9062, -66.99, 0.541],    // Eastport
    [44.756057, -67.07, 5.117],  // 128 Havenhurst Road
    [44.7909, -67.1755, 1.791],  // Whiting
    [44.9095, -67.0555, 0],      // middle of the bay
  ];
  for (const [lat, lon, mi] of expected) assert.ok(Math.abs(shore(lat, lon) - mi) < 0.05, `${lat},${lon}: ${shore(lat, lon)} vs ${mi}`);
});

test("named parts of the bay sit on the bay's water", () => {
  for (const w of WATER_NAMES.filter((x) => !x.outside)) {
    assert.ok(inPolygon(w.lon, w.lat, geo.bay), `${w.name} is not on the bay`);
  }
});

test("towns have names, coordinates and a population note", () => {
  for (const t of TOWNS) {
    assert.ok(t.name && Number.isFinite(t.lat) && Number.isFinite(t.lon), t.name);
    if (t.kind === "town") assert.ok(t.pop > 0 || /724/.test(t.popNote), `${t.name} needs a population`);
  }
});

// ---------- the houses ----------

test("every house has the fields the map needs", () => {
  const ids = new Set();
  const [[s, w], [n, e]] = MAP_VIEW.bounds;
  for (const h of HOUSES) {
    assert.ok(!ids.has(h.id), `duplicate id ${h.id}`); ids.add(h.id);
    assert.ok(h.address && h.town && h.mls && h.office, h.id);
    assert.ok(h.price > 10000, `${h.id} price`);
    assert.ok(["active", "under-contract", "pending", "expired"].includes(h.status), `${h.id} status`);
    assert.ok(["offgrid-solar", "backup", "none"].includes(h.power), `${h.id} power`);
    assert.ok(h.lat > s && h.lat < n && h.lon > w && h.lon < e, `${h.id} is off the map`);
    assert.match(h.listing, /^https:\/\//, `${h.id} listing link`);
    if (h.compass) assert.match(h.compass, /^https:\/\/www\.compass\.com\//);
    if (h.listed) {
      assert.match(h.listed, /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(h.listed <= HOUSES_CHECKED, `${h.id} listed after the check date`);
    }
    if (h.power === "offgrid-solar") assert.ok(h.solar && "battery" in h.solar && "inverter" in h.solar, `${h.id} needs solar details`);
  }
});

test("every house is within 10 miles of the bay", () => {
  for (const h of HOUSES) assert.ok(info.get(h.id).shore <= 10, `${h.id}: ${info.get(h.id).shore.toFixed(2)} mi`);
});

test("the three off-grid solar houses are the ones the listings back up", () => {
  const solar = HOUSES.filter((h) => h.power === "offgrid-solar").map((h) => h.address).sort();
  assert.deepEqual(solar, ["1235 Ayers Junction Road", "44 Cobscook Drive", "72 Fifth Avenue"]);
});

// ---------- filters and colors ----------

test("each picked distance gets its own color and rings past the last pick are hidden", () => {
  const { ringColors, legend } = ringStyles([5, 1], RING_COLORS);
  assert.equal(ringColors[0], RING_COLORS[0]);
  for (let i = 1; i < 5; i++) assert.equal(ringColors[i], RING_COLORS[4]);
  for (let i = 5; i < 10; i++) assert.equal(ringColors[i], null);
  assert.deepEqual(legend.map((l) => [l.from, l.to]), [[0, 1], [1, 5]]);
  assert.deepEqual(ringStyles([], RING_COLORS).ringColors, Array(10).fill(null));
});

test("ringOf puts distances in 1-mile rings", () => {
  assert.equal(ringOf(0), 0);
  assert.equal(ringOf(0.2), 1);
  assert.equal(ringOf(1), 1);
  assert.equal(ringOf(1.01), 2);
  assert.equal(ringOf(12), 11);
});

test("filters: power, status, price, rings and approximate pins", () => {
  const all = { power: "all", statuses: new Set(["active", "offer", "expired"]), picked: [1, 5, 10] };
  assert.equal(filterHouses(HOUSES, all, info).length, HOUSES.length);
  const solar = filterHouses(HOUSES, { ...all, power: "solar" }, info);
  assert.ok(solar.every((h) => h.power === "offgrid-solar") && solar.length === 3);
  const backup = filterHouses(HOUSES, { ...all, power: "backup" }, info);
  assert.ok(backup.length > solar.length && backup.every((h) => h.power !== "none"));
  const forSale = filterHouses(HOUSES, { ...all, statuses: new Set(["active"]) }, info);
  assert.ok(forSale.every((h) => h.status === "active"));
  assert.ok(filterHouses(HOUSES, { ...all, maxPrice: 150000 }, info).every((h) => h.price <= 150000));
  const near = filterHouses(HOUSES, { ...all, picked: [1], insideRings: true }, info);
  assert.ok(near.length > 0 && near.every((h) => info.get(h.id).shore <= 1));
  assert.ok(filterHouses(HOUSES, { ...all, hideApprox: true }, info).every((h) => !h.approx));
  assert.equal(statusGroup("pending"), "offer");
});

test("sorting by distance and price", () => {
  const byShore = sortHouses(HOUSES, "shore", info);
  for (let i = 1; i < byShore.length; i++) assert.ok(info.get(byShore[i - 1].id).shore <= info.get(byShore[i].id).shore);
  const byPrice = sortHouses(HOUSES, "priceUp", info);
  for (let i = 1; i < byPrice.length; i++) assert.ok(byPrice[i - 1].price <= byPrice[i].price);
  assert.equal(sortHouses(HOUSES, "power", info)[0].power, "offgrid-solar");
});

// ---------- words and numbers ----------

test("money, dates and distances read plainly", () => {
  assert.equal(money(1295000), "$1,295,000");
  assert.equal(shortMoney(1295000), "$1.3M");
  assert.equal(shortMoney(2000000), "$2M");
  assert.equal(shortMoney(159000), "$159k");
  assert.equal(niceDate("2026-06-06"), "Jun 6, 2026");
  assert.equal(daysBetween("2026-06-06", "2026-11-20"), 167);
  assert.equal(durationText(30), "30 days");
  assert.equal(durationText(167), "167 days (about 5 months)");
  assert.match(durationText(600), /about 1\.6 years/);
  assert.equal(milesText(0.01), "on the bay");
  assert.equal(milesText(6.86), "6.9 mi");
  assert.equal(shoreText(0), "Waterfront on Cobscook Bay");
  assert.equal(shoreText(0, "rounded"), "By Cobscook Bay");
  assert.equal(shoreText(0, "approx"), "Near Cobscook Bay");
  assert.equal(shoreText(2.34, "approx", "the bay"), "about 2.3 mi from the bay");
  assert.equal(shoreText(2.34, "rounded"), "2.3 mi from Cobscook Bay");
});

test("lifespan rows use the install year when the listing gives one", () => {
  const rows = lifespanRows({ installed: 2026, battery: null }, POWER.LIFESPANS);
  assert.deepEqual(rows.map((r) => r.part), ["Panels", "Battery", "Inverter"]);
  assert.equal(rows[0].until, "about 2051–2056");
  assert.match(rows[1].life, /depending on type/);
  assert.equal(lifespanRows({ battery: "LFP 10 kWh" }, POWER.LIFESPANS)[1].part, "Battery (LFP)");
});

test("the satellite picture puts the house in the middle", () => {
  const tiles = tileView(44.922089, -67.091172, 17, 264, 150);
  assert.ok(tiles.length >= 2 && tiles.length <= 4);
  // The tile under the center of the box contains the house.
  const center = tiles.find((t) => t.left <= 132 && t.left + 256 > 132 && t.top <= 75 && t.top + 256 > 75);
  assert.ok(center, "a tile covers the middle");
  assert.equal(center.z, 17);
});

// ---------- popups and cards ----------

test("popups explain the solar system and say what's missing", () => {
  const h = HOUSES.find((x) => x.address === "44 Cobscook Drive");
  const html = popupHtml(h, info.get(h.id), { tileUrl: "https://t/{z}/{y}/{x}", today: "2026-11-26", power: POWER });
  assert.match(html, /Solar system/);
  assert.match(html, /Not in the listing/);
  assert.match(html, /expired Nov 20, 2026 after 167 days/);
  assert.match(html, /Waterfront on Cobscook Bay/);
  assert.match(html, /How long it lasts/);
  assert.ok(html.includes(h.listing));
});

test("popups and cards escape listing text", () => {
  const bad = { ...HOUSES[0], id: "x", address: "<img src=x onerror=alert(1)>", office: "A & B", facts: ["<b>"], approx: "<i>here</i>" };
  const i = { shore: 1, dennysville: 2 };
  const pop = popupHtml(bad, i, { tileUrl: "https://t/{z}/{y}/{x}", today: "2026-11-26", power: POWER });
  const card = cardHtml(bad, i, "2026-11-26");
  for (const html of [pop, card]) assert.ok(!html.includes("<img src=x"), "raw HTML leaked");
  assert.ok(pop.includes("A &amp; B") && pop.includes("&lt;b&gt;") && pop.includes("&lt;i&gt;here"));
});

test("list dates show time on the market", () => {
  const h = { listed: "2025-11-08", status: "active" };
  assert.equal(listedText(h, "2026-11-26"), "Listed Nov 8, 2025 · on the market 383 days (about 13 months)");
  assert.equal(listedText({ status: "active" }, "2026-11-26"), "List date not checked");
});
