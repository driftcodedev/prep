// Words shared by the web page and the PDF, so both always say the same thing.
// Plain text only. A "lead" is the bold start of a bullet.
import {
  PRODUCTS, COSTCO_MEMBERSHIP, LB_PER_BUCKET, MAX_LB_PER_BUCKET, ABSORBER_CC, STORE_PLANS, LIFESTRAW_GALLONS, BIC_LIGHTS,
  STRAW_MIN_AGE, ACTIVITY, BLADDER_WEEKS, COOK_WATER, POT_SIZES, POT_FILL,
} from "./data.js";
import { fraction, cupsText, spoonText, waterUse } from "./calc.js";

export const money = (x) => x.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
export const cents = (x) => x.toLocaleString("en-US", { style: "currency", currency: "USD" });
export const num = (x) => Math.round(x).toLocaleString("en-US");
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function gallonsText(g) {
  if (g < 0.9) return `${fraction(Math.max(0.25, Math.round(g * 4) / 4))} gallon`;
  const r = Math.round(g * 4) / 4;
  return `${fraction(r)} gallon${r > 1 ? "s" : ""}`;
}

export function weeksText(days) {
  const w = Math.round(days / 7);
  return w <= 1 ? "about a week" : `about ${w} weeks`;
}

export function todayText(d = new Date()) {
  return d.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

export function planSummary(hh) {
  const st = STORE_PLANS[hh.store].stores;
  const shops = st.length > 2 ? `${st.slice(0, -1).join(", ")} and ${st[st.length - 1]}` : st.join(" and ");
  return `Plan for ${plural(hh.plans.length, "person", "people")} for ${plural(hh.months, "month")}, shopping at ${shops}.`;
}

export const FEEDING = { formula: "Formula", breast: "Breast milk", both: "Breast milk and formula" };

export function monthsText(m) {
  const n = Math.floor(m + 1e-9);
  return n === 0 ? "newborn" : `${n} month${n === 1 ? "" : "s"} old`;
}

export function personSummary(p) {
  if (p.age < 1) {
    const sex = p.sex === "male" ? "Boy" : "Girl";
    const len = Number.isFinite(p.heightIn) ? `, ${Math.round(p.heightIn)} in long` : "";
    return `${sex}, ${monthsText(p.age * 12)}, ${Math.round(p.weightLb * 10) / 10} lb${len}, ${FEEDING[p.feeding || "formula"].toLowerCase()}`;
  }
  const ft = Math.floor(p.heightIn / 12);
  const inch = Math.round(p.heightIn - ft * 12);
  const sex = p.sex === "male" ? "Male" : "Female";
  return `${sex}, age ${p.age}, ${ft}′${inch}″, ${Math.round(p.weightLb)} lb, ${ACTIVITY[p.activity].label.toLowerCase()} activity`;
}

export function statusLine(pl) {
  switch (pl.mode) {
    case "lose": return `Lose to ${pl.goalLb} lb, then hold there`;
    case "gain": return `Gain to ${pl.goalLb} lb, then hold there`;
    case "child": return "Growing child: no dieting";
    case "infant": return `Baby: ${FEEDING[pl.feeding].toLowerCase()} first, no dieting`;
    case "pregnant": return "Pregnant: no weight loss, extra food";
    case "breastfeeding": return "Breastfeeding: no weight loss, extra food";
    default: return pl.keptWeight
      ? `Keep current weight, ${Math.round(pl.person.weightLb)} lb`
      : `Already at a healthy weight: hold at ${Math.round(pl.person.weightLb)} lb`;
  }
}

// The weight-goal switch on a card: healthy weight (the default) or keep the current weight.
// A nursing mother holds weight anyway, so for her it decides what happens after the baby turns 1.
export function goalChoice(pl) {
  const src = pl.healthyGoal ? pl : pl.weaning?.after.healthyGoal ? pl.weaning.after : null;
  if (!src) return null;
  const g = src.healthyGoal;
  return {
    kept: !!src.keptWeight,
    healthyLabel: `${g.mode === "lose" ? "Lose" : "Gain"} to ${g.lb} lb${src === pl ? "" : " after nursing"}`,
    keepLabel: `Keep ${Math.round(pl.person.weightLb)} lb`,
  };
}

export function milkText(r) {
  if (r.whole > 0) return `${fraction(r.whole)} cups whole milk (¼ cup powder per cup of water)`;
  if (r.milk > 0) return `${fraction(r.milk)} cup${r.milk > 1 ? "s" : ""} milk (⅓ cup powder per cup of water)`;
  return "none";
}

export function waterText(pl) {
  const c = pl.waterCups;
  const p = pl.person;
  if (p.age < 9) return `About ${c} cups, milk included`;
  if (pl.mode === "pregnant" || pl.mode === "breastfeeding") return `About ${c} cups`;
  return `At least ${c} cups${c === 8 ? " (½ gallon)" : ""}, more in heat or hard work`;
}

// ---------- ration cards ----------

function infantRows(pl) {
  const r = pl.phase1;
  const m = pl.ageMonths;
  const rows = [];
  if (pl.feeding !== "formula") rows.push({ label: "Breast milk", amount: pl.feeding === "both" ? "About half the feeds, on demand" : "On demand, day and night" });
  if (pl.feeding !== "breast") rows.push({ label: "Formula", sub: "made up", amount: `${Math.round(r.formula)} fl oz a day now, rising with the baby's weight` });
  rows.push({ label: "Infant cereal", sub: "dry", amount: m >= 6 ? `${r.cereal} tbsp a day, mixed with breast milk or formula` : "From 6 months: 5 tbsp a day, mixed with breast milk or formula" });
  rows.push({ label: "Soft food", amount: m >= 8 ? "1 tbsp each of dry rice and beans, cooked soft and mashed" : "From 8 months: 1 tbsp each of dry rice and beans, cooked soft and mashed" });
  rows.push({ label: "Vitamin D", amount: r.dropsD ? `1 mL drops (D-Vi-Sol) a day${pl.feeding === "formula" ? ", until the baby drinks 32 oz of formula a day" : ""}` : "None needed while the baby drinks 32 oz of formula a day" });
  const formulaWater = r.formula * 0.9 / 8;
  rows.push({ label: "Water", amount: m < 6
    ? `No plain water before 6 months${r.formula ? `. About ${fraction(Math.round(formulaWater * 4) / 4)} cups of boiled water a day goes into formula` : ""}`
    : `A few sips from a cup, about ½ cup a day${r.formula ? `, plus about ${fraction(Math.round(formulaWater * 4) / 4)} cups of boiled water for formula` : ""}` });
  return rows;
}

export function cardRows(pl) {
  if (pl.isInfant) return infantRows(pl);
  const r = pl.phase1;
  return [
    { label: "Rice", sub: "dry", amount: cupsText(r.rice), glyph: [r.rice, "cup"] },
    { label: "Pinto beans", sub: "dry", amount: cupsText(r.beans), glyph: [r.beans, "cup"] },
    { label: "Rolled oats", sub: "dry", amount: cupsText(r.oats), glyph: [r.oats, "cup"] },
    r.pb > 0 ? { label: "Peanut butter", sub: "level", amount: spoonText(r.pb, "tbsp"), glyph: [r.pb, "spoon"] } : null,
    { label: "Vegetable oil", amount: spoonText(r.oil, "tbsp"), glyph: [r.oil, "spoon"] },
    { label: "Dry milk", amount: milkText(r) },
    { label: "Iodized salt", amount: r.salt > 0 ? spoonText(r.salt, "tsp") : "none added" },
    { label: "Vitamin", amount: pl.supplement.text },
    { label: "Water to drink", amount: waterText(pl) },
  ].filter(Boolean);
}

export function cardEnergy(pl) {
  if (pl.isInfant) {
    const peak = Math.round(pl.infant.peakFormula);
    if (pl.feeding === "breast") return "Feed on demand. Babies grow fast, so expect them to want more each month.";
    return `Formula goes by weight: about 2½ fl oz a day per pound, up to 32 oz. The shopping list follows the baby's growth, up to about ${peak} fl oz a day.`;
  }
  const nursing = pl.nursingExtra
    ? `, including about ${num(pl.nursingExtra)} for breastfeeding${pl.nursing && pl.nursing.share < 1 ? " (half, since the baby also gets formula)" : ""},`
    : "";
  return `About ${num(pl.phase1Kcal)} calories${nursing} and ${num(pl.phase1Protein)} g of protein a day. Needs at least ${num(pl.proteinNeed)} g of protein.`;
}

const namesText = (names) => names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

export function cardNotes(pl, hh) {
  const notes = [];
  if (pl.isInfant) {
    const i = pl.infant;
    if (pl.ageMonths < 6) notes.push("At 6 months, start iron-fortified infant cereal. At 8 months, add a little mashed rice and beans from the family pot.");
    if (i.toddlerDays > 0) notes.push(`Turns 1 in about ${Math.max(1, Math.round(i.daysToOne / 30.4))} month${Math.round(i.daysToOne / 30.4) === 1 ? "" : "s"}. From then on, switch to whole milk (2 cups a day) and the toddler amounts. The shopping list already includes them.`);
    return notes;
  }
  const after = (weeks) => `Expected to reach ${pl.goalLb} lb in about ${weeks} weeks.`;
  const end = `Expected weight after ${plural(hh.months, "month")}: about ${Math.round(pl.sim.endLb)} lb.`;
  if (pl.weaning) {
    const w = pl.weaning.after;
    const babies = pl.nursing.babies.map((b) => b.name);
    const months = Math.max(1, Math.round(pl.weaning.days / 30.4));
    notes.push(`When ${namesText(babies)} ${babies.length > 1 ? "turn" : "turns"} 1, in about ${plural(months, "month")}, the baby moves to whole milk and her extra food stops: ${cupsText(w.phase1.rice)} of rice and ${cupsText(w.phase1.beans)} of beans a day${w.mode === "lose" ? `, losing toward ${w.goalLb} lb` : ""}. The shopping list already includes this.`);
    notes.push("If she keeps nursing past 1, the toddler drinks less of the whole milk, so she can have what's left over.");
    if (w.mode === "lose" || w.mode === "gain") notes.push(end);
  }
  if (pl.mode === "lose" || pl.mode === "gain") {
    notes.push(`At ${pl.goalLb} lb, switch to ${cupsText(pl.hold.rice)} of rice and ${spoonText(pl.hold.oil, "tbsp")} of oil, about ${num(pl.holdKcal)} calories.`);
  }
  if (pl.mode === "lose") {
    notes.push(pl.minRice < pl.phase1.rice
      ? `If you lose less than ½ lb a week after week 4, drop to ${cupsText(pl.minRice)} of rice. Never go lower.`
      : "This is already the lowest safe amount. Don't cut the rice further.");
  }
  if (pl.mode === "lose" || pl.mode === "gain") {
    notes.push(pl.sim.reachedDay ? after(Math.round(pl.sim.reachedDay / 7)) : end);
  }
  return notes;
}

// ---------- cooking for everyone ----------

// Plan-dependent numbers in the cooking text are wrapped in these two marks. The page shows them
// highlighted in yellow; the PDF drops the marks. (Table cells stay plain: every amount there changes.)
export const HL_START = "\uE000";
export const HL_END = "\uE001";
const hl = (x) => `${HL_START}${x}${HL_END}`;
// Plain versions, for use inside the cooking functions where the short names are highlighted.
const cupsOf = (x) => cupsText(x);
const fractionOf = (x) => fraction(x);
const numOf = (x) => num(x);
const gallonsOf = (x) => gallonsText(x);
// "½ cup", "1 cup", "4½ cups": a fraction of cups with the right word.
const cupsWord = (x) => `${fraction(x)} ${x > 0 && x <= 1 ? "cup" : "cups"}`;
export const PLAN_NOTE = "* Numbers highlighted in yellow change depending on your plan, and so does every amount in the table.";

export function cookingData(hh) {
  const c = hh.cook;
  const cupsText = (x) => hl(cupsOf(x));
  const fraction = (x) => hl(fractionOf(x));
  const num = (x) => hl(numOf(x));
  const gallonsText = (x) => hl(gallonsOf(x));
  // Each cell: the cooked amount to serve, and the dry amount it comes from (matching the cards).
  const cell = (cooked, dry) => (dry > 0 ? { cooked: cooked > 0 ? `${cupsOf(cooked)} cooked` : "a spoonful cooked", dry: `from ${cupsOf(dry)} dry` } : { cooked: "none", dry: "" });
  const rows = hh.plans.map((pl, i) => {
    const s = hh.shares[i];
    return {
      name: pl.person.name,
      rice: cell(s.riceCooked, pl.phase1.rice),
      beans: cell(s.beansCooked, pl.phase1.beans),
      oats: pl.phase1.oats > 0 ? `${cupsOf(pl.phase1.oats)} dry` : "none",
    };
  });
  const total = {
    name: "Whole household",
    rice: cell(c.riceCooked, c.rice),
    beans: cell(c.beansCooked, c.beans),
    oats: c.oats > 0 ? `${cupsOf(c.oats)} dry` : "none",
  };
  const milkBits = [];
  if (c.milk > 0) milkBits.push(`${hl(cupsWord(c.milk))} of nonfat milk (${cupsText(c.milk / 3)} powder)`);
  if (c.whole > 0) milkBits.push(`${hl(cupsWord(c.whole))} of whole milk for the under-2s (${cupsText(c.whole / 4)} powder)`);
  const u = hh.gear.use;
  const water = [
    { label: "What a simmer looks like", text: "small, lazy bubbles breaking the surface every second or two, with steam rising. A boil is big bubbles churning the whole pot. Over a fire, hang the pot low on the tripod chain to bring it to a boil, then raise it a few links to hold a simmer. With no tripod, slide the pot to the edge of the fire or let it burn down to glowing coals. If it starts boiling hard again, raise the pot; if the bubbles stop, lower it." },
    { label: "Hearing the boil", text: "drop the Pot Minder disc into the empty pot before the water and food. It chatters against the bottom when the pot boils. It works best with plain water and beans; with rice it chatters at the first boil, then goes quiet as the rice soaks up the water. Fish it out before serving." },
    { label: "Rice", text: `${cupsText(c.rice)} of dry rice in ${cupsText(c.rice * COOK_WATER.rice)} of water makes about ${cupsText(c.riceCooked)} cooked. Bring it to a boil and stir once so no grains stick to the bottom. Put the lid on, raise the pot to a simmer and set a 20-minute timer. Don't stir again or lift the lid until the timer goes off: stirring makes rice gummy and lets the steam out. It's done when you tilt the pot and no water runs, and the grains are soft. If water is left, give it 5 more minutes; if you smell scorching, take it off the heat. Let it sit off the fire with the lid on for 10 minutes. Nothing gets poured away.` },
    { label: "Beans", text: `${cupsText(c.beans)} of dry beans makes about ${cupsText(c.beansCooked)} cooked. Soak them overnight in ${cupsText(c.beans * COOK_WATER.beansSoak)} of water and drain; save that water for washing or flushing. Cover with ${cupsText(c.beans * COOK_WATER.beansCook)} of fresh water, boil hard for at least 10 minutes on a timer, then simmer with the lid on for 1½–2 hours. Check every 30 minutes: give them a stir and add water so the beans stay covered. They're done when a bean squashes easily against the side of the pot and is creamy inside, with no chalky center.` },
    { label: "Oats", text: `${cupsText(c.oats)} of oats in ${cupsText(c.oats * COOK_WATER.oats)} of water. Simmer about 5 minutes, stirring, until thick.` },
  ];
  if (c.milk + c.whole > 0) {
    const parts = [];
    if (c.milk > 0) parts.push(`${cupsText(c.milk)} for the nonfat milk`);
    if (c.whole > 0) parts.push(`${cupsText(c.whole)} for the under-2s' whole milk`);
    water.push({ label: "Milk", text: `${cupsText(c.milk + c.whole)} of water${parts.length > 1 ? `: ${parts.join(" and ")}` : ""}. ${hh.tub === "drainCover" ? "Use boiled water that has cooled: open tub water isn't safe to drink as it is." : "Use boiled water that has cooled, or water from the waterBOB."}` });
  }
  const formulaOz = hh.plans.reduce((a, pl) => a + (pl.phase1.formula || 0), 0);
  if (formulaOz > 0) water.push({ label: "Formula", text: `about ${hl(`${numOf(formulaOz)} fl oz`)} a day takes ${hl(cupsWord(Math.round(formulaOz * 0.9 / 8 * 4) / 4))} of water. Boil it for 1 minute, then mix exactly as the can says. Make one bottle at a time and use it within 2 hours.` });
  water.push({ label: "Save wood", text: "once rice has boiled for a minute, or beans have boiled hard for 10, you can take the lidded pot off the fire and wrap it tightly in a blanket or sleeping bag. It keeps cooking in its own heat with no simmering to watch. Check after an hour for rice and 3 hours for beans; if they're not done, bring them back to a boil and wrap again. Eat it hot." });
  return {
    rice: `${cupsText(c.rice)} of dry rice`,
    beans: `${cupsText(c.beans)} of dry beans`,
    rest: `for the whole household. That makes about ${cupsText(c.riceCooked)} of cooked rice and ${cupsText(c.beansCooked)} of cooked beans. Serve each person the cooked amount below. Rice roughly triples when cooked and beans grow about 2½ times, so cooked amounts are close, not exact.`,
    head: ["Person", "Rice", "Beans", "Oats"],
    total,
    rows,
    milk: milkBits.length ? `Mix ${milkBits.join(" and ")} a day.` : "",
    water,
    fireLead: `These amounts are for your whole household for one day: the same totals as the bottom row of the table above. ${hh.pot.batches > 1
      ? `The beans and their water come to about ${hl(`${numOf(hh.pot.needCups * POT_FILL)} cups`)}, more than ${aQuart(hh.pot.qt).replace(/\d+-quart/, (q) => hl(q))} pot (${hl(`${hh.pot.cups} cups`)}) holds safely, so cook them in ${hl(`${hh.pot.batches} batches`)} or use two pots.`
      : `Each batch fits in ${aQuart(hh.pot.qt).replace(/\d+-quart/, (q) => hl(q))} pot (${hl(`${hh.pot.cups} cups`)}), one at a time.`}`,
    waterTotal: (() => {
      // Every part is rounded to ¼ cup and the totals are sums of the parts shown, so it adds up.
      const q = (x) => Math.round(x * 4) / 4;
      const drinkers = hh.plans.map((pl) => {
        const cups = q(waterUse(pl).drink);
        const milk = !pl.isInfant && pl.person.age < 9 && (pl.phase1.milk || 0) + (pl.phase1.whole || 0) > 0;
        return { name: pl.person.name, cups, milk };
      }).filter((x) => x.cups > 0);
      const cook = [
        [q(c.rice * COOK_WATER.rice), "rice"], [q(c.beans * COOK_WATER.beansCook), "beans"],
        [q(c.oats * COOK_WATER.oats), "oats"], [q(c.milk + c.whole), "milk"], [q(formulaOz * 0.9 / 8), "formula"],
      ].filter(([x]) => x > 0);
      const d = drinkers.reduce((a, x) => a + x.cups, 0);
      const k = cook.reduce((a, [x]) => a + x, 0);
      const s = q(c.beans * COOK_WATER.beansSoak);
      const list = (items) => items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
      const who = drinkers.map((x) => `${x.name} ${fraction(x.cups)}${x.milk ? " plus milk" : ""}`).join(", ");
      const what = list(cook.map(([x, food]) => `${fraction(x)} for ${food}`));
      return `All together, your household uses about ${hl(cupsWord(d + k + s))} (${gallonsText((d + k + s) / 16)}) of water a day: ${hl(cupsWord(d))} to drink (${who}), ${fraction(k)} for cooking (${what}) and ${fraction(s)} to soak the next day's beans.`;
    })(),
  };
}

// All the day's beans, rice and oats in one pot, and how much to serve each person.
export function onePotData(hh) {
  const c = hh.cook;
  const cupsText = (x) => hl(cupsOf(x));
  const fraction = (x) => hl(fractionOf(x));
  const num = (x) => hl(numOf(x));
  const o = hh.onePot;
  if (!o.cups || !c.beans || !c.rice) return null;
  const W = COOK_WATER;
  const pot = hh.pot;
  const steps = [
    `The night before, soak ${cupsText(c.beans)} of dry beans in ${cupsText(c.beans * W.beansSoak)} of water.`,
    `Drain the beans and save that water for washing or flushing. Put them in the pot with ${cupsText(c.beans * W.beansCook)} of fresh water and the Pot Minder disc. Hang the pot low and boil hard for 10 minutes on a timer.`,
    "Raise the pot to a simmer, put the lid on and cook for about 1½ hours. Every 30 minutes, give it a stir and add water so the beans stay covered. Move on when a bean squashes easily against the side of the pot.",
    `Pour the bean liquid into a bowl, then measure ${cupsText(c.rice * W.rice)} of liquid back into the pot: the bean liquid first, topped up with fresh water.`,
    `Add ${cupsText(c.rice)} of dry rice, lower the pot to bring it back to a boil and stir once. Put the lid on, raise the pot to a simmer and set a 20-minute timer. Don't lift the lid.`,
  ];
  if (c.oats > 0) steps.push(`Stir in ${cupsText(c.oats)} of oats and ${cupsText(c.oats * W.oats)} of water. Simmer about 5 minutes, stirring, until thick.`);
  steps.push(`Take the pot off the heat, fish out the disc and let it sit for 5 minutes. You'll have about ${hl(cupsWord(o.cups))}.`);
  // Owning a pot (ticked "Already have") doesn't change this: it names the size the plan picked.
  const fit = o.cups <= pot.fillCups
    ? `It all fits in ${aQuart(pot.qt).replace(/\d+-quart/, (q) => hl(q))} pot.`
    : `That's more than ${aQuart(pot.qt).replace(/\d+-quart/, (q) => hl(q))} pot holds safely (${hl(cupsWord(pot.fillCups))}), so use two pots or make it twice with half of each amount.`;
  return {
    lead: `Rather cook everything together? This makes the whole day's beans, rice and oats in one pot: about 2¼ hours, plus soaking the beans overnight. It comes out thick, like a stew. ${fit}`,
    steps,
    servingLead: "Then serve each person this much over the day. The shares follow each person's card by calories, so everyone still gets their planned amount.",
    // On the page the shares sit in the cooking table's last column instead of their own table.
    servingLeadTable: "Then serve each person their amount from the \"Or all in one pot\" column in the table above, spread over the day. The shares follow each person's card by calories, so everyone still gets their planned amount.",
    head: ["Person", "Serve, cooked"],
    rows: o.servings.map((s) => [s.name, `${cupsOf(s.cups)}${s.young ? ", mashed" : ""}`]),
    total: ["Whole pot", `about ${fractionOf(o.cups)} cups`],
    note: "Keep the pot covered and hot over the coals between meals. Cooked rice left warm for more than 2 hours can make people sick, and heating it up again doesn't make it safe.",
  };
}

// ---------- fire and water ----------

export function gearItems(hh) {
  const g = hh.gear;
  const P = PRODUCTS;
  const lightsNote = `${num(BIC_LIGHTS)} lights`;
  const strawLine = hh.lines.filter((l) => l.key.startsWith("straw"));
  const strawBuy = strawLine.length
    ? strawLine.map((l) => `${l.qty} × ${l.pack.split(",")[0]}`).join(" + ")
    : null;
  const spare = g.straws > g.strawPeople;
  const yearsAtGallon = LIFESTRAW_GALLONS / 365;

  return [
    {
      key: "lighters",
      title: "Fire: BIC Classic lighters",
      product: P.lighters,
      links: [{ label: "50-count tray on Amazon", url: P.lighters.url }],
      buy: hh.lines.some((l) => l.key === "lighters") ? `One ${P.lighters.size}-lighter tray for the household, ${cents(P.lighters.price)}.` : "You already have lighters, so they're not counted in the total.",
      lasts: `BIC rates each Classic lighter for up to ${lightsNote}. Getting kindling to catch can take 10 seconds or so of flame, so count on about ${num(g.firesPerLighter)} fires per lighter: roughly ${Math.round(g.lighterMonths)} months of one fire a day from a single lighter, and about ${Math.round(g.trayYears / 5) * 5} years from the whole tray. That's plenty to share with family or keep a few in the car.`,
      tips: [
        "Cold butane barely sparks. In winter, warm the lighter in a pocket before you use it.",
        "Cook over a fire only outdoors or in a fireplace or wood stove. Never use a grill, charcoal or camp stove indoors: the carbon monoxide can kill.",
      ],
    },
    {
      key: "straws",
      title: "Water: LifeStraw Personal filters",
      product: P.straw3,
      links: [
        { label: "1-pack", url: P.straw1.url },
        { label: "3-pack", url: P.straw3.url },
        { label: "5-pack", url: P.straw5.url },
      ],
      buy: g.strawPeople === 0
        ? `LifeStraws are for people age ${STRAW_MIN_AGE} and up, so none are on this list.`
        : strawBuy
          ? `One straw for each person age ${STRAW_MIN_AGE} and up: ${plural(g.straws, "straw")} (${strawBuy})${spare ? ", including a spare that costs less than $5 extra" : ""}.`
          : "You already have water filters, so they're not counted in the total.",
      lasts: `Each straw filters up to ${num(LIFESTRAW_GALLONS)} gallons of clear water. At ½ gallon a day that's about ${fraction(Math.round(g.adultStrawYears * 2) / 2)} years for one adult, and even at a full gallon a day it's more than ${fraction(Math.floor(yearsAtGallon * 2) / 2)} years. Cloudy or muddy water wears a straw out much faster: let it settle, then pour it through a clean cloth first. A worn-out straw stops letting water through rather than letting bad water past.`,
      drink: `Drink at least ½ gallon (8 cups) a day, and more in heat or during hard work. Each card shows that person's amount. Together your household drinks about ${fraction(Math.round(g.waterGallonsTotal * 4) / 4)} gallon${g.waterGallonsTotal > 1.1 ? "s" : ""} a day.`,
      tips: [
        "LifeStraw removes bacteria and parasites, not viruses or chemicals. Skip floodwater and anything near fuel, sewage or farm runoff, and boil water when in doubt: a rolling boil for 1 minute.",
        `You sip straight from the stream, bucket or cup. It can't fill a pot or bottle, so cooking water still gets boiled (the rice and beans boil anyway), and so does water for children under ${STRAW_MIN_AGE}, who can't pull hard enough.`,
        "After drinking, blow air back through the straw to clear it.",
      ],
      packs: `Pack prices: 1 for ${cents(P.straw1.price)}, 3 for ${cents(P.straw3.price)} (${P.straw3.priceNote}), 5 for ${cents(P.straw5.price)}. The list picks the cheapest mix that gives everyone their own straw.`,
    },
    {
      key: "bladder",
      title: "Water: waterBOB bathtub bladder or V-TOP drain cover",
      product: hh.tub === "drainCover" ? P.drainCover : P.bladder,
      links: [
        { label: "waterBOB", url: P.bladder.url },
        { label: "V-TOP drain cover", url: P.drainCover.url },
      ],
      buy: hh.lines.some((l) => l.key === "bladder")
        ? `One per household, ${cents(P.bladder.price)} on Amazon (sold by a third-party seller). It comes with a hand pump. The V-TOP drain cover (${cents(P.drainCover.price)}) works instead: see below.`
        : hh.lines.some((l) => l.key === "drainCover")
          ? `One 2-pack, ${cents(P.drainCover.price)} on Amazon. It seals the tub drain so you can fill the tub itself. The waterBOB bag (${cents(P.bladder.price)}) works instead and keeps the water sealed.`
          : "You already have a water bladder or drain cover, so it's not counted in the total.",
      notes: [{
        label: hh.tub === "drainCover" ? "How to use the drain cover" : "No bag? Fill the tub itself",
        text: `${hh.tub === "drainCover" ? "" : "The waterBOB often sells out. Without one, "}close the tub drain, press the silicone drain cover flat over it so the tub doesn't slowly leak, and fill the tub up to just below the overflow hole. Lay a shower curtain or plastic sheet over it to keep dust out. Open tub water isn't clean enough to drink as it is: sip it through a LifeStraw, and boil it for cooking and for children under ${STRAW_MIN_AGE}. Test the seal ahead of time: run a few inches of water, mark the level with tape and check it the next day.`.replace(/^./, (c) => c.toUpperCase()),
      }],
      lasts: `A full tub holds up to ${g.bladderGallons} gallons, depending on its size, with or without the bag. Your household uses about ${gallonsText(g.dailyGallons)} a day for drinking, cooking and soaking beans, so a full one lasts about ${num(g.bladderDays)} days (${weeksText(g.bladderDays)}). Sealed in the bag, the water stays fresh for up to ${BLADDER_WEEKS} weeks; in the open tub, keep it covered and filter or boil it.`,
      tips: hh.tub === "drainCover"
        ? [
          "Fill the tub the moment the power goes out, while the tap still runs.",
          "Dip water out with a clean pot or pitcher, never your hands or a cup you've drunk from.",
          "Use it for drinking and cooking only. Wash with rain water or the bean soaking water.",
        ]
        : [
          "Fill it the moment the power goes out, while the tap still runs: lay it in a clean tub and fill it from the faucet.",
          "Use the hand pump to fill a pot or pitcher, then put the cap back on. It's tap water, so it's safe to drink as it is.",
          "Use it for drinking and cooking only. Wash with rain water or the bean soaking water.",
        ],
    },
    {
      key: "diverter",
      title: "Water: EarthMinded rain diverter kit",
      product: P.diverter,
      links: [{ label: "Kit at Home Depot", url: P.diverter.url }],
      buy: hh.lines.some((l) => l.key === "diverter") ? `One kit, ${cents(P.diverter.price)} at Home Depot. It comes with the FlexiFit diverter, a spigot, a drain, a hose and a hole saw.` : "You already have a rain diverter, so it's not counted in the total.",
      lasts: `It turns a trash can into a rain barrel fed from a gutter downspout. A 500 sq ft section of roof sheds about 300 gallons per inch of rain, so even a light rain fills a can. A 32-gallon can holds about ${num(g.canDays(32))} days of your household's water, and a 45-gallon can about ${num(g.canDays(45))} days.`,
      tips: [
        "Use a trash can you already own: 32 to 45 gallons, with a lid and no holes. Keep it just for water.",
        "You need a drill for the hole saw. Keep it fully charged, and top it up every few months, so you can install the kit even after the power goes out. The installation video linked at the top of the plan shows how. You also need a gutter downspout you're allowed to drill into.",
        "Mount the diverter level with the top of the can. It stops filling when the can is full, and the rest runs down the downspout as usual.",
        "Set the can on cinder blocks on level ground so a pot fits under the spigot. Full, it's too heavy to move.",
        "Lay window screen under the lid or strap it down with a bungee cord to keep mosquitoes and leaves out.",
        "Roof water carries bird droppings and grit: drink it through a LifeStraw or boil it. Drain the can in deep winter so it doesn't freeze and crack.",
      ],
    },
    {
      key: "axe",
      title: "Firewood: Fiskars X27 splitting axe",
      product: P.axe,
      links: [{ label: "Fiskars X27, 36-inch, on Amazon", url: P.axe.url }],
      buy: hh.lines.some((l) => l.key === "axe") ? `One 36-inch splitting axe for the household, ${cents(P.axe.price)}.` : "You already have an axe, so it's not counted in the total.",
      lasts: "Fiskars backs the X27 with a lifetime warranty. With an occasional touch-up from a file it will outlast the outage.",
      tips: [
        "Split on a chopping block with your feet apart, and keep everyone at least two axe lengths away. Keep the sheath on when it's not in use.",
        "Dry, seasoned wood lights and burns far better than fresh-cut. Stack split wood off the ground and under cover.",
      ],
    },
    potItem(hh),
    {
      key: "tripod",
      title: "Cooking: Lodge camp tripod",
      product: P.tripod,
      links: [{ label: "Lodge 43.5-inch tripod on Amazon", url: P.tripod.url }],
      buy: hh.lines.some((l) => l.key === "tripod") ? `One per household, ${cents(P.tripod.price)} on Amazon.` : "You already have a tripod, so it's not counted in the total.",
      lasts: "Solid ½-inch steel bar with a 24-inch galvanized chain, made by Lodge to hang its camp Dutch ovens full of food. Nothing on it wears out.",
      tips: [
        "The chain is your stove dial: hang the pot low to bring it to a boil, then raise it a few links to hold a simmer.",
        "Set the height before the pot is full and hot. To change it, lift the pot off with gloves first, then move the hook.",
        "It stands 43.5 inches tall, so keep the fire small: a bed of glowing coals rather than tall flames. Flames licking the pot scorch the food.",
        "Push the legs a little into the ground so it can't tip, and keep children and pets back from the fire.",
      ],
    },
    {
      key: "disc",
      title: "Cooking: Pot Minder boil alert",
      product: P.disc,
      links: [{ label: "Pot Minder on Amazon", url: P.disc.url }],
      buy: hh.lines.some((l) => l.key === "disc") ? `One, ${cents(P.disc.price)} on Amazon.` : "You already have a boil alert, so it's not counted in the total.",
      lasts: "It's fired ceramic, so it doesn't wear out. It doesn't whistle: it chatters against the bottom of the pot as the water comes to a boil, loud enough to hear near the fire. It also breaks up the foam that makes beans boil over.",
      tips: [
        "Put it in the empty pot first, then the food and water.",
        "It works best with plain water and beans, where there's plenty of loose water. Food piled on top can muffle it.",
        "With rice it chatters at the first boil, then goes quiet as the rice soaks up the water. That's all you need, since the rice timer starts at the boil.",
        "Fish it out with a spoon before serving, and let it cool before you touch it.",
      ],
    },
    {
      key: "timer",
      title: "Timing: Casio solar watch",
      product: P.timer,
      links: [{ label: "Casio AQ-S810W on Amazon", url: P.timer.url }],
      buy: hh.lines.some((l) => l.key === "timer") ? `One per household, ${cents(P.timer.price)} on Amazon.` : "You already have a battery-free timer, so it's not counted in the total.",
      lasts: "It never needs a battery: sunlight or any indoor light charges it, and a full charge runs about 10 months in the dark. It has two countdown timers that beep when time is up, plus alarms and a stopwatch.",
      tips: [
        "Set a countdown for each step on the cooking list: 20 minutes for rice, 10 minutes of hard boiling for beans, then 30-minute checks while they simmer.",
        "Leave it in a sunny window or wear it outside for a few hours a week to keep it charged.",
      ],
    },
    storageItem(hh),
  ];
}

// The storage card: mylar bags, oxygen absorbers and buckets for the rice and beans on the list.
function storageItem(hh) {
  const P = PRODUCTS;
  const st = hh.storage;
  const line = (k) => hh.lines.find((l) => l.key === k);
  const bucketLine = line("buckets");
  const mylarLine = line("mylar");
  const lb = (x) => `${num(x)} lb`;
  let buy;
  if (!st.buckets) {
    buy = "There's no rice or beans on this list, so there are no buckets or bags to buy.";
  } else {
    const parts = [];
    if (st.riceBuckets) parts.push(`${lb(st.riceLb)} of rice in ${plural(st.riceBuckets, "bucket")}`);
    if (st.beansBuckets) parts.push(`${lb(st.beansLb)} of beans in ${plural(st.beansBuckets, "bucket")}`);
    const each = [st.riceBuckets ? st.riceEach : null, st.beansBuckets ? st.beansEach : null].filter((x) => x !== null);
    const eachText = each.length === 2 && Math.round(each[0]) !== Math.round(each[1])
      ? `about ${num(each[0])} lb of rice and ${num(each[1])} lb of beans in each`
      : `about ${num(each[0])} lb in each`;
    const spareBuckets = bucketLine.qty * P.buckets.size - st.buckets;
    const spareBags = mylarLine.qty * P.mylar.size - st.buckets;
    const spares = [spareBuckets ? plural(spareBuckets, "spare bucket") : "", spareBags ? plural(spareBags, "spare bag") : ""].filter(Boolean).join(" and ");
    buy = `${plural(st.buckets, "bucket")} for the rice and beans you buy: ${parts.join(" and ")}, ${eachText}. `
      + `That's ${bucketLine.qty} × 6-pack of buckets and ${mylarLine.qty} × 10-pack of mylar bags with absorbers${spares ? `, leaving ${spares}` : ""}. `
      + "One bag and one absorber go in each bucket.";
  }
  const storageCost = (bucketLine?.cost || 0) + (mylarLine?.cost || 0);
  const foodCost = (line("rice")?.cost || 0) + (line("beans")?.cost || 0);
  return {
    key: "storage",
    title: "Storage: mylar bags, oxygen absorbers and buckets",
    product: P.mylar,
    wide: true,
    links: [
      { label: "food-grade buckets (6-pack)", url: P.buckets.url },
      { label: "mylar bags with absorbers (10-pack)", url: P.mylar.url },
    ],
    buy,
    notes: [
      { label: "What they do", text: "The mylar bag is thick foil that keeps out air, light and moisture. The oxygen absorber is a small packet of iron powder: sealed in the bag, the iron rusts and uses up the oxygen, leaving mostly nitrogen. With no oxygen, bugs and their eggs die and the food doesn't go stale. The bucket keeps mice out and keeps the bag from tearing. A plastic bucket on its own slowly lets oxygen in, which is why the sealed bag goes inside it." },
      { label: "How many absorbers", text: `One per bucket. A 5-gallon bag of rice needs about 2,000 cc of absorber and beans about 2,500 cc, since beans leave more air between them. The ${num(ABSORBER_CC)} cc absorber that comes with each bag covers either. An extra one never hurts.` },
      ...(st.buckets ? [{ label: "Why it may be worth it", text: `Together they cost ${cents(storageCost)}, ${storageCost < foodCost * 0.6 ? "well under" : storageCost <= foodCost * 1.15 ? "about as much as" : "more than"} the rice and beans themselves (${cents(foodCost)}). What that buys is time: if you shop now and the grid goes down years later, sealed rice and beans are still good, while food left in the store bags may have gone stale or let in bugs or mice. You buy them once, and the buckets can be reused. If you'd rather not spend it, skip them and instead cook from the rice and beans in everyday meals, buying fresh every year or so.` }] : []),
    ],
    lasts: "Sealed this way, white rice keeps 10 to 30 years or more and pinto beans up to 30, against about 2 years and 1 year in the store bags. Buckets and lids last for decades and can be reused. Absorbers work only once.",
    tips: [
      `Work in a dry room. Stand an open mylar bag in each bucket and fill it with rice or beans, about ${LB_PER_BUCKET} lb (up to ${MAX_LB_PER_BUCKET} if you shake it down as you go). Keep rice and beans in separate buckets.`,
      "Open the absorbers last, just before sealing. In open air they start working within about 20 minutes and can be used up in a few hours, so fill all the bags first. Put any you don't use straight into a small jar with a tight lid.",
      "Drop one absorber on top of the food, press out the extra air, and seal straight across the top of the bag with a clothes iron or hair straightener on high. Zip-top mylar bags need this heat seal too.",
      "The packet gets warm as it works, and within a day or two the bag usually pulls in snug around the food. If a bag still looks puffy after a few days, the seal may leak: reseal it with a fresh absorber.",
      "Snap the lid on, label it with what's inside and the date, and keep the buckets somewhere cool, dry and dark.",
      "Seal only dry foods like rice and beans this way. Moist food sealed without oxygen can grow botulism.",
    ],
  };
}

const fullText = (f) => (f < 0.4 ? "about a third full" : f < 0.58 ? "about half full" : f < 0.7 ? "about two-thirds full" : "about ¾ full");
const aQuart = (qt) => `${qt === 8 || qt === 11 || qt === 18 ? "an" : "a"} ${qt}-quart`;

// The pot card: the size picked for this household, and every size in cups.
function potItem(hh) {
  const p = hh.pot;
  const P = PRODUCTS;
  const c = hh.cook;
  const beansBatch = c.beans * (1 + COOK_WATER.beansCook);
  const riceBatch = c.rice * (1 + COOK_WATER.rice);
  const batch = Math.max(beansBatch, riceBatch);
  const what = beansBatch >= riceBatch ? "the beans with their water" : "the rice with its water";
  const onList = hh.lines.some((l) => l.key === "pot");
  let buy;
  if (!onList) buy = `You already have a big pot, so it's not counted in the total. It should hold at least ${num(Math.ceil(p.needCups))} cups and have a wire handle to hang from the tripod.`;
  else if (p.batches > 1) buy = `For your household: the ${p.qt}-quart (${p.cups} cups), ${cents(p.price)}, the biggest in this style. Your biggest batch of the day, ${what}, is about ${num(batch)} cups, more than it holds safely, so cook it in ${p.batches} batches or buy a second pot.`;
  else buy = `For your household: the ${p.qt}-quart, which holds ${p.cups} cups, ${cents(p.price)}. Your biggest batch of the day, ${what}, is about ${num(batch)} cups, so it fills the pot ${fullText(batch / p.cups)} and leaves room to boil.${p.qt === 8 ? " It's the usual size for a family of 3 to 6." : ""}`;
  return {
    key: "pot",
    title: "Cooking: Lodge camp Dutch oven",
    product: P.pot,
    links: [{ label: "Lodge Deep Camp Dutch Oven on Amazon (pick the size on the page)", url: P.pot.url }],
    buy,
    lasts: "Cast iron lasts for generations if you keep the rust off. The legs let it sit right in the coals, the wire handle hangs it from the tripod, and the heavy lid keeps the heat and water in. Lodge makes these in the USA.",
    sizes: POT_SIZES.map((s) => ({
      size: `${s.qt} qt${s.deep ? " deep" : ""}`,
      cups: `${s.qt * 4} cups`,
      fill: `${fraction(s.qt * 4 * POT_FILL)} cups`,
      weight: `${s.lb} lb`,
      price: cents(s.price),
      pick: onList && s.qt === p.qt,
    })),
    sizesHead: ["Size", "Holds", "Fill up to", "Weight", "Price"],
    sizesNote: "1 quart = 4 cups. Fill a pot no more than ¾ full so it can boil without spilling. The deep ones have taller sides, which suit beans and boiling water, so the plan picks from those: the 5-quart for 1 or 2 people, the 8-quart for 3 to 6, and the 10-quart for 7 or more, going bigger if the day's beans or rice wouldn't fit.",
    tips: [
      `Full, the ${p.qt}-quart weighs about ${num(p.fullLb)} lb. Lift it with both hands in heavy leather gloves: the wire handle and the lid get very hot.`,
      "After washing, dry it over the fire, then wipe a thin coat of oil inside so it doesn't rust. Don't leave food or water sitting in it.",
      "One pot is enough if you cook one batch at a time: oats, then beans, then rice. Keep cooked food covered and eat it within 2 hours, or keep it hot.",
    ],
  };
}

// ---------- shopping ----------

export function storeGroups(hh) {
  const plan = STORE_PLANS[hh.store];
  const titles = { Costco: "Costco Warehouse Trip", Walmart: "Walmart Order", Amazon: "Amazon Order" };
  const groups = plan.stores.map((store) => ({
    title: titles[store],
    lines: hh.lines.filter((l) => l.store === store && l.group !== "gear"),
  }));
  groups.push({ title: "Fire, Water And Cooking Gear", lines: hh.lines.filter((l) => l.group === "gear") });
  return groups.filter((g) => g.lines.length).map((g) => ({ ...g, total: g.lines.reduce((a, l) => a + l.cost, 0) }));
}

export function shoppingLead(hh) {
  return `Everything for ${plural(hh.plans.length, "person", "people")} for ${plural(hh.months, "month")}${hh.reservePct ? `, plus a ${hh.reservePct}% margin` : ""}`;
}

export function compareText(hh) {
  if (!hh.other) return "";
  if (hh.store === "costco") {
    const withMembership = hh.total + COSTCO_MEMBERSHIP;
    return `No Costco membership? The same list from Walmart and Amazon comes to ${money(hh.other.total)}. With the ${money(COSTCO_MEMBERSHIP)} membership, this Costco list comes to ${money(withMembership)}.`;
  }
  return `With a Costco membership, the Costco list would come to ${money(hh.other.total)}, plus ${money(COSTCO_MEMBERSHIP)} for the membership.`;
}

// Food and storage ticked "Already have" on the page (have: a Set of line keys). They stay listed
// there but come off the totals, here and for the other store's comparison; nothing else changes.
// shopLines leaves them out, for the PDF's list. Owned gear is dropped by planHousehold itself.
export function withHave(hh, have) {
  if (!have || !have.size) return hh;
  const owned = (l) => have.has(l.key);
  const minus = (lines) => lines.filter(owned).reduce((t, l) => t + l.cost, 0);
  return {
    ...hh,
    total: hh.total - minus(hh.lines),
    shopLines: hh.lines.filter((l) => !owned(l)),
    other: hh.other && { ...hh.other, total: hh.other.total - minus(hh.other.lines) },
  };
}

export function shoppingNotes(hh) {
  const notes = [];
  // Slow to arrive (they often ship from far away), so they go first in the notes.
  const slow = [["straw", "LifeStraws"], ["mylar", "mylar bags"], ["buckets", "food buckets"], ["diverter", "the rain diverter kit"]]
    .filter(([k]) => hh.lines.some((l) => l.key.startsWith(k))).map(([, name]) => name);
  if (slow.length) {
    const names = slow.length > 1 ? `${slow.slice(0, -1).join(", ")} and ${slow[slow.length - 1]}` : slow[0];
    notes.push(`${names.replace(/^./, (ch) => ch.toUpperCase())} can take a month or more to arrive, so order them first.`);
  }
  const beans = hh.lines.find((l) => l.key === "beans");
  if (hh.store === "costco") {
    notes.push(`Costco prices are warehouse prices and vary a little by location. The total leaves out the ${money(COSTCO_MEMBERSHIP)} Costco membership.`);
    if (beans) notes.push("The beans come from Walmart in 20-lb bags: Walmart.com ships orders of $35 or more free, or you can pick them up at your store. Some Costco warehouses, mostly in the West, carry 25-lb pinto bags for about $16–19, which cost a little less if yours has them.");
  } else {
    notes.push("No membership needed. Walmart.com ships orders of $35 or more free, or you can order for pickup at your store. Store prices can differ a little from online prices.");
    notes.push("Great Value and Equate are Walmart's store brands. Any brand of plain long grain rice, pinto beans, old fashioned oats and iodized salt works the same.");
    notes.push("The oats, salt and adult multivitamins come from Amazon, which has bigger, cheaper boxes of oats and big bottles of vitamins (200 to 300 tablets).");
  }
  return notes;
}

// The small line under an item's name on the shopping list: how long food keeps, or how the
// storage items are used.
export function lineHint(l, pdf = false) {
  if (l.keeps) return `Keeps ${l.keeps}`;
  if (l.key === "buckets") return `About ${LB_PER_BUCKET} lb of rice or beans in each.${pdf ? ' How to seal them is under "Storage" near the end.' : ""}`;
  if (l.key === "mylar") return `One bag and one ${num(ABSORBER_CC)} cc oxygen absorber in each bucket.`;
  if (l.alt) return pdf ? `Or a ${TUB_NAMES[l.alt.key]}: ${l.alt.pack}, ${cents(l.alt.price)}.` : "";
  return "";
}

// Short names for the two bathtub water choices, for the "or" in their shared row.
export const TUB_NAMES = { bladder: "waterBOB bag", drainCover: "V-TOP drain cover" };

// Which gear explanation (from gearItems) goes with a shopping-list line. On the page it opens
// under the line's "Why?" button; lines without one (food, the scale) get no button.
export function cardKeyFor(lineKey) {
  if (lineKey.startsWith("straw")) return "straws";
  if (lineKey === "drainCover") return "bladder";
  if (lineKey === "buckets" || lineKey === "mylar") return "storage";
  return ["lighters", "axe", "bladder", "diverter", "pot", "tripod", "disc", "timer"].includes(lineKey) ? lineKey : null;
}

// How long the food keeps: the "Keeps ..." line under each item comes from KEEPS in data.js.
export const KEEPS_LEAD = "If you shop now and the grid goes down a year or two later, some of this will need replacing first. Rice and beans sealed in mylar keep for decades, so you buy them once. Most of the rest keeps about a year. Each item above shows how long it keeps unopened in a cool, dry place.";

export function keepsNotes(hh) {
  const has = (k) => hh.lines.some((l) => l.key === k);
  const yearly = [["pb", "peanut butter"], ["oil", "oil"], ["oats", "oats"], ["milk", "nonfat dry milk"], ["whole", "Nido"]]
    .filter(([k]) => has(k)).map(([, n]) => n);
  const fats = [["pb", "peanut butter"], ["oil", "oil"], ["oats", "oats"], ["whole", "whole dry milk"]]
    .filter(([k]) => has(k)).map(([, n]) => n);
  const listText = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}` : xs[0] || "");
  const baby = has("formula") || has("cereal") || has("dropsD") || has("drops");
  const notes = [];
  if (yearly.length) notes.push({ lead: "Do one refresh a year", text: `Replace the ${listText([...yearly, "vitamins"])}. The easiest way is to use them in everyday cooking and buy new ones, so nothing goes to waste.` });
  notes.push({ lead: "Check the dates when you buy", text: "Store stock can already be months old. One Sam's Club buyer got Nido that expired about 4 months after buying it." });
  notes.push({ lead: "Dates are mostly about quality", text: "Past its date, most of this food slowly gets worse rather than going bad overnight. Here's when each kind actually spoils." });
  notes.push({ lead: "Rice and beans", text: "Kept dry and sealed, they don't spoil. Very old beans are still safe to eat, but they take longer to cook soft." });
  if (fats.length) notes.push({ lead: listText(fats).replace(/^./, (c) => c.toUpperCase()), text: "Their fats slowly turn rancid. Smell before using: a stale, sharp or bitter smell means it has gone bad, so replace it. Fats can't be kept for years in mylar the way rice and beans can." });
  if (has("milk")) notes.push({ lead: "Nonfat dry milk", text: "It has almost no fat, so heat is what ruins it. Kept cool it lasts years; in a hot spot it can go stale in months." });
  notes.push({ lead: "Vitamins and salt", text: "Vitamins don't spoil; they slowly get weaker after about 2 years. Salt never goes bad; only the added iodine fades." });
  if (baby) notes.push({ lead: "Baby food is the exception", text: "Never use infant formula past its date, and use an opened container within a month. Go by the printed date for infant cereal and vitamin drops too." });
  if (has("oats") || has("milk")) notes.push({ lead: "To shrink the yearly list", text: "Oats and nonfat dry milk can be sealed in mylar too: BYU found oats good for up to 30 years and nonfat dry milk about 20. The list only buys bags and buckets for the rice and beans, so get extra if you do this." });
  notes.push({ lead: "Keep it cool, dry and dark", text: "A closet works. Avoid the attic, a hot car or anywhere near a radiator: heat shortens every time above." });
  return notes;
}

export const KEEPS_SOURCES = [
  ["BYU food storage research", "https://magazine.byu.edu/article/ask-an-expert-new-tips-for-old-food"],
  ["Church News on fats", "https://www.thechurchnews.com/2008/1/19/23232160/home-food-storage-lasts-30-years-or-more/"],
  ["Utah State on storing rice", "https://extension.usu.edu/preserve-the-harvest/research/storing-white-rice.php"],
  ["Ohio State on dry beans", "https://ohioline.osu.edu/factsheet/HYG-5401"],
  ["National Peanut Board", "https://nationalpeanutboard.org/news/how-long-will-that-peanut-butter-last"],
  ["Skippy", "https://www.peanutbutter.com/?p=1588"],
  ["Kansas State pantry chart", "https://bookstore.ksre.ksu.edu/download/safe-food-storage-the-cupboard_MF3131"],
  ["New Mexico State storage guide", "https://pubs.nmsu.edu/_e/E118/"],
  ["Utah State on dry milk", "https://issuu.com/usuextension/docs/food_storage_booklet2_49bc3ab844f0dc/s/10352747"],
  ["Nestlé NIDO", "https://www.goodnes.com/nido/faq/"],
  ["Sam's Club Nido review", "https://www.samsclub.com/reviews/product/2800015439?page=9"],
  ["Nature Made on vitamins", "https://www.naturemade.com/blogs/health-articles/do-multivitamins-expire"],
  ["Morton salt", "https://www.mortonsalt.com/article/morton-salt-expiration-guide"],
  ["Formula shelf life", "https://scienceinsights.org/how-long-does-unopened-baby-formula-last-powder-vs-liquid/"],
  ["FDA on infant formula", "https://www.fda.gov/food/buy-store-serve-safe-food/handling-infant-formula-safely-what-you-need-know"],
];

// ---------- cooking, weigh-ins, storage, method ----------

export const GEAR_INTRO = "Food only helps if you can cook it and drink safely. These cover a flame, firewood, water, the pot and storage: a filter straw for each person, a bathtub bladder or drain cover so you can fill the tub the moment the power goes out, a rain catcher to keep water coming after that, a cast iron pot sized for your household, a tripod to hang it over the fire and a disc that tells you when it boils. A solar watch times the pot without batteries, measuring cups and spoons keep every portion exact, and mylar bags, oxygen absorbers and buckets keep the rice and beans good for decades. Everything you don't already have is on the shopping list; the diverter kit is from Home Depot and the rest from Amazon.";

export const COOK_NOTE = "Cook without salt and let each person salt their own bowl, so small children get little or none. Amounts change when someone reaches their goal weight; their card shows the new amounts.";

export const WEIGH_INTRO = "The calorie numbers are estimates. The bathroom scale tells you what's really happening, so weigh at the same time each week, after the same morning routine, and adjust.";

export const WEIGH_RULES = [
  ["Losing weight", "More than 2 lb lost in a week, after week 2", "Add ¼ cup of rice a day"],
  ["Losing weight", "Less than ½ lb lost in a week, after week 4", "Remove ¼ cup of rice, but never go below the lowest amount on your card"],
  ["Losing weight", "You're within a pound or two of your goal", "Switch to the hold amounts on your card"],
  ["Holding weight", "Still losing", "Add ¼ cup of rice each week until your weight holds"],
  ["Holding weight", "Gaining", "Remove ¼ cup of rice"],
];

export const WEIGH_KIDS = "Weigh children every two weeks. For a child too small to stand on the scale, weigh yourself holding them and subtract your own weight. Children should hold steady or gain. If a child loses weight, add 2 tablespoons of rice or another ½ cup of milk a day.";

export const CARE = [
  { lead: "Beans", text: "Soak overnight in 5 cups of water per cup of beans, drain, then cook in about 3 cups of fresh water per cup. Boil hard for at least 10 minutes, 30 to be safe, before simmering 1½–2 hours with the lid on. A pressure cooker saves a lot of fuel and water." },
  { lead: "Start the beans now", text: "Build up to each person's full amount over two to three weeks so stomachs can adjust." },
  { lead: "Rice", text: "Don't rinse it: rinsing washes off the added iron and B vitamins. Cook it in 2 cups of water per cup of rice with the lid on, so it soaks up all the water." },
  { lead: "Water and fuel", text: "Cooking For Everyone, above, shows how much water your household uses each day. Keep the lid on every pot to save water and firewood." },
  { lead: "Vitamins every day", text: "Rice and beans have no vitamin C, and scurvy can start after about four weeks without it. Keep the vitamin C bottle as a backup." },
  { lead: "Keep your muscle", text: "Push-ups, squats and lunges two or three times a week help anyone who is losing weight hold onto muscle." },
  { lead: "Storage", text: "Rice and beans sealed in mylar with an oxygen absorber keep for decades. Oil, peanut butter, oats, dry milk and vitamins keep about a year, so replace them yearly. The shopping list shows how long each item keeps." },
  { lead: "Print this page", text: "A phone or laptop won't help once the batteries die. Print a copy or save the PDF and print it later." },
];

export const ABOUT = [
  { lead: "Healthy weight", text: "Adults above the CDC's healthy range (BMI 18.5–24.9) are planned down to BMI 24.4, the top of that range. Below it, they're planned up to BMI 18.5. Each person's card on the website has a switch to keep the current weight instead." },
  { lead: "Adult calories", text: "The Mifflin-St Jeor equation times an activity factor. Weight-loss rations are 500 calories below maintenance and never under 1,500 for men or 1,200 for women." },
  { lead: "Children", text: "The National Academies' 2023 energy equations, with no weight loss. Under-2s get whole milk, and milk amounts follow the American Academy of Pediatrics." },
  { lead: "Babies under 1", text: "Formula at about 2½ fl oz a day per pound, up to 32 oz, following the American Academy of Pediatrics. Iron-fortified infant cereal from 6 months (5, then 7 tablespoons a day) and a little soft food from 8 months. Vitamin D drops (400 IU) for any breastfed baby, and for formula-fed babies drinking under 32 oz. Weight gain follows typical growth, and at the first birthday the toddler ration takes over." },
  { lead: "Pregnancy and breastfeeding", text: "No weight loss while pregnant or nursing. Pregnancy adds about 350 calories. Breastfeeding adds about 400 calories (the National Academies' 2023 figure: about 540 for the milk, minus 140 from her own stores), 25 g of protein (¼ cup more beans) and more water. When a breastfed baby is on the list, her extra follows the baby: half if the baby also gets formula, and it stops at the baby's first birthday, when the baby moves to whole milk and she goes back to her regular plan." },
  { lead: "Drinking water", text: "At least ½ gallon a day for teens and adults, the emergency guideline from the CDC and state health departments. Young children, pregnancy and breastfeeding use the National Academies' intake from drinks, milk included." },
  { lead: "Shopping list", text: "A day-by-day weight model for each adult that follows the weekly weigh-in rules, plus the margin you chose, rounded up to whole packages." },
  { lead: "Food values", text: "USDA data for rice, beans and peanut butter, and package labels for oats and milk." },
];

export const SOURCES = [
  ["CDC adult BMI", "https://www.cdc.gov/bmi/adult-calculator/calculator.html"],
  ["National Academies energy equations (2023)", "https://www.nationalacademies.org/read/26818/chapter/2"],
  ["Nutrient needs while breastfeeding (University of Washington)", "https://depts.washington.edu/pwdlearn/revfirststeps/pdfs/5nutrientstable.pdf"],
  ["Harvard Health on calorie deficits", "https://www.health.harvard.edu/staying-healthy/calorie-deficit-explained-is-it-a-safe-sustainable-approach-to-weight-loss"],
  ["AAP drinks for young children", "https://healthychildren.org/English/healthy-living/nutrition/Pages/recommended-drinks-for-young-children-ages-0-5.aspx"],
  ["USDA pinto beans", "https://tools.myfooddata.com/nutrition-facts/175199/wt1"],
  ["USDA rice", "https://tools.myfooddata.com/nutrition-comparison/168877/wt1"],
  ["Ohio State on boiling beans", "https://cfaes.osu.edu/news/articles/chow-line-dry-kidney-beans-need-be-boiled"],
  ["University of Maine on dried beans", "https://extension.umaine.edu/food-health/2021/09/02/how-to-store-and-cook-dried-beans/"],
  ["CDC emergency water supply", "https://www.cdc.gov/water-emergency/about/how-to-create-and-store-an-emergency-water-supply.html"],
  ["Ready.gov water", "https://www.ready.gov/water"],
  ["LifeStraw Personal", "https://lifestraw.com/products/lifestraw"],
  ["AAP formula amounts", "https://www.healthychildren.org/English/ages-stages/baby/formula-feeding/Pages/Amount-and-Schedule-of-Formula-Feedings.aspx"],
  ["CDC formula in an emergency", "https://www.cdc.gov/nutrition/emergencies-infant-feeding/powdered-infant-formula.html"],
  ["CDC vitamin D for babies", "https://www.cdc.gov/nutrition/infantandtoddlernutrition/formula-feeding/how-much-how-often.html"],
  ["Allina Health feeding schedules", "https://www.allinahealth.org/health-conditions-and-treatments/health-library/patient-education/beginnings/newborn-feeding/general-feeding-schedules"],
  ["waterBOB", "https://www.amazon.com/dp/B001AXLUX2"],
  ["EarthMinded DIY rain barrel kit", "https://www.homedepot.com/p/EarthMinded-DIY-Rain-Barrel-Diverter-and-Parts-Kit-RBK-0001/203256576"],
  ["BIC Classic lighters", "https://us.bic.com/en_us/bic-special-edition-pocket-lighters-black-8-count.html"],
  ["Utah State on oxygen absorbers", "https://issuu.com/usuextension/docs/food_storage_booklet2_c2a41a03001e48/s/10352725"],
  ["Oxygen absorber sizes", "https://survivalfreedom.com/how-many-ccs-you-need-oxygen-absorber-sizing-made-simple"],
  ["How oxygen absorbers work", "https://foodal.com/knowledge/things-that-preserve/oxygen-absorbers/"],
  ["Rice per 5-gallon bucket", "https://commonsensehome.com/how-to-store-rice/"],
  ["Beans per 5-gallon bucket", "https://survivalblog.com/?p=12466"],
];

export const DISCLAIMER = "These are estimates for healthy people, not medical advice. Anyone with a medical condition, a pregnancy or a daily medication should check with a doctor before starting a weight-loss ration.";

export const VIDEOS = [
  { title: "YouTube video: Grid goes down", url: "https://www.youtube.com/watch?v=IvpyouZfdlU", linkText: "youtube.com/watch?v=IvpyouZfdlU" },
  { title: "YouTube video: Installing the rain diverter", url: "https://www.youtube.com/watch?v=0gK3Pk67lkw", linkText: "youtube.com/watch?v=0gK3Pk67lkw" },
  { title: "YouTube video: ChatGPT whistleblower", url: "https://www.youtube.com/watch?v=_g4l7YkDQwA", linkText: "youtube.com/watch?v=_g4l7YkDQwA" },
];

export const SITE_URL = "https://driftcodedev.github.io/prep/";
