// Long Term plan: page words. Keep facts, amounts, prices and links in data/, and the code that draws
// them in ../app.js and ../js/, the same way the Short Term plan keeps short-term/js/data.js.

export const PAGE = {
  heading: "Cobscook Bay map",
  intro: "Pick how far from the bay you want to look. Every house for sale within 10 miles is on the map; tap one for details, or show only the off-grid solar ones.",
  ringsLabel: "Distance from the bay",
  ringsHint: "Tap more than one to compare. Each gets its own color.",
  powerLabel: "Houses to show",
  listHeading: "Houses for sale",
  notesHeading: "About this map",
  notes: [
    "Houses: every single-family house the Maine MLS shows as for sale, under contract or pending in the towns around the bay, plus 44 Cobscook Drive, whose listing expired unsold. Land-only lots are left out. The list is checked every Sunday: sold, withdrawn and expired listings come off, new ones go on, and listings from the last 14 days get a New badge. Check the listing page before you act.",
    "Pins: most come from the listing's own map point. Some sites only give the longitude to 2 decimals, so those pins can be a few hundred meters east or west of the house. Houses with a dashed pin had no map point; the pin sits at the village or road named in the details.",
    "Rings: straight-line distance from the shore of Cobscook Bay, over land and water, using a detailed world coastline (GSHHS). The bay ends at a line from the south tip of Eastport to the Lubec shore. The coastline stops a little short of the tidal Dennys River, so Dennysville shows at the edge of the first ring even though the tide reaches it.",
    "Populations: 2020 US census and 2021 Canadian census. Edmunds and Trescott are counted together with four other townships.",
    "Solar numbers: power per kW of panels is the average for Perry, on the bay (profileSOLAR, NASA POWER data). Part lifespans are typical ranges. None of the solar listings name the panels, battery or inverter, so ask the agent.",
    "Photos: the picture in each house's details is satellite imagery of the spot (Esri). Listing photos belong to the agents; open the listing to see them.",
    "Currents and flats: NOAA's WebGNOME model of Passamaquoddy and Cobscook Bays (Bedford Institute of Oceanography): 12 snapshots through an average tide, on a grid about 100 to 200 m apart. It matches NOAA's measured current at Estes Head, Eastport (2.3 knots). It misses small rips and eddies, chop when the wind blows against the tide, and probably the very fastest water in the Falls. Spring tides run about 15% faster. Times are hours from high or low tide at Eastport, so use an Eastport tide table.",
  ],
};

// The Tidal currents control on the map, and the currents section of the paper copy.
export const CURRENTS = {
  label: "Tidal currents",
  modes: [["off", "Off"], ["peak", "Strongest"], ["hour", "By hour of the tide"]],
  tideLabel: "Hour of the tide",
  flatsLabel: "Flats that dry at low tide",
  hint: "From NOAA's tidal model of the bay, on an average tide; spring tides run about 15% faster. Tap the water to see the speed there.",
  loading: "Loading the currents…",
  failed: "The currents didn't load. Check your connection and try again.",
  reportHeading: "Tidal currents and flats",
  reportIntro: "Colors show the strongest current on an average tide, from NOAA's tidal model of the bay. Sand marks flats that dry at low tide. A loaded rowboat or canoe makes roughly 2 to 3 knots, so the inner bays are workable at any time, but cross the main channel and pass the Falls only near slack water.",
  // Places in the table, in this order. Names must match WATER_NAMES and SPOTS in places.js.
  reportAreas: [
    "Dennys Bay", "Edmunds shore: your home zone", "Dennysville: your fishing base", "Whiting Bay", "Straight Bay",
    "South Bay", "East Bay", "Pennamaquan River", "Sipp Bay", "Johnson Bay", "Cobscook Bay", "Broad Cove",
    "Reversing Falls (Cobscook Falls)", "Lubec Narrows",
  ],
};
