// The Salting view: a calculator (weight of fish or meat → salt → Cobscook Bay water → hours of
// boiling and fuel), the same math written out by hand, and the guide sections from
// data/salting.js. saltPlan() and the HTML helpers are pure, so the tests run them in Node;
// createSalting() wires up the inputs in the browser. saltingBlocks() gives the paper copy.
//
// The inputs are kept in this browser (localStorage "prep-lt-salt").

import {
  SALT_PAGE, BAY, CUPS_PER_LB, SQFT_PER_GAL, SUN_SHARE, GAL_PER_CORD, GAS_GAL_PER_HR,
  METHODS, HEAT, SALT_SECTIONS, SALT_GEAR, SALT_SOURCES, SALT_CHECKED,
} from "../data/salting.js";
import { esc, niceDate } from "./geo.js";

export const STORE = "prep-lt-salt";
export const DEFAULT_INPUT = { lb: 100, method: "heavy", have: 0, ppt: BAY.ppt, heat: "wood2", own: 2 };

// ---------- the math ----------

const toNum = (v, fallback) => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : fallback;
};

// Anything typed or saved is cleaned here, so a bad value can't break the page.
export function cleanInput(raw = {}) {
  const methodOk = METHODS.some((m) => m.id === raw.method);
  const heatOk = HEAT.some((h) => h.id === raw.heat);
  const ppt = toNum(raw.ppt, BAY.ppt);
  return {
    lb: Math.max(0, Math.min(100000, toNum(raw.lb, DEFAULT_INPUT.lb))),
    method: methodOk ? raw.method : DEFAULT_INPUT.method,
    have: Math.max(0, Math.min(100000, toNum(raw.have, 0))),
    ppt: ppt >= 5 && ppt <= 40 ? ppt : BAY.ppt,
    heat: heatOk ? raw.heat : DEFAULT_INPUT.heat,
    own: Math.max(0, Math.min(100, toNum(raw.own, DEFAULT_INPUT.own))),
  };
}

// Gallons of bay water for each pound of salt: 5 at 31 parts per thousand, more when it's less salty.
export const galPerLb = (ppt = BAY.ppt) => BAY.galPerLb * (BAY.ppt / ppt);

function boil(gal, heat, own) {
  const gph = heat.id === "own" ? own : heat.gph;
  const hours = gph > 0 ? gal / gph : null;
  return {
    gal,
    gph,
    hours,
    cords: heat.fuel === "wood" ? gal / GAL_PER_CORD : null,
    gas: heat.fuel === "gas" && hours !== null ? hours * GAS_GAL_PER_HR : null,
  };
}

export function saltPlan(raw = {}, methods = METHODS, heats = HEAT) {
  const input = cleanInput(raw);
  const method = methods.find((m) => m.id === input.method) || methods[0];
  const heat = heats.find((h) => h.id === input.heat) || heats[0];
  const salt = input.lb * method.rate;
  const make = Math.max(0, salt - input.have);
  const bayGal = make * galPerLb(input.ppt);
  return {
    input,
    method,
    heat,
    salt,
    cups: salt * CUPS_PER_LB,
    make,
    bayGal,
    buckets: bayGal / 5,
    brineGal: method.waterCupsPerLb ? (input.lb * method.waterCupsPerLb) / 16 : 0,
    sunSqft: bayGal * SQFT_PER_GAL,
    all: boil(bayGal, heat, input.own),
    sun: boil(bayGal * SUN_SHARE, heat, input.own),
  };
}

// ---------- words for numbers ----------

// Whole numbers from 1,000 up, one decimal below that, two below 0.1 (so small amounts don't show as 0).
export function num(n) {
  if (!Number.isFinite(n)) return "–";
  const a = Math.abs(n);
  if (a >= 1000) return Math.round(n).toLocaleString("en-US");
  if (a >= 0.1 || a === 0) return (Math.round(n * 10) / 10).toLocaleString("en-US");
  return String(Math.round(n * 100) / 100);
}
const plural = (n, one, many) => `${num(n)} ${Number(num(n)) === 1 ? one : many}`;
export const lbText = (n) => plural(n, "lb", "lb");
export const galText = (n) => plural(n, "gallon", "gallons");

// For the big number: hours (or minutes) alone; daysText() adds the 8-hour days.
export function hoursBig(h) {
  if (h === null || !Number.isFinite(h)) return "–";
  if (h > 0 && h < 1) return `${Math.max(5, Math.round((h * 60) / 5) * 5)} minutes`;
  return plural(h, "hour", "hours");
}
export const daysText = (h) => (h !== null && h >= 16 ? `About ${num(Math.ceil(h / 8))} days of 8-hour boils` : "");

export function hoursText(h) {
  if (h === null || !Number.isFinite(h)) return "–";
  if (h === 0) return "0 hours";
  if (h < 1) return `${Math.max(5, Math.round((h * 60) / 5) * 5)} minutes`;
  const base = plural(h, "hour", "hours");
  return h >= 16 ? `${base} (about ${num(Math.ceil(h / 8))} days of 8-hour boils)` : base;
}

export function cordText(c) {
  if (c === null || !Number.isFinite(c)) return "–";
  if (c >= 1) return `${num(c)} ${Number(num(c)) === 1 ? "cord" : "cords"}`;
  const feet = c * 8;
  const long = feet < 1 ? `${Math.max(1, Math.round(feet * 12))} inches` : `${num(feet)} ft`;
  return `${num(c)} cord (a stack 4 ft high and 4 ft deep, ${long} long)`;
}

export function gasText(g) {
  if (g === null || !Number.isFinite(g)) return "–";
  if (g >= 1) return `${galText(g)} of gasoline`;
  const quarts = Math.max(1, Math.round(g * 4));
  return `${num(g)} gallon of gasoline (about ${quarts} ${quarts === 1 ? "quart" : "quarts"})`;
}

// Small amounts of store salt read better in tablespoons (16 to a cup).
export const cupsText = (c) => (c > 0 && c < 0.25 ? `${num(c * 16)} tablespoons` : `${num(c)} cups`);

export const fuelText = (b) => (b.cords !== null ? cordText(b.cords) : b.gas !== null ? gasText(b.gas) : "");

// The calculator's steps with the person's own numbers, so they can follow (or redo) it on paper.
export function byHandLines(plan) {
  const { input, method, heat } = plan;
  const lines = [];
  lines.push(`Salt: ${num(input.lb)} lb × ${method.rate} = ${lbText(plan.salt)} (about ${cupsText(plan.cups)} of fine store salt: pounds × 1½).`);
  if (input.have > 0) lines.push(`Salt to make: ${num(plan.salt)} − ${num(input.have)} you have = ${lbText(plan.make)}.`);
  const salinity = input.ppt === BAY.ppt ? "" : ` × 31 ÷ ${num(input.ppt)}`;
  lines.push(`Bay water: ${num(plan.make)} lb × 5${salinity} = ${galText(plan.bayGal)} (${num(plan.buckets)} five-gallon buckets).`);
  if (plan.brineGal) lines.push(`Fresh water for the brine: ${num(input.lb)} lb × 7 cups ÷ 2½ lb = ${galText(plan.brineGal)}.`);
  const gph = plan.all.gph;
  if (gph > 0) {
    lines.push(`Boil it all: ${num(plan.bayGal)} gallons ÷ ${num(gph)} an hour = ${hoursText(plan.all.hours)}.`);
    lines.push(`Sun first: ${num(plan.bayGal)} ÷ 5 = ${galText(plan.sun.gal)} left to boil, ÷ ${num(gph)} an hour = ${hoursText(plan.sun.hours)}.`);
  } else {
    lines.push("Enter your boil-off rate to work out the hours.");
  }
  if (heat.fuel === "wood") lines.push(`Firewood: ${num(plan.bayGal)} ÷ 400 = ${num(plan.all.cords)} cord to boil it all, or ${num(plan.sun.gal)} ÷ 400 = ${num(plan.sun.cords)} cord with the sun first.`);
  if (heat.fuel === "gas" && gph > 0) lines.push(`Gasoline: ${num(plan.all.hours)} hours × 0.16 = ${num(plan.all.gas)} gallons to boil it all, or ${num(plan.sun.hours)} × 0.16 = ${num(plan.sun.gas)} with the sun first.`);
  lines.push(`Sun pans: ${num(plan.bayGal)} gallons × 1.6 = ${num(plan.sunSqft)} square feet, 1 inch deep.`);
  return lines;
}

// The formulas without numbers, for the screen and the paper copy.
export const FORMULAS = [
  [{ text: "Salt (lb) = weight (lb) × the rate", b: true }, { text: " for how you'll salt it (table below). Weigh fish after gutting and splitting." }],
  [{ text: "Cups of fine store salt = pounds × 1½.", b: true }, { text: " Homemade salt is flakier, so weigh it." }],
  [{ text: "Bay water (gallons) = pounds of salt to make × 5.", b: true }, { text: " One 5-gallon bucket makes about 1 lb. If you measured the saltiness, also × 31 ÷ your reading." }],
  [{ text: "Hours of boiling = gallons ÷ gallons boiled off an hour.", b: true }, { text: " Wood fire with 2 steam pans ≈ 4, with 3 pans ≈ 6, gasoline stove ≈ ½. If the sun first cuts the water to a fifth, boil only gallons ÷ 5." }],
  [{ text: "Firewood (cords) = gallons boiled ÷ 400.", b: true }, { text: " A cord is a stack 4 ft high, 4 ft deep and 8 ft long." }],
  [{ text: "Gasoline (gallons) = hours × 0.16", b: true }, { text: " (Coleman 2-burner stove, both burners on high)." }],
  [{ text: "Sun pans (square feet, 1 inch deep) = gallons × 1.6.", b: true }, { text: " About 8 square feet per pound of salt, and 3 to 5 weeks a batch in summer." }],
];

export const rateRows = (methods = METHODS) => methods.map((m) => [`${m.group}: ${m.name}`, m.per100, m.byHand, m.days, m.keeps]);

// ---------- HTML ----------

function runsHtml(runs) {
  if (typeof runs === "string") return esc(runs);
  return runs.map((r) => (r.b ? `<b>${esc(r.text)}</b>` : esc(r.text))).join("");
}

// Guide blocks (the report's shapes) as screen HTML.
export function blocksHtml(blocks) {
  return blocks.map((bk) => {
    switch (bk.t) {
      case "p": return `<p>${runsHtml(bk.runs)}</p>`;
      case "note": return `<p class="lts-note">${runsHtml(bk.runs)}</p>`;
      case "ul": case "ol": return `<${bk.t}>${bk.items.map((it) => `<li>${runsHtml(it)}</li>`).join("")}</${bk.t}>`;
      case "table":
        return `<div class="table-scroll"><table class="data lts-table"><thead><tr>${bk.head.map((h) => `<th scope="col">${esc(h)}</th>`).join("")}</tr></thead><tbody>${bk.rows.map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<th scope="row">${esc(c)}</th>` : `<td>${esc(c)}</td>`)).join("")}</tr>`).join("")}</tbody></table></div>`;
      default: return "";
    }
  }).join("");
}

export function resultsHtml(plan) {
  const { method, heat } = plan;
  const tile = (label, b) => `
      <div class="lts-boil">
        <h4>${esc(label)}</h4>
        <p class="lts-big">${esc(hoursBig(b.hours))}</p>
        ${daysText(b.hours) ? `<p>${esc(daysText(b.hours))}</p>` : ""}
        <p>${esc(galText(b.gal))} to boil off</p>
        ${fuelText(b) ? `<p>${esc(fuelText(b))}</p>` : ""}
      </div>`;
  return `
    <dl class="lts-key">
      <div><dt>Salt needed</dt><dd><span class="lts-big">${esc(lbText(plan.salt))}</span> about ${esc(cupsText(plan.cups))} of fine store salt</dd></div>
      ${plan.input.have > 0 ? `<div><dt>Salt to make</dt><dd><span class="lts-big">${esc(lbText(plan.make))}</span> after the ${esc(lbText(plan.input.have))} you have</dd></div>` : ""}
      <div><dt>Bay water to make it</dt><dd><span class="lts-big">${esc(galText(plan.bayGal))}</span> ${esc(num(plan.buckets))} five-gallon buckets</dd></div>
      ${plan.brineGal ? `<div><dt>Fresh water for the brine</dt><dd><span class="lts-big">${esc(galText(plan.brineGal))}</span> 7 cups for every 2 to 3 lb of fish</dd></div>` : ""}
      <div><dt>Time in salt</dt><dd>${esc(method.days)}</dd></div>
      <div><dt>Keeps</dt><dd>${esc(method.keeps)}</dd></div>
    </dl>
    <h4 class="lts-out-h">Boiling it down on: ${esc(heat.name.toLowerCase())}</h4>
    <div class="lts-boils">${tile("Boil it all", plan.all)}${tile("Sun first, then boil the last fifth", plan.sun)}</div>
    <p class="lts-hint">Sun pans for the whole batch: ${esc(num(plan.sunSqft))} square feet, 1 inch deep, about 3 to 5 weeks in summer. ${esc(heat.note)}</p>
    <h4 class="lts-out-h">${esc(SALT_PAGE.byHandHeading)}</h4>
    <ol class="lts-lines">${byHandLines(plan).map((l) => `<li>${esc(l)}</li>`).join("")}</ol>`;
}

function methodsHtml(input) {
  let group = "";
  return METHODS.map((m) => {
    const head = m.group !== group ? `<p class="lts-group">${esc(m.group)}</p>` : "";
    group = m.group;
    return `${head}
          <label class="lts-choice"><input type="radio" name="lts-method" value="${esc(m.id)}"${m.id === input.method ? " checked" : ""}>
            <span><b>${esc(m.name)}</b><span class="lts-choice-sub">${esc(m.short)}</span></span></label>`;
  }).join("");
}

function heatHtml(input) {
  return HEAT.map((h) => `
          <label class="lts-choice"><input type="radio" name="lts-heat" value="${esc(h.id)}"${h.id === input.heat ? " checked" : ""}>
            <span><b>${esc(h.name)}</b>${h.gph ? `<span class="lts-choice-sub">About ${h.gph === 0.5 ? "½ gallon" : `${esc(num(h.gph))} gallons`} an hour</span>` : ""}</span></label>`).join("");
}

const gearHtml = (gear = SALT_GEAR) => `
      <div class="table-scroll"><table class="data lts-table">
        <thead><tr><th scope="col">Item</th><th scope="col" class="num">Price</th><th scope="col">Notes</th></tr></thead>
        <tbody>${gear.map((g) => `<tr><th scope="row"><a href="${esc(g.url)}" target="_blank" rel="noopener">${esc(g.item)}</a><span class="lts-where">${esc(g.where)}</span></th><td class="num">${esc(g.price)}</td><td>${esc(g.note)}</td></tr>`).join("")}</tbody>
      </table></div>
      <p class="lts-hint">Prices checked ${esc(niceDate(SALT_CHECKED))}. They change often.</p>`;

export function renderSalting(input = DEFAULT_INPUT, page = SALT_PAGE) {
  const inp = cleanInput(input);
  const plan = saltPlan(inp);
  const sections = SALT_SECTIONS.map((s) => `
      <details class="ltm-notes lts-sec" id="lts-sec-${esc(s.id)}">
        <summary>${esc(s.title)}</summary>
        ${blocksHtml(s.blocks)}
        ${s.id === "buy" ? gearHtml() : ""}
      </details>`).join("");
  return `
    <section class="lts" aria-labelledby="lts-heading">
      <h2 id="lts-heading" class="section-title">${esc(page.heading)}</h2>
      <p class="muted lts-intro">${esc(page.intro)}</p>

      <div class="lts-calc">
        <form class="lts-form" data-salt-form novalidate>
          <h3 class="lts-h3">${esc(page.calcHeading)}</h3>
          <div class="lts-row">
            <label class="field" for="lts-lb">
              <span class="field-label">${esc(page.weightLabel)}</span>
              <span class="lts-unit"><input type="number" id="lts-lb" name="lb" inputmode="decimal" min="0" step="any" value="${esc(String(inp.lb))}" aria-describedby="lts-lb-hint"><span aria-hidden="true">lb</span></span>
              <span class="field-hint" id="lts-lb-hint">${esc(page.weightHint)}</span>
            </label>
            <label class="field" for="lts-have">
              <span class="field-label">${esc(page.haveLabel)}</span>
              <span class="lts-unit"><input type="number" id="lts-have" name="have" inputmode="decimal" min="0" step="any" value="${esc(String(inp.have))}" aria-describedby="lts-have-hint"><span aria-hidden="true">lb</span></span>
              <span class="field-hint" id="lts-have-hint">${esc(page.haveHint)}</span>
            </label>
          </div>
          <fieldset class="lts-set">
            <legend class="field-label">${esc(page.methodLabel)}</legend>
            ${methodsHtml(inp)}
          </fieldset>
          <fieldset class="lts-set">
            <legend class="field-label">${esc(page.heatLabel)}</legend>
            ${heatHtml(inp)}
            <label class="field lts-own" for="lts-own" data-own${inp.heat === "own" ? "" : " hidden"}>
              <span class="field-label">${esc(page.ownRateLabel)}</span>
              <span class="lts-unit"><input type="number" id="lts-own" name="own" inputmode="decimal" min="0" step="any" value="${esc(String(inp.own))}" aria-describedby="lts-own-hint"><span aria-hidden="true">gal/hr</span></span>
              <span class="field-hint" id="lts-own-hint">${esc(page.ownRateHint)}</span>
            </label>
          </fieldset>
          <details class="lts-more"${inp.ppt === BAY.ppt ? "" : " open"}>
            <summary>${esc(page.pptLabel)}: <span data-ppt-out>${esc(num(inp.ppt))}</span> parts per thousand</summary>
            <label class="field" for="lts-ppt">
              <span class="lts-unit"><input type="number" id="lts-ppt" name="ppt" inputmode="decimal" min="5" max="40" step="any" value="${esc(String(inp.ppt))}" aria-describedby="lts-ppt-hint"><span aria-hidden="true">ppt</span></span>
              <span class="field-hint" id="lts-ppt-hint">${esc(page.pptHint)}</span>
            </label>
          </details>
        </form>
        <div class="lts-out" data-salt-out aria-live="polite">${resultsHtml(plan)}</div>
      </div>

      <section class="lts-hand" aria-labelledby="lts-hand-heading">
        <h3 id="lts-hand-heading" class="lts-h3">The formulas, for paper</h3>
        <p class="lts-hint">The same steps as the calculator. They're in the printed report too, with a fill-in worksheet.</p>
        <ol class="lts-formulas">${FORMULAS.map((f) => `<li>${runsHtml(f)}</li>`).join("")}</ol>
        <div class="table-scroll"><table class="data lts-table lts-rates">
          <caption>Salt for each way of salting</caption>
          <thead><tr><th scope="col">Way of salting</th><th scope="col">Salt per 100 lb</th><th scope="col">By hand</th><th scope="col">Time in salt</th><th scope="col">Keeps</th></tr></thead>
          <tbody>${rateRows().map((r) => `<tr><th scope="row">${esc(r[0])}</th>${r.slice(1).map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody>
        </table></div>
      </section>

      <div class="lts-sections">${sections}
        <details class="ltm-notes lts-sec" id="lts-sec-sources">
          <summary>Sources</summary>
          <ul class="lts-sources">${SALT_SOURCES.map(([t, u]) => `<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a></li>`).join("")}</ul>
        </details>
      </div>
    </section>`;
}

// ---------- paper copy ----------

export function saltingBlocks() {
  const part = (text) => ({ t: "part", text });
  const h3 = (text) => ({ t: "h3", text });
  const p = (runs) => ({ t: "p", runs });
  const out = [part("Salting fish and game")];
  out.push(p("How much salt your catch needs, how much Cobscook Bay water makes that salt, and how long it takes to boil down over wood or a gasoline stove. The formulas below are the same ones the website's calculator uses, so you can work it all out without a phone."));

  out.push(h3("Work it out by hand"));
  out.push({ t: "ol", items: FORMULAS });

  out.push(h3("Salt for each way of salting"));
  out.push({
    t: "table",
    head: ["Way of salting", "Salt per 100 lb", "By hand", "Time in salt", "Keeps"],
    rows: rateRows().map((r) => [{ text: r[0], b: true }, ...r.slice(1)]),
    widths: [92, 70, 100, 100, "*"],
    size: "s",
  });

  const ex = (heat) => saltPlan({ lb: 100, method: "heavy", heat });
  const heats = HEAT.filter((h) => h.id !== "own");
  const base = ex("wood2");
  out.push(h3("Example: 100 lb of split fish, heavy salted"));
  out.push(p(`Salt: 100 × 0.55 = ${lbText(base.salt)} (about ${cupsText(base.cups)}). Bay water: ${num(base.make)} × 5 = ${galText(base.bayGal)} (${num(base.buckets)} buckets). Sun pans for all of it: ${num(base.sunSqft)} square feet, 1 inch deep.`));
  out.push({
    t: "table",
    head: ["Boiled on", "Boil it all", "Sun first, then boil the last fifth"],
    rows: heats.map((h) => {
      const pl = ex(h.id);
      const cell = (b) => `${hoursText(b.hours)}; ${fuelText(b)}`;
      return [{ text: h.name, b: true }, cell(pl.all), cell(pl.sun)];
    }),
    widths: [110, "*", "*"],
    size: "s",
  });

  out.push(h3("Worksheet"));
  const blank = "________";
  out.push({
    t: "table",
    head: ["Step", "Your numbers"],
    rows: [
      ["Weight of split fish or meat", `${blank} lb`],
      ["× rate from the table above", `× ${blank}`],
      ["= salt needed", `${blank} lb`],
      ["− salt you already have", `− ${blank} lb`],
      ["= salt to make", `${blank} lb`],
      ["× 5 = bay water", `${blank} gallons`],
      ["÷ gallons boiled off an hour = hours to boil it all", `${blank} hours`],
      ["Sun first: gallons ÷ 5, then ÷ gallons an hour", `${blank} hours`],
      ["Gallons boiled ÷ 400 = cords of firewood", `${blank} cord`],
      ["Hours × 0.16 = gallons of gasoline", `${blank} gallons`],
      ["Gallons × 1.6 = square feet of sun pans", `${blank} sq ft`],
    ],
    widths: [260, "*"],
    size: "m",
  });

  for (const s of SALT_SECTIONS) {
    out.push(h3(s.title));
    out.push(...s.blocks);
    if (s.id === "buy") {
      out.push({
        t: "table",
        head: ["Item", "Price", "Where", "Notes"],
        rows: SALT_GEAR.map((g) => [{ text: g.item, b: true }, g.price, g.where, `${g.note} ${g.url}`]),
        widths: [120, 50, 60, "*"],
        size: "xs",
      });
      out.push({ t: "note", runs: `Prices checked ${niceDate(SALT_CHECKED)}.` });
    }
  }
  out.push(h3("Sources"));
  out.push({ t: "ul", items: SALT_SOURCES.map(([title, url]) => [{ text: title, link: url }, { text: ` (${url})` }]) });
  return out;
}

// ---------- browser ----------

function readInput() {
  try { return cleanInput(JSON.parse(localStorage.getItem(STORE) || "{}")); } catch { return cleanInput({}); }
}
function saveInput(input) {
  try { localStorage.setItem(STORE, JSON.stringify(input)); } catch { /* private mode */ }
}

export function initialInput() {
  return typeof localStorage === "undefined" ? cleanInput({}) : readInput();
}

export function createSalting(panel) {
  const form = panel.querySelector("[data-salt-form]");
  const out = panel.querySelector("[data-salt-out]");
  const own = panel.querySelector("[data-own]");
  const pptOut = panel.querySelector("[data-ppt-out]");
  if (!form || !out) return { refresh() {}, destroy() {} };

  // Fields left empty while typing count as 0 (or the default saltiness), without rewriting the box.
  const read = () => {
    const data = new FormData(form);
    return cleanInput({
      lb: data.get("lb") === "" ? 0 : data.get("lb"),
      have: data.get("have") === "" ? 0 : data.get("have"),
      method: data.get("lts-method"),
      heat: data.get("lts-heat"),
      ppt: data.get("ppt"),
      own: data.get("own") === "" ? 0 : data.get("own"),
    });
  };
  const draw = () => {
    const input = read();
    if (own) own.hidden = input.heat !== "own";
    if (pptOut) pptOut.textContent = num(input.ppt);
    out.innerHTML = resultsHtml(saltPlan(input));
    saveInput(input);
  };

  const stop = (e) => e.preventDefault();
  form.addEventListener("input", draw);
  form.addEventListener("change", draw);
  form.addEventListener("submit", stop);
  draw();
  return {
    refresh() {},
    destroy() {
      form.removeEventListener("input", draw);
      form.removeEventListener("change", draw);
      form.removeEventListener("submit", stop);
    },
  };
}
