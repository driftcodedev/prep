import { test } from "node:test";
import assert from "node:assert/strict";
import { splitRounded, planPerson, planHousehold, childEER, adultMaintenance, toKg, cupsText, validatePerson, strawPacks, waterCups, waterUse, infantDay } from "../js/calc.js";
import { buildPdf } from "../js/pdf.js";

const brett = { name: "Brett", sex: "male", age: 30, heightIn: 72, weightLb: 200, activity: "light", flags: {} };

test("Brett reproduces the report's rations", () => {
  const pl = planPerson(brett, 182);
  assert.equal(pl.mode, "lose");
  assert.equal(pl.goalLb, 180);
  assert.equal(pl.phase1.rice, 1.25);
  assert.equal(pl.phase1.beans, 1);
  assert.equal(pl.phase1.oil, 2);
  assert.equal(Math.round(pl.phase1Kcal), 2174);
  assert.equal(Math.round(pl.phase1Protein), 78);
  assert.equal(pl.hold.rice, 1.75);
  assert.equal(Math.round(pl.holdKcal), 2631);
  assert.equal(pl.minRice, 1);
  // At "light" activity he is still losing at the end of six months.
  assert.ok(pl.sim.endLb > 179 && pl.sim.endLb < 183, `end ${pl.sim.endLb}`);
});

test("Maintenance at 180 lb, light activity, is about 2,495", () => {
  assert.equal(Math.round(adultMaintenance(brett, toKg(180))), 2495);
});

test("Child equations match the 2023 DRI", () => {
  // 1-year-old boy, 30 in, 22 lb: -716.45 - 1 + 17.82*76.2 + 15.06*9.98 + 20
  const boy = { sex: "male", age: 1, heightIn: 30, weightLb: 22, activity: "light" };
  assert.equal(Math.round(childEER(boy)), Math.round(-716.45 - 1 + 17.82 * 76.2 + 15.06 * toKg(22) + 20));
  const girl = { sex: "female", age: 2, heightIn: 34, weightLb: 27, activity: "light" };
  assert.equal(Math.round(childEER(girl)), Math.round(-69.15 + 160 + 2.65 * 86.36 + 54.15 * toKg(27) + 15));
  const teen = { sex: "female", age: 15, heightIn: 64, weightLb: 120, activity: "light" };
  assert.equal(Math.round(childEER(teen)), Math.round(-297.54 - 22.25 * 15 + 12.77 * 162.56 + 14.73 * toKg(120) + 20));
});

test("Toddler gets whole milk and drops, no dieting", () => {
  const pl = planPerson({ name: "Baby", sex: "male", age: 1, heightIn: 30, weightLb: 22, activity: "light", flags: {} }, 182);
  assert.equal(pl.mode, "child");
  assert.equal(pl.phase1.whole, 2);
  assert.equal(pl.phase1.milk, 0);
  assert.equal(pl.supplement.key, "drops");
  assert.ok(pl.phase1Kcal > 650 && pl.phase1Kcal < 1000, `kcal ${pl.phase1Kcal}`);
});

test("Peanut allergy removes peanut butter", () => {
  const pl = planPerson({ ...brett, flags: { peanut: true } }, 182);
  assert.equal(pl.phase1.pb, 0);
  assert.equal(pl.phase1.oil, 3);
});

test("Small woman stays at or above 1,200 kcal", () => {
  const pl = planPerson({ name: "A", sex: "female", age: 40, heightIn: 60, weightLb: 160, activity: "sedentary", flags: {} }, 182);
  assert.equal(pl.mode, "lose");
  assert.ok(pl.phase1Kcal >= 1200);
  assert.ok(pl.floorKcal >= 1200);
});

test("Pregnant women never get a loss ration", () => {
  const pl = planPerson({ name: "B", sex: "female", age: 28, heightIn: 65, weightLb: 190, activity: "light", flags: { pregnant: true } }, 182);
  assert.equal(pl.mode, "pregnant");
  assert.equal(pl.phase1.milk, 2);
});

test("Household shopping list adds up", () => {
  const hh = planHousehold({ months: 6, reservePct: 20, hasScale: false, people: [brett] });
  const rice = hh.lines.find((l) => l.key === "rice");
  assert.equal(rice.qty, 3);
  const buckets = hh.lines.find((l) => l.key === "buckets");
  assert.ok(buckets.qty >= 1);
  // Food and storage, then the one-time gear (fire, water and cooking).
  const food = hh.total - hh.byGroup.gear;
  assert.ok(food > 200 && food < 600, `food and storage ${food}`);
  assert.ok(hh.byGroup.gear > 400 && hh.byGroup.gear < 700, `gear ${hh.byGroup.gear}`);
});

test("Validation: babies of any length are fine, missing fields are caught", () => {
  // A newborn with no length entered, and one 12 inches long.
  assert.equal(validatePerson({ sex: "male", age: 0, heightIn: NaN, weightLb: 7, activity: "light", feeding: "formula" }).length, 0);
  assert.equal(validatePerson({ sex: "female", age: 0, heightIn: 12, weightLb: 5, activity: "light", feeding: "breast" }).length, 0);
  assert.ok(validatePerson({ sex: "male", age: 0, heightIn: NaN, weightLb: 2, activity: "light" }).length > 0);
  // A newborn typed in as age 1 gets pointed to age 0.
  assert.match(validatePerson({ sex: "male", age: 1, heightIn: 12, weightLb: 10, activity: "light" })[0], /set the age to 0/);
  assert.equal(validatePerson(brett).length, 0);
});

test("Cup text is easy to measure", () => {
  assert.equal(cupsText(1.25), "1¼ cups");
  assert.equal(cupsText(0.375), "¼ cup + 2 tbsp");
  assert.equal(cupsText(0.125), "2 tbsp");
  assert.equal(cupsText(0.5), "½ cup");
});

test("LifeStraw packs: cheapest mix, one straw each, spare only when cheap", () => {
  const ks = (n) => strawPacks(n).packs.map((p) => `${p.qty}x${p.key}`).join("+");
  assert.equal(ks(1), "1xstraw1");
  assert.equal(ks(2), "1xstraw3"); // a spare for $3.09 more than two singles
  assert.equal(ks(3), "1xstraw3");
  assert.equal(ks(4), "1xstraw3+1xstraw1");
  for (let n = 1; n <= 12; n++) {
    const r = strawPacks(n);
    assert.ok(r.straws >= n && r.straws <= n + 1, `n=${n} straws=${r.straws}`);
  }
});

test("Gear goes on the list unless the household already has it", () => {
  const kids = [brett, { name: "T", sex: "female", age: 2, heightIn: 34, weightLb: 27, activity: "light", flags: {} }];
  const hh = planHousehold({ months: 6, people: kids });
  const keys = hh.lines.map((l) => l.key);
  assert.ok(["lighters", "axe", "pot", "tripod", "disc"].every((k) => keys.includes(k)));
  // The 2-year-old is too young for a straw, so Brett gets a single.
  assert.equal(hh.lines.find((l) => l.key === "straw1").qty, 1);
  const owned = planHousehold({ months: 6, people: kids, owned: { lighters: true, filters: true, axe: true, scale: true, bladder: true, diverter: true, timer: true, pot: true, tripod: true, disc: true } });
  assert.ok(!owned.lines.some((l) => l.group === "gear" || l.key === "scale"));
});

test("Walmart plan needs no Costco and keeps the same food amounts", () => {
  const c = planHousehold({ months: 6, people: [brett], store: "costco" });
  const w = planHousehold({ months: 6, people: [brett], store: "walmart" });
  assert.ok(!w.lines.some((l) => l.store === "Costco"));
  assert.equal(w.lines.find((l) => l.key === "rice").store, "Walmart");
  assert.equal(c.lines.find((l) => l.key === "rice").amountText, w.lines.find((l) => l.key === "rice").amountText);
  assert.equal(Math.round(c.other.total), Math.round(w.total));
  for (const l of [...c.lines, ...w.lines]) assert.ok(l.url.startsWith("https://") && l.price > 0, l.key);
});

test("Drinking water: ½ gallon for adults, less for small children", () => {
  assert.equal(waterCups(brett), 8);
  assert.equal(waterCups({ sex: "male", age: 1, flags: {} }), 4);
  assert.equal(waterCups({ sex: "female", age: 30, flags: { breastfeeding: true } }), 13);
});

test("PDF definition covers the whole report and avoids missing glyphs", () => {
  const hh = planHousehold({ months: 6, people: [brett, { name: "Kid", sex: "male", age: 1, heightIn: 30, weightLb: 22, activity: "light", flags: {} }] });
  const doc = buildPdf(hh, { date: "November 23, 2026" });
  const text = JSON.stringify(doc.content);
  for (const heading of ["Daily amounts", "Cooking for everyone", "Cooking over a fire", "Shopping list", "Fire, water and cooking", "Weekly weigh-in", "Cooking and storage", "How the numbers are worked out"]) {
    assert.ok(text.includes(heading), heading);
  }
  assert.ok(!/[⅓⅔]/.test(text));
});

test("Water: Brett uses about 1.3 gallons a day, so a waterBOB lasts about 11 weeks", () => {
  const big = { ...brett, weightLb: 220 };
  const pl = planPerson(big, 182);
  const w = waterUse(pl);
  // 8 to drink; rice 1½ × 2 + oats ½ × 2 + milk 1 + beans 1 × 3 = 8 to cook; beans 1 × 5 to soak
  assert.deepEqual([w.drink, w.cook, w.soak], [8, 8, 5]);
  const hh = planHousehold({ months: 6, people: [big] });
  assert.equal(Math.round(hh.gear.bladderDays), 76);
  assert.ok(hh.lines.some((l) => l.key === "diverter" && l.store === "Home Depot"));
  assert.ok(hh.lines.some((l) => l.key === "timer" && l.price > 0));
});

test("Young children's milk water isn't counted twice", () => {
  const pl = planPerson({ name: "Leo", sex: "male", age: 1, heightIn: 30, weightLb: 22, activity: "light", flags: {} }, 182);
  const w = waterUse(pl);
  assert.equal(w.drink, 2); // 4 cups including 2 cups of milk
});

test("Newborn on formula: 2½ oz per pound, capped at 32 oz, with vitamin D until 32 oz", () => {
  assert.equal(infantDay(0, 8, "formula").formula, 20);
  assert.equal(infantDay(3, 14, "formula").formula, 32);
  assert.equal(infantDay(3, 14, "formula").dropsD, 0);
  assert.equal(infantDay(0, 8, "formula").dropsD, 1);
  assert.equal(infantDay(0, 8, "breast").formula, 0);
  assert.equal(infantDay(7, 17, "breast").cereal, 5);
  const baby = { name: "B", sex: "male", age: 0, heightIn: NaN, weightLb: 8, activity: "light", flags: {}, feeding: "formula" };
  const pl = planPerson(baby, 182);
  assert.equal(pl.mode, "infant");
  // About 30 oz a day on average over six months.
  assert.ok(pl.sim.totals.formula > 5000 && pl.sim.totals.formula < 6000, `formula ${pl.sim.totals.formula}`);
  const hh = planHousehold({ months: 6, people: [baby] });
  assert.ok(hh.lines.some((l) => l.key === "formula" && l.qty > 15));
  assert.ok(hh.lines.some((l) => l.key === "dropsD"));
  assert.ok(!hh.lines.some((l) => l.key.startsWith("straw"))); // too young for a LifeStraw
});

test("A 9-month-old switches to the toddler ration at the first birthday", () => {
  const baby = { name: "C", sex: "female", age: 0.75, heightIn: NaN, weightLb: 18, activity: "light", flags: {}, feeding: "breast" };
  const pl = planPerson(baby, 182);
  assert.equal(pl.infant.infantDays, 91);
  assert.equal(pl.infant.toddlerDays, 91);
  assert.ok(pl.sim.totals.whole > 150); // whole milk after age 1
  assert.ok(pl.sim.suppByKey.dropsD > 80 && pl.sim.suppByKey.drops > 80);
});

test("Breastfeeding follows the baby on the list", () => {
  const mom = { name: "Jo", sex: "female", age: 30, heightIn: 65, weightLb: 150, activity: "light", flags: { breastfeeding: true } };
  const baby = (age, feeding, weightLb = 10) => ({ name: "Kai", sex: "male", age, heightIn: NaN, weightLb, activity: "light", flags: {}, feeding });
  const jo = (people, months = 6) => planHousehold({ months, people }).plans.find((p) => p.person.name === "Jo");

  // No baby on the list: the full 400 for the whole plan, with a note saying so.
  const alone = jo([mom]);
  assert.equal(alone.nursingExtra, 400);
  assert.equal(alone.weaning, undefined);
  assert.match(alone.warnings.join(" "), /No baby under 1 is on the list/);
  // Enough protein: 25 g over her usual need, covered by the extra ¼ cup of beans.
  assert.ok(Math.abs(alone.proteinNeed - (0.8 * 150 * 0.45359237 + 25)) < 0.01);
  assert.ok(alone.phase1Protein >= alone.proteinNeed);

  // Breast milk only: full extra. Breast milk and formula: half.
  assert.equal(jo([mom, baby(0, "breast")]).nursingExtra, 400);
  const both = jo([mom, baby(0, "both")]);
  assert.equal(both.nursingExtra, 200);
  assert.ok(both.phase1Protein >= both.proteinNeed);

  // A 9-month-old turns 1 three months in: her extra stops and the shopping list shrinks.
  const nine = jo([mom, baby(0.75, "breast", 18)]);
  assert.equal(nine.weaning.days, 91);
  assert.equal(nine.weaning.after.mode, "hold");
  assert.ok(nine.weaning.after.phase1Kcal < nine.phase1Kcal - 300);
  assert.ok(nine.sim.totals.rice < alone.sim.totals.rice);

  // A formula-fed baby doesn't change her plan, but she's told why.
  assert.match(jo([mom, baby(0, "formula")]).warnings.join(" "), /set to formula only/);

  // The baby's card names the mother once she's ticked.
  const hh = planHousehold({ months: 6, people: [mom, baby(0, "breast")] });
  assert.match(hh.plans[1].warnings[0], /Jo's card includes extra food/);
  const unticked = planHousehold({ months: 6, people: [{ ...mom, flags: {} }, baby(0, "breast")] });
  assert.match(unticked.plans[1].warnings[0], /Tick Breastfeeding/);
  assert.equal(unticked.plans[0].nursingExtra, 0);

  // An overweight mother holds weight while nursing, then loses after the baby turns 1.
  const heavy = planHousehold({ months: 12, people: [{ ...mom, weightLb: 190 }, baby(0.5, "breast", 16)] }).plans[0];
  assert.equal(heavy.mode, "breastfeeding");
  assert.equal(heavy.weaning.after.mode, "lose");
  assert.ok(heavy.sim.endLb < 190);
});

test("Keep current weight instead of the healthy-weight goal", () => {
  const dad = { name: "Dad", sex: "male", age: 53, heightIn: 72, weightLb: 215, activity: "light", flags: {} };
  const healthy = planPerson(dad, 182);
  assert.equal(healthy.mode, "lose");
  assert.equal(healthy.goalLb, 180);
  assert.deepEqual(healthy.healthyGoal, { mode: "lose", lb: 180 });

  const kept = planPerson({ ...dad, keepWeight: true }, 182);
  assert.equal(kept.mode, "hold");
  assert.equal(kept.goalLb, null);
  assert.equal(kept.keptWeight, true);
  assert.deepEqual(kept.healthyGoal, { mode: "lose", lb: 180 });
  assert.ok(kept.phase1Kcal > healthy.phase1Kcal + 300);
  assert.ok(Math.abs(kept.sim.endLb - 215) < 5); // rice rounds up to the next ¼ cup

  // At a healthy weight the switch does nothing and isn't offered.
  const fit = planPerson({ ...dad, weightLb: 170, keepWeight: true }, 182);
  assert.equal(fit.mode, "hold");
  assert.equal(fit.healthyGoal, undefined);
  assert.equal(fit.keptWeight, undefined);

  // Underweight and keeping weight: allowed, with a note.
  const thin = planPerson({ ...dad, weightLb: 125, keepWeight: true }, 182);
  assert.equal(thin.mode, "hold");
  assert.match(thin.warnings.join(" "), /Below a healthy weight/);

  // A nursing mother holds weight either way; the choice applies after the baby turns 1.
  const mom = { name: "Jo", sex: "female", age: 30, heightIn: 65, weightLb: 190, activity: "light", flags: { breastfeeding: true } };
  const kai = { name: "Kai", sex: "male", age: 0.5, heightIn: NaN, weightLb: 16, activity: "light", flags: {}, feeding: "breast" };
  const jo = (m) => planHousehold({ months: 12, people: [m, kai] }).plans[0];
  assert.equal(jo(mom).weaning.after.mode, "lose");
  assert.equal(jo({ ...mom, keepWeight: true }).weaning.after.mode, "hold");
});

test("Cooking table adds up to the household pot", () => {
  const people = [
    { name: "Sam", sex: "male", age: 34, heightIn: 70, weightLb: 210, activity: "light", flags: {}, keepWeight: true },
    { name: "Jo", sex: "female", age: 24, heightIn: 65, weightLb: 150, activity: "light", flags: {} },
    { name: "Ava", sex: "female", age: 0, heightIn: 12, weightLb: 20, activity: "light", flags: {}, feeding: "breast" },
    { name: "Leo", sex: "male", age: 1, heightIn: 30, weightLb: 22, activity: "light", flags: {} },
  ];
  const hh = planHousehold({ months: 6, people });
  const sum = (k) => hh.shares.reduce((a, s) => a + s[k], 0);
  const dry = (k) => hh.plans.reduce((a, pl) => a + (pl.phase1[k] || 0), 0);
  assert.equal(sum("riceCooked"), hh.cook.riceCooked);
  assert.equal(sum("beansCooked"), hh.cook.beansCooked);
  assert.equal(dry("rice"), hh.cook.rice);
  assert.equal(dry("beans"), hh.cook.beans);
  assert.ok(Math.abs(hh.cook.riceCooked - hh.cook.rice * 3) <= 0.125);
  assert.ok(Math.abs(hh.cook.beansCooked - hh.cook.beans * 2.5) <= 0.125);
  // Everyone who eats rice gets some cooked rice.
  hh.plans.forEach((pl, i) => { if (pl.phase1.rice > 0) assert.ok(hh.shares[i].riceCooked > 0); });
  assert.deepEqual(splitRounded([3.125, 1.875, 0.625], 5.75), [3.25, 2, 0.5]);
  assert.equal(cupsText(1 / 16), "1 tbsp");
});

test("Camp Dutch oven is sized to the household", () => {
  const adult = (i) => ({ name: `A${i}`, sex: "male", age: 34, heightIn: 70, weightLb: 180, activity: "light", flags: {} });
  const pot = (n) => planHousehold({ months: 6, people: Array.from({ length: n }, (_, i) => adult(i)) }).pot;
  assert.equal(pot(1).qt, 5);
  assert.equal(pot(2).qt, 5);
  assert.equal(pot(4).qt, 8);
  assert.equal(pot(6).qt, 8);
  assert.equal(pot(7).qt, 10);
  assert.equal(pot(4).cups, 32);
  assert.equal(pot(4).batches, 1);
  assert.equal(pot(12).batches, 2);
  // The day's beans and their water fit ¾ full.
  const p = pot(6);
  assert.ok(p.needCups <= p.cups);
  // The shopping line carries the chosen size and its price.
  const hh = planHousehold({ months: 6, people: [adult(1), adult(2), adult(3)] });
  const line = hh.lines.find((l) => l.key === "pot");
  assert.equal(line.price, 99);
  assert.match(line.pack, /8 qt/);
  assert.equal(line.amountText, "holds 32 cups");
  // Babies who eat nothing from the pot don't count.
  const baby = { name: "B", sex: "male", age: 0, heightIn: NaN, weightLb: 9, activity: "light", flags: {}, feeding: "formula" };
  assert.equal(planHousehold({ months: 6, people: [adult(1), adult(2), baby] }).pot.qt, 5);
});
