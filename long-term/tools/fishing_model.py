"""Cobscook Bay seasonal fishing model: builds ../data/fishing.js.

Run from long-term/:  python3 tools/fishing_model.py
The same model is written up in the "Cobscook Bay seasonal fishing report" doc (Nov 26, 2026).

Every number here is either measured (M), anchored on measured data with stated
assumptions (A), or a rough order-of-magnitude guess (G). Run: python3 model.py
"""
import json, os

SEASONS = ["Jan–Feb", "Mar–Apr", "May–Jun", "Jul–Aug", "Sep–Oct", "Nov–Dec"]

# Survey yardstick: alewife run size / survey alewives caught in May-Jun per year.
RUN = 500_000 + 58_000            # Pennamaquan 2023 (~500k) + Dennys 2024 (58k+)  [M]
SURVEY_ALEWIFE_MAYJUN = (5 + 736) / 3  # survey catch per year, May+Jun          [M]
F = RUN / SURVEY_ALEWIFE_MAYJUN         # bay fish per survey fish (per bin, per year) [A, weak]

def surv(n3yrs):
    """Survey count summed over 3 years for a 2-month bin -> bay-wide count (all sizes)."""
    return n3yrs / 3 * F

# kind: 'landings' = annual harvest given (lb live or meat) spread over seasons by index
#       'resident' = same animals all year: annual harvest = h * peak stock, spread by index
#       'migrant'  = different fish pass each season: harvest = h * present that season
SP = [
  # ---------- shellfish, snails, echinoderms, crustaceans ----------
  dict(id="clams", boat=False, name="Soft-shell clams", grp="shellfish", group="Shellfish", kind="landings", idx=[80,90,100,100,100,90],
       annual_live=614_000, per_lb=14, meat=[1/4.9]*6, kcal=390, conf="A",
       trip=(420, 30), note="Lubec 403,088 lb + Perry 183,619 lb (2025) + Pembroke 27,446 lb (2024, latest public); meat = live ÷ 4.9 (DMR)"),
  dict(id="mussels", boat=False, name="Blue mussels", grp="shellfish", group="Shellfish", kind="landings", idx=[90,95,100,100,100,95],
       annual_live=100_000, per_lb=20, meat=[0.135]*6, kcal=390, conf="G",
       trip=(1000, 50), note="No Cobscook landings published; amount is a guess. Wild meat yield 13.5% (NOAA)"),
  dict(id="scallops", boat=True, name="Sea scallops", grp="shellfish", group="Shellfish", kind="landings_meat", idx=[100]*6,
       annual_meat=150_000, per_lb_meat=15, meatfac=[0.85,0.9,1.1,1.15,1.0,0.9], kcal=313, conf="A",
       trip=(120, None), trip_meat=8, note="155,000 lb meat 2004-05; DMR est. 148,860 lb harvestable 2014-15"),
  dict(id="periwinkles", boat=False, name="Periwinkles", grp="shellfish", group="Shellfish", kind="landings", idx=[85,90,100,100,100,90],
       annual_live=50_000, per_lb=100, meat=[0.15]*6, kcal=454, conf="G",
       trip=(1200, 12), note="Dominant grazer on the bay's rocks; no landings published"),
  dict(id="whelks", boat=False, name="Whelks", grp="shellfish", group="Shellfish", kind="landings", idx=[80,80,100,100,90,80],
       annual_live=10_000, per_lb=5, meat=[0.30]*6, kcal=621, conf="G",
       trip=(10, 2), note="Collected with periwinkles; no landings published"),
  dict(id="urchins", boat=True, name="Green sea urchins (roe)", grp="urchins", group="Urchins & cucumbers", kind="landings", idx=[100]*6,
       annual_live=150_000, per_lb=4, meat=[0.12,0.07,0.04,0.05,0.09,0.12], kcal=544, conf="G",
       trip=(240, 60), note="Maine total 520,530 lb (2024); Cobscook share guessed. Roe yield varies by season"),
  dict(id="cucumbers", boat=True, name="Sea cucumbers", grp="urchins", group="Urchins & cucumbers", kind="landings", idx=[100]*6,
       annual_live=100_000, per_lb=1.5, meat=[0.25]*6, kcal=227, conf="G",
       trip=(10, 15), note="Plentiful in urchin drags; no Cobscook landings published"),
  dict(id="lobster", boat=True, name="Lobster", grp="crabs", group="Lobster & crabs", kind="landings", idx=[20,15,45,85,100,60],
       annual_live=100_000, per_lb=0.8, meat=[0.25,0.25,0.23,0.18,0.20,0.24], kcal=349, conf="G",
       trip=(4, 5), note="Inside-bay catch guessed; soft-shell summer lobsters carry less meat"),
  dict(id="greencrabs", boat=False, name="Green crabs", grp="crabs", group="Lobster & crabs", kind="landings", idx=[5,15,60,100,80,30],
       annual_live=300_000, per_lb=12, meat=[0.12]*6, kcal=395, conf="G",
       trip=(300, 25), note="Invasive and very common in summer; little meat per crab"),
  # ---------- fish ----------
  dict(id="herring", boat=False, name="Atlantic herring", grp="fish", group="Fish", kind="migrant", idx=[5,11,100,59,79,18],
       peak=surv(2838+8203)*0.5, h=0.3, wt=0.06, meat=[0.6]*6, kcal=717, conf="A",
       trip=(250, 15), note="Survey: 18,086 caught, peak June. Mostly sardine-size fish"),
  dict(id="flounder", boat=False, name="Winter flounder", grp="fish", group="Fish", kind="resident", idx=[49,92,100,57,24,29],
       peak=surv(3371+2743)*0.10, h=0.3, wt=0.9, meat=[0.35]*6, kcal=318, conf="A",
       trip=(6, 5.4), note="Survey: 8,302 caught, peak May. Most caught in nets were young fish"),
  dict(id="alewives", boat=False, name="Alewives", grp="fish", group="Fish", kind="migrant", idx=[0,5,100,5,0,0],
       peak=RUN, h=0.5, wt=0.45, meat=[0.4]*6, kcal=590, conf="M",
       trip=(110, 50), note="Runs counted: ~500,000 Pennamaquan (2023), 58,000+ Dennys (2024)"),
  dict(id="smelt", boat=False, name="Rainbow smelt", grp="fish", group="Fish", kind="resident", idx=[70,100,60,19,21,50],
       peak=surv(278+186)*0.6/0.60, h=0.3, wt=0.08, meat=[0.7]*6, kcal=440, conf="A",
       trip=(50, 4), note="Survey: 567 caught, most in May; spring runs up tidal streams in April"),
  dict(id="mackerel", boat=False, name="Atlantic mackerel", grp="fish", group="Fish", kind="migrant", idx=[0,0,25,100,70,5],
       peak=500_000, h=0.3, wt=0.7, meat=[0.5]*6, kcal=930, conf="G",
       trip=(30, 21), note="Survey nets miss open-water fish; amount guessed from angler reports"),
  dict(id="pollock", boat=False, name="Pollock", grp="fish", group="Fish", kind="resident", idx=[30,30,60,90,100,60],
       peak=200_000, h=0.3, wt=0.75, meat=[0.4]*6, kcal=417, conf="G",
       trip=(10, 7.5), note="Young 'harbor pollock' around all year; amount guessed"),
  dict(id="silverhake", boat=False, name="Silver hake", grp="fish", group="Fish", kind="migrant", idx=[0,2,67,100,15,3],
       peak=surv(223+252)*0.3, h=0.3, wt=0.6, meat=[0.4]*6, kcal=408, conf="A",
       trip=(8, 4.8), note="Survey: 592 caught, June to August"),
  dict(id="whitehake", boat=False, name="White hake", grp="fish", group="Fish", kind="migrant", idx=[3,3,6,100,91,24],
       peak=surv(220+120)*0.3, h=0.3, wt=0.75, meat=[0.4]*6, kcal=408, conf="A",
       trip=(4, 3), note="Survey: 428 caught, almost all August and September"),
  dict(id="haddock", boat=False, name="Haddock", grp="fish", group="Fish", kind="migrant", idx=[0,0,0,100,59,11],
       peak=surv(248+124)*0.2, h=0.3, wt=1.0, meat=[0.4]*6, kcal=336, conf="A",
       trip=(3, 3), note="Survey: 389 caught, August and September only"),
  dict(id="sculpin", boat=False, name="Longhorn sculpin", grp="fish", group="Fish", kind="resident", idx=[100,93,85,43,14,93],
       peak=surv(254+222)*0.6/0.85, h=0.3, wt=0.6, meat=[0.25]*6, kcal=363, conf="A",
       trip=(8, 4.8), note="Survey: 578 caught, most in May; common inshore in cold months"),
  dict(id="silverside", boat=False, name="Atlantic silverside", grp="fish", group="Fish", kind="migrant", idx=[0,1,7,4,100,17],
       peak=surv(2375+1200)*0.8, h=0.3, wt=0.012, meat=[0.8]*6, kcal=454, conf="A",
       trip=(670, 8), note="Survey: 2,701 caught, most in September (a warm year, 2012)"),
  dict(id="elvers", boat=False, name="Elvers (baby eels)", grp="fish", group="Fish", kind="landings", idx=[0,60,100,0,0,0],
       annual_live=200, per_lb=2500, meat=[1.0]*6, kcal=680, conf="G",
       trip=(2500, 1), note="Licensed, quota fishery Mar 22–Jun 7; Cobscook share guessed"),
]

def season_rows():
    out = []
    for s in SP:
        idx = s["idx"]; tot_idx = sum(idx)
        counts, meats = [0.0]*6, [0.0]*6
        for b in range(6):
            share = idx[b] / tot_idx if tot_idx else 0
            if idx[b] < 10:   # too scarce to fish: left out of totals and tables
                continue
            if s["kind"] == "landings":
                live = s["annual_live"] * share
                counts[b] = live * s["per_lb"]
                meats[b] = live * s["meat"][b]
            elif s["kind"] == "landings_meat":
                m = s["annual_meat"] * share
                counts[b] = m * s["per_lb_meat"]
                meats[b] = m * s["meatfac"][b]
            elif s["kind"] == "resident":
                annual = s["h"] * s["peak"]
                counts[b] = annual * share
                meats[b] = counts[b] * s["wt"] * s["meat"][b]
            elif s["kind"] == "migrant":
                counts[b] = s["h"] * s["peak"] * idx[b] / 100
                meats[b] = counts[b] * s["wt"] * s["meat"][b]
        trip = []
        for b in range(6):
            if idx[b] < 10:
                trip.append(None); continue
            f = idx[b] / 100
            if s["kind"] == "landings_meat":
                trip.append(round(s["trip_meat"] * s["meatfac"][b] * f, 1))
            else:
                live = s["trip"][1] * f
                trip.append(round(live * s["meat"][b], 1))
        out.append(dict(name=s["name"], group=s["group"], idx=idx, conf=s["conf"], kcal=s["kcal"],
                        counts=counts, meats=meats, kcals=[m * s["kcal"] for m in meats], trip=trip, note=s["note"]))
    return out

def ranks(idx):
    order = sorted(set(idx), reverse=True)
    return [order.index(v) + 1 for v in idx]

DAYS = [59, 61, 61, 62, 61, 61]
SEASON_LONG = ["January–February", "March–April", "May–June", "July–August", "September–October", "November–December"]

def write_js(path):
    rows = season_rows()
    by_name = {s["name"]: s for s in SP}
    out = ["// Cobscook Bay fishing numbers, by two-month season.",
           "// Generated by tools/fishing_model.py on the model in the report doc. Don't edit by hand:",
           "// change the model and run  python3 tools/fishing_model.py  from long-term/.",
           "//",
           "// For each species and season (Jan–Feb first):",
           "//   index     % of the species' own best season (abundance, 100 = best)",
           "//   count     animals the bay could give that season without running the stock down",
           "//   meat      pounds of meat in that harvest (no shell, bones, head or guts)",
           "//   kcal      calories in that meat",
           "//   tripMeat  pounds of meat one person can bring home from one outing (null = not worth a trip)",
           "//   basis     M measured, A built from measured data plus assumptions, G rough guess",
           "",
           'export const FISH_CHECKED = "2026-11-26";',
           "",
           "export const SEASONS = " + json.dumps([{"id": s.replace("–", "").lower(), "label": s, "long": l, "days": d}
                                                    for s, l, d in zip(SEASONS, SEASON_LONG, DAYS)], ensure_ascii=False) + ";",
           "",
           "export const SPECIES = ["]
    for r in rows:
        s = by_name[r["name"]]
        item = dict(id=s["id"], name=r["name"], group=s["grp"], basis=r["conf"], boat=s["boat"], kcalPerLb=r["kcal"],
                    index=r["idx"], count=[round(v) for v in r["counts"]], meat=[round(v) for v in r["meats"]],
                    kcal=[int(round(v, -3)) for v in r["kcals"]], tripMeat=r["trip"])
        out.append("  " + json.dumps(item, ensure_ascii=False) + ",")
    out.append("];\n")
    open(path, "w").write("\n".join(out))

if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    target = os.path.join(here, "..", "data", "fishing.js")
    write_js(target)
    print("wrote", os.path.normpath(target), f"(yardstick {F:,.0f})")
