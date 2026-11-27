"""Cobscook Bay: how much food is in the bay in each two-month season. Builds ../data/fishing.js.

Run from long-term/:  python3 tools/fishing_model.py

Every number is the whole amount in the bay in that season, before anyone fishes: no cutoffs,
no fishing method and no harvest limit yet. For species that stay all year, each season assumes
nothing was taken earlier, so their seasons must not be added together.

The method, the checks and every source are in Brett's "Cobscook fishing data: sources check" doc
(Nov 26-27, 2026). Species with no count in the bay are kept, with no numbers, rather than guessed.

Season pounds come two ways:
  from_avg   a year-round average, split by the species' seasonal pattern:
             season = average x that season's share / the average share
  from_peak  the best season's amount x each season's % of it
Calories = pounds x meat share x calories per pound of meat.
"""
import json, os

SEASONS = ["Jan–Feb", "Mar–Apr", "May–Jun", "Jul–Aug", "Sep–Oct", "Nov–Dec"]
SEASON_LONG = ["January–February", "March–April", "May–June", "July–August", "September–October", "November–December"]
DAYS = [59, 61, 61, 62, 61, 61]
ADULT_KCAL_DAY = 3000  # an active adult

# Bay food-web model (Chapman and others 2020): biomass in kg per sq km over 105 sq km.
MODEL_LB = 105 * 2.2046  # kg per sq km -> lb in the bay

# The bay net survey (Vieser and others 2018, Table 2): fish caught in May, June, August and September
# of 2011-13, the three years added together. Each row was checked against the table's own total.
SURVEY = dict(
    flounder=(3371, 2743, 1389, 799),    # winter flounder: 8,291 of its 8,302 came from the bottom trawl
    silverhake=(38, 282, 223, 49),
    whitehake=(0, 7, 162, 259),
    haddock=(0, 0, 248, 141),
    sculpin=(254, 222, 86, 16),
    smelt=(278, 186, 38, 65),
    silverside=(152, 102, 72, 2375),
    alewife=(5, 736, 1932, 674),
)

# Net survey yardstick: bay fish per survey fish, from the counted alewife run. Used only for smelt and
# silverside, which the survey caught mostly in the shore seine, as it did the alewives.
RUN = 500_000 + 58_000                   # Pennamaquan 2023 (~500,000) + Dennys 2024 (58,000+)
SURVEY_ALEWIFE_MAYJUN = (SURVEY["alewife"][0] + SURVEY["alewife"][1]) / 3   # alewives caught a year in May-June
F = RUN / SURVEY_ALEWIFE_MAYJUN          # about 2,259

# Bottom fish (flounder, hakes, haddock, sculpin): swept area from the survey's own bottom trawl.
# 112 bottom tows in 12 monthly trips, so about 28 tows for each month over the three years. Each tow
# ran about 20 minutes; its speed and net spread aren't published, so the Canadian trawl's path is
# used (1.41 km x 8 m). The bay below low tide (70 sq km) holds about 6,200 such tow paths.
SURVEY_TOWS_PER_MONTH = 112 / 4
TOW_PATHS_IN_BAY = 70 / (1.41 * 0.008)


def tow_seasons(name):
    """Fish per bottom tow in May-Jun, Jul-Aug and Sep-Oct. July is the average of June and August;
    October takes September's level."""
    may, jun, aug, sep = (n / SURVEY_TOWS_PER_MONTH for n in SURVEY[name])
    return (may + jun) / 2, ((jun + aug) / 2 + aug) / 2, sep


def swept(fish_per_tow, grams, catch_share=1.0):
    """Fish per tow -> pounds in the bay. grams: average weight of that fish in the Canadian trawl next
    door, all sizes (2013-19). catch_share: the share of fish in a trawl's path that it catches."""
    return fish_per_tow / catch_share * TOW_PATHS_IN_BAY * grams / 1000 * 2.2046


def surv(n3yrs):
    """Survey catch summed over 3 years for a season -> fish in the bay (alewife yardstick)."""
    return n3yrs / 3 * F


# Canadian Passamaquoddy trawl (DFO, 190 tows 2009-2019): kg per tow -> lb in Cobscook,
# assuming an 8 m net width, a 1.41 km tow, and 70 sq km below low tide. A minimum.
TRAWL_LB_PER_KG_TOW = 70 / (1.41 * 0.008) * 2.2046

# Canadian trawl lobster catch, kg per tow, 2013-19: 104 tows in July-August, 52 in September-October.
LOBSTER_KG_TOW_JULAUG = 41.98
LOBSTER_KG_TOW_SEPOCT = 75.53

# Maine-New Hampshire inshore trawl survey, lobster kg per tow (stratified means, regions 1-5), 2009-12.
MENH_LOBSTER_SPRING = (31.02 + 26.80 + 52.90 + 50.57) / 4
MENH_LOBSTER_FALL = (54.62 + 59.57 + 70.25 + 53.20) / 4

# Herring caught in Cobscook's "low pool", 1947-58 (NOAA SSRF 476, Tables 3 and 4).
HERRING_YEARS = [[1947, 49_000], [1948, 5_043_325], [1949, 1_342_600], [1950, 1_455_300],
                 [1951, 4_778_725], [1952, 2_940_000], [1953, 6_289_150], [1954, 6_368_775],
                 [1955, 2_136_400], [1956, 755_825], [1957, 2_026_150], [1958, 1_343_825]]
HERRING_MONTH_PCT = [0, 0, 0, 0, 0.1, 5.5, 6.7, 13.8, 30.1, 36.2, 6.9, 0.7]  # Jan..Dec
HERRING_SEASON = [HERRING_MONTH_PCT[i] + HERRING_MONTH_PCT[i + 1] for i in range(0, 12, 2)]
HERRING_AVG_LB = 900_000  # middle of three methods: model 1.6M, sonar 0.45M, 1950s catch x weirs 0.43-2.2M
SHELLFISH_AVG_LB = 1_600_000  # clams, mussels and other shellfish: the least the clam harvest needs (see below)
SCALLOP_MEAT_LB = 346_000 + 30_300  # DMR fall 2015 survey: Cobscook proper + Whiting and Dennys Bays

# Green sea urchins: DMR's spring dive survey (BEACON), Region 9 "Cobscook Bay-Passamaquoddy Bay".
# 52,045,499 sq m of rock and gravel 0-15 m deep in the region. 62-73% of the region's random dive
# sites (2001-25) fall inside Cobscook, so that's its share of the rocky bottom. DMR's official
# biomass (read off their chart, about 10%): 2024 about 210 g per sq m, 2025 about 160.
URCHIN_REGION_M2 = 52_045_499
URCHIN_COBSCOOK_SHARE = (0.62 + 0.73) / 2
URCHIN_G_PER_M2 = (210 + 160) / 2
URCHIN_LB = URCHIN_REGION_M2 * URCHIN_COBSCOOK_SHARE * URCHIN_G_PER_M2 / 1000 * 2.2046  # about 14.3 million


def from_avg(avg, idx):
    mean = sum(idx) / 6
    return [avg * i / mean for i in idx]


def from_peak(peak, idx):
    return [peak * i / 100 for i in idx]


def add(*lists):
    return [sum(v) for v in zip(*lists)]


NONE = [None] * 6
FL, SH, WH, HD, SC = (tow_seasons(n) for n in ("flounder", "silverhake", "whitehake", "haddock", "sculpin"))

# Urchin roe by season. Maine urchins before the fishery (Vadas and others 2015; nine sites, one at
# Lubec) carried 10-20% roe from December to April (15% used) and 8.3% from May through early fall, and
# roe rose 80% from November to February. That winter-to-summer ratio is applied around the 6% yearly
# middle used for today's Cobscook urchins: about 8.1% in December-April and 4.5% in May-November.
_R = 15 / 8.3
ROE_LOW = 0.06 * 12 / (5 * _R + 7)
ROE_HIGH = ROE_LOW * _R
URCHIN_ROE = [ROE_HIGH, ROE_HIGH, ROE_LOW, ROE_LOW, ROE_LOW, (ROE_HIGH + ROE_LOW) / 2]

# confidence: 5 counted in the bay every year (within 25%), 4 measured in the bay (within 2x),
# 3 bay data checked by a second method (2-3x), 2 one method or methods that disagree (3-10x),
# 1 more than 10x, or no number.
SP = [
    dict(id="herring", name="Atlantic herring", short="herring", group="fish", conf=3,
         lb=from_avg(HERRING_AVG_LB, HERRING_SEASON), meat=0.6, kcal=717,
         source="Middle of three separate methods; seasons from the bay's 1947–58 catches"),
    dict(id="mackerel", name="Atlantic mackerel", short="mackerel", group="fish", conf=2,
         lb=from_avg(1334 * MODEL_LB, [0, 0, 25, 100, 70, 5]), meat=0.5, kcal=930,
         source="Bay food-web model only; nothing else counts mackerel in the bay"),
    # One method: the food-web model's input, which cites a Cobscook rockweed study (Ugarte 2010) but
    # gives no working, and is a round figure (1 g dry weight per sq m). Typical shore densities would
    # give several times more. Maine landed 455,000 lb in 2021, over 90% in Washington County, but
    # there's no Cobscook share to check against. So a 2.
    dict(id="periwinkles", name="Periwinkles", short="periwinkles", group="shellfish", conf=2,
         lb=from_avg(6666 * MODEL_LB, [85, 90, 100, 100, 100, 90]), meat=0.16, kcal=395,
         source="Bay food-web model only: one rounded figure from a Cobscook rockweed study, with no second count"),
    # Yearly average: the least the clam harvest needs. Lubec, Perry, Pembroke and Whiting land about
    # 510,000 lb of legal clams a year (DMR, 2020-24); in the food-web model shellfish add 0.7 of their
    # weight a year and other animals eat 46% of that, so supplying both takes 510,000 / (0.7 x 0.54),
    # about 1.4-1.6 million lb. The model itself gives 3,766 kg per sq km (0.87 million lb) in one table
    # and 11,000 (2.5 million lb) in another; 1.6 million is within 2x of both.
    dict(id="shellfish", name="Clams, mussels and other shellfish", short="clams and mussels", group="shellfish", conf=3,
         lb=from_avg(SHELLFISH_AVG_LB, [80, 90, 100, 100, 100, 90]), meat=0.2, kcal=390,
         source="The least today's clam harvest needs (1.6 million lb a year on average); the food-web model gives 0.87–2.5 million"),
    # DMR's fall dredge survey: harvestable meat (shells over 4 in), not adjusted for scallops the
    # dredge misses. 2012: 517,700 lb. 2013: 452,200. 2014: 635,900. 2015: 376,300 (346,000 in the main
    # bay + 30,300 in Whiting and Dennys Bays), the last year DMR published a bay total. Later surveys
    # give densities only: legal scallops peaked in fall 2021 and were about half that in 2023 and 2024.
    dict(id="scallops", name="Sea scallops", short="scallops", group="shellfish", conf=3, weight="meat",
         lb=[SCALLOP_MEAT_LB] * 6, meat=1.0, kcal=313,
         source="State dredge survey, fall 2015: 376,300 lb of harvestable meat, the last bay total DMR published (2012–15 ran 376,000–636,000). Legal scallops have fallen since 2021"),
    dict(id="alewives", name="Alewives", short="alewives", group="fish", conf=4,
         lb=from_peak(RUN * 0.45, [0, 5, 100, 5, 0, 0]), meat=0.4, kcal=470,
         source="Run counts: Pennamaquan about 500,000 (2023), Dennys 58,000+ (2024)"),
    # Swept area from the bay survey's bottom trawl, all sizes, at the 60-90% of flounder in its path a
    # survey trawl catches (Miller and others 2023; 75% used). November-December weren't surveyed and
    # take September's level. January-April are 0: adult winter flounder were rare or absent in
    # Passamaquoddy Bay in winter and seldom present below 6 C (43 F) (MacDonald and others 1984);
    # Eastport's water averages 37-41 F in January-April (NWS). The Canadian trawl next door, sized to
    # Cobscook the same way, gives 1.5x as much in July-August and 7x in September-October.
    dict(id="flounder", name="Flounders", short="flounder", group="fish", conf=3,
         lb=[0, 0, swept(FL[0], 85, 0.75), swept(FL[1], 85, 0.75), swept(FL[2], 98, 0.75), swept(FL[2], 98, 0.75)],
         meat=0.35, kcal=318,
         source="The bay survey's own bottom trawl, by swept area; the Canadian trawl next door finds 1.5 times as much in July–August and 7 times in September–October. Adults leave when the water is under 43°F (Jan–Apr)"),
    # Swept area from the same bottom trawl, all sizes, with no allowance for fish the net misses
    # (trawls catch only 20-40% of red hake in their path), so a floor. Months not surveyed keep the
    # earlier fill-ins: a few percent in January-April, about a quarter of the fall level in
    # November-December for white hake. A 2: only a few fish a tow, and the Canadian trawl next door
    # catches about as many white hake and haddock but 30 times more silver hake.
    dict(id="codfamily", name="Cod family: hakes and haddock", short="cod family", group="fish", conf=2,
         lb=add([0, swept(0.02 * SH[1], 54), swept(SH[0], 54), swept(SH[1], 54), swept(SH[2], 82), swept(0.03 * SH[1], 82)],                       # silver hake
                [swept(0.03 * WH[2], 77), swept(0.03 * WH[2], 77), swept(WH[0], 77), swept(WH[1], 77), swept(WH[2], 102), swept(0.26 * WH[2], 102)],  # white hake
                [0, 0, swept(HD[0], 76), swept(HD[1], 76), swept(HD[2], 44), swept(0.11 * HD[1], 44)]),                                           # haddock
         meat=0.4, kcal=400,
         source="The bay survey's own bottom trawl, by swept area: a floor, since trawls miss most hake. Mostly young fish of 2–4 oz"),
    dict(id="greencrabs", name="Green crabs", short="green crabs", group="crabs", conf=2,
         lb=from_avg(1333 * MODEL_LB, [5, 15, 60, 100, 80, 30]), meat=0.12, kcal=340,
         source="Bay food-web model (from southern Maine data)"),
    # July-October from the Canadian trawl, 2013-19 (the years DFO says compare): every lobster caught,
    # all sizes, averaged over every tow. May-June: the Canadian fall number x Maine's own inshore trawl
    # survey spring/fall ratio (2009-12), which scales Maine's spring survey to local water. Maine's
    # fall survey, sized to Cobscook, is 0.5-0.75x the Canadian number: the check behind the 3.
    # (Corrected Nov 27, 2026: these kg a tow had been a third of the trawl's real catch.)
    dict(id="lobster", name="Lobster", short="lobster", group="crabs", conf=3,
         lb=[None, None, LOBSTER_KG_TOW_SEPOCT * TRAWL_LB_PER_KG_TOW * MENH_LOBSTER_SPRING / MENH_LOBSTER_FALL,
             LOBSTER_KG_TOW_JULAUG * TRAWL_LB_PER_KG_TOW, LOBSTER_KG_TOW_SEPOCT * TRAWL_LB_PER_KG_TOW, None], meat=0.2, kcal=349,
         source="Canadian trawl for July–October, checked by Maine's own trawl survey; May–June from Maine's spring survey scaled to local water. Minimums"),
    # Swept area from the bay survey's bottom trawl, all sizes (about 3 oz each next door). May-October
    # are from the catches; November-April were never surveyed and are filled in at a little above the
    # May-June level, since sculpin move inshore in cold water. The Canadian trawl next door catches
    # 5 to 30 times more a tow in July-October.
    dict(id="sculpin", name="Longhorn sculpin", short="sculpin", group="fish", conf=2,
         lb=[swept(SC[0] * 100 / 85, 83.5), swept(SC[0] * 93 / 85, 83.5), swept(SC[0], 77), swept(SC[1], 77),
             swept(SC[2], 90), swept(SC[0] * 93 / 85, 83.5)], meat=0.25, kcal=363,
         source="The bay survey's own bottom trawl, by swept area; winter is filled in, not surveyed. The Canadian trawl next door catches 5–30 times more a tow"),
    # Caught mostly by shore seine and bottom trawl, so scaled by the alewife yardstick. The survey's
    # May-June catch sets May-June (60 on the season scale); the peak is March-April (100).
    # (Corrected Nov 27, 2026: the May-June catch had been used as the peak, which made every season
    # 40% too low.) Every smelt counts, at 0.08 lb each (36 g; 30-37 g in the Canadian trawl).
    dict(id="smelt", name="Rainbow smelt", short="smelt", group="fish", conf=3,
         lb=from_peak(surv(SURVEY["smelt"][0] + SURVEY["smelt"][1]) / 0.60 * 0.08, [70, 100, 60, 19, 21, 50]), meat=0.7, kcal=440,
         source="Net survey, scaled up; the Canadian trawl next door agrees within 1.3 times in July–October. Smelt gather in estuaries in winter and run up streams in spring"),
    # September catch plus about half as much for October (1,200); 80% counted, at 0.012 lb each.
    dict(id="silverside", name="Atlantic silverside", short="silverside", group="fish", conf=2,
         lb=from_peak(surv(SURVEY["silverside"][3] + 1200) * 0.8 * 0.012, [0, 1, 7, 4, 100, 17]), meat=0.8, kcal=454,
         source="Net survey, scaled up"),
    # Urchins stay put, so every season gets the spring survey's pounds. Edible roe runs 3-12% of live
    # weight by season and site; 6% is the yearly middle, shaped by season (URCHIN_ROE above).
    # Range: 11-18 million lb, 190 million-1.1 billion calories. A 2, not a 3: one method, and the roe
    # share alone spans 4x.
    dict(id="urchins", name="Green sea urchins", short="urchins", group="urchins", conf=2,
         lb=[URCHIN_LB] * 6, meat=URCHIN_ROE, kcal=544,
         source="DMR dive survey, 2024–25: about 14 million lb (11–18 million) on rocky bottom down to 15 m. Roe is counted at about 8% of the weight in December–April and 4.5% in May–November; it runs 3–12% by site, so a season could hold 190 million to 1.1 billion calories"),
    # No count in the bay: kept, with no numbers, rather than guessed.
    # Sea cucumbers: DMR divers (0-15 m) find 0.02-0.1 per sq m in Region 9, which gives about 1 million lb
    # (0.4-2.2) in shallow water. Most live in deep, fast channels (20-100 m) that no one has counted here.
    dict(id="cucumbers", name="Sea cucumbers", short="sea cucumbers", group="urchins", conf=1, lb=NONE, meat=None, kcal=160,
         source="At least about 1 million lb in shallow water; the main beds are deeper and uncounted"),
    # Whelks: DMR has never surveyed them; Maine landed about 6,157 lb in 2019, mostly lobster bycatch.
    # The Canadian Passamaquoddy trawl caught whelks in 3 of 190 tows (about 0.2 kg in all).
    dict(id="whelks", name="Whelks", short="whelks", group="shellfish", conf=1, lb=NONE, meat=None, kcal=330,
         source="No count in the bay. DMR has never surveyed whelks, and the Canadian trawl next door caught them in only 3 of 190 tows"),
    # Pollock: the net survey caught 43 in 2011-13 (June 12, August 17, September 14). Scaled like the
    # other survey fish at the trawl's 2-5 oz a fish, that's about 2,000-5,000 lb, under 1 million
    # calories a season. The Canadian trawl caught 13 in 184 summer and fall tows, about 40-240 lb:
    # 15-100x lower. Too far apart to score, so pollock stays blank.
    dict(id="pollock", name="Pollock", short="pollock", group="fish", conf=1, lb=NONE, meat=None, kcal=417,
         source="Few and mostly young: the net survey suggests a few thousand pounds in summer and fall; the trawl next door found far fewer"),
    dict(id="elvers", name="Elvers (baby eels)", short="elvers", group="fish", conf=1, lb=NONE, meat=None, kcal=680,
         source="No count in the bay. Small in any case: Maine's whole yearly catch limit is 9,688 lb"),
]


def meat_of(s, b):
    return s["meat"][b] if isinstance(s["meat"], list) else s["meat"]


def kcal_of(s):
    return [None if v is None else v * meat_of(s, b) * s["kcal"] for b, v in enumerate(s["lb"])]


def write_js(path):
    out = ["// Cobscook Bay: how much food is in the bay in each two-month season.",
           "// Generated by tools/fishing_model.py. Don't edit by hand: change the model and run",
           "//   python3 tools/fishing_model.py   from long-term/.",
           "//",
           "// Every number is the whole amount in the bay in that season, before anyone fishes.",
           "// No cutoffs and no fishing method yet. For species that stay all year, each season",
           "// assumes nothing was taken earlier, so don't add their seasons together.",
           "//",
           "// For each species, six seasons (Jan–Feb first):",
           "//   lb          pounds in the bay, live weight (scallops: meat only); null = not counted",
           "//   kcal        calories in the meat of those pounds; null = not counted",
           "//   meatShare   meat as a share of live weight (the six-season average when it changes by season)",
           "//   meatShares  only when the share changes by season (urchin roe): the six seasons",
           "//   kcalPerLb   calories in a pound of meat",
           "//   confidence  1 to 5 (see CONFIDENCE in data/fishing-notes.js)",
           "",
           'export const FISH_CHECKED = "2026-11-27";',
           "",
           f"// Calories an active adult needs in a year ({ADULT_KCAL_DAY:,} a day).",
           f"export const ADULT_KCAL_YEAR = {ADULT_KCAL_DAY * 365};",
           "",
           "export const SEASONS = " + json.dumps([{"id": s.replace("–", "").lower(), "label": s, "long": l, "days": d}
                                                    for s, l, d in zip(SEASONS, SEASON_LONG, DAYS)], ensure_ascii=False) + ";",
           "",
           "// Herring caught in Cobscook's \"low pool\", 1947–58 (NOAA SSRF 476, Tables 3 and 4): pounds a year,",
           "// and each month's % of the catch, Jan..Dec. These months set herring's seasons.",
           "export const HERRING_CATCH = " + json.dumps({"years": HERRING_YEARS, "monthPct": HERRING_MONTH_PCT, "avgUsed": HERRING_AVG_LB}) + ";",
           "",
           "export const SPECIES = ["]
    for s in SP:
        seasonal = isinstance(s["meat"], list)
        item = dict(id=s["id"], name=s["name"], short=s["short"], group=s["group"], confidence=s["conf"],
                    weight=s.get("weight", "live"),
                    meatShare=round(sum(s["meat"]) / 6, 4) if seasonal else s["meat"], kcalPerLb=s["kcal"],
                    lb=[None if v is None else round(v) for v in s["lb"]],
                    kcal=[None if v is None else int(round(v, -3)) for v in kcal_of(s)],
                    source=s["source"])
        if seasonal:
            item["meatShares"] = [round(m, 6) for m in s["meat"]]
        out.append("  " + json.dumps(item, ensure_ascii=False) + ",")
    out.append("];\n")
    with open(path, "w") as f:
        f.write("\n".join(out))


def summary():
    tot = [0.0] * 6
    for s in SP:
        for b, v in enumerate(kcal_of(s)):
            tot[b] += v or 0
    print("calories (millions):", " | ".join(f"{t / 1e6:,.0f}" for t in tot))
    print("active adults fed a year:", " | ".join(f"{t / (ADULT_KCAL_DAY * 365):,.0f}" for t in tot))


if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    target = os.path.join(here, "..", "data", "fishing.js")
    write_js(target)
    print("wrote", os.path.normpath(target), f"(net survey yardstick {F:,.0f}; trawl {TRAWL_LB_PER_KG_TOW:,.0f} lb per kg/tow)")
    summary()
