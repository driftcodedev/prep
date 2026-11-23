import { test } from "node:test";
import assert from "node:assert/strict";
import { planPerson, planHousehold, childEER, adultMaintenance, toKg, cupsText, validatePerson } from "../js/calc.js";

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
  assert.ok(hh.total > 300 && hh.total < 700, `total ${hh.total}`);
});

test("Validation catches babies and missing fields", () => {
  assert.ok(validatePerson({ sex: "male", age: 0, heightIn: 25, weightLb: 15, activity: "light" }).length > 0);
  assert.equal(validatePerson(brett).length, 0);
});

test("Cup text is easy to measure", () => {
  assert.equal(cupsText(1.25), "1¼ cups");
  assert.equal(cupsText(0.375), "¼ cup + 2 tbsp");
  assert.equal(cupsText(0.125), "2 tbsp");
  assert.equal(cupsText(0.5), "½ cup");
});
