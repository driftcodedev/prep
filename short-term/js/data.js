// All food values, product sizes and prices live here so they are easy to update.
// Prices were checked 18–23 November 2026. Costco prices are warehouse prices and vary by location.
// Amazon gear and Walmart prices were checked 23 November 2026.

export const PRICES_CHECKED = "18–27 November 2026";

// Dry-measure nutrition. Sources: USDA FoodData Central (rice, pinto beans, peanut butter),
// Quaker label (oats), product labels (dry milk).
export const FOODS = {
  rice:  { name: "White rice",        unit: "cup",  kcal: 675, protein: 13.2, grams: 185 },
  beans: { name: "Pinto beans",       unit: "cup",  kcal: 670, protein: 41.3, grams: 193 },
  oats:  { name: "Rolled oats",       unit: "cup",  kcal: 300, protein: 10,   grams: 80 },
  pb:    { name: "Peanut butter",     unit: "tbsp", kcal: 95,  protein: 3.5,  grams: 16 },
  oil:   { name: "Vegetable oil",     unit: "tbsp", kcal: 120, protein: 0,    grams: 13.6 },
  // Milk is counted in cups of made-up milk.
  milk:  { name: "Nonfat dry milk",   unit: "cup",  kcal: 80,  protein: 8,    grams: 23, powderCups: 1 / 3 },
  whole: { name: "Whole dry milk",    unit: "cup",  kcal: 150, protein: 8,    grams: 30, powderCups: 1 / 4 },
  salt:  { name: "Iodized salt",      unit: "tsp",  kcal: 0,   protein: 0,    grams: 6 },
  // Babies. Formula is counted in fl oz of made-up formula (100 calories per 5 fl oz); a 33.2-oz
  // (941 g) can makes about 238 fl oz. Infant cereal is counted in level tablespoons of dry cereal
  // (Gerber: 60 calories per ¼ cup, 15 g).
  formula: { name: "Infant formula",  unit: "fl oz", kcal: 20, protein: 0.41, grams: 3.95 },
  cereal:  { name: "Infant cereal",   unit: "tbsp", kcal: 15,  protein: 0.5,  grams: 3.75 },
};

// What each shopping-list line buys. size is in the same unit the calculator totals:
// grams for food, tablets for pills, mL for drops.
export const PRODUCTS = {
  rice: {
    item: "White rice", pack: "50-lb bag of long grain rice", store: "Costco", where: "Warehouse",
    sizeGrams: 22680, price: 22.99, priceNote: "$21.99–22.99",
    url: "https://app.warehouserunner.com/costco/1712219-eastside-rice-llc-long-grain-rice-50-lbs",
  },
  // Beans come from Walmart in both plans: Amazon only lets you buy 3 of its 1-lb bags at a time,
  // and Costco's 25-lb bags are only in some (mostly Western) warehouses. Checked 27 November 2026.
  beans: {
    item: "Pinto beans", pack: "20-lb bag, Great Value", store: "Walmart", where: "Online or in store",
    sizeGrams: 9072, price: 14.94,
    url: "https://www.walmart.com/ip/Great-Value-Pinto-Beans-20-lb/10315741",
  },
  // Oats, salt and the adult multivitamins come from Amazon in both plans (checked 27 November 2026).
  oats: {
    item: "Rolled oats", pack: "8-lb box (two 64-oz bags), Quaker Old Fashioned", store: "Amazon", where: "Online",
    sizeGrams: 3629, price: 9.59, priceNote: "$6.68–9.59",
    url: "https://www.amazon.com/dp/B01KV4H51G",
  },
  pb: {
    item: "Peanut butter", pack: "40-oz jar, Amazon Grocery creamy", store: "Amazon", where: "Online",
    sizeGrams: 1134, price: 4.20,
    url: "https://www.amazon.com/s?k=Amazon+Grocery+creamy+peanut+butter+40+oz",
  },
  oil: {
    item: "Vegetable oil", pack: "1-gallon bottle, Amazon Grocery", store: "Amazon", where: "Online",
    sizeGrams: 256 * 13.6, price: 9.16,
    url: "https://www.amazon.com/Amazon-Grocery-Vegetable-Previously-Packaging/dp/B07MK2XKKV",
  },
  salt: {
    item: "Iodized salt", pack: "2 × 26-oz canisters, Morton", store: "Amazon", where: "Online",
    sizeGrams: 1474, price: 3.58,
    url: "https://www.amazon.com/s?k=Morton+Iodized+Salt+Round+Cans+All-Purpose+Pack+of+2+26+oz",
  },
  milk: {
    item: "Nonfat dry milk", pack: "64-oz bag, Yummmy instant", store: "Amazon", where: "Online",
    sizeGrams: 1814, price: 24.29,
    url: "https://us.amazon.com/Yummmy-Instant-Quarts-Gallons-Certified/dp/B087YLTQ75",
  },
  whole: {
    item: "Whole dry milk (under age 2)", pack: "4.85-lb can, Nido Fortificada", store: "Costco", where: "Warehouse",
    sizeGrams: 2200, price: 23.49, priceNote: "$22.99–23.49",
    url: "https://app.warehouserunner.com/costco/1202923-nestle-nido-fortificada-77-6-ounces",
  },
  multiMen: {
    item: "Men's multivitamin (no iron)", pack: "300 tablets, Nature Made Multi for Him", store: "Amazon", where: "Online",
    size: 300, price: 21.58,
    url: "https://www.amazon.com/dp/B004QHGPQQ",
  },
  multiWomen: {
    item: "Women's multivitamin with iron", pack: "300 tablets, Nature Made Multi for Her", store: "Amazon", where: "Online",
    size: 300, price: 22.47, priceNote: "$21.35 with Subscribe & Save",
    url: "https://www.amazon.com/dp/B002ZWZJG6",
  },
  multiWomen50: {
    item: "Women's 50+ multivitamin", pack: "200 tablets, One A Day Women's 50+", store: "Amazon", where: "Online",
    size: 200, price: 19.98, priceNote: "$12.79–19.98",
    url: "https://www.amazon.com/dp/B09KFLWSXX",
  },
  prenatal: {
    item: "Prenatal vitamin (pregnancy)", pack: "250 tablets, Nature Made Prenatal Multi", store: "Amazon", where: "Online",
    size: 250, price: 26.99, priceNote: "$26.17–26.99",
    url: "https://www.amazon.com/dp/B001F1G6SI",
  },
  formula: {
    item: "Infant formula (powder)", pack: "42-oz tub, Kirkland Signature ProCare", store: "Costco", where: "Warehouse",
    sizeGrams: 1190, price: 29.99, priceNote: "$23.97–29.99",
    url: "https://app.warehouserunner.com/costco/1562719-kirkland-signature-procare-infant-formula-42oz",
  },
  cereal: {
    item: "Infant cereal with iron", pack: "8-oz box, Earth's Best multi-grain", store: "Amazon", where: "Online",
    sizeGrams: 227, price: 3.88,
    url: "https://www.amazon.com/dp/B000VK2ASE",
  },
  dropsD: {
    item: "Baby vitamin D drops", pack: "2 × 50 mL, Enfamil D-Vi-Sol", store: "Amazon", where: "Online",
    size: 100, price: 19.94,
    url: "https://www.amazon.com/dp/B09LKPFQBC",
  },
  multiKids: {
    item: "Children's chewable multivitamin", pack: "180 tablets, Flintstones Complete", store: "Amazon", where: "Online",
    size: 180, price: 20.55,
    url: "https://www.amazon.com/Flintstones-Vitamins-Childrens-Multivitamin-Supplement/dp/B0771WL4SD",
  },
  drops: {
    item: "Toddler vitamin drops", pack: "50 mL, Enfamil Poly-Vi-Sol", store: "Amazon", where: "Online",
    size: 50, price: 10.99,
    url: "https://www.amazon.com/Enfamil-Poly-Vi-Sol-Multivitamin-Supplement-Toddlers/dp/B0007XXPDY",
  },
  vitC: {
    item: "Vitamin C, backup", pack: "100 tablets, Nature Made 500 mg", store: "Amazon", where: "Online",
    size: 100, price: 7.49,
    url: "https://www.amazon.com/Nature-Made-Vitamin-500-Caplets/dp/B018EAPQ38",
  },
  buckets: {
    item: "Food-grade buckets with lids", pack: "6-pack, ePackageSupply 5-gallon", store: "Amazon", where: "Online",
    size: 6, price: 57.99,
    url: "https://www.amazon.com/ePackageSupply-5-Gallon-Heavy-Duty-Durable-Multi-Use/dp/B08JX2KP3Q",
  },
  mylar: {
    item: "Mylar bags with oxygen absorbers", pack: "10-pack, 5-gallon, 2,500 cc", store: "Amazon", where: "Online",
    size: 10, price: 35.99,
    url: "https://www.amazon.com/dp/B0DKBXY3KJ",
  },
  scale: {
    item: "Dial bathroom scale", pack: "Adamson A21, no batteries", store: "Amazon", where: "Online",
    size: 1, price: 19.97,
    url: "https://www.amazon.com/bathroom-scale-analog/s?k=bathroom+scale+analog",
  },

  // Fire and water gear. Amazon in both store plans.
  lighters: {
    item: "BIC Classic lighters", pack: "50-count tray", store: "Amazon", where: "Online", gear: true,
    size: 50, price: 53.99,
    url: "https://www.amazon.com/BIC-Classic-Lighter-Assorted-50-Count/dp/B00BQEFUOA",
  },
  straw1: {
    item: "LifeStraw water filter", pack: "1-pack, LifeStraw Personal", store: "Amazon", where: "Online", gear: true,
    size: 1, price: 17.95,
    url: "https://www.amazon.com/dp/B006QF3TW4",
  },
  straw3: {
    item: "LifeStraw water filters", pack: "3-pack, LifeStraw Personal", store: "Amazon", where: "Online", gear: true,
    size: 3, price: 38.99, priceNote: "Black Friday price; usually $52.53",
    url: "https://www.amazon.com/LifeStraw-Personal-Water-Filter-Piece/dp/B072BC51LT",
  },
  straw5: {
    item: "LifeStraw water filters", pack: "5-pack, LifeStraw Personal", store: "Amazon", where: "Online", gear: true,
    size: 5, price: 74.88, priceNote: "List price $79.95",
    url: "https://www.amazon.com/dp/B087D7K48X",
  },
  axe: {
    item: "Splitting axe", pack: "Fiskars X27 Super Splitting Axe, 36 in", store: "Amazon", where: "Online", gear: true,
    size: 1, price: 69.98,
    url: "https://www.amazon.com/Fiskars-Super-Splitting-Inch-378841-1002/dp/B004M3BAQE",
  },
  bladder: {
    item: "Bathtub water bladder", pack: "waterBOB, up to 100 gal, with hand pump", store: "Amazon", where: "Online", gear: true,
    size: 1, price: 42.95, priceNote: "Sold by a third-party seller",
    url: "https://www.amazon.com/dp/B001AXLUX2",
  },
  // Level cups and spoons for the daily amounts on each card. No "Why?" panel.
  measure: {
    item: "Measuring cups and spoons", pack: "Bopei stainless steel, 5 cups + 5 spoons", store: "Amazon", where: "Online", gear: true,
    size: 1, price: 15.99,
    url: "https://www.amazon.com/dp/B08YY9LP9C",
  },
  // The no-bag choice for bathtub water (picked under "Already have"): seal the drain and fill the tub itself.
  drainCover: {
    item: "Tub drain cover", pack: "V-TOP silicone, 6 in, 2-pack", store: "Amazon", where: "Online", gear: true,
    size: 2, price: 5.99, priceNote: "$3.99–5.99",
    url: "https://www.amazon.com/dp/B076JD153W",
  },
  timer: {
    item: "Solar watch with timer", pack: "Casio AQ-S810W, Tough Solar", store: "Amazon", where: "Online", gear: true,
    size: 1, price: 47.26,
    url: "https://www.amazon.com/dp/B00791R1MI",
  },
  diverter: {
    item: "Rain diverter kit", pack: "EarthMinded DIY kit, from Home Depot", store: "Home Depot", where: "Online or in store", gear: true,
    size: 1, price: 41.26,
    url: "https://www.homedepot.com/p/EarthMinded-DIY-Rain-Barrel-Diverter-and-Parts-Kit-RBK-0001/203256576",
  },
  // Cooking gear, checked on Amazon 24 November 2026. The pot's size and price come from POT_SIZES.
  pot: {
    item: "Cast iron camp Dutch oven", pack: "Lodge Deep Camp Dutch Oven", store: "Amazon", where: "Online", gear: true,
    size: 1, price: 99.0,
    url: "https://www.amazon.com/dp/B004W4TXZI",
  },
  tripod: {
    item: "Campfire cooking tripod", pack: "Lodge 3TP2, 43.5-in legs, 24-in chain", store: "Amazon", where: "Online", gear: true,
    size: 1, price: 49.95,
    url: "https://www.amazon.com/dp/B00029I3EE",
  },
  disc: {
    item: "Boil alert disc", pack: "JBK Pot Minder, ceramic", store: "Amazon", where: "Online", gear: true,
    size: 1, price: 12.44,
    url: "https://www.amazon.com/dp/B000XPTFIK",
  },
};

// Lodge camp Dutch ovens: one Amazon listing with every size (pick it on the page).
// Prices from that listing, 24 November 2026; sizes and weights from Lodge's specs.
// "Deep" ones have taller sides, better for beans and boiling water.
export const POT_SIZES = [
  { qt: 4, inches: 10, deep: false, lb: 11.7, price: 59.22 },
  { qt: 5, inches: 10, deep: true, lb: 13.1, price: 74.9 },
  { qt: 6, inches: 12, deep: false, lb: 18, price: 79.9 },
  { qt: 8, inches: 12, deep: true, lb: 19.4, price: 99.0 },
  { qt: 10, inches: 14, deep: true, lb: 25.5, price: 109.9 },
];
export const POT_FILL = 0.75; // fill no more than ¾ full so it can boil without spilling

// The no-membership plan swaps the Costco items, and some Amazon food and vitamins, for Walmart.
// Oats, salt, the adult multivitamins, buckets, mylar, toddler drops, the scale and the gear stay
// on Amazon, and the beans come from Walmart in both plans.
// Walmart prices checked on walmart.com, 23 November 2026.
const WALMART = {
  rice: {
    item: "White rice", pack: "20-lb bag, Great Value long grain", sizeGrams: 9072, price: 11.57,
    url: "https://www.walmart.com/ip/Great-Value-Long-Grain-Enriched-Rice-20-lb/10315883",
  },
  pb: {
    item: "Peanut butter", pack: "40-oz jar, Great Value creamy", sizeGrams: 1134, price: 3.98,
    url: "https://www.walmart.com/ip/Great-Value-Creamy-Peanut-Butter-40-oz-Jar/10315479",
  },
  oil: {
    item: "Vegetable oil", pack: "1-gallon bottle, Great Value", sizeGrams: 256 * 13.6, price: 8.78,
    url: "https://www.walmart.com/ip/Great-Value-Vegetable-Oil-1-Gallon/10451011",
  },
  milk: {
    item: "Nonfat dry milk", pack: "64-oz bag, Great Value instant", sizeGrams: 1814, price: 23.58,
    url: "https://www.walmart.com/ip/Great-Value-Instant-Nonfat-Dry-Milk-64-oz-Bag-Makes-20-Quarts-80-Servings-per-Container/10415475",
  },
  whole: {
    item: "Whole dry milk (under age 2)", pack: "56.4-oz can, Nido Fortificada", sizeGrams: 1599, price: 19.93,
    url: "https://www.walmart.com/ip/NIDO-Fortificada-Dry-Whole-Milk-Powder-with-Vitamins-A-C-D-Iron-Calcium-56-4-oz-Canister/14869811",
  },
  multiKids: {
    item: "Children's chewable multivitamin", pack: "150 tablets, Equate Children's Chewable Complete", size: 150, price: 8.64,
    url: "https://www.walmart.com/ip/Equate-Children-s-Chewable-Complete-Multivitamin-Tablets-for-Children-s-Health-150-Count/10324825",
  },
  formula: {
    item: "Infant formula (powder)", pack: "33.2-oz can, Parent's Choice Advantage", sizeGrams: 941, price: 24.28,
    url: "https://www.walmart.com/ip/1231795077",
  },
  cereal: {
    item: "Infant cereal with iron", pack: "8-oz box, Gerber oatmeal", sizeGrams: 227, price: 3.48,
    url: "https://www.walmart.com/ip/19866765658",
  },
  dropsD: {
    item: "Baby vitamin D drops", pack: "50 mL, Enfamil D-Vi-Sol", size: 50, price: 9.97,
    url: "https://www.walmart.com/ip/16902073",
  },
  vitC: {
    item: "Vitamin C, backup", pack: "100 tablets, Spring Valley 500 mg", size: 100, price: 4.74,
    url: "https://www.walmart.com/ip/Spring-Valley-Vitamin-C-with-Rose-Hips-500-mg-100-Count-Dietary-Supplement-Tablets-for-Immune-Health/6139509340",
  },
};

export const STORE_PLANS = {
  costco: { label: "Costco + Walmart + Amazon", choice: "Costco, Walmart and Amazon", stores: ["Costco", "Walmart", "Amazon"] },
  walmart: { label: "Walmart + Amazon", choice: "Walmart and Amazon", stores: ["Walmart", "Amazon"] },
};

export function productsFor(plan = "costco") {
  if (plan !== "walmart") return PRODUCTS;
  const out = { ...PRODUCTS };
  for (const [k, v] of Object.entries(WALMART)) out[k] = { ...v, store: "Walmart", where: "Online or in store" };
  return out;
}

// How long each food and vitamin keeps unopened in a cool, dry place, shown under its name on the
// shopping list as "Keeps ...". It's about when it actually goes bad, not best-by quality.
// keepsNotes() in content.js explains each one and lists the sources (checked 25–26 November 2026).
const VITAMINS_KEEP = "about 2 years, then slowly gets weaker";
export const KEEPS = {
  rice: "10–30+ years sealed in mylar; about 2 in the store bag",
  beans: "up to 30 years sealed in mylar; 1+ in the store bag",
  oats: "6–12 months in the box",
  pb: "6–18 months unopened; go by the date on the lid",
  oil: "6–12 months unopened",
  salt: "forever; the added iodine fades after about 5 years",
  milk: "3 months somewhere hot, 3–5 years somewhere cool",
  whole: "about 15 months from when it's made; check the date",
  formula: "12–18 months from when it's made; never use it past the date",
  cereal: "until the date on the box",
  multiMen: VITAMINS_KEEP,
  multiWomen: VITAMINS_KEEP,
  multiWomen50: VITAMINS_KEEP,
  prenatal: VITAMINS_KEEP,
  multiKids: VITAMINS_KEEP,
  vitC: VITAMINS_KEEP,
  drops: "until the date on the bottle",
  dropsD: "until the date on the bottle",
};

// Gear lifespans.
export const BIC_LIGHTS = 3000;          // BIC: "up to 3,000 lights" per Classic lighter
export const LIGHTS_PER_FIRE = 10;       // allow about 10 seconds of flame to get kindling going
export const LIFESTRAW_GALLONS = 1000;   // LifeStraw Personal: up to 1,000 gallons (4,000 L) of clear water
export const STRAW_MIN_AGE = 3;          // younger children can't pull hard enough; boil their water
export const BLADDER_GALLONS = 100;      // waterBOB: "up to 100 gallons", depending on the tub
export const BLADDER_WEEKS = 16;         // waterBOB: sealed water "fresh up to 16 weeks"

// Water used in cooking, in cups per cup of dry food (per cup of made-up milk for milk).
export const COOK_WATER = {
  rice: 2,       // simmered with the lid on until it's all absorbed: nothing is poured away
  oats: 2,       // ½ cup oats in 1 cup water
  milk: 1,       // 1 cup water per cup of milk
  beansSoak: 5,  // overnight soak (10 cups per 2 cups of beans); reuse it for washing or flushing
  beansCook: 3,  // fresh water to simmer soaked beans; top up if it boils low
};

// Babies under 1 (American Academy of Pediatrics, CDC, WHO growth standards).
export const INFANT = {
  ozPerLb: 2.5,          // formula: about 2½ fl oz a day per pound of body weight
  maxOz: 32,             // ... and no more than about 32 fl oz a day
  maxOzFrom10m: 27,      // 10–12 months: 24–30 oz as solid food grows
  waterPerOz: 0.9,       // fl oz of water per fl oz of made-up formula (each scoop adds a little volume)
  cerealTbsp: (m) => (m < 6 ? 0 : m < 8 ? 5 : 7),          // 6–8 mo: 4–6 tbsp a day; 8–12 mo: 6–8 tbsp
  mashCups: (m) => (m < 8 ? 0 : 1 / 16),                    // from 8 mo: 1 tbsp each of dry rice and beans, cooked soft
  gainLbPerMonth: (m) => (m < 3 ? 2.2 : m < 6 ? 1.1 : 0.65),
  gainInPerMonth: (m) => (m < 3 ? 1.5 : m < 6 ? 0.8 : 0.53),
  birthLengthIn: 19.6,
  dropsMlPerDay: 1,      // D-Vi-Sol: 1 mL = 400 IU vitamin D
};

export const COSTCO_MEMBERSHIP = 65;
// Rice or beans per 5-gallon bucket, sealed in one 5-gallon mylar bag: about 33 lb, and up to 35 if
// you shake it down as you fill. The list counts buckets from the pounds actually bought, at up to
// MAX_LB_PER_BUCKET each, so it doesn't buy a nearly empty bucket for the last pound or two.
// (Food-storage guides give 30–35 lb of rice and about 35 lb of dry beans per bucket.)
export const LB_PER_BUCKET = 33;
export const MAX_LB_PER_BUCKET = 35;
// One oxygen absorber per bag. A 5-gallon bag of rice needs about 2,000 cc and beans about 2,500 cc,
// so the 2,500 cc absorbers that come with the mylar pack cover either.
export const ABSORBER_CC = 2500;

export const ACTIVITY = {
  sedentary: { label: "Mostly sitting", hint: "Little walking or physical work", factor: 1.2,   pal: "inactive" },
  light:     { label: "Light",          hint: "On your feet part of the day, short walks", factor: 1.375, pal: "low" },
  moderate:  { label: "Moderate",       hint: "Active most of the day: hauling water, chopping wood, long walks", factor: 1.55, pal: "active" },
  heavy:     { label: "Heavy",          hint: "Hard physical work all day", factor: 1.725, pal: "very" },
};
