// The site's own README pages, shown by the README button (shell/readme.js).
//
// After changing anything here, run `npm run readme`. It writes the page list into index.html,
// works out each page's "base" fingerprint and "aka" names, and `npm test` checks they match.
//
// Keep a page's id once it is published: readers' edits of that page are saved under its id.
// "names" are other names for the page; a reader's own page with one of these names takes the
// site's page in, showing the site's notes under theirs.

import { createHash } from "node:crypto";

export const PAGES = [
  {
    id: "about",
    title: "About prep",
    names: ["About", "About this site", "Overview"],
    html: `
<p><b>prep</b> works out how much food a household needs to store for a long power outage, and how much each person eats each day. It was built for one family's plan and shared with friends.</p>
<h3>Two tabs</h3>
<ul>
<li><b>Short Term:</b> the finished plan. Enter everyone in the household and how long the food should last. You get each person's daily amounts, cooking amounts, a shopping list and the gear.</li>
<li><b>Long Term:</b> a workspace for the long-term plan, still being built. It asks for a password.</li>
</ul>
<h3>Your information stays with you</h3>
<p>Nothing you type is sent anywhere. The household you enter is kept in this browser only, so another phone or computer starts blank.</p>
<p>These are estimates for healthy people, not medical advice.</p>
<h3>These notes</h3>
<p>Press <b>Edit</b> to change a page, or <b>+ New page</b> to add your own. Your changes stay in this browser only. <b>Export my notes</b> saves a copy.</p>
<h3>Share the site</h3>
<p>Send friends this link:</p>
<pre class="rmcopy">https://driftcodedev.github.io/prep/</pre>
`,
  },
  {
    id: "long-term",
    title: "The Long Term tab",
    names: ["Long Term", "Long Term plan", "Password"],
    html: `
<p>The Long Term tab is a workspace for the long-term plan. It's still being built. These notes are only on this tab, so you only see them after the password.</p>
<ul>
<li><b>The password</b> is asked every time: whenever the page loads, and whenever you go back to Short Term.</li>
<li><b>Lock this tab</b> locks it straight away.</li>
<li><b>Edits to these notes</b> stay in your browser, so nobody else sees them.</li>
<li><b>The lock keeps casual visitors out.</b> It isn't real security: the site's files, these pages included, are public on GitHub. Keep anything truly private off the site.</li>
</ul>
`,
  },
  {
    id: "short-term",
    title: "Using the Short Term plan",
    names: ["Short Term", "Short Term plan", "How to use"],
    html: `
<ol>
<li>Under <b>Your household</b>, press <b>Add a person</b> for each person and fill in their sex, age, height, weight and how active they are. To see how it works first, press <b>Fill in an example household</b>.</li>
<li>Choose <b>How long the food should last</b> and the <b>Extra margin</b>.</li>
<li>Choose <b>Where you'll shop</b>: Costco and Amazon, or Walmart and Amazon.</li>
<li>Tick anything you already own under <b>Already have?</b> so it stays off the list.</li>
</ol>
<p>The plan appears below as you type.</p>
<h3>What you get</h3>
<ul>
<li><b>Daily amounts:</b> a card for each person in level cups and spoons, plus how much water to drink.</li>
<li><b>Cooking for everyone:</b> how much dry rice and beans to cook each day, each person's share, and how to cook it all in one pot.</li>
<li><b>Shopping list:</b> rounded up to whole packages, with prices and links.</li>
<li><b>Fire, water and cooking:</b> lighters, water filters, a pot, a tripod and the rest of the gear.</li>
<li><b>Weekly weigh-in:</b> how to adjust the amounts using a bathroom scale.</li>
</ul>
<h3>Keep a paper copy</h3>
<p>At the end of the plan, press <b>Print the full report</b> or <b>Download PDF</b>.</p>
`,
  },
  {
    id: "amounts",
    title: "How the amounts are worked out",
    names: ["Calories", "Weight", "How it works"],
    html: `
<ul>
<li><b>Adults above a healthy weight</b> are planned down to one (a BMI of 24.4), eating 500 calories less than it takes to hold their weight. That never goes under 1,500 calories for men or 1,200 for women. Once they get there, they switch to amounts that hold it.</li>
<li><b>Keep current weight:</b> each adult's card has a switch to hold their weight instead of losing.</li>
<li><b>Children</b> never get a weight-loss ration.</li>
<li><b>Babies under 1</b> get formula by weight, iron-fortified infant cereal from 6 months, and mashed rice and beans from 8 months. At the first birthday they move to the toddler amounts.</li>
<li><b>Pregnant and breastfeeding women</b> never get a weight-loss ration, and get extra food. A breastfeeding mother's extra follows her baby: half if the baby also has formula, and it stops at the baby's first birthday.</li>
</ul>
<p>The numbers are estimates. The <b>Weekly weigh-in</b> rules on the page say how to adjust them from what the scale shows. <b>How the numbers are worked out</b>, at the end of the plan, lists the sources.</p>
`,
  },
  {
    id: "prices",
    title: "Prices and products",
    names: ["Prices", "Products", "Shopping"],
    html: `
<ul>
<li><b>Two ways to shop:</b> Costco and Amazon (needs a Costco membership), or Walmart and Amazon (no membership).</li>
<li><b>How products were picked:</b> cheap options first, with lots of ratings and few one-star reviews.</li>
<li><b>When prices were checked:</b> the date is at the bottom of the Short Term page. Prices change, so confirm at checkout.</li>
<li><b>Gear you own:</b> tick it under <b>Already have?</b> and it comes off the list and the total.</li>
</ul>
`,
  },
  {
    id: "gas-pump",
    title: "Pumping gas out of a car",
    names: ["Gas pump", "GasTapper", "Siphon", "Getting gas from a car"],
    html: `
<p>The <b>GasTapper Standard</b>, made by FlowJoe, is a small electric pump in a carrying case. It moves gas out of a car's tank into gas cans, or from cans into a generator or another car. Checked 25 November 2026.</p>
<table>
<tr><th>Price</th><td>$68.99 to $109.95 (see Where to buy below).</td></tr>
<tr><th>Ratings</th><td>4.4 out of 5 stars from about 1,200 ratings on Amazon. The share of one-star ratings couldn't be checked.</td></tr>
<tr><th>Power</th><td>Electric, 12 volts. A 15-foot cord plugs into a car's lighter socket, so the car you're emptying can run it. It has a fuse and an on/off switch on the cord. It also runs from a portable 12-volt battery, but not from a car battery charger.</td></tr>
<tr><th>Speed</th><td>Up to 30 gallons an hour, about half a gallon a minute. One tester moved 3.2 gallons in just over 6 minutes; a buyer says about 10 minutes per 5-gallon can.</td></tr>
<tr><th>In the case</th><td>Two 8-foot hoses, a thinner 6-foot line, the power cord and a filter, in a fume-proof case with a handle. About 4½ lb.</td></tr>
<tr><th>Warranty</th><td>1 year from the maker.</td></tr>
</table>
<h3>Which cars it works on</h3>
<p>There's no count of the cars it works on and no success rate. The maker says it works on most cars, trucks, tractors and boats, and suggests testing your own car first.</p>
<ul>
<li>Most newer cars have a valve or screen in the filler neck that stops a hose. The kit's stiffer hoses are made to push past it, but not every car lets them through.</li>
<li>One buyer couldn't get any hose through the bends to the tank of a 2002 Toyota Tacoma, though it worked on their car.</li>
<li>A one-star review says it's useless on a lot of vehicles.</li>
</ul>
<p><b>Test it on your own car now</b>, while gas stations are open, so you know whether it works before you need it.</p>
<h3>What reviewers say</h3>
<ul>
<li><b>Good:</b> it pumps cleanly with no mess, the hoses are long, and it runs from any car's lighter socket.</li>
<li><b>Not so good:</b> it's slow, the case is hard to close with everything packed in, and the hoses can't reach the tank on some vehicles.</li>
</ul>
<h3>Using it safely</h3>
<ul>
<li>Work outdoors, with the pump switched off and unplugged while you set it up.</li>
<li>Set the pump on the ground, never on or in a car. Flowing fuel builds up static that can spark a fire.</li>
<li>Drain it before you put it away; the manual shows how. Gas left sitting in fuel parts can gum them up.</li>
</ul>
<h3>Where to buy</h3>
<ul>
<li><a href="https://www.ebay.com/sch/i.html?_nkw=gastapper&amp;_sop=12" target="_blank" rel="noopener">eBay</a>: new from $68.99 with free delivery, the cheapest found.</li>
<li><a href="https://flowjoe.com/products/standard" target="_blank" rel="noopener">FlowJoe, the maker</a>: $98.95 on sale, normally $109.95.</li>
<li><a href="https://www.amazon.com/dp/B00QSPU0NS" target="_blank" rel="noopener">Amazon</a>: the price didn't load when checked.</li>
</ul>
<h3>Is it worth it?</h3>
<p>It's well rated and does the job slowly and cleanly. The big question is whether its hose gets into your car's tank. If you buy one, test it on your car as soon as it arrives, while you can still return it.</p>
`,
  },
  {
    id: "code",
    title: "Where the code is",
    names: ["Code", "For developers", "Repo"],
    html: `
<p>The site's code is on GitHub at <b>driftcodedev/prep</b>. GitHub Pages publishes the <b>main</b> branch a minute or two after each push.</p>
<table>
<tr><th>Folder</th><th>What's in it</th></tr>
<tr><td>short-term/</td><td>The Short Term plan. Prices and products are in short-term/js/data.js.</td></tr>
<tr><td>long-term/</td><td>The Long Term plan. Start with long-term/README.md.</td></tr>
<tr><td>shell/</td><td>The tabs, the password lock and this README. These pages are in shell/readme-pages.js.</td></tr>
<tr><td>index.html</td><td>The page that holds it all.</td></tr>
</table>
<h3>Change these notes</h3>
<p>Edit shell/readme-pages.js, keep each page's id, then run:</p>
<pre class="rmcopy">npm run readme
npm test</pre>
<h3>Try the site on your computer</h3>
<pre class="rmcopy">python3 -m http.server 8765</pre>
<p>Then open http://localhost:8765/.</p>
`,
  },
];

// A page's names, lowercased with spaces and punctuation removed (the README's matching rule).
export const norm = (t) => String(t || "").toLowerCase().replace(/[^a-z0-9]+/g, "");

// Short fingerprint of title + text: tells a reader the site's page changed under their edit.
export const fingerprint = (title, html) => createHash("sha256").update(title + "\n" + html).digest("hex").slice(0, 10);

export function pageList(pages = PAGES) {
  return pages.map(({ id, title, names = [], html }) => {
    const text = html.trim();
    return {
      id,
      title,
      html: text,
      base: fingerprint(title, text),
      aka: [...new Set([title, ...names].map(norm).filter(Boolean))],
    };
  });
}

// The JSON as it goes inside <script type="application/json" id="rmpages">. "</" is written
// as "<\/" so no page can close the script tag early.
export function pagesJson(pages = PAGES) {
  return JSON.stringify(pageList(pages), null, 1).replace(/<\//g, "<\\/");
}
