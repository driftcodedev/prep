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
    id: "why-cobscook",
    title: "Why Cobscook Bay",
    names: ["Why Cobscook", "Cobscook Bay", "Why this place"],
    html: `
<p>Cobscook Bay is a tidal bay at the far eastern tip of Maine, between Eastport and Lubec, on the Canadian border. It was picked for the long-term plan because it has a lot of food, very few people and a climate you can live with. Here's each reason. Checked 26 November 2026.</p>
<h3>1. Food from the sea, refilled twice a day</h3>
<ul>
<li><b>Huge tides.</b> The tide rises and falls about 24 feet on average, and up to 28–30 feet. (One source puts the average nearer 18 feet; it depends where you measure.) Twice a day the tide swaps the bay's water with the Gulf of Maine, so food keeps coming in.</li>
<li><b>Very rich water.</b> The state calls the bay's waters exceptionally productive. Scientists say the Cobscook area has more kinds of sea creatures than anywhere else in eastern North America north of the tropics.</li>
<li><b>Shellfish.</b> It has some of the last big scallop beds in Maine. In 2012, Whiting and Dennys Bays, right by Dennysville and Edmunds, had the most harvestable scallops ever counted in the state's Cobscook survey. Clams and mussels can be dug or picked on the mud flats at low tide, with no boat.</li>
<li><b>Lots of eagles.</b> The bay has the most nesting bald eagles in the northeastern US. Eagles live on fish, so that's a good sign of how much food is in the water.</li>
<li><b>It doesn't run out like a pond.</b> A pond is closed, so once it's fished out it can take years to come back. The bay is open to the ocean and keeps being restocked. See <b>Species extinction</b>.</li>
</ul>
<h3>2. Temperature</h3>
<table>
<tr><th>Eastport</th><th>Average high</th><th>Average low</th><th>Sea water</th></tr>
<tr><td>January</td><td>30°F</td><td>14°F</td><td>40°F</td></tr>
<tr><td>July</td><td>74°F</td><td>53°F</td><td>51°F</td></tr>
</table>
<ul>
<li><b>Mild summers.</b> It rarely gets hot, so food keeps longer and hard work outside is easier.</li>
<li><b>Cold, snowy winters.</b> About 66 inches of snow a year. A house needs a wood stove and a big woodpile, and enough stored food to get to spring.</li>
<li><b>Garden season.</b> Last frost is around late April and first frost around mid-October, so roughly 5½ months to grow food. Hardiness zone 6a.</li>
<li><b>The bay stays open in winter.</b> The sea stays about 37–52°F all year, salt water doesn't freeze until about 28°F, and the strong tides keep it moving. So you can still fish and gather shellfish in winter, when inland lakes are frozen over. Shallow coves and the flats can still ice up in a cold snap.</li>
</ul>
<h3>3. Very few people</h3>
<ul>
<li>About 7,000 people live in the nine communities around the bay.</li>
<li>The towns are tiny: Dennysville 300, Pembroke 788, Perry 802, Lubec 1,237 and Eastport 1,288 (2020 census, the same numbers as on the map).</li>
<li>All of Washington County has about 31,000 people, and the nearest big cities are hours away.</li>
<li>In a long grid-down, fewer people means less competition for fish, game and firewood, and fewer people passing through.</li>
</ul>
<h3>4. Why Dennysville and the Edmunds shore</h3>
<ul>
<li><b>Dennysville</b> is where the Dennys River meets the tide in Dennys Bay: river and sea fishing in one place, plus fresh water from the river (filter or boil it).</li>
<li><b>The Edmunds shore</b>, along Dennys and Whiting Bays, is mostly woods with few homes, and includes Cobscook Bay State Park. The woods give firewood and game; the shore gives shellfish and fish.</li>
<li><b>Sheltered water.</b> The inner bays are calmer than the open bay, which suits a small boat or canoe. Keep well away from the Reversing Falls at Pembroke and from Lubec Narrows, where the tide runs fast and hard.</li>
<li><b>Salmon are off limits.</b> Wild Atlantic salmon still run up the Dennys River, one of only eight US rivers where they do. They're endangered, and catching them is illegal.</li>
</ul>
<h3>5. Houses and power</h3>
<ul>
<li>The map on this tab shows every house for sale within 10 miles of the bay, checked every week, including the few with off-grid solar.</li>
<li>Solar panels here make about 6 kWh a day per kW of panels in summer but only about 2 in winter, so a battery bank plus a generator or wood heat matters. Fog, cloud and short days are why: the sun shines about 37% of daylight hours in November and 58% in August.</li>
</ul>
<h3>The downsides</h3>
<ul>
<li><b>Winter is long.</b> From November to April you live on stored food, wood heat and what the bay gives.</li>
<li><b>Red tide.</b> Clams, mussels and scallops can carry a natural poison (paralytic shellfish poisoning). They look, smell and taste normal, and cooking doesn't make them safe. Today the state tests weekly from March to October and closes areas when it finds it. With no testing, take extra care from April to October, when blooms mostly happen. Numbness or tingling in the lips, face or hands after eating shellfish is the warning sign.</li>
<li><b>Remote.</b> The distance that keeps crowds away also means stores, hospitals and help are far off.</li>
</ul>
<h3>Sources</h3>
<ul>
<li><a href="https://cobscook.org/aboutthebay" target="_blank" rel="noopener">Cobscook Bay Resource Center: About the Bay</a>: tides, scallop beds, eagles, 7,000 people in nine communities.</li>
<li><a href="https://www.maine.gov/sos/maineatlas/explore-the-atlas/cobscook-bay" target="_blank" rel="noopener">Maine Atlas (Secretary of State): Cobscook Bay</a>: tides average 24 feet, up to 30.</li>
<li><a href="https://en.wikipedia.org/wiki/Cobscook_Bay" target="_blank" rel="noopener">Wikipedia: Cobscook Bay</a>: average range 18.4 feet.</li>
<li><a href="https://www1.maine.gov/DACF/mnap/focusarea/cobscook_bay_focus_area.pdf" target="_blank" rel="noopener">Maine Natural Areas Program: Cobscook Bay focus area (PDF)</a>: exceptionally productive waters; most nesting eagles in the Northeast.</li>
<li><a href="https://www.eaglehill.us/NENAonline/articles/NENA-sp-2/13-Larsen.shtml" target="_blank" rel="noopener">Larsen, 2004, Northeastern Naturalist</a>: most sea-creature diversity in eastern North America north of the tropics.</li>
<li><a href="https://eaglehill.us/NENAonline/articles/NENA-sp-2/14-Brooks.shtml" target="_blank" rel="noopener">Brooks, 2004, Northeastern Naturalist</a>: strong tidal currents keep the bay swapping water with the ocean all year.</li>
<li><a href="https://www.maine.gov/dmr/sites/maine.gov.dmr/files/docs/survey12.pdf" target="_blank" rel="noopener">Maine DMR: 2012 Cobscook Bay sea scallop survey (PDF)</a>.</li>
<li><a href="https://www.usclimatedata.com/climate/eastport/maine/united-states/usme0131" target="_blank" rel="noopener">US Climate Data: Eastport</a>: air temperatures.</li>
<li><a href="https://myperfectweather.com/api/cityinfo/23029Eas/degF/Average-Weather-in-Eastport-Maine-United-States-Year-Round" target="_blank" rel="noopener">My Perfect Weather: Eastport</a>: 66 inches of snow a year.</li>
<li><a href="https://www.weather.gov/gyx/water_temperature_normals.html" target="_blank" rel="noopener">National Weather Service: near-shore water temperatures</a>: Eastport 37–52°F.</li>
<li><a href="https://plantmaps.com/en/clim/f/us/maine/eastport/climate-data" target="_blank" rel="noopener">PlantMaps: Eastport</a>: frost dates and zone 6a.</li>
<li><a href="https://www.climates.com/USA/PDF/ME004USA.pdf" target="_blank" rel="noopener">Sunshine guide to the Eastport area (PDF)</a>.</li>
<li><a href="https://www.maine.gov/dmr/fisheries/sea-run-fisheries/sea-run-species/atlantic-salmon" target="_blank" rel="noopener">Maine DMR: Atlantic salmon</a>: eight rivers, illegal to fish.</li>
<li><a href="https://www.maine.gov/dmr/fisheries/shellfish/programs/biotoxins-in-maine" target="_blank" rel="noopener">Maine DMR: Biotoxins in Maine</a> and <a href="https://www.maine.gov/dhhs/mecdc/infectious-disease/epi/shm/PSP_FS_2016.pdf" target="_blank" rel="noopener">Maine CDC: PSP fact sheet (PDF)</a>: red tide testing; cooking doesn't make it safe.</li>
<li>Populations: 2020 US census. Solar: the same figures as the map (profileSOLAR, NASA POWER data for Perry).</li>
</ul>
`,
  },
  {
    id: "species-extinction",
    title: "Species extinction",
    names: ["Special extinction", "Extinction", "Overfishing", "Population decline"],
    html: `
<p>In a long grid-down, a lot of hungry people would hunt and fish the same places, with no game wardens and no limits. History shows what happens next: animals that seemed endless were wiped out within a few years. Checked 26 November 2026.</p>
<h3>Ponds and lakes get fished out</h3>
<ul>
<li><b>A pond only grows so much fish.</b> Virginia's wildlife agency says an unfertilized pond can give about 40 lb of bluegill and 10 lb of bass per acre each year without running it down. A fertilized pond gives about 160 lb of bluegill and 35–40 lb of bass.</li>
<li><b>That's very little food.</b> A rough sum: 50 lb of whole fish is about 17 lb of meat once the heads, bones and skin are off, or roughly 7,000 calories. That's about 3½ days of food for one adult, from a whole acre of pond for a whole year.</li>
<li><b>Bass are easy to catch.</b> In a new pond, Virginia's guide says to keep no bass for 2 years so they can grow and breed. A pond fished hard by hungry neighbors gets no break: once the breeding fish are taken, it can take years to come back.</li>
<li><b>Lakes are the same, just slower.</b> A lake is bigger, but it's still closed, so nothing new swims in. In Maine they also freeze over for months.</li>
<li><b>Deer, rabbits, ducks and grouse</b> near towns go the same way.</li>
</ul>
<h3>It has happened before</h3>
<ul>
<li><b>White-tailed deer</b> were nearly extinct in much of the eastern US about a century ago, mostly from hunting for meat and hides. Rhode Island set the first deer season back in 1646 to slow the decline. The last known deer in Georgia's mountains was killed in 1895.</li>
<li><b>Wild turkeys</b> were gone from Connecticut, Vermont, New York and Massachusetts by 1863. By the 1930s only about 30,000 were left in the whole country.</li>
<li><b>Passenger pigeons</b> were the most common bird in North America, numbering in the billions. Hunting for meat and the clearing of forests wiped them out. The last one, Martha, died at the Cincinnati Zoo on 1 September 1914.</li>
<li><b>Atlantic salmon</b> have fallen sharply since the late 1800s. Wild ones now return to only eight US rivers, all in Maine, and they're endangered.</li>
</ul>
<h3>Fun fact: 30 million buffalo in about 10 years</h3>
<p>It checks out. Hunters killed about 30 million American bison (buffalo) in a little over a decade, roughly 1871 to 1883, leaving only a few thousand. By 1889, only 541 were left.</p>
<ul>
<li>In western Kansas in 1872, about 2,000 hide hunters were each shooting about 15 bison a day: around 30,000 a day.</li>
<li>Most were killed for their hides. A new tanning method from Europe made the hides worth money, and they were shipped off to make leather for factory belts and boot soles. The meat was often left to rot.</li>
<li>Nobody knows exactly how many there were to start with. Estimates run from 30 million to 70 million.</li>
</ul>
<h3>How much would the population drop?</h3>
<table>
<tr><th>After the grid goes down</th><th>Expected drop</th></tr>
<tr><td>6 months</td><td>No published estimate</td></tr>
<tr><td>1 year</td><td>Up to 90% of Americans</td></tr>
<tr><td>2 years</td><td>No published estimate</td></tr>
<tr><td>5 years</td><td>No published estimate</td></tr>
<tr><td>10 years</td><td>No published estimate</td></tr>
</table>
<p>The one-year figure is the only one anyone has published. The other rows are left blank rather than guessed.</p>
<h3>About the 90% figure</h3>
<ul>
<li><b>Who said it:</b> William Graham, chairman of the congressional EMP Commission, and Peter Pry, its chief of staff, in testimony to Congress on 12 October 2017. They warned that a nuclear EMP attack could shut down the US grid for an indefinite period, leading to the "death within a year of up to 90 percent of all Americans."</li>
<li><b>What would cause it:</b> starvation, disease and the breakdown of order. Without power there's no pumped water, refrigeration, fuel or trucks to restock stores, and Pry has said supermarkets would empty in about 3 days.</li>
<li><b>It's disputed.</b> A 2019 review in the journal <i>Energy, Sustainability and Society</i> found no published model showing how the number was worked out, and couldn't trace it to a primary source.</li>
<li><b>Where it came from:</b> the Washington Examiner traced it to a 2008 hearing, where a congressman brought up the novel <i>One Second After</i>, in which 90% of people are dead after a year.</li>
<li><b>Rural areas would likely do better</b> than cities, with food, firewood and water close by, but nobody has put a number on that either.</li>
</ul>
<h3>Sources</h3>
<ul>
<li><a href="https://dwr.virginia.gov/fishing/private-pond-management/managing-fish-populations" target="_blank" rel="noopener">Virginia DWR: managing pond fish</a> and <a href="https://dwr.virginia.gov/?p=7174" target="_blank" rel="noopener">unfertilized ponds</a>: pounds of fish per acre; no bass kept for 2 years.</li>
<li>The calories sum is a rough estimate made for this page, not from a source. It assumes about a third of a small fish is meat, at about 95 calories per 100 g.</li>
<li><a href="https://www.yahoo.com/news/rise-fall-rise-again-white-124806849.html" target="_blank" rel="noopener">The rise and fall, and rise again, of white-tailed deer</a>: nearly extinct a century ago.</li>
<li><a href="https://www.themeateater.com/hunt/whitetail-deer/how-the-whitetail-nearly-went-extinct" target="_blank" rel="noopener">MeatEater: How the whitetail nearly went extinct</a>: Rhode Island's 1646 season.</li>
<li><a href="https://www.gameandfishmag.com/hunting/deer/how-we-saved-whitetails/" target="_blank" rel="noopener">Game &amp; Fish: How we saved whitetails</a>: Georgia, 1895.</li>
<li><a href="https://www.history.com/articles/turkeys-great-depression-extinction" target="_blank" rel="noopener">History.com: wild turkeys and the Great Depression</a>: turkeys; 541 bison in 1889.</li>
<li><a href="https://fws.gov/story/2014-08/many-few-none" target="_blank" rel="noopener">US Fish and Wildlife Service: From many, to few, to none</a> and <a href="https://johnjames.audubon.org/node/4236" target="_blank" rel="noopener">Audubon: Billions to none</a>: passenger pigeons.</li>
<li><a href="https://www.maine.gov/dmr/fisheries/sea-run-fisheries/sea-run-species/atlantic-salmon" target="_blank" rel="noopener">Maine DMR: Atlantic salmon</a> and <a href="https://www.fisheries.noaa.gov/species/atlantic-salmon-protected/spotlight" target="_blank" rel="noopener">NOAA Fisheries: protected Atlantic salmon</a>.</li>
<li><a href="https://www.ebsco.com/research-starters/history/great-american-buffalo-slaughter" target="_blank" rel="noopener">EBSCO: Great American Buffalo Slaughter</a> and <a href="https://www.ebsco.com/research-starters/social-sciences-and-humanities/bison-slaughter-impact" target="_blank" rel="noopener">Bison slaughter impact</a>: 30 million to a few thousand, about 1871–1883; the Kansas hunters.</li>
<li><a href="https://phys.org/news/2007-07-american-buffalo-slaughter-fueled-international.html" target="_blank" rel="noopener">Phys.org: American buffalo slaughter fueled by international trade</a>: 30 million in a decade; the European tanning method.</li>
<li><a href="https://www.thecollector.com/american-bison-hunted-near-extinction/" target="_blank" rel="noopener">TheCollector: why bison were hunted to near extinction</a>: hides for boot soles and belts.</li>
<li><a href="https://www.washingtonexaminer.com/?p=1562696" target="_blank" rel="noopener">Washington Examiner, 12 October 2017</a>: the Graham and Pry testimony.</li>
<li><a href="https://www.washingtonexaminer.com/?p=2419079" target="_blank" rel="noopener">Washington Examiner: the EMP commission</a>: where the 9-in-10 figure came from.</li>
<li><a href="https://news.yahoo.com/could-u-wiped-north-korean-092053984.html" target="_blank" rel="noopener">Yahoo News: Could U.S. be wiped out by North Korean EMP attack?</a>: supermarkets empty in about 3 days.</li>
<li><a href="https://energsustainsoc.biomedcentral.com/articles/10.1186/s13705-019-0199-y" target="_blank" rel="noopener">Energy, Sustainability and Society, 2019</a>: no published model behind the 90% figure.</li>
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
<p>The maker says it works on most cars, trucks, tractors and boats, and suggests testing your own car first. It keeps a list of cars it and its customers have tested (below), but gives no overall success rate.</p>
<ul>
<li>Most newer cars have a valve or screen in the filler neck that stops a hose. The kit's stiffer hoses are made to push past it, but not every car lets them through.</li>
<li>One buyer couldn't get any hose through the bends to the tank of a 2002 Toyota Tacoma, though it worked on their car.</li>
<li>A one-star review says it's useless on a lot of vehicles.</li>
</ul>
<p><b>Test it on your own car now</b>, while gas stations are open, so you know whether it works before you need it.</p>
<h3>Cars GasTapper has tested</h3>
<p>From GasTapper's <a href="https://www.gastapper.com/sample-vehicles.html" target="_blank" rel="noopener">tested vehicles list</a>, checked 25 November 2026. It only covers cars GasTapper or its customers tried, mostly 2011–2016 models, with nothing newer than 2017. "Hard" means it worked but took effort. Some models show up in both columns because different people got different results.</p>
<table>
<tr><th>Make</th><th>Worked</th><th>Didn't work</th></tr>
<tr><td>BMW</td><td>3 Series 2007; 535i 2013; 650i 2011–16; Roadster 2000; X5 2005</td><td>—</td></tr>
<tr><td>Buick</td><td>Enclave 2011–16; Encore 2011–16; LaCrosse 2008; Regal 2011–16</td><td>LaCrosse 2011–16; Park Avenue 1994; Verano 2011–16</td></tr>
<tr><td>Cadillac</td><td>ATS, CTS, DTS, Escalade, SRX (all 2011–16)</td><td>—</td></tr>
<tr><td>Chevrolet</td><td>2500 Diesel 2015; 3500 2011, 2012; 3500 Crew 4x4 2000; Camaro 1996; Camaro Z28 2001; Caprice 1996; Chevelle 1969–70; Corvette 2011–16; Corvette Z06 1993; Cruze 2011–16 (hard); Equinox 2011–16; Impala 2016; Lumina 1995; Malibu 2016; S-10 Tahoe 1989; Silverado V6 2011–16; Sonic 2014–15; Spark 2011–16; Tahoe 1997; Tracker 2000; Traverse 2011–16</td><td>Camaro 2011–16; Captiva 2011–16; HHR SS 2010; Impala 2011–15; Malibu 2011–15; Silverado V8 2011–16; Sonic 2012–13; Suburban 2011–16; Tahoe 2011–16</td></tr>
<tr><td>Chrysler</td><td>200 2011–16 (hard); 300 2011–16; 300C 2007, 2010; Town &amp; Country 2011–16 (hard)</td><td>—</td></tr>
<tr><td>Dodge</td><td>Challenger 2008–16; Charger 2011–16; Dart 2011–16 (hard); Durango 2004, 2011–16; Grand Caravan 2011–16 (hard); Journey 2015; Ram 1500 2014; Ram 2500 Diesel 2007</td><td>Journey 2011–16; Ram 2011–16; Ram 1500 2012</td></tr>
<tr><td>Fiat</td><td>500X 2011–16</td><td>—</td></tr>
<tr><td>Ford</td><td>C-Max 2011–16; Crown Vic 2001, 2003; E-Series 2011–16; E350 2010; Edge 2011–16; Escape 2011–16 (hard); Excursion 1999–2005 (hard); Expedition 2015; Explorer 2014–16; F-150 2007, 2011–16, and 2014 (needed a 10-foot hose); F-150 Crew 2009; F-250 4x4 1988; Fiesta, Flex, Focus, Fusion (all 2011–16); Mustang 1969, 1973, 1999, 2003, 2011–16; Sport Trac 2001; Taurus 2011–16; Thunderbird 1988</td><td>Crown Victoria 2011–16; Expedition 2012; Explorer 2011–13</td></tr>
<tr><td>GMC</td><td>Denali 2006; Jimmy 1984; Terrain 2011–16</td><td>Acadia 2011–16; Sierra 2011–16; Terrain Denali (from a note on the list)</td></tr>
<tr><td>Honda</td><td>Accord 2008, 2011–16; <b>Civic 2004, 2008, 2011–16</b>; Fit 2011–16; Fit Sport 2008; Odyssey 2005–08, 2011–16 (hard); Pilot 2015, 2011–16 (hard)</td><td>—</td></tr>
<tr><td>Hummer</td><td>H2 2003</td><td>—</td></tr>
<tr><td>Hyundai</td><td>Accent 2011–16; Elantra 2005, 2011–16; Limited 2011–16; Santa Fe 2011–16; Sonata 2007, 2011–16</td><td>—</td></tr>
<tr><td>Infiniti</td><td>G35 2011–16; G35 S 2007</td><td>M45 2006</td></tr>
<tr><td>Jeep</td><td>Cherokee 2011–13; Cherokee Sport 1999; Compass 2011–16 (hard); Grand Cherokee 1997, 2005, 2011–16; Liberty 2006; Liberty Sport 2004; Patriot 2011–16 (hard); Wrangler 2011–16</td><td>Cherokee 2014–16</td></tr>
<tr><td>Kia</td><td>Forte 2011–16 (hard); Optima Hybrid 2011–16 (hard); Rio 2011–16; Sorento 2011–16; Soul 2011–16 (hard); Sportage 2011–16, 2017</td><td>—</td></tr>
<tr><td>Lexus</td><td>GX470 2006; ix470 1999 (as listed); RX330 2004; SC400 1995</td><td>—</td></tr>
<tr><td>Lincoln</td><td>MK VII 1990; MKX 2011–16; Navigator 2006, 2011–16</td><td>—</td></tr>
<tr><td>Maserati</td><td>Spyder 1989</td><td>—</td></tr>
<tr><td>Mazda</td><td>2, 3, 6 and CX-3 (all 2011–16); 5 2011; CX-5 2011–16 (hard)</td><td>MX-5 2011–16</td></tr>
<tr><td>Mercedes</td><td>280c 1998; CLK430 2002; GL350 2016; GL450 2010; ML350 2015; S500 2001; S65 AMG 2006; Sprinter 3500 2006</td><td>—</td></tr>
<tr><td>Mitsubishi</td><td>Lancer 2011–16; Outlander 2011–16</td><td>Mirage 2011–16</td></tr>
<tr><td>Nissan</td><td>Altima, Armada (hard), Cube (hard), Frontier, Leaf, Maxima, Pathfinder, Rogue, Sentra, Titan, Versa, Xterra (all 2011–16)</td><td>Juke 2011–16; Murano 2011–16</td></tr>
<tr><td>Plymouth</td><td>Cuda 1971</td><td>—</td></tr>
<tr><td>Pontiac</td><td>Catalina 1962; Solstice 2008</td><td>—</td></tr>
<tr><td>Porsche</td><td>911 1999; Cayenne 2004</td><td>—</td></tr>
<tr><td>Shelby</td><td>Series 1 1999</td><td>—</td></tr>
<tr><td>Smart</td><td>ForTwo Coupe 2011–16</td><td>—</td></tr>
<tr><td>Subaru</td><td>Forester, Impreza, Outback (all 2011–16); Legacy 2005</td><td>—</td></tr>
<tr><td>Suzuki</td><td>Kizashi 2012; Samurai 1986–91</td><td>—</td></tr>
<tr><td>Toyota</td><td>4Runner 2006; Avalon 2001 (needed a longer hose); Camry 2008, 2011–13 (hard); Corolla 2004, 2011–16; Land Cruiser 2011–16 (hard); Prius 2007, 2015; Sienna 2011–16; Tacoma 2009; Tacoma 4x4 TRD 2013; Tundra 2005; Venza 2011–16; Yaris 2011–16</td><td>Camry 2014–16; Land Cruiser 2000; Prius 2011–16; Tacoma 2005</td></tr>
<tr><td>Volkswagen</td><td>Beetle, Jetta, Passat, Tiguan (all 2011–16); Jetta TDI 2004</td><td>Phaeton 2006; TDI Cup 2010</td></tr>
<tr><td>Volvo</td><td>S40 2005; S80 2011–16; XC90 2006</td><td>—</td></tr>
</table>
<p>About 190 cars worked and about 30 didn't. The site blocks automated reading, so this was put together from search results, and a few rows may be missing. Check the link above for the full list.</p>
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
