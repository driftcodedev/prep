// The Salting view: js/salting.js (the calculator math, the page, the paper copy) and data/salting.js.
import { test } from "node:test";
import assert from "node:assert/strict";
import { METHODS, HEAT, BAY, SALT_SECTIONS, SALT_SOURCES, SALT_GEAR, GAL_PER_CORD, GAS_GAL_PER_HR, CUPS_PER_LB } from "../data/salting.js";
import {
  saltPlan, cleanInput, galPerLb, byHandLines, num, hoursText, hoursBig, daysText, cordText, gasText, cupsText,
  renderSalting, resultsHtml, saltingBlocks, FORMULAS, rateRows, DEFAULT_INPUT,
} from "../js/salting.js";

const close = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg}: ${a} ≠ ${b}`);

test("every method has a rate, words and a by-hand rule; every heat has a rate or is the custom one", () => {
  const ids = new Set();
  for (const m of METHODS) {
    assert.ok(!ids.has(m.id), `${m.id} is unique`);
    ids.add(m.id);
    assert.ok(m.rate > 0 && m.rate < 1, `${m.id} rate`);
    for (const k of ["group", "name", "short", "per100", "byHand", "days", "keeps"]) assert.ok(m[k], `${m.id}.${k}`);
  }
  assert.deepEqual(METHODS.map((m) => m.id), ["heavy", "heavyPickle", "light", "lightPickle", "smoke", "cure"]);
  for (const h of HEAT) assert.ok(h.id === "own" ? h.gph === null : h.gph > 0, `${h.id} rate`);
});

test("the rates match their sources (DFO salt cod guide, PNW 238, Virginia Tech)", () => {
  const rate = (id) => METHODS.find((m) => m.id === id).rate;
  assert.equal(rate("heavy"), 0.55);      // at least 55 lb per 100 lb split fish, kench
  assert.equal(rate("heavyPickle"), 0.40); // about 40 lb, pickled
  assert.equal(rate("light"), 0.15);      // 12 to 15 lb, kench (the top of the range)
  assert.equal(rate("lightPickle"), 0.10); // about 10 lb, pickled
  // 1 cup of fine salt is about ⅔ lb (1 lb ≈ 1½ cups), for every 2 to 3 lb of fish.
  assert.ok(Math.abs(rate("smoke") - (1 / CUPS_PER_LB) / 2.5) < 0.01, "1 cup of salt per 2½ lb of fish");
  assert.equal(rate("cure"), 0.08);       // 8 lb per 100 lb meat
});

test("100 lb of split fish, heavy salted, on a 2-pan wood fire", () => {
  const p = saltPlan({ lb: 100, method: "heavy", heat: "wood2" });
  close(p.salt, 55, "salt");
  close(p.cups, 82.5, "cups");
  close(p.make, 55, "salt to make");
  close(p.bayGal, 275, "bay water: 5 gallons a pound");
  close(p.buckets, 55, "one 5-gallon bucket per pound");
  close(p.all.hours, 275 / 4, "hours to boil it all");
  close(p.all.cords, 275 / GAL_PER_CORD, "cords");
  close(p.sun.gal, 55, "sun first leaves a fifth");
  close(p.sun.hours, 55 / 4, "hours with the sun first");
  close(p.sunSqft, 440, "sun pans");
  assert.equal(p.all.gas, null);
});

test("salt on hand, saltiness, gasoline and the brine's fresh water", () => {
  const p = saltPlan({ lb: 40, method: "smoke", heat: "gas", have: 3, ppt: 28 });
  close(p.make, 40 * 0.26 - 3, "only the rest is made");
  close(p.bayGal, p.make * 5 * 31 / 28, "less salty water takes more gallons");
  close(p.all.hours, p.bayGal / 0.5, "gas stove boils about half a gallon an hour");
  close(p.all.gas, p.all.hours * GAS_GAL_PER_HR, "gasoline");
  close(p.brineGal, (40 * 7) / 2.5 / 16, "7 cups of water per 2½ lb of fish");
  assert.equal(p.all.cords, null);
  assert.equal(saltPlan({ lb: 10, have: 50 }).make, 0, "never below zero");
  close(galPerLb(31), 5, "5 gallons a pound at 31 ppt");
  assert.equal(BAY.ppt, 31);
});

test("bad or missing input falls back to safe values", () => {
  assert.deepEqual(cleanInput({}), cleanInput(DEFAULT_INPUT));
  const c = cleanInput({ lb: "abc", method: "nope", heat: "x", ppt: 400, have: -5, own: "" });
  assert.equal(c.lb, DEFAULT_INPUT.lb);
  assert.equal(c.method, "heavy");
  assert.equal(c.heat, "wood2");
  assert.equal(c.ppt, 31);
  assert.equal(c.have, 0);
  assert.equal(cleanInput({ lb: "1,250" }).lb, 1250);
  const own = saltPlan({ lb: 20, heat: "own", own: 0 });
  assert.equal(own.all.hours, null, "no rate, no hours");
  assert.match(byHandLines(own).join(" "), /Enter your boil-off rate/);
  close(saltPlan({ lb: 20, heat: "own", own: 2 }).all.hours, 20 * 0.55 * 5 / 2, "own rate");
});

test("numbers read plainly", () => {
  assert.equal(num(55.00000000000001), "55");
  assert.equal(num(68.75), "68.8");
  assert.equal(num(1234.4), "1,234");
  assert.equal(num(0.06), "0.06");
  assert.equal(hoursBig(0.3), "20 minutes");
  assert.equal(hoursBig(1), "1 hour");
  assert.equal(daysText(68.75), "About 9 days of 8-hour boils");
  assert.equal(daysText(10), "");
  assert.match(hoursText(68.75), /68\.8 hours \(about 9 days/);
  assert.equal(cordText(2.3), "2.3 cords");
  assert.match(cordText(0.05), /0\.05 cord \(a stack 4 ft high and 4 ft deep, 5 inches long\)/);
  assert.match(gasText(0.32), /0\.3 gallon of gasoline \(about 1 quart\)/);
  assert.equal(cupsText(0.15), "2.4 tablespoons");
});

test("the by-hand lines show the same numbers as the calculator", () => {
  const p = saltPlan({ lb: 100, method: "heavy", heat: "wood2", have: 10 });
  const lines = byHandLines(p).join("\n");
  assert.match(lines, /100 lb × 0\.55 = 55 lb/);
  assert.match(lines, /55 − 10 you have = 45 lb/);
  assert.match(lines, /45 lb × 5 = 225 gallons \(45 five-gallon buckets\)/);
  assert.match(lines, /225 gallons ÷ 4 an hour = 56\.3 hours/);
  assert.match(lines, /225 ÷ 5 = 45 gallons left to boil/);
  assert.match(lines, /225 ÷ 400 = 0\.6 cord/);
  assert.match(lines, /225 gallons × 1\.6 = 360 square feet/);
  const salty = byHandLines(saltPlan({ lb: 10, ppt: 25 })).join("\n");
  assert.match(salty, /× 5 × 31 ÷ 25/);
});

test("the page: calculator inputs, every method and heat, the formulas and every guide section", () => {
  const html = renderSalting();
  assert.match(html, /id="lts-heading"[^>]*>Salting</);
  for (const name of ["lb", "have", "own", "ppt"]) assert.match(html, new RegExp(`name="${name}"`));
  assert.equal((html.match(/name="lts-method"/g) || []).length, METHODS.length);
  assert.equal((html.match(/name="lts-heat"/g) || []).length, HEAT.length);
  assert.match(html, /value="heavy" checked/);
  assert.match(html, /value="wood2" checked/);
  assert.match(html, /data-own hidden/, "the custom rate shows only when picked");
  assert.equal((html.match(/<details class="ltm-notes lts-sec"/g) || []).length, SALT_SECTIONS.length + 1);
  for (const s of SALT_SECTIONS) assert.ok(html.includes(`id="lts-sec-${s.id}"`), s.id);
  assert.equal((html.match(/<li>/g) || []).length >= FORMULAS.length, true);
  for (const g of SALT_GEAR) assert.ok(html.includes(g.url), g.item);
  for (const [, url] of SALT_SOURCES) assert.match(url, /^https:\/\//);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length, "ids are unique");
  assert.ok(ids.every((id) => id.startsWith("lts-")), "ids start lts-");
  // Every label's "for" points at an input.
  for (const m of html.matchAll(/<label[^>]*for="([^"]+)"/g)) assert.ok(ids.includes(m[1]), m[1]);
  assert.doesNotMatch(html, /undefined|NaN/);
  assert.match(renderSalting({ heat: "own", ppt: 28 }), /data-own>/);
  assert.match(renderSalting({ heat: "own", ppt: 28 }), /<details class="lts-more" open>/);
});

test("the results: salt, bay water, both boiling choices and the by-hand lines", () => {
  const html = resultsHtml(saltPlan({ lb: 50, method: "heavy", heat: "gas" }));
  assert.match(html, /27\.5 lb/);
  assert.match(html, /137.5 gallons/);
  assert.match(html, /Boil it all/);
  assert.match(html, /Sun first, then boil the last fifth/);
  assert.match(html, /gallons of gasoline/);
  assert.match(html, /Work it out by hand/);
  assert.doesNotMatch(html, /undefined|NaN/);
});

test("the paper copy: formulas, the rate table, a worked example, a worksheet and every section", () => {
  const blocks = saltingBlocks();
  assert.deepEqual(blocks[0], { t: "part", text: "Salting fish and game" });
  const h3s = blocks.filter((b) => b.t === "h3").map((b) => b.text);
  for (const h of ["Work it out by hand", "Salt for each way of salting", "Example: 100 lb of split fish, heavy salted", "Worksheet", "Sources"]) assert.ok(h3s.includes(h), h);
  for (const s of SALT_SECTIONS) assert.ok(h3s.includes(s.title), s.title);
  const rates = blocks.find((b) => b.t === "table" && b.head[0] === "Way of salting");
  assert.equal(rates.rows.length, METHODS.length);
  assert.deepEqual(rateRows().map((r) => r[1]), METHODS.map((m) => m.per100));
  const example = blocks.find((b) => b.t === "table" && b.head[0] === "Boiled on");
  assert.equal(example.rows.length, HEAT.length - 1);
  assert.match(example.rows[0][1], /68\.8 hours/);
  const sheet = blocks.find((b) => b.t === "table" && b.head[1] === "Your numbers");
  assert.ok(sheet.rows.length >= 10);
  // The PDF font (Roboto) has no arrows or thirds glyph left unhandled.
  const text = JSON.stringify(blocks);
  assert.doesNotMatch(text, /→/);
});
