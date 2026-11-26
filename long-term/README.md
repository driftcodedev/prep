# Long Term plan: guide for working on this tab

This folder is the Long Term tab of the prep site. Everything for the long-term plan (code, words, numbers, styles and tests) lives here. Read this whole page before changing anything.

## Where it is

- **Repo:** `driftcodedev/prep` on GitHub, https://github.com/driftcodedev/prep, branch `main`. Its old name, `BrettS600/prep`, still redirects to it.
- **Live site:** https://driftcodedev.github.io/prep/. Click the Long Term tab, or open https://driftcodedev.github.io/prep/#long-term. GitHub Pages publishes `main` from the repo root a minute or two after each push.
- **Password:** Brett has it. It isn't written anywhere in the repo, because the repo is public.
- **Owner:** Brett. He often checks the site on his phone.

## Folder map

```
index.html            page frame: tab bar and both panels          don't edit
shell/                tabs.js (tabs + password lock), shell.css     don't edit
short-term/           the finished Short Term plan                  don't edit
long-term/            YOUR FOLDER
  app.js              entry point: render(), mount(), unmount()
  style.css           styles; every rule starts with #lt-root
  data/plan.js        words, amounts, prices and links
  test/app.test.js    tests (node:test)
  README.md           this guide
package.json          npm test runs both plans' tests
```

## Rules

1. **Change files only inside `long-term/`.** Another chat works on the Short Term plan in the same repo. If you need a change outside this folder (the tab bar, the lock, the "The long-term plan" heading at the top of the tab, or anything in the Short Term plan), stop and ask Brett.
2. Add as many files and subfolders under `long-term/` as you need, for example `long-term/js/` or `long-term/data/foods.js`. Use relative imports (`./data/foods.js`).
3. Keep the `mount(root, context)` and `unmount(root)` exports in `app.js`. The page frame calls them.
4. Keep facts, amounts, prices and links in `data/`, and the code that draws them in `app.js` (and any modules it imports), the way the Short Term plan splits `data.js` from the rest.

## How the tab works

- Clicking Long Term shows a password form. `shell/tabs.js` owns that form.
- After the right password, the frame imports `long-term/app.js` and calls `mount(root, context)`. `root` is the empty `<div id="lt-root">`. Nothing in this folder downloads before the password is entered.
- `mount` may be `async`; the frame waits for it. Afterwards the frame moves focus to the first `h1`–`h3` inside the plan.
- The tab locks again when someone switches to Short Term, presses **Lock this tab**, or reloads the page. The frame then calls `unmount(root)` and empties `#lt-root`.
- Each unlock calls `mount` again, so draw from scratch every time. The browser keeps the module loaded between unlocks, so reset any module-level variables inside `mount`. Stop timers and remove `window`/`document` listeners in `unmount`.
- The tab already has an `h1` ("The long-term plan") above your content, so start your headings at `h2`.
- `app.js` loads `style.css` from this folder the first time the plan opens.

### The household from the Short Term tab

`context.household` is the household the person entered on the Short Term tab, or `null` if they haven't entered anyone. Treat it as read-only, and never write to the `prep-household-v1` localStorage key it comes from. Its shape:

```js
{
  months: 6, reserve: 20, store: "costco",       // or "walmart"
  hasScale: false, hasLighters: false, ...,      // gear they already own
  people: [{
    id, name, sex,                               // sex: "male" | "female"
    age, months,                                 // strings as typed; age "0" means a baby, months gives the age
    ft, inch, weight,                            // strings as typed (feet, inches, pounds)
    activity,                                    // "sedentary" | "light" | "moderate" | "heavy"
    feeding,                                     // babies: "formula" | "breast" | "both"
    keepWeight,                                  // true = hold current weight instead of losing to a healthy BMI
    flags: { pregnant, breastfeeding, peanut, diabetes, kidney, celiac }
  }]
}
```

Values from the form are strings. Convert them before doing math.

### Reusing the Short Term math

You may import, read-only, from `../short-term/js/calc.js` (for example `planHousehold`, `planPerson`, `cupsText`) and `../short-term/js/data.js`. Don't edit those files. Cover anything you import with a test in `long-term/test/`, so you find out if the Short Term side changes. Never import `../short-term/js/app.js`: it runs the Short Term page as soon as it loads.

`planHousehold` and `planPerson` expect numbers (`heightIn`, `weightLb`, `age` in years), not the form's strings. `toPerson()` in `short-term/js/app.js` shows the conversion; copy it into `long-term/` rather than importing it.

## Look and wording

- Reuse the site's look, which is already loaded from `short-term/css/style.css`. `style.css` in this folder lists the colors (`var(--lid)`, `var(--bean)` and so on), fonts and classes (`.section-title`, `.muted`, `.btn`, `.field`, `.data` tables).
- Escape any text you put into HTML. `app.js` has `esc()` for this.
- Make it work on a phone first. Check it at 390 px wide.

## Brett's preferences

- Plain, short wording with no jargon, in sentence case.
- Amounts in cups and spoons people can measure, not grams.
- For products, cheap options first. Pick items with lots of ratings and a low share of 1-star reviews; around 10% one-star is a red flag. Give the price, the link, and the date prices were checked.
- Ask before big changes, or before adding things he didn't ask for.

## Try it locally

ES modules don't load from `file://`, so serve the folder:

```
git clone https://github.com/driftcodedev/prep.git
cd prep
python3 -m http.server 8765
```

Open http://localhost:8765/, click Long Term and enter the password.

Run the tests with Node 20 or newer:

```
npm test            # both plans
npm run test:long   # just this folder
```

## Publish

```
git pull --rebase origin main     # pick up the other chat's Short Term changes first
npm test
git add long-term/
git commit -m "Long term: <what changed>"
git push origin main
```

Stage only `long-term/` so you never commit someone else's work by accident. Then wait a minute or two, open https://driftcodedev.github.io/prep/#long-term, refresh, unlock, and check your change is there.
