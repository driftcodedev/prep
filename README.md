# prep

A one-page calculator for storing food for a long power outage. You enter each person in the household (sex, age, height, weight and activity level) and how many months the food should last. The page then gives you:

- **A daily card for each person**, with level-cup and spoon amounts of rice, pinto beans, oats, peanut butter, oil, dry milk, salt and a vitamin, plus how much water to drink.
- **Cooking amounts for the whole household**, with each person's share of the pot.
- **One shopping list**, rounded up to whole packages, with prices and links. Choose Costco and Amazon (needs a membership) or Walmart and Amazon (no membership).
- **Fire and water gear**: BIC lighters, LifeStraw filters (the cheapest mix of 1-, 3- and 5-packs for one straw per person age 3 and up), a waterBOB bathtub bladder, an EarthMinded rain diverter kit (Home Depot), a splitting axe and a Casio solar watch for timing the pot, with how long each lasts. Tick off anything you already own.
- **Cooking over a fire**: what a simmer looks like and how to hold one on a fire, timers and doneness checks for rice and beans, and wrapping the pot to save wood.
- **Water use**: how much water goes in the pot for the rice, beans, oats and milk, the household's daily total, and how long a full waterBOB and a rain-fed trash can last.
- **Two videos** at the top: what happens when the grid goes down, and how to install the rain diverter.
- **The weekly weigh-in rules** and the cooking and storage notes.
- **The full report on paper**: print it from the page, or download it as a PDF.

Live site: https://driftcodedev.github.io/prep/

## How it works

- Adults above the healthy BMI range (18.5–24.9) are planned down to BMI 24.4, using rations 500 calories below maintenance. Those rations never go under 1,500 calories for men or 1,200 for women. Once they reach that weight, they switch to a ration that holds it. Adult calories use the Mifflin-St Jeor equation times an activity factor.
- Children (1–17) use the National Academies' 2023 energy equations and never get a weight-loss ration. Children under 2 get whole dry milk, and milk amounts follow the American Academy of Pediatrics.
- Pregnant and breastfeeding women never get a weight-loss ration.
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
