// All food values, product sizes and prices live here so they are easy to update.
// Prices were checked 18–23 November 2026. Costco prices are warehouse prices and vary by location.
// Amazon gear and Walmart prices were checked 23 November 2026.

export const PRICES_CHECKED = "18–23 November 2026";

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
};

// What each shopping-list line buys. size is in the same unit the calculator totals:
// grams for food, tablets for pills, mL for drops.
export const PRODUCTS = {
  rice: {
    item: "White rice", pack: "50-lb bag of long grain rice", store: "Costco", where: "Warehouse",
    sizeGrams: 22680, price: 22.99, priceNote: "$21.99–22.99",
    url: "https://app.warehouserunner.com/costco/1712219-eastside-rice-llc-long-grain-rice-50-lbs",
  },
  beans: {
    item: "Pinto beans", pack: "1-lb bag, Amazon Grocery", store: "Amazon", where: "Online",
    sizeGrams: 453.6, price: 0.95,
    url: "https://www.amazon.com/Amazon-Fresh-REGULAR-PINTO-WHOLE/dp/B09SHGC91R",
  },
  oats: {
    item: "Rolled oats", pack: "10-lb box of Quaker oats", store: "Costco", where: "Warehouse",
    sizeGrams: 4536, price: 8.69, priceNote: "$7.59–8.69",
    url: "https://app.warehouserunner.com/costco/446586-quaker-rolled-oats-2-80-oz",
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
    item: "Iodized salt", pack: "4-lb box, Diamond Crystal", store: "Costco", where: "Warehouse",
    sizeGrams: 1814, price: 1.89,
    url: "https://app.warehouserunner.com/costco/18001-diamond-crystal-iodized-salt-64-oz-4-lbs",
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
    item: "Men's multivitamin", pack: "300 tablets, One A Day Men's", store: "Costco", where: "Warehouse",
    size: 300, price: 17.29, priceNote: "$13.29–17.29",
    url: "https://app.warehouserunner.com/costco/853467-one-a-day-men-s-multivitamin-300-count",
  },
  multiWomen: {
    item: "Women's multivitamin with iron", pack: "300 tablets, One A Day Women's", store: "Costco", where: "Warehouse",
    size: 300, price: 18.99, priceNote: "$17.29–18.99",
    url: "https://app.warehouserunner.com/costco/853472-one-a-day-women-s-multivitamin-300-count",
  },
  multiWomen50: {
    item: "Women's 50+ multivitamin", pack: "300 tablets, One A Day Women's 50+", store: "Costco", where: "Warehouse",
    size: 300, price: 15.99, priceNote: "$15.79–20.99",
    url: "https://app.warehouserunner.com/costco/1274752-one-a-day-women-s-50-healthy-advantage-300-tablets",
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
};

// The no-membership plan swaps the Costco items, and the Amazon food and vitamins, for Walmart.
// Buckets, mylar, toddler drops, the scale and the gear stay on Amazon.
// Walmart prices checked on walmart.com, 23 November 2026.
const WALMART = {
  rice: {
    item: "White rice", pack: "20-lb bag, Great Value long grain", sizeGrams: 9072, price: 11.57,
    url: "https://www.walmart.com/ip/Great-Value-Long-Grain-Enriched-Rice-20-lb/10315883",
  },
  beans: {
    item: "Pinto beans", pack: "20-lb bag, Great Value", sizeGrams: 9072, price: 14.98,
    url: "https://www.walmart.com/ip/Great-Value-Pinto-Beans-20-lb/10315741",
  },
  oats: {
    item: "Rolled oats", pack: "42-oz canister, Great Value old fashioned", sizeGrams: 1191, price: 4.18,
    url: "https://www.walmart.com/ip/Great-Value-Instant-100-Whole-Grain-Old-Fashioned-Oats-Cup-42-oz/10314925",
  },
  pb: {
    item: "Peanut butter", pack: "40-oz jar, Great Value creamy", sizeGrams: 1134, price: 3.98,
    url: "https://www.walmart.com/ip/Great-Value-Creamy-Peanut-Butter-40-oz-Jar/10315479",
  },
  oil: {
    item: "Vegetable oil", pack: "1-gallon bottle, Great Value", sizeGrams: 256 * 13.6, price: 8.78,
    url: "https://www.walmart.com/ip/Great-Value-Vegetable-Oil-1-Gallon/10451011",
  },
  salt: {
    item: "Iodized salt", pack: "26-oz canister, Morton", sizeGrams: 737, price: 1.52,
    url: "https://www.walmart.com/ip/Morton-Iodized-Salt-26-oz/10448936",
  },
  milk: {
    item: "Nonfat dry milk", pack: "64-oz bag, Great Value instant", sizeGrams: 1814, price: 23.58,
    url: "https://www.walmart.com/ip/Great-Value-Instant-Nonfat-Dry-Milk-64-oz-Bag-Makes-20-Quarts-80-Servings-per-Container/10415475",
  },
  whole: {
    item: "Whole dry milk (under age 2)", pack: "56.4-oz can, Nido Fortificada", sizeGrams: 1599, price: 19.93,
    url: "https://www.walmart.com/ip/NIDO-Fortificada-Dry-Whole-Milk-Powder-with-Vitamins-A-C-D-Iron-Calcium-56-4-oz-Canister/14869811",
  },
  multiMen: {
    item: "Men's multivitamin", pack: "200 tablets, Equate One Daily Men's", size: 200, price: 9.82,
    url: "https://www.walmart.com/ip/Equate-One-Daily-Men-s-Multivitamin-Multimineral-Supplement-Tablets-200-Count/10324918",
  },
  multiWomen: {
    item: "Women's multivitamin with iron", pack: "200 tablets, Equate One Daily Women's", size: 200, price: 9.82,
    url: "https://www.walmart.com/ip/Equate-One-Daily-Women-s-Multivitamin-Multimineral-Supplement-Tablets-for-Women-s-Health-200-Count/10324688",
  },
  multiWomen50: {
    item: "Women's 50+ multivitamin", pack: "200 tablets, Equate Complete Women 50+", size: 200, price: 12.94,
    url: "https://www.walmart.com/ip/Equate-Complete-Multivitamin-Multimineral-Supplement-Tablets-Women-50-200-Count/46521544",
  },
  multiKids: {
    item: "Children's chewable multivitamin", pack: "150 tablets, Equate Children's Chewable Complete", size: 150, price: 8.64,
    url: "https://www.walmart.com/ip/Equate-Children-s-Chewable-Complete-Multivitamin-Tablets-for-Children-s-Health-150-Count/10324825",
  },
  vitC: {
    item: "Vitamin C, backup", pack: "100 tablets, Spring Valley 500 mg", size: 100, price: 4.74,
    url: "https://www.walmart.com/ip/Spring-Valley-Vitamin-C-with-Rose-Hips-500-mg-100-Count-Dietary-Supplement-Tablets-for-Immune-Health/6139509340",
  },
};

export const STORE_PLANS = {
  costco: { label: "Costco + Amazon", choice: "Costco and Amazon", stores: ["Costco", "Amazon"] },
  walmart: { label: "Walmart + Amazon", choice: "Walmart and Amazon", stores: ["Walmart", "Amazon"] },
};

export function productsFor(plan = "costco") {
  if (plan !== "walmart") return PRODUCTS;
  const out = { ...PRODUCTS };
  for (const [k, v] of Object.entries(WALMART)) out[k] = { ...v, store: "Walmart", where: "Online or in store" };
  return out;
}

// Gear lifespans.
export const BIC_LIGHTS = 3000;          // BIC: "up to 3,000 lights" per Classic lighter
export const LIGHTS_PER_FIRE = 10;       // allow about 10 seconds of flame to get kindling going
export const LIFESTRAW_GALLONS = 1000;   // LifeStraw Personal: up to 1,000 gallons (4,000 L) of clear water
export const STRAW_MIN_AGE = 3;          // younger children can't pull hard enough; boil their water

export const COSTCO_MEMBERSHIP = 65;
export const LB_PER_BUCKET = 33; // rice or beans per 5-gallon bucket, sealed in mylar

export const ACTIVITY = {
  sedentary: { label: "Mostly sitting", hint: "Little walking or physical work", factor: 1.2,   pal: "inactive" },
  light:     { label: "Light",          hint: "On your feet part of the day, short walks", factor: 1.375, pal: "low" },
  moderate:  { label: "Moderate",       hint: "Active most of the day: hauling water, chopping wood, long walks", factor: 1.55, pal: "active" },
  heavy:     { label: "Heavy",          hint: "Hard physical work all day", factor: 1.725, pal: "very" },
};
