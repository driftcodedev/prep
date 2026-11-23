# prep

A one-page calculator for storing food for a long power outage. You enter each person in the household (sex, age, height, weight and activity level) and how many months the food should last. The page then gives you:

- **A daily card for each person**, with level-cup and spoon amounts of rice, pinto beans, oats, peanut butter, oil, dry milk, salt and a vitamin.
- **Cooking amounts for the whole household**, with each person's share of the pot.
- **One shopping list for Costco and Amazon**, rounded up to whole packages, with prices and links.
- **The weekly weigh-in rules** and the cooking and storage notes.
- **A print layout**, so you have everything on paper before the power goes out.

Live site: https://bretts600.github.io/prep/

## How it works

- Adults above the healthy BMI range (18.5–24.9) are planned down to BMI 24.4, using rations 500 calories below maintenance. Those rations never go under 1,500 calories for men or 1,200 for women. Once they reach that weight, they switch to a ration that holds it. Adult calories use the Mifflin-St Jeor equation times an activity factor.
- Children (1–17) use the National Academies' 2023 energy equations and never get a weight-loss ration. Children under 2 get whole dry milk, and milk amounts follow the American Academy of Pediatrics.
- Pregnant and breastfeeding women never get a weight-loss ration.
- The shopping list comes from a day-by-day weight model that follows the weekly weigh-in rules, plus the margin you choose.

Everything runs in the browser. Nothing anyone types is sent or stored anywhere except that browser's local storage.

## Updating prices

All prices, package sizes and links are in `js/data.js`. Change the numbers there and update `PRICES_CHECKED`.

## Running the tests

```
npm test
```

The tests check the energy equations and confirm the calculator reproduces the original plan this was built from: a 30-year-old, 6'0", 200 lb man at light activity gets 1¼ cups of rice (2,174 calories) until he reaches 180 lb, then 1¾ cups (2,631 calories).

These are estimates for healthy people, not medical advice.
