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

# Net survey yardstick (Vieser and others 2018): bay fish per survey fish, from the counted alewife run.
RUN = 500_000 + 58_000                   # Pennamaquan 2023 (~500,000) + Dennys 2024 (58,000+)
SURVEY_ALEWIFE_MAYJUN = (5 + 736) / 3    # alewives the survey caught a year in May-June
F = RUN / SURVEY_ALEWIFE_MAYJUN          # about 2,259


def surv(n3yrs):
    """Survey catch summed over 3 years for a season -> fish in the bay."""
    return n3yrs / 3 * F


# Canadian Passamaquoddy trawl (DFO, 190 tows 2009-2019): kg per tow -> lb in Cobscook,
# assuming an 8 m net width, a 1.41 km tow, and 70 sq km below low tide. A minimum.
TRAWL_LB_PER_KG_TOW = 70 / (1.41 * 0.008) * 2.2046

# Herring caught in Cobscook's "low pool", 1947-58 (NOAA SSRF 476, Tables 3 and 4).
HERRING_YEARS = [[1947, 49_000], [1948, 5_043_325], [1949, 1_342_600], [1950, 1_455_300],
                 [1951, 4_778_725], [1952, 2_940_000], [1953, 6_289_150], [1954, 6_368_775],
                 [1955, 2_136_400], [1956, 755_825], [1957, 2_026_150], [1958, 1_343_825]]
HERRING_MONTH_PCT = [0, 0, 0, 0, 0.1, 5.5, 6.7, 13.8, 30.1, 36.2, 6.9, 0.7]  # Jan..Dec
HERRING_SEASON = [HERRING_MONTH_PCT[i] + HERRING_MONTH_PCT[i + 1] for i in range(0, 12, 2)]
HERRING_AVG_LB = 900_000  # middle of three methods: model 1.6M, sonar 0.45M, 1950s catch x weirs 0.43-2.2M
SHELLFISH_AVG_LB = 1_600_000  # clams, mussels and other shellfish: the least the clam harvest needs (see below)


def from_avg(avg, idx):
    mean = sum(idx) / 6
    return [avg * i / mean for i in idx]


def from_peak(peak, idx):
    return [peak * i / 100 for i in idx]


def add(*lists):
    return [sum(v) for v in zip(*lists)]


NONE = [None] * 6

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
    dict(id="periwinkles", name="Periwinkles", short="periwinkles", group="shellfish", conf=3,
         lb=from_avg(6666 * MODEL_LB, [85, 90, 100, 100, 100, 90]), meat=0.16, kcal=395,
         source="Bay food-web model (from a Cobscook rockweed study)"),
    # Yearly average: the least the clam harvest needs. Lubec, Perry, Pembroke and Whiting land about
    # 510,000 lb of legal clams a year (DMR, 2020-24); in the food-web model shellfish add 0.7 of their
    # weight a year and other animals eat 46% of that, so supplying both takes 510,000 / (0.7 x 0.54),
    # about 1.4-1.6 million lb. The model itself gives 3,766 kg per sq km (0.87 million lb) in one table
    # and 11,000 (2.5 million lb) in another; 1.6 million is within 2x of both.
    dict(id="shellfish", name="Clams, mussels and other shellfish", short="clams and mussels", group="shellfish", conf=3,
         lb=from_avg(SHELLFISH_AVG_LB, [80, 90, 100, 100, 100, 90]), meat=0.2, kcal=390,
         source="The least today's clam harvest needs (1.6 million lb a year on average); the food-web model gives 0.87–2.5 million"),
    dict(id="scallops", name="Sea scallops", short="scallops", group="shellfish", conf=3, weight="meat",
         lb=[148_860] * 6, meat=1.0, kcal=313,
         source="State survey, 2014–15: harvestable meat"),
    dict(id="alewives", name="Alewives", short="alewives", group="fish", conf=4,
         lb=from_peak(RUN * 0.45, [0, 5, 100, 5, 0, 0]), meat=0.4, kcal=470,
         source="Run counts: Pennamaquan about 500,000 (2023), Dennys 58,000+ (2024)"),
    # May-December from the net survey. January-April are 0: adult winter flounder were rare or absent
    # in Passamaquoddy Bay in winter and seldom present below 6 C (43 F) (MacDonald and others 1984);
    # Eastport's water averages 37-41 F in January-April (NWS).
    dict(id="flounder", name="Flounders", short="flounder", group="fish", conf=3,
         lb=from_peak(surv(3371 + 2743) * 0.10 * 0.9, [0, 0, 100, 57, 24, 29]), meat=0.35, kcal=318,
         source="Net survey, scaled up; the Canadian trawl agrees in Sep–Oct. Adults leave when the water is under 43°F (Jan–Apr)"),
    dict(id="codfamily", name="Cod family: hakes and haddock", short="cod family", group="fish", conf=3,
         # food-size fish at the peak, rounded to the nearest 1,000 as in the doc, x pounds per fish
         lb=add(from_peak(round(surv(223 + 252) * 0.3, -3) * 0.6, [0, 2, 67, 100, 15, 3]),     # silver hake
                from_peak(round(surv(220 + 120) * 0.3, -3) * 0.75, [3, 3, 6, 100, 91, 24]),   # white hake
                from_peak(round(surv(248 + 124) * 0.2, -3) * 1.0, [0, 0, 0, 100, 59, 11])),   # haddock
         meat=0.4, kcal=400,
         source="Net survey, scaled up; agrees with the Canadian trawl within 1–4 times"),
    dict(id="greencrabs", name="Green crabs", short="green crabs", group="crabs", conf=2,
         lb=from_avg(1333 * MODEL_LB, [5, 15, 60, 100, 80, 30]), meat=0.12, kcal=340,
         source="Bay food-web model (from southern Maine data)"),
    dict(id="lobster", name="Lobster", short="lobster", group="crabs", conf=2,
         lb=[None, None, None, 14.69 * TRAWL_LB_PER_KG_TOW, 25.19 * TRAWL_LB_PER_KG_TOW, None], meat=0.2, kcal=349,
         source="Canadian trawl, July–October only; a minimum"),
    dict(id="sculpin", name="Longhorn sculpin", short="sculpin", group="fish", conf=2,
         lb=from_peak(surv(254 + 222) * 0.6 / 0.85 * 0.6, [100, 93, 85, 43, 14, 93]), meat=0.25, kcal=363,
         source="Net survey, scaled up; the Canadian trawl found 1–5 times less"),
    dict(id="smelt", name="Rainbow smelt", short="smelt", group="fish", conf=2,
         lb=from_peak(surv(278 + 186) * 0.08, [70, 100, 60, 19, 21, 50]), meat=0.7, kcal=440,
         source="Net survey, scaled up; agrees with the Canadian trawl"),
    dict(id="silverside", name="Atlantic silverside", short="silverside", group="fish", conf=2,
         lb=from_peak(surv(2375 + 1200) * 0.8 * 0.012, [0, 1, 7, 4, 100, 17]), meat=0.8, kcal=454,
         source="Net survey, scaled up"),
    # No count in the bay: kept, with no numbers, rather than guessed.
    dict(id="urchins", name="Green sea urchins", short="urchins", group="urchins", conf=1, lb=NONE, meat=None, kcal=544,
         source="No count in the bay. Maine landed 520,530 lb in 2024; the 2025 dive survey has no Cobscook numbers"),
    dict(id="cucumbers", name="Sea cucumbers", short="sea cucumbers", group="urchins", conf=1, lb=NONE, meat=None, kcal=160,
         source="No count in the bay. Maine's main beds are in Frenchman and Narraguagus Bays"),
    dict(id="whelks", name="Whelks", short="whelks", group="shellfish", conf=1, lb=NONE, meat=None, kcal=330,
         source="No count in the bay"),
    dict(id="pollock", name="Pollock", short="pollock", group="fish", conf=1, lb=NONE, meat=None, kcal=417,
         source="No count in the bay"),
    dict(id="elvers", name="Elvers (baby eels)", short="elvers", group="fish", conf=1, lb=NONE, meat=None, kcal=680,
         source="No count in the bay"),
]


def kcal_of(s):
    return [None if v is None else v * s["meat"] * s["kcal"] for v in s["lb"]]


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
           "//   meatShare   meat as a share of live weight",
           "//   kcalPerLb   calories in a pound of meat",
           "//   confidence  1 to 5 (see CONFIDENCE in data/fishing-notes.js)",
           "",
           'export const FISH_CHECKED = "2026-11-26";',
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
        item = dict(id=s["id"], name=s["name"], short=s["short"], group=s["group"], confidence=s["conf"],
                    weight=s.get("weight", "live"), meatShare=s["meat"], kcalPerLb=s["kcal"],
                    lb=[None if v is None else round(v) for v in s["lb"]],
                    kcal=[None if v is None else int(round(v, -3)) for v in kcal_of(s)],
                    source=s["source"])
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
