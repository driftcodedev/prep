import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
import { SPECIES_COLORS, PROFILES, CONFIDENCE, FISH_SOURCES } from "../data/fishing-notes.js";
import {
  counted, seasonTotal, adultsFed, fedText, seasonRanking, seasonRows, rankingText, donutSlices, herringCatch, meatText,
  round2, millions, thousands, caloriesText, poundsText, pct, drawSeason, drawTable, renderFishing, seasonOfDate,
} from "../js/fishing.js";

test("the tab has a Map and a Fishing view, Map first", () => {
  const html = render(PAGE, { household: null });
  assert.deepEqual(VIEWS.map((v) => v[0]), ["map", "fish"]);
  assert.match(html, /role="tablist"/);
  assert.match(html, /id="lt-panel-map"[^>]*data-panel="map"/);
  assert.match(html, /id="lt-panel-fish"[^>]*data-panel="fish" hidden/);
  assert.match(html, /Cobscook Bay fishing by season/);
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
      if (v !== null) assert.ok(Math.abs(sp.kcal[b] - v * sp.meatShare * sp.kcalPerLb) <= 1000, `${sp.id} season ${b} calories`);
    });
    // No count means no numbers at all and the lowest score: blank, not guessed.
    if (!counted(sp)) assert.equal(sp.confidence, 1, `${sp.id} has no count`);
  }
  assert.deepEqual(SPECIES.filter((sp) => !counted(sp)).map((sp) => sp.id), ["urchins", "cucumbers", "whelks", "pollock", "elvers"]);
});

test("the scores agreed for each species", () => {
  const score = Object.fromEntries(SPECIES.map((sp) => [sp.id, sp.confidence]));
  assert.deepEqual(score, {
    herring: 3, mackerel: 2, periwinkles: 3, shellfish: 3, scallops: 3, alewives: 4, flounder: 3, codfamily: 3,
    greencrabs: 2, lobster: 3, sculpin: 2, smelt: 3, silverside: 2, urchins: 1, cucumbers: 1, whelks: 1, pollock: 1, elvers: 1,
  });
});

test("season totals match the sources-check doc", () => {
  const millionsBySeason = [0, 1, 2, 3, 4, 5].map((b) => Math.round(seasonTotal(SPECIES, "kcal", b) / 1e6));
  assert.deepEqual(millionsBySeason, [263, 288, 672, 1296, 2210, 502]);
  const fed = [0, 1, 2, 3, 4, 5].map((b) => fedText(seasonTotal(SPECIES, "kcal", b)));
  assert.deepEqual(fed, ["240", "260", "610", "1,180", "2,020", "460"]);
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
  assert.deepEqual(flounder.lb.map((v) => Math.round(v / 1000)), [0, 0, 414, 236, 99, 120]);
  const lobster = SPECIES.find((sp) => sp.id === "lobster");
  // Lobster: May–June is Maine's spring survey scaled to local water by the fall comparison.
  assert.deepEqual(lobster.lb.map((v) => (v === null ? null : Math.round(v / 1000))), [null, null, 234, 201, 345, null]);
});

test("each season's ranking adds to 100% and matches the doc's order", () => {
  for (let b = 0; b < 6; b++) {
    const r = seasonRanking(SPECIES, "kcal", b);
    assert.ok(Math.abs(r.reduce((s, x) => s + x.share, 0) - 100) < 1e-6, `season ${b}`);
    assert.ok(r.every((x, i) => i === 0 || r[i - 1].value >= x.value), `season ${b} order`);
  }
  assert.equal(rankingText(SPECIES, 0), "Clams and mussels 41%, periwinkles 33%, scallops 18%, sculpin 5%, smelt 2%, the rest under 1%");
  assert.equal(rankingText(SPECIES, 4), "Herring 70%, mackerel 14%, clams and mussels 6%, periwinkles 5%, scallops 2%, lobster 1%, the rest under 1%");
  assert.equal(seasonRanking(SPECIES, "kcal", 5)[0].sp.id, "herring");
});

test("every species shows in every season: ranked, none counted, not counted this season, or no count", () => {
  for (let b = 0; b < 6; b++) {
    const rows = seasonRows(SPECIES, "kcal", b);
    assert.equal(rows.length, SPECIES.length, `season ${b}`);
    assert.equal(new Set(rows.map((x) => x.sp.id)).size, SPECIES.length);
  }
  const jan = seasonRows(SPECIES, "kcal", 0);
  assert.equal(jan.find((x) => x.sp.id === "herring").status, "none");
  assert.equal(jan.find((x) => x.sp.id === "lobster").status, "season");
  assert.equal(jan.find((x) => x.sp.id === "urchins").status, "nocount");
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

test("fishing drawings: a season with every species, and a table of every season", () => {
  const det = drawSeason({ measure: "kcal" }, 4);
  assert.match(det, /September–October/);
  assert.match(det, /2\.2 billion calories/);
  assert.match(det, /about <b>2,020 active adults<\/b>/);
  assert.match(det, /Biggest share: Atlantic herring, <b>70%<\/b>/);
  assert.equal((det.match(/<details class="ltf-row/g) || []).length, SPECIES.length);
  assert.match(det, /no count yet/);
  assert.match(det, /data-season="4" data-local aria-pressed="true"/);
  const tbl = drawTable({ measure: "kcal" }, 4);
  assert.equal((tbl.match(/<tr><th scope="row"><span class="ltf-swatch"/g) || []).length, SPECIES.length);
  assert.match(tbl, /Active adults fed a year/);
  assert.match(tbl, />2,210</);
  const lb = drawTable({ measure: "lb" }, 4);
  assert.match(lb, /Sea scallops \(meat\)/);
  assert.doesNotMatch(lb, /<tfoot>/);
  assert.doesNotMatch(det + tbl + lb, /undefined|NaN/);
  const page = renderFishing();
  assert.match(page, /name="ltf-measure"/);
  assert.match(page, /Herring: three ways to measure it/);
  assert.match(page, /Herring caught in Cobscook, 1947–58/);
  assert.equal((page.match(/<li><a href=/g) || []).length, FISH_SOURCES.length);
  assert.doesNotMatch(page, /One trip|a trip/);
});
