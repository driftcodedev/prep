# prep

A one-page calculator for storing food for a long power outage. You enter each person in the household (sex, age, height, weight and activity level) and how many months the food should last. The page then gives you:

- **A daily card for each person**, with level-cup and spoon amounts of rice, pinto beans, oats, peanut butter, oil, dry milk, salt and a vitamin, plus how much water to drink. Babies under 1 get formula, infant cereal and vitamin D drops instead.
- **Cooking amounts for the whole household**: how much dry rice and beans to cook each day and about how much that makes, with each person's share both cooked and dry, and a household total. Cooked shares are rounded to ¼ cup so they add up to the pot.
- **One shopping list**, rounded up to whole packages, with prices and links. Choose Costco and Amazon (needs a membership) or Walmart and Amazon (no membership).
- **Fire, water and cooking gear**: BIC lighters, LifeStraw filters (the cheapest mix of 1-, 3- and 5-packs for one straw per person age 3 and up), a waterBOB bathtub bladder, an EarthMinded rain diverter kit (Home Depot), a splitting axe, a Lodge cast iron camp Dutch oven sized to the household (5 qt for 1–2 people, 8 qt for 3–6, 10 qt for 7 or more, bigger if the day's beans wouldn't fit ¾ full, with every size listed in cups), a Lodge 43.5-inch campfire tripod with an adjustable chain, a Pot Minder disc that chatters when the pot boils, and a Casio solar watch for timing the pot, with how long each lasts. Tick off anything you already own.
- **Short Term and Long Term tabs**: everything above is the Short Term plan. The Long Term tab is a workspace behind a light password lock (the page keeps only a SHA-256 fingerprint of the password; nothing is remembered: it locks again on every page load and whenever you switch away from it). It keeps casual visitors out but isn't real security, since the site's files are public.
- **All in one pot**: the whole day's beans, rice and oats cooked together (beans first, then rice, then oats), with each person's serving in cooked cups by name. Shares follow each person's card by calories and add up to the pot.
- **Cooking over a fire**: what a simmer looks like and how to hold one on a fire, timers and doneness checks for rice and beans, and wrapping the pot to save wood.
- **Water use**: how much water goes in the pot for the rice, beans, oats and milk, the household's daily total, and how long a full waterBOB and a rain-fed trash can last.
- **Three videos** at the top: what happens when the grid goes down, how to install the rain diverter, and a ChatGPT whistleblower interview.
- **The weekly weigh-in rules** and the cooking and storage notes.
- **The full report on paper**: print it from the page, or download it as a PDF.

Live site: https://driftcodedev.github.io/prep/

## How it works

- Adults above the healthy BMI range (18.5–24.9) are planned down to BMI 24.4, using rations 500 calories below maintenance. Those rations never go under 1,500 calories for men or 1,200 for women. Once they reach that weight, they switch to a ration that holds it. Each card has a switch (for example "Lose to 180 lb | Keep 215 lb") to keep the current weight instead; the choice is saved with the household. Adult calories use the Mifflin-St Jeor equation times an activity factor.
- Children (1–17) use the National Academies' 2023 energy equations and never get a weight-loss ration. Children under 2 get whole dry milk, and milk amounts follow the American Academy of Pediatrics.
- Babies under 1 (enter age 0 and pick the months; height is optional) get formula by weight: about 2½ fl oz per pound a day, up to 32 oz (27 oz from 10 months), following the AAP. The plan grows the baby month by month, adds iron-fortified infant cereal at 6 months and mashed rice and beans at 8 months, and adds vitamin D drops for breastfed babies or those drinking under 32 oz of formula. At the first birthday it switches to the toddler ration. Formula water is counted in the water totals.
- Pregnant and breastfeeding women never get a weight-loss ration. Pregnancy adds about 350 calories. Breastfeeding adds about 400 (National Academies 2023: about 540 for the milk, minus 140 from her own stores), 25 g of protein (¼ cup more beans) and 13 cups of water. When a breastfed baby is on the list, her extra follows the baby: half if the baby also gets formula, and it stops at the baby's first birthday, when she goes back to her regular plan. A baby set to Breast milk or Both offers a one-click button to mark the mother as breastfeeding.
- The shopping list comes from a day-by-day weight model that follows the weekly weigh-in rules, plus the margin you choose.

Everything runs in the browser. Nothing anyone types is sent or stored anywhere except that browser's local storage.

## Updating prices

All prices, package sizes and links are in `js/data.js`: `PRODUCTS` for the Costco plan and the Amazon items, `WALMART` for the no-membership plan. Change the numbers there and update `PRICES_CHECKED`. The words shared by the page and the PDF live in `js/content.js`.

The PDF is built in the browser with [pdfmake](https://github.com/bpampuch/pdfmake) 0.3.15 (MIT), kept in `vendor/pdfmake/` and loaded only when someone clicks Download PDF.

## Running the tests

```
npm test
```

The tests check the energy equations and confirm the calculator reproduces the original plan this was built from: a 30-year-old, 6'0", 200 lb man at light activity gets 1¼ cups of rice (2,174 calories) until he reaches 180 lb, then 1¾ cups (2,631 calories).

These are estimates for healthy people, not medical advice.
