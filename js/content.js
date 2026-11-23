// Words shared by the web page and the PDF, so both always say the same thing.
// Plain text only. A "lead" is the bold start of a bullet.
import {
  PRODUCTS, COSTCO_MEMBERSHIP, LB_PER_BUCKET, STORE_PLANS, LIFESTRAW_GALLONS, BIC_LIGHTS,
  STRAW_MIN_AGE, ACTIVITY,
} from "./data.js";
import { fraction, cupsText, spoonText } from "./calc.js";

export const money = (x) => x.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
export const cents = (x) => x.toLocaleString("en-US", { style: "currency", currency: "USD" });
export const num = (x) => Math.round(x).toLocaleString("en-US");
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function todayText(d = new Date()) {
  return d.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

export function planSummary(hh) {
  const shops = STORE_PLANS[hh.store].stores.join(" and ");
  return `Plan for ${plural(hh.plans.length, "person", "people")} for ${plural(hh.months, "month")}, shopping at ${shops}.`;
}

export function personSummary(p) {
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
    case "pregnant": return "Pregnant: no weight loss, extra food";
    case "breastfeeding": return "Breastfeeding: no weight loss, extra food";
    default: return "Hold current weight";
  }
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

export function cardRows(pl) {
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
  return `About ${num(pl.phase1Kcal)} calories and ${num(pl.phase1Protein)} g of protein a day. Needs at least ${num(pl.proteinNeed)} g of protein.`;
}

export function cardNotes(pl, hh) {
  const notes = [];
  const after = (weeks) => `Expected to reach ${pl.goalLb} lb in about ${weeks} weeks.`;
  const end = `Expected weight after ${plural(hh.months, "month")}: about ${Math.round(pl.sim.endLb)} lb.`;
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
  const rows = hh.plans.map((pl, i) => {
    const s = hh.shares[i];
    const riceCooked = Math.round(s.riceCooked * 4) / 4;
    const beansCooked = Math.round(s.beansCooked * 4) / 4;
    return [pl.person.name, riceCooked > 0 ? cupsText(riceCooked) : "none", beansCooked > 0 ? cupsText(beansCooked) : "none", `${cupsText(pl.phase1.oats)} dry`];
  });
  const milkBits = [];
  if (c.milk > 0) milkBits.push(`${fraction(c.milk)} cups of nonfat milk (${cupsText(c.milk / 3)} powder)`);
  if (c.whole > 0) milkBits.push(`${fraction(c.whole)} cups of whole milk for the under-2s (${cupsText(c.whole / 4)} powder)`);
  return {
    rice: `${cupsText(c.rice)} of dry rice`,
    beans: `${cupsText(c.beans)} of dry beans`,
    rest: "for the whole household, then serve each person their share. Cooked rice is roughly three times its dry volume and beans about two and a half times, so the cooked amounts below are close, not exact.",
    head: ["Person", "Cooked rice", "Cooked beans", "Oats"],
    rows,
    milk: milkBits.length ? `Mix ${milkBits.join(" and ")} a day.` : "",
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
  groups.push({ title: "Fire and water gear (Amazon)", lines: hh.lines.filter((l) => l.group === "gear") });
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
  { lead: "Beans", text: "Soak overnight in plenty of water (10 cups per 2 cups of beans), drain, then cook in fresh water. Boil hard for at least 10 minutes, 30 to be safe, before simmering 1½–2 hours. A pressure cooker saves a lot of fuel." },
  { lead: "Start the beans now", text: "Build up to each person's full amount over two to three weeks so stomachs can adjust." },
  { lead: "Rice", text: "Don't rinse it. Rinsing washes off the added iron and B vitamins." },
  { lead: "Water and fuel", text: "Plan on about 3 quarts of cooking water per adult per day, on top of drinking water, and enough fuel or firewood to boil it." },
  { lead: "Vitamins every day", text: "Rice and beans have no vitamin C, and scurvy can start after about four weeks without it. Keep the vitamin C bottle as a backup." },
  { lead: "Keep your muscle", text: "Push-ups, squats and lunges two or three times a week help anyone who is losing weight hold onto muscle." },
  { lead: "Storage", text: "Rice and beans sealed in mylar with an oxygen absorber keep for decades. Oil, peanut butter, oats, dry milk and vitamins keep about a year, so replace them yearly." },
  { lead: "Print this page", text: "A phone or laptop won't help once the batteries die. Print a copy or save the PDF and print it later." },
];

export const ABOUT = [
  { lead: "Healthy weight", text: "Adults above the CDC's healthy range (BMI 18.5–24.9) are planned down to BMI 24.4, the top of that range. Below it, they're planned up to BMI 18.5." },
  { lead: "Adult calories", text: "The Mifflin-St Jeor equation times an activity factor. Weight-loss rations are 500 calories below maintenance and never under 1,500 for men or 1,200 for women." },
  { lead: "Children", text: "The National Academies' 2023 energy equations, with no weight loss. Under-2s get whole milk, and milk amounts follow the American Academy of Pediatrics." },
  { lead: "Pregnancy and breastfeeding", text: "No weight loss, about 350 extra calories when pregnant and 400 when breastfeeding." },
  { lead: "Drinking water", text: "At least ½ gallon a day for teens and adults, the emergency guideline from the CDC and state health departments. Young children, pregnancy and breastfeeding use the National Academies' intake from drinks, milk included." },
  { lead: "Shopping list", text: "A day-by-day weight model for each adult that follows the weekly weigh-in rules, plus the margin you chose, rounded up to whole packages." },
  { lead: "Food values", text: "USDA data for rice, beans and peanut butter, and package labels for oats and milk." },
];

export const SOURCES = [
  ["CDC adult BMI", "https://www.cdc.gov/bmi/adult-calculator/calculator.html"],
  ["National Academies energy equations (2023)", "https://www.nationalacademies.org/read/26818/chapter/2"],
  ["Harvard Health on calorie deficits", "https://www.health.harvard.edu/staying-healthy/calorie-deficit-explained-is-it-a-safe-sustainable-approach-to-weight-loss"],
  ["AAP drinks for young children", "https://healthychildren.org/English/healthy-living/nutrition/Pages/recommended-drinks-for-young-children-ages-0-5.aspx"],
  ["USDA pinto beans", "https://tools.myfooddata.com/nutrition-facts/175199/wt1"],
  ["USDA rice", "https://tools.myfooddata.com/nutrition-comparison/168877/wt1"],
  ["Ohio State on boiling beans", "https://cfaes.osu.edu/news/articles/chow-line-dry-kidney-beans-need-be-boiled"],
  ["University of Maine on dried beans", "https://extension.umaine.edu/food-health/2021/09/02/how-to-store-and-cook-dried-beans/"],
  ["CDC emergency water supply", "https://www.cdc.gov/water-emergency/about/how-to-create-and-store-an-emergency-water-supply.html"],
  ["Ready.gov water", "https://www.ready.gov/water"],
  ["LifeStraw Personal", "https://lifestraw.com/products/lifestraw"],
  ["BIC Classic lighters", "https://us.bic.com/en_us/bic-special-edition-pocket-lighters-black-8-count.html"],
];

export const DISCLAIMER = "These are estimates for healthy people, not medical advice. Anyone with a medical condition, a pregnancy or a daily medication should check with a doctor before starting a weight-loss ration.";

export const VIDEO = {
  title: "YouTube video: Grid goes down",
  url: "https://www.youtube.com/watch?v=IvpyouZfdlU",
  linkText: "youtube.com/watch?v=IvpyouZfdlU",
};

export const SITE_URL = "https://driftcodedev.github.io/prep/";
