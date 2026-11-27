import { ACTIVITY, PRICES_CHECKED, STORE_PLANS } from "./data.js";
import { planHousehold, validatePerson } from "./calc.js";
import {
  money, todayText, planSummary, personSummary, statusLine, goalChoice, cardRows, cardEnergy, cardNotes, cookingData, onePotData, gearItems,
  storeGroups, shoppingLead, compareText, shoppingNotes, lineHint, KEEPS_LEAD, keepsNotes, KEEPS_SOURCES, COOK_NOTE, WEIGH_INTRO, WEIGH_RULES, WEIGH_KIDS,
  CARE, ABOUT, SOURCES, DISCLAIMER, SITE_URL, cardKeyFor, TUB_NAMES, withHave, HL_START, HL_END, PLAN_NOTE, GEAR_INTRO,
} from "./content.js";

const STORAGE_KEY = "prep-household-v1";
const FLAGS = [
  ["pregnant", "Pregnant"],
  ["breastfeeding", "Breastfeeding"],
  ["peanut", "Peanut allergy"],
  ["diabetes", "Diabetes"],
  ["kidney", "Kidney disease"],
  ["celiac", "Celiac disease"],
];

const $ = (sel, el = document) => el.querySelector(sel);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const blankPerson = () => ({ id: newId(), name: "", sex: "", age: "", months: "0", ft: "", inch: "", weight: "", activity: "light", feeding: "formula", flags: {} });

const EXAMPLE = [
  { name: "Sam", sex: "male", age: "34", ft: "5", inch: "10", weight: "210", activity: "light", flags: {} },
  { name: "Jo", sex: "female", age: "33", ft: "5", inch: "5", weight: "150", activity: "light", flags: {} },
  { name: "Ava", sex: "female", age: "6", ft: "3", inch: "10", weight: "46", activity: "moderate", flags: {} },
  { name: "Leo", sex: "male", age: "1", ft: "2", inch: "6", weight: "22", activity: "light", flags: {} },
];

// "Already have" tick boxes sit in every shopping list row. Gear lines map to one saved setting each,
// which planHousehold uses to drop the line; anything else (food, vitamins, buckets) is kept in
// state.have and only comes off the totals (see withHave in content.js).
const OWNED_BY_LINE = {
  scale: "hasScale", lighters: "hasLighters", axe: "hasAxe", bladder: "hasBladder", drainCover: "hasBladder",
  diverter: "hasDiverter", timer: "hasTimer", pot: "hasPot", tripod: "hasTripod", disc: "hasDisc",
};
const gearKeyFor = (lineKey) => (lineKey.startsWith("straw") ? "hasFilters" : OWNED_BY_LINE[lineKey]);
const isOwned = (lineKey) => { const g = gearKeyFor(lineKey); return g ? !!state[g] : !!state.have[lineKey]; };
function setOwned(lineKey, on) {
  const g = gearKeyFor(lineKey);
  if (g) { state[g] = on; return; }
  state.have = { ...state.have };
  if (on) state.have[lineKey] = true; else delete state.have[lineKey];
}

let state = { months: 6, reserve: 20, store: "costco", hasScale: false, hasLighters: false, hasFilters: false, hasAxe: false, hasBladder: false, hasDiverter: false, hasTimer: false, hasPot: false, hasTripod: false, hasDisc: false, people: [blankPerson()], ...(load() || {}) };
if (!STORE_PLANS[state.store]) state.store = "costco";
if (!state.have || typeof state.have !== "object") state.have = {};
// Bathtub water: the waterBOB bag or the V-TOP drain cover, picked in the list row.
// (A save from the short-lived three-way choice may say "have".)
if (state.tub === "have") { state.tub = "bladder"; state.hasBladder = true; }
if (state.tub !== "drainCover") state.tub = "bladder";

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!Array.isArray(s.people)) return null;
    return s;
  } catch { return null; }
}
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
}

function toPerson(raw, i) {
  const n = (v) => (v === "" || v === null || v === undefined ? NaN : Number(v));
  const years = n(raw.age);
  // Age 0 means a baby under 1: the months picker gives the exact age.
  const age = years === 0 ? (Number(raw.months) || 0) / 12 : years;
  const ft = n(raw.ft), inch = n(raw.inch);
  const hasHeight = Number.isFinite(ft) || Number.isFinite(inch);
  return {
    name: raw.name.trim() || `Person ${i + 1}`,
    sex: raw.sex,
    age,
    heightIn: hasHeight ? (Number.isFinite(ft) ? ft : 0) * 12 + (Number.isFinite(inch) ? inch : 0) : NaN,
    weightLb: n(raw.weight),
    activity: raw.activity,
    feeding: raw.feeding || "formula",
    flags: raw.flags || {},
    keepWeight: !!raw.keepWeight,
    id: raw.id,
  };
}

const MONTHS = Array.from({ length: 12 }, (_, m) => [String(m), m === 0 ? "Newborn (under 1 month)" : `${m} month${m > 1 ? "s" : ""} old`]);
const FEEDS = [["formula", "Formula"], ["breast", "Breast milk"], ["both", "Both"]];
const options = (list, selected) => list.map(([v, label]) => `<option value="${v}"${v === selected ? " selected" : ""}>${label}</option>`).join("");

// ---------- the form ----------

function activityOptions(selected) {
  return Object.entries(ACTIVITY)
    .map(([k, a]) => `<option value="${k}"${k === selected ? " selected" : ""}>${a.label}</option>`)
    .join("");
}

function personFieldset(raw, i) {
  const id = raw.id;
  const isBaby = raw.age === "0";
  const flagBoxes = FLAGS.map(([k, label]) =>
    `<label class="check"><input type="checkbox" data-flag="${k}"${raw.flags?.[k] ? " checked" : ""}><span>${label}</span></label>`).join("");
  const anyFlag = FLAGS.some(([k]) => raw.flags?.[k]);
  return `
  <fieldset class="person" data-id="${id}">
    <legend class="person-legend">${esc(raw.name.trim() || `Person ${i + 1}`)}</legend>
    <div class="person-grid">
      <label class="field f-name"><span class="field-label">Name</span>
        <input type="text" data-k="name" value="${esc(raw.name)}" placeholder="Person ${i + 1}" autocomplete="off"></label>
      <label class="field f-sex"><span class="field-label">Sex</span>
        <select data-k="sex">
          <option value=""${raw.sex === "" ? " selected" : ""}>Choose</option>
          <option value="female"${raw.sex === "female" ? " selected" : ""}>Female</option>
          <option value="male"${raw.sex === "male" ? " selected" : ""}>Male</option>
        </select></label>
      <div class="field f-age"><label class="field-label" for="age-${id}">Age</label>
        <input id="age-${id}" type="number" inputmode="numeric" min="0" max="110" step="1" data-k="age" value="${esc(raw.age)}">
        <select data-k="months" data-baby aria-label="Baby's age in months"${isBaby ? "" : " hidden"}>${options(MONTHS, String(raw.months ?? "0"))}</select>
        <span class="field-hint" data-not-baby${isBaby ? " hidden" : ""}>Under 1? Enter 0.</span></div>
      <div class="field f-height" role="group" aria-labelledby="h-${id}"><span class="field-label" id="h-${id}">Height</span>
        <div class="pair">
          <span class="unit-input"><input type="number" inputmode="numeric" min="0" max="8" data-k="ft" value="${esc(raw.ft)}" aria-label="Feet"><span class="unit">ft</span></span>
          <span class="unit-input"><input type="number" inputmode="numeric" min="0" max="11" data-k="inch" value="${esc(raw.inch)}" aria-label="Inches"><span class="unit">in</span></span>
        </div></div>
      <label class="field f-weight"><span class="field-label">Weight</span>
        <span class="unit-input"><input type="number" inputmode="decimal" min="3" max="600" step="any" data-k="weight" value="${esc(raw.weight)}"><span class="unit">lb</span></span></label>
      <div class="field f-activity">
        <label class="sub-field" data-not-baby${isBaby ? " hidden" : ""}><span class="field-label">Activity during an outage</span>
          <select data-k="activity" aria-describedby="a-${id}">${activityOptions(raw.activity)}</select>
          <span class="field-hint" id="a-${id}" data-activity-hint>${esc(ACTIVITY[raw.activity]?.hint || "")}. Unsure? Pick one level above today.</span></label>
        <label class="sub-field" data-baby${isBaby ? "" : " hidden"}><span class="field-label">How the baby is fed</span>
          <select data-k="feeding">${options(FEEDS, raw.feeding || "formula")}</select>
          <span class="field-hint">Formula goes by weight, so height is optional for babies.</span></label>
        <p class="field-hint nurse-hint" data-nurse-hint aria-live="polite" hidden></p>
      </div>
    </div>
    <div class="person-foot">
      <details class="special"${anyFlag ? " open" : ""}><summary>Special situations</summary><div class="flags">${flagBoxes}</div></details>
      <button type="button" class="btn-link remove" data-remove="${id}">Remove ${esc(raw.name.trim() || `person ${i + 1}`)}</button>
    </div>
    <p class="person-error" data-error></p>
  </fieldset>`;
}

// Under a breastfed baby: point to the mother's card, or offer to mark her as breastfeeding.
function nurseHint(raw) {
  if (raw.age !== "0" || !["breast", "both"].includes(raw.feeding)) return "";
  const name = (p) => esc(p.name.trim() || `Person ${state.people.indexOf(p) + 1}`);
  const women = state.people.filter((p) => p !== raw && p.sex === "female" && Number(p.age) >= 12);
  const nursing = women.filter((p) => p.flags?.breastfeeding && !p.flags?.pregnant);
  if (nursing.length) return `${nursing.map(name).join(" and ")} ${nursing.length > 1 ? "get" : "gets"} extra food for breastfeeding.`;
  const moms = women.filter((p) => Number(p.age) <= 55);
  if (!moms.length) return "The mother needs extra food while breastfeeding. Add her to the list and tick Breastfeeding under her Special situations.";
  return `The mother needs extra food while breastfeeding: ${moms.map((p) => `<button type="button" class="btn-link" data-nurse="${p.id}">Mark ${name(p)} as breastfeeding</button>`).join(" or ")}`;
}

function renderPeople() {
  $("#people").innerHTML = state.people.map(personFieldset).join("");
  updateErrors();
}

function updateErrors() {
  state.people.forEach((raw, i) => {
    const fs = document.querySelector(`fieldset[data-id="${raw.id}"]`);
    if (!fs) return;
    const touched = raw.sex || raw.age || raw.ft || raw.weight;
    const errs = touched ? validatePerson(toPerson(raw, i)) : [];
    $("[data-error]", fs).textContent = errs.join(" ");
    $(".person-legend", fs).textContent = raw.name.trim() || `Person ${i + 1}`;
    const hint = $("[data-nurse-hint]", fs);
    const html = nurseHint(raw);
    if (hint.innerHTML !== html) hint.innerHTML = html;
    hint.hidden = !html;
  });
}

// ---------- drawings ----------

function cupGlyph(f) {
  const top = 5, bottom = 21;
  const y = bottom - (bottom - top) * f;
  return `<svg class="glyph" viewBox="0 0 24 24" aria-hidden="true"><rect class="fill" x="0" y="${y.toFixed(2)}" width="24" height="${(24 - y).toFixed(2)}" clip-path="url(#cup-body)"/><path class="outline" d="M3 5h13l-1.3 14.2a2 2 0 0 1-2 1.8H6.3a2 2 0 0 1-2-1.8z"/><path class="outline" d="M16 8.5h2.5a2 2 0 0 1 2 2V13a2 2 0 0 1-2 2h-3.3"/></svg>`;
}

function spoonGlyph(f) {
  return `<svg class="glyph glyph-spoon" viewBox="0 0 24 24" aria-hidden="true"><rect class="fill" x="2" y="6" width="${(12 * f).toFixed(2)}" height="12" clip-path="url(#spoon-bowl)"/><ellipse class="outline" cx="8" cy="12" rx="6" ry="4.6"/><path class="outline" d="M14 12h8.5"/></svg>`;
}

function glyphs(x, kind) {
  if (x <= 0) return "";
  const draw = kind === "cup" ? cupGlyph : spoonGlyph;
  const whole = Math.floor(x + 1e-9);
  const part = Math.round((x - whole) * 1000) / 1000;
  let out = "";
  for (let i = 0; i < Math.min(whole, 6); i++) out += draw(1);
  if (part > 0) out += draw(part);
  return out;
}

// ---------- results ----------

function goalToggle(pl) {
  const g = goalChoice(pl);
  if (!g) return "";
  const id = esc(pl.person.id);
  const btn = (goal, label, on) => `<button type="button" class="goal-btn" data-goal="${goal}" data-goal-id="${id}" aria-pressed="${on}">${esc(label)}</button>`;
  return `<div class="goal-toggle" role="group" aria-label="Weight goal for ${esc(pl.person.name)}">${btn("healthy", g.healthyLabel, !g.kept)}${btn("keep", g.keepLabel, g.kept)}</div>`;
}

function card(pl, hh) {
  const p = pl.person;
  const rows = cardRows(pl).map((r) => `
      <div class="scoop-row"><span class="scoop-food">${esc(r.label)}${r.sub ? `<small>${esc(r.sub)}</small>` : ""}</span><span class="scoop-glyphs">${r.glyph ? glyphs(...r.glyph) : ""}</span><span class="scoop-amount">${esc(r.amount)}</span></div>`).join("");
  const notes = cardNotes(pl, hh);
  const warnings = pl.warnings.length ? `<ul class="card-warnings">${pl.warnings.map((w) => `<li>${esc(w)}</li>`).join("")}</ul>` : "";
  return `
  <article class="ration-card">
    <header class="card-head">
      <h3 class="card-name">${esc(p.name)}</h3>
      <p class="card-status">${esc(statusLine(pl))}</p>
      <p class="card-who">${esc(personSummary(p))}</p>
      ${goalToggle(pl)}
    </header>
    <p class="card-energy">${esc(cardEnergy(pl))}</p>
    <div class="scoops" role="table" aria-label="${esc(p.name)}'s daily amounts">${rows}</div>
    ${notes.length ? `<ul class="card-notes">${notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>` : ""}
    ${warnings}
  </article>`;
}

function cookRow(r, pot) {
  const amount = (x) => `<td>${esc(x.cooked)}${x.dry ? `<small>${esc(x.dry)}</small>` : ""}</td>`;
  return `<tr><th scope="row">${esc(r.name)}</th>${amount(r.rice)}${amount(r.beans)}<td>${esc(r.oats)}</td>${pot === undefined ? "" : `<td>${esc(pot)}</td>`}</tr>`;
}

// Cooking for everyone and All in one pot share one table: each person's rice, beans and oats,
// then their share if it's all cooked in one pot.
// Escape, then turn the plan-number marks from content.js into yellow highlights.
const markPlan = (text) => esc(text).split(HL_START).join('<mark class="plan">').split(HL_END).join("</mark>");

function cookingBody(hh) {
  const c = cookingData(hh);
  const d = onePotData(hh);
  const share = d ? new Map(d.rows) : null;
  const potCell = (name) => (share ? share.get(name) || "none" : undefined);
  return `
    <p class="plan-note">${esc(PLAN_NOTE)}</p>
    <p>Each day, cook <strong>${markPlan(c.rice)}</strong> and <strong>${markPlan(c.beans)}</strong> ${markPlan(c.rest)}</p>
    <div class="table-scroll"><table class="data cook">
      <thead><tr>${c.head.map((h) => `<th scope="col">${h}</th>`).join("")}${d ? '<th scope="col">Or all in one pot</th>' : ""}</tr></thead>
      <tbody>${c.rows.map((r) => cookRow(r, potCell(r.name))).join("")}</tbody>
      <tfoot>${cookRow(c.total, d ? d.total[1] : undefined)}</tfoot>
    </table></div>
    ${c.milk ? `<p>${markPlan(c.milk)}</p>` : ""}
    <h3 class="sub-title">Cooking over a fire</h3>
    <p>${markPlan(c.fireLead)}</p>
    <ul class="plain">${c.water.map((w) => `<li><strong>${esc(w.label)}:</strong> ${markPlan(w.text)}</li>`).join("")}</ul>
    <p>${markPlan(c.waterTotal)}</p>
    ${d ? `
    <h3 class="sub-title">Or all in one pot</h3>
    <p>${markPlan(d.lead)}</p>
    <ol class="steps">${d.steps.map((st) => `<li>${markPlan(st)}</li>`).join("")}</ol>
    <p>${esc(d.servingLeadTable)}</p>
    <p>${esc(d.note)}</p>` : ""}
    <p class="muted">${esc(COOK_NOTE)}</p>`;
}

// "Why?" panels that are open, by gear card key, so they stay open when the list redraws.
const openWhy = new Set();

// The bathtub water line becomes two rows, the waterBOB then the drain cover, with a radio
// button to pick one. Only the picked one counts in the total.
function withTubChoice(lines) {
  return lines.flatMap((l) => {
    if (!l.alt) return [l];
    const picked = { ...l, choice: true, picked: true };
    const other = { ...l.alt, qty: 1, cost: l.alt.price, choice: true, picked: false };
    delete other.alt;
    return l.key === "bladder" ? [picked, other] : [other, picked];
  });
}

// Lines that share an explanation sit together as one row: the LifeStraw packs, the buckets and
// mylar bags, and the two bathtub water choices. The first gets the "Why?" button and the
// "Already have" box (the bathtub's goes under both choices); the explanation opens under the last.
function clusters(lines) {
  const out = [];
  for (const l of lines) {
    const key = cardKeyFor(l.key);
    const last = out[out.length - 1];
    if (key && last && last.key === key) last.lines.push(l);
    else out.push({ key, lines: [l] });
  }
  return out;
}

function shopTable(lines, cards, shown) {
  const body = clusters(withTubChoice(lines)).map(({ key, lines: ls }) => {
    const card = key && !shown.has(key) ? cards[key] : null;
    if (card) shown.add(key);
    const open = card && openWhy.has(key);
    // Gear rows in a group share one box (the LifeStraw packs, the two bathtub choices); every
    // other row (food, buckets, mylar) has its own.
    const gearKey = gearKeyFor(ls[0].key);
    const choice = ls.some((x) => x.choice);
    const rows = ls.map((l, i) => {
      const first = i === 0;
      const lastRow = i === ls.length - 1;
      const owned = isOwned(l.key);
      const off = owned || (l.choice && !l.picked);
      const cls = [lastRow ? "" : "joined", i ? "cont" : "", off ? "off" : "", owned ? "owned" : ""].filter(Boolean).join(" ");
      const why = first && card
        ? ` <button type="button" class="why-btn" data-why="${key}" aria-expanded="${open}" aria-controls="why-${key}">${open ? "Hide" : "Why?"}</button>`
        : "";
      const radio = l.choice
        ? `<input type="radio" class="pick" name="tub" value="${l.key}"${l.picked ? " checked" : ""} aria-label="Buy the ${esc(TUB_NAMES[l.key])}">`
        : "";
      // The bathtub's box covers both choices, so it goes under the second one.
      const boxHere = gearKey ? (choice ? lastRow : first) : true;
      const have = boxHere
        ? `<label class="have"><input type="checkbox" data-own="${l.key}"${owned ? " checked" : ""}> Already have${choice ? " one" : ""}</label>`
        : "";
      const hint = lineHint(l);
      const cost = owned || (l.choice && !l.picked)
        ? `<s>${money(l.cost)}</s><small>${owned ? "you have it" : "not picked"}</small>`
        : `${money(l.cost)}${l.priceNote ? `<small>${esc(l.priceNote)}</small>` : ""}`;
      return `
      <tr${cls ? ` class="${cls}"` : ""}>
        <th scope="row"><span class="item-line">${radio}${l.choice && i ? '<span class="or">or</span> ' : ""}<a href="${l.url}" target="_blank" rel="noopener">${esc(l.item)}</a>${why}</span>${hint ? `<small class="keeps">${esc(hint)}</small>` : ""}${have}</th>
        <td>${esc(l.pack)}</td>
        <td class="num">${l.qty}</td>
        <td>${esc(l.amountText)}</td>
        <td class="num">${cost}</td>
      </tr>`;
    }).join("");
    return rows + (card ? `
      <tr class="why-row" id="why-${key}"${open ? "" : " hidden"}><td colspan="5"><div class="why-panel">${gearBody(card)}</div></td></tr>` : "");
  }).join("");
  return `
    <div class="table-scroll"><table class="data shop">
      <thead><tr><th scope="col">Item</th><th scope="col">Buy</th><th scope="col" class="num">How many</th><th scope="col">Covers</th><th scope="col" class="num">Cost</th></tr></thead>
      <tbody>${body}</tbody>
    </table></div>`;
}

// lines: every line, owned or not (see renderResults). The totals leave out owned gear.
function shoppingSection(hh, lines) {
  const cards = Object.fromEntries(gearItems(hh).map((it) => [it.key, it]));
  const shown = new Set();
  const counted = (l) => !isOwned(l.key);
  const tables = storeGroups({ ...hh, lines }).map((g) => `
    <h3 class="sub-title"><span class="title-text">${esc(g.title)}</span> <span class="sub-total">${money(g.lines.filter(counted).reduce((t, l) => t + l.cost, 0))}</span></h3>
    ${shopTable(g.lines, cards, shown)}`).join("");
  // The rare explanation with no line (no LifeStraws when everyone is under 3) is folded after the notes.
  const offList = Object.values(cards).filter((it) => !shown.has(it.key) && it.key !== "storage");
  return `
  <section class="block shopping" aria-labelledby="shop-title">
    <h2 id="shop-title" class="section-title shop-title"><span class="title-text">Shopping List Grand Total</span> <span class="grand-total">${money(hh.total)}</span></h2>
    <p class="shop-summary">${esc(shoppingLead(hh))}.</p>
    <p class="shop-compare">${esc(compareText(hh))} <button type="button" class="btn-link" data-switch-store>${hh.store === "costco" ? "Show the Walmart list" : "Show the Costco list"}</button></p>
    <p class="shop-have">Tick "Already have" under anything you own and it comes off the total.</p>
    ${tables}
    <ul class="notes">${shoppingNotes(hh).map((n) => `<li>${esc(n)}</li>`).join("")}</ul>
    ${offList.length ? `
    <h3 class="sub-title">Gear you're not buying</h3>
    ${offList.map((it) => `
    <details class="off-list">
      <summary>${esc(it.title)}</summary>
      <div class="why-panel">${gearBody(it)}</div>
    </details>`).join("")}` : ""}
  </section>`;
}

function potSizes(it) {
  const rows = it.sizes.map((s) => `
        <tr${s.pick ? ' class="pick"' : ""}><th scope="row">${esc(s.size)}${s.pick ? '<small>Your size</small>' : ""}</th><td>${esc(s.cups)}</td><td>${esc(s.fill)}</td><td>${esc(s.weight)}</td><td class="num">${esc(s.price)}</td></tr>`).join("");
  return `
      <div class="table-scroll"><table class="data pot-sizes">
        <caption>Every size, on the same Amazon page</caption>
        <thead><tr>${it.sizesHead.map((h, i) => `<th scope="col"${i === it.sizesHead.length - 1 ? ' class="num"' : ""}>${esc(h)}</th>`).join("")}</tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
      <p class="muted">${esc(it.sizesNote)}</p>`;
}

// One gear explanation: what to buy, how long it lasts and how to use it. The title isn't repeated,
// since it sits under the item's own row (or in its summary line).
function gearBody(it) {
  return `
      <p class="gear-buy">${esc(it.buy)}</p>
      ${it.links.length > 1 ? `<p class="gear-links">On Amazon: ${it.links.map((l) => `<a href="${l.url}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join(", ")}</p>` : ""}
      ${(it.notes || []).map((n) => `<p><strong>${esc(n.label)}:</strong> ${esc(n.text)}</p>`).join("")}
      <p><strong>How long it lasts:</strong> ${esc(it.lasts)}</p>
      ${it.sizes ? potSizes(it) : ""}
      ${it.drink ? `<p><strong>How much to drink:</strong> ${esc(it.drink)}</p>` : ""}
      <ul class="plain">${it.tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
      ${it.packs ? `<p class="muted">${esc(it.packs)}</p>` : ""}`;
}

// Printed only (hidden on screen): every gear explanation as its own section after the shopping
// list, as in the PDF, instead of opening each "Why?" inside the list.
function printGearSection(hh) {
  return `
  <section class="block print-only gear-print" aria-hidden="true">
    <h2 class="section-title">Fire, Water, Cooking And Storage</h2>
    <p>${esc(GEAR_INTRO)}</p>
    ${gearItems(hh).map((it) => `
    <article class="gear-item">
      <h3 class="gear-title">${esc(it.title)}</h3>
      ${gearBody(it)}
    </article>`).join("")}
  </section>`;
}

function keepsBody(hh) {
  return `
    <p class="keeps-lead">${esc(KEEPS_LEAD)}</p>
    ${leadList(keepsNotes(hh))}
    <p class="sources">Shelf-life sources: ${KEEPS_SOURCES.map(([label, url]) => `<a href="${url}" target="_blank" rel="noopener">${esc(label)}</a>`).join(", ")}.</p>`;
}

function rulesBody(hh) {
  const hasAdults = hh.plans.some((pl) => !pl.isChild);
  const hasKids = hh.plans.some((pl) => pl.isChild);
  return `
    <p>${esc(WEIGH_INTRO)}</p>
    ${hasAdults ? `
    <div class="table-scroll"><table class="data rules">
      <thead><tr><th scope="col">If you're</th><th scope="col">And the scale shows</th><th scope="col">Do this</th></tr></thead>
      <tbody>${WEIGH_RULES.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody>
    </table></div>` : ""}
    ${hasKids ? `<p>${esc(WEIGH_KIDS)}</p>` : ""}`;
}

const leadList = (items) => `<ul class="plain">${items.map((it) => `<li><strong>${esc(it.lead)}:</strong> ${esc(it.text)}</li>`).join("")}</ul>`;

const careBody = () => leadList(CARE);

function aboutBody() {
  return `
    ${leadList(ABOUT)}
    <p class="sources">Sources: ${SOURCES.map(([label, url]) => `<a href="${url}" target="_blank" rel="noopener">${esc(label)}</a>`).join(", ")}.</p>
    <p class="muted">${esc(DISCLAIMER)}</p>`;
}

// The guides at the very bottom, folded so the page stays short. Tap a heading to open it.
const MORE = [
  ["cook", "Cooking For Everyone", cookingBody],
  ["keeps", "How Long It Keeps", keepsBody],
  ["rules", "Weekly Weigh-In", rulesBody],
  ["care", "Cooking And Storage", careBody],
  ["about", "How The Numbers Are Worked Out", aboutBody],
];
const openMore = new Set(); // which ones are open, so they stay open when the page redraws

function moreSection(hh) {
  return `
  <div class="more">${MORE.map(([id, title, body]) => `
    <details class="more-item" id="more-${id}" data-more="${id}"${openMore.has(id) ? " open" : ""}>
      <summary><h2 class="section-title">${esc(title)}</h2></summary>
      <div class="more-body">${body(hh)}</div>
    </details>`).join("")}
  </div>`;
}

function reportActions(where) {
  return `
    <div class="report-actions" data-where="${where}">
      <button type="button" class="btn" data-print>Print the full report</button>
      <button type="button" class="btn btn-quiet" data-pdf>Download PDF</button>
      <span class="pdf-status" role="status" aria-live="polite"></span>
    </div>`;
}

let renderTimer = null;
function scheduleRender() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(renderResults, 120);
}

function renderResults() {
  const people = state.people.map(toPerson);
  const base = { months: state.months, reservePct: state.reserve, store: state.store, tub: state.tub, people };
  const hh = planHousehold({
    ...base,
    owned: {
      scale: !!state.hasScale, lighters: !!state.hasLighters, filters: !!state.hasFilters, axe: !!state.hasAxe,
      bladder: !!state.hasBladder, diverter: !!state.hasDiverter, timer: !!state.hasTimer,
      pot: !!state.hasPot, tripod: !!state.hasTripod, disc: !!state.hasDisc,
    },
  });
  // Owned gear only drops lines and their cost, nothing else (cooking, the pot size and the
  // one-pot steps stay the same), so the page lists every line from a plan with nothing owned
  // and greys out the ones ticked "Already have".
  allLines = planHousehold(base).lines;
  const view = withHave(hh, new Set(Object.keys(state.have)));
  // For the PDF, which doesn't print owned rows: the names of everything ticked "Already have".
  const ownedSeen = new Set();
  view.ownedItems = allLines.filter((l) => isOwned(l.key)).filter((l) => {
    const k = gearKeyFor(l.key) || l.key;
    if (ownedSeen.has(k)) return false;
    ownedSeen.add(k);
    return true;
  }).map((l) => l.item);
  lastHousehold = view;
  const el = $("#results");
  if (!hh.plans.length) {
    el.innerHTML = `<div class="empty"><p>Fill in sex, age, height and weight for at least one person, and the daily amounts and shopping list will appear here.</p></div>`;
    return;
  }
  const incomplete = hh.invalidCount > 0
    ? `<p class="incomplete">${hh.invalidCount} ${hh.invalidCount === 1 ? "person isn't" : "people aren't"} included yet. Finish their details above.</p>` : "";
  el.innerHTML = `
    <div class="print-meta">
      <p>${esc(planSummary(hh))} Made ${todayText()} at ${SITE_URL.replace("https://", "")}. Prices checked ${PRICES_CHECKED}.</p>
    </div>
    <div class="results-head">
      <h2 class="section-title">Daily amounts</h2>
      ${reportActions("top")}
    </div>
    ${incomplete}
    <p class="results-intro">Measure dry food with level cups and spoons. Each card shows one person's day.</p>
    <div class="cards">${hh.plans.map((pl) => card(pl, hh)).join("")}</div>
    ${shoppingSection(view, allLines)}
    ${printGearSection(hh)}
    ${moreSection(hh)}
    <div class="report-foot">
      <p>Keep a paper copy. Print the whole report, or save it as a PDF to print later.</p>
      ${reportActions("bottom")}
    </div>
  `;
}

// ---------- print and PDF ----------

let lastHousehold = null;
let allLines = [];
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
      // Resolved from this file, so the page can live anywhere.
      await loadScript(new URL("../vendor/pdfmake/pdfmake.min.js", import.meta.url).href);
      await loadScript(new URL("../vendor/pdfmake/vfs_fonts.js", import.meta.url).href);
      return window.pdfMake;
    })();
    pdfLib.catch(() => { pdfLib = null; });
  }
  return pdfLib;
}

async function downloadPdf(button) {
  if (!lastHousehold || !lastHousehold.plans.length) return;
  const status = button.parentElement.querySelector(".pdf-status");
  const label = button.textContent;
  button.disabled = true;
  button.textContent = "Making the PDF…";
  status.textContent = "";
  try {
    const [pdfMake, { buildPdf }] = await Promise.all([loadPdfLib(), import("./pdf.js")]);
    const doc = buildPdf(lastHousehold, { date: todayText() });
    await pdfMake.createPdf(doc).download(`prep-plan-${new Date().toISOString().slice(0, 10)}.pdf`);
    status.textContent = "PDF downloaded.";
  } catch (err) {
    console.error(err);
    status.textContent = "The PDF didn't download. Use Print the full report and choose Save as PDF instead.";
  } finally {
    button.disabled = false;
    button.textContent = label;
  }
}

// ---------- events ----------

// Printing shows everything: open the folded guides and "Gear you're not buying" items for the
// printout, then close them again. (The "Why?" rows are shown by the print CSS.)
let printOpened = [];
let printing = false;
window.addEventListener("beforeprint", () => {
  if (printing) return; // some browsers fire it twice
  printing = true;
  printOpened = [...document.querySelectorAll("#results details:not([open])")];
  printOpened.forEach((d) => { d.open = true; });
});
window.addEventListener("afterprint", () => {
  if (!printing) return;
  printOpened.forEach((d) => { d.open = false; });
  printOpened = [];
  setTimeout(() => { printing = false; }); // after the toggle events from closing them
});

function init() {
  $("#prices-date").textContent = PRICES_CHECKED;
  $("#months").innerHTML = Array.from({ length: 12 }, (_, i) => i + 1)
    .map((m) => `<option value="${m}"${m === Number(state.months) ? " selected" : ""}>${m} month${m > 1 ? "s" : ""}</option>`).join("");
  $("#reserve").value = String(state.reserve);
  $("#store").innerHTML = Object.entries(STORE_PLANS)
    .map(([k, sp]) => `<option value="${k}"${k === state.store ? " selected" : ""}>${sp.choice}</option>`).join("");

  $("#months").addEventListener("change", (e) => { state.months = Number(e.target.value); save(); scheduleRender(); });
  $("#reserve").addEventListener("change", (e) => { state.reserve = Number(e.target.value); save(); scheduleRender(); });
  $("#store").addEventListener("change", (e) => { state.store = e.target.value; save(); scheduleRender(); });
  // "Already have" tick boxes and the bathtub water choice, in the shopping list rows.
  $("#results").addEventListener("change", (e) => {
    const t = e.target;
    let focus = null;
    if (t.name === "tub") { state.tub = t.value; focus = `input[name="tub"][value="${t.value}"]`; }
    else if (t.dataset.own) { setOwned(t.dataset.own, t.checked); focus = `[data-own="${t.dataset.own}"]`; }
    else return;
    save(); renderResults();
    $(focus)?.focus({ preventScroll: true });
  });

  $("#results").addEventListener("toggle", (e) => {
    const id = e.target.dataset?.more;
    if (!id || printing) return;
    if (e.target.open) openMore.add(id); else openMore.delete(id);
  }, true);

  $("#results").addEventListener("click", (e) => {
    const goalBtn = e.target.closest("[data-goal]");
    if (goalBtn) {
      const raw = state.people.find((p) => p.id === goalBtn.dataset.goalId);
      if (!raw) return;
      const goal = goalBtn.dataset.goal;
      raw.keepWeight = goal === "keep";
      save(); renderResults();
      $(`[data-goal-id="${CSS.escape(raw.id)}"][data-goal="${goal}"]`)?.focus({ preventScroll: true });
      return;
    }
    const whyBtn = e.target.closest("[data-why]");
    if (whyBtn) {
      const key = whyBtn.dataset.why;
      const row = document.getElementById(`why-${key}`);
      const open = whyBtn.getAttribute("aria-expanded") !== "true";
      whyBtn.setAttribute("aria-expanded", String(open));
      whyBtn.textContent = open ? "Hide" : "Why?";
      row.hidden = !open;
      if (open) openWhy.add(key); else openWhy.delete(key);
      return;
    }
    if (e.target.closest("[data-print]")) window.print();
    const pdfBtn = e.target.closest("[data-pdf]");
    if (pdfBtn) downloadPdf(pdfBtn);
    if (e.target.closest("[data-switch-store]")) {
      state.store = state.store === "costco" ? "walmart" : "costco";
      $("#store").value = state.store;
      save(); renderResults();
      $("#shop-title")?.scrollIntoView({ block: "start" });
    }
  });

  const people = $("#people");
  people.addEventListener("input", (e) => {
    const fs = e.target.closest("fieldset.person");
    if (!fs) return;
    const raw = state.people.find((p) => p.id === fs.dataset.id);
    if (!raw) return;
    if (e.target.dataset.k) raw[e.target.dataset.k] = e.target.value;
    if (e.target.dataset.k === "age") {
      const baby = raw.age === "0";
      fs.querySelectorAll("[data-baby]").forEach((el) => { el.hidden = !baby; });
      fs.querySelectorAll("[data-not-baby]").forEach((el) => { el.hidden = baby; });
    }
    if (e.target.dataset.k === "activity") {
      const hint = $("[data-activity-hint]", fs);
      if (hint) hint.textContent = `${ACTIVITY[raw.activity]?.hint || ""}. Unsure? Pick one level above today.`;
    }
    if (e.target.dataset.flag) raw.flags = { ...raw.flags, [e.target.dataset.flag]: e.target.checked };
    save();
    updateErrors();
    scheduleRender();
  });
  people.addEventListener("click", (e) => {
    const nurseId = e.target.closest("[data-nurse]")?.dataset.nurse;
    if (nurseId) {
      const mom = state.people.find((p) => p.id === nurseId);
      if (mom) mom.flags = { ...mom.flags, breastfeeding: true };
      save(); renderPeople(); scheduleRender();
      return;
    }
    const id = e.target.dataset?.remove;
    if (!id) return;
    state.people = state.people.filter((p) => p.id !== id);
    if (!state.people.length) state.people.push(blankPerson());
    save(); renderPeople(); scheduleRender();
  });

  $("#add-person").addEventListener("click", () => {
    state.people.push(blankPerson());
    save(); renderPeople(); scheduleRender();
    const last = document.querySelector("fieldset.person:last-of-type input[data-k='name']");
    if (last) last.focus();
  });
  $("#example").addEventListener("click", () => {
    state.people = EXAMPLE.map((p) => ({ ...p, id: newId() }));
    save(); renderPeople(); renderResults();
  });
  $("#clear").addEventListener("click", () => {
    state.people = [blankPerson()];
    save(); renderPeople(); renderResults();
  });

  renderPeople();
  renderResults();
}

init();
