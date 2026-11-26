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
    "Houses: every single-family house the Maine MLS showed as for sale, under contract or pending in the towns around the bay, checked Nov 25–26, 2026, plus 44 Cobscook Drive, whose listing just expired unsold. Land-only lots are left out. Listings change every week, so check the listing page before you act.",
    "Pins: most come from the listing's own map point. Some sites only give the longitude to 2 decimals, so those pins can be a few hundred meters east or west of the house. Houses with a dashed pin had no map point; the pin sits at the village or road named in the details.",
    "Rings: measured across land from the shore of Cobscook Bay, using a detailed world coastline (GSHHS). The bay ends at a line from the south tip of Eastport to the Lubec shore. The coastline stops a little short of the tidal Dennys River, so Dennysville shows at the edge of the first ring even though the tide reaches it.",
    "Populations: 2020 US census and 2021 Canadian census. Edmunds and Trescott are counted together with four other townships.",
    "Solar numbers: power per kW of panels is the average for Perry, on the bay (profileSOLAR, NASA POWER data). Part lifespans are typical ranges. None of the solar listings name the panels, battery or inverter, so ask the agent.",
    "Photos: the picture in each house's details is satellite imagery of the spot (Esri). Listing photos belong to the agents; open the listing to see them.",
  ],
};
