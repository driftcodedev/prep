// Words shared by the web page and the PDF, so both always say the same thing.
// Plain text only. A "lead" is the bold start of a bullet.
import {
  PRODUCTS, COSTCO_MEMBERSHIP, LB_PER_BUCKET, STORE_PLANS, LIFESTRAW_GALLONS, BIC_LIGHTS,
  STRAW_MIN_AGE, ACTIVITY, BLADDER_WEEKS, COOK_WATER,
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
  const shops = STORE_PLANS[hh.store].stores.join(" and ");
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

export function cookingData(hh) {
  const c = hh.cook;
  // Each cell: the cooked amount to serve, and the dry amount it comes from (matching the cards).
  const cell = (cooked, dry) => (dry > 0 ? { cooked: cooked > 0 ? `${cupsText(cooked)} cooked` : "a spoonful cooked", dry: `from ${cupsText(dry)} dry` } : { cooked: "none", dry: "" });
  const rows = hh.plans.map((pl, i) => {
    const s = hh.shares[i];
    return {
      name: pl.person.name,
      rice: cell(s.riceCooked, pl.phase1.rice),
      beans: cell(s.beansCooked, pl.phase1.beans),
      oats: pl.phase1.oats > 0 ? `${cupsText(pl.phase1.oats)} dry` : "none",
    };
  });
  const total = {
    name: "Whole household",
    rice: cell(c.riceCooked, c.rice),
    beans: cell(c.beansCooked, c.beans),
    oats: c.oats > 0 ? `${cupsText(c.oats)} dry` : "none",
  };
  const milkBits = [];
  if (c.milk > 0) milkBits.push(`${fraction(c.milk)} cups of nonfat milk (${cupsText(c.milk / 3)} powder)`);
  if (c.whole > 0) milkBits.push(`${fraction(c.whole)} cups of whole milk for the under-2s (${cupsText(c.whole / 4)} powder)`);
  const u = hh.gear.use;
  const water = [
    { label: "What a simmer looks like", text: "small, lazy bubbles breaking the surface every second or two, with steam rising. A boil is big bubbles churning the whole pot. Over a fire, bring the pot to a boil over the hottest part, then slide it to the edge, set it higher on a rock or grate, or let the fire burn down to glowing coals. If it starts boiling hard again, move it farther from the heat; if the bubbles stop, move it closer." },
    { label: "Rice", text: `${cupsText(c.rice)} of dry rice in ${cupsText(c.rice * COOK_WATER.rice)} of water makes about ${cupsText(c.riceCooked)} cooked. Bring it to a boil, put the lid on, move it to a simmer and set a 20-minute timer. It's done when you tilt the pot and no water runs, and the grains are soft. If water is left, give it 5 more minutes; if you smell scorching, take it off the heat. Let it sit off the fire with the lid on for 10 minutes. Nothing gets poured away.` },
    { label: "Beans", text: `${cupsText(c.beans)} of dry beans makes about ${cupsText(c.beansCooked)} cooked. Soak them overnight in ${cupsText(c.beans * COOK_WATER.beansSoak)} of water and drain; save that water for washing or flushing. Cover with ${cupsText(c.beans * COOK_WATER.beansCook)} of fresh water, boil hard for at least 10 minutes on a timer, then simmer with the lid on for 1½–2 hours. Check every 30 minutes and add water so the beans stay covered. They're done when a bean squashes easily against the side of the pot and is creamy inside, with no chalky center.` },
    { label: "Oats", text: `${cupsText(c.oats)} of oats in ${cupsText(c.oats * COOK_WATER.oats)} of water. Simmer about 5 minutes, stirring, until thick.` },
  ];
  if (c.milk + c.whole > 0) {
    const parts = [];
    if (c.milk > 0) parts.push(`${cupsText(c.milk)} for the nonfat milk`);
    if (c.whole > 0) parts.push(`${cupsText(c.whole)} for the under-2s' whole milk`);
    water.push({ label: "Milk", text: `${cupsText(c.milk + c.whole)} of water${parts.length > 1 ? `: ${parts.join(" and ")}` : ""}. Use boiled water that has cooled, or water from the waterBOB.` });
  }
  const formulaOz = hh.plans.reduce((a, pl) => a + (pl.phase1.formula || 0), 0);
  if (formulaOz > 0) water.push({ label: "Formula", text: `about ${num(formulaOz)} fl oz a day takes ${fraction(Math.round(formulaOz * 0.9 / 8 * 4) / 4)} cups of water. Boil it for 1 minute, then mix exactly as the can says. Make one bottle at a time and use it within 2 hours.` });
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
    fireLead: "These amounts are for your whole household for one day: the same totals as the bottom row of the table above.",
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
      return `All together, your household uses about ${fraction(d + k + s)} cups (${gallonsText((d + k + s) / 16)}) of water a day: ${fraction(d)} cups to drink (${who}), ${fraction(k)} for cooking (${what}) and ${fraction(s)} to soak the next day's beans.`;
    })(),
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
      buy: hh.lines.some((l) => l.key === "lighters") ? `One ${P.lighters.size}-lighter tray for the household, ${cents(P.lighters.price)}.` : "You already have lighters, so they're not on the list.",
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
          : "You already have water filters, so they're not on the list.",
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
      title: "Water: waterBOB bathtub bladder",
      product: P.bladder,
      links: [{ label: "waterBOB on Amazon", url: P.bladder.url }],
      buy: hh.lines.some((l) => l.key === "bladder") ? `One per household, ${cents(P.bladder.price)} on Amazon (sold by a third-party seller). It comes with a hand pump.` : "You already have a water bladder, so it's not on the list.",
      lasts: `It holds up to ${g.bladderGallons} gallons, depending on the size of your tub. Your household uses about ${gallonsText(g.dailyGallons)} a day for drinking, cooking and soaking beans, so a full one lasts about ${num(g.bladderDays)} days (${weeksText(g.bladderDays)}). Sealed, the water stays fresh for up to ${BLADDER_WEEKS} weeks.`,
      tips: [
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
      buy: hh.lines.some((l) => l.key === "diverter") ? `One kit, ${cents(P.diverter.price)} at Home Depot. It comes with the FlexiFit diverter, a spigot, a drain, a hose and a hole saw.` : "You already have a rain diverter, so it's not on the list.",
      lasts: `It turns a trash can into a rain barrel fed from a gutter downspout. A 500 sq ft section of roof sheds about 300 gallons per inch of rain, so even a light rain fills a can. A 32-gallon can holds about ${num(g.canDays(32))} days of your household's water, and a 45-gallon can about ${num(g.canDays(45))} days.`,
      tips: [
        "Use a trash can you already own: 32 to 45 gallons, with a lid and no holes. Keep it just for water.",
        "You need a drill for the hole saw. Keep it fully charged, and top it up every few months, so you can install the kit even after the power goes out. The installation video at the top of the page shows how. You also need a gutter downspout you're allowed to drill into.",
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
      buy: hh.lines.some((l) => l.key === "axe") ? `One 36-inch splitting axe for the household, ${cents(P.axe.price)}.` : "You already have an axe, so it's not on the list.",
      lasts: "Fiskars backs the X27 with a lifetime warranty. With an occasional touch-up from a file it will outlast the outage.",
      tips: [
        "Split on a chopping block with your feet apart, and keep everyone at least two axe lengths away. Keep the sheath on when it's not in use.",
        "Dry, seasoned wood lights and burns far better than fresh-cut. Stack split wood off the ground and under cover.",
      ],
    },
    {
      key: "timer",
      title: "Timing: Casio solar watch",
      product: P.timer,
      links: [{ label: "Casio AQ-S810W on Amazon", url: P.timer.url }],
      buy: hh.lines.some((l) => l.key === "timer") ? `One per household, ${cents(P.timer.price)} on Amazon.` : "You already have a battery-free timer, so it's not on the list.",
      lasts: "It never needs a battery: sunlight or any indoor light charges it, and a full charge runs about 10 months in the dark. It has two countdown timers that beep when time is up, plus alarms and a stopwatch.",
      tips: [
        "Set a countdown for each step on the cooking list: 20 minutes for rice, 10 minutes of hard boiling for beans, then 30-minute checks while they simmer.",
        "Leave it in a sunny window or wear it outside for a few hours a week to keep it charged.",
      ],
    },
  ];
}

// ---------- shopping ----------

export function storeGroups(hh) {
  const plan = STORE_PLANS[hh.store];
  const titles = { Costco: "Costco warehouse trip", Walmart: "Walmart order", Amazon: "Amazon order" };
  const groups = plan.stores.map((store) => ({
    title: titles[store],
    lines: hh.lines.filter((l) => l.store === store && l.group !== "gear"),
  }));
  groups.push({ title: "Fire and water gear", lines: hh.lines.filter((l) => l.group === "gear") });
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
  return `With a Costco membership, the Costco and Amazon list would come to ${money(hh.other.total)}, plus ${money(COSTCO_MEMBERSHIP)} for the membership.`;
}

export function shoppingNotes(hh) {
  const notes = [];
  const beans = hh.lines.find((l) => l.key === "beans");
  const milk = hh.lines.find((l) => l.key === "milk");
  if (hh.store === "costco") {
    notes.push(`Costco prices are warehouse prices and vary a little by location. The total leaves out the ${money(COSTCO_MEMBERSHIP)} Costco membership.`);
    notes.push("Amazon's Subscribe & Save takes about 15% off the beans, peanut butter and oil. You can cancel after the first delivery.");
    if (beans && beans.qty > 40) notes.push(`That's ${beans.qty} one-pound bags of beans. Amazon may limit how many fit in one order, so split it up if needed. If your Costco stocks 25-lb pinto bags ($17–21 where sold), those cost less.`);
    if (milk && milk.qty >= 3) notes.push("Costco's Saco Mix'n Drink 8-lb bag of nonfat dry milk makes 40 quarts for about $35.49–35.99 where it's stocked, which is cheaper per cup than the Amazon bag.");
  } else {
    notes.push("No membership needed. Walmart.com ships orders of $35 or more free, or you can order for pickup at your store. Store prices can differ a little from online prices.");
    notes.push("Great Value and Equate are Walmart's store brands. Any brand of plain long grain rice, pinto beans, old fashioned oats and iodized salt works the same.");
  }
  notes.push(`Seal the rice and beans in mylar bags with an oxygen absorber, one bag per bucket. The list assumes about ${LB_PER_BUCKET} lb per bucket.`);
  notes.push("Prices change often, especially around sales. Check them at checkout.");
  return notes;
}

// ---------- cooking, weigh-ins, storage, method ----------

export const GEAR_INTRO = "Food only helps if you can cook it and drink safely. These cover a flame, firewood and water: a filter straw for each person, a bathtub bladder to fill the moment the power goes out, and a rain catcher to keep water coming after that. A solar watch times the pot without batteries. All of it is on the shopping list above; the diverter kit is from Home Depot and the rest from Amazon.";

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
  { lead: "Water and fuel", text: "Cooking for everyone, above, shows how much water your household uses each day. Keep the lid on every pot to save water and firewood." },
  { lead: "Vitamins every day", text: "Rice and beans have no vitamin C, and scurvy can start after about four weeks without it. Keep the vitamin C bottle as a backup." },
  { lead: "Keep your muscle", text: "Push-ups, squats and lunges two or three times a week help anyone who is losing weight hold onto muscle." },
  { lead: "Storage", text: "Rice and beans sealed in mylar with an oxygen absorber keep for decades. Oil, peanut butter, oats, dry milk and vitamins keep about a year, so replace them yearly." },
  { lead: "Print this page", text: "A phone or laptop won't help once the batteries die. Print a copy or save the PDF and print it later." },
];

export const ABOUT = [
  { lead: "Healthy weight", text: "Adults above the CDC's healthy range (BMI 18.5–24.9) are planned down to BMI 24.4, the top of that range. Below it, they're planned up to BMI 18.5. Each card has a switch to keep the current weight instead." },
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
];

export const DISCLAIMER = "These are estimates for healthy people, not medical advice. Anyone with a medical condition, a pregnancy or a daily medication should check with a doctor before starting a weight-loss ration.";

export const VIDEOS = [
  { title: "YouTube video: Grid goes down", url: "https://www.youtube.com/watch?v=IvpyouZfdlU", linkText: "youtube.com/watch?v=IvpyouZfdlU" },
  { title: "YouTube video: Installing the rain diverter", url: "https://www.youtube.com/watch?v=0gK3Pk67lkw", linkText: "youtube.com/watch?v=0gK3Pk67lkw" },
  { title: "YouTube video: ChatGPT whistleblower", url: "https://www.youtube.com/watch?v=_g4l7YkDQwA", linkText: "youtube.com/watch?v=_g4l7YkDQwA" },
];

export const SITE_URL = "https://driftcodedev.github.io/prep/";
