# Netting findings for Cobscook Bay

Saved Nov 28, 2026, from the netting research chat, to pick up later. Nothing in this folder is used by the site.

The scenario throughout: the grid is down and regulations don't apply. One or two people, no motor boat, Cobscook Bay. Confidence scores are out of 5. "My arithmetic" marks numbers worked out here rather than taken from a source. Sources are listed at the end.

## Where things stand

- **The best use of a fyke** is across a stream while fish are running up it, mainly the May–June alewife run. Fykes on open flats catch only a handful of small fish a tide.
- **How much a winged fyke catches:** across a whole run, about **12% of the fish passing through the part of the stream its mouth and wings block** (6.5% cautious, 22% hopeful). So a net blocking half the stream takes about 6% of the run (3–11%).
- **What to buy, for now:** two nets, each at least as tall as the water at high tide (about 4 ft), with mouth and wings reaching about 25–30 ft across. Either net alone reaches the protein-safe limit in the cautious case on the Dennys or the Pennamaquan, even at the old 58,000 Dennys count. This assumes a 50 ft wide stream, which is a guess until spots are picked.
- **The protein limit:** spawning alewives are lean, so they can safely be only about 36% of your calories (51% at most). The other 64% has to come from fat and starch.
- **Confidence:** 3 for the alewife estimate on either stream. The weakest link is the 12%: nobody has measured a winged fyke against a counted alewife run.

## Open items

1. **Pick spots.** Measure stream width and water depth where nets would sit. Look for 3–5 ft at high tide, with water still in the channel at low tide. The map now has a NOAA depth layer (`data/depth.json`, added in another chat) that may help.
2. **Price nets** of the chosen size. Budget: $1,000–2,000 at most, ideally under $1,000.
3. **Ask Maine DMR's sea-run fisheries staff** whether anyone has compared a trap or fyke catch with a counted alewife run. That's the best way to tighten the 12% without traveling.
4. **Confirm the Dennys count.** A June 2026 newspaper reported one million alewives counted in 2025. The Fishing tab still uses 58,000 (the 2008 count). Brett hasn't decided whether to update it.
5. **Corrections waiting for review:** the "Nets and traps" README page says herring gill nets should be 2¼ in and has rows for adult herring. The Netting tab's herring line (`NET_GEAR` in `data/fishing-notes.js`) says the same. Cobscook's herring are young fish, 4½–8 in. By the 5-times rule below, that suits roughly 1–1½ in stretched mesh (my arithmetic).
6. **The Netting tab's species sections are empty on purpose.** Draft any findings for review before adding them.
7. **Other seasons need run data:** fall silver eels (fatty, so they help with the fat gap) and winter tomcod.
8. **Not covered here:** salting and preserving (another chat).

## 1. Early herring work: passive gear

- **Gill net mesh rule:** herring are caught best at about 5 times the stretched mesh. DFO 2016 figures: a 2 in mesh suits 25.2 cm fish, 2¼ in 28.3 cm, 2½ in 31.5 cm and 2¾ in 34.6 cm (Olsen found about 5.2 times).
- **Cobscook's herring** are young fish: ages 1–3, about 4½–8 in. They don't spawn inside the bays, and they stay in the upper water at night.
- **Calories:** a small herring is about 27 calories.
- **How weirs work:** a leader turns fish into a heart-shaped pound, where they circle in a figure eight. Weirs work best on dark nights and in strong current.
- **Other gear looked at:** intertidal V weirs (Minas Basin, Bramber), the Dutch kom-fyke (NIOZ), and trap nets with closed tops. Cast nets were ruled out because they aren't passive.
- **Cheapest passive test for herring:** a stake-and-brush weir wall leading to a fyke bag, about $150–500 (⅜ in square mesh in the bag, heavy twine against seals). A netted, anchored wall is easier to hide and move, about $500–1,300.
- **Brett's idea for stakes:** build them from 1 ft rods that join together, and take sections off so the stakes stand no higher than the lowest tide.
- **Herring catch per 150 ft wall** (from NIOZ kom-fyke herring counts, scaled): about 39 a day in autumn, 12 a day at the median, 6–10 a day in recent years. That's about 9, 28 or 33–55 walls for 330 herring a day. Confidence 2. Scaling from weir catch by area gave 1–26 kg a day per wall, confidence 1.
- **Tending:** one person can tend about 6–8 walls.
- **The Cobscook survey's fykes caught 1 herring in 25 sets in 2012** (section 2). Fykes on the flats aren't herring gear.

## 2. Fyke records in and near Cobscook

### Gulf of Maine smelt fyke survey, 2008–2011

Maine, New Hampshire and Massachusetts set small fyke nets in smelt spawning streams. One Maine station, East Bay Brook, runs into Cobscook's East Bay.

- **The net:** a 4 × 4 ft square frame at the mouth, then six hoops 2.5 ft across. Funnels at the 2nd and 4th hoops. ¼ in mesh throughout. A 4 × 4 ft box wing on each side; optional soft wings 16 ft long and 4 ft high. Wing poles 2.5 m apart. The total length isn't given.
- **How it was set:** one net per stream, mid-channel in the tidal part, just below where smelt lay eggs, mouth facing downstream. It blocks about 75% of the channel. Maine's plan puts it "where the mean high tide line is approximately 4-5ft." Anchored with four 8 ft lengths of ½–⅝ in rebar.
- **When:** overnight, set at the evening low tide and hauled at the next morning low tide. Three nights a week for at least 8 weeks (Maine 2013 plan). Massachusetts sampled 11 weeks, early March to the third week of May. Downeast runs mostly start in mid-May and last 4–5 weeks.
- **Catch measure:** smelt per overnight haul, as the geometric mean of weekly averages (which runs lower than a plain average).

| Maine stream | 2008 | 2009 | 2010 | 2011 | All years |
|---|---|---|---|---|---|
| East Bay Brook (Cobscook) | 15.48 | 4.42 | 21.66 | 11.86 | 13.35 |
| Long Creek | – | 18.69 | 5.56 | 9.93 | 11.39 |
| Mast Landing | 52.00 | 29.84 | 8.81 | 13.80 | 26.11 |
| Deer Meadow Brook | 11.11 | 100.82 | 24.86 | 95.46 | 58.07 |
| Tannery Brook | 15.28 | 28.26 | 41.87 | 14.03 | 24.86 |
| Schoppee Brook | – | – | 38.42 | 37.25 | 37.83 |

- **Other states, all years:** Massachusetts ranged from 20.42 (Fore River) to 1.01 (Westport River). New Hampshire: Oyster River 5.62, Winnicut River 1.64.
- **New Hampshire 2021, same net:** March 17 to April 15, 15 trips per river. Squamscott 989 smelt (8.27 a day), Winnicut 260 (2.54), Oyster 140 (4.68).
- **East Bay smelt:** mostly 2-year-olds. 2-year-old males averaged 166 mm.
- **Food from one East Bay net:** about 13 smelt a night at about 24 calories each, so about 320 calories a night (my arithmetic). Smelt are lean, so they count against the same protein limit as alewives.

### Cobscook Bay finfish survey, 2011–2013 (Vieser's thesis)

University of Maine (Jeffrey Vieser, Gayle Zydlewski, James McCleave), with local fishermen. It was Vieser's 2014 master's thesis, published in Northeastern Naturalist in 2018. The thesis itself isn't online yet; the library contact is um.library.spc@maine.edu.

- **The nets:** 1.2 m (4 ft) high, with one 9.1 m (30 ft) wing and one 18.3 m (60 ft) wing. 2.5 cm (1 in) mesh throughout. The cod end has 3 sections, each behind a funnel with a 30.5 cm opening.
- **How they were set:** two nets at a time, by hand at low tide, on intertidal flats at the northern site in each of the bay's three parts (not the Pennamaquan). Cod end parallel to the shore, wings angled away in a Y. Fished mid-flood to mid-ebb. In 2012 the median set was about 3 hours (1 h 45 min to 4 h 45 min).
- **Effort:** 72 fyke sets over the survey.

2012 fyke catch by month (25 sets of two nets; Carrying Place Cove 9 sets, East Sipp Cove/Bay 7, Dennys Youngs Cove 9):

| Species | May | June | Aug | Sep | Total |
|---|---|---|---|---|---|
| Sets | 3 | 7 | 8 | 7 | 25 |
| Atlantic tomcod | 2 | 11 | 25 | 22 | 60 |
| Rainbow smelt | 0 | 0 | 9 | 11 | 20 |
| Winter flounder | 0 | 2 | 5 | 0 | 7 |
| Pollock | 0 | 0 | 0 | 5 | 5 |
| Alewife | 0 | 1 | 0 | 0 | 1 |
| Atlantic herring | 0 | 0 | 0 | 1 | 1 |
| All fish | 2 | 14 | 39 | 39 | 94 |

- That's about 3.8 fish per set of two nets (my arithmetic). The report called it "only six species represented by few individuals."
- **A harbor seal** got into a fyke on June 28, 2012, and drowned. Bars to keep seals out were added before the August and September sets.
- **The whole survey:** 60,476 fish of 46 species, from 390 seine hauls, 112 bottom trawls, 111 midwater trawls and 72 fyke sets. The trawls and seines caught 18,086 Atlantic herring.
- A 2014 talk said the netting missed large fish and fish in fast currents (up to 1.8 m/s).

### Fore River fyke comparison, Massachusetts (NOAA, 2021)

- The smelt survey's small fyke (1.2 × 1.2 m frames for the center panel and two wings) sat in a 13.7 m channel. A bigger net behind it spanned the channel and was built to "cover the entire water column at all tide stages," catching what got past.
- **Over 2009–2012:** 1,623 smelt in the small net and 47,736 in the big one. So the small net took **3.3%** of the fish passing (my arithmetic). It blocked at most about a quarter of the channel.
- Week to week, the small net caught 0.006–0.192 times what the big net did. Sizes and sex ratios were mostly the same. The authors say fyke nets may be poor for very small runs or wide rivers.

## 3. Fykes on open flats: the 680-net estimate, and why it failed

The first estimate used the Cobscook 2012 flats catches for May–June (16 fish in 10 sets), 78 g per fish, and one 3-hour window per day. It came out at about **680 nets** for two people in May (worst month) and 290 on the season average. Confidence 1.

- **About 20 times of that** came from cautious choices stacked on purpose: worst month, one short window a day, the smallest fish weight, men's calorie needs, and short wings. Flipping all of them gives about 20–35 nets.
- **The rest is real.** The flats hold only small, lean bottom fish (tomcod, flounder, smelt). The survey's sites were picked for vehicle access, the wings were short, the sets were short, and the survey was built to count fish, not harvest them.
- **Lesson:** a fyke only pays where fish are forced through a narrow place.

## 4. The method

Nets needed = food two people need per day ÷ food one net brings in per day.

1. Pick the season.
2. Shortlist the fish: which are in Cobscook that season, how much, and where they travel.
3. Find the best catch record for each: same bay and gear first, then nearby water, then the same gear elsewhere. Harvest records beat science sampling, and many years beat one.
4. Cross-check from the top down (run size × share one trap takes).
5. Turn fish into calories, and check the protein limit.
6. Count the traps for worst and typical cases.
7. Reality checks: tending, seals, floods, people. The overall score is the weakest step's.

## 5. Alewife runs in Cobscook

- **Timing:** adults enter rivers from early May to early June. Pembroke's town harvest runs from the first week of May to June 5, extendable to June 15. On the Margaree, 80% of the catch came within 11 to 15 days.
- **Size:** spawning alewives average 279–305 mm and about 230 g (Maine DMR). Blueback herring run with them and are counted together.

| Stream | Count |
|---|---|
| Pennamaquan (Pembroke) | 71,680 in 2014 (when fish passage was poor); nearly 400,000 in 2018; almost 500,000 in 2023; nearly 500,000 in 2024. A Passamaquoddy biologist said in 2025 that "the trend is down." |
| Dennys | 58,000+ in 2008. One million counted in 2025, after fishway work at Meddybemps (newspaper report, June 2026). |
| Little River (Perry) | A 2018 commercial harvest site; no count |
| Boyden Stream (Perry) | Has a run; no count |
| Orange River (Whiting) | No access to the upper spawning grounds; few fish below the dam |

- **Bad years:** over 2015–2025, the worst year on Maine's counted runs was 0.47 (Kennebec at Lockwood), 0.61 (Benton Falls) and 0.87 (Union River) of a typical year. On Nova Scotia's Gaspereau River since 1997, the worst year (358,190 in 2001) was 0.51 of typical. So plan for a bad year at about half the run. Small runs can fall further.
- **Being seen:** the Pennamaquan has a town harvest, a counting camera and a festival. DMR has run a weir on the Dennys since 1999. The Dennys also has endangered wild salmon, which must be let go.

## 6. How much a winged fyke catches

The share one net takes = **12% × the part of the stream it blocks × the part of the depth it fills**.

- **Fore River:** the fyke took 3.3% of passing smelt while blocking at most 26% of the channel. That's at least 12.5% of the fish in the part it blocked. It's higher if its wings were angled (about 15.5%) or the water was deeper than the 1.2 m net (up to about 25–31%).
- **Margaree River, Nova Scotia (alewife tip traps):** each trap filters half the river, with trap and leader no longer than 15 m, set at least 55 m apart. All the traps together took more than 75% of the run in 1991–1994 (depletion estimates 0.73–0.96; cohort estimates 0.70–0.80). With 27–44 traps working in a row, each took 3.3–7.9% of the fish passing it (my arithmetic), so 6.6–16% of the fish in its half. This assumes one trap per licence, which the reports don't confirm.
- **Season catch per Margaree trap:** about 19,000 alewives in the worst year (1996) to about 200,000 in the best (1988) (landings ÷ active licences ÷ fish weight; my arithmetic).
- **A ceiling:** Maine's fishway harvests block the whole passage. For uncounted runs, DMR assumes about 42.8% escapes, so gear that blocks everything takes up to about 57%.
- **Big-river traps:** Saint John River trap nets caught about 25–45 kg an hour per trap (1988–1992), roughly 100–200 alewives an hour.
- **Small runs:** on the Margaree, alewives swam near the banks when runs were small, so bank traps took a bigger share of small runs. A bank-set net probably does better in bad years than run size alone suggests.
- **Chosen values:** cautious 6.5%, typical 12%, hopeful 22%. The two records overlap at about 12–15%.
- **Wing length:** the evidence mostly says longer wings catch more fish on the move, but not in every study. Doubling a small fyke's lead from 4.57 m to 9.14 m tripled its catch in one study. A cod-trap study found no difference between 100 and 200 m leaders. In a lake eel study, shorter leaders caught twice as many.
- **Night to night** the catch swings a lot, but season totals are steadier.
- **A small fyke's bag** holds maybe a few hundred alewives before they crowd and die (a rough guess). On a big run, empty it often, or leave the bag open and close it only when you want fish.

## 7. Food from alewives

- **Weight:** about 230 g (Maine DMR). In a 2019 Maine stream study, males weighed 201–203 g early in the run and about 168 g by June 10. Females went from about 242 g to about 192 g.
- **Fat:** 3.32% on average in that study, with about 78.9% water. That gives about 16.5% protein and about 96 calories per 100 g of meat (my arithmetic).
- **Meat share:** no figure exists for alewives. For Atlantic herring, skinless fillets are 46% of the fish and all the edible flesh is 61%. The Fishing tab uses 40%.
- **Calories per fish:** 69 (180 g, 40% meat), 101 (230 g, 46%) or 159 (250 g, 61%).
- **Protein limit:** a review of protein intake suggests a maximum of about 25% of calories and calls over 35% dangerous ("rabbit starvation"). About 69% of an alewife's calories are protein. So alewives can be at most about **36%** of the diet (or 51% at the 35% line), and less if the rest of the diet has protein.
- **Calories needed:** about 3,100 a day for a 180 lb, 5 ft 10 in, 30-year-old man doing hard work (Mifflin-St Jeor × 1.725), or about 17 per lb. Two people need 6,200 a day, or 378,000 for the 61 days of May–June. Reaching the 36% limit for May–June takes about 1,350–1,970 alewives.

## 8. Results for 1–4 nets

These assume a 50 ft wide, 4 ft deep spot, with each net reaching 30 ft and standing 4 ft tall. Nets are set apart along the stream. Calories are the season's catch spread over 61 days. The safe-to-eat share stops at 36% in every row.

| Stream | Nets | Cautious: fish a season, calories a day | Typical: fish a season, calories a day |
|---|---|---|---|
| Dennys, 1,000,000 (2025) | 1 | 39,000; 44,100 (712% of need) | 72,000; 119,200 (1,923%) |
| | 2 | 76,500; 86,500 (1,395%) | 138,800; 229,800 (3,707%) |
| Pennamaquan, 500,000 | 1 | 19,500; 22,100 (356%) | 36,000; 59,600 (961%) |
| | 2 | 38,200; 43,300 (698%) | 69,400; 114,900 (1,854%) |
| Dennys, old 58,000 (2008) | 1 | 2,260; 2,560 (41%) | 4,180; 6,910 (112%) |
| | 2 | 4,440; 5,020 (81%) | 8,050; 13,330 (215%) |
| | 3 | 6,530; 7,380 (119%) | 11,650; 19,290 (311%) |
| | 4 | 8,530; 9,650 (156%) | 14,990; 24,810 (400%) |

Every row clears the safe limit (2,232 calories a day for two). Even with every input at its low end, plus a bad year at half the old Dennys count, two nets clear it by about 1.1 times.

## 9. Other seasons

| Season | Run through streams | Fyke fit | Data |
|---|---|---|---|
| Jan–Feb | Tomcod spawn in shallow brackish or fresh water, November–February, peaking in January | Good, but ice threatens nets | No counts; DMR says little is known about current numbers |
| Mar–Apr | Smelt runs, and elvers (fyke nets are a standard elver gear) | Good | Smelt: about 13 a night at East Bay Brook |
| May–Jun | Alewives | Good | Counted runs (above) |
| Jul–Aug | None | Poor: flats only, about 5 small fish per set | n/a |
| Sep–Oct | Silver eels head to sea on rainy, moonless autumn nights (August–November). Maine's silver-eel fishery used weirs across streams until it closed in 2014. | Good, and the catch is fatty | No Cobscook count |
| Nov–Dec | Tomcod move into tidal stream mouths in October and November | Good | No counts |

**Why scaling by bay population doesn't work:** the Fishing tab has about 33 times more herring in the bay in September–October than alewives in May–June. But the 2012 fykes caught 1 herring in September, because herring spread through open water instead of squeezing past a net. Scaling only works for the same fish, in the same kind of spot, with different numbers.

## 10. Depth

**For fykes**, the best water depth is about the net's height at high tide: about 3–5 ft for a 3–4 ft net.

- Too deep, and fish swim over the net. Fykes are "typically used in shallow water (where the first hoop is less than 1 m under the water's surface)," and are less effective for open-water fish in deep water.
- Too shallow, and the funnels must be at least partly under water for fish to get in. A net standing out of the water is also easy to see.
- At a tidal stream mouth, keep the bag in the part of the channel that stays wet at low tide.

**Shellfish and other things collected by hand** are mostly gathered on uncovered ground at low tide, not in 6 ft of water. About a third of Cobscook is exposed at low tide, and almost 60% of the intertidal zone is mudflat.

| What | Where | Most plentiful |
|---|---|---|
| Periwinkles, green crabs | Rocks and weed between the tides | All along rocky shores |
| Soft-shell clams | Mudflats, middle to low shore | Lubec (nearly 450,000 lb in 2024, some outside Cobscook), Pembroke and Perry (about 180,000 lb a year), Whiting (about 25,000–50,000). Cobscook's clam production was historically poor to fair, and clams grow slowly there. |
| Blue mussels | Beds just above and below mean low water | No Cobscook map; statewide, shore beds may be moving below the low-tide line |
| Whelks | Low shore and below | Never surveyed |
| Green sea urchins | Rock and gravel just below low tide; a few at the lowest tides | About 9.5 per sq m above 15 m, against 0.32 at 15–40 m (statewide survey) |
| Sea scallops | Below low tide | An estimated 80–90% of Maine's scallop landings come from Cobscook: South Bay, Johnson Bay, Eastport, Whiting and Dennys Bays. Legal density was 0.36 per sq m in fall 2024. |
| Sea cucumbers | Deep, fast channels, 20–100 m | Needs a boat drag |

Go on the lowest tides, around the new and full moons. Cobscook's mean tide is 5.7 m at Eastport, and spring low tides can be 3–4 ft below average. Many normally underwater species turn up between the tides here.

**Fish by depth:** the stream runs (alewives, smelt, tomcod) are in a few feet of water. Herring and mackerel are in the upper water of open areas. Flounder, the cod family, sculpin and lobster are on the bottom, mostly deeper. Cobscook averages about 10 m deep, and the deepest point is 45 m.

## 11. The calculator

`fyke-calculator.html` in this folder is a copy of the calculator. The live version is at https://claude.ai/artifact/4WEzbwYvAboqQmTCV4NnP7.

- **Inputs:** people and weight; stream and run size (or your own); typical, bad or very bad year; stream width and depth; net reach and height; 1–4 nets; cautious, typical or hopeful estimate.
- **Outputs:** calories caught and safe to eat per day, fish per season and at the peak, how much smaller the run could be before falling short, and the smallest net that reaches the safe limit.
- **Warnings:** a net taller than the water, a net shorter than the water, blocking more than 75% of the stream, and a bag too full.

## Sources

Fyke records
- Fore River fyke net comparison (NOAA, 2021): https://repository.library.noaa.gov/view/noaa/57102
- Regional smelt conservation plan, Enterline and others, 2012 (East Bay Brook catches in Table 1.3.3): https://repository.library.noaa.gov/view/noaa/37958
- Maine smelt fyke net sampling plan, 2013: https://www.maine.gov/dmr/sites/maine.gov.dmr/files/docs/fykeplan.pdf
- New Hampshire smelt spawning report, 2021: https://www.wildlife.nh.gov/sites/g/files/ehbemt746/files/inline-images/rbw-smelt-spawning-monitoring.pdf
- Vieser and others, Northeastern Naturalist, 2018: https://eaglehill.us/NENAonline/articles/NENA-25-4/12-Zydlewski.shtml (doi 10.1656/045.025.0403)
- Vieser thesis record, 2014: https://tethys.pnnl.gov/publications/collaborative-research-finfish-their-distribution-diversity-cobscook-bay
- Project report, March 2013 (2012 fyke catches, Table 9): https://repository.library.noaa.gov/view/noaa/36331/noaa_36331_DS1.pdf
- American Fisheries Society talks, 2014 and 2012: https://afs.confex.com/afs/2014/webprogram/Paper16137.html, https://afs.confex.com/afs/2012/webprogram/Paper10763.html

Alewife traps and runs
- Margaree River gaspereau fishery (DFO): https://waves-vagues.dfo-mpo.gc.ca/library-bibliotheque/228877.pdf, https://waves-vagues.dfo-mpo.gc.ca/library-bibliotheque/267281.pdf, https://waves-vagues.dfo-mpo.gc.ca/library-bibliotheque/148139.pdf
- Scotia-Fundy alewife catch and effort (DFO): https://waves-vagues.dfo-mpo.gc.ca/library-bibliotheque/147544.pdf
- Gaspereau River runs by year (DFO, 2021): https://www.dfo-mpo.gc.ca/fisheries-peches/ifmp-gmp/gaspereau-gaspareau/index-eng.html
- Maine river herring plan, 2024: https://asmfc.org/wp-content/uploads/2025/01/ME_RiverHerringSFMP_2024.pdf
- Maine DMR river herring: https://www.maine.gov/dmr/fisheries/commercial/fisheries-by-species/river-herring
- Maine run counts by year, 2015–2025 (DMR): https://www.maine.gov/dmr/sites/maine.gov.dmr/files/inline-files/Trap%20Counts%20for%20Web%20Page%202025.pdf
- Pennamaquan: https://www.quoddytides.com/harvesting-of-alewives-returns-to-pennamaquan-after-15-years/, https://www.quoddytides.com/passamaquoddy-celebrate-success-in-restoring-alewife-populations/
- Dennys, 2025: https://www.quoddytides.com/whiting-mill-pond-dam-project-to-boost-more-than-alewife-numbers/
- Dennys, 2008: https://archive.bdnblogs.com/?p=193909
- Meddybemps dam removal, 2023: https://www.nhpr.org/2023-05-30/migratory-fish-flood-into-maine-rivers-after-several-years-of-restoration-efforts
- Low runs in 2025: https://www.bangordailynews.com/2025/07/11/midcoast/midcoast-environment/low-numbers-of-alewives-damariscotta-mills-bristol-mills-maine

Food and need
- Alewife weight (Maine DMR): https://www.maine.gov/dmr/science-research/searun/alewife.html
- Alewife fat and size during the run (UMaine, 2020): https://core.ac.uk/download/346214478.pdf
- Fish yields and composition (FAO): https://www.fao.org/4/T0219E/T0219E01.htm
- Protein limits (Bilsborough and Mann, 2006): https://pubmed.ncbi.nlm.nih.gov/16779921/
- Tomcod weight, Minas Basin: https://ojs.library.dal.ca/nsis/article/view/nsis53-2carroll_et_al

Gear
- Fyke lead length (Oklahoma Academy of Science): https://ojs.library.okstate.edu/osu/index.php/OAS/article/download/7198/6631
- Cod pontoon trap leaders (Frontiers, 2022): https://frontiersin.org/articles/10.3389/fmars.2022.981822/full
- Eel fyke leaders (FAO): https://www.fao.org/4/AA043B/AA043B06.htm
- Fyke depth: https://fisheries.org/doi/9781888569926-ch20, https://www.doc.govt.nz:443/globalassets/documents/science-and-technical/inventory-monitoring/im-toolbox-freshwater-fish/im-toolbox-freshwater-fish-passive-nets-fyke-nets.pdf, https://environment.qld.gov.au/__data/assets/pdf_file/0021/90741/biological-assessment-sampling-fish-communities-using-fyke-nets.pdf, https://www.dnr.state.mi.us/PUBLICATIONS/pdfs/IFR/manual/SurvyMan%20MSWord%20Docs/C3_1-10.DOC

Other seasons
- Tomcod (Maine DMR): https://www.maine.gov/dmr/fisheries/sea-run-fisheries/sea-run-species/tomcod
- American eel (Maine DMR): https://www.maine.gov/dmr/fisheries/sea-run-fisheries/sea-run-species/american-eel
- Maine eel and elver fisheries: https://www.maine.gov/dmr/fisheries/commercial/fisheries-by-species/eels-and-elvers/the-maine-eel-and-elver-fisheries
- Eel (Maine Sea Grant): https://seagrant.umaine.edu/maine-seafood-guide/eel/

Shellfish and the bay
- About the bay (Cobscook Bay Resource Center): https://cobscook.org/aboutthebay
- Larsen, Cobscook Bay overview (2004): https://eaglehill.us/NENAonline/articles/NENA-sp-2/12-Larsen.shtml
- Kelley and Kelley, bottom materials (2004): https://doi.org/10.1656/1092-6194(2004)11[51:COSMDI]2.0.CO;2
- Campbell, ecosystem (2004): https://www.eaglehill.us/NENAonline/articles/NENA-sp-2/27-Campbell.shtml
- Blue mussels (Maine DMR): https://www.maine.gov/dmr/science-research/species/bluemussel.html
- Urchin density by depth (Grabowski and others, 2005): https://www.thefreelibrary.com/Estimating+exploitable+stock+biomass+for+the+Maine+green+sea+urchin+...-a0133050282
- Scallops (Maine DMR): https://www1.maine.gov/dmr/sites/maine.gov.dmr/files/docs/scallop2010summary.pdf, https://www.maine.gov/dmr/sites/maine.gov.dmr/files/docs/surveyfall14.pdf, https://www1.maine.gov/dmr/sites/maine.gov.dmr/files/regulations-2025-01/Chapter%2011.08%20Emergency%20Rulemaking%20Targeted%20Closure%201.19.2025.pdf
- Clam landings by town (Maine DMR, 2025 report): https://www.maine.gov/dmr/sites/maine.gov.dmr/files/2026-03/Soft%20Clam%20Landings%20Report.pdf
- Lubec clams, 2024: https://www.yahoo.com/news/articles/lubec-gearing-try-clam-seeding-105600839.html
- Tides at Lubec Narrows (NOAA Coast Pilot 1): https://nauticalcharts.noaa.gov/publications/coast-pilot/files/cp1/CPB1_C04_WEB.pdf
