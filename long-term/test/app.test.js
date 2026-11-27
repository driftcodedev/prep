import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import crypto from "node:crypto";
import { render } from "../app.js";
import { PAGE } from "../data/plan.js";
import { HOUSES, HOUSES_CHECKED, HOUSES_CHANGES } from "../data/houses.js";
import { RING_COLORS, DEFAULT_RINGS, TOWNS, WATER_NAMES, MAP_VIEW, DENNYSVILLE } from "../data/places.js";
import * as POWER from "../data/power.js";
import {
  makeShoreDistance, inPolygon, milesBetween, ringOf, ringStyles, filterHouses, sortHouses,
  shortMoney, money, durationText, daysBetween, niceDate, milesText, shoreText, tileView, lifespanRows, statusGroup,
  isNew, changesText,
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
    assert.ok(["Polygon", "MultiPolygon"].includes(r.land.type), `ring ${r.miles} has no land copy`);
    assert.ok(r.landSqmi > 20 && r.landSqmi < r.sqmi, `ring ${r.miles} land share`);
  });
  // From 3 miles out the bands are single closed loops around the bay: one outline and one hole.
  for (const r of geo.rings.slice(2)) {
    assert.equal(r.geometry.type, "Polygon", `ring ${r.miles}`);
    assert.equal(r.geometry.coordinates.length, 2, `ring ${r.miles} should be one closed loop`);
  }
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

// ---------- weekly check ----------

test("listings from the last 14 days get a New badge", () => {
  const h = { ...HOUSES[1], listed: "2026-11-20", status: "active" };
  assert.equal(isNew(h, "2026-11-26"), true);
  assert.equal(isNew({ ...h, listed: "2026-11-01" }, "2026-11-26"), false);
  assert.equal(isNew({ ...h, status: "expired" }, "2026-11-26"), false);
  assert.equal(isNew({ ...h, listed: undefined }, "2026-11-26"), false);
  assert.match(cardHtml(h, { shore: 1, dennysville: 2 }, "2026-11-26"), /ltm-badge-new/);
  assert.doesNotMatch(cardHtml({ ...h, listed: "2026-01-01" }, { shore: 1, dennysville: 2 }, "2026-11-26"), /ltm-badge-new/);
});

test("the line under the map says what the weekly check changed", () => {
  assert.equal(changesText({ previous: null, added: [], removed: [] }), "");
  assert.equal(changesText({ previous: "2026-11-26", added: [], removed: [] }), "No new or removed listings since the last check on Nov 26, 2026.");
  assert.equal(
    changesText({ previous: "2026-11-26", added: ["a", "b"], removed: [{ address: "1 Main Street", town: "Lubec", price: 100000, reason: "sold" }] }),
    "2 new listings added, 1 removed since the last check on Nov 26, 2026. Removed: 1 Main Street, Lubec (sold).",
  );
  assert.equal(changesText({ previous: "2026-11-26", added: [], removed: [{ address: "2 Elm", town: "Perry", reason: "taken off the market" }] }),
    "1 removed since the last check on Nov 26, 2026. Removed: 2 Elm, Perry (taken off the market).");
});

test("the weekly change record matches the house list", () => {
  const ids = new Set(HOUSES.map((h) => h.id));
  assert.equal(ids.size, HOUSES.length, "house ids are unique");
  for (const id of HOUSES_CHANGES.added) assert.ok(ids.has(id), `added id ${id} is in HOUSES`);
  for (const r of HOUSES_CHANGES.removed) {
    assert.ok(r.address && r.town && r.reason, "removed houses say what and why");
    assert.ok(!HOUSES.some((h) => h.address === r.address && h.town === r.town), `${r.address} was removed but is still listed`);
  }
  if (HOUSES_CHANGES.previous) assert.ok(HOUSES_CHANGES.previous < HOUSES_CHECKED);
  assert.match(HOUSES_CHECKED, /^\d{4}-\d{2}-\d{2}$/);
});

// ---------- Map / Fishing views ----------

import { VIEWS } from "../app.js";
import { SEASONS, SPECIES, ADULT_KCAL_YEAR, HERRING_CATCH } from "../data/fishing.js";
import { SPECIES_COLORS, PROFILES, CONFIDENCE, FISH_SOURCES, PHOTOS, PHOTO_LICENSES, NET_GEAR, NET_PAGE, NET_FINDINGS } from "../data/fishing-notes.js";
import {
  counted, seasonTotal, adultsFed, fedText, seasonRanking, sortRows, bestOf, cellText, rankingText, donutSlices, herringCatch,
  meatText, round2, millions, thousands, caloriesText, poundsText, pct, drawTable, renderFishing, seasonOfDate,
  photoSrc, photoPage, photosHtml, cleanPicks, isPicked, togglePick, pickCount, pickText,
  netRows, targetTotal, renderNetting, drawFindings,
} from "../js/fishing.js";

test("the tab has Map, Fishing and Netting views, Map first", () => {
  const html = render(PAGE, { household: null });
  assert.deepEqual(VIEWS.map((v) => v[0]), ["map", "fish", "net"]);
  assert.match(html, /role="tablist"/);
  assert.match(html, /id="lt-panel-map"[^>]*data-panel="map"/);
  assert.match(html, /id="lt-panel-fish"[^>]*data-panel="fish" hidden/);
  assert.match(html, /id="lt-panel-net"[^>]*data-panel="net" hidden/);
  assert.match(html, /id="lt-tab-net"[^>]*>[\s\S]*?Netting/);
  assert.match(html, /Cobscook Bay fishing by season/);
  // The two tables' controls don't share radio groups or ids.
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length, "ids are unique across the views");
  assert.match(html, /name="ltn-measure"/);
  assert.match(html, /name="ltf-measure"/);
});

test("fishing data: six seasons, every species complete, colored, described and scored 1–5", () => {
  assert.equal(SEASONS.length, 6);
  assert.equal(SEASONS.reduce((s, x) => s + x.days, 0), 365);
  assert.equal(ADULT_KCAL_YEAR, 3000 * 365);
  const ids = new Set();
  for (const sp of SPECIES) {
    assert.ok(!ids.has(sp.id), `duplicate ${sp.id}`); ids.add(sp.id);
    assert.equal(sp.lb.length, 6, `${sp.id} lb`);
    assert.equal(sp.kcal.length, 6, `${sp.id} kcal`);
    assert.ok(SPECIES_COLORS[sp.id], `${sp.id} color`);
    assert.ok(PROFILES[sp.id], `${sp.id} profile`);
    assert.ok(CONFIDENCE[sp.confidence], `${sp.id} confidence`);
    assert.ok(sp.source && sp.short && sp.kcalPerLb > 0, `${sp.id} words`);
    sp.lb.forEach((v, b) => {
      // Calories are null exactly where pounds are, and match pounds × meat share × calories per pound.
      assert.equal(sp.kcal[b] === null, v === null, `${sp.id} season ${b}`);
      if (v !== null) assert.ok(Math.abs(sp.kcal[b] - v * (sp.meatShares ? sp.meatShares[b] : sp.meatShare) * sp.kcalPerLb) <= 5000, `${sp.id} season ${b} calories`);
    });
    // No count means no numbers at all and the lowest score: blank, not guessed.
    if (!counted(sp)) assert.equal(sp.confidence, 1, `${sp.id} has no count`);
  }
  assert.deepEqual(SPECIES.filter((sp) => !counted(sp)).map((sp) => sp.id), ["cucumbers", "whelks", "pollock", "elvers"]);
});

test("the scores agreed for each species", () => {
  const score = Object.fromEntries(SPECIES.map((sp) => [sp.id, sp.confidence]));
  assert.deepEqual(score, {
    herring: 3, mackerel: 2, periwinkles: 2, shellfish: 3, scallops: 3, alewives: 4, flounder: 3, codfamily: 2,
    greencrabs: 2, lobster: 3, sculpin: 2, smelt: 3, silverside: 2, urchins: 2, cucumbers: 1, whelks: 1, pollock: 1, elvers: 1,
  });
});

test("season totals match the sources-check doc", () => {
  const millionsBySeason = [0, 1, 2, 3, 4, 5].map((b) => Math.round(seasonTotal(SPECIES, "kcal", b) / 1e6));
  assert.deepEqual(millionsBySeason, [958, 986, 1084, 1698, 2661, 1045]);
  const fed = [0, 1, 2, 3, 4, 5].map((b) => fedText(seasonTotal(SPECIES, "kcal", b)));
  assert.deepEqual(fed, ["870", "900", "990", "1,550", "2,430", "950"]);
  assert.ok(Math.abs(adultsFed(1095000) - 1) < 1e-9);
  const herring = SPECIES.find((sp) => sp.id === "herring");
  assert.deepEqual(herring.lb.map((v) => Math.round(v / 1000)), [0, 0, 302, 1107, 3580, 410]);
  // Herring's year-round average is the middle of the three methods.
  assert.equal(Math.round(herring.lb.reduce((s, v) => s + v, 0) / 6), HERRING_CATCH.avgUsed);
  // Shellfish: 1.6 million lb a year on average (the least the clam harvest needs).
  const shellfish = SPECIES.find((sp) => sp.id === "shellfish");
  assert.equal(Math.round(shellfish.lb.reduce((s, v) => s + v, 0) / 6), 1600000);
  // Flounder: adults leave when the water is under 43°F, so January–April are 0.
  const flounder = SPECIES.find((sp) => sp.id === "flounder");
  // Swept area from the bay survey's own bottom trawl.
  assert.deepEqual(flounder.lb.map((v) => Math.round(v / 1000)), [0, 0, 169, 96, 51, 51]);
  // Scallops: DMR's fall 2015 survey, the last bay total it published.
  assert.deepEqual(SPECIES.find((sp) => sp.id === "scallops").lb, [376300, 376300, 376300, 376300, 376300, 376300]);
  // Urchin roe changes by season around a 6% yearly middle: fullest December–April.
  const urchins = SPECIES.find((sp) => sp.id === "urchins");
  assert.equal(urchins.meatShare, 0.06);
  assert.deepEqual(urchins.meatShares.map((v) => Math.round(v * 1000) / 10), [8.1, 8.1, 4.5, 4.5, 4.5, 6.3]);
  assert.deepEqual(urchins.kcal.map((v) => Math.round(v / 1e6)), [632, 632, 350, 350, 350, 491]);
  const lobster = SPECIES.find((sp) => sp.id === "lobster");
  // Lobster: May–June is Maine's spring survey scaled to local water by the fall comparison.
  assert.deepEqual(lobster.lb.map((v) => (v === null ? null : Math.round(v / 1000))), [null, null, 701, 574, 1033, null]);
});

test("each season's ranking adds to 100% and matches the doc's order", () => {
  for (let b = 0; b < 6; b++) {
    const r = seasonRanking(SPECIES, "kcal", b);
    assert.ok(Math.abs(r.reduce((s, x) => s + x.share, 0) - 100) < 1e-6, `season ${b}`);
    assert.ok(r.every((x, i) => i === 0 || r[i - 1].value >= x.value), `season ${b} order`);
  }
  assert.equal(rankingText(SPECIES, 0), "Urchins 66%, scallops 12%, clams and mussels 11%, periwinkles 9%, smelt 1%, the rest under 1%");
  assert.equal(rankingText(SPECIES, 4), "Herring 58%, urchins 13%, mackerel 11%, clams and mussels 5%, scallops 4%, periwinkles 4%, lobster 3%, the rest under 1%");
  assert.equal(seasonRanking(SPECIES, "kcal", 5)[0].sp.id, "urchins");
});

test("rows sort by the picked season: most to least, then none counted, not counted, no count", () => {
  for (let b = 0; b < 6; b++) {
    const rows = sortRows(SPECIES, "kcal", b);
    assert.equal(rows.length, SPECIES.length, `season ${b}`);
    assert.equal(new Set(rows.map((sp) => sp.id)).size, SPECIES.length);
    const vals = rows.map((sp) => sp.kcal[b]).filter((v) => v > 0);
    assert.ok(vals.every((v, i) => i === 0 || vals[i - 1] >= v), `season ${b} order`);
  }
  const jan = sortRows(SPECIES, "kcal", 0).map((sp) => sp.id);
  assert.deepEqual(jan.slice(0, 4), ["urchins", "scallops", "shellfish", "periwinkles"]);
  assert.ok(jan.indexOf("herring") < jan.indexOf("lobster"), "none counted comes before not counted this season");
  assert.ok(jan.indexOf("lobster") < jan.indexOf("cucumbers"), "not counted this season comes before no count");
  assert.equal(sortRows(SPECIES, "kcal", 4)[0].id, "herring");
  assert.deepEqual(sortRows(SPECIES, "lb", 0).slice(0, 3).map((sp) => sp.id), ["urchins", "periwinkles", "shellfish"]); // by pounds, periwinkles edge out clams
});

test("percent views: share of the season (columns) and % of the species' own best season (rows)", () => {
  const sp = (id) => SPECIES.find((x) => x.id === id);
  // Columns: Jan–Feb shellfish against scallops.
  assert.equal(cellText(sp("shellfish"), "kcal", "col", 0), "11%");
  assert.equal(cellText(sp("scallops"), "kcal", "col", 0), "12%");
  assert.equal(cellText(sp("urchins"), "kcal", "col", 0), "66%");
  assert.equal(cellText(sp("herring"), "kcal", "col", 4), "58%");
  // Rows: each season against the species' own best.
  assert.equal(cellText(sp("herring"), "kcal", "row", 4), "100%");
  assert.equal(cellText(sp("herring"), "kcal", "row", 0), "0%");
  assert.equal(cellText(sp("flounder"), "kcal", "row", 2), "100%");
  assert.equal(cellText(sp("flounder"), "kcal", "row", 3), "57%");
  assert.equal(cellText(sp("scallops"), "lb", "row", 1), "100%");
  // Not counted stays "?" in every view; amounts read as in the doc.
  for (const view of ["amount", "col", "row"]) assert.equal(cellText(sp("lobster"), "kcal", view, 0), "?");
  assert.equal(cellText(sp("herring"), "kcal", "amount", 4), "1,540");
  assert.equal(cellText(sp("herring"), "lb", "amount", 4), "3,580");
  assert.equal(bestOf(sp("cucumbers"), "kcal"), 0);
  // Urchins stay put, so pounds are the same every season; calories follow the roe.
  assert.equal(cellText(sp("urchins"), "lb", "row", 3), "100%");
  assert.equal(cellText(sp("urchins"), "kcal", "row", 0), "100%");
  assert.equal(cellText(sp("urchins"), "kcal", "row", 2), "55%");
  assert.equal(meatText(sp("urchins")), "4.5–8.1% of live weight by season, 544 calories a pound of meat");
  assert.equal(cellText(sp("urchins"), "lb", "amount", 0), "14,328");
  // Each season's column shares add to 100%.
  for (let b = 0; b < 6; b++) {
    const sum = SPECIES.reduce((s, x) => s + (x.kcal[b] || 0), 0) / seasonTotal(SPECIES, "kcal", b);
    assert.ok(Math.abs(sum - 1) < 1e-9);
  }
});

test("rings fold small species into Other and keep the total", () => {
  const slices = donutSlices(seasonRanking(SPECIES, "kcal", 3), 4);
  assert.equal(slices.length, 5);
  assert.equal(slices.at(-1).id, "other");
  assert.ok(Math.abs(slices.reduce((s, x) => s + x.share, 0) - 100) < 1e-6);
});

test("the 1947–58 herring record: twelve years, the doc's average and months", () => {
  const hc = herringCatch();
  assert.equal(hc.rows.length, 6);
  assert.deepEqual(hc.rows[0], ["1947", "49,000", "1953", "6,289,150"]);
  assert.equal(Math.round(hc.average), 2877423);
  assert.equal(hc.months, "June 5.5%, July 6.7%, August 13.8%, September 30.1%, October 36.2%, November 6.9%, December 0.7%");
  assert.equal(HERRING_CATCH.monthPct.length, 12);
});

test("fishing numbers read plainly", () => {
  assert.equal(millions(1540202000), "1,540");
  assert.equal(millions(7400000), "7.4");
  assert.equal(millions(20000), "<0.1");
  assert.equal(millions(0), "0");
  assert.equal(millions(null), "?");
  assert.equal(thousands(3580200), "3,580");
  assert.equal(thousands(258), "<1");
  assert.equal(thousands(null), "?");
  assert.equal(caloriesText(2149000000), "2.1 billion calories");
  assert.equal(caloriesText(595000000), "600 million calories");
  assert.equal(poundsText(3580200), "3,580,000 lb");
  assert.equal(poundsText(258), "260 lb");
  assert.equal(pct(0.3), "<1%");
  assert.equal(meatText(SPECIES.find((sp) => sp.id === "herring")), "60% of live weight, 717 calories a pound of meat");
  assert.equal(meatText(SPECIES.find((sp) => sp.id === "scallops")), "Meat only, 313 calories a pound of meat");
  assert.equal(seasonOfDate(new Date(2026, 10, 26)), 5);
  assert.equal(seasonOfDate(new Date(2026, 0, 3)), 0);
});

test("fishing table: a row per species with its notes, sorted by the picked season, in every view", () => {
  const tbl = drawTable({ measure: "kcal", view: "amount" }, 4);
  assert.equal((tbl.match(/<tr class="ltf-tbl-row/g) || []).length, SPECIES.length);
  assert.equal((tbl.match(/<tr class="ltf-tbl-detail" id="ltf-d-[a-z]+" hidden>/g) || []).length, SPECIES.length);
  assert.match(tbl, /data-season="4" aria-pressed="true"/);
  assert.match(tbl, /aria-sort="descending"/);
  assert.match(tbl, /Active adults fed a year/);
  assert.match(tbl, />2,661</);
  assert.ok(tbl.indexOf('data-sp="herring"') < tbl.indexOf('data-sp="mackerel"'), "Sep–Oct: herring first");
  const open = drawTable({ measure: "kcal", view: "amount" }, 0, new Set(["flounder"]));
  assert.match(open, /data-sp="flounder" aria-expanded="true"/);
  assert.match(open, /id="ltf-d-flounder"><td colspan="8">/);
  assert.match(open, /Calories in Jan–Feb/);
  assert.match(open, /Adults leave when the water is under 43°F/);
  const col = drawTable({ measure: "kcal", view: "col" }, 0);
  assert.match(col, />66%</);
  assert.match(col, /<th scope="row">Total<\/th>(<td[^>]*>100%<\/td>){6}/);
  const row = drawTable({ measure: "kcal", view: "row" }, 4);
  assert.match(row, /class="ltf-pickcell is-on is-best"><button[^>]*>100%</);
  assert.match(row, /All species/);
  const lb = drawTable({ measure: "lb", view: "amount" }, 4);
  assert.match(lb, /Sea scallops \(meat\)/);
  assert.doesNotMatch(lb, /<tfoot>/);
  for (const html of [tbl, open, col, row, lb, drawTable({ measure: "lb", view: "row" }, 2), drawTable({ measure: "lb", view: "col" }, 5)]) {
    assert.doesNotMatch(html, /undefined|NaN/);
  }
  const page = renderFishing();
  assert.match(page, /name="ltf-measure"/);
  assert.match(page, /name="ltf-view" value="row"/);
  assert.match(page, /Herring: three ways to measure it/);
  assert.match(page, /Herring caught in Cobscook, 1947–58/);
  assert.equal((page.match(/<li><a href=/g) || []).length, FISH_SOURCES.length);
  assert.doesNotMatch(page, /One trip|a trip|ltf-row/);
});

test("every species has a picture with its maker and license, shown at the top of its notes", () => {
  for (const sp of SPECIES) {
    const list = PHOTOS[sp.id];
    assert.ok(list && list.length, `${sp.id} picture`);
    for (const ph of list) {
      assert.ok(ph.label && ph.by && ph.file, `${sp.id} credit`);
      assert.ok(ph.license in PHOTO_LICENSES, `${sp.id} license ${ph.license}`);
      assert.match(ph.dir, /^[0-9a-f]\/[0-9a-f]{2}$/, `${sp.id} folder`);
      assert.equal(ph.dir[0], ph.dir[2], `${sp.id} folder letters`);
      assert.ok(ph.w > 0 && ph.h > 0, `${sp.id} size`);
    }
  }
  // Wikimedia's folder for a file comes from the md5 of its name.
  for (const ph of Object.values(PHOTOS).flat()) {
    const md5 = crypto.createHash("md5").update(ph.file).digest("hex");
    assert.equal(ph.dir, `${md5[0]}/${md5.slice(0, 2)}`, ph.file);
  }
  const herring = PHOTOS.herring[0];
  assert.equal(photoSrc(herring), "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Clupea_harengus_Atlantic.jpg/500px-Clupea_harengus_Atlantic.jpg");
  assert.equal(photoPage(herring), "https://commons.wikimedia.org/wiki/File:Clupea_harengus_Atlantic.jpg");
  // Three pictures for the cod family; a drawing says so; public domain has no license link.
  const cod = photosHtml(SPECIES.find((sp) => sp.id === "codfamily"));
  assert.equal((cod.match(/<figure class="ltf-photo">/g) || []).length, 3);
  assert.match(cod, /<b>Silver hake<\/b> \(drawing\)\. Goode and Bean, 1896, public domain/);
  assert.match(cod, /loading="lazy"/);
  assert.match(cod, /href="https:\/\/creativecommons.org\/licenses\/by\/3.0\/"/);
  // The notes open with the pictures, before the numbers.
  const open = drawTable({ measure: "kcal", view: "amount" }, 0, new Set(["urchins"]));
  const row = open.slice(open.indexOf('id="ltf-d-urchins"'));
  assert.ok(row.indexOf('class="ltf-photos"') < row.indexOf('class="ltf-profile"'));
  assert.match(row, /alt="Green sea urchin"/);
});

test("targets: tap a number to mark it green; picks are kept tidy and survive sorting", () => {
  // Saved picks are cleaned: unknown species, bad seasons and repeats are dropped.
  assert.deepEqual(cleanPicks({ herring: [4, 4, 3, 9, -1, "2"], nosuch: [1], urchins: [] }), { herring: [3, 4] });
  assert.deepEqual(cleanPicks(null), {});
  let picks = togglePick({}, "herring", 4);
  picks = togglePick(picks, "urchins", 0);
  picks = togglePick(picks, "herring", 3);
  assert.deepEqual(picks, { herring: [3, 4], urchins: [0] });
  assert.equal(pickCount(picks), 3);
  assert.equal(pickText(picks), "3 targets picked");
  assert.equal(pickText(togglePick({}, "herring", 4)), "1 target picked");
  assert.equal(pickText({}), "No targets picked yet");
  picks = togglePick(picks, "urchins", 0);
  assert.deepEqual(picks, { herring: [3, 4] }, "tapping again unmarks, and an empty species is dropped");
  assert.ok(isPicked(picks, "herring", 4) && !isPicked(picks, "herring", 0));
  // Every number is a toggle; picked cells carry is-picked and aria-pressed, whatever season sorts the table.
  for (const season of [0, 4]) {
    const tbl = drawTable({ measure: "kcal", view: "amount", picks }, season);
    assert.equal((tbl.match(/class="ltf-pick"/g) || []).length, SPECIES.length * 6);
    assert.equal((tbl.match(/aria-pressed="true" title="Unmark/g) || []).length, 2);
    assert.match(tbl, /<td class="ltf-pickcell[^"]*is-picked"><button type="button" class="ltf-pick" data-pick="herring" data-b="4" aria-pressed="true"/);
    assert.match(tbl, /data-pick="herring" data-b="0" aria-pressed="false" title="Mark herring as a target in January–February"/);
  }
  // Picks show in every view, pounds and percents too.
  const pct = drawTable({ measure: "lb", view: "col", picks }, 0);
  assert.match(pct, /is-picked"><button type="button" class="ltf-pick" data-pick="herring" data-b="3"/);
  // No picks: nothing is green.
  assert.ok(!drawTable({ measure: "kcal", view: "amount" }, 0).includes("is-picked"));
});

test("netting: only species you can net with a target season, every season shown, totals of the targets", () => {
  // Every net species exists, and none of them is a trap or hand species.
  const ids = new Set(SPECIES.map((sp) => sp.id));
  for (const id of Object.keys(NET_GEAR)) assert.ok(ids.has(id), `${id} is a species`);
  for (const id of ["lobster", "greencrabs", "whelks", "urchins", "shellfish", "scallops", "periwinkles", "cucumbers"]) assert.ok(!NET_GEAR[id], `${id} isn't netted`);
  // Brett's targets from the screenshot (27 Nov 2026).
  const picks = cleanPicks({
    urchins: [0, 1, 2, 3, 4, 5], herring: [2, 3, 4, 5], shellfish: [0, 1, 2, 3, 4, 5], scallops: [0, 1, 2, 3, 4, 5],
    periwinkles: [0, 1, 2, 3, 4, 5], mackerel: [2, 3, 4], greencrabs: [2, 3, 4, 5], alewives: [2], lobster: [1, 2, 3, 4, 5],
  });
  const rows = netRows(picks);
  assert.deepEqual(rows.map((sp) => sp.id).sort(), ["alewives", "herring", "mackerel"]);
  assert.deepEqual(netRows({}), []);
  // The table shows those rows only, all six seasons, the targets green, the net under each name.
  const tbl = drawTable({ measure: "kcal", view: "amount", picks }, 4, new Set(["herring"]), SPECIES, SEASONS, { rows, idPrefix: "ltn-d-", sub: NET_GEAR, foot: "targets" });
  assert.equal((tbl.match(/class="ltf-tbl-row/g) || []).length, 3);
  assert.equal((tbl.match(/class="ltf-pick"/g) || []).length, 3 * 6);
  assert.equal((tbl.match(/is-picked"/g) || []).length, 4 + 3 + 1);
  assert.ok(!/data-pick="(lobster|urchins|greencrabs)"/.test(tbl));
  assert.match(tbl, /<span class="ltf-sp-sub">Gill net, 2¾ in<\/span>/);
  assert.match(tbl, /id="ltn-d-herring"(?! hidden)/);
  assert.ok(!tbl.includes('id="ltf-d-'), "the notes rows use the Netting ids");
  // Herring first when sorted by Sep–Oct.
  assert.ok(tbl.indexOf('data-pick="herring"') < tbl.indexOf('data-pick="mackerel"'));
  // The foot adds up only the target cells: May–Jun herring 130 + mackerel 108 + alewives 47 = 285.
  const sum = (b) => ["herring", "mackerel", "alewives"].reduce((s, id) => s + (isPicked(picks, id, b) ? SPECIES.find((sp) => sp.id === id).kcal[b] : 0), 0);
  assert.equal(targetTotal(rows, picks, "kcal", 2), sum(2));
  assert.equal(millions(sum(2)), "285");
  assert.equal(targetTotal(rows, picks, "kcal", 0), 0);
  assert.match(tbl, /Your netting targets<\/th><td>–<\/td><td>–<\/td><td>285<\/td><td>907<\/td><td class="is-on">1,842<\/td><td>177<\/td>/);
  assert.match(tbl, /Active adults fed a year, if all were caught/);
  // % of season is still the share of the whole bay's season, as on the Fishing tab.
  const col = drawTable({ measure: "kcal", view: "col", picks }, 4, new Set(), SPECIES, SEASONS, { rows, idPrefix: "ltn-d-", sub: NET_GEAR, foot: "targets" });
  const full = drawTable({ measure: "kcal", view: "col", picks }, 4);
  const herringCells = (h) => h.match(/data-pick="herring" data-b="\d" aria-pressed="\w+" title="[^"]+">([^<]+)</g).join("|");
  assert.equal(herringCells(col), herringCells(full));
  assert.ok(!col.includes("<tfoot>"), "no bay-wide totals under a cut-down table");
  // The page itself: words, the empty message and its own radio names.
  const page = renderNetting();
  assert.match(page, /id="ltn-heading"[^>]*>Netting</);
  assert.match(page, /name="ltn-view"/);
  assert.ok(!page.includes('name="ltf-'));
  assert.match(NET_PAGE.empty, /herring, mackerel, alewives/);
  assert.match(page, /Nets and traps page/);
});

test("netting findings: a collapsed section per species in the table, titled with its name and netting", () => {
  // Every species you can net has a findings list, and nothing else does.
  assert.deepEqual(Object.keys(NET_FINDINGS).sort(), Object.keys(NET_GEAR).sort());
  const rows = netRows({ herring: [3], mackerel: [3], alewives: [2], lobster: [3] });
  const html = drawFindings(rows);
  assert.equal((html.match(/<details class="ltm-notes ltn-findings"/g) || []).length, 3);
  assert.ok(!html.includes(" open"), "sections start closed");
  assert.match(html, /<summary>Atlantic herring netting<\/summary>/);
  assert.match(html, /<summary>Atlantic mackerel netting<\/summary>/);
  assert.match(html, /<summary>Alewives netting<\/summary>/);
  assert.ok(html.indexOf("Atlantic herring netting") < html.indexOf("Alewives netting"), "in the species list's order");
  // Empty for now: each says so. Findings, once added, are escaped paragraphs.
  assert.equal((html.match(/No findings yet\./g) || []).length, 3);
  const filled = drawFindings(rows.slice(0, 1), { herring: ["Cast net <b>"] });
  assert.match(filled, /<p>Cast net &lt;b&gt;<\/p>/);
  assert.ok(!filled.includes("No findings yet"));
  assert.equal(drawFindings([]), "");
  // The page has a place for them under the table, before the notes.
  const page = renderNetting();
  assert.ok(page.indexOf("data-table") < page.indexOf("data-findings") && page.indexOf("data-findings") < page.indexOf("Not shown here"));
});
