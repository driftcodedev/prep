// Tidal currents and flats: data/currents.json (tools/build_currents.py), js/currents.js, the map
// control, and the currents section of the paper copy.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { render, renderCurrentsControls } from "../app.js";
import { CURRENTS } from "../data/plan.js";
import { WATER_NAMES, SPOTS } from "../data/places.js";
import {
  CURRENT_BANDS, bandOf, tideLabel, tideOrder, hoursAfterHigh, compass, flowAt, peakAt, driesAt, nearestPoint, areaStats,
  describeSpot, slackText,
} from "../js/currents.js";
import { buildReport, currentsBlocks, reportHtml } from "../js/report.js";
import { reportPdf } from "../js/report-pdf.js";

const read = (f) => readFileSync(new URL(`../data/${f}`, import.meta.url));
const data = JSON.parse(read("currents.json"));
const pngSize = (buf) => [buf.readUInt32BE(16), buf.readUInt32BE(20)];

test("currents.json has 12 tide patterns for every point, on the map's water", () => {
  assert.equal(data.points.length, data.u.length);
  assert.equal(data.points.length, data.v.length);
  assert.ok(data.points.length > 1000);
  const [[lat0, lon0], [lat1, lon1]] = data.bounds;
  for (const [i, [lon, lat, level, mask]] of data.points.entries()) {
    assert.ok(lon >= lon0 && lon <= lon1 && lat >= lat0 && lat <= lat1, `point ${i} in bounds`);
    assert.ok([0, 1, 2].includes(level));
    assert.ok(mask >= 0 && mask < 4096);
    assert.equal(data.u[i].length, 12);
    assert.equal(data.v[i].length, 12);
  }
  assert.ok(data.points.some((p) => p[2] === 0) && data.points.some((p) => p[2] === 2));
  assert.ok(data.hwPattern >= 0 && data.hwPattern < 12);
  assert.equal(data.lwPattern, Math.round(data.hwPattern + 6) % 12);
});

test("the pictures match the data's bounds in Web Mercator", () => {
  const merc = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
  const [[lat0, lon0], [lat1, lon1]] = data.bounds;
  const expect = (merc(lat1) - merc(lat0)) / (((lon1 - lon0) * Math.PI) / 180);
  for (const f of ["currents-peak.png", "currents-flats.png"]) {
    const [w, h] = pngSize(read(f));
    assert.ok(Math.abs(h / w - expect) < 0.002, `${f} is ${w}x${h}`);
  }
  assert.ok(read("currents-print.png").length > 10000);
});

test("calm inner bays, fast Falls and main channel", () => {
  const area = (name) => data.areas.find((a) => a.name === name);
  assert.ok(area("Dennys Bay").fastest < 1.5);
  assert.ok(area("East Bay").fastest < 1);
  assert.ok(area("Reversing Falls (Cobscook Falls)").fastest > 4);
  assert.ok(area("Cobscook Bay").fastest > 3);
  for (const name of CURRENTS.reportAreas) assert.ok(area(name), `area ${name} is in currents.json`);
  for (const name of CURRENTS.reportAreas) assert.ok([...WATER_NAMES, ...SPOTS].some((w) => w.name === name), `${name} is a place`);
});

test("the tide clock: hour labels around high and low tide at Eastport", () => {
  const order = tideOrder(data);
  assert.equal(order.length, 12);
  assert.deepEqual([...order].sort((a, b) => a - b), [...Array(12).keys()]);
  const labels = order.map((p) => tideLabel(p, data));
  assert.equal(labels[0], "½ hour after high tide");
  assert.ok(labels.includes("½ hour before low tide"));
  assert.ok(labels.includes("½ hour after low tide"));
  assert.ok(labels.every((l) => /tide$/.test(l)));
  assert.ok(Math.abs(hoursAfterHigh(data.lwPattern, data) - 6.21) < 0.6);
});

test("speeds, directions and bands", () => {
  assert.equal(compass(0, 1), "north");
  assert.equal(compass(1, 0), "east");
  assert.equal(compass(-1, -1), "southwest");
  assert.equal(bandOf(0.2), 0);
  assert.equal(bandOf(0.5), 1);
  assert.equal(bandOf(2.5), 3);
  assert.equal(bandOf(9), CURRENT_BANDS.length - 1);
  const i = data.points.findIndex((p) => p[3] > 0);
  const p = [...Array(12).keys()].find((k) => (data.points[i][3] >> k) & 1);
  assert.equal(flowAt(data, i, p), null, "dry spots have no current");
  assert.ok(data.points.some((_, k) => driesAt(data, k)), "some spots dry at low tide");
  const falls = SPOTS.find((s) => s.kind === "danger");
  const near = nearestPoint(data, falls.lat, falls.lon);
  assert.ok(near >= 0);
  assert.ok(peakAt(data, near) > 0);
  assert.equal(nearestPoint(data, 44.70, -67.40), -1, "nothing out past the model");
});

test("tapping the water describes the current there", () => {
  const d = WATER_NAMES.find((w) => w.name === "Dennys Bay");
  const hour = describeSpot(data, d.lat, d.lon, { mode: "hour", pattern: tideOrder(data)[3] });
  assert.match(hour[0], /at Eastport: (dry here|[\d.]+ knots, flowing \w+)\./);
  assert.ok(hour.some((l) => /Strongest current here/.test(l)));
  const s = areaStats(data, d.lat, d.lon);
  assert.ok(s.typical <= s.fastest);
  assert.match(slackText(data, s.slack), /after|before|tide/);
  assert.deepEqual(describeSpot(data, 44.70, -67.40), []);
});

test("the map has the currents control: three modes, an hour slider, and the flats", () => {
  const html = renderCurrentsControls();
  assert.equal((html.match(/name="ltm-cur"/g) || []).length, 3);
  assert.match(html, /value="off" checked/);
  assert.match(html, /type="range"[^>]*min="0" max="11"/);
  assert.match(html, /data-tide hidden/);
  assert.match(html, /data-flats/);
  assert.ok(render().includes('class="ltm-group ltm-cur"'));
});

test("the paper copy has the currents map and the places table", () => {
  const image = `data:image/png;base64,${read("currents-print.png").toString("base64")}`;
  const blocks = currentsBlocks(data, image);
  assert.equal(blocks[0].text, CURRENTS.reportHeading);
  const table = blocks.find((b) => b.t === "table");
  assert.equal(table.rows.length, CURRENTS.reportAreas.length);
  assert.ok(table.rows.every((r) => r.length === 4 && / · /.test(r[3])));
  assert.ok(blocks.some((b) => b.t === "img" && b.src.startsWith("data:image/png")));
  const geo = JSON.parse(read("geo.json"));
  const all = buildReport({ geo, today: "2026-11-26", dateText: "Nov 26, 2026", currents: data, currentsImage: image });
  assert.ok(all.some((b) => b.t === "h3" && b.text === CURRENTS.reportHeading));
  assert.match(reportHtml(all), /<img src="data:image\/png;base64,/);
  const doc = reportPdf(all, { date: "Nov 26, 2026" });
  assert.ok(doc.content.some((n) => typeof n.image === "string" && n.image.startsWith("data:image/png")));
  const none = buildReport({ geo, today: "2026-11-26", dateText: "Nov 26, 2026" });
  assert.ok(!none.some((b) => b.t === "h3" && b.text === CURRENTS.reportHeading), "left out when the data didn't load");
});
