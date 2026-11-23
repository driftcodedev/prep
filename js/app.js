import { ACTIVITY, PRICES_CHECKED, COSTCO_MEMBERSHIP, LB_PER_BUCKET } from "./data.js";
import { planHousehold, validatePerson, cupsText, spoonText, fraction } from "./calc.js";

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
const money = (x) => x.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const num = (x) => Math.round(x).toLocaleString("en-US");
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const blankPerson = () => ({ id: newId(), name: "", sex: "", age: "", ft: "", inch: "", weight: "", activity: "light", flags: {} });

const EXAMPLE = [
  { name: "Sam", sex: "male", age: "34", ft: "5", inch: "10", weight: "210", activity: "light", flags: {} },
  { name: "Jo", sex: "female", age: "33", ft: "5", inch: "5", weight: "150", activity: "light", flags: {} },
  { name: "Ava", sex: "female", age: "6", ft: "3", inch: "10", weight: "46", activity: "moderate", flags: {} },
  { name: "Leo", sex: "male", age: "1", ft: "2", inch: "6", weight: "22", activity: "light", flags: {} },
];

let state = load() || { months: 6, reserve: 20, hasScale: false, people: [blankPerson()] };

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
  const ft = n(raw.ft), inch = raw.inch === "" ? 0 : n(raw.inch);
  return {
    name: raw.name.trim() || `Person ${i + 1}`,
    sex: raw.sex,
    age: n(raw.age),
    heightIn: Number.isFinite(ft) ? ft * 12 + (Number.isFinite(inch) ? inch : 0) : NaN,
    weightLb: n(raw.weight),
    activity: raw.activity,
    flags: raw.flags || {},
  };
}

// ---------- the form ----------

function activityOptions(selected) {
  return Object.entries(ACTIVITY)
    .map(([k, a]) => `<option value="${k}"${k === selected ? " selected" : ""}>${a.label}</option>`)
    .join("");
}

function personFieldset(raw, i) {
  const id = raw.id;
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
      <label class="field f-age"><span class="field-label">Age</span>
        <input type="number" inputmode="numeric" min="1" max="110" step="1" data-k="age" value="${esc(raw.age)}"></label>
      <div class="field f-height" role="group" aria-labelledby="h-${id}"><span class="field-label" id="h-${id}">Height</span>
        <div class="pair">
          <span class="unit-input"><input type="number" inputmode="numeric" min="1" max="8" data-k="ft" value="${esc(raw.ft)}" aria-label="Feet"><span class="unit">ft</span></span>
          <span class="unit-input"><input type="number" inputmode="numeric" min="0" max="11" data-k="inch" value="${esc(raw.inch)}" aria-label="Inches"><span class="unit">in</span></span>
        </div></div>
      <label class="field f-weight"><span class="field-label">Weight</span>
        <span class="unit-input"><input type="number" inputmode="decimal" min="15" max="600" data-k="weight" value="${esc(raw.weight)}"><span class="unit">lb</span></span></label>
      <label class="field f-activity"><span class="field-label">Activity during an outage</span>
        <select data-k="activity" aria-describedby="a-${id}">${activityOptions(raw.activity)}</select>
        <span class="field-hint" id="a-${id}" data-activity-hint>${esc(ACTIVITY[raw.activity]?.hint || "")}. Unsure? Pick one level above today.</span></label>
    </div>
    <div class="person-foot">
      <details class="special"${anyFlag ? " open" : ""}><summary>Special situations</summary><div class="flags">${flagBoxes}</div></details>
      <button type="button" class="btn-link remove" data-remove="${id}">Remove ${esc(raw.name.trim() || `person ${i + 1}`)}</button>
    </div>
    <p class="person-error" data-error></p>
  </fieldset>`;
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

function statusLine(pl) {
  switch (pl.mode) {
    case "lose": return `Lose to ${pl.goalLb} lb, then hold there`;
    case "gain": return `Gain to ${pl.goalLb} lb, then hold there`;
    case "child": return "Growing child: no dieting";
    case "pregnant": return "Pregnant: no weight loss, extra food";
    case "breastfeeding": return "Breastfeeding: no weight loss, extra food";
    default: return "Hold current weight";
  }
}

function milkText(r) {
  if (r.whole > 0) return `${fraction(r.whole)} cups whole milk (¼ cup powder per cup of water)`;
  if (r.milk > 0) return `${fraction(r.milk)} cup${r.milk > 1 ? "s" : ""} milk (⅓ cup powder per cup of water)`;
  return "none";
}

function row(label, glyphHtml, amount, sub = "") {
  return `<div class="scoop-row"><span class="scoop-food">${label}${sub ? `<small>${sub}</small>` : ""}</span><span class="scoop-glyphs">${glyphHtml}</span><span class="scoop-amount">${amount}</span></div>`;
}

function card(pl, hh) {
  const p = pl.person;
  const r = pl.phase1;
  const rows = [
    row("Rice", glyphs(r.rice, "cup"), cupsText(r.rice), "dry"),
    row("Pinto beans", glyphs(r.beans, "cup"), cupsText(r.beans), "dry"),
    row("Rolled oats", glyphs(r.oats, "cup"), cupsText(r.oats), "dry"),
    r.pb > 0 ? row("Peanut butter", glyphs(r.pb, "spoon"), spoonText(r.pb, "tbsp"), "level") : "",
    row("Vegetable oil", glyphs(r.oil, "spoon"), spoonText(r.oil, "tbsp")),
    row("Dry milk", "", milkText(r)),
    row("Iodized salt", "", r.salt > 0 ? spoonText(r.salt, "tsp") : "none added"),
    row("Vitamin", "", pl.supplement.text),
  ].join("");

  const facts = [];
  facts.push(`<p class="card-energy">About ${num(pl.phase1Kcal)} calories and ${num(pl.phase1Protein)} g of protein a day. Needs at least ${num(pl.proteinNeed)} g of protein.</p>`);

  const notes = [];
  if (pl.mode === "lose" || pl.mode === "gain") {
    notes.push(`<li>At ${pl.goalLb} lb, switch to ${cupsText(pl.hold.rice)} of rice and ${spoonText(pl.hold.oil, "tbsp")} of oil, about ${num(pl.holdKcal)} calories.</li>`);
  }
  if (pl.mode === "lose") {
    notes.push(pl.minRice < pl.phase1.rice
      ? `<li>If you lose less than ½ lb a week after week 4, drop to ${cupsText(pl.minRice)} of rice. Never go lower.</li>`
      : `<li>This is already the lowest safe amount. Don't cut the rice further.</li>`);
    notes.push(pl.sim.reachedDay
      ? `<li>Expected to reach ${pl.goalLb} lb in about ${Math.round(pl.sim.reachedDay / 7)} weeks.</li>`
      : `<li>Expected weight after ${hh.months} month${hh.months > 1 ? "s" : ""}: about ${Math.round(pl.sim.endLb)} lb.</li>`);
  }
  if (pl.mode === "gain") {
    notes.push(pl.sim.reachedDay
      ? `<li>Expected to reach ${pl.goalLb} lb in about ${Math.round(pl.sim.reachedDay / 7)} weeks.</li>`
      : `<li>Expected weight after ${hh.months} months: about ${Math.round(pl.sim.endLb)} lb.</li>`);
  }

  const warnings = pl.warnings.length ? `<ul class="card-warnings">${pl.warnings.map((w) => `<li>${esc(w)}</li>`).join("")}</ul>` : "";

  return `
  <article class="ration-card">
    <header class="card-head">
      <h3 class="card-name">${esc(p.name)}</h3>
      <p class="card-status">${statusLine(pl)}</p>
    </header>
    ${facts.join("")}
    <div class="scoops" role="table" aria-label="${esc(p.name)}'s daily amounts">${rows}</div>
    ${notes.length ? `<ul class="card-notes">${notes.join("")}</ul>` : ""}
    ${warnings}
  </article>`;
}

function cookingSection(hh) {
  const c = hh.cook;
  const rowsHtml = hh.plans.map((pl, i) => {
    const s = hh.shares[i];
    const riceCooked = Math.round(s.riceCooked * 4) / 4;
    const beansCooked = Math.round(s.beansCooked * 4) / 4;
    return `<tr><th scope="row">${esc(pl.person.name)}</th><td>${riceCooked > 0 ? cupsText(riceCooked) : "none"}</td><td>${beansCooked > 0 ? cupsText(beansCooked) : "none"}</td><td>${cupsText(pl.phase1.oats)} dry</td></tr>`;
  }).join("");
  const milkBits = [];
  if (c.milk > 0) milkBits.push(`${fraction(c.milk)} cups of nonfat milk (${cupsText(c.milk / 3)} powder)`);
  if (c.whole > 0) milkBits.push(`${fraction(c.whole)} cups of whole milk for the under-2s (${cupsText(c.whole / 4)} powder)`);
  return `
  <section class="block" aria-labelledby="cook-title">
    <h2 id="cook-title" class="section-title">Cooking for everyone</h2>
    <p>Each day, cook <strong>${cupsText(c.rice)} of dry rice</strong> and <strong>${cupsText(c.beans)} of dry beans</strong> for the whole household, then serve each person their share. Cooked rice is roughly three times its dry volume and beans about two and a half times, so the cooked amounts below are close, not exact.</p>
    <div class="table-scroll"><table class="data">
      <thead><tr><th scope="col">Person</th><th scope="col">Cooked rice</th><th scope="col">Cooked beans</th><th scope="col">Oats</th></tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table></div>
    ${milkBits.length ? `<p>Mix ${milkBits.join(" and ")} a day.</p>` : ""}
    <p class="muted">Cook without salt and let each person salt their own bowl, so small children get little or none. Amounts change when someone reaches their goal weight; their card shows the new amounts.</p>
  </section>`;
}

function shoppingSection(hh) {
  const groups = [["Costco", "Costco warehouse trip"], ["Amazon", "Amazon order"]];
  const tables = groups.map(([store, title]) => {
    const lines = hh.lines.filter((l) => l.store === store);
    if (!lines.length) return "";
    const body = lines.map((l) => `
      <tr>
        <th scope="row"><a href="${l.url}" target="_blank" rel="noopener">${esc(l.item)}</a></th>
        <td>${esc(l.pack)}</td>
        <td class="num">${l.qty}</td>
        <td>${esc(l.amountText)}</td>
        <td class="num">${money(l.cost)}${l.priceNote ? `<small>${esc(l.priceNote)} each</small>` : ""}</td>
      </tr>`).join("");
    return `
    <h3 class="sub-title">${title} <span class="sub-total">${money(hh.byStore[store] || 0)}</span></h3>
    <div class="table-scroll"><table class="data shop">
      <thead><tr><th scope="col">Item</th><th scope="col">Buy</th><th scope="col" class="num">How many</th><th scope="col">Covers</th><th scope="col" class="num">Cost</th></tr></thead>
      <tbody>${body}</tbody>
    </table></div>`;
  }).join("");

  const beans = hh.lines.find((l) => l.key === "beans");
  const milk = hh.lines.find((l) => l.key === "milk");
  const notes = [
    `Costco prices are warehouse prices and vary a little by location. The total leaves out the ${money(COSTCO_MEMBERSHIP)} Costco membership.`,
    "Amazon's Subscribe &amp; Save takes about 15% off the beans, peanut butter and oil. You can cancel after the first delivery.",
  ];
  if (beans && beans.qty > 40) notes.push(`That's ${beans.qty} one-pound bags of beans. Amazon may limit how many fit in one order, so split it up if needed. If your Costco stocks 25-lb pinto bags ($17–21 where sold), those cost less.`);
  if (milk && milk.qty >= 3) notes.push("Costco's Saco Mix'n Drink 8-lb bag of nonfat dry milk makes 40 quarts for about $35.49–35.99 where it's stocked, which is cheaper per cup than the Amazon bag.");
  notes.push(`Seal the rice and beans in mylar bags with an oxygen absorber, one bag per bucket. The list assumes about ${LB_PER_BUCKET} lb per bucket.`);

  return `
  <section class="block shopping" aria-labelledby="shop-title">
    <h2 id="shop-title" class="section-title">Shopping list</h2>
    <p class="shop-summary">Everything for ${hh.plans.length} ${hh.plans.length === 1 ? "person" : "people"} for ${hh.months} month${hh.months > 1 ? "s" : ""}${hh.reservePct ? `, plus a ${hh.reservePct}% margin` : ""}: <strong>${money(hh.total)}</strong>.</p>
    ${tables}
    <ul class="notes">${notes.map((n) => `<li>${n}</li>`).join("")}</ul>
  </section>`;
}

function rulesSection(hh) {
  const hasAdults = hh.plans.some((pl) => !pl.isChild);
  const hasKids = hh.plans.some((pl) => pl.isChild);
  return `
  <section class="block" aria-labelledby="rules-title">
    <h2 id="rules-title" class="section-title">Weekly weigh-in</h2>
    <p>The calorie numbers are estimates. The bathroom scale tells you what's really happening, so weigh at the same time each week, after the same morning routine, and adjust.</p>
    ${hasAdults ? `
    <div class="table-scroll"><table class="data rules">
      <thead><tr><th scope="col">If you're</th><th scope="col">And the scale shows</th><th scope="col">Do this</th></tr></thead>
      <tbody>
        <tr><td>Losing weight</td><td>More than 2 lb lost in a week, after week 2</td><td>Add ¼ cup of rice a day</td></tr>
        <tr><td>Losing weight</td><td>Less than ½ lb lost in a week, after week 4</td><td>Remove ¼ cup of rice, but never go below the lowest amount on your card</td></tr>
        <tr><td>Losing weight</td><td>You're within a pound or two of your goal</td><td>Switch to the hold amounts on your card</td></tr>
        <tr><td>Holding weight</td><td>Still losing</td><td>Add ¼ cup of rice each week until your weight holds</td></tr>
        <tr><td>Holding weight</td><td>Gaining</td><td>Remove ¼ cup of rice</td></tr>
      </tbody>
    </table></div>` : ""}
    ${hasKids ? `<p>Weigh children every two weeks. For a child too small to stand on the scale, weigh yourself holding them and subtract your own weight. Children should hold steady or gain. If a child loses weight, add 2 tablespoons of rice or another ½ cup of milk a day.</p>` : ""}
  </section>`;
}

function careSection() {
  return `
  <section class="block" aria-labelledby="care-title">
    <h2 id="care-title" class="section-title">Cooking and storage</h2>
    <ul class="plain">
      <li><strong>Beans:</strong> soak overnight in plenty of water (10 cups per 2 cups of beans), drain, then cook in fresh water. Boil hard for at least 10 minutes, 30 to be safe, before simmering 1½–2 hours. A pressure cooker saves a lot of fuel.</li>
      <li><strong>Start the beans now:</strong> build up to each person's full amount over two to three weeks so stomachs can adjust.</li>
      <li><strong>Rice:</strong> don't rinse it. Rinsing washes off the added iron and B vitamins.</li>
      <li><strong>Water and fuel:</strong> plan on about 3 quarts of cooking water per adult per day, plus drinking water and enough fuel to boil it.</li>
      <li><strong>Vitamins every day:</strong> rice and beans have no vitamin C, and scurvy can start after about four weeks without it. Keep the vitamin C bottle as a backup.</li>
      <li><strong>Keep your muscle:</strong> push-ups, squats and lunges two or three times a week help anyone who is losing weight hold onto muscle.</li>
      <li><strong>Storage:</strong> rice and beans sealed in mylar with an oxygen absorber keep for decades. Oil, peanut butter, oats, dry milk and vitamins keep about a year, so replace them yearly.</li>
      <li><strong>Print this page:</strong> a phone or laptop won't help once the batteries die.</li>
    </ul>
  </section>`;
}

function aboutSection() {
  return `
  <section class="block about" aria-labelledby="about-title">
    <h2 id="about-title" class="section-title">How the numbers are worked out</h2>
    <ul class="plain">
      <li><strong>Healthy weight:</strong> adults above the CDC's healthy range (BMI 18.5–24.9) are planned down to BMI 24.4, the top of that range. Below it, they're planned up to BMI 18.5.</li>
      <li><strong>Adult calories:</strong> the Mifflin-St Jeor equation times an activity factor. Weight-loss rations are 500 calories below maintenance and never under 1,500 for men or 1,200 for women.</li>
      <li><strong>Children:</strong> the National Academies' 2023 energy equations, with no weight loss. Under-2s get whole milk, and milk amounts follow the American Academy of Pediatrics.</li>
      <li><strong>Pregnancy and breastfeeding:</strong> no weight loss, about 350 extra calories when pregnant and 400 when breastfeeding.</li>
      <li><strong>Shopping list:</strong> a day-by-day weight model for each adult that follows the weekly weigh-in rules, plus the margin you chose, rounded up to whole packages.</li>
      <li><strong>Food values:</strong> USDA data for rice, beans and peanut butter, and package labels for oats and milk.</li>
    </ul>
    <p class="sources">Sources:
      <a href="https://www.cdc.gov/bmi/adult-calculator/calculator.html" target="_blank" rel="noopener">CDC adult BMI</a>,
      <a href="https://www.nationalacademies.org/read/26818/chapter/2" target="_blank" rel="noopener">National Academies energy equations (2023)</a>,
      <a href="https://www.health.harvard.edu/staying-healthy/calorie-deficit-explained-is-it-a-safe-sustainable-approach-to-weight-loss" target="_blank" rel="noopener">Harvard Health on calorie deficits</a>,
      <a href="https://healthychildren.org/English/healthy-living/nutrition/Pages/recommended-drinks-for-young-children-ages-0-5.aspx" target="_blank" rel="noopener">AAP drinks for young children</a>,
      <a href="https://tools.myfooddata.com/nutrition-facts/175199/wt1" target="_blank" rel="noopener">USDA pinto beans</a>,
      <a href="https://tools.myfooddata.com/nutrition-comparison/168877/wt1" target="_blank" rel="noopener">USDA rice</a>,
      <a href="https://cfaes.osu.edu/news/articles/chow-line-dry-kidney-beans-need-be-boiled" target="_blank" rel="noopener">Ohio State on boiling beans</a>,
      <a href="https://extension.umaine.edu/food-health/2021/09/02/how-to-store-and-cook-dried-beans/" target="_blank" rel="noopener">University of Maine on dried beans</a>.
    </p>
    <p class="muted">These are estimates for healthy people, not medical advice. Anyone with a medical condition, a pregnancy or a daily medication should check with a doctor before starting a weight-loss ration.</p>
  </section>`;
}

let renderTimer = null;
function scheduleRender() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(renderResults, 120);
}

function renderResults() {
  const people = state.people.map(toPerson);
  const hh = planHousehold({ months: state.months, reservePct: state.reserve, hasScale: state.hasScale, people });
  const el = $("#results");
  if (!hh.plans.length) {
    el.innerHTML = `<div class="empty"><p>Fill in sex, age, height and weight for at least one person, and the daily amounts and shopping list will appear here.</p></div>`;
    return;
  }
  const incomplete = hh.invalidCount > 0
    ? `<p class="incomplete">${hh.invalidCount} ${hh.invalidCount === 1 ? "person isn't" : "people aren't"} included yet. Finish their details above.</p>` : "";
  el.innerHTML = `
    <div class="results-head">
      <h2 class="section-title">Daily amounts</h2>
      <button type="button" class="btn" id="print">Print cards and shopping list</button>
    </div>
    ${incomplete}
    <p class="results-intro">Measure dry food with level cups and spoons. Each card shows one person's day.</p>
    <div class="cards">${hh.plans.map((pl) => card(pl, hh)).join("")}</div>
    ${cookingSection(hh)}
    ${shoppingSection(hh)}
    ${rulesSection(hh)}
    ${careSection()}
    ${aboutSection()}
  `;
  $("#print").addEventListener("click", () => window.print());
}

// ---------- events ----------

function init() {
  $("#prices-date").textContent = PRICES_CHECKED;
  $("#months").innerHTML = Array.from({ length: 12 }, (_, i) => i + 1)
    .map((m) => `<option value="${m}"${m === Number(state.months) ? " selected" : ""}>${m} month${m > 1 ? "s" : ""}</option>`).join("");
  $("#reserve").value = String(state.reserve);
  $("#has-scale").checked = !!state.hasScale;

  $("#months").addEventListener("change", (e) => { state.months = Number(e.target.value); save(); scheduleRender(); });
  $("#reserve").addEventListener("change", (e) => { state.reserve = Number(e.target.value); save(); scheduleRender(); });
  $("#has-scale").addEventListener("change", (e) => { state.hasScale = e.target.checked; save(); scheduleRender(); });

  const people = $("#people");
  people.addEventListener("input", (e) => {
    const fs = e.target.closest("fieldset.person");
    if (!fs) return;
    const raw = state.people.find((p) => p.id === fs.dataset.id);
    if (!raw) return;
    if (e.target.dataset.k) raw[e.target.dataset.k] = e.target.value;
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
