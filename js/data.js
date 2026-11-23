// All food values, product sizes and prices live here so they are easy to update.
// Prices were checked 18–23 November 2026. Costco prices are warehouse prices and vary by location.

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
};

export const COSTCO_MEMBERSHIP = 65;
export const LB_PER_BUCKET = 33; // rice or beans per 5-gallon bucket, sealed in mylar

export const ACTIVITY = {
  sedentary: { label: "Mostly sitting", hint: "Little walking or physical work", factor: 1.2,   pal: "inactive" },
  light:     { label: "Light",          hint: "On your feet part of the day, short walks", factor: 1.375, pal: "low" },
  moderate:  { label: "Moderate",       hint: "Active most of the day: hauling water, chopping wood, long walks", factor: 1.55, pal: "active" },
  heavy:     { label: "Heavy",          hint: "Hard physical work all day", factor: 1.725, pal: "very" },
};
