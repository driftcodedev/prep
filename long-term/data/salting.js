// Salting view words and numbers: how much salt a catch needs, how much Cobscook Bay water makes
// that salt, and how long it takes to boil down by wood or gasoline. js/salting.js draws the
// calculator and the guide from this file, and the paper copy (js/report.js) prints the same
// sections, so the by-hand formulas are on paper when the power is out.
//
// Every number has its source in SALT_SOURCES. Checked Nov 27, 2026.
//
// Section blocks use the report's block shapes (js/report.js), so they print as they show:
//   { t: "p", runs }   { t: "note", runs }   { t: "ul" | "ol", items: [runs] }
//   { t: "table", head[], rows[][], widths[], align[], size }
// runs: a string, or [{ text, b }] for bold bits.

export const SALT_CHECKED = "2026-11-27";

export const SALT_PAGE = {
  heading: "Salting",
  intro: "How much salt your catch needs, how much bay water makes that salt, and how long it takes to boil down over wood or a gasoline stove. Everything here works by hand too, and it's all in the printed report.",
  calcHeading: "Salt calculator",
  weightLabel: "Weight of the fish or meat",
  weightHint: "Pounds, after gutting and splitting. On a bathroom scale, weigh yourself holding the tub, then without it, and take the difference.",
  haveLabel: "Salt you already have",
  haveHint: "Pounds. The calculator only makes the rest from bay water.",
  methodLabel: "How you'll salt it",
  heatLabel: "What you'll boil the bay water on",
  ownRateLabel: "Your boil-off rate",
  ownRateHint: "Gallons an hour. Boil for an hour, measure how far the level dropped, and work out the gallons.",
  pptLabel: "Bay water saltiness",
  pptHint: "Parts per thousand. Cobscook Bay is over 30 almost everywhere, so 31 is the default. It's lower at the heads of the inner arms, at stream mouths and after heavy rain.",
  byHandHeading: "Work it out by hand",
  byHandIntro: "The calculator uses these steps, so you can do the same math on paper. With your numbers:",
};

// Cobscook Bay water: salinity is "generally marine (> 30 ppt)" except at the heads of the inner
// arms (Larsen 2004). At 31 parts per thousand, a gallon of bay water (about 8.5 lb) holds about
// 0.26 lb of dissolved salts, about four-fifths of it table salt; draining off the bitter last
// liquid leaves about 0.2 lb. Maine Sea Salt got about 1,500 lb from 7,000 gallons (0.21 lb a gallon).
export const BAY = {
  ppt: 31,                 // default saltiness, parts per thousand
  lbPerGal: 0.2,           // usable salt from a gallon at 31 ppt
  galPerLb: 5,             // the by-hand rule: 5 gallons (one bucket) per pound
};

export const CUPS_PER_LB = 1.5;     // fine canning salt: about 19 g a tablespoon, so 1 cup ≈ ⅔ lb
export const SQFT_PER_GAL = 1.6;    // 1 sq ft, 1 inch deep, holds 0.62 gallon
export const SUN_SHARE = 0.2;       // sun first: boil only the last fifth
export const GAL_PER_CORD = 400;    // block arch: about 400 gallons boiled off per cord of dry hardwood
export const GAS_GAL_PER_HR = 0.16; // Coleman 2-burner, both burners on high: 2.5 pints in 2 hours

// Ways of salting. rate = pounds of salt per pound of fish or meat (DFO's numbers are per 100 lb
// of split fish). byHand is the same rate said simply.
export const METHODS = [
  {
    id: "heavy", group: "Fish", name: "Heavy salt, dry pile",
    short: "Best for summer. Keeps for months once dried.",
    rate: 0.55, per100: "55 lb or more", byHand: "Half the fish's weight, plus 1 lb for every 20 lb",
    days: "At least 21 days in salt, longer when it's cool", keeps: "Months, once dried and kept cool, dry and sealed",
  },
  {
    id: "heavyPickle", group: "Fish", name: "Heavy salt, in its own brine",
    short: "Same as above in a tight tub. Uses less salt.",
    rate: 0.40, per100: "40 lb", byHand: "4 lb for every 10 lb of fish",
    days: "At least 21 days in the tub", keeps: "Months, once washed, dried and kept cool, dry and sealed",
  },
  {
    id: "light", group: "Fish", name: "Light salt, dry pile",
    short: "Cool weather only. Must be dried well and kept cool.",
    rate: 0.15, per100: "12 to 15 lb", byHand: "1½ lb for every 10 lb of fish",
    days: "5 to 9 days, depending on the temperature", keeps: "Only while kept cool. Use heavy salt for anything that has to last",
  },
  {
    id: "lightPickle", group: "Fish", name: "Light salt, in its own brine",
    short: "Cool weather only. The least salt.",
    rate: 0.10, per100: "About 10 lb", byHand: "1 lb for every 10 lb of fish",
    days: "4 to 6 days, depending on the temperature", keeps: "Only while kept cool. Use heavy salt for anything that has to last",
  },
  {
    id: "smoke", group: "Fish", name: "Brine, then smoke",
    short: "For smoked fish. Keeps about 2 weeks, and only at 40°F or colder.",
    rate: 0.26, per100: "26 lb (1 cup of salt for every 2½ lb of fish)", byHand: "1 cup of salt and 7 cups of water for every 2 to 3 lb of fish",
    days: "About 1 hour in the brine, then smoke", keeps: "About 2 weeks at 40°F or colder",
    waterCupsPerLb: 2.8,
  },
  {
    id: "cure", group: "Game", name: "Dry cure, cold months",
    short: "Big pieces of venison or other meat. Only at 36 to 40°F.",
    rate: 0.08, per100: "8 lb (plus 2 lb sugar if you have it)", byHand: "8 lb for every 100 lb of meat (1¼ oz a pound)",
    days: "7 days for every inch of thickness, at 36 to 40°F", keeps: "Months once cured and dried, in a cool, dry place",
  },
];

// What the bay water is boiled on. gph = gallons boiled off an hour.
export const HEAT = [
  { id: "wood2", name: "Wood fire, 2 steam pans", gph: 4, fuel: "wood", note: "Cinder-block arch with 2 full-size stainless pans: about 3 to 5 gallons an hour." },
  { id: "wood3", name: "Wood fire, 3 steam pans", gph: 6, fuel: "wood", note: "The same arch made longer for a third pan: about 5 to 7 gallons an hour." },
  { id: "gas", name: "Gasoline camp stove, 2 burners", gph: 0.5, fuel: "gas", note: "Estimate: about ½ gallon an hour with both burners on high. Time your first batch." },
  { id: "own", name: "My own rate", gph: null, fuel: null, note: "Use the rate you timed yourself." },
];

// The guide, as collapsible sections under the calculator (and parts of the printed report).
export const SALT_SECTIONS = [
  {
    id: "keeping",
    title: "Before salting: how long fresh catch keeps",
    blocks: [
      { t: "p", runs: "Salt has to go in before the fish or meat starts to spoil. Above 40°F, that's within about 2 hours of the catch (1 hour above 90°F)." },
      {
        t: "table",
        head: ["Where it's kept", "Fresh fish", "Fresh meat (steaks, roasts)"],
        rows: [
          ["Above 40°F (shade, cellar, the bay in summer)", "2 hours (1 hour above 90°F)", "2 hours (1 hour above 90°F)"],
          ["40°F or colder (like a fridge)", "1 to 2 days", "3 to 5 days"],
          ["Frozen solid", "Safe while it stays frozen", "Safe while it stays frozen"],
        ],
        widths: ["*", 130, 130],
        size: "s",
      },
      { t: "ul", items: [
        "The bay isn't a cooler. In July the water off Eastport averages about 54°F (12°C), too warm to hold dead fish. Keep the catch alive in a crate in the water until you're ready to clean it.",
        "Bleed fish while they're alive: cut the throat or the gills, and let them bleed 10 to 15 minutes, best in water. Then gut them right away.",
        "Always gut fish before salting them. Salted fish with the guts left in has caused botulism, which can kill. The FDA knows of no safe way to salt-cure ungutted fish 5 inches or longer.",
      ] },
    ],
  },
  {
    id: "cold",
    title: "Cold enough to skip the salt",
    blocks: [
      { t: "p", runs: "Fish and meat don't need salt while they stay frozen solid. Frozen food kept at 0°F or colder stays safe indefinitely. The time limits on freezer charts are about taste, not safety." },
      { t: "ul", items: [
        "Midwinter here is often cold enough. In Eastport, January averages a high of about 28 to 30°F and a low of about 7 to 14°F. Catch kept frozen in the shade on the north side of a building can stay frozen for long stretches of January and February.",
        "Watch for thaws. If it thaws, treat it as fresh: salt it, cook it or eat it.",
        "Between 32 and 40°F (late fall and early spring nights), it's like a fridge: 1 to 2 days for fish, 3 to 5 for meat.",
      ] },
    ],
  },
  {
    id: "storing",
    title: "Storing salted fish and meat: how warm is too warm",
    blocks: [
      {
        t: "table",
        head: ["Step", "Temperature", "Why"],
        rows: [
          ["Salting fish", "Under 54°F (12°C), best near 43°F (6°C)", "Warmer lets salt-loving bacteria spoil the fish while it cures"],
          ["Curing game", "36 to 40°F, steady", "Colder stops the cure; warmer lets it spoil"],
          ["Storing dried salt fish", "Best under 46°F (8°C)", "The pink bacteria can't grow below 46°F"],
          ["Storing dried salt fish", "68 to 77°F (20 to 25°C) is risky", "The brown spotty mold (\"dun\") grows well there"],
          ["Storing dried salt fish", "Above 77°F (25°C)", "Spoils much sooner, and faster still in damp air"],
        ],
        widths: [100, 150, "*"],
        size: "s",
      },
      { t: "ul", items: [
        "Salt cod with about 20% salt kept for 330 days at 41°F with no sign of spoiling.",
        "Keep it dark, dry and out of the sun. Damp air (over 75% humidity) brings mold, and summers here are damp.",
        "Both the pink bacteria and the mold need air. Once the fish is dry, seal it in a food bucket or mylar bag.",
        "Throw out fish that turns pink or smells off, and clean the area with fresh water. Never reuse salt.",
        "In summer, salt in the evening or at night in the coolest spot you have. July nights here average about 55°F.",
      ] },
    ],
  },
  {
    id: "fish",
    title: "How to salt fish, step by step",
    blocks: [
      { t: "p", runs: [{ text: "Heavy salt, dry pile", b: true }, { text: " (the summer method, from Canada's salt cod guide):" }] },
      { t: "ol", items: [
        "Bleed the fish alive and let it bleed 10 to 15 minutes. Gut it right away and take out all the guts and the liver.",
        "Cut off the head. Split the fish flat from the back of the head to the tail, and cut out the front part of the backbone.",
        "Wash it in clean, cold water with a soft brush. Don't leave it soaking, or the flesh goes soft. Salt it right after washing.",
        "Weigh the split fish and work out the salt: a bit over half its weight.",
        "Spread coarse salt ¼ inch thick on a clean surface. Lay the fish flat, flesh side up, head end to tail, with no overlaps, and cover it with salt. Keep layering, and cover the top layer completely. Keep piles under 4 feet high.",
        "Leave it at least 21 days, longer when it's cool. It's done when the salt has gone all the way through and the fish is firm.",
        "Wash off the salt and slime by dipping it in strong salt water, not plain water, which pulls salt back out. Drain it flesh side down on a rack for at least a day.",
        "Dry it in cool, dry, breezy weather; late summer and early fall are best. Don't dry it on hot, still days, when the flesh burns and goes soft. Bring it in at night and in rain or fog. Heavy-salted fish can wait in its pile for good weather.",
        "Store it cool, dark, dry and sealed (see above).",
      ] },
      { t: "p", runs: [{ text: "In its own brine:", b: true }, { text: " the same steps, but layer the fish and salt in a tight food-grade tub. The salt pulls water out of the fish and makes a brine that covers it. Weight the fish down so it stays under. After 21 days, wash, drain and dry it the same way." }] },
      { t: "p", runs: [{ text: "Light salt:", b: true }, { text: " the same steps with much less salt and 4 to 9 days in salt. Only for cool weather, and it has to stay cool afterward." }] },
      { t: "p", runs: [{ text: "Brine, then smoke:", b: true }, { text: " dissolve 1 cup of plain salt in 7 cups of water for every 2 to 3 lb of fish, keep it as cold as you can, and brine the fish about 1 hour before smoking. Smoked fish still needs to be kept at 40°F or colder and lasts about 2 weeks, so in summer use heavy salt instead." }] },
      { t: "note", runs: "Use plain salt with no iodine or anti-caking agent. Homemade bay salt works, once the bitter part is drained off (see Making salt from the bay)." },
    ],
  },
  {
    id: "game",
    title: "Salting game",
    blocks: [
      { t: "p", runs: [{ text: "Cold months (steady 36 to 40°F): dry cure.", b: true }] },
      { t: "ol", items: [
        "Chill the meat below 40°F before you start, and keep it there the whole time.",
        "Rub in 8 lb of salt for every 100 lb of meat (2 lb of sugar too, if you have it). Pack it in a food-grade tub or box.",
        "Leave it 7 days for every inch of thickness at the thickest part (a 3-inch piece takes 21 days).",
        "Brush off the salt, let it rest so the salt evens out, then hang it to dry in a cool place with moving air.",
      ] },
      { t: "p", runs: [{ text: "Summer: too warm to cure big pieces. Dry thin strips instead.", b: true }] },
      { t: "ol", items: [
        "Cut lean meat into strips ¼ inch thick or less.",
        "Heat the strips to 160°F before drying: boil them in salty water for 5 minutes. Drying alone doesn't kill the germs.",
        "Dry them fast in sun, wind and smoke until a strip cracks but doesn't snap when you bend it. Salt here is mostly for taste.",
      ] },
      { t: "note", runs: "Curing salt with nitrite (Prague Powder #1) adds protection for meat you'll smoke. Follow the package amount exactly, because too much is toxic. Salt-only cures still work in the cold." },
    ],
  },
  {
    id: "bay",
    title: "Making salt from the bay",
    blocks: [
      { t: "p", runs: [{ text: "The rule: one 5-gallon bucket of bay water makes about 1 pound of salt.", b: true }, { text: " A gallon gives about 0.2 lb (about ½ cup of flaky homemade salt)." }] },
      { t: "p", runs: [{ text: "Getting the water", b: true }] },
      { t: "ul", items: [
        "Take it from the open bay on a rising tide, away from stream mouths, and after a dry spell. The bay is over 30 parts per thousand almost everywhere, lower at the heads of the inner arms and after rain.",
        "Use clean water away from harbors, boats and outfalls. Never use it during a red tide warning.",
        "Haul it in food-grade buckets. Strain it through a cloth, let it settle, and pour off the clear water.",
      ] },
      { t: "p", runs: [{ text: "Boiling it down", b: true }] },
      { t: "ol", items: [
        "Boil hard in stainless pans. Keep topping up from the buckets so the pans stay at least 2 inches deep and don't scorch.",
        "At about a fifth of where you started, the water clouds over and white grit forms (calcium, called gypsum). Let it cool and settle, pour the clear brine off the grit, and throw the grit out.",
        "Keep heating, more gently now. At about a tenth of the start, salt crystals form. Don't boil hard; scoop the crystals out as they form.",
        "Stop while it's still a wet slush. Hang the crystals in a cloth bag over a bucket for a day. What drips out is the bitter part (magnesium), so throw it out. Calcium and magnesium make salt bitter and bad for curing.",
        "Dry the salt in the sun or a warm pan, stirring, until it flows. Store it sealed.",
        "If it still tastes bitter, rinse the crystals quickly in a little very salty water (water with all the salt it can hold). That washes off the bitter part without dissolving your salt.",
      ] },
      { t: "p", runs: [{ text: "Letting the sun do it (June to September)", b: true }] },
      { t: "ul", items: [
        "Pour bay water 1 inch deep into shallow pans, or a frame lined with black food-grade liner, under clear plastic to keep off rain and fog. Screen it against bugs.",
        "In summer, a 1-inch fill dries to salt in about 3 to 5 weeks, longer in fog. The old Maine Sea Salt works in Marshfield made salt this way, but only in summer.",
        "Each pound of salt needs about 8 square feet of pan, 1 inch deep, per batch. A 4 × 8 ft frame makes about 4 lb a batch.",
        "Fastest of all: let the sun take it down to a fifth, then finish it over the fire. You boil only a fifth of the water.",
      ] },
      { t: "p", runs: [{ text: "Winter trick (hard freezes)", b: true }] },
      { t: "ul", items: [
        "Bay water freezes at about 28°F, and the ice is mostly fresh water. Leave buckets out on a hard-freezing night, lift out the ice, and keep the saltier water left under it. Do it again, then boil what's left. You lose a little salt in the ice, but you save a lot of firewood.",
      ] },
      {
        t: "table",
        head: ["Months", "Making salt", "Fish", "Game"],
        rows: [
          ["Jun–Sep", "Sun pans under plastic, finish over a fire", "Heavy salt, salted at night; dry it in late summer", "Too warm to cure. Dry strips"],
          ["Oct–Nov, Apr–May", "Wood fire; the sun is weak", "Heavy or light salt; early fall is good drying weather", "Cure only when the shed holds 36 to 40°F"],
          ["Dec–Mar", "Freeze buckets, then boil the rest", "Freezes outside; no salt needed while frozen", "Freezes outside, or cure in a 36 to 40°F shed"],
        ],
        widths: [70, 120, "*", 120],
        size: "s",
      },
    ],
  },
  {
    id: "gear",
    title: "Pots, fire and fuel",
    blocks: [
      { t: "p", runs: [{ text: "Wood: a cinder-block arch with steam table pans", b: true }, { text: " (the cheapest, fastest way)." }] },
      { t: "ul", items: [
        "Stack cinder blocks around a fire, 3 high, and set full-size stainless steam table pans (about 12 × 20 inches, 6 inches deep) across the top. This is how backyard maple syrup makers boil sap.",
        "2 pans boil off about 3 to 5 gallons an hour, and 3 pans about 5 to 7. A hot fire boils about 1½ gallons an hour for each square foot of pan over the flames, so wider beats deeper.",
        "The pan doesn't have to hold all the water. Keep feeding it from buckets.",
        "Burn dry, split hardwood. A block arch boils off about 400 gallons per cord (a stack 4 ft high, 4 ft deep and 8 ft long). That's about 80 lb of salt per cord from raw bay water, or about 400 lb if the sun does the first part.",
      ] },
      { t: "p", runs: [{ text: "Gasoline: a dual-fuel camp stove", b: true }] },
      { t: "ul", items: [
        "The Coleman Dual Fuel 2-burner stove burns plain unleaded gasoline (or camp fuel). Its 2.5-pint tank lasts about 2 hours with both burners on high, about 0.16 gallon an hour, and it takes two 10-inch pots.",
        "Expect about ½ gallon of water boiled off an hour (an estimate: time your first batch). Boiling raw bay water this way takes about 10 hours and 1½ gallons of gasoline per pound of salt.",
        "So use gasoline to finish brine the sun has already cut to a fifth: about 2 hours and ⅓ gallon of gasoline per pound of salt.",
        "Use it outdoors only, never in a building or tent (carbon monoxide). Never pour gasoline on a wood fire. For getting gas out of a car, see the Pumping gas out of a car page.",
      ] },
      { t: "p", runs: [{ text: "What pots to use", b: true }] },
      { t: "ul", items: [
        "Stainless steel. Even stainless can rust with salt, so rinse the pans in fresh water and dry them after every batch.",
        "Not aluminum: salt dried in aluminum trays came out gray and high in aluminum. Not cast iron (rusts), and never galvanized metal.",
        "Haul and store water, brine and salt in food-grade plastic buckets.",
      ] },
    ],
  },
  {
    id: "buy",
    title: "Buying and storing salt",
    blocks: [
      { t: "ul", items: [
        "Stocking up on store salt is far easier than making it. Buy plain canning and pickling salt: it has no iodine or anti-caking agent, which is what curing calls for.",
        "Never use water-softener salt, ice melt, rock salt or pool salt for food.",
        "Plain salt never goes bad if it's kept dry. Morton dates canning salt at 3 years only because it can cake; break up the lumps and use it. Seal it in food buckets or mylar.",
        "Neither canning salt nor bay salt has iodine. Keep some iodized salt for the table (its iodine fades after about 5 years), and eat seaweed.",
      ] },
    ],
  },
  {
    id: "eating",
    title: "Eating salt fish",
    blocks: [
      { t: "ul", items: [
        "Rinse it, then soak it in cold fresh water: about 18 to 24 hours for boneless pieces and 36 to 48 hours for bone-in, changing the water at least 3 or 4 times.",
        "That takes a lot of fresh water, so plan for it. Taste a corner; if it's still too salty, soak it longer.",
        "Salted fish is still raw. Cook it.",
        "Salty food makes you thirsty. Drink more water on salt-fish days.",
      ] },
    ],
  },
];

// Gear with prices (checked Nov 27, 2026). Cheapest sensible pick first.
export const SALT_GEAR = [
  {
    item: "Morton Canning & Pickling Salt, 4 lb", price: "$2.52", where: "Walmart",
    url: "https://www.walmart.com/ip/10318924",
    note: "4.5 stars from about 360 ratings. 100 lb of split fish, heavy salted, takes 55 lb: 14 boxes, about $35.",
  },
  {
    item: "Full-size stainless steam table pan, 6 inches deep (Choice, 24 gauge)", price: "$18.54 each", where: "WebstaurantStore",
    url: "https://www.webstaurantstore.com/6-deep-full-size-standard-weight-stainless-steel-steam-table-hotel-pan-anti-jam/4070069.html",
    note: "2 or 3 for a block arch. 18/8 stainless.",
  },
  {
    item: "Coleman Guide Series Dual Fuel 2-burner stove", price: "$132.99", where: "Walmart",
    url: "https://www.walmart.com/ip/44503982",
    note: "Burns unleaded gasoline. 4.3 stars from 248 ratings; the share of 1-star ratings wasn't shown.",
  },
];

export const SALT_SOURCES = [
  ["Fisheries and Oceans Canada: Handling and processing salt cod (salt per 100 lb, time in salt, washing, drying, pink and dun)", "https://waves-vagues.dfo-mpo.gc.ca/library-bibliotheque/40600476.pdf"],
  ["FDA: Uneviscerated fish that are salt-cured, dried or smoked (botulism)", "https://www.fda.gov/regulatory-information/search-fda-guidance-documents/cpg-sec-540650-uneviscerated-fish-products-are-salt-cured-dried-or-smoked-revised"],
  ["FDA Import Alert 16-74: ungutted fish 5 inches or longer", "https://www.accessdata.fda.gov/cms_ia/importalert_48.html"],
  ["USDA FSIS: Food safety basics (2 hours, 1 hour above 90°F)", "https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/steps-keep-food-safe"],
  ["FoodSafety.gov: Cold food storage charts", "https://www.foodsafety.gov/food-safety-charts/cold-food-storage-charts"],
  ["University of Minnesota Extension: Storage times (smoked fish 14 days)", "https://extension.umn.edu/preserving-and-preparing/storage-times-food-refrigerator-and-freezer"],
  ["Pacific Northwest Extension PNW 238: Smoking fish at home safely (1 cup salt to 7 cups water)", "https://ccfruitandnuts.ucanr.edu/sites/default/files/2020-12/341283.pdf"],
  ["Nofima: Saltfish and clipfish, facts about shelf life (pink and dun temperatures)", "https://nofima.no/wp-content/uploads/2015/11/Saltfish_and_clipfish_-_Facts_about_shelf_life1.pdf"],
  ["Matís: Microbiological changes during storage of salted cod fillets (330 days at 5°C)", "https://www.matis.is/media/utgafa//Skyrsla_04-06.pdf"],
  ["Silva et al.: Quality changes during salt-curing of cod at different temperatures", "https://agris.fao.org/search/en/records/65dfa1580f3e94b9e5dac7bb"],
  ["Lorentzen et al.: Shelf life of dried salt-cured cod at 25 to 35°C", "https://agris.fao.org/search/en/records/65dea311b766d82b18fdd7ad"],
  ["Virginia Tech: Virginia-style dry-cured ham (8 lb salt per 100 lb, 36 to 40°F)", "https://pubs.ext.vt.edu/458/458-223/458-223.html"],
  ["Mississippi State Extension: Curing pork products at home (7 days per inch)", "https://extension.msstate.edu/publications/curing-pork-products-home"],
  ["National Center for Home Food Preservation: Curing and smoking review (salt without iodine, nitrite)", "https://nchfp.uga.edu/publications/nchfp-publications/literature-reviews/cure-smoke-review-preservation/"],
  ["USDA FSIS: Jerky and food safety (heat to 160°F)", "https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/meat-fish/jerky"],
  ["Larsen 2004, Northeastern Naturalist: Cobscook Bay salinity over 30 ppt", "https://eaglehill.us/NENAonline/articles/NENA-sp-2/12-Larsen.shtml"],
  ["Eastport sea temperature in July", "https://seatemperatures.net/north-america/united-states/eastport-july-temperature/"],
  ["Eastport climate averages", "https://www.timeanddate.com/weather/@4963494/climate"],
  ["Britannica: Evaporites (gypsum at a fifth, salt at a tenth)", "https://www.britannica.com/science/sedimentary-rock/Evaporites"],
  ["America's Test Kitchen: Homemade sea salt (clean water, red tide, bitter calcium and magnesium)", "https://www.americastestkitchen.com/cooksillustrated/recipes/9706-homemade-sea-salt"],
  ["NOAA Fishery Leaflet 554: salt for curing must be free of calcium and magnesium", "https://fisherybulletin.nmfs.noaa.gov/sites/default/files/legacy-pdfs/leaflet554.pdf"],
  ["Edible Boston: Sea salt (about ½ cup a gallon)", "https://www.edibleboston.com/edible-boston/sea-salt"],
  ["New England Today: Maine Sea Salt, 7,000 gallons to about 1,500 lb", "https://newengland.com/food/salt/"],
  ["Vineyard Gazette: 1-inch evaporator under a hoop house, 3 to 5 weeks", "https://d9.vineyardgazette.com/comment/66423"],
  ["LibreTexts: Formation of sea ice (freezes at 28.4°F, ice has little salt)", "https://geo.libretexts.org/Bookshelves/Oceanography/Oceanography_101_(Miracosta)/07%3A_Properties_of_Seawater/7.05%3A_Formation_of_Sea_Ice"],
  ["Permies: block-arch boil rates (1.5 gallons an hour per sq ft)", "https://permies.com/mobile/t/59912/Large-Outdoor-Wood-Burning-Maple"],
  ["Finding Dulcinea: about 3 gallons an hour on wood with a 24 × 24 inch pan", "https://findingdulcinea.com/best-maple-syrup-evaporators/"],
  ["Permies: about 10,000 BTU to boil off a gallon; ¼ cord for 3 gallons of syrup", "https://permies.com/mobile/t/266511/BTU-hour-tube"],
  ["Mother Earth News: a cord per 25 gallons of syrup on a professional evaporator", "https://www.motherearthnews.com/diy/making-maple-syrup-zm0z92zsie/"],
  ["REI: Coleman Dual Fuel 2-burner specs (14,000 BTU, 2 hours on 2.5 pints)", "https://www.rei.com/product/883480/coleman-guide-series-dual-fuel-2-burner-stove"],
  ["Sunset: aluminum in salt dried on aluminum trays", "https://sunset.com/?p=9005"],
  ["UC Master Food Preservers: Morton canning salt weighs 18.9 g a tablespoon", "https://ucanr.edu/program/uc-master-food-preserver/article/salt-only-rock-we-eat-may-2025"],
  ["Morton: Salt expiration guide", "https://www.mortonsalt.com/article/morton-salt-expiration-guide"],
  ["Ohio State Extension: Making jerky (boil strips in the marinade 5 minutes)", "https://ohioline.osu.edu/factsheet/hyg-5362"],
  ["Permies: freezing Bay of Fundy water in buckets and lifting off the ice", "https://permies.com/t/40112/harvesting-salt-ocean-tips"],
  ["Farm Standard: keep at least 2 inches in an evaporator pan so it doesn't scorch", "https://www.farmstandapp.com/?p=832794"],
  ["Heritage Seaweed: Maine Sea Salt made salt only in the summer months", "https://www.heritageseaweed.com/collections/all/products/maine-sea-salt-with-dulse-6oz-maine-sea-salt-company"],
  ["Farm Standard: the cinder-block arch with steam table pans", "https://www.farmstandapp.com/182829/best-maple-syrup-evaporators-for-hobby-farms/"],
  ["Saveur: Soaking salt cod", "https://www.saveur.com/article/Techniques/Buying-Salt-Cod"],
];
