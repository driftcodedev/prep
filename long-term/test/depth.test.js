// Water depth: js/depth.js (decoding, tile math, popup lines), the control in app.js and the report part.
import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeDepth, tileAt, depthLines, bandFor, depthTileUrl } from "../js/depth.js";
import { depthBlocks } from "../js/report.js";
import { renderDepthControls } from "../app.js";
import { DEPTH } from "../data/plan.js";

const DATUM = { name: "MLLW", mhwFt: 18.8, mhhwFt: 19.3, station: "Eastport 8410140", navd88AboveMllwM: 3.029 };

test("depth codes decode the same way tools/build_depth.py writes them", () => {
  assert.equal(decodeDepth(0), null, "no data");
  assert.equal(decodeDepth(1), -0.5, "dries half a foot");
  assert.equal(decodeDepth(40), -20, "dries 20 ft");
  assert.equal(decodeDepth(41), 0);
  assert.equal(decodeDepth(87), 23);
  assert.equal(decodeDepth(160), 59.5);
  assert.equal(decodeDepth(161), 60);
  assert.equal(decodeDepth(230), 198);
  assert.equal(decodeDepth(231), 200);
  assert.equal(decodeDepth(255), 440);
  // Every code from 1 up gives a bigger depth than the one before, past the drying codes.
  for (let c = 42; c <= 255; c++) assert.ok(decodeDepth(c) > decodeDepth(c - 1), `code ${c}`);
});

test("tileAt finds the web mercator tile and pixel", () => {
  // Eastport at zoom 14.
  const t = tileAt(44.9046, -66.9829, 14);
  assert.deepEqual([t.x, t.y], [5143, 5899]); // checked with pyproj (EPSG:3857)
  assert.ok(t.px >= 0 && t.px < 256 && t.py >= 0 && t.py < 256);
  const z0 = tileAt(0, 0, 0);
  assert.deepEqual([z0.x, z0.y, z0.px, z0.py], [0, 0, 128, 128]);
  assert.equal(depthTileUrl("data/depth", 15, 1, 2), "data/depth/15/1/2.png");
});

test("popup lines: depth at low and high tide, or how much it dries", () => {
  assert.deepEqual(depthLines(23, DATUM), ["Water depth at low tide: about 23 ft.", "At an average high tide: about 42 ft."]);
  assert.deepEqual(depthLines(3.5, DATUM), ["Water depth at low tide: about 3.5 ft.", "At an average high tide: about 22 ft."]);
  assert.deepEqual(depthLines(-6, DATUM), ["Dries at low tide: about 6 ft above the lowest tides.", "About 13 ft of water here at an average high tide."]);
  assert.deepEqual(depthLines(-19.5, DATUM), ["Dry at an average high tide."]);
  assert.deepEqual(depthLines(null, DATUM), []);
});

test("bandFor picks the band by its upper edge", () => {
  const bands = [{ maxFt: 0, label: "dries" }, { maxFt: 6, label: "0–6" }, { maxFt: 99999, label: "deep" }];
  assert.equal(bandFor(bands, -2).label, "dries");
  assert.equal(bandFor(bands, 0).label, "0–6");
  assert.equal(bandFor(bands, 5.9).label, "0–6");
  assert.equal(bandFor(bands, 300).label, "deep");
});

test("the Water depth control", () => {
  const html = renderDepthControls();
  assert.match(html, /<input type="checkbox" data-depth>/);
  assert.match(html, /data-depth-status/);
  assert.ok(html.includes(DEPTH.checkLabel));
  assert.match(DEPTH.hint, /Not for navigation/);
});

test("the report's depth part: map, place table and the datum note", () => {
  const data = {
    source: "NOAA BlueTopo.", datum: DATUM, stats: { deepestFt: 210.4 },
    areas: [{ name: "Dennys Bay", typicalFt: 23.2, deepestFt: 61, driesShare: 0.31 }, { name: "Sipp Bay", typicalFt: null, deepestFt: 4.5, driesShare: 0.02 }],
  };
  const blocks = depthBlocks(data, "data:image/png;base64,AAAA");
  assert.equal(blocks[0].text, DEPTH.reportHeading);
  assert.equal(blocks.find((b) => b.t === "img").src, "data:image/png;base64,AAAA");
  const table = blocks.find((b) => b.t === "table");
  assert.deepEqual(table.rows[0], ["Dennys Bay", "23", "61", "31%"]);
  assert.deepEqual(table.rows[1], ["Sipp Bay", "dries", "4.5", "–"]);
  const note = blocks.at(-1).runs;
  assert.match(note, /about 19 ft for an average high tide/);
  assert.match(note, /deepest spot in the bay is about 210 ft/);
  assert.equal(depthBlocks({ ...data, areas: [] }).some((b) => b.t === "table"), false);
});
