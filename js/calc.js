// Calculation engine. Pure functions only, so it runs the same in the browser and in tests.
import {
  FOODS, PRODUCTS, ACTIVITY, LB_PER_BUCKET, productsFor,
  BIC_LIGHTS, LIGHTS_PER_FIRE, LIFESTRAW_GALLONS, STRAW_MIN_AGE, BLADDER_GALLONS, COOK_WATER, INFANT,
} from "./data.js";

const KG_PER_LB = 0.45359237;
const KCAL_PER_KG = 7700; // energy in 1 kg of body-weight change
const LOSS_DEFICIT = 500; // kcal/day below maintenance during weight loss
const GAIN_SURPLUS = 300; // kcal/day above maintenance for underweight adults
const CAL_FLOOR = { male: 1500, female: 1200 }; // never plan an adult below this
const PREGNANCY_EXTRA = 350; // rough 2nd–3rd trimester increase
const BREASTFEEDING_EXTRA = 400; // NASEM 2023, first 6 months: 540 for milk minus 140 from her own stores.
// (7–12 months is 380, which rounds to the same rice.) Half when the baby also gets formula.
const GOAL_BMI = 24.4; // just inside the top of the healthy range (18.5–24.9)
const MIN_BMI = 18.5;

export const toKg = (lb) => lb * KG_PER_LB;
export const toLb = (kg) => kg / KG_PER_LB;
export const toCm = (inches) => inches * 2.54;
export const bmi = (lb, inches) => (703 * lb) / (inches * inches);
export const weightAtBmi = (b, inches) => (b * inches * inches) / 703;

const roundStep = (x, step) => Math.round(x / step) * step;
const ceilStep = (x, step) => Math.ceil(x / step - 1e-9) * step;
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const listText = (names) => names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

// ---------- energy ----------

export function mifflin(sex, age, kg, cm) {
  return 10 * kg + 6.25 * cm - 5 * age + (sex === "male" ? 5 : -161);
}

export function adultMaintenance(p, kg) {
  return mifflin(p.sex, p.age, kg, toCm(p.heightIn)) * ACTIVITY[p.activity].factor;
}

// National Academies, Dietary Reference Intakes for Energy (2023), EER equations.
const CHILD_EQ = {
  male: {
    inactive: [-447.51, 3.68, 13.01, 13.15], low: [19.12, 3.68, 8.62, 20.28],
    active: [-388.19, 3.68, 12.66, 20.46], very: [-671.75, 3.68, 15.38, 23.25],
  },
  female: {
    inactive: [55.59, -22.25, 8.43, 17.07], low: [-297.54, -22.25, 12.77, 14.73],
    active: [-189.55, -22.25, 11.74, 18.34], very: [-709.59, -22.25, 18.22, 14.25],
  },
};

function growthCost(sex, age) {
  if (age < 3) return sex === "male" ? 20 : 15;
  if (sex === "male") return age < 4 ? 20 : age < 9 ? 15 : age < 14 ? 25 : 20;
  return age < 9 ? 15 : age < 14 ? 30 : 20;
}

export function childEER(p) {
  const kg = toKg(p.weightLb);
  const cm = toCm(p.heightIn);
  const a = p.age;
  let base;
  if (a < 3) {
    base = p.sex === "male"
      ? -716.45 - 1.0 * a + 17.82 * cm + 15.06 * kg
      : -69.15 + 80.0 * a + 2.65 * cm + 54.15 * kg;
  } else {
    const [c0, cA, cH, cW] = CHILD_EQ[p.sex][ACTIVITY[p.activity].pal];
    base = c0 + cA * a + cH * cm + cW * kg;
  }
  return Math.max(500, base + growthCost(p.sex, a));
}

// ---------- rations ----------

export function kcalOf(r) {
  return (r.rice || 0) * FOODS.rice.kcal + (r.beans || 0) * FOODS.beans.kcal + (r.oats || 0) * FOODS.oats.kcal +
    (r.pb || 0) * FOODS.pb.kcal + (r.oil || 0) * FOODS.oil.kcal + (r.milk || 0) * FOODS.milk.kcal +
    (r.whole || 0) * FOODS.whole.kcal + (r.formula || 0) * FOODS.formula.kcal + (r.cereal || 0) * FOODS.cereal.kcal;
}

export function proteinOf(r) {
  return (r.rice || 0) * FOODS.rice.protein + (r.beans || 0) * FOODS.beans.protein + (r.oats || 0) * FOODS.oats.protein +
    (r.pb || 0) * FOODS.pb.protein + (r.milk || 0) * FOODS.milk.protein + (r.whole || 0) * FOODS.whole.protein +
    (r.formula || 0) * FOODS.formula.protein + (r.cereal || 0) * FOODS.cereal.protein;
}

export function ageBand(age) {
  if (age < 1) return "infant";
  if (age < 2) return "under2";
  if (age < 4) return "2to3";
  if (age < 9) return "4to8";
  if (age < 14) return "9to13";
  if (age < 18) return "14to17";
  return "adult";
}

// Everything except rice. Rice is added afterwards to reach the calorie target.
function baseRation(p, phase, refLb) {
  const special = p.flags || {};
  const nursing = p.sex === "female" && (special.pregnant || special.breastfeeding);
  const lactating = p.sex === "female" && special.breastfeeding && !special.pregnant;
  let r;
  switch (ageBand(p.age)) {
    case "under2": r = { beans: 0.25, oats: 0.25, pb: 1, oil: 1, milk: 0, whole: 2, salt: 0 }; break;
    case "2to3": r = { beans: 0.25, oats: 0.25, pb: 1, oil: 1, milk: 2, whole: 0, salt: 0.125 }; break;
    case "4to8": r = { beans: 0.5, oats: 0.5, pb: 1, oil: 1, milk: 2.5, whole: 0, salt: 0.25 }; break;
    case "9to13": r = { beans: 0.75, oats: 0.5, pb: 2, oil: 2, milk: 3, whole: 0, salt: 0.5 }; break;
    case "14to17": r = { beans: p.sex === "male" ? 1 : 0.75, oats: 0.5, pb: 2, oil: 2, milk: 3, whole: 0, salt: 0.75 }; break;
    default:
      r = {
        // Beans scale with body size: 1 cup at 180 lb, between ½ and 1¼ cups.
        // Breastfeeding adds ¼ cup for the extra protein.
        beans: clamp(roundStep(toKg(refLb) / toKg(180), 0.25), 0.5, 1.25) + (lactating ? 0.25 : 0),
        oats: 0.5, pb: 2, oil: phase === "lose" ? 2 : 3, milk: nursing ? 2 : 1, whole: 0, salt: 1,
      };
  }
  if (special.peanut) { r.pb = 0; r.oil += 1; }
  return { rice: 0, ...r };
}

function addRice(base, target, { step, round }) {
  const r = { ...base };
  // If the fixed foods already pass the target, trim oil, then oats (adults on a small loss ration).
  while (kcalOf(r) > target && r.oil > 1) r.oil -= 1;
  if (kcalOf(r) > target && r.oats > 0.25) r.oats = 0.25;
  const need = (target - kcalOf(r)) / FOODS.rice.kcal;
  r.rice = Math.max(0, round === "ceil" ? ceilStep(need, step) : roundStep(need, step));
  return r;
}

function supplementFor(p) {
  if (p.age < 2) return { key: "drops", perDay: 1, text: "1 mL vitamin drops" };
  if (p.age < 4) return { key: "multiKids", perDay: 0.5, text: "½ chewable vitamin, crushed" };
  if (p.age < 14) return { key: "multiKids", perDay: 1, text: "1 chewable vitamin" };
  if (p.sex === "male") return { key: "multiMen", perDay: 1, text: "1 multivitamin" };
  if (p.age >= 51) return { key: "multiWomen50", perDay: 1, text: "1 multivitamin (50+)" };
  return { key: "multiWomen", perDay: 1, text: "1 multivitamin with iron" };
}

function proteinNeed(p, refLb) {
  const kg = toKg(refLb);
  const f = p.flags || {};
  if (p.age < 4) return 1.05 * kg;
  if (p.age < 14) return 0.95 * kg;
  if (p.age < 18) return 0.85 * kg;
  if (p.sex === "female" && f.breastfeeding && !f.pregnant) return 0.8 * kg + 25; // lactation RDA: 25 g more a day
  if (p.sex === "female" && f.pregnant) return 1.1 * kg;
  return 0.8 * kg;
}

// Extra calories for pregnancy or breastfeeding. When a breastfed baby is on the list,
// p.nursing.share says how much of the baby's milk she makes (1 for breast milk only, ½ with formula).
function nursingExtra(p) {
  const f = p.flags || {};
  if (p.sex !== "female") return 0;
  if (f.pregnant) return PREGNANCY_EXTRA;
  if (!f.breastfeeding) return 0;
  return Math.round(BREASTFEEDING_EXTRA * (p.nursing ? p.nursing.share : 1));
}

// ---------- validation ----------

export function validatePerson(p) {
  const errors = [];
  if (!(p.sex === "male" || p.sex === "female")) errors.push("Choose male or female.");
  if (!Number.isFinite(p.age)) errors.push("Enter an age.");
  else if (p.age < 0) errors.push("Check the age.");
  else if (p.age > 110) errors.push("Check the age.");
  if (Number.isFinite(p.age) && p.age < 1) {
    // Babies: height is optional, and formula goes by weight.
    if (Number.isFinite(p.heightIn) && (p.heightIn < 12 || p.heightIn > 40)) errors.push("Check the baby's length, or leave it blank.");
    if (!Number.isFinite(p.weightLb) || p.weightLb < 3 || p.weightLb > 40) errors.push("Enter the baby's weight in pounds (3 to 40 lb).");
    if (!["formula", "breast", "both"].includes(p.feeding || "formula")) errors.push("Choose how the baby is fed.");
    return errors;
  }
  const baby = " For a baby under 1, set the age to 0 and pick the months.";
  if (!Number.isFinite(p.heightIn) || p.heightIn < 24 || p.heightIn > 96) errors.push(`Enter a height between 2 ft and 8 ft.${Number.isFinite(p.age) && p.age < 2 ? baby : ""}`);
  if (!Number.isFinite(p.weightLb) || p.weightLb < 12 || p.weightLb > 600) errors.push(`Enter a weight between 12 and 600 lb.${Number.isFinite(p.age) && p.age < 2 && !errors.length ? baby : ""}`);
  if (!ACTIVITY[p.activity]) errors.push("Choose an activity level.");
  return errors;
}

// ---------- one person ----------

export function planPerson(p, days) {
  if (p.age < 1) return planInfant(p, days);
  const f = p.flags || {};
  const isChild = p.age < 18;
  const extra = nursingExtra(p);
  const plan = {
    person: p, isChild, warnings: [], supplement: supplementFor(p),
    bmi: bmi(p.weightLb, p.heightIn), waterCups: waterCups(p),
  };

  if (isChild) {
    const eer = childEER(p) + extra;
    const young = p.age < 9;
    plan.mode = "child";
    plan.goalLb = null;
    plan.phase1 = addRice(baseRation(p, "hold", p.weightLb), eer, { step: young ? 0.125 : 0.25, round: "nearest" });
    plan.phase1Target = eer;
    plan.proteinNeed = proteinNeed(p, p.weightLb);
  } else {
    const nursing = extra;
    const maintNow = adultMaintenance(p, toKg(p.weightLb)) + nursing;
    const floor = CAL_FLOOR[p.sex];
    if (nursing) {
      plan.mode = f.pregnant ? "pregnant" : "breastfeeding";
      plan.goalLb = null;
    } else if (plan.bmi >= 25) {
      plan.mode = "lose";
      plan.goalLb = Math.round(weightAtBmi(GOAL_BMI, p.heightIn));
    } else if (plan.bmi < MIN_BMI) {
      plan.mode = "gain";
      plan.goalLb = Math.ceil(weightAtBmi(MIN_BMI, p.heightIn));
    } else {
      plan.mode = "hold";
      plan.goalLb = null;
    }
    const refLb = plan.goalLb ?? p.weightLb;
    const opts = { step: 0.25, round: "ceil" };
    if (plan.mode === "lose") {
      plan.phase1Target = Math.max(maintNow - LOSS_DEFICIT, floor);
      plan.phase1 = addRice(baseRation(p, "lose", refLb), plan.phase1Target, opts);
      plan.holdTarget = adultMaintenance(p, toKg(refLb));
      plan.hold = addRice(baseRation(p, "hold", refLb), plan.holdTarget, opts);
      const fixed = kcalOf({ ...plan.phase1, rice: 0 });
      const riceAtFloor = Math.max(0, ceilStep((floor - fixed) / FOODS.rice.kcal, 0.25));
      plan.minRice = Math.max(riceAtFloor, plan.phase1.rice - 0.25);
      plan.floorKcal = kcalOf({ ...plan.phase1, rice: plan.minRice });
    } else if (plan.mode === "gain") {
      plan.phase1Target = maintNow + GAIN_SURPLUS;
      plan.phase1 = addRice(baseRation(p, "hold", refLb), plan.phase1Target, opts);
      plan.holdTarget = adultMaintenance(p, toKg(refLb));
      plan.hold = addRice(baseRation(p, "hold", refLb), plan.holdTarget, opts);
    } else {
      plan.phase1Target = maintNow;
      plan.phase1 = addRice(baseRation(p, "hold", refLb), plan.phase1Target, opts);
    }
    plan.proteinNeed = proteinNeed(p, refLb);
  }

  plan.phase1Kcal = kcalOf(plan.phase1);
  plan.phase1Protein = proteinOf(plan.phase1);
  if (plan.hold) {
    plan.holdKcal = kcalOf(plan.hold);
    plan.holdProtein = proteinOf(plan.hold);
  }
  plan.nursingExtra = f.breastfeeding && !f.pregnant ? extra : 0;
  plan.nursing = plan.nursingExtra ? p.nursing || null : null;

  // Breastfeeding a baby on the list: the extra food stops at the baby's first birthday,
  // when the baby moves to whole milk, and she goes on to her regular plan.
  const link = plan.nursing;
  if (link && link.days < days) {
    plan.sim = simulate(plan, link.days);
    const after = planPerson({ ...p, flags: { ...f, breastfeeding: false }, nursing: undefined }, days - link.days);
    for (const k of Object.keys(plan.sim.totals)) plan.sim.totals[k] += after.sim.totals[k] || 0;
    plan.sim.endLb = after.sim.endLb;
    plan.weaning = { days: link.days, after };
  } else {
    plan.sim = simulate(plan, days);
  }
  plan.warnings = warningsFor(plan);
  return plan;
}

// ---------- babies under 1 ----------

// One day of a baby's food at a given age (months) and weight (lb).
export function infantDay(m, lb, feeding = "formula") {
  const share = feeding === "breast" ? 0 : feeding === "both" ? 0.5 : 1;
  let need = Math.min(INFANT.maxOz, INFANT.ozPerLb * lb);
  if (m >= 10) need = Math.min(need, INFANT.maxOzFrom10m);
  const formula = need * share;
  const mash = INFANT.mashCups(m);
  return {
    rice: mash, beans: mash, oats: 0, pb: 0, oil: 0, milk: 0, whole: 0, salt: 0,
    formula, cereal: INFANT.cerealTbsp(m),
    breastOz: need - formula,
    // Vitamin D drops for any breast milk, or for formula under 32 oz a day.
    dropsD: share < 1 || formula < INFANT.maxOz - 1e-9 ? INFANT.dropsMlPerDay : 0,
  };
}

function planInfant(p, days) {
  const feeding = p.feeding || "formula";
  const m0 = p.age * 12;
  const daysToOne = Math.max(0, Math.round((12 - m0) * 30.4));
  const infantDays = Math.min(days, daysToOne);
  const totals = { rice: 0, beans: 0, oats: 0, pb: 0, oil: 0, milk: 0, whole: 0, salt: 0, formula: 0, cereal: 0, supp: 0 };
  const suppByKey = {};
  let lb = p.weightLb;
  let len = Number.isFinite(p.heightIn) ? p.heightIn : medianLength(m0);
  let peakOz = 0;
  let peakFormula = 0;
  for (let d = 0; d < infantDays; d++) {
    const m = m0 + d / 30.4;
    const day = infantDay(m, lb, feeding);
    for (const k of Object.keys(totals)) if (k !== "supp") totals[k] += day[k] || 0;
    if (day.dropsD) suppByKey.dropsD = (suppByKey.dropsD || 0) + day.dropsD;
    peakOz = Math.max(peakOz, day.formula + day.breastOz);
    peakFormula = Math.max(peakFormula, day.formula);
    lb += INFANT.gainLbPerMonth(m) / 30.4;
    len += INFANT.gainInPerMonth(m) / 30.4;
  }
  // After the first birthday, the toddler ration takes over (whole milk and family food).
  const toddlerDays = days - infantDays;
  let toddler = null;
  if (toddlerDays > 0) {
    toddler = planPerson({ ...p, age: 1, weightLb: Math.max(lb, 15), heightIn: Math.max(len, 26), feeding: undefined }, toddlerDays);
    for (const k of Object.keys(totals)) if (k !== "supp") totals[k] += toddler.sim.totals[k] || 0;
    suppByKey[toddler.supplement.key] = (suppByKey[toddler.supplement.key] || 0) + toddler.sim.totals.supp;
  }
  const today = infantDay(m0, p.weightLb, feeding);
  const plan = {
    person: p, isChild: true, isInfant: true, mode: "infant", feeding, ageMonths: m0, goalLb: null,
    bmi: NaN, waterCups: m0 < 6 ? 0 : 0.5,
    supplement: today.dropsD ? { key: "dropsD", perDay: INFANT.dropsMlPerDay, text: "1 mL vitamin D drops" } : null,
    phase1: today,
    phase1Target: kcalOf(today) + today.breastOz * 20,
    proteinNeed: m0 < 6 ? 9.1 : 11,
    infant: {
      daysToOne, infantDays, toddlerDays, toddler,
      at6: m0 < 6 ? infantDay(6, p.weightLb + growthBetween(m0, 6), feeding) : null,
      peakOz, peakFormula,
    },
  };
  plan.phase1Kcal = kcalOf(today) + today.breastOz * 20; // breast milk is about 20 calories an ounce too
  plan.phase1Protein = proteinOf(today);
  plan.sim = { totals, suppByKey, endLb: lb, reachedDay: null, riceChanges: 0 };
  plan.warnings = warningsFor(plan);
  return plan;
}

function growthBetween(m0, m1) {
  let lb = 0;
  for (let m = m0; m < m1; m += 1 / 30.4) lb += INFANT.gainLbPerMonth(m) / 30.4;
  return lb;
}

function medianLength(m) {
  let len = INFANT.birthLengthIn;
  for (let x = 0; x < m; x += 1 / 30.4) len += INFANT.gainInPerMonth(x) / 30.4;
  return len;
}

// Day-by-day weight model that also applies the weekly weigh-in rules,
// so the shopping list matches what each person will actually eat.
export function simulate(plan, days) {
  const p = plan.person;
  const totals = { rice: 0, beans: 0, oats: 0, pb: 0, oil: 0, milk: 0, whole: 0, salt: 0, supp: 0 };
  const add = (r) => { for (const k of Object.keys(totals)) if (k !== "supp") totals[k] += r[k] || 0; totals.supp += plan.supplement.perDay; };

  if (plan.isChild || plan.mode === "pregnant" || plan.mode === "breastfeeding") {
    for (let d = 0; d < days; d++) add(plan.phase1);
    return { totals, endLb: p.weightLb, reachedDay: null, riceChanges: 0 };
  }

  let kg = toKg(p.weightLb);
  const goalKg = plan.goalLb ? toKg(plan.goalLb) : kg;
  let phase = plan.mode === "lose" || plan.mode === "gain" ? plan.mode : "hold";
  let r = { ...plan.phase1 };
  let weekStart = kg;
  let reachedDay = null;
  let riceChanges = 0;

  for (let d = 1; d <= days; d++) {
    add(r);
    kg += (kcalOf(r) - adultMaintenance(p, kg)) / KCAL_PER_KG;

    if (phase === "lose" && toLb(kg) <= plan.goalLb + 1) {
      phase = "hold"; r = { ...plan.hold }; reachedDay = d; weekStart = kg;
    } else if (phase === "gain" && toLb(kg) >= plan.goalLb - 1) {
      phase = "hold"; r = { ...plan.hold }; reachedDay = d; weekStart = kg;
    }

    if (d % 7 === 0) {
      const week = d / 7;
      const changeLb = toLb(kg - weekStart);
      if (phase === "lose") {
        if (week >= 2 && changeLb < -2) { r.rice += 0.25; riceChanges++; }
        else if (week >= 4 && changeLb > -0.5 && r.rice - 0.25 >= plan.minRice - 1e-9) { r.rice -= 0.25; riceChanges++; }
      } else if (phase === "gain") {
        if (week >= 2 && changeLb < 0.25) { r.rice += 0.25; riceChanges++; }
        else if (changeLb > 1 && r.rice >= 0.25) { r.rice -= 0.25; riceChanges++; }
      } else {
        if (changeLb < -0.5) { r.rice += 0.25; riceChanges++; }
        else if (changeLb > 0.5 && r.rice >= 0.25) { r.rice -= 0.25; riceChanges++; }
      }
      weekStart = kg;
    }
  }
  void goalKg;
  return { totals, endLb: toLb(kg), reachedDay, riceChanges };
}

function warningsFor(plan) {
  const p = plan.person;
  const f = p.flags || {};
  const w = [];
  if (plan.isInfant) {
    const m = plan.ageMonths;
    if (plan.feeding !== "formula") {
      const by = p.nursedBy && p.nursedBy.length ? p.nursedBy : null;
      w.push(`Breast milk is the safest baby food in an outage: keep breastfeeding as long as you can. ${by
        ? `${listText(by)}'s card includes extra food for breastfeeding.`
        : "Tick Breastfeeding under Special situations on the mother's card so she gets extra food."}`);
    }
    if (plan.feeding !== "breast") {
      w.push("Mix powdered formula exactly as the can says, with water boiled for 1 minute. Never add extra water to stretch it.");
      if (m < 2) w.push("Under 2 months old: let the boiled water cool only about 5 minutes, so it's still hot (at least 158°F), before mixing in the powder, then cool the bottle before feeding. The CDC says ready-to-feed liquid formula is safest at this age in an emergency, so keep some on hand if you can.");
    }
    w.push("No plain water before 6 months, no honey and no cow's milk to drink before age 1.");
    w.push("Weigh the baby every week: hold the baby on the scale and subtract your own weight. Babies should keep gaining; if not, feed more often and get medical help if you can.");
    return w;
  }
  if (p.age < 2) w.push("Use whole dry milk until the 2nd birthday. Mash the beans and cook the rice soft.");
  if (p.age < 4) w.push("Never give peanut butter by the spoonful to a child under 4. Spread it thin or stir it into the oatmeal.");
  if (p.age >= 2 && p.age < 4) w.push("Crush the chewable vitamin and mix it into food.");
  if (plan.isChild) w.push("Children should never diet. Weigh them every two weeks; if a child loses weight, add rice or another ½ cup of milk.");
  if (f.pregnant) w.push("Take a prenatal vitamin instead of the regular multivitamin and keep regular checkups. The extra calories here are a rough estimate.");
  if (plan.nursingExtra) {
    w.push("Keep taking a prenatal or women's multivitamin while breastfeeding. Never cut calories to lose weight while nursing. Drink to thirst, and a glass of water at every feed.");
    const n = p.nursing;
    if (n && !n.babies.length) {
      w.push(n.formulaBaby
        ? "The baby on the list is set to formula only. If she's breastfeeding, set the baby to Breast milk or Both so her extra food matches."
        : "No baby under 1 is on the list, so she gets the breastfeeding extra for the whole plan. Add the baby to the list and her extra food will follow the baby's age.");
    }
  }
  if (f.peanut) w.push("Peanut butter is left out of this ration and replaced with oil. Keep jars and spoons separate.");
  if (f.diabetes) w.push("This plan is heavy in rice. Talk to a doctor before relying on it; more beans and less rice is gentler on blood sugar.");
  if (f.kidney) w.push("Beans and dry milk are high in potassium and phosphorus. Talk to a doctor before relying on this plan.");
  if (f.celiac) w.push("Regular oats can carry wheat. Buy oats labeled gluten-free, or swap them for more rice.");
  if (!plan.isChild && p.age >= 65 && plan.mode === "lose") w.push("Weight loss after 65 costs muscle quickly. Consider holding weight instead and ask a doctor.");
  if (plan.mode === "gain") w.push("This person is below the healthy weight range, so the plan adds calories until they reach it.");
  return w;
}

// ---------- water ----------

// Cups of drinking water a day. Adults and teens: the emergency guideline of at least ½ gallon
// (CDC, Ready.gov, state health departments). Young children, pregnancy and breastfeeding:
// National Academies adequate intake from drinks, which includes milk.
export function waterCups(p) {
  const f = p.flags || {};
  if (p.age < 1) return p.age * 12 < 6 ? 0 : 0.5;
  if (p.age < 4) return 4;
  if (p.age < 9) return 5;
  if (p.age < 14) return p.sex === "male" ? 8 : 7;
  if (p.sex === "female" && f.breastfeeding && !f.pregnant) return 13;
  if (p.sex === "female" && f.pregnant) return 10;
  return 8;
}

// Daily water for one person on their first-phase ration, in cups.
// Young children's drinking amount already includes their milk, so the milk water isn't counted twice.
export function waterUse(pl) {
  const r = pl.phase1;
  const milkCups = (r.milk || 0) + (r.whole || 0);
  const drink = pl.isInfant ? pl.waterCups : pl.person.age < 9 ? Math.max(0, pl.waterCups - milkCups) : pl.waterCups;
  const cook = (r.rice || 0) * COOK_WATER.rice + (r.oats || 0) * COOK_WATER.oats +
    milkCups * COOK_WATER.milk + (r.beans || 0) * COOK_WATER.beansCook + (r.formula || 0) * INFANT.waterPerOz / 8;
  const soak = (r.beans || 0) * COOK_WATER.beansSoak;
  return { drink, cook, soak, total: drink + cook + soak };
}

// Cheapest mix of LifeStraw packs giving one straw each to n people.
// One spare straw is taken when it costs less than SPARE_VALUE extra.
const SPARE_VALUE = 5;
export function strawPacks(n, products = PRODUCTS) {
  if (n <= 0) return { packs: [], straws: 0, cost: 0 };
  const sizes = ["straw5", "straw3", "straw1"].map((k) => ({ k, size: products[k].size, price: products[k].price }));
  let best = null;
  for (let a = 0; a <= Math.ceil(n / sizes[0].size) + 1; a++) {
    for (let b = 0; b <= Math.ceil(n / sizes[1].size) + 1; b++) {
      for (let c = 0; c <= n + 1; c++) {
        const straws = a * sizes[0].size + b * sizes[1].size + c * sizes[2].size;
        if (straws < n || straws > n + 1) continue;
        const cost = a * sizes[0].price + b * sizes[1].price + c * sizes[2].price;
        const score = cost - (straws > n ? SPARE_VALUE : 0);
        const packs = a + b + c;
        if (!best || score < best.score - 1e-9 || (Math.abs(score - best.score) < 1e-9 && packs < best.packCount)) {
          best = { score, cost, straws, packCount: packs, counts: [a, b, c] };
        }
      }
    }
  }
  const packs = sizes.map((s, i) => ({ key: s.k, qty: best.counts[i] })).filter((x) => x.qty > 0);
  return { packs, straws: best.straws, cost: best.cost };
}

// ---------- household ----------

// Connect breastfeeding mothers to the breastfed babies on the list: her extra food follows
// how much breast milk the babies get, and lasts until the youngest turns 1.
export function linkNursing(people) {
  const babies = people.filter((p) => p.age < 1);
  const breastfed = babies.filter((p) => p.feeding === "breast" || p.feeding === "both");
  const moms = people.filter((p) => p.age >= 1 && p.sex === "female" && p.flags?.breastfeeding && !p.flags?.pregnant);
  if (!moms.length && !breastfed.length) return people;
  const link = breastfed.length && moms.length
    ? {
      share: breastfed.reduce((a, b) => a + (b.feeding === "breast" ? 1 : 0.5), 0) / moms.length,
      days: Math.max(...breastfed.map((b) => Math.max(1, Math.round((12 - b.age * 12) * 30.4)))),
      babies: breastfed.map((b) => ({ name: b.name, feeding: b.feeding })),
    }
    : { share: 1, days: Infinity, babies: [], formulaBaby: babies.length > 0 };
  const momNames = moms.map((m) => m.name);
  return people.map((p) => {
    if (moms.includes(p)) return { ...p, nursing: link };
    if (breastfed.includes(p)) return { ...p, nursedBy: momNames };
    return p;
  });
}

export function planHousehold({ months, reservePct = 20, store = "costco", owned = {}, hasScale = false, people }) {
  const days = Math.round(months * 30.4);
  const reserve = 1 + reservePct / 100;
  const valid = people.filter((p) => validatePerson(p).length === 0);
  const plans = linkNursing(valid).map((p) => planPerson(p, days));
  const have = { scale: hasScale, ...owned };

  const sum = { rice: 0, beans: 0, oats: 0, pb: 0, oil: 0, milk: 0, whole: 0, salt: 0, formula: 0, cereal: 0 };
  const supp = {};
  for (const pl of plans) {
    for (const k of Object.keys(sum)) sum[k] += pl.sim.totals[k] || 0;
    if (pl.sim.suppByKey) for (const [k, v] of Object.entries(pl.sim.suppByKey)) supp[k] = (supp[k] || 0) + v;
    else supp[pl.supplement.key] = (supp[pl.supplement.key] || 0) + pl.sim.totals.supp;
  }

  const grams = {};
  for (const k of Object.keys(sum)) grams[k] = sum[k] * FOODS[k].grams * reserve;

  const riceLb = grams.rice / 453.6;
  const beansLb = grams.beans / 453.6;
  const buckets = (riceLb > 0 ? Math.ceil(riceLb / LB_PER_BUCKET) : 0) + (beansLb > 0 ? Math.ceil(beansLb / LB_PER_BUCKET) : 0);
  const strawPeople = plans.filter((pl) => pl.person.age >= STRAW_MIN_AGE).length;

  const ctx = { plans, sum, supp, grams, reserve, buckets, strawPeople, have };
  const shop = shoppingFor(ctx, productsFor(store));
  const otherStore = store === "walmart" ? "costco" : "walmart";
  const other = plans.length ? { store: otherStore, total: shoppingFor(ctx, productsFor(otherStore)).total } : null;

  // Daily cooking totals (first-phase rations) and each person's share of the pot.
  const cook = { rice: 0, beans: 0, oats: 0, milk: 0, whole: 0 };
  for (const pl of plans) for (const k of Object.keys(cook)) cook[k] += pl.phase1[k] || 0;
  const shares = plans.map((pl) => ({
    name: pl.person.name,
    rice: cook.rice ? pl.phase1.rice / cook.rice : 0,
    beans: cook.beans ? pl.phase1.beans / cook.beans : 0,
    riceCooked: pl.phase1.rice * 3,
    beansCooked: pl.phase1.beans * 2.5,
  }));

  // Gear lifespans.
  const firesPerLighter = BIC_LIGHTS / LIGHTS_PER_FIRE;
  const waterCupsTotal = plans.reduce((a, pl) => a + pl.waterCups, 0);
  const use = plans.reduce((a, pl) => {
    const w = waterUse(pl);
    return { drink: a.drink + w.drink, cook: a.cook + w.cook, soak: a.soak + w.soak, total: a.total + w.total };
  }, { drink: 0, cook: 0, soak: 0, total: 0 });
  const dailyGallons = use.total / 16;
  const gear = {
    firesPerLighter,
    lighterMonths: firesPerLighter / 30.4,
    trayYears: (PRODUCTS.lighters.size * firesPerLighter) / 365,
    strawPeople,
    straws: shop.straws,
    strawGallons: LIFESTRAW_GALLONS,
    adultStrawYears: LIFESTRAW_GALLONS / (8 / 16) / 365,
    waterCupsTotal,
    waterGallonsTotal: waterCupsTotal / 16,
    use,
    dailyGallons,
    bladderGallons: BLADDER_GALLONS,
    bladderDays: dailyGallons ? BLADDER_GALLONS / dailyGallons : 0,
    canDays: (gal) => (dailyGallons ? gal / dailyGallons : 0),
  };

  return {
    days, months, reservePct, store, plans, invalidCount: people.length - valid.length,
    lines: shop.lines, total: shop.total, byStore: shop.byStore, byGroup: shop.byGroup,
    buckets, cook, shares, gear, other,
  };
}

function shoppingFor(ctx, products) {
  const { plans, sum, supp, grams, reserve, buckets, strawPeople, have } = ctx;
  const lines = [];
  const addLine = (key, qty, amountText, group) => {
    if (qty <= 0) return;
    const prod = products[key];
    lines.push({ key, ...prod, group, qty, amountText, cost: qty * prod.price });
  };
  const lbText = (g) => `${Math.round(g / 453.6)} lb`;

  for (const key of ["rice", "beans", "oats", "pb", "oil", "salt", "milk", "whole", "formula", "cereal"]) {
    if (grams[key] <= 0) continue;
    const qty = Math.ceil(grams[key] / products[key].sizeGrams - 1e-9);
    let amount;
    if (key === "oil") amount = `${(sum.oil * reserve / 256).toFixed(1)} gal`;
    else if (key === "pb") amount = `${Math.round(grams.pb / 28.35)} oz`;
    else if (key === "milk" || key === "whole") amount = `${Math.round(sum[key] * reserve)} cups of milk`;
    else if (key === "salt") amount = `${Math.round(grams.salt / 28.35)} oz`;
    else if (key === "formula") amount = `${Math.round(sum.formula * reserve).toLocaleString("en-US")} fl oz made up`;
    else if (key === "cereal") amount = `${Math.round(sum.cereal * reserve)} tbsp`;
    else amount = lbText(grams[key]);
    addLine(key, qty, amount, "food");
  }

  for (const key of ["multiMen", "multiWomen", "multiWomen50", "multiKids", "drops", "dropsD"]) {
    if (!supp[key]) continue;
    const need = supp[key] * reserve;
    addLine(key, Math.ceil(need / products[key].size - 1e-9), key.startsWith("drops") ? `${Math.ceil(need)} mL` : `${Math.ceil(need)} tablets`, "food");
  }
  if (plans.some((pl) => pl.person.age >= 4)) addLine("vitC", 1, "backup supply", "food");

  if (buckets > 0) {
    addLine("buckets", Math.ceil(buckets / products.buckets.size), `${buckets} buckets`, "storage");
    addLine("mylar", Math.ceil(buckets / products.mylar.size), `${buckets} bags`, "storage");
  }
  if (!have.scale && plans.length) addLine("scale", 1, "for weekly weigh-ins", "storage");

  let straws = 0;
  if (plans.length) {
    if (!have.lighters) addLine("lighters", 1, `${products.lighters.size} lighters`, "gear");
    if (!have.filters && strawPeople > 0) {
      const sp = strawPacks(strawPeople, products);
      straws = sp.straws;
      const covers = `${sp.straws} straw${sp.straws > 1 ? "s" : ""} for ${strawPeople} ${strawPeople === 1 ? "person" : "people"}${sp.straws > strawPeople ? " + spare" : ""}`;
      sp.packs.forEach((pk, i) => addLine(pk.key, pk.qty, i === 0 ? covers : "", "gear"));
    }
    if (!have.axe) addLine("axe", 1, "splitting firewood", "gear");
    if (!have.bladder) addLine("bladder", 1, "fill when the power goes out", "gear");
    if (!have.diverter) addLine("diverter", 1, "rain from the roof into a trash can", "gear");
    if (!have.timer) addLine("timer", 1, "timing the pot, no batteries", "gear");
  }

  const total = lines.reduce((a, l) => a + l.cost, 0);
  const byStore = {};
  const byGroup = {};
  for (const l of lines) {
    byStore[l.store] = (byStore[l.store] || 0) + l.cost;
    byGroup[l.group] = (byGroup[l.group] || 0) + l.cost;
  }
  return { lines, total, byStore, byGroup, straws };
}

// ---------- formatting ----------

const FRACTIONS = { 0.125: "⅛", 0.25: "¼", 0.375: "⅜", 0.5: "½", 0.625: "⅝", 0.75: "¾", 0.875: "⅞" };
const THIRDS = { 0.333: "⅓", 0.667: "⅔" };

export function fraction(x) {
  const whole = Math.floor(x + 1e-9);
  const rest = Math.round((x - whole) * 1000) / 1000;
  let frac = FRACTIONS[rest] || THIRDS[rest] || "";
  if (!frac && rest > 0) return x.toFixed(2).replace(/0+$/, "");
  if (whole === 0) return frac || "0";
  return `${whole}${frac}`;
}

export function cupsText(x) {
  if (x <= 0) return "none";
  // Odd eighths are easier to measure as a quarter-cup step plus 2 tablespoons.
  const eighths = Math.round(x * 8);
  if (eighths % 2 === 1) {
    const base = (eighths - 1) / 8;
    return base === 0 ? "2 tbsp" : `${fraction(base)} cup${base > 1 ? "s" : ""} + 2 tbsp`;
  }
  return `${fraction(x)} cup${x > 1 ? "s" : ""}`;
}

export function spoonText(x, unit) {
  if (x <= 0) return "none";
  return `${fraction(x)} ${unit}`;
}
