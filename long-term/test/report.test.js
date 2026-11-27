// The paper copy: js/report.js (the blocks and the printout) and js/report-pdf.js (the PDF).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { render } from "../app.js";
import { HOUSES } from "../data/houses.js";
import { SEASONS, SPECIES } from "../data/fishing.js";
import { buildReport, fishingBlocks, reportHtml, htmlToBlocks, inlineRuns, mapSvg, ringSvg, tint, keepsWithNext, README_IN_REPORT } from "../js/report.js";
import { reportPdf } from "../js/report-pdf.js";

const geo = JSON.parse(readFileSync(new URL("../data/geo.json", import.meta.url), "utf8"));
const index = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
const readme = JSON.parse(/<script type="application\/json" id="rmpages">([\s\S]*?)<\/script>/.exec(index)[1]);
const blocks = buildReport({ geo, today: "2026-11-26", dateText: "Nov 26, 2026", readme });
const html = reportHtml(blocks);

test("both pages have the Short Term buttons, and a hidden box for the printout", () => {
  const page = render();
  assert.equal((page.match(/data-lt-print/g) || []).length, 2);
  assert.equal((page.match(/data-lt-pdf/g) || []).length, 2);
  assert.match(page, /class="report-foot lt-paper-foot"/);
  assert.match(page, /<div class="lt-print"><\/div>/);
  assert.doesNotMatch(page, /href="#/, "the frame treats any other hash as the Short Term tab");
});

test("the report has every part, in order, with the README pages from the site", () => {
  for (const id of README_IN_REPORT) assert.ok(readme.find((p) => p.id === id), `README page ${id} is published`);
  const parts = blocks.filter((b) => b.t === "part").map((b) => b.text);
  assert.deepEqual(parts, ["Why Cobscook Bay", "The Cobscook Bay map", "Houses for sale", "Solar panels", "Off-grid checklist", "Cobscook Bay fishing by season", "Nov–Dec food shortage", "Species extinction", "Pumping gas out of a car"]);
  assert.equal(blocks[0].t, "cover");
  assert.deepEqual(blocks[0].contents, parts);
});

test("every house is in the house list, numbered by distance to the bay", () => {
  const list = blocks.find((b) => b.t === "table" && b.head[0] === "#" && b.head.includes("MLS"));
  assert.equal(list.rows.length, HOUSES.length);
  assert.deepEqual(list.rows.map((r) => r[0]), HOUSES.map((_, i) => String(i + 1)));
  const solar = HOUSES.filter((h) => h.power === "offgrid-solar").length;
  assert.equal(blocks.filter((b) => b.t === "card").length, solar);
});

test("the fishing part: calories and pounds by season, a ring per season, and every species scored", () => {
  const rings = blocks.find((b) => b.t === "rings");
  assert.equal(rings.items.length, SEASONS.length);
  assert.equal(rings.items[4].sub, "A year's food for about 2,430 active adults");
  const cal = blocks.find((b) => b.t === "table" && b.head.at(-1) === "Sure (1–5)");
  assert.equal(cal.rows.length, SPECIES.length + 2);
  assert.deepEqual(cal.rows.at(-2).slice(1, 7).map((c) => c.text), ["958", "986", "1,084", "1,698", "2,661", "1,045"]);
  assert.deepEqual(cal.rows.at(-1).slice(1, 7).map((c) => c.text), ["870", "900", "990", "1,550", "2,430", "950"]);
  assert.ok(keepsWithNext({ t: "h3" }, cal), "the calories table stays with its heading");
  const lb = blocks.find((b) => b.t === "table" && b.head.at(-1) === "Where the number comes from");
  assert.equal(lb.rows.length, SPECIES.length);
  const order = blocks.find((b) => b.t === "table" && b.head[2] === "Order");
  assert.equal(order.rows.length, SEASONS.length);
  assert.ok(blocks.find((b) => b.t === "h3" && b.text === "Herring: three ways to measure it"));
  assert.ok(blocks.find((b) => b.t === "h3" && b.text === "Herring caught in Cobscook, 1947–58"));
  const notes = blocks.find((b) => b.t === "table" && b.head[1] === "Best season");
  assert.equal(notes.rows.length, SPECIES.length);
  assert.doesNotMatch(JSON.stringify(fishingBlocks()), /One trip|People it could feed|undefined|NaN/);
});

test("the map shows the bands, the bay, every house, and numbers for houses with power", () => {
  const svg = blocks.find((b) => b.t === "svg").svg;
  assert.match(svg, /^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" viewBox="0 0 720 \d+"/);
  assert.equal((svg.match(/<path d="M[^"]*" fill="#[0-9a-f]{6}" fill-rule="evenodd"/g) || []).length, 2 * geo.rings.length + 1);
  assert.equal((svg.match(/stroke="#ffffff" stroke-width="(0.6|1.2)"\/>/g) || []).length, HOUSES.length);
  const powered = HOUSES.filter((h) => h.power !== "none").length;
  assert.equal((svg.match(/font-size="9" font-weight="bold" fill="#(?!ffffff)/g) || []).length, powered);
  assert.doesNotMatch(svg, /NaN|undefined/);
  const small = mapSvg(geo, [], { width: 300 });
  assert.match(small, /width="300"/);
});

test("ring charts are drawn with filled arcs, so they print and go in the PDF", () => {
  const svg = ringSvg([{ share: 60, color: "#123456" }, { share: 40, color: "#abcdef" }], "63k", "lb of meat");
  assert.equal((svg.match(/<path /g) || []).length, 2);
  assert.doesNotMatch(svg, /dasharray|class=/);
  assert.equal((ringSvg([{ share: 100, color: "#123456" }], "1", "x").match(/<path /g) || []).length, 2);
  assert.equal(tint("#1f5f7a", 0), "#ffffff");
  assert.equal(tint("#1f5f7a", 1), "#1f5f7a");
});

test("README HTML becomes blocks: paragraphs, headings, lists, tables and links", () => {
  const b = htmlToBlocks('<p>One <b>bold</b> &amp; <a href="https://x.org">link</a>.</p><h3>Head</h3><ul><li>A</li><li><i>B</i></li></ul><table><tr><th>K</th><td>V</td></tr></table>');
  assert.deepEqual(b.map((x) => x.t), ["p", "h3", "ul", "table"]);
  assert.deepEqual(b[0].runs.map((r) => r.text), ["One ", "bold", " & ", "link", "."]);
  assert.equal(b[0].runs[3].link, "https://x.org");
  assert.equal(b[2].items[1][0].i, true);
  assert.deepEqual(b[3].head, ["", ""]);
  assert.deepEqual(b[3].rows[0], [{ text: "K", b: true }, "V"]);
  assert.deepEqual(inlineRuns("  a  b "), [{ text: "a b", b: false, i: false, link: null }]);
});

test("the printout is plain HTML with nothing missing", () => {
  assert.doesNotMatch(html, /undefined|NaN|\[object Object\]/);
  assert.equal((html.match(/<h2 class="ltp-part">/g) || []).length, blocks.filter((b) => b.t === "part").length);
  assert.equal((html.match(/<section class="ltp-card">/g) || []).length, 3);
  assert.match(html, /<colgroup>/);
  assert.ok((html.match(/<div class="ltp-keep">/g) || []).length >= SEASONS.length, "short tables stay with their headings");
  assert.ok(keepsWithNext({ t: "h3" }, { t: "table", rows: [[]] }));
  assert.ok(!keepsWithNext({ t: "h3" }, { t: "table", rows: Array(40).fill([]) }));
});

test("the PDF: letter pages, a new page for each part, and the site's colors", () => {
  const doc = reportPdf(blocks, { date: "Nov 26, 2026" });
  assert.equal(doc.pageSize, "LETTER");
  const starts = doc.content.filter((n) => n.pageBreak === "before");
  const parts = blocks.filter((b) => b.t === "part").length;
  assert.equal(starts.length, parts);
  assert.deepEqual(starts.map((n) => n.id), Array.from({ length: parts }, (_, i) => `part-${i + 1}`));
  const svgs = JSON.stringify(doc.content).match(/"svg":"<svg/g) || [];
  assert.equal(svgs.length, 1 + SEASONS.length);
  assert.equal(doc.footer(1, 31), null);
  assert.match(JSON.stringify(doc.footer(2, 31)), /Page 2 of 31/);
  assert.doesNotMatch(JSON.stringify(doc.content), /⅓|⅔|undefined/);
});
